import { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import { BASE_URL } from "~/config";
import { FaSpinner } from "react-icons/fa";

function SuggestionList() {
  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filterDate, setFilterDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [filterCategory, setFilterCategory] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchSuggestions();
  }, [filterDate, filterCategory]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/suggestions/categories`);
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error("Error loading categories", err);
    }
  };

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/suggestions`, {
        params: {
          date: filterDate,
          categoryId: filterCategory,
        },
      });
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching suggestions", err);
    } finally {
      setLoading(false);
    }
  };

  console.log(data);

  return (
    <div className="p-4">
      <div className="p-6 space-y-6 bg-white rounded-xl">
        <div className="border-b pb-4">
          <h1 className="text-3xl font-bold text-gray-800">📬 Danh sách góp ý của CNV</h1>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Ngày gửi</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring focus:border-blue-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Danh mục</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring focus:border-blue-500"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat.suggestionCategorieId} value={cat.suggestionCategorieId}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-16 text-blue-600 text-lg gap-2">
            <FaSpinner className="animate-spin text-2xl" />
            <span>Đang tải dữ liệu...</span>
          </div>
        ) : data.length === 0 ? (
          <p className="text-center text-gray-500 italic py-10">Không có góp ý nào phù hợp.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-blue-50 text-gray-700 text-sm">
                  <th className="p-3 border">#</th>
                  <th className="p-3 border">Danh mục</th>
                  <th className="p-3 border">Nội dung</th>
                  <th className="p-3 border">Ngày gửi</th>
                  <th className="p-3 border">Người gửi</th>
                  <th className="p-3 border">Bộ phận</th>
                  <th className="p-3 border">SĐT</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, idx) => (
                  <tr
                    key={item.suggestionId}
                    className={`${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-blue-100 transition`}
                  >
                    <td className="p-3 border text-center">{idx + 1}</td>
                    <td className="p-3 border">{item.categoryName}</td>
                    <td
                      className="p-3 border max-w-[300px] truncate text-gray-700"
                      title={item.content}
                    >
                      {item.content}
                    </td>
                    <td className="p-3 border text-gray-600">
                        {(() => {
  const d = new Date(item.created_at);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hour = String(d.getUTCHours()).padStart(2, "0");
  const minute = String(d.getUTCMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hour}:${minute}`;
})()}

                    </td>
                    <td className="p-3 border">{item.sender_name || "Ẩn danh"}</td>
                    <td className="p-3 border">{item.sender_department || "-"}</td>
                    <td className="p-3 border">{item.sender_phone || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default SuggestionList;
