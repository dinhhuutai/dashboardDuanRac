import { useEffect, useState } from "react";
import logo from "~/assets/imgs/logoAdmin.png";
import textThanks from "~/assets/imgs/thankyou_transparent_centered.png";
import logoFeedback from "~/assets/imgs/logoFeedback.png";
import bg_page from '~/assets/imgs/bg_page_2.jpg';

import {
  FaHardHat, FaToilet, FaTools, FaBuilding, FaMoneyBill, FaQuestion,
  FaPenNib, FaArrowLeft, FaPaperPlane
} from "react-icons/fa";
import * as FaIcons from "react-icons/fa";
import { motion } from "framer-motion";
import { BASE_URL } from "~/config";
import axios from "axios";


function FeedbackFlow() {
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [step, setStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [wantContact, setWantContact] = useState(null);
  const [contactInfo, setContactInfo] = useState({ name: "", department: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/suggestions/categories`);
        if (res.data.success) {
          const formatted = res.data.data.map(item => {
  const IconComponent = FaIcons[item.icon] || FaIcons.FaQuestion;
  return {
    label: item.name,
    icon: <IconComponent />,
    suggestionCategorieId: item.suggestionCategorieId,
    
  };
});
          setCategories(formatted);
        } else {
          setModalMessage("Không thể tải danh mục");
        }
      } catch (error) {
        console.error("Lỗi khi tải danh mục:", error);
        setModalMessage("Có lỗi khi kết nối máy chủ");
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    setImagePreviews(files.map((file) => URL.createObjectURL(file)));
  };

  const handleSend = async () => {
    setLoading(true);
    const formData = new FormData();
    images.forEach((file) => formData.append("images", file));
    formData.append("suggestionCategorieId", selectedCategory);
    formData.append("content", feedback);
    formData.append("wantContact", wantContact);
    if (wantContact === true) {
      formData.append("sender_name", contactInfo.name);
      formData.append("sender_department", contactInfo.department);
      formData.append("sender_phone", contactInfo.phone);
    }

    try {
      const res = await fetch(`${BASE_URL}/api/suggestions/submit`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setStep(5);
      } else {
        setModalMessage("❌ Gửi góp ý thất bại!");
      }
    } catch (err) {
      console.error(err);
      setModalMessage("❌ Có lỗi xảy ra khi gửi.");
    } finally {
      
        setLoadingCategories(false);
        setSelectedCategory(null);
        setFeedback("");
        setImages([]);
        setImagePreviews([]);
        setWantContact(null);
        setContactInfo({ name: "", department: "", phone: "" });
        setLoading(false);
        setModalMessage("");
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5ff]">
      <div
  className="w-full border-2 border-purple-300 bg-white shadow-lg rounded-xl p-6 text-center m-4 flex flex-col justify-between transition-all duration-300 ease-in-out overflow-y-auto relative"
  style={{
    backgroundImage: `url('${bg_page}')`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    height: "calc(100vh - 6rem)",
  }}
>
        {loading && (
          <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-50">
            <div className="w-10 h-10 border-4 border-purple-300 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-sm text-gray-600">Đang gửi góp ý...</p>
          </div>
        )}

        {modalMessage && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl text-center shadow-xl max-w-sm">
              <p className="mb-4 text-gray-800 text-sm">{modalMessage}</p>
              <button onClick={() => setModalMessage("")} className="px-4 py-2 bg-purple-600 text-white rounded-full text-sm">Đóng</button>
            </div>
          </div>
        )}

        {/* ... toàn bộ phần UI các bước step 0 -> 5 không thay đổi ... */}

        {/* Logo + Header */}
        <div className="flex items-center space-x-2 mb-6 justify-center">
          <img src={logo} alt="Logo" className="w-6 h-6" />
          <h1 className="text-sm font-semibold text-gray-700">Công ty TNHH Thuận Hưng Long An</h1>
        </div>

        {step === 0 && (
  <motion.div
    className="flex flex-1 justify-center flex-col items-center text-center"
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
  >
    <img src={logoFeedback} alt="Mail animation" className="w-32 h-32 mb-4 animate-bounce" />
    <h2 className="text-xl font-bold text-purple-800 mb-3 flex items-center">
      📩 <span className="ml-2">HÒM THƯ GÓP Ý</span>
    </h2>
    <p className="text-sm text-gray-700 italic leading-relaxed">
      Chào bạn! Hãy thoải mái gửi ý kiến.<br />
      Trân trọng các bạn nhiều <span className="animate-pulse text-pink-500">💖</span>
    </p>
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setStep(1)}
      className="mt-6 bg-purple-600 text-white font-semibold px-6 py-2 rounded-full hover:bg-purple-700 transition"
    >
      Bắt đầu
    </motion.button>
  </motion.div>
)}



        {/* Step 1: Category */}
        {step === 1 && (
  <motion.div
    className="flex flex-1 justify-between flex-col text-center"
    key="step1"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    transition={{ duration: 0.5, ease: "easeOut" }}
  >
    <h2 className="text-lg font-bold text-black mb-3">
      📝 <span className="text-purple-700">Bạn muốn góp ý về:</span>
    </h2>

    {loadingCategories ? (
      <div className="text-gray-500 italic">⏳ Đang tải danh mục...</div>
    ) : (
      <div className="space-y-2">
        {categories.map((item, idx) => {
          const fromLeft = idx % 2 === 0;
          return (
            <motion.button
              key={idx}
              initial={{ x: fromLeft ? -80 : 80, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setSelectedCategory(item.suggestionCategorieId);
                setStep(2);
              }}
              className="w-full flex items-center justify-start space-x-2 border border-gray-300 bg-white rounded-full px-4 py-2 hover:bg-purple-100 text-sm text-gray-800"
            >
              <span className="text-purple-600">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </motion.button>
          );
        })}
      </div>
    )}

    <p className="text-xs text-gray-500 mt-6 italic">
      🔒 Ý kiến của bạn sẽ được bảo mật và xem xét nghiêm túc.
    </p>
  </motion.div>
)}


        {/* Step 2: Feedback + Images */}
        {step === 2 && (
  <motion.div
    className="flex flex-1 justify-between flex-col text-center"
    key="step2"
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -30 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
  >
    <h2 className="text-lg font-bold text-black mb-3 flex items-center justify-center">
      <FaPenNib className="text-purple-600 mr-2" />
      Ghi ý kiến của bạn:
    </h2>

    <textarea
      value={feedback}
      onChange={(e) => setFeedback(e.target.value)}
      rows={4}
      className="w-full outline-none border border-purple-300 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 min-h-[120px]"
      placeholder="Viết ngắn gọn ý kiến của bạn..."
    />

    <div className="mt-4 text-left">
      <label className="text-sm font-medium text-gray-700 mb-1">📎 Chọn hình ảnh (nếu có):</label>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200"
      />
    </div>

    {imagePreviews.length > 0 && (
      <div className="grid grid-cols-3 gap-2 mt-4">
        {imagePreviews.map((url, i) => (
          <img key={i} src={url} alt={`preview-${i}`} className="w-full h-24 object-cover rounded" />
        ))}
      </div>
    )}

    <div className="mt-4 flex justify-between">
      <button
        onClick={() => setStep(1)}
        className="flex items-center text-sm bg-gray-200 px-4 py-2 rounded-lg"
      >
        <FaArrowLeft className="mr-2" /> Quay lại
      </button>
      <button
        onClick={() => setStep(3)}
        className="flex items-center text-sm bg-green-500 text-white px-4 py-2 rounded-lg"
      >
        Tiếp tục
      </button>
    </div>
  </motion.div>
)}

        {/* Step 3: Ask contact */}
        {step === 3 && (
  <motion.div
    className="flex flex-1 mt-[50px] justify-between flex-col text-center"
    key="step3"
    initial={{ opacity: 0, x: -30 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 30 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
  >
    <h2 className="text-lg font-bold mb-6">Bạn có muốn chúng tôi liên hệ lại?</h2>
    <div className="flex justify-center gap-4">
      <button onClick={() => { setWantContact(false); handleSend(); }}
        className="bg-red-200 text-red-800 px-6 py-2 rounded-full font-semibold">
        Không cần nha
      </button>
      <button onClick={() => { setWantContact(true); setStep(4)}}
        className="bg-green-500 text-white px-6 py-2 rounded-full font-semibold">
        Có nha
      </button>
    </div>
    <div className="mt-4 flex justify-center">
      <button onClick={() => setStep(2)} className="flex items-center text-sm bg-gray-200 px-4 py-2 rounded-lg">
        <FaArrowLeft className="mr-2" /> Quay lại
      </button>
    </div>
    <p className="text-xs text-gray-500 mt-6 italic">
      🔒 Ý kiến của bạn sẽ được bảo mật và xem xét nghiêm túc.
    </p>
  </motion.div>
)}


        {/* Step 4: Contact Form */}
        {step === 4 && (
  <motion.div
    className="flex flex-1 mt-[50px] justify-between flex-col text-center"
    key="step4"
    initial={{ opacity: 0, x: 30 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -30 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
  >
    <h2 className="text-md font-bold mb-4">
      Nhập thông tin liên hệ <span className="italic font-normal">(không bắt buộc)</span>:
    </h2>
    <input placeholder="Họ và tên" className="w-full border border-purple-300 rounded-full px-4 py-2 text-sm mb-3 placeholder:text-purple-400"
      value={contactInfo.name} onChange={(e) => setContactInfo({ ...contactInfo, name: e.target.value })}
    />
    <input placeholder="Bộ phận làm việc" className="w-full border border-purple-300 rounded-full px-4 py-2 text-sm mb-3 placeholder:text-purple-400"
      value={contactInfo.department} onChange={(e) => setContactInfo({ ...contactInfo, department: e.target.value })}
    />
    <input placeholder="Số điện thoại" className="w-full border border-purple-300 rounded-full px-4 py-2 text-sm mb-3 placeholder:text-purple-400"
      value={contactInfo.phone} onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
    />
    <button onClick={() => { setWantContact(true); handleSend(); }}
      className="bg-green-500 hover:bg-green-600 text-white w-full py-2 rounded-full font-semibold">
      💡 Gửi ý kiến ngay
    </button>
    <div className="mt-4 flex justify-center">
      <button onClick={() => setStep(3)} className="flex items-center text-sm bg-gray-200 px-4 py-2 rounded-lg">
        <FaArrowLeft className="mr-2" /> Quay lại
      </button>
    </div>
  </motion.div>
)}


        {/* Step 5: Thank you */}
        {step === 5 && (
  <motion.div
    className="flex flex-1 mt-[50px] justify-between flex-col text-center"
    key="step5"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
  >
    <img src={textThanks} alt="thankyou" className="mx-auto w-40 mb-4" />
    <p className="text-md font-semibold text-gray-800">Cảm ơn bạn đã đóng góp ý kiến 💖</p>
    <div className="mt-4 flex justify-center">
      <button onClick={() => setStep(0)} className="flex items-center text-sm bg-gray-200 px-4 py-2 rounded-lg">
        Home
      </button>
    </div>
  </motion.div>
)}

      </div>
    </div>
  );
}

export default FeedbackFlow;

