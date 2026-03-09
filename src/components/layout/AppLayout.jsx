import { Outlet, NavLink } from 'react-router-dom'
import { Icon } from '@iconify/react'
import './AppLayout.css'

const NAV = [
  { to: '/app', label: 'Notebook', icon: 'ph:notebook-bold', end: true },
  { to: '/app/workout', label: 'New', icon: 'ph:plus-bold', isFab: true },
  { to: '/app/insights', label: 'Insights', icon: 'ph:chart-line-up-bold' },
  { to: '/app/program', label: 'Program', icon: 'ph:list-checks-bold' },
]

export default function AppLayout() {
  return (
    <div className="app-container">
      <main className="main-content">
        <Outlet />
      </main>

      <nav className="bottom-tab-bar">
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `tab-item ${isActive ? 'active' : ''} ${item.isFab ? 'tab-fab' : ''}`
            }
            onClick={(e) => {
              if (item.isFab) {
                e.preventDefault()
                console.log("FAB Triggered")
              }
            }}
          >
            <span className="tab-icon">
              <Icon icon={item.icon} />
            </span>
            {!item.isFab && <span className="tab-label">{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
