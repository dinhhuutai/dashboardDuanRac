import React, { useEffect, useMemo, useState } from "react";
import { DndContext, useDraggable, useDroppable, DragOverlay } from "@dnd-kit/core";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaCalendarAlt, FaLock, FaLockOpen, FaPlus, FaSearch, FaSpinner, FaTimes } from "react-icons/fa";
import http from "~/api/http";
import { BASE_URL } from "~/config";

/* =================== Helpers: week calc =================== */
function toDateOnly(d) {
  const dd = new Date(d);
  dd.setHours(0, 0, 0, 0);
  return dd;
}
function getMonday(date) {
  const d = toDateOnly(date);
  const day = d.getDay(); // 0=Sun..6=Sat
  const diff = (day === 0 ? -6 : 1) - day; // backward to Monday
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return monday;
}
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function fmt(d) {
  const dd = new Date(d);
  const day = dd.getDate().toString().padStart(2, "0");
  const month = (dd.getMonth() + 1).toString().padStart(2, "0");
  const year = dd.getFullYear();
  return `${day}/${month}/${year}`;
}
function toISODate(d) {
  const dd = new Date(d);
  const y = dd.getFullYear();
  const m = (dd.getMonth() + 1).toString().padStart(2, "0");
  const day = dd.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function getISOWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
}

/* =================== UI: Notice & Confirm =================== */
function NoticeModal({ open, title = "Thông báo", message = "", onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 bg-black/40 grid place-items-center z-[200]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            initial={{ scale: .95 }} animate={{ scale: 1 }} exit={{ scale: .95 }}>
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h4 className="font-bold text-lg">{title}</h4>
              <button className="p-2 rounded hover:bg-slate-100" onClick={onClose}><FaTimes /></button>
            </div>
            <div className="px-5 py-4 text-slate-700">{message}</div>
            <div className="px-5 py-3 border-t flex justify-end">
              <button onClick={onClose}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition shadow">
                OK
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
function ConfirmModal({ open, title = "Xác nhận", message = "", onCancel, onOk, okText = "OK", danger = false }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 bg-black/40 grid place-items-center z-[200]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            initial={{ scale: .95 }} animate={{ scale: 1 }} exit={{ scale: .95 }}>
            <div className="px-5 py-4 border-b">
              <h4 className="font-bold text-lg">{title}</h4>
            </div>
            <div className="px-5 py-4 text-slate-700">{message}</div>
            <div className="px-5 py-3 border-t flex justify-end gap-3">
              <button onClick={onCancel} className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 transition shadow">
                Hủy
              </button>
              <button onClick={onOk}
                className={`px-4 py-2 rounded-xl text-white transition shadow ${danger ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"}`}>
                {okText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* =================== DnD items =================== */
function DraggableFood({ food }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `food-${food.foodId}`, data: food
  });
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDragging ? 999 : "auto",
  };
  return (
    <motion.div ref={setNodeRef} {...listeners} {...attributes} style={style}
      className="p-3 rounded-xl bg-white shadow hover:shadow-lg cursor-grab transition">
      <img src={food.imageUrl} alt={food.foodName} className="h-20 w-full object-cover rounded-lg mb-2" />
      <h4 className="font-semibold text-sm">{food.foodName}</h4>
    </motion.div>
  );
}
function DroppableSlot({ id, assignedFood, onRemove, disabled, droppableDisabled = false }) {
  const { isOver, setNodeRef } = useDroppable({ id, disabled: droppableDisabled });

  // id dạng "slot-<day>-<pos>" → lấy pos
  const parts = String(id).split("-");
  const pos = Number(parts[2]);
  const isFixed = pos >= 6 && pos <= 12; // slot cố định (6..12)

  return (
    <motion.div
      ref={setNodeRef}
      className={`h-24 rounded-xl flex items-center justify-center border-2 border-dashed relative
        ${isOver && !disabled && !droppableDisabled ? "border-emerald-500 bg-emerald-50" : "border-slate-300"} 
        ${disabled ? "opacity-60" : ""}`}
    >
      {assignedFood ? (
        <div className="relative h-full w-full">
          <img
            src={assignedFood.imageUrl}
            alt={assignedFood.foodName}
            className="h-full w-full object-cover rounded-xl"
          />
          {/* Ẩn nút xoá khi là slot cố định 6..12 */}
          {!disabled && !isFixed && (
            <button
              onClick={onRemove}
              className="absolute top-1 right-1 px-2 py-1 bg-rose-600 text-white text-xs rounded"
            >
              ✕
            </button>
          )}
        </div>
      ) : (
        <span className="text-slate-400 text-sm px-2 text-center">
          Thả món vào đây
        </span>
      )}
    </motion.div>
  );
}


/* =================== Main page =================== */
export default function WeeklyMenu() {
    const [activeFood, setActiveFood] = useState(null);
  // Step 1: pick week
  const [selectedDate, setSelectedDate] = useState(() => toISODate(new Date()));
  const monday = useMemo(() => getMonday(new Date(selectedDate)), [selectedDate]);
  const weekNo = useMemo(() => getISOWeekNumber(monday), [monday]);
  const weekLabel = useMemo(() => {
    const start = monday;
    const end = addDays(monday, 6);
    return `Tuần ${weekNo} | ${fmt(start)} - ${fmt(end)}`;
  }, [monday, weekNo]);

  // Data & states
  const [foods, setFoods] = useState([]);
  const [search, setSearch] = useState("");
  const foodFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? foods.filter(f => (f.foodName || "").toLowerCase().includes(q)) : foods;
  }, [foods, search]);

  const [loading, setLoading] = useState(false);
  const [menuLoading, setMenuLoading] = useState(false);
  const [notice, setNotice] = useState({ open: false, title: "", message: "" });
  const [confirm, setConfirm] = useState({ open: false, title: "", message: "", onOk: null, danger: false });

  // weekly menu data
  const [weeklyMenu, setWeeklyMenu] = useState(null); // { weeklyMenuId, isLocked, entries: [...] }
  // board state: { "slot-<d>-<p>": foodObj }
  const [board, setBoard] = useState({});

  // load foods
  useEffect(() => {
    (async () => {
      try {
        const rs = await http.get(`${BASE_URL}/api/foods?q=${encodeURIComponent(search || "")}`);
        setFoods(rs.data || []);
      } catch {
        setNotice({ open: true, title: "Lỗi", message: "Không tải được danh sách món ăn." });
      }
    })();
    // eslint-disable-next-line
  }, []);

  // load weekly menu by monday
  useEffect(() => {
    loadWeeklyMenu();
    // eslint-disable-next-line
  }, [monday]);

  async function loadWeeklyMenu() {
    setMenuLoading(true);
    setWeeklyMenu(null);
    setBoard({});
    try {
      const rs = await http.get(`${BASE_URL}/api/weekly-menus?weekStartMonday=${toISODate(monday)}`);
      const data = rs.data?.data || null;
      setWeeklyMenu(data);
      if (data?.entries?.length) {
        const map = {};
        data.entries.forEach(e => {
          const key = `slot-${e.dayOfWeek}-${e.position}`;
          map[key] = {
            foodId: e.foodId,
            foodName: e.foodName,
            imageUrl: e.imageUrl,
          };
        });
        setBoard(map);
      }
    } catch {
      // nếu chưa có -> weeklyMenu = null, show CTA tạo mới
    } finally {
      setMenuLoading(false);
    }
  }

  // Step 2: Create new weekly menu (if not exists)
  async function handleCreateWeeklyMenu() {
    try {
      setLoading(true);
      const payload = { weekStartMonday: toISODate(monday) };

      await http.post(`${BASE_URL}/api/weekly-menus`, payload);
      
      await loadWeeklyMenu();

      setNotice({ open: true, title: "Thành công", message: "Đã tạo thực đơn tuần. Hãy kéo thả món và lưu lại!" });
    } catch (e) {
      setNotice({ open: true, title: "Lỗi", message: "Không thể tạo thực đơn tuần. Có thể tuần này đã tồn tại." });
    } finally {
      setLoading(false);
    }
  }

  // Save entries (create/update)
  async function handleSave() {
    if (!weeklyMenu?.weeklyMenuId) return;
    const entries = Object.entries(board).map(([key, f]) => {
      const [, day, pos] = key.split("-");
      return { dayOfWeek: Number(day), position: Number(pos), foodId: f.foodId };
    });
    try {
      setLoading(true);
      await http.post(`${BASE_URL}/api/weekly-menus/${weeklyMenu.weeklyMenuId}/entries`, { entries });
      setNotice({ open: true, title: "Đã lưu", message: "Lưu thực đơn tuần thành công." });
      await loadWeeklyMenu();
    } catch {
      setNotice({ open: true, title: "Lỗi", message: "Lưu thực đơn thất bại. Kiểm tra dữ liệu và thử lại." });
    } finally {
      setLoading(false);
    }
  }

  // Lock / Unlock
  function askLock(lock) {
    if (!weeklyMenu) return;
    setConfirm({
      open: true,
      title: lock ? "Khoá thực đơn" : "Mở khoá thực đơn",
      message: lock
        ? "Sau khi khoá, người dùng sẽ không thể đặt cơm tuần này. Bạn chắc chắn khoá?"
        : "Bạn muốn mở khoá để chỉnh sửa/cho đặt lại?",
      danger: lock,
      onOk: async () => {
        setConfirm({ ...confirm, open: false });
        try {
          setLoading(true);
          await http.put(`${BASE_URL}/api/weekly-menus/${weeklyMenu.weeklyMenuId}/${lock ? "lock" : "unlock"}`);
          await loadWeeklyMenu();
          setNotice({
            open: true,
            title: "Thành công",
            message: lock ? "Đã khoá thực đơn tuần." : "Đã mở khoá thực đơn tuần.",
          });
        } catch {
          setNotice({ open: true, title: "Lỗi", message: "Không thể thay đổi trạng thái khoá." });
        } finally {
          setLoading(false);
        }
      },
    });
  }

  function onDragStart(e) {
  setActiveFood(e.active.data.current || null);
}
  // DnD handlers
  function onDragEnd(e) {
    setActiveFood(null);
    const { active, over } = e;
    if (!over || !active) return;
    if (!weeklyMenu || weeklyMenu.isLocked) return;
    
    const parts = String(over.id).split("-");
    const pos = Number(parts[2]);
    if (pos >= 6 && pos <= 12) return;

    const food = active.data.current;
    const slotId = over.id; // "slot-<day>-<pos>"
    setBoard(prev => ({ ...prev, [slotId]: { foodId: food.foodId, foodName: food.foodName, imageUrl: food.imageUrl } }));
  }

  // Remove one slot
  function removeSlot(day, pos) {
    const key = `slot-${day}-${pos}`;
    setBoard(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  }

  // columns (1..7)
  const days = [
    { d: 1, name: "Thứ 2" },
    { d: 2, name: "Thứ 3" },
    { d: 3, name: "Thứ 4" },
    { d: 4, name: "Thứ 5" },
    { d: 5, name: "Thứ 6" },
    { d: 6, name: "Thứ 7" },
  ];
  const positions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; // tối đa 11 món/ngày

  return (
    <div className="p-6">
      <div className="bg-white/80 rounded-2xl border border-slate-200 p-5 shadow-lg">
      {/* Header bar */}
      <div className="bg-white/80 backdrop-blur rounded-2xl border border-slate-200 p-4 md:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <FaCalendarAlt className="text-emerald-600" />
            <div>
              <div className="font-bold text-lg">{weekLabel}</div>
              <div className="text-sm text-slate-500">Chọn ngày bất kỳ trong tuần để đổi tuần</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            
            {weeklyMenu ? (
              <div className="flex items-center gap-2">
                <span className={`px-3 py-2 rounded-lg text-sm ${weeklyMenu.isLocked ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
                  {weeklyMenu.isLocked ? "Đã khoá" : "Đang mở"}
                </span>
                <button
                  onClick={() => askLock(!weeklyMenu.isLocked)}
                  className={`px-4 py-2 rounded-xl text-white shadow transition
                    ${weeklyMenu.isLocked ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"}`}>
                  {weeklyMenu.isLocked ? <><FaLockOpen className="inline mr-2" />Mở khoá</> : <><FaLock className="inline mr-2" />Khoá</>}
                </button>
              </div>
            ) : null}

            {/* Input chọn tuần */}
<div className="relative inline-block">
  {/* Ô hiển thị tiếng Việt */}
  <input
    type="text"
    readOnly
    value={`Tuần ${weekNo} | ${fmt(monday)} - ${fmt(addDays(monday, 6))}`}
    className="px-3 py-2 rounded-lg border w-72 cursor-pointer"
    onClick={() => document.getElementById("hidden-week").showPicker()}
  />

  {/* Input week ẩn, chỉ dùng để chọn */}
  <input
    id="hidden-week"
    type="week"
    className="absolute left-0 top-0 opacity-0 pointer-events-none"
    value={`${new Date(selectedDate).getFullYear()}-W${weekNo.toString().padStart(2, "0")}`}
    onChange={(e) => {
      const [year, weekStr] = e.target.value.split("-W");
      const week = parseInt(weekStr, 10);
      const firstDay = new Date(year, 0, 1 + (week - 1) * 7);
      const monday = getMonday(firstDay);
      setSelectedDate(toISODate(monday));
    }}
  />
</div>

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
          // Chưa có menu -> CTA tạo
          <div className="h-[360px] grid place-items-center">
            <div className="text-center">
              <div className="text-xl font-semibold mb-2">Tuần này chưa có thực đơn</div>
              <div className="text-slate-500 mb-4">Bấm nút bên dưới để tạo mới</div>
              <button onClick={handleCreateWeeklyMenu}
                className="px-6 py-3 rounded-xl bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={loading}>
                {loading ? <><FaSpinner className="inline mr-2 animate-spin" />Đang tạo...</> : <><FaPlus className="inline mr-2" />Tạo thực đơn tuần</>}
              </button>
            </div>
          </div>
        ) : (
          // Đã có menu -> UI kéo thả + search + save
          <DndContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {/* LEFT: board */}
              <div className="col-span-1 lg:col-span-2">
                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-6">
                  {days.map(({ d, name }) => (
                    <div key={d} className="bg-white rounded-2xl border shadow-sm">
                      <div className="px-4 py-3 border-b flex justify-between items-center">
                        <div className="font-semibold">{name}</div>
                        {!weeklyMenu.isLocked && (
                          <button
                            onClick={() => positions.forEach(p => { if (p < 6) removeSlot(d, p); })}
                            className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200">
                            Xoá hết
                          </button>
                        )}
                      </div>
                      <div className="p-4 space-y-4">
                        {positions.map(pos => {
                          const id = `slot-${d}-${pos}`;
                          const assignedFood = board[id] || null;
                          const isFixedPos = pos >= 6 && pos <= 12;
                          return (
                            <DroppableSlot
                              key={id}
                              id={id}
                              assignedFood={assignedFood}
                              disabled={weeklyMenu.isLocked}
                              droppableDisabled={weeklyMenu.isLocked || isFixedPos}
                              onRemove={() => removeSlot(d, pos)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={weeklyMenu.isLocked || loading}
                    className="px-6 py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed">
                    {loading ? <><FaSpinner className="inline mr-2 animate-spin" />Đang lưu...</> : "💾 Lưu thực đơn"}
                  </button>
                </div>
              </div>

              {/* RIGHT: foods + search */}
              <div className="col-span-1 lg:col-span-1">
                <div className="bg-white rounded-2xl border shadow-sm p-4">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                      placeholder="Tìm món theo tên..."
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
            <DragOverlay>
                {activeFood ? (
                <div className="w-20 p-3 bg-white rounded-xl shadow-xl">
                    <img src={activeFood.imageUrl} alt="" className="h-12 w-full object-cover rounded" />
                    <div className="font-semibold text-[10px]">{activeFood.foodName}</div>
                </div>
                ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Modals */}
      <NoticeModal open={notice.open} title={notice.title} message={notice.message} onClose={() => setNotice({ ...notice, open: false })} />
      <ConfirmModal
        open={confirm.open} title={confirm.title} message={confirm.message}
        danger={confirm.danger}
        onCancel={() => setConfirm({ ...confirm, open: false })}
        onOk={confirm.onOk || (() => setConfirm({ ...confirm, open: false }))}
        okText={confirm.danger ? "Khoá" : "Mở khoá"}
      />
    </div>
    </div>
  );
}
