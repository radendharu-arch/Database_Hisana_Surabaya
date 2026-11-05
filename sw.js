/* Service worker Database Gerai Hisana.
   Menyimpan kerangka aplikasi (HTML, logo, ikon, pustaka peta) supaya cepat dibuka dan tetap terbuka saat offline.
   Data gerai TIDAK pernah disimpan di sini: permintaan ke Apps Script selalu lewat jaringan. */
const V = 'gerai-v2';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'logo-hisana.png', 'banner-hisana.png', 'favicon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'];
const LIBS = /^(unpkg\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)$/;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                       // POST (data, PIN) tidak disentuh
  const u = new URL(req.url);
  if (u.origin === location.origin) {
    if (req.mode === 'navigate') {                        // halaman: jaringan dulu, cadangan dari cache
      e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(V).then(c => c.put('index.html', copy)); return r; })
        .catch(() => caches.match('index.html').then(r => r || caches.match('./'))));
      return;
    }
    e.respondWith(caches.match(req).then(hit => {         // aset sendiri: cache dulu, perbarui di belakang
      const net = fetch(req).then(r => { if (r.ok) { const copy = r.clone(); caches.open(V).then(c => c.put(req, copy)); } return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  if (LIBS.test(u.hostname)) {                            // pustaka peta dan font: cache dulu
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { const copy = r.clone(); caches.open(V).then(c => c.put(req, copy)); return r; })));
  }
  // lainnya (script.google.com, tile peta, Google Maps) langsung ke jaringan
});
