import api from './api'

export const receiptService = {
    // List receipts with pagination and filters
    async list({ page = 1, pageSize = 20, supermarket, dateFrom, dateTo } = {}) {
        const params = new URLSearchParams()
        params.append('page', page)
        params.append('page_size', pageSize)
        if (supermarket) params.append('supermarket', supermarket)
        if (dateFrom) params.append('date_from', dateFrom)
        if (dateTo) params.append('date_to', dateTo)

        const response = await api.get(`/receipts?${params}`)
        return response.data
    },

    // Get single receipt
    async get(id) {
        const response = await api.get(`/receipts/${id}`)
        return response.data
    },

    // Create receipt with items
    async create(data) {
        const response = await api.post('/receipts', data)
        return response.data
    },

    // Update receipt
    async update(id, data) {
        const response = await api.put(`/receipts/${id}`, data)
        return response.data
    },

    // Delete receipt
    async delete(id) {
        await api.delete(`/receipts/${id}`)
    },

    // Upload receipt for OCR
    async uploadOCR(file) {
        const formData = new FormData()
        formData.append('file', file)

        const response = await api.post('/receipts/ocr', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
        return response.data
    },
}

export const searchService = {
    // Search items
    async search({ keyword, supermarket, dateFrom, dateTo, sortBy, sortOrder, page, pageSize, useRegex } = {}) {
        const params = new URLSearchParams()
        params.append('keyword', keyword)
        if (supermarket) params.append('supermarket', supermarket)
        if (dateFrom) params.append('date_from', dateFrom)
        if (dateTo) params.append('date_to', dateTo)
        if (sortBy) params.append('sort_by', sortBy)
        if (sortOrder) params.append('sort_order', sortOrder)
        if (page) params.append('page', page)
        if (pageSize) params.append('page_size', pageSize)
        if (useRegex) params.append('use_regex', 'true')

        const response = await api.get(`/search?${params}`)
        return response.data
    },

    // Get price history
    async getPriceHistory(itemName, supermarket) {
        const params = new URLSearchParams()
        if (supermarket) params.append('supermarket', supermarket)

        const response = await api.get(`/search/history/${encodeURIComponent(itemName)}?${params}`)
        return response.data
    },

    // Get supermarket suggestions
    async getSupermarkets(query = '') {
        const response = await api.get(`/search/supermarkets?q=${encodeURIComponent(query)}`)
        return response.data
    },
}

export const itemService = {
    // Add item to receipt
    async add(receiptId, item) {
        const response = await api.post(`/items/${receiptId}`, item)
        return response.data
    },

    // Update item
    async update(itemId, data) {
        const response = await api.put(`/items/${itemId}`, data)
        return response.data
    },

    // Delete item
    async delete(itemId) {
        await api.delete(`/items/${itemId}`)
    },
}
