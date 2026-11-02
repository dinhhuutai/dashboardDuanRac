// Layout nhân viên — module 6 "Đặt cơm" (khung chung ModuleShell, giống module 18)
import { History, UsersRound, UtensilsCrossed } from "lucide-react";
import config from "~/config";
import ModuleShell from "~/components/ModuleShell";

const R = config.routes;
const ITEMS = [
  { to: R.lunchOrder, label: "Đặt cơm", icon: UtensilsCrossed, end: true },
  { to: R.lunchOrderHistory, label: "Lịch sử", icon: History, end: true },
  { to: R.lunchOrderProxy, label: "Đặt giùm", icon: UsersRound },
];

function DefaultLayout({ children }) {
  return (
    <ModuleShell title="Đặt cơm" icon={UtensilsCrossed} home={R.lunchOrder} moduleId={6} adminTo={R.adminLunchOrderDashboard}
      sections={[{ items: ITEMS }]} tabs={ITEMS}>
      {children}
    </ModuleShell>
  );
}

export default DefaultLayout;
