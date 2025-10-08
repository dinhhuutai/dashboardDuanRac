// UploadPayrollReport.jsx
import React, { useState } from "react";
import * as XLSX from "xlsx";
import { FaFileExcel, FaUpload, FaCheck, FaTimes, FaSpinner } from "react-icons/fa";
import http from "~/api/http";
import { BASE_URL } from "~/config";

/* ---------- helpers ---------- */
const norm = (s = "") =>
  String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, " ").trim().toUpperCase();

const buildRx = (aliases = []) => {
  const parts = aliases.map((a) => norm(a).replace(/\s+/g, "\\s*"));
  return new RegExp(`^(${parts.join("|")})$`, "i");
};
const getIdxN = (header, ...aliases) => {
  const rx = buildRx(aliases);
  for (let i = 0; i < header.length; i++) if (rx.test(norm(header[i] || ""))) return i;
  return -1;
};

// text hiển thị của 1 ô (ưu tiên .w)
const cellText = (ws, r, c) => {
  const addr = XLSX.utils.encode_cell({ r, c });
  const cell = ws[addr];
  if (!cell) return "";
  if (cell.w != null) return String(cell.w).trim();
  if (cell.v != null) return String(cell.v).trim();
  return "";
};

const niceNumber = (x) => {
  if (x == null || x === "") return "";
  const n = Number(String(x).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : "";
};
const moneyStr = (x) => (x == null || x === "" ? "" : String(x).trim());

export default function UploadPayrollReport() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  const handlePickFile = async (e) => {
    setFile(null); setRows([]); setMsg(null); setErr(null); setTitle(""); setDepartment("");
    const f = e.target.files?.[0];
    if (!f) return;

    try {
      const data = await f.arrayBuffer();
      const wb = XLSX.read(data, { type: "array" });
      const wsName = wb.SheetNames[0];
      const ws = wb.Sheets[wsName];

      // A2 -> title (y hệt backend)
      const A2 = ws["A2"]?.v ? String(ws["A2"].v).trim() : "";
      let parsedTitle = "";
      if (/BẢNG LƯƠNG GIỮA KỲ/i.test(A2)) {
        const m = A2.match(/BẢNG LƯƠNG GIỮA KỲ.*?(\d{2}\/\d{4})/i);
        parsedTitle = `Phiếu lương kỳ I tháng ${m?.[1] || ""}`.trim();
      } else {
        const m = A2.match(/BẢNG LƯƠNG THÁNG.*?(\d{2}\/\d{4})/i);
        parsedTitle = `Phiếu lương tháng ${m?.[1] || ""}`.trim();
      }
      setTitle(parsedTitle);

      // F6 -> BP1 (xem trước)
      setDepartment(ws["F6"]?.v ? String(ws["F6"].v).trim() : "");

      // Đọc AOA giữ ô trống + cellText
      const aoa = XLSX.utils.sheet_to_json(ws, {
        header: 1, raw: false, blankrows: false, defval: "", cellText: true
      });
      const colCount = Math.max(...aoa.map((r) => (Array.isArray(r) ? r.length : 0)));

      // tìm header (MSNV + HỌ VÀ TÊN)
      const headerRowIdx = aoa.findIndex(
        (rowArr) =>
          Array.isArray(rowArr) &&
          rowArr.some((c) => /MSNV/i.test(String(c || ""))) &&
          rowArr.some((c) => /HỌ\s*VÀ\s*TÊN/i.test(String(c || "")))
      );
      if (headerRowIdx < 0) {
        setErr("Không tìm được dòng tiêu đề (MSNV / HỌ VÀ TÊN).");
        setFile(f);
        return;
      }

      // header hiệu lực (row -> below -> above)
      const rowAbove = aoa[headerRowIdx - 1] || [];
      const headerRow = aoa[headerRowIdx] || [];
      const rowBelow = aoa[headerRowIdx + 1] || [];
      const headerEff = Array.from({ length: colCount }, (_, i) => {
        const h = String(headerRow[i] || "").trim();
        if (h) return h;
        const b = String(rowBelow[i] || "").trim();
        if (b) return b;
        return String(rowAbove[i] || "").trim();
      });

      // xác định dòng data đầu
      const colMSNV = getIdxN(headerEff, "MSNV");
      const colNAME = getIdxN(headerEff, "HỌ VÀ TÊN", "HO VA TEN");

      let firstDataIdx = headerRowIdx + 1;
      if (headerRowIdx + 1 < aoa.length) {
        const maybeHdr = aoa[headerRowIdx + 1] || [];
        const ms = norm(maybeHdr[colMSNV] || "");
        const nm = norm(maybeHdr[colNAME] || "");
        if (ms === "MSNV" || nm === "HO VA TEN") firstDataIdx++;
      }
      for (let r = firstDataIdx; r < aoa.length; r++) {
        const row = aoa[r] || [];
        const msnv = String(row[colMSNV] || "").trim();
        const name = String(row[colNAME] || "").trim();
        const isProbablyHeader = norm(msnv) === "MSNV" || norm(name) === "HO VA TEN";
        const isEmpty = row.every((v) => String(v || "").trim() === "");
        if (!isEmpty && !isProbablyHeader) { firstDataIdx = r; break; }
      }

      // map AOA -> body chuẩn
      const body = aoa.slice(firstDataIdx).map((row) => {
        const out = new Array(colCount).fill("");
        for (let i = 0; i < Math.min(colCount, row.length); i++) out[i] = row[i];
        return out;
      });

      // map header -> index (giống backend)
      const idx = {
        STT: getIdxN(headerEff, "STT"),
        MSNV: getIdxN(headerEff, "MSNV"),
        NAME: getIdxN(headerEff, "HỌ VÀ TÊN", "HO VA TEN"),
        BASIC: getIdxN(headerEff, "LƯƠNG CB", "LUONG CB", "LƯƠNG CƠ BẢN", "LUONG CO BAN"),
        RESP: getIdxN(headerEff, "PC TRÁCH NHIỆM", "PC TRACH NHIEM", "PHỤ CẤP TRÁCH NHIỆM", "PHU CAP TRACH NHIEM"),
        WDAY: getIdxN(headerEff, "NGÀY CÔNG CÓ HỆ SỐ", "NGAY CONG CO HE SO", "NGÀY CÔNG", "NGAY CONG"),
        HOLI: getIdxN(headerEff, "NGHỈ LỄ", "NGHI LE"),
        ACTUAL: getIdxN(headerEff, "LƯƠNG THỰC TẾ", "LUONG THUC TE"),
        OT15: getIdxN(headerEff, "TCA NGÀY", "TCA NGAY", "CA NGÀY", "CA NGAY"),
        OTS15: getIdxN(headerEff, "LƯƠNG TCA 1.5", "LUONG TCA 1.5"),
        OT18: getIdxN(headerEff, "TCA ĐÊM", "TCA DEM", "CA ĐÊM", "CA DEM"),
        OTS18: getIdxN(headerEff, "LƯƠNG TCA 1.8", "LUONG TCA 1.8"),
        OT05: getIdxN(headerEff, "TCA 0.5"),
        OTS05: getIdxN(headerEff, "LƯƠNG TCA 0.5", "LUONG TCA 0.5"),
        AL: getIdxN(headerEff, "NGHỈ PHÉP", "NGHI PHEP"),
        ALPAY: getIdxN(headerEff, "TIỀN PHÉP", "TIEN PHEP"),
        RENT: getIdxN(headerEff, "NHÀ TRỌ XE", "NHA TRO XE"),
        QBON: getIdxN(headerEff, "THƯỞNG HIỆU QUẢ CÔNG VIỆC", "THUONG HIEU QUA CONG VIEC"),
        TOTAL: getIdxN(headerEff, "TỔNG LƯƠNG", "TONG LUONG"),
      };

      // preview: STT lấy trực tiếp từ worksheet TEXT
      const ref = XLSX.utils.decode_range(ws["!ref"] || "A1");
      const preview = [];
      for (let i = 0; i < body.length; i++) {
        const r = body[i];
        const msnv = r[idx.MSNV]?.toString().trim();
        const name = r[idx.NAME]?.toString().trim();
        if (!msnv && !name) continue;

        let stt = "";
        if (idx.STT >= 0) {
          const wsRow = ref.s.r + firstDataIdx + i;
          const wsCol = ref.s.c + idx.STT;
          stt = cellText(ws, wsRow, wsCol); // chính xác như Excel hiển thị
        }

        preview.push({
          stt,
          msnv,
          name,
          department: ws["F6"]?.v ? String(ws["F6"].v).trim() : "",
          basicSalary: moneyStr(r[idx.BASIC]),
          responsibility: moneyStr(r[idx.RESP]),
          totalWorkingDays: niceNumber(r[idx.WDAY]),
          holiday: niceNumber(r[idx.HOLI]),
          actualSalary: moneyStr(r[idx.ACTUAL]),
          ot15: niceNumber(r[idx.OT15]),
          otSalary15: moneyStr(r[idx.OTS15]),
          ot18: niceNumber(r[idx.OT18]),
          otSalary18: moneyStr(r[idx.OTS18]),
          ot05: niceNumber(r[idx.OT05]),
          otSalary05: moneyStr(r[idx.OTS05]),
          annualLeave: niceNumber(r[idx.AL]),
          leavePay: moneyStr(r[idx.ALPAY]),
          rent: moneyStr(r[idx.RENT]),
          qualityBonus: moneyStr(r[idx.QBON]),
          totalSalary: moneyStr(r[idx.TOTAL]),
        });
      }

      setRows(preview.slice(0, 50));
      setFile(f); // gửi file gốc lên server, không ghi/chuyển đổi gì thêm
    } catch (e2) {
      console.error(e2);
      setErr("Không đọc được file Excel. Vui lòng kiểm tra định dạng.");
      setFile(f);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setBusy(true); setMsg(null); setErr(null);
    try {
      const form = new FormData();
      form.append("file", file); // file gốc
      const res = await http.post(`${BASE_URL}/api/paylips/import`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMsg(`Đã import: ${res.data?.inserted || 0} bản ghi. Bỏ qua (không có user): ${res.data?.skippedNoUser || 0}`);
    } catch (e) {
      setErr(e?.response?.data?.message || "Import thất bại.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="rounded-2xl border border-emerald-200/50 bg-white shadow-sm p-5 mb-5">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <FaFileExcel className="text-emerald-600" /> Import Bảng lương (Excel)
        </h2>
        <p className="text-slate-600 mt-1 text-sm">
          Chọn file Excel để nhập. Xem trước chỉ nhằm kiểm tra; dữ liệu lưu dựa trên việc parse ở <b>server</b>.
        </p>

        <div className="mt-4 flex flex-col sm:flex-row items-start gap-3">
          <label className="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 cursor-pointer">
            <FaUpload className="mr-2" /> Chọn file .xlsx
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handlePickFile} />
          </label>

          {file && (
            <div className="text-sm text-slate-600">
              <div><b>File:</b> {file.name}</div>
              {title && <div><b>Title (A2 → lưu):</b> {title}</div>}
              {department && <div><b>Department (F6):</b> {department}</div>}
            </div>
          )}

          <div className="flex-1" />

          <button
            onClick={handleUpload}
            disabled={!file || busy}
            className={`px-4 py-2 rounded-xl text-white shadow inline-flex items-center gap-2 ${
              !file || busy ? "bg-emerald-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {busy && <FaSpinner className="animate-spin" />}
            Tải lên & Lưu
          </button>
        </div>

        {msg && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            <FaCheck /> {msg}
          </div>
        )}
        {err && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
            <FaTimes /> {err}
          </div>
        )}
      </div>

      {rows.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
            <div className="font-semibold text-slate-800">Xem trước (tối đa 50 dòng)</div>
            <div className="text-sm text-slate-500">Tổng (xem trước): {rows.length}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  {[
                    "STT","MSNV","HỌ VÀ TÊN","DEPT(BP1)","LƯƠNG CB","PC TRÁCH NHIỆM",
                    "NGÀY CÔNG CÓ HỆ SỐ","NGHỈ LỄ","LƯƠNG THỰC TẾ",
                    "TCA 1.5","LƯƠNG TCA 1.5","TCA 1.8","LƯƠNG TCA 1.8","TCA 0.5","LƯƠNG TCA 0.5",
                    "NGHỈ PHÉP","TIỀN PHÉP","NHÀ TRỌ XE","THƯỞNG HQCV","TỔNG LƯƠNG"
                  ].map((h) => (
                    <th key={h} className="px-2 py-2 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-2 py-1 text-center">{r.stt}</td>
                    <td className="px-2 py-1">{r.msnv}</td>
                    <td className="px-2 py-1">{r.name}</td>
                    <td className="px-2 py-1">{r.department}</td>
                    <td className="px-2 py-1 text-right">{r.basicSalary}</td>
                    <td className="px-2 py-1 text-right">{r.responsibility}</td>
                    <td className="px-2 py-1 text-right">{r.totalWorkingDays}</td>
                    <td className="px-2 py-1 text-right">{r.holiday}</td>
                    <td className="px-2 py-1 text-right">{r.actualSalary}</td>
                    <td className="px-2 py-1 text-right">{r.ot15}</td>
                    <td className="px-2 py-1 text-right">{r.otSalary15}</td>
                    <td className="px-2 py-1 text-right">{r.ot18}</td>
                    <td className="px-2 py-1 text-right">{r.otSalary18}</td>
                    <td className="px-2 py-1 text-right">{r.ot05}</td>
                    <td className="px-2 py-1 text-right">{r.otSalary05}</td>
                    <td className="px-2 py-1 text-right">{r.annualLeave}</td>
                    <td className="px-2 py-1 text-right">{r.leavePay}</td>
                    <td className="px-2 py-1 text-right">{r.rent}</td>
                    <td className="px-2 py-1 text-right">{r.qualityBonus}</td>
                    <td className="px-2 py-1 text-right font-semibold">{r.totalSalary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-2 text-xs text-slate-500 border-t">
            Server là nguồn dữ liệu chính; phần xem trước bảo toàn STT theo TEXT hiển thị trong ô.
          </div>
        </div>
      )}
    </div>
  );
}
