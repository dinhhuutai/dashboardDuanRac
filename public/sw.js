self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

console.log('[SW] loaded v2');

self.addEventListener('push', (event) => {
  console.log('[SW] push event', event?.data ? 'has data' : 'no data');
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    console.warn('[SW] data.json() error', e);
    data = {};
  }

  // Chuẩn hóa url: nếu có, decode và đảm bảo bắt đầu bằng http/https
  let url = data.url || '/';
  try {
    // nếu url chứa encoded component (chúng ta encode 2 lần server-side), try decode once
    url = decodeURIComponent(url);
  } catch (e) {
    // ignore decode errors
  }
  // Nếu thiếu scheme, thêm origin (nếu bạn muốn mở nội bộ)
  if (!/^https?:\/\//i.test(url)) {
    // thay bằng domain của bạn nếu cần; mặc định mở relative -> sẽ dẫn tới origin hiện tại
    // ví dụ: url = 'https://noibo.thuanhunglongan.com' + url;
    // để an toàn, giữ nguyên relative path
  }

  const title = data.title || 'THLA';
  const options = {
    body: data.body || '',
    // bạn có thể bật icon/badge nếu đã chắc chắn đường dẫn tồn tại
    // icon: data.icon || '/icons/icon-192.png',
    // badge: data.badge || '/icons/badge-72.png',
    data: { url }, // quan trọng: lưu url vào notification.data
    requireInteraction: data.requireInteraction === true || data.requireInteraction === 'true',
    tag: data.tag
  };

  event.waitUntil((async () => {
    try {
      await self.registration.showNotification(title, options);
      console.log('[SW] showNotification OK', options);
    } catch (err) {
      console.error('[SW] showNotification error', err, 'permission=', Notification.permission);
    }
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification && event.notification.data && event.notification.data.url) || '/';
  console.log('[SW] notificationclick open url=', url);

  event.waitUntil((async () => {
    try {
      const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });

      // Prioritize focusing an existing tab that already has the target URL (same origin)
      for (const client of allClients) {
        try {
          // Some clients have .url property; compare pathname+search to detect same page
          if (client.url && (client.url === url || client.url.startsWith(url) || url.startsWith(client.url))) {
            client.focus();
            return;
          }
        } catch (e) { /* ignore cross-origin / read errors */ }
      }

      // If none found, open a new window/tab with absolute url
      // Ensure url is absolute; if it's relative, open relative to current origin
      let openUrl = url;
      if (!/^https?:\/\//i.test(openUrl)) {
        // use your app origin (change if your SW is served from different origin)
        const origin = self.location && self.location.origin ? self.location.origin : 'https://noibo.thuanhunglongan.com';
        if (openUrl.startsWith('/')) openUrl = origin + openUrl;
        else openUrl = origin + '/' + openUrl;
      }
      await clients.openWindow(openUrl);
    } catch (err) {
      console.error('[SW] notificationclick error', err);
    }
  })());
});
