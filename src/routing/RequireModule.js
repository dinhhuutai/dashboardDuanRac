// src/routing/RequireModule.jsx
import { Navigate, Outlet } from "react-router-dom";
import Spinner from "react-bootstrap/Spinner";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useMemo } from "react";

import config from "~/config";
import { userSelector } from "~/redux/selectors";
import { fetchUserModules } from "~/redux/slices/userModulesSlice";

/**
 * Props:
 * - moduleKey: string (khóa ổn định trong DB, ví dụ: "ink-weigh", "waste-weigh", "suggest-box")
 * - fallbackName?: string (tên hiển thị để fallback khi backend chưa có key)
 * - needRoles: string[] (ví dụ ["admin"] hoặc ["user","admin"])
 */
export default function RequireModule({ moduleKey, fallbackName, needRoles }) {
  const dispatch = useDispatch();
  const tmp = useSelector(userSelector);
  const currentUser = tmp?.login?.currentUser;

  // Lấy modules từ store an toàn
  const { modules, loading, error } = useSelector((state) => {
    const uid = currentUser?.userID;
    const bucket = state.userModules?.byUserId || {};
    const entry = uid ? bucket[uid] : undefined;
    return {
      modules: entry?.modules,              // undefined (chưa fetch), [] hoặc mảng
      loading: state.userModules?.loading,  // boolean
      error: state.userModules?.error || null,
    };
  });

  // Fetch modules khi chưa có cache
  useEffect(() => {
    if (currentUser?.userID && modules === undefined && !loading) {
      dispatch(fetchUserModules(currentUser.userID));
    }
  }, [currentUser?.userID, modules, loading, dispatch]);

  if (!currentUser) {
    return <Navigate to={config.routes.login} replace />;
  }

  // Đang tải lần đầu → hiển thị spinner (tránh kết luận sớm)
  if (modules === undefined && (loading || !error)) {
    return (
      <div className="min-h-[200px] grid place-items-center">
        <Spinner animation="border" variant="info" />
      </div>
    );
  }

  // Quyết định quyền
  const allowed = hasPermission(modules || [], moduleKey, fallbackName, needRoles);

  return allowed ? <Outlet /> : <Navigate to={config.routes.homeMain} replace />;
}

/* ===== Helpers ===== */

function norm(s = "") {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function coerceRoles(mod) {
  if (Array.isArray(mod?.allowedRoles) && mod.allowedRoles.length) return mod.allowedRoles;
  if (typeof mod?.role === "string") return [mod.role];
  if (Array.isArray(mod?.roles) && mod.roles.length) return mod.roles;
  return [];
}

function hasPermission(modules, key, fallbackName, needs) {
  if (!Array.isArray(modules)) return false;

  const found = modules.find((m) => {
    const keyMatch = m.key === key || m.moduleKey === key;
    if (keyMatch) return true;
    const nameMatch = fallbackName ? norm(m.name || "") === norm(fallbackName) : false;
    return nameMatch;
  });

  if (!found) return false;

  const roles = coerceRoles(found).map((r) => String(r).toLowerCase());
  const needsLower = (Array.isArray(needs) ? needs : [needs]).map((r) => String(r).toLowerCase());

  return roles.some((r) => needsLower.includes(r));
}
