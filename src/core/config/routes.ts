export const ROUTES = {
  LOGIN: '/login',
  HOME: '/',
  MERCHANTS: '/merchants',
  /** Path param is merchant email (URL-encoded in links). */
  MERCHANT_DETAIL: '/merchants/:merchantEmail',
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

export function hrefMerchantDetail(merchantEmail: string): string {
  return `${ROUTES.MERCHANTS}/${encodeURIComponent(merchantEmail.trim())}`
}
