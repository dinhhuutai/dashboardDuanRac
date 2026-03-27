// import React, { useEffect, useMemo, useState } from "react";
// import http from "~/api/http";
// import {
//   FiRefreshCcw,
//   FiUsers,
//   FiClock,
//   FiBarChart2,
//   FiSearch,
//   FiChevronLeft,
//   FiChevronRight,
//   FiUser,
//   FiHash,
// } from "react-icons/fi";

// function fmtDbDateTime(v) {
//   if (!v) return "-";

//   // nếu API trả Date object / string
//   const s = String(v);

//   // case 1: có dạng ISO có Z hoặc +07:00 => chuyển về "local string" theo đúng số giờ trong chuỗi
//   // trick: bỏ Z/offset để tránh JS tự đổi timezone
//   const noTZ = s
//     .replace("Z", "")
//     .replace(/([+-]\d{2}:\d{2})$/, ""); // remove +07:00 or -05:00 if exists

//   // noTZ thường dạng: 2025-12-13T08:30:00.000
//   const [datePart, timePartRaw] = noTZ.split("T");
//   if (!datePart) return s;

//   const timePart = (timePartRaw || "").split(".")[0] || "00:00:00";
//   // trả về đúng format VN
//   return `${datePart.split("-").reverse().join("/")} ${timePart}`;
// }

// /** ===== helpers ===== */
// function pad2(n) {
//   return String(n).padStart(2, "0");
// }
// function toDateInput(d) {
//   return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
// }
// function startOfMonthInput() {
//   const d = new Date();
//   const first = new Date(d.getFullYear(), d.getMonth(), 1);
//   return toDateInput(first);
// }
// function todayInput() {
//   return toDateInput(new Date());
// }
// function fmtDuration(sec = 0) {
//   const s = Math.max(0, Number(sec) || 0);
//   const h = Math.floor(s / 3600);
//   const m = Math.floor((s % 3600) / 60);
//   const r = s % 60;
//   if (h > 0) return `${h}h ${m}m`;
//   if (m > 0) return `${m}m ${r}s`;
//   return `${r}s`;
// }
// function safeStr(x) {
//   return (x ?? "").toString();
// }
// function clamp(n, a, b) {
//   return Math.max(a, Math.min(b, n));
// }

// // ===== Glass theme (soft modern) =====
// const appBg = "bg-gradient-to-br from-slate-50 via-white to-indigo-50";
// const glass =
//   "bg-white/55 backdrop-blur-xl border border-white/60 shadow-[0_12px_40px_-20px_rgba(2,6,23,0.25)]";
// const glassStrong =
//   "bg-white/70 backdrop-blur-xl border border-white/70 shadow-[0_14px_50px_-28px_rgba(2,6,23,0.35)]";
// const softRing = "ring-1 ring-black/5";

// const neuBg = "bg-slate-100"; 
// const neuShadow = "shadow-[10px_10px_24px_rgba(15,23,42,0.12),-10px_-10px_24px_rgba(255,255,255,0.9)]"; 
// const neuShadowInset = "shadow-[inset_10px_10px_18px_rgba(15,23,42,0.12),inset_-10px_-10px_18px_rgba(255,255,255,0.95)]"; 
// const neuRing = "ring-1 ring-white/60";

// function NeuCard({ title, sub, icon, right, children }) {
//   return (
//     <div className={`${glass} ${softRing} rounded-3xl overflow-hidden`}>
//       <div className="px-4 sm:px-5 py-4 flex items-center justify-between gap-3">
//         <div className="flex items-center gap-3 min-w-0">
//           <div className="h-11 w-11 rounded-2xl bg-[#e8ecef] text-black grid place-items-center shadow-sm">
//             {icon}
//           </div>
//           <div className="min-w-0">
//             <div className="font-semibold text-slate-900 truncate">{title}</div>
//             {sub ? <div className="text-xs text-slate-500 truncate">{sub}</div> : null}
//           </div>
//         </div>
//         {right}
//       </div>
//       <div className="px-4 sm:px-5 pb-5">{children}</div>
//     </div>
//   );
// }

// function NeuPill({ children }) {
//   return (
//     <span className={`${neuBg} ${neuShadowInset} ${neuRing} rounded-full px-3 py-1 text-xs text-slate-600`}>
//       {children}
//     </span>
//   );
// }

// function NeuInput(props) {
//   return (
//     <input
//       {...props}
//       className={[
//         "w-full sm:w-auto text-sm text-slate-800 placeholder:text-slate-400",
//         "rounded-2xl px-3.5 py-2.5",
//         "bg-white/70 backdrop-blur border border-white/70 shadow-sm",
//         "focus:outline-none focus:ring-2 focus:ring-indigo-400/40",
//         props.className || "",
//       ].join(" ")}
//     />
//   );
// }

// function NeuSelect(props) {
//   return (
//     <select
//       {...props}
//       className={[
//         "w-full sm:w-auto text-sm text-slate-800",
//         "rounded-2xl px-3.5 py-2.5",
//         "bg-white/70 backdrop-blur border border-white/70 shadow-sm",
//         "focus:outline-none focus:ring-2 focus:ring-indigo-400/40",
//         "min-w-0",
//         props.className || "",
//       ].join(" ")}
//     />
//   );
// }

// function NeuButton({ children, ...props }) {
//   return (
//     <button
//       {...props}
//       className={[
//         "inline-flex items-center justify-center gap-2 text-sm font-semibold",
//         "rounded-2xl px-3.5 py-2.5",
//         "bg-slate-900 text-white shadow-sm",
//         "hover:opacity-95 active:opacity-90",
//         "disabled:opacity-60 disabled:cursor-wait",
//         props.className || "",
//       ].join(" ")}
//     >
//       {children}
//     </button>
//   );
// }

// function StatusDot({ online }) {
//   return (
//     <span
//       className={[
//         "inline-flex h-2.5 w-2.5 rounded-full",
//         online ? "bg-emerald-500" : "bg-slate-400",
//         "shadow-[0_0_0_6px_rgba(16,185,129,0.10)]",
//       ].join(" ")}
//     />
//   );
// }

// /** ===== charts (no library) ===== */
// function MiniBarChart({ data = [], height = 86 }) {
//   const max = Math.max(1, ...data.map((d) => Number(d.value) || 0));
//   const cols = Math.max(10, data.length);

//   return (
//     <div className="w-full">
//       <div
//         className="grid items-end gap-2"
//         style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
//       >
//         {data.map((d, i) => {
//           const v = Number(d.value) || 0;
//           const h = Math.round((v / max) * height);
//           return (
//             <div key={i} className="flex flex-col items-center gap-2">
//               <div
//                 title={`${d.label}: ${v}`}
//                 className={`${neuBg} ${neuShadowInset} ${neuRing} w-full rounded-2xl relative overflow-hidden`}
//                 style={{ height }}
//               >
//                 <div
//                   className="absolute bottom-0 left-0 right-0 rounded-2xl bg-slate-800/90"
//                   style={{ height: h }}
//                 />
//               </div>
//               <div className="text-[10px] text-slate-500 w-full text-center truncate">
//                 {d.label}
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

// function DonutGauge({ value = 0, max = 1, label }) {
//   const pct = clamp(max <= 0 ? 0 : value / max, 0, 1);
//   const size = 96;
//   const stroke = 10;
//   const r = (size - stroke) / 2;
//   const c = 2 * Math.PI * r;
//   const dash = c * pct;

//   return (
//     <div className="flex items-center gap-3">
//       <div className={`${neuBg} ${neuShadowInset} ${neuRing} rounded-[26px] p-3`}>
//         <svg width={size} height={size}>
//           <circle
//             cx={size / 2}
//             cy={size / 2}
//             r={r}
//             stroke="rgba(100,116,139,0.25)"
//             strokeWidth={stroke}
//             fill="transparent"
//           />
//           <circle
//             cx={size / 2}
//             cy={size / 2}
//             r={r}
//             stroke="rgba(15,23,42,0.85)"
//             strokeWidth={stroke}
//             fill="transparent"
//             strokeLinecap="round"
//             strokeDasharray={`${dash} ${c - dash}`}
//             transform={`rotate(-90 ${size / 2} ${size / 2})`}
//           />
//         </svg>
//       </div>

//       <div className="min-w-0">
//         <div className="text-sm font-semibold text-slate-900">{label}</div>
//         <div className="text-xs text-slate-500">{Math.round(pct * 100)}%</div>
//       </div>
//     </div>
//   );
// }

// /** ===== pagination ===== */
// function usePagination(items, pageSize) {
//   const [page, setPage] = useState(1);
//   const total = items.length;
//   const totalPages = Math.max(1, Math.ceil(total / pageSize));
//   const safePage = Math.min(page, totalPages);

//   const slice = useMemo(() => {
//     const start = (safePage - 1) * pageSize;
//     return items.slice(start, start + pageSize);
//   }, [items, safePage, pageSize]);

//   useEffect(() => {
//     if (page > totalPages) setPage(totalPages);
//   }, [page, totalPages]);

//   return { page: safePage, setPage, totalPages, total, slice, pageSize };
// }

// function Pager({ paging }) {
//   const { page, setPage, totalPages, total, pageSize } = paging;
//   const left = total === 0 ? 0 : (page - 1) * pageSize + 1;
//   const right = Math.min(page * pageSize, total);

//   return (
//     <div className="mt-3 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
//       <div className="text-xs text-slate-500">
//         {left}-{right} / {total}
//       </div>

//       <div className="-ml-1 flex items-center gap-2 sm:ml-0">
//         <NeuButton
//           onClick={() => setPage(Math.max(1, page - 1))}
//           disabled={page <= 1}
//           className="h-10 min-w-[44px] px-0 sm:h-auto sm:min-w-0 sm:px-3.5"
//         >
//           <FiChevronLeft />
//         </NeuButton>

//         <div className="min-w-[52px] text-left sm:text-center text-xs text-slate-600">
//           {page}/{totalPages}
//         </div>

//         <NeuButton
//           onClick={() => setPage(Math.min(totalPages, page + 1))}
//           disabled={page >= totalPages}
//           className="h-10 min-w-[44px] px-0 sm:h-auto sm:min-w-0 sm:px-3.5"
//         >
//           <FiChevronRight />
//         </NeuButton>
//       </div>
//     </div>
//   );
// }

// export default function UsageDashboard() {
//   /** range filter */
//   const [fromDate, setFromDate] = useState(startOfMonthInput());
//   const [toDate, setToDate] = useState(todayInput());

//   const [loading, setLoading] = useState(true);

//   const [onlineList, setOnlineList] = useState([]);
//   const [topUsers, setTopUsers] = useState([]);
//   const [topPages, setTopPages] = useState([]);

//   /** NEW: per-user top pages */
//   const [selectedUserId, setSelectedUserId] = useState("");
//   const [selectedUserPages, setSelectedUserPages] = useState([]);
//   const [loadingUserPages, setLoadingUserPages] = useState(false);

//   /** local filters */
//   const [qUser, setQUser] = useState("");
//   const [qPage, setQPage] = useState("");

//   /** derived lists */
//   const onlineFiltered = useMemo(() => {
//     const q = safeStr(qUser).trim().toLowerCase();
//     const arr = Array.isArray(onlineList) ? onlineList : [];
//     if (!q) return arr;
//     return arr.filter((u) => {
//       const t = `${safeStr(u.fullName)} ${safeStr(u.username)} ${safeStr(u.role)}`.toLowerCase();
//       return t.includes(q);
//     });
//   }, [onlineList, qUser]);

//   const topUsersFiltered = useMemo(() => {
//     const q = safeStr(qUser).trim().toLowerCase();
//     const arr = Array.isArray(topUsers) ? topUsers : [];
//     if (!q) return arr;
//     return arr.filter((u) => {
//       const t = `${safeStr(u.fullName)} ${safeStr(u.username)} ${safeStr(u.role)}`.toLowerCase();
//       return t.includes(q);
//     });
//   }, [topUsers, qUser]);

//   const topPagesFiltered = useMemo(() => {
//     const q = safeStr(qPage).trim().toLowerCase();
//     const arr = Array.isArray(topPages) ? topPages : [];
//     if (!q) return arr;
//     return arr.filter((p) => safeStr(p.page).toLowerCase().includes(q));
//   }, [topPages, qPage]);

//   /** paging */
//   const onlinePaging = usePagination(onlineFiltered, 10);
//   const usersPaging = usePagination(topUsersFiltered, 10);
//   const pagesPaging = usePagination(topPagesFiltered, 10);
//   const userPagesPaging = usePagination(
//     useMemo(() => (Array.isArray(selectedUserPages) ? selectedUserPages : []), [selectedUserPages]),
//     10
//   );

//   /** KPIs */
//   const onlineCount = useMemo(() => {
//     return (onlineList || []).filter((x) => x.isOnline === 1 || x.isOnline === true).length;
//   }, [onlineList]);

//   const totalOnlineSeconds = useMemo(() => {
//     return (onlineList || []).reduce(
//       (acc, x) => acc + (Number(x.totalOnlineTodaySeconds) || 0),
//       0
//     );
//   }, [onlineList]);

//   const totalPageViews = useMemo(() => {
//     return (topPages || []).reduce((a, x) => a + (Number(x.views) || 0), 0);
//   }, [topPages]);

//   const offlineCount = useMemo(() => {
//     const total = (onlineList || []).length;
//     return Math.max(0, total - onlineCount);
//   }, [onlineList, onlineCount]);

//   /** chart data */
//   const chartTopUsers = useMemo(() => {
//     const arr = (topUsers || []).slice(0, 10);
//     return arr.map((u) => ({
//       label: (u.fullName || u.username || "").toString().split(" ").slice(-1)[0] || "User",
//       value: Number(u.totalSeconds) || 0,
//     }));
//   }, [topUsers]);

//   const chartTopPages = useMemo(() => {
//     const arr = (topPages || []).slice(0, 10);
//     return arr.map((p) => ({
//       label: safeStr(p.page).split("/").filter(Boolean).slice(-1)[0] || "page",
//       value: Number(p.views) || 0,
//     }));
//   }, [topPages]);

//   const chartSelectedUserPages = useMemo(() => {
//     const arr = (selectedUserPages || []).slice(0, 10);
//     return arr.map((p) => ({
//       label: safeStr(p.page).split("/").filter(Boolean).slice(-1)[0] || "page",
//       value: Number(p.views) || 0,
//     }));
//   }, [selectedUserPages]);

//   /** API load */
//   const refresh = async () => {
//     setLoading(true);
//     try {
//       const rOnline = await http.get("/api/presence/today");

//       let rTopUsers;
//       try {
//         rTopUsers = await http.get("/api/presence/top-users-range", {
//           params: { from: fromDate, to: toDate },
//         });
//       } catch {
//         rTopUsers = await http.get("/api/presence/top-users", { params: { date: toDate } });
//       }

//       let rTopPages;
//       try {
//         rTopPages = await http.get("/pageview/top-pages-range", {
//           params: { from: fromDate, to: toDate },
//         });
//       } catch {
//         rTopPages = await http.get("/pageview/top-pages", { params: { date: toDate } });
//       }

//       const onlineData = rOnline?.data?.data || [];
//       setOnlineList(onlineData);
//       setTopUsers(rTopUsers?.data?.data || []);
//       setTopPages(rTopPages?.data?.data || []);

//       // auto pick a user if none selected
//       if (!selectedUserId && onlineData?.length) {
//         setSelectedUserId(String(onlineData[0]?.userID ?? ""));
//       }
//     } catch (e) {
//       console.error("UsageDashboard load error:", e);
//       setOnlineList([]);
//       setTopUsers([]);
//       setTopPages([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   /** NEW: load pages for selected user */
//   const loadSelectedUserPages = async (uid) => {
//     if (!uid) {
//       setSelectedUserPages([]);
//       return;
//     }
//     setLoadingUserPages(true);
//     try {
//       // Recommended endpoint:
//       // GET /api/pageview/top-pages-by-user?userId=...&from=...&to=...
//       const r = await http.get("/pageview/top-pages-by-user", {
//         params: { userId: uid, from: fromDate, to: toDate },
//       });
//       setSelectedUserPages(r?.data?.data || []);
//     } catch (e) {
//       // fallback (nếu BE chưa có) -> show empty, không crash
//       console.warn("top-pages-by-user missing or failed:", e);
//       setSelectedUserPages([]);
//     } finally {
//       setLoadingUserPages(false);
//     }
//   };

//   useEffect(() => {
//     refresh();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [fromDate, toDate]);

//   useEffect(() => {
//     loadSelectedUserPages(selectedUserId);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [selectedUserId, fromDate, toDate]);

//   /** UI header selects */
//   const userOptions = useMemo(() => {
//     const arr = Array.isArray(onlineList) ? onlineList : [];
//     return arr
//       .map((u) => ({
//         userID: String(u.userID ?? ""),
//         label: `${u.fullName || u.username || "User"} (${u.username || "?"})`,
//       }))
//       .filter((x) => x.userID);
//   }, [onlineList]);

//   return (
//     <div className="min-h-screen">
//       <div className="mx-auto max-w-[1200px] space-y-4 sm:space-y-5">
//         {/* ===== Header ===== */}
//         <div className={`${neuBg} ${neuShadow} ${neuRing} rounded-[28px] p-4 sm:p-5`}>
//           <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
//             <div className="min-w-0">
//               <div className="inline-flex items-center gap-3">
//                 <span className={`${neuBg} ${neuShadowInset} rounded-2xl h-11 w-11 grid place-items-center text-slate-700`}>
//                   <FiBarChart2 />
//                 </span>
//                 <div className="min-w-0">
//                   <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 truncate">
//                     Trung tâm theo dõi hoạt động
//                   </h1>
//                   <div className="text-sm text-slate-500 mt-0.5">
//                     Online • Thời gian • Trang truy cập
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
//               <div className="grid grid-cols-2 gap-2">
//                 <div>
//                   <div className="text-[11px] text-slate-500 mb-1">Từ ngày</div>
//                   <NeuInput type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
//                 </div>
//                 <div>
//                   <div className="text-[11px] text-slate-500 mb-1">Đến ngày</div>
//                   <NeuInput type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
//                 </div>
//               </div>

//               <NeuButton onClick={refresh} disabled={loading} className="h-[42px]">
//                 <FiRefreshCcw className={loading ? "animate-spin" : ""} />
//                 {loading ? "Đang tải" : "Làm mới"}
//               </NeuButton>
//             </div>
//           </div>
//         </div>

//         {/* ===== KPIs ===== */}
//         <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
//           <div className={`${neuBg} ${neuShadow} ${neuRing} rounded-[28px] p-4`}>
//             <div className="flex items-center justify-between">
//               <div className="text-sm text-slate-500">Online</div>
//               <span className={`${neuBg} ${neuShadowInset} rounded-2xl h-10 w-10 grid place-items-center text-slate-700`}>
//                 <FiUsers />
//               </span>
//             </div>
//             <div className="mt-2 text-3xl font-semibold text-slate-900">{onlineCount}</div>
//             <div className="mt-2">
//               <DonutGauge value={onlineCount} max={Math.max(1, onlineCount + offlineCount)} label="Tỷ lệ online" />
//             </div>
//           </div>

//           <div className={`${neuBg} ${neuShadow} ${neuRing} rounded-[28px] p-4`}>
//             <div className="flex items-center justify-between">
//               <div className="text-sm text-slate-500">Tổng thời gian</div>
//               <span className={`${neuBg} ${neuShadowInset} rounded-2xl h-10 w-10 grid place-items-center text-slate-700`}>
//                 <FiClock />
//               </span>
//             </div>
//             <div className="mt-2 text-3xl font-semibold text-slate-900">{fmtDuration(totalOnlineSeconds)}</div>
//             <div className="mt-2 text-xs text-slate-500">Tất cả user (presence)</div>
//           </div>

//           <div className={`${neuBg} ${neuShadow} ${neuRing} rounded-[28px] p-4`}>
//             <div className="flex items-center justify-between">
//               <div className="text-sm text-slate-500">Lượt xem</div>
//               <span className={`${neuBg} ${neuShadowInset} rounded-2xl h-10 w-10 grid place-items-center text-slate-700`}>
//                 <FiHash />
//               </span>
//             </div>
//             <div className="mt-2 text-3xl font-semibold text-slate-900">{totalPageViews}</div>
//             <div className="mt-2 text-xs text-slate-500">Pageview</div>
//           </div>
//         </div>

//         {/* ===== Charts ===== */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
//           <NeuCard
//             title="Top người dùng"
//             sub="Thời gian online"
//             icon={<FiUsers />}
//             right={<NeuPill>{fromDate} → {toDate}</NeuPill>}
//           >
//             {chartTopUsers.length === 0 ? (
//               <div className="text-sm text-slate-500">Chưa có dữ liệu</div>
//             ) : (
//               <MiniBarChart data={chartTopUsers} />
//             )}
//           </NeuCard>

//           <NeuCard
//             title="Top trang"
//             sub="Lượt xem"
//             icon={<FiBarChart2 />}
//             right={<NeuPill>{fromDate} → {toDate}</NeuPill>}
//           >
//             {chartTopPages.length === 0 ? (
//               <div className="text-sm text-slate-500">Chưa có dữ liệu</div>
//             ) : (
//               <MiniBarChart data={chartTopPages} />
//             )}
//           </NeuCard>
//         </div>

//         {/* ===== NEW: Selected user -> top pages ===== */}
//         <NeuCard
//           title="User vào trang nào nhiều nhất"
//           sub="Theo user bạn chọn"
//           icon={<FiUser />}
//           right={
//             <div className="flex items-center gap-2">
//               <NeuPill>{fromDate} → {toDate}</NeuPill>
//               <div className="hidden md:block w-[350px] min-w-0">
//   <NeuSelect
//     value={selectedUserId}
//     onChange={(e) => {
//       userPagesPaging.setPage(1);
//       setSelectedUserId(e.target.value);
//     }}
//     className="w-full min-w-0"
//   >
//     <option value="">-- Chọn user --</option>

//     {userOptions.map((o) => (
//       <option key={o.userID} value={o.userID}>
//         {o.label}
//       </option>
//     ))}
//   </NeuSelect>
// </div>
//             </div>
//           }
//         >
//           {/* mobile select */}
//           <div className="md:hidden mb-3">
//             <NeuSelect
//               value={selectedUserId}
//               onChange={(e) => {
//                 userPagesPaging.setPage(1);
//                 setSelectedUserId(e.target.value);
//               }}
//             >
//               <option value="">-- Chọn user --</option>
//               {userOptions.map((o) => (
//                 <option key={o.userID} value={o.userID}>
//                   {o.label}
//                 </option>
//               ))}
//             </NeuSelect>
//           </div>

//           {loadingUserPages ? (
//             <div className="text-sm text-slate-500">Đang tải...</div>
//           ) : selectedUserId && selectedUserPages.length === 0 ? (
//             <div className="text-sm text-slate-500">
//               Chưa có dữ liệu (hoặc BE chưa có endpoint <code>/api/pageview/top-pages-by-user</code>)
//             </div>
//           ) : (
//             <>
//               <div className="mb-4">
//                 <MiniBarChart data={chartSelectedUserPages} />
//               </div>

//               <div className="overflow-auto">
//                 <table className="w-full text-sm">
//                   <thead className="text-slate-500">
//                     <tr className="border-b border-white/40">
//                       <th className="text-left py-2 pr-3">Trang</th>
//                       <th className="text-right py-2">Views</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {userPagesPaging.slice.map((p, idx) => (
//                       <tr key={idx} className="border-b border-white/30">
//                         <td className="py-2 pr-3">
//                           <div className="text-slate-900 break-all font-medium">{p.page}</div>
//                         </td>
//                         <td className="py-2 text-right font-semibold text-slate-900">{p.views}</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>

//               <Pager paging={userPagesPaging} />
//             </>
//           )}
//         </NeuCard>

//         {/* ===== Tables ===== */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
//           {/* Users status */}
//           <NeuCard
//             title="Người dùng"
//             sub="Online / Offline"
//             icon={<FiUsers />}
//             right={
//               <div className="w-[240px] hidden sm:block">
//                 <div className="relative">
//                   <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
//                   <input
//                     value={qUser}
//                     onChange={(e) => {
//                       onlinePaging.setPage(1);
//                       usersPaging.setPage(1);
//                       setQUser(e.target.value);
//                     }}
//                     placeholder="Tìm user..."
//                     className={[
//                       "w-full text-sm text-slate-700 placeholder:text-slate-400",
//                       `${neuBg} ${neuShadowInset} ${neuRing} rounded-2xl pl-9 pr-3.5 py-2`,
//                       "focus:outline-none focus:ring-2 focus:ring-slate-900/10",
//                     ].join(" ")}
//                   />
//                 </div>
//               </div>
//             }
//           >
//             <div className="sm:hidden mb-3">
//               <div className="relative">
//                 <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
//                 <input
//                   value={qUser}
//                   onChange={(e) => {
//                     onlinePaging.setPage(1);
//                     usersPaging.setPage(1);
//                     setQUser(e.target.value);
//                   }}
//                   placeholder="Tìm user..."
//                   className={[
//                     "w-full text-sm text-slate-700 placeholder:text-slate-400",
//                     `${neuBg} ${neuShadowInset} ${neuRing} rounded-2xl pl-9 pr-3.5 py-2.5`,
//                     "focus:outline-none focus:ring-2 focus:ring-slate-900/10",
//                   ].join(" ")}
//                 />
//               </div>
//             </div>

//             <div className="overflow-auto">
//               <table className="w-full text-sm">
//                 <thead className="text-slate-500">
//                   <tr className="border-b border-white/40">
//                     <th className="text-left py-2 pr-3">Tên</th>
//                     <th className="text-left py-2 pr-3">TT</th>
//                     <th className="text-right py-2">Hôm nay</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {onlinePaging.slice.map((u) => (
//                     <tr key={u.userID} className="border-b border-white/30">
//                       <td className="py-2 pr-3">
//                         <div className="font-medium text-slate-900">{u.fullName || u.username}</div>
//                         <div className="text-xs text-slate-500">{u.username}</div>
//                       </td>
//                       <td className="py-2 pr-3">
//                         <div className="flex items-center gap-2">
//                           <StatusDot online={!!u.isOnline} />
//                           <span className="text-slate-700">{u.isOnline ? "Online" : "Offline"}</span>
//                         </div>
//                         <div className="text-[11px] text-slate-500 mt-1">
//                           {fmtDbDateTime(u.lastOnline)}
//                         </div>
//                       </td>
//                       <td className="py-2 text-right font-semibold text-slate-900">
//                         {fmtDuration(u.totalOnlineTodaySeconds)}
//                       </td>
//                     </tr>
//                   ))}
//                   {!loading && onlinePaging.total === 0 && (
//                     <tr>
//                       <td colSpan={3} className="py-8 text-center text-slate-500">
//                         Không có dữ liệu
//                       </td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>

//             <Pager paging={onlinePaging} />
//           </NeuCard>

//           {/* Top pages */}
//           <NeuCard
//             title="Top trang"
//             sub="Lượt xem"
//             icon={<FiBarChart2 />}
//             right={
//               <div className="w-[240px] hidden sm:block">
//                 <div className="relative">
//                   <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
//                   <input
//                     value={qPage}
//                     onChange={(e) => {
//                       pagesPaging.setPage(1);
//                       setQPage(e.target.value);
//                     }}
//                     placeholder="Tìm trang..."
//                     className={[
//                       "w-full text-sm text-slate-700 placeholder:text-slate-400",
//                       `${neuBg} ${neuShadowInset} ${neuRing} rounded-2xl pl-9 pr-3.5 py-2`,
//                       "focus:outline-none focus:ring-2 focus:ring-slate-900/10",
//                     ].join(" ")}
//                   />
//                 </div>
//               </div>
//             }
//           >
//             <div className="sm:hidden mb-3">
//               <div className="relative">
//                 <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
//                 <input
//                   value={qPage}
//                   onChange={(e) => {
//                     pagesPaging.setPage(1);
//                     setQPage(e.target.value);
//                   }}
//                   placeholder="Tìm trang..."
//                   className={[
//                     "w-full text-sm text-slate-700 placeholder:text-slate-400",
//                     `${neuBg} ${neuShadowInset} ${neuRing} rounded-2xl pl-9 pr-3.5 py-2.5`,
//                     "focus:outline-none focus:ring-2 focus:ring-slate-900/10",
//                   ].join(" ")}
//                 />
//               </div>
//             </div>

//             <div className="overflow-auto">
//               <table className="w-full text-sm">
//                 <thead className="text-slate-500">
//                   <tr className="border-b border-white/40">
//                     <th className="text-left py-2 pr-3">Trang</th>
//                     <th className="text-right py-2">Views</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {pagesPaging.slice.map((p, idx) => (
//                     <tr key={idx} className="border-b border-white/30">
//                       <td className="py-2 pr-3">
//                         <div className="font-medium text-slate-900 break-all">{p.page}</div>
//                       </td>
//                       <td className="py-2 text-right font-semibold text-slate-900">{p.views}</td>
//                     </tr>
//                   ))}
//                   {!loading && pagesPaging.total === 0 && (
//                     <tr>
//                       <td colSpan={2} className="py-8 text-center text-slate-500">
//                         Chưa có dữ liệu
//                       </td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>

//             <Pager paging={pagesPaging} />
//           </NeuCard>
//         </div>

//         {/* Top users table */}
//         <NeuCard
//           title="Top người dùng"
//           sub="Thời gian online"
//           icon={<FiClock />}
//           right={<NeuPill>{fromDate} → {toDate}</NeuPill>}
//         >
//           <div className="overflow-auto">
//             <table className="w-full text-sm">
//               <thead className="text-slate-500">
//                 <tr className="border-b border-white/40">
//                   <th className="text-left py-2 pr-3">Tên</th>
//                   <th className="text-left py-2 pr-3">Role</th>
//                   <th className="text-left py-2 pr-3">Last</th>
//                   <th className="text-right py-2">Tổng</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {usersPaging.slice.map((u) => (
//                   <tr key={u.userID} className="border-b border-white/30">
//                     <td className="py-2 pr-3">
//                       <div className="font-medium text-slate-900">{u.fullName || u.username}</div>
//                       <div className="text-xs text-slate-500">{u.username}</div>
//                     </td>
//                     <td className="py-2 pr-3 text-slate-700">{u.role || "-"}</td>
//                     <td className="py-2 pr-3 text-slate-700">
//                       {fmtDbDateTime(u.lastOnline)}
//                     </td>
//                     <td className="py-2 text-right font-semibold text-slate-900">
//                       {fmtDuration(u.totalSeconds)}
//                     </td>
//                   </tr>
//                 ))}
//                 {!loading && usersPaging.total === 0 && (
//                   <tr>
//                     <td colSpan={4} className="py-8 text-center text-slate-500">
//                       Không có dữ liệu
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>

//           <Pager paging={usersPaging} />
//         </NeuCard>
//       </div>
//     </div>
//   );
// }



import React, { useEffect, useMemo, useState } from "react";
import http from "~/api/http";
import {
  FiRefreshCcw,
  FiUsers,
  FiClock,
  FiBarChart2,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiHash,
} from "react-icons/fi";

function fmtDbDateTime(v) {
  if (!v) return "-";

  // nếu API trả Date object / string
  const s = String(v);

  // case 1: có dạng ISO có Z hoặc +07:00 => chuyển về "local string" theo đúng số giờ trong chuỗi
  // trick: bỏ Z/offset để tránh JS tự đổi timezone
  const noTZ = s
    .replace("Z", "")
    .replace(/([+-]\d{2}:\d{2})$/, ""); // remove +07:00 or -05:00 if exists

  // noTZ thường dạng: 2025-12-13T08:30:00.000
  const [datePart, timePartRaw] = noTZ.split("T");
  if (!datePart) return s;

  const timePart = (timePartRaw || "").split(".")[0] || "00:00:00";
  // trả về đúng format VN
  return `${datePart.split("-").reverse().join("/")} ${timePart}`;
}

/** ===== helpers ===== */
function pad2(n) {
  return String(n).padStart(2, "0");
}
function toDateInput(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function startOfMonthInput() {
  const d = new Date();
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  return toDateInput(first);
}
function todayInput() {
  return toDateInput(new Date());
}
function fmtDuration(sec = 0) {
  const s = Math.max(0, Number(sec) || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${r}s`;
  return `${r}s`;
}
function safeStr(x) {
  return (x ?? "").toString();
}
function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

// ===== Glass theme (soft modern) =====
const appBg = "bg-gradient-to-br from-slate-50 via-white to-indigo-50";
const glass =
  "bg-white/55 backdrop-blur-xl border border-white/60 shadow-[0_12px_40px_-20px_rgba(2,6,23,0.25)]";
const glassStrong =
  "bg-white/70 backdrop-blur-xl border border-white/70 shadow-[0_14px_50px_-28px_rgba(2,6,23,0.35)]";
const softRing = "ring-1 ring-black/5";

const neuBg = "bg-slate-100"; 
const neuShadow = "shadow-[10px_10px_24px_rgba(15,23,42,0.12),-10px_-10px_24px_rgba(255,255,255,0.9)]"; 
const neuShadowInset = "shadow-[inset_10px_10px_18px_rgba(15,23,42,0.12),inset_-10px_-10px_18px_rgba(255,255,255,0.95)]"; 
const neuRing = "ring-1 ring-white/60";

function NeuCard({ title, sub, icon, right, children }) {
  return (
    <div className={`${glass} ${softRing} rounded-3xl overflow-hidden`}>
      <div className="px-4 sm:px-5 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-11 w-11 rounded-2xl bg-[#e8ecef] text-black grid place-items-center shadow-sm">
            {icon}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-slate-900 truncate">{title}</div>
            {sub ? <div className="text-xs text-slate-500 truncate">{sub}</div> : null}
          </div>
        </div>
        {right}
      </div>
      <div className="px-4 sm:px-5 pb-5">{children}</div>
    </div>
  );
}

function NeuPill({ children }) {
  return (
    <span className={`${neuBg} ${neuShadowInset} ${neuRing} rounded-full px-3 py-1 text-xs text-slate-600`}>
      {children}
    </span>
  );
}

function NeuInput(props) {
  return (
    <input
      {...props}
      className={[
        "w-full sm:w-auto text-sm text-slate-800 placeholder:text-slate-400",
        "rounded-2xl px-3.5 py-2.5",
        "bg-white/70 backdrop-blur border border-white/70 shadow-sm",
        "focus:outline-none focus:ring-2 focus:ring-indigo-400/40",
        props.className || "",
      ].join(" ")}
    />
  );
}

function NeuSelect(props) {
  return (
    <select
      {...props}
      className={[
        "w-full sm:w-auto text-sm text-slate-800",
        "rounded-2xl px-3.5 py-2.5",
        "bg-white/70 backdrop-blur border border-white/70 shadow-sm",
        "focus:outline-none focus:ring-2 focus:ring-indigo-400/40",
        "min-w-0",
        props.className || "",
      ].join(" ")}
    />
  );
}

function NeuButton({ children, ...props }) {
  return (
    <button
      {...props}
      className={[
        "inline-flex items-center justify-center gap-2 text-sm font-semibold",
        "rounded-2xl px-3.5 py-2.5",
        "bg-slate-900 text-white shadow-sm",
        "hover:opacity-95 active:opacity-90",
        "disabled:opacity-60 disabled:cursor-wait",
        props.className || "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function StatusDot({ online }) {
  return (
    <span
      className={[
        "inline-flex h-2.5 w-2.5 rounded-full",
        online ? "bg-emerald-500" : "bg-slate-400",
        "shadow-[0_0_0_6px_rgba(16,185,129,0.10)]",
      ].join(" ")}
    />
  );
}

/** ===== charts (no library) ===== */
function MiniBarChart({ data = [], height = 86 }) {
  const max = Math.max(1, ...data.map((d) => Number(d.value) || 0));
  const cols = Math.max(10, data.length);

  return (
    <div className="w-full">
      <div
        className="grid items-end gap-2"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
      >
        {data.map((d, i) => {
          const v = Number(d.value) || 0;
          const h = Math.round((v / max) * height);
          return (
            <div key={i} className="flex flex-col items-center gap-2">
              <div
                title={`${d.label}: ${v}`}
                className={`${neuBg} ${neuShadowInset} ${neuRing} w-full rounded-2xl relative overflow-hidden`}
                style={{ height }}
              >
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-2xl bg-slate-800/90"
                  style={{ height: h }}
                />
              </div>
              <div className="text-[10px] text-slate-500 w-full text-center truncate">
                {d.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DonutGauge({ value = 0, max = 1, label }) {
  const pct = clamp(max <= 0 ? 0 : value / max, 0, 1);
  const size = 96;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * pct;

  return (
    <div className="flex items-center gap-3">
      <div className={`${neuBg} ${neuShadowInset} ${neuRing} rounded-[26px] p-3`}>
        <svg width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="rgba(100,116,139,0.25)"
            strokeWidth={stroke}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="rgba(15,23,42,0.85)"
            strokeWidth={stroke}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c - dash}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
      </div>

      <div className="min-w-0">
        <div className="text-sm font-semibold text-slate-900">{label}</div>
        <div className="text-xs text-slate-500">{Math.round(pct * 100)}%</div>
      </div>
    </div>
  );
}

/** ===== pagination ===== */
function usePagination(items, pageSize) {
  const [page, setPage] = useState(1);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  const slice = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return { page: safePage, setPage, totalPages, total, slice, pageSize };
}

function Pager({ paging }) {
  const { page, setPage, totalPages, total, pageSize } = paging;
  const left = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const right = Math.min(page * pageSize, total);

  return (
    <div className="mt-3 flex flex-col items-start gap-2">
      <div className="text-xs text-slate-500 text-left">
        {left}-{right} / {total}
      </div>

      <div className="flex items-center justify-start gap-2 w-full">
        <NeuButton
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="h-10 min-w-[44px] px-0 sm:h-auto sm:min-w-0 sm:px-3.5"
        >
          <FiChevronLeft />
        </NeuButton>

        <div className="min-w-[52px] text-left text-xs text-slate-600">
          {page}/{totalPages}
        </div>

        <NeuButton
          onClick={() => setPage(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="h-10 min-w-[44px] px-0 sm:h-auto sm:min-w-0 sm:px-3.5"
        >
          <FiChevronRight />
        </NeuButton>
      </div>
    </div>
  );
}

export default function UsageDashboard() {
  /** range filter */
  const [fromDate, setFromDate] = useState(startOfMonthInput());
  const [toDate, setToDate] = useState(todayInput());

  const [loading, setLoading] = useState(true);

  const [onlineList, setOnlineList] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [topPages, setTopPages] = useState([]);

  /** NEW: per-user top pages */
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedUserPages, setSelectedUserPages] = useState([]);
  const [loadingUserPages, setLoadingUserPages] = useState(false);

  /** local filters */
  const [qUser, setQUser] = useState("");
  const [qPage, setQPage] = useState("");

  /** derived lists */
  const onlineFiltered = useMemo(() => {
    const q = safeStr(qUser).trim().toLowerCase();
    const arr = Array.isArray(onlineList) ? onlineList : [];
    if (!q) return arr;
    return arr.filter((u) => {
      const t = `${safeStr(u.fullName)} ${safeStr(u.username)} ${safeStr(u.role)}`.toLowerCase();
      return t.includes(q);
    });
  }, [onlineList, qUser]);

  const topUsersFiltered = useMemo(() => {
    const q = safeStr(qUser).trim().toLowerCase();
    const arr = Array.isArray(topUsers) ? topUsers : [];
    if (!q) return arr;
    return arr.filter((u) => {
      const t = `${safeStr(u.fullName)} ${safeStr(u.username)} ${safeStr(u.role)}`.toLowerCase();
      return t.includes(q);
    });
  }, [topUsers, qUser]);

  const topPagesFiltered = useMemo(() => {
    const q = safeStr(qPage).trim().toLowerCase();
    const arr = Array.isArray(topPages) ? topPages : [];
    if (!q) return arr;
    return arr.filter((p) => safeStr(p.page).toLowerCase().includes(q));
  }, [topPages, qPage]);

  /** paging */
  const onlinePaging = usePagination(onlineFiltered, 10);
  const usersPaging = usePagination(topUsersFiltered, 10);
  const pagesPaging = usePagination(topPagesFiltered, 10);
  const userPagesPaging = usePagination(
    useMemo(() => (Array.isArray(selectedUserPages) ? selectedUserPages : []), [selectedUserPages]),
    10
  );

  /** KPIs */
  const onlineCount = useMemo(() => {
    return (onlineList || []).filter((x) => x.isOnline === 1 || x.isOnline === true).length;
  }, [onlineList]);

  const totalOnlineSeconds = useMemo(() => {
    return (onlineList || []).reduce(
      (acc, x) => acc + (Number(x.totalOnlineTodaySeconds) || 0),
      0
    );
  }, [onlineList]);

  const totalPageViews = useMemo(() => {
    return (topPages || []).reduce((a, x) => a + (Number(x.views) || 0), 0);
  }, [topPages]);

  const offlineCount = useMemo(() => {
    const total = (onlineList || []).length;
    return Math.max(0, total - onlineCount);
  }, [onlineList, onlineCount]);

  /** chart data */
  const chartTopUsers = useMemo(() => {
    const arr = (topUsers || []).slice(0, 10);
    return arr.map((u) => ({
      label: (u.fullName || u.username || "").toString().split(" ").slice(-1)[0] || "User",
      value: Number(u.totalSeconds) || 0,
    }));
  }, [topUsers]);

  const chartTopPages = useMemo(() => {
    const arr = (topPages || []).slice(0, 10);
    return arr.map((p) => ({
      label: safeStr(p.page).split("/").filter(Boolean).slice(-1)[0] || "page",
      value: Number(p.views) || 0,
    }));
  }, [topPages]);

  const chartSelectedUserPages = useMemo(() => {
    const arr = (selectedUserPages || []).slice(0, 10);
    return arr.map((p) => ({
      label: safeStr(p.page).split("/").filter(Boolean).slice(-1)[0] || "page",
      value: Number(p.views) || 0,
    }));
  }, [selectedUserPages]);

  /** API load */
  const refresh = async () => {
    setLoading(true);
    try {
      const rOnline = await http.get("/api/presence/today");

      let rTopUsers;
      try {
        rTopUsers = await http.get("/api/presence/top-users-range", {
          params: { from: fromDate, to: toDate },
        });
      } catch {
        rTopUsers = await http.get("/api/presence/top-users", { params: { date: toDate } });
      }

      let rTopPages;
      try {
        rTopPages = await http.get("/pageview/top-pages-range", {
          params: { from: fromDate, to: toDate },
        });
      } catch {
        rTopPages = await http.get("/pageview/top-pages", { params: { date: toDate } });
      }

      const onlineData = rOnline?.data?.data || [];
      setOnlineList(onlineData);
      setTopUsers(rTopUsers?.data?.data || []);
      setTopPages(rTopPages?.data?.data || []);

      // auto pick a user if none selected
      if (!selectedUserId && onlineData?.length) {
        setSelectedUserId(String(onlineData[0]?.userID ?? ""));
      }
    } catch (e) {
      console.error("UsageDashboard load error:", e);
      setOnlineList([]);
      setTopUsers([]);
      setTopPages([]);
    } finally {
      setLoading(false);
    }
  };

  /** NEW: load pages for selected user */
  const loadSelectedUserPages = async (uid) => {
    if (!uid) {
      setSelectedUserPages([]);
      return;
    }
    setLoadingUserPages(true);
    try {
      // Recommended endpoint:
      // GET /api/pageview/top-pages-by-user?userId=...&from=...&to=...
      const r = await http.get("/pageview/top-pages-by-user", {
        params: { userId: uid, from: fromDate, to: toDate },
      });
      setSelectedUserPages(r?.data?.data || []);
    } catch (e) {
      // fallback (nếu BE chưa có) -> show empty, không crash
      console.warn("top-pages-by-user missing or failed:", e);
      setSelectedUserPages([]);
    } finally {
      setLoadingUserPages(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate]);

  useEffect(() => {
    loadSelectedUserPages(selectedUserId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId, fromDate, toDate]);

  /** UI header selects */
  const userOptions = useMemo(() => {
    const arr = Array.isArray(onlineList) ? onlineList : [];
    return arr
      .map((u) => ({
        userID: String(u.userID ?? ""),
        label: `${u.fullName || u.username || "User"} (${u.username || "?"})`,
      }))
      .filter((x) => x.userID);
  }, [onlineList]);

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1200px] space-y-4 sm:space-y-5">
        {/* ===== Header ===== */}
        <div className={`${neuBg} ${neuShadow} ${neuRing} rounded-[28px] p-4 sm:p-5`}>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-3">
                <span className={`${neuBg} ${neuShadowInset} rounded-2xl h-11 w-11 grid place-items-center text-slate-700`}>
                  <FiBarChart2 />
                </span>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 truncate">
                    Trung tâm theo dõi hoạt động
                  </h1>
                  <div className="text-sm text-slate-500 mt-0.5">
                    Online • Thời gian • Trang truy cập
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[11px] text-slate-500 mb-1">Từ ngày</div>
                  <NeuInput type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 mb-1">Đến ngày</div>
                  <NeuInput type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                </div>
              </div>

              <NeuButton onClick={refresh} disabled={loading} className="h-[42px]">
                <FiRefreshCcw className={loading ? "animate-spin" : ""} />
                {loading ? "Đang tải" : "Làm mới"}
              </NeuButton>
            </div>
          </div>
        </div>

        {/* ===== KPIs ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className={`${neuBg} ${neuShadow} ${neuRing} rounded-[28px] p-4`}>
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-500">Online</div>
              <span className={`${neuBg} ${neuShadowInset} rounded-2xl h-10 w-10 grid place-items-center text-slate-700`}>
                <FiUsers />
              </span>
            </div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">{onlineCount}</div>
            <div className="mt-2">
              <DonutGauge value={onlineCount} max={Math.max(1, onlineCount + offlineCount)} label="Tỷ lệ online" />
            </div>
          </div>

          <div className={`${neuBg} ${neuShadow} ${neuRing} rounded-[28px] p-4`}>
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-500">Tổng thời gian</div>
              <span className={`${neuBg} ${neuShadowInset} rounded-2xl h-10 w-10 grid place-items-center text-slate-700`}>
                <FiClock />
              </span>
            </div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">{fmtDuration(totalOnlineSeconds)}</div>
            <div className="mt-2 text-xs text-slate-500">Tất cả user (presence)</div>
          </div>

          <div className={`${neuBg} ${neuShadow} ${neuRing} rounded-[28px] p-4`}>
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-500">Lượt xem</div>
              <span className={`${neuBg} ${neuShadowInset} rounded-2xl h-10 w-10 grid place-items-center text-slate-700`}>
                <FiHash />
              </span>
            </div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">{totalPageViews}</div>
            <div className="mt-2 text-xs text-slate-500">Pageview</div>
          </div>
        </div>

        {/* ===== Charts ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <NeuCard
            title="Top người dùng"
            sub="Thời gian online"
            icon={<FiUsers />}
            right={<NeuPill>{fromDate} → {toDate}</NeuPill>}
          >
            {chartTopUsers.length === 0 ? (
              <div className="text-sm text-slate-500">Chưa có dữ liệu</div>
            ) : (
              <MiniBarChart data={chartTopUsers} />
            )}
          </NeuCard>

          <NeuCard
            title="Top trang"
            sub="Lượt xem"
            icon={<FiBarChart2 />}
            right={<NeuPill>{fromDate} → {toDate}</NeuPill>}
          >
            {chartTopPages.length === 0 ? (
              <div className="text-sm text-slate-500">Chưa có dữ liệu</div>
            ) : (
              <MiniBarChart data={chartTopPages} />
            )}
          </NeuCard>
        </div>

        {/* ===== NEW: Selected user -> top pages ===== */}
        <NeuCard
          title="User vào trang nào nhiều nhất"
          sub="Theo user bạn chọn"
          icon={<FiUser />}
          right={
            <div className="flex items-center gap-2">
              <NeuPill>{fromDate} → {toDate}</NeuPill>
              <div className="hidden md:block w-[350px] min-w-0">
  <NeuSelect
    value={selectedUserId}
    onChange={(e) => {
      userPagesPaging.setPage(1);
      setSelectedUserId(e.target.value);
    }}
    className="w-full min-w-0"
  >
    <option value="">-- Chọn user --</option>

    {userOptions.map((o) => (
      <option key={o.userID} value={o.userID}>
        {o.label}
      </option>
    ))}
  </NeuSelect>
</div>
            </div>
          }
        >
          {/* mobile select */}
          <div className="md:hidden mb-3">
            <NeuSelect
              value={selectedUserId}
              onChange={(e) => {
                userPagesPaging.setPage(1);
                setSelectedUserId(e.target.value);
              }}
            >
              <option value="">-- Chọn user --</option>
              {userOptions.map((o) => (
                <option key={o.userID} value={o.userID}>
                  {o.label}
                </option>
              ))}
            </NeuSelect>
          </div>

          {loadingUserPages ? (
            <div className="text-sm text-slate-500">Đang tải...</div>
          ) : selectedUserId && selectedUserPages.length === 0 ? (
            <div className="text-sm text-slate-500">
              Chưa có dữ liệu (hoặc BE chưa có endpoint <code>/api/pageview/top-pages-by-user</code>)
            </div>
          ) : (
            <>
              <div className="mb-4">
                <MiniBarChart data={chartSelectedUserPages} />
              </div>

              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="text-slate-500">
                    <tr className="border-b border-white/40">
                      <th className="text-left py-2 pr-3">Trang</th>
                      <th className="text-right py-2">Views</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userPagesPaging.slice.map((p, idx) => (
                      <tr key={idx} className="border-b border-white/30">
                        <td className="py-2 pr-3">
                          <div className="text-slate-900 break-all font-medium">{p.page}</div>
                        </td>
                        <td className="py-2 text-right font-semibold text-slate-900">{p.views}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pager paging={userPagesPaging} />
            </>
          )}
        </NeuCard>

        {/* ===== Tables ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Users status */}
          <NeuCard
            title="Người dùng"
            sub="Online / Offline"
            icon={<FiUsers />}
            right={
              <div className="w-[240px] hidden sm:block">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={qUser}
                    onChange={(e) => {
                      onlinePaging.setPage(1);
                      usersPaging.setPage(1);
                      setQUser(e.target.value);
                    }}
                    placeholder="Tìm user..."
                    className={[
                      "w-full text-sm text-slate-700 placeholder:text-slate-400",
                      `${neuBg} ${neuShadowInset} ${neuRing} rounded-2xl pl-9 pr-3.5 py-2`,
                      "focus:outline-none focus:ring-2 focus:ring-slate-900/10",
                    ].join(" ")}
                  />
                </div>
              </div>
            }
          >
            <div className="sm:hidden mb-3">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={qUser}
                  onChange={(e) => {
                    onlinePaging.setPage(1);
                    usersPaging.setPage(1);
                    setQUser(e.target.value);
                  }}
                  placeholder="Tìm user..."
                  className={[
                    "w-full text-sm text-slate-700 placeholder:text-slate-400",
                    `${neuBg} ${neuShadowInset} ${neuRing} rounded-2xl pl-9 pr-3.5 py-2.5`,
                    "focus:outline-none focus:ring-2 focus:ring-slate-900/10",
                  ].join(" ")}
                />
              </div>
            </div>

            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-slate-500">
                  <tr className="border-b border-white/40">
                    <th className="text-left py-2 pr-3">Tên</th>
                    <th className="text-left py-2 pr-3">TT</th>
                    <th className="text-right py-2">Hôm nay</th>
                  </tr>
                </thead>
                <tbody>
                  {onlinePaging.slice.map((u) => (
                    <tr key={u.userID} className="border-b border-white/30">
                      <td className="py-2 pr-3">
                        <div className="font-medium text-slate-900">{u.fullName || u.username}</div>
                        <div className="text-xs text-slate-500">{u.username}</div>
                      </td>
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-2">
                          <StatusDot online={!!u.isOnline} />
                          <span className="text-slate-700">{u.isOnline ? "Online" : "Offline"}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          {fmtDbDateTime(u.lastOnline)}
                        </div>
                      </td>
                      <td className="py-2 text-right font-semibold text-slate-900">
                        {fmtDuration(u.totalOnlineTodaySeconds)}
                      </td>
                    </tr>
                  ))}
                  {!loading && onlinePaging.total === 0 && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-500">
                        Không có dữ liệu
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pager paging={onlinePaging} />
          </NeuCard>

          {/* Top pages */}
          <NeuCard
            title="Top trang"
            sub="Lượt xem"
            icon={<FiBarChart2 />}
            right={
              <div className="w-[240px] hidden sm:block">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={qPage}
                    onChange={(e) => {
                      pagesPaging.setPage(1);
                      setQPage(e.target.value);
                    }}
                    placeholder="Tìm trang..."
                    className={[
                      "w-full text-sm text-slate-700 placeholder:text-slate-400",
                      `${neuBg} ${neuShadowInset} ${neuRing} rounded-2xl pl-9 pr-3.5 py-2`,
                      "focus:outline-none focus:ring-2 focus:ring-slate-900/10",
                    ].join(" ")}
                  />
                </div>
              </div>
            }
          >
            <div className="sm:hidden mb-3">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={qPage}
                  onChange={(e) => {
                    pagesPaging.setPage(1);
                    setQPage(e.target.value);
                  }}
                  placeholder="Tìm trang..."
                  className={[
                    "w-full text-sm text-slate-700 placeholder:text-slate-400",
                    `${neuBg} ${neuShadowInset} ${neuRing} rounded-2xl pl-9 pr-3.5 py-2.5`,
                    "focus:outline-none focus:ring-2 focus:ring-slate-900/10",
                  ].join(" ")}
                />
              </div>
            </div>

            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-slate-500">
                  <tr className="border-b border-white/40">
                    <th className="text-left py-2 pr-3">Trang</th>
                    <th className="text-right py-2">Views</th>
                  </tr>
                </thead>
                <tbody>
                  {pagesPaging.slice.map((p, idx) => (
                    <tr key={idx} className="border-b border-white/30">
                      <td className="py-2 pr-3">
                        <div className="font-medium text-slate-900 break-all">{p.page}</div>
                      </td>
                      <td className="py-2 text-right font-semibold text-slate-900">{p.views}</td>
                    </tr>
                  ))}
                  {!loading && pagesPaging.total === 0 && (
                    <tr>
                      <td colSpan={2} className="py-8 text-center text-slate-500">
                        Chưa có dữ liệu
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pager paging={pagesPaging} />
          </NeuCard>
        </div>

        {/* Top users table */}
        <NeuCard
          title="Top người dùng"
          sub="Thời gian online"
          icon={<FiClock />}
          right={<NeuPill>{fromDate} → {toDate}</NeuPill>}
        >
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-500">
                <tr className="border-b border-white/40">
                  <th className="text-left py-2 pr-3">Tên</th>
                  <th className="text-left py-2 pr-3">Role</th>
                  <th className="text-left py-2 pr-3">Last</th>
                  <th className="text-right py-2">Tổng</th>
                </tr>
              </thead>
              <tbody>
                {usersPaging.slice.map((u) => (
                  <tr key={u.userID} className="border-b border-white/30">
                    <td className="py-2 pr-3">
                      <div className="font-medium text-slate-900">{u.fullName || u.username}</div>
                      <div className="text-xs text-slate-500">{u.username}</div>
                    </td>
                    <td className="py-2 pr-3 text-slate-700">{u.role || "-"}</td>
                    <td className="py-2 pr-3 text-slate-700">
                      {fmtDbDateTime(u.lastOnline)}
                    </td>
                    <td className="py-2 text-right font-semibold text-slate-900">
                      {fmtDuration(u.totalSeconds)}
                    </td>
                  </tr>
                ))}
                {!loading && usersPaging.total === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      Không có dữ liệu
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pager paging={usersPaging} />
        </NeuCard>
      </div>
    </div>
  );
}





