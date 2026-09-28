
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
}


// Module đã tắt (không dùng nữa, 2026-09-28) — ẩn khỏi trang chủ.
// Backend cũng tắt route + lọc khỏi quyền: ApiDuAnRac/src/config/modules.js — sửa cả hai nơi.
export const DISABLED_MODULE_IDS = [
    MODULEID.CANMUC,
    MODULEID.CONGVIEC,
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

export default MODULEID;