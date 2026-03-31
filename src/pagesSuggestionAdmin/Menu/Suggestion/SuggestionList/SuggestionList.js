import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { BASE_URL } from "~/config";
import { FaSpinner } from "react-icons/fa";
import { FiDownload } from "react-icons/fi";
import ImageDetailModal from "~/components/ImageDetailModal";
import http from "~/api/http";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { vi } from "date-fns/locale";

const PAGE_SIZE_OPTIONS = [2, 5, 10, 20, 50, 100];

/** Màu nền ô Excel theo statusId (ARGB) */
function excelFillForStatus(statusId) {
  const id = Number(statusId);
  const map = {
    1: "FFF1F5F9",
    2: "FFDBEAFE",
    3: "FFFEF3C7",
    4: "FFFEE2E2",
    5: "FFFFEDD5",
    6: "FFD1FAE5",
  };
  return map[id] || "FFFFFFFF";
}

function badgeClassForStatus(statusId) {
  const id = Number(statusId);
  const map = {
    1: "bg-slate-100 text-slate-800 ring-slate-200",
    2: "bg-blue-100 text-blue-900 ring-blue-200",
    3: "bg-amber-100 text-amber-900 ring-amber-200",
    4: "bg-rose-100 text-rose-900 ring-rose-200",
    5: "bg-orange-100 text-orange-900 ring-orange-200",
    6: "bg-emerald-100 text-emerald-900 ring-emerald-200",
  };
  return map[id] || "bg-slate-100 text-slate-700 ring-slate-200";
}

function rowClassForStatus(statusId) {
  const id = Number(statusId);
  const map = {
    1: "bg-slate-50 hover:bg-slate-100/70",
    2: "bg-blue-50 hover:bg-blue-100/60",
    3: "bg-amber-50 hover:bg-amber-100/60",
    4: "bg-rose-50 hover:bg-rose-100/60",
    5: "bg-orange-50 hover:bg-orange-100/60",
    6: "bg-emerald-50 hover:bg-emerald-100/60",
  };
  return map[id] || "bg-white hover:bg-indigo-50/70";
}

function SuggestionList() {
  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [range, setRange] = useState({
    from: new Date(),
    to: new Date(),
  });
  const [openCalendar, setOpenCalendar] = useState(false);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatusId, setFilterStatusId] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [exporting, setExporting] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);

  useEffect(() => {
    fetchCategories();
    fetchStatuses();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [range?.from, range?.to, filterCategory, filterStatusId]);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  useEffect(() => {
    if (!range?.from || !range?.to) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await http.get(`${BASE_URL}/api/suggestions`, {
          params: {
            fromDate: format(range.from, "yyyy-MM-dd"),
            toDate: format(range.to, "yyyy-MM-dd"),
            categoryId: filterCategory || undefined,
            statusId: filterStatusId || undefined,
            page,
            pageSize,
          },
        });
        if (!cancelled && res.data.success) {
          setData(res.data.data || []);
          setTotal(res.data.total ?? 0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [range, filterCategory, filterStatusId, page, pageSize]);

  const fetchCategories = async () => {
    const res = await http.get(`${BASE_URL}/api/suggestions/categories`);
    if (res.data.success) setCategories(res.data.data);
  };

  const fetchStatuses = async () => {
    try {
      const res = await http.get(`${BASE_URL}/api/suggestions/statuses`);
      if (res.data.success) setStatuses(res.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAllForExport = async () => {
    const res = await http.get(`${BASE_URL}/api/suggestions`, {
      params: {
        fromDate: format(range.from, "yyyy-MM-dd"),
        toDate: format(range.to, "yyyy-MM-dd"),
        categoryId: filterCategory || undefined,
        statusId: filterStatusId || undefined,
        exportAll: true,
      },
    });
    if (!res.data.success) throw new Error("Export failed");
    return res.data.data || [];
  };

  const handleRowClick = async (item) => {
    try {
      const res = await http.get(
        `${BASE_URL}/api/suggestions/${item.suggestionId}/images`
      );
      setSelectedItem({
        ...item,
        images: res.data.data || [],
      });
    } catch (err) {
      console.error("Lỗi load ảnh:", err);
      setSelectedItem({
        ...item,
        images: [],
      });
    }
  };

  const handleAdminSave = async ({ statusId, processing_detail }) => {
    if (!selectedItem) return;
    await http.patch(
      `${BASE_URL}/api/suggestions/${selectedItem.suggestionId}`,
      {
        statusId,
        processing_detail,
      }
    );
    const name =
      statuses.find((s) => Number(s.statusId) === Number(statusId))?.statusName ||
      "";
    setSelectedItem((prev) =>
      prev
        ? {
            ...prev,
            statusId,
            processing_detail,
            statusName: name,
          }
        : null
    );
    const res = await http.get(`${BASE_URL}/api/suggestions`, {
      params: {
        fromDate: format(range.from, "yyyy-MM-dd"),
        toDate: format(range.to, "yyyy-MM-dd"),
        categoryId: filterCategory || undefined,
        statusId: filterStatusId || undefined,
        page,
        pageSize,
      },
    });
    if (res.data.success) {
      setData(res.data.data || []);
      setTotal(res.data.total ?? 0);
    }
  };

  const rangeText =
    range?.from && range?.to
      ? `${format(range.from, "dd/MM/yyyy")} - ${format(
          range.to,
          "dd/MM/yyyy"
        )}`
      : "Chọn khoảng ngày";

  const exportToExcel = async () => {
    setExporting(true);
    try {
      const rows = await fetchAllForExport();
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Góp ý CNV");

      const now = new Date();
      const stamp = format(now, "dd/MM/yyyy HH:mm:ss");
      const title = `Góp ý CNV — ${format(range.from, "dd-MM-yyyy")} → ${format(
        range.to,
        "dd-MM-yyyy"
      )} — Xuất lúc ${stamp}`;

      worksheet.mergeCells("A1:J1");
      const titleCell = worksheet.getCell("A1");
      titleCell.value = title;
      titleCell.font = { size: 14, bold: true, color: { argb: "FF1E293B" } };
      titleCell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      titleCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E7FF" },
      };
      worksheet.getRow(1).height = 36;

      const header = [
        "STT",
        "Danh mục",
        "Tình trạng",
        "Chi tiết xử lý",
        "Nội dung",
        "Ngày gửi",
        "Người gửi",
        "Bộ phận",
        "SĐT",
        "Mã",
      ];
      worksheet.addRow(header);
      const headerRow = worksheet.getRow(2);
      headerRow.height = 28;
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF4338CA" },
        };
        cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
        cell.border = {
          top: { style: "thin", color: { argb: "FF312E81" } },
          left: { style: "thin", color: { argb: "FF312E81" } },
          bottom: { style: "thin", color: { argb: "FF312E81" } },
          right: { style: "thin", color: { argb: "FF312E81" } },
        };
      });

      const colW = [5, 18, 16, 28, 40, 18, 16, 16, 14, 8];
      colW.forEach((w, i) => {
        worksheet.getColumn(i + 1).width = w;
      });

      for (let i = 0; i < rows.length; i++) {
        const item = rows[i];
        const r = worksheet.addRow([
          i + 1,
          item.categoryName,
          item.statusName || "—",
          item.processing_detail || "—",
          item.content,
          format(new Date(item.created_at), "dd/MM/yyyy HH:mm"),
          item.sender_name || "Ẩn danh",
          item.sender_department || "-",
          item.sender_phone || "-",
          item.suggestionId,
        ]);
        r.height = 24;
        const sid = item.statusId;
        r.eachCell((cell, colNumber) => {
          cell.alignment = {
            vertical: "middle",
            horizontal: colNumber <= 2 ? "center" : "left",
            wrapText: true,
          };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: excelFillForStatus(sid) },
          };
          cell.border = {
            top: { style: "thin", color: { argb: "FFCBD5E1" } },
            left: { style: "thin", color: { argb: "FFCBD5E1" } },
            bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
            right: { style: "thin", color: { argb: "FFCBD5E1" } },
          };
        });
      }

      const buf = await workbook.xlsx.writeBuffer();
      const fn = `Gop_y_${format(now, "yyyyMMdd_HHmmss")}.xlsx`;
      saveAs(new Blob([buf]), fn);
    } catch (e) {
      console.error(e);
      alert("Không xuất được Excel.");
    } finally {
      setExporting(false);
    }
  };

  const goPage = (p) => {
    const next = Math.min(Math.max(1, p), totalPages);
    setPage(next);
  };

  return (
    <div className="p-3 sm:p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border-b bg-gradient-to-r from-indigo-50 to-white">
          <h1 className="text-lg sm:text-2xl font-semibold text-slate-800">
            📬 Danh sách góp ý CNV
          </h1>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportToExcel}
              disabled={exporting || total === 0}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3 py-2 rounded-xl text-sm font-medium shadow"
            >
              <FiDownload />
              {exporting ? "..." : "Xuất Excel"}
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 border-b flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-end gap-4">
            <div className="relative w-full sm:w-auto">
              <label className="text-xs font-medium text-slate-600 block mb-1">
                Khoảng ngày
              </label>
              <button
                type="button"
                onClick={() => setOpenCalendar(true)}
                className="w-full sm:w-[min(100%,260px)] rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-left shadow-sm hover:border-indigo-400 focus:ring-2 focus:ring-indigo-200 transition"
              >
                {rangeText}
              </button>

              {openCalendar && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-black/20"
                    onClick={() => setOpenCalendar(false)}
                  />
                  <div
                    className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-h-[90vh] overflow-y-auto
                      bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 w-[min(96vw,360px)]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DayPicker
                      mode="range"
                      selected={range}
                      onSelect={(r) =>
                        setRange(r || { from: undefined, to: undefined })
                      }
                      numberOfMonths={1}
                      showOutsideDays
                      className="rdp"
                      locale={vi}
                      weekStartsOn={1}
                      formatters={{
                        formatCaption: (date) =>
                          format(date, "MMMM yyyy", { locale: vi }),
                      }}
                    />
                    <div className="flex justify-end mt-3">
                      <button
                        type="button"
                        onClick={() => setOpenCalendar(false)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-white"
                      >
                        Đóng
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="w-full sm:w-auto min-w-0 flex-1 sm:max-w-[220px]">
              <label className="text-xs font-medium text-slate-600 block mb-1">
                Danh mục
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
              >
                <option value="">Tất cả</option>
                {categories.map((cat) => (
                  <option
                    key={cat.suggestionCategorieId}
                    value={cat.suggestionCategorieId}
                  >
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-auto min-w-0 flex-1 sm:max-w-[220px]">
              <label className="text-xs font-medium text-slate-600 block mb-1">
                Tình trạng
              </label>
              <select
                value={filterStatusId}
                onChange={(e) => setFilterStatusId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
              >
                <option value="">Tất cả</option>
                {statuses.map((s) => (
                  <option key={s.statusId} value={s.statusId}>
                    {s.statusName}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-auto sm:ml-auto flex items-end gap-2">
              <label className="text-xs font-medium text-slate-600 sr-only sm:not-sr-only sm:mb-1">
                Số dòng/trang
              </label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
                aria-label="Số dòng mỗi trang"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n} / trang
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="relative p-3 sm:p-6">
          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur flex items-center justify-center z-30 rounded-xl">
              <FaSpinner className="animate-spin text-indigo-600 text-2xl" />
            </div>
          )}

          {data.length === 0 ? (
            <div className="text-center text-slate-500 py-12 text-sm sm:text-base">
              Không có dữ liệu
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-slate-200 -mx-1 sm:mx-0">
                {/* Không dùng table-fixed: tổng width cột (px) > min-width bảng sẽ bị ép đè cột */}
                <table className="w-full min-w-[1500px] border-collapse text-xs sm:text-sm">
                  <thead className="bg-slate-100 text-slate-600 text-[10px] sm:text-xs uppercase">
                    <tr>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-left whitespace-nowrap w-12 min-w-[3rem]">
                        #
                      </th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-left whitespace-nowrap min-w-[10rem]">
                        Danh mục
                      </th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-left whitespace-nowrap min-w-[9rem]">
                        Tình trạng
                      </th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-left min-w-[14rem] max-w-[18rem]">
                        Chi tiết xử lý
                      </th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-left min-w-[16rem] max-w-[22rem]">
                        Nội dung
                      </th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-left whitespace-nowrap min-w-[8.5rem]">
                        Ngày gửi
                      </th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-left min-w-[8rem]">
                        Người gửi
                      </th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-left min-w-[9rem] hidden md:table-cell">
                        Bộ phận
                      </th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-left whitespace-nowrap min-w-[7rem] hidden lg:table-cell">
                        SĐT
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item, i) => (
                      <tr
                        key={item.suggestionId}
                        className={`border-t cursor-pointer transition-colors ${rowClassForStatus(
                          item.statusId
                        )}`}
                        onClick={() => handleRowClick(item)}
                      >
                        <td className="px-2 sm:px-3 py-2 sm:py-3 align-top text-slate-500 tabular-nums">
                          {(page - 1) * pageSize + i + 1}
                        </td>
                        <td
                          className="px-2 sm:px-3 py-2 sm:py-3 align-top max-w-[12rem] truncate"
                          title={item.categoryName}
                        >
                          {item.categoryName || "—"}
                        </td>
                        <td className="px-2 sm:px-3 py-2 sm:py-3 align-top min-w-0">
                          <span
                            className={`inline-flex max-w-full min-w-0 items-center rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-medium ring-1 ${badgeClassForStatus(
                              item.statusId
                            )}`}
                          >
                            <span className="truncate">
                              {item.statusName || "—"}
                            </span>
                          </span>
                        </td>
                        <td
                          className="px-2 sm:px-3 py-2 sm:py-3 align-top max-w-[18rem] truncate text-slate-700"
                          title={item.processing_detail || ""}
                        >
                          {item.processing_detail || (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td
                          className="px-2 sm:px-3 py-2 sm:py-3 align-top max-w-[22rem] truncate"
                          title={item.content}
                        >
                          {item.content}
                        </td>
                        <td className="px-2 sm:px-3 py-2 sm:py-3 align-top whitespace-nowrap text-slate-600 font-mono text-[11px] sm:text-sm">
                          {format(new Date(item.created_at), "dd/MM/yyyy HH:mm")}
                        </td>
                        <td
                          className="px-2 sm:px-3 py-2 sm:py-3 align-top max-w-[10rem] truncate"
                          title={item.sender_name || "Ẩn danh"}
                        >
                          {item.sender_name || "Ẩn danh"}
                        </td>
                        <td className="px-2 sm:px-3 py-2 sm:py-3 align-top max-w-[12rem] truncate hidden md:table-cell">
                          {item.sender_department || "-"}
                        </td>
                        <td className="px-2 sm:px-3 py-2 sm:py-3 align-top font-mono text-[11px] whitespace-nowrap hidden lg:table-cell">
                          {item.sender_phone || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-600">
                <span>
                  Hiển thị {(page - 1) * pageSize + 1}–
                  {Math.min(page * pageSize, total)} / {total}
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => goPage(1)}
                    disabled={page <= 1}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-xs disabled:opacity-40"
                  >
                    « Đầu
                  </button>
                  <button
                    type="button"
                    onClick={() => goPage(page - 1)}
                    disabled={page <= 1}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-xs disabled:opacity-40"
                  >
                    ‹ Trước
                  </button>
                  <span className="px-2 font-medium text-slate-800">
                    {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => goPage(page + 1)}
                    disabled={page >= totalPages}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-xs disabled:opacity-40"
                  >
                    Sau ›
                  </button>
                  <button
                    type="button"
                    onClick={() => goPage(totalPages)}
                    disabled={page >= totalPages}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-xs disabled:opacity-40"
                  >
                    Cuối »
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {selectedItem && (
        <ImageDetailModal
          selectedItem={selectedItem}
          closeModal={() => setSelectedItem(null)}
          statuses={statuses}
          onAdminSave={handleAdminSave}
        />
      )}
    </div>
  );
}

export default SuggestionList;
