// Layout nhân viên — module 4 "Hòm thư góp ý" (khung chung ModuleShell, giống module 18).
// Trang góp ý là CÔNG KHAI (quét QR, không cần đăng nhập) → khách chưa đăng nhập chỉ thấy nội dung, như trước.
import { MessageSquareHeart, Send } from "lucide-react";
import config from "~/config";
import ModuleShell from "~/components/ModuleShell";

const R = config.routes;

function DefaultLayout({ children }) {
  return (
    <ModuleShell title="Hòm thư góp ý" icon={MessageSquareHeart} home={R.feedback1} moduleId={4} adminTo={R.adminSuggestionList} guestBare
      sections={[{ items: [{ to: R.feedback1, label: "Gửi góp ý", icon: Send, end: true }] }]}>
      {children}
    </ModuleShell>
  );
}

export default DefaultLayout;
