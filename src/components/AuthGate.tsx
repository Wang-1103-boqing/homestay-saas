import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { setDbUserId, migrateData } from '../lib/db'
import Login from '../pages/Login'
import App from '../App'

export default function AuthGate() {
  const [checking, setChecking] = useState(true)
  const { user, setAuth, clearAuth } = useAuthStore()

  useEffect(() => {
    const handleSession = async (session: typeof supabase.auth.getSession extends () => Promise<{ data: { session: infer S } }> ? S : never) => {
      if (session) {
        setAuth(session.user, session)
        setDbUserId(session.user.id)
        await migrateData(session.user.id)
      } else {
        clearAuth()
        setDbUserId(null)
      }
    }

    // getSession() 会清除 URL hash，所以必须在调用前先保存 recovery 状态
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const isRecovery = hashParams.get('type') === 'recovery'

    if (isRecovery) {
      // 密码重置流程：不调用 getSession()（避免清除 hash），
      // 保持未登录状态让 Login 组件自行处理重置页面
      setChecking(false)
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        handleSession(session).finally(() => setChecking(false))
      })
    }

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      // PASSWORD_RECOVERY 事件不触发登录态切换，由 Login 组件自行处理
      if (event === 'PASSWORD_RECOVERY') return
      // recovery 流程中 SIGNED_IN 也不应切换登录态
      if (isRecovery && event === 'SIGNED_IN') return
      handleSession(session)
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
