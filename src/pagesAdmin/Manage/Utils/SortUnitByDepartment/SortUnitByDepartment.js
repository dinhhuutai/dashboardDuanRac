// src/pages/QrOrganizer.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  DndContext,
  useDraggable,
  useDroppable,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { FaQrcode, FaLayerGroup } from "react-icons/fa";
import { BsGear } from "react-icons/bs";
import http from "~/api/http";
import { BASE_URL } from "~/config";

/* -------------- Modal lỗi -------------- */
function ErrorModal({ open, title = "Lỗi", message = "Đã xảy ra lỗi.", onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[10050] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl ring-1 ring-slate-200 p-6">
        <h3 className="text-lg font-semibold text-rose-600">{title}</h3>
        <p className="mt-2 text-slate-700 whitespace-pre-line">{message}</p>
        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="h-10 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------- Unit “kéo thả được” -------------- */
function DraggableUnitCard({ unit, onOpenGallery }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `unit-${unit.unitID}`,
    data: { unit },
  });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className={`group rounded-xl border p-3 bg-white shadow-sm ring-1 ring-slate-200 hover:ring-emerald-300 transition
                  cursor-grab active:cursor-grabbing select-none ${isDragging ? "opacity-70" : ""}`}
    >
      <UnitCardInner unit={unit} onOpenGallery={onOpenGallery} />
    </div>
  );
}

/* -------------- Unit “KHÔNG kéo thả” (QR cấp bộ phận) -------------- */
function StaticUnitCard({ unit, onOpenGallery }) {
  return (
    <div className="group rounded-xl border p-3 bg-white shadow-sm ring-1 ring-slate-200">
      <UnitCardInner unit={unit} onOpenGallery={onOpenGallery} />
      <div className="mt-2 text-[11px] text-slate-500 italic">
        * QR cấp bộ phận — không thể kéo thả (không gắn chuyền)
      </div>
    </div>
  );
}

/* -------------- Khung nội dung chung cho 2 loại card -------------- */
function UnitCardInner({ unit, onOpenGallery }) {
  return (
    <>
      <div className="flex items-center justify-between">
        <div className="font-semibold text-slate-800">
          {unit.unitName}
          {unit.type === "deptOrphan" && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200">QR cấp bộ phận</span>}
        </div>
        <div className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 ring-1 ring-slate-200">
          {typeof unit.unitID === "string" ? "—" : `ID: ${unit.unitID}`}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <FaQrcode className="opacity-70" />
          <span>{unit.qrCount ?? 0} QR</span>
        </div>
        <button onClick={() => onOpenGallery(unit)} className="text-emerald-700 hover:text-emerald-800 hover:underline">
          Xem tất cả
        </button>
      </div>

      {unit.qrThumbs?.length > 0 ? (
        <div className="mt-3 flex -space-x-2">
          {unit.qrThumbs.map((url, i) => (
            <img
              key={i}
              src={url}
              alt={`qr-${i}`}
              className="w-10 h-10 rounded-lg ring-1 ring-slate-200 bg-white object-cover"
              onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/40x40?text=QR")}
            />
          ))}
        </div>
      ) : (
        <div className="mt-3 text-xs text-slate-400">Chưa có ảnh QR</div>
      )}
    </>
  );
}

/* -------------- Droppable column -------------- */
function DroppableDepartment({ dep, children }) {
  const { setNodeRef, isOver } = useDroppable({ id: `dep-${dep.departmentID}`, data: { dep } });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl border bg-white p-4 ring-1 transition ${isOver ? "ring-emerald-300 bg-emerald-50/30" : "ring-slate-200"}`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <FaLayerGroup className="text-pink-500" />
          <h3 className="font-semibold text-slate-800">{dep.departmentName}</h3>
        </div>
        <span className="text-xs text-slate-500">{dep.units?.length || 0} chuyền/khối</span>
      </div>
      <div className="grid gap-3">{children}</div>
    </div>
  );
}

/* -------------- Main -------------- */
export default function SortUnitByDepartment() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [pendingMove, setPendingMove] = useState(null);
  const [saving, setSaving] = useState(false);

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryUnit, setGalleryUnit] = useState(null);
  const [galleryList, setGalleryList] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  const [errOpen, setErrOpen] = useState(false);
  const [errTitle, setErrTitle] = useState("Lỗi");
  const [errMsg, setErrMsg] = useState("");

  const showError = (title, msg) => { setErrTitle(title || "Lỗi"); setErrMsg(msg || "Đã xảy ra lỗi."); setErrOpen(true); };

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } })
  );

  const fetchMap = async () => {
    setLoading(true);
    try {
      const res = await http.get(`${BASE_URL}/api/org/qr-map`);
      setData(res.data?.data || []);
    } catch (e) {
      console.error("Load qr-map error:", e);
      setData([]);
      showError("Không tải được dữ liệu", "Vui lòng kiểm tra kết nối hoặc thử lại sau.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchMap(); }, []);

  const findDepByUnitId = (unitId) => {
    for (const dep of data) {
      if (dep.units?.some((u) => u.unitID === unitId)) return dep;
    }
    return null;
  };

  const onDragEnd = (event) => {
    const { active, over } = event;
    if (!active || !over) return;

    const unit = active.data?.current?.unit;
    const overId = over?.id?.toString() || "";
    if (!unit || !overId.startsWith("dep-")) return;

    // Không cho drag pseudo "(QR cấp bộ phận)"
    if (unit.type === "deptOrphan" || unit.draggable === false) return;

    const toDepId = parseInt(overId.replace("dep-", ""), 10);
    if (!Number.isInteger(toDepId)) return;

    // Nếu không đổi bộ phận thì bỏ
    if (unit.departmentID === toDepId) return;

    const fromDep = findDepByUnitId(unit.unitID);
    const toDep = data.find((d) => d.departmentID === toDepId);
    setPendingMove({ unit, fromDep, toDep });
  };

  const confirmMove = async () => {
    if (!pendingMove) return;
    setSaving(true);
    try {
      const body = {
        unitId: pendingMove.unit.unitID,
        toDepartmentId: pendingMove.toDep.departmentID,
        cascadeTrashBins: true,
      };
      await http.patch(`${BASE_URL}/api/org/move-unit`, body);

      // optimistic UI
      setData((prev) => {
        const out = prev.map((d) => ({ ...d, units: [...(d.units || [])] }));
        const from = out.find((d) => d.departmentID === pendingMove.fromDep.departmentID);
        if (from) from.units = from.units.filter((u) => u.unitID !== pendingMove.unit.unitID);
        const to = out.find((d) => d.departmentID === pendingMove.toDep.departmentID);
        if (to) to.units.push({ ...pendingMove.unit, departmentID: pendingMove.toDep.departmentID });
        return out;
      });
      setPendingMove(null);
    } catch (e) {
      console.error("Move unit error:", e);
      showError("Chuyển chuyền thất bại", "Không thể chuyển chuyền sang bộ phận mới. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  // Open gallery for a unit OR for department-level orphan
  const openGallery = async (unit) => {
    setGalleryOpen(true);
    setGalleryUnit(unit);
    setGalleryList([]);
    setCurrentIdx(0);
    try {
      let url;
      if (unit.type === "deptOrphan") {
        url = `${BASE_URL}/api/org/department/${unit.departmentID}/qrs`;
      } else {
        url = `${BASE_URL}/api/org/unit/${unit.unitID}/qrs`;
      }
      const res = await http.get(url);
      setGalleryList(res.data?.data || []);
    } catch (e) {
      console.error("Load qrs error:", e);
      setGalleryList([]);
      showError("Không tải được ảnh QR", "Vui lòng thử lại sau.");
    }
  };

  const closeGallery = () => { setGalleryOpen(false); setGalleryUnit(null); setGalleryList([]); };
  const prevImg = () => setCurrentIdx((i) => (galleryList.length ? (i - 1 + galleryList.length) % galleryList.length : 0));
  const nextImg = () => setCurrentIdx((i) => (galleryList.length ? (i + 1) % galleryList.length : 0));

  return (
    <div className="bg-gradient-to-br from-[#FFEBEE] via-[#E3F2FD] to-[#E8F5E9] p-4">
      <div className="w-full bg-white rounded-2xl shadow-xl ring-1 ring-slate-200 px-6 md:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <motion.div initial={{ rotate: -8, scale: 0.9 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: "spring", stiffness: 300 }} className="text-pink-600 text-3xl">
              <BsGear />
            </motion.div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800">Sắp xếp QR theo bộ phận</h1>
          </div>
          <button
            onClick={fetchMap}
            disabled={loading}
            className={`h-10 px-4 rounded-lg text-sm font-medium shadow-sm ring-1
              ${loading ? "bg-slate-200 text-slate-500 ring-slate-200 cursor-not-allowed" : "bg-white text-slate-800 ring-slate-200 hover:bg-slate-50"}`}
          >
            {loading ? "Đang tải..." : "↻ Tải lại"}
          </button>
        </div>

        {/* Board */}
        {loading ? (
          <p className="text-slate-500 italic">Đang tải cấu trúc...</p>
        ) : data.length === 0 ? (
          <p className="text-slate-600">Chưa có bộ phận / chuyền.</p>
        ) : (
          <DndContext sensors={sensors} onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.map((dep) => (
                <DroppableDepartment key={dep.departmentID} dep={dep}>
                  {dep.units?.length ? (
                    dep.units.map((u) =>
                      u.type === "deptOrphan" || u.draggable === false ? (
                        <StaticUnitCard key={u.unitID} unit={u} onOpenGallery={openGallery} />
                      ) : (
                        <DraggableUnitCard key={u.unitID} unit={u} onOpenGallery={openGallery} />
                      )
                    )
                  ) : (
                    <div className="rounded-lg border border-dashed p-4 text-center text-slate-400 bg-slate-50">
                      Kéo thả chuyền vào đây
                    </div>
                  )}
                </DroppableDepartment>
              ))}
            </div>
          </DndContext>
        )}

        {/* Confirm move */}
        {pendingMove && (
          <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm grid place-items-center p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl ring-1 ring-slate-200 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-slate-800">Chuyển chuyền</h2>
              <p className="text-slate-700">
                Chuyển <b>{pendingMove.unit.unitName}</b> từ <b>{pendingMove.fromDep?.departmentName}</b> sang <b>{pendingMove.toDep?.departmentName}</b>?
              </p>
              <p className="text-slate-600 text-sm">Hệ thống sẽ cập nhật tổ của chuyền và các QR thuộc chuyền.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setPendingMove(null)} className="h-10 px-4 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800" disabled={saving}>
                  Hủy
                </button>
                <button onClick={confirmMove} className="h-10 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white" disabled={saving}>
                  {saving ? "Đang cập nhật..." : "Xác nhận"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Gallery */}
        {galleryOpen && (
          <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-xl ring-1 ring-slate-200 p-4">
              <button
                onClick={closeGallery}
                className="absolute -top-3 -right-3 inline-flex items-center justify-center size-9 rounded-full bg-white/90 text-slate-700 shadow ring-1 ring-slate-300 hover:bg-white"
                aria-label="Đóng"
              >
                ✕
              </button>

              <div className="mb-3">
                <div className="text-lg font-semibold text-slate-800">
                  {galleryUnit?.unitName} — {galleryList.length} ảnh
                </div>
                <div className="text-sm text-slate-500">Bấm ảnh nhỏ để xem lớn; dùng ‹ / › để chuyển</div>
              </div>

              {galleryList.length > 0 ? (
                <div className="relative">
                  <img
                    src={galleryList[currentIdx]?.qrLink}
                    alt={galleryList[currentIdx]?.trashBinCode || "QR"}
                    className="w-full max-h-[60vh] object-contain rounded-lg ring-1 ring-slate-200 bg-white"
                    onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/600x400?text=QR")}
                  />
                  <div className="absolute inset-0 flex items-center justify-between px-2">
                    <button onClick={prevImg} className="inline-flex items-center justify-center size-10 rounded-full bg-white/90 text-slate-700 shadow ring-1 ring-slate-300 hover:bg-white" aria-label="Ảnh trước">
                      ‹
                    </button>
                    <button onClick={nextImg} className="inline-flex items-center justify-center size-10 rounded-full bg-white/90 text-slate-700 shadow ring-1 ring-slate-300 hover:bg-white" aria-label="Ảnh sau">
                      ›
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-500 py-10">Không có ảnh QR.</div>
              )}

              {galleryList.length > 0 && (
                <div className="mt-4 grid grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-2 max-h-56 overflow-auto">
                  {galleryList.map((it, i) => (
                    <img
                      key={it.trashBinID ?? `${i}`}
                      src={it.qrLink}
                      alt={it.trashBinCode || `QR-${i}`}
                      onClick={() => setCurrentIdx(i)}
                      className={`w-full h-20 object-cover rounded-lg ring-2 ${i === currentIdx ? "ring-emerald-500" : "ring-slate-200"} cursor-pointer bg-white`}
                      onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/80x80?text=QR")}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error modal */}
        <ErrorModal open={errOpen} title={errTitle} message={errMsg} onClose={() => setErrOpen(false)} />
      </div>
    </div>
  );
}
