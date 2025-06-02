import React, { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { userSelector, weightSelector } from '~/redux/selectors';
import { FaSpinner } from 'react-icons/fa';
import { BASE_URL } from '~/config/index';

function Scan() {
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);
  const mediaStreamRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [jsonData, setJsonData] = useState(null);
  const [khoiLuong, setKhoiLuong] = useState('');
  const [resultVisible, setResultVisible] = useState(false);
  const [messageModal, setMessageModal] = useState(null);
  const [wrongTeamModal, setWrongTeamModal] = useState(false);

  const [teamMembers, setTeamMembers] = useState([]);

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

  useEffect(() => {
    if (user?.userID) {
      fetch(`${BASE_URL}/api/team-members?userID=${user.userID}`)
        .then((res) => res.json())
        .then((data) => {
          setTeamMembers(data);
          if (teamMembers.length === 0) {
            setTenNguoiCan(user?.fullName);
          }
        })
        .catch((err) => {
          console.error('Lỗi khi tải teamMembers:', err);
          setTeamMembers([]);
        });
    }
  }, [user]);

  const initScanner = () => {
    if (!videoRef.current) return;

    qrScannerRef.current = new QrScanner(
      videoRef.current,
      (result) => {
        try {
          const decodedStr = decodeURIComponent(result.data);
          const parsed = JSON.parse(decodedStr);
          setJsonData(parsed);

          if (user?.role === 'admin') {
            setResultVisible(true);
          } else if (user?.role === 'user') {
            const userTeam = user?.fullName?.toLowerCase(); // hoặc user.teamName nếu có
            const qrTeam = parsed?.d?.toLowerCase();
            if (qrTeam && userTeam && qrTeam.includes(userTeam)) {
              setResultVisible(true);
            } else {
              setWrongTeamModal(true);
            }
          }
        } catch (err) {
          console.error('Lỗi khi parse JSON:', err);
        }
      },
      {
        highlightScanRegion: true,
        highlightCodeOutline: true,
        preferredCamera: 'environment',
        maxScansPerSecond: 10,
        // 👇 Cấu hình constraints cho camera
        returnDetailedScanResult: true,
        onDecodeError: (err) => console.warn('Decode error', err),
        calculateScanRegion: () => ({
          x: 0,
          y: 0,
          width: videoRef.current.videoWidth,
          height: videoRef.current.videoHeight,
        }),
      },
    );

    qrScannerRef.current
      .start({
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      })
      .then(() => {
        mediaStreamRef.current = videoRef.current.srcObject;
      })
      .catch((err) => {
        console.error('Không thể khởi động camera:', err);
      });
  };

  useEffect(() => {
    if (user) {
      initScanner();
    }
    return () => {
      qrScannerRef.current?.stop();
      qrScannerRef.current?.destroy();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, [user]);

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

    const payload = {
      trashBinCode: jsonData?.id,
      userID: user.userID,
      weighingTime: nowUTC7.toISOString(),
      weightKg: weight,
      updatedAt: nowUTC7.toISOString(),
      updatedBy: user.userID,
      workShift: workShift,
      workDate: new Date(workDate).toISOString().split('T')[0],
      userName: tenNguoiCan,
    };

    try {
      const res = await fetch(`${BASE_URL}/trash-weighings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

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
                  onChange={(e) => {
                    const inputValue = e.target.value.replace(',', '.');
                    setKhoiLuong(inputValue);
                  }}
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
                      {shift === 'ca1'
                        ? 'Ca Ngắn 1 (8 tiếng)'
                        : shift === 'ca2'
                        ? 'Ca Ngắn 2 (8 tiếng)'
                        : shift === 'ca3'
                        ? 'Ca Ngắn 3 (8 tiếng)'
                        : shift === 'dai1'
                        ? 'Ca Dài 1 (12 tiếng)'
                        : 'Ca Dài 2 (12 tiếng)'}
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
                {teamMembers.length > 0 ? (
                  <select
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    value={tenNguoiCan}
                    onChange={(e) => setTenNguoiCan(e.target.value)}
                  >
                    <option value="">-- Chọn thành viên --</option>
                    {teamMembers.map((member) => (
                      <option key={member.teamMemberID} value={member.name}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    placeholder="VD: Nguyễn Văn A"
                    value={tenNguoiCan}
                    onChange={(e) => setTenNguoiCan(e.target.value)}
                  />
                )}
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

      <AnimatePresence>
        {wrongTeamModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setWrongTeamModal(false)}
          >
            <motion.div
              className="bg-white text-black p-6 rounded-xl shadow-xl space-y-4 w-full max-w-md mx-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center">
                <img
                  src="https://media1.tenor.com/m/Ygxb5vbxoKAAAAAC/tontonfriends-shocked.gif"
                  alt="funny chick"
                  className="w-32 h-32"
                />
              </div>
              <p className="text-[#020202] font-semibold text-center">
                🐤 Ối dồi ôi! Mã QR này không thuộc tổ của bạn rồi 😅 Quét lại hen!
              </p>
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => {
                    setWrongTeamModal(false);
                    setJsonData(null);
                    setKhoiLuong(0);
                    setResultVisible(false);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Quét lại
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

// import React, { useEffect, useRef, useState } from 'react';
// import QrScanner from 'qr-scanner';
// import { motion, AnimatePresence } from 'framer-motion';
// import { useSelector } from 'react-redux';
// import { userSelector, weightSelector } from '~/redux/selectors';
// import { FaSpinner } from 'react-icons/fa';
// import { BASE_URL } from '~/config';

// function Scan() {
//   const videoRef = useRef(null);
//   const qrScannerRef = useRef(null);
//   const mediaStreamRef = useRef(null);

//   const [loading, setLoading] = useState(false);
//   const [jsonData, setJsonData] = useState(null);
//   const [khoiLuong, setKhoiLuong] = useState('');
//   const [resultVisible, setResultVisible] = useState(false);
//   const [messageModal, setMessageModal] = useState(null);
//   const [tenNguoiCan, setTenNguoiCan] = useState('');

//   const tmp = useSelector(userSelector);
//   const weightScale = useSelector(weightSelector);
//   const [user, setUser] = useState({});
//   const [workShift, setWorkShift] = useState('ca1');
//   const [workDate, setWorkDate] = useState(new Date().toISOString().split('T')[0]);
//   const workShifts = ['ca1', 'ca2', 'ca3', 'dai1', 'dai2'];

//   useEffect(() => {
//     setUser(tmp?.login?.currentUser || {});
//   }, [tmp]);

//   useEffect(() => {
//     setKhoiLuong(weightScale?.weight || '');
//   }, [weightScale]);

//   const initScanner = () => {
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

//     qrScannerRef.current
//       .start()
//       .then(() => {
//         mediaStreamRef.current = videoRef.current.srcObject;
//       })
//       .catch((err) => {
//         console.error('Không thể khởi động camera:', err);
//       });
//   };

//   useEffect(() => {
//     initScanner();
//     return () => {
//       qrScannerRef.current?.stop();
//       qrScannerRef.current?.destroy();
//       mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
//       mediaStreamRef.current = null;
//     };
//   }, []);

//   useEffect(() => {
//     if (resultVisible) {
//       qrScannerRef.current?.stop();
//       mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
//       mediaStreamRef.current = null;
//     } else {
//       qrScannerRef.current?.destroy();
//       qrScannerRef.current = null;
//       initScanner();
//     }
//   }, [resultVisible]);

//   const handleConfirm = async () => {
//     if (!khoiLuong || isNaN(parseFloat(khoiLuong))) {
//       return setMessageModal({ type: 'error', message: 'Vui lòng nhập khối lượng hợp lệ' });
//     }

//     if (!workShift || !workDate) {
//       return setMessageModal({ type: 'error', message: 'Vui lòng chọn ca làm và ngày làm việc' });
//     }

//     setLoading(true);

//     const nowUTC7 = new Date(Date.now() + 7 * 60 * 60 * 1000);
//     let weight = parseFloat(khoiLuong);

//     const adjustments = {
//       'Giẻ lau có chứa thành phần nguy hại': 0,
//       'Vụn logo': 0,
//       'Mực in thải': 0,
//       'Keo bàn thải': 0,
//       'Băng keo dính mực': 0,
//       'Rác sinh hoạt': 0,
//       'Lụa căng khung': 0,
//     };

//     if (jsonData?.t && adjustments[jsonData.t] !== undefined) {
//       weight = Math.max(0, weight - adjustments[jsonData.t]);
//     }

//     weight = parseFloat(weight.toFixed(2));

//     const payload = {
//       trashBinCode: jsonData?.id,
//       userID: user.userID,
//       weighingTime: nowUTC7.toISOString(),
//       weightKg: weight,
//       updatedAt: nowUTC7.toISOString(),
//       updatedBy: user.userID,
//       workShift,
//       workDate,
//       weighedByName: tenNguoiCan || '',
//     };

//     try {
//       const res = await fetch(`${BASE_URL}/trash-weighings`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload),
//       });

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
//       setResultVisible(false);
//       setJsonData(null);
//       setKhoiLuong('');
//     }
//   };

//   return (
//     <div className="relative flex flex-col items-center bg-white text-white p-4">
//       <video ref={videoRef} className="w-full max-w-lg rounded-xl shadow-lg border-2 border-white" />

//       {/* Modal nhập liệu sau khi quét */}
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
//               onClick={(e) => e.stopPropagation()}
//             >
//               {/* Thông tin hiển thị từ QR */}
//               <div className="text-sm flex">
//                 <p className="font-semibold">📍 Bộ phận / Khu vực:</p>
//                 <p className="ml-2">{jsonData?.d}</p>
//               </div>
//               <div className="text-sm flex">
//                 <p className="font-semibold">🏭 Đơn vị sản xuất:</p>
//                 <p className="ml-2">{jsonData?.u}</p>
//               </div>
//               <div className="text-sm flex">
//                 <p className="font-semibold">🗑️ Loại rác:</p>
//                 <p className="ml-2">{jsonData?.t}</p>
//               </div>

//               {/* Nhập khối lượng */}
//               <div className="text-sm">
//                 <label className="font-semibold block mb-1">⚖️ Nhập khối lượng:</label>
//                 <input
//                   type="number"
//                   inputMode="decimal"
//                   className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
//                   placeholder="VD: 5.25"
//                   value={khoiLuong}
//                   onChange={(e) => setKhoiLuong(e.target.value.replace(',', '.'))}
//                 />
//               </div>

//               {/* Chọn ca làm */}
//               <div className="text-sm">
//                 <label className="font-semibold block mb-1">🕓 Chọn ca làm việc:</label>
//                 <div className="flex flex-wrap gap-2">
//                   {workShifts.map((shift) => (
//                     <button
//                       key={shift}
//                       onClick={() => setWorkShift(shift)}
//                       className={`px-4 py-2 rounded border text-sm ${
//                         workShift === shift ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
//                       }`}
//                     >
//                       {shift.toUpperCase()}
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               {/* Ngày làm việc */}
//               <div className="text-sm">
//                 <label className="font-semibold block mb-1">📅 Ngày làm việc:</label>
//                 <input
//                   type="date"
//                   className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
//                   value={workDate}
//                   onChange={(e) => setWorkDate(e.target.value)}
//                 />
//               </div>

//               {/* Tên người cân */}
//               <div className="text-sm">
//                 <label className="font-semibold block mb-1">👤 Tên người cân:</label>
//                 <input
//                   type="text"
//                   className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
//                   placeholder="VD: Nguyễn Văn A"
//                   value={tenNguoiCan}
//                   onChange={(e) => setTenNguoiCan(e.target.value)}
//                 />
//               </div>

//               {/* Nút xác nhận */}
//               <div className="flex justify-between pt-4">
//                 <button
//                   onClick={() => setResultVisible(false)}
//                   className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
//                 >
//                   Đóng
//                 </button>
//                 <button
//                   onClick={handleConfirm}
//                   className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center justify-center"
//                   disabled={loading}
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

//       {/* Modal thông báo lỗi/thành công */}
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
