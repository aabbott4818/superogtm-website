/**
 * Supero GTM — GA4 enhanced analytics
 * Scroll depth milestones + outbound link tracking
 */
(function () {
  'use strict';

  if (typeof gtag === 'undefined') return;

  var page = window.location.pathname;

  /* ── Scroll depth ───────────────────────────────────────────────────────── */
  var milestones = [25, 50, 75, 90];
  var fired = {};

  window.addEventListener('scroll', function () {
    var scrollTop  = window.scrollY || document.documentElement.scrollTop;
    var docHeight  = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return;
    var pct = Math.round((scrollTop / docHeight) * 100);
    milestones.forEach(function (m) {
      if (!fired[m] && pct >= m) {
        fired[m] = true;
        gtag('event', 'scroll_depth', { depth: m, page: page });
      }
    });
  }, { passive: true });

  /* ── Outbound link tracking ─────────────────────────────────────────────── */
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href]');
    if (!link) return;
    var href = link.href || '';

    if (href.indexOf('calendly.com') !== -1) {
      gtag('event', 'calendly_click', { page: page });
    } else if (href.indexOf('linkedin.com') !== -1) {
      gtag('event', 'linkedin_click', { page: page, destination: href });
    } else if (href.indexOf('substack.com') !== -1) {
      gtag('event', 'substack_click', { page: page, destination: href });
    }
  });

})();
