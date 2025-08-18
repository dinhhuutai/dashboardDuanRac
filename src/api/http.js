// src/api/http.js
import axios from 'axios';
import { BASE_URL } from '~/config';

let accessToken = null; // in-memory

export const setAccessToken = (t) => { accessToken = t || null; };

const http = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // để gửi cookie refresh_token cho /auth/refresh
});

// Thêm Authorization nếu có accessToken
http.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// Tự refresh khi 401
let refreshing = null;

async function refreshToken() {
  const res = await axios.post(`${BASE_URL}/auth/refresh`, null, { withCredentials: true });
  if (res.data?.success && res.data?.data?.accessToken) {
    setAccessToken(res.data.data.accessToken);
    return res.data.data.accessToken;
  }
  throw new Error('refresh failed');
}

http.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config || {};
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        refreshing = refreshing || refreshToken();
        const newAccess = await refreshing;
        refreshing = null;
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newAccess}`;
        return http(original); // thử lại
      } catch (e) {
        refreshing = null;
        // TODO: dispatch logout, điều hướng login
      }
    }
    return Promise.reject(error);
  }
);

export default http;
