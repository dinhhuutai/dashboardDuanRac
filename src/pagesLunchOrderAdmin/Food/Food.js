// src/pages/Foods/FoodManager.jsx
import React, { useEffect, useState } from "react";
import { FaEdit, FaTrash, FaPlus, FaTimes } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { BASE_URL } from "~/config";
import http from "~/api/http";

function FoodManager() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editFood, setEditFood] = useState(null);

  const [form, setForm] = useState({
    foodName: "",
    description: "",
    imageUrl: "",
    colorCode: "#fef3c7",
  });

  // Load dữ liệu
  useEffect(() => {
    fetchFoods();
  }, []);

  async function fetchFoods() {
    setLoading(true);
    try {
      const res = await http.get(`${BASE_URL}/api/foods`);
      setFoods(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const openModal = (food = null) => {
    setEditFood(food);
    if (food) {
      setForm(food);
    } else {
      setForm({ foodName: "", description: "", imageUrl: "", colorCode: "#fef3c7" });
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditFood(null);
  };

  // Preview ảnh local
  function handlePreview(e) {
    const file = e.target.files[0];
    if (!file) return;
    setForm({
      ...form,
      imageFile: file,
      imageUrl: URL.createObjectURL(file),
    });
  }

  async function handleSave() {
    try {
      const formData = new FormData();
      formData.append("foodName", form.foodName);
      formData.append("description", form.description);
      formData.append("colorCode", form.colorCode);
      if (form.imageFile) {
        formData.append("image", form.imageFile);
      }

      if (editFood) {
        await http.put(`${BASE_URL}/api/foods/${editFood.foodId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await http.post(`${BASE_URL}/api/foods`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      closeModal();
      fetchFoods();
    } catch (err) {
      console.error(err);
      alert("❌ Lỗi khi lưu món ăn");
    }
  }

  async function handleDelete(foodId) {
    try {
      await http.delete(`${BASE_URL}/api/foods/${foodId}`);
      fetchFoods();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="p-6">
      <div className="bg-white/80 backdrop-blur rounded-2xl border border-slate-200 shadow-md p-5">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">🍱 Quản lý món ăn</h2>
          <button
            onClick={() => openModal()}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white flex items-center gap-2 hover:bg-emerald-700 transition"
          >
            <FaPlus /> Thêm món ăn
          </button>
        </div>

        {/* List Foods */}
        {loading ? (
          <p>Đang tải...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {foods.map((food) => (
              <div
                key={food.foodId}
                className="rounded-xl shadow-lg overflow-hidden flex flex-col transition hover:scale-[1.02] cursor-pointer"
                style={{ backgroundColor: food.colorCode }}
              >
                {food.imageUrl ? (
                  <img
                    src={food.imageUrl}
                    alt={food.foodName}
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div className="h-40 w-full flex items-center justify-center text-gray-400 text-sm bg-white/40">
                    Chưa có hình
                  </div>
                )}

                <div className="flex-1 p-4 flex flex-col justify-between bg-white/80 backdrop-blur">
                  <div>
                    <h3 className="font-bold text-lg mb-1">{food.foodName}</h3>
                    <p className="text-sm text-gray-600">{food.description}</p>
                  </div>

                  <div className="flex justify-end gap-2 mt-3">
                    <button
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      onClick={() => openModal(food)}
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded"
                      onClick={() => handleDelete(food.foodId)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Add/Edit */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[80vh]"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b px-5 py-3">
                <h3 className="text-lg font-bold">
                  {editFood ? "✏️ Sửa món ăn" : "➕ Thêm món ăn"}
                </h3>
                <button
                  onClick={closeModal}
                  className="p-2 rounded hover:bg-slate-100"
                >
                  <FaTimes />
                </button>
              </div>

              {/* Body (scrollable) */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                <input
                  type="text"
                  placeholder="Tên món ăn"
                  className="border rounded-lg px-3 py-2 w-full"
                  value={form.foodName}
                  onChange={(e) => setForm({ ...form, foodName: e.target.value })}
                />
                <textarea
                  placeholder="Mô tả"
                  className="border rounded-lg px-3 py-2 w-full"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />

                <div>
                  <label className="text-sm font-medium">🎨 Màu nền</label>
                  <input
                    type="color"
                    className="ml-2 w-12 h-8 rounded cursor-pointer"
                    value={form.colorCode}
                    onChange={(e) => setForm({ ...form, colorCode: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">📷 Hình ảnh</label>
                  <input type="file" onChange={handlePreview} />
                  {form.imageUrl && (
                    <img
                      src={form.imageUrl}
                      alt="preview"
                      className="h-32 w-full object-cover rounded-lg mt-2"
                    />
                  )}
                </div>

                {/* Demo Card */}
                <div
                  className="rounded-xl shadow-md overflow-hidden"
                  style={{ backgroundColor: form.colorCode }}
                >
                  {form.imageUrl && (
                    <img
                      src={form.imageUrl}
                      alt="demo"
                      className="h-32 w-full object-cover"
                    />
                  )}
                  <div className="p-3 bg-white/80 backdrop-blur">
                    <h4 className="font-semibold">
                      {form.foodName || "Tên món demo"}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {form.description || "Mô tả món ăn"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t px-5 py-3 flex justify-end gap-2">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 transition"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition"
                >
                  {editFood ? "💾 Cập nhật" : "➕ Thêm mới"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default FoodManager;
