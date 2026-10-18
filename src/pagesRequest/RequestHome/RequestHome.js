// Trang chính module 18: DANH SÁCH đề xuất chiếm cả màn hình; bấm 1 đề xuất → CHI TIẾT mở toàn màn hình
// (danh sách vẫn giữ trong trang, chỉ bị che → quay lại đúng chỗ đang cuộn, không tải lại).
// Trạng thái nằm trên URL (?box=&status=&q=&id=…) → bấm Back của trình duyệt / gửi link đều đúng.
import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { cn } from "~/pagesForm/shared/ui";
import { useRq } from "../shared/store";
import RequestList, { BOX_TITLE } from "./RequestList";
import RequestDetail from "./RequestDetail";

const FILTER_KEYS = ["status", "typeId", "groupId", "departmentId", "q", "from", "to"];

export default function RequestHome() {
  const [params, setParams] = useSearchParams();
  const inbox = useRq((s) => s.counts.inbox);
  const box = BOX_TITLE[params.get("box")] ? params.get("box") : null;
  const id = params.get("id");

  // chưa chọn hộp → có đề xuất chờ duyệt thì mở "Cần tôi duyệt", không thì "Tất cả"
  useEffect(() => {
    if (!box) {
      const next = new URLSearchParams(params);
      next.set("box", inbox > 0 ? "inbox" : "all");
      setParams(next, { replace: true });
    }
  }, [box, inbox, params, setParams]);

  const filters = useMemo(() => Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) || ""])), [params]);

  const setFilter = useCallback((patch) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === undefined || v === "") next.delete(k);
        else next.set(k, String(v));
      }
      return next;
    }, { replace: true });
  }, [setParams]);

  const open = useCallback((rid) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("id", String(rid));
      return next;
    });
  }, [setParams]);

  const back = useCallback(() => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("id");
      return next;
    });
  }, [setParams]);

  if (!box) return null;

  return (
    <div className="relative h-full">
      {/* danh sách: bị che (không xoá) khi đang xem chi tiết → giữ vị trí cuộn + dữ liệu đã tải */}
      <div className={cn("h-full", id && "invisible pointer-events-none")} aria-hidden={id ? true : undefined}>
        <RequestList box={box} filters={filters} setFilter={setFilter} selectedId={id} onOpen={open} />
      </div>
      {id && (
        <div className="absolute inset-0 z-10 bg-slate-100">
          <RequestDetail key={id} id={id} onBack={back} />
        </div>
      )}
    </div>
  );
}
