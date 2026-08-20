/**
 * 네이버/구글 썸네일 렌더러 — 폭 실측 자동 맞춤
 * opentype.js 로 글자 path 실제 잉크 폭/높이를 측정해 목표 폭에 맞을 때까지 크기 조정 → sharp 로 1200x1200 PNG.
 * 규칙 (A) 광고주=전화번호 주인공 / (B) 비광고주=광고문의 주인공 / (HUB) 중립문구+광고문의
 */
const fs=require('fs'),path=require('path');
const opentype=require('opentype.js');
const sharp=require('sharp');
const ROOT=path.resolve(__dirname,'..');
const FONT=opentype.parse(fs.readFileSync(path.join(ROOT,'tools/fonts/Pretendard-Bold.ttf')).buffer.slice(0));
const W=1200,H=1200,MARGIN=60,USABLE=W-MARGIN*2; // 1080

const ink=(t,size)=>{const p=FONT.getPath(t,0,0,size);const b=p.getBoundingBox();return{p,w:b.x2-b.x1,h:b.y2-b.y1,x1:b.x1,y1:b.y1};};
/** 목표 잉크 폭에 맞는 폰트 크기를 이분 탐색으로 찾는다 */
function fitWidth(t,targetW){let lo=8,hi=1400;for(let i=0;i<60;i++){const m=(lo+hi)/2;(ink(t,m).w>targetW)?hi=m:lo=m;}return (lo+hi)/2;}
/** 자간(tracking)을 적용한 path 합성 */
function trackedPath(t,size,tracking){
  const full=new opentype.Path();let x=0;
  for(const ch of Array.from(t)){const g=FONT.charToGlyph(ch);const p=g.getPath(x,0,size);full.extend(p);x+=g.advanceWidth/FONT.unitsPerEm*size+tracking;}
  const b=full.getBoundingBox();return{p:full,w:b.x2-b.x1,h:b.y2-b.y1,x1:b.x1,y1:b.y1};
}
function fitTracking(t,size,targetW){const n=Array.from(t).length-1;if(n<1)return 0;
  let lo=0,hi=600;for(let i=0;i<60;i++){const m=(lo+hi)/2;(trackedPath(t,size,m).w>targetW)?hi=m:lo=m;}return (lo+hi)/2;}

/** 한 줄 배치: 목표 폭(px) + (선택)목표 높이(px, 세로 스케일로 보정) */
function line(text,{targetW,targetH=null,color,tracking=false}){
  let size=fitWidth(text,targetW),m,tr=0;
  if(targetH){ // 높이 우선: 높이를 맞춘 뒤 폭은 자간 또는 가로 스케일로 보정
    size=targetH/(ink(text,100).h/100);
    if(tracking){ tr=fitTracking(text,size,targetW); m=trackedPath(text,size,tr); }
    else m=ink(text,size);
  } else m=ink(text,size);
  const sx=targetW/m.w, syRaw=targetH?targetH/m.h:1;
  return {text,size,tracking:tr,m,sx,sy:syRaw,color};
}
/** opentype.js 2.x 의 toPathData() 가 일부 크기에서 NaN 좌표를 뱉는 버그가 있어 직접 직렬화한다 */
function pathData(p){
  const n=v=>{if(!Number.isFinite(v))throw new Error('NaN coordinate in glyph path');return (Math.round(v*100)/100).toString();};
  let out='';
  for(const c of p.commands){
    if(c.type==='M')out+='M'+n(c.x)+' '+n(c.y);
    else if(c.type==='L')out+='L'+n(c.x)+' '+n(c.y);
    else if(c.type==='C')out+='C'+n(c.x1)+' '+n(c.y1)+' '+n(c.x2)+' '+n(c.y2)+' '+n(c.x)+' '+n(c.y);
    else if(c.type==='Q')out+='Q'+n(c.x1)+' '+n(c.y1)+' '+n(c.x)+' '+n(c.y);
    else if(c.type==='Z')out+='Z';
  }
  return out;
}
function svgLine(l,X,Y,forceW,forceH){
  const sx=forceW/l.m.w, sy=forceH/l.m.h;
  const tx=X-l.m.x1*sx, ty=Y-l.m.y1*sy;
  return `<g transform="translate(${tx.toFixed(2)},${ty.toFixed(2)}) scale(${sx.toFixed(5)},${sy.toFixed(5)})"><path d="${pathData(l.m.p)}" fill="${l.color}"/></g>`;
}
const PAL=[['#0E1116','#7CFF7A'],['#141018','#8CE9FF'],['#101614','#FFE066'],['#16101A','#FF9BD2'],
           ['#0F1420','#9DFF8A'],['#1A1210','#FFC978'],['#0C1418','#7FE3FF'],['#181018','#C9A8FF']];

/**
 * spec = {file, pageUrl, storeName, kind:'A'|'B'|'HUB', nick, phone, topic, palette}
 */
function build(spec){
  const [bg,accent]=PAL[spec.palette%PAL.length];
  const parts=[],rows=[],draw=[];
  let blockH=0;const GAP=52;
  const push=(l,w,h,label,gapAfter=GAP)=>{rows.push({l,w,h,label,gapAfter});blockH+=h+gapAfter;};

  if(spec.kind==='A'){
    if(spec.topic){const tW=USABLE*0.30;const l=line(spec.topic,{targetW:tW,color:'#B9C0CC'});push(l,tW,l.m.h,'주제',34);}
    const nW=USABLE*0.60; const ln=line(spec.storeName,{targetW:nW,color:'#FFFFFF'}); push(ln,nW,ln.m.h,'가게이름');
    // 닉네임: 높이 172px 고정 + 자간으로 폭 46% 확보 (전화번호보다 낮게)
    const kW=USABLE*0.46; const lk=line(spec.nick,{targetW:kW,targetH:172,color:accent,tracking:true}); push(lk,kW,172,'닉네임');
    // 전화번호: 폭 96%(1036.8px) + 세로로 가장 큰 글자(182px)
    const pW=USABLE*0.96; const lp=line(spec.phone,{targetW:pW,targetH:182,color:'#FFFFFF'}); push(lp,pW,182,'전화번호',44);
    const aW=USABLE*0.56; const la=line('광고문의 카톡 besta12',{targetW:aW,color:'#FFD400'}); push(la,aW,la.m.h,'광고문의',0);
  } else if(spec.kind==='B'||spec.kind==='HUB'){
    const nW=USABLE*0.60; const ln=line(spec.storeName,{targetW:nW,color:'#FFFFFF'}); push(ln,nW,ln.m.h,spec.kind==='HUB'?'중립문구':'가게이름',60);
    const gW=USABLE*0.85; const lg=line('광고문의',{targetW:gW,color:'#FFD400'}); push(lg,gW,lg.m.h,'광고문의',54);
    const kW=USABLE*0.80; const lk=line('카카오톡 besta12',{targetW:kW,targetH:124,color:'#FFFFFF'}); push(lk,kW,124,'카카오톡 besta12',0);
  }
  let y=(H-blockH)/2;
  for(const r of rows){
    const X=(W-r.w)/2;
    if(r.label==='전화번호'){ // 대비 박스
      const padX=26,padY=24;
      parts.push(`<rect x="${(X-padX).toFixed(1)}" y="${(y-padY).toFixed(1)}" width="${(r.w+padX*2).toFixed(1)}" height="${(r.h+padY*2).toFixed(1)}" rx="26" fill="#D0021B"/>`);
    }
    parts.push(svgLine(r.l,X,y,r.w,r.h));
    draw.push({텍스트:r.l.text,역할:r.label,실측폭px:+r.w.toFixed(1),실측높이px:+r.h.toFixed(1)});
    y+=r.h+r.gapAfter;
  }
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`+
    `<rect width="${W}" height="${H}" fill="${bg}"/>`+
    `<rect x="26" y="26" width="${W-52}" height="${H-52}" rx="34" fill="none" stroke="${accent}" stroke-width="6" opacity="0.5"/>`+
    parts.join('')+`</svg>`;
  if(/NaN|Infinity/.test(svg))throw new Error('SVG에 잘못된 좌표가 있습니다: '+spec.storeName);
  return {svg,draw};
}

async function writePng(svg,out){
  let buf=await sharp(Buffer.from(svg)).png({compressionLevel:9,palette:true,quality:100,effort:10}).toBuffer();
  if(buf.length>300*1024){ // 1200x1200 유지, 팔레트 색수만 축소
    for(const colors of [128,64,32,16]){
      buf=await sharp(Buffer.from(svg)).png({compressionLevel:9,palette:true,colors,effort:10}).toBuffer();
      if(buf.length<=300*1024)break;
    }
  }
  const meta=await sharp(buf).metadata();
  fs.writeFileSync(out,buf);
  return {bytes:buf.length,width:meta.width,height:meta.height};
}
module.exports={build,writePng,W,H,USABLE};
