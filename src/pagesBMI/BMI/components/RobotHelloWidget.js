import React from "react";
import SparkleBubbles from "./SparkleBubbles";
import RobotLottie from "./RobotLottie";
import LedMarquee from "./LedMarquee";

export default function RobotHelloWidget({ className = "" }) {
  const text = "Chào Tài! Tôi là AI sức khỏe của bạn tại THLA 🤖";

  return (
    <div
      className={[
        "relative overflow-visible",
        "sm:w-[400px] sm:h-[104px]",
        "h-[92px]",
        className,
      ].join(" ")}
    >
      <SparkleBubbles className="opacity-100" />

      <div className="absolute right-[-6px] top-[-10px] sm:hidden">
        <RobotLottie isMobile className="w-[112px] h-[112px]" />
      </div>

      <div className="absolute right-[-6px] top-[-10px] hidden sm:block">
        <RobotLottie isMobile={false} className="w-[124px] h-[124px]" />
      </div>

      <div className="absolute left-0 top-4 right-[96px] hidden sm:block">
        <LedMarquee text={text} />
      </div>
    </div>
  );
}
