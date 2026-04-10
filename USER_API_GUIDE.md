# Users (End-Customer Records) — API Guide

These endpoints manage end-customer records and require **OTP validation in addition to RBAC**. Base path in this app: `/sp` (see `VITE_API_BASE_URL`).

## CRUD endpoints

| Method | Path | Description | Auth requirements |
|--------|------|-------------|-------------------|
| `GET` | `/sp/users/{user_id}` | Fetch a customer profile | `Authorization: Bearer`; roles: `super_admin`, `user_admin`, `user_support`; **`X-OTP-Token`** must carry scope **`read_user`** |
| `PUT` | `/sp/users/{user_id}` | Update customer profile | Same roles; OTP scope **`update_user`**. Body: partial `user_name`, `user_email`, `user_phone` |
| `DELETE` | `/sp/users/{user_id}` | Soft-delete a customer | Same roles; OTP scope **`delete_user`**. Response: **204 No Content** |

## OTP workflow

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/sp/otp/send` | Trigger OTP — body: `purpose`, `target_user_id` |
| `POST` | `/sp/otp/verify` | Exchange code for scoped token — body: `session_id`, `code` |

**Purpose values (user):** `read_user`, `update_user`, `delete_user`.

Include the verify response **`token`** (or `otp_token` if returned) in **`X-OTP-Token`** for the scoped `GET` / `PUT` / `DELETE` call.

## OTP purposes by role

| Role | Allowed purposes |
|------|------------------|
| `SUPER_ADMIN` | `read_user`, `update_user`, `delete_user`, `read_merchant`, `update_merchant` |
| `MERCHANT_ADMIN` | `read_merchant`, `update_merchant` |
| `USER_ADMIN` | `read_user`, `update_user`, `delete_user` |
| `USER_SUPPORT` | `read_user`, `update_user`, `delete_user` |

## Frontend implementation

| Area | Location |
|------|----------|
| HTTP + OTP helpers | `src/features/users/userAPI.ts` |
| Detail load + OTP state | `src/features/users/userSlice.ts`, `src/features/users/pages/UserDetails.tsx` |

**Note:** A **read** OTP (`read_user`) is scoped to that operation. **Update** and **delete** require separate OTP challenges with `update_user` and `delete_user` respectively.
