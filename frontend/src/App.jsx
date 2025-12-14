import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// Pages
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import AddReceipt from './pages/AddReceipt'
import Search from './pages/Search'
import PriceHistory from './pages/PriceHistory'
import AuthCallback from './pages/AuthCallback'

// Components
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
    const { loading } = useAuth()

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="spinner" style={{ width: 48, height: 48 }}></div>
            </div>
        )
    }

    return (
        <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/dashboard" element={<Navigate to="/" replace />} />
                    <Route path="/add-receipt" element={<AddReceipt />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/price-history/:itemName" element={<PriceHistory />} />
                </Route>
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}

export default App
