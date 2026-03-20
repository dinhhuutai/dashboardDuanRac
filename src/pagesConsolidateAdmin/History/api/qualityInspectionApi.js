import http from "~/api/http";
import { BASE_URL } from "~/config";

export const apiGetAdminHistorySummary = async (params) => {
  const res = await http.get(
    `${BASE_URL}/api/quality-inspection/admin-history-summary`,
    { params }
  );
  return res.data;
};

export const apiRerunAdminHistory = async (id) => {
    const res = await http.post(
    `${BASE_URL}/api/quality-inspection/admin-history-rerun`,
    { id }
  );
  return res.data;
};

export const apiRerunAdminHistoryBulk = async (ids) => {
  const res = await http.post(
    `${BASE_URL}/api/quality-inspection/admin-history-rerun-bulk`,
    { ids }
  );
  return res.data;
};