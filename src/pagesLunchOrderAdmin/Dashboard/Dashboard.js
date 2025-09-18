import { useEffect, useState } from 'react';
import http from '~/api/http';
import io from 'socket.io-client';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie } from 'recharts';
import { BASE_URL } from '~/config';

export default function AdminDashboard(){
  const [week,setWeek]=useState(getMondayStr(new Date()));
  const [stats,setStats]=useState(null); const [loading,setLoading]=useState(false);
  useEffect(()=>{ fetchData(); },[week]);
  useEffect(()=>{ const s=io(BASE_URL.replace('/api','')); s.on('menu:updated',fetchData); s.on('selection:created',fetchData); s.on('selection:deleted',fetchData); return ()=>s.close(); },[]);
  async function fetchData(){ setLoading(true); const rs=await http.get('/api/lunch-order/meal/dashboard',{params:{weekStartMonday:week}}); setStats(rs.data.data); setLoading(false); }
  return (
    <div className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <input type="date" value={week} onChange={e=>setWeek(e.target.value)} className="border rounded px-3 py-2 text-sm"/>
        {stats?.weekLock?.isLocked ? <span className="px-2 py-1 text-xs rounded bg-rose-50 text-rose-700 border border-rose-200">Đã khóa tuần</span> : <span className="px-2 py-1 text-xs rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Đang mở</span>}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card title="User đủ quyền" value={stats?.totalUsers||0}/>
        <Card title="User đã đặt" value={stats?.usersOrdered||0}/>
        <Card title="Chưa đặt" value={stats?.usersNotOrdered||0}/>
        <Card title="Tổng lượt chọn" value={stats?.totalSelections||0}/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <div className="rounded-xl border bg-white p-4">
          <h3 className="font-semibold mb-2">Lượt chọn theo ngày</h3>
          <div className="h-64">
            <ResponsiveContainer><BarChart data={(stats?.byDay||[]).map(d=>({name:['T2','T3','T4','T5','T6','T7','CN'][d.dayOfWeek-1], cnt:d.cnt}))}>
              <XAxis dataKey="name"/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="cnt"/></BarChart></ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <h3 className="font-semibold mb-2">Top món</h3>
          <div className="h-64">
            <ResponsiveContainer><PieChart><Pie data={stats?.topFoods||[]} dataKey="cnt" nameKey="foodName" label/></PieChart></ResponsiveContainer>
          </div>
          <div className="mt-2 text-sm"><b>Ít nhất:</b> {(stats?.lowFoods||[]).map(x=>x.foodName).join(', ')||'—'}</div>
        </div>
      </div>
    </div>
  );
}
const Card=({title,value})=>(<div className="rounded-xl border bg-white p-4"><div className="text-xs text-slate-500">{title}</div><div className="text-2xl font-bold">{value}</div></div>);
function getMondayStr(d){ const dd=new Date(d); const day=dd.getDay()||7; if(day!==1) dd.setDate(dd.getDate()-day+1); return dd.toISOString().slice(0,10); }
