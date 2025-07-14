import { useState } from "react";
import axios from "axios";
import { BASE_URL } from "~/config";
import * as FaIcons from "react-icons/fa";
import { Combobox } from "@headlessui/react";

const COMMON_ICONS = [
  "FaHardHat", "FaToilet", "FaTools", "FaBuilding", "FaMoneyBill", "FaQuestion",
  "FaUser", "FaUsers", "FaClipboardCheck", "FaExclamationTriangle", "FaCogs",
  "FaHandsHelping", "FaLightbulb", "FaCommentDots", "FaBullhorn", "FaEnvelopeOpenText",
  "FaCalendarCheck", "FaClock", "FaDoorOpen", "FaChair", "FaTrash", "FaRecycle",
  "FaBoxOpen", "FaWarehouse", "FaSmile", "FaFrown", "FaChartLine", "FaClipboardList",
  "FaCheckCircle", "FaTimesCircle", "FaCamera", "FaImage", "FaEdit", "FaPen",
  "FaPhone", "FaIdBadge", "FaEye", "FaComments", "FaBell", "FaChartBar", "FaFileAlt",
  "FaTasks", "FaBug", "FaWrench", "FaAnchor", "FaFlag", "FaStar", "FaSearch", "FaHandPaper"
];

// ✅ Chỉ lấy các icon thực sự có trong FaIcons
const ICON_OPTIONS = COMMON_ICONS.filter((icon) => typeof FaIcons[icon] === "function");


function CategoriCreate() {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("FaFolderOpen");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");

const filteredIcons =
  query === ""
    ? ICON_OPTIONS.slice(0, 50)
    : ICON_OPTIONS.filter((iconName) =>
        iconName.toLowerCase().includes(query.toLowerCase())
      );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) return setMessage("❗Vui lòng nhập tên danh mục");

    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post(`${BASE_URL}/api/suggestions/categories`, {
        name,
        icon,
      });

      if (res.data.success) {
        setMessage("✅ Thêm danh mục thành công!");
        setName("");
        setIcon("FaFolderOpen");
      } else {
        setMessage("❌ Thêm danh mục thất bại!");
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Có lỗi khi gửi dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  const SelectedIcon = FaIcons[icon] || FaIcons.FaFolderOpen;

  return (
    <div className="p-4">
      <div className="bg-white p-6 rounded-xl max-w-xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">➕ Thêm danh mục góp ý</h1>

        {message && (
          <div className="text-center text-sm font-medium text-blue-600">{message}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium mb-1 text-gray-700">Tên danh mục:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border px-4 py-2 rounded-md border-gray-300 focus:outline-none focus:ring focus:border-blue-500"
              placeholder="Nhập tên danh mục..."
            />
          </div>

          <div>
            <label className="block font-medium mb-1 text-gray-700">Biểu tượng:</label>
            <Combobox value={icon} onChange={setIcon}>
  <div className="relative">
    {/* Nút mở danh sách + xem trước icon */}
    <Combobox.Button className="w-full border px-4 py-2 rounded-md border-gray-300 text-left focus:outline-none focus:ring focus:border-blue-500">
      <div className="flex items-center gap-2">
        <SelectedIcon className="text-xl" />
        {icon}
      </div>
    </Combobox.Button>

    {/* ✅ Input gợi ý nằm riêng (trước dropdown) */}
    <Combobox.Input
      className="w-full border px-2 py-1 mt-1 rounded-md border-gray-300 focus:outline-none focus:ring focus:border-blue-500"
      placeholder="Tìm icon..."
      onChange={(e) => setQuery(e.target.value)}
      displayValue={() => icon}
    />

    <Combobox.Options className="absolute z-10 w-full mt-1 bg-white border max-h-60 overflow-auto shadow-lg rounded-md">
      {filteredIcons.length === 0 ? (
        <div className="px-4 py-2 text-gray-500">Không tìm thấy</div>
      ) : (
        filteredIcons.map((iconName) => {
          const IconComponent = FaIcons[iconName];
          return (
            <Combobox.Option
              key={iconName}
              value={iconName}
              className="px-4 py-2 hover:bg-blue-100 flex items-center gap-2 cursor-pointer"
            >
              <IconComponent className="text-lg" />
              {iconName}
            </Combobox.Option>
          );
        })
      )}
    </Combobox.Options>
  </div>
</Combobox>


            <div className="mt-2 text-gray-700 flex items-center gap-2">
              <span className="text-sm">Xem trước:</span>
              <SelectedIcon className="text-xl" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-medium py-2 rounded hover:bg-blue-700 transition-all"
          >
            {loading ? (
  <div className="flex items-center justify-center gap-2">
    <svg
      className="w-5 h-5 animate-spin text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z"
      />
    </svg>
    Đang lưu...
  </div>
) : (
  "Lưu danh mục"
)}

          </button>
        </form>
      </div>
    </div>
  );
}

export default CategoriCreate;
