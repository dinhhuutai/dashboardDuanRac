import React, { useEffect, useMemo, useState } from "react";
import { DndContext, useDraggable, useDroppable, DragOverlay } from "@dnd-kit/core";
import { motion, AnimatePresence } from "framer-motion";
import { FaCalendarAlt, FaLock, FaLockOpen, FaPlus, FaSearch, FaSpinner, FaTimes } from "react-icons/fa";
import http from "~/api/http";
import { BASE_URL } from "~/config";

/* =================== Helpers =================== */
function toDateOnly(d){ const dd=new Date(d); dd.setHours(0,0,0,0); return dd; }
function getMonday(date){ const d=toDateOnly(date); const day=d.getDay(); const diff=(day===0?-6:1)-day; const m=new Date(d); m.setDate(d.getDate()+diff); return m; }
function addDays(d,n){ const x=new Date(d); x.setDate(x.getDate()+n); return x; }
function fmt(d){ const dd=new Date(d); const day=dd.getDate().toString().padStart(2,"0"); const month=(dd.getMonth()+1).toString().padStart(2,"0"); const year=dd.getFullYear(); return `${day}/${month}/${year}`; }
function toISODate(d){ const dd=new Date(d); const y=dd.getFullYear(); const m=(dd.getMonth()+1).toString().padStart(2,"0"); const day=dd.getDate().toString().padStart(2,"0"); return `${y}-${m}-${day}`; }
function getISOWeekNumber(d){ const date=new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const dayNum=date.getUTCDay()||7; date.setUTCDate(date.getUTCDate()+4-dayNum); const yearStart=new Date(Date.UTC(date.getUTCFullYear(),0,1)); return Math.ceil(((date-yearStart)/86400000+1)/7); }

/** Món cố định chỉ hiển thị sẵn trên UI (ô trống); re: 3 ô cuối; ws/ot: chỉ 93 ở ô cuối loại đó */
const UI_DEFAULT_FOOD_SLOTS = {
  re: [
    [10, 67],
    [11, 80],
    [12, 93],
  ],
  ws: [[1, 93]],
  ot: [[5, 93]],
};

function foodFromCatalog(foods, foodId) {
  const f = foods.find((x) => Number(x.foodId) === Number(foodId));
  if (!f) return null;
  return { foodId: f.foodId, foodName: f.foodName, imageUrl: f.imageUrl };
}

function applyUiDefaultFoods(boardMap, statusType, foods) {
  const st = (statusType || "re").toLowerCase();
  const pairs = UI_DEFAULT_FOOD_SLOTS[st];
  if (!pairs?.length || !foods?.length) return boardMap;
  const out = { ...boardMap };
  for (let day = 1; day <= 7; day++) {
    for (const [position, fid] of pairs) {
      const key = `slot-${day}-${position}`;
      if (!out[key]) {
        const row = foodFromCatalog(foods, fid);
        if (row) out[key] = row;
      }
    }
  }
  return out;
}

/* =================== UI: Notice =================== */
function NoticeModal({ open, title="Thông báo", message="", onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 bg-black/40 grid place-items-center z-[200]"
          initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
          <motion.div className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            initial={{ scale:.95 }} animate={{ scale:1 }} exit={{ scale:.95 }}>
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h4 className="font-bold text-lg">{title}</h4>
              <button className="p-2 rounded hover:bg-slate-100" onClick={onClose}><FaTimes/></button>
            </div>
            <div className="px-5 py-4 text-slate-700">{message}</div>
            <div className="px-5 py-3 border-t flex justify-end">
              <button onClick={onClose}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition shadow">OK</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* =================== DnD items =================== */
function DraggableFood({ food }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id:`food-${food.foodId}`, data:food });
  const style = { transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined, zIndex: isDragging ? 999 : "auto" };
  return (
    <motion.div ref={setNodeRef} {...listeners} {...attributes} style={style}
      className="p-3 rounded-xl bg-white shadow hover:shadow-lg cursor-grab transition">
      <img src={food.imageUrl} alt={food.foodName} className="h-20 w-full object-cover rounded-lg mb-2" />
      <h4 className="font-semibold text-sm">{food.foodName}</h4>
    </motion.div>
  );
}

function DroppableSlot({ id, assignedFood, onRemove, disabled, droppableDisabled=false, onClick }) {
  const { isOver, setNodeRef } = useDroppable({ id, disabled: droppableDisabled });
  return (
    <motion.div
      ref={setNodeRef}
      onClick={onClick}
      className={`h-24 rounded-xl flex items-center justify-center border-2 border-dashed relative
        ${isOver && !disabled && !droppableDisabled ? "border-emerald-500 bg-emerald-50" : "border-slate-300"} 
        ${disabled ? "opacity-60" : ""}`}>
      {assignedFood ? (
        <div className="relative h-full w-full">
          <img src={assignedFood.imageUrl} alt={assignedFood.foodName} className="h-full w-full object-cover rounded-xl" />
          {!disabled && (
            <button onClick={(e) => {
    e.stopPropagation();   // 🔥 chặn bubble
    onRemove?.();
  }} className="absolute top-1 right-1 px-2 py-1 bg-rose-600 text-white text-xs rounded">✕</button>
          )}
        </div>
      ) : (
        <span className="text-slate-400 text-sm px-2 text-center">Thả món vào đây</span>
      )}
    </motion.div>
  );
}

/* =================== Main =================== */
export default function WeeklyMenu() {
  const [activeFood, setActiveFood] = useState(null);

  // Tuần
  const [selectedDate, setSelectedDate] = useState(() => toISODate(new Date()));
  const monday = useMemo(() => getMonday(new Date(selectedDate)), [selectedDate]);
  const weekNo = useMemo(() => getISOWeekNumber(monday), [monday]);
  const weekLabel = useMemo(() => `Tuần ${weekNo} | ${fmt(monday)} - ${fmt(addDays(monday, 6))}`, [monday, weekNo]);

  // Tabs
  const [statusType, setStatusType] = useState("re"); // 're' | 'ws' | 'ot'

  // Data
  const [foods, setFoods] = useState([]);
  const [search, setSearch] = useState("");
  const foodFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? foods.filter(f => (f.foodName || "").toLowerCase().includes(q)) : foods;
  }, [foods, search]);

  const [loading, setLoading] = useState(false);
  const [menuLoading, setMenuLoading] = useState(false);
  const [notice, setNotice] = useState({ open:false, title:"", message:"" });

  const [weeklyMenu, setWeeklyMenu] = useState(null); // { weeklyMenuId, isLocked, entries: [...] }
  const [allEntries, setAllEntries] = useState([]);   // tất cả statusType
  const [board, setBoard] = useState({});             // theo tab

  const [activeDay, setActiveDay] = useState(1);

  const [mobilePickerOpen, setMobilePickerOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);


  // foods
  useEffect(() => {
    (async () => {
      try {
        const rs = await http.get(`${BASE_URL}/api/foods?q=${encodeURIComponent(search || "")}`);
        setFoods(rs.data || []);
      } catch {
        setNotice({ open:true, title:"Lỗi", message:"Không tải được danh sách món ăn." });
      }
    })();
    // eslint-disable-next-line
  }, []);

  // load weekly menu by monday
  useEffect(() => { loadWeeklyMenu(); /* eslint-disable-next-line */ }, [monday]);

  // map board từ server + ô trống thì gắn món cố định (chỉ UI; Lưu mới ghi DB)
  useEffect(() => {
    const map = {};
    allEntries
      .filter((e) => (e.statusType || "re").toLowerCase() === statusType)
      .forEach((e) => {
        const key = `slot-${e.dayOfWeek}-${e.position}`;
        map[key] = { foodId: e.foodId, foodName: e.foodName, imageUrl: e.imageUrl };
      });
    setBoard(applyUiDefaultFoods(map, statusType, foods));
  }, [statusType, allEntries, foods]);

  async function loadWeeklyMenu() {
    setMenuLoading(true);
    setWeeklyMenu(null);
    setBoard({});
    try {
      const rs = await http.get(`${BASE_URL}/api/weekly-menus?weekStartMonday=${toISODate(monday)}`);
      const data = rs.data?.data || null;
      setWeeklyMenu(data);
      const entries = data?.entries || [];
      setAllEntries(entries);
    } finally {
      setMenuLoading(false);
    }
  }

  // tạo tuần -> server backfill re/ws/ot
  async function handleCreateWeeklyMenu() {
    try {
      setLoading(true);
      await http.post(`${BASE_URL}/api/weekly-menus`, { weekStartMonday: toISODate(monday) });
      await loadWeeklyMenu();
      setNotice({ open:true, title:"Thành công", message:"Đã tạo thực đơn tuần: tự thêm sẵn re/ws/ot." });
    } catch {
      setNotice({ open:true, title:"Lỗi", message:"Không thể tạo thực đơn tuần." });
    } finally {
      setLoading(false);
    }
  }

  // lưu entries chỉ theo tab hiện tại (xóa hết statusType đó rồi insert lại)
  async function handleSave() {
    if (!weeklyMenu?.weeklyMenuId) return;

    const entries = Object.entries(board).map(([key, f]) => {
      const [, day, pos] = key.split("-");
      return { dayOfWeek: Number(day), position: Number(pos), foodId: f.foodId };
    });

    try {
      setLoading(true);
      await http.post(`${BASE_URL}/api/weekly-menus/${weeklyMenu.weeklyMenuId}/entries`, { statusType, entries });
      setNotice({ open:true, title:"Đã lưu", message:`Lưu thực đơn (${statusType}) thành công.` });
      await loadWeeklyMenu();
    } catch {
      setNotice({ open:true, title:"Lỗi", message:"Lưu thực đơn thất bại." });
    } finally {
      setLoading(false);
    }
  }

  // xoá 1 ô ngay lập tức (gọi API)
  async function deleteOneEntry(dayOfWeek, position) {
    if (!weeklyMenu?.weeklyMenuId) return;
    try {
      setLoading(true);
      // await http.delete(`${BASE_URL}/api/weekly-menus/${weeklyMenu.weeklyMenuId}/entries`, {
      //   data: { statusType, dayOfWeek, position }
      // });
      setBoard(prev => { const k = `slot-${dayOfWeek}-${position}`; const c = { ...prev }; delete c[k]; return c; });
    } catch {
      setNotice({ open:true, title:"Lỗi", message:"Xoá món thất bại." });
    } finally {
      setLoading(false);
    }
  }

  // DnD
  function onDragStart(e){ setActiveFood(e.active.data.current || null); }
  function onDragEnd(e){
    setActiveFood(null);
    const { active, over } = e;
    if (!over || !active) return;
    if (!weeklyMenu || weeklyMenu.isLocked) return;

    const food = active.data.current;
    const slotId = over.id; // "slot-<day>-<pos>"
    setBoard(prev => ({ ...prev, [slotId]: { foodId: food.foodId, foodName: food.foodName, imageUrl: food.imageUrl } }));
  }

  // ====== Quy tắc số ô theo loại ======
  function positionsForType(type) {
    if (type === 'ws') return [1];            // đi ca: 1 ô
    if (type === 'ot') return [1,2,3,4,5];    // tăng ca: 5 ô
    return [1,2,3,4,5,6,7,8,9,10,11,12];      // bình thường
  }
  // các vị trí preset cần đẩy xuống dưới cùng khi render
  function presetPositionsForType(type) {
    if (type === 'ws') return [1];     // ws preset = pos 1
    if (type === 'ot') return [1,2];   // ot preset = pos 1..2
    return [1,2,3,4,5,6];              // re preset = pos 1..6
  }
  function orderedPositionsForType(type) {
    return positionsForType(type);
  }

  const days = [
    { d:1, name:"Thứ 2" },{ d:2, name:"Thứ 3" },{ d:3, name:"Thứ 4" },
    { d:4, name:"Thứ 5" },{ d:5, name:"Thứ 6" },{ d:6, name:"Thứ 7" },{ d:7, name:"Chủ nhật" },
  ];

  const tabs = [
    { k:'re', label:'Bình thường' },
    { k:'ws', label:'Đi ca' },
    { k:'ot', label:'Tăng ca' },
  ];

  return (
    <div className="p-6">
      <div className="bg-white/80 rounded-2xl border border-slate-200 p-5 shadow-lg">
        {/* ================= HEADER ================= */}

{/* ================= DESKTOP HEADER (GIỮ GIAO DIỆN CŨ) ================= */}
<div className="hidden lg:block bg-white/80 backdrop-blur rounded-2xl border border-slate-200 p-4 md:p-6 shadow-sm">

  <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">

    {/* LEFT */}
    <div className="flex items-start sm:items-center gap-3">
      <FaCalendarAlt className="text-emerald-600 mt-1 sm:mt-0 shrink-0" />
      <div>
        <div className="font-bold text-base sm:text-lg">
          {weekLabel}
        </div>
        <div className="text-xs sm:text-sm text-slate-500">
          Chọn ngày bất kỳ trong tuần để đổi tuần
        </div>
      </div>
    </div>

    {/* RIGHT */}
    <div className="flex flex-col lg:flex-row lg:items-center gap-4 w-full xl:w-auto">

      {/* Tabs */}
      <div className="relative bg-slate-100 rounded-xl p-1 border border-slate-200 flex w-full sm:w-auto overflow-x-auto no-scrollbar">
        {tabs.map(t => (
          <button
            key={t.k}
            onClick={() => setStatusType(t.k)}
            className={`relative z-10 px-4 py-2 text-sm rounded-lg transition whitespace-nowrap
              ${statusType===t.k 
                ? "text-emerald-800 font-semibold" 
                : "text-slate-600 hover:text-slate-800"}`}
          >
            {t.label}
            {statusType===t.k && (
              <motion.span
                layoutId="pill"
                className="absolute inset-0 -z-10 rounded-lg bg-white shadow"
                transition={{ type:"spring", stiffness:400, damping:30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Lock Section */}
      {weeklyMenu && (
        <div className="flex flex-wrap items-center gap-2">

          <span
            className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap
              ${weeklyMenu.isLocked 
                ? "bg-rose-50 text-rose-700" 
                : "bg-emerald-50 text-emerald-700"}`}
          >
            {weeklyMenu.isLocked ? "Đã khoá" : "Đang mở"}
          </span>

          <button
            onClick={async () => {
              try {
                setLoading(true);
                await http.put(`${BASE_URL}/api/weekly-menus/${weeklyMenu.weeklyMenuId}/${weeklyMenu.isLocked ? "unlock" : "lock"}`);
                await loadWeeklyMenu();
              } finally { setLoading(false); }
            }}
            className={`px-4 py-2 rounded-xl text-white shadow transition whitespace-nowrap
              ${weeklyMenu.isLocked 
                ? "bg-emerald-600 hover:bg-emerald-700" 
                : "bg-rose-600 hover:bg-rose-700"}`}
          >
            {weeklyMenu.isLocked 
              ? (<><FaLockOpen className="inline mr-2" />Mở khoá</>)
              : (<><FaLock className="inline mr-2" />Khoá</>)
            }
          </button>
        </div>
      )}

      {/* Week Picker */}
      <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">

        <button
          onClick={() => setSelectedDate(toISODate(addDays(monday, -7)))}
          className="h-9 w-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition flex items-center justify-center shrink-0"
        >
          ◀
        </button>

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => {
            const picked = new Date(e.target.value);
            const m = getMonday(picked);
            setSelectedDate(toISODate(m));
          }}
          onClick={(e) => e.currentTarget.showPicker?.()}
          className="flex-1 sm:flex-none text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
        />

        <button
          onClick={() => setSelectedDate(toISODate(addDays(monday, 7)))}
          className="h-9 w-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition flex items-center justify-center shrink-0"
        >
          ▶
        </button>

      </div>

    </div>
  </div>
</div>


{/* ================= MOBILE HEADER (GIỮ BẢN MỚI) ================= */}
<div className="lg:hidden bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

  <div className="p-4 space-y-3">

    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-xs text-slate-500">Thực đơn tuần</div>
        <div className="font-bold text-base leading-tight">
          {weekLabel}
        </div>
      </div>

      {weeklyMenu && (
  <div className="flex flex-col items-end gap-2">

    {/* Badge */}
    <div
      className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap
        ${weeklyMenu.isLocked
          ? "bg-rose-100 text-rose-700"
          : "bg-emerald-100 text-emerald-700"
        }`}
    >
      {weeklyMenu.isLocked ? "Đã khoá" : "Đang mở"}
    </div>

    {/* Nút khoá/mở */}
    <button
      onClick={async () => {
        try {
          setLoading(true);
          await http.put(
            `${BASE_URL}/api/weekly-menus/${weeklyMenu.weeklyMenuId}/${weeklyMenu.isLocked ? "unlock" : "lock"}`
          );
          await loadWeeklyMenu();
        } finally {
          setLoading(false);
        }
      }}
      className={`px-3 py-2 rounded-xl text-xs text-white shadow active:scale-95 transition
        ${weeklyMenu.isLocked
          ? "bg-emerald-600"
          : "bg-rose-600"
        }`}
    >
      {weeklyMenu.isLocked ? (
        <>
          <FaLockOpen className="inline mr-1" /> Mở khoá
        </>
      ) : (
        <>
          <FaLock className="inline mr-1" /> Khoá
        </>
      )}
    </button>

  </div>
)}
    </div>
{/* ===== WEEK PICKER ===== */}
    <div className="flex items-center justify-between">

      <button
        onClick={() => {
          const prev = new Date(selectedDate);
          prev.setDate(prev.getDate() - 7);
          setSelectedDate(toISODate(prev));
        }}
        className="px-3 py-2 rounded-xl bg-slate-100 active:scale-95 transition"
      >
        ←
      </button>

      <input
        type="date"
        value={selectedDate}
        onChange={(e) => {
          const picked = new Date(e.target.value);
          const m = getMonday(picked);
          setSelectedDate(toISODate(m));
        }}
        onClick={(e) => e.currentTarget.showPicker?.()}
        className="text-center text-sm font-medium border rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
      />

      <button
        onClick={() => {
          const next = new Date(selectedDate);
          next.setDate(next.getDate() + 7);
          setSelectedDate(toISODate(next));
        }}
        className="px-3 py-2 rounded-xl bg-slate-100 active:scale-95 transition"
      >
        →
      </button>
    </div>

    {/* ===== TABS (mobile style giống desktop) ===== */}
<div className="relative bg-slate-100 rounded-2xl p-1 flex">

  {/* Active background pill */}
  <div
    className="absolute top-1 bottom-1 rounded-xl bg-white shadow-sm transition-all duration-300"
    style={{
      width: `${100 / tabs.length}%`,
      left: `${(tabs.findIndex(t => t.k === statusType)) * (100 / tabs.length)}%`
    }}
  />

  {tabs.map(t => (
    <button
      key={t.k}
      onClick={() => setStatusType(t.k)}
      className={`relative z-10 flex-1 py-2 text-xs font-semibold rounded-xl transition-colors duration-300
        ${
          statusType === t.k
            ? "text-emerald-600"
            : "text-slate-500"
        }`}
    >
      {t.label}
    </button>
  ))}
</div>

  </div>
</div>

        {/* Content */}
        <div className="mt-6">
          {menuLoading ? (
            <div className="flex items-center gap-3 text-slate-700">
              <FaSpinner className="animate-spin text-emerald-600 text-xl" />
              <span>Đang tải dữ liệu tuần...</span>
            </div>
          ) : !weeklyMenu ? (
            <div className="h-[360px] grid place-items-center">
              <div className="text-center">
                <div className="text-xl font-semibold mb-2">Tuần này chưa có thực đơn</div>
                <div className="text-slate-500 mb-4">Bấm nút bên dưới để tạo mới (auto re/ws/ot)</div>
                <button onClick={handleCreateWeeklyMenu}
                  className="px-6 py-3 rounded-xl bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={loading}>
                  {loading ? (<><FaSpinner className="inline mr-2 animate-spin" />Đang tạo...</>) : (<><FaPlus className="inline mr-2" />Tạo thực đơn tuần</>)}
                </button>
              </div>
            </div>
          ) : (
            <DndContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
  <div className="space-y-6">

    {/* ================= MOBILE: CHỌN NGÀY ================= */}
    <div className="lg:hidden sticky top-0 z-20 bg-white pb-3">
  <div className="flex gap-2 overflow-x-auto px-1 pt-2">
    {days.map(({ d, name }) => {
      const date = addDays(monday, d - 1);

      return (
        <button
          key={d}
          onClick={() => setActiveDay(d)}
          className={`flex flex-col items-center justify-center mb-[10px] min-w-[72px] px-3 py-2 rounded-xl text-xs transition
            ${
              activeDay === d
                ? "bg-emerald-600 text-white shadow"
                : "bg-slate-100 text-slate-600"
            }`}
        >
          <span className="font-medium">{name}</span>
          <span className="text-[11px] opacity-80">
            {fmt(date).slice(0,5)}
          </span>
        </button>
      );
    })}
  </div>
</div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* ================= BOARD ================= */}
      <div className="lg:col-span-2">

        {/* ===== MOBILE: CHỈ 1 NGÀY ===== */}
        <div className="lg:hidden">
          {days
            .filter(day => day.d === activeDay)
            .map(({ d, name }) => (
              <div key={d} className="bg-white rounded-2xl border shadow-sm">
                <div className="px-4 py-3 border-b font-semibold">
                  {name}
                </div>

                <div className="p-4 grid grid-cols-2 gap-3">
                  {orderedPositionsForType(statusType).map(pos => {
                    const id = `slot-${d}-${pos}`;
                    const assignedFood = board[id] || null;

                    return (
                      <DroppableSlot
                        key={id}
                        id={id}
                        assignedFood={assignedFood}
                        disabled={weeklyMenu.isLocked}
                        droppableDisabled={weeklyMenu.isLocked}
                        onRemove={() => deleteOneEntry(d, pos)}
                        onClick={() => {
                          if (!weeklyMenu.isLocked) {
                            setSelectedSlot(id);
                            setMobilePickerOpen(true);
                          }
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
        </div>

        {/* ===== DESKTOP GIỮ NGUYÊN ===== */}
        <div className="hidden lg:grid md:grid-cols-4 xl:grid-cols-6 gap-6">
          {days.map(({ d, name }) => (
            <div key={d} className="bg-white rounded-2xl border shadow-sm">
              <div className="px-4 py-3 border-b font-semibold">
                {name}
              </div>

              <div className="p-4 space-y-4">
                {orderedPositionsForType(statusType).map(pos => {
                  const id = `slot-${d}-${pos}`;
                  const assignedFood = board[id] || null;

                  return (
                    <DroppableSlot
                      key={id}
                      id={id}
                      assignedFood={assignedFood}
                      disabled={weeklyMenu.isLocked}
                      droppableDisabled={weeklyMenu.isLocked}
                      onRemove={() => deleteOneEntry(d, pos)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* SAVE */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={weeklyMenu.isLocked || loading}
            className="px-6 py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg transition disabled:opacity-60"
          >
            {loading ? "Đang lưu..." : "💾 Lưu thực đơn"}
          </button>
        </div>
      </div>

      {/* ================= DESKTOP: FOODS ================= */}
      <div className="hidden lg:block">
        <div className="bg-white rounded-2xl border shadow-sm p-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm món..."
              className="pl-10 pr-3 py-2 rounded-lg border w-full"
            />
          </div>

          <div className="mt-4 grid grid-cols-2 lg:grid-cols-3 gap-3 max-h-[70vh] overflow-y-auto pr-1">
            {foodFiltered.map(food => (
              <DraggableFood key={food.foodId} food={food} />
            ))}
          </div>
        </div>
      </div>

    </div>
  </div>

  <DragOverlay>
    {activeFood && (
      <div className="w-20 p-3 bg-white rounded-xl shadow-xl">
        <img
          src={activeFood.imageUrl}
          alt=""
          className="h-12 w-full object-cover rounded"
        />
        <div className="font-semibold text-[10px]">
          {activeFood.foodName}
        </div>
      </div>
    )}
  </DragOverlay>

  <AnimatePresence>
  {mobilePickerOpen && (
    <motion.div
      className="fixed inset-0 bg-black/40 z-[300] flex items-end lg:hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white w-full rounded-t-2xl p-4 max-h-[80vh] overflow-hidden"
        initial={{ y: 400 }}
        animate={{ y: 0 }}
        exit={{ y: 400 }}
      >
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">Chọn món</h3>
          <button onClick={() => setMobilePickerOpen(false)}>
            <FaTimes />
          </button>
        </div>

        <div className="relative mb-3">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm món..."
            className="pl-10 pr-3 py-2 rounded-lg border w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 overflow-y-auto max-h-[50vh]">
          {foodFiltered.map(food => (
            <div
              key={food.foodId}
              onClick={() => {
                if (selectedSlot) {
                  setBoard(prev => ({
                    ...prev,
                    [selectedSlot]: {
                      foodId: food.foodId,
                      foodName: food.foodName,
                      imageUrl: food.imageUrl
                    }
                  }));
                  setMobilePickerOpen(false);
                }
              }}
              className="p-3 bg-white rounded-xl shadow active:scale-95 transition"
            >
              <img src={food.imageUrl} alt="" className="h-20 w-full object-cover rounded mb-2" />
              <div className="text-sm font-semibold">{food.foodName}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
</DndContext>
          )}
        </div>

        <NoticeModal open={notice.open} title={notice.title} message={notice.message}
          onClose={() => setNotice(s => ({ ...s, open:false }))} />
      </div>
    </div>
  );
}




