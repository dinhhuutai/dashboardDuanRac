// src/pageTaskManagement/MyTasks/TaskInfoSection.jsx
import React from "react";
import { LabelSmall } from "../TaskUI";
import { fmtDate, fmtTime } from "./taskFormatters";

export default function TaskInfoSection({ task }) {
  if (!task) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <LabelSmall>Ngày bắt đầu</LabelSmall>
        <div className="inset w-full px-3 py-2 text-xs text-slate-600 flex items-center">
          {fmtDate(task.startDate)}
        </div>
      </div>
      <div>
        <LabelSmall>Hạn hoàn thành</LabelSmall>
        <div className="inset w-full px-3 py-2 text-xs text-slate-600 flex items-center">
          {fmtDate(task.dueDate)}
        </div>
      </div>
      <div>
        <LabelSmall>Giờ bắt đầu</LabelSmall>
        <div className="inset w-full px-3 py-2 text-xs text-slate-600 flex items-center">
          {fmtTime(task.startTime)}
        </div>

        <LabelSmall>Giờ kết thúc dự kiến</LabelSmall>
        <div className="inset w-full px-3 py-2 text-xs text-slate-600 flex items-center">
          {fmtTime(task.dueTime)}
        </div>
      </div>

      <div>
        <LabelSmall>Ngày hoàn thành</LabelSmall>
        <div className="inset w-full px-3 py-2 text-xs text-slate-600 flex items-center">
          {fmtDate(task.completedDate)}
        </div>
      </div>

      <div className="md:col-span-2">
        <LabelSmall>Người được giao</LabelSmall>
        <div className="inset w-full px-3 py-2 text-xs text-slate-600 flex flex-wrap gap-1">
          {(task.assignees || []).length === 0 && "—"}
          {(task.assignees || []).map((a) => (
            <span
              key={a.userID}
              className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-[11px] text-slate-700"
            >
              {a.fullName || a.userName || `#${a.userID}`}
            </span>
          ))}
        </div>
      </div>

      <div className="md:col-span-2">
        <LabelSmall>Thông tin tạo / cập nhật</LabelSmall>
        <div className="inset w-full px-3 py-2 text-[11px] text-slate-600 space-y-0.5">
          <div>
            <span className="font-medium text-slate-700">Người tạo:</span>{" "}
            {task.createdByName ||
              task.createdByUserName ||
              (task.createdBy ? `#${task.createdBy}` : "—")}
          </div>
          <div>
            <span className="font-medium text-slate-700">Ngày tạo:</span>{" "}
            {fmtDate(task.createdAt)}
          </div>
          <div>
            <span className="font-medium text-slate-700">
              Cập nhật lần cuối:
            </span>{" "}
            {fmtDate(task.updatedAt)}
            {task.updatedBy && (
              <>
                {" "}
                –{" "}
                <span className="font-medium text-slate-700">Bởi:</span>{" "}
                {task.updatedByName ||
                  task.updatedByUserName ||
                  `#${task.updatedBy}`}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
