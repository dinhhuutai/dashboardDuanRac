// // src/pages/Home/components/UsersAdminPanel.jsx
// import React, { useEffect, useState } from "react";
// import { FiSearch, FiX } from "react-icons/fi";
// import * as FiIcons from "react-icons/fi";
// import http from "~/api/http";
// import Field from "./Field";

// /* ---------- ConfirmDialog dùng riêng trong panel ---------- */
// function ConfirmDialog({
//   open,
//   title = "Xác nhận",
//   description,
//   confirmText = "Xác nhận",
//   cancelText = "Huỷ",
//   onConfirm,
//   onClose,
//   loading = false,
// }) {
//   if (!open) return null;
//   return (
//     <div className="fixed inset-0 z-[80] grid place-items-center p-4">
//       <div
//         className="absolute inset-0 bg-black/40"
//         onClick={loading ? undefined : onClose}
//       />
//       <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 overflow-hidden">
//         <div className="px-5 py-4 border-b border-slate-200">
//           <div className="text-base font-semibold text-slate-900">{title}</div>
//         </div>
//         <div className="px-5 py-4 text-sm text-slate-700">
//           {description || "Bạn có chắc muốn thực hiện thao tác này?"}
//         </div>
//         <div className="px-5 py-4 border-t border-slate-200 flex items-center justify-end gap-2">
//           <button
//             onClick={onClose}
//             disabled={loading}
//             className="rounded-xl bg-white ring-1 ring-slate-200 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
//           >
//             {cancelText}
//           </button>
//           <button
//             onClick={onConfirm}
//             disabled={loading}
//             className="rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm hover:bg-indigo-700 disabled:opacity-50"
//           >
//             {loading ? "Đang xử lý…" : confirmText}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ---------- Modal sửa user ---------- */
// function EditUserModal({ user, onClose, onSaved }) {
//   const [form, setForm] = useState({
//     fullName: user.fullName || "",
//     email: user.email || "",
//     phone: user.phone || "",
//     role: user.role || "user",
//     isActive: !!user.isActive,
//   });
//   const [saving, setSaving] = useState(false);
//   const [msg, setMsg] = useState(null);

//   const save = async () => {
//     setSaving(true);
//     setMsg(null);
//     try {
//       const r = await http.put(`/api/users/${user.userID}`, form);
//       if (r.data?.success) {
//         onSaved({ ...user, ...form });
//       } else {
//         setMsg({ type: "error", text: r.data?.message || "Lưu thất bại." });
//       }
//     } catch {
//       setMsg({ type: "error", text: "Lỗi kết nối máy chủ." });
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 z-[60] grid place-items-center p-4">
//       <div className="absolute inset-0 bg-black/40" onClick={onClose} />
//       <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 overflow-hidden">
//         <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
//           <h3 className="font-semibold text-slate-900">Sửa thông tin</h3>
//           <button
//             onClick={onClose}
//             className="rounded-lg p-1.5 hover:bg-slate-100"
//           >
//             <FiX />
//           </button>
//         </div>
//         <div className="p-5 grid gap-4">
//           <Field label="Họ tên">
//             <input
//               className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
//               value={form.fullName}
//               onChange={(e) =>
//                 setForm((p) => ({ ...p, fullName: e.target.value }))
//               }
//             />
//           </Field>
//           <Field label="Email">
//             <input
//               type="email"
//               className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
//               value={form.email}
//               onChange={(e) =>
//                 setForm((p) => ({ ...p, email: e.target.value }))
//               }
//             />
//           </Field>
//           <Field label="SĐT">
//             <input
//               className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
//               value={form.phone}
//               onChange={(e) =>
//                 setForm((p) => ({ ...p, phone: e.target.value }))
//               }
//             />
//           </Field>
//           <div className="grid grid-cols-2 gap-4">
//             <Field label="Vai trò">
//               <select
//                 className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
//                 value={form.role}
//                 onChange={(e) =>
//                   setForm((p) => ({ ...p, role: e.target.value }))
//                 }
//               >
//                 <option value="user">User</option>
//                 <option value="admin">Admin</option>
//               </select>
//             </Field>
//             <Field label="Trạng thái">
//               <label className="inline-flex items-center gap-2 mt-2.5">
//                 <input
//                   type="checkbox"
//                   className="h-5 w-5 accent-indigo-600"
//                   checked={form.isActive}
//                   onChange={(e) =>
//                     setForm((p) => ({ ...p, isActive: e.target.checked }))
//                   }
//                 />
//                 <span className="text-sm">Kích hoạt</span>
//               </label>
//             </Field>
//           </div>
//         </div>

//         {msg && (
//           <div
//             className={`mx-5 mb-3 rounded-xl px-3 py-2 text-sm ring-1 ${
//               msg.type === "success"
//                 ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
//                 : "bg-red-50 text-red-700 ring-red-200"
//             }`}
//           >
//             {msg.text}
//           </div>
//         )}

//         <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-end gap-2">
//           <button
//             onClick={onClose}
//             className="rounded-xl bg-white ring-1 ring-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
//           >
//             Huỷ
//           </button>
//           <button
//             onClick={save}
//             disabled={saving}
//             className="rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm hover:bg-indigo-700 disabled:opacity-50"
//           >
//             {saving ? "Đang lưu…" : "Lưu"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ---------- Panel admin người dùng ---------- */
// function UsersAdminPanel() {
//   const [q, setQ] = useState("");
//   const [page, setPage] = useState(1);
//   const [size] = useState(12);
//   const [loading, setLoading] = useState(false);
//   const [rows, setRows] = useState([]);
//   const [total, setTotal] = useState(0);
//   const [toast, setToast] = useState(null);
//   const [editing, setEditing] = useState(null);
//   const [savingToggle, setSavingToggle] = useState(null);
//   const totalPages = Math.max(1, Math.ceil(total / size));

//   const [confirm, setConfirm] = useState({
//     open: false,
//     title: "",
//     desc: "",
//     loading: false,
//     onYes: null,
//   });

//   const fetchUsers = async () => {
//     setLoading(true);
//     try {
//       const r = await http.get(`/api/users`, {
//         params: { q, page, pageSize: size, includeModules: 1 },
//       });
//       const list = r.data?.data || [];
//       setRows(list);
//       setTotal(r.data?.pagination?.total || list.length);
//     } catch {
//       setRows([]);
//       setTotal(0);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchUsers();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [q, page]);

//   const toggleActive = async (u) => {
//     setSavingToggle(u.userID);
//     try {
//       await http.put(`/api/users/${u.userID}/active`, { isActive: !u.isActive });
//       setRows((xs) =>
//         xs.map((x) =>
//           x.userID === u.userID ? { ...x, isActive: !x.isActive } : x
//         )
//       );
//       setToast({ type: "success", text: "Cập nhật trạng thái thành công." });
//     } catch {
//       setToast({
//         type: "error",
//         text: "Không cập nhật được trạng thái.",
//       });
//     } finally {
//       setSavingToggle(null);
//     }
//   };

//   const resetPassword = (u) => {
//     setConfirm({
//       open: true,
//       title: "Reset mật khẩu",
//       desc: `Bạn có chắc muốn reset mật khẩu của @${u.username} về "1"?`,
//       loading: false,
//       onYes: async () => {
//         setConfirm((c) => ({ ...c, loading: true }));
//         try {
//           await http.post(`/api/users/${u.userID}/reset-password`, {
//             newPassword: "1",
//           });
//           setToast({ type: "success", text: "Đã reset mật khẩu về 1." });
//         } catch {
//           setToast({
//             type: "error",
//             text: "Reset mật khẩu thất bại.",
//           });
//         } finally {
//           setConfirm({
//             open: false,
//             title: "",
//             desc: "",
//             loading: false,
//             onYes: null,
//           });
//         }
//       },
//     });
//   };

//   const norm = (s) =>
//     (s || "")
//       .toLowerCase()
//       .normalize("NFD")
//       .replace(/[\u0300-\u036f]/g, "");

//   return (
//     <div className="space-y-4">
//       <div className="rounded-3xl bg-white/80 backdrop-blur ring-1 ring-slate-200 p-4 sm:p-5">
//         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
//           <div>
//             <h2 className="text-lg font-semibold text-slate-800">Người dùng</h2>
//             <p className="text-sm text-slate-500">
//               Danh sách tài khoản & phân quyền theo module.
//             </p>
//           </div>
//           <div className="relative">
//             <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
//             <input
//               value={q}
//               onChange={(e) => {
//                 setPage(1);
//                 setQ(e.target.value);
//               }}
//               placeholder="Tìm theo tên/username/email…"
//               className="w-[min(80vw,280px)] rounded-xl bg-white pl-9 pr-9 py-2 text-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
//             />
//             {q && (
//               <button
//                 onClick={() => setQ("")}
//                 className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-slate-100 text-slate-500"
//               >
//                 <FiX />
//               </button>
//             )}
//           </div>
//         </div>

//         <div className="mt-4 overflow-x-auto">
//           {loading ? (
//             <div className="grid place-items-center h-40 text-slate-500">
//               Đang tải…
//             </div>
//           ) : rows.length === 0 ? (
//             <div className="grid place-items-center h-40 text-slate-500">
//               Không có người dùng.
//             </div>
//           ) : (
//             <table className="min-w-[1000px] w-full text-sm">
//               <thead className="bg-slate-50">
//                 <tr className="text-[12px] uppercase tracking-wide text-slate-600">
//                   <th className="px-3 py-2 text-left">User</th>
//                   <th className="px-3 py-2 text-left">Thông tin</th>
//                   <th className="px-3 py-2 text-left">Vai trò</th>
//                   <th className="px-3 py-2 text-left">Trạng thái</th>
//                   <th className="px-3 py-2 text-left">Modules</th>
//                   <th className="px-3 py-2 text-left">Thao tác</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {rows.map((u, idx) => (
//                   <tr
//                     key={u.userID}
//                     className={idx % 2 ? "bg-white" : "bg-slate-50/60"}
//                   >
//                     <td className="px-3 py-2">
//                       <div className="flex items-center gap-3">
//                         <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center font-semibold">
//                           {(u.fullName || u.username || "?")
//                             .substring(0, 2)
//                             .toUpperCase()}
//                         </div>
//                         <div>
//                           <div className="font-medium text-slate-800">
//                             {u.fullName || "—"}
//                           </div>
//                           <div className="text-xs text-slate-500">
//                             @{u.username}
//                           </div>
//                         </div>
//                       </div>
//                     </td>
//                     <td className="px-3 py-2">
//                       <div className="text-xs text-slate-600">
//                         {u.email ? <div>Email: {u.email}</div> : null}
//                         {u.phone ? <div>Phone: {u.phone}</div> : null}
//                         <div>
//                           Last login:{" "}
//                           {u.lastLogin
//                             ? new Date(u.lastLogin).toLocaleString()
//                             : "—"}
//                         </div>
//                       </div>
//                     </td>
//                     <td className="px-3 py-2">
//                       <span
//                         className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs ring-1 ${
//                           (u.role || "user") === "admin"
//                             ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
//                             : "bg-slate-50 text-slate-700 ring-slate-200"
//                         }`}
//                       >
//                         {u.role || "user"}
//                       </span>
//                     </td>
//                     <td className="px-3 py-2">
//                       <label className="inline-flex items-center gap-2">
//                         <input
//                           type="checkbox"
//                           className="h-5 w-5 accent-indigo-600"
//                           checked={!!u.isActive}
//                           disabled={savingToggle === u.userID}
//                           onChange={() => toggleActive(u)}
//                         />
//                         <span className="text-xs">
//                           {u.isActive ? "Active" : "Inactive"}
//                         </span>
//                       </label>
//                     </td>
//                     <td className="px-3 py-2">
//                       <div className="flex flex-wrap gap-1.5 max-w-[420px]">
//                         {(u.modules || []).length === 0 ? (
//                           <span className="text-xs text-slate-500">—</span>
//                         ) : (
//                           u.modules.map((m) => (
//                             <span
//                               key={m.moduleId}
//                               className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs ring-1 ring-slate-200 shadow-sm"
//                             >
//                               {m.name}
//                               {m.role === "admin" && (
//                                 <span className="ml-1 text-[10px] px-1 rounded bg-indigo-100 text-indigo-700">
//                                   admin
//                                 </span>
//                               )}
//                             </span>
//                           ))
//                         )}
//                       </div>
//                     </td>
//                     <td className="px-3 py-2">
//                       <div className="flex flex-wrap items-center gap-2">
//                         <button
//                           className="rounded-xl bg-white ring-1 ring-slate-200 px-3 py-1.5 hover:bg-slate-50"
//                           onClick={() => setEditing(u)}
//                         >
//                           Sửa
//                         </button>
//                         <button
//                           className="rounded-xl bg-white ring-1 ring-slate-200 px-3 py-1.5 hover:bg-slate-50"
//                           onClick={() => resetPassword(u)}
//                         >
//                           Reset PW = 1
//                         </button>

//                         <button
//                           onClick={() =>
//                             setConfirm({
//                               open: true,
//                               title: u.isActive
//                                 ? "Vô hiệu hoá tài khoản"
//                                 : "Kích hoạt tài khoản",
//                               desc: `Bạn chắc chắn muốn ${
//                                 u.isActive ? "vô hiệu hoá" : "kích hoạt"
//                               } @${u.username}?`,
//                               loading: false,
//                               onYes: async () => {
//                                 setConfirm((c) => ({ ...c, loading: true }));
//                                 await toggleActive(u);
//                                 setConfirm({
//                                   open: false,
//                                   title: "",
//                                   desc: "",
//                                   loading: false,
//                                   onYes: null,
//                                 });
//                               },
//                             })
//                           }
//                           className="rounded-xl bg-white ring-1 ring-slate-200 px-3 py-1.5 hover:bg-slate-50"
//                         >
//                           {u.isActive ? "Vô hiệu hoá" : "Kích hoạt"}
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//         </div>

//         {/* Pagination */}
//         <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
//           <span>
//             Trang {page}/{totalPages} • {total} người
//           </span>
//           <div className="flex items-center gap-2">
//             <button
//               onClick={() => setPage((p) => Math.max(1, p - 1))}
//               disabled={page <= 1}
//               className="rounded-xl bg-white ring-1 ring-slate-200 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-50"
//             >
//               Trước
//             </button>
//             <button
//               onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
//               disabled={page >= totalPages}
//               className="rounded-xl bg-white ring-1 ring-slate-200 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-50"
//             >
//               Sau
//             </button>
//           </div>
//         </div>

//         {toast && (
//           <div
//             className={`mt-4 rounded-xl px-3 py-2 text-sm ring-1 ${
//               toast.type === "success"
//                 ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
//                 : "bg-red-50 text-red-700 ring-red-200"
//             }`}
//           >
//             {toast.text}
//           </div>
//         )}
//       </div>

//       {editing && (
//         <EditUserModal
//           user={editing}
//           onClose={() => setEditing(null)}
//           onSaved={(u2) => {
//             setRows((xs) =>
//               xs.map((x) => (x.userID === u2.userID ? { ...x, ...u2 } : x))
//             );
//             setEditing(null);
//             setToast({ type: "success", text: "Đã lưu thông tin người dùng." });
//           }}
//         />
//       )}

//       {/* Modal xác nhận */}
//       <ConfirmDialog
//         open={confirm.open}
//         title={confirm.title}
//         description={confirm.desc}
//         confirmText="Reset"
//         cancelText="Huỷ"
//         loading={confirm.loading}
//         onClose={() =>
//           !confirm.loading &&
//           setConfirm({
//             open: false,
//             title: "",
//             desc: "",
//             loading: false,
//             onYes: null,
//           })
//         }
//         onConfirm={() => confirm.onYes?.()}
//       />
//     </div>
//   );
// }

// export default UsersAdminPanel;



// src/pages/Home/components/UsersAdminPanel.jsx
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FiSearch, FiX } from "react-icons/fi";
import http from "~/api/http";
import Field from "./Field";

const cn = (...xs) => xs.filter(Boolean).join(" ");

/* ---------- ConfirmDialog dùng riêng trong panel ---------- */
function ConfirmDialog({
  open,
  title = "Xác nhận",
  description,
  confirmText = "Xác nhận",
  cancelText = "Huỷ",
  onConfirm,
  onClose,
  loading = false,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={loading ? undefined : onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <div className="text-base font-semibold text-slate-900">{title}</div>
        </div>
        <div className="px-5 py-4 text-sm text-slate-700">
          {description || "Bạn có chắc muốn thực hiện thao tác này?"}
        </div>
        <div className="px-5 py-4 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-xl bg-white ring-1 ring-slate-200 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Đang xử lý…" : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Modal sửa user ---------- */
function EditUserModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({
    fullName: user.fullName || "",
    email: user.email || "",
    phone: user.phone || "",
    role: user.role || "user",
    isActive: !!user.isActive,
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const r = await http.put(`/api/users/${user.userID}`, form);
      if (r.data?.success) {
        onSaved({ ...user, ...form });
      } else {
        setMsg({ type: "error", text: r.data?.message || "Lưu thất bại." });
      }
    } catch {
      setMsg({ type: "error", text: "Lỗi kết nối máy chủ." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Sửa thông tin</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-slate-100"
          >
            <FiX />
          </button>
        </div>

        <div className="p-5 grid gap-4">
          <Field label="Họ tên">
            <input
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={form.fullName}
              onChange={(e) =>
                setForm((p) => ({ ...p, fullName: e.target.value }))
              }
            />
          </Field>

          <Field label="Email">
            <input
              type="email"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={form.email}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: e.target.value }))
              }
            />
          </Field>

          <Field label="SĐT">
            <input
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={form.phone}
              onChange={(e) =>
                setForm((p) => ({ ...p, phone: e.target.value }))
              }
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Vai trò">
              <select
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={form.role}
                onChange={(e) =>
                  setForm((p) => ({ ...p, role: e.target.value }))
                }
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </Field>

            <Field label="Trạng thái">
              <label className="inline-flex items-center gap-2 mt-2.5">
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-indigo-600"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, isActive: e.target.checked }))
                  }
                />
                <span className="text-sm">Kích hoạt</span>
              </label>
            </Field>
          </div>
        </div>

        {msg && (
          <div
            className={`mx-5 mb-3 rounded-xl px-3 py-2 text-sm ring-1 ${
              msg.type === "success"
                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                : "bg-red-50 text-red-700 ring-red-200"
            }`}
          >
            {msg.text}
          </div>
        )}

        <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl bg-white ring-1 ring-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
          >
            Huỷ
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Đang lưu…" : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}

function MobileInfoRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="text-xs text-slate-500 shrink-0">{label}</div>
      <div className="text-right text-sm text-slate-800 min-w-0 break-all">
        {children}
      </div>
    </div>
  );
}

function pickUserId(u) {
  return u?.userID ?? u?.userId ?? u?.id ?? null;
}

function pickUserLabel(u) {
  const username = u?.username ? `@${u.username}` : "";
  const name = u?.fullName || u?.name || "—";
  if (username) return `${name} (${username})`;
  return name;
}

function UserAvatar({ user, className }) {
  const [broken, setBroken] = useState(false);
  const name = (user?.fullName || user?.username || "?").trim();
  const initials = name.substring(0, 2).toUpperCase() || "?";
  const showImg = !!user?.avatar && !broken;
  const label = pickUserLabel(user);

  return (
    <div
      className={cn(
        "shrink-0 overflow-hidden rounded-full bg-indigo-100 font-semibold text-indigo-700 ring-1 ring-slate-200 grid place-items-center",
        className || "h-10 w-10 text-xs"
      )}
      title={label}
      role="img"
      aria-label={label}
    >
      {showImg ? (
        <img
          src={user.avatar}
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

function normalizeAssignments(rows = []) {
  const map = {};
  rows.forEach((r) => {
    if (r?.moduleId != null && (r?.role === "admin" || r?.role === "user")) {
      map[r.moduleId] = r.role;
    }
  });
  return map;
}

function buildUserModulesFromDraft(draft, modules) {
  const moduleById = new Map((modules || []).map((m) => [m.moduleId, m]));
  return Object.entries(draft || {})
    .filter(([_, role]) => role === "admin" || role === "user")
    .map(([moduleId, role]) => {
      const id = Number(moduleId);
      const m = moduleById.get(id);
      return { moduleId: id, name: m?.name || `#${id}`, role };
    })
    .sort((a, b) => (a?.name || "").localeCompare(b?.name || ""));
}

function UserModuleAccessModal({ open, user, onClose, onSaved }) {
  const userId = pickUserId(user);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modules, setModules] = useState([]);
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState({});
  const [initial, setInitial] = useState({});
  const [err, setErr] = useState("");

  const [featureModuleId, setFeatureModuleId] = useState(null);
  const [featureRows, setFeatureRows] = useState([]);
  const [featureDraft, setFeatureDraft] = useState({});
  const [featureLoading, setFeatureLoading] = useState(false);
  const [featureSaving, setFeatureSaving] = useState(false);
  const [featureErr, setFeatureErr] = useState("");

  const hasChanges = (() => {
    const a = draft || {};
    const b = initial || {};
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) if ((a[k] || null) !== (b[k] || null)) return true;
    return false;
  })();

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !userId) return;
    let alive = true;
    const run = async () => {
      setLoading(true);
      setErr("");
      try {
        const [mRes, aRes] = await Promise.all([
          http.get("/api/modules", { params: { page: 1, pageSize: 500 } }),
          http.get(`/api/user-modules/${userId}`),
        ]);
        if (!alive) return;

        const ms = mRes.data?.data || [];
        const as = aRes.data?.data || [];
        const map = normalizeAssignments(as);
        setModules(ms);
        setInitial(map);
        setDraft(map);
        setFeatureModuleId(ms?.[0]?.moduleId ?? null);
      } catch (e) {
        if (!alive) return;
        setModules([]);
        setInitial({});
        setDraft({});
        setFeatureModuleId(null);
        setErr(e?.response?.data?.message || "Không tải được dữ liệu phân quyền.");
      } finally {
        if (alive) setLoading(false);
      }
    };
    run();
    return () => {
      alive = false;
    };
  }, [open, userId]);

  useEffect(() => {
    if (!open || !userId || !featureModuleId) return;
    let alive = true;
    const run = async () => {
      setFeatureLoading(true);
      setFeatureErr("");
      try {
        const res = await http.get(
          `/api/user-modules/${userId}/${featureModuleId}/features`
        );
        if (!alive) return;
        if (res.data?.success) {
          const rows = res.data.data || [];
          setFeatureRows(rows);
          const d = {};
          rows.forEach((r) => {
            d[r.featureId] = !!r.effectiveAllowed;
          });
          setFeatureDraft(d);
        } else {
          setFeatureRows([]);
          setFeatureDraft({});
          setFeatureErr(res.data?.message || "Không tải được quyền chức năng.");
        }
      } catch (e) {
        if (!alive) return;
        setFeatureRows([]);
        setFeatureDraft({});
        setFeatureErr(
          e?.response?.data?.message || "Không tải được quyền chức năng."
        );
      } finally {
        if (alive) setFeatureLoading(false);
      }
    };
    run();
    return () => {
      alive = false;
    };
  }, [open, userId, featureModuleId]);

  const changedFeatures = (() => {
    const rows = featureRows || [];
    const d = featureDraft || {};
    return rows
      .map((r) => ({
        featureId: r.featureId,
        want: !!d[r.featureId],
        def: !!r.defaultAllowed,
      }))
      .filter((x) => x.want !== x.def)
      .map((x) => ({ featureId: x.featureId, isAllowed: x.want }));
  })();

  const toggleAssign = (moduleId) =>
    setDraft((p) => ({
      ...p,
      [moduleId]: p?.[moduleId] ? undefined : "user",
    }));

  const setRole = (moduleId, role) =>
    setDraft((p) => ({
      ...p,
      [moduleId]: role,
    }));

  const resetDraft = () => setDraft(initial);

  const save = async () => {
    if (!userId) return;
    setSaving(true);
    setErr("");
    try {
      const assignments = Object.entries(draft || {})
        .filter(([_, role]) => role === "admin" || role === "user")
        .map(([moduleId, role]) => ({ moduleId: Number(moduleId), role }));
      const res = await http.put(`/api/user-modules/${userId}`, { assignments });
      if (res.data?.success) {
        const userModules = buildUserModulesFromDraft(draft, modules);
        onSaved?.({ userId, draft, modules, userModules });
        onClose?.();
      } else {
        setErr(res.data?.message || "Lưu phân quyền thất bại.");
      }
    } catch (e) {
      setErr(e?.response?.data?.message || "Lỗi kết nối máy chủ.");
    } finally {
      setSaving(false);
    }
  };

  const saveFeatures = async () => {
    if (!userId || !featureModuleId) return;
    setFeatureSaving(true);
    setFeatureErr("");
    try {
      const res = await http.put(
        `/api/user-modules/${userId}/${featureModuleId}/features`,
        { grants: changedFeatures }
      );
      if (res.data?.success) {
        // reload
        const r2 = await http.get(
          `/api/user-modules/${userId}/${featureModuleId}/features`
        );
        if (r2.data?.success) {
          const rows = r2.data.data || [];
          setFeatureRows(rows);
          const d = {};
          rows.forEach((r) => {
            d[r.featureId] = !!r.effectiveAllowed;
          });
          setFeatureDraft(d);
        }
      } else {
        setFeatureErr(res.data?.message || "Lưu quyền chức năng thất bại.");
      }
    } catch (e) {
      setFeatureErr(e?.response?.data?.message || "Lỗi kết nối máy chủ.");
    } finally {
      setFeatureSaving(false);
    }
  };

  const norm = (s) =>
    (s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const qn = norm(q);
  const filtered = (modules || []).filter((m) => {
    if (!qn) return true;
    return norm(m?.name).includes(qn) || norm(m?.description).includes(qn);
  });

  if (!open) return null;

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed left-0 top-0 right-0 bottom-0 z-[1100] m-0 flex h-[100dvh] min-h-[100dvh] w-screen max-w-none flex-col overflow-hidden p-0"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-module-access-modal-title"
    >
      <div
        className="absolute inset-0 z-0 min-h-[100dvh] w-full min-w-full bg-black/60 backdrop-blur-[2px]"
        aria-hidden
        onClick={saving ? undefined : onClose}
      />
      <div className="relative z-[1] flex min-h-0 min-w-0 flex-1 justify-center overflow-y-auto overscroll-contain px-3 pb-8 pt-4 sm:px-4 sm:pb-10 sm:pt-6">
        <div
          className={cn(
            "relative w-full max-w-[920px] shrink-0",
            "flex max-h-[min(92dvh,calc(100dvh-2rem))] sm:max-h-[min(88dvh,calc(100dvh-3rem))] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200"
          )}
          onClick={(e) => e.stopPropagation()}
        >
        <div className="px-4 sm:px-5 py-4 border-b border-slate-200 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div
              id="user-module-access-modal-title"
              className="text-base font-semibold text-slate-900"
            >
              Phân quyền module
            </div>
            <div className="mt-0.5 text-xs text-slate-500 truncate">
              {pickUserLabel(user)}
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="shrink-0 rounded-xl p-2 hover:bg-slate-100 disabled:opacity-50"
            aria-label="Đóng"
          >
            <FiX />
          </button>
        </div>

        <div className="p-4 sm:p-5 flex-1 overflow-auto">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-[360px]">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm module theo tên / mô tả…"
                className="w-full rounded-2xl bg-white pl-10 pr-9 py-2 text-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              {q && (
                <button
                  onClick={() => setQ("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-slate-100 text-slate-500"
                  aria-label="Xoá tìm kiếm"
                >
                  <FiX />
                </button>
              )}
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={resetDraft}
                disabled={!hasChanges || saving || loading}
                className="h-10 rounded-xl bg-white ring-1 ring-slate-200 px-3 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
              >
                Hoàn tác
              </button>
              <button
                onClick={save}
                disabled={!hasChanges || saving || loading}
                className="h-10 rounded-xl bg-indigo-600 text-white px-4 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? "Đang lưu…" : "Lưu"}
              </button>
            </div>
          </div>

          {err ? (
            <div className="mt-4 rounded-2xl bg-red-50 text-red-700 ring-1 ring-red-200 px-4 py-3 text-sm">
              {err}
            </div>
          ) : null}

          {loading ? (
            <div className="mt-5 grid place-items-center h-40 text-slate-500">
              Đang tải…
            </div>
          ) : filtered.length === 0 ? (
            <div className="mt-5 grid place-items-center h-40 text-slate-500">
              Không có module phù hợp.
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered.map((m) => {
                const assigned = draft?.[m.moduleId] === "admin" || draft?.[m.moduleId] === "user";
                const role = draft?.[m.moduleId] || null;
                return (
                  <div
                    key={m.moduleId}
                    className={cn(
                      "rounded-2xl border border-slate-200 bg-white p-4",
                      "hover:shadow-sm transition-shadow"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate">
                          {m.name}
                        </div>
                        <div className="mt-1 text-xs text-slate-500 line-clamp-2">
                          {m.description || "—"}
                        </div>
                      </div>
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-5 w-5 accent-indigo-600"
                          checked={!!assigned}
                          onChange={() => toggleAssign(m.moduleId)}
                        />
                        <span className="text-xs text-slate-600">Cho phép</span>
                      </label>
                    </div>

                    <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setRole(m.moduleId, "user")}
                          disabled={!assigned}
                          className={cn(
                            "h-9 rounded-xl px-3 text-sm font-medium ring-1 transition",
                            assigned && role === "user"
                              ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
                              : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50",
                            !assigned && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          user
                        </button>
                        <button
                          type="button"
                          onClick={() => setRole(m.moduleId, "admin")}
                          disabled={!assigned}
                          className={cn(
                            "h-9 rounded-xl px-3 text-sm font-medium ring-1 transition",
                            assigned && role === "admin"
                              ? "bg-slate-100 text-slate-800 ring-slate-200"
                              : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50",
                            !assigned && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          admin
                        </button>
                      </div>

                      <div className="text-xs">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-md px-2 py-1 ring-1",
                            role === "admin"
                              ? "bg-slate-100 text-slate-800 ring-slate-200"
                              : role === "user"
                              ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
                              : "bg-white text-slate-500 ring-slate-200"
                          )}
                        >
                          {role || "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Feature-level grants */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900">
                  Quyền chức năng theo module
                </div>
                <div className="text-xs text-slate-500">
                  Chọn module để cấp/thu quyền từng chức năng cho user này.
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  className="h-10 rounded-xl bg-white px-3 text-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 max-w-[60vw]"
                  value={featureModuleId || ""}
                  onChange={(e) =>
                    setFeatureModuleId(e.target.value ? Number(e.target.value) : null)
                  }
                >
                  <option value="">— Chọn module —</option>
                  {(modules || []).map((m) => (
                    <option key={m.moduleId} value={m.moduleId}>
                      {m.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={saveFeatures}
                  disabled={!featureModuleId || featureLoading || featureSaving}
                  className="h-10 rounded-xl bg-indigo-600 text-white px-4 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {featureSaving ? "Đang lưu…" : "Lưu quyền"}
                </button>
              </div>
            </div>

            {featureErr ? (
              <div className="m-4 rounded-2xl bg-red-50 text-red-700 ring-1 ring-red-200 px-4 py-3 text-sm">
                {featureErr}
              </div>
            ) : null}

            <div className="p-4">
              {!featureModuleId ? (
                <div className="grid place-items-center h-28 text-slate-500 text-sm">
                  Chọn một module để xem danh sách chức năng.
                </div>
              ) : featureLoading ? (
                <div className="grid place-items-center h-28 text-slate-500 text-sm">
                  Đang tải chức năng…
                </div>
              ) : featureRows.length === 0 ? (
                <div className="grid place-items-center h-28 text-slate-500 text-sm">
                  Module này chưa có chức năng.
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-[820px] w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr className="text-[12px] uppercase tracking-wide text-slate-600">
                          <th className="px-3 py-2 text-left">Mã</th>
                          <th className="px-3 py-2 text-left">Tên</th>
                          <th className="px-3 py-2 text-left">Mặc định</th>
                          <th className="px-3 py-2 text-left">Hiệu lực</th>
                          <th className="px-3 py-2 text-left">Ghi đè</th>
                          <th className="px-3 py-2 text-left">Cho phép?</th>
                        </tr>
                      </thead>
                      <tbody>
                        {featureRows.map((r, idx) => (
                          <tr
                            key={r.featureId}
                            className={idx % 2 ? "bg-white" : "bg-slate-50/60"}
                          >
                            <td className="px-3 py-2">{r.code}</td>
                            <td className="px-3 py-2 font-medium text-slate-800">
                              {r.name}
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-md px-2 py-0.5 text-xs ring-1",
                                  r.defaultAllowed
                                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                    : "bg-slate-50 text-slate-700 ring-slate-200"
                                )}
                              >
                                {r.defaultAllowed ? "Được" : "Không"}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-md px-2 py-0.5 text-xs ring-1",
                                  r.effectiveAllowed
                                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                    : "bg-slate-50 text-slate-700 ring-slate-200"
                                )}
                              >
                                {r.effectiveAllowed ? "Được" : "Không"}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-xs text-slate-600">
                              {r.overridden === null
                                ? "—"
                                : r.overridden
                                ? "Được"
                                : "Không"}
                            </td>
                            <td className="px-3 py-2">
                              <label className="inline-flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  className="h-5 w-5 accent-indigo-600"
                                  checked={!!featureDraft?.[r.featureId]}
                                  onChange={(e) =>
                                    setFeatureDraft((p) => ({
                                      ...p,
                                      [r.featureId]: e.target.checked,
                                    }))
                                  }
                                />
                                <span className="text-xs text-slate-600">
                                  Cho phép
                                </span>
                              </label>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="grid gap-3 md:hidden">
                    {featureRows.map((r) => (
                      <div
                        key={r.featureId}
                        className="rounded-2xl border border-slate-200 bg-white p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-800 truncate">
                              {r.name}
                            </div>
                            <div className="text-xs text-slate-500 truncate">
                              {r.code}
                            </div>
                          </div>
                          <label className="inline-flex items-center gap-2 shrink-0">
                            <input
                              type="checkbox"
                              className="h-5 w-5 accent-indigo-600"
                              checked={!!featureDraft?.[r.featureId]}
                              onChange={(e) =>
                                setFeatureDraft((p) => ({
                                  ...p,
                                  [r.featureId]: e.target.checked,
                                }))
                              }
                            />
                            <span className="text-xs text-slate-600">Cho phép</span>
                          </label>
                        </div>

                        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                          <div className="rounded-xl bg-slate-50 ring-1 ring-slate-200 px-2 py-2">
                            <div className="text-slate-500">Mặc định</div>
                            <div className="mt-0.5 font-semibold text-slate-800">
                              {r.defaultAllowed ? "Được" : "Không"}
                            </div>
                          </div>
                          <div className="rounded-xl bg-slate-50 ring-1 ring-slate-200 px-2 py-2">
                            <div className="text-slate-500">Hiệu lực</div>
                            <div className="mt-0.5 font-semibold text-slate-800">
                              {r.effectiveAllowed ? "Được" : "Không"}
                            </div>
                          </div>
                          <div className="rounded-xl bg-slate-50 ring-1 ring-slate-200 px-2 py-2">
                            <div className="text-slate-500">Ghi đè</div>
                            <div className="mt-0.5 font-semibold text-slate-800">
                              {r.overridden === null
                                ? "—"
                                : r.overridden
                                ? "Được"
                                : "Không"}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-5 py-3 border-t border-slate-200 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="text-xs text-slate-500">
              {hasChanges ? "Bạn có thay đổi chưa lưu." : "Không có thay đổi."}
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={onClose}
                disabled={saving}
                className="h-10 rounded-xl bg-white ring-1 ring-slate-200 px-4 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
              >
                Đóng
              </button>
              <button
                onClick={save}
                disabled={!hasChanges || saving || loading}
                className="h-10 rounded-xl bg-indigo-600 text-white px-4 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? "Đang lưu…" : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ---------- Panel admin người dùng ---------- */
function UsersAdminPanel() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [size] = useState(12);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [toast, setToast] = useState(null);
  const [editing, setEditing] = useState(null);
  const [accessUser, setAccessUser] = useState(null);
  const [savingToggle, setSavingToggle] = useState(null);
  const totalPages = Math.max(1, Math.ceil(total / size));

  const [confirm, setConfirm] = useState({
    open: false,
    title: "",
    desc: "",
    loading: false,
    onYes: null,
    confirmText: "Xác nhận",
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const r = await http.get(`/api/users`, {
        params: { q, page, pageSize: size, includeModules: 1 },
      });
      const list = r.data?.data || [];
      setRows(list);
      setTotal(r.data?.pagination?.total || list.length);
    } catch {
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, page]);

  const toggleActive = async (u) => {
    setSavingToggle(u.userID);
    try {
      await http.put(`/api/users/${u.userID}/active`, { isActive: !u.isActive });
      setRows((xs) =>
        xs.map((x) =>
          x.userID === u.userID ? { ...x, isActive: !x.isActive } : x
        )
      );
      setToast({ type: "success", text: "Cập nhật trạng thái thành công." });
    } catch {
      setToast({
        type: "error",
        text: "Không cập nhật được trạng thái.",
      });
    } finally {
      setSavingToggle(null);
    }
  };

  const openResetPasswordConfirm = (u) => {
    setConfirm({
      open: true,
      title: "Reset mật khẩu",
      desc: `Bạn có chắc muốn reset mật khẩu của @${u.username} về "1"?`,
      loading: false,
      confirmText: "Reset",
      onYes: async () => {
        setConfirm((c) => ({ ...c, loading: true }));
        try {
          await http.post(`/api/users/${u.userID}/reset-password`, {
            newPassword: "1",
          });
          setToast({ type: "success", text: "Đã reset mật khẩu về 1." });
        } catch {
          setToast({
            type: "error",
            text: "Reset mật khẩu thất bại.",
          });
        } finally {
          setConfirm({
            open: false,
            title: "",
            desc: "",
            loading: false,
            onYes: null,
            confirmText: "Xác nhận",
          });
        }
      },
    });
  };

  const openToggleConfirm = (u) => {
    setConfirm({
      open: true,
      title: u.isActive ? "Vô hiệu hoá tài khoản" : "Kích hoạt tài khoản",
      desc: `Bạn chắc chắn muốn ${
        u.isActive ? "vô hiệu hoá" : "kích hoạt"
      } @${u.username}?`,
      loading: false,
      confirmText: u.isActive ? "Vô hiệu hoá" : "Kích hoạt",
      onYes: async () => {
        setConfirm((c) => ({ ...c, loading: true }));
        await toggleActive(u);
        setConfirm({
          open: false,
          title: "",
          desc: "",
          loading: false,
          onYes: null,
          confirmText: "Xác nhận",
        });
      },
    });
  };

  return (
    <div className="space-y-4 pb-[96px] md:pb-4">
      <div className="rounded-3xl bg-white/80 backdrop-blur ring-1 ring-slate-200 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-800">Người dùng</h2>
            <p className="text-sm text-slate-500">
              Danh sách tài khoản & phân quyền theo module.
            </p>
          </div>

          <div className="relative w-full sm:w-auto">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
              placeholder="Tìm tên, MSNV, username, email… (không dấu, không hoa thường)"
              className="w-full sm:w-[min(280px,92vw)] rounded-xl bg-white pl-9 pr-9 py-2 text-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 sm:min-w-[280px]"
            />
            {q && (
              <button
                onClick={() => {
                  setQ("");
                  setPage(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-slate-100 text-slate-500"
              >
                <FiX />
              </button>
            )}
          </div>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="grid place-items-center h-40 text-slate-500">
              Đang tải…
            </div>
          ) : rows.length === 0 ? (
            <div className="grid place-items-center h-40 text-slate-500">
              Không có người dùng.
            </div>
          ) : (
            <>
              {/* Desktop giữ nguyên */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-[1000px] w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-[12px] uppercase tracking-wide text-slate-600">
                      <th className="px-3 py-2 text-left w-px whitespace-nowrap">
                        Avatar
                      </th>
                      <th className="px-3 py-2 text-left">Thông tin</th>
                      <th className="px-3 py-2 text-left">Vai trò</th>
                      <th className="px-3 py-2 text-left">Trạng thái</th>
                      <th className="px-3 py-2 text-left">Modules</th>
                      <th className="px-3 py-2 text-left">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((u, idx) => (
                      <tr
                        key={u.userID}
                        className={idx % 2 ? "bg-white" : "bg-slate-50/60"}
                      >
                        <td className="px-3 py-2 align-middle">
                          <div className="flex justify-center sm:justify-start">
                            <UserAvatar
                              user={u}
                              className="h-11 w-11 text-sm"
                            />
                          </div>
                        </td>

                        <td className="px-3 py-2">
                          <div className="text-xs text-slate-600">
                            <div className="font-medium text-sm text-slate-800">
                              {u.fullName || "—"}
                            </div>
                            <div className="text-xs text-slate-500">
                              @{u.username || "—"}
                            </div>
                            {u.email ? (
                              <div className="mt-1">Email: {u.email}</div>
                            ) : null}
                            {u.phone ? (
                              <div className="mt-0.5">Phone: {u.phone}</div>
                            ) : null}
                            <div className="mt-0.5">
                              Last login:{" "}
                              {u.lastLogin
                                ? new Date(u.lastLogin).toLocaleString()
                                : "—"}
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs ring-1 ${
                              (u.role || "user") === "admin"
                                ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
                                : "bg-slate-50 text-slate-700 ring-slate-200"
                            }`}
                          >
                            {u.role || "user"}
                          </span>
                        </td>

                        <td className="px-3 py-2">
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              className="h-5 w-5 accent-indigo-600"
                              checked={!!u.isActive}
                              disabled={savingToggle === u.userID}
                              onChange={() => toggleActive(u)}
                            />
                            <span className="text-xs">
                              {u.isActive ? "Active" : "Inactive"}
                            </span>
                          </label>
                        </td>

                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1.5 max-w-[420px]">
                            {(u.modules || []).length === 0 ? (
                              <span className="text-xs text-slate-500">—</span>
                            ) : (
                              u.modules.map((m) => (
                                <span
                                  key={m.moduleId}
                                  className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs ring-1 ring-slate-200 shadow-sm"
                                >
                                  {m.name}
                                  {m.role === "admin" && (
                                    <span className="ml-1 text-[10px] px-1 rounded bg-indigo-100 text-indigo-700">
                                      admin
                                    </span>
                                  )}
                                </span>
                              ))
                            )}
                          </div>
                        </td>

                        <td className="px-3 py-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              className="rounded-xl bg-indigo-600 text-white ring-1 ring-indigo-600 px-3 py-1.5 hover:bg-indigo-700"
                              onClick={() => setAccessUser(u)}
                            >
                              Phân quyền module
                            </button>

                            <button
                              className="rounded-xl bg-white ring-1 ring-slate-200 px-3 py-1.5 hover:bg-slate-50"
                              onClick={() => setEditing(u)}
                            >
                              Sửa
                            </button>

                            <button
                              className="rounded-xl bg-white ring-1 ring-slate-200 px-3 py-1.5 hover:bg-slate-50"
                              onClick={() => openResetPasswordConfirm(u)}
                            >
                              Reset PW = 1
                            </button>

                            <button
                              onClick={() => openToggleConfirm(u)}
                              className="rounded-xl bg-white ring-1 ring-slate-200 px-3 py-1.5 hover:bg-slate-50"
                            >
                              {u.isActive ? "Vô hiệu hoá" : "Kích hoạt"}
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
                {rows.map((u) => (
                  <div
                    key={u.userID}
                    className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar user={u} className="h-12 w-12 text-sm shrink-0" />

                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 truncate">
                          {u.fullName || "—"}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          @{u.username}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2.5">
                      <MobileInfoRow label="Email">
                        {u.email || "—"}
                      </MobileInfoRow>

                      <MobileInfoRow label="SĐT">
                        {u.phone || "—"}
                      </MobileInfoRow>

                      <MobileInfoRow label="Vai trò">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs ring-1 ${
                            (u.role || "user") === "admin"
                              ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
                              : "bg-slate-50 text-slate-700 ring-slate-200"
                          }`}
                        >
                          {u.role || "user"}
                        </span>
                      </MobileInfoRow>

                      <MobileInfoRow label="Trạng thái">
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-5 w-5 accent-indigo-600"
                            checked={!!u.isActive}
                            disabled={savingToggle === u.userID}
                            onChange={() => toggleActive(u)}
                          />
                          <span className="text-xs">
                            {u.isActive ? "Active" : "Inactive"}
                          </span>
                        </label>
                      </MobileInfoRow>

                      <MobileInfoRow label="Last login">
                        {u.lastLogin
                          ? new Date(u.lastLogin).toLocaleString()
                          : "—"}
                      </MobileInfoRow>

                      <div>
                        <div className="text-xs text-slate-500 mb-2">Modules</div>
                        <div className="flex flex-wrap gap-1.5">
                          {(u.modules || []).length === 0 ? (
                            <span className="text-xs text-slate-500">—</span>
                          ) : (
                            u.modules.map((m) => (
                              <span
                                key={m.moduleId}
                                className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-xs ring-1 ring-slate-200"
                              >
                                {m.name}
                                {m.role === "admin" && (
                                  <span className="text-[10px] px-1 rounded bg-indigo-100 text-indigo-700">
                                    admin
                                  </span>
                                )}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        className="col-span-2 h-10 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
                        onClick={() => setAccessUser(u)}
                      >
                        Phân quyền module
                      </button>

                      <button
                        className="h-10 rounded-xl bg-white ring-1 ring-slate-200 text-sm font-medium hover:bg-slate-50"
                        onClick={() => setEditing(u)}
                      >
                        Sửa
                      </button>

                      <button
                        className="h-10 rounded-xl bg-white ring-1 ring-slate-200 text-sm font-medium hover:bg-slate-50"
                        onClick={() => openResetPasswordConfirm(u)}
                      >
                        Reset PW
                      </button>

                      <button
                        onClick={() => openToggleConfirm(u)}
                        className={`col-span-2 h-10 rounded-xl text-sm font-medium ${
                          u.isActive
                            ? "bg-red-50 text-red-700 ring-1 ring-red-200 hover:bg-red-100"
                            : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100"
                        }`}
                      >
                        {u.isActive ? "Vô hiệu hoá tài khoản" : "Kích hoạt tài khoản"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        <div className="mt-4 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-600">
          <span>
            Trang {page}/{totalPages} • {total} người
          </span>

          <div className="flex items-center justify-start gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="h-10 min-w-[44px] rounded-xl bg-white ring-1 ring-slate-200 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-50"
            >
              Trước
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="h-10 min-w-[44px] rounded-xl bg-white ring-1 ring-slate-200 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>

        {toast && (
          <div
            className={`mt-4 rounded-xl px-3 py-2 text-sm ring-1 ${
              toast.type === "success"
                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                : "bg-red-50 text-red-700 ring-red-200"
            }`}
          >
            {toast.text}
          </div>
        )}
      </div>

      {editing && (
        <EditUserModal
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={(u2) => {
            setRows((xs) =>
              xs.map((x) => (x.userID === u2.userID ? { ...x, ...u2 } : x))
            );
            setEditing(null);
            setToast({ type: "success", text: "Đã lưu thông tin người dùng." });
          }}
        />
      )}

      <UserModuleAccessModal
        open={!!accessUser}
        user={accessUser}
        onClose={() => setAccessUser(null)}
        onSaved={({ userId, userModules }) => {
          setRows((xs) =>
            xs.map((x) => (pickUserId(x) === userId ? { ...x, modules: userModules } : x))
          );
          setToast({ type: "success", text: "Đã lưu phân quyền module." });
        }}
      />

      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        description={confirm.desc}
        confirmText={confirm.confirmText || "Xác nhận"}
        cancelText="Huỷ"
        loading={confirm.loading}
        onClose={() =>
          !confirm.loading &&
          setConfirm({
            open: false,
            title: "",
            desc: "",
            loading: false,
            onYes: null,
            confirmText: "Xác nhận",
          })
        }
        onConfirm={() => confirm.onYes?.()}
      />
    </div>
  );
}

export default UsersAdminPanel;
