// src/pages/Home/PasswordChangeSuccessModal.jsx
import React from "react";
import { FiCheckCircle } from "react-icons/fi";

export default function PasswordChangeSuccessModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
        <div className="px-6 pt-6 pb-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <FiCheckCircle className="text-xl" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Đổi mật khẩu thành công
              </h2>
              <p className="text-xs text-slate-500">
                Mật khẩu mới đã được lưu. Vui lòng ghi nhớ mật khẩu này để
                sử dụng cho những lần đăng nhập tiếp theo.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Tiếp tục
          </button>

          <p className="mt-3 text-[11px] text-slate-400 text-center">
            Nhấn &quot;Tiếp tục&quot; để quay lại màn hình chính.
          </p>
        </div>
      </div>
    </div>
  );
}
