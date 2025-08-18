import 'react-datepicker/dist/react-datepicker.css';
import React, { useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import { vi } from 'date-fns/locale';
import { BASE_URL } from '~/config/index';
import { FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';
import HandleGetCodeQr from '~/components/HandleGetCodeQR';
import { useSelector } from 'react-redux';
import { userSelector } from '~/redux/selectors';
import http from '~/api/http';

// ---------- UI helpers ----------
const cx = (...cls) => cls.filter(Boolean).join(' ');
const Card = ({ className = '', children }) => (
  <div className={cx('bg-white/80 backdrop-blur rounded-2xl border border-slate-200 shadow-sm', className)}>
    {children}
  </div>
);
const SectionTitle = ({ children }) => (
  <div className="rounded-2xl border border-emerald-200/40 bg-gradient-to-r from-emerald-50 to-cyan-50 p-4 md:p-5 shadow-sm">
    <h2 className="text-lg md:text-xl font-bold text-slate-800">{children}</h2>
  </div>
);

const ReportTrash = () => {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState([]);
  const [reportTmp, setReportTmp] = useState([]);

  const [filterType, setFilterType] = useState('one'); // 'one' or 'range'
  const [statusUpdate, setStatusUpdate] = useState(false);
  const [selectInput, setSelectInput] = useState({ group: '', item: '' });
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
  const [isRacDiXuLy, setIsRacDiXuLy] = useState(false);

  const [dataTmp, setDataTmp] = useState([
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
  ]);

  const [data, setData] = useState([
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
    const vnOffset = 7 * 60;
    const localTime = new Date(date.getTime() + vnOffset * 60 * 1000);
    return localTime.toISOString().slice(0, 10);
  }
  function formatDateToVNString1(date) {
    const vnOffset = 7 * 60;
    const utc = date.getTime() + date.getTimezoneOffset() * 60000;
    const vnTime = new Date(utc + vnOffset * 60000);
    const day = String(vnTime.getDate()).padStart(2, '0');
    const month = String(vnTime.getMonth() + 1).padStart(2, '0');
    const year = vnTime.getFullYear();
    return `${day}/${month}/${year}`;
  }
  function formatDateToVNString2(date) {
    const vnOffset = 7 * 60;
    const utc = date.getTime() + date.getTimezoneOffset() * 60000;
    const vnTime = new Date(utc + vnOffset * 60000);
    const day = String(vnTime.getDate()).padStart(2, '0');
    const month = String(vnTime.getMonth() + 1).padStart(2, '0');
    const year = vnTime.getFullYear();
    return `${day}-${month}-${year}`;
  }

  function sumFirstSixElements(arr) {
    const sum = arr.slice(0, 56).reduce((total, val) => total + val, 0);
    const newArr = [...arr];
    newArr.splice(56, 0, sum, 0, 0, 0, 0, 0, 0);
    return newArr;
  }

  function sumEvery7(arr) {
    const result = [];
    for (let i = 0; i < arr.length; i += 7) {
      let sum = 0;
      for (let j = i; j < i + 7; j++) {
        if (i !== arr.length - 1) sum += arr[j];
      }
      result.push(sum);
    }
    result.push(arr[arr.length - 1]);
    result.splice(8, 2);
    return result;
  }

  useEffect(() => {
    fetchTodayReport();
  }, [dateOne, startDate, endDate, filterType]);

  useEffect(() => {
    if (isRacDiXuLy === true) {
      const dataTC = reportTmp['Tổng cộng-'].filter((_, index) => ![2, 7, 8].includes(index));
      const sum = dataTC.reduce((total, num) => total + num, 0);
      dataTC.push(sum);
      setReport({ 'Tổng cộng-': dataTC });
      return;
    }

    const prefixes = selectedDepartment.includes('|') ? selectedDepartment.split('|') : [selectedDepartment];
    const filtered = Object.entries(reportTmp)
      .filter(([key]) => prefixes.some((prefixe) => key.startsWith(prefixe)))
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});
    setReport(filtered);

    if (selectedDepartment === '') {
      setData(dataTmp);
    } else {
      const selected = dataTmp.filter((item) => item.group === selectedDepartment);
      setData(selected);
      if (selectedDepartment === 'T3') {
        setData([{ group: 'T3', items: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'RC T3', 'TC T3'] }]);
      } else if (selectedDepartment === 'Bổ sung') {
        setData([{ group: 'Bổ sung', items: ['M1B', 'M2A-2B', 'TC TBS'] }]);
      } else if (selectedDepartment === 'T2') {
        setData([{ group: 'T2', items: [''] }]);
      } else if (selectedDepartment === 'T4|Robot') {
        setData([
          { group: 'T4A', items: ['M4A-4B', 'M5A-5B', 'M6A-6B', 'M7A-7B', 'M8A-8B', 'M9A-9B'] },
          { group: 'T4B', items: ['M10A', 'M11A', 'M12A', 'M13A', 'M14A'] },
          { group: 'Robot', items: ['MRB1', 'MRB2', 'MRB3', 'RC T4', 'TC T4'] },
        ]);
      } else if (selectedDepartment === 'T5') {
        setData([{ group: 'T5', items: ['M10B', 'M11B', 'M12B', 'M13B', 'M14B', 'RC T5', 'TC T5'] }]);
      }
    }
  }, [selectedDepartment, isRacDiXuLy]);

  const fetchTodayReport = async () => {
    setLoading(true);
    try {
      const res = await http.get(`${BASE_URL}/api/statistics/weight-by-unit`, {
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
          ['Robot-RC T4']: res.data.data.find((entry) => entry.u === 'Rác thải chung' && entry.d === 'Tổ 4')?.value || [
            ...Array(64).fill(0),
          ],
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
          ['Bổ sung-M2A-2B']: res.data.data.find((entry) => entry.u === 'Chuyền 2A-2B')?.value || [...Array(64).fill(0)],
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
          ['IT - Bảo trì-']: res.data.data.find((entry) => entry.d === 'IT - Bảo trì')?.value || [...Array(64).fill(0)],
          ['Văn phòng-']: res.data.data.find((entry) => entry.d === 'Văn phòng')?.value || [...Array(64).fill(0)],
          ['-Cộng']: res.data.data.find((entry) => entry.u === 'Chuyền 8')?.value || [...Array(64).fill(0)],
          ['Tổng cộng-']: res.data.data.find((entry) => entry.u === 'Chuyền 8')?.value || [...Array(64).fill(0)],
        };

        tmp['T2-'] = sumArrays(tmp['Logo-'], tmp['Ép-']);
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

        tmp['Tổng cộng-'] = sumArrays(tmp['T3-TC T3'], tmp['Robot-TC T4'], tmp['T5-TC T5'], tmp['Bổ sung-TC TBS'], tmp['-Cộng']);

        console.log(tmp);

        for (const key in tmp) tmp[key] = sumEvery7(tmp[key]);
        setReportTmp(tmp);

        if (isRacDiXuLy === true) {
          const dataTC = tmp['Tổng cộng-'].filter((_, index) => ![2, 7, 8].includes(index));
          const sum = dataTC.reduce((total, num) => total + num, 0);
          dataTC.push(sum);
          setReport({ 'Tổng cộng-': dataTC });
          return;
        } else {
          setReport(tmp);
        }
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu: ', error.message);
    } finally {
      setLoading(false);
    }
  };

  const headersDetail = [
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

  const headersDetailRXL = [
    'Giẻ lau dính mực thường',
    'Giẻ lau dính mực lapa',
    'Keo bàn thải',
    'Mực in thải',
    'Mực in lapa thải',
    'Vụn logo',
    'Tổng',
  ];

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    const headerRow1DEtail = [
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

    let dataExcel = selectedDepartment === '' ? [...data, { group: 'Tổng cộng', items: [''] }] : [...data];

    const rows = dataExcel.flatMap((d) =>
      d.items.map((item, idx) => {
        const key = `${d.group}-${item}`;
        const data = report[key];
        const values = data?.map((e) => (e === 0 ? '-' : round1(e).toFixed(1)));
        return [idx === 0 ? (d.group === 'T4A' && selectedDepartment !== '' ? 'T4' : d.group === 'Bổ sung' ? 'T1' : d.group) : '', item, ...values];
      }),
    );

    const title = [
      `BẢNG THEO DÕI RÁC THẢI${
        selectedDepartment === 'T4|Robot' ? ' TỔ 4' : selectedDepartment === 'Bổ sung' ? ' TỔ 1' : ' ' + selectedDepartment.replace(/^T/, 'TỔ ')
      } THEO LOẠI RÁC NGÀY ${
        filterType === 'one' ? formatDateToVNString1(dateOne) : `${formatDateToVNString1(startDate)} - ${formatDateToVNString1(endDate)}`
      }`,
    ];

    const wsData = [title, headerRow1DEtail, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    if (selectedDepartment === 'Bổ sung') {
      ws['!merges'] = [{ s: { r: 2, c: 0 }, e: { r: 4, c: 0 } }];
    } else if (selectedDepartment === 'T3') {
      ws['!merges'] = [{ s: { r: 2, c: 0 }, e: { r: 11, c: 0 } }];
    } else if (selectedDepartment === 'T4|Robot') {
      ws['!merges'] = [{ s: { r: 2, c: 0 }, e: { r: 17, c: 0 } }];
    } else if (selectedDepartment === 'T5') {
      ws['!merges'] = [{ s: { r: 2, c: 0 }, e: { r: 8, c: 0 } }];
    } else if (selectedDepartment === '') {
      ws['!merges'] = [
        { s: { r: 2, c: 0 }, e: { r: 4, c: 0 } },
        { s: { r: 6, c: 0 }, e: { r: 15, c: 0 } },
        { s: { r: 16, c: 0 }, e: { r: 21, c: 0 } },
        { s: { r: 22, c: 0 }, e: { r: 26, c: 0 } },
        { s: { r: 27, c: 0 }, e: { r: 31, c: 0 } },
        { s: { r: 32, c: 0 }, e: { r: 38, c: 0 } },
        { s: { r: 45, c: 0 }, e: { r: 45, c: 1 } },
      ];
    }
    ws['!merges'].unshift({ s: { r: 0, c: 0 }, e: { r: 0, c: 10 } });

    const titleCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
    ws[titleCell].s = { alignment: { horizontal: 'center', vertical: 'center' }, font: { bold: true, sz: 16, color: { rgb: '000000' } } };

    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[addr]) continue;
        ws[addr].s = {
          border: { top: { style: 'thin', color: { rgb: '000000' } }, bottom: { style: 'thin', color: { rgb: '000000' } }, left: { style: 'thin', color: { rgb: '000000' } }, right: { style: 'thin', color: { rgb: '000000' } } },
          alignment: { vertical: 'center', horizontal: 'center', wrapText: true },
        };
      }
    }

    if (selectedDepartment === '') {
      [4, 15, 31, 38].forEach((row) => {
        for (let col = 0; col <= 8; col++) {
          const addr = XLSX.utils.encode_cell({ r: row, c: col });
          if (!ws[addr]) continue;
          ws[addr].s = { ...ws[addr].s, fill: { fgColor: { rgb: 'cfb8b8' } }, font: { bold: true, color: { rgb: '000000' } } };
        }
      });
    }

    for (let col = 0; col <= 65; col++) {
      const addr = XLSX.utils.encode_cell({ r: 1, c: col });
      if (!ws[addr]) continue;
      ws[addr].s = { ...ws[addr].s, fill: { fgColor: { rgb: 'e5e7eb' } }, font: { bold: true, color: { rgb: '000000' } } };
    }

    const lastRowIndex = wsData.length - 1;
    for (let col = 0; col <= 65; col++) {
      const addr = XLSX.utils.encode_cell({ r: lastRowIndex, c: col });
      if (!ws[addr]) continue;
      ws[addr].s = { ...ws[addr].s, fill: { fgColor: { rgb: 'FFF3CD' } }, font: { bold: true, color: { rgb: '000000' } } };
    }

    XLSX.utils.book_append_sheet(
      wb,
      ws,
      `${filterType === 'one' ? formatDateToVNString2(dateOne) : `${formatDateToVNString2(startDate)} - ${formatDateToVNString2(endDate)}`}`,
    );

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(
      new Blob([wbout], { type: 'application/octet-stream' }),
      `BẢNG THEO DÕI RÁC THẢI${
        selectedDepartment === 'T4|Robot' ? ' TỔ 4' : selectedDepartment === 'Bổ sung' ? ' TỔ 1' : ' ' + selectedDepartment.replace(/^T/, 'TỔ ')
      } THEO LOẠI RÁC NGÀY ${filterType === 'one' ? formatDateToVNString1(dateOne) : `${formatDateToVNString1(startDate)} - ${formatDateToVNString1(endDate)}`}.xlsx`,
    );
  };

  function round1(num) {
  return Math.round(num * 10) / 10;
}

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 p-2 md:p-4">
      {loading && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-white/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <FaSpinner className="animate-spin text-emerald-600 text-4xl" />
            <span className="text-slate-700 text-sm">Đang tải dữ liệu...</span>
          </div>
        </div>
      )}

      <div className="space-y-4 md:space-y-6">
        <SectionTitle>🗑️ Báo cáo theo loại rác</SectionTitle>

        {/* Toolbar */}
        <Card className="p-4 md:p-5">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                disabled={isRacDiXuLy}
                onClick={exportToExcel}
                className={cx(
                  'px-4 py-2 text-sm rounded-lg text-white shadow-sm active:scale-[.98]',
                  'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                )}
              >
                📤 Xuất Excel
              </button>

              {/* Segment 1 ngày / nhiều ngày */}
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

            {/* Filters */}
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[180px]">
                <label className="block text-xs text-slate-500 mb-1">Chọn bộ phận</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Tất cả --</option>
                  <option value="Bổ sung">Tổ 1</option>
                  <option value="T2">Tổ 2</option>
                  <option value="T3">Tổ 3</option>
                  <option value="T4|Robot">Tổ 4</option>
                  <option value="T5">Tổ 5</option>
                  <option value="Mẫu">Mẫu</option>
                  <option value="Canh hàng">Canh Hàng</option>
                  <option value="Chụp khuôn">Chụp Khuôn</option>
                  <option value="Kcs">KCS</option>
                  <option value="Sửa hàng">Sửa Hàng</option>
                  <option value="Pha màu">Pha Màu</option>
                </select>
              </div>

              {/* Switch: Rác đi xử lý */}
              <label className="inline-flex items-center gap-3 cursor-pointer select-none mt-1">
  <input
    type="checkbox"
    checked={isRacDiXuLy}
    onChange={(e) => setIsRacDiXuLy(e.target.checked)}
    className="peer sr-only"
  />
  {/* Track */}
  <span
    className="
      relative h-6 w-11 rounded-full bg-slate-300 transition-colors
      peer-checked:bg-emerald-600

      /* Nút tròn bằng ::after */
      after:absolute after:content-[''] after:top-0.5 after:left-0.5
      after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm
      after:transition-transform

      /* Khi checked → đẩy nút sang phải */
      peer-checked:after:translate-x-5
    "
  />
  <span className="text-sm text-slate-700">Rác đi xử lý</span>
</label>


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
                    popperClassName="!z-[9999]"     // Tailwind z-index
                    portalId="react-datepicker-portal" // Render ra portal → không bị cut
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
                    popperClassName="!z-[9999]"     // Tailwind z-index
                    portalId="react-datepicker-portal" // Render ra portal → không bị cut
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
                    popperClassName="!z-[9999]"     // Tailwind z-index
                    portalId="react-datepicker-portal" // Render ra portal → không bị cut
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Table */}
        <Card className="overflow-hidden">
          <div className="overflow-auto">
            <table className="min-w-full text-sm text-slate-700">
              <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-sm border-b border-slate-200">
                <tr>
                  {(!isRacDiXuLy ? headersDetail : headersDetailRXL).map((header, idx) => (
                    <th key={idx} className="px-2 md:px-3 py-2 text-center font-semibold text-slate-700">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {data?.map((group, idx) =>
                  group?.items?.map((item, iidx) => {
                    const highlight =
                      (selectedDepartment !== '' &&
                        ((selectedDepartment === 'Bổ sung' && iidx === 2) ||
                          (selectedDepartment === 'T3' && iidx === 9) ||
                          (selectedDepartment === 'T4|Robot' && idx === 2 && iidx === 4) ||
                          (selectedDepartment === 'T5' && iidx === 6))) ||
                      (selectedDepartment === '' &&
                        ((idx === 0 && iidx === 2) || (idx === 2 && iidx === 9) || (idx === 5 && iidx === 4) || (idx === 6 && iidx === 6)));

                    return (
                      <tr key={`${idx}-${iidx}`} className={cx(highlight ? 'bg-amber-50' : 'hover:bg-slate-50 odd:bg-white even:bg-slate-50/60', 'transition')}>
                        {!isRacDiXuLy && iidx === 0 && (
                          <td
                            rowSpan={
                              selectedDepartment !== ''
                                ? selectedDepartment === 'Bổ sung'
                                  ? 3
                                  : selectedDepartment === 'T3'
                                  ? 10
                                  : selectedDepartment === 'T4|Robot' && idx === 0
                                  ? 6
                                  : selectedDepartment === 'T4|Robot' && idx === 1
                                  ? 5
                                  : selectedDepartment === 'T4|Robot' && idx === 2
                                  ? 5
                                  : selectedDepartment === 'T5'
                                  ? 7
                                  : 1
                                : idx === 0
                                ? 3
                                : idx === 2
                                ? 10
                                : idx === 3
                                ? 6
                                : idx === 4
                                ? 5
                                : idx === 5
                                ? 5
                                : idx === 6
                                ? 7
                                : 1
                            }
                            className="px-2 md:px-3 py-2 text-center font-medium text-slate-800 border-r border-slate-100"
                          >
                            {group.group === 'Bổ sung' ? 'T1' : group.group}
                          </td>
                        )}

                        {!isRacDiXuLy && <td className="px-2 md:px-3 py-2 text-center">{item}</td>}

                        {report[`${group.group}-${item}`]?.map((e, i) => (
                          <td
                            key={i}
                            className={cx('px-2 md:px-3 py-2 text-center', i === 63 ? 'font-semibold text-slate-900' : 'text-slate-700')}
                            onDoubleClick={() => {
                              // Inline edit hook (nếu cần bật tính năng sửa nhanh)
                              // setStatusUpdate(true); setSelectInput({ group: group.group, item, index: i }); setValue(e); setTimeout(()=>inputRef.current?.focus(),0);
                            }}
                          >
                            {user?.roleEditReport &&
                            statusUpdate &&
                            filterType === 'one' &&
                            selectInput.group === group.group &&
                            selectInput.item === item &&
                            selectInput.index === i ? (
                              <div className="flex items-center justify-center gap-2">
                                <input
                                  ref={inputRef}
                                  className="w-20 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                  type="text"
                                  value={value}
                                  onChange={(ev) => setValue(ev.target.value)}
                                />
                                <button className="text-emerald-600 hover:text-emerald-700" onClick={() => {}} title="Lưu">
                                  <FaCheck className="h-4 w-4" />
                                </button>
                                <button
                                  className="text-rose-600 hover:text-rose-700"
                                  onClick={() => {
                                    setStatusUpdate(false);
                                    setSelectInput({ group: '', item: '', index: '' });
                                    setValue(0);
                                  }}
                                  title="Hủy"
                                >
                                  <FaTimes className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <span>{e === 0 ? '-' : parseFloat(round1(e)?.toFixed(1))}</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  }),
                )}

                {selectedDepartment === '' && (
                  <tr className={cx(isRacDiXuLy ? 'bg-slate-100' : 'bg-emerald-50 border-t border-emerald-200')}>
                    {!isRacDiXuLy && (
                      <td className="px-2 md:px-3 py-2 text-center font-bold text-emerald-800" colSpan={2}>
                        Tổng cộng
                      </td>
                    )}
                    {report['Tổng cộng-']?.map((e, i) => (
                      <td key={i} className="px-2 md:px-3 py-2 text-center font-bold text-emerald-900">
                        {e === 0 ? '-' : parseFloat(round1(e)?.toFixed(1))}
                      </td>
                    ))}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ReportTrash;
