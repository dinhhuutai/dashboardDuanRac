// Quản trị: tạo / sửa mẫu đề xuất (/admin/request/type-builder[/:id][?template=…|?copy=id])
// Sửa mẫu KHÔNG ảnh hưởng đề xuất đã gửi (mỗi đề xuất lưu bản chụp trường + quy trình lúc gửi).
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Eye, GitBranch, ListChecks, Lock, Save, Settings2, SlidersHorizontal } from "lucide-react";
import config from "~/config";
import { Badge, Button, Field, Skeleton, Toggle, cn, inputCls, toast } from "~/pagesForm/shared/ui";
import { errorMessage, rqApi } from "~/pagesRequest/shared/api";
import { UserPicker } from "~/pagesRequest/shared/components";
import { FieldInput } from "~/pagesRequest/shared/FieldInput";
import { FULL_WIDTH_TYPES, isNumericCol, withComputed } from "~/pagesRequest/shared/fieldTypes";
import { useAttachments } from "~/pagesRequest/shared/Attachments";
import { TYPE_COLORS, TYPE_ICONS, TypeIcon } from "~/pagesRequest/shared/typeIcons";
import { ensureBoot, useRq } from "~/pagesRequest/shared/store";
import { TEMPLATES } from "../templates";
import FieldsEditor from "./FieldsEditor";
import FlowEditor from "./FlowEditor";

const R = config.routes;
const TABS = [
  { key: "info", label: "Thông tin chung", icon: Settings2 },
  { key: "fields", label: "Trường thông tin", icon: ListChecks },
  { key: "flow", label: "Quy trình duyệt & theo dõi", icon: GitBranch },
  { key: "scope", label: "Phạm vi & tuỳ chọn", icon: SlidersHorizontal },
  { key: "preview", label: "Xem trước", icon: Eye },
];
const DEFAULT_OPTIONS = { requireAttachment: false, allowAttachments: true, allowFollowers: true, allowPriority: true, allowDeadline: true, titleHint: "" };
const EMPTY = {
  name: "", groupId: null, description: "", icon: "FileText", color: "#2563eb", fields: [], flow: [],
  audience: { type: "all" }, defaultFollowers: [], options: DEFAULT_OPTIONS, sortOrder: 0, isActive: true,
};

function problemsOf(t) {
  const p = {};
  if (!t.name.trim()) p.__name = "Chưa nhập tên mẫu";
  for (const f of t.fields) {
    if (!f.label?.trim()) p[f.key] = "Chưa đặt tên trường";
    else if ((f.type === "select" || f.type === "multiselect") && !(f.options || []).some((o) => o.label.trim())) p[f.key] = "Chưa có lựa chọn";
    else if (f.type === "table") {
      const cols = f.columns || [];
      const plain = new Set(cols.filter((c) => c.type === "number" || c.type === "currency").map((c) => c.key));
      if (!cols.length) p[f.key] = "Bảng chưa có cột";
      else if (cols.some((c) => !c.label?.trim())) p[f.key] = `Bảng "${f.label}": có cột chưa đặt tên`;
      else if (cols.some((c) => c.type === "formula" && !(plain.has(c.of?.[0]) && plain.has(c.of?.[1])))) p[f.key] = `Bảng "${f.label}": cột tự tính chưa chọn đủ 2 cột số`;
    } else if (f.sumOf) {
      const tb = t.fields.find((x) => x.key === f.sumOf.table && x.type === "table");
      if (!isNumericCol(tb?.columns?.find((c) => c.key === f.sumOf.column))) p[f.key] = `Trường "${f.label}": chọn lại cột của bảng để tính tổng`;
    } else if (f.wordsOf) {
      const src = t.fields.find((x) => x.key === f.wordsOf);
      if (!src || (src.type !== "currency" && src.type !== "number")) p[f.key] = `Trường "${f.label}": chọn lại trường số tiền để đọc bằng chữ`;
    }
  }
  if (!t.flow.length) p.__flow = "Cần ít nhất 1 bước duyệt";
  for (const s of t.flow) if (s.approverType === "users" && !s.userIds.length) p[s.key] = "Chưa chọn người duyệt";
  const a = t.audience;
  if (a.type === "targeted" && !a.departmentIds?.length && !a.teamIds?.length && !a.userIds?.length) p.__audience = "Chưa chọn phòng ban / tổ / người";
  return p;
}

function tabOf(problems, t) {
  if (problems.__name) return "info";
  if (t.fields.some((f) => problems[f.key])) return "fields";
  if (problems.__flow || t.flow.some((s) => problems[s.key])) return "flow";
  if (problems.__audience) return "scope";
  return null;
}

function AudienceEditor({ audience, onChange, error }) {
  const dir = useRq((s) => s.dir);
  const a = audience.type === "targeted" ? { departmentIds: [], teamIds: [], userIds: [], ...audience } : audience;
  const toggle = (k, id) => {
    const cur = a[k] || [];
    onChange({ ...a, [k]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] });
  };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {[["all", "Mọi người trong module"], ["targeted", "Chỉ phòng ban / tổ / người được chọn"]].map(([k, l]) => (
          <label key={k} className={cn("flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm", a.type === k ? "border-blue-500 bg-blue-50 text-blue-800" : "border-slate-200")}>
            <input type="radio" checked={a.type === k} onChange={() => onChange(k === "all" ? { type: "all" } : { type: "targeted", departmentIds: [], teamIds: [], userIds: [] })} /> {l}
          </label>
        ))}
      </div>
      {a.type === "targeted" && (
        <div className="space-y-3 rounded-xl border border-slate-200 p-3">
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div>
            <p className="mb-1 text-xs font-semibold text-slate-600">Phòng ban</p>
            <div className="flex flex-wrap gap-1.5">
              {dir?.departments.map((d) => (
                <button key={d.id} type="button" onClick={() => toggle("departmentIds", d.id)}
                  className={cn("rounded-full border px-2.5 py-0.5 text-xs", a.departmentIds.includes(d.id) ? "border-blue-500 bg-blue-600 text-white" : "border-slate-300 text-slate-600 hover:border-blue-400")}>{d.name}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold text-slate-600">Tổ</p>
            <div className="max-h-48 space-y-1.5 overflow-y-auto">
              {dir?.departments.map((d) => {
                const teams = dir.teams.filter((t) => t.departmentId === d.id);
                if (!teams.length) return null;
                return (
                  <div key={d.id} className="flex flex-wrap items-center gap-1.5">
                    <span className="w-28 shrink-0 truncate text-[11px] text-slate-400">{d.name}</span>
                    {teams.map((t) => (
                      <button key={t.id} type="button" onClick={() => toggle("teamIds", t.id)}
                        className={cn("rounded-full border px-2 py-0.5 text-xs", a.teamIds.includes(t.id) ? "border-blue-500 bg-blue-600 text-white" : "border-slate-300 text-slate-600 hover:border-blue-400")}>{t.name}</button>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
          <Field label="Thêm từng người"><UserPicker value={a.userIds} onChange={(v) => onChange({ ...a, userIds: v })} /></Field>
        </div>
      )}
    </div>
  );
}

function Preview({ t }) {
  const [values, setValues] = useState({});
  const att = useAttachments();
  return (
    <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="h-1.5" style={{ background: t.color }} />
      <div className="flex items-start gap-3 p-4">
        <TypeIcon icon={t.icon} color={t.color} size="lg" />
        <div><p className="text-lg font-bold text-slate-800">{t.name || "(chưa đặt tên)"}</p>{t.description && <p className="whitespace-pre-line text-sm text-slate-500">{t.description}</p>}</div>
      </div>
      <div className="grid grid-cols-2 gap-4 border-t border-slate-100 p-4">
        <Field label="Tiêu đề đề xuất" className="col-span-2"><input className={inputCls} placeholder={t.options.titleHint || "Tiêu đề"} /></Field>
        {t.fields.map((f) => f.type === "section" ? (
          <h3 key={f.key} className="col-span-2 border-b border-slate-100 pb-1 font-semibold text-slate-800">{f.label}</h3>
        ) : (
          <div key={f.key} className={f.width === "half" && !FULL_WIDTH_TYPES.includes(f.type) ? "col-span-2 sm:col-span-1" : "col-span-2"}>
            <label className="mb-1 block text-sm font-medium text-slate-700">{f.label || "(chưa đặt tên)"} {f.required && <span className="text-red-500">*</span>}</label>
            <FieldInput field={f} value={values[f.key]} onChange={(v) => setValues((x) => withComputed(t.fields, { ...x, [f.key]: v }))} att={att} />
          </div>
        ))}
      </div>
      <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">Xem trước — không gửi được. Tệp thử tải ở đây vẫn lưu trên máy chủ tệp.</p>
    </div>
  );
}

export default function TypeBuilder() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const isNew = !id;
  const [t, setT] = useState(null);
  const [groups, setGroups] = useState([]);
  const [tab, setTab] = useState("info");
  const [expanded, setExpanded] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [requestCount, setRequestCount] = useState(0);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const g = await rqApi.groups();
      setGroups(g);
      const copyId = Number(params.get("copy")) || null;
      if (!isNew || copyId) {
        const src = await rqApi.type(isNew ? copyId : id);
        const base = { ...EMPTY, ...src, options: { ...DEFAULT_OPTIONS, ...src.options }, description: src.description || "" };
        if (copyId && isNew) {
          setT({ ...base, name: `${src.name} (bản sao)`.slice(0, 200), isActive: false });
          setDirty(true);
        } else {
          setT(base);
          setRequestCount(src.requestCount || 0);
          setDirty(false);
        }
      } else {
        const tpl = TEMPLATES.find((x) => x.key === params.get("template")) || TEMPLATES[0];
        const built = tpl.build();
        const grp = g.find((x) => x.name === tpl.groupName);
        setT({ ...EMPTY, ...built, groupId: grp?.groupId || null, options: { ...DEFAULT_OPTIONS, ...(built.options || {}) } });
        setDirty(tpl.key !== "blank");
      }
    } catch (e) {
      setLoadError(errorMessage(e, "Không tải được mẫu đề xuất"));
    }
  }, [id, isNew, params]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!dirty) return;
    const h = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const update = (patch) => { setT((x) => ({ ...x, ...patch })); setDirty(true); };
  const problems = useMemo(() => (t ? problemsOf(t) : {}), [t]);

  const save = useCallback(async () => {
    if (!t || saving) return;
    const p = problemsOf(t);
    const bad = tabOf(p, t);
    if (bad) {
      setTab(bad);
      const firstField = t.fields.find((f) => p[f.key]);
      if (bad === "fields" && firstField) setExpanded(firstField.key);
      return toast.error(Object.values(p)[0]);
    }
    setSaving(true);
    try {
      const body = { ...t, fields: t.fields.map((f) => (f.options ? { ...f, options: f.options.filter((o) => o.label.trim()) } : f)) };
      const saved = isNew ? await rqApi.createType(body) : await rqApi.updateType(id, body);
      setT({ ...EMPTY, ...saved, options: { ...DEFAULT_OPTIONS, ...saved.options }, description: saved.description || "" });
      setDirty(false);
      ensureBoot(true).catch(() => {});
      toast.success(isNew ? "Đã tạo mẫu đề xuất" : "Đã lưu");
      if (isNew) navigate(`${R.adminRequestTypeBuilder}/${saved.typeId}`, { replace: true });
    } catch (e) {
      toast.error(errorMessage(e, "Lưu thất bại"));
    } finally {
      setSaving(false);
    }
  }, [t, saving, isNew, id, navigate]);

  useEffect(() => {
    const h = (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); save(); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [save]);

  if (loadError) return <div className="p-6 text-center text-sm text-red-600">{loadError} <button type="button" className="ml-2 underline" onClick={load}>Thử lại</button></div>;
  if (!t) {
    return (
      <div className="space-y-4 p-6" role="status" aria-label="Đang tải">
        <Skeleton className="h-10 w-1/2" /><Skeleton className="h-9 w-full" />
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
      </div>
    );
  }

  const tabHasProblem = (k) => tabOf(problems, t) === k;

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-slate-200 bg-white px-3 py-2 lg:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <Link to={R.adminRequestTypes} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" title="Danh sách mẫu"><ArrowLeft className="h-5 w-5" /></Link>
          <TypeIcon icon={t.icon} color={t.color} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-slate-800">{t.name || "Mẫu đề xuất mới"}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {isNew ? <Badge tone="blue">Chưa lưu</Badge> : t.isActive ? <Badge tone="green">Đang dùng</Badge> : <Badge>Đã tắt</Badge>}
              {dirty && !isNew && <span className="text-amber-600">● Có thay đổi chưa lưu</span>}
              {requestCount > 0 && <span className="text-slate-500">{requestCount} đề xuất đã gửi (không bị ảnh hưởng khi sửa)</span>}
            </div>
          </div>
          <Button icon={Save} loading={saving} disabled={!dirty && !isNew} onClick={save} title="Ctrl+S">{isNew ? "Tạo mẫu" : "Lưu"}</Button>
        </div>
        <div className="mt-2 flex gap-1 overflow-x-auto">
          {TABS.map((x) => (
            <button key={x.key} type="button" onClick={() => setTab(x.key)}
              className={cn("relative flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium", tab === x.key ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100")}>
              <x.icon className="h-4 w-4" /> {x.label}
              {tabHasProblem(x.key) && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-5 pb-24 lg:pb-10">
          {tab === "info" && (
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
              <Field label="Tên mẫu đề xuất" required>
                <input className={cn(inputCls, problems.__name && "border-red-400")} value={t.name} maxLength={200} placeholder="VD: Đề nghị nghỉ phép" onChange={(e) => update({ name: e.target.value })} />
              </Field>
              <Field label="Mô tả / hướng dẫn cho người gửi" hint="Hiện ở đầu form khi tạo đề xuất">
                <textarea className={cn(inputCls, "min-h-[70px]")} value={t.description} maxLength={2000} onChange={(e) => update({ description: e.target.value })} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nhóm đề xuất">
                  <select className={inputCls} value={t.groupId || ""} onChange={(e) => update({ groupId: Number(e.target.value) || null })}>
                    <option value="">— Không nhóm —</option>
                    {groups.filter((g) => g.isActive || g.groupId === t.groupId).map((g) => <option key={g.groupId} value={g.groupId}>{g.name}</option>)}
                  </select>
                </Field>
                <Field label="Thứ tự hiển thị" hint="Số nhỏ đứng trước">
                  <input type="number" className={inputCls} value={t.sortOrder} onChange={(e) => update({ sortOrder: Number(e.target.value) || 0 })} />
                </Field>
              </div>
              <Field label="Biểu tượng">
                <div className="flex flex-wrap gap-1.5">
                  {Object.keys(TYPE_ICONS).map((k) => (
                    <button key={k} type="button" onClick={() => update({ icon: k })} className={cn("rounded-xl ring-offset-1", t.icon === k && "ring-2 ring-blue-600")} title={k}>
                      <TypeIcon icon={k} color={t.color} size="sm" />
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Màu">
                <div className="flex flex-wrap gap-2">
                  {TYPE_COLORS.map((c) => <button key={c} type="button" onClick={() => update({ color: c })} className={cn("h-7 w-7 rounded-full ring-offset-2", t.color === c && "ring-2 ring-slate-800")} style={{ background: c }} aria-label={c} />)}
                </div>
              </Field>
              <Toggle label="Đang dùng" hint="Tắt: nhân viên không thấy mẫu này khi tạo đề xuất" checked={t.isActive} onChange={(v) => update({ isActive: v })} />
            </div>
          )}

          {tab === "fields" && <FieldsEditor fields={t.fields} onChange={(fields) => update({ fields })} expanded={expanded} setExpanded={setExpanded} problems={problems} />}

          {tab === "flow" && (
            <>
              {problems.__flow && <p className="mb-2 text-sm text-red-600">{problems.__flow}</p>}
              <FlowEditor flow={t.flow} onChange={(flow) => update({ flow })} problems={problems} />
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4" data-fixed-followers-editor>
                <h3 className="mb-1 flex items-center gap-1.5 font-semibold text-slate-800"><Lock className="h-4 w-4 text-slate-400" /> Người theo dõi cố định</h3>
                <p className="mb-2 text-xs text-slate-500">
                  Luôn được thêm vào MỌI đề xuất của mẫu này (vd. phòng Nhân sự, Kế toán): xem được đề xuất, nhận thông báo kết quả.
                  Người gửi không bỏ được — chỉ quản trị viên. Không áp dụng cho đề xuất đã gửi trước đó.
                </p>
                <UserPicker value={t.defaultFollowers} onChange={(v) => update({ defaultFollowers: v })} placeholder="Chọn người theo dõi cố định…" />
              </div>
            </>
          )}

          {tab === "scope" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="mb-3 font-semibold text-slate-800">Ai được gửi mẫu này</h3>
                <AudienceEditor audience={t.audience} onChange={(audience) => update({ audience })} error={problems.__audience} />
              </div>
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="font-semibold text-slate-800">Tuỳ chọn</h3>
                <Toggle label="Cho đính kèm tệp / ảnh chung" checked={t.options.allowAttachments} onChange={(v) => update({ options: { ...t.options, allowAttachments: v, requireAttachment: v && t.options.requireAttachment } })} />
                {t.options.allowAttachments && <Toggle label="Bắt buộc đính kèm" checked={t.options.requireAttachment} onChange={(v) => update({ options: { ...t.options, requireAttachment: v } })} />}
                <Toggle label="Cho chọn mức độ Gấp" checked={t.options.allowPriority} onChange={(v) => update({ options: { ...t.options, allowPriority: v } })} />
                <Toggle label="Cho đặt hạn xử lý" checked={t.options.allowDeadline} onChange={(v) => update({ options: { ...t.options, allowDeadline: v } })} />
                <Toggle label="Cho người gửi thêm người theo dõi" checked={t.options.allowFollowers} onChange={(v) => update({ options: { ...t.options, allowFollowers: v } })} />
                <Field label="Gợi ý tiêu đề" hint="Hiện mờ trong ô tiêu đề, vd. Nghỉ phép ngày …">
                  <input className={inputCls} value={t.options.titleHint || ""} maxLength={200} onChange={(e) => update({ options: { ...t.options, titleHint: e.target.value } })} />
                </Field>
              </div>
            </div>
          )}

          {tab === "preview" && <Preview t={t} />}
        </div>
      </div>
    </div>
  );
}
