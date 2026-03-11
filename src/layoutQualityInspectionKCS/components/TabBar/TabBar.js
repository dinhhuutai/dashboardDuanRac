import { NavLink } from "react-router-dom";
import { FaQrcode, FaHome, FaEdit } from "react-icons/fa";
import config from "~/config";

const barShell =
  "fixed bottom-3 left-0 right-0 z-[999] md:hidden";
const barCard =
  "rounded-3xl bg-white/70 backdrop-blur-xl border border-white/70 " +
  "shadow-[0_18px_40px_rgba(15,23,42,0.12)]";

function TabItem({ to, label, icon, isCenter = false }) {
  return (
    <NavLink to={to} end>
      {({ isActive }) => (
        <div
          className={[
            "relative flex flex-col items-center justify-center transition",
            isCenter ? "translate-y-[-14px]" : "",
            isActive ? "text-emerald-700" : "text-slate-600 hover:text-slate-800",
          ].join(" ")}
        >
          {isCenter ? (
            <div
              className={[
                "h-14 w-14 rounded-full grid place-items-center",
                "bg-white border border-white/80",
                "shadow-[0_16px_34px_rgba(15,23,42,0.16)]",
                isActive ? "ring-2 ring-emerald-400" : "ring-1 ring-slate-200",
              ].join(" ")}
            >
              <div className="text-2xl">{icon}</div>
            </div>
          ) : (
            <div className="text-xl">{icon}</div>
          )}

          <div className={["mt-1 text-[11px] font-semibold", isCenter ? "mt-2" : ""].join(" ")}>
            {label}
          </div>

          {!isCenter && (
            <span
              className={[
                "absolute -bottom-2 h-[5px] w-[5px] rounded-full transition",
                isActive ? "bg-emerald-500" : "bg-transparent",
              ].join(" ")}
            />
          )}
        </div>
      )}
    </NavLink>
  );
}

function TabCenter({ to, label, icon }) {
  return (
    <NavLink to={to}>
      {({ isActive }) => (
        <div className="flex flex-col items-center">
          <div
            className={[
              "h-14 w-14 rounded-full grid place-items-center",
              "bg-white border border-white/80",
              "shadow-[0_16px_34px_rgba(15,23,42,0.16)]",
              isActive ? "ring-2 ring-emerald-400" : "ring-1 ring-slate-200",
              "transition",
            ].join(" ")}
          >
            <div className="text-2xl">{icon}</div>
          </div>

          <div className={["mt-1 text-[11px] font-semibold", isActive ? "text-emerald-700" : "text-slate-700"].join(" ")}>
            {label}
          </div>
        </div>
      )}
    </NavLink>
  );
}

export default function TabBar() {
  return (
    <>
      <div className="fixed bottom-3 left-0 right-0 z-[999] md:hidden">
        <div className="px-3">
          <div className={`${barCard} relative h-[62px]`}>
            {/* 4 tab thường */}
            <div className="grid grid-cols-3 h-full items-center px-2">
              

              <div className="flex justify-center">
                <TabItem to={config.routes.qualityInspectionKCS} label="Trang chủ" icon={<FaHome />} />
              </div>

              {/* cột giữa để trống - nút nhô lên sẽ đặt absolute */}
              <div />

              <div className="flex justify-center">
                <TabItem to={config.routes.qualityInspectionKCSManual} label="Nhập tay" icon={<FaEdit />} />
              </div>

            </div>
            

            {/* CENTER FLOATING BUTTON (nhô ra ngoài bar) */}
            <div className="absolute left-1/2 -translate-x-1/2 -top-6">
              <TabCenter to={config.routes.qualityInspectionKCSResult} label="Quét QR" icon={<FaQrcode />} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
