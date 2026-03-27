import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { FaHistory, FaSpinner } from "react-icons/fa";
import { userSelector } from "~/redux/selectors";
import { BASE_URL } from "~/config";
import http from "~/api/http";

const fmtDateTime = (dt) => {
  try {
    return new Date(dt).toLocaleString("vi-VN");
  } catch {
    return String(dt || "");
  }
};

export default function FormHistory() {
  const auth = useSelector(userSelector);
  const currentUser = auth?.login?.currentUser || null;
  const userId = currentUser?.userID || null;
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        if (!userId) {
          setRows([]);
          return;
        }
        const rs = await http.get(`${BASE_URL}/api/forms/me/history`, { params: { userId } });
        setRows(Array.isArray(rs.data) ? rs.data : []);
      } catch (e) {
        console.error(e);
        alert("Không tải được lịch sử biểu mẫu.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [userId]);

  return (
    <div className="min-h-svh bg-gradient-to-b from-violet-50 via-fuchsia-50 to-white">
      <div className="px-4 md:px-6 max-w-4xl mx-auto pb-24 md:pt-6 pt-3">
        <div className="rounded-2xl border border-fuchsia-200 bg-white/95 p-4">
          <div className="flex items-center gap-2 text-fuchsia-800 font-semibold">
            <FaHistory /> Lịch sử đã điền
          </div>

          {loading ? (
            <div className="py-10 grid place-items-center text-slate-600">
              <div className="flex items-center gap-2">
                <FaSpinner className="animate-spin" /> Đang tải...
              </div>
            </div>
          ) : (
            <div className="grid gap-2 mt-3">
              {rows.map((h) => (
                <div key={h.responseId} className="rounded-xl border border-fuchsia-100 px-3 py-2 bg-fuchsia-50/50">
                  <div className="font-medium text-slate-800">{h.formTitle}</div>
                  <div className="text-xs text-slate-600 mt-1">
                    {fmtDateTime(h.createdAt)} • #{h.responseId} • {h.isValid ? "Hợp lệ" : "Đã hủy"}
                  </div>
                </div>
              ))}
              {rows.length === 0 && <div className="text-slate-500">Bạn chưa điền biểu mẫu nào.</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
