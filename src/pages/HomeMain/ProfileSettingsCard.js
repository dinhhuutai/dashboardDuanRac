// // src/pages/Home/components/ProfileSettingsCard.jsx
// import React, { useEffect, useMemo, useState } from "react";
// import {
//   FiUploadCloud,
//   FiCamera,
//   FiRefreshCcw,
//   FiCheck,
//   FiLock,
//   FiEye,
//   FiEyeOff,
// } from "react-icons/fi";
// import { useSelector } from "react-redux";
// import { userSelector } from "~/redux/selectors";
// import http from "~/api/http";
// import coverPhoto from "~/assets/imgs/coverPhoto.png";
// import avatar from "~/assets/imgs/avatar-main.jpg";
// import Field from "./Field";

// function ProfileSettingsCard() {
//   const tmp = useSelector(userSelector);
//   const me = tmp?.login?.currentUser || {};

//   const [avatarPreview, setAvatarPreview] = useState(me.avatar || avatar);
//   const [coverPreview, setCoverPreview] = useState(coverPhoto);
//   const [saving, setSaving] = useState(false);
//   const [toast, setToast] = useState(null);

//   const [form, setForm] = useState({
//     fullName: me.fullName || "",
//     email: me.email || "",
//     phone: me.phone || "",
//     avatar: me.avatar || "",
//   });

//   const [pwd, setPwd] = useState({
//     current: "",
//     next: "",
//     confirm: "",
//     showCurrent: false,
//     showNext: false,
//     showConfirm: false,
//     saving: false,
//   });

//   useEffect(() => {
//     setForm({
//       fullName: me.fullName || "",
//       email: me.email || "",
//       phone: me.phone || "",
//       avatar: me.avatar || "",
//     });
//     setAvatarPreview(me.avatar || avatar);
//   }, [me.userID]);

//   const initials = useMemo(() => {
//     const full = form.fullName || me.username || "";
//     const parts = full.trim().split(" ").filter(Boolean);
//     if (!parts.length) return "";
//     if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
//     return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
//   }, [form.fullName, me.username]);

//   const emailValid = useMemo(() => {
//     if (!form.email) return true;
//     return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
//   }, [form.email]);

//   const phoneValid = useMemo(() => {
//     if (!form.phone) return true;
//     return /^[0-9+\-\s()]{6,20}$/.test(form.phone);
//   }, [form.phone]);

//   const hasChanges = useMemo(() => {
//     return (
//       (form.fullName || "") !== (me.fullName || "") ||
//       (form.email || "") !== (me.email || "") ||
//       (form.phone || "") !== (me.phone || "") ||
//       (form.avatar || "") !== (me.avatar || "")
//     );
//   }, [form, me]);

//   const canSave = hasChanges && emailValid && phoneValid && !saving;

//   const onPickAvatarFile = (file) => {
//     if (!file) return;
//     const url = URL.createObjectURL(file);
//     setAvatarPreview(url);
//   };

//   const onPickCoverFile = (file) => {
//     if (!file) return;
//     const url = URL.createObjectURL(file);
//     setCoverPreview(url);
//   };

//   const save = async () => {
//     if (!me.userID) return;
//     setSaving(true);
//     setToast(null);
//     try {
//       const payload = {
//         fullName: form.fullName || null,
//         email: form.email || null,
//         phone: form.phone || null,
//         avatar: form.avatar || null,
//       };
//       const r = await http.put(`/api/users/${me.userID}`, payload);
//       if (r.data?.success) {
//         setToast({ type: "success", text: "Cập nhật tài khoản thành công." });
//       } else {
//         setToast({
//           type: "error",
//           text: r.data?.message || "Cập nhật thất bại.",
//         });
//       }
//     } catch {
//       setToast({ type: "error", text: "Lỗi kết nối máy chủ." });
//     } finally {
//       setSaving(false);
//     }
//   };

//   const resetLocal = () => {
//     setForm({
//       fullName: me.fullName || "",
//       email: me.email || "",
//       phone: me.phone || "",
//       avatar: me.avatar || "",
//     });
//     setAvatarPreview(me.avatar || avatar);
//     setToast(null);
//   };

//   const scorePassword = (s = "") => {
//     let score = 0;
//     if (s.length >= 8) score++;
//     if (/[A-Z]/.test(s)) score++;
//     if (/[a-z]/.test(s)) score++;
//     if (/\d/.test(s)) score++;
//     if (/[^\w\s]/.test(s)) score++;
//     return score;
//   };

//   const pwdScore = useMemo(() => scorePassword(pwd.next), [pwd.next]);

//   const pwdValid = useMemo(() => {
//     const strongEnough = pwd.next.length >= 8 && pwdScore >= 3;
//     const match = pwd.next && pwd.next === pwd.confirm;
//     const notSame = pwd.current && pwd.next && pwd.current !== pwd.next;
//     return strongEnough && match && notSame;
//   }, [pwd, pwdScore]);

//   const changing = pwd.saving;

//   const changePassword = async () => {
//     if (!me.userID || !pwdValid) return;
//     setPwd((p) => ({ ...p, saving: true }));
//     setToast(null);
//     try {
//       const r = await http.put(`/api/users/${me.userID}/change-password`, {
//         currentPassword: pwd.current,
//         newPassword: pwd.next,
//       });
//       if (r.data?.success) {
//         setToast({ type: "success", text: "Đổi mật khẩu thành công." });
//         setPwd({
//           current: "",
//           next: "",
//           confirm: "",
//           showCurrent: false,
//           showNext: false,
//           showConfirm: false,
//           saving: false,
//         });
//       } else {
//         setToast({
//           type: "error",
//           text: r.data?.message || "Đổi mật khẩu thất bại.",
//         });
//         setPwd((p) => ({ ...p, saving: false }));
//       }
//     } catch (e) {
//       setToast({
//         type: "error",
//         text: e?.response?.data?.message || "Lỗi kết nối máy chủ.",
//       });
//       setPwd((p) => ({ ...p, saving: false }));
//     }
//   };

//   return (
//     <div className="rounded-3xl overflow-hidden ring-1 ring-slate-200 bg-white/70 backdrop-blur">
//       {/* Cover */}
//       <div className="relative h-[180px] sm:h-[220px] md:h-[260px]">
//         <img
//           src={coverPreview}
//           alt="cover"
//           className="absolute inset-0 h-full w-full object-cover"
//         />
//         <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,.25),rgba(2,6,23,.55))]" />
//         <div className="absolute inset-0 shadow-[inset_0_-120px_160px_-100px_rgba(2,6,23,.6)]" />
//         <label className="absolute right-4 bottom-4 inline-flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-xs font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-white cursor-pointer">
//           <FiUploadCloud />
//           Đổi ảnh bìa
//           <input
//             type="file"
//             accept="image/*"
//             className="hidden"
//             onChange={(e) => onPickCoverFile(e.target.files?.[0])}
//           />
//         </label>
//       </div>

//       {/* Body */}
//       <div className="p-4 sm:p-6 md:p-8">
//         <div className="flex flex-col md:flex-row md:items-end gap-5">
//           <div className="relative -mt-16 md:-mt-20">
//             <div className="relative h-28 w-28 md:h-32 md:w-32 rounded-full ring-4 ring-white overflow-hidden shadow-xl bg-slate-100 grid place-items-center text-slate-500 font-semibold">
//               <span className="select-none">{}</span>
//               {avatarPreview ? (
//                 <img
//                   src={avatarPreview}
//                   alt="avatar"
//                   className="absolute inset-0 h-full w-full object-cover"
//                 />
//               ) : null}
//             </div>
//             <label className="absolute -right-1 bottom-2 grid place-items-center h-9 w-9 rounded-full bg-white shadow ring-1 ring-slate-200 cursor-pointer hover:bg-slate-50">
//               <FiCamera className="text-slate-700" />
//               <input
//                 type="file"
//                 accept="image/*"
//                 className="hidden"
//                 onChange={(e) => onPickAvatarFile(e.target.files?.[0])}
//               />
//             </label>
//           </div>

//           <div className="flex-1">
//             <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
//               {form.fullName || me.fullName || "Người dùng"}
//             </h1>
//             <div className="mt-1 flex flex-wrap items-center gap-2 text-slate-600">
//               <span className="text-sm">@{me.username || "username"}</span>
//               {me.role && (
//                 <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 text-xs font-medium">
//                   Vai trò: {me.role}
//                 </span>
//               )}
//             </div>
//           </div>

//           <div className="flex w-full md:w-auto gap-3">
//             <button
//               type="button"
//               onClick={resetLocal}
//               disabled={!hasChanges}
//               className="flex-1 md:flex-none px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:scale-[.98] transition disabled:opacity-50"
//             >
//               <FiRefreshCcw className="inline -mt-0.5 mr-1" /> Hoàn tác
//             </button>
//             <button
//               type="button"
//               onClick={save}
//               disabled={!canSave}
//               className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg hover:from-indigo-700 hover:to-blue-700 active:scale-[.98] transition disabled:opacity-50"
//             >
//               <FiCheck className="inline -mt-0.5 mr-1" />{" "}
//               {saving ? "Đang lưu…" : "Lưu thay đổi"}
//             </button>
//           </div>
//         </div>

//         <div className="my-6 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
//           <Field label="Họ & tên">
//             <input
//               className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
//               value={form.fullName}
//               onChange={(e) =>
//                 setForm((p) => ({ ...p, fullName: e.target.value }))
//               }
//               placeholder="Nguyễn Văn A"
//             />
//           </Field>
//           <Field label="Email">
//             <input
//               type="email"
//               className={`w-full rounded-xl border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
//                 emailValid
//                   ? "border-slate-300 focus:ring-indigo-400"
//                   : "border-rose-300 focus:ring-rose-400"
//               }`}
//               value={form.email}
//               onChange={(e) =>
//                 setForm((p) => ({ ...p, email: e.target.value }))
//               }
//               placeholder="a@company.com"
//             />
//             {!emailValid && (
//               <p className="text-xs text-rose-600 mt-1">Email không hợp lệ.</p>
//             )}
//           </Field>
//           <Field label="Số điện thoại">
//             <input
//               className={`w-full rounded-xl border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
//                 phoneValid
//                   ? "border-slate-300 focus:ring-indigo-400"
//                   : "border-rose-300 focus:ring-rose-400"
//               }`}
//               value={form.phone}
//               onChange={(e) =>
//                 setForm((p) => ({ ...p, phone: e.target.value }))
//               }
//               placeholder="090..."
//             />
//             {!phoneValid && (
//               <p className="text-xs text-rose-600 mt-1">
//                 Số điện thoại không hợp lệ.
//               </p>
//             )}
//           </Field>
//           <Field label="Avatar URL">
//             <input
//               className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
//               value={form.avatar}
//               onChange={(e) => {
//                 setForm((p) => ({ ...p, avatar: e.target.value }));
//                 setAvatarPreview(e.target.value || avatar);
//               }}
//               placeholder="https://…"
//             />
//             <p className="text-xs text-slate-500">
//               Nhập URL ảnh để lưu vào DB. Nút máy ảnh chỉ để xem trước.
//             </p>
//           </Field>

//           <Field label="Username (readonly)">
//             <input
//               readOnly
//               className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
//               value={me.username || ""}
//             />
//           </Field>
//           <Field label="Mã người dùng (readonly)">
//             <input
//               readOnly
//               className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
//               value={me.userID || ""}
//             />
//           </Field>
//         </div>

//         {/* Bảo mật */}
//         <div className="mt-8 rounded-2xl border border-slate-200 bg-white/70 p-4 sm:p-5">
//           <div className="mb-3 flex items-center gap-2 text-slate-800">
//             <FiLock className="text-indigo-600" />
//             <h3 className="font-semibold">Bảo mật — Đổi mật khẩu</h3>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <Field label="Mật khẩu hiện tại">
//               <div className="relative">
//                 <input
//                   type={pwd.showCurrent ? "text" : "password"}
//                   className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 pr-9"
//                   value={pwd.current}
//                   onChange={(e) =>
//                     setPwd((p) => ({ ...p, current: e.target.value }))
//                   }
//                   placeholder="••••••••"
//                 />
//                 <button
//                   type="button"
//                   onClick={() =>
//                     setPwd((p) => ({ ...p, showCurrent: !p.showCurrent }))
//                   }
//                   className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:text-slate-600"
//                   aria-label="toggle current"
//                 >
//                   {pwd.showCurrent ? <FiEyeOff /> : <FiEye />}
//                 </button>
//               </div>
//             </Field>

//             <Field label="Mật khẩu mới">
//               <div className="relative">
//                 <input
//                   type={pwd.showNext ? "text" : "password"}
//                   className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 pr-9"
//                   value={pwd.next}
//                   onChange={(e) =>
//                     setPwd((p) => ({ ...p, next: e.target.value }))
//                   }
//                   placeholder="Tối thiểu 8 ký tự"
//                 />
//                 <button
//                   type="button"
//                   onClick={() =>
//                     setPwd((p) => ({ ...p, showNext: !p.showNext }))
//                   }
//                   className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:text-slate-600"
//                   aria-label="toggle new"
//                 >
//                   {pwd.showNext ? <FiEyeOff /> : <FiEye />}
//                 </button>
//               </div>

//               <div className="mt-2 flex items-center gap-1">
//                 {[0, 1, 2, 3, 4].map((i) => (
//                   <div
//                     key={i}
//                     className={`h-1.5 w-full rounded-full ${
//                       i < pwdScore ? "bg-emerald-500" : "bg-slate-200"
//                     }`}
//                   />
//                 ))}
//               </div>
//               <p className="mt-1 text-xs text-slate-500">
//                 Nên có ≥8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
//               </p>
//             </Field>

//             <Field label="Xác nhận mật khẩu mới">
//               <div className="relative">
//                 <input
//                   type={pwd.showConfirm ? "text" : "password"}
//                   className={`w-full rounded-xl border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 pr-9 ${
//                     !pwd.confirm || pwd.confirm === pwd.next
//                       ? "border-slate-300 focus:ring-indigo-400"
//                       : "border-rose-300 focus:ring-rose-400"
//                   }`}
//                   value={pwd.confirm}
//                   onChange={(e) =>
//                     setPwd((p) => ({ ...p, confirm: e.target.value }))
//                   }
//                   placeholder="Nhập lại mật khẩu mới"
//                 />
//                 <button
//                   type="button"
//                   onClick={() =>
//                     setPwd((p) => ({ ...p, showConfirm: !p.showConfirm }))
//                   }
//                   className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:text-slate-600"
//                   aria-label="toggle confirm"
//                 >
//                   {pwd.showConfirm ? <FiEyeOff /> : <FiEye />}
//                 </button>
//               </div>
//               {pwd.confirm && pwd.confirm !== pwd.next && (
//                 <p className="text-xs text-rose-600 mt-1">
//                   Mật khẩu xác nhận không khớp.
//                 </p>
//               )}
//             </Field>
//           </div>

//           <div className="mt-4 flex items-center gap-2">
//             <button
//               type="button"
//               onClick={() =>
//                 setPwd({
//                   current: "",
//                   next: "",
//                   confirm: "",
//                   showCurrent: false,
//                   showNext: false,
//                   showConfirm: false,
//                   saving: false,
//                 })
//               }
//               className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:scale-[.98] transition"
//             >
//               Làm mới
//             </button>
//             <button
//               type="button"
//               onClick={changePassword}
//               disabled={!pwdValid || changing}
//               className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-lg hover:from-rose-700 hover:to-red-700 active:scale-[.98] transition disabled:opacity-50"
//             >
//               {changing ? "Đang đổi…" : "Đổi mật khẩu"}
//             </button>
//           </div>
//         </div>

//         {toast && (
//           <div
//             className={`mt-6 rounded-xl px-3 py-2 text-sm ring-1 ${
//               toast.type === "success"
//                 ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
//                 : "bg-rose-50 text-rose-700 ring-rose-200"
//             }`}
//           >
//             {toast.text}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default ProfileSettingsCard;



// src/pages/Home/components/ProfileSettingsCard.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  FiUploadCloud,
  FiCamera,
  FiRefreshCcw,
  FiCheck,
  FiLock,
  FiEye,
  FiEyeOff,
  FiTrash2,
} from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { userSelector } from "~/redux/selectors";
import authSlice from "~/redux/slices/authSlice";
import http from "~/api/http";
import coverPhoto from "~/assets/imgs/coverPhoto.png";
import avatarFallback from "~/assets/imgs/avatar-main.jpg";
import Field from "./Field";

function ProfileSettingsCard() {
  const tmp = useSelector(userSelector);
  const me = tmp?.login?.currentUser || {};
  const dispatch = useDispatch();

  const [avatarPreview, setAvatarPreview] = useState(
    me.avatar || avatarFallback
  );
  const [coverPreview, setCoverPreview] = useState(coverPhoto);

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [toast, setToast] = useState(null);

  const [avatarFile, setAvatarFile] = useState(null);

  const [form, setForm] = useState({
    fullName: me.fullName || "",
    email: me.email || "",
    phone: me.phone || "",
    avatar: me.avatar || "",
  });

  const [pwd, setPwd] = useState({
    current: "",
    next: "",
    confirm: "",
    showCurrent: false,
    showNext: false,
    showConfirm: false,
    saving: false,
  });

  const updateReduxUser = (patch = {}) => {
    dispatch(
      authSlice.actions.checkUser({
        ...me,
        ...patch,
      })
    );
  };

  useEffect(() => {
    setForm({
      fullName: me.fullName || "",
      email: me.email || "",
      phone: me.phone || "",
      avatar: me.avatar || "",
    });
    setAvatarPreview(me.avatar || avatarFallback);
    setAvatarFile(null);
  }, [me.userID, me.fullName, me.email, me.phone, me.avatar]);

  const initials = useMemo(() => {
    const full = form.fullName || me.username || "";
    const parts = full.trim().split(" ").filter(Boolean);
    if (!parts.length) return "";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [form.fullName, me.username]);

  const emailValid = useMemo(() => {
    if (!form.email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  }, [form.email]);

  const phoneValid = useMemo(() => {
    if (!form.phone) return true;
    return /^[0-9+\-\s()]{6,20}$/.test(form.phone);
  }, [form.phone]);

  const hasChanges = useMemo(() => {
    return (
      (form.fullName || "") !== (me.fullName || "") ||
      (form.email || "") !== (me.email || "") ||
      (form.phone || "") !== (me.phone || "") ||
      (form.avatar || "") !== (me.avatar || "")
    );
  }, [form, me]);

  const canSave = hasChanges && emailValid && phoneValid && !saving;
  const hasCurrentAvatar = !!(form.avatar || me.avatar);
  const hasPickedNewAvatar = !!avatarFile;

  const onPickAvatarFile = (file) => {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setAvatarFile(file);
    setToast(null);
  };

  const onPickCoverFile = (file) => {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setCoverPreview(previewUrl);
  };

  const uploadAvatar = async () => {
    if (!avatarFile) return;

    try {
      setUploadingAvatar(true);
      setToast(null);

      const fd = new FormData();
      fd.append("avatar", avatarFile);

      const res = await http.post("/api/users/avatar", fd, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data?.success) {
        const avatarUrl = res.data.avatar || "";

        setForm((prev) => ({ ...prev, avatar: avatarUrl }));
        setAvatarPreview(avatarUrl || avatarFallback);
        setAvatarFile(null);

        updateReduxUser({ avatar: avatarUrl });

        setToast({ type: "success", text: "Đổi avatar thành công." });
      } else {
        setToast({
          type: "error",
          text: res.data?.message || "Upload avatar thất bại.",
        });
      }
    } catch (e) {
      setToast({
        type: "error",
        text: e?.response?.data?.message || "Lỗi kết nối máy chủ.",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const resetAvatar = async () => {
    try {
      setUploadingAvatar(true);
      setToast(null);

      const res = await http.delete("/api/users/avatar");

      if (res.data?.success) {
        setForm((prev) => ({ ...prev, avatar: "" }));
        setAvatarPreview(avatarFallback);
        setAvatarFile(null);

        updateReduxUser({ avatar: null });

        setToast({ type: "success", text: "Đã reset avatar." });
      } else {
        setToast({
          type: "error",
          text: res.data?.message || "Reset avatar thất bại.",
        });
      }
    } catch (e) {
      setToast({
        type: "error",
        text: e?.response?.data?.message || "Lỗi kết nối máy chủ.",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const save = async () => {
    if (!me.userID) return;

    setSaving(true);
    setToast(null);

    try {
      const payload = {
        fullName: form.fullName || null,
        email: form.email || null,
        phone: form.phone || null,
        avatar: form.avatar || null,
      };

      const r = await http.put(`/api/users/${me.userID}`, payload);

      if (r.data?.success) {
        updateReduxUser({
          fullName: form.fullName || null,
          email: form.email || null,
          phone: form.phone || null,
          avatar: form.avatar || null,
        });

        setToast({ type: "success", text: "Cập nhật tài khoản thành công." });
      } else {
        setToast({
          type: "error",
          text: r.data?.message || "Cập nhật thất bại.",
        });
      }
    } catch {
      setToast({ type: "error", text: "Lỗi kết nối máy chủ." });
    } finally {
      setSaving(false);
    }
  };

  const resetLocal = () => {
    setForm({
      fullName: me.fullName || "",
      email: me.email || "",
      phone: me.phone || "",
      avatar: me.avatar || "",
    });
    setAvatarPreview(me.avatar || avatarFallback);
    setAvatarFile(null);
    setToast(null);
  };

  const scorePassword = (s = "") => {
    let score = 0;
    if (s.length >= 8) score++;
    if (/[A-Z]/.test(s)) score++;
    if (/[a-z]/.test(s)) score++;
    if (/\d/.test(s)) score++;
    if (/[^\w\s]/.test(s)) score++;
    return score;
  };

  const pwdScore = useMemo(() => scorePassword(pwd.next), [pwd.next]);

  const pwdValid = useMemo(() => {
    const strongEnough = pwd.next.length >= 8 && pwdScore >= 3;
    const match = pwd.next && pwd.next === pwd.confirm;
    const notSame = pwd.current && pwd.next && pwd.current !== pwd.next;
    return strongEnough && match && notSame;
  }, [pwd, pwdScore]);

  const changing = pwd.saving;

  const changePassword = async () => {
    if (!me.userID || !pwdValid) return;

    setPwd((p) => ({ ...p, saving: true }));
    setToast(null);

    try {
      const r = await http.put(`/api/users/${me.userID}/change-password`, {
        currentPassword: pwd.current,
        newPassword: pwd.next,
      });

      if (r.data?.success) {
        setToast({ type: "success", text: "Đổi mật khẩu thành công." });
        setPwd({
          current: "",
          next: "",
          confirm: "",
          showCurrent: false,
          showNext: false,
          showConfirm: false,
          saving: false,
        });
      } else {
        setToast({
          type: "error",
          text: r.data?.message || "Đổi mật khẩu thất bại.",
        });
        setPwd((p) => ({ ...p, saving: false }));
      }
    } catch (e) {
      setToast({
        type: "error",
        text: e?.response?.data?.message || "Lỗi kết nối máy chủ.",
      });
      setPwd((p) => ({ ...p, saving: false }));
    }
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur">
      <div className="relative h-[160px] sm:h-[220px] md:h-[260px]">
        <img
          src={coverPreview}
          alt="cover"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,.2),rgba(2,6,23,.55))]" />
        <div className="absolute inset-0 shadow-[inset_0_-120px_160px_-100px_rgba(2,6,23,.6)]" />

        <label className="absolute right-3 bottom-3 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-xs font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-white sm:right-4 sm:bottom-4">
          <FiUploadCloud />
          Đổi ảnh bìa
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPickCoverFile(e.target.files?.[0])}
          />
        </label>
      </div>

      <div className="p-4 sm:p-6 md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end">
          <div className="relative -mt-14 self-start sm:-mt-16 md:-mt-20">
            <div className="relative">
              <div className="relative grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-lg font-semibold text-slate-500 shadow-xl ring-4 ring-white sm:h-28 sm:w-28 md:h-32 md:w-32">
                {!avatarPreview && <span className="select-none">{initials}</span>}
                <img
                  src={avatarPreview || avatarFallback}
                  alt="avatar"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 rounded-full bg-black/0 transition" />
              </div>

              <label
                className="
                  absolute -right-1 bottom-1
                  flex h-10 w-10 cursor-pointer items-center justify-center
                  rounded-full border border-white/70 bg-white/95 text-slate-700
                  shadow-lg backdrop-blur transition
                  hover:scale-105 hover:bg-white active:scale-95
                "
                title="Chọn ảnh mới"
              >
                <FiCamera className="text-[18px]" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onPickAvatarFile(e.target.files?.[0])}
                />
              </label>
            </div>

            {(hasPickedNewAvatar || hasCurrentAvatar) && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {hasPickedNewAvatar && (
                  <button
                    type="button"
                    onClick={uploadAvatar}
                    disabled={uploadingAvatar}
                    className="
                      inline-flex items-center gap-2 rounded-full
                      bg-gradient-to-r from-indigo-600 to-blue-600
                      px-4 py-2 text-sm font-medium text-white
                      transition
                      hover:from-indigo-700 hover:to-blue-700
                      active:scale-[.98]
                      disabled:cursor-not-allowed disabled:opacity-50
                    "
                  >
                    <FiUploadCloud className="text-[15px]" />
                    {uploadingAvatar ? "Đang lưu..." : "Lưu avatar"}
                  </button>
                )}

                {!hasPickedNewAvatar && hasCurrentAvatar && (
                  <button
                    type="button"
                    onClick={resetAvatar}
                    disabled={uploadingAvatar}
                    className="
                      inline-flex items-center gap-2 rounded-full
                      border border-rose-200 bg-white
                      px-4 py-2 text-sm font-medium text-rose-600
                      shadow-sm transition
                      hover:border-rose-300 hover:bg-rose-50
                      active:scale-[.98]
                      disabled:cursor-not-allowed disabled:opacity-50
                    "
                  >
                    <FiTrash2 className="text-[15px]" />
                    Reset avatar
                  </button>
                )}

                {hasPickedNewAvatar && (
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarFile(null);
                      setAvatarPreview(form.avatar || me.avatar || avatarFallback);
                    }}
                    disabled={uploadingAvatar}
                    className="
                      inline-flex items-center gap-2 rounded-full
                      border border-slate-200 bg-white
                      px-4 py-2 text-sm font-medium text-slate-600
                      shadow-sm transition hover:bg-slate-50
                      active:scale-[.98]
                      disabled:cursor-not-allowed disabled:opacity-50
                    "
                  >
                    <FiRefreshCcw className="text-[15px]" />
                    Bỏ chọn
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="break-words text-2xl font-bold text-slate-900 md:text-3xl">
              {form.fullName || me.fullName || "Người dùng"}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-slate-600">
              <span className="break-all text-sm">@{me.username || "username"}</span>
              {me.role && (
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  Vai trò: {me.role}
                </span>
              )}
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
            <button
              type="button"
              onClick={resetLocal}
              disabled={!hasChanges}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
            >
              <FiRefreshCcw className="mr-1 inline -mt-0.5" />
              Hoàn tác
            </button>

            <button
              type="button"
              onClick={save}
              disabled={!canSave}
              className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2.5 text-white shadow-lg transition hover:from-indigo-700 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
            >
              <FiCheck className="mr-1 inline -mt-0.5" />
              {saving ? "Đang lưu…" : "Lưu thay đổi"}
            </button>
          </div>
        </div>

        <div className="my-6 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Họ & tên">
            <input
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={form.fullName}
              onChange={(e) =>
                setForm((p) => ({ ...p, fullName: e.target.value }))
              }
              placeholder="Nguyễn Văn A"
            />
          </Field>

          <Field label="Email">
            <input
              type="email"
              className={`w-full rounded-xl border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                emailValid
                  ? "border-slate-300 focus:ring-indigo-400"
                  : "border-rose-300 focus:ring-rose-400"
              }`}
              value={form.email}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: e.target.value }))
              }
              placeholder="a@company.com"
            />
            {!emailValid && (
              <p className="mt-1 text-xs text-rose-600">Email không hợp lệ.</p>
            )}
          </Field>

          <Field label="Số điện thoại">
            <input
              className={`w-full rounded-xl border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                phoneValid
                  ? "border-slate-300 focus:ring-indigo-400"
                  : "border-rose-300 focus:ring-rose-400"
              }`}
              value={form.phone}
              onChange={(e) =>
                setForm((p) => ({ ...p, phone: e.target.value }))
              }
              placeholder="090..."
            />
            {!phoneValid && (
              <p className="mt-1 text-xs text-rose-600">
                Số điện thoại không hợp lệ.
              </p>
            )}
          </Field>

          <Field label="Avatar URL">
            <input
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={form.avatar}
              onChange={(e) => {
                setForm((p) => ({ ...p, avatar: e.target.value }));
                setAvatarPreview(e.target.value || avatarFallback);
                setAvatarFile(null);
              }}
              placeholder="https://..."
            />
            <p className="mt-1 text-xs text-slate-500">
              Có thể nhập URL ảnh hoặc dùng nút máy ảnh để upload avatar.
            </p>
          </Field>

          <Field label="Username (readonly)">
            <input
              readOnly
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
              value={me.username || ""}
            />
          </Field>

          <Field label="Mã người dùng (readonly)">
            <input
              readOnly
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
              value={me.userID || ""}
            />
          </Field>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white/70 p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2 text-slate-800">
            <FiLock className="text-indigo-600" />
            <h3 className="font-semibold">Bảo mật — Đổi mật khẩu</h3>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Mật khẩu hiện tại">
              <div className="relative">
                <input
                  type={pwd.showCurrent ? "text" : "password"}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={pwd.current}
                  onChange={(e) =>
                    setPwd((p) => ({ ...p, current: e.target.value }))
                  }
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() =>
                    setPwd((p) => ({ ...p, showCurrent: !p.showCurrent }))
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:text-slate-600"
                >
                  {pwd.showCurrent ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </Field>

            <Field label="Mật khẩu mới">
              <div className="relative">
                <input
                  type={pwd.showNext ? "text" : "password"}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={pwd.next}
                  onChange={(e) =>
                    setPwd((p) => ({ ...p, next: e.target.value }))
                  }
                  placeholder="Tối thiểu 8 ký tự"
                />
                <button
                  type="button"
                  onClick={() =>
                    setPwd((p) => ({ ...p, showNext: !p.showNext }))
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:text-slate-600"
                >
                  {pwd.showNext ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>

              <div className="mt-2 flex items-center gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-full rounded-full ${
                      i < pwdScore ? "bg-emerald-500" : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>

              <p className="mt-1 text-xs text-slate-500">
                Nên có ≥8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
              </p>
            </Field>

            <Field label="Xác nhận mật khẩu mới">
              <div className="relative">
                <input
                  type={pwd.showConfirm ? "text" : "password"}
                  className={`w-full rounded-xl border bg-white px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 ${
                    !pwd.confirm || pwd.confirm === pwd.next
                      ? "border-slate-300 focus:ring-indigo-400"
                      : "border-rose-300 focus:ring-rose-400"
                  }`}
                  value={pwd.confirm}
                  onChange={(e) =>
                    setPwd((p) => ({ ...p, confirm: e.target.value }))
                  }
                  placeholder="Nhập lại mật khẩu mới"
                />
                <button
                  type="button"
                  onClick={() =>
                    setPwd((p) => ({ ...p, showConfirm: !p.showConfirm }))
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:text-slate-600"
                >
                  {pwd.showConfirm ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>

              {pwd.confirm && pwd.confirm !== pwd.next && (
                <p className="mt-1 text-xs text-rose-600">
                  Mật khẩu xác nhận không khớp.
                </p>
              )}
            </Field>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() =>
                setPwd({
                  current: "",
                  next: "",
                  confirm: "",
                  showCurrent: false,
                  showNext: false,
                  showConfirm: false,
                  saving: false,
                })
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-700 hover:bg-slate-50"
            >
              Làm mới
            </button>

            <button
              type="button"
              onClick={changePassword}
              disabled={!pwdValid || changing}
              className="rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-4 py-2.5 text-white shadow-lg hover:from-rose-700 hover:to-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {changing ? "Đang đổi…" : "Đổi mật khẩu"}
            </button>
          </div>
        </div>

        {toast && (
          <div
            className={`mt-6 rounded-xl px-3 py-2 text-sm ring-1 ${
              toast.type === "success"
                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                : "bg-rose-50 text-rose-700 ring-rose-200"
            }`}
          >
            {toast.text}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfileSettingsCard;

