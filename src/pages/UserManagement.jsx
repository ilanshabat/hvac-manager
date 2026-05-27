import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function UserManagement({ dbUser, onBack }) {
  const [users, setUsers] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name:'', email:'', phone:'', role:'project_manager' })

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    const [{ data: u }, { data: p }] = await Promise.all([
      supabase.from('users').select('*').neq('role', 'subcontractor').order('created_at'),
      supabase.from('projects').select('*').order('name')
    ])
    setUsers(u || [])
    setProjects(p || [])
    setLoading(false)
  }

  const addManager = async () => {
    if (!form.name.trim() || !form.email.trim()) return
    setSaving(true)

    const code = Math.floor(100000 + Math.random() * 900000).toString()

    const { data: userData, error } = await supabase
      .from('users')
      .insert([{
        name: form.name,
        email: form.email,
        phone: form.phone,
        role: form.role,
        access_code: code,
      }])
      .select()
      .single()

    if (!error && userData) {
      const phone = form.phone.replace(/^0/, '')
      const appUrl = 'https://hvac-manager-five.vercel.app'
      const waMsg = `שלום ${form.name} 👋\n\nהוזמנת למערכת FieldOps.\n\n🔗 כניסה:\n${appUrl}\n\n🔑 קוד גישה: ${code}\n\nשמור את הקוד — הוא קבוע.`
      if (phone) window.open(`https://wa.me/972${phone}?text=${encodeURIComponent(waMsg)}`, '_blank')
      setForm({ name:'', email:'', phone:'', role:'project_manager' })
      setShowAdd(false)
      await fetchAll()
    }
    setSaving(false)
  }

  const deleteUser = async (u) => {
    if (!window.confirm(`למחוק את ${u.name}?`)) return
    await supabase.from('users').delete().eq('id', u.id)
    await fetchAll()
  }

  const roleLabel = (r) => ({
    super_admin: { text:'מנהל ראשי', bg:'#EEF2FF', color:'#4338CA' },
    project_manager: { text:'מנהל פרויקטים', bg:'#E8F5EF', color:'#2D4A3E' },
  }[r] || { text:r, bg:'#F5F2EC', color:'#9B9280' })

  const initials = (name) => {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    return parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0].slice(0,2)
  }

  const s = {
    app: { minHeight:'100vh', background:'#F2EFE9', fontFamily:'Heebo, sans-serif', direction:'rtl', maxWidth:'390px', margin:'0 auto', paddingBottom:'40px' },
    top: { background:'#2D4A3E', padding:'14px 16px', display:'flex', alignItems:'center', gap:'10px' },
    back: { width:'34px', height:'34px', borderRadius:'10px', background:'rgba(255,255,255,0.15)', border:'none', fontSize:'18px', color:'#fff', cursor:'pointer' },
    tt: { fontSize:'15px', fontWeight:'600', color:'#fff', flex:1 },
    body: { padding:'14px 16px' },
    card: { background:'#fff', borderRadius:'18px', border:'1px solid #E8E4DC', overflow:'hidden', marginBottom:'12px' },
    userItem: { padding:'12px 14px', borderBottom:'1px solid #F5F2EC' },
    userRow: { display:'flex', alignItems:'center', gap:'10px' },
    av: { width:'40px', height:'40px', borderRadius:'13px', background:'#E8F5EF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:'600', color:'#2D4A3E', flexShrink:0 },
    userInfo: { flex:1 },
    userName: { fontSize:'14px', fontWeight:'600', color:'#1C2B20' },
    userEmail: { fontSize:'11px', color:'#9B9280', marginTop:'1px' },
    userPhone: { fontSize:'11px', color:'#2D4A3E', marginTop:'1px' },
    badge: (r) => ({ fontSize:'10px', padding:'3px 8px', borderRadius:'20px', background:roleLabel(r).bg, color:roleLabel(r).color, fontWeight:'500', marginTop:'4px', display:'inline-block' }),
    delBtn: { background:'#FDF0ED', border:'1px solid #FECACA', borderRadius:'10px', padding:'6px 10px', fontSize:'11px', color:'#C0392B', cursor:'pointer', fontFamily:'Heebo, sans-serif' },
    addCard: { background:'#fff', borderRadius:'18px', border:'1px solid #E8E4DC', padding:'16px', marginBottom:'12px' },
    lbl: { fontSize:'12px', fontWeight:'600', color:'#6B6457', marginBottom:'4px' },
    inp: { width:'100%', border:'1.5px solid #E8E4DC', borderRadius:'12px', padding:'10px 14px', fontSize:'14px', color:'#1C2B20', background:'#F9F7F4', fontFamily:'Heebo, sans-serif', boxSizing:'border-box', marginBottom:'10px' },
    sel: { width:'100%', border:'1.5px solid #E8E4DC', borderRadius:'12px', padding:'10px 14px', fontSize:'14px', color:'#1C2B20', background:'#F9F7F4', fontFamily:'Heebo, sans-serif', boxSizing:'border-box', marginBottom:'10px' },
    saveBtn: { width:'100%', padding:'11px', background:'#2D4A3E', border:'none', borderRadius:'12px', color:'#fff', fontSize:'13px', fontWeight:'600', cursor:'pointer', fontFamily:'Heebo, sans-serif' },
    addBtn: { width:'100%', padding:'14px', background:'#2D4A3E', border:'none', borderRadius:'16px', color:'#fff', fontSize:'14px', fontWeight:'600', cursor:'pointer', fontFamily:'Heebo, sans-serif' },
    empty: { textAlign:'center', padding:'32px 24px', color:'#9B9280' },
    meChip: { fontSize:'10px', padding:'2px 7px', borderRadius:'20px', background:'#FEF3E2', color:'#C07B2A', fontWeight:'500', marginRight:'4px' },
  }

  return (
    <div style={s.app}>
      <div style={s.top}>
        <button style={s.back} onClick={onBack}>→</button>
        <div style={s.tt}>ניהול משתמשים</div>
      </div>

      <div style={s.body}>
        {showAdd && (
          <div style={s.addCard}>
            <div style={s.lbl}>שם מלא *</div>
            <input style={s.inp} placeholder="ישראל ישראלי" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
            <div style={s.lbl}>אימייל *</div>
            <input style={s.inp} placeholder="email@example.com" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
            <div style={s.lbl}>טלפון</div>
            <input style={s.inp} placeholder="05X-XXXXXXX" type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} />
            <div style={s.lbl}>תפקיד</div>
            <select style={s.sel} value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
              <option value="project_manager">מנהל פרויקטים</option>
              <option value="super_admin">מנהל ראשי</option>
            </select>
            <button style={s.saveBtn} onClick={addManager} disabled={saving}>
              {saving ? 'מוסיף...' : '✓ הוסף משתמש ושלח קוד'}
            </button>
          </div>
        )}

        {loading ? (
          <div style={s.empty}>טוען...</div>
        ) : (
          <div style={s.card}>
            {users.map((u, i) => (
              <div key={u.id} style={{...s.userItem, borderBottom: i===users.length-1?'none':'1px solid #F5F2EC'}}>
                <div style={s.userRow}>
                  <div style={s.av}>{initials(u.name)}</div>
                  <div style={s.userInfo}>
                    <div style={s.userName}>
                      {u.id === dbUser.id && <span style={s.meChip}>אני</span>}
                      {u.name}
                    </div>
                    {u.email && <div style={s.userEmail}>{u.email}</div>}
                    {u.phone && <div style={s.userPhone}>{u.phone}</div>}
                    <span style={s.badge(u.role)}>{roleLabel(u.role).text}</span>
                  </div>
                  {u.id !== dbUser.id && (
                    <button style={s.delBtn} onClick={()=>deleteUser(u)}>🗑 מחק</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <button style={s.addBtn} onClick={()=>setShowAdd(!showAdd)}>
          {showAdd ? '✕ ביטול' : '+ הוסף משתמש'}
        </button>
      </div>
    </div>
  )
}