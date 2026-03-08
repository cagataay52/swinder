// 🔥 SWINDER VIP - AKILLI ÖNBELLEK MOTORU (V27 - ZORUNLU GÜNCELLEME) 🔥
const CACHE_NAME = 'swinder-vip-v27';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/profil.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).catch(err => console.log('[SW] Kurulum Hatası:', err))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.origin.includes('firestore.googleapis.com') || 
      url.origin.includes('firebase') || 
      url.origin.includes('cloudinary.com') ||
      url.origin.includes('unsplash.com') ||
      url.pathname.includes('.mp4')) { 
      return; 
  }

  if (event.request.mode === 'navigate' || event.request.headers.get('accept').includes('text/html')) {
      event.respondWith(
          fetch(event.request.url, { cache: 'no-store' }) // iOS SAFARİ'YE KESİN EMİR: HAFIZADAN OKUMA!
          .then(response => {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
              return response;
          })
          .catch(() => {
              return caches.match(event.request);
          })
      );
      return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then(fetchRes => {
          return caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, fetchRes.clone());
              return fetchRes;
          });
      });
    })
  );
});