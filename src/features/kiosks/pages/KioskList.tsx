import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector, useDebouncedValue } from '../../../app/hooks'
import { createMerchantKiosk } from '../../merchants/merchantSlice'
import { loadKiosks, removeKiosk } from '../kioskSlice'
import { buildCreateKioskPayload } from '../../merchants/merchantAPI'
import { ROUTES } from '../../../core/config/routes'
import { ROLES, canManageKiosks } from '../../../core/constants/roles'
import { KioskCard } from '../components/KioskCard'
import '../../../layout/Layout.css'
import './KioskList.css'

const PAGE_SIZE = 20
const POLL_MS = 25_000
const SCOPE_STORAGE_KEY = 'fp_kiosk_scope_merchant_id'

export function KioskList() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector((s) => s.auth.user)
  const canMutate = canManageKiosks(user?.role)

  const list = useAppSelector((s) => s.kiosks.list)
  const listMeta = useAppSelector((s) => s.kiosks.listMeta)
  const loading = useAppSelector((s) => s.kiosks.loadingList)
  const error = useAppSelector((s) => s.kiosks.error)

  const isMerchantAdmin = user?.role === ROLES.MERCHANT_ADMIN

  const [scopeMerchantIdInput, setScopeMerchantIdInput] = useState(() => {
    try {
      return sessionStorage.getItem(SCOPE_STORAGE_KEY) ?? ''
    } catch {
      return ''
    }
  })

  const scopedListId = isMerchantAdmin
    ? (user?.merchantId?.trim() || scopeMerchantIdInput.trim() || undefined)
    : undefined

  const [page, setPage] = useState(1)
  const [qInput, setQInput] = useState('')
  const debouncedQ = useDebouncedValue(qInput, 400)
  const [network, setNetwork] = useState<'online' | 'offline' | ''>('')

  const [addOpen, setAddOpen] = useState(false)
  const [addSubmitting, setAddSubmitting] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [kioskMerchantId, setKioskMerchantId] = useState('')
  const [kSerial, setKSerial] = useState('')
  const [kOnline, setKOnline] = useState(true)
  const [kFace, setKFace] = useState('ok')
  const [kCam, setKCam] = useState('ok')

  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    try {
      sessionStorage.setItem(SCOPE_STORAGE_KEY, scopeMerchantIdInput)
    } catch {
      /* ignore */
    }
  }, [scopeMerchantIdInput])

  useEffect(() => {
    setPage(1)
  }, [debouncedQ, network])

  useEffect(() => {
    if (isMerchantAdmin && !scopedListId) {
      return
    }
    void dispatch(
      loadKiosks({
        page,
        pageSize: PAGE_SIZE,
        q: debouncedQ,
        network,
        merchantScopeId: scopedListId,
      })
    )
  }, [dispatch, page, debouncedQ, network, scopedListId, isMerchantAdmin])

  useEffect(() => {
    if (isMerchantAdmin && !scopedListId) {
      return
    }
    const t = window.setInterval(() => {
      void dispatch(
        loadKiosks({
          page,
          pageSize: PAGE_SIZE,
          q: debouncedQ,
          network,
          merchantScopeId: scopedListId,
        })
      )
    }, POLL_MS)
    return () => window.clearInterval(t)
  }, [dispatch, page, debouncedQ, network, scopedListId, isMerchantAdmin])

  useEffect(() => {
    if (!addOpen) return
    const initial =
      user?.merchantId?.trim() ||
      scopeMerchantIdInput.trim() ||
      kioskMerchantId.trim() ||
      ''
    setKioskMerchantId(initial)
  }, [addOpen, user?.merchantId, scopeMerchantIdInput])

  function openDetail(id: string) {
    navigate(ROUTES.KIOSK_DETAIL.replace(':kioskId', id))
  }

  async function handleAddKiosk(e: FormEvent) {
    e.preventDefault()
    const targetMerchantId = kioskMerchantId.trim()
    if (!targetMerchantId) {
      setAddError('Enter the merchant ID for this kiosk (UUID, number, or string from your portal).')
      return
    }
    if (!kSerial.trim()) {
      setAddError('Enter a serial ID.')
      return
    }
    setAddError(null)
    setAddSubmitting(true)
    try {
      await dispatch(
        createMerchantKiosk({
          merchantId: targetMerchantId,
          payload: buildCreateKioskPayload(kSerial.trim(), kOnline, kFace, kCam),
        })
      ).unwrap()
      await dispatch(
        loadKiosks({
          page,
          pageSize: PAGE_SIZE,
          q: debouncedQ,
          network,
          merchantScopeId: isMerchantAdmin ? scopedListId : undefined,
        })
      ).unwrap()
      setAddOpen(false)
      setKSerial('')
      setKOnline(true)
      setKFace('ok')
      setKCam('ok')
    } catch (err) {
      setAddError(typeof err === 'string' ? err : 'Could not register kiosk.')
    } finally {
      setAddSubmitting(false)
    }
  }

  async function handleDelete(kioskId: string, merchantId: string, label: string) {
    if (!window.confirm(`Delete kiosk ${label}?`)) return
    setDeletingId(kioskId)
    try {
      await dispatch(removeKiosk({ merchantId, kioskId })).unwrap()
    } catch {
      /* slice */
    } finally {
      setDeletingId(null)
    }
  }

  const { page: curPage, pageSize, totalItems, totalPages } = listMeta
  const start = totalItems === 0 ? 0 : (curPage - 1) * pageSize + 1
  const end = Math.min(curPage * pageSize, totalItems)
  const onlineOnPage = list.filter((k) => k.networkStatus === 'ONLINE').length
  const offlineOnPage = list.filter((k) => k.networkStatus === 'OFFLINE').length

  return (
    <div className="kiosk-list page-shell">
      <header className="page-header">
        <div>
          <p className="page-kicker">Fleet</p>
          <h1 className="page-title">Kiosk inventory</h1>
          <p className="page-desc">
            {isMerchantAdmin
              ? `Enter your merchant ID below to load kiosks (GET /merchants/{merchant_id}/kiosks). Same ID is used when registering a device. Refreshes every ${POLL_MS / 1000}s.`
              : `Live data from GET /kiosks when available. Refreshes every ${POLL_MS / 1000}s.`}
          </p>
        </div>
        <div className="kiosk-list__actions">
          {canMutate ? (
            <button type="button" className="btn btn--primary btn--sm" onClick={() => setAddOpen(true)}>
              + Register kiosk
            </button>
          ) : null}
        </div>
      </header>

      {isMerchantAdmin && !user?.merchantId ? (
        <p className="kiosk-list__banner kiosk-list__banner--info" role="note">
          <strong>Tip:</strong> If login does not return a merchant id, type your merchant ID in the field below (and in
          the register form) so the app can call the correct API paths.
        </p>
      ) : null}

      {error ? (
        <p className="kiosk-list__banner kiosk-list__banner--error" role="alert">
          {error}
        </p>
      ) : null}

      {isMerchantAdmin && !scopedListId ? (
        <p className="kiosk-list__banner kiosk-list__banner--warn" role="status">
          Enter your <strong>merchant ID</strong> below to load this merchant’s kiosks. The table stays empty until
          a valid ID is set.
        </p>
      ) : null}

      <section className="kiosk-list__stats" aria-label="Kiosk summary">
        <article className="kiosk-list__stat card-surface">
          <h2 className="kiosk-list__stat-label">Total kiosks</h2>
          <p className="kiosk-list__stat-value">{totalItems.toLocaleString()}</p>
          <span className="kiosk-list__chip kiosk-list__chip--ok">API total</span>
        </article>
        <article className="kiosk-list__stat card-surface">
          <h2 className="kiosk-list__stat-label">Online (this page)</h2>
          <p className="kiosk-list__stat-value">{onlineOnPage}</p>
          <span className="kiosk-list__dot-live" aria-hidden />
        </article>
        <article className="kiosk-list__stat card-surface">
          <h2 className="kiosk-list__stat-label">Offline (this page)</h2>
          <p className="kiosk-list__stat-value">{offlineOnPage}</p>
          <span className="kiosk-list__priority">Review</span>
        </article>
        <article className="kiosk-list__stat card-surface">
          <h2 className="kiosk-list__stat-label">Page</h2>
          <p className="kiosk-list__stat-value">
            {curPage} / {Math.max(1, totalPages)}
          </p>
          <span className="kiosk-list__chip kiosk-list__chip--ok">{pageSize} / page</span>
        </article>
      </section>

      {isMerchantAdmin ? (
        <section className="kiosk-list__scope card-surface" aria-label="Merchant scope">
          <label className="kiosk-list__scope-label">
            <span className="kiosk-list__field-label">Merchant ID (load fleet)</span>
            <input
              className="kiosk-list__input"
              type="text"
              value={scopeMerchantIdInput}
              onChange={(e) => setScopeMerchantIdInput(e.target.value)}
              placeholder="Paste UUID, number, or string id"
              autoComplete="off"
            />
          </label>
          <p className="kiosk-list__scope-hint">
            Saved in this browser session. Path segment is the portal merchant <code>id</code> (same as kiosk registration).
          </p>
        </section>
      ) : null}

      <section className="kiosk-list__toolbar card-surface" aria-label="Search and filters">
        <label className="kiosk-list__field">
          <span className="kiosk-list__field-label">Search</span>
          <input
            className="kiosk-list__input"
            type="search"
            placeholder="Serial ID"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            autoComplete="off"
          />
        </label>
        <label className="kiosk-list__field">
          <span className="kiosk-list__field-label">Connectivity</span>
          <select className="kiosk-list__input" value={network} onChange={(e) => setNetwork(e.target.value as typeof network)}>
            <option value="">All</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>
        </label>
      </section>

      <section className="kiosk-list__panel card-surface" aria-labelledby="kiosk-inv-title">
        <h2 id="kiosk-inv-title" className="visually-hidden">
          Kiosk inventory table
        </h2>
        {loading && isMerchantAdmin && scopedListId ? (
          <p className="kiosk-list__loading" role="status">
            Loading kiosks…
          </p>
        ) : null}
        {loading && !isMerchantAdmin ? (
          <p className="kiosk-list__loading" role="status">
            Loading kiosks…
          </p>
        ) : null}
        <div className="kiosk-list__cards">
          {list.map((k) => (
            <KioskCard key={k.id} kiosk={k} onOpen={openDetail} />
          ))}
        </div>
        <div className="kiosk-list__scroll">
          <table className="kiosk-list__table">
            <thead>
              <tr>
                <th scope="col">Serial ID</th>
                <th scope="col">Location</th>
                <th scope="col">Network status</th>
                <th scope="col">Health check</th>
                <th scope="col">Last sync</th>
                <th scope="col">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((k) => (
                <tr key={k.id}>
                  <td>
                    <button type="button" className="kiosk-list__id-btn" onClick={() => openDetail(k.id)}>
                      {k.serialId}
                    </button>
                  </td>
                  <td>{k.location}</td>
                  <td>
                    <span className={`kiosk-list__pill kiosk-list__pill--${k.networkStatus.toLowerCase()}`}>
                      {k.networkStatus}
                    </span>
                  </td>
                  <td>
                    {k.healthPct}% · {k.healthLabel}
                  </td>
                  <td>{k.lastSync}</td>
                  <td>
                    {canMutate ? (
                      <button
                        type="button"
                        className="kiosk-list__kebab"
                        disabled={deletingId === k.id}
                        aria-label={`Delete ${k.serialId}`}
                        title="Delete kiosk"
                        onClick={() => handleDelete(k.id, k.merchantId, k.serialId)}
                      >
                        {deletingId === k.id ? '…' : '✕'}
                      </button>
                    ) : (
                      <span className="kiosk-list__muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer className="kiosk-list__footer">
          <span>
            Showing {start}–{end} of {totalItems.toLocaleString()} results
          </span>
          <nav className="kiosk-list__pager" aria-label="Pagination">
            <button
              type="button"
              disabled={curPage <= 1 || loading}
              aria-label="Previous page"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ‹
            </button>
            <button type="button" className="kiosk-list__page-active" aria-current="page">
              {curPage}
            </button>
            <button
              type="button"
              disabled={curPage >= totalPages || loading || totalPages === 0}
              aria-label="Next page"
              onClick={() => setPage((p) => p + 1)}
            >
              ›
            </button>
          </nav>
        </footer>
      </section>

      {canMutate ? (
        <button type="button" className="kiosk-list__fab" aria-label="Register kiosk" onClick={() => setAddOpen(true)}>
          +
        </button>
      ) : null}

      {addOpen ? (
        <div className="kiosk-list__modal-root">
          <button type="button" className="kiosk-list__backdrop" aria-label="Close" onClick={() => !addSubmitting && setAddOpen(false)} />
          <div className="kiosk-list__modal card-surface" role="dialog" aria-modal="true">
            <h2 className="kiosk-list__modal-title">Register kiosk</h2>
            <form onSubmit={handleAddKiosk} className="kiosk-list__modal-form">
              <label className="kiosk-list__label">
                Merchant ID
                <input
                  className="kiosk-list__input"
                  required
                  value={kioskMerchantId}
                  onChange={(e) => setKioskMerchantId(e.target.value)}
                  placeholder="UUID, number, or string — path to POST /merchants/{id}/kiosks"
                  autoComplete="off"
                />
              </label>
              <p className="kiosk-list__modal-hint">
                Must be the <strong>Support Portal merchant primary key</strong> (the <code>id</code> returned from{' '}
                <code>POST /merchants</code>), not an id from another database. If the API responds with &quot;Merchant
                not found&quot;, this UUID is not in the portal—create the merchant here first or copy the id from the
                green banner on the Merchants page after onboarding.
              </p>
              <label className="kiosk-list__label">
                Serial ID
                <input className="kiosk-list__input" required value={kSerial} onChange={(e) => setKSerial(e.target.value)} />
              </label>
              <label className="kiosk-list__check">
                <input type="checkbox" checked={kOnline} onChange={(e) => setKOnline(e.target.checked)} />
                Online
              </label>
              <label className="kiosk-list__label">
                Face status
                <input className="kiosk-list__input" value={kFace} onChange={(e) => setKFace(e.target.value)} />
              </label>
              <label className="kiosk-list__label">
                Camera status
                <input className="kiosk-list__input" value={kCam} onChange={(e) => setKCam(e.target.value)} />
              </label>
              {addError ? (
                <p className="kiosk-list__err" role="alert">
                  {addError}
                </p>
              ) : null}
              <div className="kiosk-list__modal-actions">
                <button type="button" className="btn btn--secondary btn--sm" onClick={() => setAddOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary btn--sm" disabled={addSubmitting}>
                  {addSubmitting ? 'Saving…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
