'use strict';
/**
 * /night/{slug}/ 13개 페이지 + /night/ 허브 생성기
 *
 * SITE_INDEX = 1 → 페이지마다 각도가 다르다.
 *   각도번호 = ((SITE_INDEX - 1) + (업소번호 - 1)) mod 13 + 1  →  업소번호 n = 각도 n
 *   제목 접미어 = 그 각도 접미어 풀의 [업소번호]번째
 * 원고는 scripts/night/*.js 에 업소별로 따로 들어 있다. 이 파일은 조립만 한다.
 * 같은 slug 디렉터리를 그대로 덮어쓴다. -2 형태의 중복 URL을 만들지 않는다.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://ulsand.pages.dev';
const TODAY = '2026-08-15';
const TODAY_KO = '2026년 8월 15일';
const SITE_INDEX = 1;
const BRAND = '놀쿨';

const ORDER = [
  'bulgwang-hobak', 'changwon-lululala-night', 'ulsan-champion-night', 'cheongdam-night',
  'daejeon-one-night', 'sillim-grandprix-night', 'sangbong-hangukgwan-night', 'suyu-shampoo',
  'busan-asiad-night', 'suwon-chance-dome', 'ansan-hit-night', 'daejeon-seven-night',
  'ilsan-shampoo'
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
  if (v.station) rows.push(['가까운 역', v.station]);
  if (v.hours) rows.push(['영업 안내', v.hours]);
  if (v.age) rows.push(['출입 연령', v.age]);
  if (v.seats) rows.push(['좌석 구성', v.seats]);
  if (v.parking) rows.push(['주차', v.parking]);
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
    alternateName: [v.nameB],
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
      name: s.faq.q,
      acceptedAnswer: { '@type': 'Answer', text: s.faq.a }
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
.nt-header .wrap{display:flex;align-items:center;justify-content:space-between;height:56px;}
.nt-header .logo{color:#fff;}
.nt-nav a{color:#fff;font-weight:700;font-size:.9rem;padding:10px;min-height:44px;display:inline-flex;align-items:center;}
.nt-hero{background:var(--nt-deep);color:#fff;padding:30px 0 26px;}
.nt-hero .nt-badge{display:inline-block;background:#fff;color:var(--nt-ink);font-weight:800;font-size:.78rem;padding:6px 12px;border-radius:999px;margin-bottom:12px;}
.nt-hero h1{font-size:clamp(1.5rem,5.6vw,2.05rem);font-weight:900;line-height:1.35;}
.nt-hero .nt-lead{margin-top:12px;color:#fff;font-size:1rem;line-height:1.75;}
.nt-body{padding:26px 0 8px;background:#fff;}
.answer-box{border:2px solid var(--nt-line);background:var(--nt-soft);border-radius:12px;padding:16px 15px;margin:0 0 20px;}
.answer-box p{font-size:1rem;line-height:1.75;color:#15161a;}
.nt-facts{width:100%;border-collapse:collapse;margin:0 0 24px;font-size:.97rem;}
.nt-facts caption{text-align:left;font-weight:800;color:var(--nt-ink);padding-bottom:8px;}
.nt-facts th,.nt-facts td{border:1px solid var(--nt-line);padding:11px 12px;text-align:left;vertical-align:top;color:#15161a;}
.nt-facts th{background:var(--nt-soft);width:32%;font-weight:800;white-space:nowrap;}
.nt-scroll{overflow-x:auto;}
.nt-h2{font-size:clamp(1.14rem,4.3vw,1.4rem);font-weight:900;line-height:1.5;margin:30px 0 12px;padding-left:12px;border-left:5px solid var(--nt-mid);color:#15161a;}
.nt-p{margin-bottom:12px;color:#26262c;line-height:1.8;}
.nt-bridge{margin:0 0 6px;color:#4B5563;font-size:.93rem;}
.nt-list{margin:0 0 14px;padding-left:2px;}
.nt-list li{position:relative;padding:7px 0 7px 17px;color:#26262c;line-height:1.75;border-bottom:1px solid var(--nt-line);}
.nt-list li:last-child{border-bottom:none;}
.nt-list li::before{content:"";position:absolute;left:0;top:16px;width:7px;height:7px;border-radius:2px;background:var(--nt-mid);}
.nt-sum{background:var(--nt-soft);border:1px solid var(--nt-line);border-radius:12px;padding:16px 15px;margin:30px 0 8px;}
.nt-sum .nt-h2{margin:0 0 10px;border-left:none;padding-left:0;font-size:1.05rem;color:var(--nt-ink);}
.nt-sum li{padding:6px 0 6px 16px;position:relative;color:#26262c;line-height:1.75;}
.nt-sum li::before{content:"";position:absolute;left:0;top:15px;width:7px;height:7px;border-radius:50%;background:var(--nt-mid);}
.nt-aside{margin:28px 0 6px;}
.nt-aside h2{font-size:1.05rem;font-weight:900;color:var(--nt-ink);margin-bottom:10px;}
.nt-aside a{display:block;padding:13px 12px;border:1px solid var(--nt-line);border-radius:10px;margin-bottom:9px;color:var(--nt-ink);font-weight:700;min-height:44px;}
.site-footer{background:#f4f4f5;padding:8px 16px 26px;}
.ad-inquiry{background:#ffd400;color:#111;font-weight:900;font-size:18px;padding:16px;text-align:center;border-radius:10px;margin:24px auto;max-width:720px;}
.footer-note{max-width:720px;margin:0 auto 6px;color:#3f3f46;font-size:.88rem;line-height:1.7;text-align:center;}
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
  .nt-sum .nt-h2,.nt-aside h2,.nt-aside a{color:#ffffff;}
  .nt-list li{color:#ececf1;border-bottom-color:var(--nt-mid);}
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
    const cls = s.geo ? 'nt-p nt-geo' : 'nt-p';
    const P = (arr) => arr.map((t) => '        <p class="' + cls + '">' + t + '</p>').join('\n');
    let body = P(s.ps);
    if (s.ul) body += '\n        <ul class="nt-list">\n' + s.ul.map((t) => '          <li>' + esc(t) + '</li>').join('\n') + '\n        </ul>';
    if (s.ps2) body += '\n' + P(s.ps2);
    const br = s.bridge ? '\n        <p class="nt-bridge">' + s.bridge + '</p>' : '';
    return '      <section>\n        <h2 class="nt-h2">' + esc(s.h2) + '</h2>\n' + body + br + '\n      </section>';
  }).join('\n\n');

  const table = rows.length ? (
    '      <div class="nt-scroll">\n        <table class="nt-facts">\n' +
    '          <caption>' + esc(v.name) + ' 핵심 정보</caption>\n          <tbody>\n' +
    rows.map((r) => '            <tr><th scope="row">' + esc(r[0]) + '</th><td>' + esc(r[1]) + '</td></tr>').join('\n') +
    '\n          </tbody>\n        </table>\n      </div>\n') : '';

  const links = v.links.map((l) => {
    const t = bySlug[l.slug];
    if (!t) throw new Error('링크 대상 없음: ' + l.slug);
    return '      <a href="/night/' + t.slug + '/">' + esc(l.text) + '</a>';
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
<meta property="og:site_name" content="${BRAND} 나이트 소개">
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
    <a href="/night/" class="logo">전국 나이트 소개</a>
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
        <h1>${esc(v.name)}</h1>
        <p class="nt-lead">${esc(v.lead)}</p>
      </div>
    </header>

    <div class="nt-body">
      <div class="wrap">

      <div class="answer-box">
        <p>${v.answer}</p>
      </div>

${table}
${sections}

      <section class="nt-sum">
        <h2 class="nt-h2">${esc(v.name)} 핵심 3줄 요약</h2>
        <ul>
${v.summary.map((s) => '          <li>' + esc(s) + '</li>').join('\n')}
        </ul>
      </section>

      </div>
    </div>
  </article>

  <aside class="nt-aside" aria-labelledby="aside-title">
    <div class="wrap">
      <h2 id="aside-title">같이 보면 좋은 나이트</h2>
${links}
    </div>
  </aside>

</main>

<footer class="site-footer">
  <div class="ad-inquiry">
    광고·제휴 입점 문의 &nbsp;|&nbsp; 카카오톡 ID <strong>besta12</strong>
  </div>
  <p class="footer-note">본 페이지는 업소 정보 제공 페이지입니다. 출입 연령 및 이용 규정은 각 업소 방침을 따릅니다.</p>
  <p class="footer-note">최종 수정 <time datetime="${TODAY}">${TODAY_KO}</time> · 공개된 웹 정보를 정리했으며 실제와 다를 수 있습니다.</p>
</footer>

${callbar(v)}

</body>
</html>
`;
}

/* 2차 지역 키워드 페이지 목록 — 메인/목록에서 1단계 직접 링크 (지시서 [12]) */
const REGION_ORDER = [
  'eunpyeong-night', 'changwon-night', 'ulsan-night', 'gangnam-night',
  'daejeon-night', 'sillim-night', 'sangbong-night', 'suyu-night',
  'busan-night', 'suwon-nightclub', 'ansan-night', 'yucheon-night', 'ilsan-night'
];
const regionPages = REGION_ORDER.map((s) => require(path.join(__dirname, 'region', s + '.js')));

function buildHub() {
  const p = { deep: '#1f2430', mid: '#39415a', soft: '#f3f4f8', line: '#d8dbe6', ink: '#232838' };
  const regionItems = regionPages.map((r) =>
    '      <a href="/night/' + r.slug + '/">' + esc(r.kw) + ' ' + esc(r.suffix) + ' — ' + esc(r.region) + '</a>'
  ).join('\n');
  const items = venues.map((v) => {
    const loc = v.addr.street ? v.addr.street : (v.landmark + ' · ' + v.addr.locality);
    const tag = v.age ? ' · ' + v.age : '';
    return '      <a href="/night/' + v.slug + '/">' + esc(v.name) + ' — ' + esc(loc) + esc(tag) + '</a>';
  }).join('\n');
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${VERIFY}
<title>전국 나이트 13곳 어떤 곳인지 한눈에</title>
<meta name="description" content="지역별 나이트 13곳이 각각 어떤 홀인지, 몇 시가 좋은지, 좌석은 어떻게 나뉘는지 한 줄로 모았습니다. 이름을 누르면 업소별 소개로 이어집니다.">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${SITE}/night/">
<meta property="og:title" content="전국 나이트 13곳 어떤 곳인지 한눈에">
<meta property="og:description" content="지역별 나이트 13곳이 각각 어떤 홀인지 한 줄로 모았습니다.">
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
    <a href="/night/" class="logo">전국 나이트 소개</a>
    <nav class="nt-nav" aria-label="주요 메뉴"><a href="/">홈</a></nav>
  </div>
</header>
<main id="main">
  <article>
    <header class="nt-hero"><div class="wrap">
      <h1>전국 나이트 13곳</h1>
      <p class="nt-lead">각각 어떤 홀인지, 몇 시가 좋은지, 좌석은 어떻게 나뉘는지 업소별로 정리했습니다.</p>
    </div></header>
    <div class="nt-body"><div class="wrap">
      <section class="nt-aside">
        <h2 id="hub-list">지역별 업소 목록</h2>
${items}
      </section>
      <section class="nt-aside">
        <h2 id="hub-region">지역 키워드로 보는 나이트 안내 13곳</h2>
${regionItems}
      </section>
    </div></div>
  </article>
  <aside class="nt-aside" aria-label="안내"><div class="wrap">
    <h2>이 목록을 쓰는 법</h2>
    <p class="nt-p">업소명을 누르면 홀 분위기와 자리 잡는 요령, 부킹이 도는 방식까지 한 페이지에 정리해 두었습니다. 영업시간과 요금처럼 확인되지 않은 항목은 각 페이지에 확인 불가로 표시했습니다.</p>
  </div></aside>
</main>
<footer class="site-footer">
  <div class="ad-inquiry">
    광고·제휴 입점 문의 &nbsp;|&nbsp; 카카오톡 ID <strong>besta12</strong>
  </div>
  <p class="footer-note">본 페이지는 업소 정보 제공 페이지입니다. 출입 연령 및 이용 규정은 각 업소 방침을 따릅니다.</p>
  <p class="footer-note">최종 수정 <time datetime="${TODAY}">${TODAY_KO}</time> · 공개된 웹 정보를 정리했으며 실제와 다를 수 있습니다.</p>
</footer>
<div class="callbar" role="complementary" aria-label="광고 제휴 문의">
  <span>광고·제휴 입점 문의 카톡 <b>besta12</b></span>
</div>
</body>
</html>
`;
}

function fingerprint() {
  const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  return {
    siteIndex: SITE_INDEX,
    site: SITE,
    angleRule: '각도번호 = ((SITE_INDEX-1) + (업소번호-1)) mod 13 + 1 · 접미어는 해당 각도 풀의 [업소번호]번째',
    generatedAt: TODAY,
    pages: venues.map((v, i) => ({
      venueNo: i + 1,
      slug: v.slug,
      url: SITE + '/night/' + v.slug + '/',
      angleNo: v.angleNo,
      angleName: v.angleName,
      suffix: v.suffix,
      title: v.title,
      titleLength: v.title.length,
      h2: v.sections.map((s) => s.h2),
      first200: strip(v.lead + ' ' + v.answer + ' ' + v.sections[0].ps.join(' ')).slice(0, 200)
    }))
  };
}

function main() {
  venues.forEach((v) => {
    const dir = path.join(ROOT, 'night', v.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), buildPage(v));
  });
  fs.writeFileSync(path.join(ROOT, 'night', 'index.html'), buildHub());
  fs.writeFileSync(path.join(ROOT, '.seo-fingerprint.json'), JSON.stringify(fingerprint(), null, 2) + '\n');
  console.log('OK  night/ 페이지 ' + venues.length + '개 + 허브 1개 + .seo-fingerprint.json 생성');
}
main();

module.exports = { ORDER, venues, SITE, TODAY, SITE_INDEX, factRows };
