import { useState } from "react";
import axios from "axios";
import { BASE_URL } from "~/config";
import * as FaIcons from "react-icons/fa";
import { Combobox } from "@headlessui/react";
import http from '~/api/http';

const COMMON_ICONS = [
  "FaHardHat","FaToilet","FaTools","FaBuilding","FaMoneyBill","FaQuestion",
  "FaUser","FaUsers","FaClipboardCheck","FaExclamationTriangle","FaCogs",
  "FaHandsHelping","FaLightbulb","FaCommentDots","FaBullhorn","FaEnvelopeOpenText",
  "FaCalendarCheck","FaClock","FaDoorOpen","FaChair","FaTrash","FaRecycle",
  "FaBoxOpen","FaWarehouse","FaSmile","FaFrown","FaChartLine","FaClipboardList",
  "FaCheckCircle","FaTimesCircle","FaCamera","FaImage","FaEdit","FaPen",
  "FaPhone","FaIdBadge","FaEye","FaComments","FaBell","FaChartBar","FaFileAlt",
  "FaTasks","FaBug","FaWrench","FaAnchor","FaFlag","FaStar","FaSearch","FaHandPaper",
  "FaFolderOpen"
];
const ICON_OPTIONS = COMMON_ICONS.filter((icon) => typeof FaIcons[icon] === "function");

function CategoriCreate() {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("FaFolderOpen");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");

  const filteredIcons =
    query.trim() === ""
      ? ICON_OPTIONS.slice(0, 60)
      : ICON_OPTIONS.filter((iconName) =>
          iconName.toLowerCase().includes(query.toLowerCase())
        );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setMessage("❗Vui lòng nhập tên danh mục");

    setLoading(true);
    setMessage("");
    try {
      const res = await http.post(`${BASE_URL}/api/suggestions/categories`, { name, icon });
      if (res.data.success) {
        setMessage("✅ Thêm danh mục thành công!");
        setName("");
        setIcon("FaFolderOpen");
        setQuery("");
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
  const ChevronDown = FaIcons.FaChevronDown;

  const isSuccess = message.startsWith("✅");
  const isError = message && !isSuccess;

  return (
    <main className="p-4 sm:p-6">
      <section className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-200">
            <FaIcons.FaPlus />
          </span>
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-slate-800">
              ➕ Thêm danh mục góp ý
            </h1>
            <p className="text-xs text-slate-500">
              Đặt tên và chọn biểu tượng để hiển thị trong Hòm thư góp ý.
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70 p-5 space-y-5">
          {/* Message banner */}
          {message && (
            <div
              className={[
                "rounded-xl px-4 py-3 text-sm",
                isSuccess
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
                  : "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
              ].join(" ")}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Tên danh mục</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên danh mục..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
              <p className="text-[11px] text-slate-500">Ví dụ: An toàn, Nhà vệ sinh, Sửa chữa…</p>
            </div>

            {/* Icon Combobox */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Biểu tượng</label>

              <Combobox value={icon} onChange={setIcon}>
                <div className="relative">
                  {/* Control (input + chevron + icon) */}
                  <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/40">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-200">
                      <SelectedIcon />
                    </span>
                    <Combobox.Input
                      className="w-full bg-transparent text-sm outline-none placeholder-slate-400"
                      onChange={(e) => setQuery(e.target.value)}
                      displayValue={(val) => val}
                      placeholder="Tìm icon theo tên (ví dụ: FaTools, FaBug...)"
                    />
                    <Combobox.Button className="text-slate-400 hover:text-slate-600">
                      <ChevronDown />
                    </Combobox.Button>
                  </div>

                  {/* Options */}
                  <Combobox.Options className="absolute z-20 mt-2 w-full max-h-64 overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                    {filteredIcons.length === 0 ? (
                      <li className="px-3 py-2 text-sm text-slate-500">Không tìm thấy</li>
                    ) : (
                      filteredIcons.map((iconName) => {
                        const Icon = FaIcons[iconName];
                        return (
                          <Combobox.Option
                            key={iconName}
                            value={iconName}
                            className={({ active, selected }) =>
                              [
                                "flex items-center gap-3 rounded-lg px-2 py-2 cursor-pointer",
                                active ? "bg-indigo-50" : "",
                                selected
                                  ? "ring-1 ring-inset ring-indigo-200"
                                  : "ring-1 ring-transparent",
                              ].join(" ")
                            }
                          >
                            {({ selected }) => (
                              <>
                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-200">
                                  <Icon />
                                </span>
                                <span className="text-sm text-slate-800 flex-1">{iconName}</span>
                                {selected && (
                                  <span className="text-indigo-600 text-xs font-medium">Đã chọn</span>
                                )}
                              </>
                            )}
                          </Combobox.Option>
                        );
                      })
                    )}
                  </Combobox.Options>
                </div>
              </Combobox>

              {/* Preview line */}
              <div className="flex items-center gap-2 text-slate-600 pt-1">
                <span className="text-[11px] uppercase tracking-wide">Xem trước</span>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-200">
                  <SelectedIcon />
                </span>
                <span className="text-sm font-medium text-slate-800">{icon}</span>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg
                    className="h-5 w-5 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
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
                      d="M4 12a8 8 0 018-8v3.5A4.5 4.5 0 0116.5 12H20a8 8 0 01-16 0z"
                    />
                  </svg>
                  Đang lưu...
                </span>
              ) : (
                "Lưu danh mục"
              )}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default CategoriCreate;
