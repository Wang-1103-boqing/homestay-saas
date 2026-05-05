import { useState } from 'react'
import { Button, Input, message } from 'antd'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

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

    message.success('注册成功，请登录')
    setIsRegister(false)
    setPassword('')
    setConfirmPassword('')
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
          {isRegister ? '注册账号' : '欢迎回来'}
        </div>

        {/* Email */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, marginBottom: 5, display: 'block', letterSpacing: 0.5 }}>
            邮箱
          </label>
          <Input
            size="large"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ borderRadius: 12 }}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: isRegister ? 16 : 24 }}>
          <label style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, marginBottom: 5, display: 'block', letterSpacing: 0.5 }}>
            密码
          </label>
          <Input.Password
            size="large"
            placeholder="请输入密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ borderRadius: 12 }}
          />
        </div>

        {/* Confirm Password (register only) */}
        {isRegister && (
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

        {/* Submit Button */}
        <Button
          type="primary"
          size="large"
          loading={loading}
          onClick={isRegister ? handleRegister : handleLogin}
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
          {isRegister ? '注册' : '登录'}
        </Button>

        {/* Toggle */}
        <div style={{
          marginTop: 20,
          textAlign: 'center',
          fontSize: 14,
          color: 'var(--text-2)',
        }}>
          {isRegister ? (
            <span>
              已有账号？
              <button
                onClick={() => { setIsRegister(false); setPassword(''); setConfirmPassword('') }}
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
          ) : (
            <span>
              还没有账号？
              <button
                onClick={() => { setIsRegister(true); setPassword(''); setConfirmPassword('') }}
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
          )}
        </div>
      </div>
    </div>
  )
}
