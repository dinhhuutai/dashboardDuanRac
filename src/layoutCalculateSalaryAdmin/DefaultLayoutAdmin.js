// Layout quản trị — module 5 "Xem bảng lương" (khung chung ModuleShell, giống module 18)
import { FileSpreadsheet, History, Tags, Wallet } from "lucide-react";
import config from "~/config";
import ModuleShell from "~/components/ModuleShell";
import Notice from "./components/Notice";

const R = config.routes;
const SECTIONS = [{ title: "Bảng lương", items: [
  { to: R.adminCalculateSalaryUploadPayrollReport, label: "Tải bảng lương", icon: FileSpreadsheet },
  { to: R.adminCalculateSalaryHistory, label: "Lịch sử tải", icon: History },
  { to: R.adminCalculateSalaryTypePay, label: "Loại phiếu lương", icon: Tags },
] }];

function DefaultLayoutAdmin({ children }) {
  return (
    <ModuleShell title="Xem bảng lương" icon={Wallet} home={R.adminCalculateSalaryUploadPayrollReport} moduleId={5} side="admin"
      userTo={R.calculateSalaryViewPayslip} sections={SECTIONS} extras={<Notice />}>
      <div className="min-h-[calc(100dvh-3.5rem)] bg-[#F1F4F6]">{children}</div>
    </ModuleShell>
  );
}

export default DefaultLayoutAdmin;
