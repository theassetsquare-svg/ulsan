'use strict';
/**
 * /night/{slug}/ 13개 페이지 + /night/ 허브 생성기
 *
 * SITE_INDEX = 1  → 각도: 위치·찾아가는 길 / 어투: 안내형 담백체 / H2 시작: 위치
 * 원고는 scripts/night/*.js 에 업소별로 따로 들어 있다. 이 파일은 조립만 한다.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://ulsand.pages.dev';
const TODAY = '2026-08-15';
const BRAND = '놀쿨';

const ORDER = [
  'bulgwang-hobak-night', 'changwon-lululala-night', 'ulsan-champion-night', 'cheongdam-night',
  'daejeon-one-night', 'sillim-grandprix-night', 'sangbong-hangukgwan-night', 'suyu-shampoo-night',
  'busan-asiad-night', 'suwon-chance-dome-night', 'ansan-hit-night', 'daejeon-seven-night',
  'ilsan-shampoo-night'
];

const VERIFY = [
  '<meta name="naver-site-verification" content="174d09a203a44a83bcb250bc6bb68f6bc8da18ce" />',
  '<meta name="naver-site-verification" content="41b24f8a991cc367d7e961db787381b903041ae0" />',
  '<meta name="naver-site-verification" content="86086f8f927252a5021544b971d07b18a5e03a22" />',
  '<meta name="google-site-verification" content="HJjm7MRxykCQ7d_9L7glaTeeaWrmJIzAKY0BcNcfm88" />'
].join('\n');

const venues = ORDER.map((s) => require(path.join(__dirname, 'night', s + '.js')));
const bySlug = Object.fromEntries(venues.map((v) => [v.slug, v]));

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const j = (o) => JSON.stringify(o, null, 2);

/* hue → 배경/강조색. 13개 hue가 전부 달라 배경색도 전부 다르다. */
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
  deep: hsl2hex(v.hue, 65, 20),
  mid: hsl2hex(v.hue, 60, 30),
  soft: hsl2hex(v.hue, 70, 96),
  line: hsl2hex(v.hue, 45, 82),
  ink: hsl2hex(v.hue, 60, 24)
});

/* 핵심 정보 표 — 확인 불가 항목은 행 자체를 만들지 않는다 */
function factRows(v) {
  const rows = [];
  if (v.addr && v.addr.street) {
    let val = v.addr.street;
    if (v.addr.jibun) val += ' (지번 ' + v.addr.jibun + ')';
    if (v.addr.floor) val += ' · ' + v.addr.floor;
    rows.push(['위치', val]);
  } else if (v.landmark) {
    rows.push(['위치', v.landmark + ' · ' + v.addr.locality]);
  }
  if (v.station) rows.push(['가장 가까운 역', v.station]);
  if (v.hours) rows.push(['영업 안내', v.hours]);
  if (v.age) rows.push(['출입 연령', v.age]);
  if (v.contact) rows.push(['문의', v.contact.person + ' ' + v.contact.tel]);
  return rows;
}

function callbar(v) {
  if (v.group === 'A') {
    return '<div class="callbar" role="complementary" aria-label="전화 연결">\n' +
      '  <a href="tel:' + v.contact.raw + '">📞 ' + esc(v.contact.person) + ' ' + esc(v.contact.tel) + '</a>\n' +
      '</div>';
  }
  return '<div class="callbar" role="complementary" aria-label="광고 제휴 문의">\n' +
    '  <span>광고·제휴 입점 문의 카톡 <b>besta12</b></span>\n' +
    '</div>';
}

function jsonld(v) {
  const url = SITE + '/night/' + v.slug + '/';
  const img = SITE + '/og/' + v.slug + '-og.png';
  const address = { '@type': 'PostalAddress' };
  if (v.addr.street) address.streetAddress = v.addr.street;
  address.addressLocality = v.addr.locality;
  address.addressRegion = v.addr.region;
  address.addressCountry = 'KR';

  const club = {
    '@context': 'https://schema.org',
    '@type': 'NightClub',
    '@id': url + '#nightclub',
    name: v.name,
    url: url,
    image: [img],
    description: v.answer.replace(/<[^>]+>/g, ''),
    address: address,
    inLanguage: 'ko-KR'
  };
  if (v.contact) club.telephone = v.contact.intl;
  if (v.ageRange) club.typicalAgeRange = v.ageRange;

  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': url + '#faq',
    mainEntity: v.sections.map((s) => ({
      '@type': 'Question',
      name: s.h2,
      acceptedAnswer: { '@type': 'Answer', text: s.ps.join(' ') }
    }))
  };

  const crumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': url + '#breadcrumb',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: '나이트', item: SITE + '/night/' },
      { '@type': 'ListItem', position: 3, name: v.name, item: url }
    ]
  };
  return [club, faq, crumb].map((o) => '<script type="application/ld+json">\n' + j(o) + '\n</script>').join('\n');
}

function pageCss(p) {
  return `
:root{--nt-deep:${p.deep};--nt-mid:${p.mid};--nt-soft:${p.soft};--nt-line:${p.line};--nt-ink:${p.ink};}
body{background:#fff;color:#15161a;padding-bottom:calc(84px + env(safe-area-inset-bottom,0px));}
.nt-header{background:var(--nt-deep);}
.nt-header .logo{color:#fff;}
.nt-header .nt-home{color:#fff;font-weight:700;font-size:.9rem;padding:10px;min-height:44px;display:flex;align-items:center;}
.nt-hero{background:var(--nt-deep);color:#fff;padding:34px 0 30px;}
.nt-hero .nt-badge{display:inline-block;background:#fff;color:var(--nt-ink);font-weight:800;font-size:.78rem;padding:6px 12px;border-radius:999px;margin-bottom:12px;}
.nt-hero h1{font-size:clamp(1.5rem,5.6vw,2.05rem);font-weight:900;line-height:1.35;}
.nt-hero .nt-lead{margin-top:12px;color:#fff;font-size:1rem;line-height:1.75;}
.nt-body{padding:34px 0 8px;background:#fff;}
.answer-box{border:2px solid var(--nt-line);background:var(--nt-soft);border-radius:12px;padding:18px 16px;margin:0 0 26px;}
.answer-box p{font-size:1rem;line-height:1.8;color:#15161a;}
.nt-facts{width:100%;border-collapse:collapse;margin:0 0 26px;font-size:.97rem;}
.nt-facts caption{text-align:left;font-weight:800;color:var(--nt-ink);padding-bottom:8px;}
.nt-facts th,.nt-facts td{border:1px solid var(--nt-line);padding:11px 12px;text-align:left;vertical-align:top;color:#15161a;}
.nt-facts th{background:var(--nt-soft);width:34%;font-weight:800;white-space:nowrap;}
.nt-scroll{overflow-x:auto;}
.nt-h2{font-size:clamp(1.16rem,4.4vw,1.42rem);font-weight:900;line-height:1.5;margin:32px 0 12px;padding-left:12px;border-left:5px solid var(--nt-mid);color:#15161a;}
.nt-p{margin-bottom:13px;color:#26262c;line-height:1.8;}
.nt-bridge{margin:0 0 6px;color:#4B5563;font-size:.93rem;}
.nt-sum{background:var(--nt-soft);border:1px solid var(--nt-line);border-radius:12px;padding:18px 16px;margin:32px 0 8px;}
.nt-sum h2{font-size:1.05rem;font-weight:900;color:var(--nt-ink);margin-bottom:10px;}
.nt-sum li{padding:6px 0 6px 16px;position:relative;color:#26262c;line-height:1.75;}
.nt-sum li::before{content:"";position:absolute;left:0;top:15px;width:7px;height:7px;border-radius:50%;background:var(--nt-mid);}
.nt-links{margin:30px 0 6px;}
.nt-links h2{font-size:1.05rem;font-weight:900;color:var(--nt-ink);margin-bottom:10px;}
.nt-links a{display:block;padding:13px 12px;border:1px solid var(--nt-line);border-radius:10px;margin-bottom:9px;color:var(--nt-ink);font-weight:700;min-height:44px;}
.site-footer{background:#f4f4f5;padding:8px 16px 26px;}
.ad-inquiry{background:#ffd400;color:#111;font-weight:900;font-size:18px;padding:16px;text-align:center;border-radius:10px;margin:24px auto;max-width:720px;}
.footer-note{max-width:720px;margin:0 auto;color:#3f3f46;font-size:.88rem;line-height:1.7;text-align:center;}
.callbar{
  position:fixed; left:0; right:0; bottom:0; z-index:99999;
  display:flex; align-items:center; justify-content:center; gap:12px;
  height:64px; box-sizing:content-box;
  padding-bottom:env(safe-area-inset-bottom,0px);
  background:#111; color:#fff; font-weight:800; font-size:18px;
  box-shadow:0 -2px 14px rgba(0,0,0,.35);
  transform:translateZ(0); backface-visibility:hidden;
}
.callbar a{color:#fff; text-decoration:none; display:flex; align-items:center; height:100%;}
@media(max-width:480px){
  .callbar{height:60px; font-size:16px;}
  body{ padding-bottom:calc(80px + env(safe-area-inset-bottom,0px)); }
}
@media (prefers-color-scheme: dark){
  body{background:#101014;color:#f4f4f5;}
  .nt-body{background:#101014;}
  .answer-box{background:#191922;border-color:var(--nt-mid);}
  .answer-box p,.nt-p,.nt-facts th,.nt-facts td,.nt-sum li{color:#ececf1;}
  .nt-facts th{background:#191922;}
  .nt-h2{color:#ffffff;}
  .nt-sum{background:#191922;border-color:var(--nt-mid);}
  .nt-sum h2,.nt-links h2,.nt-links a{color:#ffffff;}
  .nt-bridge{color:#c7c7d1;}
  .site-footer{background:#17171d;}
  .footer-note{color:#d4d4dd;}
}
`;
}

function buildPage(v) {
  const p = palette(v);
  const url = SITE + '/night/' + v.slug + '/';
  const img = SITE + '/og/' + v.slug + '-og.png';
  const rows = factRows(v);

  const sections = v.sections.map((s) => {
    const ps = s.ps.map((t) => '      <p class="nt-p">' + t + '</p>').join('\n');
    const br = s.bridge ? '\n      <p class="nt-bridge">' + s.bridge + '</p>' : '';
    return '      <h2 class="nt-h2">' + esc(s.h2) + '</h2>\n' + ps + br;
  }).join('\n\n');

  const table = rows.length ? (
    '      <div class="nt-scroll">\n        <table class="nt-facts">\n' +
    '          <caption>' + esc(v.name) + ' 핵심 정보</caption>\n          <tbody>\n' +
    rows.map((r) => '            <tr><th scope="row">' + esc(r[0]) + '</th><td>' + esc(r[1]) + '</td></tr>').join('\n') +
    '\n          </tbody>\n        </table>\n      </div>\n') : '';

  const links = v.links.map((l) => {
    const t = bySlug[l.slug];
    if (!t) throw new Error('링크 대상 없음: ' + l.slug);
    return '        <a href="/night/' + t.slug + '/">' + esc(l.text) + '</a>';
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${VERIFY}
<title>${esc(v.title)}</title>
<meta name="description" content="${esc(v.description)}">
<meta name="keywords" content="${esc(v.keywords)}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
<meta name="geo.region" content="${v.addr.geo}">
<meta name="geo.placename" content="${esc(v.addr.locality)}">
<meta name="theme-color" content="${p.deep}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${esc(v.title)}">
<meta property="og:description" content="${esc(v.description)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${url}">
<meta property="og:locale" content="ko_KR">
<meta property="og:site_name" content="${BRAND} 나이트 정보">
<meta property="og:image" content="${img}">
<meta property="og:image:secure_url" content="${img}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="1200">
<meta property="og:image:type" content="image/png">
<meta property="og:image:alt" content="${esc(v.ogAlt)}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${esc(v.title)}">
<meta name="twitter:description" content="${esc(v.description)}">
<meta name="twitter:image" content="${img}">
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
    <a href="/night/" class="logo">나이트 위치 안내</a>
    <a href="/" class="nt-home">홈</a>
  </div>
</header>

<main id="main">

<section class="nt-hero">
  <div class="wrap">
    <span class="nt-badge">${esc(v.heroBadge)}</span>
    <h1>${esc(v.name)}</h1>
    <p class="nt-lead">${esc(v.lead)}</p>
  </div>
</section>

<section class="nt-body">
  <div class="wrap">

    <div class="answer-box">
      <p>${v.answer}</p>
    </div>

${table}
${sections}

    <div class="nt-sum">
      <h2>${esc(v.name)} 핵심 3줄 요약</h2>
      <ul>
${v.summary.map((s) => '        <li>' + esc(s) + '</li>').join('\n')}
      </ul>
    </div>

    <nav class="nt-links" aria-label="가까운 지역 안내">
      <h2>같이 보면 좋은 위치 안내</h2>
${links}
    </nav>

  </div>
</section>

</main>

<footer class="site-footer">
  <div class="ad-inquiry">
    광고·제휴 입점 문의 &nbsp;|&nbsp; 카카오톡 ID <strong>besta12</strong>
  </div>
  <p class="footer-note">본 페이지는 업소 정보 제공 페이지입니다. 출입 연령 및 이용 규정은 각 업소 방침을 따릅니다.</p>
</footer>

${callbar(v)}

</body>
</html>
`;
}

function buildHub() {
  const p = { deep: '#1f2430', mid: '#39415a', soft: '#f3f4f8', line: '#d8dbe6', ink: '#232838' };
  const items = venues.map((v) => {
    const loc = v.addr.street ? v.addr.street : (v.landmark + ' · ' + v.addr.locality);
    return '        <a href="/night/' + v.slug + '/">' + esc(v.name) + ' — ' + esc(loc) + '</a>';
  }).join('\n');
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${VERIFY}
<title>나이트 위치 안내 13곳 목록</title>
<meta name="description" content="지역별 나이트 13곳의 확인된 주소와 가장 가까운 역을 한 곳에 모았습니다. 각 페이지에서 진입 동선과 확인되지 않은 항목까지 확인할 수 있습니다.">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${SITE}/night/">
<meta property="og:title" content="나이트 위치 안내 13곳 목록">
<meta property="og:description" content="지역별 나이트 13곳의 확인된 주소와 가장 가까운 역을 한 곳에 모았습니다.">
<meta property="og:type" content="website">
<meta property="og:url" content="${SITE}/night/">
<meta property="og:locale" content="ko_KR">
<meta name="twitter:card" content="summary">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="stylesheet" href="/style.css">
<style>${pageCss(p)}</style>
</head>
<body>
<a href="#main" class="skip-to-main">본문 바로가기</a>
<header class="header nt-header">
  <div class="wrap">
    <a href="/night/" class="logo">나이트 위치 안내</a>
    <a href="/" class="nt-home">홈</a>
  </div>
</header>
<main id="main">
<section class="nt-hero"><div class="wrap">
  <h1>나이트 위치 안내</h1>
  <p class="nt-lead">지역별 13곳의 확인된 주소와 가장 가까운 역을 모았습니다.</p>
</div></section>
<section class="nt-body"><div class="wrap">
  <nav class="nt-links" aria-label="지역별 안내 목록">
    <h2>지역별 목록</h2>
${items}
  </nav>
</div></section>
</main>
<footer class="site-footer">
  <div class="ad-inquiry">
    광고·제휴 입점 문의 &nbsp;|&nbsp; 카카오톡 ID <strong>besta12</strong>
  </div>
  <p class="footer-note">본 페이지는 업소 정보 제공 페이지입니다. 출입 연령 및 이용 규정은 각 업소 방침을 따릅니다.</p>
</footer>
<div class="callbar" role="complementary" aria-label="광고 제휴 문의">
  <span>광고·제휴 입점 문의 카톡 <b>besta12</b></span>
</div>
</body>
</html>
`;
}

function main() {
  venues.forEach((v) => {
    const dir = path.join(ROOT, 'night', v.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), buildPage(v));
  });
  fs.writeFileSync(path.join(ROOT, 'night', 'index.html'), buildHub());
  console.log('OK  night/ 페이지 ' + venues.length + '개 + 허브 1개 생성');
}
main();

module.exports = { ORDER, venues, SITE, TODAY, factRows };
