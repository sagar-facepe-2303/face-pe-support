import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { inviteSupportUser, loadSupportUsers, patchSupportUser } from '../supportSlice'
import { ROLES, getAssignableSupportRoles } from '../../../core/constants/roles'
import type { Role } from '../../../core/constants/roles'
import type { SupportUserResponse } from '../supportAPI'
import { ROUTES } from '../../../core/config/routes'
import { formatDisplayDate } from '../../../core/utils/helpers'
import '../../../layout/Layout.css'
import './Users.css'

const MIN_PASSWORD_LENGTH = 8

const roleLabel: Record<string, string> = {
  [ROLES.SUPER_ADMIN]: 'Super admin',
  [ROLES.MERCHANT_ADMIN]: 'Merchant admin',
  [ROLES.USER_ADMIN]: 'User admin',
  [ROLES.MERCHANT_SUPPORT]: 'Merchant support',
  [ROLES.USER_SUPPORT]: 'User support',
}

const ALL_ROLE_FILTER = 'all'

export function Users() {
  const dispatch = useAppDispatch()
  const members = useAppSelector((s) => s.support.supportUsers)
  const loading = useAppSelector((s) => s.support.loadingList)
  const sliceError = useAppSelector((s) => s.support.error)
  const actorRole = useAppSelector((s) => s.auth.user?.role)
  const currentUserId = useAppSelector((s) => s.auth.user?.id)

  const assignableRoles = useMemo(() => getAssignableSupportRoles(actorRole), [actorRole])
  const canInvite = assignableRoles.length > 0
  const isSuperAdmin = actorRole === ROLES.SUPER_ADMIN

  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitePassword, setInvitePassword] = useState('')
  const [inviteRole, setInviteRole] = useState<Role>(assignableRoles[0] ?? ROLES.USER_SUPPORT)
  const [inviteSubmitting, setInviteSubmitting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<string>(ALL_ROLE_FILTER)
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')

  const [editUser, setEditUser] = useState<SupportUserResponse | null>(null)
  const [editName, setEditName] = useState('')
  const [editActive, setEditActive] = useState(true)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  useEffect(() => {
    void dispatch(loadSupportUsers())
  }, [dispatch])

  useEffect(() => {
    if (assignableRoles.length && !assignableRoles.includes(inviteRole)) {
      setInviteRole(assignableRoles[0])
    }
  }, [assignableRoles, inviteRole])

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase()
    return members.filter((u) => {
      if (filterRole !== ALL_ROLE_FILTER && u.role !== filterRole) return false
      if (filterStatus === 'active' && !u.is_active) return false
      if (filterStatus === 'inactive' && u.is_active) return false
      if (!q) return true
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (roleLabel[u.role] ?? u.role).toLowerCase().includes(q)
      )
    })
  }, [members, search, filterRole, filterStatus])

  async function onInvite(e: FormEvent) {
    e.preventDefault()
    setInviteError(null)
    setInviteSuccess(null)
    const name = inviteName.trim()
    const email = inviteEmail.trim()
    if (!name || !email || !invitePassword) {
      setInviteError('Name, email, and password are required.')
      return
    }
    if (invitePassword.length < MIN_PASSWORD_LENGTH) {
      setInviteError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }
    setInviteSubmitting(true)
    try {
      await dispatch(
        inviteSupportUser({
          name,
          email,
          password: invitePassword,
          role: inviteRole,
        })
      ).unwrap()
      setInviteSuccess(`${email} was added as ${roleLabel[inviteRole] ?? inviteRole}.`)
      setInviteName('')
      setInviteEmail('')
      setInvitePassword('')
    } catch (err) {
      setInviteError(typeof err === 'string' ? err : 'Could not create support user.')
    } finally {
      setInviteSubmitting(false)
    }
  }

  function openEdit(u: SupportUserResponse) {
    setEditUser(u)
    setEditName(u.name)
    setEditActive(u.is_active)
    setEditError(null)
  }

  async function onSaveEdit(e: FormEvent) {
    e.preventDefault()
    if (!editUser) return
    const name = editName.trim()
    if (!name) {
      setEditError('Name is required.')
      return
    }
    if (editUser.id === currentUserId && editUser.is_active && !editActive) {
      setEditError('You cannot deactivate your own account.')
      return
    }
    setEditSubmitting(true)
    setEditError(null)
    try {
      await dispatch(
        patchSupportUser({
          id: editUser.id,
          payload: { name, is_active: editActive },
        })
      ).unwrap()
      setEditUser(null)
    } catch (err) {
      setEditError(typeof err === 'string' ? err : 'Update failed.')
    } finally {
      setEditSubmitting(false)
    }
  }

  function onToggleEditActive(next: boolean) {
    if (!editUser) return
    if (editUser.id === currentUserId && editUser.is_active && !next) {
      return
    }
    setEditActive(next)
  }

  return (
    <div className="support-team-page page-shell">
      <header className="page-header">
        <div>
          <p className="page-kicker">Operations</p>
          <h1 className="page-title">Support team</h1>
          <p className="page-desc">
            Manage support portal operators. APIs: <code>POST /sp/support-users</code>,{' '}
            <code>PATCH /sp/support-users/{"{id}"}</code>, list via <code>GET /sp/support-users</code>. RBAC:{' '}
            super admin may assign any role; user admin only <code>user_support</code>; merchant admin only{' '}
            <code>merchant_support</code>.
          </p>
        </div>
        <div className="support-team-page__actions">
          {isSuperAdmin ? (
            <Link to={ROUTES.SUPPORT_TEAM_CREATE_ADMIN} className="btn btn--primary btn--sm">
              Create admin (full page)
            </Link>
          ) : null}
        </div>
      </header>

      {sliceError ? (
        <p className="support-team-api__banner support-team-api__banner--error" role="alert">
          {sliceError}
        </p>
      ) : null}

      {canInvite ? (
        <section className="support-team-api__invite card-surface" aria-labelledby="invite-heading">
          <h2 id="invite-heading" className="support-team-api__h2">
            Add new member
          </h2>
          <form className="support-team-api__form" onSubmit={onInvite}>
            <label className="support-team-api__field">
              <span>Name</span>
              <input
                className="support-team-api__input"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                autoComplete="name"
                required
              />
            </label>
            <label className="support-team-api__field">
              <span>Email</span>
              <input
                className="support-team-api__input"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </label>
            <label className="support-team-api__field">
              <span>Password</span>
              <input
                className="support-team-api__input"
                type="password"
                value={invitePassword}
                onChange={(e) => setInvitePassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </label>
            <label className="support-team-api__field">
              <span>Role</span>
              <select
                className="support-team-api__input"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as Role)}
              >
                {assignableRoles.map((r) => (
                  <option key={r} value={r}>
                    {roleLabel[r] ?? r}
                  </option>
                ))}
              </select>
            </label>
            {inviteError ? (
              <p className="support-team-api__err" role="alert">
                {inviteError}
              </p>
            ) : null}
            {inviteSuccess ? (
              <p className="support-team-api__ok" role="status">
                {inviteSuccess}
              </p>
            ) : null}
            <button type="submit" className="btn btn--primary btn--sm" disabled={inviteSubmitting}>
              {inviteSubmitting ? 'Submitting…' : 'Add member'}
            </button>
          </form>
        </section>
      ) : (
        <p className="support-team-api__note card-surface" role="note">
          Your role cannot create support users via this API.
        </p>
      )}

      <section className="support-team-api__table-card card-surface" aria-labelledby="members-heading">
        <header className="support-team-api__table-head">
          <h2 id="members-heading" className="support-team-api__h2">
            Support users
          </h2>
          <p className="support-team-api__sub">Listed from GET /support-users (base path /sp).</p>
        </header>

        {members.length > 0 ? (
          <div className="support-team-api__filters">
            <label className="support-team-api__filter">
              <span className="support-team-api__filter-label">Search</span>
              <input
                className="support-team-api__input"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name or email"
                aria-label="Search by name or email"
              />
            </label>
            <label className="support-team-api__filter">
              <span className="support-team-api__filter-label">Role</span>
              <select
                className="support-team-api__input"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value={ALL_ROLE_FILTER}>All roles</option>
                {Object.values(ROLES).map((r) => (
                  <option key={r} value={r}>
                    {roleLabel[r] ?? r}
                  </option>
                ))}
              </select>
            </label>
            <label className="support-team-api__filter">
              <span className="support-team-api__filter-label">Status</span>
              <select
                className="support-team-api__input"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          </div>
        ) : null}

        {loading ? (
          <p className="support-team-api__loading" role="status">
            Loading…
          </p>
        ) : members.length === 0 ? (
          <p className="support-team-api__empty">No users returned. The list may be empty or unavailable.</p>
        ) : filteredMembers.length === 0 ? (
          <p className="support-team-api__empty">No users match the current filters.</p>
        ) : (
          <div className="support-team-api__scroll">
            <table className="support-team-api__table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Role</th>
                  <th scope="col">Status</th>
                  <th scope="col">Created</th>
                  <th scope="col">
                    <span className="visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className="support-team-api__role">{roleLabel[u.role] ?? u.role}</span>
                    </td>
                    <td>
                      <span
                        className={
                          u.is_active ? 'support-team-api__status support-team-api__status--on' : 'support-team-api__status support-team-api__status--off'
                        }
                      >
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      {u.created_at ? (
                        <time dateTime={u.created_at}>{formatDisplayDate(u.created_at)}</time>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <button type="button" className="btn btn--ghost btn--sm" onClick={() => openEdit(u)}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editUser ? (
        <div className="support-team-api__modal-root" role="presentation">
          <button
            type="button"
            className="support-team-api__backdrop"
            aria-label="Close"
            onClick={() => !editSubmitting && setEditUser(null)}
          />
          <div className="support-team-api__modal card-surface" role="dialog" aria-modal="true" aria-labelledby="edit-dialog-title">
            <h2 id="edit-dialog-title" className="support-team-api__modal-title">
              Edit support user
            </h2>
            <p className="support-team-api__modal-email">{editUser.email}</p>
            <form onSubmit={onSaveEdit} className="support-team-api__form support-team-api__form--modal">
              <label className="support-team-api__field">
                <span>Name</span>
                <input
                  className="support-team-api__input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </label>
              <div className="support-team-api__toggle">
                <span id="edit-active-label" className="support-team-api__toggle-text">
                  Active status
                </span>
                <button
                  type="button"
                  className={`support-team-api__switch${editActive ? ' support-team-api__switch--on' : ''}`}
                  role="switch"
                  aria-checked={editActive}
                  aria-labelledby="edit-active-label"
                  onClick={() => onToggleEditActive(!editActive)}
                >
                  <span className="visually-hidden">{editActive ? 'Active' : 'Inactive'}</span>
                </button>
              </div>
              {editUser.id === currentUserId && editUser.is_active ? (
                <p className="support-team-api__hint">You cannot deactivate your own account.</p>
              ) : null}
              {editError ? (
                <p className="support-team-api__err" role="alert">
                  {editError}
                </p>
              ) : null}
              <div className="support-team-api__modal-actions">
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  disabled={editSubmitting}
                  onClick={() => setEditUser(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary btn--sm" disabled={editSubmitting}>
                  {editSubmitting ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
