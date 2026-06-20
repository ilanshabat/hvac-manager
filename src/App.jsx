import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { getLang, setLang } from './lib/translations'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import SubcontractorLogin from './pages/SubcontractorLogin'
import SubcontractorHome from './pages/SubcontractorHome'
import UserManagement from './pages/UserManagement'

function App() {
  const [user, setUser] = useState(null)
  const [dbUser, setDbUser] = useState(null)
  const [subUser, setSubUser] = useState(null)
  const [mode, setMode] = useState('manager')
  const [view, setView] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [lang, setLangState] = useState('he')

  useEffect(() => {
    const savedLang = getLang()
    if (savedLang) setLangState(savedLang)

    const savedSub = localStorage.getItem('subUser')
    if (savedSub) {
      setSubUser(JSON.parse(savedSub))
      setMode('subcontractor')
      setLoading(false)
      return
    }
    const savedManager = localStorage.getItem('managerUser')
    const savedDbUser = localStorage.getItem('managerDbUser')
    if (savedManager && savedDbUser) {
      setUser(JSON.parse(savedManager))
      setDbUser(JSON.parse(savedDbUser))
    }
    setLoading(false)
  }, [])

  const handleLangChange = (l) => {
    setLang(l)
    setLangState(l)
  }

  const handleLogin = async (authUser) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('email', authUser.email)
      .single()
    setUser(authUser)
    setDbUser(data || null)
    localStorage.setItem('managerUser', JSON.stringify(authUser))
    localStorage.setItem('managerDbUser', JSON.stringify(data || null))
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setDbUser(null)
    setView('dashboard')
    localStorage.removeItem('managerUser')
    localStorage.removeItem('managerDbUser')
  }

  const handleSubLogin = (sub) => {
    localStorage.setItem('subUser', JSON.stringify(sub))
    setSubUser(sub)
    setMode('subcontractor')
  }

  const handleSubLogout = () => {
    localStorage.removeItem('subUser')
    setSubUser(null)
    setMode('manager')
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#F2EFE9', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Heebo, sans-serif', fontSize:'16px', color:'#2D4A3E' }}>
      טוען...
    </div>
  )

  if (mode === 'subcontractor') {
    if (!subUser) return <SubcontractorLogin onLogin={handleSubLogin} lang={lang} onLangChange={handleLangChange} />
    return <SubcontractorHome subUser={subUser} onLogout={handleSubLogout} lang={lang} />
  }

  if (!user) return (
    <div>
      <Login onLogin={handleLogin} lang={lang} onLangChange={handleLangChange} />
      <div style={{ textAlign:'center', marginTop:'-20px', paddingBottom:'20px', fontFamily:'Heebo, sans-serif' }}>
        <button
          onClick={() => setMode('subcontractor')}
          style={{ background:'none', border:'none', color:'#2D4A3E', fontSize:'13px', cursor:'pointer', textDecoration:'underline' }}
        >
          {lang === 'he' ? 'כניסה כקבלן משנה' : lang === 'ar' ? 'دخول كمقاول' : 'Login as subcontractor'}
        </button>
      </div>
    </div>
  )

  if (dbUser?.role === 'super_admin') {
    if (view === 'users') return <UserManagement dbUser={dbUser} onBack={() => setView('dashboard')} lang={lang} />
    return <Dashboard user={user} dbUser={dbUser} onLogout={handleLogout} onManageUsers={() => setView('users')} lang={lang} />
  }

  return <Dashboard user={user} dbUser={dbUser} onLogout={handleLogout} lang={lang} />
}

export default App