const fs=require('fs'),path=require('path');
const {build,writePng}=require('./render-thumbs.js');
const ROOT=path.resolve(__dirname,'..');
process.chdir(ROOT);
const BASE='https://a.nolcool.com';
function walk(d,out=[]){for(const e of fs.readdirSync(d,{withFileTypes:true})){if(e.name==='node_modules'||e.name.startsWith('.'))continue;const p=path.join(d,e.name);if(e.isDirectory())walk(p,out);else if(e.name.endsWith('.html'))out.push(path.relative(ROOT,p).split(path.sep).join("/"));/* ★ 윈도우는 경로 구분자가 역슬래시라 그대로 쓰면 AD_PAGES 대조가 전부 어긋난다 */}return out;}

// ★ 광고주 정답표
const AD={
 '울산챔피언나이트':{nick:'춘자',phone:'010-5653-0069'},
 '창원룰루랄라나이트':{nick:'로또',phone:'010-7528-4936'},
 '불광동호박나이트':{nick:'손흥민',phone:'010-2221-1937'},
 '청담나이트':{nick:'펩시맨',phone:'010-5655-4866'},
 '답십리미라클나이트':{nick:'유재석',phone:'010-8156-6558'},
 '부산아시아드나이트':{nick:'새우깡',phone:'010-3614-1056'},
 '대전세븐나이트':{nick:'영탁',phone:'010-7770-0869'},
 '성남샴푸나이트':{nick:'이쁜이',phone:'010-3432-4758'},
 '파주야당스카이돔나이트':{nick:'딸기',phone:'010-3447-0963'},
};
// 광고주 페이지 → 주제(뱃지)
const AD_PAGES={
 'access-1.html':['울산챔피언나이트','오시는 길'],
 'atmosphere-1.html':['울산챔피언나이트','매장 분위기'],
 'bulgwang-1.html':['불광동호박나이트','예약 전 가이드'],
 'contact-1.html':['울산챔피언나이트','예약 문의'],
 'faq-1.html':['울산챔피언나이트','자주 묻는 질문'],
 'first-1.html':['울산챔피언나이트','첫 방문 가이드'],
  'night/busan-asiad-1/index.html':['부산아시아드나이트','업소 소개'],
 'night/daejeon-seven-1/index.html':['대전세븐나이트','업소 소개'],
 'night/bulgwang-hobak-1/index.html':['불광동호박나이트','업소 소개'],
 'night/changwon-lululala-1/index.html':['창원룰루랄라나이트','업소 소개'],
 'night/cheongdam-1/index.html':['청담나이트','업소 소개'],
 'night/dapsimni-miracle-night-1/index.html':['답십리미라클나이트','업소 소개'],
 'night/ulsan-champion-1/index.html':['울산챔피언나이트','업소 소개'],
 'policy-1/index.html':['울산챔피언나이트','19세 이상 운영 정책'],
 'review-1.html':['울산챔피언나이트','단골 후기'],
 'story-1.html':['울산챔피언나이트','밤의 기록'],
};
const HUB='night/index.html';
const SKIP=new Set(['index.html']); // 홈: 썸네일 파일 그대로 유지(H2)

function pageUrl(rel){
  if(rel==='index.html')return BASE+'/';
  if(rel.endsWith('/index.html'))return BASE+'/'+rel.replace(/index\.html$/,'');
  return BASE+'/'+rel.replace(/\.html$/,'');
}
(async()=>{
const manifest=[],report=[];
for(const rel of walk('.').sort()){
  if(SKIP.has(rel))continue;
  const h=fs.readFileSync(rel,'utf8');
  const og=(h.match(/property="og:image" content="([^"]*)"/)||[])[1]||'';
  const file=og.replace(BASE,'');
  if(!file.startsWith('/og/')){console.log('SKIP(og 없음)',rel);continue;}
  const alt=(h.match(/property="og:image:alt" content="([^"]*)"/)||[])[1]||'';
  let spec;
  if(rel===HUB){
    spec={kind:'HUB',storeName:'전국 나이트 이야기'};
  } else if(AD_PAGES[rel]){
    const [store,topic]=AD_PAGES[rel];
    spec={kind:'A',storeName:store,topic,nick:AD[store].nick,phone:AD[store].phone};
  } else {
    let name='';
    for(const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)){
      try{const o=JSON.parse(m[1]);if(o['@type']==='NightClub'&&o.name)name=o.name;}catch(e){}
    }
    if(!name)name=(alt.match(/^([가-힣A-Za-z0-9]+)/)||[])[1]||'';
    if(!name){console.log('!! 이름 미확인',rel);continue;}
    spec={kind:'B',storeName:name};
  }
  spec.palette=[...rel].reduce((a,c)=>a+c.charCodeAt(0),0);
  const {svg,draw}=build(spec);
  const out=path.join(ROOT,file.replace(/^\//,''));
  const r=await writePng(svg,out);
  const hero=spec.kind==='A'?'전화번호':'광고문의';
  manifest.push({파일명:file,페이지URL:pageUrl(rel),가게이름:spec.kind==='HUB'?'(허브·중립)':spec.storeName,
    규칙:spec.kind==='A'?'(A) 광고주 — 주인공 전화번호':spec.kind==='HUB'?'(a) 허브 — 중립문구+광고문의':'(B) 비광고주 — 주인공 광고문의',
    그려진텍스트:draw, 주인공텍스트:hero,
    크기:{width:r.width,height:r.height,bytes:r.bytes,KB:+(r.bytes/1024).toFixed(1)}});
  report.push({rel,file,kind:spec.kind,hero,...r});
  console.log(`${spec.kind}  ${file.padEnd(40)} ${(r.width+'x'+r.height).padEnd(10)} ${(r.bytes/1024).toFixed(1)}KB  ${rel}`);
}
fs.writeFileSync(path.join(ROOT,'og/manifest.json'),JSON.stringify({생성일:'2026-08-20',캔버스:'1200x1200',안전여백:'좌우 각 60px (사용 가능 폭 1080px)',폰트:'Pretendard-Bold (tools/fonts)',총개수:manifest.length,이미지:manifest},null,2));
console.log('\n총 '+manifest.length+'장 생성 · og/manifest.json 기록');
})();
