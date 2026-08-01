/**
 * 생성된 1:1 썸네일을 각 페이지의 메타 태그 / JSON-LD에 연결한다.
 *
 * 페이지 전환 시 아래 5개가 전부 같이 바뀌어야 검색엔진이 페이지별 썸네일을 잡는다:
 *   og:image / og:image:secure_url / twitter:image / name="thumbnail"(네이버) / link rel="image_src"
 *
 * 실행: node scripts/apply-og-thumbs.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ORIGIN = 'https://ulsana.pages.dev';
const OLD = `${ORIGIN}/og/og-thumb.png`;

// og:image:alt — 페이지마다 전부 다르게. 타 랜딩의 "업소명 닉네임 번호" 패턴과도 다르게 쓴다.
const PAGES = [
  { key: 'home',        file: 'index.html',
    alt: '울산챔피언나이트 예약 담당 실장 춘자 · 삼산동 울산나이트 종합 안내 · 010-5653-0069' },
  { key: 'access',      file: 'access.html',
    alt: '삼산동 울산챔피언나이트 오시는 길 안내판 · 실장 춘자 직통 010-5653-0069' },
  { key: 'atmosphere',  file: 'atmosphere.html',
    alt: '울산챔피언나이트 매장 분위기 미리보기 카드 · 예약 담당 실장 춘자 010-5653-0069' },
  { key: 'contact',     file: 'contact.html',
    alt: '울산챔피언나이트 예약 문의 직통 연결 · 실장 춘자 상담 010-5653-0069' },
  { key: 'faq',         file: 'faq.html',
    alt: '울산챔피언나이트 자주 묻는 질문 정리 · 예약 담당 실장 춘자 010-5653-0069' },
  { key: 'first-visit', file: 'first-visit.html',
    alt: '울산챔피언나이트 첫 방문 입문 가이드 · 실장 춘자 안내 010-5653-0069' },
  { key: 'review',      file: 'review.html',
    alt: '울산챔피언나이트 단골 실명 후기 모음 · 예약 담당 실장 춘자 010-5653-0069' },
  { key: 'story',       file: 'story.html',
    alt: '삼산동 울산챔피언나이트 밤 기록 이야기 · 실장 춘자 010-5653-0069' },
  { key: 'legal',       file: 'legal/index.html',
    alt: '울산챔피언나이트 19세 이상 합법 운영 안내 · 실장 춘자 010-5653-0069' },
];

const urlFor = (key) => `${ORIGIN}/og/thumb-${key}.png`;
const ALL = PAGES.map((p) => urlFor(p.key));

const attrEsc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/** 사업장 엔티티 노드는 새 이미지 전체를, 문서 노드는 자기 이미지를 갖는다. */
const ENTITY_TYPES = new Set(['NightClub', 'LocalBusiness', 'Organization']);

function rewriteJsonLd(html, self) {
  const re = /(<script type="application\/ld\+json">\s*)([\s\S]*?)(\s*<\/script>)/g;
  let count = 0;
  const out = html.replace(re, (m, open, body, close) => {
    let data;
    try {
      data = JSON.parse(body);
    } catch (e) {
      throw new Error('기존 JSON-LD 파싱 실패: ' + e.message);
    }
    const ordered = [self, ...ALL.filter((u) => u !== self)];
    const visit = (node) => {
      if (Array.isArray(node)) return node.forEach(visit);
      if (!node || typeof node !== 'object') return;
      if (typeof node['@type'] === 'string') {
        if (node.logo === OLD) node.logo = self;
        if ('image' in node) {
          node.image = ENTITY_TYPES.has(node['@type']) ? ordered : [self];
        }
      }
      Object.values(node).forEach(visit);
    };
    visit(data);
    count++;
    return open + JSON.stringify(data, null, 2) + close;
  });
  if (count === 0) throw new Error('JSON-LD 블록을 찾지 못함');
  // 재직렬화 결과가 유효한지 즉시 확인
  for (const [, body] of out.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    JSON.parse(body);
  }
  return out;
}

let changed = 0;
for (const p of PAGES) {
  const fp = path.join(ROOT, p.file);
  let html = fs.readFileSync(fp, 'utf8');
  const self = urlFor(p.key);

  // 1) JSON-LD 먼저 (아직 OLD 문자열이 살아 있을 때 처리)
  html = rewriteJsonLd(html, self);

  // 2) 남은 모든 og-thumb.png 참조를 이 페이지 전용 이미지로 교체
  html = html.split(OLD).join(self);

  // 3) og:image:alt 를 페이지 고유 문구로
  html = html.replace(
    /<meta property="og:image:alt" content="[^"]*">/,
    `<meta property="og:image:alt" content="${attrEsc(p.alt)}">`
  );

  // 4) 네이버용 thumbnail + image_src 보강 (없을 때만 추가)
  if (!/name="thumbnail"/.test(html)) {
    html = html.replace(
      /(<meta name="twitter:image" content="[^"]*">)/,
      `$1\n<meta name="thumbnail" content="${self}">`
    );
  }
  if (!/rel="image_src"/.test(html)) {
    html = html.replace(
      /(<meta name="thumbnail" content="[^"]*">)/,
      `$1\n<link rel="image_src" href="${self}">`
    );
  }

  // 5) og:image:width/height/type 선언 보장
  if (!/og:image:width/.test(html)) {
    html = html.replace(
      /(<meta property="og:image:secure_url" content="[^"]*">)/,
      `$1\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="1200">\n<meta property="og:image:type" content="image/png">`
    );
  }

  fs.writeFileSync(fp, html);
  changed++;
  console.log(`OK ${p.file} -> og/thumb-${p.key}.png`);
}
console.log(`\n${changed}개 페이지 갱신 완료.`);
