import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AuthGate from './components/AuthGate'
import ResetPassword from './pages/ResetPassword'
import './index.css'

const path = window.location.pathname
const isResetPassword = path === '/homestay-saas/reset-password'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isResetPassword ? <ResetPassword /> : <AuthGate />}
  </StrictMode>,
)
