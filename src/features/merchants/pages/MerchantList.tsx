import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { loadMerchants } from '../merchantSlice'
import { ROUTES } from '../../../core/config/routes'
import { formatDisplayDate } from '../../../core/utils/helpers'
import { MerchantCard } from '../components/MerchantCard'
import '../../../layout/Layout.css'
import './MerchantList.css'

export function MerchantList() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const list = useAppSelector((s) => s.merchants.list)
  const loading = useAppSelector((s) => s.merchants.loadingList)

  useEffect(() => {
    dispatch(loadMerchants())
  }, [dispatch])

  function openRow(id: string) {
    navigate(ROUTES.MERCHANT_DETAIL.replace(':merchantId', id))
  }

  return (
    <div className="merchant-list page-shell">
      <header className="page-header">
        <div>
          <p className="page-kicker">Management</p>
          <h1 className="page-title">Merchant directory</h1>
          <p className="page-desc">
            Manage and monitor verified retail partners across the network.
          </p>
        </div>
        <div className="merchant-list__actions">
          <button type="button" className="btn btn--secondary btn--sm">
            Filters
          </button>
          <button type="button" className="btn btn--primary btn--sm">
            + Onboard merchant
          </button>
        </div>
      </header>

      <section className="merchant-list__stats" aria-label="Merchant summary">
        <article className="merchant-list__stat card-surface">
          <h2 className="merchant-list__stat-label">Total partners</h2>
          <p className="merchant-list__stat-value">1,284</p>
          <span className="merchant-list__trend">~12%</span>
        </article>
        <article className="merchant-list__stat card-surface">
          <h2 className="merchant-list__stat-label">Active volume</h2>
          <p className="merchant-list__stat-value">$2.4M</p>
          <span className="merchant-list__trend">~8%</span>
        </article>
        <article className="merchant-list__stat card-surface">
          <h2 className="merchant-list__stat-label">Pending verification</h2>
          <p className="merchant-list__stat-value merchant-list__stat-value--warn">42</p>
        </article>
        <article className="merchant-list__stat card-surface">
          <h2 className="merchant-list__stat-label">Support requests</h2>
          <p className="merchant-list__stat-value">18</p>
        </article>
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
                    <button
                      type="button"
                      className="merchant-list__kebab"
                      aria-label={`Actions for ${m.name}`}
                    >
                      ⋮
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="merchant-list__footer">
          <span>Showing 1–{list.length} of 1,284 results</span>
          <nav className="merchant-list__pagination" aria-label="Pagination">
            <button type="button" className="merchant-list__page merchant-list__page--nav" disabled aria-label="Previous page">
              ‹
            </button>
            <button type="button" className="merchant-list__page merchant-list__page--active" aria-current="page">
              1
            </button>
            <button type="button" className="merchant-list__page">
              2
            </button>
            <button type="button" className="merchant-list__page merchant-list__page--nav" aria-label="Next page">
              ›
            </button>
          </nav>
        </footer>
      </section>
    </div>
  )
}
