import React, { useEffect, useMemo, useState } from "react";
import http from "~/api/http";
import { BASE_URL } from "~/config";

const APPROVAL_STEPS = [
  { code: "team", label: "Tổ/nhóm" },
  { code: "department", label: "Trưởng phòng" },
  { code: "executive", label: "Ban giám đốc" },
];

export default function Requests() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [pending, setPending] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const rs = await http.get(`${BASE_URL}/api/task-management/requests/my`);
      setRows(rs.data?.data || []);
    } catch (e) {
      // Fallback mềm để không chặn UI khi backend chưa có endpoint
      setRows([]);
    } finally {
      setLoading(false);
    }

    try {
      const rs = await http.get(`${BASE_URL}/api/task-management/requests/pending`);
      setPending(rs.data?.data || []);
    } catch {
      setPending([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const canCreate = useMemo(() => title.trim().length > 0 && content.trim().length > 0, [title, content]);

  const createRequest = async () => {
    if (!canCreate) return;
    setLoading(true);
    try {
      await http.post(`${BASE_URL}/api/task-management/requests`, {
        title: title.trim(),
        content: content.trim(),
        flow: APPROVAL_STEPS.map((x, idx) => ({ stepCode: x.code, orderIndex: idx + 1 })),
      });
      setTitle("");
      setContent("");
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || "Chưa tạo được đề nghị. Kiểm tra endpoint backend.");
      setLoading(false);
    }
  };

  const approve = async (requestId) => {
    try {
      await http.post(`${BASE_URL}/api/task-management/requests/${requestId}/approve`);
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || "Duyệt chưa thành công.");
    }
  };

  const reject = async (requestId) => {
    try {
      await http.post(`${BASE_URL}/api/task-management/requests/${requestId}/reject`);
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || "Từ chối chưa thành công.");
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto space-y-4 md:space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
          <h1 className="text-xl font-bold text-slate-900">Đề nghị & phê duyệt</h1>
          <p className="mt-1 text-sm text-slate-500">
            Tạo đề nghị và duyệt theo mốc: Tổ/nhóm - Trưởng phòng - Ban giám đốc.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
          <div className="text-sm font-semibold text-slate-800">Tạo đề nghị mới</div>
          <div className="grid grid-cols-1 gap-3 mt-3">
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-100"
              placeholder="Tiêu đề đề nghị"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="w-full min-h-[90px] rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-100"
              placeholder="Nội dung đề nghị"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <button
              disabled={!canCreate || loading}
              onClick={createRequest}
              className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${
                !canCreate || loading ? "bg-slate-400" : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              Gửi đề nghị
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
          <div className="text-sm font-semibold text-slate-800">Danh sách đề nghị</div>
          {loading ? (
            <div className="mt-3 text-sm text-slate-500">Đang tải...</div>
          ) : rows.length === 0 ? (
            <div className="mt-3 text-sm text-slate-500">Chưa có đề nghị nào.</div>
          ) : (
            <div className="mt-3 grid gap-3">
              {rows.map((r) => (
                <div key={r.requestId} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="font-medium text-slate-900">{r.title}</div>
                  <div className="mt-1 text-sm text-slate-600">{r.content}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(r.steps || APPROVAL_STEPS).map((s, idx) => (
                      <span key={`${s.stepCode || s.code}-${idx}`} className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600">
                        {s.label || APPROVAL_STEPS[idx]?.label || s.stepCode}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
          <div className="text-sm font-semibold text-slate-800">Đề nghị chờ tôi duyệt</div>
          {pending.length === 0 ? (
            <div className="mt-3 text-sm text-slate-500">Không có đề nghị chờ duyệt.</div>
          ) : (
            <div className="mt-3 grid gap-3">
              {pending.map((r) => (
                <div key={r.requestId} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="font-medium text-slate-900">{r.title}</div>
                  <div className="mt-1 text-sm text-slate-600">{r.content}</div>
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => approve(r.requestId)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">
                      Duyệt
                    </button>
                    <button onClick={() => reject(r.requestId)} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white">
                      Từ chối
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
