import { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "~/config";
import { FaSpinner, FaTrashAlt } from "react-icons/fa";
import * as FaIcons from "react-icons/fa";

function CategoriList() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
const [errorModal, setErrorModal] = useState("");
const [deleting, setDeleting] = useState(false);


  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/suggestions/categories`);
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error("Lỗi tải danh mục", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (cat) => {
    setSelectedCategory(cat);
    setShowModal(true);
  };

  const confirmDelete = async () => {
  setDeleting(true); // 👉 Bắt đầu loading
    try {
      const res = await axios.delete(
        `${BASE_URL}/api/suggestions/categories/${selectedCategory.suggestionCategorieId}`
      );
      if (res.data.success) {
        setShowModal(false);
        setSelectedCategory(null);
        fetchCategories();
      } else {
        setErrorModal("❌ Xoá thất bại.");
      }
    } catch (err) {
      console.error("Lỗi xoá danh mục", err);
      setErrorModal("❌ Có lỗi xảy ra khi xoá.");
    } finally {
    setDeleting(false); // 👉 Kết thúc loading
  }
  };

  return (
    <div className="p-4">
      <div className="p-6 bg-white rounded-xl space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">📂 Danh mục góp ý</h1>

        {loading ? (
          <div className="flex justify-center items-center py-10 text-blue-600 text-lg gap-2 animate-pulse">
            <FaSpinner className="animate-spin" /> Đang tải danh mục...
          </div>
        ) : categories.length === 0 ? (
          <p className="text-center text-gray-500 italic">Không có danh mục nào.</p>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full border border-gray-200 text-sm rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gradient-to-r from-blue-100 to-blue-200 text-gray-700">
                  <th className="p-3 text-left font-semibold">#</th>
                  <th className="p-3 text-left font-semibold">Biểu tượng</th>
                  <th className="p-3 text-left font-semibold">Tên danh mục</th>
                  <th className="p-3 text-center font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat, idx) => {
                  const Icon = FaIcons[cat.icon] || FaIcons.FaFolderOpen;
                  return (
                    <tr
                      key={cat.suggestionCategorieId}
                      className={`${
                        idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } hover:bg-blue-50 transition-all`}
                    >
                      <td className="p-3 text-gray-600">{idx + 1}</td>
                      <td className="p-3 text-gray-700 text-xl">
                        <Icon />
                      </td>
                      <td className="p-3 text-gray-800 font-medium">{cat.name}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleDeleteClick(cat)}
                          className="text-red-500 hover:text-red-700 transition"
                        >
                          <FaTrashAlt />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Xác nhận xoá */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-sm space-y-4">
            <h2 className="text-xl font-bold text-red-600">Xác nhận xoá</h2>
            <p className="text-gray-700">
              Bạn có chắc muốn xoá danh mục "<strong>{selectedCategory?.name}</strong>" không?
            </p>
            <div className="flex justify-end gap-2 pt-4">
              <button
                className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700"
                onClick={() => setShowModal(false)}
              >
                Huỷ
              </button>
              <button
  onClick={confirmDelete}
  disabled={deleting}
  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
>
  {deleting && <FaIcons.FaSpinner className="animate-spin" />}
  {deleting ? "Đang xoá..." : "Xác nhận xoá"}
</button>

            </div>
          </div>
        </div>
      )}

      {/* Modal lỗi */}
{errorModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
    <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg">
      <h2 className="text-lg font-bold text-red-600 mb-2">Lỗi</h2>
      <p className="text-gray-700 mb-4">{errorModal}</p>
      <button
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
        onClick={() => setErrorModal("")}
      >
        Đóng
      </button>
    </div>
  </div>
)}

    </div>
  );
}

export default CategoriList;
