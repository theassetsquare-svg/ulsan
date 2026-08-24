'use strict';
/**
 * /night/{지역slug}/ 13개 지역 키워드 페이지 생성기 (2차)
 *
 *   각도번호 = ((SITE_INDEX - 1) + (지역번호 - 1) + 7) mod 13 + 1
 *   SITE_INDEX = 1 이므로 지역번호 n → 각도 (n+6) mod 13 + 1
 *   접미어 = 그 각도 접미어 풀의 [지역번호]번째
 *
 * 원고는 scripts/region/*.js 에 지역별로 따로 들어 있다. 이 파일은 조립만 한다.
 * 기존 /night/{업소slug}/ 13개 페이지는 읽지도 쓰지도 않는다.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://a.nolcool.com';
const TODAY = '2026-08-15';
const TODAY_KO = '2026년 8월 15일';
const SITE_INDEX = 1;
const PAGE_ROUND = 2;

const ORDER = [
  'eunpyeong-night', 'changwon-night', 'ulsan-night', 'gangnam-night',
  'daejeon-night', 'sillim-night', 'sangbong-night', 'suyu-night',
  'busan-night', 'suwon-nightclub', 'ansan-night', 'yucheon-night',
  'ilsan-night'
];

/* 기존 페이지에서 그대로 복사한 인증 메타태그 */
const VERIFY = [
  '<meta name="naver-site-verification" content="174d09a203a44a83bcb250bc6bb68f6bc8da18ce" />',
  '<meta name="naver-site-verification" content="41b24f8a991cc367d7e961db787381b903041ae0" />',
  '<meta name="naver-site-verification" content="86086f8f927252a5021544b971d07b18a5e03a22" />',
  '<meta name="google-site-verification" content="HJjm7MRxykCQ7d_9L7glaTeeaWrmJIzAKY0BcNcfm88" />'
].join('\n');

const regions = ORDER.map((s) => require(path.join(__dirname, 'region', s + '.js')));
const bySlug = Object.fromEntries(regions.map((r) => [r.slug, r]));

/* 각도 정의 — 지시서 [4] */
const ANGLES = {
  1: { name: '정면 소개형', pool: ['소문의 진짜 정체', '여기가 왜 버티나', '이름값 하는 이유', '한 곳으로 남은 자리', '규모가 말해주는 것', '간판보다 안이 다르다', '오래 남은 데는 이유가', '첫인상이 갈리는 곳', '겉만 보면 모른다', '들어가 봐야 아는 곳', '자리가 말해주는 것', '홀부터 다른 이유', '실체는 이렇다'] },
  2: { name: '질문 던지기형', pool: ['왜 사람이 몰릴까', '뭐가 다르길래', '어디로 가야 하나', '실제로 어떨까', '분위기 어떨까', '자리 잡기 쉬울까', '몇 시가 좋을까', '첫 방문 괜찮을까', '어떤 사람들이 올까', '주말엔 붐빌까', '예약이 필요할까', '혼자 가도 될까', '다시 갈 만할까'] },
  3: { name: '장면 묘사형', pool: ['밤 열두 시의 풍경', '문 열리는 그 시각', '홀이 차오르는 순간', '무대 앞 공기', '조명이 바뀌는 밤', '사람이 두꺼워지는 시간', '새벽으로 넘어갈 때', '첫 곡이 깔리는 순간', '테이블이 다 차는 밤', '가장 뜨거운 한 시간', '소리가 커지는 지점', '자정 무렵 홀 안', '문 닫기 직전 풍경'] },
  4: { name: '처음 가는 사람 시점', pool: ['처음이면 이것부터', '초보가 모르는 것', '첫날 뭘 해야 하나', '처음 가는 사람 안내', '문 앞에서 막힌다면', '첫날 이렇게 하면 된다', '처음이 어렵다면', '입문자 체크', '첫 방문 전 확인', '초보가 놓치는 것', '처음 가면 이렇다', '첫 경험 정리', '처음 가는 순서'] },
  5: { name: '이유 나열형', pool: ['가는 이유 셋', '찾는 이유 넷', '계속 오는 이유', '다시 찾는 까닭', '사람이 오는 이유', '선택받는 이유', '오래 버틴 이유', '자주 가는 이유', '추천받는 이유', '남는 이유', '붐비는 까닭', '소문난 이유', '몰리는 이유'] },
  6: { name: '오해 깨기형', pool: ['이런 줄 알았다면', '오해부터 풀자', '생각과 다른 점', '선입견이 깨진다', '잘못 알려진 것', '실제는 다르다', '착각하기 쉬운 것', '알고 보면 다르다', '겉과 속이 다르다', '흔한 오해 정리', '막상 가보면', '예상과 다른 점', '소문과 실제'] },
  7: { name: '문답형', pool: ['궁금한 것 몰아보기', '자주 오는 질문', '질문 열다섯', '물어본 것들', '가장 많이 묻는 것', '질문과 답', '궁금증 해결', '문의 정리', '자주 나온 질문', '물음 정리', '답변 모음', '질문 모아보기', '문답 정리'] },
  8: { name: '시간 흐름형', pool: ['입장부터 끝까지', '하루 밤 흐름', '도착부터 귀가까지', '시간대별 정리', '밤이 흐르는 순서', '저녁부터 새벽까지', '흐름 따라가기', '한 밤의 순서', '시간 순 안내', '처음부터 끝까지', '밤의 단계', '단계별 안내', '시간표 정리'] },
  9: { name: '비교 설명형', pool: ['뭐가 다를까', '차이점 정리', '다른 점 셋', '특징 정리', '구별되는 점', '남다른 이유', '차별점 안내', '어떻게 다른가', '다른 곳과 비교', '이 점이 다르다', '특색 정리', '개성 있는 점', '구분되는 지점'] },
  10: { name: '짧은 요약형', pool: ['핵심만 정리', '한눈에 보기', '요점 정리', '빠른 안내', '간단 정리', '핵심 셋', '요약 안내', '짧게 정리', '필수 정보', '한 장 요약', '간추린 안내', '핵심 체크', '요점만'] },
  11: { name: '인원별 공략형', pool: ['몇 명이 좋을까', '둘이서 가도 될까', '넷이 딱 좋은 이유', '단체 방문 안내', '인원별 정리', '일행 수 정하기', '몇 명이 적당할까', '인원 구성 안내', '팀 단위 안내', '소수 방문 안내', '다인원 안내', '인원별 자리 차이', '함께 갈 사람 수'] },
  12: { name: '실수 방지형', pool: ['이것만은 피하자', '흔한 실수 정리', '놓치기 쉬운 것', '실수 줄이는 법', '후회하는 지점', '조심할 것', '미리 알아둘 것', '헛걸음 하는 이유', '헛걸음 막는 법', '아쉬운 순간들', '준비 부족 신호', '피해야 할 것', '실수 목록'] },
  13: { name: '단골 관점형', pool: ['자주 가는 사람 이야기', '단골이 아는 것', '여러 번 가보면', '익숙해지면 보이는 것', '두 번째 방문부터', '반복 방문 정리', '오래 다닌 시선', '익숙한 사람의 순서', '재방문 요령', '손에 익으면', '경험자 관점', '반복해서 알게 된 것', '다녀본 사람 기준'] }
};

function expectedAngle(no) { return ((SITE_INDEX - 1) + (no - 1) + 7) % 13 + 1; }
function expectedSuffix(no) { return ANGLES[expectedAngle(no)].pool[no - 1]; }

/* 각도·접미어 자가 검증 — 어긋나면 빌드를 멈춘다 */
regions.forEach((r) => {
  const a = expectedAngle(r.no);
  if (r.angleNo !== a) throw new Error(r.slug + ' 각도 불일치: ' + r.angleNo + ' ≠ ' + a);
  if (r.angleName !== ANGLES[a].name) throw new Error(r.slug + ' 각도명 불일치');
  const s = expectedSuffix(r.no);
  if (r.suffix !== s) throw new Error(r.slug + ' 접미어 불일치: ' + r.suffix + ' ≠ ' + s);
  if (!r.title.startsWith(r.kw)) throw new Error(r.slug + ' 제목이 주 키워드로 시작하지 않는다');
  if (r.title.length < 25 || r.title.length > 30) throw new Error(r.slug + ' 제목 길이 ' + r.title.length);
  if (!r.title.includes(r.suffix)) throw new Error(r.slug + ' 제목에 접미어 없음');
});

/* 기존 업소 slug와 충돌 검사 — 1차 13개 목록 기준 */
const NIGHT_ORDER = require('./build-night-pages.js').ORDER;
const clash = ORDER.filter((s) => NIGHT_ORDER.includes(s));
if (clash.length) throw new Error('slug 충돌: ' + clash.join(','));
if (ORDER.some((s) => /-2$/.test(s))) throw new Error('"-2" 형태 slug 금지');

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
const palette = (r) => ({
  deep: hsl2hex(r.hue, 62, 21),
  mid: hsl2hex(r.hue, 58, 31),
  soft: hsl2hex(r.hue, 68, 96),
  line: hsl2hex(r.hue, 44, 82),
  ink: hsl2hex(r.hue, 58, 25)
});

function callbar(r) {
  /* 정답표: 지역 키워드 페이지는 전 페이지 광고문의 바 (전화번호 삽입 금지) */
  return '<div class="callbar" role="complementary" aria-label="광고 문의">\n' +
    '  <a href="https://open.kakao.com/o/sBesta12" target="_blank" rel="noopener noreferrer">\ud83d\udcac 광고문의 카카오톡 besta12</a>\n' +
    '</div>';
}


/* JSON-LD 3종 — 업소가 아니라 지역 안내이므로 NightClub 대신 Article */
function jsonld(r) {
  const url = SITE + '/night-1/' + r.slug + '/';
  const img = SITE + '/og/' + r.slug + '-og.png';
  const venueUrl = SITE + '/night-1/' + r.venue.slug + '/';

  const article = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': url + '#article',
    headline: r.title,
    description: r.description,
    image: [img],
    datePublished: TODAY,
    dateModified: TODAY,
    inLanguage: 'ko-KR',
    about: { '@type': 'Place', name: r.region },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    mentions: [{ '@type': 'NightClub', name: r.venue.name, url: venueUrl }]
  };
  if (r.age) article.about = [{ '@type': 'Place', name: r.region }, { '@type': 'Thing', name: '출입 연령 ' + r.age }];

  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': url + '#faq',
    mainEntity: r.sections.map((s) => ({
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
      { '@type': 'ListItem', position: 2, name: '나이트', item: SITE + '/night-1/' },
      { '@type': 'ListItem', position: 3, name: r.kw, item: url }
    ]
  };
  return [article, faq, crumb].map((o) => '<script type="application/ld+json">\n' + j(o) + '\n</script>').join('\n');
}

function pageCss(p) {
  return `
:root{--rg-deep:${p.deep};--rg-mid:${p.mid};--rg-soft:${p.soft};--rg-line:${p.line};--rg-ink:${p.ink};}
body{background:#fff;color:#15161a;padding-bottom:calc(84px + env(safe-area-inset-bottom,0px));}
.rg-header{background:var(--rg-deep);}
.rg-header .wrap{display:flex;align-items:center;justify-content:space-between;height:56px;}
.rg-header .logo{color:#fff;}
.rg-nav a{color:#fff;font-weight:700;font-size:.9rem;padding:10px;min-height:44px;display:inline-flex;align-items:center;}
.rg-hero{background:var(--rg-deep);color:#fff;padding:30px 0 26px;}
.rg-hero .rg-badge{display:inline-block;background:#fff;color:var(--rg-ink);font-weight:800;font-size:.78rem;padding:6px 12px;border-radius:999px;margin-bottom:12px;}
.rg-hero h1{font-size:clamp(1.5rem,5.6vw,2.05rem);font-weight:900;line-height:1.35;}
.rg-hero .rg-lead{margin-top:12px;color:#fff;font-size:1rem;line-height:1.75;}
.rg-body{padding:26px 0 8px;background:#fff;}
.answer-box{border:2px solid var(--rg-line);background:var(--rg-soft);border-radius:12px;padding:16px 15px;margin:0 0 20px;}
.answer-box p{font-size:1rem;line-height:1.75;color:#15161a;}
.rg-facts{width:100%;border-collapse:collapse;margin:0 0 24px;font-size:.97rem;}
.rg-facts caption{text-align:left;font-weight:800;color:var(--rg-ink);padding-bottom:8px;}
.rg-facts th,.rg-facts td{border:1px solid var(--rg-line);padding:11px 12px;text-align:left;vertical-align:top;color:#15161a;}
.rg-facts th{background:var(--rg-soft);width:34%;font-weight:800;white-space:nowrap;}
.rg-scroll{overflow-x:auto;}
.rg-h2{font-size:clamp(1.14rem,4.3vw,1.4rem);font-weight:900;line-height:1.5;margin:30px 0 12px;padding-left:12px;border-left:5px solid var(--rg-mid);color:#15161a;}
.rg-p{margin-bottom:12px;color:#26262c;line-height:1.8;}
.rg-bridge{margin:0 0 6px;color:#4B5563;font-size:.93rem;}
.rg-list{margin:0 0 14px;padding-left:2px;}
.rg-list li{position:relative;padding:7px 0 7px 17px;color:#26262c;line-height:1.75;border-bottom:1px solid var(--rg-line);}
.rg-list li:last-child{border-bottom:none;}
.rg-list li::before{content:"";position:absolute;left:0;top:16px;width:7px;height:7px;border-radius:2px;background:var(--rg-mid);}
.rg-venue{display:inline-block;margin:4px 0 10px;padding:13px 16px;border:2px solid var(--rg-mid);border-radius:10px;color:var(--rg-ink);font-weight:800;min-height:44px;}
.rg-sum{background:var(--rg-soft);border:1px solid var(--rg-line);border-radius:12px;padding:16px 15px;margin:30px 0 8px;}
.rg-sum .rg-h2{margin:0 0 10px;border-left:none;padding-left:0;font-size:1.05rem;color:var(--rg-ink);}
.rg-sum li{padding:6px 0 6px 16px;position:relative;color:#26262c;line-height:1.75;}
.rg-sum li::before{content:"";position:absolute;left:0;top:15px;width:7px;height:7px;border-radius:50%;background:var(--rg-mid);}
.rg-aside{margin:28px 0 6px;}
.rg-aside h2{font-size:1.05rem;font-weight:900;color:var(--rg-ink);margin-bottom:10px;}
.rg-aside a{display:block;padding:13px 12px;border:1px solid var(--rg-line);border-radius:10px;margin-bottom:9px;color:var(--rg-ink);font-weight:700;min-height:44px;}
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
.callbar a{color:#fff; text-decoration:none; display:flex; align-items:center; justify-content:center; width:100%; height:100%;}
@media(max-width:480px){
  .callbar{height:60px; font-size:16px;}
  body{ padding-bottom:calc(80px + env(safe-area-inset-bottom,0px)); }
}
@media (prefers-color-scheme: dark){
  body{background:#101014;color:#f4f4f5;}
  .rg-body{background:#101014;}
  .answer-box{background:#191922;border-color:var(--rg-mid);}
  .answer-box p,.rg-p,.rg-facts th,.rg-facts td,.rg-sum li{color:#ececf1;}
  .rg-facts th{background:#191922;}
  .rg-h2{color:#ffffff;}
  .rg-sum{background:#191922;border-color:var(--rg-mid);}
  .rg-sum .rg-h2,.rg-aside h2,.rg-aside a,.rg-venue{color:#ffffff;}
  .rg-list li{color:#ececf1;border-bottom-color:var(--rg-mid);}
  .rg-bridge{color:#c7c7d1;}
  .site-footer{background:#17171d;}
  .footer-note{color:#d4d4dd;}
}
`;
}

function factRows(r) {
  const rows = [
    ['행정 구역', r.region],
    ['이 페이지가 다루는 것', r.angleName + ' 정리'],
    ['연결 업소', r.venue.name + ' · ' + r.venue.where]
  ];
  if (r.age) rows.push(['연결 업소 출입 연령', r.age]);
  rows.push(['문의', r.group === 'A' ? r.contact.person + ' ' + r.contact.tel : '광고·제휴 입점 문의 카카오톡 besta12']);
  return rows;
}

function buildPage(r) {
  const p = palette(r);
  const url = SITE + '/night-1/' + r.slug + '/';
  const img = SITE + '/og/' + r.slug + '-og.png';

  const sections = r.sections.map((s) => {
    const P = (arr) => arr.map((t) => '        <p class="rg-p">' + t + '</p>').join('\n');
    let body = P(s.ps);
    if (s.ul) body += '\n        <ul class="rg-list">\n' + s.ul.map((t) => '          <li>' + esc(t) + '</li>').join('\n') + '\n        </ul>';
    if (s.ps2) body += '\n' + P(s.ps2);
    if (s.venueLink) {
      body += '\n        <a class="rg-venue" href="/night-1/' + r.venue.slug + '/">' + esc(r.venue.name) + ' 소개 보기</a>';
    }
    const br = s.bridge ? '\n        <p class="rg-bridge">' + esc(s.bridge) + '</p>' : '';
    return '      <section>\n        <h2 class="rg-h2">' + esc(s.h2) + '</h2>\n' + body + br + '\n      </section>';
  }).join('\n\n');

  const rows = factRows(r);
  const table =
    '      <div class="rg-scroll">\n        <table class="rg-facts">\n' +
    '          <caption>' + esc(r.kw) + ' 한 줄 정리</caption>\n          <tbody>\n' +
    rows.map((x) => '            <tr><th scope="row">' + esc(x[0]) + '</th><td>' + esc(x[1]) + '</td></tr>').join('\n') +
    '\n          </tbody>\n        </table>\n      </div>\n';

  const links = r.links.map((sl) => {
    const t = bySlug[sl];
    if (!t) throw new Error('링크 대상 없음: ' + sl);
    return '      <a href="/night-1/' + t.slug + '/">' + esc(t.kw) + ' ' + esc(t.suffix) + '</a>';
  }).join('\n') + '\n      <a href="/night-1/' + r.venue.slug + '/">' + esc(r.venue.name) + ' 업소 소개</a>';

  const closer = r.group === 'A'
    ? '<p class="rg-p">' + esc(r.kw) + ' 자리 문의는 ' + esc(r.contact.person) + ' ' + esc(r.contact.tel) + '입니다.</p>'
    : '';

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${VERIFY}
<title>${esc(r.title)}</title>
<meta name="description" content="${esc(r.description)}">
<meta name="keywords" content="${esc(r.keywords)}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
<meta name="geo.region" content="${r.geo}">
<meta name="geo.placename" content="${esc(r.region)}">
<meta name="theme-color" content="${p.deep}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${esc(r.title)}">
<meta property="og:description" content="${esc(r.description)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${url}">
<meta property="og:locale" content="ko_KR">
<meta property="og:site_name" content="전국 나이트 지역 안내">
<meta property="og:image" content="${img}">
<meta property="og:image:secure_url" content="${img}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="1200">
<meta property="og:image:type" content="image/png">
<meta property="og:image:alt" content="${esc(r.ogAlt)}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${esc(r.title)}">
<meta name="twitter:description" content="${esc(r.description)}">
<meta name="twitter:image" content="${img}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="icon" type="image/png" href="/favicon-192.png">
<link rel="apple-touch-icon" href="/favicon-192.png">
<link rel="stylesheet" href="/style.css">
<style>${pageCss(p)}</style>
${jsonld(r)}
</head>
<body>
<a href="#main" class="skip-to-main">본문 바로가기</a>

<header class="header rg-header">
  <div class="wrap">
    <a href="/night-1/" class="logo">전국 나이트 지역 안내</a>
    <nav class="rg-nav" aria-label="주요 메뉴">
      <a href="/">홈</a>
      <a href="/night-1/">목록</a>
    </nav>
  </div>
</header>

<main id="main">

  <article>
    <header class="rg-hero">
      <div class="wrap">
        <span class="rg-badge">${esc(r.heroBadge)}</span>
        <h1>${esc(r.kw)}</h1>
        <p class="rg-lead">${esc(r.lead)}</p>
      </div>
    </header>

    <div class="rg-body">
      <div class="wrap">

      <div class="answer-box">
        <p>${r.answer}</p>
      </div>

${table}
${sections}

      <section class="rg-sum">
        <h2 class="rg-h2">${esc(r.kw)} 세 줄 요약</h2>
        <ul>
${r.summary.map((s) => '          <li>' + esc(s) + '</li>').join('\n')}
        </ul>
        ${closer}
      </section>

      </div>
    </div>
  </article>

  <aside class="rg-aside" aria-labelledby="aside-title">
    <div class="wrap">
      <h2 id="aside-title">같이 보면 좋은 지역</h2>
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

${callbar(r)}

</body>
</html>
`;
}

function fingerprint() {
  const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  return {
    siteIndex: SITE_INDEX,
    pageRound: PAGE_ROUND,
    site: SITE,
    angleRule: '각도번호 = ((SITE_INDEX-1) + (지역번호-1) + 7) mod 13 + 1 · 접미어는 해당 각도 풀의 [지역번호]번째',
    generatedAt: TODAY,
    pages: regions.map((r) => ({
      no: r.no,
      kw: r.kw,
      slug: r.slug,
      url: SITE + '/night-1/' + r.slug + '/',
      angleNo: r.angleNo,
      angleName: r.angleName,
      suffix: r.suffix,
      title: r.title,
      titleLength: r.title.length,
      group: r.group,
      venue: r.venue.slug,
      h2: r.sections.map((s) => s.h2),
      firstSentence: r.lead.split('. ')[0] + '.',
      first200: strip(r.lead + ' ' + r.answer).slice(0, 200)
    }))
  };
}

function main() {
  regions.forEach((r) => {
    const dir = path.join(ROOT, 'night', r.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), buildPage(r));
  });
  fs.writeFileSync(path.join(ROOT, '.seo-fingerprint-region.json'), JSON.stringify(fingerprint(), null, 2) + '\n');
  console.log('OK  지역 페이지 ' + regions.length + '개 생성 + .seo-fingerprint-region.json');
}

if (require.main === module) main();

module.exports = { ORDER, regions, SITE, TODAY, SITE_INDEX, PAGE_ROUND, ANGLES, expectedAngle, expectedSuffix, palette, hsl2hex };
