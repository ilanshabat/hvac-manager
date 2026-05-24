import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import AddProject from './AddProject'
import ProjectDetail from './ProjectDetail'

export default function Dashboard({ user, onLogout }) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) setProjects(data || [])
    setLoading(false)
  }

  const statusLabel = (s) => ({
    active: { text: 'פעיל', bg: '#E8F5EF', color: '#2D4A3E' },
    risk:   { text: '⚠ סיכון', bg: '#FDF0ED', color: '#C0392B' },
    planning: { text: 'תכנון', bg: '#FEF3E2', color: '#C07B2A' },
    done:   { text: 'הושלם', bg: '#E8F5EF', color: '#2D4A3E' },
    paused: { text: 'מושהה', bg: '#F5F2EC', color: '#9B9280' },
  }[s] || { text: s, bg: '#F5F2EC', color: '#9B9280' })

  const s = {
    app: { minHeight:'100vh', background:'#F2EFE9', fontFamily:'Heebo, sans-serif', direction:'rtl', maxWidth:'390px', margin:'0 auto', paddingBottom:'24px' },
    topbar: { background:'#2D4A3E', padding:'16px', display:'flex', alignItems:'center', justifyContent:'space-between' },
    topbarTitle: { fontSize:'18px', fontWeight:'600', color:'#fff' },
    topbarSub: { fontSize:'11px', color:'rgba(255,255,255,0.6)', marginTop:'2px' },
    logoutBtn: { background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'10px', padding:'6px 12px', color:'#fff', fontSize:'12px', cursor:'pointer', fontFamily:'Heebo, sans-serif' },
    statsWrap: { padding:'16px 16px 0' },
    stats: { display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:'10px' },
    stat: { background:'#fff', borderRadius:'16px', padding:'14px', border:'1px solid #E8E4DC' },
    statVal: { fontSize:'26px', fontWeight:'600', color:'#1C2B20' },
    statLbl: { fontSize:'12px', color:'#9B9280', marginTop:'2px' },
    sectionWrap: { padding:'16px 16px 0' },
    sectionHdr: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' },
    sectionTitle: { fontSize:'14px', fontWeight:'600', color:'#1C2B20' },
    card: { background:'#fff', borderRadius:'18px', border:'1px solid #E8E4DC', padding:'16px', marginBottom:'12px', borderRight:'4px solid #E8E4DC', cursor:'pointer' },
    projName: { fontSize:'15px', fontWeight:'600', color:'#1C2B20', marginBottom:'4px' },
    projClient: { fontSize:'12px', color:'#9B9280', marginBottom:'12px' },
    badge: (st) => ({ fontSize:'11px', padding:'4px 10px', borderRadius:'20px', fontWeight:'500', background: statusLabel(st).bg, color: statusLabel(st).color }),
    progBar: { height:'8px', background:'#F0EDE6', borderRadius:'20px', overflow:'hidden', marginBottom:'8px' },
    progFill: (pct) => ({ height:'100%', borderRadius:'20px', background:'linear-gradient(90deg,#2D4A3E,#4A7C68)', width:`${pct}%` }),
    emptyWrap: { textAlign:'center', padding:'40px 24px', color:'#9B9280' },
    addBtn: { width:'100%', padding:'14px', background:'#2D4A3E', border:'none', borderRadius:'16px', color:'#fff', fontSize:'14px', fontWeight:'600', cursor:'pointer', fontFamily:'Heebo, sans-serif', marginTop:'8px' },
  }

  if (showAdd) return <AddProject user={user} onBack={()=>setShowAdd(false)} onSaved={()=>{ setShowAdd(false); fetchProjects() }} />
  if (selectedProject) return <ProjectDetail project={selectedProject} user={user} onBack={()=>setSelectedProject(null)} />

  return (
    <div style={s.app}>
      <div style={s.topbar}>
        <div>
          <div style={s.topbarTitle}>לוח בקרה 🏗️</div>
          <div style={s.topbarSub}>{user?.email}</div>
        </div>
        <button style={s.logoutBtn} onClick={onLogout}>יציאה</button>
      </div>

      <div style={s.statsWrap}>
        <div style={s.stats}>
          <div style={s.stat}>
            <div style={s.statVal}>{projects.length}</div>
            <div style={s.statLbl}>פרויקטים פעילים</div>
          </div>
          <div style={s.stat}>
            <div style={{...s.statVal, color:'#C0392B'}}>{projects.filter(p=>p.status==='risk').length}</div>
            <div style={s.statLbl}>צווארי בקבוק</div>
          </div>
        </div>
      </div>

      <div style={s.sectionWrap}>
        <div style={s.sectionHdr}>
          <div style={s.sectionTitle}>הפרויקטים שלי</div>
        </div>

        {loading ? (
          <div style={s.emptyWrap}>טוען...</div>
        ) : projects.length === 0 ? (
          <div style={s.emptyWrap}>
            <div style={{fontSize:'40px', marginBottom:'12px'}}>📋</div>
            <div style={{fontSize:'15px', fontWeight:'600', color:'#1C2B20', marginBottom:'6px'}}>אין פרויקטים עדיין</div>
            <div style={{fontSize:'13px'}}>לחץ על הכפתור למטה כדי להוסיף פרויקט ראשון</div>
          </div>
        ) : (
          projects.map(p => (
            <div key={p.id} style={{...s.card, borderRightColor: p.status==='risk'?'#E76F51':p.status==='active'?'#2D4A3E':'#F4A261', cursor:'pointer'}} onClick={()=>setSelectedProject(p)}>
              <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'6px'}}>
                <div style={s.projName}>{p.name}</div>
                <span style={s.badge(p.status)}>{statusLabel(p.status).text}</span>
              </div>
              <div style={s.projClient}>{p.client} · מסירה {p.end_date || 'לא הוגדר'}</div>
              <div style={s.progBar}>
                <div style={s.progFill(0)}></div>
              </div>
            </div>
          ))
        )}

        <button style={s.addBtn} onClick={() => setShowAdd(true)}>
          + פרויקט חדש
        </button>
      </div>
    </div>
  )
}