// src/pagesLunchOrder/AdminHistory.jsx
import React, { useEffect, useMemo, useState } from "react";
import http from "~/api/http";
import { BASE_URL } from "~/config";
import Select from "react-select";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";

function dayNameVN(d) {
  return ["", "T2", "T3", "T4", "T5", "T6", "T7", "CN"][d] || "";
}
function getMonday(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().slice(0, 10);
}
const fmtTime = (dt) =>
  new Date(dt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
const fmtDate = (dt) => new Date(dt).toLocaleDateString("vi-VN");

// tạo danh sách số trang
function buildPageList(totalPages, current, radius = 1) {
  const pages = [];
  const add = (v) => pages.includes(v) || pages.push(v);
  add(1);
  for (let p = Math.max(1, current - radius); p <= Math.min(totalPages, current + radius); p++)
    add(p);
  add(totalPages);
  const out = [];
  pages.sort((a, b) => a - b);
  for (let i = 0; i < pages.length; i++) {
    out.push(pages[i]);
    if (i < pages.length - 1 && pages[i + 1] - pages[i] > 1) out.push("...");
  }
  return out;
}

/* ========= Helpers UI ========= */
const Field = ({ label, children }) => (
  <div className="space-y-1">
    <div className="text-xs font-medium text-slate-600">{label}</div>
    {children}
  </div>
);

const StatPill = ({ children }) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 shadow-sm">
    {children}
  </span>
);

/* ====== Loại suất: label + màu ====== */
const TYPE_INFO = {
  re: { label: "Ca ngày", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  ws: { label: "Theo ca",     cls: "bg-indigo-50  text-indigo-700  border-indigo-200"  },
  ot: { label: "Tăng ca",     cls: "bg-rose-50    text-rose-700    border-rose-200"    },
};

// Nếu API đã trả itemType thì ưu tiên dùng; nếu chưa có thì suy luận.
function detectType(r) {
  if (r?.itemType) return String(r.itemType).toLowerCase(); // <— dùng dữ liệu API nếu có
  if (r?.isOvertime || r?.quantityOvertime != null) return "ot";
  const raw = String(r?.statusType ?? r?.mealType ?? r?.type ?? "")
    .trim().toLowerCase();
  if (raw === "ws" || raw === "workshift" || raw === "ca" || r?.isWorkShift === true) return "ws";
  return "re";
}

export default function AdminHistory() {
  // data
  const [rows, setRows] = useState([]);
  const [totalQty, setTotalQty] = useState(0);
  const [totalUsersAll, setTotalUsersAll] = useState(0);

  // filters
  const [weekStartMonday, setWeekStartMonday] = useState("");
  const [departmentId, setDepartmentId] = useState(null);
  const [proxyByUserId, setProxyByUserId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusType, setStatusType] = useState(null);

  // paging
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [proxyUsers, setProxyUsers] = useState([]);

  // accordion
  const [expanded, setExpanded] = useState(new Set());

  // Styles
  const styles = `
    .card {
      background: #f5f8ff;
      border: 1px solid #e6ebf4;
      box-shadow: 10px 10px 24px #d9deea, -10px -10px 24px #ffffff;
      border-radius: 16px;
    }
    .inset {
      background: #ffffff;
      border: 1px solid #e6ebf4;
      box-shadow: inset 6px 6px 12px #d9deea, inset -6px -6px 12px #ffffff;
      border-radius: 12px;
    }
    .pill {
      border-radius: 9999px;
      padding: 4px 10px;
      font-size: 12px;
      font-weight: 600;
      border: 1px solid #e6ebf4;
      background: #ffffff;
      box-shadow: 4px 4px 8px #d9deea, -4px -4px 8px #ffffff;
    }
    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 12px;
      align-items: end;
    }
    .rs__control{ background: transparent !important; border:none !important; box-shadow:none !important; min-height:40px; }
    .rs__value-container{ padding:0 8px !important; }
    .rs__indicator-separator{ display:none; }
    .rs__menu { z-index: 9999; }
  `;

  // load filter options
  useEffect(() => {
    (async () => {
      try {
        const [depRes, proxyRes] = await Promise.all([
          http.get(`${BASE_URL}/api/lunch-order/admin/departments`),
          http.get(`${BASE_URL}/api/lunch-order/admin/proxy-users`),
        ]);
        setDepartments(depRes.data?.data || []);
        setProxyUsers(proxyRes.data?.data || []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  // default this week
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setWeekStartMonday(getMonday(today));
  }, []);

  // load data on filters/paging change
  useEffect(() => {
    if (!weekStartMonday) return;
    load();
    setExpanded(new Set());
  }, [weekStartMonday, departmentId, proxyByUserId, search, statusType, page]);

  async function load() {
    setLoading(true);
    try {
      const res = await http.get(`${BASE_URL}/api/lunch-order/admin/history`, {
        params: {
          weekStartMonday,
          departmentId,
          proxyByUserId,
          search,
          statusType,
          page,
          pageSize,
        },
      });

      const data = res.data?.data || [];
      
      setRows(data);
      setTotalQty(res.data?.totalQtyActive || 0);
      setTotalUsersAll(res.data?.totalUsers || 0);

      const totalPages = Math.max(1, Math.ceil((res.data?.totalUsers || 0) / pageSize));
      if (page > totalPages && totalPages > 0) setPage(1);
    } finally {
      setLoading(false);
    }
  }

  // group by user for header rows
  const grouped = useMemo(() => {
    const map = new Map();
    for (const r of rows) {
      const key = r.userID ?? r.userId;
      if (!map.has(key)) {
        map.set(key, {
          userID: key,
          fullName: r.fullName,
          departmentName: r.departmentName,
          hasProxy: !!r.selectedByUserId,
          proxyName: r.proxyName,
          items: [],
          latestSelectedAt: null,
        });
      }
      map.get(key).items.push({
        id:
          r.userWeeklySelectionId ??
          `${key}-${r.weeklyMenuEntryId}-${r.dayOfWeek}-${r.selectedAt}`,
        foodName: r.foodName,
        imageUrl: r.imageUrl,
        dayOfWeek: r.dayOfWeek,
        selectedAt: r.selectedAt,
        isAction: r.isAction,
        quantity: Number.isFinite(+r.quantity)
          ? +r.quantity
          : Number.isFinite(+r.quantityOvertime)
          ? +r.quantityOvertime
          : 1,
        isOvertime: r.quantityOvertime != null || r.isOvertime === true,
        branchId: r.branchId,
        branchCode: r.branchCode,
        branchName: r.branchName,
        // ➕ loại suất tính sẵn
        _type: detectType(r),
      });
      if (r.selectedByUserId) map.get(key).hasProxy = true;
      if (r.selectedAt) {
        const cur = new Date(map.get(key).latestSelectedAt || 0);
        const nd = new Date(r.selectedAt);
        if (!map.get(key).latestSelectedAt || nd > cur)
          map.get(key).latestSelectedAt = r.selectedAt;
      }
    }

    const arr = Array.from(map.values()).filter((u) =>
      !search?.trim() ? true : (u.fullName || "").toLowerCase().includes(search.toLowerCase())
    );
    arr.sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""));
    return arr;
  }, [rows, search]);

  const totalUsersPage = grouped.length;
  const totalPages = Math.max(1, Math.ceil((totalUsersAll || 0) / pageSize));
  const pageList = buildPageList(totalPages, page, 1);

  function toggle(userID) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(userID) ? next.delete(userID) : next.add(userID);
      return next;
    });
  }

  function dayQtyMap(items) {
    const m = new Map();
    for (const it of items) {
      if (it.isAction) m.set(it.dayOfWeek, (m.get(it.dayOfWeek) || 0) + (it.quantity || 1));
    }
    return m;
  }

  // react-select options
  const departmentOptions = useMemo(() => {
    const opts = departments.map((d) => ({ value: d.departmentId, label: d.departmentName }));
    return [{ value: null, label: "Tất cả bộ phận" }, ...opts];
  }, [departments]);

  const proxyOptions = useMemo(() => {
    return [{ value: null, label: "Tất cả người đặt giùm" }].concat(
      (proxyUsers || []).map((u) => ({ value: u.userID, label: u.fullName }))
    );
  }, [proxyUsers]);

  return (
    <div className="min-h-screen bg-[#f7faff] p-5">
      <style>{styles}</style>

      {/* Header */}
      <div className="card p-4 mb-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg grid place-items-center bg-white border border-slate-200">
          📊
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Lịch sử đặt cơm theo tuần</h2>
          <p className="text-slate-500 text-sm">
            Lọc theo ngày, bộ phận, người đặt giùm & tìm kiếm theo tên
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="card p-4 mb-4">
        <div className="filters-grid">
          <Field label="Chọn tuần">
            <input
              type="date"
              value={weekStartMonday}
              onChange={(e) => {
                setPage(1);
                setWeekStartMonday(getMonday(e.target.value));
              }}
              className="inset w-full px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </Field>

          <Field label="Tìm theo tên">
            <input
              type="text"
              placeholder="Nhập tên người dùng…"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              className="inset w-full px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </Field>

          <Field label="Bộ phận">
            <div className="inset p-0.5">
              <Select
                classNamePrefix="rs"
                options={departmentOptions}
                value={
                  departmentOptions.find((o) => o.value === (departmentId ?? null)) ||
                  departmentOptions[0]
                }
                onChange={(opt) => {
                  setPage(1);
                  setDepartmentId(opt?.value ?? null);
                }}
                isClearable
                placeholder="Tất cả bộ phận"
                menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                styles={{
                  control: (base) => ({
                    ...base,
                    border: "none",
                    boxShadow: "none",
                    minHeight: 40,
                    background: "transparent",
                  }),
                  valueContainer: (base) => ({ ...base, padding: "0 8px" }),
                  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                }}
              />
            </div>
          </Field>

          <Field label="Người đặt giùm">
            <div className="inset p-0.5">
              <Select
                classNamePrefix="rs"
                options={proxyOptions}
                value={
                  proxyOptions.find((o) => o.value === (proxyByUserId ?? null)) ||
                  proxyOptions[0]
                }
                onChange={(opt) => {
                  setPage(1);
                  setProxyByUserId(opt?.value ?? null);
                }}
                isClearable
                placeholder="Tất cả người đặt giùm"
                menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                styles={{
                  control: (base) => ({
                    ...base,
                    border: "none",
                    boxShadow: "none",
                    minHeight: 40,
                    background: "transparent",
                  }),
                  valueContainer: (base) => ({ ...base, padding: "0 8px" }),
                  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                }}
              />
            </div>
          </Field>

          <Field label="Loại suất">
            <div className="whitespace-nowrap rounded-xl">
              <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                {[
                  { value: null, label: "Tất cả" },
                  { value: "re", label: "Ca ngày" },
                  { value: "ws", label: "Theo ca" },
                  { value: "ot", label: "Tăng ca" },
                ].map((op) => {
                  const active = statusType === op.value;
                  return (
                    <button
                      key={String(op.value)}
                      onClick={() => {
                        setPage(1);
                        setStatusType(op.value);
                      }}
                      className={[
                        "px-3 py-1.5 rounded-lg text-sm transition mr-1 last:mr-0",
                        active ? "bg-emerald-600 text-white" : "text-slate-700 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      {op.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </Field>

          <div className="flex flex-wrap items-center gap-2 justify-end">
            <StatPill>👥 {totalUsersPage} người</StatPill>
            <StatPill>🍚 Tổng SL (active): {totalQty}</StatPill>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="grid grid-cols-12 px-4 py-3 text-[13px] font-semibold text-slate-700 bg-white/60 border-b border-slate-200">
          <div className="w-12 text-center">#</div>
          <div className="col-span-3">Người dùng</div>
          <div className="col-span-1">Giờ đặt</div>
          <div className="col-span-2">Ngày đặt</div>
          <div className="col-span-2">Trạng thái</div>
          <div className="col-span-1">Bộ phận</div>
          <div className="col-span-2 text-right pr-1">Ngày (SL)</div>
        </div>

        {loading && <div className="px-4 py-10 text-center text-slate-500">Đang tải…</div>}
        {!loading && grouped.length === 0 && (
          <div className="px-4 py-10 text-center text-slate-400">Không có dữ liệu</div>
        )}

        {!loading &&
          grouped.map((u, idx) => {
            const rowIndex = (page - 1) * pageSize + idx + 1;
            const isOpen = expanded.has(u.userID);
            const zebra = idx % 2 === 0 ? "bg-white" : "bg-[#f9fbff]";
            const dMap = dayQtyMap(u.items);

            const cancelOnly = new Set();
            {
              const status = new Map();
              for (const it of u.items) {
                const st = status.get(it.dayOfWeek) || { active: false, cancelled: false };
                if (it.isAction) st.active = true;
                else st.cancelled = true;
                status.set(it.dayOfWeek, st);
              }
              for (const [d, st] of status) if (!st.active && st.cancelled) cancelOnly.add(d);
            }

            return (
              <div key={u.userID} className={`border-top border-slate-200 ${zebra}`}>
                <button
                  onClick={() => toggle(u.userID)}
                  className={`w-full grid grid-cols-12 px-4 py-3 items-center text-left hover:bg-slate-50 transition ${
                    u.hasProxy ? "bg-amber-50/60" : ""
                  }`}
                >
                  <div className="w-12 text-center font-medium">{rowIndex}</div>
                  <div className="col-span-3 flex items-center gap-2">
                    {isOpen ? (
                      <FaChevronDown className="text-slate-500" />
                    ) : (
                      <FaChevronRight className="text-slate-500" />
                    )}
                    <span className="font-semibold text-slate-800 truncate">{u.fullName}</span>
                  </div>

                  <div className="col-span-1 text-slate-700">
                    {u.latestSelectedAt ? (
                      <span className="pill bg-white">{fmtTime(u.latestSelectedAt)}</span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </div>

                  <div className="col-span-2 text-slate-700">
                    {u.latestSelectedAt ? (
                      <span className="pill bg-white">{fmtDate(u.latestSelectedAt)}</span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </div>

                  <div className="col-span-2">
                    {u.hasProxy ? (
                      <span className="pill bg-amber-100 text-amber-700">Đặt giùm: {u.proxyName}</span>
                    ) : (
                      <span className="pill bg-emerald-100 text-emerald-700">Tự đặt</span>
                    )}
                  </div>

                  <div className="col-span-1 text-slate-600 truncate">{u.departmentName || "-"}</div>

                  <div className="col-span-2 text-right pr-1">
                    {dMap.size === 0 ? (
                      <span className="text-slate-400">-</span>
                    ) : (
                      <div className="inline-flex gap-1 flex-wrap justify-end">
                        {Array.from(dMap.keys())
                          .sort((a, b) => a - b)
                          .map((d) => (
                            <span
                              key={d}
                              className={`pill ${
                                cancelOnly.has(d)
                                  ? "bg-white text-slate-400 line-through"
                                  : "bg-white text-slate-700"
                              }`}
                              title={cancelOnly.has(d) ? "Chỉ còn huỷ" : "Có đặt active"}
                            >
                              {dayNameVN(d)} · {dMap.get(d)}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                </button>

                {/* details */}
                {isOpen && (
                  <div className="px-5 pb-5">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {u.items
                        .sort(
                          (a, b) =>
                            a.dayOfWeek - b.dayOfWeek ||
                            new Date(b.selectedAt) - new Date(a.selectedAt)
                        )
                        .map((it) => {
                          const isCanceled = it.isAction === false;
                          const t = TYPE_INFO[it._type || "re"];
                          return (
                            <div
                              key={it.id}
                              className={`p-3 rounded-xl border bg-white shadow-sm ${
                                isCanceled ? "border-rose-100" : "border-slate-200"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-200 shrink-0">
                                  {it.imageUrl ? (
                                    <img
                                      src={it.imageUrl}
                                      alt={it.foodName}
                                      className={`w-full h-full object-cover ${
                                        isCanceled ? "opacity-60" : ""
                                      }`}
                                    />
                                  ) : (
                                    <div className="w-full h-full grid place-items-center text-[10px] text-slate-400">
                                      No image
                                    </div>
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <div
                                    className={`font-semibold truncate ${
                                      isCanceled ? "text-slate-400 line-through" : "text-slate-800"
                                    }`}
                                    title={it.foodName}
                                  >
                                    {it.foodName}
                                  </div>

                                  <div className="mt-1 flex flex-wrap gap-2 text-xs items-center">
                                    {/* ➕ Nút LOẠI với màu riêng */}
                                    <span className={`pill ${t.cls}`}>{t.label}</span>

                                    <span className="pill bg-[#f5f8ff] text-slate-600">
                                      {dayNameVN(it.dayOfWeek)}
                                    </span>
                                    <span className="pill bg-emerald-50 text-emerald-700 border-emerald-200">
                                      SL: {it.quantity}
                                    </span>

                                    {it.branchName && (
                                      <span
                                        className="pill bg-cyan-50 text-cyan-700 border-cyan-200"
                                        title={it.branchCode ? `Mã: ${it.branchCode}` : ""}
                                      >
                                        {it.branchName}
                                      </span>
                                    )}

                                    {it.selectedAt && (
                                      <>
                                        <span className="pill bg-[#f5f8ff] text-slate-600">
                                          {fmtDate(it.selectedAt)}
                                        </span>
                                        <span className="pill bg-[#f5f8ff] text-slate-600">
                                          {fmtTime(it.selectedAt)}
                                        </span>
                                      </>
                                    )}

                                    {it.isOvertime && (
                                      <span className="pill bg-rose-50 text-rose-700 border-rose-200">
                                        OT
                                      </span>
                                    )}
                                    {isCanceled && (
                                      <span className="pill bg-rose-50 text-rose-600 border-rose-200">
                                        ĐÃ HUỶ
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Footer + Pagination */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="card px-4 py-2 text-slate-700">
          Tổng người hiển thị: <b>{totalUsersPage}</b>{" "}
          <span className="text-slate-500">| Tổng SL (active): {totalQty}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50"
          >
            ‹ Trước
          </button>

          {pageList.map((p, idx) =>
            p === "..." ? (
              <span key={`dots-${idx}`} className="px-2 text-slate-500 select-none">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => setPage(p)}
                disabled={p === page}
                className={`min-w-[34px] h-8 px-2 rounded-md border ${
                  p === page
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-slate-800 border-slate-300 hover:bg-slate-50"
                }`}
              >
                {p}
              </button>
            )
          )}

          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50"
          >
            Sau ›
          </button>
        </div>
      </div>
    </div>
  );
}
