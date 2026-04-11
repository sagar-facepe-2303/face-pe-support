export const ROLES = {
  SUPER_ADMIN: "super_admin",
  USER_ADMIN: "user_admin",
  MERCHANT_ADMIN: "merchant_admin",
  MERCHANT_SUPPORT: "merchant_support",
  USER_SUPPORT: "user_support",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Roles allowed to access admin workspace routes */
export const WORKSPACE_ROLES: Role[] = [
  ROLES.SUPER_ADMIN,
  ROLES.USER_ADMIN,
  ROLES.MERCHANT_ADMIN,
  ROLES.MERCHANT_SUPPORT,
  ROLES.USER_SUPPORT,
];

export function hasRole(
  userRole: string | undefined,
  allowed: readonly Role[],
): boolean {
  if (!userRole) return false;
  return (allowed as string[]).includes(userRole);
}

export function canManageMerchants(role: string | undefined): boolean {
  return hasRole(role, [ROLES.SUPER_ADMIN, ROLES.MERCHANT_ADMIN]);
}

export function canManageKiosks(role: string | undefined): boolean {
  return hasRole(role, [ROLES.SUPER_ADMIN, ROLES.MERCHANT_ADMIN]);
}

export function canViewAuditLogs(role: string | undefined): boolean {
  return hasRole(role, WORKSPACE_ROLES);
}

export function canAccessMerchantScope(role: string | undefined): boolean {
  return hasRole(role, [
    ROLES.SUPER_ADMIN,
    ROLES.MERCHANT_ADMIN,
    ROLES.MERCHANT_SUPPORT,
  ]);
}

export function canAccessUserScope(role: string | undefined): boolean {
  return hasRole(role, [
    ROLES.SUPER_ADMIN,
    ROLES.USER_ADMIN,
    ROLES.USER_SUPPORT,
  ]);
}

export function canMutateUsers(role: string | undefined): boolean {
  return hasRole(role, [ROLES.SUPER_ADMIN, ROLES.USER_ADMIN]);
}

/** Roles a super_admin may assign when creating support users (API: any portal role). */
export const CREATABLE_SUPPORT_ROLES_SUPER_ADMIN: Role[] = [
  // ROLES.SUPER_ADMIN,
  // ROLES.USER_ADMIN,
  // ROLES.MERCHANT_ADMIN,
  ROLES.USER_SUPPORT,
  ROLES.MERCHANT_SUPPORT,
];

export function canCreateSupportUserRole(
  actorRole: string | undefined,
  targetRole: Role,
): boolean {
  if (actorRole === ROLES.SUPER_ADMIN) {
    return (CREATABLE_SUPPORT_ROLES_SUPER_ADMIN as readonly string[]).includes(
      targetRole,
    );
  }
  if (actorRole === ROLES.USER_ADMIN) {
    return targetRole === ROLES.USER_SUPPORT;
  }
  if (actorRole === ROLES.MERCHANT_ADMIN) {
    return targetRole === ROLES.MERCHANT_SUPPORT;
  }
  return false;
}

export function getAssignableSupportRoles(
  actorRole: string | undefined,
): Role[] {
  if (actorRole === ROLES.SUPER_ADMIN) {
    return [...CREATABLE_SUPPORT_ROLES_SUPER_ADMIN];
  }
  if (actorRole === ROLES.USER_ADMIN) {
    return [ROLES.USER_SUPPORT];
  }
  if (actorRole === ROLES.MERCHANT_ADMIN) {
    return [ROLES.MERCHANT_SUPPORT];
  }
  return [];
}
