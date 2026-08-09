import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from './AuthProvider'
import { Spinner } from '../components/Spinner'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, ready } = useAuth()
  const loc = useLocation()
  if (!ready) return <Spinner full />
  if (!session) return <Navigate to="/signin" replace state={{ from: loc.pathname }} />
  return <>{children}</>
}
