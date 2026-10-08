// Quy trình duyệt: các bước lần lượt, mỗi bước có 1 hoặc nhiều người (tất cả phải duyệt / 1 người là đủ)
import { Check, CircleDot, Clock, CornerUpLeft, X } from "lucide-react";
import { cn } from "~/pagesForm/shared/ui";
import { UserAvatar } from "../shared/components";
import { APPROVER_STATUS, fmtDateTime } from "../shared/format";

function stepState(rows, requestStatus, isCurrent) {
  if (rows.some((r) => r.status === "rejected")) return "rejected";
  if (rows.some((r) => r.status === "returned")) return "returned";
  if (rows.length && rows.every((r) => r.status === "approved" || r.status === "skipped") && rows.some((r) => r.status === "approved")) return "done";
  if (isCurrent && requestStatus === "pending") return "current";
  return "waiting";
}

const STEP_ICON = {
  done: { icon: Check, cls: "bg-emerald-500 text-white" },
  current: { icon: Clock, cls: "bg-amber-500 text-white animate-pulse" },
  rejected: { icon: X, cls: "bg-red-500 text-white" },
  returned: { icon: CornerUpLeft, cls: "bg-violet-500 text-white" },
  waiting: { icon: CircleDot, cls: "bg-slate-200 text-slate-500" },
};

export default function ApprovalFlow({ request: r, meId }) {
  const steps = [];
  for (const a of r.approvers) {
    let s = steps.find((x) => x.stepNo === a.stepNo);
    if (!s) { s = { stepNo: a.stepNo, name: a.stepName, mode: a.stepMode, rows: [] }; steps.push(s); }
    s.rows.push(a);
  }
  if (!steps.length) {
    return <p className="text-sm text-slate-500">Đề xuất không cần ai duyệt (tự duyệt khi gửi).</p>;
  }
  return (
    <ol className="relative space-y-4">
      {steps.map((s, i) => {
        const st = stepState(s.rows, r.status, s.stepNo === r.currentStep);
        const I = STEP_ICON[st];
        return (
          <li key={s.stepNo} className="relative pl-9">
            {i < steps.length - 1 && <span className="absolute left-[13px] top-7 h-[calc(100%+4px)] w-0.5 bg-slate-200" />}
            <span className={cn("absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full", I.cls)}><I.icon className="h-4 w-4" /></span>
            <div className="flex flex-wrap items-baseline gap-x-2">
              <p className="text-sm font-semibold text-slate-800">Bước {s.stepNo}: {s.name}</p>
              <span className="text-xs text-slate-400">
                {s.rows.length > 1 ? (s.mode === "any" ? "· 1 người duyệt là đủ" : "· tất cả cùng duyệt") : ""}
              </span>
            </div>
            <ul className="mt-1.5 space-y-1.5">
              {s.rows.map((a) => {
                const as = APPROVER_STATUS[a.status] || APPROVER_STATUS.waiting;
                return (
                  <li key={a.id} className={cn("rounded-lg px-2 py-1.5", a.userId === meId && a.status === "pending" && r.status === "pending" ? "bg-amber-50 ring-1 ring-amber-200" : "")}>
                    <div className="flex items-center gap-2">
                      <UserAvatar id={a.userId} name={a.fullName} size={26} />
                      <span className="min-w-0 flex-1 break-words text-sm leading-tight text-slate-700">{a.fullName}{a.userId === meId ? " (bạn)" : ""}</span>
                      <span className={cn("shrink-0 text-xs font-medium", as.cls)}>{a.status === "pending" && r.status !== "pending" ? "—" : as.label}</span>
                    </div>
                    {a.actedAt && <p className="ml-[34px] text-[11px] text-slate-400">{fmtDateTime(a.actedAt)}</p>}
                    {a.note && <p className="ml-[34px] mt-0.5 whitespace-pre-wrap rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-600">“{a.note}”</p>}
                  </li>
                );
              })}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}
