'use strict';
/**
 * PAGE_ROUND 3 배포 전 게이트 (지시서 2026-08-16 · 하나라도 실패 시 배포 금지)
 * 대상: /night/{40}/index.html + /night/index.html(허브) + /index.html(홈)
 * G1 금지단어 0 / G2 평점·★ 0 / G3 창작수치 패턴 0 / G4 title 중복 0·20~30자(+description 70~80·중복 0)
 * G5 페이지 쌍 20자+ 동일 문장 3개 이상 공유 실패 / G6 본문 1,800자 미만 실패
 * G7 내부링크 404 0 / G8 필수 요소 전 페이지 / G9 og:image 메타+파일+1200x1200 실측
 * +R5 업소명 본문 3~5회 / +R4 외부 링크 금지 / +전화번호 화이트리스트 / +title=og:title=h1
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const { ORDER, TODAY } = require('./build-night40.js');
const venues = ORDER.map((s) => require(path.join(__dirname, 'night40', s + '.js')));

const pages = {}; // key -> {src, main, kind, venue?}
venues.forEach((v) => {
  const src = fs.readFileSync(path.join(ROOT, 'night', v.slug, 'index.html'), 'utf8');
  pages['night/' + v.slug] = { src, kind: 'venue', venue: v };
});
pages['night(hub)'] = { src: fs.readFileSync(path.join(ROOT, 'night', 'index.html'), 'utf8'), kind: 'hub' };
pages['home'] = { src: fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), kind: 'home' };

const strip = (s) => s.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const mainText = (src) => {
  const i = src.indexOf('<main'), j = src.indexOf('</main>');
  return i >= 0 && j > i ? strip(src.slice(i, j)) : '';
};
Object.values(pages).forEach((p) => { p.main = mainText(p.src); });

const titleOf = (src) => { const m = src.match(/<title>([^<]*)<\/title>/); return m ? m[1] : null; };
const metaOf = (src, name) => { const m = src.match(new RegExp('<meta name="' + name + '" content="([^"]*)"')); return m ? m[1] : null; };
const propOf = (src, prop) => { const m = src.match(new RegExp('<meta property="' + prop.replace(':', '\\:') + '" content="([^"]*)"')); return m ? m[1] : null; };
const count = (hay, needle) => hay.split(needle).length - 1;

const results = [];
const add = (id, pass, metric) => results.push({ id, pass, metric });

/* G1 금지단어 */
{
  const re = /룸살롱|룸싸롱|노래방|밤문화|유흥|2차/g;
  const bad = [];
  Object.entries(pages).forEach(([k, p]) => { const m = p.src.match(re); if (m) bad.push(k + ':' + [...new Set(m)].join(',')); });
  add('G1', bad.length === 0, '금지단어 위반 ' + bad.length + (bad.length ? ' — ' + bad.join(' / ') : '건'));
}

/* G2 평점 */
{
  const re = /aggregateRating|ratingValue|★/g;
  const bad = [];
  Object.entries(pages).forEach(([k, p]) => { if (re.test(p.src)) bad.push(k); });
  add('G2', bad.length === 0, '평점·별점 위반 ' + bad.length + '건' + (bad.length ? ' — ' + bad.join(',') : ''));
}

/* G3 창작수치 패턴 */
{
  const re = /명이 이번 달|자리 남았|마감까지/;
  const bad = [];
  Object.entries(pages).forEach(([k, p]) => { if (re.test(p.src)) bad.push(k); });
  add('G3', bad.length === 0, '창작수치 패턴 ' + bad.length + '건' + (bad.length ? ' — ' + bad.join(',') : ''));
}

/* G4 title·description */
{
  const titles = Object.entries(pages).map(([k, p]) => [k, titleOf(p.src)]);
  const dup = titles.filter(([k, t], i) => titles.findIndex(([, t2]) => t2 === t) !== i);
  const lenBad = venues.map((v) => [v.slug, titleOf(pages['night/' + v.slug].src)]).filter(([, t]) => !t || t.length < 20 || t.length > 30);
  const descs = Object.entries(pages).map(([k, p]) => [k, metaOf(p.src, 'description')]);
  const ddup = descs.filter(([k, d], i) => descs.findIndex(([, d2]) => d2 === d) !== i);
  const dlenBad = venues.map((v) => [v.slug, metaOf(pages['night/' + v.slug].src, 'description')]).filter(([, d]) => !d || d.length < 65 || d.length > 85);
  add('G4', dup.length === 0 && lenBad.length === 0 && ddup.length === 0 && dlenBad.length === 0,
    'title 중복 ' + dup.length + ' · 길이위반 ' + lenBad.map(x => x[0] + '(' + (x[1] || '').length + ')').join(',') +
    ' · desc 중복 ' + ddup.length + ' · desc 길이위반 ' + dlenBad.map(x => x[0] + '(' + (x[1] || '').length + ')').join(','));
}

/* G5 페이지 쌍 문장 공유 (업소 40 + 허브) */
{
  const keys = Object.keys(pages).filter((k) => k !== 'home');
  const sent = {};
  keys.forEach((k) => {
    sent[k] = new Set(pages[k].main.split(/(?<=[.?!])\s+|(?<=다\.)|(?<=요\.)|(?<=까\?)/).map((s) => s.trim()).filter((s) => s.length >= 20));
  });
  const bad = [];
  for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) {
    let shared = 0; const ex = [];
    sent[keys[i]].forEach((s) => { if (sent[keys[j]].has(s)) { shared++; ex.push(s.slice(0, 30)); } });
    if (shared >= 3) bad.push(keys[i] + '×' + keys[j] + '(' + shared + ': ' + ex.slice(0, 3).join(' | ') + ')');
  }
  add('G5', bad.length === 0, '문장 공유 쌍 ' + bad.length + '건' + (bad.length ? ' — ' + bad.slice(0, 5).join(' / ') : ''));
}

/* G6 본문 분량 */
{
  const bad = [], warn = [];
  venues.forEach((v) => {
    const n = pages['night/' + v.slug].main.length;
    if (n < 1800) bad.push(v.slug + ':' + n);
    else if (n > 2500) warn.push(v.slug + ':' + n);
  });
  add('G6', bad.length === 0, '1800자 미만 ' + bad.length + '건' + (bad.length ? ' — ' + bad.join(',') : '') + (warn.length ? ' · 2500 초과(경고) ' + warn.join(',') : ''));
}

/* G7 내부링크 존재 */
{
  const bad = [];
  Object.entries(pages).forEach(([k, p]) => {
    const hrefs = [...p.src.matchAll(/href="(\/[^"#?]*)"/g)].map((m) => m[1]);
    const srcs = [...p.src.matchAll(/(?:content|src)="https:\/\/ulsand\.pages\.dev(\/[^"?]*)"/g)].map((m) => m[1]);
    [...hrefs, ...srcs].forEach((h) => {
      const f = path.join(ROOT, h.replace(/\/$/, ''));
      const ok = fs.existsSync(f) && fs.statSync(f).isFile() ? true
        : fs.existsSync(path.join(f, 'index.html')) ? true
        : fs.existsSync(f + '.html');
      if (!ok) bad.push(k + '→' + h);
    });
  });
  add('G7', bad.length === 0, '깨진 내부링크 ' + bad.length + '건' + (bad.length ? ' — ' + [...new Set(bad)].slice(0, 8).join(' / ') : ''));
}

/* G8 필수 요소 전 페이지 */
{
  const bad = [];
  Object.entries(pages).forEach(([k, p]) => {
    const miss = [];
    if (!p.src.includes('name="google-site-verification" content="HJjm7MRxykCQ7d_9L7glaTeeaWrmJIzAKY0BcNcfm88"')) miss.push('google인증');
    if (!p.src.includes('86086f8f927252a5021544b971d07b18a5e03a22')) miss.push('naver인증');
    if (!p.src.includes('rel="canonical"')) miss.push('canonical');
    if (!p.src.includes('application/ld+json')) miss.push('JSON-LD');
    /* 고정 하단바: 광고주 3곳은 각자 번호 tel: / 그 외 업소·허브는 광고문의 카톡 besta12 / 홈은 춘자 번호 */
    const adv = p.kind === 'venue' && p.venue.contact ? p.venue.contact : null;
    if (p.kind === 'home') {
      if (!(p.src.includes('tel:010-5653-0069') || p.src.includes('tel:01056530069'))) miss.push('전화바tel');
      if (!p.src.includes('울산챔피언나이트 춘자 010-5653-0069')) miss.push('전화바문구');
    } else if (adv) {
      if (!p.src.includes('class="callbar" href="tel:' + adv.raw + '"')) miss.push('전화바tel');
      if (!p.src.includes('📞 ' + p.venue.name + ' ' + adv.person + ' ' + adv.tel)) miss.push('전화바문구');
    } else {
      if (!p.src.includes('class="callbar" href="https://open.kakao.com/o/sBesta12"')) miss.push('광고바링크');
      if (!p.src.includes('💬 광고문의 카톡: besta12')) miss.push('광고바문구');
    }
    if (!p.src.includes('besta12')) miss.push('푸터besta12');
    if (!p.src.includes('공개된 웹 정보를 정리했으며 실제와 다를 수 있습니다')) miss.push('푸터고지');
    if (!p.src.includes(TODAY)) miss.push('오늘날짜');
    if (miss.length) bad.push(k + ':' + miss.join('+'));
  });
  add('G8', bad.length === 0, '필수 요소 누락 ' + bad.length + '건' + (bad.length ? ' — ' + bad.join(' / ') : ''));
}

/* G9 og:image — 메타 + 파일 + 실측 (실측은 리포트 파일로) */
{
  const sharp = require('sharp');
  const bad = [];
  const checks = [];
  Object.entries(pages).forEach(([k, p]) => {
    const img = propOf(p.src, 'og:image');
    const miss = [];
    if (!img || !img.startsWith('https://ulsand.pages.dev/og/')) miss.push('og:image절대URL');
    if (propOf(p.src, 'og:image:width') !== '1200') miss.push('width');
    if (propOf(p.src, 'og:image:height') !== '1200') miss.push('height');
    if (propOf(p.src, 'og:image:type') !== 'image/png') miss.push('type');
    if (!propOf(p.src, 'og:image:alt')) miss.push('alt');
    if (metaOf(p.src, 'twitter:card') !== 'summary') miss.push('twitter:card');
    if (!p.src.includes('name="twitter:image"')) miss.push('twitter:image');
    if (!metaOf(p.src, 'thumbnail')) miss.push('thumbnail');
    const local = img ? path.join(ROOT, img.replace('https://ulsand.pages.dev/', '')) : null;
    if (!local || !fs.existsSync(local)) miss.push('파일없음');
    else checks.push([k, local]);
    if (miss.length) bad.push(k + ':' + miss.join('+'));
  });
  Promise.all(checks.map(([k, f]) => sharp(f).metadata().then((m) => (m.width === 1200 && m.height === 1200) ? null : k + ':실측' + m.width + 'x' + m.height)))
    .then((dims) => {
      dims.filter(Boolean).forEach((d) => bad.push(d));
      add('G9', bad.length === 0, 'og:image 위반 ' + bad.length + '건' + (bad.length ? ' — ' + bad.join(' / ') : ''));
      finish();
    });
}

/* 추가 규칙 검사 → finish()에서 실행 */
function extraChecks() {
  /* R5 업소명 3~5회 */
  {
    const bad = [];
    venues.forEach((v) => {
      const n = count(pages['night/' + v.slug].main, v.name);
      if (n < 3 || n > 5) bad.push(v.slug + ':' + n);
    });
    add('R5', bad.length === 0, '업소명 3~5회 위반 ' + bad.length + '건' + (bad.length ? ' — ' + bad.join(',') : ''));
  }
  /* 전화번호 화이트리스트 */
  {
    const bad = [];
    const phoneRe = /0\d{1,2}[-.\s]?\d{3,4}[-.\s]?\d{4}/g;
    Object.entries(pages).forEach(([k, p]) => {
      /* 춘자 번호는 울산챔피언나이트 페이지와 홈에만 허용 — 그 외 페이지는 어떤 번호도 불가 */
      const allowed = new Set();
      if (k === 'night/ulsan-champion-night' || k === 'home') { allowed.add('010-5653-0069'); allowed.add('01056530069'); allowed.add('+82-10-5653-0069'); }
      if (k === 'night/changwon-lululala-night') { allowed.add('010-7528-4936'); allowed.add('01075284936'); allowed.add('+82-10-7528-4936'); }
      if (k === 'night/bulgwang-hobak-night') { allowed.add('010-2221-1937'); allowed.add('01022211937'); allowed.add('+82-10-2221-1937'); }
      const found = [...new Set((p.src.match(phoneRe) || []))];
      found.forEach((f) => {
        const norm = f.replace(/[\s.]/g, '');
        if (![...allowed].some((a) => norm === a.replace(/[\s.]/g, '') || ('+82-' + norm.slice(1)).replace(/-/g, '') === a.replace(/-/g, ''))) bad.push(k + ':' + f);
      });
      /* A그룹 아닌 페이지의 본문(<main>)에 어떤 전화번호도 금지 — 챔피언 페이지·홈 제외 */
      if (!['night/ulsan-champion-night', 'night/changwon-lululala-night', 'night/bulgwang-hobak-night', 'home'].includes(k)) {
        const inMain = p.main.match(phoneRe) || [];
        if (inMain.length) bad.push(k + ':본문번호 ' + inMain.join(','));
      }
    });
    add('RTEL', bad.length === 0, '전화번호 규칙 위반 ' + bad.length + '건' + (bad.length ? ' — ' + [...new Set(bad)].join(' / ') : ''));
  }
  /* JSON-LD telephone 은 광고주 3곳만 */
  {
    const bad = [];
    venues.forEach((v) => {
      const has = /"telephone"/.test(pages['night/' + v.slug].src);
      const shouldHave = ['ulsan-champion-night', 'changwon-lululala-night', 'bulgwang-hobak-night'].includes(v.slug);
      if (has !== shouldHave) bad.push(v.slug + (has ? ':불허 telephone' : ':누락 telephone'));
    });
    add('RJSONTEL', bad.length === 0, 'JSON-LD 전화 규칙 위반 ' + bad.length + '건' + (bad.length ? ' — ' + bad.join(',') : ''));
  }
  /* title = og:title = h1 (업소 페이지) */
  {
    const bad = [];
    venues.forEach((v) => {
      const src = pages['night/' + v.slug].src;
      const t = titleOf(src), ot = propOf(src, 'og:title');
      const h1m = src.match(/<h1>([^<]*)<\/h1>/);
      const h1 = h1m ? h1m[1].replace(/&amp;/g, '&') : null;
      if (!(t === ot && t === h1)) bad.push(v.slug);
    });
    add('RH1', bad.length === 0, 'title=og:title=h1 위반 ' + bad.length + '건' + (bad.length ? ' — ' + bad.join(',') : ''));
  }
  /* 외부 링크 금지 (업소·허브) */
  {
    const bad = [];
    Object.entries(pages).forEach(([k, p]) => {
      if (k === 'home') return; // 홈은 기존 ilsanroom 링크 유지 허용
      const ext = [...p.src.matchAll(/href="(https?:\/\/[^"]*)"/g)].map((m) => m[1])
        .filter((u) => !u.startsWith('https://ulsand.pages.dev') && !u.startsWith('https://open.kakao.com/o/sBesta12') && !u.startsWith('http://schema.org') && !u.startsWith('https://schema.org'));
      if (ext.length) bad.push(k + ':' + ext.join(','));
    });
    add('REXT', bad.length === 0, '외부 링크 위반 ' + bad.length + '건' + (bad.length ? ' — ' + bad.join(' / ') : ''));
  }
}

function finish() {
  extraChecks();
  const report = { checkedAt: new Date().toISOString().slice(0, 10), pages: Object.keys(pages).length, results };
  fs.writeFileSync(path.join(__dirname, 'night40-gate-report.json'), JSON.stringify(report, null, 2));
  results.forEach((r) => console.log((r.pass ? 'PASS' : 'FAIL'), r.id, '—', r.metric));
  const fails = results.filter((r) => !r.pass).length;
  console.log(fails === 0 ? '== ALL GATES PASS ==' : '== ' + fails + ' GATE(S) FAILED — 배포 금지 ==');
  process.exit(fails === 0 ? 0 : 1);
}
