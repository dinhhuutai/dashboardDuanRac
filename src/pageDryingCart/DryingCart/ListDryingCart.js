import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  DragOverlay,
  useDroppable,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  FiPlus, FiClock, FiX, FiRefreshCw,
  FiEdit2, FiTrash2, FiSave, FiArrowUpRight, FiSearch
} from "react-icons/fi";
import http from "~/api/http";
import HhMmPicker from "./components/HhMmPicker";
import { FiAlertTriangle } from "react-icons/fi";

// ======= Helpers =======
const WARN_SEC = 5 * 60;
const pad = (n) => String(Math.abs(n)).padStart(2, "0");
const fmt = (sec) => {
  const s = Math.floor(sec ?? 0);
  const sign = s < 0 ? "-" : "";
  const a = Math.abs(s);
  const hh = Math.floor(a / 3600);
  const mm = Math.floor((a % 3600) / 60);
  const ss = a % 60;
  return hh > 0 ? `${sign}${pad(hh)}:${pad(mm)}:${pad(ss)}` : `${sign}${pad(mm)}:${pad(ss)}`;
};
const norm = (v) =>
  (v ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

// ======= Confirm Modal =======
function ConfirmModal({ open, title = "Xác nhận", message, onCancel, onConfirm, confirmLabel="Xoá" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <div className="text-lg font-semibold mb-2">{title}</div>
        <div className="text-slate-600 mb-4">{message}</div>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200">Huỷ</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ======= Sortable Item (left list) =======
function SortableCartItem({ cart, onEdit, onDelete, dragDisabled=false }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: cart.cartId, disabled: dragDisabled });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: dragDisabled ? 0.55 : (isDragging ? 0.7 : 1),
  };
  const dragProps = dragDisabled ? {} : { ...attributes, ...listeners };

  const isExpired = (cart.remainingSec ?? 0) === 0 && !!cart.slotCode;
  const isDrying = !!cart.slotCode;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...dragProps}
      aria-disabled={dragDisabled}
      className={`group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm hover:shadow select-none ${
        dragDisabled ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing"
      }`}
    >
      <div className="min-w-0">
        <div className="font-semibold">Xe #{cart.cartNumber}</div>
      </div>
      <div className="flex items-center gap-2">
        {isDrying ? (
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${
              isExpired
                ? "bg-emerald-100 border-emerald-300 text-emerald-800 pulse-badge-strong"
                : "bg-amber-100 border-amber-200 text-amber-800 pulse-badge-soft"
            }`}
            title={isExpired ? "Đã hết giờ" : "Đang phơi"}
          >
            {isExpired ? "Hết giờ" : "Đang phơi"}
          </span>
        ) : null}
        <div className={`gap-1 ${dragDisabled ? "opacity-50" : "invisible group-hover:visible flex"} flex`}>
          <button
            title="Sửa"
            onPointerDown={(e)=>e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onEdit(cart); }}
            className="p-1 rounded-lg hover:bg-emerald-50 text-emerald-700"
          >
            <FiEdit2 />
          </button>
          <button
            title="Xoá"
            onPointerDown={(e)=>e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onDelete(cart); }}
            className="p-1 rounded-lg hover:bg-red-50 text-red-600"
          >
            <FiTrash2 />
          </button>
        </div>
      </div>
    </div>
  );
}

// ======= Droppable Slot =======
function Slot({ id, child }) {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl border-2 p-2 min-h-[150px] flex items-stretch ${
        child ? "bg-white border-slate-200" : "bg-slate-50 border-dashed border-slate-300"
      }`}
      style={{ boxShadow: isOver ? "0 0 0 3px rgba(16,185,129,.35) inset" : undefined }}
    >
      {child ? (
        child
      ) : (
        <div className="m-auto text-slate-400 text-sm flex items-center gap-1">
          <FiArrowUpRight /> Thả xe vào đây
        </div>
      )}
    </div>
  );
}

// ======= Drying Card =======
function DryingCard({ item, onExtend, onReturn, onEditTime, loading }) {
  const isExpired = (item.remainingSec ?? 0) === 0;
  const isWarning = !isExpired && (item.remainingSec ?? 0) <= WARN_SEC;

  const containerClass = isExpired
    ? "bg-white ring-1 ring-emerald-500 expired-bg-flash"
    : isWarning
    ? "bg-white ring-1 ring-amber-300 warning-bg-pulse"
    : "bg-white ring-1 ring-slate-200";

  return (
    <div className={`w-full rounded-xl shadow-sm p-3 relative ${containerClass}`}>
      <div className="flex items-start justify-between mb-1">
        <div>
          <div className="text-lg font-extrabold text-slate-900">Xe #{item.cartNumber}</div>
          {item.displayName && (
            <div className="text-slate-600 text-sm">{item.displayName}</div>
          )}
          {(item.productCode || item.printLine) && (
           <div className="mt-1 flex flex-wrap gap-2 text-xs">
             {item.productCode && (
               <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                 Mã hàng: {item.productCode}
               </span>
             )}
             {item.printLine && (
               <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                 Chuyền in: {item.printLine}
               </span>
             )}
           </div>
         )}
        </div>
        <div className="text-xs text-slate-500 text-right">
          <div className="inline-flex items-center gap-1"><FiClock /> dự kiến</div>
          <div>{item.endAtUtc ? new Date(item.endAtUtc).toLocaleString("vi-VN") : "—"}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <div className="text-3xl font-black tracking-tight select-none">{fmt(item.remainingSec)}</div>
        <button
          onClick={() => onEditTime(item)}
          className="ml-auto text-xs px-2 py-1 rounded-lg border border-slate-300 hover:bg-slate-50 inline-flex items-center gap-2 disabled:opacity-60"
          disabled={loading?.any}
        >
          Chỉnh thời gian
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {!isExpired && (
          <>
            <button
              onClick={() => onExtend(item.cartId, 5 * 60)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm shadow hover:bg-emerald-700 disabled:opacity-60 inline-flex items-center gap-2"
              disabled={loading?.extendId === item.cartId || loading?.any}
            >
              {loading?.extendId === item.cartId ? <FiRefreshCw className="animate-spin" /> : null}
              +5’
            </button>
            <button
              onClick={() => onExtend(item.cartId, 10 * 60)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm shadow hover:bg-emerald-700 disabled:opacity-60 inline-flex items-center gap-2"
              disabled={loading?.extendId === item.cartId || loading?.any}
            >
              {loading?.extendId === item.cartId ? <FiRefreshCw className="animate-spin" /> : null}
              +10’
            </button>
            <button
              onClick={() => onExtend(item.cartId, 15 * 60)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm shadow hover:bg-emerald-700 disabled:opacity-60 inline-flex items-center gap-2"
              disabled={loading?.extendId === item.cartId || loading?.any}
            >
              {loading?.extendId === item.cartId ? <FiRefreshCw className="animate-spin" /> : null}
              +15’
            </button>
          </>
        )}

        {/* Huỷ bỏ → trả về trái */}
        <button
          onClick={() => onReturn(item.cartId)}
          className={`ml-auto px-3 py-1.5 rounded-lg text-white text-sm shadow inline-flex items-center gap-2 disabled:opacity-60
            ${isExpired ? "bg-emerald-700 hover:bg-emerald-800" : "bg-slate-700 hover:bg-slate-800"}`}
          disabled={loading?.returnId === item.cartId || loading?.any}
        >
          {loading?.returnId === item.cartId ? <FiRefreshCw className="animate-spin" /> : null}
          Huỷ bỏ
        </button>
      </div>
    </div>
  );
}

// ======= Simple Modal =======
function Modal({ open, title, children, onClose, width="max-w-lg" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${width} rounded-2xl bg-white p-5 shadow-2xl`}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-semibold">{title}</div>
          <button className="p-2 rounded-full hover:bg-slate-100" onClick={onClose}><FiX /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function ListDryingCart() {
  // data
  const [allCarts, setAllCarts] = useState([]);
  const [slots, setSlots] = useState(
    () => Array.from({ length: 12 }, (_, i) => ({ id: `slot-${i + 1}`, cart: null }))
  );

  // ui states
  const [draggingId, setDraggingId] = useState(null);
  const [query, setQuery] = useState("");
  const [prioritizeLowRemaining, setPrioritizeLowRemaining] = useState(true);

  // loading states
  const [startLoading, setStartLoading] = useState(false);
  const [extendId, setExtendId] = useState(null);
  const [returnId, setReturnId] = useState(null);
  const [savingCart, setSavingCart] = useState(false);
  const [updatingTime, setUpdatingTime] = useState(false);
  const [bulkReturning, setBulkReturning] = useState(false); // <<< NEW

  // modals
  const [openStartModal, setOpenStartModal] = useState(false);
  const [targetCart, setTargetCart] = useState(null);
  const [targetSlotId, setTargetSlotId] = useState(null);

  const [hhmm, setHhmm] = useState({ hours: 0, minutes: 20 });

  const [openAddModal, setOpenAddModal] = useState(false);
  const [newCartNumber, setNewCartNumber] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");

  const [openEditCartModal, setOpenEditCartModal] = useState(false);
  const [editCart, setEditCart] = useState(null);

  const [openEditTimeModal, setOpenEditTimeModal] = useState(false);
  const [editTimeCart, setEditTimeCart] = useState(null);
  const [editHhmm, setEditHhmm] = useState({ hours: 0, minutes: 10 });

  const [startCartNumber, setStartCartNumber] = useState("");
  const [startProductCode, setStartProductCode] = useState(""); // mã hàng
  const [startPrintLine,  setStartPrintLine]  = useState("");   // chuyền in

const [confirmReplaceOpen, setConfirmReplaceOpen] = useState(false);
const [replaceCart, setReplaceCart] = useState(null); // cart đang phơi bị trùng số


  // sensors
  const sensors = useSensors(useSensor(PointerSensor));

  
const getCartByNumber = (number) => {
  const n = Number(number);
  if (!n || Number.isNaN(n)) return null;
  return allCarts.find(c => Number(c.cartNumber) === n) || null;
};

  // ======== LOAD ========
  const load = async () => {
    const listAll = await http.get(`/api/drying-carts`);
    const board = await http.get(`/api/drying/board`);
    const carts = listAll.data || [];
    const realtime = board.data || [];
    const byId = new Map(realtime.map((r) => [r.cartId, r]));
    const merged = carts.map((c) => ({ ...c, ...(byId.get(c.cartId) || {}) }));

    const mapSlot = new Map(merged.filter(x => x.slotCode).map(x => [x.slotCode, x]));
    setSlots(prev => prev.map(s => ({ ...s, cart: mapSlot.get(s.id) || null })));
    setAllCarts(merged);
  };

  useEffect(() => { load(); }, []);

  // ======== TICK local 1s ========
  useEffect(() => {
    const t = setInterval(() => {
      setSlots(prev =>
        prev.map(s => {
          if (!s.cart) return s;
          const next = Math.max(0, (s.cart.remainingSec ?? 0) - 1);
          return { ...s, cart: { ...s.cart, remainingSec: next } };
        })
      );
      // sync left list (badges/sort)
      setAllCarts(prev => prev.map(c => {
        const slot = slots.find(s => s.cart?.cartId === c.cartId);
        if (!slot) return c;
        const cur = Math.max(0, (slot.cart?.remainingSec ?? 0));
        return { ...c, remainingSec: cur, slotCode: slot.id };
      }));
    }, 1000);
    return () => clearInterval(t);
  }, [slots]);

  // ======== Derived states ========
  const filteredLeft = useMemo(() => {
    const q = norm(query.trim());
    if (!q) return allCarts;
    return allCarts.filter(c => {
      const code = String(c.cartNumber ?? "").toLowerCase();
      return code.includes(q) || norm(c.displayName).includes(q);
    });
  }, [allCarts, query]);

  // Sort left: expired (and drying) first, then drying, then others
  const filteredLeftSorted = useMemo(() => {
    const arr = [...filteredLeft];
    arr.sort((a, b) => {
      const aExpired = (a.remainingSec ?? 999999) === 0 && !!a.slotCode;
      const bExpired = (b.remainingSec ?? 999999) === 0 && !!b.slotCode;
      if (aExpired !== bExpired) return aExpired ? -1 : 1;
      const aDry = !!a.slotCode;
      const bDry = !!b.slotCode;
      if (aDry !== bDry) return aDry ? -1 : 1;
      return (a.cartNumber || 0) - (b.cartNumber || 0);
    });
    return arr;
  }, [filteredLeft]);

  // ưu tiên slot hiển thị
  const displaySlots = useMemo(() => {
    if (!prioritizeLowRemaining) return slots;
    const filled = slots.filter(s => s.cart);
    const empty  = slots.filter(s => !s.cart);
    filled.sort((a,b) => {
      const aExp = (a.cart?.remainingSec ?? 0) === 0 ? 1 : 0;
      const bExp = (b.cart?.remainingSec ?? 0) === 0 ? 1 : 0;
      if (aExp !== bExp) return bExp - aExp; // expired first
      return (a.cart?.remainingSec ?? 0) - (b.cart?.remainingSec ?? 0);
    });
    const reordered = [];
    let iFilled = 0, iEmpty = 0;
    for (let i = 0; i < slots.length; i++) {
      if (iFilled < filled.length) reordered.push(filled[iFilled++]);
      else reordered.push(empty[iEmpty++]);
    }
    return reordered;
  }, [slots, prioritizeLowRemaining]);

  const beginStart = async (forceReplace = false) => {
  if (!targetSlotId) return;
  const durMin = Math.max(1, hhmm.hours * 60 + hhmm.minutes);

  // kiểm tra số xe người dùng đã nhập
  const existing = getCartByNumber(startCartNumber);

  // Nếu đã tồn tại và đang phơi ở ô khác → hỏi xác nhận (trừ khi đã forceReplace)
  if (existing && existing.slotCode && existing.slotCode !== targetSlotId && !forceReplace) {
    setReplaceCart(existing);
    setConfirmReplaceOpen(true);
    return; // đợi người dùng chọn trong confirm
  }

  setStartLoading(true);
  try {
    // nếu chưa có -> tạo mới
    let chosen = existing;
    if (!chosen) {
      chosen = await addCart(Number(startCartNumber), `Xe phơi vải ${startCartNumber}`);
      if (!chosen?.cartId) {
        // phòng khi backend không trả object
        const latest = (await http.get(`/api/drying-carts`))?.data || [];
        chosen = latest.find(c => Number(c.cartNumber) === Number(startCartNumber));
      }
    }

    if (!chosen?.cartId) return;

    // nếu có và đang phơi (ở cùng hay khác ô), và ta đã forceReplace (người dùng bấm Đồng ý)
    if (existing && existing.slotCode && forceReplace) {
      await http.post(`/api/drying/stop-return`, { cartId: existing.cartId });
    }

    // start phiên mới
    await http.post(`/api/drying/start`, {
      cartId: chosen.cartId,
      durationSec: durMin * 60,
      slotCode: targetSlotId,
      productCode: startProductCode?.trim() || null,
      printLine:  startPrintLine?.trim()  || null,
    });
    await load();
    setOpenStartModal(false);
  } finally {
    setStartLoading(false);
  }
};

  // ======== API Actions ========
  const startSession = async (cartId, min, slotCode) => {
    const durationSec = Math.max(60, Math.floor(min * 60));
    setStartLoading(true);
    try {
      await http.post(`/api/drying/start`, { cartId, durationSec, slotCode });
      await load();
    } finally {
      setStartLoading(false);
    }
  };
  const extend = async (cartId, addSec) => {
    setExtendId(cartId);
    try {
      await http.post(`/api/drying/extend`, { cartId, addSec });
      await load();
    } finally {
      setExtendId(null);
    }
  };
  const stopReturn = async (cartId) => {
    setReturnId(cartId);
    try {
      await http.post(`/api/drying/stop-return`, { cartId });
      await load();
    } finally {
      setReturnId(null);
    }
  };

  // NEW: bulk return all expired carts currently in slots
  const stopReturnAllExpired = async () => {
    // lấy danh sách cartId hết giờ trong các ô
    const expired = slots
      .filter(s => s.cart && (s.cart.remainingSec ?? 0) === 0)
      .map(s => s.cart.cartId);

    if (!expired.length) return;

    setBulkReturning(true);
    try {
      // tuần tự để backend nhẹ nhàng
      for (const id of expired) {
        // eslint-disable-next-line no-await-in-loop
        await http.post(`/api/drying/stop-return`, { cartId: id });
      }
      await load();
    } finally {
      setBulkReturning(false);
    }
  };

  const addCart = async (cartNumber, displayName) => {
    const res = await http.post(`/api/drying-carts`, {
      cartNumber: Number(cartNumber),
      displayName: displayName?.trim() || null,
    });
    await load();
    return res?.data;
  };
    // Tìm/đảm bảo xe theo số
    const ensureCartByNumber = async (number) => {
      const n = Number(number);
      if (!n || Number.isNaN(n)) return null;
      // thử tìm trong allCarts hiện có
      let found = allCarts.find(c => Number(c.cartNumber) === n);
      if (found) return found;
      // chưa có -> tạo mới với displayName mặc định
      const created = await addCart(n, `Xe phơi vải ${n}`);
      if (created) return created;
      // nếu backend chưa trả object, load() đã gọi ở addCart -> tìm lại
      const after = (await http.get(`/api/drying-carts`))?.data || [];
      const just = after.find(c => Number(c.cartNumber) === n);
      return just || null;
    };
  const updateCart = async (cartId, payload) => {
    setSavingCart(true);
    try {
      await http.put(`/api/drying-carts/${cartId}`, payload);
      await load();
    } finally {
      setSavingCart(false);
    }
  };
  const deleteCart = async (cartId) => {
    await http.delete(`/api/drying-carts/${cartId}`);
    await load();
  };

  // ======== CRUD left ========
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const onEditCart = (cart) => { setEditCart(cart); setOpenEditCartModal(true); };
  const onDeleteCart = (cart) => { setConfirmTarget(cart); setConfirmOpen(true); };

  // ======== DnD ========
  const handleDragStart = (e) => setDraggingId(e.active.id);
  const handleDragEnd = (e) => {
    const overId = e?.over?.id;
    setDraggingId(null);
    if (!overId) return;
    const slot = slots.find((s) => s.id === overId);
    if (!slot || slot.cart) return;
    const cart = allCarts.find((c) => c.cartId === e.active.id);
    if (!cart || cart.slotCode) return;

    setTargetCart(cart);
    setTargetSlotId(slot.id);
    setHhmm({ hours: 0, minutes: 20 });
    setStartCartNumber(String(cart.cartNumber || ""));
    setStartProductCode(""); // default rỗng khi mở
    setStartPrintLine("");
    setOpenStartModal(true);
  };

  // ======== UI ========
  const doStart = async () => {
    if (!targetCart || !targetSlotId) return;
    const durMin = Math.max(1, hhmm.hours * 60 + hhmm.minutes);
    await startSession(targetCart.cartId, durMin, targetSlotId);
    setOpenStartModal(false);
  };

  // đếm số xe hết giờ hiện có trong slot
  const expiredCount = useMemo(
    () => slots.filter(s => s.cart && (s.cart.remainingSec ?? 0) === 0).length,
    [slots]
  );

  return (
    <div className="p-4">
      {/* CSS: 2 kiểu nền nhấp nháy + badge */}
      <style>{`
        /* SẮP HẾT GIỜ: nền vàng nhịp nhẹ */
        @keyframes warnBgPulse {
          0%   { background-color: rgba(251, 191, 36, 0.10); box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.0); }
          50%  { background-color: rgba(251, 191, 36, 0.22); box-shadow: 0 0 0 10px rgba(251, 191, 36, 0.10); }
          100% { background-color: rgba(251, 191, 36, 0.10); box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.0); }
        }
        .warning-bg-pulse { animation: warnBgPulse 1.8s ease-in-out infinite; }

        /* HẾT GIỜ: nền xanh ngọc nhấp nháy mạnh + glow */
        @keyframes expiredBgFlash {
          0%   { background-color: rgba(16,185,129, 0.08); box-shadow: 0 0 0 0 rgba(16,185,129, 0.0), 0 0 0 0 rgba(16,185,129, 0.0); }
          35%  { background-color: rgba(16,185,129, 0.30); box-shadow: 0 0 0 12px rgba(16,185,129, 0.18), 0 8px 28px 6px rgba(16,185,129, 0.35); }
          65%  { background-color: rgba(16,185,129, 0.24); box-shadow: 0 0 0 16px rgba(16,185,129, 0.24), 0 10px 32px 10px rgba(16,185,129, 0.40); }
          100% { background-color: rgba(16,185,129, 0.08); box-shadow: 0 0 0 0 rgba(16,185,129, 0.0), 0 0 0 0 rgba(16,185,129, 0.0); }
        }
        .expired-bg-flash { animation: expiredBgFlash 1.2s ease-in-out infinite; }

        /* Badge nhịp: mềm cho 'Đang phơi', mạnh cho 'Hết giờ' */
        @keyframes pulseBadgeSoft {
          0%,100% { background-color: rgba(251,191,36,0.18); border-color: rgba(251,191,36,0.35); }
          50%     { background-color: rgba(251,191,36,0.30); border-color: rgba(251,191,36,0.55); }
        }
        .pulse-badge-soft { animation: pulseBadgeSoft 1.6s ease-in-out infinite; }

        @keyframes pulseBadgeStrong {
          0%,100% { background-color: rgba(16,185,129,0.16); border-color: rgba(16,185,129,0.35); }
          50%     { background-color: rgba(16,185,129,0.36); border-color: rgba(16,185,129,0.70); }
        }
        .pulse-badge-strong { animation: pulseBadgeStrong 1.0s ease-in-out infinite; }
      `}</style>

      {/* Top bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setOpenAddModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-white shadow hover:bg-emerald-700"
        >
          <FiPlus /> Thêm xe
        </button>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 rounded-xl bg-white ring-1 ring-slate-200 px-3 py-2 shadow-sm hover:bg-slate-50"
        >
          <FiRefreshCw /> Tải lại
        </button>

        <div className="ml-auto w-full sm:w-80 relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo mã (vd: 12) hoặc tên (vd: Xe phơi Tổ 3)…"
            className="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 text-slate-500"
            >
              <FiX />
            </button>
          )}
        </div>

        {/* NEW: Bulk return button */}
        <button
          onClick={stopReturnAllExpired}
          disabled={bulkReturning || expiredCount === 0}
          className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 shadow-sm
            ${expiredCount === 0 ? "bg-slate-200 text-slate-500 cursor-not-allowed" : "bg-emerald-700 text-white hover:bg-emerald-800"}
            disabled:opacity-60`}
          title={expiredCount === 0 ? "Không có xe hết giờ trong ô" : "Đưa tất cả xe hết giờ về bên trái"}
        >
          {bulkReturning ? <FiRefreshCw className="animate-spin" /> : null}
          Huỷ bỏ HẾT xe hết giờ
          <span className={`ml-1 inline-flex items-center justify-center min-w-6 h-6 rounded-full text-xs font-semibold
            ${expiredCount === 0 ? "bg-slate-300 text-slate-700" : "bg-white/20 text-white"}`}>
            {expiredCount}
          </span>
        </button>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left */}
          <div className="lg:col-span-1">
            <div className="mb-2 text-sm text-slate-600">
              Danh sách tất cả xe — xe <span className="px-1 rounded bg-amber-100 text-amber-800">đang phơi</span> sẽ bị khoá kéo.
            </div>
            <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm p-3 h-[70vh] overflow-auto">
              <SortableContext
                items={filteredLeftSorted.filter(c => !c.slotCode).map(c => c.cartId)}
                strategy={rectSortingStrategy}
              >
                <div className="grid gap-2">
                  {filteredLeftSorted.map((c) => (
                    <SortableCartItem
                      key={c.cartId}
                      cart={c}
                      dragDisabled={!!c.slotCode}
                      onEdit={(cart) => { setEditCart(cart); setOpenEditCartModal(true); }}
                      onDelete={(cart) => { setConfirmTarget(cart); setConfirmOpen(true); }}
                    />
                  ))}
                </div>
              </SortableContext>
              {filteredLeftSorted.length === 0 && (
                <div className="text-center text-slate-400 text-sm py-6">Không có xe phù hợp</div>
              )}
            </div>
          </div>

          {/* Right */}
          <div className="lg:col-span-2">
            <div className="mb-2 text-sm text-slate-600">Khu vực phơi — thả vào 1 trong các ô dưới đây</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {displaySlots.map((s) => (
                <Slot
                  key={s.id}
                  id={s.id}
                  child={
                    s.cart ? (
                      <DryingCard
                        item={s.cart}
                        onExtend={extend}
                        onReturn={stopReturn}
                        onEditTime={(item) => {
                          setEditTimeCart(item);
                          const curMin = Math.ceil((item.remainingSec || 0) / 60);
                          setEditHhmm({ hours: Math.floor(curMin/60), minutes: curMin % 60 });
                          setOpenEditTimeModal(true);
                        }}
                        loading={{ extendId, returnId, any: !!returnId || !!extendId }}
                      />
                    ) : null
                  }
                />
              ))}
            </div>
          </div>
        </div>

        <DragOverlay>
          {draggingId ? (
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
              Đang kéo Xe #{allCarts.find((c) => c.cartId === draggingId)?.cartNumber}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Start Modal */}
      <Modal
        open={openStartModal}
        title={`Bắt đầu phơi — Xe #${targetCart?.cartNumber || ""}`}
        onClose={() => setOpenStartModal(false)}
      >
        <div className="space-y-4">
              {/* Nhập số xe (có thể đổi/hoặc thêm mới) */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="sm:col-span-1">
        <div className="text-sm text-slate-600 mb-1">Số xe</div>
        <input
          type="number"
          value={startCartNumber}
          onChange={(e) => setStartCartNumber(e.target.value)}
          placeholder="VD: 12"
          className="w-full rounded-xl border border-slate-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        {(() => {
            const ex = getCartByNumber(startCartNumber);
            if (ex?.slotCode) {
                return (
                <div className="mt-2 rounded-xl border border-amber-200/70 bg-gradient-to-br from-amber-50 to-orange-50 text-amber-800 shadow-sm ring-1 ring-amber-100/60">
  <div className="flex items-start gap-3 px-3 py-2">
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100/80 ring-1 ring-amber-200">
      <FiAlertTriangle className="text-amber-700" />
    </span>
    <div className="text-[13px] leading-relaxed">
      Xe <b>#{ex.cartNumber}</b> đang phơi ở ô{" "}
      <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 text-[12px] font-semibold ring-1 ring-amber-200">
        {ex.slotCode}
      </span>
    </div>
  </div>
</div>

                );
            }
            return null;
        })()}
        <div className="mt-1 text-[11px] text-slate-500">
          Nếu số chưa tồn tại, hệ thống sẽ tạo mới với tên: <b>Xe phơi vải {startCartNumber || "X"}</b>
        </div>
      </div>
      <div className="sm:col-span-2">
        {/* Preset nhanh */}
        <div className="text-sm text-slate-600 mb-2">Chọn nhanh thời lượng</div>
        <div className="flex flex-wrap gap-2">
          {[10, 20, 30, 45, 60].map((m) => (
            <button
              key={m}
              onClick={() => setHhmm({ hours: Math.floor(m/60), minutes: m % 60 })}
              className="px-3 py-1.5 rounded-lg border bg-white text-slate-800 border-slate-300 hover:bg-slate-50"
            >
              {m}’
            </button>
          ))}
        </div>
      </div>
    </div>

 {/* Mã hàng  Chuyền in */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
   <div>
     <div className="text-sm text-slate-600 mb-1">Mã hàng</div>
     <input
       value={startProductCode}
       onChange={(e) => setStartProductCode(e.target.value)}
       placeholder="VD: MH-ABC-001"
       className="w-full rounded-xl border border-slate-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
     />
   </div>
   <div>
     <div className="text-sm text-slate-600 mb-1">Chuyền in</div>
     <input
       value={startPrintLine}
       onChange={(e) => setStartPrintLine(e.target.value)}
       placeholder="VD: Chuyền 1A"
       className="w-full rounded-xl border border-slate-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
     />
   </div>
 </div>

          {/* H:M Picker */}
          <div>
            <div className="text-sm text-slate-600 mb-2">
              Hoặc nhập Giờ:Phút (ví dụ 01:30 là 1 giờ 30 phút)
            </div>
            <HhMmPicker
              hours={hhmm.hours}
              minutes={hhmm.minutes}
              onChange={setHhmm}
              maxHours={23}
            />
            <div className="mt-1 text-xs text-slate-500">
              Tổng thời lượng: <b>{(hhmm.hours*60 + hhmm.minutes)} phút</b>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
              onClick={() => setOpenStartModal(false)}
              disabled={startLoading}
            >
              Huỷ
            </button>
            <button
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 inline-flex items-center gap-2 disabled:opacity-60"
              onClick={() => beginStart(false)}
              disabled={startLoading}
            >
              {startLoading ? <FiRefreshCw className="animate-spin" /> : null}
              Bắt đầu
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Cart Modal */}
      <Modal open={openAddModal} title="Thêm xe phơi vải" onClose={() => setOpenAddModal(false)}>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="text-sm mb-1">Số xe (bắt buộc)</div>
              <input
                type="number"
                value={newCartNumber}
                onChange={(e) => setNewCartNumber(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <div className="text-sm mb-1">Tên hiển thị (tuỳ chọn)</div>
              <input
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <button className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200" onClick={() => setOpenAddModal(false)}>Đóng</button>
            <button
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={async () => {
                await addCart(newCartNumber, newDisplayName);
                setOpenAddModal(false);
                setNewCartNumber("");
                setNewDisplayName("");
              }}
            >
              Lưu
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Cart Modal */}
      <Modal open={openEditCartModal} title={`Sửa xe #${editCart?.cartNumber || ""}`} onClose={() => setOpenEditCartModal(false)}>
        <div className="space-y-3">
          <div>
            <div className="text-sm mb-1">Tên hiển thị</div>
            <input
              value={editCart?.displayName || ""}
              onChange={(e) => setEditCart({ ...editCart, displayName: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <button className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200" onClick={() => setOpenEditCartModal(false)}>Huỷ</button>
            <button
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 inline-flex items-center gap-2 disabled:opacity-60"
              onClick={async () => {
                setSavingCart(true);
                await updateCart(editCart.cartId, { displayName: (editCart.displayName || "").trim() || null });
                setSavingCart(false);
                setOpenEditCartModal(false);
              }}
              disabled={savingCart}
            >
              {savingCart ? <FiRefreshCw className="animate-spin" /> : <FiSave className="inline" />}
              <span className="ml-1">Lưu</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Time Modal */}
      <Modal
        open={openEditTimeModal}
        title={`Chỉnh thời gian — Xe #${editTimeCart?.cartNumber || ""}`}
        onClose={() => setOpenEditTimeModal(false)}
      >
        <div className="space-y-4">
          <div className="text-sm text-slate-600">Nhập thời gian còn lại (H:M)</div>
          <HhMmPicker
            hours={editHhmm.hours}
            minutes={editHhmm.minutes}
            onChange={setEditHhmm}
            maxHours={23}
          />
          <div className="mt-1 text-xs text-slate-500">
            Tổng thời lượng: <b>{(editHhmm.hours*60 + editHhmm.minutes)} phút</b>
          </div>

          <div className="flex flex-wrap gap-2">
            {[5,10,15,30].map(m => (
              <button
                key={`set-${m}`}
                onClick={() => setEditHhmm({ hours: Math.floor(m/60), minutes: m%60 })}
                className="px-3 py-1.5 rounded-lg border bg-white text-slate-800 border-slate-300 hover:bg-slate-50 text-sm"
              >
                {m}’
              </button>
            ))}
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
              onClick={() => setOpenEditTimeModal(false)}
              disabled={updatingTime}
            >
              Huỷ
            </button>
            <button
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 inline-flex items-center gap-2 disabled:opacity-60"
              onClick={async () => {
                if (!editTimeCart) return;
                const targetSec = Math.max(0, (editHhmm.hours*60 + editHhmm.minutes) * 60);
                const cur = Math.max(0, editTimeCart.remainingSec || 0);
                const addSec = targetSec - cur;
                setUpdatingTime(true);
                try {
                  await http.post(`/api/drying/extend`, { cartId: editTimeCart.cartId, addSec });
                  await load();
                } finally {
                  setUpdatingTime(false);
                }
                setOpenEditTimeModal(false);
              }}
              disabled={updatingTime}
            >
              {updatingTime ? <FiRefreshCw className="animate-spin" /> : null}
              Cập nhật
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirm delete modal */}
      <ConfirmModal
        open={confirmOpen}
        title="Xác nhận xoá xe"
        message={confirmTarget ? `Bạn có chắc muốn xoá Xe #${confirmTarget.cartNumber}?` : ""}
        onCancel={() => { setConfirmOpen(false); setConfirmTarget(null); }}
        onConfirm={async () => {
          if (confirmTarget) { await deleteCart(confirmTarget.cartId); }
          setConfirmOpen(false); setConfirmTarget(null);
        }}
        confirmLabel="Xoá"
      />

      <ConfirmModal
        open={confirmReplaceOpen}
        title="Xe này đang phơi"
        message={
            replaceCart
            ? `Xe #${replaceCart.cartNumber} đang phơi ở ô ${replaceCart.slotCode}.
        Bạn có muốn huỷ phiên cũ để bắt đầu phiên mới ở ô ${targetSlotId} không?`
            : ""
        }
        onCancel={() => { setConfirmReplaceOpen(false); setReplaceCart(null); }}
        onConfirm={async () => {
            setConfirmReplaceOpen(false);
            await beginStart(true); // forceReplace = true
            setReplaceCart(null);
        }}
        confirmLabel="Đồng ý"
      />

    </div>
  );
}
