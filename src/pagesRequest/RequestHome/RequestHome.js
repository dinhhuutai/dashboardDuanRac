// Trang chính module 18: danh sách đề xuất (trái) + chi tiết (phải) — giống request.base.vn.
// Trạng thái nằm trên URL (?box=&status=&q=&id=…) → bấm Back của trình duyệt / gửi link đều đúng.
// Điện thoại: chỉ 1 khung — chọn đề xuất thì hiện chi tiết toàn màn hình.
import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { FileStack } from "lucide-react";
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
    <div className="flex h-full">
      <div className={cn("h-full w-full shrink-0 border-r border-slate-200 lg:w-[380px] xl:w-[420px]", id && "hidden lg:block")}>
        <RequestList box={box} filters={filters} setFilter={setFilter} selectedId={id} onOpen={open} />
      </div>
      <div className={cn("h-full min-w-0 flex-1 bg-slate-50", !id && "hidden lg:block")}>
        {id ? (
          <RequestDetail key={id} id={id} onBack={back} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center text-slate-400">
            <FileStack className="h-12 w-12 text-slate-300" />
            <p className="text-sm">Chọn một đề xuất bên trái để xem chi tiết</p>
          </div>
        )}
      </div>
    </div>
  );
}
