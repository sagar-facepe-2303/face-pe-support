import { NavLink, useNavigate } from 'react-router-dom'
import { ROUTES } from '../core/config/routes'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { logout } from '../features/auth/authSlice'
import { canViewAuditLogs } from '../core/constants/roles'
import './Sidebar.css'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const role = useAppSelector((s) => s.auth.user?.role)

  async function handleLogout() {
    await dispatch(logout())
    navigate(ROUTES.LOGIN, { replace: true })
    onClose()
  }

  return (
    <aside
      className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}
      aria-label="Primary workspace navigation"
    >
      <div className="sidebar__brand">
        <span className="sidebar__logo-mark" aria-hidden />
        <div>
          <div className="sidebar__logo-title">FacePe</div>
          <div className="sidebar__logo-sub">Admin Workspace</div>
        </div>
        <button
          type="button"
          className="sidebar__close"
          aria-label="Close navigation"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <nav className="sidebar__nav" aria-label="Main">
        <NavLink to={ROUTES.HOME} className={navClass} end onClick={onClose}>
          <span className="sidebar__icon sidebar__icon--grid" aria-hidden />
          Dashboard
        </NavLink>
        <NavLink to={ROUTES.MERCHANTS} className={navClass} onClick={onClose}>
          <span className="sidebar__icon sidebar__icon--store" aria-hidden />
          Merchants
        </NavLink>
        <NavLink to={ROUTES.KIOSKS} className={navClass} onClick={onClose}>
          <span className="sidebar__icon sidebar__icon--kiosk" aria-hidden />
          Kiosks
        </NavLink>
        <NavLink to={ROUTES.USERS} className={navClass} onClick={onClose}>
          <span className="sidebar__icon sidebar__icon--users" aria-hidden />
          Users
        </NavLink>
        <NavLink to={ROUTES.SUPPORT_TEAM} className={navClass} onClick={onClose}>
          <span className="sidebar__icon sidebar__icon--headset" aria-hidden />
          Support Team
        </NavLink>
        {canViewAuditLogs(role) ? (
          <NavLink to={ROUTES.AUDIT_LOGS} className={navClass} onClick={onClose}>
            <span className="sidebar__icon sidebar__icon--audit" aria-hidden />
            Audit Logs
          </NavLink>
        ) : null}
      </nav>

      <div className="sidebar__footer">
        <button type="button" className="sidebar__link sidebar__link--ghost">
          <span className="sidebar__icon sidebar__icon--gear" aria-hidden />
          Settings
        </button>
        <button
          type="button"
          className="sidebar__link sidebar__link--logout"
          onClick={handleLogout}
        >
          <span className="sidebar__icon sidebar__icon--logout" aria-hidden />
          Logout
        </button>
      </div>
    </aside>
  )
}
