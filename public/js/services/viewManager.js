// View Manager - Manages different interfaces for admin and worker
import authService from './authService.js';

class ViewManager {
    constructor() {
        this.currentView = null;
        this.views = {
            admin: {
                id: 'admin',
                name: 'Vista Administrador',
                icon: 'bi-gear-fill',
                modules: [
                    'headerModule',
                    'statisticsModule',
                    'userManagementModule',
                    'eventManagementModule',
                    'pricingModule',
                    'cameraModule',
                    'storageModule',
                    'galleryModule'
                ]
            },
            worker: {
                id: 'worker',
                name: 'Vista Trabajador',
                icon: 'bi-camera-fill',
                modules: [
                    'headerModule',
                    'cameraModule',
                    'galleryModule',
                    'statisticsModule'
                ]
            },
            dashboard: {
                id: 'dashboard',
                name: 'Dashboard',
                icon: 'bi-speedometer2',
                modules: [
                    'headerModule',
                    'statisticsModule',
                    'storageModule'
                ]
            },
            camera: {
                id: 'camera',
                name: 'Cámara',
                icon: 'bi-camera',
                modules: [
                    'headerModule',
                    'cameraModule'
                ]
            },
            gallery: {
                id: 'gallery',
                name: 'Galería',
                icon: 'bi-images',
                modules: [
                    'headerModule',
                    'galleryModule'
                ]
            }
        };
    }

    // Get available views based on user role
    getAvailableViews(userRole) {
        const baseViews = ['dashboard', 'camera', 'gallery'];
        
        if (userRole === 'admin') {
            return ['admin', ...baseViews];
        } else {
            return ['worker', ...baseViews];
        }
    }

    // Get current view info
    getCurrentView() {
        return this.currentView;
    }

    // Switch to a specific view
    switchToView(viewId) {
        const view = this.views[viewId];
        if (!view) {
            console.error(`Vista '${viewId}' no encontrada`);
            return false;
        }

        const currentUser = authService.getCurrentUser();
        const availableViews = this.getAvailableViews(currentUser?.role);
        
        if (!availableViews.includes(viewId)) {
            console.error(`Vista '${viewId}' no disponible para el rol ${currentUser?.role}`);
            return false;
        }

        this.currentView = view;
        this.showView(view);
        
        // Dispatch view change event
        document.dispatchEvent(new CustomEvent('view:changed', {
            detail: { view: view, previousView: this.currentView }
        }));
        
        console.log(`🔄 Cambiando a vista: ${view.name}`);
        return true;
    }

    // Show specific view by hiding/showing modules
    showView(view) {
        // Hide all modules first
        this.hideAllModules();
        
        // Show modules for this view
        view.modules.forEach(moduleId => {
            this.showModule(moduleId);
        });

        // Handle admin-specific modules
        const adminModules = document.getElementById('adminModules');
        if (view.id === 'admin') {
            adminModules?.classList.remove('d-none');
        } else {
            adminModules?.classList.add('d-none');
        }

        // Update page title
        document.title = `${view.name} - Gestor de Fotos`;
    }

    // Hide all modules
    hideAllModules() {
        const allModules = [
            'headerModule',
            'statisticsModule',
            'userManagementModule',
            'eventManagementModule',
            'pricingModule',
            'cameraModule',
            'storageModule',
            'galleryModule',
            'adminModules'
        ];

        allModules.forEach(moduleId => {
            this.hideModule(moduleId);
        });
    }

    // Show specific module
    showModule(moduleId) {
        const module = document.getElementById(moduleId);
        if (module) {
            module.classList.remove('d-none');
            module.style.display = 'block';
        }
    }

    // Hide specific module
    hideModule(moduleId) {
        const module = document.getElementById(moduleId);
        if (module) {
            module.classList.add('d-none');
            module.style.display = 'none';
        }
    }

    // Get default view for user role
    getDefaultView(userRole) {
        return userRole === 'admin' ? 'admin' : 'worker';
    }

    // Initialize view based on user role
    initializeForUser(user) {
        const defaultView = this.getDefaultView(user.role);
        this.switchToView(defaultView);
    }

    // Get view info by ID
    getViewInfo(viewId) {
        return this.views[viewId] || null;
    }

    // Check if view is available for current user
    isViewAvailable(viewId) {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) return false;
        
        const availableViews = this.getAvailableViews(currentUser.role);
        return availableViews.includes(viewId);
    }
}

export default new ViewManager();