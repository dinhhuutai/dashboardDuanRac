import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { motion } from "framer-motion";
import { ImSpinner9 } from "react-icons/im";
import { FiPackage } from "react-icons/fi"; // icon nhẹ nhàng phù hợp

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


  const handleFileUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setIsLoading(true);

    const typeMaterials = [
        {
            dep: 't1',
            mat: ['vv', 'mit', 'mil', 'ni', 'nxl', 'nck', 'hc', 'bk', 'lck', 'kb'],
        },
        {
            dep: 't2',
            mat: ['vv', 'mit', 'mil', 'ni', 'nxl', 'nck', 'hc', 'bk', 'lck', 'kb'],
        },
        {
            dep: 't3',
            mat: ['vv', 'mit', 'mil', 'ni', 'nxl', 'nck', 'hc', 'bk', 'lck', 'kb'],
        },
        {
            dep: 't4',
            mat: ['vv', 'mit', 'mil', 'ni', 'nxl', 'nck', 'hc', 'bk', 'lck', 'kb'],
        },
        {
            dep: 't5',
            mat: ['vv', 'mit', 'mil', 'ni', 'nxl', 'nck', 'hc', 'bk', 'lck', 'kb'],
        },
        {
            dep: 'tm',
            mat: ['vv', 'mit', 'mil', 'ni', 'nxl', 'nck', 'hc', 'bk', 'lck', 'kb'],
        },
        {
            dep: 'pm',
            mat: ['vv', 'mit', 'mil', 'ni', 'nxl', 'nck', 'hc', 'bk', 'lck', 'kb'],
        },
        {
            dep: 'ck',
            mat: ['vv', 'mit', 'mil', 'ni', 'nxl', 'nck', 'hc', 'bk', 'lck', 'kb'],
        },
        {
            dep: 'ch',
            mat: ['vv', 'mit', 'mil', 'ni', 'nxl', 'nck', 'hc', 'bk', 'lck', 'kb'],
        },
        {
            dep: 'ksc',
            mat: ['vv', 'mit', 'mil', 'ni', 'nxl', 'nck', 'hc', 'bk', 'lck', 'kb'],
        },
        {
            dep: 'sh',
            mat: ['vv', 'mit', 'mil', 'ni', 'nxl', 'nck', 'hc', 'bk', 'lck', 'kb'],
        },
        {
            dep: 'tb',
            mat: ['vv', 'mit', 'mil', 'ni', 'nxl', 'nck', 'hc', 'bk', 'lck', 'kb'],
        },
    ]

  const reader = new FileReader();
  reader.onload = (evt) => {
    try {
      const binaryStr = evt.target.result;
      const workbook = XLSX.read(binaryStr, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      setData(jsonData); // lưu tất cả data nếu muốn xem

      let dataMaterialsTmp = {
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
        };
      let filteredData;
      let totalSoluong;

      typeMaterials?.forEach((type) => {
        type.mat?.map((m) => {
            filteredData = jsonData.filter(
                (row) =>
                row["hanghoaten"] === (
                    m === 'vv' ? 'Vải vụn' : ''
                ) &&
                row["chungloaiten"] === (
                    m === 'vv' ? 'Nguyên liệu bao bì' : ''
                ) &&
                row["BoPhanTen"] === (
                                        type.dep === 't1' ? 'TO 1' 
                                        : type.dep === 't2' ? 'TO 2'
                                        : type.dep === 't3' ? 'TO 3'
                                        : type.dep === 't4' ? 'TO 4'
                                        : type.dep === 't5' ? 'TO 5'
                                        : type.dep === 'tm' ? 'TO MAU'
                                        : type.dep === 'pm' ? ('PHA MAU' || 'THLA-KT-PM')
                                        : type.dep === 'ck' ? 'CHUP KHUON'
                                        : type.dep === 'ch' ? ''
                                        : type.dep === 'kcs' ? 'THLA-TO KCS'
                                        : type.dep === 'sh' ? ''
                                        : type.dep === 'tb' ? '' : ''
                                    )
            );

            totalSoluong = filteredData?.reduce((sum, row) => {
                const value = parseFloat(row["Soluong"]);
                return sum + (isNaN(value) ? 0 : value);
            }, 0);

            dataMaterialsTmp = {
                ...dataMaterialsTmp,
                [type.dep]: {
                ...dataMaterialsTmp[type.dep],
                [m]: totalSoluong || 0,
                },
            };
            
            console.log(dataMaterialsTmp)
        })

      })

      // Cập nhật vào state dataMaterials
      setDataMaterials(dataMaterialsTmp);

    } catch (err) {
      console.error("Lỗi đọc file:", err);
    } finally {
      setIsLoading(false);
    }
  };

  reader.readAsBinaryString(file);
};
    

  return (
    <div className="p-4">
      <div className="p-2 space-y-6 bg-white rounded-[6px]">
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-70 z-50 flex items-center justify-center">
          <ImSpinner9 className="animate-spin text-teal-600 text-5xl" />
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
