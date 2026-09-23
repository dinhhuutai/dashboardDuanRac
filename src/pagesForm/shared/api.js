// Gọi API module Biểu mẫu nội bộ (backend: ApiDuAnRac/src/FormManagement/api.js)
import http from "~/api/http";

const unwrap = (p) => p.then((r) => r.data?.data);

/** Lấy thông báo lỗi tiếng Việt từ response của backend */
export function errorMessage(err, fallback = "Có lỗi xảy ra, vui lòng thử lại") {
  return err?.response?.data?.message || (err?.response ? fallback : "Không kết nối được máy chủ");
}
export const errorCode = (err) => err?.response?.data?.code;

export const fmApi = {
  // Người dùng
  myProfile: () => unwrap(http.get("/api/fm/me/profile")),
  saveMyProfile: (body) => unwrap(http.put("/api/fm/me/profile", body)),
  myForms: () => unwrap(http.get("/api/fm/me/forms")),
  myForm: (id) => unwrap(http.get(`/api/fm/me/forms/${id}`)),
  submit: (id, answers) => unwrap(http.post(`/api/fm/me/forms/${id}/submit`, { answers })),

  // Admin — biểu mẫu
  forms: () => unwrap(http.get("/api/fm/admin/forms")),
  form: (id) => unwrap(http.get(`/api/fm/admin/forms/${id}`)),
  createForm: (def) => unwrap(http.post("/api/fm/admin/forms", def)),
  updateForm: (id, def) => unwrap(http.put(`/api/fm/admin/forms/${id}`, def)),
  setFlags: (id, flags) => unwrap(http.patch(`/api/fm/admin/forms/${id}/flags`, flags)),
  duplicate: (id) => unwrap(http.post(`/api/fm/admin/forms/${id}/duplicate`)),
  remove: (id) => unwrap(http.delete(`/api/fm/admin/forms/${id}`)),

  // Admin — kết quả
  stats: (id, params) => unwrap(http.get(`/api/fm/admin/forms/${id}/stats`, { params })),
  responses: (id, params) => unwrap(http.get(`/api/fm/admin/forms/${id}/responses`, { params })),
  missing: (id) => unwrap(http.get(`/api/fm/admin/forms/${id}/missing`)),
  removeResponse: (responseId) => unwrap(http.delete(`/api/fm/admin/responses/${responseId}`)),

  // Admin — phòng ban / chức danh
  orgList: (kind) => unwrap(http.get(`/api/fm/admin/org/${kind}`)), // kind: departments | job-titles
  orgCreate: (kind, body) => unwrap(http.post(`/api/fm/admin/org/${kind}`, body)),
  orgUpdate: (kind, id, body) => unwrap(http.put(`/api/fm/admin/org/${kind}/${id}`, body)),
  orgUsers: (params) => unwrap(http.get("/api/fm/admin/org/users", { params })),
  assignProfiles: (body) => unwrap(http.put("/api/fm/admin/org/users/profile", body)),
};
