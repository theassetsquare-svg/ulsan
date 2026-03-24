const fs = require('fs');

// Load all page texts
const pages = ['index','story','atmosphere','first-visit','access','review','faq','contact'];
const texts = {};
pages.forEach(p => {
  texts[p] = fs.readFileSync(`/tmp/text_${p}.txt`, 'utf8').trim();
});

// === 1. KEYWORD STUFFING CHECK ===
console.log('='.repeat(60));
console.log('  키워드 스터핑 분석');
console.log('='.repeat(60));

const keyword = '울산챔피언나이트';
pages.forEach(p => {
  const text = texts[p];
  const totalChars = text.length;
  const matches = text.split(keyword).length - 1;
  const keywordChars = matches * keyword.length;
  const density = totalChars > 0 ? ((keywordChars / totalChars) * 100).toFixed(2) : 0;
  const status = matches <= 3 ? '✅' : '⚠️ 스터핑!';
  console.log(`[${p}] "${keyword}" ${matches}회 (밀도 ${density}%) ${status}`);
});

// Also check sub-keywords
console.log('\n--- 서브 키워드 ---');
const subKeywords = ['울산', '챔피언', '나이트', '춘자', '전화'];
pages.forEach(p => {
  const text = texts[p];
  const total = text.length;
  const counts = {};
  subKeywords.forEach(kw => {
    // Count keyword but exclude it when inside 울산챔피언나이트
    let cleaned = text.replace(/울산챔피언나이트/g, '___MAIN___');
    counts[kw] = (cleaned.split(kw).length - 1);
  });
  const parts = subKeywords.map(kw => `${kw}:${counts[kw]}`).join(' ');
  console.log(`[${p}] ${parts}`);
});

// === 2. SIMILARITY CHECK (Jaccard on 3-grams) ===
console.log('\n' + '='.repeat(60));
console.log('  페이지 간 유사도 분석 (3-gram Jaccard)');
console.log('='.repeat(60));

function getNgrams(text, n) {
  const set = new Set();
  const clean = text.replace(/\s+/g, ' ').trim();
  for (let i = 0; i <= clean.length - n; i++) {
    set.add(clean.substring(i, i + n));
  }
  return set;
}

function jaccard(setA, setB) {
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union > 0 ? (intersection / union) * 100 : 0;
}

const ngrams = {};
pages.forEach(p => { ngrams[p] = getNgrams(texts[p], 3); });

const results = [];
for (let i = 0; i < pages.length; i++) {
  for (let j = i + 1; j < pages.length; j++) {
    const sim = jaccard(ngrams[pages[i]], ngrams[pages[j]]);
    results.push({ a: pages[i], b: pages[j], sim: sim.toFixed(1) });
  }
}

results.sort((a, b) => b.sim - a.sim);
results.forEach(r => {
  const status = parseFloat(r.sim) <= 10 ? '✅' : '⚠️ 초과!';
  console.log(`${r.a} ↔ ${r.b}: ${r.sim}% ${status}`);
});

// Summary
const maxSim = Math.max(...results.map(r => parseFloat(r.sim)));
const overCount = results.filter(r => parseFloat(r.sim) > 10).length;
console.log(`\n최대 유사도: ${maxSim.toFixed(1)}%`);
console.log(`10% 초과 쌍: ${overCount}개`);
