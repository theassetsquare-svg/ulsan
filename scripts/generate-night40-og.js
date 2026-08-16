'use strict';
/**
 * /night/ 40곳 + 홈 + 허브 OG 썸네일 생성기 (1200x1200 · 1:1 PNG)
 *
 * 지시서(2026-08-16) 규칙:
 *  · 시스템 폰트 의존 금지 — tools/fonts/Pretendard-Bold.ttf(공식 배포 zip에서 추출)를
 *    opentype.js로 파싱해 글자를 <path>로 변환한 뒤 sharp로 래스터라이즈한다.
 *  · ⓐ 울산챔피언나이트 페이지·홈: 상단 업소명 + 중앙 최대 "춘자 010-5653-0069"
 *  · ⓑ 창원룰루랄라나이트: "로또 010-7528-4936" ⓒ 불광동호박나이트: "손흥민 010-2221-1937"
 *  · ⓓ 그 외 37곳 + 허브: 상단 업소명 + 중앙 최대 "광고문의" + 아래 "카카오톡 besta12"
 *    — ⓐⓑⓒ 외에는 전화번호 절대 금지(오인 전화 방지)
 *  · 생성 후 전 이미지 실측(1200x1200·글자 캔버스 안 수납) → scripts/night40-og-report.json
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const opentype = require('opentype.js');

const ROOT = path.join(__dirname, '..');
const FONT_FILE = path.join(ROOT, 'tools', 'fonts', 'Pretendard-Bold.ttf');
const OUT_DIR = path.join(ROOT, 'og');
const SIZE = 1200;
const SAFE = 90; // 좌우 최소 여백
const MAXW = SIZE - SAFE * 2;

if (!fs.existsSync(FONT_FILE)) { console.error('폰트 없음:', FONT_FILE); process.exit(1); }
const buf = fs.readFileSync(FONT_FILE);
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));

const { ORDER } = require('./build-night40.js');
const venues = ORDER.map((s) => require(path.join(__dirname, 'night40', s + '.js')));

function hsl2hex(h, s, l) {
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const hx = (v) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return '#' + hx(r) + hx(g) + hx(b);
}

const adv = (text, px) => font.getAdvanceWidth(text, px);
const fitSize = (text, maxW, cap) => Math.min(cap, Math.floor((maxW / adv(text, 100)) * 100));

/* 중앙 정렬 텍스트 한 줄 → {svg, size, w, bbox} */
function line(text, baselineY, px, fill) {
  const w = adv(text, px);
  const x = (SIZE - w) / 2;
  const p = font.getPath(text, x, baselineY, px);
  const b = p.getBoundingBox();
  return { svg: '<path fill="' + fill + '" d="' + p.toPathData(2) + '"/>', size: px, w, bbox: b, text };
}

function compose(bg, lines) {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + SIZE + '" height="' + SIZE + '">' +
    '<rect width="' + SIZE + '" height="' + SIZE + '" fill="' + bg + '"/>' + lines.map((l) => l.svg).join('') + '</svg>';
}

/* 상단 업소명 1~2줄 — 반환: {lines, maxSize} */
function nameBlock(nameLines, capSize) {
  const sizes = nameLines.map((t) => fitSize(t, MAXW, capSize));
  const px = Math.min(...sizes);
  const out = [];
  const lineGap = px * 1.22;
  const firstBase = nameLines.length === 2 ? 260 : 300;
  nameLines.forEach((t, i) => out.push(line(t, firstBase + i * lineGap, px, '#ffffff')));
  return { lines: out, px };
}

async function render(fileBase, bg, lines, meta, report) {
  const svg = compose(bg, lines);
  const file = path.join(OUT_DIR, fileBase);
  await sharp(Buffer.from(svg)).png().toFile(file);
  const md = await sharp(file).metadata();
  const inks = lines.map((l) => l.bbox);
  const minX = Math.min(...inks.map((b) => b.x1));
  const maxX = Math.max(...inks.map((b) => b.x2));
  const maxY = Math.max(...inks.map((b) => b.y2));
  report.push({
    file: 'og/' + fileBase,
    width: md.width, height: md.height,
    square: md.width === 1200 && md.height === 1200,
    inkInside: minX >= 20 && maxX <= SIZE - 20 && maxY <= SIZE - 20,
    ...meta
  });
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const report = [];

  for (const v of venues) {
    const bg = hsl2hex(v.hue, 62, 15);
    if (v.group === 'A') {
      /* 전화번호가 가장 큰 요소여야 한다 */
      const phonePx = fitSize(v.contact.tel, MAXW, 190);
      const nb = nameBlock(v.ogNameLines, Math.floor(phonePx * 0.78));
      const nick = line(v.contact.person, 660, Math.floor(phonePx * 0.52), '#ffffff');
      const phone = line(v.contact.tel, 880, phonePx, '#ffd400');
      await render(v.slug + '.png', bg, [...nb.lines, nick, phone], {
        kind: 'A', phonePx, namePx: nb.px, phoneLargest: phonePx > nb.px && phonePx > nick.size
      }, report);
    } else {
      const adPx = fitSize('광고문의', MAXW, 250);
      const nb = nameBlock(v.ogNameLines, Math.floor(adPx * 0.62));
      const ad = line('광고문의', 780, adPx, '#ffd400');
      const kakao = line('카카오톡 besta12', 1010, Math.floor(adPx * 0.38), '#ffffff');
      await render(v.slug + '.png', bg, [...nb.lines, ad, kakao], {
        kind: 'B', adPx, namePx: nb.px, adLargest: adPx > nb.px
      }, report);
    }
  }

  /* 홈 — ⓐ 규칙: 상단 울산챔피언나이트 + 중앙 최대 춘자 전화 */
  {
    const bg = hsl2hex(55, 62, 15);
    const phonePx = fitSize('010-5653-0069', MAXW, 190);
    const nb = nameBlock(['울산', '챔피언나이트'], Math.floor(phonePx * 0.78));
    const nick = line('춘자', 660, Math.floor(phonePx * 0.52), '#ffffff');
    const phone = line('010-5653-0069', 880, phonePx, '#ffd400');
    await render('home.png', bg, [...nb.lines, nick, phone], {
      kind: 'A', phonePx, namePx: nb.px, phoneLargest: phonePx > nb.px
    }, report);
  }

  /* 허브 — ⓓ 규칙 */
  {
    const bg = '#1f2430';
    const adPx = fitSize('광고문의', MAXW, 250);
    const nb = nameBlock(['전국 나이트', '이야기 40'], Math.floor(adPx * 0.62));
    const ad = line('광고문의', 780, adPx, '#ffd400');
    const kakao = line('카카오톡 besta12', 1010, Math.floor(adPx * 0.38), '#ffffff');
    await render('night-hub.png', bg, [...nb.lines, ad, kakao], { kind: 'B', adPx, namePx: nb.px, adLargest: adPx > nb.px }, report);
  }

  fs.writeFileSync(path.join(__dirname, 'night40-og-report.json'), JSON.stringify({ generatedAt: '2026-08-16', font: 'tools/fonts/Pretendard-Bold.ttf (opentype.js path 변환)', images: report }, null, 2));
  const bad = report.filter((r) => !r.square || !r.inkInside || (r.kind === 'A' && !r.phoneLargest) || (r.kind === 'B' && !r.adLargest));
  console.log('generated', report.length, 'images; problems:', bad.length);
  if (bad.length) { console.log(JSON.stringify(bad, null, 2)); process.exit(1); }
}

main().catch((e) => { console.error(e); process.exit(1); });
