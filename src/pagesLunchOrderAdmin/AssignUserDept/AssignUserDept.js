import React, { useEffect, useState, useMemo } from "react";
import { DndContext, useDraggable, useDroppable, DragOverlay } from "@dnd-kit/core";
import { motion, AnimatePresence } from "framer-motion";
import http from "~/api/http";
import { BASE_URL } from "~/config";
import { FaSearch, FaSpinner, FaSave, FaTimes } from "react-icons/fa";
import { userSelector } from "~/redux/selectors";
import { useSelector } from "react-redux";

/* ==== Modal Thông báo ==== */
function NoticeModal({ open, title, message, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 bg-black/40 z-[200] grid place-items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <h3 className="font-semibold text-lg">{title}</h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded">
                <FaTimes />
              </button>
            </div>
            <div className="px-5 py-4 text-slate-700 whitespace-pre-line">{message}</div>
            <div className="px-5 py-3 border-t flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow"
              >
                OK
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ==== Modal Xác nhận ==== */
function ConfirmModal({ open, title, message, onConfirm, onCancel, loading }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 bg-black/40 z-[250] grid place-items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <h3 className="font-semibold text-lg">{title}</h3>
              <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded">
                <FaTimes />
              </button>
            </div>
            <div className="px-5 py-4 text-slate-700">{message}</div>
            <div className="px-5 py-3 border-t flex justify-end gap-3">
              <button
                onClick={onCancel}
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 shadow disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow flex items-center gap-2 disabled:opacity-50"
              >
                {loading && <FaSpinner className="animate-spin" />}
                Xác nhận
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ==== Draggable User ==== */
function DraggableUser({ user, draggingUserId }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `user-${user.userID}`,
    data: user,
  });

  const style = !isDragging && transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <motion.div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className={[
        "p-3 bg-white border rounded-xl shadow cursor-grab hover:shadow-lg transition select-none",
        draggingUserId === user.userID ? "opacity-50 ring-2 ring-emerald-300" : ""
      ].join(" ")}
    >
      <div className="font-medium leading-5">{user.fullName}</div>
      <div className="text-xs text-slate-500">{user.username}</div>
    </motion.div>
  );
}

/* ==== Droppable Department ==== */
function DroppableDept({ dept, users, onRemove }) {
  const { isOver, setNodeRef } = useDroppable({ id: `dept-${dept.departmentId}` });
  return (
    <div
      ref={setNodeRef}
      className={`p-3 rounded-xl border-2 border-dashed min-h-[180px] flex flex-col gap-2 transition
        ${isOver ? "border-emerald-500 bg-emerald-50" : "border-slate-300 bg-white"}`}
    >
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">{dept.departmentName}</h4>
        <span className="text-xs text-slate-500">{users.length} user</span>
      </div>

      <div className="flex flex-col gap-2">
        {users.map((u) => (
          <div
            key={u.userID}
            className="flex justify-between items-center bg-slate-100 px-3 py-2 rounded-lg"
          >
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{u.fullName}</div>
              <div className="text-[11px] text-slate-500 truncate">{u.username}</div>
            </div>
            <button
              onClick={() => onRemove(u.userID)}
              className="text-xs px-2 py-0.5 bg-rose-500 text-white rounded hover:bg-rose-600"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {users.length === 0 && (
        <div className="text-slate-400 text-xs text-center italic">Kéo user vào đây</div>
      )}
    </div>
  );
}

export default function UserDepartmentAssign() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState({});
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState({ open: false, title: "", message: "" });

  const [activeUser, setActiveUser] = useState(null);
  const [confirm, setConfirm] = useState({ open: false, loading: false });

  const tmp = useSelector(userSelector);
  const [user, setUser] = useState({});
  useEffect(() => {
    setUser(tmp?.login?.currentUser);
  }, [tmp]);

  async function loadData() {
    setLoading(true);
    try {
      const [uRes, dRes] = await Promise.all([
        http.get(`${BASE_URL}/api/lunch-order/department-assign/users-datcom`),
        http.get(`${BASE_URL}/api/lunch-order/department-assign/departments`),
      ]);
      const uList = uRes.data?.data || [];
      const dList = dRes.data?.data || [];

      setUsers(uList);
      setDepartments(dList);

      const init = {};
      uList.forEach((u) => {
        if (u.dc_DepartmentID) init[u.userID] = u.dc_DepartmentID;
      });
      setAssignments(init);
    } catch {
      setNotice({ open: true, title: "Lỗi", message: "Không tải được dữ liệu." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function onDragStart(e) {
    const data = e.active?.data?.current;
    if (data) setActiveUser(data);
  }

  function onDragEnd(e) {
    setActiveUser(null);
    const { active, over } = e;
    if (!over || !active) return;
    const user = active.data.current;
    const deptId = parseInt(over.id.replace("dept-", ""), 10);
    setAssignments((prev) => ({ ...prev, [user.userID]: deptId }));
  }

  function handleRemove(userId) {
    setAssignments((prev) => {
      const copy = { ...prev };
      delete copy[userId];
      return copy;
    });
  }

  async function confirmSave() {
    setConfirm((c) => ({ ...c, loading: true }));
    try {
      const payload = {
        assignments: users.map((u) => ({
          userId: u.userID,
          departmentId: assignments[u.userID] ?? null, // 👈 nếu không có thì gửi null
        })),
        updatedBy: user.userID,
      };

      await http.put(`${BASE_URL}/api/lunch-order/department-assign/assign`, payload);
      setConfirm({ open: false, loading: false });
      setNotice({ open: true, title: "Thành công", message: "Đã lưu gán user vào bộ phận." });
      await loadData();
    } catch {
      setConfirm({ open: false, loading: false });
      setNotice({ open: true, title: "Lỗi", message: "Không thể lưu gán user." });
    }
  }

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter((u) => {
      if (assignments[u.userID]) return false;
      return !q || u.fullName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q);
    });
  }, [users, assignments, search]);

  return (
    <div className="p-6">
      <div className="bg-white/80 border rounded-2xl shadow-sm p-5">
        <h2 className="text-xl font-bold mb-4">Gán User vào Bộ phận</h2>
        {loading ? (
          <div className="flex items-center gap-2 text-emerald-600">
            <FaSpinner className="animate-spin" /> Đang tải...
          </div>
        ) : (
          <DndContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
            <div className="grid grid-cols-3 gap-6">
              {/* LEFT: Users list */}
              <div className="col-span-1 bg-white rounded-xl shadow p-4">
                <div className="relative mb-3">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm user..."
                    className="pl-10 pr-3 py-2 rounded-lg border w-full"
                  />
                </div>
                <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                  {filteredUsers.map((u) => (
                    <DraggableUser key={u.userID} user={u} draggingUserId={activeUser?.userID} />
                  ))}
                </div>
              </div>

              {/* RIGHT: Departments */}
              <div className="col-span-2 grid grid-cols-2 gap-4">
                {departments.map((dept) => {
                  const deptUsers = users.filter((u) => assignments[u.userID] === dept.departmentId);
                  return (
                    <DroppableDept
                      key={dept.departmentId}
                      dept={dept}
                      users={deptUsers}
                      onRemove={handleRemove}
                    />
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setConfirm({ open: true, loading: false })}
                className="px-6 py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-2 shadow disabled:opacity-50"
                disabled={confirm.loading}
              >
                <FaSave /> Lưu thay đổi
              </button>
            </div>

            {/* Ghost/Preview */}
            <DragOverlay>
              {activeUser ? (
                <div className="p-3 w-56 bg-white border rounded-xl shadow-2xl">
                  <div className="font-medium leading-5">{activeUser.fullName}</div>
                  <div className="text-xs text-slate-500">{activeUser.username}</div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {/* Modal thông báo */}
        <NoticeModal
          open={notice.open}
          title={notice.title}
          message={notice.message}
          onClose={() => setNotice({ ...notice, open: false })}
        />

        {/* Modal xác nhận */}
        <ConfirmModal
          open={confirm.open}
          title="Xác nhận"
          message="Bạn có chắc chắn muốn lưu thay đổi gán user vào bộ phận không?"
          onConfirm={confirmSave}
          onCancel={() => setConfirm({ open: false, loading: false })}
          loading={confirm.loading}
        />
      </div>
    </div>
  );
}
