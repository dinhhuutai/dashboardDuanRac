// Layout nhân viên — module 1 "Quản lý cân rác" (khung chung ModuleShell, giống module 18)
import { House, Recycle, UserRound } from "lucide-react";
import config from "~/config";
import ModuleShell from "~/components/ModuleShell";

const R = config.routes;
const ITEMS = [
  { to: R.home, label: "Trang chủ", icon: House, end: true },
  { to: R.user, label: "Hồ sơ", icon: UserRound },
];

function DefaultLayout({ children }) {
  return (
    <ModuleShell title="Quản lý cân rác" icon={Recycle} home={R.home} moduleId={1} adminTo={R.adminAnalytics}
      sections={[{ items: ITEMS }]} tabs={ITEMS}>
      {children}
    </ModuleShell>
  );
}

export default DefaultLayout;
