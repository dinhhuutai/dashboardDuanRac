// src/push/registerPush.ts (hoặc .js)
import http from '~/api/http';
import { BASE_URL } from '~/config';

function isAndroidCocCoc() {
  const ua = String(navigator.userAgent || '').toLowerCase();
  return ua.includes('android') && (ua.includes('coc_coc_browser') || ua.includes('coccoc'));
}

function ensurePushSupport() {
  const hasNotification = typeof window !== 'undefined' && 'Notification' in window;
  const hasSW = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
  const hasPush = typeof window !== 'undefined' && 'PushManager' in window;
  const isSecure = typeof window !== 'undefined' && (window.isSecureContext || window.location.hostname === 'localhost');

  if (!isSecure) {
    throw new Error('Trang chưa chạy HTTPS nên không thể bật thông báo.');
  }
  if (!hasNotification || !hasSW || !hasPush) {
    if (isAndroidCocCoc()) {
      throw new Error('Thiết bị/trình duyệt Cốc Cốc Android chưa hỗ trợ đầy đủ. Vui lòng dùng Chrome Android.');
    }
    throw new Error('Trình duyệt hiện tại chưa hỗ trợ Web Push.');
  }
}

function mapPushError(error) {
  const status = error?.response?.status;
  const message = String(error?.message || '');

  if (status === 401 || status === 403) {
    return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại rồi bật thông báo.';
  }
  if (status === 400) {
    return error?.response?.data?.error || 'Dữ liệu đăng ký thông báo không hợp lệ.';
  }
  if (!error?.response && (message.includes('Network Error') || message.includes('Failed to fetch'))) {
    return 'Không kết nối được máy chủ. Kiểm tra mạng hoặc domain API.';
  }
  if (message.includes('permission') || message.includes('denied') || message.includes('NotAllowedError')) {
    return 'Bạn đang chặn thông báo. Hãy bật lại quyền thông báo trong trình duyệt.';
  }
  return error?.response?.data?.message || message || 'Không thể bật thông báo.';
}

export async function registerPush() {
  try {
    // 0) Kiểm tra hỗ trợ
    ensurePushSupport();

    // 1) Đăng ký Service Worker
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

    // 2) Xin quyền
    const perm = await Notification.requestPermission(); // 'granted' | 'denied' | 'default'
    if (perm !== 'granted') throw new Error('Người dùng từ chối cấp quyền thông báo');

    // 3) Lấy VAPID public key (text/plain). Dùng http.get để auto kèm Authorization
    const pkRes = await http.get(`${BASE_URL}/api/push/lunch-order/publicKey`, {
      responseType: 'text',
      transformResponse: [(d) => d],
      headers: { Accept: 'text/plain' },
    });
    const publicKey = String(pkRes.data || '').trim();
    if (!publicKey) throw new Error('Thiếu VAPID public key từ máy chủ');

    // 4) Subscribe
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToUint8Array(publicKey),
    });

    // 5) Gửi subscription lên BE để lưu DB
    await http.post(`${BASE_URL}/api/push/lunch-order/subscribe`, sub);

    return true;
  } catch (error) {
    throw new Error(mapPushError(error));
  }
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
