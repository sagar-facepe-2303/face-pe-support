import { Navigate } from 'react-router-dom'
import { useAppSelector } from '../app/hooks'
import { ROUTES } from '../core/config/routes'
import { getDefaultRouteForRole } from '../core/constants/roles'

export function RoleHomeRedirect() {
  const role = useAppSelector((s) => s.auth.user?.role)
  const target = getDefaultRouteForRole(role)

  if (target === ROUTES.LOGIN) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  return <Navigate to={target} replace />
}
