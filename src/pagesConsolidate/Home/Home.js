import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import { userSelector } from "~/redux/selectors";
import { useFeatureAllowed } from "~/hooks/useFeatureGuard";
import MODULEID from "~/contants/modules";

import MobileHomeKCS from "./section/HomeMobile";
import { FaQrcode, FaClipboardCheck, FaCamera } from "react-icons/fa";
import config from "~/config";

function Home() {
  const navigate = useNavigate();
  const tmp = useSelector(userSelector);

  const handleScanQR = () => {
    navigate(config.routes.consolidateTickTime);
  };

  return (
    <div className="overflow-hidden w-full block md:flex justify-center">
      {/* ===== MOBILE ===== */}
      <MobileHomeKCS
        navigate={navigate}
        tmp={tmp}
        handleScanQR={handleScanQR}
      />

      {/* ===== DESKTOP ===== */}
      <div
  className="hidden md:flex w-full justify-center"
  style={{ minHeight: "calc(100dvh - 70px - 213px)" }}
>
  <div className="w-full max-w-6xl px-6">
    <div className="mt-6 rounded-[28px] bg-[#FFF7ED] shadow-xl overflow-hidden">
      <div className="relative p-8">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-6">

          {/* LEFT */}
          <div>
            <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
              🧪 Gom hàng – Sau khi vải khô
            </span>

            <h1 className="mt-4 text-3xl font-extrabold text-amber-900">
              Chào mừng{" "}
              <span className="text-orange-600">
                {tmp?.login?.currentUser?.fullName || "bạn"}
              </span>
            </h1>

            <p className="mt-2 text-slate-600">
              Thực hiện kiểm tra chất lượng sản phẩm
            </p>

            <div className="mt-6 flex gap-3 flex-wrap">
              <button
                onClick={handleScanQR}
                className="
                  px-6 py-3
                  rounded-full
                  bg-orange-600
                  hover:bg-orange-700
                  transition
                  text-white
                  flex items-center gap-2
                  shadow-lg
                "
              >
                <FaQrcode /> Quét QR Gom Hàng
              </button>
            </div>
          </div>

          {/* RIGHT */}
          <div className="hidden md:block">
            <div className="rounded-2xl bg-white p-6 text-center border border-amber-200">
              <FaCamera size={96} className="mx-auto text-orange-600" />
              <div className="mt-3 text-sm text-amber-800 font-medium">
                Gom hàng • Scan & Inspect
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</div>
    </div>
  );
}

export default Home;