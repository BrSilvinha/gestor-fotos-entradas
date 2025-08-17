// UI Components (Header, Statistics, Pricing, Storage)
import apiService from '../services/apiService.js';
import authService from '../services/authService.js';
import utilsService from '../services/utilsService.js';
import CONFIG from '../config.js';

// Header Component
export class HeaderComponent {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentPrices = { general: 50, vip: 100 };
        this.apiAvailable = true;
        this.init();
    }

    init() {
        this.render();
        this.loadPrices();
    }

    render() {
        this.container.innerHTML = `
            <div class="bg-primary text-white rounded-4 p-4 mb-4 shadow">
                <div class="text-center">
                    <h1 class="display-4 fw-bold mb-3">
                        <i class="bi bi-camera-fill me-3"></i>
                        Gestor de Fotos de Entradas
                    </h1>
                    <p class="lead mb-3">Sistema de Gestión Profesional</p>
                    <div class="badge bg-light text-primary fs-6 px-4 py-2 rounded-pill" id="priceIndicator">
                        <i class="bi bi-currency-dollar me-1"></i>
                        Cargando precios...
                    </div>
                    <div class="badge bg-warning text-dark fs-6 px-3 py-2 rounded-pill mt-2 d-none" id="apiStatusIndicator">
                        <i class="bi bi-exclamation-triangle me-1"></i>
                        Modo Offline - API no disponible
                    </div>
                </div>
            </div>
        `;
    }

    async loadPrices() {
        try {
            const precios = await apiService.getPrices();
            
            precios.forEach(precio => {
                this.currentPrices[precio.tipo] = parseFloat(precio.precio);
            });

            const indicator = this.container.querySelector('#priceIndicator');
            indicator.textContent = 
                `General: ${utilsService.formatCurrency(this.currentPrices.general)} | VIP: ${utilsService.formatCurrency(this.currentPrices.vip)}`;

        } catch (error) {
            if (!CONFIG.DEVELOPMENT.SUPPRESS_API_WARNINGS) {
                console.warn('💰 API no disponible - precios en modo offline');
            }
            this.apiAvailable = false;
            
            const indicator = this.container.querySelector('#priceIndicator');
            const apiStatusIndicator = this.container.querySelector('#apiStatusIndicator');
            
            indicator.textContent = 'Precios no disponibles (Modo Offline)';
            indicator.className = 'badge bg-secondary text-white fs-6 px-4 py-2 rounded-pill';
            
            if (apiStatusIndicator) {
                apiStatusIndicator.classList.remove('d-none');
            }
        }
    }

    updatePrices() {
        this.loadPrices();
    }
}

// Statistics Component
export class StatisticsComponent {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.init();
    }

    init() {
        this.render();
        this.bindEvents();
        this.setupAutoUpdate();
        
        // Listen for auth events to load stats when authenticated
        document.addEventListener('auth:success', () => {
            this.loadStats();
        });
        
        // Listen for photo events
        document.addEventListener('photo:uploaded', () => this.loadStats());
        document.addEventListener('photos:deleted', () => this.loadStats());
        
        // Try to load stats if already authenticated
        if (authService.getCurrentUser()) {
            this.loadStats();
        }
    }

    render() {
        this.container.innerHTML = `
            <div class="card mb-4">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h3 class="card-title mb-0">📊 Estadísticas del Día</h3>
                        <button class="btn btn-outline-secondary btn-sm" id="refreshStats">
                            <i class="bi bi-arrow-clockwise"></i> Actualizar
                        </button>
                    </div>
                    <div class="row text-center">
                        <div class="col-3">
                            <div class="p-3 bg-light rounded">
                                <div class="h4 text-primary" id="totalHoy">$0</div>
                                <small class="text-muted">Total Hoy</small>
                            </div>
                        </div>
                        <div class="col-3">
                            <div class="p-3 bg-light rounded">
                                <div class="h4 text-success" id="generalHoy">0</div>
                                <small class="text-muted">General Hoy</small>
                            </div>
                        </div>
                        <div class="col-3">
                            <div class="p-3 bg-light rounded">
                                <div class="h4 text-warning" id="vipHoy">0</div>
                                <small class="text-muted">VIP Hoy</small>
                            </div>
                        </div>
                        <div class="col-3">
                            <div class="p-3 bg-light rounded">
                                <div class="h4 text-info" id="totalGeneral">$0</div>
                                <small class="text-muted">Total Recaudado</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        this.container.querySelector('#refreshStats').addEventListener('click', () => {
            this.loadStats();
        });
    }

    async loadStats() {
        try {
            const stats = await apiService.getStatistics();

            this.container.querySelector('#totalHoy').textContent = utilsService.formatCurrency(stats.hoy.total);
            this.container.querySelector('#generalHoy').textContent = stats.general.cantidad;
            this.container.querySelector('#vipHoy').textContent = stats.vip.cantidad;
            this.container.querySelector('#totalGeneral').textContent = utilsService.formatCurrency(stats.total.total);

        } catch (error) {
            if (!CONFIG.DEVELOPMENT.SUPPRESS_API_WARNINGS) {
                console.warn('📊 API no disponible - usando valores placeholder para estadísticas');
            }
            
            // Show placeholder values when API is not available
            this.container.querySelector('#totalHoy').textContent = '$0';
            this.container.querySelector('#generalHoy').textContent = '0';
            this.container.querySelector('#vipHoy').textContent = '0';
            this.container.querySelector('#totalGeneral').textContent = '$0';
        }
    }

    setupAutoUpdate() {
        setInterval(() => {
            if (utilsService.isOnline) {
                this.loadStats();
            }
        }, 30000); // Update every 30 seconds
    }
}

// Pricing Component
export class PricingComponent {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.init();
    }

    init() {
        this.render();
        this.bindEvents();
        
        // Listen for auth events to load prices when authenticated
        document.addEventListener('auth:success', () => {
            this.loadPrices();
        });
        
        // Try to load prices if already authenticated
        if (authService.getCurrentUser()) {
            this.loadPrices();
        }
    }

    render() {
        this.container.innerHTML = `
            <div class="card mb-4">
                <div class="card-body">
                    <h3 class="card-title">💰 Configurar Precios</h3>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label fw-semibold">Entrada General:</label>
                            <div class="input-group">
                                <span class="input-group-text">$</span>
                                <input type="number" id="precioGeneral" class="form-control" step="0.01" min="0">
                                <button class="btn btn-primary" data-type="general">Actualizar</button>
                            </div>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label fw-semibold">Entrada VIP:</label>
                            <div class="input-group">
                                <span class="input-group-text">$</span>
                                <input type="number" id="precioVip" class="form-control" step="0.01" min="0">
                                <button class="btn btn-primary" data-type="vip">Actualizar</button>
                            </div>
                        </div>
                    </div>
                    <div id="pricingStatus"></div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        const updateButtons = this.container.querySelectorAll('[data-type]');
        updateButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                this.updatePrice(type);
            });
        });
    }

    async loadPrices() {
        try {
            const precios = await apiService.getPrices();
            
            precios.forEach(precio => {
                const inputId = precio.tipo === 'general' ? 'precioGeneral' : 'precioVip';
                this.container.querySelector(`#${inputId}`).value = precio.precio;
            });

        } catch (error) {
            if (!CONFIG.DEVELOPMENT.SUPPRESS_API_WARNINGS) {
                console.warn('💰 API no disponible - precios en modo offline');
            }
            
            // Set default placeholder values when API is not available
            const generalInput = this.container.querySelector('#precioGeneral');
            const vipInput = this.container.querySelector('#precioVip');
            if (generalInput) generalInput.placeholder = 'API no disponible';
            if (vipInput) vipInput.placeholder = 'API no disponible';
        }
    }

    async updatePrice(tipo) {
        return authService.requireAuth(async () => {
            const inputId = tipo === 'general' ? 'precioGeneral' : 'precioVip';
            const precio = this.container.querySelector(`#${inputId}`).value;

            if (!precio || precio < 0) {
                utilsService.showStatus('Precio inválido', 'danger', 'pricingStatus');
                return;
            }

            try {
                const result = await apiService.updatePrice(tipo, parseFloat(precio));

                if (result.success) {
                    utilsService.showStatus(result.message, 'success', 'pricingStatus');
                    
                    // Notify header to update price indicator
                    document.dispatchEvent(new CustomEvent('prices:updated'));
                } else {
                    utilsService.showStatus(result.error, 'danger', 'pricingStatus');
                }
            } catch (error) {
                utilsService.showStatus('Error de conexión', 'danger', 'pricingStatus');
            }
        });
    }

    updateUserRole(role) {
        // Update pricing component based on user role
        // This method is called when user role changes
        console.log(`💰 Pricing component updated for role: ${role}`);
        
        // You can add role-specific behavior here if needed
        // For example, disable certain features for non-admin users
        if (role !== 'admin') {
            // Could disable price editing for non-admin users
            const updateButtons = this.container.querySelectorAll('[data-type]');
            updateButtons.forEach(button => {
                button.disabled = true;
                button.title = 'Solo administradores pueden cambiar precios';
            });
        } else {
            // Enable price editing for admin users
            const updateButtons = this.container.querySelectorAll('[data-type]');
            updateButtons.forEach(button => {
                button.disabled = false;
                button.title = '';
            });
        }
    }
}

// Storage Component
export class StorageComponent {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.init();
    }

    init() {
        this.render();
        this.bindEvents();
        
        // Listen for auth events to load stats when authenticated
        document.addEventListener('auth:success', () => {
            this.loadStats();
        });
        
        // Listen for photo events
        document.addEventListener('photo:uploaded', () => this.loadStats());
        document.addEventListener('photos:deleted', () => this.loadStats());
        
        // Try to load stats if already authenticated
        if (authService.getCurrentUser()) {
            this.loadStats();
        }
    }

    render() {
        this.container.innerHTML = `
            <div class="card mb-4">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h3 class="card-title mb-0">💾 Estado del Almacenamiento</h3>
                        <button class="btn btn-outline-secondary btn-sm" id="refreshStorage">
                            <i class="bi bi-arrow-clockwise"></i> Actualizar
                        </button>
                    </div>
                    <div class="row text-center">
                        <div class="col-3">
                            <div class="p-3 bg-light rounded">
                                <div class="h5 text-primary" id="totalPhotosDB">-</div>
                                <small class="text-muted">Total Fotos</small>
                            </div>
                        </div>
                        <div class="col-3">
                            <div class="p-3 bg-light rounded">
                                <div class="h5 text-success" id="totalSizeMB">-</div>
                                <small class="text-muted">Espacio Usado</small>
                            </div>
                        </div>
                        <div class="col-3">
                            <div class="p-3 bg-light rounded">
                                <div class="h5 text-info" id="averageSizeKB">-</div>
                                <small class="text-muted">Tamaño Promedio</small>
                            </div>
                        </div>
                        <div class="col-3">
                            <div class="p-3 bg-light rounded">
                                <div class="h5 text-warning" id="photosToday">-</div>
                                <small class="text-muted">Fotos Hoy</small>
                            </div>
                        </div>
                    </div>
                    <div class="mt-3 text-center">
                        <small class="text-muted">
                            <i class="bi bi-folder"></i> <span id="storageLocation">-</span> | 
                            <i class="bi bi-database"></i> BD: <span id="databaseSizeMB">-</span>
                        </small>
                    </div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        this.container.querySelector('#refreshStorage').addEventListener('click', () => {
            this.loadStats();
        });
    }

    async loadStats() {
        try {
            const dbStats = await apiService.getDatabaseStats();

            this.container.querySelector('#totalPhotosDB').textContent = dbStats.total_photos || '0';
            this.container.querySelector('#totalSizeMB').textContent = `${dbStats.total_size_mb} MB`;
            this.container.querySelector('#averageSizeKB').textContent = `${dbStats.average_size_kb} KB`;
            this.container.querySelector('#photosToday').textContent = dbStats.photos_today || '0';
            this.container.querySelector('#storageLocation').textContent = dbStats.storage_location || 'No definido';
            this.container.querySelector('#databaseSizeMB').textContent = `${dbStats.database_size_mb} MB`;

        } catch (error) {
            if (!CONFIG.DEVELOPMENT.SUPPRESS_API_WARNINGS) {
                console.warn('💾 API no disponible - stats de almacenamiento en modo offline');
            }
            
            // Show placeholder values when API is not available
            this.container.querySelector('#totalPhotosDB').textContent = 'N/A';
            this.container.querySelector('#totalSizeMB').textContent = 'N/A';
            this.container.querySelector('#averageSizeKB').textContent = 'N/A';
            this.container.querySelector('#photosToday').textContent = 'N/A';
            this.container.querySelector('#storageLocation').textContent = 'API no disponible';
            this.container.querySelector('#databaseSizeMB').textContent = 'N/A';
        }
    }
}

// Connection Status Component
export class ConnectionComponent {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.init();
    }

    init() {
        this.render();
        this.bindEvents();
    }

    render() {
        this.container.innerHTML = `
            <div class="position-fixed top-0 end-0 m-3 alert alert-success rounded-pill px-3 py-2 d-none" id="connectionStatusAlert">
                🔗 Conectado
            </div>
        `;
    }

    bindEvents() {
        document.addEventListener('connection:change', (e) => {
            this.updateStatus(e.detail);
        });
    }

    updateStatus(detail) {
        const alert = this.container.querySelector('#connectionStatusAlert');
        
        if (detail.isOnline) {
            alert.className = 'position-fixed top-0 end-0 m-3 alert alert-success rounded-pill px-3 py-2';
            alert.textContent = '🔗 Conectado';
            alert.classList.remove('d-none');
            setTimeout(() => alert.classList.add('d-none'), 2000);
        } else {
            alert.className = 'position-fixed top-0 end-0 m-3 alert alert-danger rounded-pill px-3 py-2';
            alert.textContent = '📡 Sin conexión';
            alert.classList.remove('d-none');
        }
    }
}