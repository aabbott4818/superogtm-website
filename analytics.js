/**
 * Supero GTM — GA4 enhanced analytics
 *
 * CONVERSION EVENTS (mark both as conversions in GA4 Admin → Events):
 *   generate_lead    — fires on every Calendly click (GA4 recommended event)
 *   book_conversation — fires on every Calendly click (custom, for segmentation)
 *
 * ENGAGEMENT EVENTS:
 *   cta_click      — non-Calendly CTA button interactions {page, section, cta_text}
 *   scroll_depth   — scroll milestones 25/50/75/90 {depth, page}
 *   linkedin_click — outbound LinkedIn clicks {page, destination}
 *   substack_click — outbound Substack clicks {page, destination}
 */
(function () {
  'use strict';

  if (typeof gtag === 'undefined') return;

  var page = window.location.pathname;

  /* ── Scroll depth ─────────────────────────────────────────────────────────── */
  var milestones = [25, 50, 75, 90];
  var firedDepth = {};

  window.addEventListener('scroll', function () {
    var scrollTop = window.scrollY || document.documentElement.scrollTop;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return;
    var pct = Math.round((scrollTop / docHeight) * 100);
    milestones.forEach(function (m) {
      if (!firedDepth[m] && pct >= m) {
        firedDepth[m] = true;
        gtag('event', 'scroll_depth', { depth: m, page: page });
      }
    });
  }, { passive: true });

  /* ── Get nearest section label ───────────────────────────────────────────── */
  function getSection(el) {
    var node = el.parentElement;
    var depth = 0;
    while (node && depth < 12) {
      if (node.tagName === 'SECTION' && node.id)  return node.id;
      if (node.tagName === 'NAV')                  return 'nav';
      if (node.tagName === 'FOOTER')               return 'footer';
      node = node.parentElement;
      depth++;
    }
    return 'page';
  }

  /* ── Click handler ───────────────────────────────────────────────────────── */
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href]');
    if (!link) return;

    var href    = link.href    || '';
    var text    = (link.textContent || '').trim().replace(/\s+/g, ' ').substring(0, 60);
    var section = getSection(link);

    /* ── Calendly: primary conversion ───────────────────────────────────────── *
     * generate_lead is a GA4 recommended event — mark it as a conversion in
     * GA4 Admin → Events, then toggle "Mark as conversion".
     * book_conversation is a custom event — mark this as a conversion too.    */
    if (href.indexOf('calendly.com') !== -1) {
      gtag('event', 'generate_lead', {
        page:    page,
        section: section,
        method:  'calendly'
      });
      gtag('event', 'book_conversation', {
        page:    page,
        section: section
      });
      return;
    }

    /* ── LinkedIn ────────────────────────────────────────────────────────────── */
    if (href.indexOf('linkedin.com') !== -1) {
      gtag('event', 'linkedin_click', { page: page, destination: href });
      return;
    }

    /* ── Substack ────────────────────────────────────────────────────────────── */
    if (href.indexOf('substack.com') !== -1) {
      gtag('event', 'substack_click', { page: page, destination: href });
      return;
    }

    /* ── Other CTA buttons (ghost / secondary CTAs) ─────────────────────────── */
    if (
      link.classList.contains('btn-primary')  ||
      link.classList.contains('btn-ghost')    ||
      link.classList.contains('btn-secondary')||
      link.classList.contains('nav-cta')
    ) {
      gtag('event', 'cta_click', {
        page:     page,
        section:  section,
        cta_text: text
      });
    }
  });

})();
