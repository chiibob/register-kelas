/* Class Register service worker: keeps the app usable without internet. */
var CACHE = 'class-register-v1';
var ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* Open instantly from the saved copy; refresh the copy in the background when online. */
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith((async function () {
    var cache = await caches.open(CACHE);
    var hit = await cache.match(e.request, { ignoreSearch: true });
    var net = fetch(e.request).then(function (res) {
      if (res && res.ok) cache.put(e.request, res.clone());
      return res;
    }).catch(function () { return null; });
    e.waitUntil(net);
    if (hit) return hit;
    return (await net) || (await cache.match('./index.html')) || Response.error();
  })());
});
