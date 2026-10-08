// src/routes/prefetch.js — tải trước layout + trang đầu của các module người dùng có quyền,
// lúc trình duyệt rảnh sau khi trang chủ hiện xong → bấm vào module là mở ngay, không chờ tải JS.
//
// Đường dẫn import PHẢI trùng module với App.js / routes.js (webpack dùng chung chunk).
// Tải lần lượt từng file (không tải song song) để không tranh băng thông với việc người dùng đang làm.
// Bỏ qua khi máy bật "tiết kiệm dữ liệu" hoặc mạng 2G.
import MODULEID, { isModuleEnabled } from "~/contants/modules";

const ENTRY = {
  [MODULEID.BIEUMAUNOIBO]: {
    user: [() => import("~/layoutsForm/DefaultLayout"), () => import("~/pagesForm/MyForms")],
    admin: [() => import("~/layoutsFormAdmin/DefaultLayoutAdmin"), () => import("~/pagesFormAdmin/FormList")],
  },
  [MODULEID.YEUCAU]: {
    user: [() => import("~/layoutsRequest/DefaultLayout"), () => import("~/pagesRequest/RequestHome")],
    admin: [() => import("~/layoutsRequest/DefaultLayout"), () => import("~/pagesRequestAdmin/TypeList")],
  },
  [MODULEID.DATCOM]: {
    user: [() => import("~/layoutsLunchOrder/DefaultLayout"), () => import("~/pagesLunchOrder/LunchOrder")],
  },
  [MODULEID.TINHLUONG]: {
    user: [() => import("~/layoutCalculateSalary/DefaultLayout"), () => import("~/pagesCalculateSalary/ViewPayslip")],
  },
};

let started = false;

function slowNetwork() {
  const c = typeof navigator !== "undefined" ? navigator.connection : null;
  return !!c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || ""));
}

export function prefetchModules(modules) {
  if (started || !Array.isArray(modules) || slowNetwork()) return;
  started = true;
  const jobs = [];
  for (const m of modules) {
    const e = ENTRY[m?.moduleId];
    if (!e || !isModuleEnabled(m.moduleId)) continue;
    const roles = Array.isArray(m.allowedRoles) ? m.allowedRoles : [m.role].filter(Boolean);
    // chỉ tải vai trò mặc định người dùng hay mở: user nếu có, không thì admin
    const list = roles.includes("user") && e.user ? e.user : roles.includes("admin") && e.admin ? e.admin : null;
    if (list) jobs.push(...list);
  }
  if (!jobs.length) return;
  const run = async () => {
    for (const job of jobs) {
      try { await job(); } catch { /* bỏ qua — lúc mở thật sẽ tải lại */ }
    }
  };
  if ("requestIdleCallback" in window) window.requestIdleCallback(run, { timeout: 5000 });
  else setTimeout(run, 2000);
}
