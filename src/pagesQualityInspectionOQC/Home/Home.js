import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import { userSelector } from "~/redux/selectors";
import MobileHomeOQC from "./section/HomeMobile";
import { FaQrcode, FaCamera } from "react-icons/fa";
import config from "~/config";
import ScanHistoryOQC from "./components/ScanHistoryOQC";

function Home() {
  const navigate = useNavigate();
  const tmp = useSelector(userSelector);

  const handleScanQR = () => {
    navigate(config.routes.qualityInspectionOQCResult);
  };

  return (
    <div className="overflow-hidden w-full block md:flex justify-center bg-[#F4FAFF]">
      {/* MOBILE */}
      <div className="md:hidden w-full">
        <MobileHomeOQC
          navigate={navigate}
          tmp={tmp}
          handleScanQR={handleScanQR}
        />

        <div className="md:hidden px-4 pb-[100px] mt-[136px] relative z-10">
          <ScanHistoryOQC />
        </div>
      </div>

      {/* DESKTOP */}
      <div
        className="hidden md:flex w-full justify-center"
        style={{ minHeight: "calc(100dvh - 70px - 213px)" }}
      >
        <div className="w-full max-w-6xl px-6">
          <div className="mt-6 rounded-[28px] bg-[#EAF6FF] shadow-xl overflow-hidden">
            <div className="relative p-8">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-6">
                <div>
                  <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-white text-sky-800">
                    🧪 OQC – Kiểm tra chất lượng đầu ra
                  </span>

                  <h1 className="mt-4 text-3xl font-extrabold">
                    Chào mừng{" "}
                    <span className="text-sky-700">
                      {tmp?.login?.currentUser?.fullName || "bạn"}
                    </span>
                  </h1>

                  <p className="mt-2 text-slate-600">
                    Thực hiện kiểm tra chất lượng sản phẩm
                  </p>

                  <div className="mt-6 flex gap-3 flex-wrap">
                    <button
                      onClick={handleScanQR}
                      className="px-6 py-3 rounded-full bg-sky-600 hover:bg-sky-700 transition text-white flex items-center gap-2 shadow-lg"
                    >
                      <FaQrcode /> Quét QR OQC
                    </button>
                  </div>
                </div>

                <div className="hidden md:block">
                  <div className="rounded-2xl bg-white p-4 text-center border border-sky-100">
                    <FaCamera size={96} className="mx-auto text-sky-700" />
                    <div className="mt-2 text-xs text-slate-500">
                      OQC • Scan & Inspect
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <ScanHistoryOQC />
        </div>
      </div>
    </div>
  );
}

export default Home;