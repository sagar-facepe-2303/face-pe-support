import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { loadSupportAgents } from '../supportSlice'
import { UserCard } from '../components/UserCard'
import { ROLES, getAssignableSupportRoles } from '../../../core/constants/roles'
import { ROUTES } from '../../../core/config/routes'
import '../../../layout/Layout.css'
import './Users.css'

/**
 * Support team roster (filename `Users.tsx` per project convention).
 */
export function Users() {
  const dispatch = useAppDispatch()
  const agents = useAppSelector((s) => s.support.agents)
  const loading = useAppSelector((s) => s.support.loadingAgents)
  const actorRole = useAppSelector((s) => s.auth.user?.role)
  const assignableRoles = getAssignableSupportRoles(actorRole)
  const canInvite = assignableRoles.length > 0
  const showCreateAdminPageAction = actorRole === ROLES.SUPER_ADMIN

  useEffect(() => {
    dispatch(loadSupportAgents())
  }, [dispatch])

  return (
    <div className="support-team-page page-shell">
      <header className="page-header">
        <div>
          <p className="page-kicker">Operations</p>
          <h1 className="page-title">Support team management</h1>
          <p className="page-desc">
            Monitor agent availability, assignments, and workspace efficiency.
          </p>
        </div>
        <div className="support-team-page__actions">
          {showCreateAdminPageAction ? (
            <Link to={ROUTES.SUPPORT_TEAM_CREATE_ADMIN} className="btn btn--primary btn--sm">
              Create Admin
            </Link>
          ) : null}
          <button type="button" className="btn btn--secondary btn--sm">
            Filter
          </button>
          <button type="button" className="btn btn--primary btn--sm">
            Export
          </button>
        </div>
      </header>

      <section className="support-team-page__stats" aria-label="Team summary">
        <article className="support-team-page__stat card-surface">
          <h2 className="support-team-page__stat-label">Total staff</h2>
          <p className="support-team-page__stat-value">42</p>
          <span className="support-team-page__chip support-team-page__chip--ok">+12%</span>
        </article>
        <article className="support-team-page__stat card-surface">
          <h2 className="support-team-page__stat-label">On duty</h2>
          <p className="support-team-page__stat-value">18</p>
          <span className="support-team-page__chip support-team-page__chip--live">Active now</span>
        </article>
        <article className="support-team-page__stat card-surface">
          <h2 className="support-team-page__stat-label">Avg. response</h2>
          <p className="support-team-page__stat-value">1.4 min</p>
        </article>
        <article className="support-team-page__cta card-surface" aria-label="Invite member">
          <h2 className="support-team-page__cta-title">New member</h2>
          <p className="support-team-page__cta-desc">
            {canInvite
              ? `You can create: ${assignableRoles.join(', ')}`
              : 'Your role cannot create support users.'}
          </p>
          <button type="button" className="support-team-page__cta-btn" disabled={!canInvite}>
            + Invite member
          </button>
        </article>
      </section>

      <section className="support-team-page__table card-surface" aria-labelledby="agents-heading">
        <header className="support-team-page__table-head">
          <div>
            <h2 id="agents-heading" className="support-team-page__table-title">
              Active support agents
            </h2>
            <p className="support-team-page__table-sub">Live roster and workload</p>
          </div>
        </header>
        {loading ? (
          <p className="support-team-page__loading" role="status">
            Loading team…
          </p>
        ) : (
          <div className="support-team-page__list">
            {agents.map((a) => (
              <UserCard key={a.id} agent={a} />
            ))}
          </div>
        )}
        <footer className="support-team-page__pager">
          <span>
            Showing {agents.length} of 42 team members
          </span>
          <div className="support-team-page__pager-btns">
            <button type="button" className="btn btn--secondary btn--sm" disabled>
              Previous
            </button>
            <button type="button" className="btn btn--primary btn--sm">
              Next
            </button>
          </div>
        </footer>
      </section>

      <div className="support-team-page__widgets">
        <section className="support-team-page__chart card-surface" aria-label="Team efficiency pulse">
          <h2 className="support-team-page__widget-title">Team efficiency pulse</h2>
          <p className="support-team-page__widget-desc">Weekly performance index</p>
          <div className="support-team-page__bars" role="presentation">
            {[40, 70, 55, 90, 65, 80].map((h, i) => (
              <span key={i} className="support-team-page__bar" style={{ height: `${h}%` }} />
            ))}
          </div>
        </section>
        <section className="support-team-page__security" aria-label="Security alert">
          <p className="support-team-page__security-tag">Security alert</p>
          <h2 className="support-team-page__security-title">MFA compliance</h2>
          <p className="support-team-page__security-body">
            Some agents have not refreshed multi-factor authentication this quarter.
          </p>
          <button type="button" className="support-team-page__security-btn">
            Enforce compliance
          </button>
        </section>
      </div>
    </div>
  )
}
