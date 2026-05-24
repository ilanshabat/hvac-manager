import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Subcontractors({ project, onBack }) {
  const [subs, setSubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', specialty: '', company: '' })

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

    // צור משתמש חדש
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expires = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([{
        name: form.name,
        phone: form.phone,
        company: form.company,
        specialty: form.specialty,
        role: 'subcontractor',
        access_code: code,
        code_expires_at: expires
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

      // הצג את הקוד למנהל
      alert(`✅ קבלן נוסף בהצלחה!\n\nשלח לו את הקוד הזה:\n🔑 ${code}\n\nשלח בוואטסאפ:\nhttps://wa.me/972${form.phone.replace(/^0/, '')}?text=שלום ${form.name}, קוד הגישה שלך למערכת: ${code}`)
    }
    setSaving(false)
  }

  const sendWhatsApp = (sub) => {
    const phone = sub.users?.phone?.replace(/^0/, '') || ''
    const name = sub.users?.name || ''
    const msg = `שלום ${name}, קוד הגישה שלך למערכת: ${sub.users?.access_code || ''}`
    window.open(`https://wa.me/972${phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const avatarColors = ['#EEF2FF','#E8F5EF','#FEF3E2','#FDF0ED','#F0F4FF']
  const textColors = ['#4338CA','#2D4A3E','#C07B2A','#C0392B','#3B5BDB']

  const s = {
    app: { minHeight:'100vh', background:'#F2EFE9', fontFamily:'Heebo, sans-serif', direction:'rtl', maxWidth:'390px', margin:'0 auto', paddingBottom:'40px' },
    topbar: { background:'#2D4A3E', padding:'14px 16px', display:'flex', alignItems:'center', gap:'10px' },
    backBtn: { width:'34px', height:'34px', borderRadius:'10px', background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', border:'none', fontSize:'18px', color:'#fff' },
    topbarTitle: { fontSize:'15px', fontWeight:'600', color:'#fff', flex:1 },
    body: { padding:'14px 16px' },
    card: { background:'#fff', borderRadius:'18px', border:'1px solid #E8E4DC', overflow:'hidden', marginBottom:'12px' },
    subItem: { padding:'12px 14px', display:'flex', alignItems:'center', gap:'10px', borderBottom:'1px solid #F5F2EC' },
    av: (i) => ({ width:'40px', height:'40px', borderRadius:'13px', background: avatarColors[i%5], display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:'600', color: textColors[i%5], flexShrink:0 }),
    subInfo: { flex:1 },
    subName: { fontSize:'14px', fontWeight:'600', color:'#1C2B20' },
    subSpec: { fontSize:'11px', color:'#9B9280', marginTop:'1px' },
    subPhone: { fontSize:'11px', color:'#2D4A3E', marginTop:'2px' },
    waBtn: { display:'flex', alignItems:'center', gap:'4px', background:'#E8F5EF', border:'1px solid #B7DCCA', borderRadius:'10px', padding:'6px 10px', fontSize:'11px', fontWeight:'500', color:'#2D4A3E', cursor:'pointer', fontFamily:'Heebo, sans-serif' },
    addCard: { background:'#fff', borderRadius:'18px', border:'1px solid #E8E4DC', padding:'16px', marginBottom:'12px' },
    lbl: { fontSize:'12px', fontWeight:'600', color:'#6B6457', marginBottom:'6px' },
    inp: { width:'100%', border:'1.5px solid #E8E4DC', borderRadius:'12px', padding:'10px 14px', fontSize:'14px', color:'#1C2B20', background:'#F9F7F4', fontFamily:'Heebo, sans-serif', boxSizing:'border-box', marginBottom:'12px' },
    row: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' },
    saveBtn: { width:'100%', padding:'11px', background:'#2D4A3E', border:'none', borderRadius:'12px', color:'#fff', fontSize:'13px', fontWeight:'600', cursor:'pointer', fontFamily:'Heebo, sans-serif' },
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
            <button style={s.saveBtn} onClick={addSub} disabled={saving}>
              {saving ? 'מוסיף...' : '✓ הוסף קבלן ושלח קוד'}
            </button>
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
                <div style={s.av(i)}>
                  {sub.users?.name?.slice(0,2) || '??'}
                </div>
                <div style={s.subInfo}>
                  <div style={s.subName}>{sub.users?.name}</div>
                  <div style={s.subSpec}>{sub.users?.specialty || sub.users?.company || 'קבלן משנה'}</div>
                  <div style={s.subPhone}>{sub.users?.phone}</div>
                  {sub.users?.access_code && (
                    <span style={s.codeChip}>קוד: {sub.users.access_code}</span>
                  )}
                </div>
                <button style={s.waBtn} onClick={()=>sendWhatsApp(sub)}>
                  📱 וואטסאפ
                </button>
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