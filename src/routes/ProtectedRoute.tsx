import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAppSelector } from '../app/hooks'
import { ROUTES } from '../core/config/routes'
import type { Role } from '../core/constants/roles'
import { hasRole } from '../core/constants/roles'

interface ProtectedRouteProps {
  allowedRoles?: readonly Role[]
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const location = useLocation()
  const token = useAppSelector((s) => s.auth.token)
  const role = useAppSelector((s) => s.auth.user?.role)

  if (!token) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />
  }

  if (allowedRoles?.length && !hasRole(role, allowedRoles)) {
    return <Navigate to={ROUTES.HOME} replace />
  }

  return <Outlet />
}
