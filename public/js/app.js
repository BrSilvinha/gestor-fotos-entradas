// Main Application Entry Point
import LoginComponent from './components/LoginComponent.js';
import NavigationComponent from './components/NavigationComponent.js';
import UserManagementComponent from './components/UserManagementComponent.js';
import EventManagementComponent from './components/EventManagementComponent.js';
import CameraComponent from './components/CameraComponent.js';
import GalleryComponent from './components/GalleryComponent.js';
import { 
    HeaderComponent, 
    StatisticsComponent, 
    PricingComponent, 
    StorageComponent, 
    ConnectionComponent 
} from './components/UIComponents.js';
import authService from './services/authService.js';
import viewManager from './services/viewManager.js';
import CONFIG from './config.js';

class PhotoManagerApp {
    constructor() {
        this.components = {};
        this.isInitialized = false;
        this.init();
    }

    init() {
        console.log('🚀 Iniciando Photo Manager App...');
        
        // Show development mode info
        if (CONFIG.DEVELOPMENT.SUPPRESS_API_WARNINGS) {
            console.log('🔇 Modo desarrollo: API warnings suprimidos');
            if (CONFIG.DEVELOPMENT.OFFLINE_MODE) {
                console.log('📱 Modo offline: API calls simulados sin red');
            }
            console.log('💡 Para conectar al backend real, cambia OFFLINE_MODE a false en config.js');
        }
        
        // Initialize all components
        this.initializeComponents();
        
        // Setup global event listeners
        this.setupGlobalEvents();
        
        // Check authentication status
        this.checkInitialAuth();
    }

    initializeComponents() {
        console.log('📦 Inicializando componentes...');

        // Core components
        this.components.login = new LoginComponent('loginModule');
        this.components.navigation = new NavigationComponent('navigationModule');
        this.components.connection = new ConnectionComponent('connectionStatus');
        
        // UI components
        this.components.header = new HeaderComponent('headerModule');
        this.components.statistics = new StatisticsComponent('statisticsModule');
        this.components.camera = new CameraComponent('cameraModule');
        this.components.storage = new StorageComponent('storageModule');
        this.components.gallery = new GalleryComponent('galleryModule');
        
        // Admin components (initialized but visibility controlled by roles)
        this.components.userManagement = new UserManagementComponent('userManagementModule');
        this.components.eventManagement = new EventManagementComponent('eventManagementModule');
        this.components.pricing = new PricingComponent('pricingModule');
        
        // Make components available globally for navigation and event handlers
        window.userMgmt = this.components.userManagement;
        window.eventMgmt = this.components.eventManagement;
        window.viewManager = viewManager;

        console.log('✅ Componentes inicializados');
    }

    setupGlobalEvents() {
        // Authentication events
        document.addEventListener('auth:success', (e) => {
            this.showMainContent();
            this.updateUserInterface();
            
            // Initialize view manager for user
            viewManager.initializeForUser(e.detail.user);
            
            if (!this.isInitialized) {
                this.initializeApp();
            }
        });

        document.addEventListener('auth:required', () => {
            this.hideMainContent();
        });

        document.addEventListener('auth:logout', () => {
            this.hideMainContent();
        });

        // Cross-component communication events
        document.addEventListener('prices:updated', () => {
            this.components.header.updatePrices();
        });

        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleGlobalKeyboard(e);
        });

        // Error handling
        window.addEventListener('error', (e) => {
            console.error('💥 Error global:', e.error);
            this.handleGlobalError(e.error);
        });

        window.addEventListener('unhandledrejection', (e) => {
            console.error('💥 Promesa rechazada:', e.reason);
            this.handleGlobalError(e.reason);
        });
    }

    checkInitialAuth() {
        console.log('🔐 Verificando autenticación...');
        this.components.login.checkAuthOnLoad();
    }

    showMainContent() {
        const mainContent = document.getElementById('mainContent');
        const navigation = document.getElementById('navigationModule');
        
        mainContent.classList.remove('d-none');
        navigation.classList.remove('d-none');
        
        console.log('✅ Contenido principal mostrado');
    }

    hideMainContent() {
        const mainContent = document.getElementById('mainContent');
        const navigation = document.getElementById('navigationModule');
        
        mainContent.classList.add('d-none');
        navigation.classList.add('d-none');
        
        console.log('🔒 Contenido principal oculto');
    }

    updateUserInterface() {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) return;

        // Update components that need user context
        if (this.components.pricing) {
            this.components.pricing.updateUserRole(currentUser.role);
        }

        console.log(`🎭 Interfaz actualizada para rol: ${currentUser.role}`);
    }

    async initializeApp() {
        if (this.isInitialized) return;

        console.log('⚡ Inicializando aplicación...');
        
        try {
            // Trigger initial data loading for all components
            await Promise.all([
                this.components.statistics.loadStats(),
                this.components.storage.loadStats(),
                this.components.gallery.loadGallery()
            ]);

            this.isInitialized = true;
            console.log('✅ Aplicación inicializada correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando aplicación:', error);
            this.handleGlobalError(error);
        }
    }

    handleGlobalKeyboard(event) {
        // ESC key - useful for closing modals or canceling actions
        if (event.key === 'Escape') {
            // Close any open modals
            const modals = document.querySelectorAll('.position-fixed[style*="z-index: 10000"]');
            modals.forEach(modal => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            });
        }

        // Ctrl/Cmd + R - Refresh data
        if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
            event.preventDefault();
            this.refreshAllData();
        }
    }

    handleGlobalError(error) {
        // Here you could integrate with error reporting services
        // For now, just log and show a generic error
        console.error('App Error:', error);
    }

    async refreshAllData() {
        console.log('🔄 Actualizando todos los datos...');
        
        try {
            await Promise.all([
                this.components.statistics.loadStats(),
                this.components.storage.loadStats(),
                this.components.gallery.loadGallery(),
                this.components.header.loadPrices()
            ]);
            
            console.log('✅ Datos actualizados');
        } catch (error) {
            console.error('❌ Error actualizando datos:', error);
        }
    }

    // Public API for external access
    getComponent(name) {
        return this.components[name];
    }

    // Lifecycle methods
    destroy() {
        console.log('🧹 Limpiando aplicación...');
        // Clean up event listeners, intervals, etc.
        Object.values(this.components).forEach(component => {
            if (component.destroy && typeof component.destroy === 'function') {
                component.destroy();
            }
        });
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Make app globally accessible for debugging
    window.photoApp = new PhotoManagerApp();
    
    console.log('🎉 Photo Manager App iniciada');
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.photoApp) {
        window.photoApp.destroy();
    }
});