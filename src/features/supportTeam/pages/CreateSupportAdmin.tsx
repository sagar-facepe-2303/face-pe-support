import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppSelector } from '../../../app/hooks'
import { ROUTES } from '../../../core/config/routes'
import { ROLES, getAssignableSupportRoles } from '../../../core/constants/roles'
import type { Role } from '../../../core/constants/roles'
import { createSupportUser } from '../supportAPI'
import '../../../layout/Layout.css'
import './CreateSupportAdmin.css'

/** Matches common backend password rules; avoids opaque 422s for short passwords. */
const MIN_PASSWORD_LENGTH = 8

const roleLabel: Record<string, string> = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.MERCHANT_ADMIN]: 'Merchant Admin',
  [ROLES.USER_ADMIN]: 'User Admin',
  [ROLES.MERCHANT_SUPPORT]: 'Merchant Support',
  [ROLES.USER_SUPPORT]: 'User Support',
}

export function CreateSupportAdmin() {
  const navigate = useNavigate()
  const actorRole = useAppSelector((s) => s.auth.user?.role)
  const assignableRoles = useMemo(() => getAssignableSupportRoles(actorRole), [actorRole])

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>(assignableRoles[0] ?? ROLES.USER_ADMIN)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (assignableRoles.length && !assignableRoles.includes(role)) {
      setRole(assignableRoles[0])
    }
  }, [assignableRoles, role])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    if (!trimmedName || !trimmedEmail || !password || !role) {
      setError('All fields are required.')
      return
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }

    try {
      setLoading(true)
      const created = await createSupportUser(actorRole, {
        name: trimmedName,
        email: trimmedEmail,
        password,
        role,
      })
      setSuccess(`Created ${created.name} as ${roleLabel[created.role] ?? created.role}.`)
      setName('')
      setEmail('')
      setPassword('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create support admin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-support-admin page-shell">
      <header className="page-header">
        <div>
          <p className="page-kicker">Support Team</p>
          <h1 className="page-title">Create Admin</h1>
          <p className="page-desc">
            Super Admin can create User Admin and Merchant Admin accounts.
          </p>
        </div>
        <Link to={ROUTES.SUPPORT_TEAM} className="btn btn--secondary btn--sm">
          Back to Team
        </Link>
      </header>

      <section className="create-support-admin__card card-surface" aria-labelledby="create-admin-form">
        <h2 id="create-admin-form" className="create-support-admin__title">
          New support operator
        </h2>
        <form className="create-support-admin__form" onSubmit={onSubmit} noValidate>
          <label className="create-support-admin__field">
            <span>Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter full name"
              autoComplete="name"
              required
            />
          </label>

          <label className="create-support-admin__field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter work email"
              autoComplete="email"
              required
            />
          </label>

          <label className="create-support-admin__field">
            <span>Password</span>
            <input
              id="create-admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Set temporary password"
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              required
              aria-describedby="create-admin-password-hint"
            />
            <span id="create-admin-password-hint" className="create-support-admin__hint">
              Use at least {MIN_PASSWORD_LENGTH} characters (required by the server).
            </span>
          </label>

          <label className="create-support-admin__field">
            <span>Role</span>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)} required>
              {assignableRoles.map((r) => (
                <option key={r} value={r}>
                  {roleLabel[r] ?? r}
                </option>
              ))}
            </select>
          </label>

          {error ? (
            <p className="create-support-admin__error" role="alert">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="create-support-admin__success" role="status">
              {success}
            </p>
          ) : null}

          <div className="create-support-admin__actions">
            <button type="submit" className="btn btn--primary" disabled={loading || !assignableRoles.length}>
              {loading ? 'Creating...' : 'Create Admin'}
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => navigate(ROUTES.SUPPORT_TEAM)}
            >
              Cancel
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

