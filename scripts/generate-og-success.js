/**
 * 홈(성공스토리 단독 페이지) 전용 1:1 OG 이미지 생성기.
 *
 * 홈에는 업소명·업종 단어가 들어가면 안 되므로 기존 generate-og-thumbs.js와
 * 완전히 분리해서 만든다. 폰트 부트스트랩 방식은 동일(scripts/NotoSansKR-Black.ttf).
 *
 * 실행: node scripts/generate-og-success.js
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FONT_DIR = __dirname;
const FONT_FILE = path.join(FONT_DIR, 'NotoSansKR-Black.ttf');
const OUT = path.join(ROOT, 'og', 'success-story.png');

if (!fs.existsSync(FONT_FILE)) {
  console.error('폰트가 없습니다:', FONT_FILE);
  process.exit(1);
}
const FC_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ulsan-fc-'));
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

const SIZE = 1200;
const FONT = 'Noto Sans KR';
const DOMAIN = 'love-8r5.pages.dev';
const A = '#E08B5A';          // 포인트 — 종이/잉크 톤과 대비
const BG_TOP = '#171512';
const BG_BOT = '#2A211A';

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0%" stop-color="${BG_TOP}"/>
      <stop offset="100%" stop-color="${BG_BOT}"/>
    </linearGradient>
  </defs>

  <rect width="${SIZE}" height="${SIZE}" fill="url(#bg)"/>

  <!-- 좌측 세로 포인트 바 + 하단 바 -->
  <rect x="0" y="0" width="26" height="${SIZE}" fill="${A}"/>
  <rect x="0" y="${SIZE - 18}" width="${SIZE}" height="18" fill="${A}"/>

  <!-- 우하단 사선 장식 -->
  <polygon points="${SIZE},${SIZE} ${SIZE},${SIZE - 360} ${SIZE - 360},${SIZE}" fill="${A}" opacity="0.14"/>

  <!-- 상단 라벨 -->
  <text x="118" y="196" font-family="${FONT}" font-size="52" font-weight="900"
        fill="${A}" letter-spacing="10">${esc('실화 기록')}</text>

  <!-- 메인 카피 — 크게 3줄 -->
  <text x="112" y="416" font-family="${FONT}" font-size="176" font-weight="900" fill="#FFFFFF">${esc('성공')}</text>
  <text x="112" y="596" font-family="${FONT}" font-size="176" font-weight="900" fill="#FFFFFF">${esc('스토리')}</text>

  <!-- 구분선 -->
  <rect x="118" y="672" width="420" height="10" rx="5" fill="${A}"/>

  <!-- 서브 카피 -->
  <text x="118" y="806" font-family="${FONT}" font-size="72" font-weight="900"
        fill="#FFFFFF" opacity="0.92">${esc('마흔셋에 밀려난 사람이')}</text>
  <text x="118" y="906" font-family="${FONT}" font-size="72" font-weight="900"
        fill="${A}">${esc('다시 서기까지 7년')}</text>

  <!-- 하단 한 줄 -->
  <text x="118" y="1024" font-family="${FONT}" font-size="50" font-weight="900"
        fill="#FFFFFF" opacity="0.68">${esc('끝까지 읽으면 오늘이 달라집니다')}</text>

  <!-- 도메인 -->
  <text x="118" y="1108" font-family="${FONT}" font-size="44" font-weight="900"
        fill="#FFFFFF" opacity="0.5" letter-spacing="3">${esc(DOMAIN)}</text>
</svg>`;

(async () => {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(OUT);
  const m = await sharp(OUT).metadata();
  if (m.width !== SIZE || m.height !== SIZE) throw new Error(`크기 오류 ${m.width}x${m.height}`);
  console.log(`OK ${path.relative(ROOT, OUT)} ${m.width}x${m.height} ${Math.round(fs.statSync(OUT).size / 1024)}KB`);
})().catch((e) => { console.error(e); process.exit(1); });
