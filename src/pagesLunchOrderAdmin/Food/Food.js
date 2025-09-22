// src/pages/Foods/FoodManager.jsx
import React, { useEffect, useState } from "react";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaTimes,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { BASE_URL } from "~/config";
import http from "~/api/http";

const initialForm = {
  foodName: "",
  description: "",
  colorCode: "#fef3c7",
  // ảnh
  serverImageUrl: "",     // ảnh từ server
  imagePreviewUrl: "",    // ảnh blob để xem trước
  imageFile: null,        // file mới nếu có
};

/* ===================== Notice Modal ===================== */
function NoticeModal({ open, type = "info", title = "", message = "", onClose }) {
  const color =
    type === "success"
      ? "text-emerald-600"
      : type === "error"
      ? "text-rose-600"
      : "text-amber-600";
  const Icon =
    type === "success" ? FaCheckCircle : type === "error" ? FaExclamationTriangle : FaInfoCircle;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-[120] p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon className={`${color} text-2xl`} />
                <h4 className="font-bold text-lg">{title || "Thông báo"}</h4>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded hover:bg-slate-100"
                aria-label="Đóng"
              >
                <FaTimes />
              </button>
            </div>
            <div className="px-5 py-4 text-slate-700">
              <p>{message}</p>
            </div>
            <div className="px-5 py-3 border-t flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition shadow"
              >
                OK
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
/* ======================================================== */

function FoodManager() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);     // fetch list
  const [saving, setSaving] = useState(false);       // save create/update
  const [deletingId, setDeletingId] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editFood, setEditFood] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetFood, setTargetFood] = useState(null);

  // Notice state
  const [notice, setNotice] = useState({ open: false, type: "info", title: "", message: "" });
  const showNotice = (type, title, message) => setNotice({ open: true, type, title, message });
  const closeNotice = () => setNotice((n) => ({ ...n, open: false }));

  useEffect(() => { fetchFoods(); }, []);

  async function fetchFoods() {
    setLoading(true);
    try {
      const res = await http.get(`${BASE_URL}/api/foods`);
      setFoods(res.data || []);
    } catch (err) {
      console.error(err);
      showNotice("error", "Lỗi tải dữ liệu", "Không thể tải danh sách món ăn. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  const openModal = (food = null) => {
    setEditFood(food);
    setSaving(false);
    setForm(
      food
        ? {
            foodId: food.foodId,
            foodName: food.foodName || "",
            description: food.description || "",
            colorCode: food.colorCode || "#fef3c7",
            serverImageUrl: food.imageUrl || "", // giữ ảnh cũ
            imagePreviewUrl: "",                 // reset preview
            imageFile: null,                     // reset file
          }
        : { ...initialForm }
    );
    setModalOpen(true);
  };

  function handlePreview(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (form.imagePreviewUrl) URL.revokeObjectURL(form.imagePreviewUrl);

    setForm((prev) => ({
      ...prev,
      imageFile: file,
      imagePreviewUrl: URL.createObjectURL(file),
    }));
  }

  const closeModal = (force = false) => {
    if (!force && saving) return;
    if (form.imagePreviewUrl) URL.revokeObjectURL(form.imagePreviewUrl);
    setModalOpen(false);
    setEditFood(null);
    setForm({ ...initialForm });
  };

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      const isEdit = !!editFood?.foodId;
      const url = isEdit
        ? `${BASE_URL}/api/foods/${editFood.foodId}`
        : `${BASE_URL}/api/foods`;

      if (form.imageFile) {
        // Có ảnh mới -> multipart
        const fd = new FormData();
        fd.append("foodName", form.foodName || "");
        fd.append("description", form.description || "");
        fd.append("colorCode", form.colorCode || "#fef3c7");
        fd.append("image", form.imageFile);
        if (isEdit) {
          await http.put(url, fd);
        } else {
          await http.post(url, fd);
        }
      } else {
        // Không đổi ảnh -> JSON kèm imageUrl cũ
        const payload = {
          foodName: form.foodName || "",
          description: form.description || "",
          colorCode: form.colorCode || "#fef3c7",
          imageUrl: form.serverImageUrl || "",
        };
        if (isEdit) {
          await http.put(url, payload);
        } else {
          await http.post(url, payload);
        }
      }

      closeModal(true);
      fetchFoods();
      showNotice("success", "Thành công", isEdit ? "Đã cập nhật món ăn." : "Đã thêm món ăn mới.");
    } catch (err) {
      console.error(err);
      showNotice("error", "Lỗi khi lưu", "Không thể lưu món ăn. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  function askDelete(food) {
    if (saving || deletingId) return;
    setTargetFood(food);
    setConfirmOpen(true);
  }

  async function handleConfirmDelete() {
    if (!targetFood) return;
    try {
      setDeletingId(targetFood.foodId);
      await http.delete(`${BASE_URL}/api/foods/${targetFood.foodId}`);
      setConfirmOpen(false);
      setTargetFood(null);
      setDeletingId(null);
      fetchFoods();
      showNotice("success", "Đã xoá", "Xoá món ăn thành công.");
    } catch (err) {
      console.error(err);
      setDeletingId(null);
      showNotice("error", "Xoá không thành công", "Vui lòng thử lại.");
    }
  }

  const previewSrc = form.imagePreviewUrl || form.serverImageUrl;

  return (
    <div className="p-6 z-[99]">
      <div className="bg-white/80 backdrop-blur rounded-2xl border border-slate-200 p-5 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{`🍱 Quản lý món ăn (${foods.length})`}</h2>
          <button
            onClick={() => openModal()}
            disabled={saving || deletingId}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white flex items-center gap-2 shadow-lg hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.97] transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <FaPlus /> Thêm món ăn
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 text-slate-700">
            <FaSpinner className="animate-spin text-emerald-600 text-xl" />
            <span>Đang tải danh sách...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <AnimatePresence>
              {foods.map((food) => (
                <motion.div
                  key={food.foodId}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="relative rounded-2xl shadow-xl overflow-hidden flex flex-col transition hover:scale-[1.02] hover:shadow-2xl cursor-pointer"
                  style={{ backgroundColor: food.colorCode }}
                >
                  {deletingId === food.foodId && (
                    <div className="absolute inset-0 z-10 grid place-items-center bg-white/70 backdrop-blur-sm">
                      <div className="flex items-center gap-2 text-slate-700">
                        <FaSpinner className="animate-spin text-rose-600" />
                        <span>Đang xoá...</span>
                      </div>
                    </div>
                  )}

                  {food.imageUrl ? (
                    <img src={food.imageUrl} alt={food.foodName} className="h-56 w-full object-cover" />
                  ) : (
                    <div className="h-56 w-full flex items-center justify-center text-gray-400 text-sm bg-white/40">
                      Chưa có hình
                    </div>
                  )}

                  <div className="flex-1 p-5 flex flex-col justify-between bg-white/80 backdrop-blur">
                    <div>
                      <h3 className="font-bold text-xl mb-1">{food.foodName}</h3>
                      <p className="text-sm text-gray-600 line-clamp-3">{food.description}</p>
                    </div>

                    <div className="flex justify-end gap-3 mt-4">
                      <button
                        className="px-3 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                        onClick={() => openModal(food)}
                        disabled={saving || !!deletingId}
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="px-3 py-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                        onClick={() => askDelete(food)}
                        disabled={saving || !!deletingId}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modal add/edit */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[80vh]"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              {saving && (
                <div className="absolute inset-0 z-10 grid place-items-center bg-white/70 backdrop-blur-sm">
                  <div className="flex items-center gap-3 text-slate-700">
                    <FaSpinner className="animate-spin text-emerald-600 text-2xl" />
                    <span>Đang lưu, vui lòng đợi...</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center border-b px-5 py-3">
                <h3 className="text-lg font-bold">
                  {editFood ? "✏️ Sửa món ăn" : "➕ Thêm món ăn"}
                </h3>
                <button
                  onClick={() => closeModal()}
                  disabled={saving}
                  className="p-2 rounded hover:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                <input
                  type="text"
                  placeholder="Tên món ăn"
                  className="border rounded-lg px-3 py-2 w-full disabled:opacity-60"
                  value={form.foodName}
                  onChange={(e) => setForm({ ...form, foodName: e.target.value })}
                  disabled={saving}
                />
                <textarea
                  placeholder="Mô tả"
                  className="border rounded-lg px-3 py-2 w-full disabled:opacity-60"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  disabled={saving}
                />

                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">🎨 Màu nền</label>
                  <input
                    type="color"
                    className="w-12 h-8 rounded cursor-pointer disabled:cursor-not-allowed"
                    value={form.colorCode}
                    onChange={(e) => setForm({ ...form, colorCode: e.target.value })}
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">📷 Hình ảnh</label>
                  <input type="file" onChange={handlePreview} disabled={saving} />
                  {previewSrc && (
                    <img
                      src={previewSrc}
                      alt="preview"
                      className="h-40 w-full object-cover rounded-lg mt-2"
                    />
                  )}
                </div>

                <div
                  className="rounded-2xl shadow-xl overflow-hidden mt-4"
                  style={{ backgroundColor: form.colorCode }}
                >
                  {previewSrc && (
                    <img src={previewSrc} alt="demo" className="h-56 w-full object-cover" />
                  )}
                  <div className="p-4 bg-white/80 backdrop-blur">
                    <h4 className="font-semibold text-lg">
                      {form.foodName || "Tên món ăn"}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {form.description || "Mô tả"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t px-5 py-3 flex justify-end gap-3">
                <button
                  onClick={() => closeModal()}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 transition shadow disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.foodName?.trim()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-lg disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>{editFood ? "💾 Cập nhật" : "➕ Thêm mới"}</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Delete */}
      <AnimatePresence>
        {confirmOpen && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-[110] p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <div className="px-5 py-4 border-b">
                <h4 className="font-bold text-lg">Xác nhận xoá</h4>
              </div>
              <div className="px-5 py-4 text-slate-700">
                {targetFood ? (
                  <p>
                    Bạn có chắc muốn xoá <span className="font-semibold">{targetFood.foodName}</span>?
                  </p>
                ) : (
                  <p>Bạn có chắc muốn xoá mục này?</p>
                )}
              </div>
              <div className="px-5 py-3 border-t flex justify-end gap-3">
                <button
                  onClick={() => { if (!deletingId) { setConfirmOpen(false); setTargetFood(null); } }}
                  disabled={!!deletingId}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 transition shadow disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Huỷ
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={!!deletingId}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition shadow inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {deletingId ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                  {deletingId ? "Đang xoá..." : "Xoá"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notice modal */}
      <NoticeModal
        open={notice.open}
        type={notice.type}
        title={notice.title}
        message={notice.message}
        onClose={closeNotice}
      />
    </div>
  );
}

export default FoodManager;
