// Admin: phòng ban, tổ, chức danh và gán cho nhân viên (bảng org_* dùng chung toàn hệ thống)
import { useCallback, useEffect, useMemo, useState } from "react";
import { Briefcase, Building2, Layers, Pencil, Plus, Search, Users } from "lucide-react";
import { errorMessage, fmApi } from "~/pagesForm/shared/api";
import { Badge, Button, EmptyState, Field, IconButton, Modal, Spinner, Toggle, cn, inputCls, toast } from "~/pagesForm/shared/ui";

const TABS = [
  { key: "users", label: "Gán cho nhân viên", icon: Users },
  { key: "departments", label: "Phòng ban", icon: Building2 },
  { key: "teams", label: "Tổ", icon: Layers },
  { key: "job-titles", label: "Chức danh", icon: Briefcase },
];
const NOUN = { departments: "phòng ban", teams: "tổ", "job-titles": "chức danh" };
const ICON = { departments: Building2, teams: Layers, "job-titles": Briefcase };

/** "TO 1 — Phòng Sản Xuất" khi danh sách tổ chưa lọc theo phòng */
const teamLabel = (t, departments, withDept) => {
  if (!withDept) return t.name;
  const d = departments.find((x) => x.id === t.departmentId);
  return d ? `${t.name} — ${d.name}` : t.name;
};

/* ------------------------- Danh mục phòng ban / tổ / chức danh ------------------------- */
function CatalogTab({ kind, departments, onChanged }) {
  const hasCode = kind !== "job-titles";
  const isTeam = kind === "teams";
  const noun = NOUN[kind];
  const [rows, setRows] = useState(null);
  const [deptFilter, setDeptFilter] = useState("");
  const [edit, setEdit] = useState(null); // {id?, name, code, departmentId, sortOrder, isActive}
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    fmApi.orgList(kind).then(setRows).catch((e) => toast.error(errorMessage(e)));
  }, [kind]);
  useEffect(() => { setRows(null); load(); }, [load]);

  const shown = useMemo(
    () => (rows || []).filter((r) => !isTeam || !deptFilter || String(r.departmentId) === deptFilter),
    [rows, isTeam, deptFilter]
  );

  const save = async () => {
    if (!edit.name?.trim()) return toast.error(`Chưa nhập tên ${noun}`);
    if (isTeam && !edit.departmentId) return toast.error("Chưa chọn phòng ban của tổ");
    setSaving(true);
    try {
      const body = { name: edit.name, code: edit.code, sortOrder: Number(edit.sortOrder) || 0, isActive: edit.isActive };
      if (isTeam) body.departmentId = Number(edit.departmentId);
      if (edit.id) await fmApi.orgUpdate(kind, edit.id, body);
      else await fmApi.orgCreate(kind, body);
      toast.success("Đã lưu");
      setEdit(null);
      load();
      onChanged?.();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  if (!rows) return <Spinner />;
  const Icon = ICON[kind];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {isTeam ? (
          <select className={cn(inputCls, "w-auto")} value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="">Mọi phòng ban</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        ) : <span />}
        <Button icon={Plus} onClick={() => setEdit({ name: "", code: "", departmentId: deptFilter, sortOrder: (rows.length + 1) * 10, isActive: true })}>
          Thêm {noun}
        </Button>
      </div>
      {hasCode && (
        <p className="text-xs text-slate-500">
          Tên đang trùng với mã là chưa được đặt tên — bấm <Pencil className="inline h-3 w-3" /> để sửa.
        </p>
      )}
      {shown.length === 0 ? <EmptyState icon={Icon} title={`Chưa có ${noun}`} /> : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                {hasCode && <th className="px-3 py-2">Mã</th>}
                <th className="px-3 py-2">Tên</th>
                {isTeam && <th className="px-3 py-2">Phòng ban</th>}
                <th className="px-3 py-2 text-right">Nhân viên</th>
                <th className="px-3 py-2 text-right">Thứ tự</th>
                <th className="px-3 py-2">Trạng thái</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shown.map((r) => (
                <tr key={r.id} className={r.isActive ? "" : "bg-slate-50 text-slate-400"}>
                  {hasCode && <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-slate-500">{r.code || "—"}</td>}
                  <td className={cn("px-3 py-2 font-medium", hasCode && r.code && r.name === r.code ? "italic text-amber-700" : "text-slate-800")}>{r.name}</td>
                  {isTeam && <td className="px-3 py-2 text-slate-600">{r.departmentName || "—"}</td>}
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    {r.userCount}
                    {r.pendingCount > 0 && <span className="ml-1 text-xs text-slate-400" title="Đã gán theo MSNV, chưa có tài khoản">+{r.pendingCount}</span>}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-500">{r.sortOrder}</td>
                  <td className="px-3 py-2">{r.isActive ? <Badge tone="green">Đang dùng</Badge> : <Badge>Ngừng dùng</Badge>}</td>
                  <td className="px-3 py-2 text-right"><IconButton icon={Pencil} title="Sửa" onClick={() => setEdit({ ...r, departmentId: r.departmentId ? String(r.departmentId) : "" })} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? `Sửa ${noun}` : `Thêm ${noun}`} size="sm"
        footer={<><Button variant="secondary" onClick={() => setEdit(null)}>Huỷ</Button><Button loading={saving} onClick={save}>Lưu</Button></>}>
        {edit && (
          <div className="space-y-4">
            <Field label="Tên" required>
              <input className={inputCls} autoFocus maxLength={150} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && save()} />
            </Field>
            {hasCode && (
              <Field label="Mã" hint={isTeam ? "vd: TO 1, KT-PM (cột BP1 trên danh sách nhân sự)" : "vd: CSX, CKT (cột NHÓM BỘ PHẬN)"}>
                <input className={inputCls} maxLength={50} value={edit.code || ""} onChange={(e) => setEdit({ ...edit, code: e.target.value })} />
              </Field>
            )}
            {isTeam && (
              <Field label="Thuộc phòng ban" required hint={edit.id ? "Đổi phòng ban: nhân viên trong tổ chuyển theo" : undefined}>
                <select className={inputCls} value={edit.departmentId || ""} onChange={(e) => setEdit({ ...edit, departmentId: e.target.value })}>
                  <option value="">— Chọn phòng ban —</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </Field>
            )}
            <Field label="Thứ tự hiển thị" hint="Số nhỏ đứng trước">
              <input type="number" className={cn(inputCls, "w-32")} value={edit.sortOrder} onChange={(e) => setEdit({ ...edit, sortOrder: e.target.value })} />
            </Field>
            {edit.id && (
              <Toggle label="Đang dùng" hint="Ngừng dùng: không hiện trong danh sách chọn, nhân viên đã gán vẫn giữ nguyên" checked={edit.isActive} onChange={(v) => setEdit({ ...edit, isActive: v })} />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ------------------------ Đã gán theo MSNV, chưa có tài khoản ------------------------ */
function PendingList() {
  const [rows, setRows] = useState(null);
  const [open, setOpen] = useState(false);
  useEffect(() => { fmApi.orgPending().then(setRows).catch(() => setRows([])); }, []);
  if (!rows?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm">
        <span className="font-medium text-slate-700">{rows.length} người đã gán theo MSNV nhưng chưa có tài khoản</span>
        <span className="text-blue-700">{open ? "Ẩn" : "Xem"}</span>
      </button>
      {open && (
        <div className="overflow-x-auto border-t border-slate-100">
          <p className="px-4 pt-2 text-xs text-slate-500">Khi tạo tài khoản đúng MSNV, người đó tự nhận phòng ban và tổ này.</p>
          <table className="w-full min-w-[520px] text-sm">
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.msnv}>
                  <td className="px-4 py-2 font-mono text-xs text-slate-500">{r.msnv}</td>
                  <td className="px-4 py-2 text-slate-800">{r.fullName}</td>
                  <td className="px-4 py-2 text-slate-600">{r.departmentName || "—"}</td>
                  <td className="px-4 py-2 text-slate-600">{r.teamName || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Gán cho nhân viên ------------------------------ */
function UsersTab({ departments, teams, jobTitles }) {
  const [filters, setFilters] = useState({ search: "", departmentId: "", teamId: "", jobTitleId: "", missing: true });
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [assign, setAssign] = useState({ departmentId: "", teamId: "", jobTitleId: "", allowSelfEdit: false });
  const [saving, setSaving] = useState(false);
  const pageSize = 50;

  const load = useCallback(async () => {
    try {
      const r = await fmApi.orgUsers({
        page, pageSize,
        search: filters.search.trim() || undefined,
        departmentId: filters.departmentId || undefined,
        teamId: filters.teamId || undefined,
        jobTitleId: filters.jobTitleId || undefined,
        missing: filters.missing ? 1 : undefined,
      });
      setData(r);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }, [filters, page]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const setFilter = (patch) => { setFilters((f) => ({ ...f, ...patch })); setPage(1); setSelected(new Set()); };
  const rows = data?.rows || [];
  const allOnPage = rows.length > 0 && rows.every((r) => selected.has(r.userId));
  const toggleAll = () => setSelected((s) => {
    const next = new Set(s);
    if (allOnPage) rows.forEach((r) => next.delete(r.userId));
    else rows.forEach((r) => next.add(r.userId));
    return next;
  });
  const toggle = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const teamsFor = (deptId) => (deptId ? teams.filter((t) => String(t.departmentId) === String(deptId)) : teams);
  const filterTeams = teamsFor(filters.departmentId);
  const assignTeams = teamsFor(assign.departmentId);

  const apply = async () => {
    if (!assign.departmentId && !assign.teamId && !assign.jobTitleId) return toast.error("Chọn phòng ban, tổ và/hoặc chức danh để gán");
    setSaving(true);
    try {
      const body = { userIds: [...selected], allowSelfEdit: assign.allowSelfEdit };
      if (assign.departmentId) body.departmentId = Number(assign.departmentId);
      if (assign.teamId) body.teamId = Number(assign.teamId); // chỉ chọn tổ → phòng tự lấy theo tổ
      if (assign.jobTitleId) body.jobTitleId = Number(assign.jobTitleId);
      const r = await fmApi.assignProfiles(body);
      toast.success(`Đã cập nhật ${r.affected} nhân viên`);
      setSelected(new Set());
      load();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const pages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input className={cn(inputCls, "pl-9")} placeholder="Tìm theo tên / MSNV / tài khoản" value={filters.search} onChange={(e) => setFilter({ search: e.target.value })} />
        </div>
        <select className={cn(inputCls, "w-auto")} value={filters.departmentId} onChange={(e) => setFilter({ departmentId: e.target.value, teamId: "", missing: false })}>
          <option value="">Mọi phòng ban</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className={cn(inputCls, "w-auto")} value={filters.teamId} onChange={(e) => setFilter({ teamId: e.target.value, missing: false })}>
          <option value="">Mọi tổ</option>
          {filterTeams.map((t) => <option key={t.id} value={t.id}>{teamLabel(t, departments, !filters.departmentId)}</option>)}
        </select>
        <select className={cn(inputCls, "w-auto")} value={filters.jobTitleId} onChange={(e) => setFilter({ jobTitleId: e.target.value, missing: false })}>
          <option value="">Mọi chức danh</option>
          {jobTitles.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <Toggle label="Chỉ người chưa đủ" hint="Chưa có phòng ban hoặc chức danh" checked={filters.missing} onChange={(v) => setFilter({ missing: v })} />
      </div>

      {/* Thanh gán hàng loạt */}
      <div className={cn("sticky top-14 z-10 rounded-xl border p-3 transition-colors lg:top-2", selected.size ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white")}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm font-medium text-slate-700">{selected.size ? `Đã chọn ${selected.size} người` : "Chọn nhân viên để gán"}</span>
          <select className={cn(inputCls, "w-auto")} value={assign.departmentId} onChange={(e) => setAssign((a) => ({ ...a, departmentId: e.target.value, teamId: "" }))}>
            <option value="">— Phòng ban (giữ nguyên) —</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select className={cn(inputCls, "w-auto")} value={assign.teamId} onChange={(e) => setAssign((a) => ({ ...a, teamId: e.target.value }))}>
            <option value="">— Tổ (giữ nguyên) —</option>
            {assignTeams.map((t) => <option key={t.id} value={t.id}>{teamLabel(t, departments, !assign.departmentId)}</option>)}
          </select>
          <select className={cn(inputCls, "w-auto")} value={assign.jobTitleId} onChange={(e) => setAssign((a) => ({ ...a, jobTitleId: e.target.value }))}>
            <option value="">— Chức danh (giữ nguyên) —</option>
            {jobTitles.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <Toggle label="Cho tự sửa" checked={assign.allowSelfEdit} onChange={(v) => setAssign((a) => ({ ...a, allowSelfEdit: v }))} />
          <Button className="ml-auto" disabled={!selected.size} loading={saving} onClick={apply}>Gán</Button>
        </div>
      </div>

      {!data ? <Spinner /> : rows.length === 0 ? (
        <EmptyState icon={Users} title={filters.missing ? "Tất cả nhân viên đã có phòng ban và chức danh" : "Không có nhân viên phù hợp"} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="w-10 px-3 py-2"><input type="checkbox" checked={allOnPage} onChange={toggleAll} aria-label="Chọn tất cả trang này" /></th>
                <th className="px-3 py-2">Nhân viên</th>
                <th className="px-3 py-2">Phòng ban</th>
                <th className="px-3 py-2">Tổ</th>
                <th className="px-3 py-2">Chức danh</th>
                <th className="px-3 py-2">Nguồn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.userId} className={cn("cursor-pointer", selected.has(r.userId) ? "bg-blue-50/60" : "hover:bg-slate-50")} onClick={() => toggle(r.userId)}>
                  <td className="px-3 py-2"><input type="checkbox" checked={selected.has(r.userId)} onChange={() => toggle(r.userId)} onClick={(e) => e.stopPropagation()} /></td>
                  <td className="px-3 py-2"><p className="font-medium text-slate-800">{r.fullName}</p><p className="text-xs text-slate-400">{r.msnv || r.username}</p></td>
                  <td className={cn("px-3 py-2", r.departmentName ? "text-slate-700" : "italic text-amber-700")}>{r.departmentName || "Chưa có"}</td>
                  <td className="px-3 py-2 text-slate-700">{r.teamName || <span className="text-slate-300">—</span>}</td>
                  <td className={cn("px-3 py-2", r.jobTitleName ? "text-slate-700" : "italic text-amber-700")}>{r.jobTitleName || "Chưa có"}</td>
                  <td className="px-3 py-2">
                    {r.fromMsnv ? <Badge tone="blue">Theo MSNV</Badge>
                      : r.source === "admin" ? <Badge tone="blue">Admin gán</Badge>
                      : r.source === "self" ? <Badge>Tự khai</Badge>
                      : <span className="text-slate-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>{data.total} nhân viên</span>
          {data.total > pageSize && (
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Trước</Button>
              <span>{page}/{pages}</span>
              <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Sau</Button>
            </div>
          )}
        </div>
      )}

      <PendingList />
    </div>
  );
}

export default function OrgManagement() {
  const [tab, setTab] = useState("users");
  const [catalog, setCatalog] = useState({ departments: [], teams: [], jobTitles: [] });

  const loadCatalog = useCallback(() => {
    Promise.all([fmApi.orgList("departments"), fmApi.orgList("teams"), fmApi.orgList("job-titles")])
      .then(([d, tm, t]) => setCatalog({
        departments: d.filter((x) => x.isActive),
        teams: tm.filter((x) => x.isActive),
        jobTitles: t.filter((x) => x.isActive),
      }))
      .catch((e) => toast.error(errorMessage(e)));
  }, []);
  useEffect(() => { loadCatalog(); }, [loadCatalog]);

  const current = useMemo(() => TABS.find((t) => t.key === tab), [tab]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Phòng ban, tổ & chức danh</h1>
        <p className="text-sm text-slate-500">Dùng để lọc đối tượng biểu mẫu, tự điền thông tin người nộp và thống kê theo phòng ban.</p>
      </div>
      <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-200/60 p-1">
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)}
            className={cn("flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              tab === t.key ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>
      {current.key === "users" ? (
        <UsersTab departments={catalog.departments} teams={catalog.teams} jobTitles={catalog.jobTitles} />
      ) : (
        <CatalogTab key={current.key} kind={current.key} departments={catalog.departments} onChanged={loadCatalog} />
      )}
    </div>
  );
}
