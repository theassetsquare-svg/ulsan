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

  // FAQ accordion
  document.querySelectorAll('.faq-q').forEach(function(q) {
    q.addEventListener('click', function() {
      var faq = q.parentElement;
      faq.classList.toggle('open');
      q.querySelector('span').textContent = faq.classList.contains('open') ? '−' : '+';
    });
  });
});
