import Header from "~/layouts/components/Header";
import Footer from "~/layouts/components/Footer";
import { FaHistory, FaWpforms } from "react-icons/fa";
import { NavLink, useLocation } from "react-router-dom";
import config from "~/config";

const barCard =
  "rounded-3xl bg-white/70 backdrop-blur-xl border border-white/70 " +
  "shadow-[0_18px_40px_rgba(15,23,42,0.12)]";

function TabItem({ to, label, icon }) {
  return (
    <NavLink to={to} end>
      {({ isActive }) => (
        <div
          className={[
            "relative flex flex-col items-center justify-center transition",
            isActive ? "text-violet-700" : "text-slate-600 hover:text-slate-800",
          ].join(" ")}
        >
          <div className="text-xl">{icon}</div>
          <div className="mt-1 text-[11px] font-semibold">{label}</div>
          <span
            className={[
              "absolute -bottom-2 h-[5px] w-[5px] rounded-full transition",
              isActive ? "bg-violet-500" : "bg-transparent",
            ].join(" ")}
          />
        </div>
      )}
    </NavLink>
  );
}

function MobileFormTabBar() {
  const location = useLocation();
  const isHistoryPage =
    location.pathname === config.routes.formHistory ||
    location.pathname.startsWith(`${config.routes.formHistory}/`);
  const isFillPage =
    location.pathname.startsWith(`${config.routes.form}/`) &&
    !isHistoryPage;
  if (isFillPage) return null;

  return (
    <div className="fixed bottom-3 left-0 right-0 z-[999] md:hidden">
      <div className="px-3">
        <div className={`${barCard} relative h-[62px]`}>
          <div className="grid grid-cols-2 h-full items-center px-2">
            <div className="flex justify-center">
              <TabItem to={config.routes.form} label="Biểu mẫu" icon={<FaWpforms />} />
            </div>
            <div className="flex justify-center">
              <TabItem to={config.routes.formHistory} label="Lịch sử" icon={<FaHistory />} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DefaultLayout({ children }) {
  return (
    <div>
      <div className="hidden md:block h-[70px] fixed z-[999] top-0 left-0 right-0">
        <Header />
      </div>
      <div className="md:mt-[70px]">{children}</div>
      <div className="hidden md:block">
        <Footer />
      </div>
      <MobileFormTabBar />
    </div>
  );
}

export default DefaultLayout;
