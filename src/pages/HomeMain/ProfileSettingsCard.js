// src/pages/Home/components/ProfileSettingsCard.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  FiUploadCloud,
  FiCamera,
  FiRefreshCcw,
  FiCheck,
  FiLock,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import { useSelector } from "react-redux";
import { userSelector } from "~/redux/selectors";
import http from "~/api/http";
import coverPhoto from "~/assets/imgs/coverPhoto.png";
import Field from "./Field";

function ProfileSettingsCard() {
  const tmp = useSelector(userSelector);
  const me = tmp?.login?.currentUser || {};

  const [avatarPreview, setAvatarPreview] = useState(me.avatar || "");
  const [coverPreview, setCoverPreview] = useState(coverPhoto);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    fullName: me.fullName || "",
    email: me.email || "",
    phone: me.phone || "",
    avatar: me.avatar || "",
  });

  const [pwd, setPwd] = useState({
    current: "",
    next: "",
    confirm: "",
    showCurrent: false,
    showNext: false,
    showConfirm: false,
    saving: false,
  });

  useEffect(() => {
    setForm({
      fullName: me.fullName || "",
      email: me.email || "",
      phone: me.phone || "",
      avatar: me.avatar || "",
    });
    setAvatarPreview(me.avatar || "");
  }, [me.userID]);

  const initials = useMemo(() => {
    const full = form.fullName || me.username || "";
    const parts = full.trim().split(" ").filter(Boolean);
    if (!parts.length) return "";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [form.fullName, me.username]);

  const emailValid = useMemo(() => {
    if (!form.email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  }, [form.email]);

  const phoneValid = useMemo(() => {
    if (!form.phone) return true;
    return /^[0-9+\-\s()]{6,20}$/.test(form.phone);
  }, [form.phone]);

  const hasChanges = useMemo(() => {
    return (
      (form.fullName || "") !== (me.fullName || "") ||
      (form.email || "") !== (me.email || "") ||
      (form.phone || "") !== (me.phone || "") ||
      (form.avatar || "") !== (me.avatar || "")
    );
  }, [form, me]);

  const canSave = hasChanges && emailValid && phoneValid && !saving;

  const onPickAvatarFile = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };

  const onPickCoverFile = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCoverPreview(url);
  };

  const save = async () => {
    if (!me.userID) return;
    setSaving(true);
    setToast(null);
    try {
      const payload = {
        fullName: form.fullName || null,
        email: form.email || null,
        phone: form.phone || null,
        avatar: form.avatar || null,
      };
      const r = await http.put(`/api/users/${me.userID}`, payload);
      if (r.data?.success) {
        setToast({ type: "success", text: "Cập nhật tài khoản thành công." });
      } else {
        setToast({
          type: "error",
          text: r.data?.message || "Cập nhật thất bại.",
        });
      }
    } catch {
      setToast({ type: "error", text: "Lỗi kết nối máy chủ." });
    } finally {
      setSaving(false);
    }
  };

  const resetLocal = () => {
    setForm({
      fullName: me.fullName || "",
      email: me.email || "",
      phone: me.phone || "",
      avatar: me.avatar || "",
    });
    setAvatarPreview(me.avatar || "");
    setToast(null);
  };

  const scorePassword = (s = "") => {
    let score = 0;
    if (s.length >= 8) score++;
    if (/[A-Z]/.test(s)) score++;
    if (/[a-z]/.test(s)) score++;
    if (/\d/.test(s)) score++;
    if (/[^\w\s]/.test(s)) score++;
    return score;
  };

  const pwdScore = useMemo(() => scorePassword(pwd.next), [pwd.next]);

  const pwdValid = useMemo(() => {
    const strongEnough = pwd.next.length >= 8 && pwdScore >= 3;
    const match = pwd.next && pwd.next === pwd.confirm;
    const notSame = pwd.current && pwd.next && pwd.current !== pwd.next;
    return strongEnough && match && notSame;
  }, [pwd, pwdScore]);

  const changing = pwd.saving;

  const changePassword = async () => {
    if (!me.userID || !pwdValid) return;
    setPwd((p) => ({ ...p, saving: true }));
    setToast(null);
    try {
      const r = await http.put(`/api/users/${me.userID}/change-password`, {
        currentPassword: pwd.current,
        newPassword: pwd.next,
      });
      if (r.data?.success) {
        setToast({ type: "success", text: "Đổi mật khẩu thành công." });
        setPwd({
          current: "",
          next: "",
          confirm: "",
          showCurrent: false,
          showNext: false,
          showConfirm: false,
          saving: false,
        });
      } else {
        setToast({
          type: "error",
          text: r.data?.message || "Đổi mật khẩu thất bại.",
        });
        setPwd((p) => ({ ...p, saving: false }));
      }
    } catch (e) {
      setToast({
        type: "error",
        text: e?.response?.data?.message || "Lỗi kết nối máy chủ.",
      });
      setPwd((p) => ({ ...p, saving: false }));
    }
  };

  return (
    <div className="rounded-3xl overflow-hidden ring-1 ring-slate-200 bg-white/70 backdrop-blur">
      {/* Cover */}
      <div className="relative h-[180px] sm:h-[220px] md:h-[260px]">
        <img
          src={coverPreview}
          alt="cover"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,.25),rgba(2,6,23,.55))]" />
        <div className="absolute inset-0 shadow-[inset_0_-120px_160px_-100px_rgba(2,6,23,.6)]" />
        <label className="absolute right-4 bottom-4 inline-flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-xs font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-white cursor-pointer">
          <FiUploadCloud />
          Đổi ảnh bìa
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPickCoverFile(e.target.files?.[0])}
          />
        </label>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-end gap-5">
          <div className="relative -mt-16 md:-mt-20">
            <div className="relative h-28 w-28 md:h-32 md:w-32 rounded-full ring-4 ring-white overflow-hidden shadow-xl bg-slate-100 grid place-items-center text-slate-500 font-semibold">
              <span className="select-none">{initials}</span>
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="avatar"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : null}
            </div>
            <label className="absolute -right-1 bottom-2 grid place-items-center h-9 w-9 rounded-full bg-white shadow ring-1 ring-slate-200 cursor-pointer hover:bg-slate-50">
              <FiCamera className="text-slate-700" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPickAvatarFile(e.target.files?.[0])}
              />
            </label>
          </div>

          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              {form.fullName || me.fullName || "Người dùng"}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-slate-600">
              <span className="text-sm">@{me.username || "username"}</span>
              {me.role && (
                <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 text-xs font-medium">
                  Vai trò: {me.role}
                </span>
              )}
            </div>
          </div>

          <div className="flex w-full md:w-auto gap-3">
            <button
              type="button"
              onClick={resetLocal}
              disabled={!hasChanges}
              className="flex-1 md:flex-none px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:scale-[.98] transition disabled:opacity-50"
            >
              <FiRefreshCcw className="inline -mt-0.5 mr-1" /> Hoàn tác
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!canSave}
              className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg hover:from-indigo-700 hover:to-blue-700 active:scale-[.98] transition disabled:opacity-50"
            >
              <FiCheck className="inline -mt-0.5 mr-1" />{" "}
              {saving ? "Đang lưu…" : "Lưu thay đổi"}
            </button>
          </div>
        </div>

        <div className="my-6 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Họ & tên">
            <input
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={form.fullName}
              onChange={(e) =>
                setForm((p) => ({ ...p, fullName: e.target.value }))
              }
              placeholder="Nguyễn Văn A"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              className={`w-full rounded-xl border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                emailValid
                  ? "border-slate-300 focus:ring-indigo-400"
                  : "border-rose-300 focus:ring-rose-400"
              }`}
              value={form.email}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: e.target.value }))
              }
              placeholder="a@company.com"
            />
            {!emailValid && (
              <p className="text-xs text-rose-600 mt-1">Email không hợp lệ.</p>
            )}
          </Field>
          <Field label="Số điện thoại">
            <input
              className={`w-full rounded-xl border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                phoneValid
                  ? "border-slate-300 focus:ring-indigo-400"
                  : "border-rose-300 focus:ring-rose-400"
              }`}
              value={form.phone}
              onChange={(e) =>
                setForm((p) => ({ ...p, phone: e.target.value }))
              }
              placeholder="090..."
            />
            {!phoneValid && (
              <p className="text-xs text-rose-600 mt-1">
                Số điện thoại không hợp lệ.
              </p>
            )}
          </Field>
          <Field label="Avatar URL">
            <input
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={form.avatar}
              onChange={(e) => {
                setForm((p) => ({ ...p, avatar: e.target.value }));
                setAvatarPreview(e.target.value || "");
              }}
              placeholder="https://…"
            />
            <p className="text-xs text-slate-500">
              Nhập URL ảnh để lưu vào DB. Nút máy ảnh chỉ để xem trước.
            </p>
          </Field>

          <Field label="Username (readonly)">
            <input
              readOnly
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
              value={me.username || ""}
            />
          </Field>
          <Field label="Mã người dùng (readonly)">
            <input
              readOnly
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
              value={me.userID || ""}
            />
          </Field>
        </div>

        {/* Bảo mật */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white/70 p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2 text-slate-800">
            <FiLock className="text-indigo-600" />
            <h3 className="font-semibold">Bảo mật — Đổi mật khẩu</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Mật khẩu hiện tại">
              <div className="relative">
                <input
                  type={pwd.showCurrent ? "text" : "password"}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 pr-9"
                  value={pwd.current}
                  onChange={(e) =>
                    setPwd((p) => ({ ...p, current: e.target.value }))
                  }
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() =>
                    setPwd((p) => ({ ...p, showCurrent: !p.showCurrent }))
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:text-slate-600"
                  aria-label="toggle current"
                >
                  {pwd.showCurrent ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </Field>

            <Field label="Mật khẩu mới">
              <div className="relative">
                <input
                  type={pwd.showNext ? "text" : "password"}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 pr-9"
                  value={pwd.next}
                  onChange={(e) =>
                    setPwd((p) => ({ ...p, next: e.target.value }))
                  }
                  placeholder="Tối thiểu 8 ký tự"
                />
                <button
                  type="button"
                  onClick={() =>
                    setPwd((p) => ({ ...p, showNext: !p.showNext }))
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:text-slate-600"
                  aria-label="toggle new"
                >
                  {pwd.showNext ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>

              <div className="mt-2 flex items-center gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-full rounded-full ${
                      i < pwdScore ? "bg-emerald-500" : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Nên có ≥8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
              </p>
            </Field>

            <Field label="Xác nhận mật khẩu mới">
              <div className="relative">
                <input
                  type={pwd.showConfirm ? "text" : "password"}
                  className={`w-full rounded-xl border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 pr-9 ${
                    !pwd.confirm || pwd.confirm === pwd.next
                      ? "border-slate-300 focus:ring-indigo-400"
                      : "border-rose-300 focus:ring-rose-400"
                  }`}
                  value={pwd.confirm}
                  onChange={(e) =>
                    setPwd((p) => ({ ...p, confirm: e.target.value }))
                  }
                  placeholder="Nhập lại mật khẩu mới"
                />
                <button
                  type="button"
                  onClick={() =>
                    setPwd((p) => ({ ...p, showConfirm: !p.showConfirm }))
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:text-slate-600"
                  aria-label="toggle confirm"
                >
                  {pwd.showConfirm ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {pwd.confirm && pwd.confirm !== pwd.next && (
                <p className="text-xs text-rose-600 mt-1">
                  Mật khẩu xác nhận không khớp.
                </p>
              )}
            </Field>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setPwd({
                  current: "",
                  next: "",
                  confirm: "",
                  showCurrent: false,
                  showNext: false,
                  showConfirm: false,
                  saving: false,
                })
              }
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:scale-[.98] transition"
            >
              Làm mới
            </button>
            <button
              type="button"
              onClick={changePassword}
              disabled={!pwdValid || changing}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-lg hover:from-rose-700 hover:to-red-700 active:scale-[.98] transition disabled:opacity-50"
            >
              {changing ? "Đang đổi…" : "Đổi mật khẩu"}
            </button>
          </div>
        </div>

        {toast && (
          <div
            className={`mt-6 rounded-xl px-3 py-2 text-sm ring-1 ${
              toast.type === "success"
                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                : "bg-rose-50 text-rose-700 ring-rose-200"
            }`}
          >
            {toast.text}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfileSettingsCard;
