import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Subcontractors({ project, onBack }) {
  const [subs, setSubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', specialty: '', company: '' })
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', phone: '', specialty: '', company: '' })

  useEffect(() => { fetchSubs() }, [])

  const fetchSubs = async () => {
    const { data } = await supabase
      .from('project_assignments')
      .select('*, users(*)')
      .eq('project_id', project.id)
      .eq('role', 'subcontractor')
    setSubs(data || [])
    setLoading(false)
  }

  const addSub = async () => {
    if (!form.name.trim() || !form.phone.trim()) return
    setSaving(true)

    const code = Math.floor(100000 + Math.random() * 900000).toString()

    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([{
        name: form.name,
        phone: form.phone,
        company: form.company,
        specialty: form.specialty,
        role: 'subcontractor',
        access_code: code,
      }])
      .select()
      .single()

    if (!userError && userData) {
      await supabase.from('project_assignments').insert([{
        project_id: project.id,
        user_id: userData.id,
        role: 'subcontractor'
      }])
      setForm({ name: '', phone: '', specialty: '', company: '' })
      setShowAdd(false)
      await fetchSubs()

      const appUrl = 'https://hvac-manager-five.vercel.app'
      const waMsg = `שלום ${form.name} 👋\n\nהוזמנת למערכת ניהול הפרויקטים.\n\n🔗 כניסה לאפליקציה:\n${appUrl}\n\n🔑 קוד גישה שלך: ${code}\n\nשמור את הקוד — הוא קבוע.`
      const phone = form.phone.replace(/^0/, '')
      window.open(`https://wa.me/972${phone}?text=${encodeURIComponent(waMsg)}`, '_blank')
    }
    setSaving(false)
  }

  const startEdit = (sub) => {
    setEditId(sub.id)
    setEditForm({
      name: sub.users?.name || '',
      phone: sub.users?.phone || '',
      specialty: sub.users?.specialty || '',
      company: sub.users?.company || ''
    })
  }

  const saveEdit = async (sub) => {
    setSaving(true)
    await supabase.from('users').update({
      name: editForm.name,
      phone: editForm.phone,
      specialty: editForm.specialty,
      company: editForm.company
    }).eq('id', sub.users?.id)
    setEditId(null)
    await fetchSubs()
    setSaving(false)
  }

  const deleteSub = async (sub) => {
    if (!window.confirm(`למחוק את ${sub.users?.name} מהפרויקט?`)) return
    await supabase.from('project_assignments').delete().eq('id', sub.id)
    await fetchSubs()
  }

  const sendWhatsApp = (sub) => {
    const phone = sub.users?.phone?.replace(/^0/, '') || ''
    const name = sub.users?.name || ''
    const code = sub.users?.access_code || ''
    const appUrl = 'https://hvac-manager-five.vercel.app'
    const msg = `שלום ${name} 👋\n\nהנה פרטי הכניסה שלך למערכת:\n\n🔗 כניסה לאפליקציה:\n${appUrl}\n\n🔑 קוד גישה: ${code}\n\nשמור את הקוד — הוא קבוע.`
    window.open(`https://wa.me/972${phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const avatarColors = ['#EEF2FF','#E8F5EF','#FEF3E2','#FDF0ED','#F0F4FF']
  const textColors = ['#4338CA','#2D4A3E','#C07B2A','#C0392B','#3B5BDB']

  const s = {
    app: { minHeight:'100vh', background:'#F2EFE9', fontFamily:'Heebo, sans-serif', direction:'rtl', maxWidth:'100%', margin:'0 auto', paddingBottom:'40px' },
    topbar: { background:'#2D4A3E', padding:'14px 16px', display:'flex', alignItems:'center', gap:'10px' },
    backBtn: { width:'34px', height:'34px', borderRadius:'10px', background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', border:'none', fontSize:'18px', color:'#fff' },
    topbarTitle: { fontSize:'15px', fontWeight:'600', color:'#fff', flex:1 },
    body: { padding:'14px 16px' },
    card: { background:'#fff', borderRadius:'18px', border:'1px solid #E8E4DC', overflow:'hidden', marginBottom:'12px' },
    subItem: { padding:'12px 14px', borderBottom:'1px solid #F5F2EC' },
    subRow: { display:'flex', alignItems:'center', gap:'10px' },
    av: (i) => ({ width:'40px', height:'40px', borderRadius:'13px', background: avatarColors[i%5], display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:'600', color: textColors[i%5], flexShrink:0 }),
    subInfo: { flex:1 },
    subName: { fontSize:'14px', fontWeight:'600', color:'#1C2B20' },
    subSpec: { fontSize:'11px', color:'#9B9280', marginTop:'1px' },
    subPhone: { fontSize:'11px', color:'#2D4A3E', marginTop:'2px' },
    actionRow: { display:'flex', gap:'6px', marginTop:'8px' },
    waBtn: { display:'flex', alignItems:'center', gap:'4px', background:'#E8F5EF', border:'1px solid #B7DCCA', borderRadius:'10px', padding:'6px 10px', fontSize:'11px', fontWeight:'500', color:'#2D4A3E', cursor:'pointer', fontFamily:'Heebo, sans-serif' },
    editBtn: { display:'flex', alignItems:'center', gap:'4px', background:'#EEF2FF', border:'1px solid #C7D2FE', borderRadius:'10px', padding:'6px 10px', fontSize:'11px', fontWeight:'500', color:'#4338CA', cursor:'pointer', fontFamily:'Heebo, sans-serif' },
    delBtn: { display:'flex', alignItems:'center', gap:'4px', background:'#FDF0ED', border:'1px solid #FECACA', borderRadius:'10px', padding:'6px 10px', fontSize:'11px', fontWeight:'500', color:'#C0392B', cursor:'pointer', fontFamily:'Heebo, sans-serif' },
    editBox: { background:'#F9F7F4', borderRadius:'12px', padding:'12px', marginTop:'10px', border:'1px solid #E8E4DC' },
    lbl: { fontSize:'12px', fontWeight:'600', color:'#6B6457', marginBottom:'4px' },
    inp: { width:'100%', border:'1.5px solid #E8E4DC', borderRadius:'12px', padding:'10px 14px', fontSize:'14px', color:'#1C2B20', background:'#fff', fontFamily:'Heebo, sans-serif', boxSizing:'border-box', marginBottom:'10px' },
    inpSm: { width:'100%', border:'1.5px solid #E8E4DC', borderRadius:'10px', padding:'8px 12px', fontSize:'13px', color:'#1C2B20', background:'#fff', fontFamily:'Heebo, sans-serif', boxSizing:'border-box', marginBottom:'8px' },
    row: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' },
    saveBtn: { padding:'8px 16px', background:'#2D4A3E', border:'none', borderRadius:'10px', color:'#fff', fontSize:'12px', fontWeight:'600', cursor:'pointer', fontFamily:'Heebo, sans-serif' },
    cancelBtn: { padding:'8px 16px', background:'#F5F2EC', border:'none', borderRadius:'10px', color:'#6B6457', fontSize:'12px', cursor:'pointer', fontFamily:'Heebo, sans-serif' },
    addCard: { background:'#fff', borderRadius:'18px', border:'1px solid #E8E4DC', padding:'16px', marginBottom:'12px' },
    addSaveBtn: { width:'100%', padding:'11px', background:'#2D4A3E', border:'none', borderRadius:'12px', color:'#fff', fontSize:'13px', fontWeight:'600', cursor:'pointer', fontFamily:'Heebo, sans-serif' },
    addBtn: { width:'100%', padding:'14px', background:'#2D4A3E', border:'none', borderRadius:'16px', color:'#fff', fontSize:'14px', fontWeight:'600', cursor:'pointer', fontFamily:'Heebo, sans-serif' },
    emptyWrap: { textAlign:'center', padding:'32px 24px', color:'#9B9280' },
    codeChip: { fontSize:'10px', padding:'3px 8px', borderRadius:'20px', background:'#EEF2FF', color:'#4338CA', fontWeight:'600', fontFamily:'monospace' },
  }

  return (
    <div style={s.app}>
      <div style={s.topbar}>
        <button style={s.backBtn} onClick={onBack}>→</button>
        <div style={s.topbarTitle}>קבלני משנה — {project.name}</div>
      </div>
      <div style={s.body}>
        {showAdd && (
          <div style={s.addCard}>
            <div style={s.lbl}>שם הקבלן *</div>
            <input style={s.inp} placeholder="שם מלא" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
            <div style={s.lbl}>טלפון *</div>
            <input style={s.inp} placeholder="05X-XXXXXXX" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} type="tel" />
            <div style={s.row}>
              <div>
                <div style={s.lbl}>חברה</div>
                <input style={{...s.inp,marginBottom:0}} placeholder="שם החברה" value={form.company} onChange={e=>setForm({...form,company:e.target.value})} />
              </div>
              <div>
                <div style={s.lbl}>התמחות</div>
                <input style={{...s.inp,marginBottom:0}} placeholder="לדוגמה: חשמל" value={form.specialty} onChange={e=>setForm({...form,specialty:e.target.value})} />
              </div>
            </div>
            <div style={{height:'12px'}}></div>
            <button style={s.addSaveBtn} onClick={addSub} disabled={saving}>{saving ? 'מוסיף...' : '✓ הוסף קבלן ושלח קוד'}</button>
          </div>
        )}

        {loading ? (
          <div style={s.emptyWrap}>טוען...</div>
        ) : subs.length === 0 && !showAdd ? (
          <div style={s.emptyWrap}>
            <div style={{fontSize:'36px', marginBottom:'10px'}}>👷</div>
            <div style={{fontSize:'14px', fontWeight:'600', color:'#1C2B20', marginBottom:'4px'}}>אין קבלנים עדיין</div>
            <div>לחץ למטה להוספת קבלן ראשון</div>
          </div>
        ) : (
          <div style={s.card}>
            {subs.map((sub, i) => (
              <div key={sub.id} style={{...s.subItem, borderBottom: i===subs.length-1?'none':'1px solid #F5F2EC'}}>
                <div style={s.subRow}>
                  <div style={s.av(i)}>{sub.users?.name?.slice(0,2) || '??'}</div>
                  <div style={s.subInfo}>
                    <div style={s.subName}>{sub.users?.name}</div>
                    <div style={s.subSpec}>{sub.users?.specialty || sub.users?.company || 'קבלן משנה'}</div>
                    <div style={s.subPhone}>{sub.users?.phone}</div>
                    {sub.users?.access_code && <span style={s.codeChip}>קוד: {sub.users.access_code}</span>}
                  </div>
                </div>
                <div style={s.actionRow}>
                  <button style={s.waBtn} onClick={()=>sendWhatsApp(sub)}>📱 וואטסאפ</button>
                  <button style={s.editBtn} onClick={()=>editId===sub.id ? setEditId(null) : startEdit(sub)}>✏️ עריכה</button>
                  <button style={s.delBtn} onClick={()=>deleteSub(sub)}>🗑 מחק</button>
                </div>
                {editId === sub.id && (
                  <div style={s.editBox}>
                    <div style={s.lbl}>שם</div>
                    <input style={s.inpSm} value={editForm.name} onChange={e=>setEditForm({...editForm,name:e.target.value})} />
                    <div style={s.lbl}>טלפון</div>
                    <input style={s.inpSm} value={editForm.phone} onChange={e=>setEditForm({...editForm,phone:e.target.value})} />
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
                      <div>
                        <div style={s.lbl}>חברה</div>
                        <input style={{...s.inpSm,marginBottom:0}} value={editForm.company} onChange={e=>setEditForm({...editForm,company:e.target.value})} />
                      </div>
                      <div>
                        <div style={s.lbl}>התמחות</div>
                        <input style={{...s.inpSm,marginBottom:0}} value={editForm.specialty} onChange={e=>setEditForm({...editForm,specialty:e.target.value})} />
                      </div>
                    </div>
                    <div style={{display:'flex', gap:'8px', marginTop:'10px'}}>
                      <button style={s.saveBtn} onClick={()=>saveEdit(sub)} disabled={saving}>{saving?'שומר...':'✓ שמור'}</button>
                      <button style={s.cancelBtn} onClick={()=>setEditId(null)}>ביטול</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <button style={s.addBtn} onClick={()=>setShowAdd(!showAdd)}>
          {showAdd ? '✕ ביטול' : '+ הוסף קבלן'}
        </button>
      </div>
    </div>
  )
}
