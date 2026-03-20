import { useEffect, useState } from "react";
import { FaPlus, FaEdit, FaTrash, FaSearch } from "react-icons/fa";
import http from "~/api/http";
import { BASE_URL } from "~/config";

function TypePay() {
  const [data, setData] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ Code: "", Name: "" });

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [message, setMessage] = useState(null);

  const totalPages = Math.ceil(total / pageSize);

  // ================= FETCH =================
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await http.get(
        `${BASE_URL}/api/type-paylip?page=${page}&pageSize=${pageSize}&keyword=${keyword}`
      );
      setData(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [page, keyword]);

  // ================= ACTION =================
  const openAdd = () => {
    setEditing(null);
    setForm({ Code: "", Name: "" });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm(item);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      if (editing) {
        await http.put(`${BASE_URL}/api/type-paylip/${editing.Id}`, form);
        setMessage("Cập nhật thành công");
      } else {
        await http.post(`${BASE_URL}/api/type-paylip`, form);
        setMessage("Thêm mới thành công");
      }
      setShowModal(false);
      fetchData();
    } catch {
      setMessage("Lỗi thao tác");
    }
  };

  const handleDelete = async () => {
    try {
      await http.delete(`${BASE_URL}/api/type-paylip/${confirmDelete.Id}`);
      setMessage("Xóa thành công");
      setConfirmDelete(null);
      fetchData();
    } catch {
      setMessage("Không thể xóa");
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* HEADER CARD */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 shadow-[10px_10px_20px_#c7dbd4,-10px_-10px_20px_#ffffff] border border-emerald-100">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-emerald-800">
            Quản lý loại phiếu lương
          </h2>

          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl text-white bg-emerald-500 hover:bg-emerald-600 transition shadow"
          >
            <FaPlus /> Thêm mới
          </button>
        </div>

        {/* SEARCH */}
        <div className="mt-4 relative">
          <FaSearch className="absolute left-3 top-3 text-gray-400 text-sm" />
          <input
            placeholder="Tìm theo tên hoặc code..."
            value={keyword}
            onChange={(e) => {
              setPage(1);
              setKeyword(e.target.value);
            }}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-3xl bg-white shadow-[10px_10px_20px_#e5e7eb,-10px_-10px_20px_#ffffff] border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-emerald-50 text-emerald-800">
            <tr>
              <th className="px-4 py-3 text-left">Code</th>
              <th className="px-4 py-3 text-left">Tên</th>
              <th className="px-4 py-3 text-center">Hành động</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="text-center p-6 text-gray-400">
                  Đang tải...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center p-6 text-gray-400">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={item.Id}
                  className="border-t hover:bg-emerald-50/40 transition"
                >
                  <td className="px-4 py-2 font-medium">{item.Code}</td>
                  <td className="px-4 py-2">{item.Name}</td>
                  <td className="px-4 py-2 flex justify-center gap-3">
                    <button
                      onClick={() => openEdit(item)}
                      className="text-emerald-600 hover:scale-110 transition"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(item)}
                      className="text-red-500 hover:scale-110 transition"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div className="p-3 flex justify-center gap-2 border-t">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`px-3 py-1 rounded-xl text-sm transition ${
                page === i + 1
                  ? "bg-emerald-500 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* MODAL ADD/EDIT */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-5 w-[320px] shadow-xl space-y-3">
            <h3 className="text-lg font-semibold">
              {editing ? "Chỉnh sửa" : "Thêm mới"}
            </h3>

            <input
              placeholder="Code"
              value={form.Code}
              onChange={(e) =>
                setForm({ ...form, Code: e.target.value })
              }
              className="w-full border px-3 py-2 rounded-lg"
            />

            <input
              placeholder="Tên"
              value={form.Name}
              onChange={(e) =>
                setForm({ ...form, Name: e.target.value })
              }
              className="w-full border px-3 py-2 rounded-lg"
            />

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(false)}>Hủy</button>
              <button
                onClick={handleSubmit}
                className="bg-emerald-500 text-white px-4 py-1 rounded-lg"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-5 rounded-xl shadow-xl">
            <p>Bạn có chắc muốn xóa?</p>
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setConfirmDelete(null)}>Hủy</button>
              <button
                onClick={handleDelete}
                className="bg-red-500 text-white px-3 py-1 rounded"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MESSAGE */}
      {message && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-5 rounded-xl shadow-xl text-center">
            <p>{message}</p>
            <button
              onClick={() => setMessage(null)}
              className="mt-3 bg-emerald-500 text-white px-4 py-1 rounded"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TypePay;