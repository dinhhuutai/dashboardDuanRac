// src/pages/Payroll/UploadPayrollReport.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  FaFileExcel,
  FaUpload,
  FaCheck,
  FaTimes,
  FaSpinner,
} from "react-icons/fa";
import http from "~/api/http";
import { BASE_URL } from "~/config";

const STATUS_LABEL = {
  inserted: "Lưu thành công",
  skipped_no_user: "Bỏ qua (không có user)",
  failed: "Lỗi lưu",
};

const STATUS_CLASS = {
  inserted:
    "bg-emerald-50 text-emerald-700 border border-emerald-100",
  skipped_no_user:
    "bg-amber-50 text-amber-700 border border-amber-100",
  failed: "bg-rose-50 text-rose-700 border border-rose-100",
  pending: "bg-slate-50 text-slate-600 border border-slate-100",
};

export default function UploadPayrollReport() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [summary, setSummary] = useState(null);

  const [rows, setRows] = useState([]); // { index, msnv, name, status, reason }
  const [totalRows, setTotalRows] = useState(0);
  const [progress, setProgress] = useState(0);

  const esRef = useRef(null);

  useEffect(() => {
    return () => {
      if (esRef.current) {
        esRef.current.close();
      }
    };
  }, []);

  const resetState = () => {
    setTitle("");
    setErr(null);
    setSummary(null);
    setRows([]);
    setTotalRows(0);
    setProgress(0);
  };

  const handlePickFile = (e) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    resetState();
  };

  const handleUpload = async () => {
    if (!file || busy) return;

    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    setBusy(true);
    setErr(null);
    setSummary(null);
    setRows([]);
    setTotalRows(0);
    setProgress(0);

    try {
      const form = new FormData();
      form.append("file", file);

      const resStart = await http.post(
        `${BASE_URL}/api/paylips/import-start`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const { success, jobId, title: serverTitle, message } =
        resStart.data || {};

      if (!success || !jobId) {
        throw new Error(message || "Khởi tạo job import thất bại");
      }

      setTitle(serverTitle || "");

      const streamUrl = `${BASE_URL}/api/paylips/import-stream/${jobId}`;
      const es = new EventSource(streamUrl);
      esRef.current = es;

      es.addEventListener("start", (event) => {
        try {
          const data = JSON.parse(event.data || "{}");
          setTotalRows(data.totalRows || 0);
          setProgress(0);
        } catch (e) {
          console.error("start parse error", e);
        }
      });

      es.addEventListener("row", (event) => {
        try {
          const data = JSON.parse(event.data || "{}");
          setRows((prev) => [...prev, data]);

          if (data.totalRows && typeof data.index === "number") {
            const pct = Math.round(
              ((data.index + 1) / data.totalRows) * 100
            );
            setTotalRows(data.totalRows);
            setProgress(pct);
          }
        } catch (e) {
          console.error("row parse error", e);
        }
      });

      es.addEventListener("done", (event) => {
        try {
          const data = JSON.parse(event.data || "{}");
          setSummary({
            inserted: data.inserted || 0,
            skippedNoUser: data.skippedNoUser || 0,
            failed: data.failed || 0,
            totalRows: data.totalRows || 0,
          });
          setProgress(100);
        } catch (e) {
          console.error("done parse error", e);
        } finally {
          setBusy(false);
          es.close();
          esRef.current = null;
        }
      });

      es.addEventListener("error", (event) => {
        console.error("SSE error:", event);
        setErr("Lỗi trong quá trình import (SSE).");
        setBusy(false);
        es.close();
        esRef.current = null;
      });
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || e.message || "Import thất bại.");
      setBusy(false);
    }
  };

  const renderStatusBadge = (status) => {
    if (!status) status = "pending";
    const cls = STATUS_CLASS[status] || STATUS_CLASS.pending;
    const label = STATUS_LABEL[status] || "Đang xử lý";

    return (
      <span
        className={
          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium " +
          cls
        }
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
        {label}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Card upload - Neumorphism style */}
      <div
        className="
          rounded-3xl 
          border border-emerald-100/60
          bg-gradient-to-br from-emerald-50 via-emerald-50 to-emerald-100
          px-5 py-6
          md:px-6 md:py-7
          shadow-[10px_10px_20px_#c7dbd4,-10px_-10px_20px_#ffffff]
        "
      >
        <div className="flex items-start gap-4">
          <div
            className="
              mt-1 flex h-12 w-12 items-center justify-center 
              rounded-2xl 
              bg-emerald-50 
              shadow-[6px_6px_12px_#c1d5ce,-6px_-6px_12px_#ffffff]
              text-emerald-600
            "
          >
            <FaFileExcel className="text-2xl" />
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-slate-800">
                Import bảng lương từ Excel
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Chọn file Excel bảng lương. Hệ thống sẽ lưu từng nhân viên và
                hiển thị trạng thái{" "}
                <span className="font-medium text-emerald-700">
                  theo thời gian thực
                </span>{" "}
                (OK / bỏ qua / lỗi).
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-3 md:items-center">
              {/* Button chọn file */}
              <label
                className="
                  relative inline-flex items-center justify-center
                  px-4 py-2.5
                  rounded-2xl
                  text-sm font-medium
                  text-emerald-800
                  cursor-pointer
                  bg-emerald-50
                  border border-emerald-100
                  shadow-[4px_4px_8px_#c1d5ce,-4px_-4px_8px_#ffffff]
                  hover:shadow-[2px_2px_4px_#c1d5ce,-2px_-2px_4px_#ffffff]
                  transition
                "
              >
                <FaUpload className="mr-2" />
                <span>
                  {file ? "Chọn file khác" : "Chọn file .xlsx / .xls"}
                </span>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handlePickFile}
                />
              </label>

              {/* Info file */}
              <div className="flex-1 text-xs md:text-sm text-slate-600 space-y-0.5">
                {file ? (
                  <>
                    <div>
                      <span className="font-semibold">File:</span>{" "}
                      <span className="break-all">{file.name}</span>
                    </div>
                    {title && (
                      <div>
                        <span className="font-semibold">Title:</span>{" "}
                        {title}
                      </div>
                    )}
                    {totalRows > 0 && (
                      <div>
                        <span className="font-semibold">Số dòng:</span>{" "}
                        {totalRows} nhân viên
                      </div>
                    )}
                  </>
                ) : (
                  <span className="italic text-slate-400">
                    Chưa chọn file. Hỗ trợ định dạng Excel chuẩn từ phòng
                    nhân sự.
                  </span>
                )}
              </div>

              {/* Button upload */}
              <button
                onClick={handleUpload}
                disabled={!file || busy}
                className={`
                  inline-flex items-center justify-center 
                  px-4 py-2.5 
                  rounded-2xl 
                  text-sm font-semibold
                  transition
                  ${
                    !file || busy
                      ? "cursor-not-allowed text-emerald-400 bg-emerald-50 border border-emerald-100"
                      : "text-emerald-50 bg-emerald-500 border border-emerald-300 hover:bg-emerald-600"
                  }
                  shadow-[4px_4px_8px_#c1d5ce,-4px_-4px_8px_#ffffff]
                `}
              >
                {busy && (
                  <FaSpinner className="animate-spin mr-2 text-xs" />
                )}
                {busy ? "Đang import..." : "Tải lên & Import"}
              </button>
            </div>

            {/* Progress bar */}
            {busy || progress > 0 ? (
              <div className="mt-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                  <span>
                    {busy
                      ? "Đang xử lý bảng lương..."
                      : "Hoàn tất import"}
                  </span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-emerald-100 overflow-hidden">
                  <div
                    className="
                      h-full 
                      rounded-full 
                      bg-gradient-to-r from-emerald-400 to-emerald-500
                      transition-all duration-200
                    "
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : null}

            {/* Thông báo success / error */}
            <div className="mt-3 space-y-2">
              {summary && (
                <div
                  className="
                    inline-flex flex-wrap items-center gap-2 
                    px-3 py-2 rounded-2xl 
                    bg-emerald-50 text-emerald-800 
                    border border-emerald-100 
                    text-xs md:text-sm
                    shadow-[3px_3px_6px_#c1d5ce,-3px_-3px_6px_#ffffff]
                  "
                >
                  <FaCheck className="shrink-0" />
                  <span>
                    Đã import:{" "}
                    <b>{summary.inserted.toLocaleString()}</b> bản ghi. Bỏ
                    qua (không có user):{" "}
                    <b>{summary.skippedNoUser.toLocaleString()}</b>. Lỗi:{" "}
                    <b>{summary.failed.toLocaleString()}</b>.
                  </span>
                </div>
              )}
              {err && (
                <div
                  className="
                    inline-flex items-center gap-2 
                    px-3 py-2 rounded-2xl 
                    bg-rose-50 text-rose-700 
                    border border-rose-100 
                    text-xs md:text-sm
                  "
                >
                  <FaTimes className="shrink-0" />
                  <span>{err}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bảng kết quả realtime - Neumorphism nhẹ */}
      <div
        className="
          rounded-3xl 
          border border-slate-100 
          bg-slate-50
          shadow-[10px_10px_20px_#cfd8dd,-10px_-10px_20px_#ffffff]
          overflow-hidden
        "
      >
        <div className="px-4 md:px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 text-sm md:text-base">
              Kết quả import từng nhân viên
            </span>
            {title && (
              <span className="text-[11px] md:text-xs text-slate-500">
                ({title})
              </span>
            )}
          </div>
          <div className="text-[11px] md:text-xs text-slate-500">
            Tổng dòng đã xử lý:{" "}
            <span className="font-semibold">{rows.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[420px]">
          <table className="min-w-full text-xs md:text-sm">
            <thead className="bg-slate-50 text-slate-700 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2 text-left w-16">#</th>
                <th className="px-3 py-2 text-left whitespace-nowrap">
                  MSNV
                </th>
                <th className="px-3 py-2 text-left whitespace-nowrap">
                  Họ và tên
                </th>
                <th className="px-3 py-2 text-left whitespace-nowrap">
                  Trạng thái
                </th>
                <th className="px-3 py-2 text-left">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-slate-400 text-xs"
                  >
                    Chưa có dữ liệu. Chọn file và bấm{" "}
                    <span className="font-semibold">
                      Tải lên & Import
                    </span>{" "}
                    để bắt đầu.
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr
                    key={`${r.msnv || "row"}-${i}`}
                    className="hover:bg-slate-100/70 transition-colors"
                  >
                    <td className="px-3 py-1.5 text-slate-500">
                      {i + 1}
                    </td>
                    <td className="px-3 py-1.5 font-medium text-slate-800 whitespace-nowrap">
                      {r.msnv || "-"}
                    </td>
                    <td className="px-3 py-1.5 text-slate-800 whitespace-nowrap">
                      {r.name || "-"}
                    </td>
                    <td className="px-3 py-1.5">
                      {renderStatusBadge(r.status)}
                    </td>
                    <td className="px-3 py-1.5 text-slate-500 max-w-xs md:max-w-sm lg:max-w-md truncate">
                      {r.reason || ""}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {rows.length > 0 && (
          <div className="px-4 md:px-5 py-2 text-[11px] md:text-xs text-slate-500 border-t border-slate-100 flex justify-between bg-slate-50/80">
            <span>
              Dữ liệu hiển thị theo thứ tự hệ thống xử lý trong Excel.
            </span>
            {totalRows > 0 && (
              <span>
                Tiến độ:{" "}
                <b>
                  {rows.length}/{totalRows}
                </b>{" "}
                dòng có dữ liệu.
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
