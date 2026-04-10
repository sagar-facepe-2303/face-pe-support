import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector, useDebouncedValue } from '../../../app/hooks'
import { createMerchantKiosk, loadMerchants } from '../../merchants/merchantSlice'
import { loadKiosks, removeKiosk } from '../kioskSlice'
import { ROUTES } from '../../../core/config/routes'
import { canManageKiosks } from '../../../core/constants/roles'
import { KioskCard } from '../components/KioskCard'
import '../../../layout/Layout.css'
import './KioskList.css'

const PAGE_SIZE = 20
const POLL_MS = 25_000

export function KioskList() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector((s) => s.auth.user)
  const canMutate = canManageKiosks(user?.role)

  const list = useAppSelector((s) => s.kiosks.list)
  const listMeta = useAppSelector((s) => s.kiosks.listMeta)
  const loading = useAppSelector((s) => s.kiosks.loadingList)
  const error = useAppSelector((s) => s.kiosks.error)
  const merchantsForSelect = useAppSelector((s) => s.merchants.list)

  const [page, setPage] = useState(1)
  const [qInput, setQInput] = useState('')
  const debouncedQ = useDebouncedValue(qInput, 400)
  const [network, setNetwork] = useState<'online' | 'offline' | ''>('')

  const [addOpen, setAddOpen] = useState(false)
  const [addSubmitting, setAddSubmitting] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [pickMerchant, setPickMerchant] = useState('')
  const [kSerial, setKSerial] = useState('')
  const [kOnline, setKOnline] = useState(true)
  const [kFace, setKFace] = useState('ok')
  const [kCam, setKCam] = useState('ok')

  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    setPage(1)
  }, [debouncedQ, network])

  useEffect(() => {
    void dispatch(
      loadKiosks({
        page,
        pageSize: PAGE_SIZE,
        q: debouncedQ,
        network,
      })
    )
  }, [dispatch, page, debouncedQ, network])

  useEffect(() => {
    const t = window.setInterval(() => {
      void dispatch(
        loadKiosks({
          page,
          pageSize: PAGE_SIZE,
          q: debouncedQ,
          network,
        })
      )
    }, POLL_MS)
    return () => window.clearInterval(t)
  }, [dispatch, page, debouncedQ, network])

  useEffect(() => {
    if (addOpen) {
      void dispatch(loadMerchants({ page: 1, pageSize: 100, q: '', status: '' }))
    }
  }, [addOpen, dispatch])

  function openDetail(id: string) {
    navigate(ROUTES.KIOSK_DETAIL.replace(':kioskId', id))
  }

  async function handleAddKiosk(e: FormEvent) {
    e.preventDefault()
    if (!pickMerchant) {
      setAddError('Select a merchant.')
      return
    }
    setAddError(null)
    setAddSubmitting(true)
    try {
      await dispatch(
        createMerchantKiosk({
          merchantId: pickMerchant,
          payload: {
            serial_id: kSerial.trim(),
            is_online: kOnline,
            face_status: kFace.trim() || 'ok',
            camera_status: kCam.trim() || 'ok',
          },
        })
      ).unwrap()
      await dispatch(
        loadKiosks({
          page,
          pageSize: PAGE_SIZE,
          q: debouncedQ,
          network,
        })
      ).unwrap()
      setAddOpen(false)
      setPickMerchant('')
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
            Live data from GET /kiosks. The table refreshes every {POLL_MS / 1000}s while you stay on this page.
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

      {error ? (
        <p className="kiosk-list__banner kiosk-list__banner--error" role="alert">
          {error}
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
        {loading ? (
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
                Merchant
                <select
                  required
                  className="kiosk-list__input"
                  value={pickMerchant}
                  onChange={(e) => setPickMerchant(e.target.value)}
                >
                  <option value="" disabled>
                    Select merchant
                  </option>
                  {merchantsForSelect.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.category})
                    </option>
                  ))}
                </select>
              </label>
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
