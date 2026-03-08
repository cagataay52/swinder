// 🔥 SWINDER VIP - AKILLI ÖNBELLEK MOTORU (V26 - GÜNCEL) 🔥
const CACHE_NAME = 'swinder-vip-v26'; // Versiyon artırıldı! Eski inatçı önbellek silinecek.

// Sadece en temel çerçeveyi hafızaya al (Hızlı açılış için)
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/profil.html',
  '/manifest.json'
];

// 1. KURULUM AŞAMASI (INSTALL)
self.addEventListener('install', (event) => {
  // Yeni bir güncelleme geldiğinde eskiyi beklemeden anında yükle
  self.skipWaiting(); 
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Temel dosyalar önbelleğe alınıyor... v26');
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
          // İsim V26 değilse (yani eskiyse) acımadan sil
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

  // 🛑 KURAL 1: FIREBASE VE HARİCİ APİ'LERİ ASLA ÖNBELLEĞE ALMA (Daima Canlı Çek)
  if (url.origin.includes('firestore.googleapis.com') || 
      url.origin.includes('firebase') || 
      url.origin.includes('cloudinary.com') ||
      url.origin.includes('unsplash.com') ||
      url.pathname.includes('.mp4')) { // Videoları da cache'leme, telefonu dondurur.
      return; 
  }

  // 🌍 KURAL 2: HTML DOSYALARI İÇİN KESİN CANLI VERİ (Network First + No-Cache)
  // Kullanıcı siteye girdiğinde eski hafızayı tamamen yok sayıp en güncel kodları çeker.
  if (event.request.mode === 'navigate' || event.request.headers.get('accept').includes('text/html')) {
      event.respondWith(
          // cache: 'no-cache' -> Safari'ye "Bana disktekini değil, kesinlikle sunucudakini ver" diyoruz!
          fetch(event.request.url, { cache: 'no-cache' }) 
          .then(response => {
              // İnternetten en güncel (yeni) kod başarıyla geldiyse, bunu hafızaya (SW) da kaydet
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
              return response;
          })
          .catch(() => {
              // İnternet tamamen kesikse mecbur hafızadakini (eskiyi) ver
              return caches.match(event.request);
          })
      );
      return;
  }

  // ⚡ KURAL 3: DİĞER HER ŞEY İÇİN "ÖNCE ÖNBELLEK" (Cache First)
  // CSS, JS (eğer harici varsa), İkonlar anında hafızadan açılır.
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Önbellekte varsa ver, yoksa internetten çekip önbelleğe ekle
      return response || fetch(event.request).then(fetchRes => {
          return caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, fetchRes.clone());
              return fetchRes;
          });
      });
    })
  );
});