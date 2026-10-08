// Mẫu đề xuất dựng sẵn — admin chọn rồi sửa. Bước duyệt "Người cụ thể" để trống: admin phải chọn người trước khi lưu.
import { uid } from "~/pagesRequest/shared/fieldTypes";

const opt = (...labels) => labels.map((label) => ({ id: uid("o"), label }));
const f = (type, label, extra = {}) => ({ key: uid("f"), type, label, required: false, width: "full", ...extra });
const step = (name, approverType, extra = {}) => ({ key: uid("s"), name, approverType, userIds: [], mode: "all", ...extra });

export const TEMPLATES = [
  {
    key: "blank", name: "Mẫu trống", hint: "Tự thêm trường và bước duyệt", groupName: null,
    build: () => ({ name: "", icon: "FileText", color: "#2563eb", fields: [], flow: [step("Trưởng phòng duyệt", "dept_head")] }),
  },
  {
    key: "leave", name: "Đề nghị nghỉ phép", hint: "Loại nghỉ, thời gian, người bàn giao — Tổ trưởng → Trưởng phòng", groupName: "Hành chính - Nhân sự",
    build: () => ({
      name: "Đề nghị nghỉ phép", icon: "CalendarDays", color: "#2563eb",
      description: "Gửi trước ít nhất 1 ngày (trừ nghỉ ốm đột xuất).",
      fields: [
        f("select", "Loại nghỉ", { required: true, options: opt("Phép năm", "Nghỉ ốm", "Việc riêng có lương", "Việc riêng không lương", "Thai sản", "Khác") }),
        f("select", "Buổi", { width: "half", options: opt("Cả ngày", "Buổi sáng", "Buổi chiều") }),
        f("daterange", "Thời gian nghỉ", { required: true }),
        f("textarea", "Lý do", { required: true }),
        f("user", "Người nhận bàn giao công việc", { width: "half" }),
        f("text", "Số điện thoại liên hệ khi nghỉ", { width: "half" }),
        f("files", "Giấy tờ kèm theo (giấy khám bệnh…)"),
      ],
      flow: [step("Tổ trưởng duyệt", "team_head"), step("Trưởng phòng duyệt", "dept_head")],
    }),
  },
  {
    key: "advance", name: "Đề nghị tạm ứng", hint: "Số tiền, mục đích, hình thức nhận — Trưởng phòng → Kế toán", groupName: "Tài chính - Kế toán",
    build: () => ({
      name: "Đề nghị tạm ứng", icon: "Wallet", color: "#16a34a",
      fields: [
        f("currency", "Số tiền tạm ứng", { required: true, width: "half" }),
        f("select", "Hình thức nhận", { width: "half", options: opt("Tiền mặt", "Chuyển khoản") }),
        f("textarea", "Mục đích tạm ứng", { required: true }),
        f("date", "Ngày dự kiến hoàn ứng", { width: "half" }),
        f("text", "Số tài khoản / Ngân hàng (nếu chuyển khoản)", { width: "half" }),
      ],
      flow: [step("Trưởng phòng duyệt", "dept_head"), step("Kế toán duyệt", "users", { mode: "any" })],
    }),
  },
  {
    key: "payment", name: "Đề nghị thanh toán", hint: "Nội dung, số tiền, hoá đơn — Trưởng phòng → Kế toán → Giám đốc", groupName: "Tài chính - Kế toán",
    build: () => ({
      name: "Đề nghị thanh toán", icon: "Receipt", color: "#0891b2",
      fields: [
        f("textarea", "Nội dung thanh toán", { required: true }),
        f("currency", "Số tiền", { required: true, width: "half" }),
        f("select", "Hình thức", { width: "half", options: opt("Tiền mặt", "Chuyển khoản") }),
        f("text", "Đơn vị / người nhận tiền", { width: "half" }),
        f("text", "Số tài khoản / Ngân hàng", { width: "half" }),
        f("files", "Hoá đơn, chứng từ", { required: true }),
      ],
      flow: [step("Trưởng phòng duyệt", "dept_head"), step("Kế toán kiểm tra", "users", { mode: "any" }), step("Giám đốc duyệt", "users")],
    }),
  },
  {
    key: "purchase", name: "Đề nghị mua sắm / vật tư", hint: "Hàng hoá, số lượng, chi phí, báo giá", groupName: "Mua sắm - Vật tư",
    build: () => ({
      name: "Đề nghị mua sắm vật tư", icon: "ShoppingCart", color: "#ea580c",
      fields: [
        f("textarea", "Danh sách hàng cần mua (tên – quy cách – số lượng)", { required: true, placeholder: "VD: Mực in đen 1 kg x 5" }),
        f("currency", "Chi phí dự kiến", { width: "half" }),
        f("date", "Ngày cần hàng", { width: "half" }),
        f("textarea", "Lý do / mục đích sử dụng", { required: true }),
        f("files", "Báo giá, hình ảnh mẫu"),
      ],
      flow: [step("Trưởng phòng duyệt", "dept_head"), step("Phòng mua hàng tiếp nhận", "users", { mode: "any" })],
    }),
  },
  {
    key: "overtime", name: "Đăng ký tăng ca", hint: "Ngày, giờ, danh sách người", groupName: "Hành chính - Nhân sự",
    build: () => ({
      name: "Đăng ký tăng ca", icon: "Clock", color: "#9333ea",
      fields: [
        f("date", "Ngày tăng ca", { required: true, width: "half" }),
        f("text", "Thời gian (từ – đến)", { required: true, width: "half", placeholder: "17:00 – 20:00" }),
        f("user", "Người tăng ca", { required: true, multiple: true }),
        f("textarea", "Lý do / công việc", { required: true }),
      ],
      flow: [step("Trưởng phòng duyệt", "dept_head")],
    }),
  },
  {
    key: "repair", name: "Báo hỏng / sửa chữa thiết bị", hint: "Thiết bị, vị trí, hình ảnh hư hỏng", groupName: "Sản xuất - Kỹ thuật",
    build: () => ({
      name: "Báo hỏng / sửa chữa thiết bị", icon: "Wrench", color: "#dc2626",
      fields: [
        f("text", "Thiết bị / máy", { required: true, width: "half" }),
        f("text", "Vị trí (chuyền, khu vực)", { width: "half" }),
        f("select", "Mức độ", { required: true, options: opt("Dừng sản xuất", "Ảnh hưởng năng suất", "Không gấp") }),
        f("textarea", "Mô tả hư hỏng", { required: true }),
        f("files", "Hình ảnh / video hư hỏng", { required: true }),
      ],
      flow: [step("Kỹ thuật tiếp nhận", "users", { mode: "any" })],
    }),
  },
  {
    key: "trip", name: "Đề nghị đi công tác", hint: "Nơi đến, thời gian, chi phí dự trù", groupName: "Hành chính - Nhân sự",
    build: () => ({
      name: "Đề nghị đi công tác", icon: "Plane", color: "#4f46e5",
      fields: [
        f("text", "Nơi công tác", { required: true }),
        f("daterange", "Thời gian", { required: true }),
        f("select", "Phương tiện", { width: "half", options: opt("Xe công ty", "Xe cá nhân", "Xe khách / tàu", "Máy bay") }),
        f("currency", "Chi phí dự trù", { width: "half" }),
        f("user", "Người đi cùng", { multiple: true }),
        f("textarea", "Mục đích công tác", { required: true }),
      ],
      flow: [step("Trưởng phòng duyệt", "dept_head"), step("Ban giám đốc duyệt", "users", { mode: "any" })],
    }),
  },
  {
    key: "stationery", name: "Cấp phát văn phòng phẩm", hint: "Danh sách, số lượng", groupName: "Mua sắm - Vật tư",
    build: () => ({
      name: "Cấp phát văn phòng phẩm", icon: "Package", color: "#ca8a04",
      fields: [
        f("textarea", "Danh sách cần cấp (tên – số lượng)", { required: true }),
        f("date", "Ngày cần", { width: "half" }),
      ],
      flow: [step("Hành chính cấp phát", "users", { mode: "any" })],
    }),
  },
  {
    key: "general", name: "Đề xuất chung", hint: "Nội dung tự do + tệp đính kèm, người gửi tự chọn người duyệt", groupName: "Khác",
    build: () => ({
      name: "Đề xuất chung", icon: "FileText", color: "#475569",
      fields: [f("textarea", "Nội dung đề xuất", { required: true }), f("files", "Tài liệu kèm theo")],
      flow: [step("Người duyệt", "requester_pick")],
    }),
  },
];
