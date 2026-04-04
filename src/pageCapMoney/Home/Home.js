import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { userSelector } from "~/redux/selectors";
import { FaUserCircle } from "react-icons/fa";
import {
  Sunrise,
  Sun,
  SunMedium,
  Sunset,
  Moon,
  MoonStar,
  CloudSun,
  Leaf,
  Utensils,
  ShoppingBag,
  Bus,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { FiPlus } from "react-icons/fi";
import { apiGetCapMoneyHomeSummary } from "./api/capMoneyApi";
import MonthCalendar from "./components/MonthCalendar";
import CreateTransactionModal from "./components/CreateTransactionModal";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function ymdFromDate(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function monthKeyFromDate(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

function formatVND(n) {
  const num = Number(n || 0);
  return new Intl.NumberFormat("vi-VN").format(num) + "đ";
}

function getFirstName(fullName) {
  if (!fullName || typeof fullName !== "string") return "";
  const parts = fullName.trim().split(/\s+/);
  return parts.length ? parts[parts.length - 1] : "";
}

function getTodayExpenseIcon(summaryToday) {
  const raw =
    (summaryToday && (summaryToday.mainExpenseType || summaryToday.mainExpenseCategory)) || "";
  const kind = String(raw).toLowerCase();

  if (kind.includes("ăn") || kind.includes("food") || kind.includes("meal")) {
    return <Utensils size={16} className="text-rose-500" aria-hidden />;
  }
  if (kind.includes("đi lại") || kind.includes("xe") || kind.includes("xăng") || kind.includes("travel")) {
    return <Bus size={16} className="text-rose-500" aria-hidden />;
  }
  if (kind.includes("mua sắm") || kind.includes("shopping") || kind.includes("shop")) {
    return <ShoppingBag size={16} className="text-rose-500" aria-hidden />;
  }

  return <Wallet size={16} className="text-rose-500" aria-hidden />;
}

// Khung giờ + icon Lucide (thời tiết / bầu trời) + màu theo “thật” hơn
const TIME_PERIODS = {
  rangSang: {
    key: "rangSang",
    label: "rạng sáng",
    startHour: 4,
    endHour: 6,
    Icon: Sunrise,
    iconClass: "text-rose-400",
  },
  buoiSang: {
    key: "buoiSang",
    label: "buổi sáng",
    startHour: 6,
    endHour: 11,
    Icon: Sun,
    iconClass: "text-amber-400",
  },
  buoiTrua: {
    key: "buoiTrua",
    label: "buổi trưa",
    startHour: 11,
    endHour: 14,
    Icon: CloudSun,
    iconClass: "text-orange-400",
  },
  buoiChieu: {
    key: "buoiChieu",
    label: "buổi chiều",
    startHour: 14,
    endHour: 18,
    Icon: Sunset,
    iconClass: "text-orange-500",
  },
  buoiToi: {
    key: "buoiToi",
    label: "buổi tối",
    startHour: 18,
    endHour: 22,
    Icon: Moon,
    iconClass: "text-indigo-500",
  },
  demKhuya: {
    key: "demKhuya",
    label: "đêm khuya",
    startHour: 22,
    endHour: 4, // wrap qua 0h
    Icon: MoonStar,
    iconClass: "text-violet-400",
  },
};

function getTimePeriodIcon(hour) {
  const h = ((hour % 24) + 24) % 24; // chuẩn hóa 0–23
  const entries = Object.values(TIME_PERIODS);

  for (const cfg of entries) {
    const { startHour, endHour } = cfg;

    if (startHour < endHour) {
      if (h >= startHour && h < endHour) return cfg;
    } else {
      // khoảng wrap (đêm khuya 22–04)
      if (h >= startHour || h < endHour) return cfg;
    }
  }

  // fallback
  return TIME_PERIODS.buoiToi;
}

function getGreeting(hour) {
  const period = getTimePeriodIcon(hour);
  const Icon = period.Icon;

  return {
    label: `Chào ${period.label}`,
    icon: (
      <Icon
        size={20}
        className={["shrink-0 drop-shadow-sm", period.iconClass].filter(Boolean).join(" ")}
        aria-hidden
      />
    ),
  };
}

export default function Home() {
  const tmp = useSelector(userSelector);
  const user = tmp?.login?.currentUser || {};

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => ymdFromDate(today), [today]);

  const [mode, setMode] = useState("month"); // day|month
  const [monthCursor, setMonthCursor] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [accountFilter, setAccountFilter] = useState("all"); // all|wallet|bank

  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState(todayStr);

  const [toast, setToast] = useState(null);

  const greeting = useMemo(() => getGreeting(new Date().getHours()), []);

  const walletExists = useMemo(
    () => (summary?.accounts || []).some((a) => String(a.accountType).toLowerCase() === "wallet"),
    [summary]
  );
  const bankExists = useMemo(
    () => (summary?.accounts || []).some((a) => String(a.accountType).toLowerCase() === "bank"),
    [summary]
  );

  const loadSummary = async () => {
    setLoading(true);
    try {
      const params = { mode };
      if (mode === "month") params.month = monthKeyFromDate(monthCursor);
      else params.date = selectedDate;

      params.accountId = accountFilter; // all|wallet|bank|<id>

      const res = await apiGetCapMoneyHomeSummary(params);
      if (res?.success) setSummary(res.data);
      else setSummary(null);
    } catch (e) {
      console.error("capmoney home load error:", e);
      setSummary(null);
      setToast({ type: "error", message: "Không tải được dữ liệu." });
      setTimeout(() => setToast(null), 1800);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, monthCursor, selectedDate, accountFilter]);

  useEffect(() => {
    if (mode === "day") setSelectedDate(todayStr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const openCreateModal = (dateStr) => {
    const d = dateStr || todayStr;
    setSelectedDate(d);
    // đồng bộ month cursor theo ngày click (để highlight/đổi tháng đúng)
    const y = Number(d.slice(0, 4));
    const m = Number(d.slice(5, 7));
    if (Number.isFinite(y) && Number.isFinite(m)) {
      setMonthCursor(new Date(y, m - 1, 1));
    }
    setModalDate(d);
    setModalOpen(true);
  };

  const onPrevMonth = () => {
    const d = new Date(monthCursor);
    const dayOfMonth = Number(selectedDate.split("-")[2] || "1");
    d.setMonth(d.getMonth() - 1);
    const total = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const nextDay = Math.min(dayOfMonth, total);
    const nextDate = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(nextDay)}`;
    setMonthCursor(d);
    setSelectedDate(nextDate);
  };

  const onNextMonth = () => {
    const d = new Date(monthCursor);
    const dayOfMonth = Number(selectedDate.split("-")[2] || "1");
    d.setMonth(d.getMonth() + 1);
    const total = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const nextDay = Math.min(dayOfMonth, total);
    const nextDate = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(nextDay)}`;
    setMonthCursor(d);
    setSelectedDate(nextDate);
  };

  const summaryToday = summary?.summaryToday || {
    totalExpenseToday: 0,
    totalIncomeToday: 0,
    hasAnyToday: false,
  };
  const summaryPeriod = summary?.summaryPeriod || { totalExpense: 0, totalIncome: 0 };

  const accounts = summary?.accounts || [];

  const monthText = useMemo(() => {
    const y = monthCursor.getFullYear();
    const m = monthCursor.getMonth() + 1;
    return `Tháng ${m}/${y}`;
  }, [monthCursor]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-white pb-28">
      {/* Header block */}
      <div className="px-4 pt-5">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-[15px] font-semibold">
                <span className="text-slate-500">{greeting.label}</span>
                {greeting.icon}
              </div>

              <div className="text-slate-900 font-extrabold text-[22px] truncate">
                {getFirstName(summary?.fullName || user?.fullName || "Người dùng")}
              </div>

              <div className="text-[13px] mt-1 flex items-center gap-2">
                {summaryToday.hasAnyToday ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-pink-50 ring-1 ring-pink-100 px-3 py-1">
                    {getTodayExpenseIcon(summaryToday)}
                    <span className="font-semibold text-rose-600">
                      Chi {formatVND(summaryToday.totalExpenseToday)}
                    </span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 ring-1 ring-emerald-100 px-3 py-1">
                    <Leaf size={16} className="text-emerald-500" aria-hidden />
                    <span className="font-semibold text-emerald-700">
                      Hôm nay chưa chi tiêu
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="shrink-0">
            {summary?.avatar ? (
              <img
                src={summary.avatar}
                alt="avatar"
                className="h-12 w-12 rounded-full object-cover ring-2 ring-pink-200 bg-white"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-white ring-2 ring-pink-200 grid place-items-center">
                <FaUserCircle className="text-pink-600" size={34} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mode toggle + summary */}
      <div className="px-4 mt-4">
        <div className="inline-flex items-center gap-1 justify-center bg-white/80 ring-1 ring-pink-100 rounded-2xl px-1 py-0.5">
          <button
            type="button"
            onClick={() => setMode("day")}
            className={[
              "min-w-[64px] h-8 rounded-2xl px-2 text-[11px] font-semibold transition",
              mode === "day" ? "bg-pink-600 text-white" : "bg-transparent text-slate-700",
            ].join(" ")}
          >
            Ngày
          </button>
          <button
            type="button"
            onClick={() => setMode("month")}
            className={[
              "min-w-[64px] h-8 rounded-2xl px-2 text-[11px] font-semibold transition",
              mode === "month" ? "bg-pink-600 text-white" : "bg-transparent text-slate-700",
            ].join(" ")}
          >
            Tháng
          </button>
        </div>

        {/* Summary cards */}
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {/* Chi */}
          <div className="rounded-3xl bg-white/80 ring-1 ring-pink-100 px-2.5 py-1.5 flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-rose-500 flex items-center justify-center text-white">
              <ArrowUpRight size={14} />
            </div>
            <div className="min-w-0 flex flex-col items-start">
              <div className="text-[15px] font-semibold text-slate-900 tabular-nums leading-tight">
                {formatVND(summaryPeriod.totalExpense || 0)}
              </div>
              <div className="text-[11px] text-slate-500 font-semibold mt-0.5 tracking-wide">
                Chi
              </div>
            </div>
          </div>

          {/* Thu */}
          <div className="rounded-3xl bg-white/80 ring-1 ring-pink-100 px-2.5 py-1.5 flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-emerald-500 flex items-center justify-center text-white">
              <ArrowDownLeft size={14} />
            </div>
            <div className="min-w-0 flex flex-col items-start">
              <div className="text-[15px] font-semibold text-slate-900 tabular-nums leading-tight">
                {formatVND(summaryPeriod.totalIncome || 0)}
              </div>
              <div className="text-[11px] text-slate-500 font-semibold mt-0.5 tracking-wide">
                Thu
              </div>
            </div>
          </div>
        </div>

        {/* Account filter */}
        <div className="mt-3">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1.5">
            {[
              { key: "all", label: "Tất cả" },
              { key: "wallet", label: "Wallet" },
              { key: "bank", label: "Bank" },
            ].map((c) => {
              const disabled =
                c.key === "wallet" ? !walletExists : c.key === "bank" ? !bankExists : false;
              return (
                <button
                  key={c.key}
                  type="button"
                  disabled={disabled}
                  onClick={() => setAccountFilter(c.key)}
                  className={[
                    "px-3.5 h-9 rounded-2xl text-[12px] font-semibold ring-1 transition whitespace-nowrap",
                    c.key === accountFilter
                      ? "bg-pink-600 text-white ring-pink-600"
                      : "bg-white ring-pink-100 text-slate-700 hover:bg-pink-50",
                    disabled ? "opacity-50 cursor-not-allowed" : "",
                  ].join(" ")}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Month picker */}
        <div className="mt-3">
          <div className="flex items-center justify-between bg-white/80 ring-1 ring-pink-100 rounded-2xl px-2 py-1.5">
            <button
              type="button"
              onClick={onPrevMonth}
              className="inline-flex h-8 w-8 items-center justify-center text-slate-700"
              aria-label="Tháng trước"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex-1 text-center text-[13px] font-extrabold text-slate-800">
              {monthText}
            </div>
            <button
              type="button"
              onClick={onNextMonth}
              className="inline-flex h-8 w-8 items-center justify-center text-slate-700"
              aria-label="Tháng sau"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="px-4 mt-3">
        {summary && (
          <div className={loading ? "opacity-60 pointer-events-none transition-opacity" : ""}>
            <MonthCalendar
              monthCursor={monthCursor}
              calendarDays={summary.calendarDays || []}
              selectedDate={selectedDate}
              todayStr={todayStr}
              onOpenCreate={(dateStr) => openCreateModal(dateStr)}
            />
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        type="button"
        onClick={() => openCreateModal(todayStr)}
        className="fixed right-4 z-[10001] h-14 w-14 rounded-full bg-pink-600 text-white shadow-lg shadow-pink-200 grid place-items-center"
        style={{ bottom: "calc(96px + env(safe-area-inset-bottom))" }}
        aria-label="Thêm"
      >
        <FiPlus className="text-[22px]" />
      </button>

      {/* Modal */}
      <CreateTransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialDate={modalDate}
        accounts={accounts}
        onCreated={() => {
          setModalOpen(false);
          loadSummary();
          setToast({ type: "success", message: "Đã lưu giao dịch thành công." });
          setTimeout(() => setToast(null), 1800);
        }}
      />

      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[10002] px-4 py-2 rounded-2xl bg-white/90 ring-1 ring-pink-100 shadow text-pink-700 font-semibold text-sm">
          {toast.message}
        </div>
      )}
    </div>
  );
}
