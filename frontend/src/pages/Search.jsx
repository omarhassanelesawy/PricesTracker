import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { searchService } from '../services/receipts'
import './Search.css'

function Search() {
    const { user } = useAuth()

    // Search state
    const [keyword, setKeyword] = useState('')
    const [supermarket, setSupermarket] = useState('')
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [sortBy, setSortBy] = useState('date')
    const [sortOrder, setSortOrder] = useState('desc')

    // Results state
    const [results, setResults] = useState([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(0)
    const [loading, setLoading] = useState(false)
    const [searched, setSearched] = useState(false)

    // Supermarket suggestions
    const [supermarkets, setSupermarkets] = useState([])

    // Load supermarket suggestions on mount
    useEffect(() => {
        loadSupermarkets()
    }, [])

    const loadSupermarkets = async () => {
        try {
            const data = await searchService.getSupermarkets()
            setSupermarkets(data)
        } catch (error) {
            console.error('Failed to load supermarkets:', error)
        }
    }

    const handleSearch = async (e) => {
        if (e) e.preventDefault()
        if (!keyword.trim()) return

        setLoading(true)
        setSearched(true)

        try {
            const data = await searchService.search({
                keyword: keyword.trim(),
                supermarket: supermarket || undefined,
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
                sortBy,
                sortOrder,
                page,
                pageSize: 20,
            })

            setResults(data.results)
            setTotal(data.total)
            setTotalPages(data.total_pages)
        } catch (error) {
            console.error('Search failed:', error)
            setResults([])
            setTotal(0)
        } finally {
            setLoading(false)
        }
    }

    // Re-search when sort or page changes
    useEffect(() => {
        if (searched && keyword.trim()) {
            handleSearch()
        }
    }, [sortBy, sortOrder, page])

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
            year: 'numeric',
        })
    }

    const handleReset = () => {
        setKeyword('')
        setSupermarket('')
        setDateFrom('')
        setDateTo('')
        setSortBy('date')
        setSortOrder('desc')
        setResults([])
        setSearched(false)
        setPage(1)
    }

    return (
        <div className="search-page animate-fade-in">
            <div className="page-header">
                <h1>Search & Compare</h1>
                <p>Find items and compare prices across supermarkets</p>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="search-form">
                <div className="search-main">
                    <div className="search-input-wrapper">
                        <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search for items (e.g., milk, bread, rice...)"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <button type="submit" className="btn btn-primary btn-lg" disabled={!keyword.trim() || loading}>
                        {loading ? (
                            <div className="spinner"></div>
                        ) : (
                            'Search'
                        )}
                    </button>
                </div>

                {/* Filters */}
                <div className="search-filters">
                    <div className="filter-group">
                        <label className="filter-label">Supermarket</label>
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

                    <div className="filter-group">
                        <label className="filter-label">From Date</label>
                        <input
                            type="date"
                            className="input"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                        />
                    </div>

                    <div className="filter-group">
                        <label className="filter-label">To Date</label>
                        <input
                            type="date"
                            className="input"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                        />
                    </div>

                    <div className="filter-group">
                        <label className="filter-label">Sort By</label>
                        <select
                            className="input select"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="date">Date</option>
                            <option value="price">Price</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label className="filter-label">Order</label>
                        <select
                            className="input select"
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                        >
                            <option value="desc">Newest / Highest</option>
                            <option value="asc">Oldest / Lowest</option>
                        </select>
                    </div>

                    <button type="button" className="btn btn-ghost filter-reset" onClick={handleReset}>
                        Reset
                    </button>
                </div>
            </form>

            {/* Results */}
            {searched && (
                <div className="search-results">
                    <div className="results-header">
                        <span className="results-count">
                            {loading ? 'Searching...' : `${total} result${total !== 1 ? 's' : ''} found`}
                        </span>
                    </div>

                    {results.length === 0 && !loading ? (
                        <div className="empty-results">
                            <div className="empty-icon">🔍</div>
                            <h3>No results found</h3>
                            <p>Try adjusting your search term or filters</p>
                        </div>
                    ) : (
                        <>
                            <div className="results-grid">
                                {results.map((item) => (
                                    <div key={item.id} className="result-card">
                                        <div className="result-main">
                                            <h4 className="result-name">{item.name}</h4>
                                            {item.brand && (
                                                <span className="result-brand">{item.brand}</span>
                                            )}
                                        </div>
                                        <div className="result-price">
                                            {formatCurrency(item.price, item.currency)}
                                            {item.quantity !== 1 && (
                                                <span className="result-quantity">
                                                    × {item.quantity} {item.unit || ''}
                                                </span>
                                            )}
                                        </div>
                                        <div className="result-meta">
                                            <span className="result-store">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                                    <path d="M3 3h18v18H3z" />
                                                    <path d="M3 9h18M9 21V9" />
                                                </svg>
                                                {item.supermarket_name}
                                            </span>
                                            <span className="result-date">{formatDate(item.purchase_date)}</span>
                                        </div>
                                        <Link
                                            to={`/price-history/${encodeURIComponent(item.name)}`}
                                            className="result-history-link"
                                        >
                                            View Price History →
                                        </Link>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="pagination">
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                    >
                                        Previous
                                    </button>
                                    <span className="pagination-info">
                                        Page {page} of {totalPages}
                                    </span>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Prompt to search */}
            {!searched && (
                <div className="search-prompt">
                    <div className="prompt-icon">🛒</div>
                    <h3>Start searching</h3>
                    <p>Enter an item name to find prices across all your receipts</p>
                </div>
            )}
        </div>
    )
}

export default Search
