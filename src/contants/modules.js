
const MODULEID = {
    CANRAC: 1,
    CANMUC: 2,
    CONGVIEC: 3,
    HOMTHU: 4,
    TINHLUONG: 5,
    DATCOM: 6,
    HINHDRAWER: 7,
    SANXUAT: 8,
    BIEUMAUNOIBO: 9,
    XEPHOIVAI: 10,
    BMI: 11,
    inkCoveragePercentOnFilm: 12,
    qualityInspectionOQC: 13,
    qualityInspectionKCS: 14,
    consolidate: 15,
    mes: 16,
    capmoney: 17,
    YEUCAU: 18, // Quản lý đề xuất (sql/10) — moduleKey 'yeucau'
}


// Module đã tắt (không dùng nữa, 2026-09-28) — ẩn khỏi trang chủ.
// Backend cũng tắt route + lọc khỏi quyền: ApiDuAnRac/src/config/modules.js — sửa cả hai nơi.
export const DISABLED_MODULE_IDS = [
    MODULEID.CANMUC,
    // MODULEID.CONGVIEC bật lại 2026-11-01 — làm lại thành "Quản lý dự án" (pagesProject, /project)
    MODULEID.SANXUAT,
    MODULEID.XEPHOIVAI,
    MODULEID.BMI,
    MODULEID.qualityInspectionOQC,
    MODULEID.qualityInspectionKCS,
    MODULEID.consolidate,
    MODULEID.mes,
    MODULEID.capmoney,
];
export const isModuleEnabled = (id) => !DISABLED_MODULE_IDS.includes(Number(id));

// moduleKey (cột Modules.moduleKey, không đổi) → moduleId. `RequireModule` dùng để nhận module theo ID:
// API /api/users/:id/modules-roles chỉ trả moduleId + name, không trả moduleKey → khớp theo TÊN thì
// đổi tên module (vd. module 3 "Quản lý công việc" → "Quản lý dự án" ở sql/13) là bị đá về trang chủ.
export const MODULE_ID_BY_KEY = {
    canrac: MODULEID.CANRAC,
    canmuc: MODULEID.CANMUC,
    qlcongviec: MODULEID.CONGVIEC,
    homthu: MODULEID.HOMTHU,
    tinhluong: MODULEID.TINHLUONG,
    datcom: MODULEID.DATCOM,
    hinhdrawer: MODULEID.HINHDRAWER,
    sanxuat: MODULEID.SANXUAT,
    bieumaunoibo: MODULEID.BIEUMAUNOIBO,
    xephoivai: MODULEID.XEPHOIVAI,
    bmi: MODULEID.BMI,
    inkcoveragepercentonfilm: MODULEID.inkCoveragePercentOnFilm,
    'quality-inspection-oqc': MODULEID.qualityInspectionOQC,
    'quality-inspection-kcs': MODULEID.qualityInspectionKCS,
    consolidate: MODULEID.consolidate,
    mes: MODULEID.mes,
    capmoney: MODULEID.capmoney,
    yeucau: MODULEID.YEUCAU,
};

export default MODULEID;