import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector, useDebouncedValue } from '../../../app/hooks'
import { createMerchant, loadMerchants, removeMerchant } from '../merchantSlice'
import { ROUTES } from '../../../core/config/routes'
import { canManageMerchants } from '../../../core/constants/roles'
import { formatDisplayDate } from '../../../core/utils/helpers'
import { MerchantCard } from '../components/MerchantCard'
import '../../../layout/Layout.css'
import './MerchantList.css'

const PAGE_SIZE = 20

export function MerchantList() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector((s) => s.auth.user)
  const canMutate = canManageMerchants(user?.role)

  const list = useAppSelector((s) => s.merchants.list)
  const listMeta = useAppSelector((s) => s.merchants.listMeta)
  const loading = useAppSelector((s) => s.merchants.loadingList)
  const error = useAppSelector((s) => s.merchants.error)

  const [page, setPage] = useState(1)
  const [qInput, setQInput] = useState('')
  const debouncedQ = useDebouncedValue(qInput, 400)
  const [statusFilter, setStatusFilter] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [createSubmitting, setCreateSubmitting] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [formCode, setFormCode] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPhone, setFormPhone] = useState('')

  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    setPage(1)
  }, [debouncedQ, statusFilter])

  useEffect(() => {
    void dispatch(
      loadMerchants({
        page,
        pageSize: PAGE_SIZE,
        q: debouncedQ,
        status: statusFilter,
      })
    )
  }, [dispatch, page, debouncedQ, statusFilter])

  function openRow(id: string) {
    navigate(ROUTES.MERCHANT_DETAIL.replace(':merchantId', id))
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setCreateError(null)
    setCreateSubmitting(true)
    try {
      await dispatch(
        createMerchant({
          merchant_name: formName.trim(),
          merchant_code: formCode.trim(),
          contact_email: formEmail.trim(),
          ...(formPhone.trim() ? { contact_phone: formPhone.trim() } : {}),
        })
      ).unwrap()
      setCreateOpen(false)
      setFormName('')
      setFormCode('')
      setFormEmail('')
      setFormPhone('')
    } catch (err) {
      setCreateError(typeof err === 'string' ? err : 'Could not create merchant.')
    } finally {
      setCreateSubmitting(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete merchant “${name}”? This may fail if the API does not support DELETE.`)) {
      return
    }
    setDeletingId(id)
    try {
      await dispatch(removeMerchant(id)).unwrap()
    } catch {
      /* error surfaced via slice */
    } finally {
      setDeletingId(null)
    }
  }

  const { page: curPage, pageSize, totalItems, totalPages } = listMeta
  const start = totalItems === 0 ? 0 : (curPage - 1) * pageSize + 1
  const end = Math.min(curPage * pageSize, totalItems)

  const activeOnPage = list.filter((m) => m.status === 'ACTIVE').length
  const pendingOnPage = list.filter((m) => m.status === 'PENDING').length

  return (
    <div className="merchant-list page-shell">
      <header className="page-header">
        <div>
          <p className="page-kicker">Management</p>
          <h1 className="page-title">Merchant directory</h1>
          <p className="page-desc">
            Manage and monitor retail partners. Data loads from the Support Portal API (GET /merchants).
          </p>
        </div>
        <div className="merchant-list__actions">
          {canMutate ? (
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() => {
                setCreateError(null)
                setCreateOpen(true)
              }}
            >
              + Onboard merchant
            </button>
          ) : null}
        </div>
      </header>

      {error ? (
        <p className="merchant-list__banner merchant-list__banner--error" role="alert">
          {error}
        </p>
      ) : null}

      <section className="merchant-list__stats" aria-label="Merchant summary">
        <article className="merchant-list__stat card-surface">
          <h2 className="merchant-list__stat-label">Total partners</h2>
          <p className="merchant-list__stat-value">{totalItems.toLocaleString()}</p>
          <span className="merchant-list__trend">API total</span>
        </article>
        <article className="merchant-list__stat card-surface">
          <h2 className="merchant-list__stat-label">Active (this page)</h2>
          <p className="merchant-list__stat-value">{activeOnPage}</p>
          <span className="merchant-list__trend">of {list.length} rows</span>
        </article>
        <article className="merchant-list__stat card-surface">
          <h2 className="merchant-list__stat-label">Pending (this page)</h2>
          <p className="merchant-list__stat-value merchant-list__stat-value--warn">{pendingOnPage}</p>
        </article>
        <article className="merchant-list__stat card-surface">
          <h2 className="merchant-list__stat-label">Pagination</h2>
          <p className="merchant-list__stat-value">
            {curPage} / {Math.max(1, totalPages)}
          </p>
          <span className="merchant-list__trend">{pageSize} per page</span>
        </article>
      </section>

      <section className="merchant-list__toolbar card-surface" aria-label="Search and filters">
        <label className="merchant-list__field">
          <span className="merchant-list__field-label">Search</span>
          <input
            className="merchant-list__input"
            type="search"
            placeholder="Name, code, or email"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            autoComplete="off"
          />
        </label>
        <label className="merchant-list__field">
          <span className="merchant-list__field-label">Status</span>
          <select
            className="merchant-list__input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
        </label>
      </section>

      <section className="merchant-list__table-card card-surface" aria-labelledby="merchants-table-title">
        <header className="merchant-list__table-head">
          <h2 id="merchants-table-title" className="merchant-list__table-title">
            Merchants
          </h2>
        </header>

        {loading ? (
          <p className="merchant-list__loading" role="status">
            Loading merchants…
          </p>
        ) : null}

        <div className="merchant-list__mobile">
          {list.map((m) => (
            <MerchantCard key={m.id} merchant={m} onOpen={openRow} />
          ))}
        </div>

        <div className="merchant-list__scroll">
          <table className="merchant-list__table">
            <thead>
              <tr>
                <th scope="col">Merchant identity</th>
                <th scope="col">Email address</th>
                <th scope="col">Status</th>
                <th scope="col">Registered date</th>
                <th scope="col">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((m) => (
                <tr key={m.id}>
                  <td>
                    <button
                      type="button"
                      className="merchant-list__linklike"
                      onClick={() => openRow(m.id)}
                    >
                      <strong>{m.name}</strong>
                      <span className="merchant-list__sub">
                        {m.category} · {m.location}
                      </span>
                    </button>
                  </td>
                  <td>{m.email}</td>
                  <td>
                    <span className={`merchant-list__pill merchant-list__pill--${m.status.toLowerCase()}`}>
                      {m.status}
                    </span>
                  </td>
                  <td>
                    <time dateTime={m.registeredAt}>{formatDisplayDate(m.registeredAt)}</time>
                  </td>
                  <td>
                    {canMutate ? (
                      <button
                        type="button"
                        className="merchant-list__kebab"
                        disabled={deletingId === m.id}
                        aria-label={`Delete ${m.name}`}
                        onClick={() => handleDelete(m.id, m.name)}
                        title="Delete merchant"
                      >
                        {deletingId === m.id ? '…' : '✕'}
                      </button>
                    ) : (
                      <span className="merchant-list__sub">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="merchant-list__footer">
          <span>
            Showing {start}–{end} of {totalItems.toLocaleString()} results
          </span>
          <nav className="merchant-list__pagination" aria-label="Pagination">
            <button
              type="button"
              className="merchant-list__page merchant-list__page--nav"
              disabled={curPage <= 1 || loading}
              aria-label="Previous page"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ‹
            </button>
            <span className="merchant-list__page merchant-list__page--active" aria-current="page">
              {curPage}
            </span>
            <button
              type="button"
              className="merchant-list__page merchant-list__page--nav"
              disabled={curPage >= totalPages || loading || totalPages === 0}
              aria-label="Next page"
              onClick={() => setPage((p) => p + 1)}
            >
              ›
            </button>
          </nav>
        </footer>
      </section>

      {createOpen ? (
        <div className="merchant-list__modal-root" role="presentation">
          <button
            type="button"
            className="merchant-list__modal-backdrop"
            aria-label="Close dialog"
            onClick={() => !createSubmitting && setCreateOpen(false)}
          />
          <div className="merchant-list__modal card-surface" role="dialog" aria-modal="true" aria-labelledby="merchant-create-title">
            <h2 id="merchant-create-title" className="merchant-list__modal-title">
              Onboard merchant
            </h2>
            <form className="merchant-list__modal-form" onSubmit={handleCreate}>
              <label className="merchant-list__field">
                <span className="merchant-list__field-label">Merchant name</span>
                <input
                  className="merchant-list__input"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </label>
              <label className="merchant-list__field">
                <span className="merchant-list__field-label">Merchant code</span>
                <input
                  className="merchant-list__input"
                  required
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                />
              </label>
              <label className="merchant-list__field">
                <span className="merchant-list__field-label">Contact email</span>
                <input
                  className="merchant-list__input"
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                />
              </label>
              <label className="merchant-list__field">
                <span className="merchant-list__field-label">Contact phone (optional)</span>
                <input
                  className="merchant-list__input"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                />
              </label>
              {createError ? (
                <p className="merchant-list__banner merchant-list__banner--error" role="alert">
                  {createError}
                </p>
              ) : null}
              <div className="merchant-list__modal-actions">
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  disabled={createSubmitting}
                  onClick={() => setCreateOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary btn--sm" disabled={createSubmitting}>
                  {createSubmitting ? 'Saving…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
