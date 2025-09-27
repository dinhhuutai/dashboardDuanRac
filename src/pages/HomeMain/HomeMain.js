import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  FiCheck, FiUploadCloud, FiEye, FiEyeOff, FiLock, FiCamera, FiRefreshCcw, FiHome, FiUsers, FiSettings, FiGrid, FiChevronDown, FiLogOut, FiSearch, FiX,
} from "react-icons/fi";
import * as FiIcons from "react-icons/fi";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import avatar from "~/assets/imgs/favorite-5.jpg";
import logo from "~/assets/imgs/logoAdmin.png";
import config, { BASE_URL } from "~/config";
import { userSelector } from "~/redux/selectors";
import authSlice from "~/redux/slices/authSlice";
import coverPhoto from "~/assets/imgs/coverPhoto.png";

import Module from "../Module";
import UserModuleAccess from "../UserModuleAccess";
import http from '~/api/http';
import MODULEID from "~/contants/modules";

/* ---------- Helpers ---------- */
const Field = ({ label, hint, children }) => (
  <div className="space-y-1">
    {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
    {children}
    {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
  </div>
);

// icon có thể là "FiSomething" hoặc URL
const IconOrImg = ({ icon, className = "h-6 w-6" }) => {
  if (!icon) return <FiIcons.FiGrid className={className + " text-slate-800"} />;
  if (/^Fi[A-Za-z0-9]+$/.test(icon) && typeof FiIcons[icon] === "function") {
    const Cmp = FiIcons[icon];
    return <Cmp className={className + " text-slate-800"} />;
  }
  return <img src={icon} alt="" className={className + " object-contain"} />;
};

function ConfirmDialog({
  open,
  title = "Xác nhận",
  description,
  confirmText = "Xác nhận",
  cancelText = "Huỷ",
  onConfirm,
  onClose,
  loading = false,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={loading ? undefined : onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <div className="text-base font-semibold text-slate-900">{title}</div>
        </div>
        <div className="px-5 py-4 text-sm text-slate-700">
          {description || "Bạn có chắc muốn thực hiện thao tác này?"}
        </div>
        <div className="px-5 py-4 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-xl bg-white ring-1 ring-slate-200 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Đang xử lý…" : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}


const slugify = (s = "") =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

/* ---------- Module Card (hiện đại) ---------- */
const ModuleCard = ({ module, onGoUser, onGoAdmin }) => {
  const { name, description, icon, allowedRoles = [] } = module || {};
  const canUser = allowedRoles.includes("user");
  const canAdmin = allowedRoles.includes("admin");

  return (
    <div
  className="
    group relative rounded-2xl bg-[#f5faf8] p-4 sm:p-5
    shadow-[4px_4px_12px_rgba(185,210,200,0.35),-4px_-4px_12px_rgba(255,255,255,0.9)]
    transition-all duration-300 hover:shadow-[2px_2px_6px_rgba(185,210,200,0.35),-2px_-2px_6px_rgba(255,255,255,0.9)]
    hover:-translate-y-1
  "
>

      <div className="flex items-start gap-3">
        <div
          className="
            flex h-12 w-12 shrink-0 items-center justify-center rounded-xl
            bg-[#fafbfc]
            shadow-[3px_3px_6px_rgba(180,190,200,0.4),-3px_-3px_6px_rgba(255,255,255,0.8)]
          "
        >
          <IconOrImg icon={icon} className="h-6 w-6 text-gray-600" />
        </div>

        <div className="min-w-0 flex-1">
          {/* Tiêu đề với tooltip */}
          <div className="relative group/title">
            <h3
              className="truncate text-lg font-semibold text-gray-700 cursor-pointer"
            >
              {name}
            </h3>
            {/* Tooltip khi hover */}
            <div
              className="absolute left-0 top-full z-10 mt-1 hidden w-max max-w-xs rounded-md bg-gray-800 px-3 py-1 text-sm text-white shadow-lg group-hover/title:block"
            >
              {name}
            </div>
          </div>

          
          {/* Mô tả với tooltip */}
          <div className="relative group/desc mt-1">
            <p className="text-sm text-gray-500 whitespace-normal break-words">
  {description || "—"}
</p>
          </div>

          {/* Nút quyền */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {canUser && (
              <button
                type="button"
                onClick={onGoUser}
                className="
                  inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-gray-600
                  bg-[#fafbfc]
                  shadow-[3px_3px_6px_rgba(180,190,200,0.4),-3px_-3px_6px_rgba(255,255,255,0.8)]
                  transition hover:shadow-[2px_2px_4px_rgba(180,190,200,0.4),-2px_-2px_4px_rgba(255,255,255,0.8)]
                "
              >
                <FiIcons.FiUser className="h-4 w-4" />
                <span>User</span>
              </button>
            )}

            {canAdmin && (
              <button
                type="button"
                onClick={onGoAdmin}
                className="
                  inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-gray-600
                  bg-[#fafbfc]
                  shadow-[3px_3px_6px_rgba(180,190,200,0.4),-3px_-3px_6px_rgba(255,255,255,0.8)]
                  transition hover:shadow-[2px_2px_4px_rgba(180,190,200,0.4),-2px_-2px_4px_rgba(255,255,255,0.8)]
                "
              >
                <FiIcons.FiShield className="h-4 w-4" />
                <span>Admin</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

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
        setForm({ username: "", fullName: "", email: "", phone: "", role: "user", isActive: true });
        onCreated?.();
      } else {
        setToast({ type: "error", text: res.data?.message || "Tạo tài khoản thất bại." });
      }
    } catch {
      setToast({ type: "error", text: "Lỗi kết nối máy chủ." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-3xl bg-white/80 backdrop-blur ring-1 ring-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-800">Tạo tài khoản</h2>
      <p className="text-sm text-slate-500 mb-4">Điền thông tin cơ bản để tạo user mới.</p>

      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Username *">
          <input className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={form.username}
            onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
            placeholder="vd: nguyenvana" />
        </Field>

        <Field label="Họ và tên *">
          <input className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={form.fullName}
            onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
            placeholder="Nguyễn Văn A" />
        </Field>

        <Field label="Email">
          <input type="email" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            placeholder="a@company.com" />
        </Field>

        <Field label="SĐT">
          <input className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            placeholder="090..." />
        </Field>

        <Field label="Trạng thái">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" className="h-5 w-5 accent-indigo-600"
              checked={form.isActive}
              onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} />
            <span className="text-sm text-slate-700">Kích hoạt</span>
          </label>
        </Field>

        <div className="sm:col-span-2 flex items-center justify-end gap-2 mt-2">
          <button type="button"
            onClick={() => setForm({ username: "", fullName: "", email: "", phone: "", role: "user", isActive: true })}
            className="rounded-xl bg-white ring-1 ring-slate-200 px-4 py-2 text-sm hover:bg-slate-50">Xoá</button>
          <button type="submit" disabled={saving}
            className="rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm hover:bg-indigo-700 disabled:opacity-50">
            {saving ? "Đang tạo…" : "Tạo tài khoản"}
          </button>
        </div>
      </form>

      {toast && (
        <div className={`mt-4 rounded-xl px-3 py-2 text-sm ring-1 ${toast.type === "success"
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
          : "bg-red-50 text-red-700 ring-red-200"}`}>
          {toast.text}
        </div>
      )}
    </div>
  );
}

function UsersAdminPanel() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [size] = useState(12);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [toast, setToast] = useState(null);
  const [editing, setEditing] = useState(null);
  const [savingToggle, setSavingToggle] = useState(null);
  const totalPages = Math.max(1, Math.ceil(total / size));

  const [confirm, setConfirm] = useState({
    open: false,
    title: "",
    desc: "",
    loading: false,
    onYes: null,
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // lấy users + modules cùng lúc (includeModules=1)
      const r = await http.get(`/api/users`, { params: { q, page, pageSize: size, includeModules: 1 } });
      const list = r.data?.data || [];
      setRows(list);
      setTotal(r.data?.pagination?.total || list.length);
    } catch {
      setRows([]); setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); /* eslint-disable-next-line */ }, [q, page]);

  const toggleActive = async (u) => {
    setSavingToggle(u.userID);
    try {
      await http.put(`/api/users/${u.userID}/active`, { isActive: !u.isActive });
      setRows(xs => xs.map(x => x.userID === u.userID ? { ...x, isActive: !x.isActive } : x));
      setToast({ type: "success", text: "Cập nhật trạng thái thành công." });
    } catch {
      setToast({ type: "error", text: "Không cập nhật được trạng thái." });
    } finally {
      setSavingToggle(null);
    }
  };

  const resetPassword = (u) => {
    setConfirm({
      open: true,
      title: "Reset mật khẩu",
      desc: `Bạn có chắc muốn reset mật khẩu của @${u.username} về "1"?`,
      loading: false,
      onYes: async () => {
        setConfirm((c) => ({ ...c, loading: true }));
        try {
          await http.post(`/api/users/${u.userID}/reset-password`, { newPassword: "1" });
          setToast({ type: "success", text: "Đã reset mật khẩu về 1." });
        } catch {
          setToast({ type: "error", text: "Reset mật khẩu thất bại." });
        } finally {
          setConfirm({ open: false, title: "", desc: "", loading: false, onYes: null });
        }
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-white/80 backdrop-blur ring-1 ring-slate-200 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Người dùng</h2>
            <p className="text-sm text-slate-500">Danh sách tài khoản & phân quyền theo module.</p>
          </div>
          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => { setPage(1); setQ(e.target.value); }}
              placeholder="Tìm theo tên/username/email…"
              className="w-[min(80vw,280px)] rounded-xl bg-white pl-9 pr-9 py-2 text-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            {q && (
              <button onClick={() => setQ("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-slate-100 text-slate-500">
                <FiX />
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          {loading ? (
            <div className="grid place-items-center h-40 text-slate-500">Đang tải…</div>
          ) : rows.length === 0 ? (
            <div className="grid place-items-center h-40 text-slate-500">Không có người dùng.</div>
          ) : (
            <table className="min-w-[1000px] w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-[12px] uppercase tracking-wide text-slate-600">
                  <th className="px-3 py-2 text-left">User</th>
                  <th className="px-3 py-2 text-left">Thông tin</th>
                  <th className="px-3 py-2 text-left">Vai trò</th>
                  <th className="px-3 py-2 text-left">Trạng thái</th>
                  <th className="px-3 py-2 text-left">Modules</th>
                  <th className="px-3 py-2 text-left">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u, idx) => (
                  <tr key={u.userID} className={idx % 2 ? "bg-white" : "bg-slate-50/60"}>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center font-semibold">
                          {(u.fullName || u.username || "?").substring(0,2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800">{u.fullName || "—"}</div>
                          <div className="text-xs text-slate-500">@{u.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-xs text-slate-600">
                        {u.email ? <div>Email: {u.email}</div> : null}
                        {u.phone ? <div>Phone: {u.phone}</div> : null}
                        <div>Last login: {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "—"}</div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs ring-1 ${
                        (u.role || "user") === "admin"
                          ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
                          : "bg-slate-50 text-slate-700 ring-slate-200"
                      }`}>{u.role || "user"}</span>
                    </td>
                    <td className="px-3 py-2">
                      <label className="inline-flex items-center gap-2">
                        <input type="checkbox" className="h-5 w-5 accent-indigo-600"
                          checked={!!u.isActive}
                          disabled={savingToggle === u.userID}
                          onChange={() => toggleActive(u)} />
                        <span className="text-xs">{u.isActive ? "Active" : "Inactive"}</span>
                      </label>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1.5 max-w-[420px]">
                        {(u.modules || []).length === 0 ? (
                          <span className="text-xs text-slate-500">—</span>
                        ) : u.modules.map(m => (
                          <span key={m.moduleId}
                            className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs ring-1 ring-slate-200 shadow-sm">
                            {m.name}
                            {m.role === "admin" && <span className="ml-1 text-[10px] px-1 rounded bg-indigo-100 text-indigo-700">admin</span>}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <button className="rounded-xl bg-white ring-1 ring-slate-200 px-3 py-1.5 hover:bg-slate-50"
                          onClick={() => setEditing(u)}>Sửa</button>
                        <button className="rounded-xl bg-white ring-1 ring-slate-200 px-3 py-1.5 hover:bg-slate-50"
                          onClick={() => resetPassword(u)}>Reset PW = 1</button>

                        <button
                          onClick={() =>
                            setConfirm({
                              open: true,
                              title: u.isActive ? "Vô hiệu hoá tài khoản" : "Kích hoạt tài khoản",
                              desc: `Bạn chắc chắn muốn ${u.isActive ? "vô hiệu hoá" : "kích hoạt"} @${u.username}?`,
                              loading: false,
                              onYes: async () => {
                                setConfirm((c) => ({ ...c, loading: true }));
                                await toggleActive(u);
                                setConfirm({ open: false, title: "", desc: "", loading: false, onYes: null });
                              },
                            })
                          }
                          className="rounded-xl bg-white ring-1 ring-slate-200 px-3 py-1.5 hover:bg-slate-50"
                        >
                          {u.isActive ? "Vô hiệu hoá" : "Kích hoạt"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
          <span>Trang {page}/{totalPages} • {total} người</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p-1))}
              disabled={page<=1}
              className="rounded-xl bg-white ring-1 ring-slate-200 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-50">Trước</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))}
              disabled={page>=totalPages}
              className="rounded-xl bg-white ring-1 ring-slate-200 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-50">Sau</button>
          </div>
        </div>

        {toast && (
          <div className={`mt-4 rounded-xl px-3 py-2 text-sm ring-1 ${toast.type === "success"
            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
            : "bg-red-50 text-red-700 ring-red-200"}`}>
            {toast.text}
          </div>
        )}
      </div>

      {editing && (
        <EditUserModal
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={(u2) => {
            setRows(xs => xs.map(x => x.userID === u2.userID ? { ...x, ...u2 } : x));
            setEditing(null);
            setToast({ type: "success", text: "Đã lưu thông tin người dùng." });
          }}
        />
      )}

      {/* Modal xác nhận */}
<ConfirmDialog
  open={confirm.open}
  title={confirm.title}
  description={confirm.desc}
  confirmText="Reset"
  cancelText="Huỷ"
  loading={confirm.loading}
  onClose={() => !confirm.loading && setConfirm({ open: false, title: "", desc: "", loading: false, onYes: null })}
  onConfirm={() => confirm.onYes?.()}
/>

    </div>
  );
}

function EditUserModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({
    fullName: user.fullName || "",
    email: user.email || "",
    phone: user.phone || "",
    role: user.role || "user",
    isActive: !!user.isActive,
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const r = await http.put(`/api/users/${user.userID}`, form);
      if (r.data?.success) {
        onSaved({ ...user, ...form });
      } else {
        setMsg({ type: "error", text: r.data?.message || "Lưu thất bại." });
      }
    } catch {
      setMsg({ type: "error", text: "Lỗi kết nối máy chủ." });
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Sửa thông tin</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100"><FiX /></button>
        </div>
        <div className="p-5 grid gap-4">
          <Field label="Họ tên">
            <input className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={form.fullName}
              onChange={(e) => setForm(p => ({ ...p, fullName: e.target.value }))} />
          </Field>
          <Field label="Email">
            <input type="email" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={form.email}
              onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} />
          </Field>
          <Field label="SĐT">
            <input className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={form.phone}
              onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Vai trò">
              <select className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={form.role}
                onChange={(e) => setForm(p => ({ ...p, role: e.target.value }))}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
            <Field label="Trạng thái">
              <label className="inline-flex items-center gap-2 mt-2.5">
                <input type="checkbox" className="h-5 w-5 accent-indigo-600"
                  checked={form.isActive}
                  onChange={(e) => setForm(p => ({ ...p, isActive: e.target.checked }))} />
                <span className="text-sm">Kích hoạt</span>
              </label>
            </Field>
          </div>
        </div>

        {msg && (
          <div className={`mx-5 mb-3 rounded-xl px-3 py-2 text-sm ring-1 ${
            msg.type === "success"
              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
              : "bg-red-50 text-red-700 ring-red-200"
          }`}>
            {msg.text}
          </div>
        )}

        <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded-xl bg-white ring-1 ring-slate-200 px-4 py-2 text-sm hover:bg-slate-50">Huỷ</button>
          <button onClick={save} disabled={saving} className="rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm hover:bg-indigo-700 disabled:opacity-50">
            {saving ? "Đang lưu…" : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileSettingsCard() {
  const dispatch = useDispatch();
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

  // ======= Password state =======
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
        setToast({ type: "error", text: r.data?.message || "Cập nhật thất bại." });
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

  // ======= Password helpers & validation =======
  const scorePassword = (s = "") => {
    let score = 0;
    if (s.length >= 8) score++;
    if (/[A-Z]/.test(s)) score++;
    if (/[a-z]/.test(s)) score++;
    if (/\d/.test(s)) score++;
    if (/[^\w\s]/.test(s)) score++;
    return score; // 0..5
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
        setToast({ type: "error", text: r.data?.message || "Đổi mật khẩu thất bại." });
        setPwd((p) => ({ ...p, saving: false }));
      }
    } catch (e) {
      setToast({ type: "error", text: e?.response?.data?.message || "Lỗi kết nối máy chủ." });
      setPwd((p) => ({ ...p, saving: false }));
    }
  };

  return (
    <div className="rounded-3xl overflow-hidden ring-1 ring-slate-200 bg-white/70 backdrop-blur">
      {/* Cover */}
      <div className="relative h-[180px] sm:h-[220px] md:h-[260px]">
        <img src={coverPreview} alt="cover" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,.25),rgba(2,6,23,.55))]" />
        <div className="absolute inset-0 shadow-[inset_0_-120px_160px_-100px_rgba(2,6,23,.6)]" />
        <label className="absolute right-4 bottom-4 inline-flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-xs font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-white cursor-pointer">
          <FiUploadCloud />
          Đổi ảnh bìa
          <input type="file" accept="image/*" className="hidden" onChange={(e) => onPickCoverFile(e.target.files?.[0])} />
        </label>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-6 md:p-8">
        {/* Header row */}
        <div className="flex flex-col md:flex-row md:items-end gap-5">
          {/* Avatar */}
          <div className="relative -mt-16 md:-mt-20">
            <div className="relative h-28 w-28 md:h-32 md:w-32 rounded-full ring-4 ring-white overflow-hidden shadow-xl bg-slate-100 grid place-items-center text-slate-500 font-semibold">
              <span className="select-none">{initials}</span>
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar" className="absolute inset-0 h-full w-full object-cover" />
              ) : null}
            </div>
            <label className="absolute -right-1 bottom-2 grid place-items-center h-9 w-9 rounded-full bg-white shadow ring-1 ring-slate-200 cursor-pointer hover:bg-slate-50">
              <FiCamera className="text-slate-700" />
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onPickAvatarFile(e.target.files?.[0])} />
            </label>
          </div>

          {/* Name & username */}
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

          {/* Actions */}
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
              <FiCheck className="inline -mt-0.5 mr-1" /> {saving ? "Đang lưu…" : "Lưu thay đổi"}
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="my-6 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

        {/* Form grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Họ & tên">
            <input
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={form.fullName}
              onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
              placeholder="Nguyễn Văn A"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              className={`w-full rounded-xl border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                emailValid ? "border-slate-300 focus:ring-indigo-400" : "border-rose-300 focus:ring-rose-400"
              }`}
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="a@company.com"
            />
            {!emailValid && <p className="text-xs text-rose-600 mt-1">Email không hợp lệ.</p>}
          </Field>
          <Field label="Số điện thoại">
            <input
              className={`w-full rounded-xl border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                phoneValid ? "border-slate-300 focus:ring-indigo-400" : "border-rose-300 focus:ring-rose-400"
              }`}
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="090..."
            />
            {!phoneValid && <p className="text-xs text-rose-600 mt-1">Số điện thoại không hợp lệ.</p>}
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
            <p className="text-xs text-slate-500">Nhập URL ảnh để lưu vào DB. Nút máy ảnh chỉ để xem trước.</p>
          </Field>

          {/* Readonly */}
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

        {/* ======= Security / Password ======= */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white/70 p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2 text-slate-800">
            <FiLock className="text-indigo-600" />
            <h3 className="font-semibold">Bảo mật — Đổi mật khẩu</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* current */}
            <Field label="Mật khẩu hiện tại">
              <div className="relative">
                <input
                  type={pwd.showCurrent ? "text" : "password"}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 pr-9"
                  value={pwd.current}
                  onChange={(e) => setPwd((p) => ({ ...p, current: e.target.value }))}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setPwd((p) => ({ ...p, showCurrent: !p.showCurrent }))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:text-slate-600"
                  aria-label="toggle current"
                >
                  {pwd.showCurrent ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </Field>

            {/* new */}
            <Field label="Mật khẩu mới">
              <div className="relative">
                <input
                  type={pwd.showNext ? "text" : "password"}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 pr-9"
                  value={pwd.next}
                  onChange={(e) => setPwd((p) => ({ ...p, next: e.target.value }))}
                  placeholder="Tối thiểu 8 ký tự"
                />
                <button
                  type="button"
                  onClick={() => setPwd((p) => ({ ...p, showNext: !p.showNext }))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:text-slate-600"
                  aria-label="toggle new"
                >
                  {pwd.showNext ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>

              {/* strength meter */}
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

            {/* confirm */}
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
                  onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))}
                  placeholder="Nhập lại mật khẩu mới"
                />
                <button
                  type="button"
                  onClick={() => setPwd((p) => ({ ...p, showConfirm: !p.showConfirm }))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:text-slate-600"
                  aria-label="toggle confirm"
                >
                  {pwd.showConfirm ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {pwd.confirm && pwd.confirm !== pwd.next && (
                <p className="text-xs text-rose-600 mt-1">Mật khẩu xác nhận không khớp.</p>
              )}
            </Field>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPwd({ current: "", next: "", confirm: "", showCurrent: false, showNext: false, showConfirm: false, saving: false })}
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

        {/* Toast */}
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



/* ---------- Trang chính ---------- */
function HomeMain() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Lấy user
  const tmp = useSelector(userSelector);
  const user = tmp?.login?.currentUser || { fullName: "Người dùng" };

  // View hiện tại
  const [view, setView] = useState("home");

  // Modules state
  const [modules, setModules] = useState([]);
  const [loadingModules, setLoadingModules] = useState(false);

  // Search
  const [query, setQuery] = useState("");
  const searchRef = useRef(null);
  const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const visibleModules = modules.filter(
    (m) => !query || norm(m.name).includes(norm(query)) || norm(m.description).includes(norm(query))
  );

  // Fetch modules theo user
  useEffect(() => {
    const fetchModules = async () => {
      try {
        setLoadingModules(true);
        const uid = user?.userID;
        const role = user?.role; // 'admin' | 'user'

        // Ưu tiên: API phân quyền theo user
        try {
          if (uid) {
            const r = await http.get(`${BASE_URL}/api/users/${uid}/modules-roles`, {
              params: { page: 1, pageSize: 200, q: query }
            });
            const list = Array.isArray(r.data?.data)
              ? r.data.data
              : Array.isArray(r.data)
              ? r.data
              : [];
            if (list.length || query) {
              setModules(list);

              return;
            }
          }
        } catch {
          /* fallback dưới */
        }

        // Fallback: lấy all, gán allowedRoles theo role hiện tại
        const res = await http.get(`${BASE_URL}/api/modules`, {
          params: { page: 1, pageSize: 200, q: query },
        });
        const all = res.data?.data || res.data || [];
        const allowed = role === "admin" ? ["user", "admin"] : ["user"];
        setModules(all.map((m) => ({ ...m, allowedRoles: allowed })));
      } catch {
        setModules([]);
      } finally {
        setLoadingModules(false);
      }
    };
    fetchModules();
  }, [user?.userID, user?.role, query]);

  // Ctrl/⌘+K focus search
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Close dropdown outside / ESC
  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onEsc = (e) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const handleLogout = async () => {
    try {
        await http.post('/auth/logout'); // thu hồi refresh ở server + clear cookie
    } catch {}

    dispatch(authSlice.actions.logoutSuccess());
    navigate(config.routes.login);
    
  };

  // Sidebar item helper
  const NavIcon = ({ active, title, children, onClick }) => (
    <button
      onClick={onClick}
      className={[
        "flex items-center justify-center w-10 h-10 rounded-xl ring-1 ring-inset",
        active
          ? "text-indigo-700 bg-indigo-50 ring-indigo-200"
          : "text-slate-600 bg-white ring-slate-200 hover:bg-slate-50",
      ].join(" ")}
      title={title}
    >
      {children}
    </button>
  );

  const goToModule = (m, role) => {
    
    let rou = '/';
    if (m.moduleId === MODULEID.CANRAC && role === 'user') {
      rou = config.routes.home
    } else if (m.moduleId === MODULEID.CANRAC && role === 'admin') {
      rou = config.routes.adminAnalytics
    } else if (m.moduleId === MODULEID.CANMUC && role === 'admin') {
        rou = config.routes.adminInkWeighHistory
    } else if (m.moduleId === MODULEID.HOMTHU && role === 'user') {
        rou = config.routes.feedback1
    } else if (m.moduleId === MODULEID.HOMTHU && role === 'admin') {
        rou = config.routes.adminSuggestionList
    } else if (m.moduleId === MODULEID.DATCOM && role === 'user') {
        rou = config.routes.lunchOrder
    } else if (m.moduleId === MODULEID.DATCOM && role === 'admin') {
        rou = config.routes.adminLunchOrderDashboard
    } else if (m.moduleId === MODULEID.HINHDRAWER && role === 'user') {
        rou = config.routes.imageCaddi
    } else if (m.moduleId === MODULEID.SANXUAT && role === 'admin') {
        rou = config.routes.adminProductionDashboard
    }

    navigate(rou);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-50">
      <div className="mx-auto max-w-[1200px] p-4 sm:p-6">
        <div className="rounded-3xl bg-white/70 backdrop-blur shadow-sm ring-1 ring-slate-200 overflow-hidden">
          {/* Topbar */}
          <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white/70 px-4 sm:px-6 h-16">
            <div className="flex items-center gap-3">
              <img src={logo} alt="logo" className="h-8 w-auto" />
              <span className="hidden sm:block text-sm sm:text-base font-semibold text-slate-800 capitalize">
                {view === "home" ? "Home"
                : view === "create" ? "Tạo tài khoản"
                : view === "settings" ? "Cài đặt"
                : view === "modules" ? "Quản lý Modules"
                : view === "access" ? "Phân quyền"
                : view === "users" ? "Người dùng"
                : ""}
              </span>
            </div>

            {/* Search chỉ hiện ở Home */}
            <div
              className={`flex items-center flex-1 mx-2 md:mx-4 ${
                view === "home" ? "max-w-full md:max-w-xl" : "max-w-0 md:max-w-0"
              } transition-all`}
            >
              {view === "home" && (
                <div className="relative w-full">
                  <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Escape" && setQuery("")}
                    placeholder="Tìm nhanh module…"
                    className="w-full rounded-xl bg-white/70 pl-9 pr-9 py-2 text-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                      aria-label="Xoá tìm kiếm"
                    >
                      <FiX />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Avatar + dropdown */}
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="flex items-center gap-2 rounded-full bg-white px-2.5 py-1.5 ring-1 ring-slate-200 hover:ring-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <img src={avatar} alt="avatar" className="h-8 w-8 rounded-full object-cover" />
                <span className="hidden sm:block text-sm font-medium text-slate-700">
                  {user?.fullName || user?.username || "Người dùng"}
                </span>
                <FiChevronDown
                  className={`hidden sm:block text-slate-400 transition-transform ${
                    menuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  tabIndex={-1}
                  className="absolute right-0 mt-2 w-56 rounded-2xl bg-white/95 backdrop-blur shadow-lg ring-1 ring-slate-200 p-1 z-50"
                >
                  {
                    (user.username === 'dinhhuutai' || user.username === 'thaonguyen') &&
                    <button
                      onClick={() => {
                        setView("create");
                        setMenuOpen(false);
                      }}
                      className="w-full text-left rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <FiUsers /> Tạo tài khoản
                    </button>
                  }
                  <button
                    onClick={() => {
                      setView("settings");
                      setMenuOpen(false);
                    }}
                    className="w-full text-left rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <FiSettings /> Cài đặt tài khoản
                  </button>
                  <hr className="my-1 border-slate-200" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <FiLogOut /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* Layout */}
          <div className="grid grid-cols-[72px_1fr]">
            {/* Sidebar */}
            <aside className="border-r border-slate-200 bg-white/60">
              <nav className="p-2 flex flex-col items-center gap-2">
                <NavIcon active={view === "home"} title="Home" onClick={() => setView("home")}>
                  <FiHome />
                </NavIcon>

                {
                  (user.username === 'dinhhuutai' || user.username === 'thaonguyen') &&
                  <NavIcon
                    active={view === "users"}
                    title="Người dùng"
                    onClick={() => setView("users")}
                  >
                    <FiUsers />
                  </NavIcon>
                }

                {
                  (user.username === 'dinhhuutai' || user.username === 'thaonguyen') &&
                  <NavIcon
                    active={view === "modules"}
                    title="Quản lý Modules"
                    onClick={() => setView("modules")}
                  >
                    <FiGrid />
                  </NavIcon>
                }
                
                {
                  (user.username === 'dinhhuutai' || user.username === 'thaonguyen') &&
                  <NavIcon
                    active={view === "access"}
                    title="Phân quyền"
                    onClick={() => setView("access")}
                  >
                    <FiIcons.FiShield />
                  </NavIcon>
                }
                
              </nav>
            </aside>

            {/* Content theo view */}
            <main className="p-4 sm:p-6">
              {view === "home" && (
                loadingModules ? (
                  <div className="grid place-items-center h-48 rounded-2xl border border-dashed border-slate-200 bg-white/60 text-slate-500">
                    Đang tải danh sách module…
                  </div>
                ) : visibleModules.length === 0 ? (
                  <div className="grid place-items-center h-48 rounded-2xl border border-dashed border-slate-200 bg-white/60 text-slate-500">
                    Không tìm thấy module nào. Thử từ khoá khác hoặc liên hệ quản trị để được cấp quyền.
                  </div>
                ) : (
                  <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {visibleModules.map((m) => {
                      const toUser = () => goToModule(m, "user");
                      const toAdmin = () => goToModule(m, "admin");

                      return (
                        <ModuleCard
                          key={m.moduleId || m.name}
                          module={m}
                          onGoUser={toUser}
                          onGoAdmin={toAdmin}
                        />
                      );
                    })}
                  </div>
                )
              )}

              {view === "modules" && <Module />}

              {view === "access" && <UserModuleAccess />}

              {view === "users" && <UsersAdminPanel />}

              {view === "create" && <CreateAccountCard onCreated={() => setView("users")} />}
              
              {view === "settings" && <ProfileSettingsCard />}

            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomeMain;
