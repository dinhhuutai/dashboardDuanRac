import routes from "~/config/routes";

// escape các ký tự regex đặc biệt
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// "/admin/user/:id" -> ^/admin/user/[^/]+$
function patternToRegex(pattern) {
  const escaped = escapeRegex(pattern);
  const regexStr =
    "^" + escaped.replace(/\\:([a-zA-Z0-9_]+)/g, "[^/]+") + "$";
  return new RegExp(regexStr);
}

// build matcher 1 lần
const ROUTE_MATCHERS = Object.entries(routes).map(([key, pattern]) => ({
  key,
  pattern,
  regex: patternToRegex(pattern),
}));

// ưu tiên pattern dài hơn để tránh match nhầm
ROUTE_MATCHERS.sort((a, b) => b.pattern.length - a.pattern.length);

export function resolveRouteKey(pathname) {
  const found = ROUTE_MATCHERS.find((m) => m.regex.test(pathname));
  return found ? found.key : null;
}
