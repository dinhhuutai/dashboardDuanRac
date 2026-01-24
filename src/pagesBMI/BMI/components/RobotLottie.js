import React from "react";
import Lottie from "lottie-react";

import robotAnimationPC from "~/assets/lottie/robot_bmi_pc.json";
import robotAnimationMobile from "~/assets/lottie/robot_bmi_mobile.json";

export default function RobotLottie({ isMobile = false, className = "w-[110px] h-[110px]" }) {
  return (
    <div className={className} style={{ pointerEvents: "none" }}>
      <Lottie
        animationData={isMobile ? robotAnimationMobile : robotAnimationPC}
        loop
        autoplay
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
