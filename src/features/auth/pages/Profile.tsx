import { useEffect, useState } from 'react'
import { useAppSelector } from '../../../app/hooks'
import type { Role } from '../../../core/constants/roles'
import { fetchSupportUserById, type SupportUserResponse } from '../../supportTeam/supportAPI'
import { isAxiosError } from 'axios'
import '../../../layout/Layout.css'
import './Profile.css'

const roleLabel: Record<string, string> = {
  super_admin: 'Super Admin',
  user_admin: 'User Admin',
  merchant_admin: 'Merchant Admin',
  merchant_support: 'Merchant Support',
  user_support: 'User Support',
}

function formatRole(role: Role | string): string {
  return roleLabel[role] ?? String(role).replaceAll('_', ' ')
}

export function Profile() {
  const authUser = useAppSelector((s) => s.auth.user)
  const [remote, setRemote] = useState<SupportUserResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchNote, setFetchNote] = useState<string | null>(null)

  useEffect(() => {
    if (!authUser?.id) {
      setLoading(false)
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        setFetchNote(null)
        const data = await fetchSupportUserById(authUser.id)
        if (!cancelled) {
          setRemote(data)
        }
      } catch (e) {
        if (!cancelled) {
          setRemote(null)
          if (isAxiosError(e) && e.response?.status === 404) {
            setFetchNote('Profile details are not available from the server. Showing session data.')
          } else {
            setFetchNote(
              e instanceof Error ? e.message : 'Could not load profile from the server. Showing session data.'
            )
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [authUser?.id])

  const displayName = remote?.name ?? authUser?.name ?? '—'
  const displayEmail = remote?.email ?? authUser?.email ?? '—'
  const displayRole = remote?.role ?? authUser?.role
  const isActive = remote?.is_active
  const createdAt = remote?.created_at

  return (
    <div className="profile-page page-shell">
      <header className="page-header">
        <div>
          <p className="page-kicker">Account</p>
          <h1 className="page-title">Profile</h1>
          <p className="page-desc">Your support portal account details.</p>
        </div>
      </header>

      <section className="profile-page__card card-surface" aria-labelledby="profile-heading">
        <h2 id="profile-heading" className="visually-hidden">
          Profile details
        </h2>
        {loading ? (
          <p className="profile-page__status" role="status">
            Loading profile…
          </p>
        ) : null}
        {fetchNote ? (
          <p className="profile-page__note" role="status">
            {fetchNote}
          </p>
        ) : null}

        <dl className="profile-page__dl">
          <div className="profile-page__row">
            <dt>Name</dt>
            <dd>{displayName}</dd>
          </div>
          <div className="profile-page__row">
            <dt>Email</dt>
            <dd>{displayEmail}</dd>
          </div>
          <div className="profile-page__row">
            <dt>Role</dt>
            <dd>{displayRole ? formatRole(displayRole) : '—'}</dd>
          </div>
          {remote && typeof isActive === 'boolean' ? (
            <div className="profile-page__row">
              <dt>Status</dt>
              <dd>{isActive ? 'Active' : 'Inactive'}</dd>
            </div>
          ) : null}
          {createdAt ? (
            <div className="profile-page__row">
              <dt>Created</dt>
              <dd>{new Date(createdAt).toLocaleString()}</dd>
            </div>
          ) : null}
          <div className="profile-page__row">
            <dt>User ID</dt>
            <dd>
              <code className="profile-page__code">{authUser?.id ?? '—'}</code>
            </dd>
          </div>
        </dl>
      </section>
    </div>
  )
}
