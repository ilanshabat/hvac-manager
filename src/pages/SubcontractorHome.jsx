import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function SubcontractorHome({ subUser, onLogout }) {
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [noteTask, setNoteTask] = useState(null)
  const [noteText, setNoteText] = useState('')
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('tasks')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: assignments } = await supabase
      .from('project_assignments')
      .select('*, projects(*)')
      .eq('user_id', subUser.id)
      .eq('role', 'subcontractor')

    const projs = assignments?.map(a => a.projects) || []
    setProjects(projs)

    const { data: taskData } = await supabase
      .from('tasks')
      .select('*, projects(name)')
      .eq('assignee_id', subUser.id)
      .order('due_date', { ascending: true })

    setTasks(taskData || [])
    setLoading(false)
  }

  const toggleTask = async (task) => {
    const newStatus = task.status === 'done' ? 'open' : 'done'
    await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id)
    setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
  }

  const openNoteModal = (task) => {
    setNoteTask(task)
    setNoteText(task.notes || '')
  }

  const saveNote = async () => {
    if (!noteTask) return
    setSaving(true)
    await supabase.from('tasks').update({ notes: noteText }).eq('id', noteTask.id)
    setTasks(tasks.map(t => t.id === noteTask.id ? { ...t, notes: noteText } : t))
    setNoteTask(null)
    setNoteText('')
    setSaving(false)
  }

  const openTasks = tasks.filter(t => t.status !== 'done')
  const doneTasks = tasks.filter(t => t.status === 'done')
  const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done')

  const avatarColors = ['#EEF2FF','#E8F5EF','#FEF3E2']
  const textColors = ['#4338CA','#2D4A3E','#C07B2A']

  const s = {
    app: { minHeight:'100vh', background:'#F2EFE9', fontFamily:'Heebo, sans-serif', direction:'rtl', maxWidth:'390px', margin:'0 auto', paddingBottom:'40px' },
    topbar: { background:'#2D4A3E', padding:'16px', display:'flex', alignItems:'center', justifyContent:'space-between' },
    topbarLeft: { display:'flex', alignItems:'center', gap:'10px' },
    av: { width:'40px', height:'40px', borderRadius:'50%', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'600', color:'#fff' },
    topbarName: { fontSize:'15px', fontWeight:'600', color:'#fff' },
    topbarRole: { fontSize:'11px', color:'rgba(255,255,255,0.7)', marginTop:'1px' },
    logoutBtn: { background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'10px', padding:'6px 12px', color:'#fff', fontSize:'12px', cursor:'pointer', fontFamily:'Heebo, sans-serif' },
    summary: { background:'#2D4A3E', padding:'0 16px 16px', display:'flex', gap:'8px' },
    sumCard: { flex:1, background:'rgba(255,255,255,0.12)', borderRadius:'14px', padding:'12px 8px', textAlign:'center' },
    sumVal: (warn) => ({ fontSize:'20px', fontWeight:'600', color: warn ? '#F4C77A' : '#fff' }),
    sumLbl: { fontSize:'10px', color:'rgba(255,255,255,0.6)', marginTop:'2px' },
    sectionWrap: { padding:'14px 16px 0' },
    sectionTitle: { fontSize:'14px', fontWeight:'600', color:'#1C2B20', marginBottom:'10px' },
    projCard: (i) => ({ background:'#fff', borderRadius:'16px', border:'1px solid #E8E4DC', padding:'14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'10px' }),
    projAv: (i) => ({ width:'40px', height:'40px', borderRadius:'13px', background: avatarColors[i%3], display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0 }),
    projName: { fontSize:'14px', fontWeight:'600', color:'#1C2B20' },
    projSub: { fontSize:'11px', color:'#9B9280', marginTop:'1px' },
    taskGroup: { background:'#fff', borderRadius:'16px', border:'1px solid #E8E4DC', overflow:'hidden', marginBottom:'10px' },
    taskItem: { padding:'12px 14px', borderBottom:'1px solid #F5F2EC' },
    taskRow: { display:'flex', alignItems:'flex-start', gap:'10px' },
    taskCheck: (done) => ({ width:'22px', height:'22px', borderRadius:'50%', border: done ? 'none' : '2px solid #D4CFCA', background: done ? '#2D4A3E' : 'transparent', flexShrink:0, marginTop:'2px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:'12px', color:'#fff' }),
    taskTitle: (done) => ({ fontSize:'14px', color: done ? '#B5AFA6' : '#1C2B20', textDecoration: done ? 'line-through' : 'none', marginBottom:'4px' }),
    taskMeta: { display:'flex', gap:'5px', flexWrap:'wrap', marginBottom:'6px' },
    chip: (bg, color) => ({ fontSize:'10px', padding:'3px 8px', borderRadius:'20px', background: bg, color, fontWeight:'500' }),
    noteBtn: { display:'inline-flex', alignItems:'center', gap:'4px', background:'#FEF3E2', border:'1px solid #F4C77A', borderRadius:'8px', padding:'4px 10px', fontSize:'11px', color:'#C07B2A', cursor:'pointer', fontFamily:'Heebo, sans-serif', fontWeight:'500' },
    noteDisplay: { background:'#FFFBF0', border:'1px solid #F4C77A', borderRadius:'8px', padding:'7px 10px', fontSize:'12px', color:'#1C2B20', marginTop:'4px' },
    noteLabel: { fontSize:'10px', fontWeight:'600', color:'#C07B2A', marginBottom:'2px' },
    slbl: { fontSize:'12px', fontWeight:'600', color:'#9B9280', marginBottom:'6px' },
    emptyWrap: { textAlign:'center', padding:'32px 24px', color:'#9B9280' },
    tabs: { display:'flex', background:'#fff', margin:'12px 16px 0', borderRadius:'14px', padding:'4px', border:'1px solid #E8E4DC', gap:'2px' },
    tab: (active) => ({ flex:1, padding:'8px 4px', textAlign:'center', fontSize:'12px', fontWeight:'500', cursor:'pointer', borderRadius:'10px', border:'none', background: active ? '#2D4A3E' : 'transparent', color: active ? '#fff' : '#9B9280', fontFamily:'Heebo, sans-serif' }),
    modal: { position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:100, display:'flex', alignItems:'flex-end', justifyContent:'center' },
    sheet: { background:'#FAFAF8', borderRadius:'24px 24px 0 0', width:'100%', maxWidth:'390px', padding:'16px 16px 32px' },
    handle: { width:'40px', height:'4px', background:'#D4CFCA', borderRadius:'2px', margin:'0 auto 14px' },
    shTitle: { fontSize:'16px', fontWeight:'600', color:'#1C2B20', marginBottom:'6px' },
    shSub: { fontSize:'12px', color:'#9B9280', marginBottom:'14px' },
    textarea: { width:'100%', border:'1.5px solid #F4C77A', borderRadius:'12px', padding:'10px 14px', fontSize:'14px', color:'#1C2B20', background:'#FFFBF0', fontFamily:'Heebo, sans-serif', boxSizing:'border-box', minHeight:'100px', resize:'vertical', marginBottom:'12px' },
    saveBtn: { width:'100%', padding:'11px', background:'#2D4A3E', border:'none', borderRadius:'12px', color:'#fff', fontSize:'13px', fontWeight:'600', cursor:'pointer', fontFamily:'Heebo, sans-serif', marginBottom:'8px' },
    cancelBtn: { width:'100%', padding:'10px', background:'#F5F2EC', border:'none', borderRadius:'12px', color:'#6B6457', fontSize:'13px', cursor:'pointer', fontFamily:'Heebo, sans-serif' },
  }

  if (loading) return <div style={{...s.app, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', color:'#2D4A3E'}}>טוען...</div>

  const TaskItem = ({ t }) => (
    <div style={s.taskItem}>
      <div style={s.taskRow}>
        <div style={s.taskCheck(t.status==='done')} onClick={()=>toggleTask(t)}>
          {t.status==='done' ? '✓' : '○'}
        </div>
        <div style={{flex:1}}>
          <div style={s.taskTitle(t.status==='done')}>{t.title}</div>
          <div style={s.taskMeta}>
            <span style={s.chip('#E8F5EF','#2D4A3E')}>{t.projects?.name}</span>
            {t.due_date && <span style={s.chip(new Date(t.due_date)<new Date()?'#FDF0ED':'#F5F2EC', new Date(t.due_date)<new Date()?'#C0392B':'#6B6457')}>{t.due_date}</span>}
          </div>
          {t.notes ? (
            <div>
              <div style={s.noteDisplay}>
                <div style={s.noteLabel}>💬 ההערה שלך</div>
                <div>{t.notes}</div>
              </div>
              <button style={{...s.noteBtn, marginTop:'6px'}} onClick={()=>openNoteModal(t)}>✏️ ערוך הערה</button>
            </div>
          ) : (
            <button style={s.noteBtn} onClick={()=>openNoteModal(t)}>💬 הוסף הערה למנהל</button>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div style={s.app}>
      <div style={s.topbar}>
        <div style={s.topbarLeft}>
          <div style={s.av}>{subUser.name?.slice(0,2)}</div>
          <div>
            <div style={s.topbarName}>שלום, {subUser.name} 👋</div>
            <div style={s.topbarRole}>{subUser.specialty || subUser.company || 'קבלן משנה'}</div>
          </div>
        </div>
        <button style={s.logoutBtn} onClick={onLogout}>יציאה</button>
      </div>

      <div style={s.summary}>
        <div style={s.sumCard}><div style={s.sumVal(false)}>{projects.length}</div><div style={s.sumLbl}>פרויקטים</div></div>
        <div style={s.sumCard}><div style={s.sumVal(openTasks.length>0)}>{openTasks.length}</div><div style={s.sumLbl}>משימות פתוחות</div></div>
        <div style={s.sumCard}><div style={s.sumVal(overdue.length>0)}>{overdue.length}</div><div style={s.sumLbl}>באיחור</div></div>
      </div>

      <div style={s.tabs}>
        <button style={s.tab(activeTab==='tasks')} onClick={()=>setActiveTab('tasks')}>המשימות שלי</button>
        <button style={s.tab(activeTab==='projects')} onClick={()=>setActiveTab('projects')}>הפרויקטים שלי</button>
      </div>

      <div style={{padding:'12px 16px'}}>
        {activeTab==='projects' && (
          <>
            {projects.length===0 ? (
              <div style={s.emptyWrap}><div style={{fontSize:'36px',marginBottom:'10px'}}>🏗️</div><div>אין פרויקטים משויכים אליך עדיין</div></div>
            ) : projects.map((p,i)=>(
              <div key={p.id} style={s.projCard(i)}>
                <div style={s.projAv(i)}>🏗️</div>
                <div>
                  <div style={s.projName}>{p.name}</div>
                  <div style={s.projSub}>{p.client} · מסירה {p.end_date||'לא הוגדר'}</div>
                </div>
              </div>
            ))}
          </>
        )}

        {activeTab==='tasks' && (
          <>
            {tasks.length===0 ? (
              <div style={s.emptyWrap}><div style={{fontSize:'36px',marginBottom:'10px'}}>✅</div><div>אין משימות משויכות אליך עדיין</div></div>
            ) : (
              <>
                {openTasks.length>0 && <>
                  <div style={s.slbl}>פתוחות</div>
                  <div style={s.taskGroup}>
                    {openTasks.map(t=><TaskItem key={t.id} t={t} />)}
                  </div>
                </>}
                {doneTasks.length>0 && <>
                  <div style={s.slbl}>הושלמו</div>
                  <div style={s.taskGroup}>
                    {doneTasks.map(t=><TaskItem key={t.id} t={t} />)}
                  </div>
                </>}
              </>
            )}
          </>
        )}
      </div>

      {noteTask && (
        <div style={s.modal} onClick={e=>{if(e.target===e.currentTarget){setNoteTask(null);setNoteText('')}}}>
          <div style={s.sheet}>
            <div style={s.handle}></div>
            <div style={s.shTitle}>💬 הערה למנהל</div>
            <div style={s.shSub}>{noteTask.title}</div>
            <textarea
              style={s.textarea}
              placeholder="כתוב הערה, עדכון סטטוס, שאלה..."
              value={noteText}
              onChange={e=>setNoteText(e.target.value)}
            />
            <button style={s.saveBtn} onClick={saveNote} disabled={saving}>{saving?'שומר...':'✓ שלח הערה'}</button>
            <button style={s.cancelBtn} onClick={()=>{setNoteTask(null);setNoteText('')}}>ביטול</button>
          </div>
        </div>
      )}
    </div>
  )
}