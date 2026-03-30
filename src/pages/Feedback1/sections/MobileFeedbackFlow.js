// src/pages/Home/sections/MobileFeedbackFlow.jsx
import React from "react";
import { FaThLarge } from "react-icons/fa";
import { motion } from "framer-motion";
import {
  FaPenNib,
  FaArrowLeft,
} from "react-icons/fa";
import bg_page from "~/assets/imgs/bg_page_3.png";

export default function MobileFeedbackFlow({
  tmp,

  avatar,
  // assets
  logo,
  logoFeedback,
  textThanks,

  // data/state
  step,
  setStep,
  categories,
  loadingCategories,
  selectedCategoryName,
  setSelectedCategory,
  setSelectedCategoryName,

  // salary modal
  showSalaryModal,
  setShowSalaryModal,
  salaryOptions,
  selectedSalary,
  setSelectedSalary,
  jumpIndex,
  setJumpIndex,

  // content/images
  feedback,
  setFeedback,
  handleFileChange,
  imagePreviews,

  // contact
  wantContact,
  setWantContact,
  contactInfo,
  setContactInfo,

  // actions
  handleSend,
  navigate,
  config,

  // ui overlays
  loading,
  modalMessage,
  setModalMessage,
}) {
  const fullName = tmp?.login?.currentUser?.fullName || "bạn";

  /* ================== YELLOW + BLUE TOKENS ================== */
  const bgMain = "bg-[#FFF6D8]"; // vàng kem
  const headerGrad =
    "bg-gradient-to-br from-sky-600 via-sky-500 to-amber-400";
  const cardBg = "bg-[#FFFDF4] border border-[#997d0d99]";
  const chipBg = "bg-[#FFF1C2] border border-amber-200/70";
  const iconPill =
    "w-9 h-9 rounded-xl grid place-items-center text-[18px] " +
    "bg-[#FFF1C2] border border-amber-200/70 text-slate-800";

  const btnPrimary =
    "bg-gradient-to-br from-sky-600 to-sky-700 text-white";
  const btnSoft =
    "bg-[#FFF1C2] text-slate-900 border border-amber-200/70";

  /* ========================================================== */

  return (
    <div className={`md:hidden ${bgMain}`} style={{ minHeight: "calc(100dvh)" }}>
      {/* LOADING OVERLAY */}
      {loading && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-white/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-300 border-t-transparent" />
            <p className="text-sm text-slate-700">Đang gửi góp ý...</p>
          </div>
        </div>
      )}

      {/* MODAL MESSAGE */}
      {modalMessage && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl ring-1 ring-slate-200">
            <p className="mb-4 text-sm text-slate-800">{modalMessage}</p>
            <button
              onClick={() => setModalMessage("")}
              className="rounded-full bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* HEADER (GIỐNG MobileHomeTrash nhưng tone vàng-xanh) */}
      <div
        className={`
          relative
          ${headerGrad}
          rounded-b-[50px]
          px-4 pt-4 pb-[170px]
        `}
      >
        {/* Top row */}
        <div className="relative flex items-center justify-between mt-[20px]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 rounded-full overflow-hidden bg-white/30 border border-white/40">
              <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
            </div>

            <div className="min-w-0">
              <div className="text-sm text-white/90">Xin chào,</div>
              <div className="text-2xl font-semibold text-white truncate">
                {fullName}
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate(config.routes.homeMain)}
            className="
              h-10 w-10 rounded-full grid place-items-center text-white
              bg-white/25 border border-white/40
              active:scale-95 transition
            "
            aria-label="Chọn ứng dụng"
            title="Chọn ứng dụng"
          >
            <FaThLarge />
          </button>
        </div>

        {/* CARD (chứa toàn bộ flow) */}
        <div className="absolute left-4 right-4 top-[110px]">
          <div 
            className={`rounded-3xl px-4 py-4 ${cardBg}`}
            style={{
                backgroundImage: `url('${bg_page}')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
            }}
          >
            {/* Card header nhỏ */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-[20px] font-extrabold text-slate-900">
                  📩 Hòm thư <span className="text-sky-700">góp ý</span>
                </div>
                <div className="mt-2">
                  <span
                    className={`inline-flex items-center gap-2 text-[12px] font-semibold px-3 py-1 rounded-full ${chipBg} text-slate-800`}
                  >
                    Bảo mật • Nhanh gọn
                  </span>
                </div>
              </div>
              <div className="h-[76px] w-[76px] rounded-2xl bg-[#FFF1C2] border border-amber-200/70 grid place-items-center">
                <img src={logo} alt="logo" className="h-12 w-12 object-contain" />
              </div>
            </div>

            {/* BODY SCROLL */}
            <div className="mt-4 max-h-[calc(100dvh-300px)] overflow-y-auto pr-1">
              {/* STEP 0 */}
              {step === 0 && (
                <motion.div
                  className="flex flex-col items-center justify-center text-center py-6"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45 }}
                >
                  <img
                    src={logoFeedback}
                    alt="Mail animation"
                    className="mb-4 h-24 w-24 animate-bounce drop-shadow-sm"
                  />
                  <h2 className="mb-2 flex items-center text-lg font-bold text-sky-700">
                    📩 <span className="ml-2 text-slate-900">Hòm thư góp ý</span>
                  </h2>
                  <p className="max-w-md text-sm leading-relaxed text-slate-700">
                    Chào bạn! Hãy thoải mái gửi ý kiến.
                    <br />
                    Trân trọng các bạn nhiều <span className="animate-pulse text-amber-500">💛</span>
                  </p>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setStep(1)}
                    className="mt-5 rounded-2xl px-5 py-3 text-sm font-semibold shadow-sm active:scale-[.98] transition w-full
                      bg-gradient-to-br from-sky-600 to-sky-700 text-white"
                  >
                    Bắt đầu
                  </motion.button>
                </motion.div>
              )}

              {/* STEP 1: chọn danh mục */}
              {step === 1 && (
                <motion.div
                  className="space-y-3"
                  key="m_step1"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35 }}
                >
                  <h2 className="text-center text-[15px] font-semibold">
                    📝 <span className="text-sky-700">Bạn muốn góp ý về:</span>
                  </h2>

                  {loadingCategories ? (
                    <div className="py-8 text-center text-slate-600">⏳ Đang tải danh mục...</div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {categories.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedCategory(item.suggestionCategorieId);
                            setSelectedCategoryName(item.label);
                            if (item.label.toLowerCase().includes("lương")) {
                              //setShowSalaryModal(true);
                              setStep(2);
                            } else {
                              setStep(2);
                            }
                          }}
                          className="
                            flex w-full items-center gap-3 rounded-2xl
                            border border-slate-200 bg-white/90
                            px-4 py-3 text-left text-sm text-slate-800
                            hover:bg-sky-50 active:scale-[.99] transition
                          "
                        >
                          <span
                            className="
                              grid h-9 w-9 place-items-center rounded-xl
                              bg-sky-50 text-sky-700
                              ring-1 ring-inset ring-sky-200
                            "
                          >
                            {item.icon}
                          </span>
                          <span className="font-medium">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <p className="pt-1 text-center text-xs italic text-slate-500">
                    🔒 Ý kiến của bạn sẽ được bảo mật và xem xét nghiêm túc.
                  </p>
                </motion.div>
              )}

              {/* SALARY MODAL (mobile) */}
              {showSalaryModal && (
                <div className="fixed inset-0 z-[95] grid place-items-center bg-black/40 px-4">
                  <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl ring-1 ring-slate-200">
                    <button
                      onClick={() => setShowSalaryModal(false)}
                      className="absolute right-4 top-3 text-lg font-bold text-slate-400 hover:text-slate-700"
                    >
                      ✕
                    </button>
                    <h2 className="mb-4 text-lg font-semibold">💰 Mức lương mong muốn?</h2>

                    <form className="space-y-3 text-left text-sm text-slate-700">
                      {salaryOptions.map((amount, index) => {
                        const isSafe = amount === "5tr";
                        const randomOffset = () => Math.floor(Math.random() * 100 - 50);
                        return (
                          <motion.label
                            key={index}
                            className="relative flex items-center gap-2 rounded-lg px-2 py-1"
                            animate={
                              jumpIndex === index
                                ? { x: randomOffset(), y: randomOffset() }
                                : { x: 0, y: 0 }
                            }
                            transition={{ type: "spring", stiffness: 300 }}
                            onMouseEnter={() => {
                              if (!isSafe) setJumpIndex(index);
                            }}
                            onMouseLeave={() => {
                              if (!isSafe) setJumpIndex(null);
                            }}
                          >
                            <input
                              type="radio"
                              name="salary"
                              value={amount}
                              checked={selectedSalary === amount}
                              onChange={() => {
                                if (isSafe) setSelectedSalary(amount);
                              }}
                              className="accent-sky-600"
                            />
                            <span>{amount}</span>
                          </motion.label>
                        );
                      })}
                    </form>

                    <div className="mt-6 flex justify-center">
                      <button
                        onClick={() => {
                          setStep(2);
                          setShowSalaryModal(false);
                        }}
                        disabled={!selectedSalary}
                        className={`rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm ${
                          selectedSalary
                            ? "bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                            : "cursor-not-allowed bg-slate-300"
                        }`}
                      >
                        Tiếp tục
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: nội dung + ảnh */}
              {step === 2 && (
                <motion.div
                  className="space-y-3"
                  key="m_step2"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                >
                  <h2 className="flex items-center justify-center text-center text-[15px] font-semibold text-slate-900">
                    <FaPenNib className="mr-2 text-sky-700" />
                    Ghi ý kiến
                    {selectedCategoryName?.includes("Kh") ? "" : ` về ${selectedCategoryName}`}
                  </h2>

                  <p className="text-center text-[11px] text-slate-500 px-1">
                    Xuống dòng / thụt lề được giữ nguyên khi gửi.
                  </p>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={7}
                    spellCheck={false}
                    className="
                      min-h-[160px] w-full resize-y rounded-2xl
                      border border-slate-300 bg-white
                      px-4 py-3 font-mono text-[13px] leading-relaxed text-slate-800
                      shadow-sm placeholder:text-slate-400
                      focus:outline-none focus:ring-2 focus:ring-sky-500/30
                      whitespace-pre-wrap
                    "
                    placeholder="Viết rõ ý kiến của bạn..."
                  />

                  <div className="text-left">
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      📎 Chọn hình ảnh (nếu có)
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                      className="
                        block w-full cursor-pointer text-sm text-slate-600
                        file:mr-4 file:rounded-full file:border-0
                        file:bg-sky-50 file:px-4 file:py-2
                        file:font-semibold file:text-sky-700
                        hover:file:bg-sky-100
                      "
                    />
                  </div>

                  {imagePreviews.length > 0 && (
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {imagePreviews.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt={`preview-${i}`}
                          className="h-24 w-full rounded-lg object-cover ring-1 ring-slate-200"
                        />
                      ))}
                    </div>
                  )}

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <button
                      onClick={() => setStep(1)}
                      className={`h-[52px] flex-1 rounded-2xl px-4 text-sm font-semibold ${btnSoft}`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <FaArrowLeft /> Quay lại
                      </span>
                    </button>

                    <button
                      onClick={() => setStep(3)}
                      className={`h-[52px] flex-1 rounded-2xl px-4 text-sm font-semibold ${btnPrimary}`}
                    >
                      Tiếp tục
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: hỏi liên hệ */}
              {step === 3 && (
                <motion.div
                  className="space-y-4"
                  key="m_step3"
                  initial={{ opacity: 0, x: -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-center text-[15px] font-semibold text-slate-900">
                    Bạn có muốn chúng tôi liên hệ lại?
                  </h2>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setWantContact(false);
                        handleSend();
                      }}
                      className="h-[52px] flex-1 rounded-2xl bg-amber-100 text-slate-900 border border-amber-200/70 font-semibold"
                    >
                      Không
                    </button>

                    <button
                      onClick={() => {
                        setWantContact(true);
                        setStep(4);
                      }}
                      className={`h-[52px] flex-1 rounded-2xl font-semibold ${btnPrimary}`}
                    >
                      Có
                    </button>
                  </div>

                  <button
                    onClick={() => setStep(2)}
                    className="w-full h-[48px] rounded-2xl bg-white/90 border border-slate-200 text-slate-700 font-semibold"
                  >
                    <span className="inline-flex items-center gap-2">
                      <FaArrowLeft /> Quay lại
                    </span>
                  </button>

                  <p className="pt-1 text-center text-xs italic text-slate-500">
                    🔒 Ý kiến của bạn sẽ được bảo mật và xem xét nghiêm túc.
                  </p>
                </motion.div>
              )}

              {/* STEP 4: thông tin liên hệ */}
              {step === 4 && (
                <motion.div
                  className="space-y-3"
                  key="m_step4"
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-center text-[15px] font-semibold text-slate-900">
                    Nhập thông tin liên hệ{" "}
                    <span className="font-normal italic text-slate-500">(không bắt buộc)</span>
                  </h2>

                  <input
                    placeholder="Họ và tên"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                    value={contactInfo.name}
                    onChange={(e) => setContactInfo({ ...contactInfo, name: e.target.value })}
                  />
                  <input
                    placeholder="Bộ phận làm việc"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                    value={contactInfo.department}
                    onChange={(e) =>
                      setContactInfo({ ...contactInfo, department: e.target.value })
                    }
                  />
                  <input
                    placeholder="Số điện thoại"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                  />

                  <button
                    onClick={() => {
                      setWantContact(true);
                      handleSend();
                    }}
                    className={`w-full h-[54px] rounded-2xl font-semibold ${btnPrimary}`}
                  >
                    💡 Gửi ý kiến ngay
                  </button>

                  <button
                    onClick={() => setStep(3)}
                    className="w-full h-[48px] rounded-2xl bg-white/90 border border-slate-200 text-slate-700 font-semibold"
                  >
                    <span className="inline-flex items-center gap-2">
                      <FaArrowLeft /> Quay lại
                    </span>
                  </button>
                </motion.div>
              )}

              {/* STEP 5: cảm ơn */}
              {step === 5 && (
                <motion.div
                  className="flex flex-col items-center justify-center text-center py-8"
                  key="m_step5"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <img src={textThanks} alt="thankyou" className="mb-4 w-44 drop-shadow" />
                  <p className="text-base font-semibold text-slate-800">
                    Cảm ơn bạn đã đóng góp ý kiến 💛
                  </p>
                  <button
                    onClick={() => setStep(0)}
                    className="mt-4 h-[48px] w-full rounded-2xl bg-white/90 border border-slate-200 text-slate-700 font-semibold"
                  >
                    Home
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Spacer để card không bị cắt ở đáy */}
      <div className="h-[170px]" />
    </div>
  );
}
