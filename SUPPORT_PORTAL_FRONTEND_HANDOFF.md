# Support Portal Frontend Integration Guide

## Base URL and headers
- Default Axios base URL: `https://supportportal.dev.facepe.ai/sp`
- Override with `.env` using `VITE_API_BASE_URL`
- Standard auth header: `Authorization: Bearer <access_token>`
- OTP-scoped user endpoints also require: `X-OTP-Token: <otp_token>`

## Implemented frontend API modules
- `src/core/api/axios.ts` -> central Axios instance, `/sp` base path
- `src/core/api/interceptors.ts` -> bearer token injection from Redux auth state
- `src/features/auth/authAPI.ts` -> `/auth/login`, `/auth/refresh`, `/auth/logout`, plus bootstrap register flow via `/support-users/seed-super-admin`
- `src/features/supportTeam/supportAPI.ts` -> `/support-users` create/update + seed super admin
- `src/features/merchants/merchantAPI.ts` -> `/merchants` create/update, `/merchants/{id}/kiosks` create/update
- `src/features/users/userAPI.ts` -> `/users/{id}` get/update/delete with OTP header + `/otp/send` and `/otp/verify`
- `src/features/auditLogs/auditAPI.ts` -> `GET /audit-logs` with `page` + `page_size`
- `src/features/kiosks/kioskAPI.ts` -> `/kiosks/{kiosk_id}/heartbeat`

## RBAC constants and route guards
- Canonical backend roles in frontend:
  - `super_admin`
  - `user_admin`
  - `merchant_admin`
  - `merchant_support`
  - `user_support`

Implemented in `src/core/constants/roles.ts` and consumed in `src/routes/AppRoutes.tsx` + `src/layout/Sidebar.tsx`.

### Route-level access implemented
- Merchant and kiosk pages:
  - `super_admin`, `merchant_admin`, `merchant_support`
- User pages:
  - `super_admin`, `user_admin`, `user_support`
- Support team management pages:
  - `super_admin`, `user_admin`, `merchant_admin`
- Audit logs page:
  - `super_admin`, `user_admin`, `merchant_admin`

## Support user creation constraints (as requested)
Implemented in `roles.ts` + enforced in `supportAPI.createSupportUser(...)`:

- `super_admin` can create:
  - `super_admin`
  - `merchant_admin`
- `merchant_admin` can create:
  - `merchant_support`
- `user_admin` can create:
  - `user_support`
- Other roles cannot create support users

`src/features/supportTeam/pages/Users.tsx` reads these allowed role targets and disables invite action if none are allowed.

## OTP workflow implemented
Frontend sequence for sensitive user operations:
1. `POST /otp/send` with `purpose` + `target_user_id`
2. `POST /otp/verify` with `session_id` + `code`
3. Use returned `otp_token` in `X-OTP-Token` for:
   - `GET /users/{id}` (read_user)
   - `PUT /users/{id}` (update_user)
   - `DELETE /users/{id}` (delete_user)

## Notes on current UI data
Some list/detail pages still use local seeded data for table rendering where list endpoints are not specified in the handoff contract (for example support user list, merchant directory listing, and user list page). The API write/actions and scoped endpoints are already wired for production integration.

## Auth state model update
`src/features/auth/types.ts` and `src/features/auth/authSlice.ts` now store:
- `token` (access)
- `refreshToken`

Logout calls backend revoke endpoint with refresh token payload.

## Recommended env file
Create `.env` in project root:

```bash
VITE_API_BASE_URL=https://supportportal.dev.facepe.ai/sp
```

## Quick validation checklist
- Login issues both access and refresh token
- Protected routes redirect unauthorized role users to dashboard
- Sidebar only shows navigation modules matching current role scope
- User-sensitive API calls include `X-OTP-Token`
- Audit logs endpoint accepts pagination params from client
