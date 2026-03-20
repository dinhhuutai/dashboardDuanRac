import http from "~/api/http";
import { BASE_URL } from "~/config";

export const apiGetTypePaylipAll = async () => {
  const res = await http.get(`${BASE_URL}/api/type-paylip/all`);
  return res.data;
};

export const apiGetHistoryPeriods = async (idTypePaylip) => {
  const res = await http.get(`${BASE_URL}/api/paylips/history-periods`, {
    params: { idTypePaylip },
  });
  return res.data;
};

export const apiGetHistoryBonusDates = async (idTypePaylip) => {
  const res = await http.get(`${BASE_URL}/api/paylips/history-bonus-dates`, {
    params: { idTypePaylip },
  });
  return res.data;
};

export const apiGetPaylipHistory = async (params) => {
  const res = await http.get(`${BASE_URL}/api/paylips/history`, { params });
  return res.data;
};

export const apiGetPaylipDetail = async (paylipId) => {
  const res = await http.get(`${BASE_URL}/api/paylips/history/${paylipId}`);
  return res.data;
};

export const apiDeletePaylip = async (paylipId) => {
  const res = await http.delete(`${BASE_URL}/api/paylips/history/${paylipId}`);
  return res.data;
};

export const apiDeleteManyPaylips = async (ids) => {
  const res = await http.post(`${BASE_URL}/api/paylips/history/delete-many`, {
    ids,
  });
  return res.data;
};

export const apiGetPaylipHistoryAllIds = async (params) => {
  const res = await http.get(`${BASE_URL}/api/paylips/history-all-ids`, {
    params,
  });
  return res.data;
};