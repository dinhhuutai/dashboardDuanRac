import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const PRINT_PAGE_STYLE_ID = "form-test-run-print-style";
const PRINT_SHEET_CLASS = "form-test-run-a4-sheet";

function applyPrintStyles() {
  let el = document.getElementById(PRINT_PAGE_STYLE_ID);
  if (!el) {
    el = document.createElement("style");
    el.id = PRINT_PAGE_STYLE_ID;
    document.head.appendChild(el);
  }
  el.textContent = `@media print {
  @page {
    size: A4 portrait;
    margin: 0.35in;
  }
  html, body {
    height: auto !important;
    overflow: visible !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  body {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .${PRINT_SHEET_CLASS} {
    width: 100% !important;
    margin: 0 auto !important;
  }
}`;
}

function searchParamsToValues(searchParams) {
  const out = {};
  searchParams.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

function nowDateDdMmYyyy() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function normalizeValue(v) {
  return v != null ? String(v).trim() : "";
}

function formatLabelValue(label, value) {
  return `${label}: ${normalizeValue(value)}`;
}

function exportFormTestRunWord(values) {
  const stamp = normalizeValue(values.PO) || new Date().toISOString().slice(0, 10);
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    @page { size: A4 portrait; margin: 0.35in; }
    body { font-family: Calibri, Arial, sans-serif; font-size: 14px; color: #000; }
    h1 { text-align: center; color: #0f2f68; margin: 0 0 16px 0; font-size: 26px; }
    h2 { color: #0f2f68; margin: 12px 0 8px; font-size: 20px; }
    p { margin: 3px 0; }
    .section { margin-top: 10px; }
    table.layout { width: 100%; border-collapse: collapse; table-layout: fixed; }
    table.layout td { vertical-align: top; padding: 4px 10px 4px 0; border: 1px solid #ffffff; }
    .full-row { padding-right: 0 !important; }
  </style>
</head>
<body>
  <h1>FORM TEST RUN - CHUAN QC + CNSP + CHUYEN</h1>
  <table class="layout">
    <tr>
      <td>
      <h2>1. THONG TIN CHUNG</h2>
      <p>KHACH HANG: ${normalizeValue(values.KH) || "Cot F"}</p>
      <p>MA DON: ${normalizeValue(values.PO) || "Cot G"}</p>
      <p>MA - PHAN: ${normalizeValue(values.MA) || "Cot H"}</p>
      <p>MAU VAI: ${normalizeValue(values.MAUVAI) || "Cot I"}</p>
      <p>KICH VAI: ${normalizeValue(values.KICHVAI) || "Cot J"}</p>
      <p>KICH PHIM: ${normalizeValue(values.KICHPHIM) || "Cot K"}</p>
      <p>CHUYEN SAN XUAT: ${normalizeValue(values.CHUYEN) || "Cot E"}</p>
      <p>NGAY TEST RUN: ${normalizeValue(values.NGAYTESTRUN) || nowDateDdMmYyyy()}</p>
      <p>GIO BAT DAU: ${normalizeValue(values.GBD) || "Cot B"}</p>
      </td>
      <td>
      <h2>2. THONG TIN TEST</h2>
      <p><b>SO LUONG TEST:</b></p>
      <p>☐ 10 pcs</p>
      <p>☐ 20 pcs</p>
      <p>☐ 30 pcs</p>
      <p>☐ Khac: ___________</p>
      <p style="margin-top:8px;"><b>MAU DOI CHIEU:</b></p>
      <p>☐ Mau duyet khach</p>
      <p>☐ Mau ky thuat chuan</p>
      </td>
    </tr>
    <tr>
      <td>
      <h2>3. CHECKLIST TEST RUN</h2>
      <p><b>A. QC kiem</b></p>
      <p>☐ Mau dung</p>
      <p>☐ Do net dat</p>
      <p>☐ Khong lem mau</p>
      <p>☐ Khong lech vi tri in</p>
      <p>☐ Khong loi lon</p>
      <p>☐ Dung tieu chuan QC</p>
      <p style="margin-top:8px;"><b>B. CNSP kiem</b></p>
      <p>☐ Dung thong so ky thuat</p>
      <p>☐ Dung do bam muc</p>
      <p>☐ Khong co rut sai chuan</p>
      <p>☐ Khong loi ky thuat van hanh</p>
      <p>☐ Co the chay hang loat</p>
      <p style="margin-top:8px;"><b>C. To truong chuyen xac nhan</b></p>
      <p>☐ Chuyen san sang chay</p>
      <p>☐ Cong nhan hieu thao tac</p>
      <p>☐ Khong con diem nghen</p>
      </td>
      <td>
      <h2>4. KET LUAN TEST RUN</h2>
      <p>☐ OK -> CHO CHAY HANG LOAT</p>
      <p>☐ NOT OK -> DUNG / CHINH / TEST LAI</p>
      <p style="margin-top:8px;">Ly do neu NOT OK:</p>
      <p>............................................................</p>
      <p>............................................................</p>
      <h2>5. CHU KY BAT BUOC</h2>
      <p>QC: __________________________</p>
      <p style="margin-top:8px;">CNSP: ________________________</p>
      <p style="margin-top:8px;">To truong chuyen: ________________________</p>
      <p style="margin-top:8px;">Ke hoach xac nhan RELEASE: ________________________</p>
      <p style="margin-top:8px;">Thoi gian xac nhan: ________________________</p>
      </td>
    </tr>
    <tr>
      <td colspan="2" class="full-row">
        <div class="section">
          <h2>QUY TAC BAT BUOC</h2>
          <p><b>! KHONG TEST RUN OK -> KHONG DUOC CHAY</b></p>
          <p><b>! KHONG CO DU CHU KY -> KHONG RELEASE</b></p>
          <p><b>! QC + CNSP CO QUYEN CHAN CHUYEN</b></p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const blob = new Blob([html], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `FormTestRun_${stamp}.docx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function FormTestRun() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [queryValues, setQueryValues] = useState({});

  useEffect(() => {
    const values = searchParamsToValues(searchParams);
    setQueryValues(values);

    if (window.location.search) {
      navigate(window.location.pathname, { replace: true });
    }
  }, []);

  useEffect(() => {
    applyPrintStyles();
    return () => {
      document.getElementById(PRINT_PAGE_STYLE_ID)?.remove();
    };
  }, []);

  const data = useMemo(
    () => ({
      KH: normalizeValue(queryValues.KH),
      PO: normalizeValue(queryValues.PO),
      MA: normalizeValue(queryValues.MA),
      MAUVAI: normalizeValue(queryValues.MAUVAI),
      KICHVAI: normalizeValue(queryValues.KICHVAI),
      KICHPHIM: normalizeValue(queryValues.KICHPHIM),
      CHUYEN: normalizeValue(queryValues.CHUYEN),
      GBD: normalizeValue(queryValues.GBD),
      NGAYTESTRUN: normalizeValue(queryValues.NGAYTESTRUN) || nowDateDdMmYyyy(),
    }),
    [queryValues],
  );

  const handlePrint = () => {
    applyPrintStyles();
    window.print();
  };

  const handleExportWord = async () => {
    try {
      const valuesForExport = {
        ...searchParamsToValues(searchParams),
        ...queryValues,
      };
      exportFormTestRunWord(valuesForExport);
    } catch (e) {
      console.error(e);
      window.alert("Khong xuat duoc Word. Thu lai sau.");
    }
  };

  const leftChecklist = [
    "A. QC kiểm",
    "☐ Màu đúng",
    "☐ Độ nét đạt",
    "☐ Không lem màu",
    "☐ Không lệch vị trí in",
    "☐ Không lỗi lớn",
    "☐ Đúng tiêu chuẩn QC",
    "",
    "B. CNSP kiểm",
    "☐ Đúng thông số kỹ thuật",
    "☐ Đúng độ bám mực",
    "☐ Không co rút sai chuẩn",
    "☐ Không lỗi kỹ thuật vận hành",
    "☐ Có thể chạy hàng loạt",
    "",
    "C. Tổ trưởng chuyền xác nhận",
    "☐ Chuyền sẵn sàng chạy",
    "☐ Công nhân hiểu thao tác",
    "☐ Không còn điểm nghẽn",
  ];

  const rightConclusion = [
    "☐ OK → CHO CHẠY HÀNG LOẠT",
    "☐ NOT OK → DỪNG / CHỈNH / TEST LẠI",
    "",
    "Lý do nếu NOT OK:",
    "............................................................",
    "............................................................",
    "",
    "5. CHỮ KÝ BẮT BUỘC",
    "QC: __________________________",
    "",
    "CNSP: ________________________",
    "",
    "Tổ trưởng chuyền: ________________________",
    "",
    "Kế hoạch xác nhận RELEASE: ________________________",
    "",
    "Thời gian xác nhận: ________________________",
  ];

  return (
    <div className="min-h-screen bg-neutral-100 p-4 text-black print:bg-white print:p-2">
      <div className="mx-auto max-w-5xl">
        <div className="mb-3 flex flex-wrap items-center justify-end gap-2 print:hidden">
          <button
            type="button"
            onClick={handleExportWord}
            className="rounded border border-neutral-400 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-neutral-50"
          >
            Xuất Word
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="rounded border border-neutral-400 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-neutral-50"
          >
            In A4
          </button>
        </div>

        <div className={`${PRINT_SHEET_CLASS} bg-white p-6`}>
          <h1 className="pb-2 text-center text-2xl font-bold uppercase tracking-wide text-blue-900">
            FORM TEST RUN - CHUẨN QC + CNSP + CHUYỀN
          </h1>

          <div className="mt-4 grid grid-cols-2 gap-6">
            <div className="p-3">
              <h2 className="mb-2 text-lg font-bold text-blue-900">1. THÔNG TIN CHUNG</h2>
              <p>KHÁCH HÀNG: {data.KH || "Cột F"}</p>
              <p>MÃ ĐƠN: {data.PO || "Cột G"}</p>
              <p>MÃ - PHẦN: {data.MA || "Cột H"}</p>
              <p>MÀU VẢI: {data.MAUVAI || "Cột I"}</p>
              <p>KÍCH VẢI: {data.KICHVAI || "Cột J"}</p>
              <p>KÍCH PHIM: {data.KICHPHIM || "Cột K"}</p>
              <p>CHUYỀN SẢN XUẤT: {data.CHUYEN || "Cột E"}</p>
              <p>NGÀY TEST RUN: {data.NGAYTESTRUN}</p>
              <p>GIỜ BẮT ĐẦU: {data.GBD || "Cột B"}</p>
            </div>

            <div className="p-3">
              <h2 className="mb-2 text-lg font-bold text-blue-900">2. THÔNG TIN TEST</h2>
              <p className="font-bold">SỐ LƯỢNG TEST:</p>
              <p>☐ 10 pcs</p>
              <p>☐ 20 pcs</p>
              <p>☐ 30 pcs</p>
              <p>☐ Khác: ___________</p>

              <p className="mt-3 font-bold">MẪU ĐỐI CHIẾU:</p>
              <p>☐ Mẫu duyệt khách</p>
              <p>☐ Mẫu kỹ thuật chuẩn</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="p-3">
              <h2 className="mb-2 text-lg font-bold text-blue-900">3. CHECKLIST TEST RUN</h2>
              {leftChecklist.map((line, idx) => (
                <p key={`left-${idx}`} className={line && !line.includes("☐") ? "font-semibold" : ""}>
                  {line || <>&nbsp;</>}
                </p>
              ))}
            </div>

            <div className="p-3">
              <h2 className="mb-2 text-lg font-bold text-blue-900">4. KẾT LUẬN TEST RUN</h2>
              {rightConclusion.map((line, idx) => (
                <p
                  key={`right-${idx}`}
                  className={line === "5. CHỮ KÝ BẮT BUỘC" ? "mt-2 font-bold text-blue-900" : ""}
                >
                  {line || <>&nbsp;</>}
                </p>
              ))}
            </div>
          </div>

          <div className="p-3">
            <h2 className="text-lg font-bold text-blue-900">QUY TẮC BẮT BUỘC</h2>
            <p className="font-bold">❗ KHÔNG TEST RUN OK → KHÔNG ĐƯỢC CHẠY</p>
            <p className="font-bold">❗ KHÔNG CÓ ĐỦ CHỮ KÝ → KHÔNG RELEASE</p>
            <p className="font-bold">❗ QC + CNSP CÓ QUYỀN CHẶN CHUYỀN</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FormTestRun;