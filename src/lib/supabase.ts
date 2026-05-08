import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  global: {
    // 国内访问 Supabase REST API 超时设为 15s（默认无限制）
    fetch: (input, init) => {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 15_000)
      return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer))
    },
  },
  realtime: {
    // WebSocket 心跳间隔拉长，减少因国内网络抖动导致的断连重试
    heartbeatIntervalMs: 30_000,
    reconnectAfterMs: (tries: number) => Math.min(1_000 * 2 ** tries, 30_000),
    timeout: 20_000,
  },
})
