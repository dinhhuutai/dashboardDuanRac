// UserLayout.jsx
import Header from "./components/Header";
import BottomTab from "./components/BottomTab";
import Sidebar from "./components/Sidebar";

export default function UserLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 text-slate-800">
      {/* Header cố định */}
      <div className="fixed top-0 left-0 right-0 z-40 border-b border-slate-200/60 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-screen-2xl">
          <Header />
        </div>
      </div>

      {/* Khung chính: sidebar (>= md), nội dung */}
      <div className="mx-auto max-w-screen-2xl pt-[64px] md:pt-[76px] md:flex md:gap-6">
        {/* Sidebar chỉ hiển thị trên md+ */}
        <aside className="hidden md:block md:w-[250px] shrink-0">
          <Sidebar />
        </aside>

        {/* Content */}
        <main
          className="
            w-full px-3 sm:px-4 md:px-0
            pb-[92px] md:pb-8
          "
          style={{
            paddingBottom:
              "max(92px, env(safe-area-inset-bottom))" /* tránh đè bottom tab iOS */,
          }}
        >
          <div className="mx-auto md:mx-0 md:max-w-none">
            {children}
          </div>
        </main>
      </div>

      {/* BottomTab chỉ hiển thị trên mobile */}
      <div className="md:hidden">
        <BottomTab />
      </div>
    </div>
  );
}
