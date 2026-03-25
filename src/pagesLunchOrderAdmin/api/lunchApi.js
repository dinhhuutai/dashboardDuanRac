import http from '~/api/http';
import { BASE_URL } from '~/config';

export async function apiGetLunchSettings() {
  const res = await http.get(`${BASE_URL}/api/lunch-order/settings/current`);
  return res.data?.data || null;
}

export async function apiSaveLunchSettings(payload) {
  const res = await http.put(`${BASE_URL}/api/lunch-order/settings/current`, payload);
  return res.data;
}


export const apiGetLunchReportByDate = async (date, statusType = "re") => {
  const res = await http.get(
    `${BASE_URL}/api/lunch-order/report/by-date/${date}?statusType=${statusType}`
  );
  return res.data;
};

export const apiUpdateWeeklySelectionQuantityByType = async (payload) => {
  const res = await http.put(
    `${BASE_URL}/api/lunch-order/weekly-selection/update-quantity-by-type`,
    payload
  );
  return res.data;
};