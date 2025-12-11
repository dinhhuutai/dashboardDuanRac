// src/pages/Home/FirstLoginChangePasswordModal.jsx
import React, { useState } from "react";
import { FiLock, FiX } from "react-icons/fi";
import { useDispatch } from "react-redux";
import http from "~/api/http";
import { BASE_URL } from "~/config";
import authSlice from "~/redux/slices/authSlice";

export default function FirstLoginChangePasswordModal({ isOpen, onSuccess }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const dispatch = useDispatch();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!newPassword || newPassword.length < 6) {
      setError("Mật khẩu mới phải từ 6 ký tự trở lên.");
      return;
    }
    if (newPassword !== confirm) {
      setError("Xác nhận mật khẩu không khớp.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await http.post(
        `${BASE_URL}/api/auth/change-password-first-login`,
        { newPassword }
      );
      if (res.data?.success) {
        dispatch(authSlice.actions.changePasswordFirstLogin());
        // gọi callback để HomeMain biết đã đổi thành công
        if (onSuccess) onSuccess();
      } else {
        setError(res.data?.message || "Đổi mật khẩu thất bại.");
      }
    } catch (err) {
      console.error("change-password-first-login error:", err);
      setError("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 relative">
        {/* Không cho tắt bằng nút X nếu muốn ép đổi, có thể comment nút X lại */}
        {/* <button
          type="button"
          className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
          onClick={onClose}
        >
          <FiX />
        </button> */}

        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              <FiLock />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Đổi mật khẩu lần đầu đăng nhập
              </h2>
              <p className="text-xs text-slate-500">
                Vui lòng đặt mật khẩu mới để bảo mật tài khoản.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Mật khẩu mới
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Nhập mật khẩu mới"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nhập lại mật khẩu mới
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Nhập lại mật khẩu mới"
              />
            </div>

            {error && (
              <p className="text-xs text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className={`mt-2 inline-flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold text-white
                ${submitting ? "bg-indigo-300 cursor-wait" : "bg-indigo-600 hover:bg-indigo-700"}
              `}
            >
              {submitting ? "Đang lưu..." : "Lưu mật khẩu mới"}
            </button>
          </form>

          <p className="mt-3 text-[11px] text-slate-400 text-center">
            Sau khi đổi thành công, lần đăng nhập sau bạn sẽ dùng mật khẩu mới.
          </p>
        </div>
      </div>
    </div>
  );
}
