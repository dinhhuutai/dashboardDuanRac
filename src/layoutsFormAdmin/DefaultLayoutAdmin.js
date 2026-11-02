// Layout quản trị — module 9 "Biểu mẫu nội bộ" (khung chung ModuleShell, giống module 18)
import { useEffect } from "react";
import { Building2, ClipboardList, Plus } from "lucide-react";
import config from "~/config";
import ModuleShell from "~/components/ModuleShell";
import { preloadWhenIdle } from "~/utils/lazyPage";

const R = config.routes;

// Tải trước các trang quản trị lúc rảnh → bấm menu là mở ngay (không chờ tải JS)
const ADMIN_PAGES = [
  { preload: () => import("~/pagesFormAdmin/FormList") },
  { preload: () => import("~/pagesFormAdmin/FormResults") },
  { preload: () => import("~/pagesFormAdmin/FormBuilder") },
  { preload: () => import("~/pagesFormAdmin/OrgManagement") },
];

const SECTIONS = [{ title: "Quản trị", items: [
  { to: R.adminFormList, label: "Biểu mẫu", icon: ClipboardList, end: true, also: [R.adminFormResults] },
  { to: R.adminFormBuilder, label: "Tạo biểu mẫu", icon: Plus, end: true },
  { to: R.adminFormOrg, label: "Phòng ban & chức danh", icon: Building2 },
] }];

function DefaultLayoutAdmin({ children }) {
  useEffect(() => { preloadWhenIdle(...ADMIN_PAGES); }, []);
  return (
    <ModuleShell title="Biểu mẫu nội bộ" icon={ClipboardList} home={R.adminFormList} moduleId={9} side="admin" userTo={R.form} sections={SECTIONS}>
      <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8">{children}</div>
    </ModuleShell>
  );
}

export default DefaultLayoutAdmin;
