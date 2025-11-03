import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { FiLoader, FiDownload, FiChevronDown, FiChevronRight } from "react-icons/fi";
import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";
import { BASE_URL_SERVER_THLA } from "~/config";

function toYMD(d = new Date()) {
  return new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,10);
}
const toKg = (v) => v != null ? (Number(v)/1000).toFixed(2) : "0.00";

export default function InkLossByShift() {
  const [date, setDate] = useState(toYMD());
  const [shift, setShift] = useState("D1");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(() => new Set()); // scaleCode đang mở
  const [serverTotals, setServerTotals] = useState(null);    // <-- nhận từ meta.totalsAgg

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL_SERVER_THLA}/api/ink-loss/by-shift`, {
        params: { date, shift },
      });
      setRows(res.data?.data ?? []);
      setServerTotals(res.data?.meta?.totalsAgg ?? null); // <-- lấy tổng chuẩn từ server
      setExpanded(new Set()); // reset đóng hết khi đổi bộ lọc
    } catch (e) {
      console.error(e);
      setRows([]);
      setServerTotals(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [date, shift]);

  // Tổng dùng để hiển thị & xuất Excel:
  // - Ưu tiên số tổng từ server (đã gồm cả pjWeight)
  // - Fallback: tự reduce trên rows
  const totals = useMemo(() => {
    if (serverTotals) {
      // Chuẩn hoá kiểu số (phòng trường hợp BE trả string)
      const num = (x) => Number(x || 0);
      return {
        muc_dau_ca: num(serverTotals.muc_dau_ca),
        muc_nhan_tu_xe_khac: num(serverTotals.muc_nhan_tu_xe_khac),
        muc_tra_ve_tu_chuyen: num(serverTotals.muc_tra_ve_tu_chuyen),
        muc_cap: num(serverTotals.muc_cap),
        muc_chuyen_qua_xe_khac: num(serverTotals.muc_chuyen_qua_xe_khac),
        muc_cuoi_ca: num(serverTotals.muc_cuoi_ca),
        hao_hut_gram: num(serverTotals.hao_hut_gram),
      };
    }
    // Fallback tính trên FE (vẫn ok vì rows từ BE đã đúng logic hợp nhất)
    return rows.reduce((acc, r) => {
      const add = (k) => (acc[k] += Number(r[k] ?? 0));
      add('muc_dau_ca');
      add('muc_nhan_tu_xe_khac');
      add('muc_tra_ve_tu_chuyen');
      add('muc_cap');
      add('muc_chuyen_qua_xe_khac');
      add('muc_cuoi_ca');
      add('hao_hut_gram');
      return acc;
    }, {
      muc_dau_ca:0, muc_nhan_tu_xe_khac:0, muc_tra_ve_tu_chuyen:0,
      muc_cap:0, muc_chuyen_qua_xe_khac:0, muc_cuoi_ca:0, hao_hut_gram:0
    });
  }, [rows, serverTotals]);

  const toggleExpand = (code) => {
    const next = new Set(expanded);
    if (next.has(code)) next.delete(code); else next.add(code);
    setExpanded(next);
  };

  const exportExcel = () => {
  const title = `Hao hụt theo xe — ngày ${date}, ca ${shift}`;
  const wsData = [];
  wsData.push([title], []);

  // Header chính (A..I) — thêm "Nhận xét"
  wsData.push([
    "Xe (Cân)",              // A
    "Đầu ca",                // B
    "Nhận từ xe khác",       // C
    "Trả về từ chuyền",      // D
    "Cấp",                   // E
    "Chuyển qua xe khác",    // F
    "Cuối ca",               // G
    "Hao hụt",               // H
    "Nhận xét",              // I
  ]);

  rows.forEach((r) => {
    const hao = Number(r.hao_hut_gram || 0);
    const mainNote = hao < 0 ? "Âm" : "";

    // Hàng tổng xe (A..I)
    wsData.push([
      r.scaleCode,
      toKg(r.muc_dau_ca),
      toKg(r.muc_nhan_tu_xe_khac),
      toKg(r.muc_tra_ve_tu_chuyen),
      toKg(r.muc_cap),
      toKg(r.muc_chuyen_qua_xe_khac),
      toKg(r.muc_cuoi_ca),
      toKg(r.hao_hut_gram),
      mainNote, // Nhận xét
    ]);

    // Hàng chi tiết (lùi vào: A="", B="", C="Mã/Tên"; số liệu D..J; K = Nhận xét)
    if ((r.details?.length ?? 0) > 0) {
      wsData.push([
        "Mã mực / Tên mực",            // C
        "GC đầu",                      // D
        "NC nhận",                     // E
        "TV trả",                      // F
        "CM cấp",                      // G
        "CG chuyển",                   // H
        "GC cuối",                     // I
        "Hao hụt",                     // J
        "Nhận xét",                    // K
      ]);

      r.details.forEach((d) => {
        const haoD = Number(d.hao_hut_gram || 0);
        const note = haoD < 0 ? "Âm" : "";
        wsData.push([
          `• Mã: ${d.inkCode || ""}\n• Tên: ${d.inkName || ""}`,   // C (wrap 2 dòng)
          toKg(d.gc_dau),     // D
          toKg(d.nc_nhan),    // E
          toKg(d.tv_tra_ve),  // F
          toKg(d.cm_cap),     // G
          toKg(d.cg_chuyen),  // H
          toKg(d.gc_cuoi),    // I
          toKg(d.hao_hut_gram), // J
          note,               // K: Nhận xét
        ]);
      });

      wsData.push([]); // dòng trống kết thúc block chi tiết
    }
  });

  // Tổng cộng (A..I)
  wsData.push([
    "Tổng cộng",
    toKg(totals.muc_dau_ca),
    toKg(totals.muc_nhan_tu_xe_khac),
    toKg(totals.muc_tra_ve_tu_chuyen),
    toKg(totals.muc_cap),
    toKg(totals.muc_chuyen_qua_xe_khac),
    toKg(totals.muc_cuoi_ca),
    toKg(totals.hao_hut_gram),
    totals.hao_hut_gram < 0 ? "Âm" : "",
  ]);

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Merge tiêu đề (A1..I1)
  ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }];

  // Độ rộng cột: thêm I cho "Nhận xét", và C rộng hơn cho chi tiết
  ws["!cols"] = [
    { wch: 18 }, // A
    { wch: 12 }, // B
    { wch: 16 }, // C
    { wch: 16 }, // D
    { wch: 10 }, // E
    { wch: 18 }, // F
    { wch: 10 }, // G
    { wch: 12 }, // H
    { wch: 12 }, // I (Nhận xét)
  ];

  // ====== STYLE ======
  const borderThin = {
    top: { style: "thin", color: { rgb: "CBD5E1" } },
    right: { style: "thin", color: { rgb: "CBD5E1" } },
    bottom: { style: "thin", color: { rgb: "CBD5E1" } },
    left: { style: "thin", color: { rgb: "CBD5E1" } },
  };

  const headerStyle = {
    font: { bold: true, color: { rgb: "1F2937" } },
    alignment: { horizontal: "center", vertical: "center" },
    fill: { patternType: "solid", fgColor: { rgb: "F1F5F9" } },
    border: borderThin,
  };

  const titleStyle = {
    font: { bold: true, sz: 14, color: { rgb: "0F172A" } },
    alignment: { horizontal: "center", vertical: "center" },
  };

  const rightNum = { alignment: { horizontal: "right" }, border: borderThin };
  const leftCell = { alignment: { horizontal: "left" }, border: borderThin };
  const leftWrapped = {
    alignment: { horizontal: "left", vertical: "top", wrapText: true },
    border: borderThin,
  };

  const mainRowFill = { fill: { patternType: "solid", fgColor: { rgb: "FFFFFF" } } };
  const mainRowFillAlt = { fill: { patternType: "solid", fgColor: { rgb: "F8FAFC" } } };
  const detailRowFill = { fill: { patternType: "solid", fgColor: { rgb: "FFFFFF" } } };
  const detailRowFillAlt = { fill: { patternType: "solid", fgColor: { rgb: "F1F5F9" } } };
  const totalRowStyle = {
    font: { bold: true, color: { rgb: "1F2937" } },
    fill: { patternType: "solid", fgColor: { rgb: "FEF3C7" } },
    border: borderThin,
  };

  // Tô đỏ cho ô Hao hụt ÂM
  const redText = { font: { color: { rgb: "B91C1C" }, bold: true } }; // red-700 + bold

  const setCellStyle = (addr, style) => {
    if (!ws[addr]) return;
    ws[addr].s = { ...(ws[addr].s || {}), ...style };
  };

  const range = XLSX.utils.decode_range(ws["!ref"]);

  // Tiêu đề
  setCellStyle("A1", titleStyle);

  // Header chính (A3..I3)
  for (let c = 0; c <= 8; c++) {
    const addr = XLSX.utils.encode_cell({ r: 2, c });
    setCellStyle(addr, headerStyle);
  }

  // Viền + canh cho toàn sheet (trừ tiêu đề & dòng trống)
  for (let r = 2; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (!ws[addr]) continue;

      // Cột C (index 2) ở chi tiết là ô gộp mã/tên cần wrap
      if (c === 2 && r > 2) setCellStyle(addr, leftWrapped);
      else if (c === 0 || c === 1 || (r > 2 && ws[addr].v === "")) setCellStyle(addr, leftCell);
      else setCellStyle(addr, rightNum);
    }
  }

  // Header phụ chi tiết: A="" & B="" & C="Mã mực / Tên mực" (style C..K)
  for (let r = 0; r <= range.e.r; r++) {
    const a = XLSX.utils.encode_cell({ r, c: 0 });
    const b = XLSX.utils.encode_cell({ r, c: 1 });
    const c2 = XLSX.utils.encode_cell({ r, c: 2 });
    if ((ws[a]?.v === "" || ws[a]?.v == null) &&
        (ws[b]?.v === "" || ws[b]?.v == null) &&
        ws[c2]?.v === "Mã mực / Tên mực") {
      for (let c = 2; c <= 10; c++) { // C..K
        const addr = XLSX.utils.encode_cell({ r, c });
        setCellStyle(addr, headerStyle);
      }
    }
  }

  // Zebra + tô đỏ ô Hao hụt ÂM
  let mainAlt = false;
  let inDetail = false;
  let detailAlt = false;

  for (let r = 3; r <= range.e.r; r++) {
    const A = XLSX.utils.encode_cell({ r, c: 0 });
    const B = XLSX.utils.encode_cell({ r, c: 1 });
    const C = XLSX.utils.encode_cell({ r, c: 2 });
    const Aval = ws[A]?.v;
    const Bval = ws[B]?.v;
    const Cval = ws[C]?.v;

    const isTotal = Aval === "Tổng cộng";
    const isDetailHeader =
      (Aval === "" || Aval == null) &&
      (Bval === "" || Bval == null) &&
      Cval === "Mã mực / Tên mực";
    const isDetailRow =
      (Aval === "" || Aval == null) &&
      (Bval === "" || Bval == null) &&
      Cval && Cval !== "Mã mực / Tên mực";
    const isDetailEnd =
      (Aval === "" || Aval == null) &&
      (Bval === "" || Bval == null) &&
      (!Cval || Cval === "");
    const isMainRow = Aval != null && Aval !== "" && !isTotal;

    if (isDetailHeader) {
      inDetail = true;
      detailAlt = false;
      continue;
    }
    if (inDetail && isDetailEnd) {
      inDetail = false;
      continue;
    }

    // Main rows zebra (A..I), tô đỏ H (index 7) nếu ÂM
    if (!inDetail && isMainRow) {
      for (let c = 0; c <= 8; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        setCellStyle(addr, mainAlt ? mainRowFillAlt : mainRowFill);
      }
      const haoAddr = XLSX.utils.encode_cell({ r, c: 7 }); // H
      const v = Number(String(ws[haoAddr]?.v ?? "").replace(",", "."));
      if (!isNaN(v) && v < 0) setCellStyle(haoAddr, redText);

      mainAlt = !mainAlt;
      continue;
    }

    // Detail rows zebra (C..K), tô đỏ J (index 9) nếu ÂM
    if (inDetail && isDetailRow) {
      for (let c = 2; c <= 10; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        setCellStyle(addr, detailAlt ? detailRowFillAlt : detailRowFill);
      }
      // wrap lại C nếu bị ghi đè
      setCellStyle(C, leftWrapped);

      const haoAddr = XLSX.utils.encode_cell({ r, c: 9 }); // J
      const v = Number(String(ws[haoAddr]?.v ?? "").replace(",", "."));
      if (!isNaN(v) && v < 0) setCellStyle(haoAddr, redText);

      detailAlt = !detailAlt;
      continue;
    }

    // Tổng cộng
    if (isTotal) {
      for (let c = 0; c <= 8; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        setCellStyle(addr, totalRowStyle);
      }
      const haoAddr = XLSX.utils.encode_cell({ r, c: 7 }); // H
      const v = Number(String(ws[haoAddr]?.v ?? "").replace(",", "."));
      if (!isNaN(v) && v < 0) setCellStyle(haoAddr, redText);
    }
  }

  // Tăng chiều cao hàng cho ô C có xuống dòng (mã/tên)
  ws['!rows'] = ws['!rows'] || [];
  for (let r = 0; r <= range.e.r; r++) {
    const cAddr = XLSX.utils.encode_cell({ r, c: 2 });
    if (ws[cAddr]?.v && String(ws[cAddr].v).includes('\n')) {
      ws['!rows'][r] = { hpt: 28 };
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Hao hut theo xe");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(new Blob([buf], { type: "application/octet-stream" }), `Hao_hut_${date}_${shift}.xlsx`);
};


  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-[1200px] space-y-5">
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
          {/* Header + bộ lọc */}
          <div className="flex flex-col gap-4 border-b border-slate-200/60 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-800">
                Hao hụt mực theo xe (theo ca)
              </h2>
              <button
                onClick={exportExcel}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700"
              >
                <FiDownload /> Xuất Excel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col">
                <label className="text-xs font-medium text-slate-600 mb-1">Ngày</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-medium text-slate-600 mb-1">Ca</label>
                <select
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500/40"
                >
                  <option value="D1">D1 (Dài 1)</option>
                  <option value="D2">D2 (Dài 2)</option>
                  <option value="C1">C1 (Ngắn 1)</option>
                  <option value="C2">C2 (Ngắn 2)</option>
                  <option value="C3">C3 (Ngắn 3)</option>
                  <option value="HC">HC (Hành chánh)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bảng */}
          <div className="p-4 sm:p-5">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-slate-600">
                <FiLoader className="animate-spin text-xl" />
                <span className="text-sm">Đang tải dữ liệu...</span>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="min-w-[900px] w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr className="text-[12px] uppercase tracking-wide text-slate-600">
                        <th className="border-b px-3 py-2 text-left w-12"></th>
                        <th className="border-b px-3 py-2 text-left">Xe (Cân)</th>
                        <th className="border-b px-3 py-2 text-right">Đầu ca</th>
                        <th className="border-b px-3 py-2 text-right">Nhận từ xe khác</th>
                        <th className="border-b px-3 py-2 text-right">Trả về từ chuyền</th>
                        <th className="border-b px-3 py-2 text-right">Cấp</th>
                        <th className="border-b px-3 py-2 text-right">Chuyển qua xe khác</th>
                        <th className="border-b px-3 py-2 text-right">Cuối ca</th>
                        <th className="border-b px-3 py-2 text-right">Hao hụt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-3 py-10 text-center text-slate-500">
                            Không có dữ liệu
                          </td>
                        </tr>
                      ) : (
                        <>
                          {rows.map((r, i) => {
                            const hao = Number(r.hao_hut_gram || 0);
                            const isOpen = expanded.has(r.scaleCode);
                            return (
                              <React.Fragment key={r.scaleCode || i}>
                                {/* Hàng tổng xe */}
                                <tr className={i%2? "bg-slate-50/70":"bg-white"}>
                                  <td className="px-2 py-2">
                                    <button
                                      onClick={() => toggleExpand(r.scaleCode)}
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
                                      title={isOpen ? "Thu gọn" : "Xem chi tiết"}
                                    >
                                      {isOpen ? <FiChevronDown /> : <FiChevronRight />}
                                    </button>
                                  </td>
                                  <td className="px-3 py-2 text-slate-800">
                                    <span className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium">
                                      {r.scaleCode}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-right">{toKg(r.muc_dau_ca)}</td>
                                  <td className="px-3 py-2 text-right">{toKg(r.muc_nhan_tu_xe_khac)}</td>
                                  <td className="px-3 py-2 text-right">{toKg(r.muc_tra_ve_tu_chuyen)}</td>
                                  <td className="px-3 py-2 text-right">{toKg(r.muc_cap)}</td>
                                  <td className="px-3 py-2 text-right">{toKg(r.muc_chuyen_qua_xe_khac)}</td>
                                  <td className="px-3 py-2 text-right">{toKg(r.muc_cuoi_ca)}</td>
                                  <td className={`px-3 py-2 text-right font-semibold ${hao>0?'text-rose-600':hao<0?'text-emerald-600':'text-slate-900'}`}>
                                    {toKg(hao)}
                                  </td>
                                </tr>

                                {/* Hàng chi tiết mực */}
                                {isOpen && (
                                  <tr className="bg-white">
                                    <td></td>
                                    <td colSpan={8} className="px-3 pb-3 pt-1">
                                      <div className="rounded-lg border border-slate-200 overflow-hidden">
                                        <div className="bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                                          Chi tiết mực theo xe {r.scaleCode}
                                        </div>
                                        <div className="overflow-x-auto">
                                          <table className="min-w-[820px] w-full text-[13px]">
                                            <thead className="bg-white">
                                              <tr className="text-slate-600">
                                                <th className="border-b px-3 py-2 text-left">Mã mực</th>
                                                <th className="border-b px-3 py-2 text-left">Tên mực</th>
                                                <th className="border-b px-3 py-2 text-right">GC đầu</th>
                                                <th className="border-b px-3 py-2 text-right">NC nhận</th>
                                                <th className="border-b px-3 py-2 text-right">TV trả</th>
                                                <th className="border-b px-3 py-2 text-right">CM cấp</th>
                                                <th className="border-b px-3 py-2 text-right">CG chuyển</th>
                                                <th className="border-b px-3 py-2 text-right">GC cuối</th>
                                                <th className="border-b px-3 py-2 text-right">Hao hụt</th>
                                                <th className="border-b px-3 py-2 text-center">Đánh dấu</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {(r.details ?? []).length === 0 ? (
                                                <tr>
                                                  <td colSpan={10} className="px-3 py-4 text-center text-slate-500">
                                                    Không có chi tiết mực
                                                  </td>
                                                </tr>
                                              ) : (
                                                r.details.map((d, idx) => {
                                                  const hao = Number(d.hao_hut_gram || 0);
                                                  const cm0 = Number(d.cm_cap || 0) !== 0;
                                                  const hasReturn = Number(d.tv_tra_ve || 0) > 0;
                                                  return (
                                                    <tr key={idx} className={idx%2? "bg-slate-50/50":"bg-white"}>
                                                      <td className="px-3 py-2 font-mono">{d.inkCode}</td>
                                                      <td className="px-3 py-2">{d.inkName}</td>
                                                      <td className="px-3 py-2 text-right">{toKg(d.gc_dau)}</td>
                                                      <td className="px-3 py-2 text-right">{toKg(d.nc_nhan)}</td>
                                                      <td className="px-3 py-2 text-right">{toKg(d.tv_tra_ve)}</td>
                                                      <td className="px-3 py-2 text-right">
                                                        <div className="inline-flex items-center gap-2">
                                                          {cm0 ? (
                                                            <span>{toKg(d.cm_cap)}</span>
                                                          ) : (
                                                            <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 border border-slate-200">
                                                              Không cấp
                                                            </span>
                                                          )}
                                                        </div>
                                                      </td>
                                                      <td className="px-3 py-2 text-right">{toKg(d.cg_chuyen)}</td>
                                                      <td className="px-3 py-2 text-right">{toKg(d.gc_cuoi)}</td>
                                                      <td className={`px-3 py-2 text-right font-semibold ${hao>0?'text-rose-600':hao<0?'text-emerald-600':'text-slate-900'}`}>
                                                        {toKg(hao)}
                                                      </td>
                                                      <td className="px-3 py-2 text-center">
                                                        {hasReturn ? (
                                                          <span className="inline-flex items-center rounded-md bg-sky-100 px-2 py-1 text-[11px] font-semibold text-sky-700 border border-sky-200">
                                                            Có trả
                                                          </span>
                                                        ) : (
                                                          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 border border-slate-200">
                                                            —
                                                          </span>
                                                        )}
                                                      </td>
                                                    </tr>
                                                  );
                                                })
                                              )}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}

                          {/* Tổng cộng (ưu tiên tổng từ server) */}
                          <tr className="bg-amber-50/80">
                            <td></td>
                            <td className="px-3 py-2 font-semibold">Tổng cộng</td>
                            <td className="px-3 py-2 text-right font-semibold">{toKg(totals.muc_dau_ca)}</td>
                            <td className="px-3 py-2 text-right font-semibold">{toKg(totals.muc_nhan_tu_xe_khac)}</td>
                            <td className="px-3 py-2 text-right font-semibold">{toKg(totals.muc_tra_ve_tu_chuyen)}</td>
                            <td className="px-3 py-2 text-right font-semibold">{toKg(totals.muc_cap)}</td>
                            <td className="px-3 py-2 text-right font-semibold">{toKg(totals.muc_chuyen_qua_xe_khac)}</td>
                            <td className="px-3 py-2 text-right font-semibold">{toKg(totals.muc_cuoi_ca)}</td>
                            <td className={`px-3 py-2 text-right font-bold ${totals.hao_hut_gram>0?'text-rose-700':totals.hao_hut_gram<0?'text-emerald-700':'text-slate-900'}`}>
                              {toKg(totals.hao_hut_gram)}
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
