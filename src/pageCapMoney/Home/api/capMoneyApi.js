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

export async function apiGetCapMoneyTransactionsByMonth(month, params = {}) {
  const res = await http.get(`${root}/transactions/by-month/${month}`, { params });
  return res.data;
}

export async function apiDeleteCapMoneyTransaction(transactionId) {
  const res = await http.delete(`${root}/transactions/${transactionId}`);
  return res.data;
}

export async function apiReplaceCapMoneyTransactionImage(transactionId, formData) {
  const res = await http.put(`${root}/transactions/${transactionId}/image`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function apiUpdateCapMoneyTransactionDate(transactionId, payload) {
  const res = await http.put(`${root}/transactions/${transactionId}/date`, payload);
  return res.data;
}

export async function apiUpdateCapMoneyTransactionCategory(transactionId, payload) {
  const res = await http.put(`${root}/transactions/${transactionId}/category`, payload);
  return res.data;
}

export async function apiUpdateCapMoneyTransactionAccount(transactionId, payload) {
  const res = await http.put(`${root}/transactions/${transactionId}/account`, payload);
  return res.data;
}

