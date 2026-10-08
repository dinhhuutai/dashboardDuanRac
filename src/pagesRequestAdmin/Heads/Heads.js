// Quản trị: gán trưởng phòng cho từng phòng ban và tổ trưởng cho từng tổ.
// Dùng cho bước duyệt "Trưởng phòng / Tổ trưởng của người gửi". Chọn xong là lưu ngay.
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronDown, Lightbulb, Loader2, Search } from "lucide-react";
import config from "~/config";
import { Skeleton, cn, toast } from "~/pagesForm/shared/ui";
import { errorMessage, rqApi } from "~/pagesRequest/shared/api";
import { PageScroll, UserPicker, norm } from "~/pagesRequest/shared/components";
import { ensureBoot, useRq } from "~/pagesRequest/shared/store";

function HeadPicker({ scopeType, scopeId, initial, suggestTitle, deptId, teamId }) {
  const dir = useRq((s) => s.dir);
  const [ids, setIds] = useState(initial);
  const [state, setState] = useState(null); // saving | saved | error

  const save = async (next) => {
    setIds(next);
    setState("saving");
    try {
      await rqApi.saveHeads({ scopeType, scopeId, userIds: next });
      setState("saved");
      ensureBoot(true).catch(() => {});
      setTimeout(() => setState((s) => (s === "saved" ? null : s)), 2000);
    } catch (e) {
      setState("error");
      toast.error(errorMessage(e));
    }
  };

  // gợi ý theo chức danh trong hồ sơ (Trưởng phòng / Tổ trưởng cùng phòng/tổ)
  const suggestions = useMemo(() => {
    if (!dir || ids.length) return [];
    return dir.users.filter((u) => norm(u.j) === norm(suggestTitle) && (teamId ? u.t === teamId : u.d === deptId)).slice(0, 3);
  }, [dir, ids.length, suggestTitle, deptId, teamId]);

  return (
    <div className="flex items-start gap-2">
      <UserPicker className="flex-1" value={ids} onChange={save} max={5} placeholder={scopeType === "team" ? "Chọn tổ trưởng…" : "Chọn trưởng phòng…"} />
      <span className="mt-2.5 w-5 shrink-0">
        {state === "saving" && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
        {state === "saved" && <Check className="h-4 w-4 text-emerald-600" />}
      </span>
      {suggestions.length > 0 && (
        <div className="hidden shrink-0 flex-col gap-1 sm:flex">
          {suggestions.map((u) => (
            <button key={u.id} type="button" onClick={() => save([u.id])} className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100" title="Gợi ý theo chức danh">
              <Lightbulb className="h-3 w-3" /> {u.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Heads() {
  const [data, setData] = useState(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState({});

  const load = useCallback(async () => {
    try { setData(await rqApi.heads()); } catch (e) { toast.error(errorMessage(e)); setData({ departments: [], teams: [] }); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const shown = useMemo(() => {
    if (!data) return [];
    const nq = norm(q.trim());
    return data.departments.map((d) => ({ ...d, teams: data.teams.filter((t) => t.departmentId === d.id) }))
      .filter((d) => !nq || norm(d.name).includes(nq) || d.teams.some((t) => norm(t.name).includes(nq)));
  }, [data, q]);

  const missingDept = data?.departments.filter((d) => !d.heads.length).length || 0;

  return (
    <PageScroll max="max-w-4xl">
      <h1 className="text-xl font-bold text-slate-800">Trưởng phòng & tổ trưởng</h1>
      <p className="text-sm text-slate-500">
        Dùng cho bước duyệt "Trưởng phòng / Tổ trưởng của người gửi". Một phòng/tổ có thể có nhiều người (vd. trưởng + phó) — tuỳ cấu hình bước là tất cả hay 1 người duyệt.
        Người gửi lấy phòng/tổ theo hồ sơ ở <Link to={config.routes.adminRequestOrg} className="text-blue-700 underline">Phòng ban & tổ</Link>.
      </p>
      {data && missingDept > 0 && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{missingDept} phòng ban chưa có trưởng phòng — nhân viên phòng đó không gửi được mẫu có bước "Trưởng phòng".</p>}
      <label className="relative mt-4 block">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm phòng ban / tổ" className="h-9 w-full rounded-lg border border-slate-300 pl-9 text-sm" />
      </label>
      <div className="mt-4 space-y-3">
        {!data && [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        {shown.map((d) => (
          <section key={d.id} className="rounded-xl border border-slate-200 bg-white">
            <div className="grid gap-2 p-3 sm:grid-cols-[220px_1fr] sm:items-start">
              <div className="pt-2">
                <p className="font-semibold text-slate-800">{d.name}</p>
                <p className="text-xs text-slate-400">{d.code ? `${d.code} · ` : ""}{d.teams.length} tổ</p>
              </div>
              <HeadPicker scopeType="department" scopeId={d.id} initial={d.heads.map((h) => h.userId)} suggestTitle="Trưởng phòng" deptId={d.id} />
            </div>
            {d.teams.length > 0 && (
              <div className="border-t border-slate-100">
                <button type="button" onClick={() => setOpen((o) => ({ ...o, [d.id]: !o[d.id] }))} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50">
                  <ChevronDown className={cn("h-4 w-4 transition", (open[d.id] || q) && "rotate-180")} />
                  Tổ trưởng ({d.teams.filter((t) => t.heads.length).length}/{d.teams.length} tổ đã gán)
                </button>
                {(open[d.id] || q) && (
                  <ul className="space-y-2 px-3 pb-3">
                    {d.teams.map((t) => (
                      <li key={t.id} className="grid gap-1 sm:grid-cols-[200px_1fr] sm:items-start">
                        <span className={cn("pt-2 text-sm", t.name === t.code ? "italic text-amber-700" : "text-slate-700")}>{t.name}</span>
                        <HeadPicker scopeType="team" scopeId={t.id} initial={t.heads.map((h) => h.userId)} suggestTitle="Tổ trưởng" deptId={d.id} teamId={t.id} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>
        ))}
      </div>
    </PageScroll>
  );
}
