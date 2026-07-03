const CACHE_NAME = 'auxiliar-impressao-bouquet-flores-v49';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './assets/icon.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-maskable-512.png',
  './assets/pedido_template_0000.png',
  './assets/cartao_dizeres_template.png',
  './assets/cartao_sem_dizeres_template.png'
];

function requestSemCache(request) {
  try {
    return new Request(request, { cache: 'no-store' });
  } catch (_) {
    return request;
  }
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS.map(asset => new Request(asset, { cache: 'no-store' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window', includeUncontrolled: true }))
      .then(clients => Promise.all(clients.map(client => {
        try {
          client.postMessage({ type: 'APP_UPDATED', cacheName: CACHE_NAME });
          if ('navigate' in client && client.url) return client.navigate(client.url).catch(() => {});
        } catch (_) {}
        return Promise.resolve();
      })))
  );
});

self.addEventListener('message', event => {
  if (event?.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.hostname.endsWith('.supabase.co')) {
    event.respondWith(fetch(requestSemCache(event.request)));
    return;
  }

  const destino = event.request.destination;
  const deveSempreBuscarNaRede = event.request.mode === 'navigate'
    || destino === 'document'
    || destino === 'script'
    || destino === 'style'
    || destino === 'manifest';

  event.respondWith(
    fetch(deveSempreBuscarNaRede ? requestSemCache(event.request) : event.request)
      .then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)).catch(() => {});
        }
        return response;
      })
      .catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html')))
  );
});
