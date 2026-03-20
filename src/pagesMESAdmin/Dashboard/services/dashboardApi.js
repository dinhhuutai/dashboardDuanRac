import http from '~/api/http';
import { BASE_URL } from '~/config';
import { cleanParams, formatDateParam } from '../utils/dashboardHelpers';

function normalizePaging(res) {
  return {
    data: res.data?.data || [],
    pagination: res.data?.pagination || {
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 0,
    },
  };
}

export async function apiGetOrders(filters = {}) {
  const res = await http.get(`${BASE_URL}/api/mes/orders`, {
    params: cleanParams({
      fromDate: formatDateParam(filters.range?.from),
      toDate: formatDateParam(filters.range?.to),
      customerName: filters.customerName,
      mstatus: filters.mstatus,
      po: filters.po,
      page: filters.page,
      pageSize: filters.pageSize,
    }),
  });

  return normalizePaging(res);
}

export async function apiGetItemsByOrder(orderId, filters = {}) {
  const res = await http.get(
    `${BASE_URL}/api/mes/orders/${encodeURIComponent(orderId)}/items`,
    {
      params: cleanParams({
        fromDate: formatDateParam(filters.range?.from),
        toDate: formatDateParam(filters.range?.to),
        itemCode: filters.id,
        mstatus: filters.mstatus,
        page: filters.page,
        pageSize: filters.pageSize,
      }),
    }
  );

  return normalizePaging(res);
}

export async function apiGetDetailsByItem(itemId, filters = {}) {
  const res = await http.get(
    `${BASE_URL}/api/mes/items/${encodeURIComponent(itemId)}/details`,
    {
      params: cleanParams({
        fromDate: formatDateParam(filters.range?.from),
        toDate: formatDateParam(filters.range?.to),
        mstatus: filters.mstatus,
        page: filters.page,
        pageSize: filters.pageSize,
      }),
    }
  );

  return normalizePaging(res);
}

export async function apiGetBatchesByDetail(detailId, filters = {}) {
  const res = await http.get(
    `${BASE_URL}/api/mes/details/${encodeURIComponent(detailId)}/batches`,
    {
      params: cleanParams({
        fromDate: formatDateParam(filters.range?.from),
        toDate: formatDateParam(filters.range?.to),
        page: filters.page,
        pageSize: filters.pageSize,
      }),
    }
  );

  return normalizePaging(res);
}