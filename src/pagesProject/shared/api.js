// Gọi API module 3 "Quản lý dự án" (backend: ApiDuAnRac/src/ProjectManagement)
import http from "~/api/http";

const unwrap = (p) => p.then((r) => r.data?.data);
const silent = { silent: true }; // request chạy nền → không hiện thanh tiến trình

export function errorMessage(err, fallback = "Có lỗi xảy ra, vui lòng thử lại") {
  return err?.response?.data?.message || (err?.response ? fallback : "Không kết nối được máy chủ — kiểm tra mạng");
}

export const UPLOAD_ENDPOINT = "/api/pj/files/upload";

export const pjApi = {
  bootstrap: () => unwrap(http.get("/api/pj/me/bootstrap")),
  pulse: () => unwrap(http.get("/api/pj/me/pulse", silent)),
  directory: () => unwrap(http.get("/api/pj/directory", silent)),
  notifications: () => unwrap(http.get("/api/pj/notifications", { params: { limit: 30 }, ...silent })),
  readNotifications: (body) => unwrap(http.post("/api/pj/notifications/read", body, silent)),

  // Dự án
  projects: (params, opts) => unwrap(http.get("/api/pj/projects", { params, ...opts })), // { status: 'all' } = cả dự án lưu trữ
  project: (id, opts) => unwrap(http.get(`/api/pj/projects/${id}`, opts)),
  createProject: (body) => unwrap(http.post("/api/pj/projects", body)),
  updateProject: (id, body) => unwrap(http.put(`/api/pj/projects/${id}`, body)),
  deleteProject: (id) => unwrap(http.delete(`/api/pj/projects/${id}`)),

  // Công việc
  projectTasks: (id, params, opts) => unwrap(http.get(`/api/pj/projects/${id}/tasks`, { params, ...opts })), // { assigneeId, status }
  tasks: (params, opts) => unwrap(http.get("/api/pj/tasks", { params, ...opts })), // { scope: mine|waiting|assigned, status }
  createTask: (projectId, body) => unwrap(http.post(`/api/pj/projects/${projectId}/tasks`, body)),
  task: (id, opts) => unwrap(http.get(`/api/pj/tasks/${id}`, opts)),
  updateTask: (id, body) => unwrap(http.put(`/api/pj/tasks/${id}`, body)),
  act: (id, action, body) => unwrap(http.post(`/api/pj/tasks/${id}/${action}`, body)), // question|answer|accept|comment|submit|approve|revise|cancel|reopen

  // Thông tin chung / trò chuyện / tệp của dự án
  posts: (projectId, opts) => unwrap(http.get(`/api/pj/projects/${projectId}/posts`, opts)),
  createPost: (projectId, body) => unwrap(http.post(`/api/pj/projects/${projectId}/posts`, body)),
  updatePost: (postId, body) => unwrap(http.put(`/api/pj/posts/${postId}`, body)),
  deletePost: (postId) => unwrap(http.delete(`/api/pj/posts/${postId}`)),
  messages: (projectId, params, opts) => unwrap(http.get(`/api/pj/projects/${projectId}/messages`, { params, ...opts })), // { after } | { before }
  sendMessage: (projectId, body) => unwrap(http.post(`/api/pj/projects/${projectId}/messages`, body)),
  deleteMessage: (messageId) => unwrap(http.delete(`/api/pj/messages/${messageId}`)),
  readMessages: (projectId, lastId) => unwrap(http.post(`/api/pj/projects/${projectId}/messages/read`, { lastId }, silent)),
  projectFiles: (projectId, opts) => unwrap(http.get(`/api/pj/projects/${projectId}/files`, opts)),

  // Theo dõi
  people: (opts) => unwrap(http.get("/api/pj/people", opts)),
  person: (userId, params, opts) => unwrap(http.get(`/api/pj/people/${userId}`, { params, ...opts })), // { days }
  dashboard: (params, opts) => unwrap(http.get("/api/pj/dashboard", { params, ...opts })), // { days, projectId }
};

export { silent };
