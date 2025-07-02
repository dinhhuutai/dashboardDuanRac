import { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "~/config";
import { BsCartPlusFill } from "react-icons/bs";

function TrashTruckCreate() {
  const [form, setForm] = useState({
    truckName: "",
    truckCode: "",
    trashTypeIDs: [], // Mảng chứa các ID được chọn
  });

  const [trashTypes, setTrashTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchTrashTypes = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/trash-types`);
        setTrashTypes(res.data);
      } catch (err) {
        console.error("Lỗi khi tải danh sách loại rác", err);
      }
    };

    fetchTrashTypes();
  }, []);

  const handleChange = (e) => {
    setMessage("");
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleCheckboxChange = (id) => {
    setForm((prev) => {
      const selected = prev.trashTypeIDs.includes(id)
        ? prev.trashTypeIDs.filter((i) => i !== id)
        : [...prev.trashTypeIDs, id];
      return { ...prev, trashTypeIDs: selected };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post(`${BASE_URL}/garbage-trucks`, {
        truckName: form.truckName,
        truckCode: form.truckCode,
        trashTypeIDs: form.trashTypeIDs,
      });

      setMessage("✅ Xe rác đã được thêm thành công!");
      setForm({ truckName: "", truckCode: "", trashTypeIDs: [] });
    } catch (err) {
      console.error(err);
      setMessage("❌ Thêm xe rác thất bại.");
    }

    setLoading(false);
  };

  return (
    <div className="p-4">
      <div className="p-4 space-y-6 bg-white rounded-[6px]">
        <h2 className="text-xl font-semibold flex items-center gap-2 text-blue-700">
          <BsCartPlusFill className="w-5 h-5" />
          Thêm Xe Rác
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium">Tên Xe</label>
            <input
              name="truckName"
              value={form.truckName}
              onChange={handleChange}
              className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Mã Xe</label>
            <input
              name="truckCode"
              value={form.truckCode}
              onChange={handleChange}
              className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Loại Rác</label>
            <div className="grid grid-cols-2 gap-3">
              {trashTypes.map((type) => (
                <label
                  key={type.trashTypeID}
                  className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={form.trashTypeIDs.includes(type.trashTypeID)}
                    onChange={() => handleCheckboxChange(type.trashTypeID)}
                    className="accent-blue-600"
                  />
                  <span className="text-sm">
                    {type.trashName} ({type.trashType})
                  </span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition w-full"
          >
            {loading ? "Đang lưu..." : "Lưu Xe Rác"}
          </button>

          {message && <div className="text-center text-sm mt-2">{message}</div>}
        </form>
      </div>
    </div>
  );
}

export default TrashTruckCreate;
