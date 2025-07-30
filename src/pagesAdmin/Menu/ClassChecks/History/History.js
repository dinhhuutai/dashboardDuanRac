import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BASE_URL } from '~/config';
import { FaTrash } from 'react-icons/fa';
import * as XLSX from "xlsx-js-style";
import { format } from "date-fns";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';


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

    // State quản lý ảnh
const [selectedImageIndex, setSelectedImageIndex] = useState(null);
const [imageModalOpen, setImageModalOpen] = useState(false);
const [selectedItemImages, setSelectedItemImages] = useState([]); // Lưu danh sách ảnh đang xem

// Mở modal ảnh
const handleOpenImageModal = (index, images) => {
  setSelectedImageIndex(index);
  setSelectedItemImages(images); // Gán danh sách ảnh tương ứng
  setImageModalOpen(true);
};

// Đóng modal ảnh
const handleCloseImageModal = () => {
  setSelectedImageIndex(null);
  setImageModalOpen(false);
  setSelectedItemImages([]);
};

// Chuyển ảnh trước
const handlePrevImage = () => {
  if (selectedImageIndex !== null && selectedItemImages.length > 0) {
    setSelectedImageIndex(
      (prevIndex) => (prevIndex - 1 + selectedItemImages.length) % selectedItemImages.length
    );
  }
};

// Chuyển ảnh sau
const handleNextImage = () => {
  if (selectedImageIndex !== null && selectedItemImages.length > 0) {
    setSelectedImageIndex((prevIndex) => (prevIndex + 1) % selectedItemImages.length);
  }
};


    const exportToExcel = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('LichSuPhanLoai');

  worksheet.mergeCells('A1:J1');
  worksheet.getCell('A1').value = `Kiểm tra phân loại ngày ${format(new Date(selectedDate), "dd/MM/yyyy")}`;
  worksheet.getCell('A1').alignment = { horizontal: 'center' };
  worksheet.getCell('A1').font = { size: 14, bold: true };

  worksheet.addRow([
    "STT", "Bộ phận", "Đơn vị", "Thời gian",
    "Loại rác", "SL Thực tế", "Phân loại đúng",
    "Ghi chú", "Người kiểm tra", "Hình ảnh"
  ]).eachCell(cell => {
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFACD' } };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  let currentRowIndex = 3;

  for (let idx = 0; idx < historyData.length; idx++) {
    const item = historyData[idx];
    const groupSize = item.details.length;

    for (let i = 0; i < groupSize; i++) {
      const detail = item.details[i];
      const row = worksheet.getRow(currentRowIndex);
      row.height = 55;

      row.getCell(1).value = i === 0 ? idx + 1 : '';
      row.getCell(2).value = i === 0 ? item.departmentName : '';
      row.getCell(3).value = i === 0 ? item.unitName : '';
      row.getCell(4).value = i === 0 ? formatDateTime(item.checkTime) : '';
      row.getCell(5).value = detail.trashName;
      row.getCell(6).value = detail.quantity;
      row.getCell(7).value = detail.isCorrectlyClassified ? "✅" : "❌";
      row.getCell(8).value = i === 0 ? item.feedbackNote || "" : '';
      row.getCell(9).value = i === 0 ? item.userName || "" : '';
      row.getCell(10).value = i === 0 ? "" || "" : '';

      // 👉 Chèn ảnh nếu là dòng đầu tiên
      if (i === 0 && item.images?.length > 0) {
        const images = item.images;
        let offsetX = 0;
        for (let imgIdx = 0; imgIdx < images.length; imgIdx++) {
          const imageBuffer = await downloadImage(images[imgIdx]);
          const imageId = workbook.addImage({
            buffer: imageBuffer,
            extension: 'jpeg',
          });

          worksheet.addImage(imageId, {
            tl: { col: 9 + offsetX, row: currentRowIndex - 1 },
            ext: { width: 100, height: 100 },
            editAs: 'oneCell'
          });

          offsetX += 1;
        }
      }

      row.eachCell(cell => {
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      currentRowIndex++;
    }

    // 👉 Merge các ô theo chiều dọc cho các cột: STT, Bộ phận, Đơn vị, Thời gian, Ghi chú, Người kiểm tra
    const start = currentRowIndex - groupSize;
    const end = currentRowIndex - 1;
    [1, 2, 3, 4, 8, 9, 10].forEach(col => {
      worksheet.mergeCells(start, col, end, col);
    });
  }

  worksheet.columns.forEach(col => {
    col.width = 20;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  saveAs(blob, `LichSuPhanLoai_${selectedDate}.xlsx`);
};

// 👉 Hàm tải ảnh từ URL thành buffer
const downloadImage = async (url) => {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return response.data;
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
  {historyData.map((item, idx) => (
    <React.Fragment key={idx}>
      {item.details.map((detail, i) => (
        <tr
          key={`${idx}-${i}`}
          className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}
        >
          {i === 0 && (
            <>
              <td rowSpan={(item.details.length || 0) + (item.images?.length > 0 ? 1 : 0)} className="px-3 py-2 border border-gray-200 text-center font-medium align-middle">
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
      ))}

      {/* Dòng hiển thị hình ảnh - STT bên trái, hình ảnh bên phải */}
      {item.images?.length > 0 && (
  <tr>
    <td colSpan={1} className="px-3 py-2 border border-gray-200 text-center font-medium bg-gray-100">
      Ảnh
    </td>
    <td colSpan={10} className="px-3 py-2 border border-gray-200 bg-gray-50">
      <div className="flex flex-wrap gap-3">
        {item.images.map((url, index) => (
          <img
            key={index}
            src={url}
            alt={`Ảnh ${index + 1}`}
            className="w-24 h-24 object-cover rounded shadow border cursor-pointer hover:scale-105 transition"
    onClick={() => handleOpenImageModal(index, item.images)}
          />
        ))}
      </div>
    </td>
  </tr>
)}

    </React.Fragment>
  ))}
</tbody>


            </table>
          </div>
        )}
      </div>

      {imageModalOpen && selectedItemImages.length > 0 && (
  <div className="fixed inset-0 z-[99999] bg-black bg-opacity-60 flex items-center justify-center">
    <div className="bg-white p-4 rounded shadow-lg max-w-[90%] max-h-[90%] w-full relative overflow-auto">
      <img
        src={selectedItemImages[selectedImageIndex]}
        alt="Ảnh lớn"
        className="w-[70%] h-auto mb-4 rounded"
      />
      <div className="flex justify-between">
        <button onClick={handlePrevImage} className="px-4 py-2 bg-gray-200 rounded">Trước</button>
        <button onClick={handleNextImage} className="px-4 py-2 bg-gray-200 rounded">Tiếp</button>
      </div>
      <button
        onClick={handleCloseImageModal}
        className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
      >
        ✕
      </button>
    </div>
  </div>
)}


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
