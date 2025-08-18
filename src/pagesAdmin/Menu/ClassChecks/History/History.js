import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BASE_URL } from '~/config';
import { FaTrash } from 'react-icons/fa';
import * as XLSX from 'xlsx-js-style';
import { format } from 'date-fns';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import http from '~/api/http';

function History() {
  const [selectedDate, setSelectedDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [historyData, setHistoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [departments, setDepartments] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');

  // Ảnh (lightbox)
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedItemImages, setSelectedItemImages] = useState([]);

  const handleOpenImageModal = (index, images) => {
    setSelectedImageIndex(index);
    setSelectedItemImages(images);
    setImageModalOpen(true);
  };
  const handleCloseImageModal = () => {
    setSelectedImageIndex(null);
    setImageModalOpen(false);
    setSelectedItemImages([]);
  };
  const handlePrevImage = () => {
    if (selectedImageIndex !== null && selectedItemImages.length > 0) {
      setSelectedImageIndex(
        (prev) => (prev - 1 + selectedItemImages.length) % selectedItemImages.length,
      );
    }
  };
  const handleNextImage = () => {
    if (selectedImageIndex !== null && selectedItemImages.length > 0) {
      setSelectedImageIndex((prev) => (prev + 1) % selectedItemImages.length);
    }
  };

  // ---- Export Excel (kèm ảnh) ----
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('LichSuPhanLoai');

    worksheet.mergeCells('A1:J1');
    worksheet.getCell('A1').value = `Kiểm tra phân loại ngày ${format(
      new Date(selectedDate),
      'dd/MM/yyyy',
    )}`;
    worksheet.getCell('A1').alignment = { horizontal: 'center' };
    worksheet.getCell('A1').font = { size: 14, bold: true };

    worksheet
      .addRow([
        'STT',
        'Bộ phận',
        'Đơn vị',
        'Thời gian',
        'Loại rác',
        'SL Thực tế',
        'Phân loại đúng',
        'Ghi chú',
        'Người kiểm tra',
        'Hình ảnh',
      ])
      .eachCell((cell) => {
        cell.font = { bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFACD' } };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
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
        row.getCell(7).value = detail.isCorrectlyClassified ? '✅' : '❌';
        row.getCell(8).value = i === 0 ? item.feedbackNote || '' : '';
        row.getCell(9).value = i === 0 ? item.userName || '' : '';
        row.getCell(10).value = i === 0 ? '' : '';

        // chèn ảnh ở dòng đầu của nhóm
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
              editAs: 'oneCell',
            });

            offsetX += 1;
          }
        }

        row.eachCell((cell) => {
          cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });

        currentRowIndex++;
      }

      // merge theo nhóm (STT, Bộ phận, Đơn vị, Thời gian, Ghi chú, Người kiểm tra, Hình ảnh)
      const start = currentRowIndex - groupSize;
      const end = currentRowIndex - 1;
      [1, 2, 3, 4, 8, 9, 10].forEach((col) => {
        worksheet.mergeCells(start, col, end, col);
      });
    }

    worksheet.columns.forEach((col) => {
      col.width = 20;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, `LichSuPhanLoai_${selectedDate}.xlsx`);
  };

  const downloadImage = async (url) => {
    const response = await http.get(url, { responseType: 'arraybuffer' });
    return response.data;
  };

  // ---- Fetch ----
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await http.get(`${BASE_URL}/classification-history`, {
        params: {
          date: selectedDate,
          departmentId: selectedDepartmentId || undefined,
        },
      });
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
        const res = await http.get(`${BASE_URL}/departments`);
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
      await http.delete(`${BASE_URL}/classification-history/${deletingId}`);
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
      <div className="p-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm ring-1 ring-slate-200 space-y-5">
        <h1 className="text-xl font-semibold tracking-[-0.01em] text-slate-800">
          🗂️ Lịch sử kiểm tra phân loại
        </h1>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-800
                         focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500
                         shadow-sm"
            />

            <select
              value={selectedDepartmentId}
              onChange={(e) => setSelectedDepartmentId(e.target.value)}
              className="h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-800
                         focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500
                         shadow-sm min-w-[220px]"
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
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg
                       bg-emerald-600 text-white text-sm font-medium
                       shadow-sm ring-1 ring-emerald-600/20
                       hover:bg-emerald-700 hover:shadow
                       active:bg-emerald-800
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60"
          >
            📥 Xuất biểu mẫu
          </button>
        </div>

        {isLoading ? (
          <p className="text-slate-500 mt-4 italic">Đang tải dữ liệu...</p>
        ) : historyData.length === 0 ? (
          <p className="text-slate-600 mt-4">Không có dữ liệu cho ngày này.</p>
        ) : (
          <div className="mt-4 overflow-auto rounded-xl ring-1 ring-slate-200">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50/95 backdrop-blur text-[13px] text-slate-700">
                  <th className="px-3 py-2 border border-slate-200 first:rounded-tl-xl font-semibold">
                    STT
                  </th>
                  <th className="px-3 py-2 border border-slate-200 font-semibold">Bộ phận</th>
                  <th className="px-3 py-2 border border-slate-200 font-semibold">Đơn vị</th>
                  <th className="px-3 py-2 border border-slate-200 font-semibold">Thời gian</th>
                  <th className="px-3 py-2 border border-slate-200 font-semibold">Loại rác</th>
                  <th className="px-3 py-2 border border-slate-200 font-semibold">
                    Số lượng quy định
                  </th>
                  <th className="px-3 py-2 border border-slate-200 font-semibold">Số lượng</th>
                  <th className="px-3 py-2 border border-slate-200 font-semibold">
                    Phân loại đúng
                  </th>
                  <th className="px-3 py-2 border border-slate-200 font-semibold">Ghi chú</th>
                  <th className="px-3 py-2 border border-slate-200 font-semibold">Người kiểm tra</th>
                  <th className="px-3 py-2 border border-slate-200 last:rounded-tr-xl font-semibold">
                    Hành động
                  </th>
                </tr>
              </thead>

              <tbody>
                {historyData.map((item, idx) => (
                  <React.Fragment key={idx}>
                    {item.details.map((detail, i) => (
                      <tr
                        key={`${idx}-${i}`}
                        className={
                          idx % 2 === 0
                            ? 'bg-white hover:bg-slate-50'
                            : 'bg-slate-50 hover:bg-slate-100/70'
                        }
                      >
                        {i === 0 && (
                          <>
                            <td
                              rowSpan={
                                (item.details.length || 0) +
                                (item.images?.length > 0 ? 1 : 0)
                              }
                              className="px-3 py-2 border border-slate-200 text-center font-medium align-middle"
                            >
                              {idx + 1}
                            </td>
                            <td className="px-3 py-2 border border-slate-200 align-middle" rowSpan={item.details.length}>
                              {item.departmentName}
                            </td>
                            <td className="px-3 py-2 border border-slate-200 align-middle" rowSpan={item.details.length}>
                              {item.unitName}
                            </td>
                            <td
                              className="px-3 py-2 border border-slate-200 align-middle whitespace-nowrap"
                              rowSpan={item.details.length}
                            >
                              {formatDateTime(item.checkTime)}
                            </td>
                          </>
                        )}

                        <td className="px-3 py-2 border border-slate-200">{detail.trashName}</td>
                        <td className="px-3 py-2 border border-slate-200 text-center">
                          {detail.ruleQuantity}
                        </td>
                        <td className="px-3 py-2 border border-slate-200 text-center">
                          {detail.quantity}
                        </td>

                        <td className="px-3 py-2 border border-slate-200 text-center">
                          {detail.isCorrectlyClassified ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                                         bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                            >
                              ✅ Đúng
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                                         bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                            >
                              ❌ Sai
                            </span>
                          )}
                        </td>

                        {i === 0 && (
                          <>
                            <td className="px-3 py-2 border border-slate-200 align-middle" rowSpan={item.details.length}>
                              {item.feedbackNote || '—'}
                            </td>
                            <td className="px-3 py-2 border border-slate-200 align-middle" rowSpan={item.details.length}>
                              {item.userName || '—'}
                            </td>
                            <td
                              className="px-3 py-2 border border-slate-200 text-center align-middle"
                              rowSpan={item.details.length}
                            >
                              <button
                                onClick={() => handleDeleteClick(item.checkID)}
                                title="Xoá"
                                className="inline-flex items-center justify-center size-8 rounded-md
                                           text-rose-600 hover:text-rose-700
                                           hover:bg-rose-50 ring-1 ring-transparent hover:ring-rose-200
                                           transition-colors"
                              >
                                <FaTrash className="text-[14px]" />
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}

                    {/* Hàng ảnh */}
                    {item.images?.length > 0 && (
                      <tr>
                        <td className="px-3 py-2 border border-slate-200 text-center font-medium bg-slate-100">
                          Ảnh
                        </td>
                        <td className="px-3 py-3 border border-slate-200 bg-slate-50" colSpan={10}>
                          <div className="flex flex-wrap gap-3">
                            {item.images.map((url, index) => (
                              <img
                                key={index}
                                src={url}
                                alt={`Ảnh ${index + 1}`}
                                className="w-24 h-24 object-cover rounded-lg shadow-sm ring-1 ring-slate-200
                                           hover:shadow hover:ring-slate-300 transition-transform duration-200
                                           hover:scale-[1.03] cursor-pointer"
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

      {/* Lightbox ảnh */}
      {imageModalOpen && selectedItemImages.length > 0 && (
        <div className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-5xl">
            <img
              src={selectedItemImages[selectedImageIndex]}
              alt="Ảnh lớn"
              className="w-full max-h-[80vh] object-contain rounded-xl shadow-lg ring-1 ring-slate-300 bg-white"
            />

            <button
              onClick={handleCloseImageModal}
              className="absolute -top-3 -right-3 inline-flex items-center justify-center
                         size-9 rounded-full bg-white/90 text-slate-700
                         shadow ring-1 ring-slate-300 hover:bg-white"
              aria-label="Đóng"
            >
              ✕
            </button>

            <div className="absolute inset-0 flex items-center justify-between px-2">
              <button
                onClick={handlePrevImage}
                className="inline-flex items-center justify-center size-10 rounded-full
                           bg-white/90 text-slate-700 shadow ring-1 ring-slate-300 hover:bg-white"
                aria-label="Ảnh trước"
              >
                ‹
              </button>
              <button
                onClick={handleNextImage}
                className="inline-flex items-center justify-center size-10 rounded-full
                           bg-white/90 text-slate-700 shadow ring-1 ring-slate-300 hover:bg-white"
                aria-label="Ảnh sau"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận xoá */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl ring-1 ring-slate-200 w-80 p-6 text-center space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">Xác nhận xoá</h2>
            <p className="text-slate-600">Bạn có chắc chắn muốn xoá bản ghi này không?</p>
            <div className="flex justify-center gap-3 mt-2">
              <button
                onClick={() => {
                  setDeletingId(null);
                  setShowConfirmModal(false);
                }}
                className="px-4 h-10 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800"
                disabled={deleting}
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 h-10 rounded-lg bg-rose-600 text-white hover:bg-rose-700"
                disabled={deleting}
              >
                {deleting ? 'Đang xóa...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal lỗi */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl ring-1 ring-slate-200 w-80 p-6 text-center space-y-4">
            <h2 className="text-lg font-semibold text-rose-600">Lỗi</h2>
            <p className="text-slate-600">Không thể xoá bản ghi. Vui lòng thử lại.</p>
            <button
              onClick={() => setShowErrorModal(false)}
              className="mt-2 px-4 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
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
