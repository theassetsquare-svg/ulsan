/** 라이브 실측: manifest 의 전 썸네일 HTTP 200 + image/png, 대표 페이지 HTML 반영 확인 */
'use strict';
const https=require('https'),fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const SITE='https://a.nolcool.com';
const man=JSON.parse(fs.readFileSync(path.join(ROOT,'og/manifest.json'),'utf8'));
const files=[...man.이미지.map(i=>i.파일명),'/og/success-story-1.png'];
function head(url){return new Promise(r=>{https.request(url,{method:'GET'},res=>{let len=0;res.on('data',c=>len+=c.length);res.on('end',()=>r({status:res.statusCode,ct:res.headers['content-type'],len}));}).on('error',e=>r({status:0,ct:e.message,len:0})).end();});}
function get(url){return new Promise(r=>{https.get(url,res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>r({status:res.statusCode,body:d}));}).on('error',e=>r({status:0,body:''}));});}
(async()=>{
 let bad=0,maxKB=0;
 for(const f of files){
   const r=await head(SITE+f);
   const kb=r.len/1024; if(kb>maxKB)maxKB=kb;
   const ok=r.status===200&&/image\/png/.test(r.ct||'')&&r.len<=300*1024;
   if(!ok){console.log('❌',f,r.status,r.ct,kb.toFixed(1)+'KB');bad++;}
 }
 console.log(`썸네일 ${files.length}개 · 실패 ${bad}건 · 최대 ${maxKB.toFixed(1)}KB`);
 const checks=[
  ['/cheongdam-night/',['010-5655-4866','펩시맨','/og/cheongdam-1.png']],
  ['/ulsan-champion-night/',['010-5653-0069','춘자']],
  ['/changwon-lululala-night/',['010-7528-4936','로또']],
  ['/bulgwang-hobak-night/',['010-2221-1937','손흥민']],
  ['/ulsan-night/',['삼산동 터미널 구역']],
  ['/faq-1',['울산챔피언나이트']],
  ['/night-1/',['전국 나이트']],
 ];
 for(const [p,needles] of checks){
   const r=await get(SITE+p);
   const miss=needles.filter(n=>!r.body.includes(n));
   const homeLink=(r.body.match(/<a\b[^>]*href="(\/|\.\/|index\.html|\/index\.html|https:\/\/ulsane\.pages\.dev\/)"/g)||[]).length;
   console.log(`${r.status} ${p.padEnd(36)} 누락:${miss.length?miss.join(','):'없음'} · 홈링크:${homeLink}`);
   if(miss.length||homeLink)bad++;
 }
 const home=await get(SITE+'/');
 const himg=(home.body.match(/<img\b/g)||[]).length;
 console.log(`${home.status} /                                    홈 <img>:${himg} · og:image:${/og:image" content="[^"]+"/.test(home.body)?'있음':'없음'}`);
 if(himg)bad++;
 console.log(bad?`❌ 라이브 실패 ${bad}건`:'✅ 라이브 전 항목 통과');
})();
