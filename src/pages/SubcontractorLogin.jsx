import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function SubcontractorLogin({ onLogin }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (code.length !== 6) { setError('הקוד חייב להיות בן 6 ספרות'); return }
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('access_code', code)
      .eq('role', 'subcontractor')
      .single()

    if (error || !data) {
      setError('קוד לא נמצא — בדוק שוב')
    } else {
      const expires = new Date(data.code_expires_at)
      if (expires < new Date()) {
        setError('הקוד פג תוקף — בקש קוד חדש מהמנהל')
      } else {
        onLogin(data)
      }
    }
    setLoading(false)
  }

  const s = {
    wrap: { minHeight:'100vh', background:'#F2EFE9', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Heebo, sans-serif', direction:'rtl', padding:'20px' },
    card: { width:'100%', maxWidth:'390px', background:'#fff', borderRadius:'24px', overflow:'hidden', border:'1px solid #E8E4DC' },
    hero: { background:'#2D4A3E', padding:'40px 24px 32px', textAlign:'center', position:'relative', overflow:'hidden' },
    heroCircle1: { position:'absolute', top:'-30px', left:'-30px', width:'140px', height:'140px', borderRadius:'50%', background:'rgba(255,255,255,0.04)' },
    heroCircle2: { position:'absolute', bottom:'-20px', right:'10px', width:'80px', height:'80px', borderRadius:'50%', background:'rgba(255,255,255,0.03)' },
    logo: { width:'64px', height:'64px', borderRadius:'20px', background:'rgba(255,255,255,0.18)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:'28px', position:'relative' },
    title: { fontSize:'22px', fontWeight:'600', color:'#fff', marginBottom:'6px' },
    sub: { fontSize:'13px', color:'rgba(255,255,255,0.7)', lineHeight:'1.6' },
    steps: { display:'flex', gap:'6px', justifyContent:'center', paddingTop:'16px' },
    step: (done) => ({ width:'28px', height:'4px', borderRadius:'2px', background: done ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.2)' }),
    body: { padding:'28px 24px' },
    lbl: { fontSize:'13px', fontWeight:'600', color:'#1C2B20', marginBottom:'6px' },
    hint: { fontSize:'12px', color:'#9B9280', marginBottom:'16px' },
    inp: { width:'100%', border:'2px solid #E8E4DC', borderRadius:'14px', padding:'14px', fontSize:'22px', color:'#1C2B20', background:'#F9F7F4', fontFamily:'Heebo, sans-serif', letterSpacing:'8px', textAlign:'center', fontWeight:'600', boxSizing:'border-box', marginBottom:'8px' },
    err: { background:'#FDF0ED', border:'1px solid #F4C9B7', borderRadius:'10px', padding:'10px 14px', fontSize:'13px', color:'#C0392B', marginBottom:'16px', textAlign:'center' },
    btn: (loading) => ({ width:'100%', padding:'14px', background: loading ? '#9B9280' : '#2D4A3E', border:'none', borderRadius:'14px', color:'#fff', fontSize:'15px', fontWeight:'600', cursor: loading ? 'default' : 'pointer', fontFamily:'Heebo, sans-serif', marginBottom:'16px' }),
    divider: { display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px' },
    dividerLine: { flex:1, height:'1px', background:'#E8E4DC' },
    dividerText: { fontSize:'12px', color:'#B5AFA6' },
    waBtn: { width:'100%', padding:'13px', background:'#E8F5EF', border:'1.5px solid #B7DCCA', borderRadius:'14px', color:'#2D4A3E', fontSize:'14px', fontWeight:'600', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', fontFamily:'Heebo, sans-serif' },
    help: { textAlign:'center', fontSize:'12px', color:'#9B9280', marginTop:'16px' },
    helpLink: { color:'#2D4A3E', fontWeight:'500', cursor:'pointer' },
  }

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.hero}>
          <div style={s.heroCircle1}></div>
          <div style={s.heroCircle2}></div>
          <div style={s.logo}>🏗️</div>
          <div style={s.title}>ברוך הבא</div>
          <div style={s.sub}>הזן את קוד הגישה שקיבלת ממנהל הפרויקט</div>
          <div style={s.steps}>
            <div style={s.step(true)}></div>
            <div style={s.step(true)}></div>
            <div style={s.step(false)}></div>
          </div>
        </div>
        <div style={s.body}>
          <div style={s.lbl}>קוד גישה אישי</div>
          <input
            style={s.inp}
            type="number"
            maxLength={6}
            placeholder="· · · · · ·"
            value={code}
            onChange={e => setCode(e.target.value.slice(0,6))}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            inputMode="numeric"
          />
          <div style={s.hint}>קוד בן 6 ספרות — תקף ל-48 שעות</div>
          {error && <div style={s.err}>{error}</div>}
          <button style={s.btn(loading)} onClick={handleLogin} disabled={loading}>
            {loading ? 'מתחבר...' : 'כניסה למערכת'}
          </button>
          <div style={s.divider}>
            <div style={s.dividerLine}></div>
            <div style={s.dividerText}>או</div>
            <div style={s.dividerLine}></div>
          </div>
          <button style={s.waBtn}>
            📱 קבל קוד חדש בוואטסאפ
          </button>
          <div style={s.help}>
            לא קיבלת קוד? <span style={s.helpLink}>פנה למנהל הפרויקט</span>
          </div>
        </div>
      </div>
    </div>
  )
}