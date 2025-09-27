// import 'react-datepicker/dist/react-datepicker.css';
// import React, { useEffect, useRef, useState } from 'react';
// import * as XLSX from 'xlsx-js-style';
// import { saveAs } from 'file-saver';
// import axios from 'axios';
// import DatePicker from 'react-datepicker';
// import { vi } from 'date-fns/locale';
// import { BASE_URL } from '~/config/index';
// import HandleGetCodeQr from '~/components/HandleGetCodeQR';
// import { useSelector } from 'react-redux';
// import { userSelector } from '~/redux/selectors';
// import { FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';
// import http from '~/api/http';

// import MODULEID from '~/contants/modules';
// import { useFeatureAllowed } from '~/hooks/useFeatureGuard';

// // ======================= Helpers =======================
// const cx = (...classes) => classes.filter(Boolean).join(' ');
// const Card = ({ className = '', children }) => (
//   <div className={cx('bg-white/80 backdrop-blur rounded-2xl border border-slate-200 shadow-sm', className)}>
//     {children}
//   </div>
// );

// const SectionTitle = ({ children }) => (
//   <div className="rounded-2xl border border-emerald-200/40 bg-gradient-to-r from-emerald-50 to-cyan-50 p-4 md:p-5 shadow-sm">
//     <h2 className="text-lg md:text-xl font-bold text-slate-800">{children}</h2>
//   </div>
// );

// const SummaryPill = ({ label, value }) => (
//   <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm">
//     <span className="text-slate-500">{label}</span>
//     <span className="font-semibold text-slate-800">{value}</span>
//   </div>
// );

// // ======================= Component =======================
// const Report = () => {

//   const EXPORT_EXCEL_REPORT = useFeatureAllowed(MODULEID.CANRAC, 'cr_xuatexceltrangbaocao');
//   const ADD_DATA_REPORT = useFeatureAllowed(MODULEID.CANRAC, 'cr_themdulieuobangbaocao');

//   const [loading, setLoading] = useState(true);
//   const [report, setReport] = useState([]);

//   const [filterType, setFilterType] = useState('one'); // 'one' | 'range'
//   const [statusUpdate, setStatusUpdate] = useState(false);
//   const [selectInput, setSelectInput] = useState({ group: '', item: '', index: '' });
//   const [value, setValue] = useState('');
//   const inputRef = useRef(null);

//   const [dateOne, setDateOne] = useState(new Date());
//   const [startDate, setStartDate] = useState(() => {
//     const d = new Date();
//     d.setDate(d.getDate() - 1);
//     return d;
//   });
//   const [endDate, setEndDate] = useState(new Date());

//   const tmp = useSelector(userSelector);
//   const [user, setUser] = useState({});
//   useEffect(() => {
//     setUser(tmp?.login?.currentUser);
//   }, [tmp]);

//   // ---- math helpers
//   const sumArrays = (...arrays) => {
//     const length = arrays[0]?.length || 0;
//     return Array.from({ length }, (_, i) =>
//       Math.round(arrays.reduce((sum, arr) => sum + (arr[i] || 0), 0) * 100) / 100,
//     );
//   };

//   function groupSumWithZeros(arr) {
//     const result = [...arr];
//     for (let i = 0; i < arr.length - 1; i += 7) {
//       const sum =
//         (arr[i] || 0) +
//         (arr[i + 1] || 0) +
//         (arr[i + 2] || 0) +
//         (arr[i + 3] || 0) +
//         (arr[i + 4] || 0) +
//         (arr[i + 5] || 0) +
//         (arr[i + 6] || 0);
//       result[i] = sum;
//       result[i + 1] = 0;
//       result[i + 2] = 0;
//       result[i + 3] = 0;
//       result[i + 4] = 0;
//       result[i + 5] = 0;
//       result[i + 6] = 0;
//     }
//     return result;
//   }

//   // format helpers
//   function formatDateToVNString(date) {
//     const vnOffset = 7 * 60;
//     const localTime = new Date(date.getTime() + vnOffset * 60 * 1000);
//     return localTime.toISOString().slice(0, 10);
//   }
//   function formatDateToVNString1(date) {
//     const vnOffset = 7 * 60;
//     const utc = date.getTime() + date.getTimezoneOffset() * 60000;
//     const vnTime = new Date(utc + vnOffset * 60000);
//     const day = String(vnTime.getDate()).padStart(2, '0');
//     const month = String(vnTime.getMonth() + 1).padStart(2, '0');
//     const year = vnTime.getFullYear();
//     return `${day}/${month}/${year}`;
//   }
//   function formatDateToVNString2(date) {
//     const vnOffset = 7 * 60;
//     const utc = date.getTime() + date.getTimezoneOffset() * 60000;
//     const vnTime = new Date(utc + vnOffset * 60000);
//     const day = String(vnTime.getDate()).padStart(2, '0');
//     const month = String(vnTime.getMonth() + 1).padStart(2, '0');
//     const year = vnTime.getFullYear();
//     return `${day}-${month}-${year}`;
//   }
//   function trimKeepLast(arr, numToRemove = 8) {
//     if (!Array.isArray(arr) || arr.length === 0) return [];
//     if (arr.length <= numToRemove) return arr.slice(-1);
//     const cutIndex = arr.length - numToRemove - 1;
//     return [...arr.slice(0, cutIndex + 1), arr[arr.length - 1]];
//   }

//   useEffect(() => {
//     fetchTodayReport();
//   }, [dateOne, startDate, endDate, filterType]);

//   const fetchTodayReport = async () => {
//     setLoading(true);
//     try {
//       const res = await http.get(`${BASE_URL}/api/statistics/weight-by-unit`, {
//         params: {
//           type: filterType,
//           startDate: filterType === 'one' ? formatDateToVNString(dateOne) : formatDateToVNString(startDate),
//           endDate: filterType === 'one' ? formatDateToVNString(dateOne) : formatDateToVNString(endDate),
//         },
//       });

//       if (res.data.status === 'success') {
//         let tmp = {
//           ['Bổ sung-M1B']: res.data.data.find((e) => e.u === 'Chuyền 1B')?.value || [...Array(64).fill(0)],
//           ['Bổ sung-M2A-2B']: res.data.data.find((e) => e.u === 'Chuyền 2A-2B')?.value || [...Array(64).fill(0)],
//           ['Bổ sung-TC TBS']: [...Array(64).fill(0)],

//           ['Logo-']: res.data.data.find((e) => e.d === 'Tổ logo')?.value || [...Array(64).fill(0)],
//           ['Ép-']: res.data.data.find((e) => e.d === 'Tổ ép')?.value || [...Array(64).fill(0)],

//           ['T3-M1']: res.data.data.find((e) => e.u === 'Chuyền 1')?.value || [...Array(64).fill(0)],
//           ['T3-M2']: res.data.data.find((e) => e.u === 'Chuyền 2')?.value || [...Array(64).fill(0)],
//           ['T3-M3']: res.data.data.find((e) => e.u === 'Chuyền 3')?.value || [...Array(64).fill(0)],
//           ['T3-M4']: res.data.data.find((e) => e.u === 'Chuyền 4')?.value || [...Array(64).fill(0)],
//           ['T3-M5']: res.data.data.find((e) => e.u === 'Chuyền 5')?.value || [...Array(64).fill(0)],
//           ['T3-M6']: res.data.data.find((e) => e.u === 'Chuyền 6')?.value || [...Array(64).fill(0)],
//           ['T3-M7']: res.data.data.find((e) => e.u === 'Chuyền 7')?.value || [...Array(64).fill(0)],
//           ['T3-M8']: res.data.data.find((e) => e.u === 'Chuyền 8')?.value || [...Array(64).fill(0)],
//           ['T3-RC T3']:
//             res.data.data.find((e) => e.u === 'Rác thải chung' && e.d === 'Tổ 3')?.value || [...Array(64).fill(0)],
//           ['T3-TC T3']: [...Array(64).fill(0)],

//           ['T4A-M4A-4B']: res.data.data.find((e) => e.u === 'Chuyền 4A-4B')?.value || [...Array(64).fill(0)],
//           ['T4A-M5A-5B']: res.data.data.find((e) => e.u === 'Chuyền 5A-5B')?.value || [...Array(64).fill(0)],
//           ['T4A-M6A-6B']: res.data.data.find((e) => e.u === 'Chuyền 6A-6B')?.value || [...Array(64).fill(0)],
//           ['T4A-M7A-7B']: res.data.data.find((e) => e.u === 'Chuyền 7A-7B')?.value || [...Array(64).fill(0)],
//           ['T4A-M8A-8B']: res.data.data.find((e) => e.u === 'Chuyền 8A-8B')?.value || [...Array(64).fill(0)],
//           ['T4A-M9A-9B']: res.data.data.find((e) => e.u === 'Chuyền 9A-9B')?.value || [...Array(64).fill(0)],

//           ['T4B-M10A']: res.data.data.find((e) => e.u === 'Chuyền 10A')?.value || [...Array(64).fill(0)],
//           ['T4B-M11A']: res.data.data.find((e) => e.u === 'Chuyền 11A')?.value || [...Array(64).fill(0)],
//           ['T4B-M12A']: res.data.data.find((e) => e.u === 'Chuyền 12A')?.value || [...Array(64).fill(0)],
//           ['T4B-M13A']: res.data.data.find((e) => e.u === 'Chuyền 13A')?.value || [...Array(64).fill(0)],
//           ['T4B-M14A']: res.data.data.find((e) => e.u === 'Chuyền 14A')?.value || [...Array(64).fill(0)],

//           ['Robot-MRB1']: res.data.data.find((e) => e.u === 'Chuyền RB1')?.value || [...Array(64).fill(0)],
//           ['Robot-MRB2']: res.data.data.find((e) => e.u === 'Chuyền RB2')?.value || [...Array(64).fill(0)],
//           ['Robot-MRB3']: res.data.data.find((e) => e.u === 'Chuyền RB3')?.value || [...Array(64).fill(0)],
//           ['Robot-RC T4']:
//             res.data.data.find((e) => e.u === 'Rác thải chung' && e.d === 'Tổ 4')?.value || [...Array(64).fill(0)],
//           ['Robot-TC T4']: [...Array(64).fill(0)],

//           ['T5-M10B']: res.data.data.find((e) => e.u === 'Chuyền 10B')?.value || [...Array(64).fill(0)],
//           ['T5-M11B']: res.data.data.find((e) => e.u === 'Chuyền 11B')?.value || [...Array(64).fill(0)],
//           ['T5-M12B']: res.data.data.find((e) => e.u === 'Chuyền 12B')?.value || [...Array(64).fill(0)],
//           ['T5-M13B']: res.data.data.find((e) => e.u === 'Chuyền 13B')?.value || [...Array(64).fill(0)],
//           ['T5-M14B']: res.data.data.find((e) => e.u === 'Chuyền 14B')?.value || [...Array(64).fill(0)],
//           ['T5-RC T5']:
//             res.data.data.find((e) => e.u === 'Rác thải chung' && e.d === 'Tổ 5')?.value || [...Array(64).fill(0)],
//           ['T5-TC T5']: [...Array(64).fill(0)],

//           ['Mẫu-M3A-3B']: res.data.data.find((e) => e.u === 'Chuyền 3A-3B')?.value || [...Array(64).fill(0)],
//           ['Canh hàng-M1A']: res.data.data.find((e) => e.u === 'Chuyền 1A')?.value || [...Array(64).fill(0)],

//           ['Pha màu-']: res.data.data.find((e) => e.d === 'Pha màu')?.value || [...Array(64).fill(0)],
//           ['Chụp khuôn-']: res.data.data.find((e) => e.d === 'Chụp khung')?.value || [...Array(64).fill(0)],
//           ['Kế hoạch-']: res.data.data.find((e) => e.d === 'Kế hoạch')?.value || [...Array(64).fill(0)],
//           ['Bán hàng-']: res.data.data.find((e) => e.d === 'Bán hàng')?.value || [...Array(64).fill(0)],
//           ['Chất lượng-']: res.data.data.find((e) => e.d === 'Chất lượng')?.value || [...Array(64).fill(0)],
//           ['Kcs-']: res.data.data.find((e) => e.d === 'Kcs')?.value || [...Array(64).fill(0)],
//           ['Điều hành-']: res.data.data.find((e) => e.d === 'Điều hành')?.value || [...Array(64).fill(0)],
//           ['Sửa hàng-']: res.data.data.find((e) => e.d === 'Tổ sửa hàng')?.value || [...Array(64).fill(0)],
//           ['Vật tư-']: res.data.data.find((e) => e.d === 'Vật tư')?.value || [...Array(64).fill(0)],
//           ['IT - Bảo trì-']: res.data.data.find((e) => e.d === 'IT - Bảo trì')?.value || [...Array(64).fill(0)],
//           ['Văn phòng-']: res.data.data.find((e) => e.d === 'Văn phòng')?.value || [...Array(64).fill(0)],

//           ['-Cộng']: res.data.data.find((e) => e.u === 'Chuyền 8')?.value || [...Array(64).fill(0)],
//           ['Tổng cộng-']: res.data.data.find((e) => e.u === 'Chuyền 8')?.value || [...Array(64).fill(0)],
//         };

//         // build groups
//         tmp['T2-'] = sumArrays(tmp['Logo-'], tmp['Ép-']);
//         tmp['T3-TC T3'] = sumArrays(
//           tmp['T3-M1'],
//           tmp['T3-M2'],
//           tmp['T3-M3'],
//           tmp['T3-M4'],
//           tmp['T3-M5'],
//           tmp['T3-M6'],
//           tmp['T3-M7'],
//           tmp['T3-M8'],
//           tmp['T3-RC T3'],
//         );
//         tmp['Robot-TC T4'] = sumArrays(
//           tmp['T4A-M4A-4B'],
//           tmp['T4A-M5A-5B'],
//           tmp['T4A-M6A-6B'],
//           tmp['T4A-M7A-7B'],
//           tmp['T4A-M8A-8B'],
//           tmp['T4A-M9A-9B'],
//           tmp['T4B-M10A'],
//           tmp['T4B-M11A'],
//           tmp['T4B-M12A'],
//           tmp['T4B-M13A'],
//           tmp['T4B-M14A'],
//           tmp['Robot-MRB1'],
//           tmp['Robot-MRB2'],
//           tmp['Robot-MRB3'],
//           tmp['Robot-RC T4'],
//         );
//         tmp['T5-TC T5'] = sumArrays(tmp['T5-M10B'], tmp['T5-M11B'], tmp['T5-M12B'], tmp['T5-M13B'], tmp['T5-M14B'], tmp['T5-RC T5']);
//         tmp['Bổ sung-TC TBS'] = sumArrays(tmp['Bổ sung-M1B'], tmp['Bổ sung-M2A-2B']);

//         tmp['-Cộng'] = sumArrays(
//           tmp['Mẫu-M3A-3B'],
//           tmp['Canh hàng-M1A'],
//           tmp['Pha màu-'],
//           tmp['Chụp khuôn-'],
//           tmp['Kế hoạch-'],
//           tmp['Logo-'],
//           tmp['Bán hàng-'],
//           tmp['Chất lượng-'],
//           tmp['Kcs-'],
//           tmp['Điều hành-'],
//           tmp['Ép-'],
//           tmp['Sửa hàng-'],
//           tmp['Vật tư-'],
//           tmp['IT - Bảo trì-'],
//           tmp['Văn phòng-'],
//         );

//         tmp['Tổng cộng-'] = sumArrays(tmp['T3-TC T3'], tmp['Robot-TC T4'], tmp['T5-TC T5'], tmp['Bổ sung-TC TBS'], tmp['-Cộng']);
//         tmp['Tổng cộng-'] = groupSumWithZeros(tmp['Tổng cộng-']);

//         // Trim cho UI gọn
//         for (const key in tmp) tmp[key] = trimKeepLast(tmp[key]);

//         if (filterType === 'range') {
//           [
//             'T2-',
//             'T3-TC T3',
//             'Robot-TC T4',
//             'T5-TC T5',
//             'Bổ sung-TC TBS',
//             'Mẫu-M3A-3B',
//             'Canh hàng-M1A',
//             'Pha màu-',
//             'Chụp khuôn-',
//             'Kế hoạch-',
//             'Logo-',
//             'Bán hàng-',
//             'Chất lượng-',
//             'Kcs-',
//             'Điều hành-',
//             'Ép-',
//             'Sửa hàng-',
//             'Vật tư-',
//             'IT - Bảo trì-',
//             'Văn phòng-',
//           ].forEach((k) => (tmp[k] = groupSumWithZeros(tmp[k])));
//         }

//         setReport(tmp);
//       }
//     } catch (e) {
//       // eslint-disable-next-line no-console
//       console.error('Lỗi khi tải dữ liệu: ', e.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ======================= Excel (giữ nguyên logic của bạn) =======================
//   // (ĐỂ NGUYÊN exportToExcel & exportToExcel2 — mình không thay đổi nội dung)
//   // --- BEGIN EXCEL FUNCS ---
//   const exportToExcel = () => {
//     const wb = XLSX.utils.book_new();

//     const headerRow1 = [
//       'BP/Tổ',
//       'Chuyền',
//       'Giẻ lau dính mực thường',
//       '',
//       '',
//       '',
//       '',
//       '',
//       '',
//       'Giẻ lau dính mực lapa',
//       '',
//       '',
//       '',
//       '',
//       '',
//       '',
//       'Băng keo',
//       '',
//       '',
//       '',
//       '',
//       '',
//       '',
//       'Keo bàn thải',
//       '',
//       '',
//       '',
//       '',
//       '',
//       '',
//       'Mực in thải',
//       '',
//       '',
//       '',
//       '',
//       '',
//       '',
//       'Mực in lapa thải',
//       '',
//       '',
//       '',
//       '',
//       '',
//       '',
//       'Vụn logo',
//       '',
//       '',
//       '',
//       '',
//       '',
//       '',
//       'Lụa căng khung',
//       '',
//       '',
//       '',
//       '',
//       '',
//       '',
//       'Tổng',
//     ];
//     const headerRow2 = [
//       '',
//       '',
//       'C1',
//       'C2',
//       'C3',
//       'D1',
//       'D2',
//       'HC',
//       'KoC',
//       'C1',
//       'C2',
//       'C3',
//       'D1',
//       'D2',
//       'HC',
//       'KoC',
//       'C1',
//       'C2',
//       'C3',
//       'D1',
//       'D2',
//       'HC',
//       'KoC',
//       'C1',
//       'C2',
//       'C3',
//       'D1',
//       'D2',
//       'HC',
//       'KoC',
//       'C1',
//       'C2',
//       'C3',
//       'D1',
//       'D2',
//       'HC',
//       'KoC',
//       'C1',
//       'C2',
//       'C3',
//       'D1',
//       'D2',
//       'HC',
//       'KoC',
//       'C1',
//       'C2',
//       'C3',
//       'D1',
//       'D2',
//       'HC',
//       'KoC',
//       'C1',
//       'C2',
//       'C3',
//       'D1',
//       'D2',
//       'HC',
//       'KoC',
//       '',
//     ];
//     const dataExcel = [
//       { group: 'Bổ sung', items: ['M1B', 'M2A-2B', 'TC TBS'] },
//       { group: 'T2', items: [''] },
//       { group: 'T3', items: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'RC T3', 'TC T3'] },
//       { group: 'T4A', items: ['M4A-4B', 'M5A-5B', 'M6A-6B', 'M7A-7B', 'M8A-8B', 'M9A-9B'] },
//       { group: 'T4B', items: ['M10A', 'M11A', 'M12A', 'M13A', 'M14A'] },
//       { group: 'Robot', items: ['MRB1', 'MRB2', 'MRB3', 'RC T4', 'TC T4'] },
//       { group: 'T5', items: ['M10B', 'M11B', 'M12B', 'M13B', 'M14B', 'RC T5', 'TC T5'] },
//       { group: 'Mẫu', items: ['M3A-3B'] },
//       { group: 'Canh hàng', items: ['M1A'] },
//       { group: 'Chụp khuôn', items: [''] },
//       { group: 'Kcs', items: [''] },
//       { group: 'Sửa hàng', items: [''] },
//       { group: 'Pha màu', items: [''] },
//       { group: 'Tổng cộng', items: [''] },
//     ];
//     const rows = dataExcel.flatMap((d) =>
//       d.items.map((item, idx) => {
//         const key = `${d.group}-${item}`;
//         const data = report[key];
//         const values = data?.map((e) => (e === 0 ? '-' : round1(e).toFixed(1))) || [];
//         return [idx === 0 ? (d.group === 'Bổ sung' ? 'T1' : d.group) : '', item, ...values];
//       }),
//     );

//     const title = [
//       `BẢNG THEO DÕI RÁC THẢI CHI TIẾT NGÀY ${
//         filterType === 'one'
//           ? formatDateToVNString1(dateOne)
//           : `${formatDateToVNString1(startDate)} - ${formatDateToVNString1(endDate)}`
//       }`,
//     ];
//     const wsData = [title, headerRow1, headerRow2, ...rows];
//     const ws = XLSX.utils.aoa_to_sheet(wsData);

//     ws['!merges'] = [
//       { s: { r: 1, c: 0 }, e: { r: 2, c: 0 } },
//       { s: { r: 1, c: 1 }, e: { r: 2, c: 1 } },
//       { s: { r: 1, c: 2 }, e: { r: 1, c: 8 } },
//       { s: { r: 1, c: 9 }, e: { r: 1, c: 15 } },
//       { s: { r: 1, c: 16 }, e: { r: 1, c: 22 } },
//       { s: { r: 1, c: 23 }, e: { r: 1, c: 29 } },
//       { s: { r: 1, c: 30 }, e: { r: 1, c: 36 } },
//       { s: { r: 1, c: 37 }, e: { r: 1, c: 43 } },
//       { s: { r: 1, c: 44 }, e: { r: 1, c: 50 } },
//       { s: { r: 1, c: 51 }, e: { r: 1, c: 57 } },
//       { s: { r: 1, c: 58 }, e: { r: 2, c: 58 } },

//       { s: { r: 3, c: 0 }, e: { r: 5, c: 0 } },
//       { s: { r: 7, c: 0 }, e: { r: 16, c: 0 } },
//       { s: { r: 17, c: 0 }, e: { r: 22, c: 0 } },
//       { s: { r: 23, c: 0 }, e: { r: 27, c: 0 } },
//       { s: { r: 28, c: 0 }, e: { r: 32, c: 0 } },
//       { s: { r: 33, c: 0 }, e: { r: 39, c: 0 } },

//       { s: { r: 46, c: 0 }, e: { r: 46, c: 1 } },
//       { s: { r: 46, c: 2 }, e: { r: 46, c: 8 } },
//       { s: { r: 46, c: 9 }, e: { r: 46, c: 15 } },
//       { s: { r: 46, c: 16 }, e: { r: 46, c: 22 } },
//       { s: { r: 46, c: 23 }, e: { r: 46, c: 29 } },
//       { s: { r: 46, c: 30 }, e: { r: 46, c: 36 } },
//       { s: { r: 46, c: 37 }, e: { r: 46, c: 43 } },
//       { s: { r: 46, c: 44 }, e: { r: 46, c: 50 } },
//       { s: { r: 46, c: 51 }, e: { r: 46, c: 57 } },
//     ];
//     ws['!merges'].unshift({ s: { r: 0, c: 0 }, e: { r: 0, c: 58 } });

//     const titleCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
//     ws[titleCell].s = {
//       alignment: { horizontal: 'center', vertical: 'center' },
//       font: { bold: true, sz: 16, color: { rgb: '000000' } },
//     };

//     const range = XLSX.utils.decode_range(ws['!ref']);
//     for (let R = range.s.r; R <= range.e.r; ++R) {
//       for (let C = range.s.c; C <= range.e.c; ++C) {
//         const addr = XLSX.utils.encode_cell({ r: R, c: C });
//         if (!ws[addr]) continue;
//         ws[addr].s = {
//           border: {
//             top: { style: 'thin', color: { rgb: '000000' } },
//             bottom: { style: 'thin', color: { rgb: '000000' } },
//             left: { style: 'thin', color: { rgb: '000000' } },
//             right: { style: 'thin', color: { rgb: '000000' } },
//           },
//           alignment: { vertical: 'center', horizontal: 'center', wrapText: true },
//         };
//       }
//     }
//     for (let col = 0; col <= 58; col++) {
//       const addr = XLSX.utils.encode_cell({ r: 1, c: col });
//       if (!ws[addr]) continue;
//       ws[addr].s = {
//         ...ws[addr].s,
//         fill: { fgColor: { rgb: 'e5e7eb' } },
//         font: { bold: true, color: { rgb: '000000' } },
//       };
//     }
//     const lastRowIndex = wsData.length - 1;
//     for (let col = 0; col <= 58; col++) {
//       const addr = XLSX.utils.encode_cell({ r: lastRowIndex, c: col });
//       if (!ws[addr]) continue;
//       ws[addr].s = {
//         ...ws[addr].s,
//         fill: { fgColor: { rgb: 'FFF3CD' } },
//         font: { bold: true, color: { rgb: '000000' } },
//       };
//     }
//     [5, 16, 32, 39, 53].forEach((row) => {
//       for (let col = 0; col <= 58; col++) {
//         const addr = XLSX.utils.encode_cell({ r: row, c: col });
//         if (!ws[addr]) continue;
//         ws[addr].s = {
//           ...ws[addr].s,
//           fill: { fgColor: { rgb: 'cfb8b8' } },
//           font: { bold: true, color: { rgb: '000000' } },
//         };
//       }
//     });

//     XLSX.utils.book_append_sheet(
//       wb,
//       ws,
//       `${
//         filterType === 'one'
//           ? formatDateToVNString2(dateOne)
//           : `${formatDateToVNString2(startDate)} - ${formatDateToVNString2(endDate)}`
//       }`,
//     );
//     const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
//     saveAs(
//       new Blob([wbout], { type: 'application/octet-stream' }),
//       `BẢNG THEO DÕI RÁC THẢI CHI TIẾT NGÀY ${
//         filterType === 'one'
//           ? formatDateToVNString1(dateOne)
//           : `${formatDateToVNString1(startDate)} - ${formatDateToVNString1(endDate)}`
//       }.xlsx`,
//     );
//   };

//   const exportToExcel2 = () => {
//     const wb = XLSX.utils.book_new();
//     const headerRow1 = [
//       'BP/Tổ',
//       'Giẻ lau dính mực thường',
//       'Giẻ lau dính mực lapa',
//       'Băng keo',
//       'Keo bàn thải',
//       'Mực in thải',
//       'Mực in lapa thải',
//       'Vụn logo',
//       'Lụa căng khung',
//       'Tổng',
//     ];
//     const dataExcel = [
//       { group: 'Tổ 1', items: [''] },
//       { group: 'Tổ 2', items: [''] },
//       { group: 'Tổ 3', items: [''] },
//       { group: 'Tổ 4', items: [''] },
//       { group: 'Tổ 5', items: [''] },
//       { group: 'Mẫu', items: [''] },
//       { group: 'Canh hàng', items: [''] },
//       { group: 'Chụp khuôn', items: [''] },
//       { group: 'Kcs', items: [''] },
//       { group: 'Sửa hàng', items: [''] },
//       { group: 'Pha màu', items: [''] },
//       { group: 'Tổng cộng', items: [''] },
//     ];
//     const rows = dataExcel.map((d, idx) => {
//       const key =
//         idx === 0
//           ? 'Bổ sung-TC TBS'
//           : idx === 1
//           ? 'T2-'
//           : idx === 2
//           ? 'T3-TC T3'
//           : idx === 3
//           ? 'Robot-TC T4'
//           : idx === 4
//           ? 'T5-TC T5'
//           : idx === 5
//           ? 'Mẫu-M3A-3B'
//           : idx === 6
//           ? 'Canh hàng-M1A'
//           : d.group + '-';
//       const data = report[key];
//       const values = data?.map((e) => (e === 0 ? '-' : round1(e).toFixed(1)));
//       return [d.group, values?.[0], values?.[7], values?.[14], values?.[21], values?.[28], values?.[35], values?.[42], values?.[49], values?.[56]];
//     });

//     const title = [
//       `BẢNG THEO DÕI RÁC THẢI CHI TIẾT NGÀY ${
//         filterType === 'one'
//           ? formatDateToVNString1(dateOne)
//           : `${formatDateToVNString1(startDate)} - ${formatDateToVNString1(endDate)}`
//       }`,
//     ];
//     const wsData = [title, headerRow1, ...rows];
//     const ws = XLSX.utils.aoa_to_sheet(wsData);
//     ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }];

//     const titleCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
//     ws[titleCell].s = {
//       alignment: { horizontal: 'center', vertical: 'center' },
//       font: { bold: true, sz: 16, color: { rgb: '000000' } },
//     };

//     const range = XLSX.utils.decode_range(ws['!ref']);
//     for (let R = range.s.r; R <= range.e.r; ++R) {
//       for (let C = range.s.c; C <= range.e.c; ++C) {
//         const addr = XLSX.utils.encode_cell({ r: R, c: C });
//         if (!ws[addr]) continue;
//         ws[addr].s = {
//           border: {
//             top: { style: 'thin', color: { rgb: '000000' } },
//             bottom: { style: 'thin', color: { rgb: '000000' } },
//             left: { style: 'thin', color: { rgb: '000000' } },
//             right: { style: 'thin', color: { rgb: '000000' } },
//           },
//           alignment: { vertical: 'center', horizontal: 'center', wrapText: true },
//         };
//       }
//     }
//     for (let col = 0; col <= 35; col++) {
//       const addr = XLSX.utils.encode_cell({ r: 1, c: col });
//       if (!ws[addr]) continue;
//       ws[addr].s = {
//         ...ws[addr].s,
//         fill: { fgColor: { rgb: 'e5e7eb' } },
//         font: { bold: true, color: { rgb: '000000' } },
//       };
//     }
//     const lastRowIndex = wsData.length - 1;
//     for (let col = 0; col <= 35; col++) {
//       const addr = XLSX.utils.encode_cell({ r: lastRowIndex, c: col });
//       if (!ws[addr]) continue;
//       ws[addr].s = {
//         ...ws[addr].s,
//         fill: { fgColor: { rgb: 'FFF3CD' } },
//         font: { bold: true, color: { rgb: '000000' } },
//       };
//     }

//     XLSX.utils.book_append_sheet(
//       wb,
//       ws,
//       `${
//         filterType === 'one'
//           ? formatDateToVNString2(dateOne)
//           : `${formatDateToVNString2(startDate)} - ${formatDateToVNString2(endDate)}`
//       }`,
//     );
//     const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
//     saveAs(
//       new Blob([wbout], { type: 'application/octet-stream' }),
//       `BẢNG THEO DÕI RÁC THẢI CHI TIẾT NGÀY ${
//         filterType === 'one'
//           ? formatDateToVNString1(dateOne)
//           : `${formatDateToVNString1(startDate)} - ${formatDateToVNString1(endDate)}`
//       }.xlsx`,
//     );
//   };
//   // --- END EXCEL FUNCS ---

//   // ======================= UI structures (đổi tên tránh trùng state) =======================
//   const structureOne = [
//     { group: 'Bổ sung', items: ['M1B', 'M2A-2B', 'TC TBS'] },
//     { group: 'T2', items: [''] },
//     { group: 'T3', items: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'RC T3', 'TC T3'] },
//     { group: 'T4A', items: ['M4A-4B', 'M5A-5B', 'M6A-6B', 'M7A-7B', 'M8A-8B', 'M9A-9B'] },
//     { group: 'T4B', items: ['M10A', 'M11A', 'M12A', 'M13A', 'M14A'] },
//     { group: 'Robot', items: ['MRB1', 'MRB2', 'MRB3', 'RC T4', 'TC T4'] },
//     { group: 'T5', items: ['M10B', 'M11B', 'M12B', 'M13B', 'M14B', 'RC T5', 'TC T5'] },
//     { group: 'Mẫu', items: ['M3A-3B'] },
//     { group: 'Canh hàng', items: ['M1A'] },
//     { group: 'Chụp khuôn', items: [''] },
//     { group: 'Kcs', items: [''] },
//     { group: 'Sửa hàng', items: [''] },
//     { group: 'Pha màu', items: [''] },
//   ];

//   const structureRange = [
//     { group: 'Tổ 1', items: [''] },
//     { group: 'Tổ 2', items: [''] },
//     { group: 'Tổ 3', items: [''] },
//     { group: 'Tổ 4', items: [''] },
//     { group: 'Tổ 5', items: [''] },
//     { group: 'Mẫu', items: [''] },
//     { group: 'Canh hàng', items: [''] },
//     { group: 'Chụp khuôn', items: [''] },
//     { group: 'Kcs', items: [''] },
//     { group: 'Sửa hàng', items: [''] },
//     { group: 'Pha màu', items: [''] },
//   ];

//   const isSummaryRow = (group, item) => item?.includes('TC ') || group === 'Tổng cộng';

//   // ======================= Save inline =======================
//   const handleSave = async () => {
//     if (!value || isNaN(parseFloat(value))) return;
//     setLoading(true);
//     const { trashBinCode, workShift } = await HandleGetCodeQr(selectInput);
//     const nowUTC7 = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
//     const payload = {
//       trashBinCode,
//       userID: user.userID,
//       weighingTime: nowUTC7.toISOString(),
//       weightKg: parseFloat(value),
//       updatedAt: nowUTC7.toISOString(),
//       updatedBy: user.userID,
//       workShift,
//       workDate: new Date(dateOne).toISOString().split('T')[0],
//       userName: user?.fullName,
//     };
//     try {
//       const res = await http.post("/trash-weighings", payload);

//       if (res.ok) await fetchTodayReport();
//     } finally {
//       setLoading(false);
//       setStatusUpdate(false);
//       setSelectInput({ group: '', item: '', index: '' });
//       setValue(0);
//     }
//   };

  
//   function round1(num) {
//   return Math.round(num * 10) / 10;
// }

//   // ======================= Render =======================
//   return (
//     <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-2 md:p-4">
//       <div className="space-y-4 md:space-y-6">
//         <SectionTitle>📊 Báo cáo cân rác chi tiết</SectionTitle>

//         <Card className="p-4 md:p-5">
//           {/* Top toolbar */}
//           <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
//             <div className="flex items-center gap-2">
//               {
//                 EXPORT_EXCEL_REPORT &&
//                 <button
//                   onClick={filterType === 'one' ? exportToExcel : exportToExcel2}
//                   className="px-4 py-2 text-sm rounded-lg text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[.98] shadow-sm"
//                 >
//                   📤 Xuất Excel
//                 </button>
//               }

//               <div className="inline-flex overflow-hidden rounded-lg border border-slate-300">
//                 <label className={cx('px-3 py-2 text-sm cursor-pointer', filterType === 'one' && 'bg-slate-100 font-medium')}>
//                   <input
//                     type="radio"
//                     value="one"
//                     checked={filterType === 'one'}
//                     onChange={() => setFilterType('one')}
//                     className="mr-2 accent-emerald-600"
//                   />
//                   1 ngày
//                 </label>
//                 <label className={cx('px-3 py-2 text-sm cursor-pointer', filterType === 'range' && 'bg-slate-100 font-medium')}>
//                   <input
//                     type="radio"
//                     value="range"
//                     checked={filterType === 'range'}
//                     onChange={() => setFilterType('range')}
//                     className="mr-2 accent-emerald-600"
//                   />
//                   Nhiều ngày
//                 </label>
//               </div>
//             </div>

//             <div className="flex flex-wrap items-end gap-3">
//               {filterType === 'one' ? (
//                 <div>
//                   <label className="block text-xs text-slate-500 mb-1">Chọn ngày</label>
//                   <DatePicker
//                     selected={dateOne}
//                     onChange={(d) => setDateOne(d)}
//                     dateFormat="dd/MM/yyyy"
//                     className="w-[140px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
//                     locale={vi}
//                     popperPlacement="bottom-start"
//                     popperClassName="!z-[9999]"     // Tailwind z-index
//                     portalId="react-datepicker-portal" // Render ra portal → không bị cut
//                   />
//                 </div>
//               ) : (
//                 <>
//                   <div>
//                     <label className="block text-xs text-slate-500 mb-1">Từ ngày</label>
//                     <DatePicker
//                       selected={startDate}
//                       onChange={(d) => setStartDate(d)}
//                       selectsStart
//                       startDate={startDate}
//                       endDate={endDate}
//                       dateFormat="dd/MM/yyyy"
//                       className="w-[140px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
//                       locale={vi}
//                     popperPlacement="bottom-start"
//                     popperClassName="!z-[9999]"     // Tailwind z-index
//                     portalId="react-datepicker-portal" // Render ra portal → không bị cut
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-xs text-slate-500 mb-1">Đến ngày</label>
//                     <DatePicker
//                       selected={endDate}
//                       onChange={(d) => setEndDate(d)}
//                       selectsEnd
//                       startDate={startDate}
//                       endDate={endDate}
//                       minDate={startDate}
//                       dateFormat="dd/MM/yyyy"
//                       className="w-[140px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
//                       locale={vi}
//                     popperPlacement="bottom-start"
//                     popperClassName="!z-[9999]"     // Tailwind z-index
//                     portalId="react-datepicker-portal" // Render ra portal → không bị cut
//                     />
//                   </div>
//                 </>
//               )}
//             </div>
//           </div>

//           {/* Hàng tổng nhanh */}
//           <div className="mt-4 flex flex-wrap items-center gap-3">
//             <SummaryPill
//               label="Khoảng thời gian"
//               value={
//                 filterType === 'one'
//                   ? formatDateToVNString1(dateOne)
//                   : `${formatDateToVNString1(startDate)} – ${formatDateToVNString1(endDate)}`
//               }
//             />
//             <div className="text-xs text-slate-500">Nhấp đúp ô để chỉnh sửa nhanh (nếu được phân quyền)</div>
//           </div>
//         </Card>

//         {/* Table */}
//         <Card className="overflow-hidden">
//           <div className="overflow-auto">
//             <table className="min-w-full text-sm text-slate-700">
//               <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-sm border-b border-slate-200">
//                 <tr>
//                   {(filterType === 'one'
//                     ? [
//                         'BP/Tổ',
//                         'Chuyền',
//                         'Giẻ lau dính mực thường',
//                         'Giẻ lau dính mực lapa',
//                         'Băng keo',
//                         'Keo bàn thải',
//                         'Mực in thải',
//                         'Mực in lapa thải',
//                         'Vụn logo',
//                         'Lụa căng khung',
//                         'Tổng',
//                       ]
//                     : [
//                         'BP/Tổ',
//                         'Giẻ lau dính mực thường',
//                         'Giẻ lau dính mực lapa',
//                         'Băng keo',
//                         'Keo bàn thải',
//                         'Mực in thải',
//                         'Mực in lapa thải',
//                         'Vụn logo',
//                         'Lụa căng khung',
//                         'Tổng',
//                       ]
//                   ).map((header, idx) => (
//                     <th
//                       key={idx}
//                       rowSpan={filterType === 'one' && (idx === 0 || idx === 1 || idx === 10) ? 2 : 1}
//                       colSpan={filterType === 'one' && idx >= 2 && idx <= 9 ? 7 : 1}
//                       className="px-2 py-2 text-center font-semibold text-slate-700"
//                     >
//                       {header}
//                     </th>
//                   ))}
//                 </tr>

//                 {filterType === 'one' && (
//                   <tr className="border-t border-slate-200">
//                     {Array.from({ length: 8 })
//                       .fill(['C1', 'C2', 'C3', 'D1', 'D2', 'HC', 'KoC'])
//                       .flat()
//                       .map((s, i) => (
//                         <th key={i} className="px-2 py-2 text-center text-slate-600">
//                           {s}
//                         </th>
//                       ))}
//                   </tr>
//                 )}
//               </thead>

//               <tbody className="divide-y divide-slate-100">
//                 {filterType === 'one'
//                   ? structureOne.map((group, idx) =>
//                       group.items.map((item, iidx) => {
//                         const rowKey = `${group.group}-${item}`;
//                         const values = report[rowKey] || [];
//                         const highlight = isSummaryRow(group.group, item);

//                         return (
//                           <tr
//                             key={`${idx}-${iidx}`}
//                             className={cx(
//                               'transition',
//                               highlight
//                                 ? 'bg-amber-50'
//                                 : 'hover:bg-slate-50 odd:bg-white even:bg-slate-50/60',
//                             )}
//                           >
//                             {iidx === 0 && (
//                               <td
//                                 rowSpan={
//                                   idx === 2 ? 10 : idx === 3 ? 6 : idx === 4 ? 5 : idx === 5 ? 5 : idx === 6 ? 7 : idx === 0 ? 3 : 1
//                                 }
//                                 className="px-2 py-2 text-center font-medium text-slate-800 border-r border-slate-100"
//                               >
//                                 {group.group === 'Bổ sung' ? 'T1' : group.group}
//                               </td>
//                             )}

//                             <td className="px-2 py-2 text-center">{item || '-'}</td>

//                             {values.map((e, i) => (
//                               <td
//                                 key={i}
//                                 className={cx(
//                                   'px-2 py-1 text-center',
//                                   i === 63 ? 'font-semibold text-slate-900' : 'text-slate-700',
//                                 )}
//                                 onDoubleClick={() => {
//                                   if (!ADD_DATA_REPORT || filterType !== 'one') return;

//                                   setStatusUpdate(true);
//                                   setSelectInput({ group: group.group, item, index: i });
//                                   setValue(e);
//                                   setTimeout(() => inputRef.current?.focus(), 0);
//                                 }}
//                               >
//                                 {ADD_DATA_REPORT &&
//                                 statusUpdate &&
//                                 filterType === 'one' &&
//                                 selectInput.group === group.group &&
//                                 selectInput.item === item &&
//                                 selectInput.index === i ? (
//                                   <div className="flex items-center justify-center gap-2">
//                                     <input
//                                       ref={inputRef}
//                                       className="w-20 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
//                                       type="text"
//                                       value={value}
//                                       onChange={(e) => setValue(e.target.value)}
//                                     />
//                                     <button
//                                       className="text-emerald-600 hover:text-emerald-700"
//                                       onClick={handleSave}
//                                       title="Lưu"
//                                     >
//                                       <FaCheck className="h-4 w-4" />
//                                     </button>
//                                     <button
//                                       className="text-rose-600 hover:text-rose-700"
//                                       onClick={() => {
//                                         setStatusUpdate(false);
//                                         setSelectInput({ group: '', item: '', index: '' });
//                                         setValue(0);
//                                       }}
//                                       title="Hủy"
//                                     >
//                                       <FaTimes className="h-4 w-4" />
//                                     </button>
//                                   </div>
//                                 ) : (
//                                   <span>{e === 0 ? '-' : parseFloat(round1(e)?.toFixed(1))}</span>
//                                 )}
//                               </td>
//                             ))}
//                           </tr>
//                         );
//                       }),
//                     )
//                   : structureRange.map((group, idx) => {
//                       const key =
//                         idx === 0
//                           ? 'Bổ sung-TC TBS'
//                           : idx === 1
//                           ? 'T2-'
//                           : idx === 2
//                           ? 'T3-TC T3'
//                           : idx === 3
//                           ? 'Robot-TC T4'
//                           : idx === 4
//                           ? 'T5-TC T5'
//                           : idx === 5
//                           ? 'Mẫu-M3A-3B'
//                           : idx === 6
//                           ? 'Canh hàng-M1A'
//                           : group.group + '-';
//                       const arr = report[key] || [];

//                       return (
//                         <tr key={idx} className="hover:bg-slate-50 odd:bg-white even:bg-slate-50/60 transition">
//                           <td className="px-2 py-2 text-center font-medium text-slate-800 border-r border-slate-100">
//                             {group.group}
//                           </td>
//                           {arr
//                             .map((e, i) => (i % 7 === 0 ? e : null))
//                             .filter((x) => x !== null)
//                             .map((val, i) => (
//                               <td key={i} className={cx('px-2 py-2 text-center', 'font-semibold')}>
//                                 {val === 0 ? '-' : parseFloat(round1(val)?.toFixed(1))}
//                               </td>
//                             ))}
//                         </tr>
//                       );
//                     })}

//                 {/* Tổng cộng */}
//                 <tr className="bg-emerald-50 border-t border-emerald-200">
//                   <td className="px-2 py-2 text-center font-bold text-emerald-800" colSpan={filterType === 'one' ? 2 : 1}>
//                     Tổng cộng
//                   </td>
//                   {report['Tổng cộng-']?.map(
//                     (e, i) =>
//                       i % 7 === 0 && (
//                         <td
//                           key={i}
//                           colSpan={filterType === 'one' ? 7 : 1}
//                           className="px-2 py-2 text-center font-bold text-emerald-900"
//                         >
//                           {e === 0 ? '-' : parseFloat(round1(e)?.toFixed(1))}
//                         </td>
//                       ),
//                   )}
//                 </tr>
//               </tbody>
//             </table>
//           </div>
//         </Card>
//       </div>

//       {/* Global loading */}
//       {loading && (
//         <div className="fixed inset-0 z-50 grid place-items-center bg-white/60 backdrop-blur-sm">
//           <div className="flex flex-col items-center gap-3">
//             <FaSpinner className="animate-spin text-emerald-600 text-4xl" />
//             <span className="text-slate-700 text-sm">Đang tải dữ liệu...</span>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Report;



import 'react-datepicker/dist/react-datepicker.css';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import DatePicker from 'react-datepicker';
import { vi } from 'date-fns/locale';
import { BASE_URL } from '~/config';
import { FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';
import http from '~/api/http';
import MODULEID from '~/contants/modules';
import { useFeatureAllowed } from '~/hooks/useFeatureGuard';
import HandleGetCodeQr from '~/components/HandleGetCodeQR';
import { useSelector } from 'react-redux';
import { userSelector } from '~/redux/selectors';

/* ======================= UI helpers ======================= */
const cx = (...classes) => classes.filter(Boolean).join(' ');
const Card = ({ className = '', children }) => (
  <div className={cx('bg-white/80 backdrop-blur rounded-2xl border border-slate-200 shadow-sm', className)}>{children}</div>
);
const SectionTitle = ({ children }) => (
  <div className="rounded-2xl border border-emerald-200/40 bg-gradient-to-r from-emerald-50 to-cyan-50 p-4 md:p-5 shadow-sm">
    <h2 className="text-lg md:text-xl font-bold text-slate-800">{children}</h2>
  </div>
);
const SummaryPill = ({ label, value }) => (
  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm">
    <span className="text-slate-500">{label}</span>
    <span className="font-semibold text-slate-800">{value}</span>
  </div>
);

/* ======================= Constants ======================= */
// 8 nhóm chất thải × 7 ca = 56 cột, + 2 cột đầu (BP/Tổ, Chuyền) + 1 cột Tổng = 59 cột
const TRASH_CATEGORIES = [
  'Giẻ lau dính mực thường',
  'Giẻ lau dính mực lapa',
  'Băng keo',
  'Keo bàn thải',
  'Mực in thải',
  'Mực in lapa thải',
  'Vụn logo',
  'Lụa căng khung',
];
const SHIFTS = ['C1', 'C2', 'C3', 'D1', 'D2', 'HC', 'KoC'];

const URL_STATS = `${BASE_URL}/api/statistics/weight-by-bucket`; // cùng contract với trang theo ca làm

/* ======================= Helpers ======================= */
const round1 = (n) => Math.round(n * 10) / 10;
const fmt1 = (x) => (x === 0 ? '-' : (Math.round(x * 10) / 10).toFixed(1));

function toVNDateISO(d) {
  const vnOffset = 7 * 60;
  const local = new Date(d.getTime() + vnOffset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}
function vnDateParts(date) {
    const vnOffset = 7 * 60;
    const utc = date.getTime() + date.getTimezoneOffset() * 60000;
    const vnTime = new Date(utc + vnOffset * 60000);
    const dd = String(vnTime.getDate()).padStart(2, '0');
    const mm = String(vnTime.getMonth() + 1).padStart(2, '0');
    const yy = vnTime.getFullYear();
  return { dmy: `${dd}/${mm}/${yy}`, dmyDash: `${dd}-${mm}-${yy}`, iso: `${yy}-${mm}-${dd}` };
}

// n=64 (8 loại × 7 ca = 56) + (các ô khác + tổng); mình chỉ quan tâm 7-bước để gom cho chế độ nhiều ngày
function groupEach7TakeFirst(arr = []) {
  // Trả về mảng đã "lấy đầu nhóm 7" (ô tổng theo ca của từng loại)
  const out = [];
  for (let i = 0; i < arr.length; i += 7) out.push(arr[i] ?? 0);
  return out;
}

// Tổng hai mảng cùng độ dài (phòng null/undefined)
function sumArrays(...arrays) {
  if (!arrays.length) return [];
  const len = arrays[0]?.length || 0;
  const out = Array(len).fill(0);
  for (let i = 0; i < len; i++) {
    let s = 0;
    for (const a of arrays) s += a?.[i] || 0;
    out[i] = Math.round(s * 100) / 100;
  }
  return out;
}

/* ======================= Component ======================= */
export default function ReportTotalDynamic() {
  const EXPORT_EXCEL_REPORT = useFeatureAllowed(MODULEID.CANRAC, 'cr_xuatexceltrangbaocao');
  const ADD_DATA_REPORT = useFeatureAllowed(MODULEID.CANRAC, 'cr_themdulieuobangbaocao');

  const tmp = useSelector(userSelector);
  const [user, setUser] = useState({});
  useEffect(() => setUser(tmp?.login?.currentUser), [tmp]);

  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('one'); // 'one' | 'range'
  const [dateOne, setDateOne] = useState(new Date());
  const [startDate, setStartDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 1); return d; });
  const [endDate, setEndDate] = useState(new Date());

  // dữ liệu động từ API: [{bucketID,bucketName, units:[{unitID,unitName,value:number[64]}], orphan?, sum:number[64]}]
  const [raw, setRaw] = useState([]);
  const [grand, setGrand] = useState(Array(64).fill(0));

  // inline edit
  const [statusUpdate, setStatusUpdate] = useState(false);
  const [selectInput, setSelectInput] = useState({ group: '', item: '', index: '' });
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  /* ===== Fetch with debounce & abort ===== */
  useEffect(() => {
    setLoading(true);
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        const params = {
          startDate: filterType === 'one' ? toVNDateISO(dateOne) : toVNDateISO(startDate),
          endDate:   filterType === 'one' ? toVNDateISO(dateOne) : toVNDateISO(endDate),
        };
        const res = await http.get(URL_STATS, { params, signal: controller.signal });
        if (res.data?.status === 'success') {
          setRaw(res.data.data || []);
          setGrand(res.data.grandTotal || Array(64).fill(0));
        } else {
          setRaw([]); setGrand(Array(64).fill(0));
        }
      } catch (e) {
        if (e.name !== 'CanceledError' && e.message !== 'canceled') console.error('fetch error', e);
        setRaw([]); setGrand(Array(64).fill(0));
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => { controller.abort(); clearTimeout(t); };
  }, [filterType, dateOne, startDate, endDate]);

  /* ===== Chuẩn hóa dữ liệu để render nhanh ===== */
  // rowsOneDay: render chi tiết (BP/Tổ, Chuyền, 8 loại × 7 ca + Tổng)
  const rowsOneDay = useMemo(() => {
    // Mỗi bucket → nhiều rows: từng chuyền + (QR cấp bộ phận nếu có) + 1 dòng Tổng bucket
    const rows = [];
    for (const b of raw || []) {
      const list = [
        ...(b.units || []).map(u => ({ bucketID: b.bucketID, bucketName: b.bucketName, type: 'unit', unitName: u.unitName, raw: u.value })),
        ...(b.orphan ? [{ bucketID: b.bucketID, bucketName: b.bucketName, type: 'orphan', unitName: '(QR cấp bộ phận)', raw: b.orphan.value }] : []),
        { bucketID: b.bucketID, bucketName: b.bucketName, type: 'sum', unitName: 'Tổng', raw: b.sum },
      ];
      // Gộp vào rows với thông tin rowSpan (để merge cột BP/Tổ)
      rows.push({ bucketName: b.bucketName, span: list.length, rows: list });
    }
    return rows;
  }, [raw]);

  // rowsRange: render nhiều ngày → gọn theo loại rác: mỗi bucket 1 dòng, lấy ô đầu mỗi nhóm 7 (C1..KoC → lấy ô tổng đầu nhóm)
  const rowsRange = useMemo(() => {
    return (raw || []).map(b => {
      const collapsed = groupEach7TakeFirst(b.sum || []);
      return { bucketID: b.bucketID, bucketName: b.bucketName, vals: collapsed };
    });
  }, [raw]);

  const grandRange = useMemo(() => groupEach7TakeFirst(grand), [grand]);

  /* ===== Inline save (giữ nguyên logic cũ, chỉ thay group/item theo động) ===== */
  const handleSave = async () => {
    if (!value || isNaN(parseFloat(value))) return;
    setLoading(true);
    try {
      const { trashBinCode, workShift } = await HandleGetCodeQr(selectInput);
      const nowUTC7 = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
      const payload = {
        trashBinCode,
        userID: user?.userID,
        weighingTime: nowUTC7.toISOString(),
        weightKg: parseFloat(value),
        updatedAt: nowUTC7.toISOString(),
        updatedBy: user?.userID,
        workShift,
        workDate: new Date(dateOne).toISOString().split('T')[0],
        userName: user?.fullName,
      };
      const res = await http.post('/trash-weighings', payload);
      if (res?.ok || res?.data?.status === 'success') {
        // refresh
        const params = { startDate: toVNDateISO(dateOne), endDate: toVNDateISO(dateOne) };
        const fresh = await http.get(URL_STATS, { params });
        if (fresh.data?.status === 'success') {
          setRaw(fresh.data.data || []);
          setGrand(fresh.data.grandTotal || Array(64).fill(0));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setStatusUpdate(false);
      setSelectInput({ group: '', item: '', index: '' });
      setValue('');
    }
  };

  /* ===== Export Excel (2 kiểu) ===== */
  const exportOneDayExcel = async () => {
    const XLSX = await import('xlsx-js-style');
    // BẮT CHẮC saveAs tồn tại ở mọi bundler
  const fsaver = await import('file-saver');
  const saveAs = fsaver?.default ?? fsaver?.saveAs;
  if (typeof saveAs !== 'function') {
    throw new Error('file-saver: saveAs not available');
  }

    // Header hàng 1 (category merge)
    const headerRow1 = ['BP/Tổ', 'Chuyền', ...TRASH_CATEGORIES.flatMap(c => [c, '', '', '', '', '', '']), 'Tổng'];
    // Header hàng 2 (C1..KoC)
    const headerRow2 = ['', '', ...TRASH_CATEGORIES.flatMap(() => SHIFTS), ''];

    const rows = [];
    for (const group of rowsOneDay) {
      group.rows.forEach((r, i) => {
        const vs = (r.raw || []).map(e => (e === 0 ? '-' : round1(e).toFixed(1)));
        rows.push([i === 0 ? group.bucketName === 'Không Tổ' ? '' : group.bucketName : '', r.unitName, ...vs]);
      });
    }

    const title = [`BẢNG THEO DÕI RÁC THẢI CHI TIẾT NGÀY ${vnDateParts(dateOne).dmy}`];
    const wsData = [title, headerRow1, headerRow2, ...rows];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Merges
    const merges = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 58 } }, // title
      // cố định 2 ô đầu
      { s: { r: 1, c: 0 }, e: { r: 2, c: 0 } },
      { s: { r: 1, c: 1 }, e: { r: 2, c: 1 } },
    ];
    // merge mỗi category 7 cột
    let base = 2;
    for (let k = 0; k < TRASH_CATEGORIES.length; k++) {
      merges.push({ s: { r: 1, c: base }, e: { r: 1, c: base + 6 } });
      base += 7;
    }
    // Tổng ở hàng 2 (đứng 1 cột)
    merges.push({ s: { r: 1, c: base }, e: { r: 2, c: base } });
    ws['!merges'] = merges;

    // Style
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[addr]) continue;
        ws[addr].s = {
          border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } },
          alignment: { vertical: 'center', horizontal: 'center', wrapText: true },
        };
      }
    }
    const titleCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
    ws[titleCell].s = { ...ws[titleCell].s, font: { bold: true, sz: 16 } };
    for (let c = 0; c <= 58; c++) {
      const h1 = XLSX.utils.encode_cell({ r: 1, c });
      if (ws[h1]) ws[h1].s = { ...ws[h1].s, font: { bold: true }, fill: { fgColor: { rgb: 'E5E7EB' } } };
    }

    XLSX.utils.book_append_sheet(wb, ws, vnDateParts(dateOne).dmyDash);
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `BẢNG THEO DÕI RÁC THẢI CHI TIẾT ${vnDateParts(dateOne).dmy}.xlsx`);
  };

  const exportRangeExcel = async () => {
    const XLSX = await import('xlsx-js-style');
    // BẮT CHẮC saveAs tồn tại ở mọi bundler
  const fsaver = await import('file-saver');
  const saveAs = fsaver?.default ?? fsaver?.saveAs;
  if (typeof saveAs !== 'function') {
    throw new Error('file-saver: saveAs not available');
  }

    const headerRow1 = ['BP/Tổ', ...TRASH_CATEGORIES, 'Tổng'];
    const rows = rowsRange.map(r => {
      // r.vals: lấy đầu mỗi nhóm 7 cho từng loại → 8 giá trị + (sau cùng ta tính Tổng bằng grandRange)
      // Tổng theo từng bucket = sum các loại
      const total = r.vals.reduce((s, x) => s + (x || 0), 0);
      return [r.bucketName === 'Không Tổ' ? '' : r.bucketName, ...r.vals.map(v => (v === 0 ? '-' : round1(v).toFixed(1))), total === 0 ? '-' : round1(total).toFixed(1)];
    });

    // Grand total dòng cuối
    const grandTotal = grandRange.reduce((s, x) => s + (x || 0), 0);
    rows.push(['Tổng cộng', ...grandRange.map(v => (v === 0 ? '-' : round1(v).toFixed(1))), grandTotal === 0 ? '-' : round1(grandTotal).toFixed(1)]);

    const title = [`BẢNG THEO DÕI RÁC THẢI CHI TIẾT ${vnDateParts(startDate).dmy} – ${vnDateParts(endDate).dmy}`];
    const wsData = [title, headerRow1, ...rows];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headerRow1.length - 1 } }];

    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[addr]) continue;
        ws[addr].s = {
          border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } },
          alignment: { vertical: 'center', horizontal: 'center', wrapText: true },
        };
      }
    }
    for (let c = 0; c < headerRow1.length; c++) {
      const h = XLSX.utils.encode_cell({ r: 1, c });
      if (ws[h]) ws[h].s = { ...ws[h].s, font: { bold: true }, fill: { fgColor: { rgb: 'E5E7EB' } } };
    }
    const titleCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
    ws[titleCell].s = { ...ws[titleCell].s, font: { bold: true, sz: 16 } };

    XLSX.utils.book_append_sheet(wb, ws, `${vnDateParts(startDate).dmyDash} - ${vnDateParts(endDate).dmyDash}`);
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `BẢNG THEO DÕI RÁC THẢI CHI TIẾT ${vnDateParts(startDate).dmy} – ${vnDateParts(endDate).dmy}.xlsx`);
  };

  /* ======================= Render ======================= */
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-2 md:p-4">
      <div className="space-y-4 md:space-y-6">
        <SectionTitle>📊 Báo cáo cân rác chi tiết</SectionTitle>

        <Card className="p-4 md:p-5">
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex items-center gap-2">
              {EXPORT_EXCEL_REPORT && (
                <button
                  onClick={filterType === 'one' ? exportOneDayExcel : exportRangeExcel}
                  disabled={loading || !raw?.length}
                  className={cx(
                    'px-4 py-2 text-sm rounded-lg text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[.98] shadow-sm',
                    (loading || !raw?.length) && 'opacity-60 cursor-not-allowed'
                  )}
                >
                  📤 Xuất Excel
                </button>
              )}

              <div className="inline-flex overflow-hidden rounded-lg border border-slate-300">
                <label className={cx('px-3 py-2 text-sm cursor-pointer', filterType === 'one' && 'bg-slate-100 font-medium')}>
                  <input type="radio" value="one" checked={filterType === 'one'} onChange={() => setFilterType('one')} className="mr-2 accent-emerald-600" />
                  1 ngày
                </label>
                <label className={cx('px-3 py-2 text-sm cursor-pointer', filterType === 'range' && 'bg-slate-100 font-medium')}>
                  <input type="radio" value="range" checked={filterType === 'range'} onChange={() => setFilterType('range')} className="mr-2 accent-emerald-600" />
                  Nhiều ngày
                </label>
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              {filterType === 'one' ? (
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Chọn ngày</label>
                  <DatePicker
                    selected={dateOne}
                    onChange={(d) => setDateOne(d)}
                    dateFormat="dd/MM/yyyy"
                    className="w-[140px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    locale={vi}
                    popperPlacement="bottom-start"
                    popperClassName="!z-[9999]"
                    portalId="react-datepicker-portal"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Từ ngày</label>
                    <DatePicker
                      selected={startDate}
                      onChange={(d) => setStartDate(d)}
                      selectsStart
                      startDate={startDate}
                      endDate={endDate}
                      dateFormat="dd/MM/yyyy"
                      className="w-[140px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      locale={vi}
                      popperPlacement="bottom-start"
                      popperClassName="!z-[9999]"
                      portalId="react-datepicker-portal"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Đến ngày</label>
                    <DatePicker
                      selected={endDate}
                      onChange={(d) => setEndDate(d)}
                      selectsEnd
                      startDate={startDate}
                      endDate={endDate}
                      minDate={startDate}
                      dateFormat="dd/MM/yyyy"
                      className="w-[140px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      locale={vi}
                      popperPlacement="bottom-start"
                      popperClassName="!z-[9999]"
                      portalId="react-datepicker-portal"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <SummaryPill
              label="Khoảng thời gian"
              value={filterType === 'one' ? vnDateParts(dateOne).dmy : `${vnDateParts(startDate).dmy} – ${vnDateParts(endDate).dmy}`}
            />
            <div className="text-xs text-slate-500">Nhấp đúp ô để chỉnh sửa nhanh (nếu được phân quyền)</div>
          </div>
        </Card>

        {/* Table */}
        <Card className="overflow-hidden">
          <div className="overflow-auto">
            <table className="min-w-full text-sm text-slate-700">
              <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-sm border-b border-slate-200">
                {filterType === 'one' ? (
                  <>
                    <tr>
                      <th rowSpan={2} className="px-2 py-2 text-center font-semibold text-slate-700">BP/Tổ</th>
                      <th rowSpan={2} className="px-2 py-2 text-center font-semibold text-slate-700">Chuyền</th>
                      {TRASH_CATEGORIES.map((h, i) => (
                        <th key={i} colSpan={7} className="px-2 py-2 text-center font-semibold text-slate-700">{h}</th>
                      ))}
                      <th rowSpan={2} className="px-2 py-2 text-center font-semibold text-slate-700">Tổng</th>
                    </tr>
                    <tr className="border-t border-slate-200">
                      {TRASH_CATEGORIES.flatMap(() => SHIFTS).map((s, i) => (
                        <th key={i} className="px-2 py-2 text-center text-slate-600">{s}</th>
                      ))}
                    </tr>
                  </>
                ) : (
                  <tr>
                    <th className="px-2 py-2 text-center font-semibold text-slate-700">BP/Tổ</th>
                    {TRASH_CATEGORIES.map((h, i) => (
                      <th key={i} className="px-2 py-2 text-center font-semibold text-slate-700">{h}</th>
                    ))}
                    <th className="px-2 py-2 text-center font-semibold text-slate-700">Tổng</th>
                  </tr>
                )}
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filterType === 'one' ? (
                  // One day: chi tiết theo chuyền
                  rowsOneDay.map((group, gIdx) =>
                    group.rows.map((r, idx) => (
                      <tr key={`${gIdx}-${idx}`} className={cx(r.type === 'sum' ? 'bg-amber-50' : 'hover:bg-slate-50 odd:bg-white even:bg-slate-50/60', 'transition')}>
                        {idx === 0 && (
                          <td rowSpan={group.span} className="px-2 py-2 text-center font-medium text-slate-800 border-r border-slate-100">
                            {group.bucketName === 'Không Tổ' ? '' : group.bucketName}
                          </td>
                        )}
                        <td className="px-2 py-2 text-center">{r.unitName}</td>
                        {(r.raw || []).map((e, i) => (
                          <td
                            key={i}
                            className={cx('px-2 py-1 text-center', 'text-slate-700', (i === (TRASH_CATEGORIES.length * SHIFTS.length)) && 'font-semibold text-slate-900')}
                            onDoubleClick={() => {
                              if (!ADD_DATA_REPORT || filterType !== 'one' || r.type === 'sum') return;
                              setStatusUpdate(true);
                              setSelectInput({ group: group.bucketName, item: r.unitName, index: i });
                              setValue(e);
                              setTimeout(() => inputRef.current?.focus(), 0);
                            }}
                          >
                            {fmt1(e || 0)}
                          </td>
                        ))}
                      </tr>
                    ))
                  )
                ) : (
                  // Range: gọn theo loại rác
                  rowsRange.map((r, idx) => {
                    const total = r.vals.reduce((s, x) => s + (x || 0), 0);
                    return (
                      <tr key={idx} className="hover:bg-slate-50 odd:bg-white even:bg-slate-50/60 transition">
                        <td className="px-2 py-2 text-center font-medium text-slate-800 border-r border-slate-100">{r.bucketName === 'Không Tổ' ? '' : r.bucketName}</td>
                        {r.vals.map((v, i) => (
                          <td key={i} className="px-2 py-2 text-center">{fmt1(v || 0)}</td>
                        ))}
                        <td className="px-2 py-2 text-center font-semibold">{fmt1(total)}</td>
                      </tr>
                    );
                  })
                )}

                {/* Grand total */}
                <tr className="bg-emerald-50 border-t border-emerald-200">
                  <td className="px-2 py-2 text-center font-bold text-emerald-800" colSpan={filterType === 'one' ? 2 : 1}>Tổng cộng</td>
                  {(
                    filterType === 'one'
                      ? (grand || [])
                      : [...grandRange, grandRange.reduce((s, x) => s + (x || 0), 0)]
                  ).map((e, i) => (
                    <td key={i} className="px-2 py-2 text-center font-bold text-emerald-900">
                      {fmt1(e || 0)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Inline edit controls (ẩn/hiện khi đang edit) */}
      {statusUpdate && (
        <div className="fixed bottom-4 left-0 right-0 mx-auto w-fit bg-white/90 backdrop-blur rounded-xl shadow-lg border border-slate-200 p-3 flex items-center gap-2">
          <input
            ref={inputRef}
            className="w-28 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            type="number"
            step="0.1"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <button className="text-emerald-700 hover:text-emerald-800" onClick={handleSave} title="Lưu">
            <FaCheck className="h-5 w-5" />
          </button>
          <button
            className="text-rose-600 hover:text-rose-700"
            onClick={() => { setStatusUpdate(false); setSelectInput({ group: '', item: '', index: '' }); setValue(''); }}
            title="Hủy"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Global loading */}
      {loading && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-white/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <FaSpinner className="animate-spin text-emerald-600 text-4xl" />
            <span className="text-slate-700 text-sm">Đang tải dữ liệu...</span>
          </div>
        </div>
      )}
    </div>
  );
}

