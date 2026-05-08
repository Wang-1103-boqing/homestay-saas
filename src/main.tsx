import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AuthGate from './components/AuthGate'
import ResetPassword from './pages/ResetPassword'
import './index.css'

const path = window.location.pathname
const urlParams = new URLSearchParams(window.location.search)
const isResetPassword = path === '/homestay-saas/reset-password' || urlParams.get('flow') === 'recovery'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isResetPassword ? <ResetPassword /> : <AuthGate />}
  </StrictMode>,
)
