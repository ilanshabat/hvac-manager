import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { t } from '../lib/translations'

export default function SubcontractorLogin({ onLogin, lang = 'he' }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const tr = t[lang]

  const handleLogin = async () => {
    if (code.length !== 6) { setError(tr.codeLength); return }
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('access_code', code)
      .eq('role', 'subcontractor')
      .single()

    if (error || !data) {
      setError(tr.codeError)
    } else {
      onLogin(data)
    }
    setLoading(false)
  }

  const dir = tr.dir

  const s = {
    wrap: { minHeight:'100vh', background:'#F2EFE9', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Heebo, sans-serif', direction:dir, padding:'20px' },
    card: { width:'100%', maxWidth:'390px', background:'#fff', borderRadius:'24px', overflow:'hidden', border:'1px solid #E8E4DC' },
    hero: { background:'#2D4A3E', padding:'40px 24px 32px', textAlign:'center', position:'relative', overflow:'hidden' },
    heroCircle1: { position:'absolute', top:'-30px', left:'-30px', width:'140px', height:'140px', borderRadius:'50%', background:'rgba(255,255,255,0.04)' },
    heroCircle2: { position:'absolute', bottom:'-20px', right:'10px', width:'80px', height:'80px', borderRadius:'50%', background:'rgba(255,255,255,0.03)' },
    logo: { width:'64px', height:'64px', borderRadius:'20px', background:'rgba(255,255,255,0.18)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:'28px' },
    title: { fontSize:'22px', fontWeight:'600', color:'#fff', marginBottom:'6px' },
    sub: { fontSize:'13px', color:'rgba(255,255,255,0.7)', lineHeight:'1.6' },
    body: { padding:'28px 24px' },
    lbl: { fontSize:'13px', fontWeight:'600', color:'#1C2B20', marginBottom:'6px' },
    hint: { fontSize:'12px', color:'#9B9280', marginBottom:'16px' },
    inp: { width:'100%', border:'2px solid #E8E4DC', borderRadius:'14px', padding:'14px', fontSize:'22px', color:'#1C2B20', background:'#F9F7F4', fontFamily:'Heebo, sans-serif', letterSpacing:'8px', textAlign:'center', fontWeight:'600', boxSizing:'border-box', marginBottom:'8px' },
    err: { background:'#FDF0ED', border:'1px solid #F4C9B7', borderRadius:'10px', padding:'10px 14px', fontSize:'13px', color:'#C0392B', marginBottom:'16px', textAlign:'center' },
    btn: (l) => ({ width:'100%', padding:'14px', background: l ? '#9B9280' : '#2D4A3E', border:'none', borderRadius:'14px', color:'#fff', fontSize:'15px', fontWeight:'600', cursor: l ? 'default' : 'pointer', fontFamily:'Heebo, sans-serif', marginBottom:'16px' }),
    divider: { display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px' },
    dividerLine: { flex:1, height:'1px', background:'#E8E4DC' },
    dividerText: { fontSize:'12px', color:'#B5AFA6' },
    waBtn: { width:'100%', padding:'13px', background:'#E8F5EF', border:'1.5px solid #B7DCCA', borderRadius:'14px', color:'#2D4A3E', fontSize:'14px', fontWeight:'600', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', fontFamily:'Heebo, sans-serif' },
    help: { textAlign:'center', fontSize:'12px', color:'#9B9280', marginTop:'16px' },
    helpLink: { color:'#2D4A3E', fontWeight:'500' },
  }

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.hero}>
          <div style={s.heroCircle1}></div>
          <div style={s.heroCircle2}></div>
          <div style={s.logo}>🏗️</div>
          <div style={s.title}>{tr.welcome}</div>
          <div style={s.sub}>{tr.enterCode}</div>
        </div>
        <div style={s.body}>
          <div style={s.lbl}>{tr.accessCode}</div>
          <input
            style={s.inp}
            type="number"
            placeholder={tr.codePlaceholder}
            value={code}
            onChange={e => setCode(e.target.value.slice(0,6))}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            inputMode="numeric"
          />
          <div style={s.hint}>{tr.codeHint}</div>
          {error && <div style={s.err}>{error}</div>}
          <button style={s.btn(loading)} onClick={handleLogin} disabled={loading}>
            {loading ? tr.connecting : tr.login}
          </button>
          <div style={s.divider}>
            <div style={s.dividerLine}></div>
            <div style={s.dividerText}>{lang === 'ar' ? 'أو' : lang === 'en' ? 'or' : 'או'}</div>
            <div style={s.dividerLine}></div>
          </div>
          <button style={s.waBtn}>📱 {lang === 'ar' ? 'احصل على رمز عبر واتساب' : lang === 'en' ? 'Get code on WhatsApp' : 'קבל קוד בוואטסאפ'}</button>
          <div style={s.help}>
            {lang === 'ar' ? 'لم تتلقَ رمزاً؟' : lang === 'en' ? "Didn't receive a code?" : 'לא קיבלת קוד?'}{' '}
            <span style={s.helpLink}>{lang === 'ar' ? 'تواصل مع مدير المشروع' : lang === 'en' ? 'Contact your project manager' : 'פנה למנהל הפרויקט'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}