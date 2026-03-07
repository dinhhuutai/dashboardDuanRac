// src/pages/Lunch/api/lunchApi.js
import http from '~/api/http';
import { BASE_URL } from '~/config';

export async function apiGetWeeklyMenuLatest(weekStartMonday) {
  const res = await http.get(
    `${BASE_URL}/api/lunch-order/user/weekly-menu-latest`,
    {
      params: {
        weekStartMonday,
      },
    }
  );

  return res.data?.data || null;
}

export async function apiGetSelections(weeklyMenuId, userId) {
  const res = await http.get(`${BASE_URL}/api/lunch-order/user/selections/${weeklyMenuId}/${userId}`);
  return res.data?.data || [];
}

export async function apiSaveSelections(payload) {
  // payload: { userId, weeklyMenuId, selections: [{entryId, quantity, branchId?}], createdBy? }
  const res = await http.post(`${BASE_URL}/api/lunch-order/user/selections/save`, payload);
  return res.data;
}

export async function apiItemActionCancel(payload) {
  // payload: { userId, weeklyMenuId, weeklyMenuEntryId, branchId?, updatedBy? }
  const res = await http.post(`${BASE_URL}/api/lunch-order/user/selections/item-action`, payload);
  return res.data;
}


export async function apiUnsubscribePush(endpoint) {
  return http.post(`${BASE_URL}/api/push/lunch-order/unsubscribe`, { endpoint });
}


