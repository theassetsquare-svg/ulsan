/**
 * 불광동호박나이트 전용 1:1(1200x1200) 검색 썸네일 생성기
 *
 * generate-og-thumbs.js 와 같은 fontconfig 부트스트랩을 쓰지만,
 * 배경 계열·레이아웃·장식을 통째로 다르게 가져간다.
 * (기존 9장은 페트롤그린 + 좌측정렬 스택, 이 장은 자주빛 + 중앙 카드형)
 * 네이버/구글 이미지검색에서 같은 사이트 썸네일끼리 중복 판정되는 걸 피하려는 것.
 *
 * 실행: node scripts/generate-bulgwang-thumb.js
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FONT_DIR = __dirname;
const FONT_FILE = path.join(FONT_DIR, 'NotoSansKR-Black.ttf');
const OUT_DIR = path.join(ROOT, 'og');

if (!fs.existsSync(FONT_FILE)) {
  console.error('폰트가 없습니다:', FONT_FILE);
  process.exit(1);
}
const FC_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'bulgwang-fc-'));
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
const DOMAIN = 'love-8r5.pages.dev';
const VENUE = '불광동호박나이트';
const NICK = '손흥민';
const ROLE = '예약 담당';
const PHONE = '010-2221-1937';
const LABEL = '은평구 불광동 나이트 안내';
const FONT = 'Noto Sans KR';

// 자주빛 → 딥퍼플. 기존 썸네일(페트롤그린)과 완전히 다른 계열.
const BG_TOP = '#2A0A2E';
const BG_BOT = '#4A1141';
const ACCENT = '#FFC94A';   // 호박(펌킨) 연상 골드
const PILL = '#1BAF6A';     // 통화 버튼 그린 — 배경 자주색 위에서 대비 최상
const PILL_EDGE = '#128350';

const esc = (s) => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/**
 * 레이아웃 — 중앙 정렬 카드형.
 *   상단 라운드 카드 안에 업소명 → 구분선 → 역할 + 닉네임(초대형)
 *   → 전화 알약 → 하단 라벨 → 도메인
 * 이모지는 폰트가 없어 두부로 깨지므로 전부 SVG 도형으로 그린다.
 */
function buildSvg() {
  const CX = SIZE / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <linearGradient id="bg" x1="0.15" y1="0" x2="0.85" y2="1">
      <stop offset="0%" stop-color="${BG_TOP}"/>
      <stop offset="100%" stop-color="${BG_BOT}"/>
    </linearGradient>
    <linearGradient id="pill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${PILL}"/>
      <stop offset="100%" stop-color="${PILL_EDGE}"/>
    </linearGradient>
  </defs>

  <rect width="${SIZE}" height="${SIZE}" fill="url(#bg)"/>

  <!-- 배경 장식: 호박 이미지 대신 큰 원 두 개를 겹쳐 깊이만 준다 -->
  <circle cx="1050" cy="150" r="260" fill="${ACCENT}" opacity="0.10"/>
  <circle cx="150" cy="1060" r="220" fill="${ACCENT}" opacity="0.08"/>

  <!-- 상하 골드 프레임 -->
  <rect x="0" y="0" width="${SIZE}" height="22" fill="${ACCENT}"/>
  <rect x="0" y="${SIZE - 22}" width="${SIZE}" height="22" fill="${ACCENT}"/>

  <!-- 업소명 카드 -->
  <rect x="96" y="104" width="1008" height="176" rx="30" fill="${ACCENT}"/>
  <text x="${CX}" y="222" text-anchor="middle" font-family="${FONT}" font-size="92"
        font-weight="900" fill="#2A0A2E" letter-spacing="1">${esc(VENUE)}</text>

  <!-- 역할 -->
  <text x="${CX}" y="376" text-anchor="middle" font-family="${FONT}" font-size="52"
        font-weight="900" fill="#FFFFFF" opacity="0.78" letter-spacing="6">${esc(ROLE)}</text>

  <!-- 닉네임 — 가장 크게 -->
  <text x="${CX}" y="626" text-anchor="middle" font-family="${FONT}" font-size="248"
        font-weight="900" fill="#FFFFFF">${esc(NICK)}</text>

  <!-- 전화번호 알약 -->
  <rect x="108" y="716" width="984" height="196" rx="98" fill="url(#pill)"/>
  <text x="${CX}" y="846" text-anchor="middle" font-family="${FONT}" font-size="112"
        font-weight="900" fill="#FFFFFF" letter-spacing="2">${esc(PHONE)}</text>

  <!-- 라벨 -->
  <text x="${CX}" y="1010" text-anchor="middle" font-family="${FONT}" font-size="54"
        font-weight="900" fill="${ACCENT}" letter-spacing="2">${esc(LABEL)}</text>

  <!-- 도메인 -->
  <text x="${CX}" y="1094" text-anchor="middle" font-family="${FONT}" font-size="44"
        font-weight="900" fill="#FFFFFF" opacity="0.6" letter-spacing="3">${esc(DOMAIN)}</text>
</svg>`;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const out = path.join(OUT_DIR, 'thumb-bulgwang.png');
  await sharp(Buffer.from(buildSvg())).png({ compressionLevel: 9 }).toFile(out);
  const meta = await sharp(out).metadata();
  if (meta.width !== SIZE || meta.height !== SIZE) {
    throw new Error(`${out} 크기 오류: ${meta.width}x${meta.height}`);
  }
  console.log(`OK ${path.relative(ROOT, out)}  ${meta.width}x${meta.height}  ${Math.round(fs.statSync(out).size / 1024)}KB`);
}

main().catch((e) => { console.error(e); process.exit(1); });
