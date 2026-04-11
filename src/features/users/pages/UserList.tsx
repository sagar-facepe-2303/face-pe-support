import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { useAppSelector } from '../../../app/hooks'
import * as userAPI from '../userAPI'
import type { PlatformUserDetail } from '../userAPI'
import { ROUTES } from '../../../core/config/routes'
import { ROLES, canMutateUsers } from '../../../core/constants/roles'
import { formatDisplayDate } from '../../../core/utils/helpers'
import { getApiErrorMessage } from '../../../core/api/parseApiError'
import '../../../layout/Layout.css'
import '../../merchants/pages/MerchantList.css'
import './UserList.css'

function createSupportUserPath(role: string | undefined): string {
  if (role === ROLES.SUPER_ADMIN) {
    return ROUTES.SUPPORT_TEAM_CREATE_ADMIN
  }
  return ROUTES.SUPPORT_TEAM
}

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

  const d = result

  return (
    <div className="user-list page-shell">
      <header className="page-header">
        <div>
          <p className="page-kicker">End customers</p>
          <h1 className="page-title">User directory</h1>
          <p className="page-desc">
            Look up an end-customer by Support Portal <strong>user id</strong> (<code>GET /users/{"{user_id}"}</code>).
            Super admin and user admin can add support operators from the button below.
          </p>
        </div>
        <div className="user-list__actions">
          {canCreate ? (
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() => navigate(createSupportUserPath(user?.role))}
            >
              + Create new user
            </button>
          ) : null}
        </div>
      </header>

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
    </div>
  )
}
