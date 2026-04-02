import type { ReactNode } from 'react'
import './SidebarIcons.css'

/** Wraps SVG nav icons for consistent size; inherits color from `.sidebar__link` */
export function SidebarNavIcon({ children }: { children: ReactNode }) {
  return (
    <span className="sidebar-nav-icon" aria-hidden>
      {children}
    </span>
  )
}

const svgProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  xmlns: 'http://www.w3.org/2000/svg',
  'aria-hidden': true as const,
}

export function IconDashboard() {
  return (
    <svg {...svgProps}>
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
      />
    </svg>
  )
}

export function IconMerchants() {
  return (
    <svg {...svgProps}>
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 8h12l1 4v9a2 2 0 01-2 2H7a2 2 0 01-2-2V12l1-4z"
      />
      <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M9 8V6a3 3 0 016 0v2" />
    </svg>
  )
}

export function IconKiosk() {
  return (
    <svg {...svgProps}>
      <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
      <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M8 21h8M12 17v4" />
      <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M7 8h10M7 11h6" />
    </svg>
  )
}

export function IconUsers() {
  return (
    <svg {...svgProps}>
      <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="2" />
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        d="M3 20v-1a5 5 0 015-5h2a5 5 0 015 5v1"
      />
      <circle cx="17" cy="8" r="2.5" stroke="currentColor" strokeWidth="2" />
      <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M21 20v-1a3.5 3.5 0 00-2.5-3.35" />
    </svg>
  )
}

export function IconHeadset() {
  return (
    <svg {...svgProps}>
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 16v-3a7 7 0 1114 0v3M5 16a2 2 0 104 0v-2a2 2 0 10-4 0v2zm10 0a2 2 0 104 0v-2a2 2 0 10-4 0v2z"
      />
    </svg>
  )
}

export function IconAudit() {
  return (
    <svg {...svgProps}>
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
      <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M9 12h6M9 16h6M9 8h2" />
    </svg>
  )
}

export function IconSettings() {
  return (
    <svg {...svgProps}>
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 15a3 3 0 100-6 3 3 0 000 6z"
      />
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9c.22.48.34 1 .34 1.51s-.12 1.03-.34 1.51z"
      />
    </svg>
  )
}

export function IconLogout() {
  return (
    <svg {...svgProps}>
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
      />
    </svg>
  )
}
