import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

const CURRENCIES = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EGP', label: 'EGP - Egyptian Pound' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'SAR', label: 'SAR - Saudi Riyal' },
    { value: 'AED', label: 'AED - UAE Dirham' },
]

function Register() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [currency, setCurrency] = useState('EGP')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const { register } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        // Validation
        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters')
            return
        }

        setLoading(true)

        try {
            await register(email, password, name, currency)
            navigate('/')
        } catch (err) {
            setError(err.response?.data?.detail || 'Registration failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-card animate-slide-up">
                <div className="auth-header">
                    <div className="auth-logo">
                        <span className="auth-logo-icon">🛒</span>
                        <h1 className="auth-logo-text">PriceTracker</h1>
                    </div>
                    <p className="auth-subtitle">Create your account to start tracking</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {error && (
                        <div className="auth-error">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <div className="input-group">
                        <label className="input-label" htmlFor="name">Full Name</label>
                        <input
                            id="name"
                            type="text"
                            className="input"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label" htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            className="input"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label" htmlFor="currency">Preferred Currency</label>
                        <select
                            id="currency"
                            className="input select"
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                        >
                            {CURRENCIES.map(c => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group">
                        <label className="input-label" htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            className="input"
                            placeholder="Minimum 8 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label" htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            className="input"
                            placeholder="Re-enter your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
                        {loading ? (
                            <>
                                <div className="spinner"></div>
                                Creating account...
                            </>
                        ) : (
                            'Create Account'
                        )}
                    </button>
                </form>

                <p className="auth-footer">
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
            </div>

            <div className="auth-bg-pattern"></div>
        </div>
    )
}

export default Register
