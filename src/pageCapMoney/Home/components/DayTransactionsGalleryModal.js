import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiX } from "react-icons/fi";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { apiGetCapMoneyTransactionsByDate } from "../api/capMoneyApi";
import TransactionImageViewerModal from "./TransactionImageViewerModal";

function formatVND(n) {
  const num = Number(n || 0);
  return new Intl.NumberFormat("vi-VN").format(num) + "đ";
}

function formatDayTitle(dateStr) {
  try {
    const d = new Date(dateStr);
    const weekday = new Intl.DateTimeFormat("vi-VN", { weekday: "long" }).format(d);
    const day = d.getDate();
    const month = new Intl.DateTimeFormat("vi-VN", { month: "short" }).format(d); // "thg 3"
    const year = d.getFullYear();
    // Giống mẫu: "Thứ Hai, ngày 30 thg 3, 2026"
    return `${weekday}, ngày ${day} ${month}, ${year}`;
  } catch {
    return dateStr;
  }
}

export default function DayTransactionsGalleryModal({ open, date, accountId, pos, onClose, onChanged }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerTxId, setViewerTxId] = useState(null);

  const title = useMemo(() => formatDayTitle(date), [date]);
  const transactions = data?.transactions || [];
  const totalExpense = Number(data?.totalExpense || 0);
  const totalIncome = Number(data?.totalIncome || 0);

  const onDeleted = (transactionId) => {
    setData((prev) => {
      if (!prev) return prev;
      const nextTx = (prev.transactions || []).filter(
        (t) => String(t.transactionId) !== String(transactionId)
      );
      const nextExpense = nextTx.reduce(
        (sum, t) => sum + (Number(t.transactionTypeId) === 1 ? Number(t.amount || 0) : 0),
        0
      );
      const nextIncome = nextTx.reduce(
        (sum, t) => sum + (Number(t.transactionTypeId) === 2 ? Number(t.amount || 0) : 0),
        0
      );
      return { ...prev, transactions: nextTx, totalExpense: nextExpense, totalIncome: nextIncome };
    });
    onChanged?.();
  };

  useEffect(() => {
    if (!open) return;
    if (!date) return;
    setLoading(true);
    setData(null);
    (async () => {
      try {
        const res = await apiGetCapMoneyTransactionsByDate(date, { accountId });
        if (res?.success) setData(res.data);
        else setData(null);
      } catch (e) {
        console.error("load day gallery error:", e);
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, date, accountId]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[12000] bg-[#f7f2ea] overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="h-full flex flex-col">
            {/* Top area */}
            <div className="shrink-0 px-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="h-10 w-10 rounded-full bg-white/70 ring-1 ring-black/5 grid place-items-center text-slate-700"
                aria-label="Đóng"
              >
                <FiX className="text-[18px]" />
              </button>

              <div className="mt-3 text-center">
                <div className="text-[18px] font-extrabold text-slate-900">{title}</div>
                <div className="text-[13px] text-slate-500 font-semibold mt-1">
                  {`${Math.max(1, Number(pos?.current || 1))} / ${Math.max(1, Number(pos?.total || 1))}`}
                </div>

                <div className="mt-2 flex items-center justify-center gap-2">
                  <div className="inline-flex items-center gap-1.5 text-rose-600 font-extrabold text-[18px] tabular-nums">
                    <ArrowUpRight size={18} className="text-rose-500" />
                    {formatVND(totalExpense)}
                  </div>
                  {totalIncome > 0 ? (
                    <div className="inline-flex items-center gap-1.5 text-emerald-700 font-extrabold text-[14px] tabular-nums">
                      <ArrowDownLeft size={16} className="text-emerald-500" />
                      {formatVND(totalIncome)}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Grid (scrollable) */}
            <div
              className="flex-1 overflow-y-auto px-4 mt-5"
              style={{ paddingBottom: "calc(24px + env(safe-area-inset-bottom))", WebkitOverflowScrolling: "touch" }}
            >
              {loading ? (
                <div className="text-center text-sm text-slate-500 font-semibold">Đang tải...</div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {transactions
                    .filter((t) => t.imageUrl)
                    .map((t) => {
                      const isExpense = Number(t.transactionTypeId) === 1;
                      const amountText = `${isExpense ? "-" : "+"}${formatVND(t.amount)}`;
                      return (
                        <button
                          key={t.transactionId}
                          type="button"
                          onClick={() => {
                            setViewerTxId(t.transactionId);
                            setViewerOpen(true);
                          }}
                          className="relative overflow-hidden rounded-[18px] bg-slate-200 ring-1 ring-black/5 shadow-sm text-left"
                        >
                          <img
                            src={t.imageUrl}
                            alt=""
                            className="w-full aspect-[1/1] object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                          {/* Category chip */}
                          <div className="absolute top-2 left-2">
                            <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-emerald-600 text-white text-[11px] font-extrabold shadow-sm">
                              {t.categoryName || "Khác"}
                            </span>
                          </div>

                          {/* Amount */}
                          <div className="absolute bottom-2 left-2">
                            <span className="text-white text-[13px] font-extrabold drop-shadow tabular-nums">
                              {amountText}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          <TransactionImageViewerModal
            open={viewerOpen}
            onClose={() => setViewerOpen(false)}
            month={String(date || "").slice(0, 7)}
            accountId={accountId}
            initialTransactionId={viewerTxId}
            onTransactionDeleted={onDeleted}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

