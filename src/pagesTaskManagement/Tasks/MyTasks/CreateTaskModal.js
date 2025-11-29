// src/pageTaskManagement/MyTasks/CreateTaskModal.jsx
import React, { useState, useRef } from "react";
import AsyncSelect from "react-select/async";
import http from "~/api/http";
import { BASE_URL } from "~/config";
import { LabelSmall } from "./TaskUI";

export default function CreateTaskButton({ onCreated }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="
          w-full md:w-auto
          inline-flex items-center justify-center
          rounded-xl
          px-4 py-2.5
          text-xs md:text-sm font-semibold
          bg-gradient-to-r from-indigo-500 to-violet-500
          text-white
          shadow-md shadow-indigo-500/30
          hover:from-indigo-600 hover:to-violet-600
          active:scale-[.98]
          transition
        "
        onClick={() => setOpen(true)}
      >
        <span className="mr-1.5 text-base md:text-lg">＋</span>
        Thêm công việc
      </button>

      {open && (
        <CreateTaskModal
          onClose={() => setOpen(false)}
          onCreated={() => {
            setOpen(false);
            onCreated?.();
          }}
        />
      )}
    </>
  );
}

function getDayPartLabel(value) {
  if (!value) return "";
  const [hStr] = String(value).split(":");
  const h = parseInt(hStr, 10);
  if (Number.isNaN(h)) return "";
  if (h < 12) return "Buổi sáng (AM)";
  return "Buổi chiều / tối (PM)";
}

function CreateTaskModal({ onClose, onCreated }) {
  const todayStr = new Date().toISOString().slice(0, 10);

  // form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normal");
  const [statusCode, setStatusCode] = useState("todo");
  const [startDate, setStartDate] = useState(todayStr);
  const [dueDate, setDueDate] = useState(todayStr);
  const [startTime, setStartTime] = useState(""); // HH:mm
  const [dueTime, setDueTime] = useState("");     // HH:mm
  const [estimateHours, setEstimateHours] = useState("");

  const [projectOption, setProjectOption] = useState(null);

  const [assigneeOptions, setAssigneeOptions] = useState([]);
  const [assigneeInput, setAssigneeInput] = useState("");

  const [repeatDaily, setRepeatDaily] = useState(false);
  const [saving, setSaving] = useState(false);

  // attachments
  const [attachments, setAttachments] = useState([]); // File[]
  const [uploadPercent, setUploadPercent] = useState(0);
  const fileInputRef = useRef(null);

  /* ========== LOAD OPTIONS ========== */

  const loadUserOptions = async (inputValue) => {
    const raw = (inputValue ?? assigneeInput ?? "").trim();

    if (!raw.startsWith("@")) return [];
    const q = raw.slice(1).trim();
    if (!q) return [];

    try {
      const res = await http.get(
        `${BASE_URL}/api/task-management/lookup/users`,
        { params: { q } }
      );
      const list = res.data?.data || [];
      return list.map((u) => ({
        value: u.userID,
        label: `${u.fullName} (${u.userName})${
          u.departmentName ? " - " + u.departmentName : ""
        }`,
      }));
    } catch (e) {
      console.error("loadUserOptions error", e);
      return [];
    }
  };

  const loadProjectOptions = async (inputValue) => {
    const q = (inputValue || "").trim();
    try {
      const res = await http.get(
        `${BASE_URL}/api/task-management/lookup/projects`,
        { params: { q } }
      );
      const list = res.data?.data || [];
      return list.map((p) => ({
        value: p.projectId,
        label: `${p.code || "NO-CODE"} - ${p.name || ""}`,
      }));
    } catch (e) {
      console.error("loadProjectOptions error", e);
      return [];
    }
  };

  /* ========== HANDLERS ========== */

  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Gộp với danh sách cũ, tránh trùng theo name+size+lastModified
    setAttachments((prev) => {
      const all = [...prev];
      files.forEach((f) => {
        const exists = all.some(
          (x) =>
            x.name === f.name &&
            x.size === f.size &&
            x.lastModified === f.lastModified
        );
        if (!exists) all.push(f);
      });
      return all;
    });

    setUploadPercent(0);
    // reset value để lần sau chọn lại cùng file vẫn trigger onChange
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  /* ========== SAVE ========== */

  async function save() {
    if (!title.trim()) return;

    try {
      setSaving(true);
      setUploadPercent(0);

      const assignees = (assigneeOptions || []).map((o) => o.value);

      const form = new FormData();
      form.append("projectId", projectOption ? projectOption.value : "");
      form.append("title", title.trim());
      form.append("description", description?.trim() || "");
      form.append("statusCode", statusCode);
      form.append("priority", priority);
      form.append("startDate", startDate || "");
      form.append("dueDate", dueDate || "");
      form.append("startTime", startTime || "");
      form.append("dueTime", dueTime || "");
      form.append("estimateHours", estimateHours || "");
      form.append("progressPercent", "0");
      form.append("repeatDaily", repeatDaily ? "1" : "0");
      form.append("assignees", JSON.stringify(assignees));

      attachments.forEach((file) => {
        form.append("attachments", file);
      });

      const res = await http.post(
        `${BASE_URL}/api/task-management`,
        form,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (evt) => {
            if (!evt.total) return;
            const percent = Math.round((evt.loaded * 100) / evt.total);
            setUploadPercent(percent);
          },
        }
      );

      if (res.data?.success) {
        onCreated?.();
      }
    } catch (e) {
      console.error("create task error:", e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* modal */}
      <div className="absolute inset-x-3 md:inset-x-0 top-10 mx-auto max-w-2xl card p-4 md:p-5">
        {/* header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base md:text-lg font-bold text-slate-900">
              Tạo công việc mới
            </h3>
            <p className="text-xs text-slate-500">
              Nếu không chọn người nhận, hệ thống sẽ tự gán cho chính bạn.
              <br />
              Chỉ Trưởng phòng được phép tạo công việc cho nhân viên trong cùng
              phòng (server sẽ kiểm tra quyền).
            </p>
          </div>
          <button
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            onClick={onClose}
          >
            Đóng
          </button>
        </div>

        {/* body */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
          {/* Tiêu đề */}
          <div>
            <LabelSmall>Tiêu đề *</LabelSmall>
            <input
              className="inset w-full px-3 py-2 text-sm outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tên công việc…"
            />
          </div>

          {/* Dự án */}
          <div>
            <LabelSmall>Dự án (tìm theo mã / tên)</LabelSmall>
            <AsyncSelect
              cacheOptions
              defaultOptions
              loadOptions={loadProjectOptions}
              value={projectOption}
              onChange={(opt) => setProjectOption(opt)}
              isClearable
              placeholder="Gõ để tìm dự án…"
              classNamePrefix="react-select"
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: 36,
                  borderRadius: 12,
                  borderColor: "#e2e8f0",
                  boxShadow: "none",
                  fontSize: 13,
                }),
                menu: (base) => ({
                  ...base,
                  fontSize: 13,
                  zIndex: 9999,
                }),
              }}
            />
          </div>

          {/* Mô tả */}
          <div className="md:col-span-2">
            <LabelSmall>Mô tả</LabelSmall>
            <textarea
              className="inset w-full px-3 py-2 text-sm outline-none"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn gọn nội dung công việc, yêu cầu, kết quả mong đợi…"
            />
          </div>

          {/* Trạng thái & Ưu tiên */}
          <div>
            <LabelSmall>Trạng thái ban đầu</LabelSmall>
            <select
              className="inset w-full px-3 py-2 text-sm outline-none bg-white"
              value={statusCode}
              onChange={(e) => setStatusCode(e.target.value)}
            >
              <option value="todo">Cần làm</option>
              <option value="doing">Đang làm</option>
              <option value="review">Chờ duyệt</option>
              <option value="done">Hoàn thành</option>
            </select>
          </div>
          <div>
            <LabelSmall>Ưu tiên</LabelSmall>
            <select
              className="inset w-full px-3 py-2 text-sm outline-none bg-white"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="low">Thấp</option>
              <option value="normal">Bình thường</option>
              <option value="high">Cao</option>
              <option value="urgent">Khẩn cấp</option>
            </select>
          </div>

          {/* Ngày bắt đầu / Ngày kết thúc */}
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
            <LabelSmall>Giờ bắt đầu</LabelSmall>
            <div className="inset w-full px-3 py-2 text-sm flex items-center justify-between gap-2">
              <input
                type="time"
                className="flex-1 outline-none bg-transparent"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
              <span className="text-[11px] text-slate-500 whitespace-nowrap">
                {getDayPartLabel(startTime)}
              </span>
            </div>
          </div>

          <div>
            <LabelSmall>Hạn hoàn thành</LabelSmall>
            <input
              type="date"
              className="inset w-full px-3 py-2 text-sm outline-none"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div>
            <LabelSmall>Giờ kết thúc dự kiến</LabelSmall>
            <div className="inset w-full px-3 py-2 text-sm flex items-center justify-between gap-2">
              <input
                type="time"
                className="flex-1 outline-none bg-transparent"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
              />
              <span className="text-[11px] text-slate-500 whitespace-nowrap">
                {getDayPartLabel(dueTime)}
              </span>
            </div>
          </div>

          {/* Estimate */}
          <div>
            <LabelSmall>Thời gian ước tính (giờ)</LabelSmall>
            <input
              type="number"
              step="0.25"
              className="inset w-full px-3 py-2 text-sm outline-none"
              value={estimateHours}
              onChange={(e) => setEstimateHours(e.target.value)}
              placeholder="Ví dụ: 1.5"
            />
          </div>

          {/* Repeat */}
          <div className="flex items-center gap-2 mt-4 md:mt-6">
            <input
              id="repeatDaily"
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              checked={repeatDaily}
              onChange={(e) => setRepeatDaily(e.target.checked)}
            />
            <label
              htmlFor="repeatDaily"
              className="text-xs md:text-sm text-slate-700"
            >
              Lặp lại công việc này hằng ngày
            </label>
          </div>

          {/* Người nhận */}
          <div className="md:col-span-2">
            <LabelSmall>Người nhận công việc (tùy chọn)</LabelSmall>
            <AsyncSelect
              isMulti
              cacheOptions
              defaultOptions={false}
              loadOptions={loadUserOptions}
              value={assigneeOptions}
              onChange={(opts) => setAssigneeOptions(opts || [])}
              inputValue={assigneeInput}
              onInputChange={(value, { action }) => {
                if (action === "input-change") {
                  setAssigneeInput(value);
                }
              }}
              menuIsOpen={
                assigneeInput.startsWith("@") &&
                assigneeInput.trim().length > 1
              }
              placeholder="Gõ @tên để tìm, chọn nhiều người nhận…"
              classNamePrefix="react-select"
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: 40,
                  borderRadius: 12,
                  borderColor: "#e2e8f0",
                  boxShadow: "none",
                  fontSize: 13,
                }),
                menu: (base) => ({
                  ...base,
                  fontSize: 13,
                  zIndex: 9999,
                }),
                multiValue: (base) => ({
                  ...base,
                  borderRadius: 9999,
                  backgroundColor: "#eef2ff",
                }),
              }}
            />
            <div className="mt-1 text-[11px] text-slate-500">
              Bạn gõ <b>@tên</b> giống Zalo để tìm nhanh. Nếu để trống,
              hệ thống sẽ tự gán công việc cho chính bạn.
            </div>
          </div>

          {/* File đính kèm */}
          <div className="md:col-span-2">
            <LabelSmall>Tệp / hình ảnh đính kèm</LabelSmall>

            {/* input ẩn + nút Tiếng Việt */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFilesChange}
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center rounded-full border border-indigo-500 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                onClick={() => fileInputRef.current?.click()}
              >
                Chọn tệp / hình ảnh
              </button>
              <span className="text-[11px] text-slate-500">
                Có thể chọn nhiều tệp (ảnh, PDF, Word, Excel…)
              </span>
            </div>

            {/* Danh sách file + xem trước + xoá */}
            {!!attachments.length && (
              <div className="mt-2 space-y-1">
                <div className="text-[11px] text-slate-500">
                  Đã chọn {attachments.length} tệp:
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {attachments.map((f, idx) => {
                    const isImage = f.type.startsWith("image/");
                    const sizeKb = (f.size / 1024).toFixed(1);

                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-[11px] bg-slate-50 rounded-lg px-2 py-1"
                      >
                        {isImage ? (
                          <div className="w-10 h-10 rounded-md overflow-hidden border border-slate-200 flex-shrink-0">
                            <img
                              src={URL.createObjectURL(f)}
                              alt={f.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-md border border-slate-200 flex items-center justify-center text-[10px] text-slate-500 flex-shrink-0">
                            FILE
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="truncate font-medium text-slate-700">
                            {f.name}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {(f.type || "Không rõ loại")} • {sizeKb} KB
                          </div>
                        </div>

                        <button
                          type="button"
                          className="ml-1 text-[11px] text-red-500 hover:text-red-600"
                          onClick={() => handleRemoveFile(idx)}
                        >
                          Xoá
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Thanh progress upload */}
            {saving && (
              <div className="mt-2">
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 transition-all"
                    style={{ width: `${uploadPercent}%` }}
                  />
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  Đang tải tệp lên… {uploadPercent}%
                </div>
              </div>
            )}

            <div className="mt-1 text-[11px] text-slate-400">
              Nên giới hạn &lt; 20MB / tệp để tránh chậm.
            </div>
          </div>
        </div>

        {/* footer */}
        <div className="mt-4 flex justify-end gap-2">
          <button
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            disabled={saving}
            className="inline-flex items-center rounded-full border border-indigo-500 bg-indigo-600 px-4 py-2 text-xs md:text-sm font-semibold text-white shadow-sm disabled:opacity-60"
            onClick={save}
          >
            {saving ? "Đang lưu…" : "Lưu công việc"}
          </button>
        </div>
      </div>
    </div>
  );
}
