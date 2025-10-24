import React, { useEffect, useMemo, useState } from 'react';
import Select from 'react-select';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import http from '~/api/http';
import { BASE_URL } from '~/config';

export default function MyTasks(){
  const [view, setView] = useState('list'); // list | board | calendar
  const [loading, setLoading] = useState(false);

  // list data
  const [rows, setRows] = useState([]);
  const [totalRows, setTotalRows] = useState(0);

  // filters
  const [status, setStatus] = useState(null);
  const [priority, setPriority] = useState(null);
  const [dueFrom, setDueFrom] = useState('');
  const [dueTo, setDueTo] = useState('');
  const [search, setSearch] = useState('');

  // paging
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // board
  const [columns, setColumns] = useState([]); // [{statusId,statusCode,statusName,items:[]}]
  const [activeTask, setActiveTask] = useState(null);

  // calendar
  const [date, setDate] = useState(()=>new Date().toISOString().slice(0,10));
  const [range, setRange] = useState('week'); // day|week
  const [calendarRows, setCalendarRows] = useState([]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const styles = `
    .card{background:#f5f8ff;border:1px solid #e6ebf4;box-shadow:10px 10px 24px #d9deea,-10px -10px 24px #fff;border-radius:16px;}
    .inset{background:#f5f8ff;border:1px solid #e6ebf4;box-shadow:inset 6px 6px 12px #d9deea,inset -6px -6px 12px #fff;border-radius:12px;}
    .pill{border-radius:9999px;padding:4px 10px;font-size:12px;font-weight:600;border:1px solid #e6ebf4;background:#fff;box-shadow:4px 4px 8px #d9deea,-4px -4px 8px #fff;}
  `;

  useEffect(()=>{ if(view==='list') loadList(); }, [view, status, priority, dueFrom, dueTo, search, page]);
  useEffect(()=>{ if(view==='board') loadBoard(); }, [view]);
  useEffect(()=>{ if(view==='calendar') loadCalendar(); }, [view, date, range]);

  async function loadList(){
    setLoading(true);
    try{
      const res = await http.get(`${BASE_URL}/api/task-management/my`, {
        params: { status, priority, dueFrom, dueTo, search, page, pageSize }
      });
      setRows(res.data?.data || []);
      setTotalRows(res.data?.totalRows || 0);
    } finally { setLoading(false); }
  }

  async function loadBoard(){
    setLoading(true);
    try{
      const res = await http.get(`${BASE_URL}/api/task-management/my/board`);
      setColumns(res.data?.data || []);
    } finally { setLoading(false); }
  }

  async function loadCalendar(){
    setLoading(true);
    try{
      const res = await http.get(`${BASE_URL}/api/task-management/my/calendar`, { params:{ range, date }});
      setCalendarRows(res.data?.data || []);
    } finally { setLoading(false); }
  }

  async function moveTask(taskId, toStatusId){
    await http.post(`${BASE_URL}/api/task-management/${taskId}/move`, { toStatusId });
  }

  function findColumnByTaskId(tid) {
    for (const c of columns) if (c.items.some(it => it.taskId === tid)) return c;
    return null;
  }

  function handleDragStart(ev){
    const data = ev.active?.data?.current;
    if (data?.type === 'task') setActiveTask(data.task);
  }

  async function handleDragEnd(ev){
    const active = ev.active;
    const over = ev.over;
    setActiveTask(null);
    if (!active || !over) return;

    const data = active.data?.current;
    if (data?.type !== 'task') return;
    const taskId = data.task.taskId;

    let toStatusId = null;
    if (String(over.id).startsWith('col-')) {
      toStatusId = +String(over.id).replace('col-', '');
    } else if (String(over.id).startsWith('task-')) {
      const tid = +String(over.id).replace('task-', '');
      const col = findColumnByTaskId(tid);
      toStatusId = col?.statusId ?? null;
    }
    if (!toStatusId) return;

    const fromCol = findColumnByTaskId(taskId);
    if (!fromCol || fromCol.statusId === toStatusId) return;

    // optimistic UI
    setColumns(prev => {
      const cloned = prev.map(c => ({...c, items: [...c.items]}));
      const src = cloned.find(c => c.statusId === fromCol.statusId);
      const dst = cloned.find(c => c.statusId === toStatusId);
      const idx = src.items.findIndex(it => it.taskId === taskId);
      if (idx >= 0) {
        const [task] = src.items.splice(idx, 1);
        task.statusId = toStatusId;
        dst.items.unshift(task);
      }
      return cloned;
    });

    try {
      await moveTask(taskId, toStatusId);
    } catch (e) {
      await loadBoard(); // rollback nếu lỗi
    }
  }

  return (
    <div className="min-h-screen bg-[#f7faff] p-5">
      <style>{styles}</style>

      {/* Header */}
      <div className="card p-4 mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Công việc của tôi</h2>
          <p className="text-slate-500 text-sm">List / Board (DnD) / Calendar</p>
        </div>
        <CreateTaskButton onCreated={()=>{
          if (view==='list') loadList();
          else if (view==='board') loadBoard();
          else loadCalendar();
        }}/>
      </div>

      {/* Switch + Filters */}
      <div className="card p-4 mb-4">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {['list','board','calendar'].map(v => (
            <button key={v} onClick={()=>setView(v)} className={`pill ${view===v?'bg-indigo-600 text-white':''}`}>{v.toUpperCase()}</button>
          ))}
        </div>

        {view!=='calendar' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
            <div>
              <div className="text-xs text-slate-500 mb-1">Trạng thái</div>
              <Select
                options={['todo','doing','review','done'].map(v=>({value:v,label:v.toUpperCase()}))}
                onChange={o=>{ setPage(1); setStatus(o?.value??null); }}
                isClearable placeholder="Tất cả"
              />
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Ưu tiên</div>
              <Select
                options={['low','normal','high','urgent'].map(v=>({value:v,label:v}))}
                onChange={o=>{ setPage(1); setPriority(o?.value??null); }}
                isClearable placeholder="Tất cả"
              />
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Từ ngày</div>
              <input type="date" className="inset w-full px-3 py-2" value={dueFrom} onChange={e=>{ setPage(1); setDueFrom(e.target.value); }}/>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Đến ngày</div>
              <input type="date" className="inset w-full px-3 py-2" value={dueTo} onChange={e=>{ setPage(1); setDueTo(e.target.value); }}/>
            </div>
            <div className="md:col-span-2">
              <div className="text-xs text-slate-500 mb-1">Tìm kiếm</div>
              <input type="text" className="inset w-full px-3 py-2" value={search} onChange={e=>{ setPage(1); setSearch(e.target.value); }} placeholder="Nhập tiêu đề…"/>
            </div>
          </div>
        )}

        {view==='calendar' && (
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <div className="text-xs text-slate-500 mb-1">Khoảng</div>
              <Select
                options={[{value:'day',label:'Ngày'},{value:'week',label:'Tuần'}]}
                value={{ value:range, label: range==='day'?'Ngày':'Tuần' }}
                onChange={o=>setRange(o.value)}
              />
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Ngày mốc</div>
              <input type="date" className="inset w-full px-3 py-2" value={date} onChange={e=>setDate(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      {/* CONTENT */}
      {view==='list' && <ListView loading={loading} rows={rows} page={page} pageSize={pageSize} totalRows={totalRows} setPage={setPage} />}

      {view==='board' && (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid md:grid-cols-4 gap-3">
            {columns.map(col => (
              <SortableContext
                key={col.statusId}
                items={[ `col-${col.statusId}`, ...col.items.map(it=>`task-${it.taskId}`) ]}
                strategy={rectSortingStrategy}
              >
                <KanbanColumn col={col}>
                  <div id={`col-${col.statusId}`} />
                  {col.items.map(it => <TaskCard key={it.taskId} item={it} />)}
                </KanbanColumn>
              </SortableContext>
            ))}
          </div>
          <DragOverlay>
            {activeTask ? (
              <div className="p-3 rounded-xl border bg-white shadow-lg">{activeTask.title}</div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {view==='calendar' && <CalendarView loading={loading} rows={calendarRows} />}
    </div>
  );
}

/* ---------- Components ---------- */

function ListView({ loading, rows, page, pageSize, totalRows, setPage }){
  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-12 px-4 py-3 text-[13px] font-semibold text-slate-700 bg-white/60 border-b border-slate-200">
        <div className="w-12 text-center">#</div>
        <div className="col-span-4">Tiêu đề</div>
        <div className="col-span-2">Dự án</div>
        <div className="col-span-2">Trạng thái</div>
        <div className="col-span-1">Ưu tiên</div>
        <div className="col-span-2 text-right">Hạn</div>
      </div>
      {loading && <div className="px-4 py-10 text-center text-slate-500">Đang tải…</div>}
      {!loading && rows.length===0 && <div className="px-4 py-10 text-center text-slate-400">Không có dữ liệu</div>}
      {!loading && rows.map((r,i)=> (
        <div key={r.taskId} className={`grid grid-cols-12 px-4 py-3 items-center ${i%2?'bg-[#f9fbff]':'bg-white'}`}>
          <div className="w-12 text-center">{(page-1)*pageSize+i+1}</div>
          <div className="col-span-4 truncate font-semibold text-slate-800">{r.title}</div>
          <div className="col-span-2 truncate">{r.projectCode||'-'}</div>
          <div className="col-span-2"><span className="pill">{r.statusCode?.toUpperCase()}</span></div>
          <div className="col-span-1"><span className="pill">{r.priority||'-'}</span></div>
          <div className="col-span-2 text-right">{r.dueDate? new Date(r.dueDate).toLocaleDateString('vi-VN') : '-'}</div>
        </div>
      ))}
      <div className="p-3 flex items-center justify-between">
        <div className="pill">Tổng: {totalRows}</div>
        <div className="flex gap-2">
          <button disabled={page===1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="pill">← Trước</button>
          <button disabled={page*pageSize>=totalRows} onClick={()=>setPage(p=>p+1)} className="pill">Sau →</button>
        </div>
      </div>
    </div>
  );
}

function CalendarView({ loading, rows }){
  const groups = useMemo(()=>{
    const m = new Map();
    for (const r of rows){
      const k = r.workDate || (r.dueDate ? r.dueDate.slice(0,10) : '');
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(r);
    }
    return Array.from(m.entries()).map(([date, items])=>({date, items}));
  }, [rows]);

  return (
    <div className="card p-4">
      {loading && <div className="py-10 text-center text-slate-500">Đang tải…</div>}
      {!loading && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {groups.map(g => (
            <div key={g.date} className="p-3 rounded-xl border bg-white">
              <div className="font-semibold text-slate-800 mb-2">{new Date(g.date).toLocaleDateString('vi-VN')}</div>
              <div className="space-y-2">
                {g.items.map(it => (
                  <div key={it.taskId} className="p-2 rounded-lg border flex items-center justify-between">
                    <div className="truncate">{it.title}</div>
                    <span className="pill">{it.statusCode?.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function KanbanColumn({ col, children }){
  return (
    <div className="card p-3">
      <div className="font-semibold text-slate-800 mb-2">{col.statusName || col.statusCode?.toUpperCase()}</div>
      <div className="space-y-2 min-h-10">{children}</div>
    </div>
  );
}

function TaskCard({ item }){
  const {attributes, listeners, setNodeRef, transform, transition, isDragging} =
    useSortable({ id: `task-${item.taskId}`, data: { type:'task', task: item }});
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging? .6 : 1 };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      className="p-3 rounded-xl border bg-white flex items-center justify-between">
      <div className="truncate">{item.title}</div>
      <span className="pill">{item.priority || '-'}</span>
    </div>
  );
}

function CreateTaskButton({ onCreated }){
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="pill bg-indigo-600 text-white" onClick={()=>setOpen(true)}>+ New Task</button>
      {open && <CreateTaskModal onClose={()=>setOpen(false)} onCreated={() => { setOpen(false); onCreated?.(); }} />}
    </>
  );
}

function CreateTaskModal({ onClose, onCreated }){
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('normal');
  const [statusCode, setStatusCode] = useState('todo');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [estimateHours, setEstimateHours] = useState('');
  const [assigneesCsv, setAssigneesCsv] = useState(''); // nhập userId,userId
  const [projectId, setProjectId] = useState('');
  const [saving, setSaving] = useState(false);

  async function save(){
    try{
      setSaving(true);
      const assignees = assigneesCsv.split(',').map(s=>+s.trim()).filter(Number.isFinite);
      const payload = {
        projectId: projectId? +projectId : null,
        title, description, statusCode, priority,
        startDate: startDate || null, dueDate: dueDate || null,
        estimateHours: estimateHours? +estimateHours : null,
        progressPercent: 0,
        assignees
      };
      const res = await http.post(`${BASE_URL}/api/task-management`, payload);
      if (res.data?.success) onCreated?.();
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-900/30" onClick={onClose}></div>
      <div className="absolute inset-x-0 top-10 mx-auto max-w-2xl card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold">Tạo công việc</h3>
          <button className="pill" onClick={onClose}>Đóng</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="text-xs mb-1">Tiêu đề *</div>
            <input className="inset w-full px-3 py-2" value={title} onChange={e=>setTitle(e.target.value)} />
          </div>
          <div>
            <div className="text-xs mb-1">Dự án (ID)</div>
            <input className="inset w-full px-3 py-2" value={projectId} onChange={e=>setProjectId(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <div className="text-xs mb-1">Mô tả</div>
            <textarea className="inset w-full px-3 py-2" rows={3} value={description} onChange={e=>setDescription(e.target.value)} />
          </div>
          <div>
            <div className="text-xs mb-1">Trạng thái</div>
            <Select
              options={['todo','doing','review','done'].map(v=>({value:v,label:v.toUpperCase()}))}
              defaultValue={{value:'todo',label:'TODO'}}
              onChange={o=>setStatusCode(o.value)}
            />
          </div>
          <div>
            <div className="text-xs mb-1">Ưu tiên</div>
            <Select
              options={['low','normal','high','urgent'].map(v=>({value:v,label:v}))}
              defaultValue={{value:'normal',label:'normal'}}
              onChange={o=>setPriority(o.value)}
            />
          </div>
          <div>
            <div className="text-xs mb-1">Bắt đầu</div>
            <input type="date" className="inset w-full px-3 py-2" value={startDate} onChange={e=>setStartDate(e.target.value)} />
          </div>
          <div>
            <div className="text-xs mb-1">Hạn</div>
            <input type="date" className="inset w-full px-3 py-2" value={dueDate} onChange={e=>setDueDate(e.target.value)} />
          </div>
          <div>
            <div className="text-xs mb-1">Estimate (giờ)</div>
            <input type="number" step="0.25" className="inset w-full px-3 py-2" value={estimateHours} onChange={e=>setEstimateHours(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <div className="text-xs mb-1">Người nhận (userId, cách nhau dấu phẩy) *</div>
            <input className="inset w-full px-3 py-2" placeholder="101,102" value={assigneesCsv} onChange={e=>setAssigneesCsv(e.target.value)} />
            <div className="text-xs text-slate-500 mt-1">Chỉ Trưởng phòng được tạo cho nhân viên cùng phòng (server kiểm tra).</div>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button className="pill" onClick={onClose}>Hủy</button>
          <button disabled={saving} className="pill bg-indigo-600 text-white" onClick={save}>{saving?'Đang lưu…':'Lưu'}</button>
        </div>
      </div>
    </div>
  );
}
