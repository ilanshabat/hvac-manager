import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import SubcontractorLogin from './pages/SubcontractorLogin'
import SubcontractorHome from './pages/SubcontractorHome'

function App() {
  const [user, setUser] = useState(null)
  const [subUser, setSubUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('manager') // 'manager' or 'subcontractor'

  useEffect(() => {
    // בדוק אם יש קבלן שמור
    const savedSub = localStorage.getItem('subUser')
    if (savedSub) {
      setSubUser(JSON.parse(savedSub))
      setMode('subcontractor')
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
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

  // מצב קבלן
  if (mode === 'subcontractor') {
    if (!subUser) return <SubcontractorLogin onLogin={handleSubLogin} />
    return <SubcontractorHome subUser={subUser} onLogout={handleSubLogout} />
  }

  // מצב מנהל
  if (!user) return (
    <div>
      <Login onLogin={setUser} />
      <div style={{ textAlign:'center', marginTop:'-20px', paddingBottom:'20px', fontFamily:'Heebo, sans-serif' }}>
        <button
          onClick={() => setMode('subcontractor')}
          style={{ background:'none', border:'none', color:'#2D4A3E', fontSize:'13px', cursor:'pointer', textDecoration:'underline' }}
        >
          כניסה כקבלן משנה
        </button>
      </div>
    </div>
  )

  return <Dashboard user={user} onLogout={handleLogout} />
}

export default App