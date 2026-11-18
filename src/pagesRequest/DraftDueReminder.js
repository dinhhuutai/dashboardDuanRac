// Nhắc "HÔM NAY ĐẾN NGÀY GỬI ĐỀ XUẤT" khi MỞ WEB — ở mọi trang NOIBO (trang chủ, module khác…), chỉ trong app
// (không Web Push). App.js gắn (tải lười) khi đã đăng nhập + có module 18 + đã đổi mật khẩu lần đầu.
// Mỗi lần mở web (1 lần / phiên trình duyệt / ngày): GET /api/rq/drafts → bản lưu tạm có ngày định gửi ≤ hôm nay
// → hộp thông báo; bấm "Gửi" mở form điền sẵn (/request/new?draft=ID), kiểm tra rồi bấm Gửi đề xuất.
// Chưa chạy sql/18 / mất mạng / không có bản nào → không hiện gì.
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BellRing, Send } from "lucide-react";
import config from "~/config";
import { Button, Modal } from "~/pagesForm/shared/ui";
import { rqApi } from "./shared/api";
import { dueInfo, localYmd } from "./shared/drafts";
import { TypeIcon } from "./shared/typeIcons";

const R = config.routes;
const KEY = "rq_due_notice"; // sessionStorage: "<userId>|<ngày>" đã nhắc trong phiên này

export default function DraftDueReminder({ userId }) {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [due, setDue] = useState(null); // { today, rows }

  useEffect(() => {
    const mark = `${userId}|${localYmd()}`;
    try { if (sessionStorage.getItem(KEY) === mark) return undefined; } catch { /* không có sessionStorage */ }
    let alive = true;
    // chờ trang đang mở tải xong trước (máy chủ yếu) rồi mới hỏi
    const t = setTimeout(async () => {
      try {
        const r = await rqApi.drafts({ silent: true });
        const rows = (r.rows || []).filter((d) => d.typeActive && d.sendDate && d.sendDate <= r.today);
        if (!alive) return;
        try { sessionStorage.setItem(KEY, mark); } catch { /* bỏ qua */ }
        if (rows.length) setDue({ today: r.today, rows });
      } catch { /* chưa chạy sql/18, không có quyền, mất mạng → bỏ qua */ }
    }, 1500);
    return () => { alive = false; clearTimeout(t); };
  }, [userId]);

  // đang ở trang Lưu tạm / đang mở 1 bản lưu tạm → không cần nhắc
  const busyHere = pathname === R.requestDrafts || (pathname === R.requestNew && /[?&]draft=/.test(search));
  if (!due || busyHere) return null;
  const close = () => setDue(null);
  const go = (to) => { close(); navigate(to); };
  const n = due.rows.length;

  return (
    <Modal open onClose={close} size="sm" title={(
      <span className="flex items-center gap-2"><BellRing className="h-5 w-5 text-amber-500" /> Hôm nay đến ngày gửi đề xuất</span>
    )}
      footer={(
        <>
          <Button variant="secondary" onClick={close}>Để sau</Button>
          <Button onClick={() => go(R.requestDrafts)}>Xem danh sách lưu tạm</Button>
        </>
      )}>
      <p className="text-sm text-slate-600">
        Bạn có <b>{n}</b> đề xuất lưu tạm đến ngày gửi. Bấm <b>Gửi</b> để mở đề xuất đã điền sẵn, kiểm tra lại rồi bấm <b>Gửi đề xuất</b>.
      </p>
      <ul className="mt-3 space-y-2" data-due-reminder>
        {due.rows.slice(0, 6).map((d) => {
          const info = dueInfo(d.sendDate, due.today);
          return (
            <li key={d.draftId} className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/50 p-2.5">
              <TypeIcon icon={d.icon} color={d.color} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">{d.title || d.typeName}</p>
                <p className="truncate text-xs text-slate-500">{d.typeName}</p>
                <p className={info.tone === "red" ? "text-xs font-medium text-red-600" : "text-xs font-medium text-amber-700"}>{info.label}</p>
              </div>
              <Button size="sm" icon={Send} className="shrink-0 whitespace-nowrap" onClick={() => go(`${R.requestNew}?draft=${d.draftId}`)}>Gửi</Button>
            </li>
          );
        })}
      </ul>
      {n > 6 && <p className="mt-2 text-xs text-slate-500">… và {n - 6} đề xuất khác — xem ở danh sách lưu tạm.</p>}
    </Modal>
  );
}
