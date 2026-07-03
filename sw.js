const CACHE = 'wc2026-v1';
const ASSETS = [
  '/FIFA-WORLD-CUP-2026/',
  '/FIFA-WORLD-CUP-2026/index.html',
  '/FIFA-WORLD-CUP-2026/style.css',
  '/FIFA-WORLD-CUP-2026/app.js',
  '/FIFA-WORLD-CUP-2026/data.js',
  '/FIFA-WORLD-CUP-2026/bracket.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
