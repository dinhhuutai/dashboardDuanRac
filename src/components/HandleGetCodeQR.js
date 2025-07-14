import axios from "axios";
import { BASE_URL } from "~/config/index";

export default async function HandleGetCodeQr(selectInput) {
    
    let departmentName = selectInput.group;
    let unitName = selectInput.item;
    let trashName = selectInput.index;
    let workShift = selectInput.index;

    if (departmentName === 'T3'){
        departmentName = 'Tổ 3';
    } else if (departmentName === 'T4A' || departmentName === 'T4B' || departmentName === 'Robot') {
        departmentName = 'Tổ 4';
    } else if (departmentName === 'T5') {
        departmentName = 'Tổ 5';
    } else if (departmentName === 'Bổ sung') {
        departmentName = 'Tổ bổ sung';
    } else if (departmentName === 'Mẫu') {
        departmentName = 'Tổ mẫu';
    } else if (departmentName === 'Canh hàng') {
        departmentName = 'Tổ canh hàng';
    } else if (departmentName === 'Chụp khuôn') {
        departmentName = 'Chụp khung';
    } else if (departmentName === 'Logo') {
        departmentName = 'Tổ logo';
    } else if (departmentName === 'Ép') {
        departmentName = 'Tổ ép';
    } else if (departmentName === 'Sửa hàng') {
        departmentName = 'Tổ sửa hàng';
    }

    unitName = unitName.replace('M', 'Chuyền ');
    if (unitName === 'RC T3' || unitName === 'RC T4' || unitName === 'RC T5') {
        unitName = 'Rác thải chung';
    }

    if (trashName <= 6) {
        trashName = 'Giẻ lau có chứa thành phần nguy hại';
    } else if (trashName <= 13) {
        trashName = 'Giẻ lau dính lapa'
    } else if (trashName <= 20) {
        trashName = 'Băng keo dính mực'
    } else if (trashName <= 27) {
        trashName = 'Keo bàn thải'
    } else if (trashName <= 34) {
        trashName = 'Mực in thải'
    } else if (trashName <= 41) {
        trashName = 'Mực in lapa thải'
    } else if (trashName <= 48) {
        trashName = 'Vụn logo'
    } else if (trashName <= 55) {
        trashName = 'Lụa căng khung'
    } else if (trashName <= 62) {
        trashName = 'Rác sinh hoạt'
    }

    if (workShift % 7 === 0) {
        workShift = 'ca1';
    } else if (workShift % 7 === 1) {
        workShift = 'ca2';
    } else if (workShift % 7 === 2) {
        workShift = 'ca3';
    } else if (workShift % 7 === 3) {
        workShift = 'dai1';
    } else if (workShift % 7 === 4) {
        workShift = 'dai2';
    } else if (workShift % 7 === 5) {
        workShift = 'cahc';
    } else if (workShift % 7 === 6) {
        workShift = 'null';
    }

    
    try {
        const res = await axios.get(`${BASE_URL}/trashbins/get-id-by-names?departmentName=${encodeURIComponent(departmentName)}&unitName=${encodeURIComponent(unitName)}&trashName=${encodeURIComponent(trashName)}`);

        return {trashBinCode: res.data.trashBinCode, workShift}; // chứa departmentID, unitID, trashTypeID, trashBinID
    } catch (err) {
        console.error("❌ Lỗi khi lấy TrashBin ID:", err);
        return null;
    }
}