import 'react-datepicker/dist/react-datepicker.css';
import React, { useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import { vi } from 'date-fns/locale';
import { BASE_URL } from '~/config/index';
import { FaCheck, FaTimes } from "react-icons/fa";
import HandleGetCodeQr from '~/components/HandleGetCodeQR';
import { useSelector } from 'react-redux';
import { userSelector } from '~/redux/selectors';


const Report = () => {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState([]);

  const [filterType, setFilterType] = useState('one'); // 'one' or 'range'
  const [statusUpdate, setStatusUpdate] = useState(false);
  const [selectInput, setSelectInput] = useState({
    group: '',
    item: '',
  });
  const [value, setValue] = useState('');
  const inputRef = useRef(null);


  const [dateOne, setDateOne] = useState(new Date());
  const [startDate, setStartDate] = useState(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  });
  const [endDate, setEndDate] = useState(new Date());
  
  const tmp = useSelector(userSelector);
  const [user, setUser] = useState({});
  
  useEffect(() => {
    setUser(tmp?.login?.currentUser);
  }, [tmp]);


  const sumArrays = (...arrays) => {
    const length = arrays[0]?.length || 0;
    return Array.from(
      { length },
      (_, i) => Math.round(arrays.reduce((sum, arr) => sum + (arr[i] || 0), 0) * 100) / 100,
    );
  };

  function groupSumWithZeros(arr) {
    const result = [...arr];
    for (let i = 0; i < arr.length - 1; i += 7) {
      const sum =
        (arr[i] || 0) +
        (arr[i + 1] || 0) +
        (arr[i + 2] || 0) +
        (arr[i + 3] || 0) +
        (arr[i + 4] || 0) +
        (arr[i + 5] || 0) +
        (arr[i + 6] || 0);
      result[i] = sum;
      result[i + 1] = 0;
      result[i + 2] = 0;
      result[i + 3] = 0;
      result[i + 4] = 0;
      result[i + 5] = 0;
      result[i + 6] = 0;
    }
    return result;
  }

  function formatDateToVNString(date) {
    const vnOffset = 7 * 60; // phút
    const localTime = new Date(date.getTime() + vnOffset * 60 * 1000);
    return localTime.toISOString().slice(0, 10); // chỉ lấy YYYY-MM-DD
  }

  function formatDateToVNString1(date) {
    const vnOffset = 7 * 60; // phút
    const utc = date.getTime() + date.getTimezoneOffset() * 60000; // chuyển về UTC
    const vnTime = new Date(utc + vnOffset * 60000); // cộng thêm offset của VN

    const day = String(vnTime.getDate()).padStart(2, '0');
    const month = String(vnTime.getMonth() + 1).padStart(2, '0');
    const year = vnTime.getFullYear();

    return `${day}/${month}/${year}`;
  }

  function formatDateToVNString2(date) {
    const vnOffset = 7 * 60; // phút
    const utc = date.getTime() + date.getTimezoneOffset() * 60000; // chuyển về UTC
    const vnTime = new Date(utc + vnOffset * 60000); // cộng thêm offset của VN

    const day = String(vnTime.getDate()).padStart(2, '0');
    const month = String(vnTime.getMonth() + 1).padStart(2, '0');
    const year = vnTime.getFullYear();

    return `${day}-${month}-${year}`;
  }

  function sumFirstSixElements(arr) {
    const sum = arr.slice(0, 56).reduce((total, val) => total + val, 0);
    const newArr = [...arr];
    newArr.splice(56, 0, sum, 0, 0, 0, 0, 0, 0); // Chèn sum vào vị trí thứ 6
    return newArr;
  }

  function trimKeepLast(arr, numToRemove = 8) {
    if (!Array.isArray(arr) || arr.length === 0) return [];

    if (arr.length <= numToRemove) {
      // Nếu mảng quá ngắn, chỉ giữ lại phần tử cuối (nếu có)
      return arr.slice(-1);
    }

    const cutIndex = arr.length - numToRemove - 1;
    return [...arr.slice(0, cutIndex + 1), arr[arr.length - 1]];
  }

  useEffect(() => {
    setLoading(true);

    // Gọi lần lượt từng API
    fetchTodayReport();

    setLoading(false);
  }, [dateOne, startDate, endDate, filterType]);
  

    const fetchTodayReport = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/statistics/weight-by-unit`, {
          params: {
            type: filterType,
            startDate: filterType === 'one' ? formatDateToVNString(dateOne) : formatDateToVNString(startDate),
            endDate: filterType === 'one' ? formatDateToVNString(dateOne) : formatDateToVNString(endDate),
          },
        });

        console.log(res.data.data);
        if (res.data.status === 'success') {
          let tmp = {
            ['Bổ sung-M1B']: res.data.data.find((entry) => entry.u === 'Chuyền 1B')?.value || [...Array(64).fill(0)],
            ['Bổ sung-M2A-2B']: res.data.data.find((entry) => entry.u === 'Chuyền 2A-2B')?.value || [
              ...Array(64).fill(0),
            ],
            ['Bổ sung-TC TBS']: [...Array(64).fill(0)],
            ['Logo-']: res.data.data.find((entry) => entry.d === 'Tổ logo')?.value || [...Array(64).fill(0)],
            ['Ép-']: res.data.data.find((entry) => entry.d === 'Tổ ép')?.value || [...Array(64).fill(0)],
            ['T3-M1']: res.data.data.find((entry) => entry.u === 'Chuyền 1')?.value || [...Array(64).fill(0)],
            ['T3-M2']: res.data.data.find((entry) => entry.u === 'Chuyền 2')?.value || [...Array(64).fill(0)],
            ['T3-M3']: res.data.data.find((entry) => entry.u === 'Chuyền 3')?.value || [...Array(64).fill(0)],
            ['T3-M4']: res.data.data.find((entry) => entry.u === 'Chuyền 4')?.value || [...Array(64).fill(0)],
            ['T3-M5']: res.data.data.find((entry) => entry.u === 'Chuyền 5')?.value || [...Array(64).fill(0)],
            ['T3-M6']: res.data.data.find((entry) => entry.u === 'Chuyền 6')?.value || [...Array(64).fill(0)],
            ['T3-M7']: res.data.data.find((entry) => entry.u === 'Chuyền 7')?.value || [...Array(64).fill(0)],
            ['T3-M8']: res.data.data.find((entry) => entry.u === 'Chuyền 8')?.value || [...Array(64).fill(0)],
            ['T3-RC T3']: res.data.data.find((entry) => entry.u === 'Rác thải chung' && entry.d === 'Tổ 3')?.value || [
              ...Array(64).fill(0),
            ],
            ['T3-TC T3']: [...Array(64).fill(0)],
            ['T4A-M4A-4B']: res.data.data.find((entry) => entry.u === 'Chuyền 4A-4B')?.value || [...Array(64).fill(0)],
            ['T4A-M5A-5B']: res.data.data.find((entry) => entry.u === 'Chuyền 5A-5B')?.value || [...Array(64).fill(0)],
            ['T4A-M6A-6B']: res.data.data.find((entry) => entry.u === 'Chuyền 6A-6B')?.value || [...Array(64).fill(0)],
            ['T4A-M7A-7B']: res.data.data.find((entry) => entry.u === 'Chuyền 7A-7B')?.value || [...Array(64).fill(0)],
            ['T4A-M8A-8B']: res.data.data.find((entry) => entry.u === 'Chuyền 8A-8B')?.value || [...Array(64).fill(0)],
            ['T4A-M9A-9B']: res.data.data.find((entry) => entry.u === 'Chuyền 9A-9B')?.value || [...Array(64).fill(0)],
            ['T4B-M10A']: res.data.data.find((entry) => entry.u === 'Chuyền 10A')?.value || [...Array(64).fill(0)],
            ['T4B-M11A']: res.data.data.find((entry) => entry.u === 'Chuyền 11A')?.value || [...Array(64).fill(0)],
            ['T4B-M12A']: res.data.data.find((entry) => entry.u === 'Chuyền 12A')?.value || [...Array(64).fill(0)],
            ['T4B-M13A']: res.data.data.find((entry) => entry.u === 'Chuyền 13A')?.value || [...Array(64).fill(0)],
            ['T4B-M14A']: res.data.data.find((entry) => entry.u === 'Chuyền 14A')?.value || [...Array(64).fill(0)],
            ['Robot-MRB1']: res.data.data.find((entry) => entry.u === 'Chuyền RB1')?.value || [...Array(64).fill(0)],
            ['Robot-MRB2']: res.data.data.find((entry) => entry.u === 'Chuyền RB2')?.value || [...Array(64).fill(0)],
            ['Robot-MRB3']: res.data.data.find((entry) => entry.u === 'Chuyền RB3')?.value || [...Array(64).fill(0)],
            ['Robot-RC T4']: res.data.data.find((entry) => entry.u === 'Rác thải chung' && entry.d === 'Tổ 4')
              ?.value || [...Array(64).fill(0)],
            ['Robot-TC T4']: [...Array(64).fill(0)],
            ['T5-M10B']: res.data.data.find((entry) => entry.u === 'Chuyền 10B')?.value || [...Array(64).fill(0)],
            ['T5-M11B']: res.data.data.find((entry) => entry.u === 'Chuyền 11B')?.value || [...Array(64).fill(0)],
            ['T5-M12B']: res.data.data.find((entry) => entry.u === 'Chuyền 12B')?.value || [...Array(64).fill(0)],
            ['T5-M13B']: res.data.data.find((entry) => entry.u === 'Chuyền 13B')?.value || [...Array(64).fill(0)],
            ['T5-M14B']: res.data.data.find((entry) => entry.u === 'Chuyền 14B')?.value || [...Array(64).fill(0)],
            ['T5-RC T5']: res.data.data.find((entry) => entry.u === 'Rác thải chung' && entry.d === 'Tổ 5')?.value || [
              ...Array(64).fill(0),
            ],
            ['T5-TC T5']: [...Array(64).fill(0)],
            ['Mẫu-M3A-3B']: res.data.data.find((entry) => entry.u === 'Chuyền 3A-3B')?.value || [...Array(64).fill(0)],
            ['Canh hàng-M1A']: res.data.data.find((entry) => entry.u === 'Chuyền 1A')?.value || [...Array(64).fill(0)],
            ['Pha màu-']: res.data.data.find((entry) => entry.d === 'Pha màu')?.value || [...Array(64).fill(0)],
            ['Chụp khuôn-']: res.data.data.find((entry) => entry.d === 'Chụp khung')?.value || [...Array(64).fill(0)],
            ['Kế hoạch-']: res.data.data.find((entry) => entry.d === 'Kế hoạch')?.value || [...Array(64).fill(0)],
            ['Bán hàng-']: res.data.data.find((entry) => entry.d === 'Bán hàng')?.value || [...Array(64).fill(0)],
            ['Chất lượng-']: res.data.data.find((entry) => entry.d === 'Chất lượng')?.value || [...Array(64).fill(0)],
            ['Kcs-']: res.data.data.find((entry) => entry.d === 'Kcs')?.value || [...Array(64).fill(0)],
            ['Điều hành-']: res.data.data.find((entry) => entry.d === 'Điều hành')?.value || [...Array(64).fill(0)],
            ['Sửa hàng-']: res.data.data.find((entry) => entry.d === 'Tổ sửa hàng')?.value || [...Array(64).fill(0)],
            ['Vật tư-']: res.data.data.find((entry) => entry.d === 'Vật tư')?.value || [...Array(64).fill(0)],
            ['IT - Bảo trì-']: res.data.data.find((entry) => entry.d === 'IT - Bảo trì')?.value || [
              ...Array(64).fill(0),
            ],
            ['Văn phòng-']: res.data.data.find((entry) => entry.d === 'Văn phòng')?.value || [...Array(64).fill(0)],
            ['-Cộng']: res.data.data.find((entry) => entry.u === 'Chuyền 8')?.value || [...Array(64).fill(0)],
            ['Tổng cộng-']: res.data.data.find((entry) => entry.u === 'Chuyền 8')?.value || [...Array(64).fill(0)],
          };

          tmp['T2-'] = sumArrays(
            tmp['Logo-'],
            tmp['Ép-'],
          );

          tmp['T3-TC T3'] = sumArrays(
            tmp['T3-M1'],
            tmp['T3-M2'],
            tmp['T3-M3'],
            tmp['T3-M4'],
            tmp['T3-M5'],
            tmp['T3-M6'],
            tmp['T3-M7'],
            tmp['T3-M8'],
            tmp['T3-RC T3'],
          );
          tmp['Robot-TC T4'] = sumArrays(
            tmp['T4A-M4A-4B'],
            tmp['T4A-M5A-5B'],
            tmp['T4A-M6A-6B'],
            tmp['T4A-M7A-7B'],
            tmp['T4A-M8A-8B'],
            tmp['T4A-M9A-9B'],
            tmp['T4B-M10A'],
            tmp['T4B-M11A'],
            tmp['T4B-M12A'],
            tmp['T4B-M13A'],
            tmp['T4B-M14A'],
            tmp['Robot-MRB1'],
            tmp['Robot-MRB2'],
            tmp['Robot-MRB3'],
            tmp['Robot-RC T4'],
          );
          tmp['T5-TC T5'] = sumArrays(
            tmp['T5-M10B'],
            tmp['T5-M11B'],
            tmp['T5-M12B'],
            tmp['T5-M13B'],
            tmp['T5-M14B'],
            tmp['T5-RC T5'],
          );
          tmp['Bổ sung-TC TBS'] = sumArrays(tmp['Bổ sung-M1B'], tmp['Bổ sung-M2A-2B']);

          tmp['-Cộng'] = sumArrays(
            tmp['Mẫu-M3A-3B'],
            tmp['Canh hàng-M1A'],
            tmp['Pha màu-'],
            tmp['Chụp khuôn-'],
            tmp['Kế hoạch-'],
            tmp['Logo-'],
            tmp['Bán hàng-'],
            tmp['Chất lượng-'],
            tmp['Kcs-'],
            tmp['Điều hành-'],
            tmp['Ép-'],
            tmp['Sửa hàng-'],
            tmp['Vật tư-'],
            tmp['IT - Bảo trì-'],
            tmp['Văn phòng-'],
          );

          tmp['Tổng cộng-'] = sumArrays(
            tmp['T3-TC T3'],
            tmp['Robot-TC T4'],
            tmp['T5-TC T5'],
            tmp['Bổ sung-TC TBS'],
            tmp['-Cộng'],
          );
          tmp['Tổng cộng-'] = groupSumWithZeros(tmp['Tổng cộng-']);
          
          for (const key in tmp) {
            tmp[key] = trimKeepLast(tmp[key]);
          }

          if (filterType === 'range') {
            tmp['T2-'] = groupSumWithZeros(tmp['T2-']);
            tmp['T3-TC T3'] = groupSumWithZeros(tmp['T3-TC T3']);
            tmp['Robot-TC T4'] = groupSumWithZeros(tmp['Robot-TC T4']);
            tmp['T5-TC T5'] = groupSumWithZeros(tmp['T5-TC T5']);
            tmp['Bổ sung-TC TBS'] = groupSumWithZeros(tmp['Bổ sung-TC TBS']);
            tmp['Mẫu-M3A-3B'] = groupSumWithZeros(tmp['Mẫu-M3A-3B']);
            tmp['Canh hàng-M1A'] = groupSumWithZeros(tmp['Canh hàng-M1A']);
            tmp['Pha màu-'] = groupSumWithZeros(tmp['Pha màu-']);
            tmp['Chụp khuôn-'] = groupSumWithZeros(tmp['Chụp khuôn-']);
            tmp['Kế hoạch-'] = groupSumWithZeros(tmp['Kế hoạch-']);
            tmp['Logo-'] = groupSumWithZeros(tmp['Logo-']);
            tmp['Bán hàng-'] = groupSumWithZeros(tmp['Bán hàng-']);
            tmp['Chất lượng-'] = groupSumWithZeros(tmp['Chất lượng-']);
            tmp['Kcs-'] = groupSumWithZeros(tmp['Kcs-']);
            tmp['Điều hành-'] = groupSumWithZeros(tmp['Điều hành-']);
            tmp['Ép-'] = groupSumWithZeros(tmp['Ép-']);
            tmp['Sửa hàng-'] = groupSumWithZeros(tmp['Sửa hàng-']);
            tmp['Vật tư-'] = groupSumWithZeros(tmp['Vật tư-']);
            tmp['IT - Bảo trì-'] = groupSumWithZeros(tmp['IT - Bảo trì-']);
            tmp['Văn phòng-'] = groupSumWithZeros(tmp['Văn phòng-']);

            // tmp['T3-TC T3'] = sumFirstSixElements(tmp['T3-TC T3']);
            // tmp['Robot-TC T4'] = sumFirstSixElements(tmp['Robot-TC T4']);
            // tmp['T5-TC T5'] = sumFirstSixElements(tmp['T5-TC T5']);
            // tmp['Bổ sung-TC TBS'] = sumFirstSixElements(tmp['Bổ sung-TC TBS']);
            // tmp['Mẫu-M3A-3B'] = sumFirstSixElements(tmp['Mẫu-M3A-3B']);
            // tmp['Canh hàng-M1A'] = sumFirstSixElements(tmp['Canh hàng-M1A']);
            // tmp['Pha màu-'] = sumFirstSixElements(tmp['Pha màu-']);
            // tmp['Chụp khuôn-'] = sumFirstSixElements(tmp['Chụp khuôn-']);
            // tmp['Kế hoạch-'] = sumFirstSixElements(tmp['Kế hoạch-']);
            // tmp['Logo-'] = sumFirstSixElements(tmp['Logo-']);
            // tmp['Bán hàng-'] = sumFirstSixElements(tmp['Bán hàng-']);
            // tmp['Chất lượng-'] = sumFirstSixElements(tmp['Chất lượng-']);
            // tmp['Kcs-'] = sumFirstSixElements(tmp['Kcs-']);
            // tmp['Điều hành-'] = sumFirstSixElements(tmp['Điều hành-']);
            // tmp['Ép-'] = sumFirstSixElements(tmp['Ép-']);
            // tmp['Sửa hàng-'] = sumFirstSixElements(tmp['Sửa hàng-']);
            // tmp['Vật tư-'] = sumFirstSixElements(tmp['Vật tư-']);
            // tmp['IT - Bảo trì-'] = sumFirstSixElements(tmp['IT - Bảo trì-']);
            // tmp['Văn phòng-'] = sumFirstSixElements(tmp['Văn phòng-']);
            // tmp['Tổng cộng-'] = sumFirstSixElements(tmp['Tổng cộng-']);
          }
          

          setReport(tmp);

        }
      } catch (error) {
        setLoading(false);
        console.error('Lỗi khi tải dữ liệu: ', error.message);
      }
    };

  const headers = [
    'BP/Tổ',
    'Chuyền',
    'Giẻ lau dính mực thường',
    'Giẻ lau dính mực lapa',
    'Băng keo',
    'Keo bàn thải',
    'Mực in thải',
    'Mực in lapa thải',
    'Vụn logo',
    'Lụa căng khung',
    'Tổng',
  ];

  const headersRange = [
    'BP/Tổ',
    'Giẻ lau dính mực thường',
    'Giẻ lau dính mực lapa',
    'Băng keo',
    'Keo bàn thải',
    'Mực in thải',
    'Mực in lapa thải',
    'Vụn logo',
    'Lụa căng khung',
    'Tổng',
  ];

  const subHeaders = [
    'C1',
    'C2',
    'C3',
    'D1',
    'D2',
    'HC',
    'KoC',
    'C1',
    'C2',
    'C3',
    'D1',
    'D2',
    'HC',
    'KoC',
    'C1',
    'C2',
    'C3',
    'D1',
    'D2',
    'HC',
    'KoC',
    'C1',
    'C2',
    'C3',
    'D1',
    'D2',
    'HC',
    'KoC',
    'C1',
    'C2',
    'C3',
    'D1',
    'D2',
    'HC',
    'KoC',
    'C1',
    'C2',
    'C3',
    'D1',
    'D2',
    'HC',
    'KoC',
    'C1',
    'C2',
    'C3',
    'D1',
    'D2',
    'HC',
    'KoC',
    'C1',
    'C2',
    'C3',
    'D1',
    'D2',
    'HC',
    'KoC',
  ];

  const data = [
    { group: 'Bổ sung', items: ['M1B', 'M2A-2B', 'TC TBS'] },
    { group: 'T2', items: [''] },
    { group: 'T3', items: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'RC T3', 'TC T3'] },
    { group: 'T4A', items: ['M4A-4B', 'M5A-5B', 'M6A-6B', 'M7A-7B', 'M8A-8B', 'M9A-9B'] },
    { group: 'T4B', items: ['M10A', 'M11A', 'M12A', 'M13A', 'M14A'] },
    { group: 'Robot', items: ['MRB1', 'MRB2', 'MRB3', 'RC T4', 'TC T4'] },
    { group: 'T5', items: ['M10B', 'M11B', 'M12B', 'M13B', 'M14B', 'RC T5', 'TC T5'] },
    { group: 'Mẫu', items: ['M3A-3B'] },
    { group: 'Canh hàng', items: ['M1A'] },
    { group: 'Chụp khuôn', items: [''] },
    { group: 'Kcs', items: [''] },
    { group: 'Sửa hàng', items: [''] },
    { group: 'Pha màu', items: [''] },
  ];

  const dataRange = [
    { group: 'Tổ 1', items: [''] },
    { group: 'Tổ 2', items: [''] },
    { group: 'Tổ 3', items: [''] },
    { group: 'Tổ 4', items: [''] },
    { group: 'Tổ 5', items: [''] },
    { group: 'Mẫu', items: [''] },
    { group: 'Canh hàng', items: [''] },
    { group: 'Chụp khuôn', items: [''] },
    { group: 'Kcs', items: [''] },
    { group: 'Sửa hàng', items: [''] },
    { group: 'Pha màu', items: [''] },
  ];

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // Header dòng 1 (gồm colSpan và rowSpan)
    const headerRow1 = [
      'BP/Tổ',
      'Chuyền',
      'Giẻ lau dính mực thường',
      '',
      '',
      '',
      '',
      '',
      '',
      'Giẻ lau dính mực lapa',
      '',
      '',
      '',
      '',
      '',
      '',
      'Băng keo',
      '',
      '',
      '',
      '',
      '',
      '',
      'Keo bàn thải',
      '',
      '',
      '',
      '',
      '',
      '',
      'Mực in thải',
      '',
      '',
      '',
      '',
      '',
      '',
      'Mực in lapa thải',
      '',
      '',
      '',
      '',
      '',
      '',
      'Vụn logo',
      '',
      '',
      '',
      '',
      '',
      '',
      'Lụa căng khung',
      '',
      '',
      '',
      '',
      '',
      '',
      'Tổng',
    ];

    // Header dòng 2 (sub headers)
    const headerRow2 = [
      '',
      '',
      'C1',
      'C2',
      'C3',
      'D1',
      'D2',
      'HC',
      'KoC',
      'C1',
      'C2',
      'C3',
      'D1',
      'D2',
      'HC',
      'KoC',
      'C1',
      'C2',
      'C3',
      'D1',
      'D2',
      'HC',
      'KoC',
      'C1',
      'C2',
      'C3',
      'D1',
      'D2',
      'HC',
      'KoC',
      'C1',
      'C2',
      'C3',
      'D1',
      'D2',
      'HC',
      'KoC',
      'C1',
      'C2',
      'C3',
      'D1',
      'D2',
      'HC',
      'KoC',
      'C1',
      'C2',
      'C3',
      'D1',
      'D2',
      'HC',
      'KoC',
      'C1',
      'C2',
      'C3',
      'D1',
      'D2',
      'HC',
      'KoC',
      '',
    ];

    const dataExcel = [
      { group: 'Bổ sung', items: ['M1B', 'M2A-2B', 'TC TBS'] },
      { group: 'T2', items: [''] },
      { group: 'T3', items: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'RC T3', 'TC T3'] },
      { group: 'T4A', items: ['M4A-4B', 'M5A-5B', 'M6A-6B', 'M7A-7B', 'M8A-8B', 'M9A-9B'] },
      { group: 'T4B', items: ['M10A', 'M11A', 'M12A', 'M13A', 'M14A'] },
      { group: 'Robot', items: ['MRB1', 'MRB2', 'MRB3', 'RC T4', 'TC T4'] },
      { group: 'T5', items: ['M10B', 'M11B', 'M12B', 'M13B', 'M14B', 'RC T5', 'TC T5'] },
      { group: 'Mẫu', items: ['M3A-3B'] },
      { group: 'Canh hàng', items: ['M1A'] },
      { group: 'Chụp khuôn', items: [''] },
      { group: 'Kcs', items: [''] },
      { group: 'Sửa hàng', items: [''] },
      { group: 'Pha màu', items: [''] },
      { group: 'Tổng cộng', items: [''] },
    ];

    // Dữ liệu bảng
    const rows = dataExcel.flatMap((d) =>
      d.items.map((item, idx) => {
        const key = `${d.group}-${item}`;
        const data = report[key];

        const values = data?.map((e) => (e === 0 ? '-' : e.toFixed(1))) || [];

        return [idx === 0 ? d.group === 'Bổ sung' ? 'T1' : d.group : '', item, ...values];
      }),
    );

    const today = new Date().toLocaleDateString('vi-VN');
    const title = [
      `BẢNG THEO DÕI RÁC THẢI CHI TIẾT NGÀY ${
        filterType === 'one'
          ? formatDateToVNString1(dateOne)
          : `${formatDateToVNString1(startDate)} - ${formatDateToVNString1(endDate)}`
      }`,
    ];

    const wsData = [title, headerRow1, headerRow2, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Gộp ô (colSpan và rowSpan) trong header
    ws['!merges'] = [
      // Gộp ô header chính (rowSpan 2)
      { s: { r: 1, c: 0 }, e: { r: 2, c: 0 } }, // BP/Tổ
      { s: { r: 1, c: 1 }, e: { r: 2, c: 1 } }, // Chuyền

      // Gộp các nhóm rác thải theo cột (colSpan 5)
      { s: { r: 1, c: 2 }, e: { r: 1, c: 8 } },
      { s: { r: 1, c: 9 }, e: { r: 1, c: 15 } },
      { s: { r: 1, c: 16 }, e: { r: 1, c: 22 } },
      { s: { r: 1, c: 23 }, e: { r: 1, c: 29 } },
      { s: { r: 1, c: 30 }, e: { r: 1, c: 36 } },
      { s: { r: 1, c: 37 }, e: { r: 1, c: 43 } },
      { s: { r: 1, c: 44 }, e: { r: 1, c: 50 } },
      { s: { r: 1, c: 51 }, e: { r: 1, c: 57 } },

      { s: { r: 1, c: 58 }, e: { r: 2, c: 58 } }, // Tổng

      // Merge tổ group
      { s: { r: 3, c: 0 }, e: { r: 5, c: 0 } },
      { s: { r: 7, c: 0 }, e: { r: 16, c: 0 } },
      { s: { r: 17, c: 0 }, e: { r: 22, c: 0 } },
      { s: { r: 23, c: 0 }, e: { r: 27, c: 0 } },
      { s: { r: 28, c: 0 }, e: { r: 32, c: 0 } },
      { s: { r: 33, c: 0 }, e: { r: 39, c: 0 } },

      // Merge dòng 51 (sau khi offset thêm 1 dòng thành 52)
      { s: { r: 46, c: 0 }, e: { r: 46, c: 1 } },
      { s: { r: 46, c: 2 }, e: { r: 46, c: 8 } },
      { s: { r: 46, c: 9 }, e: { r: 46, c: 15 } },
      { s: { r: 46, c: 16 }, e: { r: 46, c: 22 } },
      { s: { r: 46, c: 23 }, e: { r: 46, c: 29 } },
      { s: { r: 46, c: 30 }, e: { r: 46, c: 36 } },
      { s: { r: 46, c: 37 }, e: { r: 46, c: 43 } },
      { s: { r: 46, c: 44 }, e: { r: 46, c: 50 } },
      { s: { r: 46, c: 51 }, e: { r: 46, c: 57 } },
    ];

    ws['!merges'].unshift({
      s: { r: 0, c: 0 },
      e: { r: 0, c: 58 },
    });
    // Style title row
    const titleCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
    ws[titleCell].s = {
      alignment: {
        horizontal: 'center',
        vertical: 'center',
      },
      font: {
        bold: true,
        sz: 16,
        color: { rgb: '000000' },
      },
    };

    // Style toàn bộ sheet: border cho tất cả ô
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) continue;

        ws[cellAddress].s = {
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } },
          },
          alignment: {
            vertical: 'center',
            horizontal: 'center',
            wrapText: true,
          },
        };
      }
    }

    for (let col = 0; col <= 58; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 1, c: col });
      if (!ws[cellAddress]) continue;

      ws[cellAddress].s = {
        ...ws[cellAddress].s,
        fill: {
          fgColor: { rgb: 'e5e7eb' },
        },
        font: {
          bold: true,
          color: { rgb: '000000' },
        },
      };
    }

    // Tô màu và đậm dòng "Tổng cộng"
    const lastRowIndex = wsData.length - 1;
    for (let col = 0; col <= 58; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: lastRowIndex, c: col });
      if (!ws[cellAddress]) continue;

      ws[cellAddress].s = {
        ...ws[cellAddress].s,
        fill: {
          fgColor: { rgb: 'FFF3CD' }, // màu vàng nhạt
        },
        font: {
          bold: true,
          color: { rgb: '000000' },
        },
      };
    }

    for (let col = 0; col <= 58; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 5, c: col });
      if (!ws[cellAddress]) continue;

      ws[cellAddress].s = {
        ...ws[cellAddress].s,
        fill: {
          fgColor: { rgb: 'cfb8b8' },
        },
        font: {
          bold: true,
          color: { rgb: '000000' },
        },
      };
    }

    for (let col = 0; col <= 58; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 16, c: col });
      if (!ws[cellAddress]) continue;

      ws[cellAddress].s = {
        ...ws[cellAddress].s,
        fill: {
          fgColor: { rgb: 'cfb8b8' },
        },
        font: {
          bold: true,
          color: { rgb: '000000' },
        },
      };
    }

    for (let col = 0; col <= 58; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 32, c: col });
      if (!ws[cellAddress]) continue;

      ws[cellAddress].s = {
        ...ws[cellAddress].s,
        fill: {
          fgColor: { rgb: 'cfb8b8' },
        },
        font: {
          bold: true,
          color: { rgb: '000000' },
        },
      };
    }

    for (let col = 0; col <= 58; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 39, c: col });
      if (!ws[cellAddress]) continue;

      ws[cellAddress].s = {
        ...ws[cellAddress].s,
        fill: {
          fgColor: { rgb: 'cfb8b8' },
        },
        font: {
          bold: true,
          color: { rgb: '000000' },
        },
      };
    }

    for (let col = 0; col <= 58; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 53, c: col });
      if (!ws[cellAddress]) continue;

      ws[cellAddress].s = {
        ...ws[cellAddress].s,
        fill: {
          fgColor: { rgb: 'cfb8b8' },
        },
        font: {
          bold: true,
          color: { rgb: '000000' },
        },
      };
    }

    XLSX.utils.book_append_sheet(
      wb,
      ws,
      `${
        filterType === 'one'
          ? formatDateToVNString2(dateOne)
          : `${formatDateToVNString2(startDate)} - ${formatDateToVNString2(endDate)}`
      }`,
    );

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(
      new Blob([wbout], { type: 'application/octet-stream' }),
      `BẢNG THEO DÕI RÁC THẢI CHI TIẾT NGÀY ${
        filterType === 'one'
          ? formatDateToVNString1(dateOne)
          : `${formatDateToVNString1(startDate)} - ${formatDateToVNString1(endDate)}`
      }.xlsx`,
    );
  };

  const exportToExcel2 = () => {
    const wb = XLSX.utils.book_new();

    // Header dòng 1 (gồm colSpan và rowSpan)
    const headerRow1 = [
      'BP/Tổ',
      'Giẻ lau dính mực thường',
      'Giẻ lau dính mực lapa',
      'Băng keo',
      'Keo bàn thải',
      'Mực in thải',
      'Mực in lapa thải',
      'Vụn logo',
      'Lụa căng khung',
      'Tổng',
    ];

    const dataExcel = [
      { group: 'Tổ 1', items: [''] },
      { group: 'Tổ 2', items: [''] },
      { group: 'Tổ 3', items: [''] },
      { group: 'Tổ 4', items: [''] },
      { group: 'Tổ 5', items: [''] },
      { group: 'Mẫu', items: [''] },
      { group: 'Canh hàng', items: [''] },
      { group: 'Chụp khuôn', items: [''] },
      { group: 'Kcs', items: [''] },
      { group: 'Sửa hàng', items: [''] },
      { group: 'Pha màu', items: [''] },
      { group: 'Tổng cộng', items: [''] },
    ];

    // Dữ liệu bảng
    const rows = dataExcel.map((d, idx) => {
      const key = `${
                          idx === 0
                            ? 'Bổ sung-TC TBS'
                            : idx === 1
                            ? 'T2-'
          : idx === 2
          ? 'T3-TC T3'
          : idx === 3
          ? 'Robot-TC T4'
          : idx === 4
          ? 'T5-TC T5'
          : idx === 5
          ? 'Mẫu-M3A-3B'
          : idx === 6
          ? 'Canh hàng-M1A'
          : d.group + '-'
      }`;
      const data = report[key];

      const values = data?.map((e) => (e === 0 ? '-' : e.toFixed(1)));

      return [
        d.group,
        values[0],
        values[7],
        values[14],
        values[21],
        values[28],
        values[35],
        values[42],
        values[49],
        values[56],
        values[63],
      ];
    });

    const today = new Date().toLocaleDateString('vi-VN');
    const title = [
      `BẢNG THEO DÕI RÁC THẢI CHI TIẾT NGÀY ${
        filterType === 'one'
          ? formatDateToVNString1(dateOne)
          : `${formatDateToVNString1(startDate)} - ${formatDateToVNString1(endDate)}`
      }`,
    ];

    const wsData = [title, headerRow1, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!merges'] = [
      // Gộp ô header chính (rowSpan 2)
      { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
    ];

    // Style title row
    const titleCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
    ws[titleCell].s = {
      alignment: {
        horizontal: 'center',
        vertical: 'center',
      },
      font: {
        bold: true,
        sz: 16,
        color: { rgb: '000000' },
      },
    };

    // Style toàn bộ sheet: border cho tất cả ô
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) continue;

        ws[cellAddress].s = {
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } },
          },
          alignment: {
            vertical: 'center',
            horizontal: 'center',
            wrapText: true,
          },
        };
      }
    }

    for (let col = 0; col <= 35; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 1, c: col });
      if (!ws[cellAddress]) continue;

      ws[cellAddress].s = {
        ...ws[cellAddress].s,
        fill: {
          fgColor: { rgb: 'e5e7eb' },
        },
        font: {
          bold: true,
          color: { rgb: '000000' },
        },
      };
    }

    // Tô màu và đậm dòng "Tổng cộng"
    const lastRowIndex = wsData.length - 1;
    for (let col = 0; col <= 35; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: lastRowIndex, c: col });
      if (!ws[cellAddress]) continue;

      ws[cellAddress].s = {
        ...ws[cellAddress].s,
        fill: {
          fgColor: { rgb: 'FFF3CD' }, // màu vàng nhạt
        },
        font: {
          bold: true,
          color: { rgb: '000000' },
        },
      };
    }

    for (let row = 2; row <= 20; row++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: 9 });
      if (!ws[cellAddress]) continue;

      ws[cellAddress].s = {
        ...ws[cellAddress].s,
        fill: {
          fgColor: { rgb: 'f78888' }, // màu đỏ nhạt
        },
      };
    }

    for (let row = 2; row <= 20; row++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: 11 });
      if (!ws[cellAddress]) continue;

      ws[cellAddress].s = {
        ...ws[cellAddress].s,
        fill: {
          fgColor: { rgb: 'FFF3CD' }, // màu đỏ nhạt
        },
        font: {
          bold: true,
          color: { rgb: '000000' },
        },
      };
    }

    XLSX.utils.book_append_sheet(
      wb,
      ws,
      `${
        filterType === 'one'
          ? formatDateToVNString2(dateOne)
          : `${formatDateToVNString2(startDate)} - ${formatDateToVNString2(endDate)}`
      }`,
    );

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(
      new Blob([wbout], { type: 'application/octet-stream' }),
      `BẢNG THEO DÕI RÁC THẢI CHI TIẾT NGÀY ${
        filterType === 'one'
          ? formatDateToVNString1(dateOne)
          : `${formatDateToVNString1(startDate)} - ${formatDateToVNString1(endDate)}`
      }.xlsx`,
    );
  };

  const handleSave = async (data) => {
    if (!value || value === 0 || isNaN(parseFloat(value)) || value === '') {
      return;
    }

    setLoading(true);

    const {trashBinCode, workShift} = await HandleGetCodeQr(selectInput);
    
    const nowUTC7 = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
    let weight = parseFloat(value);
    
    const payload = {
      trashBinCode: trashBinCode,
      userID: user.userID,
      weighingTime: nowUTC7.toISOString(),
      weightKg: weight,
      updatedAt: nowUTC7.toISOString(),
      updatedBy: user.userID,
      workShift: workShift,
      workDate: new Date(dateOne).toISOString().split('T')[0],
      userName: user?.fullName,
    };

        try {
          const res = await fetch(`${BASE_URL}/trash-weighings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
    
          if (res.ok) {
            const result = await res.json();
  
            await fetchTodayReport();

            //setMessageModal({ type: 'success', message: '✅ Đã lưu dữ liệu cân rác thành công!' });
          } else {
            const errText = await res.text();
          }
        } catch (err) {

        } finally {
          setLoading(false);
    
          setStatusUpdate(false);
          setSelectInput({
            group: "",
            item: "",
            index: "",
          })
          setValue(0);
        }

  }

  return (
    <div className="p-2">
      <div className="p-2 space-y-6 bg-white rounded-[6px]">
      {loading && (
        <div className="fixed inset-0 bg-white bg-opacity-70 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
        </div>
      )}

      <div className="p-4">
        <div className="flex justify-between">
          <button
            onClick={filterType === 'one' ? exportToExcel : exportToExcel2}
            className="mb-4 px-4 py-0 text-[14px] bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Xuất Excel
          </button>

          <div className="flex gap-[10px]">
            {filterType === 'one' && (
              <div className="mb-2">
                <label className="block text-sm font-medium mb-1">Chọn ngày</label>
                <DatePicker
                  selected={dateOne}
                  onChange={(date) => setDateOne(date)}
                  dateFormat="dd/MM/yyyy"
                  className="border px-2 py-1 rounded w-full"
                  locale={vi}
                />
              </div>
            )}

            {filterType === 'range' && (
              <div className="flex gap-[10px] mb-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Từ ngày</label>
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    dateFormat="dd/MM/yyyy"
                    className="border px-2 py-1 rounded w-full"
                    locale={vi}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Đến ngày</label>
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    dateFormat="dd/MM/yyyy"
                    className="border px-2 py-1 rounded w-full"
                    locale={vi}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center space-x-4 mb-3">
              <label className="flex items-center space-x-1">
                <input type="radio" value="one" checked={filterType === 'one'} onChange={() => setFilterType('one')} />
                <span>1 ngày</span>
              </label>
              <label className="flex items-center space-x-1">
                <input
                  type="radio"
                  value="range"
                  checked={filterType === 'range'}
                  onChange={() => setFilterType('range')}
                />
                <span>Nhiều ngày</span>
              </label>
            </div>
          </div>
        </div>

        <div className="overflow-auto">
          <table className="min-w-full border border-collapse border-gray-400 text-sm">
            <thead>
              <tr>
                {filterType === 'one'
                  ? headers.map((header, idx) => (
                      <th
                        key={idx}
                        rowSpan={idx === 0 || idx === 1 || idx === 10 ? 2 : 1}
                        colSpan={idx >= 2 && idx <= 9 ? 7 : 1}
                        className="border border-gray-400 px-2 py-1 text-center bg-gray-200"
                      >
                        {header}
                      </th>
                    ))
                  : headersRange.map((header, idx) => (
                      <th key={idx} className="border border-gray-400 px-2 py-1 text-center bg-gray-200">
                        {header}
                      </th>
                    ))}
              </tr>
              <tr>
                {filterType === 'one' &&
                  subHeaders.map((sub, idx) => (
                    <th key={idx} className="border border-gray-400 px-2 py-1 text-center bg-gray-100">
                      {sub}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {filterType === 'one'
                ? data?.map((group, idx) =>
                    group?.items?.map((item, iidx) => (
                      <tr
                        className={`${
                          idx === 0 && iidx === 2
                            ? 'bg-[#cfb8b8]'
                            : idx === 5 && iidx === 4
                            ? 'bg-[#cfb8b8]'
                            : idx === 6 && iidx === 6
                            ? 'bg-[#cfb8b8]'
                            : idx === 2 && iidx === 9
                            ? 'bg-[#cfb8b8]'
                            : idx === 20
                            ? 'bg-[#cfb8b8]'
                            : ''
                        }`}
                        key={`${idx}-${iidx}`}
                      >
                        {iidx === 0 && (
                          <td
                            rowSpan={
                              idx === 2
                                ? 10
                                : idx === 3
                                ? 6
                                : idx === 4
                                ? 5
                                : idx === 5
                                ? 5
                                : idx === 6
                                ? 7
                                : idx === 0
                                ? 3
                                : 1
                            }
                            className="border border-gray-300 px-2 py-1"
                          >
                            {group.group === 'Bổ sung' ? 'T1' : group.group}
                          </td>
                        )}
                        <td className={`border border-gray-300 px-2 py-1 ${idx === 21 && 'font-[600]'}`}>{item}</td>
                        {report[`${group.group}-${item}`]?.map((e, i) => (
                          <td
                            key={i}
                            className={`border border-gray-300 text-center px-2 py-1 ${i === 63 && 'font-[600]'}`}
                            onDoubleClick={() => {
                              setStatusUpdate(true);
                              setSelectInput({
                                  group: group.group,
                                  item: item,
                                  index: i,
                              });
                              setValue(e);
                              setTimeout(() => {
                                inputRef.current?.focus();
                              }, 0);
                            }}
                          >
                            {
                              user?.roleEditReport && statusUpdate && filterType === 'one' && selectInput.group === group.group && selectInput.item === item && selectInput.index === i ?
                              <div className="flex items-center space-x-2">
                                <input
                                  ref={inputRef}
                                  className="w-24 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                                  type="text"
                                  value={value}
                                  onChange={(e) => {setValue(e.target.value)}}
                                />
                                <button
                                  className="text-green-600 hover:text-green-800 transition-colors"
                                  onClick={() => handleSave(e)}
                                >
                                  <FaCheck className="w-4 h-4" />
                                </button>
                                <button
                                  className="text-red-600 hover:text-red-800 transition-colors"
                                  onClick={() => {
                                    setStatusUpdate(false);
                                    setSelectInput({
                                        group: "",
                                        item: "",
                                        index: "",
                                    })
                                    setValue(0);
                                  }}
                                >
                                  <FaTimes className="w-4 h-4" />
                                </button>
                              </div> :
                              <button>
                                {e === 0 ? '-' : parseFloat(e?.toFixed(1))}
                              </button>
                            }
                          </td>
                        ))}
                      </tr>
                    )),
                  )
                : dataRange?.map((group, idx) => (
                    <tr key={`${idx}-`}>
                      <td className="border border-gray-300 px-2 py-1">{group.group}</td>
                      {report[
                        `${
                          idx === 0
                            ? 'Bổ sung-TC TBS'
                            : idx === 1
                            ? 'T2-'
                            : idx === 2
                            ? 'T3-TC T3'
                            : idx === 3
                            ? 'Robot-TC T4'
                            : idx === 4
                            ? 'T5-TC T5'
                            : idx === 5
                            ? 'Mẫu-M3A-3B'
                            : idx === 6
                            ? 'Canh hàng-M1A'
                            : group.group + '-'
                        }`
                      ]?.map(
                        (e, i) =>
                          i % 7 === 0 && (
                            <td
                              key={i}
                              className={`border font-[600] ${
                                 'border-gray-300'
                              } text-center px-2 py-1`}
                            >
                              {e === 0 ? '-' : parseFloat(e?.toFixed(1))}
                            </td>
                          ),
                      )}
                    </tr>
                  ))}
              <tr className="bg-[#9e8f8f]">
                <td
                  className="border border-gray-400 text-center px-2 py-1 font-bold"
                  colSpan={filterType === 'one' ? 2 : 1}
                >
                  Tổng cộng
                </td>
                {report['Tổng cộng-']?.map(
                  (e, i) =>
                    i % 7 === 0 && (
                      <td
                        key={i}
                        colSpan={filterType === 'one' ? 7 : 1}
                        className="border border-gray-400 text-center font-bold px-2 py-1"
                      >
                        {e === 0 ? '-' : parseFloat(e?.toFixed(1))}
                      </td>
                    ),
                )}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Report;
