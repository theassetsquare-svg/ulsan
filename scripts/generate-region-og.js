'use strict';
/**
 * 2차 지역 페이지 13개용 1:1(1200x1200) OG 이미지 생성기.
 *  · A그룹 4장(은평·창원·울산·강남) — 상단 0~55% 주 키워드 대형 / 55~60% 지역명 /
 *    60~100% 검은 띠(#000) 위 흰 글씨 2줄(닉네임, 전화번호).
 *    전화번호는 이미지에서 두 번째로 큰 글자이며 잘리면 안 된다.
 *  · B그룹 9장 — 주 키워드 + 지역명 + 사이트 브랜드명. 전화번호·besta12 금지.
 *  · 연령 배지는 창원·대전 2장만, "만 27세 이상"/"만 38세 이상" 완전문.
 * 렌더 후 실제 픽셀을 다시 읽어 글자 높이·폭·잘림을 실측하고 region-og-report.json 에 남긴다.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FONT_DIR = __dirname;
const FONT_FILE = path.join(FONT_DIR, 'NotoSansKR-Black.ttf');
const OUT_DIR = path.join(ROOT, 'og');

if (!fs.existsSync(FONT_FILE)) { console.error('폰트 없음:', FONT_FILE); process.exit(1); }
const FC_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'region-fc-'));
const FC_CACHE = path.join(FC_DIR, 'cache');
fs.mkdirSync(FC_CACHE, { recursive: true });
const FC_CONF = path.join(FC_DIR, 'fonts.conf');
fs.writeFileSync(FC_CONF, `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>${FONT_DIR}</dir>
  <cachedir>${FC_CACHE}</cachedir>
  <match target="pattern">
    <test qual="any" name="family"><string>sans-serif</string></test>
    <edit name="family" mode="assign" binding="same"><string>Noto Sans KR</string></edit>
  </match>
</fontconfig>
`);
process.env.FONTCONFIG_FILE = FC_CONF;

const sharp = require('sharp');
const { regions } = require('./build-region-pages.js');
const NIGHT = require('./build-night-pages.js');

const SIZE = 1200;
const MARGIN = 100;
const SAFE_W = SIZE - MARGIN * 2;
const FONT = 'Noto Sans KR';
const BRAND = '전국 나이트 지역 안내';
const BAND_TOP = 720;
const NAME_CENTER = 330;
const REGION_BASE = 690;

function hsl2rgb(h, s, l) {
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
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}
const hex = (rgb) => '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
function lum(rgb) {
  const f = rgb.map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
  return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2];
}
const contrast = (a, b) => { const l1 = lum(a), l2 = lum(b); const hi = Math.max(l1, l2), lo = Math.min(l1, l2); return (hi + 0.05) / (lo + 0.05); };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function measure(textSvgBody) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}"><rect width="${SIZE}" height="${SIZE}" fill="#000000"/>${textSvgBody}</svg>`;
  const { data, info } = await sharp(Buffer.from(svg)).greyscale().raw().toBuffer({ resolveWithObject: true });
  let minX = info.width, maxX = -1, minY = info.height, maxY = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[y * info.width + x] > 128) {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return { width: 0, height: 0, left: 0, right: 0, top: 0, bottom: 0 };
  return { width: maxX - minX + 1, height: maxY - minY + 1, left: minX, right: maxX, top: minY, bottom: maxY };
}

const textEl = (t, x, y, size, fill) =>
  `<text x="${x}" y="${y}" text-anchor="middle" font-family="${FONT}" font-size="${size}" font-weight="900" fill="${fill}">${esc(t)}</text>`;

async function fitPhone(tel, baseY) {
  let size = 158;
  let m = await measure(textEl(tel, SIZE / 2, baseY, size, '#ffffff'));
  while (m.width > SAFE_W && size > 110) {
    size -= 4;
    m = await measure(textEl(tel, SIZE / 2, baseY, size, '#ffffff'));
  }
  return { size, m };
}

async function buildSvg(r) {
  const bg = hsl2rgb(r.hue, 62, 21);
  const bg2 = hsl2rgb(r.hue, 58, 12);
  const accent = hsl2rgb(r.hue, 80, 75);
  const white = [255, 255, 255];
  const black = [0, 0, 0];

  const cName = contrast(white, bg);
  const cRegion = contrast(accent, bg);
  const cBadge = contrast([17, 17, 17], accent);
  const cBand = contrast(white, black);
  if (cName < 4.5 || cRegion < 4.5 || cBadge < 4.5) {
    throw new Error(r.slug + ' 명도대비 부족: ' + [cName, cRegion, cBadge].map((n) => n.toFixed(2)).join('/'));
  }

  const lines = r.ogLines;
  const maxLen = Math.max.apply(null, lines.map((l) => l.length));
  const nameSize = Math.min(150, Math.floor(SAFE_W / maxLen));
  const blockH = lines.length * nameSize * 1.14;
  const startY = NAME_CENTER - blockH / 2 + nameSize * 0.86;
  const nameNodes = lines.map((l, i) => textEl(l, SIZE / 2, Math.round(startY + i * nameSize * 1.14), nameSize, '#ffffff'));
  const nameSvg = nameNodes.join('\n  ');
  const nameMeasure = await measure(nameNodes.join(''));

  const badge = r.age ? `
  <rect x="${SIZE - MARGIN - 380}" y="60" width="380" height="106" rx="53" fill="${hex(accent)}"/>
  <text x="${SIZE - MARGIN - 190}" y="132" text-anchor="middle" font-family="${FONT}" font-size="52" font-weight="900" fill="#111111">${esc(r.age)}</text>` : '';

  const report = {
    slug: r.slug, kw: r.kw, group: r.group, bg: hex(bg),
    nameLines: lines, nameFontSize: nameSize,
    nameInkWidth: nameMeasure.width, nameInkHeight: nameMeasure.height,
    ageBadge: r.age || null,
    bandContrast: null, nickname: null, tel: null,
    telFontSize: null, telInkHeight: null, telInkWidth: null,
    telLeft: null, telRight: null, telClipped: null,
    nameContrast: Number(cName.toFixed(2)), regionContrast: Number(cRegion.toFixed(2)),
    texts: []
  };
  report.texts.push(...lines, r.ogRegion);
  if (r.age) report.texts.push(r.age);

  let body;
  if (r.group === 'A') {
    const nickSize = 100;
    const nickY = 858;
    const telY = 1082;
    const fit = await fitPhone(r.contact.tel, telY);
    const nickMeasure = await measure(textEl(r.contact.person, SIZE / 2, nickY, nickSize, '#ffffff'));

    if (fit.m.height < 100) throw new Error(r.slug + ' 전화번호 글자 높이 부족 ' + fit.m.height + 'px');
    if (fit.m.left < 20 || fit.m.right > SIZE - 20) throw new Error(r.slug + ' 전화번호 잘림 ' + fit.m.left + '~' + fit.m.right);
    if (fit.m.height <= nickMeasure.height) throw new Error(r.slug + ' 전화번호가 닉네임보다 작다');
    if (fit.m.height >= nameMeasure.height) throw new Error(r.slug + ' 전화번호가 주 키워드보다 크다 — 두 번째로 큰 글자여야 한다');

    report.bandContrast = Number(cBand.toFixed(2));
    report.nickname = r.contact.person;
    report.tel = r.contact.tel;
    report.telFontSize = fit.size;
    report.telInkHeight = fit.m.height;
    report.telInkWidth = fit.m.width;
    report.telLeft = fit.m.left;
    report.telRight = fit.m.right;
    report.telClipped = fit.m.left < 20 || fit.m.right > SIZE - 20;
    report.nickInkHeight = nickMeasure.height;
    report.texts.push(r.contact.person, r.contact.tel);

    body = `
  <rect x="0" y="${BAND_TOP}" width="${SIZE}" height="${SIZE - BAND_TOP}" fill="#000000"/>
  ${textEl(r.contact.person, SIZE / 2, nickY, nickSize, '#ffffff')}
  ${textEl(r.contact.tel, SIZE / 2, telY, fit.size, '#ffffff')}`;
  } else {
    report.texts.push(BRAND);
    body = `
  <rect x="${SIZE / 2 - 240}" y="${BAND_TOP + 60}" width="480" height="6" rx="3" fill="${hex(accent)}" opacity="0.85"/>
  ${textEl(BRAND, SIZE / 2, 1010, 50, '#ffffff')}`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0.55" y2="1">
      <stop offset="0%" stop-color="${hex(bg)}"/>
      <stop offset="100%" stop-color="${hex(bg2)}"/>
    </linearGradient>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#g)"/>
  <rect x="0" y="0" width="${SIZE}" height="18" fill="${hex(accent)}"/>
  <rect x="${MARGIN}" y="600" width="${SAFE_W}" height="5" rx="2" fill="${hex(accent)}" opacity="0.5"/>
${badge}
  ${nameSvg}
  ${textEl(r.ogRegion, SIZE / 2, REGION_BASE, 56, hex(accent))}${body}
</svg>`;
  return { svg, report };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  /* 1차 13색 */
  const prior = new Map();
  NIGHT.venues.forEach((v) => prior.set(hex(hsl2rgb(v.hue, 65, 20)), v.slug));

  const seen = new Map();
  const reports = [];
  for (const r of regions) {
    const bgHex = hex(hsl2rgb(r.hue, 62, 21));
    if (seen.has(bgHex)) throw new Error('2차 배경색 중복: ' + bgHex + ' (' + seen.get(bgHex) + ' / ' + r.slug + ')');
    if (prior.has(bgHex)) throw new Error('1차 배경색과 충돌: ' + bgHex + ' (' + prior.get(bgHex) + ' / ' + r.slug + ')');
    seen.set(bgHex, r.slug);
    const { svg, report } = await buildSvg(r);
    const out = path.join(OUT_DIR, r.slug + '-og.png');
    await sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: true }).toFile(out);
    const meta = await sharp(out).metadata();
    const kb = Math.round(fs.statSync(out).size / 1024);
    if (meta.width !== SIZE || meta.height !== SIZE) throw new Error(out + ' 크기 오류 ' + meta.width + 'x' + meta.height);
    if (kb > 300) throw new Error(out + ' 용량 초과 ' + kb + 'KB');
    /* B그룹 금지 문자열 검사 */
    if (r.group === 'B') {
      const joined = report.texts.join(' ');
      if (/besta12/i.test(joined) || /\d{3}-\d{4}-\d{4}/.test(joined)) throw new Error(r.slug + ' B그룹 OG에 금지 문자열');
    }
    /* 연령 축약 검사 */
    const joined = report.texts.join(' ');
    if (/27\+|38\+|만27세|만38세|27세이상|38세이상/.test(joined)) throw new Error(r.slug + ' OG 연령 축약 표기');
    report.file = 'og/' + r.slug + '-og.png';
    report.width = meta.width; report.height = meta.height; report.kb = kb;
    reports.push(report);
    console.log('OK  ' + report.file.padEnd(32) + meta.width + 'x' + meta.height + '  ' + String(kb).padStart(3) + 'KB  bg=' + bgHex +
      (r.group === 'A'
        ? '  [A] ' + report.nickname + ' ' + report.tel + ' 높이 ' + report.telInkHeight + 'px 폭 ' + report.telInkWidth + 'px 띠대비 ' + report.bandContrast + ':1'
        : '  [B]') + (r.age ? '  배지 "' + r.age + '"' : ''));
  }
  fs.writeFileSync(path.join(__dirname, 'region-og-report.json'), JSON.stringify({ generatedAt: '2026-08-15', size: SIZE, reports }, null, 2) + '\n');
  console.log('\n2차 배경색 13개 상이: ' + (seen.size === regions.length ? 'PASS' : 'FAIL') + ' / 1차 13색과 충돌: 0건');
}
main().catch((e) => { console.error(e); process.exit(1); });
