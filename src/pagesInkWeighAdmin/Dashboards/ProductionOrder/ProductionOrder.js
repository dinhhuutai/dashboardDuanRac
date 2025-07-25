import { useEffect, useState } from "react";
import axios from "axios";
import { FiLoader, FiChevronDown, FiChevronRight } from "react-icons/fi";
import { BASE_URL_SERVER_THLA } from "~/config";
import { Fragment } from "react";

function ProductionOrder() {
  const today = new Date().toISOString().slice(0, 10);

  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState({}); // 👈 trạng thái mở rộng của từng hsktId

  const fetchData = async () => {
    if (!fromDate || !toDate) return;
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL_SERVER_THLA}/api/ink-weighing/by-hskt`, {
        params: { from: fromDate, to: toDate },
      });

      // ✅ Gộp theo hsktId
      const grouped = {};
      for (const row of res.data) {
        if (!grouped[row.hsktId]) grouped[row.hsktId] = [];
        grouped[row.hsktId].push(row);
      }

      setData(grouped);
    } catch (err) {
      console.error("Lỗi khi lấy dữ liệu:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fromDate, toDate]);

  const toggleExpand = (hsktId) => {
    setExpanded((prev) => ({ ...prev, [hsktId]: !prev[hsktId] }));
  };

  return (
    <div className="p-4">
      <div className="p-4 space-y-6 bg-white rounded-[6px]">
        <h1 className="text-xl font-bold mb-4">📦 Theo dõi cân mực theo Lệnh sản xuất</h1>

        <div className="flex items-center gap-4 mb-4">
          <div>
            <label className="block text-sm">Từ ngày</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm">Đến ngày</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="border p-2 rounded" />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-600">
            <FiLoader className="animate-spin text-xl" />
            <span>Đang tải dữ liệu...</span>
          </div>
        ) : Object.keys(data).length === 0 ? (
          <p className="text-center text-gray-500">Không có dữ liệu</p>
        ) : (
          <table className="table-auto w-full border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 w-6"></th>
                <th className="border p-2">HSKT</th>
                <th className="border p-2">Mã mực</th>
                <th className="border p-2">Tên mực</th>
                <th className="border p-2 text-right">Mực cấp (g)</th>
                <th className="border p-2 text-right">Mực hoàn (g)</th>
                <th className="border p-2 text-right">Mực sử dụng (g)</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data).map(([hsktId, items]) => {
                const tongCap = items.reduce((sum, i) => sum + i.cap, 0);
                const tongHoan = items.reduce((sum, i) => sum + i.hoan, 0);
                const tongSuDung = items.reduce((sum, i) => sum + i.su_dung, 0);
                const isOpen = expanded[hsktId];

                return (
                  <Fragment key={hsktId}>
                    <tr className="bg-gray-50 hover:bg-gray-100 cursor-pointer" onClick={() => toggleExpand(hsktId)}>
                      <td className="border p-2 text-center">
                        {isOpen ? <FiChevronDown /> : <FiChevronRight />}
                      </td>
                      <td className="border p-2 font-semibold">{hsktId}</td>
                      <td className="border p-2 italic text-gray-400">({items.length} mã mực)</td>
                      <td className="border p-2"></td>
                      <td className="border p-2 text-right">{tongCap.toFixed(1)}</td>
                      <td className="border p-2 text-right">{tongHoan.toFixed(1)}</td>
                      <td className="border p-2 text-right">{tongSuDung.toFixed(1)}</td>
                    </tr>

                    {isOpen &&
                      items.map((row, idx) => (
                        <tr key={idx} className="bg-white">
                          <td></td>
                          <td></td>
                          <td className="border p-2">{row.inkCode}</td>
                          <td className="border p-2">{row.inkName}</td>
                          <td className="border p-2 text-right">{row.cap.toFixed(1)}</td>
                          <td className="border p-2 text-right">{row.hoan.toFixed(1)}</td>
                          <td className="border p-2 text-right">{row.su_dung.toFixed(1)}</td>
                        </tr>
                      ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default ProductionOrder;
