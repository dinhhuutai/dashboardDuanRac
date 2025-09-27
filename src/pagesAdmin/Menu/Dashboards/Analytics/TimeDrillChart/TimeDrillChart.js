import React, { useMemo, useRef, useState } from 'react';
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

/* =========================
   Constants & Mock Options
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
const viDaysShort = ['CN','T2','T3','T4','T5','T6','T7'];
const viMonthsShort = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];
const PAL = ['#22c55e','#06b6d4','#8b5cf6','#f59e0b','#ef4444','#3b82f6','#14b8a6','#eab308'];

/* =========================
   Time helpers
   ========================= */
function startOfWeek(d) {
  const dt = new Date(d);
  const day = dt.getDay(); // 0..6 (CN..T7)
  const diff = (day + 6) % 7; // về T2
  dt.setDate(dt.getDate() - diff);
  dt.setHours(0,0,0,0);
  return dt;
}
function addDays(d, n) { const dt = new Date(d); dt.setDate(dt.getDate()+n); return dt; }
function addWeeks(d, n) { return addDays(d, n*7); }
function addMonths(d, n) { const dt = new Date(d); dt.setMonth(dt.getMonth()+n); return dt; }
function ymd(d){ return d.toISOString().slice(0,10); }
function weekNumberInMonth(d) {
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  return Math.ceil((d.getDate() + (first.getDay() || 7) - 1) / 7);
}
function dmyMonth(d) { return `T${d.getMonth()+1}/${d.getFullYear()}`; }

/* =========================
   Mock data generator
   ========================= */
function seededRand(seed) {
  let s = seed % 2147483647; if (s <= 0) s += 2147483646;
  return () => (s = s * 16807 % 2147483647) / 2147483647;
}
function hashStr(s) {
  let h=0; for (let i=0;i<s.length;i++){ h = (h*31 + s.charCodeAt(i))|0; } return Math.abs(h);
}

// Daily (7 ngày trong tuần)
function mockDailyWindow({ baseDate, weekOffset, department, trashType }) {
  const weekStart = addWeeks(startOfWeek(baseDate), weekOffset);
  const seed = hashStr(`${ymd(weekStart)}|${department}|${trashType}`);
  const rnd = seededRand(seed);
  const data = [];
  for (let i=0;i<7;i++){
    const d = addDays(weekStart, i);
    const label = viDaysShort[d.getDay()];
    const base = 200 + rnd()*300;     // kg
    const deptFactor = department===ALL ? 1 : 0.85 + rnd()*0.5;
    const trashFactor = trashType===ALL ? 1 : 0.8 + rnd()*0.6;
    const weight = +(base * deptFactor * trashFactor).toFixed(1);
    data.push({ key: ymd(d), label, weight, trend: +(weight*(0.85 + rnd()*0.3)).toFixed(1) });
  }
  return { title: `Tuần ${weekNumberInMonth(weekStart)} - ${dmyMonth(weekStart)}`, data };
}

// Weekly (4-5 tuần trong tháng)
function mockWeeklyWindow({ baseDate, monthOffset, department, trashType }) {
  const monthStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const curMonthStart = addMonths(monthStart, monthOffset);
  const seed = hashStr(`${curMonthStart.getFullYear()}-${curMonthStart.getMonth()+1}|${department}|${trashType}`);
  const rnd = seededRand(seed);

  const weeks = [];
  let ws = startOfWeek(curMonthStart);
  while (ws.getMonth() !== curMonthStart.getMonth() && ws < curMonthStart) ws = addWeeks(ws, 1);

  for (let i=0;i<6;i++){
    const we = addDays(ws, 6);
    const inMonth = ws.getMonth()===curMonthStart.getMonth() || we.getMonth()===curMonthStart.getMonth();
    if (!inMonth) break;
    const base = 1400 + rnd()*800;
    const deptFactor = department===ALL ? 1 : 0.85 + rnd()*0.5;
    const trashFactor = trashType===ALL ? 1 : 0.8 + rnd()*0.6;
    const weight = +(base * deptFactor * trashFactor).toFixed(1);
    weeks.push({ key: `${ymd(ws)}_${ymd(we)}`, label: `W${i+1}`, weight, trend: +(weight*(0.9 + rnd()*0.2)).toFixed(1) });
    ws = addWeeks(ws, 1);
  }
  return { title: `Tháng ${curMonthStart.getMonth()+1}/${curMonthStart.getFullYear()}`, data: weeks };
}

// Monthly (12 tháng trong năm)
function mockMonthlyWindow({ baseDate, yearOffset, department, trashType }) {
  const year = baseDate.getFullYear() + yearOffset;
  const seed = hashStr(`${year}|${department}|${trashType}`);
  const rnd = seededRand(seed);
  const data = [];
  for (let m=0;m<12;m++){
    const base = 6000 + rnd()*3000;
    const deptFactor = department===ALL ? 1 : 0.85 + rnd()*0.5;
    const trashFactor = trashType===ALL ? 1 : 0.8 + rnd()*0.6;
    const weight = +(base * deptFactor * trashFactor).toFixed(1);
    data.push({ key: `${year}-${m+1}`, label: viMonthsShort[m], weight, trend: +(weight*(0.92 + rnd()*0.15)).toFixed(1) });
  }
  return { title: `Năm ${year}`, data };
}

// Drilldown (máy theo bộ phận)
function mockMachinesForDepartment({ department, periodKey }) {
  const seed = hashStr(`${department}|${periodKey}`);
  const rnd = seededRand(seed);
  const machines = Array.from({length: 8}, (_,i)=>`M${i+1}`);
  return machines.map((m) => {
    const weight = +(500 + rnd()*1500).toFixed(1);
    return { name: m, weight };
  });
}

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
          <span className="font-medium text-slate-800">{Number(p.value).toLocaleString('vi-VN')} kg</span>
        </div>
      ))}
    </div>
  );
}

/* =========================
   Component chính
   ========================= */
export default function TimeDrillChart() {
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

  const baseDate = useMemo(() => new Date(), []);

  // Dữ liệu đơn (không so sánh)
  const { title, data } = useMemo(() => {
    if (granularity === 'day')   return mockDailyWindow ({ baseDate, weekOffset, department, trashType });
    if (granularity === 'week')  return mockWeeklyWindow({ baseDate, monthOffset, department, trashType });
    return mockMonthlyWindow({ baseDate, yearOffset, department, trashType });
  }, [granularity, baseDate, weekOffset, monthOffset, yearOffset, department, trashType]);

  // Dữ liệu so sánh nhiều bộ phận
  const dataCompare = useMemo(() => {
    if (!compareMode || !selectedDepts.length) return [];
    // Khung nhãn theo granularity, dùng ALL để chuẩn key/label
    const baseWin = (granularity === 'day')
      ? mockDailyWindow({ baseDate, weekOffset, department: ALL, trashType })
      : (granularity === 'week')
        ? mockWeeklyWindow({ baseDate, monthOffset, department: ALL, trashType })
        : mockMonthlyWindow({ baseDate, yearOffset, department: ALL, trashType });

    const rows = baseWin.data.map(({ key, label }) => ({ key, label }));

    selectedDepts.forEach((dep) => {
      const win = (granularity === 'day')
        ? mockDailyWindow({ baseDate, weekOffset, department: dep, trashType })
        : (granularity === 'week')
          ? mockWeeklyWindow({ baseDate, monthOffset, department: dep, trashType })
          : mockMonthlyWindow({ baseDate, yearOffset, department: dep, trashType });

      const map = new Map(win.data.map(d => [d.key, d.weight]));
      rows.forEach(r => { r[dep] = map.get(r.key) ?? 0; });
    });

    return rows;
  }, [compareMode, selectedDepts, granularity, baseDate, weekOffset, monthOffset, yearOffset, trashType]);

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

  /* Click cột → drill (tắt khi compare) */
  const onBarClick = (d) => {
    if (compareMode) return; // không drill khi đang so sánh
    const periodKey = d?.activePayload?.[0]?.payload?.key;
    if (!periodKey) return;
    const dept = department === ALL ? 'C1' : department; // placeholder
    const rows = mockMachinesForDepartment({ department: dept, periodKey });
    setDrill({ department: dept, periodKey, title: `Máy trong ${dept}`, rows });
  };

  const backFromDrill = () => setDrill(null);

  /* Options */
  const deptOptions = [{ value: ALL, label: '— Tất cả bộ phận —' }, ...DEPARTMENTS.map(d=>({value:d,label:d}))];
  const typeOptions = [{ value: ALL, label: '— Tất cả loại rác —' }, ...TRASH_TYPES.map(t=>({value:t,label:t}))];

  /* Style */
  const BAR_COLOR = '#8b5cf6';
  const LINE_COLOR = '#06b6d4';

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
            {title}
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
                // giới hạn 5 bộ phận
                const cut = vals.slice(0,5);
                // đảm bảo tồn tại ít nhất 1 lựa chọn
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
                <ComposedChart data={dataCompare}>
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
            {!compareMode && ' Nhấn vào một cột để xem chi tiết theo máy.'}
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
