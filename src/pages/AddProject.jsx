import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AddProject({ user, dbUser, onBack, onSaved }) {
  const [form, setForm] = useState({
    name: '', client: '', location: '', status: 'planning',
    start_date: '', end_date: '', notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const update = (field, val) => setForm(f => ({ ...f, [field]: val }))

  const handleSave = async () => {
    if (!form.name.trim()) { setError('שם הפרויקט הוא שדה חובה'); return }
    setLoading(true)
    setError('')

    const { data: project, error: projError } = await supabase
      .from('projects')
      .insert([{ ...form, created_by: user.id }])
      .select()
      .single()

    if (projError) {
      setError('שגיאה בשמירה: ' + projError.message)
      setLoading(false)
      return
    }

    // שיוך אוטומטי של המנהל שיצר את הפרויקט
    if (project && dbUser?.id) {
      await supabase.from('project_manager_assignments').insert([{
        project_id: project.id,
        user_id: dbUser.id
      }])
    }

    onSaved()
    setLoading(false)
  }

  const s = {
    app: { minHeight:'100vh', background:'#F2EFE9', fontFamily:'Heebo, sans-serif', direction:'rtl', maxWidth:'390px', margin:'0 auto', paddingBottom:'40px' },
    topbar: { background:'#2D4A3E', padding:'14px 16px', display:'flex', alignItems:'center', gap:'10px' },
    backBtn: { width:'34px', height:'34px', borderRadius:'10px', background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', border:'none', fontSize:'18px', color:'#fff' },
    topbarTitle: { fontSize:'15px', fontWeight:'600', color:'#fff' },
    body: { padding:'16px' },
    card: { background:'#fff', borderRadius:'18px', border:'1px solid #E8E4DC', padding:'16px', marginBottom:'12px' },
    lbl: { fontSize:'12px', fontWeight:'600', color:'#6B6457', marginBottom:'6px' },
    inp: { width:'100%', border:'1.5px solid #E8E4DC', borderRadius:'12px', padding:'11px 14px', fontSize:'14px', color:'#1C2B20', background:'#F9F7F4', fontFamily:'Heebo, sans-serif', boxSizing:'border-box', marginBottom:'14px' },
    textarea: { width:'100%', border:'1.5px solid #E8E4DC', borderRadius:'12px', padding:'11px 14px', fontSize:'13px', color:'#1C2B20', background:'#F9F7F4', fontFamily:'Heebo, sans-serif', boxSizing:'border-box', resize:'none', minHeight:'80px' },
    select: { width:'100%', border:'1.5px solid #E8E4DC', borderRadius:'12px', padding:'11px 14px', fontSize:'14px', color:'#1C2B20', background:'#F9F7F4', fontFamily:'Heebo, sans-serif', boxSizing:'border-box', marginBottom:'14px' },
    row: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' },
    err: { background:'#FDF0ED', border:'1px solid #F4C9B7', borderRadius:'10px', padding:'10px 14px', fontSize:'13px', color:'#C0392B', marginBottom:'12px', textAlign:'center' },
    saveBtn: (l) => ({ width:'100%', padding:'14px', background: l ? '#9B9280' : '#2D4A3E', border:'none', borderRadius:'14px', color:'#fff', fontSize:'15px', fontWeight:'600', cursor: l ? 'default' : 'pointer', fontFamily:'Heebo, sans-serif' }),
  }

  return (
    <div style={s.app}>
      <div style={s.topbar}>
        <button style={s.backBtn} onClick={onBack}>→</button>
        <div style={s.topbarTitle}>פרויקט חדש</div>
      </div>
      <div style={s.body}>
        <div style={s.card}>
          <div style={s.lbl}>שם הפרויקט *</div>
          <input style={s.inp} placeholder="לדוגמה: מגדל סיטי — קומות 12–18" value={form.name} onChange={e=>update('name',e.target.value)} />
          <div style={s.lbl}>לקוח</div>
          <input style={s.inp} placeholder="שם הלקוח או החברה" value={form.client} onChange={e=>update('client',e.target.value)} />
          <div style={s.lbl}>מיקום</div>
          <input style={s.inp} placeholder="כתובת האתר" value={form.location} onChange={e=>update('location',e.target.value)} />
          <div style={s.lbl}>סטטוס</div>
          <select style={s.select} value={form.status} onChange={e=>update('status',e.target.value)}>
            <option value="planning">תכנון</option>
            <option value="active">פעיל</option>
            <option value="risk">סיכון</option>
            <option value="paused">מושהה</option>
            <option value="done">הושלם</option>
          </select>
          <div style={s.row}>
            <div>
              <div style={s.lbl}>תאריך התחלה</div>
              <input style={{...s.inp, marginBottom:0}} type="date" value={form.start_date} onChange={e=>update('start_date',e.target.value)} />
            </div>
            <div>
              <div style={s.lbl}>תאריך מסירה</div>
              <input style={{...s.inp, marginBottom:0}} type="date" value={form.end_date} onChange={e=>update('end_date',e.target.value)} />
            </div>
          </div>
        </div>
        <div style={s.card}>
          <div style={s.lbl}>הערות</div>
          <textarea style={s.textarea} placeholder="פרטים נוספים על הפרויקט..." value={form.notes} onChange={e=>update('notes',e.target.value)} rows={3} />
        </div>
        {error && <div style={s.err}>{error}</div>}
        <button style={s.saveBtn(loading)} onClick={handleSave} disabled={loading}>
          {loading ? 'שומר...' : '✓ שמור פרויקט'}
        </button>
      </div>
    </div>
  )
}