// Mẫu đề xuất dựng sẵn — admin chọn rồi sửa. Bước duyệt "Người cụ thể" để trống: admin phải chọn người trước khi lưu.
// 9 mẫu đầu dựng theo đúng các nhóm đề xuất công ty đang dùng trên Base Request (xem 2026-10-12): cùng trường,
// cùng thứ tự; khác ở chỗ bảng chi tiết tự đánh số dòng, tự tính Thành tiền / Tổng cộng / Bằng chữ.
// DAMY và THLA dùng chung cấu trúc → tạo 1 mẫu, rồi "Nhân bản" ở danh sách mẫu và đổi tên cho công ty còn lại.
import { newColumn, uid } from "~/pagesRequest/shared/fieldTypes";

const opt = (...labels) => labels.map((label) => ({ id: uid("o"), label }));
const f = (type, label, extra = {}) => ({ key: uid("f"), type, label, required: false, width: "full", ...extra });
const step = (name, approverType, extra = {}) => ({ key: uid("s"), name, approverType, userIds: [], mode: "all", ...extra });
/** Bước người gửi tự chọn 1 người (admin giới hạn danh sách ở tab Quy trình duyệt) */
const pick1 = (name, optional = false) => step(name, "requester_pick", { maxPick: 1, ...(optional ? { optional: true } : {}) });

const DEPTS_7 = ["PHÒNG TÀI CHÍNH", "PHÒNG TỔNG HỢP", "PHÒNG BÁN HÀNG", "PHÒNG KẾ HOẠCH", "PHÒNG KỸ THUẬT", "PHÒNG SẢN XUẤT", "PHÒNG QC"];
const DEPTS_9 = ["PHÒNG TÀI CHÍNH", "PHÒNG NSHC", "PHÒNG BÁN HÀNG", "PHÒNG KẾ HOẠCH", "PHÒNG KỸ THUẬT", "PHÒNG SẢN XUẤT", "PHÒNG QC", "BỘ PHẬN MUA HÀNG", "BP. IT"];

/** Bảng mua hàng: … · SL · Đơn giá · Thành tiền (= SL × Đơn giá, có tổng) · … → trả { table, total } (total = trường Tổng cộng tự tính) */
function buyTable(label, firstCols, lastCols, { unit = true, qtyLabel = "SL" } = {}) {
  const qty = newColumn(qtyLabel, "number"), price = newColumn("Đơn giá", "currency");
  const amount = newColumn("Thành tiền", "formula", { of: [qty.key, price.key], sum: true });
  const table = f("table", label, {
    required: true,
    columns: [...firstCols.map((c) => newColumn(c)), ...(unit ? [newColumn("ĐVT")] : []), qty, price, amount, ...lastCols.map((c) => newColumn(c))],
  });
  const total = f("currency", "Tổng cộng", { required: true, sumOf: { table: table.key, column: amount.key } });
  return { table, total };
}
/** Bảng "Nội dung · Số tiền" (có tổng) */
function amountTable(label, textCol, required) {
  const money = newColumn("Số tiền", "currency", { sum: true });
  const table = f("table", label, { required, columns: [newColumn(textCol), money] });
  return { table, money };
}

// Luồng duyệt như trên Base: Trưởng phòng (người gửi chọn 1) → Phó phòng TC → Trưởng phòng TC → Phó GĐ → GĐ (2 bước cuối không bắt buộc)
const financeFlow = (first = "Trưởng phòng") => [
  pick1(first), step("Phó phòng Tài chính", "users"), step("Trưởng phòng Tài chính kiểm tra", "users"), pick1("Phó Giám đốc", true), pick1("Giám đốc", true),
];
const requestFlow = () => [
  pick1("Trưởng phòng"), step("Bộ phận liên quan", "requester_pick", { optional: true }), step("PTC - Phụ trách PL", "users"),
  step("Trưởng phòng Tài chính", "users"), pick1("Ban Giám đốc", true),
];

function simpleMoneyForm(name, icon, color) {
  return () => {
    const { table, money } = amountTable("Nội dung đề nghị", "Nội dung đề nghị", true);
    return {
      name, icon, color,
      fields: [
        f("date", "Ngày đề nghị", { required: true, width: "half" }),
        f("select", "Bộ phận đề nghị", { required: true, width: "half", options: opt(...DEPTS_7) }),
        table,
        f("currency", "Tổng cộng", { required: true, sumOf: { table: table.key, column: money.key } }),
      ],
      flow: financeFlow(),
    };
  };
}

function requestMoneyForm(name, kind, icon, color) {
  return () => {
    const { table } = amountTable("Nội dung", "Nội dung thanh toán", false);
    const pay = f("currency", `Số tiền ${kind}`, { required: true, width: "half" });
    return {
      name, icon, color,
      fields: [
        f("select", "Bộ phận", { required: true, width: "half", options: opt(...DEPTS_7) }),
        f("select", "Ngân sách", { required: true, width: "half", options: opt("Trong ngân sách", "Vượt ngân sách", "Phát sinh"), description: "Nếu vượt ngân sách, vui lòng nhập số tiền vượt." }),
        f("currency", "Số tiền vượt ngân sách", { width: "half" }),
        f("text", `Tên khoản ${kind}`, { required: true, width: "half" }),
        f("text", "Mục đích", { required: true }),
        table,
        f("currency", "Tổng số tiền", { required: true, width: "half" }),
        f("currency", "Số nợ (nếu có)", { width: "half" }),
        pay,
        f("text", "Bằng chữ", { required: true, wordsOf: pay.key }),
        f("text", "Tên người thụ hưởng", { required: true }),
        f("text", "Tên ngân hàng", { width: "half" }),
        f("text", "Tên chủ tài khoản", { width: "half" }),
        f("text", "Số tài khoản", { width: "half" }),
        f("date", `Ngày ${kind}`, { width: "half" }),
      ],
      flow: requestFlow(),
    };
  };
}

export const TEMPLATES = [
  {
    key: "blank", name: "Mẫu trống", hint: "Tự thêm trường và bước duyệt", groupName: null,
    build: () => ({ name: "", icon: "FileText", color: "#2563eb", fields: [], flow: [step("Trưởng phòng duyệt", "dept_head")] }),
  },

  /* ---------- Theo các nhóm đề xuất công ty đang dùng trên Base Request ---------- */
  {
    key: "buy", name: "Phiếu đề nghị mua", hint: "Phân loại, ngân sách, mục đích, số tiền + bằng chữ, bảng chi tiết mua (8 cột), tổng cộng", groupName: "Mua sắm - Vật tư",
    build: () => {
      const amount = f("currency", "Số tiền", { required: true, width: "half" });
      const { table, total } = buyTable("Đính kèm nội dung chi tiết mua", ["Nội dung mua"], ["Nhà cung cấp", "Lý do mua"]);
      return {
        name: "Phiếu đề nghị mua", icon: "ShoppingCart", color: "#ea580c",
        description: "1. Cần được soạn thảo bằng văn bản\n2. Cần được thảo luận rõ ràng và chính xác\n3. Cần phải viết hoặc đính kèm lợi ích đầu tư, tính toán và báo giá",
        fields: [
          f("select", "Phân loại", { required: true, width: "half", options: opt("NVL", "CHI PHÍ", "ĐẦU TƯ") }),
          f("select", "Ngân sách", { required: true, width: "half", options: opt("Trong ngân sách", "Ngoài ngân sách", "Vượt ngân sách") }),
          f("textarea", "Mục đích mua", { required: true }),
          amount,
          f("text", "Bằng chữ", { required: true, wordsOf: amount.key }),
          f("textarea", "Lợi ích (của việc mua hàng / đầu tư)", { required: true }),
          f("text", "Nhà cung cấp", { required: true, width: "half" }),
          f("select", "Phòng ban", { required: true, width: "half", options: opt(...DEPTS_9) }),
          f("date", "Khi nào mua", { required: true, width: "half" }),
          table,
          total,
        ],
        flow: [pick1("Trưởng phòng", true), step("Phó phòng Tài chính", "users"), step("Trưởng phòng Tài chính", "users"), pick1("Trưởng BP Mua hàng", true), pick1("Ban Giám đốc", true)],
      };
    },
  },
  {
    key: "buy-service", name: "Phiếu đề nghị mua dịch vụ", hint: "Kế hoạch / phát sinh, bảng gói dịch vụ mua ngoài, tổng cộng, ghi chú", groupName: "Mua sắm - Vật tư",
    build: () => {
      const { table, total } = buyTable("Nội dung đề nghị", ["Gói dịch vụ mua ngoài"], ["Nhà cung cấp", "Lý do mua"], { unit: false, qtyLabel: "Số lượng" });
      return {
        name: "Phiếu đề nghị mua dịch vụ", icon: "ShoppingCart", color: "#0891b2",
        fields: [f("select", "Phân loại đề nghị", { required: true, options: opt("Kế hoạch", "Phát sinh") }), table, total, f("textarea", "Ghi chú")],
        flow: financeFlow(),
      };
    },
  },
  {
    key: "buy-material", name: "Phiếu đề nghị mua NVL, thiết bị, công cụ", hint: "Kế hoạch / phát sinh, bảng tên + thông số kỹ thuật, tổng cộng, ghi chú", groupName: "Mua sắm - Vật tư",
    build: () => {
      const { table, total } = buyTable("Nội dung đề nghị", ["Tên và thông số kỹ thuật của NVL, TB, CC cần mua"], ["Nhà cung cấp", "Lý do"]);
      return {
        name: "Phiếu đề nghị mua NVL, thiết bị, công cụ", icon: "Package", color: "#ca8a04",
        fields: [f("select", "Phân loại đề nghị", { required: true, options: opt("Kế hoạch", "Phát sinh") }), table, total, f("textarea", "Ghi chú")],
        flow: financeFlow(),
      };
    },
  },
  {
    key: "advance-proposal", name: "Phiếu đề nghị tạm ứng", hint: "Ngày, bộ phận, bảng nội dung – số tiền, tổng cộng tự tính (DAMY / THLA)", groupName: "Tài chính - Kế toán",
    build: simpleMoneyForm("Phiếu đề nghị tạm ứng", "Wallet", "#16a34a"),
  },
  {
    key: "payment-proposal", name: "Phiếu đề nghị thanh toán", hint: "Ngày, bộ phận, bảng nội dung – số tiền, tổng cộng tự tính (DAMY / THLA)", groupName: "Tài chính - Kế toán",
    build: simpleMoneyForm("Phiếu đề nghị thanh toán", "Receipt", "#0891b2"),
  },
  {
    key: "advance-request", name: "Phiếu yêu cầu tạm ứng", hint: "Ngân sách, khoản tạm ứng, bảng nội dung, số tiền + bằng chữ, người thụ hưởng, tài khoản (DAMY / THLA)", groupName: "Tài chính - Kế toán",
    build: requestMoneyForm("Phiếu yêu cầu tạm ứng", "tạm ứng", "Wallet", "#16a34a"),
  },
  {
    key: "payment-request", name: "Phiếu yêu cầu thanh toán", hint: "Ngân sách, khoản thanh toán, bảng nội dung, số tiền + bằng chữ, người thụ hưởng, tài khoản (DAMY / THLA)", groupName: "Tài chính - Kế toán",
    build: requestMoneyForm("Phiếu yêu cầu thanh toán", "thanh toán", "Receipt", "#0891b2"),
  },
  {
    key: "leave-form", name: "Đơn xin nghỉ phép", hint: "Phòng ban + đính kèm file đăng ký phép", groupName: "Hành chính - Nhân sự",
    build: () => ({
      name: "Đơn xin nghỉ phép", icon: "CalendarDays", color: "#2563eb",
      fields: [
        f("select", "Phòng ban", { required: true, options: opt("Phòng Tài Chính", "Phòng Tổng Hợp", "Phòng Bán Hàng", "Phòng QC", "Phòng Kế Hoạch", "Phòng Kỹ Thuật", "Phòng Sản Xuất") }),
        f("files", "File đăng ký phép", { required: true, description: "Điền đầy đủ thông tin vào phiếu đăng ký nghỉ phép." }),
      ],
      flow: [step("Người duyệt", "requester_pick"), step("Các cấp phê duyệt nghỉ phép", "requester_pick", { optional: true })],
    }),
  },
  {
    key: "direct", name: "Đề xuất trực tiếp", hint: "Phòng ban + nội dung tự do — dùng cho các đề xuất phát sinh", groupName: "Khác",
    build: () => ({
      name: "Đề xuất trực tiếp", icon: "FileText", color: "#475569",
      description: "Sử dụng cho các đề xuất phát sinh",
      fields: [f("select", "Phòng ban", { required: true, options: opt("PHÒNG BÁN HÀNG", "PHÒNG KỸ THUẬT", "PHÒNG SẢN XUẤT", "PHÒNG QC", "PHÒNG NSHC", "PHÒNG TÀI CHÍNH", "PHÒNG KẾ HOẠCH", "BP. MUA HÀNG", "BP. IT") }), f("textarea", "Nội dung đề xuất", { required: true })],
      flow: [pick1("Trưởng phòng", true), step("Phòng Tài chính (Phó phòng)", "users"), step("Phòng Tài chính (Trưởng phòng)", "users"), pick1("Trưởng phòng QC", true), pick1("Ban Giám đốc", true)],
    }),
  },

  /* ---------- Mẫu chung khác ---------- */
  {
    key: "leave", name: "Nghỉ phép (điền trực tiếp)", hint: "Loại nghỉ, thời gian, người bàn giao — Tổ trưởng → Trưởng phòng (không cần file)", groupName: "Hành chính - Nhân sự",
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
];
