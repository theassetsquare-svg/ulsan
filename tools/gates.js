/** 배포 전 게이트: G9+ / G10 / G13 / G14 / G15 / G16 */
const fs=require('fs'),path=require('path');
const sharp=require('sharp');
const ROOT=path.resolve(__dirname,'..');process.chdir(ROOT);
const BASE='https://ulsane.pages.dev';
function walk(d,out=[]){for(const e of fs.readdirSync(d,{withFileTypes:true})){if(e.name==='node_modules'||e.name.startsWith('.'))continue;const p=path.join(d,e.name);if(e.isDirectory())walk(p,out);else if(e.name.endsWith('.html'))out.push(path.relative(ROOT,p));}return out;}
const man=JSON.parse(fs.readFileSync('og/manifest.json','utf8'));
const byFile=Object.fromEntries(man.이미지.map(i=>[i.파일명,i]));
const PHONES={'010-5653-0069':'울산챔피언나이트','010-7528-4936':'창원룰루랄라나이트','010-2221-1937':'불광동호박나이트','010-5655-4866':'청담나이트'};
const OWNER={ // 각 번호가 허용되는 페이지
 '010-5653-0069':['night/ulsan-champion-night/index.html','access.html','atmosphere.html','contact.html','faq.html','first-visit.html','review.html','story.html','policy/index.html'],
 '010-7528-4936':['night/changwon-lululala-night/index.html'],
 '010-2221-1937':['night/bulgwang-hobak/index.html','bulgwang-guide.html'],
 '010-5655-4866':['night/cheongdam-night/index.html'],
};
const VENUES=man.이미지.map(i=>i.가게이름).filter(n=>n!=='(허브·중립)');
// 지역 키워드(업소명 아님) — 오염 판정에서 제외
const REGION=new Set(['울산나이트','부산나이트','강남나이트','일산나이트','신림나이트','상봉동나이트','수유나이트','수원나이트','안산나이트','창원나이트','대전나이트','유천동나이트','은평나이트']);
const VENUE_NAMES=[...new Set(VENUES.filter(n=>!REGION.has(n)))];
const HUB='night/index.html', HOME='index.html';
const fail=[],pass=[];
const rowOf=(img,role)=>img.그려진텍스트.find(t=>t.역할===role);
(async()=>{
const pages=walk('.').sort();
for(const rel of pages){
  const h=fs.readFileSync(rel,'utf8');
  const g=re=>(h.match(re)||[])[1]||'';
  const og=g(/property="og:image" content="([^"]*)"/);
  const file=og.replace(BASE,'');
  // ---- 메타 9종 (홈 포함 전 페이지) ----
  const meta9=[['og:image',!!og],['og:image:secure_url',/og:image:secure_url" content="[^"]+"/.test(h)],
   ['og:image:width=1200',g(/og:image:width" content="([^"]*)"/)==='1200'],
   ['og:image:height=1200',g(/og:image:height" content="([^"]*)"/)==='1200'],
   ['og:image:type=image/png',g(/og:image:type" content="([^"]*)"/)==='image/png'],
   ['og:image:alt',!!g(/property="og:image:alt" content="([^"]*)"/)],
   ['twitter:card=summary',g(/name="twitter:card" content="([^"]*)"/)==='summary'],
   ['twitter:image',!!g(/name="twitter:image" content="([^"]*)"/)],
   ['thumbnail',!!g(/name="thumbnail" content="([^"]*)"/)]];
  for(const [k,ok] of meta9) if(!ok) fail.push(['G9+ 메타9종',rel,k+' 없음/불일치']);
  // 중복 금지
  for(const k of ['og:image','og:image:secure_url','og:image:width','og:image:height','og:image:type','og:image:alt']){
    const n=(h.match(new RegExp('property="'+k+'"','g'))||[]).length; if(n>1)fail.push(['G9+ 메타중복',rel,k+' x'+n]);
  }
  if(rel===HOME){ // 홈은 메타만 검사 + G16①
    const imgs=(h.match(/<img\b/g)||[]).length;
    const bg=(h.match(/background(?:-image)?\s*:[^;"']*url\(/g)||[]).length;
    if(imgs||bg)fail.push(['G16① 홈 이미지',rel,`<img> ${imgs}개 / background url ${bg}개`]); else pass.push('G16① 홈 화면 이미지 0');
    continue;
  }
  // ---- ① 본문 img 존재 ② og:image = 본문 img ⑥ alt ----
  const im=(h.match(/<img\b[^>]*>/)||[])[0];
  if(!im){fail.push(['G9+① 본문img',rel,'없음']);continue;}
  const src=(im.match(/src="([^"]*)"/)||[])[1];
  const alt=(im.match(/alt="([^"]*)"/)||[])[1]||'';
  if(src!==file)fail.push(['G9+② og=본문img',rel,`본문 ${src} ≠ og ${file}`]);
  const info=byFile[file];
  if(!info){fail.push(['G14 manifest',rel,file+' manifest 없음']);continue;}
  if(info.가게이름!=='(허브·중립)'&&!alt.includes(info.가게이름))fail.push(['G9+⑥ alt 가게이름',rel,alt]);
  // ---- ④ 1200x1200 ⑤ 300KB ----
  const st=fs.statSync(file.replace(/^\//,''));
  const md=await sharp(file.replace(/^\//,'')).metadata();
  if(md.width!==1200||md.height!==1200)fail.push(['G9+④ 1200x1200',rel,md.width+'x'+md.height]);
  if(st.size>300*1024)fail.push(['G9+⑤ 300KB',rel,(st.size/1024).toFixed(1)+'KB']);
  // ---- G10 번호 위치 ----
  const found=[...new Set(h.match(/010-\d{3,4}-\d{4}/g)||[])];
  if(found.length>1)fail.push(['G10 한 페이지 2개 이상 번호',rel,found.join(', ')]);
  for(const p of found){
    if(!PHONES[p]){fail.push(['G10 미등록 010 패턴',rel,p]);continue;}
    if(!OWNER[p].includes(rel))fail.push(['G10 타 광고주 번호',rel,`${p} (${PHONES[p]} 전용)`]);
  }
  // ---- G13 가게이름 오염 (앵커 텍스트·허브 예외) ----
  const mine=info.가게이름;
  const stripped=h.replace(/<a\b[^>]*>[\s\S]*?<\/a>/g,'<a></a>');
  if(rel!==HUB){
    for(const v of VENUE_NAMES){
      if(v===mine)continue;
      if(mine&&(v.includes(mine)||mine.includes(v)))continue;
      if(mine==='인천아라비안나이트'&&v==='인천아라비아')continue;
      const c=(stripped.match(new RegExp(v,'g'))||[]).length;
      if(c)fail.push(['G13 가게이름 오염',rel,`${v} x${c}`]);
    }
    // alt·캡션·파일명은 예외 없음
    for(const v of VENUE_NAMES){ if(v===mine||(mine&&(v.includes(mine)||mine.includes(v))))continue;
      if(alt.includes(v))fail.push(['G13 alt 오염',rel,v]); }
  }
  // ---- G14 썸네일 텍스트 오염 (manifest 기준) ----
  const drawn=info.그려진텍스트.map(t=>t.텍스트).join(' ');
  for(const v of VENUE_NAMES){ if(v===mine||(mine&&(v.includes(mine)||mine.includes(v))))continue;
    if(drawn.includes(v))fail.push(['G14 썸네일 가게이름 오염',rel,v]); }
  for(const p of Object.keys(PHONES)) if(drawn.includes(p)&&!OWNER[p].includes(rel))fail.push(['G14 썸네일 타 번호',rel,p]);
  for(const [p,st2] of Object.entries(PHONES)){const nick={'010-5653-0069':'춘자','010-7528-4936':'로또','010-2221-1937':'손흥민','010-5655-4866':'펩시맨'}[p];
    if(drawn.includes(nick)&&!OWNER[p].includes(rel))fail.push(['G14 썸네일 타 닉네임',rel,nick]);}
  // ---- G15 크기 ----
  const heights=info.그려진텍스트.map(t=>t.실측높이px);
  const maxH=Math.max(...heights);
  if(info.규칙.startsWith('(A)')){
    const ph=rowOf(info,'전화번호');
    if(!ph||ph.실측폭px<972)fail.push(['G15 전화번호 폭<972',rel,ph?ph.실측폭px:'없음']);
    else if(ph.실측높이px<maxH)fail.push(['G15 전화번호 최대높이 아님',rel,`${ph.실측높이px} < ${maxH}`]);
    const nk=rowOf(info,'닉네임');
    if(!nk||nk.실측높이px<170)fail.push(['(A)2행 닉네임 높이<170',rel,nk?nk.실측높이px:'없음']);
  } else {
    const ad=rowOf(info,'광고문의');
    if(!ad||ad.실측높이px<240)fail.push(['G15 광고문의 높이<240',rel,ad?ad.실측높이px:'없음']);
    else if(ad.실측높이px<maxH)fail.push(['G15 광고문의 최대높이 아님',rel,`${ad.실측높이px} < ${maxH}`]);
    const kk=rowOf(info,'카카오톡 besta12');
    if(!kk||kk.실측높이px<120)fail.push(['(B)3행 카카오톡 높이<120',rel,kk?kk.실측높이px:'없음']);
  }
  // ---- G16 ②홈 링크 ③BreadcrumbList 홈 ----
  const hl=[...h.matchAll(/<a\b[^>]*href="(\/|\.\/|index\.html|\/index\.html|https:\/\/ulsane\.pages\.dev\/|https:\/\/ulsane\.pages\.dev\/index\.html)"/g)];
  if(hl.length)fail.push(['G16② 홈 링크 잔존',rel,hl.length+'건']);
  for(const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)){
    let o;try{o=JSON.parse(m[1])}catch(e){fail.push(['JSON-LD 파싱실패',rel,e.message]);continue;}
    const s=JSON.stringify(o);
    if(/"BreadcrumbList"/.test(s)&&/"name":"홈"/.test(s.replace(/\s/g,'')))fail.push(['G16③ BreadcrumbList 홈 항목',rel,'존재']);
  }
}
// robots.txt (10)
const rb=fs.readFileSync('robots.txt','utf8');
if(/Disallow:\s*\S/.test(rb))fail.push(['G10-robots','robots.txt','Disallow 존재']);
if(/noimageindex/i.test(rb))fail.push(['G10-robots','robots.txt','noimageindex 존재']);
const sm=fs.readFileSync('sitemap.xml','utf8');
if(!sm.includes('<loc>https://ulsane.pages.dev/</loc>'))fail.push(['sitemap','sitemap.xml','홈 누락']);
console.log(fail.length?'❌ 실패 '+fail.length+'건':'✅ 전 게이트 통과');
const grp={};fail.forEach(f=>{(grp[f[0]]=grp[f[0]]||[]).push(f[1]+' :: '+f[2])});
for(const k in grp){console.log('\n['+k+'] '+grp[k].length+'건');grp[k].slice(0,25).forEach(x=>console.log('   '+x));}
})();
