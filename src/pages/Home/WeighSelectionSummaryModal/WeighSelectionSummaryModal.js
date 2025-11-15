// import React, { useEffect, useState, useRef } from 'react';
// import Modal from 'react-modal';
// import { useSelector } from 'react-redux';
// import { userSelector, weightSelector } from '~/redux/selectors';
// import { BASE_URL } from '~/config';
// import axios from 'axios';
// import mqtt from 'mqtt';

// const MQTT_BROKER = 'wss://broker.hivemq.com:8884/mqtt';
// const MQTT_TOPIC = 'thla/canrac';

// Modal.setAppElement('#root');

// export default function WeighSelectionSummaryModal({
//   isOpen,
//   onClose,
//   trashId,      // trashTypeId (bắt buộc)
//   departmentId, // departmentID (có thể null)
//   lineId,       // unitID (có thể null)
// }) {
//   const tmp = useSelector(userSelector);
//   const weightScale = useSelector(weightSelector);
//   const user = tmp?.login?.currentUser;

//   // jsonData giống Scan: { id: trashBinCode, d, u, t }
//   const [jsonData, setJsonData] = useState(null);
//   const [loading, setLoading] = useState(false);

//   // form giống Scan
//   const [khoiLuong, setKhoiLuong] = useState('');
//   const [workShift, setWorkShift] = useState('ca1');
//   const todayStr = new Date().toISOString().split('T')[0];
//   const [workDate, setWorkDate] = useState(todayStr);
//   const [isWorkShift, setIsWorkShift] = useState(true);
//   const [isWorkDate, setIsWorkDate] = useState(true);
//   const [tenNguoiCan, setTenNguoiCan] = useState('');

//   const workShifts = ['ca1', 'ca2', 'ca3', 'dai1', 'dai2', 'cahc'];

//   // toast/modal nhỏ
//   const [messageModal, setMessageModal] = useState(null); // {type:'error'|'success'|'info', message}
//   // cảnh báo đã cân trước
//   const [alreadyWeighedData, setAlreadyWeighedData] = useState(null);
//   // review & edit
//   const [reviewModalVisible, setReviewModalVisible] = useState(false);
//   const [editModalVisible, setEditModalVisible] = useState(false);
//   const [confirmedData, setConfirmedData] = useState(null);
//   const [isSaving, setIsSaving] = useState(false);

//   // --- MQTT (đúng kiểu cũ như Scan) ---
//   useEffect(() => {
//     const client = mqtt.connect(MQTT_BROKER);
//     client.on('connect', () => client.subscribe(MQTT_TOPIC));
//     client.on('message', (_topic, message) => {
//       try {
//         const data = JSON.parse(message.toString());
//         if (data?.weight) setKhoiLuong(String(data.weight));
//       } catch {}
//     });
//     return () => client.end();
//   }, []);

//   // nhận khối lượng từ redux (giữ nguyên như cũ)
//   useEffect(() => { setKhoiLuong(weightScale?.weight); }, [weightScale]);

//   // Mở modal: nạp mô tả qua API details-by-selection để có trashBinCode
//   useEffect(() => {
//     if (!isOpen) return;
//     if (!trashId) return;

//     const fetchDetails = async () => {
//       setLoading(true);
//       try {
//         const res = await axios.get(`${BASE_URL}/api/trash-bins/details-by-selection`, {
//           params: {
//             trashTypeId: trashId,
//             departmentId: departmentId ?? '',
//             lineId: lineId ?? '',
//           },
//         });
//         const d = res?.data?.data || null;
//         // Kỳ vọng trả về { departmentName, unitName, trashName, trashBinCode }
//         if (d?.trashBinCode) {
//           setJsonData({
//             id: d.trashBinCode,
//             d: d.departmentName ?? '',
//             u: d.unitName ?? '',
//             t: d.trashName ?? '',
//           });
//         } else {
//           setJsonData(null);
//           setMessageModal({ type: 'error', message: 'Không tìm thấy thùng tương ứng lựa chọn.' });
//         }
//       } catch {
//         setJsonData(null);
//         setMessageModal({ type: 'error', message: 'Không lấy được thông tin rác/bộ phận/chuyền.' });
//       } finally {
//         setLoading(false);
//       }
//     };

//     // reset giống Scan mỗi lần mở
//     setKhoiLuong('');
//     setWorkShift('ca1');
//     setWorkDate(todayStr);
//     setIsWorkShift(true);
//     setIsWorkDate(true);
//     setTenNguoiCan('');
//     setMessageModal(null);
//     setAlreadyWeighedData(null);
//     setReviewModalVisible(false);
//     setEditModalVisible(false);
//     setConfirmedData(null);

//     fetchDetails();
//   }, [isOpen, trashId, departmentId, lineId]);

//   const checkIfWeighed = async () => {
//     if (!khoiLuong || isNaN(parseFloat(khoiLuong))) {
//       setMessageModal({ type: 'error', message: 'Vui lòng nhập khối lượng hợp lệ' });
//       return null;
//     }
//     if (!workShift || !workDate) {
//       setMessageModal({ type: 'error', message: 'Vui lòng chọn ca làm và ngày làm việc' });
//       return null;
//     }
//     if (!jsonData?.id) {
//       setMessageModal({ type: 'error', message: 'Thiếu mã thùng (trashBinCode).' });
//       return null;
//     }

//     setLoading(true);
//     try {
//       const res = await axios.get(`${BASE_URL}/trash-weighings/check`, {
//         params: {
//           trashBinCode: jsonData.id,
//           workShift,
//           workDate
//         }
//       });
//       return res.data;
//     } catch (error) {
//       console.error('❌ Lỗi kiểm tra cân:', error);
//       return null;
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleConfirm = async () => {
//     if (!khoiLuong || isNaN(parseFloat(khoiLuong))) {
//       setMessageModal({ type: 'error', message: 'Vui lòng nhập khối lượng hợp lệ' });
//       return;
//     }
//     if (!workShift || !workDate) {
//       setMessageModal({ type: 'error', message: 'Vui lòng chọn ca làm và ngày làm việc' });
//       return;
//     }
//     if (!jsonData?.id) {
//       setMessageModal({ type: 'error', message: 'Thiếu mã thùng (trashBinCode).' });
//       return;
//     }

//     setLoading(true);
//     const nowUTC7 = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
//     let weight = parseFloat(khoiLuong);

//     // giữ block adjustments y hệt Scan (nếu cần)
//     const adjustments = {
//       'Giẻ lau có chứa thành phần nguy hại': 0,
//       'Vụn logo': 0,
//       'Mực in thải': 0,
//       'Keo bàn thải': 0,
//       'Băng keo dính mực': 0,
//       'Rác sinh hoạt': 0,
//       'Lụa căng khung': 0,
//     };
//     if (jsonData?.t && adjustments[jsonData.t]) weight = Math.max(0, weight - adjustments[jsonData.t]);
//     weight = parseFloat(weight.toFixed(1));

//     const payload = {
//       trashBinCode: jsonData.id,
//       userID: user?.userID,
//       weighingTime: nowUTC7.toISOString(),
//       weightKg: weight,
//       updatedAt: nowUTC7.toISOString(),
//       updatedBy: user?.userID,
//       workShift: isWorkShift ? workShift : null,
//       workDate: isWorkDate ? workDate : null,
//       userName: tenNguoiCan || '',
//     };

//     try {
//       // POST /trash-weighings
//       const res = await axios.post(`${BASE_URL}/trash-weighings`, payload);
//       if (res.status === 200) {
//         const saved = res.data; // kỳ vọng { id: ... }
//         const savedPayload = { ...payload, id: saved?.id, d: jsonData?.d, u: jsonData?.u, t: jsonData?.t };
//         setConfirmedData(savedPayload);
//         setReviewModalVisible(true);
//       } else {
//         const errText = await res.text?.();
//         setMessageModal({ type: 'error', message: `❌ Lỗi: ${errText || 'Không thể lưu dữ liệu cân rác'}` });
//       }
//     } catch {
//       setMessageModal({ type: 'error', message: '❌ Lỗi kết nối: Không thể kết nối đến server' });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCheckAndConfirm = async () => {
//     if (!khoiLuong || isNaN(parseFloat(khoiLuong))) {
//       setMessageModal({ type: 'error', message: 'Vui lòng nhập khối lượng hợp lệ' });
//       return;
//     }
//     if (!workShift || !workDate) {
//       setMessageModal({ type: 'error', message: 'Vui lòng chọn ca làm và ngày làm việc' });
//       return;
//     }

//     const checkResult = await checkIfWeighed();
//     if (checkResult?.alreadyWeighed && isWorkDate && isWorkShift) {
//       setAlreadyWeighedData({
//         id: checkResult.existingData.id,
//         trashBinCode: checkResult.existingData.trashBinCode,
//         workDate: checkResult.existingData.workDate.split('T')[0],
//         workShift: checkResult.existingData.workShift,
//         weightKg: checkResult.existingData.weightKg,
//       });
//     } else {
//       await handleConfirm();
//     }
//   };

//   return (
//     <>
//       <Modal
//         isOpen={isOpen}
//         onRequestClose={onClose}
//         className="bg-white/90 backdrop-blur-md rounded-xl max-w-md w-full p-0 mx-auto mt-10 shadow-xl outline-none border border-white/60 overflow-hidden"
//         overlayClassName="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-[70]"
//       >
//         {/* Header */}
//         <div className="px-4 py-3 bg-white/80 border-b border-slate-200 flex items-center justify-between">
//           <div className="font-semibold text-slate-900">Cân rác theo lựa chọn</div>
//           <button
//             onClick={onClose}
//             className="h-8 w-8 grid place-items-center rounded-full hover:bg-slate-100 text-slate-600"
//             aria-label="Đóng"
//             title="Đóng"
//           >
//             ✕
//           </button>
//         </div>

//         <div className="p-4 space-y-4 text-sm">
//           {/* Thông tin mô tả */}
//           <div className="rounded-lg border border-slate-200 bg-white p-3">
//             {loading ? (
//               <div className="text-slate-600">Đang tải dữ liệu…</div>
//             ) : jsonData ? (
//               <div className="grid gap-1">
//                 <div className="flex"><span className="text-slate-600 w-36">📍 Bộ phận:</span><span className="font-medium text-slate-900">{jsonData.d || '(không có)'}</span></div>
//                 <div className="flex"><span className="text-slate-600 w-36">🚏 Chuyền/Máy:</span><span className="font-medium text-slate-900">{jsonData.u || '(không có)'}</span></div>
//                 <div className="flex"><span className="text-slate-600 w-36">🗑️ Loại rác:</span><span className="font-medium text-slate-900">{jsonData.t || '(không có)'}</span></div>
//               </div>
//             ) : (
//               <div className="text-rose-600">Không có dữ liệu.</div>
//             )}
//           </div>

//           {/* Nhập khối lượng */}
//           <div>
//             <label className="block mb-1 font-semibold">⚖️ Nhập khối lượng (kg):</label>
//             <input
//               type="text"
//               inputMode="decimal"
//               className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 outline-none"
//               placeholder="VD: 5.25"
//               value={khoiLuong}
//               onChange={(e) => setKhoiLuong(e.target.value.replace(',', '.'))}
//             />
//           </div>

//           {/* Ca làm */}
//           <div>
//             <label className="block mb-1 font-semibold">🕓 Ca làm việc:</label>
//             {user?.role === 'admin' && (
//               <div className="flex items-center gap-6 mb-3">
//                 <label className="flex items-center gap-2"><input type="radio" name="shift" checked={isWorkShift === true} onChange={() => setIsWorkShift(true)} /><span>Có ca</span></label>
//                 <label className="flex items-center gap-2"><input type="radio" name="shift" checked={isWorkShift === false} onChange={() => setIsWorkShift(false)} /><span>Không ca</span></label>
//               </div>
//             )}
//             <div className="flex flex-wrap gap-2">
//               {isWorkShift ? (
//                 workShifts.map((s) => (
//                   <button
//                     key={s}
//                     onClick={() => setWorkShift(s)}
//                     className={`px-3 py-2 rounded-full text-xs border transition ${
//                       workShift === s
//                         ? 'bg-emerald-600 text-white border-emerald-600'
//                         : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
//                     }`}
//                   >
//                     {s === 'ca1'
//                       ? 'Ca Ngắn 1 (06–14h)'
//                       : s === 'ca2'
//                       ? 'Ca Ngắn 2 (14–22h)'
//                       : s === 'ca3'
//                       ? 'Ca Ngắn 3 (22–06h)'
//                       : s === 'dai1'
//                       ? 'Ca Dài 1 (06–18h)'
//                       : s === 'dai2'
//                       ? 'Ca Dài 2 (18–06h)'
//                       : 'Hành chính (07:30–16:30)'}
//                   </button>
//                 ))
//               ) : (
//                 <span className="px-3 py-2 rounded-full text-xs bg-rose-100 text-rose-700 border border-rose-200">Tem không để ca</span>
//               )}
//             </div>
//           </div>

//           {/* Ngày làm việc */}
//           <div>
//             <label className="block mb-1 font-semibold">📅 Ngày làm việc:</label>
//             {user?.role === 'admin' && (
//               <div className="flex items-center gap-6 mb-3">
//                 <label className="flex items-center gap-2"><input type="radio" name="date" checked={isWorkDate === true} onChange={() => setIsWorkDate(true)} /><span>Có ngày</span></label>
//                 <label className="flex items-center gap-2"><input type="radio" name="date" checked={isWorkDate === false} onChange={() => setIsWorkDate(false)} /><span>Không ngày</span></label>
//               </div>
//             )}
//             {isWorkDate ? (
//               <input
//                 type="date"
//                 className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 outline-none"
//                 value={workDate}
//                 onChange={(e) => setWorkDate(e.target.value)}
//               />
//             ) : (
//               <span className="px-3 py-2 rounded-full text-xs bg-rose-100 text-rose-700 border border-rose-200">Tem không để ngày</span>
//             )}
//           </div>

//           {/* Ghi chú */}
//           <div>
//             <label className="block mb-1 font-semibold">📝 Ghi chú:</label>
//             <input
//               type="text"
//               className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 outline-none"
//               placeholder="VD: Nguyễn Văn A"
//               value={tenNguoiCan}
//               onChange={(e) => setTenNguoiCan(e.target.value)}
//             />
//           </div>

//           {/* Action */}
//           <div className="flex justify-between pt-2">
//             <button onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50">
//               Đóng
//             </button>
//             <button
//               onClick={handleCheckAndConfirm}
//               className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow hover:from-emerald-700 hover:to-teal-700"
//               disabled={loading}
//             >
//               {loading ? 'Đang lưu…' : 'Xác nhận'}
//             </button>
//           </div>
//         </div>
//       </Modal>

//       {/* ĐÃ CÂN TRƯỚC ĐÓ */}
//       {alreadyWeighedData && (
//         <Modal
//           isOpen={true}
//           onRequestClose={() => setAlreadyWeighedData(null)}
//           className="bg-white/95 backdrop-blur-md rounded-2xl max-w-md w-full p-6 mx-auto mt-10 shadow-xl outline-none border border-white/60 overflow-hidden"
//           overlayClassName="fixed inset-0 bg-black/40 flex items-center justify-center z-[80]"
//         >
//           <h2 className="text-lg font-bold">⚠️ Đã cân rác</h2>
//           <p className="text-sm text-slate-600 mt-1">
//             Thùng <strong>{alreadyWeighedData.trashBinCode}</strong> đã được cân trong ca <strong>{alreadyWeighedData.workShift}</strong> ngày <strong>{alreadyWeighedData.workDate}</strong>.
//           </p>
//           <p className="text-sm text-slate-600">⚖️ Khối lượng đã lưu: <strong>{alreadyWeighedData.weightKg} kg</strong></p>

//           <div className="flex justify-between pt-3">
//             <button
//               onClick={() => {
//                 setAlreadyWeighedData(null);
//                 setLoading(false);
//                 setJsonData(jsonData); // giữ lại mô tả
//                 setKhoiLuong('');
//                 setMessageModal({ type: 'info', message: '⛔ Đã hủy lượt cân này!' });
//               }}
//               className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
//             >
//               ❌ Hủy lượt cân
//             </button>
//             <button
//               disabled={loading}
//               onClick={async () => { await handleConfirm(); setAlreadyWeighedData(null); }}
//               className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow hover:from-sky-700 hover:to-blue-700"
//             >
//               {loading ? 'Đang lưu…' : 'Tiếp tục lưu'}
//             </button>
//           </div>
//         </Modal>
//       )}

//       {/* REVIEW */}
//       {reviewModalVisible && confirmedData && (
//         <Modal
//           isOpen={true}
//           onRequestClose={() => setReviewModalVisible(false)}
//           className="bg-white/95 backdrop-blur-md rounded-2xl max-w-md w-full p-6 mx-auto mt-10 shadow-xl outline-none border border-white/60 overflow-hidden"
//           overlayClassName="fixed inset-0 bg-black/40 flex items-center justify-center z-[85]"
//         >
//           <h2 className="text-lg font-bold mb-2">📋 Thông tin đã lưu</h2>
//           <div className="space-y-1 text-sm">
//             <p><strong>Mã thùng rác:</strong> {confirmedData?.trashBinCode}</p>
//             <div className="flex"><p className="font-semibold">📍 Bộ phận/Khu vực:</p><p className="ml-2">{confirmedData?.d || ''}</p></div>
//             <div className="flex"><p className="font-semibold">🏭 Đơn vị:</p><p className="ml-2">{confirmedData?.u || ''}</p></div>
//             <div className="flex"><p className="font-semibold">🗑️ Loại rác:</p><p className="ml-2">{confirmedData?.t || ''}</p></div>
//             <p><strong>Khối lượng:</strong> {confirmedData?.weightKg} kg</p>
//             <p>
//               <strong>Ca làm:</strong>{' '}
//               {isWorkShift ? (
//                 confirmedData.workShift === 'ca1'
//                   ? 'Ca Ngắn 1 (06–14h)'
//                   : confirmedData.workShift === 'ca2'
//                   ? 'Ca Ngắn 2 (14–22h)'
//                   : confirmedData.workShift === 'ca3'
//                   ? 'Ca Ngắn 3 (22–06h)'
//                   : confirmedData.workShift === 'dai1'
//                   ? 'Ca Dài 1 (06–18h)'
//                   : confirmedData.workShift === 'dai2'
//                   ? 'Ca Dài 2 (18–06h)'
//                   : 'Hành chính (07:30–16:30)'
//               ) : (
//                 <span className="px-2 py-1 rounded-full text-xs bg-rose-100 text-rose-700 border border-rose-200">Tem không để ca</span>
//               )}
//             </p>
//             <p>
//               <strong>Ngày:</strong>{' '}
//               {isWorkDate ? (() => {
//                 const d = new Date(confirmedData.workDate);
//                 const day = String(d.getDate()).padStart(2, '0');
//                 const month = String(d.getMonth() + 1).padStart(2, '0');
//                 const year = d.getFullYear();
//                 return `${day}-${month}-${year}`;
//               })() : (
//                 <span className="px-2 py-1 rounded-full text-xs bg-rose-100 text-rose-700 border border-rose-200">Tem không để ngày</span>
//               )}
//             </p>
//             <p><strong>Ghi chú:</strong> {confirmedData.userName}</p>
//           </div>

//           <div className="flex justify-between pt-2">
//             <button
//               onClick={() => { setReviewModalVisible(false); setEditModalVisible(true); }}
//               className="px-4 py-2 rounded-xl bg-amber-500 text-white hover:bg-amber-600"
//             >
//               ✏️ Chỉnh sửa
//             </button>
//             <button
//               onClick={() => { setReviewModalVisible(false); setMessageModal({ type: 'success', message: '✅ Đã lưu dữ liệu cân rác thành công!' }); }}
//               className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700"
//             >
//               ✅ Tiếp tục
//             </button>
//           </div>
//         </Modal>
//       )}

//       {/* EDIT */}
//       {editModalVisible && confirmedData && (
//         <Modal
//           isOpen={true}
//           onRequestClose={() => setEditModalVisible(false)}
//           className="bg-white/95 backdrop-blur-md rounded-2xl max-w-md w-full p-6 mx-auto mt-10 shadow-xl outline-none border border-white/60 overflow-hidden"
//           overlayClassName="fixed inset-0 bg-black/40 flex items-center justify-center z-[90]"
//         >
//           <h2 className="text-lg font-bold">✏️ Chỉnh sửa thông tin</h2>

//           <div className="text-sm mt-3 space-y-3">
//             <div>
//               <label className="block mb-1 font-semibold">⚖️ Khối lượng:</label>
//               <input
//                 type="text"
//                 inputMode="decimal"
//                 className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 outline-none"
//                 value={confirmedData.weightKg}
//                 onChange={(e) => setConfirmedData({ ...confirmedData, weightKg: parseFloat(e.target.value.replace(',', '.')) || 0 })}
//               />
//             </div>

//             <div>
//               <label className="block mb-1 font-semibold">🕓 Ca làm:</label>
//               {isWorkShift ? (
//                 <select
//                   className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 outline-none"
//                   value={confirmedData.workShift}
//                   onChange={(e) => setConfirmedData({ ...confirmedData, workShift: e.target.value })}
//                 >
//                   <option value="ca1">Ca Ngắn 1 (06–14h)</option>
//                   <option value="ca2">Ca Ngắn 2 (14–22h)</option>
//                   <option value="ca3">Ca Ngắn 3 (22–06h)</option>
//                   <option value="dai1">Ca Dài 1 (06–18h)</option>
//                   <option value="dai2">Ca Dài 2 (18–06h)</option>
//                   <option value="cahc">Hành chính (07:30–16:30)</option>
//                 </select>
//               ) : (
//                 <span className="px-3 py-2 rounded-full text-xs bg-rose-100 text-rose-700 border border-rose-200">Tem không để ca</span>
//               )}
//             </div>

//             <div>
//               <label className="block mb-1 font-semibold">📅 Ngày làm việc:</label>
//               {isWorkDate ? (
//                 <input
//                   type="date"
//                   className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 outline-none"
//                   value={(confirmedData.workDate || '').slice(0, 10)}
//                   onChange={(e) => setConfirmedData({ ...confirmedData, workDate: e.target.value })}
//                 />
//               ) : (
//                 <span className="px-3 py-2 rounded-full text-xs bg-rose-100 text-rose-700 border border-rose-200">Tem không để ngày</span>
//               )}
//             </div>

//             <div>
//               <label className="block mb-1 font-semibold">Ghi chú:</label>
//               <input
//                 type="text"
//                 className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 outline-none"
//                 value={confirmedData.userName}
//                 onChange={(e) => setConfirmedData({ ...confirmedData, userName: e.target.value })}
//               />
//             </div>
//           </div>

//           <div className="flex justify-between pt-4">
//             <button
//               onClick={() => { setEditModalVisible(false); setMessageModal({ type: 'success', message: '✅ Đã lưu dữ liệu cân rác thành công!' }); }}
//               className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
//             >
//               ❌ Hủy
//             </button>
//             <button
//               onClick={async () => {
//                 setIsSaving(true);
//                 const nowUTC7 = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
//                 try {
//                   const res = await axios.put(`${BASE_URL}/trash-weighings/${confirmedData.id}`, {
//                     ...confirmedData,
//                     updatedAt: nowUTC7.toISOString(),
//                     updatedBy: user?.userID
//                   });
//                   if (res.status === 200) setMessageModal({ type: 'success', message: '✅ Đã chỉnh sửa dữ liệu thành công!' });
//                   else setMessageModal({ type: 'error', message: `❌ Lỗi: ${await res.text?.()}` });
//                 } catch {
//                   setMessageModal({ type: 'error', message: '❌ Không thể kết nối server!' });
//                 } finally {
//                   setEditModalVisible(false);
//                   setIsSaving(false);
//                 }
//               }}
//               className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow hover:from-sky-700 hover:to-blue-700"
//               disabled={isSaving}
//             >
//               {isSaving ? 'Đang lưu…' : '💾 Lưu'}
//             </button>
//           </div>
//         </Modal>
//       )}

//       {/* TOAST nhỏ */}
//       {messageModal && (
//         <Modal
//           isOpen={true}
//           onRequestClose={() => setMessageModal(null)}
//           className="bg-white/95 backdrop-blur-md rounded-2xl max-w-md w-full p-6 mx-auto mt-10 shadow-xl outline-none border border-white/60 overflow-hidden"
//           overlayClassName="fixed inset-0 bg-black/30 flex items-center justify-center z-[95]"
//         >
//           <p
//             className={`text-sm ${
//               messageModal.type === 'error' ? 'text-rose-600' :
//               messageModal.type === 'success' ? 'text-emerald-600' : 'text-slate-700'
//             }`}
//           >
//             {messageModal.message}
//           </p>
//           <div className="flex justify-end pt-4">
//             <button onClick={() => setMessageModal(null)} className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800">
//               Đóng
//             </button>
//           </div>
//         </Modal>
//       )}
//     </>
//   );
// }


import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import { useSelector } from 'react-redux';
import { userSelector, weightSelector } from '~/redux/selectors';
import { BASE_URL } from '~/config';
import axios from 'axios';
import mqtt from 'mqtt';

const MQTT_BROKER = 'wss://broker.hivemq.com:8884/mqtt';
const MQTT_TOPIC = 'thla/canrac';

Modal.setAppElement('#root');

export default function WeighSelectionSummaryModal({
  isOpen,
  setSummaryOpen,
  openWeigh,
  onClose,
  onBack,
  trashId,      // trashTypeId (bắt buộc)
  departmentId, // departmentID (có thể null)
  lineId,       // unitID (có thể null)
}) {
  const tmp = useSelector(userSelector);
  const weightScale = useSelector(weightSelector);
  const user = tmp?.login?.currentUser;

  // jsonData giống Scan: { id: trashBinCode, d, u, t }
  const [jsonData, setJsonData] = useState(null);
  const [loading, setLoading] = useState(false);

  // form giống Scan
  const [khoiLuong, setKhoiLuong] = useState('');
  const [workShift, setWorkShift] = useState('ca1');
  const todayStr = new Date().toISOString().split('T')[0];
  const [workDate, setWorkDate] = useState(todayStr);
  const [isWorkShift, setIsWorkShift] = useState(true);
  const [isWorkDate, setIsWorkDate] = useState(true);
  const [tenNguoiCan, setTenNguoiCan] = useState('');

  const workShifts = ['ca1', 'ca2', 'ca3', 'dai1', 'dai2', 'cahc'];

  // toast/modal nhỏ
  const [messageModal, setMessageModal] = useState(null); // {type:'error'|'success'|'info', message}
  // cảnh báo đã cân trước
  const [alreadyWeighedData, setAlreadyWeighedData] = useState(null);
  // review & edit
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [confirmedData, setConfirmedData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // --- MQTT (đúng kiểu cũ như Scan) ---
  useEffect(() => {
    const client = mqtt.connect(MQTT_BROKER);
    client.on('connect', () => client.subscribe(MQTT_TOPIC));
    client.on('message', (_topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data?.weight) setKhoiLuong(String(data.weight));
      } catch {}
    });
    return () => client.end();
  }, []);

  // nhận khối lượng từ redux (giữ nguyên như cũ)
  useEffect(() => { setKhoiLuong(weightScale?.weight); }, [weightScale]);

  // Mở modal: nạp mô tả qua API details-by-selection để có trashBinCode
  useEffect(() => {
    if (!isOpen) return;
    if (!trashId) return;

    const fetchDetails = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${BASE_URL}/api/trash-bins/details-by-selection`, {
          params: {
            trashTypeId: trashId,
            departmentId: departmentId ?? '',
            lineId: lineId ?? '',
          },
        });
        const d = res?.data?.data || null;
        // Kỳ vọng trả về { departmentName, unitName, trashName, trashBinCode }
        if (d?.trashBinCode) {
          setJsonData({
            id: d.trashBinCode,
            d: d.departmentName ?? '',
            u: d.unitName ?? '',
            t: d.trashName ?? '',
          });
        } else {
          setJsonData(null);
          setMessageModal({ type: 'error', message: 'Không tìm thấy thùng tương ứng lựa chọn.' });
        }
      } catch {
        setJsonData(null);
        setMessageModal({ type: 'error', message: 'Không lấy được thông tin rác/bộ phận/chuyền.' });
      } finally {
        setLoading(false);
      }
    };

    // reset giống Scan mỗi lần mở
    setKhoiLuong('');
    setWorkShift('ca1');
    setWorkDate(todayStr);
    setIsWorkShift(true);
    setIsWorkDate(true);
    setTenNguoiCan('');
    setMessageModal(null);
    setAlreadyWeighedData(null);
    setReviewModalVisible(false);
    setEditModalVisible(false);
    setConfirmedData(null);

    fetchDetails();
  }, [isOpen, trashId, departmentId, lineId]);

  const checkIfWeighed = async () => {
    if (!khoiLuong || isNaN(parseFloat(khoiLuong))) {
      setMessageModal({ type: 'error', message: 'Vui lòng nhập khối lượng hợp lệ' });
      return null;
    }
    if (!workShift || !workDate) {
      setMessageModal({ type: 'error', message: 'Vui lòng chọn ca làm và ngày làm việc' });
      return null;
    }
    if (!jsonData?.id) {
      setMessageModal({ type: 'error', message: 'Thiếu mã thùng (trashBinCode).' });
      return null;
    }

    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/trash-weighings/check`, {
        params: {
          trashBinCode: jsonData.id,
          workShift,
          workDate
        }
      });
      return res.data;
    } catch (error) {
      console.error('❌ Lỗi kiểm tra cân:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!khoiLuong || isNaN(parseFloat(khoiLuong))) {
      setMessageModal({ type: 'error', message: 'Vui lòng nhập khối lượng hợp lệ' });
      return;
    }
    if (!workShift || !workDate) {
      setMessageModal({ type: 'error', message: 'Vui lòng chọn ca làm và ngày làm việc' });
      return;
    }
    if (!jsonData?.id) {
      setMessageModal({ type: 'error', message: 'Thiếu mã thùng (trashBinCode).' });
      return;
    }

    setLoading(true);
    const nowUTC7 = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
    let weight = parseFloat(khoiLuong);

    // giữ block adjustments y hệt Scan (nếu cần)
    const adjustments = {
      'Giẻ lau có chứa thành phần nguy hại': 0,
      'Vụn logo': 0,
      'Mực in thải': 0,
      'Keo bàn thải': 0,
      'Băng keo dính mực': 0,
      'Rác sinh hoạt': 0,
      'Lụa căng khung': 0,
    };
    if (jsonData?.t && adjustments[jsonData.t]) weight = Math.max(0, weight - adjustments[jsonData.t]);
    weight = parseFloat(weight.toFixed(1));

    const payload = {
      trashBinCode: jsonData.id,
      userID: user?.userID,
      weighingTime: nowUTC7.toISOString(),
      weightKg: weight,
      updatedAt: nowUTC7.toISOString(),
      updatedBy: user?.userID,
      workShift: isWorkShift ? workShift : null,
      workDate: isWorkDate ? workDate : null,
      userName: tenNguoiCan || '',
    };

    try {
      // POST /trash-weighings
      const res = await axios.post(`${BASE_URL}/trash-weighings`, payload);
      if (res.status === 200) {
        const saved = res.data; // kỳ vọng { id: ... }
        const savedPayload = { ...payload, id: saved?.id, d: jsonData?.d, u: jsonData?.u, t: jsonData?.t };
        setConfirmedData(savedPayload);
        setReviewModalVisible(true);
      } else {
        const errText = await res.text?.();
        setMessageModal({ type: 'error', message: `❌ Lỗi: ${errText || 'Không thể lưu dữ liệu cân rác'}` });
      }
    } catch {
      setMessageModal({ type: 'error', message: '❌ Lỗi kết nối: Không thể kết nối đến server' });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckAndConfirm = async () => {
    if (!khoiLuong || isNaN(parseFloat(khoiLuong))) {
      setMessageModal({ type: 'error', message: 'Vui lòng nhập khối lượng hợp lệ' });
      return;
    }
    if (!workShift || !workDate) {
      setMessageModal({ type: 'error', message: 'Vui lòng chọn ca làm và ngày làm việc' });
      return;
    }

    const checkResult = await checkIfWeighed();
    if (checkResult?.alreadyWeighed && isWorkDate && isWorkShift) {
      setAlreadyWeighedData({
        id: checkResult.existingData.id,
        trashBinCode: checkResult.existingData.trashBinCode,
        workDate: checkResult.existingData.workDate.split('T')[0],
        workShift: checkResult.existingData.workShift,
        weightKg: checkResult.existingData.weightKg,
      });
    } else {
      await handleConfirm();
    }
  };

  // =========================
  // Common modal classes
  // =========================
  const overlayCls =
    'fixed inset-0 bg-slate-900/40 flex items-center justify-center z-[9999] px-3'; // px-3 để modal không đụng mép trên mobile
  const modalShellCls =
    'bg-white/90 backdrop-blur-md rounded-xl w-[92vw] max-w-md md:max-w-lg lg:max-w-xl ' +
    'h-[85dvh] md:h-[80dvh] p-0 mx-auto shadow-xl outline-none border border-white/60 ' +
    'overflow-hidden flex flex-col'; // flex cột để chia header/body/footer
  const headerCls =
    'px-4 py-3 bg-white/80 border-b border-slate-200 flex items-center justify-between shrink-0';
  const bodyScrollableCls =
    'flex-1 overflow-y-auto p-4 space-y-4 text-sm bg-white/70';
  const footerBarCls =
    'px-4 py-3 border-t border-slate-200 bg-white/80 shrink-0 flex justify-between';

      const handleBack = () => {
    if (typeof onBack === 'function') return onBack();
    if (typeof onClose === 'function') return onClose();
  };

  return (
    <>
      {/* MAIN */}
      <Modal
        isOpen={isOpen}
        onRequestClose={onClose}
        className={modalShellCls}
        overlayClassName={overlayCls}
      >
        {/* Header (cố định) */}
        <div className={headerCls}>
          <div className="font-semibold text-slate-900">Cân rác theo lựa chọn</div>
          <button
            onClick={onClose}
            className="h-8 w-8 grid place-items-center rounded-full hover:bg-slate-100 text-slate-600"
            aria-label="Đóng"
            title="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Body (scroll) */}
        <div className={bodyScrollableCls}>
          {/* Thông tin mô tả */}
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            {loading ? (
              <div className="text-slate-600">Đang tải dữ liệu…</div>
            ) : jsonData ? (
              <div className="grid gap-1">
                <div className="flex"><span className="text-slate-600 w-36">📍 Bộ phận:</span><span className="font-medium text-slate-900">{jsonData.d || '(không có)'}</span></div>
                <div className="flex"><span className="text-slate-600 w-36">🚏 Chuyền/Máy:</span><span className="font-medium text-slate-900">{jsonData.u || '(không có)'}</span></div>
                <div className="flex"><span className="text-slate-600 w-36">🗑️ Loại rác:</span><span className="font-medium text-slate-900">{jsonData.t || '(không có)'}</span></div>
              </div>
            ) : (
              <div className="text-rose-600">Không có dữ liệu.</div>
            )}
          </div>

          {/* Nhập khối lượng */}
          <div>
            <label className="block mb-1 font-semibold">⚖️ Nhập khối lượng (kg):</label>
            <input
              type="text"
              inputMode="decimal"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 outline-none"
              placeholder="VD: 5.25"
              value={khoiLuong}
              onChange={(e) => setKhoiLuong(e.target.value.replace(',', '.'))}
            />
          </div>

          {/* Ca làm */}
          <div>
            <label className="block mb-1 font-semibold">🕓 Ca làm việc:</label>
            {user?.role === 'admin' && (
              <div className="flex items-center gap-6 mb-3">
                <label className="flex items-center gap-2"><input type="radio" name="shift" checked={isWorkShift === true} onChange={() => setIsWorkShift(true)} /><span>Có ca</span></label>
                <label className="flex items-center gap-2"><input type="radio" name="shift" checked={isWorkShift === false} onChange={() => setIsWorkShift(false)} /><span>Không ca</span></label>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {isWorkShift ? (
                workShifts.map((s) => (
                  <button
                    key={s}
                    onClick={() => setWorkShift(s)}
                    className={`px-3 py-2 rounded-full text-xs border transition ${
                      workShift === s
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                    }`}
                  >
                    {s === 'ca1'
                      ? 'Ca Ngắn 1 (06–14h)'
                      : s === 'ca2'
                      ? 'Ca Ngắn 2 (14–22h)'
                      : s === 'ca3'
                      ? 'Ca Ngắn 3 (22–06h)'
                      : s === 'dai1'
                      ? 'Ca Dài 1 (06–18h)'
                      : s === 'dai2'
                      ? 'Ca Dài 2 (18–06h)'
                      : 'Hành chính (07:30–16:30)'}
                  </button>
                ))
              ) : (
                <span className="px-3 py-2 rounded-full text-xs bg-rose-100 text-rose-700 border border-rose-200">Tem không để ca</span>
              )}
            </div>
          </div>

          {/* Ngày làm việc */}
          <div>
            <label className="block mb-1 font-semibold">📅 Ngày làm việc:</label>
            {user?.role === 'admin' && (
              <div className="flex items-center gap-6 mb-3">
                <label className="flex items-center gap-2"><input type="radio" name="date" checked={isWorkDate === true} onChange={() => setIsWorkDate(true)} /><span>Có ngày</span></label>
                <label className="flex items-center gap-2"><input type="radio" name="date" checked={isWorkDate === false} onChange={() => setIsWorkDate(false)} /><span>Không ngày</span></label>
              </div>
            )}
            {isWorkDate ? (
              <input
                type="date"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 outline-none"
                value={workDate}
                onChange={(e) => setWorkDate(e.target.value)}
              />
            ) : (
              <span className="px-3 py-2 rounded-full text-xs bg-rose-100 text-rose-700 border border-rose-200">Tem không để ngày</span>
            )}
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block mb-1 font-semibold">📝 Ghi chú:</label>
            <input
              type="text"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 outline-none"
              placeholder="VD: Nguyễn Văn A"
              value={tenNguoiCan}
              onChange={(e) => setTenNguoiCan(e.target.value)}
            />
          </div>
        </div>

        {/* Footer (cố định) */}
                <div className={footerBarCls + ' items-center'}>
          {/* Left: Quay lại */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleBack}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 inline-flex items-center gap-2"
            >
              <span aria-hidden>←</span> Quay lại
            </button>
          </div>

         {/* Right: Đóng + Xác nhận */}
          <div className="flex items-center gap-2">
           <button
              onClick={onClose}
             className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
            >
              Đóng
            </button>
            <button
              onClick={handleCheckAndConfirm}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow hover:from-emerald-700 hover:to-teal-700"
              disabled={loading}
            >
              {loading ? 'Đang lưu…' : 'Xác nhận'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ĐÃ CÂN TRƯỚC ĐÓ */}
      {alreadyWeighedData && (
        <Modal
          isOpen={true}
          onRequestClose={() => setAlreadyWeighedData(null)}
          className={modalShellCls}
          overlayClassName="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] px-3"
        >
          <div className={headerCls}>
            <h2 className="text-lg font-bold">⚠️ Đã cân rác</h2>
            <button
              onClick={() => setAlreadyWeighedData(null)}
              className="h-8 w-8 grid place-items-center rounded-full hover:bg-slate-100 text-slate-600"
              aria-label="Đóng"
              title="Đóng"
            >
              ✕
            </button>
          </div>

          <div className={bodyScrollableCls}>
            <p className="text-sm text-slate-700">
              Thùng <strong>{alreadyWeighedData.trashBinCode}</strong> đã được cân trong ca <strong>{alreadyWeighedData.workShift}</strong> ngày <strong>{alreadyWeighedData.workDate}</strong>.
            </p>
            <p className="text-sm text-slate-700">⚖️ Khối lượng đã lưu: <strong>{alreadyWeighedData.weightKg} kg</strong></p>
          </div>

          <div className={footerBarCls}>
            <button
              onClick={() => {
                setAlreadyWeighedData(null);
                setLoading(false);
                setJsonData(jsonData); // giữ lại mô tả
                setKhoiLuong('');
                setMessageModal({ type: 'info', message: '⛔ Đã hủy lượt cân này!' });
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
            >
              ❌ Hủy lượt cân
            </button>
            <button
              disabled={loading}
              onClick={async () => { await handleConfirm(); setAlreadyWeighedData(null); }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow hover:from-sky-700 hover:to-blue-700"
            >
              {loading ? 'Đang lưu…' : 'Tiếp tục lưu'}
            </button>
          </div>
        </Modal>
      )}

      {/* REVIEW */}
      {reviewModalVisible && confirmedData && (
        <Modal
          isOpen={true}
          onRequestClose={() => setReviewModalVisible(false)}
          className={modalShellCls}
          overlayClassName="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] px-3"
        >
          <div className={headerCls}>
            <h2 className="text-lg font-bold">📋 Thông tin đã lưu</h2>
            <button
              onClick={() => setReviewModalVisible(false)}
              className="h-8 w-8 grid place-items-center rounded-full hover:bg-slate-100 text-slate-600"
              aria-label="Đóng"
              title="Đóng"
            >
              ✕
            </button>
          </div>

          <div className={bodyScrollableCls}>
            <div className="space-y-1 text-sm">
              <p><strong>Mã thùng rác:</strong> {confirmedData?.trashBinCode}</p>
              <div className="flex"><p className="font-semibold">📍 Bộ phận/Khu vực:</p><p className="ml-2">{confirmedData?.d || ''}</p></div>
              <div className="flex"><p className="font-semibold">🏭 Đơn vị:</p><p className="ml-2">{confirmedData?.u || ''}</p></div>
              <div className="flex"><p className="font-semibold">🗑️ Loại rác:</p><p className="ml-2">{confirmedData?.t || ''}</p></div>
              <p><strong>Khối lượng:</strong> {confirmedData?.weightKg} kg</p>
              <p>
                <strong>Ca làm:</strong>{' '}
                {isWorkShift ? (
                  confirmedData.workShift === 'ca1'
                    ? 'Ca Ngắn 1 (06–14h)'
                    : confirmedData.workShift === 'ca2'
                    ? 'Ca Ngắn 2 (14–22h)'
                    : confirmedData.workShift === 'ca3'
                    ? 'Ca Ngắn 3 (22–06h)'
                    : confirmedData.workShift === 'dai1'
                    ? 'Ca Dài 1 (06–18h)'
                    : confirmedData.workShift === 'dai2'
                    ? 'Ca Dài 2 (18–06h)'
                    : 'Hành chính (07:30–16:30)'
                ) : (
                  <span className="px-2 py-1 rounded-full text-xs bg-rose-100 text-rose-700 border border-rose-200">Tem không để ca</span>
                )}
              </p>
              <p>
                <strong>Ngày:</strong>{' '}
                {isWorkDate ? (() => {
                  const d = new Date(confirmedData.workDate);
                  const day = String(d.getDate()).padStart(2, '0');
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  const year = d.getFullYear();
                  return `${day}-${month}-${year}`;
                })() : (
                  <span className="px-2 py-1 rounded-full text-xs bg-rose-100 text-rose-700 border border-rose-200">Tem không để ngày</span>
                )}
              </p>
              <p><strong>Ghi chú:</strong> {confirmedData.userName}</p>
            </div>
          </div>

          <div className={footerBarCls}>
            <button
              onClick={() => { setReviewModalVisible(false); setEditModalVisible(true); }}
              className="px-4 py-2 rounded-xl bg-amber-500 text-white hover:bg-amber-600"
            >
              ✏️ Chỉnh sửa
            </button>
            <button
              onClick={() => { setReviewModalVisible(false); setMessageModal({ type: 'success', message: '✅ Đã lưu dữ liệu cân rác thành công!' }); }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700"
            >
              ✅ Tiếp tục
            </button>
          </div>
        </Modal>
      )}

      {/* EDIT */}
      {editModalVisible && confirmedData && (
        <Modal
          isOpen={true}
          onRequestClose={() => setEditModalVisible(false)}
          className={modalShellCls}
          overlayClassName="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] px-3"
        >
          <div className={headerCls}>
            <h2 className="text-lg font-bold">✏️ Chỉnh sửa thông tin</h2>
            <button
              onClick={() => setEditModalVisible(false)}
              className="h-8 w-8 grid place-items-center rounded-full hover:bg-slate-100 text-slate-600"
              aria-label="Đóng"
              title="Đóng"
            >
              ✕
            </button>
          </div>

          <div className={bodyScrollableCls}>
            <div className="text-sm space-y-3">
              <div>
                <label className="block mb-1 font-semibold">⚖️ Khối lượng:</label>
                <input
                  type="text"
                  inputMode="decimal"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 outline-none"
                  value={confirmedData.weightKg}
                  onChange={(e) => setConfirmedData({ ...confirmedData, weightKg: parseFloat(e.target.value.replace(',', '.')) || 0 })}
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold">🕓 Ca làm:</label>
                {isWorkShift ? (
                  <select
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 outline-none"
                    value={confirmedData.workShift}
                    onChange={(e) => setConfirmedData({ ...confirmedData, workShift: e.target.value })}
                  >
                    <option value="ca1">Ca Ngắn 1 (06–14h)</option>
                    <option value="ca2">Ca Ngắn 2 (14–22h)</option>
                    <option value="ca3">Ca Ngắn 3 (22–06h)</option>
                    <option value="dai1">Ca Dài 1 (06–18h)</option>
                    <option value="dai2">Ca Dài 2 (18–06h)</option>
                    <option value="cahc">Hành chính (07:30–16:30)</option>
                  </select>
                ) : (
                  <span className="px-3 py-2 rounded-full text-xs bg-rose-100 text-rose-700 border border-rose-200">Tem không để ca</span>
                )}
              </div>

              <div>
                <label className="block mb-1 font-semibold">📅 Ngày làm việc:</label>
                {isWorkDate ? (
                  <input
                    type="date"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 outline-none"
                    value={(confirmedData.workDate || '').slice(0, 10)}
                    onChange={(e) => setConfirmedData({ ...confirmedData, workDate: e.target.value })}
                  />
                ) : (
                  <span className="px-3 py-2 rounded-full text-xs bg-rose-100 text-rose-700 border border-rose-200">Tem không để ngày</span>
                )}
              </div>

              <div>
                <label className="block mb-1 font-semibold">Ghi chú:</label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 outline-none"
                  value={confirmedData.userName}
                  onChange={(e) => setConfirmedData({ ...confirmedData, userName: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className={footerBarCls}>
            <button
              onClick={() => { setEditModalVisible(false); setMessageModal({ type: 'success', message: '✅ Đã lưu dữ liệu cân rác thành công!' }); }}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
            >
              ❌ Hủy
            </button>
            <button
              onClick={async () => {
                setIsSaving(true);
                const nowUTC7 = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
                try {
                  const res = await axios.put(`${BASE_URL}/trash-weighings/${confirmedData.id}`, {
                    ...confirmedData,
                    updatedAt: nowUTC7.toISOString(),
                    updatedBy: user?.userID
                  });
                  if (res.status === 200) setMessageModal({ type: 'success', message: '✅ Đã chỉnh sửa dữ liệu thành công!' });
                  else setMessageModal({ type: 'error', message: `❌ Lỗi: ${await res.text?.()}` });
                } catch {
                  setMessageModal({ type: 'error', message: '❌ Không thể kết nối server!' });
                } finally {
                  setEditModalVisible(false);
                  setIsSaving(false);
                }
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow hover:from-sky-700 hover:to-blue-700"
              disabled={isSaving}
            >
              {isSaving ? 'Đang lưu…' : '💾 Lưu'}
            </button>
          </div>
        </Modal>
      )}

      {/* TOAST nhỏ */}
      {messageModal && (
        <Modal
          isOpen={true}
          onRequestClose={() => setMessageModal(null)}
          className="bg-white/95 backdrop-blur-md rounded-2xl w-[92vw] max-w-md md:max-w-lg h-auto p-6 mx-auto shadow-xl outline-none border border-white/60 overflow-hidden"
          overlayClassName="fixed inset-0 bg-black/30 flex items-center justify-center z-[9999] px-3"
        >
          <p
            className={`text-sm ${
              messageModal.type === 'error' ? 'text-rose-600' :
              messageModal.type === 'success' ? 'text-emerald-600' : 'text-slate-700'
            }`}
          >
            {messageModal.message}
          </p>
          <div className="flex justify-end pt-4">
            <button onClick={() => {
                setMessageModal(null);
                setSummaryOpen(false);
                openWeigh();
            }} className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800">
              Đóng
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

