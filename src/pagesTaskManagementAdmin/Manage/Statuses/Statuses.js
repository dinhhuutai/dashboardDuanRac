// src/pageTaskManagement/Admin/Statuses.jsx
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import http from "~/api/http";
import { BASE_URL } from "~/config";

function Spinner() {
  return (
    <span className="inline-block h-3 w-3 animate-spin rounded-full border-[2px] border-white/40 border-t-white" />
  );
}

function ConfirmDialog({ open, title, message, onCancel, onConfirm, loading }) {
  if (!open) return null;

  // Dùng portal để overlay luôn bám theo toàn bộ window, không bị giới hạn bởi layout hiện tại
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex min-h-screen w-screen items-center justify-center bg-black/40 backdrop-blur-sm px-3">
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

function StatusRow({ item, onSave, onDelete, onMove, savingId }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: item.name,
    orderIndex: item.orderIndex,
  });

  useEffect(() => {
    setForm({
      name: item.name,
      orderIndex: item.orderIndex,
    });
  }, [item]);

  const isDeleted = !!item.isDeleted;
  const disabled = savingId === item.statusId || isDeleted;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveClick = async () => {
    await onSave(item.statusId, form);
    setEditing(false);
  };

  return (
    <tr className="border-b border-slate-100">
      <td className="px-2 py-1 text-[11px] text-slate-500">{item.statusId}</td>

      {/* Code chỉ hiển thị, không cho sửa vì system dùng code (todo/doing/...) */}
      <td className="px-2 py-1">
        <span className="inline-flex rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-mono text-slate-800 border border-slate-200">
          {item.code}
        </span>
      </td>

      {/* Tên trạng thái */}
      <td className="px-2 py-1">
        {editing ? (
          <input
            className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
            value={form.name}
            maxLength={200}
            onChange={(e) => handleChange("name", e.target.value)}
            disabled={disabled}
          />
        ) : (
          <span className="text-xs text-slate-900">{item.name}</span>
        )}
      </td>

      {/* Thứ tự */}
      <td className="px-2 py-1 text-center">
        {editing ? (
          <input
            type="number"
            className="w-16 rounded border border-slate-200 px-1 py-0.5 text-center text-xs"
            value={form.orderIndex ?? ""}
            disabled={disabled}
            onChange={(e) =>
              handleChange(
                "orderIndex",
                e.target.value ? Number(e.target.value) : null
              )
            }
          />
        ) : (
          <span className="text-xs text-slate-600">{item.orderIndex ?? "-"}</span>
        )}
      </td>

      {/* Trạng thái dùng / đã xoá */}
      <td className="px-2 py-1 text-center">
        <StatusBadge isDeleted={item.isDeleted} />
      </td>

      {/* Cột sắp xếp: nút lên / xuống */}
      <td className="px-2 py-1 text-center">
        {!isDeleted && (
          <div className="inline-flex flex-col gap-0.5">
            <button
              className="rounded-full border border-slate-200 bg-slate-50 px-1 text-[10px] hover:bg-slate-100"
              disabled={disabled}
              title="Đưa lên trên"
              onClick={() => onMove(item, "up")}
            >
              ▲
            </button>
            <button
              className="rounded-full border border-slate-200 bg-slate-50 px-1 text-[10px] hover:bg-slate-100"
              disabled={disabled}
              title="Đưa xuống dưới"
              onClick={() => onMove(item, "down")}
            >
              ▼
            </button>
          </div>
        )}
      </td>

      {/* Thao tác */}
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
              {savingId === item.statusId && <Spinner />}
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
              onClick={() => onDelete(item)}
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

function Statuses() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [savingRowId, setSavingRowId] = useState(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const [newStatus, setNewStatus] = useState({
    name: "",
  });

  const [filterStatus, setFilterStatus] = useState("active"); // active|all|deleted
  const [search, setSearch] = useState("");

  const [confirmState, setConfirmState] = useState({ open: false, item: null });
  const [confirmLoading, setConfirmLoading] = useState(false);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const res = await http.get(
        `${BASE_URL}/api/task-management/admin/workflow-statuses`
      );
      setItems(res.data?.data || []);
    } catch (e) {
      console.error(e);
      setError("Không tải được danh sách trạng thái công việc");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredItems = useMemo(() => {
    return (items || []).filter((d) => {
      const isDeleted = !!d.isDeleted;
      if (filterStatus === "active" && isDeleted) return false;
      if (filterStatus === "deleted" && !isDeleted) return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (
          !(
            (d.name || "").toLowerCase().includes(q) ||
            (d.code || "").toLowerCase().includes(q)
          )
        ) {
          return false;
        }
      }
      return true;
    });
  }, [items, filterStatus, search]);

  async function handleCreate() {
    if (!newStatus.name.trim()) return;
    setSavingGlobal(true);
    setError("");
    setInfo("");
    try {
      const payload = { name: newStatus.name };
      await http.post(
        `${BASE_URL}/api/task-management/admin/workflow-statuses`,
        payload
      );
      setNewStatus({ name: "" });
      setInfo("Thêm trạng thái công việc thành công");
      await loadData();
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "Tạo trạng thái công việc thất bại");
    } finally {
      setSavingGlobal(false);
    }
  }

  async function handleUpdate(id, form) {
    setSavingRowId(id);
    setError("");
    setInfo("");
    try {
      const payload = {
        name: form.name,
        orderIndex: form.orderIndex,
      };
      await http.patch(
        `${BASE_URL}/api/task-management/admin/workflow-statuses/${id}`,
        payload
      );
      setInfo("Cập nhật trạng thái công việc thành công");
      await loadData();
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "Cập nhật trạng thái thất bại");
    } finally {
      setSavingRowId(null);
    }
  }

  function askDelete(item) {
    setConfirmState({ open: true, item });
  }

  async function confirmDelete() {
    if (!confirmState.item) return;
    setConfirmLoading(true);
    setError("");
    setInfo("");
    try {
      await http.delete(
        `${BASE_URL}/api/task-management/admin/workflow-statuses/${confirmState.item.statusId}`
      );
      setInfo("Xoá trạng thái công việc thành công");
      setConfirmState({ open: false, item: null });
      await loadData();
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "Xoá trạng thái công việc thất bại");
    } finally {
      setConfirmLoading(false);
    }
  }

  async function handleMove(item, direction) {
    setSavingRowId(item.statusId);
    setError("");
    setInfo("");
    try {
      await http.patch(
        `${BASE_URL}/api/task-management/admin/workflow-statuses/${item.statusId}/reorder`,
        { direction }
      );
      await loadData();
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "Sắp xếp thứ tự thất bại");
    } finally {
      setSavingRowId(null);
    }
  }

  const disableCreate = savingGlobal || !newStatus.name.trim();

  return (
    <div className="flex h-full flex-col p-3 md:p-4">
      <div className="bg-white/80 backdrop-blur rounded-2xl border border-slate-200 shadow-sm p-3 md:p-5 h-full flex flex-col">
        {/* Header */}
        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-base font-semibold text-slate-900 md:text-lg">
              Trạng thái công việc
            </h1>
            <p className="text-[11px] text-slate-500">
              Quản lý các trạng thái workflow (todo, doing, review, done...).
            </p>
          </div>
        </div>

        {(error || info) && (
          <div className="mb-3 space-y-1">
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

        {/* Tạo mới */}
        <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="mb-1 text-xs font-semibold text-slate-700">
            Thêm trạng thái mới
          </p>
          <div className="flex flex-col gap-2 md:flex-row">
            <input
              className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:outline-none focus:ring-0 focus:border-emerald-500"
              placeholder="Tên trạng thái (VD: Cần làm, Đang làm...)"
              value={newStatus.name}
              maxLength={200}
              onChange={(e) =>
                setNewStatus((p) => ({ ...p, name: e.target.value }))
              }
            />
            <button
              className="inline-flex items-center justify-center gap-1 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
              disabled={disableCreate}
              onClick={handleCreate}
            >
              {savingGlobal && <Spinner />}
              <span>Thêm trạng thái</span>
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
              className="w-full max-w-xs rounded-full border border-slate-200 px-3 py-1.5 text-xs outline-none focus:outline-none focus:ring-0 focus:border-emerald-500"
              placeholder="Tìm theo mã / tên trạng thái..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="hidden text-[11px] text-slate-400 sm:inline">
              {filteredItems.length} trạng thái
            </span>
          </div>
        </div>

        {/* Bảng */}
        <div className="flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-50">
                <tr className="text-[11px] text-slate-500">
                  <th className="px-2 py-2 font-semibold">ID</th>
                  <th className="px-2 py-2 font-semibold">Mã</th>
                  <th className="px-2 py-2 font-semibold">Tên trạng thái</th>
                  <th className="px-2 py-2 text-center font-semibold">
                    Thứ tự
                  </th>
                  <th className="px-2 py-2 text-center font-semibold">
                    Trạng thái
                  </th>
                  <th className="px-2 py-2 text-center font-semibold">
                    Sắp xếp
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
                      colSpan={7}
                      className="px-3 py-4 text-center text-xs text-slate-500"
                    >
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-3 py-4 text-center text-xs text-slate-400"
                    >
                      Không có trạng thái nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <StatusRow
                      key={item.statusId}
                      item={item}
                      onSave={handleUpdate}
                      onDelete={askDelete}
                      onMove={handleMove}
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
          title="Xoá trạng thái công việc"
          message={
            confirmState.item
              ? `Xoá trạng thái "${confirmState.item.name}".\nCác task đang dùng trạng thái này có thể bị ảnh hưởng.`
              : ""
          }
          onCancel={() => {
            if (!confirmLoading) setConfirmState({ open: false, item: null });
          }}
          onConfirm={confirmDelete}
        />
      </div>
    </div>
  );
}

export default Statuses;
