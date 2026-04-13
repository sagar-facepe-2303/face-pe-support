import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { useAppSelector } from '../../../app/hooks'
import * as userAPI from '../userAPI'
import type { PlatformUserDetail } from '../userAPI'
import { ROUTES } from '../../../core/config/routes'
import { canMutateUsers } from '../../../core/constants/roles'
import { formatDisplayDate } from '../../../core/utils/helpers'
import { getApiErrorMessage } from '../../../core/api/parseApiError'
import '../../../layout/Layout.css'
import '../../merchants/pages/MerchantList.css'
import './UserList.css'

export function UserList() {
  const navigate = useNavigate()
  const user = useAppSelector((s) => s.auth.user)
  const canCreate = canMutateUsers(user?.role)

  const [userIdInput, setUserIdInput] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [result, setResult] = useState<PlatformUserDetail | null>(null)

  const [otpHint, setOtpHint] = useState(false)
  const [otpSessionId, setOtpSessionId] = useState<string | null>(null)
  const [otpCode, setOtpCode] = useState('')
  const [otpSending, setOtpSending] = useState(false)
  const [otpVerifying, setOtpVerifying] = useState(false)
  const [otpLocalError, setOtpLocalError] = useState<string | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [seedUserId, setSeedUserId] = useState('')
  const [seedUserName, setSeedUserName] = useState('')
  const [seedUserEmail, setSeedUserEmail] = useState('')
  const [seedUserPhone, setSeedUserPhone] = useState('')
  const [seedSubmitting, setSeedSubmitting] = useState(false)
  const [seedError, setSeedError] = useState<string | null>(null)
  const [seedSuccess, setSeedSuccess] = useState<userAPI.SeedCustomerUserResponse | null>(null)

  async function loadProfile(otpToken?: string | null) {
    const id = userIdInput.trim()
    if (!id) {
      setSearchError('Enter a user id (UUID).')
      return
    }
    setSearchError(null)
    setOtpLocalError(null)
    setSearchLoading(true)
    try {
      const { user: u } = await userAPI.fetchUserProfile(id, otpToken)
      setResult(u)
      setOtpHint(false)
      setOtpSessionId(null)
      setOtpCode('')
    } catch (e) {
      setResult(null)
      const st = isAxiosError(e) ? e.response?.status : undefined
      if ((st === 403 || st === 401) && !otpToken) {
        setOtpHint(true)
        setSearchError(
          'Reading this profile requires email verification (read_user OTP) in addition to your login.'
        )
      } else {
        setSearchError(getApiErrorMessage(e))
      }
    } finally {
      setSearchLoading(false)
    }
  }

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault()
    void loadProfile()
  }

  async function handleSendOtp() {
    const id = userIdInput.trim()
    if (!id) {
      setOtpLocalError('Enter a user id above first.')
      return
    }
    setOtpSending(true)
    setOtpLocalError(null)
    try {
      const r = await userAPI.sendUserOtp('read_user', id)
      setOtpSessionId(r.session_id)
    } catch (err) {
      setOtpLocalError(getApiErrorMessage(err))
    } finally {
      setOtpSending(false)
    }
  }

  async function handleVerifyAndLoad() {
    if (!otpSessionId) {
      setOtpLocalError('Send a verification code first.')
      return
    }
    const code = otpCode.trim()
    if (!code) {
      setOtpLocalError('Enter the code from your email.')
      return
    }
    setOtpVerifying(true)
    setOtpLocalError(null)
    try {
      const token = await userAPI.verifyUserOtpAndGetToken(otpSessionId, code)
      if (!token) {
        setOtpLocalError('Verification did not return a token. Try again.')
        return
      }
      await loadProfile(token)
    } catch (err) {
      setOtpLocalError(getApiErrorMessage(err))
    } finally {
      setOtpVerifying(false)
    }
  }

  async function handleSeedCustomer(e: FormEvent) {
    e.preventDefault()
    setSeedError(null)
    const user_id = seedUserId.trim()
    const user_name = seedUserName.trim()
    const user_email = seedUserEmail.trim()
    const user_phone = seedUserPhone.trim()
    if (!user_id || !user_name || !user_email || !user_phone) {
      setSeedError('All fields are required.')
      return
    }
    setSeedSubmitting(true)
    try {
      const created = await userAPI.seedCustomerUser({
        user_id,
        user_name,
        user_email,
        user_phone,
      })
      setSeedSuccess(created)
      setCreateOpen(false)
      setSeedUserId('')
      setSeedUserName('')
      setSeedUserEmail('')
      setSeedUserPhone('')
      setUserIdInput(created.user_id)
    } catch (err) {
      setSeedError(getApiErrorMessage(err))
    } finally {
      setSeedSubmitting(false)
    }
  }

  const d = result

  return (
    <div className="user-list page-shell">
      <header className="page-header">
        <div>
          <p className="page-kicker">End customers</p>
          <h1 className="page-title">User directory</h1>
          <p className="page-desc">
            Look up an end-customer by Support Portal <strong>user id</strong> (<code>GET /users/{"{user_id}"}</code>).
            Super admin and user admin can <strong>create end customers</strong> with the button below (
            <code>POST /test/seed-user</code>).
          </p>
        </div>
        <div className="user-list__actions">
          {canCreate ? (
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() => {
                setSeedError(null)
                setSeedSuccess(null)
                setCreateOpen(true)
              }}
            >
              + Create end customer
            </button>
          ) : null}
        </div>
      </header>

      {seedSuccess ? (
        <div
          className="merchant-list__banner merchant-list__banner--success card-surface"
          role="status"
          style={{ marginBottom: '1rem' }}
        >
          <p className="merchant-list__success-title">
            <strong>Customer created.</strong> Row id <code>{seedSuccess.id}</code> · user_id{' '}
            <code>{seedSuccess.user_id}</code>
          </p>
          <p className="merchant-list__field-hint" style={{ margin: 0 }}>
            {seedSuccess.user_name} · {seedSuccess.user_email} · {seedSuccess.user_phone}
          </p>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => setSeedSuccess(null)}
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <form className="user-list__search card-surface" aria-label="Search user" onSubmit={handleSearchSubmit}>
        <label className="user-list__search-label" htmlFor="user-id-search">
          Search by user id
        </label>
        <div className="user-list__search-row">
          <input
            id="user-id-search"
            className="user-list__search-input"
            type="search"
            placeholder="End-customer UUID (user_id)…"
            value={userIdInput}
            onChange={(e) => {
              setUserIdInput(e.target.value)
              setOtpSessionId(null)
              setOtpHint(false)
            }}
            autoComplete="off"
          />
          <button type="submit" className="btn btn--primary btn--sm" disabled={searchLoading}>
            {searchLoading ? 'Searching…' : 'Search'}
          </button>
        </div>
        <p className="user-list__search-hint">
          Requires <code>Authorization: Bearer</code> and <code>X-OTP-Token</code> with <code>read_user</code> scope
          after OTP verify.
        </p>
        {searchError ? (
          <p className="merchant-list__banner merchant-list__banner--error" role="alert">
            {searchError}
          </p>
        ) : null}

        {otpHint ? (
          <div className="merchant-list__otp card-surface">
            <p className="merchant-list__otp-title">Verify access</p>
            <div className="merchant-list__otp-actions">
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                disabled={otpSending}
                onClick={() => void handleSendOtp()}
              >
                {otpSending ? 'Sending…' : 'Send code'}
              </button>
              <input
                className="merchant-list__input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="6-digit code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
              />
              <button
                type="button"
                className="btn btn--primary btn--sm"
                disabled={otpVerifying}
                onClick={() => void handleVerifyAndLoad()}
              >
                {otpVerifying ? 'Verifying…' : 'Verify & load'}
              </button>
            </div>
            {otpSessionId ? (
              <p className="merchant-list__field-hint">Code sent. Check your email and enter the code above.</p>
            ) : null}
            {otpLocalError ? (
              <p className="merchant-list__banner merchant-list__banner--error" role="alert">
                {otpLocalError}
              </p>
            ) : null}
          </div>
        ) : null}
      </form>

      {d ? (
        <section className="user-list__result card-surface" aria-labelledby="user-search-result-title">
          <header className="user-list__result-head">
            <h2 id="user-search-result-title" className="user-list__result-title">
              {d.name}
            </h2>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={() => navigate(ROUTES.USER_DETAIL.replace(':userId', d.id))}
            >
              Open full profile
            </button>
          </header>
          <dl className="user-list__result-dl">
            <dt>User id</dt>
            <dd>
              <code>{d.id}</code>
            </dd>
            <dt>Email</dt>
            <dd>{d.email}</dd>
            <dt>Phone</dt>
            <dd>{d.phone}</dd>
            <dt>Status</dt>
            <dd>
              <span className={`user-list__status-pill user-list__status-pill--${d.status.toLowerCase()}`}>
                {d.status}
              </span>
            </dd>
            <dt>Registered</dt>
            <dd>
              <time dateTime={d.createdAt}>{formatDisplayDate(d.createdAt)}</time>
            </dd>
          </dl>
        </section>
      ) : null}

      {createOpen && canCreate ? (
        <div className="merchant-list__modal-root" role="presentation">
          <button
            type="button"
            className="merchant-list__modal-backdrop"
            aria-label="Close dialog"
            onClick={() => !seedSubmitting && setCreateOpen(false)}
          />
          <div
            className="merchant-list__modal card-surface"
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-seed-create-title"
          >
            <h2 id="user-seed-create-title" className="merchant-list__modal-title">
              Create end customer
            </h2>
            <p className="merchant-list__field-hint" style={{ marginTop: 0 }}>
              Calls <code>POST /sp/test/seed-user</code> with the payload below (authenticated).
            </p>
            <form className="merchant-list__modal-form" onSubmit={handleSeedCustomer}>
              <label className="merchant-list__field">
                <span className="merchant-list__field-label">user_id (UUID)</span>
                <div className="user-list__search-row">
                  <input
                    className="merchant-list__input"
                    required
                    value={seedUserId}
                    onChange={(e) => setSeedUserId(e.target.value)}
                    placeholder="550e8400-e29b-41d4-a716-446655440001"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    className="btn btn--secondary btn--sm"
                    onClick={() => setSeedUserId(crypto.randomUUID())}
                  >
                    Generate
                  </button>
                </div>
              </label>
              <label className="merchant-list__field">
                <span className="merchant-list__field-label">user_name</span>
                <input
                  className="merchant-list__input"
                  required
                  value={seedUserName}
                  onChange={(e) => setSeedUserName(e.target.value)}
                  autoComplete="name"
                />
              </label>
              <label className="merchant-list__field">
                <span className="merchant-list__field-label">user_email</span>
                <input
                  className="merchant-list__input"
                  type="email"
                  required
                  value={seedUserEmail}
                  onChange={(e) => setSeedUserEmail(e.target.value)}
                  autoComplete="email"
                />
              </label>
              <label className="merchant-list__field">
                <span className="merchant-list__field-label">user_phone</span>
                <input
                  className="merchant-list__input"
                  type="tel"
                  required
                  value={seedUserPhone}
                  onChange={(e) => setSeedUserPhone(e.target.value)}
                  placeholder="+919876543210"
                  autoComplete="tel"
                />
              </label>
              {seedError ? (
                <p className="merchant-list__banner merchant-list__banner--error" role="alert">
                  {seedError}
                </p>
              ) : null}
              <div className="merchant-list__modal-actions">
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  disabled={seedSubmitting}
                  onClick={() => setCreateOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary btn--sm" disabled={seedSubmitting}>
                  {seedSubmitting ? 'Creating…' : 'Create customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
