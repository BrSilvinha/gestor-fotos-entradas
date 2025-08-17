// Authentication Service
import CONFIG from '../config.js';
import userService from './userService.js';

class AuthService {
    constructor() {
        this.currentUser = null;
        this.sessionKey = CONFIG.AUTH.SESSION_KEY;
    }

    // Check if user is authenticated
    checkAuth() {
        this.currentUser = userService.checkAuth();
        return !!this.currentUser;
    }

    // Authenticate user with email and password
    authenticate(email, password) {
        this.currentUser = userService.authenticate(email, password);
        return !!this.currentUser;
    }

    // Logout user
    logout() {
        userService.logout();
        this.currentUser = null;
        console.log('🚪 Sesión cerrada');
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if current user is admin
    isAdmin() {
        return userService.isAdmin();
    }

    // Check if current user is worker
    isWorker() {
        return userService.isWorker();
    }

    // Require authentication for callback execution
    requireAuth(callback) {
        if (!this.currentUser) {
            // Dispatch event to show login
            document.dispatchEvent(new CustomEvent('auth:required'));
            return false;
        }
        return callback();
    }

    // Require admin role
    requireAdmin(callback) {
        if (!this.currentUser) {
            document.dispatchEvent(new CustomEvent('auth:required'));
            return false;
        }

        if (!this.isAdmin()) {
            document.dispatchEvent(new CustomEvent('auth:unauthorized', {
                detail: { message: 'Acceso denegado: Se requieren permisos de administrador' }
            }));
            return false;
        }

        return callback();
    }

    // Validate delete password
    validateDeletePassword(password) {
        return password === CONFIG.AUTH.DELETE_PASSWORD;
    }
}

export default new AuthService();