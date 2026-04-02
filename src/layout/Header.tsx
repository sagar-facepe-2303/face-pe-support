import { useAppSelector } from '../app/hooks'
import { ThemeToggle } from './ThemeToggle'
import './Header.css'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const user = useAppSelector((s) => s.auth.user)

  return (
    <header className="app-header" role="banner">
      <div className="app-header__left">
        <button
          type="button"
          className="app-header__menu-btn"
          aria-label="Open navigation menu"
          aria-expanded={false}
          onClick={onMenuClick}
        >
          <span className="app-header__menu-icon" aria-hidden />
        </button>
        <h1 className="app-header__title">FacePe Support</h1>
      </div>

      <div className="app-header__search-wrap">
        <label htmlFor="global-search" className="visually-hidden">
          Search workspace
        </label>
        <span className="app-header__search" role="search">
          <svg className="app-header__search-icon" aria-hidden viewBox="0 0 24 24" width="20" height="20">
            <path
              fill="currentColor"
              d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
            />
          </svg>
          <input
            id="global-search"
            className="app-header__search-input"
            type="search"
            placeholder="Search accounts, kiosks, or tasks…"
            autoComplete="off"
          />
        </span>
      </div>

      <div className="app-header__right">
        <ThemeToggle />
        <button type="button" className="app-header__icon-btn" aria-label="Notifications">
          <span className="app-header__badge" aria-hidden />
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
            <path
              fill="currentColor"
              d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
            />
          </svg>
        </button>
        <button type="button" className="app-header__icon-btn" aria-label="Help">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
            <path
              fill="currentColor"
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"
            />
          </svg>
        </button>
        <div className="app-header__profile">
          <div className="app-header__avatar" aria-hidden>
            {(user?.name ?? 'A')
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="app-header__profile-text">
            <span className="app-header__profile-name">{user?.name ?? 'Guest'}</span>
            <span className="app-header__profile-role">{user?.role?.replaceAll('_', ' ') ?? '—'}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
