const CACHE_NAME = 'app-ronda-v6';
const STATIC_CACHE = 'app-ronda-static-v6';

const urlsToCache = [
  '/',
  '/manifest.json'
];

// Assets estáticos para cachear (extensões)
const STATIC_EXTENSIONS = ['.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.woff', '.woff2', '.ttf'];

// Instalar service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache aberto:', CACHE_NAME);
        return Promise.all(
          urlsToCache.map(url =>
            cache.add(url).catch(err => {
              console.warn('[SW] Falha ao cachear:', url, err);
              return null;
            })
          )
        );
      })
      .catch(error => {
        console.error('[SW] Erro ao instalar:', error);
      })
  );
  self.skipWaiting();
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Navegações: network-first (HTML)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cachear o HTML para uso offline
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match('/index.html').then(r => r || caches.match('/')))
    );
    return;
  }

  // Não interceptar APIs/dados dinâmicos
  if (event.request.url.includes('supabase') ||
      event.request.url.includes('/api/') ||
      event.request.url.includes('data:image') ||
      event.request.url.includes('blob:')) {
    return;
  }

  // Assets estáticos: cache-first com atualização em background
  const isStaticAsset = STATIC_EXTENSIONS.some(ext => url.pathname.endsWith(ext));
  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        // Buscar da rede em background para atualizar cache
        const networkFetch = fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then(cache => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => null);

        // Se tem cache, retornar imediatamente
        if (cached) return cached;
        // Se não tem cache, esperar rede
        return networkFetch.then(r => r || new Response('Recurso indisponível offline', { status: 503 }));
      })
    );
    return;
  }

  // Outras requisições: network-first com fallback para cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then(cached => {
          return cached || new Response('Recurso indisponível offline', { status: 503 });
        });
      })
  );
});

// Limpar caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
            console.log('[SW] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Listener para mensagens do app (forçar sync, etc.)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
