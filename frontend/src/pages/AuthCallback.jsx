import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function AuthCallback() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { loginWithToken } = useAuth()

    useEffect(() => {
        const handleCallback = async () => {
            const token = searchParams.get('token')

            if (token) {
                try {
                    // Set token and fetch user
                    localStorage.setItem('token', token)
                    const response = await api.get('/auth/me')
                    loginWithToken(token, response.data)
                    navigate('/')
                } catch (error) {
                    console.error('OAuth callback failed:', error)
                    navigate('/login')
                }
            } else {
                navigate('/login')
            }
        }

        handleCallback()
    }, [searchParams, navigate, loginWithToken])

    return (
        <div className="loading-overlay">
            <div style={{ textAlign: 'center' }}>
                <div className="spinner" style={{ width: 48, height: 48, margin: '0 auto' }}></div>
                <p style={{ marginTop: '1rem', color: 'var(--color-text-secondary)' }}>
                    Completing sign in...
                </p>
            </div>
        </div>
    )
}

export default AuthCallback
