// Tạo / sửa dự án (admin module 3): tên, mã, đặc tả, mục tiêu, thời gian, trạng thái, tệp đặc tả, thành viên + vai trò.
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Trash2, UserMinus } from "lucide-react";
import config from "~/config";
import { Button, ErrorBox, Field, Skeleton, cn, confirmDialog, inputCls, toast } from "~/pagesForm/shared/ui";
import { AttachmentPicker, useAttachments } from "~/pagesRequest/shared/Attachments";
import { UPLOAD_ENDPOINT, errorMessage, pjApi } from "../shared/api";
import { usePj } from "../shared/store";
import { PROJECT_COLORS, PROJECT_STATUS } from "../shared/meta";
import { Avatar, Page, PersonPicker } from "../shared/components";

const R = config.routes;
const EMPTY = { name: "", code: "", description: "", goals: "", startDate: "", endDate: "", status: "active", color: PROJECT_COLORS[0] };

function RoleSwitch({ value, onChange }) {
  return (
    <div className="inline-flex shrink-0 rounded-lg bg-slate-100 p-0.5 text-xs font-medium">
      {[["assigner", "Giao việc"], ["assignee", "Được giao"]].map(([k, label]) => (
        <button key={k} type="button" onClick={() => onChange(k)}
          className={cn("rounded-md px-2.5 py-1.5 transition", value === k ? (k === "assigner" ? "bg-blue-600 text-white shadow-sm" : "bg-white text-slate-800 shadow-sm") : "text-slate-500")}>
          {label}
        </button>
      ))}
    </div>
  );
}

export default function ProjectForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const boot = usePj((s) => s.boot);
  const att = useAttachments([], { endpoint: UPLOAD_ENDPOINT, config: boot?.files });
  const [v, setV] = useState(id ? null : EMPTY);
  const [members, setMembers] = useState(() => (id || !boot?.me ? [] : [{ userId: boot.me.userId, name: boot.me.fullName, role: "assigner" }]));
  const [files, setFiles] = useState([]);
  const [keep, setKeep] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    pjApi.project(id).then((p) => {
      setV({ name: p.name, code: p.code || "", description: p.description || "", goals: p.goals || "", startDate: p.startDate || "", endDate: p.endDate || "", status: p.status, color: p.color || PROJECT_COLORS[0] });
      setMembers(p.members.map((m) => ({ userId: m.userId, name: m.name, avatar: m.avatar, dept: m.dept, msnv: m.msnv, role: m.role })));
      setFiles(p.files);
      setKeep(p.files.map((f) => f.fileId));
    }).catch((e) => setError(errorMessage(e)));
  }, [id]);

  const set = (k) => (e) => setV((x) => ({ ...x, [k]: e.target.value }));
  const memberIds = useMemo(() => members.map((m) => m.userId), [members]);
  const nAssigner = members.filter((m) => m.role === "assigner").length;

  const save = async () => {
    if (!v.name.trim()) return toast.error("Nhập tên dự án");
    if (!nAssigner) return toast.error("Cần ít nhất 1 người giao việc");
    if (att.uploading) return toast.error("Đợi tệp tải lên xong");
    setBusy(true);
    try {
      const body = { ...v, members: members.map(({ userId, role }) => ({ userId, role })), attachments: att.done, keepFileIds: keep };
      const pid = id ? (await pjApi.updateProject(id, body), Number(id)) : (await pjApi.createProject(body)).projectId;
      toast.success(id ? "Đã lưu dự án" : "Đã tạo dự án");
      navigate(`${R.projectView}/${pid}`);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!(await confirmDialog({ title: "Xoá dự án", message: `Xoá dự án "${v.name}"? Dự án và các công việc sẽ không hiện nữa.`, confirmText: "Xoá dự án", danger: true }))) return;
    try { await pjApi.deleteProject(id); toast.success("Đã xoá dự án"); navigate(R.project); } catch (e) { toast.error(errorMessage(e)); }
  };

  if (!boot?.me?.isAdmin) return <Page><ErrorBox message="Chỉ quản trị module được tạo / sửa dự án" /></Page>;
  if (error) return <Page><ErrorBox message={error} /></Page>;
  if (!v) return <Page><Skeleton className="h-96 w-full rounded-xl" /></Page>;

  return (
    <Page>
      <Link to={id ? `${R.projectView}/${id}` : R.project} className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"><ArrowLeft className="h-4 w-4" /> Quay lại</Link>
      <h1 className="text-xl font-bold text-slate-900">{id ? "Sửa dự án" : "Tạo dự án"}</h1>

      <div className="mt-4 space-y-4 pb-24 lg:pb-0">
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
          <Field label="Tên dự án" required><input className={inputCls} value={v.name} onChange={set("name")} maxLength={200} placeholder="vd: Số hoá quy trình kho" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mã dự án"><input className={inputCls} value={v.code} onChange={set("code")} maxLength={30} placeholder="vd: KHO-2026" /></Field>
            <Field label="Trạng thái">
              <select className={inputCls} value={v.status} onChange={set("status")}>
                {Object.entries(PROJECT_STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="Ngày bắt đầu"><input type="date" className={inputCls} value={v.startDate} onChange={set("startDate")} /></Field>
            <Field label="Ngày kết thúc"><input type="date" className={inputCls} value={v.endDate} min={v.startDate || undefined} onChange={set("endDate")} /></Field>
          </div>
          <Field label="Màu nhận diện">
            <div className="flex flex-wrap gap-2">
              {PROJECT_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setV((x) => ({ ...x, color: c }))} aria-label={c}
                  className={cn("h-8 w-8 rounded-full ring-offset-2 transition", v.color === c && "ring-2 ring-slate-800")} style={{ background: c }} />
              ))}
            </div>
          </Field>
        </section>

        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
          <Field label="Đặc tả" hint="Phạm vi, yêu cầu, cách làm — thành viên đọc ở trang dự án">
            <textarea className={cn(inputCls, "min-h-[140px] resize-y")} value={v.description} onChange={set("description")} />
          </Field>
          <Field label="Mục tiêu" hint="Kết quả cần đạt, chỉ số đo">
            <textarea className={cn(inputCls, "min-h-[100px] resize-y")} value={v.goals} onChange={set("goals")} />
          </Field>
          {files.length > 0 && (
            <Field label="Tệp đặc tả đã có">
              <ul className="space-y-1">
                {files.map((f) => (
                  <li key={f.fileId} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={keep.includes(f.fileId)} onChange={(e) => setKeep((k) => (e.target.checked ? [...k, f.fileId] : k.filter((x) => x !== f.fileId)))} />
                    <span className={cn("truncate", !keep.includes(f.fileId) && "text-slate-400 line-through")}>{f.name}</span>
                  </li>
                ))}
              </ul>
            </Field>
          )}
          <AttachmentPicker att={att} label="Đính kèm tài liệu đặc tả (Word, Excel, PDF, ảnh…)" />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="font-semibold text-slate-800">Thành viên <span className="text-sm font-normal text-slate-400">{members.length}</span></h2>
          <p className="mb-3 text-sm text-slate-500">
            <b>Người giao việc</b> xem việc của mọi thành viên và giao việc; <b>người được giao</b> chỉ thấy việc của mình.
            Người chưa có quyền vào module sẽ được cấp tự động.
          </p>
          <PersonPicker excludeIds={memberIds} placeholder="Thêm thành viên — tìm theo tên, MSNV, phòng ban"
            onPick={(u) => setMembers((ms) => [...ms, { userId: u.id, name: u.name, avatar: u.avatar, dept: u.dept, msnv: u.msnv, role: "assignee" }])} />
          {!nAssigner && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Cần ít nhất 1 người giao việc.</p>}
          <ul className="mt-3 divide-y divide-slate-100">
            {members.map((m) => (
              <li key={m.userId} className="flex flex-wrap items-center gap-2 py-2">
                <Avatar name={m.name} src={m.avatar} size={32} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-800">{m.name}</span>
                  <span className="block truncate text-xs text-slate-400">{[m.msnv, m.dept].filter(Boolean).join(" · ")}</span>
                </span>
                <RoleSwitch value={m.role} onChange={(role) => setMembers((ms) => ms.map((x) => (x.userId === m.userId ? { ...x, role } : x)))} />
                <button type="button" onClick={() => setMembers((ms) => ms.filter((x) => x.userId !== m.userId))} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Bỏ khỏi dự án">
                  <UserMinus className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <div className="fixed inset-x-0 bottom-14 z-30 flex gap-2 border-t border-slate-200 bg-white/95 p-3 backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:p-0">
          {id && <Button variant="secondary" icon={Trash2} onClick={remove} className="text-red-600">Xoá</Button>}
          <Button onClick={save} loading={busy} className="flex-1 lg:ml-auto lg:flex-none">{id ? "Lưu dự án" : "Tạo dự án"}</Button>
        </div>
      </div>
    </Page>
  );
}
