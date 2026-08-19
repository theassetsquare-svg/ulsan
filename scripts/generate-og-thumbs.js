/**
 * 1:1 (1200x1200) 검색 썸네일 생성기 — ulsane.pages.dev 전용
 *
 * 네이버/구글 이미지 검색 썸네일용. 페이지마다 고유 이미지를 만든다.
 *
 * ── 한글 폰트 ─────────────────────────────────────────────────────────
 * 이 환경에는 시스템 한글 폰트가 없고 fontconfig에도 아무것도 등록돼 있지 않다.
 * 그래서 스크립트가 실행 시점에 임시 fonts.conf를 만들어 FONTCONFIG_FILE로
 * 등록한다. 폰트 실물은 scripts/NotoSansKR-Black.ttf (git에 커밋돼 있음,
 * .gitignore에 걸리지 않는다). 이 파일이 없으면 한글이 전부 두부(□)로 깨진다.
 * 사라졌다면 Noto Sans KR Black TTF를 같은 경로에 다시 받아 두면 된다.
 *
 * ── 렌더러 ────────────────────────────────────────────────────────────
 * sharp의 SVG 변환(librsvg)을 쓴다. node-canvas는 이 환경에서 libuuid.so.1이
 * 없어 로드 자체가 실패하고, Python PIL도 설치돼 있지 않다.
 *
 * ── 이모지 금지 ───────────────────────────────────────────────────────
 * 이모지 폰트가 없어서 두부로 렌더링된다. 도형은 전부 SVG로 그린다.
 *
 * 실행: node scripts/generate-og-thumbs.js
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FONT_DIR = __dirname;                 // NotoSansKR-Black.ttf 가 있는 곳
const FONT_FILE = path.join(FONT_DIR, 'NotoSansKR-Black.ttf');
const OUT_DIR = path.join(ROOT, 'og');

// ── fontconfig 부트스트랩 (sharp/librsvg 로드 전에 반드시 먼저) ──────────
if (!fs.existsSync(FONT_FILE)) {
  console.error('폰트가 없습니다:', FONT_FILE);
  console.error('Noto Sans KR Black TTF를 이 경로에 두고 다시 실행하세요.');
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

// ── 고정 정보 ────────────────────────────────────────────────────────────
const SIZE = 1200;
const DOMAIN = 'ulsane.pages.dev';
const VENUE = '울산챔피언나이트';
const NICK = '춘자';
const ROLE = '예약 담당 실장';
const PHONE = '010-5653-0069';
const FONT = 'Noto Sans KR';

// 배경: 짙은 페트롤 그린. (기존/타 랜딩의 네이비+퍼플과 완전히 다른 계열)
const BG_TOP = '#04252B';
const BG_BOT = '#0A4048';
// 전화번호 알약: 크림슨. 어떤 포인트컬러 조합에서도 대비가 확보된다.
const PILL = '#E0263F';
const PILL_EDGE = '#A4152A';

/**
 * 페이지별 정의.
 * label(하단 라벨)은 9장 전부 다르게 — 같은 이미지 돌려쓰기 금지.
 * accent(포인트컬러)도 페이지마다 다르게 해서 이미지 검색 중복 판정을 피한다.
 * wedge는 우상단 사선 장식의 크기(픽셀). 페이지마다 형태가 미묘하게 달라진다.
 */
const PAGES = [
  { key: 'home',        file: 'index.html',       accent: '#FFB020', wedge: 300, label: '울산나이트 종합 안내' },
  { key: 'access',      file: 'access.html',      accent: '#35D0A5', wedge: 240, label: '삼산동 오시는 길' },
  { key: 'atmosphere',  file: 'atmosphere.html',  accent: '#FF7A45', wedge: 340, label: '매장 분위기 미리보기' },
  { key: 'contact',     file: 'contact.html',     accent: '#FFD447', wedge: 200, label: '예약 문의 직통 연결' },
  { key: 'faq',         file: 'faq.html',         accent: '#6FC8FF', wedge: 380, label: '자주 묻는 질문 정리' },
  { key: 'first-visit', file: 'first-visit.html', accent: '#A8E063', wedge: 260, label: '첫 방문 입문 가이드' },
  { key: 'review',      file: 'review.html',      accent: '#FF9EC4', wedge: 320, label: '단골 실명 후기 모음' },
  { key: 'story',       file: 'story.html',       accent: '#C9A6FF', wedge: 220, label: '삼산동 밤 기록' },
  { key: 'legal',       file: 'legal/index.html', accent: '#9FB6C4', wedge: 360, label: '19세 이상 합법 운영' },
];

const esc = (s) => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/**
 * 레이아웃 — 좌측 정렬 비대칭.
 * 기존 썸네일(정중앙 스택)과 배치를 통째로 다르게 가져간다.
 *   좌측 세로 바 → 업소명 → 역할 → 닉네임(초대형) → 전화 알약 → 라벨 → 도메인
 */
function buildSvg(p) {
  const X = 118;            // 좌측 텍스트 기준선
  const A = p.accent;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0%" stop-color="${BG_TOP}"/>
      <stop offset="100%" stop-color="${BG_BOT}"/>
    </linearGradient>
    <linearGradient id="pill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${PILL}"/>
      <stop offset="100%" stop-color="${PILL_EDGE}"/>
    </linearGradient>
  </defs>

  <rect width="${SIZE}" height="${SIZE}" fill="url(#bg)"/>

  <!-- 우상단 사선 웨지 (페이지마다 크기가 다름) -->
  <polygon points="${SIZE},0 ${SIZE},${p.wedge} ${SIZE - p.wedge},0" fill="${A}" opacity="0.16"/>
  <polygon points="${SIZE},0 ${SIZE},${Math.round(p.wedge * 0.45)} ${SIZE - Math.round(p.wedge * 0.45)},0" fill="${A}" opacity="0.30"/>

  <!-- 좌측 세로 포인트 바 + 하단 바 -->
  <rect x="0" y="0" width="26" height="${SIZE}" fill="${A}"/>
  <rect x="0" y="${SIZE - 18}" width="${SIZE}" height="18" fill="${A}"/>

  <!-- 업소명 -->
  <text x="${X}" y="172" font-family="${FONT}" font-size="64" font-weight="900"
        fill="${A}" letter-spacing="3">${esc(VENUE)}</text>

  <!-- 역할 -->
  <text x="${X}" y="256" font-family="${FONT}" font-size="48" font-weight="900"
        fill="#FFFFFF" opacity="0.72" letter-spacing="2">${esc(ROLE)}</text>

  <!-- 닉네임 — 가장 크게, 흰색 고대비 -->
  <text x="${X - 10}" y="628" font-family="${FONT}" font-size="286" font-weight="900"
        fill="#FFFFFF">${esc(NICK)}</text>

  <!-- 전화번호 — 알약 도형 위 흰 글씨 (축소 시 뭉개짐 방지) -->
  <rect x="${X - 8}" y="712" width="984" height="196" rx="98" fill="url(#pill)"/>
  <text x="${X - 8 + 492}" y="842" text-anchor="middle" font-family="${FONT}"
        font-size="122" font-weight="900" fill="#FFFFFF" letter-spacing="2">${esc(PHONE)}</text>

  <!-- 페이지별 라벨 -->
  <text x="${X}" y="1002" font-family="${FONT}" font-size="54" font-weight="900"
        fill="${A}" letter-spacing="2">${esc(p.label)}</text>

  <!-- 도메인 — 반드시 이 사이트 도메인 -->
  <text x="${X}" y="1086" font-family="${FONT}" font-size="46" font-weight="900"
        fill="#FFFFFF" opacity="0.62" letter-spacing="3">${esc(DOMAIN)}</text>
</svg>`;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const made = [];
  for (const p of PAGES) {
    const out = path.join(OUT_DIR, `thumb-${p.key}.png`);
    await sharp(Buffer.from(buildSvg(p))).png({ compressionLevel: 9 }).toFile(out);
    const meta = await sharp(out).metadata();
    if (meta.width !== SIZE || meta.height !== SIZE) {
      throw new Error(`${out} 크기 오류: ${meta.width}x${meta.height}`);
    }
    made.push({ key: p.key, out, w: meta.width, h: meta.height });
    console.log(`OK ${path.relative(ROOT, out)}  ${meta.width}x${meta.height}  ${Math.round(fs.statSync(out).size / 1024)}KB`);
  }
  console.log(`\n총 ${made.length}장 생성 완료.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
