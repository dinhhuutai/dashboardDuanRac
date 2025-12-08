import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FiPackage } from "react-icons/fi";
import { FaSpinner } from "react-icons/fa";
import { BASE_URL } from "~/config";

const TEAMS = ["C1", "C2", "C3", "C4", "CTM"];
const fmt2 = (n) =>
  (Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100).toLocaleString("vi-VN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function ReportMaterials() {
  const [isLoading, setIsLoading] = useState(false);

  // ===== % ẢO =====
  const [fakeProgress, setFakeProgress] = useState(0);
  const fakeTimerRef = useRef(null);
  const startFakeProgress = () => {
    clearInterval(fakeTimerRef.current);
    setFakeProgress(0);
    // tăng nhanh lúc đầu, chậm dần về sau tới ~92%
    fakeTimerRef.current = setInterval(() => {
      setFakeProgress((p) => {
        const cap = 92;             // trần ảo
        if (p >= cap) return p;
        const step = Math.max(0.2, (100 - p) * 0.015); // easing
        const next = Math.min(p + step, cap);
        return next;
      });
    }, 80);
  };
  const finishFakeProgress = () => {
    clearInterval(fakeTimerRef.current);
    setFakeProgress(100);
    setTimeout(() => {
      setIsLoading(false);
      setFakeProgress(0);
    }, 350);
  };
  const stopFakeProgress = () => {
    clearInterval(fakeTimerRef.current);
    setFakeProgress(0);
  };

  // ===== dữ liệu báo cáo =====
  const [materialsRaw, setMaterialsRaw] = useState([]);
  const [materialsCols, setMaterialsCols] = useState([]);
  const [dataByTeam, setDataByTeam] = useState({});
  const [colTotals, setColTotals] = useState({});
  const [grandTotal, setGrandTotal] = useState(0);

  const workerRef = useRef(null);

  // tải danh mục vật tư
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/materials?active=1`);
        const json = await res.json();
        if (json?.success) {
          const rows = (json.data || []).map((r) => ({
            label: r.label,
            ingredient: r.ingredient,
            units: Array.isArray(r.units) ? r.units : (r.unit ? [r.unit] : ["kg"]),
          }));
          setMaterialsRaw(rows);
        }
      } catch (e) {
        console.error("Load materials error:", e);
      }
    })();
  }, []);

  // khởi tạo worker (không cần nhận progress nữa)
  useEffect(() => {
    const w = new Worker(new URL("./materialsWorker.js", import.meta.url), { type: "module" });
    workerRef.current = w;
    w.onmessage = (e) => {
      const { type, payload, message } = e.data || {};

      console.log(e.data);
      if (type === "error") {
        console.error("Worker error:", message);
        stopFakeProgress();
        setIsLoading(false);
      }
      if (type === "done") {
        setDataByTeam(payload.dataByTeam || {});
        setColTotals(payload.colTotals || {});
        setGrandTotal(payload.grandTotal || 0);
        setMaterialsCols(payload.materials || []);
        // khi xong -> chạy 100% rồi tắt
        finishFakeProgress();
      }
    };
    return () => {
      w.terminate();
      workerRef.current = null;
    };
  }, []);

  const canUpload = useMemo(() => materialsRaw.length > 0 && !!workerRef.current, [materialsRaw]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // cho phép chọn lại cùng file
    if (!file || !canUpload) return;

    setIsLoading(true);
    startFakeProgress();       // bật % ảo

    try {
      const buf = await file.arrayBuffer();
      // Transferable để không copy bộ nhớ (nhanh hơn)
      workerRef.current.postMessage(
        { arrayBuffer: buf, materials: materialsRaw, teams: TEAMS, chunkSize: 2500 },
        [buf]
      );
    } catch (err) {
      console.error("Upload handle error:", err);
      stopFakeProgress();
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4">
      {(isLoading || fakeProgress > 0) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 bg-white/90 rounded-xl p-5 shadow">
            <FaSpinner className="animate-spin text-teal-600 text-4xl" />
            <div className="text-gray-700 text-sm font-medium">
              Đang xử lý file… {fakeProgress ? `${fmt2(fakeProgress)}%` : ""}
            </div>
            <div className="w-64 h-2 bg-gray-200 rounded">
              <div
                className="h-2 bg-teal-500 rounded transition-all"
                style={{ width: `${Math.min(fakeProgress, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="p-2 space-y-6 bg-white rounded-[6px]">
        <div className="relative space-y-6 bg-white rounded-2xl p-6 z-10">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-2xl font-bold text-teal-700 flex items-center gap-2"
          >
            <FiPackage /> Kê xuất vật tư
          </motion.h1>

          <div>
            <label
              htmlFor="fileInput"
              className={`cursor-pointer inline-block px-6 py-2 text-white rounded-xl font-medium ${
                canUpload ? "bg-teal-600 hover:bg-teal-700" : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              Chọn file Excel
            </label>
            <input
              id="fileInput"
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileUpload}
              disabled={!canUpload || isLoading}
            />
            {!canUpload && (
              <div className="text-sm text-amber-600 mt-2">* Đang tải danh mục vật tư…</div>
            )}
          </div>

          {Object.keys(dataByTeam).length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-gray-300 mt-6">
              <table className="min-w-full text-sm text-left border-collapse">
                <thead className="bg-yellow-100 sticky top-0 z-10">
                  <tr>
                    <th className="border px-3 py-2 font-bold text-center bg-yellow-200">BP/Tổ</th>
                    {materialsCols.map((m) => (
                      <th key={m.key} className="border px-3 py-2 font-bold">
                        {m.label} (kg)
                      </th>
                    ))}
                    <th className="border px-3 py-2 font-bold text-center bg-yellow-200">Tổng (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {TEAMS.map((t, i) => (
                    <tr key={t} className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-yellow-50`}>
                      <td className="border px-3 py-2 text-center font-medium">{t}</td>
                      {materialsCols.map((m) => (
                        <td key={m.key} className="border px-3 py-2 text-right">
                          {fmt2(dataByTeam[t][m.label] || 0)}
                        </td>
                      ))}
                      <td className="border px-3 py-2 text-right font-semibold">
                        {fmt2(dataByTeam[t].total || 0)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-yellow-100 font-semibold">
                    <td className="border px-3 py-2 text-center">Tổng cộng</td>
                    {materialsCols.map((m) => (
                      <td key={m.key} className="border px-3 py-2 text-right">
                        {fmt2(colTotals[m.label] || 0)}
                      </td>
                    ))}
                    <td className="border px-3 py-2 text-right">{fmt2(grandTotal || 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


