// Biểu đồ dùng chung của module 3 (dashboard, trang công việc của 1 người).
//   KpiTile    ô số liệu (không phải biểu đồ)
//   TrendChart giao mới vs hoàn thành theo tuần — 2 đường, 1 trục, chú thích + tooltip; màu đã kiểm (#2a78d6 / #eb6834 trên nền trắng)
//   RankBars   thanh ngang xếp hạng 1 màu (vd. việc đang mở theo trạng thái) — nhãn + số in cạnh thanh
import { AlertTriangle } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "~/pagesForm/shared/ui";

const SERIES = [
  { key: "created", label: "Giao mới", color: "#2a78d6" },
  { key: "done", label: "Hoàn thành", color: "#eb6834" },
];

export function KpiTile({ label, value, sub, tone, icon: Icon, className }) {
  const critical = tone === "critical" && value > 0;
  return (
    <div className={cn("min-w-0 rounded-xl border bg-white px-3 py-3", critical ? "border-red-200" : "border-slate-200", className)} data-kpi={label}>
      <p className="flex items-center gap-1.5 truncate text-xs font-medium text-slate-500">
        {critical ? <AlertTriangle className="h-3.5 w-3.5 text-red-600" /> : Icon ? <Icon className="h-3.5 w-3.5 text-slate-400" /> : null}{label}
      </p>
      <p className={cn("mt-1 text-2xl font-bold leading-none", critical ? "text-red-600" : value === null || value === undefined ? "text-slate-300" : "text-slate-900")}>
        {value === null || value === undefined ? "—" : value}
      </p>
      {sub && <p className="mt-1 truncate text-[11px] text-slate-500">{sub}</p>}
    </div>
  );
}

function TrendTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-slate-700">Tuần từ {label}</p>
      {SERIES.map((s) => {
        const v = payload.find((p) => p.dataKey === s.key)?.value ?? 0;
        return <p key={s.key} className="flex items-center gap-2 text-slate-600"><span className="h-0.5 w-3 rounded" style={{ background: s.color }} />{s.label}: <b className="text-slate-900">{v}</b></p>;
      })}
    </div>
  );
}

/** data: [{ label: 'dd/MM', created, done }] */
export function TrendChart({ data, height = 220 }) {
  const empty = !data?.some((d) => d.created || d.done);
  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-4 text-xs text-slate-600" aria-hidden>
        {SERIES.map((s) => <span key={s.key} className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 rounded" style={{ background: s.color }} />{s.label}</span>)}
      </div>
      {empty ? (
        <p className="grid place-items-center rounded-lg bg-slate-50 text-sm text-slate-400" style={{ height }}>Chưa có việc giao / hoàn thành trong kỳ</p>
      ) : (
        <div style={{ height }} role="img" aria-label={`Giao mới và hoàn thành theo tuần: ${data.map((d) => `${d.label} giao ${d.created} xong ${d.done}`).join("; ")}`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 6, right: 12, bottom: 0, left: -18 }}>
              <CartesianGrid stroke="#e1e0d9" strokeDasharray="0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#898781" }} tickLine={false} axisLine={{ stroke: "#c3c2b7" }} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#898781" }} tickLine={false} axisLine={false} width={40} />
              <Tooltip content={<TrendTip />} cursor={{ stroke: "#c3c2b7", strokeWidth: 1 }} />
              {SERIES.map((s) => (
                <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }} isAnimationActive={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

/** items: [{ key, label, n }] — sắp sẵn hoặc để nguyên thứ tự (trạng thái theo vòng đời) */
export function RankBars({ items, color = "#2a78d6", onPick }) {
  const max = Math.max(1, ...items.map((x) => x.n));
  return (
    <ul className="space-y-2">
      {items.map((x) => (
        <li key={x.key}>
          <button type="button" disabled={!onPick} onClick={() => onPick?.(x)} title={`${x.label}: ${x.n}`}
            className={cn("grid w-full grid-cols-[110px_1fr_36px] items-center gap-2 text-left text-sm", onPick && "hover:opacity-80")}>
            <span className="truncate text-slate-600">{x.label}</span>
            <span className="h-3 rounded-r" style={{ width: `${x.n ? Math.max(2, (x.n / max) * 100) : 0}%`, background: color, minWidth: x.n ? 4 : 0 }} />
            <span className="text-right tabular-nums font-semibold text-slate-800">{x.n}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
