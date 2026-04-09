export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  HOME: '/',
  MERCHANTS: '/merchants',
  MERCHANT_DETAIL: '/merchants/:merchantId',
  KIOSKS: '/kiosks',
  KIOSK_DETAIL: '/kiosks/:kioskId',
  USERS: '/users',
  USER_DETAIL: '/users/:userId',
  SUPPORT_TEAM: '/support-team',
  SUPPORT_TEAM_CREATE_ADMIN: '/support-team/create-admin',
  AUDIT_LOGS: '/audit-logs',
  PROFILE: '/profile',
} as const

export type RouteKey = keyof typeof ROUTES
