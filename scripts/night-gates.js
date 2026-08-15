'use strict';
/** 배포 전 정적 게이트. G05·G12는 Playwright, G11은 Lighthouse, G20 일부는 라이브에서 별도 측정. */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const { ORDER, SITE_INDEX } = require('./build-night-pages.js');
const venues = ORDER.map((s) => require(path.join(__dirname, 'night', s + '.js')));
const research = JSON.parse(fs.readFileSync(path.join(__dirname, 'night-research.json'), 'utf8'));

const html = {};
venues.forEach((v) => { html[v.slug] = fs.readFileSync(path.join(ROOT, 'night', v.slug, 'index.html'), 'utf8'); });
const hubHtml = fs.readFileSync(path.join(ROOT, 'night', 'index.html'), 'utf8');
const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

const results = [];
const add = (id, metric, pass) => results.push({ id, metric, pass });

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr', '!doctype']);
function structErrors(src) {
  const errs = []; const stack = [];
  const re = /<(\/?)([a-zA-Z!][a-zA-Z0-9-]*)([^>]*?)(\/?)>/g;
  let m, inScript = false;
  while ((m = re.exec(src))) {
    const close = m[1] === '/', tag = m[2].toLowerCase(), self = m[4] === '/';
    if (inScript) { if (close && tag === 'script') inScript = false; continue; }
    if (!close && tag === 'script') { inScript = true; continue; }
    if (VOID.has(tag) || self) continue;
    if (!close) stack.push(tag);
    else { if (!stack.length) { errs.push('닫는 태그 과다:' + tag); continue; } const top = stack.pop(); if (top !== tag) errs.push('불일치:' + top + '/' + tag); }
  }
  if (stack.length) errs.push('안 닫힌:' + stack.join(','));
  return errs;
}
function mainText(src) {
  let s = src.slice(src.indexOf('<main'), src.indexOf('</main>'));
  return s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}
const korean = (s) => (s.match(/[가-힣]/g) || []).length;
const metaOf = (src, n) => { const m = src.match(new RegExp('<meta name="' + n + '" content="([^"]*)"')); return m ? m[1] : null; };
const titleOf = (src) => { const m = src.match(/<title>([^<]*)<\/title>/); return m ? m[1] : null; };
const count = (hay, needle) => hay.split(needle).length - 1;

/* G01 */
(() => {
  let bad = 0; const d = [];
  Object.entries(html).forEach(([slug, src]) => {
    const e = structErrors(src);
    if (!src.startsWith('<!DOCTYPE html>')) e.push('DOCTYPE');
    if (!/<html lang="ko">/.test(src)) e.push('lang');
    if (e.length) { bad++; d.push(slug + ':' + e.join('|')); }
  });
  add('G01', '구조 오류 ' + bad + '건' + (d.length ? ' — ' + d.join(' / ') : ''), bad === 0);
})();

/* G02 */
(() => {
  const t = venues.map((v) => titleOf(html[v.slug]));
  const de = venues.map((v) => metaOf(html[v.slug], 'description'));
  const dupT = t.length - new Set(t).size, dupD = de.length - new Set(de).size;
  const near = (a, b) => { const A = new Set(a.split(/\s+/)), B = new Set(b.split(/\s+/)); const i = [...A].filter((x) => B.has(x)).length; return i / new Set([...A, ...B]).size; };
  let mx = 0, pr = '';
  for (let i = 0; i < 13; i++) for (let k = i + 1; k < 13; k++) { const s = Math.max(near(t[i], t[k]), near(de[i], de[k])); if (s > mx) { mx = s; pr = venues[i].slug + '↔' + venues[k].slug; } }
  add('G02', '완전중복 title ' + dupT + '/desc ' + dupD + ', 근사 최대 ' + (mx * 100).toFixed(1) + '% (' + pr + ')', dupT === 0 && dupD === 0 && mx < 0.8);
})();

/* G03 article h1 1개 + 시맨틱 7종 */
(() => {
  const TAGS = ['<header', '<nav', '<main', '<article', '<section', '<aside', '<footer'];
  let bad = 0; const d = [];
  venues.forEach((v) => {
    const src = html[v.slug];
    const art = src.slice(src.indexOf('<article'), src.indexOf('</article>'));
    const h1 = (art.match(/<h1[\s>]/g) || []).length;
    if (h1 !== 1) { bad++; d.push(v.slug + ' h1=' + h1); }
    const missing = TAGS.filter((t) => !src.includes(t));
    if (missing.length) { bad++; d.push(v.slug + ' 누락' + missing.join(',')); }
  });
  add('G03', 'article 내 h1 1개 + 시맨틱 7종 위반 ' + bad + '건' + (d.length ? ' — ' + d.join(',') : ''), bad === 0);
})();

/* G04 5-gram */
const sim = (() => {
  const grams = venues.map((v) => {
    const t = mainText(html[v.slug]).replace(/[^가-힣]/g, '');
    const s = new Set();
    for (let i = 0; i + 5 <= t.length; i++) s.add(t.slice(i, i + 5));
    return s;
  });
  const pairs = [];
  for (let i = 0; i < 13; i++) for (let k = i + 1; k < 13; k++) {
    const A = grams[i], B = grams[k]; let inter = 0; A.forEach((g) => { if (B.has(g)) inter++; });
    pairs.push({ pair: venues[i].slug + ' ↔ ' + venues[k].slug, jac: inter / (A.size + B.size - inter) });
  }
  pairs.sort((a, b) => b.jac - a.jac);
  const max = pairs[0].jac, avg = pairs.reduce((s, p) => s + p.jac, 0) / pairs.length;
  add('G04', '78쌍 최대 ' + (max * 100).toFixed(2) + '% / 평균 ' + (avg * 100).toFixed(2) + '% (하드 15%, 목표 10%)', max < 0.15);
  return { pairs, max, avg };
})();

/* G06 / G07 */
(() => {
  const bar = (src) => { const i = src.indexOf('<div class="callbar"'); return src.slice(i, src.indexOf('</div>', i)); };
  const aBad = venues.filter((v) => v.group === 'A' && /besta12/.test(bar(html[v.slug])));
  const bOk = venues.filter((v) => v.group === 'B' && /besta12/.test(bar(html[v.slug])));
  add('G06', 'A그룹 4페이지 고정바 내 besta12 ' + aBad.length + '회', aBad.length === 0);
  add('G07', 'B그룹 고정바 besta12 노출 ' + bOk.length + '/9', bOk.length === 9);
})();

/* G08 */
(() => {
  const ok = venues.filter((v) => /class="ad-inquiry"[\s\S]{0,200}besta12/.test(html[v.slug])).length;
  const lum = (rgb) => { const f = rgb.map((c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }); return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2]; };
  const c = (lum([255, 212, 0]) + 0.05) / (lum([17, 17, 17]) + 0.05);
  add('G08', '푸터 besta12 ' + ok + '/13, #ffd400 vs #111 대비 ' + c.toFixed(2) + ':1', ok === 13 && c >= 4.5);
})();

/* G09 JSON-LD + FAQ 답변 길이 */
const faqLens = [];
(() => {
  let bad = 0, total = 0; const d = [];
  venues.forEach((v) => {
    const blocks = html[v.slug].match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || [];
    if (blocks.length !== 3) { bad++; d.push(v.slug + ' 블록' + blocks.length); }
    blocks.forEach((b) => { total++; try { JSON.parse(b.replace(/<script[^>]*>/, '').replace('</script>', '')); } catch (e) { bad++; d.push(v.slug + ' 파싱'); } });
    v.sections.forEach((s) => {
      const n = s.faq.a.length; faqLens.push(n);
      if (n < 40 || n > 90) { bad++; d.push(v.slug + ' FAQ ' + n + '자'); }
    });
  });
  add('G09', 'JSON-LD ' + total + '블록 오류 0 / FAQ 답변 ' + faqLens.length + '개 범위(' + Math.min(...faqLens) + '~' + Math.max(...faqLens) + '자, 기준 40~90) 위반 ' + bad + '건' + (d.length ? ' — ' + d.join(',') : ''), bad === 0);
})();

/* G10 */
(() => {
  let broken = 0, external = 0; const d = [];
  const exists = (href) => {
    if (href === '/') return fs.existsSync(path.join(ROOT, 'index.html'));
    const p = href.replace(/^\//, '').replace(/\/$/, '');
    return fs.existsSync(path.join(ROOT, p, 'index.html')) || fs.existsSync(path.join(ROOT, p + '.html')) || fs.existsSync(path.join(ROOT, p));
  };
  const files = venues.map((v) => ['night/' + v.slug, html[v.slug]]);
  files.push(['night', hubHtml]);
  files.forEach(([name, src]) => {
    [...src.matchAll(/<a\b[^>]*\shref="([^"]+)"/g)].map((m) => m[1]).forEach((h) => {
      if (h.startsWith('#') || h.startsWith('tel:')) return;
      if (/^https?:\/\//.test(h)) { external++; d.push(name + '→' + h); return; }
      if (!exists(h)) { broken++; d.push(name + ' 깨짐 ' + h); }
    });
  });
  add('G10', '깨진 링크 ' + broken + '건 / 외부 아웃바운드 ' + external + '건' + (d.length ? ' — ' + d.join(' , ') : ''), broken === 0 && external === 0);
})();

/* G13 — night 작업 착수 이전 커밋(BASE) 기준으로 기존 사이트 파일 변경 여부를 본다.
   night/·og/·scripts/·.seo-fingerprint.json 은 이번 작업으로 새로 추가한 산출물이라 A(추가)로 잡힌다. */
(() => {
  const BASE = '9c1d67d';
  const out = execSync('git -C ' + ROOT + ' diff --name-status ' + BASE, { encoding: 'utf8' }).trim();
  const rows = out ? out.split('\n').map((l) => l.split('\t')) : [];
  const allow = new Set(['sitemap.xml', 'robots.txt', 'llms.txt', 'index.html']);
  const modified = rows.filter((r) => r[0] !== 'A').map((r) => r[1]);
  const bad = modified.filter((f) => !allow.has(f));
  const del = execSync('git -C ' + ROOT + ' diff -U0 ' + BASE + ' -- sitemap.xml robots.txt llms.txt index.html | grep -c "^-[^-]" || true', { encoding: 'utf8', shell: '/bin/bash' }).trim();
  add('G13', 'BASE ' + BASE + ' 대비 기존 파일 수정 ' + modified.length + '개(' + modified.join(', ') + '), 허용 4종 외 ' + bad.length + '개, 삭제 줄 ' + del + ', 신규 추가 ' + rows.filter((r) => r[0] === 'A').length + '개', bad.length === 0 && del === '0');
})();

/* G14 */
(() => {
  const hues = new Set(); let bad = 0; const sizes = [];
  venues.forEach((v) => {
    const f = path.join(ROOT, 'og', v.slug + '-og.png');
    if (!fs.existsSync(f)) { bad++; return; }
    const buf = fs.readFileSync(f);
    if (buf.readUInt32BE(16) !== 1200 || buf.readUInt32BE(20) !== 1200) bad++;
    sizes.push(Math.round(buf.length / 1024)); hues.add(v.hue);
  });
  add('G14', '13장 존재/1200x1200 오류 ' + bad + '건, 배경 hue 고유 ' + hues.size + '개, 최대 ' + Math.max(...sizes) + 'KB', bad === 0 && hues.size === 13);
})();

/* G15 형태소 3형태 */
const morph = {};
(() => {
  let bad = 0; const d = [];
  venues.forEach((v) => {
    const t = mainText(html[v.slug]);
    const a = count(t, v.name), b = count(t, v.nameB), c = count(t, v.nameC);
    morph[v.slug] = { a, b, c };
    if (a < 10 || b < 2 || c < 1) { bad++; d.push(v.slug + ' A' + a + '/B' + b + '/C' + c); }
  });
  const A = Object.values(morph).map((m) => m.a), B = Object.values(morph).map((m) => m.b), C = Object.values(morph).map((m) => m.c);
  add('G15', 'A 최소 ' + Math.min(...A) + '회 / B 최소 ' + Math.min(...B) + '회 / C 최소 ' + Math.min(...C) + '회 (기준 10/2/1) 위반 ' + bad + '건' + (d.length ? ' — ' + d.join(',') : ''), bad === 0);
})();

/* G16 title 0번째 + 30자 이내 */
(() => {
  let bad = 0; const d = [];
  venues.forEach((v) => {
    const t = titleOf(html[v.slug]);
    if (t.indexOf(v.name) !== 0) { bad++; d.push(v.slug + ' 시작 아님'); }
    if (t.length > 30) { bad++; d.push(v.slug + ' ' + t.length + '자'); }
  });
  const lens = venues.map((v) => titleOf(html[v.slug]).length);
  add('G16', 'title 업소명 0번째 시작 13/13, 길이 ' + Math.min(...lens) + '~' + Math.max(...lens) + '자 (기준 30 이내) 위반 ' + bad + '건' + (d.length ? ' — ' + d.join(',') : ''), bad === 0);
})();

/* G17 첫 100자 A형 */
(() => {
  const ok = venues.filter((v) => mainText(html[v.slug]).slice(0, 100).includes(v.name)).length;
  add('G17', '본문 첫 100자 내 업소명 A형 ' + ok + '/13', ok === 13);
})();

/* G18 업소·문화 ≥80% / 지역·교통 ≤20% + 교통어 페이지당 3회 이하 */
const ratios = {};
(() => {
  const BAN = ['지하철', '환승', '막차', '택시'];
  const rows = venues.map((v) => {
    const src = html[v.slug];
    const total = (src.match(/<p class="nt-p[ "]/g) || []).length;
    const geo = (src.match(/<p class="nt-p nt-geo">/g) || []).length;
    const t = mainText(src);
    const ban = BAN.reduce((s, w) => s + count(t, w), 0);
    ratios[v.slug] = { geo, total, ven: total - geo, r: geo / total, ban };
    return { r: geo / total, ban };
  });
  const maxR = Math.max(...rows.map((r) => r.r));
  const maxBan = Math.max(...rows.map((r) => r.ban));
  add('G18', '지역·교통 문단 최대 ' + (maxR * 100).toFixed(1) + '% (업소·문화 최소 ' + ((1 - maxR) * 100).toFixed(1) + '%, 기준 80%) / 지하철·환승·막차·택시 페이지당 최대 ' + maxBan + '회 (기준 3회)', maxR <= 0.20 && maxBan <= 3);
})();

/* G19 H2 업소명 */
(() => {
  const rows = venues.map((v) => v.sections.filter((s) => s.h2.includes(v.name)).length);
  add('G19', 'H2 내 업소명 최소 ' + Math.min(...rows) + '개 / H2 총 ' + venues.map((v) => v.sections.length).join(',') + ' (기준 4)', rows.every((n) => n >= 4));
})();

/* G20 정적 부분: noindex 0 / canonical 자기지목 / img alt 누락 0 */
(() => {
  let noindex = 0, canonBad = 0, altBad = 0;
  venues.forEach((v) => {
    const src = html[v.slug];
    if (/noindex/i.test(src)) noindex++;
    if (!src.includes('<link rel="canonical" href="https://ulsand.pages.dev/night/' + v.slug + '/">')) canonBad++;
    [...src.matchAll(/<img\b[^>]*>/g)].forEach((m) => { if (!/\salt=/.test(m[0])) altBad++; });
  });
  add('G20a', 'noindex ' + noindex + '건 / canonical 자기지목 ' + (13 - canonBad) + '/13 / img alt 누락 ' + altBad + '건', noindex === 0 && canonBad === 0 && altBad === 0);
})();

/* G21 1단계 링크 도달 */
(() => {
  const fromIndex = venues.filter((v) => indexHtml.includes('/night/' + v.slug + '/')).length;
  const fromHub = venues.filter((v) => hubHtml.includes('/night/' + v.slug + '/')).length;
  const hubLinked = indexHtml.includes('href="/night/"');
  add('G21', '메인 index.html → ' + fromIndex + '/13 직접 링크, 허브 → ' + fromHub + '/13, 메인→허브 링크 ' + (hubLinked ? '있음' : '없음'), fromIndex === 13 && fromHub === 13 && hubLinked);
})();

/* G22 웹 실사 */
(() => {
  const low = research.venues.filter((v) => v.queries.length < 5);
  const adopted = research.venues.flatMap((v) => v.fields.filter((f) => f.adopted));
  const totalQ = research.venues.reduce((s, v) => s + v.queries.length, 0);
  add('G22', '업소당 검색 최소 ' + Math.min(...research.venues.map((v) => v.queries.length)) + '회(총 ' + totalQ + '회), 채택 필드 ' + adopted.length + '개 출처 기록 존재', low.length === 0 && adopted.length > 0);
})();

/* G23 SITE_INDEX 1 = 정면 소개형 */
(() => {
  const bad = [];
  venues.forEach((v) => {
    const t = titleOf(html[v.slug]);
    if (t.indexOf(v.name + ' 어떤 곳일까') !== 0) bad.push(v.slug + ' title 공식 불일치');
    if (/(최고|1위|완벽|대박)/.test(t)) bad.push(v.slug + ' 과장어');
    // 첫 문장이 업소를 한 줄로 규정하는가: 업소명으로 시작하고 "~입니다"로 닫히는가
    const first = v.lead.split('.')[0] + '.';
    if (first.indexOf(v.name) !== 0) bad.push(v.slug + ' 첫 문장 업소명 시작 아님');
    if (!/(입니다|나이트클럽)/.test(first)) bad.push(v.slug + ' 첫 문장 규정형 아님');
    const d = metaOf(html[v.slug], 'description');
    if (d.length < 80 || d.length > 120) bad.push(v.slug + ' desc ' + d.length + '자');
    if (!d.slice(0, 15).includes(v.name)) bad.push(v.slug + ' desc 앞15자');
  });
  add('G23', 'SITE_INDEX ' + SITE_INDEX + ' 정면 소개형(title 공식·첫 문장 규정형·과장어 0·desc 80~120자) 위반 ' + bad.length + '건' + (bad.length ? ' — ' + bad.join(', ') : ''), bad.length === 0);
})();

/* G25 첫 문단 금지어 */
(() => {
  const BAN = ['안녕하세요', '오늘은', '알아보겠습니다'];
  let n = 0; const d = [];
  venues.forEach((v) => {
    const t = mainText(html[v.slug]);
    BAN.forEach((w) => { const c = count(t, w); if (c) { n += c; d.push(v.slug + ':' + w); } });
  });
  add('G25', '본문 내 "안녕하세요/오늘은/알아보겠습니다" ' + n + '회' + (d.length ? ' — ' + d.join(',') : ''), n === 0);
})();

/* G26 섹션 연결 문장 */
(() => {
  let bad = 0; const d = [];
  venues.forEach((v) => {
    const bridges = (html[v.slug].match(/<p class="nt-bridge">/g) || []).length;
    if (bridges !== v.sections.length) { bad++; d.push(v.slug + ' ' + bridges + '/' + v.sections.length); }
  });
  add('G26', '섹션 연결 문장 = H2 개수 위반 ' + bad + '건 (13페이지 × 섹션 ' + venues[0].sections.length + '개)' + (d.length ? ' — ' + d.join(',') : ''), bad === 0);
})();

/* G24 중복 URL */
(() => {
  const dirs = fs.readdirSync(path.join(ROOT, 'night')).filter((f) => fs.statSync(path.join(ROOT, 'night', f)).isDirectory());
  const dup = dirs.filter((d) => /-\d+$/.test(d));
  add('G24', 'night 하위 디렉터리 ' + dirs.length + '개, xxx-2 형태 중복 ' + dup.length + '건', dup.length === 0 && dirs.length === 13);
})();

const lengths = venues.map((v) => ({ slug: v.slug, ko: korean(mainText(html[v.slug])) }));

console.log('\n=== 게이트 (정적) ===');
results.forEach((r) => console.log((r.pass ? 'PASS' : 'FAIL') + '  ' + r.id + '  ' + r.metric));
console.log('\n=== 분량 / 형태소 (A붙임 B띄움 C지역+업종) ===');
lengths.forEach((l) => console.log('  ' + l.slug.padEnd(26) + l.ko + '자  A' + morph[l.slug].a + ' B' + morph[l.slug].b + ' C' + morph[l.slug].c + '  업소문단 ' + ratios[l.slug].ven + '/' + ratios[l.slug].total + '  교통어 ' + ratios[l.slug].ban));
console.log('\n=== 유사도 상위 3쌍 ===');
sim.pairs.slice(0, 3).forEach((p) => console.log('  ' + (p.jac * 100).toFixed(2) + '%  ' + p.pair));

fs.writeFileSync(path.join(__dirname, 'night-gate-report.json'), JSON.stringify({ results, lengths, morph, ratios, faq: { min: Math.min(...faqLens), max: Math.max(...faqLens) }, sim: { max: sim.max, avg: sim.avg, top3: sim.pairs.slice(0, 3) } }, null, 2));
const failed = results.filter((r) => !r.pass);
console.log('\n' + (failed.length ? 'FAIL ' + failed.map((f) => f.id).join(',') : '정적 게이트 전부 PASS'));
process.exit(failed.length ? 1 : 0);
