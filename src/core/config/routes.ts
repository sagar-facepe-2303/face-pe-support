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
  AUDIT_LOGS: '/audit-logs',
} as const

export type RouteKey = keyof typeof ROUTES
