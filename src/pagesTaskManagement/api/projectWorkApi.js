/**
 * API Quản lý dự án — base: /api/task-management
 * (Mapping với spec REST /api/projects/* → tiền tố thực tế của backend hiện tại.)
 */
import http from "~/api/http";
import { BASE_URL } from "~/config";

const root = `${BASE_URL}/api/task-management`;

export async function fetchProjectDashboard(projectId) {
  const { data } = await http.get(`${root}/${projectId}/dashboard`);
  return data;
}

export async function fetchProjectActivity(projectId) {
  const { data } = await http.get(`${root}/${projectId}/activity`);
  return data;
}

export async function fetchProjectTasks(projectId, params = {}) {
  const { data } = await http.get(`${root}/${projectId}/tasks`, { params });
  return data;
}

export async function fetchWorkflowStatuses() {
  const { data } = await http.get(`${root}/workflow-statuses`);
  return data;
}

export async function fetchProjectWorkflow(projectId) {
  const { data } = await http.get(`${root}/${projectId}/workflow`);
  return data;
}

export async function saveProjectWorkflow(projectId, items) {
  const { data } = await http.put(`${root}/${projectId}/workflow`, { items });
  return data;
}

export async function updateProject(projectId, body) {
  const { data } = await http.put(`${root}/projects/${projectId}`, body);
  return data;
}

export async function patchProjectStatus(projectId, status) {
  const { data } = await http.patch(`${root}/projects/${projectId}/status`, { status });
  return data;
}

export async function deleteProjectSoft(projectId) {
  const { data } = await http.delete(`${root}/projects/${projectId}`);
  return data;
}

export async function fetchProjectMembers(projectId) {
  const { data } = await http.get(`${root}/${projectId}/members`);
  return data;
}

export async function updateProjectMemberRole(projectId, targetUserId, projectRoleId) {
  const { data } = await http.put(`${root}/${projectId}/members/${targetUserId}`, {
    projectRoleId,
  });
  return data;
}

export async function removeProjectMember(projectId, targetUserId) {
  const { data } = await http.delete(`${root}/${projectId}/members/${targetUserId}`);
  return data;
}
