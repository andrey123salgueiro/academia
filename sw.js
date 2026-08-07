const CACHE_NAME = 'fitpulse-app-v1';

// Lista de arquivos para salvar no celular
const ASSETS = [
  './',
  './index.html',
  './login.html',
  './painel.html',
  './perfil.html',
  './manifest.json'
];

// Instalação do Service Worker e Cache Inicial
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Salvando arquivos no cache...');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Limpeza de Caches antigos ao atualizar
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Intercepta as requisições para rodar offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});
