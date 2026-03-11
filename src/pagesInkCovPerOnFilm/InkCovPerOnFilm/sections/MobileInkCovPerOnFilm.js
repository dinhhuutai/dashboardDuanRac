// src/pages/InkCovPerOnFilm/sections/MobileInkCovPerOnFilm.jsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import http from "~/api/http";
import config, { BASE_URL } from "~/config";
import avatarInk from "~/assets/imgs/avatar-main.jpg"; // avatar dùng chung

import {
  FaThLarge,
  FaUpload,
  FaFilePdf,
  FaBolt,
  FaRedo,
  FaDownload,
  FaSpinner,
  FaRegImage,
} from "react-icons/fa";
import { userSelector } from "~/redux/selectors";
import { useSelector } from "react-redux";

/**
 * Mobile UI: Ink Coverage Per On Film (PDF upload -> call API -> show image + percent)
 * Style tương tự MobileUserOrderSlide (header gradient + card nổi)
 */
export default function MobileInkCovPerOnFilm({ navigate }) {
  const tmp = useSelector(userSelector);
  
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [percent, setPercent] = useState(null);
  const [bbox, setBbox] = useState("");
  const [imgUrl, setImgUrl] = useState("");

  // Clean objectURL khi unmount hoặc đổi ảnh
  useEffect(() => {
    return () => {
      if (imgUrl) URL.revokeObjectURL(imgUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canRun = !!file && !busy;

  const prettySize = useMemo(() => {
    if (!file?.size) return "";
    const kb = file.size / 1024;
    if (kb < 1024) return `${Math.round(kb)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
  }, [file]);

  function clearResultOnly() {
    setErr("");
    setPercent(null);
    setBbox("");
    if (imgUrl) URL.revokeObjectURL(imgUrl);
    setImgUrl("");
  }

  function resetAll() {
    clearResultOnly();
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function onPick(f) {
    clearResultOnly();
    if (!f) return;

    const name = (f.name || "").toLowerCase();
    const ok = f.type === "application/pdf" || name.endsWith(".pdf");
    if (!ok) {
      setFile(null);
      setErr("Chỉ hỗ trợ file PDF (.pdf).");
      return;
    }
    setFile(f);
  }

  async function onRun() {
    if (!file || busy) return;

    setBusy(true);
    clearResultOnly();

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("page_index", "0");
      fd.append("dpi", "300");

      const url = `${BASE_URL}/api/ink-coverage/calc-image`;

      const res = await http.post(url, fd, { responseType: "blob" });

      const p = res.headers?.["x-ink-percent"];
      const b = res.headers?.["x-ink-bbox"];

      setPercent(p != null ? Number(p).toFixed(2) : null);
      setBbox(b || "");

      const blob = res.data;
      const objectUrl = URL.createObjectURL(blob);
      setImgUrl(objectUrl);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.detail ||
        e?.message ||
        "Có lỗi xảy ra khi xử lý.";
      setErr(typeof msg === "string" ? msg : "Có lỗi xảy ra khi xử lý.");
    } finally {
      setBusy(false);
    }
  }

  function downloadImage() {
    if (!imgUrl) return;
    const a = document.createElement("a");
    a.href = imgUrl;
    a.download = "ink_result.png";
    a.click();
  }

  // ====== THEME (mobile giống vibe bạn) ======
const t = {
  bgMain: "bg-[#FFF6D8]",
  headerGrad: "bg-gradient-to-br from-teal-600 via-teal-500 to-teal-200",

  // ✅ NEW: Card nổi kiểu khác (vibe ink/tech)
  cardBg:
    "bg-gradient-to-br from-white/95 via-[#F2FBFF] to-[#ECFDF5] " +
    "border border-white/70 ring-1 ring-sky-200/50 " +
    "shadow-[0_14px_34px_rgba(2,132,199,0.18)]",

  chipBg: "bg-white/70 border border-sky-200/60",
  chipText: "text-slate-800",

  title1: "text-slate-900",
  title2: "text-sky-700",

  // ✅ NEW: chip hiển thị %
  percentChipEmpty: "bg-slate-100 text-slate-600 border border-slate-200",
  percentChipOk: "bg-emerald-50 text-emerald-700 border border-emerald-200",

  softCard:
    "bg-white/70 backdrop-blur border border-white/70 shadow-[0_14px_32px_rgba(15,23,42,0.10)]",
  btnPrimary: "bg-emerald-600 text-white border border-emerald-700 hover:bg-emerald-700 shadow-sm",
  btnGhost: "bg-white text-slate-700 border border-slate-200",
  dangerBox: "bg-rose-50 text-rose-700 border border-rose-200",
};

  return (
    <div className={`md:hidden ${t.bgMain}`} style={{ minHeight: "100dvh" }}>
      {/* Overlay khi đang xử lý */}
      {busy && (
        <div className="fixed inset-0 z-[60] bg-black/10 backdrop-blur-[1px] flex items-center justify-center">
          <div className="px-3 py-2 rounded-full bg-white/90 border border-slate-200 shadow-md text-slate-700 text-sm flex items-center gap-2">
            <FaSpinner className="animate-spin" />
            <span>Đang xử lý file PDF...</span>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className={`relative ${t.headerGrad} rounded-b-[50px] px-4 pt-4 pb-[170px]`}>
        <div className="relative flex items-center justify-between mt-[20px]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 rounded-full overflow-hidden bg-white/30 border border-white/40">
              <img
                src={tmp?.login?.currentUser?.avatar || avatarInk}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            </div>
            
            <div className="min-w-0">
              <div className="text-sm text-white/90">Xin chào,</div>
              <div className="text-2xl font-semibold text-white truncate">
                {tmp?.login?.currentUser?.fullName || "bạn"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
          {/* App switch */}
            <button
              onClick={() => navigate(config.routes.homeMain)}
              className="h-10 w-10 rounded-full grid place-items-center text-white bg-white/25 border border-white/40 active:scale-95 transition"
              aria-label="Chọn ứng dụng"
              title="Chọn ứng dụng"
            >
              <FaThLarge />
            </button>
          </div>
        </div>

        {/* CARD NỔI */}
<div className="absolute left-4 right-4 top-[110px]">
  <div className={`rounded-3xl px-4 py-4 ${t.cardBg}`}>
    <div className="flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <div className={`text-[18px] font-extrabold ${t.title1}`}>
          📄 <span className={`${t.title2}`}>Tính % độ phủ</span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {/* ✅ NEW: chip % ngay trên card nổi */}
          <span
            className={[
              "inline-flex items-center gap-2 text-[12px] font-extrabold px-3 py-1 rounded-full",
              percent == null ? t.percentChipEmpty : t.percentChipOk,
            ].join(" ")}
            title="X-Ink-Percent"
          >
            {percent == null ? "Chưa có %" : `Độ phủ: ${percent}%`}
          </span>
        </div>
      </div>

      <div className="h-[50px] w-[50px] rounded-2xl grid place-items-center bg-white/70 border border-sky-200 shadow-sm">
        <FaBolt className="text-sky-700 text-[18px]" />
      </div>
    </div>

    {err ? (
      <div className={`mt-3 rounded-2xl p-3 text-sm border ${t.dangerBox}`}>
        ⚠️ {err}
      </div>
    ) : null}
  </div>
</div>
      </div>

      {/* khoảng trống dưới header */}
      <div className="h-[24px]" />

      {/* BODY */}
      <div className="px-[10px] pb-[90px] space-y-3">
        {/* Upload card */}
        <div className={`rounded-3xl p-4 ${t.softCard}`}>
          <div className="flex items-center justify-between">
            <div className="font-extrabold text-slate-800">Tải lên file PDF</div>

            <span
              className={`inline-flex items-center gap-2 text-[12px] font-semibold px-3 py-1 rounded-full ${
                file
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-white/70 text-slate-600 border border-slate-200"
              }`}
              title="Trạng thái"
            >
              <span
                className={`w-2 h-2 rounded-full ${file ? "bg-emerald-500/80" : "bg-slate-400/70"}`}
              />
              {file ? "Đã chọn" : "Chưa chọn"}
            </span>
          </div>

          {/* Dropzone */}
          <div
            className="
              mt-3 rounded-3xl p-4 border border-slate-200
              bg-white/70 backdrop-blur
              active:scale-[0.99] transition
            "
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onPick(e.dataTransfer.files?.[0]);
            }}
            role="button"
            tabIndex={0}
            title="Bấm để chọn PDF hoặc kéo thả PDF vào đây"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
            }}
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl grid place-items-center bg-sky-50 border border-sky-200 text-sky-700">
                <FaUpload />
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-extrabold text-slate-800 truncate">
                  {file ? file.name : "Chọn file PDF phim"}
                </div>
                <div className="text-[12px] text-slate-500">
                  {file ? `Dung lượng: ${prettySize}` : "Kéo thả hoặc bấm để chọn (.pdf)"}
                </div>
              </div>

              <div className="text-[12px] font-semibold text-slate-600">PDF</div>
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0])}
          />

          {/* Actions */}
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={resetAll}
              disabled={busy && !file && !imgUrl}
              className={`
                inline-flex items-center justify-center gap-2
                px-4 py-2 rounded-2xl font-extrabold
                ${t.btnGhost}
                active:scale-95 transition
              `}
            >
              <FaRedo className="text-[13px]" />
              Đặt lại
            </button>

            <button
              type="button"
              onClick={onRun}
              disabled={!canRun}
              className={`
                flex-1 inline-flex items-center justify-center gap-2
                px-4 py-2 rounded-2xl font-extrabold
                ${t.btnPrimary}
                disabled:opacity-50 disabled:cursor-not-allowed
                active:scale-95 transition
              `}
              title={!file ? "Chọn file PDF trước" : "Gọi API tính %"}
            >
              {busy ? <FaSpinner className="animate-spin" /> : <FaBolt className="text-[13px]" />}
              {busy ? "Đang xử lý..." : "Tính %"}
            </button>
          </div>
        </div>

        {/* Result card */}
        <div className={`rounded-3xl p-4 ${t.softCard}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="font-extrabold text-slate-800">Kết quả</div>

            <div
              className={`px-3 py-1.5 rounded-full border text-[12px] font-extrabold ${
                percent == null
                  ? "bg-white/70 border-slate-200 text-slate-500"
                  : "bg-emerald-50 border-emerald-200 text-emerald-700"
              }`}
              title="X-Ink-Percent"
            >
              {percent == null ? "Chưa có %" : `Độ phủ: ${percent}%`}
            </div>
          </div>

          {/* bbox */}
          {bbox ? (
            <div className="mt-2 text-[12px] text-slate-600">
              <span className="font-semibold text-slate-700">BBox:</span>{" "}
              <span className="break-words">{bbox}</span>
            </div>
          ) : null}

          {/* Image area */}
          <div className="mt-3 rounded-3xl border border-slate-200 bg-white/70 overflow-hidden">
            {!imgUrl && !busy ? (
              <div className="h-[320px] flex flex-col items-center justify-center text-center text-slate-500 px-6">
                <div className="h-12 w-12 rounded-2xl grid place-items-center bg-slate-50 border border-slate-200 mb-3">
                  <FaRegImage />
                </div>
                <div className="font-semibold">Ảnh kết quả sẽ hiển thị ở đây</div>
                <div className="text-[12px] mt-1">
                  Sau khi “Tính %”, hệ thống trả về ảnh PNG đã vẽ khung + vùng chữ/logo.
                </div>
              </div>
            ) : null}

            {busy ? (
              <div className="p-3">
                <div className="animate-pulse rounded-3xl bg-slate-100 h-[240px]" />
                <div className="mt-3 animate-pulse rounded-2xl bg-slate-100 h-10" />
              </div>
            ) : null}

            {!!imgUrl && !busy ? (
              <img
                src={imgUrl}
                alt="Kết quả độ phủ mực"
                className="w-full block"
              />
            ) : null}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="text-[12px] text-slate-500 min-w-0 truncate">
              {file ? (
                <>
                  File: <span className="text-slate-700 font-semibold">{file.name}</span>
                </>
              ) : (
                "Chưa có file"
              )}
            </div>

            <button
              type="button"
              disabled={!imgUrl}
              onClick={downloadImage}
              className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-extrabold border shadow-sm transition
                ${
                  imgUrl
                    ? "bg-white text-slate-700 border-slate-200 active:scale-95"
                    : "bg-slate-200 text-slate-500 border-slate-200 cursor-not-allowed"
                }
              `}
            >
              <FaDownload className="text-[13px]" />
              Tải ảnh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
