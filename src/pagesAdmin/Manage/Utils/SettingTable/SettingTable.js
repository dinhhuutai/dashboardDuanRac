// src/pagesAdmin/Manage/Utils/ReportGrouping/ReportGrouping.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FaLayerGroup } from "react-icons/fa";
import { ArrowUpAZ, ArrowDownZA, RefreshCcw, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import http from "~/api/http";
import { BASE_URL } from "~/config";

/* --------- Toast đơn giản (tự ẩn) --------- */
function Toast({ open, type = "success", message = "", onClose }) {
  if (!open) return null;
  return (
    <div className="fixed top-4 right-4 z-[10060]">
      <div
        className={`px-4 py-3 rounded-lg shadow-lg text-white ${
          type === "success" ? "bg-emerald-600" : "bg-rose-600"
        }`}
        onAnimationEnd={() => setTimeout(onClose, 1600)}
      >
        {message}
      </div>
    </div>
  );
}

/* --------- Modal đơn giản --------- */
function Modal({ open, title = "Thông báo", message = "", onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[10050] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl ring-1 ring-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        <p className="mt-2 text-slate-700 whitespace-pre-line">{message}</p>
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="h-10 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

/* --------- Overlay đang lưu + % tiến trình --------- */
function SavingOverlay({ open, percent = 0, detail = "" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[10070] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800">Đang lưu thay đổi…</h3>
        <p className="mt-2 text-sm text-slate-600">{detail}</p>
        <div className="mt-4">
          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-3 bg-emerald-600 transition-all"
              style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
            />
          </div>
          <div className="mt-2 text-right text-sm font-medium text-slate-700">
            {Math.round(percent)}%
          </div>
        </div>
        <div className="mt-3 text-xs text-slate-500">
          Vui lòng đợi đến khi hoàn tất.
        </div>
      </div>
    </div>
  );
}

/* --------- Unit item (draggable, có nút ↑↓) --------- */
function UnitRow({ u, onDragStart, onDropBefore, canUp, canDown, onUp, onDown }) {
  return (
    <div
      className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 ring-1 ring-slate-200 hover:ring-emerald-300 select-none"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const type = e.dataTransfer.getData("dragType");
        if (type !== "unit") return;
        const unitID = Number(e.dataTransfer.getData("unitID"));
        const fromBucket = Number(e.dataTransfer.getData("fromBucketID"));
        onDropBefore?.(unitID, fromBucket, u.unitID);
      }}
    >
      <div
        draggable
        onDragStart={(e) => {
          onDragStart?.(u);
          e.dataTransfer.setData("dragType", "unit");
          e.dataTransfer.setData("unitID", String(u.unitID));
          e.dataTransfer.setData("fromBucketID", String(u.bucketID));
        }}
        className="h-6 w-6 grid place-items-center rounded-md bg-slate-100 text-slate-500 cursor-grab active:cursor-grabbing"
        title="Kéo để di chuyển/sắp xếp"
      >
        <GripVertical className="size-4" />
      </div>

      <div className="flex-1">
        <div className="text-sm font-semibold text-slate-800">{u.unitName}</div>
        <div className="text-xs text-slate-500">ID: {u.unitID}</div>
      </div>

      <div className="flex items-center gap-1">
        <button
          className={`h-7 w-7 grid place-items-center rounded-md ${canUp ? "bg-slate-100 hover:bg-slate-200" : "bg-slate-50 text-slate-400 cursor-not-allowed"}`}
          onClick={onUp}
          disabled={!canUp}
          title="Đưa lên"
        >
          <ArrowUp className="size-4" />
        </button>
        <button
          className={`h-7 w-7 grid place-items-center rounded-md ${canDown ? "bg-slate-100 hover:bg-slate-200" : "bg-slate-50 text-slate-400 cursor-not-allowed"}`}
          onClick={onDown}
          disabled={!canDown}
          title="Đưa xuống"
        >
          <ArrowDown className="size-4" />
        </button>
      </div>
    </div>
  );
}

/* --------- Bucket (drop container) --------- */
function BucketCol({ b, onDropToBucket, onDropBeforeUnit, onBumpUnit }) {
  return (
    <div
      data-bucket={b.bucketID}
      className="rounded-2xl border bg-white p-4 ring-1 ring-slate-200"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const type = e.dataTransfer.getData("dragType");
        if (type !== "unit") return;
        const unitID = Number(e.dataTransfer.getData("unitID"));
        const fromBucket = Number(e.dataTransfer.getData("fromBucketID"));
        onDropToBucket?.(b.bucketID, unitID, fromBucket); // thả vào vùng trống => đưa xuống cuối
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <FaLayerGroup className="text-pink-500" />
          <h3 className="font-semibold text-slate-800">{b.bucketName}</h3>
        </div>
        <span className="text-xs text-slate-500">{b.units?.length || 0} chuyền</span>
      </div>

      <div className="grid gap-2">
        {b.units?.length ? (
          b.units.map((u, idx) => (
            <UnitRow
              key={u.unitID}
              u={{ ...u, bucketID: b.bucketID }}
              onDragStart={() => {}}
              onDropBefore={(unitID, fromBucketID, beforeUnitID) => onDropBeforeUnit(b.bucketID, unitID, fromBucketID, beforeUnitID)}
              canUp={idx > 0}
              canDown={idx < b.units.length - 1}
              onUp={() => onBumpUnit(b.bucketID, u.unitID, -1)}
              onDown={() => onBumpUnit(b.bucketID, u.unitID, +1)}
            />
          ))
        ) : (
          <div className="rounded-lg border border-dashed p-4 text-center text-slate-400 bg-slate-50">
            Kéo chuyền vào đây
          </div>
        )}
      </div>
    </div>
  );
}

/* --------- Header drag cho bucket (sắp xếp nhóm) --------- */
function BucketHeaderDraggable({ b, onDragStart, children }) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        onDragStart?.(b.bucketID);
        e.dataTransfer.setData("dragType", "bucket");
        e.dataTransfer.setData("bucketID", String(b.bucketID));
      }}
      className="flex items-center gap-2"
      title="Kéo để sắp xếp thứ tự bucket"
    >
      <GripVertical className="size-4 text-slate-400" />
      {children}
    </div>
  );
}

/* ================== MAIN ================== */
export default function ReportGrouping() {
  const [buckets, setBuckets] = useState([]); // [{bucketID, bucketName, orderIndex, units:[{unitID, unitName, orderIndex}]}]
  const [loading, setLoading] = useState(false);

  // trạng thái "chưa lưu"
  const [dirtyBucketOrder, setDirtyBucketOrder] = useState(false);
  const [dirtyUnits, setDirtyUnits] = useState(false);
  const hasDirty = dirtyBucketOrder || dirtyUnits;

  // snapshot ban đầu để tính diff / hoàn tác
  const originalRef = useRef([]);

  // thông báo
  const [toast, setToast] = useState({ open: false, type: "success", message: "" });
  const openToast = (msg, type = "success") => setToast({ open: true, type, message: msg });
  const closeToast = () => setToast(s => ({ ...s, open: false }));

  // modal lỗi & thành công
  const [errorModal, setErrorModal] = useState({ open: false, title: "Lỗi", message: "" });
  const showError = (title, message) => setErrorModal({ open: true, title, message });
  const [okModal, setOkModal] = useState({ open: false, title: "Thành công", message: "" });

  // overlay lưu + tiến trình
  const [saving, setSaving] = useState(false);
  const [savingPct, setSavingPct] = useState(0);
  const [savingDetail, setSavingDetail] = useState("");

  const deepClone = (x) => JSON.parse(JSON.stringify(x));

  const load = async () => {
    setLoading(true);
    try {
      const rs = await http.get(`${BASE_URL}/api/table/buckets`);
      const data = rs.data?.data || [];
      setBuckets(data);
      originalRef.current = deepClone(data);
      setDirtyBucketOrder(false);
      setDirtyUnits(false);
    } catch (e) {
      console.error(e);
      setBuckets([]);
      showError("Không tải được danh sách tổ", "Vui lòng kiểm tra kết nối hoặc thử lại sau.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  /* ====== Reorder bucket (nhóm) - chỉ đổi state ====== */
  const onBucketDragOverContainer = (e) => e.preventDefault();
  const onBucketDropOnBucket = (e, targetBucketId) => {
    const type = e.dataTransfer.getData("dragType");
    if (type !== "bucket") return;
    const sourceId = Number(e.dataTransfer.getData("bucketID"));
    if (!Number.isInteger(sourceId) || sourceId === targetBucketId) return;

    setBuckets(prev => {
      const next = [...prev];
      const srcIdx = next.findIndex(b => b.bucketID === sourceId);
      const tgtIdx = next.findIndex(b => b.bucketID === targetBucketId);
      if (srcIdx < 0 || tgtIdx < 0) return prev;
      const [moved] = next.splice(srcIdx, 1);
      next.splice(tgtIdx, 0, moved);
      return next;
    });
    setDirtyBucketOrder(true);
    openToast("Đã thay đổi thứ tự tổ (chưa lưu)");
  };

  const bumpBucket = (bucketID, dir) => {
    setBuckets(prev => {
      const next = [...prev];
      const i = next.findIndex(b => b.bucketID === bucketID);
      if (i < 0) return prev;
      const j = dir === "up" ? i - 1 : i + 1;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    setDirtyBucketOrder(true);
    openToast("Đã thay đổi thứ tự tổ (chưa lưu)");
  };

  /* ====== Move unit giữa các bucket (CHỈ đổi state) ====== */
  const moveUnitToBucketEnd = (toBucketId, unitId, fromBucketId) => {
    setBuckets(prev => {
      const out = prev.map(b => ({ ...b, units: [...(b.units || [])] }));
      let moved = null;
      const src = out.find(b => b.bucketID === fromBucketId);
      if (src) {
        const i = src.units.findIndex(u => u.unitID === unitId);
        if (i >= 0) { moved = src.units[i]; src.units.splice(i, 1); }
      }
      const dst = out.find(b => b.bucketID === toBucketId);
      if (dst && moved) dst.units.push({ ...moved });
      return out;
    });
    setDirtyUnits(true);
    openToast("Đã chuyển chuyền (chưa lưu)");
  };

  /* ====== Chèn unit trước 1 unit khác (CHỈ đổi state) ====== */
  const insertUnitBefore = (bucketId, unitId, fromBucketId, beforeUnitId) => {
    setBuckets(prev => {
      const out = prev.map(b => ({ ...b, units: [...(b.units || [])] } ));
      // lấy & xoá unit từ bucket nguồn
      let moving = null;
      const from = out.find(b => b.bucketID === fromBucketId);
      if (from) {
        const i = from.units.findIndex(u => u.unitID === unitId);
        if (i >= 0) { moving = from.units[i]; from.units.splice(i, 1); }
      }
      // chèn vào bucket đích trước beforeUnitId
      const dst = out.find(b => b.bucketID === bucketId);
      if (dst && moving) {
        const j = dst.units.findIndex(u => u.unitID === beforeUnitId);
        const insertPos = j >= 0 ? j : dst.units.length;
        dst.units.splice(insertPos, 0, { ...moving });
      }
      return out;
    });
    setDirtyUnits(true);
    openToast("Đã sắp xếp chuyền (chưa lưu)");
  };

  /* ====== Nút ↑↓ trong cùng bucket (CHỈ đổi state) ====== */
  const bumpUnit = (bucketId, unitId, dir) => {
    setBuckets(prev => {
      const out = prev.map(b => ({ ...b, units: [...(b.units || [])] } ));
      const b = out.find(x => x.bucketID === bucketId);
      if (!b) return prev;
      const i = b.units.findIndex(u => u.unitID === unitId);
      if (i < 0) return prev;
      const j = i + dir;
      if (j < 0 || j >= b.units.length) return prev;
      [b.units[i], b.units[j]] = [b.units[j], b.units[i]];
      return out;
    });
    setDirtyUnits(true);
    openToast("Đã sắp xếp chuyền (chưa lưu)");
  };

  /* ====== Tính diff & Lưu tất cả thay đổi ====== */
  const saveAll = async () => {
    if (!hasDirty) return;
    setSaving(true);
    setSavingPct(0);
    setSavingDetail("Chuẩn bị lưu…");
    try {
      const before = originalRef.current;
      const after = buckets;

      // 1) Reorder bucket?
      const beforeBucketIds = before.map(b => b.bucketID);
      const afterBucketIds = after.map(b => b.bucketID);
      const bucketOrderChanged = JSON.stringify(beforeBucketIds) !== JSON.stringify(afterBucketIds);

      // 2) Moved units (bucket thay đổi)?
      const getUnitBucketMap = (list) => {
        const mp = new Map(); // unitID -> bucketID
        for (const b of list) for (const u of (b.units || [])) mp.set(u.unitID, b.bucketID);
        return mp;
      };
      const beforeUB = getUnitBucketMap(before);
      const afterUB  = getUnitBucketMap(after);
      const moves = [];
      afterUB.forEach((bkt, uid) => {
        const old = beforeUB.get(uid);
        if (old !== undefined && old !== bkt) moves.push({ unitId: uid, toBucketId: bkt });
      });

      // 3) Reorder units trong từng bucket?
      const diffReorderUnits = [];
      for (const b of after) {
        const aIds = (b.units || []).map(u => u.unitID);
        const old = before.find(x => x.bucketID === b.bucketID);
        const bIds = (old?.units || []).map(u => u.unitID);
        if (JSON.stringify(aIds) !== JSON.stringify(bIds)) {
          diffReorderUnits.push({ bucketId: b.bucketID, orderedUnitIds: aIds });
        }
      }

      // Tổng số bước để tính % tiến trình
      const totalSteps = moves.length + (bucketOrderChanged ? 1 : 0) + diffReorderUnits.length || 1;
      let done = 0;
      const tick = (label) => {
        done += 1;
        setSavingDetail(label);
        setSavingPct(Math.round((done / totalSteps) * 100));
      };

      // ==== Gọi API (tuần tự, an toàn) ====
      // a) move-unit (nếu có)
      for (let i = 0; i < moves.length; i++) {
        const m = moves[i];
        setSavingDetail(`Di chuyển chuyền ${i + 1}/${moves.length}`);
        await http.patch(`${BASE_URL}/api/table/move-unit`, m);
        tick(`Đã di chuyển chuyền ${i + 1}/${moves.length}`);
      }

      // b) reorder-buckets (nếu có)
      if (bucketOrderChanged) {
        setSavingDetail("Lưu thứ tự tổ…");
        await http.patch(`${BASE_URL}/api/table/reorder-buckets`, { orderedBucketIds: afterBucketIds });
        tick("Đã lưu thứ tự tổ");
      }

      // c) reorder-units cho các bucket đổi thứ tự
      for (let i = 0; i < diffReorderUnits.length; i++) {
        const r = diffReorderUnits[i];
        setSavingDetail(`Lưu thứ tự chuyền ${i + 1}/${diffReorderUnits.length}`);
        await http.patch(`${BASE_URL}/api/table/reorder-units`, r);
        tick(`Đã lưu thứ tự chuyền ${i + 1}/${diffReorderUnits.length}`);
      }

      // OK → cập nhật snapshot và trạng thái
      originalRef.current = deepClone(after);
      setDirtyBucketOrder(false);
      setDirtyUnits(false);

      setSavingDetail("Hoàn tất!");
      setSavingPct(100);
      setTimeout(() => {
        setSaving(false);
        setOkModal({ open: true, title: "Thành công", message: "Đã lưu tất cả thay đổi." });
      }, 400);
    } catch (e) {
      console.error(e);
      setSaving(false);
      showError("Lưu thay đổi thất bại", "Không thể lưu cấu trúc tổ/chuyền. Vui lòng thử lại.");
      // không reset state; người dùng có thể bấm Lưu lại
    }
  };

  const discardChanges = () => {
    setBuckets(deepClone(originalRef.current));
    setDirtyBucketOrder(false);
    setDirtyUnits(false);
    openToast("Đã hoàn tác thay đổi", "success");
  };

  // Khi đang lưu → chặn toàn bộ tương tác bằng overlay; để chắc ăn thêm pointer-events-none cho phần nội dung.
  const blockClass = saving ? "pointer-events-none opacity-60" : "";

  return (
    <div className="bg-gradient-to-br from-[#FFEBEE] via-[#E3F2FD] to-[#E8F5E9] p-4">
      <div className={`w-full bg-white rounded-2xl shadow-xl ring-1 ring-slate-200 px-6 md:px-8 py-8 space-y-6 ${blockClass}`} aria-busy={saving}>
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <motion.div initial={{ rotate:-8, scale:0.9 }} animate={{ rotate:0, scale:1 }}
              transition={{ type:"spring", stiffness:300 }} className="text-pink-600 text-3xl">
              <FaLayerGroup />
            </motion.div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800">
              Phân chia & sắp xếp tổ / chuyền
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              disabled={loading || saving}
              className={`h-10 px-4 rounded-lg text-sm font-medium shadow-sm ring-1 ${
                loading || saving ? "bg-slate-200 text-slate-500 ring-slate-200 cursor-not-allowed"
                        : "bg-white text-slate-800 ring-slate-200 hover:bg-slate-50"}`}
              title="Tải lại"
            >
              <RefreshCcw className="inline size-4 mr-2" />
              {loading ? "Đang tải..." : "Tải lại"}
            </button>
          </div>
        </div>

        {/* Thanh sắp xếp tổ (kéo-thả hoặc nút) */}
        <div className="rounded-xl ring-1 ring-slate-200 bg-slate-50 p-3 overflow-x-auto"
             onDragOver={onBucketDragOverContainer}>
          <div className="flex items-stretch gap-2 min-w-[640px]">
            {buckets.map((b, idx) => (
              <div key={b.bucketID}
                   onDrop={(e)=>onBucketDropOnBucket(e, b.bucketID)}
                   className="flex items-center gap-2 rounded-lg bg-white ring-1 ring-slate-200 px-3 py-2">
                <BucketHeaderDraggable b={b}>
                  <div className="font-semibold text-slate-800">{b.bucketName}</div>
                </BucketHeaderDraggable>
                <div className="ml-1 text-xs text-slate-500">#{idx + 1}</div>
                <div className="flex items-center gap-1 ml-2">
                  <button className="h-8 w-8 grid place-items-center rounded-md bg-slate-100 hover:bg-slate-200"
                          onClick={()=>bumpBucket(b.bucketID, "up")} title="Đưa lên trên" disabled={saving}>
                    <ArrowUpAZ className="size-4" />
                  </button>
                  <button className="h-8 w-8 grid place-items-center rounded-md bg-slate-100 hover:bg-slate-200"
                          onClick={()=>bumpBucket(b.bucketID, "down")} title="Đưa xuống dưới" disabled={saving}>
                    <ArrowDownZA className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Board các tổ + danh sách chuyền */}
        {loading ? (
          <p className="text-slate-500 italic">Đang tải...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
            {buckets.map(b => (
              <BucketCol
                key={b.bucketID}
                b={b}
                onDropToBucket={moveUnitToBucketEnd}
                onDropBeforeUnit={insertUnitBefore}
                onBumpUnit={bumpUnit}
              />
            ))}
          </div>
        )}

        {/* Bar “chưa lưu” cố định dưới cùng */}
        <div className={`fixed left-0 right-0 bottom-3 mx-auto w-fit ${hasDirty ? "opacity-100" : "pointer-events-none opacity-0"} transition`}>
          <div className="rounded-xl bg-white shadow-2xl ring-1 ring-slate-200 px-4 py-3 flex items-center gap-3">
            <span className="text-sm text-slate-700">
              Có thay đổi chưa lưu
            </span>
            <button
              onClick={discardChanges}
              className="h-9 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm"
              disabled={saving}
            >
              Hoàn tác
            </button>
            <button
              onClick={saveAll}
              disabled={saving}
              className={`h-9 px-3 rounded-lg text-sm text-white ${saving ? "bg-emerald-300 cursor-wait" : "bg-emerald-600 hover:bg-emerald-700"}`}
            >
              {saving ? "Đang lưu..." : "Lưu tất cả"}
            </button>
          </div>
        </div>

        {/* Modals & Toasts */}
        <Modal open={errorModal.open} title={errorModal.title} message={errorModal.message} onClose={()=>setErrorModal(s=>({ ...s, open:false }))} />
        <Modal open={okModal.open} title={okModal.title} message={okModal.message} onClose={()=>setOkModal(s=>({ ...s, open:false }))} />
        <Toast open={toast.open} type={toast.type} message={toast.message} onClose={closeToast} />
      </div>

      {/* Overlay saving + % (khóa toàn bộ tương tác) */}
      <SavingOverlay open={saving} percent={savingPct} detail={savingDetail} />
    </div>
  );
}
