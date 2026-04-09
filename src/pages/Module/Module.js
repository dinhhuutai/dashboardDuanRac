// import React, { useEffect, useMemo, useState } from "react";
// import axios from "axios";
// import {
//   FiPlus, FiEdit2, FiTrash2, FiSearch, FiX,
// } from "react-icons/fi";
// import * as FiIcons from "react-icons/fi";
// import * as FcIcons from "react-icons/fc";
// import { Combobox } from "@headlessui/react";
// import { BASE_URL } from "~/config";
// import { useSelector } from "react-redux";
// import { userSelector } from "~/redux/selectors";
// import http from '~/api/http';

// /* ---------- Modal đơn giản ---------- */
// const Modal = ({ open, onClose, title, children }) => {
//   if (!open) return null;
//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
//       <div className="absolute inset-0 bg-black/30" onClick={onClose} />
//       <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 overflow-hidden">
//         <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
//           <h3 className="font-semibold">{title}</h3>
//           <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-50" aria-label="Đóng">
//             <FiX />
//           </button>
//         </div>
//         <div className="p-5">{children}</div>
//       </div>
//     </div>
//   );
// };

// /* ---------- Danh sách ~50 icon hay dùng (Feather) ---------- */
// const ALLOWED_ICON_NAMES = Object.keys(FcIcons);

// /* Lọc ra những icon thực sự tồn tại trong react-icons/fi (phòng lỗi chính tả) */
// const ICON_OPTIONS = ALLOWED_ICON_NAMES.filter((n) => typeof FcIcons[n] === "function");

// /* ---------- Render icon theo tên (hoặc URL ảnh) ---------- */
// const IconOrImg = ({ icon, className = "h-6 w-6" }) => {
//   if (!icon) {
//     return <FiIcons.FiGrid className={`${className} text-slate-800`} />;
//   }

//   // Feather icon
//   if (/^Fi[A-Za-z0-9]+$/.test(icon) && typeof FiIcons[icon] === "function") {
//     const Cmp = FiIcons[icon];
//     return <Cmp className={`${className} text-slate-800`} />;
//   }

//   // Flat color icon
//   if (/^Fc[A-Za-z0-9]+$/.test(icon) && typeof FcIcons[icon] === "function") {
//     const Cmp = FcIcons[icon];
//     return <Cmp className={className} />;
//   }

//   // URL ảnh
//   return <img src={icon} alt="" className={`${className} object-contain`} />;
// };

// /* ---------- Component chính ---------- */
// function Module() {
//   const [rows, setRows] = useState([]);
//   const [q, setQ] = useState("");
//   const [page, setPage] = useState(1);
//   const [pageSize] = useState(10);
//   const [total, setTotal] = useState(0);
//   const [loading, setLoading] = useState(false);

//   const [modalOpen, setModalOpen] = useState(false);
//   const [editing, setEditing] = useState(null);
//   const [form, setForm] = useState({
//   name: "",
//   moduleKey: "",      // NEW
//   icon: "FiGrid",
//   description: ""
// });


//   const [saving, setSaving] = useState(false);

//   const [delId, setDelId] = useState(null);
//   const [msg, setMsg] = useState({ type: "", text: "" });

  
//     const tmp = useSelector(userSelector);
//     const [user, setUser] = useState({});
  
//     useEffect(() => {
//       setUser(tmp?.login?.currentUser);
//     }, [tmp]);

//   // state cho combobox icon
//   const [iconQuery, setIconQuery] = useState("");
//   const filteredIconOptions =
//     iconQuery.trim() === ""
//       ? ICON_OPTIONS.slice(0, 60)
//       : ICON_OPTIONS.filter((n) => n.toLowerCase().includes(iconQuery.toLowerCase())).slice(0, 50);

//   const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

//   const fetchData = async () => {
//     try {
//       setLoading(true);
//       const res = await http.get(`${BASE_URL}/api/modules`, { params: { q, page, pageSize } });
//       if (res.data?.success) {
//         setRows(res.data.data || []);
//         setTotal(res.data.pagination?.total || 0);
//       } else {
//         setMsg({ type: "error", text: "Không tải được dữ liệu modules." });
//       }
//     } catch {
//       setMsg({ type: "error", text: "Lỗi kết nối máy chủ." });
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => { fetchData(); }, [q, page]);

//   const openCreate = () => {
//   setEditing(null);
//   setForm({ name: "", moduleKey: "", icon: "FiGrid", description: "" });
//   setIconQuery("");
//   setModalOpen(true);
// };

// const openEdit = (row) => {
//   setEditing(row);
//   setForm({
//     name: row.name || "",
//     moduleKey: row.moduleKey || "",  // NEW
//     icon: row.icon || "FiGrid",
//     description: row.description || "",
//   });
//   setIconQuery("");
//   setModalOpen(true);
// };



//   const save = async () => {
//   if (!form.name.trim()) {
//     setMsg({ type: "error", text: "Tên module là bắt buộc." });
//     return;
//   }
//   // chuẩn hóa moduleKey: slug [a-z0-9-]
//   const normalizedKey = (form.moduleKey || form.name || "")
//     .toLowerCase()
//     .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // bỏ dấu tiếng Việt
//     .replace(/[^a-z0-9]+/g, "-")
//     .replace(/(^-|-$)/g, "");

//   if (!/^[a-z0-9-]{2,64}$/.test(normalizedKey)) {
//     setMsg({ type: "error", text: "Key không hợp lệ (chỉ [a-z0-9-], 2-64 ký tự)." });
//     return;
//   }

//   try {
//     setSaving(true);
//     const payload = { ...form, moduleKey: normalizedKey };

//     if (editing) {
//       const res = await http.put(`${BASE_URL}/api/modules/${editing.moduleId}`, payload);
//       if (res.data?.success) {
//         setMsg({ type: "success", text: "Đã cập nhật module." });
//         setModalOpen(false);
//         fetchData();
//       } else {
//         setMsg({ type: "error", text: res.data?.message || "Cập nhật thất bại." });
//       }
//     } else {
//       const res = await http.post(`${BASE_URL}/api/modules`, payload);
//       if (res.data?.success) {
//         setMsg({ type: "success", text: "Đã tạo module." });
//         setModalOpen(false);
//         setPage(1);
//         fetchData();
//       } else {
//         setMsg({ type: "error", text: res.data?.message || "Tạo thất bại." });
//       }
//     }
//   } catch (e) {
//     setMsg({
//       type: "error",
//       text:
//         e?.response?.status === 409
//           ? "Tên hoặc Key module đã tồn tại."
//           : "Lỗi kết nối máy chủ.",
//     });
//   } finally {
//     setSaving(false);
//   }
// };



//   const doDelete = async () => {
//     if (!delId) return;
//     try {
//       const res = await http.delete(`${BASE_URL}/api/modules/${delId}`);
//       if (res.data?.success) {
//         setMsg({ type: "success", text: "Đã xoá module." });
//         if (rows.length === 1 && page > 1) setPage((p) => p - 1);
//         fetchData();
//       } else {
//         setMsg({ type: "error", text: res.data?.message || "Xoá thất bại." });
//       }
//     } catch {
//       setMsg({ type: "error", text: "Lỗi kết nối máy chủ." });
//     } finally {
//       setDelId(null);
//     }
//   };

//   const SelectedIcon = (typeof FcIcons[form.icon] === "function" ? FcIcons[form.icon] : FiIcons.FiGrid);

//   return (
//     <div className="min-h-[70vh]">
//       {/* Header thanh công cụ */}
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
//         <div>
//           <h1 className="text-lg font-semibold text-slate-900">Quản lý Modules</h1>
//           <p className="text-sm text-slate-500">Danh sách phân hệ hiển thị trên trang chủ</p>
//         </div>
//         <div className="flex items-center gap-2">
//           <div className="relative">
//             <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
//             <input
//               value={q}
//               onChange={(e) => { setQ(e.target.value); setPage(1); }}
//               placeholder="Tìm theo tên/mô tả…"
//               className="w-64 max-w-[60vw] rounded-xl bg-white/70 pl-9 pr-3 py-2 text-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
//             />
//           </div>
//           <button
//             disabled={!(user?.userID === 1 || user?.userID === 3)}
//             onClick={openCreate}
//             className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
//           >
//             <FiPlus /> Thêm module
//           </button>
//         </div>
//       </div>

//       {/* Bảng dữ liệu */}
//       <div className="rounded-2xl bg-white/70 backdrop-blur ring-1 ring-slate-200 shadow-sm overflow-hidden">
//         <div className="overflow-x-auto p-4 sm:p-6">
//           <table className="min-w-full border-separate border-spacing-y-2">
//             <thead>
//               <tr className="text-left text-xs uppercase text-slate-500">
//                 <th className="px-3 py-2">ID</th>
//                 <th className="px-3 py-2">Tên module</th>
//                 <th className="px-3 py-2">Key</th>
//                 <th className="px-3 py-2">Icon</th>
//                 <th className="px-3 py-2">Mô tả</th>
//                 <th className="px-3 py-2 w-40">Thao tác</th>
//               </tr>
//             </thead>
//             <tbody>
//               {loading ? (
//                 <tr><td colSpan={5} className="px-3 py-8 text-center text-slate-500">Đang tải…</td></tr>
//               ) : rows.length === 0 ? (
//                 <tr><td colSpan={5} className="px-3 py-8 text-center text-slate-500">Không có dữ liệu</td></tr>
//               ) : (
//                 rows.map((r) => (
//                   <tr key={r.moduleId} className="bg-white/80 ring-1 ring-slate-200">
//                     <td className="px-3 py-2 align-top">{r.moduleId}</td>
//                     <td className="px-3 py-2 align-top font-medium text-slate-800">{r.name}</td>
//                     <td className="px-3 py-2 align-top">
//   <code className="text-xs bg-slate-50 px-1.5 py-0.5 rounded ring-1 ring-slate-200">
//     {r.moduleKey}
//   </code>
// </td>

//                     <td className="px-3 py-2 align-top">
//                       <div className="inline-flex items-center gap-2 rounded-lg bg-white px-2.5 py-1 ring-1 ring-slate-200">
//                         <IconOrImg icon={r.icon} />
//                         <span className="text-xs text-slate-600">{r.icon || "—"}</span>
//                       </div>
//                     </td>
//                     <td className="px-3 py-2 align-top text-slate-600">
//                       {r.description || <span className="text-slate-400">—</span>}
//                     </td>
//                     <td className="px-3 py-2 align-top">
//                       <div className="flex items-center gap-2">
//                         <button
//             disabled={!(user?.userID === 1 || user?.userID === 3)}
//                           onClick={() => openEdit(r)}
//                           className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm ring-1 ring-slate-200 hover:bg-slate-50"
//                         >
//                           <FiEdit2 /> Sửa
//                         </button>
//                         <button
//             disabled={!(user?.userID === 1 || user?.userID === 3)}
//                           onClick={() => setDelId(r.moduleId)}
//                           className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm text-red-600 ring-1 ring-red-200 hover:bg-red-50"
//                         >
//                           <FiTrash2 /> Xoá
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>

//           {/* Phân trang */}
//           <div className="mt-4 flex items-center justify-between">
//             <p className="text-sm text-slate-600">Trang {page}/{totalPages} — Tổng {total} mục</p>
//             <div className="flex items-center gap-2">
//               <button
//                 onClick={() => setPage((p) => Math.max(1, p - 1))}
//                 disabled={page <= 1}
//                 className="rounded-lg bg-white px-3 py-1.5 text-sm ring-1 ring-slate-200 disabled:opacity-50 hover:bg-slate-50"
//               >
//                 Trước
//               </button>
//               <button
//                 onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
//                 disabled={page >= totalPages}
//                 className="rounded-lg bg-white px-3 py-1.5 text-sm ring-1 ring-slate-200 disabled:opacity-50 hover:bg-slate-50"
//               >
//                 Sau
//               </button>
//             </div>
//           </div>

//           {/* Thông báo */}
//           {msg.text && (
//             <div className={`mt-4 rounded-xl px-3 py-2 text-sm ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-red-50 text-red-700 ring-1 ring-red-200'}`}>
//               {msg.text}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Modal Thêm/Sửa */}
//       <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Cập nhật module" : "Thêm module"}>
//         <div className="grid gap-4">
//           <div>
//             <label className="text-sm font-medium text-slate-700">
//               Tên module <span className="text-red-500">*</span>
//             </label>
//             <input
//               value={form.name}
//               onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
//               className="mt-1 w-full rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
//               placeholder="vd: Quản lý công việc"
//             />
//           </div>

//           <div>
//   <label className="text-sm font-medium text-slate-700">
//     Key (duy nhất) <span className="text-red-500">*</span>
//   </label>
//   <input
//     value={form.moduleKey}
//     onChange={(e) =>
//       setForm((p) => ({ ...p, moduleKey: e.target.value }))
//     }
//     className="mt-1 w-full rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
//     placeholder="vd: trash-weigh, ink-weigh, suggestion-box…"
//   />
//   <p className="mt-1 text-xs text-slate-500">
//     Dùng chữ thường, số, dấu gạch ngang. Ví dụ: <b>ink-weigh</b>, <b>trash-weigh</b>.
//   </p>
// </div>



//           {/* Icon Picker (Combobox) */}
//           <div>
//             <label className="text-sm font-medium text-slate-700">Icon</label>
//             <Combobox value={form.icon} onChange={(val) => setForm((p) => ({ ...p, icon: val }))}>
//               <div className="relative">
//                 {/* Control */}
//                 <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/40">
//                   <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-200">
//                     <SelectedIcon />
//                   </span>
//                   <Combobox.Input
//                     className="w-full bg-transparent text-sm outline-none placeholder-slate-400"
//                     onChange={(e) => setIconQuery(e.target.value)}
//                     displayValue={(val) => val}
//                     placeholder="Tìm icon (ví dụ: FiGrid, FiUsers...)"
//                   />
//                   <Combobox.Button className="text-slate-400 hover:text-slate-600">
//                     <FiIcons.FiChevronDown />
//                   </Combobox.Button>
//                 </div>

//                 {/* Options */}
//                 <Combobox.Options className="absolute z-20 mt-2 w-full max-h-64 overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
//                   {filteredIconOptions.length === 0 ? (
//                     <li className="px-3 py-2 text-sm text-slate-500">Không tìm thấy</li>
//                   ) : (
//                     filteredIconOptions.map((iconName) => {
//                       const IconCmp = FcIcons[iconName];
//                       return (
//                         <Combobox.Option
//                           key={iconName}
//                           value={iconName}
//                           className={({ active, selected }) =>
//                             [
//                               "flex items-center gap-3 rounded-lg px-2 py-2 cursor-pointer",
//                               active ? "bg-indigo-50" : "",
//                               selected ? "ring-1 ring-inset ring-indigo-200" : "ring-1 ring-transparent",
//                             ].join(" ")
//                           }
//                         >
//                           {({ selected }) => (
//                             <>
//                               <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-200">
//                                 <IconCmp />
//                               </span>
//                               <span className="text-sm text-slate-800 flex-1">{iconName}</span>
//                               {selected && <span className="text-indigo-600 text-xs font-medium">Đã chọn</span>}
//                             </>
//                           )}
//                         </Combobox.Option>
//                       );
//                     })
//                   )}
//                 </Combobox.Options>
//               </div>
//             </Combobox>

//             {/* Preview line */}
//             <div className="flex items-center gap-2 text-slate-600 pt-1">
//               <span className="text-[11px] uppercase tracking-wide">Xem trước</span>
//               <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-200">
//                 <SelectedIcon />
//               </span>
//               <span className="text-sm font-medium text-slate-800">{form.icon}</span>
//             </div>

//             <p className="mt-1 text-xs text-slate-500">
//               Chọn 1 trong ~50 biểu tượng thường dùng. Hoặc bạn có thể lưu <b>URL ảnh</b> vào trường Icon (nhập thẳng URL).
//             </p>
//           </div>

//           <div>
//             <label className="text-sm font-medium text-slate-700">Mô tả</label>
//             <textarea
//               value={form.description}
//               onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
//               className="mt-1 w-full rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
//               rows={3}
//               placeholder="Mô tả ngắn"
//             />
//           </div>

//           <div className="flex items-center justify-end gap-2 pt-2">
//             <button onClick={() => setModalOpen(false)} className="rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200 hover:bg-slate-50">
//               Huỷ
//             </button>
//             <button
//               onClick={save}
//               disabled={saving}
//               className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
//             >
//               {saving ? "Đang lưu…" : (editing ? "Cập nhật" : "Thêm")}
//             </button>
//           </div>
//         </div>
//       </Modal>

//       {/* Modal xác nhận xoá */}
//       <Modal open={!!delId} onClose={() => setDelId(null)} title="Xác nhận xoá">
//         <p className="text-sm text-slate-700">
//           Bạn chắc chắn muốn xoá module này? Hành động không thể hoàn tác.
//         </p>
//         <div className="mt-4 flex items-center justify-end gap-2">
//           <button onClick={() => setDelId(null)} className="rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200 hover:bg-slate-50">
//             Huỷ
//           </button>
//           <button onClick={doDelete} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
//             Xoá
//           </button>
//         </div>
//       </Modal>
//     </div>
//   );
// }

// export default Module;



import React, { useEffect, useMemo, useState } from "react";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiX,
  FiUsers,
} from "react-icons/fi";
import * as FiIcons from "react-icons/fi";
import * as FcIcons from "react-icons/fc";
import { Combobox } from "@headlessui/react";
import { createPortal } from "react-dom";
import { BASE_URL } from "~/config";
import { useSelector } from "react-redux";
import { userSelector } from "~/redux/selectors";
import http from "~/api/http";

const USER_LIST_PAGE_SIZE = 10;

const cn = (...xs) => xs.filter(Boolean).join(" ");

function UserRowAvatar({ avatar, name }) {
  const [broken, setBroken] = useState(false);
  const initials = (name || "?").trim().slice(0, 2).toUpperCase();
  const showImg = !!avatar && !broken;

  return (
    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-indigo-100 text-indigo-700 ring-1 ring-slate-200 grid place-items-center text-xs font-semibold">
      {showImg ? (
        <img
          src={avatar}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        initials
      )}
    </div>
  );
}

function ModuleUsersModal({ open, moduleRow, onClose }) {
  const moduleId = moduleRow?.moduleId;
  const [tab, setTab] = useState("with"); // with | without
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [err, setErr] = useState("");
  const [filterUser, setFilterUser] = useState(true);
  const [filterAdmin, setFilterAdmin] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [searchQ, setSearchQ] = useState("");

  useEffect(() => {
    if (!open) return;
    setTab("with");
    setPage(1);
    setFilterUser(true);
    setFilterAdmin(true);
    setSearchInput("");
    setSearchQ("");
    setRows([]);
    setTotal(0);
    setErr("");
  }, [open, moduleId]);

  useEffect(() => {
    const t = setTimeout(() => setSearchQ(searchInput.trim()), 320);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (!open || !moduleId) return;
    if (tab === "with" && !filterUser && !filterAdmin) {
      setRows([]);
      setTotal(0);
      setErr("");
      setLoading(false);
      return;
    }
    let alive = true;
    const run = async () => {
      setLoading(true);
      setErr("");
      try {
        const params = {
          assigned: tab === "with" ? 1 : 0,
          page,
          pageSize: USER_LIST_PAGE_SIZE,
          q: searchQ,
        };
        if (tab === "with") {
          params.includeUser = filterUser ? 1 : 0;
          params.includeAdmin = filterAdmin ? 1 : 0;
        }
        const res = await http.get(`${BASE_URL}/api/modules/${moduleId}/users`, {
          params,
        });
        if (!alive) return;
        if (res.data?.success) {
          setRows(res.data.data || []);
          setTotal(res.data.pagination?.total ?? 0);
        } else {
          setRows([]);
          setTotal(0);
          setErr(res.data?.message || "Không tải được danh sách.");
        }
      } catch (e) {
        if (!alive) return;
        setRows([]);
        setTotal(0);
        setErr(e?.response?.data?.message || "Lỗi kết nối máy chủ.");
      } finally {
        if (alive) setLoading(false);
      }
    };
    run();
    return () => {
      alive = false;
    };
  }, [open, moduleId, tab, page, filterUser, filterAdmin, searchQ]);

  const totalPages = Math.max(1, Math.ceil(total / USER_LIST_PAGE_SIZE));

  if (!open || !moduleRow) return null;

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex min-h-0 flex-col"
      role="dialog"
      aria-modal="true"
      aria-labelledby="module-users-modal-title"
    >
      <div
        className="absolute inset-0 min-h-[100dvh] w-full min-w-full bg-black/60 backdrop-blur-[2px]"
        onClick={loading ? undefined : onClose}
      />
      <div className="relative z-[1] flex min-h-0 flex-1 justify-center overflow-y-auto overscroll-contain px-3 pb-8 pt-4 sm:px-4 sm:pb-10 sm:pt-6">
        <div
          className={cn(
            "relative w-full max-w-[520px] shrink-0",
            "flex max-h-[min(92dvh,calc(100dvh-2rem))] sm:max-h-[min(88dvh,calc(100dvh-3rem))] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200"
          )}
          onClick={(e) => e.stopPropagation()}
        >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h3
              id="module-users-modal-title"
              className="text-base font-semibold text-slate-900"
            >
              Danh sách user
            </h3>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              Module: <span className="font-medium text-slate-700">{moduleRow.name}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="shrink-0 rounded-xl p-2 hover:bg-slate-100 disabled:opacity-50"
            aria-label="Đóng"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-slate-200 px-4 py-3 sm:px-5">
          <div
            className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 ring-1 ring-slate-200/80"
            role="tablist"
          >
            <button
              type="button"
              role="tab"
              aria-selected={tab === "with"}
              onClick={() => {
                setTab("with");
                setPage(1);
              }}
              className={cn(
                "h-10 rounded-lg text-sm font-semibold transition",
                tab === "with"
                  ? "bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Có module
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "without"}
              onClick={() => {
                setTab("without");
                setPage(1);
              }}
              className={cn(
                "h-10 rounded-lg text-sm font-semibold transition",
                tab === "without"
                  ? "bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Không có module
            </button>
          </div>
        </div>

        <div className="border-b border-slate-200 px-4 py-3 sm:px-5">
          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm tên, username, MSNV… (không dấu, không hoa thường)"
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-9 text-sm ring-slate-200 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            {searchInput ? (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setPage(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                aria-label="Xoá tìm kiếm"
              >
                <FiX className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        {tab === "with" ? (
          <div className="border-b border-slate-200 px-4 py-3 sm:px-5">
            <p className="mb-2 text-xs font-medium text-slate-600">
              Lọc theo vai trò trong module
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <label className="inline-flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
                  checked={filterUser}
                  onChange={(e) => {
                    setFilterUser(e.target.checked);
                    setPage(1);
                  }}
                />
                <span className="text-sm text-slate-800">user</span>
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
                  checked={filterAdmin}
                  onChange={(e) => {
                    setFilterAdmin(e.target.checked);
                    setPage(1);
                  }}
                />
                <span className="text-sm text-slate-800">admin</span>
              </label>
            </div>
            {!filterUser && !filterAdmin ? (
              <p className="mt-2 text-xs text-amber-700">
                Chọn ít nhất một vai trò để xem danh sách.
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-5">
          {err ? (
            <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
              {err}
            </div>
          ) : null}

          {loading ? (
            <div className="grid place-items-center py-16 text-sm text-slate-500">
              Đang tải…
            </div>
          ) : tab === "with" && !filterUser && !filterAdmin ? (
            <div className="grid place-items-center py-16 text-sm text-slate-500">
              Chọn vai trò user hoặc admin ở trên.
            </div>
          ) : rows.length === 0 ? (
            <div className="grid place-items-center py-16 text-sm text-slate-500">
              Không có user.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {rows.map((u) => (
                <li
                  key={u.userID}
                  className="flex items-center gap-3 py-3 first:pt-0"
                >
                  <UserRowAvatar avatar={u.avatar} name={u.fullName} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-slate-900">
                      {u.fullName || "—"}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                      <span>MSNV: {u.msnv || u.username || "—"}</span>
                      {tab === "with" && u.moduleRole ? (
                        <span
                          className={cn(
                            "rounded-md px-1.5 py-0.5 ring-1",
                            u.moduleRole === "admin"
                              ? "bg-slate-100 text-slate-800 ring-slate-200"
                              : "bg-indigo-50 text-indigo-700 ring-indigo-200"
                          )}
                        >
                          {u.moduleRole}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-xs text-slate-500">
            Trang {page}/{totalPages} · {total} user
          </p>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="h-10 min-w-[44px] rounded-xl bg-white px-3 text-sm font-medium ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50"
            >
              Trước
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="h-10 min-w-[44px] rounded-xl bg-white px-3 text-sm font-medium ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ---------- Modal đơn giản ---------- */
const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
          <h3 className="font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-slate-50"
            aria-label="Đóng"
          >
            <FiX />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

/* ---------- Danh sách icon ---------- */
const ALLOWED_ICON_NAMES = Object.keys(FcIcons);
const ICON_OPTIONS = ALLOWED_ICON_NAMES.filter(
  (n) => typeof FcIcons[n] === "function"
);

/* ---------- Render icon theo tên (hoặc URL ảnh) ---------- */
const IconOrImg = ({ icon, className = "h-6 w-6" }) => {
  if (!icon) {
    return <FiIcons.FiGrid className={`${className} text-slate-800`} />;
  }

  if (/^Fi[A-Za-z0-9]+$/.test(icon) && typeof FiIcons[icon] === "function") {
    const Cmp = FiIcons[icon];
    return <Cmp className={`${className} text-slate-800`} />;
  }

  if (/^Fc[A-Za-z0-9]+$/.test(icon) && typeof FcIcons[icon] === "function") {
    const Cmp = FcIcons[icon];
    return <Cmp className={className} />;
  }

  return <img src={icon} alt="" className={`${className} object-contain`} />;
};

function MobileInfoRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="text-xs text-slate-500 shrink-0">{label}</div>
      <div className="min-w-0 text-right text-sm text-slate-800 break-all">
        {children}
      </div>
    </div>
  );
}

/* ---------- Component chính ---------- */
function Module() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    moduleKey: "",
    icon: "FiGrid",
    description: "",
  });

  const [saving, setSaving] = useState(false);
  const [delId, setDelId] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [usersModalModule, setUsersModalModule] = useState(null);

  const tmp = useSelector(userSelector);
  const [user, setUser] = useState({});

  useEffect(() => {
    setUser(tmp?.login?.currentUser);
  }, [tmp]);

  const canManage = user?.userID === 1 || user?.userID === 3;

  const [iconQuery, setIconQuery] = useState("");
  const filteredIconOptions =
    iconQuery.trim() === ""
      ? ICON_OPTIONS.slice(0, 60)
      : ICON_OPTIONS.filter((n) =>
          n.toLowerCase().includes(iconQuery.toLowerCase())
        ).slice(0, 50);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await http.get(`${BASE_URL}/api/modules`, {
        params: { q, page, pageSize },
      });
      if (res.data?.success) {
        setRows(res.data.data || []);
        setTotal(res.data.pagination?.total || 0);
      } else {
        setMsg({ type: "error", text: "Không tải được dữ liệu modules." });
      }
    } catch {
      setMsg({ type: "error", text: "Lỗi kết nối máy chủ." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [q, page]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", moduleKey: "", icon: "FiGrid", description: "" });
    setIconQuery("");
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      name: row.name || "",
      moduleKey: row.moduleKey || "",
      icon: row.icon || "FiGrid",
      description: row.description || "",
    });
    setIconQuery("");
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      setMsg({ type: "error", text: "Tên module là bắt buộc." });
      return;
    }

    const normalizedKey = (form.moduleKey || form.name || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    if (!/^[a-z0-9-]{2,64}$/.test(normalizedKey)) {
      setMsg({
        type: "error",
        text: "Key không hợp lệ (chỉ [a-z0-9-], 2-64 ký tự).",
      });
      return;
    }

    try {
      setSaving(true);
      const payload = { ...form, moduleKey: normalizedKey };

      if (editing) {
        const res = await http.put(
          `${BASE_URL}/api/modules/${editing.moduleId}`,
          payload
        );
        if (res.data?.success) {
          setMsg({ type: "success", text: "Đã cập nhật module." });
          setModalOpen(false);
          fetchData();
        } else {
          setMsg({
            type: "error",
            text: res.data?.message || "Cập nhật thất bại.",
          });
        }
      } else {
        const res = await http.post(`${BASE_URL}/api/modules`, payload);
        if (res.data?.success) {
          setMsg({ type: "success", text: "Đã tạo module." });
          setModalOpen(false);
          setPage(1);
          fetchData();
        } else {
          setMsg({
            type: "error",
            text: res.data?.message || "Tạo thất bại.",
          });
        }
      }
    } catch (e) {
      setMsg({
        type: "error",
        text:
          e?.response?.status === 409
            ? "Tên hoặc Key module đã tồn tại."
            : "Lỗi kết nối máy chủ.",
      });
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!delId) return;
    try {
      const res = await http.delete(`${BASE_URL}/api/modules/${delId}`);
      if (res.data?.success) {
        setMsg({ type: "success", text: "Đã xoá module." });
        if (rows.length === 1 && page > 1) setPage((p) => p - 1);
        fetchData();
      } else {
        setMsg({ type: "error", text: res.data?.message || "Xoá thất bại." });
      }
    } catch {
      setMsg({ type: "error", text: "Lỗi kết nối máy chủ." });
    } finally {
      setDelId(null);
    }
  };

  const SelectedIcon =
    typeof FcIcons[form.icon] === "function" ? FcIcons[form.icon] : FiIcons.FiGrid;

  return (
    <div className="min-h-[70vh] pb-[96px] md:pb-0">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-slate-900">Quản lý Modules</h1>
          <p className="text-sm text-slate-500">
            Danh sách phân hệ hiển thị trên trang chủ
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-auto">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo tên/mô tả…"
              className="w-full rounded-xl bg-white/70 pl-9 pr-3 py-2 text-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 sm:w-64"
            />
          </div>

          <button
            disabled={!canManage}
            onClick={openCreate}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50"
          >
            <FiPlus /> Thêm module
          </button>
        </div>
      </div>

      {/* Bảng/Card dữ liệu */}
      <div className="rounded-2xl bg-white/70 backdrop-blur ring-1 ring-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="py-10 text-center text-slate-500">Đang tải…</div>
          ) : rows.length === 0 ? (
            <div className="py-10 text-center text-slate-500">Không có dữ liệu</div>
          ) : (
            <>
              {/* Desktop giữ nguyên table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-left text-xs uppercase text-slate-500">
                      <th className="px-3 py-2">ID</th>
                      <th className="px-3 py-2">Tên module</th>
                      <th className="px-3 py-2">Key</th>
                      <th className="px-3 py-2">Icon</th>
                      <th className="px-3 py-2">Mô tả</th>
                      <th className="px-2 py-2 w-px whitespace-nowrap">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr
                        key={r.moduleId}
                        className="bg-white/80 ring-1 ring-slate-200"
                      >
                        <td className="px-3 py-2 align-top">{r.moduleId}</td>
                        <td className="px-3 py-2 align-top font-medium text-slate-800">
                          {r.name}
                        </td>
                        <td className="px-3 py-2 align-top">
                          <code className="text-xs bg-slate-50 px-1.5 py-0.5 rounded ring-1 ring-slate-200">
                            {r.moduleKey}
                          </code>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <div className="inline-flex items-center gap-2 rounded-lg bg-white px-2.5 py-1 ring-1 ring-slate-200">
                            <IconOrImg icon={r.icon} />
                            <span className="text-xs text-slate-600">
                              {r.icon || "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 align-top text-slate-600">
                          {r.description || (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-2 py-2 align-top">
                          <div
                            className="inline-flex items-center gap-px rounded-xl border border-slate-200/90 bg-slate-50/90 p-0.5 shadow-sm"
                            role="group"
                            aria-label="Thao tác module"
                          >
                            <button
                              type="button"
                              onClick={() => setUsersModalModule(r)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white hover:text-indigo-700 hover:shadow-sm"
                              title="Danh sách user"
                              aria-label="Danh sách user"
                            >
                              <FiUsers className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              disabled={!canManage}
                              onClick={() => openEdit(r)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white hover:text-slate-900 hover:shadow-sm disabled:pointer-events-none disabled:opacity-40"
                              title="Sửa"
                              aria-label="Sửa module"
                            >
                              <FiEdit2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              disabled={!canManage}
                              onClick={() => setDelId(r.moduleId)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50 hover:shadow-sm disabled:pointer-events-none disabled:opacity-40"
                              title="Xoá"
                              aria-label="Xoá module"
                            >
                              <FiTrash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card */}
              <div className="grid gap-3 md:hidden">
                {rows.map((r) => (
                  <div
                    key={r.moduleId}
                    className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-base font-semibold text-slate-900 break-words">
                          {r.name || "—"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          ID: {r.moduleId}
                        </div>
                      </div>

                      <div className="shrink-0 rounded-xl bg-slate-50 px-2 py-2 ring-1 ring-slate-200">
                        <IconOrImg icon={r.icon} className="h-6 w-6" />
                      </div>
                    </div>

                    <div className="mt-3 space-y-2.5">
                      <MobileInfoRow label="Key">
                        <code className="text-xs bg-slate-50 px-1.5 py-0.5 rounded ring-1 ring-slate-200">
                          {r.moduleKey || "—"}
                        </code>
                      </MobileInfoRow>

                      <MobileInfoRow label="Icon">
                        <span className="text-sm text-slate-700">
                          {r.icon || "—"}
                        </span>
                      </MobileInfoRow>

                      <MobileInfoRow label="Mô tả">
                        {r.description || "—"}
                      </MobileInfoRow>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setUsersModalModule(r)}
                        className="col-span-2 inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-indigo-50 text-sm font-semibold text-indigo-800 ring-1 ring-indigo-200 hover:bg-indigo-100"
                      >
                        <FiUsers /> Danh sách user
                      </button>
                      <button
                        disabled={!canManage}
                        onClick={() => openEdit(r)}
                        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-white text-sm font-medium ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50"
                      >
                        <FiEdit2 /> Sửa
                      </button>

                      <button
                        disabled={!canManage}
                        onClick={() => setDelId(r.moduleId)}
                        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-red-50 text-sm font-medium text-red-600 ring-1 ring-red-200 hover:bg-red-100 disabled:opacity-50"
                      >
                        <FiTrash2 /> Xoá
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Phân trang */}
          <div className="mt-4 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              Trang {page}/{totalPages} — Tổng {total} mục
            </p>

            <div className="flex items-center justify-start gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-10 min-w-[44px] rounded-lg bg-white px-3 py-1.5 text-sm ring-1 ring-slate-200 disabled:opacity-50 hover:bg-slate-50"
              >
                Trước
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="h-10 min-w-[44px] rounded-lg bg-white px-3 py-1.5 text-sm ring-1 ring-slate-200 disabled:opacity-50 hover:bg-slate-50"
              >
                Sau
              </button>
            </div>
          </div>

          {/* Thông báo */}
          {msg.text && (
            <div
              className={`mt-4 rounded-xl px-3 py-2 text-sm ${
                msg.type === "success"
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                  : "bg-red-50 text-red-700 ring-1 ring-red-200"
              }`}
            >
              {msg.text}
            </div>
          )}
        </div>
      </div>

      {/* Modal Thêm/Sửa */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Cập nhật module" : "Thêm module"}
      >
        <div className="grid gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700">
              Tên module <span className="text-red-500">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) =>
                setForm((p) => ({ ...p, name: e.target.value }))
              }
              className="mt-1 w-full rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="vd: Quản lý công việc"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Key (duy nhất) <span className="text-red-500">*</span>
            </label>
            <input
              value={form.moduleKey}
              onChange={(e) =>
                setForm((p) => ({ ...p, moduleKey: e.target.value }))
              }
              className="mt-1 w-full rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="vd: trash-weigh, ink-weigh, suggestion-box…"
            />
            <p className="mt-1 text-xs text-slate-500">
              Dùng chữ thường, số, dấu gạch ngang. Ví dụ: <b>ink-weigh</b>,{" "}
              <b>trash-weigh</b>.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Icon</label>
            <Combobox
              value={form.icon}
              onChange={(val) => setForm((p) => ({ ...p, icon: val }))}
            >
              <div className="relative">
                <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/40">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-200">
                    <SelectedIcon />
                  </span>
                  <Combobox.Input
                    className="w-full bg-transparent text-sm outline-none placeholder-slate-400"
                    onChange={(e) => setIconQuery(e.target.value)}
                    displayValue={(val) => val}
                    placeholder="Tìm icon"
                  />
                  <Combobox.Button className="text-slate-400 hover:text-slate-600">
                    <FiIcons.FiChevronDown />
                  </Combobox.Button>
                </div>

                <Combobox.Options className="absolute z-20 mt-2 w-full max-h-64 overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                  {filteredIconOptions.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-slate-500">
                      Không tìm thấy
                    </li>
                  ) : (
                    filteredIconOptions.map((iconName) => {
                      const IconCmp = FcIcons[iconName];
                      return (
                        <Combobox.Option
                          key={iconName}
                          value={iconName}
                          className={({ active, selected }) =>
                            [
                              "flex items-center gap-3 rounded-lg px-2 py-2 cursor-pointer",
                              active ? "bg-indigo-50" : "",
                              selected
                                ? "ring-1 ring-inset ring-indigo-200"
                                : "ring-1 ring-transparent",
                            ].join(" ")
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-200">
                                <IconCmp />
                              </span>
                              <span className="text-sm text-slate-800 flex-1">
                                {iconName}
                              </span>
                              {selected && (
                                <span className="text-indigo-600 text-xs font-medium">
                                  Đã chọn
                                </span>
                              )}
                            </>
                          )}
                        </Combobox.Option>
                      );
                    })
                  )}
                </Combobox.Options>
              </div>
            </Combobox>

            <div className="flex items-center gap-2 text-slate-600 pt-1">
              <span className="text-[11px] uppercase tracking-wide">
                Xem trước
              </span>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-200">
                <SelectedIcon />
              </span>
              <span className="text-sm font-medium text-slate-800">
                {form.icon}
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              Chọn biểu tượng hoặc nhập URL ảnh.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Mô tả</label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              className="mt-1 w-full rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              rows={3}
              placeholder="Mô tả ngắn"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setModalOpen(false)}
              className="rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200 hover:bg-slate-50"
            >
              Huỷ
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "Đang lưu…" : editing ? "Cập nhật" : "Thêm"}
            </button>
          </div>
        </div>
      </Modal>

      <ModuleUsersModal
        open={!!usersModalModule}
        moduleRow={usersModalModule}
        onClose={() => setUsersModalModule(null)}
      />

      {/* Modal xác nhận xoá */}
      <Modal open={!!delId} onClose={() => setDelId(null)} title="Xác nhận xoá">
        <p className="text-sm text-slate-700">
          Bạn chắc chắn muốn xoá module này? Hành động không thể hoàn tác.
        </p>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={() => setDelId(null)}
            className="rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200 hover:bg-slate-50"
          >
            Huỷ
          </button>
          <button
            onClick={doDelete}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Xoá
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default Module;
