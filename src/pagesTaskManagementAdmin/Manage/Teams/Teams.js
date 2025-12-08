// src/pageTaskManagement/Admin/AdminTaskTeamsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import http from "~/api/http";
import { BASE_URL } from "~/config";

function Spinner() {
  return (
    <span className="inline-block h-3 w-3 animate-spin rounded-full border-[2px] border-white/40 border-t-white" />
  );
}

function ConfirmDialog({ open, title, message, onCancel, onConfirm, loading }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-3">
      <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl">
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
    </div>
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

function DepartmentSelect({ value, options, onChange, disabled }) {
  return (
    <select
      className="w-full rounded border border-slate-200 px-2 py-1 text-xs bg-white"
      value={value ?? ""}
      disabled={disabled}
      onChange={(e) =>
        onChange(e.target.value ? Number(e.target.value) : null)
      }
    >
      <option value="">-- Chọn phòng ban --</option>
      {options.map((d) => (
        <option key={d.departmentId} value={d.departmentId}>
          {d.name}
        </option>
      ))}
    </select>
  );
}

function TeamRow({
  team,
  departments,
  onSave,
  onDelete,
  onMove,
  savingId,
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: team.name,
    departmentId: team.departmentId,
    orderIndex: team.orderIndex,
  });

  React.useEffect(() => {
    setForm({
      name: team.name,
      departmentId: team.departmentId,
      orderIndex: team.orderIndex,
    });
  }, [team]);

  const isDeleted = !!team.isDeleted;
  const disabled = savingId === team.teamId || isDeleted;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveClick = async () => {
    await onSave(team.teamId, form);
    setEditing(false);
  };

  const deptName =
    departments.find((d) => d.departmentId === team.departmentId)?.name ||
    team.departmentName ||
    "-";

  return (
    <tr className="border-b border-slate-100">
      <td className="px-2 py-1 text-[11px] text-slate-500">{team.teamId}</td>

      {/* Mã team - chỉ hiển thị */}
      <td className="px-2 py-1">
        <span className="text-xs font-mono text-slate-800">{team.code}</span>
      </td>

      {/* Phòng ban */}
      <td className="px-2 py-1">
        {editing ? (
          <DepartmentSelect
            value={form.departmentId}
            options={departments}
            disabled={disabled}
            onChange={(v) => handleChange("departmentId", v)}
          />
        ) : (
          <span className="text-xs text-slate-800">{deptName}</span>
        )}
      </td>

      {/* Tên tổ/nhóm */}
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
          <span className="text-xs text-slate-900">{team.name}</span>
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
          <span className="text-xs text-slate-600">
            {team.orderIndex ?? "-"}
          </span>
        )}
      </td>

      {/* Trạng thái */}
      <td className="px-2 py-1 text-center">
        <StatusBadge isDeleted={team.isDeleted} />
      </td>

      {/* Sắp xếp lên / xuống */}
      <td className="px-2 py-1 text-center">
        {!isDeleted && (
          <div className="inline-flex flex-col gap-0.5">
            <button
              className="rounded-full border border-slate-200 bg-slate-50 px-1 text-[10px] hover:bg-slate-100"
              disabled={disabled}
              title="Đưa lên trên"
              onClick={() => onMove(team, "up")}
            >
              ▲
            </button>
            <button
              className="rounded-full border border-slate-200 bg-slate-50 px-1 text-[10px] hover:bg-slate-100"
              disabled={disabled}
              title="Đưa xuống dưới"
              onClick={() => onMove(team, "down")}
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
              {savingId === team.teamId && <Spinner />}
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
              onClick={() => onDelete(team)}
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

export default function AdminTaskTeamsPage() {
  const [teams, setTeams] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [loading, setLoading] = useState(false);
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [savingRowId, setSavingRowId] = useState(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const [newTeam, setNewTeam] = useState({
    departmentId: "",
    name: "",
  });

  const [filterStatus, setFilterStatus] = useState("active"); // active|all|deleted
  const [filterDept, setFilterDept] = useState("all");
  const [search, setSearch] = useState("");

  const [confirmState, setConfirmState] = useState({ open: false, team: null });
  const [confirmLoading, setConfirmLoading] = useState(false);

  async function loadDepartments() {
    const res = await http.get(
      `${BASE_URL}/api/task-management/admin/departments`
    );
    const arr = res.data?.data || [];
    return arr.filter((d) => !d.isDeleted);
  }

  async function loadTeams() {
    setLoading(true);
    setError("");
    try {
      const res = await http.get(
        `${BASE_URL}/api/task-management/admin/teams`
      );
      setTeams(res.data?.data || []);
    } catch (e) {
      console.error(e);
      setError("Không tải được danh sách tổ/nhóm");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const [depts] = await Promise.all([loadDepartments()]);
        setDepartments(depts);
        await loadTeams();
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const filteredTeams = useMemo(() => {
    return (teams || []).filter((t) => {
      const isDeleted = !!t.isDeleted;
      if (filterStatus === "active" && isDeleted) return false;
      if (filterStatus === "deleted" && !isDeleted) return false;
      if (filterDept !== "all" && filterDept !== "" && t.departmentId !== Number(filterDept)) {
        return false;
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (
          !(
            (t.name || "").toLowerCase().includes(q) ||
            (t.code || "").toLowerCase().includes(q)
          )
        ) {
          return false;
        }
      }
      return true;
    });
  }, [teams, filterStatus, filterDept, search]);

  async function handleCreate() {
    if (!newTeam.departmentId || !newTeam.name.trim()) return;
    setSavingGlobal(true);
    setError("");
    setInfo("");
    try {
      const payload = {
        departmentId: Number(newTeam.departmentId),
        name: newTeam.name,
      };
      await http.post(
        `${BASE_URL}/api/task-management/admin/teams`,
        payload
      );
      setNewTeam({ departmentId: "", name: "" });
      setInfo("Thêm tổ/nhóm thành công");
      await loadTeams();
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "Tạo tổ/nhóm thất bại");
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
        departmentId: form.departmentId,
        name: form.name,
        orderIndex: form.orderIndex,
      };
      await http.patch(
        `${BASE_URL}/api/task-management/admin/teams/${id}`,
        payload
      );
      setInfo("Cập nhật tổ/nhóm thành công");
      await loadTeams();
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "Cập nhật tổ/nhóm thất bại");
    } finally {
      setSavingRowId(null);
    }
  }

  function askDelete(team) {
    setConfirmState({ open: true, team });
  }

  async function confirmDelete() {
    if (!confirmState.team) return;
    setConfirmLoading(true);
    setError("");
    setInfo("");
    try {
      await http.delete(
        `${BASE_URL}/api/task-management/admin/teams/${confirmState.team.teamId}`
      );
      setInfo("Xoá (soft) tổ/nhóm thành công");
      setConfirmState({ open: false, team: null });
      await loadTeams();
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "Xoá tổ/nhóm thất bại");
    } finally {
      setConfirmLoading(false);
    }
  }

  async function handleMove(team, direction) {
    setSavingRowId(team.teamId);
    setError("");
    setInfo("");
    try {
      await http.patch(
        `${BASE_URL}/api/task-management/admin/teams/${team.teamId}/reorder`,
        { direction }
      );
      await loadTeams();
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "Sắp xếp tổ/nhóm thất bại");
    } finally {
      setSavingRowId(null);
    }
  }

  const disableCreate =
    savingGlobal || !newTeam.departmentId || !newTeam.name.trim();

  return (
    <>
      <div className="flex h-full flex-col p-3 md:p-4">
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-slate-200 shadow-sm p-3 md:p-5 h-full flex flex-col">
          <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-base font-semibold text-slate-900 md:text-lg">
                Tổ / Nhóm
              </h1>
              <p className="text-[11px] text-slate-500">
                Quản lý danh sách tổ/nhóm theo từng phòng ban.
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

          {/* Form tạo mới */}
          <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <p className="mb-1 text-xs font-semibold text-slate-700">
              Thêm tổ/nhóm mới
            </p>
            <div className="flex flex-col gap-2 md:flex-row">
  {/* Select phòng ban: ngắn lại, bỏ outline, focus border nhẹ */}
  <select
    className="w-full md:w-52 rounded-lg border border-slate-200 px-2 py-1.5 text-xs bg-white
               outline-none focus:outline-none focus:ring-0 focus:border-slate-400"
    value={newTeam.departmentId}
    onChange={(e) =>
      setNewTeam((p) => ({ ...p, departmentId: e.target.value }))
    }
  >
    <option value="">-- Chọn phòng ban --</option>
    {departments.map((d) => (
      <option key={d.departmentId} value={d.departmentId}>
        {d.name}
      </option>
    ))}
  </select>

  {/* Input tên tổ/nhóm: bỏ outline, dùng border nhẹ thay vì emerald */}
  <input
    className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs
               outline-none focus:outline-none focus:ring-0 focus:border-slate-400"
    placeholder="Tên tổ / nhóm"
    value={newTeam.name}
    maxLength={200}
    onChange={(e) =>
      setNewTeam((p) => ({ ...p, name: e.target.value }))
    }
  />

  <button
    className="inline-flex items-center justify-center gap-1 rounded-full bg-emerald-600 px-4 py-1.5 
               text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
    disabled={disableCreate}
    onClick={handleCreate}
  >
    {savingGlobal && <Spinner />}
    <span>Thêm tổ/nhóm</span>
  </button>
</div>
          </div>

          {/* Filter + search */}
          <div className="mb-2 flex flex-col gap-2 text-[11px] text-slate-600 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
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

              <select
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs"
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
              >
                <option value="all">Tất cả phòng ban</option>
                {departments.map((d) => (
                  <option key={d.departmentId} value={d.departmentId}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                className="w-full max-w-xs rounded-full border border-slate-200 px-3 py-1.5 text-xs"
                placeholder="Tìm theo mã / tên tổ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="hidden text-[11px] text-slate-400 sm:inline">
                {filteredTeams.length} tổ/nhóm
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
                    <th className="px-2 py-2 font-semibold">Phòng ban</th>
                    <th className="px-2 py-2 font-semibold">Tên tổ / nhóm</th>
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
                        colSpan={8}
                        className="px-3 py-4 text-center text-xs text-slate-500"
                      >
                        Đang tải dữ liệu...
                      </td>
                    </tr>
                  ) : filteredTeams.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-3 py-4 text-center text-xs text-slate-400"
                      >
                        Không có tổ/nhóm nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredTeams.map((team) => (
                      <TeamRow
                        key={team.teamId}
                        team={team}
                        departments={departments}
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
        </div>
      </div>

      <ConfirmDialog
        open={confirmState.open}
        loading={confirmLoading}
        title="Xoá tổ/nhóm"
        message={
          confirmState.team
            ? `Xoá tổ/nhóm "${confirmState.team.name}".`
            : ""
        }
        onCancel={() => {
          if (!confirmLoading) setConfirmState({ open: false, team: null });
        }}
        onConfirm={confirmDelete}
      />
    </>
  );
}
