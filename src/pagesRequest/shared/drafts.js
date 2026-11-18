// Đề xuất LƯU TẠM (module 18, bảng rq_Drafts — sql/18): danh sách + thẻ dùng chung cho trang "Lưu tạm"
// (pagesRequest/Drafts) và đầu trang "Tạo đề xuất" (RequestCreate → chọn mẫu).
// Mở 1 bản: /request/new?draft=ID → form điền sẵn → "Gửi đề xuất" (máy chủ xoá bản lưu tạm cùng lúc tạo đề xuất).
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BellRing, CalendarClock, CalendarDays, Paperclip, Send, Trash2 } from "lucide-react";
import config from "~/config";
import { Badge, Button, IconButton, cn, confirmDialog, toast } from "~/pagesForm/shared/ui";
import { errorMessage, rqApi } from "./api";
import { fmtYmd, timeAgo } from "./format";
import { refreshCounts, useRq } from "./store";
import { TypeIcon } from "./typeIcons";

const R = config.routes;
const pad = (n) => String(n).padStart(2, "0");
export const localYmd = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Nhãn ngày định gửi: chưa đặt / hôm nay / đã quá / còn N ngày */
export function dueInfo(sendDate, today) {
  if (!sendDate) return { key: "none", tone: "slate", icon: CalendarDays, label: "Chưa đặt ngày gửi" };
  const days = Math.round((Date.parse(`${sendDate}T00:00:00`) - Date.parse(`${today}T00:00:00`)) / 86400000);
  if (days === 0) return { key: "due", tone: "amber", icon: BellRing, label: "Đến ngày gửi — hôm nay" };
  if (days < 0) return { key: "due", tone: "red", icon: BellRing, label: `Quá ngày định gửi ${-days} ngày (${fmtYmd(sendDate)})` };
  return { key: "later", tone: "blue", icon: CalendarClock, label: `Gửi ngày ${fmtYmd(sendDate)} · còn ${days} ngày` };
}

/** Tải danh sách bản lưu tạm của tôi. enabled = false → không gọi API (vd. chưa có bản nào) */
export function useDrafts(enabled = true) {
  const [state, setState] = useState({ rows: null, today: localYmd(), error: null, needSql: false });
  const load = useCallback(async () => {
    try {
      const r = await rqApi.drafts({ silent: true });
      setState({ rows: r.rows, today: r.today || localYmd(), error: null, needSql: false });
    } catch (e) {
      setState((s) => ({ ...s, rows: s.rows || [], error: errorMessage(e), needSql: e?.response?.status === 503 }));
    }
  }, []);
  useEffect(() => { if (enabled) load(); }, [enabled, load]);
  const remove = useCallback(async (d) => {
    const ok = await confirmDialog({
      title: "Xoá bản lưu tạm",
      message: `Xoá "${d.title || d.typeName}"? Nội dung đã điền sẽ mất (tệp đính kèm vẫn còn trên máy chủ tệp).`,
      confirmText: "Xoá", danger: true,
    });
    if (!ok) return;
    try {
      await rqApi.deleteDraft(d.draftId);
      setState((s) => ({ ...s, rows: (s.rows || []).filter((x) => x.draftId !== d.draftId) }));
      refreshCounts();
      toast.success("Đã xoá bản lưu tạm");
    } catch (e) { toast.error(errorMessage(e)); }
  }, []);
  return { ...state, reload: load, remove };
}

/** 1 bản lưu tạm: bấm để mở form điền sẵn → kiểm tra → Gửi đề xuất */
export function DraftCard({ d, today, onDelete }) {
  const navigate = useNavigate();
  const types = useRq((s) => s.boot?.types);
  const usable = d.typeActive && (types || []).some((t) => t.typeId === d.typeId);
  const due = dueInfo(d.sendDate, today);
  const open = () => usable && navigate(`${R.requestNew}?draft=${d.draftId}`);
  return (
    <li
      role="button" tabIndex={0} onClick={open} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && open()}
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-white p-3 transition",
        usable ? "cursor-pointer hover:border-blue-400 hover:shadow-sm active:scale-[0.995]" : "cursor-default opacity-80",
        due.key === "due" ? "border-amber-300 ring-1 ring-amber-100" : "border-slate-200"
      )}
      data-draft={d.draftId}
    >
      <TypeIcon icon={d.icon} color={d.color} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-slate-800">{d.title || <span className="italic text-slate-400">(Chưa đặt tiêu đề)</span>}</p>
        <p className="truncate text-xs text-slate-500">
          {d.typeName} · lưu {timeAgo(d.updatedAt)}
          {d.fileCount > 0 && <span className="whitespace-nowrap"> · <Paperclip className="inline h-3 w-3" /> {d.fileCount}</span>}
        </p>
        <div className="mt-1 flex flex-wrap gap-1">
          {usable
            ? <Badge tone={due.tone} className="inline-flex items-center gap-1"><due.icon className="h-3 w-3" /> {due.label}</Badge>
            : <Badge tone="red">Mẫu đã ngừng dùng hoặc không dành cho bạn — không gửi được</Badge>}
        </div>
      </div>
      {usable && (
        <Button size="sm" icon={Send} className="shrink-0" onClick={(e) => { e.stopPropagation(); open(); }}>
          <span className="hidden sm:inline">Mở &amp; gửi</span>
        </Button>
      )}
      <IconButton icon={Trash2} danger title="Xoá bản lưu tạm" onClick={(e) => { e.stopPropagation(); onDelete(d); }} />
    </li>
  );
}
