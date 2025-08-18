import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FiPlus, FiEdit2, FiTrash2, FiSearch, FiX,
} from "react-icons/fi";
import * as FiIcons from "react-icons/fi";
import { Combobox } from "@headlessui/react";
import { BASE_URL } from "~/config";
import { useSelector } from "react-redux";
import { userSelector } from "~/redux/selectors";
import http from '~/api/http';

/* ---------- Modal đơn giản ---------- */
const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-50" aria-label="Đóng">
            <FiX />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

/* ---------- Danh sách ~50 icon hay dùng (Feather) ---------- */
const ALLOWED_ICON_NAMES = [
  "FiHome","FiGrid","FiBox","FiPackage","FiArchive","FiFolder","FiFileText","FiClipboard",
  "FiCheckSquare","FiTag","FiShield","FiUsers","FiUser","FiSettings","FiTool","FiKey","FiLock","FiUnlock",
  "FiMail","FiInbox","FiBell","FiMessageSquare","FiPhone","FiSmartphone","FiMonitor","FiGlobe",
  "FiMap","FiMapPin","FiTruck","FiTrendingUp","FiTrendingDown","FiPieChart","FiBarChart2","FiDollarSign",
  "FiShoppingCart","FiTrash2","FiDatabase","FiBook","FiBookmark","FiBriefcase","FiCalendar","FiClock",
  "FiImage","FiCamera","FiEdit2","FiPenTool","FiSearch","FiAlertTriangle","FiActivity","FiLayers"
];

/* Lọc ra những icon thực sự tồn tại trong react-icons/fi (phòng lỗi chính tả) */
const ICON_OPTIONS = ALLOWED_ICON_NAMES.filter((n) => typeof FiIcons[n] === "function");

/* ---------- Render icon theo tên (hoặc URL ảnh) ---------- */
const IconOrImg = ({ icon, className = "h-5 w-5" }) => {
  if (!icon) return <FiIcons.FiTag className={className + " text-slate-600"} />;
  // Nếu là tên icon (FiSomething) và có tồn tại -> render component
  if (/^Fi[A-Za-z0-9]+$/.test(icon) && typeof FiIcons[icon] === "function") {
    const Cmp = FiIcons[icon];
    return <Cmp className={className + " text-slate-700"} />;
  }
  // Ngược lại coi là URL ảnh
  return <img src={icon} alt="" className={className + " object-contain"} />;
};

/* ---------- Component chính ---------- */
function Module() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", icon: "FiGrid", description: "" });
  const [saving, setSaving] = useState(false);

  const [delId, setDelId] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });

  
    const tmp = useSelector(userSelector);
    const [user, setUser] = useState({});
  
    useEffect(() => {
      setUser(tmp?.login?.currentUser);
    }, [tmp]);

  // state cho combobox icon
  const [iconQuery, setIconQuery] = useState("");
  const filteredIconOptions =
    iconQuery.trim() === ""
      ? ICON_OPTIONS.slice(0, 50)
      : ICON_OPTIONS.filter((n) => n.toLowerCase().includes(iconQuery.toLowerCase())).slice(0, 50);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await http.get(`${BASE_URL}/api/modules`, { params: { q, page, pageSize } });
      if (res.data?.success) {
        setRows(res.data.data || []);
        setTotal(res.data.pagination?.total || 0);
      } else {
        setMsg({ type: "error", text: "Không tải được dữ liệu modules." });
      }
    } catch {
      setMsg({ type: "error", text: "Lỗi kết nối máy chủ." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [q, page]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", icon: "FiGrid", description: "" });
    setIconQuery("");
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      name: row.name || "",
      icon: row.icon || "FiGrid",
      description: row.description || "",
    });
    setIconQuery("");
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      setMsg({ type: "error", text: "Tên module là bắt buộc." });
      return;
    }
    try {
      setSaving(true);
      const payload = { ...form }; // name, icon (string/URL), description
      if (editing) {
        const res = await http.put(`${BASE_URL}/api/modules/${editing.moduleId}`, payload);
        if (res.data?.success) {
          setMsg({ type: "success", text: "Đã cập nhật module." });
          setModalOpen(false);
          fetchData();
        } else {
          setMsg({ type: "error", text: res.data?.message || "Cập nhật thất bại." });
        }
      } else {
        const res = await http.post(`${BASE_URL}/api/modules`, payload);
        if (res.data?.success) {
          setMsg({ type: "success", text: "Đã tạo module." });
          setModalOpen(false);
          setPage(1);
          fetchData();
        } else {
          setMsg({ type: "error", text: res.data?.message || "Tạo thất bại." });
        }
      }
    } catch (e) {
      setMsg({
        type: "error",
        text: e?.response?.status === 409 ? "Tên module đã tồn tại." : "Lỗi kết nối máy chủ.",
      });
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!delId) return;
    try {
      const res = await http.delete(`${BASE_URL}/api/modules/${delId}`);
      if (res.data?.success) {
        setMsg({ type: "success", text: "Đã xoá module." });
        if (rows.length === 1 && page > 1) setPage((p) => p - 1);
        fetchData();
      } else {
        setMsg({ type: "error", text: res.data?.message || "Xoá thất bại." });
      }
    } catch {
      setMsg({ type: "error", text: "Lỗi kết nối máy chủ." });
    } finally {
      setDelId(null);
    }
  };

  const SelectedIcon = (typeof FiIcons[form.icon] === "function" ? FiIcons[form.icon] : FiIcons.FiGrid);

  return (
    <div className="min-h-[70vh]">
      {/* Header thanh công cụ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Quản lý Modules</h1>
          <p className="text-sm text-slate-500">Danh sách phân hệ hiển thị trên trang chủ</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Tìm theo tên/mô tả…"
              className="w-64 max-w-[60vw] rounded-xl bg-white/70 pl-9 pr-3 py-2 text-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <button
            disabled={!(user?.userID === 1 || user?.userID === 3)}
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <FiPlus /> Thêm module
          </button>
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <div className="rounded-2xl bg-white/70 backdrop-blur ring-1 ring-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto p-4 sm:p-6">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500">
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Tên module</th>
                <th className="px-3 py-2">Icon</th>
                <th className="px-3 py-2">Mô tả</th>
                <th className="px-3 py-2 w-40">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-3 py-8 text-center text-slate-500">Đang tải…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="px-3 py-8 text-center text-slate-500">Không có dữ liệu</td></tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.moduleId} className="bg-white/80 ring-1 ring-slate-200">
                    <td className="px-3 py-2 align-top">{r.moduleId}</td>
                    <td className="px-3 py-2 align-top font-medium text-slate-800">{r.name}</td>
                    <td className="px-3 py-2 align-top">
                      <div className="inline-flex items-center gap-2 rounded-lg bg-white px-2.5 py-1 ring-1 ring-slate-200">
                        <IconOrImg icon={r.icon} />
                        <span className="text-xs text-slate-600">{r.icon || "—"}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 align-top text-slate-600">
                      {r.description || <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <div className="flex items-center gap-2">
                        <button
            disabled={!(user?.userID === 1 || user?.userID === 3)}
                          onClick={() => openEdit(r)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm ring-1 ring-slate-200 hover:bg-slate-50"
                        >
                          <FiEdit2 /> Sửa
                        </button>
                        <button
            disabled={!(user?.userID === 1 || user?.userID === 3)}
                          onClick={() => setDelId(r.moduleId)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm text-red-600 ring-1 ring-red-200 hover:bg-red-50"
                        >
                          <FiTrash2 /> Xoá
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Phân trang */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-slate-600">Trang {page}/{totalPages} — Tổng {total} mục</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg bg-white px-3 py-1.5 text-sm ring-1 ring-slate-200 disabled:opacity-50 hover:bg-slate-50"
              >
                Trước
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg bg-white px-3 py-1.5 text-sm ring-1 ring-slate-200 disabled:opacity-50 hover:bg-slate-50"
              >
                Sau
              </button>
            </div>
          </div>

          {/* Thông báo */}
          {msg.text && (
            <div className={`mt-4 rounded-xl px-3 py-2 text-sm ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-red-50 text-red-700 ring-1 ring-red-200'}`}>
              {msg.text}
            </div>
          )}
        </div>
      </div>

      {/* Modal Thêm/Sửa */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Cập nhật module" : "Thêm module"}>
        <div className="grid gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700">
              Tên module <span className="text-red-500">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="mt-1 w-full rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="vd: Quản lý công việc"
            />
          </div>

          {/* Icon Picker (Combobox) */}
          <div>
            <label className="text-sm font-medium text-slate-700">Icon</label>
            <Combobox value={form.icon} onChange={(val) => setForm((p) => ({ ...p, icon: val }))}>
              <div className="relative">
                {/* Control */}
                <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/40">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-200">
                    <SelectedIcon />
                  </span>
                  <Combobox.Input
                    className="w-full bg-transparent text-sm outline-none placeholder-slate-400"
                    onChange={(e) => setIconQuery(e.target.value)}
                    displayValue={(val) => val}
                    placeholder="Tìm icon (ví dụ: FiGrid, FiUsers...)"
                  />
                  <Combobox.Button className="text-slate-400 hover:text-slate-600">
                    <FiIcons.FiChevronDown />
                  </Combobox.Button>
                </div>

                {/* Options */}
                <Combobox.Options className="absolute z-20 mt-2 w-full max-h-64 overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                  {filteredIconOptions.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-slate-500">Không tìm thấy</li>
                  ) : (
                    filteredIconOptions.map((iconName) => {
                      const IconCmp = FiIcons[iconName];
                      return (
                        <Combobox.Option
                          key={iconName}
                          value={iconName}
                          className={({ active, selected }) =>
                            [
                              "flex items-center gap-3 rounded-lg px-2 py-2 cursor-pointer",
                              active ? "bg-indigo-50" : "",
                              selected ? "ring-1 ring-inset ring-indigo-200" : "ring-1 ring-transparent",
                            ].join(" ")
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-200">
                                <IconCmp />
                              </span>
                              <span className="text-sm text-slate-800 flex-1">{iconName}</span>
                              {selected && <span className="text-indigo-600 text-xs font-medium">Đã chọn</span>}
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
              <span className="text-sm font-medium text-slate-800">{form.icon}</span>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              Chọn 1 trong ~50 biểu tượng thường dùng. Hoặc bạn có thể lưu <b>URL ảnh</b> vào trường Icon (nhập thẳng URL).
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Mô tả</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="mt-1 w-full rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              rows={3}
              placeholder="Mô tả ngắn"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button onClick={() => setModalOpen(false)} className="rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200 hover:bg-slate-50">
              Huỷ
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "Đang lưu…" : (editing ? "Cập nhật" : "Thêm")}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal xác nhận xoá */}
      <Modal open={!!delId} onClose={() => setDelId(null)} title="Xác nhận xoá">
        <p className="text-sm text-slate-700">
          Bạn chắc chắn muốn xoá module này? Hành động không thể hoàn tác.
        </p>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button onClick={() => setDelId(null)} className="rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200 hover:bg-slate-50">
            Huỷ
          </button>
          <button onClick={doDelete} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
            Xoá
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default Module;
