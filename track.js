(function () {
  if (location.hostname !== 'davidjivan.net') return;

  var API = 'https://api.davidjivan.net/api/track';

  // -- cookies / session id -------------------------------------------------
  var cookies = {};
  document.cookie.split('; ').filter(Boolean).forEach(function (c) {
    var i = c.indexOf('=');
    cookies[c.slice(0, i)] = c.slice(i + 1);
  });
  var isSelf = cookies.dj_self === '1';

  var sid = cookies.dj_sid;
  if (!sid) {
    sid = (window.crypto && crypto.randomUUID && crypto.randomUUID()) ||
          (Math.random().toString(36).slice(2) + Date.now().toString(36));
    document.cookie = 'dj_sid=' + sid + '; path=/; max-age=31536000; SameSite=Lax';
  }

  // -- send helper ----------------------------------------------------------
  function send(event_type, meta) {
    var body = JSON.stringify({
      sid: sid,
      self: isSelf,
      path: location.pathname,
      referrer: document.referrer || null,
      screen: screen.width + 'x' + screen.height,
      language: navigator.language,
      event_type: event_type,
      event_meta: meta || null
    });
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(API, new Blob([body], { type: 'text/plain' }));
      } else {
        fetch(API, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: body,
          keepalive: true
        }).catch(function () {});
      }
    } catch (e) {}
  }

  // -- pageview -------------------------------------------------------------
  send('pageview');

  // -- scroll depth milestones ---------------------------------------------
  var scrolled = {};
  function maxScrollPct() {
    var h = Math.max(
      document.body.scrollHeight, document.documentElement.scrollHeight,
      document.body.offsetHeight, document.documentElement.offsetHeight
    );
    if (h <= window.innerHeight) return 100; // page fits in viewport — count as full
    return Math.min(100, Math.round((window.scrollY + window.innerHeight) / h * 100));
  }
  function checkScroll() {
    var pct = maxScrollPct();
    [25, 50, 75, 100].forEach(function (m) {
      if (pct >= m && !scrolled[m]) {
        scrolled[m] = true;
        send('scroll_' + m);
      }
    });
  }
  window.addEventListener('scroll', checkScroll, { passive: true });
  window.addEventListener('load', checkScroll);
  // also check after a short delay in case content loads in
  setTimeout(checkScroll, 800);

  // -- time on page (active seconds) ---------------------------------------
  var activeSeconds = 0;
  var lastTick = Date.now();
  var isVisible = !document.hidden;
  var sentDuration = false;
  var tickInterval = setInterval(function () {
    var now = Date.now();
    if (isVisible) activeSeconds += Math.round((now - lastTick) / 1000);
    lastTick = now;
  }, 5000);

  function flushDuration(reason) {
    if (sentDuration || activeSeconds < 1) return;
    sentDuration = true;
    clearInterval(tickInterval);
    send('duration', { seconds: activeSeconds, reason: reason || 'pagehide' });
  }

  document.addEventListener('visibilitychange', function () {
    var nowVisible = !document.hidden;
    if (isVisible && !nowVisible) {
      // tab going to background — count time and flush
      var now = Date.now();
      activeSeconds += Math.round((now - lastTick) / 1000);
      lastTick = now;
      flushDuration('hidden');
    } else if (!isVisible && nowVisible) {
      // returning to tab — reset clock, allow new duration event
      lastTick = Date.now();
      sentDuration = false;
    }
    isVisible = nowVisible;
  });

  window.addEventListener('pagehide', function () {
    if (isVisible) {
      var now = Date.now();
      activeSeconds += Math.round((now - lastTick) / 1000);
    }
    flushDuration('pagehide');
  });

  // -- link clicks ----------------------------------------------------------
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || href.startsWith('javascript:') || href.startsWith('#')) return;
    var url;
    try { url = new URL(href, location.href); } catch (err) { return; }
    if (url.hostname === location.hostname) {
      send('internal_click', { href: url.pathname + url.search });
    } else {
      send('outbound_click', { href: url.href, hostname: url.hostname });
    }
  }, true);
})();
// auto-deploy test 2026-06-04
// auto-deploy test 2026-06-04
