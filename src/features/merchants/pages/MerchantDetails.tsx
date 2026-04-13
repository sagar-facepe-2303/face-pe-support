import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import {
  clearMerchantDetail,
  createMerchantKiosk,
  deleteMerchantKiosk,
  loadMerchantDetail,
  removeMerchant,
  updateMerchantKiosk,
  updateMerchantRecord,
} from '../merchantSlice'
import * as merchantAPI from '../merchantAPI'
import type { MerchantKioskRow } from '../merchantAPI'
import { loadMerchantReadSession } from '../merchantReadSession'
import { ROUTES } from '../../../core/config/routes'
import { canManageMerchants } from '../../../core/constants/roles'
import { formatDisplayDate } from '../../../core/utils/helpers'
import { getApiErrorMessage } from '../../../core/api/parseApiError'
import '../../../layout/Layout.css'
import './MerchantList.css'
import './MerchantDetails.css'

export function MerchantDetails() {
  const { merchantId } = useParams<{ merchantId: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  const canMutate = canManageMerchants(user?.role)

  const merchant = useAppSelector((s) => s.merchants.current)
  const kiosks = useAppSelector((s) => s.merchants.kiosks)
  const loading = useAppSelector((s) => s.merchants.loadingDetail)
  const error = useAppSelector((s) => s.merchants.error)
  const detailLoadHttpStatus = useAppSelector((s) => s.merchants.detailLoadHttpStatus)

  const [otpSessionId, setOtpSessionId] = useState<string | null>(null)
  const [otpCode, setOtpCode] = useState('')
  const [otpSending, setOtpSending] = useState(false)
  const [otpVerifying, setOtpVerifying] = useState(false)
  const [otpLocalError, setOtpLocalError] = useState<string | null>(null)

  const [editOpen, setEditOpen] = useState(false)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editActive, setEditActive] = useState(true)

  const [kioskOpen, setKioskOpen] = useState(false)
  const [kioskSubmitting, setKioskSubmitting] = useState(false)
  const [kioskError, setKioskError] = useState<string | null>(null)
  const [kSerial, setKSerial] = useState('')
  const [kOnline, setKOnline] = useState(true)
  const [kFace, setKFace] = useState('ok')
  const [kCam, setKCam] = useState('ok')

  const [editKiosk, setEditKiosk] = useState<MerchantKioskRow | null>(null)
  const [ekSubmitting, setEkSubmitting] = useState(false)
  const [ekError, setEkError] = useState<string | null>(null)

  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!merchantId || !user?.id) return
    const saved = loadMerchantReadSession(user.id)
    const loadArg =
      saved?.merchantId === merchantId && saved.otpToken
        ? { id: merchantId, otpToken: saved.otpToken }
        : merchantId
    dispatch(loadMerchantDetail(loadArg))
    return () => {
      dispatch(clearMerchantDetail())
    }
  }, [dispatch, merchantId, user?.id])

  useEffect(() => {
    if (merchant && editOpen) {
      setEditName(merchant.name)
      setEditEmail(merchant.email)
      setEditPhone(merchant.phone !== '—' ? merchant.phone : '')
      setEditActive(merchant.status !== 'SUSPENDED')
    }
  }, [merchant, editOpen])

  if (!merchantId) {
    return <p role="alert">Missing merchant identifier.</p>
  }

  if (loading && !merchant) {
    return (
      <div className="merchant-details page-shell">
        <p role="status">Loading merchant…</p>
      </div>
    )
  }

  const needsMerchantReadOtp =
    Boolean(error && !merchant && (detailLoadHttpStatus === 401 || detailLoadHttpStatus === 403))

  async function sendReadOtp() {
    if (!merchantId) return
    setOtpSending(true)
    setOtpLocalError(null)
    try {
      const r = await merchantAPI.sendMerchantReadOtp(merchantId)
      setOtpSessionId(r.session_id)
    } catch (err) {
      setOtpLocalError(getApiErrorMessage(err))
    } finally {
      setOtpSending(false)
    }
  }

  async function verifyOtpAndReload() {
    if (!merchantId || !otpSessionId) {
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
      const token = await merchantAPI.verifyOtpAndGetToken(otpSessionId, code)
      if (!token) {
        setOtpLocalError('Verification did not return a token. Try again.')
        return
      }
      await dispatch(loadMerchantDetail({ id: merchantId, otpToken: token })).unwrap()
      setOtpSessionId(null)
      setOtpCode('')
    } catch (err) {
      setOtpLocalError(getApiErrorMessage(err))
    } finally {
      setOtpVerifying(false)
    }
  }

  if (needsMerchantReadOtp) {
    return (
      <div className="merchant-details page-shell">
        <nav className="merchant-details__crumb" aria-label="Breadcrumb">
          <Link to={ROUTES.MERCHANTS}>Merchants</Link>
        </nav>
        <p className="merchant-details__banner" role="alert">
          {error}
        </p>
        <p className="merchant-details__otp-intro">
          The Support Portal requires a one-time email code to <strong>read</strong> merchant details (this is separate
          from logging in). Super admin and merchant admin still need this step when the API returns 401/403 on{' '}
          <code>GET /merchants/{"{id}"}</code>.
        </p>
        <div className="merchant-list__otp card-surface" role="region" aria-label="Verify merchant access">
          <p className="merchant-list__otp-title">Verify access</p>
          <div className="merchant-list__otp-actions">
            <button type="button" className="btn btn--secondary btn--sm" disabled={otpSending} onClick={() => void sendReadOtp()}>
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
          <Link to={ROUTES.MERCHANTS}>Back to merchants</Link>
        </p>
      </div>
    )
  }

  if (error && !merchant) {
    return (
      <div className="merchant-details page-shell">
        <p role="alert">{error}</p>
        <p>
          <Link to={ROUTES.MERCHANTS}>Back to merchants</Link>
        </p>
      </div>
    )
  }

  if (!merchant) {
    return null
  }

  async function onEditSubmit(e: FormEvent) {
    e.preventDefault()
    if (!merchantId) return
    setEditError(null)
    setEditSubmitting(true)
    try {
      await dispatch(
        updateMerchantRecord({
          merchantId,
          payload: {
            merchant_name: editName.trim(),
            merchant_email: editEmail.trim(),
            ...(editPhone.trim() ? { merchant_phone: editPhone.trim() } : {}),
            is_active: editActive,
          },
        })
      ).unwrap()
      setEditOpen(false)
    } catch (err) {
      setEditError(typeof err === 'string' ? err : 'Update failed.')
    } finally {
      setEditSubmitting(false)
    }
  }

  async function onAddKiosk(e: FormEvent) {
    e.preventDefault()
    if (!merchantId) return
    setKioskError(null)
    setKioskSubmitting(true)
    try {
      await dispatch(
        createMerchantKiosk({
          merchantId,
          payload: merchantAPI.buildCreateKioskPayload(kSerial.trim(), kOnline, kFace, kCam),
        })
      ).unwrap()
      setKioskOpen(false)
      setKSerial('')
      setKOnline(true)
      setKFace('ok')
      setKCam('ok')
    } catch (err) {
      setKioskError(typeof err === 'string' ? err : 'Could not add kiosk.')
    } finally {
      setKioskSubmitting(false)
    }
  }

  async function onEditKioskSubmit(e: FormEvent) {
    e.preventDefault()
    if (!merchantId || !editKiosk) return
    setEkError(null)
    setEkSubmitting(true)
    try {
      await dispatch(
        updateMerchantKiosk({
          merchantId,
          kioskId: editKiosk.id,
          payload: {
            is_online: editKiosk.isOnline,
            face_status: editKiosk.faceStatus,
            camera_status: editKiosk.cameraStatus,
            is_active: editKiosk.isActive,
          },
        })
      ).unwrap()
      setEditKiosk(null)
    } catch (err) {
      setEkError(typeof err === 'string' ? err : 'Could not update kiosk.')
    } finally {
      setEkSubmitting(false)
    }
  }

  async function onDeleteMerchant() {
    if (!merchantId || !merchant) return
    if (!window.confirm(`Delete merchant “${merchant.name}”?`)) return
    setDeleting(true)
    try {
      await dispatch(removeMerchant(merchantId)).unwrap()
      navigate(ROUTES.MERCHANTS)
    } catch {
      /* slice error */
    } finally {
      setDeleting(false)
    }
  }

  async function onDeleteKiosk(k: MerchantKioskRow) {
    if (!merchantId) return
    if (!window.confirm(`Remove kiosk ${k.serialId}?`)) return
    try {
      await dispatch(deleteMerchantKiosk({ merchantId, kioskId: k.id })).unwrap()
    } catch {
      /* slice */
    }
  }

  function openKioskEdit(k: MerchantKioskRow) {
    setEditKiosk({ ...k })
    setEkError(null)
  }

  return (
    <div className="merchant-details page-shell">
      <nav className="merchant-details__crumb" aria-label="Breadcrumb">
        <Link to={ROUTES.MERCHANTS}>Merchants</Link> · <span>{merchant.name}</span>
      </nav>
      {error ? (
        <p className="merchant-details__banner" role="alert">
          {error}
        </p>
      ) : null}
      <header className="merchant-details__head page-header">
        <div>
          <h1 className="page-title">{merchant.name}</h1>
          <p className="merchant-details__sub">
            Merchant ref: <strong>{merchant.registrationNumber}</strong>
          </p>
        </div>
        <div className="merchant-details__actions">
          {canMutate ? (
            <>
              <button type="button" className="btn btn--secondary btn--sm" onClick={() => setEditOpen(true)}>
                Edit details
              </button>
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                disabled={deleting}
                onClick={onDeleteMerchant}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </>
          ) : null}
        </div>
      </header>

      <div className="merchant-details__grid">
        <section className="merchant-details__card card-surface" aria-labelledby="basic-info">
          <div className="merchant-details__card-head">
            <h2 id="basic-info" className="merchant-details__card-title">
              Basic information
            </h2>
            <span className="merchant-details__verified">
              {merchant.status === 'ACTIVE' ? 'Active merchant' : merchant.status}
            </span>
          </div>
          <dl className="merchant-details__dl">
            <div>
              <dt>Legal entity name</dt>
              <dd>{merchant.legalEntity}</dd>
            </div>
            <div>
              <dt>Merchant ID (external)</dt>
              <dd>{merchant.registrationNumber}</dd>
            </div>
            <div>
              <dt>Main contact</dt>
              <dd>{merchant.contactName}</dd>
            </div>
            <div>
              <dt>Email address</dt>
              <dd>{merchant.email}</dd>
            </div>
            <div>
              <dt>Headquarters</dt>
              <dd>{merchant.headquarters}</dd>
            </div>
            <div>
              <dt>Phone number</dt>
              <dd>{merchant.phone}</dd>
            </div>
            <div>
              <dt>Registered</dt>
              <dd>
                <time dateTime={merchant.registeredAt}>{formatDisplayDate(merchant.registeredAt)}</time>
              </dd>
            </div>
          </dl>
          <div className="merchant-details__settlement">
            <div>
              <p className="merchant-details__settlement-label">Settlement method</p>
              <p className="merchant-details__settlement-value">{merchant.settlementMethod}</p>
            </div>
          </div>
        </section>

        <div className="merchant-details__aside">
          <section className="merchant-details__card card-surface" aria-label="Snapshot">
            <h2 className="merchant-details__card-title">Snapshot</h2>
            <ul className="merchant-details__status-list">
              <li>
                <span className="merchant-details__pill merchant-details__pill--ok">{merchant.status}</span>
              </li>
              <li>
                API view <strong>{merchant.apiUptime}</strong>
              </li>
              <li>
                Risk{' '}
                <span className="merchant-details__pill merchant-details__pill--low">{merchant.riskLevel}</span>
              </li>
              <li>
                Growth <strong>{merchant.growth}</strong>
              </li>
            </ul>
          </section>
        </div>
      </div>

      <section className="merchant-details__kiosks card-surface" aria-labelledby="kiosks-heading">
        <header className="merchant-details__kiosks-head">
          <h2 id="kiosks-heading" className="merchant-details__card-title">
            Kiosks ({kiosks.length})
          </h2>
          {canMutate ? (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => {
                setKioskError(null)
                setKioskOpen(true)
              }}
            >
              + Add kiosk
            </button>
          ) : null}
        </header>
        <div className="merchant-details__table-wrap">
          <table className="merchant-details__table">
            <thead>
              <tr>
                <th scope="col">Serial</th>
                <th scope="col">Online</th>
                <th scope="col">Face</th>
                <th scope="col">Camera</th>
                <th scope="col">Last sync</th>
                <th scope="col">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {kiosks.map((k) => (
                <tr key={k.id}>
                  <td>
                    <Link className="merchant-details__kiosk-link" to={ROUTES.KIOSK_DETAIL.replace(':kioskId', k.id)}>
                      {k.serialId}
                    </Link>
                  </td>
                  <td>{k.isOnline ? 'Yes' : 'No'}</td>
                  <td>{k.faceStatus}</td>
                  <td>{k.cameraStatus}</td>
                  <td>{k.lastSync}</td>
                  <td>
                    {canMutate ? (
                      <div className="merchant-details__row-actions">
                        <button
                          type="button"
                          className="merchant-details__mini"
                          onClick={() => openKioskEdit(k)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="merchant-details__mini merchant-details__mini--danger"
                          onClick={() => onDeleteKiosk(k)}
                        >
                          Delete
                        </button>
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="merchant-details__footer">
        © 2026 FacePe International · Support system
      </footer>

      {editOpen ? (
        <div className="merchant-details__modal-root">
          <button type="button" className="merchant-details__backdrop" aria-label="Close" onClick={() => !editSubmitting && setEditOpen(false)} />
          <div className="merchant-details__modal card-surface" role="dialog" aria-modal="true">
            <h2 className="merchant-details__modal-title">Edit merchant</h2>
            <form onSubmit={onEditSubmit} className="merchant-details__modal-form">
              <label className="merchant-details__label">
                Name
                <input required value={editName} onChange={(e) => setEditName(e.target.value)} />
              </label>
              <label className="merchant-details__label">
                Email
                <input required type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
              </label>
              <label className="merchant-details__label">
                Phone
                <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
              </label>
              <label className="merchant-details__check">
                <input type="checkbox" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} />
                Active account
              </label>
              {editError ? (
                <p role="alert" className="merchant-details__err">
                  {editError}
                </p>
              ) : null}
              <div className="merchant-details__modal-actions">
                <button type="button" className="btn btn--secondary btn--sm" onClick={() => setEditOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary btn--sm" disabled={editSubmitting}>
                  {editSubmitting ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {kioskOpen ? (
        <div className="merchant-details__modal-root">
          <button type="button" className="merchant-details__backdrop" aria-label="Close" onClick={() => !kioskSubmitting && setKioskOpen(false)} />
          <div className="merchant-details__modal card-surface" role="dialog" aria-modal="true">
            <h2 className="merchant-details__modal-title">Register kiosk</h2>
            <form onSubmit={onAddKiosk} className="merchant-details__modal-form">
              <label className="merchant-details__label">
                Serial ID
                <input required value={kSerial} onChange={(e) => setKSerial(e.target.value)} />
              </label>
              <label className="merchant-details__check">
                <input type="checkbox" checked={kOnline} onChange={(e) => setKOnline(e.target.checked)} />
                Online
              </label>
              <label className="merchant-details__label">
                Face status
                <input value={kFace} onChange={(e) => setKFace(e.target.value)} />
              </label>
              <label className="merchant-details__label">
                Camera status
                <input value={kCam} onChange={(e) => setKCam(e.target.value)} />
              </label>
              {kioskError ? (
                <p role="alert" className="merchant-details__err">
                  {kioskError}
                </p>
              ) : null}
              <div className="merchant-details__modal-actions">
                <button type="button" className="btn btn--secondary btn--sm" onClick={() => setKioskOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary btn--sm" disabled={kioskSubmitting}>
                  {kioskSubmitting ? 'Saving…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {editKiosk ? (
        <div className="merchant-details__modal-root">
          <button
            type="button"
            className="merchant-details__backdrop"
            aria-label="Close"
            onClick={() => !ekSubmitting && setEditKiosk(null)}
          />
          <div className="merchant-details__modal card-surface" role="dialog" aria-modal="true">
            <h2 className="merchant-details__modal-title">Edit kiosk {editKiosk.serialId}</h2>
            <form onSubmit={onEditKioskSubmit} className="merchant-details__modal-form">
              <label className="merchant-details__check">
                <input
                  type="checkbox"
                  checked={editKiosk.isOnline}
                  onChange={(e) => setEditKiosk({ ...editKiosk, isOnline: e.target.checked })}
                />
                Online
              </label>
              <label className="merchant-details__label">
                Face status
                <input
                  value={editKiosk.faceStatus}
                  onChange={(e) => setEditKiosk({ ...editKiosk, faceStatus: e.target.value })}
                />
              </label>
              <label className="merchant-details__label">
                Camera status
                <input
                  value={editKiosk.cameraStatus}
                  onChange={(e) => setEditKiosk({ ...editKiosk, cameraStatus: e.target.value })}
                />
              </label>
              <label className="merchant-details__check">
                <input
                  type="checkbox"
                  checked={editKiosk.isActive}
                  onChange={(e) => setEditKiosk({ ...editKiosk, isActive: e.target.checked })}
                />
                Device active
              </label>
              {ekError ? (
                <p role="alert" className="merchant-details__err">
                  {ekError}
                </p>
              ) : null}
              <div className="merchant-details__modal-actions">
                <button type="button" className="btn btn--secondary btn--sm" onClick={() => setEditKiosk(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary btn--sm" disabled={ekSubmitting}>
                  {ekSubmitting ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
