import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { loadUsers } from '../userSlice'
import { ROUTES } from '../../../core/config/routes'
import { formatDisplayDate } from '../../../core/utils/helpers'
import '../../../layout/Layout.css'
import './UserList.css'

export function UserList() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const list = useAppSelector((s) => s.users.list)
  const loading = useAppSelector((s) => s.users.loadingList)
  const [filter, setFilter] = useState<'all' | 'ACTIVE' | 'INACTIVE'>('all')

  useEffect(() => {
    dispatch(loadUsers())
  }, [dispatch])

  const filtered =
    filter === 'all'
      ? list
      : filter === 'ACTIVE'
        ? list.filter((u) => u.status === 'ACTIVE')
        : list.filter((u) => u.status !== 'ACTIVE')

  return (
    <div className="user-list page-shell">
      <header className="page-header">
        <div>
          <h1 className="page-title">User directory</h1>
          <p className="page-desc">
            Manage and monitor all platform users within the FacePe ecosystem.
          </p>
        </div>
        <div className="user-list__actions">
          <button type="button" className="btn btn--secondary btn--sm">
            Export list
          </button>
          <button type="button" className="btn btn--primary btn--sm">
            + Create new user
          </button>
        </div>
      </header>

      <div className="user-list__toolbar">
        <div className="user-list__pills" role="tablist" aria-label="User filters">
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'all'}
            className={filter === 'all' ? 'user-list__pill user-list__pill--on' : 'user-list__pill'}
            onClick={() => setFilter('all')}
          >
            All users (1,284)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'ACTIVE'}
            className={filter === 'ACTIVE' ? 'user-list__pill user-list__pill--on' : 'user-list__pill'}
            onClick={() => setFilter('ACTIVE')}
          >
            Active
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'INACTIVE'}
            className={filter === 'INACTIVE' ? 'user-list__pill user-list__pill--on' : 'user-list__pill'}
            onClick={() => setFilter('INACTIVE')}
          >
            Inactive
          </button>
        </div>
        <div className="user-list__insights">
          <article className="user-list__insight card-surface">
            <p className="user-list__insight-label">New monthly</p>
            <p className="user-list__insight-value">+12% growth</p>
          </article>
          <article className="user-list__insight card-surface">
            <p className="user-list__insight-label">Trust score</p>
            <p className="user-list__insight-value">98.2% verified</p>
          </article>
        </div>
      </div>

      <section className="user-list__table-card card-surface" aria-labelledby="users-table-title">
        <h2 id="users-table-title" className="visually-hidden">
          Users table
        </h2>
        {loading ? (
          <p className="user-list__loading" role="status">
            Loading users…
          </p>
        ) : null}
        <div className="user-list__scroll">
          <table className="user-list__table">
            <thead>
              <tr>
                <th scope="col">User profile</th>
                <th scope="col">Email address</th>
                <th scope="col">Status</th>
                <th scope="col">Created date</th>
                <th scope="col">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>
                    <button
                      type="button"
                      className="user-list__user-btn"
                      onClick={() => navigate(ROUTES.USER_DETAIL.replace(':userId', u.id))}
                    >
                      <span className="user-list__avatar" aria-hidden>
                        {u.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                      <span className="user-list__name">{u.name}</span>
                    </button>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`user-list__status user-list__status--${u.status.toLowerCase()}`}>
                      {u.status}
                    </span>
                  </td>
                  <td>
                    <time dateTime={u.createdAt}>{formatDisplayDate(u.createdAt)}</time>
                  </td>
                  <td>
                    <button type="button" className="user-list__kebab" aria-label={`Actions for ${u.name}`}>
                      ⋮
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer className="user-list__footer">
          <span>
            Showing 1 to {filtered.length} of 1,284 users
          </span>
          <nav className="user-list__pager" aria-label="Pagination">
            <button type="button" disabled aria-label="Previous page">
              ‹
            </button>
            <button type="button" className="user-list__page-on" aria-current="page">
              1
            </button>
            <button type="button" aria-label="Next page">
              ›
            </button>
          </nav>
        </footer>
      </section>

      <section className="user-list__banner" aria-label="Weekly user insights">
        <div>
          <h2 className="user-list__banner-title">Weekly user insights</h2>
          <p className="user-list__banner-text">
            Your user base has increased by 14% this week. Most new signups are from the Merchants
            sector in North America.
          </p>
        </div>
        <div className="user-list__banner-stats">
          <div>
            <p className="user-list__banner-k">2.4k</p>
            <p className="user-list__banner-l">Daily act.</p>
          </div>
          <div>
            <p className="user-list__banner-k">48s</p>
            <p className="user-list__banner-l">Avg onboarding</p>
          </div>
        </div>
      </section>
    </div>
  )
}
