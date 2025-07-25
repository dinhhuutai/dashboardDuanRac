import React, { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { userSelector, weightSelector } from '~/redux/selectors';
import { FaSpinner } from 'react-icons/fa';
import { BASE_URL } from '~/config/index';
import mqtt from "mqtt";

const MQTT_BROKER = "wss://broker.hivemq.com:8884/mqtt";
const MQTT_TOPIC = "thla/canrac";

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
  const [workDate, setWorkDate] = useState(new Date());

  const [isWorkShift, setIsWorkShift] = useState(true);
  const [isWorkDate, setIsWorkDate] = useState(true);

  const workShifts = ['ca1', 'ca2', 'ca3', 'dai1', 'dai2', 'cahc'];

  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [confirmedData, setConfirmedData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [alreadyWeighedData, setAlreadyWeighedData] = useState(null);
  
  useEffect(() => {
    const client = mqtt.connect(MQTT_BROKER);

    client.on("connect", () => {
      client.subscribe(MQTT_TOPIC);
    });

    client.on("message", (topic, message) => {
      const data = JSON.parse(message.toString());
      if (data?.weight) setKhoiLuong(data.weight);
    });

    return () => client.end();
  }, []);

  useEffect(() => {
    setUser(tmp?.login?.currentUser);
  }, [tmp]);

  useEffect(() => {
    setKhoiLuong(weightScale?.weight);
  }, [weightScale]);

  useEffect(() => {
    if (user?.userID) {
      fetch(`${BASE_URL}/api/team-members?userID=${user.userID}`)
        .then((res) => res.json())
        .then((data) => {
          setTeamMembers(data);
          if (teamMembers.length === 0) {
            setTenNguoiCan(user?.fullName);
          }
        })
        .catch((err) => {
          console.error('Lỗi khi tải teamMembers:', err);
          setTeamMembers([]);
        });
    }
  }, [user]);

  const initScanner = () => {
    if (!videoRef.current) return;

    qrScannerRef.current = new QrScanner(
      videoRef.current,
      (result) => {
        try {
          const decodedStr = decodeURIComponent(result.data);
          const parsed = JSON.parse(decodedStr);
          setJsonData(parsed);

          if (user?.role === 'admin') {
            setResultVisible(true);
          } else if (user?.role === 'user') {
            const userTeam = user?.fullName?.toLowerCase(); // hoặc user.teamName nếu có
            const qrTeam = parsed?.d?.toLowerCase();
            if (qrTeam && userTeam && qrTeam.includes(userTeam)) {
              setResultVisible(true);
            } else {
              setWrongTeamModal(true);
            }
          }
        } catch (err) {
          console.error('Lỗi khi parse JSON:', err);
        }
      },
      {
        highlightScanRegion: true,
        highlightCodeOutline: true,
        preferredCamera: 'environment',
        maxScansPerSecond: 10,
        // 👇 Cấu hình constraints cho camera
        returnDetailedScanResult: true,
        onDecodeError: (err) => console.warn('Decode error', err),
        calculateScanRegion: () => ({
          x: 0,
          y: 0,
          width: videoRef.current.videoWidth,
          height: videoRef.current.videoHeight,
        }),
      },
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
      .catch((err) => {
        console.error('Không thể khởi động camera:', err);
      });
  };

  useEffect(() => {
    if (user) {
      initScanner();
    }
    return () => {
      qrScannerRef.current?.stop();
      qrScannerRef.current?.destroy();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, [user]);

  useEffect(() => {
    if (resultVisible || wrongTeamModal || reviewModalVisible || editModalVisible) {
      qrScannerRef.current?.stop();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
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

    if (jsonData?.t && adjustments[jsonData.t]) {
      weight = Math.max(0, weight - adjustments[jsonData.t]);
    }

    weight = parseFloat(weight.toFixed(1));

    const payload = {
      trashBinCode: jsonData?.id,
      userID: user.userID,
      weighingTime: nowUTC7.toISOString(),
      weightKg: weight,
      updatedAt: nowUTC7.toISOString(),
      updatedBy: user.userID,
      workShift: isWorkShift ? workShift : null,
      workDate: isWorkDate ? new Date(workDate).toISOString().split('T')[0] : null,
      userName: tenNguoiCan,
    };

    try {
      const res = await fetch(`${BASE_URL}/trash-weighings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await res.json();
        const savedPayload = { ...payload, id: result.id, d: jsonData?.d, u: jsonData?.u, t: jsonData?.t }; // lưu lại để hiển thị ở modal

        setConfirmedData(savedPayload);
        setReviewModalVisible(true); // mở modal xem lại
        //setMessageModal({ type: 'success', message: '✅ Đã lưu dữ liệu cân rác thành công!' });
      } else {
        const errText = await res.text();
        setMessageModal({ type: 'error', message: `❌ Lỗi: ${errText || 'Không thể lưu dữ liệu cân rác'}` });
      }
    } catch (err) {
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

    if (jsonData?.t && adjustments[jsonData.t]) {
      weight = Math.max(0, weight - adjustments[jsonData.t]);
    }

    weight = parseFloat(weight.toFixed(1));

    const payload = {
      trashBinCode: jsonData?.id,
      userID: user.userID,
      weighingTime: nowUTC7.toISOString(),
      weightKg: weight,
      updatedAt: nowUTC7.toISOString(),
      updatedBy: user.userID,
      workShift: workShift,
      workDate: new Date(workDate).toISOString().split('T')[0],
      userName: tenNguoiCan,
    };
    try {
      const res = await fetch(
        `${BASE_URL}/trash-weighings/check?trashBinCode=${payload?.trashBinCode}&workShift=${payload?.workShift}&workDate=${payload?.workDate}`,
      );
      const data = await res.json();
      return data;
    } catch (error) {
      console.error('❌ Lỗi kiểm tra cân:', error);
      return null;
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
      await handleConfirm(); // không có dữ liệu → cho lưu luôn
    }
  };

  return (
    <div className="relative flex flex-col items-center bg-white text-white p-4">
      <video ref={videoRef} className="w-full max-w-lg rounded-xl shadow-lg border-2 border-white" />

      <AnimatePresence>
        {resultVisible && jsonData && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[9999]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setResultVisible(false);
              setJsonData(null);
              setKhoiLuong('');
            }}
          >
            <motion.div
              className="bg-white text-black p-6 rounded-xl shadow-xl w-full max-w-md mx-4 space-y-4 max-h-[85%] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-sm flex">
                <p className="font-semibold">📍 Bộ phận / Khu vực:</p>
                <p className="ml-2">{jsonData?.d || ''}</p>
              </div>
              <div className="text-sm flex">
                <p className="font-semibold">🏭 Đơn vị sản xuất:</p>
                <p className="ml-2">{jsonData?.u || ''}</p>
              </div>
              <div className="text-sm flex">
                <p className="font-semibold">🗑️ Loại rác:</p>
                <p className="ml-2">{jsonData?.t || ''}</p>
              </div>

              <div className="text-sm">
                <label className="font-semibold block mb-1">⚖️ Nhập khối lượng:</label>
                <input
                  type="text"
                  inputMode="decimal"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="VD: 5.25"
                  value={khoiLuong}
                  onChange={(e) => {
                    const inputValue = e.target.value.replace(',', '.');
                    setKhoiLuong(inputValue);
                  }}
                />
              </div>

              <div className="text-sm">
                <label className="font-semibold block mb-1">🕓 Chọn ca làm việc:</label>
                {
                  user?.role === 'admin' && <div className="flex items-center gap-6 mb-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="shift"
                      value="true"
                      checked={isWorkShift === true}
                      onChange={() => setIsWorkShift(true)}
                    />
                    <span>Có ca</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="shift"
                      value="false"
                      checked={isWorkShift === false}
                      onChange={() => setIsWorkShift(false)}
                    />
                    <span>Không ca</span>
                  </label>
                </div>
                }

                <div className="flex flex-wrap gap-2">
                  {isWorkShift ? (
                    workShifts.map((shift) => (
                      <button
                        key={shift}
                        onClick={() => setWorkShift(shift)}
                        className={`px-4 py-2 rounded border text-sm ${
                          workShift === shift ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {shift === 'ca1'
                          ? 'Ca Ngắn 1 (06h00 → 14h00)'
                          : shift === 'ca2'
                          ? 'Ca Ngắn 2 (14h00 → 22h00)'
                          : shift === 'ca3'
                          ? 'Ca Ngắn 3 (22h00 → 06h00)'
                          : shift === 'dai1'
                          ? 'Ca Dài 1 (06h00 → 18h00)'
                          : shift === 'dai2'
                          ? 'Ca Dài 2 (18h00 → 06h00)'
                          : 'Ca Hành Chính (07h30 → 16h30)'}
                      </button>
                    ))
                  ) : (
                    <button
                      className="px-4 py-2 rounded border text-sm bg-red-100 text-red-600 cursor-default"
                      disabled
                    >
                      Tem không để ca
                    </button>
                  )}
                </div>
              </div>

              <div className="text-sm">
                <label className="font-semibold block mb-1">📅 Ngày làm việc:</label>
                {
                  user?.role === 'admin' && <div className="flex items-center gap-6 mb-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="date"
                      value="true"
                      checked={isWorkDate === true}
                      onChange={() => setIsWorkDate(true)}
                    />
                    <span>Có ngày</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="date"
                      value="false"
                      checked={isWorkDate === false}
                      onChange={() => setIsWorkDate(false)}
                    />
                    <span>Không ngày</span>
                  </label>
                </div>
                }
                {isWorkDate ? (
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    value={workDate}
                    onChange={(e) => setWorkDate(e.target.value)}
                  />
                ) : (
                  <button className="px-4 py-2 rounded border text-sm bg-red-100 text-red-600 cursor-default" disabled>
                    Tem không để ngày
                  </button>
                )}
              </div>
              <div className="text-sm">
                <label className="font-semibold block mb-1">👤 Tên người cân:</label>
                {/* {teamMembers.length > 0 ? (
                  <select
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    value={tenNguoiCan}
                    onChange={(e) => setTenNguoiCan(e.target.value)}
                  >
                    <option value="">-- Chọn thành viên --</option>
                    {teamMembers.map((member) => (
                      <option key={member.teamMemberID} value={member.name}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    placeholder="VD: Nguyễn Văn A"
                    value={tenNguoiCan}
                    onChange={(e) => setTenNguoiCan(e.target.value)}
                  />
                )} */}
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="VD: Nguyễn Văn A"
                  value={tenNguoiCan}
                  onChange={(e) => setTenNguoiCan(e.target.value)}
                />
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => {
                    setResultVisible(false);
                    setJsonData(null);
                    setKhoiLuong('');
                  }}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Đóng
                </button>
                <button
                  onClick={handleCheckAndConfirm}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center justify-center"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Đang gửi...
                    </>
                  ) : (
                    'Xác nhận'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {reviewModalVisible && confirmedData && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[9999]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setReviewModalVisible(false)}
        >
          <motion.div
            className="bg-white text-black p-6 rounded-xl shadow-xl w-full max-w-md mx-4 space-y-4"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold mb-4">📋 Thông tin đã lưu</h2>
            <p>
              <strong>Mã thùng rác:</strong> {confirmedData?.trashBinCode}
            </p>
            <div className="text-sm flex">
              <p className="font-semibold">📍 Bộ phận / Khu vực:</p>
              <p className="ml-2">{confirmedData?.d || ''}</p>
            </div>
            <div className="text-sm flex">
              <p className="font-semibold">🏭 Đơn vị sản xuất:</p>
              <p className="ml-2">{confirmedData?.u || ''}</p>
            </div>
            <div className="text-sm flex">
              <p className="font-semibold">🗑️ Loại rác:</p>
              <p className="ml-2">{confirmedData?.t || ''}</p>
            </div>
            <p>
              <strong>Khối lượng:</strong> {confirmedData?.weightKg} kg
            </p>
            <p>
              <strong>Ca làm:</strong>
              {isWorkShift ? (
                confirmedData.workShift === 'ca1' ? (
                  'Ca Ngắn 1 (06h00 → 14h00)'
                ) : confirmedData.workShift === 'ca2' ? (
                  'Ca Ngắn 2 (14h00 → 22h00)'
                ) : confirmedData.workShift === 'ca3' ? (
                  'Ca Ngắn 3 (22h00 → 06h00)'
                ) : confirmedData.workShift === 'dai1' ? (
                  'Ca Dài 1 (06h00 → 18h00)'
                ) : confirmedData.workShift === 'dai2' ? (
                  'Ca Dài 2 (18h00 → 06h00)'
                ) : (
                  'Ca Hành Chính (07h30 → 16h30)'
                )
              ) : (
                <button className="px-4 py-2 rounded border text-sm bg-red-100 text-red-600 cursor-default" disabled>
                  Tem không để ca
                </button>
              )}
            </p>
            <p>
              <strong>Ngày:</strong>{' '}
              {isWorkDate ? (
                (() => {
                  const d = new Date(confirmedData.workDate);
                  const day = String(d.getDate()).padStart(2, '0');
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  const year = d.getFullYear();
                  return `${day}-${month}-${year}`;
                })()
              ) : (
                <button className="px-4 py-2 rounded border text-sm bg-red-100 text-red-600 cursor-default" disabled>
                  Tem không để ngày
                </button>
              )}
            </p>
            <p>
              <strong>Người cân:</strong> {confirmedData.userName}
            </p>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => {
                  setReviewModalVisible(false);
                  setEditModalVisible(true);
                }}
                className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
              >
                ✏️ Chỉnh sửa
              </button>

              <button
                onClick={() => {
                  setReviewModalVisible(false);
                  setMessageModal({ type: 'success', message: '✅ Đã lưu dữ liệu cân rác thành công!' });
                }}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                ✅ Tiếp tục
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      {alreadyWeighedData && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[9999]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setAlreadyWeighedData(null)}
        >
          <motion.div
            className="bg-white text-black p-6 rounded-xl shadow-xl w-full max-w-md mx-4 space-y-4"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold">⚠️ Đã cân rác</h2>
            <p className="text-sm text-gray-600">
              Thùng rác <strong>{alreadyWeighedData.trashBinCode}</strong> đã được cân trong ca{' '}
              <strong>{alreadyWeighedData.workShift}</strong> ngày <strong>{alreadyWeighedData.workDate}</strong>.
            </p>
            <p className="text-sm text-gray-600">
              ⚖️ Khối lượng đã lưu: <strong>{alreadyWeighedData.weightKg} kg</strong>
            </p>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => {
                  setAlreadyWeighedData(null);
                  setLoading(false);
                  setResultVisible(false);
                  setJsonData(null);
                  setKhoiLuong('');
                  setMessageModal({ type: 'info', message: '⛔ Đã hủy lượt cân này!' });
                }}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              >
                ❌ Hủy lượt cân
              </button>

              <button
                onClick={async () => {
                  setAlreadyWeighedData(null);
                  await handleConfirm(); // vẫn gọi lại lưu nếu người dùng muốn
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                ✅ Tiếp tục lưu
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {editModalVisible && confirmedData && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[9999]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setEditModalVisible(false)}
        >
          <motion.div
            className="bg-white text-black p-6 rounded-xl shadow-xl w-full max-w-md mx-4 space-y-4"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold mb-4">✏️ Chỉnh sửa thông tin</h2>

            <div className="text-sm">
              <label className="block mb-1 font-semibold">⚖️ Khối lượng:</label>
              <input
                type="text"
                inputMode="decimal"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={confirmedData.weightKg}
                onChange={(e) =>
                  setConfirmedData({ ...confirmedData, weightKg: parseFloat(e.target.value.replace(',', '.')) || 0 })
                }
              />
            </div>

            <div className="text-sm">
              <label className="block mb-1 font-semibold">🕓 Ca làm:</label>
              {
                user?.role === 'admin' && <div className="flex items-center gap-6 mb-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="shift"
                    value="true"
                    checked={isWorkShift === true}
                    onChange={() => setIsWorkShift(true)}
                  />
                  <span>Có ca</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="shift"
                    value="false"
                    checked={isWorkShift === false}
                    onChange={() => setIsWorkShift(false)}
                  />
                  <span>Không ca</span>
                </label>
              </div>
              }

              <div className="flex flex-wrap gap-2">
                {isWorkShift ? (
                  <select
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    value={confirmedData.workShift}
                    onChange={(e) => setConfirmedData({ ...confirmedData, workShift: e.target.value })}
                  >
                    <option value="ca1">Ca Ngắn 1 (06h00 → 14h00)</option>
                    <option value="ca2">Ca Ngắn 2 (14h00 → 22h00)</option>
                    <option value="ca3">Ca Ngắn 3 (22h00 → 06h00)</option>
                    <option value="dai1">Ca Dài 1 (06h00 → 18h00)</option>
                    <option value="dai2">Ca Dài 2 (18h00 → 06h00)</option>
                    <option value="cahc">Ca Hành Chính (07h30 → 16h30)</option>
                  </select>
                ) : (
                  <button className="px-4 py-2 rounded border text-sm bg-red-100 text-red-600 cursor-default" disabled>
                    Tem không để ca
                  </button>
                )}
              </div>
            </div>

            <div className="text-sm">
              <label className="block mb-1 font-semibold">📅 Ngày làm việc:</label>
              {
                user?.role === 'admin' && <div className="flex items-center gap-6 mb-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="date"
                    value="true"
                    checked={isWorkDate === true}
                    onChange={() => setIsWorkDate(true)}
                  />
                  <span>Có ngày</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="date"
                    value="false"
                    checked={isWorkDate === false}
                    onChange={() => setIsWorkDate(false)}
                  />
                  <span>Không ngày</span>
                </label>
              </div>
              }
              {isWorkDate ? (
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  value={confirmedData.workDate}
                  onChange={(e) => setConfirmedData({ ...confirmedData, workDate: e.target.value })}
                />
              ) : (
                <button className="px-4 py-2 rounded border text-sm bg-red-100 text-red-600 cursor-default" disabled>
                  Tem không để ngày
                </button>
              )}
            </div>

            <div className="text-sm">
              <label className="block mb-1 font-semibold">👤 Người cân:</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={confirmedData.userName}
                onChange={(e) => setConfirmedData({ ...confirmedData, userName: e.target.value })}
              />
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => {
                  setEditModalVisible(false);
                  setMessageModal({ type: 'success', message: '✅ Đã lưu dữ liệu cân rác thành công!' });
                }}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              >
                ❌ Hủy
              </button>

              <button
                onClick={async () => {
                  setIsSaving(true);
                  const nowUTC7 = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
                  try {
                    const res = await fetch(`${BASE_URL}/trash-weighings/${confirmedData.id}`, {
                      method: 'PUT', // hoặc PATCH nếu có ID
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        ...confirmedData,
                        updatedAt: nowUTC7.toISOString(),
                        updatedBy: user.userID, // thay bằng user ID thực tế
                      }),
                    });

                    if (res.ok) {
                      setMessageModal({ type: 'success', message: '✅ Đã chỉnh sửa dữ liệu cân rác thành công!' });
                    } else {
                      const err = await res.text();
                      setMessageModal({ type: 'error', message: `❌ Lỗi: ${err}` });
                    }
                  } catch {
                    setMessageModal({ type: 'error', message: '❌ Không thể kết nối server!' });
                  } finally {
                    setEditModalVisible(false);
                    setIsSaving(false);
                  }
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {isSaving ? (
                  <svg
                    className="w-4 h-4 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  '💾 Lưu'
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      <AnimatePresence>
        {messageModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMessageModal(null)}
          >
            <motion.div
              className="bg-white text-black p-6 rounded-xl shadow-xl space-y-4 w-full max-w-md mx-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className={`text-sm ${messageModal.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                {messageModal.message}
              </p>
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setMessageModal(null)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {wrongTeamModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setWrongTeamModal(false)}
          >
            <motion.div
              className="bg-white text-black p-6 rounded-xl shadow-xl space-y-4 w-full max-w-md mx-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center">
                <img
                  src="https://media1.tenor.com/m/Ygxb5vbxoKAAAAAC/tontonfriends-shocked.gif"
                  alt="funny chick"
                  className="w-32 h-32"
                />
              </div>
              <p className="text-[#020202] font-semibold text-center">
                🐤 Ối dồi ôi! Mã QR này không thuộc tổ của bạn rồi 😅 Quét lại hen!
              </p>
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => {
                    setWrongTeamModal(false);
                    setJsonData(null);
                    setKhoiLuong(0);
                    setResultVisible(false);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
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
