import { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "~/config";
import * as FaIcons from "react-icons/fa";
import {
  FaSpinner,
  FaTrashAlt,
  FaExclamationTriangle,
  FaFolderOpen,
} from "react-icons/fa";
import http from '~/api/http';


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
      const res = await http.get(`${BASE_URL}/api/suggestions/categories`);
      if (res.data.success) setCategories(res.data.data);
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
    if (!selectedCategory) return;
    setDeleting(true);
    try {
      const res = await http.delete(
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
      setDeleting(false);
    }
  };

  return (
    <main className="p-4 sm:p-6">
      <section className="mx-auto max-w-[1100px] space-y-5">
        {/* Header */}
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-200">
              <FaFolderOpen />
            </div>
            <h1 className="text-lg sm:text-xl font-semibold text-slate-800">
              📂 Danh mục góp ý
            </h1>
          </div>
        </header>

        {/* Card */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70 overflow-hidden">
          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-14 text-slate-600">
              <FaSpinner className="mr-2 animate-spin text-indigo-600" />
              <span>Đang tải danh mục...</span>
            </div>
          )}

          {/* Empty state */}
          {!loading && categories.length === 0 && (
            <div className="py-14 text-center">
              <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <FaFolderOpen />
              </div>
              <p className="text-slate-600">Không có danh mục nào.</p>
            </div>
          )}

          {/* Table */}
          {!loading && categories.length > 0 && (
            <div className="relative overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-[680px] w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur supports-[backdrop-filter]:bg-slate-50/60">
                    <tr className="text-[12px] uppercase tracking-wide text-slate-600">
                      <th className="px-3 py-3 text-left border-b border-slate-200">#</th>
                      <th className="px-3 py-3 text-left border-b border-slate-200">Biểu tượng</th>
                      <th className="px-3 py-3 text-left border-b border-slate-200">Tên danh mục</th>
                      <th className="px-3 py-3 text-center border-b border-slate-200">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat, idx) => {
                      const Icon = FaIcons[cat.icon] || FaIcons.FaFolderOpen;
                      return (
                        <tr
                          key={cat.suggestionCategorieId}
                          className={`transition-colors ${
                            idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                          } hover:bg-indigo-50/50`}
                        >
                          <td className="px-3 py-3 text-slate-700">{idx + 1}</td>
                          <td className="px-3 py-3">
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-200">
                              <Icon />
                            </span>
                          </td>
                          <td className="px-3 py-3 font-medium text-slate-800">{cat.name}</td>
                          <td className="px-3 py-3">
                            <div className="flex items-center justify-center">
                              <button
                                onClick={() => handleDeleteClick(cat)}
                                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-red-600 shadow-sm hover:bg-red-100 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                                aria-label={`Xoá danh mục ${cat.name}`}
                              >
                                <FaTrashAlt className="text-sm" />
                                Xoá
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Modal xác nhận xoá */}
      {showModal && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white ring-1 ring-slate-200 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-200">
                <FaExclamationTriangle />
              </span>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Xác nhận xoá</h3>
                <p className="text-xs text-slate-500">Hành động này không thể hoàn tác.</p>
              </div>
            </div>

            {/* Body */}
            <div className="px-5 py-4 text-sm text-slate-700">
              Bạn có chắc muốn xoá danh mục{" "}
              <strong className="text-slate-900">“{selectedCategory?.name}”</strong> không?
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-200">
              <button
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400/30"
                onClick={() => setShowModal(false)}
              >
                Huỷ
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting && <FaSpinner className="animate-spin" />}
                {deleting ? "Đang xoá..." : "Xác nhận xoá"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal lỗi */}
      {errorModal && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white ring-1 ring-slate-200 shadow-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600 ring-1 ring-inset ring-red-200">
                <FaExclamationTriangle />
              </span>
              <h3 className="text-base font-semibold text-slate-900">Lỗi</h3>
            </div>
            <div className="px-5 py-4 text-sm text-slate-700">{errorModal}</div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-200">
              <button
                className="rounded-lg bg-red-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/40"
                onClick={() => setErrorModal("")}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default CategoriList;
