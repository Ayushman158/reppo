import { Outlet } from 'react-router-dom'
import './AppLayout.css'

export default function AppLayout() {
  return (
    <div className="app-container">
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
