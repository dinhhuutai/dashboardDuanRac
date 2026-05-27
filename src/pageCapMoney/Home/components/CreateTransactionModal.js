import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiArrowDownLeft,
  FiArrowUpRight,
  FiCheck,
  FiCalendar,
  FiShare2,
  FiX,
  FiZap,
  FiRefreshCw,
  FiImage as FiImageIcon,
  FiEdit3,
} from "react-icons/fi";
import {
  FaCamera,
  FaExchangeAlt,
  FaUtensils,
  FaShoppingBag,
  FaCar,
  FaCoffee,
  FaGamepad,
  FaHeartbeat,
  FaGraduationCap,
  FaEllipsisH,
  FaMoneyBillWave,
  FaGift,
  FaQuestion,
  FaWallet,
  FaUniversity,
  FaCreditCard,
  FaRegMoneyBillAlt,
} from "react-icons/fa";
import { MdOutlinePhotoCamera } from "react-icons/md";
import { apiCreateCapMoneyTransaction, apiGetCapMoneyCategories } from "../api/capMoneyApi";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function getGreetingTimeIcon(hour) {
  if (hour < 11) return "sang";
  if (hour < 14) return "trua";
  if (hour < 18) return "chieu";
  return "toi";
}

function formatVND(n) {
  const num = Number(n || 0);
  return new Intl.NumberFormat("vi-VN").format(num);
}

function hexToRgba(hex, alpha) {
  if (!hex) return `rgba(0,0,0,${alpha})`;
  const raw = String(hex).trim().replace("#", "");
  const full = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return `rgba(0,0,0,${alpha})`;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function getCategoryIconComponent(iconKey) {
  const key = String(iconKey || "").trim().toLowerCase();
  const map = {
    food: FaUtensils,
    shopping: FaShoppingBag,
    car: FaCar,
    coffee: FaCoffee,
    gamepad: FaGamepad,
    health: FaHeartbeat,
    education: FaGraduationCap,
    other: FaEllipsisH,
    salary: FaMoneyBillWave,
    gift: FaGift,
  };
  return map[key] || FaQuestion;
}

function getAccountIconComponent(iconKey) {
  const key = String(iconKey || "").trim().toLowerCase();
  const map = {
    wallet: FaWallet,
    bank: FaUniversity,
    credit: FaCreditCard,
    creditcard: FaCreditCard,
    ewallet: FaWallet,
    money: FaRegMoneyBillAlt,
  };
  return map[key] || FaWallet;
}

export default function CreateTransactionModal({
  open,
  onClose,
  initialDate,
  accounts = [],
  onCreated,
}) {
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const categoriesReqRef = useRef(0);

  const [useCamera, setUseCamera] = useState(true);
  const [cameraErr, setCameraErr] = useState(null);

  const [facingMode, setFacingMode] = useState("environment"); // environment | user
  const [flashOn, setFlashOn] = useState(false);
  const [flashSupported, setFlashSupported] = useState(false);
  const [zoomSupported, setZoomSupported] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1); // 1 | 2

  const [stream, setStream] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [skipImage, setSkipImage] = useState(false);

  // Form
  const [transactionType, setTransactionType] = useState("EXPENSE"); // EXPENSE | INCOME
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("0");
  const [detailNote, setDetailNote] = useState("");
  const [transactionDate, setTransactionDate] = useState(initialDate || "");
  const [locationText] = useState(""); // placeholder UI only
  const [amountEditOpen, setAmountEditOpen] = useState(false);
  const [amountDraft, setAmountDraft] = useState("0");
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const afterCaptureRef = useRef(null);
  const categoryBtnRef = useRef(null);
  const afterCaptureScrollRef = useRef(null);
  const [categoryPickerPos, setCategoryPickerPos] = useState({ top: 220, left: 12, width: 320 });

  const loadCategoriesForType = async (type, { force = false } = {}) => {
    const reqId = ++categoriesReqRef.current;
    try {
      const res = await apiGetCapMoneyCategories(type);
      if (reqId !== categoriesReqRef.current) return;
      if (res?.success) {
        const next = res.data || [];
        setCategories(next);
        // Giữ category hiện tại nếu vẫn còn trong danh sách (trừ khi force).
        if (!force && categoryId && next.some((c) => String(c.categoryId) === String(categoryId))) return;
        const first = next[0];
        setCategoryId(first?.categoryId ? String(first.categoryId) : "");
      } else {
        setCategories([]);
        setCategoryId("");
      }
    } catch (e) {
      if (reqId !== categoriesReqRef.current) return;
      console.error("load capmoney categories error:", e);
      setCategories([]);
      setCategoryId("");
    }
  };

  // Sync when open/initialDate changes
  useEffect(() => {
    if (!open) return;
    // Invalidate old category requests mỗi lần mở modal
    categoriesReqRef.current += 1;
    setSaving(false);
    setToast(null);
    setUseCamera(true);
    setCameraErr(null);
    setFlashOn(false);
    setFlashSupported(false);
    setZoomSupported(false);
    setZoomLevel(1);
    setSkipImage(false);
    setImageFile(null);
    setPreviewUrl(null);

    setTransactionType("EXPENSE");
    setCategories([]);
    setCategoryId("");

    setAmount("0");
    setAmountDraft("0");
    setAmountEditOpen(false);
    setCategoryPickerOpen(false);
    setDetailNote("");
    setTransactionDate(initialDate || "");

    const defaultAcc =
      accounts.find((a) => a.isDefault) || accounts.find((a) => a.accountType) || accounts[0];
    setAccountId(defaultAcc?.accountId ? String(defaultAcc.accountId) : "");
  }, [open, initialDate, accounts]);

  // Load categories when transactionType changes
  useEffect(() => {
    if (!open) return;
    loadCategoriesForType(transactionType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionType, open]);

  const stopCamera = async () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    setStream(null);
    try {
      if (videoRef.current) videoRef.current.srcObject = null;
    } catch {}
  };

  const startCamera = async () => {
    if (!open) return;
    if (!useCamera) return;
    if (skipImage) return;
    if (imageFile) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setUseCamera(false);
      setCameraErr("Thiết bị không hỗ trợ camera.");
      return;
    }
    try {
      setCameraErr(null);
      await stopCamera();

      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });

      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play().catch(() => {});
      }

      const track = s.getVideoTracks()?.[0];
      const caps = track?.getCapabilities?.();
      setFlashSupported(Boolean(caps?.torch));
      setZoomSupported(Boolean(caps?.zoom));
    } catch (e) {
      console.error("startCamera error:", e);
      setUseCamera(false);
      setCameraErr("Không mở được camera. Bạn có thể chọn ảnh từ thư viện.");
    }
  };

  // Start/stop camera depending on state
  useEffect(() => {
    if (!open) return;
    if (!useCamera) return;
    if (skipImage) return;
    if (imageFile) return;
    startCamera();
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, useCamera, facingMode, skipImage, imageFile]);

  // Flash toggle (torch)
  useEffect(() => {
    if (!open) return;
    if (!stream) return;
    if (!flashSupported) return;
    const track = stream.getVideoTracks?.()[0];
    if (!track?.applyConstraints) return;

    (async () => {
      try {
        await track.applyConstraints({
          advanced: [{ torch: flashOn }],
        });
      } catch {
        // ignore
      }
    })();
  }, [flashOn, flashSupported, stream, open]);

  // Zoom toggle (if supported)
  useEffect(() => {
    if (!open) return;
    if (!stream) return;
    if (!zoomSupported) return;
    const track = stream.getVideoTracks?.()[0];
    if (!track?.applyConstraints) return;

    (async () => {
      try {
        await track.applyConstraints({
          advanced: [{ zoom: zoomLevel }],
        });
      } catch {
        // ignore
      }
    })();
  }, [zoomLevel, zoomSupported, stream, open]);

  // Stop camera when we have preview or skip
  useEffect(() => {
    if (!open) return;
    if (skipImage || imageFile) {
      stopCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skipImage, imageFile]);

  const openLibrary = () => {
    fileInputRef.current?.click();
  };

  const onPickFile = (file) => {
    if (!file) return;
    setSkipImage(false);
    setTransactionType("EXPENSE");
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    loadCategoriesForType("EXPENSE", { force: true });
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      const w = video.videoWidth || 1280;
      const h = video.videoHeight || 720;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(video, 0, 0, w, h);

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
      if (!blob) return;

      const file = new File([blob], `capmoney_${Date.now()}.jpg`, { type: "image/jpeg" });
      setTransactionType("EXPENSE");
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(blob));
      loadCategoriesForType("EXPENSE", { force: true });
      await stopCamera();
    } catch (e) {
      console.error("capturePhoto error:", e);
      setToast({ type: "error", message: "Chụp ảnh không thành công." });
      setTimeout(() => setToast(null), 1800);
    }
  };

  const canSave = useMemo(() => {
    const amountNum = Number(amount);
    return (
      Number.isFinite(amountNum) &&
      amountNum > 0 &&
      Boolean(accountId) &&
      Boolean(categoryId) &&
      Boolean(transactionDate)
    );
  }, [amount, accountId, categoryId, transactionDate]);

  const onSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("transactionTypeCode", transactionType);
      formData.append("accountId", String(accountId));
      formData.append("categoryId", String(categoryId));
      formData.append("amount", String(Number(amount)));
      formData.append("transactionDate", transactionDate);
      formData.append("detailNote", detailNote || "");
      formData.append("locationText", locationText || "");
      if (imageFile) {
        formData.append("images", imageFile, imageFile.name);
      }

      const res = await apiCreateCapMoneyTransaction(formData);
      if (!res?.success) {
        setToast({ type: "error", message: res?.message || "Lưu thất bại." });
        setTimeout(() => setToast(null), 1800);
        return;
      }

      onCreated?.();
      onClose?.();
    } catch (e) {
      console.error("save transaction error:", e);
      setToast({ type: "error", message: e?.response?.data?.message || "Lưu thất bại." });
      setTimeout(() => setToast(null), 1800);
    } finally {
      setSaving(false);
    }
  };

  const amountNum = Number(amount || 0);
  // UI modal này là full-screen flow (camera + after-capture)
  const isCaptureFlowScreen = true;

  const selectedCategory = useMemo(
    () => categories.find((c) => String(c.categoryId) === String(categoryId)) || null,
    [categories, categoryId]
  );

  const selectedAccount = useMemo(
    () => accounts.find((a) => String(a.accountId) === String(accountId)) || null,
    [accounts, accountId]
  );

  const selectedCategoryIdx = useMemo(() => {
    const idx = categories.findIndex((c) => String(c.categoryId) === String(categoryId));
    return idx >= 0 ? idx : 0;
  }, [categories, categoryId]);

  const measureCategoryPickerPos = () => {
    const btn = categoryBtnRef.current;
    const root = afterCaptureRef.current;
    if (!btn?.getBoundingClientRect || !root?.getBoundingClientRect) {
      return { top: 220, left: 12, width: 320 };
    }
    const rb = btn.getBoundingClientRect();
    const rr = root.getBoundingClientRect();
    const gap = 10;
    const rawTop = rb.bottom - rr.top + gap; // ngay dưới pill
    const rawLeft = rb.left - rr.left; // thẳng hàng cạnh trái pill

    const sidePad = 12;
    // Modal ngắn hơn (gọn) như ảnh
    const width = Math.max(260, Math.min(320, rr.width - sidePad * 2));

    // Clamp theo chiều cao để không bị tràn, nhưng ưu tiên đúng ngay dưới pill
    const panelH = 280; // ước lượng (max-h 260 + padding/viền)
    const minTop = sidePad;
    const maxTop = Math.max(minTop, rr.height - panelH - sidePad);
    const top = Math.min(maxTop, Math.max(minTop, rawTop));

    const minLeft = sidePad;
    const maxLeft = Math.max(minLeft, rr.width - width - sidePad);
    const left = Math.min(maxLeft, Math.max(minLeft, rawLeft));

    return { top, left, width };
  };

  const openCategoryPicker = () => {
    setCategoryPickerPos(measureCategoryPickerPos());
    setCategoryPickerOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    if (!categoryPickerOpen) return;
    const onResize = () => setCategoryPickerPos(measureCategoryPickerPos());
    const sc = afterCaptureScrollRef.current;
    const onScroll = () => setCategoryPickerPos(measureCategoryPickerPos());
    window.addEventListener("resize", onResize);
    sc?.addEventListener?.("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("resize", onResize);
      sc?.removeEventListener?.("scroll", onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryPickerOpen, open]);

  // Category picker modal removed (reverted to native select)

  // (Category picker popup removed — reverted to native select)

  const openAmountEditor = () => {
    // amount đang lưu dạng string số thô (không có dấu phẩy)
    setAmountDraft(String(amount || "0").replace(/[^\d.]/g, "") || "0");
    setAmountEditOpen(true);
  };

  const normalizeDraftToAmount = (draft) => {
    const cleaned = String(draft || "0").replace(/[^\d.]/g, "");
    if (!cleaned) return "0";
    // chỉ cho 1 dấu chấm
    const parts = cleaned.split(".");
    const head = (parts[0] || "0").replace(/^0+(?=\d)/, "");
    if (parts.length === 1) return head || "0";
    const tail = parts.slice(1).join(""); // gộp phần dư (nếu có)
    return `${head || "0"}.${tail}`;
  };

  const commitAmountDraft = () => {
    setAmount(normalizeDraftToAmount(amountDraft));
    setAmountEditOpen(false);
  };

  const pressKeypad = (k) => {
    setAmountDraft((prev) => {
      let s = String(prev ?? "0");
      if (k === "C") return "0";
      if (k === "⌫") return s.length <= 1 ? "0" : s.slice(0, -1);
      if (k === "=") return s;
      if (k === ".") {
        if (s.includes(".")) return s;
        return s + ".";
      }
      if (k === "000") {
        if (s === "0") return "0";
        return s + "000";
      }
      // digits
      if (/^\d$/.test(k)) {
        if (s === "0") return k;
        return s + k;
      }
      return s;
    });
  };

  // Bấm số là áp dụng tiền ngay (live update)
  useEffect(() => {
    if (!open) return;
    if (!amountEditOpen) return;
    setAmount(normalizeDraftToAmount(amountDraft));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amountDraft, amountEditOpen, open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[11000] bg-black/35 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-x-0 bottom-0 h-[100vh] bg-white rounded-t-3xl overflow-hidden flex flex-col"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-pink-100 bg-gradient-to-r from-pink-50 to-white">
              <button
                type="button"
                onClick={onClose}
                className="text-sm font-semibold text-slate-700 hover:text-slate-900"
              >
                Hủy
              </button>
              <div className="text-center">
                <div className="text-[13px] font-semibold text-slate-800">Thêm giao dịch</div>
                <div className="text-[11px] text-slate-500">CapMoney</div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="h-9 w-9 rounded-full grid place-items-center text-slate-600 hover:bg-slate-100"
                aria-label="Đóng"
              >
                <FiX />
              </button>
            </div>

            {/* Content */}
            <div
              className={[
                "flex-1",
                isCaptureFlowScreen ? "overflow-hidden px-0 pb-0" : "overflow-y-auto px-4 pb-6",
              ].join(" ")}
              style={
                isCaptureFlowScreen
                  ? undefined
                  : { paddingBottom: "calc(24px + env(safe-area-inset-bottom))" }
              }
            >
              {/* Preview camera / image */}
              {!skipImage && !imageFile ? (
                <div className="-mx-4 bg-[#f7f2ea] h-full flex flex-col">
                  {useCamera ? (
                    <div className="px-8 pt-6">
                      <div className="relative rounded-[28px] overflow-hidden bg-slate-100 ring-1 ring-black/5 shadow-sm">
                        <video
                          ref={videoRef}
                          playsInline
                          muted
                          className="w-full aspect-[4/5] object-cover"
                        />

                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/25 via-transparent to-transparent" />

                        {/* Top controls */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
                          <button
                            type="button"
                            onClick={() => setFlashOn((v) => !v)}
                            disabled={!flashSupported}
                            className={[
                              "h-9 w-9 rounded-full bg-black/40 backdrop-blur-sm text-white grid place-items-center",
                              "ring-1 ring-white/20 shadow-sm",
                              !flashSupported ? "opacity-40" : "",
                            ].join(" ")}
                            aria-label="Flash"
                          >
                            <FiZap className="text-[16px]" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setFacingMode((m) => (m === "environment" ? "user" : "environment"))}
                            className="h-9 w-9 rounded-full bg-black/40 backdrop-blur-sm text-white grid place-items-center ring-1 ring-white/20 shadow-sm"
                            aria-label="Đổi camera"
                          >
                            <FiRefreshCw className="text-[16px]" />
                          </button>
                        </div>

                        {/* Zoom toggle */}
                        <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center pointer-events-auto">
                          <div className="inline-flex items-center gap-1 rounded-full bg-black/45 backdrop-blur-sm ring-1 ring-white/15 p-1">
                            <button
                              type="button"
                              onClick={() => setZoomLevel(1)}
                              className={[
                                "h-8 w-10 rounded-full text-[13px] font-extrabold",
                                zoomLevel === 1 ? "bg-white/15 text-amber-200" : "text-white/85",
                              ].join(" ")}
                            >
                              1x
                            </button>
                            <button
                              type="button"
                              onClick={() => setZoomLevel(2)}
                              disabled={!zoomSupported}
                              className={[
                                "h-8 w-10 rounded-full text-[13px] font-extrabold",
                                zoomLevel === 2 ? "bg-white/15 text-white" : "text-white/85",
                                !zoomSupported ? "opacity-40" : "",
                              ].join(" ")}
                            >
                              2x
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="px-4 pt-4">
                      <div className="rounded-3xl border border-pink-100 bg-pink-50 p-4 text-slate-700">
                      <div className="font-semibold">Không dùng được camera</div>
                      <div className="text-sm text-slate-600 mt-1">{cameraErr || ""}</div>
                    </div>
                    </div>
                  )}

                  {/* Shutter + actions */}
                  <div className="px-4 mt-6 flex flex-col items-center pb-[env(safe-area-inset-bottom)]">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="h-[84px] w-[84px] rounded-full bg-white shadow-sm ring-1 ring-black/5 grid place-items-center"
                      aria-label="Chụp ảnh"
                    >
                      <div className="h-[68px] w-[68px] rounded-full bg-white ring-[6px] ring-[rgba(168,85,247,0.45)]" />
                    </button>

                    <button
                      type="button"
                      onClick={openLibrary}
                      className="mt-5 h-12 px-6 rounded-full bg-violet-100/70 text-violet-700 font-extrabold text-[15px] ring-1 ring-violet-200 flex items-center gap-2"
                    >
                      <FiImageIcon className="text-[18px]" />
                      Chọn từ thư viện
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSkipImage(true);
                        setImageFile(null);
                        setPreviewUrl(null);
                        stopCamera();
                      }}
                      className="mt-3 text-[15px] font-semibold text-slate-500"
                    >
                      Bỏ qua ảnh
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onPickFile(file);
                      e.target.value = "";
                    }}
                  />
                </div>
              ) : (
                <div ref={afterCaptureRef} className="-mx-4 bg-[#f7f2ea] h-full flex flex-col overflow-hidden px-8 pt-5 relative">
                  {/* Preview */}
                  <div
                    ref={afterCaptureScrollRef}
                    className="flex-1 overflow-y-auto"
                    style={{ WebkitOverflowScrolling: "touch" }}
                  >
                    {previewUrl && !skipImage ? (
                      <div className="mx-auto w-full max-w-[392px] relative rounded-[32px] overflow-hidden bg-slate-50 shadow-[0_16px_42px_rgba(0,0,0,0.10)]">
                        <img src={previewUrl} alt="Preview" className="w-full aspect-[4/5] object-cover" />

                        {/* Overlay amount + note */}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center justify-center">
                          <div className="w-[min(320px,calc(100vw-84px))] rounded-[26px] bg-black/40 backdrop-blur-[7px] px-5 py-[10px] shadow-[0_10px_28px_rgba(0,0,0,0.26)]">
                            <button
                              type="button"
                              onClick={openAmountEditor}
                              className="relative w-full h-9 text-[30px] font-extrabold text-white tabular-nums drop-shadow active:scale-[0.99] transition"
                              aria-label="Sửa số tiền"
                            >
                              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-baseline gap-2">
                                <span className={transactionType === "EXPENSE" ? "text-rose-400" : "text-emerald-300"}>
                                  {transactionType === "EXPENSE" ? "-" : "+"}
                                </span>
                                <span>{formatVND(amountNum)}</span>
                                <span className="text-white/80 text-[20px] font-extrabold">đ</span>
                              </span>
                            </button>

                            <div className="mt-2 h-9 rounded-full bg-white/16 ring-1 ring-white/12 flex items-center px-4">
                              <FiEdit3 className="text-white/55 text-[15px] mr-2" />
                              <input
                                value={detailNote}
                                onChange={(e) => setDetailNote(e.target.value)}
                                placeholder="Thêm chi tiết"
                                className="flex-1 bg-transparent text-white/85 placeholder:text-white/45 text-[12.5px] font-semibold outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="mx-auto w-full max-w-[392px] rounded-[32px] overflow-hidden shadow-[0_16px_42px_rgba(0,0,0,0.10)]"
                        style={{
                          background: `linear-gradient(160deg, ${hexToRgba(selectedCategory?.categoryColor || "#22C55E", 0.88)} 0%, ${hexToRgba(
                            selectedCategory?.categoryColor || "#22C55E",
                            0.62
                          )} 55%, ${hexToRgba(selectedCategory?.categoryColor || "#22C55E", 0.92)} 100%)`,
                        }}
                      >
                        <div className="w-full aspect-[4/5] relative">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_20%,rgba(255,255,255,0.35),transparent_55%)]" />
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="h-20 w-20 rounded-full bg-white/18 backdrop-blur-[2px] ring-1 ring-white/15 grid place-items-center">
                              {(() => {
                                const Icon = getCategoryIconComponent(selectedCategory?.categoryIcon);
                                return <Icon className="text-white text-[34px] drop-shadow" />;
                              })()}
                            </div>
                            <div className="mt-3 text-white/95 font-extrabold text-[18px] drop-shadow">
                              {selectedCategory?.categoryName || "Chọn danh mục"}
                            </div>
                          </div>

                          {/* Overlay amount + note (same as with image) */}
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center justify-center">
                            <div className="w-[min(320px,calc(100vw-84px))] rounded-[26px] bg-black/40 backdrop-blur-[7px] px-5 py-[10px] shadow-[0_10px_28px_rgba(0,0,0,0.26)]">
                              <button
                                type="button"
                                onClick={openAmountEditor}
                                className="relative w-full h-9 text-[30px] font-extrabold text-white tabular-nums drop-shadow active:scale-[0.99] transition"
                                aria-label="Sửa số tiền"
                              >
                                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-baseline gap-2">
                                  <span className={transactionType === "EXPENSE" ? "text-rose-400" : "text-emerald-300"}>
                                    {transactionType === "EXPENSE" ? "-" : "+"}
                                  </span>
                                  <span>{formatVND(amountNum)}</span>
                                  <span className="text-white/80 text-[20px] font-extrabold">đ</span>
                                </span>
                              </button>

                              <div className="mt-2 h-9 rounded-full bg-white/16 ring-1 ring-white/12 flex items-center px-4">
                                <FiEdit3 className="text-white/55 text-[15px] mr-2" />
                                <input
                                  value={detailNote}
                                  onChange={(e) => setDetailNote(e.target.value)}
                                  placeholder="Thêm chi tiết"
                                  className="flex-1 bg-transparent text-white/85 placeholder:text-white/45 text-[12.5px] font-semibold outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Pills */}
                    <div className="mt-5 flex flex-col items-center justify-center gap-3">
                      <div className="flex items-center justify-center gap-3">
                        <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                          <span
                            className="h-6 w-6 rounded-full ring-1 ring-black/5 shadow-[0_8px_18px_rgba(0,0,0,0.06)] grid place-items-center shrink-0"
                            style={{ backgroundColor: hexToRgba(selectedCategory?.categoryColor || "#22C55E", 0.16) }}
                          >
                            {(() => {
                              const Icon = getCategoryIconComponent(selectedCategory?.categoryIcon);
                              return <Icon className="text-[14px]" style={{ color: selectedCategory?.categoryColor || "#16A34A" }} />;
                            })()}
                          </span>
                        </span>
                        <button
                          type="button"
                          ref={categoryBtnRef}
                          onClick={() => (categoryPickerOpen ? setCategoryPickerOpen(false) : openCategoryPicker())}
                          className="h-10 pl-11 pr-10 rounded-full bg-emerald-50/80 ring-1 ring-emerald-200/70 shadow-[0_10px_22px_rgba(0,0,0,0.06)] text-slate-800 font-extrabold text-[13px] flex items-center"
                          aria-label="Chọn danh mục"
                        >
                          <span className="max-w-[120px] truncate">{selectedCategory?.categoryName || "Chọn danh mục"}</span>
                        </button>
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-600">▾</span>
                      </div>

                        <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                          <span className="h-6 w-6 rounded-full bg-white/70 ring-1 ring-black/5 shadow-[0_8px_18px_rgba(0,0,0,0.06)] grid place-items-center">
                            {(() => {
                              const Icon = getAccountIconComponent(selectedAccount?.accountIcon || selectedAccount?.accountType);
                              return <Icon className="text-[14px] text-slate-700" />;
                            })()}
                          </span>
                        </span>
                      <select
                        value={accountId}
                        onChange={(e) => setAccountId(e.target.value)}
                        className="h-10 pl-9 pr-10 rounded-full bg-emerald-50/80 ring-1 ring-emerald-200/70 shadow-[0_10px_22px_rgba(0,0,0,0.06)] text-slate-800 font-extrabold text-[13px] appearance-none"
                      >
                        {accounts.length === 0 ? (
                          <option value="">Chưa có tài khoản</option>
                        ) : (
                          accounts.map((a) => (
                            <option key={a.accountId} value={a.accountId}>
                              {a.accountName}
                            </option>
                          ))
                        )}
                      </select>
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-600">▾</span>
                    </div>
                      </div>

                  </div>

                  {/* Toggle chi/thu */}
                  <div className="mt-4 flex items-center justify-center">
                    <div className="h-11 px-2 rounded-full bg-white/80 ring-1 ring-black/5 shadow-[0_14px_28px_rgba(0,0,0,0.08)] flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setTransactionType("EXPENSE")}
                        className={[
                          "h-9 w-9 rounded-full grid place-items-center transition",
                          transactionType === "EXPENSE" ? "bg-rose-400 text-white shadow" : "bg-white/70 text-slate-600",
                        ].join(" ")}
                        aria-label="Chi"
                      >
                        <FiArrowUpRight className="text-[16px]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setTransactionType("INCOME")}
                        className={[
                          "h-9 w-9 rounded-full grid place-items-center transition",
                          transactionType === "INCOME" ? "bg-emerald-400 text-white shadow" : "bg-white/70 text-slate-600",
                        ].join(" ")}
                        aria-label="Thu"
                      >
                        <FiArrowDownLeft className="text-[16px]" />
                      </button>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="mt-4 flex items-center justify-center">
                    <div className="relative">
                      <input
                        type="date"
                        value={transactionDate}
                        onChange={(e) => setTransactionDate(e.target.value)}
                        className="absolute inset-0 opacity-0"
                        aria-label="Chọn ngày"
                      />
                      <button
                        type="button"
                        className="h-11 px-5 rounded-full bg-white/80 ring-1 ring-black/5 shadow-[0_14px_28px_rgba(0,0,0,0.08)] font-extrabold text-[13px] text-slate-800 flex items-center gap-2"
                      >
                        <span className="h-6 w-6 rounded-full bg-white/70 ring-1 ring-black/5 grid place-items-center">
                          <FiCalendar className="text-[14px] text-slate-700" />
                        </span>
                        <span>{transactionDate ? "Hôm nay" : "Hôm nay"}</span>
                        <span className="text-slate-500">▾</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Actions (same block as inputs) */}
                  <div className="mt-5 flex items-end justify-between px-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSkipImage(false);
                        setImageFile(null);
                        setPreviewUrl(null);
                        setFlashOn(false);
                      }}
                      className="w-16 flex flex-col items-center text-slate-600 opacity-60"
                    >
                      <div className="h-11 w-11 rounded-2xl bg-white/80 ring-1 ring-black/5 shadow-[0_10px_20px_rgba(0,0,0,0.06)] grid place-items-center">
                        <MdOutlinePhotoCamera className="text-[18px] text-slate-700" />
                      </div>
                      <div className="mt-2 text-[11px] font-bold">Chụp lại</div>
                    </button>

                    <button
                      type="button"
                      onClick={onSave}
                      disabled={!canSave || saving}
                      className="h-[68px] w-[68px] rounded-full bg-white/55 ring-2 ring-white/80 shadow-[0_16px_36px_rgba(0,0,0,0.10)] grid place-items-center disabled:opacity-40"
                      aria-label="Lưu"
                    >
                      <div className="h-[52px] w-[52px] rounded-full bg-white ring-2 ring-slate-300 grid place-items-center text-slate-400 text-[26px]">
                        <FiCheck className="text-[26px]" />
                      </div>
                    </button>

                    <button type="button" disabled className="w-16 flex flex-col items-center text-slate-300 opacity-40">
                      <div className="h-11 w-11 rounded-2xl bg-white/70 ring-1 ring-black/5 shadow-[0_10px_20px_rgba(0,0,0,0.06)] grid place-items-center">
                        ⤴
                      </div>
                      <div className="mt-2 text-[11px] font-bold">Share</div>
                    </button>
                  </div>

                  <div style={{ height: "calc(14px + env(safe-area-inset-bottom))" }} />
                </div>

                  {/* Category picker overlay (does NOT push layout) */}
                  <AnimatePresence>
                    {categoryPickerOpen && (
                      <motion.div
                        className="absolute inset-0 z-[14000]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <button
                          type="button"
                          className="absolute inset-0 bg-transparent"
                          onClick={() => setCategoryPickerOpen(false)}
                          aria-label="Đóng chọn danh mục"
                        />

                        <motion.div
                          className="absolute rounded-3xl bg-white/95 backdrop-blur-md ring-1 ring-black/5 shadow-[0_18px_60px_rgba(0,0,0,0.14)] overflow-hidden"
                          style={{ top: categoryPickerPos.top, left: categoryPickerPos.left, width: categoryPickerPos.width }}
                          initial={{ opacity: 0, y: -6, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.98 }}
                          transition={{ duration: 0.16, ease: "easeOut" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="max-h-[260px] overflow-y-auto" style={{ WebkitOverflowScrolling: "touch" }}>
                            {categories.map((c) => {
                              const active = String(c.categoryId) === String(categoryId);
                              const Icon = getCategoryIconComponent(c.categoryIcon);
                              return (
                                <button
                                  key={c.categoryId}
                                  type="button"
                                  onClick={() => {
                                    setCategoryId(String(c.categoryId));
                                    setCategoryPickerOpen(false);
                                  }}
                                  className={[
                                    "w-full flex items-center justify-between px-3 py-3 text-left",
                                    active ? "bg-emerald-50" : "bg-transparent hover:bg-slate-50",
                                  ].join(" ")}
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div
                                      className="h-10 w-10 rounded-2xl ring-1 ring-black/5 grid place-items-center shrink-0"
                                      style={{ backgroundColor: hexToRgba(c.categoryColor || "#22C55E", 0.16) }}
                                    >
                                      <Icon className="text-[18px]" style={{ color: c.categoryColor || "#16A34A" }} />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-extrabold text-[14px] text-slate-800 truncate">{c.categoryName}</div>
                                    </div>
                                  </div>
                                  {active && (
                                    <div className="h-6 w-6 rounded-full bg-emerald-500 text-white grid place-items-center shrink-0">
                                      <FiCheck className="text-[14px]" />
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Inline toast */}
              {toast && (
                <div className="mt-4 rounded-2xl bg-rose-50 ring-1 ring-rose-100 px-4 py-3 text-rose-700 text-sm">
                  {toast.message}
                </div>
              )}

              {saving && (
                <div className="mt-4 text-center text-sm text-slate-500 font-semibold">
                  Đang lưu...
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Amount editor */}
      {open && amountEditOpen && (
        <motion.div
          className="fixed inset-0 z-[12000] bg-black/30 backdrop-blur-[2px] flex items-end sm:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setAmountEditOpen(false)}
        >
          <motion.div
            className="w-full sm:w-[520px] bg-[#f7f2ea] rounded-t-[28px] sm:rounded-[28px] p-4 sm:p-5 shadow-[0_22px_70px_rgba(0,0,0,0.30)]"
            initial={{ y: 40 }}
            animate={{ y: 0 }}
            exit={{ y: 40 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto h-1.5 w-14 rounded-full bg-black/10" />

            <div className="mt-3 flex items-center justify-center">
              <div className="text-[34px] font-extrabold text-slate-800 tabular-nums flex items-center justify-center gap-2">
                <span className={transactionType === "EXPENSE" ? "text-rose-500" : "text-emerald-600"}>
                  {transactionType === "EXPENSE" ? "-" : "+"}
                </span>
                <span className="text-center min-w-[1ch]">{formatVND(amountDraft)}</span>
                <span className="text-slate-500">đ</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-3">
              {[
                "1",
                "2",
                "3",
                "÷",
                "4",
                "5",
                "6",
                "×",
                "7",
                "8",
                "9",
                "-",
                ".",
                "0",
                "000",
                "+",
              ].map((k) => {
                const isOp = ["÷", "×", "-", "+"].includes(k);
                const onPress = () => {
                  if (k === "÷") return pressKeypad("⌫");
                  if (k === "×") return pressKeypad("C");
                  if (k === "-" || k === "+") return; // sign controlled by transactionType
                  return pressKeypad(k);
                };
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={onPress}
                    className={[
                      "h-[58px] rounded-2xl font-extrabold text-[20px] shadow-[0_10px_22px_rgba(0,0,0,0.06)] ring-1 ring-black/5 active:scale-[0.99] transition",
                      isOp ? "bg-rose-200/70 text-rose-600" : "bg-white/75 text-slate-800",
                      (k === "-" || k === "+") ? "opacity-50" : "",
                    ].join(" ")}
                    aria-label={k}
                  >
                    {k}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => pressKeypad("⌫")}
                className="col-span-2 h-[58px] rounded-2xl bg-white/70 ring-1 ring-black/5 shadow-[0_10px_22px_rgba(0,0,0,0.06)] font-extrabold text-slate-700 active:scale-[0.99] transition"
                aria-label="Xóa"
              >
                ⌫
              </button>
              <button
                type="button"
                onClick={() => pressKeypad("C")}
                className="h-[58px] rounded-2xl bg-white/70 ring-1 ring-black/5 shadow-[0_10px_22px_rgba(0,0,0,0.06)] font-extrabold text-rose-500 active:scale-[0.99] transition"
                aria-label="C"
              >
                C
              </button>
              <button
                type="button"
                onClick={commitAmountDraft}
                className="h-[58px] rounded-2xl bg-rose-400 text-white ring-1 ring-rose-300 shadow-[0_16px_36px_rgba(244,63,94,0.35)] font-extrabold text-[22px] active:scale-[0.99] transition"
                aria-label="="
              >
                =
              </button>
            </div>

            <div style={{ height: "calc(10px + env(safe-area-inset-bottom))" }} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

