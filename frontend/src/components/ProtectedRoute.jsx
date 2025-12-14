import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute() {
    const { isAuthenticated, loading } = useAuth()

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="spinner" style={{ width: 48, height: 48 }}></div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    return <Outlet />
}

export default ProtectedRoute
