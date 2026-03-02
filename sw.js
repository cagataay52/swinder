const CACHE_NAME = 'swinder-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/profil.html'
];

// Uygulama yüklendiğinde (Install)
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// İnternet kesilse bile uygulamanın açılmasını sağlar (Fetch)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Ön bellekte varsa onu ver
        }
        return fetch(event.request); // Yoksa internetten çek
      })
  );
});
