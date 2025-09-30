import React, { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { userSelector, weightSelector } from '~/redux/selectors';
import { FaSpinner } from 'react-icons/fa';
import { BASE_URL } from '~/config/index';
import mqtt from 'mqtt';
import http from '~/api/http';
import axios from 'axios';

const MQTT_BROKER = 'wss://broker.hivemq.com:8884/mqtt';
const MQTT_TOPIC = 'thla/canrac';

function Scan() {
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);
  const mediaStreamRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [jsonData, setJsonData] = useState(null);
  const [khoiLuong, setKhoiLuong] = useState('');
  const [resultVisible, setResultVisible] = useState(false);
  const [messageModal, setMessageModal] = useState(null);
  const [wrongTeamModal, setWrongTeamModal] = useState(false);

  const [teamMembers, setTeamMembers] = useState([]);
  const [tenNguoiCan, setTenNguoiCan] = useState('');

  const tmp = useSelector(userSelector);
  const weightScale = useSelector(weightSelector);
  const [user, setUser] = useState({});

  const [workShift, setWorkShift] = useState('ca1');
  // Chuẩn hóa date cho input
  const todayStr = new Date().toISOString().split('T')[0];
  const [workDate, setWorkDate] = useState(todayStr);

  const [isWorkShift, setIsWorkShift] = useState(true);
  const [isWorkDate, setIsWorkDate] = useState(true);

  const workShifts = ['ca1', 'ca2', 'ca3', 'dai1', 'dai2', 'cahc'];

  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [confirmedData, setConfirmedData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [alreadyWeighedData, setAlreadyWeighedData] = useState(null);

  // MQTT live weight
  useEffect(() => {
    const client = mqtt.connect(MQTT_BROKER);
    client.on('connect', () => client.subscribe(MQTT_TOPIC));
    client.on('message', (_topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data?.weight) setKhoiLuong(data.weight);
      } catch {}
    });
    return () => client.end();
  }, []);

  useEffect(() => { setUser(tmp?.login?.currentUser); }, [tmp]);
  useEffect(() => { setKhoiLuong(weightScale?.weight); }, [weightScale]);

  // useEffect(() => {
  //   if (user?.userID) {
  //     axios
  //       .get(`${BASE_URL}/api/team-members`, { params: { userID: user.userID } })
  //       .then((res) => {
  //         const data = res.data || [];
  //         setTeamMembers(data);
  //         if (data.length === 0) {
  //           setTenNguoiCan(user?.fullName);
  //         }
  //       })
  //       .catch(() => setTeamMembers([]));
  //   }
  // }, [user]);


  const initScanner = async () => {
    setLoading(true);
    if (!videoRef.current) return;
    qrScannerRef.current = new QrScanner(
      videoRef.current,
      async (result) => {
        try {
          const decodedStr = decodeURIComponent(result.data);
          const parsed = JSON.parse(decodedStr);

          if(parsed?.id && !parsed?.d) {
            //Lấy api có thông tin của QR
            const res = await axios.get(`${BASE_URL}/api/trash-bins/${parsed.id}/details`);

            const jsonDataTmp = {
              id: res?.data.data.trashBinCode,
              d: res?.data.data.departmentName,
              u: res?.data.data.unitName,
              t: res?.data.data.trashName,
            }
            
            setJsonData(jsonDataTmp);

          } else {
            setJsonData(parsed);
          }

          if (user?.role === 'admin') {
            setResultVisible(true);
          } else if (user?.role === 'user') {
            const userTeam = (user?.fullName || '').toLowerCase();
            const qrTeam = (parsed?.d || '').toLowerCase();
            if (qrTeam && userTeam && qrTeam.includes(userTeam)) setResultVisible(true);
            else setWrongTeamModal(true);
          }
        } catch (err) {
          console.error('Parse JSON error:', err);
        }
      },
      {
        highlightScanRegion: true,
        highlightCodeOutline: true,
        preferredCamera: 'environment',
        maxScansPerSecond: 10,
        returnDetailedScanResult: true,
        onDecodeError: () => {},
        calculateScanRegion: () => ({
          x: 0,
          y: 0,
          width: videoRef.current.videoWidth,
          height: videoRef.current.videoHeight,
        }),
      }
    );

    qrScannerRef.current
      .start({
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      })
      .then(() => {
        mediaStreamRef.current = videoRef.current.srcObject;
      })
      .catch((err) => console.error('Không thể khởi động camera:', err));
  
    setLoading(false);
  
  };

  // mount/unmount
  useEffect(() => {
    if (user) initScanner();
    return () => {
      qrScannerRef.current?.stop();
      qrScannerRef.current?.destroy();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
    };
  }, [user]);

  // pause khi mở modal
  useEffect(() => {
    const paused = resultVisible || wrongTeamModal || reviewModalVisible || editModalVisible;
    if (paused) {
      qrScannerRef.current?.stop();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
    } else {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
      }
      initScanner();
    }
  }, [resultVisible, wrongTeamModal, reviewModalVisible, editModalVisible]);

  const handleConfirm = async () => {
    if (!khoiLuong || isNaN(parseFloat(khoiLuong))) {
      setMessageModal({ type: 'error', message: 'Vui lòng nhập khối lượng hợp lệ' });
      return;
    }
    if (!workShift || !workDate) {
      setMessageModal({ type: 'error', message: 'Vui lòng chọn ca làm và ngày làm việc' });
      return;
    }

    setLoading(true);
    const nowUTC7 = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
    let weight = parseFloat(khoiLuong);

    const adjustments = {
      'Giẻ lau có chứa thành phần nguy hại': 0,
      'Vụn logo': 0,
      'Mực in thải': 0,
      'Keo bàn thải': 0,
      'Băng keo dính mực': 0,
      'Rác sinh hoạt': 0,
      'Lụa căng khung': 0,
    };
    if (jsonData?.t && adjustments[jsonData.t]) weight = Math.max(0, weight - adjustments[jsonData.t]);
    weight = parseFloat(weight.toFixed(1));

    const payload = {
      trashBinCode: jsonData?.id,
      userID: user.userID,
      weighingTime: nowUTC7.toISOString(),
      weightKg: weight,
      updatedAt: nowUTC7.toISOString(),
      updatedBy: user.userID,
      workShift: isWorkShift ? workShift : null,
      workDate: isWorkDate ? workDate : null,
      userName: tenNguoiCan,
    };

    try {
      const res = await axios.post(`${BASE_URL}/trash-weighings`, payload);

      if (res.status === 200) {
        const result = await res.data;
        const savedPayload = { ...payload, id: result.id, d: jsonData?.d, u: jsonData?.u, t: jsonData?.t };
        setConfirmedData(savedPayload);
        setReviewModalVisible(true);
      } else {
        const errText = await res.text();
        setMessageModal({ type: 'error', message: `❌ Lỗi: ${errText || 'Không thể lưu dữ liệu cân rác'}` });
      }
    } catch {
      setMessageModal({ type: 'error', message: '❌ Lỗi kết nối: Không thể kết nối đến server' });
    } finally {
      setLoading(false);
      setResultVisible(false);
      setJsonData(null);
      setKhoiLuong('');
    }
  };

  const checkIfWeighed = async () => {
    if (!khoiLuong || isNaN(parseFloat(khoiLuong))) {
      setMessageModal({ type: 'error', message: 'Vui lòng nhập khối lượng hợp lệ' });
      return null;
    }
    if (!workShift || !workDate) {
      setMessageModal({ type: 'error', message: 'Vui lòng chọn ca làm và ngày làm việc' });
      return null;
    }


    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/trash-weighings/check`, {
        params: {
          trashBinCode: jsonData?.id,
          workShift,
          workDate
        }
      });

      return await res.data;
    } catch (error) {
      console.error('❌ Lỗi kiểm tra cân:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleCheckAndConfirm = async () => {
    if (!khoiLuong || isNaN(parseFloat(khoiLuong))) {
      setMessageModal({ type: 'error', message: 'Vui lòng nhập khối lượng hợp lệ' });
      return;
    }
    if (!workShift || !workDate) {
      setMessageModal({ type: 'error', message: 'Vui lòng chọn ca làm và ngày làm việc' });
      return;
    }

    const checkResult = await checkIfWeighed();
    if (checkResult?.alreadyWeighed && isWorkDate && isWorkShift) {
      setAlreadyWeighedData({
        id: checkResult.existingData.id,
        trashBinCode: checkResult.existingData.trashBinCode,
        workDate: checkResult.existingData.workDate.split('T')[0],
        workShift: checkResult.existingData.workShift,
        weightKg: checkResult.existingData.weightKg,
      });
    } else {
      await handleConfirm();
    }
  };

  // ---------- UI ----------
  return (
    <div className="relative min-h-[100dvh] w-full bg-gradient-to-b from-sky-50 via-white to-emerald-50">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-[28rem] w-[28rem] rounded-full bg-sky-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-28 h-[32rem] w-[32rem] rounded-full bg-emerald-200/50 blur-3xl" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Quét mã QR thùng rác</h1>
          <p className="text-slate-600 mt-1">Đưa mã QR vào khung để hệ thống tự nhận diện.</p>
        </div>

        {/* Camera card */}
        <div className="mx-auto max-w-xl">
          <div className="relative rounded-3xl bg-white/70 backdrop-blur-md border border-white shadow-[0_20px_60px_-20px_rgba(2,6,23,.2)] p-3">
            <div className="relative w-full h-[420px] md:h-[520px] rounded-2xl overflow-hidden ring-1 ring-white/60 bg-slate-900/5">
              <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" />

              {/* subtle vignette */}
              <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_120px_rgba(2,6,23,.35)]" />

              {/* scan frame */}
              <div className="pointer-events-none absolute inset-10 md:inset-12 rounded-2xl border-2 border-white/30" />
              {/* corner markers */}
              <div className="pointer-events-none absolute inset-10 md:inset-12">
                <span className="absolute -left-1 -top-1 h-8 w-8 border-l-4 border-t-4 border-emerald-400 rounded-tl-lg" />
                <span className="absolute -right-1 -top-1 h-8 w-8 border-r-4 border-t-4 border-emerald-400 rounded-tr-lg" />
                <span className="absolute -left-1 -bottom-1 h-8 w-8 border-l-4 border-b-4 border-emerald-400 rounded-bl-lg" />
                <span className="absolute -right-1 -bottom-1 h-8 w-8 border-r-4 border-b-4 border-emerald-400 rounded-br-lg" />
              </div>

              {/* scanning line */}
              <motion.div
                className="pointer-events-none absolute left-12 right-12 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
                initial={{ top: '20%' }}
                animate={{ top: ['20%', '80%', '20%'] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>

            {/* Status row */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-xs font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Sẵn sàng quét
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 text-sky-700 border border-sky-200 px-3 py-1 text-xs font-medium">
                ⚖️ Khối lượng: <strong>{khoiLuong || '—'}</strong> kg
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 text-xs font-medium">
                MQTT: Live
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- MODALS (glass) ---------- */}
      <AnimatePresence>
        {resultVisible && jsonData && (
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setResultVisible(false); setJsonData(null); setKhoiLuong(''); }}
          >
            <motion.div
              className="bg-white/95 backdrop-blur-md text-slate-900 p-6 rounded-2xl border border-white shadow-xl w-full max-w-md mx-4 space-y-4 max-h-[85%] overflow-y-auto"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <h3 className="text-lg font-bold">Thông tin thùng rác</h3>
                <p className="text-slate-500 text-sm">Vui lòng nhập khối lượng và xác nhận.</p>
              </div>

              <div className="grid gap-2 text-sm">
                <div className="flex"><span className="font-semibold">📍 Bộ phận/Khu vực:</span><span className="ml-2">{jsonData?.d || ''}</span></div>
                <div className="flex"><span className="font-semibold">🏭 Đơn vị:</span><span className="ml-2">{jsonData?.u || ''}</span></div>
                <div className="flex"><span className="font-semibold">🗑️ Loại rác:</span><span className="ml-2">{jsonData?.t || ''}</span></div>
              </div>

              <div className="text-sm">
                <label className="font-semibold block mb-1">⚖️ Nhập khối lượng:</label>
                <input
                  type="text"
                  inputMode="decimal"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 outline-none"
                  placeholder="VD: 5.25"
                  value={khoiLuong}
                  onChange={(e) => setKhoiLuong(e.target.value.replace(',', '.'))}
                />
              </div>

              <div className="text-sm">
                <label className="font-semibold block mb-1">🕓 Ca làm việc:</label>
                {user?.role === 'admin' && (
                  <div className="flex items-center gap-6 mb-3">
                    <label className="flex items-center gap-2"><input type="radio" name="shift" checked={isWorkShift === true} onChange={() => setIsWorkShift(true)} /><span>Có ca</span></label>
                    <label className="flex items-center gap-2"><input type="radio" name="shift" checked={isWorkShift === false} onChange={() => setIsWorkShift(false)} /><span>Không ca</span></label>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {isWorkShift ? (
                    workShifts.map((shift) => (
                      <button
                        key={shift}
                        onClick={() => setWorkShift(shift)}
                        className={`px-3 py-2 rounded-full text-xs border transition ${
                          workShift === shift
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                        }`}
                      >
                        {shift === 'ca1'
                          ? 'Ca Ngắn 1 (06–14h)'
                          : shift === 'ca2'
                          ? 'Ca Ngắn 2 (14–22h)'
                          : shift === 'ca3'
                          ? 'Ca Ngắn 3 (22–06h)'
                          : shift === 'dai1'
                          ? 'Ca Dài 1 (06–18h)'
                          : shift === 'dai2'
                          ? 'Ca Dài 2 (18–06h)'
                          : 'Hành chính (07:30–16:30)'}
                      </button>
                    ))
                  ) : (
                    <span className="px-3 py-2 rounded-full text-xs bg-rose-100 text-rose-700 border border-rose-200">Tem không để ca</span>
                  )}
                </div>
              </div>

              <div className="text-sm">
                <label className="font-semibold block mb-1">📅 Ngày làm việc:</label>
                {user?.role === 'admin' && (
                  <div className="flex items-center gap-6 mb-3">
                    <label className="flex items-center gap-2"><input type="radio" name="date" checked={isWorkDate === true} onChange={() => setIsWorkDate(true)} /><span>Có ngày</span></label>
                    <label className="flex items-center gap-2"><input type="radio" name="date" checked={isWorkDate === false} onChange={() => setIsWorkDate(false)} /><span>Không ngày</span></label>
                  </div>
                )}
                {isWorkDate ? (
                  <input
                    type="date"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 outline-none"
                    value={workDate}
                    onChange={(e) => setWorkDate(e.target.value)}
                  />
                ) : (
                  <span className="px-3 py-2 rounded-full text-xs bg-rose-100 text-rose-700 border border-rose-200">Tem không để ngày</span>
                )}
              </div>

              <div className="text-sm">
                <label className="font-semibold block mb-1">Ghi chú:</label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 outline-none"
                  placeholder="VD: Nguyễn Văn A"
                  value={tenNguoiCan}
                  onChange={(e) => setTenNguoiCan(e.target.value)}
                />
              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => { setResultVisible(false); setJsonData(null); setKhoiLuong(''); }}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
                >
                  Đóng
                </button>
                <button
                  onClick={handleCheckAndConfirm}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow hover:from-emerald-700 hover:to-teal-700 flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  {loading ? (<><FaSpinner className="animate-spin" /> Đang gửi...</>) : 'Xác nhận'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ĐÃ CÂN TRƯỚC ĐÓ */}
      <AnimatePresence>
        {alreadyWeighedData && (
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setAlreadyWeighedData(null)}
          >
            <motion.div
              className="bg-white/95 backdrop-blur-md text-slate-900 p-6 rounded-2xl border border-white shadow-xl w-full max-w-md mx-4 space-y-4"
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold">⚠️ Đã cân rác</h2>
              <p className="text-sm text-slate-600">
                Thùng <strong>{alreadyWeighedData.trashBinCode}</strong> đã được cân trong ca <strong>{alreadyWeighedData.workShift}</strong> ngày <strong>{alreadyWeighedData.workDate}</strong>.
              </p>
              <p className="text-sm text-slate-600">⚖️ Khối lượng đã lưu: <strong>{alreadyWeighedData.weightKg} kg</strong></p>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => {
                    setAlreadyWeighedData(null);
                    setLoading(false);
                    setResultVisible(false);
                    setJsonData(null);
                    setKhoiLuong('');
                    setMessageModal({ type: 'info', message: '⛔ Đã hủy lượt cân này!' });
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
                >
                  ❌ Hủy lượt cân
                </button>
                <button
                  disabled={loading}
                  onClick={async () => { await handleConfirm(); setAlreadyWeighedData(null); }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow hover:from-sky-700 hover:to-blue-700"
                >
                  {loading ? (<><FaSpinner className="animate-spin" /> Đang lưu...</>) : 'Tiếp tục lưu'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REVIEW */}
      {reviewModalVisible && confirmedData && (
        <motion.div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => setReviewModalVisible(false)}
        >
          <motion.div
            className="bg-white/95 backdrop-blur-md text-slate-900 p-6 rounded-2xl border border-white shadow-xl w-full max-w-md mx-4 space-y-4"
            initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold mb-2">📋 Thông tin đã lưu</h2>
            <div className="space-y-1 text-sm">
              <p><strong>Mã thùng rác:</strong> {confirmedData?.trashBinCode}</p>
              <div className="flex"><p className="font-semibold">📍 Bộ phận/Khu vực:</p><p className="ml-2">{confirmedData?.d || ''}</p></div>
              <div className="flex"><p className="font-semibold">🏭 Đơn vị:</p><p className="ml-2">{confirmedData?.u || ''}</p></div>
              <div className="flex"><p className="font-semibold">🗑️ Loại rác:</p><p className="ml-2">{confirmedData?.t || ''}</p></div>
              <p><strong>Khối lượng:</strong> {confirmedData?.weightKg} kg</p>
              <p>
                <strong>Ca làm:</strong>{' '}
                {isWorkShift ? (
                  confirmedData.workShift === 'ca1'
                    ? 'Ca Ngắn 1 (06–14h)'
                    : confirmedData.workShift === 'ca2'
                    ? 'Ca Ngắn 2 (14–22h)'
                    : confirmedData.workShift === 'ca3'
                    ? 'Ca Ngắn 3 (22–06h)'
                    : confirmedData.workShift === 'dai1'
                    ? 'Ca Dài 1 (06–18h)'
                    : confirmedData.workShift === 'dai2'
                    ? 'Ca Dài 2 (18–06h)'
                    : 'Hành chính (07:30–16:30)'
                ) : (
                  <span className="px-2 py-1 rounded-full text-xs bg-rose-100 text-rose-700 border border-rose-200">Tem không để ca</span>
                )}
              </p>
              <p>
                <strong>Ngày:</strong>{' '}
                {isWorkDate ? (() => {
                  const d = new Date(confirmedData.workDate);
                  const day = String(d.getDate()).padStart(2, '0');
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  const year = d.getFullYear();
                  return `${day}-${month}-${year}`;
                })() : (
                  <span className="px-2 py-1 rounded-full text-xs bg-rose-100 text-rose-700 border border-rose-200">Tem không để ngày</span>
                )}
              </p>
              <p><strong>Ghi chú:</strong> {confirmedData.userName}</p>
            </div>

            <div className="flex justify-between pt-2">
              <button
                onClick={() => { setReviewModalVisible(false); setEditModalVisible(true); }}
                className="px-4 py-2 rounded-xl bg-amber-500 text-white hover:bg-amber-600"
              >
                ✏️ Chỉnh sửa
              </button>
              <button
                onClick={() => { setReviewModalVisible(false); setMessageModal({ type: 'success', message: '✅ Đã lưu dữ liệu cân rác thành công!' }); }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700"
              >
                ✅ Tiếp tục
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* EDIT */}
      <AnimatePresence>
        {editModalVisible && confirmedData && (
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setEditModalVisible(false)}
          >
            <motion.div
              className="bg-white/95 backdrop-blur-md text-slate-900 p-6 rounded-2xl border border-white shadow-xl w-full max-w-md mx-4 space-y-4"
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold">✏️ Chỉnh sửa thông tin</h2>

              <div className="text-sm">
                <label className="block mb-1 font-semibold">⚖️ Khối lượng:</label>
                <input
                  type="text"
                  inputMode="decimal"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 outline-none"
                  value={confirmedData.weightKg}
                  onChange={(e) => setConfirmedData({ ...confirmedData, weightKg: parseFloat(e.target.value.replace(',', '.')) || 0 })}
                />
              </div>

              <div className="text-sm">
                <label className="block mb-1 font-semibold">🕓 Ca làm:</label>
                {user?.role === 'admin' && (
                  <div className="flex items-center gap-6 mb-3">
                    <label className="flex items-center gap-2"><input type="radio" checked={isWorkShift === true} onChange={() => setIsWorkShift(true)} /><span>Có ca</span></label>
                    <label className="flex items-center gap-2"><input type="radio" checked={isWorkShift === false} onChange={() => setIsWorkShift(false)} /><span>Không ca</span></label>
                  </div>
                )}
                <div>
                  {isWorkShift ? (
                    <select
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 outline-none"
                      value={confirmedData.workShift}
                      onChange={(e) => setConfirmedData({ ...confirmedData, workShift: e.target.value })}
                    >
                      <option value="ca1">Ca Ngắn 1 (06–14h)</option>
                      <option value="ca2">Ca Ngắn 2 (14–22h)</option>
                      <option value="ca3">Ca Ngắn 3 (22–06h)</option>
                      <option value="dai1">Ca Dài 1 (06–18h)</option>
                      <option value="dai2">Ca Dài 2 (18–06h)</option>
                      <option value="cahc">Hành chính (07:30–16:30)</option>
                    </select>
                  ) : (
                    <span className="px-3 py-2 rounded-full text-xs bg-rose-100 text-rose-700 border border-rose-200">Tem không để ca</span>
                  )}
                </div>
              </div>

              <div className="text-sm">
                <label className="block mb-1 font-semibold">📅 Ngày làm việc:</label>
                {user?.role === 'admin' && (
                  <div className="flex items-center gap-6 mb-3">
                    <label className="flex items-center gap-2"><input type="radio" checked={isWorkDate === true} onChange={() => setIsWorkDate(true)} /><span>Có ngày</span></label>
                    <label className="flex items-center gap-2"><input type="radio" checked={isWorkDate === false} onChange={() => setIsWorkDate(false)} /><span>Không ngày</span></label>
                  </div>
                )}
                {isWorkDate ? (
                  <input
                    type="date"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 outline-none"
                    value={confirmedData.workDate}
                    onChange={(e) => setConfirmedData({ ...confirmedData, workDate: e.target.value })}
                  />
                ) : (
                  <span className="px-3 py-2 rounded-full text-xs bg-rose-100 text-rose-700 border border-rose-200">Tem không để ngày</span>
                )}
              </div>

              <div className="text-sm">
                <label className="block mb-1 font-semibold">Ghi chú:</label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 outline-none"
                  value={confirmedData.userName}
                  onChange={(e) => setConfirmedData({ ...confirmedData, userName: e.target.value })}
                />
              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => { setEditModalVisible(false); setMessageModal({ type: 'success', message: '✅ Đã lưu dữ liệu cân rác thành công!' }); }}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
                >
                  ❌ Hủy
                </button>
                <button
                  onClick={async () => {
                    setIsSaving(true);
                    const nowUTC7 = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
                    try {
                      const res = await axios.put(`${BASE_URL}/trash-weighings/${confirmedData.id}`, {
                        ...confirmedData,
                        updatedAt: nowUTC7.toISOString(),
                        updatedBy: user.userID
                      });

                      if (res.status === 200) setMessageModal({ type: 'success', message: '✅ Đã chỉnh sửa dữ liệu thành công!' });
                      else setMessageModal({ type: 'error', message: `❌ Lỗi: ${await res.text()}` });
                    } catch {
                      setMessageModal({ type: 'error', message: '❌ Không thể kết nối server!' });
                    } finally {
                      setEditModalVisible(false);
                      setIsSaving(false);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow hover:from-sky-700 hover:to-blue-700 flex items-center justify-center"
                >
                  {isSaving ? <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : '💾 Lưu'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOAST */}
      <AnimatePresence>
        {messageModal && (
          <motion.div
            className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-[50]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMessageModal(null)}
          >
            <motion.div
              className="bg-white/95 backdrop-blur-md text-slate-900 p-6 rounded-2xl border border-white shadow-xl space-y-4 w-full max-w-md mx-4"
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }} onClick={(e) => e.stopPropagation()}
            >
              <p className={`text-sm ${messageModal.type === 'error' ? 'text-rose-600' : messageModal.type === 'success' ? 'text-emerald-600' : 'text-slate-700'}`}>
                {messageModal.message}
              </p>
              <div className="flex justify-end pt-2">
                <button onClick={() => setMessageModal(null)} className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800">
                  Đóng
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sai tổ */}
      <AnimatePresence>
        {wrongTeamModal && (
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setWrongTeamModal(false)}
          >
            <motion.div
              className="bg-white/95 backdrop-blur-md text-slate-900 p-6 rounded-2xl border border-white shadow-xl space-y-4 w-full max-w-md mx-4"
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }} onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center">
                <img src="https://media1.tenor.com/m/Ygxb5vbxoKAAAAAC/tontonfriends-shocked.gif" alt="funny" className="w-28 h-28 rounded-xl object-cover" />
              </div>
              <p className="font-semibold text-center">
                🐤 Ối dồi ôi! Mã QR này không thuộc tổ của bạn rồi 😅 Quét lại nhé!
              </p>
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => { setWrongTeamModal(false); setJsonData(null); setKhoiLuong(''); setResultVisible(false); }}
                  className="px-4 py-2 rounded-xl bg-sky-600 text-white hover:bg-sky-700"
                >
                  Quét lại
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Scan;
