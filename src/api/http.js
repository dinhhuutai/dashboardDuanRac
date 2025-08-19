// src/api/http.js
import axios from "axios";
import { BASE_URL } from "~/config";

let accessToken = null;                 // token trong RAM
let onUnauthorized = null;              // callback khi hết hạn & refresh fail
let isRefreshing = false;               // trạng thái refresh
let pendingQueue = [];                  // hàng đợi các request chờ refresh

export const setAccessToken = (t) => { accessToken = t || null; };
export const getAccessToken = () => accessToken;
export const setOnUnauthorized = (fn) => { onUnauthorized = typeof fn === "function" ? fn : null; };

const http = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // gửi cookie refresh_token tới /auth/refresh
  // headers: { 'Content-Type': 'application/json' } // KHÔNG set cứng, để axios tự set theo payload (JSON/FormData)
});

// === REQUEST: gắn Authorization nếu có token ===
http.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// === Hàm gọi refresh token (dùng cookie) ===
async function doRefresh() {
  const res = await axios.post(`${BASE_URL}/auth/refresh`, null, { withCredentials: true });
  const newToken = res?.data?.data?.accessToken;
  if (!newToken) throw new Error("refresh failed");
  setAccessToken(newToken);
  return newToken;
}

// === RESPONSE: tự động refresh khi 401 ===
http.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config || {};
    const status = error?.response?.status;

    // Không phải 401 → trả về lỗi như bình thường
    if (status !== 401) return Promise.reject(error);

    // Tránh lặp vô hạn
    if (original._retry) {
      // Đã retry rồi vẫn 401 → coi như failed
      if (onUnauthorized) onUnauthorized();
      return Promise.reject(error);
    }
    original._retry = true;

    // Nếu đang refresh → chờ refresh xong rồi retry request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      })
      .then((token) => {
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${token}`;
        return http(original);
      })
      .catch((err) => Promise.reject(err));
    }

    // Chưa refresh → bắt đầu refresh
    isRefreshing = true;
    try {
      const newToken = await doRefresh();

      // giải phóng hàng đợi: thành công
      pendingQueue.forEach(({ resolve }) => resolve(newToken));
      pendingQueue = [];

      // retry request gốc
      original.headers = original.headers || {};
      original.headers.Authorization = `Bearer ${newToken}`;
      return http(original);
    } catch (e) {
      // giải phóng hàng đợi: thất bại
      pendingQueue.forEach(({ reject }) => reject(e));
      pendingQueue = [];

      // gọi callback logout nếu có
      if (onUnauthorized) onUnauthorized();
      return Promise.reject(e);
    } finally {
      isRefreshing = false;
    }
  }
);

export default http;
