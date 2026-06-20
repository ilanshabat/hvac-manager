import { setLang } from '../lib/translations'

export default function LanguageSelect({ onSelect }) {
  const choose = (lang) => {
    setLang(lang)
    onSelect(lang)
  }

  const s = {
    wrap: { minHeight:'100vh', background:'#F2EFE9', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Heebo, sans-serif', padding:'20px' },
    card: { width:'100%', maxWidth:'100%', background:'#fff', borderRadius:'24px', overflow:'hidden', border:'1px solid #E8E4DC' },
    hero: { background:'#2D4A3E', padding:'40px 24px 32px', textAlign:'center' },
    logo: { width:'72px', height:'72px', borderRadius:'22px', background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:'32px' },
    appName: { fontSize:'24px', fontWeight:'600', color:'#fff', marginBottom:'6px' },
    appSub: { fontSize:'13px', color:'rgba(255,255,255,0.6)' },
    body: { padding:'28px 24px' },
    title: { fontSize:'15px', fontWeight:'600', color:'#1C2B20', textAlign:'center', marginBottom:'20px' },
    langBtn: (active) => ({
      width:'100%', padding:'16px', background: active ? '#2D4A3E' : '#F9F7F4',
      border: active ? 'none' : '1.5px solid #E8E4DC',
      borderRadius:'16px', marginBottom:'10px', cursor:'pointer',
      display:'flex', alignItems:'center', gap:'14px', fontFamily:'Heebo, sans-serif'
    }),
    flag: { fontSize:'28px', flexShrink:0 },
    langInfo: { flex:1, textAlign:'right' },
    langName: (active) => ({ fontSize:'16px', fontWeight:'600', color: active ? '#fff' : '#1C2B20', marginBottom:'2px' }),
    langSub: (active) => ({ fontSize:'12px', color: active ? 'rgba(255,255,255,0.7)' : '#9B9280' }),
    check: { fontSize:'18px', color:'#fff' },
  }

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.hero}>
          <div style={s.logo}>🏗️</div>
          <div style={s.appName}>FieldOps</div>
          <div style={s.appSub}>Project Management</div>
        </div>
        <div style={s.body}>
          <div style={s.title}>
            בחר שפה / Choose language / اختر اللغة
          </div>
          <button style={s.langBtn(false)} onClick={()=>choose('he')}>
            <div style={s.flag}>🇮🇱</div>
            <div style={s.langInfo}>
              <div style={s.langName(false)}>עברית</div>
              <div style={s.langSub(false)}>Hebrew</div>
            </div>
          </button>
          <button style={s.langBtn(false)} onClick={()=>choose('en')}>
            <div style={s.flag}>🇺🇸</div>
            <div style={s.langInfo}>
              <div style={s.langName(false)}>English</div>
              <div style={s.langSub(false)}>אנגלית</div>
            </div>
          </button>
          <button style={s.langBtn(false)} onClick={()=>choose('ar')}>
            <div style={s.flag}>🇸🇦</div>
            <div style={s.langInfo}>
              <div style={s.langName(false)}>العربية</div>
              <div style={s.langSub(false)}>ערבית</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
