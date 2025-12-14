import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Layout.css'

function Layout() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <div className="layout">
            {/* Sidebar Navigation */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="logo">
                        <span className="logo-icon">🛒</span>
                        <span className="logo-text">PriceTracker</span>
                    </div>
                </div>

                <nav className="nav">
                    <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9,22 9,12 15,12 15,22" />
                        </svg>
                        <span>Dashboard</span>
                    </NavLink>

                    <NavLink to="/add-receipt" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        <span>Add Receipt</span>
                    </NavLink>

                    <NavLink to="/search" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <span>Search & Compare</span>
                    </NavLink>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="user-details">
                            <span className="user-name">{user?.name}</span>
                            <span className="user-currency">{user?.currency}</span>
                        </div>
                    </div>
                    <button className="btn btn-ghost btn-icon" onClick={handleLogout} title="Logout">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16,17 21,12 16,7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    )
}

export default Layout
