// src/layoutsBMI/components/FooterWeb/FooterWeb.jsx
import logo from "~/assets/imgs/logo_bmi.png";

export default function FooterWeb() {
  return (
    <footer className="hidden md:block mt-12">
      <div className="relative w-full">
        {/* Ribbon header = rất rõ "đến footer" */}
        <div className="absolute -top-4 left-0 right-0 flex justify-center z-10">
          <div className="px-4 py-1 rounded-full text-[11px] font-extrabold tracking-wide
                          bg-slate-100 border border-white/70
                          shadow-[6px_6px_14px_rgba(15,23,42,0.06),-6px_-6px_14px_rgba(255,255,255,0.9)]
                          text-slate-600">
            THUẬN HƯNG LONG AN
          </div>
        </div>

        {/* Body */}
        <div className="relative w-full px-6 py-7 border-t border-white/70 overflow-hidden
                        bg-gradient-to-b from-slate-100 to-slate-100/70
                        shadow-[0_-14px_30px_rgba(15,23,42,0.06)]">
          {/* glow blobs */}
          <div className="pointer-events-none absolute -left-24 -top-24 w-72 h-72 rounded-full
                          bg-emerald-200/25 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 -top-28 w-72 h-72 rounded-full
                          bg-amber-200/25 blur-3xl" />

          <div className="relative flex items-center justify-between gap-8 flex-wrap">
            {/* Left */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-11 w-11 rounded-2xl bg-slate-100 border border-white/70
                              shadow-[7px_7px_16px_rgba(15,23,42,0.06),-7px_-7px_16px_rgba(255,255,255,0.9)]
                              grid place-items-center">
                <img src={logo} alt="THLA BMI" className="h-9 w-9 object-contain" />
              </div>

              <div className="min-w-0">
                <div
                  className="font-extrabold text-[15px] leading-tight truncate"
                  style={{
                    background: "linear-gradient(90deg, #FACC15, #F97316)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  Thuận Hưng Long An • AI Sức khỏe (BMI)
                </div>

                <div className="text-[12px] text-slate-600 truncate">
                  Phát triển bởi{" "}
                  <span className="font-semibold text-slate-700">Bộ phận IT</span> –{" "}
                  <span className="font-semibold text-slate-700">Phòng Tổng Hợp</span>
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="text-right text-[12px] text-slate-600">
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <span className="rounded-full px-3 py-1 bg-slate-100 border border-white/70
                                 shadow-[6px_6px_14px_rgba(15,23,42,0.06),-6px_-6px_14px_rgba(255,255,255,0.9)]">
                  © {new Date().getFullYear()} THLA
                </span>
                <span className="rounded-full px-3 py-1 bg-slate-100 border border-white/70
                                 shadow-[6px_6px_14px_rgba(15,23,42,0.06),-6px_-6px_14px_rgba(255,255,255,0.9)]">
                  Version v1.0.0
                </span>
              </div>

              <div className="mt-2 text-slate-500">
                Liên hệ IT nội bộ khi cần hỗ trợ
              </div>
            </div>
          </div>

          {/* Divider inside */}
          <div className="relative mt-6 h-px bg-gradient-to-r from-transparent via-slate-300/60 to-transparent" />

          {/* Note */}
          <div className="relative mt-3 text-center text-[12px] text-slate-500">
            Thuận Hưng Long An — Hệ thống nội bộ • Module AI Sức khỏe (BMI)
          </div>
        </div>
      </div>
    </footer>
  );
}
