import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { userSelector } from '~/redux/selectors';
import weightSlice from '~/redux/slices/weightSlice';
import Modal from 'react-modal';
import axios from 'axios';
import { BASE_URL } from '~/config';
import { format } from 'date-fns';
import http from '~/api/http';
import { useFeatureAllowed } from '~/hooks/useFeatureGuard';
import MODULEID from '~/contants/modules';
import WeighSelectionSummaryModal from './WeighSelectionSummaryModal';


Modal.setAppElement('#root');

const Spinner = () => (
  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
  </svg>
);


function Home() {

  const FEATURE_SCAN_QR = useFeatureAllowed(MODULEID.CANRAC, 'cr_nghiepvucanrac');
  const FEATURE_BLUE = useFeatureAllowed(MODULEID.CANRAC, 'cr_chucnangketnoibluecan');
  const FEATURE_CHECK_CLASS = useFeatureAllowed(MODULEID.CANRAC, 'cr_nghiepvukiemtraphanloai');

  const tmp = useSelector(userSelector);
  const [user, setUser] = useState({});
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [index, setIndex] = useState(0);
  const [typedText, setTypedText] = useState('');
  const intervalRef = useRef(null);

  const [isModalOpen, setModalOpen] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedDept, setSelectedDept] = useState({});
  const [selectedUnit, setSelectedUnit] = useState({});

  const [errorMessage, setErrorMessage] = useState('');
  const [isErrorModalOpen, setErrorModalOpen] = useState(false);

  const [isLoadingClassification, setIsLoadingClassification] = useState(false);

  const [trashBins, setTrashBins] = useState([]);
  const [isTrashModalOpen, setTrashModalOpen] = useState(false);

  const [isCheckModalOpen, setCheckModalOpen] = useState(false);

  const [isInstructionModalOpen, setInstructionModalOpen] = useState(false);
  const [instructionConfirmed, setInstructionConfirmed] = useState(true);

  const [isFeedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackNote, setFeedbackNote] = useState('');

  const [finalConfirmModalOpen, setFinalConfirmModalOpen] = useState(false);

  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  
  const [isWeighModalOpen, setWeighModalOpen] = useState(false);
  const [weighStep, setWeighStep] = useState(1); // 1: rác, 2: bộ phận, 3: chuyền/máy
  const [isLoadingWeigh, setIsLoadingWeigh] = useState(false);

  const [isSummaryOpen, setSummaryOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState({ trashId: null, departmentId: null, lineId: null });

  // Loại rác (trashName - id)
  const DATA_TRASH = [
    { id: 3,  trashName: 'Giẻ lau dính mực thường' },
    { id: 9,  trashName: 'Giẻ lau dính mực lapa' },
    { id: 5,  trashName: 'Băng keo dính mực' },
    { id: 7,  trashName: 'Keo bàn thải' },
    { id: 6,  trashName: 'Mực in thường thải' },
    { id: 2,  trashName: 'Mực in lapa thải' },
    { id: 4,  trashName: 'Vụn logo' },
    { id: 1,  trashName: 'Lụa căng khung' },
  ];

  // Bộ phận (name - deptId hoặc null; fixedLine là chuyền cố định nếu có)
  const DATA_DEPARTMENTS = [
    { key: 'auto',  name: 'Máy in tự động', deptId: null },
    { key: 'ban',   name: 'Máy in bàn',     deptId: null },
    { key: 'robot', name: 'Máy in robot',   deptId: null },
    { key: 'mau',   name: 'Mẫu',            deptId: 24, fixedLine: 68 },
    { key: 'loep',  name: 'Logo - ép',      deptId: 21, fixedLine: 69 },
    { key: 'ck',    name: 'Chụp khuôn',     deptId: 25 },
    { key: 'kcs',   name: 'KCS',            deptId: 26 },
    { key: 'sh',    name: 'Sửa hàng',       deptId: 27 },
    { key: 'pm',    name: 'Pha màu',        deptId: 28 },
    { key: 'rc1',   name: 'Rác chung C1',   deptId: 20, fixedLine: 48 },
    { key: 'rc2',   name: 'Rác chung C2',   deptId: 21, fixedLine: 58 },
  ];

  // Danh sách máy/chuyền theo nhóm đặc biệt
  // item: { label: 'M1', deptId: 20, lineId: 49 }
  const LINES_AUTO = [
    { label: 'M1', deptId: 20, lineId: 49 },
    { label: 'M2', deptId: 20, lineId: 50 },
    { label: 'M3', deptId: 20, lineId: 51 },
    { label: 'M4', deptId: 20, lineId: 37 },
    { label: 'M5', deptId: 20, lineId: 59 },
    { label: 'M6', deptId: 20, lineId: 60 },
    { label: 'M7', deptId: 20, lineId: 38 },
    { label: 'M8', deptId: 20, lineId: 39 },
  ];

  const LINES_BAN = [
    { label: 'M1A',    deptId: 20, lineId: 40 },
    { label: 'M1B',    deptId: 20, lineId: 35 },
    { label: 'M2A-2B', deptId: 20, lineId: 36 },
    { label: 'M4A-4B', deptId: 20, lineId: 41 },
    { label: 'M5A-5B', deptId: 20, lineId: 42 },
    { label: 'M6A-6B', deptId: 20, lineId: 43 },
    { label: 'M7A-7B', deptId: 20, lineId: 44 },
    { label: 'M8A-8B', deptId: 20, lineId: 45 },
    { label: 'M9A-9B', deptId: 20, lineId: 46 },
    { label: 'M10A',   deptId: 20, lineId: 52 },
    { label: 'M11A',   deptId: 20, lineId: 53 },
    { label: 'M12A',   deptId: 20, lineId: 54 },
    { label: 'M13A',   deptId: 20, lineId: 55 },
    { label: 'M14A',   deptId: 20, lineId: 56 },
    { label: 'M10B',   deptId: 21, lineId: 61 },
    { label: 'M11B',   deptId: 21, lineId: 62 },
    { label: 'M12B',   deptId: 21, lineId: 63 },
    { label: 'M13B',   deptId: 21, lineId: 64 },
    { label: 'M14B',   deptId: 21, lineId: 65 },
  ];

  const LINES_ROBOT = [
    { label: 'MRB1', deptId: 20, lineId: 47 },
    { label: 'MRB2', deptId: 20, lineId: 57 },
    { label: 'MRB3', deptId: 20, lineId: 66 },
  ];

  // Helper trả về lines theo key bộ phận
  const getLinesForDeptKey = (deptKey) => {
    if (deptKey === 'auto')  return LINES_AUTO;
    if (deptKey === 'ban')   return LINES_BAN;
    if (deptKey === 'robot') return LINES_ROBOT;
    return []; // các bộ phận khác không có máy
  };

  // selections
  const [selectedTrashTypeW, setSelectedTrashTypeW] = useState(null); // {id, trashName}
  const [selectedDeptW, setSelectedDeptW] = useState(null);           // {key, name, deptId, fixedLine?}
  const [linesOfDept, setLinesOfDept] = useState([]);                 // array lines cho bước 3
  const [selectedLineW, setSelectedLineW] = useState(null);           // {label, deptId, lineId} | null

  // mở modal cân rác
  const openWeigh = () => {
    setSelectedTrashTypeW(null);
    setSelectedDeptW(null);
    setLinesOfDept([]);
    setSelectedLineW(null);
    setWeighStep(1);
    setWeighModalOpen(true);
  };

  // chọn loại rác
  const onSelectTrashType = (t) => {
    setSelectedTrashTypeW(t);
    setWeighStep(2);
  };

  // chọn bộ phận
  // chọn bộ phận
const onSelectDeptW = (dept) => {
  setSelectedDeptW(dept);

  // Nếu có fixedLine → hoàn tất ngay (lineId = fixedLine)
  if (dept.fixedLine) {
    const payload = {
      trashId: selectedTrashTypeW?.id ?? null,
      trashName: selectedTrashTypeW?.trashName ?? null,
      departmentId: dept.deptId ?? null,
      departmentName: dept.name ?? null,
      lineId: dept.fixedLine,
      lineLabel: `Chuyền ${dept.fixedLine}`,
    };
    finishWeighImmediate(payload);
    return;
  }

  // Nếu là nhóm có máy → hiển thị danh sách máy (sang bước 3)
  const lines = getLinesForDeptKey(dept.key);
  if (lines.length > 0) {
    setLinesOfDept(lines);
    setSelectedLineW(null);
    setWeighStep(3);
    return;
  }

  // Còn lại: không có máy/chuyền → hoàn tất (lineId = null)
  const payload = {
    trashId: selectedTrashTypeW?.id ?? null,
    trashName: selectedTrashTypeW?.trashName ?? null,
    departmentId: dept.deptId ?? null,
    departmentName: dept.name ?? null,
    lineId: null,
    lineLabel: null,
  };
  finishWeighImmediate(payload);
};

// Hoàn tất ngay (dùng chung cho 3 trường hợp)
const finishWeighImmediate = (payload) => {
  // Lưu 3 ID và mở modal tóm tắt
  setSelectedIds({
    trashId: payload.trashId ?? null,
    departmentId: payload.departmentId ?? null,
    lineId: payload.lineId ?? null,
  });
  setWeighModalOpen(false);
  setSummaryOpen(true);
};


  // chọn chuyền/máy (hoặc để null cho các bộ phận không có máy)
  const onSelectLineW = (line) => {
  setSelectedLineW(line);
  const payload = {
    trashId: selectedTrashTypeW?.id ?? null,
    trashName: selectedTrashTypeW?.trashName ?? null,
    departmentId: line.deptId ?? selectedDeptW?.deptId ?? null,
    departmentName: selectedDeptW?.name ?? null,
    lineId: line.lineId,
    lineLabel: line.label,
  };
  finishWeighImmediate(payload);
};


  // hoàn tất lựa chọn — tạm thời chỉ hiển thị để bạn kiểm tra
  const finishWeighSelect = () => {
    // Quy tắc lưu:
    //  - trashId = selectedTrashTypeW.id
    //  - departmentId = selectedLineW?.deptId ?? selectedDeptW?.deptId ?? null
    //  - lineId = selectedLineW?.lineId ?? (selectedDeptW?.fixedLine ?? null)
    const payload = {
      trashId: selectedTrashTypeW?.id ?? null,
      trashName: selectedTrashTypeW?.trashName ?? null,
      departmentId: selectedLineW?.deptId ?? selectedDeptW?.deptId ?? null,
      departmentName: selectedDeptW?.name ?? null,
      lineId: selectedLineW?.lineId ?? selectedDeptW?.fixedLine ?? null,
      lineLabel: selectedLineW?.label ?? (selectedDeptW?.fixedLine ? `Chuyền ${selectedDeptW.fixedLine}` : null),
    };
    // Tạm báo lên modal lỗi để bạn thấy kết quả (bạn có thể thay bằng navigate/post sau)
    showError(
      `Chọn xong:\n- Rác: ${payload.trashName} (#${payload.trashId})\n- Bộ phận: ${payload.departmentName} (${payload.departmentId ?? 'null'})\n- Chuyền/Máy: ${payload.lineLabel ?? 'null'} (${payload.lineId ?? 'null'})`
    );
    setWeighModalOpen(false);
  };


  const showError = (msg) => {
    setErrorMessage(msg);
    setErrorModalOpen(true);
  };

  // greeting typing text
  useEffect(() => {
    setUser(tmp?.login?.currentUser);
  }, [tmp]);

  useEffect(() => {
    if (isModalOpen || isErrorModalOpen || isTrashModalOpen || isCheckModalOpen || isInstructionModalOpen) return;

    const name = tmp?.login?.currentUser?.fullName || 'bạn';
    const fullText = `Chào mừng ${name} đến hệ thống`;
    const chars = fullText.split('');

    let current = 0;
    setTypedText('');
    const typingInterval = setInterval(() => {
      if (current < chars.length) {
        setTypedText((prev) => prev + chars[current]);
        current++;
      } else {
        clearInterval(typingInterval);
      }
    }, 90);

    return () => clearInterval(typingInterval);
  }, [index, isModalOpen, isErrorModalOpen, isTrashModalOpen, isCheckModalOpen, isInstructionModalOpen, tmp]);

  const data = [
    { image: require('~/assets/imgs/bg-1.jpg') },
    { image: require('~/assets/imgs/bg-2.jpg') },
  ];

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    setImagePreviews(files.map((file) => URL.createObjectURL(file)));
  };

  const handleScanQR = () => navigate('/scan');

  const startAutoSlide = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % data.length);
    }, 5000);
  };

  useEffect(() => {
    if (isModalOpen || isErrorModalOpen || isTrashModalOpen || isCheckModalOpen || isInstructionModalOpen) {
      clearInterval(intervalRef.current);
    } else {
      startAutoSlide();
    }
    return () => clearInterval(intervalRef.current);
  }, [isModalOpen, isErrorModalOpen, isTrashModalOpen, isCheckModalOpen, isInstructionModalOpen]);

  useEffect(() => {
    const fetchUnits = async () => {
      if (!selectedDept?.id) return;
      try {
        const today = new Date().toISOString().split('T')[0];
        const res = await http.get(`${BASE_URL}/api/units`, {
          params: { departmentId: selectedDept.id, date: today },
        });
        setUnits(res.data);
      } catch (err) {
        showError('Lỗi khi tải đơn vị: ' + err.message);
      }
    };
    fetchUnits();
  }, [selectedDept]);

  const handleSlider = (i) => {
    setIndex(i);
    startAutoSlide();
  };

  const handleConnectBluetooth = async () => {
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ name: 'ESP32_SCALE' }],
        optionalServices: ['0000ff00-0000-1000-8000-00805f9b34fb'],
      });

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('0000ff00-0000-1000-8000-00805f9b34fb');
      const characteristic = await service.getCharacteristic('0000ff01-0000-1000-8000-00805f9b34fb');

      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', (event) => {
        const value = new TextDecoder().decode(event.target.value);
        dispatch(weightSlice.actions.setWeight(value));
      });

      showError('✅ Đã kết nối tới ESP32_SCALE');
    } catch (error) {
      console.error('Bluetooth Error:', error);
      showError('❌ Lỗi Bluetooth: ' + error.message);
    }
  };

  const handleCheckClassification = async () => {
    try {
      setIsLoadingClassification(true);
      const today = format(new Date(), 'yyyy-MM-dd');
      const deptRes = await http.get(`${BASE_URL}/api/departments`, { params: { date: today } });
      setDepartments(deptRes.data);
      setModalOpen(true);
    } catch (err) {
      showError('Lỗi khi tải dữ liệu: ' + err.message);
    } finally {
      setIsLoadingClassification(false);
    }
  };

  const handleContinue = async () => {
    if (!selectedDept?.id || (!selectedUnit?.id && units.length > 0)) {
      showError('⚠️ Vui lòng chọn đầy đủ thông tin.');
      return;
    }
    setIsLoadingClassification(true);
    try {
      const res = await http.get(`${BASE_URL}/trash-bin-in-areas`, {
        params: { departmentID: selectedDept?.id, unitID: selectedUnit?.id },
      });
      setTrashBins(res.data);
      setModalOpen(false);
      setTrashModalOpen(true);
    } catch (err) {
      showError('Lỗi khi lấy dữ liệu rác: ' + err.message);
    } finally {
      setIsLoadingClassification(false);
    }
  };

  const handleFinalSubmit = async () => {
    const formData = new FormData();
    images.forEach((file) => formData.append('images', file));
    formData.append('department', JSON.stringify(selectedDept));
    formData.append('unit', JSON.stringify(selectedUnit));
    formData.append('trashBins', JSON.stringify(trashBins));
    formData.append('feedbackNote', feedbackNote || '');
    formData.append('user', user.userID);

    setIsLoadingClassification(true);
    try {
      const res = await http.post("/submit-classification", formData);

      const data = await res.data;
      if (data.success) {
        setFinalConfirmModalOpen(false);
        showError('Lưu thành công');
        setSelectedDept({});
        setSelectedUnit({});
        setFeedbackNote('');
        setTrashBins([]);
        setImages([]);
        setImagePreviews([]);
      } else {
        showError('Lỗi: ' + data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Lỗi kết nối đến server');
    } finally {
      setIsLoadingClassification(false);
      setSelectedDept({});
      setSelectedUnit({});
      setFeedbackNote('');
      setTrashBins([]);
      setImages([]);
      setImagePreviews([]);
    }
  };

  return (
    <div className="overflow-hidden w-full flex justify-center">
      
<div className="relative w-full">
  <div className="relative w-full h-[320px] md:h-[520px] overflow-hidden rounded-none md:rounded-3xl">
    {/* Background gradient + soft blobs */}
    <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-emerald-50" />
    <div className="absolute -top-24 -left-24 w-[28rem] h-[28rem] rounded-full bg-sky-200/50 blur-3xl" />
    <div className="absolute -bottom-28 -right-28 w-[32rem] h-[32rem] rounded-full bg-emerald-200/50 blur-3xl" />
    <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 -100px 160px -80px rgba(2,6,23,0.15)' }} />

    {/* Glass content card */}
    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
      <div className="mx-auto max-w-4xl px-4">
        <div className="rounded-3xl bg-white/60 backdrop-blur-md border border-white/70 shadow-[0_20px_60px_-20px_rgba(2,6,23,.15)] p-6 sm:p-10">
          <h1 className="text-center text-slate-900 font-bold tracking-tight text-[18px] sm:text-[26px] md:text-[34px]">
            Chào mừng {tmp?.login?.currentUser?.fullName || 'bạn'} đến hệ thống
          </h1>
          <p className="mt-2 text-center text-slate-600 text-sm md:text-base">
            Thao tác nhanh bên dưới để bắt đầu công việc của bạn.
          </p>

          {/* 3 nút hành động (giữ nguyên logic onClick) */}
          
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              
              <button
  onClick={openWeigh}
  disabled={isLoadingWeigh}
  className="px-6 py-3 rounded-full bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-600
             text-white font-semibold shadow-lg shadow-sky-500/30 hover:from-sky-600 hover:via-cyan-600 hover:to-blue-700
             active:scale-[.98] transition disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2
             ring-1 ring-white/20 focus:outline-none focus:ring-4 focus:ring-sky-300/40"
>
  {isLoadingWeigh ? <Spinner/> : 'Cân rác (chọn)'}
</button>


{
                FEATURE_SCAN_QR &&
                <button
                  onClick={handleScanQR}
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500
                            text-white font-semibold shadow-lg shadow-amber-500/30
                            hover:from-amber-600 hover:to-yellow-600 active:scale-[.98] transition"
                >
                  Cân rác (Quét QR)
                </button>
              }

{
  FEATURE_BLUE &&
              <button
                onClick={handleConnectBluetooth}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-sky-600 to-blue-600
                           text-white font-semibold shadow-lg shadow-sky-600/30
                           hover:from-sky-700 hover:to-blue-700 active:scale-[.98] transition"
              >
                Kết nối Bluetooth
              </button>
}

              {
                FEATURE_CHECK_CLASS &&
                <button
                  onClick={handleCheckClassification}
                  className="min-w-[190px] px-6 py-3 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600
                             text-white font-semibold shadow-lg shadow-emerald-600/30
                             hover:from-emerald-700 hover:to-teal-700 active:scale-[.98] transition
                             inline-flex items-center justify-center gap-2"
                >
                  {isLoadingClassification ? (
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                    </svg>
                  ) : (
                    'Kiểm tra phân loại'
                  )}
                </button>
              }
            </div>
        </div>
      </div>
    </div>
  </div>
</div>

<Modal
  isOpen={isWeighModalOpen}
  onRequestClose={() => setWeighModalOpen(false)}
  className="bg-white/90 backdrop-blur-md rounded-xl max-w-md w-full p-0 mx-auto mt-10 shadow-xl outline-none border border-white/60 overflow-hidden"
  overlayClassName="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-[60]"
>
  {/* Top info (thay cho header + footer cũ) */}
  <div className="px-4 pt-3 pb-2 bg-white/80 border-b border-slate-200">
    <div className="flex items-center justify-between">
      <button
        onClick={() => {
          if (weighStep === 1) setWeighModalOpen(false);
          else setWeighStep((s) => s - 1);
        }}
        className="text-sm text-slate-600 hover:text-slate-900"
      >
        ← Quay lại
      </button>
      <div className="text-slate-900 font-semibold">⚖️ Cân rác</div>
      
      <button
        onClick={() => setWeighModalOpen(false)}
        className="h-8 w-8 grid place-items-center rounded-full hover:bg-slate-100 text-slate-600"
        aria-label="Đóng"
        title="Đóng"
      >
        ✕
      </button>
    </div>

    {/* chips thông tin đã chọn */}
    <div className="mt-2 flex flex-wrap items-center gap-2 text-[12.5px]">
      {selectedTrashTypeW?.trashName && (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1">
          ♻️ {selectedTrashTypeW.trashName}
        </span>
      )}
      {selectedDeptW?.name && (
        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 px-2 py-1">
          🏷️ {selectedDeptW.name}
        </span>
      )}
      {(selectedLineW?.label || selectedDeptW?.fixedLine) && (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1">
          🚏 {selectedLineW?.label ?? `Chuyền ${selectedDeptW.fixedLine}`}
        </span>
      )}
      {weighStep === 3 && selectedDeptW && !selectedDeptW.fixedLine && linesOfDept.length === 0 && (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 px-2 py-1">
          🚏 Chuyền: null
        </span>
      )}
    </div>
  </div>

  {/* Nội dung chính — gọn, không hiển thị ID, không footer */}
  <div className="p-4 max-h-[70vh] overflow-y-auto">
    {/* Bước 1: Loại rác */}
    {weighStep === 1 && (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {DATA_TRASH.map(t => (
          <button
            key={t.id}
            onClick={() => onSelectTrashType(t)}
            className={`text-left rounded-xl border ${selectedTrashTypeW?.id===t.id ? 'border-emerald-500 ring-1 ring-emerald-200' : 'border-slate-200'} bg-white hover:border-emerald-400 hover:shadow transition p-3`}
          >
            <div className="text-slate-900 font-medium">{t.trashName}</div>
          </button>
        ))}
      </div>
    )}

    {/* Bước 2: Bộ phận */}
    {weighStep === 2 && (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {DATA_DEPARTMENTS.map(d => (
          <button
            key={d.key}
            onClick={() => onSelectDeptW(d)}
            className={`text-left rounded-xl border ${selectedDeptW?.key===d.key ? 'border-sky-500 ring-1 ring-sky-200' : 'border-slate-200'} bg-white hover:border-sky-400 hover:shadow transition p-3`}
          >
            <div className="text-slate-900 font-medium">{d.name}</div>
          </button>
        ))}
      </div>
    )}

    {/* Bước 3: Chuyền/Máy (chỉ hiện nếu nhóm có máy) */}
    {weighStep === 3 && (
      <>
        {linesOfDept.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {linesOfDept.map((ln, i) => (
              <button
                key={`${ln.label}-${ln.lineId}-${i}`}
                onClick={() => onSelectLineW(ln)}
                className={`text-left rounded-xl border ${selectedLineW?.lineId===ln.lineId ? 'border-amber-500 ring-1 ring-amber-200' : 'border-slate-200'} bg-white hover:border-amber-400 hover:shadow transition p-3`}
              >
                <div className="text-slate-900 font-medium">{ln.label}</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white/70 p-4 text-center text-slate-700">
            Bộ phận này không có máy/chuyền. Đã lưu với <b>chuyền = null</b>.
          </div>
        )}
      </>
    )}
  </div>
</Modal>

<WeighSelectionSummaryModal
  isOpen={isSummaryOpen}
  setSummaryOpen={setSummaryOpen}
  openWeigh={openWeigh}
  onClose={() => setSummaryOpen(false)}
  onBack={() => {
    setSummaryOpen(false);
    setWeighModalOpen(true); // mở lại modal cân trước đó
  }}
  trashId={selectedIds.trashId}
  departmentId={selectedIds.departmentId}
  lineId={selectedIds.lineId}
/>

      {/* Modal chọn bộ phận & đơn vị */}
      <Modal
        isOpen={isModalOpen}
        className="bg-white/90 backdrop-blur-md rounded-2xl max-w-md w-full p-6 mx-auto mt-20 shadow-xl outline-none border border-white/60"
        overlayClassName="fixed inset-0 bg-black/50 flex items-center justify-center z-[50]"
      >
        <h2 className="text-xl font-bold mb-4 text-slate-800">🔍 Kiểm tra phân loại</h2>

        <div className="mb-4">
          <label className="block mb-1 font-semibold text-slate-700">Bộ phận:</label>
          <select
            value={selectedDept?.id || ''}
            onChange={(e) => {
              const selectedOption = e.target.options[e.target.selectedIndex];
              const selectedName = selectedOption.dataset.name;
              setSelectedDept({ id: e.target.value, name: selectedName });
              setSelectedUnit({});
            }}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 bg-white"
          >
            <option value="">-- Chọn bộ phận --</option>
            {departments?.map((dept) => (
              <option key={dept.departmentID} value={dept.departmentID} data-name={dept.departmentName}>
                {dept?.departmentName?.normalize('NFC') === 'Chụp khung'.normalize('NFC') ? 'Chụp Khuôn' : dept.departmentName}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label className="block mb-1 font-semibold text-slate-700">Đơn vị:</label>
          <select
            value={selectedUnit?.id || ''}
            onChange={(e) => {
              const selectedOption = e.target.options[e.target.selectedIndex];
              const selectedName = selectedOption.dataset.name;
              setSelectedUnit({ id: e.target.value, name: selectedName });
            }}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 bg-white"
          >
            <option value="">-- Chọn đơn vị --</option>
            {units?.map((unit) => (
              <option key={unit.unitID} value={unit.unitID} data-name={unit.unitName}>
                {unit.unitName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              setSelectedDept({});
              setSelectedUnit({});
              setModalOpen(false);
            }}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition"
          >
            Hủy
          </button>
          <button
            onClick={handleContinue}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition inline-flex items-center gap-2"
          >
            {isLoadingClassification ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            ) : (
              'Tiếp tục'
            )}
          </button>
        </div>
      </Modal>

      {/* Modal thông báo lỗi */}
      <Modal
        isOpen={isErrorModalOpen}
        onRequestClose={() => setErrorModalOpen(false)}
        className="bg-white/95 backdrop-blur-md rounded-2xl max-w-sm w-full p-6 mx-auto mt-20 shadow-xl outline-none border border-white/60 text-center"
        overlayClassName="fixed inset-0 bg-black/50 flex items-center justify-center z-[5333]"
      >
        <h3 className="text-lg font-semibold mb-2 text-slate-800">Thông báo</h3>
        <p className="mb-5 text-slate-700">{errorMessage}</p>
        <button
          onClick={() => setErrorModalOpen(false)}
          className="px-4 py-2 rounded-xl bg-sky-600 text-white hover:bg-sky-700 transition"
        >
          Đóng
        </button>
      </Modal>

      {/* Modal số lượng thùng rác */}
      <Modal
        isOpen={isTrashModalOpen}
        className="bg-white/90 backdrop-blur-md rounded-2xl max-w-lg w-full p-6 mx-auto mt-20 shadow-xl outline-none border border-white/60"
        overlayClassName="fixed inset-0 bg-black/50 flex items-center justify-center z-[52]"
      >
        <h2 className="text-xl font-bold mb-4 text-slate-800">🗑️ Số lượng thùng rác</h2>

        {trashBins.length === 0 ? (
          <p className="text-slate-700">Không có loại rác nào được cấu hình cho bộ phận và đơn vị này.</p>
        ) : (
          <ul className="space-y-4 max-h-80 overflow-y-auto pr-2">
            {trashBins.map((item, idx) => {
              const normalizedTrashName = item.trashName?.normalize('NFC')?.trim();
              const colorMap = {
                'Giẻ lau dính mực thường': 'bg-yellow-400',
                'Giẻ lau dính mực lapa': 'bg-yellow-400',
                'Băng keo dính hóa chất': 'bg-white border border-gray-400',
                'Mực in thường thải': 'bg-red-500',
                'Mực in lapa thải': 'bg-red-500',
                'Rác sinh hoạt': 'bg-green-500',
                'Vụn logo': 'bg-black',
              };
              const colorClass = colorMap[normalizedTrashName] || 'bg-gray-300';

              return (
                <li key={item.trashBinInAreaID} className="border border-slate-200 rounded-xl px-4 py-3 shadow-sm bg-white/90">
                  <div className="flex items-start gap-3">
                    <div className={`w-4 h-4 mt-1 rounded-full ${colorClass}`} />
                    <div className="flex-1 space-y-2">
                      <div className="text-base font-medium text-slate-800">{item.trashName}</div>

                      <label htmlFor={`actual-${idx}`} className="block text-sm font-semibold text-slate-700">
                        Thùng hiện có:
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-red-100 border border-slate-300 text-lg font-bold text-slate-600 transition"
                          onClick={() => {
                            const updated = [...trashBins];
                            const current = updated[idx].actualQuantity || 0;
                            updated[idx] = { ...updated[idx], actualQuantity: Math.max(0, current - 1) };
                            setTrashBins(updated);
                          }}
                        >
                          −
                        </button>

                        <input
                          id={`actual-${idx}`}
                          type="number"
                          min="0"
                          className="w-16 text-center border border-slate-300 rounded-lg py-1.5 px-2 focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition"
                          value={item.actualQuantity ?? ''}
                          onChange={(e) => {
                            const newValue = Math.max(0, parseInt(e.target.value) || 0);
                            const updated = [...trashBins];
                            updated[idx] = { ...updated[idx], actualQuantity: newValue };
                            setTrashBins(updated);
                          }}
                        />

                        <button
                          type="button"
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-green-100 border border-slate-300 text-lg font-bold text-slate-600 transition"
                          onClick={() => {
                            const updated = [...trashBins];
                            const current = updated[idx].actualQuantity || 0;
                            updated[idx] = { ...updated[idx], actualQuantity: current + 1 };
                            setTrashBins(updated);
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex justify-between mt-6">
          <button
            onClick={() => {
              setTrashModalOpen(false);
              setModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition"
          >
            Quay lại
          </button>

          <button
            onClick={() => {
              setTrashModalOpen(false);
              setSelectedDept({});
              setSelectedUnit({});
              setTrashBins([]);
              setInstructionConfirmed(true);
              setFeedbackNote('');
            }}
            className="px-4 py-2 rounded-xl bg-rose-500 text-white hover:bg-rose-600 transition"
          >
            Huỷ
          </button>

          <button
            onClick={() => {
              setIsLoadingClassification(true);
              const binsWithDefaultCheck = trashBins.map((it) => ({ ...it, isCorrect: it?.isCorrect ?? true }));
              setTrashBins(binsWithDefaultCheck);
              setTrashModalOpen(false);
              setCheckModalOpen(true);
              setIsLoadingClassification(false);
            }}
            className="px-4 py-2 rounded-xl bg-sky-600 text-white hover:bg-sky-700 transition"
          >
            {isLoadingClassification ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            ) : (
              'Tiếp tục'
            )}
          </button>
        </div>
      </Modal>

      {/* Modal xác nhận phân loại */}
      <Modal
        isOpen={isCheckModalOpen}
        className="bg-white/90 backdrop-blur-md rounded-2xl max-w-xl w-full p-6 mx-auto mt-20 shadow-xl outline-none border border-white/60"
        overlayClassName="fixed inset-0 bg-black/50 flex items-center justify-center z-[30]"
      >
        <h2 className="text-xl font-bold mb-4 text-slate-800">🧪 Xác nhận phân loại rác</h2>

        <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {trashBins.map((item, index) => {
            const normalizedTrashName = item.trashName?.normalize('NFC')?.trim();
            const colorMap = {
              'Giẻ lau dính mực thường': 'bg-yellow-400',
              'Giẻ lau dính mực lapa': 'bg-yellow-400',
              'Băng keo dính hóa chất': 'bg-white border border-gray-400',
              'Mực in thường thải': 'bg-red-500',
              'Mực in lapa thải': 'bg-red-500',
              'Rác sinh hoạt': 'bg-green-500',
              'Vụn logo': 'bg-black',
            };
            const colorClass = colorMap[normalizedTrashName] || 'bg-gray-300';

            return (
              <li key={item.trashBinInAreaID} className="flex items-center justify-between border border-slate-200 rounded-xl px-4 py-2 bg-white/90">
                <div className="flex items-center gap-3">
                  <span className={`w-4 h-4 rounded-full ${colorClass}`} />
                  <div className="font-medium text-slate-800">{item.trashName}</div>
                </div>

                <div className="flex gap-3">
                  <button
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
                      item.isCorrect === true ? 'bg-emerald-500 text-white' : 'bg-slate-200 hover:bg-emerald-100'
                    }`}
                    onClick={() => {
                      const updated = [...trashBins];
                      updated[index] = { ...item, isCorrect: true };
                      setTrashBins(updated);
                    }}
                  >
                    ✅
                  </button>
                  <button
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
                      item.isCorrect === false ? 'bg-rose-500 text-white' : 'bg-slate-200 hover:bg-rose-100'
                    }`}
                    onClick={() => {
                      const updated = [...trashBins];
                      updated[index] = { ...item, isCorrect: false };
                      setTrashBins(updated);
                    }}
                  >
                    ❌
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="flex justify-between mt-6">
          <button
            onClick={() => {
              setCheckModalOpen(false);
              setTrashModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition"
          >
            Quay lại
          </button>

          <button
            onClick={() => {
              setCheckModalOpen(false);
              setSelectedDept({});
              setSelectedUnit({});
              setTrashBins([]);
              setInstructionConfirmed(true);
              setFeedbackNote('');
            }}
            className="px-4 py-2 rounded-xl bg-rose-500 text-white hover:bg-rose-600 transition"
          >
            Huỷ
          </button>

          <button
            onClick={() => {
              setIsLoadingClassification(true);
              const allUnchecked = trashBins.some((it) => it.isCorrect === null);
              if (allUnchecked) {
                showError('Vui lòng xác nhận tất cả các loại rác!');
                setIsLoadingClassification(false);
              } else {
                setCheckModalOpen(false);
                setInstructionModalOpen(true);
                setIsLoadingClassification(false);
              }
            }}
            className="px-4 py-2 rounded-xl bg-sky-600 text-white hover:bg-sky-700 transition"
          >
            {isLoadingClassification ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            ) : (
              'Tiếp tục'
            )}
          </button>
        </div>
      </Modal>

      {/* Modal đã hướng dẫn */}
      <Modal
        isOpen={isInstructionModalOpen}
        className="bg-white/90 backdrop-blur-md rounded-2xl max-w-lg w-full p-6 mx-auto mt-20 shadow-xl outline-none border border-white/60"
        overlayClassName="fixed inset-0 bg-black/50 flex items-center justify-center z-[52]"
      >
        <h2 className="text-xl font-bold mb-6 text-center text-slate-800">👨‍🏭 Thợ in đã được hướng dẫn phân loại chưa?</h2>

        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => setInstructionConfirmed(true)}
            className={`px-5 py-2 rounded-full border transition ${
              instructionConfirmed ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-700 border-slate-300 hover:bg-emerald-50'
            }`}
          >
            ✅ Đã hướng dẫn
          </button>

          <button
            onClick={() => setInstructionConfirmed(false)}
            className={`px-5 py-2 rounded-full border transition ${
              instructionConfirmed === false ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-slate-700 border-slate-300 hover:bg-rose-50'
            }`}
          >
            ❌ Chưa hướng dẫn
          </button>
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={() => {
              setInstructionModalOpen(false);
              setCheckModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition"
          >
            Quay lại
          </button>

          <button
            onClick={() => {
              setInstructionModalOpen(false);
              setSelectedDept({});
              setSelectedUnit({});
              setTrashBins([]);
              setInstructionConfirmed(true);
              setFeedbackNote('');
            }}
            className="px-4 py-2 rounded-xl bg-rose-500 text-white hover:bg-rose-600 transition"
          >
            Huỷ
          </button>

          <button
            onClick={() => {
              setIsLoadingClassification(true);
              if (instructionConfirmed) {
                setInstructionModalOpen(false);
                setFeedbackModalOpen(true);
              } else {
                showError('⚠️ Vui lòng hướng dẫn thợ in phân loại trước khi tiếp tục.');
              }
              setIsLoadingClassification(false);
            }}
            className="px-4 py-2 rounded-xl bg-sky-600 text-white hover:bg-sky-700 transition"
          >
            {isLoadingClassification ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            ) : (
              'Tiếp tục'
            )}
          </button>
        </div>
      </Modal>

      {/* Modal ghi chú */}
      <Modal
        isOpen={isFeedbackModalOpen}
        className="bg-white/90 backdrop-blur-md rounded-2xl max-w-lg w-full p-6 mx-auto mt-20 shadow-xl outline-none border border-white/60"
        overlayClassName="fixed inset-0 bg-black/50 flex items-center justify-center z-[52]"
      >
        <h2 className="text-xl font-bold mb-4 text-center text-slate-800">📝 Ghi chú phản hồi</h2>

        <textarea
          className="w-full h-32 p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 bg-white/95 resize-none"
          placeholder="Nhập ghi chú nếu có..."
          value={feedbackNote}
          onChange={(e) => setFeedbackNote(e.target.value)}
        />

        <div className="flex justify-between mt-6">
          <button
            onClick={() => {
              setFeedbackModalOpen(false);
              setInstructionModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition"
          >
            Quay lại
          </button>

          <button
            onClick={() => {
              setFeedbackModalOpen(false);
              setSelectedDept({});
              setSelectedUnit({});
              setFeedbackNote('');
              setTrashBins([]);
              setInstructionConfirmed(true);
            }}
            className="px-4 py-2 rounded-xl bg-rose-500 text-white hover:bg-rose-600 transition"
          >
            Huỷ
          </button>

          <button
            onClick={() => {
              setIsLoadingClassification(true);
              setFeedbackModalOpen(false);
              setFinalConfirmModalOpen(true);
              setIsLoadingClassification(false);
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition"
          >
            {isLoadingClassification ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            ) : (
              'Hoàn tất'
            )}
          </button>
        </div>
      </Modal>

      {/* Modal xác nhận cuối */}
      <Modal
        isOpen={finalConfirmModalOpen}
        className="bg-white/90 backdrop-blur-md rounded-2xl max-w-xl w-full p-6 mx-auto mt-20 shadow-xl outline-none border border-white/60"
        overlayClassName="fixed inset-0 bg-black/50 flex items-center justify-center z-[70]"
      >
        <h2 className="text-xl font-bold mb-6 text-center text-slate-800">🔒 Xác nhận thông tin cuối cùng</h2>

        <div className="space-y-4 max-h-80 overflow-y-auto px-1">
          <div className="flex">
            <h3 className="font-semibold text-slate-700">📌 Bộ phận:</h3>
            <p className="text-slate-900 ml-2">
              {selectedDept?.name?.normalize('NFC') === 'Chụp khung'.normalize('NFC') ? 'Chụp Khuôn' : selectedDept?.name}
            </p>
          </div>

          <div className="flex">
            <h3 className="font-semibold text-slate-700">🏷️ Đơn vị:</h3>
            <p className="text-slate-900 ml-2">{selectedUnit?.name}</p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-700 mb-1">♻️ Kết quả phân loại:</h3>
            <ul className="space-y-2">
              {trashBins.map((item) => {
                const isCorrect = item.isCorrect;
                const color = isCorrect ? 'text-emerald-600' : 'text-rose-500';
                return (
                  <li key={item.trashBinInAreaID} className={`border border-slate-200 rounded-xl px-4 py-2 bg-white/95 ${color}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{item.trashName}</span>
                      <span>{isCorrect ? '✅ Đúng' : '❌ Sai'}</span>
                    </div>
                    <div className="text-sm text-slate-600">
                      Theo quy định: <strong>{item.expectedQuantity}</strong>, hiện có:{' '}
                      <strong>{item.actualQuantity}</strong>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-700 mb-1">📝 Ghi chú:</h3>
            <p className="text-slate-800 whitespace-pre-wrap">{feedbackNote.trim() !== '' ? feedbackNote : '(Không có ghi chú)'}</p>
          </div>

          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {imagePreviews.map((url, i) => (
                <img key={i} src={url} alt={`preview-${i}`} className="w-full h-24 object-cover rounded-lg border border-white" />
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={() => {
              setFinalConfirmModalOpen(false);
              setFeedbackModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition"
          >
            Quay lại
          </button>

          <label className="block w-fit cursor-pointer text-sm text-purple-700 font-semibold bg-purple-100 hover:bg-purple-200 rounded-full px-4 py-2">
            Chụp hình
            <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>

          <button
            onClick={handleFinalSubmit}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition inline-flex items-center gap-2"
          >
            {isLoadingClassification ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            ) : (
              'Xác nhận'
            )}
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default Home;
