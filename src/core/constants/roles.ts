export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  SUPPORT: 'SUPPORT',
  READ_ONLY: 'READ_ONLY',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

/** Roles allowed to access admin workspace routes */
export const WORKSPACE_ROLES: Role[] = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.SUPPORT,
  ROLES.READ_ONLY,
]

export function hasRole(userRole: string | undefined, allowed: readonly Role[]): boolean {
  if (!userRole) return false
  return (allowed as string[]).includes(userRole)
}

export function canManageMerchants(role: string | undefined): boolean {
  return hasRole(role, [ROLES.SUPER_ADMIN, ROLES.ADMIN])
}

export function canManageKiosks(role: string | undefined): boolean {
  return hasRole(role, [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SUPPORT])
}

export function canViewAuditLogs(role: string | undefined): boolean {
  return hasRole(role, [ROLES.SUPER_ADMIN, ROLES.ADMIN])
}
