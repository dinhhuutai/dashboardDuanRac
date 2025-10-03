// src/pages/Reports/ReportMaterials.jsx
import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { motion } from "framer-motion";
import { FiPackage } from "react-icons/fi";
import { FaSpinner } from "react-icons/fa";
import { BASE_URL } from "~/config";

/* ================== Cấu hình ================== */
const TEAMS = ["C1", "C2", "C3", "C4", "CTM"];
const FIXED_IDX = { TO_IN: 2, TEN: 20, DVT: 21 };
const CAND_CONG = [
  "cong",
  "cộng",
  "tong cong",
  "tổng cộng",
  "cong (gram)",
  "tong cong (gram)",
  "cộng (gram)",
  "tổng cộng (gram)",
];
const CAND_VATTU = ["vat tu", "vật tư", "vat_tu"];

/* ================== Helpers ================== */
const vn = (s) =>
  String(s ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const makeKey = (s) =>
  String(s || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

const getNumber = (cell) => {
  if (cell === null || cell === undefined || cell === "") return 0;
  if (typeof cell === "number") return cell;
  const n = parseFloat(String(cell).replace(/\s/g, "").replace(/\./g, "").replace(",", "."));
  return isNaN(n) ? 0 : n;
};

const round2 = (n) => Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100;
const fmt2 = (n) =>
  round2(n).toLocaleString("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function findHeaderRow(rows2D) {
  for (let i = 0; i < Math.min(rows2D.length, 15); i++) {
    const row = rows2D[i] || [];
    const normed = row.map(vn);
    if (normed.includes("ten") || normed.includes("dvt") || normed.includes("đvt")) return i;
  }
  return 4; // fallback hàng 5
}

function findColByNames(row, candidates) {
  const map = {};
  row.forEach((v, idx) => (map[vn(v)] = idx));
  for (const c of candidates) if (map[c] !== undefined) return map[c];
  return -1;
}

async function parseExcelWithFixedCols(file) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  // dùng dense array để nhẹ hơn
  const rows2D = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, raw: true });

  const headerIdx = findHeaderRow(rows2D);
  const headerRow = rows2D[headerIdx] || [];

  const idxCong = findColByNames(headerRow, CAND_CONG);
  const idxVatTu = findColByNames(headerRow, CAND_VATTU);
  if (idxCong < 0 && idxVatTu < 0) {
    throw new Error("Không tìm thấy cột 'Cộng' hoặc 'Vật tư' trong header.");
  }

  return { rows2D, headerIdx, idxCong, idxVatTu };
}

/* ====== GỘP vật tư có cùng label (materialName) ====== */
function groupMaterials(materialList = []) {
  const map = new Map();
  for (const m of materialList) {
    const label = m.label || "";
    const k = makeKey(label);
    const g = map.get(label) || {
      key: k,
      label,
      ingredients: new Set(),
      units: new Set(),
    };
    if (m.ingredient) g.ingredients.add(vn(m.ingredient));
    (m.units || []).forEach((u) => g.units.add(vn(u)));
    map.set(label, g);
  }
  // mở rộng 'cuộn' -> 'cuon' nếu có
  const arr = Array.from(map.values()).map((g) => {
    const units = Array.from(g.units);
    if (units.includes("cuộn") && !units.includes("cuon")) units.push("cuon");
    return {
      key: g.key,
      label: g.label,
      ingredients: Array.from(g.ingredients),
      units,
    };
  });
  return arr;
}

/* ====== Chunking trên main thread ====== */
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));
async function aggregateInChunks({
  rows2D,
  headerIdx,
  idxCong,
  idxVatTu,
  materials,
  TEAMS,
  chunkSize = 2000,
  onProgress = () => {},
}) {
  // Khởi tạo ma trận
  const matrix = {};
  const colTotals = {};
  TEAMS.forEach((t) => {
    matrix[t] = {};
    materials.forEach((m) => (matrix[t][m.label] = 0));
    matrix[t].total = 0;
  });
  materials.forEach((m) => (colTotals[m.label] = 0));

  // Chuẩn bị lookup nhanh
  const teamSet = new Set(TEAMS.map(vn));
  const defs = materials.map((m) => ({
    label: m.label,
    ingredients: new Set((m.ingredients || []).map(vn)),
    units: new Set((m.units || []).map(vn)),
    acceptsCuon: (m.units || []).map(vn).some((u) => u === "cuộn" || u === "cuon"),
  }));
  const isCuon = (u) => u === "cuộn" || u === "cuon";
  const CUON_TO_KG = 0.2;

  const start = headerIdx + 1;
  const end = rows2D.length;
  let i = start;
  while (i < end) {
    const j = Math.min(i + chunkSize, end);
    for (let r = i; r < j; r++) {
      const row = rows2D[r] || [];

      const toIn = String(row[FIXED_IDX.TO_IN] || "").trim();
      const ten = String(row[FIXED_IDX.TEN] || "").trim();
      const dvt = String(row[FIXED_IDX.DVT] || "").trim();
      const vCong = idxCong >= 0 ? row[idxCong] : "";
      const vVatTu = idxVatTu >= 0 ? row[idxVatTu] : "";

      if ([toIn, ten, dvt, vCong, vVatTu].every((x) => (x ?? "") === "")) continue;

      // Không gọi row.some(vn(...)) để tiết kiệm — bỏ qua kiểm tra này
      // (Nếu bạn cần, đặt idx cho cột ghi "Tổng" cụ thể thay vì quét cả hàng)

      const qty = getNumber(vCong) || getNumber(vVatTu);
      if (!qty) continue;

      const teamKey = vn(toIn);
      if (!teamSet.has(teamKey)) continue;

      const nameInRow = vn(ten);
      const unitInRow = vn(dvt);

      for (const m of defs) {
        if (!m.ingredients.has(nameInRow)) continue;

        let adjQty = qty;
        if (m.acceptsCuon && isCuon(unitInRow)) {
          adjQty = qty * CUON_TO_KG;
        } else {
          if (m.units.size > 0 && !m.units.has(unitInRow)) continue;
        }

        matrix[toIn][m.label] += adjQty;
      }
    }

    // báo tiến độ & nhường frame để UI render
    onProgress(((j - start) / (end - start)) * 100);
    await nextFrame();
    i = j;
  }

  // Tổng kết
  let grandTotal = 0;
  for (const t of TEAMS) {
    let rowSum = 0;
    for (const m of materials) {
      const v = matrix[t][m.label] || 0;
      rowSum += v;
      colTotals[m.label] += v;
    }
    matrix[t].total = rowSum;
    grandTotal += rowSum;
  }

  return { dataByTeam: matrix, colTotals, grandTotal };
}

/* ================== Component ================== */
export default function ReportMaterials() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dataByTeam, setDataByTeam] = useState({});
  const [colTotals, setColTotals] = useState({});
  const [grandTotal, setGrandTotal] = useState(0);
  const [materials, setMaterials] = useState([]);

  // tải danh sách vật tư (từ API /api/materials) và gộp theo label
  useEffect(() => {
    (async () => {
      const res = await fetch(`${BASE_URL}/api/materials?active=1`);
      const json = await res.json();

      if (json.success) {
        const grouped = groupMaterials(json.data || []);
        setMaterials(grouped);
      }
    })();
  }, []);

  const canUpload = useMemo(() => materials.length > 0, [materials]);

  const handleFileUpload = async (e) => {
    setIsLoading(true);
    setProgress(0);
    try {
      const file = e.target.files?.[0];
      if (!file || !canUpload) return;

      const { rows2D, headerIdx, idxCong, idxVatTu } = await parseExcelWithFixedCols(file);

      const { dataByTeam, colTotals, grandTotal } = await aggregateInChunks({
        rows2D,
        headerIdx,
        idxCong,
        idxVatTu,
        materials,
        TEAMS,
        chunkSize: 2000, // tùy chỉnh 1000-5000 tùy máy
        onProgress: (p) => setProgress(p),
      });

      setDataByTeam(dataByTeam);
      setColTotals(colTotals);
      setGrandTotal(grandTotal);
    } catch (err) {
      console.error("Lỗi xử lý file:", err);
      setDataByTeam({});
      setColTotals({});
      setGrandTotal(0);
    } finally {
      setIsLoading(false);
      setProgress(0);
      e.target.value = "";
    }
  };

  return (
    <div className="p-4">
      {(isLoading || progress > 0) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 bg-white/90 rounded-xl p-5 shadow">
            <FaSpinner className="animate-spin text-teal-600 text-4xl" />
            <div className="text-gray-700 text-sm font-medium">
              Đang xử lý file… {progress ? `${fmt2(progress)}%` : ""}
            </div>
            <div className="w-64 h-2 bg-gray-200 rounded">
              <div
                className="h-2 bg-teal-500 rounded"
                style={{ width: `${Math.min(progress, 100)}%` }}
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
            <FiPackage /> Kê xuất vật tư (chunk xử lý để mượt UI)
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
              <div className="text-sm text-amber-600 mt-2">
                * Đang tải danh mục vật tư…
              </div>
            )}
          </div>

          {Object.keys(dataByTeam).length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-gray-300 mt-6">
              <table className="min-w-full text-sm text-left border-collapse">
                <thead className="bg-yellow-100 sticky top-0 z-10">
                  <tr>
                    <th className="border px-3 py-2 font-bold text-center bg-yellow-200">BP/Tổ</th>
                    {materials.map((m) => (
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
                      {materials.map((m) => (
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
                    {materials.map((m) => (
                      <td key={m.key} className="border px-3 py-2 text-right">
                        {fmt2(colTotals[m.label] || 0)}
                      </td>
                    ))}
                    <td className="border px-3 py-2 text-right">
                      {fmt2(grandTotal || 0)}
                    </td>
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
