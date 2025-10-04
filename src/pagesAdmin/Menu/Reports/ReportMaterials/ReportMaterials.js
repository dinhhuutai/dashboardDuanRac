// // src/pages/Reports/ReportMaterials.jsx
// import { useEffect, useMemo, useState } from "react";
// import * as XLSX from "xlsx";
// import { motion } from "framer-motion";
// import { FiPackage } from "react-icons/fi";
// import { FaSpinner } from "react-icons/fa";
// import { BASE_URL } from "~/config";

// /* ================== Cấu hình ================== */
// const TEAMS = ["C1", "C2", "C3", "C4", "CTM"];
// const FIXED_IDX = { TO_IN: 2, TEN: 20, DVT: 21 };
// const CAND_CONG = [
//   "cong",
//   "cộng",
//   "tong cong",
//   "tổng cộng",
//   "cong (gram)",
//   "tong cong (gram)",
//   "cộng (gram)",
//   "tổng cộng (gram)",
// ];
// const CAND_VATTU = ["vat tu", "vật tư", "vat_tu"];

// /* ================== Helpers ================== */
// const vn = (s) =>
//   String(s ?? "")
//     .normalize("NFKD")
//     .replace(/[\u0300-\u036f]/g, "")
//     .replace(/\s+/g, " ")
//     .trim()
//     .toLowerCase();

// const makeKey = (s) =>
//   String(s || "")
//     .normalize("NFKD")
//     .replace(/[\u0300-\u036f]/g, "")
//     .toLowerCase()
//     .replace(/\s+/g, "_")
//     .replace(/[^a-z0-9_]/g, "");

// const getNumber = (cell) => {
//   if (cell === null || cell === undefined || cell === "") return 0;
//   if (typeof cell === "number") return cell;
//   const n = parseFloat(String(cell).replace(/\s/g, "").replace(/\./g, "").replace(",", "."));
//   return isNaN(n) ? 0 : n;
// };

// const round2 = (n) => Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100;
// const fmt2 = (n) =>
//   round2(n).toLocaleString("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// function findHeaderRow(rows2D) {
//   for (let i = 0; i < Math.min(rows2D.length, 15); i++) {
//     const row = rows2D[i] || [];
//     const normed = row.map(vn);
//     if (normed.includes("ten") || normed.includes("dvt") || normed.includes("đvt")) return i;
//   }
//   return 4;
// }

// function findColByNames(row, candidates) {
//   const map = {};
//   row.forEach((v, idx) => (map[vn(v)] = idx));
//   for (const c of candidates) if (map[c] !== undefined) return map[c];
//   return -1;
// }

// async function parseExcelWithFixedCols(file) {
//   const buf = await file.arrayBuffer();
//   const wb = XLSX.read(buf, { type: "array" });
//   const ws = wb.Sheets[wb.SheetNames[0]];
//   const rows2D = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, raw: true });

//   const headerIdx = findHeaderRow(rows2D);
//   const headerRow = rows2D[headerIdx] || [];

//   const idxCong = findColByNames(headerRow, CAND_CONG);
//   const idxVatTu = findColByNames(headerRow, CAND_VATTU);
//   if (idxCong < 0 && idxVatTu < 0) throw new Error("Không tìm thấy cột 'Cộng' hoặc 'Vật tư'.");

//   return { rows2D, headerIdx, idxCong, idxVatTu };
// }

// /* ====== GỘP vật tư có cùng label (materialName) ====== */
// function groupMaterials(materialList = []) {
//   const map = new Map();
//   for (const m of materialList) {
//     const label = m.label || "";
//     const k = makeKey(label);
//     const g = map.get(label) || {
//       key: k,
//       label,
//       ingredients: new Set(),
//       units: new Set(),
//     };
//     if (m.ingredient) g.ingredients.add(vn(m.ingredient));
//     (m.units || []).forEach((u) => g.units.add(vn(u)));
//     map.set(label, g);
//   }
//   const arr = Array.from(map.values()).map((g) => {
//     const units = Array.from(g.units);
//     if (units.includes("cuộn") && !units.includes("cuon")) units.push("cuon");
//     return {
//       key: g.key,
//       label: g.label,
//       ingredients: Array.from(g.ingredients),
//       units,
//     };
//   });
//   return arr;
// }

// /* ====== Rule lọc tiền tố cho “Mực” (fallback từ Excel) ====== */
// const BAD_PREFIXES = ["Bao", "Bột", "Cát", "Chui", "In ", "keo ", "lapa", "Mỡ", "Vit"];
// const startsWithAnyPrefix = (name, prefixes) => {
//   const s = vn(name);
//   return prefixes.some((p) => s.startsWith(vn(p)));
// };

// /* ====== Chunking + Fallback nhóm “Mực” ====== */
// const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));
// async function aggregateInChunks({
//   rows2D, headerIdx, idxCong, idxVatTu, materials, TEAMS,
//   chunkSize = 2000, onProgress = () => {},
// }) {
//   const matrix = {}, colTotals = {};
//   TEAMS.forEach(t => { matrix[t] = {}; materials.forEach(m => (matrix[t][m.label] = 0)); matrix[t].total = 0; });
//   materials.forEach(m => (colTotals[m.label] = 0));

//   const teamSet = new Set(TEAMS.map(vn));
//   const defs = materials.map(m => ({
//     label: m.label,
//     ingredients: new Set((m.ingredients || []).map(vn)),
//     units: new Set((m.units || []).map(vn)),
//     acceptsCuon: (m.units || []).map(vn).some(u => u === "cuộn" || u === "cuon"),
//     isLapaGroup: vn(m.label) === vn("Mực lapa"),   // << thêm dòng này
//   }));
//   const inkIndex = materials.findIndex(m => vn(m.label) === vn("Mực"));
//   const inkDef = inkIndex >= 0 ? defs[inkIndex] : null;

//   const isCuon = u => u === "cuộn" || u === "cuon";
//   const CUON_TO_KG = 0.2;

//   const start = headerIdx + 1, end = rows2D.length;
//   let i = start;
//   while (i < end) {
//     const j = Math.min(i + chunkSize, end);
//     for (let r = i; r < j; r++) {
//       const row = rows2D[r] || [];
//       const toIn = String(row[FIXED_IDX.TO_IN] || "").trim();
//       const ten  = String(row[FIXED_IDX.TEN]  || "").trim();
//       const dvt  = String(row[FIXED_IDX.DVT]  || "").trim();
//       const vCong  = idxCong  >= 0 ? row[idxCong]  : "";
//       const vVatTu = idxVatTu >= 0 ? row[idxVatTu] : "";

//       if ([toIn, ten, dvt, vCong, vVatTu].every(x => (x ?? "") === "")) continue;

//       // tách 2 biến lượng
//       const qtyCong = getNumber(vCong);                  // chỉ cột "Cộng"
//       const qtyAny  = qtyCong || getNumber(vVatTu);      // "Cộng" hoặc "Vật tư"

//       const teamKey = vn(toIn);
//       if (!teamSet.has(teamKey)) continue;

//       const nameInRow = vn(ten);
//       const unitInRow = vn(dvt);

//       let matched = false;

//       // 1) match các nhóm TRƯỚC "Mực" -> dùng qtyAny
//       // 1) match các nhóm TRƯỚC "Mực" -> dùng qtyAny
// for (let gIdx = 0; gIdx < defs.length; gIdx++) {
//   if (gIdx === inkIndex) continue;
//   const m = defs[gIdx];

//   if (!qtyAny) break;

//   // == THAY ĐIỀU KIỆN MATCH Ở ĐÂY ==
//   // Nếu là nhóm "Mực lapa" -> bắt tên bắt đầu bằng "lapa"
//   // Ngược lại -> dùng danh sách ingredient như cũ
//   const isMatch = m.isLapaGroup
//     ? vn(ten).startsWith("lapa")
//     : m.ingredients.has(vn(ten));

//   if (!isMatch) continue;

//   let adjQty = qtyAny;
//   if (m.acceptsCuon && (vn(dvt) === "cuộn" || vn(dvt) === "cuon")) {
//     adjQty = qtyAny * 0.2;
//   } else if (m.units.size > 0 && !m.units.has(vn(dvt))) {
//     continue;
//   }

//   matrix[toIn][materials[gIdx].label] += adjQty;
//   matched = true;
//   break;
// }


//       // 2) fallback cho "Mực" -> chỉ dùng qtyCong
//       if (!matched && inkDef && qtyCong) {
//         if (startsWithAnyPrefix(ten, BAD_PREFIXES)) continue;

//         let adjQty = qtyCong;
//         if (inkDef.acceptsCuon && isCuon(unitInRow)) adjQty = qtyCong * CUON_TO_KG;
//         else if (inkDef.units.size > 0 && !inkDef.units.has(unitInRow)) continue;

//         matrix[toIn][materials[inkIndex].label] += adjQty;
//       }
//     }
//     onProgress(((j - start) / (end - start)) * 100);
//     await nextFrame();
//     i = j;
//   }

//   // Tổng kết
//   let grandTotal = 0;
//   for (const t of TEAMS) {
//     let rowSum = 0;
//     for (const m of materials) {
//       const v = matrix[t][m.label] || 0;
//       rowSum += v; colTotals[m.label] += v;
//     }
//     matrix[t].total = rowSum; grandTotal += rowSum;
//   }
//   return { dataByTeam: matrix, colTotals, grandTotal };
// }


// /* ================== Component ================== */
// export default function ReportMaterials() {
//   const [isLoading, setIsLoading] = useState(false);
//   const [progress, setProgress] = useState(0);
//   const [dataByTeam, setDataByTeam] = useState({});
//   const [colTotals, setColTotals] = useState({});
//   const [grandTotal, setGrandTotal] = useState(0);
//   const [materials, setMaterials] = useState([]);

//   // tải danh sách vật tư từ API và gộp theo label (KHÔNG lọc trước nhóm “Mực”)
//   useEffect(() => {
//     (async () => {
//       const res = await fetch(`${BASE_URL}/api/materials?active=1`);
//       const json = await res.json();
//       if (json.success) {
//         const grouped = groupMaterials(json.data || []);
//         setMaterials(grouped);
//       }
//     })();
//   }, []);

//   const canUpload = useMemo(() => materials.length > 0, [materials]);

//   const handleFileUpload = async (e) => {
//     setIsLoading(true);
//     setProgress(0);
//     try {
//       const file = e.target.files?.[0];
//       if (!file || !canUpload) return;

//       const { rows2D, headerIdx, idxCong, idxVatTu } = await parseExcelWithFixedCols(file);

//       const { dataByTeam, colTotals, grandTotal } = await aggregateInChunks({
//         rows2D,
//         headerIdx,
//         idxCong,
//         idxVatTu,
//         materials,
//         TEAMS,
//         chunkSize: 2000,
//         onProgress: (p) => setProgress(p),
//       });

//       setDataByTeam(dataByTeam);
//       setColTotals(colTotals);
//       setGrandTotal(grandTotal);
//     } catch (err) {
//       console.error("Lỗi xử lý file:", err);
//       setDataByTeam({});
//       setColTotals({});
//       setGrandTotal(0);
//     } finally {
//       setIsLoading(false);
//       setProgress(0);
//       e.target.value = "";
//     }
//   };

//   return (
//     <div className="p-4">
//       {(isLoading || progress > 0) && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
//           <div className="flex flex-col items-center gap-3 bg-white/90 rounded-xl p-5 shadow">
//             <FaSpinner className="animate-spin text-teal-600 text-4xl" />
//             <div className="text-gray-700 text-sm font-medium">
//               Đang xử lý file… {progress ? `${fmt2(progress)}%` : ""}
//             </div>
//             <div className="w-64 h-2 bg-gray-200 rounded">
//               <div className="h-2 bg-teal-500 rounded" style={{ width: `${Math.min(progress, 100)}%` }} />
//             </div>
//           </div>
//         </div>
//       )}

//       <div className="p-2 space-y-6 bg-white rounded-[6px]">
//         <div className="relative space-y-6 bg-white rounded-2xl p-6 z-10">
//           <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
//             className="text-2xl font-bold text-teal-700 flex items-center gap-2">
//             <FiPackage /> Kê xuất vật tư
//           </motion.h1>

//           <div>
//             <label htmlFor="fileInput"
//               className={`cursor-pointer inline-block px-6 py-2 text-white rounded-xl font-medium ${
//                 canUpload ? "bg-teal-600 hover:bg-teal-700" : "bg-gray-400 cursor-not-allowed"
//               }`}>
//               Chọn file Excel
//             </label>
//             <input id="fileInput" type="file" accept=".xlsx,.xls" className="hidden"
//               onChange={handleFileUpload} disabled={!canUpload || isLoading} />
//             {!canUpload && <div className="text-sm text-amber-600 mt-2">* Đang tải danh mục vật tư…</div>}
//           </div>

//           {Object.keys(dataByTeam).length > 0 && (
//             <div className="overflow-x-auto rounded-lg border border-gray-300 mt-6">
//               <table className="min-w-full text-sm text-left border-collapse">
//                 <thead className="bg-yellow-100 sticky top-0 z-10">
//                   <tr>
//                     <th className="border px-3 py-2 font-bold text-center bg-yellow-200">BP/Tổ</th>
//                     {materials.map((m) => (
//                       <th key={m.key} className="border px-3 py-2 font-bold">{m.label} (kg)</th>
//                     ))}
//                     <th className="border px-3 py-2 font-bold text-center bg-yellow-200">Tổng (kg)</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {TEAMS.map((t, i) => (
//                     <tr key={t} className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-yellow-50`}>
//                       <td className="border px-3 py-2 text-center font-medium">{t}</td>
//                       {materials.map((m) => (
//                         <td key={m.key} className="border px-3 py-2 text-right">
//                           {fmt2(dataByTeam[t][m.label] || 0)}
//                         </td>
//                       ))}
//                       <td className="border px-3 py-2 text-right font-semibold">
//                         {fmt2(dataByTeam[t].total || 0)}
//                       </td>
//                     </tr>
//                   ))}
//                   <tr className="bg-yellow-100 font-semibold">
//                     <td className="border px-3 py-2 text-center">Tổng cộng</td>
//                     {materials.map((m) => (
//                       <td key={m.key} className="border px-3 py-2 text-right">
//                         {fmt2(colTotals[m.label] || 0)}
//                       </td>
//                     ))}
//                     <td className="border px-3 py-2 text-right">{fmt2(grandTotal || 0)}</td>
//                   </tr>
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }



// src/pagesAdmin/Menu/Reports/ReportMaterials/ReportMaterials.js
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FiPackage } from "react-icons/fi";
import { FaSpinner } from "react-icons/fa";
import { BASE_URL } from "~/config";

const TEAMS = ["C1", "C2", "C3", "C4", "CTM"];
const fmt2 = (n) =>
  (Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100).toLocaleString("vi-VN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function ReportMaterials() {
  const [isLoading, setIsLoading] = useState(false);

  // ===== % ẢO =====
  const [fakeProgress, setFakeProgress] = useState(0);
  const fakeTimerRef = useRef(null);
  const startFakeProgress = () => {
    clearInterval(fakeTimerRef.current);
    setFakeProgress(0);
    // tăng nhanh lúc đầu, chậm dần về sau tới ~92%
    fakeTimerRef.current = setInterval(() => {
      setFakeProgress((p) => {
        const cap = 92;             // trần ảo
        if (p >= cap) return p;
        const step = Math.max(0.2, (100 - p) * 0.015); // easing
        const next = Math.min(p + step, cap);
        return next;
      });
    }, 80);
  };
  const finishFakeProgress = () => {
    clearInterval(fakeTimerRef.current);
    setFakeProgress(100);
    setTimeout(() => {
      setIsLoading(false);
      setFakeProgress(0);
    }, 350);
  };
  const stopFakeProgress = () => {
    clearInterval(fakeTimerRef.current);
    setFakeProgress(0);
  };

  // ===== dữ liệu báo cáo =====
  const [materialsRaw, setMaterialsRaw] = useState([]);
  const [materialsCols, setMaterialsCols] = useState([]);
  const [dataByTeam, setDataByTeam] = useState({});
  const [colTotals, setColTotals] = useState({});
  const [grandTotal, setGrandTotal] = useState(0);

  const workerRef = useRef(null);

  // tải danh mục vật tư
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/materials?active=1`);
        const json = await res.json();
        if (json?.success) {
          const rows = (json.data || []).map((r) => ({
            label: r.label,
            ingredient: r.ingredient,
            units: Array.isArray(r.units) ? r.units : (r.unit ? [r.unit] : ["kg"]),
          }));
          setMaterialsRaw(rows);
        }
      } catch (e) {
        console.error("Load materials error:", e);
      }
    })();
  }, []);

  // khởi tạo worker (không cần nhận progress nữa)
  useEffect(() => {
    const w = new Worker(new URL("./materialsWorker.js", import.meta.url), { type: "module" });
    workerRef.current = w;
    w.onmessage = (e) => {
      const { type, payload, message } = e.data || {};
      if (type === "error") {
        console.error("Worker error:", message);
        stopFakeProgress();
        setIsLoading(false);
      }
      if (type === "done") {
        setDataByTeam(payload.dataByTeam || {});
        setColTotals(payload.colTotals || {});
        setGrandTotal(payload.grandTotal || 0);
        setMaterialsCols(payload.materials || []);
        // khi xong -> chạy 100% rồi tắt
        finishFakeProgress();
      }
    };
    return () => {
      w.terminate();
      workerRef.current = null;
    };
  }, []);

  const canUpload = useMemo(() => materialsRaw.length > 0 && !!workerRef.current, [materialsRaw]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // cho phép chọn lại cùng file
    if (!file || !canUpload) return;

    setIsLoading(true);
    startFakeProgress();       // bật % ảo

    try {
      const buf = await file.arrayBuffer();
      // Transferable để không copy bộ nhớ (nhanh hơn)
      workerRef.current.postMessage(
        { arrayBuffer: buf, materials: materialsRaw, teams: TEAMS, chunkSize: 2500 },
        [buf]
      );
    } catch (err) {
      console.error("Upload handle error:", err);
      stopFakeProgress();
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4">
      {(isLoading || fakeProgress > 0) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 bg-white/90 rounded-xl p-5 shadow">
            <FaSpinner className="animate-spin text-teal-600 text-4xl" />
            <div className="text-gray-700 text-sm font-medium">
              Đang xử lý file… {fakeProgress ? `${fmt2(fakeProgress)}%` : ""}
            </div>
            <div className="w-64 h-2 bg-gray-200 rounded">
              <div
                className="h-2 bg-teal-500 rounded transition-all"
                style={{ width: `${Math.min(fakeProgress, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="p-2 space-y-6 bg-white rounded-[6px]">
        <div className="relative space-y-6 bg-white rounded-2xl p-6 z-10">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-2xl font-bold text-teal-700 flex items-center gap-2"
          >
            <FiPackage /> Kê xuất vật tư
          </motion.h1>

          <div>
            <label
              htmlFor="fileInput"
              className={`cursor-pointer inline-block px-6 py-2 text-white rounded-xl font-medium ${
                canUpload ? "bg-teal-600 hover:bg-teal-700" : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              Chọn file Excel
            </label>
            <input
              id="fileInput"
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileUpload}
              disabled={!canUpload || isLoading}
            />
            {!canUpload && (
              <div className="text-sm text-amber-600 mt-2">* Đang tải danh mục vật tư…</div>
            )}
          </div>

          {Object.keys(dataByTeam).length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-gray-300 mt-6">
              <table className="min-w-full text-sm text-left border-collapse">
                <thead className="bg-yellow-100 sticky top-0 z-10">
                  <tr>
                    <th className="border px-3 py-2 font-bold text-center bg-yellow-200">BP/Tổ</th>
                    {materialsCols.map((m) => (
                      <th key={m.key} className="border px-3 py-2 font-bold">
                        {m.label} (kg)
                      </th>
                    ))}
                    <th className="border px-3 py-2 font-bold text-center bg-yellow-200">Tổng (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {TEAMS.map((t, i) => (
                    <tr key={t} className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-yellow-50`}>
                      <td className="border px-3 py-2 text-center font-medium">{t}</td>
                      {materialsCols.map((m) => (
                        <td key={m.key} className="border px-3 py-2 text-right">
                          {fmt2(dataByTeam[t][m.label] || 0)}
                        </td>
                      ))}
                      <td className="border px-3 py-2 text-right font-semibold">
                        {fmt2(dataByTeam[t].total || 0)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-yellow-100 font-semibold">
                    <td className="border px-3 py-2 text-center">Tổng cộng</td>
                    {materialsCols.map((m) => (
                      <td key={m.key} className="border px-3 py-2 text-right">
                        {fmt2(colTotals[m.label] || 0)}
                      </td>
                    ))}
                    <td className="border px-3 py-2 text-right">{fmt2(grandTotal || 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


