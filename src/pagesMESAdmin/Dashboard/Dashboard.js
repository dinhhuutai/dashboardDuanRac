import { useEffect, useMemo, useRef, useState } from 'react';
import http from '~/api/http';
import { BASE_URL } from '~/config';

import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

function Dashboard() {
  const [level, setLevel] = useState('orders'); // orders | items | details | batches

  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [details, setDetails] = useState([]);
  const [batches, setBatches] = useState([]);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [orderFilters, setOrderFilters] = useState({
    range: { from: undefined, to: undefined },
    id: '',
    customerName: '',
  });

  const [itemFilters, setItemFilters] = useState({
    range: { from: undefined, to: undefined },
    id: '',
  });

  const [detailFilters, setDetailFilters] = useState({
    range: { from: undefined, to: undefined },
    id: '',
  });

  const [batchFilters, setBatchFilters] = useState({
    range: { from: undefined, to: undefined },
    id: '',
  });

  useEffect(() => {
    loadOrders();
  }, []);

  async function apiGetOrders(filters = {}) {
    const res = await http.get(`${BASE_URL}/api/mes/orders`, {
      params: cleanParams({
        fromDate: formatDateParam(filters.range?.from),
        toDate: formatDateParam(filters.range?.to),
        orderId: filters.id,
        customerName: filters.customerName,
      }),
    });

    return res.data?.data || [];
  }

  async function apiGetItemsByOrder(orderId, filters = {}) {
    const res = await http.get(`${BASE_URL}/api/mes/orders/${encodeURIComponent(orderId)}/items`, {
      params: cleanParams({
        fromDate: formatDateParam(filters.range?.from),
        toDate: formatDateParam(filters.range?.to),
        itemId: filters.id,
      }),
    });

    return res.data?.data || [];
  }

  async function apiGetDetailsByItem(itemId, filters = {}) {
    const res = await http.get(`${BASE_URL}/api/mes/items/${encodeURIComponent(itemId)}/details`, {
      params: cleanParams({
        fromDate: formatDateParam(filters.range?.from),
        toDate: formatDateParam(filters.range?.to),
        detailId: filters.id,
      }),
    });

    return res.data?.data || [];
  }

  async function apiGetBatchesByDetail(detailId, filters = {}) {
    const res = await http.get(`${BASE_URL}/api/mes/details/${encodeURIComponent(detailId)}/batches`, {
      params: cleanParams({
        fromDate: formatDateParam(filters.range?.from),
        toDate: formatDateParam(filters.range?.to),
        batchId: filters.id,
      }),
    });

    return res.data?.data || [];
  }

  async function loadOrders(customFilters) {
    try {
      setLoading(true);
      setError('');
      const data = await apiGetOrders(customFilters || orderFilters);
      setOrders(data);
    } catch (err) {
      console.error(err);
      setOrders([]);
      setError('Không tải được danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  }

  async function loadItems(orderId, customFilters) {
    try {
      setLoading(true);
      setError('');
      const data = await apiGetItemsByOrder(orderId, customFilters || itemFilters);
      setItems(data);
    } catch (err) {
      console.error(err);
      setItems([]);
      setError('Không tải được danh sách mã hàng');
    } finally {
      setLoading(false);
    }
  }

  async function loadDetails(itemId, customFilters) {
    try {
      setLoading(true);
      setError('');
      const data = await apiGetDetailsByItem(itemId, customFilters || detailFilters);
      setDetails(data);
    } catch (err) {
      console.error(err);
      setDetails([]);
      setError('Không tải được danh sách chi tiết');
    } finally {
      setLoading(false);
    }
  }

  async function loadBatches(detailId, customFilters) {
    try {
      setLoading(true);
      setError('');
      const data = await apiGetBatchesByDetail(detailId, customFilters || batchFilters);
      setBatches(data);
    } catch (err) {
      console.error(err);
      setBatches([]);
      setError('Không tải được danh sách lần vải về');
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectOrder(order) {
    setSelectedOrder(order);
    setSelectedItem(null);
    setSelectedDetail(null);
    setItems([]);
    setDetails([]);
    setBatches([]);
    setLevel('items');
    await loadItems(order.OrderID);
  }

  async function handleSelectItem(item) {
    setSelectedItem(item);
    setSelectedDetail(null);
    setDetails([]);
    setBatches([]);
    setLevel('details');
    await loadDetails(item.ItemID);
  }

  async function handleSelectDetail(detail) {
    setSelectedDetail(detail);
    setBatches([]);
    setLevel('batches');
    await loadBatches(detail.DetailID);
  }

  function handleBack() {
    setError('');

    if (level === 'batches') {
      setLevel('details');
      return;
    }

    if (level === 'details') {
      setLevel('items');
      return;
    }

    if (level === 'items') {
      setLevel('orders');
    }
  }

  function handleSearch() {
    if (level === 'orders') {
      loadOrders();
      return;
    }

    if (level === 'items' && selectedOrder?.OrderID) {
      loadItems(selectedOrder.OrderID);
      return;
    }

    if (level === 'details' && selectedItem?.ItemID) {
      loadDetails(selectedItem.ItemID);
      return;
    }

    if (level === 'batches' && selectedDetail?.DetailID) {
      loadBatches(selectedDetail.DetailID);
    }
  }

  function handleReset() {
    if (level === 'orders') {
      const reset = {
        range: { from: undefined, to: undefined },
        id: '',
        customerName: '',
      };
      setOrderFilters(reset);
      loadOrders(reset);
      return;
    }

    if (level === 'items') {
      const reset = {
        range: { from: undefined, to: undefined },
        id: '',
      };
      setItemFilters(reset);
      if (selectedOrder?.OrderID) loadItems(selectedOrder.OrderID, reset);
      return;
    }

    if (level === 'details') {
      const reset = {
        range: { from: undefined, to: undefined },
        id: '',
      };
      setDetailFilters(reset);
      if (selectedItem?.ItemID) loadDetails(selectedItem.ItemID, reset);
      return;
    }

    if (level === 'batches') {
      const reset = {
        range: { from: undefined, to: undefined },
        id: '',
      };
      setBatchFilters(reset);
      if (selectedDetail?.DetailID) loadBatches(selectedDetail.DetailID, reset);
    }
  }

  const pageTitle = useMemo(() => {
    if (level === 'orders') return 'Danh sách đơn hàng';
    if (level === 'items') return `Danh sách mã hàng - Đơn hàng ${selectedOrder?.OrderID ?? ''}`;
    if (level === 'details') return `Danh sách chi tiết - Mã hàng ${selectedItem?.ItemID ?? ''}`;
    return `Danh sách Lần vải về - Chi tiết ${selectedDetail?.DetailID ?? ''}`;
  }, [level, selectedOrder, selectedItem, selectedDetail]);

  const breadcrumb = useMemo(() => {
    const list = ['Đơn hàng'];
    if (selectedOrder) list.push(`Mã hàng (${selectedOrder.OrderID})`);
    if (selectedItem) list.push(`Chi tiết (${selectedItem.ItemID})`);
    if (selectedDetail) list.push(`Lần vải về (${selectedDetail.DetailID})`);
    return list.join(' > ');
  }, [selectedOrder, selectedItem, selectedDetail]);

  const currentFilters =
    level === 'orders'
      ? orderFilters
      : level === 'items'
      ? itemFilters
      : level === 'details'
      ? detailFilters
      : batchFilters;

  const setCurrentFilters =
    level === 'orders'
      ? setOrderFilters
      : level === 'items'
      ? setItemFilters
      : level === 'details'
      ? setDetailFilters
      : setBatchFilters;

  return (
    <div className="min-h-screen bg-slate-100 p-3 md:p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
          Dashboard Dòng chảy đơn hàng
        </h1>

        <div className="mt-3 inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 md:text-sm">
          {breadcrumb}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-semibold text-slate-900 md:text-xl">
            {pageTitle}
          </h2>

          {level !== 'orders' && (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              ← Quay lại
            </button>
          )}
        </div>

        <div
          className={`mb-4 grid gap-3 ${
            level === 'orders'
              ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
              : 'grid-cols-1 md:grid-cols-2'
          }`}
        >
          <DateRangeField
            label="Từ ngày - Đến ngày"
            range={currentFilters.range}
            onChange={(value) => setCurrentFilters((prev) => ({ ...prev, range: value }))}
          />

          <FilterField
            label={
              level === 'orders'
                ? 'Đơn hàng'
                : level === 'items'
                ? 'Mã hàng'
                : level === 'details'
                ? 'Chi tiết'
                : 'Lần vải về'
            }
            type="text"
            placeholder={
              level === 'orders'
                ? 'Nhập đơn hàng'
                : level === 'items'
                ? 'Nhập mã hàng'
                : level === 'details'
                ? 'Nhập chi tiết'
                : 'Nhập mã lần vải về'
            }
            value={currentFilters.id}
            onChange={(value) => setCurrentFilters((prev) => ({ ...prev, id: value }))}
          />

          {level === 'orders' && (
            <FilterField
              label="Khách hàng"
              type="text"
              placeholder="Nhập tên khách hàng"
              value={orderFilters.customerName}
              onChange={(value) =>
                setOrderFilters((prev) => ({ ...prev, customerName: value }))
              }
            />
          )}
        </div>

        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handleSearch}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Lọc dữ liệu
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            Tải lại
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-[100px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 text-center text-slate-500">
            Đang tải dữ liệu...
          </div>
        ) : error ? (
          <div className="flex min-h-[100px] items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 text-center text-red-700">
            {error}
          </div>
        ) : (
          <>
            {level === 'orders' && (
              <DataTable
                columns={[
                  { key: 'OrderID', title: 'Đơn hàng' },
                  { key: 'CustomerName', title: 'Khách hàng' },
                  {
                    key: 'Deadline',
                    title: 'Deadline',
                    render: (row) => formatDate(row.Deadline),
                  },
                  {
                    key: 'MStatus',
                    title: 'Tình trạng',
                    render: (row) => <StatusBadge value={row.MStatus} />,
                  },
                  {
                    key: 'CreatedAt',
                    title: 'Ngày tạo',
                    render: (row) => formatDateTime(row.CreatedAt),
                  },
                ]}
                rows={orders}
                rowKey="OrderID"
                emptyText="Không có đơn hàng"
                onRowClick={handleSelectOrder}
                mobileTitle={(row) => `Đơn hàng #${row.OrderID}`}
                mobileSubtitle={(row) => row.CustomerName || ''}
              />
            )}

            {level === 'items' && (
              <DataTable
                columns={[
                  { key: 'ItemID', title: 'Mã hàng' },
                  { key: 'OrderID', title: 'Đơn hàng' },
                  { key: 'ItemCode', title: 'Tên mã hàng' },
                  { key: 'Quantity', title: 'Số lượng' },
                  {
                    key: 'MStatus',
                    title: 'Tình trạng',
                    render: (row) => <StatusBadge value={row.MStatus} />,
                  },
                  {
                    key: 'CreatedAt',
                    title: 'Ngày tạo',
                    render: (row) => formatDateTime(row.CreatedAt),
                  },
                ]}
                rows={items}
                rowKey="ItemID"
                emptyText="Không có mã hàng"
                onRowClick={handleSelectItem}
                mobileTitle={(row) => row.ItemCode || `Item #${row.ItemID}`}
                mobileSubtitle={(row) => `OrderID: ${row.OrderID}`}
              />
            )}

            {level === 'details' && (
              <DataTable
                columns={[
                  { key: 'DetailID', title: 'Chi tiết' },
                  { key: 'ItemID', title: 'Mã hàng' },
                  { key: 'DetailCode', title: 'Tên chi tiết' },
                  { key: 'Quantity', title: 'Số lượng' },
                  {
                    key: 'MStatus',
                    title: 'Tình trạng',
                    render: (row) => <StatusBadge value={row.MStatus} />,
                  },
                  {
                    key: 'CreatedAt',
                    title: 'Ngày tạo',
                    render: (row) => formatDateTime(row.CreatedAt),
                  },
                ]}
                rows={details}
                rowKey="DetailID"
                emptyText="Không có chi tiết"
                onRowClick={handleSelectDetail}
                mobileTitle={(row) => row.DetailCode || `Detail #${row.DetailID}`}
                mobileSubtitle={(row) => `ItemID: ${row.ItemID}`}
              />
            )}

            {level === 'batches' && (
              <DataTable
                columns={[
                  { key: 'BatchID', title: 'Mã lần vải về' },
                  { key: 'OrderID', title: 'Đơn hàng' },
                  { key: 'DetailID', title: 'Chi tiết' },
                  {
                    key: 'ReceivedDate',
                    title: 'Ngày nhận',
                    render: (row) => formatDate(row.ReceivedDate),
                  },
                  { key: 'QuantityReceived', title: 'SL nhận' },
                  {
                    key: 'QualityCheckMStatus',
                    title: 'Tình trạng',
                    render: (row) => <StatusBadge value={row.QualityCheckMStatus} />,
                  },
                ]}
                rows={batches}
                rowKey="BatchID"
                emptyText="Không có lần vải về"
                mobileTitle={(row) => `Batch #${row.BatchID}`}
                mobileSubtitle={(row) => `DetailID: ${row.DetailID}`}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function DateRangeField({ label, range, onChange }) {
  const [openCalendar, setOpenCalendar] = useState(false);

  const rangeText = useMemo(() => {
    if (!range?.from && !range?.to) return 'Chọn khoảng ngày';
    if (range?.from && !range?.to) return `Từ ${format(range.from, 'dd/MM/yyyy')}`;
    return `${format(range.from, 'dd/MM/yyyy')} → ${format(range.to, 'dd/MM/yyyy')}`;
  }, [range]);

  return (
    <div className="relative">
      <div className="mb-1 text-[12px] font-medium text-slate-700">{label}</div>

      <button
        type="button"
        onClick={() => setOpenCalendar(true)}
        className={[
          'w-full rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-2.5 text-left',
          'text-[13px] text-slate-900 transition hover:bg-white/90',
          'focus:outline-none focus:ring-2 focus:ring-blue-200/70',
        ].join(' ')}
      >
        <div className="flex items-center justify-between gap-3">
          <span className={range?.from ? 'font-medium' : 'text-slate-500'}>{rangeText}</span>
          <span className="text-slate-500">📅</span>
        </div>
      </button>

      {openCalendar && (
        <div className="fixed inset-0 z-50" onClick={() => setOpenCalendar(false)} />
      )}

      {openCalendar && (
        <div
          className="absolute z-[60] mt-2 w-full min-w-[320px] rounded-2xl border border-slate-200/70 bg-white p-3 shadow-[0_18px_60px_rgba(15,23,42,0.18)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[12px] font-semibold text-slate-700">Chọn khoảng ngày</div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onChange({ from: undefined, to: undefined })}
                className="text-[12px] font-medium text-slate-600 transition hover:text-slate-900"
              >
                Xóa
              </button>

              <BtnDarkSmall onClick={() => setOpenCalendar(false)}>Đóng</BtnDarkSmall>
            </div>
          </div>

          <DayPicker
            mode="range"
            selected={range}
            onSelect={(r) => onChange(r || { from: undefined, to: undefined })}
            numberOfMonths={1}
            showOutsideDays
            className="rdp"
            locale={vi}
            weekStartsOn={1}
            formatters={{
              formatCaption: (date) => format(date, 'MMMM yyyy', { locale: vi }),
            }}
          />

          <style>{dayPickerCss}</style>
        </div>
      )}
    </div>
  );
}

function FilterField({ label, value, onChange, placeholder = '', type = 'text' }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function DataTable({
  columns,
  rows,
  rowKey,
  emptyText,
  onRowClick,
  mobileTitle,
  mobileSubtitle,
}) {
  if (!rows?.length) {
    return (
      <div className="flex min-h-[100px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 text-center text-slate-500">
        {emptyText}
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-slate-50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="whitespace-nowrap border-b border-slate-200 px-3 py-3 text-left text-sm font-bold text-slate-700"
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr
                key={row[rowKey]}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={onRowClick ? 'cursor-pointer hover:bg-sky-50' : ''}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="border-b border-slate-100 px-3 py-3 text-sm text-slate-900"
                  >
                    {col.render ? col.render(row) : safeValue(row[col.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 lg:hidden">
        {rows.map((row) => (
          <div
            key={row[rowKey]}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={`rounded-2xl border border-slate-200 bg-white p-4 ${
              onRowClick ? 'cursor-pointer hover:bg-sky-50' : ''
            }`}
          >
            <div className="text-base font-bold text-slate-900">
              {mobileTitle ? mobileTitle(row) : safeValue(row[rowKey])}
            </div>

            <div className="mt-1 text-sm text-slate-500">
              {mobileSubtitle ? mobileSubtitle(row) : ''}
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {columns.map((col) => (
                <div key={col.key} className="rounded-xl bg-slate-50 p-3">
                  <div className="mb-1 text-xs text-slate-500">{col.title}</div>
                  <div className="break-words text-sm font-semibold text-slate-900">
                    {col.render ? col.render(row) : safeValue(row[col.key])}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function StatusBadge({ value }) {
  return (
    <span className="inline-flex min-h-7 items-center justify-center rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-800">
      {safeValue(value)}
    </span>
  );
}

function BtnDarkSmall({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={[
        'rounded-xl bg-slate-900 px-3 py-2 text-[12px] font-semibold text-white transition hover:bg-slate-800',
        'active:scale-[0.98]',
        className,
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function cleanParams(obj = {}) {
  const result = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== '' && obj[key] !== null && obj[key] !== undefined) {
      result[key] = obj[key];
    }
  });
  return result;
}

function safeValue(value) {
  if (value === undefined || value === null || value === '') return '-';
  return String(value);
}

function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('vi-VN');
}

function formatDateTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('vi-VN');
}

function formatDateParam(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

const dayPickerCss = `
.rdp { --rdp-cell-size: 40px; margin: 0; }
.rdp-caption_label { font-weight: 600; color: #0f172a; text-transform: capitalize; }
.rdp-day { border-radius: 14px; font-weight: 600; }
.rdp-range_middle .rdp-day_button {
  background: rgba(37, 99, 235, 0.12);
  border-radius: 12px;
}
.rdp-range_start .rdp-day_button,
.rdp-range_end .rdp-day_button {
  background: linear-gradient(to bottom, #60a5fa, #2563eb);
  color: white;
  border-radius: 14px;
}
`;

export default Dashboard;