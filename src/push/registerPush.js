// src/push/registerPush.ts (hoặc .js)
import http from '~/api/http';
import { BASE_URL } from '~/config';

export async function registerPush() {
  // 0) Kiểm tra hỗ trợ
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    throw new Error('Trình duyệt không hỗ trợ Web Push');
  }

  // 1) Đăng ký Service Worker
  const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

  // 2) Xin quyền
  const perm = await Notification.requestPermission(); // 'granted' | 'denied' | 'default'
  if (perm !== 'granted') throw new Error('Người dùng từ chối cấp quyền thông báo');

  // 3) Lấy VAPID public key (text/plain). Dùng http.get để auto kèm Authorization
  // Nếu http đã có baseURL = BASE_URL thì chỉ cần '/api/...'
  const pkRes = await http.get(`${BASE_URL}/api/push/lunch-order/publicKey`, {
    // đảm bảo trả về raw string (axios sẽ giữ nguyên vì content-type text/plain)
    responseType: 'text',
    transformResponse: [(d) => d], // tránh parse JSON
    headers: { Accept: 'text/plain' },
  });
  const publicKey = String(pkRes.data || '').trim();

  // 4) Subscribe
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: base64UrlToUint8Array(publicKey),
  });

  // 5) Gửi subscription lên BE để lưu DB
  // BE của bạn đọc userID từ token (req.user), nên chỉ cần gửi subscription.
  await http.post(`${BASE_URL}/api/push/lunch-order/subscribe`, sub);

  return true;
}

export async function unregisterPush() {
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (sub) {
    // gọi BE xoá endpoint khỏi DB (không bắt buộc, nhưng nên làm)
    try {
      await http.post(`${BASE_URL}/api/push/lunch-order/unsubscribe`, { endpoint: sub.endpoint });
    } catch (_) {}
    await sub.unsubscribe();
  }
  return true;
}

function base64UrlToUint8Array(base64url: string) {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  if (pad) base64 += '='.repeat(4 - pad);
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
