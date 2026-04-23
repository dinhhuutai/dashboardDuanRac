import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const PRINT_PAGE_STYLE_ID = "form-ready-print-style";
const PRINT_ROOT_CLASS = "form-ready-print-root";
const PRINT_PAGE_CLASS = "form-ready-print-page";
const CB_CLASS = "form-ready-cb";

function Cb() {
  return (
    <span className={CB_CLASS} aria-hidden="true">
      ☐
    </span>
  );
}

function applyPrintStyles() {
  let el = document.getElementById(PRINT_PAGE_STYLE_ID);
  if (!el) {
    el = document.createElement("style");
    el.id = PRINT_PAGE_STYLE_ID;
    document.head.appendChild(el);
  }
  el.textContent = `.${PRINT_PAGE_CLASS} .${CB_CLASS} {
  font-size: 1.55em;
  line-height: 1;
  vertical-align: -0.12em;
  font-weight: 700;
  margin-right: 0.08em;
}
@media print {
  @page {
    size: A4 portrait;
    margin: 0.28in;
  }
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    height: auto !important;
    overflow: visible !important;
  }
  body {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
    background: #fff !important;
  }
  .${PRINT_ROOT_CLASS} {
    background: #fff !important;
    padding: 0 !important;
  }
  .${PRINT_PAGE_CLASS} {
    box-sizing: border-box;
    width: 100% !important;
    min-height: calc(297mm - 0.56in);
    padding: 0 !important;
    margin: 0 !important;
    break-inside: avoid;
    page-break-inside: avoid;
    font-size: 17px !important;
    line-height: 1.55 !important;
  }
  .${PRINT_PAGE_CLASS} .${CB_CLASS} {
    font-size: 1.65em;
  }
  .${PRINT_PAGE_CLASS}.page-break {
    break-after: page;
    page-break-after: always;
  }
  .print-hidden {
    display: none !important;
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

function normalizeValue(v) {
  return v != null ? String(v).trim() : "";
}

function exportFormReadyWord(values) {
  const stamp = normalizeValue(values.PO) || new Date().toISOString().slice(0, 10);
  const chk = `<span class="${CB_CLASS}">☐</span>`;
  const htmlRaw = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    @page { size: A4 portrait; margin: 0.22in; }
    body { font-family: "Times New Roman", serif; color: #111827; margin: 0; font-size: 16.5px; line-height: 1.48; }
    /* Không dùng flex — Word dễ bỏ qua page-break trên khối flex */
    .doc-p1, .doc-p2 { box-sizing: border-box; }
    .doc-p1 > * + *, .doc-p2 > * + * { margin-top: 18px; }
    .word-force-page2 { page-break-before: always; break-before: page; mso-page-break-before: always; font-size: 0; line-height: 0; height: 0; margin: 0; padding: 0; border: 0; }
    h1 { margin: 0 0 10px; font-size: 24px; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid #1d4ed8; padding-bottom: 8px; line-height: 1.15; }
    h2 { margin: 0 0 6px; font-size: 19px; font-weight: 700; color: #0f2f68; line-height: 1.2; }
    p { margin: 6px 0; line-height: 1.48; }
    .${CB_CLASS} { font-size: 1.65em; line-height: 1; vertical-align: -0.12em; font-weight: 700; margin-right: 0.1em; }
    table.tbl-2col, table.tbl-3col { width: 100%; border-collapse: collapse; table-layout: fixed; margin: 0 0 6px 0; }
    table.tbl-2col td, table.tbl-3col td { vertical-align: top; }
    table.tbl-2col td { width: 50%; padding: 2px 12px 10px 0; }
    table.tbl-2col td + td { padding: 2px 0 10px 12px; }
    table.tbl-3col td { width: 33.33%; padding: 0 10px; }
    table.tbl-3col td:first-child { padding-left: 0; }
    table.tbl-3col td:last-child { padding-right: 0; }
    table.tbl-2col p, table.tbl-3col p { margin: 5px 0; }
    .block { margin-top: 0; }
    .title-wrap { margin-top: 0; }
    .title-wrap > p { margin-top: 8px; margin-bottom: 0; }
  </style>
</head>
<body>
  <div class="doc-p1">
    <div class="title-wrap">
      <h1>FORM READY - OPEN / READY /TEST RUN - RELEASE (MÃ-PHẦN)</h1>

      <h2>1. THÔNG TIN CHUNG</h2>
      <table class="tbl-2col" width="100%">
        <tr>
          <td width="50%"><p>MÃ ĐƠN: ${normalizeValue(values.PO) || "__________"}</p></td>
          <td width="50%"><p>MÃ - PHẦN: ${normalizeValue(values.MA) || "__________"}</p></td>
        </tr>
        <tr>
          <td width="50%"><p>KHÁCH HÀNG: ${normalizeValue(values.KH) || "__________"}</p></td>
          <td width="50%"><p>TÊN SẢN PHẨM: __________</p></td>
        </tr>
        <tr>
          <td width="50%"><p>SỐ LƯỢNG: ${normalizeValue(values.SL) || "__________"}</p></td>
          <td width="50%"><p>CHUYỀN DỰ KIẾN: ${normalizeValue(values.CHUYEN) || "__________"}</p></td>
        </tr>
      </table>
      <p>NGÀY DỰ KIẾN RELEASE: _________</p>
    </div>

    <div class="block">
      <h2>2. CHECKLIST READY - NGUỒN KÝ</h2>
      <p><b>[1] VẢI (Kho)</b> &nbsp;&nbsp;&nbsp; ☐ Đúng mã vải &nbsp;&nbsp;&nbsp; ☐ Đúng số lượng &nbsp;&nbsp;&nbsp; ☐ Không lỗi lớn</p>
      <p>Ký tên: _________ &nbsp; Thời gian: _________</p>
      <p><b>[2] KHUÔN (Kỹ thuật)</b> &nbsp;&nbsp;&nbsp; ☐ Đúng file thiết kế &nbsp;&nbsp;&nbsp; ☐ Đúng số màu &nbsp;&nbsp;&nbsp; ☐ Không sai lệch</p>
      <p>Ký tên: _________ &nbsp; Thời gian: _________</p>
      <p><b>[3] MỰC (Pha mực)</b> &nbsp;&nbsp;&nbsp; ☐ Đúng công thức &nbsp;&nbsp;&nbsp; ☐ Đúng màu mẫu &nbsp;&nbsp;&nbsp; ☐ Test đạt</p>
      <p>Ký tên: _________ &nbsp; Thời gian: _________</p>
      <p><b>[4] MẪU DUYỆT (Kỹ thuật / Sale)</b> &nbsp;&nbsp;&nbsp; ☐ Mẫu đã duyệt &nbsp;&nbsp;&nbsp; ☐ Khớp yêu cầu khách</p>
      <p>Ký tên: _________ &nbsp; Thời gian: _________</p>
    </div>

    <div class="block">
      <h2>3. QC READY - CHECKPOINT</h2>
      <p>☐ Đủ chữ ký các bộ phận &nbsp;&nbsp;&nbsp; ☐ Kiểm tra nhanh (vải / khuôn / mực) &nbsp;&nbsp;&nbsp; ☐ Đồng bộ logic (vải - mực - khuôn)</p>
      <p>KẾT LUẬN: &nbsp; ☐ OK → CHO RELEASE &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ☐ NOT OK → CHẶN</p>
      <p>Ký tên: _________ &nbsp; Thời gian: _________</p>
    </div>

    <div class="block">
      <h2>4. THÔNG TIN TEST</h2>
      <p>SỐ LƯỢNG TEST: &nbsp; ☐ 5 pcs &nbsp;&nbsp;&nbsp; ☐ 10 pcs &nbsp;&nbsp;&nbsp; ☐ 20 pcs &nbsp;&nbsp;&nbsp; ☐ Khác: _________</p>
      <p>MẪU ĐỐI CHIẾU: &nbsp; ☐ Mẫu duyệt khách &nbsp;&nbsp;&nbsp; ☐ Mẫu kỹ thuật chuẩn</p>
    </div>
  </div>

  <p class="word-force-page2">&nbsp;</p>

  <div class="doc-p2">
    <div class="block">
      <h2>5. CHECKLIST TEST RUN</h2>
      <table class="tbl-3col" width="100%">
        <tr>
          <td width="33%">
            <p><b>A. QC kiểm</b></p>
            <p>☐ Màu đúng</p>
            <p>☐ Độ nét đạt</p>
            <p>☐ Không lem màu</p>
            <p>☐ Không lệch vị trí in</p>
            <p>☐ Không lỗi lớn</p>
            <p>☐ Đúng tiêu chuẩn QC</p>
          </td>
          <td width="34%">
            <p><b>B. CNSP kiểm</b></p>
            <p>☐ Đúng thông số kỹ thuật</p>
            <p>☐ Đúng độ bám mực</p>
            <p>☐ Không co rút sai chuẩn</p>
            <p>☐ Không lỗi kỹ thuật vận hành</p>
            <p>☐ Có thể chạy hàng loạt</p>
          </td>
          <td width="33%">
            <p><b>C. Tổ trưởng chuyền xác nhận</b></p>
            <p>☐ Chuyền sẵn sàng chạy</p>
            <p>☐ Công nhân hiểu thao tác</p>
            <p>☐ Không còn điểm nghẽn</p>
          </td>
        </tr>
      </table>
    </div>
    <div class="block">
      <h2>6. KẾT LUẬN TEST RUN</h2>
      <p>☐ OK → CHO CHẠY HÀNG LOẠT</p>
      <p>☐ NOT OK → DỪNG / CHỈNH / TEST LẠI</p>
      <p>Lý do nếu NOT OK: ________________________________________________</p>
    </div>
    <div class="block">
      <h2>7. CHỮ KÝ BẮT BUỘC</h2>
      <p>QC: __________________________</p>
      <p>CNSP: ________________________</p>
      <p>Tổ trưởng chuyền: ________________________</p>
      <p>Kế hoạch xác nhận RELEASE: ________________________</p>
      <p>Thời gian xác nhận: ________________________</p>
    </div>
    <div class="block">
      <h2>8. GHI CHÚ LỖI (NẾU CÓ)</h2>
      <p>________________________________________________________________________________</p>
      <p>________________________________________________________________________________</p>
    </div>
    <div class="block">
      <h2>QUY TẮC BẮT BUỘC</h2>
      <p><b>❗ KHÔNG ĐỦ CHỮ KÝ → KHÔNG READY</b></p>
      <p><b>❗ KHÔNG READY → KHÔNG ĐƯỢC RELEASE</b></p>
      <p><b>❗ QC CÓ QUYỀN CHẶN</b></p>
    </div>
  </div>
</body>
</html>`;
  const html = htmlRaw.replace(/☐/g, chk);

  const blob = new Blob([html], {
    type: "application/msword;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `FormReady_${stamp}.doc`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function FormReady() {
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
      PO: normalizeValue(queryValues.PO),
      MA: normalizeValue(queryValues.MA),
      KH: normalizeValue(queryValues.KH),
      SL: normalizeValue(queryValues.SL),
      CHUYEN: normalizeValue(queryValues.CHUYEN),
    }),
    [queryValues],
  );

  const handlePrint = () => {
    applyPrintStyles();
    window.print();
  };

  const handleExportWord = () => {
    const valuesForExport = {
      ...searchParamsToValues(searchParams),
      ...queryValues,
    };
    exportFormReadyWord(valuesForExport);
  };

  return (
    <div className={`${PRINT_ROOT_CLASS} min-h-screen bg-neutral-100 p-4 text-black`}>
      <div className="mx-auto max-w-5xl">
        <div className="print-hidden mb-3 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="rounded border border-neutral-400 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-neutral-50"
          >
            In A4
          </button>
          <button
            type="button"
            onClick={handleExportWord}
            className="rounded border border-neutral-400 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-neutral-50"
          >
            Xuất Word
          </button>
        </div>

        <div className={`${PRINT_PAGE_CLASS} page-break flex flex-col gap-8 bg-white px-10 py-8 text-[17px] leading-[1.55]`}>
          <h1 className="border-b border-blue-700 pb-3 text-left text-[30px] font-bold uppercase leading-tight text-blue-950">
            FORM READY - OPEN / READY /TEST RUN - RELEASE (MÃ-PHẦN)
          </h1>

          <section>
            <h2 className="text-[25px] font-bold text-blue-950">1. THÔNG TIN CHUNG</h2>
            <div className="mt-2 grid grid-cols-2 gap-x-10 gap-y-2 text-[18px]">
              <p>MÃ ĐƠN: {data.PO || "__________"}</p>
              <p>MÃ - PHẦN: {data.MA || "__________"}</p>
              <p>KHÁCH HÀNG: {data.KH || "__________"}</p>
              <p>TÊN SẢN PHẨM: __________</p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-x-10 text-[18px]">
              <p>SỐ LƯỢNG: {data.SL || "__________"}</p>
              <p>CHUYỀN DỰ KIẾN: {data.CHUYEN || "__________"}</p>
            </div>
            <p className="mt-3 text-[18px]">NGÀY DỰ KIẾN RELEASE: _________</p>
          </section>

          <section>
            <h2 className="text-[25px] font-bold text-blue-950">2. CHECKLIST READY - NGUỒN KÝ</h2>
            <div className="mt-2 space-y-4">
              <div>
                <p className="font-bold">
                  [1] VẢI (Kho) &nbsp;&nbsp;&nbsp; <Cb /> Đúng mã vải &nbsp;&nbsp;&nbsp; <Cb /> Đúng số lượng
                  &nbsp;&nbsp;&nbsp; <Cb /> Không lỗi lớn
                </p>
                <p className="mt-2">Ký tên: _________ &nbsp; Thời gian: _________</p>
              </div>
              <div>
                <p className="font-bold">
                  [2] KHUÔN (Kỹ thuật) &nbsp;&nbsp;&nbsp; <Cb /> Đúng file thiết kế &nbsp;&nbsp;&nbsp; <Cb /> Đúng số màu
                  &nbsp;&nbsp;&nbsp; <Cb /> Không sai lệch
                </p>
                <p className="mt-2">Ký tên: _________ &nbsp; Thời gian: _________</p>
              </div>
              <div>
                <p className="font-bold">
                  [3] MỰC (Pha mực) &nbsp;&nbsp;&nbsp; <Cb /> Đúng công thức &nbsp;&nbsp;&nbsp; <Cb /> Đúng màu mẫu
                  &nbsp;&nbsp;&nbsp; <Cb /> Test đạt
                </p>
                <p className="mt-2">Ký tên: _________ &nbsp; Thời gian: _________</p>
              </div>
              <div>
                <p className="font-bold">
                  [4] MẪU DUYỆT (Kỹ thuật / Sale) &nbsp;&nbsp;&nbsp; <Cb /> Mẫu đã duyệt &nbsp;&nbsp;&nbsp; <Cb /> Khớp yêu
                  cầu khách
                </p>
                <p className="mt-2">Ký tên: _________ &nbsp; Thời gian: _________</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-[25px] font-bold text-blue-950">3. QC READY - CHECKPOINT</h2>
            <p className="mt-2">
              <Cb /> Đủ chữ ký các bộ phận &nbsp;&nbsp;&nbsp; <Cb /> Kiểm tra nhanh (vải / khuôn / mực)
              &nbsp;&nbsp;&nbsp; <Cb /> Đồng bộ logic (vải - mực - khuôn)
            </p>
            <p className="mt-2">
              KẾT LUẬN: &nbsp; <Cb /> OK → CHO RELEASE &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <Cb /> NOT OK → CHẶN
            </p>
            <p className="mt-2">Ký tên: _________ &nbsp; Thời gian: _________</p>
          </section>

          <section>
            <h2 className="text-[25px] font-bold text-blue-950">4. THÔNG TIN TEST</h2>
            <p className="mt-2">
              SỐ LƯỢNG TEST: &nbsp; <Cb /> 5 pcs &nbsp;&nbsp;&nbsp; <Cb /> 10 pcs &nbsp;&nbsp;&nbsp; <Cb /> 20 pcs
              &nbsp;&nbsp;&nbsp; <Cb /> Khác: _________
            </p>
            <p className="mt-2">MẪU ĐỐI CHIẾU: &nbsp; <Cb /> Mẫu duyệt khách &nbsp;&nbsp;&nbsp; <Cb /> Mẫu kỹ thuật chuẩn</p>
          </section>
        </div>

        <div className={`${PRINT_PAGE_CLASS} flex flex-col gap-8 bg-white px-10 py-8 text-[17px] leading-[1.55]`}>
          <section>
            <h2 className="text-[25px] font-bold text-blue-950">5. CHECKLIST TEST RUN</h2>
            <div className="mt-3 grid grid-cols-3 gap-7">
              <div className="space-y-2">
                <p className="font-bold">A. QC kiểm</p>
                <p>
                  <Cb /> Màu đúng
                </p>
                <p>
                  <Cb /> Độ nét đạt
                </p>
                <p>
                  <Cb /> Không lem màu
                </p>
                <p>
                  <Cb /> Không lệch vị trí in
                </p>
                <p>
                  <Cb /> Không lỗi lớn
                </p>
                <p>
                  <Cb /> Đúng tiêu chuẩn QC
                </p>
              </div>
              <div className="space-y-2">
                <p className="font-bold">B. CNSP kiểm</p>
                <p>
                  <Cb /> Đúng thông số kỹ thuật
                </p>
                <p>
                  <Cb /> Đúng độ bám mực
                </p>
                <p>
                  <Cb /> Không co rút sai chuẩn
                </p>
                <p>
                  <Cb /> Không lỗi kỹ thuật vận hành
                </p>
                <p>
                  <Cb /> Có thể chạy hàng loạt
                </p>
              </div>
              <div className="space-y-2">
                <p className="font-bold">C. Tổ trưởng chuyền xác nhận</p>
                <p>
                  <Cb /> Chuyền sẵn sàng chạy
                </p>
                <p>
                  <Cb /> Công nhân hiểu thao tác
                </p>
                <p>
                  <Cb /> Không còn điểm nghẽn
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-[25px] font-bold text-blue-950">6. KẾT LUẬN TEST RUN</h2>
            <p className="mt-2">
              <Cb /> OK → CHO CHẠY HÀNG LOẠT
            </p>
            <p className="mt-2">
              <Cb /> NOT OK → DỪNG / CHỈNH / TEST LẠI
            </p>
            <p className="mt-3">Lý do nếu NOT OK: ________________________________________________</p>
          </section>

          <section>
            <h2 className="text-[25px] font-bold text-blue-950">7. CHỮ KÝ BẮT BUỘC</h2>
            <div className="mt-2 space-y-3">
              <p>QC: __________________________</p>
              <p>CNSP: ________________________</p>
              <p>Tổ trưởng chuyền: ________________________</p>
              <p>Kế hoạch xác nhận RELEASE: ________________________</p>
              <p>Thời gian xác nhận: ________________________</p>
            </div>
          </section>

          <section>
            <h2 className="text-[25px] font-bold text-blue-950">8. GHI CHÚ LỖI (NẾU CÓ)</h2>
            <p className="mt-2">________________________________________________________________________________</p>
            <p className="mt-2">________________________________________________________________________________</p>
          </section>

          <section>
            <h2 className="text-[25px] font-bold text-blue-950">QUY TẮC BẮT BUỘC</h2>
            <p className="mt-2 text-[17px] font-bold text-red-600">❗ KHÔNG ĐỦ CHỮ KÝ → KHÔNG READY</p>
            <p className="text-[17px] font-bold text-red-600">❗ KHÔNG READY → KHÔNG ĐƯỢC RELEASE</p>
            <p className="text-[17px] font-bold text-red-600">❗ QC CÓ QUYỀN CHẶN</p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default FormReady;