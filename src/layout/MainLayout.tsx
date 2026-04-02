import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import './Layout.css'
import './MainLayout.css'

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="main-layout">
      <a href="#main-content" className="main-layout__skip">
        Skip to main content
      </a>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen ? (
        <button
          type="button"
          className="main-layout__backdrop"
          aria-label="Close navigation menu"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}
      <div className="main-layout__shell">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main id="main-content" className="main-layout__main" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
