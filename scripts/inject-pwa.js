#!/usr/bin/env node
// 8 페이지에 manifest link + SW 등록 script 주입 (idempotent)
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const pages = ['index.html','story.html','atmosphere.html','first-visit.html','access.html','review.html','faq.html','contact.html'];

const MANIFEST_LINK = '<link rel="manifest" href="/site.webmanifest">';
const SW_SCRIPT = `<script>if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});});}</script>`;

let touched = 0;
for (const p of pages) {
  const fp = path.join(ROOT, p);
  let html = fs.readFileSync(fp, 'utf8');
  const before = html;

  if (!html.includes('rel="manifest"')) {
    // insert manifest after canonical link
    html = html.replace(/(<link rel="canonical"[^>]*>)/, `$1\n${MANIFEST_LINK}`);
  }
  if (!html.includes("navigator.serviceWorker.register('/sw.js')")) {
    // insert SW registration just before </body>
    html = html.replace(/<\/body>/, `${SW_SCRIPT}\n</body>`);
  }

  if (html !== before) {
    fs.writeFileSync(fp, html, 'utf8');
    touched++;
    console.log(`[OK] ${p}`);
  } else {
    console.log(`[SKIP] ${p}`);
  }
}
console.log(`Updated ${touched}/${pages.length}.`);
