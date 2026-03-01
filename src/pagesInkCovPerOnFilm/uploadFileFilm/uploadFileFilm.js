import React, { useMemo, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function FilmPdfByOrder() {
  const [filters, setFilters] = useState({ customer: "", orderNo: "" });

  // Date range picker
  const [range, setRange] = useState({ from: undefined, to: undefined });
  const [openCalendar, setOpenCalendar] = useState(false);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [rows, setRows] = useState([]);
  const [uploads, setUploads] = useState({}); // { [rowId]: File[] }

  const totalSelected = useMemo(() => {
    let n = 0;
    for (const arr of Object.values(uploads)) n += (arr?.length || 0);
    return n;
  }, [uploads]);

  const totalRowsHasFiles = useMemo(
    () => Object.values(uploads).filter((arr) => (arr?.length || 0) > 0).length,
    [uploads]
  );

  const prettySize = (size) => {
    if (!size) return "";
    const mb = size / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    const kb = size / 1024;
    return `${kb.toFixed(0)} KB`;
  };

  const isPdf = (f) => {
    if (!f) return false;
    const byType = (f.type || "").toLowerCase() === "application/pdf";
    const byName = (f.name || "").toLowerCase().endsWith(".pdf");
    return byType || byName;
  };

  // Demo
  const fetchRows = async () => [
    {
      id: "A001",
      itemCode: "SH626LA-000805",
      fabricSize: "1,200 x 800",
      filmSize: "1,250 x 820",
      fabricColor: "Trắng",
      printColor: "Đỏ/Đen",
    },
    {
      id: "A002",
      itemCode: "SH626LA-000806",
      fabricSize: "900 x 700",
      filmSize: "920 x 715",
      fabricColor: "Xám",
      printColor: "Xanh",
    },
  ];

  const onUpdate = async () => {
    setBusy(true);
    setMsg("");
    try {
      const data = await fetchRows();
      setRows(data);
      setMsg(data.length ? "✅ Đã tải dữ liệu." : "⚠️ Không có dữ liệu phù hợp.");
    } catch (e) {
      setMsg("❌ Không thể tải dữ liệu. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  };

  const addRowFiles = (rowId, fileList) => {
    setMsg("");
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;

    const pdfs = incoming.filter(isPdf);
    const rejects = incoming.length - pdfs.length;

    if (!pdfs.length) {
      setMsg("❌ Không có file PDF hợp lệ.");
      return;
    }

    setUploads((prev) => {
      const existed = prev[rowId] || [];
      const merged = [...existed, ...pdfs];
      const dedup = [];
      const seen = new Set();
      for (const f of merged) {
        const key = `${f.name}-${f.size}`;
        if (!seen.has(key)) {
          seen.add(key);
          dedup.push(f);
        }
      }
      return { ...prev, [rowId]: dedup };
    });

    if (rejects > 0) setMsg(`⚠️ Đã bỏ qua ${rejects} file không phải PDF.`);
  };

  const removeRowFileAt = (rowId, idx) => {
    setUploads((prev) => {
      const arr = prev[rowId] || [];
      const nextArr = arr.filter((_, i) => i !== idx);
      const next = { ...prev };
      if (nextArr.length) next[rowId] = nextArr;
      else delete next[rowId];
      return next;
    });
  };

  const clearRowFiles = (rowId) => {
    setUploads((prev) => {
      const next = { ...prev };
      delete next[rowId];
      return next;
    });
  };

  const uploadRow = async (rowId) => {
    const files = uploads[rowId] || [];
    if (!files.length || busy) return;

    setBusy(true);
    setMsg("");
    try {
      await new Promise((r) => setTimeout(r, 400));
      setMsg(`🎉 Upload thành công (demo) • ${rowId} • ${files.length} file`);
    } catch (e) {
      setMsg("❌ Upload thất bại. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  };

  const uploadAll = async () => {
    if (!totalSelected || busy) return;
    setBusy(true);
    setMsg("");
    try {
      await new Promise((r) => setTimeout(r, 600));
      setMsg(`🎉 Upload tổng (demo) • ${totalSelected} file • ${totalRowsHasFiles} dòng`);
    } catch (e) {
      setMsg("❌ Upload tổng thất bại.");
    } finally {
      setBusy(false);
    }
  };

  const rangeText = useMemo(() => {
    if (!range.from && !range.to) return "Chọn khoảng ngày";
    if (range.from && !range.to) return `Từ ${format(range.from, "dd/MM/yyyy")}`;
    return `${format(range.from, "dd/MM/yyyy")} → ${format(range.to, "dd/MM/yyyy")}`;
  }, [range]);

  return (
    // ✅ mobile bottom padding 20px
    <div className="min-h-[100dvh] w-full bg-gradient-to-b from-slate-50 via-white to-white px-4 py-6 pb-[20px]">
      <div className="mx-auto w-full max-w-6xl">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="text-[18px] sm:text-[20px] font-semibold text-slate-900">
              Upload file phim (PDF)
            </div>
            <div className="mt-1 text-[12px] text-slate-600">
              Lọc dữ liệu → Cập nhật → Upload theo dòng hoặc Upload tổng
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <Badge>
              Chọn <span className="font-semibold text-slate-900">{totalSelected}</span> file
            </Badge>
            <BtnPrimarySmall
              onClick={uploadAll}
              disabled={!totalSelected || busy}
              title={!totalSelected ? "Chưa chọn file nào" : "Upload tất cả"}
            >
              ⬆️ Upload tổng
            </BtnPrimarySmall>
          </div>
        </div>

        {/* Filter Card */}
        {/* ✅ relative để calendar z-index hoạt động ổn định */}
        <div className="relative z-[999] rounded-[26px] border border-slate-200/70 bg-white/70 backdrop-blur-md p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <Field label="Khách hàng">
              <input
                value={filters.customer}
                onChange={(e) => setFilters((p) => ({ ...p, customer: e.target.value }))}
                placeholder="VD: THLA / ABC..."
                className={inputCls}
              />
            </Field>

            <Field label="Đơn hàng">
              <input
                value={filters.orderNo}
                onChange={(e) => setFilters((p) => ({ ...p, orderNo: e.target.value }))}
                placeholder="VD: SO-2026-001..."
                className={inputCls}
              />
            </Field>

            {/* Date range */}
            <div className="lg:col-span-2 relative">
              <div className="mb-1 text-[12px] font-medium text-slate-700">
                Từ ngày - Đến ngày
              </div>

              <button
                type="button"
                onClick={() => setOpenCalendar(true)}
                className={[
                  "w-full text-left rounded-2xl border border-slate-200/70 bg-white/70",
                  "px-4 py-2.5 text-[13px] text-slate-900",
                  "hover:bg-white/90 transition",
                  "focus:outline-none focus:ring-2 focus:ring-rose-200/70",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={range.from ? "font-medium" : "text-slate-500"}>
                    {rangeText}
                  </span>
                  <span className="text-slate-500">📅</span>
                </div>
              </button>

              {/* ✅ Backdrop đặt TRƯỚC calendar để click outside đóng, không đè calendar */}
              {openCalendar && (
                <div
                  className="fixed inset-0 z-50"
                  onClick={() => setOpenCalendar(false)}
                />
              )}

              {openCalendar && (
                <div
                  // ✅ z-index cao hơn table
                  className="absolute z-[60] mt-2 w-full rounded-2xl border border-slate-200/70 bg-white
                             shadow-[0_18px_60px_rgba(15,23,42,0.18)] p-3"
                  // ✅ chặn click trong calendar bị close do bubbling
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-[12px] font-semibold text-slate-700">
                      Chọn khoảng ngày
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setRange({ from: undefined, to: undefined })}
                        className="text-[12px] font-medium text-slate-600 hover:text-slate-900 transition"
                      >
                        Xóa
                      </button>
                      <BtnDarkSmall onClick={() => setOpenCalendar(false)}>
                        Đóng
                      </BtnDarkSmall>
                    </div>
                  </div>

                  {/* ✅ chọn ngày OK: onSelect range */}
                  <DayPicker
                    mode="range"
                    selected={range}
                    onSelect={(r) => setRange(r || { from: undefined, to: undefined })}
                    numberOfMonths={1}
                    showOutsideDays
                    className="rdp"
  locale={vi}
  weekStartsOn={1}
  formatters={{
    formatCaption: (date) => format(date, "MMMM yyyy", { locale: vi }), // "tháng 2 2026"
  }}
                  />

                  <style>{dayPickerCss}</style>
                </div>
              )}
            </div>

            {/* Cập nhật */}
            <div className="flex items-end">
              <BtnPrimarySmall onClick={onUpdate} disabled={busy} className="w-full">
                {busy ? "Đang cập nhật..." : "🔄 Cập nhật"}
              </BtnPrimarySmall>
            </div>

            {/* Upload tổng (mobile) */}
            <div className="sm:hidden">
              <div className="mt-1 flex items-center justify-between gap-2">
                <Badge>
                  Chọn <span className="font-semibold text-slate-900">{totalSelected}</span> file
                </Badge>
                <BtnPrimarySmall
                  onClick={uploadAll}
                  disabled={!totalSelected || busy}
                  className="flex-1"
                >
                  ⬆️ Upload tổng
                </BtnPrimarySmall>
              </div>
            </div>
          </div>

          {msg && (
            <div className="mt-4 rounded-2xl border border-slate-200/70 bg-slate-50/60 px-4 py-3 text-[12px] text-slate-700">
              {msg}
            </div>
          )}
        </div>

        {/* Data */}
        {rows.length > 0 && (
          <div className="mt-5 pb-[80px] md:pb-[0px]">
            <div className="hidden lg:block overflow-hidden rounded-[28px] border border-slate-200/70 bg-white/70 backdrop-blur-md">
              <div className="px-5 py-4 border-b border-slate-200/60">
                <div className="font-semibold text-slate-900">Danh sách mã hàng</div>
                
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[1100px] w-full text-left">
                  <thead className="bg-slate-50/60">
                    <tr className="text-[12px] text-slate-600">
                      <Th>Mã hàng</Th>
                      <Th>Kích vải</Th>
                      <Th>Kích phim</Th>
                      <Th>Màu vải</Th>
                      <Th>Màu in</Th>
                      <Th className="w-[420px]">Upload PDF</Th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200/60">
                    {rows.map((r) => (
                      <tr key={r.id} className="text-[13px] text-slate-800">
                        <Td className="font-semibold text-slate-900">{r.itemCode}</Td>
                        <Td>{r.fabricSize}</Td>
                        <Td>{r.filmSize}</Td>
                        <Td>{r.fabricColor}</Td>
                        <Td>{r.printColor}</Td>

                        <Td>
                          <UploadCellMulti
                            rowId={r.id}
                            files={uploads[r.id] || []}
                            busy={busy}
                            prettySize={prettySize}
                            onPick={(list) => addRowFiles(r.id, list)}
                            onRemoveAt={(idx) => removeRowFileAt(r.id, idx)}
                            onClear={() => clearRowFiles(r.id)}
                            onUpload={() => uploadRow(r.id)}
                          />
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden space-y-3">
              {rows.map((r) => (
                <div
                  key={r.id}
                  className="rounded-[22px] border border-slate-200/70 bg-white/70 backdrop-blur-md p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[14px] font-semibold text-slate-900 break-words">
                        {r.itemCode}
                      </div>
                      <div className="mt-1 text-[12px] text-slate-600">
                        {r.fabricColor} • {r.printColor}
                      </div>
                    </div>
                    <Badge>{r.id}</Badge>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
                    <Info label="Kích vải" value={r.fabricSize} />
                    <Info label="Kích phim" value={r.filmSize} />
                    <Info label="Màu vải" value={r.fabricColor} />
                    <Info label="Màu in" value={r.printColor} />
                  </div>

                  <div className="mt-4">
                    <div className="text-[12px] font-medium text-slate-700 mb-2">
                      Upload PDF
                    </div>

                    <UploadCellMulti
                      rowId={r.id}
                      files={uploads[r.id] || []}
                      busy={busy}
                      prettySize={prettySize}
                      onPick={(list) => addRowFiles(r.id, list)}
                      onRemoveAt={(idx) => removeRowFileAt(r.id, idx)}
                      onClear={() => clearRowFiles(r.id)}
                      onUpload={() => uploadRow(r.id)}
                      compact
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- UI helpers ---------------- */

const inputCls =
  "w-full rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-2.5 " +
  "text-[13px] text-slate-900 placeholder:text-slate-400 " +
  "outline-none focus:ring-2 focus:ring-emerald-200/70 transition";

function Field({ label, children }) {
  return (
    <div>
      <div className="mb-1 text-[12px] font-medium text-slate-700">{label}</div>
      {children}
    </div>
  );
}

function Badge({ children }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-2 text-[12px] text-slate-700">
      {children}
    </div>
  );
}

/** ✅ nút nhỏ + chữ nhẹ */
function BtnPrimarySmall({ children, className = "", ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={[
        "rounded-2xl px-3.5 py-2.5 text-[13px] font-semibold",
        "text-white shadow-[0_10px_26px_rgba(16,185,129,0.18)]",
        "bg-gradient-to-b from-emerald-500 via-emerald-600 to-emerald-700",
        "hover:brightness-[1.02] active:scale-[0.99] transition",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function BtnGhostSmall({ children, className = "", ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={[
        "rounded-xl px-3 py-2 text-[12px] font-medium",
        "border border-slate-200/70 bg-white/70 text-slate-700",
        "hover:bg-white/90 hover:text-slate-900 transition",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "active:scale-[0.98]",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function BtnDangerSmall({ children, className = "", ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={[
        "rounded-xl px-3 py-2 text-[12px] font-medium",
        "border border-rose-200/70 bg-rose-50/70 text-rose-700",
        "hover:bg-rose-100/70 transition",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "active:scale-[0.98]",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function BtnDarkSmall({ children, className = "", ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={[
        "rounded-xl px-3 py-2 text-[12px] font-semibold",
        "bg-slate-900 text-white hover:bg-slate-800 transition",
        "active:scale-[0.98]",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-slate-50/60 px-3 py-2">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="mt-[2px] font-medium text-slate-900 break-words">{value}</div>
    </div>
  );
}

function Th({ children, className = "" }) {
  return <th className={["px-5 py-3 font-medium", className].join(" ")}>{children}</th>;
}
function Td({ children, className = "" }) {
  return <td className={["px-5 py-4 align-top", className].join(" ")}>{children}</td>;
}

function UploadCellMulti({
  rowId,
  files,
  busy,
  onPick,
  onRemoveAt,
  onClear,
  onUpload,
  prettySize,
  compact = false,
}) {
  const inputRef = useRef(null);

  return (
    <div className={["rounded-2xl border border-slate-200/70 bg-slate-50/50", compact ? "p-3" : "p-3"].join(" ")}>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          className="hidden"
          onChange={(e) => {
            const list = e.target.files;
            if (list?.length) onPick(list);
            e.target.value = "";
          }}
        />

        <BtnGhostSmall onClick={() => inputRef.current?.click()} disabled={busy}>
          📎 Chọn PDF
        </BtnGhostSmall>

        <BtnPrimarySmall
          onClick={onUpload}
          disabled={busy || !files.length}
          className="rounded-xl px-3 py-2 text-[12px]"
        >
          ⬆️ Upload
        </BtnPrimarySmall>

        {files.length > 0 && (
          <BtnDangerSmall onClick={onClear} disabled={busy}>
            ✖ Bỏ hết
          </BtnDangerSmall>
        )}

        <div className="ml-auto text-[11px] text-slate-500">
          {files.length ? (
            <>
              <span className="font-medium text-slate-700">{files.length}</span> file •{" "}
              <span className="font-medium text-slate-700">
                {prettySize(files.reduce((s, f) => s + (f.size || 0), 0))}
              </span>
            </>
          ) : (
            "Chưa chọn file"
          )}
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-2 space-y-2">
          {files.map((f, idx) => (
            <div
              key={`${rowId}-${f.name}-${f.size}-${idx}`}
              className="rounded-xl border border-slate-200/70 bg-white/70 px-3 py-2"
            >
              <div className="flex items-start gap-2">
                <div className="mt-[2px] shrink-0 rounded-xl border border-slate-200/70 bg-slate-50 px-2 py-1 text-[11px] text-slate-600">
                  PDF
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-medium text-slate-900 break-words">
                    {f.name}
                  </div>
                  <div className="text-[11px] text-slate-500">{prettySize(f.size)}</div>
                </div>

                <button
                  type="button"
                  onClick={() => onRemoveAt(idx)}
                  disabled={busy}
                  className="shrink-0 rounded-xl px-3 py-2 text-[12px] font-medium
                             border border-slate-200/70 bg-white/70 text-slate-700
                             hover:bg-white/90 active:scale-[0.98] transition
                             disabled:opacity-50"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-2 text-[11px] text-slate-500">
        Row: <span className="font-medium">{rowId}</span>
      </div>
    </div>
  );
}

/* DayPicker: tô đỏ range */
const dayPickerCss = `
.rdp { --rdp-cell-size: 40px; margin: 0; }
.rdp-caption_label { font-weight: 600; color: #0f172a; }
.rdp-day { border-radius: 14px; font-weight: 600; }
.rdp-range_middle .rdp-day_button {
  background: rgba(225, 29, 72, 0.12);
  border-radius: 12px;
}
.rdp-range_start .rdp-day_button,
.rdp-range_end .rdp-day_button {
  background: linear-gradient(to bottom, #fb7185, #e11d48);
  color: white;
  border-radius: 14px;
}
`;
