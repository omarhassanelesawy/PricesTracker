import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check for existing token on mount
        const token = localStorage.getItem('token')
        if (token) {
            fetchUser()
        } else {
            setLoading(false)
        }
    }, [])

    const fetchUser = async () => {
        try {
            const response = await api.get('/auth/me')
            setUser(response.data)
        } catch (error) {
            // Token invalid, clear it
            localStorage.removeItem('token')
            setUser(null)
        } finally {
            setLoading(false)
        }
    }

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password })
        const { access_token, user } = response.data
        localStorage.setItem('token', access_token)
        setUser(user)
        return user
    }

    const register = async (email, password, name, currency) => {
        const response = await api.post('/auth/register', {
            email,
            password,
            name,
            currency
        })
        const { access_token, user } = response.data
        localStorage.setItem('token', access_token)
        setUser(user)
        return user
    }

    const loginWithToken = (token, userData) => {
        localStorage.setItem('token', token)
        setUser(userData)
    }

    const logout = () => {
        localStorage.removeItem('token')
        setUser(null)
    }

    const updateProfile = async (data) => {
        const response = await api.put('/auth/me', data)
        setUser(response.data)
        return response.data
    }

    const value = {
        user,
        loading,
        login,
        register,
        loginWithToken,
        logout,
        updateProfile,
        isAuthenticated: !!user,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
