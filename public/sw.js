const CACHE_NAME = 'thaiky-pwa-bypass-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Xóa sạch mọi cache cũ để web luôn tải bản mới nhất
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        console.log('[Service Worker] Đã dọn dẹp cache:', key);
        return caches.delete(key);
      }));
    })
  );
  return self.clients.claim();
});
