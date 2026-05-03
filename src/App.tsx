import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from './lib/supabase'
import { fetchAll } from './lib/db'
import { useStore } from './store/useStore'
import AddBooking from './pages/AddBooking'
import CalendarView from './pages/CalendarView'
import BookingList from './pages/BookingList'
import Properties from './pages/Properties'
import Revenue from './pages/Revenue'

type TabKey = 'add' | 'calendar' | 'bookings' | 'properties' | 'revenue'

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'add',        label: '新增预订', icon: '➕' },
  { key: 'calendar',   label: '排期日历', icon: '📅' },
  { key: 'bookings',   label: '预订记录', icon: '📋' },
  { key: 'properties', label: '房源管理', icon: '🏠' },
  { key: 'revenue',    label: '收益明细', icon: '💰' },
]

const PAGE_MAP: Record<TabKey, React.ReactNode> = {
  add:        <AddBooking />,
  calendar:   <CalendarView />,
  bookings:   <BookingList />,
  properties: <Properties />,
  revenue:    <Revenue />,
}

export default function App() {
  const [tab, setTab]       = useState<TabKey>('add')
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')
  const [realtimeOk, setRealtimeOk] = useState(true)   // Realtime 连接状态
  const setAll = useStore((s) => s.setAll)
  const realtimeRetries = useRef(0)

  // ── 从 Supabase 拉取全部数据 ──────────────────────────────
  const reload = useCallback(async () => {
    try {
      const data = await fetchAll()
      setAll(data)
    } catch (e) {
      console.error('[db] fetchAll failed:', e)
      throw e
    }
  }, [setAll])

  // ── 首次加载 ──────────────────────────────────────────────
  useEffect(() => {
    reload()
      .then(() => setError(''))
      .catch(() => setError('数据加载失败，请检查网络后重试'))
      .finally(() => setLoading(false))
  }, [reload])

  // ── Realtime 实时订阅（国内可能不稳定，失败不影响主功能）────
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
            // 最多重连 3 次，之后静默降级（REST 数据仍然正常）
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

  // ── 加载中 ──────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#f5f5f5', gap: 16,
      }}>
        <div style={{ fontSize: 48 }}>🏠</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>民宿管家</div>
        <div style={{ fontSize: 15, color: '#8c8c8c' }}>正在连接数据库…</div>
      </div>
    )
  }

  // ── 连接失败 ────────────────────────────────────────────
  if (error) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#f5f5f5', gap: 16, padding: 32,
      }}>
        <div style={{ fontSize: 48 }}>⚠️</div>
        <div style={{ fontSize: 17, color: '#ff4d4f', textAlign: 'center', lineHeight: 1.6 }}>
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
            background: '#1677ff', color: '#fff', fontSize: 18,
            fontWeight: 700, cursor: 'pointer',
          }}
        >
          重试
        </button>
      </div>
    )
  }

  // ── 正常界面 ────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#f5f5f5' }}>
      {/* 顶部 Header */}
      <div style={{
        height: 'var(--header-h)', background: '#fff',
        display: 'flex', alignItems: 'center', padding: '0 20px',
        borderBottom: '1px solid #f0f0f0',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <span style={{ fontSize: 22, marginRight: 8 }}>🏠</span>
        <span style={{ fontSize: 19, fontWeight: 800, color: '#1a1a1a', letterSpacing: 1 }}>
          民宿管家
        </span>
        {/* 实时连接状态 */}
        <div style={{
          marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5,
          fontSize: 12, color: realtimeOk ? '#52c41a' : '#fa8c16',
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: realtimeOk ? '#52c41a' : '#fa8c16',
          }} />
          {realtimeOk ? '实时同步' : '离线模式'}
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
        background: '#fff', borderTop: '1px solid #f0f0f0',
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
                cursor: 'pointer', padding: '6px 0', gap: 3,
                position: 'relative',
              }}
            >
              {active && (
                <div style={{
                  position: 'absolute', top: 0, width: 32, height: 3,
                  background: '#1677ff', borderRadius: '0 0 4px 4px',
                }} />
              )}
              <span style={{ fontSize: 20 }}>{t.icon}</span>
              <span style={{
                fontSize: 11,
                fontWeight: active ? 700 : 400,
                color: active ? '#1677ff' : '#8c8c8c',
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
