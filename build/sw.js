self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

console.log('[SW] loaded v2');

self.addEventListener('push', (event) => {
  console.log('[SW] push event', event?.data ? 'has data' : 'no data');
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { console.warn('[SW] data.json() error', e); }

  const title = data.title || 'THLA';
  const options = {
    body: data.body || '',
    // tạm thời comment icon/badge để loại trừ lỗi 404:
    // icon: data.icon || '/icons/icon-192.png',
    // badge: data.badge || '/icons/badge-72.png',
    data: { url: data.url || '/' },
    requireInteraction: true,
  };

  event.waitUntil((async () => {
    try {
      await self.registration.showNotification(title, options);
      console.log('[SW] showNotification OK');
    } catch (err) {
      console.error('[SW] showNotification error', err, 'permission=', Notification.permission);
    }
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const w = list.find(x => 'focus' in x);
      if (w) return w.focus();
      return clients.openWindow(url);
    })
  );
});

/* eslint-disable no-restricted-globals */

// cập nhật SW ngay
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// Cho /music/* đi thẳng network (đừng trả index.html)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // BỎ QUA audio: để browser fetch bình thường
  if (url.pathname.startsWith('/music/')) return;

  // ví dụ fallback SPA cho các điều hướng
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch('/index.html'));
  }
});

