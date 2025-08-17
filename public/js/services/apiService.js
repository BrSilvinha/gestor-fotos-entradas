// API Service Layer
import CONFIG from '../config.js';

class ApiService {
    constructor() {
        this.baseURL = CONFIG.API.BASE_URL;
    }

    // Generic HTTP methods
    async request(endpoint, options = {}) {
        // In offline development mode, simulate API unavailability without network calls
        if (CONFIG.DEVELOPMENT.OFFLINE_MODE && CONFIG.DEVELOPMENT.SUPPRESS_API_WARNINGS) {
            // Simulate a brief delay to mimic real API behavior
            await new Promise(resolve => setTimeout(resolve, 100));
            throw new Error('HTTP 500: Internal Server Error (Simulated Offline)');
        }
        
        const url = `${this.baseURL}${endpoint}`;
        
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            // Only log API errors if not suppressed in development
            if (!CONFIG.DEVELOPMENT.SUPPRESS_API_WARNINGS) {
                if (error.message.includes('500')) {
                    console.warn(`⚠️ API Backend no disponible [${endpoint}]:`, error.message);
                } else {
                    console.error(`❌ API Error [${endpoint}]:`, error);
                }
            } else if (CONFIG.DEVELOPMENT.DEBUG_LEVEL === 'verbose') {
                console.debug(`🔇 API call suppressed [${endpoint}]`);
            }
            throw error;
        }
    }

    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint, data) {
        return this.request(endpoint, {
            method: 'DELETE',
            body: JSON.stringify(data)
        });
    }

    // File upload (multipart/form-data)
    async uploadFile(endpoint, formData) {
        const url = `${this.baseURL}${endpoint}`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData // No Content-Type header for FormData
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Upload Error [${endpoint}]:`, error);
            throw error;
        }
    }

    // Specific API methods
    async uploadPhoto(file, type) {
        const formData = new FormData();
        formData.append('photo', file);
        formData.append('tipo', type);
        
        return this.uploadFile(CONFIG.API.ENDPOINTS.UPLOAD, formData);
    }

    async getPhotos(page = 1, limit = CONFIG.GALLERY.PHOTOS_PER_PAGE) {
        return this.get(`${CONFIG.API.ENDPOINTS.PHOTOS}?page=${page}&limit=${limit}`);
    }

    async getPrices() {
        return this.get(CONFIG.API.ENDPOINTS.PRICES);
    }

    async updatePrice(type, price) {
        return this.put(`${CONFIG.API.ENDPOINTS.PRICES}/${type}`, { precio: price });
    }

    async getStatistics() {
        return this.get(CONFIG.API.ENDPOINTS.STATS);
    }

    async getDatabaseStats() {
        return this.get(CONFIG.API.ENDPOINTS.DB_STATS);
    }

    async deleteAllPhotos(password) {
        return this.delete(CONFIG.API.ENDPOINTS.DELETE_ALL, { password });
    }
}

export default new ApiService();