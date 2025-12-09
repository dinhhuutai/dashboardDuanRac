// src/pages/Home/components/UsersAdminPanel.jsx
import React, { useEffect, useState } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import * as FiIcons from "react-icons/fi";
import http from "~/api/http";
import Field from "./Field";

/* ---------- ConfirmDialog dùng riêng trong panel ---------- */
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
      <div
        className="absolute inset-0 bg-black/40"
        onClick={loading ? undefined : onClose}
      />
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

/* ---------- Modal sửa user ---------- */
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
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-slate-100"
          >
            <FiX />
          </button>
        </div>
        <div className="p-5 grid gap-4">
          <Field label="Họ tên">
            <input
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={form.fullName}
              onChange={(e) =>
                setForm((p) => ({ ...p, fullName: e.target.value }))
              }
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
            />
          </Field>
          <Field label="SĐT">
            <input
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={form.phone}
              onChange={(e) =>
                setForm((p) => ({ ...p, phone: e.target.value }))
              }
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Vai trò">
              <select
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={form.role}
                onChange={(e) =>
                  setForm((p) => ({ ...p, role: e.target.value }))
                }
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
            <Field label="Trạng thái">
              <label className="inline-flex items-center gap-2 mt-2.5">
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-indigo-600"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, isActive: e.target.checked }))
                  }
                />
                <span className="text-sm">Kích hoạt</span>
              </label>
            </Field>
          </div>
        </div>

        {msg && (
          <div
            className={`mx-5 mb-3 rounded-xl px-3 py-2 text-sm ring-1 ${
              msg.type === "success"
                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                : "bg-red-50 text-red-700 ring-red-200"
            }`}
          >
            {msg.text}
          </div>
        )}

        <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl bg-white ring-1 ring-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
          >
            Huỷ
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Đang lưu…" : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Panel admin người dùng ---------- */
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
      const r = await http.get(`/api/users`, {
        params: { q, page, pageSize: size, includeModules: 1 },
      });
      const list = r.data?.data || [];
      setRows(list);
      setTotal(r.data?.pagination?.total || list.length);
    } catch {
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, page]);

  const toggleActive = async (u) => {
    setSavingToggle(u.userID);
    try {
      await http.put(`/api/users/${u.userID}/active`, { isActive: !u.isActive });
      setRows((xs) =>
        xs.map((x) =>
          x.userID === u.userID ? { ...x, isActive: !x.isActive } : x
        )
      );
      setToast({ type: "success", text: "Cập nhật trạng thái thành công." });
    } catch {
      setToast({
        type: "error",
        text: "Không cập nhật được trạng thái.",
      });
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
          await http.post(`/api/users/${u.userID}/reset-password`, {
            newPassword: "1",
          });
          setToast({ type: "success", text: "Đã reset mật khẩu về 1." });
        } catch {
          setToast({
            type: "error",
            text: "Reset mật khẩu thất bại.",
          });
        } finally {
          setConfirm({
            open: false,
            title: "",
            desc: "",
            loading: false,
            onYes: null,
          });
        }
      },
    });
  };

  const norm = (s) =>
    (s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-white/80 backdrop-blur ring-1 ring-slate-200 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Người dùng</h2>
            <p className="text-sm text-slate-500">
              Danh sách tài khoản & phân quyền theo module.
            </p>
          </div>
          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
              placeholder="Tìm theo tên/username/email…"
              className="w-[min(80vw,280px)] rounded-xl bg-white pl-9 pr-9 py-2 text-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            {q && (
              <button
                onClick={() => setQ("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-slate-100 text-slate-500"
              >
                <FiX />
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          {loading ? (
            <div className="grid place-items-center h-40 text-slate-500">
              Đang tải…
            </div>
          ) : rows.length === 0 ? (
            <div className="grid place-items-center h-40 text-slate-500">
              Không có người dùng.
            </div>
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
                  <tr
                    key={u.userID}
                    className={idx % 2 ? "bg-white" : "bg-slate-50/60"}
                  >
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center font-semibold">
                          {(u.fullName || u.username || "?")
                            .substring(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800">
                            {u.fullName || "—"}
                          </div>
                          <div className="text-xs text-slate-500">
                            @{u.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-xs text-slate-600">
                        {u.email ? <div>Email: {u.email}</div> : null}
                        {u.phone ? <div>Phone: {u.phone}</div> : null}
                        <div>
                          Last login:{" "}
                          {u.lastLogin
                            ? new Date(u.lastLogin).toLocaleString()
                            : "—"}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs ring-1 ${
                          (u.role || "user") === "admin"
                            ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
                            : "bg-slate-50 text-slate-700 ring-slate-200"
                        }`}
                      >
                        {u.role || "user"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-5 w-5 accent-indigo-600"
                          checked={!!u.isActive}
                          disabled={savingToggle === u.userID}
                          onChange={() => toggleActive(u)}
                        />
                        <span className="text-xs">
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </label>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1.5 max-w-[420px]">
                        {(u.modules || []).length === 0 ? (
                          <span className="text-xs text-slate-500">—</span>
                        ) : (
                          u.modules.map((m) => (
                            <span
                              key={m.moduleId}
                              className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs ring-1 ring-slate-200 shadow-sm"
                            >
                              {m.name}
                              {m.role === "admin" && (
                                <span className="ml-1 text-[10px] px-1 rounded bg-indigo-100 text-indigo-700">
                                  admin
                                </span>
                              )}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          className="rounded-xl bg-white ring-1 ring-slate-200 px-3 py-1.5 hover:bg-slate-50"
                          onClick={() => setEditing(u)}
                        >
                          Sửa
                        </button>
                        <button
                          className="rounded-xl bg-white ring-1 ring-slate-200 px-3 py-1.5 hover:bg-slate-50"
                          onClick={() => resetPassword(u)}
                        >
                          Reset PW = 1
                        </button>

                        <button
                          onClick={() =>
                            setConfirm({
                              open: true,
                              title: u.isActive
                                ? "Vô hiệu hoá tài khoản"
                                : "Kích hoạt tài khoản",
                              desc: `Bạn chắc chắn muốn ${
                                u.isActive ? "vô hiệu hoá" : "kích hoạt"
                              } @${u.username}?`,
                              loading: false,
                              onYes: async () => {
                                setConfirm((c) => ({ ...c, loading: true }));
                                await toggleActive(u);
                                setConfirm({
                                  open: false,
                                  title: "",
                                  desc: "",
                                  loading: false,
                                  onYes: null,
                                });
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
          <span>
            Trang {page}/{totalPages} • {total} người
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-xl bg-white ring-1 ring-slate-200 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-50"
            >
              Trước
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-xl bg-white ring-1 ring-slate-200 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>

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

      {editing && (
        <EditUserModal
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={(u2) => {
            setRows((xs) =>
              xs.map((x) => (x.userID === u2.userID ? { ...x, ...u2 } : x))
            );
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
        onClose={() =>
          !confirm.loading &&
          setConfirm({
            open: false,
            title: "",
            desc: "",
            loading: false,
            onYes: null,
          })
        }
        onConfirm={() => confirm.onYes?.()}
      />
    </div>
  );
}

export default UsersAdminPanel;
