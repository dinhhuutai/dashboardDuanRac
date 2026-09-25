// Cài đặt biểu mẫu: hiện/ẩn, lịch nhận phiếu, đối tượng, tuỳ chọn nộp, giao diện
import { useEffect, useState } from "react";
import { Briefcase, Building2, Layers, Search, User, X } from "lucide-react";
import { errorMessage, fmApi } from "~/pagesForm/shared/api";
import { toInputDateTime } from "~/pagesForm/shared/format";
import { Field, Toggle, cn, inputCls, toast } from "~/pagesForm/shared/ui";

const COLORS = ["#1f4e79", "#2563eb", "#0f766e", "#15803d", "#b45309", "#b91c1c", "#7c3aed", "#334155"];

function Section({ title, hint, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="font-semibold text-slate-800">{title}</h3>
      {hint && <p className="mt-0.5 text-sm text-slate-500">{hint}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function CheckList({ items, selected, onToggle, empty }) {
  if (!items.length) return <p className="text-sm text-slate-400">{empty}</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => {
        const on = selected.has(it.id);
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => onToggle(it)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              on ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-blue-400"
            )}
          >
            {it.name}
            {it.userCount !== undefined && <span className={cn("ml-1 text-xs", on ? "text-blue-100" : "text-slate-400")}>({it.userCount})</span>}
          </button>
        );
      })}
    </div>
  );
}

function UserSearch({ onPick, pickedIds }) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setRows([]); return; }
    const t = setTimeout(() => {
      fmApi.orgUsers({ search: term, pageSize: 10 }).then((r) => setRows(r.rows)).catch((e) => toast.error(errorMessage(e)));
    }, 300);
    return () => clearTimeout(t);
  }, [q]);
  return (
    <div className="relative">
      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
      <input className={cn(inputCls, "pl-9")} placeholder="Tìm nhân viên theo tên / MSNV (ít nhất 2 ký tự)" value={q} onChange={(e) => setQ(e.target.value)} />
      {rows.length > 0 && (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {rows.map((u) => (
            <button
              key={u.userId}
              type="button"
              disabled={pickedIds.has(u.userId)}
              onClick={() => { onPick({ targetType: "user", targetId: u.userId, name: `${u.fullName}${u.msnv ? ` (${u.msnv})` : ""}` }); setQ(""); }}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 disabled:opacity-40"
            >
              <span className="min-w-0 truncate">{u.fullName} <span className="text-slate-400">{u.msnv}</span></span>
              <span className="shrink-0 text-xs text-slate-400">{u.departmentName || "—"}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SettingsPanel({ form, onChange }) {
  const [org, setOrg] = useState({ departments: [], teams: [], jobTitles: [] });
  useEffect(() => {
    Promise.all([fmApi.orgList("departments"), fmApi.orgList("teams"), fmApi.orgList("job-titles")])
      .then(([departments, teams, jobTitles]) => setOrg({
        departments: departments.filter((d) => d.isActive),
        teams: teams.filter((t) => t.isActive),
        jobTitles: jobTitles.filter((t) => t.isActive),
      }))
      .catch((e) => toast.error(errorMessage(e, "Không tải được phòng ban / tổ / chức danh")));
  }, []);
  // Tổ nhóm theo phòng ban để dễ tìm
  const teamGroups = org.departments
    .map((d) => ({ dept: d, teams: org.teams.filter((t) => t.departmentId === d.id) }))
    .filter((g) => g.teams.length);

  const set = (patch) => onChange({ ...form, ...patch });
  const audiences = form.audiences || [];
  const selectedOf = (type) => new Set(audiences.filter((a) => a.targetType === type).map((a) => a.targetId));
  const toggleAudience = (type, item) => {
    const exists = audiences.some((a) => a.targetType === type && a.targetId === item.id);
    set({
      audiences: exists
        ? audiences.filter((a) => !(a.targetType === type && a.targetId === item.id))
        : [...audiences, { targetType: type, targetId: item.id, name: item.name }],
    });
  };
  const users = audiences.filter((a) => a.targetType === "user");

  return (
    <div className="space-y-4">
      <Section title="Trạng thái" hint="Có thể bật/tắt nhanh ở danh sách biểu mẫu.">
        <Toggle label="Hiện cho nhân viên" hint="Tắt = biểu mẫu biến mất khỏi danh sách của nhân viên" checked={form.isVisible} onChange={(v) => set({ isVisible: v })} />
        <Toggle label="Đang nhận phiếu" hint="Tắt = nhân viên vẫn xem được phiếu đã nộp nhưng không nộp/sửa được nữa" checked={form.acceptResponses} onChange={(v) => set({ acceptResponses: v })} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Mở nhận phiếu từ" hint="Để trống = mở ngay">
            <input type="datetime-local" className={inputCls} value={toInputDateTime(form.openAt)} onChange={(e) => set({ openAt: e.target.value || null })} />
          </Field>
          <Field label="Hạn chót" hint="Để trống = không giới hạn">
            <input type="datetime-local" className={inputCls} value={toInputDateTime(form.closeAt)} onChange={(e) => set({ closeAt: e.target.value || null })} />
          </Field>
        </div>
      </Section>

      <Section title="Ai được điền?" hint="Chỉ những người có quyền module Biểu mẫu nội bộ mới thấy biểu mẫu.">
        <div className="grid gap-2 sm:grid-cols-2">
          {[["all", "Tất cả nhân viên"], ["targeted", "Chọn phòng ban / tổ / chức danh / người"]].map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => set({ audienceType: v })}
              className={cn("rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors",
                form.audienceType === v ? "border-blue-600 bg-blue-50 text-blue-800" : "border-slate-300 text-slate-700 hover:border-slate-400")}
            >
              {label}
            </button>
          ))}
        </div>

        {form.audienceType === "targeted" && (
          <div className="space-y-4 rounded-lg bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Người thuộc <b>bất kỳ</b> nhóm nào bên dưới đều thấy biểu mẫu.</p>
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-700"><Building2 className="h-4 w-4" /> Phòng ban</p>
              <CheckList items={org.departments} selected={selectedOf("department")} onToggle={(it) => toggleAudience("department", it)} empty="Chưa có phòng ban — thêm ở mục Phòng ban & chức danh" />
            </div>
            {teamGroups.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-700"><Layers className="h-4 w-4" /> Tổ</p>
                <div className="space-y-2">
                  {teamGroups.map((g) => (
                    <div key={g.dept.id} className="flex flex-wrap items-start gap-x-3 gap-y-1">
                      <span className="w-full pt-1 text-xs text-slate-500 sm:w-44 sm:shrink-0">{g.dept.name}</span>
                      <div className="min-w-0 flex-1">
                        <CheckList items={g.teams} selected={selectedOf("team")}
                          onToggle={(it) => toggleAudience("team", { id: it.id, name: `${it.name} — ${g.dept.name}` })} empty="" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-700"><Briefcase className="h-4 w-4" /> Chức danh</p>
              <CheckList items={org.jobTitles} selected={selectedOf("jobTitle")} onToggle={(it) => toggleAudience("jobTitle", it)} empty="Chưa có chức danh" />
            </div>
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-700"><User className="h-4 w-4" /> Từng nhân viên</p>
              <UserSearch pickedIds={new Set(users.map((u) => u.targetId))} onPick={(a) => set({ audiences: [...audiences, a] })} />
              {users.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {users.map((u) => (
                    <span key={u.targetId} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-sm text-slate-700 ring-1 ring-slate-300">
                      {u.name || `#${u.targetId}`}
                      <button type="button" className="text-slate-400 hover:text-red-600" onClick={() => set({ audiences: audiences.filter((a) => a !== u) })} aria-label="Bỏ">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Section>

      <Section title="Tuỳ chọn nộp phiếu">
        <Toggle label="Cho sửa sau khi nộp" hint="Nhân viên sửa lại câu trả lời trong thời gian còn nhận phiếu" checked={form.allowEditAfterSubmit} onChange={(v) => set({ allowEditAfterSubmit: v })} />
        <Toggle label="Cho nộp nhiều lần" hint="Mỗi lần nộp là 1 phiếu mới (vd: báo cáo sự cố, đề xuất)" checked={form.allowMultiple} onChange={(v) => set({ allowMultiple: v })} />
        <Toggle label="Bắt buộc có phòng ban & chức danh" hint="Nhân viên chưa có sẽ được yêu cầu tự khai trước khi nộp" checked={form.requireProfile} onChange={(v) => set({ requireProfile: v })} />
      </Section>

      <Section title="Giao diện">
        <Field label="Màu chủ đề">
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button key={c} type="button" onClick={() => set({ themeColor: c })} title={c}
                className={cn("h-8 w-8 rounded-full ring-offset-2 transition", (form.themeColor || COLORS[0]) === c && "ring-2 ring-slate-800")}
                style={{ background: c }} />
            ))}
          </div>
        </Field>
        <Field label="Lời cảm ơn sau khi nộp">
          <textarea className={cn(inputCls, "min-h-[72px]")} maxLength={1000} placeholder="Cảm ơn bạn đã dành thời gian trả lời!"
            value={form.thankYouMessage || ""} onChange={(e) => set({ thankYouMessage: e.target.value })} />
        </Field>
      </Section>
    </div>
  );
}
