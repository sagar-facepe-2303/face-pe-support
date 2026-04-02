import { NavLink, useNavigate } from 'react-router-dom'
import { ROUTES } from '../core/config/routes'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { logout } from '../features/auth/authSlice'
import { canViewAuditLogs } from '../core/constants/roles'
import {
  IconAudit,
  IconDashboard,
  IconHeadset,
  IconKiosk,
  IconLogout,
  IconMerchants,
  IconSettings,
  IconUsers,
  SidebarNavIcon,
} from './SidebarIcons'
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
          <SidebarNavIcon>
            <IconDashboard />
          </SidebarNavIcon>
          Dashboard
        </NavLink>
        <NavLink to={ROUTES.MERCHANTS} className={navClass} onClick={onClose}>
          <SidebarNavIcon>
            <IconMerchants />
          </SidebarNavIcon>
          Merchants
        </NavLink>
        <NavLink to={ROUTES.KIOSKS} className={navClass} onClick={onClose}>
          <SidebarNavIcon>
            <IconKiosk />
          </SidebarNavIcon>
          Kiosks
        </NavLink>
        <NavLink to={ROUTES.USERS} className={navClass} onClick={onClose}>
          <SidebarNavIcon>
            <IconUsers />
          </SidebarNavIcon>
          Users
        </NavLink>
        <NavLink to={ROUTES.SUPPORT_TEAM} className={navClass} onClick={onClose}>
          <SidebarNavIcon>
            <IconHeadset />
          </SidebarNavIcon>
          Support Team
        </NavLink>
        {canViewAuditLogs(role) ? (
          <NavLink to={ROUTES.AUDIT_LOGS} className={navClass} onClick={onClose}>
            <SidebarNavIcon>
              <IconAudit />
            </SidebarNavIcon>
            Audit Logs
          </NavLink>
        ) : null}
      </nav>

      <div className="sidebar__footer">
        <button type="button" className="sidebar__link sidebar__link--ghost">
          <SidebarNavIcon>
            <IconSettings />
          </SidebarNavIcon>
          Settings
        </button>
        <button
          type="button"
          className="sidebar__link sidebar__link--logout"
          onClick={handleLogout}
        >
          <SidebarNavIcon>
            <IconLogout />
          </SidebarNavIcon>
          Logout
        </button>
      </div>
    </aside>
  )
}
