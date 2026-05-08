import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiCheck, FiShare2, FiX } from "react-icons/fi";
import { FaCamera, FaExchangeAlt } from "react-icons/fa";
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
  return new Intl.NumberFormat("vi-VN").format(num) + "đ";
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
    setSkipImage(false);
    setImageFile(null);
    setPreviewUrl(null);

    setTransactionType("EXPENSE");
    setCategories([]);
    setCategoryId("");

    setAmount("0");
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
              className="flex-1 overflow-y-auto px-4 pb-6"
              style={{ paddingBottom: "calc(24px + env(safe-area-inset-bottom))" }}
            >
              {/* Preview camera / image */}
              {!skipImage && !imageFile ? (
                <div className="mt-4">
                  {useCamera ? (
                    <div className="relative rounded-3xl overflow-hidden bg-slate-100 ring-1 ring-pink-100">
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        className="w-full aspect-[16/9] object-cover"
                      />

                      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/20 via-transparent to-transparent" />

                      {/* Top controls */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
                        <button
                          type="button"
                          onClick={() => setFacingMode((m) => (m === "environment" ? "user" : "environment"))}
                          className="h-10 px-3 rounded-2xl bg-white/85 hover:bg-white text-slate-800 text-sm font-semibold ring-1 ring-white/60 flex items-center gap-2"
                        >
                          <FaExchangeAlt className="text-[14px]" />
                          Camera
                        </button>

                        <button
                          type="button"
                          onClick={() => setFlashOn((v) => !v)}
                          disabled={!flashSupported}
                          className="h-10 px-3 rounded-2xl bg-white/85 hover:bg-white text-slate-800 text-sm font-semibold ring-1 ring-white/60 disabled:opacity-40"
                        >
                          Flash: {flashOn ? "On" : "Off"}
                        </button>
                      </div>

                      {/* Capture */}
                      <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center pointer-events-auto">
                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="h-[52px] w-[52px] rounded-full border-[4px] border-violet-200 shadow-lg shadow-violet-100 bg-violet-50"
                          aria-label="Chụp ảnh"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-3xl border border-pink-100 bg-pink-50 p-4 text-slate-700">
                      <div className="font-semibold">Không dùng được camera</div>
                      <div className="text-sm text-slate-600 mt-1">{cameraErr || ""}</div>
                    </div>
                  )}

                  {/* Buttons under camera */}
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={openLibrary}
                      className="h-12 rounded-2xl bg-white ring-1 ring-pink-100 text-slate-800 font-semibold text-sm hover:bg-pink-50"
                    >
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
                      className="h-12 rounded-2xl bg-pink-50 ring-1 ring-pink-100 text-pink-700 font-semibold text-sm hover:bg-pink-100/40"
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
                <div className="mt-4">
                  {previewUrl && !skipImage ? (
                    <div className="rounded-3xl overflow-hidden ring-1 ring-pink-100 bg-slate-50">
                      <img src={previewUrl} alt="Preview" className="w-full aspect-[16/10] object-cover" />
                    </div>
                  ) : (
                    <div className="rounded-3xl p-4 border border-dashed border-pink-100 bg-pink-50 text-slate-700">
                      <div className="font-semibold">Không có ảnh</div>
                      <div className="text-sm text-slate-600 mt-1">
                        Bạn vẫn có thể lưu giao dịch bình thường.
                      </div>
                    </div>
                  )}

                  {/* Form */}
                  <div className="mt-4 rounded-3xl bg-white ring-1 ring-pink-100 p-4">
                    {/* Amount */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-semibold text-slate-800">Số tiền</div>
                        <div className="text-sm font-semibold text-pink-700">{formatVND(amountNum)}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setAmount((v) => String(Math.max(0, Number(v) - 10000)))}
                          className="h-11 w-11 rounded-2xl bg-pink-50 ring-1 ring-pink-100 text-pink-700 text-xl font-bold"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          inputMode="decimal"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="flex-1 h-11 rounded-2xl bg-slate-50 ring-1 ring-slate-200 px-3 text-slate-900 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-pink-300"
                          placeholder="0"
                          min={0}
                        />
                        <button
                          type="button"
                          onClick={() => setAmount((v) => String(Number(v || 0) + 10000))}
                          className="h-11 w-11 rounded-2xl bg-pink-50 ring-1 ring-pink-100 text-pink-700 text-xl font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Detail */}
                    <div className="mb-4">
                      <div className="text-sm font-semibold text-slate-800 mb-2">Chi tiết / ghi chú</div>
                      <textarea
                        value={detailNote}
                        onChange={(e) => setDetailNote(e.target.value)}
                        rows={3}
                        className="w-full rounded-2xl bg-slate-50 ring-1 ring-slate-200 px-3 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none"
                        placeholder="Ví dụ: Tiền xăng, tiền cơm, nhận lương..."
                      />
                    </div>

                    {/* Category */}
                    <div className="mb-4">
                      <div className="text-sm font-semibold text-slate-800 mb-2">Danh mục</div>
                      <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full h-11 rounded-2xl bg-slate-50 ring-1 ring-slate-200 px-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                      >
                        {categories.length === 0 ? (
                          <option value="">Chưa có danh mục</option>
                        ) : (
                          categories.map((c) => (
                            <option key={c.categoryId} value={c.categoryId}>
                              {c.categoryName}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    {/* Account */}
                    <div className="mb-4">
                      <div className="text-sm font-semibold text-slate-800 mb-2">Tài khoản</div>
                      <select
                        value={accountId}
                        onChange={(e) => setAccountId(e.target.value)}
                        className="w-full h-11 rounded-2xl bg-slate-50 ring-1 ring-slate-200 px-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                      >
                        {accounts.length === 0 ? (
                          <option value="">Chưa có tài khoản</option>
                        ) : (
                          accounts.map((a) => (
                            <option key={a.accountId} value={a.accountId}>
                              {a.accountName} {a.isDefault ? "(mặc định)" : ""}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    {/* Toggle Thu/Chi */}
                    <div className="mb-4">
                      <div className="text-sm font-semibold text-slate-800 mb-2">Thu / Chi</div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setTransactionType("INCOME")}
                          className={[
                            "h-11 rounded-2xl ring-1 text-sm font-semibold",
                            transactionType === "INCOME"
                              ? "bg-emerald-50 ring-emerald-200 text-emerald-800"
                              : "bg-white ring-pink-100 text-slate-700 hover:bg-pink-50",
                          ].join(" ")}
                        >
                          Thu
                        </button>
                        <button
                          type="button"
                          onClick={() => setTransactionType("EXPENSE")}
                          className={[
                            "h-11 rounded-2xl ring-1 text-sm font-semibold",
                            transactionType === "EXPENSE"
                              ? "bg-pink-50 ring-pink-200 text-pink-800"
                              : "bg-white ring-pink-100 text-slate-700 hover:bg-pink-50",
                          ].join(" ")}
                        >
                          Chi
                        </button>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="mb-4">
                      <div className="text-sm font-semibold text-slate-800 mb-2">Ngày giao dịch</div>
                      <input
                        type="date"
                        value={transactionDate}
                        onChange={(e) => setTransactionDate(e.target.value)}
                        className="w-full h-11 rounded-2xl bg-slate-50 ring-1 ring-slate-200 px-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSkipImage(false);
                          setImageFile(null);
                          setPreviewUrl(null);
                          // camera will re-start by effect
                          setFlashOn(false);
                        }}
                        className="h-12 flex-1 rounded-2xl bg-white ring-1 ring-pink-100 text-slate-700 font-semibold text-sm hover:bg-pink-50"
                      >
                        Chụp lại
                      </button>

                      <button
                        type="button"
                        onClick={onSave}
                        disabled={!canSave || saving}
                        className="h-12 w-12 rounded-2xl bg-pink-600 disabled:opacity-40 disabled:cursor-not-allowed text-white grid place-items-center shadow-sm shadow-pink-200"
                        aria-label="Lưu"
                      >
                        <FiCheck />
                      </button>

                      <button
                        type="button"
                        className="h-12 w-12 rounded-2xl bg-white ring-1 ring-pink-100 text-slate-700 grid place-items-center hover:bg-pink-50"
                        aria-label="Chia sẻ"
                        onClick={() => {}}
                      >
                        <FiShare2 />
                      </button>
                    </div>
                  </div>
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
    </AnimatePresence>
  );
}

