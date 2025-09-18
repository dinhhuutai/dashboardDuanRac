import { useEffect, useState } from 'react';
import http from '~/api/http';

export default function AdminNotOrdered(){
  const [week,setWeek]=useState(getMondayStr(new Date())); const [dept,setDept]=useState('');
  const [list,setList]=useState([]);
  useEffect(()=>{ (async()=>{ const rs=await http.get('/api/lunch-order/meal/not-ordered',{params:{weekStartMonday:week, departmentId:dept||null}}); setList(rs.data.data); })(); },[week,dept]);

  return (
    <div className="p-4">
      <div className="mb-3 flex gap-2 items-center">
        <input type="date" value={week} onChange={e=>setWeek(e.target.value)} className="border rounded px-3 py-2 text-sm"/>
        <DeptSelect value={dept} onChange={setDept}/>
        <div className="text-sm">Chưa đặt: <b>{list.length}</b> người</div>
      </div>
      <div className="rounded-xl border bg-white overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50"><tr><th className="p-2">#</th><th className="p-2">Bộ phận</th><th className="p-2">Họ tên</th></tr></thead>
          <tbody className="divide-y">{list.map((r,i)=>(<tr key={r.userID}><td className="p-2 text-center">{i+1}</td><td className="p-2">{r.departmentName||'-'}</td><td className="p-2">{r.fullName}</td></tr>))}</tbody>
        </table>
      </div>
    </div>
  );
}
function DeptSelect({value,onChange}){ const [list,setList]=useState([]); useEffect(()=>{(async()=>{ const rs=await http.get('/api/lunch-order/meal/departments'); setList(rs.data.data); })();},[]); return (<select value={value} onChange={e=>onChange(e.target.value)} className="border rounded px-3 py-2 text-sm"><option value="">Tất cả bộ phận</option>{list.map(d=><option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>)}</select>); }
function getMondayStr(d){ const dd=new Date(d); const day=dd.getDay()||7; if(day!==1) dd.setDate(dd.getDate()-day+1); return dd.toISOString().slice(0,10); }
