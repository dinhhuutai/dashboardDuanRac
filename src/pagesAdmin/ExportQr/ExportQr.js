// src/pages/ExportQr.jsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { BASE_URL } from "~/config";

// ---------- Helpers chung ----------
function chunkArray(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function fetchImageBase64(url) {
  const res = await fetch(url, { mode: "cors" });
  const blob = await res.blob();
  const reader = new FileReader();
  const base64 = await new Promise((resolve, reject) => {
    reader.onerror = reject;
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.readAsDataURL(blob);
  });
  const mime = blob.type || "image/png";
  const isJpeg = /jpe?g/i.test(mime) || /\.jpe?g(\?|$)/i.test(url);
  const type = isJpeg ? "jpeg" : "png";
  return { base64, type };
}

// Layout cố định A4: 5 cột, 4 hàng (1 & 3 TRỐNG, 2 & 4 CÓ NỘI DUNG)
const COLS = 5;
const ROWS_TOTAL = 4;
const CONTENT_ROWS = [2, 4]; // hàng có nội dung
const COL_WIDTH = 40.61; // theo bạn đang dùng thực tế
const ROW_HEIGHTS = { 1: 72, 2: 321, 3: 72, 4: 321 }; // pt

const setBorder = (cell) => {
  cell.border = {
    top:    { style: "thin", color: { argb: "FF444444" } },
    right:  { style: "thin", color: { argb: "FF444444" } },
    bottom: { style: "thin", color: { argb: "FF444444" } },
    left:   { style: "thin", color: { argb: "FF444444" } },
  };
};

// ---------- Trang chính ----------
export default function ExportQr() {
  const [tab, setTab] = useState("qr-select"); // 'qr-select' | 'qr-all' | 'text'

  // Dữ liệu QR dùng chung cho 2 tab đầu
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter cho tab QR
  const [departmentID, setDepartmentID] = useState("");
  const [unitID, setUnitID] = useState("");
  const [q, setQ] = useState("");

  // Lựa chọn cho tab QR-select
  const [selected, setSelected] = useState(() => new Set());
  const [exporting, setExporting] = useState(false);
  const [showCode, setShowCode] = useState(false);

  // Tab "text"
  const INPUT_MODE = { REPEAT: "REPEAT", LINES: "LINES", GRID: "GRID" };
  const [mode, setMode] = useState(INPUT_MODE.GRID);
  const [repeatText, setRepeatText] = useState("THLA");
  const [listText, setListText] = useState(
    ["A1","A2","A3","A4","A5","B1","B2","B3","B4","B5"].join("\n")
  );
  const [gridTexts, setGridTexts] = useState(Array(10).fill(""));
  const [fontSize, setFontSize] = useState(72);
  const [isBold, setIsBold] = useState(true);
  const [wrapText, setWrapText] = useState(true);

  // phân trang xem trước (không bắt buộc)
  const pages = useMemo(() => chunkArray(rows, 10), [rows]);

  // Tải danh sách QR
  const loadList = async (useFilter = false) => {
    setLoading(true);
    try {
      const params = {};
      if (useFilter && departmentID) params.departmentID = departmentID;
      if (useFilter && unitID) params.unitID = unitID;
      if (useFilter && q) params.q = q;

      const url = useFilter
        ? `${BASE_URL}/api/trash-bins/qrs`   // có filter
        : `${BASE_URL}/api/trash-bins/qrs-all`; // tất cả

      const res = await axios.get(url, { params });
      const data = res.data?.data || res.data?.items || [];
      setRows(Array.isArray(data) ? data : []);
      setSelected(new Set());
    } catch (e) {
      console.error(e);
      window.alert("Lỗi tải danh sách QR");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // mặc định nạp tất cả 1 lần khi mở trang (phục vụ cả 2 tab QR)
    loadList(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --------- QR SELECT TAB: selection ----------
  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const selectAll = () => setSelected(new Set(rows.map(x => x.trashBinID)));
  const clearSelect = () => setSelected(new Set());

  // --------- Export: QR (dùng chung cho ‘qr-all’ và ‘qr-select’) ----------
  const exportQrList = async (list, filenamePrefix = "QR") => {
    if (!list || !list.length) {
      window.alert("Không có dữ liệu để xuất.");
      return;
    }
    setExporting(true);
    try {
      const wb = new ExcelJS.Workbook();
      wb.creator = "THLA";
      wb.created = new Date();

      const pagesForExport = chunkArray(list, 10);
      for (let p = 0; p < pagesForExport.length; p++) {
        const sheet = wb.addWorksheet(`Trang ${p + 1}`, {
          views: [{ showGridLines: false }],
          pageSetup: {
            paperSize: 9, orientation: "landscape",
            fitToPage: true, fitToWidth: 1, fitToHeight: 1,
            margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0, footer: 0 },
          },
        });

        sheet.columns = Array.from({ length: COLS }, () => ({ width: COL_WIDTH }));
        for (let r = 1; r <= ROWS_TOTAL; r++) sheet.getRow(r).height = ROW_HEIGHTS[r];

        // Border 4 hàng
        for (let r = 1; r <= ROWS_TOTAL; r++) {
          for (let c = 1; c <= COLS; c++) setBorder(sheet.getCell(r, c));
        }

        const items = pagesForExport[p];
        for (let i = 0; i < items.length; i++) {
          const it = items[i];
          const r = i < COLS ? CONTENT_ROWS[0] : CONTENT_ROWS[1];
          const c = (i % COLS) + 1;

          if (showCode) {
            const cell = sheet.getCell(r, c);
            cell.value = it.trashBinCode || "";
            cell.alignment = { vertical: "bottom", horizontal: "center", wrapText: true };
          }

          try {
            const { base64, type } = await fetchImageBase64(it.qrLink);
            const imageId = wb.addImage({ base64, extension: type });

            // Fill full ô
            sheet.addImage(imageId, {
              tl: { col: c - 1, row: r - 1 },
              br: { col: c, row: r },
              editAs: "oneCell",
            });
          } catch (e) {
            console.warn("Không tải được ảnh:", it.qrLink, e);
          }
        }
      }

      const buf = await wb.xlsx.writeBuffer();
      const fileName = `${filenamePrefix}_A4_5cols_2rows_${new Date().toISOString().slice(0, 10)}.xlsx`;
      saveAs(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), fileName);
    } catch (e) {
      console.error(e);
      window.alert("Lỗi xuất Excel");
    } finally {
      setExporting(false);
    }
  };

  // --------- Export: QR SELECT ----------
  const exportSelected = async () => {
    let list = rows;
    if (selected.size === 0) {
      const ok = window.confirm("Bạn chưa chọn QR nào. Xuất TẤT CẢ thay vì chỉ những cái đã chọn?");
      if (!ok) return;
    } else {
      list = rows.filter(x => selected.has(x.trashBinID));
    }
    await exportQrList(list, "QR_Selected");
  };

  // --------- Export: QR ALL ----------
  const exportAll = async () => {
    if (!rows.length) {
      window.alert("Danh sách đang trống. Hãy tải dữ liệu trước.");
      return;
    }
    await exportQrList(rows, "QR_All");
  };

  // --------- TEXT TAB ----------
  const getTextItems = () => {
    if (mode === INPUT_MODE.REPEAT) {
      return Array.from({ length: 10 }, () => repeatText || "");
    }
    if (mode === INPUT_MODE.LINES) {
      const lines = (listText || "").split("\n").map(s => s.trim());
      return Array.from({ length: 10 }, (_, i) => lines[i] || "");
    }
    return gridTexts.slice(0, 10).map(s => (s ?? "").trim()); // GRID
  };

  const exportText = async () => {
    const items = getTextItems();
    try {
      const wb = new ExcelJS.Workbook();
      wb.creator = "THLA";
      wb.created = new Date();

      const sheet = wb.addWorksheet("Trang 1", {
        views: [{ showGridLines: false }],
        pageSetup: {
          paperSize: 9, orientation: "landscape",
          fitToPage: true, fitToWidth: 1, fitToHeight: 1,
          margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0, footer: 0 },
        },
      });

      sheet.columns = Array.from({ length: COLS }, () => ({ width: COL_WIDTH }));
      for (let r = 1; r <= ROWS_TOTAL; r++) sheet.getRow(r).height = ROW_HEIGHTS[r];

      for (let r = 1; r <= ROWS_TOTAL; r++) {
        for (let c = 1; c <= COLS; c++) setBorder(sheet.getCell(r, c));
      }

      for (let i = 0; i < items.length; i++) {
        const r = i < COLS ? CONTENT_ROWS[0] : CONTENT_ROWS[1];
        const c = (i % COLS) + 1;
        const cell = sheet.getCell(r, c);
        cell.value = items[i];
        cell.alignment = { vertical: "middle", horizontal: "center", wrapText: !!wrapText };
        cell.font = { size: Number(fontSize) || 48, bold: !!isBold };
      }

      const buf = await wb.xlsx.writeBuffer();
      const fileName = `TEXT_A4_5cols_2rows_${new Date().toISOString().slice(0, 10)}.xlsx`;
      saveAs(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), fileName);
    } catch (e) {
      console.error(e);
      window.alert("Lỗi xuất Excel");
    }
  };

  // ---------- UI ----------
  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Header + Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Export A4 (5 cột; H1/H3 trống, H2/H4 có nội dung)</h1>
          <p className="text-slate-500 text-sm">Chọn chế độ bên phải để thao tác.</p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600">Chế độ:</label>
          <select
            className="px-3 py-2 border rounded-lg"
            value={tab}
            onChange={(e) => setTab(e.target.value)}
          >
            <option value="qr-select">QR – Chọn lọc</option>
            <option value="qr-all">QR – Tất cả</option>
            <option value="text">Chữ – Tuỳ ý (10 ô)</option>
          </select>
        </div>
      </div>

      {/* TAB: QR SELECT */}
      {tab === "qr-select" && (
        <>
          <div className="flex items-center justify-between mb-3">
            <div className="text-slate-600 text-sm">
              Tổng: <b>{rows.length}</b> QR — {pages.length} trang (10 QR/trang). Đã chọn: <b>{selected.size}</b>.
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportSelected}
                disabled={exporting}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-60"
              >
                {exporting ? "Đang xuất..." : "Xuất Excel (chỉ mục đã chọn)"}
              </button>
              <button
                onClick={exportAll}
                disabled={exporting || rows.length === 0}
                className="px-3 py-2 rounded-lg border bg-white hover:bg-slate-50 text-slate-700 shadow-sm disabled:opacity-60"
              >
                Xuất tất cả
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="rounded-xl border bg-white p-3 shadow-sm mb-3">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="flex flex-col">
                <label className="text-sm text-slate-600">Department ID</label>
                <input
                  type="number"
                  value={departmentID}
                  onChange={(e) => setDepartmentID(e.target.value)}
                  className="px-3 py-2 rounded border"
                  placeholder="VD: 29"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-slate-600">Unit ID</label>
                <input
                  type="number"
                  value={unitID}
                  onChange={(e) => setUnitID(e.target.value)}
                  className="px-3 py-2 rounded border"
                  placeholder="VD: 10"
                />
              </div>
              <div className="flex flex-col sm:col-span-2">
                <label className="text-sm text-slate-600">Tìm mã thùng (trashBinCode)</label>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="px-3 py-2 rounded border"
                  placeholder="Nhập từ khoá..."
                />
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => loadList(true)}
                disabled={loading}
                className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:opacity-60"
              >
                {loading ? "Đang tải..." : "Lọc / Tải danh sách theo điều kiện"}
              </button>

              <button
                onClick={() => loadList(false)}
                disabled={loading}
                className="px-3 py-2 rounded-lg border bg-white hover:bg-slate-50 text-slate-700 shadow-sm disabled:opacity-60"
              >
                Tải tất cả (isActive = 1)
              </button>

              <div className="ml-auto flex items-center gap-4">
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={showCode}
                    onChange={(e) => setShowCode(e.target.checked)}
                  />
                  Hiện mã dưới QR
                </label>
                <button
                  onClick={selectAll}
                  disabled={rows.length === 0}
                  className="px-3 py-1.5 rounded border bg-white hover:bg-slate-50 text-slate-700"
                >
                  Chọn tất cả ({rows.length})
                </button>
                <button
                  onClick={clearSelect}
                  disabled={selected.size === 0}
                  className="px-3 py-1.5 rounded border bg-white hover:bg-slate-50 text-slate-700"
                >
                  Bỏ chọn ({selected.size})
                </button>
              </div>
            </div>
          </div>

          {/* Preview Grid */}
          <div className="rounded-xl border bg-white p-3 shadow-sm">
            <div className="mb-2 text-slate-600 text-sm">
              Xem trước (click card để chọn/bỏ chọn).
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {rows.map((it) => {
                const checked = selected.has(it.trashBinID);
                return (
                  <div
                    key={it.trashBinID}
                    className={`rounded-lg border p-2 shadow-sm flex flex-col items-center cursor-pointer ${
                      checked ? "ring-2 ring-emerald-500" : ""
                    }`}
                    onClick={() => toggleSelect(it.trashBinID)}
                  >
                    <div className="w-full aspect-square overflow-hidden rounded-md bg-slate-50 flex items-center justify-center">
                      <img src={it.qrLink} alt={it.trashBinCode} className="max-w-full max-h-full object-contain" />
                    </div>
                    <div className="mt-2 w-full flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-600 truncate">{it.trashBinCode}</span>
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={checked}
                        onChange={() => toggleSelect(it.trashBinID)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                );
              })}
              {!rows.length && (
                <div className="text-sm text-slate-500 col-span-full">
                  Chưa có dữ liệu. Dùng các nút “Tải…” ở trên.
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* TAB: QR ALL */}
      {tab === "qr-all" && (
        <>
          <div className="flex items-center justify-between mb-3">
            <div className="text-slate-600 text-sm">
              Tổng: <b>{rows.length}</b> QR — {pages.length} trang (10 QR/trang).
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => loadList(false)}
                disabled={loading}
                className="px-3 py-2 rounded-lg border bg-white hover:bg-slate-50 text-slate-700 shadow-sm disabled:opacity-60"
              >
                {loading ? "Đang tải..." : "Tải tất cả (isActive = 1)"}
              </button>
              <button
                onClick={exportAll}
                disabled={exporting || rows.length === 0}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-60"
              >
                {exporting ? "Đang xuất..." : "Xuất Excel (tất cả)"}
              </button>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-3 shadow-sm">
            <div className="mb-2 text-slate-600 text-sm">Xem trước:</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {rows.slice(0, 20).map((it) => (
                <div key={it.trashBinID} className="rounded-lg border p-2 shadow-sm flex flex-col items-center">
                  <div className="w-full aspect-square overflow-hidden rounded-md bg-slate-50 flex items-center justify-center">
                    <img src={it.qrLink} alt={it.trashBinCode} className="max-w-full max-h-full object-contain" />
                  </div>
                  <div className="mt-2 text-xs text-slate-600 truncate w-full text-center">{it.trashBinCode}</div>
                </div>
              ))}
              {!rows.length && (
                <div className="text-sm text-slate-500 col-span-full">Chưa có dữ liệu.</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* TAB: TEXT */}
      {tab === "text" && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-800">Chữ tuỳ ý (10 ô) – xuất 1 trang A4</h2>
              <p className="text-slate-500 text-sm">H1/H3 trống, H2/H4 chứa chữ; có border, chữ căn giữa.</p>
            </div>
            <button
              onClick={exportText}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              Xuất Excel
            </button>
          </div>

          <div className="rounded-xl border bg-white p-4 shadow-sm mb-4">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="mode"
                  value={INPUT_MODE.REPEAT}
                  checked={mode === INPUT_MODE.REPEAT}
                  onChange={() => setMode(INPUT_MODE.REPEAT)}
                  className="h-4 w-4"
                />
                1 dòng (lặp 10 ô)
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="mode"
                  value={INPUT_MODE.LINES}
                  checked={mode === INPUT_MODE.LINES}
                  onChange={() => setMode(INPUT_MODE.LINES)}
                  className="h-4 w-4"
                />
                10 dòng (textarea)
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-emerald-700 font-medium">
                <input
                  type="radio"
                  name="mode"
                  value={INPUT_MODE.GRID}
                  checked={mode === INPUT_MODE.GRID}
                  onChange={() => setMode(INPUT_MODE.GRID)}
                  className="h-4 w-4"
                />
                Nhập từng ô (5×2)
              </label>

              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-700">Cỡ chữ (pt)</label>
                <input
                  type="number"
                  min={12}
                  max={200}
                  step={2}
                  className="px-3 py-2 rounded border w-28"
                  value={fontSize}
                  onChange={e => setFontSize(parseInt(e.target.value) || 72)}
                />
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={isBold}
                  onChange={e => setIsBold(e.target.checked)}
                />
                In đậm
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={wrapText}
                  onChange={e => setWrapText(e.target.checked)}
                />
                Wrap (xuống dòng nếu dài)
              </label>
            </div>

            {/* Inputs theo mode */}
            {mode === INPUT_MODE.REPEAT && (
              <div className="flex flex-col">
                <label className="text-sm font-medium text-slate-600">Nội dung</label>
                <input
                  type="text"
                  className="px-3 py-2 rounded border"
                  value={repeatText}
                  onChange={e => setRepeatText(e.target.value)}
                  placeholder="Nhập chữ…"
                />
                <span className="text-xs text-slate-500 mt-1">Sẽ lặp nội dung này cho đủ 10 ô.</span>
              </div>
            )}

            {mode === INPUT_MODE.LINES && (
              <div className="flex flex-col">
                <label className="text-sm font-medium text-slate-600">Danh sách 10 dòng</label>
                <textarea
                  className="px-3 py-2 rounded border min-h-[160px]"
                  value={listText}
                  onChange={e => setListText(e.target.value)}
                  placeholder={"Dòng 1\nDòng 2\n...\nDòng 10"}
                />
                <span className="text-xs text-slate-500 mt-1">Hệ thống sẽ lấy đúng 10 dòng đầu tiên (thiếu thì để trống).</span>
              </div>
            )}

            {mode === INPUT_MODE.GRID && (
              <div className="space-y-3">
                {[0,1].map(rowIdx => (
                  <div key={rowIdx} className="grid grid-cols-5 gap-2">
                    {Array.from({ length: 5 }).map((_, colIdx) => {
                      const idx = rowIdx * 5 + colIdx; // 0..9
                      return (
                        <input
                          key={idx}
                          type="text"
                          className="px-2 py-2 rounded border"
                          placeholder={`Ô ${rowIdx === 0 ? 'H2' : 'H4'}-C${colIdx + 1}`}
                          value={gridTexts[idx] || ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            setGridTexts(prev => {
                              const arr = [...prev];
                              arr[idx] = v;
                              return arr;
                            });
                          }}
                        />
                      );
                    })}
                  </div>
                ))}
                <div className="text-xs text-slate-500">Hàng trên tương ứng Excel hàng 2 (5 ô), hàng dưới tương ứng Excel hàng 4 (5 ô).</div>
              </div>
            )}
          </div>

          {/* Preview 10 ô chữ */}
          <div className="rounded-xl border bg-white p-3 shadow-sm">
            <div className="mb-2 text-slate-600 text-sm">Xem trước nội dung (10 ô ở hàng 2 & 4):</div>
            <div className="grid grid-cols-5 gap-2">
              {getTextItems().map((t, idx) => (
                <div key={idx} className="border rounded-md p-2 h-24 flex items-center justify-center text-center text-slate-700">
                  <span className="text-xs">{t}</span>
                </div>
              ))}
            </div>
            <div className="text-xs text-slate-500 mt-2">(*) Hàng 1 & 3 sẽ là ô trống có border.</div>
          </div>
        </>
      )}
    </div>
  );
}
