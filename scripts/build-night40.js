'use strict';
/**
 * /night/{slug}/ 40개 업소 페이지 + /night/ 허브 생성기 (PAGE_ROUND 3)
 *
 * 지시서(2026-08-16) 구조:
 *  ① 도입 3~4문장(제목의 답은 글 끝에 예고) ② 핵심 3줄 직답 박스 ③ 사실 표(주소/역/연령/확인일)
 *  ④ 장면 소제목 4~6개(질문형 H2 2개 이상) ⑤ 맨 끝 제목의 답 ⑥ FAQ 3문항 ⑦ 한 줄 정리 박스
 *  · <title> = og:title = h1, 20~30자, 업소명 맨 앞
 *  · 고정 전화바 전 페이지: 📞 울산챔피언나이트 춘자 010-5653-0069 (바 전체 tel:)
 *  · 푸터 전 페이지: 광고문의 카톡 besta12 강조 박스 + 정직 고지 + 오늘 날짜
 *  · JSON-LD 전화: 광고주 3업소만 각자 번호
 *  · 내부링크: /night/ 허브 1 + 인접 지역 업소 2
 * 원고는 scripts/night40/*.js 에 업소별로 따로 들어 있다. 이 파일은 조립만 한다.
 * 기존 지역 키워드 페이지 13곳(/night/{지역}-night/)은 건드리지 않는다.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://ulsand.pages.dev';
const TODAY = '2026-08-16';
const TODAY_KO = '2026년 8월 16일';
const BRAND = '놀쿨';

const CALLBAR_TEL = '01056530069';
const CALLBAR_TEXT = '📞 울산챔피언나이트 춘자 010-5653-0069';

const ORDER = [
  'sillim-grandprix-night', 'sangbong-hangukgwan-night', 'suyu-shampoo-night', 'busan-asiad-night',
  'suwon-chance-dome-night', 'ansan-hit-night', 'daejeon-seven-night', 'ilsan-shampoo-night',
  'cheongdam-night', 'daejeon-one-night', 'changwon-lululala-night', 'bulgwang-hobak-night',
  'ulsan-champion-night', 'doksan-gukbingwan-night', 'dapsimni-miracle-night', 'gangseo-hobak-night',
  'yeongdeungpo-terminal-night', 'nowon-hobak-night', 'gildong-chance-night', 'paju-yadang-skydome-night',
  'guri-hobak-night', 'uijeongbu-hangukgwan-night', 'uijeongbu-baekakgwan-night', 'suwon-korea-night',
  'osan-hobak-night', 'indeogwon-gukbingwan-night', 'seongnam-shampoo-night', 'incheon-arabian-night',
  'bucheon-gorae-night', 'pyeongtaek-hobak-night', 'cheonan-stardome-night', 'cheonan-korea-night',
  'cheongju-hobak-night', 'ulsan-newworld-night', 'seosan-hobak-night', 'daegu-hobak-night',
  'gumi-hobak-night', 'gwangju-sangmu-night', 'gwangju-cheomdan-night', 'jejudo-night'
];

const REGION_ORDER = [
  'eunpyeong-night', 'changwon-night', 'ulsan-night', 'gangnam-night',
  'daejeon-night', 'sillim-night', 'sangbong-night', 'suyu-night',
  'busan-night', 'suwon-night', 'ansan-night', 'yucheon-night', 'ilsan-night'
];

const VERIFY = [
  '<meta name="naver-site-verification" content="174d09a203a44a83bcb250bc6bb68f6bc8da18ce" />',
  '<meta name="naver-site-verification" content="41b24f8a991cc367d7e961db787381b903041ae0" />',
  '<meta name="naver-site-verification" content="86086f8f927252a5021544b971d07b18a5e03a22" />',
  '<meta name="google-site-verification" content="HJjm7MRxykCQ7d_9L7glaTeeaWrmJIzAKY0BcNcfm88" />'
].join('\n');

const venues = ORDER.map((s) => require(path.join(__dirname, 'night40', s + '.js')));
const bySlug = Object.fromEntries(venues.map((v) => [v.slug, v]));

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const j = (o) => JSON.stringify(o, null, 2);

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
const palette = (v) => ({
  deep: hsl2hex(v.hue, 62, 19),
  mid: hsl2hex(v.hue, 58, 30),
  soft: hsl2hex(v.hue, 68, 96),
  line: hsl2hex(v.hue, 42, 82),
  ink: hsl2hex(v.hue, 58, 24)
});

/* ③ 사실 표 — 미확인 항목은 "공개 정보로 확인 불가" 정직 표기 */
function factRows(v) {
  const NA = '공개 정보로 확인 불가';
  const rows = [];
  let addrVal = NA;
  if (v.addr && v.addr.street) {
    addrVal = v.addr.street;
    if (v.addr.jibun) addrVal += ' (지번 ' + v.addr.jibun + ')';
    if (v.addr.floor) addrVal += ' · ' + v.addr.floor;
  } else if (v.landmark) {
    addrVal = v.addr.locality + ' ' + v.landmark + ' 일대 (도로명 주소는 ' + NA + ')';
  }
  rows.push(['주소', addrVal]);
  rows.push(['가까운 역', v.station || (v.noRail ? v.noRail : NA)]);
  rows.push(['출입 연령', v.age || NA]);
  if (v.contact) rows.push(['문의', v.contact.person + ' ' + v.contact.tel]);
  rows.push(['확인일', TODAY_KO]);
  return rows;
}

const callbar = () =>
  '<a class="callbar" href="tel:' + CALLBAR_TEL + '" aria-label="울산챔피언나이트 춘자에게 전화 연결">' + CALLBAR_TEXT + '</a>';

const footer = () => `<footer class="site-footer">
  <div class="ad-inquiry">광고문의 카톡: <strong>besta12</strong></div>
  <p class="footer-note">본 페이지는 업소 정보 제공 페이지입니다. 출입 연령 및 이용 규정은 각 업소 방침을 따릅니다.</p>
  <p class="footer-note">공개된 웹 정보를 정리했으며 실제와 다를 수 있습니다. 최종 수정 <time datetime="${TODAY}">${TODAY_KO}</time></p>
</footer>`;

function jsonld(v) {
  const url = SITE + '/night/' + v.slug + '/';
  const img = SITE + '/og/' + v.slug + '.png';
  const blocks = [];

  if (v.addr && (v.addr.street || v.addr.jibun)) {
    const address = {
      '@type': 'PostalAddress',
      streetAddress: v.addr.street || v.addr.jibun,
      addressLocality: v.addr.locality,
      addressRegion: v.addr.region,
      addressCountry: 'KR'
    };
    const club = {
      '@context': 'https://schema.org',
      '@type': 'NightClub',
      '@id': url + '#nightclub',
      name: v.name,
      url: url,
      image: [img],
      description: v.direct3.join(' ').replace(/<[^>]+>/g, ''),
      address: address,
      inLanguage: 'ko-KR'
    };
    if (v.nameAlt) club.alternateName = v.nameAlt;
    if (v.contact) club.telephone = v.contact.intl;
    blocks.push(club);
  }

  blocks.push({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': url + '#faq',
    mainEntity: v.faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a }
    }))
  });

  blocks.push({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': url + '#breadcrumb',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: '나이트', item: SITE + '/night/' },
      { '@type': 'ListItem', position: 3, name: v.name, item: url }
    ]
  });
  return blocks.map((o) => '<script type="application/ld+json">\n' + j(o) + '\n</script>').join('\n');
}

function pageCss(p) {
  return `
:root{--nt-deep:${p.deep};--nt-mid:${p.mid};--nt-soft:${p.soft};--nt-line:${p.line};--nt-ink:${p.ink};}
body{background:#fff;color:#15161a;padding-bottom:calc(84px + env(safe-area-inset-bottom,0px));}
.nt-header{background:var(--nt-deep);}
.nt-header .wrap{display:flex;align-items:center;justify-content:space-between;height:56px;}
.nt-header .logo{color:#fff;}
.nt-nav a{color:#fff;font-weight:700;font-size:.9rem;padding:10px;min-height:44px;display:inline-flex;align-items:center;}
.nt-hero{background:var(--nt-deep);color:#fff;padding:30px 0 26px;}
.nt-hero .nt-badge{display:inline-block;background:#fff;color:var(--nt-ink);font-weight:800;font-size:.78rem;padding:6px 12px;border-radius:999px;margin-bottom:12px;}
.nt-hero h1{font-size:clamp(1.34rem,5vw,1.9rem);font-weight:900;line-height:1.4;word-break:keep-all;}
.nt-hero .nt-lead{margin-top:12px;color:#fff;font-size:1rem;line-height:1.75;}
.nt-body{padding:26px 0 8px;background:#fff;}
.answer-box{border:2px solid var(--nt-line);background:var(--nt-soft);border-radius:12px;padding:14px 15px;margin:0 0 20px;}
.answer-box li{position:relative;padding:6px 0 6px 17px;font-size:1rem;line-height:1.7;color:#15161a;list-style:none;}
.answer-box li::before{content:"";position:absolute;left:0;top:15px;width:7px;height:7px;border-radius:2px;background:var(--nt-mid);}
.nt-facts{width:100%;border-collapse:collapse;margin:0 0 24px;font-size:.97rem;}
.nt-facts caption{text-align:left;font-weight:800;color:var(--nt-ink);padding-bottom:8px;}
.nt-facts th,.nt-facts td{border:1px solid var(--nt-line);padding:11px 12px;text-align:left;vertical-align:top;color:#15161a;}
.nt-facts th{background:var(--nt-soft);width:30%;font-weight:800;white-space:nowrap;}
.nt-scroll{overflow-x:auto;}
.nt-h2{font-size:clamp(1.14rem,4.3vw,1.4rem);font-weight:900;line-height:1.5;margin:30px 0 12px;padding-left:12px;border-left:5px solid var(--nt-mid);color:#15161a;word-break:keep-all;}
.nt-p{margin-bottom:12px;color:#26262c;line-height:1.8;}
.nt-bridge{margin:0 0 6px;color:#4B5563;font-size:.93rem;}
.nt-faq{margin:26px 0 8px;}
.nt-faq dt{font-weight:800;color:var(--nt-ink);padding:12px 0 4px;line-height:1.6;}
.nt-faq dd{color:#26262c;line-height:1.75;border-bottom:1px solid var(--nt-line);padding:0 0 12px;}
.nt-one{background:var(--nt-deep);color:#fff;border-radius:12px;padding:18px 16px;margin:30px 0 8px;font-weight:800;font-size:1.02rem;line-height:1.7;}
.nt-aside{margin:28px 0 6px;}
.nt-aside h2{font-size:1.05rem;font-weight:900;color:var(--nt-ink);margin-bottom:10px;}
.nt-aside a{display:block;padding:13px 12px;border:1px solid var(--nt-line);border-radius:10px;margin-bottom:9px;color:var(--nt-ink);font-weight:700;min-height:44px;}
.site-footer{background:#f4f4f5;padding:8px 16px 26px;}
.ad-inquiry{background:#ffd400;color:#111;font-weight:900;font-size:19px;padding:18px;text-align:center;border-radius:10px;margin:24px auto;max-width:720px;}
.footer-note{max-width:720px;margin:0 auto 6px;color:#3f3f46;font-size:.88rem;line-height:1.7;text-align:center;}
a.callbar{
  position:fixed; bottom:0; left:0; width:100%; z-index:9999;
  display:flex; align-items:center; justify-content:center; gap:10px;
  min-height:64px; box-sizing:border-box;
  padding:10px 12px calc(10px + env(safe-area-inset-bottom,0px));
  background:#111; color:#fff; font-weight:800; font-size:17px;
  text-decoration:none; text-align:center; line-height:1.3;
  box-shadow:0 -2px 14px rgba(0,0,0,.35);
  transform:translateZ(0); backface-visibility:hidden;
}
@media(max-width:480px){
  a.callbar{font-size:15px;}
  body{ padding-bottom:calc(80px + env(safe-area-inset-bottom,0px)); }
}
@media (prefers-color-scheme: dark){
  body{background:#101014;color:#f4f4f5;}
  .nt-body{background:#101014;}
  .answer-box{background:#191922;border-color:var(--nt-mid);}
  .answer-box li,.nt-p,.nt-facts th,.nt-facts td{color:#ececf1;}
  .nt-facts th{background:#191922;}
  .nt-h2{color:#ffffff;}
  .nt-faq dt{color:#ffffff;}
  .nt-faq dd{color:#ececf1;border-bottom-color:var(--nt-mid);}
  .nt-bridge{color:#c7c7d1;}
  .nt-aside h2,.nt-aside a{color:#ffffff;}
  .site-footer{background:#17171d;}
  .footer-note{color:#d4d4dd;}
}
`;
}

function metaBlock(o) {
  /* o: {title, description, url, img, ogAlt, type, keywords, geo, place, themeColor} */
  return `<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.description)}">
${o.keywords ? '<meta name="keywords" content="' + esc(o.keywords) + '">\n' : ''}<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
${o.geo ? '<meta name="geo.region" content="' + o.geo + '">\n<meta name="geo.placename" content="' + esc(o.place) + '">\n' : ''}<meta name="theme-color" content="${o.themeColor}">
<link rel="canonical" href="${o.url}">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.description)}">
<meta property="og:type" content="${o.type}">
<meta property="og:url" content="${o.url}">
<meta property="og:locale" content="ko_KR">
<meta property="og:site_name" content="${BRAND} 나이트 소개">
<meta property="og:image" content="${o.img}">
<meta property="og:image:secure_url" content="${o.img}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="1200">
<meta property="og:image:type" content="image/png">
<meta property="og:image:alt" content="${esc(o.ogAlt)}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${esc(o.title)}">
<meta name="twitter:description" content="${esc(o.description)}">
<meta name="twitter:image" content="${o.img}">
<meta name="thumbnail" content="${o.img}">`;
}

function buildPage(v) {
  const p = palette(v);
  const url = SITE + '/night/' + v.slug + '/';
  const img = SITE + '/og/' + v.slug + '.png';
  const rows = factRows(v);

  const sections = v.sections.map((s) => {
    const P = (arr) => arr.map((t) => '        <p class="nt-p">' + t + '</p>').join('\n');
    const br = s.bridge ? '\n        <p class="nt-bridge">' + esc(s.bridge) + '</p>' : '';
    return '      <section>\n        <h2 class="nt-h2">' + esc(s.h2) + '</h2>\n' + P(s.ps) + br + '\n      </section>';
  }).join('\n\n');

  const table =
    '      <div class="nt-scroll">\n        <table class="nt-facts">\n' +
    '          <caption>' + esc(v.name) + ' 확인 정보</caption>\n          <tbody>\n' +
    rows.map((r) => '            <tr><th scope="row">' + esc(r[0]) + '</th><td>' + esc(r[1]) + '</td></tr>').join('\n') +
    '\n          </tbody>\n        </table>\n      </div>\n';

  const faqHtml =
    '      <section class="nt-faq" aria-labelledby="faq-title">\n' +
    '        <h2 class="nt-h2" id="faq-title">자주 묻는 질문</h2>\n        <dl>\n' +
    v.faq.map((f) => '          <dt>Q. ' + esc(f.q) + '</dt>\n          <dd>' + esc(f.a) + '</dd>').join('\n') +
    '\n        </dl>\n      </section>';

  const links = v.links.map((slug) => {
    const t = bySlug[slug];
    if (!t) throw new Error('링크 대상 없음: ' + slug);
    return '      <a href="/night/' + t.slug + '/">' + esc(t.name) + ' 이야기 읽기</a>';
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${VERIFY}
${metaBlock({ title: v.title, description: v.description, url, img, ogAlt: v.ogAlt, type: 'article', keywords: v.keywords, geo: v.addr.geo, place: v.addr.locality, themeColor: p.deep })}
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="icon" type="image/png" href="/favicon-192.png">
<link rel="apple-touch-icon" href="/favicon-192.png">
<link rel="stylesheet" href="/style.css">
<style>${pageCss(p)}</style>
${jsonld(v)}
</head>
<body>
<a href="#main" class="skip-to-main">본문 바로가기</a>

<header class="header nt-header">
  <div class="wrap">
    <a href="/night/" class="logo">전국 나이트 이야기</a>
    <nav class="nt-nav" aria-label="주요 메뉴">
      <a href="/">홈</a>
      <a href="/night/">목록</a>
    </nav>
  </div>
</header>

<main id="main">

  <article>
    <header class="nt-hero">
      <div class="wrap">
        <span class="nt-badge">${esc(v.heroBadge)}</span>
        <h1>${esc(v.title)}</h1>
        <p class="nt-lead">${esc(v.lead)}</p>
      </div>
    </header>

    <div class="nt-body">
      <div class="wrap">

      <div class="answer-box">
        <ul>
${v.direct3.map((s) => '          <li>' + s + '</li>').join('\n')}
        </ul>
      </div>

${table}
${sections}

${faqHtml}

      <p class="nt-one">${esc(v.oneLine)}</p>

      </div>
    </div>
  </article>

  <aside class="nt-aside" aria-labelledby="aside-title">
    <div class="wrap">
      <h2 id="aside-title">이어서 읽기</h2>
      <a href="/night/">전국 나이트 이야기 전체 목록</a>
${links}
    </div>
  </aside>

</main>

${footer()}

${callbar()}

</body>
</html>
`;
}

const HUB_TITLE = '전국 나이트 40곳, 밤의 지도를 한 장에';
const HUB_DESC = '서울부터 제주까지 나이트 40곳의 밤을 이야기로 담았습니다. 업소명을 누르면 위치와 장면이 담긴 소개 글로 이어집니다.';

function buildHub() {
  const p = { deep: '#1f2430', mid: '#39415a', soft: '#f3f4f8', line: '#d8dbe6', ink: '#232838' };
  const url = SITE + '/night/';
  const img = SITE + '/og/night-hub.png';
  const items = venues.map((v) => {
    const loc = v.addr.street ? v.addr.street : (v.addr.locality + (v.landmark ? ' ' + v.landmark : ''));
    return '      <a href="/night/' + v.slug + '/">' + esc(v.name) + ' — ' + esc(loc) + '</a>';
  }).join('\n');
  const regionPages = REGION_ORDER.map((s) => require(path.join(__dirname, 'region', s + '.js')));
  const regionItems = regionPages.map((r) =>
    '      <a href="/night/' + r.slug + '/">' + esc(r.kw) + ' ' + esc(r.suffix) + ' — ' + esc(r.region) + '</a>'
  ).join('\n');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${VERIFY}
${metaBlock({ title: HUB_TITLE, description: HUB_DESC, url, img, ogAlt: '전국 나이트 이야기 — 광고문의 카카오톡 besta12', type: 'website', keywords: null, geo: null, place: null, themeColor: p.deep })}
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="icon" type="image/png" href="/favicon-192.png">
<link rel="apple-touch-icon" href="/favicon-192.png">
<link rel="stylesheet" href="/style.css">
<style>${pageCss(p)}</style>
<script type="application/ld+json">
${j({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  '@id': url + '#collection',
  name: HUB_TITLE,
  url: url,
  inLanguage: 'ko-KR',
  hasPart: venues.map((v) => ({ '@type': 'WebPage', name: v.name, url: SITE + '/night/' + v.slug + '/' }))
})}
</script>
</head>
<body>
<a href="#main" class="skip-to-main">본문 바로가기</a>
<header class="header nt-header">
  <div class="wrap">
    <a href="/night/" class="logo">전국 나이트 이야기</a>
    <nav class="nt-nav" aria-label="주요 메뉴"><a href="/">홈</a></nav>
  </div>
</header>
<main id="main">
  <article>
    <header class="nt-hero"><div class="wrap">
      <h1>${esc(HUB_TITLE)}</h1>
      <p class="nt-lead">서울, 경기, 충청, 영남, 호남, 제주. 도시마다 밤이 켜지는 자리가 있고 그 자리마다 다른 이야기가 있습니다. 마흔 곳의 문 앞까지 다녀온 기록을 지역 순서로 놓았습니다.</p>
    </div></header>
    <div class="nt-body"><div class="wrap">
      <section class="nt-aside" aria-labelledby="hub-list">
        <h2 class="nt-h2" id="hub-list">업소별 이야기 40곳</h2>
${items}
      </section>
      <section class="nt-aside" aria-labelledby="hub-region">
        <h2 class="nt-h2" id="hub-region">지역별 안내 글</h2>
${regionItems}
      </section>
    </div></div>
  </article>
</main>
${footer()}
${callbar()}
</body>
</html>
`;
}

/* 실행 */
if (require.main === module) {
  venues.forEach((v) => {
    const dir = path.join(ROOT, 'night', v.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), buildPage(v));
  });
  fs.writeFileSync(path.join(ROOT, 'night', 'index.html'), buildHub());
  console.log('built', venues.length, 'venue pages + hub');
}

module.exports = { ORDER, REGION_ORDER, SITE, TODAY, TODAY_KO, HUB_TITLE, CALLBAR_TEL, CALLBAR_TEXT };
