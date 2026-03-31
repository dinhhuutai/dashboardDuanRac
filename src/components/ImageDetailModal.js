import React, { useEffect, useState, useCallback } from "react";
import { IoMdClose } from "react-icons/io";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const ImageDetailModal = ({
  selectedItem,
  closeModal,
  statuses = null,
  onAdminSave = null,
}) => {
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editStatusId, setEditStatusId] = useState(null);
  const [editProcessingDetail, setEditProcessingDetail] = useState("");
  const [adminSaving, setAdminSaving] = useState(false);

  // Không gọi Hook theo điều kiện -> derive dữ liệu an toàn
  const images = selectedItem?.images ?? [];
  const hasImages = images.length > 0;
  const currentImg = hasImages ? images[selectedImageIdx]?.image_url : "";

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    const hour = String(d.getUTCHours()).padStart(2, "0");
    const minute = String(d.getUTCMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hour}:${minute}`;
  };

  const toggleFullscreen = () => setIsFullscreen((s) => !s);

  const nextImage = useCallback(() => {
    if (!hasImages) return;
    setSelectedImageIdx((i) => (i + 1) % images.length);
  }, [hasImages, images.length]);

  const prevImage = useCallback(() => {
    if (!hasImages) return;
    setSelectedImageIdx((i) => (i - 1 + images.length) % images.length);
  }, [hasImages, images.length]);

  // Keyboard: ←/→ chuyển ảnh, Esc để đóng
  useEffect(() => {
    if (!selectedItem) return; // guard để không add listener khi chưa mở modal

    const onKey = (e) => {
      if (e.key === "Escape") {
        if (isFullscreen) setIsFullscreen(false);
        else closeModal?.();
      } else if (e.key === "ArrowRight") {
        nextImage();
      } else if (e.key === "ArrowLeft") {
        prevImage();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedItem, isFullscreen, closeModal, nextImage, prevImage]);

  useEffect(() => {
    if (!selectedItem) return;
    setEditStatusId(
      selectedItem.statusId != null ? Number(selectedItem.statusId) : null
    );
    setEditProcessingDetail(
      selectedItem.processing_detail != null ? String(selectedItem.processing_detail) : ""
    );
  }, [selectedItem]);

  // *** Chỉ return null SAU khi hook đã được gọi
  if (!selectedItem) return null;

  const {
    categoryName,
    content,
    created_at,
    sender_name,
    sender_department,
    sender_phone,
    statusName,
  } = selectedItem;

  const showAdminPanel = Array.isArray(statuses) && statuses.length > 0 && typeof onAdminSave === "function";

  const handleSaveAdmin = async () => {
    if (!showAdminPanel || editStatusId == null) return;
    setAdminSaving(true);
    try {
      await onAdminSave({
        statusId: editStatusId,
        processing_detail: editProcessingDetail,
      });
    } finally {
      setAdminSaving(false);
    }
  };

  const onBackdropClick = (e) => {
    if (e.target === e.currentTarget) closeModal?.();
  };

  return (
    <div
      className="fixed inset-0 z-[99999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
      onMouseDown={onBackdropClick}
    >
      <div
  className="relative w-full max-w-6xl max-h-[90vh] rounded-2xl bg-white ring-1 ring-slate-200 shadow-2xl overflow-y-auto overscroll-contain animate-[fadeIn_.15s_ease-out]"
  onMouseDown={(e) => e.stopPropagation()}
>

        {/* Close button */}
        <button
          onClick={closeModal}
          className="absolute right-3 top-3 z-20 inline-flex items-center justify-center h-9 w-9 rounded-full bg-white/90 text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-white hover:text-rose-600 transition"
          aria-label="Đóng"
        >
          <IoMdClose size={20} />
        </button>

        {/* Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-6 h-full">
          {/* Image pane */}
          <div className="relative flex flex-col border-b md:border-b-0 md:border-r border-slate-200/70">
            <div className="relative h-[280px] sm:h-[340px] md:h-[420px] bg-slate-50">
              {hasImages ? (
                <>
                  <img
                    src={currentImg}
                    alt={`image-${selectedImageIdx}`}
                    className="absolute inset-0 m-auto max-h-full max-w-full object-contain select-none"
                    onClick={toggleFullscreen}
                  />

                  {/* Controls overlay */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/20 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-between px-2 sm:px-3">
                    <button
                      onClick={prevImage}
                      className="group inline-flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-white/90 text-slate-700 shadow ring-1 ring-slate-200 hover:bg-white transition"
                      aria-label="Ảnh trước"
                    >
                      <FaChevronLeft className="text-base sm:text-lg" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="group inline-flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-white/90 text-slate-700 shadow ring-1 ring-slate-200 hover:bg-white transition"
                      aria-label="Ảnh sau"
                    >
                      <FaChevronRight className="text-base sm:text-lg" />
                    </button>
                  </div>

                  {/* Index pill */}
                  <div className="absolute bottom-2 right-2 rounded-full bg-black/50 text-white text-xs px-2 py-1 backdrop-blur-sm">
                    {selectedImageIdx + 1} / {images.length}
                  </div>
                </>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-slate-500">
                  Không có ảnh đính kèm
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {hasImages && (
              <div className="relative border-t border-slate-200/70 bg-white">
                <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white to-transparent" />
                <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white to-transparent" />
                <div className="flex gap-2 overflow-x-auto px-4 py-3">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      className={[
                        "shrink-0 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/40",
                        selectedImageIdx === idx
                          ? "ring-2 ring-indigo-500"
                          : "border-slate-200 hover:scale-[0.98]",
                      ].join(" ")}
                      onClick={() => setSelectedImageIdx(idx)}
                      aria-label={`Chọn ảnh ${idx + 1}`}
                    >
                      <img
                        src={img.image_url}
                        alt={`thumb-${idx}`}
                        className="h-16 w-20 sm:h-20 sm:w-24 object-cover rounded-md"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Info pane */}
          <div className="flex flex-col h-full">
            <div className="p-5 md:p-6 border-b border-slate-200/70">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-800">
                🎯 Chi tiết góp ý
              </h2>
            </div>

            <div className="p-5 md:p-6 overflow-y-auto space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 px-2.5 py-1 text-xs font-medium">
                  {categoryName}
                </span>
                <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 ring-1 ring-slate-200 px-2.5 py-1 text-xs">
                  {formatDate(created_at)}
                </span>
                {statusName ? (
                  <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 px-2.5 py-1 text-xs font-medium">
                    {statusName}
                  </span>
                ) : null}
              </div>

              {showAdminPanel && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-indigo-900">
                    Xử lý góp ý (admin)
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-600">Tình trạng</label>
                    <select
                      value={editStatusId ?? ""}
                      onChange={(e) => setEditStatusId(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      {statuses.map((s) => (
                        <option key={s.statusId} value={s.statusId}>
                          {s.statusName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-600">Chi tiết xử lý</label>
                    <textarea
                      value={editProcessingDetail}
                      onChange={(e) => setEditProcessingDetail(e.target.value)}
                      rows={4}
                      placeholder="Ghi chú tiến độ, phản hồi nội bộ..."
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y min-h-[96px]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveAdmin}
                    disabled={adminSaving || editStatusId == null}
                    className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {adminSaving ? "Đang lưu..." : "Lưu cập nhật"}
                  </button>
                </div>
              )}

              <div className="text-[15px] leading-relaxed text-slate-800">
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Nội dung</div>
                <div className="rounded-lg bg-slate-50 ring-1 ring-slate-200 px-3 py-2 whitespace-pre-wrap break-words">
                  {content}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg ring-1 ring-slate-200 bg-white p-3">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Người gửi</div>
                  <div className="mt-1 font-medium text-slate-800">{sender_name || "Ẩn danh"}</div>
                </div>
                <div className="rounded-lg ring-1 ring-slate-200 bg-white p-3">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Bộ phận</div>
                  <div className="mt-1 text-slate-800">{sender_department || "-"}</div>
                </div>
                <div className="rounded-lg ring-1 ring-slate-200 bg-white p-3">
                  <div className="text-xs uppercase tracking-wide text-slate-500">SĐT</div>
                  <div className="mt-1 font-mono text-slate-800">{sender_phone || "-"}</div>
                </div>
                {hasImages && (
                  <div className="rounded-lg ring-1 ring-slate-200 bg-white p-3">
                    <div className="text-xs uppercase tracking-wide text-slate-500">
                      Xem toàn màn hình
                    </div>
                    <button
                      onClick={toggleFullscreen}
                      className="mt-2 inline-flex items-center justify-center rounded-lg bg-slate-900 text-white text-xs px-3 py-1.5 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/40"
                    >
                      Mở fullscreen
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Fullscreen viewer */}
        {isFullscreen && hasImages && (
          <div className="fixed inset-0 z-[100000] bg-black/90 flex items-center justify-center">
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-5 right-5 inline-flex items-center justify-center h-10 w-10 rounded-full bg-white/95 text-slate-800 shadow ring-1 ring-slate-300 hover:text-rose-600"
              aria-label="Thoát fullscreen"
            >
              <IoMdClose size={22} />
            </button>

            <button
              onClick={prevImage}
              className="absolute left-5 inline-flex items-center justify-center h-11 w-11 rounded-full bg-white/95 text-slate-800 shadow ring-1 ring-slate-300 hover:bg-white"
              aria-label="Ảnh trước"
            >
              <FaChevronLeft size={18} />
            </button>

            <img
              src={currentImg}
              alt={`fullscreen-${selectedImageIdx}`}
              className="max-w-[92vw] max-h-[82vh] object-contain"
            />

            <button
              onClick={nextImage}
              className="absolute right-5 inline-flex items-center justify-center h-11 w-11 rounded-full bg-white/95 text-slate-800 shadow ring-1 ring-slate-300 hover:bg-white"
              aria-label="Ảnh sau"
            >
              <FaChevronRight size={18} />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/90 text-slate-800 text-xs px-3 py-1.5 shadow">
              {selectedImageIdx + 1} / {images.length}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageDetailModal;
