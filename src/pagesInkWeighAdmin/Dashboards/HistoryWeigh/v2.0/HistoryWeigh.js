import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { BASE_URL_SERVER_THLA } from '~/config';
import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import {
  FiDownload,
  FiLoader,
  FiChevronLeft,
  FiChevronRight,
  FiEdit2,
  FiSave,
  FiX,
  FiCheck,
  FiPlus,
  FiTrash,
} from 'react-icons/fi';
import { userSelector } from '~/redux/selectors';
import { useSelector } from 'react-redux';
import { useFeatureAllowed } from '~/hooks/useFeatureGuard';
import MODULEID from '~/contants/modules';

const PAGE_SIZE = 10;
const PAGE_SIZE_ALL = 100000;

const SHIFT_OPTIONS = [
  { label: 'Ca 1', value: 'C1' },
  { label: 'Ca 2', value: 'C2' },
  { label: 'Ca 3', value: 'C3' },
  { label: 'Dài 1', value: 'D1' },
  { label: 'Dài 2', value: 'D2' },
  { label: 'Hành chính', value: 'HC' },
];

// ==== Helpers: tên nghiệp vụ thân thiện ====
const opName = (op) =>
  op === 'CP' ? 'Cấp phát'
: op === 'TH' ? 'Thu hồi'
: op === 'CM' ? 'Cấp mực'
: op === 'TV' ? 'Trả về'
: op === 'GC' ? 'Giao ca'
: op === 'CX' ? 'Chuyển xe'
: op;

// ==== Helpers hiển thị EDITED (session-level) ====
// Quy ước: GC coi edited nếu có số > 0; CM coi edited nếu text khác rỗng và khác '0'
const isEditedGC = (s) => (Number(s?.editedScaleDeliveredBy ?? 0) > 0) || (Number(s?.editedScaleReceivedBy ?? 0) > 0);
const isEditedCM = (s) => {
  const a = (s?.editedWorkShift || '').trim();
  const b = (s?.editedUnit || '').trim();
  const c = (s?.editedScaleShift || '').trim();
  const notEmpty = (v) => !!v && v !== '0';
  return notEmpty(a) || notEmpty(b) || notEmpty(c);
};
const isSessionEdited = (s) => (s?.operationCode === 'GC' ? isEditedGC(s) : s?.operationCode === 'CM' || s?.operationCode === 'TV' ? isEditedCM(s) : false);

// Chi tiết edited (hiện trong popover)
function buildEditedDetail(s) {
  if (s?.operationCode === 'GC') {
    const a = Number(s?.editedScaleDeliveredBy ?? 0);
    const b = Number(s?.editedScaleReceivedBy ?? 0);
    if (a === 0 && b === 0) return 'Không chỉnh (0 ~ 0)';
    return `GC: Ca xe giao=${a || 0} · Ca xe nhận=${b || 0}`;
  }
  if (s?.operationCode === 'CM' || s?.operationCode === 'TV') {
    const a = (s?.editedWorkShift || '').trim();
    const b = (s?.editedUnit || '').trim();
    const c = (s?.editedScaleShift || '').trim();
    const notEmpty = (v) => !!v && v !== '0';
    if (!notEmpty(a) && !notEmpty(b) && !notEmpty(c)) return 'Không chỉnh (0 ~ 0)';
    return `CM: Ca chuyền=${notEmpty(a) ? a : '—'} · Chuyền=${notEmpty(b) ? b : '—'} · Ca cân=${notEmpty(c) ? c : '—'}`;
  }
  return '—';
}

// Giá trị hiển thị cho cột "Chuyền": ưu tiên editedUnit nếu có, ngược lại dùng unit gốc
const displayUnit = (s) => {
  const v = (s?.editedUnit || '').trim();
  return v && v !== '0' ? v : (s?.unit || '');
};

function HistoryWeigh() {
  const ACTION_UPDATE_HISTORY = useFeatureAllowed(MODULEID.CANMUC, 'cm_thaotacsualichsucanmuc');
  const todayStr = new Date().toISOString().split('T')[0];

  const [allData, setAllData] = useState([]);
  const [filters, setFilters] = useState({
    date: todayStr || '',
    shift: '',
    department: '',
    unit: '',
    operation: '',
  });

  const tmp = useSelector(userSelector);
  const [user, setUser] = useState({});
  useEffect(() => { setUser(tmp?.login?.currentUser); }, [tmp]);

  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [departments, setDepartments] = useState([]);
  const [units, setUnits] = useState([]);
  const [totalWeight, setTotalWeight] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [isMetaLoading, setIsMetaLoading] = useState(false);

  // === Editing states ===
  const [editMap, setEditMap] = useState({});
  const [formMap, setFormMap] = useState({});
  const [savingMap, setSavingMap] = useState({});
  const [exporting, setExporting] = useState(false);

  const [creating, setCreating] = useState(false);
const [createError, setCreateError] = useState(null);

const trimStr = (v) => (typeof v === 'string' ? v.trim() : v);
const toInt = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
};


  // ==== Create Modal State (UI only) ====
const [openCreate, setOpenCreate] = useState(false);

// === Session-level edit for 'editedUnit' (only CM/TV) ===
const [sessEditMap, setSessEditMap] = useState({});     // { [sessionId]: true/false }
const [sessFormMap, setSessFormMap] = useState({});     // { [sessionId]: { editedUnit: '' } }
const [sessSavingMap, setSessSavingMap] = useState({}); // { [sessionId]: true/false }

const startEditUnit = (session) => {
  const sid = session.weighingSessionId;
  const currentDisplay = (session?.editedUnit ?? session?.unit ?? '') || '';
  setSessEditMap(m => ({ ...m, [sid]: true }));
  setSessFormMap(f => ({ ...f, [sid]: { editedUnit: currentDisplay } }));
};

const cancelEditUnit = (sid) => {
  setSessEditMap(m => ({ ...m, [sid]: false }));
};

const changeSessionField = (sid, field, value) => {
  setSessFormMap(f => ({ ...f, [sid]: { ...(f[sid] || {}), [field]: value } }));
};

const saveEditedUnit = async (session) => {
  const sid = session.weighingSessionId;
  const draft = sessFormMap[sid] || {};
  const editedUnit = (draft.editedUnit ?? '').trim();

  try {
    setSessSavingMap(m => ({ ...m, [sid]: true }));
    await axios.put(`${BASE_URL_SERVER_THLA}/api/ink-weighing/sessions/${sid}`, {
      editedUnit: editedUnit || null, // null để xoá
    });

    // Cập nhật local ngay
    setData(prev => prev.map(s => s.weighingSessionId === sid ? { ...s, editedUnit: editedUnit || null } : s));
    setAllData(prev => prev.map(s => s.weighingSessionId === sid ? { ...s, editedUnit: editedUnit || null } : s));

    setSessEditMap(m => ({ ...m, [sid]: false }));

    // Làm chắc: refetch
    await fetchPage();
    await fetchMeta();
  } catch (e) {
    console.error('Lỗi lưu editedUnit:', e);
    alert('Lưu Chuyền (editedUnit) thất bại');
  } finally {
    setSessSavingMap(m => ({ ...m, [sid]: false }));
  }
};


const defaultItem = { inkCode: '', inkName: '', productionDate: '', weight: '', pjName: '', pjWeight: '' };

const [createForm, setCreateForm] = useState({
  operationCode: 'CM', // 'CM' | 'TV' | 'GC'
  // Cha cho CM/TV
  hsktId: '',
  Lenhsx: '',
  department: '',
  unit: '',
  editedWorkShift: '',
  editedScaleShift: '',
  // Cha cho GC
  scaleDeliveredBy: '',
  scaleReceivedBy: '',
  // Items
  items: [ { ...defaultItem } ],
});

// Helpers
const isCMorTV = createForm.operationCode === 'CM' || createForm.operationCode === 'TV';
const isGC = createForm.operationCode === 'GC';

const openCreateModal = () => setOpenCreate(true);
const closeCreateModal = () => setOpenCreate(false);

const changeCreateField = (field, value) =>
  setCreateForm(prev => ({ ...prev, [field]: value }));

const changeItemField = (idx, field, value) =>
  setCreateForm(prev => {
    const items = [...prev.items];
    items[idx] = { ...items[idx], [field]: value };
    return { ...prev, items };
  });

const addItemRow = () =>
  setCreateForm(prev => ({ ...prev, items: [...prev.items, { ...defaultItem }] }));

const removeItemRow = (idx) =>
  setCreateForm(prev => {
    const items = prev.items.filter((_, i) => i !== idx);
    return { ...prev, items: items.length ? items : [{ ...defaultItem }] };
  });


  const isAnySaving = useMemo(() => {
  const a = Object.values(savingMap).some(Boolean);      // item-level
  const b = Object.values(sessSavingMap).some(Boolean);  // session-level
  return a || b;
}, [savingMap, sessSavingMap]);

  // Popover chi tiết edited theo sessionId
  const [openDetailSessionId, setOpenDetailSessionId] = useState(null);
  const toggleDetail = (sid) => setOpenDetailSessionId(d => (d === sid ? null : sid));

  useEffect(() => {
    if (!user.username) return;
    fetchPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, currentPage, user]);

  useEffect(() => {
    if (!user.username) return;
    fetchMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, user]);

  const fetchPage = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${BASE_URL_SERVER_THLA}/api/ink-weighing/${user.username !== 'testcanmuc' ? 'history' : 'history-test'}`, {
        params: { ...filters, page: currentPage, pageSize: PAGE_SIZE },
      });
      const sessions = res.data.items || [];
      setData(sessions);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error('Lỗi khi lấy dữ liệu lịch sử (page):', err);
    } finally {
      setIsLoading(false);
    }
  };

  const buildParams = (excludeKeys = []) => {
    const p = { ...filters };
    excludeKeys.forEach(k => delete p[k]);
    return { ...p, page: 1, pageSize: PAGE_SIZE_ALL };
  };

  const fetchMeta = async () => {
    setIsMetaLoading(true);
    try {
      const url = `${BASE_URL_SERVER_THLA}/api/ink-weighing/${user.username !== 'testcanmuc' ? 'history' : 'history-test'}`;
      const [totalsRes, depRes, unitRes] = await Promise.all([
        axios.get(url, { params: buildParams([]) }),
        axios.get(url, { params: buildParams(['department']) }),
        axios.get(url, { params: buildParams(['unit']) }),
      ]);

      const allSessions = totalsRes.data?.items || [];
      setAllData(allSessions);
      setTotalSessions(allSessions.length);

      let sum = 0;
      for (const s of allSessions) {
        if (Array.isArray(s.items)) {
          for (const it of s.items) sum += Number(it?.weight || 0);
        }
      }
      setTotalWeight(sum);

      const depItems = depRes.data?.items || [];
      const depOptions = [...new Set(depItems.map(s => s.department).filter(Boolean))];
      setDepartments(depOptions);

      const unitItems = unitRes.data?.items || [];
      const unitOptions = [...new Set(unitItems.map(s => s.unit).filter(Boolean))];
      setUnits(unitOptions);
    } catch (err) {
      console.error('Lỗi khi lấy meta (tổng & dropdown):', err);
      setTotalSessions(data.length);
      let sum = 0;
      data.forEach(s => s.items?.forEach(i => (sum += Number(i.weight || 0))));
      setTotalWeight(sum);
    } finally {
      setIsMetaLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('vi-VN');
  };

  const formatTime = (value) => {
    if (!value) return '';
    const s = String(value);
    const d = new Date(s);
    const isUTCStamp = /Z$|[+-]\d{2}:\d{2}$/.test(s);
    const hh = String(isUTCStamp ? d.getUTCHours() : d.getHours()).padStart(2, '0');
    const mm = String(isUTCStamp ? d.getUTCMinutes() : d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const exportToExcel = () => {
    setExporting(true);
    try {
      const source = (allData && allData.length) ? allData : data;
      const excelData = [[
        'STT', 'Mã cân', 'Nghiệp vụ', 'Mã HSKT', 'Tổ in', 'Chuyền',
        'Số CT', 'Thời gian',
        'Edited?', // chỉ 1 cột
        'Mã mực', 'Tên mực', 'Khối lượng (kg)', 'NSX', 'Người nhận',
      ]];

      const toKg1 = (g) => Math.round(((Number(g) || 0) / 1000) * 10) / 10;

      source.forEach((session, sIdx) => {
        if (Array.isArray(session.items) && session.items.length > 0) {
          session.items.forEach((item, iIdx) => {
            excelData.push([
              iIdx === 0 ? sIdx + 1 : '',
              iIdx === 0 ? (session.scaleCode || '') : '',
              iIdx === 0 ? opName(session.operationCode) : '',
              iIdx === 0 ? (session.hsktId || '') : '',
              iIdx === 0 ? (session.department?.replace(/^T/, 'Tổ ') || '') : '',
              iIdx === 0 ? displayUnit(session) : '',
              iIdx === 0 ? (session.workShift || '') : '',
              iIdx === 0
                ? `${formatTime(session.startTime)} ${formatDate(session.weighStartDate)} - ${formatTime(session.endTime)} ${formatDate(session.weighEndDate)}`
                : '',
              iIdx === 0 ? (isSessionEdited(session) ? 'Yes' : 'No') : '',
              item.inkCode,
              item.inkName,
              toKg1(item.weight),
              formatDate(item.productionDate),
              iIdx === 0 ? (session.receivedBy || '') : '',
            ]);
          });
        } else {
          excelData.push([
            sIdx + 1,
            session.scaleCode || '',
            opName(session.operationCode),
            session.hsktId || '',
            session.department?.replace(/^T/, 'Tổ ') || '',
            displayUnit(session),
            session.workShift || '',
            `${formatTime(session.startTime)} ${formatDate(session.weighStartDate)} - ${formatTime(session.endTime)} ${formatDate(session.weighEndDate)}`,
            (isSessionEdited(session) ? 'Yes' : 'No'),
            '(Không có mục mực nào)', '', '', '',
            session.receivedBy || '',
          ]);
        }
      });

      const ws = XLSX.utils.aoa_to_sheet(excelData);

      // Merge các cột session-level (0..8) và cột Người nhận (cuối)
      const SESSION_COL_LAST = 8;
      const RECEIVER_COL_INDEX = excelData[0].length - 1;

      let currentRow = 1;
      source.forEach(session => {
        const rowCount = (Array.isArray(session.items) && session.items.length > 0) ? session.items.length : 1;
        if (rowCount > 1) {
          ws['!merges'] = ws['!merges'] || [];
          for (let c = 0; c <= SESSION_COL_LAST; c++) {
            ws['!merges'].push({ s: { r: currentRow, c }, e: { r: currentRow + rowCount - 1, c } });
          }
          ws['!merges'].push({ s: { r: currentRow, c: RECEIVER_COL_INDEX }, e: { r: currentRow + rowCount - 1, c: RECEIVER_COL_INDEX } });
        }
        currentRow += rowCount;
      });

      const border = {
        top: { style: 'thin', color: { rgb: 'CBD5E1' } },
        bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
        left: { style: 'thin', color: { rgb: 'CBD5E1' } },
        right: { style: 'thin', color: { rgb: 'CBD5E1' } },
      };
      const headerStyle = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '003366' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border,
      };

      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let c = 0; c <= range.e.c; c++) {
        const cell = XLSX.utils.encode_cell({ r: 0, c });
        if (ws[cell]) ws[cell].s = headerStyle;
      }

      let groupIndex = 0;
      let rowPtr = 1;
      source.forEach(session => {
        const rows = (session.items && session.items.length) ? session.items.length : 1;
        const fill = { fgColor: { rgb: groupIndex % 2 === 0 ? 'FFFFFF' : 'F8FAFC' } };
        for (let r = rowPtr; r < rowPtr + rows; r++) {
          for (let c = 0; c <= range.e.c; c++) {
            const addr = XLSX.utils.encode_cell({ r, c });
            if (!ws[addr]) continue;
            const isKgCol = (excelData[0][c] === 'Khối lượng (kg)');
            ws[addr].s = {
              ...(ws[addr].s || {}),
              fill,
              border,
              alignment: { horizontal: isKgCol ? 'right' : 'center', vertical: 'center', wrapText: true },
              numFmt: isKgCol ? '#,##0.0' : undefined,
            };
          }
        }
        rowPtr += rows;
        groupIndex++;
      });

      ws['!cols'] = [
        { wch: 6 },  // STT
        { wch: 12 }, // Mã cân
        { wch: 14 }, // Nghiệp vụ
        { wch: 12 }, // Mã HSKT
        { wch: 10 }, // Tổ in
        { wch: 10 }, // Chuyền (đã edit nếu có)
        { wch: 10 }, // Số CT
        { wch: 28 }, // Thời gian
        { wch: 10 }, // Edited?
        { wch: 14 }, // Mã mực
        { wch: 22 }, // Tên mực
        { wch: 16 }, // Khối lượng (kg)
        { wch: 12 }, // NSX
        { wch: 16 }, // Người nhận
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Lịch sử cân mực');
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([buf], { type: 'application/octet-stream' }),
        `lich_su_can_muc_${filters.date}.xlsx`
      );
    } finally {
      setExporting(false);
    }
  };

  function round1(num) {
    return num / 1000;
  }

  // ==== Handlers sửa item ====
  const startEdit = (item) => {
    const id = item.weighingSessionItemId;
    const kgForForm = (item?.weight2 != null ? item.weight2 : item.weight) / 1000;
    setEditMap(m => ({ ...m, [id]: true }));
    setFormMap(f => ({
      ...f,
      [id]: {
        inkCode: item.inkCode || '',
        inkName: item.inkName || '',
        weight2: Number.isFinite(kgForForm) ? kgForForm : ''
      }
    }));
  };

  const cancelEdit = (id) => {
    setEditMap(m => ({ ...m, [id]: false }));
  };

  const changeForm = (id, field, value) => {
    setFormMap(f => ({
      ...f,
      [id]: { ...(f[id] || { inkCode: '', inkName: '', weight2: '' }), [field]: value }
    }));
  };

  const saveEdit = async (sessionId, item) => {
    const id = item.weighingSessionItemId;
    const draft = formMap[id] || {};

    const weight2Kg = draft.weight2 === '' ? null : Number(draft.weight2);
    const weight2Gr = weight2Kg == null || Number.isNaN(weight2Kg)
      ? null
      : Math.max(0, Math.round(weight2Kg * 1000));

    const payload = {
      inkCode: (draft.inkCode ?? item.inkCode) || '',
      inkName: (draft.inkName ?? item.inkName) || '',
      weight2: weight2Gr,
    };

    try {
      setSavingMap(m => ({ ...m, [id]: true }));
      await axios.put(`${BASE_URL_SERVER_THLA}/api/ink-weighing/items/${id}`, payload);

      const newDisplayWeight = (weight2Gr ?? item.weight);

      setData(prev => prev.map(s =>
        s.weighingSessionId === sessionId
          ? {
              ...s,
              items: s.items.map(it =>
                it.weighingSessionItemId === id
                  ? {
                      ...it,
                      inkCode: payload.inkCode,
                      inkName: payload.inkName,
                      weight2: weight2Gr,
                      weight: newDisplayWeight,
                      updatedAt: new Date().toISOString(),
                    }
                  : it
              )
            }
          : s
      ));

      setAllData(prev => prev.map(s =>
        s.weighingSessionId === sessionId
          ? {
              ...s,
              items: s.items.map(it =>
                it.weighingSessionItemId === id
                  ? {
                      ...it,
                      inkCode: payload.inkCode,
                      inkName: payload.inkName,
                      weight2: weight2Gr,
                      weight: newDisplayWeight,
                      updatedAt: new Date().toISOString(),
                    }
                  : it
              )
            }
          : s
      ));

      setEditMap(m => ({ ...m, [id]: false }));
      await fetchPage();
      await fetchMeta();
    } catch (e) {
      console.error('Lỗi lưu item:', e);
      alert('Lưu thất bại');
    } finally {
      setSavingMap(m => ({ ...m, [id]: false }));
    }
  };

  // ==== UI config ====
  const SHOW_ACTIONS = ACTION_UPDATE_HISTORY;

  const ITEM_HEADERS = ['Mã mực','Tên mực','Khối lượng (kg)','Khối lượng (g)', 'PJ Name', 'PJ weight (g)'];
  if (SHOW_ACTIONS) {
    ITEM_HEADERS.push('Thao tác','Đã sửa?');
  }
  // Header đầy đủ: chỉ 1 cột Edited?
  const TABLE_HEADERS = [
    'STT','Mã cân','Nghiệp vụ','Mã HSKT','Tổ in','Chuyền','Số CT','Thời gian',
    'Edited?', // NEW (click để xem chi tiết)
    ...ITEM_HEADERS,
    'Người cấp'
  ];

   // format helper
 const pad2 = (n) => String(n).padStart(2, '0');
 const yyyymmddTo_ddmmyy = (s) => {
   // s: 'YYYY-MM-DD' → 'DD/MM/YY'
   if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return '';
   const [Y, M, D] = s.split('-');
   const yy = Y.slice(2);
   return `${D}/${M}/${yy}`;
 };
 const now = new Date();
 const HH = pad2(now.getHours());
 const mm = pad2(now.getMinutes());
 const hsktTimeStr = `${HH}:${mm}~${yyyymmddTo_ddmmyy(filters.date)}`; // ví dụ "10:59~06/10/25"

// 'YYYY-MM-DD' -> 'YYMMDD'
const yyyymmddTo_yymmdd = (s) => {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return '';
  const [Y, M, D] = s.split('-');
  return `${Y.slice(2)}${M}${D}`; // YYMMDD
};

// Lấy mã ca từ editedWorkShift (đã là C1/C2/C3/D1/D2/HC)
const getShiftCode = (v) => (v || '').toString().trim().toUpperCase(); 


  const handleCreateSubmit = async (e) => {
  e.preventDefault();
  setCreateError(null);

  // --- VALIDATE cơ bản ---
  const op = createForm.operationCode; // 'CM' | 'TV' | 'GC'

  if (!op) {
    setCreateError('Vui lòng chọn Nghiệp vụ.');
    return;
  }

  // Lọc bỏ dòng item trống
  const cleanedItems = (createForm.items || []).map(x => ({
    inkCode: trimStr(x.inkCode),
    inkName: trimStr(x.inkName),
    productionDate: trimStr(x.productionDate) || null, // format 'YYYY-MM-DD'
    weight: toInt(x.weight),       // g
    pjName: trimStr(x.pjName),
    pjWeight: toInt(x.pjWeight),   // g
  })).filter(x =>
    x.inkCode || x.inkName || x.weight > 0 || x.pjName || x.pjWeight > 0 || x.productionDate
  );

  if (cleanedItems.length === 0) {
    setCreateError('Vui lòng nhập ít nhất 1 item màu.');
    return;
  }

  // Validate theo loại nghiệp vụ
  if (op === 'CM' || op === 'TV') {
    if (!trimStr(createForm.department)) {
      setCreateError('CM/TV: Vui lòng nhập Bộ phận.');
      return;
    }
    if (!trimStr(createForm.unit)) {
      setCreateError('CM/TV: Vui lòng nhập Chuyền.');
      return;
    }
    // editedWorkShift / editedScaleShift có thể để trống nếu không dùng
  } else if (op === 'GC') {
    if (!trimStr(createForm.editedWorkShift) && !trimStr(createForm.editedScaleShift)) {
      setCreateError('GC: Cần nhập ít nhất 1 trong 2: Xe giao/Xe nhận.');
      return;
    }
  }

  // --- BUILD PAYLOAD ---
  const base = {
    operationCode: op,               // 'CM' | 'TV' | 'GC'
    date: filters.date || null,      // optional: nếu backend cần ngày; bỏ nếu server tự set
  };

  const parentCM_TV = {
    hsktId: trimStr(createForm.hsktId) || null,
    Lenhsx: trimStr(createForm.Lenhsx) || null,
    department: trimStr(createForm.department) || null,
    unit: trimStr(createForm.unit) || null,
    editedWorkShift: trimStr(createForm.editedWorkShift) || null,   // C1/C2/C3/D1/D2/HC
    editedScaleShift: trimStr(createForm.editedScaleShift) || null, // C1/C2/C3/D1/D2/HC
  };

  const parentGC = {
    // số xe: giữ string nếu backend mong string, đổi Number(...) nếu cần số nguyên
    scaleDeliveredBy: trimStr(createForm.editedWorkShift) || null,
    scaleReceivedBy: trimStr(createForm.editedScaleShift) || null,
  };

  const isCM_TV = op === 'CM' || op === 'TV';
const workShift = isCM_TV ? getShiftCode(createForm.editedWorkShift) : '';
const scaleShift = isCM_TV ? getShiftCode(createForm.editedScaleShift) : '';

const yymmdd = yyyymmddTo_yymmdd(filters.date); // ví dụ '2025-10-06' -> '251006'
const ngaycaStr = (isCM_TV && yymmdd && scaleShift) ? `${yymmdd}${scaleShift}` : null;


const editedScaleShifttmp = (isCM_TV && yymmdd && scaleShift) ? `${yymmdd}${scaleShift}` : null;
const editedWorkShifttmp = (isCM_TV && yymmdd && workShift) ? `${yymmdd}${workShift}` : null;

  const payload = {
    ...base,
    ...(op === 'GC' ? parentGC : parentCM_TV),
    items: cleanedItems,
    hskt: 'Nhập tay',
    scaleCode: 999,
    hskt_time: hsktTimeStr,
    editedScaleShift: editedScaleShifttmp,
    editedWorkShift: editedWorkShifttmp,
    ngayca: ngaycaStr,
    // optional: nếu cần lưu user tạo
    // createdBy: user?.username || null,
  };

  // --- CALL API ---
  try {
    setCreating(true);
    await axios.post(`${BASE_URL_SERVER_THLA}/api/ink-weighing/sessions`, payload);

    // reset form + đóng modal + refresh list & stats
    setCreateForm({
      operationCode: 'CM',
      hsktId: '',
      Lenhsx: '',
      department: '',
      unit: '',
      editedWorkShift: '',
      editedScaleShift: '',
      scaleDeliveredBy: '',
      scaleReceivedBy: '',
      items: [{ inkCode: '', inkName: '', productionDate: '', weight: '', pjName: '', pjWeight: '' }],
    });
    setOpenCreate(false);

    // refresh dữ liệu
    await fetchPage();
    await fetchMeta();
  } catch (err) {
    console.error('Create order error:', err);
    const msg = err?.response?.data?.message || err?.message || 'Tạo lệnh thất bại.';
    setCreateError(msg);
  } finally {
    setCreating(false);
  }
};


  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-[1300px] space-y-5">
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 overflow-hidden">
          {/* Header */}
          <div className="flex flex-col gap-4 border-b border-slate-200/60 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-lg sm:text-xl font-semibold text-slate-800">📜 Lịch sử cân mực</h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium shadow-sm bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  title="Tạo lệnh cấp mực"
                >
                  <FiPlus className="text-base" />
                  Thêm lệnh cân mực
                </button>
                <button
                onClick={exportToExcel}
                disabled={exporting || isLoading}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2
                ${exporting || isLoading
                  ? 'bg-emerald-400 text-white opacity-70 cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 focus:ring-emerald-500/40'}`}
              >
                {exporting ? <FiLoader className="animate-spin" /> : <FiDownload className="text-base" />}
                {exporting ? 'Đang xuất...' : 'Xuất Excel'}
              </button>
            </div>
            </div>

            {/* Stats mini */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-xl border border-slate-200/70 p-3">
                <div className="text-[11px] uppercase text-slate-500">Tổng lượt cân (tất cả)</div>
                <div className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  {isMetaLoading && <FiLoader className="animate-spin text-indigo-600" />} {totalSessions}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200/70 p-3">
                <div className="text-[11px] uppercase text-slate-500">Tổng khối lượng (tất cả)</div>
                <div className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  {isMetaLoading && <FiLoader className="animate-spin text-indigo-600" />} {(totalWeight / 1000).toFixed(2)} kg
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex flex-col">
                <label className="text-xs font-medium text-slate-600 mb-1">Ngày</label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  value={filters.date}
                  onChange={(e) => handleFilterChange('date', e.target.value)}
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-medium text-slate-600 mb-1">Nghiệp vụ</label>
                <select
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  value={filters.operation}
                  onChange={(e) => handleFilterChange('operation', e.target.value)}
                >
                  <option value="">Tất cả</option>
                  <option value="CP">Cấp phát</option>
                  <option value="TH">Thu hồi</option>
                  <option value="CM">Cấp mực</option>
                  <option value="TV">Trả về</option>
                  <option value="GC">Giao ca</option>
                  <option value="CX">Chuyển xe</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-medium text-slate-600 mb-1">Bộ phận</label>
                <select
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  value={filters.department}
                  onChange={(e) => handleFilterChange('department', e.target.value)}
                >
                  <option value="">Tất cả</option>
                  {departments.map((d, idx) => (
                    <option key={idx} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-medium text-slate-600 mb-1">Chuyền</label>
                <select
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  value={filters.unit}
                  onChange={(e) => handleFilterChange('unit', e.target.value)}
                >
                  <option value="">Tất cả</option>
                  {units.map((u, idx) => (
                    <option key={idx} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-0 sm:p-5">
            <div className="relative overflow-hidden rounded-xl border border-slate-200">
              {isLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
                  <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow">
                    <FiLoader className="animate-spin text-indigo-600 text-xl" />
                    <span className="text-sm text-slate-700">Đang tải dữ liệu...</span>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-[1600px] w-full text-sm">
                  <thead className="bg-slate-50 sticky top-0 z-10">
                    <tr className="text-[12px] uppercase tracking-wide text-slate-600">
                      {TABLE_HEADERS.map((h, i) => (
                        <th key={i} className="border-b border-slate-200 px-3 py-2 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {data.length === 0 ? (
                      <tr>
                        <td colSpan={TABLE_HEADERS.length} className="px-3 py-10 text-center text-slate-500">
                          Không có dữ liệu
                        </td>
                      </tr>
                    ) : (
                      data.map((session, sIdx) =>
                        Array.isArray(session.items) && session.items.length > 0 ? (
                          session.items.map((item, iIdx) => {
                            const id = item.weighingSessionItemId;
                            const isEditing = !!editMap[id];
                            const form = formMap[id] || {};
                            const sid = session.weighingSessionId;
                            const open = openDetailSessionId === sid;

                            return (
                              <tr
                                key={`row-${sIdx}-${iIdx}`}
                                className={`relative transition-colors ${sIdx % 2 === 0 ? 'bg-white' : 'bg-slate-100'} hover:bg-slate-200 border-b border-slate-300`}
                              >
                                {iIdx === 0 && (
                                  <>
                                    <td className="px-3 py-2 align-middle font-semibold" rowSpan={session.items.length}>
                                      {sIdx + 1}
                                    </td>
                                    <td className="px-3 py-2 align-middle" rowSpan={session.items.length}>
                                      {session?.weighingSessionId || ''}
                                    </td>
                                    <td className="px-3 py-2 align-middle" rowSpan={session.items.length}>
                                      {opName(session.operationCode)}
                                    </td>
                                    <td className="px-3 py-2 align-middle" rowSpan={session.items.length}>
                                      {session?.hsktId}
                                    </td>
                                    <td className="px-3 py-2 align-middle" rowSpan={session.items.length}>
                                      {session.department?.replace(/^T/, 'Tổ ')}
                                    </td>
                                    <td className="px-3 py-2 align-middle" rowSpan={session.items.length}>
  {(() => {
    const sid = session.weighingSessionId;
    const allowEditUnit = session.operationCode === 'CM' || session.operationCode === 'TV';
    const isEditingUnit = !!sessEditMap[sid];
    const form = sessFormMap[sid] || {};

    if (!allowEditUnit) {
      return <>{displayUnit(session)}</>;
    }

    return (
      <div className="flex items-center gap-2">
        {!isEditingUnit ? (
          <>
            <span>{displayUnit(session)}</span>
            <button
              type="button"
              onClick={() => startEditUnit(session)}
              disabled={isAnySaving}
              className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs
                ${isAnySaving ? 'border-slate-200 text-slate-400 cursor-not-allowed' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
              title="Sửa Chuyền (CM/TV)"
            >
              <FiEdit2 /> Sửa
            </button>
          </>
        ) : (
          <>
            <input
              value={form.editedUnit ?? ''}
              onChange={(e)=>changeSessionField(sid,'editedUnit', e.target.value)}
              disabled={!!sessSavingMap[sid]}
              className={`w-24 rounded border px-2 py-1 text-sm ${sessSavingMap[sid] ? 'bg-slate-100 text-slate-400' : 'border-slate-300'}`}
              placeholder="VD: M7"
            />
            <button
              onClick={() => saveEditedUnit(session)}
              disabled={!!sessSavingMap[sid]}
              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs text-white
                ${sessSavingMap[sid] ? 'bg-emerald-400 opacity-70 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}
            >
              {sessSavingMap[sid] ? <FiLoader className="animate-spin" /> : <FiSave />}
              {sessSavingMap[sid] ? 'Đang lưu...' : 'Lưu'}
            </button>
            <button
              onClick={() => cancelEditUnit(sid)}
              disabled={!!sessSavingMap[sid]}
              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs
                ${sessSavingMap[sid] ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-200 text-slate-700'}`}
            >
              <FiX /> Huỷ
            </button>
          </>
        )}
      </div>
    );
  })()}
</td>

                                    <td className="px-3 py-2 align-middle" rowSpan={session.items.length}>
                                      {session.workShift}
                                    </td>
                                    <td className="px-3 py-2 align-middle" rowSpan={session.items.length}>
                                      {formatTime(session.startTime)} {formatDate(session.weighStartDate)}
                                      <span className="px-2">—</span>
                                      {formatTime(session.endTime)} {formatDate(session.weighEndDate)}
                                    </td>

                                    {/* Edited? + popover chi tiết */}
                                    <td className="px-3 py-2 align-middle text-center relative" rowSpan={session.items.length}>
                                      <button
                                        type="button"
                                        onClick={() => toggleDetail(sid)}
                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ring-1
                                          ${isSessionEdited(session)
                                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100'
                                            : 'bg-slate-50 text-slate-600 ring-slate-200 hover:bg-slate-100'}`}
                                        title="Bấm để xem chi tiết chỉnh sửa"
                                      >
                                        {isSessionEdited(session) ? <FiCheck /> : <FiX />}
                                        {isSessionEdited(session) ? 'Đã edit' : 'Không edit'}
                                      </button>

                                      {open && (
                                        <div className="absolute z-20 mt-2 left-1/2 -translate-x-1/2 w-[280px] rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-xl">
                                          <div className="font-semibold mb-1">Chi tiết edited</div>
                                          <div className="text-slate-700">{buildEditedDetail(session)}</div>
                                          <div className="mt-2 text-right">
                                            <button
                                              className="inline-flex items-center gap-1 rounded px-2 py-1 border border-slate-300 text-slate-700 hover:bg-slate-50"
                                              onClick={() => setOpenDetailSessionId(null)}
                                            >
                                              <FiX /> Đóng
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </td>
                                  </>
                                )}

                                {/* Mã mực (editable) */}
                                <td className="px-3 py-2 align-middle">
                                  {isEditing ? (
                                    <input
                                      value={form.inkCode ?? ''}
                                      onChange={(e)=>changeForm(id,'inkCode',e.target.value)}
                                      disabled={!!savingMap[id]}
                                      className={`w-36 rounded border px-2 py-1 text-sm ${savingMap[id] ? 'bg-slate-100 text-slate-400' : 'border-slate-300'}`}
                                      placeholder="Mã mực"
                                    />
                                  ) : (
                                    item.inkCode
                                  )}
                                </td>

                                {/* Tên mực (editable) */}
                                <td className="px-3 py-2 align-middle">
                                  {isEditing ? (
                                    <input
                                      value={form.inkName ?? ''}
                                      onChange={(e)=>changeForm(id,'inkName',e.target.value)}
                                      disabled={!!savingMap[id]}
                                      className={`w-44 rounded border px-2 py-1 text-sm ${savingMap[id] ? 'bg-slate-100 text-slate-400' : 'border-slate-300'}`}
                                      placeholder="Tên mực"
                                    />
                                  ) : (
                                    item.inkName
                                  )}
                                </td>

                                {/* Khối lượng (kg) (editable) */}
                                <td className="px-3 py-2 text-right font-medium align-middle">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      step="0.001"
                                      inputMode="decimal"
                                      value={form.weight2 ?? ''}
                                      onChange={(e)=>changeForm(id,'weight2',e.target.value)}
                                      disabled={!!savingMap[id]}
                                      className={`w-28 rounded border px-2 py-1 text-sm text-right ${savingMap[id] ? 'bg-slate-100 text-slate-400' : 'border-slate-300'}`}
                                      placeholder={`${(item.weight/1000).toFixed(2)} kg`}
                                    />
                                  ) : (
                                    <span className="tabular-nums">
                                      {(item.weight/1000).toFixed(2)}
                                    </span>
                                  )}
                                </td>

                                {/* Khối lượng (g) */}
                                <td className="px-3 py-2 text-right font-medium align-middle">
                                  {item.weight}
                                </td>

                                {/* PJ Name */}
                                <td className="px-3 py-2 text-right font-medium align-middle">
                                  {item.pjName}
                                </td>

                                {/* PJ weight (g) */}
                                <td className="px-3 py-2 text-right font-medium align-middle">
                                  {item.pjWeight}
                                </td>

                                {/* Thao tác */}
                                {SHOW_ACTIONS && (
                                  <td className="px-3 py-2 align-middle">
                                    {isEditing ? (
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={()=>saveEdit(session.weighingSessionId, item)}
                                          disabled={!!savingMap[id]}
                                          className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs
                                            ${savingMap[id] ? 'bg-emerald-400 text-white opacity-70 cursor-not-allowed' : 'bg-emerald-600 text-white'}`}
                                        >
                                          {savingMap[id] ? <FiLoader className="animate-spin" /> : <FiSave />}
                                          {savingMap[id] ? 'Đang lưu...' : 'Lưu'}
                                        </button>
                                        <button
                                          onClick={()=>cancelEdit(id)}
                                          disabled={!!savingMap[id]}
                                          className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs
                                            ${savingMap[id] ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-200 text-slate-700'}`}
                                        >
                                          <FiX /> Huỷ
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={()=>startEdit(item)}
                                        disabled={isAnySaving}
                                        className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-xs
                                          ${isAnySaving ? 'border-slate-200 text-slate-400 cursor-not-allowed' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                                        title="Sửa mã, tên & khối lượng (kg)"
                                      >
                                        <FiEdit2 /> Sửa
                                      </button>
                                    )}
                                  </td>
                                )}

                                {/* Đã sửa? (item-level) */}
                                {SHOW_ACTIONS && (
                                  <td className="px-3 py-2 align-middle text-center">
                                    {item.weight2 == null
                                      ? <FiX className="text-red-500 inline" title="Chưa chỉnh sửa" />
                                      : <FiCheck className="text-emerald-600 inline" title="Đã chỉnh sửa" />
                                    }
                                  </td>
                                )}

                                {/* Người nhận (rowSpan theo session) */}
                                {iIdx === 0 && (
                                  <td className="px-3 py-2 align-middle" rowSpan={session.items.length}>
                                    {session.inkIssuedBy}
                                  </td>
                                )}
                              </tr>
                            );
                          })
                        ) : (
                          <tr key={`row-${sIdx}-0`} className={`transition-colors ${sIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'} hover:bg-slate-100`}>
                            <td className="px-3 py-2">{sIdx + 1}</td>
                            <td className="px-3 py-2">{session?.scaleCode || ''}</td>
                            <td className="px-3 py-2">{opName(session.operationCode)}</td>
                            <td className="px-3 py-2">{session?.hsktId}</td>
                            <td className="px-3 py-2">{session.department?.replace(/^T/, 'Tổ ')}</td>
                            <td className="px-3 py-2">
  {(() => {
    const sid = session.weighingSessionId;
    const allowEditUnit = session.operationCode === 'CM' || session.operationCode === 'TV';
    const isEditingUnit = !!sessEditMap[sid];
    const form = sessFormMap[sid] || {};

    if (!allowEditUnit) return <>{displayUnit(session)}</>;

    return !isEditingUnit ? (
      <div className="flex items-center gap-2">
        <span>{displayUnit(session)}</span>
        <button
          type="button"
          onClick={() => startEditUnit(session)}
          disabled={isAnySaving}
          className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs
            ${isAnySaving ? 'border-slate-200 text-slate-400 cursor-not-allowed' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
          title="Sửa Chuyền (CM/TV)"
        >
          <FiEdit2 /> Sửa
        </button>
      </div>
    ) : (
      <div className="flex items-center gap-2">
        <input
          value={form.editedUnit ?? ''}
          onChange={(e)=>changeSessionField(sid,'editedUnit', e.target.value)}
          disabled={!!sessSavingMap[sid]}
          className={`w-24 rounded border px-2 py-1 text-sm ${sessSavingMap[sid] ? 'bg-slate-100 text-slate-400' : 'border-slate-300'}`}
          placeholder="VD: M7"
        />
        <button
          onClick={() => saveEditedUnit(session)}
          disabled={!!sessSavingMap[sid]}
          className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs text-white
            ${sessSavingMap[sid] ? 'bg-emerald-400 opacity-70 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}
        >
          {sessSavingMap[sid] ? <FiLoader className="animate-spin" /> : <FiSave />}
          {sessSavingMap[sid] ? 'Đang lưu...' : 'Lưu'}
        </button>
        <button
          onClick={() => cancelEditUnit(sid)}
          disabled={!!sessSavingMap[sid]}
          className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs
            ${sessSavingMap[sid] ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-200 text-slate-700'}`}
        >
          <FiX /> Huỷ
        </button>
      </div>
    );
  })()}
</td>

                            <td className="px-3 py-2">{session.workShift}</td>
                            <td className="px-3 py-2">
                              {formatTime(session.startTime)} {formatDate(session.weighStartDate)}
                              <span className="px-2">—</span>
                              {formatTime(session.endTime)} {formatDate(session.weighEndDate)}
                            </td>

                            {/* Edited? + popover */}
                            <td className="px-3 py-2 align-middle text-center relative">
                              <button
                                type="button"
                                onClick={() => toggleDetail(session.weighingSessionId)}
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ring-1
                                  ${isSessionEdited(session)
                                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100'
                                    : 'bg-slate-50 text-slate-600 ring-slate-200 hover:bg-slate-100'}`}
                                title="Bấm để xem chi tiết chỉnh sửa"
                              >
                                {isSessionEdited(session) ? <FiCheck /> : <FiX />}
                                {isSessionEdited(session) ? 'Đã edit' : 'Không edit'}
                              </button>

                              {openDetailSessionId === session.weighingSessionId && (
                                <div className="absolute z-20 mt-2 left-1/2 -translate-x-1/2 w-[280px] rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-xl">
                                  <div className="font-semibold mb-1">Chi tiết edited</div>
                                  <div className="text-slate-700">{buildEditedDetail(session)}</div>
                                  <div className="mt-2 text-right">
                                    <button
                                      className="inline-flex items-center gap-1 rounded px-2 py-1 border border-slate-300 text-slate-700 hover:bg-slate-50"
                                      onClick={() => setOpenDetailSessionId(null)}
                                    >
                                      <FiX /> Đóng
                                    </button>
                                  </div>
                                </div>
                              )}
                            </td>

                            {/* Không có item => gộp các cột item-level */}
                            <td className="px-3 py-2 italic text-slate-400" colSpan={ITEM_HEADERS.length}>(Không có mục mực nào)</td>
                            <td className="px-3 py-2">{session.receivedBy}</td>
                          </tr>
                        )
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 disabled:opacity-50"
              >
                <FiChevronLeft /> Trước
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`min-w-[36px] rounded-lg px-3 py-1.5 text-sm ${
                    currentPage === p
                      ? 'bg-indigo-600 text-white'
                      : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 disabled:opacity-50"
              >
                Sau <FiChevronRight />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast trạng thái chung khi đang lưu */}
      {isAnySaving && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-white/90 shadow-lg ring-1 ring-slate-200 px-3 py-2 flex items-center gap-2">
          <FiLoader className="animate-spin text-indigo-600" />
          <span className="text-sm text-slate-700">Đang lưu thay đổi…</span>
        </div>
      )}

      {/* ===== Create Modal ===== */}
{openCreate && (
  <div className="fixed inset-0 z-[999]">
    {/* backdrop */}
    <div
      className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
      onClick={closeCreateModal}
    />
    {/* panel */}
    <div className="absolute inset-0 flex items-start justify-center p-4 sm:p-6 pt-16 sm:pt-20 overflow-hidden">
      <form
        onSubmit={handleCreateSubmit}
        className="relative w-full max-w-4xl rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 max-h-[85vh] flex flex-col"
      >
        {/* Modal header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 sm:px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-slate-800">➕ Tạo lệnh cân mực</span>
            <span className="text-xs px-2 py-0.5 rounded-full ring-1 ring-slate-300 text-slate-600 bg-slate-50">
              {createForm.operationCode}
            </span>
          </div>
          <button
            type="button"
            onClick={closeCreateModal}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            <FiX /> Đóng
          </button>
        </div>

        {/* Modal body */}
        <div className="px-4 sm:px-6 py-4 space-y-5 flex-1 overflow-y-auto">
          {/* Operation */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col">
              <label className="text-xs font-medium text-slate-600 mb-1">Nghiệp vụ</label>
              <select
                value={createForm.operationCode}
                onChange={(e)=>changeCreateField('operationCode', e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              >
                <option value="CM">Cấp mực (CM)</option>
                <option value="TV">Trả về (TV)</option>
                <option value="GC">Giao ca (GC)</option>
              </select>
            </div>
          </div>

          {/* Thông tin cha: CM/TV */}
          {isCMorTV && (
            <div className="rounded-xl border border-slate-200">
              <div className="px-3 py-2 border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 uppercase">
                Thông tin {createForm.operationCode}
              </div>
              <div className="p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="flex flex-col">
                  <label className="text-xs font-medium text-slate-600 mb-1">Hồ sơ kỹ thuật</label>
                  <input
                    value={createForm.hsktId}
                    onChange={(e)=>changeCreateField('hsktId', e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="VD: HSKT-2025-001"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-medium text-slate-600 mb-1">Lệnh sản xuất</label>
                  <input
                    value={createForm.Lenhsx}
                    onChange={(e)=>changeCreateField('Lenhsx', e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="VD: LSX-7890"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-medium text-slate-600 mb-1">Bộ phận/Tổ</label>
                  <input
                    value={createForm.department}
                    onChange={(e)=>changeCreateField('department', e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="VD: C3"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-medium text-slate-600 mb-1">Chuyền/Máy</label>
                  <input
                    value={createForm.unit}
                    onChange={(e)=>changeCreateField('unit', e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="VD: M7"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-medium text-slate-600 mb-1">Ca chuyền</label>
                  <select
                    value={createForm.editedWorkShift}
                    onChange={(e)=>changeCreateField('editedWorkShift', e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                  >
                    <option value="">-- Chọn ca chuyền --</option>
                    {SHIFT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-medium text-slate-600 mb-1">Ca xe</label>
                  <select
                    value={createForm.editedScaleShift}
                    onChange={(e)=>changeCreateField('editedScaleShift', e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                  >
                    <option value="">-- Chọn ca xe --</option>
                    {SHIFT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Thông tin cha: GC */}
          {isGC && (
            <div className="rounded-xl border border-slate-200">
              <div className="px-3 py-2 border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 uppercase">
                Thông tin {createForm.operationCode}
              </div>
              <div className="p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="flex flex-col">
                <label className="text-xs font-medium text-slate-600 mb-1">Ca chuyền</label>
                <select
                  value={createForm.editedWorkShift}
                  onChange={(e)=>changeCreateField('editedWorkShift', e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                >
                  <option value="">-- Chọn ca chuyền --</option>
                  {SHIFT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-medium text-slate-600 mb-1">Ca xe</label>
                <select
                  value={createForm.editedScaleShift}
                  onChange={(e)=>changeCreateField('editedScaleShift', e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                >
                  <option value="">-- Chọn ca xe --</option>
                  {SHIFT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              </div>
            </div>
          )}

          {/* Items */}
          <div className="rounded-xl border border-slate-200">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 bg-slate-50">
              <div className="text-xs font-semibold text-slate-700 uppercase">Danh sách màu</div>
              <button
                type="button"
                onClick={addItemRow}
                className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs text-indigo-700 hover:bg-indigo-100"
              >
                <FiPlus /> Thêm dòng
              </button>
            </div>

            <div className="p-3 overflow-x-auto min-h-0">
              <table className="min-w-[900px] w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-slate-600 bg-slate-50">
                    <th className="px-3 py-2 text-left">Mã màu</th>
                    <th className="px-3 py-2 text-left">Tên màu</th>
                    <th className="px-3 py-2 text-left">Ngày SX</th>
                    <th className="px-3 py-2 text-right">Khối lượng (g)</th>
                    <th className="px-3 py-2 text-left">Tên PJ</th>
                    <th className="px-3 py-2 text-right">Khối lượng PJ (g)</th>
                    <th className="px-3 py-2 text-center">Xoá</th>
                  </tr>
                </thead>
                <tbody>
                  {createForm.items.map((it, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-3 py-2">
                        <input
                          value={it.inkCode}
                          onChange={(e)=>changeItemField(idx,'inkCode', e.target.value)}
                          className="w-36 rounded border border-slate-300 px-2 py-1"
                          placeholder="VD: GA.5000"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={it.inkName}
                          onChange={(e)=>changeItemField(idx,'inkName', e.target.value)}
                          className="w-48 rounded border border-slate-300 px-2 py-1"
                          placeholder="VD: J3.WHITE"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="date"
                          value={it.productionDate}
                          onChange={(e)=>changeItemField(idx,'productionDate', e.target.value)}
                          className="rounded border border-slate-300 px-2 py-1"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          inputMode="numeric"
                          value={it.weight}
                          onChange={(e)=>changeItemField(idx,'weight', e.target.value)}
                          className="w-32 rounded border border-slate-300 px-2 py-1 text-right"
                          placeholder="(g)"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={it.pjName}
                          onChange={(e)=>changeItemField(idx,'pjName', e.target.value)}
                          className="w-40 rounded border border-slate-300 px-2 py-1"
                          placeholder="Tên PJ"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          inputMode="numeric"
                          value={it.pjWeight}
                          onChange={(e)=>changeItemField(idx,'pjWeight', e.target.value)}
                          className="w-32 rounded border border-slate-300 px-2 py-1 text-right"
                          placeholder="(g)"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={()=>removeItemRow(idx)}
                          className="inline-flex items-center gap-1 rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                          title="Xoá dòng"
                        >
                          <FiTrash />
                          Xoá
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Gợi ý nhỏ */}
              <div className="mt-2 text-xs text-slate-500">
                * Khối lượng nhập **(g)**. Nếu bạn đang có kg, nhân 1000 trước khi nhập.
              </div>
            </div>
          </div>
        </div>

        {/* Modal footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 sm:px-6 py-3">
          <button
            type="button"
            onClick={closeCreateModal}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <FiX /> Huỷ
          </button>
          <button
            type="submit"
            disabled={creating}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2
              ${creating ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500/40'}`}
          >
            {creating ? <FiLoader className="animate-spin" /> : <FiCheck />}
            {creating ? 'Đang tạo...' : 'Tạo lệnh'}
          </button>
        </div>
      </form>
    </div>
    
{createError && (
  <div className="px-4 sm:px-6 z-[1000]">
    <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {createError}
    </div>
  </div>
)}
  </div>
)}


    </div>
  );
}

export default HistoryWeigh;
