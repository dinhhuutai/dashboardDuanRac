import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BASE_URL } from '~/config';
import { FaTrash } from 'react-icons/fa';
import * as XLSX from "xlsx-js-style";
import { format } from "date-fns";


function History() {
    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [historyData, setHistoryData] = useState([]);

    const [isLoading, setIsLoading] = useState(false);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const [departments, setDepartments] = useState([]);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState('');

    const exportToExcel = () => {
  const aoaData = [];

  // 👉 Thêm tiêu đề
  aoaData.push([`Kiểm tra phân loại ngày ${format(new Date(selectedDate), "dd/MM/yyyy")}`]);

  // 👉 Thêm header
  aoaData.push([
    "STT", "Bộ phận", "Đơn vị", "Thời gian",
    "Loại rác", "SL Thực tế", "Phân loại đúng",
    "Ghi chú", "Người kiểm tra"
  ]);

  const merges = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } } // merge dòng tiêu đề (9 cột)
  ];

  let rowIndex = 2;

  historyData.forEach((item, idx) => {
    const groupSize = item.details.length;
    item.details.forEach((detail, i) => {
      aoaData.push([
        i === 0 ? idx + 1 : "",
        i === 0 ? item.departmentName : "",
        i === 0 ? item.unitName : "",
        i === 0 ? formatDateTime(item.checkTime) : "",
        detail.trashName,
        detail.quantity,
        detail.isCorrectlyClassified ? "✅" : "❌",
        i === 0 ? item.feedbackNote || "" : "",
        i === 0 ? item.userName || "" : "",
      ]);
      rowIndex++;
    });

    const startRow = rowIndex - groupSize;
    const endRow = rowIndex - 1;
    const mergeCols = [0, 1, 2, 3, 7, 8];

    mergeCols.forEach(col => {
      merges.push({
        s: { r: startRow, c: col },
        e: { r: endRow, c: col }
      });
    });
  });

  const ws = XLSX.utils.aoa_to_sheet(aoaData);
  ws["!merges"] = merges;

  // 👉 Tự động chỉnh độ rộng cột
  ws["!cols"] = aoaData[1].map((_, colIdx) => {
    if (colIdx === 0) return { wch: 5 }; // STT nhỏ
    const maxLength = Math.max(...aoaData.map(row => String(row[colIdx] || "").length));
    return { wch: maxLength + 2 };
  });

  const range = XLSX.utils.decode_range(ws["!ref"]);

  // 👉 Áp dụng style cho từng ô
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });

      if (!ws[cellAddress]) continue;

      // Style chung cho tất cả các ô
      ws[cellAddress].s = {
        font: {
          bold: R === 0 || R === 1,
          sz: R === 0 ? 14 : 11,
          color: { rgb: "000000" },
        },
        alignment: {
          vertical: "center",
          horizontal: "center",
          wrapText: true,
        },
        fill: R === 1
          ? { fgColor: { rgb: "FFFACD" } } // header: vàng nhạt
          : R === 0
          ? { fgColor: { rgb: "FFFFFF" } } // tiêu đề: trắng
          : undefined,
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
      };
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "LichSuPhanLoai");

  XLSX.writeFile(wb, `LichSuPhanLoai_${selectedDate}.xlsx`);
};


    const fetchData = async () => {
        setIsLoading(true);
        try {
        const res = await axios.get(`${BASE_URL}/classification-history`, {
            params: {
                date: selectedDate,
                departmentId: selectedDepartmentId || undefined
            }
        });
        console.log(res.data.data);
        setHistoryData(res.data.data || []);
        } catch (err) {
        console.error('Lỗi lấy dữ liệu:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedDate, selectedDepartmentId]);

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const res = await axios.get(`${BASE_URL}/departments`);
                setDepartments(res.data);
            } catch (err) {
                console.error('Lỗi lấy danh sách bộ phận:', err);
            }
        };

        fetchDepartments();
    }, []);


    const formatDateTime = (datetimeStr) => {
        const [date, time] = datetimeStr.split('T');
        const [year, month, day] = date.split('-');
        const [hour, minute] = time.split(':');
        return `${day}-${month}-${year} ${hour}:${minute}`;
    };

    const handleDeleteClick = (id) => {
        setDeletingId(id);
        setShowConfirmModal(true);
    };


    const confirmDelete = async () => {
        setDeleting(true);
        try {
            await axios.delete(`${BASE_URL}/classification-history/${deletingId}`);
            fetchData();
        } catch (err) {
            console.error('Lỗi khi xoá:', err);
            setShowErrorModal(true);
        } finally {
            setShowConfirmModal(false);
            setDeletingId(null);
            setDeleting(false);
        }
    };



  return (
    <div className="p-4">
      <div className="p-4 bg-white rounded-xl shadow space-y-4">
        <h1 className="text-xl font-semibold">🗂️ Lịch sử kiểm tra phân loại</h1>

        <div className="flex flex-wrap items-center justify-between">
            <div className='flex gap-4'>
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="border px-3 py-2 rounded-md text-sm"
                />

                <select
                    value={selectedDepartmentId}
                    onChange={(e) => setSelectedDepartmentId(e.target.value)}
                    className="border px-3 py-2 rounded-md text-sm"
                >
                    <option value="">Tất cả bộ phận</option>
                    {departments.map((dept) => (
                    <option key={dept.departmentID} value={dept.departmentID}>
                        {dept.departmentName}
                    </option>
                    ))}
                </select>
            </div>

            <button
                onClick={exportToExcel}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
            >
                📥 Xuất biểu mẫu
            </button>

        </div>


        {isLoading ? (
            <p className="text-gray-500 mt-4 italic">Đang tải dữ liệu...</p>
        ) : historyData.length === 0 ? (
          <p className="text-gray-600 mt-4">Không có dữ liệu cho ngày này.</p>
        ) : (
          <div className="overflow-auto">
            <table className="w-full mt-4 text-sm border-separate border-spacing-0">
            <thead>
                <tr className="bg-gray-200 text-[13px]">
                    <th className="px-3 py-2 border border-gray-300 rounded-tl-lg">STT</th>
                    <th className="px-3 py-2 border border-gray-300">Bộ phận</th>
                    <th className="px-3 py-2 border border-gray-300">Đơn vị</th>
                    <th className="px-3 py-2 border border-gray-300">Thời gian</th>
                    <th className="px-3 py-2 border border-gray-300">Loại rác</th>
                    <th className="px-3 py-2 border border-gray-300">Số lượng quy định</th>
                    <th className="px-3 py-2 border border-gray-300">Số lượng</th>
                    <th className="px-3 py-2 border border-gray-300">Phân loại đúng</th>
                    <th className="px-3 py-2 border border-gray-300">Ghi chú</th>
                    <th className="px-3 py-2 border border-gray-300">Người kiểm tra</th>
                    <th className="px-3 py-2 border border-gray-300 rounded-tr-lg">Hành động</th>
                </tr>
            </thead>
            <tbody>
                {historyData.map((item, idx) =>
                item.details.map((detail, i) => (
                    <tr
                    key={`${idx}-${i}`}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}
                    >
                    {i === 0 && (
                        <>
                         <td rowSpan={item.details.length} className="px-3 py-2 border border-gray-200 text-center font-medium">
                            {idx + 1}
                        </td>
                        <td rowSpan={item.details.length} className="px-3 py-2 border border-gray-200 align-middle">
                            {item.departmentName}
                        </td>
                        <td rowSpan={item.details.length} className="px-3 py-2 border border-gray-200 align-middle">
                            {item.unitName}
                        </td>
                        <td rowSpan={item.details.length} className="px-3 py-2 border border-gray-200 align-middle whitespace-nowrap">
                            {formatDateTime(item.checkTime)}
                        </td>
                        </>
                    )}
                    <td className="px-3 py-2 border border-gray-200">{detail.trashName}</td>
                    <td className="px-3 py-2 border border-gray-200 text-center">{detail.ruleQuantity}</td>
                    <td className="px-3 py-2 border border-gray-200 text-center">{detail.quantity}</td>
                    <td className="px-3 py-2 border border-gray-200 text-center">
                        {detail.isCorrectlyClassified ? '✅' : '❌'}
                    </td>
                    {i === 0 && (
                        <>
                            <td rowSpan={item.details.length} className="px-3 py-2 border border-gray-200 align-middle">
                                {item.feedbackNote || '—'}
                            </td>
                            <td rowSpan={item.details.length} className="px-3 py-2 border border-gray-200 align-middle">
                                {item.userName || '—'}
                            </td>
                            <td
                                rowSpan={item.details.length}
                                className="px-3 py-2 border border-gray-200 text-center align-middle"
                            >
                                <button
                                onClick={() => handleDeleteClick(item.checkID)}
                                className="text-red-600 hover:text-red-800 text-base"
                                title="Xoá"
                                >
                                <FaTrash />
                                </button>

                            </td>
                        </>
                    )}
                    </tr>
                ))
                )}
            </tbody>
            </table>
          </div>
        )}
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-lg w-80 text-center space-y-4">
            <h2 className="text-lg font-semibold">Xác nhận xoá</h2>
            <p>Bạn có chắc chắn muốn xoá bản ghi này không?</p>
            <div className="flex justify-center gap-4 mt-4">
                <button
                  onClick={() => {
                    setDeletingId(null)
                    setShowConfirmModal(false);
                  }}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                  disabled={deleting}
                >
                  Hủy
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  disabled={deleting}
                >
                  {deleting ? 'Đang xóa...' : 'Xác nhận'}
                </button>
            </div>
            </div>
        </div>
        )}
        {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-lg w-80 text-center space-y-4">
            <h2 className="text-lg font-semibold text-red-600">Lỗi</h2>
            <p>Không thể xoá bản ghi. Vui lòng thử lại.</p>
            <button
                onClick={() => setShowErrorModal(false)}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
            >
                Đóng
            </button>
            </div>
        </div>
        )}

    </div>
  );
}

export default History;
