import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { motion } from "framer-motion";
import { ImSpinner9 } from "react-icons/im";
import { FiPackage } from "react-icons/fi"; // icon nhẹ nhàng phù hợp
import { FaSpinner } from 'react-icons/fa';

function ReportMaterials() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dataMaterials, setDataMaterials] = useState({
    t1: {
        vv: '',
        mit: '',
        mil: '',
        ni: '',
        nxl: '',
        nck: '',
        hc: '',
        bk: '',
        lck: '',
        kb: '',
    },
    t2: {
        vv: '',
        mit: '',
        mil: '',
        ni: '',
        nxl: '',
        nck: '',
        hc: '',
        bk: '',
        lck: '',
        kb: '',
    },
    t3: {
        vv: '',
        mit: '',
        mil: '',
        ni: '',
        nxl: '',
        nck: '',
        hc: '',
        bk: '',
        lck: '',
        kb: '',
    },
    t4: {
        vv: '',
        mit: '',
        mil: '',
        ni: '',
        nxl: '',
        nck: '',
        hc: '',
        bk: '',
        lck: '',
        kb: '',
    },
    t5: {
        vv: '',
        mit: '',
        mil: '',
        ni: '',
        nxl: '',
        nck: '',
        hc: '',
        bk: '',
        lck: '',
        kb: '',
    },
    tm: {
        vv: '',
        mit: '',
        mil: '',
        ni: '',
        nxl: '',
        nck: '',
        hc: '',
        bk: '',
        lck: '',
        kb: '',
    },
    pm: {
        vv: '',
        mit: '',
        mil: '',
        ni: '',
        nxl: '',
        nck: '',
        hc: '',
        bk: '',
        lck: '',
        kb: '',
    },
    ck: {
        vv: '',
        mit: '',
        mil: '',
        ni: '',
        nxl: '',
        nck: '',
        hc: '',
        bk: '',
        lck: '',
        kb: '',
    },
    ch: {
        vv: '',
        mit: '',
        mil: '',
        ni: '',
        nxl: '',
        nck: '',
        hc: '',
        bk: '',
        lck: '',
        kb: '',
    },
    kcs: {
        vv: '',
        mit: '',
        mil: '',
        ni: '',
        nxl: '',
        nck: '',
        hc: '',
        bk: '',
        lck: '',
        kb: '',
    },
    sh: {
        vv: '',
        mit: '',
        mil: '',
        ni: '',
        nxl: '',
        nck: '',
        hc: '',
        bk: '',
        lck: '',
        kb: '',
    },
    tb: {
        vv: '',
        mit: '',
        mil: '',
        ni: '',
        nxl: '',
        nck: '',
        hc: '',
        bk: '',
        lck: '',
        kb: '',
    },
  });


    const getTotal = (field) => {
        return Object.values(dataMaterials).reduce((sum, row) => {
            const val = parseFloat(row[field]);
            return sum + (isNaN(val) ? 0 : val);
        }, 0);
    };


  const handleFileUpload = async (e) => {
  setIsLoading(true);
  const file = e.target.files[0];
  if (!file) return;

  const readFileAsBinary = async (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (evt) => resolve(evt.target.result);
      reader.onerror = reject;
      reader.readAsBinaryString(file);
    });

  const typeMaterials = [
    { dep: 't1', mat: ['vv', 'mit', 'mil', 'ni', 'nxl', 'nck', 'hc', 'bk', 'lck', 'kb'] },
    { dep: 't2', mat: ['vv', 'mit', 'mil', 'ni', 'nxl', 'nck', 'hc', 'bk', 'lck', 'kb'] },
    { dep: 't3', mat: ['vv', 'mit', 'mil', 'ni', 'nxl', 'nck', 'hc', 'bk', 'lck', 'kb'] },
    { dep: 't4', mat: ['vv', 'mit', 'mil', 'ni', 'nxl', 'nck', 'hc', 'bk', 'lck', 'kb'] },
    { dep: 't5', mat: ['vv', 'mit', 'mil', 'ni', 'nxl', 'nck', 'hc', 'bk', 'lck', 'kb'] },
    { dep: 'tm', mat: ['vv', 'mit', 'mil', 'ni', 'nxl', 'nck', 'hc', 'bk', 'lck', 'kb'] },
    { dep: 'pm', mat: ['vv', 'mit', 'mil', 'ni', 'nxl', 'nck', 'hc', 'bk', 'lck', 'kb'] },
    { dep: 'ck', mat: ['vv', 'mit', 'mil', 'ni', 'nxl', 'nck', 'hc', 'bk', 'lck', 'kb'] },
    { dep: 'ch', mat: ['vv', 'mit', 'mil', 'ni', 'nxl', 'nck', 'hc', 'bk', 'lck', 'kb'] },
    { dep: 'kcs', mat: ['vv', 'mit', 'mil', 'ni', 'nxl', 'nck', 'hc', 'bk', 'lck', 'kb'] },
    { dep: 'sh', mat: ['vv', 'mit', 'mil', 'ni', 'nxl', 'nck', 'hc', 'bk', 'lck', 'kb'] },
    { dep: 'tb', mat: ['vv', 'mit', 'mil', 'ni', 'nxl', 'nck', 'hc', 'bk', 'lck', 'kb'] },
  ];

  const boPhanMap = {
    t1: 'TO 1',
    t2: 'TO 2',
    t3: 'TO 3',
    t4: 'TO 4',
    t5: 'TO 5',
    tm: 'TO MAU',
    pm: ['PHA MAU', 'THLA-KT-PM'],
    ck: 'CHUP KHUON',
    ch: '',
    kcs: 'THLA-TO KCS',
    sh: '',
    tb: ''
  };

  const nameMap = {
    vv: { hanghoaten: 'Vải vụn', chungloaiten: 'Nguyên liệu bao bì' },
    // Các vật liệu khác cần được thêm vào nếu muốn xử lý
  };

  try {
    const binaryStr = await readFileAsBinary(file);
    const workbook = XLSX.read(binaryStr, { type: "binary" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    setData(jsonData); // lưu tất cả data nếu muốn xem

    let dataMaterialsTmp = {};

    // Khởi tạo dữ liệu rỗng
    for (const { dep, mat } of typeMaterials) {
      dataMaterialsTmp[dep] = {};
      for (const m of mat) {
        dataMaterialsTmp[dep][m] = '';
      }
    }

    // Bắt đầu xử lý theo thứ tự
    for (const type of typeMaterials) {
      const boPhanTen = boPhanMap[type.dep];

      for (const m of type.mat) {
        const { hanghoaten, chungloaiten } = nameMap[m] || {};
        if (!hanghoaten || !chungloaiten || boPhanTen === undefined) continue;

        const filteredData = jsonData.filter((row) => {
          const matchBoPhan = Array.isArray(boPhanTen)
            ? boPhanTen.includes(row.BoPhanTen)
            : row.BoPhanTen === boPhanTen;

          return (
            row.hanghoaten === hanghoaten &&
            row.chungloaiten === chungloaiten &&
            matchBoPhan
          );
        });

        const totalSoluong = filteredData.reduce((sum, row) => {
          const value = parseFloat(row.Soluong);
          return sum + (isNaN(value) ? 0 : value);
        }, 0);

        dataMaterialsTmp[type.dep][m] = totalSoluong || 0;
      }
    }

    setDataMaterials(dataMaterialsTmp);
    console.log(dataMaterialsTmp);
  } catch (error) {
    console.error("Lỗi xử lý file:", error);
  } finally {
    setIsLoading(false);
  }
};
    

  return (
    <div className="p-4">
      <div className="p-2 space-y-6 bg-white rounded-[6px]">
      
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <FaSpinner className="animate-spin text-blue-600 text-5xl" />
            <span className="text-gray-700 text-lg font-medium">Đang tải dữ liệu...</span>
          </div>
        </div>
      )}

      <div className="relative space-y-6 bg-white rounded-2xl p-6 z-10">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-2xl font-bold text-teal-700 flex items-center gap-2"
        >
          <FiPackage className="inline" /> Kê xuất vật tư
        </motion.h1>

        <div>
          <label
            htmlFor="fileInput"
            className="cursor-pointer inline-block px-6 py-2 text-white bg-teal-600 hover:bg-teal-700 rounded-xl font-medium transition-all duration-300"
          >
            Lấy file Excel
          </label>
          <input
            id="fileInput"
            type="file"
            accept=".xlsx, .xls"
            className="hidden"
            onChange={handleFileUpload}
            disabled={isLoading}
          />
        </div>

        {Object.keys(dataMaterials).length > 0 && (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="overflow-x-auto rounded-lg border border-gray-300 mt-6"
  >
    <table className="min-w-full text-sm text-left border-collapse">
      <thead className="bg-yellow-100 sticky top-0 z-10">
        <tr>
          <th className="border px-3 py-2 font-bold text-center bg-yellow-200">BP/Tổ</th>
          <th className="border px-3 py-2 font-bold">Vải vụn</th>
          <th className="border px-3 py-2 font-bold">Mực in thường</th>
          <th className="border px-3 py-2 font-bold">Mực in lapa</th>
          <th className="border px-3 py-2 font-bold">Nước in</th>
          <th className="border px-3 py-2 font-bold">Nước xử lý</th>
          <th className="border px-3 py-2 font-bold">Nước chùi khuôn</th>
          <th className="border px-3 py-2 font-bold">Hóa chất</th>
          <th className="border px-3 py-2 font-bold">Băng keo</th>
          <th className="border px-3 py-2 font-bold">Lụa căng khung</th>
          <th className="border px-3 py-2 font-bold">Keo bản</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(dataMaterials).map(([key, val], idx) => (
          <tr
            key={key}
            className={`${
              idx % 2 === 0 ? "bg-white" : "bg-gray-50"
            } hover:bg-yellow-50 transition`}
          >
            <td className="border px-3 py-2 font-medium text-center capitalize">{key}</td>
            <td className="border px-3 py-2">{val.vv}</td>
            <td className="border px-3 py-2">{val.mit}</td>
            <td className="border px-3 py-2">{val.mil}</td>
            <td className="border px-3 py-2">{val.ni}</td>
            <td className="border px-3 py-2">{val.nxl}</td>
            <td className="border px-3 py-2">{val.nck}</td>
            <td className="border px-3 py-2">{val.hc}</td>
            <td className="border px-3 py-2">{val.bk}</td>
            <td className="border px-3 py-2">{val.lck}</td>
            <td className="border px-3 py-2">{val.kb}</td>
          </tr>
        ))}

        {/* Tổng cộng */}
        <tr className="bg-yellow-100 font-semibold">
          <td className="border px-3 py-2 text-center">Tổng cộng</td>
          <td className="border px-3 py-2">{getTotal("vv")}</td>
          <td className="border px-3 py-2">{getTotal("mit")}</td>
          <td className="border px-3 py-2">{getTotal("mil")}</td>
          <td className="border px-3 py-2">{getTotal("ni")}</td>
          <td className="border px-3 py-2">{getTotal("nxl")}</td>
          <td className="border px-3 py-2">{getTotal("nck")}</td>
          <td className="border px-3 py-2">{getTotal("hc")}</td>
          <td className="border px-3 py-2">{getTotal("bk")}</td>
          <td className="border px-3 py-2">{getTotal("lck")}</td>
          <td className="border px-3 py-2">{getTotal("kb")}</td>
        </tr>
      </tbody>
    </table>
  </motion.div>
)}

      </div>
    </div>
    </div>
  );
}

export default ReportMaterials;
