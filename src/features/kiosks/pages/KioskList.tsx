import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { loadKiosks } from '../kioskSlice'
import { ROUTES } from '../../../core/config/routes'
import { KioskCard } from '../components/KioskCard'
import '../../../layout/Layout.css'
import './KioskList.css'

export function KioskList() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const list = useAppSelector((s) => s.kiosks.list)
  const loading = useAppSelector((s) => s.kiosks.loadingList)

  useEffect(() => {
    dispatch(loadKiosks())
  }, [dispatch])

  function openDetail(id: string) {
    navigate(ROUTES.KIOSK_DETAIL.replace(':kioskId', id))
  }

  return (
    <div className="kiosk-list page-shell">
      <header className="page-header">
        <div>
          <p className="page-kicker">Fleet</p>
          <h1 className="page-title">Kiosk inventory</h1>
          <p className="page-desc">Real-time health monitoring and connectivity status.</p>
        </div>
        <div className="kiosk-list__actions">
          <button type="button" className="btn btn--secondary btn--sm">
            Filter
          </button>
          <button type="button" className="btn btn--primary btn--sm">
            Export data
          </button>
        </div>
      </header>

      <section className="kiosk-list__stats" aria-label="Kiosk summary">
        <article className="kiosk-list__stat card-surface">
          <h2 className="kiosk-list__stat-label">Total kiosks</h2>
          <p className="kiosk-list__stat-value">1,284</p>
          <span className="kiosk-list__chip kiosk-list__chip--ok">+12%</span>
        </article>
        <article className="kiosk-list__stat card-surface">
          <h2 className="kiosk-list__stat-label">Online now</h2>
          <p className="kiosk-list__stat-value">1,192</p>
          <span className="kiosk-list__dot-live" aria-label="Healthy fleet" />
        </article>
        <article className="kiosk-list__stat card-surface">
          <h2 className="kiosk-list__stat-label">Action needed</h2>
          <p className="kiosk-list__stat-value">12</p>
          <span className="kiosk-list__priority">High priority</span>
        </article>
        <article className="kiosk-list__quick card-surface" aria-label="Quick action">
          <p className="kiosk-list__quick-label">Quick action</p>
          <p className="kiosk-list__quick-title">Register kiosk →</p>
        </article>
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
                    <button type="button" className="kiosk-list__kebab" aria-label={`Actions for ${k.serialId}`}>
                      ⋮
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer className="kiosk-list__footer">
          <span>Showing 1–{list.length} of 1,284 results</span>
          <nav className="kiosk-list__pager" aria-label="Pagination">
            <button type="button" disabled aria-label="Previous page">
              ‹
            </button>
            <button type="button" className="kiosk-list__page-active" aria-current="page">
              1
            </button>
            <button type="button" aria-label="Next page">
              ›
            </button>
          </nav>
        </footer>
      </section>

      <button type="button" className="kiosk-list__fab" aria-label="Add kiosk">
        +
      </button>
    </div>
  )
}
