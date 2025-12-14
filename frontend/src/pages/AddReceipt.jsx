import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { useAuth } from '../context/AuthContext'
import { receiptService } from '../services/receipts'
import './AddReceipt.css'

const CURRENCIES = [
    { value: 'USD', label: 'USD' },
    { value: 'EGP', label: 'EGP' },
    { value: 'EUR', label: 'EUR' },
    { value: 'GBP', label: 'GBP' },
    { value: 'SAR', label: 'SAR' },
    { value: 'AED', label: 'AED' },
]

function AddReceipt() {
    const { user } = useAuth()
    const navigate = useNavigate()

    // Tab state
    const [activeTab, setActiveTab] = useState('manual')

    // Form state
    const [supermarket, setSupermarket] = useState('')
    const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
    const [currency, setCurrency] = useState(user?.currency || 'EGP')
    const [items, setItems] = useState([{ name: '', brand: '', price: '', quantity: '1', unit: '' }])
    const [notes, setNotes] = useState('')

    // OCR state
    const [ocrLoading, setOcrLoading] = useState(false)
    const [ocrResult, setOcrResult] = useState(null)
    const [uploadedFile, setUploadedFile] = useState(null)

    // Submit state
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    // Dropzone setup
    const onDrop = useCallback(async (acceptedFiles) => {
        const file = acceptedFiles[0]
        console.log(acceptedFiles)
        if (!file) return

        setUploadedFile(file)
        setOcrLoading(true)
        setError('')

        try {
            const result = await receiptService.uploadOCR(file)
            setOcrResult(result)

            // Pre-fill form with OCR results
            if (result.supermarket_name) setSupermarket(result.supermarket_name)
            if (result.purchase_date) setPurchaseDate(result.purchase_date)
            if (result.items && result.items.length > 0) {
                setItems(result.items.map(item => ({
                    name: item.name || '',
                    brand: item.brand || '',
                    price: item.price?.toString() || '',
                    quantity: item.quantity?.toString() || '1',
                    unit: item.unit || '',
                })))
            }
        } catch (err) {
            setError('Failed to process receipt image. Please try again or enter manually.')
            console.error('OCR error:', err)
        } finally {
            setOcrLoading(false)
        }
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpg', '.jpeg', '.png', '.heic', '.heif', '.webp'],
        },
        multiple: false,
        maxSize: 10 * 1024 * 1024, // 10MB
        onDropRejected: (fileRejections) => {
            console.log('Rejected files:', fileRejections)
            if (fileRejections.length > 0) {
                const error = fileRejections[0].errors[0]
                setError(`File rejected: ${error.message}`)
            }
        }
    })

    // Item management
    const addItem = () => {
        setItems([...items, { name: '', brand: '', price: '', quantity: '1', unit: '' }])
    }

    const removeItem = (index) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index))
        }
    }

    const updateItem = (index, field, value) => {
        const newItems = [...items]
        newItems[index][field] = value
        setItems(newItems)
    }

    // Calculate total
    const calculateTotal = () => {
        return items.reduce((sum, item) => {
            const price = parseFloat(item.price) || 0
            const quantity = parseFloat(item.quantity) || 1
            return sum + (price * quantity)
        }, 0)
    }

    // Form validation
    const isValid = () => {
        if (!supermarket.trim()) return false
        if (!purchaseDate) return false
        if (items.length === 0) return false
        return items.every(item => item.name.trim() && parseFloat(item.price) > 0)
    }

    // Submit handler
    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!isValid()) return

        setSubmitting(true)
        setError('')

        try {
            const receiptData = {
                supermarket_name: supermarket.trim(),
                purchase_date: purchaseDate,
                currency,
                notes: notes.trim() || null,
                items: items.map(item => ({
                    name: item.name.trim(),
                    brand: item.brand.trim() || null,
                    price: parseFloat(item.price),
                    quantity: parseFloat(item.quantity) || 1,
                    unit: item.unit.trim() || null,
                })),
            }

            await receiptService.create(receiptData)
            navigate('/')
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to save receipt. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="add-receipt animate-fade-in">
            <div className="page-header">
                <h1>Add Receipt</h1>
                <p>Enter your shopping receipt to track prices</p>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'manual' ? 'active' : ''}`}
                    onClick={() => setActiveTab('manual')}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Manual Entry
                </button>
                <button
                    className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
                    onClick={() => setActiveTab('upload')}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17,8 12,3 7,8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    Upload Receipt
                </button>
            </div>

            {error && (
                <div className="form-error">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="receipt-form">
                {/* Upload Section */}
                {activeTab === 'upload' && (
                    <div className="upload-section">
                        <div
                            {...getRootProps()}
                            className={`dropzone ${isDragActive ? 'active' : ''} ${uploadedFile ? 'has-file' : ''}`}
                        >
                            <input {...getInputProps()} />
                            {ocrLoading ? (
                                <div className="dropzone-loading">
                                    <div className="spinner" style={{ width: 40, height: 40 }}></div>
                                    <p>Processing receipt...</p>
                                </div>
                            ) : uploadedFile ? (
                                <div className="dropzone-success">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="40" height="40">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22,4 12,14.01 9,11.01" />
                                    </svg>
                                    <p>{uploadedFile.name}</p>
                                    <span>Click or drag to upload a different image</span>
                                </div>
                            ) : (
                                <div className="dropzone-content">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="48" height="48">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                        <circle cx="8.5" cy="8.5" r="1.5" />
                                        <polyline points="21,15 16,10 5,21" />
                                    </svg>
                                    <p>Drag and drop your receipt image here</p>
                                    <span>or click to browse</span>
                                    <span className="dropzone-hint">Supports JPG, PNG up to 10MB</span>
                                </div>
                            )}
                        </div>

                        {ocrResult && (
                            <div className="ocr-notice">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="16" x2="12" y2="12" />
                                    <line x1="12" y1="8" x2="12.01" y2="8" />
                                </svg>
                                <span>Please review and correct the extracted data below before saving.</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Receipt Details */}
                <div className="form-card">
                    <h3>Receipt Details</h3>

                    <div className="form-grid">
                        <div className="input-group">
                            <label className="input-label" htmlFor="supermarket">Supermarket *</label>
                            <input
                                id="supermarket"
                                type="text"
                                className="input"
                                placeholder="e.g., Carrefour, Spinneys"
                                value={supermarket}
                                onChange={(e) => setSupermarket(e.target.value)}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label" htmlFor="date">Purchase Date *</label>
                            <input
                                id="date"
                                type="date"
                                className="input"
                                value={purchaseDate}
                                onChange={(e) => setPurchaseDate(e.target.value)}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label" htmlFor="currency">Currency</label>
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
                    </div>
                </div>

                {/* Items Section */}
                <div className="form-card">
                    <div className="card-header">
                        <h3>Items</h3>
                        <button type="button" className="btn btn-ghost" onClick={addItem}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Add Item
                        </button>
                    </div>

                    <div className="items-list">
                        {items.map((item, index) => (
                            <div key={index} className="item-row">
                                <div className="item-fields">
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="Item name *"
                                        value={item.name}
                                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                                        required
                                    />
                                    <input
                                        type="text"
                                        className="input input-sm"
                                        placeholder="Brand"
                                        value={item.brand}
                                        onChange={(e) => updateItem(index, 'brand', e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        className="input input-sm"
                                        placeholder="Price *"
                                        value={item.price}
                                        onChange={(e) => updateItem(index, 'price', e.target.value)}
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                    <input
                                        type="number"
                                        className="input input-xs"
                                        placeholder="Qty"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                        min="0.001"
                                        step="0.001"
                                    />
                                    <input
                                        type="text"
                                        className="input input-xs"
                                        placeholder="Unit"
                                        value={item.unit}
                                        onChange={(e) => updateItem(index, 'unit', e.target.value)}
                                    />
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-icon btn-ghost item-remove"
                                    onClick={() => removeItem(index)}
                                    disabled={items.length === 1}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                        <polyline points="3,6 5,6 21,6" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="items-total">
                        <span>Total:</span>
                        <span className="total-value">
                            {currency} {calculateTotal().toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* Notes Section */}
                <div className="form-card">
                    <h3>Notes (Optional)</h3>
                    <textarea
                        className="input textarea"
                        placeholder="Any additional notes about this receipt..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                    />
                </div>

                {/* Submit */}
                <div className="form-actions">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => navigate('/')}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        disabled={!isValid() || submitting}
                    >
                        {submitting ? (
                            <>
                                <div className="spinner"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                    <polyline points="17,21 17,13 7,13 7,21" />
                                    <polyline points="7,3 7,8 15,8" />
                                </svg>
                                Save Receipt
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}

export default AddReceipt
