// Gọi API module 18 "Quản lý yêu cầu" (backend: ApiDuAnRac/src/RequestManagement)
import http from "~/api/http";

const unwrap = (p) => p.then((r) => r.data?.data);
const silent = { silent: true }; // request chạy nền → không hiện thanh tiến trình

export function errorMessage(err, fallback = "Có lỗi xảy ra, vui lòng thử lại") {
  return err?.response?.data?.message || (err?.response ? fallback : "Không kết nối được máy chủ — kiểm tra mạng");
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
};
