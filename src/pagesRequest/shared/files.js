// Tệp / ảnh của module 18 — tải THẲNG lên máy chủ tệp nội bộ (ApiDuAnRac/fileserver), không qua API Internet.
// - checkLan(): gọi <máy chủ tệp>/health — được = đang ở mạng công ty.
// - uploadFile(): vé tải lên lấy từ API → PUT tệp (có % tiến trình) → ảnh thì tạo thêm ảnh thu nhỏ ~480px
//   ngay trên trình duyệt và tải lên kèm (danh sách/bình luận mở nhanh, không phải kéo ảnh gốc 3–5 MB).
import { rqApi } from "./api";
import { rqStore } from "./store";

const BLOCKED_EXT = new Set(["exe", "msi", "bat", "cmd", "com", "scr", "pif", "ps1", "psm1", "vbs", "vbe", "js", "jse", "wsf", "wsh",
  "hta", "cpl", "dll", "jar", "lnk", "reg", "msc", "sys", "inf", "gadget", "application", "appx", "msix", "iso", "img", "vhd", "vhdx"]);
const THUMB_TYPES = /^image\/(jpeg|png|webp|bmp|gif|avif)$/i;

export const extOf = (name) => (/\.([A-Za-z0-9]{1,10})$/.exec(name || "")?.[1] || "").toLowerCase();

function fileCfg() {
  return rqStore.get().boot?.files || { enabled: false };
}

/* ------------------------------ Mạng công ty ------------------------------ */
let lanAt = 0;
let lanPromise = null;

export function checkLan(force = false) {
  const cfg = fileCfg();
  if (!cfg.enabled || !cfg.url) {
    if (rqStore.get().lan !== "disabled") rqStore.set({ lan: "disabled" });
    return Promise.resolve(false);
  }
  const cur = rqStore.get().lan;
  if (!force && (cur === "online" || cur === "offline") && Date.now() - lanAt < 60000) return Promise.resolve(cur === "online");
  if (lanPromise) return lanPromise;
  if (cur === "unknown" || cur === "disabled") rqStore.set({ lan: "checking" });
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4000);
  lanPromise = fetch(`${cfg.url}/health`, { cache: "no-store", mode: "cors", signal: ctrl.signal })
    .then((r) => r.ok)
    .catch(() => false)
    .then((ok) => {
      clearTimeout(timer);
      lanAt = Date.now();
      lanPromise = null;
      rqStore.set({ lan: ok ? "online" : "offline" });
      return ok;
    });
  return lanPromise;
}

if (typeof window !== "undefined") {
  // đổi Wi-Fi / có mạng lại → kiểm tra lại
  window.addEventListener("online", () => checkLan(true));
}

/* ------------------------------ Vé tải lên ------------------------------ */
let ticket = null;
let ticketAt = 0;
async function getTicket(force) {
  if (!force && ticket && Date.now() - ticketAt < 90 * 60 * 1000) return ticket;
  const r = await rqApi.fileTicket();
  ticket = r.ticket;
  ticketAt = Date.now();
  return ticket;
}

/* ------------------------------ Tải lên ------------------------------ */
function xhrPut(url, body, headers, onProgress, hold) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    hold?.(xhr);
    xhr.open("PUT", url);
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);
    if (onProgress) xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => {
      let data = null;
      try { data = JSON.parse(xhr.responseText); } catch { /* không phải JSON */ }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else reject(Object.assign(new Error(data?.message || `Lỗi máy chủ tệp (${xhr.status})`), { status: xhr.status }));
    };
    xhr.onerror = () => reject(Object.assign(new Error("Không kết nối được máy chủ tệp nội bộ — bạn cần dùng mạng công ty"), { network: true }));
    xhr.onabort = () => reject(Object.assign(new Error("Đã huỷ"), { aborted: true }));
    xhr.send(body);
  });
}

async function loadBitmap(file) {
  if (window.createImageBitmap) {
    try { return await createImageBitmap(file, { imageOrientation: "from-image" }); } catch { /* thử cách khác */ }
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Không đọc được ảnh")); };
    img.src = url;
  });
}

/** Ảnh thu nhỏ JPEG cạnh dài ≤ 480 px (+ kích thước ảnh gốc) */
async function makeThumb(file) {
  const bmp = await loadBitmap(file);
  const w = bmp.width, h = bmp.height;
  const scale = Math.min(1, 480 / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff"; // PNG trong suốt → nền trắng
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close?.();
  const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.78));
  if (!blob) throw new Error("Không tạo được ảnh thu nhỏ");
  return { blob, width: w, height: h };
}

/** Kiểm tra trước khi tải. Trả về thông báo lỗi hoặc null */
export function validateFile(file) {
  const cfg = fileCfg();
  if (!cfg.enabled) return "Chưa cấu hình máy chủ tệp nội bộ — liên hệ IT";
  const ext = extOf(file.name);
  if (BLOCKED_EXT.has(ext)) return `Không nhận tệp .${ext} (tệp chạy chương trình)`;
  if (file.size > cfg.maxMb * 1024 * 1024) return `Tệp quá lớn (tối đa ${cfg.maxMb} MB)`;
  if (file.size === 0) return "Tệp rỗng";
  return null;
}

/**
 * Tải 1 tệp lên máy chủ tệp nội bộ.
 * @returns { promise: Promise<{key,name,size,mime,sig,hasThumb,width,height}>, cancel() }
 */
export function uploadFile(file, { onProgress } = {}) {
  let xhr = null;
  let cancelled = false;
  const promise = (async () => {
    const err = validateFile(file);
    if (err) throw new Error(err);
    const cfg = fileCfg();
    const headers = (t) => ({
      Authorization: `Bearer ${t}`,
      "X-File-Name": encodeURIComponent(file.name || "tep"),
      "Content-Type": file.type || "application/octet-stream",
    });
    let res;
    try {
      res = await xhrPut(`${cfg.url}/upload`, file, headers(await getTicket()), onProgress, (x) => { xhr = x; });
    } catch (e) {
      if (e.status !== 401 || cancelled) {
        if (e.network) checkLan(true);
        throw e;
      }
      res = await xhrPut(`${cfg.url}/upload`, file, headers(await getTicket(true)), onProgress, (x) => { xhr = x; }); // vé hết hạn → lấy vé mới
    }
    const meta = { ...res, hasThumb: false, width: null, height: null };
    if (THUMB_TYPES.test(file.type || "") && !cancelled) {
      try {
        const t = await makeThumb(file);
        meta.width = t.width;
        meta.height = t.height;
        await xhrPut(`${cfg.url}/upload`, t.blob, { ...headers(await getTicket()), "Content-Type": "image/jpeg", "X-Thumb-For": res.key }, null, (x) => { xhr = x; });
        meta.hasThumb = true;
      } catch { /* không có ảnh thu nhỏ thì hiện ảnh gốc */ }
    }
    return meta;
  })();
  return {
    promise,
    cancel: () => {
      cancelled = true;
      xhr?.abort();
    },
  };
}

/** Kích thước tệp dễ đọc */
export function fmtSize(n) {
  if (!Number.isFinite(n)) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB`;
  return `${(n / 1048576).toFixed(n < 10485760 ? 1 : 0)} MB`;
}
