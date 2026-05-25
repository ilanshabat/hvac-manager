import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Subcontractors from './Subcontractors'
import BOM from './BOM'

export default function ProjectDetail({ project, user, onBack }) {
  const [tab, setTab] = useState('tasks')
  const [tasks, setTasks] = useState([])
  const [subs, setSubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ title:'', priority:'medium', due_date:'', assignee_id:'' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    const [{ data: t }, { data: s }] = await Promise.all([
      supabase.from('tasks').select('*, users(name)').eq('project_id', project.id).order('created_at', { ascending: false }),
      supabase.from('project_assignments').select('*, users(*)').eq('project_id', project.id).eq('role', 'subcontractor')
    ])
    setTasks(t || [])
    setSubs(s || [])
    setLoading(false)
  }

  const addTask = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    await supabase.from('tasks').insert([{
      title: form.title,
      priority: form.priority,
      due_date: form.due_date || null,
      assignee_id: form.assignee_id || user.id,
      assignee_type: form.assignee_id ? 'subcontractor' : 'internal',
      project_id: project.id,
      status: 'open'
    }])
    setForm({ title:'', priority:'medium', due_date:'', assignee_id:'' })
    setShowAdd(false)
    await fetchAll()
    setSaving(false)
  }

  const toggle = async (task) => {
    const s = task.status === 'done' ? 'open' : 'done'
    await supabase.from('tasks').update({ status: s }).eq('id', task.id)
    setTasks(tasks.map(t => t.id === task.id ? { ...t, status: s } : t))
  }

  const pri = (p) => ({ high:{bg:'#FDF0ED',color:'#C0392B',text:'דחוף'}, medium:{bg:'#FEF3E2',color:'#C07B2A',text:'בינוני'}, low:{bg:'#E8F5EF',color:'#2D4A3E',text:'נמוך'} }[p] || {bg:'#F5F2EC',color:'#9B9280',text:p})
  const stMap = { active:{text:'פעיל',bg:'#E8F5EF',color:'#2D4A3E'}, risk:{text:'⚠ סיכון',bg:'#FDF0ED',color:'#C0392B'}, planning:{text:'תכנון',bg:'#FEF3E2',color:'#C07B2A'}, done:{text:'הושלם',bg:'#E8F5EF',color:'#2D4A3E'}, paused:{text:'מושהה',bg:'#F5F2EC',color:'#9B9280'} }
  const st = stMap[project.status] || {text:project.status, bg:'#F5F2EC', color:'#9B9280'}

  const open = tasks.filter(t => t.status !== 'done')
  const done = tasks.filter(t => t.status === 'done')
  const late = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done')

  const c = {
    app:    { minHeight:'100vh', background:'#F2EFE9', fontFamily:'Heebo, sans-serif', direction:'rtl', maxWidth:'390px', margin:'0 auto', paddingBottom:'40px' },
    top:    { background:'#2D4A3E', padding:'14px 16px', display:'flex', alignItems:'center', gap:'10px' },
    back:   { width:'34px', height:'34px', borderRadius:'10px', background:'rgba(255,255,255,0.15)', border:'none', fontSize:'18px', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' },
    tInfo:  { flex:1 },
    tTitle: { fontSize:'15px', fontWeight:'600', color:'#fff' },
    tSub:   { fontSize:'11px', color:'rgba(255,255,255,0.6)', marginTop:'1px' },
    badge:  { fontSize:'11px', padding:'4px 10px', borderRadius:'20px', fontWeight:'500', background:st.bg, color:st.color, whiteSpace:'nowrap' },
    hero:   { background:'#2D4A3E', padding:'0 16px 16px' },
    hcs:    { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px' },
    hc:     { background:'rgba(255,255,255,0.12)', borderRadius:'12px', padding:'10px 6px', textAlign:'center' },
    hcV:    { fontSize:'18px', fontWeight:'600', color:'#fff' },
    hcL:    { fontSize:'9px', color:'rgba(255,255,255,0.6)', marginTop:'3px' },
    tw:     { padding:'12px 16px 0' },
    tabs:   { display:'flex', background:'#fff', borderRadius:'14px', padding:'4px', border:'1px solid #E8E4DC', gap:'2px' },
    tab:  a => ({ flex:1, padding:'8px 4px', textAlign:'center', fontSize:'12px', fontWeight:'500', cursor:'pointer', borderRadius:'10px', border:'none', background:a?'#2D4A3E':'transparent', color:a?'#fff':'#9B9280', fontFamily:'Heebo, sans-serif' }),
    body:   { padding:'12px 16px' },
    card:   { background:'#fff', borderRadius:'16px', border:'1px solid #E8E4DC', overflow:'hidden', marginBottom:'10px' },
    ti:     { padding:'12px 14px', borderBottom:'1px solid #F5F2EC', display:'flex', alignItems:'flex-start', gap:'10px' },
    chk:  d => ({ width:'22px', height:'22px', borderRadius:'50%', border:d?'none':'2px solid #D4CFCA', background:d?'#2D4A3E':'transparent', flexShrink:0, marginTop:'2px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:'12px', color:'#fff' }),
    ttl:  d => ({ fontSize:'14px', color:d?'#B5AFA6':'#1C2B20', textDecoration:d?'line-through':'none', marginBottom:'5px' }),
    cps:    { display:'flex', gap:'5px', flexWrap:'wrap' },
    cp:  (bg,cl) => ({ fontSize:'10px', padding:'3px 8px', borderRadius:'20px', fontWeight:'500', background:bg, color:cl }),
    dc:  od => ({ fontSize:'10px', padding:'3px 8px', borderRadius:'20px', background:od?'#FDF0ED':'#F5F2EC', color:od?'#C0392B':'#6B6457' }),
    form:   { background:'#fff', borderRadius:'16px', border:'1px solid #E8E4DC', padding:'14px', marginBottom:'10px' },
    lbl:    { fontSize:'12px', fontWeight:'600', color:'#6B6457', marginBottom:'4px' },
    inp:    { width:'100%', border:'1.5px solid #E8E4DC', borderRadius:'12px', padding:'10px 14px', fontSize:'14px', color:'#1C2B20', background:'#F9F7F4', fontFamily:'Heebo, sans-serif', boxSizing:'border-box', marginBottom:'10px' },
    sel:    { width:'100%', border:'1.5px solid #E8E4DC', borderRadius:'12px', padding:'10px 14px', fontSize:'14px', color:'#1C2B20', background:'#F9F7F4', fontFamily:'Heebo, sans-serif', boxSizing:'border-box', marginBottom:'10px' },
    save:   { width:'100%', padding:'11px', background:'#2D4A3E', border:'none', borderRadius:'12px', color:'#fff', fontSize:'13px', fontWeight:'600', cursor:'pointer', fontFamily:'Heebo, sans-serif' },
    add:    { width:'100%', padding:'12px', background:'#fff', border:'2px dashed #D4CFCA', borderRadius:'14px', fontSize:'13px', fontWeight:'500', color:'#9B9280', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', fontFamily:'Heebo, sans-serif' },
    empty:  { textAlign:'center', padding:'32px 24px', color:'#9B9280' },
    soon:   { textAlign:'center', padding:'40px 24px', color:'#9B9280', fontSize:'13px' },
    slbl:   { fontSize:'12px', fontWeight:'600', color:'#9B9280', marginBottom:'6px' },
  }

  return (
    <div style={c.app}>
      <div style={c.top}>
        <button style={c.back} onClick={onBack}>→</button>
        <div style={c.tInfo}>
          <div style={c.tTitle}>{project.name}</div>
          <div style={c.tSub}>{project.client} · מסירה {project.end_date || 'לא הוגדר'}</div>
        </div>
        <span style={c.badge}>{st.text}</span>
      </div>

      <div style={c.hero}>
        <div style={c.hcs}>
          <div style={c.hc}><div style={c.hcV}>{open.length}</div><div style={c.hcL}>פתוחות</div></div>
          <div style={c.hc}><div style={{...c.hcV, color:late.length>0?'#F4C77A':'#fff'}}>{late.length}</div><div style={c.hcL}>באיחור</div></div>
          <div style={c.hc}><div style={c.hcV}>{done.length}</div><div style={c.hcL}>הושלמו</div></div>
        </div>
      </div>

      <div style={c.tw}>
        <div style={c.tabs}>
          {['tasks','subs','bom','meetings'].map((t,i) => (
            <button key={t} style={c.tab(tab===t)} onClick={()=>setTab(t)}>
              {['משימות','קבלנים','רכש','יומן'][i]}
            </button>
          ))}
        </div>
      </div>

      <div style={c.body}>
        {tab==='tasks' && (
          <>
            {showAdd && (
              <div style={c.form}>
                <div style={c.lbl}>שם המשימה</div>
                <input style={c.inp} placeholder="תיאור המשימה..." value={form.title} onChange={e=>setForm({...form,title:e.target.value})} />
                <div style={c.lbl}>עדיפות</div>
                <select style={c.sel} value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>
                  <option value="high">דחוף</option>
                  <option value="medium">בינוני</option>
                  <option value="low">נמוך</option>
                </select>
                <div style={c.lbl}>תאריך יעד</div>
                <input style={c.inp} type="date" value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})} />
                <div style={c.lbl}>שייך ל</div>
                <select style={c.sel} value={form.assignee_id} onChange={e=>setForm({...form,assignee_id:e.target.value})}>
                  <option value="">אני (מנהל פרויקט)</option>
                  {subs.map(s=>(
                    <option key={s.users.id} value={s.users.id}>{s.users.name} — {s.users.specialty||s.users.company||'קבלן'}</option>
                  ))}
                </select>
                <button style={c.save} onClick={addTask} disabled={saving}>{saving?'שומר...':'✓ הוסף משימה'}</button>
              </div>
            )}

            {loading ? <div style={c.empty}>טוען...</div> : (
              <>
                {open.length===0 && done.length===0 ? (
                  <div style={c.empty}>
                    <div style={{fontSize:'36px',marginBottom:'10px'}}>✅</div>
                    <div style={{fontSize:'14px',fontWeight:'600',color:'#1C2B20',marginBottom:'4px'}}>אין משימות עדיין</div>
                    <div>לחץ למטה להוספת משימה</div>
                  </div>
                ) : (
                  <>
                    {open.length>0 && <>
                      <div style={c.slbl}>פתוחות</div>
                      <div style={c.card}>
                        {open.map(t=>(
                          <div key={t.id} style={c.ti}>
                            <div style={c.chk(false)} onClick={()=>toggle(t)}>○</div>
                            <div style={{flex:1}}>
                              <div style={c.ttl(false)}>{t.title}</div>
                              <div style={c.cps}>
                                <span style={c.cp(pri(t.priority).bg,pri(t.priority).color)}>{pri(t.priority).text}</span>
                                {t.users && <span style={c.cp('#EEF2FF','#4338CA')}>{t.users.name}</span>}
                                {t.due_date && <span style={c.dc(new Date(t.due_date)<new Date())}>{t.due_date}</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>}
                    {done.length>0 && <>
                      <div style={c.slbl}>הושלמו</div>
                      <div style={c.card}>
                        {done.map(t=>(
                          <div key={t.id} style={c.ti}>
                            <div style={c.chk(true)} onClick={()=>toggle(t)}>✓</div>
                            <div style={{flex:1}}><div style={c.ttl(true)}>{t.title}</div></div>
                          </div>
                        ))}
                      </div>
                    </>}
                  </>
                )}
              </>
            )}
            <button style={c.add} onClick={()=>setShowAdd(!showAdd)}>+ הוסף משימה</button>
          </>
        )}
        {tab==='subs'     && <Subcontractors project={project} onBack={()=>setTab('tasks')} />}
        {tab==='bom'      && <BOM project={project} onBack={()=>setTab('tasks')} />}
        {tab==='meetings' && <div style={c.soon}><div style={{fontSize:'32px',marginBottom:'10px'}}>📅</div>מודול יומן — בקרוב</div>}
      </div>
    </div>
  )
}