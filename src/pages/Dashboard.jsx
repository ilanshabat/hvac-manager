import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import AddProject from './AddProject'
import ProjectDetail from './ProjectDetail'

export default function Dashboard({ user, dbUser: dbUserProp, onLogout, onManageUsers }) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [dbUser, setDbUser] = useState(dbUserProp || null)
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState([])
  const [managers, setManagers] = useState([])
  const [showAssign, setShowAssign] = useState(false)
  const [assignTo, setAssignTo] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!dbUserProp) fetchUser()
    fetchProjects()
    fetchManagers()
  }, [])

  const fetchUser = async () => {
    const { data } = await supabase.from('users').select('*').eq('email', user.email).single()
    setDbUser(data)
  }

  const fetchProjects = async () => {
    let query = supabase.from('projects').select('*, tasks(id, status)').order('created_at', { ascending: false })
    
    // super_admin רואה הכל, project_manager רואה רק שלו
    if (dbUserProp?.role !== 'super_admin') {
      const { data: assignments } = await supabase
        .from('project_manager_assignments')
        .select('project_id')
        .eq('user_id', dbUserProp?.id)
      const ids = assignments?.map(a => a.project_id) || []
      if (ids.length > 0) {
        query = query.in('id', ids)
      } else {
        setProjects([])
        setLoading(false)
        return
      }
    }

    const { data, error } = await query
    if (!error) setProjects(data || [])
    setLoading(false)
  }

  const fetchManagers = async () => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .in('role', ['project_manager', 'super_admin'])
    setManagers(data || [])
  }

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const deleteSelected = async () => {
    if (!window.confirm(`למחוק ${selected.length} פרויקטים?`)) return
    setSaving(true)
    for (const id of selected) {
      await supabase.from('project_manager_assignments').delete().eq('project_id', id)
      await supabase.from('tasks').delete().eq('project_id', id)
      await supabase.from('projects').delete().eq('id', id)
    }
    setSelected([])
    setSelectMode(false)
    await fetchProjects()
    setSaving(false)
  }

  const assignSelected = async () => {
    if (!assignTo) return
    setSaving(true)
    for (const id of selected) {
      await supabase.from('project_manager_assignments').upsert([{
        project_id: id, user_id: assignTo
      }])
    }
    setSelected([])
    setSelectMode(false)
    setShowAssign(false)
    setAssignTo('')
    setSaving(false)
    alert('שויך בהצלחה!')
  }

  const statusLabel = (s) => ({
    active:   { text: 'פעיל',     bg: '#E8F5EF', color: '#2D4A3E' },
    risk:     { text: '⚠ סיכון', bg: '#FDF0ED', color: '#C0392B' },
    planning: { text: 'תכנון',    bg: '#FEF3E2', color: '#C07B2A' },
    done:     { text: 'הושלם',   bg: '#E8F5EF', color: '#2D4A3E' },
    paused:   { text: 'מושהה',   bg: '#F5F2EC', color: '#9B9280' },
  }[s] || { text: s, bg: '#F5F2EC', color: '#9B9280' })

  const barColor = (s) => ({
    active: '#2D4A3E', risk: '#E76F51', planning: '#F4A261', done: '#2D4A3E', paused: '#B5AFA6'
  }[s] || '#2D4A3E')

  const getProgress = (p) => {
    const all = p.tasks?.length || 0
    const done = p.tasks?.filter(t => t.status === 'done').length || 0
    return all > 0 ? Math.round((done / all) * 100) : 0
  }

  const getOpenTasks = (p) => p.tasks?.filter(t => t.status !== 'done').length || 0

  const initials = (name) => {
    if (!name) return 'א'
    const parts = name.trim().split(' ')
    return parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2)
  }

  const activeCount = projects.filter(p => p.status === 'active').length
  const planningCount = projects.filter(p => p.status === 'planning').length
  const riskCount = projects.filter(p => p.status === 'risk').length

  const s = {
    app: { minHeight:'100vh', background:'#F2EFE9', fontFamily:'Heebo, sans-serif', direction:'rtl', maxWidth:'390px', margin:'0 auto', paddingBottom:'32px' },
    header: { background:'#2D4A3E', padding:'24px 20px 28px' },
    topRow: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px' },
    avatarWrap: { display:'flex', alignItems:'center', gap:'14px' },
    avatar: { width:'52px', height:'52px', borderRadius:'16px', background:'rgba(255,255,255,0.15)', border:'1.5px solid rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'17px', fontWeight:'600', color:'#fff', flexShrink:0 },
    welcome: { fontSize:'13px', color:'rgba(255,255,255,0.6)', marginBottom:'2px' },
    userName: { fontSize:'18px', fontWeight:'600', color:'#fff', lineHeight:'1.2' },
    userRole: { fontSize:'12px', color:'rgba(255,255,255,0.5)', marginTop:'2px' },
    topBtns: { display:'flex', flexDirection:'column', gap:'6px', alignItems:'flex-end' },
    logoutBtn: { background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:'10px', padding:'7px 14px', color:'rgba(255,255,255,0.8)', fontSize:'12px', cursor:'pointer', fontFamily:'Heebo, sans-serif' },
    usersBtn: { background:'rgba(255,255,255,0.18)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:'10px', padding:'7px 14px', color:'#fff', fontSize:'12px', cursor:'pointer', fontFamily:'Heebo, sans-serif', fontWeight:'500' },
    summaryCard: { background:'rgba(255,255,255,0.08)', borderRadius:'16px', padding:'16px', border:'1px solid rgba(255,255,255,0.1)' },
    summaryNum: { fontSize:'32px', fontWeight:'600', color:'#fff', marginBottom:'4px' },
    summaryLabel: { fontSize:'12px', color:'rgba(255,255,255,0.5)', marginBottom:'10px' },
    dots: { display:'flex', gap:'12px' },
    dot: () => ({ display:'flex', alignItems:'center', gap:'5px', fontSize:'11px', color:'rgba(255,255,255,0.6)' }),
    dotCircle: (color) => ({ width:'7px', height:'7px', borderRadius:'50%', background:color, flexShrink:0 }),
    body: { padding:'20px 16px 0' },
    sectionHdr: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' },
    sectionTitle: { fontSize:'13px', fontWeight:'600', color:'#6B6457' },
    sectionCount: { fontSize:'11px', color:'#9B9280' },
    selectBtn: { fontSize:'11px', color:'#2D4A3E', background:'#E8F5EF', border:'none', borderRadius:'8px', padding:'4px 10px', cursor:'pointer', fontFamily:'Heebo, sans-serif', fontWeight:'500' },
    card: (sel) => ({ background: sel ? '#E8F5EF' : '#fff', borderRadius:'20px', border: sel ? '2px solid #2D4A3E' : '1px solid #E8E4DC', padding:'16px', marginBottom:'12px', cursor:'pointer', transition:'all 0.15s' }),
    cardTop: { display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'12px' },
    projName: { fontSize:'15px', fontWeight:'600', color:'#1C2B20', marginBottom:'3px' },
    projClient: { fontSize:'12px', color:'#9B9280' },
    badge: (st) => ({ fontSize:'11px', padding:'4px 10px', borderRadius:'20px', fontWeight:'500', background:statusLabel(st).bg, color:statusLabel(st).color, whiteSpace:'nowrap', flexShrink:0 }),
    progWrap: { height:'6px', background:'#F0EDE6', borderRadius:'20px', overflow:'hidden', marginBottom:'10px' },
    progFill: (pct, st) => ({ height:'100%', width:`${pct}%`, background:barColor(st), borderRadius:'20px' }),
    cardBottom: { display:'flex', justifyContent:'space-between', alignItems:'center' },
    taskChip: { fontSize:'11px', color:'#6B6457', background:'#F5F2EC', padding:'3px 9px', borderRadius:'20px' },
    pctText: (st) => ({ fontSize:'12px', fontWeight:'600', color:barColor(st) }),
    emptyWrap: { textAlign:'center', padding:'40px 24px', color:'#9B9280' },
    addBtn: { width:'100%', padding:'15px', background:'#2D4A3E', border:'none', borderRadius:'16px', color:'#fff', fontSize:'14px', fontWeight:'600', cursor:'pointer', fontFamily:'Heebo, sans-serif', marginBottom:'10px' },
    actionBar: { background:'#fff', borderRadius:'16px', border:'1px solid #E8E4DC', padding:'12px 14px', marginBottom:'12px', display:'flex', gap:'8px', alignItems:'center' },
    actionCount: { fontSize:'13px', fontWeight:'600', color:'#2D4A3E', flex:1 },
    delSelBtn: { padding:'8px 14px', background:'#FDF0ED', border:'1px solid #FECACA', borderRadius:'10px', fontSize:'12px', color:'#C0392B', cursor:'pointer', fontFamily:'Heebo, sans-serif', fontWeight:'500' },
    assignSelBtn: { padding:'8px 14px', background:'#EEF2FF', border:'1px solid #C7D2FE', borderRadius:'10px', fontSize:'12px', color:'#4338CA', cursor:'pointer', fontFamily:'Heebo, sans-serif', fontWeight:'500' },
    assignBox: { background:'#fff', borderRadius:'16px', border:'1px solid #E8E4DC', padding:'14px', marginBottom:'12px' },
    assignTitle: { fontSize:'13px', fontWeight:'600', color:'#1C2B20', marginBottom:'10px' },
    sel: { width:'100%', border:'1.5px solid #E8E4DC', borderRadius:'12px', padding:'10px 14px', fontSize:'14px', color:'#1C2B20', background:'#F9F7F4', fontFamily:'Heebo, sans-serif', boxSizing:'border-box', marginBottom:'10px' },
    assignBtn: { width:'100%', padding:'11px', background:'#2D4A3E', border:'none', borderRadius:'12px', color:'#fff', fontSize:'13px', fontWeight:'600', cursor:'pointer', fontFamily:'Heebo, sans-serif' },
  }

  if (showAdd) return <AddProject user={user} dbUser={dbUser} onBack={()=>setShowAdd(false)} onSaved={()=>{ setShowAdd(false); fetchProjects() }} />
  if (selectedProject) return <ProjectDetail project={selectedProject} user={user} onBack={()=>{ setSelectedProject(null); fetchProjects() }} />

  return (
    <div style={s.app}>
      <div style={s.header}>
        <div style={s.topRow}>
          <div style={s.avatarWrap}>
            <div style={s.avatar}>{initials(dbUser?.name || user?.email)}</div>
            <div>
              <div style={s.welcome}>ברוך הבא,</div>
              <div style={s.userName}>{dbUser?.name || user?.email}</div>
              <div style={s.userRole}>{dbUser?.role === 'super_admin' ? 'מנהל ראשי' : 'מנהל פרויקטים'}</div>
            </div>
          </div>
          <div style={s.topBtns}>
            <button style={s.logoutBtn} onClick={onLogout}>יציאה</button>
            {dbUser?.role === 'super_admin' && onManageUsers && (
              <button style={s.usersBtn} onClick={onManageUsers}>👥 משתמשים</button>
            )}
          </div>
        </div>

        <div style={s.summaryCard}>
          <div style={s.summaryNum}>{projects.length}</div>
          <div style={s.summaryLabel}>סה"כ פרויקטים</div>
          <div style={s.dots}>
            {activeCount > 0 && <div style={s.dot()}><div style={s.dotCircle('#4ADE80')}></div><span>{activeCount} פעילים</span></div>}
            {planningCount > 0 && <div style={s.dot()}><div style={s.dotCircle('#F4C77A')}></div><span>{planningCount} בתכנון</span></div>}
            {riskCount > 0 && <div style={s.dot()}><div style={s.dotCircle('#E76F51')}></div><span>{riskCount} בסיכון</span></div>}
          </div>
        </div>
      </div>

      <div style={s.body}>
        <div style={s.sectionHdr}>
          <div style={s.sectionTitle}>הפרויקטים שלי</div>
          <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
            <div style={s.sectionCount}>{projects.length} פרויקטים</div>
            {projects.length > 0 && (
              <button style={s.selectBtn} onClick={()=>{ setSelectMode(!selectMode); setSelected([]); setShowAssign(false) }}>
                {selectMode ? 'ביטול' : 'בחר'}
              </button>
            )}
          </div>
        </div>

        {selectMode && selected.length > 0 && (
          <div style={s.actionBar}>
            <div style={s.actionCount}>{selected.length} נבחרו</div>
            <button style={s.assignSelBtn} onClick={()=>setShowAssign(!showAssign)}>👤 שייך</button>
            <button style={s.delSelBtn} onClick={deleteSelected} disabled={saving}>{saving?'מוחק...':'🗑 מחק'}</button>
          </div>
        )}

        {showAssign && (
          <div style={s.assignBox}>
            <div style={s.assignTitle}>שייך לפרויקטים נבחרים:</div>
            <select style={s.sel} value={assignTo} onChange={e=>setAssignTo(e.target.value)}>
              <option value="">בחר מנהל...</option>
              {managers.filter(m => m.id !== dbUser?.id).map(m => (
                <option key={m.id} value={m.id}>{m.name} — {m.role === 'super_admin' ? 'מנהל ראשי' : 'מנהל פרויקטים'}</option>
              ))}
            </select>
            <button style={s.assignBtn} onClick={assignSelected} disabled={!assignTo || saving}>
              {saving ? 'משייך...' : '✓ שייך'}
            </button>
          </div>
        )}

        {loading ? (
          <div style={s.emptyWrap}>טוען...</div>
        ) : projects.length === 0 ? (
          <div style={s.emptyWrap}>
            <div style={{fontSize:'40px', marginBottom:'12px'}}>📋</div>
            <div style={{fontSize:'15px', fontWeight:'600', color:'#1C2B20', marginBottom:'6px'}}>אין פרויקטים עדיין</div>
            <div style={{fontSize:'13px'}}>לחץ על הכפתור למטה כדי להוסיף פרויקט ראשון</div>
          </div>
        ) : projects.map(p => {
          const pct = getProgress(p)
          const open = getOpenTasks(p)
          const isSel = selected.includes(p.id)
          return (
            <div key={p.id} style={s.card(isSel)} onClick={()=>{
              if (selectMode) toggleSelect(p.id)
              else setSelectedProject(p)
            }}>
              <div style={s.cardTop}>
                <div style={{display:'flex', alignItems:'center', gap:'8px', flex:1}}>
                  {selectMode && (
                    <div style={{width:'20px', height:'20px', borderRadius:'6px', border: isSel ? 'none' : '2px solid #D4CFCA', background: isSel ? '#2D4A3E' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'12px', color:'#fff'}}>
                      {isSel ? '✓' : ''}
                    </div>
                  )}
                  <div>
                    <div style={s.projName}>{p.name}</div>
                    <div style={s.projClient}>{p.client}</div>
                  </div>
                </div>
                <span style={s.badge(p.status)}>{statusLabel(p.status).text}</span>
              </div>
              <div style={s.progWrap}>
                <div style={s.progFill(pct, p.status)}></div>
              </div>
              <div style={s.cardBottom}>
                <span style={s.taskChip}>{open} משימות פתוחות</span>
                <span style={s.pctText(p.status)}>{pct}%</span>
              </div>
            </div>
          )
        })}

        <button style={s.addBtn} onClick={()=>setShowAdd(true)}>+ פרויקט חדש</button>
      </div>
    </div>
  )
}