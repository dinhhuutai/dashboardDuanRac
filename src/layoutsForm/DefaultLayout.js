// Layout phía nhân viên — module Biểu mẫu nội bộ
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowLeft, ClipboardList } from "lucide-react";
import config from "~/config";
import { userSelector } from "~/redux/selectors";
import { ConfirmHost, Toaster } from "~/pagesForm/shared/ui";

function DefaultLayout({ children }) {
  const user = useSelector(userSelector)?.login?.currentUser;
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <Link to={config.routes.homeMain} className="-ml-2 rounded-md p-2 text-slate-600 hover:bg-slate-100" title="Về trang chủ">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Link to={config.routes.form} className="flex min-w-0 items-center gap-2 font-semibold text-slate-800">
            <ClipboardList className="h-5 w-5 shrink-0 text-blue-700" />
            <span className="truncate">Biểu mẫu nội bộ</span>
          </Link>
          {user?.fullName && <span className="ml-auto hidden truncate text-sm text-slate-500 sm:block">{user.fullName}</span>}
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-5">{children}</main>
      <Toaster />
      <ConfirmHost />
    </div>
  );
}

export default DefaultLayout;
