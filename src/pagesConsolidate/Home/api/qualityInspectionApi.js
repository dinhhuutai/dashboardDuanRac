import http from "~/api/http";
import { BASE_URL } from "~/config";

export const apiGetInspectionHistory = async (params) => {
  const res = await http.get(
    `${BASE_URL}/api/quality-inspection/history`,
    { params }
  );
  return res.data;
};