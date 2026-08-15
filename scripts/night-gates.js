'use strict';
/** 배포 전 정적 게이트 (G01~G04, G06~G10, G13~G20). G05·G11·G12 는 Playwright/Lighthouse 로 별도 측정. */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const { ORDER } = require('./build-night-pages.js');
const venues = ORDER.map((s) => require(path.join(__dirname, 'night', s + '.js')));
const research = JSON.parse(fs.readFileSync(path.join(__dirname, 'night-research.json'), 'utf8'));

const html = {};
venues.forEach((v) => { html[v.slug] = fs.readFileSync(path.join(ROOT, 'night', v.slug, 'index.html'), 'utf8'); });

const results = [];
const add = (id, metric, pass) => results.push({ id, metric, pass });

/* ---------- 공통 추출 ---------- */
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr', '!doctype']);
function structErrors(src) {
  const errs = [];
  const stack = [];
  const re = /<(\/?)([a-zA-Z!][a-zA-Z0-9-]*)([^>]*?)(\/?)>/g;
  let m;
  let inScript = false;
  while ((m = re.exec(src))) {
    const close = m[1] === '/';
    const tag = m[2].toLowerCase();
    const self = m[4] === '/';
    if (inScript) { if (close && tag === 'script') inScript = false; continue; }
    if (!close && tag === 'script') { inScript = true; continue; }
    if (VOID.has(tag) || self) continue;
    if (!close) stack.push(tag);
    else {
      if (!stack.length) { errs.push('닫는 태그 과다: ' + tag); continue; }
      const top = stack.pop();
      if (top !== tag) errs.push('태그 불일치: ' + top + ' vs /' + tag);
    }
  }
  if (stack.length) errs.push('안 닫힌 태그: ' + stack.join(','));
  return errs;
}
function mainText(src) {
  let s = src.slice(src.indexOf('<main'), src.indexOf('</main>'));
  s = s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  return s;
}
const korean = (s) => (s.match(/[가-힣]/g) || []).length;
const meta = (src, name) => { const m = src.match(new RegExp('<meta name="' + name + '" content="([^"]*)"')); return m ? m[1] : null; };
const title = (src) => { const m = src.match(/<title>([^<]*)<\/title>/); return m ? m[1] : null; };

/* ---------- G01 HTML 구조 ---------- */
(() => {
  let bad = 0; const detail = [];
  Object.entries(html).forEach(([slug, src]) => {
    const e = structErrors(src);
    if (!src.startsWith('<!DOCTYPE html>')) e.push('DOCTYPE 없음');
    if (!/<html lang="ko">/.test(src)) e.push('lang=ko 없음');
    if (e.length) { bad++; detail.push(slug + ': ' + e.join('|')); }
  });
  add('G01', '구조 오류 ' + bad + '건' + (detail.length ? ' — ' + detail.join(' / ') : ''), bad === 0);
})();

/* ---------- G02 title/description 중복 ---------- */
(() => {
  const t = venues.map((v) => title(html[v.slug]));
  const d = venues.map((v) => meta(html[v.slug], 'description'));
  const dupT = t.length - new Set(t).size;
  const dupD = d.length - new Set(d).size;
  const near = (a, b) => {
    const A = new Set(a.split(/\s+/)), B = new Set(b.split(/\s+/));
    const i = [...A].filter((x) => B.has(x)).length;
    return i / new Set([...A, ...B]).size;
  };
  let nearMax = 0, nearPair = '';
  for (let i = 0; i < 13; i++) for (let k = i + 1; k < 13; k++) {
    const s = Math.max(near(t[i], t[k]), near(d[i], d[k]));
    if (s > nearMax) { nearMax = s; nearPair = venues[i].slug + '↔' + venues[k].slug; }
  }
  add('G02', '완전중복 title ' + dupT + ' / desc ' + dupD + ', 근사 최대 ' + (nearMax * 100).toFixed(1) + '% (' + nearPair + ')', dupT === 0 && dupD === 0 && nearMax < 0.8);
})();

/* ---------- G03 h1 ---------- */
(() => {
  const counts = venues.map((v) => (html[v.slug].match(/<h1[\s>]/g) || []).length);
  add('G03', 'h1 개수 ' + [...new Set(counts)].join(',') + ' (13페이지)', counts.every((c) => c === 1));
})();

/* ---------- G04 5-gram 자카드 ---------- */
const sim = (() => {
  const grams = venues.map((v) => {
    const t = mainText(html[v.slug]).replace(/[^가-힣]/g, '');
    const s = new Set();
    for (let i = 0; i + 5 <= t.length; i++) s.add(t.slice(i, i + 5));
    return s;
  });
  const pairs = [];
  for (let i = 0; i < 13; i++) for (let k = i + 1; k < 13; k++) {
    const A = grams[i], B = grams[k];
    let inter = 0; A.forEach((g) => { if (B.has(g)) inter++; });
    const jac = inter / (A.size + B.size - inter);
    pairs.push({ pair: venues[i].slug + ' ↔ ' + venues[k].slug, jac });
  }
  pairs.sort((a, b) => b.jac - a.jac);
  const max = pairs[0].jac, avg = pairs.reduce((s, p) => s + p.jac, 0) / pairs.length;
  add('G04', '78쌍 최대 ' + (max * 100).toFixed(2) + '% / 평균 ' + (avg * 100).toFixed(2) + '% (하드 15%, 목표 10%)', max < 0.15);
  return { pairs, max, avg };
})();

/* ---------- G06 / G07 고정바 besta12 ---------- */
(() => {
  const bar = (src) => { const i = src.indexOf('<div class="callbar"'); return src.slice(i, src.indexOf('</div>', i)); };
  const aBad = venues.filter((v) => v.group === 'A' && /besta12/.test(bar(html[v.slug])));
  const bOk = venues.filter((v) => v.group === 'B' && /besta12/.test(bar(html[v.slug])));
  add('G06', 'A그룹 4페이지 고정바 내 besta12 ' + aBad.length + '회', aBad.length === 0);
  add('G07', 'B그룹 고정바 besta12 노출 ' + bOk.length + '/9', bOk.length === 9);
})();

/* ---------- G08 푸터 besta12 + 대비 ---------- */
(() => {
  const ok = venues.filter((v) => /class="ad-inquiry"[\s\S]{0,200}besta12/.test(html[v.slug])).length;
  const lum = (rgb) => { const f = rgb.map((c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }); return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2]; };
  const c = (lum([255, 212, 0]) + 0.05) / (lum([17, 17, 17]) + 0.05);
  add('G08', '푸터 besta12 ' + ok + '/13, #ffd400 vs #111 대비 ' + c.toFixed(2) + ':1', ok === 13 && c >= 4.5);
})();

/* ---------- G09 JSON-LD ---------- */
(() => {
  let bad = 0, total = 0; const detail = [];
  venues.forEach((v) => {
    const blocks = html[v.slug].match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || [];
    if (blocks.length !== 3) { bad++; detail.push(v.slug + ' 블록 ' + blocks.length + '개'); }
    blocks.forEach((b) => {
      total++;
      try { JSON.parse(b.replace(/<script[^>]*>/, '').replace('</script>', '')); }
      catch (e) { bad++; detail.push(v.slug + ' 파싱오류'); }
    });
  });
  add('G09', 'JSON-LD ' + total + '블록 파싱 오류 ' + bad + '건' + (detail.length ? ' — ' + detail.join(',') : ''), bad === 0);
})();

/* ---------- G10 링크 ---------- */
(() => {
  let broken = 0, external = 0; const detail = [];
  const exists = (href) => {
    if (href === '/') return fs.existsSync(path.join(ROOT, 'index.html'));
    const p = href.replace(/^\//, '').replace(/\/$/, '');
    return fs.existsSync(path.join(ROOT, p, 'index.html')) || fs.existsSync(path.join(ROOT, p + '.html')) || fs.existsSync(path.join(ROOT, p));
  };
  const files = venues.map((v) => ['night/' + v.slug, html[v.slug]]);
  files.push(['night', fs.readFileSync(path.join(ROOT, 'night', 'index.html'), 'utf8')]);
  files.forEach(([name, src]) => {
    const hrefs = [...src.matchAll(/<a\b[^>]*\shref="([^"]+)"/g)].map((m) => m[1]);
    hrefs.forEach((h) => {
      if (h.startsWith('#') || h.startsWith('tel:')) return;
      if (/^https?:\/\//.test(h)) { external++; detail.push(name + ' → ' + h); return; }
      if (!exists(h)) { broken++; detail.push(name + ' 깨짐 ' + h); }
    });
  });
  add('G10', '깨진 링크 ' + broken + '건 / 외부 아웃바운드 ' + external + '건' + (detail.length ? ' — ' + detail.join(' , ') : ''), broken === 0 && external === 0);
})();

/* ---------- G13 기존 파일 diff ---------- */
(() => {
  const out = execSync('git -C ' + ROOT + ' diff --name-only', { encoding: 'utf8' }).trim();
  const changed = out ? out.split('\n') : [];
  const allow = new Set(['sitemap.xml', 'robots.txt', 'llms.txt', 'index.html']);
  const bad = changed.filter((f) => !allow.has(f));
  const del = execSync('git -C ' + ROOT + ' diff -U0 | grep -c "^-[^-]" || true', { encoding: 'utf8', shell: '/bin/bash' }).trim();
  add('G13', '수정된 기존 파일 ' + changed.length + '개 (' + changed.join(', ') + '), 허용 외 ' + bad.length + '개, 삭제된 줄 ' + del, bad.length === 0 && del === '0');
})();

/* ---------- G14 OG 이미지 ---------- */
(() => {
  const bgs = new Set(); let bad = 0;
  const sizes = [];
  venues.forEach((v) => {
    const f = path.join(ROOT, 'og', v.slug + '-og.png');
    if (!fs.existsSync(f)) { bad++; return; }
    const buf = fs.readFileSync(f);
    const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
    if (w !== 1200 || h !== 1200) bad++;
    sizes.push(Math.round(buf.length / 1024));
    bgs.add(v.hue);
  });
  add('G14', '13장 존재/1200x1200 오류 ' + bad + '건, 배경 hue 고유값 ' + bgs.size + '개, 최대 ' + Math.max(...sizes) + 'KB', bad === 0 && bgs.size === 13);
})();

/* ---------- G15 본문 업소명 등장 ---------- */
const nameCounts = {};
(() => {
  const rows = venues.map((v) => {
    const t = mainText(html[v.slug]);
    const n = t.split(v.name).length - 1;
    nameCounts[v.slug] = n;
    return n;
  });
  add('G15', '업소명 등장 최소 ' + Math.min(...rows) + '회 / 최대 ' + Math.max(...rows) + '회 (기준 10회)', rows.every((n) => n >= 10));
})();

/* ---------- G16 첫 100자 내 업소명 ---------- */
(() => {
  const ok = venues.filter((v) => mainText(html[v.slug]).slice(0, 100).includes(v.name)).length;
  add('G16', '첫 100자 내 업소명 포함 ' + ok + '/13', ok === 13);
})();

/* ---------- G17 업소 문단 비중 ---------- */
const ratios = {};
(() => {
  const GEO = /(역|노선|지하철|전철|버스|택시|도로|상권|도시|블록|막차|배차|귀가|신도시|터미널|국토)/;
  const rows = venues.map((v) => {
    const ps = [...html[v.slug].matchAll(/<p class="nt-p">([\s\S]*?)<\/p>/g)].map((m) => m[1].replace(/<[^>]+>/g, ''));
    const venue = ps.filter((p) => p.includes(v.name) || !GEO.test(p)).length;
    const r = venue / ps.length;
    ratios[v.slug] = { venue, total: ps.length, r };
    return r;
  });
  add('G17', '업소 문단 비중 최소 ' + (Math.min(...rows) * 100).toFixed(0) + '% / 평균 ' + (rows.reduce((a, b) => a + b) / 13 * 100).toFixed(0) + '% (기준 60%)', rows.every((r) => r >= 0.6));
})();

/* ---------- G18 H2 중 업소명 ---------- */
(() => {
  const rows = venues.map((v) => v.sections.filter((s) => s.h2.includes(v.name)).length);
  add('G18', 'H2 내 업소명 최소 ' + Math.min(...rows) + '개 / H2 총 ' + venues.map((v) => v.sections.length).join(',') + ' (기준 4개)', rows.every((n) => n >= 4));
})();

/* ---------- G19 웹 실사 증명 ---------- */
(() => {
  const low = research.venues.filter((v) => v.queries.length < 5);
  const adopted = research.venues.flatMap((v) => v.fields.filter((f) => f.adopted));
  const weak = adopted.filter((f) => (f.sources || 0) < 2 && !f.note);
  add('G19', '업소당 검색 최소 ' + Math.min(...research.venues.map((v) => v.queries.length)) + '회, 채택 필드 ' + adopted.length + '개 중 출처 2곳 미만 ' + weak.length + '개', low.length === 0 && weak.length === 0);
})();

/* ---------- G20 SITE_INDEX 1 각도 ---------- */
(() => {
  const bad = [];
  venues.forEach((v) => {
    const t = title(html[v.slug]);
    if (!t.startsWith(v.name)) bad.push(v.slug + ' title 시작');
    if (t.length > 30) bad.push(v.slug + ' title ' + t.length + '자');
    if (!/(위치|가는|찾아|어디)/.test(t)) bad.push(v.slug + ' 각도어 없음');
    const h1 = v.sections[0].h2;
    if (!/(위치|어디|가는|찾)/.test(h1)) bad.push(v.slug + ' 첫 H2 위치 아님');
    const d = meta(html[v.slug], 'description');
    if (d.length < 80 || d.length > 130) bad.push(v.slug + ' desc ' + d.length + '자');
    if (!d.slice(0, 15).includes(v.name.slice(0, 4))) bad.push(v.slug + ' desc 앞 15자 업소명');
  });
  add('G20', 'INDEX 1 각도(title 공식·첫 H2 위치·desc 규칙) 위반 ' + bad.length + '건' + (bad.length ? ' — ' + bad.join(', ') : ''), bad.length === 0);
})();

/* ---------- 부가 지표 ---------- */
const lengths = venues.map((v) => ({ slug: v.slug, ko: korean(mainText(html[v.slug])) }));

console.log('\n=== 게이트 (정적) ===');
results.forEach((r) => console.log((r.pass ? 'PASS' : 'FAIL') + '  ' + r.id + '  ' + r.metric));
console.log('\n=== 본문 한글 분량 (기준 1000~1600자) ===');
lengths.forEach((l) => console.log('  ' + l.slug + '  ' + l.ko + '자  업소명 ' + nameCounts[l.slug] + '회  업소문단 ' + ratios[l.slug].venue + '/' + ratios[l.slug].total));
console.log('\n=== 유사도 상위 3쌍 ===');
sim.pairs.slice(0, 3).forEach((p) => console.log('  ' + (p.jac * 100).toFixed(2) + '%  ' + p.pair));

fs.writeFileSync(path.join(__dirname, 'night-gate-report.json'), JSON.stringify({ results, lengths, nameCounts, ratios, sim: { max: sim.max, avg: sim.avg, top3: sim.pairs.slice(0, 3) } }, null, 2));
const failed = results.filter((r) => !r.pass);
console.log('\n' + (failed.length ? 'FAIL ' + failed.map((f) => f.id).join(',') : '정적 게이트 전부 PASS'));
process.exit(failed.length ? 1 : 0);
