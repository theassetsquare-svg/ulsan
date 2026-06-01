#!/usr/bin/env node
// 8 페이지에 Schema.org 5종 @graph 일괄 주입 (영구 룰: AggregateRating 금지)
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TODAY = '2026-05-21T00:00:00+09:00';
const BASE = 'https://ulsan.pages.dev';

const pages = [
  { file: 'index.html',       slug: '',                  name: '홈',        title: '울산챔피언나이트 — 한 번 갔다가 단골 된 사람들의 비밀' },
  { file: 'story.html',       slug: 'story.html',        name: '이야기',    title: '울산챔피언나이트 이야기 — 어떻게 이 도시 밤의 중심이 되었나' },
  { file: 'atmosphere.html',  slug: 'atmosphere.html',   name: '분위기',    title: '울산챔피언나이트 분위기 — 사운드·조명·댄스플로어 직접 보기' },
  { file: 'first-visit.html', slug: 'first-visit.html',  name: '첫방문',    title: '울산챔피언나이트 첫 방문 가이드 — 처음 가는 사람을 위한 완벽 정리' },
  { file: 'access.html',      slug: 'access.html',       name: '오시는길',  title: '울산챔피언나이트 오시는길 — 삼산동 위치·주차·교통편' },
  { file: 'review.html',      slug: 'review.html',       name: '후기',      title: '울산챔피언나이트 후기 — 단골들이 직접 말하는 솔직한 이야기' },
  { file: 'faq.html',         slug: 'faq.html',          name: 'FAQ',       title: '울산챔피언나이트 자주 묻는 질문 — 13가지 답변' },
  { file: 'contact.html',     slug: 'contact.html',      name: '연락처',    title: '울산챔피언나이트 예약·문의 — 춘자 010-5653-0069' }
];

function buildGraph(p) {
  const pageUrl = `${BASE}/${p.slug}`;
  const breadcrumb = [
    { '@type': 'ListItem', position: 1, name: '홈', item: `${BASE}/` }
  ];
  if (p.slug) {
    breadcrumb.push({ '@type': 'ListItem', position: 2, name: p.name, item: pageUrl });
  }
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${BASE}/#website`,
        name: '울산챔피언나이트',
        url: `${BASE}/`,
        inLanguage: 'ko-KR',
        publisher: { '@id': `${BASE}/#org` }
      },
      {
        '@type': 'Organization',
        '@id': `${BASE}/#org`,
        name: '울산챔피언나이트',
        url: `${BASE}/`,
        telephone: '+82-10-5653-0069',
        logo: `${BASE}/og/og-thumb.png`
      },
      {
        '@type': 'NightClub',
        '@id': `${BASE}/#nightclub`,
        name: '울산챔피언나이트',
        url: `${BASE}/`,
        telephone: '+82-10-5653-0069',
        image: `${BASE}/og/og-thumb.png`,
        description: '삼산동 대형 합법 나이트클럽. 풀스케일 사운드·조명·댄스플로어·VIP 라운지.',
        address: {
          '@type': 'PostalAddress',
          addressLocality: '울산광역시 남구 삼산동',
          addressRegion: '울산',
          addressCountry: 'KR'
        },
        openingHoursSpecification: [{
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
          opens: '20:00',
          closes: '05:00'
        }],
        acceptsReservations: true,
        priceRange: '$$',
        currenciesAccepted: 'KRW',
        paymentAccepted: '신용카드, 체크카드, 카카오페이, 네이버페이, 현금',
        smokingAllowed: false
      },
      {
        '@type': 'LocalBusiness',
        '@id': `${BASE}/#localbusiness`,
        name: '울산챔피언나이트',
        telephone: '+82-10-5653-0069',
        url: `${BASE}/`,
        image: `${BASE}/og/og-thumb.png`,
        address: {
          '@type': 'PostalAddress',
          addressLocality: '울산광역시 남구 삼산동',
          addressRegion: '울산',
          addressCountry: 'KR'
        },
        areaServed: ['울산광역시', '부산광역시', '경주시', '양산시'],
        priceRange: '$$'
      },
      {
        '@type': 'Article',
        '@id': `${pageUrl}#article`,
        mainEntityOfPage: pageUrl,
        headline: p.title,
        datePublished: TODAY,
        dateModified: TODAY,
        author: { '@type': 'Person', name: '춘자' },
        publisher: { '@id': `${BASE}/#org` },
        image: `${BASE}/og/og-thumb.png`,
        inLanguage: 'ko-KR'
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        itemListElement: breadcrumb
      }
    ]
  };
}

const SCHEMA_BLOCK_RE = /<script type="application\/ld\+json">[\s\S]*?"@type":\s*"NightClub"[\s\S]*?<\/script>/;

let total = 0;
for (const p of pages) {
  const filePath = path.join(ROOT, p.file);
  let html = fs.readFileSync(filePath, 'utf8');
  const before = html;
  const graph = JSON.stringify(buildGraph(p), null, 2);
  const newBlock = `<script type="application/ld+json">\n${graph}\n</script>`;
  if (SCHEMA_BLOCK_RE.test(html)) {
    html = html.replace(SCHEMA_BLOCK_RE, () => newBlock);
  } else {
    console.warn(`[WARN] ${p.file}: NightClub schema block not found`);
  }
  if (html !== before) {
    fs.writeFileSync(filePath, html, 'utf8');
    total++;
    console.log(`[OK] ${p.file}`);
  } else {
    console.log(`[SKIP] ${p.file} (no change)`);
  }
}
console.log(`Updated ${total}/${pages.length} pages.`);
