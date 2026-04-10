// src/pages/Home/components/CreateAccountCard.jsx
import React, { useState } from "react";
import http from "~/api/http";
import Field from "./Field";

function CreateAccountCard({ onCreated }) {
  const [form, setForm] = useState({
    username: "",
    fullName: "",
    email: "",
    phone: "",
    role: "user",
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.fullName.trim()) {
      setToast({ type: "error", text: "Vui lòng nhập Username & Họ tên." });
      return;
    }
    setSaving(true);
    try {
      const res = await http.post(`/api/users`, form);
      if (res.data?.success) {
        setToast({ type: "success", text: "Tạo tài khoản thành công." });
        setForm({
          username: "",
          fullName: "",
          email: "",
          phone: "",
          role: "user",
          isActive: true,
        });
        onCreated?.();
      } else {
        setToast({
          type: "error",
          text: res.data?.message || "Tạo tài khoản thất bại.",
        });
      }
    } catch (e) {
      const msg = e?.response?.data?.message;
      setToast({
        type: "error",
        text:
          typeof msg === "string" && msg.trim()
            ? msg
            : "Lỗi kết nối máy chủ.",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () =>
    setForm({
      username: "",
      fullName: "",
      email: "",
      phone: "",
      role: "user",
      isActive: true,
    });

  return (
    <div className="rounded-3xl bg-white/80 backdrop-blur ring-1 ring-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-800">Tạo tài khoản</h2>
      <p className="text-sm text-slate-500 mb-4">
        Điền thông tin cơ bản để tạo user mới.
      </p>

      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Username *">
          <input
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={form.username}
            onChange={(e) =>
              setForm((p) => ({ ...p, username: e.target.value }))
            }
            placeholder="vd: nguyenvana"
          />
        </Field>

        <Field label="Họ và tên *">
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
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={form.email}
            onChange={(e) =>
              setForm((p) => ({ ...p, email: e.target.value }))
            }
            placeholder="a@company.com"
          />
        </Field>

        <Field label="SĐT">
          <input
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={form.phone}
            onChange={(e) =>
              setForm((p) => ({ ...p, phone: e.target.value }))
            }
            placeholder="090..."
          />
        </Field>

        <Field label="Trạng thái">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              className="h-5 w-5 accent-indigo-600"
              checked={form.isActive}
              onChange={(e) =>
                setForm((p) => ({ ...p, isActive: e.target.checked }))
              }
            />
            <span className="text-sm text-slate-700">Kích hoạt</span>
          </label>
        </Field>

        <div className="sm:col-span-2 flex items-center justify-end gap-2 mt-2">
          <button
            type="button"
            onClick={resetForm}
            className="rounded-xl bg-white ring-1 ring-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
          >
            Xoá
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Đang tạo…" : "Tạo tài khoản"}
          </button>
        </div>
      </form>

      {toast && (
        <div
          className={`mt-4 rounded-xl px-3 py-2 text-sm ring-1 ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
              : "bg-red-50 text-red-700 ring-red-200"
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}

export default CreateAccountCard;
