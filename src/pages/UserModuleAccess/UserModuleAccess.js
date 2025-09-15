import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch,
  FiShield,
  FiSave,
  FiRefreshCcw,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiUser,
  FiChevronLeft,
  FiChevronRight,
  FiSettings,
  FiFilter,
  FiMenu,
  FiHelpCircle,
  FiCheckCircle,
  FiAlertTriangle,
} from "react-icons/fi";
import http from "~/api/http";
import { useDispatch, useSelector } from "react-redux";
import { reloadPermissions } from "~/redux/slices/authSlice";
import { userSelector } from "~/redux/selectors";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

/* ========================== Utilities ========================== */
const cn = (...xs) => xs.filter(Boolean).join(" ");

const useDebouncedValue = (value, delay = 350) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
};

/* ========================== Primitives ========================== */
const Button = ({ as:Comp = "button", variant = "default", size = "md", className, children, ...rest }) => {
  const base = "inline-flex items-center gap-2 rounded-xl font-medium transition btn-press ring-focus disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    default: "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900/60 dark:text-slate-200 dark:ring-white/10 dark:hover:bg-slate-900/70",
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500",
    subtle: "bg-transparent text-slate-600 hover:bg-slate-50 ring-1 ring-transparent dark:text-slate-300 dark:hover:bg-slate-900/60",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900/60",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2 text-sm", lg: "px-5 py-3" };
  return (
    <Comp className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {children}
    </Comp>
  );
};

const SectionCard = ({ title, subtitle, right, children, className, id }) => (
  <div
    id={id}
    className={cn(
      "card glass elevate overflow-hidden",
      "ring-1 ring-slate-200/70 dark:ring-white/10",
      className
    )}
  >
    {(title || right) && (
      <div className="px-4 sm:px-5 py-3 border-b border-slate-200/70 dark:border-white/10
                      flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between
                      sticky top-0 bg-white/75 dark:bg-slate-900/50 backdrop-blur z-10">
        <div>
          {title ? <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2> : null}
          {subtitle ? <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
        </div>
        {right}
      </div>
    )}
    <div className="p-4 sm:p-5">{children}</div>
  </div>
);

const Modal = ({ open, onClose, title, children }) => (
  <AnimatePresence>
    {open ? (
      <motion.div className="fixed inset-0 z-[60] grid place-items-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <motion.div
          initial={{ y: 16, scale: 0.98, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          exit={{ y: 16, scale: 0.98, opacity: 0 }}
          transition={{ type: "spring", damping: 22, stiffness: 220 }}
          className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 shadow-xl ring-1 ring-slate-200 dark:ring-white/10 overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-white/10">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
            <Button variant="subtle" size="sm" onClick={onClose} aria-label="Đóng"><FiX /></Button>
          </div>
          <div className="p-5">{children}</div>
        </motion.div>
      </motion.div>
    ) : null}
  </AnimatePresence>
);

const Badge = ({ tone = "slate", children }) => {
  const theme =
    tone === "indigo"
      ? "bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-200 dark:ring-indigo-900/40"
      : tone === "emerald"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:ring-emerald-900/40"
      : tone === "red"
      ? "bg-red-50 text-red-700 ring-red-200 dark:bg-red-900/30 dark:text-red-200 dark:ring-red-900/40"
      : "bg-slate-50 text-slate-700 ring-slate-200 dark:bg-slate-900/40 dark:text-slate-200 dark:ring-white/10";
  return <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs ring-1", theme)}>{children}</span>;
};

const SkeletonLine = ({ w = "w-full" }) => <div className={cn("animate-pulse rounded bg-slate-200 dark:bg-slate-700 h-3", w)} />;

/* ========================== Main ========================== */
export default function UserModuleAccessModern() {
  const dispatch = useDispatch();
  const currentUser = useSelector((s) => userSelector(s)?.login?.currentUser);
  const isSuper = currentUser?.userID === 1 || currentUser?.userID === 3;

  /* ----- Users (left) ----- */
  const [uQ, setUQ] = useState("");
  const uQdebounced = useDebouncedValue(uQ, 400);
  const [users, setUsers] = useState([]);
  const [uPage, setUPage] = useState(1);
  const [uTotal, setUTotal] = useState(0);
  const [uLoading, setULoading] = useState(false);
  const [usersOpen, setUsersOpen] = useState(false); // mobile drawer
  const uPageSize = 12;

  /* ----- Modules & assignments (right) ----- */
  const [modules, setModules] = useState([]);
  const [modLoading, setModLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [draftAssignments, setDraftAssignments] = useState({}); // { [moduleId]: role | undefined }
  const [initialAssignments, setInitialAssignments] = useState({});
  const [saving, setSaving] = useState(false);
  const [loadingAssign, setLoadingAssign] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  /* ----- Features & Grants ----- */
  const [featureModuleId, setFeatureModuleId] = useState(null);
  const [featRows, setFeatRows] = useState([]);
  const [featLoading, setFeatLoading] = useState(false);
  const [featMsg, setFeatMsg] = useState({ type: "", text: "" });
  const [featModalOpen, setFeatModalOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState(null);
  const [featSaving, setFeatSaving] = useState(false);
  const [featForm, setFeatForm] = useState({ code: "", name: "", description: "", defaultForAdmin: false, defaultForUser: false });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // User feature grants
  const [featureRows, setFeatureRows] = useState([]);
  const [featureDraft, setFeatureDraft] = useState({});
  const [grantsLoading, setGrantsLoading] = useState(false);
  const [grantsSaving, setGrantsSaving] = useState(false);

  /* ========================== Fetchers ========================== */
  const fetchUsers = async () => {
    try {
      setULoading(true);
      const res = await http.get("/api/users", { params: { q: uQdebounced, page: uPage, pageSize: uPageSize } });
      if (res.data?.success) {
        setUsers(res.data.data || []);
        setUTotal(res.data.pagination?.total || 0);
      }
    } catch {
      toast.error("Không tải được danh sách người dùng.");
    } finally { setULoading(false); }
  };

  const fetchModules = async () => {
    try {
      setModLoading(true);
      const res = await http.get("/api/modules", { params: { page: 1, pageSize: 500 } });
      if (res.data?.success) setModules(res.data.data || []);
    } catch {
      toast.error("Không tải được danh sách modules.");
    } finally { setModLoading(false); }
  };

  const fetchAssignments = async (uid) => {
    if (!uid) return;
    setLoadingAssign(true);
    try {
      const res = await http.get(`/api/user-modules/${uid}`);
      if (res.data?.success) {
        const map = {};
        (res.data.data || []).forEach((r) => (map[r.moduleId] = r.role));
        setInitialAssignments(map);
        setDraftAssignments(map);
      } else { setInitialAssignments({}); setDraftAssignments({}); }
    } catch {
      toast.error("Không tải được phân quyền người dùng.");
    } finally { setLoadingAssign(false); }
  };

  useEffect(() => { fetchUsers(); /* eslint-disable-next-line */ }, [uQdebounced, uPage]);
  useEffect(() => { fetchModules(); }, []);
  useEffect(() => { if (userId) fetchAssignments(userId); }, [userId]);

  /* ========================== Derived ========================== */
  const totalPages = useMemo(() => Math.max(1, Math.ceil(uTotal / uPageSize)), [uTotal]);
  const hasChanges = useMemo(() => {
    const a = draftAssignments, b = initialAssignments;
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) if ((a[k] || null) !== (b[k] || null)) return true;
    return false;
  }, [draftAssignments, initialAssignments]);

  /* ========================== Handlers ========================== */
  const toggleAssign = (moduleId) => setDraftAssignments((p) => ({ ...p, [moduleId]: p[moduleId] ? undefined : "user" }));
  const setRole = (moduleId, role) => setDraftAssignments((p) => ({ ...p, [moduleId]: role }));
  const resetDraft = () => setDraftAssignments(initialAssignments);

  const saveModuleAssignments = async () => {
    if (!userId) return;
    setSaving(true); setMsg({ type: "", text: "" });
    try {
      const payload = Object.entries(draftAssignments)
        .filter(([_, role]) => role === "admin" || role === "user")
        .map(([moduleId, role]) => ({ moduleId: Number(moduleId), role }));
      const res = await http.put(`/api/user-modules/${userId}`, { assignments: payload });
      if (res.data?.success) {
        toast.success("Đã lưu phân quyền module.");
        setInitialAssignments(draftAssignments);
        if (userId === currentUser?.userID) dispatch(reloadPermissions());
      } else toast.error(res.data?.message || "Lưu phân quyền thất bại.");
    } catch { toast.error("Lỗi kết nối máy chủ."); }
    finally { setSaving(false); }
  };

  const loadModuleFeatures = async () => {
    if (!featureModuleId) { setFeatRows([]); return; }
    setFeatLoading(true); setFeatMsg({ type: "", text: "" });
    try {
      const res = await http.get(`/api/modules/${featureModuleId}/features`);
      if (res.data?.success) setFeatRows(res.data.data || []);
    } catch { setFeatMsg({ type: "error", text: "Không tải được danh sách chức năng." }); }
    finally { setFeatLoading(false); }
  };
  useEffect(() => { loadModuleFeatures(); /* eslint-disable-next-line */ }, [featureModuleId]);

  const openCreateFeature = () => { setEditingFeature(null); setFeatForm({ code: "", name: "", description: "", defaultForAdmin: false, defaultForUser: false }); setFeatModalOpen(true); };
  const openEditFeature = (row) => { setEditingFeature(row); setFeatForm({ code: row.code||"", name: row.name||"", description: row.description||"", defaultForAdmin: !!row.defaultForAdmin, defaultForUser: !!row.defaultForUser }); setFeatModalOpen(true); };

  const saveFeature = async () => {
    if (!featureModuleId) return;
    if (!featForm.code.trim() || !featForm.name.trim()) { setFeatMsg({ type: "error", text: "Mã và tên chức năng là bắt buộc." }); return; }
    setFeatSaving(true);
    try {
      if (editingFeature) {
        const res = await http.put(`/api/modules/${featureModuleId}/features/${editingFeature.featureId}`, featForm);
        if (res.data?.success) { setFeatModalOpen(false); await loadModuleFeatures(); toast.success("Đã cập nhật chức năng."); }
        else setFeatMsg({ type: "error", text: res.data?.message || "Cập nhật chức năng thất bại." });
      } else {
        const res = await http.post(`/api/modules/${featureModuleId}/features`, featForm);
        if (res.data?.success) { setFeatModalOpen(false); await loadModuleFeatures(); toast.success("Đã tạo chức năng."); }
        else setFeatMsg({ type: "error", text: res.data?.message || "Tạo chức năng thất bại." });
      }
    } catch (e) { setFeatMsg({ type: "error", text: e?.response?.data?.message || "Lỗi kết nối máy chủ." }); }
    finally { setFeatSaving(false); }
  };

  const deleteFeature = async (featureId) => {
    if (!featureModuleId || !featureId) return;
    try {
      const res = await http.delete(`/api/modules/${featureModuleId}/features/${featureId}`);
      if (res.data?.success) { toast.success("Đã xoá chức năng."); await loadModuleFeatures(); }
      else toast.error(res.data?.message || "Xoá chức năng thất bại.");
    } catch { toast.error("Lỗi kết nối máy chủ."); }
  };

  const loadUserFeatureGrants = async () => {
    if (!userId || !featureModuleId) { setFeatureRows([]); setFeatureDraft({}); return; }
    setGrantsLoading(true);
    try {
      const res = await http.get(`/api/user-modules/${userId}/${featureModuleId}/features`);
      if (res.data?.success) {
        const rows = res.data.data || [];
        setFeatureRows(rows);
        const d = {}; rows.forEach(r => { d[r.featureId] = !!r.effectiveAllowed; });
        setFeatureDraft(d);
      }
    } finally { setGrantsLoading(false); }
  };
  useEffect(() => { loadUserFeatureGrants(); /* eslint-disable-next-line */ }, [userId, featureModuleId]);

  const changedFeatures = useMemo(() => (
    featureRows
      .map(r => ({ featureId: r.featureId, want: !!featureDraft[r.featureId], def: !!r.defaultAllowed }))
      .filter(x => x.want !== x.def)
      .map(x => ({ featureId: x.featureId, isAllowed: x.want }))
  ), [featureRows, featureDraft]);

  const saveUserFeatureGrants = async () => {
    if (!userId || !featureModuleId) return;
    setGrantsSaving(true);
    try {
      const res = await http.put(`/api/user-modules/${userId}/${featureModuleId}/features`, { grants: changedFeatures });
      if (res.data?.success) {
        toast.success("Đã lưu quyền chức năng.");
        await loadUserFeatureGrants();
        if (userId === currentUser?.userID) dispatch(reloadPermissions());
      } else toast.error(res.data?.message || "Lưu thất bại.");
    } catch { toast.error("Lỗi kết nối máy chủ."); }
    finally { setGrantsSaving(false); }
  };

  /* ========================== Toast (minimal) ========================== */
  const [toasts, setToasts] = useState([]);
  const toast = {
    push: (type, text) => setToasts((t) => [...t, { id: crypto.randomUUID(), type, text }]),
    success: (text) => setToasts((t) => [...t, { id: crypto.randomUUID(), type: "success", text }]),
    error: (text) => setToasts((t) => [...t, { id: crypto.randomUUID(), type: "error", text }]),
    remove: (id) => setToasts((t) => t.filter(x => x.id !== id)),
  };
  useEffect(() => {
    if (!msg.text) return;
    if (msg.type === "success") toast.success(msg.text); else toast.error(msg.text);
  }, [msg]);

  /* ========================== Driver.js Guided Tour ========================== */
  const driverRef = useRef(null);
  const startTour = () => {
    const d = driver({
      showProgress: true,
      nextBtnText: "Tiếp",
      prevBtnText: "Trước",
      doneBtnText: "Xong",
      overlayOpacity: 0.45,
      stagePadding: 6,
      allowClose: true,
      steps: [
        { element: "#tour-search",  popover: { title: "Tìm người dùng", description: "Gõ tên hoặc email để lọc nhanh danh sách.", side: "bottom" } },
        { element: "#tour-users",   popover: { title: "Danh sách người dùng", description: "Chọn một người để gán quyền.", side: "right" } },
        { element: "#tour-modules", popover: { title: "Phân quyền module", description: "Bật/tắt quyền và chọn vai trò user/admin cho module.", side: "top" } },
        { element: "#tour-features",popover: { title: "Chức năng & quyền", description: "Quản lý danh sách chức năng của module và ghi đè quyền theo từng user.", side: "top" } },
        { element: "#tour-save",    popover: { title: "Lưu thay đổi", description: "Nhấn để lưu phân quyền sau khi chỉnh.", side: "left" } },
      ],
    });
    driverRef.current = d;
    d.drive();
  };

  /* ========================== UI ========================== */
  return (
    <div
      className="min-h-[70vh] rounded-3xl p-1 sm:p-2
        bg-[radial-gradient(60%_40%_at_0%_0%,#eef2ff_0%,transparent_60%),radial-gradient(50%_50%_at_100%_0%,#e6fffb_0%,transparent_55%),linear-gradient(180deg,#f7f9fc,transparent)]
        dark:bg-[radial-gradient(60%_40%_at_0%_0%,#0b1220_0%,transparent_60%),radial-gradient(50%_50%_at_100%_0%,#071a15_0%,transparent_55%),linear-gradient(180deg,#020617,transparent)]"
    >
      {/* Top toolbar */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="default" size="sm" className="xl:hidden" onClick={() => setUsersOpen(true)}>
            <FiMenu /> Người dùng
          </Button>
          <div id="tour-search" className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={uQ}
              onChange={(e) => { setUQ(e.target.value); setUPage(1); }}
              placeholder="Tìm người dùng theo tên/email…"
              className="w-[min(80vw,360px)] rounded-2xl bg-white dark:bg-slate-900/60
                         text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500
                         pl-10 pr-3 py-2 text-sm ring-1 ring-slate-200 dark:ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="default" size="sm"><FiFilter /> Lọc</Button>
          <Button id="tour-help" variant="ghost" size="sm" onClick={startTour}><FiHelpCircle /> Hướng dẫn</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
        {/* LEFT: Users list (drawer on mobile) */}
        <SectionCard id="tour-users" title="Chọn người dùng" subtitle="Tìm và chọn để gán quyền" className="hidden xl:block">
          <UsersList
            users={users}
            loading={uLoading}
            page={uPage}
            totalPages={totalPages}
            total={uTotal}
            onPrev={() => setUPage(p => Math.max(1, p-1))}
            onNext={() => setUPage(p => Math.min(totalPages, p+1))}
            userId={userId}
            onSelect={setUserId}
          />
        </SectionCard>

        {/* RIGHT: Modules + Features */}
        <div className="space-y-6">
          <SectionCard
            id="tour-modules"
            title="Phân quyền module"
            subtitle={userId ? "Tick module để cấp quyền, chọn vai trò admin/user." : "Hãy chọn một người dùng."}
            right={
              <div className="flex items-center gap-2">
                <Button onClick={resetDraft} disabled={!hasChanges || !isSuper} variant="default" size="sm"><FiRefreshCcw /> Hoàn tác</Button>
                <Button id="tour-save" onClick={saveModuleAssignments} disabled={!userId || !hasChanges || saving || !isSuper} variant="primary" size="sm"><FiSave /> {saving?"Đang lưu…":"Lưu"}</Button>
              </div>
            }
          >
            {!userId ? (
              <EmptyState title="Chưa chọn người dùng" desc="Hãy chọn một người dùng bên trái để tiếp tục." />
            ) : loadingAssign ? (
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="rounded-xl bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-white/10 p-4 space-y-3">
                    <SkeletonLine w="w-1/2" />
                    <SkeletonLine />
                    <SkeletonLine w="w-2/3" />
                  </div>
                ))}
              </div>
            ) : modLoading ? (
              <div className="grid place-items-center h-40 text-slate-500">Đang tải modules…</div>
            ) : modules.length === 0 ? (
              <EmptyState title="Chưa có module nào" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                {modules.map((m) => {
                  const assigned = draftAssignments[m.moduleId] === "admin" || draftAssignments[m.moduleId] === "user";
                  const role = draftAssignments[m.moduleId] || null;
                  return (
                    <motion.div key={m.moduleId} layout className="rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-white/10 p-4 hover:shadow-soft-hover transition-shadow">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <FiShield className="text-indigo-600 shrink-0" />
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{m.name}</h3>
                          </div>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{m.description || "—"}</p>
                        </div>
                        <label className="inline-flex items-center gap-2">
                          <input type="checkbox" checked={assigned} onChange={() => isSuper && toggleAssign(m.moduleId)} className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" disabled={!isSuper} />
                          <span className="text-xs text-slate-600 dark:text-slate-300">Cho phép</span>
                        </label>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant={role === "user" ? "default" : "subtle"} disabled={!assigned || !isSuper} onClick={() => setRole(m.moduleId, "user")}>user</Button>
                          <Button size="sm" variant={role === "admin" ? "default" : "subtle"} disabled={!assigned || !isSuper} onClick={() => setRole(m.moduleId, "admin")}>admin</Button>
                        </div>
                        <span className={cn(
                          "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
                          role === "admin"
                            ? "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-white/10"
                            : role === "user"
                            ? "bg-indigo-100 text-indigo-700 ring-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-200 dark:ring-indigo-900/40"
                            : "bg-white text-slate-500 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-white/10"
                        )}>{role || "—"}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          <SectionCard
            id="tour-features"
            title="Chức năng & quyền theo user"
            subtitle="Chọn module để quản lý chức năng trong module và phân quyền theo người dùng."
            right={
              <div className="flex items-center gap-2">
                <select
                  className="rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 text-sm px-3 py-2"
                  value={featureModuleId || ""}
                  onChange={(e) => setFeatureModuleId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">— Chọn module —</option>
                  {modules.map((m) => (<option key={m.moduleId} value={m.moduleId}>{m.name}</option>))}
                </select>
                <Button onClick={saveUserFeatureGrants} disabled={!userId || !featureModuleId || grantsSaving || !isSuper} variant="primary" size="sm">
                  <FiSave /> {grantsSaving?"Đang lưu…":"Lưu quyền chức năng"}
                </Button>
              </div>
            }
          >
            {!featureModuleId ? (
              <EmptyState title="Chưa chọn module" desc="Hãy chọn một module ở góc phải trên." />
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <FeaturesCrud
                  isSuper={isSuper}
                  rows={featRows}
                  loading={featLoading}
                  msg={featMsg}
                  onCreate={openCreateFeature}
                  onEdit={openEditFeature}
                  onDelete={(id) => setConfirmDeleteId(id)}
                />
                <UserGrants
                  isSuper={isSuper}
                  userId={userId}
                  rows={featureRows}
                  draft={featureDraft}
                  setDraft={setFeatureDraft}
                  loading={grantsLoading}
                />
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      {/* Mobile Users Drawer */}
      <Modal open={usersOpen} onClose={() => setUsersOpen(false)} title="Chọn người dùng">
        <UsersList
          users={users}
          loading={uLoading}
          page={uPage}
          totalPages={totalPages}
          total={uTotal}
          onPrev={() => setUPage(p => Math.max(1, p-1))}
          onNext={() => setUPage(p => Math.min(totalPages, p+1))}
          userId={userId}
          onSelect={(id)=>{ setUserId(id); setUsersOpen(false); }}
        />
      </Modal>

      {/* Feature Modals */}
      <Modal open={featModalOpen} onClose={() => setFeatModalOpen(false)} title={editingFeature ? "Cập nhật chức năng" : "Thêm chức năng"}>
        <div className="grid gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Mã chức năng <span className="text-red-500">*</span>
            </label>
            <input
              value={featForm.code}
              onChange={(e) => setFeatForm(p => ({ ...p, code: e.target.value }))}
              className="mt-1 w-full rounded-lg bg-white dark:bg-slate-900 px-3 py-2 text-sm
                         ring-1 ring-slate-200 dark:ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="vd: export, view…"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Tên chức năng <span className="text-red-500">*</span>
            </label>
            <input
              value={featForm.name}
              onChange={(e) => setFeatForm(p => ({ ...p, name: e.target.value }))}
              className="mt-1 w-full rounded-lg bg-white dark:bg-slate-900 px-3 py-2 text-sm
                         ring-1 ring-slate-200 dark:ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="vd: Xuất Excel"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Mô tả</label>
            <textarea
              value={featForm.description}
              onChange={(e) => setFeatForm(p => ({ ...p, description: e.target.value }))}
              className="mt-1 w-full rounded-lg bg-white dark:bg-slate-900 px-3 py-2 text-sm
                         ring-1 ring-slate-200 dark:ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              rows={3}
              placeholder="Mô tả ngắn"
            />
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" className="h-5 w-5 accent-indigo-600" checked={!!featForm.defaultForAdmin} onChange={(e) => setFeatForm(p => ({ ...p, defaultForAdmin: e.target.checked }))} />
              <span className="text-sm dark:text-slate-200">Mặc định (admin) = Được</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" className="h-5 w-5 accent-indigo-600" checked={!!featForm.defaultForUser} onChange={(e) => setFeatForm(p => ({ ...p, defaultForUser: e.target.checked }))} />
              <span className="text-sm dark:text-slate-200">Mặc định (user) = Được</span>
            </label>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button onClick={() => setFeatModalOpen(false)} variant="default">Huỷ</Button>
            <Button onClick={saveFeature} variant="primary" disabled={featSaving}>{featSaving ? "Đang lưu…" : (editingFeature ? "Cập nhật" : "Thêm")}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)} title="Xác nhận xoá chức năng">
        <p className="text-sm text-slate-700 dark:text-slate-300">Bạn chắc chắn muốn xoá chức năng này? Hành động không thể hoàn tác.</p>
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button onClick={() => setConfirmDeleteId(null)} variant="default">Huỷ</Button>
          <Button onClick={async () => { const id = confirmDeleteId; setConfirmDeleteId(null); await deleteFeature(id); }} variant="danger">Xoá</Button>
        </div>
      </Modal>

      {/* Floating save bar when there are unsaved changes */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[65] glass rounded-2xl px-3 py-2 flex items-center gap-2"
          >
            <span className="text-sm text-slate-700 dark:text-slate-200">Bạn có thay đổi chưa lưu</span>
            <Button size="sm" onClick={resetDraft} variant="default"><FiRefreshCcw /> Hoàn tác</Button>
            <Button size="sm" onClick={saveModuleAssignments} disabled={!userId || saving || !isSuper} variant="primary"><FiSave /> Lưu</Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-[70] space-y-2">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className={cn(
                "glass rounded-xl px-4 py-3 shadow ring-1 text-sm flex items-center gap-2",
                t.type === "success"
                  ? "bg-emerald-50/80 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:ring-emerald-900/40"
                  : "bg-red-50/80 text-red-700 ring-red-200 dark:bg-red-900/30 dark:text-red-200 dark:ring-red-900/40"
              )}
            >
              {t.type === "success" ? <FiCheckCircle className="shrink-0" /> : <FiAlertTriangle className="shrink-0" />}
              <span>{t.text}</span>
              <button onClick={() => toast.remove(t.id)} className="ml-2 rounded p-1 hover:bg-black/5 dark:hover:bg-white/5"><FiX /></button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ========================== Subcomponents ========================== */
function EmptyState({ icon: Icon = FiSettings, title, desc, children }) {
  return (
    <div className="grid place-items-center text-center gap-3 py-10 text-slate-600 dark:text-slate-300">
      <div className="grid place-items-center h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800"><Icon className="h-5 w-5" /></div>
      {title ? <div className="font-semibold text-slate-800 dark:text-slate-100">{title}</div> : null}
      {desc ? <div className="text-sm text-slate-500 dark:text-slate-400 -mt-1">{desc}</div> : null}
      {children}
    </div>
  );
}

function UsersList({ users, loading, page, totalPages, total, onPrev, onNext, userId, onSelect }) {
  return (
    <div>
      <div
        className="mt-3 max-h-[55vh] overflow-auto divide-y divide-slate-100 dark:divide-white/10
                   rounded-xl ring-1 ring-slate-200 dark:ring-white/10 bg-white dark:bg-slate-900/40 nice-scrollbar"
      >
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <SkeletonLine w="w-2/3" />
                  <SkeletonLine w="w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <EmptyState icon={FiUser} title="Chưa có người dùng" />
        ) : (
          users.map((u) => {
            const active = userId === u.userId;
            return (
              <button
                key={u.userId}
                onClick={() => onSelect(u.userId)}
                className={cn(
                  "w-full text-left px-4 py-3 transition",
                  "hover:bg-indigo-50/40 dark:hover:bg-slate-800/60",
                  active && "bg-indigo-50/70 dark:bg-indigo-900/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="grid place-items-center h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800"><FiUser className="text-slate-500 dark:text-slate-300" /></div>
                  <div className="min-w-0">
                    <div className="font-medium text-slate-800 dark:text-slate-100 truncate">{u.fullName || u.userName}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{u.email || "—"}</div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
        <span>Trang {page}/{totalPages} • {total} người</span>
        <div className="flex items-center gap-2">
          <Button onClick={onPrev} disabled={page<=1} size="sm"><FiChevronLeft /> Trước</Button>
          <Button onClick={onNext} disabled={page>=totalPages} size="sm">Sau <FiChevronRight /></Button>
        </div>
      </div>
    </div>
  );
}

function FeaturesCrud({ isSuper, rows, loading, msg, onCreate, onEdit, onDelete }) {
  return (
    <div className="rounded-xl bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-white/10 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
        <div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">Chức năng trong module</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Tạo / sửa / xoá các chức năng.</div>
        </div>
        <Button variant="primary" size="sm" onClick={onCreate} disabled={!isSuper}><FiPlus /> Thêm chức năng</Button>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            <SkeletonLine />
            <SkeletonLine w="w-3/4" />
            <SkeletonLine w="w-2/3" />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState title="Chưa có chức năng" />
        ) : (
          <table className="min-w-[800px] w-full text-sm table-sticky table-hover">
            <thead className="bg-slate-50/80 dark:bg-slate-900/50 backdrop-blur">
              <tr className="text-[12px] uppercase tracking-wide text-slate-600 dark:text-slate-300">
                <th className="px-3 py-2 text-left">Code</th>
                <th className="px-3 py-2 text-left">Tên</th>
                <th className="px-3 py-2 text-left">Mặc định (admin)</th>
                <th className="px-3 py-2 text-left">Mặc định (user)</th>
                <th className="px-3 py-2 text-left">Mô tả</th>
                <th className="px-3 py-2 text-left">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((f, idx) => (
                <tr key={f.featureId} className={cn(idx % 2 ? "bg-slate-50/70 dark:bg-slate-900/40" : "bg-white dark:bg-slate-900", "border-b border-slate-200 dark:border-white/10")}>
                  <td className="px-3 py-2">{f.code}</td>
                  <td className="px-3 py-2 font-medium">{f.name}</td>
                  <td className="px-3 py-2">{f.defaultForAdmin ? <Badge tone="emerald">Được</Badge> : <Badge>Không</Badge>}</td>
                  <td className="px-3 py-2">{f.defaultForUser ? <Badge tone="emerald">Được</Badge> : <Badge>Không</Badge>}</td>
                  <td className="px-3 py-2">{f.description || "—"}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button onClick={() => onEdit(f)} size="sm"><FiEdit2 /> Sửa</Button>
                      <Button onClick={() => onDelete(f.featureId)} size="sm" variant="danger"><FiTrash2 /> Xoá</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {msg?.text ? (
        <div className={cn("m-4 rounded-xl px-3 py-2 text-sm", msg.type === "success" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:ring-emerald-900/40" : "bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-900/30 dark:text-red-200 dark:ring-red-900/40")}>{msg.text}</div>
      ) : null}
    </div>
  );
}

function UserGrants({ isSuper, userId, rows, draft, setDraft, loading }) {
  return (
    <div className="rounded-xl bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-white/10 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-white/10">
        <div className="font-semibold text-slate-900 dark:text-slate-100">Phân quyền chức năng cho user</div>
        <div className="text-xs text-slate-500 dark:text-slate-400">Hiệu lực = ghi đè (nếu có) • nếu không thì lấy mặc định theo role.</div>
      </div>

      <div className="overflow-x-auto">
        {!userId ? (
          <EmptyState title="Chưa chọn người dùng" />
        ) : loading ? (
          <div className="p-4 space-y-3">
            <SkeletonLine />
            <SkeletonLine w="w-3/5" />
            <SkeletonLine w="w-2/3" />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState title="Module chưa có chức năng nào" />
        ) : (
          <table className="min-w-[800px] w-full text-sm table-sticky table-hover">
            <thead className="bg-slate-50/80 dark:bg-slate-900/50 backdrop-blur">
              <tr className="text-[12px] uppercase tracking-wide text-slate-600 dark:text-slate-300">
                <th className="px-3 py-2 text-left">Mã</th>
                <th className="px-3 py-2 text-left">Tên</th>
                <th className="px-3 py-2 text-left">Mặc định</th>
                <th className="px-3 py-2 text-left">Hiệu lực</th>
                <th className="px-3 py-2 text-left">Ghi đè</th>
                <th className="px-3 py-2 text-left">Cho phép?</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={r.featureId} className={cn(idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/70 dark:bg-slate-900/40", "border-b border-slate-200 dark:border-white/10")}>
                  <td className="px-3 py-2">{r.code}</td>
                  <td className="px-3 py-2">{r.name}</td>
                  <td className="px-3 py-2">{r.defaultAllowed ? <Badge tone="emerald">Được</Badge> : <Badge>Không</Badge>}</td>
                  <td className="px-3 py-2 font-medium">{r.effectiveAllowed ? <Badge tone="emerald">Được</Badge> : <Badge>Không</Badge>}</td>
                  <td className="px-3 py-2">{r.overridden === null ? "—" : (r.overridden ? "Được" : "Không")}</td>
                  <td className="px-3 py-2">
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" className="h-5 w-5 accent-indigo-600" checked={!!draft[r.featureId]} onChange={(e) => setDraft(p => ({ ...p, [r.featureId]: e.target.checked }))} disabled={!isSuper} />
                      <span className="text-xs text-slate-600 dark:text-slate-300">Cho phép</span>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
