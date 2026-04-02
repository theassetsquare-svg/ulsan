// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
  var btn = document.querySelector('.menu-btn');
  var nav = document.querySelector('.nav');
  if (btn && nav) {
    btn.addEventListener('click', function() {
      nav.classList.toggle('open');
      btn.textContent = nav.classList.contains('open') ? '✕' : '☰';
    });
    nav.querySelectorAll('a').forEach(function(a) {
      a.addEventListener('click', function() {
        nav.classList.remove('open');
        btn.textContent = '☰';
      });
    });
  }

  // 80% scroll secret reveal
  var secrets = document.querySelectorAll('.scroll-secret');
  if (secrets.length) {
    var revealed = false;
    window.addEventListener('scroll', function() {
      if (revealed) return;
      var scrollPct = (window.scrollY + window.innerHeight) / document.body.scrollHeight;
      if (scrollPct >= 0.8) {
        revealed = true;
        secrets.forEach(function(el) {
          el.style.opacity = '1';
          el.style.maxHeight = '600px';
          el.style.marginTop = '24px';
        });
      }
    });
  }

  // FAQ accordion
  document.querySelectorAll('.faq-q').forEach(function(q) {
    q.addEventListener('click', function() {
      var faq = q.parentElement;
      faq.classList.toggle('open');
      q.querySelector('span').textContent = faq.classList.contains('open') ? '−' : '+';
    });
  });
});
