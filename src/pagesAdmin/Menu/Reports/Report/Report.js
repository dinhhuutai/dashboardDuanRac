import React, { useEffect, useMemo, useRef, useState, useDeferredValue } from 'react';
import { BASE_URL } from '~/config';
import { FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';
import http from '~/api/http';
import MODULEID from '~/contants/modules';
import { useFeatureAllowed } from '~/hooks/useFeatureGuard';
import HandleGetCodeQr from '~/components/HandleGetCodeQR';
import { useSelector } from 'react-redux';
import { userSelector } from '~/redux/selectors';
import DateRangeField from '~/components/DateRangeField';

/* ======================= UI helpers ======================= */
const cx = (...classes) => classes.filter(Boolean).join(' ');
const Card = ({ className = '', children }) => (
  <div className={cx('bg-white/80 backdrop-blur rounded-2xl border border-slate-200 shadow-sm', className)}>{children}</div>
);
const SectionTitle = ({ children }) => (
  <div className="rounded-2xl border border-emerald-200/40 bg-gradient-to-r from-emerald-50 to-cyan-50 p-4 md:p-5 shadow-sm">
    <h2 className="text-lg md:text-xl font-bold text-slate-800">{children}</h2>
  </div>
);
const SummaryPill = ({ label, value }) => (
  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm">
    <span className="text-slate-500">{label}</span>
    <span className="font-semibold text-slate-800">{value}</span>
  </div>
);

  const formatNow = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mi} ${dd}-${mm}-${yyyy}`;
  };


/* ======================= Constants ======================= */
// 8 nhóm chất thải × 7 ca = 56 cột, + 2 cột đầu (BP/Tổ, Chuyền) + 1 cột Tổng = 59 cột
const TRASH_CATEGORIES = [
  'Giẻ lau dính mực thường',
  'Giẻ lau dính mực lapa',
  'Băng keo',
  'Keo bàn thải',
  'Mực in thải',
  'Mực in lapa thải',
  'Vụn logo',
  'Lụa căng khung',
];
const SHIFTS = ['C1', 'C2', 'C3', 'D1', 'D2', 'HC', 'KoC'];

const URL_STATS = `${BASE_URL}/api/statistics/weight-by-bucket`; // cùng contract với trang theo ca làm

/* ======================= Helpers ======================= */
const round1 = (n) => Math.round(n * 10) / 10;
const fmt1 = (x) => (x === 0 ? '-' : (Math.round(x * 10) / 10).toFixed(1));

// Gửi API đúng ngày lịch local (DateRangeField)
const toISODate = (d) => {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
function vnDateParts(date) {
    const vnOffset = 7 * 60;
    const utc = date.getTime() + date.getTimezoneOffset() * 60000;
    const vnTime = new Date(utc + vnOffset * 60000);
    const dd = String(vnTime.getDate()).padStart(2, '0');
    const mm = String(vnTime.getMonth() + 1).padStart(2, '0');
    const yy = vnTime.getFullYear();
  return { dmy: `${dd}/${mm}/${yy}`, dmyDash: `${dd}-${mm}-${yy}`, iso: `${yy}-${mm}-${dd}` };
}

// n=64 (8 loại × 7 ca = 56) + (các ô khác + tổng); mình chỉ quan tâm 7-bước để gom cho chế độ nhiều ngày
function groupEach7TakeFirst(arr = []) {
  // Trả về mảng đã "lấy đầu nhóm 7" (ô tổng theo ca của từng loại)
  const out = [];
  for (let i = 0; i < arr.length; i += 7) out.push(arr[i] ?? 0);
  return out;
}

// Tổng hai mảng cùng độ dài (phòng null/undefined)
function sumArrays(...arrays) {
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

function sum7ShiftsPerCategory(arr = []) {
  // Lấy 56 ô đầu (8 loại x 7 ca), chia 8 nhóm, mỗi nhóm cộng 7 ô
  const base = arr.slice(0, 56);
  const out = [];
  for (let k = 0; k < TRASH_CATEGORIES.length; k++) {
    let s = 0;
    for (let j = 0; j < SHIFTS.length; j++) {
      s += Number(base[k * SHIFTS.length + j] || 0);
    }
    out.push(Math.round(s * 100) / 100);
  }
  return out; // trả về 8 giá trị – mỗi loại rác 1 tổng
}


/* ======================= Component ======================= */
export default function ReportTotalDynamic() {
  const EXPORT_EXCEL_REPORT = useFeatureAllowed(MODULEID.CANRAC, 'cr_xuatexceltrangbaocao');
  const ADD_DATA_REPORT = useFeatureAllowed(MODULEID.CANRAC, 'cr_themdulieuobangbaocao');

  const tmp = useSelector(userSelector);
  const [user, setUser] = useState({});
  useEffect(() => setUser(tmp?.login?.currentUser), [tmp]);

  const [loading, setLoading] = useState(true);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: new Date(),
  });

  const isOneDay = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return false;
    return toISODate(dateRange.from) === toISODate(dateRange.to);
  }, [dateRange]);

  // dữ liệu động từ API: [{bucketID,bucketName, units:[{unitID,unitName,value:number[64]}], orphan?, sum:number[64]}]
  const [raw, setRaw] = useState([]);
  const [grand, setGrand] = useState(Array(64).fill(0));

  // inline edit
  const [statusUpdate, setStatusUpdate] = useState(false);
  const [selectInput, setSelectInput] = useState({ group: '', item: '', index: '' });
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  /* ===== Fetch with debounce & abort ===== */
  useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) return;

    setLoading(true);
    const controller = new AbortController();
    const run = async () => {
      try {
        const params = {
          startDate: toISODate(dateRange.from),
          endDate: toISODate(dateRange.to),
        };
        const res = await http.get(URL_STATS, { params, signal: controller.signal });
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
  }, [dateRange]);

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
  /* ===== Chuẩn hóa dữ liệu để render nhanh ===== */
  // rowsOneDay: render chi tiết (BP/Tổ, Chuyền, 8 loại × 7 ca + Tổng)
  const rowsOneDay = useMemo(() => {
  const rows = [];
  for (const b of deferredRaw || []) {
    const unitRows = (b.units || []).map(u => ({
      bucketID: b.bucketID,
      bucketName: b.bucketName,
      type: 'unit',
      unitName: u.unitName,
      raw: u.value,
    }));
    const orphanRow = b.orphan
      ? [{
          bucketID: b.bucketID,
          bucketName: b.bucketName,
          type: 'orphan',
          unitName: '(QR cấp bộ phận)',
          raw: b.orphan.value,
        }]
      : [];

    let baseRows = [...unitRows, ...orphanRow];
    if (baseRows.length === 0) {
      baseRows = [{
        bucketID: b.bucketID,
        bucketName: b.bucketName,
        type: 'unit',
        unitName: '(Không chuyền)',
        raw: Array(64).fill(0),
      }];
    }
    const hasSum = baseRows.length >= 2; // ✅ chỉ thêm “Tổng” nếu có từ 2 dòng trở lên
    const list = hasSum
      ? [...baseRows, { bucketID: b.bucketID, bucketName: b.bucketName, type: 'sum', unitName: 'Tổng', raw: b.sum || Array(64).fill(0) }]
      : baseRows;

    rows.push({ bucketName: b.bucketName, span: list.length, rows: list });
  }
  return rows;
}, [deferredRaw]);


  // rowsRange: render nhiều ngày → gọn theo loại rác: mỗi bucket 1 dòng, lấy ô đầu mỗi nhóm 7 (C1..KoC → lấy ô tổng đầu nhóm)
  const rowsRange = useMemo(() => {
  return (deferredRaw || []).map(b => {
    const collapsed = sum7ShiftsPerCategory(b.sum || []); // ✅ mỗi loại 1 số tổng
    return { bucketID: b.bucketID, bucketName: b.bucketName, vals: collapsed };
  });
}, [deferredRaw]);

const grandRange = useMemo(() => sum7ShiftsPerCategory(grand || []), [grand]);


  /* ===== Inline save (giữ nguyên logic cũ, chỉ thay group/item theo động) ===== */
  const handleSave = async () => {
    if (!value || isNaN(parseFloat(value))) return;
    setLoading(true);
    try {
      const { trashBinCode, workShift } = await HandleGetCodeQr(selectInput);
      const nowUTC7 = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
      const payload = {
        trashBinCode,
        userID: user?.userID,
        weighingTime: nowUTC7.toISOString(),
        weightKg: parseFloat(value),
        updatedAt: nowUTC7.toISOString(),
        updatedBy: user?.userID,
        workShift,
        workDate: toISODate(dateRange.from),
        userName: user?.fullName,
      };
      const res = await http.post('/trash-weighings', payload);
      if (res?.ok || res?.data?.status === 'success') {
        // refresh
        const params = {
          startDate: toISODate(dateRange.from),
          endDate: toISODate(dateRange.to),
        };
        const fresh = await http.get(URL_STATS, { params });
        if (fresh.data?.status === 'success') {
          setRaw(fresh.data.data || []);
          setGrand(fresh.data.grandTotal || Array(64).fill(0));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setStatusUpdate(false);
      setSelectInput({ group: '', item: '', index: '' });
      setValue('');
    }
  };

  /* ===== Export Excel (2 kiểu) ===== */
  const exportOneDayExcel = async () => {
    const XLSX = await import('xlsx-js-style');
    // BẮT CHẮC saveAs tồn tại ở mọi bundler
  const fsaver = await import('file-saver');
  const saveAs = fsaver?.default ?? fsaver?.saveAs;
  if (typeof saveAs !== 'function') {
    throw new Error('file-saver: saveAs not available');
  }

    // Header hàng 1 (category merge)
    const headerRow1 = ['BP/Tổ', 'Chuyền', ...TRASH_CATEGORIES.flatMap(c => [c, '', '', '', '', '', '']), 'Tổng'];
    // Header hàng 2 (C1..KoC)
    const headerRow2 = ['', '', ...TRASH_CATEGORIES.flatMap(() => SHIFTS), ''];

    const rows = [];
    for (const group of rowsOneDay) {
      group.rows.forEach((r, i) => {
        const vs = (r.raw || []).map(e => (e === 0 ? '-' : round1(e).toFixed(1)));
        rows.push([i === 0 ? group.bucketName === 'Không Tổ' ? '' : group.bucketName : '', r.unitName, ...vs]);
      });
    }

{
  const vs = (grand || []).map(e => (e === 0 ? '-' : round1(e).toFixed(1)));
  rows.push(['', 'Tổng cộng', ...vs]); // 2 cột đầu + 59-2 cột số liệu
}

const title = [`BẢNG THEO DÕI RÁC THẢI CHI TIẾT NGÀY ${vnDateParts(dateRange.from).dmy} (xuất ${formatNow()})`];
const wsData = [title, headerRow1, headerRow2, ...rows];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Merges
    const merges = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 58 } }, // title
      // cố định 2 ô đầu
      { s: { r: 1, c: 0 }, e: { r: 2, c: 0 } },
      { s: { r: 1, c: 1 }, e: { r: 2, c: 1 } },
    ];
    // merge mỗi category 7 cột
    let base = 2;
    for (let k = 0; k < TRASH_CATEGORIES.length; k++) {
      merges.push({ s: { r: 1, c: base }, e: { r: 1, c: base + 6 } });
      base += 7;
    }
    // Tổng ở hàng 2 (đứng 1 cột)
    merges.push({ s: { r: 1, c: base }, e: { r: 2, c: base } });
    ws['!merges'] = merges;

    // Style
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
    for (let c = 0; c <= 58; c++) {
      const h1 = XLSX.utils.encode_cell({ r: 1, c });
      if (ws[h1]) ws[h1].s = { ...ws[h1].s, font: { bold: true }, fill: { fgColor: { rgb: 'E5E7EB' } } };
    }

    XLSX.utils.book_append_sheet(wb, ws, vnDateParts(dateRange.from).dmyDash);
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `BẢNG THEO DÕI RÁC THẢI CHI TIẾT ${vnDateParts(dateRange.from).dmy}.xlsx`);
  };

  const exportRangeExcel = async () => {
    const XLSX = await import('xlsx-js-style');
    // BẮT CHẮC saveAs tồn tại ở mọi bundler
  const fsaver = await import('file-saver');
  const saveAs = fsaver?.default ?? fsaver?.saveAs;
  if (typeof saveAs !== 'function') {
    throw new Error('file-saver: saveAs not available');
  }

    const headerRow1 = ['BP/Tổ', ...TRASH_CATEGORIES, 'Tổng'];
    const rows = rowsRange.map(r => {
      // r.vals: lấy đầu mỗi nhóm 7 cho từng loại → 8 giá trị + (sau cùng ta tính Tổng bằng grandRange)
      // Tổng theo từng bucket = sum các loại
      const total = r.vals.reduce((s, x) => s + (x || 0), 0);
      return [r.bucketName === 'Không Tổ' ? '' : r.bucketName, ...r.vals.map(v => (v === 0 ? '-' : round1(v).toFixed(1))), total === 0 ? '-' : round1(total).toFixed(1)];
    });

    // Grand total dòng cuối
    const grandTotal = grandRange.reduce((s, x) => s + (x || 0), 0);
    rows.push(['Tổng cộng', ...grandRange.map(v => (v === 0 ? '-' : round1(v).toFixed(1))), grandTotal === 0 ? '-' : round1(grandTotal).toFixed(1)]);

    const title = [`BẢNG THEO DÕI RÁC THẢI CHI TIẾT ${vnDateParts(dateRange.from).dmy} – ${vnDateParts(dateRange.to).dmy}  (xuất ${formatNow()})`];
    const wsData = [title, headerRow1, ...rows];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headerRow1.length - 1 } }];

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
    for (let c = 0; c < headerRow1.length; c++) {
      const h = XLSX.utils.encode_cell({ r: 1, c });
      if (ws[h]) ws[h].s = { ...ws[h].s, font: { bold: true }, fill: { fgColor: { rgb: 'E5E7EB' } } };
    }
    const titleCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
    ws[titleCell].s = { ...ws[titleCell].s, font: { bold: true, sz: 16 } };

    XLSX.utils.book_append_sheet(wb, ws, `${vnDateParts(dateRange.from).dmyDash} - ${vnDateParts(dateRange.to).dmyDash}`);
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `BẢNG THEO DÕI RÁC THẢI CHI TIẾT ${vnDateParts(dateRange.from).dmy} – ${vnDateParts(dateRange.to).dmy}.xlsx`);
  };

  /* ======================= Render ======================= */
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-2 md:p-4">
      <div className="space-y-4 md:space-y-6">
        <SectionTitle>📊 Báo cáo cân rác chi tiết</SectionTitle>

        <Card className="p-4 md:p-5">
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex items-center gap-2">
              {EXPORT_EXCEL_REPORT && (
                <button
                  onClick={isOneDay ? exportOneDayExcel : exportRangeExcel}
                  disabled={loading || !raw?.length}
                  className={cx(
                    'px-4 py-2 text-sm rounded-lg text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[.98] shadow-sm',
                    (loading || !raw?.length) && 'opacity-60 cursor-not-allowed'
                  )}
                >
                  📤 Xuất Excel
                </button>
              )}

            </div>

            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Khoảng ngày</label>
                <DateRangeField range={dateRange} onChange={setDateRange} />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <SummaryPill
              label="Khoảng thời gian"
              value={
                isOneDay
                  ? vnDateParts(dateRange.from).dmy
                  : `${vnDateParts(dateRange.from).dmy} – ${vnDateParts(dateRange.to).dmy}`
              }
            />
            <div className="text-xs text-slate-500">Nhấp đúp ô để chỉnh sửa nhanh (nếu được phân quyền)</div>
          </div>
        </Card>

        {/* Table */}
        <Card className="overflow-hidden">
          <div className="overflow-auto">
            <table className="min-w-full text-sm text-slate-700">
              <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-sm border-b border-slate-200">
                {isOneDay ? (
                  <>
                    <tr>
                      <th rowSpan={2} className="px-2 py-2 text-center font-semibold text-slate-700">BP/Tổ</th>
                      <th rowSpan={2} className="px-2 py-2 text-center font-semibold text-slate-700">Chuyền</th>
                      {TRASH_CATEGORIES.map((h, i) => (
                        <th key={i} colSpan={7} className="px-2 py-2 text-center font-semibold text-slate-700">{h}</th>
                      ))}
                      <th rowSpan={2} className="px-2 py-2 text-center font-semibold text-slate-700">Tổng</th>
                    </tr>
                    <tr className="border-t border-slate-200">
                      {TRASH_CATEGORIES.flatMap(() => SHIFTS).map((s, i) => (
                        <th key={i} className="px-2 py-2 text-center text-slate-600">{s}</th>
                      ))}
                    </tr>
                  </>
                ) : (
                  <tr>
                    <th className="px-2 py-2 text-center font-semibold text-slate-700">BP/Tổ</th>
                    {TRASH_CATEGORIES.map((h, i) => (
                      <th key={i} className="px-2 py-2 text-center font-semibold text-slate-700">{h}</th>
                    ))}
                    <th className="px-2 py-2 text-center font-semibold text-slate-700">Tổng</th>
                  </tr>
                )}
              </thead>

              <tbody className="divide-y divide-slate-100">
                {isOneDay ? (
                  // One day: chi tiết theo chuyền
                  rowsOneDay.map((group, gIdx) =>
                    group.rows.map((r, idx) => (
                      <tr key={`${gIdx}-${idx}`} className={cx(r.type === 'sum' ? 'bg-amber-50' : 'hover:bg-slate-50 odd:bg-white even:bg-slate-50/60', 'transition')}>
                        {idx === 0 && (
                          <td rowSpan={group.span} className="px-2 py-2 text-center font-medium text-slate-800 border-r border-slate-100">
                            {group.bucketName === 'Không Tổ' ? '' : group.bucketName}
                          </td>
                        )}
                        <td className="px-2 py-2 text-center">{r.unitName}</td>
                        {(r.raw || []).map((e, i) => (
                          <td
                            key={i}
                            className={cx('px-2 py-1 text-center', 'text-slate-700', (i === (TRASH_CATEGORIES.length * SHIFTS.length)) && 'font-semibold text-slate-900')}
                            onDoubleClick={() => {
  if (!ADD_DATA_REPORT || !isOneDay || r.type === 'sum') return;
  setStatusUpdate(true);
  setSelectInput({ group: group.bucketName, item: r.unitName, index: i });
  const num = Number(e || 0);
  setValue(Number.isFinite(num) ? num : 0); // ✅ tránh “-” đẩy vào input
  setTimeout(() => inputRef.current?.focus(), 0);
}}
                          >
                            {fmt1(e || 0)}
                          </td>
                        ))}
                      </tr>
                    ))
                  )
                ) : (
                  // Range: gọn theo loại rác
                  rowsRange.map((r, idx) => {
                    const total = r.vals.reduce((s, x) => s + (x || 0), 0);
                    return (
                      <tr key={idx} className="hover:bg-slate-50 odd:bg-white even:bg-slate-50/60 transition">
                        <td className="px-2 py-2 text-center font-medium text-slate-800 border-r border-slate-100">{r.bucketName === 'Không Tổ' ? '' : r.bucketName}</td>
                        {r.vals.map((v, i) => (
                          <td key={i} className="px-2 py-2 text-center">{fmt1(v || 0)}</td>
                        ))}
                        <td className="px-2 py-2 text-center font-semibold">{fmt1(total)}</td>
                      </tr>
                    );
                  })
                )}

                {/* Grand total */}
                <tr className="bg-emerald-50 border-t border-emerald-200 sticky bottom-0">
                  <td className="px-2 py-2 text-center font-bold text-emerald-800" colSpan={isOneDay ? 2 : 1}>Tổng cộng</td>
                  {(
                    isOneDay
                      ? (grand || [])
                      : [...grandRange, grandRange.reduce((s, x) => s + (x || 0), 0)]
                  ).map((e, i) => (
                    <td key={i} className="px-2 py-2 text-center font-bold text-emerald-900">
                      {fmt1(e || 0)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Inline edit controls (ẩn/hiện khi đang edit) */}
      {statusUpdate && (
        <div className="fixed bottom-4 left-0 right-0 mx-auto w-fit bg-white/90 backdrop-blur rounded-xl shadow-lg border border-slate-200 p-3 flex items-center gap-2">
          <input
            ref={inputRef}
            className="w-28 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            type="number"
            step="0.1"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <button className="text-emerald-700 hover:text-emerald-800" onClick={handleSave} title="Lưu">
            <FaCheck className="h-5 w-5" />
          </button>
          <button
            className="text-rose-600 hover:text-rose-700"
            onClick={() => { setStatusUpdate(false); setSelectInput({ group: '', item: '', index: '' }); setValue(''); }}
            title="Hủy"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Global loading */}
      {showLoadingOverlay && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-white/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <FaSpinner className="animate-spin text-emerald-600 text-4xl" />
            <span className="text-slate-700 text-sm">Đang tải dữ liệu...</span>
          </div>
        </div>
      )}
    </div>
  );
}

