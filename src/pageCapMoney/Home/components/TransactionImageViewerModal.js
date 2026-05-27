import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useMotionValue } from "framer-motion";
import {
  FiCalendar,
  FiMoreHorizontal,
  FiX,
  FiImage,
  FiShare,
  FiDownload,
  FiTrash2,
} from "react-icons/fi";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { FiEdit3 } from "react-icons/fi";
import {
  apiDeleteCapMoneyTransaction,
  apiGetCapMoneyCategories,
  apiGetCapMoneyAccounts,
  apiGetCapMoneyTransactionsByMonth,
  apiReplaceCapMoneyTransactionImage,
  apiUpdateCapMoneyTransactionDate,
  apiUpdateCapMoneyTransactionCategory,
  apiUpdateCapMoneyTransactionAccount,
  apiUpdateCapMoneyTransactionAmount,
  apiUpdateCapMoneyTransactionNote,
} from "../api/capMoneyApi";

import {
  FaUtensils,
  FaShoppingBag,
  FaBus,
  FaCoffee,
  FaGamepad,
  FaHeart,
  FaBook,
  FaEllipsisH,
  FaMoneyBillWave,
  FaGift,
} from "react-icons/fa";

function ChangeImageIcon({ className }) {
  // Two stacked image cards: back peeks top-right only
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <defs>
        {/* Only show a small top-right peek of the back card */}
        <clipPath id="cm_peek_tr">
          <rect x="13" y="0.8" width="10.5" height="10.5" rx="3" />
        </clipPath>
      </defs>

      {/* back card (clipped to top-right) */}
      <g clipPath="url(#cm_peek_tr)">
        <rect x="6.2" y="2.6" width="14.2" height="14.2" rx="3.2" />
      </g>

      {/* front card */}
      <rect x="3.2" y="5.2" width="14.2" height="14.2" rx="3.2" />
      <path d="M5.9 16.2l2.7-2.7a1.2 1.2 0 0 1 1.7 0l1.7 1.7 1.3-1.3a1.2 1.2 0 0 1 1.7 0" />
      <path d="M7.5 8.4a1.1 1.1 0 1 0 0.01 0Z" />
    </svg>
  );
}

function ConfirmModal({ open, title, message, confirmText = "Xác nhận", cancelText = "Hủy", danger, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[13040]">
      <button
        type="button"
        className="absolute inset-0 bg-black/20"
        aria-label="Đóng"
        onClick={onCancel}
      />
      <div className="absolute inset-0 grid place-items-center px-6">
        <div className="w-full max-w-[340px] rounded-3xl bg-white/95 backdrop-blur-md ring-1 ring-black/10 shadow-xl overflow-hidden">
          <div className="px-5 pt-5 pb-4 text-center">
            <div className="text-[16px] font-extrabold text-slate-900">{title}</div>
            {message ? <div className="mt-2 text-[13px] font-semibold text-slate-600">{message}</div> : null}
          </div>
          <div className="h-px bg-black/10" />
          <div className="grid grid-cols-2">
            <button
              type="button"
              className="h-12 text-[15px] font-extrabold text-slate-700 hover:bg-black/5"
              onClick={onCancel}
            >
              {cancelText}
            </button>
            <button
              type="button"
              className={[
                "h-12 text-[15px] font-extrabold hover:bg-black/5",
                danger ? "text-rose-600" : "text-slate-900",
              ].join(" ")}
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NoticeModal({ open, message, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[13035]">
      <button type="button" className="absolute inset-0 bg-black/10" aria-label="Đóng" onClick={onClose} />
      <div className="absolute inset-0 grid place-items-center px-6">
        <div className="w-full max-w-[340px] rounded-3xl bg-white/95 backdrop-blur-md ring-1 ring-black/10 shadow-xl overflow-hidden">
          <div className="px-5 py-5 text-center">
            <div className="text-[14px] font-extrabold text-slate-900">{message}</div>
          </div>
          <div className="h-px bg-black/10" />
          <button
            type="button"
            className="w-full h-12 text-[15px] font-extrabold text-slate-900 hover:bg-black/5"
            onClick={onClose}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

function formatVND(n) {
  const num = Number(n || 0);
  return new Intl.NumberFormat("vi-VN").format(num) + "đ";
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function ymdFromDate(d) {
  const dt = d instanceof Date ? d : new Date(d);
  const y = dt.getFullYear();
  const m = pad2(dt.getMonth() + 1);
  const day = pad2(dt.getDate());
  return `${y}-${m}-${day}`;
}

function monthKeyFromDate(d) {
  const dt = d instanceof Date ? d : new Date(d);
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}`;
}

function DatePickerModal({ open, initialDate, onClose, onPick }) {
  const [cursor, setCursor] = useState(() => (initialDate ? new Date(initialDate) : new Date()));
  useEffect(() => {
    if (!open) return;
    setCursor(initialDate ? new Date(initialDate) : new Date());
  }, [open, initialDate]);

  const year = cursor.getFullYear();
  const monthIndex = cursor.getMonth();
  const firstDay = new Date(year, monthIndex, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // Mon-first
  const totalDays = new Date(year, monthIndex + 1, 0).getDate();
  const gridCount = Math.ceil((startOffset + totalDays) / 7) * 7;
  const selected = initialDate ? ymdFromDate(new Date(initialDate)) : null;
  const today = ymdFromDate(new Date());

  const monthTitle = `tháng ${monthIndex + 1} năm ${year}`;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="fixed inset-0 z-[13050]">
          <motion.button
            type="button"
            className="absolute inset-0 bg-black/10"
            onClick={onClose}
            aria-label="Đóng"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="absolute left-0 right-0 bottom-0 rounded-t-3xl bg-white shadow-2xl max-h-[80vh] flex flex-col overflow-hidden sm:left-1/2 sm:right-auto sm:bottom-auto sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[420px] sm:rounded-3xl"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34, mass: 0.9 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.12}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 900) onClose?.();
            }}
          >
            {/* Grabber */}
            <div className="pt-2 pb-2 flex justify-center">
              <div className="h-1.5 w-10 rounded-full bg-slate-200" />
            </div>

            <div className="px-5 pt-1 pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  className="text-[16px] font-extrabold text-pink-300"
                  onClick={() => onPick(today)}
                >
                  Hôm nay
                </button>
                <div className="text-[18px] font-extrabold text-slate-900">Chọn ngày</div>
                <div className="w-16" />
              </div>
            </div>

            <div
              className="px-6 py-4 flex-1 overflow-y-auto"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-[22px] font-extrabold text-slate-900">{monthTitle}</div>
                <div className="flex items-center gap-3 text-pink-300">
                  <button
                    type="button"
                    className="h-12 w-12 rounded-full bg-pink-50 grid place-items-center"
                    onClick={() => setCursor(new Date(year, monthIndex - 1, 1))}
                    aria-label="Tháng trước"
                  >
                    <FiChevronLeft className="text-[22px] text-pink-300" />
                  </button>
                  <button
                    type="button"
                    className="h-12 w-12 rounded-full bg-pink-50 grid place-items-center"
                    onClick={() => setCursor(new Date(year, monthIndex + 1, 1))}
                    aria-label="Tháng sau"
                  >
                    <FiChevronRight className="text-[22px] text-pink-300" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 text-center text-[12px] font-extrabold text-slate-300 mb-3">
                {["TH 2", "TH 3", "TH 4", "TH 5", "TH 6", "TH 7", "CN"].map((h) => (
                  <div key={h}>{h}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 text-center gap-y-5">
                {Array.from({ length: gridCount }).map((_, i) => {
                  const dayNum = i - startOffset + 1;
                  if (dayNum < 1 || dayNum > totalDays) return <div key={i} />;
                  const dayStr = `${year}-${pad2(monthIndex + 1)}-${pad2(dayNum)}`;
                  const isSelected = selected === dayStr;
                  const isToday = today === dayStr;
                  return (
                    <button
                      key={dayStr}
                      type="button"
                      onClick={() => onPick(dayStr)}
                      className={[
                        "h-10 w-10 mx-auto rounded-full text-[20px] font-extrabold",
                        isSelected ? "bg-pink-100 text-pink-400" : "text-slate-900",
                        isToday && !isSelected ? "text-pink-300" : "",
                      ].join(" ")}
                    >
                      {dayNum}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="shrink-0" style={{ height: "calc(16px + env(safe-area-inset-bottom))" }} />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function CategoryIcon({ name, color, selected }) {
  const key = String(name || "").toLowerCase();
  const Icon =
    key.includes("food") || key.includes("ăn") ? FaUtensils :
    key.includes("shopping") || key.includes("mua") ? FaShoppingBag :
    key.includes("car") || key.includes("bus") || key.includes("di") ? FaBus :
    key.includes("coffee") || key.includes("cà") ? FaCoffee :
    key.includes("gamepad") || key.includes("giải") ? FaGamepad :
    key.includes("health") || key.includes("sức") ? FaHeart :
    key.includes("education") || key.includes("giáo") ? FaBook :
    key.includes("salary") || key.includes("lương") ? FaMoneyBillWave :
    key.includes("gift") || key.includes("quà") ? FaGift :
    FaEllipsisH;

  const base = color || "#94A3B8";
  const hexToRgba = (hex, a) => {
    const h = String(hex || "").replace("#", "").trim();
    if (h.length !== 6) return `rgba(148,163,184,${a})`;
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
  };

  // normal: pastel bg + filled icon by categoryColor
  // selected: green bg + white icon
  const bg = selected ? "#22C55E" : hexToRgba(base, 0.22);
  const fg = selected ? "#FFFFFF" : base;
  return (
    <div
      className="h-14 w-14 rounded-full grid place-items-center shadow-sm ring-1 ring-black/5"
      style={{ backgroundColor: bg }}
    >
      <Icon size={22} style={{ color: fg }} className="drop-shadow-sm" />
    </div>
  );
}

function CategoryPickerModal({ open, transactionTypeId, selectedCategoryId, onClose, onPick }) {
  const [tab, setTab] = useState(transactionTypeId === 2 ? "INCOME" : "EXPENSE"); // EXPENSE|INCOME
  const [loading, setLoading] = useState(false);
  const [cats, setCats] = useState([]);

  useEffect(() => {
    if (!open) return;
    setTab(transactionTypeId === 2 ? "INCOME" : "EXPENSE");
  }, [open, transactionTypeId]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    (async () => {
      try {
        const res = await apiGetCapMoneyCategories(tab);
        setCats(res?.success ? res.data || [] : []);
      } catch (e) {
        console.error("load categories picker error:", e);
        setCats([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, tab]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="fixed inset-0 z-[13060]">
          <motion.button
            type="button"
            className="absolute inset-0 bg-black/10"
            onClick={onClose}
            aria-label="Đóng"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="absolute left-0 right-0 bottom-0 rounded-t-3xl bg-[#f7f2ea] shadow-2xl h-[52vh] flex flex-col overflow-hidden sm:left-1/2 sm:right-auto sm:bottom-auto sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[520px] sm:rounded-3xl sm:h-auto sm:max-h-[80vh]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34, mass: 0.9 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.12}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 900) onClose?.();
            }}
          >
            <div className="pt-2 pb-2 flex justify-center">
              <div className="h-1.5 w-10 rounded-full bg-slate-200" />
            </div>

            <div className="px-5 pb-3">
              <div className="relative flex items-center justify-center">
                <div className="text-[22px] font-bold text-slate-900">Chọn danh mục</div>
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-0 top-0 h-10 w-10 rounded-full bg-black/5 grid place-items-center text-slate-700"
                  aria-label="Đóng"
                >
                  <FiX className="text-[18px]" />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 bg-black/5 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setTab("EXPENSE")}
                  className={[
                    "h-10 rounded-lg text-[15px] font-extrabold",
                    tab === "EXPENSE" ? "bg-white text-slate-900 shadow-sm" : "text-slate-700",
                  ].join(" ")}
                >
                  Chi tiêu
                </button>
                <button
                  type="button"
                  onClick={() => setTab("INCOME")}
                  className={[
                    "h-10 rounded-lg text-[15px] font-extrabold",
                    tab === "INCOME" ? "bg-white text-slate-900 shadow-sm" : "text-slate-700",
                  ].join(" ")}
                >
                  Thu nhập
                </button>
              </div>
            </div>

            <div
              className="px-6 pb-8 flex-1 overflow-y-auto"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {loading ? (
                <div className="py-10 text-center text-slate-500 font-semibold">Đang tải...</div>
              ) : (
                <div className="grid grid-cols-4 gap-y-6">
                  {cats.map((c) => (
                    <button
                      key={c.categoryId}
                      type="button"
                      onClick={() => onPick?.(c)}
                      className="flex flex-col items-center"
                    >
                      <CategoryIcon
                        name={c.categoryIcon || c.categoryName}
                        color={c.categoryColor}
                        selected={String(c.categoryId) === String(selectedCategoryId)}
                      />
                      <div className="mt-2 text-[13px] font-bold text-slate-800 text-center leading-tight">
                        {c.categoryName}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="shrink-0" style={{ height: "calc(16px + env(safe-area-inset-bottom))" }} />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
function formatDateTimeVi(d) {
  try {
    const date = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(date.getTime())) return "";
    const hh = pad2(date.getHours());
    const mm = pad2(date.getMinutes());
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    // giống mẫu: "15:53 ngày 30 tháng 3, 2026"
    return `${hh}:${mm} ngày ${day} tháng ${month}, ${year}`;
  } catch {
    return "";
  }
}

function AccountPickerModal({ open, selectedAccountId, onClose, onPick }) {
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    (async () => {
      try {
        const res = await apiGetCapMoneyAccounts();
        setAccounts(res?.success ? res.data || [] : []);
      } catch (e) {
        console.error("load accounts picker error:", e);
        setAccounts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="fixed inset-0 z-[13070]">
          <motion.button
            type="button"
            className="absolute inset-0 bg-black/10"
            onClick={onClose}
            aria-label="Đóng"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="absolute left-0 right-0 bottom-0 rounded-t-3xl bg-[#f7f2ea] shadow-2xl h-[44vh] flex flex-col overflow-hidden sm:left-1/2 sm:right-auto sm:bottom-auto sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[520px] sm:rounded-3xl sm:h-auto sm:max-h-[70vh]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34, mass: 0.9 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.12}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 900) onClose?.();
            }}
          >
            <div className="pt-2 pb-2 flex justify-center">
              <div className="h-1.5 w-10 rounded-full bg-slate-200" />
            </div>

            <div className="px-5 pb-3">
              <div className="relative flex items-center justify-center">
                <div className="text-[22px] font-bold text-slate-900">Chọn tài khoản</div>
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-0 top-0 h-10 w-10 rounded-full bg-black/5 grid place-items-center text-slate-700"
                  aria-label="Đóng"
                >
                  <FiX className="text-[18px]" />
                </button>
              </div>
            </div>

            <div className="px-6 pb-8 pt-2 flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: "touch" }}>
              {loading ? (
                <div className="py-10 text-center text-slate-500 font-semibold">Đang tải...</div>
              ) : (
                <div className="space-y-3">
                  {accounts.map((a) => {
                    const active = String(a.accountId) === String(selectedAccountId);
                    const isBank = String(a.accountType || "").toLowerCase() === "bank";
                    const iconBg = isBank ? "bg-blue-100" : "bg-emerald-100";
                    const iconFg = isBank ? "text-blue-700" : "text-emerald-700";
                    const currency = a.currencyCode || "VND";
                    return (
                      <button
                        key={a.accountId}
                        type="button"
                        onClick={() => onPick?.(a)}
                        className={[
                          "w-full rounded-3xl px-4 py-3 flex items-center justify-between text-left",
                          active ? "ring-2 ring-emerald-500 bg-emerald-50/50" : "bg-white/70 ring-1 ring-black/5",
                        ].join(" ")}
                      >
                        <div className="flex items-center gap-3">
                          <div className={["h-14 w-14 rounded-2xl grid place-items-center font-black", iconBg, iconFg].join(" ")}>
                            <span className="text-[22px] leading-none">
                              {a.accountIcon ? String(a.accountIcon).slice(0, 2) : isBank ? "🏛️" : "💼"}
                            </span>
                          </div>
                          <div>
                            <div className="text-[18px] font-extrabold text-slate-900">{a.accountName}</div>
                            <div className="text-[13px] font-bold text-slate-400">{currency}</div>
                          </div>
                        </div>
                        <div className={active ? "h-8 w-8 rounded-full bg-pink-100 grid place-items-center" : "h-8 w-8"}>{active ? "✓" : ""}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="shrink-0" style={{ height: "calc(16px + env(safe-area-inset-bottom))" }} />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function AmountEditModal({ open, initialAmount, onClose, onSave }) {
  const [raw, setRaw] = useState("0");
  useEffect(() => {
    if (!open) return;
    const n = Number(initialAmount || 0);
    setRaw(String(Math.max(0, Math.trunc(n))));
  }, [open, initialAmount]);

  const append = (ch) => setRaw((v) => (v === "0" ? String(ch) : String(v) + String(ch)));
  const backspace = () => setRaw((v) => (v.length <= 1 ? "0" : v.slice(0, -1)));
  const clear = () => setRaw("0");
  const num = Number(raw || 0);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="fixed inset-0 z-[13080]">
          <motion.button
            type="button"
            className="absolute inset-0 bg-black/10"
            onClick={onClose}
            aria-label="Đóng"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="absolute left-0 right-0 bottom-0 bg-white shadow-2xl max-h-[85vh] flex flex-col overflow-hidden sm:left-1/2 sm:right-auto sm:bottom-auto sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[420px] sm:rounded-3xl"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34, mass: 0.9 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.12}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 900) onClose?.();
            }}
          >
            <div className="pt-2 pb-2 flex justify-center">
              <div className="h-1.5 w-10 rounded-full bg-slate-200" />
            </div>

            <div className="px-5 pb-3 flex items-center justify-between">
              <div className="text-[22px] font-bold text-slate-900">Số tiền</div>
              <button
                type="button"
                className="h-10 px-5 rounded-full bg-emerald-500 text-white font-extrabold"
                onClick={() => onSave?.(num)}
              >
                Xong
              </button>
            </div>

            <div className="px-5 pb-4">
              <div className="h-14 rounded-2xl bg-slate-50 ring-1 ring-slate-200 flex items-center px-4">
                <div className="text-[22px] font-extrabold text-slate-600 mr-2">đ</div>
                <div className="text-[28px] font-extrabold text-slate-900 tabular-nums">
                  {new Intl.NumberFormat("vi-VN").format(num)}
                </div>
              </div>
            </div>

            <div className="px-5 pb-4 flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: "touch" }}>
              <div className="grid grid-cols-3 gap-3">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
                  <button
                    key={d}
                    type="button"
                    className="h-14 rounded-2xl bg-slate-100 text-[22px] font-extrabold text-slate-900"
                    onClick={() => append(d)}
                  >
                    {d}
                  </button>
                ))}
                <button type="button" className="h-14 rounded-2xl bg-slate-100 text-[18px] font-extrabold" onClick={clear}>
                  C
                </button>
                <button type="button" className="h-14 rounded-2xl bg-slate-100 text-[22px] font-extrabold" onClick={() => append("0")}>
                  0
                </button>
                <button type="button" className="h-14 rounded-2xl bg-slate-100 text-[20px] font-extrabold" onClick={backspace}>
                  ⌫
                </button>
              </div>
            </div>

            <div style={{ height: "calc(10px + env(safe-area-inset-bottom))" }} />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

// Note is edited inline (focus input to show keyboard)

export default function TransactionImageViewerModal({
  open,
  month,
  accountId,
  initialTransactionId,
  onTransactionDeleted,
  onClose,
}) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [idx, setIdx] = useState(0);
  const [viewportW, setViewportW] = useState(0);
  const sliderRef = useRef(null);
  const x = useMotionValue(0);
  const [displayIdx, setDisplayIdx] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmPayload, setConfirmPayload] = useState(null); // { transactionId }
  const fileInputRef = useRef(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [accountPickerOpen, setAccountPickerOpen] = useState(false);
  const [amountEditOpen, setAmountEditOpen] = useState(false);
  const [noteEditing, setNoteEditing] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const noteInputRef = useRef(null);

  const total = items.length || 0;
  const currentItem = items[idx] || null;

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 1600);
  };

  const showNotice = (message) => {
    setToast(null);
    setNoticeOpen(true);
    setToast(message); // reuse storage for message
  };

  const buildShareText = (t) => {
    if (!t) return "";
    const isExpense = Number(t.transactionTypeId) === 1;
    const typeLabel = isExpense ? "Chi tiêu" : "Thu nhập";
    const sign = isExpense ? "-" : "+";
    const dateText = t.transactionDate ? `lúc ${formatDateTimeVi(t.transactionDate)}` : "";
    return `💰 ${typeLabel}: ${sign}${formatVND(t.amount)}
📁 Danh mục: ${t.categoryName || "Khác"}
📅 Ngày: ${dateText}

— Sent from CapMoney`;
  };

  const fetchImageFile = async (imageUrl, fileNameBase = "capmoney") => {
    if (!imageUrl) return null;
    const resp = await fetch(imageUrl, { mode: "cors" });
    const blob = await resp.blob();
    const ext = blob.type?.includes("png") ? "png" : "jpg";
    return new File([blob], `${fileNameBase}.${ext}`, { type: blob.type || "image/jpeg" });
  };

  const saveNoteInline = async () => {
    const t = currentItem;
    if (!t?.transactionId) return;
    const next = String(noteDraft || "").trim();
    if (String(t.detailNote || "").trim() === next) {
      setNoteEditing(false);
      return;
    }
    try {
      setBusy(true);
      const res = await apiUpdateCapMoneyTransactionNote(t.transactionId, { detailNote: next });
      if (!res?.success) throw new Error(res?.message || "Cập nhật ghi chú thất bại");
      setItems((prev) =>
        prev.map((x) =>
          String(x.transactionId) === String(t.transactionId) ? { ...x, detailNote: next } : x
        )
      );
      setNoteEditing(false);
    } catch (err) {
      console.error("update note error:", err);
      showNotice("Cập nhật ghi chú thất bại. Vui lòng thử lại.");
      setNoteEditing(false);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    if (!month) return;
    setLoading(true);
    setItems([]);
    (async () => {
      try {
        const res = await apiGetCapMoneyTransactionsByMonth(month, { accountId });
        const list = res?.success ? res.data || [] : [];
        setItems(list);
        const startIndex = initialTransactionId
          ? Math.max(0, list.findIndex((x) => String(x.transactionId) === String(initialTransactionId)))
          : 0;
        const s = startIndex >= 0 ? startIndex : 0;
        setIdx(s);
        setDisplayIdx(s);
      } catch (e) {
        console.error("load month images error:", e);
        setItems([]);
        setIdx(0);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, month, accountId, initialTransactionId]);

  const clampIndex = (n) => Math.min(Math.max(Number(n) || 0, 0), Math.max(0, items.length - 1));
  // Each slide is exactly 1 viewport width (next is hidden).
  const span = viewportW || 0;
  const slideW = span;

  // Keep x in sync when idx changes
  useEffect(() => {
    if (!open) return;
    if (!span) return;
    const controls = animate(x, -idx * span, {
      type: "spring",
      stiffness: 320,
      damping: 34,
      mass: 0.95,
    });
    return () => controls.stop();
  }, [idx, span, open, x]);

  // Update display index while dragging (so date label changes)
  useEffect(() => {
    if (!open) return;
    if (!span) return;
    const unsub = x.on("change", (v) => {
      const near = clampIndex(Math.round(-v / span));
      setDisplayIdx(near);
    });
    return () => unsub();
  }, [open, span, x, items.length]);

  useEffect(() => {
    if (!open) return;
    // sliderRef chỉ có sau khi render list ảnh -> phụ thuộc items.length
    const el = sliderRef.current;
    if (!el) return;

    const update = () => {
      const w = el.getBoundingClientRect?.().width || 0;
      if (w > 0) setViewportW(w);
    };

    // đo sau paint (tránh 0px khi mới mount)
    const raf = requestAnimationFrame(update);

    let ro;
    try {
      ro = new ResizeObserver(() => update());
      ro.observe(el);
    } catch {
      // ignore
    }
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", update);
      try {
        ro?.disconnect?.();
      } catch {}
    };
  }, [open, items.length]);

  return (
    open ? (
      <motion.div
        className="fixed inset-0 z-[13000] bg-[#f7f2ea] overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
          {/* Top bar */}
          <div className="px-4 pt-4 flex items-center justify-between">
            <div className="flex items-center gap-3 text-slate-700">
              <button
                type="button"
                className="h-10 w-10 rounded-full bg-white/70 ring-1 ring-black/5 grid place-items-center"
                aria-label="Menu"
                onClick={() => setMenuOpen((v) => !v)}
              >
                <FiMoreHorizontal className="text-[18px]" />
              </button>
              <button
                type="button"
                className="h-10 w-10 rounded-full bg-white/70 ring-1 ring-black/5 grid place-items-center"
                aria-label="Đổi ảnh"
                onClick={() => fileInputRef.current?.click()}
              >
                <ChangeImageIcon className="h-6 w-6" />
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="h-10 w-10 rounded-full bg-white/70 ring-1 ring-black/5 grid place-items-center text-slate-700"
              aria-label="Đóng"
            >
              <FiX className="text-[18px]" />
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              const t = currentItem;
              if (!file || !t) return;
              try {
                setBusy(true);
                const fd = new FormData();
                fd.append("image", file, file.name);
                const res = await apiReplaceCapMoneyTransactionImage(t.transactionId, fd);
                if (!res?.success) throw new Error(res?.message || "Đổi ảnh thất bại");
                const newUrl = res?.data?.imageUrl;
                if (newUrl) {
                  setItems((prev) =>
                    prev.map((x) =>
                      String(x.transactionId) === String(t.transactionId) ? { ...x, imageUrl: newUrl } : x
                    )
                  );
                  showNotice("Đã đổi ảnh.");
                }
              } catch (err) {
                console.error("replace image error:", err);
                showNotice("Đổi ảnh thất bại. Vui lòng thử lại.");
              } finally {
                setBusy(false);
              }
            }}
          />

          {/* Action sheet like iOS */}
          {menuOpen && (
            <div className="fixed inset-0 z-[13020]">
              <button
                type="button"
                className="absolute inset-0 bg-black/0"
                aria-label="Đóng menu"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute left-4 top-[64px] w-[265px] rounded-2xl overflow-hidden bg-white/90 backdrop-blur-md ring-1 ring-black/10 shadow-xl">
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    try {
                      setBusy(true);
                      const t = currentItem;
                      if (!t) return;
                      const text = buildShareText(t);
                      const canWebShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

                      if (canWebShare && t.imageUrl) {
                        let file = null;
                        try {
                          file = await fetchImageFile(t.imageUrl, `capmoney_${t.transactionId}`);
                        } catch {}

                        // REQUIRE share image file (not link)
                        if (!file) {
                          showNotice("Không tải được ảnh để chia sẻ. Kiểm tra CORS /uploads.");
                          return;
                        }
                        if (!navigator.canShare?.({ files: [file] })) {
                          showNotice("Thiết bị chưa hỗ trợ chia sẻ kèm ảnh.");
                          return;
                        }
                        await navigator.share({ title: "CapMoney", text, files: [file] });
                      } else if (canWebShare) {
                        await navigator.share({ title: "CapMoney", text });
                      } else {
                        const fallback = `${text}${t.imageUrl ? `\n\n${t.imageUrl}` : ""}`;
                        await navigator.clipboard?.writeText?.(fallback);
                        showNotice("Đã copy nội dung chia sẻ.");
                      }
                    } catch {
                      // ignore cancel
                    } finally {
                      setBusy(false);
                      setMenuOpen(false);
                    }
                  }}
                  className="w-full h-12 px-4 flex items-center justify-between text-[16px] font-semibold text-slate-900 hover:bg-black/5 disabled:opacity-60"
                >
                  <span>Chia sẻ đến</span>
                  <FiShare className="text-[18px]" />
                </button>
                <div className="h-px bg-black/10" />
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    try {
                      setBusy(true);
                      const t = currentItem;
                      if (!t?.imageUrl) return;
                      // Lưu = tải ảnh về thiết bị (ưu tiên download)
                      try {
                        const resp = await fetch(t.imageUrl, { mode: "cors" });
                        const blob = await resp.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `capmoney_${t.transactionId}.jpg`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        URL.revokeObjectURL(url);
                        showNotice("Đã tải ảnh.");
                      } catch {
                        window.open(t.imageUrl, "_blank", "noopener,noreferrer");
                        showNotice("Không tải được trực tiếp. Đã mở ảnh để bạn lưu thủ công.");
                      }
                    } catch (e) {
                      console.error("download image error:", e);
                    } finally {
                      setBusy(false);
                      setMenuOpen(false);
                    }
                  }}
                  className="w-full h-12 px-4 flex items-center justify-between text-[16px] font-semibold text-slate-900 hover:bg-black/5 disabled:opacity-60"
                >
                  <span>Lưu vào Ảnh</span>
                  <FiDownload className="text-[18px]" />
                </button>
                <div className="h-px bg-black/10" />
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    const t = currentItem;
                    if (!t) return;
                    setConfirmPayload({ transactionId: t.transactionId });
                    setConfirmOpen(true);
                    setMenuOpen(false);
                  }}
                  className="w-full h-12 px-4 flex items-center justify-between text-[16px] font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                >
                  <span>Xóa giao dịch</span>
                  <FiTrash2 className="text-[18px]" />
                </button>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="h-full flex flex-col">
            <div className="mt-24 w-full flex-1 flex justify-center">
              {loading ? (
                <div className="text-slate-500 font-semibold">Đang tải...</div>
              ) : items.length ? (
                <div ref={sliderRef} className="relative w-full overflow-hidden">
                  <motion.div
                    className="flex"
                    style={{ x }}
                    drag="x"
                    dragConstraints={{
                      left: span ? -span * (Math.max(0, items.length - 1)) : 0,
                      right: 0,
                    }}
                    dragElastic={0.18}
                    onDragEnd={(_, info) => {
                      const threshold = Math.min(90, Math.max(50, (viewportW || 0) * 0.18));
                      if (info.offset.x < -threshold) setIdx((v) => clampIndex(v + 1));
                      else if (info.offset.x > threshold) setIdx((v) => clampIndex(v - 1));
                      else {
                        // snap back to current
                        if (span) animate(x, -idx * span, { type: "spring", stiffness: 320, damping: 34, mass: 0.95 });
                      }
                    }}
                  >
                    {items.map((it) => (
                      <div
                        key={it.transactionId}
                        className="shrink-0"
                        style={{ width: slideW || "100%" }}
                      >
                        <div className="px-6">
                          {/* Datetime pill (moves with slide) */}
                          <div className="flex justify-center mb-4 -mt-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDatePickerOpen(true);
                              }}
                              className="inline-flex items-center gap-2 h-9 px-4 rounded-2xl bg-white/70 ring-1 ring-black/5 text-slate-700 font-semibold text-[13px]"
                            >
                              <FiCalendar className="text-[15px] opacity-80" />
                              {it?.transactionDate ? `lúc ${formatDateTimeVi(it.transactionDate)}` : ""}
                            </button>
                          </div>

                          <div className="relative overflow-hidden rounded-[28px] bg-slate-200 ring-1 ring-black/5 shadow-lg">
                          <img src={it.imageUrl} alt="" className="w-full aspect-[1/1] object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/35" />

                          {/* Chips */}
                          <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center justify-center gap-2 w-full px-4">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setCategoryPickerOpen(true);
                              }}
                              className="inline-flex items-center h-8 px-4 rounded-full bg-emerald-700/90 text-white text-[13px] font-extrabold shadow-sm"
                            >
                              {it.categoryName || "Khác"}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setAccountPickerOpen(true);
                              }}
                              className="inline-flex items-center h-8 px-4 rounded-full bg-emerald-700/90 text-white text-[13px] font-extrabold shadow-sm"
                            >
                              {it.accountName || "Tài khoản"}
                            </button>
                          </div>

                          {/* Amount */}
                          <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center">
                            <div className="w-[min(360px,calc(100vw-72px))] px-6 py-3 rounded-[28px] bg-black/35 backdrop-blur-[2px]">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setAmountEditOpen(true);
                                }}
                                className="w-full"
                              >
                                <div className="text-white text-[34px] font-extrabold tracking-wide tabular-nums drop-shadow flex items-center justify-center gap-2">
                                  <span className={Number(it.transactionTypeId) === 1 ? "text-rose-400" : "text-emerald-300"}>
                                    {Number(it.transactionTypeId) === 1 ? "-" : "+"}
                                  </span>
                                  <span>{formatVND(it.amount)}</span>
                                </div>
                              </button>

                              <div className="mt-1">
                                {noteEditing && String(currentItem?.transactionId) === String(it.transactionId) ? (
                                  <input
                                    ref={noteInputRef}
                                    value={noteDraft}
                                    onChange={(e) => setNoteDraft(e.target.value)}
                                    onBlur={() => saveNoteInline()}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        saveNoteInline();
                                      }
                                      if (e.key === "Escape") {
                                        setNoteEditing(false);
                                      }
                                    }}
                                    enterKeyHint="done"
                                    className="w-full bg-transparent text-[13px] font-semibold text-white/90 drop-shadow text-center outline-none placeholder:text-white/55"
                                    placeholder="Thêm ghi chú"
                                    maxLength={1000}
                                  />
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setNoteDraft(String(it.detailNote || ""));
                                      setNoteEditing(true);
                                      setTimeout(() => noteInputRef.current?.focus?.(), 0);
                                    }}
                                    className="w-full text-[13px] font-semibold text-white/90 drop-shadow text-center truncate"
                                  >
                                    {String(it.detailNote || "").trim() ? (
                                      String(it.detailNote).trim()
                                    ) : (
                                      <span className="inline-flex items-center justify-center gap-2 text-white/55">
                                        <FiEdit3 className="text-[14px]" />
                                        <span>Thêm ghi chú</span>
                                      </span>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                </div>
              ) : (
                <div className="text-slate-500 font-semibold">Không có ảnh</div>
              )}
            </div>

            {/* Bottom counter */}
            <div className="fixed left-1/2 -translate-x-1/2 z-[13010]" style={{ bottom: "calc(18px + env(safe-area-inset-bottom))" }}>
              <div className="inline-flex items-center h-9 px-4 rounded-full bg-black/40 backdrop-blur-[2px] text-white text-[13px] font-extrabold tabular-nums shadow-sm">
                <FiImage className="text-[15px] mr-2 opacity-90" />
                {total ? `${idx + 1}/${total}` : "0/0"}
              </div>
            </div>
          </div>

          <NoticeModal
            open={noticeOpen}
            message={toast || ""}
            onClose={() => {
              setNoticeOpen(false);
              setToast(null);
            }}
          />

          <ConfirmModal
            open={confirmOpen}
            title="Xóa giao dịch"
            message="Bạn chắc chắn muốn xóa giao dịch này?"
            confirmText="Xóa"
            cancelText="Hủy"
            danger
            onCancel={() => {
              setConfirmOpen(false);
              setConfirmPayload(null);
            }}
            onConfirm={async () => {
              const id = confirmPayload?.transactionId;
              if (!id) return;
              try {
                setBusy(true);
                const res = await apiDeleteCapMoneyTransaction(id);
                if (!res?.success) throw new Error(res?.message || "Xóa thất bại");
                setItems((prev) => prev.filter((x) => String(x.transactionId) !== String(id)));
                setIdx((v) => Math.max(0, Math.min(v, Math.max(0, items.length - 2))));
                setDisplayIdx((v) => Math.max(0, Math.min(v, Math.max(0, items.length - 2))));
                onTransactionDeleted?.(id);
              } catch (e) {
                console.error("delete transaction error:", e);
                showNotice("Xóa thất bại. Vui lòng thử lại.");
              } finally {
                setBusy(false);
                setConfirmOpen(false);
                setConfirmPayload(null);
              }
            }}
          />

          <DatePickerModal
            open={datePickerOpen}
            initialDate={currentItem?.transactionDate || null}
            onClose={() => setDatePickerOpen(false)}
            onPick={async (dayStr) => {
              const t = currentItem;
              if (!t) return;
              try {
                setBusy(true);
                const res = await apiUpdateCapMoneyTransactionDate(t.transactionId, { transactionDate: dayStr });
                if (!res?.success) throw new Error(res?.message || "Cập nhật ngày thất bại");
                setDatePickerOpen(false);

                // Refetch month list (order & visibility may change)
                const res2 = await apiGetCapMoneyTransactionsByMonth(monthKeyFromDate(new Date(dayStr)), { accountId });
                const list = res2?.success ? res2.data || [] : [];
                setItems(list);
                const newIndex = list.findIndex((x) => String(x.transactionId) === String(t.transactionId));
                const s = newIndex >= 0 ? newIndex : 0;
                setIdx(s);
                setDisplayIdx(s);
              } catch (err) {
                console.error("update date error:", err);
                showNotice("Cập nhật ngày thất bại. Vui lòng thử lại.");
              } finally {
                setBusy(false);
              }
            }}
          />

          <CategoryPickerModal
            open={categoryPickerOpen}
            transactionTypeId={currentItem?.transactionTypeId}
            selectedCategoryId={currentItem?.categoryId}
            onClose={() => setCategoryPickerOpen(false)}
            onPick={async (c) => {
              const t = currentItem;
              if (!t?.transactionId || !c?.categoryId) return;
              try {
                setBusy(true);
                const res = await apiUpdateCapMoneyTransactionCategory(t.transactionId, { categoryId: c.categoryId });
                if (!res?.success) throw new Error(res?.message || "Cập nhật danh mục thất bại");
                const d = res.data;
                setCategoryPickerOpen(false);
                setItems((prev) =>
                  prev.map((x) =>
                    String(x.transactionId) === String(t.transactionId)
                      ? {
                          ...x,
                          categoryId: d.categoryId,
                          categoryName: d.categoryName,
                          categoryIcon: d.categoryIcon,
                          categoryColor: d.categoryColor,
                          transactionTypeId: d.transactionTypeId,
                        }
                      : x
                  )
                );
              } catch (err) {
                console.error("update category error:", err);
                showNotice("Cập nhật danh mục thất bại. Vui lòng thử lại.");
              } finally {
                setBusy(false);
              }
            }}
          />

          <AccountPickerModal
            open={accountPickerOpen}
            selectedAccountId={currentItem?.accountId}
            onClose={() => setAccountPickerOpen(false)}
            onPick={async (a) => {
              const t = currentItem;
              if (!t?.transactionId || !a?.accountId) return;
              try {
                setBusy(true);
                const res = await apiUpdateCapMoneyTransactionAccount(t.transactionId, { accountId: a.accountId });
                if (!res?.success) throw new Error(res?.message || "Cập nhật tài khoản thất bại");
                setAccountPickerOpen(false);
                const d = res.data;
                setItems((prev) =>
                  prev.map((x) =>
                    String(x.transactionId) === String(t.transactionId)
                      ? { ...x, accountId: d.accountId, accountName: d.accountName }
                      : x
                  )
                );
              } catch (err) {
                console.error("update account error:", err);
                showNotice("Cập nhật tài khoản thất bại. Vui lòng thử lại.");
              } finally {
                setBusy(false);
              }
            }}
          />

          <AmountEditModal
            open={amountEditOpen}
            initialAmount={currentItem?.amount || 0}
            onClose={() => setAmountEditOpen(false)}
            onSave={async (val) => {
              const t = currentItem;
              if (!t?.transactionId) return;
              if (!Number.isFinite(val) || val <= 0) {
                showNotice("Số tiền phải > 0");
                return;
              }
              try {
                setBusy(true);
                const res = await apiUpdateCapMoneyTransactionAmount(t.transactionId, { amount: val });
                if (!res?.success) throw new Error(res?.message || "Cập nhật số tiền thất bại");
                setAmountEditOpen(false);
                setItems((prev) =>
                  prev.map((x) =>
                    String(x.transactionId) === String(t.transactionId) ? { ...x, amount: val } : x
                  )
                );
              } catch (err) {
                console.error("update amount error:", err);
                showNotice("Cập nhật số tiền thất bại. Vui lòng thử lại.");
              } finally {
                setBusy(false);
              }
            }}
          />

          {/* Inline note editing uses keyboard directly; no modal */}
      </motion.div>
    ) : null
  );
}

