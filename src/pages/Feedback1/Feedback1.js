// import { useEffect, useState } from "react";
// import logo from "~/assets/imgs/logoAdmin.png";
// import textThanks from "~/assets/imgs/thankyou_transparent_centered.png";
// import logoFeedback from "~/assets/imgs/logoFeedback.png";
// import bg_page from '~/assets/imgs/bg_page_3.png';

// import {
//   FaHardHat, FaToilet, FaTools, FaBuilding, FaMoneyBill, FaQuestion,
//   FaPenNib, FaArrowLeft, FaPaperPlane
// } from "react-icons/fa";
// import * as FaIcons from "react-icons/fa";
// import { motion } from "framer-motion";
// import { BASE_URL } from "~/config";
// import axios from "axios";
// import http from '~/api/http';


// function FeedbackFlow() {
//   const [categories, setCategories] = useState([]);
//   const [loadingCategories, setLoadingCategories] = useState(true);
//   const [step, setStep] = useState(0);
//   const [selectedCategory, setSelectedCategory] = useState(null);
//   const [selectedCategoryName, setSelectedCategoryName] = useState(null);
//   const [feedback, setFeedback] = useState("");
//   const [images, setImages] = useState([]);
//   const [imagePreviews, setImagePreviews] = useState([]);
//   const [wantContact, setWantContact] = useState(null);
//   const [contactInfo, setContactInfo] = useState({ name: "", department: "", phone: "" });
//   const [loading, setLoading] = useState(false);
//   const [modalMessage, setModalMessage] = useState("");

//   const [showSalaryModal, setShowSalaryModal] = useState(false);
//   const [selectedSalary, setSelectedSalary] = useState("");
//   const [jumpIndex, setJumpIndex] = useState(null); // để xác định radio đang nhảy
//   const salaryOptions = ["5tr", "15tr", "20tr", "50tr"];

//   useEffect(() => {
//     const fetchCategories = async () => {
//       try {
//         const res = await http.get(`${BASE_URL}/api/suggestions/categories`);
//         if (res.data.success) {
//           const formatted = res.data.data.map(item => {
//   const IconComponent = FaIcons[item.icon] || FaIcons.FaQuestion;
//   return {
//     label: item.name,
//     icon: <IconComponent />,
//     suggestionCategorieId: item.suggestionCategorieId,
    
//   };
// });
//           setCategories(formatted);
//         } else {
//           setModalMessage("Không thể tải danh mục");
//         }
//       } catch (error) {
//         console.error("Lỗi khi tải danh mục:", error);
//         setModalMessage("Có lỗi khi kết nối máy chủ");
//       } finally {
//         setLoadingCategories(false);
//       }
//     };

//     fetchCategories();
//   }, []);

//   const handleFileChange = (e) => {
//     const files = Array.from(e.target.files);
//     setImages(files);
//     setImagePreviews(files.map((file) => URL.createObjectURL(file)));
//   };

//   const handleSend = async () => {
//     setLoading(true);
//     const formData = new FormData();
//     images.forEach((file) => formData.append("images", file));
//     formData.append("suggestionCategorieId", selectedCategory);
//     formData.append("content", feedback);
//     formData.append("wantContact", wantContact);
//     if (wantContact === true) {
//       formData.append("sender_name", contactInfo.name);
//       formData.append("sender_department", contactInfo.department);
//       formData.append("sender_phone", contactInfo.phone);
//     }

//     try {
//       const res = await http.post("/api/suggestions/submit", formData);

//       const data = await res.data;
//       if (data.success) {
//         setStep(5);
//       } else {
//         setModalMessage("❌ Gửi góp ý thất bại!");
//       }
//     } catch (err) {
//       console.error(err);
//       setModalMessage("❌ Có lỗi xảy ra khi gửi.");
//     } finally {
      
//         setLoadingCategories(false);
//         setSelectedCategory(null);
//         setFeedback("");
//         setImages([]);
//         setImagePreviews([]);
//         setWantContact(null);
//         setContactInfo({ name: "", department: "", phone: "" });
//         setLoading(false);
//         setModalMessage("");
//         setLoading(false);
//     }
//   };

//   return (
//   <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-pink-50">
//     <div
//       className="relative w-full max-w-3xl h-[calc(100vh-4rem)] mx-4 rounded-3xl shadow-xl ring-1 ring-slate-200/70 overflow-hidden backdrop-blur-xl bg-white/80"
//       style={{
//         backgroundImage: `url('${bg_page}')`,
//         backgroundSize: "cover",
//         backgroundPosition: "center",
//         backgroundRepeat: "no-repeat",
//       }}
//     >
//       {/* Loading overlay */}
//       {loading && (
//         <div className="absolute inset-0 z-50 grid place-items-center bg-white/70 backdrop-blur-sm">
//           <div className="flex flex-col items-center gap-2">
//             <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-300 border-t-transparent" />
//             <p className="text-sm text-slate-600">Đang gửi góp ý...</p>
//           </div>
//         </div>
//       )}

//       {/* Modal thông báo */}
//       {modalMessage && (
//         <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40">
//           <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl ring-1 ring-slate-200">
//             <p className="mb-4 text-sm text-slate-800">{modalMessage}</p>
//             <button
//               onClick={() => setModalMessage("")}
//               className="rounded-full bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
//             >
//               Đóng
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Top bar */}
//       <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-white/70 px-5 py-3 backdrop-blur-md ring-1 ring-inset ring-white/20">
//         <div className="flex items-center gap-2">
//           <img src={logo} alt="Logo" className="h-7 w-7 rounded-md ring-1 ring-slate-200" />
//           <h1 className="text-sm font-semibold text-slate-800">Công ty TNHH Thuận Hưng Long An</h1>
//         </div>
//         {/* Tiến độ (đơn giản): */}
//         <div className="hidden sm:block w-40 h-2 rounded-full bg-slate-200/70 overflow-hidden">
//           <div
//             className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all"
//             style={{
//               width: `${([0, 25, 50, 70, 90, 100][step] ?? 0)}%`,
//             }}
//           />
//         </div>
//       </div>

//       {/* Nội dung cuộn được */}
//       <div className="h-[calc(100%-56px)] overflow-y-auto px-6 py-6">
//         {/* Step 0: Intro */}
//         {step === 0 && (
//           <motion.div
//             className="flex min-h-[60vh] flex-col items-center justify-center text-center"
//             initial={{ opacity: 0, y: 30 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.6 }}
//           >
//             <img
//               src={logoFeedback}
//               alt="Mail animation"
//               className="mb-5 h-28 w-28 animate-bounce drop-shadow-sm"
//             />
//             <h2 className="mb-2 flex items-center text-xl font-bold text-purple-700">
//               📩 <span className="ml-2 text-slate-900">Hòm thư góp ý</span>
//             </h2>
//             <p className="max-w-md text-sm leading-relaxed text-slate-700">
//               Chào bạn! Hãy thoải mái gửi ý kiến.
//               <br />
//               Trân trọng các bạn nhiều <span className="animate-pulse text-pink-500">💖</span>
//             </p>
//             <motion.button
//               whileHover={{ scale: 1.05 }}
//               whileTap={{ scale: 0.97 }}
//               onClick={() => setStep(1)}
//               className="mt-6 rounded-full bg-purple-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
//             >
//               Bắt đầu
//             </motion.button>
//           </motion.div>
//         )}

//         {/* Step 1: Chọn danh mục */}
//         {step === 1 && (
//           <motion.div
//             className="space-y-4"
//             key="step1"
//             initial={{ opacity: 0, scale: 0.97 }}
//             animate={{ opacity: 1, scale: 1 }}
//             transition={{ duration: 0.4, ease: "easeOut" }}
//           >
//             <h2 className="mb-2 text-center text-lg font-semibold">
//               📝 <span className="text-purple-700">Bạn muốn góp ý về:</span>
//             </h2>

//             {loadingCategories ? (
//               <div className="py-10 text-center text-slate-500">⏳ Đang tải danh mục...</div>
//             ) : (
//               <div className="grid grid-cols-1 gap-2">
//                 {categories.map((item, idx) => {
//                   const fromLeft = idx % 2 === 0;
//                   return (
//                     <motion.button
//                       key={idx}
//                       initial={{ x: fromLeft ? -80 : 80, opacity: 0 }}
//                       animate={{ x: 0, opacity: 1 }}
//                       transition={{ duration: 0.35, delay: idx * 0.03 }}
//                       whileHover={{ scale: 1.02 }}
//                       whileTap={{ scale: 0.98 }}
//                       onClick={() => {
//                         setSelectedCategory(item.suggestionCategorieId);
//                         setSelectedCategoryName(item.label);
//                         if (item.label.toLowerCase().includes("lương")) {
//                           setShowSalaryModal(true);
//                         } else {
//                           setStep(2);
//                         }
//                       }}
//                       className="group flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-800 shadow-sm transition-colors hover:bg-indigo-50"
//                     >
//                       <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-200 group-hover:bg-indigo-100">
//                         {item.icon}
//                       </span>
//                       <span className="font-medium">{item.label}</span>
//                     </motion.button>
//                   );
//                 })}
//               </div>
//             )}

//             <p className="pt-2 text-center text-xs italic text-slate-500">
//               🔒 Ý kiến của bạn sẽ được bảo mật và xem xét nghiêm túc.
//             </p>
//           </motion.div>
//         )}

//         {/* Modal chọn lương (giữ logic, style lại) */}
//         {showSalaryModal && (
//           <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
//             <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl ring-1 ring-slate-200">
//               <button
//                 onClick={() => setShowSalaryModal(false)}
//                 className="absolute right-4 top-3 text-lg font-bold text-slate-400 hover:text-slate-700"
//               >
//                 ✕
//               </button>
//               <h2 className="mb-4 text-lg font-semibold">💰 Mức lương mong muốn của bạn?</h2>
//               <form className="space-y-3 text-left text-sm text-slate-700">
//                 {salaryOptions.map((amount, index) => {
//                   const isSafe = amount === "5tr";
//                   const randomOffset = () => Math.floor(Math.random() * 100 - 50);
//                   return (
//                     <motion.label
//                       key={index}
//                       className="relative flex items-center gap-2 rounded-lg px-2 py-1"
//                       animate={
//                         jumpIndex === index
//                           ? { x: randomOffset(), y: randomOffset() }
//                           : { x: 0, y: 0 }
//                       }
//                       transition={{ type: "spring", stiffness: 300 }}
//                       onMouseEnter={() => {
//                         if (!isSafe) setJumpIndex(index);
//                       }}
//                       onMouseLeave={() => {
//                         if (!isSafe) setJumpIndex(null);
//                       }}
//                     >
//                       <input
//                         type="radio"
//                         name="salary"
//                         value={amount}
//                         checked={selectedSalary === amount}
//                         onChange={() => {
//                           if (isSafe) setSelectedSalary(amount);
//                         }}
//                         className="accent-purple-600"
//                       />
//                       <span>{amount}</span>
//                     </motion.label>
//                   );
//                 })}
//               </form>
//               <div className="mt-6 flex justify-center">
//                 <button
//                   onClick={() => {
//                     setStep(2);
//                     setShowSalaryModal(false);
//                   }}
//                   disabled={!selectedSalary}
//                   className={`rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm ${
//                     selectedSalary
//                       ? "bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
//                       : "cursor-not-allowed bg-slate-300"
//                   }`}
//                 >
//                   Tiếp tục
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Step 2: Nội dung + ảnh */}
//         {step === 2 && (
//           <motion.div
//             className="space-y-4"
//             key="step2"
//             initial={{ opacity: 0, y: 30 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.4, ease: "easeOut" }}
//           >
//             <h2 className="flex items-center justify-center text-center text-lg font-semibold text-slate-900">
//               <FaPenNib className="mr-2 text-purple-600" />
//               Ghi ý kiến của bạn
//               {selectedCategoryName?.includes("Kh") ? "" : ` về ${selectedCategoryName}`}
//             </h2>

//             <textarea
//               value={feedback}
//               onChange={(e) => setFeedback(e.target.value)}
//               rows={5}
//               className="min-h-[140px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
//               placeholder="Viết rõ ý kiến của bạn..."
//             />

//             <div className="text-left">
//               <label className="mb-1 block text-sm font-medium text-slate-700">
//                 📎 Chọn hình ảnh (nếu có)
//               </label>
//               <input
//                 type="file"
//                 multiple
//                 accept="image/*"
//                 onChange={handleFileChange}
//                 className="block w-full cursor-pointer text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-purple-50 file:px-4 file:py-2 file:font-semibold file:text-purple-700 hover:file:bg-purple-100"
//               />
//             </div>

//             {imagePreviews.length > 0 && (
//               <div className="mt-3 grid grid-cols-3 gap-2">
//                 {imagePreviews.map((url, i) => (
//                   <img
//                     key={i}
//                     src={url}
//                     alt={`preview-${i}`}
//                     className="h-24 w-full rounded-lg object-cover ring-1 ring-slate-200"
//                   />
//                 ))}
//               </div>
//             )}

//             <div className="mt-4 flex items-center justify-between">
//               <button
//                 onClick={() => setStep(1)}
//                 className="inline-flex items-center rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200"
//               >
//                 <FaArrowLeft className="mr-2" /> Quay lại
//               </button>
//               <button
//                 onClick={() => setStep(3)}
//                 className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
//               >
//                 Tiếp tục
//               </button>
//             </div>
//           </motion.div>
//         )}

//         {/* Step 3: Hỏi liên hệ */}
//         {step === 3 && (
//           <motion.div
//             className="space-y-5"
//             key="step3"
//             initial={{ opacity: 0, x: -30 }}
//             animate={{ opacity: 1, x: 0 }}
//             transition={{ duration: 0.35, ease: "easeOut" }}
//           >
//             <h2 className="text-center text-lg font-semibold text-slate-900">
//               Bạn có muốn chúng tôi liên hệ lại?
//             </h2>
//             <div className="flex justify-center gap-4">
//               <button
//                 onClick={() => {
//                   setWantContact(false);
//                   handleSend();
//                 }}
//                 className="rounded-full bg-rose-100 px-6 py-2 text-sm font-semibold text-rose-700 ring-1 ring-inset ring-rose-200 hover:bg-rose-200"
//               >
//                 Không
//               </button>
//               <button
//                 onClick={() => {
//                   setWantContact(true);
//                   setStep(4);
//                 }}
//                 className="rounded-full bg-emerald-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
//               >
//                 Có
//               </button>
//             </div>
//             <div className="flex justify-center">
//               <button
//                 onClick={() => setStep(2)}
//                 className="inline-flex items-center rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200"
//               >
//                 <FaArrowLeft className="mr-2" /> Quay lại
//               </button>
//             </div>
//             <p className="pt-2 text-center text-xs italic text-slate-500">
//               🔒 Ý kiến của bạn sẽ được bảo mật và xem xét nghiêm túc.
//             </p>
//           </motion.div>
//         )}

//         {/* Step 4: Thông tin liên hệ */}
//         {step === 4 && (
//           <motion.div
//             className="space-y-4"
//             key="step4"
//             initial={{ opacity: 0, x: 30 }}
//             animate={{ opacity: 1, x: 0 }}
//             transition={{ duration: 0.35, ease: "easeOut" }}
//           >
//             <h2 className="text-center text-lg font-semibold text-slate-900">
//               Nhập thông tin liên hệ{" "}
//               <span className="font-normal italic text-slate-500">(không bắt buộc)</span>
//             </h2>
//             <input
//               placeholder="Họ và tên"
//               className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
//               value={contactInfo.name}
//               onChange={(e) => setContactInfo({ ...contactInfo, name: e.target.value })}
//             />
//             <input
//               placeholder="Bộ phận làm việc"
//               className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
//               value={contactInfo.department}
//               onChange={(e) => setContactInfo({ ...contactInfo, department: e.target.value })}
//             />
//             <input
//               placeholder="Số điện thoại"
//               className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
//               value={contactInfo.phone}
//               onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
//             />

//             <button
//               onClick={() => {
//                 setWantContact(true);
//                 handleSend();
//               }}
//               className="w-full rounded-full bg-emerald-600 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
//             >
//               💡 Gửi ý kiến ngay
//             </button>

//             <div className="flex justify-center">
//               <button
//                 onClick={() => setStep(3)}
//                 className="mt-1 inline-flex items-center rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200"
//               >
//                 <FaArrowLeft className="mr-2" /> Quay lại
//               </button>
//             </div>
//           </motion.div>
//         )}

//         {/* Step 5: Cảm ơn */}
//         {step === 5 && (
//           <motion.div
//             className="flex min-h-[50vh] flex-col items-center justify-center text-center"
//             key="step5"
//             initial={{ opacity: 0, scale: 0.97 }}
//             animate={{ opacity: 1, scale: 1 }}
//             transition={{ duration: 0.35, ease: "easeOut" }}
//           >
//             <img src={textThanks} alt="thankyou" className="mb-4 w-44 drop-shadow" />
//             <p className="text-base font-semibold text-slate-800">
//               Cảm ơn bạn đã đóng góp ý kiến 💖
//             </p>
//             <button
//               onClick={() => setStep(0)}
//               className="mt-4 inline-flex items-center rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200"
//             >
//               Home
//             </button>
//           </motion.div>
//         )}
//       </div>
//     </div>
//   </div>
// );
  
// }

// export default FeedbackFlow;




// src/pages/Home/FeedbackFlow.jsx
import { useEffect, useState } from "react";
import logo from "~/assets/imgs/logoAdmin.png";
import textThanks from "~/assets/imgs/thankyou_transparent_centered.png";
import logoFeedback from "~/assets/imgs/logoFeedback.png";
import bg_page from "~/assets/imgs/bg_page_3.png";

import * as FaIcons from "react-icons/fa";
import { motion } from "framer-motion";
import config, { BASE_URL } from "~/config";
import http from "~/api/http";
import { useNavigate } from "react-router-dom";

// mobile component
import MobileFeedbackFlow from "./sectión/MobileFeedbackFlow";

// Desktop icons you used
import { FaArrowLeft, FaPenNib } from "react-icons/fa";
import { useSelector } from "react-redux";
import { userSelector } from "~/redux/selectors";

const fullName = "bạn";

function FeedbackFlow() {
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [step, setStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState(null);

  const [feedback, setFeedback] = useState("");
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [wantContact, setWantContact] = useState(null);
  const [contactInfo, setContactInfo] = useState({ name: "", department: "", phone: "" });

  const [loading, setLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  // Salary modal state
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState("");
  const [jumpIndex, setJumpIndex] = useState(null);
  const salaryOptions = ["5tr", "15tr", "20tr", "50tr"];

  const tmp = useSelector(userSelector);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await http.get(`${BASE_URL}/api/suggestions/categories`);
        if (res.data.success) {
          const formatted = res.data.data.map((item) => {
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
      const res = await http.post("/api/suggestions/submit", formData);
      const data = await res.data;
      if (data.success) setStep(5);
      else setModalMessage("❌ Gửi góp ý thất bại!");
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
    }
  };

  return (
    <>
      {/* ===================== MOBILE ===================== */}
      {
        tmp?.login?.currentUser?.fullName &&
        <MobileFeedbackFlow
          tmp={tmp}
          logo={logo}
          logoFeedback={logoFeedback}
          textThanks={textThanks}
          step={step}
          setStep={setStep}
          categories={categories}
          loadingCategories={loadingCategories}
          selectedCategoryName={selectedCategoryName}
          setSelectedCategory={setSelectedCategory}
          setSelectedCategoryName={setSelectedCategoryName}
          showSalaryModal={showSalaryModal}
          setShowSalaryModal={setShowSalaryModal}
          salaryOptions={salaryOptions}
          selectedSalary={selectedSalary}
          setSelectedSalary={setSelectedSalary}
          jumpIndex={jumpIndex}
          setJumpIndex={setJumpIndex}
          feedback={feedback}
          setFeedback={setFeedback}
          handleFileChange={handleFileChange}
          imagePreviews={imagePreviews}
          wantContact={wantContact}
          setWantContact={setWantContact}
          contactInfo={contactInfo}
          setContactInfo={setContactInfo}
          handleSend={handleSend}
          navigate={navigate}
          config={config}
          loading={loading}
          modalMessage={modalMessage}
          setModalMessage={setModalMessage}
        />
      }

      {/* ===================== DESKTOP (GIỮ LAYOUT CŨ) ===================== */}
      <div className={`${tmp?.login?.currentUser?.fullName ? 'md:flex hidden' : 'flex'} min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-pink-50`}>
        <div
          className="relative w-full max-w-3xl h-[calc(100vh-4rem)] mx-4 rounded-3xl shadow-xl ring-1 ring-slate-200/70 overflow-hidden backdrop-blur-xl bg-white/80"
          style={{
            backgroundImage: `url('${bg_page}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 z-50 grid place-items-center bg-white/70 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-300 border-t-transparent" />
                <p className="text-sm text-slate-600">Đang gửi góp ý...</p>
              </div>
            </div>
          )}

          {/* Modal thông báo */}
          {modalMessage && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl ring-1 ring-slate-200">
                <p className="mb-4 text-sm text-slate-800">{modalMessage}</p>
                <button
                  onClick={() => setModalMessage("")}
                  className="rounded-full bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                >
                  Đóng
                </button>
              </div>
            </div>
          )}

          {/* Desktop top bar (giữ nguyên của bạn) */}
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-white/70 px-5 py-3 backdrop-blur-md ring-1 ring-inset ring-white/20">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Logo" className="h-7 w-7 rounded-md ring-1 ring-slate-200" />
              <h1 className="text-sm font-semibold text-slate-800">
                Công ty TNHH Thuận Hưng Long An
              </h1>
            </div>

            <div className={`${tmp?.login?.currentUser?.fullName ? 'sm:block hidden' : 'flex'} w-40 h-2 rounded-full bg-slate-200/70 overflow-hidden`}>
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all"
                style={{ width: `${([0, 25, 50, 70, 90, 100][step] ?? 0)}%` }}
              />
            </div>
          </div>

          {/* Desktop body scroll (bạn copy tiếp step UI cũ vào đây nếu muốn giữ 100% giống) */}
          <div className="h-[calc(100%-56px)] overflow-y-auto px-6 py-6">
            {/* Ví dụ: Step 0 (để file chạy ngay). Các step khác bạn có thể giữ nguyên như trước. */}
            {step === 0 && (
              <motion.div
                className="flex min-h-[60vh] flex-col items-center justify-center text-center"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <img
                  src={logoFeedback}
                  alt="Mail animation"
                  className="mb-5 h-28 w-28 animate-bounce drop-shadow-sm"
                />
                <h2 className="mb-2 flex items-center text-xl font-bold text-purple-700">
                  📩 <span className="ml-2 text-slate-900">Hòm thư góp ý</span>
                </h2>
                <p className="max-w-md text-sm leading-relaxed text-slate-700">
                  Chào bạn! Hãy thoải mái gửi ý kiến.
                  <br />
                  Trân trọng các bạn nhiều <span className="animate-pulse text-pink-500">💖</span>
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setStep(1)}
                  className="mt-6 rounded-full bg-purple-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                >
                  Bắt đầu
                </motion.button>
              </motion.div>
            )}

         {step === 1 && (
          <motion.div
            className="space-y-4"
            key="step1"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <h2 className="mb-2 text-center text-lg font-semibold">
              📝 <span className="text-purple-700">Bạn muốn góp ý về:</span>
            </h2>

            {loadingCategories ? (
              <div className="py-10 text-center text-slate-500">⏳ Đang tải danh mục...</div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {categories.map((item, idx) => {
                  const fromLeft = idx % 2 === 0;
                  return (
                    <motion.button
                      key={idx}
                      initial={{ x: fromLeft ? -80 : 80, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.35, delay: idx * 0.03 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
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
                      className="group flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-800 shadow-sm transition-colors hover:bg-indigo-50"
                    >
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-200 group-hover:bg-indigo-100">
                        {item.icon}
                      </span>
                      <span className="font-medium">{item.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            )}

            <p className="pt-2 text-center text-xs italic text-slate-500">
              🔒 Ý kiến của bạn sẽ được bảo mật và xem xét nghiêm túc.
            </p>
          </motion.div>
        )}

        {/* Modal chọn lương (giữ logic, style lại) */}
        {showSalaryModal && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
            <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl ring-1 ring-slate-200">
              <button
                onClick={() => setShowSalaryModal(false)}
                className="absolute right-4 top-3 text-lg font-bold text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
              <h2 className="mb-4 text-lg font-semibold">💰 Mức lương mong muốn của bạn?</h2>
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
                        className="accent-purple-600"
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
                      ? "bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                      : "cursor-not-allowed bg-slate-300"
                  }`}
                >
                  Tiếp tục
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Nội dung + ảnh */}
        {step === 2 && (
          <motion.div
            className="space-y-4"
            key="step2"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <h2 className="flex items-center justify-center text-center text-lg font-semibold text-slate-900">
              <FaPenNib className="mr-2 text-purple-600" />
              Ghi ý kiến của bạn
              {selectedCategoryName?.includes("Kh") ? "" : ` về ${selectedCategoryName}`}
            </h2>

            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={5}
              className="min-h-[140px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
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
                className="block w-full cursor-pointer text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-purple-50 file:px-4 file:py-2 file:font-semibold file:text-purple-700 hover:file:bg-purple-100"
              />
            </div>

            {imagePreviews.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
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

             <div className="mt-4 flex items-center justify-between">
               <button
                onClick={() => setStep(1)}
                className="inline-flex items-center rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200"
              >
                <FaArrowLeft className="mr-2" /> Quay lại
              </button>
              <button
                onClick={() => setStep(3)}
                className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              >
                Tiếp tục
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Hỏi liên hệ */}
        {step === 3 && (
          <motion.div
            className="space-y-5"
            key="step3"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <h2 className="text-center text-lg font-semibold text-slate-900">
              Bạn có muốn chúng tôi liên hệ lại?
            </h2>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  setWantContact(false);
                  handleSend();
                }}
                className="rounded-full bg-rose-100 px-6 py-2 text-sm font-semibold text-rose-700 ring-1 ring-inset ring-rose-200 hover:bg-rose-200"
              >
                Không
              </button>
              <button
                onClick={() => {
                  setWantContact(true);
                  setStep(4);
                }}
                className="rounded-full bg-emerald-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              >
                Có
              </button>
            </div>
            <div className="flex justify-center">
              <button
                onClick={() => setStep(2)}
                className="inline-flex items-center rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200"
              >
                <FaArrowLeft className="mr-2" /> Quay lại
              </button>
            </div>
            <p className="pt-2 text-center text-xs italic text-slate-500">
              🔒 Ý kiến của bạn sẽ được bảo mật và xem xét nghiêm túc.
            </p>
          </motion.div>
        )}

        {/* Step 4: Thông tin liên hệ */}
        {step === 4 && (
          <motion.div
            className="space-y-4"
            key="step4"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <h2 className="text-center text-lg font-semibold text-slate-900">
              Nhập thông tin liên hệ{" "}
              <span className="font-normal italic text-slate-500">(không bắt buộc)</span>
            </h2>
            <input
              placeholder="Họ và tên"
              className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              value={contactInfo.name}
              onChange={(e) => setContactInfo({ ...contactInfo, name: e.target.value })}
            />
            <input
              placeholder="Bộ phận làm việc"
              className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              value={contactInfo.department}
              onChange={(e) => setContactInfo({ ...contactInfo, department: e.target.value })}
            />
            <input
              placeholder="Số điện thoại"
              className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              value={contactInfo.phone}
              onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
            />

            <button
              onClick={() => {
                setWantContact(true);
                handleSend();
              }}
              className="w-full rounded-full bg-emerald-600 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            >
              💡 Gửi ý kiến ngay
            </button>

            <div className="flex justify-center">
              <button
                onClick={() => setStep(3)}
                className="mt-1 inline-flex items-center rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200"
              >
                <FaArrowLeft className="mr-2" /> Quay lại
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 5: Cảm ơn */}
        {step === 5 && (
          <motion.div
            className="flex min-h-[50vh] flex-col items-center justify-center text-center"
            key="step5"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <img src={textThanks} alt="thankyou" className="mb-4 w-44 drop-shadow" />
            <p className="text-base font-semibold text-slate-800">
              Cảm ơn bạn đã đóng góp ý kiến 💖
            </p>
            <button
              onClick={() => setStep(0)}
              className="mt-4 inline-flex items-center rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200"
            >
              Home
            </button>
          </motion.div>
        )}
          </div>
        </div>
      </div>
    </>
  );
}

export default FeedbackFlow;
