// Utilities Service
import CONFIG from '../config.js';

class UtilsService {
    constructor() {
        this.isOnline = navigator.onLine;
        this.setupConnectionListeners();
    }

    // Setup online/offline listeners
    setupConnectionListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.dispatchConnectionEvent('online');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.dispatchConnectionEvent('offline');
        });
    }

    // Dispatch connection status event
    dispatchConnectionEvent(status) {
        document.dispatchEvent(new CustomEvent('connection:change', {
            detail: { status, isOnline: this.isOnline }
        }));
    }

    // Show status message
    showStatus(message, type = 'info', containerId = 'status', duration = CONFIG.UI.STATUS_MESSAGE_DURATION) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.className = `alert alert-${type}`;
        container.textContent = message;

        // Auto-hide after duration
        setTimeout(() => {
            container.className = '';
            container.textContent = '';
        }, duration);
    }

    // Format date to local string
    formatDate(dateString) {
        return new Date(dateString).toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Format currency
    formatCurrency(amount) {
        return `$${parseFloat(amount || 0).toFixed(2)}`;
    }

    // Create loading spinner
    createLoadingSpinner(text = 'Cargando...') {
        return `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status"></div>
                <p class="mt-2">${text}</p>
            </div>
        `;
    }

    // Create modal
    createModal(content, className = '') {
        const modal = document.createElement('div');
        modal.className = `position-fixed w-100 h-100 bg-dark bg-opacity-75 d-flex align-items-center justify-content-center ${className}`;
        modal.style.cssText = 'top: 0; left: 0; z-index: 10000; cursor: pointer;';
        modal.innerHTML = content;
        modal.onclick = () => document.body.removeChild(modal);
        return modal;
    }

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Throttle function
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Check if element is in viewport
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    // Smooth scroll to element
    scrollToElement(element, offset = 0) {
        const elementPosition = element.offsetTop - offset;
        window.scrollTo({
            top: elementPosition,
            behavior: 'smooth'
        });
    }
}

export default new UtilsService();