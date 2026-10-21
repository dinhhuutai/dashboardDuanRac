// Gọi API module 18 "Quản lý đề xuất" (backend: ApiDuAnRac/src/RequestManagement)
import http from "~/api/http";

const unwrap = (p) => p.then((r) => r.data?.data);
const silent = { silent: true }; // request chạy nền → không hiện thanh tiến trình

export function errorMessage(err, fallback = "Có lỗi xảy ra, vui lòng thử lại") {
  return err?.response?.data?.message || (err?.response ? fallback : "Không kết nối được máy chủ — kiểm tra mạng");
}

// Nhập từ Base: tệp ~1 MB chữ → nén gzip trên trình duyệt (còn ~10%) và gửi Content-Type riêng
// (backend RequestManagement/imports.js có bộ đọc JSON riêng, giới hạn 8 MB; express.json() chung chỉ nhận 100 KB).
const IMPORT_TYPE = "application/vnd.noibo.import+json";
async function postImport(url, payload, opts) {
  const text = JSON.stringify(payload);
  const plain = () => http.post(url, text, { ...opts, headers: { "Content-Type": IMPORT_TYPE } });
  if (typeof CompressionStream === "undefined" || text.length < 16384) return unwrap(plain());
  const blob = await new Response(new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"))).blob();
  try {
    return await unwrap(http.post(url, blob, { ...opts, headers: { "Content-Type": IMPORT_TYPE, "Content-Encoding": "gzip" } }));
  } catch (e) {
    // thân nén không đọc được (máy chủ trung gian / bộ đọc không giải nén) → gửi lại không nén.
    // Lỗi kiểm tra dữ liệu của imports.js (JSON có success) thì không gửi lại.
    const st = e?.response?.status, d = e?.response?.data;
    if (st === 415 || (st === 400 && (d?.success === undefined || d?.message === "Dữ liệu gửi lên không đọc được"))) return unwrap(plain());
    throw e;
  }
}

export const rqApi = {
  bootstrap: () => unwrap(http.get("/api/rq/me/bootstrap")),
  pulse: () => unwrap(http.get("/api/rq/me/pulse", silent)),
  directory: () => unwrap(http.get("/api/rq/directory", silent)),

  // Đề xuất
  list: (params, opts) => unwrap(http.get("/api/rq/requests", { params, ...opts })),
  detail: (id, opts) => unwrap(http.get(`/api/rq/requests/${id}`, opts)),
  updates: (id, afterCommentId) => unwrap(http.get(`/api/rq/requests/${id}/updates`, { params: { afterCommentId }, ...silent })),
  create: (body) => unwrap(http.post("/api/rq/requests", body)),
  update: (id, body) => unwrap(http.put(`/api/rq/requests/${id}`, body)),
  act: (id, action, note) => unwrap(http.post(`/api/rq/requests/${id}/${action}`, { note })), // approve | reject | return
  bulk: (ids, action, note) => unwrap(http.post("/api/rq/requests/bulk", { ids, action, note })),
  cancel: (id, note) => unwrap(http.post(`/api/rq/requests/${id}/cancel`, { note })),
  forward: (id, body) => unwrap(http.post(`/api/rq/requests/${id}/forward`, body)), // { userId, note, approve }
  remove: (id) => unwrap(http.delete(`/api/rq/requests/${id}`)),
  printTemplates: (id) => unwrap(http.get(`/api/rq/requests/${id}/print`)), // mẫu in của mẫu đề xuất (đủ khối)
  addFollowers: (id, userIds) => unwrap(http.post(`/api/rq/requests/${id}/followers`, { userIds })),
  removeFollower: (id, userId) => unwrap(http.delete(`/api/rq/requests/${id}/followers/${userId}`)),
  comment: (id, body) => unwrap(http.post(`/api/rq/requests/${id}/comments`, body)),
  deleteComment: (commentId) => unwrap(http.delete(`/api/rq/comments/${commentId}`)),

  // Thông báo
  notifications: (params) => unwrap(http.get("/api/rq/notifications", { params, ...silent })),
  readNotifications: (body) => unwrap(http.post("/api/rq/notifications/read", body, silent)),

  // Chat
  conversations: (opts) => unwrap(http.get("/api/rq/chat/conversations", opts)),
  openConversation: (body) => unwrap(http.post("/api/rq/chat/conversations", body)),
  messages: (cid, params, opts) => unwrap(http.get(`/api/rq/chat/conversations/${cid}/messages`, { params, ...opts })),
  sendMessage: (cid, body) => unwrap(http.post(`/api/rq/chat/conversations/${cid}/messages`, body)),
  readConversation: (cid, lastMessageId) => unwrap(http.post(`/api/rq/chat/conversations/${cid}/read`, { lastMessageId }, silent)),
  addMembers: (cid, userIds) => unwrap(http.post(`/api/rq/chat/conversations/${cid}/members`, { userIds })),
  leaveConversation: (cid) => unwrap(http.delete(`/api/rq/chat/conversations/${cid}/members/me`)),
  deleteMessage: (mid) => unwrap(http.delete(`/api/rq/chat/messages/${mid}`)),

  // Quản trị
  groups: () => unwrap(http.get("/api/rq/admin/groups")),
  createGroup: (body) => unwrap(http.post("/api/rq/admin/groups", body)),
  updateGroup: (id, body) => unwrap(http.put(`/api/rq/admin/groups/${id}`, body)),
  types: () => unwrap(http.get("/api/rq/admin/types")),
  type: (id) => unwrap(http.get(`/api/rq/admin/types/${id}`)),
  createType: (body) => unwrap(http.post("/api/rq/admin/types", body)),
  updateType: (id, body) => unwrap(http.put(`/api/rq/admin/types/${id}`, body)),
  setTypeActive: (id, isActive) => unwrap(http.patch(`/api/rq/admin/types/${id}/active`, { isActive })),
  deleteType: (id) => unwrap(http.delete(`/api/rq/admin/types/${id}`)),
  heads: () => unwrap(http.get("/api/rq/admin/heads")),
  saveHeads: (body) => unwrap(http.put("/api/rq/admin/heads", body)),
  stats: (params) => unwrap(http.get("/api/rq/admin/stats", { params })),

  // Nhập dữ liệu cũ từ Base Request (sql/12)
  importAnalyze: (body, opts) => postImport("/api/rq/admin/import/base/analyze", body, opts), // { header, rows, settings }
  importStart: (body) => postImport("/api/rq/admin/import/base/batches", body), // + fileName → { batchId, willCreate, createdTypes }
  importRows: (batchId, body) => postImport(`/api/rq/admin/import/base/batches/${batchId}/rows`, body), // { header, rows ≤ 100 }
  importFinish: (batchId) => unwrap(http.post(`/api/rq/admin/import/base/batches/${batchId}/finish`)),
  importBatches: () => unwrap(http.get("/api/rq/admin/import/batches")),
  importUndo: (batchId) => unwrap(http.post(`/api/rq/admin/import/batches/${batchId}/undo`)),

  // Báo cáo tự thiết kế (xem: người được chia sẻ + admin; tạo/sửa/xem trước: admin)
  reports: () => unwrap(http.get("/api/rq/reports")),
  report: (id) => unwrap(http.get(`/api/rq/reports/${id}`)),
  runReport: (id, params, opts) => unwrap(http.get(`/api/rq/reports/${id}/run`, { params, ...opts })), // params: { period, from, to }
  previewReport: (body, opts) => unwrap(http.post("/api/rq/reports/preview", body, opts)), // { typeId, definition, range }
  createReport: (body) => unwrap(http.post("/api/rq/reports", body)),
  updateReport: (id, body) => unwrap(http.put(`/api/rq/reports/${id}`, body)),
  deleteReport: (id) => unwrap(http.delete(`/api/rq/reports/${id}`)),
};
