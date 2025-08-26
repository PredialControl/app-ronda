const CACHE_NAME = 'app-ronda-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Instalar service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('🔄 Cache aberto:', CACHE_NAME);
        // Usar add() em vez de addAll() para evitar falhas em lote
        return Promise.all(
          urlsToCache.map(url => 
            cache.add(url).catch(err => {
              console.warn('⚠️ Falha ao fazer cache de:', url, err);
              return null; // Continua mesmo se falhar
            })
          )
        );
      })
      .catch(error => {
        console.error('❌ Erro ao instalar Service Worker:', error);
      })
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  // Não interceptar requisições de dados (API, fotos, etc.)
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('supabase') ||
      event.request.url.includes('data:image') ||
      event.request.url.includes('blob:')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retorna do cache se disponível
        if (response) {
          return response;
        }
        // Senão, busca da rede
        return fetch(event.request).catch(error => {
          console.warn('⚠️ Falha na requisição:', event.request.url, error);
          // Retorna uma resposta padrão em caso de falha
          return new Response('Falha na requisição', { status: 500 });
        });
      })
      .catch(error => {
        console.error('❌ Erro no Service Worker:', error);
        // Em caso de erro, tenta buscar da rede
        return fetch(event.request).catch(() => {
          return new Response('Erro no Service Worker', { status: 500 });
        });
      })
  );
});

// Atualizar cache quando nova versão
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🧹 Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
