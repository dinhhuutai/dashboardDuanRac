import React, { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { BASE_URL } from "~/config";
import { FaSpinner } from "react-icons/fa";
import { FiDownload } from "react-icons/fi";
import ImageDetailModal from "~/components/ImageDetailModal";
import http from '~/api/http';

function SuggestionList() {
  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filterDate, setFilterDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [filterCategory, setFilterCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { fetchSuggestions(); }, [filterDate, filterCategory]);

  const fetchCategories = async () => {
    try {
      const res = await http.get(`${BASE_URL}/api/suggestions/categories`);
      if (res.data.success) setCategories(res.data.data);
    } catch (err) {
      console.error("Error loading categories", err);
    }
  };

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const res = await http.get(`${BASE_URL}/api/suggestions`, {
        params: { date: filterDate, categoryId: filterCategory },
      });
      if (res.data.success) setData(res.data.data);
    } catch (err) {
      console.error("Error fetching suggestions", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = async (item) => {
    try {
      const res = await http.get(`${BASE_URL}/api/suggestions/${item.suggestionId}/images`);
      setSelectedItem({ ...item, images: res.data.data || [] });
    } catch (err) {
      console.error("Failed to fetch images", err);
      setSelectedItem({ ...item, images: [] });
    }
  };

  const closeModal = () => setSelectedItem(null);

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Góp ý CNV");

    // Title
    worksheet.mergeCells("A1:I1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = `Góp ý của CNV ngày ${format(new Date(filterDate), "dd-MM-yyyy")}`;
    titleCell.font = { size: 16, bold: true, color: { argb: "FF333333" } };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };
    worksheet.getRow(1).height = 30;

    // Header
    const header = ["STT","Danh mục","Nội dung","Ngày gửi","Người gửi","Bộ phận","SĐT","Ảnh","Link ảnh"];
    worksheet.addRow(header);
    const headerRow = worksheet.getRow(2);
    headerRow.height = 30;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.border = { top:{style:"thin"}, left:{style:"thin"}, bottom:{style:"thin"}, right:{style:"thin"} };
    });

    // Col widths
    const columnWidths = [6, 20, 50, 18, 20, 20, 15, 15, 40];
    worksheet.columns.forEach((col, i) => { col.width = columnWidths[i]; });

    // Fetch images per row
    const fullData = await Promise.all(
      data.map(async (item) => {
        try {
          const res = await http.get(`${BASE_URL}/api/suggestions/${item.suggestionId}/images`);
          return { ...item, images: res.data.data || [] };
        } catch {
          return { ...item, images: [] };
        }
      })
    );

    // Rows
    for (let i = 0; i < fullData.length; i++) {
      const item = fullData[i];
      const rowIndex = i + 3;
      const firstImageUrl = item.images?.[0]?.image_url || "";

      const row = worksheet.addRow([
        i + 1,
        item.categoryName,
        item.content,
        formatDateTime(item.created_at),
        item.sender_name || "Ẩn danh",
        item.sender_department || "-",
        item.sender_phone || "-",
        "", // image placeholder
        firstImageUrl,
      ]);
      row.height = 90;
      row.eachCell((cell) => {
        cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
        cell.border = { top:{style:"thin"}, left:{style:"thin"}, bottom:{style:"thin"}, right:{style:"thin"} };
        if (i % 2) cell.fill = { type:"pattern", pattern:"solid", fgColor:{ argb:"FFF6F7FB" } };
      });

      if (firstImageUrl) {
        try {
          const res = await http.get(firstImageUrl, { responseType: "arraybuffer" });
          const imageId = workbook.addImage({ buffer: res.data, extension: "jpeg" });
          worksheet.addImage(imageId, { tl: { col: 7, row: rowIndex - 1 }, ext: { width: 90, height: 90 } });
        } catch (e) {
          console.warn("Không thể tải ảnh:", e);
        }
      }
    }

    const buf = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buf]), `Gop_y_CNV_${filterDate}.xlsx`);
  };

  const formatDateTime = (datetimeStr) => {
    const [date, time] = datetimeStr.split('T');
    const [year, month, day] = date.split('-');
    const [hour, minute] = time.split(':');
    return `${day}-${month}-${year} ${hour}:${minute}`;
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-[1300px] space-y-5">
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 overflow-hidden">
          {/* Header */}
          <div className="flex flex-col gap-4 border-b border-slate-200/60 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-800">
                📬 Danh sách góp ý của CNV
              </h1>
              <button
                onClick={exportToExcel}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              >
                <FiDownload className="text-base" />
                Xuất Excel
              </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="flex flex-col">
                <label className="text-xs font-medium text-slate-600 mb-1">Ngày gửi</label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-medium text-slate-600 mb-1">Danh mục</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                >
                  <option value="">Tất cả danh mục</option>
                  {categories.map((cat) => (
                    <option key={cat.suggestionCategorieId} value={cat.suggestionCategorieId}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-0 sm:p-5">
            <div className="relative overflow-hidden rounded-xl border border-slate-200">
              {/* Loading overlay */}
              {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
                  <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow">
                    <FaSpinner className="animate-spin text-indigo-600 text-xl" />
                    <span className="text-sm text-slate-700">Đang tải dữ liệu...</span>
                  </div>
                </div>
              )}

              {/* Table */}
              {data.length === 0 ? (
                <div className="p-10 text-center text-slate-500">
                  Không có góp ý nào phù hợp.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-[900px] w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-slate-50">
                      <tr className="text-[12px] uppercase tracking-wide text-slate-600">
                        {["#","Danh mục","Nội dung","Ngày gửi","Người gửi","Bộ phận","SĐT"].map((h, i) => (
                          <th key={i} className="border-b border-slate-200 px-3 py-2 text-left">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((item, idx) => (
                        <tr
                          key={item.suggestionId}
                          onClick={() => handleRowClick(item)}
                          className={`cursor-pointer transition-colors ${
                            idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                          } hover:bg-indigo-50`}
                        >
                          <td className="px-3 py-2 align-top">{idx + 1}</td>
                          <td className="px-3 py-2 align-top">
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-[2px] text-[12px] font-medium text-slate-700 ring-1 ring-slate-200">
                              {item.categoryName}
                            </span>
                          </td>
                          <td className="px-3 py-2 align-top max-w-[460px]">
                            <span className="block truncate" title={item.content}>{item.content}</span>
                          </td>
                          <td className="px-3 py-2 align-top text-slate-600 font-mono">
                            {(() => {
                              const d = new Date(item.created_at);
                              const year = d.getUTCFullYear();
                              const month = String(d.getUTCMonth() + 1).padStart(2, "0");
                              const day = String(d.getUTCDate()).padStart(2, "0");
                              const hour = String(d.getUTCHours()).padStart(2, "0");
                              const minute = String(d.getUTCMinutes()).padStart(2, "0");
                              return `${day}/${month}/${year} ${hour}:${minute}`;
                            })()}
                          </td>
                          <td className="px-3 py-2 align-top">{item.sender_name || "Ẩn danh"}</td>
                          <td className="px-3 py-2 align-top">{item.sender_department || "-"}</td>
                          <td className="px-3 py-2 align-top font-mono">{item.sender_phone || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedItem && (
        <ImageDetailModal selectedItem={selectedItem} closeModal={closeModal} />
      )}
    </div>
  );
}

export default SuggestionList;
