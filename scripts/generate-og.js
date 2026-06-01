const { createCanvas, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

// Register Korean font
registerFont(path.join(__dirname, 'NotoSansKR-Black.ttf'), { family: 'NotoKR', weight: '900' });

const pages = [
  { name: 'og-home',        sub: '울산 밤문화의 모든 것' },
  { name: 'og-story',       sub: '전설이 된 밤의 이야기' },
  { name: 'og-atmosphere',  sub: '오감이 깨어나는 공간' },
  { name: 'og-first-visit', sub: '첫 방문 완벽 가이드' },
  { name: 'og-access',      sub: '오시는 길 안내' },
  { name: 'og-review',      sub: '솔직한 후기 모음' },
  { name: 'og-faq',         sub: '자주 묻는 질문' },
  { name: 'og-contact',     sub: '예약 · 연락처' },
];

function generateOG(page) {
  const W = 1200, H = 1200;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // === Background gradient ===
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0D1F33');
  bg.addColorStop(0.5, '#1E3A5F');
  bg.addColorStop(1, '#2A4D7A');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // === Decorative circles ===
  ctx.fillStyle = 'rgba(201,169,110,0.06)';
  ctx.beginPath(); ctx.arc(900, 280, 400, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(201,169,110,0.04)';
  ctx.beginPath(); ctx.arc(200, 920, 300, 0, Math.PI * 2); ctx.fill();

  // === Top badge ===
  ctx.fillStyle = 'rgba(201,169,110,0.15)';
  roundRect(ctx, 350, 200, 500, 56, 28);
  ctx.fill();
  ctx.strokeStyle = 'rgba(201,169,110,0.3)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, 350, 200, 500, 56, 28);
  ctx.stroke();

  ctx.fillStyle = '#C9A96E';
  ctx.font = '900 24px NotoKR';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '4px';
  ctx.fillText('ULSAN NO.1 NIGHTLIFE', W / 2, 236);

  // === 춘자 — HUGE ===
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 6;

  const goldGrad = ctx.createLinearGradient(200, 400, 1000, 400);
  goldGrad.addColorStop(0, '#C9A96E');
  goldGrad.addColorStop(0.5, '#DBBF8A');
  goldGrad.addColorStop(1, '#C9A96E');

  ctx.fillStyle = goldGrad;
  ctx.font = '900 300px NotoKR';
  ctx.textAlign = 'center';
  ctx.fillText('춘자', W / 2, 560);

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // === 울산챔피언나이트 ===
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.font = '900 72px NotoKR';
  ctx.fillText('울산챔피언나이트', W / 2, 700);

  // === Gold divider ===
  const divGrad = ctx.createLinearGradient(400, 0, 800, 0);
  divGrad.addColorStop(0, 'rgba(201,169,110,0)');
  divGrad.addColorStop(0.5, 'rgba(201,169,110,0.6)');
  divGrad.addColorStop(1, 'rgba(201,169,110,0)');
  ctx.fillStyle = divGrad;
  ctx.fillRect(400, 740, 400, 3);

  // === Sub text (unique per page) ===
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = '900 48px NotoKR';
  ctx.fillText(page.sub, W / 2, 830);

  // === Phone badge ===
  ctx.fillStyle = 'rgba(201,169,110,0.15)';
  roundRect(ctx, 340, 910, 520, 76, 38);
  ctx.fill();
  ctx.strokeStyle = 'rgba(201,169,110,0.3)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, 340, 910, 520, 76, 38);
  ctx.stroke();

  ctx.fillStyle = '#C9A96E';
  ctx.font = '900 38px NotoKR';
  ctx.fillText('📞 010-5653-0069', W / 2, 960);

  // === Bottom gold bar ===
  const bottomGrad = ctx.createLinearGradient(0, 0, W, 0);
  bottomGrad.addColorStop(0, '#C9A96E');
  bottomGrad.addColorStop(0.5, '#DBBF8A');
  bottomGrad.addColorStop(1, '#C9A96E');
  ctx.fillStyle = bottomGrad;
  ctx.globalAlpha = 0.3;
  ctx.fillRect(0, 1180, W, 20);
  ctx.globalAlpha = 1;

  // === Save ===
  const outPath = path.join(__dirname, '..', 'og', page.name + '.png');
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outPath, buffer);
  console.log(`✅ ${page.name}.png (1200x1200) — ${(buffer.length / 1024).toFixed(0)}KB`);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

for (const page of pages) {
  generateOG(page);
}
console.log('\nDone!');
