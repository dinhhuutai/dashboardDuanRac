import 'react-datepicker/dist/react-datepicker.css';
import React, { useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import { vi } from 'date-fns/locale';
import { BASE_URL } from '~/config/index';
import { FaCheck, FaTimes } from "react-icons/fa";
import { useSelector } from 'react-redux';
import { userSelector } from '~/redux/selectors';
import { FaSpinner } from 'react-icons/fa';

const NgienCheChou = () => {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState([]);
  const [reportByMonth, setReportByMonth] = useState([]);


  const [dateOne, setDateOne] = useState(new Date());
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const [data1, setData1] = useState(0);
  const [data2, setData2] = useState(0);
  const [data3, setData3] = useState(0);
  const [data4, setData4] = useState(0);

  const [dayWork, setDayWork] = useState(1);

  const [max1, setMax1] = useState('');
  const [max2, setMax2] = useState('');
  const [max3, setMax3] = useState('');
  
  const [maxMonth1, setMaxMonth1] = useState('');
  const [maxMonth2, setMaxMonth2] = useState('');
  const [maxMonth3, setMaxMonth3] = useState('');
  
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

  function sumEvery7(arr) {
    const result = [];

    for (let i = 0; i < arr.length; i += 7) {
        let sum = 0;
        for (let j = i; j < i + 7; j++) {
            if(i !== arr.length - 1) {
                sum += arr[j];
            }
        }
        result.push(sum);
    }

    result.push(arr[arr.length - 1]);
    result.splice(8, 2);
    return result;
}

  useEffect(() => {
    // Gọi lần lượt từng API
    fetchTodayReport();

    fetchByMonthReport();

  }, [dateOne]);

  useEffect(() => {
          setData3((Number(data1) / Number(dayWork)).toFixed(2));
          setData4((Number(data2) / Number(dayWork)).toFixed(2));
  }, [dayWork])
  
    const fetchTodayReport = async () => {

      setLoading(true);
      try {
        const res = await axios.get(`${BASE_URL}/api/statistics/weight-by-unit`, {
          params: {
            startDate: formatDateToVNString(dateOne),
            endDate: formatDateToVNString(dateOne),
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
        
          for (const key in tmp) {
            tmp[key] = sumEvery7(tmp[key]);
          }

          
          const [top1, top2, top3] = getTop3Keys(tmp);
          setMax1(top1);
          setMax2(top2);
          setMax3(top3);

          setReport(tmp);

        }  
      } catch (error) {
        setLoading(false);
        console.error('Lỗi khi tải dữ liệu: ', error.message);
      } finally {
        setLoading(false);
      }
    };


    const fetchByMonthReport = async () => {

      setLoading(true);
      try {
        let start, end;

    const selectedDate = new Date(dateOne);
    start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1); // ngày đầu tháng
    end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0); // ngày cuối tháng

    setStartDate(start);
    setEndDate(end);

        const res = await axios.get(`${BASE_URL}/api/statistics/weight-by-unit`, {
          params: {
            startDate: formatDateToVNString(start),
            endDate: formatDateToVNString(end),
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

        
          for (const key in tmp) {
            tmp[key] = sumEvery7(tmp[key]);
          }
        
          setData1(Number(tmp['Tổng cộng-'][8]).toFixed(1));
          setData2((Number(tmp['Tổng cộng-'][8]) - Number(tmp['Tổng cộng-'][3])).toFixed(1));
          setData3((Number(tmp['Tổng cộng-'][8]) / Number(dayWork)).toFixed(2));
          setData4(((Number(tmp['Tổng cộng-'][8]) - Number(tmp['Tổng cộng-'][3])) / Number(dayWork)).toFixed(2));

          const [top1, top2, top3] = getTop3Keys(tmp);
          setMaxMonth1(top1);
          setMaxMonth2(top2);
          setMaxMonth3(top3);

          setReportByMonth(tmp);

        }  
      } catch (error) {
        setLoading(false);
        console.error('Lỗi khi tải dữ liệu: ', error.message);
      } finally {
        setLoading(false);
      }
    };

    function getTop3Keys(reportByMonth) {
  // Bỏ qua "Tổng cộng-", tạo mảng [key, total]
  const entries = Object.entries(reportByMonth)
    .filter(([key]) => key !== "Tổng cộng-" && key !== "-Cộng" && key !== 'Bổ sung-M1B'
 && key !== 'Bổ sung-M2A-2B' && key !== 'Logo-' && key !== 'Ép-'
 && key !== 'T3-M3' && key !== 'T3-M4' && key !== 'T3-M5'
 && key !== 'T3-M6' && key !== 'T3-M7' && key !== 'T3-M8'
 && key !== 'T3-RC T3' && key !== 'T4A-M4A-4B' && key !== 'T4A-M5A-5B'
 && key !== 'T4A-M6A-6B' && key !== 'T4A-M7A-7B' && key !== 'T4A-M8A-8B'
 && key !== 'T4A-M9A-9B' && key !== 'T4B-M10A' && key !== 'T4B-M11A'
 && key !== 'T4B-M12A' && key !== 'T4B-M13A' && key !== 'T4B-M14A'
 && key !== 'Robot-MRB1' && key !== 'Robot-MRB2' && key !== 'Robot-MRB3'
 && key !== 'Robot-RC T4' && key !== 'T5-M10B' && key !== 'T5-M11B'
 && key !== 'T5-M12B' && key !== 'T5-M13B' && key !== 'T5-M14B'
 && key !== 'T5-RC T5' && key !== 'T3-M2')
    .map(([key, values]) => [key, values?.[values.length - 1] ?? 0]);

  // Sắp xếp theo tổng giảm dần
  const sorted = entries.sort((a, b) => b[1] - a[1]);

  // Lấy top 3
  const top3 = sorted.slice(0, 3);

  // Trả về chỉ tên tổ (key)
  return top3.map(([key]) => key);
}

  
  const headersDetail = [
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


  const exportToExcel = () => {
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

    let dataExcel = [
            ...data,
            { group: 'Tổng cộng', items: [''] },
      ];

    // Dữ liệu bảng
    const rows = dataExcel.flatMap((d) =>
      d.items.map((item, idx) => {
        const key = `${d.group}-${item}`;
        const data = report[key];

        const values = data?.map((e) => (e === 0 ? '-' : e.toFixed(1)));
        
        return [idx === 0 ? d.group === 'T4A' ? 'T4' : d.group === 'Bổ sung' ? 'T1' : d.group : '', item, ...values];

      }),
    );

    const today = new Date().toLocaleDateString('vi-VN');
    const title = [
      `BẢNG THEO DÕI RÁC THẢI THEO LOẠI RÁC NGÀY
        ${formatDateToVNString1(startDate)} - ${formatDateToVNString1(endDate)}
      `,
    ];

    const wsData = [title, headerRow1DEtail, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    
      ws['!merges'].unshift({
        s: { r: 0, c: 0 },
        e: { r: 0, c: 10 },
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
    
          for (let col = 0; col <= 8; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: 4, c: col });
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
            for (let col = 0; col <= 8; col++) {
              const cellAddress = XLSX.utils.encode_cell({ r: 15, c: col });
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
            for (let col = 0; col <= 8; col++) {
              const cellAddress = XLSX.utils.encode_cell({ r: 31, c: col });
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
            for (let col = 0; col <= 8; col++) {
              const cellAddress = XLSX.utils.encode_cell({ r: 38, c: col });
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
      `
        ${formatDateToVNString2(startDate)} - ${formatDateToVNString2(endDate)}
      `,
    );

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(
      new Blob([wbout], { type: 'application/octet-stream' }),
      `BẢNG THEO DÕI RÁC THẢI THEO LOẠI RÁC NGÀY ${formatDateToVNString1(startDate)} - ${formatDateToVNString1(endDate)}
      .xlsx`,
    );
  };


  return (
    <div className="p-2">
      
{loading && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm">
    <div className="flex flex-col items-center gap-4">
      <FaSpinner className="animate-spin text-blue-600 text-5xl" />
      <span className="text-gray-700 text-lg font-medium">Đang tải dữ liệu...</span>
    </div>
  </div>
)}
      <div className="p-2 space-y-6 bg-white rounded-[6px]">

      <div className="p-4">
        <div className="flex justify-between">
          <button
            disabled={true}
            onClick={exportToExcel}
            className="mb-4 px-4 text-[14px] bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Xuất Excel
          </button>

          <div className="flex gap-[10px]">
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
          </div>
          
    <div className="mb-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Số ngày làm việc
      </label>
      <input
        type="text"
        value={dayWork}
        onChange={(e) => setDayWork(e.target.value)}
        className="border px-2 py-1 rounded w-[120px] focus:outline-none focus:ring focus:border-blue-400"
      />
    </div>
        </div>

<div class="bg-white p-4 rounded mx-auto mt-[10px]">
  <h2 class="text-center text-lg font-bold text-[#003366] mb-4">
    {`BẢNG THEO DÕI RÁC THẢI CHI TIẾT NGÀY ${formatDateToVNString1(startDate)} - ${formatDateToVNString1(endDate)}`}
  </h2>

  <div class="grid-cols-2 gap-10 text-sm flex justify-center">
    <div className="space-y-2 w-[450px]">
  <div className="flex items-center">
    <span className="text-center bg-[#003366] text-white px-2 py-1 rounded-l text-sm font-semibold w-3/4">
      Tổng Rác thải
    </span>
    <span className="text-center bg-[#fff2cc] text-[#003366] px-4 py-1 rounded-r font-bold w-1/4">
      {`${data1}`}
    </span>
  </div>
  <div className="flex items-center">
    <span className="text-center bg-[#003366] text-white px-2 py-1 rounded-l text-sm font-semibold w-3/4">
      Tổng Rác thải (không tính keo bàn)
    </span>
    <span className="text-center bg-[#fff2cc] text-[#003366] px-4 py-1 rounded-r font-bold w-1/4">
      {`${data2}`}
    </span>
  </div>
</div>


    <div className="space-y-2 w-[450px]">
  <div className="flex items-center">
    <span className="text-center bg-[#003366] text-white px-2 py-1 rounded-l text-sm font-semibold w-3/4">
      Rác thải trung bình ngày
    </span>
    <span className="text-center bg-[#fff2cc] text-[#003366] px-4 py-1 rounded-r font-bold w-1/4">
      {`${data3}`}
    </span>
  </div>
  <div className="flex items-center">
    <span className="text-center bg-[#003366] text-white px-2 py-1 rounded-l text-sm font-semibold w-3/4">
      Rác thải trung bình ngày (không tính keo bàn)
    </span>
    <span className="text-center bg-[#fff2cc] text-[#003366] px-4 py-1 rounded-r font-bold w-1/4">
      {`${data4}`}
    </span>
  </div>
</div>

  </div>
</div>


        <div className="overflow-auto mt-[6px]  rounded-lg">
          <table className="min-w-full border border-collapse border-gray-400 text-sm">
            <thead>
              <tr>
                {headersDetail.map((header, idx) => (
                      <th
                        key={idx}
                        className="border border-gray-400 px-2 py-1 text-[#fff] text-[14px] font-[450] text-center bg-[#003366]"
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
                        className={{}}
                        key={`${idx}-${iidx}`}
                      >
                        {iidx === 0 && (
                          <td
                            
                            className={`border text-center border-gray-300 px-2 py-1 ${`${group.group}-${item}` === maxMonth1 ? 'bg-[#FFD966] font-[500]' : `${group.group}-${item}` === maxMonth2 ? 'bg-[#FFE599] font-[450]' : `${group.group}-${item}` === maxMonth3 ? 'bg-[#FFF2CC] font-[400]' : ''}`}
                          >
                            {group.group === 'Bổ sung' ? 'Tổ 1' : group.group === 'Robot' ? 'Tổ 4' : group.group.replace("T", "Tổ ")}
                          </td>
                        )}
                        {reportByMonth[`${group.group}-${item}`]?.map((e, i) => (
                          <td
                            key={i}
                            className={`border text-center border-gray-300 px-2 py-1 ${`${group.group}-${item}` === maxMonth1 ? 'bg-[#FFD966] font-[500]' : `${group.group}-${item}` === maxMonth2 ? 'bg-[#FFE599] font-[450]' : `${group.group}-${item}` === maxMonth3 ? 'bg-[#FFF2CC] font-[400]' : ''}`}
                            onDoubleClick={() => {
                              
                            }}
                          >
                            {
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
                <tr className="bg-[#FFF2CC]">
                  <td
                    className="border border-gray-400 text-center px-2 py-1 font-bold"
                    colSpan={1}
                  >
                    Tổng cộng
                  </td>
                  {reportByMonth['Tổng cộng-']?.map(
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

        
        
<div class="bg-white p-4 rounded mx-auto mt-[50px]">
  <h2 class="text-center text-lg font-bold text-[#003366]">
    {`BẢNG THEO DÕI RÁC THẢI THEO LOẠI RÁC NGÀY ${formatDateToVNString1(dateOne)}`}
  </h2>
</div>
        <div className="overflow-auto rounded-lg">
          <table className="min-w-full border border-collapse border-gray-400 text-sm">
            <thead>
              <tr>
                {headersDetail.map((header, idx) => (
                      <th
                        key={idx}
                        className="border border-gray-400 px-2 py-1 text-[#fff] text-[14px] font-[450] text-center bg-[#003366]"
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
                        className={{}}
                        key={`${idx}-${iidx}`}
                      >
                        {iidx === 0 && (
                          <td
                            
                            className={`border border-gray-300 px-2 py-1 text-center ${`${group.group}-${item}` === max1 ? 'bg-[#FFD966] font-[500]' : `${group.group}-${item}` === max2 ? 'bg-[#FFE599] font-[450]' : `${group.group}-${item}` === max3 ? 'bg-[#FFF2CC] font-[400]' : ''}`}
                          >
                            {group.group === 'Bổ sung' ? 'Tổ 1' : group.group === 'Robot' ? 'Tổ 4' : group.group.replace("T", "Tổ ")}
                          </td>
                        )}
                        {report[`${group.group}-${item}`]?.map((e, i) => (
                          <td
                            key={i}
                            className={`border border-gray-300 px-2 py-1 text-center ${`${group.group}-${item}` === max1 ? 'bg-[#FFD966] font-[500]' : `${group.group}-${item}` === max2 ? 'bg-[#FFE599] font-[450]' : `${group.group}-${item}` === max3 ? 'bg-[#FFF2CC] font-[400]' : ''}`}
                            onDoubleClick={() => {
                              
                            }}
                          >
                            {
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
                <tr className="bg-[#FFF2CC]">
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

export default NgienCheChou;
