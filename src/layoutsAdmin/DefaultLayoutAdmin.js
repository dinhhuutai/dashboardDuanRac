// Layout quản trị — module 1 "Quản lý cân rác" (khung chung ModuleShell, giống module 18).
// Mục menu theo quyền chi tiết (ModuleFeatures cr_*), như menu cũ.
import {
  BarChart3, ClipboardCheck, Clock3, FileBarChart, LayoutDashboard, ListChecks, ListOrdered, Plus, QrCode, Recycle, Table2, Trash2, Truck,
} from "lucide-react";
import config from "~/config";
import ModuleShell from "~/components/ModuleShell";
import { useFeatureAllowed } from "~/hooks/useFeatureGuard";
import MODULEID from "~/contants/modules";
import Notice from "./components/Notice";

const R = config.routes;
const M = MODULEID.CANRAC;

function DefaultLayoutAdmin({ children }) {
  const VIEW_ANALYTIC = useFeatureAllowed(M, "cr_xemtrangtongquan");
  const VIEW_HISTORY = useFeatureAllowed(M, "cr_xemtranglichsucan");
  const VIEW_REPORT = useFeatureAllowed(M, "cr_xembaocao");
  const VIEW_CHECKCLASS = useFeatureAllowed(M, "cr_xemlichsukiemtraphanloai");
  const MANAGE = useFeatureAllowed(M, "cr_cacchucnangomanage");
  const TRUCK = useFeatureAllowed(M, "cr_quanlymucxedungrac") && MANAGE;
  const QR = useFeatureAllowed(M, "cr_quanlymucQrCode");
  const UTIL = useFeatureAllowed(M, "cr_quanlymuctienich");

  const sections = [
    { title: "Tổng hợp", items: [
      { to: R.adminAnalytics, label: "Tổng quan", icon: LayoutDashboard, hidden: !VIEW_ANALYTIC },
      { to: R.adminHistoryWeigh, label: "Lịch sử cân", icon: Clock3, hidden: !VIEW_HISTORY },
    ] },
    { title: "Báo cáo", items: [
      { to: R.adminReportByShift, label: "Theo ca làm", icon: BarChart3, hidden: !VIEW_REPORT },
      { to: R.adminReportByTrash, label: "Theo loại rác", icon: Trash2, hidden: !VIEW_REPORT },
      { to: R.adminReportTrashAndMaterial, label: "Rác thải và vật tư", icon: FileBarChart, hidden: !VIEW_REPORT },
    ] },
    { title: "Kiểm tra phân loại", items: [
      { to: R.adminClassCheckHistory, label: "Lịch sử kiểm tra", icon: ClipboardCheck, hidden: !VIEW_CHECKCLASS },
      { to: R.adminClassCheckListBin, label: "DS thùng rác", icon: ListChecks },
    ] },
    { title: "Quản lý", items: [
      { to: R.adminTrashTruck, label: "Danh sách xe rác", icon: Truck, hidden: !TRUCK, also: [R.adminTrashTruckUpdate] },
      { to: R.adminTrashTruckCreate, label: "Thêm xe rác", icon: Plus, hidden: !TRUCK },
      { to: R.adminQrcode, label: "QR Code", icon: QrCode, hidden: !(MANAGE && QR), also: [R.adminQrcodeUpdate] },
      { to: R.adminQrcodeCreate, label: "Tạo QR Code", icon: Plus, hidden: !(MANAGE && QR) },
      { to: R.adminSortUnitByDepartment, label: "Sắp xếp chuyền theo tổ", icon: ListOrdered, hidden: !(MANAGE && UTIL) },
      { to: R.adminSettingTable, label: "Phân chia tổ", icon: Table2, hidden: !(MANAGE && UTIL) },
    ] },
  ];

  return (
    <ModuleShell title="Quản lý cân rác" icon={Recycle} home={R.adminAnalytics} moduleId={1} side="admin" userTo={R.home}
      sections={sections} extras={<Notice />}>
      <div className="min-h-[calc(100dvh-3.5rem)] bg-[#F1F4F6]">{children}</div>
    </ModuleShell>
  );
}

export default DefaultLayoutAdmin;
