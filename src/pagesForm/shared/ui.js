// Thành phần giao diện dùng chung cho module Biểu mẫu nội bộ (Tailwind)
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, Info, Loader2, X } from "lucide-react";

export const cn = (...xs) => xs.filter(Boolean).join(" ");

/* ------------------------------- Nút ------------------------------- */
const BTN = {
  primary: "bg-blue-700 text-white hover:bg-blue-800 disabled:bg-blue-300",
  secondary: "bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 disabled:text-slate-400",
  danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300",
  ghost: "text-slate-600 hover:bg-slate-100 disabled:text-slate-300",
};
export function Button({ variant = "primary", size = "md", loading, icon: Icon, className, children, disabled, ...rest }) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed",
        size === "sm" ? "h-8 px-3 text-sm" : "h-10 px-4 text-sm",
        BTN[variant],
        className
      )}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}

export function IconButton({ icon: Icon, title, className, danger, ...rest }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:opacity-40",
        danger ? "text-slate-500 hover:bg-red-50 hover:text-red-600" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800",
        className
      )}
      {...rest}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

/* ----------------------------- Công tắc ----------------------------- */
export function Toggle({ checked, onChange, disabled, label, hint }) {
  return (
    <label className={cn("flex items-start gap-3", disabled ? "opacity-60" : "cursor-pointer")}>
      <button
        type="button"
        role="switch"
        aria-checked={!!checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cn(
          "relative mt-0.5 inline-flex h-5 w-9 shrink-0 rounded-full transition-colors",
          checked ? "bg-blue-600" : "bg-slate-300"
        )}
      >
        <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all", checked ? "left-[18px]" : "left-0.5")} />
      </button>
      {(label || hint) && (
        <span className="min-w-0">
          {label && <span className="block text-sm font-medium text-slate-800">{label}</span>}
          {hint && <span className="block text-xs text-slate-500">{hint}</span>}
        </span>
      )}
    </label>
  );
}

/* ------------------------------ Ô nhập ------------------------------ */
export const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

export function Field({ label, hint, required, children, className }) {
  return (
    <div className={className}>
      {label && (
        <label className="mb-1 block text-sm font-medium text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {children}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function Badge({ tone = "slate", children, className }) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    amber: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
    red: "bg-red-50 text-red-700 ring-1 ring-red-200",
    blue: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  };
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", tones[tone], className)}>{children}</span>;
}

export function Spinner({ label = "Đang tải…" }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
      <Loader2 className="h-5 w-5 animate-spin" /> {label}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, children }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      {Icon && <Icon className="mb-3 h-10 w-10 text-slate-300" />}
      <p className="font-medium text-slate-700">{title}</p>
      {children && <div className="mt-1 text-sm text-slate-500">{children}</div>}
    </div>
  );
}

export function ErrorBox({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl bg-red-50 px-6 py-10 text-center text-sm text-red-700">
      <AlertTriangle className="h-8 w-8" />
      <p>{message}</p>
      {onRetry && <Button variant="secondary" size="sm" onClick={onRetry}>Thử lại</Button>}
    </div>
  );
}

/* ------------------------------ Hộp thoại ------------------------------ */
export function Modal({ open, onClose, title, children, footer, size = "md" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  const width = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-3xl", xl: "max-w-5xl" }[size];
  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        className={cn("flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl", width)}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <IconButton icon={X} title="Đóng" onClick={onClose} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/** Hộp xác nhận: const ok = await confirmDialog({...}) — xem <ConfirmHost /> */
let confirmListener = null;
export function confirmDialog({ title = "Xác nhận", message, confirmText = "Đồng ý", danger = false }) {
  return new Promise((resolve) => {
    if (!confirmListener) return resolve(window.confirm(message));
    confirmListener({ title, message, confirmText, danger, resolve });
  });
}
export function ConfirmHost() {
  const [req, setReq] = useState(null);
  useEffect(() => {
    confirmListener = setReq;
    return () => { confirmListener = null; };
  }, []);
  const close = (v) => { req?.resolve(v); setReq(null); };
  return (
    <Modal
      open={!!req}
      onClose={() => close(false)}
      title={req?.title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={() => close(false)}>Huỷ</Button>
          <Button variant={req?.danger ? "danger" : "primary"} onClick={() => close(true)}>{req?.confirmText}</Button>
        </>
      }
    >
      <p className="whitespace-pre-line text-sm text-slate-600">{req?.message}</p>
    </Modal>
  );
}

/* ------------------------------ Thông báo nhanh ------------------------------ */
let toastListener = null;
let toastSeq = 0;
function pushToast(kind, message) {
  if (toastListener) toastListener({ id: ++toastSeq, kind, message });
}
export const toast = {
  success: (m) => pushToast("success", m),
  error: (m) => pushToast("error", m),
  info: (m) => pushToast("info", m),
};
export function Toaster() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    toastListener = (t) => {
      setItems((xs) => [...xs, t]);
      setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== t.id)), t.kind === "error" ? 6000 : 3500);
    };
    return () => { toastListener = null; };
  }, []);
  const ICON = { success: CheckCircle2, error: AlertTriangle, info: Info };
  const TONE = { success: "bg-emerald-600", error: "bg-red-600", info: "bg-slate-800" };
  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[1100] flex flex-col items-center gap-2 px-4 sm:bottom-6">
      {items.map((t) => {
        const I = ICON[t.kind];
        return (
          <div key={t.id} className={cn("pointer-events-auto flex max-w-md items-start gap-2 rounded-lg px-4 py-3 text-sm text-white shadow-lg", TONE[t.kind])}>
            <I className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{t.message}</span>
          </div>
        );
      })}
    </div>,
    document.body
  );
}
