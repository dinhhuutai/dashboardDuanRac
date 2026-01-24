import React from "react";
import { FaCheckCircle } from "react-icons/fa";
import { pill } from "../styles/uiClasses";

export default function StatusPill({ done }) {
  return done ? (
    <span className={`${pill} text-emerald-700`}>
      <FaCheckCircle className="text-emerald-600" /> Đã xong
    </span>
  ) : (
    <span className={`${pill} text-slate-600`}>Chưa</span>
  );
}
