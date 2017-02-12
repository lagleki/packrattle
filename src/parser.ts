import { chain } from "./combiners";
import { Engine, EngineOptions } from "./engine";
import { mapMatch, Match, Matcher, MatchFailure, MatchResult, MatchSuccess, schedule, Sequence, Span } from "./matcher";
import { simple } from "./simple";
import { quote } from "./strings";

export type LazyParser1<A> = string | RegExp | Parser<A, any>;
export type LazyParser2<A> = LazyParser1<A> | Array<LazyParser1<A>>;
export type LazyParser<A> = LazyParser2<A> | (() => LazyParser2<A>);

export class ParseError extends Error {
  name = "ParseError";

  constructor(public message: string, public span: Span) {
    super(message);
  }
}

export interface ParserOptions<A> {
  // list of nested parsers, if this is a combining parser:
  children?: LazyParser<A>[];

  // for debugging, how to produce a description of this parser (like
  // "x or y or z"):
  describe?: (children: string[]) => string;

  // is this parser stateless? exactly the same as any other porser with the
  // same name and children? packrattle will replace all duplicates with
  // references to a single object, using the description as a cache key.
  cacheable?: boolean;
}

function defaultDescribe(name: string): (children: string[]) => string {
  return (children: string[]) => {
    if (children.length == 0) return name;
    return name + ":" + children.join(",");
  };
}

let ParserId = 1;

// private cache of generated parsers:
const __cache: { [key: string]: Parser<any, any> } = {};

/*
 * a Parser that's created by one of the top-level functions. it tries to
 * match a Sequence<A> and generate an Out.
 *
 * after being resolved, it can be converted into a ResolvedParser, which is
 * smaller and has all its dependent links resolved.
 */
export class Parser<A, Out> {
  readonly id: number;

  // actual children, once we've resolved them
  children: Parser<A, any>[];

  // actual matcher, once we've resolved children
  matcher: Matcher<A, Out>;

  // cache description once we've computed it
  description: string;

  // if this parser is cacheable, this is its unique key:
  private cacheKey: string;

  // detect and avoid loops when displaying debug strings:
  private recursing = false;


  /*
   * - name: type of parser, in one word ("alt", "optional", ...)
   * - options: see above
   * - matcher: function to create a Matcher out of the resolved children,
   *     once we know them
   */
  constructor(
    public readonly name: string,
    public readonly options: ParserOptions<A>,
    public readonly generateMatcher: (children: Parser<A, any>[]) => Matcher<A, Out>
  ) {
    this.id = ParserId++;
  }

  toString(): string {
    return `Parser[${this.id}, ${this.name}]`;
  }

  inspect(): string {
    return this.description ? `Parser[${this.id}, ${this.description}]` : `(unresolved ${this.id})`;
  }

  // fill in children, description, cacheKey. cache if we can.
  // may return a different Parser (because an identical one is in the cache).
  resolve(functionCache: FunctionCache<A> = {}): Parser<A, Out> {
    if (this.cacheKey) return __cache[this.cacheKey];
    if (this.children) return this;

    try {
      this.children = (this.options.children || []).map(p => unlazy(p, functionCache));
      this.children = this.children.map(p => p.resolve(functionCache));
    } catch (error) {
      error.message += " (inside " + this.name + ")";
      throw error;
    }

    this.getDescription();

    if (this.options.cacheable) {
      if (!this.children || this.children.length == 0) {
        this.cacheKey = this.name + ":" + quote(this.description);
      } else {
        // cacheable children will all have a cache key set from the 'resolve' call above.
        const cacheable = this.children.reduce((sum, child) => sum && child.cacheKey !== undefined, true);
        if (cacheable) this.cacheKey = this.name + "(" + this.children.map(p => quote(p.cacheKey)).join(",") + ")";
      }

      if (this.cacheKey) {
        if (__cache[this.cacheKey]) return __cache[this.cacheKey];
        __cache[this.cacheKey] = this;
      }
    }

    this.matcher = this.generateMatcher(this.children);
    delete this.options;
    delete this.generateMatcher;

    return this;
  }

  // only called by resolve. recursive.
  private getDescription(): string {
    if (this.description) return this.description;
    if (this.recursing) return "...";
    this.recursing = true;
    const list = this.children.map(p => {
      return (p.children && p.children.length > 1) ? ("(" + p.getDescription() + ")") : p.getDescription();
    });
    this.recursing = false;
    this.description = (this.options.describe || defaultDescribe(this.name))(list);
    return this.description;
  }

  execute(stream: Sequence<A>, options: EngineOptions = {}): Match<Out> {
    return new Engine(stream, options).execute(this.resolve());
  }

  // return a parser that asserts that the string ends after this parser.
  consume(): Parser<A, Out> {
    return chain<A, Out, null, Out>(this, simple.end(), (a, _b) => a);
  }

  // consume an entire text with this parser. convert failure into an exception.
  run(stream: Sequence<A>, options: EngineOptions = {}): Out {
    const rv = this.consume().resolve().execute(stream, options);
    // really want 'match' statement here.
    if (rv instanceof MatchFailure) {
      throw new ParseError(rv.message, rv.span);
    } else if (rv instanceof MatchSuccess) {
      return rv.value;
    } else {
      throw new Error("impossible");
    }
  }

  // ----- transforms

  // transforms the result of a parser if it succeeds.
  // f(value, span)
  map<U>(f: U | ((item: Out, span: Span) => U)): Parser<A, U> {
    return new Parser<A, U>("map", { children: [ this ] }, children => {
      return (stream, index) => {
        return schedule<A, Out, U>(this, index, (match: Match<Out>) => {
          return mapMatch<A, Out, U>(match, (span, value) => {
            // used to be able to return a new Parser here, but i can't come up
            // with any practical use for it.
            return new MatchSuccess(span, (typeof f === "function") ? f(value, span) : f);
          });
        });
      };
    });
  }
}


const ID = "__packrattle_cache_id";
let LazyId = 0;
export type FunctionCache<A> = { [key: string]: LazyParser2<A> };

/*
 * convert a "parser-like object" into an actual Parser object.
 * - could be a lazy function that evaluates to a Parser
 * - could be a simple data type like regex that is "implicitly" a Parser
 *
 * if you'd like te cache the results of function evaluations, pass an empty object as `functionCache`.
 */
function unlazy<A>(parser: LazyParser<A>, functionCache: FunctionCache<A>): Parser<A, any> {
  if (typeof parser == "function") {
    if (!parser[ID]) {
      // give every lazy parser an id so we can cache them.
      parser[ID] = (LazyId++).toString();
    }

    const id = parser[ID];
    if (functionCache[id]) {
      parser = functionCache[id];
    } else {
      parser = parser();
      functionCache[id] = parser;
    }
  }

  // implicits:
  if (typeof parser == "string") throw new Error("unimplemented"); //return simple.string(parser);
  if (parser instanceof RegExp) throw new Error("unimplemented"); //return simple.regex(parser);
  if (Array.isArray(parser)) throw new Error("unimplemented"); //return seq(...parser);

  if (!(parser instanceof Parser)) throw new Error("Unable to resolve parser: " + parser);
  return parser;
}