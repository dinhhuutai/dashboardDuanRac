// Việc trên mọi dự án: ?scope=mine (việc của tôi) | waiting (chờ tôi trả lời / duyệt) | assigned (việc tôi đã giao)
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Inbox, ListTodo, Send } from "lucide-react";
import { CardListSkeleton, EmptyState, ErrorBox, Refreshing } from "~/pagesForm/shared/ui";
import { errorMessage, pjApi } from "../shared/api";
import { usePj } from "../shared/store";
import { Page, Pills, TaskCard } from "../shared/components";

const SCOPES = {
  mine: { title: "Việc của tôi", hint: "Việc bạn được giao trên mọi dự án", icon: ListTodo, empty: "Bạn không có việc nào" },
  waiting: { title: "Chờ tôi phản hồi", hint: "Câu hỏi cần trả lời và kết quả chờ duyệt", icon: Inbox, empty: "Không có gì chờ bạn" },
  assigned: { title: "Việc tôi đã giao", hint: "Theo dõi việc bạn giao cho người khác", icon: Send, empty: "Bạn chưa giao việc nào" },
};
// thứ tự nhóm trên điện thoại: việc cần làm trước nằm trên
const MINE_GROUPS = [
  ["todo", "Cần xác nhận / làm lại", (t) => ["new", "clarify", "revise"].includes(t.status)],
  ["overdue", "Quá hạn", (t) => t.overdue],
  ["doing", "Đang làm", (t) => t.status === "doing" && !t.overdue],
  ["submitted", "Đã nộp, chờ duyệt", (t) => t.status === "submitted"],
];

export default function TaskInbox() {
  const [params] = useSearchParams();
  const scope = SCOPES[params.get("scope")] ? params.get("scope") : "mine";
  const today = usePj((s) => s.boot?.today);
  const meta = SCOPES[scope];
  const [status, setStatus] = useState("open");
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const seq = useRef(0);

  const load = useCallback(async () => {
    const my = ++seq.current;
    setLoading(true);
    try {
      const r = await pjApi.tasks({ scope, status: scope === "waiting" ? "all" : status });
      if (my === seq.current) { setRows(r.rows); setError(null); }
    } catch (e) {
      if (my === seq.current) setError(errorMessage(e));
    } finally {
      if (my === seq.current) setLoading(false);
    }
  }, [scope, status]);
  useEffect(() => { setRows(null); }, [scope]);
  useEffect(() => { load(); }, [load]);

  const groups = useMemo(() => {
    if (!rows || scope !== "mine" || status !== "open") return null;
    const used = new Set();
    return MINE_GROUPS.map(([k, label, fn]) => {
      const list = rows.filter((t) => !used.has(t.taskId) && fn(t));
      list.forEach((t) => used.add(t.taskId));
      return { k, label, list };
    }).filter((g) => g.list.length);
  }, [rows, scope, status]);

  return (
    <Page>
      <h1 className="text-xl font-bold text-slate-900">{meta.title}</h1>
      <p className="text-sm text-slate-500">{meta.hint}</p>
      {scope !== "waiting" && (
        <div className="mt-4"><Pills value={status} onChange={setStatus} items={[["open", "Đang mở"], ["done", "Hoàn thành"], ["all", "Tất cả"]]} /></div>
      )}
      <div className="mt-4">
        {error && !rows ? <ErrorBox message={error} onRetry={load} /> : !rows ? <CardListSkeleton rows={4} /> : (
          <Refreshing active={loading}>
            {!rows.length ? <EmptyState icon={meta.icon} title={meta.empty} /> : groups ? (
              <div className="space-y-5">
                {groups.map((g) => (
                  <section key={g.k}>
                    <h2 className="mb-2 text-sm font-semibold text-slate-600">{g.label} <span className="font-normal text-slate-400">{g.list.length}</span></h2>
                    <div className="space-y-2">{g.list.map((t) => <TaskCard key={t.taskId} t={t} today={today} showProject showAssigner />)}</div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {rows.map((t) => <TaskCard key={t.taskId} t={t} today={today} showProject showAssignee={scope !== "mine"} showAssigner={scope === "mine"} />)}
              </div>
            )}
          </Refreshing>
        )}
      </div>
    </Page>
  );
}
