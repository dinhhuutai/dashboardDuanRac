import React, { useEffect, useMemo, useState } from "react";
import http from "~/api/http";
import { BASE_URL } from "~/config";

const DOW_LABELS = ["T2","T3","T4","T5","T6","T7","CN"]; // 1..7

function startOfWeekVN(d=new Date()){
  const day=d.getDay(); // 0..6 CN..T7
  const diff=(day===0?-6:1-day);
  const x=new Date(d); x.setDate(d.getDate()+diff); x.setHours(0,0,0,0); return x;
}
const addDays=(d,n)=>{const x=new Date(d); x.setDate(d.getDate()+n); return x;};
const fmt=(d)=>d.toLocaleDateString("vi-VN",{day:"2-digit",month:"2-digit"});

export default function OvertimeWeekInputs({
  weeklyMenuId, userId, actorId, actorName,
  isOvertime,
}) {
  const weekStart = useMemo(() => startOfWeekVN(new Date()), []);
  const [rows, setRows] = useState([]);        // [{dayOfWeek, weeklyMenuEntryId, quantityOvertime}]
  const [busy, setBusy] = useState(false);
  const [original, setOriginal] = useState([]);

  const [saveState, setSaveState] = useState("idle"); // "idle" | "saving" | "success" | "error"
  useEffect(() => {
    if (saveState === "success" || saveState === "error") {
      const t = setTimeout(() => setSaveState("idle"), 1800); // tự ẩn sau 1.8s
      return () => clearTimeout(t);
    }
  }, [saveState]);

  // GET danh sách entry 'tien' + số lượng đã chọn
  useEffect(() => {
    if (!isOvertime || !weeklyMenuId || !userId) return;
    (async () => {
      setBusy(true);
      try {
        const r = await http.get(`${BASE_URL}/api/weekly-overtime/tien`, {
          params: { weeklyMenuId, userId },
        });
        const data = r.data || [];
        const map = new Map(data.map(x => [x.dayOfWeek, x]));
        const filled = Array.from({ length: 7 }, (_, i) => {
          const dow = i + 1;
          const found = map.get(dow);
          return found || { dayOfWeek: dow, weeklyMenuEntryId: null, quantityOvertime: 0 };
        });
        setRows(filled);
        setOriginal(JSON.parse(JSON.stringify(filled)));
      } finally {
        setBusy(false);
      }
    })();
  }, [isOvertime, weeklyMenuId, userId]);

  const onChange = (i, v) => {
    const val = Math.max(0, parseInt(v || "0", 10));
    setRows(prev => prev.map((r, idx) => idx===i ? { ...r, quantityOvertime: val } : r));
  };

  // Lưu cả tuần (1 request) đúng schema backend
  const onSave = async () => {
    const changed = rows.filter((r, i) => {
      const o = original[i] || {};
      return r.weeklyMenuEntryId && Number(r.quantityOvertime || 0) !== Number(o.quantityOvertime || 0);
    });
    if (changed.length === 0) return;

    setBusy(true);
    setSaveState("saving");
    try {
      const items = changed.map(r => ({
        weeklyMenuEntryId: Number(r.weeklyMenuEntryId),
        quantityOvertime:  Number(r.quantityOvertime || 0),
      }));

      await http.post(`${BASE_URL}/api/weekly-overtime/tien`, {
        userId: Number(userId),
        weeklyMenuId: Number(weeklyMenuId),
        actorId: actorId ?? userId,
        items,
      });

      setOriginal(JSON.parse(JSON.stringify(rows)));
      setSaveState("success");
    } catch (e) {
      console.error(e);
      setSaveState("error");
    } finally {
      setBusy(false);
    }
  };

  if (!isOvertime) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 mx-2 shadow-sm relative">
      {/* CSS INLINE */}
      <style>{`
        @keyframes ow-progress {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(220%); }
        }
        .ow-animate-progress { animation: ow-progress 1.2s linear infinite; }

        @keyframes ow-fadeInUp {
          0% { opacity: 0; transform: translate(-50%, 12px); }
          100% { opacity: 1; transform: translate(-50%, 0); }
        }
        .ow-animate-fadeInUp { animation: ow-fadeInUp 220ms ease-out both; }
      `}</style>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
        {rows.map((r, i) => {
          const d = addDays(weekStart, i);
          const label = `${DOW_LABELS[i]} • ${fmt(d)}`;
          const disabled = !r.weeklyMenuEntryId;
          return (
            <div key={i} className={`rounded-lg border px-2 py-2 ${disabled ? "bg-slate-50 border-slate-200 opacity-60" : "bg-white border-slate-200"}`}>
              <div className="text-[12px] text-slate-600 mb-1">{label}</div>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={r.quantityOvertime ?? 0}
                onChange={(e)=>onChange(i, e.target.value)}
                disabled={disabled || busy}
                className="w-full h-9 rounded-md border border-slate-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                placeholder="0"
                aria-label={`Số suất tăng ca ${label}`}
                title={disabled ? "Ngày này không có suất tăng ca (foodCode='tien')" : "Nhập số suất tăng ca"}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex justify-end">
        <button
          onClick={onSave}
          disabled={busy || saveState === "saving"}
          className={`relative h-9 px-4 rounded-md text-white text-sm overflow-hidden
            ${saveState === "saving" ? "bg-emerald-400" : "bg-emerald-600 hover:bg-emerald-700"}
            ${busy ? "opacity-90 cursor-not-allowed" : ""}`}
        >
          {/* Thanh tiến độ mảnh trên nút */}
          {saveState === "saving" && (
            <span className="absolute left-0 top-0 h-[2px] w-full overflow-hidden">
              <span className="block h-full w-1/3 bg-white/70 ow-animate-progress"></span>
            </span>
          )}

          {/* Nội dung nút */}
          {saveState === "saving" ? (
            <span className="inline-flex items-center gap-2">
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
                <path d="M21 12a9 9 0 0 1-9 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              Đang lưu…
            </span>
          ) : saveState === "success" ? (
            <span className="inline-flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.2l-3.5-3.5-1.4 1.4L9 19 20 8l-1.4-1.4z"/></svg>
              Đã lưu
            </span>
          ) : saveState === "error" ? (
            <span className="inline-flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
              Lưu thất bại
            </span>
          ) : (
            "Lưu tăng ca"
          )}
        </button>
      </div>

      {/* Toast nổi gọn */}
      <div className="fixed left-1/2 -translate-x-1/2 bottom-6 z-[1000] pointer-events-none">
        {saveState === "success" && (
          <div className="ow-animate-fadeInUp rounded-lg bg-emerald-600 text-white text-sm px-3 py-2 shadow-lg">
            ✅ Đã lưu tăng ca
          </div>
        )}
        {saveState === "error" && (
          <div className="ow-animate-fadeInUp rounded-lg bg-red-600 text-white text-sm px-3 py-2 shadow-lg">
            ❌ Lưu thất bại — vui lòng thử lại
          </div>
        )}
      </div>
    </div>
  );
}
