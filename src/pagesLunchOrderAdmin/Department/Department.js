// src/pages/Department/DepartmentManager.jsx
import React, { useEffect, useState } from "react";
import { FaEdit, FaTrash, FaPlus, FaTimes, FaSpinner } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import http from "~/api/http";
import { BASE_URL } from "~/config";

/* ========= Modal Thông báo ========= */
function NoticeModal({ open, title = "Thông báo", message = "", onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="bg-white rounded-2xl shadow-xl w-full max-w-md"
            initial={{ scale: .95 }} animate={{ scale: 1 }} exit={{ scale: .95 }}>
            <div className="flex justify-between items-center border-b px-4 py-3">
              <h3 className="font-bold">{title}</h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded"><FaTimes /></button>
            </div>
            <div className="px-4 py-5 text-slate-700">{message}</div>
            <div className="px-4 py-3 border-t flex justify-end">
              <button onClick={onClose}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700">OK</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ========= Modal Xác nhận ========= */
function ConfirmModal({ open, title = "Xác nhận", message = "", onCancel, onOk }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="bg-white rounded-2xl shadow-xl w-full max-w-md"
            initial={{ scale: .95 }} animate={{ scale: 1 }} exit={{ scale: .95 }}>
            <div className="px-4 py-3 border-b font-bold">{title}</div>
            <div className="px-4 py-5">{message}</div>
            <div className="px-4 py-3 border-t flex justify-end gap-3">
              <button onClick={onCancel} className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300">Hủy</button>
              <button onClick={onOk} className="px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700">Xoá</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ========= Trang chính ========= */
export default function DepartmentManager() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editDept, setEditDept] = useState(null);
  const [form, setForm] = useState({ departmentName: "" });

  const [notice, setNotice] = useState({ open: false, title: "", message: "" });
  const [confirm, setConfirm] = useState({ open: false, id: null });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
  if (notice.open) {
    const t = setTimeout(() => {
      setNotice((prev) => ({ ...prev, open: false }));
    }, 600); // 1 giây

    return () => clearTimeout(t);
  }
}, [notice.open]);

  async function fetchDepartments() {
    setLoading(true);
    try {
      const res = await http.get(`${BASE_URL}/api/lunch-order/departments`);
      setDepartments(res.data || []);
    } catch {
      setNotice({ open: true, title: "Lỗi", message: "Không tải được danh sách bộ phận" });
    } finally {
      setLoading(false);
    }
  }

  function openModal(dept = null) {
    setEditDept(dept);
    if (dept) {
      setForm({ departmentName: dept.departmentName });
    } else {
      setForm({ departmentName: "" });
    }
    setModalOpen(true);
  }

  async function handleSave() {
    try {
      setSaving(true);
      if (editDept) {
        await http.put(`${BASE_URL}/api/lunch-order/departments/${editDept.departmentId}`, form);
        setNotice({ open: true, title: "Thành công", message: "Cập nhật bộ phận thành công" });
      } else {
        await http.post(`${BASE_URL}/api/lunch-order/departments`, form);
        setNotice({ open: true, title: "Thành công", message: "Thêm bộ phận thành công" });
      }
      setModalOpen(false);
      fetchDepartments();
    } catch {
      setNotice({ open: true, title: "Lỗi", message: "Lưu bộ phận thất bại" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setConfirm({ open: false, id: null });
    try {
      await http.delete(`${BASE_URL}/api/lunch-order/departments/${id}`);
      setNotice({ open: true, title: "Thành công", message: "Xoá bộ phận thành công" });
      fetchDepartments();
    } catch {
      setNotice({ open: true, title: "Lỗi", message: "Xoá bộ phận thất bại" });
    }
  }

  return (
    <div className="p-6">
      <div className="bg-white/80 backdrop-blur border rounded-2xl shadow-sm p-5">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-2xl font-bold">🏢 Quản lý Bộ phận</h2>
          <button onClick={() => openModal()}
            className="px-5 py-2 bg-emerald-600 text-white rounded-xl shadow hover:bg-emerald-700 flex items-center gap-2">
            <FaPlus /> Thêm bộ phận
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 text-slate-600"><FaSpinner className="animate-spin" /> Đang tải...</div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-100 text-left">
                <th className="px-4 py-2 border">#</th>
                <th className="px-4 py-2 border">Tên bộ phận</th>
                <th className="px-4 py-2 border">Mã bộ phận</th>
                <th className="px-4 py-2 border text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((d, i) => (
                <tr key={d.departmentId} className="hover:bg-slate-50">
                  <td className="px-4 py-2 border">{i + 1}</td>
                  <td className="px-4 py-2 border">{d.departmentName}</td>
                  <td className="px-4 py-2 border">{d.departmentCode}</td>
                  <td className="px-4 py-2 border text-center flex justify-center gap-2">
                    <button onClick={() => openModal(d)} className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                      <FaEdit />
                    </button>
                    <button onClick={() => setConfirm({ open: true, id: d.departmentId })}
                      className="p-2 bg-rose-50 text-rose-600 rounded hover:bg-rose-100">
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
              {!departments.length && (
                <tr><td colSpan="4" className="text-center py-6 text-slate-500">Không có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal thêm/sửa */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[150] p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-white rounded-2xl shadow-xl w-full max-w-lg"
              initial={{ scale: .95 }} animate={{ scale: 1 }} exit={{ scale: .95 }}>
              <div className="flex justify-between items-center border-b px-5 py-3">
                <h3 className="font-bold">{editDept ? "✏️ Sửa bộ phận" : "➕ Thêm bộ phận"}</h3>
                <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-slate-100 rounded"><FaTimes /></button>
              </div>
              <div className="px-5 py-4 space-y-4">
                <input
  type="text"
  placeholder="Tên bộ phận"
  className="border rounded-lg px-3 py-2 w-full"
  value={form.departmentName}
  onChange={(e) =>
    setForm({ ...form, departmentName: e.target.value })
  }
  onKeyDown={(e) => {
    if (e.key === "Enter" && !saving) {
      handleSave();
    }
  }}
/>
              </div>
              <div className="border-t px-5 py-3 flex justify-end gap-3">
                <button onClick={() => setModalOpen(false)} className="px-4 py-2 bg-slate-200 rounded-xl hover:bg-slate-300">Hủy</button>
                <button onClick={handleSave} disabled={saving}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700">
                  {saving ? <FaSpinner className="animate-spin" /> : (editDept ? "💾 Cập nhật" : "➕ Thêm mới")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals thông báo & confirm */}
      <NoticeModal open={notice.open} title={notice.title} message={notice.message}
        onClose={() => setNotice({ ...notice, open: false })} />
      <ConfirmModal open={confirm.open} title="Xoá bộ phận" message="Bạn có chắc muốn xoá bộ phận này?"
        onCancel={() => setConfirm({ open: false, id: null })}
        onOk={() => handleDelete(confirm.id)} />
    </div>
  );
}
