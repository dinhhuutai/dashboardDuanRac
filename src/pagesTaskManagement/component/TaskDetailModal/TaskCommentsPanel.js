// src/pageTaskManagement/MyTasks/TaskCommentsPanel.jsx
import React, { useState } from "react";
import { LabelSmall } from "../TaskUI";

function formatDateTime(value) {
  if (!value) return "";

  try {
    let v = value;
    if (typeof v === "string") {
      v = v.replace(/Z$/, "");
    }
    const d = new Date(v);
    return d.toLocaleString("vi-VN");
  } catch {
    return "";
  }
}

// spinner nhỏ dùng chung
function Spinner() {
  return (
    <span className="mr-1 inline-block w-3 h-3 border-[2px] border-white/40 border-t-white rounded-full animate-spin" />
  );
}

function CommentItem({
  comment,
  onReply,
  replyingToId,
  onReplyChange,
  replyValue,
  sendingReplyForId,
  onAskDelete,
  user
}) {
  const [showReplies, setShowReplies] = useState(false);
  const hasReplies = (comment.replies || []).length > 0;
  const repliesCount = comment.replies?.length || 0;

  const displayName =
    comment.authorName ||
    comment.authorUserName ||
    (comment.authorId ? `#${comment.authorId}` : "Không rõ");

  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(-2)
    .toUpperCase();

  const isReplying = replyingToId === comment.commentId;
  const isSendingReply = sendingReplyForId === comment.commentId;

  return (
    <div className="mb-3">
      <div className="flex gap-2 relative">
        {/* avatar + line */}
        <div className="relative flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[11px] font-semibold text-slate-700">
            {initials}
          </div>

          {hasReplies && showReplies && (
            <div className="absolute top-8 bottom-0 left-1/2 -translate-x-1/2 w-px bg-slate-200" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="bg-slate-50 rounded-2xl px-3 py-1.5">
            {/* header: tên + thời gian */}
            <div className="flex items-center gap-2 text-[11px]">
              <span className="font-semibold text-slate-800">
                {displayName}
              </span>
              <span className="text-slate-400">
                {formatDateTime(comment.createdAt)}
              </span>
            </div>

            {/* nội dung */}
            <div className="mt-0.5 text-[13px] text-slate-800 whitespace-pre-wrap">
              {comment.body}
            </div>
          </div>
          
            {/* hàng action: Trả lời – Xoá – Xem/Ẩn phản hồi */}
            <div className="mt-1 flex items-center gap-3 text-[11px]">
              <button
                type="button"
                className="font-medium text-sky-600 hover:underline"
                onClick={() => onReply(comment.commentId)}
              >
                Trả lời
              </button>

              {
                user?.login?.currentUser?.userID === comment?.authorId &&
                <button
                  type="button"
                  className="font-medium text-rose-500 hover:underline"
                  onClick={() => onAskDelete(comment)}
                >
                  Xoá
                </button>
              }

              {hasReplies && (
                <button
                  type="button"
                  className="font-medium text-slate-500 hover:underline"
                  onClick={() => setShowReplies((v) => !v)}
                >
                  {showReplies
                    ? "Ẩn phản hồi"
                    : `Xem ${repliesCount} phản hồi`}
                </button>
              )}
            </div>

          {/* ô trả lời */}
          {isReplying && (
            <div className="mt-2 flex gap-2">
              <div className="w-6" />
              <div className="flex-1 flex gap-2">
                <textarea
                  rows={2}
                  className="flex-1 inset px-2 py-1 text-xs resize-none"
                  placeholder="Viết phản hồi…"
                  value={replyValue}
                  onChange={(e) => onReplyChange(e.target.value)}
                  disabled={isSendingReply}
                />
                <button
                  type="button"
                  className="self-end mb-1 inline-flex items-center rounded-full bg-sky-600 border border-sky-500 px-3 py-1 text-[11px] font-semibold text-white hover:bg-sky-500 disabled:opacity-60 disabled:cursor-default"
                  onClick={() => onReply(comment.commentId, "submit")}
                  disabled={isSendingReply || !replyValue.trim()}
                >
                  {isSendingReply ? (
                    <>
                      <Spinner />
                      Đang gửi…
                    </>
                  ) : (
                    "Gửi"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* replies (chỉ hiện khi showReplies = true) */}
          {hasReplies && showReplies && (
            <div className="mt-1 ml-2">
              <div className="mt-1 space-y-2">
                {comment.replies.map((rep) => {
                  const repName =
                    rep.authorName ||
                    rep.authorUserName ||
                    (rep.authorId ? `#${rep.authorId}` : "Không rõ");
                  const repInitials = repName
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(-2)
                    .toUpperCase();

                  return (
                    <div
                      key={rep.commentId}
                      className="flex items-start gap-2"
                    >
                      <div className="relative">
                        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-semibold text-slate-700">
                          {repInitials}
                        </div>
                        <div className="absolute -left-4 top-1/2 w-4 border-t border-slate-200" />
                      </div>

                      <div className="flex-1">
                        <div className="bg-white rounded-2xl px-3 py-1.5 border border-slate-100">
                          <div className="flex items-center justify-between gap-2 text-[11px]">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-800">
                                {repName}
                              </span>
                              <span className="text-slate-400">
                                {formatDateTime(rep.createdAt)}
                              </span>
                            </div>

                            <button
                              type="button"
                              className="text-[11px] text-rose-500 hover:text-rose-600"
                              onClick={() => onAskDelete(rep)}
                            >
                              Xoá
                            </button>
                          </div>

                          <div className="mt-0.5 text-[13px] text-slate-800 whitespace-pre-wrap">
                            {rep.body}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TaskCommentsPanel({
  open,
  comments,
  loading,
  error,
  onClose,
  onRetry,
  onAddComment,
  onReplyComment,
  onDeleteComment,
  user,
  task
}) {

  const [newBody, setNewBody] = useState("");
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyBody, setReplyBody] = useState("");
  const [sendingNew, setSendingNew] = useState(false);
  const [sendingReplyForId, setSendingReplyForId] = useState(null);

  // state xoá
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [deletingComment, setDeletingComment] = useState(false);

  function handleReplyClick(commentId, mode) {
    if (mode === "submit") {
      if (!replyBody.trim() || sendingReplyForId) return;
      setSendingReplyForId(commentId);

      onReplyComment?.(commentId, replyBody.trim(), () => {
        setReplyBody("");
        setReplyingToId(null);
        setSendingReplyForId(null);
      });
    } else {
      if (replyingToId === commentId) {
        setReplyingToId(null);
        setReplyBody("");
      } else {
        setReplyingToId(commentId);
        setReplyBody("");
      }
    }
  }

  function handleSubmitNewComment() {
    if (!newBody.trim() || sendingNew) return;
    setSendingNew(true);

    onAddComment?.(newBody.trim(), () => {
      setNewBody("");
      setSendingNew(false);
    });
  }

  function handleConfirmDelete() {
    if (!commentToDelete || !onDeleteComment) return;
    setDeletingComment(true);

    onDeleteComment(commentToDelete.commentId, () => {
      setDeletingComment(false);
      setCommentToDelete(null);
    });
  }

  const hasComments = comments && comments.length > 0;

  return (
    <div
      className={`
        absolute top-0 bottom-0 right-0 z-[90]
        w-full md:w-1/2
        ${open ? "pointer-events-auto" : "pointer-events-none"}
      `}
    >
      <div
        className={`
          h-full
          bg-white/95 backdrop-blur-sm border-l border-slate-200 shadow-xl
          rounded-3xl md:rounded-l-3xl
          flex flex-col
          overflow-hidden
          transform transition-transform duration-300 ease-out
          ${open ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 bg-slate-50/80 rounded-t-3xl md:rounded-tl-3xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-sky-600 text-xs">
              💬
            </span>
            <div>
              <p className="text-xs font-semibold text-slate-800">
                Bình luận công việc
              </p>
              <p className="text-[11px] text-slate-500">
                Trao đổi nhanh với mọi người
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-xs"
          >
            ✕
          </button>
        </div>

        {/* nội dung + ô nhập mới */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-3 py-2">
            {loading && (
              <div className="py-4 text-center text-xs text-slate-500">
                Đang tải bình luận…
              </div>
            )}

            {!loading && error && (
              <div className="py-3 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 mb-2">
                {error}{" "}
                {onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="ml-1 text-sky-600 underline"
                  >
                    Thử lại
                  </button>
                )}
              </div>
            )}

            {!loading && !error && !hasComments && (
              <div className="py-4 text-center text-xs text-slate-400">
                Chưa có bình luận nào. Hãy là người đầu tiên bình luận 👋
              </div>
            )}

            {!loading &&
              comments &&
              comments.map((c) => (
                <CommentItem
                  key={c.commentId}
                  comment={c}
                  onReply={handleReplyClick}
                  replyingToId={replyingToId}
                  replyValue={replyBody}
                  onReplyChange={setReplyBody}
                  sendingReplyForId={sendingReplyForId}
                  onAskDelete={setCommentToDelete}
                  user={user}
                />
              ))}
          </div>

          {/* ô thêm bình luận mới */}
          {
            (task?.assignees?.some(a => a.userID === user?.login?.currentUser?.userID) || user?.login?.currentUser?.userID === task?.createdBy) &&
            <div className="border-t border-slate-200 bg-white px-3 py-2 rounded-b-3xl md:rounded-bl-3xl">
              <LabelSmall>Bình luận mới</LabelSmall>
              <div className="mt-1 flex items-end gap-2">
                <textarea
                  rows={2}
                  className="flex-1 inset px-2 py-1 text-xs resize-none"
                  placeholder="Viết bình luận về công việc này…"
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  disabled={sendingNew}
                />
                <button
                  type="button"
                  onClick={handleSubmitNewComment}
                  className="inline-flex items-center rounded-full bg-emerald-600 border border-emerald-500 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-default"
                  disabled={!newBody.trim() || sendingNew}
                >
                  {sendingNew ? (
                    <>
                      <Spinner />
                      Đang gửi…
                    </>
                  ) : (
                    "Gửi"
                  )}
                </button>
              </div>
            </div>
          }
        </div>
      </div>

      {/* Modal xác nhận xoá bình luận */}
      {commentToDelete && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/20 z-[95]">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 px-4 py-3 md:px-6 md:py-4 max-w-sm w-full">
            <h3 className="text-sm font-semibold text-slate-900">
              Xoá bình luận?
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Bình luận này sẽ được ẩn khỏi công việc (xoá mềm). Bạn có chắc
              chắn muốn tiếp tục?
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                disabled={deletingComment}
                onClick={() => setCommentToDelete(null)}
                className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deletingComment}
                className="inline-flex items-center rounded-full border border-rose-500 bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm disabled:opacity-60 hover:bg-rose-500"
              >
                {deletingComment ? (
                  <>
                    <Spinner />
                    Đang xoá…
                  </>
                ) : (
                  "Xoá bình luận"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
