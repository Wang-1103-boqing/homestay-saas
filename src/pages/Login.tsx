import { useState, useEffect } from 'react'
import { Button, Input, message } from 'antd'
import { supabase } from '../lib/supabase'

type Mode = 'login' | 'register' | 'forgot' | 'reset'

function parseHash(hash: string) {
  const params = new URLSearchParams(hash.replace(/^#/, ''))
  const entries: Record<string, string> = {}
  params.forEach((v, k) => { entries[k] = v })
  return entries
}

export default function Login() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // 方法1：解析 URL hash 中的 recovery token（Supabase 重定向后带 #type=recovery）
    const hash = parseHash(window.location.hash)
    if (hash.type === 'recovery' && hash.access_token && hash.refresh_token) {
      setLoading(true)
      supabase.auth.setSession({
        access_token: hash.access_token,
        refresh_token: hash.refresh_token,
      }).then(({ error }) => {
        setLoading(false)
        if (error) {
          message.error('重置链接已过期或无效')
          return
        }
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
        setMode('reset')
      })
      return
    }

    // 方法2：监听 PASSWORD_RECOVERY 事件（作为备用保障）
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
        setMode('reset')
      }
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)

  const handleLogin = async () => {
    if (!email.trim()) { message.error('请输入邮箱'); return }
    if (!validateEmail(email)) { message.error('邮箱格式不正确'); return }
    if (!password) { message.error('请输入密码'); return }

    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    setLoading(false)

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        message.error('邮箱或密码错误')
      } else if (error.message.includes('Email not confirmed')) {
        message.error('邮箱未确认，请查收邮件并点击确认链接')
      } else {
        message.error(error.message)
      }
      return
    }

    message.success('登录成功')
  }

  const handleRegister = async () => {
    if (!email.trim()) { message.error('请输入邮箱'); return }
    if (!validateEmail(email)) { message.error('邮箱格式不正确'); return }
    if (!password) { message.error('请输入密码'); return }
    if (password.length < 6) { message.error('密码至少 6 位'); return }
    if (password !== confirmPassword) { message.error('两次输入的密码不一致'); return }

    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    })
    setLoading(false)

    if (error) {
      if (error.message.includes('already registered') || error.message.includes('User already registered')) {
        message.error('该邮箱已注册')
      } else {
        message.error(error.message)
      }
      return
    }

    message.success('注册成功，请查收确认邮件后登录')
    setMode('login')
    setPassword('')
    setConfirmPassword('')
  }

  const handleForgot = async () => {
    if (!email.trim()) { message.error('请输入邮箱'); return }
    if (!validateEmail(email)) { message.error('邮箱格式不正确'); return }

    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/?flow=recovery`,
    })
    setLoading(false)

    if (error) {
      message.error(error.message)
      return
    }

    message.success('重置密码邮件已发送，请查收')
  }

  const handleReset = async () => {
    if (!newPassword) { message.error('请输入新密码'); return }
    if (newPassword.length < 6) { message.error('密码至少 6 位'); return }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setLoading(false)

    if (error) {
      message.error(error.message)
      return
    }

    message.success('密码重置成功，请用新密码登录')
    setNewPassword('')
    setMode('login')
  }

  const titleMap: Record<Mode, string> = {
    login: '欢迎回来',
    register: '注册账号',
    forgot: '找回密码',
    reset: '设置新密码',
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: 24,
      gap: 24,
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--green2)', letterSpacing: 3 }}>
          民宿管家
        </div>
        <div style={{ fontSize: 9, letterSpacing: 3, color: 'var(--text-3)', textTransform: 'uppercase', marginTop: 2 }}>
          Homestay Manager
        </div>
      </div>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: 360,
        background: 'var(--card-bg)',
        borderRadius: 'var(--radius)',
        padding: '28px 24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      }}>
        <div style={{
          fontSize: 18,
          fontWeight: 700,
          color: 'var(--text-1)',
          marginBottom: 24,
          textAlign: 'center',
        }}>
          {titleMap[mode]}
        </div>

        {/* Email */}
        {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
          <div style={{ marginBottom: mode === 'forgot' ? 24 : 16 }}>
            <label style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, marginBottom: 5, display: 'block', letterSpacing: 0.5 }}>
              邮箱
            </label>
            <Input
              size="large"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="off"
              autoCorrect="off"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ borderRadius: 12 }}
            />
          </div>
        )}

        {/* Password */}
        {(mode === 'login' || mode === 'register') && (
          <div style={{ marginBottom: mode === 'register' ? 16 : 24 }}>
            <label style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, marginBottom: 5, display: 'block', letterSpacing: 0.5 }}>
              密码
            </label>
            <Input.Password
              size="large"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ borderRadius: 12 }}
            />
          </div>
        )}

        {/* Confirm Password (register only) */}
        {mode === 'register' && (
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, marginBottom: 5, display: 'block', letterSpacing: 0.5 }}>
              确认密码
            </label>
            <Input.Password
              size="large"
              placeholder="再次输入密码"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ borderRadius: 12 }}
            />
          </div>
        )}

        {/* New Password (reset only) */}
        {mode === 'reset' && (
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, marginBottom: 5, display: 'block', letterSpacing: 0.5 }}>
              新密码
            </label>
            <Input.Password
              size="large"
              placeholder="请输入新密码"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ borderRadius: 12 }}
            />
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="primary"
          size="large"
          loading={loading}
          onClick={
            mode === 'register' ? handleRegister :
            mode === 'forgot' ? handleForgot :
            mode === 'reset' ? handleReset :
            handleLogin
          }
          block
          style={{
            height: 52,
            borderRadius: 12,
            background: 'var(--green)',
            borderColor: 'var(--green)',
            fontSize: 17,
            fontWeight: 700,
          }}
        >
          {mode === 'register' ? '注册' :
           mode === 'forgot' ? '发送重置邮件' :
           mode === 'reset' ? '确认重置' :
           '登录'}
        </Button>

        {/* Toggle */}
        <div style={{
          marginTop: 20,
          textAlign: 'center',
          fontSize: 14,
          color: 'var(--text-2)',
        }}>
          {mode === 'login' && (
            <>
              <div style={{ marginBottom: 8 }}>
                <button
                  onClick={() => setMode('forgot')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-3)',
                    fontSize: 13,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  忘记密码？
                </button>
              </div>
              <span>
                还没有账号？
                <button
                  onClick={() => { setMode('register'); setPassword(''); setConfirmPassword('') }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--green)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: 14,
                    padding: 0,
                  }}
                >
                  去注册
                </button>
              </span>
            </>
          )}

          {mode === 'register' && (
            <span>
              已有账号？
              <button
                onClick={() => { setMode('login'); setPassword(''); setConfirmPassword('') }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--green)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14,
                  padding: 0,
                }}
              >
                去登录
              </button>
            </span>
          )}

          {mode === 'forgot' && (
            <span>
              想起密码了？
              <button
                onClick={() => setMode('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--green)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14,
                  padding: 0,
                }}
              >
                去登录
              </button>
            </span>
          )}

          {mode === 'reset' && (
            <span>
              <button
                onClick={() => setMode('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--green)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14,
                  padding: 0,
                }}
              >
                返回登录
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
