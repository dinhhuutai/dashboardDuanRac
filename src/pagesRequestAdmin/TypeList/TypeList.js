// Quản trị: nhóm đề xuất + danh sách mẫu đề xuất (bật/tắt, sửa, xoá)
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import config from "~/config";
import { Badge, Button, Field, IconButton, Modal, Toggle, CardListSkeleton, cn, confirmDialog, inputCls, toast } from "~/pagesForm/shared/ui";
import { errorMessage, rqApi } from "~/pagesRequest/shared/api";
import { PageScroll } from "~/pagesRequest/shared/components";
import { TypeIcon, TYPE_COLORS } from "~/pagesRequest/shared/typeIcons";
import { ensureBoot } from "~/pagesRequest/shared/store";
import { timeAgo } from "~/pagesRequest/shared/format";
import { TEMPLATES } from "../templates";

const R = config.routes;
const prefetchBuilder = () => import("../TypeBuilder").catch(() => {});

function GroupDialog({ group, onClose, onSaved }) {
  const [g, setG] = useState(group);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!g.name.trim()) return toast.error("Chưa nhập tên nhóm");
    setSaving(true);
    try {
      if (g.groupId) await rqApi.updateGroup(g.groupId, g);
      else await rqApi.createGroup(g);
      toast.success("Đã lưu nhóm");
      onSaved();
    } catch (e) { toast.error(errorMessage(e)); } finally { setSaving(false); }
  };
  return (
    <Modal open onClose={onClose} title={g.groupId ? "Sửa nhóm đề xuất" : "Thêm nhóm đề xuất"} size="sm"
      footer={<><Button variant="secondary" onClick={onClose}>Huỷ</Button><Button loading={saving} onClick={save}>Lưu</Button></>}>
      <div className="space-y-4">
        <Field label="Tên nhóm" required><input className={inputCls} autoFocus value={g.name} maxLength={150} onChange={(e) => setG({ ...g, name: e.target.value })} onKeyDown={(e) => e.key === "Enter" && save()} /></Field>
        <Field label="Màu">
          <div className="flex flex-wrap gap-2">
            {TYPE_COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setG({ ...g, color: c })} className={cn("h-7 w-7 rounded-full ring-offset-2", g.color === c && "ring-2 ring-slate-800")} style={{ background: c }} aria-label={c} />
            ))}
          </div>
        </Field>
        <Field label="Thứ tự" hint="Số nhỏ đứng trước"><input type="number" className={cn(inputCls, "w-28")} value={g.sortOrder} onChange={(e) => setG({ ...g, sortOrder: Number(e.target.value) || 0 })} /></Field>
        {g.groupId && <Toggle label="Đang dùng" checked={g.isActive} onChange={(v) => setG({ ...g, isActive: v })} />}
      </div>
    </Modal>
  );
}

export default function TypeList() {
  const navigate = useNavigate();
  const [types, setTypes] = useState(null);
  const [groups, setGroups] = useState([]);
  const [groupEdit, setGroupEdit] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState({});

  const load = useCallback(async () => {
    try {
      const [t, g] = await Promise.all([rqApi.types(), rqApi.groups()]);
      setTypes(t);
      setGroups(g);
      prefetchBuilder();
    } catch (e) { toast.error(errorMessage(e)); setTypes([]); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const changed = () => { load(); ensureBoot(true).catch(() => {}); };

  const setActive = async (t, v) => {
    setBusy((b) => ({ ...b, [t.typeId]: "active" }));
    try {
      await rqApi.setTypeActive(t.typeId, v);
      setTypes((xs) => xs.map((x) => (x.typeId === t.typeId ? { ...x, isActive: v } : x)));
      ensureBoot(true).catch(() => {});
      toast.success(v ? "Đã bật mẫu — nhân viên thấy ngay" : "Đã tắt mẫu");
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy((b) => ({ ...b, [t.typeId]: null })); }
  };
  const remove = async (t) => {
    if (!(await confirmDialog({ title: "Xoá mẫu đề xuất", message: `Xoá "${t.name}"?${t.requestCount ? `\nĐã có ${t.requestCount} đề xuất dùng mẫu này — các đề xuất đó vẫn giữ nguyên.` : ""}`, confirmText: "Xoá", danger: true }))) return;
    setBusy((b) => ({ ...b, [t.typeId]: "remove" }));
    try {
      await rqApi.deleteType(t.typeId);
      toast.success("Đã xoá mẫu");
      changed();
    } catch (e) { toast.error(errorMessage(e)); setBusy((b) => ({ ...b, [t.typeId]: null })); }
  };
  const go = (to, id) => { if (id) setBusy((b) => ({ ...b, [id]: "open" })); navigate(to); };

  return (
    <PageScroll>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Mẫu đề xuất</h1>
          <p className="text-sm text-slate-500">Mỗi mẫu gồm các trường cần điền và quy trình duyệt (lần lượt / cùng lúc).</p>
        </div>
        <Button icon={Plus} onMouseEnter={prefetchBuilder} onClick={() => setPickerOpen(true)}>Tạo mẫu</Button>
      </div>

      {/* Nhóm */}
      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Nhóm đề xuất</h2>
          <button type="button" onClick={() => setGroupEdit({ name: "", color: TYPE_COLORS[0], sortOrder: (groups.length + 1) * 10, isActive: true })} className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline"><Plus className="h-3.5 w-3.5" /> Thêm nhóm</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {groups.map((g) => (
            <button key={g.groupId} type="button" onClick={() => setGroupEdit({ ...g })}
              className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm hover:bg-slate-50", g.isActive ? "border-slate-200 text-slate-700" : "border-dashed border-slate-300 text-slate-400")}>
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: g.color }} /> {g.name} <span className="text-xs text-slate-400">{g.typeCount}</span>
              <Pencil className="h-3 w-3 text-slate-400" />
            </button>
          ))}
        </div>
      </div>

      {/* Mẫu */}
      <div className="mt-4">
        {!types ? <CardListSkeleton rows={4} /> : types.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="font-medium text-slate-700">Chưa có mẫu đề xuất</p>
            <p className="mt-1 text-sm text-slate-500">Bắt đầu nhanh từ mẫu dựng sẵn: nghỉ phép, tạm ứng, thanh toán, mua sắm…</p>
            <Button className="mt-3" icon={Plus} onClick={() => setPickerOpen(true)}>Tạo mẫu đầu tiên</Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <ul className="divide-y divide-slate-100">
              {types.map((t) => {
                const b = busy[t.typeId];
                return (
                  <li key={t.typeId} className={cn("flex flex-wrap items-center gap-3 px-4 py-3", !t.isActive && "bg-slate-50", b === "open" && "bg-blue-50")}>
                    <TypeIcon icon={t.icon} color={t.color} />
                    <button type="button" className="min-w-0 flex-1 text-left" onMouseEnter={prefetchBuilder} onClick={() => go(`${R.adminRequestTypeBuilder}/${t.typeId}`, t.typeId)}>
                      <p className={cn("truncate font-semibold", t.isActive ? "text-slate-800" : "text-slate-400")}>{t.name}</p>
                      <p className="truncate text-xs text-slate-500">
                        {t.groupName || "Không nhóm"} · {t.stepCount} bước duyệt · {t.audienceType === "all" ? "mọi người" : "nhóm được chọn"} · {t.requestCount} đề xuất
                        {t.pendingCount > 0 && <span className="text-amber-600"> ({t.pendingCount} đang chờ)</span>}
                        {t.updatedByName && ` · sửa ${timeAgo(t.updatedAt)} bởi ${t.updatedByName}`}
                      </p>
                    </button>
                    {!t.isActive && <Badge>Đã tắt</Badge>}
                    <Toggle checked={t.isActive} loading={b === "active"} disabled={!!b && b !== "active"} onChange={(v) => setActive(t, v)} />
                    <IconButton icon={Pencil} title="Sửa" loading={b === "open"} disabled={!!b} onClick={() => go(`${R.adminRequestTypeBuilder}/${t.typeId}`, t.typeId)} />
                    <IconButton icon={Copy} title="Nhân bản" disabled={!!b} onClick={() => go(`${R.adminRequestTypeBuilder}?copy=${t.typeId}`)} />
                    <IconButton icon={Trash2} title="Xoá" danger loading={b === "remove"} disabled={!!b} onClick={() => remove(t)} />
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      <Modal open={pickerOpen} onClose={() => setPickerOpen(false)} title="Tạo mẫu đề xuất" size="lg">
        <p className="mb-3 text-sm text-slate-500">Chọn mẫu dựng sẵn — mọi trường và bước duyệt đều sửa được.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {TEMPLATES.map((t) => (
            <button key={t.key} type="button" onClick={() => { setPickerOpen(false); navigate(`${R.adminRequestTypeBuilder}?template=${t.key}`); }}
              className="rounded-xl border border-slate-200 p-3 text-left transition hover:border-blue-400 hover:bg-blue-50/40">
              <p className="font-semibold text-slate-800">{t.name}</p>
              <p className="mt-0.5 text-xs text-slate-500">{t.hint}</p>
            </button>
          ))}
        </div>
      </Modal>
      {groupEdit && <GroupDialog group={groupEdit} onClose={() => setGroupEdit(null)} onSaved={() => { setGroupEdit(null); changed(); }} />}
    </PageScroll>
  );
}
