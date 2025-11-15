self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

console.log('[SW] loaded v3');

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    console.warn('[SW] data.json() error', e);
    data = {};
  }

  // Chuẩn hoá URL an toàn
  let rawUrl = data.url || '/';
  try { rawUrl = decodeURIComponent(rawUrl); } catch {}
  try { rawUrl = decodeURIComponent(rawUrl); } catch {} // nếu server encode 2 lần

  // Tạo absolute URL từ origin của SW (nếu rawUrl là relative)
  let absUrl;
  try {
    absUrl = new URL(rawUrl, self.location.origin).href;
  } catch {
    absUrl = self.location.origin + '/'; // fallback
  }

  const title = data.title || 'THLA';
  const options = {
    body: data.body || '',
    // icon: data.icon || '/icons/icon-192.png',
    // badge: data.badge || '/icons/badge-72.png',
    tag: data.tag || 'lunch-weekly-menu',
    renotify: !!data.renotify,
    requireInteraction: data.requireInteraction === true || data.requireInteraction === 'true',
    timestamp: Date.now(),
    data: { url: absUrl },
    // actions: [{ action: 'open', title: 'Xem thực đơn' }], // tuỳ chọn
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification?.data?.url) || (self.location.origin + '/');

  event.waitUntil((async () => {
    try {
      const all = await clients.matchAll({ type: 'window', includeUncontrolled: true });

      const target = new URL(targetUrl);
      // 1) Ưu tiên tab cùng origin
      for (const c of all) {
        try {
          const cu = new URL(c.url);
          if (cu.origin === target.origin) {
            // Nếu khác path, thử điều hướng (Chrome/Edge hỗ trợ)
            if ('navigate' in c && (c.url !== targetUrl)) {
              await c.navigate(targetUrl);
            }
            await c.focus();
            return;
          }
        } catch {}
      }

      // 2) Không có tab phù hợp => mở tab mới
      await clients.openWindow(targetUrl);
    } catch (err) {
      console.error('[SW] notificationclick error', err);
      // Fallback cuối
      await clients.openWindow(targetUrl);
    }
  })());
});
