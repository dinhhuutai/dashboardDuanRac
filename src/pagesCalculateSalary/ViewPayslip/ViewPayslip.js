
// src/pages/Payroll/ViewPayslip.jsx
import React, { useEffect, useState } from 'react';
import http from '~/api/http';
import { BASE_URL } from '~/config';
import { useSelector } from 'react-redux';
import { userSelector } from '~/redux/selectors';
import { FaSpinner, FaBell, FaBellSlash, FaMoneyBillWave } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

import { registerPush } from "~/push/registerPush";

function fmtVND(x) {
  if (x == null || x === '') return '';
  const n = Number(String(x).replace(/[^\d.-]/g, ''));
  if (Number.isNaN(n)) return String(x);
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
    // Check push capability
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
    // Load latest payslip
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
      setPushError("");
      setPushStatus("");
      setPushBusy(true);
      try {
        await registerPush();
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setPushReady(!!sub);
        setPushStatus("Đã bật thông báo");
      } catch (e) {
        setPushError(e?.message || "Không thể bật thông báo");
      } finally {
        setPushBusy(false);
        setTimeout(() => setPushStatus(""), 2500);
      }
    }
  
    async function unregisterPush() {
      if (pushBusy) return;
      setPushError("");
      setPushStatus("");
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
        setPushStatus("Đã tắt thông báo");
      } catch (e) {
        setPushError(e?.message || "Không thể tắt thông báo");
      } finally {
        setPushBusy(false);
        setTimeout(() => setPushStatus(""), 2500);
      }
    }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4 md:p-6">
      {/* Header */}
      <div className="max-w-5xl mx-auto">
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
          <div className={`mt-3 rounded-xl p-3 text-sm ${pushError ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
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

      {/* Dòng thông tin MSTT/Bộ phận */}
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

      {/* Họ tên */}
      <div className="mt-2 text-sm">
        <span className="font-semibold">HỌ VÀ TÊN:</span>
        <span className="ml-3 font-bold uppercase">{payslip.name || '-'}</span>
      </div>

      {/* BẢNG CHI TIẾT – 3 cột giống form: Chỉ tiêu | Giá trị | Thành tiền */}
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
              mid=""
              right={fmtVND(payslip.totalSalary)}
              strongLeft
              strongRight
              bigRight
            />
          </tbody>
        </table>
      </div>

      {/* Ghi chú nhỏ (tuỳ chọn) */}
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

function Card({ label, value, highlight = false }) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? 'bg-emerald-50 border-emerald-200' : 'bg-white/60 border-slate-200'}`}>
      <div className={`text-xs ${highlight ? 'text-emerald-700' : 'text-slate-500'}`}>{label}</div>
      <div className={`mt-1 text-base font-semibold ${highlight ? 'text-emerald-800' : 'text-slate-800'}`}>{value ?? '-'}</div>
    </div>
  );
}

function Row({ left, mid, right, strongLeft = false, strongRight = false, bigRight = false }) {
  return (
    <tr className="border-b last:border-b-0">
      <td className={`px-3 py-2 border-r ${strongLeft ? 'font-bold' : 'font-medium'} text-slate-800`}>
        {left}
      </td>
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


