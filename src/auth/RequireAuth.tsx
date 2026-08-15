import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from './AuthProvider'
import { Splash } from '../screens/Splash'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, ready } = useAuth()
  const loc = useLocation()
  if (!ready) return <Splash />
  if (!session) return <Navigate to="/signin" replace state={{ from: loc.pathname }} />
  return <>{children}</>
}
