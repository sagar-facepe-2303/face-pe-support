import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { clearUserDetail, loadUserDetail } from '../userSlice'
import { UserInfo } from '../components/UserInfo'
import { formatCurrency } from '../../../core/utils/helpers'
import '../../../layout/Layout.css'
import './UserDetails.css'

export function UserDetails() {
  const { userId } = useParams<{ userId: string }>()
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.users.current)
  const transactions = useAppSelector((s) => s.users.transactions)
  const loading = useAppSelector((s) => s.users.loadingDetail)

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

  if (loading || !user) {
    return (
      <div className="user-details page-shell">
        <p role="status">Loading profile…</p>
      </div>
    )
  }

  return (
    <div className="user-details page-shell">
      <nav className="user-details__crumb" aria-label="Breadcrumb">
        Users · User profile
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
                  {transactions.map((t) => (
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
                  ))}
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
