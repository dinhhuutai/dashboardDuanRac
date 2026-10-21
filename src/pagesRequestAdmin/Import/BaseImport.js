// Quản trị: nhập đề xuất cũ từ Base Request (tệp Excel "xuất đề xuất" của request.base.vn) vào module 18.
// Trình duyệt đọc tệp (SheetJS) → backend (RequestManagement/imports.js + baseImport.js) khớp NGƯỜI theo tên
// (họ tên, email, tên viết tắt kiểu Base), NHÓM Base với mẫu đề xuất và từng NHÃN với trường của mẫu theo tên.
// Admin xem lại / sửa khớp → bấm Nhập: gửi từng phần 50 dòng (thanh tiến trình). Nhập lại cùng tệp không tạo trùng.
// Lịch sử nhập + hoàn tác ở cuối trang. Cần sql/12.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle, ArrowRight, CheckCircle2, Eye, FileSpreadsheet, FileUp, History, Info, Loader2, RefreshCw, Undo2, Upload, UserX,
} from "lucide-react";
import config from "~/config";
import { Badge, Button, EmptyState, IconButton, InlineLoading, Modal, Refreshing, Skeleton, cn, confirmDialog, inputCls, toast } from "~/pagesForm/shared/ui";
import { errorMessage, rqApi } from "~/pagesRequest/shared/api";
import { Card, PageScroll, StatusBadge, UserAvatar, UserPicker, norm } from "~/pagesRequest/shared/components";
import { FieldValues } from "~/pagesRequest/shared/FieldInput";
import { FIELD_META } from "~/pagesRequest/shared/fieldTypes";
import { APPROVER_STATUS, STATUS, fmtDateTime, fmtYmd } from "~/pagesRequest/shared/format";
import { refreshCounts, useRq } from "~/pagesRequest/shared/store";

const R = config.routes;
const CHUNK = 50;
const MAPPABLE = ["text", "textarea", "number", "currency", "date", "select", "multiselect", "checkbox", "table"];
const HOW = {
  previous: ["Như lần nhập trước", "blue"],
  name: ["Trùng họ tên", "green"],
  email: ["Trùng email", "green"],
  initials: ["Đoán theo tên viết tắt", "amber"],
  username: ["Trùng tên đăng nhập", "amber"],
  manual: ["Chọn tay", "blue"],
};
const BATCH_STATUS = { running: ["Chưa xong", "amber"], done: ["Đã nhập", "green"], undone: ["Đã hoàn tác", "slate"] };

const pad = (n) => String(n).padStart(2, "0");
const cellText = (c) => (c instanceof Date
  ? `${c.getFullYear()}-${pad(c.getMonth() + 1)}-${pad(c.getDate())}T${pad(c.getHours())}:${pad(c.getMinutes())}:${pad(c.getSeconds())}`
  : String(c ?? ""));
const isCodeHeader = (c) => norm(c).replace(/[^a-z0-9]/g, "") === "madexuat";

/** Đọc tệp Excel Base → các trang tính có dòng tiêu đề "Mã đề xuất" */
async function readBaseFile(file) {
  const XLSX = await import("xlsx-js-style");
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
  const sheets = [];
  for (const name of wb.SheetNames) {
    const all = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: "", raw: true, blankrows: false });
    const hi = all.slice(0, 15).findIndex((r) => r.some(isCodeHeader));
    if (hi < 0) continue;
    const rows = all.slice(hi + 1).filter((r) => r.some((c) => String(c ?? "").trim())).map((r) => r.map(cellText));
    sheets.push({ name, header: all[hi].map(cellText), rows });
  }
  return sheets;
}

/* ------------------------------ Người: Base → tài khoản NOIBO ------------------------------ */
function PersonCell({ p, info, chosenNone, onChange }) {
  const dir = useRq((s) => s.dir);
  const [edit, setEdit] = useState(false);
  const nameOf = (id) => info[id]?.name || dir?.userById.get(id)?.name || `Người dùng #${id}`;
  const u = p.userId ? info[p.userId] || { name: nameOf(p.userId), active: true } : null;
  if (!edit && p.userId) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 py-0.5 pl-0.5 pr-2.5 text-sm text-blue-900 ring-1 ring-blue-200">
          <UserAvatar id={p.userId} name={u.name} size={22} /> <b className="font-semibold">{u.name}</b>{u.msnv && <span className="text-xs text-blue-700/70">· {u.msnv}</span>}
        </span>
        {!u.active && <Badge tone="amber">tài khoản đã khoá</Badge>}
        <button type="button" className="text-xs font-medium text-blue-700 hover:underline" onClick={() => setEdit(true)}>Đổi</button>
      </div>
    );
  }
  if (!edit && chosenNone) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <UserX className="h-4 w-4" /> Không khớp — bỏ qua người này
        <button type="button" className="text-xs font-medium text-blue-700 hover:underline" onClick={() => setEdit(true)}>Chọn tài khoản</button>
      </div>
    );
  }
  const others = (p.suggestion?.candidates || []).filter((id) => id !== p.userId);
  return (
    <div className="space-y-1.5">
      {others.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {others.map((id) => (
            <button key={id} type="button" onClick={() => { onChange(id); setEdit(false); }}
              className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-900 ring-1 ring-amber-200 hover:bg-amber-100">
              {nameOf(id)}{info[id]?.msnv ? ` · ${info[id].msnv}` : ""}{info[id] && !info[id].active ? " (đã khoá)" : ""}
            </button>
          ))}
        </div>
      )}
      <UserPicker multiple={false} value={null} placeholder="Tìm tài khoản NOIBO theo tên, MSNV…" onChange={(id) => { if (id) { onChange(id); setEdit(false); } }} />
      <div className="flex gap-3 text-xs">
        {(p.userId || chosenNone) && <button type="button" className="text-slate-500 hover:underline" onClick={() => setEdit(false)}>Giữ như cũ</button>}
        {!chosenNone && <button type="button" className="text-slate-500 hover:underline" onClick={() => { onChange(0); setEdit(false); }}>Không khớp ai (bỏ qua)</button>}
      </div>
    </div>
  );
}

function PeopleCard({ people, info, settings, setPerson }) {
  const missing = people.filter((p) => !p.userId).length;
  const guessed = people.filter((p) => p.userId && (p.how === "initials" || p.how === "username" || p.suggestion?.ambiguous)).length;
  return (
    <Card title={`Người trên Base → tài khoản NOIBO (${people.length})`} bodyClass="p-0">
      <p className="border-b border-slate-100 px-4 py-2.5 text-sm text-slate-600">
        Base chỉ ghi tên đăng nhập (vd <i>ltyphuong</i>). Hệ thống khớp theo <b>họ tên</b> (có trong cột Ý kiến của người tạo), <b>email</b>, rồi <b>đoán theo tên viết tắt</b> (ltyphuong = <b>L</b>ê <b>T</b>hị <b>Y</b>ến <b>Phương</b>) — kiểm lại các dòng màu vàng.
        {missing > 0 && <span className="mt-1 block text-amber-800">⚠ {missing} người chưa khớp: đề xuất do họ <b>gửi</b> sẽ không nhập; bước <b>duyệt</b> của họ bị bỏ qua.</span>}
        {guessed > 0 && <span className="mt-1 block text-amber-800">{guessed} người khớp bằng cách đoán — nên xem lại.</span>}
      </p>
      <ul className="divide-y divide-slate-100">
        {people.map((p) => {
          const how = HOW[p.how];
          const warn = !p.userId || p.how === "initials" || p.how === "username" || p.suggestion?.ambiguous;
          const r = p.roles;
          return (
            <li key={p.base} className={cn("grid gap-2 px-4 py-3 md:grid-cols-[minmax(180px,240px)_minmax(0,1fr)_170px] md:items-start", warn && "bg-amber-50/40")}>
              <div className="min-w-0">
                <p className="font-mono text-sm font-semibold text-slate-800">{p.base}</p>
                {(p.fullName || p.email) && <p className="truncate text-xs text-slate-500">{[p.fullName, p.email].filter(Boolean).join(" · ")}</p>}
                <p className="mt-0.5 text-xs text-slate-400">
                  {[r.requester && `gửi ${r.requester}`, r.approver && `duyệt ${r.approver}`, r.follower && `theo dõi ${r.follower}`, r.commenter && `ý kiến ${r.commenter}`].filter(Boolean).join(" · ")}
                </p>
              </div>
              <PersonCell p={p} info={info} chosenNone={settings.people[p.base] === 0} onChange={(id) => setPerson(p.base, id)} />
              <div className="flex flex-wrap gap-1 md:justify-end">
                {how ? <Badge tone={how[1]}>{how[0]}</Badge> : <Badge tone="red">Chưa khớp</Badge>}
                {p.suggestion?.ambiguous && p.how !== "manual" && <Badge tone="amber">nhiều người trùng</Badge>}
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/* ------------------------------ Nhóm Base → mẫu đề xuất ------------------------------ */
function GroupCard({ g, types, rqGroups, setting, setGroup, onSample, hasSample }) {
  const type = typeof g.target === "number" ? types.find((t) => t.typeId === g.target) : null;
  const fieldOpts = (type?.fields || []).filter((f) => MAPPABLE.includes(f.type));
  const fieldName = (key) => type?.fields.find((f) => f.key === key)?.label;
  const value = typeof g.target === "number" ? String(g.target) : g.target === "new" ? "__new" : "__skip";
  const changeTarget = (v) => setGroup(g.name, { target: v === "__new" ? "new" : v === "__skip" ? "skip" : Number(v), fieldMap: {} });
  const changeField = (label, v) => {
    const fieldMap = { ...(setting?.fieldMap || {}) };
    if (v === "__auto") delete fieldMap[label]; else fieldMap[label] = v;
    setGroup(g.name, { fieldMap });
  };
  return (
    <Card
      title={<span>Nhóm Base: <b className="text-slate-900">{g.name}</b> <span className="font-normal text-slate-500">· {g.count} đề xuất</span></span>}
      actions={hasSample && <Button size="sm" variant="secondary" icon={Eye} onClick={onSample}>Xem thử 1 đề xuất</Button>}
    >
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Nhập vào mẫu đề xuất</span>
          <select className={inputCls} value={value} onChange={(e) => changeTarget(e.target.value)}>
            <optgroup label="Mẫu có sẵn">
              {types.map((t) => <option key={t.typeId} value={t.typeId}>{t.name}{t.isActive ? "" : " (đang ẩn)"}{t.typeId === g.suggestedTypeId ? " — trùng tên" : ""}</option>)}
            </optgroup>
            <option value="__new">＋ Tạo mẫu mới từ dữ liệu Base</option>
            <option value="__skip">Không nhập nhóm này</option>
          </select>
        </label>
        {g.target === "new" && (
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Mẫu mới thuộc nhóm (menu trái)</span>
            <select className={inputCls} value={setting?.newGroupId || ""} onChange={(e) => setGroup(g.name, { newGroupId: Number(e.target.value) || null })}>
              <option value="">— Không thuộc nhóm —</option>
              {rqGroups.map((x) => <option key={x.groupId} value={x.groupId}>{x.name}</option>)}
            </select>
          </label>
        )}
      </div>
      {g.target === "new" && (
        <p className="mt-2 flex gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-900">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Mẫu mới được tạo ở trạng thái <b>ẩn</b> (nhân viên chưa thấy): trường lấy theo nhãn Base, quy trình duyệt theo chuỗi người duyệt hay gặp nhất. Xem lại ở "Mẫu đề xuất" rồi bật nếu muốn dùng tiếp.
        </p>
      )}

      {g.target !== "skip" && (
        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
          <div className="hidden grid-cols-[minmax(0,1fr)_24px_minmax(0,1fr)] gap-3 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
            <span>Trường trên Base · ví dụ</span><span /><span>Trường NOIBO</span>
          </div>
          <ul className="divide-y divide-slate-100">
            {g.labels.map((l) => {
              const v = setting?.fieldMap?.[l.label] ?? "__auto";
              return (
                <li key={l.label} className="grid gap-1.5 px-3 py-2.5 md:grid-cols-[minmax(0,1fr)_24px_minmax(0,1fr)] md:items-start md:gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800">{l.label} <span className="text-xs font-normal text-slate-400">({l.filled})</span></p>
                    {l.sample && <p className="truncate text-xs text-slate-500" title={l.sample}>{l.sample}</p>}
                  </div>
                  <ArrowRight className="hidden h-4 w-4 text-slate-300 md:mt-2 md:block" />
                  <div className="min-w-0 space-y-1">
                    {type ? (
                      <select className={cn(inputCls, "py-1.5")} value={v} onChange={(e) => changeField(l.label, e.target.value)}>
                        <option value="__auto">Tự khớp theo tên{v === "__auto" ? (l.extra ? " → không thấy, thêm trường riêng" : ` → ${fieldName(l.key)}`) : ""}</option>
                        {fieldOpts.map((f) => <option key={f.key} value={f.key}>{f.label} ({FIELD_META[f.type]?.label || f.type})</option>)}
                        <option value="">Thêm trường riêng (giữ nhãn Base)</option>
                      </select>
                    ) : (
                      <p className="pt-1 text-sm text-slate-700">Trường mới · {FIELD_META[l.fieldType]?.label || l.fieldType}</p>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {type && (l.extra ? <Badge tone="amber">trường riêng · {FIELD_META[l.fieldType]?.label}</Badge> : l.auto ? <Badge tone="green">khớp theo tên</Badge> : <Badge tone="blue">chọn tay</Badge>)}
                    </div>
                    {l.columns && (
                      <p className="text-xs leading-relaxed text-slate-500">
                        Cột: {l.columns.map((c, i) => (
                          <span key={c.label}>{i > 0 && " · "}{c.label} → {c.key ? (norm(c.name) === norm(c.label) ? <b className="font-medium text-slate-700">{c.name}</b> : <b className="font-medium text-amber-700">{c.name}</b>) : <i>tự đánh số</i>}</span>
                        ))}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Card>
  );
}

function SampleModal({ group, sample, info, onClose }) {
  const dir = useRq((s) => s.dir);
  const nameOf = (id) => info[id]?.name || dir?.userById.get(id)?.name || `Người dùng #${id}`;
  return (
    <Modal open onClose={onClose} size="lg" title={`Xem thử — ${group}`}>
      <div className="space-y-4">
        <div>
          <p className="text-xs text-slate-500">Mã Base {sample.code} · người gửi <b>{nameOf(sample.requesterId)}</b></p>
          <p className="mt-0.5 text-lg font-semibold text-slate-900">{sample.title}</p>
          <StatusBadge status={sample.status} className="mt-1" />
        </div>
        <div className="rounded-xl border border-slate-200"><FieldValues fields={sample.fields} values={sample.values} /></div>
        <div>
          <p className="mb-1 text-sm font-semibold text-slate-700">Người duyệt</p>
          {sample.approvers.length ? (
            <ol className="space-y-1 text-sm">
              {sample.approvers.map((a) => (
                <li key={`${a.stepNo}-${a.userId}`} className="flex flex-wrap gap-x-2">
                  <span className="text-slate-400">{a.stepNo}.</span> <span className="text-slate-500">{a.stepName}:</span> <b>{nameOf(a.userId)}</b>
                  <span className={APPROVER_STATUS[a.status]?.cls}>{APPROVER_STATUS[a.status]?.label}</span>
                </li>
              ))}
            </ol>
          ) : <p className="text-sm text-slate-400">Không có người duyệt nào khớp</p>}
        </div>
        {sample.comments.length > 0 && (
          <div>
            <p className="mb-1 text-sm font-semibold text-slate-700">Ý kiến → bình luận</p>
            {sample.comments.map((c, i) => <p key={i} className="text-sm"><b>{nameOf(c.userId)}:</b> {c.body}</p>)}
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ------------------------------ Lịch sử nhập ------------------------------ */
function HistoryCard({ batches, error, onReload, onUndo, undoing }) {
  return (
    <Card title={<span className="inline-flex items-center gap-1.5"><History className="h-4 w-4" /> Lịch sử nhập</span>} actions={<IconButton icon={RefreshCw} title="Tải lại" onClick={onReload} />} bodyClass="p-0">
      {error ? <p className="px-4 py-3 text-sm text-red-700">{error}</p> : !batches ? (
        <div className="space-y-2 p-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
      ) : !batches.length ? <p className="px-4 py-4 text-sm text-slate-500">Chưa nhập lần nào.</p> : (
        <ul className="divide-y divide-slate-100">
          {batches.map((b) => {
            const st = BATCH_STATUS[b.status] || [b.status, "slate"];
            return (
              <li key={b.batchId} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-800">#{b.batchId} · {b.fileName || "(không tên)"} <Badge tone={st[1]} className="ml-1">{st[0]}</Badge></p>
                  <p className="text-xs text-slate-500">
                    {fmtDateTime(b.createdAt)} · {b.createdByName} · tạo {b.createdCount}/{b.totalRows} đề xuất{b.skippedCount ? ` · bỏ qua ${b.skippedCount}` : ""}
                    {b.undoneAt && ` · hoàn tác ${fmtDateTime(b.undoneAt)} (${b.undoneByName})`}
                  </p>
                  {b.createdTypes?.length > 0 && (
                    <p className="text-xs text-slate-500">Mẫu tạo khi nhập: {b.createdTypes.map((t, i) => (
                      <span key={t.typeId}>{i > 0 && ", "}<Link className="text-blue-700 underline" to={`${R.adminRequestTypeBuilder}/${t.typeId}`}>{t.name}</Link></span>
                    ))}</p>
                  )}
                </div>
                {b.status !== "undone" && b.currentCount > 0 && (
                  <Button size="sm" variant="secondary" icon={Undo2} loading={undoing === b.batchId} onClick={() => onUndo(b)}>Hoàn tác</Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

/* ------------------------------ Trang ------------------------------ */
export default function BaseImport() {
  const [file, setFile] = useState(null); // { name, sheets, sheet }
  const [reading, setReading] = useState(false);
  const [settings, setSettings] = useState({ people: {}, groups: {}, pendingMode: "continue" });
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [sample, setSample] = useState(null);
  const [rowFilter, setRowFilter] = useState("skip");
  const [showAll, setShowAll] = useState(false);
  const [run, setRun] = useState(null); // { phase: running|done|error, done, total, created, duplicates, skipped[], message, createdTypes }
  const [batches, setBatches] = useState(null);
  const [histError, setHistError] = useState(null);
  const [undoing, setUndoing] = useState(null);
  const seq = useRef(0);
  const inputRef = useRef(null);
  const sheet = file?.sheets[file.sheet];

  const loadHistory = useCallback(async () => {
    try { setHistError(null); setBatches(await rqApi.importBatches()); } catch (e) { setBatches([]); setHistError(errorMessage(e)); }
  }, []);
  useEffect(() => { loadHistory(); }, [loadHistory]);

  // phân tích lại mỗi khi đổi tệp / trang tính / cách khớp (chờ 600 ms để gom các lần đổi liên tiếp)
  useEffect(() => {
    if (!sheet) return undefined;
    const my = ++seq.current;
    setAnalyzing(true);
    const timer = setTimeout(async () => {
      try {
        const a = await rqApi.importAnalyze({ header: sheet.header, rows: sheet.rows, settings });
        if (my === seq.current) { setAnalysis(a); setError(null); }
      } catch (e) {
        if (my === seq.current) setError(errorMessage(e));
      } finally {
        if (my === seq.current) setAnalyzing(false);
      }
    }, analysis ? 600 : 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheet, settings]);

  // đang nhập → hỏi trước khi rời trang
  useEffect(() => {
    if (run?.phase !== "running") return undefined;
    const h = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [run?.phase]);

  const pickFile = async (f) => {
    if (!f) return;
    if (!/\.(xlsx|xls)$/i.test(f.name)) { toast.error("Chọn tệp Excel (.xlsx) xuất từ Base Request"); return; }
    setReading(true);
    setAnalysis(null);
    setError(null);
    setRun(null);
    try {
      const sheets = await readBaseFile(f);
      if (!sheets.length) { setFile(null); toast.error('Không thấy dòng tiêu đề có cột "Mã đề xuất" — đây có phải tệp xuất từ Base Request?'); return; }
      // Base xuất thêm các trang lọc theo trạng thái (tập con của "Tất cả") → mặc định trang "Tất cả" / nhiều dòng nhất
      let best = sheets.findIndex((s) => norm(s.name) === "tat ca");
      if (best < 0) best = sheets.reduce((bi, s, i) => (s.rows.length > sheets[bi].rows.length ? i : bi), 0);
      setFile({ name: f.name, sheets, sheet: best });
      setSettings({ people: {}, groups: {}, pendingMode: "continue" });
    } catch (e) {
      console.error(e);
      toast.error("Không đọc được tệp Excel");
    } finally {
      setReading(false);
    }
  };

  const setPerson = (base, id) => setSettings((s) => ({ ...s, people: { ...s.people, [base]: id } }));
  const setGroup = (name, patch) => setSettings((s) => ({ ...s, groups: { ...s.groups, [name]: { ...(s.groups[name] || {}), ...patch } } }));

  const startImport = async () => {
    if (!analysis?.willCreate || !sheet) return;
    const okGo = await confirmDialog({
      title: "Nhập đề xuất từ Base",
      message: `Tạo ${analysis.willCreate} đề xuất trên NOIBO (giữ ngày tạo, trạng thái, người duyệt, ý kiến như trên Base).`
        + `${analysis.byStatus.pending && settings.pendingMode === "continue" ? "\nĐề xuất đang chờ sẽ hiện ở hộp \"Cần tôi duyệt\" của người tới lượt (không gửi thông báo)." : ""}`
        + "\nNhập lại cùng tệp sau này không tạo trùng. Có thể hoàn tác ở mục Lịch sử nhập.",
      confirmText: `Nhập ${analysis.willCreate} đề xuất`,
    });
    if (!okGo) return;
    const rows = sheet.rows;
    const state = { phase: "running", done: 0, total: rows.length, created: 0, duplicates: 0, warned: 0, skipped: [], createdTypes: [] };
    setRun({ ...state });
    try {
      const s = await rqApi.importStart({ header: sheet.header, rows, settings, fileName: file.name });
      state.createdTypes = s.createdTypes || [];
      for (let i = 0; i < rows.length; i += CHUNK) {
        const part = rows.slice(i, i + CHUNK);
        let r;
        for (let attempt = 1; ; attempt += 1) {
          try { r = await rqApi.importRows(s.batchId, { header: sheet.header, rows: part }); break; } catch (e) {
            // mạng chập chờn / máy chủ bận: gửi lại phần này (đã nhập thì máy chủ tự bỏ qua, không tạo trùng)
            if (attempt >= 3 || (e?.response && e.response.status < 500)) throw e;
            await new Promise((ok) => setTimeout(ok, 1500 * attempt));
          }
        }
        state.done = Math.min(rows.length, i + part.length);
        state.created += r.created;
        state.duplicates += r.duplicates;
        state.warned += r.warned;
        state.skipped.push(...r.skipped);
        setRun({ ...state });
      }
      await rqApi.importFinish(s.batchId);
      setRun({ ...state, phase: "done" });
      toast.success(`Đã nhập ${state.created} đề xuất`);
      refreshCounts();
      setSettings((x) => ({ ...x })); // phân tích lại → các đề xuất vừa nhập thành "đã nhập trước"
    } catch (e) {
      setRun({ ...state, phase: "error", message: errorMessage(e) });
    } finally {
      loadHistory();
    }
  };

  const undo = async (b) => {
    const okGo = await confirmDialog({
      title: `Hoàn tác lần nhập #${b.batchId}`,
      message: `Xoá ${b.currentCount} đề xuất đã nhập ở lần này (kể cả đề xuất đã duyệt trên Base).\nĐề xuất đã có người duyệt / bình luận / đính kèm SAU khi nhập được giữ lại.\nMẫu đề xuất tạo khi nhập không bị xoá. Sau khi hoàn tác có thể nhập lại tệp.`,
      confirmText: "Hoàn tác",
      danger: true,
    });
    if (!okGo) return;
    setUndoing(b.batchId);
    try {
      const r = await rqApi.importUndo(b.batchId);
      toast.success(`Đã xoá ${r.removed} đề xuất${r.kept ? ` — giữ lại ${r.kept} đề xuất đã có thao tác sau khi nhập` : ""}`);
      refreshCounts();
      loadHistory();
      if (sheet) setSettings((x) => ({ ...x }));
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setUndoing(null);
    }
  };

  const shownRows = useMemo(() => {
    const list = (analysis?.rows || []).filter((r) => rowFilter === "all" || (rowFilter === "warn" ? r.warnings.length : r.state === rowFilter));
    return showAll ? list : list.slice(0, 100);
  }, [analysis, rowFilter, showAll]);
  const countOf = (f) => (analysis?.rows || []).filter((r) => (f === "warn" ? r.warnings.length : r.state === f)).length;
  const needSql = /sql\/12/.test(histError || "") || /sql\/12/.test(error || "");
  const running = run?.phase === "running";

  return (
    <PageScroll max="max-w-[1400px]">
      <h1 className="flex items-center gap-2 text-xl font-bold text-slate-800"><FileUp className="h-6 w-6 text-blue-700" /> Nhập dữ liệu từ Base Request</h1>
      <p className="mt-1 text-sm text-slate-500">
        Đưa đề xuất cũ trên <b>request.base.vn</b> vào NOIBO: trên Base vào danh sách đề xuất → <b>Xuất Excel</b> → chọn tệp đó ở đây.
        Người, mẫu và trường được khớp <b>theo tên</b>; bạn xem lại trước khi nhập. Số liệu (tiền, bảng chi tiết, bằng chữ) giữ <b>nguyên như trên Base</b>.
      </p>

      {needSql && (
        <p className="mt-3 flex gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> Cần chạy <b>sql/12_request_import_base.sql</b> trên SQL Server trước khi nhập (tạo bảng lưu lịch sử nhập).
        </p>
      )}

      <div className="mt-4 space-y-4">
        {/* ---- 1. tệp ---- */}
        <Card title="1. Chọn tệp Excel xuất từ Base">
          <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = ""; }} />
          {!file ? (
            <button type="button" disabled={reading} onClick={() => inputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pickFile(e.dataTransfer.files?.[0]); }}
              className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-4 py-10 text-slate-500 hover:border-blue-400 hover:bg-blue-50/40">
              {reading ? <Loader2 className="h-8 w-8 animate-spin text-blue-600" /> : <Upload className="h-8 w-8" />}
              <span className="text-sm">{reading ? "Đang đọc tệp…" : <>Kéo tệp vào đây hoặc <b className="text-blue-700">chọn tệp</b> (.xlsx)</>}</span>
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <FileSpreadsheet className="h-9 w-9 text-emerald-600" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-800">{file.name}</p>
                <p className="text-xs text-slate-500">{sheet.rows.length} dòng đề xuất · trang tính “{sheet.name}”</p>
              </div>
              {file.sheets.length > 1 && (
                // inputCls có sẵn w-full và cn() không gộp lớp trùng → thu hẹp bằng khung bọc
                <div className="w-full sm:w-64" title="Trang tính">
                  <select className={cn(inputCls, "py-1.5")} value={file.sheet} disabled={running} onChange={(e) => { setFile({ ...file, sheet: Number(e.target.value) }); setAnalysis(null); }}>
                    {file.sheets.map((s, i) => <option key={s.name} value={i}>{s.name} ({s.rows.length})</option>)}
                  </select>
                </div>
              )}
              <Button variant="secondary" size="sm" disabled={running || reading} loading={reading} onClick={() => inputRef.current?.click()}>Chọn tệp khác</Button>
            </div>
          )}
        </Card>

        {error && !needSql && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {file && !analysis && analyzing && <div className="space-y-3"><Skeleton className="h-24 w-full rounded-xl" /><Skeleton className="h-64 w-full rounded-xl" /></div>}

        {analysis?.missing?.length > 0 && (
          <EmptyState icon={AlertTriangle} title="Tệp không đúng mẫu xuất của Base Request">Thiếu cột: {analysis.missing.join(", ")}</EmptyState>
        )}

        {analysis && !analysis.missing?.length && (
          <Refreshing active={analyzing}>
            <div className="space-y-4">
              {/* ---- tổng quan ---- */}
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {[["Đề xuất trong tệp", analysis.total, "text-slate-800"], ["Sẽ nhập", analysis.willCreate, "text-emerald-600"],
                  ["Đã nhập trước đó", analysis.already, "text-blue-700"], ["Bỏ qua", analysis.skipped, analysis.skipped ? "text-amber-600" : "text-slate-400"]].map(([k, v, c]) => (
                  <div key={k} className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">{k}</p><p className={cn("mt-1 text-2xl font-bold", c)}>{v}</p></div>
                ))}
              </div>
              <p className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                {analysis.dateRange && <span>Ngày tạo {fmtYmd(analysis.dateRange.from)} → {fmtYmd(analysis.dateRange.to)} ·</span>}
                {Object.entries(analysis.byStatus).map(([s, n]) => (
                  <span key={s} className={cn("rounded-full px-2 py-0.5 text-xs ring-1", STATUS[s]?.cls || "bg-red-50 text-red-700 ring-red-200")}>{STATUS[s]?.label || "Trạng thái lạ"} {n}</span>
                ))}
                <InlineLoading active={analyzing} label="Đang kiểm tra lại…" />
              </p>

              <PeopleCard people={analysis.people} info={analysis.userInfo} settings={settings} setPerson={setPerson} />

              {analysis.groups.map((g) => (
                <GroupCard key={g.name} g={g} types={analysis.types} rqGroups={analysis.rqGroups} setting={settings.groups[g.name]} setGroup={setGroup}
                  hasSample={!!analysis.samples[g.name]} onSample={() => setSample(g.name)} />
              ))}

              <Card title="Tuỳ chọn">
                <div className="space-y-2 text-sm">
                  {[["continue", "Đề xuất chưa xong trên Base (chờ duyệt / trả lại): nhập và tiếp tục xử lý trên NOIBO",
                    "Người đang tới lượt thấy ở hộp \"Cần tôi duyệt\" (không gửi thông báo). Nên ngừng xử lý các đề xuất này trên Base."],
                  ["skip", "Không nhập đề xuất chưa xong — chỉ nhập đề xuất đã kết thúc", "Đề xuất còn chờ tiếp tục xử lý trên Base; xong rồi xuất lại và nhập tiếp (không trùng)."]].map(([v, label, hint]) => (
                    <label key={v} className={cn("flex cursor-pointer gap-2.5 rounded-lg border p-3", settings.pendingMode === v ? "border-blue-300 bg-blue-50/50" : "border-slate-200")}>
                      <input type="radio" name="pendingMode" className="mt-0.5" checked={settings.pendingMode === v} onChange={() => setSettings((s) => ({ ...s, pendingMode: v }))} />
                      <span><span className="block font-medium text-slate-800">{label}</span><span className="text-xs text-slate-500">{hint}</span></span>
                    </label>
                  ))}
                </div>
              </Card>

              {/* ---- từng đề xuất ---- */}
              <Card title="Danh sách đề xuất trong tệp" bodyClass="p-0"
                actions={(
                  <div className="flex gap-1">
                    {[["skip", "Bỏ qua"], ["warn", "Có lưu ý"], ["ok", "Sẽ nhập"], ["already", "Đã nhập"], ["all", "Tất cả"]].map(([k, label]) => (
                      <button key={k} type="button" onClick={() => { setRowFilter(k); setShowAll(false); }}
                        className={cn("rounded-full px-2.5 py-0.5 text-xs", rowFilter === k ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>
                        {label} {k === "all" ? analysis.rows.length : countOf(k)}
                      </button>
                    ))}
                  </div>
                )}>
                {!shownRows.length ? <p className="px-4 py-4 text-sm text-slate-500">Không có đề xuất nào.</p> : (
                  <ul className="divide-y divide-slate-100">
                    {shownRows.map((r) => (
                      <li key={r.code} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 px-4 py-2 text-sm">
                        <span className="w-20 shrink-0 font-mono text-xs text-slate-400">{r.code}</span>
                        <span className="min-w-0 flex-1 truncate text-slate-800" title={r.title}>{r.title}</span>
                        <span className="text-xs text-slate-500">{r.creator} · {fmtYmd((r.createdAt || "").slice(0, 10))}</span>
                        {r.status && <StatusBadge status={r.status} />}
                        {(r.reason || r.warnings.length > 0) && (
                          <span className={cn("basis-full pl-[92px] text-xs", r.state === "skip" ? "text-red-600" : r.state === "already" ? "text-blue-700" : "text-amber-700")}>
                            {r.reason || r.warnings.join(" · ")}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {!showAll && (rowFilter === "all" ? analysis.rows.length : countOf(rowFilter)) > 100 && (
                  <button type="button" className="w-full border-t border-slate-100 py-2 text-sm text-blue-700 hover:bg-slate-50" onClick={() => setShowAll(true)}>Xem tất cả</button>
                )}
              </Card>

              {/* ---- nhập ---- */}
              <div className="sticky bottom-0 z-10 -mx-1 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
                {run ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      {run.phase === "running" && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
                      {run.phase === "done" && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                      {run.phase === "error" && <AlertTriangle className="h-4 w-4 text-red-600" />}
                      <b className="text-slate-800">{run.phase === "running" ? `Đang nhập… ${run.done}/${run.total} dòng` : run.phase === "done" ? `Đã nhập xong: tạo ${run.created} đề xuất` : "Nhập bị dừng"}</b>
                      <span className="text-slate-500">
                        {run.phase !== "done" && `đã tạo ${run.created}`}{run.duplicates ? ` · trùng (đã có) ${run.duplicates}` : ""}{run.skipped.length ? ` · bỏ qua ${run.skipped.length}` : ""}{run.warned ? ` · có lưu ý ${run.warned}` : ""}
                      </span>
                      {run.phase === "done" && <Link to={`${R.request}?box=all`} className="ml-auto text-sm font-medium text-blue-700 hover:underline">Mở danh sách đề xuất →</Link>}
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className={cn("h-full rounded-full transition-all", run.phase === "error" ? "bg-red-500" : "bg-blue-600")} style={{ width: `${run.total ? (run.done / run.total) * 100 : 0}%` }} />
                    </div>
                    {run.phase === "error" && <p className="text-sm text-red-700">{run.message} — bấm Nhập lại để tiếp tục (phần đã nhập không bị tạo trùng).</p>}
                    {run.createdTypes.length > 0 && (
                      <p className="text-xs text-slate-600">Mẫu mới (đang ẩn): {run.createdTypes.map((t, i) => (
                        <span key={t.typeId}>{i > 0 && ", "}<Link className="text-blue-700 underline" to={`${R.adminRequestTypeBuilder}/${t.typeId}`}>{t.name}</Link></span>
                      ))}</p>
                    )}
                    {run.phase !== "running" && (
                      <div className="flex justify-end gap-2">
                        {run.phase === "error" && <Button size="sm" onClick={startImport} disabled={analyzing || !analysis.willCreate}>Nhập lại</Button>}
                        <Button size="sm" variant="secondary" onClick={() => setRun(null)}>Đóng</Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="min-w-0 flex-1 text-sm text-slate-600">
                      {analysis.willCreate
                        ? <>Sẽ tạo <b className="text-slate-900">{analysis.willCreate}</b> đề xuất{analysis.skipped ? <>, bỏ qua <b>{analysis.skipped}</b></> : ""}{analysis.warned ? <> · {analysis.warned} đề xuất có lưu ý (xem danh sách)</> : ""}.</>
                        : "Không có đề xuất nào để nhập."}
                    </p>
                    <Button icon={FileUp} disabled={!analysis.willCreate || analyzing || needSql} onClick={startImport}>Nhập {analysis.willCreate || ""} đề xuất</Button>
                  </div>
                )}
              </div>
            </div>
          </Refreshing>
        )}

        <HistoryCard batches={batches} error={needSql ? null : histError} onReload={loadHistory} onUndo={undo} undoing={undoing} />
      </div>

      {sample && analysis?.samples[sample] && <SampleModal group={sample} sample={analysis.samples[sample]} info={analysis.userInfo} onClose={() => setSample(null)} />}
    </PageScroll>
  );
}
