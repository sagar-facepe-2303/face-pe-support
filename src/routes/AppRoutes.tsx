import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { MainLayout } from '../layout/MainLayout'
import { ROUTES } from '../core/config/routes'
import { ROLES } from '../core/constants/roles'
import { ProtectedRoute } from './ProtectedRoute'
import { RoleHomeRedirect } from './RoleHomeRedirect'

import { Login } from '../features/auth/pages/Login'
import { Users as SupportTeamPage } from '../features/supportTeam/pages/Users'
import { CreateSupportAdmin } from '../features/supportTeam/pages/CreateSupportAdmin'
import { MerchantList } from '../features/merchants/pages/MerchantList'
import { MerchantDetails } from '../features/merchants/pages/MerchantDetails'
import { KioskList } from '../features/kiosks/pages/KioskList'
import { KioskDetails } from '../features/kiosks/pages/KioskDetails'
import { UserList } from '../features/users/pages/UserList'
import { UserDetails } from '../features/users/pages/UserDetails'
import { AuditLogs } from '../features/auditLogs/pages/AuditLogs'
import { Profile } from '../features/auth/pages/Profile'
import { NotFound } from '../pages/NotFound'

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.LOGIN} element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path={ROUTES.HOME} element={<RoleHomeRedirect />} />
            <Route path={ROUTES.PROFILE} element={<Profile />} />
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={[ROLES.SUPER_ADMIN, ROLES.MERCHANT_ADMIN, ROLES.MERCHANT_SUPPORT]}
                />
              }
            >
              <Route path={ROUTES.MERCHANTS} element={<MerchantList />} />
              <Route path={ROUTES.MERCHANT_DETAIL} element={<MerchantDetails />} />
              <Route path={ROUTES.KIOSKS} element={<KioskList />} />
              <Route path={ROUTES.KIOSK_DETAIL} element={<KioskDetails />} />
            </Route>
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={[ROLES.SUPER_ADMIN, ROLES.USER_ADMIN, ROLES.USER_SUPPORT]}
                />
              }
            >
              <Route path={ROUTES.USERS} element={<UserList />} />
              <Route path={ROUTES.USER_DETAIL} element={<UserDetails />} />
            </Route>
            <Route
              element={
                <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.USER_ADMIN, ROLES.MERCHANT_ADMIN]} />
              }
            >
              <Route path={ROUTES.SUPPORT_TEAM} element={<SupportTeamPage />} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]} />}>
              <Route path={ROUTES.SUPPORT_TEAM_CREATE_ADMIN} element={<CreateSupportAdmin />} />
            </Route>
            <Route
              element={
                <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.USER_ADMIN, ROLES.MERCHANT_ADMIN]} />
              }
            >
              <Route path={ROUTES.AUDIT_LOGS} element={<AuditLogs />} />
            </Route>
          </Route>
        </Route>

        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
