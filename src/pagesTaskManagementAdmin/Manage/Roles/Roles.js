// src/pageTaskManagement/Admin/AdminRolesPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import http from "~/api/http";
import { BASE_URL } from "~/config";

function Spinner() {
  return (
    <span className="inline-block h-3 w-3 animate-spin rounded-full border-[2px] border-white/40 border-t-white" />
  );
}

function StatusBadge({ isDeleted }) {
  const active = !isDeleted;
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] ${
        active
          ? "border-emerald-100 bg-emerald-50 text-emerald-700"
          : "border-rose-100 bg-rose-50 text-rose-600"
      }`}
    >
      {active ? "Đang dùng" : "Đã xoá"}
    </span>
  );
}

/**
 * Modal xác nhận (xoá) – full màn hình, blur nhẹ
 */
// Modal xác nhận (xoá) – full màn hình, blur nhẹ
function ConfirmDialog({ open, title, message, onCancel, onConfirm, loading }) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-3">
      <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-lg">
        <h2 className="mb-2 text-sm font-semibold text-slate-900">{title}</h2>
        <p className="mb-4 whitespace-pre-line text-xs text-slate-600">
          {message}
        </p>
        <div className="flex justify-end gap-2">
          <button
            className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] text-slate-700 hover:bg-slate-200"
            onClick={onCancel}
            disabled={loading}
          >
            Hủy
          </button>
          <button
            className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-rose-500 disabled:opacity-60"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <Spinner />}
            <span>Xoá</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * Modal thông báo full màn hình (thành công / lỗi)
 * Dùng portal để luôn phủ full màn hình
 */
function FullscreenNoticeModal({ open, type, message, onClose }) {
  if (!open) return null;

  const isError = type === "error";

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-3">
      {/* Lớp nền trên toàn màn hình */}
        <div className="w-full max-w-md sm:max-w-lg rounded-2xl bg-white p-5 shadow-xl border border-slate-200">
          <h2
            className={`mb-2 text-sm font-semibold ${
              isError ? "text-rose-700" : "text-emerald-700"
            }`}
          >
            {isError ? "Có lỗi xảy ra" : "Thao tác thành công"}
          </h2>
          <p className="mb-4 whitespace-pre-line text-xs text-slate-700">
            {message}
          </p>
          <div className="flex justify-end">
            <button
              className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-4 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-700"
              onClick={onClose}
            >
              Đóng
            </button>
          </div>
        </div>
      </div>,
    document.body
  );
}

/* ==============================
   1) Company roles section
   ============================== */

function CompanyRolesSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingRowId, setSavingRowId] = useState(null);
  const [savingNew, setSavingNew] = useState(false);
  const [filterStatus, setFilterStatus] = useState("active"); // active|all|deleted
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  // form tạo mới: chỉ có name, code BE tự sinh
  const [newRole, setNewRole] = useState({ name: "" });

  const [confirmState, setConfirmState] = useState({ open: false, role: null });
  const [confirmLoading, setConfirmLoading] = useState(false);

  // modal thông báo full màn hình
  const [modalState, setModalState] = useState({
    open: false,
    type: "info", // "info" | "error"
    message: "",
  });

  const openModal = (type, message) => {
    setModalState({ open: true, type, message });
  };

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, open: false }));
  };

  async function loadData(includeDeleted = true) {
    setLoading(true);
    setError("");
    try {
      const res = await http.get(
        `${BASE_URL}/api/task-management/admin/company-roles`,
        {
          params: {
            includeDeleted: includeDeleted ? "1" : "0",
          },
        }
      );
      setItems(res.data?.data || []);
    } catch (e) {
      console.error(e);
      const msg = "Không tải được danh sách vai trò công ty";
      setError(msg);
      openModal("error", msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredItems = useMemo(() => {
    return (items || []).filter((r) => {
      const isDeleted = !!r.isDeleted;
      if (filterStatus === "active" && isDeleted) return false;
      if (filterStatus === "deleted" && !isDeleted) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (
          !(
            (r.name || "").toLowerCase().includes(q) ||
            (r.code || "").toLowerCase().includes(q)
          )
        ) {
          return false;
        }
      }
      return true;
    });
  }, [items, filterStatus, search]);

  async function handleCreate() {
    if (!newRole.name.trim()) return;
    setSavingNew(true);
    setError("");
    setInfo("");
    try {
      const payload = {
        name: newRole.name, // không gửi code, BE tự slug
      };
      await http.post(
        `${BASE_URL}/api/task-management/admin/company-roles`,
        payload
      );
      setNewRole({ name: "" });
      const msg = "Thêm vai trò công ty thành công";
      setInfo(msg);
      openModal("info", msg);
      await loadData(true);
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.message || "Tạo vai trò công ty thất bại";
      setError(msg);
      openModal("error", msg);
    } finally {
      setSavingNew(false);
    }
  }

  async function handleUpdate(roleId, form) {
    setSavingRowId(roleId);
    setError("");
    setInfo("");
    try {
      const payload = {
        name: form.name, // chỉ cho sửa name
      };
      await http.patch(
        `${BASE_URL}/api/task-management/admin/company-roles/${roleId}`,
        payload
      );
      const msg = "Cập nhật vai trò công ty thành công";
      setInfo(msg);
      openModal("info", msg);
      await loadData(true);
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.message || "Cập nhật vai trò công ty thất bại";
      setError(msg);
      openModal("error", msg);
    } finally {
      setSavingRowId(null);
    }
  }

  function askDelete(role) {
    setConfirmState({ open: true, role });
  }

  async function confirmDelete() {
    if (!confirmState.role) return;
    setConfirmLoading(true);
    setError("");
    setInfo("");
    try {
      await http.delete(
        `${BASE_URL}/api/task-management/admin/company-roles/${confirmState.role.roleId}`
      );
      const msg = "Xoá vai trò công ty thành công";
      setInfo(msg);
      openModal("info", msg);
      setConfirmState({ open: false, role: null });
      await loadData(true);
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.message || "Xoá vai trò công ty thất bại";
      setError(msg);
      openModal("error", msg);
    } finally {
      setConfirmLoading(false);
    }
  }

  const disableCreate = savingNew || !newRole.name.trim();

  return (
    <>
      <div className="flex flex-col rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm">
        <div className="mb-2">
          <h2 className="text-sm font-semibold text-slate-900">
            Vai trò trong công ty
          </h2>
          <p className="text-[11px] text-slate-500">
            Ví dụ: Admin, Trưởng phòng, Nhân viên, Ban giám đốc...
          </p>
        </div>

        {(error || info) && (
          <div className="mb-2 space-y-1">
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
                {error}
              </div>
            )}
            {info && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700">
                {info}
              </div>
            )}
          </div>
        )}

        {/* Form tạo mới: chỉ nhập TÊN, mã tự sinh */}
        <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-3">
          <p className="mb-1 text-xs font-semibold text-slate-700">
            Thêm vai trò công ty
          </p>
          <div className="flex flex-col gap-2 md:flex-row">
            <input
              className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-emerald-500 focus:ring-0"
              placeholder="Tên vai trò (VD: Trưởng phòng, Nhân viên...)"
              value={newRole.name}
              maxLength={200}
              onChange={(e) =>
                setNewRole((p) => ({ ...p, name: e.target.value }))
              }
            />
            <button
              className="inline-flex items-center justify-center gap-1 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
              disabled={disableCreate}
              onClick={handleCreate}
            >
              {savingNew && <Spinner />}
              <span>Thêm</span>
            </button>
          </div>
        </div>

        {/* Filter + search */}
        <div className="mb-2 flex flex-col gap-2 text-[11px] text-slate-600 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <span className="hidden text-[11px] text-slate-500 sm:inline">
              Lọc:
            </span>
            <div className="inline-flex overflow-hidden rounded-full border border-slate-200 bg-slate-50">
              {[
                { value: "active", label: "Đang dùng" },
                { value: "all", label: "Tất cả" },
                { value: "deleted", label: "Đã xoá" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  className={`px-3 py-1 text-[11px] ${
                    filterStatus === opt.value
                      ? "bg-white text-slate-900"
                      : "text-slate-500"
                  }`}
                  onClick={() => setFilterStatus(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              className="w-full max-w-xs rounded-full border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-slate-400 focus:ring-0"
              placeholder="Tìm theo mã / tên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="hidden text-[11px] text-slate-400 sm:inline">
              {filteredItems.length} vai trò
            </span>
          </div>
        </div>

        {/* Bảng */}
        <div className="flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-50">
                <tr className="text-[11px] text-slate-500">
                  <th className="px-2 py-2 font-semibold">ID</th>
                  <th className="px-2 py-2 font-semibold">Mã</th>
                  <th className="px-2 py-2 font-semibold">Tên vai trò</th>
                  <th className="px-2 py-2 text-center font-semibold">
                    Trạng thái
                  </th>
                  <th className="px-2 py-2 text-right font-semibold">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-4 text-center text-xs text-slate-500"
                    >
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-4 text-center text-xs text-slate-400"
                    >
                      Không có vai trò nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((role) => (
                    <CompanyRoleRow
                      key={role.roleId}
                      role={role}
                      onSave={handleUpdate}
                      onDelete={askDelete}
                      savingId={savingRowId}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <ConfirmDialog
          open={confirmState.open}
          loading={confirmLoading}
          title="Xoá vai trò công ty"
          message={
            confirmState.role
              ? `Xoá vai trò "${confirmState.role.name}".`
              : ""
          }
          onCancel={() => {
            if (!confirmLoading) setConfirmState({ open: false, role: null });
          }}
          onConfirm={confirmDelete}
        />
      </div>

      {/* Modal thông báo full màn hình */}
      <FullscreenNoticeModal
        open={modalState.open}
        type={modalState.type}
        message={modalState.message}
        onClose={closeModal}
      />
    </>
  );
}

function CompanyRoleRow({ role, onSave, onDelete, savingId }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: role.name,
  });

  useEffect(() => {
    setForm({ name: role.name });
  }, [role]);

  const isDeleted = !!role.isDeleted;
  const disabled = savingId === role.roleId || isDeleted;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveClick = async () => {
    await onSave(role.roleId, form);
    setEditing(false);
  };

  return (
    <tr className="border-b border-slate-100">
      <td className="px-2 py-1 text-[11px] text-slate-500">{role.roleId}</td>
      {/* CODE: chỉ hiển thị, không cho sửa */}
      <td className="px-2 py-1">
        <span className="text-xs font-mono text-slate-800">{role.code}</span>
      </td>
      <td className="px-2 py-1">
        {editing ? (
          <input
            className="w-full rounded border border-slate-200 px-2 py-1 text-xs outline-none focus:border-emerald-500 focus:ring-0"
            value={form.name || ""}
            maxLength={200}
            onChange={(e) => handleChange("name", e.target.value)}
            disabled={disabled}
          />
        ) : (
          <span className="text-xs text-slate-900">{role.name}</span>
        )}
      </td>
      <td className="px-2 py-1 text-center">
        <StatusBadge isDeleted={role.isDeleted} />
      </td>
      <td className="px-2 py-1 text-right">
        {isDeleted ? (
          <span className="text-[11px] italic text-slate-400">Đã xoá</span>
        ) : editing ? (
          <div className="flex justify-end gap-1">
            <button
              className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
              onClick={handleSaveClick}
              disabled={disabled}
            >
              {savingId === role.roleId && <Spinner />}
              <span>Lưu</span>
            </button>
            <button
              className="rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-700 hover:bg-slate-200"
              onClick={() => setEditing(false)}
              disabled={disabled}
            >
              Hủy
            </button>
          </div>
        ) : (
          <div className="flex justify-end gap-1">
            <button
              className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] text-sky-700 hover:bg-sky-100"
              onClick={() => setEditing(true)}
              disabled={disabled}
            >
              Sửa
            </button>
            <button
              className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] text-rose-600 hover:bg-rose-100"
              onClick={() => onDelete(role)}
              disabled={disabled}
            >
              Xoá
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

/* ==============================
   2) Project roles section
   ============================== */

function ProjectRolesSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingRowId, setSavingRowId] = useState(null);
  const [savingNew, setSavingNew] = useState(false);
  const [filterStatus, setFilterStatus] = useState("active");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  // form tạo mới: name + isManagerial, code tự sinh
  const [newRole, setNewRole] = useState({
    name: "",
    isManagerial: false,
  });

  const [confirmState, setConfirmState] = useState({ open: false, role: null });
  const [confirmLoading, setConfirmLoading] = useState(false);

  // modal thông báo full màn hình
  const [modalState, setModalState] = useState({
    open: false,
    type: "info",
    message: "",
  });

  const openModal = (type, message) => {
    setModalState({ open: true, type, message });
  };

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, open: false }));
  };

  async function loadData(includeDeleted = true) {
    setLoading(true);
    setError("");
    try {
      const res = await http.get(
        `${BASE_URL}/api/task-management/admin/project-roles`,
        {
          params: {
            includeDeleted: includeDeleted ? "1" : "0",
          },
        }
      );
      setItems(res.data?.data || []);
    } catch (e) {
      console.error(e);
      const msg = "Không tải được danh sách vai trò dự án";
      setError(msg);
      openModal("error", msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredItems = useMemo(() => {
    return (items || []).filter((r) => {
      const isDeleted = !!r.isDeleted;
      if (filterStatus === "active" && isDeleted) return false;
      if (filterStatus === "deleted" && !isDeleted) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (
          !(
            (r.name || "").toLowerCase().includes(q) ||
            (r.code || "").toLowerCase().includes(q)
          )
        ) {
          return false;
        }
      }
      return true;
    });
  }, [items, filterStatus, search]);

  async function handleCreate() {
    if (!newRole.name.trim()) return;
    setSavingNew(true);
    setError("");
    setInfo("");
    try {
      const payload = {
        name: newRole.name,
        isManagerial: !!newRole.isManagerial,
        // không gửi code -> BE tự slug từ name
      };
      await http.post(
        `${BASE_URL}/api/task-management/admin/project-roles`,
        payload
      );
      setNewRole({ name: "", isManagerial: false });
      const msg = "Thêm vai trò dự án thành công";
      setInfo(msg);
      openModal("info", msg);
      await loadData(true);
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.message || "Tạo vai trò dự án thất bại";
      setError(msg);
      openModal("error", msg);
    } finally {
      setSavingNew(false);
    }
  }

  async function handleUpdate(roleId, form) {
    setSavingRowId(roleId);
    setError("");
    setInfo("");
    try {
      const payload = {
        name: form.name,
        isManagerial: !!form.isManagerial,
      };
      await http.patch(
        `${BASE_URL}/api/task-management/admin/project-roles/${roleId}`,
        payload
      );
      const msg = "Cập nhật vai trò dự án thành công";
      setInfo(msg);
      openModal("info", msg);
      await loadData(true);
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.message || "Cập nhật vai trò dự án thất bại";
      setError(msg);
      openModal("error", msg);
    } finally {
      setSavingRowId(null);
    }
  }

  function askDelete(role) {
    setConfirmState({ open: true, role });
  }

  async function confirmDelete() {
    if (!confirmState.role) return;
    setConfirmLoading(true);
    setError("");
    setInfo("");
    try {
      await http.delete(
        `${BASE_URL}/api/task-management/admin/project-roles/${confirmState.role.projectRoleId}`
      );
      const msg = "Xoá vai trò dự án thành công";
      setInfo(msg);
      openModal("info", msg);
      setConfirmState({ open: false, role: null });
      await loadData(true);
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.message || "Xoá vai trò dự án thất bại";
      setError(msg);
      openModal("error", msg);
    } finally {
      setConfirmLoading(false);
    }
  }

  const disableCreate = savingNew || !newRole.name.trim();

  return (
    <>
      <div className="flex flex-col rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm">
        <div className="mb-2">
          <h2 className="text-sm font-semibold text-slate-900">
            Vai trò trong dự án
          </h2>
          <p className="text-[11px] text-slate-500">
            Ví dụ: Chủ dự án, Thành viên, Reviewer, QA, PM...
          </p>
        </div>

        {(error || info) && (
          <div className="mb-2 space-y-1">
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
                {error}
              </div>
            )}
            {info && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700">
                {info}
              </div>
            )}
          </div>
        )}

        {/* Form tạo mới: name + isManagerial, code tự sinh */}
        <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-3">
          <p className="mb-1 text-xs font-semibold text-slate-700">
            Thêm vai trò dự án
          </p>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <input
              className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-emerald-500 focus:ring-0"
              placeholder="Tên vai trò (VD: Chủ dự án, Thành viên...)"
              value={newRole.name}
              maxLength={200}
              onChange={(e) =>
                setNewRole((p) => ({ ...p, name: e.target.value }))
              }
            />
            <label className="inline-flex items-center gap-1 text-[11px] text-slate-600">
              <input
                type="checkbox"
                className="h-3 w-3 rounded border-slate-300"
                checked={newRole.isManagerial}
                onChange={(e) =>
                  setNewRole((p) => ({
                    ...p,
                    isManagerial: e.target.checked,
                  }))
                }
              />
              <span>Là vai trò quản lý</span>
            </label>
            <button
              className="inline-flex items-center justify-center gap-1 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
              disabled={disableCreate}
              onClick={handleCreate}
            >
              {savingNew && <Spinner />}
              <span>Thêm</span>
            </button>
          </div>
        </div>

        {/* Filter + search */}
        <div className="mb-2 flex flex-col gap-2 text-[11px] text-slate-600 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <span className="hidden text-[11px] text-slate-500 sm:inline">
              Lọc:
            </span>
            <div className="inline-flex overflow-hidden rounded-full border border-slate-200 bg-slate-50">
              {[
                { value: "active", label: "Đang dùng" },
                { value: "all", label: "Tất cả" },
                { value: "deleted", label: "Đã xoá" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  className={`px-3 py-1 text-[11px] ${
                    filterStatus === opt.value
                      ? "bg-white text-slate-900"
                      : "text-slate-500"
                  }`}
                  onClick={() => setFilterStatus(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              className="w-full max-w-xs rounded-full border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-slate-400 focus:ring-0"
              placeholder="Tìm theo mã / tên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="hidden text-[11px] text-slate-400 sm:inline">
              {filteredItems.length} vai trò
            </span>
          </div>
        </div>

        {/* Bảng */}
        <div className="flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-50">
                <tr className="text-[11px] text-slate-500">
                  <th className="px-2 py-2 font-semibold">ID</th>
                  <th className="px-2 py-2 font-semibold">Mã</th>
                  <th className="px-2 py-2 font-semibold">Tên vai trò</th>
                  <th className="px-2 py-2 text-center font-semibold">
                    Quản lý?
                  </th>
                  <th className="px-2 py-2 text-center font-semibold">
                    Trạng thái
                  </th>
                  <th className="px-2 py-2 text-right font-semibold">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-4 text-center text-xs text-slate-500"
                    >
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-4 text-center text-xs text-slate-400"
                    >
                      Không có vai trò nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((role) => (
                    <ProjectRoleRow
                      key={role.projectRoleId}
                      role={role}
                      onSave={handleUpdate}
                      onDelete={askDelete}
                      savingId={savingRowId}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <ConfirmDialog
          open={confirmState.open}
          loading={confirmLoading}
          title="Xoá vai trò dự án"
          message={
            confirmState.role
              ? `Xoá vai trò "${confirmState.role.name}".`
              : ""
          }
          onCancel={() => {
            if (!confirmLoading) setConfirmState({ open: false, role: null });
          }}
          onConfirm={confirmDelete}
        />
      </div>

      {/* Modal thông báo full màn hình */}
      <FullscreenNoticeModal
        open={modalState.open}
        type={modalState.type}
        message={modalState.message}
        onClose={closeModal}
      />
    </>
  );
}

function ProjectRoleRow({ role, onSave, onDelete, savingId }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: role.name,
    isManagerial: !!role.isManagerial,
  });

  useEffect(() => {
    setForm({
      name: role.name,
      isManagerial: !!role.isManagerial,
    });
  }, [role]);

  const isDeleted = !!role.isDeleted;
  const disabled = savingId === role.projectRoleId || isDeleted;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveClick = async () => {
    await onSave(role.projectRoleId, form);
    setEditing(false);
  };

  return (
    <tr className="border-b border-slate-100">
      <td className="px-2 py-1 text-[11px] text-slate-500">
        {role.projectRoleId}
      </td>
      {/* CODE: chỉ hiển thị, không sửa */}
      <td className="px-2 py-1">
        <span className="text-xs font-mono text-slate-800">{role.code}</span>
      </td>
      <td className="px-2 py-1">
        {editing ? (
          <input
            className="w-full rounded border border-slate-200 px-2 py-1 text-xs outline-none focus:border-emerald-500 focus:ring-0"
            value={form.name || ""}
            maxLength={200}
            onChange={(e) => handleChange("name", e.target.value)}
            disabled={disabled}
          />
        ) : (
          <span className="text-xs text-slate-900">{role.name}</span>
        )}
      </td>
      <td className="px-2 py-1 text-center">
        {editing ? (
          <input
            type="checkbox"
            className="h-3 w-3 rounded border-slate-300"
            checked={form.isManagerial}
            disabled={disabled}
            onChange={(e) =>
              handleChange("isManagerial", e.target.checked)
            }
          />
        ) : (
          <span className="text-[11px] text-slate-700">
            {role.isManagerial ? "Có" : "Không"}
          </span>
        )}
      </td>
      <td className="px-2 py-1 text-center">
        <StatusBadge isDeleted={role.isDeleted} />
      </td>
      <td className="px-2 py-1 text-right">
        {isDeleted ? (
          <span className="text-[11px] italic text-slate-400">Đã xoá</span>
        ) : editing ? (
          <div className="flex justify-end gap-1">
            <button
              className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
              onClick={handleSaveClick}
              disabled={disabled}
            >
              {savingId === role.projectRoleId && <Spinner />}
              <span>Lưu</span>
            </button>
            <button
              className="rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-700 hover:bg-slate-200"
              onClick={() => setEditing(false)}
              disabled={disabled}
            >
              Hủy
            </button>
          </div>
        ) : (
          <div className="flex justify-end gap-1">
            <button
              className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] text-sky-700 hover:bg-sky-100"
              onClick={() => setEditing(true)}
              disabled={disabled}
            >
              Sửa
            </button>
            <button
              className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] text-rose-600 hover:bg-rose-100"
              onClick={() => onDelete(role)}
              disabled={disabled}
            >
              Xoá
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

/* ==============================
   PAGE WRAPPER
   ============================== */

export default function AdminRolesPage() {
  return (
    <div className="flex h-full flex-col p-3 md:p-4">
      <div className="bg-white/80 backdrop-blur rounded-2xl border border-slate-200 shadow-sm p-3 md:p-5 h-full flex flex-col">
        <div className="mb-3">
          <h1 className="text-base font-semibold text-slate-900 md:text-lg">
            Vai trò
          </h1>
          <p className="text-[11px] text-slate-500">
            Quản lý danh sách vai trò trong công ty và vai trò trong từng dự án.
          </p>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-3 lg:grid-cols-2">
          <CompanyRolesSection />
          <ProjectRolesSection />
        </div>
      </div>
    </div>
  );
}
