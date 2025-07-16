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

const ReportByShift = () => {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState([]);
  const [reportTmp, setReportTmp] = useState([]);

  const [filterType, setFilterType] = useState('one'); // 'one' or 'range'
  const [statusUpdate, setStatusUpdate] = useState(false);
  const [selectInput, setSelectInput] = useState({
    group: '',
    item: '',
  });
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  const [selectedDepartment, setSelectedDepartment] = useState('');

  const [dateOne, setDateOne] = useState(new Date());
  const [startDate, setStartDate] = useState(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  });
  const [endDate, setEndDate] = useState(new Date());
  
  const [dataTmp, setDataTmp] = useState([
    { group: 'Bổ sung', items: ['TC TBS'] },
    { group: 'T2', items: [''] },
    { group: 'T3', items: ['TC T3'] },
    { group: 'Robot', items: ['TC T4'] },
    { group: 'T5', items: ['TC T5'] },
    { group: 'Mẫu', items: ['M3A-3B'] },
    { group: 'Canh hàng', items: ['M1A'] },
    { group: 'Chụp khuôn', items: [''] },
    { group: 'Kcs', items: [''] },
    { group: 'Sửa hàng', items: [''] },
    { group: 'Pha màu', items: [''] },
  ]);

  const [data, setData] = useState([
    { group: 'Bổ sung', items: ['TC TBS'] },
    { group: 'T2', items: [''] },
    { group: 'T3', items: ['TC T3'] },
    { group: 'Robot', items: ['TC T4'] },
    { group: 'T5', items: ['TC T5'] },
    { group: 'Mẫu', items: ['M3A-3B'] },
    { group: 'Canh hàng', items: ['M1A'] },
    { group: 'Chụp khuôn', items: [''] },
    { group: 'Kcs', items: [''] },
    { group: 'Sửa hàng', items: [''] },
    { group: 'Pha màu', items: [''] },
  ]);

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

  function sumEvery7(arr) {
    const result = [];

    for (let i = 0; i < 7; i++) {
        let sum = 0;
        for (let j = i; j < arr.length; j += 7) {
            if(j !== arr.length - 1) {
                sum += arr[j];
            }
        }
        result.push(sum);
    }

    result.push(arr[arr.length - 1]);
    result.splice(6, 1);
    return result;
}

  // console.log(report);

  // useEffect(() => {

  //   const prefixes = selectedDepartment.includes('|')
  //     ? selectedDepartment.split('|')
  //     : [selectedDepartment];

  //     const filtered = Object.entries(reportTmp)
  //   .filter(([key]) => prefixes.some(prefixe => key.startsWith(prefixe)))
  //   .reduce((obj, [key, value]) => {
  //     obj[key] = value;
  //     return obj;
  //   }, {});

  //   setReport(filtered);

  //   if(selectedDepartment === '') {
  //     setData(dataTmp);
  //   } else {
  //     const selected = dataTmp.filter(item => item.group === selectedDepartment);

  //     setData(selected);
  //     if(selectedDepartment === 'T3') {
  //       setData([{ group: 'T3', items: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'RC T3', 'TC T3'] }])
  //     }
  //   }

  // }, [selectedDepartment])


  useEffect(() => {
    setLoading(true);

    // Gọi lần lượt từng API
    fetchTodayReport();

    

    const prefixes = selectedDepartment.includes('|')
      ? selectedDepartment.split('|')
      : [selectedDepartment];

      const filtered = Object.entries(reportTmp)
    .filter(([key]) => prefixes.some(prefixe => key.startsWith(prefixe)))
    .reduce((obj, [key, value]) => {
      obj[key] = value;
      return obj;
    }, {});

    setReport(filtered);

    if(selectedDepartment === '') {
      setData(dataTmp);
    } else {
      const selected = dataTmp.filter(item => item.group === selectedDepartment);

      setData(selected);
      if(selectedDepartment === 'T3') {
        setData([{ group: 'T3', items: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'RC T3', 'TC T3'] }])
      } else if (selectedDepartment === 'Bổ sung') {
        setData([{ group: 'Bổ sung', items: ['M1B', 'M2A-2B', 'TC TBS'] }])
      } else if (selectedDepartment === 'T2') {
        setData([{ group: 'T2', items: [''] }])
      } else if (selectedDepartment === 'T4|Robot') {
        setData([{ group: 'T4A', items: ['M4A-4B', 'M5A-5B', 'M6A-6B', 'M7A-7B', 'M8A-8B', 'M9A-9B'] },
                { group: 'T4B', items: ['M10A', 'M11A', 'M12A', 'M13A', 'M14A'] },
                { group: 'Robot', items: ['MRB1', 'MRB2', 'MRB3', 'RC T4', 'TC T4'] }])
      } else if (selectedDepartment === 'T5') {
        setData([{ group: 'T5', items: ['M10B', 'M11B', 'M12B', 'M13B', 'M14B', 'RC T5', 'TC T5'] }])
      }

    }

    setLoading(false);
  }, [dateOne, startDate, endDate, filterType, selectedDepartment]);
  

    const fetchTodayReport = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/statistics/weight-by-unit`, {
          params: {
            type: filterType,
            startDate: filterType === 'one' ? formatDateToVNString(dateOne) : formatDateToVNString(startDate),
            endDate: filterType === 'one' ? formatDateToVNString(dateOne) : formatDateToVNString(endDate),
          },
        });

        if (res.data.status === 'success') {
          let tmp = {
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
            ['Bổ sung-M1B']: res.data.data.find((entry) => entry.u === 'Chuyền 1B')?.value || [...Array(64).fill(0)],
            ['Bổ sung-M2A-2B']: res.data.data.find((entry) => entry.u === 'Chuyền 2A-2B')?.value || [
              ...Array(64).fill(0),
            ],
            ['Bổ sung-TC TBS']: [...Array(64).fill(0)],
            ['Mẫu-M3A-3B']: res.data.data.find((entry) => entry.u === 'Chuyền 3A-3B')?.value || [...Array(64).fill(0)],
            ['Canh hàng-M1A']: res.data.data.find((entry) => entry.u === 'Chuyền 1A')?.value || [...Array(64).fill(0)],
            ['Pha màu-']: res.data.data.find((entry) => entry.d === 'Pha màu')?.value || [...Array(64).fill(0)],
            ['Chụp khuôn-']: res.data.data.find((entry) => entry.d === 'Chụp khung')?.value || [...Array(64).fill(0)],
            ['Kế hoạch-']: res.data.data.find((entry) => entry.d === 'Kế hoạch')?.value || [...Array(64).fill(0)],
            ['Logo-']: res.data.data.find((entry) => entry.d === 'Tổ logo')?.value || [...Array(64).fill(0)],
            ['Bán hàng-']: res.data.data.find((entry) => entry.d === 'Bán hàng')?.value || [...Array(64).fill(0)],
            ['Chất lượng-']: res.data.data.find((entry) => entry.d === 'Chất lượng')?.value || [...Array(64).fill(0)],
            ['Kcs-']: res.data.data.find((entry) => entry.d === 'Kcs')?.value || [...Array(64).fill(0)],
            ['Điều hành-']: res.data.data.find((entry) => entry.d === 'Điều hành')?.value || [...Array(64).fill(0)],
            ['Ép-']: res.data.data.find((entry) => entry.d === 'Tổ ép')?.value || [...Array(64).fill(0)],
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
        //   tmp['Tổng cộng-'] = groupSumWithZeros(tmp['Tổng cộng-']);

        //   if (filterType === 'range') {
        //     tmp['T3-TC T3'] = groupSumWithZeros(tmp['T3-TC T3']);
        //     tmp['Robot-TC T4'] = groupSumWithZeros(tmp['Robot-TC T4']);
        //     tmp['T5-TC T5'] = groupSumWithZeros(tmp['T5-TC T5']);
        //     tmp['Bổ sung-TC TBS'] = groupSumWithZeros(tmp['Bổ sung-TC TBS']);
        //     tmp['Mẫu-M3A-3B'] = groupSumWithZeros(tmp['Mẫu-M3A-3B']);
        //     tmp['Canh hàng-M1A'] = groupSumWithZeros(tmp['Canh hàng-M1A']);
        //     tmp['Pha màu-'] = groupSumWithZeros(tmp['Pha màu-']);
        //     tmp['Chụp khuôn-'] = groupSumWithZeros(tmp['Chụp khuôn-']);
        //     tmp['Kế hoạch-'] = groupSumWithZeros(tmp['Kế hoạch-']);
        //     tmp['Logo-'] = groupSumWithZeros(tmp['Logo-']);
        //     tmp['Bán hàng-'] = groupSumWithZeros(tmp['Bán hàng-']);
        //     tmp['Chất lượng-'] = groupSumWithZeros(tmp['Chất lượng-']);
        //     tmp['Kcs-'] = groupSumWithZeros(tmp['Kcs-']);
        //     tmp['Điều hành-'] = groupSumWithZeros(tmp['Điều hành-']);
        //     tmp['Ép-'] = groupSumWithZeros(tmp['Ép-']);
        //     tmp['Sửa hàng-'] = groupSumWithZeros(tmp['Sửa hàng-']);
        //     tmp['Vật tư-'] = groupSumWithZeros(tmp['Vật tư-']);
        //     tmp['IT - Bảo trì-'] = groupSumWithZeros(tmp['IT - Bảo trì-']);
        //     tmp['Văn phòng-'] = groupSumWithZeros(tmp['Văn phòng-']);

        //     tmp['T3-TC T3'] = sumFirstSixElements(tmp['T3-TC T3']);
        //     tmp['Robot-TC T4'] = sumFirstSixElements(tmp['Robot-TC T4']);
        //     tmp['T5-TC T5'] = sumFirstSixElements(tmp['T5-TC T5']);
        //     tmp['Bổ sung-TC TBS'] = sumFirstSixElements(tmp['Bổ sung-TC TBS']);
        //     tmp['Mẫu-M3A-3B'] = sumFirstSixElements(tmp['Mẫu-M3A-3B']);
        //     tmp['Canh hàng-M1A'] = sumFirstSixElements(tmp['Canh hàng-M1A']);
        //     tmp['Pha màu-'] = sumFirstSixElements(tmp['Pha màu-']);
        //     tmp['Chụp khuôn-'] = sumFirstSixElements(tmp['Chụp khuôn-']);
        //     tmp['Kế hoạch-'] = sumFirstSixElements(tmp['Kế hoạch-']);
        //     tmp['Logo-'] = sumFirstSixElements(tmp['Logo-']);
        //     tmp['Bán hàng-'] = sumFirstSixElements(tmp['Bán hàng-']);
        //     tmp['Chất lượng-'] = sumFirstSixElements(tmp['Chất lượng-']);
        //     tmp['Kcs-'] = sumFirstSixElements(tmp['Kcs-']);
        //     tmp['Điều hành-'] = sumFirstSixElements(tmp['Điều hành-']);
        //     tmp['Ép-'] = sumFirstSixElements(tmp['Ép-']);
        //     tmp['Sửa hàng-'] = sumFirstSixElements(tmp['Sửa hàng-']);
        //     tmp['Vật tư-'] = sumFirstSixElements(tmp['Vật tư-']);
        //     tmp['IT - Bảo trì-'] = sumFirstSixElements(tmp['IT - Bảo trì-']);
        //     tmp['Văn phòng-'] = sumFirstSixElements(tmp['Văn phòng-']);
        //     tmp['Tổng cộng-'] = sumFirstSixElements(tmp['Tổng cộng-']);
        //   }

        
          for (const key in tmp) {
            tmp[key] = sumEvery7(tmp[key]);
          }
          setReport(tmp);
          setReportTmp(tmp);

        }  
      } catch (error) {
        setLoading(false);
        console.error('Lỗi khi tải dữ liệu: ', error.message);
      }
    };

  const headers = [
    'BP/Tổ',
    'Ca Ngắn 1',
    'Ca Ngắn 2',
    'Ca Ngắn 3',
    'Ca Dài 1',
    'Ca Dài 2',
    'Ca Hành Chính',
    'Tổng',
  ];
  
  const headersDetail = [
    'BP/Tổ',
    'Chuyền',
    'Ca Ngắn 1',
    'Ca Ngắn 2',
    'Ca Ngắn 3',
    'Ca Dài 1',
    'Ca Dài 2',
    'Ca Hành Chính',
    'Tổng',
  ];


  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // Header dòng 1 (gồm colSpan và rowSpan)
    const headerRow1 = [
      'BP/Tổ',
        'Ca Ngắn 1',
        'Ca Ngắn 2',
        'Ca Ngắn 3',
        'Ca Dài 1',
        'Ca Dài 2',
        'Ca Hành Chính',
      'Tổng',
    ];
    const headerRow1DEtail = [
      'BP/Tổ',
      'Chuyền',
        'Ca Ngắn 1',
        'Ca Ngắn 2',
        'Ca Ngắn 3',
        'Ca Dài 1',
        'Ca Dài 2',
        'Ca Hành Chính',
      'Tổng',
    ];

    let dataExcel = [];

    if(selectedDepartment === '') {
      dataExcel = [
            ...data,
            { group: 'Tổng cộng', items: [''] },
      ]
    } else {
      dataExcel = [
            ...data,
      ]
    }

    // Dữ liệu bảng
    const rows = dataExcel.flatMap((d) =>
      d.items.map((item, idx) => {
        const key = `${d.group}-${item}`;
        const data = report[key];

        const values = data?.map((e) => (e === 0 ? '-' : e.toFixed(1)));

        if(selectedDepartment === '') {
          return [idx === 0 ? d.group === 'Robot' ? 'T4' : d.group === 'Bổ sung' ? 'T1' : d.group : '', ...values];
        } else {
          return [idx === 0 ? d.group === 'Robot' ? 'T4' : d.group === 'Bổ sung' ? 'T1' : d.group : '', item, ...values];
        }

      }),
    );

    const today = new Date().toLocaleDateString('vi-VN');
    const title = [
      `BẢNG THEO DÕI RÁC THẢI${selectedDepartment === 'T4|Robot' ? ' TỔ 4' : selectedDepartment === 'Bổ sung' ? ' TỔ 1' : ' ' + selectedDepartment.replace(/^T/, 'TỔ ')} THEO CA LÀM NGÀY ${
        filterType === 'one'
          ? formatDateToVNString1(dateOne)
          : `${formatDateToVNString1(startDate)} - ${formatDateToVNString1(endDate)}`
      }`,
    ];

    const wsData = [title, selectedDepartment === '' ? headerRow1 : headerRow1DEtail, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Gộp ô (colSpan và rowSpan) trong header
    ws['!merges'] = [

      // Merge dòng 51 (sau khi offset thêm 1 dòng thành 52)
      { s: { r: 54, c: 0 }, e: { r: 54, c: 1 } },
    ];

    if(selectedDepartment === 'Bổ sung') {
      ws['!merges'] = [
        { s: { r: 2, c: 0 }, e: { r: 4, c: 0 } },
      ];
    } else if(selectedDepartment === 'T3') {
      ws['!merges'] = [
        { s: { r: 2, c: 0 }, e: { r: 11, c: 0 } },
      ];
    } else if(selectedDepartment === 'T4|Robot') {
      ws['!merges'] = [
        { s: { r: 2, c: 0 }, e: { r: 17, c: 0 } },
      ];
    } else if(selectedDepartment === 'T5') {
      ws['!merges'] = [
        { s: { r: 2, c: 0 }, e: { r: 8, c: 0 } },
      ];
    }
    
    if(selectedDepartment === '') {
      ws['!merges'].unshift({
        s: { r: 0, c: 0 },
        e: { r: 0, c: 7 },
      });
    } else {
      ws['!merges'].unshift({
        s: { r: 0, c: 0 },
        e: { r: 0, c: 8 },
      });
    }
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

    for (let col = 0; col <= 65; col++) {
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
    for (let col = 0; col <= 65; col++) {
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
      `BẢNG THEO DÕI RÁC THẢI${selectedDepartment === 'T4|Robot' ? ' TỔ 4' : selectedDepartment === 'Bổ sung' ? ' TỔ 1' : ' ' + selectedDepartment.replace(/^T/, 'TỔ ')} THEO CA LÀM NGÀY ${
        filterType === 'one'
          ? formatDateToVNString1(dateOne)
          : `${formatDateToVNString1(startDate)} - ${formatDateToVNString1(endDate)}`
      }.xlsx`,
    );
  };


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
            onClick={exportToExcel}
            className="mb-4 px-4 py-0 text-[14px] bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Xuất Excel
          </button>

    {/* 👇 Chọn bộ phận */}
<div className="flex flex-col mb-3 min-w-[160px]">
  <label className="text-sm font-semibold mb-1">Chọn bộ phận</label>
  <select
    value={selectedDepartment}
    onChange={(e) => setSelectedDepartment(e.target.value)}
    className="px-3 py-1 bg-white border border-gray-300 text-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150"
  >
    <option value="">-- Tất cả --</option>
    <option value="Bổ sung">Tổ 1</option>
    <option value="T2">Tổ 2</option>
    <option value="T3">Tổ 3</option>
    <option value="T4|Robot">Tổ 4</option>
    <option value="T5">Tổ 5</option>
    <option value="Mẫu">Mẫu</option>
    <option value="Canh hàng">Canh Hàng</option>
    <option value="Pha màu">Pha Màu</option>
    <option value="Chụp khuôn">Chụp Khuôn</option>
    <option value="Kế hoạch">Kế Hoạch</option>
    <option value="Bán hàng">Bán Hàng</option>
    <option value="Chất lượng">Chất Lượng</option>
    <option value="Kcs">KCS</option>
    <option value="Điều hành">Điều Hành</option>
    <option value="Sửa hàng">Sửa Hàng</option>
    <option value="Vật tư">Vật Tư</option>
    <option value="IT - Bảo trì">IT - Bảo Trì</option>
    <option value="Văn phòng">Văn Phòng</option>
  </select>
</div>

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
                {selectedDepartment === '' ? headers.map((header, idx) => (
                      <th
                        key={idx}
                        className="border border-gray-400 px-2 py-1 text-center bg-gray-200"
                      >
                        {header}
                      </th>
                    )) : 
                    headersDetail.map((header, idx) => (
                      <th
                        key={idx}
                        className="border border-gray-400 px-2 py-1 text-center bg-gray-200"
                      >
                        {header}
                      </th>
                    ))
                  }
              </tr>
            </thead>
            <tbody>
              {data?.map((group, idx) =>
                    group?.items?.map((item, iidx) => (
                      <tr
                        className={`${
                              selectedDepartment === 'Bổ sung' && iidx === 2 ? 'bg-[#cfb8b8]' :
                              selectedDepartment === 'T3' && iidx === 9 ? 'bg-[#cfb8b8]' :
                              selectedDepartment === 'T4|Robot' && idx === 2 && iidx === 4 ? 'bg-[#cfb8b8]' :
                              selectedDepartment === 'T5' && iidx === 6 ? 'bg-[#cfb8b8]' : ''
                        }`}
                        key={`${idx}-${iidx}`}
                      >
                        {iidx === 0 && (
                          <td
                            rowSpan={
                              selectedDepartment === 'Bổ sung' ? 3 :
                              selectedDepartment === 'T3' ? 10 :
                              selectedDepartment === 'T4|Robot' && idx === 0 ? 6 :
                              selectedDepartment === 'T4|Robot' && idx === 1 ? 5 :
                              selectedDepartment === 'T4|Robot' && idx === 2 ? 5 :
                              selectedDepartment === 'T5' ? 7 : 1
                            }
                            className="border border-gray-300 px-2 py-1"
                          >
                            {selectedDepartment === '' && group.group === 'Robot' ? 'T4' : group.group === 'Bổ sung' ? 'T1' : group.group}
                          </td>
                        )}
                        {
                          selectedDepartment !== "" &&
                        <td className={`border border-gray-300 px-2 py-1 ${idx === 21 && 'font-[600]'}`}>{item}</td>
                        }
                        {report[`${group.group}-${item}`]?.map((e, i) => (
                          <td
                            key={i}
                            className={`border border-gray-300 text-center px-2 py-1 ${i === 63 && 'font-[600]'}`}
                            onDoubleClick={() => {
                              
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
                                  onClick={() => {}}
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
                    ))
                  )}
              {
                selectedDepartment === "" &&
                <tr className="bg-[#9e8f8f]">
                  <td
                    className="border border-gray-400 text-center px-2 py-1 font-bold"
                    colSpan={1}
                  >
                    Tổng cộng
                  </td>
                  {report['Tổng cộng-']?.map(
                    (e, i) =>
                      <td
                          key={i}
                          className="border border-gray-400 text-center font-bold px-2 py-1"
                        >
                          {e === 0 ? '-' : parseFloat(e?.toFixed(1))}
                        </td>
                  )}
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
};

export default ReportByShift;
