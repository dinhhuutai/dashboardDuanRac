// import React, { useCallback, useEffect, useMemo, useState } from "react";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
// import {
//   FaHistory,
//   FaRedo,
//   FaSyncAlt,
//   FaChevronLeft,
//   FaChevronRight,
//   FaSearch,
//   FaRegCopy,
//   FaCheck,
//   FaTimes,
//   FaExclamationTriangle,
//   FaCheckCircle,
//   FaInfoCircle,
// } from "react-icons/fa";

// import {
//   apiGetAdminHistorySummary,
//   apiRerunAdminHistory,
//   apiRerunAdminHistoryBulk,
// } from "./api/qualityInspectionApi";

// const PAGE_SIZE = 10;

// function formatDateTime(value) {
//   if (!value) return "-";

//   const text = String(value).trim();
//   const match = text.match(
//     /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/
//   );

//   if (!match) return text;

//   const [, yyyy, MM, dd, hh, mm, ss = "00"] = match;
//   return `${dd}/${MM}/${yyyy} ${hh}:${mm}:${ss}`;
// }

// function toYmd(date) {
//   if (!date) return "";
//   const yyyy = date.getFullYear();
//   const MM = String(date.getMonth() + 1).padStart(2, "0");
//   const dd = String(date.getDate()).padStart(2, "0");
//   return `${yyyy}-${MM}-${dd}`;
// }

// function Badge({ children, tone = "slate" }) {
//   const styles = {
//     green: "bg-emerald-50 text-emerald-700 border-emerald-200",
//     red: "bg-rose-50 text-rose-700 border-rose-200",
//     amber: "bg-amber-50 text-amber-700 border-amber-200",
//     blue: "bg-sky-50 text-sky-700 border-sky-200",
//     violet: "bg-violet-50 text-violet-700 border-violet-200",
//     slate: "bg-slate-50 text-slate-700 border-slate-200",
//   };

//   return (
//     <span
//       className={`inline-flex items-center justify-center min-h-[20px] px-2 py-0 rounded-full text-[10px] border font-medium whitespace-nowrap ${
//         styles[tone] || styles.slate
//       }`}
//     >
//       {children}
//     </span>
//   );
// }

// function getResultText(result, inspectionType) {
//   const val = Number(result);

//   if (inspectionType === "OQC") {
//     if (val === 1) return "Đạt";
//     if (val === 0) return "Không đạt";
//     if (val === 2) return "Giao đặc biệt";
//     return "-";
//   }

//   if (val === 1) return "Đạt";
//   if (val === 0) return "Không đạt";
//   return "-";
// }

// function getResultTone(result) {
//   const val = Number(result);
//   if (val === 1) return "green";
//   if (val === 0) return "red";
//   if (val === 2) return "amber";
//   return "slate";
// }

// function getInputTypeText(inputType) {
//   const val = String(inputType || "").toUpperCase();
//   if (val === "SCAN") return "Quét mã";
//   if (val === "MANUAL") return "Nhập tay";
//   return "-";
// }

// function getInputTypeTone(inputType) {
//   const val = String(inputType || "").toUpperCase();
//   if (val === "SCAN") return "blue";
//   if (val === "MANUAL") return "amber";
//   return "slate";
// }

// function getField(row, station, field) {
//   return row?.[`${station}_${field}`];
// }

// function getStationItem(row, station) {
//   return {
//     id: getField(row, station, "Id"),
//     employeeName: getField(row, station, "EmployeeName"),
//     spStatus: getField(row, station, "SpStatus"),
//     spRetryCount: getField(row, station, "SpRetryCount"),
//     inspectionDateTime: getField(row, station, "InspectionDateTime"),
//     inputType: getField(row, station, "InputType"),
//     result: getField(row, station, "Result"),
//     transQuantity: getField(row, station, "transQuantity"),
//     chenhlech: getField(row, station, "chenhlech"),
//     mau: getField(row, station, "mau"),
//     vaihu: getField(row, station, "vaihu"),
//   };
// }

// function getStationStatusText(item) {
//   if (!item?.id) {
//     return {
//       scannedText: "Chưa quét",
//       scannedTone: "slate",
//       erpText: "-",
//       erpTone: "slate",
//       inputTypeText: "-",
//       inputTypeTone: "slate",
//       employeeText: "-",
//       timeText: "-",
//     };
//   }

//   return {
//     scannedText: "Đã quét",
//     scannedTone: "blue",
//     erpText: Number(item.spStatus) === 1 ? "ERP OK" : "ERP lỗi",
//     erpTone: Number(item.spStatus) === 1 ? "green" : "red",
//     inputTypeText: getInputTypeText(item.inputType),
//     inputTypeTone: getInputTypeTone(item.inputType),
//     employeeText: item.employeeName || "-",
//     timeText: formatDateTime(item.inspectionDateTime),
//   };
// }

// function formatDiffValue(value) {
//   const num = Number(value ?? 0);

//   if (num > 0) return `${num} (dư)`;
//   if (num < 0) return `${num} (thiếu)`;
//   return "0";
// }

// function AppModal({
//   open,
//   type = "info",
//   title,
//   message,
//   confirmText = "Đồng ý",
//   cancelText = "Đóng",
//   onConfirm,
//   onClose,
//   showCancel = false,
//   loading = false,
// }) {
//   if (!open) return null;

//   const config = {
//     success: {
//       icon: <FaCheckCircle />,
//       iconWrap: "bg-emerald-100 text-emerald-600",
//       button: "bg-emerald-600 hover:bg-emerald-700",
//     },
//     error: {
//       icon: <FaTimes />,
//       iconWrap: "bg-rose-100 text-rose-600",
//       button: "bg-rose-600 hover:bg-rose-700",
//     },
//     warning: {
//       icon: <FaExclamationTriangle />,
//       iconWrap: "bg-amber-100 text-amber-600",
//       button: "bg-amber-600 hover:bg-amber-700",
//     },
//     info: {
//       icon: <FaInfoCircle />,
//       iconWrap: "bg-sky-100 text-sky-600",
//       button: "bg-sky-600 hover:bg-sky-700",
//     },
//   };

//   const ui = config[type] || config.info;

//   return (
//     <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
//       <div
//         className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
//         onClick={!loading ? onClose : undefined}
//       />

//       <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-2xl">
//         <div className="px-5 pt-5 pb-4">
//           <div className="flex items-start gap-4">
//             <div
//               className={`mt-0.5 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg ${ui.iconWrap}`}
//             >
//               {ui.icon}
//             </div>

//             <div className="min-w-0 flex-1">
//               <h3 className="text-[18px] font-bold text-slate-900">{title}</h3>
//               <div className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
//                 {message}
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4">
//           {showCancel && (
//             <button
//               type="button"
//               onClick={onClose}
//               disabled={loading}
//               className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
//             >
//               {cancelText}
//             </button>
//           )}

//           <button
//             type="button"
//             onClick={onConfirm || onClose}
//             disabled={loading}
//             className={`inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium text-white shadow-sm transition disabled:opacity-50 ${ui.button}`}
//           >
//             {loading ? "Đang xử lý..." : confirmText}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// function BulkResultPanel({ bulkResult }) {
//   if (!bulkResult) return null;

//   return (
//     <div className="rounded-[20px] bg-white border border-slate-200 shadow-sm overflow-hidden">
//       <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
//         <h3 className="text-sm font-bold text-slate-900">Kết quả chạy lại ERP</h3>
//         <div className="mt-2 flex flex-wrap gap-2 text-sm">
//           <Badge tone="green">
//             Thành công: {bulkResult.summary?.success || 0}
//           </Badge>
//           <Badge tone="red">
//             Thất bại: {bulkResult.summary?.failed || 0}
//           </Badge>
//           <Badge tone="amber">
//             Bỏ qua: {bulkResult.summary?.skipped || 0}
//           </Badge>
//         </div>
//       </div>

//       <div className="p-3 space-y-3">
//         {bulkResult.successItems?.length > 0 && (
//           <div>
//             <div className="font-semibold text-emerald-700 mb-2 text-sm">
//               Đã chạy thành công
//             </div>
//             <div className="space-y-2">
//               {bulkResult.successItems.map((x) => (
//                 <div
//                   key={`s-${x.Id}`}
//                   className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs"
//                 >
//                   <div>
//                     <b>ID:</b> {x.Id}
//                   </div>
//                   <div>
//                     <b>QrCode:</b> {x.QrCode || "-"}
//                   </div>
//                   <div>
//                     <b>Retry:</b> {x.SpRetryCount ?? 0}
//                   </div>
//                   <div>
//                     <b>Kết quả:</b> {x.SpResult || "Chạy lại thành công"}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}

//         {bulkResult.failedItems?.length > 0 && (
//           <div>
//             <div className="font-semibold text-rose-700 mb-2 text-sm">
//               Chạy thất bại
//             </div>
//             <div className="space-y-2">
//               {bulkResult.failedItems.map((x, idx) => (
//                 <div
//                   key={`f-${x.Id || idx}`}
//                   className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs"
//                 >
//                   <div>
//                     <b>ID:</b> {x.Id}
//                   </div>
//                   <div>
//                     <b>QrCode:</b> {x.QrCode || "-"}
//                   </div>
//                   <div>
//                     <b>Retry:</b> {x.SpRetryCount ?? 0}
//                   </div>
//                   <div>
//                     <b>Lỗi:</b> {x.SpResult || x.reason || "Thất bại"}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}

//         {bulkResult.skippedItems?.length > 0 && (
//           <div>
//             <div className="font-semibold text-amber-700 mb-2 text-sm">Bỏ qua</div>
//             <div className="space-y-2">
//               {bulkResult.skippedItems.map((x, idx) => (
//                 <div
//                   key={`k-${x.id || idx}`}
//                   className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs"
//                 >
//                   <div>
//                     <b>ID:</b> {x.id}
//                   </div>
//                   <div>
//                     <b>QrCode:</b> {x.qrCode || "-"}
//                   </div>
//                   <div>
//                     <b>Lý do:</b> {x.reason || "Bỏ qua"}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// function StationRow({
//   item,
//   station,
//   activeInspectionType,
//   checked,
//   onCheck,
//   onRerun,
//   rerunLoading,
// }) {
//   const s = getStationStatusText(item);

//   const canRerun =
//     station === activeInspectionType &&
//     item?.id &&
//     Number(item?.spStatus) !== 1;

//   return (
//     <div className="grid grid-cols-[52px_86px_78px_84px_120px_minmax(116px,1fr)_92px] items-center gap-1 px-2 py-1.5 border-b border-slate-200 last:border-b-0">
//       <div className="text-[11px] font-semibold text-slate-800">{station}</div>

//       <div>
//         <Badge tone={s.scannedTone}>{s.scannedText}</Badge>
//       </div>

//       <div>
//         <Badge tone={s.erpTone}>{s.erpText}</Badge>
//       </div>

//       <div>
//         <Badge tone={s.inputTypeTone}>{s.inputTypeText}</Badge>
//       </div>

//       <div className="text-[11px] text-slate-700 truncate">{s.employeeText}</div>

//       <div className="text-[11px] text-slate-600 truncate">{s.timeText}</div>

//       <div className="flex items-center justify-end gap-1">
//         {canRerun ? (
//           <>
//             <label className="inline-flex items-center text-[11px] text-slate-700 whitespace-nowrap">
//               <input
//                 type="checkbox"
//                 checked={checked}
//                 onChange={(e) => onCheck?.(e.target.checked)}
//                 className="h-3.5 w-3.5"
//               />
//             </label>

//             <button
//               onClick={onRerun}
//               disabled={rerunLoading}
//               className="inline-flex items-center gap-1 rounded-md bg-green-600 px-2 py-1 text-[10px] text-white hover:bg-green-700 disabled:opacity-50"
//             >
//               <FaRedo className="text-[9px]" />
//               Chạy lại
//             </button>
//           </>
//         ) : station === activeInspectionType &&
//           item?.id &&
//           Number(item?.spStatus) === 1 ? (
//           <span className="text-[10px] text-emerald-600 font-medium whitespace-nowrap">
//             OK
//           </span>
//         ) : (
//           <span className="text-[10px] text-slate-400 whitespace-nowrap">-</span>
//         )}
//       </div>
//     </div>
//   );
// }

// function StationPanel({
//   gom,
//   kcs,
//   oqc,
//   inspectionType,
//   selectedIds,
//   toggleOne,
//   handleRerunOne,
//   rerunOneId,
//   activeId,
//   oqcOnly,
// }) {
//   return (
//     <div className="h-full rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col">
//       <div className="grid grid-cols-[52px_86px_78px_84px_120px_minmax(116px,1fr)_92px] items-center gap-1 bg-slate-50 px-2 py-1.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-200">
//         <div>Trạm</div>
//         <div>Tình trạng</div>
//         <div>ERP</div>
//         <div>Kiểu</div>
//         <div>Người quét</div>
//         <div>Thời gian</div>
//         <div className="text-right">Tác vụ</div>
//       </div>

//       <div className="flex-1">
//         {oqcOnly ? (
//           <StationRow
//               station="OQC"
//               item={oqc}
//               activeInspectionType={inspectionType}
//               checked={selectedIds.includes(Number(activeId))}
//               onCheck={(checked) => toggleOne(activeId, checked)}
//               onRerun={() => handleRerunOne(activeId)}
//               rerunLoading={rerunOneId === activeId}
//             />
//         ) : (
//           <>
//             <StationRow
//               station="GOM"
//               item={gom}
//               activeInspectionType={inspectionType}
//               checked={
//                 inspectionType === "GOM"
//                   ? selectedIds.includes(Number(activeId))
//                   : false
//               }
//               onCheck={(checked) =>
//                 inspectionType === "GOM" && toggleOne(activeId, checked)
//               }
//               onRerun={() =>
//                 inspectionType === "GOM" && handleRerunOne(activeId)
//               }
//               rerunLoading={inspectionType === "GOM" && rerunOneId === activeId}
//             />

//             <StationRow
//               station="KCS"
//               item={kcs}
//               activeInspectionType={inspectionType}
//               checked={
//                 inspectionType === "KCS"
//                   ? selectedIds.includes(Number(activeId))
//                   : false
//               }
//               onCheck={(checked) =>
//                 inspectionType === "KCS" && toggleOne(activeId, checked)
//               }
//               onRerun={() =>
//                 inspectionType === "KCS" && handleRerunOne(activeId)
//               }
//               rerunLoading={inspectionType === "KCS" && rerunOneId === activeId}
//             />

//             <StationRow
//               station="OQC"
//               item={oqc}
//               activeInspectionType={inspectionType}
//               checked={
//                 inspectionType === "OQC"
//                   ? selectedIds.includes(Number(activeId))
//                   : false
//               }
//               onCheck={(checked) =>
//                 inspectionType === "OQC" && toggleOne(activeId, checked)
//               }
//               onRerun={() =>
//                 inspectionType === "OQC" && handleRerunOne(activeId)
//               }
//               rerunLoading={inspectionType === "OQC" && rerunOneId === activeId}
//             />
//           </>
//         )}
//       </div>
//     </div>
//   );
// }

// function InfoGrid({ row, inspectionType, showModal }) {
//   const activeItem = getStationItem(row, inspectionType);
//   const [copied, setCopied] = useState(false);

//   const handleCopy = async () => {
//     try {
//       await navigator.clipboard.writeText(String(row.QrCode || ""));
//       setCopied(true);
//       setTimeout(() => setCopied(false), 1200);
//     } catch (err) {
//       console.error("Copy failed:", err);
//       showModal?.({
//         open: true,
//         type: "error",
//         title: "Không thể sao chép",
//         message: "Trình duyệt không cho phép sao chép hoặc đã xảy ra lỗi.",
//       });
//     }
//   };

//   const items = [
//     { label: "Trạm", value: inspectionType },
//     { label: "SL đạt", value: activeItem?.transQuantity ?? 0 },
//     { label: "Dư / Thiếu", value: formatDiffValue(activeItem?.chenhlech) },
//     { label: "Mẫu", value: activeItem?.mau ?? 0 },
//     { label: "Vải hư", value: activeItem?.vaihu ?? 0 },
//     {
//       label: "KQ",
//       value: (
//         <Badge tone={getResultTone(activeItem?.result)}>
//           {getResultText(activeItem?.result, inspectionType)}
//         </Badge>
//       ),
//     },
//   ];

//   return (
//     <div className="h-full rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col">
//       <div className="px-3 py-2 border-b border-slate-200 bg-slate-50">
//         <div className="flex items-center justify-between gap-2">
//           <div className="min-w-0 flex-1 flex items-center gap-1.5">
//             <span className="shrink-0 text-[13px] uppercase tracking-wide text-slate-500">
//               Mã:
//             </span>
//             <span className="min-w-0 truncate text-[13px] font-semibold text-slate-900">
//               {row.QrCode || "-"}
//             </span>
//           </div>

//           <button
//             type="button"
//             onClick={handleCopy}
//             title="Copy mã"
//             className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition"
//           >
//             {copied ? (
//               <FaCheck className="text-[11px]" />
//             ) : (
//               <FaRegCopy className="text-[11px]" />
//             )}
//           </button>
//         </div>
//       </div>

//       <div className="grid grid-cols-3 flex-1">
//         {items.map((x, idx) => (
//           <div
//             key={idx}
//             className={`
//               min-h-[46px] px-3 py-1.5
//               border-r border-b border-slate-100
//               ${(idx + 1) % 3 === 0 ? "border-r-0" : ""}
//               ${idx >= 3 ? "border-b-0" : ""}
//             `}
//           >
//             <div className="text-[9px] text-slate-500">{x.label}</div>
//             <div className="mt-0.5 text-[11px] font-semibold text-slate-800 leading-4">
//               {x.value}
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// function DesktopTable({
//   rows,
//   inspectionType,
//   selectedIds,
//   toggleOne,
//   handleRerunOne,
//   rerunOneId,
//   activeIdField,
//   currentPage,
//   oqcOnly,
//   showModal,
// }) {
//   return (
//     <div className="hidden md:block rounded-[18px] bg-white border border-slate-200 shadow-sm overflow-hidden">
//       <div className="overflow-x-auto">
//         <table className="w-full min-w-[1215px] text-sm table-fixed border-collapse">
//           <thead className="bg-slate-50 text-slate-700">
//             <tr>
//               <th className="w-[56px] px-2.5 py-2.5 text-left text-[11px] font-semibold border-b border-slate-200">
//                 STT
//               </th>
//               <th className="w-[322px] px-2 py-2.5 text-left text-[11px] font-semibold border-b border-slate-200">
//                 Thông tin mã
//               </th>
//               <th className="px-4 py-2.5 text-left text-[11px] font-semibold border-b border-slate-200">
//                 Trạng thái trạm
//               </th>
//             </tr>
//           </thead>

//           <tbody>
//             {rows.map((row, index) => {
//               const gom = getStationItem(row, "GOM");
//               const kcs = getStationItem(row, "KCS");
//               const oqc = getStationItem(row, "OQC");
//               const activeId = row[activeIdField];
//               const stt = (currentPage - 1) * PAGE_SIZE + index + 1;

//               return (
//                 <tr
//                   key={`${inspectionType}-${row.QrCode}`}
//                   className="align-top hover:bg-emerald-50/20 transition-colors"
//                 >
//                   <td className="px-2.5 py-1.5 border-b border-slate-200">
//                     <div className="inline-flex h-6 min-w-[28px] items-center justify-center rounded-md bg-slate-100 px-1.5 text-[11px] font-semibold text-slate-700">
//                       {stt}
//                     </div>
//                   </td>

//                   <td colSpan={2} className="px-1 py-1.5 border-b border-slate-200">
//                     <div className="grid grid-cols-[322px_minmax(0,1fr)] gap-[10px] items-stretch">
//                       <div className="h-full">
//                         <InfoGrid
//                           row={row}
//                           inspectionType={inspectionType}
//                           showModal={showModal}
//                         />
//                       </div>

//                       <div className="h-full">
//                         <StationPanel
//                           gom={gom}
//                           kcs={kcs}
//                           oqc={oqc}
//                           inspectionType={inspectionType}
//                           selectedIds={selectedIds}
//                           toggleOne={toggleOne}
//                           handleRerunOne={handleRerunOne}
//                           rerunOneId={rerunOneId}
//                           activeId={activeId}
//                           oqcOnly={oqcOnly}
//                         />
//                       </div>
//                     </div>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }

// function MobileCards({
//   rows,
//   inspectionType,
//   selectedIds,
//   toggleOne,
//   handleRerunOne,
//   rerunOneId,
//   activeIdField,
//   currentPage,
//   oqcOnly,
//   showModal,
// }) {
//   return (
//     <div className="md:hidden space-y-3">
//       {rows.map((row, index) => {
//         const gom = getStationItem(row, "GOM");
//         const kcs = getStationItem(row, "KCS");
//         const oqc = getStationItem(row, "OQC");
//         const activeId = row[activeIdField];
//         const stt = (currentPage - 1) * PAGE_SIZE + index + 1;

//         return (
//           <div
//             key={`${inspectionType}-${row.QrCode}`}
//             className="rounded-[18px] border border-slate-200 bg-white shadow-sm overflow-hidden"
//           >
//             <div className="px-3 py-3 border-b border-slate-100 bg-gradient-to-r from-green-50 to-emerald-50">
//               <div className="text-[10px] text-slate-500">STT</div>
//               <div className="font-semibold text-sm text-slate-800">{stt}</div>

//               <div className="mt-2">
//                 <InfoGrid
//                   row={row}
//                   inspectionType={inspectionType}
//                   showModal={showModal}
//                 />
//               </div>
//             </div>

//             <div className="p-3">
//               <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-2">
//                 Trạng thái trạm
//               </div>

//               <div className="overflow-x-auto">
//                 <div className="min-w-[760px]">
//                   <StationPanel
//                     gom={gom}
//                     kcs={kcs}
//                     oqc={oqc}
//                     inspectionType={inspectionType}
//                     selectedIds={selectedIds}
//                     toggleOne={toggleOne}
//                     handleRerunOne={handleRerunOne}
//                     rerunOneId={rerunOneId}
//                     activeId={activeId}
//                     oqcOnly={oqcOnly}
//                   />
//                 </div>
//               </div>
//             </div>
//           </div>
//         );
//       })}
//     </div>
//   );
// }

// function History() {
//   const today = useMemo(() => new Date(), []);
//   const [range, setRange] = useState([today, today]);
//   const [startDate, endDate] = range;

//   const [inspectionType, setInspectionType] = useState("OQC");
//   const [showStation, setShowStation] = useState("ALL");
//   const [errorOnly, setErrorOnly] = useState(false);
//   const [missingStationOnly, setMissingStationOnly] = useState(false);
//   const [oqcOnly, setOqcOnly] = useState(false);
//   const [searchText, setSearchText] = useState("");
//   const [keyword, setKeyword] = useState("");

//   const [rows, setRows] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const [selectedIds, setSelectedIds] = useState([]);
//   const [bulkLoading, setBulkLoading] = useState(false);
//   const [rerunOneId, setRerunOneId] = useState(null);
//   const [bulkResult, setBulkResult] = useState(null);
//   const [page, setPage] = useState(1);

//   const [modal, setModal] = useState({
//     open: false,
//     type: "info",
//     title: "",
//     message: "",
//     confirmText: "Đồng ý",
//     cancelText: "Đóng",
//     showCancel: false,
//     loading: false,
//     onConfirm: null,
//   });

//   const showModal = useCallback((config) => {
//     setModal({
//       open: true,
//       type: config.type || "info",
//       title: config.title || "Thông báo",
//       message: config.message || "",
//       confirmText: config.confirmText || "Đồng ý",
//       cancelText: config.cancelText || "Đóng",
//       showCancel: Boolean(config.showCancel),
//       loading: Boolean(config.loading),
//       onConfirm: config.onConfirm || null,
//     });
//   }, []);

//   const closeModal = useCallback(() => {
//     setModal((prev) => ({
//       ...prev,
//       open: false,
//       loading: false,
//       onConfirm: null,
//     }));
//   }, []);

//   const activeIdField = `${inspectionType}_Id`;
//   const activeSpStatusField = `${inspectionType}_SpStatus`;

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setKeyword(searchText.trim());
//       setPage(1);
//     }, 500);

//     return () => clearTimeout(timer);
//   }, [searchText]);

//   const fetchData = useCallback(async () => {
//     if (!startDate || !endDate) return;

//     setLoading(true);
//     try {
//       const res = await apiGetAdminHistorySummary({
//         fromDate: toYmd(startDate),
//         toDate: toYmd(endDate),
//         errorOnly,
//         inspectionType,
//       });

//       let data = res?.data || [];

//       if (keyword) {
//         const kw = keyword.toLowerCase();
//         data = data.filter((x) =>
//           String(x.QrCode || "").toLowerCase().includes(kw)
//         );
//       }

//       if (missingStationOnly) {
//         data = data.filter((x) => !x.GOM_Id || !x.KCS_Id || !x.OQC_Id);
//       }

//       if (showStation !== "ALL") {
//         data = data.filter((x) => Boolean(x[`${showStation}_Id`]));
//       }

//       setRows(data);

//       setSelectedIds((prev) =>
//         prev.filter((id) =>
//           data.some(
//             (x) =>
//               Number(x[activeIdField]) === Number(id) &&
//               Number(x[activeSpStatusField]) !== 1
//           )
//         )
//       );
//     } catch (err) {
//       console.error("Load admin history error:", err);
//       setRows([]);
//       showModal({
//         type: "error",
//         title: "Tải dữ liệu thất bại",
//         message:
//           err?.response?.data?.message ||
//           err?.message ||
//           "Không thể tải dữ liệu lịch sử. Vui lòng thử lại.",
//       });
//     } finally {
//       setLoading(false);
//     }
//   }, [
//     startDate,
//     endDate,
//     errorOnly,
//     inspectionType,
//     keyword,
//     showStation,
//     missingStationOnly,
//     activeIdField,
//     activeSpStatusField,
//     showModal,
//   ]);

//   useEffect(() => {
//     fetchData();
//   }, [fetchData]);

//   const errorRows = useMemo(
//     () =>
//       rows.filter(
//         (x) => x[activeIdField] && Number(x[activeSpStatusField]) !== 1
//       ),
//     [rows, activeIdField, activeSpStatusField]
//   );

//   const allErrorIds = useMemo(
//     () => errorRows.map((x) => Number(x[activeIdField])),
//     [errorRows, activeIdField]
//   );

//   const isAllChecked =
//     allErrorIds.length > 0 &&
//     allErrorIds.every((id) => selectedIds.includes(id));

//   const toggleCheckAll = () => {
//     if (isAllChecked) {
//       setSelectedIds([]);
//     } else {
//       setSelectedIds(allErrorIds);
//     }
//   };

//   const toggleOne = (id, checked) => {
//     const numId = Number(id);
//     setSelectedIds((prev) => {
//       if (checked) {
//         if (prev.includes(numId)) return prev;
//         return [...prev, numId];
//       }
//       return prev.filter((x) => x !== numId);
//     });
//   };

//   const handleRerunOne = async (id) => {
//     try {
//       setRerunOneId(id);
//       const res = await apiRerunAdminHistory(id);

//       showModal({
//         type: "success",
//         title: "Chạy lại thành công",
//         message: res?.message || `Đã chạy lại ERP cho ID ${id} thành công.`,
//       });

//       await fetchData();
//     } catch (err) {
//       console.error("Rerun one error:", err);

//       showModal({
//         type: "error",
//         title: "Chạy lại thất bại",
//         message:
//           err?.response?.data?.message ||
//           err?.message ||
//           "Không thể chạy lại ERP cho dòng đã chọn.",
//       });

//       await fetchData();
//     } finally {
//       setRerunOneId(null);
//     }
//   };

//   const runBulkConfirmed = async () => {
//     try {
//       setBulkLoading(true);
//       setBulkResult(null);

//       const res = await apiRerunAdminHistoryBulk(selectedIds);

//       setBulkResult({
//         summary: res?.summary,
//         successItems: res?.successItems || [],
//         failedItems: res?.failedItems || [],
//         skippedItems: res?.skippedItems || [],
//       });

//       closeModal();
//       await fetchData();
//       setSelectedIds([]);

//       const success = res?.summary?.success || 0;
//       const failed = res?.summary?.failed || 0;
//       const skipped = res?.summary?.skipped || 0;

//       showModal({
//         type: failed > 0 ? "warning" : "success",
//         title: "Đã chạy lại hàng loạt",
//         message: `Kết quả xử lý:
// - Thành công: ${success}
// - Thất bại: ${failed}
// - Bỏ qua: ${skipped}`,
//       });
//     } catch (err) {
//       console.error("Rerun bulk error:", err);

//       showModal({
//         type: "error",
//         title: "Chạy lại hàng loạt thất bại",
//         message:
//           err?.response?.data?.message ||
//           err?.message ||
//           "Không thể chạy lại ERP cho danh sách đã chọn.",
//       });
//     } finally {
//       setBulkLoading(false);
//     }
//   };

//   const handleRerunBulk = async () => {
//     if (selectedIds.length === 0) {
//       showModal({
//         type: "warning",
//         title: "Chưa chọn dữ liệu",
//         message: `Chưa chọn dòng ${inspectionType} lỗi nào để chạy lại.`,
//       });
//       return;
//     }

//     showModal({
//       type: "warning",
//       title: "Xác nhận chạy lại ERP",
//       message: `Bạn có chắc muốn chạy lại ERP cho ${selectedIds.length} dòng ${inspectionType} đã chọn không?`,
//       confirmText: "Xác nhận chạy lại",
//       cancelText: "Huỷ",
//       showCancel: true,
//       onConfirm: runBulkConfirmed,
//     });
//   };

//   useEffect(() => {
//     setSelectedIds([]);
//     setBulkResult(null);
//     setPage(1);
//   }, [
//     inspectionType,
//     errorOnly,
//     startDate,
//     endDate,
//     keyword,
//     showStation,
//     missingStationOnly,
//     oqcOnly,
//   ]);

//   const totalRows = rows.length;
//   const totalPages = Math.max(Math.ceil(totalRows / PAGE_SIZE), 1);
//   const currentPage = Math.min(page, totalPages);

//   const pagedRows = useMemo(() => {
//     const start = (currentPage - 1) * PAGE_SIZE;
//     return rows.slice(start, start + PAGE_SIZE);
//   }, [rows, currentPage]);

//   return (
//     <div className="min-h-screen bg-slate-50">
//       <div className="max-w-[1420px] mx-auto p-3 md:p-4 space-y-4">
//         <div className="rounded-[22px] bg-white shadow-sm border border-slate-200 overflow-hidden">
//           <div className="p-4 md:p-4 bg-[#EAF6FF] border-b border-slate-100">
//             <div className="flex items-center gap-3">
//               <span className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-green-100 text-green-700 text-[15px] shadow-sm">
//                 <FaHistory />
//               </span>

//               <div>
//                 <h1 className="text-[16px] md:text-[22px] font-[700] leading-tight text-slate-900">
//                   Lịch sử trạm quét OQC
//                 </h1>
//                 <div className="text-xs md:text-sm text-slate-500 mt-0.5">
//                   Theo dõi trạng thái quét và lưu ERP
//                 </div>
//               </div>
//             </div>

//             <div className="mt-4 grid grid-cols-1 xl:grid-cols-[130px_280px_180px_minmax(220px,1fr)] gap-2.5 items-center">
//               <div className="relative min-w-0">
//                 <input
//                   type="text"
//                   value={searchText}
//                   onChange={(e) => setSearchText(e.target.value)}
//                   placeholder="Tìm theo mã QrCode..."
//                   className="
//                     box-border w-full min-w-0 rounded-xl bg-white px-3 py-2.5 pr-9 text-xs text-slate-700
//                     shadow-sm outline-none
//                     border border-slate-200
//                     placeholder:text-slate-400
//                     focus:border-green-300 focus:ring-1 focus:ring-green-100
//                     transition
//                   "
//                 />
//                 <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
//               </div>
//               <div className="min-w-0">
//                 <DatePicker
//                   selectsRange
//                   startDate={startDate}
//                   endDate={endDate}
//                   onChange={(update) => setRange(update)}
//                   dateFormat="dd/MM/yyyy"
//                   placeholderText="Chọn khoảng ngày"
//                   wrapperClassName="w-full min-w-0"
//                   className="
//                     box-border w-full min-w-0 rounded-xl bg-white px-3 py-2.5 text-xs text-slate-700
//                     shadow-sm outline-none
//                     border border-slate-200
//                     focus:border-green-300 focus:ring-1 focus:ring-green-100
//                     transition
//                   "
//                 />
//               </div>
//             </div>

//             <div className="mt-3 flex flex-wrap items-center gap-2">
//               <label className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm border border-slate-100">
//                 <input
//                   type="checkbox"
//                   checked={errorOnly}
//                   onChange={(e) => setErrorOnly(e.target.checked)}
//                   className="h-3.5 w-3.5 accent-green-600"
//                 />
//                 Chỉ hiện ERP lỗi
//               </label>

//               <label className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm border border-slate-100">
//                 <input
//                   type="checkbox"
//                   checked={missingStationOnly}
//                   onChange={(e) => setMissingStationOnly(e.target.checked)}
//                   className="h-3.5 w-3.5 accent-green-600"
//                 />
//                 Chưa đủ 3 trạm
//               </label>

//               <label className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm border border-slate-100">
//                 <input
//                   type="checkbox"
//                   checked={oqcOnly}
//                   onChange={(e) => setOqcOnly(e.target.checked)}
//                   className="h-3.5 w-3.5 accent-green-600"
//                 />
//                 Chỉ hiện OQC
//               </label>

//               <label className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm border border-slate-100">
//                 <input
//                   type="checkbox"
//                   checked={isAllChecked}
//                   onChange={toggleCheckAll}
//                   className="h-3.5 w-3.5 accent-green-600"
//                 />
//                 Chọn tất cả lỗi
//               </label>

//               <button
//                 onClick={handleRerunBulk}
//                 disabled={bulkLoading || selectedIds.length === 0}
//                 className="
//                   ml-auto px-3 py-2 rounded-lg
//                   bg-sky-600 hover:bg-sky-700
//                   disabled:opacity-50 disabled:cursor-not-allowed
//                   text-white text-xs font-medium
//                   shadow-sm transition
//                   flex items-center justify-center gap-2
//                 "
//               >
//                 <FaSyncAlt className="text-[11px]" />
//                 {bulkLoading ? "Đang chạy lại..." : "Chạy lại đã chọn"}
//               </button>
//             </div>
//           </div>

//           <div className="px-3 py-2.5 md:px-4 md:py-3 bg-slate-50/70">
//             <div className="flex flex-wrap gap-2 text-xs">
//               <div className="rounded-full bg-white px-3 py-1 text-slate-600 shadow-sm border border-slate-100">
//                 Tổng mã {inspectionType}:{" "}
//                 <span className="font-semibold text-slate-900">{rows.length}</span>
//               </div>

//               <div className="rounded-full bg-white px-3 py-1 text-slate-600 shadow-sm border border-slate-100">
//                 ERP lỗi:{" "}
//                 <span className="font-semibold text-rose-600">{errorRows.length}</span>
//               </div>

//               <div className="rounded-full bg-white px-3 py-1 text-slate-600 shadow-sm border border-slate-100">
//                 Đã chọn:{" "}
//                 <span className="font-semibold text-slate-900">{selectedIds.length}</span>
//               </div>
//             </div>
//           </div>
//         </div>

//         <BulkResultPanel bulkResult={bulkResult} />

//         {loading ? (
//           <div className="rounded-[22px] bg-white border border-slate-200 shadow-sm p-8 text-center text-sm text-slate-500">
//             Đang tải dữ liệu...
//           </div>
//         ) : rows.length === 0 ? (
//           <div className="rounded-[22px] bg-white border border-slate-200 shadow-sm p-8 text-center text-sm text-slate-500">
//             Không có dữ liệu
//           </div>
//         ) : (
//           <>
//             <DesktopTable
//               rows={pagedRows}
//               inspectionType={inspectionType}
//               selectedIds={selectedIds}
//               toggleOne={toggleOne}
//               handleRerunOne={handleRerunOne}
//               rerunOneId={rerunOneId}
//               activeIdField={activeIdField}
//               currentPage={currentPage}
//               oqcOnly={oqcOnly}
//               showModal={showModal}
//             />

//             <MobileCards
//               rows={pagedRows}
//               inspectionType={inspectionType}
//               selectedIds={selectedIds}
//               toggleOne={toggleOne}
//               handleRerunOne={handleRerunOne}
//               rerunOneId={rerunOneId}
//               activeIdField={activeIdField}
//               currentPage={currentPage}
//               oqcOnly={oqcOnly}
//               showModal={showModal}
//             />

//             <div className="rounded-[18px] bg-white border border-slate-200 shadow-sm p-3">
//               <div className="flex flex-col md:flex-row items-center justify-between gap-3">
//                 <div className="text-xs text-slate-600">
//                   Trang <span className="font-semibold">{currentPage}</span> /{" "}
//                   <span className="font-semibold">{totalPages}</span>
//                 </div>

//                 <div className="flex items-center gap-2">
//                   <button
//                     onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
//                     disabled={currentPage <= 1}
//                     className="h-8 px-3 rounded-lg border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 flex items-center gap-2 text-xs"
//                   >
//                     <FaChevronLeft className="text-[10px]" />
//                     Trước
//                   </button>

//                   <button
//                     onClick={() =>
//                       setPage((prev) => Math.min(prev + 1, totalPages))
//                     }
//                     disabled={currentPage >= totalPages}
//                     className="h-8 px-3 rounded-lg border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 flex items-center gap-2 text-xs"
//                   >
//                     Sau
//                     <FaChevronRight className="text-[10px]" />
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </>
//         )}
//       </div>

//       <AppModal
//         open={modal.open}
//         type={modal.type}
//         title={modal.title}
//         message={modal.message}
//         confirmText={modal.confirmText}
//         cancelText={modal.cancelText}
//         showCancel={modal.showCancel}
//         loading={modal.loading}
//         onClose={closeModal}
//         onConfirm={modal.onConfirm ? modal.onConfirm : closeModal}
//       />
//     </div>
//   );
// }

// export default History;





import React, { useCallback, useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  FaHistory,
  FaRedo,
  FaSyncAlt,
  FaChevronLeft,
  FaChevronRight,
  FaSearch,
  FaRegCopy,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaCheckCircle,
  FaInfoCircle,
} from "react-icons/fa";

import {
  apiGetAdminHistorySummary,
  apiRerunAdminHistory,
} from "./api/qualityInspectionApi";

const PAGE_SIZE = 10;

function formatDateTime(value) {
  if (!value) return "-";

  const text = String(value).trim();
  const match = text.match(
    /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/
  );

  if (!match) return text;

  const [, yyyy, MM, dd, hh, mm, ss = "00"] = match;
  return `${dd}/${MM}/${yyyy} ${hh}:${mm}:${ss}`;
}

function toYmd(date) {
  if (!date) return "";
  const yyyy = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${MM}-${dd}`;
}

function Badge({ children, tone = "slate" }) {
  const styles = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    red: "bg-rose-50 text-rose-700 border-rose-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-sky-50 text-sky-700 border-sky-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
    slate: "bg-slate-50 text-slate-700 border-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center justify-center min-h-[20px] px-2 py-0 rounded-full text-[10px] border font-medium whitespace-nowrap ${
        styles[tone] || styles.slate
      }`}
    >
      {children}
    </span>
  );
}

function getResultText(result, inspectionType) {
  const val = Number(result);

  if (inspectionType === "OQC") {
    if (val === 1) return "Đạt";
    if (val === 0) return "Không đạt";
    if (val === 2) return "Giao đặc biệt";
    return "-";
  }

  if (val === 1) return "Đạt";
  if (val === 0) return "Không đạt";
  return "-";
}

function getResultTone(result) {
  const val = Number(result);
  if (val === 1) return "green";
  if (val === 0) return "red";
  if (val === 2) return "amber";
  return "slate";
}

function getInputTypeText(inputType) {
  const val = String(inputType || "").toUpperCase();
  if (val === "SCAN") return "Quét mã";
  if (val === "MANUAL") return "Nhập tay";
  return "-";
}

function getInputTypeTone(inputType) {
  const val = String(inputType || "").toUpperCase();
  if (val === "SCAN") return "blue";
  if (val === "MANUAL") return "amber";
  return "slate";
}

function getField(row, station, field) {
  return row?.[`${station}_${field}`];
}

function getStationItem(row, station) {
  return {
    id: getField(row, station, "Id"),
    employeeName: getField(row, station, "EmployeeName"),
    spStatus: getField(row, station, "SpStatus"),
    spRetryCount: getField(row, station, "SpRetryCount"),
    inspectionDateTime: getField(row, station, "InspectionDateTime"),
    inputType: getField(row, station, "InputType"),
    result: getField(row, station, "Result"),
    transQuantity: getField(row, station, "transQuantity"),
    chenhlech: getField(row, station, "chenhlech"),
    mau: getField(row, station, "mau"),
    vaihu: getField(row, station, "vaihu"),
  };
}

function getStationStatusText(item) {
  if (!item?.id) {
    return {
      scannedText: "Chưa quét",
      scannedTone: "slate",
      erpText: "-",
      erpTone: "slate",
      inputTypeText: "-",
      inputTypeTone: "slate",
      employeeText: "-",
      timeText: "-",
    };
  }

  return {
    scannedText: "Đã quét",
    scannedTone: "blue",
    erpText: Number(item.spStatus) === 1 ? "ERP OK" : "ERP lỗi",
    erpTone: Number(item.spStatus) === 1 ? "green" : "red",
    inputTypeText: getInputTypeText(item.inputType),
    inputTypeTone: getInputTypeTone(item.inputType),
    employeeText: item.employeeName || "-",
    timeText: formatDateTime(item.inspectionDateTime),
  };
}

function formatDiffValue(value) {
  const num = Number(value ?? 0);

  if (num > 0) return `${num} (dư)`;
  if (num < 0) return `${num} (thiếu)`;
  return "0";
}

function AppModal({
  open,
  type = "info",
  title,
  message,
  content,
  confirmText = "Đồng ý",
  cancelText = "Đóng",
  onConfirm,
  onClose,
  showCancel = false,
  loading = false,
  hideFooter = false,
  widthClass = "max-w-md",
  closeOnOverlay = true,
}) {
  if (!open) return null;

  const config = {
    success: {
      icon: <FaCheckCircle />,
      iconWrap: "bg-emerald-100 text-emerald-600",
      button: "bg-emerald-600 hover:bg-emerald-700",
    },
    error: {
      icon: <FaTimes />,
      iconWrap: "bg-rose-100 text-rose-600",
      button: "bg-rose-600 hover:bg-rose-700",
    },
    warning: {
      icon: <FaExclamationTriangle />,
      iconWrap: "bg-amber-100 text-amber-600",
      button: "bg-amber-600 hover:bg-amber-700",
    },
    info: {
      icon: <FaInfoCircle />,
      iconWrap: "bg-sky-100 text-sky-600",
      button: "bg-sky-600 hover:bg-sky-700",
    },
  };

  const ui = config[type] || config.info;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
        onClick={closeOnOverlay && !loading ? onClose : undefined}
      />

      <div
        className={`relative z-10 w-full ${widthClass} overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-2xl`}
      >
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start gap-4">
            <div
              className={`mt-0.5 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg ${ui.iconWrap}`}
            >
              {ui.icon}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-[18px] font-bold text-slate-900">{title}</h3>

              {message ? (
                <div className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                  {message}
                </div>
              ) : null}

              {content ? <div className="mt-3">{content}</div> : null}
            </div>
          </div>
        </div>

        {!hideFooter && (
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4">
            {showCancel && (
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {cancelText}
              </button>
            )}

            <button
              type="button"
              onClick={onConfirm || onClose}
              disabled={loading}
              className={`inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium text-white shadow-sm transition disabled:opacity-50 ${ui.button}`}
            >
              {loading ? "Đang xử lý..." : confirmText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function BulkProcessModalContent({ state, modeLabel = "chạy lại" }) {
  const progress =
    state.total > 0 ? Math.round((state.done / state.total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
          <span>Tiến độ xử lý</span>
          <span className="font-semibold">{progress}%</span>
        </div>

        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-sky-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-2 text-xs text-slate-500">
          Đã xử lý {state.done}/{state.total} mã
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge tone="green">Thành công: {state.successItems.length}</Badge>
        <Badge tone="red">Lỗi: {state.failedItems.length}</Badge>
        <Badge tone="amber">Bỏ qua: {state.skippedItems.length}</Badge>
      </div>

      <div className="max-h-[360px] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
        {state.logs.length === 0 ? (
          <div className="text-xs text-slate-500">
            Chưa có dữ liệu xử lý...
          </div>
        ) : (
          state.logs.map((item, idx) => {
            const tone =
              item.status === "success"
                ? "border-emerald-200 bg-emerald-50"
                : item.status === "failed"
                ? "border-rose-200 bg-rose-50"
                : "border-amber-200 bg-amber-50";

            const textColor =
              item.status === "success"
                ? "text-emerald-700"
                : item.status === "failed"
                ? "text-rose-700"
                : "text-amber-700";

            return (
              <div
                key={`${item.code || item.id || "row"}-${idx}`}
                className={`rounded-lg border px-3 py-2 text-xs ${tone}`}
              >
                <div className={`font-semibold ${textColor}`}>
                  {item.code || item.qrCode || item.id || "-"}
                </div>
                <div className="mt-1 text-slate-600">
                  {item.message ||
                    (item.status === "success"
                      ? `${modeLabel} thành công`
                      : item.status === "skipped"
                      ? "Bỏ qua"
                      : "Xử lý thất bại")}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function StationRow({
  item,
  station,
  activeInspectionType,
  checked,
  onCheck,
  onRerun,
  rerunLoading,
}) {
  const s = getStationStatusText(item);

  const canRerun =
    station === activeInspectionType &&
    item?.id &&
    Number(item?.spStatus) !== 1;

  return (
    <div className="grid grid-cols-[52px_86px_78px_84px_120px_minmax(116px,1fr)_92px] items-center gap-1 px-2 py-1.5 border-b border-slate-200 last:border-b-0">
      <div className="text-[11px] font-semibold text-slate-800">{station}</div>

      <div>
        <Badge tone={s.scannedTone}>{s.scannedText}</Badge>
      </div>

      <div>
        <Badge tone={s.erpTone}>{s.erpText}</Badge>
      </div>

      <div>
        <Badge tone={s.inputTypeTone}>{s.inputTypeText}</Badge>
      </div>

      <div className="text-[11px] text-slate-700 truncate">{s.employeeText}</div>

      <div className="text-[11px] text-slate-600 truncate">{s.timeText}</div>

      <div className="flex items-center justify-end gap-1">
        {canRerun ? (
          <>
            <label className="inline-flex items-center text-[11px] text-slate-700 whitespace-nowrap">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onCheck?.(e.target.checked)}
                className="h-3.5 w-3.5"
              />
            </label>

            <button
              onClick={onRerun}
              disabled={rerunLoading}
              className="inline-flex items-center gap-1 rounded-md bg-green-600 px-2 py-1 text-[10px] text-white hover:bg-green-700 disabled:opacity-50"
            >
              <FaRedo className="text-[9px]" />
              Chạy lại
            </button>
          </>
        ) : station === activeInspectionType &&
          item?.id &&
          Number(item?.spStatus) === 1 ? (
          <span className="text-[10px] text-emerald-600 font-medium whitespace-nowrap">
            OK
          </span>
        ) : (
          <span className="text-[10px] text-slate-400 whitespace-nowrap">-</span>
        )}
      </div>
    </div>
  );
}

function StationPanel({
  gom,
  kcs,
  oqc,
  inspectionType,
  selectedIds,
  toggleOne,
  handleRerunOne,
  rerunOneId,
  activeId,
  oqcOnly,
}) {
  return (
    <div className="h-full rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col">
      <div className="grid grid-cols-[52px_86px_78px_84px_120px_minmax(116px,1fr)_92px] items-center gap-1 bg-slate-50 px-2 py-1.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-200">
        <div>Trạm</div>
        <div>Tình trạng</div>
        <div>ERP</div>
        <div>Kiểu</div>
        <div>Người quét</div>
        <div>Thời gian</div>
        <div className="text-right">Tác vụ</div>
      </div>

      <div className="flex-1">
        {oqcOnly ? (
          <StationRow
            station="OQC"
            item={oqc}
            activeInspectionType={inspectionType}
            checked={selectedIds.includes(Number(activeId))}
            onCheck={(checked) => toggleOne(activeId, checked)}
            onRerun={() => handleRerunOne(activeId)}
            rerunLoading={rerunOneId === activeId}
          />
        ) : (
          <>
            <StationRow
              station="GOM"
              item={gom}
              activeInspectionType={inspectionType}
              checked={
                inspectionType === "GOM"
                  ? selectedIds.includes(Number(activeId))
                  : false
              }
              onCheck={(checked) =>
                inspectionType === "GOM" && toggleOne(activeId, checked)
              }
              onRerun={() =>
                inspectionType === "GOM" && handleRerunOne(activeId)
              }
              rerunLoading={inspectionType === "GOM" && rerunOneId === activeId}
            />

            <StationRow
              station="KCS"
              item={kcs}
              activeInspectionType={inspectionType}
              checked={
                inspectionType === "KCS"
                  ? selectedIds.includes(Number(activeId))
                  : false
              }
              onCheck={(checked) =>
                inspectionType === "KCS" && toggleOne(activeId, checked)
              }
              onRerun={() =>
                inspectionType === "KCS" && handleRerunOne(activeId)
              }
              rerunLoading={inspectionType === "KCS" && rerunOneId === activeId}
            />

            <StationRow
              station="OQC"
              item={oqc}
              activeInspectionType={inspectionType}
              checked={
                inspectionType === "OQC"
                  ? selectedIds.includes(Number(activeId))
                  : false
              }
              onCheck={(checked) =>
                inspectionType === "OQC" && toggleOne(activeId, checked)
              }
              onRerun={() =>
                inspectionType === "OQC" && handleRerunOne(activeId)
              }
              rerunLoading={inspectionType === "OQC" && rerunOneId === activeId}
            />
          </>
        )}
      </div>
    </div>
  );
}

function InfoGrid({ row, inspectionType, showModal }) {
  const activeItem = getStationItem(row, inspectionType);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(String(row.QrCode || ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (err) {
      console.error("Copy failed:", err);
      showModal?.({
        open: true,
        type: "error",
        title: "Không thể sao chép",
        message: "Trình duyệt không cho phép sao chép hoặc đã xảy ra lỗi.",
      });
    }
  };

  const items = [
    { label: "Trạm", value: inspectionType },
    { label: "SL đạt", value: activeItem?.transQuantity ?? 0 },
    { label: "Dư / Thiếu", value: formatDiffValue(activeItem?.chenhlech) },
    { label: "Mẫu", value: activeItem?.mau ?? 0 },
    { label: "Vải hư", value: activeItem?.vaihu ?? 0 },
    {
      label: "KQ",
      value: (
        <Badge tone={getResultTone(activeItem?.result)}>
          {getResultText(activeItem?.result, inspectionType)}
        </Badge>
      ),
    },
  ];

  return (
    <div className="h-full rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col">
      <div className="px-3 py-2 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1 flex items-center gap-1.5">
            <span className="shrink-0 text-[13px] uppercase tracking-wide text-slate-500">
              Mã:
            </span>
            <span className="min-w-0 truncate text-[13px] font-semibold text-slate-900">
              {row.QrCode || "-"}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            title="Copy mã"
            className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition"
          >
            {copied ? (
              <FaCheck className="text-[11px]" />
            ) : (
              <FaRegCopy className="text-[11px]" />
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 flex-1">
        {items.map((x, idx) => (
          <div
            key={idx}
            className={`
              min-h-[46px] px-3 py-1.5
              border-r border-b border-slate-100
              ${(idx + 1) % 3 === 0 ? "border-r-0" : ""}
              ${idx >= 3 ? "border-b-0" : ""}
            `}
          >
            <div className="text-[9px] text-slate-500">{x.label}</div>
            <div className="mt-0.5 text-[11px] font-semibold text-slate-800 leading-4">
              {x.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DesktopTable({
  rows,
  inspectionType,
  selectedIds,
  toggleOne,
  handleRerunOne,
  rerunOneId,
  activeIdField,
  currentPage,
  oqcOnly,
  showModal,
}) {
  return (
    <div className="hidden md:block rounded-[18px] bg-white border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1215px] text-sm table-fixed border-collapse">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="w-[56px] px-2.5 py-2.5 text-left text-[11px] font-semibold border-b border-slate-200">
                STT
              </th>
              <th className="w-[322px] px-2 py-2.5 text-left text-[11px] font-semibold border-b border-slate-200">
                Thông tin mã
              </th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold border-b border-slate-200">
                Trạng thái trạm
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, index) => {
              const gom = getStationItem(row, "GOM");
              const kcs = getStationItem(row, "KCS");
              const oqc = getStationItem(row, "OQC");
              const activeId = row[activeIdField];
              const stt = (currentPage - 1) * PAGE_SIZE + index + 1;

              return (
                <tr
                  key={`${inspectionType}-${row.QrCode}`}
                  className="align-top hover:bg-emerald-50/20 transition-colors"
                >
                  <td className="px-2.5 py-1.5 border-b border-slate-200">
                    <div className="inline-flex h-6 min-w-[28px] items-center justify-center rounded-md bg-slate-100 px-1.5 text-[11px] font-semibold text-slate-700">
                      {stt}
                    </div>
                  </td>

                  <td
                    colSpan={2}
                    className="px-1 py-1.5 border-b border-slate-200"
                  >
                    <div className="grid grid-cols-[322px_minmax(0,1fr)] gap-[10px] items-stretch">
                      <div className="h-full">
                        <InfoGrid
                          row={row}
                          inspectionType={inspectionType}
                          showModal={showModal}
                        />
                      </div>

                      <div className="h-full">
                        <StationPanel
                          gom={gom}
                          kcs={kcs}
                          oqc={oqc}
                          inspectionType={inspectionType}
                          selectedIds={selectedIds}
                          toggleOne={toggleOne}
                          handleRerunOne={handleRerunOne}
                          rerunOneId={rerunOneId}
                          activeId={activeId}
                          oqcOnly={oqcOnly}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MobileCards({
  rows,
  inspectionType,
  selectedIds,
  toggleOne,
  handleRerunOne,
  rerunOneId,
  activeIdField,
  currentPage,
  oqcOnly,
  showModal,
}) {
  return (
    <div className="md:hidden space-y-3">
      {rows.map((row, index) => {
        const gom = getStationItem(row, "GOM");
        const kcs = getStationItem(row, "KCS");
        const oqc = getStationItem(row, "OQC");
        const activeId = row[activeIdField];
        const stt = (currentPage - 1) * PAGE_SIZE + index + 1;

        return (
          <div
            key={`${inspectionType}-${row.QrCode}`}
            className="rounded-[18px] border border-slate-200 bg-white shadow-sm overflow-hidden"
          >
            <div className="px-3 py-3 border-b border-slate-100 bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="text-[10px] text-slate-500">STT</div>
              <div className="font-semibold text-sm text-slate-800">{stt}</div>

              <div className="mt-2">
                <InfoGrid
                  row={row}
                  inspectionType={inspectionType}
                  showModal={showModal}
                />
              </div>
            </div>

            <div className="p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-2">
                Trạng thái trạm
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[760px]">
                  <StationPanel
                    gom={gom}
                    kcs={kcs}
                    oqc={oqc}
                    inspectionType={inspectionType}
                    selectedIds={selectedIds}
                    toggleOne={toggleOne}
                    handleRerunOne={handleRerunOne}
                    rerunOneId={rerunOneId}
                    activeId={activeId}
                    oqcOnly={oqcOnly}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function History() {
  const [bulkProcessModal, setBulkProcessModal] = useState({
    open: false,
    processing: false,
    total: 0,
    done: 0,
    successItems: [],
    failedItems: [],
    skippedItems: [],
    logs: [],
  });

  const today = useMemo(() => new Date(), []);
  const [range, setRange] = useState([today, today]);
  const [startDate, endDate] = range;

  const [inspectionType, setInspectionType] = useState("OQC");
  const [showStation, setShowStation] = useState("ALL");
  const [errorOnly, setErrorOnly] = useState(false);
  const [missingStationOnly, setMissingStationOnly] = useState(false);
  const [oqcOnly, setOqcOnly] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [keyword, setKeyword] = useState("");

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [rerunOneId, setRerunOneId] = useState(null);
  const [page, setPage] = useState(1);

  const [modal, setModal] = useState({
    open: false,
    type: "info",
    title: "",
    message: "",
    confirmText: "Đồng ý",
    cancelText: "Đóng",
    showCancel: false,
    loading: false,
    onConfirm: null,
  });

  const showModal = useCallback((config) => {
    setModal({
      open: true,
      type: config.type || "info",
      title: config.title || "Thông báo",
      message: config.message || "",
      confirmText: config.confirmText || "Đồng ý",
      cancelText: config.cancelText || "Đóng",
      showCancel: Boolean(config.showCancel),
      loading: Boolean(config.loading),
      onConfirm: config.onConfirm || null,
    });
  }, []);

  const closeModal = useCallback(() => {
    setModal((prev) => ({
      ...prev,
      open: false,
      loading: false,
      onConfirm: null,
    }));
  }, []);

  const resetBulkProcessModal = useCallback(() => {
    setBulkProcessModal({
      open: false,
      processing: false,
      total: 0,
      done: 0,
      successItems: [],
      failedItems: [],
      skippedItems: [],
      logs: [],
    });
  }, []);

  const activeIdField = `${inspectionType}_Id`;
  const activeSpStatusField = `${inspectionType}_SpStatus`;

  useEffect(() => {
    const timer = setTimeout(() => {
      setKeyword(searchText.trim());
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchText]);

  const fetchData = useCallback(async () => {
    if (!startDate || !endDate) return;

    setLoading(true);
    try {
      const res = await apiGetAdminHistorySummary({
        fromDate: toYmd(startDate),
        toDate: toYmd(endDate),
        errorOnly,
        inspectionType,
      });

      let data = res?.data || [];

      if (keyword) {
        const kw = keyword.toLowerCase();
        data = data.filter((x) =>
          String(x.QrCode || "").toLowerCase().includes(kw)
        );
      }

      if (missingStationOnly) {
        data = data.filter((x) => !x.GOM_Id || !x.KCS_Id || !x.OQC_Id);
      }

      if (showStation !== "ALL") {
        data = data.filter((x) => Boolean(x[`${showStation}_Id`]));
      }

      setRows(data);

      setSelectedIds((prev) =>
        prev.filter((id) =>
          data.some(
            (x) =>
              Number(x[activeIdField]) === Number(id) &&
              Number(x[activeSpStatusField]) !== 1
          )
        )
      );
    } catch (err) {
      console.error("Load admin history error:", err);
      setRows([]);
      showModal({
        type: "error",
        title: "Tải dữ liệu thất bại",
        message:
          err?.response?.data?.message ||
          err?.message ||
          "Không thể tải dữ liệu lịch sử. Vui lòng thử lại.",
      });
    } finally {
      setLoading(false);
    }
  }, [
    startDate,
    endDate,
    errorOnly,
    inspectionType,
    keyword,
    showStation,
    missingStationOnly,
    activeIdField,
    activeSpStatusField,
    showModal,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const errorRows = useMemo(
    () =>
      rows.filter(
        (x) => x[activeIdField] && Number(x[activeSpStatusField]) !== 1
      ),
    [rows, activeIdField, activeSpStatusField]
  );

  const allErrorIds = useMemo(
    () => errorRows.map((x) => Number(x[activeIdField])),
    [errorRows, activeIdField]
  );

  const isAllChecked =
    allErrorIds.length > 0 &&
    allErrorIds.every((id) => selectedIds.includes(id));

  const toggleCheckAll = () => {
    if (isAllChecked) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allErrorIds);
    }
  };

  const toggleOne = (id, checked) => {
    const numId = Number(id);
    setSelectedIds((prev) => {
      if (checked) {
        if (prev.includes(numId)) return prev;
        return [...prev, numId];
      }
      return prev.filter((x) => x !== numId);
    });
  };

  const handleRerunOne = async (id) => {
    try {
      setRerunOneId(id);
      const res = await apiRerunAdminHistory(id);

      showModal({
        type: "success",
        title: "Chạy lại thành công",
        message: res?.message || `Đã chạy lại ERP cho ID ${id} thành công.`,
      });

      await fetchData();
    } catch (err) {
      console.error("Rerun one error:", err);

      showModal({
        type: "error",
        title: "Chạy lại thất bại",
        message:
          err?.response?.data?.message ||
          err?.message ||
          "Không thể chạy lại ERP cho dòng đã chọn.",
      });

      await fetchData();
    } finally {
      setRerunOneId(null);
    }
  };

  const runBulkConfirmed = async () => {
    const ids = [...selectedIds];

    closeModal();

    setBulkLoading(true);
    setBulkProcessModal({
      open: true,
      processing: true,
      total: ids.length,
      done: 0,
      successItems: [],
      failedItems: [],
      skippedItems: [],
      logs: [],
    });

    try {
      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];

        const targetRow = rows.find(
          (x) => Number(x[activeIdField]) === Number(id)
        );

        const code = targetRow?.QrCode || `ID ${id}`;

        try {
          const rowSpStatus = Number(targetRow?.[activeSpStatusField]);

          if (!targetRow || rowSpStatus === 1) {
            setBulkProcessModal((prev) => ({
              ...prev,
              done: prev.done + 1,
              skippedItems: [
                ...prev.skippedItems,
                {
                  id,
                  code,
                  message: "Dòng này không còn thuộc danh sách lỗi hoặc đã ERP OK.",
                },
              ],
              logs: [
                ...prev.logs,
                {
                  id,
                  code,
                  status: "skipped",
                  message: "Bỏ qua vì dữ liệu hiện tại không còn lỗi.",
                },
              ],
            }));
            continue;
          }

          const res = await apiRerunAdminHistory(id);

          setBulkProcessModal((prev) => ({
            ...prev,
            done: prev.done + 1,
            successItems: [
              ...prev.successItems,
              {
                id,
                code,
                message: res?.message || "Chạy lại thành công",
              },
            ],
            logs: [
              ...prev.logs,
              {
                id,
                code,
                status: "success",
                message: res?.message || "Chạy lại thành công",
              },
            ],
          }));
        } catch (err) {
          const errMsg =
            err?.response?.data?.message ||
            err?.message ||
            "Chạy lại thất bại";

          setBulkProcessModal((prev) => ({
            ...prev,
            done: prev.done + 1,
            failedItems: [
              ...prev.failedItems,
              {
                id,
                code,
                message: errMsg,
              },
            ],
            logs: [
              ...prev.logs,
              {
                id,
                code,
                status: "failed",
                message: errMsg,
              },
            ],
          }));
        }
      }

      setBulkProcessModal((prev) => ({
        ...prev,
        processing: false,
      }));

      await fetchData();
      setSelectedIds([]);
    } catch (err) {
      console.error("Rerun bulk error:", err);

      setBulkProcessModal((prev) => ({
        ...prev,
        processing: false,
        logs: [
          ...prev.logs,
          {
            status: "failed",
            message:
              err?.response?.data?.message ||
              err?.message ||
              "Có lỗi trong quá trình xử lý hàng loạt.",
          },
        ],
      }));
    } finally {
      setBulkLoading(false);
    }
  };

  const handleRerunBulk = () => {
    if (selectedIds.length === 0) {
      showModal({
        type: "warning",
        title: "Chưa chọn dữ liệu",
        message: `Chưa chọn dòng ${inspectionType} lỗi nào để chạy lại.`,
      });
      return;
    }

    showModal({
      type: "warning",
      title: "Xác nhận chạy lại ERP",
      message: `Bạn có chắc muốn chạy lại ERP cho ${selectedIds.length} dòng ${inspectionType} đã chọn không?`,
      confirmText: "Xác nhận chạy lại",
      cancelText: "Huỷ",
      showCancel: true,
      onConfirm: runBulkConfirmed,
    });
  };

  useEffect(() => {
    setSelectedIds([]);
    setPage(1);
  }, [
    inspectionType,
    errorOnly,
    startDate,
    endDate,
    keyword,
    showStation,
    missingStationOnly,
    oqcOnly,
  ]);

  const totalRows = rows.length;
  const totalPages = Math.max(Math.ceil(totalRows / PAGE_SIZE), 1);
  const currentPage = Math.min(page, totalPages);

  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, currentPage]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-[1420px] mx-auto p-3 md:p-4 space-y-4">
        <div className="rounded-[22px] bg-white shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 md:p-4 bg-[#EAF6FF] border-b border-slate-100">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-green-100 text-green-700 text-[15px] shadow-sm">
                <FaHistory />
              </span>

              <div>
                <h1 className="text-[16px] md:text-[22px] font-[700] leading-tight text-slate-900">
                  Lịch sử trạm quét OQC
                </h1>
                <div className="text-xs md:text-sm text-slate-500 mt-0.5">
                  Theo dõi trạng thái quét và lưu ERP
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 xl:grid-cols-[130px_280px_180px_minmax(220px,1fr)] gap-2.5 items-center">
              <div className="relative min-w-0">
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Tìm theo mã QrCode..."
                  className="
                    box-border w-full min-w-0 rounded-xl bg-white px-3 py-2.5 pr-9 text-xs text-slate-700
                    shadow-sm outline-none
                    border border-slate-200
                    placeholder:text-slate-400
                    focus:border-green-300 focus:ring-1 focus:ring-green-100
                    transition
                  "
                />
                <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
              </div>

              <div className="min-w-0">
                <DatePicker
                  selectsRange
                  startDate={startDate}
                  endDate={endDate}
                  onChange={(update) => setRange(update)}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Chọn khoảng ngày"
                  wrapperClassName="w-full min-w-0"
                  className="
                    box-border w-full min-w-0 rounded-xl bg-white px-3 py-2.5 text-xs text-slate-700
                    shadow-sm outline-none
                    border border-slate-200
                    focus:border-green-300 focus:ring-1 focus:ring-green-100
                    transition
                  "
                />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm border border-slate-100">
                <input
                  type="checkbox"
                  checked={errorOnly}
                  onChange={(e) => setErrorOnly(e.target.checked)}
                  className="h-3.5 w-3.5 accent-green-600"
                />
                Chỉ hiện ERP lỗi
              </label>

              <label className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm border border-slate-100">
                <input
                  type="checkbox"
                  checked={missingStationOnly}
                  onChange={(e) => setMissingStationOnly(e.target.checked)}
                  className="h-3.5 w-3.5 accent-green-600"
                />
                Chưa đủ 3 trạm
              </label>

              <label className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm border border-slate-100">
                <input
                  type="checkbox"
                  checked={oqcOnly}
                  onChange={(e) => setOqcOnly(e.target.checked)}
                  className="h-3.5 w-3.5 accent-green-600"
                />
                Chỉ hiện OQC
              </label>

              <label className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm border border-slate-100">
                <input
                  type="checkbox"
                  checked={isAllChecked}
                  onChange={toggleCheckAll}
                  className="h-3.5 w-3.5 accent-green-600"
                />
                Chọn tất cả lỗi
              </label>

              <button
                onClick={handleRerunBulk}
                disabled={bulkLoading || selectedIds.length === 0}
                className="
                  ml-auto px-3 py-2 rounded-lg
                  bg-sky-600 hover:bg-sky-700
                  disabled:opacity-50 disabled:cursor-not-allowed
                  text-white text-xs font-medium
                  shadow-sm transition
                  flex items-center justify-center gap-2
                "
              >
                <FaSyncAlt className="text-[11px]" />
                {bulkLoading ? "Đang chạy lại..." : "Chạy lại đã chọn"}
              </button>
            </div>
          </div>

          <div className="px-3 py-2.5 md:px-4 md:py-3 bg-slate-50/70">
            <div className="flex flex-wrap gap-2 text-xs">
              <div className="rounded-full bg-white px-3 py-1 text-slate-600 shadow-sm border border-slate-100">
                Tổng mã {inspectionType}:{" "}
                <span className="font-semibold text-slate-900">{rows.length}</span>
              </div>

              <div className="rounded-full bg-white px-3 py-1 text-slate-600 shadow-sm border border-slate-100">
                ERP lỗi:{" "}
                <span className="font-semibold text-rose-600">
                  {errorRows.length}
                </span>
              </div>

              <div className="rounded-full bg-white px-3 py-1 text-slate-600 shadow-sm border border-slate-100">
                Đã chọn:{" "}
                <span className="font-semibold text-slate-900">
                  {selectedIds.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[22px] bg-white border border-slate-200 shadow-sm p-8 text-center text-sm text-slate-500">
            Đang tải dữ liệu...
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-[22px] bg-white border border-slate-200 shadow-sm p-8 text-center text-sm text-slate-500">
            Không có dữ liệu
          </div>
        ) : (
          <>
            <DesktopTable
              rows={pagedRows}
              inspectionType={inspectionType}
              selectedIds={selectedIds}
              toggleOne={toggleOne}
              handleRerunOne={handleRerunOne}
              rerunOneId={rerunOneId}
              activeIdField={activeIdField}
              currentPage={currentPage}
              oqcOnly={oqcOnly}
              showModal={showModal}
            />

            <MobileCards
              rows={pagedRows}
              inspectionType={inspectionType}
              selectedIds={selectedIds}
              toggleOne={toggleOne}
              handleRerunOne={handleRerunOne}
              rerunOneId={rerunOneId}
              activeIdField={activeIdField}
              currentPage={currentPage}
              oqcOnly={oqcOnly}
              showModal={showModal}
            />

            <div className="rounded-[18px] bg-white border border-slate-200 shadow-sm p-3">
              <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-600">
                  Trang <span className="font-semibold">{currentPage}</span> /{" "}
                  <span className="font-semibold">{totalPages}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage <= 1}
                    className="h-8 px-3 rounded-lg border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 flex items-center gap-2 text-xs"
                  >
                    <FaChevronLeft className="text-[10px]" />
                    Trước
                  </button>

                  <button
                    onClick={() =>
                      setPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage >= totalPages}
                    className="h-8 px-3 rounded-lg border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 flex items-center gap-2 text-xs"
                  >
                    Sau
                    <FaChevronRight className="text-[10px]" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <AppModal
        open={modal.open}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
        showCancel={modal.showCancel}
        loading={modal.loading}
        onClose={closeModal}
        onConfirm={modal.onConfirm ? modal.onConfirm : closeModal}
      />

      <AppModal
        open={bulkProcessModal.open}
        type={
          bulkProcessModal.processing
            ? "info"
            : bulkProcessModal.failedItems.length > 0
            ? "warning"
            : "success"
        }
        title={
          bulkProcessModal.processing
            ? "Đang chạy lại hàng loạt"
            : "Kết quả chạy lại hàng loạt"
        }
        content={
          <BulkProcessModalContent
            state={bulkProcessModal}
            modeLabel="chạy lại"
          />
        }
        confirmText={bulkProcessModal.processing ? "Đang xử lý..." : "Đóng"}
        onClose={() => {
          if (!bulkProcessModal.processing) {
            resetBulkProcessModal();
          }
        }}
        onConfirm={() => {
          if (!bulkProcessModal.processing) {
            resetBulkProcessModal();
          }
        }}
        hideFooter={false}
        closeOnOverlay={false}
        loading={bulkProcessModal.processing}
        widthClass="max-w-2xl"
      />
    </div>
  );
}

export default History;

