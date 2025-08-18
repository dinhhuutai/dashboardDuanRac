import React, { useState, useEffect } from 'react';
import { BASE_URL } from '~/config';
import http from '~/api/http';

function QRScanTracking() {
  const [groupedScannedList, setGroupedScannedList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [workDate, setWorkDate] = useState(new Date().toISOString().split('T')[0]);
  const [workShift, setWorkShift] = useState('ca1');
  const [longestUnscanned, setLongestUnscanned] = useState([]);

  const [filterStatus, setFilterStatus] = useState(""); // 'scanned' | 'unscanned' | ''
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterUnit, setFilterUnit] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await http.get(`/trash-weighings/tracking-scan`, {
          params: {
            workDate,
            workShift
          }
        });

        const json = await res.json();

        // Kết hợp trashBinCode + trashName
        const processedList = (json.groupedScannedList || []).map(item => {
          const binCodes = item.trashBinCodes || [];
          const binNames = item.trashNames || [];
          const combined = binCodes.map((code, idx) => {
            const name = binNames[idx] || '';
            return `${code} - ${name}`;
          });

          return {
            ...item,
            trashDetails: combined,
          };
        });

        setGroupedScannedList(processedList);
      } catch (err) {
        console.error('Lỗi khi fetch dữ liệu:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [workDate, workShift]);

  useEffect(() => {
    const fetchLongestUnscanned = async () => {
      try {
        const res = await http.get("/trash-weighings/longest-unscanned");

        const json = await res.json();

        setLongestUnscanned(json.fullList || []);
      } catch (err) {
        console.error('Lỗi lấy danh sách chưa quét QR:', err);
      }
    };

    fetchLongestUnscanned();
  }, []);

  const removeVietnameseTones = (str) => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // xóa dấu
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
};


  const filteredList = groupedScannedList.filter((item) => {
  const matchStatus =
    filterStatus === "" ||
    (filterStatus === "scanned" && item.isScannedTeam) ||
    (filterStatus === "unscanned" && !item.isScannedTeam);

  const matchDepartment =
    filterDepartment === "" ||
    removeVietnameseTones(item.departmentName || "").includes(
      removeVietnameseTones(filterDepartment)
    );

  const matchUnit =
    filterUnit === "" ||
    removeVietnameseTones(item.unitName || "").includes(
      removeVietnameseTones(filterUnit)
    );

  return matchStatus && matchDepartment && matchUnit;
});

  return (
    <div className="p-4">
      <div className="p-4 space-y-6 bg-white rounded-[6px]">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">📋 Theo dõi quét mã QR</h2>

        {/* Bộ lọc */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="text-sm text-gray-600 block mb-1">Ngày làm việc:</label>
            <input
              type="date"
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm text-sm focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Ca làm việc:</label>
            <select
              value={workShift}
              onChange={(e) => setWorkShift(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm text-sm focus:ring-2 focus:ring-blue-400"
            >
              <option value="ca1">Ca 1</option>
              <option value="ca2">Ca 2</option>
              <option value="ca3">Ca 3</option>
              <option value="dai1">Dài 1</option>
              <option value="dai2">Dài 2</option>
              <option value="cahc">Ca Hành Chính</option>
            </select>
          </div>
          <div>
  <label className="text-sm text-gray-600 block mb-1">Tình trạng quét:</label>
  <select
    value={filterStatus}
    onChange={(e) => setFilterStatus(e.target.value)}
    className="w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm text-sm focus:ring-2 focus:ring-blue-400"
  >
    <option value="">Tất cả</option>
    <option value="scanned">Đã quét</option>
    <option value="unscanned">Chưa quét</option>
  </select>
</div>

<div>
  <label className="text-sm text-gray-600 block mb-1">Bộ phận:</label>
  <input
    type="text"
    value={filterDepartment}
    onChange={(e) => setFilterDepartment(e.target.value)}
    placeholder="Nhập tên tổ"
    className="w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm text-sm focus:ring-2 focus:ring-blue-400"
  />
</div>

<div>
  <label className="text-sm text-gray-600 block mb-1">Đơn vị:</label>
  <input
    type="text"
    value={filterUnit}
    onChange={(e) => setFilterUnit(e.target.value)}
    placeholder="Nhập tên đơn vị"
    className="w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm text-sm focus:ring-2 focus:ring-blue-400"
  />
</div>

        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center my-10">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto mt-4 rounded-lg border border-gray-200">
            <table className="min-w-full text-sm rounded-lg text-gray-700 border border-gray-300 border-collapse">
              <thead>
                <tr className="bg-blue-100 text-gray-700">
                  <th className="px-3 py-2 border">#</th>
                  <th className="px-3 py-2 border text-left">Tổ</th>
                  <th className="px-3 py-2 border text-left">Đơn vị</th>
                  <th className="px-3 py-2 border text-left">Người quét</th>
                  <th className="px-3 py-2 border text-left">Chi tiết thùng rác</th>
                  <th className="px-3 py-2 border text-center">Tình trạng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredList.map((item, idx) => {
                  const isScanned = item.isScannedTeam;
                  const statusClass = isScanned
                    ? 'text-green-600 font-semibold'
                    : 'text-red-500 font-semibold';
                  const details = item.trashDetails || [];

                  return (
                    <tr key={idx} className="hover:bg-gray-50 odd:bg-white even:bg-gray-50">
                      <td className="px-3 py-2 border text-center">{idx + 1}</td>
                      <td className="px-3 py-2 border">{item.departmentName || '-'}</td>
                      <td className="px-3 py-2 border">{item.unitName || '-'}</td>
                      <td className="px-3 py-2 border">{item.fullName || '-'}</td>
                      <td className="px-3 py-2 border relative group">
                        {details.length === 0 ? (
                          '-'
                        ) : (
                          <div className="relative w-full">
                            <input
                              readOnly
                              value={`${details.length} mục`}
                              className="w-full cursor-pointer border border-gray-300 rounded-md px-3 py-1 bg-gray-50 hover:bg-white focus:outline-none"
                            />
                            <span className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500 pointer-events-none">▼</span>

                            <ul
                              className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-md max-h-40 overflow-auto hidden group-hover:block"
                            >
                              {details.map((d, i) => (
                                <li
                                  key={i}
                                  className="px-3 py-1 text-sm hover:bg-blue-100 text-gray-700 whitespace-nowrap"
                                >
                                  {d}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </td>
                      <td className={`px-3 py-2 border text-center ${statusClass}`}>
                        {isScanned ? 'Đã quét' : 'Chưa quét'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {groupedScannedList.length === 0 && (
              <p className="text-center text-gray-500 mt-4">
                Không có dữ liệu cho ngày và ca đã chọn.
              </p>
            )}
          </div>
        )}

        {/* Bảng top 15 chưa quét QR lâu nhất */}
        <div className="mt-12">
          <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
            🕒 Top tổ/đơn vị lâu nhất chưa quét QR
          </h3>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full text-sm text-gray-700 border border-gray-300 border-collapse">
              <thead>
                <tr className="bg-orange-100 text-gray-700">
                  <th className="px-3 py-2 border">#</th>
                  <th className="px-3 py-2 border text-left">Tổ</th>
                  <th className="px-3 py-2 border text-left">Đơn vị</th>
                  <th className="px-3 py-2 border text-center">Số ngày chưa quét</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {longestUnscanned.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 odd:bg-white even:bg-gray-50">
                    <td className="px-3 py-2 border text-center">{idx + 1}</td>
                    <td className="px-3 py-2 border">{item.team}</td>
                    <td className="px-3 py-2 border">{item.unit || '-'}</td>
                    <td className="px-3 py-2 border text-center">
                      {item.weighedDays >= 9999 ? (
                        <span className="text-red-500 font-semibold">Chưa từng quét</span>
                      ) : (
                        `${item.weighedDays} ngày`
                      )}
                    </td>
                  </tr>
                ))}
                {longestUnscanned.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-4 text-gray-500">
                      Không có dữ liệu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

export default QRScanTracking;
