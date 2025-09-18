import { useEffect, useMemo, useState } from 'react';
import http from '~/api/http';

export default function AdminHistory(){
  const [week,setWeek]=useState(getMondayStr(new Date()));
  const [dept,setDept]=useState(''); const [day,setDay]=useState(''); const [q,setQ]=useState('');
  const [rows,setRows]=useState([]); const [pageSize,setPageSize]=useState(20); const [page,setPage]=useState(1);

  useEffect(()=>{ load(); },[week,dept,day,q]);
  async function load(){ const rs=await http.get('/api/lunch-order/meal/history',{params:{weekStartMonday:week, departmentId:dept||null, dayOfWeek:day||null, q:q||null}}); setRows(rs.data.data); setPage(1); }

  const totalPages=Math.max(1,Math.ceil(rows.length/pageSize));
  const list=useMemo(()=>rows.slice((page-1)*pageSize,(page-1)*pageSize+pageSize),[rows,page,pageSize]);

  return (
    <div className="p-4">
      <div className="rounded-xl border bg-white p-3 mb-3 grid md:grid-cols-6 gap-2">
        <input type="date" value={week} onChange={e=>setWeek(e.target.value)} className="border rounded px-3 py-2 text-sm"/>
        <select value={day} onChange={e=>setDay(e.target.value)} className="border rounded px-3 py-2 text-sm">
          <option value="">Tất cả ngày</option>{[1,2,3,4,5,6,7].map(n=><option key={n} value={n}>{['T2','T3','T4','T5','T6','T7','CN'][n-1]}</option>)}
        </select>
        <DeptSelect value={dept} onChange={setDept}/>
        <input placeholder="Tìm tên/món..." value={q} onChange={e=>setQ(e.target.value)} className="border rounded px-3 py-2 text-sm"/>
        <div className="text-sm flex items-center">Dòng: <b className="ml-1">{rows.length}</b></div>
      </div>

      <div className="rounded-xl border bg-white overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50"><tr className="text-center">
            <th className="p-2">#</th><th className="p-2">Ngày</th><th className="p-2">Thứ</th><th className="p-2">Bộ phận</th><th className="p-2">Người đặt</th><th className="p-2">Đặt giùm</th><th className="p-2">Món</th><th className="p-2">Khóa</th>
          </tr></thead>
          <tbody className="divide-y">
            {list.map((r,i)=>{ const proxy=r.selectedByFullName && r.selectedByFullName!==r.fullName;
              return (<tr key={r.userWeeklySelectionId} className={`${proxy?'bg-indigo-50':'hover:bg-slate-50'} text-center`}>
                <td className="p-2">{(page-1)*pageSize+i+1}</td>
                <td className="p-2">{fmtDate(r.weekStartMonday,r.dayOfWeek)}</td>
                <td className="p-2">{['T2','T3','T4','T5','T6','T7','CN'][r.dayOfWeek-1]}</td>
                <td className="p-2">{r.departmentName||'-'}</td><td className="p-2">{r.fullName}</td>
                <td className="p-2">{r.selectedByFullName||'-'}</td><td className="p-2">{r.foodName}</td>
                <td className="p-2">{r.isLocked?'Locked':'Open'}</td></tr>);
            })}
          </tbody>
        </table>
        <div className="p-3 border-t flex justify-between items-center text-sm">
          <div>Hiển thị:
            <select className="ml-2 border rounded px-2 py-1" value={pageSize} onChange={e=>setPageSize(+e.target.value)}>{[10,20,50,100].map(n=><option key={n}>{n}</option>)}</select>
          </div>
          <div>Trang:
            {Array.from({length:totalPages}).map((_,n)=>(<button key={n} onClick={()=>setPage(n+1)}
              className={`ml-1 px-3 py-1 rounded border ${n+1===page?'bg-emerald-600 text-white border-emerald-600':'bg-white'}`}>{n+1}</button>))}
          </div>
        </div>
      </div>
    </div>
  );
}
function fmtDate(week,dow){ const b=new Date(week+'T00:00:00'); b.setDate(b.getDate()+dow-1); return `${String(b.getDate()).padStart(2,'0')}-${String(b.getMonth()+1).padStart(2,'0')}-${b.getFullYear()}`; }
function getMondayStr(d){ const dd=new Date(d); const day=dd.getDay()||7; if(day!==1) dd.setDate(dd.getDate()-day+1); return dd.toISOString().slice(0,10); }
function DeptSelect({value,onChange}){ const [list,setList]=useState([]); useEffect(()=>{(async()=>{ const rs=await http.get('/api/lunch-order/meal/departments'); setList(rs.data.data); })();},[]); return (
  <select value={value} onChange={e=>onChange(e.target.value)} className="border rounded px-3 py-2 text-sm">
    <option value="">Tất cả bộ phận</option>{list.map(d=><option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>)}
  </select>);
}
