const STATIC_CACHE = 'thaiky-static-v3';
const RUNTIME_CACHE = 'thaiky-runtime-v3';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/logo.png',
  '/manifest.json',
  '/admin/splash.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[Service Worker] Đang nạp trước tài nguyên...');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== STATIC_CACHE && cache !== RUNTIME_CACHE) {
            console.log('[Service Worker] Đang dọn dẹp cache cũ:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Chỉ xử lý các yêu cầu GET và bỏ qua các API bên ngoài như Firebase, Firestore, Google APIs
  const requestUrl = new URL(event.request.url);
  if (
    event.request.method !== 'GET' ||
    requestUrl.origin !== self.location.origin ||
    requestUrl.pathname.includes('/_next/webpack-hmr') ||
    requestUrl.pathname.startsWith('/api/')
  ) {
    return;
  }

  // Phân tách chiến lược lưu trữ
  const isStaticAsset = (
    requestUrl.pathname.includes('/_next/static/') ||
    requestUrl.pathname.endsWith('.css') ||
    requestUrl.pathname.endsWith('.js') ||
    requestUrl.pathname.endsWith('.png') ||
    requestUrl.pathname.endsWith('.jpg') ||
    requestUrl.pathname.endsWith('.woff2') ||
    requestUrl.pathname.endsWith('.json')
  );

  if (isStaticAsset) {
    // Chiến lược: Stale-While-Revalidate cho tài nguyên tĩnh
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchedResponse = fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => null);

          return cachedResponse || fetchedResponse;
        });
      })
    );
  } else {
    // Chiến lược: Network-First falling back to Cache cho các trang HTML
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Nếu mất kết nối hoàn toàn và không có cache trang, trả về một trang fallback nếu cần
            return new Response(
              '<html><body><div style="font-family:system-ui,sans-serif;text-align:center;padding:40px;color:#334155;">' +
              '<h2 style="color:#ef4444">Kết nối ngoại tuyến</h2>' +
              '<p>Hiện tại bạn không có kết nối internet và trang này chưa được lưu trữ ngoại tuyến. Hãy thử lại khi có mạng nhé! 💕</p>' +
              '<a href="/admin" style="display:inline-block;margin-top:15px;padding:10px 20px;background:#0d9488;color:white;text-decoration:none;border-radius:12px;font-weight:700">Về trang chủ</a>' +
              '</div></body></html>',
              { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
            );
          });
        })
    );
  }
});
