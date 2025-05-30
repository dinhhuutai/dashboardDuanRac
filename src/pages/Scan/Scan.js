// import React, { useEffect, useRef, useState } from 'react';
// import QrScanner from 'qr-scanner';
// import { motion, AnimatePresence } from 'framer-motion';
// import { useSelector } from 'react-redux';
// import { userSelector } from '~/redux/selectors';
// import getCurrentShiftInfo from '~/components/getCurrentShiftInfo';
// import { FaSpinner } from 'react-icons/fa';

// function Scan() {
//   const videoRef = useRef(null);
//   const qrScannerRef = useRef(null);

//   const [loading, setLoading] = useState(false);

//   const [jsonData, setJsonData] = useState(null);
//   const [khoiLuong, setKhoiLuong] = useState('');
//   const [resultVisible, setResultVisible] = useState(false);
//   const [messageModal, setMessageModal] = useState(null);

//   const tmp = useSelector(userSelector);
//   const [user, setUser] = useState({});

//   useEffect(() => {
//     setUser(tmp?.login?.currentUser);
//   }, [tmp]);

//   useEffect(() => {
//     if (!videoRef.current) return;

//     qrScannerRef.current = new QrScanner(
//       videoRef.current,
//       (result) => {
//         try {
//           const decodedStr = decodeURIComponent(result.data);

//           const parsed = JSON.parse(decodedStr);
//           setJsonData(parsed);
//           setResultVisible(true);
//         } catch (err) {
//           console.error('Lỗi khi parse JSON:', err);
//         }
//       },
//       {
//         highlightScanRegion: true,
//         highlightCodeOutline: true,
//       },
//     );

//     qrScannerRef.current.start();

//     return () => {
//       qrScannerRef.current?.stop();
//       qrScannerRef.current?.destroy();
//     };
//   }, []);

//   // Khi modal hiện thì dừng quét, khi đóng modal thì quét lại
//   useEffect(() => {
//     if (!qrScannerRef.current) return;

//     if (resultVisible) {
//       qrScannerRef.current.stop();
//     } else {
//       qrScannerRef.current.start();
//     }
//   }, [resultVisible]);

//   const handleConfirm = async () => {
//     if (!khoiLuong || isNaN(parseFloat(khoiLuong))) {
//       setMessageModal({ type: 'error', message: 'Vui lòng nhập khối lượng hợp lệ' });
//       return;
//     }

//     setLoading(true);

//     const nowUTC7 = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
//     let weight = parseFloat(khoiLuong);

//     const adjustments = {
//       'Giẻ lau có chứa thành phần nguy hại': 1,
//       'Vụn logo': 1,
//       'Mực in thải': 0.45,
//       'Keo bàn thải': 1,
//       'Băng keo dính mực': 0.8,
//       'Rác sinh hoạt': 1,
//       'Lụa căng khung': 1,
//     };

//     if (jsonData?.t && adjustments[jsonData.t]) {
//       weight = Math.max(0, weight - adjustments[jsonData.t]);
//     }

//     weight = parseFloat(weight.toFixed(2));

//     const { shift, workDate } = getCurrentShiftInfo(new Date());

//     const payload = {
//       trashBinCode: jsonData?.id,
//       userID: user.userID,
//       weighingTime: nowUTC7.toISOString(),
//       weightKg: weight,
//       updatedAt: nowUTC7.toISOString(),
//       updatedBy: user.userID,
//       workShift: shift || 'ca1',
//       workDate: workDate || nowUTC7,
//     };

//     try {
//       const res = await fetch(
//         'https://duanrac-api-node-habqhehnc6a2hkaq.southeastasia-01.azurewebsites.net/trash-weighings',
//         {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify(payload),
//         },
//       );

//       if (res.ok) {
//         setMessageModal({ type: 'success', message: '✅ Đã lưu dữ liệu cân rác thành công!' });
//       } else {
//         const errText = await res.text();
//         setMessageModal({ type: 'error', message: `❌ Lỗi: ${errText || 'Không thể lưu dữ liệu cân rác'}` });
//       }
//     } catch (err) {
//       setMessageModal({ type: 'error', message: '❌ Lỗi kết nối: Không thể kết nối đến server' });
//     } finally {
//       setLoading(false);
//     }

//     // Reset giao diện nhập liệu
//     setResultVisible(false);
//     setJsonData(null);
//     setKhoiLuong('');
//     setLoading(false);
//   };

//   return (
//     <div className="relative flex flex-col items-center bg-white text-white p-4">
//       <video ref={videoRef} className="w-full max-w-lg rounded-xl shadow-lg border-2 border-white" />

//       <AnimatePresence>
//         {resultVisible && jsonData && (
//           <motion.div
//             className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             onClick={() => {
//               setResultVisible(false);
//               setJsonData(null);
//               setKhoiLuong('');
//             }}
//           >
//             <motion.div
//               className="bg-white text-black p-6 rounded-xl shadow-xl space-y-4 w-full max-w-md mx-4"
//               initial={{ scale: 0.9, opacity: 0 }}
//               animate={{ scale: 1, opacity: 1 }}
//               exit={{ scale: 0.9, opacity: 0 }}
//               transition={{ duration: 0.2 }}
//               onClick={(e) => e.stopPropagation()} // Ngăn nổi bọt
//             >
//               <div className="text-sm flex">
//                 <p className="font-semibold">📍 Bộ phận / Khu vực:</p>
//                 <p className="ml-2">{jsonData?.d || ''}</p>
//               </div>
//               <div className="text-sm flex">
//                 <p className="font-semibold">🏭 Đơn vị sản xuất:</p>
//                 <p className="ml-2">{jsonData?.u || ''}</p>
//               </div>
//               <div className="text-sm flex">
//                 <p className="font-semibold">🗑️ Loại rác:</p>
//                 <p className="ml-2">{jsonData?.t || ''}</p>
//               </div>
//               <div className="text-sm">
//                 <label className="font-semibold block mb-1">⚖️ Nhập khối lượng:</label>
//                 <input
//                   type="number"
//                   inputMode="decimal"
//                   className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
//                   placeholder="VD: 5.25"
//                   value={khoiLuong}
//                   onChange={(e) => setKhoiLuong(e.target.value)}
//                   autoFocus
//                 />
//               </div>
//               <div className="flex justify-between pt-4">
//                 <button
//                   onClick={() => {
//                     setResultVisible(false);
//                     setJsonData(null);
//                     setKhoiLuong('');
//                   }}
//                   className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
//                 >
//                   Đóng
//                 </button>
//                 <button
//                   onClick={handleConfirm}
//                   className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center justify-center"
//                   disabled={loading} // disable khi đang loading
//                 >
//                   {loading ? (
//                     <>
//                       <FaSpinner className="animate-spin mr-2" />
//                       Đang gửi...
//                     </>
//                   ) : (
//                     'Xác nhận'
//                   )}
//                 </button>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       <AnimatePresence>
//         {messageModal && (
//           <motion.div
//             className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             onClick={() => setMessageModal(null)}
//           >
//             <motion.div
//               className="bg-white text-black p-6 rounded-xl shadow-xl space-y-4 w-full max-w-md mx-4"
//               initial={{ scale: 0.9, opacity: 0 }}
//               animate={{ scale: 1, opacity: 1 }}
//               exit={{ scale: 0.9, opacity: 0 }}
//               transition={{ duration: 0.2 }}
//               onClick={(e) => e.stopPropagation()}
//             >
//               <p className={`text-sm ${messageModal.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
//                 {messageModal.message}
//               </p>
//               <div className="flex justify-end pt-2">
//                 <button
//                   onClick={() => setMessageModal(null)}
//                   className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
//                 >
//                   Đóng
//                 </button>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }

// export default Scan;

import React, { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { userSelector, weightSelector } from '~/redux/selectors';
import getCurrentShiftInfo from '~/components/getCurrentShiftInfo';
import { FaSpinner } from 'react-icons/fa';

function Scan() {
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);
  const mediaStreamRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [jsonData, setJsonData] = useState(null);
  const [khoiLuong, setKhoiLuong] = useState('');
  const [resultVisible, setResultVisible] = useState(false);
  const [messageModal, setMessageModal] = useState(null);

  const [tenNguoiCan, setTenNguoiCan] = useState('');

  const tmp = useSelector(userSelector);
  const weightScale = useSelector(weightSelector);
  const [user, setUser] = useState({});

  const [workShift, setWorkShift] = useState('ca1');
  const [workDate, setWorkDate] = useState(new Date());

  const workShifts = ['ca1', 'ca2', 'ca3', 'dai1', 'dai2'];

  useEffect(() => {
    setUser(tmp?.login?.currentUser);
  }, [tmp]);

  useEffect(() => {
    setKhoiLuong(weightScale?.weight);
  }, [weightScale]);

  const initScanner = () => {
    if (!videoRef.current) return;

    qrScannerRef.current = new QrScanner(
      videoRef.current,
      (result) => {
        try {
          const decodedStr = decodeURIComponent(result.data);
          const parsed = JSON.parse(decodedStr);
          setJsonData(parsed);
          setResultVisible(true);
        } catch (err) {
          console.error('Lỗi khi parse JSON:', err);
        }
      },
      {
        highlightScanRegion: true,
        highlightCodeOutline: true,
      },
    );

    qrScannerRef.current
      .start()
      .then(() => {
        mediaStreamRef.current = videoRef.current.srcObject;
      })
      .catch((err) => {
        console.error('Không thể khởi động camera:', err);
      });
  };

  useEffect(() => {
    initScanner();
    return () => {
      qrScannerRef.current?.stop();
      qrScannerRef.current?.destroy();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (resultVisible) {
      qrScannerRef.current?.stop();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    } else {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
      }
      initScanner();
    }
  }, [resultVisible]);

  const handleConfirm = async () => {
    if (!khoiLuong || isNaN(parseFloat(khoiLuong))) {
      setMessageModal({ type: 'error', message: 'Vui lòng nhập khối lượng hợp lệ' });
      return;
    }

    if (!workShift || !workDate) {
      setMessageModal({ type: 'error', message: 'Vui lòng chọn ca làm và ngày làm việc' });
      return;
    }

    setLoading(true);

    const nowUTC7 = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
    let weight = parseFloat(khoiLuong);

    const adjustments = {
      'Giẻ lau có chứa thành phần nguy hại': 0,
      'Vụn logo': 0,
      'Mực in thải': 0,
      'Keo bàn thải': 0,
      'Băng keo dính mực': 0,
      'Rác sinh hoạt': 0,
      'Lụa căng khung': 0,
    };

    if (jsonData?.t && adjustments[jsonData.t]) {
      weight = Math.max(0, weight - adjustments[jsonData.t]);
    }

    weight = parseFloat(weight.toFixed(2));

    weight = parseFloat(weight.replace(',', '.'));

    const payload = {
      trashBinCode: jsonData?.id,
      userID: user.userID,
      weighingTime: nowUTC7.toISOString(),
      weightKg: weight,
      updatedAt: nowUTC7.toISOString(),
      updatedBy: user.userID,
      workShift: workShift,
      workDate: new Date(workDate).toISOString().split('T')[0],
    };

    try {
      const res = await fetch(
        'https://duanrac-api-node-habqhehnc6a2hkaq.southeastasia-01.azurewebsites.net/trash-weighings',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );

      if (res.ok) {
        setMessageModal({ type: 'success', message: '✅ Đã lưu dữ liệu cân rác thành công!' });
      } else {
        const errText = await res.text();
        setMessageModal({ type: 'error', message: `❌ Lỗi: ${errText || 'Không thể lưu dữ liệu cân rác'}` });
      }
    } catch (err) {
      setMessageModal({ type: 'error', message: '❌ Lỗi kết nối: Không thể kết nối đến server' });
    } finally {
      setLoading(false);
      setResultVisible(false);
      setJsonData(null);
      setKhoiLuong('');
    }
  };

  return (
    <div className="relative flex flex-col items-center bg-white text-white p-4">
      <video ref={videoRef} className="w-full max-w-lg rounded-xl shadow-lg border-2 border-white" />

      <AnimatePresence>
        {resultVisible && jsonData && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setResultVisible(false);
              setJsonData(null);
              setKhoiLuong('');
            }}
          >
            <motion.div
              className="bg-white text-black p-6 rounded-xl shadow-xl space-y-4 w-full max-w-md mx-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-sm flex">
                <p className="font-semibold">📍 Bộ phận / Khu vực:</p>
                <p className="ml-2">{jsonData?.d || ''}</p>
              </div>
              <div className="text-sm flex">
                <p className="font-semibold">🏭 Đơn vị sản xuất:</p>
                <p className="ml-2">{jsonData?.u || ''}</p>
              </div>
              <div className="text-sm flex">
                <p className="font-semibold">🗑️ Loại rác:</p>
                <p className="ml-2">{jsonData?.t || ''}</p>
              </div>

              <div className="text-sm">
                <label className="font-semibold block mb-1">⚖️ Nhập khối lượng:</label>
                <input
                  type="number"
                  inputMode="decimal"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="VD: 5.25"
                  value={khoiLuong}
                  onChange={(e) => setKhoiLuong(e.target.value)}
                />
              </div>

              <div className="text-sm">
                <label className="font-semibold block mb-1">🕓 Chọn ca làm việc:</label>
                <div className="flex flex-wrap gap-2">
                  {workShifts.map((shift) => (
                    <button
                      key={shift}
                      onClick={() => setWorkShift(shift)}
                      className={`px-4 py-2 rounded border text-sm ${
                        workShift === shift ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {shift.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-sm">
                <label className="font-semibold block mb-1">📅 Ngày làm việc:</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  value={workDate}
                  onChange={(e) => setWorkDate(e.target.value)}
                />
              </div>
              <div className="text-sm">
                <label className="font-semibold block mb-1">👤 Tên người cân:</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="VD: Nguyễn Văn A"
                  value={tenNguoiCan}
                  onChange={(e) => setTenNguoiCan(e.target.value)}
                />
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => {
                    setResultVisible(false);
                    setJsonData(null);
                    setKhoiLuong('');
                  }}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Đóng
                </button>
                <button
                  onClick={handleConfirm}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center justify-center"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Đang gửi...
                    </>
                  ) : (
                    'Xác nhận'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {messageModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMessageModal(null)}
          >
            <motion.div
              className="bg-white text-black p-6 rounded-xl shadow-xl space-y-4 w-full max-w-md mx-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className={`text-sm ${messageModal.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                {messageModal.message}
              </p>
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setMessageModal(null)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Scan;
