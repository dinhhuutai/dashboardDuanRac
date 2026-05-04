// import React, { useEffect, useMemo, useState } from "react";
// import http from "~/api/http";
// import { BASE_URL } from "~/config";
// import DateRangeField from "~/components/DateRangeField";
// import { FaSpinner } from "react-icons/fa";

// // ===== Helpers =====
// const formatISO = (d) => {
//   if (!d) return "";
//   const yyyy = d.getFullYear();
//   const mm = String(d.getMonth() + 1).padStart(2, "0");
//   const dd = String(d.getDate()).padStart(2, "0");
//   return `${yyyy}-${mm}-${dd}`;
// };

// // ===== LOCAL LABEL =====
// const TYPE_LABELS = [
//   "Giẻ lau",
//   "Lapa",
//   "Băng keo",
//   "Keo bàn",
//   "Mực",
//   "Mực lapa",
//   "Logo",
//   "Lụa",
// ];

// // ===== SERVER CHÍNH CONFIG =====
// const MATERIALS = [
//   { key: "Vai_vun", label: "Vải vụn (kg)" },
//   { key: "Muc_lapa", label: "Mực lapa (kg)" },
//   { key: "Keo_ban", label: "Keo bàn (kg)" },
//   { key: "Hoa_chat", label: "Hoá chất (kg)" },
//   { key: "Bang_keo", label: "Băng keo (kg)" },
//   { key: "Muc", label: "Mực (kg)" },
//   { key: "Lua", label: "Lụa căng khung" },
// ];

// const TEAMS = ["TO1", "TO2", "TOMAU", "TOCHUP"];

// // map tên hiển thị
// const TEAM_LABEL = {
//   TO1: "C1",
//   TO2: "C2",
//   TOMAU: "Mẫu",
//   TOCHUP: "Chụp khuôn",
// };

// function TrashAndMaterial() {
//   const [dateRange, setDateRange] = useState({
//     from: new Date(),
//     to: new Date(),
//   });

//   const [localData, setLocalData] = useState([]);
//   const [externalData, setExternalData] = useState({});
//   const [loading, setLoading] = useState(false);

//   // ===============================
//   // FETCH API
//   // ===============================
//   useEffect(() => {
//     if (!dateRange?.from || !dateRange?.to) return;

//     const fetchData = async () => {
//       try {
//         setLoading(true);

//         const [localRes, mainRes] = await Promise.all([
//           http.get(`${BASE_URL}/api/trash/report-trash-and-material`, {
//             params: {
//               fromDate: formatISO(dateRange.from),
//               toDate: formatISO(dateRange.to),
//             },
//           }),
//           http.get(`${BASE_URL}/api/trash/material-from-main`, {
//             params: {
//               fromDate: formatISO(dateRange.from),
//               toDate: formatISO(dateRange.to),
//             },
//           }),
//         ]);

//         if (localRes.data?.success) {
//           setLocalData(localRes.data.data || []);
//         }

//         if (mainRes.data?.success) {
//           setExternalData(mainRes.data.data || {});
//         }
//       } catch (err) {
//         console.error("Fetch error:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, [dateRange]);

//   // ===============================
//   // LOCAL xử lý
//   // ===============================
//   const sumByType = (arr = []) => {
//     const out = [];

//     for (let i = 0; i < 8; i++) {
//       let sum = 0;
//       for (let j = 0; j < 7; j++) {
//         sum += arr[i * 7 + j] || 0;
//       }
//       out.push(sum);
//     }

//     out.push(arr[63] || 0);
//     return out;
//   };

//   const processedLocal = useMemo(() => {
//     return localData.map((b) => ({
//       ...b,
//       val: sumByType(b.value),
//     }));
//   }, [localData]);

//   // ===============================
//   // SERVER CHÍNH xử lý
//   // ===============================
//   const externalTable = useMemo(() => {
//     return TEAMS.map((team) => {
//       let total = 0;

//       const values = MATERIALS.map((m) => {
//         const v = externalData?.[m.key]?.[team] || 0;
//         total += v;
//         return v;
//       });

//       return {
//         team,
//         label: TEAM_LABEL[team],
//         values,
//         total,
//       };
//     });
//   }, [externalData]);

//   const externalTotal = useMemo(() => {
//     const arr = MATERIALS.map((m) => {
//       let sum = 0;
//       for (const t of TEAMS) {
//         sum += externalData?.[m.key]?.[t] || 0;
//       }
//       return sum;
//     });

//     const total = arr.reduce((a, b) => a + b, 0);
//     return { arr, total };
//   }, [externalData]);

//   const format = (n) =>
//     n ? n.toLocaleString("vi-VN", { maximumFractionDigits: 2 }) : "-";

//   // ===============================
//   // UI
//   // ===============================
//   return (
//     <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 p-4">

//       {/* LOADING OVERLAY */}
//       {loading && (
//         <div className="fixed inset-0 z-50 grid place-items-center bg-white/60 backdrop-blur-sm">
//           <div className="flex flex-col items-center gap-3">
//             <FaSpinner className="animate-spin text-emerald-600 text-4xl" />
//             <span className="text-slate-700 text-sm">Đang tải dữ liệu...</span>
//           </div>
//         </div>
//       )}

//       <div className="space-y-6">

//         {/* TITLE BOX */}
//         <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex items-center gap-3">
//           <div className="text-2xl">📊</div>
//           <h2 className="text-lg font-semibold text-slate-800">
//             Báo cáo rác & vật tư
//           </h2>
//         </div>

//         {/* FILTER */}
//         <div className="bg-white border rounded-xl p-4 shadow-sm">
//           <DateRangeField range={dateRange} onChange={setDateRange} />
//         </div>

//         {/* =========================
//             TABLE 1: LOCAL
//         ========================== */}
//         <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
//           <div className="p-3 font-semibold text-green-700">
//             📊 Dữ liệu nội bộ
//           </div>

//           <div className="overflow-auto">
//             <table className="min-w-full text-sm">
//               <thead className="bg-green-100">
//                 <tr>
//                   <th className="border px-2 py-2">BP/Tổ</th>
//                   {TYPE_LABELS.map((t, i) => (
//                     <th key={i} className="border px-2 py-2">{t}</th>
//                   ))}
//                   <th className="border px-2 py-2 font-bold">Tổng</th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {processedLocal.map((row) => (
//                   <tr key={row.bucketID}>
//                     <td className="border text-center">{row.bucketName}</td>
//                     {row.val.map((v, i) => (
//                       <td key={i} className="border text-center">
//                         {v === 0 ? "-" : v.toFixed(1)}
//                       </td>
//                     ))}
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {/* =========================
//             TABLE 2: SERVER CHÍNH
//         ========================== */}
//         <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
//           <div className="p-3 font-semibold text-blue-700">
//             🌐 Dữ liệu server chính
//           </div>

//           <div className="overflow-auto">
//             <table className="min-w-full text-sm">
//               <thead className="bg-blue-100">
//                 <tr>
//                   <th className="border px-2 py-2">BP/Tổ</th>
//                   {MATERIALS.map((m) => (
//                     <th key={m.key} className="border px-2 py-2">
//                       {m.label}
//                     </th>
//                   ))}
//                   <th className="border px-2 py-2 font-bold">Tổng</th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {externalTable.map((row, i) => (
//                   <tr key={i}>
//                     <td className="border text-center font-medium">
//                       {row.label}
//                     </td>

//                     {row.values.map((v, idx) => (
//                       <td key={idx} className="border text-center">
//                         {format(v)}
//                       </td>
//                     ))}

//                     <td className="border text-center font-semibold">
//                       {format(row.total)}
//                     </td>
//                   </tr>
//                 ))}

//                 {/* TOTAL */}
//                 <tr className="bg-blue-200 font-bold">
//                   <td className="border text-center">Tổng</td>

//                   {externalTotal.arr.map((v, i) => (
//                     <td key={i} className="border text-center">
//                       {format(v)}
//                     </td>
//                   ))}

//                   <td className="border text-center">
//                     {format(externalTotal.total)}
//                   </td>
//                 </tr>
//               </tbody>
//             </table>
//           </div>
//         </div>

//       </div>
//     </div>
//   );
// }

// export default TrashAndMaterial;


import React, { useEffect, useMemo, useState } from "react";
import http from "~/api/http";
import { BASE_URL } from "~/config";
import DateRangeField from "~/components/DateRangeField";
import { FaChartBar } from "react-icons/fa";

// ===== Helpers =====
const formatISO = (d) => {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
};

// ===== ORDER BP =====
const ORDER = [
  "C1",
  "C2",
  "Mẫu",
  "Chụp khuôn",
  "Kcs",
  "Sửa hàng",
  "Pha màu",
];

// ===== MAP TEAM =====
const TEAM_MAP = {
  TO1: "C1",
  TO2: "C2",
  TOMAU: "Mẫu",
  TOCHUP: "Chụp khuôn",
};

// ===== SERVER MATERIAL =====
const MATERIALS = [
  { key: "Vai_vun", label: "Vải vụn (kg)" },
  { key: "Muc_lapa", label: "Mực lapa (kg)" },
  { key: "Keo_ban", label: "Keo bàn (kg)" },
  { key: "Hoa_chat", label: "Hoá chất (kg)" },
  { key: "Bang_keo", label: "Băng keo (kg)" },
  { key: "Muc", label: "Mực (kg)" },
  { key: "Lua", label: "Lụa căng khung" },
];

// ===== LOCAL (RÁC) =====
const TRASH_LABELS = [
  "Giẻ lau dính mực thường",
  "Giẻ lau dính mực lapa",
  "Băng keo dính mực",
  "Keo bàn thải",
  "Mực in thải",
  "Mực in lapa thải",
  "Vụn logo",
  "Lụa căng khung",
];

// ===== COMPONENT =====
function TrashAndMaterial() {
  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: new Date(),
  });

  const [localData, setLocalData] = useState([]);
  const [externalData, setExternalData] = useState({});
  const [loading, setLoading] = useState(false);

  // ================= FETCH =================
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [localRes, mainRes] = await Promise.all([
          http.get(`${BASE_URL}/api/trash/report-trash-and-material`, {
            params: {
              fromDate: formatISO(dateRange.from),
              toDate: formatISO(dateRange.to),
            },
          }),
          http.get(`${BASE_URL}/api/trash/material-from-main`, {
            params: {
              fromDate: formatISO(dateRange.from),
              toDate: formatISO(dateRange.to),
            },
          }),
        ]);

        setLocalData(localRes.data?.data || []);
        setExternalData(mainRes.data?.data || {});
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  // ================= LOCAL xử lý =================
  const sumTrash = (arr = []) => {
    const out = [];

    for (let i = 0; i < 8; i++) {
      let sum = 0;
      for (let j = 0; j < 7; j++) {
        sum += arr[i * 7 + j] || 0;
      }
      out.push(sum);
    }

    out.push(arr[63] || 0);
    return out;
  };

  const localMap = useMemo(() => {
    const map = {};

    localData.forEach((b) => {
      map[b.bucketName] = sumTrash(b.value);
    });

    return map;
  }, [localData]);

  // ================= MERGE DATA =================
  const mergedRows = useMemo(() => {
    return ORDER.map((bp) => {
      // ===== SERVER =====
      const serverVals = MATERIALS.map((m) => {
        const key = Object.keys(TEAM_MAP).find(
          (k) => TEAM_MAP[k] === bp
        );
        return key ? externalData?.[m.key]?.[key] || 0 : 0;
      });

      const serverTotal = serverVals.reduce((a, b) => a + b, 0);

      // ===== LOCAL =====
      const localVals = localMap[bp] || Array(9).fill(0);

      return {
        bp,
        serverVals,
        serverTotal,
        localVals,
      };
    });
  }, [externalData, localMap]);

  // ================= TOTAL =================
  const grand = useMemo(() => {
    const server = MATERIALS.map((_, i) =>
      mergedRows.reduce((s, r) => s + r.serverVals[i], 0)
    );

    const local = TRASH_LABELS.map((_, i) =>
      mergedRows.reduce((s, r) => s + (r.localVals[i] || 0), 0)
    );

    return {
      server,
      serverTotal: server.reduce((a, b) => a + b, 0),
      local,
      localTotal: local.reduce((a, b) => a + b, 0),
    };
  }, [mergedRows]);

  const f = (n) =>
    n ? n.toLocaleString("vi-VN", { maximumFractionDigits: 2 }) : "";

  // ================= UI =================
  return (
    <div className="min-h-screen bg-slate-50 p-4 space-y-6">

      {/* HEADER */}
      <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center gap-3">
        <FaChartBar className="text-blue-600 text-xl" />
        <h2 className="font-bold text-lg">
          Báo cáo tổng hợp vật tư & rác
        </h2>
      </div>

      {/* FILTER */}
      <div className="bg-white border rounded-xl p-4 shadow-sm">
        <DateRangeField range={dateRange} onChange={setDateRange} />
      </div>

      {/* TABLE */}
      <div className="bg-white border rounded-xl shadow-sm overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-blue-100">
            <tr>
              <th className="border px-2 py-2">BP/Tổ</th>

              {/* SERVER */}
              {MATERIALS.map((m) => (
                <th key={m.key} className="border px-2 py-2">
                  {m.label}
                </th>
              ))}
              <th className="border px-2 py-2 bg-blue-200">
                Tổng vật tư
              </th>

              {/* LOCAL */}
              {TRASH_LABELS.map((t, i) => (
                <th key={i} className="border px-2 py-2">
                  {t}
                </th>
              ))}
              <th className="border px-2 py-2 bg-blue-200">
                Tổng rác
              </th>
            </tr>
          </thead>

          <tbody>
            {mergedRows.map((r, i) => (
              <tr key={i}>
                <td className="border px-2 py-1 font-medium text-center">
                  {r.bp}
                </td>

                {r.serverVals.map((v, i) => (
                  <td key={i} className="border px-2 py-1 text-center">
                    {f(v)}
                  </td>
                ))}

                <td className="border px-2 py-1 font-semibold text-center bg-blue-50">
                  {f(r.serverTotal)}
                </td>

                {r.localVals.slice(0, 8).map((v, i) => (
                  <td key={i} className="border px-2 py-1 text-center">
                    {f(v)}
                  </td>
                ))}

                <td className="border px-2 py-1 font-semibold text-center bg-blue-50">
                  {f(r.localVals[8])}
                </td>
              </tr>
            ))}

            {/* TOTAL */}
            <tr className="bg-blue-200 font-bold">
              <td className="border px-2 py-2 text-center">Tổng</td>

              {grand.server.map((v, i) => (
                <td key={i} className="border px-2 py-2 text-center">
                  {f(v)}
                </td>
              ))}

              <td className="border px-2 py-2 text-center">
                {f(grand.serverTotal)}
              </td>

              {grand.local.map((v, i) => (
                <td key={i} className="border px-2 py-2 text-center">
                  {f(v)}
                </td>
              ))}

              <td className="border px-2 py-2 text-center">
                {f(grand.localTotal)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {loading && (
        <div className="text-center text-gray-500">
          ⏳ Đang tải dữ liệu...
        </div>
      )}
    </div>
  );
}

export default TrashAndMaterial;