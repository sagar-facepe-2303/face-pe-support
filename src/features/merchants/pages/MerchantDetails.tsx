import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { clearMerchantDetail, loadMerchantDetail } from '../merchantSlice'
import '../../../layout/Layout.css'
import './MerchantDetails.css'

export function MerchantDetails() {
  const { merchantId } = useParams<{ merchantId: string }>()
  const dispatch = useAppDispatch()
  const merchant = useAppSelector((s) => s.merchants.current)
  const kiosks = useAppSelector((s) => s.merchants.kiosks)
  const loading = useAppSelector((s) => s.merchants.loadingDetail)

  useEffect(() => {
    if (merchantId) {
      dispatch(loadMerchantDetail(merchantId))
    }
    return () => {
      dispatch(clearMerchantDetail())
    }
  }, [dispatch, merchantId])

  if (!merchantId) {
    return <p role="alert">Missing merchant identifier.</p>
  }

  if (loading || !merchant) {
    return (
      <div className="merchant-details page-shell">
        <p role="status">Loading merchant…</p>
      </div>
    )
  }

  return (
    <div className="merchant-details page-shell">
      <nav className="merchant-details__crumb" aria-label="Breadcrumb">
        Merchants · <span>{merchant.name}</span>
      </nav>
      <header className="merchant-details__head page-header">
        <div>
          <h1 className="page-title">{merchant.name}</h1>
          <p className="merchant-details__sub">
            Merchant ID: <strong>{merchant.registrationNumber}</strong>
          </p>
        </div>
        <div className="merchant-details__actions">
          <button type="button" className="btn btn--secondary btn--sm">
            Edit details
          </button>
          <button type="button" className="btn btn--primary btn--sm">
            Quick action
          </button>
        </div>
      </header>

      <div className="merchant-details__grid">
        <section className="merchant-details__card card-surface" aria-labelledby="basic-info">
          <div className="merchant-details__card-head">
            <h2 id="basic-info" className="merchant-details__card-title">
              Basic information
            </h2>
            <span className="merchant-details__verified">Verified merchant</span>
          </div>
          <dl className="merchant-details__dl">
            <div>
              <dt>Legal entity name</dt>
              <dd>{merchant.legalEntity}</dd>
            </div>
            <div>
              <dt>Registration number</dt>
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
          </dl>
          <div className="merchant-details__settlement">
            <div>
              <p className="merchant-details__settlement-label">Settlement method</p>
              <p className="merchant-details__settlement-value">{merchant.settlementMethod}</p>
            </div>
            <button type="button" className="merchant-details__change">
              Change →
            </button>
          </div>
        </section>

        <div className="merchant-details__aside">
          <section className="merchant-details__card card-surface" aria-label="Live status">
            <h2 className="merchant-details__card-title">Live status</h2>
            <ul className="merchant-details__status-list">
              <li>
                <span className="merchant-details__pill merchant-details__pill--ok">Active</span>
              </li>
              <li>
                API connectivity <strong>{merchant.apiUptime}</strong>
              </li>
              <li>
                Risk level{' '}
                <span className="merchant-details__pill merchant-details__pill--low">{merchant.riskLevel}</span>
              </li>
              <li>
                Growth <strong>{merchant.growth}</strong>
              </li>
            </ul>
            <div className="merchant-details__meter" role="presentation">
              <span className="merchant-details__meter-fill" />
            </div>
          </section>
          <section className="merchant-details__map card-surface" aria-label="Active region">
            <div className="merchant-details__map-visual" />
            <div className="merchant-details__map-cap">
              Active region · <strong>North America East</strong>
            </div>
          </section>
        </div>
      </div>

      <section className="merchant-details__kiosks card-surface" aria-labelledby="kiosks-heading">
        <header className="merchant-details__kiosks-head">
          <h2 id="kiosks-heading" className="merchant-details__card-title">
            Associated kiosks ({kiosks.length} active)
          </h2>
          <button type="button" className="btn btn--ghost btn--sm">
            Manage all kiosks
          </button>
        </header>
        <div className="merchant-details__table-wrap">
          <table className="merchant-details__table">
            <thead>
              <tr>
                <th scope="col">Kiosk ID</th>
                <th scope="col">Location name</th>
                <th scope="col">Daily traffic</th>
                <th scope="col">Last sync</th>
                <th scope="col">Battery</th>
                <th scope="col">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {kiosks.map((k) => (
                <tr key={k.kioskId}>
                  <td>{k.kioskId}</td>
                  <td>{k.locationName}</td>
                  <td>{k.dailyTraffic}</td>
                  <td>{k.lastSync}</td>
                  <td>
                    <span
                      className={
                        k.batteryLow
                          ? 'merchant-details__battery merchant-details__battery--low'
                          : 'merchant-details__battery'
                      }
                      aria-label={`Battery ${k.batteryPct} percent`}
                    >
                      {k.batteryPct}%
                    </span>
                  </td>
                  <td>
                    <button type="button" className="merchant-details__kebab" aria-label="Row actions">
                      ⋮
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="merchant-details__footer">
        © 2026 FacePe International · Support system v2.4.1
      </footer>
    </div>
  )
}
