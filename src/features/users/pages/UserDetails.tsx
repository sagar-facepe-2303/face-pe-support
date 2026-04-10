import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { clearUserDetail, loadUserDetail } from '../userSlice'
import * as userAPI from '../userAPI'
import { getApiErrorMessage } from '../../../core/api/parseApiError'
import { ROUTES } from '../../../core/config/routes'
import { UserInfo } from '../components/UserInfo'
import { formatCurrency } from '../../../core/utils/helpers'
import '../../../layout/Layout.css'
import '../../merchants/pages/MerchantList.css'
import './UserDetails.css'

export function UserDetails() {
  const { userId } = useParams<{ userId: string }>()
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.users.current)
  const transactions = useAppSelector((s) => s.users.transactions)
  const loading = useAppSelector((s) => s.users.loadingDetail)
  const error = useAppSelector((s) => s.users.error)
  const detailLoadHttpStatus = useAppSelector((s) => s.users.detailLoadHttpStatus)

  const [otpSessionId, setOtpSessionId] = useState<string | null>(null)
  const [otpCode, setOtpCode] = useState('')
  const [otpSending, setOtpSending] = useState(false)
  const [otpVerifying, setOtpVerifying] = useState(false)
  const [otpLocalError, setOtpLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (userId) {
      dispatch(loadUserDetail(userId))
    }
    return () => {
      dispatch(clearUserDetail())
    }
  }, [dispatch, userId])

  if (!userId) {
    return <p role="alert">Missing user identifier.</p>
  }

  if (loading && !user) {
    return (
      <div className="user-details page-shell">
        <p role="status">Loading profile…</p>
      </div>
    )
  }

  const needsReadUserOtp =
    Boolean(error && !user && (detailLoadHttpStatus === 401 || detailLoadHttpStatus === 403))

  async function sendReadOtp() {
    if (!userId) return
    setOtpSending(true)
    setOtpLocalError(null)
    try {
      const r = await userAPI.sendUserOtp('read_user', userId)
      setOtpSessionId(r.session_id)
    } catch (err) {
      setOtpLocalError(getApiErrorMessage(err))
    } finally {
      setOtpSending(false)
    }
  }

  async function verifyOtpAndReload() {
    if (!userId || !otpSessionId) {
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
      await dispatch(loadUserDetail({ id: userId, otpToken: token })).unwrap()
      setOtpSessionId(null)
      setOtpCode('')
    } catch (err) {
      setOtpLocalError(getApiErrorMessage(err))
    } finally {
      setOtpVerifying(false)
    }
  }

  if (needsReadUserOtp) {
    return (
      <div className="user-details page-shell">
        <nav className="user-details__crumb" aria-label="Breadcrumb">
          <Link to={ROUTES.USERS}>Users</Link>
        </nav>
        <p className="user-details__banner" role="alert">
          {error}
        </p>
        <p className="user-details__otp-intro">
          Reading an end-customer profile requires email verification in addition to your login. Use{' '}
          <code>read_user</code> OTP first. Update and delete require separate OTP challenges (
          <code>update_user</code>, <code>delete_user</code>).
        </p>
        <div className="merchant-list__otp card-surface" role="region" aria-label="Verify user read access">
          <p className="merchant-list__otp-title">Verify access</p>
          <div className="merchant-list__otp-actions">
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              disabled={otpSending}
              onClick={() => void sendReadOtp()}
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
              onClick={() => void verifyOtpAndReload()}
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
        <p>
          <Link to={ROUTES.USERS}>Back to users</Link>
        </p>
      </div>
    )
  }

  if (error && !user) {
    return (
      <div className="user-details page-shell">
        <p role="alert">{error}</p>
        <p>
          <Link to={ROUTES.USERS}>Back to users</Link>
        </p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="user-details page-shell">
      <nav className="user-details__crumb" aria-label="Breadcrumb">
        <Link to={ROUTES.USERS}>Users</Link> · User profile
      </nav>
      <header className="user-details__head page-header">
        <h1 className="page-title">{user.name}</h1>
        <div className="user-details__actions">
          <button type="button" className="btn btn--secondary btn--sm">
            Pause account
          </button>
          <button type="button" className="btn btn--primary btn--sm">
            Edit details
          </button>
        </div>
      </header>

      <div className="user-details__grid">
        <UserInfo user={user} />

        <div className="user-details__main">
          <section className="user-details__history card-surface" aria-labelledby="tx-head">
            <header className="user-details__history-head">
              <h2 id="tx-head" className="user-details__section-title">
                Transaction history
              </h2>
              <button type="button" className="btn btn--ghost btn--sm">
                View all
              </button>
            </header>
            <div className="user-details__table-wrap">
              <table className="user-details__table">
                <thead>
                  <tr>
                    <th scope="col">Reference</th>
                    <th scope="col">Merchant</th>
                    <th scope="col">Date</th>
                    <th scope="col">Amount</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="user-details__empty-tx">
                        No transactions loaded (list not returned with profile).
                      </td>
                    </tr>
                  ) : (
                    transactions.map((t) => (
                      <tr key={t.reference}>
                        <td>{t.reference}</td>
                        <td>{t.merchant}</td>
                        <td>{t.date}</td>
                        <td>{formatCurrency(t.amount)}</td>
                        <td>
                          <span
                            className={
                              t.status === 'SUCCESS'
                                ? 'user-details__pill user-details__pill--ok'
                                : 'user-details__pill user-details__pill--bad'
                            }
                          >
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <div className="user-details__bottom">
            <section className="user-details__map card-surface" aria-label="Primary location">
              <div className="user-details__map-visual" />
              <p className="user-details__map-title">San Francisco, California</p>
              <p className="user-details__map-line">Market Street · approximate</p>
            </section>
            <div className="user-details__utilities">
              <section className="user-details__util card-surface">
                <h2 className="user-details__util-title">Device management</h2>
                <p className="user-details__util-text">Review enrolled devices and sessions.</p>
                <button type="button" className="user-details__util-link">
                  Manage devices →
                </button>
              </section>
              <section className="user-details__util card-surface">
                <h2 className="user-details__util-title">Security audit</h2>
                <p className="user-details__util-text">Review recent authentication events.</p>
                <button type="button" className="user-details__util-link">
                  View security logs →
                </button>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
