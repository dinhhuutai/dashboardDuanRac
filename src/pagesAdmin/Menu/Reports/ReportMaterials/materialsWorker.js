/* eslint-env worker */
import * as XLSX from "xlsx";

// eslint-disable-next-line no-restricted-globals
const ctx = self; // DedicatedWorkerGlobalScope

/* ===== Config / Helpers ===== */
const TEAMS_DEFAULT = ["C1", "C2", "C3", "C4", "CTM"];
const FIXED_IDX = { TO_IN: 2, TEN: 20, DVT: 21 };
const CAND_CONG = [
  "cong","cộng","tong cong","tổng cộng",
  "cong (gram)","tong cong (gram)","cộng (gram)","tổng cộng (gram)"
];
const CAND_VATTU = ["vat tu","vật tư","vat_tu"];

const vn = (s) =>
  String(s ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const getNumber = (cell) => {
  if (cell === null || cell === undefined || cell === "") return 0;
  if (typeof cell === "number") return cell;
  const n = parseFloat(String(cell).replace(/\s/g, "").replace(/\./g, "").replace(",", "."));
  return isNaN(n) ? 0 : n;
};

const makeKey = (s) =>
  String(s || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

const BAD_PREFIXES = ["Bao", "Bột", "Cát", "Chui", "In ", "keo ", "lapa", "Mỡ", "Vit"];
const startsWithAnyPrefix = (name, prefixes) => prefixes.some((p) => vn(name).startsWith(vn(p)));

function findHeaderRow(rows2D) {
  for (let i = 0; i < Math.min(rows2D.length, 15); i++) {
    const normed = (rows2D[i] || []).map(vn);
    if (normed.includes("ten") || normed.includes("dvt") || normed.includes("đvt")) return i;
  }
  return 4;
}
function findColByNames(row, candidates) {
  const map = {};
  (row || []).forEach((v, idx) => (map[vn(v)] = idx));
  for (const c of candidates) if (map[c] !== undefined) return map[c];
  return -1;
}

/* Gộp vật tư theo label (materialName) */
function groupMaterials(materialList = []) {
  const map = new Map();
  for (const m of materialList) {
    const label = m.label || m.materialName || "";
    const k = makeKey(label);
    const g = map.get(label) || { key: k, label, ingredients: new Set(), units: new Set() };
    const ing = m.ingredient ?? m.ingredientName;
    if (ing) g.ingredients.add(vn(ing));
    const unit = m.unit || m.units;
    if (Array.isArray(unit)) unit.forEach((u) => g.units.add(vn(u)));
    else if (unit) g.units.add(vn(unit));
    map.set(label, g);
  }
  return Array.from(map.values()).map((g) => {
    const units = Array.from(g.units);
    if (units.includes("cuộn") && !units.includes("cuon")) units.push("cuon");
    return { key: g.key, label: g.label, ingredients: Array.from(g.ingredients), units };
  });
}

/* ========== Core pipeline chạy trong worker ========== */
async function processFile({ arrayBuffer, materialsRaw, teams = TEAMS_DEFAULT, chunkSize = 2500 }) {
  // 1) gộp vật tư theo label
  const materials = groupMaterials(materialsRaw);

  // 2) đọc bảng tính
  const wb = XLSX.read(arrayBuffer, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows2D = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, raw: true });

  const headerIdx = findHeaderRow(rows2D);
  const headerRow = rows2D[headerIdx] || [];
  const idxCong = findColByNames(headerRow, CAND_CONG);
  const idxVatTu = findColByNames(headerRow, CAND_VATTU);
  if (idxCong < 0 && idxVatTu < 0) throw new Error("Không tìm thấy cột 'Cộng' hoặc 'Vật tư'.");

  // 3) ma trận kết quả
  const matrix = {};
  const colTotals = {};
  teams.forEach((t) => {
    matrix[t] = {};
    materials.forEach((m) => (matrix[t][m.label] = 0));
    matrix[t].total = 0;
  });
  materials.forEach((m) => (colTotals[m.label] = 0));

  // 4) lookup nhanh
  const teamSet = new Set(teams.map(vn));
  const defs = materials.map((m) => ({
    label: m.label,
    ingredients: new Set((m.ingredients || []).map(vn)),
    units: new Set((m.units || []).map(vn)),
    acceptsCuon: (m.units || []).map(vn).some((u) => u === "cuộn" || u === "cuon"),
    isLapaGroup: vn(m.label) === vn("Mực lapa"),
  }));
  const inkIndex = materials.findIndex((m) => vn(m.label) === vn("Mực"));
  const inkDef = inkIndex >= 0 ? defs[inkIndex] : null;

  const isCuon = (u) => u === "cuộn" || u === "cuon";
  const CUON_TO_KG = 0.2;

  // 5) duyệt theo chunk & cộng dồn
  const start = headerIdx + 1;
  const end = rows2D.length;
  for (let i = start; i < end; i += chunkSize) {
    const j = Math.min(i + chunkSize, end);

    for (let r = i; r < j; r++) {
      const row = rows2D[r] || [];
      const toIn = String(row[FIXED_IDX.TO_IN] || "").trim();
      const ten = String(row[FIXED_IDX.TEN] || "").trim();
      const dvt = String(row[FIXED_IDX.DVT] || "").trim();
      const vCong = idxCong >= 0 ? row[idxCong] : "";
      const vVatTu = idxVatTu >= 0 ? row[idxVatTu] : "";

      if ([toIn, ten, dvt, vCong, vVatTu].every((x) => (x ?? "") === "")) continue;

      // tách số lượng
      const qtyCong = getNumber(vCong); // chỉ "Cộng"
      const qtyAny = qtyCong || getNumber(vVatTu); // "Cộng" hoặc "Vật tư"
      if (!qtyAny && !qtyCong) continue;

      const teamKey = vn(toIn);
      if (!teamSet.has(teamKey)) continue;

      const nameInRow = vn(ten);
      const unitInRow = vn(dvt);

      let matched = false;

      // ƯU TIÊN: các nhóm đứng trước “Mực”
      for (let gIdx = 0; gIdx < defs.length; gIdx++) {
        if (gIdx === inkIndex) continue;
        const m = defs[gIdx];
        if (!qtyAny) break;

        // “Mực lapa”: tên bắt đầu "lapa"
        const isMatch = m.isLapaGroup ? nameInRow.startsWith("lapa") : m.ingredients.has(nameInRow);
        if (!isMatch) continue;

        let adjQty = qtyAny;
        if (m.acceptsCuon && isCuon(unitInRow)) adjQty = qtyAny * CUON_TO_KG;
        else if (m.units.size > 0 && !m.units.has(unitInRow)) continue;

        matrix[toIn][materials[gIdx].label] += adjQty;
        matched = true;
        break;
      }

      // Fallback: “Mực” — chỉ lấy từ cột Cộng + lọc tiền tố
      if (!matched && inkDef && qtyCong) {
        if (startsWithAnyPrefix(ten, BAD_PREFIXES)) continue;

        let adjQty = qtyCong;
        if (inkDef.acceptsCuon && isCuon(unitInRow)) adjQty = qtyCong * CUON_TO_KG;
        else if (inkDef.units.size > 0 && !inkDef.units.has(unitInRow)) continue;

        matrix[toIn][materials[inkIndex].label] += adjQty;
      }
    }

    // Progress cho UI
    const progress = ((j - start) / (end - start)) * 100;
    ctx.postMessage({ type: "progress", value: progress });
  }

  // 6) tổng kết
  let grandTotal = 0;
  for (const t of teams) {
    let rowSum = 0;
    for (const m of materials) {
      const v = matrix[t][m.label] || 0;
      rowSum += v;
      colTotals[m.label] += v;
    }
    matrix[t].total = rowSum;
    grandTotal += rowSum;
  }

  return { dataByTeam: matrix, colTotals, grandTotal, materials };
}

/* ===== Worker messages ===== */
ctx.onmessage = async (e) => {
  try {
    const { arrayBuffer, materials, teams, chunkSize } = e.data;
    const result = await processFile({
      arrayBuffer,
      materialsRaw: materials,
      teams: teams || TEAMS_DEFAULT,
      chunkSize: chunkSize || 2500,
    });
    ctx.postMessage({ type: "done", payload: result });
  } catch (err) {
    ctx.postMessage({ type: "error", message: err?.message || String(err) });
  }
};
