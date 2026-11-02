// Nhân sự — ai đang làm việc gì của dự án nào (admin: mọi dự án · người giao việc: các dự án mình giao).
// Bấm 1 người → công việc + sơ đồ công việc theo mốc thời gian + nhật ký thao tác của người đó.
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Search, Users } from "lucide-react";
import config from "~/config";
import { CardListSkeleton, EmptyState, ErrorBox, Refreshing, cn } from "~/pagesForm/shared/ui";
import { errorMessage, pjApi } from "../shared/api";
import { fmtWhen, fmtYmd, norm } from "../shared/meta";
import { Avatar, Page, Pills, StatusChip } from "../shared/components";

const R = config.routes;
const FILTERS = [["all", "Tất cả"], ["busy", "Đang có việc"], ["overdue", "Có việc quá hạn"], ["review", "Chờ duyệt"], ["idle", "Chưa có việc"]];
const pass = { all: () => true, busy: (x) => x.open > 0, overdue: (x) => x.overdue > 0, review: (x) => x.waitingReview > 0, idle: (x) => x.open === 0 };

function Current({ list }) {
  if (!list.length) return <span className="text-sm text-slate-400">Không có việc đang mở</span>;
  return (
    <ul className="space-y-1">
      {list.map((t) => (
        <li key={t.taskId} className="flex min-w-0 items-center gap-2 text-sm">
          <StatusChip status={t.status} />
          <span className="min-w-0 truncate font-medium text-slate-800">{t.title}</span>
          <span className="hidden min-w-0 shrink truncate text-xs text-slate-500 sm:inline">
            <span className="mr-1 inline-block h-2 w-2 rounded-sm align-middle" style={{ background: t.projectColor || "#94a3b8" }} />{t.projectName}
          </span>
          {t.dueDate && <span className={cn("ml-auto shrink-0 text-xs", t.overdue ? "font-semibold text-red-600" : "text-slate-500")}>{t.overdue ? "quá hạn " : "hạn "}{fmtYmd(t.dueDate).slice(0, 5)}</span>}
        </li>
      ))}
    </ul>
  );
}

const Num = ({ n, tone }) => <span className={cn("tabular-nums", !n ? "text-slate-300" : tone === "red" ? "font-semibold text-red-600" : "text-slate-800")}>{n || 0}</span>;

export default function People() {
  const [d, setD] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try { setD(await pjApi.people()); setError(null); } catch (e) { setError(errorMessage(e)); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => {
    const nq = norm(q.trim());
    return (d?.rows || []).filter((x) => pass[filter](x) && (!nq || norm(`${x.name} ${x.msnv || ""} ${x.dept || ""} ${x.current.map((t) => `${t.title} ${t.projectName}`).join(" ")}`).includes(nq)));
  }, [d, filter, q]);
  const counts = useMemo(() => Object.fromEntries(FILTERS.map(([k]) => [k, (d?.rows || []).filter(pass[k]).length])), [d]);

  if (error && !d) return <Page wide><ErrorBox message={error} onRetry={load} /></Page>;
  return (
    <Page wide>
      <h1 className="text-xl font-bold text-slate-900">Nhân sự</h1>
      <p className="text-sm text-slate-500">{d?.scope === "assigner" ? "Thành viên các dự án bạn giao việc — ai đang làm việc gì" : "Mọi thành viên dự án — ai đang làm việc gì của dự án nào"}</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1"><Pills value={filter} onChange={setFilter} items={FILTERS.map(([k, l]) => [k, l, counts[k]])} /></div>
        <label className="relative block sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm người, công việc, dự án"
            className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
        </label>
      </div>
      <div className="mt-4">
        {!d ? <CardListSkeleton rows={5} /> : (
          <Refreshing active={loading}>
            {!rows.length ? <EmptyState icon={Users} title={d.rows.length ? "Không có ai khớp" : "Chưa có thành viên dự án"} /> : (
              <>
                {/* máy tính: bảng */}
                <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white lg:block">
                  <table className="w-full text-sm" data-people>
                    <thead><tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs text-slate-500">
                      <th className="px-4 py-2.5 font-medium">Nhân viên</th><th className="px-2 py-2.5 font-medium">Đang làm</th>
                      <th className="w-16 px-2 py-2.5 text-right font-medium">Mở</th><th className="w-20 px-2 py-2.5 text-right font-medium">Quá hạn</th>
                      <th className="w-24 px-2 py-2.5 text-right font-medium">Xong 30 ngày</th><th className="w-32 px-4 py-2.5 text-right font-medium">Hoạt động</th><th className="w-8" />
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map((x) => (
                        <tr key={x.userId} className="align-top hover:bg-slate-50/60">
                          <td className="px-4 py-3">
                            <Link to={`${R.projectPeople}/${x.userId}`} className="flex items-center gap-2.5">
                              <Avatar name={x.name} src={x.avatar} size={34} />
                              <span className="min-w-0">
                                <span className="block truncate font-semibold text-slate-800 hover:text-blue-700">{x.name}</span>
                                <span className="block truncate text-xs text-slate-500">{[x.msnv, x.dept].filter(Boolean).join(" · ")} · {x.projectCount} dự án</span>
                              </span>
                            </Link>
                          </td>
                          <td className="max-w-0 px-2 py-3"><Current list={x.current} />{x.open > x.current.length && <p className="mt-0.5 text-xs text-slate-400">+{x.open - x.current.length} việc khác</p>}</td>
                          <td className="px-2 py-3 text-right"><Num n={x.open} /></td>
                          <td className="px-2 py-3 text-right"><Num n={x.overdue} tone="red" /></td>
                          <td className="px-2 py-3 text-right"><Num n={x.doneRecent} /></td>
                          <td className="px-4 py-3 text-right text-xs text-slate-500">{fmtWhen(x.lastActivityAt) || "—"}</td>
                          <td className="py-3 pr-3"><Link to={`${R.projectPeople}/${x.userId}`} aria-label={`Xem ${x.name}`}><ChevronRight className="h-5 w-5 text-slate-300" /></Link></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* điện thoại: thẻ */}
                <div className="space-y-2 lg:hidden">
                  {rows.map((x) => (
                    <Link key={x.userId} to={`${R.projectPeople}/${x.userId}`} className="block rounded-xl border border-slate-200 bg-white p-3 active:bg-slate-50">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={x.name} src={x.avatar} size={36} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-slate-800">{x.name}</p>
                          <p className="truncate text-xs text-slate-500">{[x.dept, `${x.projectCount} dự án`].filter(Boolean).join(" · ")}</p>
                        </div>
                        <span className="text-right text-xs text-slate-500"><Num n={x.open} /> mở{x.overdue ? <><br /><Num n={x.overdue} tone="red" /> quá hạn</> : null}</span>
                      </div>
                      <div className="mt-2"><Current list={x.current} /></div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </Refreshing>
        )}
      </div>
    </Page>
  );
}
