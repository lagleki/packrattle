var pr = require("./lib");

/*
const p = pr.chain(
  pr.alt("12","123"),
  pr.alt("3abc","abc"),
  (a, b) => a + "|" +  b
);
*/

const p = pr.chain(
  pr.alt("1","2"),
  pr.alt("1","2"),
  (a, b) => {
    if(a===b) {return pr.reject;}
    else{return a+"-"+b;}
  }
);

console.log(
  p.run("11").join("\n")
  );


/*
text = expr:(any_word*) {return _node_int(expr);}
any_word = expr:(jbovla) {return expr;}
jbovla = pause_0 / cmevla / expr:(cmavo) {return ["cmavo", _join(expr)];} / expr:(gismu) {return ["gismu", _join(expr)];} / expr:(!gismu !fuhivla !cmavo !(ini_vwl h y onset) lujvo_core) {return ["lujvo", _join(expr)];} / expr:(fuhivla) {return ["fu'ivla", _join(expr)];}

cmevla = expr:((&zifcme any_syllable+ &pause) / zifcme) {return ["cmevla", _join(expr)];}
gismu = long_rafsi &stress &final_syllable pa_zei_karsna &post_word
fuhivla_trim = fuhivla_head slaka &stress consonantal_syllable* 
fuhivla = fuhivla_trim final_syllable
cmavo = !cmevla !(CVC !stress y h? lujvo_core / CVC &stress y short_final_rafsi) (!h !(zunsna zunsna+) onset (nucleus h)* nucleus / y+) &post_word

lujvo_core = ( expr:(hy_rafsi / fuhivla_rafsi / y_rafsi / !any_fuhivla_rafsi y_less_rafsi !any_fuhivla_rafsi) {return [_join(expr),"-"];} )* (expr:(fuhivla / gismu_CVV_final_rafsi) {return [_join(expr)];} / (expi:((stressed_hy_rafsi / stressed_fuhivla_rafsi / stressed_y_rafsi / CVC_CCV_CVV &stress)) exp:(short_final_rafsi) {return [_join(expi),"-",_join(exp)];}) )

any_fuhivla_rafsi = fuhivla / fuhivla_rafsi / stressed_fuhivla_rafsi
rafsi_string = y_less_rafsi* (gismu_CVV_final_rafsi / CVC_CCV_CVV &stress !y short_final_rafsi / y_rafsi / stressed_y_rafsi / (CVC_CCV_CVV &stress !y)? initial_pair y / hy_rafsi / stressed_hy_rafsi)

fuhivla_head = !rafsi_string !cmavo !(!rafsi_string zunsna rafsi_string) !h &onset unstressed_syllable*
zifcme = !h (nucleus / glaide / h / zunsna !pause)* zunsna &pause

stressed_fuhivla_rafsi = exp:(fuhivla_trim) h y {return [_join(exp),""];} / expr:(fuhivla_trim onset) y {return [_join(expr),""];}
fuhivla_rafsi = expr:(&unstressed_syllable fuhivla_head onset) y h? {return [_join(expr),""];}

stressed_y_rafsi = expr:(long_rafsi / CVC) &stress y {return [_join(expr),""];}
y_rafsi = expr:(long_rafsi / CVC ) !stress y h? {return [_join(expr),""];}

y_less_rafsi = !y_rafsi !stressed_y_rafsi !hy_rafsi !stressed_hy_rafsi CVC_CCV_CVV !stress !y !h

stressed_hy_rafsi = expr:((long_rafsi pa_zei_karsna / CVC_CCV_CVV )) &stress h y {return [_join(expr),""];}
hy_rafsi = expr:(long_rafsi pa_zei_karsna / CVC_CCV_CVV ) !stress h y h? {return [_join(expr),""];}

CVC = CV zunsna
CVC_CCV = CVC / ini_vwl
ini_vwl = initial_pair pa_zei_karsna

CVC_CCV_CVV = CVC_CCV / CVVr
CVVr = exp:(zunsna (pa_zei_karsna !stress h pa_zei_karsna / re_zei_karsna)) (r &zunsna / n &r)? {return [_join(exp),""];}
gismu_CVV_final_rafsi = gismu / CV &stress h &final_syllable pa_zei_karsna &post_word
short_final_rafsi = &final_syllable (zunsna re_zei_karsna / ini_vwl) &post_word

unstressed_syllable = slaka !stress / consonantal_syllable

long_rafsi = CVC_CCV zunsna

CV = zunsna pa_zei_karsna

final_syllable = onset !y nucleus !cmevla &post_word
stress = (zunsna / glaide)* h? y? slaka pause
any_syllable = !(onset y) slaka / consonantal_syllable
slaka = onset !y nucleus coda?
consonantal_syllable = zunsna &syllabic coda

coda = !any_syllable zunsna &any_syllable / syllabic? zunsna? &pause
onset = h / glaide / (affricate / (cs !x / jz !(n / l / r))? (pfbgvkx / (t / d / n !r) !l / m)? (l / r)?) !zunsna !glaide
nucleus = pa_zei_karsna / re_zei_karsna / y !nucleus
glaide = (ɩ / w) &nucleus !glaide
re_zei_karsna = ([a] w !u / [aeo] ɩ !i) !nucleus
pa_zei_karsna = [aeiou] !nucleus

i = [i]
u = [u]
y = [y] !(!y nucleus)

ɩ = [iɩ]
w = [uw] {return ["u",""]}

initial_pair = &onset zunsna zunsna !zunsna

affricate = t cs / d jz

zunsna = pfbgvkx / d / jz / cs / t / syllabic

syllabic = l / m / n / r

l = [l] !glaide
m = [m] !glaide
n = [n] !glaide !affricate
r = [r] !glaide
pfbgvkx = [pfbgvkx] !glaide
d = [d] !glaide
jz = [jz] !glaide
cs = [cs] !glaide
x = [x] !glaide
t = [t] !glaide
h = [,'] &nucleus

post_word = pause / !nucleus jbovla / [\}]

pause = pause_0 / !.

pause_0 = expr:([^a-zA-Z,']+) {return ["space", _join(expr)];}

nul = [^ ]+
*/