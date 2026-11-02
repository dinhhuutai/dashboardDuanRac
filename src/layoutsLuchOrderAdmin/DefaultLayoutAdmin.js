// Layout quản trị — module 6 "Đặt cơm" (khung chung ModuleShell, giống module 18).
// Mục menu theo quyền chi tiết (ModuleFeatures dc_*), như menu cũ.
import {
  BellRing, CalendarDays, Clock3, History, LayoutDashboard, Salad, Table2, UserPlus, UsersRound, UtensilsCrossed,
} from "lucide-react";
import config from "~/config";
import ModuleShell from "~/components/ModuleShell";
import { useFeatureAllowed } from "~/hooks/useFeatureGuard";
import MODULEID from "~/contants/modules";
import Notice from "./components/Notice";

const R = config.routes;
const M = MODULEID.DATCOM;

function DefaultLayoutAdmin({ children }) {
  const MANAGE_WEEKLY_MENU = useFeatureAllowed(M, "dc_taothucdon");
  const MANAGE_FOODS = useFeatureAllowed(M, "dc_quanlymonan");
  const MANAGE_DEPARTMENTS = useFeatureAllowed(M, "dc_quanlybophan");
  const ASSIGN_USER_DEPT = useFeatureAllowed(M, "dc_chucnanggannhanvientheobophan");
  const VIEW_NOT_ORDERED = useFeatureAllowed(M, "dc_xemdanhsachchuadatcom");
  const VIEW_ORDER_HISTORY = useFeatureAllowed(M, "dc_xemlichsudatcom");
  const VIEW_DEPT_BOARD = useFeatureAllowed(M, "dc_xembaocao");

  const sections = [
    { items: [{ to: R.adminLunchOrderDashboard, label: "Tổng quan", icon: LayoutDashboard }] },
    { title: "Lịch sử & theo dõi", items: [
      { to: R.adminLunchOrderHistory, label: "Lịch sử đặt cơm", icon: History, hidden: !VIEW_ORDER_HISTORY },
      { to: R.adminLunchOrderReportByDay, label: "Suất ăn theo ngày", icon: CalendarDays, hidden: !VIEW_DEPT_BOARD },
      { to: R.adminLunchOrderReport, label: "Bảng thống kê", icon: Table2, hidden: !VIEW_DEPT_BOARD },
      { to: R.adminLunchOrderNotOrder, label: "Chưa đặt tuần này", icon: BellRing, hidden: !VIEW_NOT_ORDERED },
    ] },
    { title: "Thực đơn & món ăn", items: [
      { to: R.adminLunchOrderWeeklyMenu, label: "Tạo thực đơn (tuần)", icon: CalendarDays, hidden: !MANAGE_WEEKLY_MENU },
      { to: R.adminLunchOrderFood, label: "Quản lý món ăn", icon: Salad, hidden: !MANAGE_FOODS },
    ] },
    { title: "Bộ phận & người dùng", items: [
      { to: R.adminLunchOrderDepartment, label: "Quản lý bộ phận", icon: UsersRound, hidden: !MANAGE_DEPARTMENTS },
      { to: R.adminLunchOrderAssignUserDept, label: "Gán user vào bộ phận", icon: UserPlus, hidden: !ASSIGN_USER_DEPT },
    ] },
    { title: "Cài đặt", items: [{ to: R.adminLunchOrderSettingTime, label: "Áp dụng giờ", icon: Clock3 }] },
  ];

  return (
    <ModuleShell title="Đặt cơm" icon={UtensilsCrossed} home={R.adminLunchOrderDashboard} moduleId={M} side="admin" userTo={R.lunchOrder}
      sections={sections} extras={<Notice />}>
      <div className="min-h-[calc(100dvh-3.5rem)] bg-[#F1F4F6]">{children}</div>
    </ModuleShell>
  );
}

export default DefaultLayoutAdmin;
