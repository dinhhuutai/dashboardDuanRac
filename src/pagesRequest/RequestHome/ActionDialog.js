// Hộp thoại Duyệt / Từ chối / Trả lại / Huỷ (ghi chú bắt buộc khi từ chối, trả lại)
import { useEffect, useState } from "react";
import { Button, Modal, cn, inputCls } from "~/pagesForm/shared/ui";

export const ACTIONS = {
  approve: { title: "Duyệt đề xuất", button: "Duyệt", variant: "primary", placeholder: "Ý kiến (không bắt buộc)", required: false, cls: "!bg-emerald-600 hover:!bg-emerald-700" },
  reject: { title: "Từ chối đề xuất", button: "Từ chối", variant: "danger", placeholder: "Lý do từ chối (bắt buộc)", required: true },
  return: { title: "Trả lại để bổ sung", button: "Trả lại", variant: "primary", placeholder: "Cần bổ sung / sửa gì? (bắt buộc)", required: true, cls: "!bg-violet-600 hover:!bg-violet-700" },
  cancel: { title: "Huỷ đề xuất", button: "Huỷ đề xuất", variant: "danger", placeholder: "Lý do huỷ (không bắt buộc)", required: false },
};

export default function ActionDialog({ action, count = 1, onClose, onConfirm }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const a = ACTIONS[action];
  useEffect(() => { setNote(""); setErr(""); setBusy(false); }, [action]);
  if (!a) return null;

  const submit = async () => {
    if (a.required && !note.trim()) { setErr("Vui lòng nhập nội dung"); return; }
    setBusy(true);
    try {
      await onConfirm(note.trim());
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={busy ? () => {} : onClose} title={count > 1 ? `${a.title} (${count} đề xuất)` : a.title} size="sm"
      footer={
        <>
          <Button variant="secondary" disabled={busy} onClick={onClose}>Đóng</Button>
          <Button variant={a.variant} className={a.cls} loading={busy} onClick={submit}>{a.button}{count > 1 ? ` ${count}` : ""}</Button>
        </>
      }>
      <textarea autoFocus value={note} maxLength={1000} placeholder={a.placeholder}
        onChange={(e) => { setNote(e.target.value); setErr(""); }}
        onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submit(); }}
        className={cn(inputCls, "min-h-[110px] resize-y", err && "border-red-400")} />
      {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
      <p className="mt-2 text-xs text-slate-400">Ctrl + Enter để gửi nhanh</p>
    </Modal>
  );
}
