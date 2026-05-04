import 'react-datepicker/dist/react-datepicker.css';
import React, { useEffect, useMemo, useRef, useState, useDeferredValue } from 'react';
// ⚡ import động khi bấm Export
import DatePicker from 'react-datepicker';
import { vi } from 'date-fns/locale';
import { BASE_URL } from '~/config';
import { FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';
import http from '~/api/http';
import { useFeatureAllowed } from '~/hooks/useFeatureGuard';
import MODULEID from '~/contants/modules';

  const formatNow = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mi} ${dd}-${mm}-${yyyy}`;
  };


// ---------- UI helpers ----------
const cx = (...cls) => cls.filter(Boolean).join(' ');
const Card = ({ className = '', children }) => (
  <div className={cx('bg-white/80 backdrop-blur rounded-2xl border border-slate-200 shadow-sm', className)}>
    {children}
  </div>
);
const SectionTitle = ({ children }) => (
  <div className="rounded-2xl border border-emerald-200/40 bg-gradient-to-r from-emerald-50 to-cyan-50 p-4 md:p-5 shadow-sm">
    <h2 className="text-lg md:text-xl font-bold text-slate-800">{children}</h2>
  </div>
);

// ====== Helpers chung ======
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const toVNDate = (d) => new Date(d.getTime() - d.getTimezoneOffset()*60000 + VN_OFFSET_MS);
const toISODate = (d) => toVNDate(d).toISOString().slice(0,10);
const fmtDmy = (date) => {
    const vnOffset = 7 * 60;
    const utc = date.getTime() + date.getTimezoneOffset() * 60000;
    const vnTime = new Date(utc + vnOffset * 60000);
    const day = String(vnTime.getDate()).padStart(2, '0');
    const month = String(vnTime.getMonth() + 1).padStart(2, '0');
    const year = vnTime.getFullYear();
    return `${day}/${month}/${year}`;
};
const fmtDmyDash = (d) => fmtDmy(d).replaceAll('/','-');
const round1 = (n) => Math.round((n ?? 0) * 10) / 10;
const fmt1 = (x) => x === 0 ? '-' : round1(x);

// ép mảng về đúng 64 phần tử (9×7 + 1 tổng) để tránh lệch
const toLen64 = (arr = []) => {
  const out = Array(64).fill(0);
  for (let i = 0; i < Math.min(64, arr.length); i++) out[i] = arr[i] || 0;
  return out;
};

// ✅ Gộp THEO LOẠI RÁC: mỗi block 7 phần tử là 1 loại; phần tử cuối là Tổng
const sumByType = (arr = []) => {
  const a = toLen64(arr);
  const numTypes = Math.floor((a.length - 1) / 7); // an toàn với 64
  const out = [];
  for (let t = 0; t < numTypes; t++) {
    let s = 0;
    const base = t * 7;
    for (let k = 0; k < 7; k++) s += a[base + k] || 0;
    out.push(Math.round(s * 100) / 100);
  }
  out.push(a[a.length - 1] || 0); // Tổng
  return out;
};

// So sánh tiếng Việt an toàn dấu
const vniEq = (a = '', b = '') =>
  a.normalize('NFC').toLowerCase().trim() === b.normalize('NFC').toLowerCase().trim();

// ====== Nhãn cột loại rác (theo thứ tự server encode) ======
// Giả định server encode 8–9 loại theo block 7 cột; chỉnh danh sách khớp thực tế của bạn.
// Ở đây theo code cũ của bạn: 8 loại + Tổng.
const TYPE_LABELS = [
  'Giẻ lau dính mực thường',
  'Giẻ lau dính mực lapa',
  'Băng keo',
  'Keo bàn thải',
  'Mực in thải',
  'Mực in lapa thải',
  'Vụn logo',
  'Lụa căng khung',
];

// Khi bật “Rác đi xử lý” → loại bỏ 2 mục: Băng keo, Lụa căng khung (giữ Tổng)
const RXL_EXCLUDE = new Set(['Băng keo', 'Lụa căng khung']);

// =========================================
export default function ReportTrash() {
  const EXPORT_EXCEL_REPORT = useFeatureAllowed(MODULEID.CANRAC, 'cr_xuatexceltrangbaocao');

  const [loading, setLoading] = useState(true);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [raw, setRaw] = useState([]);        // [{bucketID,bucketName,units:[{unitID,unitName,value}], orphan?, sum:[]} ]
  const [grand, setGrand] = useState(Array(64).fill(0));

  const [filterType, setFilterType] = useState('one'); // 'one' | 'range'
  const [dateOne, setDateOne] = useState(new Date());
  const [startDate, setStartDate] = useState(() => { const d = new Date(); d.setDate(d.getDate()-1); return d; });
  const [endDate, setEndDate] = useState(new Date());

  const [selectedBucketId, setSelectedBucketId] = useState('');
  const [isRacDiXuLy, setIsRacDiXuLy] = useState(false);

  // ==== Fetch (debounce + abort) ====
  useEffect(() => {
    setLoading(true);
    const controller = new AbortController();
    const run = async () => {
      try {
        const params = {
          startDate: filterType === 'one' ? toISODate(dateOne) : toISODate(startDate),
          endDate:   filterType === 'one' ? toISODate(dateOne) : toISODate(endDate),
          bucketName: selectedBucketId || '',
        };
        const res = await http.get(`${BASE_URL}/api/statistics/weight-by-bucket`, {
          params, signal: controller.signal,
        });
        if (res.data?.status === 'success') {
          setRaw(res.data.data || []);
          setGrand(res.data.grandTotal || Array(64).fill(0));
        } else {
          setRaw([]); setGrand(Array(64).fill(0));
        }
      } catch (e) {
        if (e.name !== 'CanceledError' && e.message !== 'canceled') console.error('fetch error', e);
        setRaw([]); setGrand(Array(64).fill(0));
      } finally {
        setLoading(false);
      }
    };
    run();
    return () => { controller.abort(); };
  }, [filterType, dateOne, startDate, endDate, selectedBucketId]);

  useEffect(() => {
    let timer;
    if (loading) {
      timer = setTimeout(() => setShowLoadingOverlay(true), 250);
    } else {
      setShowLoadingOverlay(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [loading]);

  const deferredRaw = useDeferredValue(raw);

  // ==== Chuẩn hoá buckets + gộp theo LOẠI ====
  const processedBuckets = useMemo(() => {
    return (deferredRaw || []).map((bucket) => {
      const units = bucket.units || [];
      let rows;
      if (units.length === 0) {
        rows = [{ name: '', type: 'single', raw: bucket.sum }];
      } else if (units.length === 1) {
        const u = units[0];
        const v = bucket.orphan ? sumArrays([u.value, bucket.orphan.value]) : u.value;
        rows = [{ name: u.unitName, type: 'single', raw: v }];
      } else {
        rows = [
          ...units.map((u) => ({ name: u.unitName, type: 'unit', raw: u.value })),
          ...(bucket.orphan ? [{ name: '(QR cấp bộ phận)', type: 'orphan', raw: bucket.orphan.value }] : []),
          { name: 'Tổng', type: 'sum', raw: bucket.sum },
        ];
      }
      const rowsCollapsed = rows.map((r) => ({ ...r, val: sumByType(r.raw || []) }));
      return { ...bucket, rows: rowsCollapsed };
    });
  }, [deferredRaw]);

  // helper sumArrays (theo chiều từng index)
  function sumArrays(arrays = []) {
    if (!arrays.length) return [];
    const len = arrays[0]?.length || 0;
    const out = Array(len).fill(0);
    for (let i = 0; i < len; i++) {
      let s = 0;
      for (const a of arrays) s += a?.[i] || 0;
      out[i] = Math.round(s * 100) / 100;
    }
    return out;
  }

  // Lọc bucket
  const buckets = useMemo(() => {
    if (!selectedBucketId) return processedBuckets;
    return processedBuckets.filter((b) => String(b.bucketID) === String(selectedBucketId));
  }, [processedBuckets, selectedBucketId]);

  // Auto reset nếu bucket đã chọn không còn trong data mới
  useEffect(() => {
    if (selectedBucketId && !processedBuckets.some(b => String(b.bucketID) === String(selectedBucketId))) {
      setSelectedBucketId('');
    }
  }, [processedBuckets, selectedBucketId]);

  // Grand theo loại
  const grandCollapsed = useMemo(() => sumByType(grand), [grand]);

  // ====== Header cột theo toggle “Rác đi xử lý” ======
  const visibleTypeLabels = useMemo(() => {
    if (!isRacDiXuLy) return TYPE_LABELS;
    return TYPE_LABELS.filter(l => !RXL_EXCLUDE.has(l));
  }, [isRacDiXuLy]);

  // Chuyển `row.val` (mảng [types..., Tổng]) → chỉ chọn index phù hợp với visibleTypeLabels
  // Thay toàn bộ hàm pickVisibleCols cũ bằng:
const pickVisibleCols = (vals = []) => {
  // vals = [type1, type2, ..., typeN, originalTotal]
  const typeCount = TYPE_LABELS.length;
  const typeVals = vals.slice(0, typeCount);       // chỉ phần loại
  const chosenIdx = TYPE_LABELS
    .map((_, i) => i)
    .filter(i => !isRacDiXuLy || !RXL_EXCLUDE.has(TYPE_LABELS[i]));

  const visibleVals = chosenIdx.map(i => typeVals[i] ?? 0);
  const newTotal = Math.round(visibleVals.reduce((s, x) => s + (x || 0), 0) * 100) / 100;

  // Trả về mảng các cột hiển thị + Tổng mới (không dùng originalTotal nữa)
  return [...visibleVals, newTotal];
};


  // ==== Export Excel (import động) ====
  const exportToExcel = async () => {
    const XLSX = await import('xlsx-js-style');
    // BẮT CHẮC saveAs tồn tại ở mọi bundler
  const fsaver = await import('file-saver');
  const saveAs = fsaver?.default ?? fsaver?.saveAs;
  if (typeof saveAs !== 'function') {
    throw new Error('file-saver: saveAs not available');
  }

    const wb = XLSX.utils.book_new();
    const selectedBucketName =
      processedBuckets.find(b => String(b.bucketID) === String(selectedBucketId))?.bucketName || '';

      console.log(startDate, fmtDmy(startDate))
    const title = [
      `BẢNG THEO DÕI RÁC THẢI ${selectedBucketName ? selectedBucketName : ''} THEO LOẠI RÁC NGÀY ${
        filterType === 'one' ? fmtDmy(dateOne) : `${fmtDmy(startDate)} - ${fmtDmy(endDate)}`
      }  (xuất ${formatNow()})`,
    ];

    const headers = ['BP/Tổ','Chuyền', ...visibleTypeLabels, 'Tổng'];
    const wsData = [title, headers];

    const merges = [];
    let rowPtr = 2;

    buckets.forEach((bucket) => {
      const list = bucket.rows;
      if (list.length) merges.push({ s: { r: rowPtr, c: 0 }, e: { r: rowPtr + list.length - 1, c: 0 } });
      list.forEach((row, i) => {
        const v = pickVisibleCols(row.val).map((e) => (e === 0 ? '-' : round1(e).toFixed(1)));
        wsData.push([i === 0 ? (vniEq(bucket.bucketName, 'Không Tổ') ? '' : bucket.bucketName) : '', row.name, ...v]);
        rowPtr++;
      });
    });

    if (!selectedBucketId) {
      const v = pickVisibleCols(grandCollapsed).map((e) => (e === 0 ? '-' : round1(e).toFixed(1)));
      wsData.push(['Tổng cộng', '', ...v]);
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    // merge tiêu đề
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }, ...merges];

    // style + width cột
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[addr]) continue;
        ws[addr].s = {
          border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } },
          alignment: { vertical: 'center', horizontal: 'center', wrapText: true },
        };
      }
    }
    const titleCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
    ws[titleCell].s = { ...ws[titleCell].s, font: { bold: true, sz: 16 } };
    for (let c = 0; c < headers.length; c++) {
      const addr = XLSX.utils.encode_cell({ r: 1, c });
      if (ws[addr]) ws[addr].s = { ...ws[addr].s, font: { bold: true }, fill: { fgColor: { rgb: 'e5e7eb' } } };
    }
    ws['!cols'] = [
      { wch: 18 }, // BP/Tổ
      { wch: 20 }, // Chuyền
      ...Array(headers.length - 2).fill({ wch: 16 }),
    ];

    XLSX.utils.book_append_sheet(
      wb,
      ws,
      `${filterType === 'one' ? fmtDmyDash(dateOne) : `${fmtDmyDash(startDate)} - ${fmtDmyDash(endDate)}`}`,
    );
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const fileName =
      `BÁO CÁO THEO LOẠI RÁC ${selectedBucketName ? selectedBucketName + ' ' : ''}` +
      `${filterType === 'one' ? fmtDmy(dateOne) : `${fmtDmy(startDate)} - ${fmtDmy(endDate)}`}.xlsx`;
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), fileName);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 p-2 md:p-4">
      {showLoadingOverlay && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-white/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <FaSpinner className="animate-spin text-emerald-600 text-4xl" />
            <span className="text-slate-700 text-sm">Đang tải dữ liệu...</span>
          </div>
        </div>
      )}

      <div className="space-y-4 md:space-y-6">
        <SectionTitle>🗑️ Báo cáo theo loại rác</SectionTitle>

        {/* Toolbar */}
        <Card className="p-4 md:p-5">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex items-center gap-2">
              {EXPORT_EXCEL_REPORT && (
                <button
                  onClick={exportToExcel}
                  className={cx(
                    'px-4 py-2 text-sm rounded-lg text-white shadow-sm active:scale-[.98]',
                    'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
                  )}
                >
                  📤 Xuất Excel
                </button>
              )}

              {/* Segment 1 ngày / nhiều ngày */}
              <div className="inline-flex overflow-hidden rounded-lg border border-slate-300">
                <label className={cx('px-3 py-2 text-sm cursor-pointer', filterType === 'one' && 'bg-slate-100 font-medium')}>
                  <input type="radio" value="one" checked={filterType === 'one'} onChange={() => setFilterType('one')} className="mr-2 accent-emerald-600" />
                  1 ngày
                </label>
                <label className={cx('px-3 py-2 text-sm cursor-pointer', filterType === 'range' && 'bg-slate-100 font-medium')}>
                  <input type="radio" value="range" checked={filterType === 'range'} onChange={() => setFilterType('range')} className="mr-2 accent-emerald-600" />
                  Nhiều ngày
                </label>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[220px]">
                <label className="block text-xs text-slate-500 mb-1">Chọn tổ</label>
                <select
                  value={selectedBucketId}
                  onChange={(e) => setSelectedBucketId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Tất cả --</option>
                  {processedBuckets.map((b) => (
                    <option key={b.bucketID} value={b.bucketID}>{b.bucketName}</option>
                  ))}
                </select>
              </div>

              {/* Switch: Rác đi xử lý */}
              <label className="inline-flex items-center gap-3 cursor-pointer select-none mt-1">
                <input
                  type="checkbox"
                  checked={isRacDiXuLy}
                  onChange={(e) => setIsRacDiXuLy(e.target.checked)}
                  className="peer sr-only"
                />
                <span
                  className="
                    relative h-6 w-11 rounded-full bg-slate-300 transition-colors
                    peer-checked:bg-emerald-600
                    after:absolute after:content-[''] after:top-0.5 after:left-0.5
                    after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm
                    after:transition-transform peer-checked:after:translate-x-5
                  "
                />
                <span className="text-sm text-slate-700">Rác đi xử lý</span>
              </label>

              {filterType === 'one' ? (
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Chọn ngày</label>
                  <DatePicker
                    selected={dateOne}
                    onChange={(d) => setDateOne(d)}
                    dateFormat="dd/MM/yyyy"
                    className="w-[140px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    locale={vi}
                    popperPlacement="bottom-start"
                    popperClassName="!z-[9999]"
                    portalId="react-datepicker-portal"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Từ ngày</label>
                    <DatePicker
                      selected={startDate}
                      onChange={(d) => setStartDate(d)}
                      selectsStart startDate={startDate} endDate={endDate}
                      dateFormat="dd/MM/yyyy"
                      className="w-[140px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      locale={vi}
                      popperPlacement="bottom-start"
                      popperClassName="!z-[9999]"
                      portalId="react-datepicker-portal"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Đến ngày</label>
                    <DatePicker
                      selected={endDate}
                      onChange={(d) => setEndDate(d)}
                      selectsEnd startDate={startDate} endDate={endDate} minDate={startDate}
                      dateFormat="dd/MM/yyyy"
                      className="w-[140px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      locale={vi}
                      popperPlacement="bottom-start"
                      popperClassName="!z-[9999]"
                      portalId="react-datepicker-portal"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Table */}
        <Card className="overflow-hidden">
          <div className="overflow-auto">
            <table className="min-w-full text-sm text-slate-700">
              <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-sm border-b border-slate-200">
                <tr>
                  <th className="px-2 md:px-3 py-2 text-center font-semibold text-slate-700">BP/Tổ</th>
                  <th className="px-2 md:px-3 py-2 text-center font-semibold text-slate-700">Chuyền</th>
                  {visibleTypeLabels.map((h, i) => (
                    <th key={i} className="px-2 md:px-3 py-2 text-center font-semibold text-slate-700">{h}</th>
                  ))}
                  <th className="px-2 md:px-3 py-2 text-center font-semibold text-slate-700">Tổng</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {buckets.length === 0 && !loading && (
                  <tr>
                    <td colSpan={2 + visibleTypeLabels.length + 1} className="py-6 text-center text-slate-500">
                      Không có dữ liệu trong khoảng ngày đã chọn.
                    </td>
                  </tr>
                )}

                {buckets.map((bucket) =>
                  bucket.rows.map((row, idx) => (
                    <tr key={`${bucket.bucketID}-${idx}`} className={cx(row.type === 'sum' ? 'bg-amber-50' : 'hover:bg-slate-50 odd:bg-white even:bg-slate-50/60', 'transition')}>
                      {idx === 0 && (
                        <td
                          rowSpan={bucket.rows.length}
                          className="px-2 md:px-3 py-2 text-center font-medium text-slate-800 border-r border-slate-100 sticky left-0 bg-white"
                        >
                          {vniEq(bucket.bucketName, 'Không Tổ') ? '' : bucket.bucketName}
                        </td>
                      )}
                      <td className="px-2 md:px-3 py-2 text-center sticky left-[140px]">{row.name}</td>

                      {pickVisibleCols(row.val).map((e, i) => (
                        <td key={i} className={cx('px-2 md:px-3 py-2 text-center', i === visibleTypeLabels.length ? 'font-semibold text-slate-900' : 'text-slate-700')}>
                          {fmt1(e)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}

                {!selectedBucketId && (
                  <tr className="bg-emerald-50 border-t border-emerald-200">
                    <td className="px-2 md:px-3 py-2 text-center font-bold text-emerald-800" colSpan={2}>Tổng cộng</td>
                    {pickVisibleCols(grandCollapsed).map((e, i) => (
                      <td key={i} className="px-2 md:px-3 py-2 text-center font-bold text-emerald-900">
                        {fmt1(e)}
                      </td>
                    ))}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
