import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FiSearch, FiShield, FiSave, FiRefreshCcw } from "react-icons/fi";
import { BASE_URL } from "~/config";
import { useSelector } from "react-redux";
import { userSelector } from "~/redux/selectors";
import http from '~/api/http';

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

function UserModuleAccess() {
  // users
  const [uQ, setUQ] = useState("");
  const [users, setUsers] = useState([]);
  const [uPage, setUPage] = useState(1);
  const [uTotal, setUTotal] = useState(0);
  const uPageSize = 12;

  // modules
  const [modules, setModules] = useState([]);

  // selected user & assignments
  const [userId, setUserId] = useState(null);
  // draftAssignments: { [moduleId]: "admin" | "user" | null }
  const [draftAssignments, setDraftAssignments] = useState({});
  const [initialAssignments, setInitialAssignments] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

    const tmp = useSelector(userSelector);
    const [user, setUser] = useState({});
  
    useEffect(() => {
      setUser(tmp?.login?.currentUser);
    }, [tmp]);

  // fetch users
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

  // fetch modules
  const fetchModules = async () => {
    try {
      const res = await http.get(`${BASE_URL}/api/modules`, { params: { page: 1, pageSize: 500 } });
      if (res.data?.success) setModules(res.data.data || []);
    } catch {
      setMsg({ type: "error", text: "Không tải được danh sách modules." });
    }
  };

  // fetch assignments of chosen user
  const fetchAssignments = async (uid) => {
    if (!uid) return;
    setLoading(true);
    try {
      const res = await http.get(`${BASE_URL}/api/user-modules/${uid}`);
      if (res.data?.success) {
        const map = {};
        (res.data.data || []).forEach((r) => (map[r.moduleId] = r.role)); // "admin" | "user"
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
      // nếu đang null -> mặc định gán "user"; nếu có -> bỏ chọn (null)
      if (cur === null || cur === undefined) return { ...p, [moduleId]: "user" };
      const next = null;
      const { [moduleId]: _, ...rest } = p;
      return next === null ? rest : { ...p, [moduleId]: next };
    });
  };

  const setRole = (moduleId, role) => {
    setDraftAssignments((p) => ({ ...p, [moduleId]: role }));
  };

  const hasChanges = useMemo(() => {
    const a = draftAssignments;
    const b = initialAssignments;
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) {
      if ((a[k] || null) !== (b[k] || null)) return true;
    }
    return false;
  }, [draftAssignments, initialAssignments]);

  const resetDraft = () => setDraftAssignments(initialAssignments);

  const save = async () => {
    if (!userId) return;
    setSaving(true);
    setMsg({ type: "", text: "" });
    try {
      // chuẩn payload: [{ moduleId, role }] — chỉ gửi những module có role (không gửi null)
      const payload = Object.entries(draftAssignments)
        .filter(([_, role]) => role === "admin" || role === "user")
        .map(([moduleId, role]) => ({ moduleId: Number(moduleId), role }));

      const res = await http.put(`${BASE_URL}/api/user-modules/${userId}`, { assignments: payload });
      if (res.data?.success) {
        setMsg({ type: "success", text: "✅ Đã lưu phân quyền." });
        setInitialAssignments(draftAssignments);
      } else {
        setMsg({ type: "error", text: res.data?.message || "❌ Lưu phân quyền thất bại." });
      }
    } catch (e) {
      setMsg({ type: "error", text: "❌ Lỗi kết nối máy chủ." });
    } finally {
      setSaving(false);
    }
  };

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
          <span className="text-xs text-slate-600">Trang {uPage}/{totalPages} • {uTotal} người</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setUPage((p) => Math.max(1, p - 1))}
              disabled={uPage <= 1}
              className="rounded-lg bg-white px-3 py-1.5 text-sm ring-1 ring-slate-200 disabled:opacity-50"
            >
              Trước
            </button>
            <button
              onClick={() => setUPage((p) => Math.min(totalPages, p + 1))}
              disabled={uPage >= totalPages}
              className="rounded-lg bg-white px-3 py-1.5 text-sm ring-1 ring-slate-200 disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT: Modules + roles */}
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
              disabled={!hasChanges || !(user?.userID === 1 || user?.userID === 3)}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-slate-200 disabled:opacity-50"
            >
              <FiRefreshCcw /> Hoàn tác
            </button>
            <button
              onClick={save}
              disabled={!userId || !hasChanges || saving || !(user?.userID === 1 || user?.userID === 3)}
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
                          onChange={() => toggleAssign(m.moduleId)}
                          className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-xs text-slate-600">Cho phép</span>
                      </label>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          disabled={!assigned}
                          onClick={() => setRole(m.moduleId, "user")}
                          className={`rounded-lg px-3 py-1.5 text-xs ring-1 ${
                            role === "user"
                              ? "bg-indigo-100 text-indigo-700 ring-indigo-200"
                              : "bg-white text-slate-600 ring-slate-200"
                          } ${!assigned ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          user
                        </button>
                        <button
                          disabled={!assigned}
                          onClick={() => setRole(m.moduleId, "admin")}
                          className={`rounded-lg px-3 py-1.5 text-xs ring-1 ${
                            role === "admin"
                              ? "bg-slate-100 text-slate-700 ring-slate-200"
                              : "bg-white text-slate-600 ring-slate-200"
                          } ${!assigned ? "opacity-50 cursor-not-allowed" : ""}`}
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
            <div className={`mt-4 rounded-xl px-3 py-2 text-sm ${msg.type === "success" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}>
              {msg.text}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default UserModuleAccess;
