// src/pageTaskManagement/MyTasks/AttachmentPreviewModal.jsx
import React from "react";

export default function AttachmentPreviewModal({
  attachment,
  url,
  loading,
  error,
  onClose,
  onRetry,
}) {
  if (!attachment) return null;

  const mime = attachment.mimeType || "";
  const fileName = attachment.fileName || "";
  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  const isImage = mime.startsWith("image/");
  const isPDF = mime.includes("pdf");
  const isOffice =
    ["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext);

  // Nếu là file Office thì dùng Office Web Viewer
  let viewerUrl = url;
  if (isOffice && url) {
    const encoded = encodeURIComponent(url);
    viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encoded}`;
  }

  return (
    <div className="fixed inset-0 z-[85] bg-slate-900/60 flex items-center justify-center">
      {/* overlay */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-[95%] h-[80vh] flex flex-col overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-slate-50">
          <div className="min-w-0">
            <div className="text-xs text-slate-400 uppercase tracking-[0.12em]">
              Xem trước tệp đính kèm
            </div>
            <div className="text-sm font-semibold text-slate-900 truncate">
              {fileName}
            </div>
            <div className="text-[11px] text-slate-500">
              {attachment.mimeType || "Không rõ loại"}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 bg-white hover:bg-slate-100"
          >
            ✕ Đóng
          </button>
        </div>

        {/* body */}
        <div className="flex-1 bg-slate-900/5 relative">
          {/* loading */}
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-sm">
              <div className="w-6 h-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mb-2" />
              Đang tải file xem trước…
            </div>
          )}

          {/* lỗi */}
          {!loading && error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
              <div className="text-xs text-rose-600 mb-2">{error}</div>
              <div className="text-[11px] text-slate-500 mb-3">
                Bạn có thể thử tải lại hoặc dùng nút tải về trong danh sách tệp.
              </div>
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border border-slate-300 bg-white hover:bg-slate-50"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* nội dung preview */}
          {!loading && !error && url && (
            <>
              {isImage && (
                <div className="w-full h-full flex items-center justify-center bg-black/80">
                  <img
                    src={url}
                    alt={fileName}
                    className="max-w-full max-h-full object-contain rounded-xl shadow-lg bg-black/40"
                  />
                </div>
              )}

              {isPDF && !isImage && (
                <iframe
                  title={fileName}
                  src={url}
                  className="w-full h-full border-0 bg-slate-900/10"
                />
              )}

              {isOffice && !isImage && !isPDF && (
                <iframe
                  title={fileName}
                  src={viewerUrl}
                  className="w-full h-full border-0 bg-slate-900/10"
                />
              )}

              {!isImage && !isPDF && !isOffice && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                  <div className="text-sm font-semibold text-slate-800 mb-2">
                    Không hỗ trợ xem trước loại file này
                  </div>
                  <div className="text-[11px] text-slate-500 mb-3">
                    Trình duyệt thường sẽ tự động tải về các file nhị phân. Vui
                    lòng dùng nút <span className="font-semibold">⬇ Tải</span>{" "}
                    ở danh sách tệp để mở file trên máy.
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
