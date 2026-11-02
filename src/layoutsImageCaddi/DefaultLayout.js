// Layout module 7 "Quản lý hình ảnh drawer" (khung chung ModuleShell, giống module 18).
// Trước 2026-11 trang này mượn layout cân rác (route không có layout riêng).
import { Images } from "lucide-react";
import config from "~/config";
import ModuleShell from "~/components/ModuleShell";

const R = config.routes;

function DefaultLayout({ children }) {
  return (
    <ModuleShell title="Hình ảnh drawer" icon={Images} home={R.imageCaddi} moduleId={7}
      sections={[{ items: [{ to: R.imageCaddi, label: "Hình ảnh drawer", icon: Images }] }]}>
      {children}
    </ModuleShell>
  );
}

export default DefaultLayout;
