// import React, { useEffect, useMemo, useState } from "react";
// import {
//   FaSpinner,
//   FaTrash,
//   FaAngleLeft,
//   FaAngleRight,
//   FaEye,
//   FaTimes,
// } from "react-icons/fa";
// import {
//   apiGetTypePaylipAll,
//   apiGetHistoryPeriods,
//   apiGetHistoryBonusDates,
//   apiGetPaylipHistory,
//   apiGetPaylipDetail,
//   apiDeletePaylip,
//   apiDeleteManyPaylips,
//   apiGetPaylipHistoryAllIds,
// } from "./api/paylipHistoryApi";
// import {
//   fmtVND,
//   companyFromMSNV,
//   Row,
//   Sep,
//   Line,
//   Hr,
//   PairRow,
// } from "./sections/payslipUi";

// const PAGE_SIZE = 10;

// function formatDateVN(value) {
//   if (!value) return "-";
//   const d = new Date(value);
//   if (Number.isNaN(d.getTime())) return value;
//   const dd = String(d.getDate()).padStart(2, "0");
//   const mm = String(d.getMonth() + 1).padStart(2, "0");
//   const yyyy = d.getFullYear();
//   return `${dd}/${mm}/${yyyy}`;
// }

// function formatDateTimeVN(value) {
//   if (!value) return "-";
//   const d = new Date(value);
//   if (Number.isNaN(d.getTime())) return value;
//   const dd = String(d.getDate()).padStart(2, "0");
//   const mm = String(d.getMonth() + 1).padStart(2, "0");
//   const yyyy = d.getFullYear();
//   const hh = String(d.getHours()).padStart(2, "0");
//   const mi = String(d.getMinutes()).padStart(2, "0");
//   return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
// }

// function vOrDash(v) {
//   const s = String(v ?? "").trim();
//   return s ? s : "-";
// }

// function fmtNum2(v) {
//   if (v == null || v === "") return "-";
//   const n = Number(v);
//   if (!Number.isFinite(n)) return vOrDash(v);
//   return n.toFixed(2).replace(".", ",");
// }

// function pickFirstMoney(...vals) {
//   for (const x of vals) {
//     const s = String(x ?? "").trim();
//     if (s && s !== "0" && s !== "-") return fmtVND(s);
//   }
//   return "-";
// }

// function YearBonusView({ p }) {
//   const monthsWorked = p?.yb_monthsWorked ?? "";
//   const rating = p?.yb_rating ?? "";
//   const avgEligible = p?.yb_avgEligibleDaysYear ?? "";
//   const avgActual = p?.yb_avgWorkDaysYear ?? "";

//   const diffDays = (() => {
//     const a = Number(avgEligible);
//     const b = Number(avgActual);
//     if (!Number.isFinite(a) || !Number.isFinite(b)) return "-";
//     return (a - b).toFixed(1).replace(".", ",");
//   })();

//   const bonusMonth13 = pickFirstMoney(
//     p?.yb_bonus1MonthSalary_2,
//     p?.yb_bonus1MonthSalary_1
//   );
//   const bonusABC = pickFirstMoney(p?.yb_bonusABC_1, p?.yb_bonusABC_2);
//   const totalBonus = pickFirstMoney(p?.yb_totalBonus, p?.totalSalary);
//   const tax = pickFirstMoney(p?.yb_taxWithheld, p?.ktthue);
//   const net = pickFirstMoney(p?.yb_netPay, p?.luongthuclanh);

//   return (
//     <div className="mt-4 border rounded-lg overflow-hidden">
//       <div className="p-4">
//         <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
//           <div className="flex items-center gap-2">
//             <span className="font-semibold">MSTT</span>
//             <span className="font-bold">{vOrDash(p?.stt)}</span>
//           </div>

//           <div className="flex items-center gap-2 sm:justify-center">
//             <span className="font-semibold">Tổ:</span>
//             <span className="font-bold uppercase">
//               {vOrDash(p?.yb_team || p?.department)}
//             </span>
//           </div>

//           <div className="flex items-center gap-2 sm:justify-end">
//             <span className="font-semibold">MSNV:</span>
//             <span className="font-bold">{vOrDash(p?.msnv)}</span>
//           </div>
//         </div>

//         <div className="mt-2 text-sm flex items-center gap-3">
//           <span className="font-semibold">HỌ VÀ TÊN:</span>
//           <span className="font-extrabold uppercase">{vOrDash(p?.name)}</span>
//         </div>

//         <div className="mt-3 border-t pt-3 text-sm space-y-1">
//           <Line k="Lương cơ bản:" v={fmtVND(p?.basicSalary) || "-"} />
//           <Line k="Trách nhiệm:" v={fmtVND(p?.responsibility) || "-"} />
//           <Line k="Tiền xăng, nhà trọ :" v={fmtVND(p?.rent) || "-"} />
//           <Line k="HTCV :" v={fmtVND(p?.qualityBonus) || "-"} />

//           <div className="my-2 border-t" />

//           <Line
//             k="Tổng cộng lương:"
//             v={fmtVND(p?.totalSalary) || "-"}
//             bold
//           />

//           <div className="my-2 border-t" />

//           <Line k="Số tháng làm việc trong năm:" v={vOrDash(monthsWorked)} />
//           <Line k="Xếp loại :" v={vOrDash(rating)} />

//           <div className="my-2 border-t" />

//           <Line
//             k="Ngày công làm việc b/q đủ trong năm:"
//             v={fmtNum2(avgEligible)}
//           />
//           <Line
//             k="Ngày công làm việc thực tế b/q trong năm:"
//             v={fmtNum2(avgActual)}
//           />
//           <Line k="Chênh lệch ngày công:" v={diffDays} />

//           <div className="my-2 border-t" />

//           <Line k="Tiền thưởng tháng 13:" v={bonusMonth13} bold />
//           <Line k="Tiền thưởng đánh giá A,B,C :" v={bonusABC} />

//           <div className="my-2 border-t" />

//           <Line k="Tổng tiền thưởng :" v={totalBonus} bold />
//           <Line k="Tạm thu Thuế TNCN" v={tax} />

//           <div className="my-2 border-t" />

//           <div className="flex justify-between items-center pt-1">
//             <div className="font-extrabold text-slate-800">Thực lãnh :</div>
//             <div className="font-extrabold text-lg text-slate-900">{net}</div>
//           </div>

//           {String(p?.yb_note ?? "").trim() ? (
//             <div className="pt-2 text-xs text-slate-500">
//               <span className="font-semibold">Ghi chú:</span> {p?.yb_note}
//             </div>
//           ) : null}
//         </div>
//       </div>
//     </div>
//   );
// }

// function PaylipDetailModal({ open, onClose, detail, onDelete }) {
//   if (!open || !detail) return null;

//   const isKyI = /KỲ\s*I/i.test(detail?.title || "");
//   const isYearBonus =
//     String(detail?.docType || "").toUpperCase() === "YEAR_BONUS" ||
//     /THƯỞNG\s*NĂM/i.test(detail?.title || "");

//   return (
//     <div className="fixed inset-0 z-[1000] bg-black/40 flex items-center justify-center p-4">
//       <div className="w-full max-w-5xl max-h-[90vh] overflow-auto bg-white rounded-2xl shadow-xl border">
//         <div className="sticky top-0 z-10 bg-white border-b px-5 py-4 flex items-center justify-between">
//           <div>
//             <div className="font-bold text-slate-800">Chi tiết phiếu</div>
//             <div className="text-xs text-slate-500">
//               #{detail?.paylipId} - {detail?.title}
//             </div>
//           </div>

//           <div className="flex items-center gap-2">
//             <button
//               onClick={() => onDelete(detail)}
//               className="px-3 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 inline-flex items-center gap-2"
//             >
//               <FaTrash />
//               Xóa
//             </button>

//             <button
//               onClick={onClose}
//               className="px-3 py-2 rounded-xl bg-slate-200 text-slate-800 hover:bg-slate-300 inline-flex items-center gap-2"
//             >
//               <FaTimes />
//               Đóng
//             </button>
//           </div>
//         </div>

//         <div className="p-4 md:p-6">
//           <div className="text-center border-b pb-3">
//             <div className="font-semibold text-slate-800">
//               {companyFromMSNV(detail?.msnv)}
//             </div>
//             <div className="font-extrabold text-xl md:text-2xl text-slate-900 tracking-wide mt-1 uppercase">
//               {detail?.title}
//             </div>
//           </div>

//           <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm mt-3">
//             <div className="flex items-center gap-2">
//               <span className="font-semibold">MSTT:</span>
//               <span>{detail.stt ?? "-"}</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <span className="font-semibold">BỘ PHẬN:</span>
//               <span className="uppercase">{detail.department || "-"}</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <span className="font-semibold">MSNV:</span>
//               <span>{detail.msnv || "-"}</span>
//             </div>
//           </div>

//           <div className="mt-2 text-sm">
//             <span className="font-semibold">HỌ VÀ TÊN:</span>
//             <span className="ml-3 font-bold uppercase">
//               {detail.name || "-"}
//             </span>
//           </div>

//           {isYearBonus ? (
//             <YearBonusView p={detail} />
//           ) : isKyI ? (
//             <div className="mt-4 border">
//               <table className="w-full text-sm">
//                 <colgroup>
//                   <col className="w-[55%]" />
//                   <col className="w-[15%]" />
//                   <col className="w-[30%]" />
//                 </colgroup>
//                 <tbody>
//                   <Row left="Lương cơ bản" mid={fmtVND(detail.basicSalary)} />
//                   <Row left="Trách nhiệm" mid={fmtVND(detail.responsibility)} />
//                   <Row left="Tổng ngày công:" mid={detail.totalWorkingDays} />
//                   <Row left="Lễ:" mid={detail.holiday} />
//                   <Row
//                     left="Lương thực tế:"
//                     mid=""
//                     right={fmtVND(detail.actualSalary)}
//                     strongRight
//                   />

//                   <Sep />

//                   <Row
//                     left="Giờ tăng ca 1,5"
//                     mid={detail.ot15}
//                     right={fmtVND(detail.otSalary15)}
//                   />
//                   <Row
//                     left="Giờ tăng ca 1,8"
//                     mid={detail.ot18}
//                     right={fmtVND(detail.otSalary18)}
//                   />
//                   <Row
//                     left="Phụ cấp T.ca (0.5 giờ)"
//                     mid={detail.ot05}
//                     right={fmtVND(detail.otSalary05)}
//                   />
//                   <Row
//                     left="Phép năm:"
//                     mid={detail.annualLeave}
//                     right={fmtVND(detail.leavePay)}
//                   />
//                   <Row left="Nhà trọ (xe):" mid="" right={fmtVND(detail.rent)} />
//                   <Row
//                     left="Thưởng chất lượng:"
//                     mid=""
//                     right={fmtVND(detail.qualityBonus)}
//                   />

//                   <Sep />

//                   <Row
//                     left="TỔNG LƯƠNG KỲ I:"
//                     right={fmtVND(detail?.totalSalary)}
//                     strongLeft
//                     strongRight
//                     bigRight
//                   />
//                 </tbody>
//               </table>
//             </div>
//           ) : (
//             <div className="mt-4 grid md:grid-cols-2 gap-6">
//               <div className="rounded-xl border border-slate-200 overflow-hidden">
//                 <div className="px-4 py-2 border-b font-semibold bg-slate-50 text-slate-700">
//                   THU NHẬP
//                 </div>
//                 <div className="p-4 text-sm space-y-1">
//                   <Line k="Lương cơ bản" v={fmtVND(detail.basicSalary)} />
//                   <Line k="Trách nhiệm" v={fmtVND(detail.responsibility)} />
//                   <Line k="Công hành chánh" v={detail.totalWorkingDays} />
//                   <Line k="Công ca đêm" v={detail.congcadem} />
//                   <Line k="Tổng ngày công" v={detail.totalWorkingDays} />
//                   <Line k="Nghỉ lễ" v={detail.holiday} />
//                   <Line k="Lương thực tế" v={fmtVND(detail.actualSalary)} bold />
//                   <Hr />

//                   <PairRow
//                     label="Tăng ca 1,5"
//                     mid={detail.ot15}
//                     right={fmtVND(detail.otSalary15)}
//                   />
//                   <PairRow
//                     label="Tăng ca 1,8"
//                     mid={detail.ot18}
//                     right={fmtVND(detail.otSalary18)}
//                   />
//                   <PairRow
//                     label="Phụ cấp T.ca (0,5)"
//                     mid={detail.ot05}
//                     right={fmtVND(detail.otSalary05)}
//                   />
//                   <PairRow
//                     label="Chủ nhật"
//                     mid={detail.chunhat}
//                     right={fmtVND(detail.luongchunhat)}
//                   />
//                   <PairRow
//                     label="Phép năm"
//                     mid={detail.annualLeave}
//                     right={fmtVND(detail.leavePay)}
//                   />

//                   <Line k="Chờ việc" v={fmtVND(detail.choviec)} />
//                   <Line k="Nghỉ khác" v={fmtVND(detail.nghikhac)} />
//                   <Line k="Lương chờ việc" v={fmtVND(detail.luongchoviec)} />
//                   <Line k="Lương khác" v={fmtVND(detail.luongkhac)} />
//                   <Line k="Nhà trọ / xe" v={fmtVND(detail.rent)} />
//                   <Line
//                     k="Hỗ trợ nghỉ giữa ca"
//                     v={fmtVND(detail.hotronghigiuaca)}
//                   />
//                   <Line
//                     k="Hỗ trợ ngày hành kinh"
//                     v={fmtVND(detail.hotrongayhanhkinh)}
//                   />
//                   <Line k="Con nhỏ" v={fmtVND(detail.connho)} />
//                   <Line k="Thưởng HQCV 1(CC)" v={fmtVND(detail.thuong1CC)} />
//                   <Line k="Thưởng HQCV" v={fmtVND(detail.qualityBonus)} />
//                   <Line k="Hỗ trợ khác" v={fmtVND(detail.hotrokhac)} />
//                   <Line k="Thưởng lễ" v={fmtVND(detail.thuongle)} />

//                   <PairRow
//                     label="Tiền cơm"
//                     mid={detail.tiencomSL}
//                     right={fmtVND(detail.tiencom)}
//                   />
//                 </div>

//                 <div className="px-4 py-2 border-t font-bold flex justify-between">
//                   <span>TỔNG LƯƠNG TRƯỚC KHẤU TRỪ</span>
//                   <span className="text-emerald-700">
//                     {fmtVND(detail.totalSalary) || "-"}
//                   </span>
//                 </div>
//               </div>

//               <div className="space-y-4">
//                 <div className="rounded-xl border border-slate-200 overflow-hidden">
//                   <div className="px-4 py-2 border-b font-semibold bg-slate-50 text-slate-700">
//                     KHẤU TRỪ
//                   </div>
//                   <div className="p-4 text-sm space-y-1">
//                     <Line k="BHXH, BHYT, BHTN" v={fmtVND(detail.ktbh)} />
//                     <Line k="Công đoàn" v={fmtVND(detail.ktcongdoan)} />
//                     <Line k="Lương kỳ I" v={fmtVND(detail.ktluongky1)} />
//                     <Line k="Trừ cơm" v={fmtVND(detail.kttrucom)} />
//                     <Line k="Thuế TNCN" v={fmtVND(detail.ktthue)} />
//                     <Line k="Khấu trừ khác" v={fmtVND(detail.ktkhac)} />
//                   </div>
//                 </div>

//                 <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex justify-between items-center">
//                   <span className="font-bold text-emerald-800">
//                     LƯƠNG THỰC LÃNH
//                   </span>
//                   <span className="font-bold text-emerald-900 text-lg">
//                     {fmtVND(detail?.luongthuclanh) || "-"}
//                   </span>
//                 </div>
//               </div>
//             </div>
//           )}

//           <div className="text-[12px] text-slate-500 mt-3">
//             Ngày tạo: {formatDateTimeVN(detail?.createdAt)}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// function History() {
//   const [debouncedKeyword, setDebouncedKeyword] = useState("");
//   const [keywordInput, setKeywordInput] = useState("");
//   const [checkingAll, setCheckingAll] = useState(false);

//   const [typePaylips, setTypePaylips] = useState([]);
//   const [selectedTypeId, setSelectedTypeId] = useState("");

//   const [periods, setPeriods] = useState([]);
//   const [periodIndex, setPeriodIndex] = useState(0);

//   const [bonusDates, setBonusDates] = useState([]);
//   const [selectedBonusDate, setSelectedBonusDate] = useState("");

//   const [rows, setRows] = useState([]);
//   const [paging, setPaging] = useState({
//     page: 1,
//     pageSize: PAGE_SIZE,
//     total: 0,
//     totalPages: 0,
//   });

//   const [loadingTypes, setLoadingTypes] = useState(true);
//   const [loadingFilter, setLoadingFilter] = useState(false);
//   const [loadingTable, setLoadingTable] = useState(false);
//   const [error, setError] = useState("");

//   const [checkedIds, setCheckedIds] = useState([]);

//   const [detailOpen, setDetailOpen] = useState(false);
//   const [detailLoading, setDetailLoading] = useState(false);
//   const [detailData, setDetailData] = useState(null);

//   useEffect(() => {
//     fetchTypePaylips();
//   }, []);

//   useEffect(() => {
//     if (!selectedTypeId) return;
//     loadFiltersByType(selectedTypeId);
//   }, [selectedTypeId]);

//   useEffect(() => {
//     if (!selectedTypeId) return;
//     fetchTable(1);
//   }, [selectedTypeId, periodIndex, selectedBonusDate, debouncedKeyword]);

//   useEffect(() => {
//   const timer = setTimeout(() => {
//     const nextValue = keywordInput.trim();
//     setCheckedIds([]);
//     setDebouncedKeyword(nextValue);
//   }, 600);

//   return () => clearTimeout(timer);
// }, [keywordInput]);

//   const selectedType = useMemo(() => {
//     return (
//       typePaylips.find((x) => String(x.Id) === String(selectedTypeId)) || null
//     );
//   }, [typePaylips, selectedTypeId]);

//   const isBonusType = useMemo(() => {
//     const code = String(selectedType?.Code || "").toUpperCase();
//     const name = String(selectedType?.Name || "").toUpperCase();
//     return code.includes("BONUS") || name.includes("THƯỞNG");
//   }, [selectedType]);

//   const currentPeriod = periods[periodIndex] || null;

//   const allCheckedOnPage =
//     rows.length > 0 && rows.every((r) => checkedIds.includes(r.paylipId));

//   const allFilteredChecked =
//     paging.total > 0 && checkedIds.length === paging.total;

//   function buildFilterParams() {
//     const params = {
//       idTypePaylip: selectedTypeId,
//     };

//     if (debouncedKeyword) {
//       params.keyword = debouncedKeyword;
//     }

//     if (isBonusType) {
//       if (selectedBonusDate) {
//         params.createdDate = selectedBonusDate;
//       }
//     } else {
//       if (currentPeriod) {
//         params.kyTime = currentPeriod.kyTime;
//         params.thangTime = currentPeriod.thangTime;
//         params.namTime = currentPeriod.namTime;
//       }
//     }

//     return params;
//   }

//   async function fetchTypePaylips() {
//     setLoadingTypes(true);
//     setError("");
//     try {
//       const rs = await apiGetTypePaylipAll();
//       const list = rs?.data || [];
//       setTypePaylips(list);

//       const defaultItem =
//         list.find((x) => String(x.Code || "").toUpperCase() === "PAYSLIP") ||
//         list[0];

//       if (defaultItem) {
//         setSelectedTypeId(String(defaultItem.Id));
//       }
//     } catch (e) {
//       console.error(e);
//       setError("Không thể tải danh sách loại phiếu lương");
//     } finally {
//       setLoadingTypes(false);
//     }
//   }

//   async function loadFiltersByType(typeId) {
//     setLoadingFilter(true);
//     setError("");
//     setRows([]);
//     setCheckedIds([]);
//     setPaging({
//       page: 1,
//       pageSize: PAGE_SIZE,
//       total: 0,
//       totalPages: 0,
//     });

//     try {
//       const item = typePaylips.find((x) => String(x.Id) === String(typeId));
//       const code = String(item?.Code || "").toUpperCase();
//       const name = String(item?.Name || "").toUpperCase();
//       const bonus = code.includes("BONUS") || name.includes("THƯỞNG");

//       if (bonus) {
//         const rs = await apiGetHistoryBonusDates(typeId);
//         const list = rs?.data || [];
//         setBonusDates(list);
//         setSelectedBonusDate(list[0]?.createdDate || "");
//         setPeriods([]);
//         setPeriodIndex(0);
//       } else {
//         const rs = await apiGetHistoryPeriods(typeId);
//         const list = rs?.data || [];
//         setPeriods(list);
//         setPeriodIndex(0);
//         setBonusDates([]);
//         setSelectedBonusDate("");
//       }
//     } catch (e) {
//       console.error(e);
//       setError("Không thể tải bộ lọc lịch sử");
//     } finally {
//       setLoadingFilter(false);
//     }
//   }

//   async function fetchTable(page = 1) {
//     if (!selectedTypeId) return;

//     setLoadingTable(true);
//     setError("");

//     try {
//       const params = {
//         ...buildFilterParams(),
//         page,
//         pageSize: PAGE_SIZE,
//       };

//       const rs = await apiGetPaylipHistory(params);
//       setRows(rs?.data || []);
//       setPaging(
//         rs?.pagination || {
//           page,
//           pageSize: PAGE_SIZE,
//           total: 0,
//           totalPages: 0,
//         }
//       );
//     } catch (e) {
//       console.error(e);
//       setRows([]);
//       setError("Không thể tải danh sách lịch sử");
//     } finally {
//       setLoadingTable(false);
//     }
//   }

//   async function toggleCheckAll() {
//     if (allFilteredChecked) {
//       setCheckedIds([]);
//       return;
//     }

//     try {
//       setCheckingAll(true);
//       const rs = await apiGetPaylipHistoryAllIds(buildFilterParams());
//       setCheckedIds(rs?.data || []);
//     } catch (e) {
//       console.error(e);
//       alert("Không thể chọn tất cả dữ liệu");
//     } finally {
//       setCheckingAll(false);
//     }
//   }

//   function toggleCheckOne(id) {
//     setCheckedIds((prev) =>
//       prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
//     );
//   }

//   function handleClearSearch() {
//     setKeywordInput("");
//     setDebouncedKeyword("");
//     setCheckedIds([]);
//   }

//   async function handleDeleteOne(row) {
//     const ok = window.confirm(
//       `Xóa phiếu của ${row?.name || "-"} (${row?.msnv || "-"})?`
//     );
//     if (!ok) return;

//     try {
//       await apiDeletePaylip(row.paylipId);
//       setCheckedIds((prev) => prev.filter((x) => x !== row.paylipId));

//       if (detailData?.paylipId === row.paylipId) {
//         setDetailOpen(false);
//         setDetailData(null);
//       }

//       await fetchTable(paging.page);
//     } catch (e) {
//       console.error(e);
//       alert("Xóa thất bại");
//     }
//   }

//   async function handleDeleteMany() {
//     if (!checkedIds.length) {
//       alert("Vui lòng chọn ít nhất 1 dòng");
//       return;
//     }

//     const ok = window.confirm(`Xóa ${checkedIds.length} dòng đã chọn?`);
//     if (!ok) return;

//     try {
//       await apiDeleteManyPaylips(checkedIds);
//       setCheckedIds([]);
//       setDetailOpen(false);
//       setDetailData(null);
//       await fetchTable(1);
//     } catch (e) {
//       console.error(e);
//       alert("Xóa nhiều thất bại");
//     }
//   }

//   async function openDetail(row) {
//     setDetailOpen(true);
//     setDetailLoading(true);
//     setDetailData(null);

//     try {
//       const rs = await apiGetPaylipDetail(row.paylipId);
//       setDetailData(rs?.data || null);
//     } catch (e) {
//       console.error(e);
//       alert("Không thể tải chi tiết");
//       setDetailOpen(false);
//     } finally {
//       setDetailLoading(false);
//     }
//   }

//   return (
//     <div className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-70px)]">
//       <div className="max-w-7xl mx-auto space-y-5">
//         <div className="bg-white rounded-2xl border shadow-sm p-4 md:p-5">
//           <div className="flex flex-col gap-4">
//             <div>
//               <h1 className="text-xl font-bold text-slate-800">
//                 Lịch sử upload phiếu lương / thưởng
//               </h1>
//               <p className="text-sm text-slate-500 mt-1">
//                 Quản lý dữ liệu đã upload, lọc theo loại, kỳ, ngày tạo, tên hoặc
//                 MSNV.
//               </p>
//             </div>

//             <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
//               <div>
//                 <label className="block text-sm font-medium text-slate-700 mb-1.5">
//                   Loại phiếu
//                 </label>
//                 <select
//                   value={selectedTypeId}
//                   onChange={(e) => {
//                     setCheckedIds([]);
//                     setSelectedTypeId(e.target.value);
//                   }}
//                   className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
//                   disabled={loadingTypes}
//                 >
//                   <option value="">-- Chọn loại phiếu --</option>
//                   {typePaylips.map((item) => (
//                     <option key={item.Id} value={item.Id}>
//                       {item.Name}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               {!isBonusType ? (
//                 <div>
//                   <label className="block text-sm font-medium text-slate-700 mb-1.5">
//                     Kỳ lương
//                   </label>

//                   <div className="flex items-center gap-2">
//                     <button
//                       className="w-11 h-11 rounded-xl border bg-white hover:bg-slate-50 disabled:opacity-50"
//                       onClick={() => {
//                         setCheckedIds([]);
//                         setPeriodIndex((s) => Math.max(s - 1, 0));
//                       }}
//                       disabled={periodIndex <= 0 || loadingFilter || !periods.length}
//                     >
//                       <FaAngleLeft className="mx-auto" />
//                     </button>

//                     <div className="flex-1 h-11 rounded-xl border bg-slate-50 px-4 flex items-center justify-center font-semibold text-slate-700">
//                       {currentPeriod
//                         ? `Kỳ ${currentPeriod.kyTime}, tháng ${currentPeriod.thangTime}, năm ${currentPeriod.namTime}`
//                         : "Không có dữ liệu kỳ"}
//                     </div>

//                     <button
//                       className="w-11 h-11 rounded-xl border bg-white hover:bg-slate-50 disabled:opacity-50"
//                       onClick={() => {
//                         setCheckedIds([]);
//                         setPeriodIndex((s) =>
//                           Math.min(s + 1, periods.length - 1)
//                         );
//                       }}
//                       disabled={
//                         periodIndex >= periods.length - 1 ||
//                         loadingFilter ||
//                         !periods.length
//                       }
//                     >
//                       <FaAngleRight className="mx-auto" />
//                     </button>
//                   </div>
//                 </div>
//               ) : (
//                 <div>
//                   <label className="block text-sm font-medium text-slate-700 mb-1.5">
//                     Ngày upload
//                   </label>
//                   <select
//                     value={selectedBonusDate || ""}
//                     onChange={(e) => {
//                       setCheckedIds([]);
//                       setSelectedBonusDate(e.target.value);
//                     }}
//                     className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
//                     disabled={loadingFilter}
//                   >
//                     {!bonusDates.length && (
//                       <option value="">Không có dữ liệu ngày</option>
//                     )}
//                     {bonusDates.map((x, idx) => (
//                       <option key={`${x.createdDate}-${idx}`} value={x.createdDate}>
//                         {formatDateVN(x.createdDate)}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               )}

//               <div>
//   <label className="block text-sm font-medium text-slate-700 mb-1.5">
//     Tìm theo tên hoặc MSNV
//   </label>

//   <div className="flex items-center gap-2">
//     <input
//       type="text"
//       value={keywordInput}
//       onChange={(e) => setKeywordInput(e.target.value)}
//       placeholder="Nhập tên hoặc MSNV..."
//       className="flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
//     />

//     <button
//       type="button"
//       onClick={handleClearSearch}
//       className="px-4 py-2.5 rounded-xl bg-slate-200 text-slate-800 hover:bg-slate-300"
//     >
//       Xóa
//     </button>
//   </div>
// </div>
//             </div>

//             {debouncedKeyword && (
//               <div className="text-sm text-slate-600">
//                 Đang lọc theo từ khóa:{" "}
//                 <span className="font-semibold text-slate-800">{debouncedKeyword}</span>
//               </div>
//             )}
//           </div>

//           {error && (
//             <div className="mt-4 rounded-xl bg-rose-50 text-rose-700 px-3 py-2 text-sm">
//               {error}
//             </div>
//           )}
//         </div>

//         <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
//           <div className="px-4 md:px-5 py-3 border-b bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
//             <div>
//               <div className="font-semibold text-slate-800">
//                 Danh sách phiếu đã upload
//               </div>
//               <div className="text-xs text-slate-500">
//                 Tổng: {paging.total} dòng
//               </div>
//               {allFilteredChecked && (
//                 <div className="text-xs text-amber-600 mt-1">
//                   Đang chọn toàn bộ {checkedIds.length} dòng theo điều kiện lọc
//                   hiện tại.
//                 </div>
//               )}
//               {!allFilteredChecked && allCheckedOnPage && (
//                 <div className="text-xs text-sky-600 mt-1">
//                   Đã chọn hết các dòng trong trang hiện tại.
//                 </div>
//               )}
//             </div>

//             <div className="flex items-center gap-2 flex-wrap">
//               {checkingAll && (
//                 <div className="text-xs text-slate-500 inline-flex items-center gap-2">
//                   <FaSpinner className="animate-spin" />
//                   Đang chọn toàn bộ...
//                 </div>
//               )}

//               <button
//                 onClick={handleDeleteMany}
//                 disabled={!checkedIds.length}
//                 className="px-3 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 inline-flex items-center gap-2"
//               >
//                 <FaTrash />
//                 Xóa đã chọn ({checkedIds.length})
//               </button>
//             </div>
//           </div>

//           <div className="overflow-x-auto">
//             <table className="min-w-full text-sm">
//               <thead className="bg-slate-50 text-slate-700">
//                 <tr>
//                   <th className="px-3 py-3 text-left w-12">
//                     <input
//                       type="checkbox"
//                       checked={allFilteredChecked}
//                       onChange={toggleCheckAll}
//                       disabled={checkingAll || paging.total === 0}
//                     />
//                   </th>
//                   <th className="px-3 py-3 text-left w-16">#</th>
//                   <th className="px-3 py-3 text-left">MSNV</th>
//                   <th className="px-3 py-3 text-left">Họ và tên</th>
//                   <th className="px-3 py-3 text-left">Lương cơ bản</th>
//                   <th className="px-3 py-3 text-left">
//                     {isBonusType ? "Thực lãnh thưởng" : "Lương thực lãnh"}
//                   </th>
//                   <th className="px-3 py-3 text-left">Ngày tạo</th>
//                   <th className="px-3 py-3 text-center w-[150px]">Thao tác</th>
//                 </tr>
//               </thead>

//               <tbody className="divide-y">
//                 {loadingTable ? (
//                   <tr>
//                     <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
//                       <FaSpinner className="animate-spin inline mr-2" />
//                       Đang tải dữ liệu...
//                     </td>
//                   </tr>
//                 ) : rows.length === 0 ? (
//                   <tr>
//                     <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
//                       Không có dữ liệu
//                     </td>
//                   </tr>
//                 ) : (
//                   rows.map((row, idx) => (
//                     <tr
//                       key={row.paylipId}
//                       className="hover:bg-slate-50 cursor-pointer"
//                       onClick={() => openDetail(row)}
//                     >
//                       <td
//                         className="px-3 py-3"
//                         onClick={(e) => e.stopPropagation()}
//                       >
//                         <input
//                           type="checkbox"
//                           checked={checkedIds.includes(row.paylipId)}
//                           onChange={() => toggleCheckOne(row.paylipId)}
//                         />
//                       </td>

//                       <td className="px-3 py-3 text-slate-500">
//                         {(paging.page - 1) * paging.pageSize + idx + 1}
//                       </td>

//                       <td className="px-3 py-3 font-medium text-slate-800">
//                         {row.msnv || "-"}
//                       </td>

//                       <td className="px-3 py-3">{row.name || "-"}</td>

//                       <td className="px-3 py-3">
//                         {fmtVND(row.basicSalary) || "-"}
//                       </td>

//                       <td className="px-3 py-3 font-semibold text-emerald-700">
//                         {isBonusType
//                           ? fmtVND(row.yb_netPay) || "-"
//                           : fmtVND(row.luongthuclanh) || "-"}
//                       </td>

//                       <td className="px-3 py-3 text-slate-500">
//                         {formatDateTimeVN(row.createdAt)}
//                       </td>

//                       <td
//                         className="px-3 py-3"
//                         onClick={(e) => e.stopPropagation()}
//                       >
//                         <div className="flex items-center justify-center gap-2">
//                           <button
//                             className="px-3 py-2 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 inline-flex items-center gap-2"
//                             onClick={() => openDetail(row)}
//                           >
//                             <FaEye />
//                             Xem
//                           </button>

//                           <button
//                             className="px-3 py-2 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 inline-flex items-center gap-2"
//                             onClick={() => handleDeleteOne(row)}
//                           >
//                             <FaTrash />
//                             Xóa
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </div>

//           <div className="px-4 md:px-5 py-3 border-t bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
//             <div className="text-sm text-slate-500">
//               Trang {paging.page}/{Math.max(paging.totalPages || 1, 1)}
//             </div>

//             <div className="flex items-center gap-2">
//               <button
//                 onClick={() => fetchTable(Math.max(paging.page - 1, 1))}
//                 disabled={paging.page <= 1 || loadingTable}
//                 className="px-3 py-2 rounded-xl border bg-white hover:bg-slate-50 disabled:opacity-50"
//               >
//                 Trước
//               </button>

//               <button
//                 onClick={() =>
//                   fetchTable(
//                     Math.min(paging.page + 1, Math.max(paging.totalPages || 1, 1))
//                   )
//                 }
//                 disabled={
//                   paging.page >= Math.max(paging.totalPages || 1, 1) ||
//                   loadingTable
//                 }
//                 className="px-3 py-2 rounded-xl border bg-white hover:bg-slate-50 disabled:opacity-50"
//               >
//                 Sau
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {detailOpen && (
//         <>
//           {detailLoading && !detailData ? (
//             <div className="fixed inset-0 z-[1000] bg-black/40 flex items-center justify-center">
//               <div className="bg-white rounded-2xl px-6 py-5 shadow-xl border text-slate-700">
//                 <FaSpinner className="animate-spin inline mr-2" />
//                 Đang tải chi tiết...
//               </div>
//             </div>
//           ) : (
//             <PaylipDetailModal
//               open={detailOpen}
//               detail={detailData}
//               onClose={() => {
//                 setDetailOpen(false);
//                 setDetailData(null);
//               }}
//               onDelete={handleDeleteOne}
//             />
//           )}
//         </>
//       )}
//     </div>
//   );
// }

// export default History;

import React, { useEffect, useMemo, useState } from "react";
import {
  FaSpinner,
  FaTrash,
  FaAngleLeft,
  FaAngleRight,
  FaEye,
  FaTimes,
  FaExclamationTriangle,
  FaCheckCircle,
  FaInfoCircle,
} from "react-icons/fa";
import {
  apiGetTypePaylipAll,
  apiGetHistoryPeriods,
  apiGetHistoryBonusDates,
  apiGetPaylipHistory,
  apiGetPaylipDetail,
  apiDeletePaylip,
  apiDeleteManyPaylips,
  apiGetPaylipHistoryAllIds,
} from "./api/paylipHistoryApi";
import {
  fmtVND,
  companyFromMSNV,
  Row,
  Sep,
  Line,
  Hr,
  PairRow,
} from "./sections/payslipUi";

const PAGE_SIZE = 10;

function formatDateVN(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatDateTimeVN(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

function vOrDash(v) {
  const s = String(v ?? "").trim();
  return s ? s : "-";
}

function fmtNum2(v) {
  if (v == null || v === "") return "-";
  const n = Number(v);
  if (!Number.isFinite(n)) return vOrDash(v);
  return n.toFixed(2).replace(".", ",");
}

function pickFirstMoney(...vals) {
  for (const x of vals) {
    const s = String(x ?? "").trim();
    if (s && s !== "0" && s !== "-") return fmtVND(s);
  }
  return "-";
}

function BaseModal({ open, children, maxWidth = "max-w-md" }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1200] bg-black/40 flex items-center justify-center p-4">
      <div
        className={`w-full ${maxWidth} bg-white rounded-2xl shadow-xl border overflow-hidden`}
      >
        {children}
      </div>
    </div>
  );
}

function ConfirmModal({
  open,
  title = "Xác nhận",
  message,
  confirmText = "Đồng ý",
  cancelText = "Hủy",
  tone = "danger",
  busy = false,
  onConfirm,
  onClose,
}) {
  const toneMap = {
    danger: {
      icon: <FaExclamationTriangle className="text-rose-600 text-xl" />,
      confirmClass:
        "bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50",
    },
    primary: {
      icon: <FaInfoCircle className="text-sky-600 text-xl" />,
      confirmClass:
        "bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50",
    },
  };

  const currentTone = toneMap[tone] || toneMap.danger;

  return (
    <BaseModal open={open}>
      <div className="px-5 py-4 border-b flex items-center gap-3">
        {currentTone.icon}
        <div className="font-bold text-slate-800">{title}</div>
      </div>

      <div className="px-5 py-4 text-sm text-slate-600 whitespace-pre-line">
        {message}
      </div>

      <div className="px-5 py-4 border-t flex items-center justify-end gap-2 bg-slate-50">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="px-4 py-2 rounded-xl bg-slate-200 text-slate-800 hover:bg-slate-300 disabled:opacity-50"
        >
          {cancelText}
        </button>

        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className={`px-4 py-2 rounded-xl inline-flex items-center gap-2 ${currentTone.confirmClass}`}
        >
          {busy && <FaSpinner className="animate-spin" />}
          {confirmText}
        </button>
      </div>
    </BaseModal>
  );
}

function NoticeModal({
  open,
  title = "Thông báo",
  message,
  tone = "info",
  onClose,
}) {
  const toneMap = {
    success: {
      icon: <FaCheckCircle className="text-emerald-600 text-xl" />,
      headerClass: "text-emerald-700",
    },
    error: {
      icon: <FaExclamationTriangle className="text-rose-600 text-xl" />,
      headerClass: "text-rose-700",
    },
    info: {
      icon: <FaInfoCircle className="text-sky-600 text-xl" />,
      headerClass: "text-sky-700",
    },
  };

  const currentTone = toneMap[tone] || toneMap.info;

  return (
    <BaseModal open={open}>
      <div className="px-5 py-4 border-b flex items-center gap-3">
        {currentTone.icon}
        <div className={`font-bold ${currentTone.headerClass}`}>{title}</div>
      </div>

      <div className="px-5 py-4 text-sm text-slate-600 whitespace-pre-line">
        {message}
      </div>

      <div className="px-5 py-4 border-t flex justify-end bg-slate-50">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-slate-200 text-slate-800 hover:bg-slate-300"
        >
          Đóng
        </button>
      </div>
    </BaseModal>
  );
}

function YearBonusView({ p }) {
  const monthsWorked = p?.yb_monthsWorked ?? "";
  const rating = p?.yb_rating ?? "";
  const avgEligible = p?.yb_avgEligibleDaysYear ?? "";
  const avgActual = p?.yb_avgWorkDaysYear ?? "";

  const diffDays = (() => {
    const a = Number(avgEligible);
    const b = Number(avgActual);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return "-";
    return (a - b).toFixed(1).replace(".", ",");
  })();

  const bonusMonth13 = pickFirstMoney(
    p?.yb_bonus1MonthSalary_2,
    p?.yb_bonus1MonthSalary_1
  );
  const bonusABC = pickFirstMoney(p?.yb_bonusABC_1, p?.yb_bonusABC_2);
  const totalBonus = pickFirstMoney(p?.yb_totalBonus, p?.totalSalary);
  const tax = pickFirstMoney(p?.yb_taxWithheld, p?.ktthue);
  const net = pickFirstMoney(p?.yb_netPay, p?.luongthuclanh);

  return (
    <div className="mt-4 border rounded-lg overflow-hidden">
      <div className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold">MSTT</span>
            <span className="font-bold">{vOrDash(p?.stt)}</span>
          </div>

          <div className="flex items-center gap-2 sm:justify-center">
            <span className="font-semibold">Tổ:</span>
            <span className="font-bold uppercase">
              {vOrDash(p?.yb_team || p?.department)}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:justify-end">
            <span className="font-semibold">MSNV:</span>
            <span className="font-bold">{vOrDash(p?.msnv)}</span>
          </div>
        </div>

        <div className="mt-2 text-sm flex items-center gap-3">
          <span className="font-semibold">HỌ VÀ TÊN:</span>
          <span className="font-extrabold uppercase">{vOrDash(p?.name)}</span>
        </div>

        <div className="mt-3 border-t pt-3 text-sm space-y-1">
          <Line k="Lương cơ bản:" v={fmtVND(p?.basicSalary) || "-"} />
          <Line k="Trách nhiệm:" v={fmtVND(p?.responsibility) || "-"} />
          <Line k="Tiền xăng, nhà trọ :" v={fmtVND(p?.rent) || "-"} />
          <Line k="HTCV :" v={fmtVND(p?.qualityBonus) || "-"} />

          <div className="my-2 border-t" />

          <Line
            k="Tổng cộng lương:"
            v={fmtVND(p?.totalSalary) || "-"}
            bold
          />

          <div className="my-2 border-t" />

          <Line k="Số tháng làm việc trong năm:" v={vOrDash(monthsWorked)} />
          <Line k="Xếp loại :" v={vOrDash(rating)} />

          <div className="my-2 border-t" />

          <Line
            k="Ngày công làm việc b/q đủ trong năm:"
            v={fmtNum2(avgEligible)}
          />
          <Line
            k="Ngày công làm việc thực tế b/q trong năm:"
            v={fmtNum2(avgActual)}
          />
          <Line k="Chênh lệch ngày công:" v={diffDays} />

          <div className="my-2 border-t" />

          <Line k="Tiền thưởng tháng 13:" v={bonusMonth13} bold />
          <Line k="Tiền thưởng đánh giá A,B,C :" v={bonusABC} />

          <div className="my-2 border-t" />

          <Line k="Tổng tiền thưởng :" v={totalBonus} bold />
          <Line k="Tạm thu Thuế TNCN" v={tax} />

          <div className="my-2 border-t" />

          <div className="flex justify-between items-center pt-1">
            <div className="font-extrabold text-slate-800">Thực lãnh :</div>
            <div className="font-extrabold text-lg text-slate-900">{net}</div>
          </div>

          {String(p?.yb_note ?? "").trim() ? (
            <div className="pt-2 text-xs text-slate-500">
              <span className="font-semibold">Ghi chú:</span> {p?.yb_note}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function PaylipDetailModal({ open, onClose, detail, onDelete }) {
  if (!open || !detail) return null;

  const isKyI = /KỲ\s*I/i.test(detail?.title || "");
  const isYearBonus =
    String(detail?.docType || "").toUpperCase() === "YEAR_BONUS" ||
    /THƯỞNG\s*NĂM/i.test(detail?.title || "");

  return (
    <div className="fixed inset-0 z-[1000] bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-auto bg-white rounded-2xl shadow-xl border">
        <div className="sticky top-0 z-10 bg-white border-b px-5 py-4 flex items-center justify-between">
          <div>
            <div className="font-bold text-slate-800">Chi tiết phiếu</div>
            <div className="text-xs text-slate-500">
              #{detail?.paylipId} - {detail?.title}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onDelete(detail)}
              className="px-3 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 inline-flex items-center gap-2"
            >
              <FaTrash />
              Xóa
            </button>

            <button
              onClick={onClose}
              className="px-3 py-2 rounded-xl bg-slate-200 text-slate-800 hover:bg-slate-300 inline-flex items-center gap-2"
            >
              <FaTimes />
              Đóng
            </button>
          </div>
        </div>

        <div className="p-4 md:p-6">
          <div className="text-center border-b pb-3">
            <div className="font-semibold text-slate-800">
              {companyFromMSNV(detail?.msnv)}
            </div>
            <div className="font-extrabold text-xl md:text-2xl text-slate-900 tracking-wide mt-1 uppercase">
              {detail?.title}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm mt-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold">MSTT:</span>
              <span>{detail.stt ?? "-"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">BỘ PHẬN:</span>
              <span className="uppercase">{detail.department || "-"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">MSNV:</span>
              <span>{detail.msnv || "-"}</span>
            </div>
          </div>

          <div className="mt-2 text-sm">
            <span className="font-semibold">HỌ VÀ TÊN:</span>
            <span className="ml-3 font-bold uppercase">
              {detail.name || "-"}
            </span>
          </div>

          {isYearBonus ? (
            <YearBonusView p={detail} />
          ) : isKyI ? (
            <div className="mt-4 border">
              <table className="w-full text-sm">
                <colgroup>
                  <col className="w-[55%]" />
                  <col className="w-[15%]" />
                  <col className="w-[30%]" />
                </colgroup>
                <tbody>
                  <Row left="Lương cơ bản" mid={fmtVND(detail.basicSalary)} />
                  <Row left="Trách nhiệm" mid={fmtVND(detail.responsibility)} />
                  <Row left="Tổng ngày công:" mid={detail.totalWorkingDays} />
                  <Row left="Lễ:" mid={detail.holiday} />
                  <Row
                    left="Lương thực tế:"
                    mid=""
                    right={fmtVND(detail.actualSalary)}
                    strongRight
                  />

                  <Sep />

                  <Row
                    left="Giờ tăng ca 1,5"
                    mid={detail.ot15}
                    right={fmtVND(detail.otSalary15)}
                  />
                  <Row
                    left="Giờ tăng ca 1,8"
                    mid={detail.ot18}
                    right={fmtVND(detail.otSalary18)}
                  />
                  <Row
                    left="Phụ cấp T.ca (0.5 giờ)"
                    mid={detail.ot05}
                    right={fmtVND(detail.otSalary05)}
                  />
                  <Row
                    left="Phép năm:"
                    mid={detail.annualLeave}
                    right={fmtVND(detail.leavePay)}
                  />
                  <Row left="Nhà trọ (xe):" mid="" right={fmtVND(detail.rent)} />
                  <Row
                    left="Thưởng chất lượng:"
                    mid=""
                    right={fmtVND(detail.qualityBonus)}
                  />

                  <Sep />

                  <Row
                    left="TỔNG LƯƠNG KỲ I:"
                    right={fmtVND(detail?.totalSalary)}
                    strongLeft
                    strongRight
                    bigRight
                  />
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-4 grid md:grid-cols-2 gap-6">
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-2 border-b font-semibold bg-slate-50 text-slate-700">
                  THU NHẬP
                </div>
                <div className="p-4 text-sm space-y-1">
                  <Line k="Lương cơ bản" v={fmtVND(detail.basicSalary)} />
                  <Line k="Trách nhiệm" v={fmtVND(detail.responsibility)} />
                  <Line k="Công hành chánh" v={detail.totalWorkingDays} />
                  <Line k="Công ca đêm" v={detail.congcadem} />
                  <Line k="Tổng ngày công" v={detail.totalWorkingDays} />
                  <Line k="Nghỉ lễ" v={detail.holiday} />
                  <Line k="Lương thực tế" v={fmtVND(detail.actualSalary)} bold />
                  <Hr />

                  <PairRow
                    label="Tăng ca 1,5"
                    mid={detail.ot15}
                    right={fmtVND(detail.otSalary15)}
                  />
                  <PairRow
                    label="Tăng ca 1,8"
                    mid={detail.ot18}
                    right={fmtVND(detail.otSalary18)}
                  />
                  <PairRow
                    label="Phụ cấp T.ca (0,5)"
                    mid={detail.ot05}
                    right={fmtVND(detail.otSalary05)}
                  />
                  <PairRow
                    label="Chủ nhật"
                    mid={detail.chunhat}
                    right={fmtVND(detail.luongchunhat)}
                  />
                  <PairRow
                    label="Phép năm"
                    mid={detail.annualLeave}
                    right={fmtVND(detail.leavePay)}
                  />

                  <Line k="Chờ việc" v={fmtVND(detail.choviec)} />
                  <Line k="Nghỉ khác" v={fmtVND(detail.nghikhac)} />
                  <Line k="Lương chờ việc" v={fmtVND(detail.luongchoviec)} />
                  <Line k="Lương khác" v={fmtVND(detail.luongkhac)} />
                  <Line k="Nhà trọ / xe" v={fmtVND(detail.rent)} />
                  <Line
                    k="Hỗ trợ nghỉ giữa ca"
                    v={fmtVND(detail.hotronghigiuaca)}
                  />
                  <Line
                    k="Hỗ trợ ngày hành kinh"
                    v={fmtVND(detail.hotrongayhanhkinh)}
                  />
                  <Line k="Con nhỏ" v={fmtVND(detail.connho)} />
                  <Line k="Thưởng HQCV 1(CC)" v={fmtVND(detail.thuong1CC)} />
                  <Line k="Thưởng HQCV" v={fmtVND(detail.qualityBonus)} />
                  <Line k="Hỗ trợ khác" v={fmtVND(detail.hotrokhac)} />
                  <Line k="Thưởng lễ" v={fmtVND(detail.thuongle)} />

                  <PairRow
                    label="Tiền cơm"
                    mid={detail.tiencomSL}
                    right={fmtVND(detail.tiencom)}
                  />
                </div>

                <div className="px-4 py-2 border-t font-bold flex justify-between">
                  <span>TỔNG LƯƠNG TRƯỚC KHẤU TRỪ</span>
                  <span className="text-emerald-700">
                    {fmtVND(detail.totalSalary) || "-"}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-4 py-2 border-b font-semibold bg-slate-50 text-slate-700">
                    KHẤU TRỪ
                  </div>
                  <div className="p-4 text-sm space-y-1">
                    <Line k="BHXH, BHYT, BHTN" v={fmtVND(detail.ktbh)} />
                    <Line k="Công đoàn" v={fmtVND(detail.ktcongdoan)} />
                    <Line k="Lương kỳ I" v={fmtVND(detail.ktluongky1)} />
                    <Line k="Trừ cơm" v={fmtVND(detail.kttrucom)} />
                    <Line k="Thuế TNCN" v={fmtVND(detail.ktthue)} />
                    <Line k="Khấu trừ khác" v={fmtVND(detail.ktkhac)} />
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex justify-between items-center">
                  <span className="font-bold text-emerald-800">
                    LƯƠNG THỰC LÃNH
                  </span>
                  <span className="font-bold text-emerald-900 text-lg">
                    {fmtVND(detail?.luongthuclanh) || "-"}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="text-[12px] text-slate-500 mt-3">
            Ngày tạo: {formatDateTimeVN(detail?.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
}

function History() {
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [checkingAll, setCheckingAll] = useState(false);

  const [typePaylips, setTypePaylips] = useState([]);
  const [selectedTypeId, setSelectedTypeId] = useState("");

  const [periods, setPeriods] = useState([]);
  const [periodIndex, setPeriodIndex] = useState(0);

  const [bonusDates, setBonusDates] = useState([]);
  const [selectedBonusDate, setSelectedBonusDate] = useState("");

  const [rows, setRows] = useState([]);
  const [paging, setPaging] = useState({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });

  const [loadingTypes, setLoadingTypes] = useState(true);
  const [loadingFilter, setLoadingFilter] = useState(false);
  const [loadingTable, setLoadingTable] = useState(false);
  const [error, setError] = useState("");

  const [checkedIds, setCheckedIds] = useState([]);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);

  const [confirmState, setConfirmState] = useState({
    open: false,
    title: "",
    message: "",
    busy: false,
    onConfirm: null,
  });

  const [noticeState, setNoticeState] = useState({
    open: false,
    title: "",
    message: "",
    tone: "info",
  });

  useEffect(() => {
    fetchTypePaylips();
  }, []);

  useEffect(() => {
    if (!selectedTypeId) return;
    loadFiltersByType(selectedTypeId);
  }, [selectedTypeId]);

  useEffect(() => {
    if (!selectedTypeId) return;
    fetchTable(1);
  }, [selectedTypeId, periodIndex, selectedBonusDate, debouncedKeyword]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const nextValue = keywordInput.trim();
      setCheckedIds([]);
      setDebouncedKeyword(nextValue);
    }, 600);

    return () => clearTimeout(timer);
  }, [keywordInput]);

  const selectedType = useMemo(() => {
    return (
      typePaylips.find((x) => String(x.Id) === String(selectedTypeId)) || null
    );
  }, [typePaylips, selectedTypeId]);

  const isBonusType = useMemo(() => {
    const code = String(selectedType?.Code || "").toUpperCase();
    const name = String(selectedType?.Name || "").toUpperCase();
    return code.includes("BONUS") || name.includes("THƯỞNG");
  }, [selectedType]);

  const currentPeriod = periods[periodIndex] || null;

  const allCheckedOnPage =
    rows.length > 0 && rows.every((r) => checkedIds.includes(r.paylipId));

  const allFilteredChecked =
    paging.total > 0 && checkedIds.length === paging.total;

  function openNotice(title, message, tone = "info") {
    setNoticeState({
      open: true,
      title,
      message,
      tone,
    });
  }

  function closeNotice() {
    setNoticeState({
      open: false,
      title: "",
      message: "",
      tone: "info",
    });
  }

  function openConfirm({ title, message, onConfirm }) {
    setConfirmState({
      open: true,
      title,
      message,
      busy: false,
      onConfirm,
    });
  }

  function closeConfirm() {
    if (confirmState.busy) return;
    setConfirmState({
      open: false,
      title: "",
      message: "",
      busy: false,
      onConfirm: null,
    });
  }

  async function runConfirm() {
    if (!confirmState.onConfirm) return;
    try {
      setConfirmState((prev) => ({ ...prev, busy: true }));
      await confirmState.onConfirm();
      setConfirmState({
        open: false,
        title: "",
        message: "",
        busy: false,
        onConfirm: null,
      });
    } catch (e) {
      console.error(e);
      setConfirmState((prev) => ({ ...prev, busy: false }));
      openNotice(
        "Thao tác thất bại",
        e?.response?.data?.message || e?.message || "Đã có lỗi xảy ra.",
        "error"
      );
    }
  }

  function buildFilterParams() {
    const params = {
      idTypePaylip: selectedTypeId,
    };

    if (debouncedKeyword) {
      params.keyword = debouncedKeyword;
    }

    if (isBonusType) {
      if (selectedBonusDate) {
        params.createdDate = selectedBonusDate;
      }
    } else {
      if (currentPeriod) {
        params.kyTime = currentPeriod.kyTime;
        params.thangTime = currentPeriod.thangTime;
        params.namTime = currentPeriod.namTime;
      }
    }

    return params;
  }

  async function fetchTypePaylips() {
    setLoadingTypes(true);
    setError("");
    try {
      const rs = await apiGetTypePaylipAll();
      const list = rs?.data || [];
      setTypePaylips(list);

      const defaultItem =
        list.find((x) => String(x.Code || "").toUpperCase() === "PAYSLIP") ||
        list[0];

      if (defaultItem) {
        setSelectedTypeId(String(defaultItem.Id));
      }
    } catch (e) {
      console.error(e);
      setError("Không thể tải danh sách loại phiếu lương");
      openNotice(
        "Không thể tải dữ liệu",
        e?.response?.data?.message ||
          "Không thể tải danh sách loại phiếu lương.",
        "error"
      );
    } finally {
      setLoadingTypes(false);
    }
  }

  async function loadFiltersByType(typeId) {
    setLoadingFilter(true);
    setError("");
    setRows([]);
    setCheckedIds([]);
    setPaging({
      page: 1,
      pageSize: PAGE_SIZE,
      total: 0,
      totalPages: 0,
    });

    try {
      const item = typePaylips.find((x) => String(x.Id) === String(typeId));
      const code = String(item?.Code || "").toUpperCase();
      const name = String(item?.Name || "").toUpperCase();
      const bonus = code.includes("BONUS") || name.includes("THƯỞNG");

      if (bonus) {
        const rs = await apiGetHistoryBonusDates(typeId);
        const list = rs?.data || [];
        setBonusDates(list);
        setSelectedBonusDate(list[0]?.createdDate || "");
        setPeriods([]);
        setPeriodIndex(0);
      } else {
        const rs = await apiGetHistoryPeriods(typeId);
        const list = rs?.data || [];
        setPeriods(list);
        setPeriodIndex(0);
        setBonusDates([]);
        setSelectedBonusDate("");
      }
    } catch (e) {
      console.error(e);
      setError("Không thể tải bộ lọc lịch sử");
      openNotice(
        "Không thể tải bộ lọc",
        e?.response?.data?.message || "Không thể tải bộ lọc lịch sử.",
        "error"
      );
    } finally {
      setLoadingFilter(false);
    }
  }

  async function fetchTable(page = 1) {
    if (!selectedTypeId) return;

    setLoadingTable(true);
    setError("");

    try {
      const params = {
        ...buildFilterParams(),
        page,
        pageSize: PAGE_SIZE,
      };

      const rs = await apiGetPaylipHistory(params);
      setRows(rs?.data || []);
      setPaging(
        rs?.pagination || {
          page,
          pageSize: PAGE_SIZE,
          total: 0,
          totalPages: 0,
        }
      );
    } catch (e) {
      console.error(e);
      setRows([]);
      setError("Không thể tải danh sách lịch sử");
      openNotice(
        "Không thể tải danh sách",
        e?.response?.data?.message || "Không thể tải danh sách lịch sử.",
        "error"
      );
    } finally {
      setLoadingTable(false);
    }
  }

  async function toggleCheckAll() {
    if (allFilteredChecked) {
      setCheckedIds([]);
      return;
    }

    try {
      setCheckingAll(true);
      const rs = await apiGetPaylipHistoryAllIds(buildFilterParams());
      setCheckedIds(rs?.data || []);
    } catch (e) {
      console.error(e);
      openNotice(
        "Không thể chọn tất cả",
        e?.response?.data?.message || "Không thể chọn tất cả dữ liệu.",
        "error"
      );
    } finally {
      setCheckingAll(false);
    }
  }

  function toggleCheckOne(id) {
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleClearSearch() {
    setKeywordInput("");
    setDebouncedKeyword("");
    setCheckedIds([]);
  }

  function handleDeleteOne(row) {
    openConfirm({
      title: "Xác nhận xóa phiếu",
      message: `Anh/chị có chắc muốn xóa phiếu của ${row?.name || "-"} (${row?.msnv || "-"}) không?`,
      onConfirm: async () => {
        await apiDeletePaylip(row.paylipId);
        setCheckedIds((prev) => prev.filter((x) => x !== row.paylipId));

        if (detailData?.paylipId === row.paylipId) {
          setDetailOpen(false);
          setDetailData(null);
        }

        await fetchTable(paging.page);
        openNotice("Xóa thành công", "Phiếu đã được xóa.", "success");
      },
    });
  }

  function handleDeleteMany() {
    if (!checkedIds.length) {
      openNotice("Chưa chọn dữ liệu", "Vui lòng chọn ít nhất 1 dòng.", "info");
      return;
    }

    openConfirm({
      title: "Xác nhận xóa nhiều",
      message: `Anh/chị có chắc muốn xóa ${checkedIds.length} dòng đã chọn không?`,
      onConfirm: async () => {
        await apiDeleteManyPaylips(checkedIds);
        setCheckedIds([]);
        setDetailOpen(false);
        setDetailData(null);
        await fetchTable(1);
        openNotice(
          "Xóa thành công",
          `Đã xóa ${checkedIds.length} dòng được chọn.`,
          "success"
        );
      },
    });
  }

  async function openDetail(row) {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailData(null);

    try {
      const rs = await apiGetPaylipDetail(row.paylipId);
      setDetailData(rs?.data || null);
    } catch (e) {
      console.error(e);
      setDetailOpen(false);
      openNotice(
        "Không thể tải chi tiết",
        e?.response?.data?.message || "Không thể tải chi tiết phiếu.",
        "error"
      );
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <>
      <div className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-70px)]">
        <div className="max-w-7xl mx-auto space-y-5">
          <div className="bg-white rounded-2xl border shadow-sm p-4 md:p-5">
            <div className="flex flex-col gap-4">
              <div>
                <h1 className="text-xl font-bold text-slate-800">
                  Lịch sử upload phiếu lương / thưởng
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Quản lý dữ liệu đã upload, lọc theo loại, kỳ, ngày tạo, tên
                  hoặc MSNV.
                </p>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Loại phiếu
                  </label>
                  <select
                    value={selectedTypeId}
                    onChange={(e) => {
                      setCheckedIds([]);
                      setSelectedTypeId(e.target.value);
                    }}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                    disabled={loadingTypes}
                  >
                    <option value="">-- Chọn loại phiếu --</option>
                    {typePaylips.map((item) => (
                      <option key={item.Id} value={item.Id}>
                        {item.Name}
                      </option>
                    ))}
                  </select>
                </div>

                {!isBonusType ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Kỳ lương
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        className="w-11 h-11 rounded-xl border bg-white hover:bg-slate-50 disabled:opacity-50"
                        onClick={() => {
                          setCheckedIds([]);
                          setPeriodIndex((s) =>
                            Math.min(s + 1, periods.length - 1)
                          );
                        }}
                        disabled={
                          periodIndex >= periods.length - 1 ||
                          loadingFilter ||
                          !periods.length
                        }
                      >
                        <FaAngleLeft className="mx-auto" />
                      </button>

                      <div className="flex-1 h-11 rounded-xl border bg-slate-50 px-4 flex items-center justify-center font-semibold text-slate-700">
                        {currentPeriod
                          ? `Kỳ ${currentPeriod.kyTime}, tháng ${currentPeriod.thangTime}, năm ${currentPeriod.namTime}`
                          : "Không có dữ liệu kỳ"}
                      </div>

                      <button
                        className="w-11 h-11 rounded-xl border bg-white hover:bg-slate-50 disabled:opacity-50"
                        onClick={() => {
                          setCheckedIds([]);
                          setPeriodIndex((s) => Math.max(s - 1, 0));
                        }}
                        disabled={
                          periodIndex <= 0 || loadingFilter || !periods.length
                        }
                      >
                        <FaAngleRight className="mx-auto" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Ngày upload
                    </label>
                    <select
                      value={selectedBonusDate || ""}
                      onChange={(e) => {
                        setCheckedIds([]);
                        setSelectedBonusDate(e.target.value);
                      }}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                      disabled={loadingFilter}
                    >
                      {!bonusDates.length && (
                        <option value="">Không có dữ liệu ngày</option>
                      )}
                      {bonusDates.map((x, idx) => (
                        <option
                          key={`${x.createdDate}-${idx}`}
                          value={x.createdDate}
                        >
                          {formatDateVN(x.createdDate)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Tìm theo tên hoặc MSNV
                  </label>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      placeholder="Nhập tên hoặc MSNV..."
                      className="flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                    />

                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="px-4 py-2.5 rounded-xl bg-slate-200 text-slate-800 hover:bg-slate-300"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>

              {debouncedKeyword && (
                <div className="text-sm text-slate-600">
                  Đang lọc theo từ khóa:{" "}
                  <span className="font-semibold text-slate-800">
                    {debouncedKeyword}
                  </span>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 rounded-xl bg-rose-50 text-rose-700 px-3 py-2 text-sm">
                {error}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="px-4 md:px-5 py-3 border-b bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-slate-800">
                  Danh sách phiếu đã upload
                </div>
                <div className="text-xs text-slate-500">
                  Tổng: {paging.total} dòng
                </div>
                {allFilteredChecked && (
                  <div className="text-xs text-amber-600 mt-1">
                    Đang chọn toàn bộ {checkedIds.length} dòng theo điều kiện
                    lọc hiện tại.
                  </div>
                )}
                {!allFilteredChecked && allCheckedOnPage && (
                  <div className="text-xs text-sky-600 mt-1">
                    Đã chọn hết các dòng trong trang hiện tại.
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {checkingAll && (
                  <div className="text-xs text-slate-500 inline-flex items-center gap-2">
                    <FaSpinner className="animate-spin" />
                    Đang chọn toàn bộ...
                  </div>
                )}

                <button
                  onClick={handleDeleteMany}
                  disabled={!checkedIds.length}
                  className="px-3 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  <FaTrash />
                  Xóa đã chọn ({checkedIds.length})
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-3 py-3 text-left w-12">
                      <input
                        type="checkbox"
                        checked={allFilteredChecked}
                        onChange={toggleCheckAll}
                        disabled={checkingAll || paging.total === 0}
                      />
                    </th>
                    <th className="px-3 py-3 text-left w-16">#</th>
                    <th className="px-3 py-3 text-left">MSNV</th>
                    <th className="px-3 py-3 text-left">Họ và tên</th>
                    <th className="px-3 py-3 text-left">Lương cơ bản</th>
                    <th className="px-3 py-3 text-left">
                      {isBonusType ? "Thực lãnh thưởng" : "Lương thực lãnh"}
                    </th>
                    <th className="px-3 py-3 text-left">Ngày tạo</th>
                    <th className="px-3 py-3 text-center w-[150px]">
                      Thao tác
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {loadingTable ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-10 text-center text-slate-500"
                      >
                        <FaSpinner className="animate-spin inline mr-2" />
                        Đang tải dữ liệu...
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-10 text-center text-slate-400"
                      >
                        Không có dữ liệu
                      </td>
                    </tr>
                  ) : (
                    rows.map((row, idx) => (
                      <tr
                        key={row.paylipId}
                        className="hover:bg-slate-50 cursor-pointer"
                        onClick={() => openDetail(row)}
                      >
                        <td
                          className="px-3 py-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={checkedIds.includes(row.paylipId)}
                            onChange={() => toggleCheckOne(row.paylipId)}
                          />
                        </td>

                        <td className="px-3 py-3 text-slate-500">
                          {(paging.page - 1) * paging.pageSize + idx + 1}
                        </td>

                        <td className="px-3 py-3 font-medium text-slate-800">
                          {row.msnv || "-"}
                        </td>

                        <td className="px-3 py-3">{row.name || "-"}</td>

                        <td className="px-3 py-3">
                          {fmtVND(row.basicSalary) || "-"}
                        </td>

                        <td className="px-3 py-3 font-semibold text-emerald-700">
                          {isBonusType
                            ? fmtVND(row.yb_netPay) || "-"
                            : fmtVND(row.luongthuclanh) || "-"}
                        </td>

                        <td className="px-3 py-3 text-slate-500">
                          {formatDateTimeVN(row.createdAt)}
                        </td>

                        <td
                          className="px-3 py-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <button
                              className="px-3 py-2 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 inline-flex items-center gap-2"
                              onClick={() => openDetail(row)}
                            >
                              <FaEye />
                              Xem
                            </button>

                            <button
                              className="px-3 py-2 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 inline-flex items-center gap-2"
                              onClick={() => handleDeleteOne(row)}
                            >
                              <FaTrash />
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-4 md:px-5 py-3 border-t bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="text-sm text-slate-500">
                Trang {paging.page}/{Math.max(paging.totalPages || 1, 1)}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchTable(Math.max(paging.page - 1, 1))}
                  disabled={paging.page <= 1 || loadingTable}
                  className="px-3 py-2 rounded-xl border bg-white hover:bg-slate-50 disabled:opacity-50"
                >
                  Trước
                </button>

                <button
                  onClick={() =>
                    fetchTable(
                      Math.min(
                        paging.page + 1,
                        Math.max(paging.totalPages || 1, 1)
                      )
                    )
                  }
                  disabled={
                    paging.page >= Math.max(paging.totalPages || 1, 1) ||
                    loadingTable
                  }
                  className="px-3 py-2 rounded-xl border bg-white hover:bg-slate-50 disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            </div>
          </div>
        </div>

        {detailOpen && (
          <>
            {detailLoading && !detailData ? (
              <div className="fixed inset-0 z-[1000] bg-black/40 flex items-center justify-center">
                <div className="bg-white rounded-2xl px-6 py-5 shadow-xl border text-slate-700">
                  <FaSpinner className="animate-spin inline mr-2" />
                  Đang tải chi tiết...
                </div>
              </div>
            ) : (
              <PaylipDetailModal
                open={detailOpen}
                detail={detailData}
                onClose={() => {
                  setDetailOpen(false);
                  setDetailData(null);
                }}
                onDelete={handleDeleteOne}
              />
            )}
          </>
        )}
      </div>

      <ConfirmModal
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmText="Xác nhận"
        cancelText="Hủy"
        tone="danger"
        busy={confirmState.busy}
        onConfirm={runConfirm}
        onClose={closeConfirm}
      />

      <NoticeModal
        open={noticeState.open}
        title={noticeState.title}
        message={noticeState.message}
        tone={noticeState.tone}
        onClose={closeNotice}
      />
    </>
  );
}

export default History;