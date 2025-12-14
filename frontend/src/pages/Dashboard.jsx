import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { receiptService } from '../services/receipts'
import './Dashboard.css'

function Dashboard() {
    const { user } = useAuth()
    const [receipts, setReceipts] = useState([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalReceipts: 0,
        totalSpent: 0,
        topSupermarket: null,
        itemsTracked: 0,
    })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const data = await receiptService.list({ pageSize: 5 })
            setReceipts(data.receipts)

            // Calculate stats
            const totalSpent = data.receipts.reduce((sum, r) => sum + parseFloat(r.total_amount), 0)
            const itemsTracked = data.receipts.reduce((sum, r) => sum + r.items.length, 0)

            // Find top supermarket
            const supermarketCounts = {}
            data.receipts.forEach(r => {
                supermarketCounts[r.supermarket_name] = (supermarketCounts[r.supermarket_name] || 0) + 1
            })
            const topSupermarket = Object.keys(supermarketCounts).sort(
                (a, b) => supermarketCounts[b] - supermarketCounts[a]
            )[0]

            setStats({
                totalReceipts: data.total,
                totalSpent,
                topSupermarket,
                itemsTracked,
            })
        } catch (error) {
            console.error('Failed to load receipts:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: user?.currency || 'USD',
        }).format(amount)
    }

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
    }

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="spinner" style={{ width: 40, height: 40 }}></div>
            </div>
        )
    }

    return (
        <div className="dashboard animate-fade-in">
            {/* Header */}
            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">Welcome back, {user?.name?.split(' ')[0]}!</h1>
                    <p className="dashboard-subtitle">Track your grocery prices and find the best deals</p>
                </div>
                <Link to="/add-receipt" className="btn btn-primary">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Receipt
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon stat-icon-purple">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14,2 14,8 20,8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{stats.totalReceipts}</span>
                        <span className="stat-label">Total Receipts</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon stat-icon-green">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                            <line x1="12" y1="1" x2="12" y2="23" />
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{formatCurrency(stats.totalSpent)}</span>
                        <span className="stat-label">Total Spent</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon stat-icon-blue">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                            <circle cx="9" cy="21" r="1" />
                            <circle cx="20" cy="21" r="1" />
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{stats.itemsTracked}</span>
                        <span className="stat-label">Items Tracked</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon stat-icon-orange">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                            <path d="M3 3v18h18" />
                            <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{stats.topSupermarket || '-'}</span>
                        <span className="stat-label">Most Visited</span>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
                <Link to="/search" className="action-card">
                    <div className="action-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                    </div>
                    <div className="action-content">
                        <h3>Search & Compare</h3>
                        <p>Find items and compare prices across supermarkets</p>
                    </div>
                    <svg className="action-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                        <polyline points="9,18 15,12 9,6" />
                    </svg>
                </Link>

                <Link to="/add-receipt" className="action-card">
                    <div className="action-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <line x1="12" y1="8" x2="12" y2="16" />
                            <line x1="8" y1="12" x2="16" y2="12" />
                        </svg>
                    </div>
                    <div className="action-content">
                        <h3>Add New Receipt</h3>
                        <p>Upload or manually enter your shopping receipt</p>
                    </div>
                    <svg className="action-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                        <polyline points="9,18 15,12 9,6" />
                    </svg>
                </Link>
            </div>

            {/* Recent Receipts */}
            <div className="recent-section">
                <div className="section-header">
                    <h2>Recent Receipts</h2>
                    {receipts.length > 0 && (
                        <Link to="/receipts" className="btn btn-ghost">View All</Link>
                    )}
                </div>

                {receipts.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">🧾</div>
                        <h3>No receipts yet</h3>
                        <p>Start tracking your grocery prices by adding your first receipt</p>
                        <Link to="/add-receipt" className="btn btn-primary">
                            Add Your First Receipt
                        </Link>
                    </div>
                ) : (
                    <div className="receipts-list">
                        {receipts.map(receipt => (
                            <div key={receipt.id} className="receipt-card">
                                <div className="receipt-info">
                                    <div className="receipt-store">
                                        <span className="store-icon">🏪</span>
                                        <div>
                                            <h4>{receipt.supermarket_name}</h4>
                                            <span className="receipt-date">{formatDate(receipt.purchase_date)}</span>
                                        </div>
                                    </div>
                                    <div className="receipt-meta">
                                        <span className="receipt-items">{receipt.items.length} items</span>
                                    </div>
                                </div>
                                <div className="receipt-total">
                                    <span className="total-amount">{formatCurrency(receipt.total_amount)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Dashboard
