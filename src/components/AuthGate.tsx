import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import Login from '../pages/Login'
import App from '../App'

export default function AuthGate() {
  const [checking, setChecking] = useState(true)
  const { user, setAuth, clearAuth } = useAuthStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setAuth(session.user, session)
      } else {
        clearAuth()
      }
      setChecking(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setAuth(session.user, session)
      } else {
        clearAuth()
      }
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [setAuth, clearAuth])

  if (checking) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', gap: 14,
      }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--green2)', letterSpacing: 3 }}>
          民宿管家
        </div>
        <div style={{ fontSize: 9, letterSpacing: 3, color: 'var(--text-3)', textTransform: 'uppercase' }}>
          Homestay Manager
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 8 }}>正在检查登录状态…</div>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return <App />
}
