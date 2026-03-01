// src/pages/Lunch/UserOrderSlide/UserOrderSlide.jsx
import React from "react";

// ✅ Mobile component (giống pattern ViewPayslip)
import MobileUserOrderSlide from "./sections/MobileUserOrder";

// ✅ Desktop giữ UI cũ của bạn
import DesktopUserOrderSlide from "./sections/DesktopUserOrder";
import { useNavigate } from "react-router-dom";
import config from "~/config";

/**
 * Wrapper: giống ViewPayslip
 * - Mobile: render UI mobile (md:hidden)
 * - Desktop: giữ UI cũ (hidden md:block)
 */
export default function UserOrderSlide() {
  const navigate = useNavigate();
  
  return (
    <>
      {/* ================== MOBILE ================== */}
      <MobileUserOrderSlide navigate={navigate} config={config} />

      {/* ================== DESKTOP (GIỮ UI CŨ) ================== */}
      <DesktopUserOrderSlide />
    </>
  );
}
