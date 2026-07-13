/* ═══════════════════════════════════════════════════════════
   davidjivan.net — shared component JS
   reader controls + scroll reveal
   ═══════════════════════════════════════════════════════════ */

(function () {

  /* ─── SCROLL REVEAL ───────────────────────────────────── */
  var els = document.querySelectorAll('.reveal');
  if (els.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });

    els.forEach(function (el) { io.observe(el); });

    window.addEventListener('load', function () {
      els.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          el.classList.add('in');
          io.unobserve(el);
        }
      });
    });
  }

  /* ─── READING PROGRESS BAR ────────────────────────────── */
  var progress = document.createElement('div');
  progress.id = 'reading-progress';
  document.body.prepend(progress);

  function updateProgress() {
    var scrollTop = window.scrollY;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var pct = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
    progress.style.width = pct + '%';
  }
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  /* ─── FONT SIZE CONTROLS ──────────────────────────────── */
  var controls = document.createElement('div');
  controls.id = 'reader-controls';
  controls.innerHTML =
    '<button id="ctrl-smaller" title="Smaller text" aria-label="Decrease font size">A&#x2212;</button>' +
    '<span class="ctrl-label" id="ctrl-label">18px</span>' +
    '<button id="ctrl-bigger" title="Larger text" aria-label="Increase font size">A+</button>' +
    '<span class="ctrl-divider"></span>' +
    '<button id="ctrl-reset" title="Reset" aria-label="Reset font size" style="font-size:13px;width:auto;padding:0 12px;">Reset</button>';
  document.body.appendChild(controls);

  var minSize = 14, maxSize = 28, defaultSize = 18;
  var size = defaultSize;

  function setSize(s) {
    size = Math.max(minSize, Math.min(maxSize, s));
    document.documentElement.style.fontSize = size + 'px';
    document.getElementById('ctrl-label').textContent = size + 'px';
    try { localStorage.setItem('dj-reader-font-size', size); } catch (e) {}
  }

  document.getElementById('ctrl-smaller').addEventListener('click', function () { setSize(size - 1); });
  document.getElementById('ctrl-bigger').addEventListener('click', function () { setSize(size + 1); });
  document.getElementById('ctrl-reset').addEventListener('click', function () { setSize(defaultSize); });

  // Restore saved size
  try {
    var saved = localStorage.getItem('dj-reader-font-size');
    if (saved) setSize(parseInt(saved));
    else setSize(defaultSize);
  } catch (e) { setSize(defaultSize); }

  // Keyboard shortcuts
  document.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === '+' || e.key === '=') { e.preventDefault(); setSize(size + 1); }
    if (e.key === '-') { e.preventDefault(); setSize(size - 1); }
    if (e.key === '0') { e.preventDefault(); setSize(defaultSize); }
  });

})();
