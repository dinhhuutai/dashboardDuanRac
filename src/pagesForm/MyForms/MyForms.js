// Nhân viên: danh sách biểu mẫu được mở cho mình
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ChevronRight, ClipboardList, Clock, Inbox, Lock } from "lucide-react";
import config from "~/config";
import { errorMessage, fmApi } from "../shared/api";
import { deadlineText, fmtDateTime, isNotYetOpen } from "../shared/format";
import ProfileDialog, { ProfileSummary } from "../shared/ProfileDialog";
import { Badge, EmptyState, ErrorBox, Spinner, cn } from "../shared/ui";

const TABS = [
  { key: "todo", label: "Cần điền" },
  { key: "done", label: "Đã nộp" },
  { key: "all", label: "Tất cả" },
];

const needsAction = (f) => f.isOpenNow && (f.myResponseCount === 0 || f.allowMultiple);

function FormCard({ f, onOpen }) {
  const deadline = f.isOpenNow ? deadlineText(f.closeAt) : null;
  const submitted = f.myResponseCount > 0;
  const notYetOpen = isNotYetOpen(f);
  let cta = "Điền biểu mẫu";
  if (notYetOpen) cta = "Xem trước";
  else if (!f.isOpenNow) cta = submitted ? "Xem phiếu đã nộp" : "Xem";
  else if (submitted && f.allowMultiple) cta = "Nộp thêm";
  else if (submitted && f.allowEditAfterSubmit) cta = "Xem & sửa";
  else if (submitted) cta = "Xem phiếu đã nộp";

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition hover:border-blue-300 hover:shadow"
    >
      <span className="w-1.5 shrink-0" style={{ background: f.themeColor || "#1f4e79" }} />
      <span className="min-w-0 flex-1 p-4">
        <span className="flex flex-wrap items-center gap-2">
          {notYetOpen ? (
            <Badge tone="amber"><Clock className="h-3 w-3" /> Chưa mở · mở lúc {fmtDateTime(f.openAt)}</Badge>
          ) : !f.isOpenNow ? (
            <Badge><Lock className="h-3 w-3" /> Đã đóng</Badge>
          ) : submitted ? (
            <Badge tone="green"><CheckCircle2 className="h-3 w-3" /> Đã nộp {fmtDateTime(f.myLastSubmittedAt)}</Badge>
          ) : (
            <Badge tone="blue">Chưa nộp</Badge>
          )}
          {deadline && (
            <Badge tone={deadline.urgent ? "amber" : "slate"}><Clock className="h-3 w-3" /> {deadline.text}</Badge>
          )}
        </span>
        <span className="mt-2 block font-semibold text-slate-800">{f.title}</span>
        {f.description && <span className="mt-1 line-clamp-2 block text-sm text-slate-500">{f.description}</span>}
        <span className="mt-3 flex items-center justify-between text-sm">
          <span className="text-slate-400">{f.questionCount} câu hỏi</span>
          <span className="flex items-center gap-1 font-medium text-blue-700 group-hover:gap-2 transition-all">
            {cta} <ChevronRight className="h-4 w-4" />
          </span>
        </span>
      </span>
    </button>
  );
}

export default function MyForms() {
  const navigate = useNavigate();
  const [forms, setForms] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("todo");
  const [profileOpen, setProfileOpen] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [list, me] = await Promise.all([fmApi.myForms(), fmApi.myProfile()]);
      setForms(list);
      setProfile(me.profile);
      if (list.filter(needsAction).length === 0 && list.length > 0) setTab("all");
    } catch (e) {
      setError(errorMessage(e, "Không tải được danh sách biểu mẫu"));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => ({
    todo: forms?.filter(needsAction).length || 0,
    done: forms?.filter((f) => f.myResponseCount > 0).length || 0,
    all: forms?.length || 0,
  }), [forms]);

  const shown = useMemo(() => {
    if (!forms) return [];
    if (tab === "todo") return forms.filter(needsAction);
    if (tab === "done") return forms.filter((f) => f.myResponseCount > 0);
    return forms;
  }, [forms, tab]);

  if (error) return <ErrorBox message={error} onRetry={load} />;
  if (!forms) return <Spinner />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Biểu mẫu của tôi</h1>
        <p className="text-sm text-slate-500">Các biểu mẫu công ty đang mở cho bạn.</p>
      </div>

      <ProfileSummary profile={profile} onEdit={() => setProfileOpen(true)} />

      <div className="flex gap-1 rounded-xl bg-slate-200/60 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              tab === t.key ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            {t.label}
            {counts[t.key] > 0 && (
              <span className={cn("ml-1.5 rounded-full px-1.5 text-xs", t.key === "todo" ? "bg-blue-600 text-white" : "bg-slate-300 text-slate-700")}>
                {counts[t.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <EmptyState icon={tab === "todo" ? CheckCircle2 : Inbox} title={tab === "todo" ? "Không có biểu mẫu nào cần điền" : "Chưa có biểu mẫu"}>
          {tab === "todo" && forms.length > 0 ? "Bạn đã hoàn thành tất cả biểu mẫu đang mở." : null}
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {shown.map((f) => (
            <FormCard key={f.formId} f={f} onOpen={() => navigate(`${config.routes.formFill}/${f.formId}`)} />
          ))}
        </div>
      )}

      {forms.length === 0 && (
        <p className="flex items-center justify-center gap-2 text-xs text-slate-400">
          <ClipboardList className="h-4 w-4" /> Khi quản trị viên mở biểu mẫu cho bạn, biểu mẫu sẽ hiện ở đây.
        </p>
      )}

      <ProfileDialog open={profileOpen} onClose={() => setProfileOpen(false)} onSaved={(p) => { setProfile(p); load(); }} />
    </div>
  );
}
