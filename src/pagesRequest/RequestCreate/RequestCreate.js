// Tạo đề xuất mới (/request/new?type=ID) và sửa & gửi lại (/request/edit/:id).
// Bước 1: chọn mẫu (nhóm theo nhóm đề xuất, tìm kiếm). Bước 2: điền form + đính kèm + xem trước quy trình duyệt.
// Tự lưu nháp trên máy theo từng mẫu (tải lại trang không mất).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Check, ChevronRight, Info, Paperclip, Search, Send, Trash2, Users, Zap } from "lucide-react";
import config from "~/config";
import { Button, Field, Skeleton, cn, confirmDialog, inputCls, toast } from "~/pagesForm/shared/ui";
import { errorMessage, rqApi } from "../shared/api";
import { FileServerNotice, PageScroll, UserList, UserPicker, norm } from "../shared/components";
import { AttachmentPicker, FileGallery, UploadWarning, useAttachments } from "../shared/Attachments";
import { FieldInput } from "../shared/FieldInput";
import { APPROVER_META, validateValues } from "../shared/fieldTypes";
import { TypeIcon } from "../shared/typeIcons";
import { refreshCounts, rqEvents, useRq } from "../shared/store";

const R = config.routes;

/* ------------------------------ Bước 1: chọn mẫu ------------------------------ */
function TypePicker({ onPick }) {
  const boot = useRq((s) => s.boot);
  const [q, setQ] = useState("");
  const groups = useMemo(() => {
    const nq = norm(q.trim());
    const list = (boot?.types || []).filter((t) => !nq || norm(`${t.name} ${t.description || ""}`).includes(nq));
    const byGroup = new Map();
    for (const t of list) {
      const k = t.groupId || 0;
      if (!byGroup.has(k)) byGroup.set(k, []);
      byGroup.get(k).push(t);
    }
    const order = [...(boot?.groups || []).map((g) => g.groupId), 0];
    return order.filter((k) => byGroup.has(k)).map((k) => ({
      group: boot.groups.find((g) => g.groupId === k) || { groupId: 0, name: "Khác", color: "#64748b" },
      types: byGroup.get(k),
    }));
  }, [boot, q]);

  return (
    <PageScroll max="max-w-4xl">
      <h1 className="text-xl font-bold text-slate-800">Tạo đề xuất</h1>
      <p className="text-sm text-slate-500">Chọn loại đề xuất bạn muốn gửi.</p>
      <label className="relative mt-4 block">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm mẫu đề xuất (nghỉ phép, tạm ứng, mua sắm…)" className={cn(inputCls, "pl-9")} />
      </label>
      {(boot?.types || []).length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          Chưa có mẫu đề xuất nào dành cho bạn. {boot?.me?.isAdmin ? "Vào Quản trị → Mẫu đề xuất để tạo." : "Liên hệ quản trị viên."}
        </div>
      )}
      {groups.map(({ group, types }) => (
        <section key={group.groupId} className="mt-6">
          <h2 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: group.color || "#64748b" }} /> {group.name}
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {types.map((t) => (
              <button key={t.typeId} type="button" onClick={() => onPick(t.typeId)}
                className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-blue-400 hover:shadow-sm active:scale-[0.99]">
                <TypeIcon icon={t.icon} color={t.color} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-slate-800">{t.name}</span>
                  <span className="block truncate text-xs text-slate-500">{t.description || `${t.flow.length} bước duyệt`}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-blue-600" />
              </button>
            ))}
          </div>
        </section>
      ))}
      {q && groups.length === 0 && <p className="mt-6 text-center text-sm text-slate-400">Không tìm thấy mẫu phù hợp</p>}
    </PageScroll>
  );
}

/* ------------------------------ Xem trước quy trình ------------------------------ */
function FlowPreview({ flow, picked, setPicked, errors }) {
  const boot = useRq((s) => s.boot);
  const me = boot?.me;
  const heads = boot?.myHeads || { department: [], team: [] };
  return (
    <ol className="space-y-3">
      {flow.map((s, i) => {
        let body;
        let warn = null;
        if (s.approverType === "users") body = <UserList ids={s.userIds} />;
        else if (s.approverType === "dept_head") {
          if (!me?.departmentId) warn = "Bạn chưa có phòng ban — liên hệ quản trị viên để được gán, nếu không sẽ không gửi được.";
          else if (!heads.department.length) warn = "Phòng của bạn chưa được cấu hình trưởng phòng — liên hệ quản trị viên.";
          body = <span className="text-sm text-slate-600">Trưởng phòng {me?.departmentName ? `(${me.departmentName})` : ""}: {heads.department.length ? <UserList ids={heads.department} /> : "—"}</span>;
        } else if (s.approverType === "team_head") {
          const ids = heads.team.length ? heads.team : heads.department;
          if (!me?.departmentId && !me?.teamId) warn = "Bạn chưa có tổ/phòng ban — liên hệ quản trị viên.";
          else if (!ids.length) warn = "Tổ/phòng của bạn chưa được cấu hình người duyệt — liên hệ quản trị viên.";
          body = <span className="text-sm text-slate-600">{heads.team.length ? "Tổ trưởng" : "Trưởng phòng (tổ chưa có tổ trưởng)"}: {ids.length ? <UserList ids={ids} /> : "—"}</span>;
        } else {
          body = (
            <div>
              <UserPicker value={picked[s.key] || []} onChange={(v) => setPicked((p) => ({ ...p, [s.key]: v }))}
                allowIds={s.userIds?.length ? s.userIds : undefined} excludeIds={me ? [me.userId] : []} placeholder="Chọn người duyệt…" />
              {errors[s.key] && <p className="mt-1 text-xs text-red-600">{errors[s.key]}</p>}
            </div>
          );
        }
        return (
          <li key={s.key} className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700 ring-1 ring-blue-200">{i + 1}</span>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-medium text-slate-800">
                {s.name} <span className="text-xs font-normal text-slate-400">· {APPROVER_META[s.approverType]?.label}{s.mode === "any" ? " · 1 người duyệt là đủ" : ""}</span>
              </p>
              {body}
              {warn && <p className="flex items-start gap-1 text-xs text-amber-700"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{warn}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------ Bước 2: điền form ------------------------------ */
function RequestForm({ type, edit, onBack }) {
  const navigate = useNavigate();
  const me = useRq((s) => s.boot?.me);
  const draftKey = edit ? null : `rq_draft_${me?.userId}_${type.typeId}`;
  const draft = useMemo(() => {
    if (!draftKey) return null;
    try { return JSON.parse(localStorage.getItem(draftKey) || "null"); } catch { return null; }
  }, [draftKey]);

  const [title, setTitle] = useState(edit?.title ?? draft?.title ?? "");
  const [values, setValues] = useState(edit?.values ?? draft?.values ?? {});
  const [priority, setPriority] = useState(edit?.priority ?? draft?.priority ?? "normal");
  const [deadline, setDeadline] = useState(edit?.deadline ?? draft?.deadline ?? "");
  const [followers, setFollowers] = useState(draft?.followers ?? []);
  const [picked, setPicked] = useState(draft?.picked ?? {});
  const [keepIds, setKeepIds] = useState(() => new Set((edit?.files || []).map((f) => f.fileId)));
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [restored, setRestored] = useState(!!draft && !edit);
  const att = useAttachments();
  const cardRefs = useRef({});

  const fields = edit ? edit.fields : type.fields;
  const options = edit ? edit.options : type.options;
  const flow = edit ? [] : type.flow;

  // tự lưu nháp (chỉ khi tạo mới)
  useEffect(() => {
    if (!draftKey) return;
    const t = setTimeout(() => {
      try {
        const empty = !title && !Object.keys(values).length && !followers.length;
        if (empty) localStorage.removeItem(draftKey);
        else localStorage.setItem(draftKey, JSON.stringify({ title, values, priority, deadline, followers, picked }));
      } catch { /* đầy bộ nhớ */ }
    }, 500);
    return () => clearTimeout(t);
  }, [draftKey, title, values, priority, deadline, followers, picked]);

  const setValue = (k, v) => {
    setValues((xs) => ({ ...xs, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const discardDraft = async () => {
    if (!(await confirmDialog({ title: "Xoá nháp", message: "Xoá nội dung đang điền dở của mẫu này?", confirmText: "Xoá nháp", danger: true }))) return;
    try { localStorage.removeItem(draftKey); } catch { /* bỏ qua */ }
    setTitle(""); setValues({}); setPriority("normal"); setDeadline(""); setFollowers([]); setPicked({}); setRestored(false);
  };

  const submit = async () => {
    if (sending) return;
    if (att.uploading) return toast.info("Đợi tải tệp xong rồi gửi");
    if (att.failed) return toast.error("Có tệp tải lên lỗi — thử lại hoặc bỏ tệp đó");
    const filesByField = {};
    for (const f of att.done) if (f.fieldKey) filesByField[f.fieldKey] = (filesByField[f.fieldKey] || 0) + 1;
    for (const f of edit?.files || []) if (f.fieldKey && keepIds.has(f.fileId)) filesByField[f.fieldKey] = (filesByField[f.fieldKey] || 0) + 1;
    const errs = validateValues(fields, values, filesByField);
    for (const s of flow) if (s.approverType === "requester_pick" && !(picked[s.key] || []).length) errs[s.key] = "Chọn người duyệt";
    const generalCount = att.done.filter((f) => !f.fieldKey).length + (edit?.files || []).filter((f) => !f.fieldKey && keepIds.has(f.fileId)).length;
    if (options.requireAttachment && generalCount + Object.values(filesByField).reduce((a, b) => a + b, 0) === 0) errs.__files = "Mẫu này bắt buộc đính kèm tệp";
    setErrors(errs);
    const first = Object.keys(errs)[0];
    if (first) {
      cardRefs.current[first]?.scrollIntoView({ behavior: "smooth", block: "center" });
      return toast.error(`Còn ${Object.keys(errs).length} mục cần điền`);
    }
    setSending(true);
    try {
      if (edit) {
        await rqApi.update(edit.requestId, {
          title: title.trim(), values, priority, deadline: deadline || null,
          keepFileIds: [...keepIds], attachments: att.done, note: note.trim() || null,
        });
        toast.success(edit.status === "returned" ? "Đã gửi lại đề xuất" : "Đã lưu thay đổi");
        rqEvents.emit("changed", { requestId: edit.requestId });
        refreshCounts();
        navigate(`${R.request}?box=mine&id=${edit.requestId}`, { replace: true });
      } else {
        const r = await rqApi.create({
          typeId: type.typeId, title: title.trim(), values, priority, deadline: deadline || null,
          attachments: att.done, followerIds: followers, pickedApprovers: picked,
        });
        try { localStorage.removeItem(draftKey); } catch { /* bỏ qua */ }
        toast.success(r.status === "approved" ? "Đã gửi — đề xuất tự duyệt (bạn là người duyệt)" : "Đã gửi đề xuất");
        rqEvents.emit("changed", { requestId: r.requestId });
        refreshCounts();
        navigate(`${R.request}?box=mine&id=${r.requestId}`, { replace: true });
      }
    } catch (e) {
      toast.error(errorMessage(e, "Gửi đề xuất thất bại"));
      setSending(false);
    }
  };

  const halfOk = (f) => f.width === "half" && !["textarea", "files", "multiselect", "section"].includes(f.type);

  return (
    <PageScroll max="max-w-3xl">
      <button type="button" onClick={onBack} className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> {edit ? "Quay lại đề xuất" : "Chọn mẫu khác"}
      </button>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1.5" style={{ background: type.color || "#2563eb" }} />
        <div className="flex items-start gap-3 p-4">
          <TypeIcon icon={type.icon} color={type.color} size="lg" />
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-slate-800">{edit ? `Sửa đề xuất #${edit.requestId}` : type.name}</h1>
            {edit ? <p className="text-sm text-slate-500">{type.name}</p> : type.description && <p className="mt-0.5 whitespace-pre-line text-sm text-slate-500">{type.description}</p>}
          </div>
        </div>
      </div>

      {restored && (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          <span>Đã khôi phục nội dung bạn điền dở lần trước.</span>
          <button type="button" className="font-medium underline" onClick={discardDraft}>Xoá nháp</button>
        </div>
      )}
      {edit?.status === "returned" && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-violet-50 px-4 py-3 text-sm text-violet-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0" /> Đề xuất bị trả lại để bổ sung. Sửa xong bấm "Gửi lại" — đề xuất được duyệt lại từ bước 1.
        </div>
      )}

      <div className="mt-4 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <Field label="Tiêu đề đề xuất" hint={!edit && !title ? `Để trống sẽ đặt: "${type.name} - ${me?.fullName || ""}"` : undefined}>
          <input className={inputCls} value={title} maxLength={300} placeholder={options.titleHint || "VD: Nghỉ phép 2 ngày để đi khám bệnh"} onChange={(e) => setTitle(e.target.value)} />
        </Field>

        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
          {fields.map((f) => {
            if (f.type === "section") {
              return (
                <div key={f.key} className="col-span-2 border-b border-slate-100 pb-1 pt-2">
                  <h3 className="font-semibold text-slate-800">{f.label}</h3>
                  {f.description && <p className="text-xs text-slate-500">{f.description}</p>}
                </div>
              );
            }
            return (
              <div key={f.key} ref={(el) => { cardRefs.current[f.key] = el; }} className={cn(halfOk(f) ? "col-span-2 sm:col-span-1" : "col-span-2")}>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {f.label} {f.required && <span className="text-red-500">*</span>}
                </label>
                {f.description && f.type !== "checkbox" && <p className="-mt-0.5 mb-1 text-xs text-slate-500">{f.description}</p>}
                <FieldInput field={f} value={values[f.key]} onChange={(v) => setValue(f.key, v)} error={errors[f.key]} att={att} />
                {f.type === "files" && edit?.files?.some((x) => x.fieldKey === f.key) && (
                  <ExistingFiles files={edit.files.filter((x) => x.fieldKey === f.key)} keepIds={keepIds} setKeepIds={setKeepIds} />
                )}
                {errors[f.key] && <p className="mt-1 text-xs text-red-600">{errors[f.key]}</p>}
              </div>
            );
          })}
        </div>

        {options.allowAttachments !== false && (
          <div ref={(el) => { cardRefs.current.__files = el; }}>
            <p className="mb-1 flex items-center gap-1.5 text-sm font-medium text-slate-700">
              <Paperclip className="h-4 w-4" /> Tệp đính kèm {options.requireAttachment && <span className="text-red-500">*</span>}
            </p>
            <FileServerNotice className="mb-2" />
            {edit?.files?.some((x) => !x.fieldKey) && <ExistingFiles files={edit.files.filter((x) => !x.fieldKey)} keepIds={keepIds} setKeepIds={setKeepIds} />}
            <AttachmentPicker att={att} />
            <UploadWarning att={att} />
            {errors.__files && <p className="mt-1 text-xs text-red-600">{errors.__files}</p>}
          </div>
        )}

        {(options.allowPriority || options.allowDeadline) && (
          <div className="grid gap-4 sm:grid-cols-2">
            {options.allowPriority && (
              <Field label="Mức độ">
                <div className="flex gap-2">
                  {[["normal", "Bình thường"], ["high", "Gấp"]].map(([k, l]) => (
                    <button key={k} type="button" onClick={() => setPriority(k)}
                      className={cn("inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm", priority === k ? (k === "high" ? "border-red-500 bg-red-50 font-semibold text-red-700" : "border-blue-600 bg-blue-50 font-semibold text-blue-700") : "border-slate-300 text-slate-600")}>
                      {k === "high" && <Zap className="h-4 w-4" />}{l}
                    </button>
                  ))}
                </div>
              </Field>
            )}
            {options.allowDeadline && (
              <Field label="Hạn cần xử lý" hint="Không bắt buộc">
                <input type="date" className={inputCls} value={deadline || ""} onChange={(e) => setDeadline(e.target.value)} />
              </Field>
            )}
          </div>
        )}
      </div>

      {!edit && (
        <div className="mt-4 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <div>
            <h3 className="mb-3 flex items-center gap-1.5 font-semibold text-slate-800"><Check className="h-4 w-4 text-emerald-600" /> Quy trình duyệt</h3>
            <div ref={(el) => { flow.forEach((s) => { cardRefs.current[s.key] = el; }); }}>
              <FlowPreview flow={flow} picked={picked} setPicked={setPicked} errors={errors} />
            </div>
          </div>
          {options.allowFollowers && (
            <div>
              <h3 className="mb-1 flex items-center gap-1.5 font-semibold text-slate-800"><Users className="h-4 w-4 text-slate-400" /> Người theo dõi</h3>
              <p className="mb-2 text-xs text-slate-500">Người theo dõi xem được đề xuất và nhận thông báo kết quả.</p>
              {type.defaultFollowers?.length > 0 && <div className="mb-2"><span className="mr-2 text-xs text-slate-400">Mặc định:</span><UserList ids={type.defaultFollowers} /></div>}
              <UserPicker value={followers} onChange={setFollowers} excludeIds={[me?.userId, ...(type.defaultFollowers || [])]} placeholder="Thêm người theo dõi…" />
            </div>
          )}
        </div>
      )}

      {edit && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <Field label="Ghi chú cho người duyệt" hint="Không bắt buộc — vd. đã bổ sung hoá đơn">
            <textarea className={cn(inputCls, "min-h-[70px]")} value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} />
          </Field>
        </div>
      )}

      <div className="sticky bottom-0 z-10 -mx-4 mt-4 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:rounded-2xl sm:border">
        <div className="flex items-center justify-end gap-2">
          <span className="mr-auto text-xs text-slate-400">{att.uploading ? "Đang tải tệp lên…" : flow.length ? `${flow.length} bước duyệt` : ""}</span>
          <Button variant="secondary" onClick={onBack} disabled={sending}>Huỷ</Button>
          <Button icon={Send} loading={sending || att.uploading} onClick={submit}>{edit ? (edit.status === "returned" ? "Gửi lại" : "Lưu thay đổi") : "Gửi đề xuất"}</Button>
        </div>
      </div>
    </PageScroll>
  );
}

function ExistingFiles({ files, keepIds, setKeepIds }) {
  const kept = files.filter((f) => keepIds.has(f.fileId));
  const removed = files.filter((f) => !keepIds.has(f.fileId));
  return (
    <div className="mb-2 space-y-2">
      {kept.length > 0 && <FileGallery files={kept} size="sm" allowDownloadAll={false} />}
      <div className="flex flex-wrap gap-1.5">
        {kept.map((f) => (
          <button key={f.fileId} type="button" onClick={() => setKeepIds((s) => { const n = new Set(s); n.delete(f.fileId); return n; })}
            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 hover:bg-red-50 hover:text-red-700" title="Bỏ tệp này">
            <Trash2 className="h-3 w-3" /> {f.name}
          </button>
        ))}
        {removed.map((f) => (
          <button key={f.fileId} type="button" onClick={() => setKeepIds((s) => new Set(s).add(f.fileId))}
            className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600 line-through" title="Giữ lại tệp này">
            {f.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function FormSkeleton() {
  return (
    <PageScroll max="max-w-3xl">
      <div className="space-y-4" role="status" aria-label="Đang tải">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">{[0, 1, 2, 3].map((i) => <div key={i} className="space-y-1.5"><Skeleton className="h-4 w-32" /><Skeleton className="h-10 w-full" /></div>)}</div>
      </div>
    </PageScroll>
  );
}

/* ------------------------------ Trang ------------------------------ */
export default function RequestCreate() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const boot = useRq((s) => s.boot);
  const typeId = Number(params.get("type")) || null;
  const [edit, setEdit] = useState(null);
  const [editError, setEditError] = useState(null);

  const loadEdit = useCallback(async () => {
    setEditError(null);
    try {
      const d = await rqApi.detail(id);
      if (!d.permissions.edit) throw new Error("Đề xuất này không sửa được nữa (đã có người xử lý hoặc đã kết thúc)");
      setEdit(d);
    } catch (e) {
      setEditError(e.response ? errorMessage(e) : e.message);
    }
  }, [id]);
  useEffect(() => { if (id) loadEdit(); }, [id, loadEdit]);

  if (id) {
    if (editError) {
      return (
        <PageScroll max="max-w-xl">
          <div className="rounded-xl bg-red-50 p-6 text-center text-sm text-red-700">
            <p>{editError}</p>
            <Button variant="secondary" className="mt-3" onClick={() => navigate(`${R.request}?id=${id}`)}>Xem đề xuất</Button>
          </div>
        </PageScroll>
      );
    }
    if (!edit) return <FormSkeleton />;
    const type = { typeId: edit.typeId, name: edit.typeName, icon: edit.icon, color: edit.color };
    return <RequestForm key={`e${id}`} type={type} edit={edit} onBack={() => navigate(`${R.request}?box=mine&id=${id}`)} />;
  }

  const type = typeId ? boot?.types?.find((t) => t.typeId === typeId) : null;
  if (typeId && !type) {
    return (
      <PageScroll max="max-w-xl">
        <div className="rounded-xl bg-amber-50 p-6 text-center text-sm text-amber-800">
          Mẫu đề xuất không tồn tại, đã ngừng dùng hoặc không dành cho bạn.
          <div><Button variant="secondary" className="mt-3" onClick={() => setParams({})}>Chọn mẫu khác</Button></div>
        </div>
      </PageScroll>
    );
  }
  if (!type) return <TypePicker onPick={(tid) => setParams({ type: String(tid) })} />;
  return <RequestForm key={`n${type.typeId}`} type={type} onBack={() => setParams({})} />;
}
