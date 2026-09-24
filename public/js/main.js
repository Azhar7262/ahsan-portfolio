// ============================================================
// main.js — nav toggle + client-side form validation + CV click tracking
// ============================================================
(function () {
  'use strict';

  // ---------- Mobile nav ----------
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // Close menu when a link is tapped
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ---------- Contact form validation ----------
  var form = document.querySelector('.contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      var name = form.querySelector('#name');
      var email = form.querySelector('#email');
      var message = form.querySelector('#message');

      var problems = [];
      form.querySelectorAll('[required]').forEach(function (f) {
        if (!f.value.trim()) problems.push(f);
      });
      if (name && name.value.trim().length < 2) problems.push(name);
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) problems.push(email);
      if (message && message.value.trim().length < 10) problems.push(message);

      problems.forEach(function (f) { f.setAttribute('aria-invalid', 'true'); });
      if (problems.length) {
        e.preventDefault();
        problems[0].focus();
      }
    });
  }

  // ---------- CV download tracking (analytics-ready hook) ----------
  document.querySelectorAll('[data-cv-track]').forEach(function (el) {
    el.addEventListener('click', function () {
      // Server counts the download; this hook is where you'd also
      // send an analytics event (e.g. Plausible/GA4) when connected.
      if (typeof window.plausible === 'function') {
        window.plausible('CV Download');
      }
    });
  });

  // ---------- Email obfuscation (assembled on click) ----------
  document.querySelectorAll('.email-obfuscated').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var addr = a.dataset.user + '@' + a.dataset.domain;
      window.location.href = 'mailto:' + addr;
      a.textContent = '✉ ' + addr;
    });
  });
})();
