(function () {
  if (location.hostname !== 'davidjivan.net') return;

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

  var body = JSON.stringify({
    sid: sid,
    self: isSelf,
    path: location.pathname,
    referrer: document.referrer || null,
    screen: screen.width + 'x' + screen.height,
    language: navigator.language
  });

  var url = 'https://api.davidjivan.net/api/track';
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: 'text/plain' }));
    } else {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: body,
        keepalive: true
      }).catch(function () {});
    }
  } catch (e) {}
})();
