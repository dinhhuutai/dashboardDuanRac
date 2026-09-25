// Nhân viên tự khai phòng ban + tổ + chức danh (lần đầu).
// Admin đã gán (source='admin'): phòng/tổ chỉ xem; chức danh vẫn tự chọn được nếu còn trống.
import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { errorMessage, fmApi } from "./api";
import { Button, Field, Modal, inputCls, toast } from "./ui";

export function ProfileSummary({ profile, onEdit }) {
  if (!profile) return null;
  const fullyLocked = profile.source === "admin" && !!profile.jobTitleId;
  const items = [
    ["Họ và tên", profile.fullName],
    ["MSNV", profile.msnv],
    ["Phòng ban", profile.departmentName],
    ["Tổ", profile.teamName],
    ["Chức danh", profile.jobTitleName],
  ];
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Building2 className="h-4 w-4 text-slate-400" /> Thông tin người điền
        </p>
        {!fullyLocked && onEdit && (
          <button type="button" onClick={onEdit} className="text-sm font-medium text-blue-700 hover:underline">
            {profile.isComplete ? "Sửa" : "Cập nhật"}
          </button>
        )}
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-5">
        {items.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-xs text-slate-500">{k}</dt>
            <dd className={v ? "truncate font-medium text-slate-800" : "italic text-amber-600"}>{v || "Chưa có"}</dd>
          </div>
        ))}
      </dl>
      {profile.source === "admin" && (
        <p className="mt-2 text-xs text-slate-500">
          Phòng ban/tổ do quản trị viên cập nhật{fullyLocked ? "" : " — bạn chỉ cần chọn chức danh"}.
        </p>
      )}
    </div>
  );
}

export default function ProfileDialog({ open, onClose, onSaved, required }) {
  const [data, setData] = useState(null);
  const [dept, setDept] = useState("");
  const [team, setTeam] = useState("");
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    fmApi
      .myProfile()
      .then((d) => {
        setData(d);
        setDept(d.profile?.departmentId || "");
        setTeam(d.profile?.teamId || "");
        setTitle(d.profile?.jobTitleId || "");
      })
      .catch((e) => toast.error(errorMessage(e)));
  }, [open]);

  const p = data?.profile;
  const orgLocked = p?.source === "admin"; // phòng/tổ do admin gán
  const fullyLocked = orgLocked && !!p?.jobTitleId;
  const teamsOfDept = (data?.teams || []).filter((t) => String(t.departmentId) === String(dept));

  const save = async () => {
    if (!orgLocked && !dept) return toast.error("Vui lòng chọn phòng ban");
    if (!title) return toast.error("Vui lòng chọn chức danh");
    setSaving(true);
    try {
      const r = await fmApi.saveMyProfile({
        departmentId: dept ? Number(dept) : null,
        teamId: team ? Number(team) : null,
        jobTitleId: Number(title),
      });
      toast.success("Đã cập nhật thông tin");
      onSaved?.(r.profile);
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const titleSelect = (
    <Field label="Chức danh / Vị trí" required hint="Không thấy chức danh phù hợp? Chọn gần nhất rồi báo quản trị viên bổ sung.">
      <select className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)}>
        <option value="">— Chọn chức danh —</option>
        {data?.jobTitles.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
    </Field>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Phòng ban, tổ và chức danh"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{required ? "Để sau" : "Huỷ"}</Button>
          {data && !fullyLocked && <Button onClick={save} loading={saving}>Lưu</Button>}
        </>
      }
    >
      {!data ? (
        <p className="py-6 text-center text-sm text-slate-500">Đang tải…</p>
      ) : fullyLocked ? (
        <p className="text-sm text-slate-600">
          Thông tin của bạn do quản trị viên gán ({p.departmentName || "—"}
          {p.teamName ? ` · ${p.teamName}` : ""} · {p.jobTitleName || "—"}). Liên hệ quản trị viên nếu cần thay đổi.
        </p>
      ) : (
        <div className="space-y-4">
          {required && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Biểu mẫu cần biết phòng ban và chức danh của bạn. Chỉ cần khai 1 lần.
            </p>
          )}
          {orgLocked ? (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
              Phòng ban: <b>{p.departmentName || "—"}</b>
              {p.teamName && <> · Tổ: <b>{p.teamName}</b></>}
              <span className="block text-xs text-slate-500">Do quản trị viên gán.</span>
            </p>
          ) : (
            <>
              <Field label="Phòng ban" required>
                <select className={inputCls} value={dept} onChange={(e) => { setDept(e.target.value); setTeam(""); }}>
                  <option value="">— Chọn phòng ban —</option>
                  {data.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </Field>
              {teamsOfDept.length > 0 && (
                <Field label="Tổ">
                  <select className={inputCls} value={team} onChange={(e) => setTeam(e.target.value)}>
                    <option value="">— Chọn tổ —</option>
                    {teamsOfDept.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </Field>
              )}
            </>
          )}
          {titleSelect}
        </div>
      )}
    </Modal>
  );
}
