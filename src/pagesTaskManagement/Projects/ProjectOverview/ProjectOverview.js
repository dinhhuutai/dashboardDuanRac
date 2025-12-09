// src/pagesTaskManagement/Projects/ProjectOverview/ProjectOverview.js
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import http from "~/api/http";
import { BASE_URL } from "~/config";
import { userSelector } from "~/redux/selectors";

function formatDate(value) {
  if (!value) return "";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

// Label nhỏ
function LabelSmall({ children }) {
  return (
    <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
      {children}
    </div>
  );
}

function StatusBadge({ status }) {
  if (!status) return null;
  const map = {
    active: {
      label: "Đang chạy",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    done: {
      label: "Hoàn thành",
      className: "bg-sky-50 text-sky-700 border-sky-200",
    },
    hold: {
      label: "Tạm dừng",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    cancel: {
      label: "Huỷ",
      className: "bg-rose-50 text-rose-700 border-rose-200",
    },
  };
  const info =
    map[status] || {
      label: status,
      className: "bg-slate-50 text-slate-700 border-slate-200",
    };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${info.className}`}
    >
      {info.label}
    </span>
  );
}

function ScopeBadge({ scope }) {
  if (!scope) return null;
  const map = {
    department: {
      label: "Trong phòng",
      className: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
    multi: {
      label: "Liên phòng",
      className: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
    },
    company: {
      label: "Toàn công ty",
      className: "bg-slate-50 text-slate-700 border-slate-200",
    },
  };
  const info =
    map[scope] || {
      label: scope,
      className: "bg-slate-50 text-slate-700 border-slate-200",
    };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${info.className}`}
    >
      {info.label}
    </span>
  );
}

function Card({ children, className = "" }) {
  return (
    <div
      className={
        "bg-white border border-slate-200 shadow-[0_18px_45px_rgba(15,23,42,0.04)] rounded-2xl p-4 md:p-5 " +
        className
      }
    >
      {children}
    </div>
  );
}

function Chip({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600">
      {children}
    </span>
  );
}

/* =============== Modal basic =============== */
function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-700"
          >
            ✕
          </button>
        </div>
        <div className="p-4 overflow-auto">{children}</div>
      </div>
    </div>
  );
}

/* =============== Modal: Bảng công việc =============== */
function TaskBoardModal({ tasks, onClose, projectName }) {
  // group theo statusCode
  const columns = useMemo(() => {
    const map = {};
    tasks.forEach((t) => {
      const code = t.statusCode || "other";
      if (!map[code]) map[code] = [];
      map[code].push(t);
    });
    return map;
  }, [tasks]);

  const statusOrder = ["todo", "inprogress", "review", "done"];

  const orderedKeys = [
    ...statusOrder.filter((k) => columns[k]),
    ...Object.keys(columns).filter((k) => !statusOrder.includes(k)),
  ];

  return (
    <ModalShell
      title={`Bảng công việc – ${projectName || "Dự án"}`}
      onClose={onClose}
    >
      {tasks.length === 0 ? (
        <div className="text-xs text-slate-500 italic">
          Chưa có công việc nào cho dự án này.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {orderedKeys.map((code) => {
            const colTasks = columns[code];
            const label = colTasks[0]?.statusName || code;
            return (
              <div
                key={code}
                className="bg-slate-50 border border-slate-200 rounded-xl p-2 flex flex-col"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-700">
                    {label}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {colTasks.length}
                  </span>
                </div>
                <div className="space-y-2 overflow-auto">
                  {colTasks.map((t) => (
                    <div
                      key={t.taskId}
                      className="bg-white rounded-lg border border-slate-200 px-2 py-1.5 shadow-sm"
                    >
                      <div className="font-medium text-slate-800 truncate">
                        {t.title}
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        Hạn: {t.dueDate ? formatDate(t.dueDate) : "chưa đặt"}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Ưu tiên: {t.priority || "thường"} • Tiến độ:{" "}
                        {t.progressPercent ?? 0}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ModalShell>
  );
}

/* =============== Modal: Thêm công việc =============== */
function CreateTaskModal({ projectId, onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Vui lòng nhập tiêu đề công việc");
      return;
    }
    setSaving(true);
    setErrorMsg("");

    try {
      // ⚠️ Sửa lại endpoint cho đúng backend thực tế nếu khác
      await http.post(
        `${BASE_URL}/api/task-management/${projectId}/tasks`,
        {
          title: title.trim(),
          priority,
          dueDate: dueDate || null,
        }
      );
      onCreated?.();
      onClose();
    } catch (err) {
      console.error("create task error", err);
      setErrorMsg(
        err?.response?.data?.message || "Tạo công việc thất bại, thử lại sau."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title="Thêm công việc mới" onClose={onClose}>
      <form className="space-y-3 text-sm" onSubmit={handleSubmit}>
        <div>
          <LabelSmall>Tiêu đề công việc *</LabelSmall>
          <input
            type="text"
            className="w-full inset px-3 py-2 text-sm outline-none"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nhập tiêu đề công việc"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <LabelSmall>Ưu tiên</LabelSmall>
            <select
              className="w-full inset px-3 py-2 text-sm outline-none"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="low">Thấp</option>
              <option value="medium">Trung bình</option>
              <option value="high">Cao</option>
              <option value="urgent">Khẩn cấp</option>
            </select>
          </div>
          <div>
            <LabelSmall>Hạn hoàn thành</LabelSmall>
            <input
              type="date"
              className="w-full inset px-3 py-2 text-sm outline-none"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        {errorMsg && (
          <p className="text-xs text-rose-500 mt-1">{errorMsg}</p>
        )}

        <div className="pt-2 flex justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            disabled={saving}
          >
            Huỷ
          </button>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 disabled:opacity-60"
            disabled={saving}
          >
            {saving ? "Đang lưu..." : "Tạo công việc"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

/* =============== Modal: Thêm thành viên =============== */
function AddMemberModal({ projectId, onClose, onAdded }) {
  const [searchText, setSearchText] = useState("@");
  const [userOptions, setUserOptions] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const [roles, setRoles] = useState([]);
  const [projectRoleId, setProjectRoleId] = useState("");
  const [note, setNote] = useState("");

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // load roles khi mở modal
  useEffect(() => {
  let isMounted = true;
  async function loadRoles() {
    setLoadingRoles(true);
    try {
      const res = await http.get(
        `${BASE_URL}/api/task-management/project-roles`
      );
      if (!isMounted) return;
      const list = res.data?.data || [];
      setRoles(list);
      if (list.length) setProjectRoleId(String(list[0].projectRoleId));
    } catch (err) {
      console.error("load project roles error", err);
    } finally {
      setLoadingRoles(false);
    }
  }
  loadRoles();
  return () => {
    isMounted = false;
  };
}, []);

  // debounce search user
  useEffect(() => {
    const v = searchText.trim();
    // chỉ search khi có ký tự sau @
    const query = v.startsWith("@") ? v.slice(1) : v;
    if (!query) {
      setUserOptions([]);
      return;
    }

    let cancelled = false;
    setLoadingUsers(true);

    const timer = setTimeout(async () => {
      try {
        const res = await http.get(
          `${BASE_URL}/api/task-management/users/search`,
          { params: { q: query } }
        );
        if (cancelled) return;
        setUserOptions(res.data?.data || []);
      } catch (err) {
        console.error("search users error", err);
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    }, 300); // debounce 300ms

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchText]);

  function handleSelectUser(u) {
    setSelectedUser(u);
    setSearchText(`@${u.fullName} (${u.userName})`);
    setUserOptions([]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedUser) {
      setErrorMsg("Vui lòng chọn thành viên");
      return;
    }
    if (!projectRoleId) {
      setErrorMsg("Vui lòng chọn vai trò");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    try {
      await http.post(
        `${BASE_URL}/api/task-management/${projectId}/members`,
        {
          userId: selectedUser.userId,
          projectRoleId: Number(projectRoleId),
          note: note || null,
        }
      );
      onAdded?.();
      onClose();
    } catch (err) {
      console.error("add member error", err);
      setErrorMsg(
        err?.response?.data?.message || "Thêm thành viên thất bại, thử lại sau."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title="Thêm thành viên dự án" onClose={onClose}>
      <form className="space-y-3 text-sm" onSubmit={handleSubmit}>
        {/* Ô search user kiểu @tên */}
        <div>
          <LabelSmall>Thành viên *</LabelSmall>
          <div className="relative">
            <input
              type="text"
              className="w-full inset px-3 py-2 text-sm outline-none"
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setSelectedUser(null);
              }}
              placeholder='Gõ "@tên" hoặc tên, mã nhân viên...'
            />
            {loadingUsers && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">
                Đang tìm...
              </div>
            )}

            {userOptions.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-auto z-10">
                {userOptions.map((u) => (
                  <button
                    key={u.userId}
                    type="button"
                    onClick={() => handleSelectUser(u)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50"
                  >
                    <div className="font-medium text-slate-800">
                      {u.fullName} <span className="text-slate-400">({u.userName})</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {u.departmentName || "-"}
                      {u.teamName ? ` • Nhóm: ${u.teamName}` : ""}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedUser && (
            <p className="text-[11px] text-emerald-600 mt-0.5">
              Đã chọn: {selectedUser.fullName} ({selectedUser.userName})
            </p>
          )}
        </div>

        {/* Chọn role */}
        <div>
          <LabelSmall>Vai trò trong dự án *</LabelSmall>
          <select
            className="w-full inset px-3 py-2 text-sm outline-none"
            value={projectRoleId}
            onChange={(e) => setProjectRoleId(e.target.value)}
            disabled={loadingRoles}
          >
            {roles.length === 0 && (
              <option value="">Đang tải vai trò...</option>
            )}
            {roles.map((r) => (
              <option key={r.projectRoleId} value={r.projectRoleId}>
                {r.name}
                {r.isManagerial ? " (Quản lý)" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Ghi chú */}
        <div>
          <LabelSmall>Ghi chú</LabelSmall>
          <textarea
            className="w-full inset px-3 py-2 text-sm outline-none min-h-[60px]"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ghi chú (nếu có)"
          />
        </div>

        {errorMsg && (
          <p className="text-xs text-rose-500 mt-1">{errorMsg}</p>
        )}

        <div className="pt-2 flex justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            disabled={saving}
          >
            Huỷ
          </button>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 disabled:opacity-60"
            disabled={saving}
          >
            {saving ? "Đang lưu..." : "Thêm thành viên"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

/* =====================
   Files Panel (dự án)
   ===================== */
function ProjectFilesPanel({ projectId }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function loadFiles() {
    setLoading(true);
    try {
      const res = await http.get(
        `${BASE_URL}/api/task-management/${projectId}/files`
      );
      setFiles(res.data?.data || []);
    } catch (e) {
      console.error("load project files error", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (projectId) loadFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function handleUpload(e) {
    const selected = e.target.files;
    if (!selected || !selected.length) return;

    const formData = new FormData();
    Array.from(selected).forEach((f) => {
      formData.append("files", f);
    });

    setUploading(true);
    try {
      const res = await http.post(
        `${BASE_URL}/api/task-management/${projectId}/files`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      const newFiles = res.data?.data || [];
      setFiles((prev) => [...newFiles, ...prev]);
    } catch (err) {
      console.error("upload project files error", err);
      alert("Tải tệp lên thất bại");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete(pfileId) {
    if (!window.confirm("Bạn có chắc muốn xoá tệp này?")) return;
    try {
      await http.delete(
        `${BASE_URL}/api/task-management/files/${pfileId}`
      );
      setFiles((prev) => prev.filter((f) => f.pfileId !== pfileId));
    } catch (err) {
      console.error("delete project file error", err);
      alert("Xoá tệp thất bại");
    }
  }

  async function handleDownload(pfileId) {
    try {
      const res = await http.get(
        `${BASE_URL}/api/task-management/files/${pfileId}/download`
      );
      const url = res.data?.url;
      if (url) {
        window.open(url, "_blank");
      }
    } catch (err) {
      console.error("download project file error", err);
      alert("Tải tệp thất bại");
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <LabelSmall>Tệp & hình ảnh</LabelSmall>
          <p className="text-xs text-slate-500">
            Lưu trữ file liên quan đến dự án (tài liệu, hình ảnh, báo cáo…).
          </p>
        </div>
        <div>
          <label className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 cursor-pointer">
            {uploading ? "Đang tải..." : "+ Thêm tệp"}
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {loading && (
        <div className="text-xs text-slate-400">Đang tải danh sách tệp…</div>
      )}

      {!loading && files.length === 0 && (
        <div className="text-xs text-slate-500 italic">
          Chưa có tệp nào cho dự án này.
        </div>
      )}

      {!loading && files.length > 0 && (
        <div className="mt-2 max-h-64 overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[11px] text-slate-400 border-b border-slate-100">
                <th className="py-1 pr-2">Tên tệp</th>
                <th className="py-1 pr-2">Dung lượng</th>
                <th className="py-1 pr-2">Người tải lên</th>
                <th className="py-1 pr-2">Thời gian</th>
                <th className="py-1 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {files.map((f) => (
                <tr
                  key={f.pfileId}
                  className="border-b border-slate-50 hover:bg-slate-50/60"
                >
                  <td className="py-1 pr-2">
                    <button
                      type="button"
                      onClick={() => handleDownload(f.pfileId)}
                      className="text-xs text-sky-600 hover:underline"
                    >
                      {f.fileName}
                    </button>
                  </td>
                  <td className="py-1 pr-2 text-slate-500">
                    {f.fileSize != null
                      ? `${(f.fileSize / 1024).toFixed(1)} KB`
                      : "-"}
                  </td>
                  <td className="py-1 pr-2 text-slate-500">
                    {f.uploadedByName
                      ? `${f.uploadedByName} (${f.uploadedByUserName})`
                      : "-"}
                  </td>
                  <td className="py-1 pr-2 text-slate-500">
                    {f.uploadedAt
                      ? new Date(f.uploadedAt).toLocaleString("vi-VN")
                      : ""}
                  </td>
                  <td className="py-1 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(f.pfileId)}
                      className="text-[11px] text-rose-500 hover:underline"
                    >
                      Xoá
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

/* =====================
   Main: ProjectOverview
   ===================== */

function ProjectOverview() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const currentUser = useSelector(userSelector);

  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState(null);
  const [myRole, setMyRole] = useState(null);
  const [members, setMembers] = useState([]);
  const [taskStats, setTaskStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [timeSummary, setTimeSummary] = useState(null);
  const [fileSummary, setFileSummary] = useState(null);
  const [chatSummary, setChatSummary] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const [showBoardModal, setShowBoardModal] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  const styles = `
    .inset {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
    }
  `;

  useEffect(() => {
    if (!projectId) return;
    loadOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function loadOverview() {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await http.get(
        `${BASE_URL}/api/task-management/${projectId}/overview`
      );
      const d = res.data?.data;
      setProject(d?.project || null);
      setMyRole(d?.myRole || null);
      setMembers(d?.members || []);
      setTaskStats(d?.taskStats || null);
      setRecentTasks(d?.recentTasks || []);
      setTimeSummary(d?.timeSummary || null);
      setFileSummary(d?.fileSummary || null);
      setChatSummary(d?.chatSummary || null);
    } catch (err) {
      console.error("load project overview error", err);
      setErrorMsg(
        err?.response?.data?.message || "Không tải được thông tin dự án"
      );
    } finally {
      setLoading(false);
    }
  }

  const title = project?.name || "Chi tiết dự án";
  const code = project?.code;
  const myRoleLabel = useMemo(() => {
    if (!myRole) return "";
    let s = myRole.projectRoleName || "";
    if (myRole.isManagerialRole) s += " (Quản lý)";
    return s;
  }, [myRole]);

  const totalMinutes = timeSummary?.totalMinutes || 0;
  const totalHours = (totalMinutes / 60).toFixed(1);

  return (
    <div className="min-h-screen bg-slate-50/60">
      <style>{styles}</style>
      <div className="max-w-6xl mx-auto py-4 md:py-5 space-y-4 md:space-y-5">
        {/* Header */}
        <Card className="flex flex-col gap-3 md:gap-4">
          <div className="flex items-start justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mt-1 text-[11px] text-slate-400 hover:text-slate-700"
            >
              ← Quay lại
            </button>

            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowCreateTaskModal(true)}
                className="px-3 py-1.5 rounded-full bg-slate-900 text-white font-medium hover:bg-slate-800"
              >
                + Thêm công việc
              </button>
              <button
                type="button"
                onClick={() => setShowAddMemberModal(true)}
                className="px-3 py-1.5 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                + Thêm thành viên
              </button>
              <button
                type="button"
                onClick={() => setShowBoardModal(true)}
                className="px-3 py-1.5 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Bảng công việc
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-mono text-slate-400">
                {code}
              </div>
              <h1 className="mt-1 text-xl md:text-2xl font-bold text-slate-900 break-words">
                {title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                {project?.status && <StatusBadge status={project.status} />}
                {project?.scope && <ScopeBadge scope={project.scope} />}
                {project?.ownerDepartmentName && (
                  <Chip>Phòng chính: {project.ownerDepartmentName}</Chip>
                )}
                {myRoleLabel && <Chip>Vai trò của bạn: {myRoleLabel}</Chip>}
              </div>
              {project?.description && (
                <p className="mt-2 text-sm text-slate-600">
                  {project.description}
                </p>
              )}
              {errorMsg && (
                <p className="mt-2 text-xs text-rose-500">{errorMsg}</p>
              )}
            </div>

            {/* Quick stats */}
            <div className="w-full md:w-72 flex flex-col gap-2 text-xs text-slate-600">
              <div className="inset px-3 py-2.5">
                <LabelSmall>Thời gian</LabelSmall>
                <div className="text-[11px]">
                  <div>
                    <span className="font-semibold">Bắt đầu: </span>
                    {project?.startDate ? formatDate(project.startDate) : "—"}
                  </div>
                  <div>
                    <span className="font-semibold">Hạn dự kiến: </span>
                    {project?.dueDate ? formatDate(project.dueDate) : "—"}
                  </div>
                  <div>
                    <span className="font-semibold">Tạo lúc: </span>
                    {project?.createdAt
                      ? new Date(project.createdAt).toLocaleString("vi-VN")
                      : "—"}
                  </div>
                </div>
              </div>
              <div className="inset px-3 py-2.5 flex items-center justify-between gap-2">
                <div>
                  <LabelSmall>Task</LabelSmall>
                  <div className="text-[11px] space-y-0.5">
                    <div>
                      Tổng:{" "}
                      <b>
                        {taskStats?.totalTasks != null
                          ? taskStats.totalTasks
                          : 0}
                      </b>
                    </div>
                    <div>
                      Đã xong:{" "}
                      <b>
                        {taskStats?.doneTasks != null ? taskStats.doneTasks : 0}
                      </b>
                    </div>
                    <div>
                      Đang mở:{" "}
                      <b>
                        {taskStats?.openTasks != null ? taskStats.openTasks : 0}
                      </b>
                    </div>
                    <div>
                      Trễ hạn:{" "}
                      <b>
                        {taskStats?.overdueTasks != null
                          ? taskStats.overdueTasks
                          : 0}
                      </b>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <LabelSmall>Thời gian log</LabelSmall>
                  <div className="text-base font-semibold text-slate-900">
                    {totalHours}h
                  </div>
                  <div className="text-[11px] text-slate-500">
                    ({totalMinutes} phút)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* MAIN: Bên trái công việc – bên phải thành viên + chat */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* LEFT: TASKS */}
          <div className="md:col-span-2 space-y-4">
            <Card>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <LabelSmall>Danh sách công việc</LabelSmall>
                  <p className="text-xs text-slate-500">
                    Các công việc thuộc dự án này (gần đây).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateTaskModal(true)}
                  className="text-[11px] text-slate-700 border border-slate-300 rounded-full px-3 py-1.5 hover:bg-slate-50"
                >
                  + Thêm công việc
                </button>
              </div>

              {recentTasks.length === 0 ? (
                <div className="text-xs text-slate-500 italic">
                  Chưa có công việc nào cho dự án này.
                </div>
              ) : (
                <div className="mt-2 max-h-[420px] overflow-auto space-y-1.5 text-xs">
                  {recentTasks.map((t) => (
                    <div
                      key={t.taskId}
                      className="flex items-start justify-between gap-2 border border-slate-100 rounded-xl px-3 py-2 hover:bg-slate-50 cursor-pointer"
                      onClick={() =>
                        navigate(`/task-management/tasks/${t.taskId}`)
                      }
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-800 truncate">
                          {t.title}
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-500">
                          {t.statusName} • Hạn:{" "}
                          {t.dueDate ? formatDate(t.dueDate) : "chưa đặt"} • Ưu
                          tiên: {t.priority || "thường"} • Tiến độ:{" "}
                          {t.progressPercent ?? 0}%
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        #{t.taskId}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <LabelSmall>Mô tả & mục tiêu</LabelSmall>
              <p className="text-sm text-slate-600 whitespace-pre-line">
                {project?.description || "Chưa có mô tả cho dự án này."}
              </p>
            </Card>
          </div>

          {/* RIGHT: MEMBERS + CHAT */}
          <div className="space-y-4">
            {/* Members */}
            <Card>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <LabelSmall>Thành viên dự án</LabelSmall>
                  <p className="text-xs text-slate-500">
                    Danh sách người tham gia dự án này.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Chip>Tổng: {members.length}</Chip>
                  <button
                    type="button"
                    onClick={() => setShowAddMemberModal(true)}
                    className="text-[11px] text-slate-700 border border-slate-300 rounded-full px-3 py-1.5 hover:bg-slate-50"
                  >
                    + Thành viên
                  </button>
                </div>
              </div>

              {members.length === 0 ? (
                <div className="text-xs text-slate-500 italic">
                  Chưa có thành viên nào (chỉ người tạo dự án).
                </div>
              ) : (
                <div className="max-h-[260px] overflow-auto mt-1">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-[11px] text-slate-400 border-b border-slate-100">
                        <th className="py-1 pr-2">Thành viên</th>
                        <th className="py-1 pr-2">Phòng/nhóm</th>
                        <th className="py-1 pr-2">Vai trò</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((m) => (
                        <tr
                          key={m.userId}
                          className="border-b border-slate-50 hover:bg-slate-50/60"
                        >
                          <td className="py-1 pr-2">
                            <div className="font-medium text-slate-800">
                              {m.fullName}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {m.userName}
                            </div>
                          </td>
                          <td className="py-1 pr-2 text-[11px] text-slate-500">
                            {m.departmentName || "-"}
                            {m.teamName && (
                              <>
                                <br />
                                Nhóm: {m.teamName}
                              </>
                            )}
                          </td>
                          <td className="py-1 pr-2 text-[11px] text-slate-500">
                            {m.projectRoleName || "-"}
                            {m.isManagerialRole ? (
                              <div className="text-[10px] text-amber-600">
                                (Quản lý)
                              </div>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Chat */}
            <Card>
              <LabelSmall>Chat dự án</LabelSmall>
              <p className="text-xs text-slate-500 mb-1">
                Tổng số tin nhắn:{" "}
                <b>{chatSummary?.totalMessages ?? 0}</b>
              </p>
              <p className="text-xs text-slate-500">
                Sau này bạn có thể nhúng panel chat real-time (cv_ProjectChatMessages)
                ở đây. Hiện tại chỉ hiển thị số lượng tổng quan.
              </p>
            </Card>
          </div>
        </div>

        {/* Files full width */}
        <ProjectFilesPanel projectId={projectId} />
      </div>

      {/* Modals */}
      {showBoardModal && (
        <TaskBoardModal
          tasks={recentTasks}
          onClose={() => setShowBoardModal(false)}
          projectName={project?.name}
        />
      )}
      {showCreateTaskModal && (
        <CreateTaskModal
          projectId={projectId}
          onClose={() => setShowCreateTaskModal(false)}
          onCreated={loadOverview}
        />
      )}
      {showAddMemberModal && (
        <AddMemberModal
          projectId={projectId}
          onClose={() => setShowAddMemberModal(false)}
          onAdded={loadOverview}
        />
      )}
    </div>
  );
}

export default ProjectOverview;
