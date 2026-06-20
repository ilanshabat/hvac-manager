import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { t, setLang } from '../lib/translations'

export default function Login({ onLogin, lang: initialLang = 'he', onLangChange }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lang, setLangState] = useState(initialLang)
  const tr = t[lang]
  const dir = tr.dir

  const changeLang = (l) => {
    setLang(l)
    setLangState(l)
    if (onLangChange) onLangChange(l)
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(lang==='ar' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : lang==='en' ? 'Invalid email or password' : 'אימייל או סיסמה שגויים')
    } else {
      onLogin(data.user)
    }
    setLoading(false)
  }

  const s = {
    wrap: { minHeight:'100vh', background:'#F2EFE9', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Heebo, sans-serif', direction:dir, padding:'20px' },
    card: { width:'100%', maxWidth:'100%', background:'#fff', borderRadius:'24px', overflow:'hidden', border:'1px solid #E8E4DC' },
    hero: { background:'#2D4A3E', padding:'40px 24px 32px', textAlign:'center', position:'relative' },
    langRow: { display:'flex', justifyContent:'center', gap:'8px', marginBottom:'20px' },
    langPill: (active) => ({ padding:'5px 12px', borderRadius:'20px', border: active ? 'none' : '1px solid rgba(255,255,255,0.3)', background: active ? 'rgba(255,255,255,0.25)' : 'transparent', color:'#fff', fontSize:'12px', fontWeight: active ? '600' : '400', cursor:'pointer', fontFamily:'Heebo, sans-serif' }),
    logo: { width:'64px', height:'64px', borderRadius:'20px', background:'rgba(255,255,255,0.18)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:'28px' },
    title: { fontSize:'22px', fontWeight:'600', color:'#fff', marginBottom:'6px' },
    sub: { fontSize:'13px', color:'rgba(255,255,255,0.7)' },
    body: { padding:'28px 24px' },
    lbl: { fontSize:'13px', fontWeight:'600', color:'#6B6457', marginBottom:'6px' },
    inp: { width:'100%', border:'1.5px solid #E8E4DC', borderRadius:'12px', padding:'12px 14px', fontSize:'14px', color:'#1C2B20', background:'#F9F7F4', fontFamily:'Heebo, sans-serif', boxSizing:'border-box', direction:'ltr', marginBottom:'16px' },
    err: { background:'#FDF0ED', border:'1px solid #F4C9B7', borderRadius:'10px', padding:'10px 14px', fontSize:'13px', color:'#C0392B', marginBottom:'16px', textAlign:'center' },
    btn: (l) => ({ width:'100%', padding:'14px', background: l ? '#9B9280' : '#2D4A3E', border:'none', borderRadius:'14px', color:'#fff', fontSize:'15px', fontWeight:'600', cursor: l ? 'default' : 'pointer', fontFamily:'Heebo, sans-serif' }),
  }

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.hero}>
          <div style={s.langRow}>
            <button style={s.langPill(lang==='he')} onClick={()=>changeLang('he')}>🇮🇱 עב</button>
            <button style={s.langPill(lang==='en')} onClick={()=>changeLang('en')}>🇺🇸 EN</button>
            <button style={s.langPill(lang==='ar')} onClick={()=>changeLang('ar')}>🇸🇦 عر</button>
          </div>
          <div style={s.logo}>🏗️</div>
          <div style={s.title}>{tr.welcome}</div>
          <div style={s.sub}>FieldOps — {lang==='ar'?'إدارة مشاريع البناء':lang==='en'?'Construction Project Management':'ניהול פרויקטי ביצוע'}</div>
        </div>
        <div style={s.body}>
          <form onSubmit={handleLogin}>
            <div style={s.lbl}>{lang==='ar'?'البريد الإلكتروني':lang==='en'?'Email':'אימייל'}</div>
            <input style={s.inp} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" required />
            <div style={s.lbl}>{lang==='ar'?'كلمة المرور':lang==='en'?'Password':'סיסמה'}</div>
            <input style={s.inp} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required />
            {error && <div style={s.err}>{error}</div>}
            <button style={s.btn(loading)} type="submit" disabled={loading}>
              {loading ? tr.connecting : tr.login}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
