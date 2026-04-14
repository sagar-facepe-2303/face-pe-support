# Merchant API Guide for Frontend Developers

This guide covers merchant endpoints and the OTP authentication flow for merchant operations. Base path in this app defaults to `/sp` (see `VITE_API_BASE_URL`).

## 1. Get Merchant by ID

Retrieves a single merchant with their associated kiosks.

**Endpoint:** `GET /sp/merchants/{merchant_id}`

### Headers required

| Header | Value |
|--------|--------|
| `Authorization` | `Bearer <access_token>` |
| `X-OTP-Token` | `<otp_token>` from the verify step |

### Request parameters

| Parameter | Type | Location | Description |
|-----------|------|----------|-------------|
| `merchant_id` | UUID | Path | The merchant’s unique ID (Support Portal row `id` in examples) |

### Response (200 OK)

Example shape:

```json
{
  "id": "44f77605-cb12-4154-bea9-bb624eaa2929",
  "merchant_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "merchant_email": "merchant@example.com",
  "merchant_name": "Acme Corp",
  "merchant_phone": "+1234567890",
  "status": "ACTIVE",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T14:22:00Z",
  "kiosks": [
    {
      "id": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
      "merchant_id": "44f77605-cb12-4154-bea9-bb624eaa2929",
      "serial_id": "KIOSK-001",
      "face_status": true,
      "camera_status": true,
      "is_active": true,
      "is_online": true,
      "last_heartbeat": "2024-01-20T14:00:00Z",
      "updated_at": "2024-01-20T14:22:00Z"
    }
  ]
}
```

### Error responses

| Status | Error | Description |
|--------|-------|-------------|
| 401 | `unauthorized` | Missing or invalid access token |
| 403 | `forbidden` | Missing OTP token or insufficient permissions |
| 404 | `not_found` | Merchant ID does not exist |

---

## 2. OTP Flow for Merchant Operations

All sensitive merchant operations require OTP verification.

1. **Send OTP** — request a code  
2. **Verify OTP** — exchange the code for an OTP token  
3. **Use OTP token** — send `X-OTP-Token` on protected endpoints  

---

## 3. Send OTP

**Endpoint:** `POST /sp/otp/send`

**Headers:** `Authorization: Bearer <access_token>`

### Merchant operations

```json
{
  "purpose": "read_merchant",
  "target_merchant_id": "44f77605-cb12-4154-bea9-bb624eaa2929"
}
```

### User operations

```json
{
  "purpose": "read_user",
  "target_user_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

### Request fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `purpose` | string | Yes | e.g. `read_merchant`, `update_merchant`, `read_user`, `update_user`, `delete_user` |
| `target_merchant_id` | UUID | Conditional | Required for `read_merchant` or `update_merchant` |
| `target_user_id` | UUID | Conditional | Required for `read_user`, `update_user`, `delete_user` |

### Rules

- Provide **only one** of `target_merchant_id` **or** `target_user_id` — never both.  
- `purpose` must match the target type.  
- Role determines allowed operations (see section 6).

### Response (200 OK)

```json
{
  "session_id": "123456789012",
  "expires_at": "2024-01-20T10:15:30Z",
  "delivery_method": "email",
  "masked_recipient": "m***@example.com"
}
```

---

## 4. Verify OTP

**Endpoint:** `POST /sp/otp/verify`

**Headers:** `Authorization: Bearer <access_token>`

```json
{
  "session_id": "123456789012",
  "code": "123456"
}
```

### Response (200 OK)

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "otp",
  "expires_at": "2024-01-20T10:15:30Z",
  "target_type": "merchant",
  "target_id": "44f77605-cb12-4154-bea9-bb624eaa2929"
}
```

Use `token` as `X-OTP-Token` on subsequent merchant calls (this app also accepts `otp_token` if the API returns that instead).

---

## 5. Complete flow example

### Step 1 — Login

`POST /sp/auth/login` → access token.

### Step 2 — Send OTP for merchant read

`POST /sp/otp/send` with `purpose: "read_merchant"` and `target_merchant_id` set to the path UUID.

### Step 3 — Verify OTP

`POST /sp/otp/verify` with `session_id` and `code` → OTP token.

### Step 4 — Get merchant

`GET /sp/merchants/{merchant_id}` with both `Authorization: Bearer …` and `X-OTP-Token: <token>`.

---

## 6. OTP purposes by role

| Role | Allowed purposes |
|------|------------------|
| `SUPER_ADMIN` | `read_user`, `update_user`, `delete_user`, `read_merchant`, `update_merchant` |
| `MERCHANT_ADMIN` | `read_merchant`, `update_merchant` |
| `USER_ADMIN` / `USER_SUPPORT` | `read_user`, `update_user`, `delete_user` |

---

## 7. Common mistakes

- Sending **both** `target_user_id` and `target_merchant_id` in one body.  
- **Mismatched** `purpose` and target (e.g. `read_user` with `target_merchant_id`).  
- Calling protected `GET /sp/merchants/{id}` **without** `X-OTP-Token` when the API requires it.

---

## Frontend implementation in this repo

| Area | Location |
|------|----------|
| Merchant HTTP helpers | `src/features/merchants/merchantAPI.ts` |
| OTP send (`read_merchant` / `update_merchant`) | `sendMerchantOtp`, `sendMerchantReadOtp` |
| OTP verify | `verifyOtpAndGetToken` |
| Merchant search + OTP UI | `src/features/merchants/pages/MerchantList.tsx` |
| Merchant detail + OTP UI | `src/features/merchants/pages/MerchantDetails.tsx` |
