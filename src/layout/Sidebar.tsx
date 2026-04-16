import { NavLink, useNavigate } from "react-router-dom";
import { ROUTES } from "../core/config/routes";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { logout } from "../features/auth/authSlice";
import {
  canAccessMerchantScope,
  canAccessUserScope,
  canViewAuditLogs,
  hasRole,
  ROLES,
} from "../core/constants/roles";
import {
  IconAudit,
  IconCreateAdmin,
  IconHeadset,
  IconKiosk,
  IconLogout,
  IconMerchants,
  IconProfile,
  IconSettings,
  IconUsers,
  SidebarNavIcon,
} from "./SidebarIcons";
import "./Sidebar.css";
import facepeLogoLight from "../assets/images/facepe-logo.png";
import facepeLogoDark from "../assets/images/FacePe_Logo_darkmode.png";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? "sidebar__link sidebar__link--active" : "sidebar__link";

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const role = useAppSelector((s) => s.auth.user?.role);
  const mode = useAppSelector((s) => s.theme.mode);

  async function handleLogout() {
    await dispatch(logout());
    navigate(ROUTES.LOGIN, { replace: true });
    onClose();
  }

  return (
    <aside
      className={`sidebar ${isOpen ? "sidebar--open" : ""}`}
      aria-label="Primary workspace navigation"
    >
      <div className="sidebar__brand">
        <span className="sidebar__logo-mark" aria-hidden>
          <img
            className="sidebar__logo-img"
            src={mode === "dark" ? facepeLogoDark : facepeLogoLight}
            alt=""
            aria-hidden
          />
        </span>
        <div className="sidebar__brand-text">
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
        {canAccessMerchantScope(role) ? (
          <>
            <NavLink
              to={ROUTES.MERCHANTS}
              className={navClass}
              onClick={onClose}
            >
              <SidebarNavIcon>
                <IconMerchants />
              </SidebarNavIcon>
              <span className="sidebar__text">Merchants</span>
            </NavLink>
            <NavLink to={ROUTES.KIOSKS} className={navClass} onClick={onClose}>
              <SidebarNavIcon>
                <IconKiosk />
              </SidebarNavIcon>
              <span className="sidebar__text">Kiosks</span>
            </NavLink>
          </>
        ) : null}
        {canAccessUserScope(role) ? (
          <NavLink to={ROUTES.USERS} className={navClass} onClick={onClose}>
            <SidebarNavIcon>
              <IconUsers />
            </SidebarNavIcon>
            <span className="sidebar__text">Users</span>
          </NavLink>
        ) : null}
        {hasRole(role, [
          ROLES.SUPER_ADMIN,
          ROLES.USER_ADMIN,
          ROLES.MERCHANT_ADMIN,
        ]) ? (
          <NavLink
            to={ROUTES.SUPPORT_TEAM}
            className={navClass}
            end
            onClick={onClose}
          >
            <SidebarNavIcon>
              <IconHeadset />
            </SidebarNavIcon>
            <span className="sidebar__text">Support Team</span>
          </NavLink>
        ) : null}
        {role === ROLES.SUPER_ADMIN ? (
          <NavLink
            to={ROUTES.SUPPORT_TEAM_CREATE_ADMIN}
            className={navClass}
            onClick={onClose}
          >
            <SidebarNavIcon>
              <IconCreateAdmin />
            </SidebarNavIcon>
            <span className="sidebar__text">Create Users</span>
          </NavLink>
        ) : null}
        {canViewAuditLogs(role) ? (
          <NavLink
            to={ROUTES.AUDIT_LOGS}
            className={navClass}
            onClick={onClose}
          >
            <SidebarNavIcon>
              <IconAudit />
            </SidebarNavIcon>
            <span className="sidebar__text">Audit Logs</span>
          </NavLink>
        ) : null}
      </nav>

      <div className="sidebar__footer">
        <NavLink to={ROUTES.PROFILE} className={navClass} onClick={onClose}>
          <SidebarNavIcon>
            <IconProfile />
          </SidebarNavIcon>
          <span className="sidebar__text">Profile</span>
        </NavLink>
        {/* <button type="button" className="sidebar__link sidebar__link--ghost">
          <SidebarNavIcon>
            <IconSettings />
          </SidebarNavIcon>
          <span className="sidebar__text">Settings</span>
        </button> */}
        <button
          type="button"
          className="sidebar__link sidebar__link--logout"
          onClick={handleLogout}
        >
          <SidebarNavIcon>
            <IconLogout />
          </SidebarNavIcon>
          <span className="sidebar__text">Logout</span>
        </button>
      </div>
    </aside>
  );
}
