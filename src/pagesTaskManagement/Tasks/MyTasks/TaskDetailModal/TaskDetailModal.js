// src/pageTaskManagement/MyTasks/TaskDetailModal.jsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import http from "~/api/http";
import { BASE_URL } from "~/config";
import { LabelSmall, StatusBadge, PriorityBadge } from "../TaskUI";
import TaskInfoSection from "./TaskInfoSection";
import TaskAttachmentsSection from "./TaskAttachmentsSection";
import TaskEditSection from "./TaskEditSection";
import TaskDeleteConfirmModal from "./TaskDeleteConfirmModal";
import AttachmentDeleteConfirmModal from "./AttachmentDeleteConfirmModal";
import TaskImageViewerOverlay from "./TaskImageViewerOverlay";

const statusOptions = [
  { value: "todo", label: "Cần làm" },
  { value: "doing", label: "Đang làm" },
  { value: "review", label: "Chờ duyệt" },
  { value: "done", label: "Hoàn thành" },
];

export default function TaskDetailModal({ taskId, onClose, onChanged }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const [task, setTask] = useState(null);

  const [attachments, setAttachments] = useState([]);
  const [signedUrlById, setSignedUrlById] = useState({});

  const [uploading, setUploading] = useState(false);
  const [newFiles, setNewFiles] = useState([]);
  const fileInputRef = useRef(null);

  const [description, setDescription] = useState("");
  const [statusCode, setStatusCode] = useState("todo");
  const [repeatDaily, setRepeatDaily] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [attachmentToDelete, setAttachmentToDelete] = useState(null);
  const [deletingAttachment, setDeletingAttachment] = useState(false);

  const [imageViewer, setImageViewer] = useState({
    open: false,
    index: 0,
  });

  useEffect(() => {
    if (!taskId) return;
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  async function loadDetail() {
    setLoading(true);
    setError("");
    try {
      const res = await http.get(`${BASE_URL}/api/task-management/${taskId}`);
      const data = res.data?.data;
      setTask(data || null);

      if (data) {
        setDescription(data.description || "");
        setStatusCode(data.statusCode || "todo");
        setRepeatDaily(!!data.repeatDaily);
        setProgressPercent(
          typeof data.progressPercent === "number" ? data.progressPercent : 0
        );
        setAttachments(data.attachments || []);
      } else {
        setAttachments([]);
      }
      setSignedUrlById({});
    } catch (e) {
      console.error("load task detail error", e);
      setError("Không tải được chi tiết công việc.");
    } finally {
      setLoading(false);
    }
  }

  const imageAttachments = useMemo(
    () => (attachments || []).filter((a) => a.mimeType?.startsWith("image/")),
    [attachments]
  );

  const fileAttachments = useMemo(
    () => (attachments || []).filter((a) => !a.mimeType?.startsWith("image/")),
    [attachments]
  );

  // load signedUrl cho ảnh
  useEffect(() => {
    let cancelled = false;

    async function fetchSignedUrlsForImages() {
      if (!imageAttachments.length) {
        if (!cancelled) setSignedUrlById({});
        return;
      }

      const result = {};
      try {
        await Promise.all(
          imageAttachments.map(async (att) => {
            try {
              const r = await http.get(
                `${BASE_URL}/api/task-management/attachments/${att.attachmentId}/download`
              );
              result[att.attachmentId] = r.data?.url || null;
            } catch (err) {
              console.error("fetch signed url for image error:", err);
              result[att.attachmentId] = null;
            }
          })
        );
        if (!cancelled) {
          setSignedUrlById((prev) => ({ ...prev, ...result }));
        }
      } catch (err) {
        console.error("fetchSignedUrlsForImages error:", err);
      }
    }

    fetchSignedUrlsForImages();

    return () => {
      cancelled = true;
    };
  }, [imageAttachments]);

  async function handleSave() {
    if (!taskId) return;
    setSaving(true);
    setError("");
    try {
      const safeProgress =
        Number.isFinite(+progressPercent) && +progressPercent >= 0
          ? Math.min(100, Math.max(0, +progressPercent))
          : 0;

      await http.patch(`${BASE_URL}/api/task-management/${taskId}`, {
        description: description?.trim() || null,
        statusCode,
        repeatDaily: !!repeatDaily,
        progressPercent: safeProgress,
      });

      onChanged?.("updated");
      onClose?.();
    } catch (e) {
      console.error("update task error", e);
      setError("Lưu thay đổi thất bại.");
    } finally {
      setSaving(false);
    }
  }

  function askDelete() {
    setShowDeleteConfirm(true);
  }

  async function handleDeleteConfirmed() {
    if (!taskId) return;
    setDeleting(true);
    setError("");
    try {
      await http.delete(`${BASE_URL}/api/task-management/${taskId}`);
      onChanged?.("deleted");
      onClose?.();
    } catch (e) {
      console.error("delete task error", e);
      setError("Xoá công việc thất bại.");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  function handleFileChange(e) {
    const files = Array.from(e.target.files || []);
    setNewFiles(files);
  }

  function handleRemoveNewFile(idx) {
    setNewFiles((prev) => prev.filter((_, i) => i !== idx));
    if (newFiles.length === 1 && fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleUploadAttachments() {
    if (!taskId || !newFiles.length) return;
    setUploading(true);
    setError("");

    try {
      const fd = new FormData();
      newFiles.forEach((f) => fd.append("files", f));

      await http.post(
        `${BASE_URL}/api/task-management/${taskId}/attachments`,
        fd,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setNewFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await loadDetail();
    } catch (e) {
      console.error("upload attachments error", e);
      setError("Tải tệp lên thất bại.");
    } finally {
      setUploading(false);
    }
  }

  function askDeleteAttachment(att) {
    setAttachmentToDelete(att);
  }

  async function handleDeleteAttachmentConfirmed() {
    if (!attachmentToDelete) return;
    setDeletingAttachment(true);
    setError("");

    const deletingId = attachmentToDelete.attachmentId;

    try {
      await http.delete(
        `${BASE_URL}/api/task-management/attachments/${deletingId}`
      );

      setAttachments((prev) => {
        const newList = prev.filter((x) => x.attachmentId !== deletingId);

        if (imageViewer.open) {
          const remainingImages = newList.filter((a) =>
            a.mimeType?.startsWith("image/")
          );

          if (!remainingImages.length) {
            setImageViewer({ open: false, index: 0 });
          } else {
            setImageViewer((prevViewer) => {
              const oldIdx = imageAttachments.findIndex(
                (x) => x.attachmentId === deletingId
              );
              let newIndex = prevViewer.index;

              if (oldIdx >= 0) {
                if (newIndex > oldIdx) newIndex -= 1;
                if (newIndex >= remainingImages.length) {
                  newIndex = remainingImages.length - 1;
                }
              }

              return { ...prevViewer, index: newIndex };
            });
          }
        }

        return newList;
      });

      setAttachmentToDelete(null);
    } catch (e) {
      console.error("delete attachment error", e);
      setError("Xoá tệp thất bại.");
    } finally {
      setDeletingAttachment(false);
    }
  }

  async function handleDownloadAttachment(att) {
    try {
      const res = await http.get(
        `${BASE_URL}/api/task-management/attachments/${att.attachmentId}/download`
      );
      const url = res.data?.url;
      if (!url) throw new Error("Không có signedUrl");

      const a = document.createElement("a");
      a.href = url;
      a.download = att.fileName || "";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error("download attachment error", e);
      setError("Tải tệp xuống thất bại.");
    }
  }

  function openImageViewerIndex(idx) {
    if (!imageAttachments.length) return;
    const safeIdx = Math.min(
      imageAttachments.length - 1,
      Math.max(0, idx || 0)
    );
    setImageViewer({ open: true, index: safeIdx });
  }

  function closeImageViewer() {
    setImageViewer((v) => ({ ...v, open: false }));
  }

  function nextImage() {
    setImageViewer((prev) => {
      const total = imageAttachments.length;
      if (!total) return prev;
      const nextIndex = (prev.index + 1) % total;
      return { ...prev, index: nextIndex };
    });
  }

  function prevImage() {
    setImageViewer((prev) => {
      const total = imageAttachments.length;
      if (!total) return prev;
      const nextIndex = (prev.index - 1 + total) % total;
      return { ...prev, index: nextIndex };
    });
  }

  if (!taskId) return null;

  const safeProgress =
    Number.isFinite(+progressPercent) && +progressPercent >= 0
      ? Math.min(100, Math.max(0, +progressPercent))
      : 0;

  const currentImage =
    imageViewer.open && imageAttachments.length > 0
      ? imageAttachments[
          Math.min(imageAttachments.length - 1, Math.max(0, imageViewer.index))
        ]
      : null;

  return (
    <div className="fixed inset-0 z-[70]">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* modal chính */}
      <div className="absolute inset-x-3 md:inset-x-0 top-6 mx-auto max-w-3xl card p-4 md:p-6">
        {/* header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400 font-semibold">
              Chi tiết công việc
            </p>
            <h2 className="mt-1 text-base md:text-lg font-bold text-slate-900 line-clamp-5">
              {task ? `#${task.taskId} – ${task.title}` : "Đang tải..."}
            </h2>
            {task && (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                {task.projectCode && (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5">
                    <span className="text-slate-500">Dự án:</span>
                    <span className="ml-1 font-medium text-slate-700">
                      {task.projectCode}
                    </span>
                  </span>
                )}
                <StatusBadge statusCode={statusCode} small />
                <PriorityBadge priority={task.priority} small />
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700 border border-emerald-100">
                  Tiến độ:
                  <span className="ml-1 font-semibold">{safeProgress}%</span>
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
            <button
              onClick={askDelete}
              disabled={deleting}
              className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-60"
            >
              {deleting ? "Đang xoá…" : "Xoá (ẩn)"}
            </button>
            <button
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              onClick={onClose}
            >
              Đóng
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-3 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {loading && (
          <div className="py-8 text-center text-slate-500 text-sm">
            Đang tải chi tiết công việc…
          </div>
        )}

        {!loading && task && (
          <>
            <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
              <TaskInfoSection task={task} />

              <TaskAttachmentsSection
                imageAttachments={imageAttachments}
                fileAttachments={fileAttachments}
                signedUrlById={signedUrlById}
                fileInputRef={fileInputRef}
                newFiles={newFiles}
                uploading={uploading}
                onFileChange={handleFileChange}
                onRemoveNewFile={handleRemoveNewFile}
                onUploadAttachments={handleUploadAttachments}
                onClearSelection={() => {
                  setNewFiles([]);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                onDownloadAttachment={handleDownloadAttachment}
                onAskDeleteAttachment={askDeleteAttachment}
                onOpenImageViewerIndex={openImageViewerIndex}
              />

              <TaskEditSection
                description={description}
                onDescriptionChange={setDescription}
                statusCode={statusCode}
                onStatusChange={setStatusCode}
                repeatDaily={repeatDaily}
                onToggleRepeatDaily={() =>
                  setRepeatDaily((v) => !v)
                }
                safeProgress={safeProgress}
                onProgressSliderChange={(val) =>
                  setProgressPercent(val)
                }
                onProgressInputChange={(val) =>
                  setProgressPercent(
                    Math.min(100, Math.max(0, +val || 0))
                  )
                }
                statusOptions={statusOptions}
              />
            </div>

            {/* footer */}
            <div className="mt-4 flex flex-col md:flex-row md:justify-end gap-2">
              <button
                className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                onClick={onClose}
              >
                Hủy
              </button>
              <button
                disabled={saving}
                className="inline-flex items-center rounded-full border border-emerald-500 bg-emerald-600 px-4 py-2 text-xs md:text-sm font-semibold text-white shadow-sm disabled:opacity-60 hover:bg-emerald-500"
                onClick={handleSave}
              >
                {saving ? "Đang lưu…" : "Lưu thay đổi"}
              </button>
            </div>
          </>
        )}

        <TaskDeleteConfirmModal
          open={showDeleteConfirm}
          deleting={deleting}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteConfirmed}
        />

        <AttachmentDeleteConfirmModal
          attachment={attachmentToDelete}
          deleting={deletingAttachment}
          onCancel={() => setAttachmentToDelete(null)}
          onConfirm={handleDeleteAttachmentConfirmed}
        />
      </div>

      <TaskImageViewerOverlay
        open={imageViewer.open}
        images={imageAttachments}
        currentIndex={imageViewer.index}
        currentImage={currentImage}
        signedUrlById={signedUrlById}
        onClose={closeImageViewer}
        onPrev={prevImage}
        onNext={nextImage}
        onDotClick={openImageViewerIndex}
        onRequestDeleteCurrent={() => {
          if (currentImage) {
            setAttachmentToDelete(currentImage);
          }
        }}
        deletingAttachment={deletingAttachment}
      />
    </div>
  );
}
