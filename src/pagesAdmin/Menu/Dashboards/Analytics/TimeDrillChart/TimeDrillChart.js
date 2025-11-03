// src/components/TimeDrillChart.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { BsChevronLeft, BsChevronRight, BsArrowUp } from 'react-icons/bs';
import axios from 'axios';
import { BASE_URL } from '~/config';

/* =========================
   Constants
   ========================= */
const ALL = '__ALL__';
const DEPARTMENTS = ['C1','C2','C3','C4','Mẫu','Chụp khuôn','Kcs','Sửa hàng','Pha màu'];
const TRASH_TYPES = [
  'Giẻ lau dính mực thường',
  'Giẻ lau dính mực lapa',
  'Băng keo',
  'Keo bàn thải',
  'Mực in thải',
  'Mực in lapa thải',
  'Vụn logo',
  'Lụa căng khung',
];
const PAL = ['#22c55e','#06b6d4','#8b5cf6','#f59e0b','#ef4444','#3b82f6','#14b8a6','#eab308'];

/* =========================
   Tooltip
   ========================= */
function Tip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm text-[12px]">
      <div className="font-medium text-slate-700 mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded" style={{ background: p.color || '#64748b' }} />
          <span className="text-slate-600">{p.name}:</span>
          <span className="font-medium text-slate-800">
            {Number(p.value).toLocaleString('vi-VN')} kg
          </span>
        </div>
      ))}
    </div>
  );
}

/* =========================
   API helpers
   ========================= */
async function fetchTimeSeries({ granularity, weekOffset=0, monthOffset=0, yearOffset=0, department='__ALL__', trashType='__ALL__' }) {
  const res = await axios.get(`${BASE_URL}/api/trash/time-series`, {
    params: { granularity, weekOffset, monthOffset, yearOffset, department, trashType }
  });
  return res.data; // { title, data:[{key,label,weight,trend}] }
}

async function fetchTimeSeriesCompare({ granularity, weekOffset=0, monthOffset=0, yearOffset=0, departments=[], trashType='__ALL__' }) {
  const res = await axios.get(`${BASE_URL}/api/trash/time-series-compare`, {
    params: { granularity, weekOffset, monthOffset, yearOffset, departments: departments.join(','), trashType }
  });
  return res.data; // { title, data:[{key,label, dep1, dep2,...}] }
}

async function fetchDrill({ granularity, periodKey, department, trashType='__ALL__' }) {
  const res = await axios.get(`${BASE_URL}/api/trash/drill`, {
    params: { granularity, periodKey, department, trashType }
  });
  return res.data; // { rows:[{name, unitName, weight}] }
}

/* =========================
   Component chính
   ========================= */
export default function TimeDrillChart() {
  // bộ lọc
  const [granularity, setGranularity] = useState('day'); // day | week | month
  const [department, setDepartment] = useState(ALL);
  const [trashType, setTrashType] = useState(ALL);

  // cửa sổ thời gian
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [yearOffset, setYearOffset] = useState(0);

  // drilldown
  const [drill, setDrill] = useState(null); // { department, periodKey, title, rows }

  // compare mode
  const [compareMode, setCompareMode] = useState(false);
  const [selectedDepts, setSelectedDepts] = useState(['C1','C2']); // tối đa 5 cho rõ

  // dữ liệu
  const [series, setSeries] = useState({ title: '', data: [] });
  const [seriesCompare, setSeriesCompare] = useState({ title: '', data: [] });
  const [loading, setLoading] = useState(false);

  const BAR_COLOR = '#8b5cf6';
  const LINE_COLOR = '#06b6d4';

  /* Điều hướng trái/phải */
  const goLeft = () => {
    if (granularity === 'day') setWeekOffset(v => v-1);
    else if (granularity === 'week') setMonthOffset(v => v-1);
    else setYearOffset(v => v-1);
  };
  const goRight = () => {
    if (granularity === 'day') setWeekOffset(v => v+1);
    else if (granularity === 'week') setMonthOffset(v => v+1);
    else setYearOffset(v => v+1);
  };

  /* Swipe gesture (mobile) */
  const touchX = useRef(null);
  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) { if (dx < 0) goRight(); else goLeft(); }
    touchX.current = null;
  };

  /* Fetch series (đơn) */
  useEffect(() => {
    let alive = true;
    if (compareMode) return; // đang compare thì không gọi đơn
    setLoading(true);
    fetchTimeSeries({ granularity, weekOffset, monthOffset, yearOffset, department, trashType })
      .then((out) => { if (alive) setSeries(out || { title:'', data:[] }); })
      .catch((err) => { console.error('time-series error:', err?.message); if (alive) setSeries({ title:'', data:[] }); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [compareMode, granularity, weekOffset, monthOffset, yearOffset, department, trashType]);

  /* Fetch series (compare) */
  useEffect(() => {
    let alive = true;
    if (!compareMode) return;
    setLoading(true);
    fetchTimeSeriesCompare({ granularity, weekOffset, monthOffset, yearOffset, departments: selectedDepts, trashType })
      .then((out) => { if (alive) setSeriesCompare(out || { title:'', data:[] }); })
      .catch((err) => { console.error('time-series-compare error:', err?.message); if (alive) setSeriesCompare({ title:'', data:[] }); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [compareMode, selectedDepts, granularity, weekOffset, monthOffset, yearOffset, trashType]);

  /* Click cột → drill (tắt khi compare) */
  const onBarClick = async (evt) => {
    if (compareMode) return; // không drill khi đang so sánh
    const periodKey = evt?.activePayload?.[0]?.payload?.key;
    if (!periodKey) return;

    // Nếu đang chọn "Tất cả bộ phận", dùng mặc định C1 để drill (hoặc bạn đổi thành bắt user chọn cụ thể)
    const dept = department === ALL ? 'C1' : department;

    try {
      setLoading(true);
      const r = await fetchDrill({ granularity, periodKey, department: dept, trashType });
      setDrill({ department: dept, periodKey, title: `Thùng trong ${dept}`, rows: r?.rows || [] });
    } catch (e) {
      console.error('drill error:', e?.message);
      setDrill({ department: dept, periodKey, title: `Thùng trong ${dept}`, rows: [] });
    } finally {
      setLoading(false);
    }
  };

  const backFromDrill = () => setDrill(null);

  /* Options */
  const deptOptions = useMemo(
    () => [{ value: ALL, label: '— Tất cả bộ phận —' }, ...DEPARTMENTS.map(d=>({value:d,label:d}))],
    []
  );
  const typeOptions = useMemo(
    () => [{ value: ALL, label: '— Tất cả loại rác —' }, ...TRASH_TYPES.map(t=>({value:t,label:t}))],
    []
  );

  const title = compareMode ? seriesCompare.title : series.title;
  const data = compareMode ? seriesCompare.data : series.data;

  return (
    <div
      className="bg-white/80 backdrop-blur rounded-2xl border border-slate-200 shadow-sm"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Toolbar */}
      <div className="p-4 md:p-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-2">
          <button onClick={goLeft} className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50">
            <BsChevronLeft />
          </button>
          <div className="px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
            {title || 'Đang tải...'}
          </div>
          <button onClick={goRight} className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50">
            <BsChevronRight />
          </button>
        </div>

        <div className="flex flex-wrap gap-3 items-end">
          {/* Granularity */}
          <div className="inline-flex overflow-hidden rounded-lg border border-slate-300">
            {['day','week','month'].map((g) => (
              <label key={g} className={`px-3 py-2 text-sm cursor-pointer ${granularity===g ? 'bg-slate-100 font-medium' : ''}`}>
                <input
                  type="radio"
                  value={g}
                  checked={granularity===g}
                  onChange={() => { setGranularity(g); setDrill(null); }}
                  className="mr-2 accent-emerald-600"
                />
                {g==='day' ? 'Ngày' : g==='week' ? 'Tuần' : 'Tháng'}
              </label>
            ))}
          </div>

          {/* Toggle so sánh */}
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={compareMode}
              onChange={(e)=>{ setCompareMode(e.target.checked); setDrill(null); }}
              className="accent-emerald-600"
            />
            <span className="text-sm text-slate-700">So sánh bộ phận</span>
          </label>

          {/* Bộ phận (đơn) */}
          {!compareMode && (
            <select
              value={department}
              onChange={(e)=>{ setDepartment(e.target.value); setDrill(null); }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[200px]"
            >
              {deptOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          )}

          {/* Multi-select bộ phận khi so sánh */}
          {compareMode && (
            <select
              multiple
              value={selectedDepts}
              onChange={(e)=>{
                const vals = Array.from(e.target.selectedOptions).map(o=>o.value);
                const cut = vals.slice(0,5);
                setSelectedDepts(cut.length ? cut : ['C1']);
                setDrill(null);
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[220px] h-[96px]"
              title="Giữ Ctrl/Cmd để chọn nhiều"
            >
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          )}

          {/* Loại rác */}
          <select
            value={trashType}
            onChange={(e)=>{ setTrashType(e.target.value); setDrill(null); }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[220px]"
          >
            {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="px-4">
          <div className="mb-3 text-xs text-slate-500">Đang tải dữ liệu…</div>
        </div>
      )}

      {/* Chart / Drill */}
      {!drill ? (
        <div className="px-4 pb-5">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {!compareMode ? (
                <ComposedChart data={data} onClick={onBarClick}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={BAR_COLOR} stopOpacity={0.95} />
                      <stop offset="100%" stopColor={BAR_COLOR} stopOpacity={0.25} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip content={<Tip />} />
                  <Legend />
                  <Bar dataKey="weight" name="Khối lượng" fill="url(#barGrad)" radius={[6,6,0,0]} />
                  <Line type="monotone" dataKey="trend" name="Đường xu hướng" stroke={LINE_COLOR} strokeWidth={2} dot={false} />
                </ComposedChart>
              ) : (
                <ComposedChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip content={<Tip />} />
                  <Legend />
                  {selectedDepts.map((dep, idx) => (
                    <Bar
                      key={dep}
                      dataKey={dep}
                      name={dep}
                      fill={PAL[idx % PAL.length]}
                      radius={[6,6,0,0]}
                    />
                  ))}
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-center text-xs text-slate-500">
            Gợi ý: vuốt trái/phải hoặc dùng các nút điều hướng để xem giai đoạn khác.
            {!compareMode && ' Nhấn vào một cột để xem chi tiết theo thùng.'}
          </div>
        </div>
      ) : (
        <div className="px-4 pb-5">
          <div className="flex items-center justify-between pb-3 px-1">
            <div className="text-slate-700 font-semibold">{drill.title}</div>
            <button
              onClick={backFromDrill}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-sm"
            >
              <BsArrowUp /> Quay lại
            </button>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={drill.rows}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip content={<Tip />} />
                <Bar dataKey="weight" name="Khối lượng" fill="#22c55e" radius={[6,6,0,0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
