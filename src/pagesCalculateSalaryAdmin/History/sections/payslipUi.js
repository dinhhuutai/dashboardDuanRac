// src/pages/Payroll/sections/payslipUi.js

export function fmtVND(x) {
  if (x == null || x === "") return "";
  const n = Number(String(x).replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(n)) return String(x);
  return n.toLocaleString("vi-VN");
}

export const companyFromMSNV = (raw) => {
  const s = String(raw ?? "").replace(/\D/g, "");
  if (s.startsWith("02")) return "CÔNG TY TNHH DAMY";
  if (s.startsWith("01")) return "CÔNG TY TNHH THUẬN HƯNG LONG AN";
  return "CÔNG TY TNHH THUẬN HƯNG LONG AN";
};

export function Row({
  left,
  mid,
  right,
  strongLeft = false,
  strongRight = false,
  bigRight = false,
}) {
  return (
    <tr className="border-b last:border-b-0">
      <td className={`px-3 py-2 border-r ${strongLeft ? "font-bold" : "font-medium"} text-slate-800`}>
        {left}
      </td>
      <td className="px-3 py-2 border-r text-right tabular-nums">{mid ?? ""}</td>
      <td
        className={`px-3 py-2 text-right tabular-nums ${
          strongRight ? "font-bold text-slate-900" : "text-slate-800"
        } ${bigRight ? "text-lg" : ""}`}
      >
        {right ?? ""}
      </td>
    </tr>
  );
}

export function Sep() {
  return (
    <tr>
      <td colSpan={3} className="p-0">
        <div className="border-t-2 border-slate-700" />
      </td>
    </tr>
  );
}

export function Line({ k, v, bold = false }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-slate-700">{k}</span>
      <span className={`tabular-nums ${bold ? "font-semibold text-slate-900" : "text-slate-800"}`}>
        {v || "-"}
      </span>
    </div>
  );
}

export function Hr() {
  return <div className="my-2 border-t border-slate-200" />;
}

export function PairRow({ label, mid, right, boldRight = false }) {
  return (
    <div className="grid grid-cols-[1fr,88px,132px] items-baseline gap-3">
      <span className="text-slate-700">{label}</span>
      <span className="text-right tabular-nums text-slate-800">{mid ?? "-"}</span>
      <span className={`text-right tabular-nums ${boldRight ? "font-semibold text-slate-900" : "text-slate-800"}`}>
        {right || "-"}
      </span>
    </div>
  );
}
