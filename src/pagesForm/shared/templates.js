// Mẫu biểu mẫu dựng sẵn. Họ tên / MSNV / phòng ban / chức danh KHÔNG cần tạo câu hỏi —
// hệ thống tự lấy từ hồ sơ người nộp và đưa vào thống kê + file Excel.
import { uid } from "./questionTypes";

const o = (...labels) => labels.map((label) => ({ id: uid("o"), label }));
const q = (type, label, extra = {}) => ({ questionKey: uid("q"), type, label, description: "", isRequired: false, settings: {}, ...extra });

function aiSurvey() {
  const useAi = q("yes_no", "Hiện đang sử dụng AI trong công việc?", { isRequired: true, settings: { yesLabel: "Có", noLabel: "Không" } });
  const whenYes = { questionKey: useAi.questionKey, op: "eq", value: "yes" };
  return {
    title: "Phiếu khảo sát hiện trạng sử dụng AI trong công việc",
    description: "Mục đích: Ghi nhận công cụ AI đang sử dụng, chi phí và mức độ cải tiến/hiệu quả mang lại trong công việc.",
    questions: [
      useAi,
      q("multiple_choice", "Tên AI đang dùng", {
        isRequired: true,
        settings: { options: o("ChatGPT", "Gemini", "Claude", "Microsoft Copilot", "DeepSeek", "Perplexity", "Grok"), allowOther: true, showIf: whenYes },
      }),
      q("single_choice", "Gói đang dùng", {
        isRequired: true,
        settings: { options: o("Miễn phí", "Plus / Pro (trả phí cá nhân)", "Team / Business", "Enterprise"), allowOther: true, showIf: whenYes },
      }),
      q("currency", "Chi phí AI/tháng", {
        description: "Nhập 0 nếu dùng bản miễn phí",
        settings: { min: 0, unit: "VNĐ", showIf: whenYes },
      }),
      q("single_choice", "Chi phí do ai chi trả?", {
        settings: { options: o("Cá nhân", "Công ty", "Không tốn phí"), showIf: whenYes },
      }),
      q("single_choice", "Tần suất sử dụng", {
        isRequired: true,
        settings: { options: o("Hằng ngày", "Vài lần mỗi tuần", "Vài lần mỗi tháng", "Hiếm khi"), showIf: whenYes },
      }),
      q("long_text", "Công việc / mục đích sử dụng chính", {
        isRequired: true,
        settings: { placeholder: "Ví dụ: phân tích lỗi kỹ thuật, tổng hợp dữ liệu, làm báo cáo…", showIf: whenYes },
      }),
      q("long_text", "Hiệu quả / cải tiến mang lại trong công việc", {
        settings: { placeholder: "Ví dụ: tiết kiệm thời gian tìm thông tin, báo cáo nhanh hơn…", showIf: whenYes },
      }),
    ],
  };
}

function satisfaction() {
  return {
    title: "Khảo sát mức độ hài lòng",
    description: "Ý kiến của anh/chị giúp công ty cải thiện môi trường làm việc.",
    questions: [
      q("rating", "Mức độ hài lòng chung", { isRequired: true, settings: { max: 5 } }),
      q("linear_scale", "Anh/chị có sẵn sàng giới thiệu công ty cho người quen?", {
        settings: { min: 0, max: 10, minLabel: "Chắc chắn không", maxLabel: "Chắc chắn có" },
      }),
      q("multiple_choice", "Điều anh/chị hài lòng nhất", {
        settings: { options: o("Thu nhập", "Đồng nghiệp", "Quản lý trực tiếp", "Môi trường làm việc", "Cơ hội học hỏi"), allowOther: true },
      }),
      q("long_text", "Góp ý để công ty cải thiện"),
    ],
  };
}

function registration() {
  return {
    title: "Đăng ký tham gia",
    description: "Đăng ký tham gia chương trình / sự kiện.",
    questions: [
      q("yes_no", "Anh/chị có tham gia không?", { isRequired: true }),
      q("number", "Số người đi cùng", { settings: { min: 0, max: 10, unit: "người" } }),
      q("short_text", "Số điện thoại liên hệ", { settings: { inputKind: "phone" } }),
      q("long_text", "Ghi chú"),
    ],
  };
}

export const TEMPLATES = [
  { key: "blank", name: "Biểu mẫu trống", hint: "Tự thêm câu hỏi", build: () => ({ title: "", description: "", questions: [] }) },
  { key: "ai", name: "Khảo sát sử dụng AI", hint: "8 câu, tự bỏ qua khi không dùng AI", build: aiSurvey },
  { key: "satisfaction", name: "Mức độ hài lòng", hint: "Đánh giá sao, thang điểm, góp ý", build: satisfaction },
  { key: "registration", name: "Đăng ký tham gia", hint: "Có/Không, số người, liên hệ", build: registration },
];
