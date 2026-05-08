import { useState, useEffect } from 'react'
import { Button, Input, message } from 'antd'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    // PKCE flow（Supabase v2 默认）：链接带 ?code=xxx
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        setLoading(false)
        if (error) {
          message.error('重置链接已过期或无效')
          return
        }
        window.history.replaceState(null, '', window.location.pathname)
      })
      return
    }

    // 隐式流程（旧版）：链接带 #access_token=...&type=recovery
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const access_token = hash.get('access_token')
    const refresh_token = hash.get('refresh_token')
    const type = hash.get('type')

    if (type === 'recovery' && access_token && refresh_token) {
      supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
        setLoading(false)
        if (error) {
          message.error('重置链接已过期或无效')
          return
        }
        window.history.replaceState(null, '', window.location.pathname)
      })
    } else {
      setLoading(false)
      message.error('无效的重置链接')
    }
  }, [])

  const handleReset = async () => {
    if (!newPassword) { message.error('请输入新密码'); return }
    if (newPassword.length < 6) { message.error('密码至少 6 位'); return }
    if (newPassword !== confirmPassword) { message.error('两次输入的密码不一致'); return }

    setVerifying(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setVerifying(false)

    if (error) {
      message.error(error.message)
      return
    }

    message.success('密码重置成功，请用新密码登录')
    setTimeout(() => {
      window.location.href = '/'
    }, 1500)
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', gap: 14,
      }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--green2)', letterSpacing: 3 }}>
          民宿管家
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-3)' }}>正在验证重置链接…</div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center',
      background: 'var(--bg)',
      padding: '15vh 24px 24px',
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
        width: '100%', maxWidth: 360,
        background: 'var(--card-bg)',
        borderRadius: 'var(--radius)',
        padding: '28px 24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      }}>
        <div style={{
          fontSize: 18, fontWeight: 700,
          color: 'var(--text-1)',
          marginBottom: 24, textAlign: 'center',
        }}>
          设置新密码
        </div>

        <div style={{ marginBottom: 16 }}>
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

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, marginBottom: 5, display: 'block', letterSpacing: 0.5 }}>
            确认密码
          </label>
          <Input.Password
            size="large"
            placeholder="再次输入新密码"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{ borderRadius: 12 }}
          />
        </div>

        <Button
          type="primary"
          size="large"
          loading={verifying}
          onClick={handleReset}
          block
          style={{
            height: 52, borderRadius: 12,
            background: 'var(--green)',
            borderColor: 'var(--green)',
            fontSize: 17, fontWeight: 700,
          }}
        >
          确认重置
        </Button>
      </div>
    </div>
  )
}
