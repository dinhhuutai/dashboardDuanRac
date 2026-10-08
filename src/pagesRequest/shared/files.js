// Tệp / ảnh của module 18 — tải lên QUA API (https), API chuyển tiếp sang máy chủ tệp nội bộ
// (ApiDuAnRac/fileserver trên sv-backup). Xem / tải về cũng qua API bằng đường dẫn có chữ ký
// (backend trả đường dẫn tương đối /api/rq/f/… → fileHref() ghép địa chỉ API). Dùng được ở mọi mạng.
// - uploadFile(): PUT tệp (có % tiến trình) → ảnh thì tạo thêm ảnh thu nhỏ ~480px ngay trên trình duyệt
//   và tải lên kèm (danh sách/bình luận mở nhanh, không phải kéo ảnh gốc 3–5 MB).
import axios from "axios";
import http from "~/api/http";
import { BASE_URL } from "~/config";
import { rqStore } from "./store";

const BLOCKED_EXT = new Set(["exe", "msi", "bat", "cmd", "com", "scr", "pif", "ps1", "psm1", "vbs", "vbe", "js", "jse", "wsf", "wsh",
  "hta", "cpl", "dll", "jar", "lnk", "reg", "msc", "sys", "inf", "gadget", "application", "appx", "msix", "iso", "img", "vhd", "vhdx"]);
const THUMB_TYPES = /^image\/(jpeg|png|webp|bmp|gif|avif)$/i;

export const extOf = (name) => (/\.([A-Za-z0-9]{1,10})$/.exec(name || "")?.[1] || "").toLowerCase();

function fileCfg() {
  return rqStore.get().boot?.files || { enabled: false };
}

/** Đường dẫn tệp do backend trả (tương đối /api/rq/f/…) → đường dẫn đầy đủ tới API */
export const fileHref = (u) => (u && u.startsWith("/") ? `${BASE_URL}${u}` : u || null);

/* ------------------------------ Tải lên ------------------------------ */
function put(body, headers, { onProgress, signal } = {}) {
  return http.put("/api/rq/files/upload", body, {
    // Content-Type luôn octet-stream: loại thật gửi ở X-File-Type (tệp .json không bị API đọc nhầm)
    headers: { "Content-Type": "application/octet-stream", ...headers },
    onUploadProgress: onProgress ? (e) => e.total && onProgress(Math.min(1, e.loaded / e.total)) : undefined,
    signal,
    silent: true, // có % riêng trên từng tệp → không hiện thanh tiến trình đầu trang
    timeout: 0,
  }).then((r) => r.data?.data, (e) => {
    if (axios.isCancel(e) || e?.code === "ERR_CANCELED") throw Object.assign(new Error("Đã huỷ"), { aborted: true });
    const msg = e?.response?.data?.message
      || (e?.response ? `Lỗi tải tệp (${e.response.status})` : "Không kết nối được máy chủ — kiểm tra mạng rồi thử lại");
    throw Object.assign(new Error(msg), { status: e?.response?.status });
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
 * Tải 1 tệp lên (qua API → máy chủ tệp nội bộ).
 * @returns { promise: Promise<{key,name,size,mime,sig,hasThumb,width,height}>, cancel() }
 */
export function uploadFile(file, { onProgress } = {}) {
  const ctrl = new AbortController();
  const promise = (async () => {
    const err = validateFile(file);
    if (err) throw new Error(err);
    const res = await put(file, {
      "X-File-Name": encodeURIComponent(file.name || "tep"),
      "X-File-Type": file.type || "",
    }, { onProgress, signal: ctrl.signal });
    const meta = { ...res, hasThumb: false, width: null, height: null };
    if (THUMB_TYPES.test(file.type || "") && !ctrl.signal.aborted) {
      try {
        const t = await makeThumb(file);
        meta.width = t.width;
        meta.height = t.height;
        // mã tệp có tên tiếng Việt (HinhAnh/2026-10-08/Ảnh.jpg) — header HTTP chỉ nhận Latin-1 → mã hoá
        await put(t.blob, { "X-Thumb-For": encodeURIComponent(res.key) }, { signal: ctrl.signal });
        meta.hasThumb = true;
      } catch (e) {
        if (e.aborted) throw e; // không có ảnh thu nhỏ thì hiện ảnh gốc
      }
    }
    return meta;
  })();
  return { promise, cancel: () => ctrl.abort() };
}

/** Kích thước tệp dễ đọc */
export function fmtSize(n) {
  if (!Number.isFinite(n)) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB`;
  return `${(n / 1048576).toFixed(n < 10485760 ? 1 : 0)} MB`;
}
