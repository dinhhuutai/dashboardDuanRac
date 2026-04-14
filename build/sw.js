self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

console.log('[SW] loaded v3');

function normalizeToCurrentOrigin(rawUrl) {
  // Always open notification links on the same origin as current SW.
  // This avoids cross-origin opens that can look like "lost login" on some devices.
  const fallback = self.location.origin + '/';
  if (!rawUrl) return fallback;

  let decoded = rawUrl;
  try { decoded = decodeURIComponent(decoded); } catch {}
  try { decoded = decodeURIComponent(decoded); } catch {}

  try {
    const parsed = new URL(decoded, self.location.origin);
    const pathOnly = `${parsed.pathname || '/'}${parsed.search || ''}${parsed.hash || ''}`;
    return new URL(pathOnly, self.location.origin).href;
  } catch {
    return fallback;
  }
}

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    console.warn('[SW] data.json() error', e);
    data = {};
  }

  const absUrl = normalizeToCurrentOrigin(data.url || '/');

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
