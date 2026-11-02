// Layout nhân viên — module 5 "Xem bảng lương" (khung chung ModuleShell, giống module 18)
import { ReceiptText, Wallet } from "lucide-react";
import config from "~/config";
import ModuleShell from "~/components/ModuleShell";

const R = config.routes;

function DefaultLayout({ children }) {
  return (
    <ModuleShell title="Xem bảng lương" icon={Wallet} home={R.calculateSalaryViewPayslip} moduleId={5} adminTo={R.adminCalculateSalaryUploadPayrollReport}
      sections={[{ items: [{ to: R.calculateSalaryViewPayslip, label: "Phiếu lương của tôi", icon: ReceiptText }] }]}>
      {children}
    </ModuleShell>
  );
}

export default DefaultLayout;
