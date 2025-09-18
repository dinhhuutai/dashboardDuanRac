import { useEffect, useState } from 'react';
import http from '~/api/http';

export default function AdminWeeklyMenuBuilder(){
  const [week,setWeek]=useState(nextMondayStr()); const [foods,setFoods]=useState([]); const [entries,setEntries]=useState({1:[],2:[],3:[],4:[],5:[],6:[],7:[]});
  const [menuId,setMenuId]=useState(null); const [locked,setLocked]=useState(false);

  useEffect(()=>{ initWeek(); loadFoods(); },[]);
  useEffect(()=>{ loadMenu(); },[week]);

  async function initWeek(){ await http.post('/api/lunch-order/meal/weekly-menus/init',{weekStartMonday:week}); }
  async function loadFoods(){ const rs=await http.get('/api/lunch-order/meal/foods'); setFoods(rs.data.data||[]); }
  async function loadMenu(){
    const rs=await http.get(`/api/lunch-order/meal/weekly-menus/${week}`);
    const m=rs.data.data.menu; setMenuId(m?.weeklyMenuId||null); setLocked(!!m?.isLocked);
    const list=rs.data.data.entries||[]; const map={1:[],2:[],3:[],4:[],5:[],6:[],7:[]};
    list.forEach(e=>map[e.dayOfWeek].push({foodId:e.foodId, foodName:e.foodName}));
    Object.keys(map).forEach(k=>map[k]=map[k].sort((a,b)=>a.position-b.position));
    setEntries(map);
  }
  function add(dow, f){ if(locked) return; setEntries(prev=>({...prev,[dow]: prev[dow].length>=5?prev[dow]:[...prev[dow],{foodId:f.foodId,foodName:f.foodName}]})); }
  function remove(dow, idx){ if(locked) return; setEntries(prev=>({...prev,[dow]: prev[dow].filter((_,i)=>i!==idx)})); }
  async function save(){
    if(!menuId){ const i=await http.post('/api/lunch-order/meal/weekly-menus/init',{weekStartMonday:week}); await loadMenu(); }
    const payload=[]; Object.entries(entries).forEach(([dow,arr])=>arr.slice(0,5).forEach((f,idx)=>payload.push({dayOfWeek:+dow, position:idx+1, foodId:f.foodId})));
    await http.post(`/api/lunch-order/meal/weekly-menus/${menuId}/entries`,{entries:payload}); alert('Đã lưu'); // thay bằng modal/toast của bạn
  }
  async function lockWeek(){ await http.post(`/api/lunch-order/meal/weekly-menus/${menuId}/lock`); setLocked(true); }

  return (
    <div className="p-4">
      <div className="mb-3 flex gap-2 items-center">
        <input type="date" value={week} onChange={e=>setWeek(e.target.value)} className="border rounded px-3 py-2 text-sm"/>
        {!locked ? <button onClick={save} className="px-4 py-2 rounded text-white bg-emerald-600">💾 Lưu</button> : null}
        {!locked ? <button onClick={lockWeek} className="px-4 py-2 rounded text-white bg-rose-600">🔒 Khóa tuần</button> :
          <span className="px-2 py-1 text-xs rounded bg-rose-50 text-rose-700 border border-rose-200">Đã khóa tuần</span>}
      </div>

      <div className="grid lg:grid-cols-4 gap-4">
        {/* Foods panel */}
        <div className="rounded-xl border bg-white p-3 h-[70vh] overflow-auto">
          <div className="text-sm font-semibold mb-2">Danh sách món</div>
          <div className="grid grid-cols-1 gap-2">
            {foods.map(f=>(
              <button key={f.foodId} onClick={()=>add(activeDow(), f)} className="text-left border rounded-lg px-3 py-2 hover:bg-slate-50">
                <div className="font-semibold">{f.foodName}</div><div className="text-xs text-slate-500">{f.description||''}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Grid tuần */}
        <div className="lg:col-span-3 rounded-xl border bg-white p-3 overflow-auto">
          <div className="grid grid-cols-7 gap-3 min-w-[900px]">
            {Array.from({length:7},(_,i)=>i+1).map(dow=>(
              <div key={dow} className="border rounded-lg p-2">
                <div className="text-center font-semibold mb-1">{['T2','T3','T4','T5','T6','T7','CN'][dow-1]}</div>
                <div className="space-y-2">
                  {entries[dow].map((e,idx)=>(
                    <div key={idx} className="rounded border px-2 py-2 flex justify-between items-center">
                      <span className="text-sm">{idx+1}. {e.foodName}</span>
                      {!locked && <button className="text-rose-600 text-xs" onClick={()=>remove(dow,idx)}>x</button>}
                    </div>
                  ))}
                  {Array.from({length: Math.max(0,5-entries[dow].length)}).map((_,k)=>(
                    <div key={k} className="rounded border border-dashed px-2 py-4 text-center text-slate-400">Trống</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
  function nextMondayStr(){ const d=new Date(); const day=d.getDay()||7; const next=new Date(d); next.setDate(d.getDate() + (8-day)); return next.toISOString().slice(0,10); }
  function activeDow(){ return 1; } // đơn giản: add vào T2; bạn có thể chọn "đang focus" để add đúng cột
}
