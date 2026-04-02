import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { clearKioskDetail, loadKioskDetail } from '../kioskSlice'
import '../../../layout/Layout.css'
import './KioskDetails.css'

export function KioskDetails() {
  const { kioskId } = useParams<{ kioskId: string }>()
  const dispatch = useAppDispatch()
  const k = useAppSelector((s) => s.kiosks.current)
  const loading = useAppSelector((s) => s.kiosks.loadingDetail)

  useEffect(() => {
    if (kioskId) {
      dispatch(loadKioskDetail(kioskId))
    }
    return () => {
      dispatch(clearKioskDetail())
    }
  }, [dispatch, kioskId])

  if (!kioskId) {
    return <p role="alert">Missing kiosk identifier.</p>
  }

  if (loading || !k) {
    return (
      <div className="kiosk-details page-shell">
        <p role="status">Loading kiosk…</p>
      </div>
    )
  }

  return (
    <div className="kiosk-details page-shell">
      <nav className="kiosk-details__crumb" aria-label="Breadcrumb">
        {k.breadcrumb}
      </nav>
      <header className="kiosk-details__head page-header">
        <div>
          <h1 className="page-title">{k.title}</h1>
          <div className="kiosk-details__badges">
            <span className="kiosk-details__online">
              <span className="kiosk-details__dot" aria-hidden />
              Online
            </span>
            <span className="kiosk-details__place">📍 {k.placeName}</span>
          </div>
        </div>
        <div className="kiosk-details__actions">
          <button type="button" className="btn btn--secondary btn--sm">
            Remote reboot
          </button>
          <button type="button" className="btn btn--primary btn--sm">
            Edit config
          </button>
        </div>
      </header>

      <section className="kiosk-details__health card-surface" aria-labelledby="hw-monitor">
        <div className="kiosk-details__health-head">
          <h2 id="hw-monitor" className="kiosk-details__section-title">
            Hardware health monitor
          </h2>
          <span className="kiosk-details__live-tag">Live diagnostics</span>
        </div>
        <div className="kiosk-details__health-grid">
          <div>
            <p className="kiosk-details__metric-label">CPU usage</p>
            <p className="kiosk-details__metric-value">{k.cpuPct}%</p>
            <div className="kiosk-details__bar">
              <span style={{ width: `${k.cpuPct}%` }} />
            </div>
            <p className="kiosk-details__metric-hint">Temperature steady at 42°C.</p>
          </div>
          <div>
            <p className="kiosk-details__metric-label">Memory</p>
            <p className="kiosk-details__metric-value">
              {k.memoryUsedGb} / {k.memoryTotalGb} GB
            </p>
            <div className="kiosk-details__bar">
              <span
                style={{
                  width: `${Math.round((k.memoryUsedGb / k.memoryTotalGb) * 100)}%`,
                }}
              />
            </div>
            <p className="kiosk-details__metric-hint">Background sync slightly elevated.</p>
          </div>
          <div>
            <p className="kiosk-details__metric-label">Camera lens</p>
            <p className="kiosk-details__metric-value kiosk-details__metric-value--ok">{k.cameraStatus}</p>
            <div className="kiosk-details__bar kiosk-details__bar--ok">
              <span style={{ width: '98%' }} />
            </div>
            <p className="kiosk-details__metric-hint">Clarity score 98.4%.</p>
          </div>
        </div>
      </section>

      <div className="kiosk-details__lower">
        <section className="kiosk-details__chart card-surface" aria-label="Transaction volume">
          <header className="kiosk-details__chart-head">
            <h2 className="kiosk-details__section-title">Transaction volume</h2>
            <div className="kiosk-details__toggle" role="group" aria-label="Range">
              <button type="button" className="kiosk-details__toggle-btn kiosk-details__toggle-btn--on">
                24H
              </button>
              <button type="button" className="kiosk-details__toggle-btn">
                7D
              </button>
            </div>
          </header>
          <div className="kiosk-details__bars" role="img" aria-label="Hourly volume chart placeholder">
            {Array.from({ length: 12 }).map((_, i) => (
              <span
                key={i}
                className={i === 4 ? 'kiosk-details__vol kiosk-details__vol--peak' : 'kiosk-details__vol'}
              />
            ))}
          </div>
        </section>

        <aside className="kiosk-details__side">
          <section className="kiosk-details__spec card-surface" aria-label="Device specifications">
            <h2 className="kiosk-details__section-title">Device specifications</h2>
            <dl className="kiosk-details__spec-dl">
              <div>
                <dt>Model</dt>
                <dd>{k.model}</dd>
              </div>
              <div>
                <dt>Serial number</dt>
                <dd>{k.serialNumber}</dd>
              </div>
              <div>
                <dt>OS version</dt>
                <dd>{k.osVersion}</dd>
              </div>
              <div>
                <dt>Uptime</dt>
                <dd>{k.uptime}</dd>
              </div>
            </dl>
          </section>
          <div className="kiosk-details__hardware-visual card-surface" aria-hidden />
          <section className="kiosk-details__activity card-surface" aria-label="System activity">
            <header className="kiosk-details__activity-head">
              <h2 className="kiosk-details__section-title">System activity</h2>
              <button type="button" className="btn btn--ghost btn--sm">
                View all
              </button>
            </header>
            <ol className="kiosk-details__timeline">
              <li>Auth success · edge</li>
              <li>Manifest update</li>
              <li>Paper roll low</li>
              <li>System boot</li>
            </ol>
          </section>
        </aside>
      </div>

      <section className="kiosk-details__logins card-surface" aria-labelledby="logins-head">
        <header className="kiosk-details__logins-head">
          <h2 id="logins-head" className="kiosk-details__section-title">
            Recent terminal logins
          </h2>
        </header>
        <div className="kiosk-details__table-wrap">
          <table className="kiosk-details__table">
            <thead>
              <tr>
                <th scope="col">Session ID</th>
                <th scope="col">User account</th>
                <th scope="col">Duration</th>
                <th scope="col">Method</th>
                <th scope="col">Amount</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>SES-8821</td>
                <td>MH · user</td>
                <td>3m 12s</td>
                <td>Face</td>
                <td>$24.00</td>
                <td>
                  <span className="kiosk-details__status-ok">Completed</span>
                </td>
              </tr>
              <tr>
                <td>SES-8820</td>
                <td>EP · user</td>
                <td>—</td>
                <td>Card</td>
                <td>$120.00</td>
                <td>
                  <span className="kiosk-details__status-bad">Rejected</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <button type="button" className="kiosk-details__map-fab" aria-label="Open location map">
        ⌖
      </button>
    </div>
  )
}
