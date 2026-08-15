'use strict';
/**
 * /night/ 13개 페이지용 1:1(1200x1200) OG 이미지 생성기.
 * 배경색은 업소별 hue에서 파생되므로 13장이 전부 다른 색상 코드를 갖는다.
 * 한글은 scripts/NotoSansKR-Black.ttf 를 fontconfig 로 물려 렌더한다.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FONT_DIR = __dirname;
const FONT_FILE = path.join(FONT_DIR, 'NotoSansKR-Black.ttf');
const OUT_DIR = path.join(ROOT, 'og');

if (!fs.existsSync(FONT_FILE)) { console.error('폰트 없음:', FONT_FILE); process.exit(1); }
const FC_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'night-fc-'));
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
const { ORDER } = require('./build-night-pages.js');
const venues = ORDER.map((s) => require(path.join(__dirname, 'night', s + '.js')));

const SIZE = 1200;
const MARGIN = 100;            // 좌우 여백 최소 100px 확보
const FONT = 'Noto Sans KR';
const BRAND = '놀쿨 · ulsand.pages.dev';

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

function buildSvg(v) {
  const bg = hsl2rgb(v.hue, 65, 20);
  const bg2 = hsl2rgb(v.hue, 60, 12);
  const accent = hsl2rgb(v.hue, 82, 74);
  const white = [255, 255, 255];

  const cName = contrast(white, bg);
  const cRegion = contrast(accent, bg);
  const cBadge = contrast([17, 17, 17], accent);
  if (cName < 4.5 || cRegion < 4.5 || cBadge < 4.5) {
    throw new Error(v.slug + ' 명도대비 부족: ' + [cName, cRegion, cBadge].map((n) => n.toFixed(2)).join('/'));
  }

  const lines = v.ogNameLines;
  const maxLen = Math.max.apply(null, lines.map((l) => l.length));
  const fs1 = Math.min(150, Math.floor((SIZE - MARGIN * 2) / maxLen));
  const cx = SIZE / 2;
  const blockH = lines.length * fs1 * 1.14;
  const startY = 470 - blockH / 2 + fs1 * 0.86;

  const nameSvg = lines.map((l, i) =>
    `  <text x="${cx}" y="${Math.round(startY + i * fs1 * 1.14)}" text-anchor="middle" font-family="${FONT}" font-size="${fs1}" font-weight="900" fill="#ffffff">${esc(l)}</text>`
  ).join('\n');

  const badge = v.age ? `
  <rect x="${SIZE - 100 - 360}" y="66" width="360" height="104" rx="52" fill="${hex(accent)}"/>
  <text x="${SIZE - 100 - 180}" y="136" text-anchor="middle" font-family="${FONT}" font-size="52" font-weight="900" fill="#111111">${esc(v.age)}</text>` : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0%" stop-color="${hex(bg)}"/>
      <stop offset="100%" stop-color="${hex(bg2)}"/>
    </linearGradient>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#g)"/>
  <rect x="0" y="0" width="${SIZE}" height="18" fill="${hex(accent)}"/>
  <rect x="0" y="${SIZE - 18}" width="${SIZE}" height="18" fill="${hex(accent)}"/>
  <circle cx="150" cy="1010" r="210" fill="${hex(accent)}" opacity="0.09"/>
${badge}
${nameSvg}
  <rect x="${cx - 240}" y="700" width="480" height="6" rx="3" fill="${hex(accent)}" opacity="0.85"/>
  <text x="${cx}" y="826" text-anchor="middle" font-family="${FONT}" font-size="60" font-weight="900" fill="${hex(accent)}">${esc(v.ogRegion)}</text>
  <text x="${cx}" y="1078" text-anchor="middle" font-family="${FONT}" font-size="46" font-weight="900" fill="#ffffff" opacity="0.92">${esc(BRAND)}</text>
</svg>`;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const seen = new Map();
  for (const v of venues) {
    const bgHex = hex(hsl2rgb(v.hue, 65, 20));
    if (seen.has(bgHex)) throw new Error('배경색 중복: ' + bgHex + ' (' + seen.get(bgHex) + ' / ' + v.slug + ')');
    seen.set(bgHex, v.slug);
    const out = path.join(OUT_DIR, v.slug + '-og.png');
    await sharp(Buffer.from(buildSvg(v))).png({ compressionLevel: 9, palette: true }).toFile(out);
    const meta = await sharp(out).metadata();
    const kb = Math.round(fs.statSync(out).size / 1024);
    if (meta.width !== SIZE || meta.height !== SIZE) throw new Error(out + ' 크기 오류 ' + meta.width + 'x' + meta.height);
    if (kb > 300) throw new Error(out + ' 용량 초과 ' + kb + 'KB');
    console.log('OK  og/' + v.slug + '-og.png  ' + meta.width + 'x' + meta.height + '  ' + kb + 'KB  bg=' + bgHex);
  }
  console.log('배경색 13개 전부 상이: ' + (seen.size === venues.length ? 'PASS' : 'FAIL'));
}
main().catch((e) => { console.error(e); process.exit(1); });
