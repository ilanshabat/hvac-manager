import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Subcontractors from './Subcontractors'

export default function ProjectDetail({ project, user, onBack }) {
  const [tab, setTab] = useState('tasks')
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', priority: 'medium', due_date: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchTasks() }, [])

  const fetchTasks = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', project.id)
      .order('created_at', { ascending: false })
    setTasks(data || [])
    setLoading(false)
  }

  const addTask = async () => {
    if (!newTask.title.trim()) return
    setSaving(true)
    await supabase.from('tasks').insert([{
      ...newTask,
      project_id: project.id,
      assignee_id: user.id,
      assignee_type: 'internal',
      status: 'open'
    }])
    setNewTask({ title: '', priority: 'medium', due_date: '' })
    setShowAddTask(false)
    await fetchTasks()
    setSaving(false)
  }

  const toggleTask = async (task) => {
    const newStatus = task.status === 'done' ? 'open' : 'done'
    await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id)
    setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
  }

  const priorityStyle = (p) => ({
    high:   { bg: '#FDF0ED', color: '#C0392B', text: 'דחוף' },
    medium: { bg: '#FEF3E2', color: '#C07B2A', text: 'בינוני' },
    low:    { bg: '#E8F5EF', color: '#2D4A3E', text: 'נמוך' },
  }[p] || { bg: '#F5F2EC', color: '#9B9280', text: p })

  const statusLabel = {
    active: { text: 'פעיל', bg: '#E8F5EF', color: '#2D4A3E' },
    risk:   { text: '⚠ סיכון', bg: '#FDF0ED', color: '#C0392B' },
    planning: { text: 'תכנון', bg: '#FEF3E2', color: '#C07B2A' },
    done:   { text: 'הושלם', bg: '#E8F5EF', color: '#2D4A3E' },
    paused: { text: 'מושהה', bg: '#F5F2EC', color: '#9B9280' },
  }

  const st = statusLabel[project.status] || { text: project.status, bg: '#F5F2EC', color: '#9B9280' }

  const s = {
    app: { minHeight:'100vh', background:'#F2EFE9', fontFamily:'Heebo, sans-serif', direction:'rtl', maxWidth:'390px', margin:'0 auto', paddingBottom:'40px' },
    topbar: { background:'#2D4A3E', padding:'14px 16px', display:'flex', alignItems:'center', gap:'10px' },
    backBtn: { width:'34px', height:'34px', borderRadius:'10px', background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', border:'none', fontSize:'18px', color:'#fff' },
    topbarInfo: { flex:1 },
    topbarTitle: { fontSize:'15px', fontWeight:'600', color:'#fff', lineHeight:'1.3' },
    topbarSub: { fontSize:'11px', color:'rgba(255,255,255,0.6)', marginTop:'1px' },
    badge: { fontSize:'11px', padding:'4px 10px', borderRadius:'20px', fontWeight:'500', background: st.bg, color: st.color, whiteSpace:'nowrap' },
    hero: { background:'#2D4A3E', padding:'0 16px 16px' },
    heroCards: { display:'grid', gridTemplateColumns:'repeat(3,minmax(0,1fr))', gap:'8px' },
    hc: { background:'rgba(255,255,255,0.12)', borderRadius:'12px', padding:'10px 6px', textAlign:'center' },
    hcVal: { fontSize:'18px', fontWeight:'600', color:'#fff' },
    hcLbl: { fontSize:'9px', color:'rgba(255,255,255,0.6)', marginTop:'3px' },
    tabsWrap: { padding:'12px 16px 0' },
    tabs: { display:'flex', background:'#fff', borderRadius:'14px', padding:'4px', border:'1px solid #E8E4DC', gap:'2px' },
    tab: (active) => ({ flex:1, padding:'8px 4px', textAlign:'center', fontSize:'12px', fontWeight:'500', cursor:'pointer', borderRadius:'10px', border:'none', background: active ? '#2D4A3E' : 'transparent', color: active ? '#fff' : '#9B9280', fontFamily:'Heebo, sans-serif' }),
    content: { padding:'12px 16px' },
    slbl: { fontSize:'12px', fontWeight:'600', color:'#9B9280', marginBottom:'6px', display:'flex', alignItems:'center', gap:'5px' },
    taskGroup: { background:'#fff', borderRadius:'16px', border:'1px solid #E8E4DC', overflow:'hidden', marginBottom:'10px' },
    taskItem: { padding:'12px 14px', borderBottom:'1px solid #F5F2EC', display:'flex', alignItems:'flex-start', gap:'10px' },
    taskCheck: (done) => ({ width:'22px', height:'22px', borderRadius:'50%', border: done ? 'none' : '2px solid #D4CFCA', background: done ? '#2D4A3E' : 'transparent', flexShrink:0, marginTop:'2px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:'12px', color:'#fff' }),
    taskTitle: (done) => ({ fontSize:'14px', color: done ? '#B5AFA6' : '#1C2B20', textDecoration: done ? 'line-through' : 'none', marginBottom:'5px', lineHeight:'1.4' }),
    chips: { display:'flex', gap:'5px', flexWrap:'wrap' },
    chip: (bg, color) => ({ fontSize:'10px', padding:'3px 8px', borderRadius:'20px', fontWeight:'500', background: bg, color }),
    dateChip: (od) => ({ fontSize:'10px', padding:'3px 8px', borderRadius:'20px', background: od ? '#FDF0ED' : '#F5F2EC', color: od ? '#C0392B' : '#6B6457' }),
    addTaskBtn: { width:'100%', padding:'12px', background:'#fff', border:'2px dashed #D4CFCA', borderRadius:'14px', fontSize:'13px', fontWeight:'500', color:'#9B9280', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', fontFamily:'Heebo, sans-serif' },
    addTaskCard: { background:'#fff', borderRadius:'16px', border:'1px solid #E8E4DC', padding:'14px', marginBottom:'10px' },
    inp: { width:'100%', border:'1.5px solid #E8E4DC', borderRadius:'12px', padding:'10px 14px', fontSize:'14px', color:'#1C2B20', background:'#F9F7F4', fontFamily:'Heebo, sans-serif', boxSizing:'border-box', marginBottom:'10px' },
    select: { width:'100%', border:'1.5px solid #E8E4DC', borderRadius:'12px', padding:'10px 14px', fontSize:'14px', color:'#1C2B20', background:'#F9F7F4', fontFamily:'Heebo, sans-serif', boxSizing:'border-box', marginBottom:'10px' },
    saveBtn: { width:'100%', padding:'11px', background:'#2D4A3E', border:'none', borderRadius:'12px', color:'#fff', fontSize:'13px', fontWeight:'600', cursor:'pointer', fontFamily:'Heebo, sans-serif' },
    emptyWrap: { textAlign:'center', padding:'32px 24px', color:'#9B9280' },
    comingSoon: { textAlign:'center', padding:'40px 24px', color:'#9B9280', fontSize:'13px' },
  }

  const openTasks = tasks.filter(t => t.status !== 'done')
  const doneTasks = tasks.filter(t => t.status === 'done')
  const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done')

  return (
    <div style={s.app}>
      <div style={s.topbar}>
        <button style={s.backBtn} onClick={onBack}>→</button>
        <div style={s.topbarInfo}>
          <div style={s.topbarTitle}>{project.name}</div>
          <div style={s.topbarSub}>{project.client} · מסירה {project.end_date || 'לא הוגדר'}</div>
        </div>
        <span style={s.badge}>{st.text}</span>
      </div>

      <div style={s.hero}>
        <div style={s.heroCards}>
          <div style={s.hc}>
            <div style={s.hcVal}>{openTasks.length}</div>
            <div style={s.hcLbl}>משימות פתוחות</div>
          </div>
          <div style={s.hc}>
            <div style={{...s.hcVal, color: overdue.length > 0 ? '#F4C77A' : '#fff'}}>{overdue.length}</div>
            <div style={s.hcLbl}>באיחור</div>
          </div>
          <div style={s.hc}>
            <div style={s.hcVal}>{doneTasks.length}</div>
            <div style={s.hcLbl}>הושלמו</div>
          </div>
        </div>
      </div>

      <div style={s.tabsWrap}>
        <div style={s.tabs}>
          {['tasks','subs','bom','meetings'].map((t,i) => (
            <button key={t} style={s.tab(tab===t)} onClick={()=>setTab(t)}>
              {['משימות','קבלנים','רכש','יומן'][i]}
            </button>
          ))}
        </div>
      </div>

      <div style={s.content}>
        {tab === 'tasks' && (
          <>
            {showAddTask && (
              <div style={s.addTaskCard}>
                <input style={s.inp} placeholder="שם המשימה..." value={newTask.title} onChange={e=>setNewTask({...newTask,title:e.target.value})} />
                <select style={s.select} value={newTask.priority} onChange={e=>setNewTask({...newTask,priority:e.target.value})}>
                  <option value="high">דחוף</option>
                  <option value="medium">בינוני</option>
                  <option value="low">נמוך</option>
                </select>
                <input style={s.inp} type="date" value={newTask.due_date} onChange={e=>setNewTask({...newTask,due_date:e.target.value})} />
                <button style={s.saveBtn} onClick={addTask} disabled={saving}>
                  {saving ? 'שומר...' : '✓ הוסף משימה'}
                </button>
              </div>
            )}

            {loading ? <div style={s.emptyWrap}>טוען...</div> : (
              <>
                {openTasks.length === 0 && doneTasks.length === 0 ? (
                  <div style={s.emptyWrap}>
                    <div style={{fontSize:'36px', marginBottom:'10px'}}>✅</div>
                    <div style={{fontSize:'14px', fontWeight:'600', color:'#1C2B20', marginBottom:'4px'}}>אין משימות עדיין</div>
                    <div>לחץ על הכפתור למטה להוספת משימה ראשונה</div>
                  </div>
                ) : (
                  <>
                    {openTasks.length > 0 && (
                      <>
                        <div style={s.slbl}>פתוחות</div>
                        <div style={s.taskGroup}>
                          {openTasks.map(t => (
                            <div key={t.id} style={s.taskItem}>
                              <div style={s.taskCheck(false)} onClick={()=>toggleTask(t)}>○</div>
                              <div style={{flex:1}}>
                                <div style={s.taskTitle(false)}>{t.title}</div>
                                <div style={s.chips}>
                                  <span style={s.chip(priorityStyle(t.priority).bg, priorityStyle(t.priority).color)}>{priorityStyle(t.priority).text}</span>
                                  {t.due_date && <span style={s.dateChip(new Date(t.due_date) < new Date())}>{t.due_date}</span>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    {doneTasks.length > 0 && (
                      <>
                        <div style={s.slbl}>הושלמו</div>
                        <div style={s.taskGroup}>
                          {doneTasks.map(t => (
                            <div key={t.id} style={s.taskItem}>
                              <div style={s.taskCheck(true)} onClick={()=>toggleTask(t)}>✓</div>
                              <div style={{flex:1}}>
                                <div style={s.taskTitle(true)}>{t.title}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}
              </>
            )}

            <button style={s.addTaskBtn} onClick={()=>setShowAddTask(!showAddTask)}>
              + הוסף משימה
            </button>
          </>
        )}

        {tab === 'subs' && <Subcontractors project={project} onBack={()=>setTab('tasks')} />}
        {tab === 'bom' && <div style={s.comingSoon}><div style={{fontSize:'32px', marginBottom:'10px'}}>📦</div>מודול רכש — בקרוב</div>}
        {tab === 'meetings' && <div style={s.comingSoon}><div style={{fontSize:'32px', marginBottom:'10px'}}>📅</div>מודול יומן — בקרוב</div>}
      </div>
    </div>
  )
}