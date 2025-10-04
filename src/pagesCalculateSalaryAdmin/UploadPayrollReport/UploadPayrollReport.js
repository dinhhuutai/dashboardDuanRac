import React, { useState } from "react";
import * as XLSX from "xlsx";
import { FaFileExcel, FaUpload, FaCheck, FaTimes, FaSpinner } from "react-icons/fa";
import http from "~/api/http"; // axios instance của bạn
import { BASE_URL } from "~/config";

function niceNumber(x) {
  if (x == null || x === "") return "";
  const n = Number(String(x).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : "";
}

// Rút gọn hiển thị tiền (chuỗi), vì cột kiểu NVARCHAR(10) theo schema của bạn
function moneyStr(x) {
  if (x == null || x === "") return "";
  const cleaned = String(x).trim();
  return cleaned;
}

export default function UploadPayrollReport() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");   // A2 -> “Phiếu lương kỳ I tháng 09/2025”…
  const [department, setDepartment] = useState(""); // F6 (BP1)
  const [rows, setRows] = useState([]);     // xem trước
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  // Parse Excel để xem trước (client) – server vẫn parse & lưu chuẩn để tránh sai lệch
  const handlePickFile = async (e) => {
    setFile(null);
    setRows([]);
    setMsg(null);
    setErr(null);
    setTitle("");
    setDepartment("");

    const f = e.target.files?.[0];
    if (!f) return;

    try {
      const data = await f.arrayBuffer();
      const wb = XLSX.read(data, { type: "array" });

      // Lấy sheet đầu
      const wsName = wb.SheetNames[0];
      const ws = wb.Sheets[wsName];

      // A2 -> xác định title
      const A2 = ws["A2"]?.v ? String(ws["A2"].v).trim() : "";
      let parsedTitle = "";
      if (/BẢNG LƯƠNG GIỮA KỲ/i.test(A2)) {
        // lấy phần sau cụm “BẢNG LƯƠNG GIỮA KỲ”
        // ví dụ: “BẢNG LƯƠNG GIỮA KỲ tháng 09/2025” => lấy “09/2025”
        const m = A2.match(/BẢNG LƯƠNG GIỮA KỲ.*?(\d{2}\/\d{4})/i);
        const period = m?.[1] || ""; // 09/2025
        parsedTitle = `Phiếu lương kỳ I tháng ${period || ""}`.trim();
      } else {
        // fallback: giữ nguyên A2 (hoặc bạn muốn quy tắc khác thêm ở đây)
        parsedTitle = A2 || "Phiếu lương";
      }
      setTitle(parsedTitle);

      // F6 -> department (BP1)
      const F6 = ws["F6"]?.v ? String(ws["F6"].v).trim() : "";
      setDepartment(F6);

      // Đọc dạng mảng để tự xác định dòng header
      const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, blankrows: false });
      // Tìm hàng có chứa “MSNV”, “STT”, “HỌ VÀ TÊN”… coi như header
      const headerRowIdx = aoa.findIndex((rowArr) =>
        Array.isArray(rowArr) &&
        rowArr.some((c) => /MSNV/i.test(String(c || ""))) &&
        rowArr.some((c) => /HỌ\s*VÀ\s*TÊN/i.test(String(c || "")))
      );
      if (headerRowIdx < 0) {
        setErr("Không tìm được dòng tiêu đề cột (MSNV / HỌ VÀ TÊN) trong file.");
        setFile(f);
        return;
      }
      const header = aoa[headerRowIdx].map((c) => (c ? String(c).trim() : ""));
      const body = aoa.slice(headerRowIdx + 1);

      // Map cột -> index
      const getIdx = (regex) => header.findIndex((h) => regex.test(h));
      const idx = {
        STT: getIdx(/^STT$/i),
        MSNV: getIdx(/^MSNV$/i),
        NAME: getIdx(/HỌ\s*VÀ\s*TÊN/i),
        BASIC: getIdx(/^LƯƠNG\s*CB$/i),
        RESP: getIdx(/^PC\s*TRÁCH\s*NHIỆM$/i),
        WDAY: getIdx(/^NGÀY\s*CÔNG\s*CÓ\s*HỆ\s*SỐ$/i),
        HOLI: getIdx(/^NGHỈ\s*LỄ$/i),
        ACTUAL: getIdx(/^LƯƠNG\s*THỰC\s*TẾ$/i),
        OT15: getIdx(/^TCA\s*1\.5$/i),
        OTS15: getIdx(/^LƯƠNG\s*TCA\s*1\.5$/i),
        OT18: getIdx(/^TCA\s*1\.8$/i),
        OTS18: getIdx(/^LƯƠNG\s*TCA\s*1\.8$/i),
        OT05: getIdx(/^TCA\s*0\.5$/i),
        OTS05: getIdx(/^LƯƠNG\s*TCA\s*0\.5$/i),
        AL:   getIdx(/^NGHỈ\s*PHÉP$/i),
        ALPAY:getIdx(/^TIỀN\s*PHÉP$/i),
        RENT: getIdx(/^NHÀ\s*TRỌ\s*XE$/i),
        QBON: getIdx(/^THƯỞNG\s*HIỆU\s*QUẢ\s*CÔNG\s*VIỆC$/i),
        TOTAL:getIdx(/^TỔNG\s*LƯƠNG$/i),
      };

      const required = ["MSNV", "NAME"];
      for (const k of required) {
        if (idx[k] < 0) {
          setErr(`Thiếu cột bắt buộc: ${k}`);
          setFile(f);
          return;
        }
      }

      // Chuyển thành obj để xem trước
      const preview = [];
      for (const r of body) {
        const msnv = r[idx.MSNV]?.trim();
        const name = r[idx.NAME]?.trim();
        if (!msnv && !name) continue; // bỏ dòng trống
        preview.push({
          stt: r[idx.STT],
          msnv,
          name,
          department: F6 || "",

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
      setRows(preview.slice(0, 50)); // xem trước tối đa 50 dòng để nhẹ trang
      setFile(f);
    } catch (e) {
      console.error(e);
      setErr("Không đọc được file Excel. Vui lòng kiểm tra định dạng.");
      setFile(f);
    }
  };

  // Gửi file về server để parse & lưu
  const handleUpload = async () => {
    if (!file) return;
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const form = new FormData();
      form.append("file", file);
      // có thể gửi kèm tùy chọn: forceReplace, dryRun...
      const res = await http.post(`${BASE_URL}/api/paylips/import`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMsg(`Đã import: ${res.data?.inserted || 0} bản ghi.`);
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
          Chọn file Excel bảng lương để nhập vào hệ thống. Hệ thống sẽ tự nhận cột và lưu từng bản ghi vào <b>tl_Paylips</b>.
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

      {/* Preview */}
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
                  ].map(h => (<th key={h} className="px-2 py-2 whitespace-nowrap">{h}</th>))}
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
            Lưu ý: server sẽ là nơi parse chính & lưu DB; phần này chỉ là xem trước để bạn kiểm tra.
          </div>
        </div>
      )}
    </div>
  );
}
