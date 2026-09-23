// Admin: danh sách biểu mẫu
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, ClipboardList, Copy, Pencil, Plus, Search, Trash2 } from "lucide-react";
import config from "~/config";
import { errorMessage, fmApi } from "~/pagesForm/shared/api";
import { fmtDateTime, fmtPercent, parseLocal } from "~/pagesForm/shared/format";
import { TEMPLATES } from "~/pagesForm/shared/templates";
import { Badge, Button, EmptyState, ErrorBox, IconButton, Modal, Spinner, Toggle, cn, confirmDialog, inputCls, toast } from "~/pagesForm/shared/ui";

function statusOf(f) {
  if (!f.isVisible) return { label: "Đang ẩn", tone: "slate" };
  if (f.isOpenNow) return { label: "Đang mở", tone: "green" };
  const open = parseLocal(f.openAt);
  if (f.acceptResponses && open && open > new Date()) return { label: `Mở lúc ${fmtDateTime(f.openAt)}`, tone: "blue" };
  return { label: "Đã đóng", tone: "amber" };
}

function Progress({ done, total }) {
  const pct = total ? Math.min(100, Math.round((done / total) * 100)) : 0;
  return (
    <div className="min-w-[120px]">
      <div className="flex justify-between text-xs text-slate-500">
        <span>{done}/{total} người</span>
        <span className="font-medium text-slate-700">{total ? fmtPercent(done / total) : "—"}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div className={cn("h-full rounded-full", pct >= 100 ? "bg-emerald-500" : "bg-blue-600")} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function TemplatePicker({ open, onClose }) {
  const navigate = useNavigate();
  return (
    <Modal open={open} onClose={onClose} title="Tạo biểu mẫu mới" size="lg">
      <p className="mb-4 text-sm text-slate-500">Chọn một mẫu để bắt đầu — mọi câu hỏi đều sửa được.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {TEMPLATES.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => { onClose(); navigate(`${config.routes.adminFormBuilder}?template=${t.key}`); }}
            className="rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-400 hover:bg-blue-50/40"
          >
            <p className="font-semibold text-slate-800">{t.name}</p>
            <p className="mt-1 text-sm text-slate-500">{t.hint}</p>
          </button>
        ))}
      </div>
    </Modal>
  );
}

export default function FormList() {
  const navigate = useNavigate();
  const [forms, setForms] = useState(null);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState({});

  const load = useCallback(async () => {
    setError(null);
    try {
      setForms(await fmApi.forms());
    } catch (e) {
      setError(errorMessage(e, "Không tải được danh sách biểu mẫu"));
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const setFlag = async (f, flag, value) => {
    setBusy((b) => ({ ...b, [f.formId]: true }));
    try {
      const r = await fmApi.setFlags(f.formId, { [flag]: value });
      setForms((xs) => xs.map((x) => (x.formId === f.formId ? { ...x, ...r } : x)));
      if (flag === "isVisible") toast.success(value ? "Đã hiện biểu mẫu cho nhân viên" : "Đã ẩn biểu mẫu");
      else toast.success(value ? "Đã mở nhận phiếu" : "Đã ngừng nhận phiếu");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy((b) => ({ ...b, [f.formId]: false }));
    }
  };

  const duplicate = async (f) => {
    try {
      const r = await fmApi.duplicate(f.formId);
      toast.success("Đã tạo bản sao (đang ẩn)");
      navigate(`${config.routes.adminFormBuilder}/${r.formId}`);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const remove = async (f) => {
    const ok = await confirmDialog({
      title: "Xoá biểu mẫu",
      message: `Xoá "${f.title}"?${f.responseCount ? `\nBiểu mẫu đã có ${f.responseCount} phiếu — nhân viên sẽ không còn thấy biểu mẫu này.` : ""}`,
      confirmText: "Xoá",
      danger: true,
    });
    if (!ok) return;
    try {
      await fmApi.remove(f.formId);
      setForms((xs) => xs.filter((x) => x.formId !== f.formId));
      toast.success("Đã xoá biểu mẫu");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const shown = useMemo(() => {
    if (!forms) return [];
    const q = search.trim().toLowerCase();
    return forms.filter((f) => {
      if (filter === "open" && !(f.isVisible && f.isOpenNow)) return false;
      if (filter === "hidden" && f.isVisible) return false;
      return !q || f.title.toLowerCase().includes(q);
    });
  }, [forms, search, filter]);

  if (error) return <ErrorBox message={error} onRetry={load} />;
  if (!forms) return <Spinner />;

  const openCount = forms.filter((f) => f.isVisible && f.isOpenNow).length;
  const totalResponses = forms.reduce((a, f) => a + f.responseCount, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Biểu mẫu</h1>
          <p className="text-sm text-slate-500">Tạo, mở/ẩn biểu mẫu và theo dõi kết quả.</p>
        </div>
        <Button icon={Plus} onClick={() => setPickerOpen(true)}>Tạo biểu mẫu</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[["Tổng biểu mẫu", forms.length], ["Đang mở", openCount], ["Tổng phiếu đã nộp", totalResponses]].map(([k, v]) => (
          <div key={k} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">{k}</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">{v.toLocaleString("vi-VN")}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input className={cn(inputCls, "pl-9")} placeholder="Tìm biểu mẫu…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className={cn(inputCls, "w-auto")} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">Tất cả</option>
          <option value="open">Đang mở</option>
          <option value="hidden">Đang ẩn</option>
        </select>
      </div>

      {forms.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Chưa có biểu mẫu nào">
          <Button className="mt-3" icon={Plus} onClick={() => setPickerOpen(true)}>Tạo biểu mẫu đầu tiên</Button>
        </EmptyState>
      ) : shown.length === 0 ? (
        <EmptyState icon={Search} title="Không tìm thấy biểu mẫu phù hợp" />
      ) : (
        <div className="space-y-3">
          {shown.map((f) => {
            const st = statusOf(f);
            return (
              <div key={f.formId} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start gap-4">
                  <button type="button" className="min-w-0 flex-1 text-left" onClick={() => navigate(`${config.routes.adminFormResults}/${f.formId}`)}>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={st.tone}>{st.label}</Badge>
                      {f.closeAt && <span className="text-xs text-slate-500">Hạn: {fmtDateTime(f.closeAt)}</span>}
                      {f.audienceType === "targeted" && <Badge>Nhóm được chọn</Badge>}
                    </div>
                    <p className="mt-1.5 font-semibold text-slate-800 hover:text-blue-700">{f.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {f.questionCount} câu hỏi · {f.responseCount} phiếu
                      {f.lastSubmittedAt ? ` · phiếu mới nhất ${fmtDateTime(f.lastSubmittedAt)}` : ""}
                      {f.createdByName ? ` · tạo bởi ${f.createdByName}` : ""}
                    </p>
                  </button>
                  <Progress done={f.targetDoneCount} total={f.targetCount} />
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                  <div className="flex flex-wrap gap-5">
                    <Toggle label="Hiện cho nhân viên" checked={f.isVisible} disabled={busy[f.formId]} onChange={(v) => setFlag(f, "isVisible", v)} />
                    <Toggle label="Nhận phiếu" checked={f.acceptResponses} disabled={busy[f.formId]} onChange={(v) => setFlag(f, "acceptResponses", v)} />
                  </div>
                  <div className="flex gap-1">
                    <Button variant="secondary" size="sm" icon={BarChart3} onClick={() => navigate(`${config.routes.adminFormResults}/${f.formId}`)}>Kết quả</Button>
                    <IconButton icon={Pencil} title="Sửa" onClick={() => navigate(`${config.routes.adminFormBuilder}/${f.formId}`)} />
                    <IconButton icon={Copy} title="Nhân bản" onClick={() => duplicate(f)} />
                    <IconButton icon={Trash2} title="Xoá" danger onClick={() => remove(f)} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TemplatePicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </div>
  );
}
