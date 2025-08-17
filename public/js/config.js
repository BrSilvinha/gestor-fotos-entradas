// App Configuration
export const CONFIG = {
    // Authentication
    AUTH: {
        SESSION_KEY: 'photo_system_auth',
        DELETE_PASSWORD: '71749437',
        DEFAULT_ADMIN: {
            email: 'jhamirsilva@gmail.com',
            password: '71749437',
            role: 'admin',
            name: 'Jhamir Silva'
        }
    },
    
    // User Roles
    ROLES: {
        ADMIN: 'admin',
        WORKER: 'trabajador'
    },
    
    // API Endpoints
    API: {
        BASE_URL: 'https://gestor-fotos-entradas.onrender.com/api',
        ENDPOINTS: {
            LOGIN: '/auth/login',
            LOGOUT: '/auth/logout',
            USERS: '/users',
            EVENTS: '/events',
            EVENT_QR: '/events/:id/qr',
            UPLOAD: '/upload',
            PHOTOS: '/photos',
            PRICES: '/precios',
            STATS: '/estadisticas',
            DB_STATS: '/database-stats',
            DELETE_ALL: '/delete-all'
        }
    },
    
    // Gallery Settings
    GALLERY: {
        PHOTOS_PER_PAGE: 12,
        IMAGE_PREVIEW_HEIGHT: '200px'
    },
    
    // Image Processing
    IMAGE: {
        MAX_WIDTH: 800,
        MAX_HEIGHT: 600,
        QUALITY: 0.6,
        MAX_FILE_SIZE: 10 * 1024 * 1024 // 10MB
    },
    
    // UI Settings
    UI: {
        STATUS_MESSAGE_DURATION: 3000,
        STATS_UPDATE_INTERVAL: 30000,
        LOADING_DELAY: 500
    },
    
    // Entry Types
    ENTRY_TYPES: {
        GENERAL: 'general',
        VIP: 'vip'
    },
    
    // Event Configuration
    EVENTS: {
        STATUS: {
            DRAFT: 'draft',
            ACTIVE: 'active',
            COMPLETED: 'completed',
            CANCELLED: 'cancelled'
        },
        CATEGORIES: {
            GENERAL: 'general',
            VIP: 'vip',
            PREMIUM: 'premium'
        }
    },
    
    // UI Theme (Professional color palette)
    THEME: {
        PRIMARY: 'primary',      // Bootstrap blue
        SECONDARY: 'secondary',  // Bootstrap gray
        SUCCESS: 'success',      // Bootstrap green
        DANGER: 'danger',        // Bootstrap red
        WARNING: 'warning',      // Bootstrap yellow
        INFO: 'info',           // Bootstrap cyan
        LIGHT: 'light',         // Bootstrap light gray
        DARK: 'dark'            // Bootstrap dark
    },
    
    // Development settings
    DEVELOPMENT: {
        SUPPRESS_API_WARNINGS: false,  // Show API warnings to debug
        OFFLINE_MODE: false,           // Connect to real backend  
        DEBUG_LEVEL: 'normal'          // 'verbose', 'normal', 'minimal'
    }
};

export default CONFIG;