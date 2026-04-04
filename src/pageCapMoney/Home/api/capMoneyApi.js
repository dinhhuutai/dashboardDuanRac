import http from "~/api/http";
import { BASE_URL } from "~/config";

const root = `${BASE_URL}/api/capmoney`;

export async function apiGetCapMoneyHomeSummary(params = {}) {
  const res = await http.get(`${root}/home-summary`, { params });
  return res.data;
}

export async function apiGetCapMoneyCategories(transactionType) {
  const res = await http.get(`${root}/categories`, {
    params: { transactionType },
  });
  return res.data;
}

export async function apiGetCapMoneyAccounts() {
  const res = await http.get(`${root}/accounts`);
  return res.data;
}

export async function apiCreateCapMoneyTransaction(formData) {
  const res = await http.post(`${root}/transactions`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function apiGetCapMoneyTransactionsByDate(date, params = {}) {
  const res = await http.get(`${root}/transactions/by-date/${date}`, { params });
  return res.data;
}

