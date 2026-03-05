// 🔥 SWINDER VIP - AKILLI ÖNBELLEK MOTORU (V21) 🔥
const CACHE_NAME = 'swinder-vip-v31';

// Sadece en temel çerçeveyi hafızaya al (Hızlı açılış için)
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/profil.html',
  '/manifest.json'
  // Eğer logolarını eklediysen buraya '/icon-192x192.png', '/icon-512x512.png' de yazabilirsin.
];

// 1. KURULUM AŞAMASI (INSTALL)
self.addEventListener('install', (event) => {
  // Yeni bir güncelleme geldiğinde eskiyi beklemeden anında yükle
  self.skipWaiting(); 
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Temel dosyalar önbelleğe alınıyor...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).catch(err => console.log('[SW] Kurulum Hatası:', err))
  );
});

// 2. AKTİVASYON VE TEMİZLİK AŞAMASI (ACTIVATE)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          // İsim V21 değilse (yani eskiyse) acımadan sil
          if (cache !== CACHE_NAME) {
            console.log('[SW] Eski önbellek siliniyor:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim()) // Kontrolü anında ele al
  );
});

// 3. İNTERNET TRAFİĞİ YÖNETİMİ (FETCH)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 🛑 KURAL 1: FIREBASE VE CLOUDINARY'Yİ ASLA ÖNBELLEĞE ALMA (Daima Canlı Çek)
  if (url.origin.includes('firestore.googleapis.com') || 
      url.origin.includes('firebase') || 
      url.origin.includes('cloudinary.com') ||
      url.origin.includes('unsplash.com')) {
      return; // SW karışmaz, doğrudan internetten çeker. Mesajların ve videoların anında düşmesini sağlar.
  }

  // 🌍 KURAL 2: HTML DOSYALARI İÇİN "ÖNCE İNTERNET" (Network First)
  // Kullanıcı siteye girdiğinde önce sunucuya bakar yeni kod var mı diye. Yoksa hafızadakini açar.
  if (event.request.mode === 'navigate' || event.request.headers.get('accept').includes('text/html')) {
      event.respondWith(
          fetch(event.request).catch(() => caches.match(event.request))
      );
      return;
  }

  // ⚡ KURAL 3: DİĞER HER ŞEY İÇİN "ÖNCE ÖNBELLEK" (Cache First)
  // İkonlar, fontlar vb. anında hafızadan açılır, internet harcamaz.
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});