import React, { useEffect, useMemo, useState } from "react";
import { FiSearch, FiShield, FiSave, FiRefreshCcw, FiPlus, FiEdit2, FiTrash2, FiX } from "react-icons/fi";
import { BASE_URL } from "~/config";
import { useSelector } from "react-redux";
import { userSelector } from "~/redux/selectors";
import http from "~/api/http";

/* ========== Mini helpers ========== */
const RolePill = ({ value }) => {
  const cls =
    value === "admin"
      ? "bg-slate-100 text-slate-700 ring-slate-200"
      : value === "user"
      ? "bg-indigo-100 text-indigo-700 ring-indigo-200"
      : "bg-white text-slate-500 ring-slate-200";
  return (
    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${cls}`}>
      {value || "—"}
    </span>
  );
};

const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-50" aria-label="Đóng">
            <FiX />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

/* ========== Main component ========== */
function UserModuleAccess() {
  /* ----- LEFT: users ----- */
  const [uQ, setUQ] = useState("");
  const [users, setUsers] = useState([]);
  const [uPage, setUPage] = useState(1);
  const [uTotal, setUTotal] = useState(0);
  const uPageSize = 12;

  /* ----- RIGHT: modules + roles ----- */
  const [modules, setModules] = useState([]);

  const [userId, setUserId] = useState(null);
  // { [moduleId]: "admin" | "user" }
  const [draftAssignments, setDraftAssignments] = useState({});
  const [initialAssignments, setInitialAssignments] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  /* ----- Feature management & user feature grants ----- */
  const [featureModuleId, setFeatureModuleId] = useState(null);

  // quản lý danh mục chức năng (CRUD)
  const [featRows, setFeatRows] = useState([]);
  const [featLoading, setFeatLoading] = useState(false);
  const [featMsg, setFeatMsg] = useState({ type: "", text: "" });

  // modal thêm/sửa chức năng
  const [featModalOpen, setFeatModalOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState(null);
  const [featForm, setFeatForm] = useState({
    code: "",
    name: "",
    description: "",
    defaultForAdmin: false,
    defaultForUser: false,
  });
  const [featSaving, setFeatSaving] = useState(false);

  // phân quyền chức năng cho user
  const [featureRows, setFeatureRows] = useState([]); // [{ featureId, code, name, defaultAllowed, overridden, effectiveAllowed }]
  const [featureDraft, setFeatureDraft] = useState({}); // { [featureId]: boolean }
  const [grantsLoading, setGrantsLoading] = useState(false);
  const [grantsSaving, setGrantsSaving] = useState(false);

  // current user from redux (để khoá nút nếu ko phải admin)
  const tmp = useSelector(userSelector);
  const [user, setUser] = useState({});
  useEffect(() => { setUser(tmp?.login?.currentUser); }, [tmp]);
  const isSuper = user?.userID === 1 || user?.userID === 3;

// modal xác nhận xoá feature
const [confirmDeleteId, setConfirmDeleteId] = useState(null);


  /* ----- Fetch users ----- */
  const fetchUsers = async () => {
    try {
      const res = await http.get(`${BASE_URL}/api/users`, {
        params: { q: uQ, page: uPage, pageSize: uPageSize },
      });
      if (res.data?.success) {
        setUsers(res.data.data || []);
        setUTotal(res.data.pagination?.total || 0);
      }
    } catch (e) {
      setMsg({ type: "error", text: "Không tải được danh sách người dùng." });
    }
  };

  /* ----- Fetch modules ----- */
  const fetchModules = async () => {
    try {
      const res = await http.get(`${BASE_URL}/api/modules`, { params: { page: 1, pageSize: 500 } });
      if (res.data?.success) setModules(res.data.data || []);
    } catch {
      setMsg({ type: "error", text: "Không tải được danh sách modules." });
    }
  };

  /* ----- Fetch assignments (modules) of a user ----- */
  const fetchAssignments = async (uid) => {
    if (!uid) return;
    setLoading(true);
    try {
      const res = await http.get(`${BASE_URL}/api/user-modules/${uid}`);
      if (res.data?.success) {
        const map = {};
        (res.data.data || []).forEach((r) => (map[r.moduleId] = r.role));
        setInitialAssignments(map);
        setDraftAssignments(map);
      } else {
        setInitialAssignments({});
        setDraftAssignments({});
      }
    } catch {
      setMsg({ type: "error", text: "Không tải được phân quyền của người dùng." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [uQ, uPage]);
  useEffect(() => { fetchModules(); }, []);
  useEffect(() => { if (userId) fetchAssignments(userId); }, [userId]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(uTotal / uPageSize)), [uTotal]);

  const toggleAssign = (moduleId) => {
    setDraftAssignments((p) => {
      const cur = p[moduleId] ?? null;
      if (cur === null || cur === undefined) return { ...p, [moduleId]: "user" };
      const { [moduleId]: _, ...rest } = p;
      return rest;
    });
  };

  const setRole = (moduleId, role) => {
    setDraftAssignments((p) => ({ ...p, [moduleId]: role }));
  };

  const hasChanges = useMemo(() => {
    const a = draftAssignments;
    const b = initialAssignments;
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) if ((a[k] || null) !== (b[k] || null)) return true;
    return false;
  }, [draftAssignments, initialAssignments]);

  const resetDraft = () => setDraftAssignments(initialAssignments);

  const saveModuleAssignments = async () => {
    if (!userId) return;
    setSaving(true);
    setMsg({ type: "", text: "" });
    try {
      const payload = Object.entries(draftAssignments)
        .filter(([_, role]) => role === "admin" || role === "user")
        .map(([moduleId, role]) => ({ moduleId: Number(moduleId), role }));
      const res = await http.put(`${BASE_URL}/api/user-modules/${userId}`, { assignments: payload });
      if (res.data?.success) {
        setMsg({ type: "success", text: "✅ Đã lưu phân quyền module." });
        setInitialAssignments(draftAssignments);
      } else {
        setMsg({ type: "error", text: res.data?.message || "❌ Lưu phân quyền thất bại." });
      }
    } catch {
      setMsg({ type: "error", text: "❌ Lỗi kết nối máy chủ." });
    } finally {
      setSaving(false);
    }
  };

  /* ========== CRUD FEATURES OF MODULE ========== */
  const loadModuleFeatures = async () => {
    if (!featureModuleId) { setFeatRows([]); return; }
    setFeatLoading(true);
    setFeatMsg({ type: "", text: "" });
    try {
      const res = await http.get(`${BASE_URL}/api/modules/${featureModuleId}/features`);
      if (res.data?.success) setFeatRows(res.data.data || []);
    } catch {
      setFeatMsg({ type: "error", text: "Không tải được danh sách chức năng." });
    } finally {
      setFeatLoading(false);
    }
  };

  useEffect(() => { loadModuleFeatures(); }, [featureModuleId]);

  const openCreateFeature = () => {
    setEditingFeature(null);
    setFeatForm({ code: "", name: "", description: "", defaultForAdmin: false, defaultForUser: false });
    setFeatModalOpen(true);
  };

  const openEditFeature = (row) => {
    setEditingFeature(row);
    setFeatForm({
      code: row.code || "",
      name: row.name || "",
      description: row.description || "",
      defaultForAdmin: !!row.defaultForAdmin,
      defaultForUser: !!row.defaultForUser,
    });
    setFeatModalOpen(true);
  };

  const saveFeature = async () => {
    if (!featureModuleId) return;
    if (!featForm.code.trim() || !featForm.name.trim()) {
      setFeatMsg({ type: "error", text: "Mã và tên chức năng là bắt buộc." });
      return;
    }
    setFeatSaving(true);
    try {
      if (editingFeature) {
        const res = await http.put(
          `${BASE_URL}/api/modules/${featureModuleId}/features/${editingFeature.featureId}`,
          featForm
        );
        if (res.data?.success) {
          setFeatModalOpen(false);
          await loadModuleFeatures();
        } else {
          setFeatMsg({ type: "error", text: res.data?.message || "Cập nhật chức năng thất bại." });
        }
      } else {
        const res = await http.post(`${BASE_URL}/api/modules/${featureModuleId}/features`, featForm);
        if (res.data?.success) {
          setFeatModalOpen(false);
          await loadModuleFeatures();
        } else {
          setFeatMsg({ type: "error", text: res.data?.message || "Tạo chức năng thất bại." });
        }
      }
    } catch (e) {
      setFeatMsg({ type: "error", text: e?.response?.data?.message || "Lỗi kết nối máy chủ." });
    } finally {
      setFeatSaving(false);
    }
  };

  const deleteFeature = async (featureId) => {
  if (!featureModuleId || !featureId) return;
  try {
    const res = await http.delete(`${BASE_URL}/api/modules/${featureModuleId}/features/${featureId}`);
    if (res.data?.success) {
      setFeatMsg({ type: "success", text: "Đã xoá chức năng." });
      await loadModuleFeatures();
    } else {
      setFeatMsg({ type: "error", text: res.data?.message || "Xoá chức năng thất bại." });
    }
  } catch {
    setFeatMsg({ type: "error", text: "Lỗi kết nối máy chủ." });
  }
};


  /* ========== USER FEATURE GRANTS ========== */
  const loadUserFeatureGrants = async () => {
    if (!userId || !featureModuleId) { setFeatureRows([]); setFeatureDraft({}); return; }
    setGrantsLoading(true);
    try {
      const res = await http.get(`${BASE_URL}/api/user-modules/${userId}/${featureModuleId}/features`);
      if (res.data?.success) {
        const rows = res.data.data || [];
        setFeatureRows(rows);
        const d = {};
        rows.forEach(r => { d[r.featureId] = !!r.effectiveAllowed; });
        setFeatureDraft(d);
      }
    } finally {
      setGrantsLoading(false);
    }
  };

  // khi thay user hoặc module => load grants
  useEffect(() => { loadUserFeatureGrants(); }, [userId, featureModuleId]);

  const changedFeatures = useMemo(() => {
    return featureRows
      .map(r => ({ featureId: r.featureId, want: !!featureDraft[r.featureId], def: !!r.defaultAllowed }))
      .filter(x => x.want !== x.def)
      .map(x => ({ featureId: x.featureId, isAllowed: x.want }));
  }, [featureRows, featureDraft]);

  const saveUserFeatureGrants = async () => {
    if (!userId || !featureModuleId) return;
    setGrantsSaving(true);
    try {
      const res = await http.put(`${BASE_URL}/api/user-modules/${userId}/${featureModuleId}/features`, {
        grants: changedFeatures
      });
      if (res.data?.success) {
        setMsg({ type:'success', text:'✅ Đã lưu quyền chức năng.' });
        await loadUserFeatureGrants();
      } else {
        setMsg({ type:'error', text: res.data?.message || '❌ Lưu thất bại.' });
      }
    } catch {
      setMsg({ type:'error', text:'❌ Lỗi kết nối máy chủ.' });
    } finally {
      setGrantsSaving(false);
    }
  };

  /* ----- Render ----- */
  return (
    <div className="min-h-[70vh] grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
      {/* LEFT: Users */}
      <div className="rounded-2xl bg-white/70 backdrop-blur ring-1 ring-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">Chọn người dùng</h2>
          <p className="text-xs text-slate-500">Tìm và chọn để gán quyền</p>
          <div className="mt-3 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={uQ}
              onChange={(e) => { setUQ(e.target.value); setUPage(1); }}
              placeholder="Tìm theo tên/email…"
              className="w-full rounded-xl bg-white/80 pl-9 pr-3 py-2 text-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>

        <div className="max-h-[60vh] overflow-auto divide-y divide-slate-100">
          {users.length === 0 ? (
            <div className="p-4 text-sm text-slate-500">Không có người dùng</div>
          ) : (
            users.map((u) => {
              const active = userId === u.userId;
              return (
                <button
                  key={u.userId}
                  onClick={() => setUserId(u.userId)}
                  className={[
                    "w-full text-left px-4 py-3 hover:bg-slate-50",
                    active ? "bg-indigo-50/70" : "",
                  ].join(" ")}
                >
                  <div className="font-medium text-slate-800">{u.fullName || u.userName}</div>
                  <div className="text-xs text-slate-500">{u.email || "—"}</div>
                </button>
              );
            })
          )}
        </div>

        <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-600">Trang {uPage}/{Math.max(1, Math.ceil(uTotal / uPageSize))} • {uTotal} người</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setUPage((p) => Math.max(1, p - 1))}
              disabled={uPage <= 1}
              className="rounded-lg bg-white px-3 py-1.5 text-sm ring-1 ring-slate-200 disabled:opacity-50"
            >
              Trước
            </button>
            <button
              onClick={() => setUPage((p) => Math.min(Math.max(1, Math.ceil(uTotal / uPageSize)), p + 1))}
              disabled={uPage >= Math.max(1, Math.ceil(uTotal / uPageSize))}
              className="rounded-lg bg-white px-3 py-1.5 text-sm ring-1 ring-slate-200 disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT: Modules + roles + features */}
      <div className="space-y-6">
        {/* Card 1: Phân quyền module */}
        <div className="rounded-2xl bg-white/70 backdrop-blur ring-1 ring-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Phân quyền module</h2>
              <p className="text-xs text-slate-500">
                {userId ? "Tick module để cấp quyền, chọn vai trò admin/user." : "Hãy chọn một người dùng bên trái."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={resetDraft}
                disabled={!hasChanges || !isSuper}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-slate-200 disabled:opacity-50"
              >
                <FiRefreshCcw /> Hoàn tác
              </button>
              <button
                onClick={saveModuleAssignments}
                disabled={!userId || !hasChanges || saving || !isSuper}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                <FiSave /> {saving ? "Đang lưu…" : "Lưu"}
              </button>
            </div>
          </div>

          <div className="p-5">
            {!userId ? (
              <div className="grid place-items-center h-48 text-slate-500">Chưa chọn người dùng</div>
            ) : loading ? (
              <div className="grid place-items-center h-48 text-slate-500">Đang tải phân quyền…</div>
            ) : modules.length === 0 ? (
              <div className="grid place-items-center h-48 text-slate-500">Chưa có module nào</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {modules.map((m) => {
                  const assigned = draftAssignments[m.moduleId] === "admin" || draftAssignments[m.moduleId] === "user";
                  const role = draftAssignments[m.moduleId] || null;
                  return (
                    <div key={m.moduleId} className="rounded-xl bg-white ring-1 ring-slate-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <FiShield className="text-indigo-600" />
                            <h3 className="font-semibold text-slate-900 truncate">{m.name}</h3>
                          </div>
                          <p className="mt-1 text-xs text-slate-500 line-clamp-2">{m.description || "—"}</p>
                        </div>
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={assigned}
                            onChange={() => isSuper && toggleAssign(m.moduleId)}
                            className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            disabled={!isSuper}
                          />
                          <span className="text-xs text-slate-600">Cho phép</span>
                        </label>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            disabled={!assigned || !isSuper}
                            onClick={() => setRole(m.moduleId, "user")}
                            className={`rounded-lg px-3 py-1.5 text-xs ring-1 ${
                              role === "user"
                                ? "bg-indigo-100 text-indigo-700 ring-indigo-200"
                                : "bg-white text-slate-600 ring-slate-200"
                            } ${!assigned || !isSuper ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            user
                          </button>
                          <button
                            disabled={!assigned || !isSuper}
                            onClick={() => setRole(m.moduleId, "admin")}
                            className={`rounded-lg px-3 py-1.5 text-xs ring-1 ${
                              role === "admin"
                                ? "bg-slate-100 text-slate-700 ring-slate-200"
                                : "bg-white text-slate-600 ring-slate-200"
                            } ${!assigned || !isSuper ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            admin
                          </button>
                        </div>
                        <RolePill value={role} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {msg.text ? (
              <div
                className={`mt-4 rounded-xl px-3 py-2 text-sm ${
                  msg.type === "success"
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                    : "bg-red-50 text-red-700 ring-1 ring-red-200"
                }`}
              >
                {msg.text}
              </div>
            ) : null}
          </div>
        </div>

        {/* Card 2: Chức năng của module & quyền theo user */}
        <div className="rounded-2xl bg-white/70 backdrop-blur ring-1 ring-slate-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-200 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Chức năng & quyền chức năng</h3>
              <p className="text-xs text-slate-500">Chọn module để quản lý chức năng và phân quyền theo user.</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                value={featureModuleId || ""}
                onChange={(e) => setFeatureModuleId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">— Chọn module —</option>
                {modules.map((m) => (
                  <option key={m.moduleId} value={m.moduleId}>{m.name}</option>
                ))}
              </select>
              <button
                onClick={saveUserFeatureGrants}
                disabled={!userId || !featureModuleId || grantsSaving || !isSuper}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                <FiSave /> {grantsSaving ? "Đang lưu…" : "Lưu quyền chức năng"}
              </button>
            </div>
          </div>

          {/* Body */}
          {!featureModuleId ? (
            <div className="p-5 grid place-items-center h-40 text-slate-500">Hãy chọn một module.</div>
          ) : (
            <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: CRUD Feature List */}
              <div className="rounded-xl bg-white ring-1 ring-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900">Chức năng trong module</div>
                    <div className="text-xs text-slate-500">Tạo/sửa/xoá các chức năng.</div>
                  </div>
                  <button
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white disabled:opacity-50"
                    onClick={openCreateFeature}
                    disabled={!isSuper}
                  >
                    <FiPlus /> Thêm chức năng
                  </button>
                </div>

                <div className="overflow-x-auto">
                  {featLoading ? (
                    <div className="p-4 text-sm text-slate-500">Đang tải…</div>
                  ) : (
                    <table className="min-w-[720px] w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr className="text-[12px] uppercase tracking-wide text-slate-600">
                          <th className="px-3 py-2 text-left">Code</th>
                          <th className="px-3 py-2 text-left">Tên</th>
                          <th className="px-3 py-2 text-left">Mặc định (admin)</th>
                          <th className="px-3 py-2 text-left">Mặc định (user)</th>
                          <th className="px-3 py-2 text-left">Mô tả</th>
                          <th className="px-3 py-2 text-left">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {featRows.length === 0 ? (
                          <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-500">Chưa có chức năng</td></tr>
                        ) : featRows.map((f, idx) => (
                          <tr key={f.featureId} className={`${idx % 2 ? "bg-slate-50/70" : "bg-white"} border-b border-slate-200`}>
                            <td className="px-3 py-2">{f.code}</td>
                            <td className="px-3 py-2 font-medium">{f.name}</td>
                            <td className="px-3 py-2">{f.defaultForAdmin ? "Được" : "Không"}</td>
                            <td className="px-3 py-2">{f.defaultForUser ? "Được" : "Không"}</td>
                            <td className="px-3 py-2">{f.description || "—"}</td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => openEditFeature(f)}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm ring-1 ring-slate-200 hover:bg-slate-50"
                                  disabled={!isSuper}
                                >
                                  <FiEdit2 /> Sửa
                                </button>
                                <button
  onClick={() => setConfirmDeleteId(f.featureId)}
  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm text-red-600 ring-1 ring-red-200 hover:bg-red-50"
  disabled={!isSuper}
>
  <FiTrash2 /> Xoá
</button>

                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {featMsg.text ? (
                  <div className={`m-4 rounded-xl px-3 py-2 text-sm ${featMsg.type === "success" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}>
                    {featMsg.text}
                  </div>
                ) : null}
              </div>

              {/* Right: User feature grants */}
              <div className="rounded-xl bg-white ring-1 ring-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200">
                  <div className="font-semibold text-slate-900">Phân quyền chức năng cho user</div>
                  <div className="text-xs text-slate-500">Hiệu lực = override (nếu có) • nếu không thì lấy mặc định theo role.</div>
                </div>

                <div className="overflow-x-auto">
                  {!userId ? (
                    <div className="p-4 text-sm text-slate-500">Chưa chọn người dùng.</div>
                  ) : grantsLoading ? (
                    <div className="p-4 text-sm text-slate-500">Đang tải…</div>
                  ) : featureRows.length === 0 ? (
                    <div className="p-4 text-sm text-slate-500">Module chưa có chức năng nào.</div>
                  ) : (
                    <table className="min-w-[720px] w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr className="text-[12px] uppercase tracking-wide text-slate-600">
                          <th className="px-3 py-2 text-left">Mã chức năng</th>
                          <th className="px-3 py-2 text-left">Tên</th>
                          <th className="px-3 py-2 text-left">Mặc định</th>
                          <th className="px-3 py-2 text-left">Hiệu lực</th>
                          <th className="px-3 py-2 text-left">Ghi đè</th>
                          <th className="px-3 py-2 text-left">Cho phép?</th>
                        </tr>
                      </thead>
                      <tbody>
                        {featureRows.map((r, idx) => {
                          const zebra = idx % 2 === 0 ? "bg-white" : "bg-slate-50/70";
                          return (
                            <tr key={r.featureId} className={`${zebra} border-b border-slate-200`}>
                              <td className="px-3 py-2">{r.code}</td>
                              <td className="px-3 py-2">{r.name}</td>
                              <td className="px-3 py-2">{r.defaultAllowed ? "Được" : "Không"}</td>
                              <td className="px-3 py-2 font-medium">{r.effectiveAllowed ? "Được" : "Không"}</td>
                              <td className="px-3 py-2">{r.overridden === null ? "—" : (r.overridden ? "Được" : "Không")}</td>
                              <td className="px-3 py-2">
                                <input
                                  type="checkbox"
                                  className="h-5 w-5 accent-indigo-600"
                                  checked={!!featureDraft[r.featureId]}
                                  onChange={(e) => setFeatureDraft(p => ({ ...p, [r.featureId]: e.target.checked }))}
                                  disabled={!isSuper}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-end">
                  <button
                    onClick={saveUserFeatureGrants}
                    disabled={!userId || !featureModuleId || grantsSaving || !isSuper}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    <FiSave /> {grantsSaving ? "Đang lưu…" : "Lưu quyền chức năng"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Thêm/Sửa chức năng */}
      <Modal
        open={featModalOpen}
        onClose={() => setFeatModalOpen(false)}
        title={editingFeature ? "Cập nhật chức năng" : "Thêm chức năng"}
      >
        <div className="grid gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Mã chức năng <span className="text-red-500">*</span></label>
            <input
              value={featForm.code}
              onChange={(e) => setFeatForm(p => ({ ...p, code: e.target.value }))}
              className="mt-1 w-full rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="vd: export, view, create, update…"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Tên chức năng <span className="text-red-500">*</span></label>
            <input
              value={featForm.name}
              onChange={(e) => setFeatForm(p => ({ ...p, name: e.target.value }))}
              className="mt-1 w-full rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="vd: Xuất Excel"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Mô tả</label>
            <textarea
              value={featForm.description}
              onChange={(e) => setFeatForm(p => ({ ...p, description: e.target.value }))}
              className="mt-1 w-full rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              rows={3}
              placeholder="Mô tả ngắn"
            />
          </div>

          <div className="flex items-center gap-6">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                className="h-5 w-5 accent-indigo-600"
                checked={!!featForm.defaultForAdmin}
                onChange={(e) => setFeatForm(p => ({ ...p, defaultForAdmin: e.target.checked }))}
              />
              <span className="text-sm">Mặc định (admin) = Được</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                className="h-5 w-5 accent-indigo-600"
                checked={!!featForm.defaultForUser}
                onChange={(e) => setFeatForm(p => ({ ...p, defaultForUser: e.target.checked }))}
              />
              <span className="text-sm">Mặc định (user) = Được</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button onClick={() => setFeatModalOpen(false)} className="rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200 hover:bg-slate-50">
              Huỷ
            </button>
            <button
              onClick={saveFeature}
              disabled={featSaving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {featSaving ? "Đang lưu…" : (editingFeature ? "Cập nhật" : "Thêm")}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
  open={!!confirmDeleteId}
  onClose={() => setConfirmDeleteId(null)}
  title="Xác nhận xoá chức năng"
>
  <p className="text-sm text-slate-700">
    Bạn chắc chắn muốn xoá chức năng này? Hành động không thể hoàn tác.
  </p>

  <div className="mt-4 flex items-center justify-end gap-2">
    <button
      onClick={() => setConfirmDeleteId(null)}
      className="rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200 hover:bg-slate-50"
    >
      Huỷ
    </button>
    <button
      onClick={async () => {
        const id = confirmDeleteId;
        setConfirmDeleteId(null);
        await deleteFeature(id);
      }}
      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
    >
      Xoá
    </button>
  </div>
</Modal>

    </div>
  );
}

export default UserModuleAccess;
