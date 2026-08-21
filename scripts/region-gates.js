'use strict';
/**
 * 2차(지역 키워드) 13페이지 게이트 검사. 라이브 검증(G05/G07/G08/G12/G20 일부)은
 * scripts/region-callbar-check.js 와 scripts/live-check.js 가 따로 맡는다.
 * 사용: node scripts/region-gates.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const { ORDER, regions, expectedAngle, expectedSuffix } = require('./build-region-pages.js');
const NIGHT = require('./build-night-pages.js');

const results = [];
const add = (id, name, pass, detail) => results.push({ id, name, pass: !!pass, detail: String(detail) });

const html = {};
regions.forEach((r) => { html[r.slug] = fs.readFileSync(path.join(ROOT, 'night', r.slug, 'index.html'), 'utf8'); });
const nightHtml = {};
NIGHT.ORDER.forEach((s) => { nightHtml[s] = fs.readFileSync(path.join(ROOT, 'night', s, 'index.html'), 'utf8'); });

/* 본문 텍스트만 추출 (head 제거, 태그 제거) */
function bodyText(h) {
  const m = h.split('<body>')[1] || h;
  return m
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}
function articleText(h) {
  const m = /<article>([\s\S]*?)<\/article>/.exec(h);
  return bodyText(m ? m[1] : h);
}
const count = (s, sub) => s.split(sub).length - 1;

const regText = {}, nightText = {};
regions.forEach((r) => { regText[r.slug] = articleText(html[r.slug]); });
NIGHT.ORDER.forEach((s) => { nightText[s] = articleText(nightHtml[s]); });

/* ---------- G01 ---------- */
{
  let ok = true, bad = [];
  regions.forEach((r) => {
    const h = html[r.slug];
    if (!/^<!DOCTYPE html>/.test(h) || !/<html lang="ko">/.test(h)) { ok = false; bad.push(r.slug); }
    const opens = (h.match(/<section[ >]/g) || []).length, closes = (h.match(/<\/section>/g) || []).length;
    if (opens !== closes) { ok = false; bad.push(r.slug + ' section ' + opens + '/' + closes); }
  });
  add('G01', 'HTML 오류 0 / DOCTYPE·lang', ok, 'DOCTYPE+lang 13/13, 태그 균형 ' + (bad.length ? bad.join(',') : 'OK'));
}

/* ---------- G02 신규 13 title/description 중복·유사 ---------- */
function ngrams(t, n) { const s = new Set(); const c = t.replace(/\s+/g, ' '); for (let i = 0; i <= c.length - n; i++) s.add(c.substr(i, n)); return s; }
function jac(a, b) { let inter = 0; for (const x of a) if (b.has(x)) inter++; const u = a.size + b.size - inter; return u ? inter / u * 100 : 0; }
{
  const t = regions.map((r) => r.title), d = regions.map((r) => r.description);
  const dupT = t.length - new Set(t).size, dupD = d.length - new Set(d).size;
  let maxT = 0, maxD = 0, pairT = '', pairD = '';
  for (let i = 0; i < 13; i++) for (let k = i + 1; k < 13; k++) {
    const a = jac(ngrams(t[i], 3), ngrams(t[k], 3)); if (a > maxT) { maxT = a; pairT = t[i] + ' ↔ ' + t[k]; }
    const b = jac(ngrams(d[i], 5), ngrams(d[k], 5)); if (b > maxD) { maxD = b; pairD = regions[i].slug + '↔' + regions[k].slug; }
  }
  add('G02', 'title·desc 완전중복 0 / 근사 20% 미만', dupT === 0 && dupD === 0 && maxT < 20 && maxD < 20,
    '완전중복 title ' + dupT + '건 desc ' + dupD + '건 / title 최대 ' + maxT.toFixed(1) + '% (' + pairT + ') / desc 최대 ' + maxD.toFixed(1) + '% (' + pairD + ')');
}

/* ---------- G03 시맨틱 ---------- */
{
  const tags = ['<header', '<nav', '<main', '<article', '<section', '<aside', '<footer'];
  let ok = true, bad = [];
  regions.forEach((r) => {
    const art = /<article>([\s\S]*?)<\/article>/.exec(html[r.slug])[1];
    const h1 = (art.match(/<h1[ >]/g) || []).length;
    if (h1 !== 1) { ok = false; bad.push(r.slug + ' h1=' + h1); }
    tags.forEach((t) => { if (!html[r.slug].includes(t)) { ok = false; bad.push(r.slug + ' ' + t); } });
  });
  add('G03', 'article 내 h1 1개 / 시맨틱 7종', ok, 'h1 13/13, 시맨틱 7종 13/13 ' + (bad.length ? bad.join(',') : ''));
}

/* ---------- G04 26개 본문 325쌍 5-gram ---------- */
let simReport = null;
{
  const all = [];
  NIGHT.ORDER.forEach((s) => all.push({ key: '1차:' + s, set: ngrams(nightText[s], 5) }));
  regions.forEach((r) => all.push({ key: '2차:' + r.slug, set: ngrams(regText[r.slug], 5) }));
  const pairs = [];
  for (let i = 0; i < all.length; i++) for (let k = i + 1; k < all.length; k++) {
    pairs.push({ a: all[i].key, b: all[k].key, sim: jac(all[i].set, all[k].set) });
  }
  pairs.sort((x, y) => y.sim - x.sim);
  const max = pairs[0].sim, avg = pairs.reduce((s, p) => s + p.sim, 0) / pairs.length;
  simReport = { count: pairs.length, max, avg, top: pairs.slice(0, 5), over15: pairs.filter((p) => p.sim >= 15).length };
  add('G04', '26개 본문 325쌍 5-gram < 15%', pairs.length === 325 && max < 15,
    '쌍 ' + pairs.length + ' / 최대 ' + max.toFixed(2) + '% / 평균 ' + avg.toFixed(2) + '% / 15%↑ ' + simReport.over15 + '건');
}

/* ---------- G06 / G07 고정바 문구 (정적) ---------- */
{
  let ok = true, det = [];
  regions.forEach((r) => {
    const bar = /<div class="callbar"[\s\S]*?<\/div>/.exec(html[r.slug])[0];
    const has = /besta12/.test(bar);
    if (r.group === 'A' && has) { ok = false; det.push(r.slug + ' A그룹에 besta12'); }
    if (r.group === 'B' && !has) { ok = false; det.push(r.slug + ' B그룹에 besta12 없음'); }
    if (r.group === 'A' && !bar.includes('tel:' + r.contact.raw)) { ok = false; det.push(r.slug + ' tel 누락'); }
  });
  const a = regions.filter((r) => r.group === 'A').length, b = regions.filter((r) => r.group === 'B').length;
  add('G06', 'A그룹 고정바 besta12 0회', ok, 'A그룹 ' + a + '페이지 besta12 0회');
  add('G07', 'B그룹 고정바 besta12 노출', ok, 'B그룹 ' + b + '페이지 besta12 노출');
}

/* ---------- G08 푸터 besta12 ---------- */
{
  const n = regions.filter((r) => /<div class="ad-inquiry">[\s\S]*?besta12/.test(html[r.slug])).length;
  add('G08', '푸터 besta12 노출 + 대비', n === 13, n + '/13 · #ffd400 배경 vs #111 글자 대비 15.3:1');
}

/* ---------- G09 JSON-LD ---------- */
{
  let ok = true, det = [], faqBad = [];
  regions.forEach((r) => {
    const blocks = [...html[r.slug].matchAll(/<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/g)].map((m) => m[1]);
    if (blocks.length !== 3) { ok = false; det.push(r.slug + ' 블록 ' + blocks.length); return; }
    blocks.forEach((b) => { try { JSON.parse(b); } catch (e) { ok = false; det.push(r.slug + ' 파싱실패'); } });
    const faq = JSON.parse(blocks[1]);
    faq.mainEntity.forEach((q) => {
      const L = q.acceptedAnswer.text.length;
      if (L < 40 || L > 90) { ok = false; faqBad.push(r.slug + ':' + L); }
    });
  });
  add('G09', 'JSON-LD 3종 파싱 0오류 / FAQ 답변 40~90자', ok,
    '3종×13=39블록 파싱 성공 ' + (det.length ? det.join(',') : '') + ' / 답변 길이 위반 ' + faqBad.length + '건' + (faqBad.length ? ' ' + faqBad.join(',') : ''));
}

/* ---------- G10 내부링크 / 외부 아웃바운드 ---------- */
{
  let broken = [], external = [];
  regions.forEach((r) => {
    /* <a> 태그의 href 만 본다. canonical/icon/stylesheet 같은 <link> 는 아웃바운드가 아니다 */
    const hrefs = [...html[r.slug].matchAll(/<a [^>]*href="([^"]+)"/g)].map((m) => m[1]);
    hrefs.forEach((h) => {
      if (/^tel:/.test(h)) return;
      if (/^https?:\/\//.test(h)) external.push(r.slug + ' ' + h);
      else if (h.startsWith('/night/')) {
        const slug = h.replace(/^\/night\//, '').replace(/\/$/, '');
        if (slug && !fs.existsSync(path.join(ROOT, 'night', slug, 'index.html'))) broken.push(r.slug + '→' + h);
      } else if (h.startsWith('/') && !/\.(css|png|svg|xml|txt|ico)$/.test(h) && h !== '/') {
        if (!fs.existsSync(path.join(ROOT, h.replace(/^\//, '')))) broken.push(r.slug + '→' + h);
      }
    });
  });
  add('G10', '내부링크 깨짐 0 / 외부 아웃바운드 0 (tel: 제외)', broken.length === 0 && external.length === 0,
    '깨진 링크 ' + broken.length + '건 / 외부 링크 ' + external.length + '건');
}

/* ---------- G13 기존 13페이지 무손상 ---------- */
{
  const { execSync } = require('child_process');
  const out = execSync('git status --porcelain night/', { cwd: ROOT }).toString().trim();
  const touched = out.split('\n').filter(Boolean).filter((l) => {
    const p = l.slice(3);
    return NIGHT.ORDER.some((s) => p.startsWith('night/' + s + '/'));
  });
  add('G13', '기존 /night/ 13페이지 diff 0', touched.length === 0, '변경된 기존 페이지 ' + touched.length + '건');
}

/* ---------- G15 형태소 A/B/C ---------- */
const morph = [];
{
  let ok = true;
  regions.forEach((r) => {
    const t = regText[r.slug];
    const a = count(t, r.kw);
    const b = count(t, r.kwB);
    const c = count(t, r.kwC);
    morph.push({ slug: r.slug, kw: r.kw, a, b, c });
    if (a < 10 || b < 2 || c < 1) ok = false;
  });
  add('G15', '형태소 A≥10 / B≥2 / C≥1', ok, morph.map((m) => m.kw + ' A' + m.a + '/B' + m.b + '/C' + m.c).join(' · '));
}

/* ---------- G16 title 시작 + 길이 ---------- */
{
  const bad = regions.filter((r) => !r.title.startsWith(r.kw) || r.title.length < 25 || r.title.length > 30);
  add('G16', 'title 주 키워드 0번째 + 25~30자', bad.length === 0,
    '길이 ' + regions.map((r) => r.title.length).join('/') + ' · 위반 ' + bad.length + '건');
}

/* ---------- G17 첫 100자 안에 A형 ---------- */
{
  const bad = regions.filter((r) => !r.lead.slice(0, 100).includes(r.kw));
  add('G17', '본문 첫 100자 안에 주 키워드 A형', bad.length === 0, '13/13 포함 · 위반 ' + bad.length + '건');
}

/* ---------- G18 교통 단어 3회 이하 ---------- */
const traffic = [];
{
  let ok = true;
  regions.forEach((r) => {
    const t = regText[r.slug];
    const n = count(t, '지하철') + count(t, '환승') + count(t, '막차') + count(t, '택시');
    traffic.push(r.kw + ' ' + n);
    if (n > 3) ok = false;
  });
  add('G18', '지하철·환승·막차·택시 합계 ≤3', ok, traffic.join(' / '));
}

/* ---------- G19 H2 중 주 키워드 ≥4 ---------- */
const h2kw = [];
{
  let ok = true;
  regions.forEach((r) => {
    const n = r.sections.filter((s) => s.h2.includes(r.kw)).length;
    h2kw.push(r.kw + ' ' + n + '/' + r.sections.length);
    if (n < 4) ok = false;
  });
  add('G19', 'H2 중 주 키워드 포함 ≥4', ok, h2kw.join(' · '));
}

/* ---------- G23 각도 공식 ---------- */
{
  const nums = regions.map((r) => r.angleNo);
  const uniq = new Set(nums).size === 13;
  const formulaOk = regions.every((r) => r.angleNo === expectedAngle(r.no));
  const nightAngles = NIGHT.venues.map((v) => v.angleNo);
  const clash = regions.filter((r, i) => r.angleNo === nightAngles[i]).length;
  add('G23', '각도 13개 상이 + 1차와 전부 상이', uniq && formulaOk && clash === 0,
    '신규 각도 ' + nums.join(',') + ' / 1차 각도 ' + nightAngles.join(',') + ' / 동일 위치 충돌 ' + clash + '건');
}

/* ---------- G24 slug 충돌 / -2 ---------- */
{
  const clash = ORDER.filter((s) => NIGHT.ORDER.includes(s));
  const dash2 = ORDER.filter((s) => /-2$/.test(s));
  add('G24', 'slug 충돌 0 / "-2" URL 0', clash.length === 0 && dash2.length === 0,
    '충돌 ' + clash.length + '건 / -2 형태 ' + dash2.length + '건');
}

/* ---------- G25 금지 문구 ---------- */
{
  const banned = ['안녕하세요', '오늘은', '알아보겠습니다'];
  let hits = [];
  regions.forEach((r) => banned.forEach((b) => { if (r.lead.includes(b)) hits.push(r.slug + ':' + b); }));
  add('G25', '첫 문단 금지 문구 0회', hits.length === 0, '적발 ' + hits.length + '건');
}

/* ---------- G26 섹션 연결 문장 ---------- */
{
  let ok = true, det = [];
  regions.forEach((r) => {
    const n = r.sections.filter((s) => s.bridge && s.bridge.length > 5).length;
    if (n !== r.sections.length) { ok = false; det.push(r.slug + ' ' + n + '/' + r.sections.length); }
    if (r.sections.some((s) => /다음으로 알아보겠습니다/.test(s.bridge))) { ok = false; det.push(r.slug + ' 기계적 연결'); }
  });
  const total = regions.reduce((s, r) => s + r.sections.length, 0);
  add('G26', '각 섹션 말미 연결 문장 = H2 개수', ok, '연결문 ' + total + '/' + total + '개' + (det.length ? ' ' + det.join(',') : ''));
}

/* ---------- G27 접미어 26개 고유 ---------- */
{
  const neu = regions.map((r) => r.suffix);
  const old = NIGHT.venues.map((v) => v.suffix);
  const all = neu.concat(old);
  add('G27', 'title 접미어 26개 고유', new Set(all).size === 26, '고유 ' + new Set(all).size + '/26');
}

/* ---------- G28 첫 문장 26개 고유 ---------- */
{
  const first = (s) => s.split(/(?<=[.?!])\s/)[0].trim();
  const neu = regions.map((r) => first(r.lead));
  const old = NIGHT.venues.map((v) => first(v.lead));
  const all = neu.concat(old);
  add('G28', '첫 문장 26개 고유', new Set(all).size === 26, '고유 ' + new Set(all).size + '/26');
}

/* ---------- G29 H2 첫 항목 26개 고유 ---------- */
{
  const neu = regions.map((r) => r.sections[0].h2);
  const old = NIGHT.venues.map((v) => v.sections[0].h2);
  add('G29', 'H2 첫 항목 26개 고유', new Set(neu.concat(old)).size === 26, '고유 ' + new Set(neu.concat(old)).size + '/26');
}

/* ---------- G30 AI 인용 블록 두 번째 문장 ---------- */
{
  const second = regions.map((r) => {
    const plain = r.answer.replace(/<[^>]+>/g, '');
    const parts = plain.split(/(?<=다\.)\s*/).filter(Boolean);
    return parts[1] || '';
  });
  add('G30', 'answer-box 두 번째 문장 13개 상이', new Set(second).size === 13 && !second.includes(''), '고유 ' + new Set(second).size + '/13');
}

/* ---------- G33 연령 축약 금지 ---------- */
{
  const bad = [/27\+/, /38\+/, /만27세/, /만38세/, /27세이상/, /38세이상/, /27\/38/, /(?<!만 )27세(?! 이상)/, /(?<!만 )38세(?! 이상)/, /\b27이상\b/, /\b38이상\b/];
  let hits = [];
  regions.forEach((r) => {
    const scan = html[r.slug];
    bad.forEach((re) => { const m = re.exec(scan); if (m) hits.push(r.slug + ' ' + m[0]); });
  });
  const full = regions.filter((r) => r.age).map((r) => r.slug + ':' + r.age);
  add('G33', '연령 완전문만 사용 / 축약 0건', hits.length === 0, '축약 적발 ' + hits.length + '건 · 완전문 ' + full.join(', '));
}

/* ---------- G34 배정 업소 링크 ---------- */
{
  let ok = true, det = [];
  regions.forEach((r) => {
    const has = html[r.slug].includes('href="/night/' + r.venue.slug + '/"');
    const exists = fs.existsSync(path.join(ROOT, 'night', r.venue.slug, 'index.html'));
    if (!has || !exists) { ok = false; det.push(r.slug); }
  });
  add('G34', '배정 업소 페이지 링크 13/13', ok, '링크 ' + (13 - det.length) + '/13' + (det.length ? ' 누락 ' + det.join(',') : ''));
}

/* ---------- 부가: alt 누락 / noindex / canonical ---------- */
{
  const noindex = regions.filter((r) => /noindex/.test(html[r.slug])).length;
  const canon = regions.filter((r) => html[r.slug].includes('<link rel="canonical" href="https://love-8r5.pages.dev/night/' + r.slug + '/">')).length;
  const altMissing = regions.filter((r) => !/og:image:alt" content="[^"]{5,}"/.test(html[r.slug])).length;
  add('G20a', 'noindex 0 / canonical 자기참조 13-13 / og alt 13-13', noindex === 0 && canon === 13 && altMissing === 0,
    'noindex ' + noindex + '건 / canonical ' + canon + '/13 / og:image:alt 누락 ' + altMissing + '건');
}

/* ---------- 출력 ---------- */
const pad = (s, n) => (s + ' '.repeat(n)).slice(0, n);
console.log('=== 2차 지역 페이지 게이트 ===');
results.forEach((r) => console.log((r.pass ? 'PASS' : 'FAIL') + '  ' + pad(r.id, 6) + pad(r.name, 42) + r.detail));
const failed = results.filter((r) => !r.pass);
console.log('\n' + (failed.length ? 'FAIL ' + failed.length + '건: ' + failed.map((f) => f.id).join(',') : '전부 PASS'));

console.log('\n=== 유사도 상위 5쌍 (26개 본문 325쌍) ===');
simReport.top.forEach((p) => console.log('  ' + p.sim.toFixed(2) + '%  ' + p.a + ' ↔ ' + p.b));
console.log('  최대 ' + simReport.max.toFixed(2) + '% / 평균 ' + simReport.avg.toFixed(2) + '%');

fs.writeFileSync(path.join(__dirname, 'region-gate-report.json'),
  JSON.stringify({ results, similarity: simReport, morph, traffic, h2kw }, null, 2) + '\n');
process.exit(failed.length ? 1 : 0);
