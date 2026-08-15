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
  add('G02', '완전중복 title ' + dupT + '/desc ' + dupD + ', 근사 최대 ' + (mx * 100).toFixed(1) + '% (' + pr + ', 기준 20%)', dupT === 0 && dupD === 0 && mx < 0.20);
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
  // 삭제 판정: BASE 시점에 존재하던 줄이 현재 파일에도 그대로 남아 있는지 (append 이후 내 블록 수정은 삭제로 세지 않는다)
  let lost = 0; const lostDetail = [];
  ['sitemap.xml', 'robots.txt', 'llms.txt', 'index.html'].forEach((f) => {
    const before = execSync('git -C ' + ROOT + ' show ' + BASE + ':' + f, { encoding: 'utf8' }).split('\n');
    const now = fs.readFileSync(path.join(ROOT, f), 'utf8').split('\n');
    const pool = new Map();
    now.forEach((l) => pool.set(l, (pool.get(l) || 0) + 1));
    before.forEach((l) => {
      const c = pool.get(l) || 0;
      if (c <= 0) { lost++; if (lostDetail.length < 5) lostDetail.push(f + ': ' + l.slice(0, 40)); }
      else pool.set(l, c - 1);
    });
  });
  add('G13', 'BASE ' + BASE + ' 대비 기존 파일 수정 ' + modified.length + '개(' + modified.join(', ') + '), 허용 4종 외 ' + bad.length + '개, BASE 시점 줄 소실 ' + lost + '건' + (lostDetail.length ? ' — ' + lostDetail.join(' / ') : '') + ', 신규 추가 ' + rows.filter((r) => r[0] === 'A').length + '개', bad.length === 0 && lost === 0);
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

/* G16 title 0번째 + 25~30자 */
(() => {
  let bad = 0; const d = [];
  venues.forEach((v) => {
    const t = titleOf(html[v.slug]);
    if (t.indexOf(v.name) !== 0) { bad++; d.push(v.slug + ' 시작 아님'); }
    if (t.length < 25 || t.length > 30) { bad++; d.push(v.slug + ' ' + t.length + '자'); }
  });
  const lens = venues.map((v) => titleOf(html[v.slug]).length);
  add('G16', 'title 업소명 0번째 시작 13/13, 길이 ' + Math.min(...lens) + '~' + Math.max(...lens) + '자 (기준 25~30) 위반 ' + bad + '건' + (d.length ? ' — ' + d.join(',') : ''), bad === 0);
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

/* ── 각도 정의 (지시서 [3]) : 접미어 풀 13×13 ── */
const ANGLE = [
  null,
  { name: '정면 소개형', pool: ['소문의 진짜 정체', '여기가 왜 버티나', '이름값 하는 이유', '홀 하나로 남은 곳', '규모가 말해주는 것', '간판보다 안이 다르다', '오래 남은 데는 이유가', '첫인상이 갈리는 곳', '겉만 보면 모른다', '들어가 봐야 아는 곳', '자리가 말해주는 것', '홀부터 다른 이유', '실체는 이렇다'] },
  { name: '질문 던지기형', pool: ['왜 사람이 몰릴까', '뭐가 다르길래', '가볼 만한가', '실제로 어떨까', '분위기 어떨까', '자리 잡기 쉬울까', '몇 시가 좋을까', '첫 방문 괜찮을까', '어떤 사람들이 올까', '주말엔 붐빌까', '예약이 필요할까', '혼자 가도 될까', '다시 갈 만할까'] },
  { name: '장면 묘사형', pool: ['밤 열두 시의 풍경', '문 열리는 그 시각', '홀이 차오르는 순간', '무대 앞 공기', '조명이 바뀌는 밤', '사람이 두꺼워지는 시간', '새벽으로 넘어갈 때', '첫 곡이 깔리는 순간', '테이블이 다 차는 밤', '가장 뜨거운 한 시간', '소리가 커지는 지점', '자정 무렵 홀 안', '문 닫기 직전 풍경'] },
  { name: '처음 가는 사람 시점', pool: ['처음이면 이것부터', '초보가 모르는 것', '첫날 뭘 해야 하나', '처음 가는 사람 안내', '문 앞에서 막힌다면', '첫날 이렇게 하면 된다', '처음이 어렵다면', '입문자 체크', '첫 방문 전 확인', '초보가 놓치는 것', '처음 가면 이렇다', '첫 경험 정리', '처음 가는 순서'] },
  { name: '이유 나열형', pool: ['가는 이유 셋', '찾는 이유 넷', '계속 오는 이유', '다시 찾는 까닭', '사람이 오는 이유', '선택받는 이유', '오래 버틴 이유', '자주 가는 이유', '추천받는 이유', '남는 이유', '붐비는 까닭', '소문난 이유', '몰리는 이유'] },
  { name: '오해 깨기형', pool: ['이런 줄 알았다면', '오해부터 풀자', '생각과 다른 점', '선입견이 깨진다', '잘못 알려진 것', '실제는 다르다', '착각하기 쉬운 것', '알고 보면 다르다', '겉과 속이 다르다', '흔한 오해 정리', '막상 가보면', '예상과 다른 점', '소문과 실제'] },
  { name: '문답형', pool: ['궁금한 것 몰아보기', '자주 오는 질문', '질문 열다섯', '물어본 것들', '가장 많이 묻는 것', '질문과 답', '궁금증 해결', '문의 정리', '자주 나온 질문', '물음 정리', '답변 모음', '질문 모아보기', '문답 정리'] },
  { name: '시간 흐름형', pool: ['입장부터 끝까지', '하루 밤 흐름', '도착부터 귀가까지', '시간대별 정리', '밤이 흐르는 순서', '저녁부터 새벽까지', '흐름 따라가기', '한 밤의 순서', '시간 순 안내', '처음부터 끝까지', '밤의 단계', '단계별 안내', '시간표 정리'] },
  { name: '비교 설명형', pool: ['뭐가 다를까', '차이점 정리', '다른 점 셋', '특징 정리', '구별되는 점', '남다른 이유', '차별점 안내', '어떻게 다른가', '다른 곳과 비교', '이 점이 다르다', '특색 정리', '개성 있는 점', '구분되는 지점'] },
  { name: '짧은 요약형', pool: ['핵심만 정리', '한눈에 보기', '요점 정리', '빠른 안내', '간단 정리', '핵심 셋', '요약 안내', '짧게 정리', '필수 정보', '한 장 요약', '간추린 안내', '핵심 체크', '요점만'] },
  { name: '인원별 공략형', pool: ['몇 명이 좋을까', '둘이서 가도 될까', '넷이 딱 좋은 이유', '단체 방문 안내', '인원별 정리', '일행 수 정하기', '몇 명이 적당할까', '인원 구성 안내', '팀 단위 안내', '소수 방문 안내', '다인원 안내', '인원별 자리 차이', '함께 갈 사람 수'] },
  { name: '실수 방지형', pool: ['이것만은 피하자', '흔한 실수 정리', '놓치기 쉬운 것', '실수 줄이는 법', '후회하는 지점', '조심할 것', '미리 알아둘 것', '헛걸음 하는 이유', '헛걸음 막는 법', '아쉬운 순간들', '준비 부족 신호', '피해야 할 것', '실수 목록'] },
  { name: '단골 관점형', pool: ['자주 가는 사람 이야기', '단골이 아는 것', '여러 번 가보면', '익숙해지면 보이는 것', '두 번째 방문부터', '반복 방문 정리', '오래 다닌 시선', '익숙한 사람의 순서', '재방문 요령', '손에 익으면', '경험자 관점', '반복해서 알게 된 것', '다녀본 사람 기준'] }
];
const angleOf = (venueNo) => ((SITE_INDEX - 1) + (venueNo - 1)) % 13 + 1;

/* G23 각도 계산 검증 — 공식대로인지 + 13개 전부 다른지 */
const angleRows = [];
(() => {
  const bad = []; const seen = new Set();
  venues.forEach((v, i) => {
    const no = i + 1;
    const expected = angleOf(no);
    const expSuffix = ANGLE[expected].pool[no - 1];
    angleRows.push({ venueNo: no, slug: v.slug, name: v.name, angleNo: v.angleNo, angleName: v.angleName, suffix: v.suffix, title: v.title });
    if (v.angleNo !== expected) bad.push(v.slug + ' 각도 ' + v.angleNo + '≠' + expected);
    if (v.angleName !== ANGLE[expected].name) bad.push(v.slug + ' 각도명 불일치');
    if (v.suffix !== expSuffix) bad.push(v.slug + ' 접미어 "' + v.suffix + '"≠"' + expSuffix + '"');
    const t = titleOf(html[v.slug]);
    if (t.indexOf(v.name + ' ' + expSuffix) !== 0) bad.push(v.slug + ' title 접미어 위치');
    if (/(최고|1위|완벽|대박)/.test(t)) bad.push(v.slug + ' 과장어');
    const d = metaOf(html[v.slug], 'description');
    if (d.length < 80 || d.length > 120) bad.push(v.slug + ' desc ' + d.length + '자');
    if (!d.slice(0, 15).includes(v.name)) bad.push(v.slug + ' desc 앞15자');
    seen.add(v.angleNo);
  });
  if (seen.size !== 13) bad.push('각도 고유 ' + seen.size + '/13');
  add('G23', 'SITE_INDEX ' + SITE_INDEX + ' 각도 공식 검증 — 고유 각도 ' + seen.size + '/13, 접미어·title 위치·desc 80~120자 위반 ' + bad.length + '건' + (bad.length ? ' — ' + bad.join(', ') : ''), bad.length === 0);
})();

/* G27 title 접미어 13개 전부 상이 */
(() => {
  const sfx = venues.map((v) => v.suffix);
  const dup = sfx.length - new Set(sfx).size;
  add('G27', 'title 접미어 고유 ' + new Set(sfx).size + '/13, 중복 ' + dup + '건', dup === 0);
})();

/* G28 첫 문장 구조 13개 전부 상이 (업소명 토큰화 후 전문·머리·꼬리 모두 비교) */
const firstSentences = [];
(() => {
  const norm = [], head = [], tail = [];
  venues.forEach((v) => {
    const m = v.lead.match(/^[\s\S]*?[.?!]/);
    const first = (m ? m[0] : v.lead).trim();
    firstSentences.push(first);
    const n = first.split(v.name).join('○○');
    norm.push(n); head.push(n.slice(0, 6)); tail.push(n.slice(-10));
  });
  const dN = norm.length - new Set(norm).size;
  const dH = head.length - new Set(head).size;
  const dT = tail.length - new Set(tail).size;
  add('G28', '첫 문장 문형 — 전문 중복 ' + dN + ' / 머리 6자 중복 ' + dH + ' / 꼬리 10자 중복 ' + dT, dN === 0 && dH === 0 && dT === 0);
})();

/* G29 H2 첫 항목 13개 전부 상이 */
(() => {
  const h2s = venues.map((v) => v.sections[0].h2.split(v.name).join('○○'));
  const dup = h2s.length - new Set(h2s).size;
  add('G29', 'H2 첫 항목 고유 ' + new Set(h2s).size + '/13, 중복 ' + dup + '건', dup === 0);
})();

/* G30 AI 인용 블록 두 번째 문장 13개 전부 상이 */
const answer2 = [];
(() => {
  venues.forEach((v) => {
    const plain = v.answer.replace(/<[^>]+>/g, '');
    const parts = plain.split(/(?<=\.)\s+/);
    answer2.push((parts[1] || '').trim());
  });
  const empty = answer2.filter((s) => !s).length;
  const dup = answer2.length - new Set(answer2).size;
  add('G30', 'answer-box 두 번째 문장 고유 ' + new Set(answer2).size + '/13, 중복 ' + dup + '건, 누락 ' + empty + '건', dup === 0 && empty === 0);
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

/* G31 A그룹 OG — 닉네임·전화번호 실측 */
const ogReport = JSON.parse(fs.readFileSync(path.join(__dirname, 'night-og-report.json'), 'utf8'));
const ogBySlug = Object.fromEntries(ogReport.reports.map((r) => [r.slug, r]));
(() => {
  const bad = []; const rows = [];
  venues.filter((v) => v.group === 'A').forEach((v) => {
    const r = ogBySlug[v.slug];
    if (!r) { bad.push(v.slug + ' OG 리포트 없음'); return; }
    if (r.nickname !== v.contact.person) bad.push(v.slug + ' 닉네임 불일치');
    if (r.tel !== v.contact.tel) bad.push(v.slug + ' 번호 불일치');
    if (r.telInkHeight < 100) bad.push(v.slug + ' 번호 글자 높이 ' + r.telInkHeight + 'px');
    if (r.telClipped) bad.push(v.slug + ' 번호 잘림');
    if (r.bandContrast < 15) bad.push(v.slug + ' 띠 대비 ' + r.bandContrast);
    rows.push(v.slug + ' ' + r.tel + ' 높이' + r.telInkHeight + 'px 폭' + r.telInkWidth + 'px 대비' + r.bandContrast + ':1');
  });
  add('G31', 'A그룹 4장 — ' + rows.join(' / '), bad.length === 0);
})();

/* G32 B그룹 OG — 전화번호·besta12 문자열 0건 */
(() => {
  const bad = [];
  venues.filter((v) => v.group === 'B').forEach((v) => {
    const r = ogBySlug[v.slug];
    const joined = (r.texts || []).join(' ');
    if (/besta12/i.test(joined)) bad.push(v.slug + ' besta12');
    if (/\d{2,4}-\d{3,4}-\d{4}/.test(joined)) bad.push(v.slug + ' 전화번호');
    if (r.tel || r.nickname) bad.push(v.slug + ' 띠 요소 존재');
  });
  add('G32', 'B그룹 9장 OG 내 전화번호·besta12 ' + bad.length + '건' + (bad.length ? ' — ' + bad.join(',') : ''), bad.length === 0);
})();

/* G33 연령 표기 — 완전문만 허용 */
(() => {
  const bad = [];
  const BAD_PAT = /27\+|38\+|만27세|27세이상|38세이상|27이상|38이상|27세~|38세~|27\/38/;
  const scan = (label, text) => {
    if (BAD_PAT.test(text)) bad.push(label + ' 축약형');
    [27, 38].forEach((n) => {
      const all = count(text, n + '세');
      const full = count(text, '만 ' + n + '세 이상');
      if (all !== full) bad.push(label + ' "' + n + '세" 단독 ' + (all - full) + '건');
    });
  };
  venues.forEach((v) => {
    scan(v.slug + ' HTML', html[v.slug]);
    scan(v.slug + ' OG텍스트', (ogBySlug[v.slug].texts || []).join(' '));
  });
  scan('허브', hubHtml);
  add('G33', '연령 완전문 위반 ' + bad.length + '건' + (bad.length ? ' — ' + bad.join(', ') : ' (본문·제목·description·표·JSON-LD·og:image:alt·이미지 텍스트 전수)'), bad.length === 0);
})();

/* G34 창원·대전원 — 첫 문단에 연령 완전문 */
(() => {
  const bad = [];
  venues.filter((v) => v.age).forEach((v) => {
    if (!v.lead.includes(v.age)) bad.push(v.slug + ' lead 누락');
    if (!v.answer.includes(v.age)) bad.push(v.slug + ' answer-box 누락');
  });
  const targets = venues.filter((v) => v.age).map((v) => v.slug + '(' + v.age + ')');
  add('G34', '첫 문단 연령 완전문 — ' + targets.join(', ') + ' 위반 ' + bad.length + '건', bad.length === 0);
})();

const lengths = venues.map((v) => ({ slug: v.slug, ko: korean(mainText(html[v.slug])) }));

console.log('\n=== 게이트 (정적) ===');
results.forEach((r) => console.log((r.pass ? 'PASS' : 'FAIL') + '  ' + r.id + '  ' + r.metric));
console.log('\n=== 분량 / 형태소 (A붙임 B띄움 C지역+업종) ===');
lengths.forEach((l) => console.log('  ' + l.slug.padEnd(26) + l.ko + '자  A' + morph[l.slug].a + ' B' + morph[l.slug].b + ' C' + morph[l.slug].c + '  업소문단 ' + ratios[l.slug].ven + '/' + ratios[l.slug].total + '  교통어 ' + ratios[l.slug].ban));
console.log('\n=== 유사도 상위 3쌍 ===');
sim.pairs.slice(0, 3).forEach((p) => console.log('  ' + (p.jac * 100).toFixed(2) + '%  ' + p.pair));

console.log('\n=== 각도 배정 ===');
angleRows.forEach((r) => console.log('  ' + String(r.venueNo).padStart(2) + '  ' + r.name.padEnd(11) + ' 각도' + String(r.angleNo).padStart(2) + ' ' + r.angleName.padEnd(12) + ' 접미어: ' + r.suffix));

fs.writeFileSync(path.join(__dirname, 'night-gate-report.json'), JSON.stringify({ results, angleRows, firstSentences, answer2, lengths, morph, ratios, faq: { min: Math.min(...faqLens), max: Math.max(...faqLens) }, sim: { max: sim.max, avg: sim.avg, top3: sim.pairs.slice(0, 3) } }, null, 2));
const failed = results.filter((r) => !r.pass);
console.log('\n' + (failed.length ? 'FAIL ' + failed.map((f) => f.id).join(',') : '정적 게이트 전부 PASS'));
process.exit(failed.length ? 1 : 0);
