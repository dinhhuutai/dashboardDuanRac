import React, { useEffect, useState } from "react";
import http from "~/api/http";
import { BASE_URL } from "~/config";
import { useSelector } from "react-redux";
import { userSelector } from "~/redux/selectors";
import QuantityStepper from "~/components/lunch/QuantityStepper";
import { FaSpinner, FaSave } from "react-icons/fa";

export default function DaySecretaryPanel() {
  const user = useSelector(userSelector)?.login?.currentUser;

  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState([]);   // danh sách món có sẵn của ngày
  const [picked, setPicked] = useState({});     // { entryId: quantity }
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [cutoffPassed, setCutoffPassed] = useState(false);

  // kiểm tra cutoff 09:00 khi đổi ngày
  useEffect(() => {
    const now = new Date();
    const cutoff = new Date(date + "T09:00:00");
    setCutoffPassed(now > cutoff);
  }, [date]);

  // load entries theo ngày
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const rs = await http.get(`${BASE_URL}/api/lunch-order/day/entries`, { params: { date }});
        if (!mounted) return;
        setEntries(rs.data?.data?.entries || []);
        setPicked({});
      } catch {
        if (mounted) {
          setEntries([]);
          setPicked({});
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [date]);

  const togglePick = (eid) => {
    if (cutoffPassed) return;
    setPicked((prev) => {
      const n = { ...prev };
      if (n[eid]) delete n[eid];
      else n[eid] = 1;
      return n;
    });
  };

  const setQty = (eid, q) => {
    if (cutoffPassed) return;
    setPicked((prev) => {
      const v = Math.max(1, parseInt(typeof q === "function" ? q(prev[eid]||1) : q, 10) || 1);
      return { ...prev, [eid]: v };
    });
  };

  const canSubmit = () => {
    return !cutoffPassed && !busy && Object.keys(picked).length > 0 && user?.userID;
  };

  const save = async () => {
    if (!canSubmit()) return;
    setBusy(true);
    setMsg("");
    try {
      const payload = {
        date,
        userId: user.userID,
        createdBy: user.fullName,
        selections: Object.entries(picked).map(([eid, qty]) => ({
          weeklyMenuEntryId: Number(eid),
          quantity: qty
        })),
      };
      await http.post(`${BASE_URL}/api/lunch-order/day/secretary/save`, payload);
      setMsg("Đặt theo ngày (kiểu thư ký) thành công!");
      setPicked({});
    } catch (e) {
      setMsg(e?.response?.data?.message || "Không thể lưu. Thử lại sau.");
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(""), 2500);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/60 shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-slate-800">Đặt theo ngày (chế độ thư ký)</h3>
        {loading && <span className="text-xs text-emerald-600 inline-flex items-center gap-2"><FaSpinner className="animate-spin" /> Đang tải…</span>}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* NGÀY + trạng thái cutoff */}
        <div>
          <label className="text-sm text-slate-600">Ngày</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-400 outline-none"
          />
          <p className={`text-xs mt-2 ${cutoffPassed ? "text-rose-600" : "text-slate-500"}`}>
            {cutoffPassed ? "ĐÃ QUÁ 09:00 – không thể đặt/chỉnh ngày này." : "Đặt/đổi được đến 09:00 của ngày chọn."}
          </p>
        </div>

        {/* Danh sách món của ngày */}
        <div className="md:col-span-2">
          {entries.length === 0 ? (
            <div className="text-sm text-slate-500">Không có món sẵn có cho ngày này.</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {entries.map((it) => {
                const checked = picked[it.weeklyMenuEntryId] > 0;
                const qty = picked[it.weeklyMenuEntryId] || 1;
                return (
                  <div
                    key={it.weeklyMenuEntryId}
                    className={`p-3 rounded-xl border transition
                      ${checked ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-200"}
                      ${cutoffPassed ? "opacity-50" : "hover:bg-slate-50 cursor-pointer"}`}
                    onClick={() => togglePick(it.weeklyMenuEntryId)}
                  >
                    <div className="font-medium text-slate-800">{it.foodName}</div>
                    {checked ? (
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-slate-500">Số lượng</span>
                        <QuantityStepper
                          value={qty}
                          min={1}
                          disabled={cutoffPassed}
                          onChange={(v) => setQty(it.weeklyMenuEntryId, v)}
                        />
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 mt-1">Nhấn để chọn</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* submit */}
      <div className="mt-4 flex justify-end gap-3">
        {msg && <div className="text-sm text-emerald-700 self-center">{msg}</div>}
        <button
          disabled={!canSubmit()}
          onClick={save}
          className="px-5 py-2 rounded-xl bg-emerald-600 text-white disabled:opacity-60 inline-flex items-center gap-2"
        >
          {busy && <FaSpinner className="animate-spin" />}
          <FaSave /> Lưu đặt ngày này
        </button>
      </div>
    </div>
  );
}
