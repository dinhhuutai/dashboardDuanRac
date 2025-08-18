// src/routing/ProtectedRouteAdminInk.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useMemo } from "react";

import config from "~/config";
import { userSelector } from "~/redux/selectors";
import { fetchUserModules } from "~/redux/slices/userModulesSlice";

const MODULE_KEY = "ink-weigh";
const FALLBACK_NAME = "Quản lý cân mực";
const NEED_ROLE = "admin"; // hoặc ["user","admin"] nếu muốn cho cả 2

const needsArray = Array.isArray(NEED_ROLE) ? NEED_ROLE : [NEED_ROLE];

function hasPermission(modules, key, fallbackName, needs) {
  if (!Array.isArray(modules)) return false;
  const mod = modules.find((m) => {
    const keyMatch = m.key === key || m.moduleKey === key;
    const nameMatch = (m.name || "").trim() === fallbackName.trim();
    return keyMatch || nameMatch;
  });
  if (!mod) return false;
  const roles = Array.isArray(mod.allowedRoles) ? mod.allowedRoles : [];
  return roles.some((r) => needs.includes(r));
}

export default function ProtectedRouteAdminInk() {
  const tmp = useSelector(userSelector);
  const currentUser = tmp?.login?.currentUser;
  const dispatch = useDispatch();

  // Lấy modules từ cache Redux
  const modules = useSelector((state) => {
    const uid = currentUser?.userID;
  const bucket = state.userModules?.byUserId;
    return uid ? state.userModules.byUserId[uid]?.modules : undefined;
  });

  // Nếu chưa có modules trong store → chủ động fetch (nhưng không block UI)
  useEffect(() => {
    if (currentUser?.userID && !modules) {
      dispatch(fetchUserModules(currentUser.userID));
    }
  }, [currentUser?.userID, modules, dispatch]);

  // Chưa login → về login
  if (!currentUser) {
    return <Navigate to={config.routes.login} replace />;
  }

  // QUYẾT ĐỊNH NGAY bằng cache
  const allowed = hasPermission(modules, MODULE_KEY, FALLBACK_NAME, needsArray);

  // Nếu chưa có dữ liệu lần đầu (modules === undefined) bạn có 2 lựa chọn:
  // 1) Hiển thị skeleton 100-200ms rồi quyết (tuỳ bạn)
  // 2) Quyết định "chặt" là: khi chưa có data => chặn (an toàn hơn)
  //
  // Ở đây ta chọn phương án 2 cho chắc chắn về bảo mật FE:
  if (modules === undefined) {
    return <Navigate to={config.routes.homeMain} replace />;
  }

  return allowed ? <Outlet /> : <Navigate to={config.routes.homeMain} replace />;
}
