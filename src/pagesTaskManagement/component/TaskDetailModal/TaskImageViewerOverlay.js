// src/pageTaskManagement/MyTasks/TaskImageViewerOverlay.jsx
import React from "react";

export default function TaskImageViewerOverlay({
  open,
  images,
  currentIndex,
  currentImage,
  signedUrlById,
  onClose,
  onPrev,
  onNext,
  onDotClick,
  onRequestDeleteCurrent,
  deletingAttachment,
  user
}) {
  if (!open || !images || images.length === 0) return null;

  const safeIndex = Math.min(images.length - 1, Math.max(0, currentIndex || 0));
  const activeImage = currentImage || images[safeIndex];

  return (
    <div className="fixed inset-0 z-[80] bg-black/80 flex flex-col">
      {/* Thanh trên: xoá + đóng */}
      <div className="flex justify-between items-center px-4 pt-3">
        {
          user?.login?.currentUser?.userID === activeImage?.createdBy ?
          <button
            type="button"
            className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/10 text-xs text-red-100 hover:bg-red-500/70 hover:text-white border border-red-300/40"
            onClick={onRequestDeleteCurrent}
            disabled={deletingAttachment}
          >
            {deletingAttachment ? "Đang xoá…" : "🗑 Xoá hình này"}
          </button> :
          <div></div>
        }

        <button
          type="button"
          className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/10 text-xs text-slate-100 hover:bg-white/20"
          onClick={onClose}
        >
          ✕ Đóng
        </button>
      </div>

      {/* Khu vực ảnh + nút next/prev */}
      <div className="flex-1 flex items-center justify-center px-4 relative">
        {/* Nút prev */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={onPrev}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 
                       text-white absolute left-4 md:left-8 top-1/2 -translate-y-1/2 active:scale-95
                       shadow-md"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        <div className="max-w-4xl max-h-[80vh] w-full flex items-center justify-center">
          {activeImage ? (
            <img
              src={signedUrlById[activeImage.attachmentId] || ""}
              alt={activeImage.fileName}
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-lg bg-black/40 cursor-pointer"
              onClick={onNext}
            />
          ) : (
            <div className="text-white/70 text-sm">Đang tải hình ảnh…</div>
          )}
        </div>

        {/* Nút next */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={onNext}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 
                       text-white absolute right-4 md:right-8 top-1/2 -translate-y-1/2 active:scale-95
                       shadow-md"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 6 15 12 9 18" />
            </svg>
          </button>
        )}
      </div>

      {/* dot + info dưới */}
      <div className="pb-4 flex flex-col items-center gap-2">
        <div className="text-[11px] text-white/80">
          {images.length > 0 && activeImage
            ? `${images.indexOf(activeImage) + 1}/${images.length} – ${
                activeImage.fileName
              }`
            : ""}
        </div>
        <div className="flex gap-1">
          {images.map((att, idx) => (
            <button
              key={att.attachmentId}
              onClick={() => onDotClick(idx)}
              className={`w-2 h-2 rounded-full ${
                idx === safeIndex
                  ? "bg-white"
                  : "bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
