// src/pagesTaskManagement/Tasks/MyTasks/MyTasks.js
import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";

import http from "~/api/http";
import { BASE_URL } from "~/config";

import { LabelSmall, ViewChip } from "./TaskUI";
import ListView from "./ListView";
import CalendarView from "./CalendarView";
import BoardView from "./BoardView";
import CreateTaskButton from "./CreateTaskModal";
import TaskDetailModal from "./TaskDetailModal";
import { useSelector } from "react-redux";
import { userSelector } from "~/redux/selectors";

export default function MyTasks() {
  const tmp = useSelector(userSelector);
  const [user, setUser] = useState(tmp);
  useEffect(() => { setUser(tmp); }, [tmp]);

  const [view, setView] = useState("list");
  const [loading, setLoading] = useState(false);

  // dữ liệu list
  const [rows, setRows] = useState([]);
  const [totalRows, setTotalRows] = useState(0);

  // bộ lọc
  const [status, setStatus] = useState(null);
  const [priority, setPriority] = useState(null);
  const [search, setSearch] = useState("");
  const [startDateFilter, setStartDateFilter] = useState(""); // 👈 lọc theo ngày bắt đầu

  const [showCreatedForOthers, setShowCreatedForOthers] = useState(false);

  // phân trang
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // board
  const [columns, setColumns] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  // calendar
  const [date, setDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [range, setRange] = useState("week");
  const [calendarRows, setCalendarRows] = useState([]);

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

  // set ngày cho lịch lần đầu
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setDate(today);
  }, []);

    useEffect(() => {
    if (view === "list") loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, status, priority, search, page, startDateFilter, showCreatedForOthers]);

  useEffect(() => {
    if (view === "board") loadBoard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, status, priority, search, startDateFilter, showCreatedForOthers]);

  /* ================== LOAD DATA ================== */

  useEffect(() => {
    if (view === "list") loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, status, priority, search, page, startDateFilter]);

  useEffect(() => {
    if (view === "board") loadBoard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, status, priority, search, startDateFilter]);

  useEffect(() => {
    if (view === "calendar") loadCalendar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, date, range]);

  async function loadList() {
    setLoading(true);
    try {
      const res = await http.get(`${BASE_URL}/api/task-management/my`, {
        params: {
          status,
          priority,
          search,
          page,
          pageSize,
          startDateFilter: startDateFilter || undefined,
          createdForOthers: showCreatedForOthers ? "1" : "0",
        },
      });
      setRows(res.data?.data || []);
      setTotalRows(res.data?.totalRows || 0);
    } finally {
      setLoading(false);
    }
  }

  async function loadBoard() {
    setLoading(true);
    try {
      const res = await http.get(
        `${BASE_URL}/api/task-management/my/board`,
        {
          params: {
            status,
            priority,
            search,
            startDateFilter: startDateFilter || undefined,
            createdForOthers: showCreatedForOthers ? "1" : "0",
          },
        }
      );
      setColumns(res.data?.data || []);
    } finally {
      setLoading(false);
    }
  }

  async function loadCalendar() {
    setLoading(true);
    try {
      const res = await http.get(
        `${BASE_URL}/api/task-management/my/calendar`,
        { params: { range, date } }
      );
      setCalendarRows(res.data?.data || []);
    } finally {
      setLoading(false);
    }
  }

  async function moveTask(taskId, toStatusId) {
    await http.post(`${BASE_URL}/api/task-management/${taskId}/move`, {
      toStatusId,
    });
  }

  /* ================== RENDER ================== */

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
      const baseDateText = (() => {
        if (startDateFilter) {
          const d = new Date(startDateFilter);
          const lbl = d.toLocaleDateString("vi-VN", {
            weekday: "long",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          });
          return (
            <>
              Đang lọc theo <b>ngày bắt đầu: {lbl}</b>. Hiển thị tất cả công
              việc có ngày bắt đầu đúng ngày này.
            </>
          );
        }

        return (
          <>
            Đang hiển thị{" "}
            <b>các công việc bắt đầu ngày {todayLabel}</b> và{" "}
            <b>các công việc chưa hoàn thành của những ngày trước</b>, được sắp
            xếp theo mức độ ưu tiên:{" "}
            <b>Khẩn cấp → Cao → Bình thường → Thấp</b>.
          </>
        );
      })();

      if (showCreatedForOthers) {
        return (
          <>
            Đang xem <b>các công việc bạn là người tạo</b> (giao cho user khác),
            với quy tắc lọc ngày giống phía dưới. {baseDateText}
          </>
        );
      }

      return (
        <>
          Đang xem <b>các công việc được giao cho bạn</b>. {baseDateText}
        </>
      );
    }, [todayLabel, startDateFilter, showCreatedForOthers]);

  return (
    <div className="min-h-screen">
      <style>{styles}</style>

      <div className="max-w-6xl mx-auto space-y-4 md:space-y-5">
        {/* Header */}
        <div className="card p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Công việc theo tài khoản
            </p>
            <h1 className="mt-1 text-xl md:text-2xl font-bold text-slate-900">
              Công việc của tôi
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Xem các việc bạn được giao, theo dõi theo danh sách, bảng kéo-thả
              hoặc lịch.
            </p>
            <p className="mt-1 text-xs text-emerald-600">{filterHint}</p>
          </div>

          {/* Button thêm công việc */}
          <div className="w-full md:w-auto flex md:justify-end">
            <CreateTaskButton
              onCreated={() => {
                if (view === "list") loadList();
                else if (view === "board") loadBoard();
                else loadCalendar();
              }}
            />
          </div>
        </div>

        {/* View switch + Filters */}
        <div className="card p-4 md:p-5 space-y-3">
          {/* Switch view */}
          <div className="flex flex-wrap items-center gap-2">
            <ViewChip
              active={view === "list"}
              label="Danh sách"
              onClick={() => setView("list")}
            />
            <ViewChip
              active={view === "board"}
              label="Bảng kéo-thả"
              onClick={() => setView("board")}
            />
            <ViewChip
              active={view === "calendar"}
              label="Lịch"
              onClick={() => setView("calendar")}
            />

            {view !== "calendar" && (
              <span className="ml-auto text-xs text-slate-400">
                Tổng: <b>{totalRows}</b> công việc
              </span>
            )}
          </div>

          {/* Bộ lọc list/board */}
{view !== "calendar" && (
  <div className="space-y-3 pt-1">
    {/* Hàng 1: 4 filter chính */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      <div>
        <LabelSmall>Trạng thái</LabelSmall>
        <Select
          options={[
            { value: "todo", label: "Cần làm" },
            { value: "doing", label: "Đang làm" },
            { value: "review", label: "Chờ duyệt" },
            { value: "done", label: "Hoàn thành" },
          ]}
          onChange={(o) => {
            setPage(1);
            setStatus(o?.value ?? null);
          }}
          isClearable
          placeholder="Tất cả"
        />
      </div>

      <div>
        <LabelSmall>Ưu tiên</LabelSmall>
        <Select
          options={[
            { value: "low", label: "Thấp" },
            { value: "normal", label: "Bình thường" },
            { value: "high", label: "Cao" },
            { value: "urgent", label: "Khẩn cấp" },
          ]}
          onChange={(o) => {
            setPage(1);
            setPriority(o?.value ?? null);
          }}
          isClearable
          placeholder="Tất cả"
        />
      </div>

      <div>
        <LabelSmall>Lọc theo ngày bắt đầu</LabelSmall>
        <input
          type="date"
          className="inset w-full px-3 py-2 text-sm outline-none"
          value={startDateFilter}
          onChange={(e) => {
            setPage(1);
            setStartDateFilter(e.target.value || "");
          }}
        />
        {startDateFilter && (
          <button
            type="button"
            onClick={() => {
              setPage(1);
              setStartDateFilter("");
            }}
            className="
              mt-1 inline-flex items-center gap-1.5
              rounded-full border border-sky-200
              bg-sky-50/60 px-2.5 py-1
              text-[11px] font-medium text-sky-700
              hover:bg-sky-100 hover:border-sky-300
              active:scale-[0.98]
              transition
            "
          >
            <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-sky-600 text-[9px] text-white">
              ↺
            </span>
            <span>Xoá lọc ngày, quay về mặc định</span>
          </button>
        )}
      </div>

      <div>
        <LabelSmall>Tìm theo tiêu đề</LabelSmall>
        <input
          type="text"
          className="inset w-full px-3 py-2 text-sm outline-none"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Nhập một phần tên công việc…"
        />
      </div>
    </div>

    {/* Hàng 2: Toggle "Công việc tôi tạo cho user khác" */}
    <div className="flex items-center justify-start md:justify-end">
      <button
        type="button"
        onClick={() => {
          setPage(1);
          setShowCreatedForOthers(!showCreatedForOthers);
        }}
        className="inline-flex items-center gap-2 text-xs text-slate-600"
        role="switch"
        aria-checked={showCreatedForOthers}
      >
        <span className="text-[13px] md:text-xs">
          Công việc tôi tạo cho user khác
        </span>

        {/* Switch phẳng, không shadow */}
        <span
          className={`
            relative inline-flex h-5 w-9 items-center rounded-full border
            transition-colors duration-200
            ${
              showCreatedForOthers
                ? "bg-emerald-500 border-emerald-500"
                : "bg-slate-200 border-slate-300"
            }
          `}
        >
          <span
            className={`
              inline-block h-4 w-4 rounded-full bg-white transform
              transition-transform duration-200
              ${showCreatedForOthers ? "translate-x-4" : "translate-x-0"}
            `}
          />
        </span>
      </button>
    </div>
  </div>
)}

          {/* Bộ lọc lịch */}
          {view === "calendar" && (
            <div className="flex flex-wrap items-end gap-3 pt-1">
              <div className="w-40">
                <LabelSmall>Khoảng thời gian</LabelSmall>
                <Select
                  options={[
                    { value: "day", label: "Theo ngày" },
                    { value: "week", label: "Theo tuần" },
                  ]}
                  value={{
                    value: range,
                    label: range === "day" ? "Theo ngày" : "Theo tuần",
                  }}
                  onChange={(o) => setRange(o.value)}
                />
              </div>
              <div>
                <LabelSmall>Ngày mốc</LabelSmall>
                <input
                  type="date"
                  className="inset w-full px-3 py-2 text-sm outline-none"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="text-xs text-slate-400">
                Hiển thị các công việc của bạn trong khoảng đã chọn.
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        {view === "list" && (
          <ListView
            loading={loading}
            rows={rows}
            page={page}
            pageSize={pageSize}
            totalRows={totalRows}
            setPage={setPage}
            onTaskClick={(id) => setSelectedTaskId(id)}
          />
        )}

        {view === "board" && (
          <BoardView
            columns={columns}
            setColumns={setColumns}
            onMoveTask={moveTask}
            onReload={loadBoard}
            loading={loading}
            onTaskClick={(id) => setSelectedTaskId(id)}
          />
        )}

        {view === "calendar" && (
          <CalendarView
            loading={loading}
            rows={calendarRows}
            onTaskClick={(id) => setSelectedTaskId(id)}
          />
        )}
      </div>

      {/* Modal chi tiết */}
      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onChanged={() => {
            if (view === "list") loadList();
            else if (view === "board") loadBoard();
            else loadCalendar();
          }}
          user={user}
        />
      )}
    </div>
  );
}
