import React, { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import * as XLSX from "xlsx-js-style";
import { BASE_URL } from "~/config";
import { FaSpinner } from "react-icons/fa";
import ImageDetailModal from "~/components/ImageDetailModal";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

function SuggestionList() {
  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filterDate, setFilterDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [filterCategory, setFilterCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchSuggestions();
  }, [filterDate, filterCategory]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/suggestions/categories`);
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error("Error loading categories", err);
    }
  };

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/suggestions`, {
        params: {
          date: filterDate,
          categoryId: filterCategory,
        },
      });
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching suggestions", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = async (item) => {
    try {
      const res = await axios.get(`${BASE_URL}/api/suggestions/${item.suggestionId}/images`);
      setSelectedItem({ ...item, images: res.data.data || [] });
    } catch (err) {
      console.error("Failed to fetch images", err);
      setSelectedItem({ ...item, images: [] });
    }
  };

  const closeModal = () => setSelectedItem(null);

  // ---------------------- EXPORT EXCEL ------------------------
//   const exportToExcel = async () => {
//   const headerStyle = {
//     font: { bold: true, color: { rgb: "FFFFFF" } },
//     fill: { fgColor: { rgb: "4F81BD" } },
//     border: {
//       top: { style: "thin", color: { rgb: "000000" } },
//       bottom: { style: "thin", color: { rgb: "000000" } },
//       left: { style: "thin", color: { rgb: "000000" } },
//       right: { style: "thin", color: { rgb: "000000" } },
//     },
//     alignment: { horizontal: "center", vertical: "center", wrapText: true },
//   };

//   const getRowStyle = (index) => ({
//     fill: {
//       fgColor: { rgb: index % 2 === 0 ? "FFFFFF" : "F2F2F2" },
//     },
//     border: {
//       top: { style: "thin", color: { rgb: "AAAAAA" } },
//       bottom: { style: "thin", color: { rgb: "AAAAAA" } },
//       left: { style: "thin", color: { rgb: "AAAAAA" } },
//       right: { style: "thin", color: { rgb: "AAAAAA" } },
//     },
//     alignment: { horizontal: "left", vertical: "center", wrapText: true },
//   });

//   // Gọi API lấy ảnh cho tất cả item
//   const dataWithImages = await Promise.all(
//     data.map(async (item) => {
//       try {
//         const res = await axios.get(`${BASE_URL}/api/suggestions/${item.suggestionId}/images`);
//         return { ...item, images: res.data.data || [] };
//       } catch (error) {
//         return { ...item, images: [] };
//       }
//     })
//   );

//   const worksheetData = [
//     [
//       {
//         v: `Góp ý của CNV ngày  ${format(new Date(filterDate), "dd/MM/yyyy")}`,
//         s: {
//           font: { bold: true, sz: 14 },
//           alignment: { horizontal: "center", vertical: "center" },
//         },
//       },
//     ],
//     [
//       { v: "STT", s: headerStyle },
//       { v: "Danh mục", s: headerStyle },
//       { v: "Nội dung", s: headerStyle },
//       { v: "Ngày gửi", s: headerStyle },
//       { v: "Người gửi", s: headerStyle },
//       { v: "Bộ phận", s: headerStyle },
//       { v: "SĐT", s: headerStyle },
//       { v: "Link ảnh", s: headerStyle },
//     ],
//     ...dataWithImages.map((item, idx) => {
//       const allImageLinks = (item.images || [])
//   .map(img => img.image_url)
//   .join("\n");
//  // chỉ lấy ảnh đầu
//       const rowStyle = getRowStyle(idx);
//       return [
//         { v: idx + 1, s: rowStyle },
//         { v: item.categoryName, s: rowStyle },
//         { v: item.content, s: rowStyle },
//         { v: formatDateTime(item.created_at), s: rowStyle },
//         { v: item.sender_name || "Ẩn danh", s: rowStyle },
//         { v: item.sender_department || "-", s: rowStyle },
//         { v: item.sender_phone || "-", s: rowStyle },
//         {
//           v: allImageLinks,
//           s: { ...rowStyle, font: { color: { rgb: "0563C1" }, underline: true } },
//           l: allImageLinks ? { Target: allImageLinks, Tooltip: "Xem ảnh" } : undefined,
//         },
//       ];
//     }),
//   ];

//   const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

//   worksheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }];
//   worksheet["!rows"] = [{ hpt: 24 }];
//   worksheet["!cols"] = [
//     { wch: 5 },   // STT
//     { wch: 20 },  // Danh mục
//     { wch: 50 },  // Nội dung
//     { wch: 18 },  // Ngày gửi
//     { wch: 20 },  // Người gửi
//     { wch: 20 },  // Bộ phận
//     { wch: 18 },  // SĐT
//     { wch: 30 },  // Link ảnh
//   ];

//   const workbook = XLSX.utils.book_new();
//   XLSX.utils.book_append_sheet(workbook, worksheet, "Gop y CNV");
//   XLSX.writeFile(workbook, `Gop_y_CNV_${filterDate}.xlsx`);
// };

const exportToExcel = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Góp ý CNV");

  // 👉 Thêm dòng tiêu đề chính (row 0)
  worksheet.mergeCells("A1:I1"); // Gộp từ A đến I
  const titleCell = worksheet.getCell("A1");
  titleCell.value = `Góp ý của CNV ngày ${format(new Date(filterDate), "dd-MM-yyyy")}`;
  titleCell.font = { size: 16, bold: true, color: { argb: "FF333333" } };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  worksheet.getRow(1).height = 30;

  // 👉 Header ở row 2
  const header = [
    "STT",
    "Danh mục",
    "Nội dung",
    "Ngày gửi",
    "Người gửi",
    "Bộ phận",
    "SĐT",
    "Ảnh",
    "Link ảnh"
  ];
  worksheet.addRow(header);

  // 👉 Style cho header (row 2)
  const headerRow = worksheet.getRow(2);
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF007ACC" },
    };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" }
    };
  });

  // 👉 Đặt độ rộng cột
  const columnWidths = [6, 20, 50, 18, 20, 20, 15, 15, 40];
  worksheet.columns.forEach((col, i) => {
    col.width = columnWidths[i];
  });

  // 👉 Lấy data kèm ảnh
  const fullData = await Promise.all(
    data.map(async (item) => {
      try {
        const res = await axios.get(`${BASE_URL}/api/suggestions/${item.suggestionId}/images`);
        return { ...item, images: res.data.data || [] };
      } catch (e) {
        return { ...item, images: [] };
      }
    })
  );

  // 👉 Ghi dữ liệu từ row 3 trở đi
  for (let i = 0; i < fullData.length; i++) {
    const item = fullData[i];
    const rowIndex = i + 3; // row 1 = tiêu đề, row 2 = header

    const firstImageUrl = item.images?.[0]?.image_url || "";

    // Thêm dòng mới
    const row = worksheet.addRow([
      i + 1,
      item.categoryName,
      item.content,
      formatDateTime(item.created_at),
      item.sender_name || "Ẩn danh",
      item.sender_department || "-",
      item.sender_phone || "-",
      "", // Placeholder ảnh
      firstImageUrl,
    ]);

    row.height = 90;
    row.alignment = { vertical: "middle" };

    row.eachCell((cell) => {
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
      };

      if (i % 2 !== 0) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF3F3F3" }, // Màu xám nhạt
        };
      }
    });

    // 👉 Nếu có ảnh, chèn vào ô H
    if (firstImageUrl) {
      try {
        const res = await fetch(firstImageUrl);
        const blob = await res.blob();
        const buffer = await blob.arrayBuffer();

        const imageId = workbook.addImage({
          buffer,
          extension: "jpeg",
        });

        worksheet.addImage(imageId, {
          tl: { col: 7, row: rowIndex - 1 }, // H là col 7 (index bắt đầu từ 0)
          ext: { width: 90, height: 90 },
        });
      } catch (err) {
        console.warn("Không thể tải ảnh:", err);
      }
    }
  }

  // 👉 Ghi file
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
    <div className="p-4">
      <div className="p-6 space-y-6 bg-white rounded-xl">
        <div className="border-b pb-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">📬 Danh sách góp ý của CNV</h1>
          <button
            onClick={exportToExcel}
            className="bg-green-600 hover:bg-green-700 text-[14px] text-white px-2 py-1 rounded shadow"
          >
            📥 Xuất Excel
          </button>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Ngày gửi</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="border border-gray-300 px-4 py-2 rounded-md"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Danh mục</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-gray-300 px-4 py-2 rounded-md"
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

        {loading ? (
          <div className="flex justify-center items-center py-16 text-blue-600 text-lg gap-2">
            <FaSpinner className="animate-spin text-2xl" />
            <span>Đang tải dữ liệu...</span>
          </div>
        ) : data.length === 0 ? (
          <p className="text-center text-gray-500 italic py-10">Không có góp ý nào phù hợp.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-blue-50 text-gray-700 text-sm">
                  <th className="p-3 border">#</th>
                  <th className="p-3 border">Danh mục</th>
                  <th className="p-3 border">Nội dung</th>
                  <th className="p-3 border">Ngày gửi</th>
                  <th className="p-3 border">Người gửi</th>
                  <th className="p-3 border">Bộ phận</th>
                  <th className="p-3 border">SĐT</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, idx) => (
                  <tr
                    key={item.suggestionId}
                    onClick={() => handleRowClick(item)}
                    className={`cursor-pointer ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-100 transition`}
                  >
                    <td className="p-3 border text-center">{idx + 1}</td>
                    <td className="p-3 border">{item.categoryName}</td>
                    <td className="p-3 border max-w-[300px] truncate" title={item.content}>
                      {item.content}
                    </td>
                    <td className="p-3 border text-gray-600">
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
                    <td className="p-3 border">{item.sender_name || "Ẩn danh"}</td>
                    <td className="p-3 border">{item.sender_department || "-"}</td>
                    <td className="p-3 border">{item.sender_phone || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedItem && (
        <ImageDetailModal selectedItem={selectedItem} closeModal={closeModal} />
      )}
    </div>
  );
}

export default SuggestionList;
