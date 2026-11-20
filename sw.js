// Service worker: guarda la app en el dispositivo para que funcione sin conexión.
// Sirve siempre la copia guardada y, si hay internet, la actualiza en segundo plano.
const CACHE = 'clave-de-fa-v4';
const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const key = req.mode === 'navigate' ? './index.html' : req;
      const cached = await cache.match(key, { ignoreSearch: true });
      const network = fetch(req)
        .then((res) => { if (res && res.ok) cache.put(key, res.clone()); return res; })
        .catch(() => null);
      if (cached) { event.waitUntil(network); return cached; }
      const res = await network;
      return res || new Response('Sin conexión', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    })
  );
});
