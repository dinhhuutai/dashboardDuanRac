
// import React, { useState, useEffect } from 'react';
// import { BASE_URL } from '~/config';

// function UnscannedQR() {
//   const [data, setData] = useState({});
//   const [scannedData, setScannedData] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [longestUnweighed, setLongestUnweighed] = useState([]);
//   const [loadingLongest, setLoadingLongest] = useState(false);
//   const [workDate, setWorkDate] = useState(new Date().toISOString().split('T')[0]);
//   const [workShift, setWorkShift] = useState('ca1');
//   const [viewType, setViewType] = useState('unscanned'); // 'unscanned' | 'scanned'

//   // Fetch unscanned & scanned QR
//   useEffect(() => {
//     const fetchData = async () => {
//       setLoading(true);
//       try {
//         const res = await fetch(
//           `${BASE_URL}/trash-weighings/tracking-scan?workDate=${workDate}&workShift=${workShift}`,
//         );
//         const json = await res.json();
//         setData(json.unscannedTeams || {});
//         setScannedData(json.scannedTeams || {});

//         console.log(json.groupedScannedList);
//       } catch (err) {
//         console.error('Lỗi khi fetch dữ liệu:', err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, [workDate, workShift]);

//   // Fetch longest-unweighed list
//   useEffect(() => {
//     const fetchLongestUnweighed = async () => {
//       setLoadingLongest(true);
//       try {
//         const res = await fetch(`${BASE_URL}/trash-weighings/longest-unweighed`);
//         const json = await res.json();
//         setLongestUnweighed(json.longestUnweighed || []);
//       } catch (err) {
//         console.error('Lỗi khi lấy danh sách chưa cân lâu nhất:', err);
//       } finally {
//         setLoadingLongest(false);
//       }
//     };
//     fetchLongestUnweighed();
//   }, []);

//   const displayData = viewType === 'unscanned' ? data : scannedData;

//   return (
//     <div className="max-w-6xl mx-auto p-6 bg-white rounded-xl mt-6 border border-gray-200 shadow">
//       <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
//         📋 Theo dõi quét mã QR
//       </h2>

//       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
//         <div>
//           <label className="text-sm text-gray-600 mb-1 block">Ngày làm việc:</label>
//           <input
//             type="date"
//             value={workDate}
//             onChange={(e) => setWorkDate(e.target.value)}
//             className="w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
//           />
//         </div>

//         <div>
//           <label className="text-sm text-gray-600 mb-1 block">Ca làm việc:</label>
//           <select
//             value={workShift}
//             onChange={(e) => setWorkShift(e.target.value)}
//             className="w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
//           >
//             <option value="ca1">Ca 1</option>
//             <option value="ca2">Ca 2</option>
//             <option value="ca3">Ca 3</option>
//             <option value="dai1">Dài 1</option>
//             <option value="dai2">Dài 2</option>
//             <option value="cahc">Ca Hành Chính</option>
//           </select>
//         </div>

//         <div className="flex items-end">
//           <div className="space-x-4 text-sm text-gray-700">
//             <label>
//               <input
//                 type="radio"
//                 name="viewType"
//                 value="unscanned"
//                 checked={viewType === 'unscanned'}
//                 onChange={() => setViewType('unscanned')}
//                 className="mr-1"
//               />
//               Chưa quét
//             </label>
//             <label>
//               <input
//                 type="radio"
//                 name="viewType"
//                 value="scanned"
//                 checked={viewType === 'scanned'}
//                 onChange={() => setViewType('scanned')}
//                 className="mr-1"
//               />
//               Đã quét
//             </label>
//           </div>
//         </div>
//       </div>

//       {(loading || loadingLongest) && (
//         <div className="flex items-center justify-center mb-4">
//           <div className="w-6 h-6 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
//         </div>
//       )}

//       <div>
//         {loading ? (
//           <p className="text-center text-gray-500">Đang tải dữ liệu...</p>
//         ) : Object.keys(displayData).length === 0 ? (
//           <p
//             className={`text-center font-medium mt-3 ${viewType === 'unscanned' ? 'text-green-600' : 'text-gray-500'}`}
//           >
//             {viewType === 'unscanned' ? '✅ Tất cả tổ - đơn vị đã cân rác' : '⚠️ Không có tổ - đơn vị nào đã quét QR'}
//           </p>
//         ) : (
//           <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
//             {Object.entries(displayData).map(([team, units]) => (
//               <div key={team} className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
//                 <h3
//                   className={`text-sm font-semibold ${viewType === 'scanned' ? 'text-green-600' : 'text-red-600'} mb-1`}
//                 >
//                   {team}
//                 </h3>
//                 <ul className="list-disc pl-5 text-sm text-gray-700">
//                   {units.map((unit) => (
//                     <li key={unit}>{unit}</li>
//                   ))}
//                 </ul>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {longestUnweighed.length > 0 && (
//         <div className="mt-10">
//           <h3 className="text-xl font-bold text-orange-800 text-center mb-6">📌 Danh sách tổ lâu nhất chưa cân rác</h3>
//           <div className="overflow-x-auto">
//             <table className="min-w-full table-auto border border-gray-200 rounded-lg shadow-sm bg-white">
//               <thead>
//                 <tr className="bg-yellow-100 text-gray-800 text-sm">
//                   <th className="px-4 py-2 border">#</th>
//                   <th className="px-4 py-2 border text-left">Tổ</th>
//                   <th className="px-4 py-2 border text-left">Đơn vị</th>
//                   <th className="px-4 py-2 border text-center">Số ngày chưa cân</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {longestUnweighed.map((item, idx) => {
//                   const severity =
//                     item.days >= 9999
//                       ? 'bg-red-100 text-red-700'
//                       : item.days > 10
//                       ? 'bg-red-50 text-red-600'
//                       : item.days > 5
//                       ? 'bg-yellow-50 text-yellow-700'
//                       : 'bg-gray-50 text-gray-700';

//                   return (
//                     <tr key={idx} className={`${severity} text-sm`}>
//                       <td className="px-4 py-2 border text-center font-medium">{idx + 1}</td>
//                       <td className="px-4 py-2 border">{item.team}</td>
//                       <td className="px-4 py-2 border">{item.unit || '-'}</td>
//                       <td className="px-4 py-2 border text-center font-semibold">
//                         {item.days === 9999 ? 'Chưa từng' : `${item.days} ngày`}
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default UnscannedQR;


import React, { useState, useEffect } from 'react';
import { BASE_URL } from '~/config';

function QRScanTracking() {
  const [groupedScannedList, setGroupedScannedList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [workDate, setWorkDate] = useState(new Date().toISOString().split('T')[0]);
  const [workShift, setWorkShift] = useState('ca1');
  const [longestUnscanned, setLongestUnscanned] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${BASE_URL}/trash-weighings/tracking-scan?workDate=${workDate}&workShift=${workShift}`
        );
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
        const res = await fetch(`${BASE_URL}/trash-weighings/longest-unscanned`);
        const json = await res.json();

        setLongestUnscanned(json.fullList || []);
      } catch (err) {
        console.error('Lỗi lấy danh sách chưa quét QR:', err);
      }
    };

    fetchLongestUnscanned();
  }, []);

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
                {groupedScannedList.map((item, idx) => {
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
