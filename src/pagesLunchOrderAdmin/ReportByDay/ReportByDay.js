// import React, { useEffect, useMemo, useState } from "react";
// import { BASE_URL } from "~/config";
// import http from "~/api/http";

// function normalizeRow(raw) {
//   return {
//     userWeeklySelectionId:
//       raw.userWeeklySelectionId ??
//       raw.UserWeeklySelectionId ??
//       null,

//     weeklyMenuEntryId:
//       raw.weeklyMenuEntryId ??
//       raw.WeeklyMenuEntryId ??
//       null,

//     userID:
//       raw.userID ??
//       raw.UserID ??
//       null,

//     branchId:
//       raw.branchId ??
//       raw.BranchId ??
//       0,

//     quantity:
//       raw.quantity ??
//       raw.Quantity ??
//       0,

//     departmentId:
//       raw.departmentId ??
//       raw.DepartmentId ??
//       0,

//     departmentName:
//       raw.departmentName ??
//       raw.DepartmentName ??
//       "Chưa gán",

//     foodId:
//       raw.foodId ??
//       raw.FoodId ??
//       null,

//     foodName:
//       raw.foodName ??
//       raw.FoodName ??
//       "",

//     fullName:
//       raw.fullName ??
//       raw.FullName ??
//       "",

//     branchName:
//       raw.branchName ??
//       raw.BranchName ??
//       "",

//     isLocked:
//       raw.isLocked ??
//       raw.IsLocked ??
//       0,
//   };
// }

// function EditSelectionModal({
//   open,
//   onClose,
//   records,
//   cellTitle,
//   onSave,
//   saving,
//   onError
// }) {
//   const [selectedRecordId, setSelectedRecordId] = useState(null);
//   const [quantity, setQuantity] = useState("");

//   useEffect(() => {
//     if (!open) {
//       setSelectedRecordId(null);
//       setQuantity("");
//       return;
//     }

//     if (records?.length === 1) {
//       const row = records[0];
//       setSelectedRecordId(row.userWeeklySelectionId);
//       setQuantity(String(row.quantity ?? 0));
//     } else {
//       setSelectedRecordId(null);
//       setQuantity("");
//     }
//   }, [open, records]);

//   const selectedRow = useMemo(() => {
//     return (records || []).find(
//       (r) => String(r.userWeeklySelectionId) === String(selectedRecordId)
//     );
//   }, [records, selectedRecordId]);

//   const handleSubmit = async () => {
//     if (!selectedRow) {
//       onError?.("Vui lòng chọn 1 dòng để chỉnh sửa");
//       return;
//     }

//     const qty = Number(quantity);
//     if (!Number.isFinite(qty) || qty <= 0) {
//       onError?.("Số lượng không hợp lệ");
//       return;
//     }

//     await onSave({
//       userWeeklySelectionId: selectedRow.userWeeklySelectionId,
//       weeklyMenuEntryId: selectedRow.weeklyMenuEntryId,
//       userID: selectedRow.userID,
//       branchId: selectedRow.branchId ?? 0,
//       quantity: qty,
//     });
//   };

//   if (!open) return null;

//   return (
//     <div className="fixed inset-0 z-[200]">
//       <div
//         className="absolute inset-0 bg-slate-900/45 backdrop-blur-[1px]"
//         onClick={onClose}
//       />

//       <div className="absolute inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center p-0 sm:p-4">
//         <div className="w-full sm:max-w-3xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
//           <div className="flex items-start justify-between px-4 sm:px-6 py-5 border-b bg-slate-50">
//             <div className="pr-3">
//               <h3 className="text-xl font-bold text-slate-900">
//                 Chỉnh sửa số lượng
//               </h3>
//               <p className="text-sm text-slate-500 mt-1">{cellTitle}</p>
//             </div>

//             <button
//               type="button"
//               onClick={onClose}
//               className="h-11 w-11 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 text-xl shrink-0"
//             >
//               ×
//             </button>
//           </div>

//           <div className="p-4 sm:p-6 overflow-auto space-y-5">
//             <div className="rounded-3xl border border-slate-200 overflow-hidden">
//               <div className="px-5 py-4 bg-slate-50 border-b text-lg font-semibold text-slate-700">
//                 Danh sách bản ghi trong ô
//               </div>

//               {!records || records.length === 0 ? (
//                 <div className="px-5 py-8 text-sm text-slate-500 text-center">
//                   Không có dữ liệu trong ô này
//                 </div>
//               ) : (
//                 <div className="max-h-[280px] overflow-auto divide-y">
//                   {records.map((row, idx) => {
//                     const active =
//                       String(selectedRecordId) ===
//                       String(row.userWeeklySelectionId);

//                     return (
//                       <button
//                         key={row.userWeeklySelectionId || idx}
//                         type="button"
//                         onClick={() =>
//                           !row.isLocked &&
//                           (() => {
//                             setSelectedRecordId(row.userWeeklySelectionId);
//                             setQuantity(String(row.quantity ?? 0));
//                           })()
//                         }
//                         className={`w-full text-left px-5 py-4 transition ${
//                           row.isLocked
//                             ? "bg-slate-50 cursor-not-allowed opacity-70"
//                             : active
//                             ? "bg-emerald-50"
//                             : "bg-white hover:bg-slate-50"
//                         }`}
//                       >
//                         <div className="flex items-start justify-between gap-3">
//                           <div className="min-w-0">
//                             <div className="text-base font-semibold text-slate-900">
//                               UserID: {row.userID ?? "-"}
//                               {row.fullName ? ` - ${row.fullName}` : ""}
//                             </div>

//                             <div className="mt-2 text-sm text-slate-500 break-all">
//                               weeklyMenuEntryId: {row.weeklyMenuEntryId ?? "-"} | branchId:{" "}
//                               {row.branchId ?? 0} | selectionId:{" "}
//                               {row.userWeeklySelectionId ?? "-"}
//                             </div>

//                             {row.isLocked ? (
//                               <div className="mt-2 inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-600">
//                                 Đã khóa
//                               </div>
//                             ) : null}
//                           </div>

//                           <div className="shrink-0">
//                             <span className="inline-flex items-center rounded-full bg-white border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700">
//                               SL: {row.quantity ?? 0}
//                             </span>
//                           </div>
//                         </div>
//                       </button>
//                     );
//                   })}
//                 </div>
//               )}
//             </div>

//             <div className="rounded-3xl border border-slate-200 p-5">
//               <div className="text-lg font-semibold text-slate-700 mb-4">
//                 Số lượng mới
//               </div>

//               {!selectedRow ? (
//                 <div className="text-sm text-slate-500">
//                   Chọn 1 bản ghi phía trên để chỉnh sửa
//                 </div>
//               ) : (
//                 <div className="space-y-4">
//                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
//                     <div className="rounded-2xl bg-slate-50 px-4 py-3 text-slate-700">
//                       <span className="text-slate-500">UserID:</span>{" "}
//                       <span className="font-semibold">
//                         {selectedRow.userID ?? "-"}
//                       </span>
//                     </div>

//                     <div className="rounded-2xl bg-slate-50 px-4 py-3 text-slate-700">
//                       <span className="text-slate-500">Branch:</span>{" "}
//                       <span className="font-semibold">
//                         {selectedRow.branchId ?? 0}
//                       </span>
//                     </div>
//                   </div>

//                   <input
//                     type="number"
//                     min="0"
//                     value={quantity}
//                     onChange={(e) => setQuantity(e.target.value)}
//                     disabled={selectedRow.isLocked}
//                     className="w-full rounded-2xl border border-slate-300 px-4 py-4 outline-none focus:ring-2 focus:ring-emerald-400 text-lg disabled:bg-slate-100"
//                     placeholder="Nhập số lượng"
//                   />
//                 </div>
//               )}
//             </div>
//           </div>

//           <div className="border-t bg-white px-4 sm:px-6 py-5">
//             <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
//               <button
//                 type="button"
//                 onClick={onClose}
//                 className="w-full sm:w-auto px-6 py-3 rounded-2xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
//               >
//                 Đóng / Hủy
//               </button>

//               <button
//                 type="button"
//                 onClick={handleSubmit}
//                 disabled={saving || !selectedRow || selectedRow?.isLocked}
//                 className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 font-semibold"
//               >
//                 {saving ? "Đang lưu..." : "Lưu"}
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// function NoticeModal({ open, title, message, onClose }) {
//   if (!open) return null;

//   return (
//     <div className="fixed inset-0 z-[300] flex items-center justify-center">
//       <div
//         className="absolute inset-0 bg-black/40"
//         onClick={onClose}
//       />

//       <div className="relative bg-white rounded-2xl shadow-xl w-[90%] max-w-md p-5">
//         <h3 className="text-lg font-semibold text-slate-800 mb-2">
//           {title}
//         </h3>

//         <p className="text-sm text-slate-600 mb-4">
//           {message}
//         </p>

//         <div className="flex justify-end">
//           <button
//             onClick={onClose}
//             className="px-4 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600"
//           >
//             OK
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// function ReportByDay() {
//   const [notice, setNotice] = useState({
//     open: false,
//     title: "",
//     message: "",
//   });
//   const [selectedDate, setSelectedDate] = useState("");
//   const [foods, setFoods] = useState([]);
//   const [rows, setRows] = useState([]);
//   const [departments, setDepartments] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [statusType, setStatusType] = useState("re");

//   const [editOpen, setEditOpen] = useState(false);
//   const [editRecords, setEditRecords] = useState([]);
//   const [editCellTitle, setEditCellTitle] = useState("");
//   const [savingEdit, setSavingEdit] = useState(false);

//   useEffect(() => {
//     const today = new Date();
//     const iso = today.toISOString().split("T")[0];
//     setSelectedDate(iso);
//   }, []);

//   const fetchReport = async () => {
//     if (!selectedDate) return;

//     try {
//       setLoading(true);

//       const rs = await http.get(
//         `${BASE_URL}/api/lunch-order/report/by-date/${selectedDate}?statusType=${statusType}`
//       );

//       if (rs.data?.success && rs.data?.data) {
//         setFoods(rs.data.data.foods || []);
//         setRows((rs.data.data.rows || []).map(normalizeRow));
//         setDepartments(rs.data.data.departments || []);
//       } else {
//         setFoods([]);
//         setRows([]);
//         setDepartments([]);
//       }
//     } catch (err) {
//       console.error(err);
//       setFoods([]);
//       setRows([]);
//       setDepartments([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchReport();
//   }, [selectedDate, statusType]);

//   const flatFoods = useMemo(() => {
//     const result = [];

//     foods.forEach((f) => {
//       if (!f.branches || f.branches.length === 0) {
//         result.push({
//           key: `${f.foodId}_0`,
//           foodId: f.foodId,
//           foodName: f.foodName,
//           branchId: 0,
//           branchName: "",
//         });
//       } else {
//         f.branches.forEach((b) => {
//           result.push({
//             key: `${f.foodId}_${b.branchId || 0}`,
//             foodId: f.foodId,
//             foodName: f.foodName,
//             branchId: b.branchId || 0,
//             branchName: b.branchName || "",
//           });
//         });
//       }
//     });

//     return result;
//   }, [foods]);

//   const reportMatrix = useMemo(() => {
//     const map = {};

//     for (const row of rows) {
//       const dept = row.departmentName || "Chưa gán";
//       const key = `${row.foodId}_${row.branchId || 0}`;

//       if (!map[dept]) map[dept] = {};
//       if (!map[dept][key]) {
//         map[dept][key] = {
//           total: 0,
//           items: [],
//         };
//       }

//       map[dept][key].total += Number(row.quantity || 0);
//       map[dept][key].items.push(row);
//     }

//     return map;
//   }, [rows]);

//   const departmentNames = useMemo(() => {
//     if (departments?.length > 0) {
//       return departments.map((d) => d.departmentName || "Chưa gán");
//     }

//     const setDept = new Set(rows.map((r) => r.departmentName || "Chưa gán"));
//     return Array.from(setDept).sort((a, b) => a.localeCompare(b, "vi"));
//   }, [rows, departments]);

//   const getCellData = (dept, key) => {
//     return reportMatrix?.[dept]?.[key] || { total: 0, items: [] };
//   };

//   const getRowTotal = (dept) =>
//     flatFoods.reduce((sum, f) => sum + (getCellData(dept, f.key).total || 0), 0);

//   const getColumnTotal = (key) =>
//     departmentNames.reduce((sum, d) => sum + (getCellData(d, key).total || 0), 0);

//   const getGrandTotal = () =>
//     departmentNames.reduce((sum, d) => sum + getRowTotal(d), 0);

//   const formatHeader = () => {
//     if (!selectedDate) return "";

//     const d = new Date(selectedDate);
//     const days = [
//       "Chủ nhật",
//       "Thứ 2",
//       "Thứ 3",
//       "Thứ 4",
//       "Thứ 5",
//       "Thứ 6",
//       "Thứ 7",
//     ];

//     return `${days[d.getDay()]} - ${d.toLocaleDateString("vi-VN")}`;
//   };

//   const openEditModal = ({ dept, foodName, branchName, items }) => {
//     setEditCellTitle(
//       `${dept} • ${foodName}${branchName ? ` • ${branchName}` : ""}`
//     );
//     setEditRecords(items || []);
//     setEditOpen(true);
//   };

//   const closeEditModal = () => {
//     if (savingEdit) return;
//     setEditOpen(false);
//     setEditRecords([]);
//     setEditCellTitle("");
//   };

//   const handleSaveEdit = async (payload) => {
//     try {
//       setSavingEdit(true);

//       const rs = await http.put(
//         `${BASE_URL}/api/lunch-order/weekly-selection/update-quantity-by-type`,
//         {
//           ...payload,
//           statusType,
//           updatedBy: "admin",
//         }
//       );

//       if (!rs.data?.success) {
//         throw new Error(rs.data?.message || "Cập nhật thất bại");
//       }

//       await fetchReport();
//       closeEditModal();
//     } catch (err) {
//       console.error(err);
//       setNotice({
//         open: true,
//         title: "Lỗi",
//         message:
//           err?.response?.data?.message ||
//           err.message ||
//           "Lưu thất bại",
//       });
//     } finally {
//       setSavingEdit(false);
//     }
//   };

//   return (
//     <div className="p-2 sm:p-4 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
//       <div className="bg-white rounded-xl p-3 sm:p-4">
//         <div className="flex flex-col gap-4 mb-6">
//           <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
//             <div>
//               <h2 className="text-base sm:text-xl font-bold text-slate-800">
//                 📊 Báo cáo suất ăn
//               </h2>

//               <div className="text-emerald-600 font-medium text-xs sm:text-sm mt-1">
//                 {formatHeader()}
//               </div>
//             </div>

//             <input
//               type="date"
//               value={selectedDate}
//               onChange={(e) => setSelectedDate(e.target.value)}
//               onClick={(e) => e.target.showPicker?.()}
//               className="border border-slate-300 px-2.5 py-1.5 rounded-lg focus:ring-2 focus:ring-emerald-400 text-xs sm:text-sm cursor-pointer w-full sm:w-auto"
//             />
//           </div>

//           <div className="flex justify-start">
//             <div className="flex bg-slate-100 rounded-lg p-1 w-full sm:w-auto">
//               <button
//                 onClick={() => setStatusType("re")}
//                 className={`flex-1 sm:flex-none px-3 py-1.5 text-xs sm:text-sm rounded-md transition-all ${
//                   statusType === "re"
//                     ? "bg-emerald-500 text-white shadow"
//                     : "text-slate-600 hover:bg-white"
//                 }`}
//               >
//                 Ca ngày
//               </button>

//               <button
//                 onClick={() => setStatusType("ws")}
//                 className={`flex-1 sm:flex-none px-3 py-1.5 text-xs sm:text-sm rounded-md transition-all ${
//                   statusType === "ws"
//                     ? "bg-blue-500 text-white shadow"
//                     : "text-slate-600 hover:bg-white"
//                 }`}
//               >
//                 Đi ca
//               </button>

//               <button
//                 onClick={() => setStatusType("ot")}
//                 className={`flex-1 sm:flex-none px-3 py-1.5 text-xs sm:text-sm rounded-md transition-all ${
//                   statusType === "ot"
//                     ? "bg-orange-500 text-white shadow"
//                     : "text-slate-600 hover:bg-white"
//                 }`}
//               >
//                 Tăng ca
//               </button>
//             </div>
//           </div>
//         </div>

//         {loading ? (
//           <div className="text-center py-12 text-slate-500">
//             Đang tải dữ liệu...
//           </div>
//         ) : flatFoods.length === 0 ? (
//           <div className="text-center py-12 text-slate-400">
//             Không có dữ liệu
//           </div>
//         ) : (
//           <div className="overflow-auto border rounded-lg max-h-[82vh]">
//             <table className="min-w-max w-full text-[10px] sm:text-[11px] border-collapse">
//               <thead className="sticky top-0 z-20 bg-white shadow-sm">
//                 <tr className="bg-slate-100">
//                   <th
//                     rowSpan={2}
//                     className="sticky left-0 z-30 bg-slate-100 border px-2 py-1.5 text-left min-w-[92px] max-w-[92px]"
//                   >
//                     Bộ phận
//                   </th>

//                   {foods.map((f) => (
//                     <th
//                       key={f.foodId}
//                       colSpan={f.branches?.length || 1}
//                       className="border px-1.5 sm:px-2 py-1.5 text-center font-semibold whitespace-nowrap"
//                     >
//                       {f.foodName}
//                     </th>
//                   ))}

//                   <th
//                     rowSpan={2}
//                     className="sticky right-0 z-30 bg-emerald-100 border px-2 py-1.5 text-center min-w-[52px]"
//                   >
//                     Tổng
//                   </th>
//                 </tr>

//                 <tr className="bg-slate-50">
//                   {foods.map((f) =>
//                     f.branches && f.branches.length > 0 ? (
//                       f.branches.map((b) => (
//                         <th
//                           key={`${f.foodId}_${b.branchId}`}
//                           className="border px-1.5 py-1 text-center whitespace-nowrap text-[10px]"
//                         >
//                           {b.branchName}
//                         </th>
//                       ))
//                     ) : (
//                       <th
//                         key={`${f.foodId}_empty`}
//                         className="border px-2 py-2"
//                       />
//                     )
//                   )}
//                 </tr>
//               </thead>

//               <tbody>
//                 {departmentNames.map((dept, index) => (
//                   <tr
//                     key={dept}
//                     className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
//                   >
//                     <td className="sticky left-0 bg-white border px-2 py-1.5 font-medium min-w-[92px] max-w-[92px] truncate">
//                       {dept}
//                     </td>

//                     {foods.map((f) =>
//                       f.branches && f.branches.length > 0 ? (
//                         f.branches.map((b) => {
//                           const key = `${f.foodId}_${b.branchId || 0}`;
//                           const cell = getCellData(dept, key);

//                           return (
//                             <td key={key} className="border px-1 py-1 text-center">
//                               <button
//                                 type="button"
//                                 onClick={() =>
//                                   openEditModal({
//                                     dept,
//                                     foodName: f.foodName,
//                                     branchName: b.branchName,
//                                     items: cell.items,
//                                   })
//                                 }
//                                 className={`w-full min-h-[28px] rounded-md px-1 py-1 transition ${
//                                   cell.total > 0
//                                     ? "hover:bg-emerald-50"
//                                     : "hover:bg-slate-100"
//                                 }`}
//                                 title="Bấm để chỉnh sửa"
//                               >
//                                 <div className="font-medium text-slate-800">
//                                   {cell.total || 0}
//                                 </div>
//                               </button>
//                             </td>
//                           );
//                         })
//                       ) : (
//                         (() => {
//                           const key = `${f.foodId}_0`;
//                           const cell = getCellData(dept, key);

//                           return (
//                             <td key={key} className="border px-0.5 py-0.5 text-center">
//                               <button
//                                 type="button"
//                                 onClick={() =>
//                                   openEditModal({
//                                     dept,
//                                     foodName: f.foodName,
//                                     branchName: "",
//                                     items: cell.items,
//                                   })
//                                 }
//                                 className={`w-full min-h-[28px] rounded-md px-1 py-1 transition ${
//                                   cell.total > 0
//                                     ? "hover:bg-emerald-50"
//                                     : "hover:bg-slate-100"
//                                 }`}
//                                 title="Bấm để chỉnh sửa"
//                               >
//                                 <div className="font-medium text-slate-800">
//                                   {cell.total || 0}
//                                 </div>
//                               </button>
//                             </td>
//                           );
//                         })()
//                       )
//                     )}

//                     <td className="sticky right-0 bg-emerald-50 border px-2 py-2 text-center font-semibold">
//                       {getRowTotal(dept)}
//                     </td>
//                   </tr>
//                 ))}

//                 <tr className="bg-slate-200 font-semibold">
//                   <td className="sticky left-0 bg-slate-200 border px-3 py-2">
//                     Tổng
//                   </td>

//                   {flatFoods.map((f) => (
//                     <td key={f.key} className="border px-2 py-2 text-center">
//                       {getColumnTotal(f.key)}
//                     </td>
//                   ))}

//                   <td className="sticky right-0 bg-emerald-200 border px-3 py-2 text-center">
//                     {getGrandTotal()}
//                   </td>
//                 </tr>
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>

//       <EditSelectionModal
//         open={editOpen}
//         onClose={closeEditModal}
//         records={editRecords}
//         cellTitle={editCellTitle}
//         onSave={handleSaveEdit}
//         saving={savingEdit}
//         onError={(msg) =>
//           setNotice({
//             open: true,
//             title: "Thông báo",
//             message: msg,
//           })
//         }
//       />

//       <NoticeModal
//         open={notice.open}
//         title={notice.title}
//         message={notice.message}
//         onClose={() =>
//           setNotice({ open: false, title: "", message: "" })
//         }
//       />
//     </div>
//   );
// }

// export default ReportByDay;




import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { BASE_URL } from "~/config";
import http from "~/api/http";
import { userSelector } from "~/redux/selectors";
import { FaLock } from "react-icons/fa";

function normalizeRow(raw) {
  return {
    userWeeklySelectionId:
      raw.userWeeklySelectionId ?? raw.UserWeeklySelectionId ?? null,

    weeklyMenuEntryId:
      raw.weeklyMenuEntryId ?? raw.WeeklyMenuEntryId ?? null,

    userID: raw.userID ?? raw.UserID ?? null,

    branchId: Number(raw.branchId ?? raw.BranchId ?? 0),

    quantity: Number(raw.quantity ?? raw.Quantity ?? 0),

    departmentId: raw.departmentId ?? raw.DepartmentId ?? 0,

    departmentName:
      raw.departmentName ?? raw.DepartmentName ?? "Chưa gán",

    foodId: raw.foodId ?? raw.FoodId ?? null,

    foodName: raw.foodName ?? raw.FoodName ?? "",

    fullName: raw.fullName ?? raw.FullName ?? "",

    branchName: raw.branchName ?? raw.BranchName ?? "",

    isLocked: Number(raw.isLocked ?? raw.IsLocked ?? 0),
  };
}

function NoticeModal({ open, title, message, onClose, tone = "success" }) {
  if (!open) return null;

  const btnClass =
    tone === "error"
      ? "bg-rose-500 hover:bg-rose-600"
      : tone === "warning"
      ? "bg-amber-500 hover:bg-amber-600"
      : "bg-emerald-500 hover:bg-emerald-600";

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b bg-slate-50">
          <h3 className="text-base sm:text-lg font-bold text-slate-800">
            {title}
          </h3>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-slate-600 whitespace-pre-line">
            {message}
          </p>
        </div>
        <div className="px-5 py-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-white text-sm font-semibold ${btnClass}`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

function EditSelectionModal({
  open,
  onClose,
  records,
  cellTitle,
  onSave,
  saving,
  onError,
}) {
  const [selectedKey, setSelectedKey] = useState(null);
  const [quantity, setQuantity] = useState("");

  useEffect(() => {
    if (!open) {
      setSelectedKey(null);
      setQuantity("");
      return;
    }

    if (records?.length === 1) {
      const row = records[0];
      const key =
  row.userWeeklySelectionId ??
  row.__tempKey ??
  `new_${row.weeklyMenuEntryId}_${row.userID}_${row.branchId ?? 0}`;
      setSelectedKey(String(key));
      setQuantity(String(row.quantity ?? 0));
    } else {
      setSelectedKey(null);
      setQuantity("");
    }
  }, [open, records]);

  const selectedRow = useMemo(() => {
    return (records || []).find((row, idx) => {
      const key =
  row.userWeeklySelectionId ??
  row.__tempKey ??
  `new_${row.weeklyMenuEntryId}_${row.userID}_${row.branchId ?? 0}_${idx}`;
      return String(key) === String(selectedKey);
    });
  }, [records, selectedKey]);

  const handleSubmit = async () => {
    if (!selectedRow) {
      onError?.("Vui lòng chọn 1 dòng để chỉnh sửa");
      return;
    }

    const qty = Number(quantity);

    if (!Number.isFinite(qty) || qty < 0) {
      onError?.("Số lượng không hợp lệ. Chỉ nhận số từ 0 trở lên.");
      return;
    }

    await onSave({
      userWeeklySelectionId: selectedRow.userWeeklySelectionId,
      weeklyMenuEntryId: selectedRow.weeklyMenuEntryId,
      userID: selectedRow.userID,
      branchId: selectedRow.branchId ?? 0,
      quantity: qty,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200]">
      <div
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[1px]"
        onClick={onClose}
      />

      <div className="absolute inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center p-0 sm:p-4">
        <div className="w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
          <div className="flex items-start justify-between px-4 sm:px-5 py-4 border-b bg-slate-50">
            <div className="pr-3">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                Chỉnh sửa số lượng
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {cellTitle}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="h-10 w-10 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 text-lg shrink-0"
            >
              ×
            </button>
          </div>

          <div className="p-3 sm:p-5 overflow-auto space-y-4">
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b text-sm sm:text-base font-semibold text-slate-700">
                Danh sách bản ghi trong ô
              </div>

              {!records || records.length === 0 ? (
                <div className="px-4 py-6 text-sm text-slate-500 text-center">
                  Không có dữ liệu trong ô này
                </div>
              ) : (
                <div className="max-h-[240px] overflow-auto divide-y">
                  {records.map((row, idx) => {
                    const key =
  row.userWeeklySelectionId ??
  row.__tempKey ??
  `new_${row.weeklyMenuEntryId}_${row.userID}_${row.branchId ?? 0}_${idx}`;
                    const active = String(selectedKey) === String(key);

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setSelectedKey(String(key));
                          setQuantity(String(row.quantity ?? 0));
                        }}
                        className={`w-full text-left px-4 py-3 transition ${
                          active
                            ? "bg-emerald-50"
                            : row.isLocked === 1
                            ? "bg-emerald-50/70 hover:bg-emerald-50"
                            : "bg-white hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm sm:text-base font-semibold text-slate-900 truncate">
                              UserID: {row.userID ?? "-"}
                              {row.fullName ? ` - ${row.fullName}` : ""}
                            </div>

                            <div className="mt-1 text-[11px] sm:text-xs text-slate-500 break-all">
                              weeklyMenuEntryId: {row.weeklyMenuEntryId ?? "-"}{" "}
                              | branchId: {row.branchId ?? 0} | selectionId:{" "}
                              {row.userWeeklySelectionId ?? "Chưa có"}
                            </div>

                            {row.isLocked === 1 ? (
                              <div className="mt-2 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                                Đang khóa
                              </div>
                            ) : null}
                          </div>

                          <div className="shrink-0">
                            <span className="inline-flex items-center rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
                              SL: {row.quantity ?? 0}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="text-sm sm:text-base font-semibold text-slate-700 mb-3">
                Số lượng mới
              </div>

              {!selectedRow ? (
                <div className="text-sm text-slate-500">
                  Chọn 1 bản ghi phía trên để chỉnh sửa
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div className="rounded-xl bg-slate-50 px-3 py-2 text-slate-700">
                      <span className="text-slate-500">UserID:</span>{" "}
                      <span className="font-semibold">
                        {selectedRow.userID ?? "-"}
                      </span>
                    </div>

                    <div className="rounded-xl bg-slate-50 px-3 py-2 text-slate-700">
                      <span className="text-slate-500">Branch:</span>{" "}
                      <span className="font-semibold">
                        {selectedRow.branchId ?? 0}
                      </span>
                    </div>
                  </div>

                  <input
                    type="number"
                    min="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-3 outline-none focus:ring-2 focus:ring-emerald-400 text-base"
                    placeholder="Nhập số lượng (0 sẽ xóa)"
                  />

                  <div className="text-xs text-slate-500">
                    Nhập <span className="font-semibold">0</span> để xóa bản ghi,
                    nhập lớn hơn 0 để thêm/cập nhật.
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t bg-white px-4 sm:px-5 py-4">
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-sm"
              >
                Đóng / Hủy
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving || !selectedRow}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 font-semibold text-sm"
              >
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportByDay() {
  const authUser = useSelector(userSelector);

  const currentLoginUserId = authUser?.login?.currentUser?.userID;

  const [notice, setNotice] = useState({
    open: false,
    title: "",
    message: "",
    tone: "success",
  });

  const [selectedDate, setSelectedDate] = useState("");
  const [foods, setFoods] = useState([]);
  const [rows, setRows] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusType, setStatusType] = useState("re");

  const [editOpen, setEditOpen] = useState(false);
  const [editRecords, setEditRecords] = useState([]);
  const [editCellTitle, setEditCellTitle] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    const today = new Date();
    const iso = today.toISOString().split("T")[0];
    setSelectedDate(iso);
  }, []);

  const fetchReport = async () => {
    if (!selectedDate) return;

    try {
      setLoading(true);

      const rs = await http.get(
        `${BASE_URL}/api/lunch-order/report/by-date/${selectedDate}?statusType=${statusType}`
      );

      if (rs.data?.success && rs.data?.data) {
        setFoods(rs.data.data.foods || []);
        setRows((rs.data.data.rows || []).map(normalizeRow));
        setDepartments(rs.data.data.departments || []);
      } else {
        setFoods([]);
        setRows([]);
        setDepartments([]);
      }
    } catch (err) {
      console.error(err);
      setFoods([]);
      setRows([]);
      setDepartments([]);
      setNotice({
        open: true,
        title: "Lỗi",
        message: err?.response?.data?.message || "Không tải được dữ liệu",
        tone: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedDate, statusType]);

  const flatFoods = useMemo(() => {
  const result = [];

  foods.forEach((f) => {
    if (!f.branches || f.branches.length === 0) {
      result.push({
        key: `${f.foodId}_0`,
        foodId: f.foodId,
        foodName: f.foodName,
        weeklyMenuEntryId: null,
        branchId: 0,
        branchName: "",
      });
    } else {
      f.branches.forEach((b) => {
        result.push({
          key: `${f.foodId}_${b.branchId || 0}`,
          foodId: f.foodId,
          foodName: f.foodName,
          weeklyMenuEntryId: b.weeklyMenuEntryId ?? null,
          branchId: b.branchId || 0,
          branchName: b.branchName || "",
        });
      });
    }
  });

  return result;
}, [foods]);

  const reportMatrix = useMemo(() => {
    const map = {};

    for (const row of rows) {
      const dept = row.departmentName || "Chưa gán";
      const key = `${row.foodId}_${row.branchId || 0}`;

      if (!map[dept]) map[dept] = {};
      if (!map[dept][key]) {
        map[dept][key] = {
          total: 0,
          items: [],
        };
      }

      map[dept][key].total += Number(row.quantity || 0);
      map[dept][key].items.push(row);
    }

    return map;
  }, [rows]);

  const departmentNames = useMemo(() => {
    if (departments?.length > 0) {
      return departments.map((d) => d.departmentName || "Chưa gán");
    }

    const setDept = new Set(rows.map((r) => r.departmentName || "Chưa gán"));
    return Array.from(setDept).sort((a, b) => a.localeCompare(b, "vi"));
  }, [rows, departments]);

  const getCellData = (dept, key) => {
    return reportMatrix?.[dept]?.[key] || { total: 0, items: [] };
  };

  const getRowTotal = (dept) =>
    flatFoods.reduce((sum, f) => sum + (getCellData(dept, f.key).total || 0), 0);

  const getColumnTotal = (key) =>
    departmentNames.reduce((sum, d) => sum + (getCellData(d, key).total || 0), 0);

  const getGrandTotal = () =>
    departmentNames.reduce((sum, d) => sum + getRowTotal(d), 0);

  const hasLockedInDepartment = (dept) => {
    return flatFoods.some((f) => {
      const cell = getCellData(dept, f.key);
      return (cell.items || []).some((i) => Number(i.isLocked) === 1);
    });
  };

  const formatHeader = () => {
    if (!selectedDate) return "";

    const d = new Date(selectedDate);
    const days = [
      "Chủ nhật",
      "Thứ 2",
      "Thứ 3",
      "Thứ 4",
      "Thứ 5",
      "Thứ 6",
      "Thứ 7",
    ];

    return `${days[d.getDay()]} - ${d.toLocaleDateString("vi-VN")}`;
  };

  const buildFallbackRecordsForZeroCell = ({
  dept,
  foodName,
  weeklyMenuEntryId,
  branchId,
  branchName,
}) => {
  if (!weeklyMenuEntryId) return [];

  const sameDeptRows = rows.filter(
    (r) => (r.departmentName || "Chưa gán") === dept
  );

  const uniqueUsersMap = new Map();

  sameDeptRows.forEach((r) => {
    if (!r.userID) return;

    if (!uniqueUsersMap.has(String(r.userID))) {
      uniqueUsersMap.set(String(r.userID), {
        userID: r.userID,
        fullName: r.fullName || "",
      });
    }
  });

  return Array.from(uniqueUsersMap.values()).map((u, idx) => ({
    userWeeklySelectionId: null,
    weeklyMenuEntryId,
    userID: u.userID,
    branchId: branchId ?? 0,
    quantity: 0,
    departmentName: dept,
    foodName,
    branchName: branchName || "",
    fullName: u.fullName || "",
    isLocked: 0,
    __tempKey: `tmp_${weeklyMenuEntryId}_${u.userID}_${branchId ?? 0}_${idx}`,
  }));
};

  const openEditModal = ({
  dept,
  foodName,
  branchName,
  items,
  weeklyMenuEntryId,
  branchId,
}) => {
  let finalItems = items || [];

  if ((!finalItems || finalItems.length === 0) && weeklyMenuEntryId) {
    finalItems = buildFallbackRecordsForZeroCell({
      dept,
      foodName,
      weeklyMenuEntryId,
      branchId,
      branchName,
    });
  }

  setEditCellTitle(
    `${dept} • ${foodName}${branchName ? ` • ${branchName}` : ""}`
  );
  setEditRecords(finalItems);
  setEditOpen(true);
};

  const closeEditModal = () => {
    if (savingEdit) return;
    setEditOpen(false);
    setEditRecords([]);
    setEditCellTitle("");
  };

  const handleSaveEdit = async (payload) => {
    try {
      setSavingEdit(true);

      if (!currentLoginUserId) {
        throw new Error("Không lấy được userId đăng nhập");
      }

      const rs = await http.put(
        `${BASE_URL}/api/lunch-order/weekly-selection/update-quantity-by-type`,
        {
          ...payload,
          statusType,
          updatedBy: String(currentLoginUserId),
        }
      );

      if (!rs.data?.success) {
        throw new Error(rs.data?.message || "Lưu thất bại");
      }

      await fetchReport();
      closeEditModal();

      setNotice({
        open: true,
        title: "Thành công",
        message: rs.data?.message || "Đã lưu thành công",
        tone: "success",
      });
    } catch (err) {
      console.error(err);
      setNotice({
        open: true,
        title: "Lỗi",
        message: err?.response?.data?.message || err.message || "Lưu thất bại",
        tone: "error",
      });
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="p-2 sm:p-4 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="bg-white rounded-xl p-3 sm:p-4">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h2 className="text-base sm:text-xl font-bold text-slate-800">
                📊 Báo cáo suất ăn
              </h2>

              <div className="text-emerald-600 font-medium text-xs sm:text-sm mt-1">
                {formatHeader()}
              </div>
            </div>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              onClick={(e) => e.target.showPicker?.()}
              className="border border-slate-300 px-2.5 py-1.5 rounded-lg focus:ring-2 focus:ring-emerald-400 text-xs sm:text-sm cursor-pointer w-full sm:w-auto"
            />
          </div>

          <div className="flex justify-start">
            <div className="flex bg-slate-100 rounded-lg p-1 w-full sm:w-auto">
              <button
                onClick={() => setStatusType("re")}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-xs sm:text-sm rounded-md transition-all ${
                  statusType === "re"
                    ? "bg-emerald-500 text-white shadow"
                    : "text-slate-600 hover:bg-white"
                }`}
              >
                Ca ngày
              </button>

              <button
                onClick={() => setStatusType("ws")}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-xs sm:text-sm rounded-md transition-all ${
                  statusType === "ws"
                    ? "bg-blue-500 text-white shadow"
                    : "text-slate-600 hover:bg-white"
                }`}
              >
                Đi ca
              </button>

              <button
                onClick={() => setStatusType("ot")}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-xs sm:text-sm rounded-md transition-all ${
                  statusType === "ot"
                    ? "bg-orange-500 text-white shadow"
                    : "text-slate-600 hover:bg-white"
                }`}
              >
                Tăng ca
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-slate-500">
            Đang tải dữ liệu...
          </div>
        ) : flatFoods.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            Không có dữ liệu
          </div>
        ) : (
          <div className="overflow-auto border rounded-lg max-h-[82vh]">
            <table className="min-w-max w-full text-[10px] sm:text-[11px] border-collapse">
              <thead className="sticky top-0 z-20 bg-white shadow-sm">
                <tr className="bg-slate-100">
                  <th
                    rowSpan={2}
                    className="sticky left-0 z-30 bg-slate-100 border px-2 py-1 text-left min-w-[82px] max-w-[82px]"
                  >
                    Bộ phận
                  </th>

                  {foods.map((f) => (
                    <th
                      key={f.foodId}
                      colSpan={f.branches?.length || 1}
                      className="border px-1.5 py-1 text-center font-semibold whitespace-nowrap"
                    >
                      {f.foodName}
                    </th>
                  ))}

                  <th
                    rowSpan={2}
                    className="sticky right-0 z-30 bg-emerald-100 border px-1.5 py-1 text-center min-w-[48px]"
                  >
                    Tổng
                  </th>
                </tr>

                <tr className="bg-slate-50">
                  {foods.map((f) =>
                    f.branches && f.branches.length > 0 ? (
                      f.branches.map((b) => (
                        <th
                          key={`${f.foodId}_${b.branchId}`}
                          className="border px-1 py-0.5 text-center whitespace-nowrap text-[10px]"
                        >
                          {b.branchName}
                        </th>
                      ))
                    ) : (
                      <th
                        key={`${f.foodId}_empty`}
                        className="border px-1 py-0.5"
                      />
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {departmentNames.map((dept, index) => {
                  const rowLocked = hasLockedInDepartment(dept);

                  return (
                    <tr
                      key={dept}
                      className={
                        rowLocked
                          ? "bg-emerald-300 text-emerald-950"
                          : index % 2 === 0
                          ? "bg-white"
                          : "bg-slate-50"
                      }
                    >
                      <td className="sticky left-0 border px-2 py-1 font-medium min-w-[82px] max-w-[82px] truncate bg-inherit">
                        <div className="flex items-center gap-1.5">
                          {rowLocked && <FaLock className="text-xs shrink-0" />}
                          <span className="truncate">{dept}</span>
                        </div>
                      </td>

                      {foods.map((f) =>
                        f.branches && f.branches.length > 0 ? (
                          f.branches.map((b) => {
                            const key = `${f.foodId}_${b.branchId || 0}`;
                            const cell = getCellData(dept, key);

                            return (
                              <td
                                key={key}
                                className="border px-0.5 py-0.5 text-center bg-inherit"
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    openEditModal({
  dept,
  foodName: f.foodName,
  branchName: b.branchName,
  items: cell.items,
  weeklyMenuEntryId: b.weeklyMenuEntryId,
  branchId: b.branchId || 0,
})
                                  }
                                  className="w-full min-h-[24px] rounded-md px-1 py-0.5 transition hover:bg-black/5"
                                >
                                  <div className="font-medium leading-none">
                                    {cell.total || 0}
                                  </div>
                                </button>
                              </td>
                            );
                          })
                        ) : (
                          (() => {
                            const key = `${f.foodId}_0`;
                            const cell = getCellData(dept, key);

                            return (
                              <td
                                key={key}
                                className="border px-0.5 py-0.5 text-center bg-inherit"
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    openEditModal({
  dept,
  foodName: f.foodName,
  branchName: "",
  items: cell.items,
  weeklyMenuEntryId: f.branches?.[0]?.weeklyMenuEntryId ?? null,
  branchId: 0,
})
                                  }
                                  className="w-full min-h-[24px] rounded-md px-1 py-0.5 transition hover:bg-black/5"
                                >
                                  <div className="font-medium leading-none">
                                    {cell.total || 0}
                                  </div>
                                </button>
                              </td>
                            );
                          })()
                        )
                      )}

                      <td className="sticky right-0 border px-1 py-0.5 text-center font-semibold bg-inherit">
                        {getRowTotal(dept)}
                      </td>
                    </tr>
                  );
                })}

                <tr className="bg-slate-200 font-semibold">
                  <td className="sticky left-0 bg-slate-200 border px-2 py-1">
                    Tổng
                  </td>

                  {flatFoods.map((f) => (
                    <td key={f.key} className="border px-1 py-0.5 text-center">
                      {getColumnTotal(f.key)}
                    </td>
                  ))}

                  <td className="sticky right-0 bg-emerald-200 border px-1 py-0.5 text-center">
                    {getGrandTotal()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <EditSelectionModal
        open={editOpen}
        onClose={closeEditModal}
        records={editRecords}
        cellTitle={editCellTitle}
        onSave={handleSaveEdit}
        saving={savingEdit}
        onError={(msg) =>
          setNotice({
            open: true,
            title: "Thông báo",
            message: msg,
            tone: "warning",
          })
        }
      />

      <NoticeModal
        open={notice.open}
        title={notice.title}
        message={notice.message}
        tone={notice.tone}
        onClose={() =>
          setNotice({
            open: false,
            title: "",
            message: "",
            tone: "success",
          })
        }
      />
    </div>
  );
}

export default ReportByDay;
