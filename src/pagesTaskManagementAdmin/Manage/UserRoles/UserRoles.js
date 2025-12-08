// src/pageTaskManagement/Admin/AdminCompanyUserRolesPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import http from "~/api/http";
import { BASE_URL } from "~/config";

function Spinner() {
  return (
    <span className="inline-block h-3 w-3 animate-spin rounded-full border-[2px] border-white/40 border-t-white" />
  );
}

function RoleChips({ roles }) {
  if (!roles || roles.length === 0)
    return <span className="text-[11px] text-slate-400">Chưa gán</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {roles.map((r) => (
        <span
          key={r.roleId || r.userRoleId || r.code}
          className="inline-flex rounded-full bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700 border border-slate-200"
        >
          {r.name || r.roleName}
        </span>
      ))}
    </div>
  );
}

/**
 * Card gán phòng ban / tổ / role cho từng user
 */
function UserAssignCard({
  user,
  departments,
  teams,
  roles,
  onSave,
  savingUserId,
}) {
  const [editing, setEditing] = useState(false);
  const [departmentId, setDepartmentId] = useState(user.departmentId || "");
  const [teamId, setTeamId] = useState(user.teamId || "");
  const [roleIds, setRoleIds] = useState(user.roleIds || []);

  useEffect(() => {
    setDepartmentId(user.departmentId || "");
    setTeamId(user.teamId || "");
    setRoleIds(user.roleIds || []);
  }, [user]);

  const saving = savingUserId === user.userId;

  const teamsForDept = useMemo(() => {
    if (!departmentId) return [];
    return teams.filter((t) => t.departmentId === Number(departmentId));
  }, [teams, departmentId]);

  const toggleRole = (rid) => {
    setRoleIds((prev) =>
      prev.includes(rid) ? prev.filter((x) => x !== rid) : [...prev, rid]
    );
  };

  const handleSave = async () => {
    await onSave(user.userId, {
      departmentId: departmentId || null,
      teamId: teamId || null,
      roleIds,
    });
    setEditing(false);
  };

  const handleCancel = () => {
    setEditing(false);
    setDepartmentId(user.departmentId || "");
    setTeamId(user.teamId || "");
    setRoleIds(user.roleIds || []);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-3">
      {/* Header user info */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-slate-900">
            {user.fullName || "(Chưa có tên)"}
          </div>
          <div className="text-[11px] text-slate-500">@{user.username}</div>
          {user.email && (
            <div className="text-[11px] text-slate-400">{user.email}</div>
          )}
        </div>
        <button
          className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] text-sky-700 hover:bg-sky-100"
          onClick={() => setEditing((v) => !v)}
          disabled={saving}
        >
          {editing ? "Hủy" : "Sửa"}
        </button>
      </div>

      {/* View mode */}
      {!editing && (
        <div className="space-y-2 text-[11px] text-slate-700">
          <div>
            <span className="font-medium text-slate-700">Phòng ban:</span>{" "}
            {user.departmentName ? (
              <span>{user.departmentName}</span>
            ) : (
              <span className="text-slate-400">Chưa gán</span>
            )}
          </div>
          <div>
            <span className="font-medium text-slate-700">Tổ / Nhóm:</span>{" "}
            {user.teamName ? (
              <span>{user.teamName}</span>
            ) : (
              <span className="text-slate-400">Chưa gán</span>
            )}
          </div>
          <div>
            <span className="font-medium text-slate-700">Vai trò:</span>
            <div className="mt-1">
              <RoleChips roles={user.roles} />
            </div>
          </div>
        </div>
      )}

      {/* Edit mode */}
      {editing && (
        <div className="space-y-3 text-[11px]">
          {/* Phòng ban & tổ */}
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-700">
              Phòng ban
            </label>
            <select
              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] outline-none focus:outline-none focus:ring-0 focus:border-emerald-500"
              value={departmentId}
              onChange={(e) => {
                const val = e.target.value;
                setDepartmentId(val);
                setTeamId(""); // reset tổ khi đổi phòng
              }}
              disabled={saving}
            >
              <option value="">-- Không gán phòng --</option>
              {departments.map((d) => (
                <option key={d.departmentId} value={d.departmentId}>
                  {d.name}
                </option>
              ))}
            </select>

            <label className="mt-2 block text-[11px] font-medium text-slate-700">
              Tổ / Nhóm
            </label>
            <select
              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] outline-none focus:outline-none focus:ring-0 focus:border-emerald-500"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              disabled={saving || !departmentId}
            >
              <option value="">
                {departmentId ? "-- Chọn tổ/nhóm --" : "Chọn phòng ban trước"}
              </option>
              {teamsForDept.map((t) => (
                <option key={t.teamId} value={t.teamId}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Roles */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium text-slate-700">
                Vai trò trong công ty
              </label>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
              {roles.map((r) => (
                <label
                  key={r.roleId}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px]"
                >
                  <input
                    type="checkbox"
                    className="h-3 w-3"
                    checked={roleIds.includes(r.roleId)}
                    onChange={() => toggleRole(r.roleId)}
                    disabled={saving}
                  />
                  <span>{r.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              className="rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-700 hover:bg-slate-200"
              onClick={handleCancel}
              disabled={saving}
            >
              Hủy
            </button>
            <button
              className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-4 py-1 text-[11px] font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
              onClick={handleSave}
              disabled={saving}
            >
              {saving && <Spinner />}
              <span>Lưu</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminCompanyUserRolesPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);

  const [loading, setLoading] = useState(false);
  const [savingUserId, setSavingUserId] = useState(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const [filterDeptId, setFilterDeptId] = useState("");
  const [filterTeamId, setFilterTeamId] = useState("");
  const [search, setSearch] = useState("");

  // Phân trang
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12); // 12 card / trang
  const [total, setTotal] = useState(0);

  async function loadMetaAndUsers(targetPage = 1) {
    setLoading(true);
    setError("");
    try {
      const [metaRes, usersRes] = await Promise.all([
        http.get(`${BASE_URL}/api/task-management/admin/company/meta`),
        http.get(`${BASE_URL}/api/task-management/admin/company/users`, {
          params: { page: targetPage, pageSize },
        }),
      ]);

      setRoles(metaRes.data?.data?.roles || []);
      setDepartments(metaRes.data?.data?.departments || []);
      setTeams(metaRes.data?.data?.teams || []);

      const usersData = usersRes.data?.data || [];
      const pg = usersRes.data?.pagination;

      setUsers(usersData);
      if (pg) {
        setPage(pg.page);
        setTotal(pg.total || 0);
      } else {
        // fallback nếu API chưa trả pagination
        setPage(targetPage);
        setTotal(usersData.length);
      }
    } catch (e) {
      console.error(e);
      setError("Không tải được dữ liệu gán vai trò");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMetaAndUsers(1);
  }, []);

  const filteredTeams = useMemo(() => {
    if (!filterDeptId) return teams;
    return teams.filter((t) => t.departmentId === Number(filterDeptId));
  }, [teams, filterDeptId]);

  const filteredUsers = useMemo(() => {
    return (users || []).filter((u) => {
      if (filterDeptId && u.departmentId !== Number(filterDeptId)) return false;
      if (filterTeamId && u.teamId !== Number(filterTeamId)) return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const joinedRoles = (u.roles || [])
          .map((r) => r.roleName || r.name)
          .join(" ")
          .toLowerCase();
        if (
          !(
            (u.fullName || "").toLowerCase().includes(q) ||
            (u.username || "").toLowerCase().includes(q) ||
            (u.email || "").toLowerCase().includes(q) ||
            joinedRoles.includes(q)
          )
        ) {
          return false;
        }
      }
      return true;
    });
  }, [users, filterDeptId, filterTeamId, search]);

  const totalPages = total === 0 ? 0 : Math.max(1, Math.ceil(total / pageSize));
  const startIndex = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex =
    total === 0 ? 0 : (page - 1) * pageSize + filteredUsers.length;

  async function handleSaveUser(userId, payload) {
    setSavingUserId(userId);
    setError("");
    setInfo("");
    try {
      await http.patch(
        `${BASE_URL}/api/task-management/admin/company/users/${userId}`,
        payload
      );
      setInfo("Cập nhật vai trò / phòng ban thành công");
      await loadMetaAndUsers(page); // reload đúng page hiện tại
    } catch (e) {
      console.error(e);
      setError(
        e?.response?.data?.message ||
          "Cập nhật vai trò / phòng ban thất bại"
      );
    } finally {
      setSavingUserId(null);
    }
  }

  return (
    <div className="flex h-full flex-col p-3 md:p-4">
      <div className="bg-white/80 backdrop-blur rounded-2xl border border-slate-200 shadow-sm p-3 md:p-5 h-full flex flex-col">
        {/* Header */}
        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-base font-semibold text-slate-900 md:text-lg">
              Gán vai trò & phòng ban
            </h1>
            <p className="text-[11px] text-slate-500">
              Gán role công ty, phòng ban, tổ/nhóm cho các user có quyền module
              <span className="font-mono font-semibold text-emerald-700">
                {" "}
                qlcongviec
              </span>
              .
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

        {/* Filters */}
        <div className="mb-3 grid grid-cols-1 gap-2 text-[11px] text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-slate-500">Lọc theo phòng</span>
            <select
              className="w-full rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:outline-none focus:ring-0 focus:border-emerald-500"
              value={filterDeptId}
              onChange={(e) => {
                setFilterDeptId(e.target.value);
                setFilterTeamId("");
              }}
            >
              <option value="">Tất cả phòng ban</option>
              {departments.map((d) => (
                <option key={d.departmentId} value={d.departmentId}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-slate-500">Lọc theo tổ/nhóm</span>
            <select
              className="w-full rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:outline-none focus:ring-0 focus:border-emerald-500"
              value={filterTeamId}
              onChange={(e) => setFilterTeamId(e.target.value)}
            >
              <option value="">Tất cả tổ/nhóm</option>
              {filteredTeams.map((t) => (
                <option key={t.teamId} value={t.teamId}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-2">
            <span className="text-[11px] text-slate-500">Tìm kiếm</span>
            <input
              className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs outline-none focus:outline-none focus:ring-0 focus:border-emerald-500"
              placeholder="Tìm theo tên, username, email hoặc role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Summary + pagination */}
        <div className="mb-2 flex flex-col gap-2 text-[11px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Hiển thị{" "}
            <span className="font-semibold">
              {startIndex}-{endIndex}
            </span>{" "}
            / {total} người dùng (module{" "}
            <span className="font-mono">qlcongviec</span>)
          </span>

          <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-1 py-0.5">
            <button
              className="rounded-full px-2 py-1 text-[11px] disabled:opacity-40 hover:bg-white"
              onClick={() => page > 1 && loadMetaAndUsers(page - 1)}
              disabled={page <= 1 || loading || totalPages === 0}
            >
              Trước
            </button>
            <span className="px-2">
              Trang{" "}
              <span className="font-semibold">
                {totalPages === 0 ? 0 : page}/{totalPages}
              </span>
            </span>
            <button
              className="rounded-full px-2 py-1 text-[11px] disabled:opacity-40 hover:bg-white"
              onClick={() =>
                page < totalPages && loadMetaAndUsers(page + 1)
              }
              disabled={page >= totalPages || loading || totalPages === 0}
            >
              Sau
            </button>
          </div>
        </div>

        {/* List cards */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex h-full items-center justify-center text-xs text-slate-500">
              Đang tải dữ liệu...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">
              Không có người dùng phù hợp.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredUsers.map((u) => (
                <UserAssignCard
                  key={u.userId}
                  user={u}
                  departments={departments}
                  teams={teams}
                  roles={roles}
                  savingUserId={savingUserId}
                  onSave={handleSaveUser}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
