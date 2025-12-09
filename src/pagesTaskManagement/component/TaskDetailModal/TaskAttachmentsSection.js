// src/pageTaskManagement/MyTasks/TaskAttachmentsSection.jsx
import React from "react";
import { LabelSmall } from "../TaskUI";
import { fmtSize } from "./taskFormatters";

export default function TaskAttachmentsSection({
  imageAttachments,
  fileAttachments,
  signedUrlById,
  fileInputRef,
  newFiles,
  uploading,
  onFileChange,
  onRemoveNewFile,
  onUploadAttachments,
  onClearSelection,
  onDownloadAttachment,
  onAskDeleteAttachment,
  onOpenImageViewerIndex,
  onPreviewAttachment,
  user,
  userIdTaskTodo,
  userIdTaskCreate
}) {

  return (
    <>
      {/* Gallery ảnh */}
      {imageAttachments.length > 0 && (
        <div className="mt-2">
          <div className="flex items-center justify-between">
            <LabelSmall>Hình ảnh</LabelSmall>
            <span className="text-[11px] text-slate-500">
              {imageAttachments.length} hình
            </span>
          </div>

          <div className="mt-1 flex gap-2 flex-wrap">
            {imageAttachments.slice(0, 4).map((att, idx) => {
              const total = imageAttachments.length;
              const isMoreTile = idx === 3 && total > 4;
              const url = signedUrlById[att.attachmentId] || "";

              return (
                <button
                  key={att.attachmentId}
                  type="button"
                  onClick={() => onOpenImageViewerIndex(idx)}
                  className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex-shrink-0"
                >
                  {url ? (
                    <img
                      src={url}
                      alt={att.fileName}
                      className={`w-full h-full object-cover ${
                        isMoreTile ? "brightness-75" : ""
                      }`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">
                      Đang tải…
                    </div>
                  )}

                  {isMoreTile && total > 4 && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <span className="text-xs font-semibold text-white">
                        +{total - 4}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tệp đính kèm (file) */}
      <div className="border-t border-slate-200 pt-3 mt-3 space-y-2">
        <div className="flex items-center justify-between">
          <LabelSmall>Tệp đính kèm</LabelSmall>
          {fileAttachments && fileAttachments.length > 0 && (
            <span className="text-[11px] text-slate-500">
              {fileAttachments.length} tệp
            </span>
          )}
        </div>

        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
          {(!fileAttachments || fileAttachments.length === 0) && (
            <div className="text-[11px] text-slate-400 italic">
              Chưa có tệp nào đính kèm.
            </div>
          )}

          {fileAttachments.map((att) => (
            <div
              key={att.attachmentId}
              role="button"
              tabIndex={0}
              className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] cursor-pointer hover:bg-slate-100 transition-colors"
              onClick={() => onPreviewAttachment?.(att)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-slate-500">📎</span>
                <div className="min-w-0">
                  <div className="truncate text-slate-800">
                    {att.fileName}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {att.mimeType || "Không rõ"} · {fmtSize(att.fileSize)} ·{" "}
                    {att.uploadedAt
                      ? new Date(att.uploadedAt).toLocaleString("vi-VN")
                      : ""}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownloadAttachment(att);
                  }}
                  className="inline-flex whitespace-nowrap items-center px-2 py-0.5 rounded-full border border-slate-200 bg-white text-[10px] text-slate-700 hover:bg-slate-50"
                >
                  ⬇ Tải
                </button>

                {
                  user?.login?.currentUser?.userID === att?.createdBy &&
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAskDeleteAttachment(att);
                    }}
                    className="inline-flex whitespace-nowrap items-center px-2 py-0.5 rounded-full border border-rose-200 bg-rose-50 text-[10px] text-rose-600 hover:bg-rose-100"
                  >
                    ✕ Xoá
                  </button>
                }
              </div>
            </div>
          ))}
        </div>

        {/* Upload mới */}
        {
          (userIdTaskTodo?.some(a => a.userID === user?.login?.currentUser?.userID) || user?.login?.currentUser?.userID === userIdTaskCreate) &&
          <div className="mt-2 flex md:flex-row md:items-start gap-2">
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={onFileChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-3 py-1.5 rounded-full border border-indigo-500 bg-indigo-50 text-[11px] font-medium text-indigo-700 hover:bg-indigo-100"
              >
                📂 Chọn tệp / hình ảnh…
              </button>

              {!!newFiles.length && (
                <div className="mt-2 space-y-1">
                  <div className="text-[11px] text-slate-500">
                    Đã chọn {newFiles.length} tệp:
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {newFiles.map((f, idx) => {
                      const isImage = f.type && f.type.startsWith("image/");
                      const sizeKb = (f.size / 1024).toFixed(1);
                      const previewUrl = isImage
                        ? URL.createObjectURL(f)
                        : null;

                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-[11px] bg-slate-50 rounded-lg px-2 py-1"
                        >
                          {isImage ? (
                            <div className="w-10 h-10 rounded-md overflow-hidden border border-slate-200 flex-shrink-0">
                              <img
                                src={previewUrl}
                                alt={f.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-md border border-slate-200 flex items-center justify-center text-[10px] text-slate-500 flex-shrink-0">
                              FILE
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="truncate font-medium text-slate-700">
                              {f.name}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {(f.type || "Không rõ loại")} • {sizeKb} KB
                            </div>
                          </div>

                          <button
                            type="button"
                            className="ml-1 text-[11px] text-red-500 hover:text-red-600"
                            onClick={() => onRemoveNewFile(idx)}
                          >
                            Xoá
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-2 md:mt-0 flex flex-col items-start gap-2">
              <button
                type="button"
                disabled={uploading || newFiles.length === 0}
                onClick={onUploadAttachments}
                className="inline-flex whitespace-nowrap items-center rounded-full border border-indigo-500 bg-indigo-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm disabled:opacity-50"
              >
                {uploading ? "Đang tải…" : "Tải tệp lên"}
              </button>
              {newFiles.length > 0 && (
                <button
                  type="button"
                  onClick={onClearSelection}
                  className="inline-flex whitespace-nowrap items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-600 hover:bg-slate-50"
                >
                  Xoá lựa chọn
                </button>
              )}
            </div>
          </div>
        }
      </div>
    </>
  );
}
