/* ═══════════════════════════════════════════════════════════
   davidjivan.net — shared component JS
   ═══════════════════════════════════════════════════════════ */

/* ─── SCROLL REVEAL ─────────────────────────────────────── */
(function () {
  var els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });

  els.forEach(function (el) { io.observe(el); });

  // fire immediately for anything already in the viewport on load
  window.addEventListener('load', function () {
    els.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add('in');
        io.unobserve(el);
      }
    });
  });
})();


/* ─── TOGGLE / MODE SWITCH ──────────────────────────────── */
(function () {
  document.querySelectorAll('[data-toggle-group]').forEach(function (group) {
    var buttons = group.querySelectorAll('.toggle-btn');
    var targetId = group.dataset.toggleTarget;
    var target = targetId ? document.getElementById(targetId) : null;

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        // update button states
        buttons.forEach(function (b) { b.classList.remove('on'); });
        btn.classList.add('on');

        // set data-mode on target
        if (target && btn.dataset.mode) {
          target.dataset.mode = btn.dataset.mode;
        }

        // fire custom event for bespoke logic
        group.dispatchEvent(new CustomEvent('toggle', {
          detail: { mode: btn.dataset.mode, button: btn }
        }));
      });
    });
  });
})();
