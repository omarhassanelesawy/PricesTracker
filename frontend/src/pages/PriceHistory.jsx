import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts'
import { useAuth } from '../context/AuthContext'
import { searchService } from '../services/receipts'
import './PriceHistory.css'

function PriceHistory() {
    const { itemName } = useParams()
    const { user } = useAuth()

    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [supermarket, setSupermarket] = useState('')
    const [supermarkets, setSupermarkets] = useState([])

    useEffect(() => {
        loadSupermarkets()
    }, [])

    useEffect(() => {
        if (itemName) {
            loadPriceHistory()
        }
    }, [itemName, supermarket])

    const loadSupermarkets = async () => {
        try {
            const data = await searchService.getSupermarkets()
            setSupermarkets(data)
        } catch (error) {
            console.error('Failed to load supermarkets:', error)
        }
    }

    const loadPriceHistory = async () => {
        setLoading(true)
        try {
            const result = await searchService.getPriceHistory(
                decodeURIComponent(itemName),
                supermarket || undefined
            )
            setData(result)
        } catch (error) {
            console.error('Failed to load price history:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (amount, itemCurrency) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: itemCurrency || user?.currency || 'USD',
        }).format(amount)
    }

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        })
    }

    const formatFullDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
    }

    // Prepare chart data
    const chartData = data?.history?.map(point => ({
        date: formatDate(point.date),
        fullDate: point.date,
        price: parseFloat(point.price),
        supermarket: point.supermarket_name,
        currency: point.currency,
    })) || []

    // Custom tooltip
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload
            return (
                <div className="chart-tooltip">
                    <p className="tooltip-date">{formatFullDate(item.fullDate)}</p>
                    <p className="tooltip-price">{formatCurrency(item.price, item.currency)}</p>
                    <p className="tooltip-store">{item.supermarket}</p>
                </div>
            )
        }
        return null
    }

    if (loading) {
        return (
            <div className="price-history-loading">
                <div className="spinner" style={{ width: 40, height: 40 }}></div>
            </div>
        )
    }

    if (!data || data.history?.length === 0) {
        return (
            <div className="price-history animate-fade-in">
                <div className="page-header">
                    <Link to="/search" className="back-link">
                        ← Back to Search
                    </Link>
                    <h1>{decodeURIComponent(itemName)}</h1>
                </div>
                <div className="empty-history">
                    <div className="empty-icon">📊</div>
                    <h3>No price history found</h3>
                    <p>No data available for this item yet</p>
                    <Link to="/search" className="btn btn-primary">
                        Search for another item
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="price-history animate-fade-in">
            <div className="page-header">
                <Link to="/search" className="back-link">
                    ← Back to Search
                </Link>
                <h1>{data.item_name}</h1>
                <p>Price history across your shopping trips</p>
            </div>

            {/* Filter */}
            <div className="history-filter">
                <label className="filter-label">Filter by supermarket:</label>
                <select
                    className="input select"
                    value={supermarket}
                    onChange={(e) => setSupermarket(e.target.value)}
                >
                    <option value="">All supermarkets</option>
                    {supermarkets.map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </div>

            {/* Stats Cards */}
            <div className="stats-row">
                <div className="stat-card lowest">
                    <div className="stat-label">Lowest Price</div>
                    <div className="stat-value">
                        {data.lowest_price ? formatCurrency(data.lowest_price.price, data.lowest_price.currency) : '-'}
                    </div>
                    {data.lowest_price && (
                        <div className="stat-meta">
                            {data.lowest_price.supermarket_name} • {formatFullDate(data.lowest_price.date)}
                        </div>
                    )}
                </div>

                <div className="stat-card highest">
                    <div className="stat-label">Highest Price</div>
                    <div className="stat-value">
                        {data.highest_price ? formatCurrency(data.highest_price.price, data.highest_price.currency) : '-'}
                    </div>
                    {data.highest_price && (
                        <div className="stat-meta">
                            {data.highest_price.supermarket_name} • {formatFullDate(data.highest_price.date)}
                        </div>
                    )}
                </div>

                <div className="stat-card average">
                    <div className="stat-label">Average Price</div>
                    <div className="stat-value">
                        {data.average_price ? formatCurrency(data.average_price, user?.currency) : '-'}
                    </div>
                    <div className="stat-meta">
                        Based on {data.history?.length || 0} data points
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="chart-card">
                <h3>Price Trend</h3>
                <div className="chart-container">
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis
                                dataKey="date"
                                stroke="#64748b"
                                tick={{ fill: '#64748b', fontSize: 12 }}
                            />
                            <YAxis
                                stroke="#64748b"
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                tickFormatter={(value) => value.toFixed(2)}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Line
                                type="monotone"
                                dataKey="price"
                                stroke="#6366f1"
                                strokeWidth={3}
                                dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6, fill: '#818cf8' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* History Table */}
            <div className="history-table-card">
                <h3>All Price Points</h3>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Price</th>
                                <th>Supermarket</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.history?.map((point, index) => (
                                <tr
                                    key={index}
                                    className={
                                        point.price === data.lowest_price?.price ? 'row-lowest' :
                                            point.price === data.highest_price?.price ? 'row-highest' : ''
                                    }
                                >
                                    <td>{formatFullDate(point.date)}</td>
                                    <td className="price-cell">
                                        {formatCurrency(point.price, point.currency)}
                                        {point.price === data.lowest_price?.price && (
                                            <span className="badge badge-success">Lowest</span>
                                        )}
                                        {point.price === data.highest_price?.price && (
                                            <span className="badge badge-warning">Highest</span>
                                        )}
                                    </td>
                                    <td>{point.supermarket_name}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default PriceHistory
