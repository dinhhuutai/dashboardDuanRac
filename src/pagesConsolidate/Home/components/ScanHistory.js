import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaHistory,
} from "react-icons/fa";
import { apiGetInspectionHistory } from "../api/qualityInspectionApi";

function formatDateTime(value) {
  if (!value) return "";

  const text = String(value).trim();

  // dạng ISO: 2026-03-18T08:00:00.000Z
  const match = text.match(
    /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/
  );

  if (match) {
    const [, yyyy, MM, dd, hh, mm] = match;
    return `${dd}/${MM}/${yyyy} ${hh}:${mm}`;
  }

  return text;
}

function getInputTypeText(inputType) {
  const val = String(inputType || "").toUpperCase();
  if (val === "MANUAL") return "Nhập tay";
  if (val === "SCAN") return "Quét QR";
  return "-";
}

function getSpStatusText(status) {
  return Number(status) === 1 ? "Thành công" : "Lỗi";
}

function Badge({ children, tone = "slate" }) {
  const styles = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    red: "bg-rose-50 text-rose-700 border-rose-200",
    blue: "bg-sky-50 text-sky-700 border-sky-200",
    slate: "bg-slate-50 text-slate-700 border-slate-200",
  };

  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-full text-xs border font-medium ${styles[tone] || styles.slate}`}
    >
      {children}
    </span>
  );
}

export default function ScanHistory({ inspectionType = "GOM" }) {
  const [rows, setRows] = useState([]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [qrCode, setQrCode] = useState("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGetInspectionHistory({
        inspectionType,
        date,
        qrCode,
        page,
        pageSize: 20,
      });

      setRows(res?.data || []);
      setPagination(
        res?.pagination || {
          page: 1,
          pageSize: 20,
          total: 0,
          totalPages: 0,
        }
      );
    } catch (err) {
      console.error("Load history error:", err);
      setRows([]);
      setPagination({
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [inspectionType, date, qrCode, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setQrCode(keyword.trim());
    }, 600);

    return () => clearTimeout(timer);
  }, [keyword]);

  const handleClear = () => {
    setKeyword("");
    setQrCode("");
    setDate(new Date().toISOString().slice(0, 10));
    setPage(1);
  };

  const pageText = useMemo(() => {
    const total = pagination?.total || 0;
    const currentPage = pagination?.page || 1;
    const size = pagination?.pageSize || 20;

    if (!total) return "0 / 0";
    const from = (currentPage - 1) * size + 1;
    const to = Math.min(currentPage * size, total);
    return `${from}-${to} / ${total}`;
  }, [pagination]);

  const openDatePicker = (e) => {
    if (typeof e.currentTarget.showPicker === "function") {
        try {
        e.currentTarget.showPicker();
        } catch (err) {
        // bỏ qua nếu trình duyệt chặn
        console.log("showPicker blocked:", err);
        }
    }
  };

  return (
    <div className="mt-6 md:mb-[20px] md:mt-8 rounded-[28px] bg-white shadow-xl border border-amber-100 overflow-hidden">
      <div className="p-4 md:p-6 border-b border-amber-100 bg-gradient-to-r from-orange-50 to-amber-50">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
            <FaHistory />
            Lịch sử quét
          </div>

          <h2 className="mt-3 text-xl md:text-2xl font-bold text-amber-900">
            Lịch sử quét GOM
          </h2>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-[180px_1fr_auto] gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => {
                setDate(e.target.value);
                setPage(1);
            }}
            onClick={openDatePicker}
            className="w-full rounded-2xl border border-green-200 px-4 py-3 outline-none focus:ring-2 focus:ring-green-300 cursor-pointer"
          />

          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo mã Code..."
            className="w-full rounded-2xl border border-amber-200 px-4 py-3 outline-none focus:ring-2 focus:ring-orange-300"
          />

          <button
            onClick={handleClear}
            className="rounded-2xl border border-slate-200 hover:bg-slate-50 px-5 py-3 font-medium transition"
          >
            Làm mới
          </button>
        </div>
      </div>

      {/* DESKTOP */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Mã QrCode</th>
              <th className="text-left px-4 py-3 font-semibold">Thời gian</th>
              <th className="text-left px-4 py-3 font-semibold">Hình thức</th>
              <th className="text-left px-4 py-3 font-semibold">Lưu vào ERP</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.Id}
                  className="border-t border-slate-100 hover:bg-orange-50/40"
                >
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {row.QrCode}
                  </td>
                  <td className="px-4 py-3">
                    {formatDateTime(row.InspectionDateTime)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone="blue">{getInputTypeText(row.inputType)}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={Number(row.SpStatus) === 1 ? "green" : "red"}>
                      {getSpStatusText(row.SpStatus)}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE */}
      <div className="md:hidden p-3 space-y-3 bg-[#fffdfa]">
        {loading ? (
          <div className="rounded-2xl bg-white border border-amber-100 p-4 text-center text-slate-500">
            Đang tải dữ liệu...
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl bg-white border border-amber-100 p-4 text-center text-slate-500">
            Không có dữ liệu
          </div>
        ) : (
          rows.map((row) => (
            <div
              key={row.Id}
              className="rounded-2xl bg-white border border-amber-100 shadow-sm p-4"
            >
              <div className="font-semibold text-slate-800 break-all">
                {row.QrCode}
              </div>

              <div className="mt-2 text-sm text-slate-600">
                {formatDateTime(row.InspectionDateTime)}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="blue">{getInputTypeText(row.inputType)}</Badge>
                <Badge tone={Number(row.SpStatus) === 1 ? "green" : "red"}>
                  Lưu ERP: {getSpStatusText(row.SpStatus)}
                </Badge>
              </div>
            </div>
          ))
        )}
      </div>

      {/* PAGINATION */}
      <div className="p-4 md:p-5 border-t border-amber-100 bg-white">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="text-sm text-slate-600">
            Hiển thị: <span className="font-semibold">{pageText}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page <= 1 || loading}
              className="h-10 px-4 rounded-xl border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 flex items-center gap-2"
            >
              <FaChevronLeft />
              Trước
            </button>

            <div className="px-4 h-10 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center text-sm font-medium">
              Trang {pagination.page || 1} / {pagination.totalPages || 1}
            </div>

            <button
              onClick={() =>
                setPage((prev) =>
                  prev < (pagination.totalPages || 1) ? prev + 1 : prev
                )
              }
              disabled={page >= (pagination.totalPages || 1) || loading}
              className="h-10 px-4 rounded-xl border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 flex items-center gap-2"
            >
              Sau
              <FaChevronRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}