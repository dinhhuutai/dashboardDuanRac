import { useEffect, useState } from 'react';
import http from '~/api/http';
import * as XLSX from 'xlsx'; import { saveAs } from 'file-saver';

export default function AdminReportMatrix(){
  const [week,setWeek]=useState(getMondayStr(new Date()));
  const [dept,setDept]=useState(''); const [rows,setRows]=useState([]);

  useEffect(()=>{ load(); },[week,dept]);
  async function load(){
    const rs=await http.get('/api/lunch-order/meal/report/department-matrix',{params:{weekStartMonday:week,departmentId:dept||null}});
    const map=new Map();
    rs.data.data.forEach(r=>{ if(!map.has(r.userID)) map.set(r.userID,{name:r.fullName, dept:r.departmentName, d:{}}); map.get(r.userID).d[r.dayOfWeek]=r.foodName; });
    setRows(Array.from(map.values()).sort((a,b)=>String(a.dept).localeCompare(String(b.dept))||a.name.localeCompare(b.name)));
  }
  const exportExcel=()=>{ const data=rows.map((r,i)=>({STT:i+1,'Bộ phận':r.dept,'Họ tên':r.name,'T2':r.d[1]||'','T3':r.d[2]||'','T4':r.d[3]||'','T5':r.d[4]||'','T6':r.d[5]||'','T7':r.d[6]||'','CN':r.d[7]||''})); const ws=XLSX.utils.json_to_sheet(data); const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,'Report'); const buf=XLSX.write(wb,{bookType:'xlsx',type:'array'}); saveAs(new Blob([buf]),`BaoCaoDatCom_${week}.xlsx`); };

  return (
    <div className="p-4">
      <div className="mb-3 flex gap-2">
        <input type="date" value={week} onChange={e=>setWeek(e.target.value)} className="border rounded px-3 py-2 text-sm"/>
        <DeptSelect value={dept} onChange={setDept}/>
        <button onClick={exportExcel} className="px-4 py-2 rounded text-white bg-emerald-600">📤 Xuất Excel</button>
      </div>
      <div className="rounded-xl border bg-white overflow-auto">
        <table className="min-w-[900px] text-sm">
          <thead className="bg-slate-50"><tr><th className="p-2">#</th><th className="p-2">Bộ phận</th><th className="p-2">Họ tên</th>{['T2','T3','T4','T5','T6','T7','CN'].map(h=><th key={h} className="p-2">{h}</th>)}</tr></thead>
          <tbody className="divide-y">{rows.map((r,i)=>(<tr key={r.name}><td className="p-2 text-center">{i+1}</td><td className="p-2">{r.dept||'-'}</td><td className="p-2">{r.name}</td>{Array.from({length:7},(_,k)=><td key={k} className="p-2 text-center">{r.d[k+1]?'✓ '+r.d[k+1]:''}</td>)}</tr>))}</tbody>
        </table>
      </div>
    </div>
  );
}
function DeptSelect({value,onChange}){ const [list,setList]=useState([]); useEffect(()=>{(async()=>{ const rs=await http.get('/api/lunch-order/meal/departments'); setList(rs.data.data); })();},[]); return (<select value={value} onChange={e=>onChange(e.target.value)} className="border rounded px-3 py-2 text-sm"><option value="">Tất cả bộ phận</option>{list.map(d=><option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>)}</select>); }
function getMondayStr(d){ const dd=new Date(d); const day=dd.getDay()||7; if(day!==1) dd.setDate(dd.getDate()-day+1); return dd.toISOString().slice(0,10); }
