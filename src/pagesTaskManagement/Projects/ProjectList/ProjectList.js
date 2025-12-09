// src/pagesTaskManagement/Projects/MyProjects/MyProjects.js
import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { useSelector } from "react-redux";

import http from "~/api/http";
import config, { BASE_URL } from "~/config";
import { userSelector } from "~/redux/selectors";
import { useNavigate } from "react-router-dom";

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

function slugifyProjectName(name) {
  if (!name) return "";
  return name
    .normalize("NFD") // tách dấu tiếng Việt
    .replace(/[\u0300-\u036f]/g, "") // bỏ dấu
    .toLowerCase() // không viết hoa
    .replace(/[^a-z0-9]+/g, "") // chỉ giữ a-z 0-9, bỏ khoảng trắng & ký tự khác
    .slice(0, 50); // giới hạn độ dài cho an toàn
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

function CardStatChip({ label, value, tone = "slate" }) {
  const toneMap = {
    slate: "bg-slate-50 text-slate-700 border-slate-200",
    sky: "bg-sky-50 text-sky-700 border-sky-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] ${toneMap[tone]}`}
    >
      <span className="font-semibold">{value ?? 0}</span>
      <span>{label}</span>
    </div>
  );
}

// Label nhỏ giống bên TaskUI
export function LabelSmall({ children }) {
  return (
    <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
      {children}
    </div>
  );
}

// Chip đổi view (nếu sau này muốn nhiều view, tạm thời chỉ có grid)
export function ViewChip({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium border transition ${
        active
          ? "bg-slate-900 text-white border-slate-900 shadow-sm"
          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

// Spinner nhỏ
function Spinner() {
  return (
    <span className="mr-1 inline-block w-3 h-3 border-[2px] border-white/40 border-t-white rounded-full animate-spin" />
  );
}

/** ====================== MODAL TẠO DỰ ÁN ====================== */

function CreateProjectButton({ onCreated }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center
        rounded-xl bg-slate-900 px-4 py-2.5
        text-sm font-semibold text-white shadow-sm
        hover:bg-slate-800 active:scale-[0.98]
        transition"
      >
        + Thêm dự án
      </button>

      {open && (
        <CreateProjectModalInner
          onClose={() => setOpen(false)}
          onCreated={onCreated}
        />
      )}
    </>
  );
}

function CreateProjectModalInner({ onClose, onCreated }) {
  const [code, setCode] = useState("");
  const [codeTouched, setCodeTouched] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [scopeOption, setScopeOption] = useState({
    value: "department",
    label: "Trong phòng",
  });

  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [departments, setDepartments] = useState([]);
  const [ownerDeptOption, setOwnerDeptOption] = useState(null);

  const [loadingLookup, setLoadingLookup] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    loadDepartments();
  }, []);

    // 🔥 Auto generate code từ name nếu user chưa sửa mã tay
  useEffect(() => {
    if (!codeTouched) {
      const auto = slugifyProjectName(name);
      setCode(auto);
    }
  }, [name, codeTouched]);

  async function loadDepartments() {
    setLoadingLookup(true);
    try {
      const res = await http.get(
        `${BASE_URL}/api/task-management/departments/lookup`
      );
      const list = (res.data?.data || []).map((d) => ({
        value: d.departmentId,
        label: d.label || d.name,
      }));
      setDepartments(list);
    } catch (err) {
      console.error("departments lookup error", err);
      setErrorMsg("Lỗi tải danh sách phòng ban.");
    } finally {
      setLoadingLookup(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    if (!code.trim()) {
      setErrorMsg("Vui lòng nhập mã dự án.");
      return;
    }
    if (!name.trim()) {
      setErrorMsg("Vui lòng nhập tên dự án.");
      return;
    }
    const scope = scopeOption?.value || null;
    if (!scope) {
      setErrorMsg("Vui lòng chọn phạm vi (scope) dự án.");
      return;
    }
    if (scope !== "company" && !ownerDeptOption) {
      setErrorMsg("Vui lòng chọn phòng chính cho dự án.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        code: code.trim(),
        name: name.trim(),
        description: description || null,
        scope,
        startDate: startDate || null,
        dueDate: dueDate || null,
        ownerDepartmentId:
          scope === "company" ? null : ownerDeptOption?.value || null,
      };

      const res = await http.post(
        `${BASE_URL}/api/task-management/projects`,
        payload
      );
      if (!res.data?.success) {
        setErrorMsg(res.data?.message || "Tạo dự án thất bại.");
        setSaving(false);
        return;
      }

      if (onCreated) onCreated(res.data?.data?.projectId);
      onClose();
    } catch (err) {
      console.error("create project error", err);
      setErrorMsg("Có lỗi xảy ra khi tạo dự án.");
      setSaving(false);
    }
  }

  const isCompanyScope = scopeOption?.value === "company";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-3">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={saving ? undefined : onClose}
      />
      {/* modal */}
      <div className="relative z-10 w-full max-w-2xl card p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg md:text-xl font-semibold text-slate-900">
            Tạo dự án mới
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-slate-400 hover:text-slate-600 text-lg leading-none"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-3 max-h-[70vh] overflow-y-auto pr-1"
        >
          {errorMsg && (
            <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
              {errorMsg}
            </div>
          )}

          {loadingLookup && (
            <div className="text-xs text-slate-400">
              Đang tải danh sách phòng ban…
            </div>
          )}

          {/* Mã + Tên */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <LabelSmall>Mã dự án *</LabelSmall>
              <input
                type="text"
                className="inset w-full px-3 py-2 text-sm outline-none"
                value={code}
                onChange={(e) => {
                    const v = e.target.value;
                    setCode(v);
                    // nếu user xoá hết => cho phép auto lại từ tên
                    setCodeTouched(v.trim().length > 0);
                }}
                placeholder="VD: PJ-001"
              />
            </div>
            <div className="md:col-span-2">
              <LabelSmall>Tên dự án *</LabelSmall>
              <input
                type="text"
                className="inset w-full px-3 py-2 text-sm outline-none"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên dự án…"
              />
            </div>
          </div>

          {/* Scope + Phòng chính */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <LabelSmall>Phạm vi (scope) *</LabelSmall>
              <Select
                options={[
                  { value: "department", label: "Trong phòng" },
                  { value: "multi", label: "Liên phòng" },
                  { value: "company", label: "Toàn công ty" },
                ]}
                value={scopeOption}
                onChange={(opt) => setScopeOption(opt)}
              />
            </div>
            <div>
              <LabelSmall>Phòng chính</LabelSmall>
              <Select
                options={departments}
                value={ownerDeptOption}
                onChange={(opt) => setOwnerDeptOption(opt)}
                isDisabled={isCompanyScope}
                placeholder={
                  isCompanyScope
                    ? "Dự án toàn công ty – không cần phòng chính"
                    : "Chọn phòng chính của dự án…"
                }
                noOptionsMessage={() => "Không có phòng ban nào"}
              />
              {!isCompanyScope && (
                <p className="mt-1 text-[11px] text-slate-400">
                  Phòng chính sẽ được đánh dấu là <b>owner</b> của dự án.
                </p>
              )}
            </div>
          </div>

          {/* Mô tả */}
          <div>
            <LabelSmall>Mô tả</LabelSmall>
            <textarea
              className="inset w-full px-3 py-2 text-sm outline-none min-h-[80px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả mục tiêu, phạm vi, kỳ vọng kết quả của dự án…"
            />
          </div>

          {/* Ngày bắt đầu / kết thúc */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <LabelSmall>Ngày bắt đầu</LabelSmall>
              <input
                type="date"
                className="inset w-full px-3 py-2 text-sm outline-none"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <LabelSmall>Ngày kết thúc dự kiến</LabelSmall>
              <input
                type="date"
                className="inset w-full px-3 py-2 text-sm outline-none"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-3 py-2 text-xs md:text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-xs md:text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
            >
              {saving && <Spinner />}
              <span>Lưu dự án</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** ====================== PAGE CHÍNH: MyProjects ====================== */

export default function MyProjectsPage() {
  const tmp = useSelector(userSelector);
  const [user, setUser] = useState(tmp);
  useEffect(() => {
    setUser(tmp);
  }, [tmp]);

  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  // data
  const [rows, setRows] = useState([]);
  const [totalRows, setTotalRows] = useState(0);

  // filter
  const [status, setStatus] = useState(null); // active|done|hold|cancel|null
  const [search, setSearch] = useState("");

  // paging
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const styles = `
    .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      box-shadow: 0 18px 45px rgba(15,23,42,0.04);
      border-radius: 18px;
    }

    .inset {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
    }
  `;

  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, search, page]);

  async function loadProjects() {
    setLoading(true);
    try {
      const res = await http.get(`${BASE_URL}/api/task-management/projects/my`, {
        params: {
          status: status || undefined,
          search: search || undefined,
          page,
          pageSize,
        },
      });
      setRows(res.data?.data || []);
      setTotalRows(res.data?.totalRows || 0);
    } catch (e) {
      console.error("load projects error", e);
    } finally {
      setLoading(false);
    }
  }

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil((totalRows || 0) / pageSize));
  }, [totalRows]);

  const todayLabel = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }, []);

  const filterHint = useMemo(() => {
    if (status) {
      const map = {
        active: "Dự án đang chạy",
        done: "Dự án đã hoàn thành",
        hold: "Dự án tạm dừng",
        cancel: "Dự án đã huỷ",
      };
      return (
        <>
          Đang xem <b>{map[status] || "Dự án"}</b> mà bạn tham gia. Ngày hôm
          nay: <b>{todayLabel}</b>.
        </>
      );
    }
    return (
      <>
        Đang xem <b>tất cả dự án mà bạn tham gia</b> (là thành viên hoặc người
        tạo). Ngày hôm nay: <b>{todayLabel}</b>.
      </>
    );
  }, [status, todayLabel]);

  return (
    <div className="min-h-screen">
      <style>{styles}</style>

      <div className="max-w-6xl mx-auto space-y-4 md:space-y-5">
        {/* Header */}
        <div className="card p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Dự án của tôi
            </p>
            <h1 className="mt-1 text-xl md:text-2xl font-bold text-slate-900">
              Danh sách dự án bạn tham gia
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Xem nhanh những dự án mà bạn đang là thành viên hoặc là người
              tạo, kèm trạng thái và tiến độ tổng quan.
            </p>
            <p className="mt-1 text-xs text-emerald-600">{filterHint}</p>
          </div>

          {/* Button thêm dự án */}
          <div className="w-full md:w-auto flex md:justify-end">
            <CreateProjectButton
              onCreated={() => {
                // Sau khi tạo dự án thành công thì reload lại danh sách
                setPage(1);
                loadProjects();
              }}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4 md:p-5 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <ViewChip active label="Thẻ dự án" onClick={() => {}} />

            <span className="ml-auto text-xs text-slate-400">
              Tổng: <b>{totalRows}</b> dự án
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div>
              <LabelSmall>Trạng thái dự án</LabelSmall>
              <Select
                options={[
                  { value: "active", label: "Đang chạy" },
                  { value: "done", label: "Hoàn thành" },
                  { value: "hold", label: "Tạm dừng" },
                  { value: "cancel", label: "Huỷ" },
                ]}
                value={
                  status
                    ? [
                        { value: "active", label: "Đang chạy" },
                        { value: "done", label: "Hoàn thành" },
                        { value: "hold", label: "Tạm dừng" },
                        { value: "cancel", label: "Huỷ" },
                      ].find((o) => o.value === status) || null
                    : null
                }
                onChange={(o) => {
                  setPage(1);
                  setStatus(o?.value ?? null);
                }}
                isClearable
                placeholder="Tất cả trạng thái"
              />
            </div>

            <div className="md:col-span-2">
              <LabelSmall>Tìm kiếm</LabelSmall>
              <input
                type="text"
                className="inset w-full px-3 py-2 text-sm outline-none"
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
                placeholder="Tìm theo tên dự án hoặc mã dự án…"
              />
            </div>
          </div>
        </div>

        {/* List cards */}
        <div className="space-y-3">
          {loading && (
            <div className="text-xs text-slate-400">
              Đang tải danh sách dự án…
            </div>
          )}

          {!loading && rows.length === 0 && (
            <div className="text-sm text-slate-500 italic">
              Chưa có dự án nào mà bạn tham gia.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rows.map((p) => {
              const start = formatDate(p.startDate);
              const due = formatDate(p.dueDate);
              const roleLabel = p.projectRoleName
                ? `${p.projectRoleName}${
                    p.isManagerialRole ? " (Quản lý)" : ""
                  }`
                : p.createdBy === user?.login?.currentUser?.userID
                ? "Người khởi tạo"
                : "";

              return (
                <div
                  key={p.projectId}
                  className="card p-4 md:p-5 flex flex-col gap-3 hover:shadow-md transition cursor-pointer"
                  onClick={() => {
                    navigate(`${config.routes.taskManagementProjectOverview}/${p.projectId}`);
                    // TODO: sau này navigate sang trang chi tiết dự án
                    console.log("click project", p.projectId);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-mono text-slate-400">
                        {p.code}
                      </div>
                      <h2 className="mt-0.5 text-base md:text-lg font-semibold text-slate-900 truncate">
                        {p.name}
                      </h2>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge status={p.status} />
                      <ScopeBadge scope={p.scope} />
                    </div>
                  </div>

                  {p.description && (
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {p.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    <span>
                      <span className="font-semibold">Thời gian: </span>
                      {start || due ? (
                        <>
                          {start || "chưa đặt"} → {due || "chưa đặt"}
                        </>
                      ) : (
                        "chưa thiết lập"
                      )}
                    </span>
                    {p.ownerDepartmentName && (
                      <span className="inline-flex items-center before:content-['•'] before:mx-1 before:text-slate-300">
                        <span className="font-semibold">Phòng chính:</span>{" "}
                        {p.ownerDepartmentName}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    {p.createdByName && (
                      <span>
                        <span className="font-semibold">Tạo bởi:</span>{" "}
                        {p.createdByName} ({p.createdByUserName})
                      </span>
                    )}
                    {roleLabel && (
                      <span className="inline-flex items-center before:content-['•'] before:mx-1 before:text-slate-300">
                        <span className="font-semibold">Vai trò:</span>{" "}
                        {roleLabel}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <CardStatChip
                      label="task"
                      value={p.totalTasks}
                      tone="slate"
                    />
                    <CardStatChip
                      label="đã xong"
                      value={p.doneTasks}
                      tone="emerald"
                    />
                    <CardStatChip
                      label="đang mở"
                      value={p.openTasks}
                      tone="sky"
                    />
                    <CardStatChip
                      label="trễ hạn"
                      value={p.overdueTasks}
                      tone="rose"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination đơn giản */}
          {totalRows > pageSize && (
            <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
              <div>
                Trang <b>{page}</b> / <b>{totalPages}</b> –{" "}
                <span>
                  hiển thị{" "}
                  <b>
                    {rows.length > 0 ? (page - 1) * pageSize + 1 : 0} -{" "}
                    {(page - 1) * pageSize + rows.length}
                  </b>{" "}
                  trong tổng <b>{totalRows}</b> dự án
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={`px-2 py-1 rounded border text-[11px] ${
                    page <= 1
                      ? "text-slate-300 border-slate-200 cursor-not-allowed"
                      : "text-slate-600 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  ← Trước
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className={`px-2 py-1 rounded border text-[11px] ${
                    page >= totalPages
                      ? "text-slate-300 border-slate-200 cursor-not-allowed"
                      : "text-slate-600 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  Sau →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
