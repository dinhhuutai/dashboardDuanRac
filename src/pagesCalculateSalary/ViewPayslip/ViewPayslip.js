// src/pages/Payroll/ViewPayslip.jsx
import React, { useEffect, useState } from 'react';
import http from '~/api/http';
import { BASE_URL } from '~/config';
import { useSelector } from 'react-redux';
import { userSelector } from '~/redux/selectors';
import { FaSpinner, FaBell, FaBellSlash, FaMoneyBillWave } from 'react-icons/fa';
import { registerPush } from '~/push/registerPush';

function fmtVND(x) {
  if (x == null || x === '') return '';
  const n = Number(String(x).replace(/[^\d.-]/g, ''));
  if (!Number.isFinite(n)) return String(x);
  return n.toLocaleString('vi-VN');
}

export default function ViewPayslip() {
  const tmp = useSelector(userSelector);
  const user = tmp?.login?.currentUser;

  // push states
  const [pushChecking, setPushChecking] = useState(true);
  const [pushReady, setPushReady] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushStatus, setPushStatus] = useState('');
  const [pushError, setPushError] = useState('');
  const [notifPerm, setNotifPerm] = useState('unknown');

  // data
  const [loading, setLoading] = useState(true);
  const [payslip, setPayslip] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const supported =
          typeof window !== 'undefined' &&
          'Notification' in window &&
          'serviceWorker' in navigator &&
          'PushManager' in window;

        if (!supported) {
          setNotifPerm('unsupported');
          setPushReady(false);
          setPushChecking(false);
          return;
        }
        setNotifPerm(Notification.permission);
        let hasSub = false;
        if (Notification.permission === 'granted') {
          try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();
            hasSub = !!sub;
          } catch {}
        }
        setPushReady(Notification.permission === 'granted' && hasSub);
      } finally {
        setPushChecking(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const rs = await http.get(`${BASE_URL}/api/payroll/me/latest`);
        setPayslip(rs.data?.data || null);
      } catch {
        setPayslip(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.userID]);

  async function handleEnablePush() {
    if (pushBusy) return;
    setPushError('');
    setPushStatus('');
    setPushBusy(true);
    try {
      await registerPush();
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setPushReady(!!sub);
      setPushStatus('Đã bật thông báo');
    } catch (e) {
      setPushError(e?.message || 'Không thể bật thông báo');
    } finally {
      setPushBusy(false);
      setTimeout(() => setPushStatus(''), 2500);
    }
  }

  async function unregisterPush() {
    if (pushBusy) return;
    setPushError('');
    setPushStatus('');
    setPushBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        try {
          await http.post(`${BASE_URL}/api/push/lunch-order/unsubscribe`, { endpoint: sub.endpoint });
        } catch {}
        await sub.unsubscribe();
      }
      setPushReady(false);
      setPushStatus('Đã tắt thông báo');
    } catch (e) {
      setPushError(e?.message || 'Không thể tắt thông báo');
    } finally {
      setPushBusy(false);
      setTimeout(() => setPushStatus(''), 2500);
    }
  }

  const isKyI = /KỲ\s*I/i.test(payslip?.title || '');

  function PairLine({ label, mid, right }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-700">{label}</span>
      <span className="tabular-nums">
        {(mid ?? '-') + ' | '}{right || '-'}
      </span>
    </div>
  );
}

function Line({ k, v, bold = false }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-700">{k}</span>
      <span className={`tabular-nums ${bold ? 'font-semibold text-slate-900' : 'text-slate-800'}`}>{v || '-'}</span>
    </div>
  );
}


  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="rounded-2xl p-5 border bg-white/80 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 grid place-items-center text-emerald-700">
              <FaMoneyBillWave />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-slate-800">Phiếu lương gần nhất</h1>
              <p className="text-slate-500 text-sm">Xem nhanh thông tin lương mới được cập nhật</p>
            </div>
          </div>

          {!pushChecking && (
            <div className="flex items-center gap-2">
              {!pushReady ? (
                <button
                  onClick={handleEnablePush}
                  disabled={pushBusy || notifPerm === 'denied'}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {pushBusy ? <FaSpinner className="animate-spin" /> : <FaBell />}
                  Bật thông báo
                </button>
              ) : (
                <button
                  onClick={unregisterPush}
                  disabled={pushBusy}
                  className="px-4 py-2 rounded-xl bg-slate-200 text-slate-800 hover:bg-slate-300 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {pushBusy ? <FaSpinner className="animate-spin" /> : <FaBellSlash />}
                  Tắt thông báo
                </button>
              )}
            </div>
          )}
        </div>

        {(pushError || pushStatus) && (
          <div
            className={`mt-3 rounded-xl p-3 text-sm ${
              pushError ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            {pushError || pushStatus}
          </div>
        )}

        <div className="mt-5 bg-white rounded-xl border shadow-sm p-0 overflow-hidden">
          {!payslip ? (
            <div className="p-5 text-slate-600">Chưa có phiếu lương nào.</div>
          ) : (
            <div className="p-4 md:p-6">
              {/* Header giống ảnh */}
              <div className="text-center border-b pb-3">
                <div className="font-semibold text-slate-800">CÔNG TY TNHH THUẬN HƯNG LONG AN</div>
                <div className="font-extrabold text-xl md:text-2xl text-slate-900 tracking-wide mt-1 uppercase">
                  {payslip?.title}
                </div>
              </div>

              {/* Thông tin MSTT/Bộ phận/MSNV */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm mt-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">MSTT:</span>
                  <span>{payslip.stt ?? '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">BỘ PHẬN:</span>
                  <span className="uppercase">{payslip.department || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">MSNV:</span>
                  <span>{payslip.msnv || '-'}</span>
                </div>
              </div>

              {/* TÊN */}
              <div className="mt-2 text-sm">
                <span className="font-semibold">HỌ VÀ TÊN:</span>
                <span className="ml-3 font-bold uppercase">{payslip.name || '-'}</span>
              </div>

              {/* ======= NHÁNH HIỂN THỊ THEO TITLE ======= */}
              {isKyI ? (
                /* ========= GIAO DIỆN HIỆN TẠI (Kỳ I) ========= */
                <div className="mt-4 border">
                  <table className="w-full text-sm">
                    <colgroup>
                      <col className="w-[55%]" />
                      <col className="w-[15%]" />
                      <col className="w-[30%]" />
                    </colgroup>
                    <tbody>
                      <Row left="Lương cơ bản" mid={fmtVND(payslip.basicSalary)} />
                      <Row left="Trách nhiệm" mid={fmtVND(payslip.responsibility)} />
                      <Row left="Tổng ngày công:" mid={payslip.totalWorkingDays} />
                      <Row left="Lễ:" mid={payslip.holiday} />
                      <Row left="Lương thực tế:" mid="" right={fmtVND(payslip.actualSalary)} strongRight />

                      <Sep />

                      <Row left="Giờ tăng ca 1,5" mid={payslip.ot15} right={fmtVND(payslip.otSalary15)} />
                      <Row left="Giờ tăng ca 1,8" mid={payslip.ot18} right={fmtVND(payslip.otSalary18)} />
                      <Row left="Phụ cấp T.ca (0.5 giờ)" mid={payslip.ot05} right={fmtVND(payslip.otSalary05)} />
                      <Row left="Phép năm:" mid={payslip.annualLeave} right={fmtVND(payslip.leavePay)} />
                      <Row left="Nhà trọ (xe):" mid="" right={fmtVND(payslip.rent)} />
                      <Row left="Thưởng chất lượng:" mid="" right={fmtVND(payslip.qualityBonus)} />

                      <Sep />

                      <Row
                        left="TỔNG LƯƠNG KỲ I:"
                        right={fmtVND(payslip.totalSalary)}
                        strongLeft
                        strongRight
                        bigRight
                      />
                    </tbody>
                  </table>
                </div>
              ) : (
                /* ========= GIAO DIỆN THÁNG (không Kỳ I) – giống ảnh: Thu nhập / Khấu trừ ========= */
<div className="mt-4 grid md:grid-cols-2 gap-6">
  {/* Thu nhập */}
  <div className="rounded-xl border border-slate-200 overflow-hidden">
    <div className="px-4 py-2 border-b font-semibold bg-slate-50 text-slate-700">THU NHẬP</div>
    <div className="p-4 text-sm space-y-1">
      <Line k="Lương cơ bản" v={fmtVND(payslip.basicSalary)} />
      <Line k="Trách nhiệm" v={fmtVND(payslip.responsibility)} />
      <Line k="Công hành chánh" v={payslip.conghanhchanh} />
      <Line k="Công ca đêm" v={payslip.congcadem} />
      <Line k="Tổng ngày công" v={payslip.totalWorkingDays} />
      <Line k="Nghỉ lễ" v={payslip.holiday} />
      <Line k="Lương thực tế" v={fmtVND(payslip.actualSalary)} bold />
      <Hr />

      {/* GHÉP TRÊN 1 HÀNG, 3 CỘT: Nhãn | SL/Giờ | Tiền */}
<PairRow label="Tăng ca 1,5" mid={payslip.ot15}  right={fmtVND(payslip.otSalary15)} />
<PairRow label="Tăng ca 1,8" mid={payslip.ot18}  right={fmtVND(payslip.otSalary18)} />
<PairRow label="Phụ cấp T.ca (0,5)" mid={payslip.ot05} right={fmtVND(payslip.otSalary05)} />
<PairRow label="Chủ nhật"       mid={payslip.chunhat} right={fmtVND(payslip.luongchunhat)} />

{/* Gộp Phép năm + Tiền phép trên 1 hàng */}
<PairRow label="Phép năm" mid={payslip.annualLeave} right={fmtVND(payslip.leavePay)} />

      <Line k="Chờ việc" v={fmtVND(payslip.choviec)} />
      <Line k="Nghỉ khác" v={fmtVND(payslip.nghikhac)} />
      <Line k="Lương chờ việc" v={fmtVND(payslip.luongchoviec)} />
      <Line k="Lương khác" v={fmtVND(payslip.luongkhac)} />

      <Line k="Nhà trọ / xe" v={fmtVND(payslip.rent)} />
      <Line k="Hỗ trợ nghỉ giữa ca" v={fmtVND(payslip.hotronghigiuaca)} />
      <Line k="Hỗ trợ ngày hành kinh" v={fmtVND(payslip.hotrongayhanhkinh)} />
      <Line k="Con nhỏ" v={fmtVND(payslip.connho)} />
      <Line k="Thưởng HQCV 1(CC)" v={fmtVND(payslip.thuong1CC)} />
      <Line k="Thưởng HQCV" v={fmtVND(payslip.qualityBonus)} />
      <Line k="Hỗ trợ khác" v={fmtVND(payslip.hotrokhac)} />
      <Line k="Thưởng lễ" v={fmtVND(payslip.thuongle)} />

      
{/* Tiền cơm: SL | Tiền */}
<PairRow label="Tiền cơm" mid={payslip.tiencomSL} right={fmtVND(payslip.tiencom)} />

    </div>

    <div className="px-4 py-2 border-t font-bold flex justify-between">
      <span>TỔNG LƯƠNG TRƯỚC KHẤU TRỪ</span>
      <span className="text-emerald-700">{fmtVND(payslip.totalSalary) || '-'}</span>
    </div>
  </div>

  {/* Khấu trừ + Net */}
  <div className="space-y-4">
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-2 border-b font-semibold bg-slate-50 text-slate-700">KHẤU TRỪ</div>
      <div className="p-4 text-sm space-y-1">
        <Line k="BHXH, BHYT, BHTN" v={fmtVND(payslip.ktbh)} />
        <Line k="Công đoàn" v={fmtVND(payslip.ktcongdoan)} />
        <Line k="Lương kỳ I" v={fmtVND(payslip.ktluongky1)} />
        <Line k="Trừ cơm" v={fmtVND(payslip.kttrucom)} />
        <Line k="Thuế TNCN" v={fmtVND(payslip.ktthue)} />
        <Line k="Khấu trừ khác" v={fmtVND(payslip.ktkhac)} />
      </div>
    </div>

    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex justify-between items-center">
      <span className="font-bold text-emerald-800">LƯƠNG THỰC LÃNH</span>
      <span className="font-bold text-emerald-900 text-lg">
        {fmtVND(payslip.luongthuclanh) || fmtVND(payslip.luongThucLanh) || fmtVND(payslip.net) || '-'}
      </span>
    </div>
  </div>
</div>

              )}

              <div className="text-[12px] text-slate-500 mt-2">
                * Số liệu được làm tròn và chỉ mang tính chất tham khảo nội bộ.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------ small UI helpers ------------ */
function Row({ left, mid, right, strongLeft = false, strongRight = false, bigRight = false }) {
  return (
    <tr className="border-b last:border-b-0">
      <td className={`px-3 py-2 border-r ${strongLeft ? 'font-bold' : 'font-medium'} text-slate-800`}>{left}</td>
      <td className="px-3 py-2 border-r text-right tabular-nums">{mid ?? ''}</td>
      <td
        className={`px-3 py-2 text-right tabular-nums ${
          strongRight ? 'font-bold text-slate-900' : 'text-slate-800'
        } ${bigRight ? 'text-lg' : ''}`}
      >
        {right ?? ''}
      </td>
    </tr>
  );
}

function Sep() {
  return (
    <tr>
      <td colSpan={3} className="p-0">
        <div className="border-t-2 border-slate-700" />
      </td>
    </tr>
  );
}

function Line({ k, v, bold = false }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-700">{k}</span>
      <span className={`tabular-nums ${bold ? 'font-semibold text-slate-900' : 'text-slate-800'}`}>{v || '-'}</span>
    </div>
  );
}

function Hr() {
  return <div className="my-1 border-t" />;
}

function PairRow({ label, mid, right, boldRight = false }) {
  return (
    <div className="grid grid-cols-[1fr,88px,132px] items-baseline gap-3">
      <span className="text-slate-700">{label}</span>
      <span className="text-right tabular-nums text-slate-800">
        {mid ?? '-'}
      </span>
      <span className={`text-right tabular-nums ${boldRight ? 'font-semibold text-slate-900' : 'text-slate-800'}`}>
        {right || '-'}
      </span>
    </div>
  );
}
