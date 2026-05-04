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


import React, { useEffect, useMemo, useRef, useState } from "react";
import http from "~/api/http";
import { BASE_URL } from "~/config";
import DateRangeField from "~/components/DateRangeField";
import { useFeatureAllowed } from "~/hooks/useFeatureGuard";
import MODULEID from "~/contants/modules";
import { FaChartBar, FaSpinner } from "react-icons/fa";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

// ===== Helpers: gửi API đúng ngày trên lịch local (khớp DateRangeField), không dùng toISOString/offset =====
const toISODate = (d) => {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const fmtDmySlash = (d) => {
  if (!d) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatNowStamp = () => {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mi} ${dd}-${mm}-${yyyy}`;
};

/** 1 → A, 9 → I, 18 → R */
function excelColLetter(col1Based) {
  let n = col1Based;
  let s = "";
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function canvasToUint8(canvas) {
  const dataUrl = canvas.toDataURL("image/png");
  const b64 = dataUrl.split(",")[1] || "";
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

/**
 * Recharts vẽ SVG — html2canvas thường không hiển thị được slice.
 * Ưu tiên html-to-image; fallback serialize SVG → Image → canvas; cuối cùng html2canvas.
 */
async function captureDonutElementToPngBytes(rootEl) {
  if (!rootEl || typeof document === "undefined") return null;

  const target =
    rootEl.querySelector(".recharts-wrapper") ||
    rootEl.querySelector("svg.recharts-surface")?.parentElement ||
    rootEl;

  try {
    rootEl.scrollIntoView({ block: "center", behavior: "auto" });
  } catch {
    rootEl.scrollIntoView(true);
  }
  await new Promise((r) => setTimeout(r, 250));
  await new Promise((r) =>
    requestAnimationFrame(() => requestAnimationFrame(r))
  );

  try {
    const { toPng } = await import("html-to-image");
    const dataUrl = await toPng(target, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      skipFonts: true,
    });
    const b64 = dataUrl.split(",")[1];
    if (b64) {
      const u8 = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      if (u8.length > 900) return u8;
    }
  } catch (e) {
    console.warn("html-to-image (biểu đồ):", e);
  }

  const svg = target.querySelector("svg");
  if (svg) {
    try {
      const rect = svg.getBoundingClientRect();
      const w = Math.max(1, Math.ceil(rect.width));
      const h = Math.max(1, Math.ceil(rect.height));
      const clone = svg.cloneNode(true);
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      if (!clone.getAttribute("width")) clone.setAttribute("width", String(w));
      if (!clone.getAttribute("height")) clone.setAttribute("height", String(h));
      const xml = new XMLSerializer().serializeToString(clone);
      const svgBlob = new Blob([xml], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
        img.src = url;
      });
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = w * scale;
      canvas.height = h * scale;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
      URL.revokeObjectURL(url);
      const out = canvasToUint8(canvas);
      if (out.length > 900) return out;
    } catch (e2) {
      console.warn("SVG→canvas (biểu đồ):", e2);
    }
  }

  try {
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(target, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      foreignObjectRendering: true,
    });
    const out = canvasToUint8(canvas);
    if (out.length > 900) return out;
  } catch (e3) {
    console.warn("html2canvas (biểu đồ):", e3);
  }

  return null;
}

/** Khớp bucketName từ API với ORDER (tránh lệch dấu Unicode / khoảng trắng / khác biệt hoa thường nhẹ) */
const normBpKey = (s) =>
  String(s ?? "")
    .normalize("NFC")
    .trim()
    .toLocaleLowerCase("vi");

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

// ===== LOCAL (RÁC) — khớp thứ tự API; không hiển thị cột "Rác sinh hoạt" (vẫn nằm trong tổng API) =====
const TRASH_API_TYPE_COUNT = 9;
const LOCAL_ROW_TOTAL_IDX = TRASH_API_TYPE_COUNT;
const TRASH_LABELS = [
  "Giẻ lau có chứa thành phần nguy hại",
  "Giẻ lau dính lapa",
  "Băng keo dính mực",
  "Keo bàn thải",
  "Mực in thải",
  "Mực in lapa thải",
  "Vụn logo",
  "Lụa căng khung",
];

/** Gộp cột rác cho thống kê (khớp nhóm trong báo cáo tổng hợp) */
const WASTE_CHART_ROWS = [
  { label: "Vải vụn dính mực + dính lapa", indices: [0, 1] },
  { label: "Băng keo dính mực", indices: [2] },
  { label: "Mực in thải", indices: [4] },
  { label: "Mực lapa thải", indices: [5] },
  { label: "Lụa căng khung", indices: [7] },
  { label: "Keo bàn thải", indices: [3] },
  { label: "Vụn logo", indices: [6] },
];

const PIE_COLORS = [
  "#0f766e",
  "#0e7490",
  "#1d4ed8",
  "#5b21b6",
  "#a21caf",
  "#c2410c",
  "#b45309",
  "#15803d",
  "#475569",
];

/** Màu cạnh trái bảng legend — cùng thứ tự với lát trong biểu đồ (pieRows). */
function legendStripeColor(pieRows, isMatch) {
  const i = pieRows.findIndex(isMatch);
  if (i < 0) return "#cbd5e1";
  return PIE_COLORS[i % PIE_COLORS.length];
}

const RAD = Math.PI / 180;

function pctLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}) {
  if (percent < 0.06) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.62;
  const x = cx + r * Math.cos(-midAngle * RAD);
  const y = cy + r * Math.sin(-midAngle * RAD);
  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      style={{
        fontSize: 11,
        fontWeight: 700,
        paintOrder: "stroke",
        stroke: "rgba(15,23,42,0.35)",
        strokeWidth: 2,
        strokeLinejoin: "round",
      }}
    >
      {`${Math.round(percent * 100)}%`}
    </text>
  );
}

function StructurePieTooltip({ active, payload, total }) {
  if (!active || !payload?.length) return null;
  const v = Number(payload[0].value) || 0;
  const pct = total > 0 ? ((v / total) * 100).toFixed(1) : "0";
  return (
    <div className="rounded-lg border border-slate-200/80 bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur-sm">
      <div className="font-semibold text-slate-800">{payload[0].name}</div>
      <div className="text-slate-600">
        {v.toLocaleString("vi-VN", { maximumFractionDigits: 2 })} kg —{" "}
        <span className="font-medium text-teal-700">{pct}%</span>
      </div>
    </div>
  );
}

function StructureDonutChart({ data, total, emptyLabel }) {
  if (!data?.length) {
    return (
      <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-gradient-to-b from-slate-50 to-white px-4 text-center text-sm text-slate-500">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="w-full min-w-0">
      <div className="mx-auto w-full max-w-[420px] sm:max-w-none">
        <div className="h-[280px] w-full min-h-[260px] sm:h-[300px] md:h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 4, right: 4, bottom: 52, left: 4 }}>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="42%"
                innerRadius="46%"
                outerRadius="70%"
                paddingAngle={2}
                stroke="#fff"
                strokeWidth={2}
                label={pctLabel}
                labelLine={false}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                content={<StructurePieTooltip total={total} />}
                wrapperStyle={{ zIndex: 50 }}
              />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{
                  width: "100%",
                  maxHeight: 72,
                  overflowY: "auto",
                  fontSize: 10,
                  lineHeight: 1.35,
                  paddingTop: 2,
                }}
                formatter={(value) => (
                  <span className="text-slate-700" style={{ whiteSpace: "normal" }}>
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

const materialChartName = (label) =>
  String(label)
    .replace(/\s*\(kg\)\s*$/i, "")
    .replace(/^Hoá\b/, "Hóa");

const isJuseKey = (s) => /^juse$/i.test(String(s ?? "").trim());

function sumMaterialBucket(obj) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return 0;
  let sum = 0;
  for (const [teamKey, v] of Object.entries(obj)) {
    if (isJuseKey(teamKey)) continue;
    sum += Number(v) || 0;
  }
  return Math.round(sum * 100) / 100;
}

// ===== COMPONENT =====
function TrashAndMaterial() {
  const EXPORT_EXCEL_REPORT = useFeatureAllowed(
    MODULEID.CANRAC,
    "cr_xuatexceltrangbaocao"
  );

  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: new Date(),
  });

  const [localData, setLocalData] = useState([]);
  const [externalData, setExternalData] = useState({});
  const [loading, setLoading] = useState(false);
  /** Sản lượng chi tiết in (nhập tay) — dùng tính tỷ lệ với tổng rác */
  const [chiTietInInput, setChiTietInInput] = useState("");
  const [exportingExcel, setExportingExcel] = useState(false);
  const materialDonutRef = useRef(null);
  const wasteDonutRef = useRef(null);

  // ================= FETCH =================
  useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        const startDate = toISODate(dateRange.from);
        const endDate = toISODate(dateRange.to);

        const [localRes, mainRes] = await Promise.all([
          http.get(`${BASE_URL}/api/statistics/weight-by-bucket`, {
            params: {
              startDate,
              endDate,
              bucketName: "",
            },
          }),
          http.get(`${BASE_URL}/api/trash/material-from-main`, {
            params: {
              fromDate: startDate,
              toDate: endDate,
            },
          }),
        ]);

        setLocalData(
          localRes.data?.status === "success" ? localRes.data.data || [] : []
        );
        setExternalData(mainRes.data?.data || {});
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  // ================= LOCAL xử lý (vector 64 = 9 loại × 7 ca + tổng index 63) =================
  const sumTrash = (arr) => {
    const src = arr == null ? [] : arr;
    const a = Array(64).fill(0);
    for (let i = 0; i < Math.min(64, src.length); i++) a[i] = src[i] || 0;
    const numTypes = Math.floor((a.length - 1) / 7);
    const out = [];
    for (let t = 0; t < numTypes; t++) {
      let s = 0;
      const base = t * 7;
      for (let k = 0; k < 7; k++) s += a[base + k] || 0;
      out.push(Math.round(s * 100) / 100);
    }
    out.push(Math.round((a[63] || 0) * 100) / 100);
    return out;
  };

  const localMap = useMemo(() => {
    const map = {};
    localData.forEach((b) => {
      const name = b.bucketName;
      if (name == null || name === "") return;
      const k = normBpKey(name);
      // Chỉ dùng tổng cả bucket (đã gồm các chuyền + QR cấp bộ phận)
      map[k] = sumTrash(b.sum);
    });
    return map;
  }, [localData]);

  const emptyLocalVals = () =>
    Array(TRASH_API_TYPE_COUNT + 1).fill(0);

  const buildRow = (bpLabel, serverTeamKey) => {
    const serverVals = MATERIALS.map((m) => {
      return serverTeamKey
        ? externalData?.[m.key]?.[serverTeamKey] || 0
        : 0;
    });
    const serverTotal = serverVals.reduce((a, b) => a + b, 0);
    const localVals =
      localMap[normBpKey(bpLabel)] || emptyLocalVals();
    return {
      bp: bpLabel,
      serverVals,
      serverTotal,
      localVals,
    };
  };

  // ================= MERGE DATA =================
  const mergedRows = useMemo(() => {
    const orderKeys = new Set(ORDER.map(normBpKey));

    const main = ORDER.map((bp) => {
      const serverTeamKey =
        Object.keys(TEAM_MAP).find((k) => normBpKey(TEAM_MAP[k]) === normBpKey(bp)) ||
        null;
      return buildRow(bp, serverTeamKey);
    });

    const extras = localData
      .filter(
        (b) =>
          b.bucketName != null &&
          String(b.bucketName).trim() !== "" &&
          !orderKeys.has(normBpKey(b.bucketName))
      )
      .sort((a, z) => (a.bucketID ?? 0) - (z.bucketID ?? 0))
      .map((b) => buildRow(b.bucketName, null));

    return [...main, ...extras];
  }, [externalData, localMap, localData]);

  // ================= TOTAL =================
  const grand = useMemo(() => {
    const server = MATERIALS.map((_, i) =>
      mergedRows.reduce((s, r) => s + r.serverVals[i], 0)
    );

    const local = TRASH_LABELS.map((_, i) =>
      mergedRows.reduce((s, r) => s + (r.localVals[i] || 0), 0)
    );

    const localTotal = mergedRows.reduce(
      (s, r) => s + (r.localVals[LOCAL_ROW_TOTAL_IDX] || 0),
      0
    );

    return {
      server,
      serverTotal: server.reduce((a, b) => a + b, 0),
      local,
      localTotal,
    };
  }, [mergedRows]);

  /** Tổng toàn hệ vật tư (mọi tổ trong externalData; bỏ Juse — vật tư hoặc cột tổ) */
  const materialStructure = useMemo(() => {
    const rows = MATERIALS.filter((m) => !isJuseKey(m.key)).map((m) => ({
      key: m.key,
      name: materialChartName(m.label),
      value: sumMaterialBucket(externalData[m.key]),
    }));
    const total = rows.reduce((s, r) => s + r.value, 0);
    const pieRows = [...rows]
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value);
    const tableRows = [...rows].sort((a, b) => b.value - a.value);
    return { tableRows, pieRows, total };
  }, [externalData]);

  /** Tổng rác theo nhóm (từ cộng các BP ở bảng trên) */
  const wasteStructure = useMemo(() => {
    const rows = WASTE_CHART_ROWS.map((def) => {
      const value = def.indices.reduce(
        (s, i) => s + (Number(grand.local[i]) || 0),
        0
      );
      return {
        name: def.label,
        value: Math.round(value * 100) / 100,
      };
    });
    const total = rows.reduce((s, r) => s + r.value, 0);
    const pieRows = [...rows]
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value);
    return { tableRows: rows, pieRows, total };
  }, [grand.local]);

  const fmtKg = (n) => {
    const x = Number(n);
    if (!Number.isFinite(x) || x === 0) return "-";
    return `${x.toLocaleString("vi-VN", { maximumFractionDigits: 2 })}`;
  };

  const f = (n) => {
    const x = Number(n);
    if (!Number.isFinite(x) || x === 0) return "-";
    return x.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
  };

  const chiTietInParsed = (() => {
    const s = String(chiTietInInput ?? "").trim().replace(/\s/g, "").replace(",", ".");
    if (s === "") return NaN;
    const x = Number(s);
    return Number.isFinite(x) ? x : NaN;
  })();
  const wastePerChiTietIn =
    Number.isFinite(chiTietInParsed) &&
    chiTietInParsed > 0 &&
    Number.isFinite(grand.localTotal)
      ? grand.localTotal / chiTietInParsed
      : null;

  const exportTrashAndMaterialExcel = async () => {
    const [{ default: ExcelJS }, fsaver] = await Promise.all([
      import("exceljs"),
      import("file-saver"),
    ]);
    const saveAs = fsaver?.default ?? fsaver?.saveAs;
    if (typeof saveAs !== "function") {
      throw new Error("file-saver: saveAs not available");
    }

    const COLS = 1 + MATERIALS.length + 1 + TRASH_LABELS.length + 1;
    const splitMid = Math.floor(COLS / 2);
    const lastLetter = excelColLetter(COLS);
    const idxTongVt0 = 1 + MATERIALS.length;
    const idxTongRac0 = COLS - 1;

    const padCells = (cells) => {
      const row = cells.slice();
      while (row.length < COLS) row.push("");
      return row;
    };

    const rangeLabel =
      toISODate(dateRange.from) === toISODate(dateRange.to)
        ? fmtDmySlash(dateRange.from)
        : `${fmtDmySlash(dateRange.from)} – ${fmtDmySlash(dateRange.to)}`;
    const chiStr = String(chiTietInInput ?? "").trim() || "—";
    const ratioStr =
      wastePerChiTietIn == null
        ? "—"
        : `${wastePerChiTietIn.toLocaleString("vi-VN", {
            maximumFractionDigits: 6,
          })} kg (Tổng rác ÷ Chi tiết in)`;

    const pctVi = (ratio) =>
      `${(ratio * 100).toFixed(1).replace(".", ",")}%`;

    const borderThin = {
      top: { style: "thin", color: { argb: "FFCBD5E1" } },
      left: { style: "thin", color: { argb: "FFCBD5E1" } },
      bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
      right: { style: "thin", color: { argb: "FFCBD5E1" } },
    };

    const styleDataRow = (row) => {
      row.eachCell((cell, colNumber) => {
        cell.border = borderThin;
        cell.alignment = {
          vertical: "middle",
          horizontal: colNumber === 1 ? "left" : "center",
          wrapText: true,
        };
      });
    };

    const sheetName =
      toISODate(dateRange.from) === toISODate(dateRange.to)
        ? toISODate(dateRange.from)
        : `${toISODate(dateRange.from)}_${toISODate(dateRange.to)}`;

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(sheetName.slice(0, 31) || "BaoCao", {
      views: [{ showGridLines: true }],
    });

    ws.mergeCells(`A1:${lastLetter}1`);
    const titleCell = ws.getCell(1, 1);
    titleCell.value = `BÁO CÁO TỔNG HỢP VẬT TƯ & RÁC  (xuất ${formatNowStamp()})`;
    titleCell.font = { bold: true, size: 15, color: { argb: "FF1E3A5F" } };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFEFF6FF" },
    };
    titleCell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    ws.getRow(1).height = 38;

    ws.mergeCells(`A2:${lastLetter}2`);
    const metaCell = ws.getCell(2, 1);
    metaCell.value = `Khoảng ngày: ${rangeLabel}     |     Sản lượng chi tiết in: ${chiStr}     |     Rác thải trên chi tiết in: ${ratioStr}`;
    metaCell.font = { size: 11, color: { argb: "FF334155" } };
    metaCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF8FAFC" },
    };
    metaCell.alignment = {
      vertical: "middle",
      horizontal: "left",
      wrapText: true,
    };
    ws.getRow(2).height = 32;

    ws.addRow(padCells([]));

    const headerVals = [
      "BP/Tổ",
      ...MATERIALS.map((m) => m.label),
      "Tổng vật tư",
      ...TRASH_LABELS,
      "Tổng rác",
    ];
    const hRow = ws.addRow(headerVals);
    hRow.height = 28;
    hRow.eachCell((cell, colNumber) => {
      cell.border = borderThin;
      const i0 = colNumber - 1;
      const strong = i0 === idxTongVt0 || i0 === idxTongRac0;
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: strong ? "FFBEBDFE" : "FFDBEAFE" },
      };
      cell.font = { bold: true, color: { argb: "FF1E293B" } };
      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
      };
    });

    for (const row of mergedRows) {
      const r = ws.addRow(
        padCells([
          row.bp,
          ...row.serverVals.map((v) => f(v)),
          f(row.serverTotal),
          ...row.localVals.slice(0, TRASH_LABELS.length).map((v) => f(v)),
          f(row.localVals[LOCAL_ROW_TOTAL_IDX]),
        ])
      );
      styleDataRow(r);
    }

    const totRow = ws.addRow(
      padCells([
        "Tổng",
        ...grand.server.map((v) => f(v)),
        f(grand.serverTotal),
        ...grand.local.map((v) => f(v)),
        f(grand.localTotal),
      ])
    );
    totRow.height = 24;
    totRow.eachCell((cell) => {
      cell.border = borderThin;
      cell.font = { bold: true, color: { argb: "FF0F172A" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFBEBDFE" },
      };
      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
      };
    });

    ws.addRow(padCells([]));

    const chartTitleExcelRow = ws.lastRow.number + 1;
    ws.mergeCells(`A${chartTitleExcelRow}:${excelColLetter(splitMid)}${chartTitleExcelRow}`);
    const cMatHead = ws.getCell(`A${chartTitleExcelRow}`);
    cMatHead.value = "Phân tích cơ cấu các loại vật tư";
    cMatHead.font = { bold: true, size: 12, color: { argb: "FF134E4A" } };
    cMatHead.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFCCFBF1" },
    };
    cMatHead.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };

    ws.mergeCells(
      `${excelColLetter(splitMid + 1)}${chartTitleExcelRow}:${lastLetter}${chartTitleExcelRow}`
    );
    const cWasteHead = ws.getCell(
      `${excelColLetter(splitMid + 1)}${chartTitleExcelRow}`
    );
    cWasteHead.value = "Phân tích cơ cấu các loại rác thải";
    cWasteHead.font = { bold: true, size: 12, color: { argb: "FF14532D" } };
    cWasteHead.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD1FAE5" },
    };
    cWasteHead.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    ws.getRow(chartTitleExcelRow).height = 30;

    let bufMat = null;
    let bufWaste = null;
    if (materialDonutRef.current) {
      bufMat = await captureDonutElementToPngBytes(materialDonutRef.current);
    }
    if (wasteDonutRef.current) {
      bufWaste = await captureDonutElementToPngBytes(wasteDonutRef.current);
    }

    const imgExcelRow = chartTitleExcelRow + 1;
    ws.getRow(imgExcelRow).height = 245;
    const imgW = 432;
    const imgH = 302;
    const tlRow0 = imgExcelRow - 1;
    if (bufMat) {
      const id = wb.addImage({ buffer: bufMat, extension: "png" });
      ws.addImage(id, {
        tl: { col: 0, row: tlRow0 },
        ext: { width: imgW, height: imgH },
      });
    }
    if (bufWaste) {
      const id = wb.addImage({ buffer: bufWaste, extension: "png" });
      ws.addImage(id, {
        tl: { col: splitMid, row: tlRow0 },
        ext: { width: imgW, height: imgH },
      });
    }

    ws.addRow(padCells([]));
    ws.addRow(padCells([]));

    const styleBandFull = (rowNum, text, fg, bg) => {
      ws.mergeCells(`A${rowNum}:${lastLetter}${rowNum}`);
      const cell = ws.getCell(`A${rowNum}`);
      cell.value = text;
      cell.font = { bold: true, size: 11, color: { argb: fg } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: bg },
      };
      cell.alignment = {
        vertical: "middle",
        horizontal: "left",
        wrapText: true,
      };
      ws.getRow(rowNum).height = 26;
    };

    const styleSub3 = (row) => {
      row.eachCell((cell, colNumber) => {
        if (colNumber > 3) return;
        cell.border = borderThin;
        cell.font = { bold: true, color: { argb: "FF475569" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF1F5F9" },
        };
        cell.alignment = {
          vertical: "middle",
          horizontal: colNumber === 1 ? "left" : "center",
          wrapText: true,
        };
      });
    };

    const styleTotal3 = (row) => {
      row.eachCell((cell, colNumber) => {
        cell.border = borderThin;
        cell.font = { bold: true, color: { argb: "FF0F172A" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE2E8F0" },
        };
        cell.alignment = {
          vertical: "middle",
          horizontal: colNumber === 1 ? "left" : "center",
          wrapText: true,
        };
      });
    };

    let rNum = ws.lastRow.number + 1;
    styleBandFull(
      rNum,
      "Chi tiết số liệu — Phân tích cơ cấu các loại vật tư (đã loại Juse)",
      "FF134E4A",
      "FFCCFBF1"
    );
    styleSub3(ws.addRow(padCells(["Vật tư", "kg", "%"])));

    const mt = materialStructure.total;
    for (const rr of materialStructure.tableRows) {
      const pct =
        mt > 0 && Number(rr.value) > 0
          ? pctVi(Number(rr.value) / mt)
          : Number(rr.value) === 0
            ? "—"
            : "0%";
      styleDataRow(ws.addRow(padCells([rr.name, fmtKg(rr.value), pct])));
    }
    styleTotal3(
      ws.addRow(
        padCells(["Tổng", mt > 0 ? fmtKg(mt) : "—", mt > 0 ? "100%" : "—"])
      )
    );

    ws.addRow(padCells([]));
    rNum = ws.lastRow.number + 1;
    styleBandFull(
      rNum,
      "Chi tiết số liệu — Phân tích cơ cấu các loại rác thải (nhóm theo bảng trên)",
      "FF14532D",
      "FFD1FAE5"
    );
    styleSub3(ws.addRow(padCells(["Tên loại rác", "kg", "%"])));

    const wt = wasteStructure.total;
    for (const rr of wasteStructure.tableRows) {
      const pct =
        wt > 0 && Number(rr.value) > 0
          ? pctVi(Number(rr.value) / wt)
          : Number(rr.value) === 0
            ? "—"
            : "0%";
      styleDataRow(ws.addRow(padCells([rr.name, fmtKg(rr.value), pct])));
    }
    styleTotal3(
      ws.addRow(
        padCells(["Tổng", wt > 0 ? fmtKg(wt) : "—", wt > 0 ? "100%" : "—"])
      )
    );

    const colWidths = [
      16,
      ...MATERIALS.map(() => 13),
      14,
      ...TRASH_LABELS.map(() => 24),
      14,
    ];
    colWidths.forEach((w, i) => {
      ws.getColumn(i + 1).width = w;
    });

    const buf = await wb.xlsx.writeBuffer();
    const safeRange = rangeLabel.replace(/\s+/g, " ").replace(/[/\\?*[\]]/g, "-");
    saveAs(
      new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `BaoCaoVatTuRac_${safeRange}.xlsx`
    );
  };

  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);
      await exportTrashAndMaterialExcel();
    } catch (e) {
      console.error(e);
    } finally {
      setExportingExcel(false);
    }
  };

  const tableCell = "border px-1.5 py-1 text-center text-xs sm:px-2 sm:text-sm";
  const tableHead = "border px-1.5 py-2 text-xs font-medium sm:px-2 sm:text-sm";
  const stickyBpTh =
    "sticky left-0 z-20 min-w-[4.5rem] bg-blue-100 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.15)] sm:min-w-0 sm:shadow-none";
  const stickyBpTd =
    "sticky left-0 z-10 bg-white font-medium shadow-[2px_0_4px_-2px_rgba(0,0,0,0.12)] sm:bg-transparent sm:shadow-none";

  // ================= UI =================
  return (
    <div className="relative min-h-screen space-y-4 bg-slate-50 p-3 sm:space-y-6 sm:p-4">

      {loading && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-slate-900/25 backdrop-blur-[3px]"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/60 bg-white/95 px-10 py-8 shadow-xl ring-1 ring-slate-200/80">
            <FaSpinner className="h-11 w-11 animate-spin text-emerald-600" />
            <p className="text-center text-sm font-medium text-slate-700">
              Đang tải dữ liệu theo khoảng ngày…
            </p>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col gap-3 rounded-xl border bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <FaChartBar className="shrink-0 text-lg text-blue-600 sm:text-xl" />
          <h2 className="text-base font-bold leading-snug sm:text-lg">
            Báo cáo tổng hợp vật tư & rác
          </h2>
        </div>
        {EXPORT_EXCEL_REPORT && (
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={exportingExcel}
            className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60 sm:w-auto sm:py-2 active:scale-[0.98]"
          >
            {exportingExcel ? "Đang xuất…" : "📤 Xuất Excel"}
          </button>
        )}
      </div>

      {/* FILTER: dưới md — cột (ngày full width rồi sản lượng); từ md — một hàng */}
      <div className="flex flex-col gap-4 rounded-xl border bg-white p-3 shadow-sm md:flex-row md:items-end md:justify-between md:gap-6 md:p-4">
        <div className="order-1 min-w-0 w-full shrink-0 md:order-none md:w-auto">
          <label className="mb-1 block text-xs font-medium text-slate-600 md:mb-0 md:sr-only">
            Khoảng ngày
          </label>
          <DateRangeField range={dateRange} onChange={setDateRange} />
        </div>
        <div className="order-2 flex min-w-0 w-full flex-col gap-3 md:order-none md:ml-auto md:w-auto md:flex-row md:items-end md:justify-end md:gap-4">
          <div className="w-full md:w-auto md:min-w-[10rem]">
            <label
              htmlFor="trash-chi-tiet-in"
              className="mb-1 block text-xs font-medium text-slate-600"
            >
              Sản lượng chi tiết in
            </label>
            <input
              id="trash-chi-tiet-in"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              placeholder="Nhập số"
              value={chiTietInInput}
              onChange={(e) => setChiTietInInput(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none ring-blue-500/30 transition focus:border-blue-400 focus:ring-2"
            />
          </div>
          <div className="w-full md:w-auto md:min-w-[12rem]">
            <div className="mb-1 text-xs font-medium text-slate-600">
              Rác thải trên chi tiết in
              <span className="ml-1 font-normal text-slate-400">
                (Tổng rác ÷ Chi tiết in)
              </span>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm tabular-nums text-slate-800">
              {wastePerChiTietIn == null
                ? "—"
                : `${wastePerChiTietIn.toLocaleString("vi-VN", {
                    maximumFractionDigits: 6,
                  })} kg`}
            </div>
          </div>
        </div>
      </div>

      {/* TABLE — md+: một bảng; mobile: tách 2 bảng (vật tư | rác) */}
      <div className="hidden rounded-xl border bg-white shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-blue-100">
              <tr>
                <th className="border px-2 py-2">BP/Tổ</th>
                {MATERIALS.map((m) => (
                  <th key={m.key} className="border px-2 py-2">
                    {m.label}
                  </th>
                ))}
                <th className="border bg-blue-200 px-2 py-2">Tổng vật tư</th>
                {TRASH_LABELS.map((t, i) => (
                  <th key={i} className="border px-2 py-2">
                    {t}
                  </th>
                ))}
                <th className="border bg-blue-200 px-2 py-2">Tổng rác</th>
              </tr>
            </thead>
            <tbody>
              {mergedRows.map((r, i) => (
                <tr key={`${normBpKey(r.bp)}-${i}`}>
                  <td className="border px-2 py-1 text-center font-medium">
                    {r.bp}
                  </td>
                  {r.serverVals.map((v, j) => (
                    <td key={j} className="border px-2 py-1 text-center">
                      {f(v)}
                    </td>
                  ))}
                  <td className="border bg-blue-50 px-2 py-1 text-center font-semibold">
                    {f(r.serverTotal)}
                  </td>
                  {r.localVals.slice(0, TRASH_LABELS.length).map((v, j) => (
                    <td key={j} className="border px-2 py-1 text-center">
                      {f(v)}
                    </td>
                  ))}
                  <td className="border bg-blue-50 px-2 py-1 text-center font-semibold">
                    {f(r.localVals[LOCAL_ROW_TOTAL_IDX])}
                  </td>
                </tr>
              ))}
              <tr className="bg-blue-200 font-bold">
                <td className="border px-2 py-2 text-center">Tổng</td>
                {grand.server.map((v, j) => (
                  <td key={j} className="border px-2 py-2 text-center">
                    {f(v)}
                  </td>
                ))}
                <td className="border px-2 py-2 text-center">
                  {f(grand.serverTotal)}
                </td>
                {grand.local.map((v, j) => (
                  <td key={j} className="border px-2 py-2 text-center">
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
      </div>

      <div className="space-y-4 md:hidden">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-blue-50/90 px-3 py-2">
            <h3 className="text-sm font-semibold text-slate-800">
              Vật tư theo BP/Tổ
            </h3>
          </div>
          <div className="overflow-x-auto overscroll-x-contain">
            <table className="min-w-max w-full text-sm">
              <thead className="bg-blue-100">
                <tr>
                  <th className={`${tableHead} ${stickyBpTh}`}>BP/Tổ</th>
                  {MATERIALS.map((m) => (
                    <th key={m.key} className={`${tableHead} whitespace-nowrap`}>
                      {m.label}
                    </th>
                  ))}
                  <th className={`${tableHead} whitespace-nowrap bg-blue-200`}>
                    Tổng vật tư
                  </th>
                </tr>
              </thead>
              <tbody>
                {mergedRows.map((r, i) => (
                  <tr
                    key={`m-${normBpKey(r.bp)}-${i}`}
                    className="odd:bg-white even:bg-slate-50/60"
                  >
                    <td className={`${tableCell} ${stickyBpTd} text-left sm:text-center`}>
                      {r.bp}
                    </td>
                    {r.serverVals.map((v, j) => (
                      <td key={j} className={`${tableCell} tabular-nums`}>
                        {f(v)}
                      </td>
                    ))}
                    <td
                      className={`${tableCell} bg-blue-50 font-semibold tabular-nums`}
                    >
                      {f(r.serverTotal)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-blue-200 font-bold">
                  <td
                    className={`${tableCell} ${stickyBpTh.replace("bg-blue-100", "bg-blue-200")} z-20 text-left sm:text-center`}
                  >
                    Tổng
                  </td>
                  {grand.server.map((v, j) => (
                    <td key={j} className={`${tableCell} tabular-nums`}>
                      {f(v)}
                    </td>
                  ))}
                  <td className={`${tableCell} tabular-nums`}>
                    {f(grand.serverTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-emerald-50/90 px-3 py-2">
            <h3 className="text-sm font-semibold text-slate-800">
              Rác thải theo BP/Tổ
            </h3>
          </div>
          <div className="overflow-x-auto overscroll-x-contain">
            <table className="min-w-max w-full text-sm">
              <thead className="bg-emerald-100">
                <tr>
                  <th className={`${tableHead} sticky left-0 z-20 min-w-[4.5rem] bg-emerald-100 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.15)]`}>
                    BP/Tổ
                  </th>
                  {TRASH_LABELS.map((t, j) => (
                    <th
                      key={j}
                      className={`${tableHead} max-w-[6rem] whitespace-normal leading-tight sm:max-w-none`}
                    >
                      {t}
                    </th>
                  ))}
                  <th className={`${tableHead} whitespace-nowrap bg-emerald-200`}>
                    Tổng rác
                  </th>
                </tr>
              </thead>
              <tbody>
                {mergedRows.map((r, i) => (
                  <tr
                    key={`t-${normBpKey(r.bp)}-${i}`}
                    className="odd:bg-white even:bg-slate-50/60"
                  >
                    <td
                      className={`${tableCell} sticky left-0 z-10 bg-white font-medium shadow-[2px_0_4px_-2px_rgba(0,0,0,0.12)] sm:bg-transparent sm:shadow-none text-left sm:text-center`}
                    >
                      {r.bp}
                    </td>
                    {r.localVals.slice(0, TRASH_LABELS.length).map((v, j) => (
                      <td key={j} className={`${tableCell} tabular-nums`}>
                        {f(v)}
                      </td>
                    ))}
                    <td
                      className={`${tableCell} bg-emerald-50 font-semibold tabular-nums`}
                    >
                      {f(r.localVals[LOCAL_ROW_TOTAL_IDX])}
                    </td>
                  </tr>
                ))}
                <tr className="bg-emerald-200 font-bold">
                  <td className="sticky left-0 z-20 min-w-[4.5rem] border bg-emerald-200 px-1.5 py-2 text-left text-xs shadow-[2px_0_4px_-2px_rgba(0,0,0,0.15)] sm:px-2 sm:text-sm sm:text-center">
                    Tổng
                  </td>
                  {grand.local.map((v, j) => (
                    <td key={j} className={`${tableCell} tabular-nums`}>
                      {f(v)}
                    </td>
                  ))}
                  <td className={`${tableCell} tabular-nums`}>
                    {f(grand.localTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Thống kê cơ cấu — mobile: bảng rồi biểu đồ; tablet+: lưới 1–2 cột */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
        <div className="isolate overflow-visible rounded-xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100/80">
          <div className="overflow-hidden rounded-t-xl border-b border-slate-100 bg-gradient-to-r from-teal-50/90 to-cyan-50/60 px-4 py-3 sm:px-5">
            <h3 className="text-base font-semibold text-slate-800">
              Phân tích cơ cấu các loại vật tư
            </h3>
          </div>
          <div className="flex flex-col gap-5 p-4 sm:p-5 xl:flex-row xl:items-stretch xl:gap-6">
            <div className="w-full min-w-0 overflow-x-auto rounded-xl border border-slate-100 bg-slate-50/40 xl:max-w-[min(100%,340px)] xl:shrink-0">
              <table className="min-w-full border-separate border-spacing-0 text-sm">
                <thead className="bg-slate-100/90">
                  <tr>
                    <th className="border-b border-slate-200 border-l-[6px] border-l-transparent px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Vật tư
                    </th>
                    <th className="border-b border-slate-200 px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                      kg
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {materialStructure.tableRows.map((r) => (
                    <tr key={r.key} className="border-b border-slate-100/80 last:border-0">
                      <td
                        className="border-l-[6px] border-solid px-3 py-2 text-slate-700"
                        style={{
                          borderLeftColor: legendStripeColor(
                            materialStructure.pieRows,
                            (p) => p.key === r.key
                          ),
                        }}
                      >
                        {r.name}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-800">
                        {fmtKg(r.value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div
              ref={materialDonutRef}
              className="min-w-0 flex-1 overflow-visible rounded-lg bg-white"
            >
              <StructureDonutChart
                data={materialStructure.pieRows}
                total={materialStructure.total}
                emptyLabel="Không có dữ liệu vật tư trong khoảng ngày đã chọn."
              />
            </div>
          </div>
        </div>

        <div className="isolate overflow-visible rounded-xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100/80">
          <div className="overflow-hidden rounded-t-xl border-b border-slate-100 bg-gradient-to-r from-emerald-50/90 to-teal-50/60 px-4 py-3 sm:px-5">
            <h3 className="text-base font-semibold text-slate-800">
              Phân tích cơ cấu các loại rác thải
            </h3>
          </div>
          <div className="flex flex-col gap-5 p-4 sm:p-5 xl:flex-row xl:items-stretch xl:gap-6">
            <div className="w-full min-w-0 overflow-x-auto rounded-xl border border-slate-100 bg-slate-50/40 xl:max-w-[min(100%,340px)] xl:shrink-0">
              <table className="min-w-full border-separate border-spacing-0 text-sm">
                <thead className="bg-slate-100/90">
                  <tr>
                    <th className="border-b border-slate-200 border-l-[6px] border-l-transparent px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Tên loại rác
                    </th>
                    <th className="border-b border-slate-200 px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                      kg
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {wasteStructure.tableRows.map((r) => (
                    <tr key={r.name} className="border-b border-slate-100/80 last:border-0">
                      <td
                        className="border-l-[6px] border-solid px-3 py-2 text-slate-700"
                        style={{
                          borderLeftColor: legendStripeColor(
                            wasteStructure.pieRows,
                            (p) => p.name === r.name
                          ),
                        }}
                      >
                        {r.name}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-800">
                        {fmtKg(r.value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div
              ref={wasteDonutRef}
              className="min-w-0 flex-1 overflow-visible rounded-lg bg-white"
            >
              <StructureDonutChart
                data={wasteStructure.pieRows}
                total={wasteStructure.total}
                emptyLabel="Không có dữ liệu rác trong khoảng ngày đã chọn."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TrashAndMaterial;