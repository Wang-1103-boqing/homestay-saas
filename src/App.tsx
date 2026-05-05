import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, Calendar, FileText, Home, DollarSign, Bell, LogOut } from 'lucide-react'
import { supabase } from './lib/supabase'
import { fetchAll } from './lib/db'
import { useStore } from './store/useStore'
import AddBooking from './pages/AddBooking'
import CalendarView from './pages/CalendarView'
import BookingList from './pages/BookingList'
import Properties from './pages/Properties'
import Revenue from './pages/Revenue'

type TabKey = 'add' | 'calendar' | 'bookings' | 'properties' | 'revenue'

const TABS: { key: TabKey; label: string; Icon: React.FC<{ size?: number; strokeWidth?: number; color?: string }> }[] = [
  { key: 'add',        label: '新增', Icon: Plus },
  { key: 'calendar',   label: '日历', Icon: Calendar },
  { key: 'bookings',   label: '记录', Icon: FileText },
  { key: 'properties', label: '房源', Icon: Home },
  { key: 'revenue',    label: '收益', Icon: DollarSign },
]

const PAGE_MAP: Record<TabKey, React.ReactNode> = {
  add:        <AddBooking />,
  calendar:   <CalendarView />,
  bookings:   <BookingList />,
  properties: <Properties />,
  revenue:    <Revenue />,
}

export default function App() {
  const [tab, setTab]         = useState<TabKey>('add')
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [realtimeOk, setRealtimeOk] = useState(true)
  const setAll = useStore((s) => s.setAll)
  const realtimeRetries = useRef(0)

  const reload = useCallback(async () => {
    try {
      const data = await fetchAll()
      setAll(data)
    } catch (e) {
      console.error('[db] fetchAll failed:', e)
      throw e
    }
  }, [setAll])

  useEffect(() => {
    reload()
      .then(() => setError(''))
      .catch(() => setError('数据加载失败，请检查网络后重试'))
      .finally(() => setLoading(false))
  }, [reload])

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null

    const connect = () => {
      channel = supabase
        .channel('db-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'properties' },   () => reload())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' },     () => reload())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' },     () => reload())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rent_history' }, () => reload())
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            setRealtimeOk(true)
            realtimeRetries.current = 0
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn('[realtime] connection issue, retry later:', err)
            setRealtimeOk(false)
            if (realtimeRetries.current < 3) {
              realtimeRetries.current++
              setTimeout(connect, 10_000 * realtimeRetries.current)
            }
          } else if (status === 'CLOSED') {
            setRealtimeOk(false)
          }
        })
    }

    connect()
    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [reload])

  // ── 加载中 ──
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
        <div style={{ fontSize: 9, letterSpacing: 3, color: 'var(--text-3)', textTransform: 'uppercase' }}>
          Homestay Manager
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 8 }}>正在连接数据库…</div>
      </div>
    )
  }

  // ── 连接失败 ──
  if (error) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', gap: 16, padding: 32,
      }}>
        <div style={{ fontSize: 17, color: 'var(--text-1)', textAlign: 'center', lineHeight: 1.6 }}>
          {error}
        </div>
        <button
          onClick={() => {
            setError('')
            setLoading(true)
            reload()
              .catch(() => setError('数据加载失败，请检查网络后重试'))
              .finally(() => setLoading(false))
          }}
          style={{
            height: 50, padding: '0 32px', borderRadius: 14, border: 'none',
            background: 'var(--green)', color: '#fff', fontSize: 16,
            fontWeight: 700, cursor: 'pointer',
          }}
        >
          重试
        </button>
      </div>
    )
  }

  // ── 正常界面 ──
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: 'var(--bg)' }}>
      {/* 顶部 Header */}
      <div style={{
        height: 'var(--header-h)', background: 'var(--bg)',
        display: 'flex', alignItems: 'flex-end', padding: '0 18px 10px',
        borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 100,
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--green2)', letterSpacing: 3, lineHeight: 1 }}>
            民宿管家
          </div>
          <div style={{ fontSize: 8, letterSpacing: 2.5, color: 'var(--text-3)', textTransform: 'uppercase', marginTop: 2 }}>
            Homestay Manager
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bell size={16} color="var(--text-3)" />
            <button
              onClick={() => supabase.auth.signOut()}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="退出登录"
            >
              <LogOut size={16} color="var(--text-3)" />
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, color: realtimeOk ? 'var(--green)' : 'var(--warm)' }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: realtimeOk ? 'var(--green)' : 'var(--warm)' }} />
            {realtimeOk ? '实时同步' : '离线模式'}
          </div>
        </div>
      </div>

      {/* 页面内容 */}
      <div style={{
        flex: 1, overflowY: 'auto',
        paddingBottom: 'calc(var(--tab-h) + env(safe-area-inset-bottom, 0px))',
      }}>
        {PAGE_MAP[tab]}
      </div>

      {/* 底部 TabBar */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 540,
        background: 'var(--card-bg)', borderTop: '1px solid var(--border)',
        display: 'flex',
        height: 'calc(var(--tab-h) + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        zIndex: 200,
        boxShadow: '0 -2px 12px rgba(0,0,0,0.06)',
      }}>
        {TABS.map((t) => {
          const active = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1, border: 'none', background: 'transparent',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', padding: '6px 0', gap: 4,
              }}
            >
              <t.Icon
                size={20}
                strokeWidth={active ? 2.2 : 1.8}
                color={active ? 'var(--green)' : 'var(--text-3)'}
              />
              <span style={{
                fontSize: 11,
                fontWeight: active ? 700 : 400,
                color: active ? 'var(--green)' : 'var(--text-3)',
              }}>
                {t.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
