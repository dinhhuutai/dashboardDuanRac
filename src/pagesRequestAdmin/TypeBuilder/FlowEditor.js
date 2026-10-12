// Quy trình duyệt: các BƯỚC chạy lần lượt; trong 1 bước có thể nhiều người duyệt CÙNG LÚC
// (tất cả phải duyệt, hoặc 1 người duyệt là đủ).
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Field, IconButton, cn, inputCls } from "~/pagesForm/shared/ui";
import { UserPicker } from "~/pagesRequest/shared/components";
import { APPROVER_TYPES, uid } from "~/pagesRequest/shared/fieldTypes";

const newStep = (n, approverType = "users") => ({ key: uid("s"), name: `Bước ${n}`, approverType, userIds: [], mode: "all" });

const PRESETS = [
  { label: "Tổ trưởng → Trưởng phòng", build: () => [{ ...newStep(1, "team_head"), name: "Tổ trưởng duyệt" }, { ...newStep(2, "dept_head"), name: "Trưởng phòng duyệt" }] },
  { label: "Trưởng phòng → Giám đốc", build: () => [{ ...newStep(1, "dept_head"), name: "Trưởng phòng duyệt" }, { ...newStep(2, "users"), name: "Giám đốc duyệt" }] },
  { label: "Nhiều người duyệt cùng lúc", build: () => [{ ...newStep(1, "users"), name: "Hội đồng duyệt", mode: "all" }] },
  { label: "Người gửi tự chọn", build: () => [{ ...newStep(1, "requester_pick"), name: "Người duyệt" }] },
];

export default function FlowEditor({ flow, onChange, problems }) {
  const set = (i, patch) => onChange(flow.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const move = (i, d) => { const j = i + d; if (j < 0 || j >= flow.length) return; const n = [...flow]; [n[i], n[j]] = [n[j], n[i]]; onChange(n); };

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-blue-50 p-3 text-sm text-blue-900">
        <b>Duyệt lần lượt:</b> thêm nhiều bước — bước sau chỉ bắt đầu khi bước trước xong. <b>Duyệt cùng lúc:</b> chọn nhiều người trong 1 bước.
        Người gửi trùng người duyệt thì bước đó tự bỏ qua.
      </div>
      <div className="flex flex-wrap gap-1.5">
        <span className="text-xs text-slate-500">Dựng nhanh:</span>
        {PRESETS.map((p) => (
          <button key={p.label} type="button" onClick={() => onChange(p.build())} className="rounded-full border border-slate-300 px-2.5 py-0.5 text-xs text-slate-600 hover:border-blue-400 hover:text-blue-700">{p.label}</button>
        ))}
      </div>

      <ol className="space-y-3">
        {flow.map((s, i) => {
          // "khi bước có nhiều người duyệt" chỉ có nghĩa khi bước có thể có > 1 người
          const multi = s.approverType === "users" ? s.userIds.length > 1 : s.approverType === "requester_pick" ? s.maxPick !== 1 : true;
          return (
            <li key={s.key} className={cn("rounded-xl border bg-white p-3", problems[s.key] ? "border-red-300" : "border-slate-200")}>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">{i + 1}</span>
                <input className={cn(inputCls, "py-1.5 font-medium")} value={s.name} maxLength={150} onChange={(e) => set(i, { name: e.target.value })} placeholder="Tên bước (vd. Trưởng phòng duyệt)" />
                <IconButton icon={ArrowUp} title="Lên" disabled={i === 0} onClick={() => move(i, -1)} />
                <IconButton icon={ArrowDown} title="Xuống" disabled={i === flow.length - 1} onClick={() => move(i, 1)} />
                <IconButton icon={Trash2} title="Xoá bước" danger disabled={flow.length <= 1} onClick={() => onChange(flow.filter((_, j) => j !== i))} />
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {APPROVER_TYPES.map((t) => (
                  <label key={t.value} className={cn("flex cursor-pointer items-start gap-2 rounded-lg border p-2 text-sm", s.approverType === t.value ? "border-blue-500 bg-blue-50/60" : "border-slate-200 hover:border-slate-300")}>
                    <input type="radio" className="mt-0.5" checked={s.approverType === t.value} onChange={() => set(i, { approverType: t.value, userIds: t.value === "users" || t.value === "requester_pick" ? s.userIds : [], optional: t.value === "requester_pick" ? s.optional : undefined, maxPick: t.value === "requester_pick" ? s.maxPick : undefined })} />
                    <span><span className="block font-medium text-slate-800">{t.label}</span><span className="block text-xs text-slate-500">{t.hint}</span></span>
                  </label>
                ))}
              </div>
              {s.approverType === "users" && (
                <Field label="Người duyệt" required className="mt-3">
                  <UserPicker value={s.userIds} onChange={(v) => set(i, { userIds: v })} placeholder="Chọn người duyệt…" />
                </Field>
              )}
              {s.approverType === "requester_pick" && (
                <>
                  <Field label="Chỉ cho chọn trong danh sách" hint="Để trống = người gửi chọn bất kỳ ai" className="mt-3">
                    <UserPicker value={s.userIds} onChange={(v) => set(i, { userIds: v })} placeholder="Giới hạn danh sách (tuỳ chọn)…" />
                  </Field>
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                    <label className="inline-flex items-center gap-2 text-slate-700">
                      Người gửi được chọn
                      <span className="inline-block w-36">
                        <select className={cn(inputCls, "py-1")} value={s.maxPick === 1 ? "1" : ""} aria-label="Số người được chọn"
                          onChange={(e) => { const { maxPick, ...rest } = s; onChange(flow.map((x, j) => (j === i ? (e.target.value ? { ...rest, maxPick: 1 } : rest) : x))); }}>
                          <option value="1">1 người</option>
                          <option value="">Nhiều người</option>
                        </select>
                      </span>
                    </label>
                    <label className="inline-flex cursor-pointer items-center gap-2 text-slate-700">
                      <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600" checked={!!s.optional} onChange={(e) => set(i, { optional: e.target.checked })} />
                      Không bắt buộc <span className="text-xs text-slate-400">(người gửi không chọn ai → bỏ qua bước này)</span>
                    </label>
                  </div>
                </>
              )}
              {multi && (
                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                  <span className="text-xs text-slate-500">Khi bước có nhiều người duyệt:</span>
                  {[["all", "Tất cả phải duyệt"], ["any", "1 người duyệt là đủ"]].map(([k, l]) => (
                    <label key={k} className={cn("inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs", s.mode === k ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-300 text-slate-600")}>
                      <input type="radio" className="hidden" checked={s.mode === k} onChange={() => set(i, { mode: k })} /> {l}
                    </label>
                  ))}
                </div>
              )}
              {problems[s.key] && <p className="mt-2 text-xs text-red-600">{problems[s.key]}</p>}
            </li>
          );
        })}
      </ol>
      <button type="button" onClick={() => onChange([...flow, newStep(flow.length + 1)])} disabled={flow.length >= 10}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-white py-2.5 text-sm font-medium text-blue-700 hover:border-blue-400 hover:bg-blue-50 disabled:opacity-40">
        <Plus className="h-4 w-4" /> Thêm bước duyệt (lần lượt)
      </button>
    </div>
  );
}
