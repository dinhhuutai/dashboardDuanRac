// src/api/http.js
import axios from "axios";
import { BASE_URL } from "~/config";
import store from "~/redux/store";
import authSlice from "~/redux/slices/authSlice";

// Sửa path này cho khớp backend của bạn:
// - Nếu BE: app.use('/auth', ...)  => "/auth/refresh"
// - Nếu BE: app.use('/api', ...) + router.post('/auth/refresh') => "/api/auth/refresh"
const REFRESH_PATH = "/refresh";

const http = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // gửi cookie refreshToken
});

// Lấy accessToken trực tiếp từ Redux
function selectAccessToken() {
  try {
    return store.getState()?.auth?.login?.accessToken || null;
  } catch {
    return null;
  }
}

// Lấy accessToken từ nhiều shape response khác nhau
function pickAccessToken(res) {
  return (
    res?.data?.accessToken ||
    res?.data?.data?.accessToken ||
    res?.data?.token ||
    res?.data?.data?.token ||
    null
  );
}

function isAuthPath(url = "") {
  // Không auto-refresh cho request /login hoặc chính /auth/refresh
  return url.includes("/login") || url.includes(REFRESH_PATH);
}

// === REQUEST: gắn Authorization từ Redux nếu có ===
http.interceptors.request.use((config) => {
  const token = selectAccessToken();

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// === RESPONSE: tự động refresh khi 401 ===
http.interceptors.response.use(
  (r) => r,
  async (error) => {
    // Network/CORS error không có response → ném về cho caller
    if (!error?.response) return Promise.reject(error);

    const original = error.config || {};
    const status = error.response.status;

    // Không xử lý refresh cho status khác 401 hoặc cho chính login/refresh
    if (status !== 401 || isAuthPath(original?.url)) {
      return Promise.reject(error);
    }

    // Tránh vòng lặp: chỉ retry 1 lần
    if (original._retry) {
      // refresh đã thử mà vẫn 401 → logout
      store.dispatch(authSlice.actions.logoutSuccess());
      return Promise.reject(error);
    }
    original._retry = true;

    try {
      // Gọi refresh bằng axios gốc (không dùng instance có interceptor)
      const res = await axios.post(`${BASE_URL}${REFRESH_PATH}`, null, {
        withCredentials: true,
      });

      const newToken = pickAccessToken(res);
      if (!newToken) {
        // Không có token mới → coi như fail
        store.dispatch(authSlice.actions.logoutSuccess());
        return Promise.reject(new Error("Refresh failed: missing accessToken"));
      }

      // Cập nhật token mới vào Redux để mọi request sau dùng được
      store.dispatch(authSlice.actions.refreshToken(newToken));

      // Gắn token mới và retry request gốc
      original.headers = original.headers || {};
      original.headers.Authorization = `Bearer ${newToken}`;
      return http(original);
    } catch (e) {
      // Refresh thất bại → logout
      store.dispatch(authSlice.actions.logoutSuccess());
      return Promise.reject(e);
    }
  }
);

export default http;
