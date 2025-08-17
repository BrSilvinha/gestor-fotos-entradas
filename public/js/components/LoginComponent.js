// Professional Login Component
import authService from '../services/authService.js';
import utilsService from '../services/utilsService.js';

class LoginComponent {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.isVisible = false;
        this.init();
    }

    init() {
        this.render();
        
        // Ensure DOM is ready before binding events
        setTimeout(() => {
            this.bindEvents();
        }, 0);
        
        // Listen for auth required events
        document.addEventListener('auth:required', () => this.show());
        document.addEventListener('auth:unauthorized', (e) => this.showUnauthorized(e.detail.message));
    }

    render() {
        this.container.innerHTML = `
            <!-- Professional Login Modal -->
            <div class="position-fixed w-100 h-100 d-flex align-items-center justify-content-center d-none" 
                 id="loginOverlay" style="z-index: 9999; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <div class="card shadow-lg border-0" style="width: 100%; max-width: 420px; margin: 20px;">
                    <!-- Header -->
                    <div class="card-header bg-dark text-white text-center py-4 border-0">
                        <div class="mb-3">
                            <i class="bi bi-camera-fill" style="font-size: 3rem;"></i>
                        </div>
                        <h3 class="mb-1 fw-bold">Gestor de Fotos</h3>
                        <p class="mb-0 text-light opacity-75">Sistema de Gestión de Entradas</p>
                    </div>
                    
                    <!-- Body -->
                    <div class="card-body p-4">
                        <div class="text-center mb-4">
                            <h5 class="card-title text-dark">Iniciar Sesión</h5>
                            <p class="text-muted small">Ingresa tus credenciales para continuar</p>
                        </div>
                        
                        <form id="loginForm" novalidate>
                            <!-- Email Field -->
                            <div class="mb-3">
                                <label for="loginEmail" class="form-label small fw-semibold text-dark">
                                    <i class="bi bi-envelope me-1"></i> Correo Electrónico
                                </label>
                                <input type="email" 
                                       class="form-control form-control-lg" 
                                       id="loginEmail" 
                                       placeholder="usuario@ejemplo.com"
                                       required>
                                <div class="invalid-feedback"></div>
                            </div>
                            
                            <!-- Password Field -->
                            <div class="mb-4">
                                <label for="loginPassword" class="form-label small fw-semibold text-dark">
                                    <i class="bi bi-lock me-1"></i> Contraseña
                                </label>
                                <div class="input-group">
                                    <input type="password" 
                                           class="form-control form-control-lg" 
                                           id="loginPassword" 
                                           placeholder="••••••••"
                                           required>
                                    <button class="btn btn-outline-secondary" type="button" id="togglePassword">
                                        <i class="bi bi-eye"></i>
                                    </button>
                                </div>
                                <div class="invalid-feedback"></div>
                            </div>
                            
                            <!-- Submit Button -->
                            <div class="d-grid mb-3">
                                <button type="submit" class="btn btn-dark btn-lg" id="loginButton">
                                    <span id="loginButtonText">
                                        <i class="bi bi-unlock me-2"></i> Iniciar Sesión
                                    </span>
                                    <span id="loginButtonLoading" class="d-none">
                                        <span class="spinner-border spinner-border-sm me-2"></span> Verificando...
                                    </span>
                                </button>
                            </div>
                        </form>
                        
                        <!-- Error Alert -->
                        <div id="loginError" class="alert alert-danger d-none" role="alert">
                            <i class="bi bi-exclamation-triangle me-2"></i>
                            <span id="loginErrorText"></span>
                        </div>
                        
                        <!-- Demo Credentials (Development) -->
                        <div class="bg-light rounded p-3 mt-3">
                            <div class="text-center">
                                <small class="text-muted fw-semibold">Credenciales de prueba:</small>
                            </div>
                            <div class="mt-2">
                                <small class="text-muted d-block">
                                    <strong>Admin:</strong> jhamirsilva@gmail.com / 71749437
                                </small>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div class="card-footer bg-light text-center py-3 border-0">
                        <small class="text-muted">
                            <i class="bi bi-shield-check me-1"></i>
                            Acceso seguro y encriptado
                        </small>
                    </div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        const form = this.container.querySelector('#loginForm');
        const emailInput = this.container.querySelector('#loginEmail');
        const passwordInput = this.container.querySelector('#loginPassword');
        const togglePassword = this.container.querySelector('#togglePassword');
        const loginButton = this.container.querySelector('#loginButton');

        // Check if elements exist before binding events
        if (!form || !emailInput || !passwordInput || !togglePassword || !loginButton) {
            console.error('Login form elements not found during binding');
            return;
        }

        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Toggle password visibility
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            const icon = togglePassword.querySelector('i');
            if (icon) {
                icon.className = type === 'password' ? 'bi bi-eye' : 'bi bi-eye-slash';
            }
        });

        // Input validation
        emailInput.addEventListener('input', () => this.validateEmail());
        passwordInput.addEventListener('input', () => this.validatePassword());

        // Focus management
        emailInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                passwordInput.focus();
            }
        });
    }

    validateEmail() {
        const emailInput = this.container.querySelector('#loginEmail');
        if (!emailInput) return false;
        
        const value = emailInput.value.trim();
        
        if (!value) {
            this.setFieldError(emailInput, 'El email es requerido');
            return false;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            this.setFieldError(emailInput, 'Ingresa un email válido');
            return false;
        }
        
        this.clearFieldError(emailInput);
        return true;
    }

    validatePassword() {
        const passwordInput = this.container.querySelector('#loginPassword');
        if (!passwordInput) return false;
        
        const value = passwordInput.value;
        
        if (!value) {
            this.setFieldError(passwordInput, 'La contraseña es requerida');
            return false;
        }
        
        if (value.length < 6) {
            this.setFieldError(passwordInput, 'Mínimo 6 caracteres');
            return false;
        }
        
        this.clearFieldError(passwordInput);
        return true;
    }

    setFieldError(input, message) {
        if (!input) return;
        
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
        const feedback = input.parentNode.querySelector('.invalid-feedback') || 
                        input.nextElementSibling;
        if (feedback) {
            feedback.textContent = message;
        }
    }

    clearFieldError(input) {
        if (!input) return;
        
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
    }

    async handleLogin() {
        const emailInput = this.container.querySelector('#loginEmail');
        const passwordInput = this.container.querySelector('#loginPassword');
        const loginButton = this.container.querySelector('#loginButton');
        const loginButtonText = this.container.querySelector('#loginButtonText');
        const loginButtonLoading = this.container.querySelector('#loginButtonLoading');

        // Check if elements exist (prevent null reference errors)
        if (!emailInput || !passwordInput || !loginButton || !loginButtonText || !loginButtonLoading) {
            console.error('Login form elements not found:', {
                emailInput: !!emailInput,
                passwordInput: !!passwordInput,
                loginButton: !!loginButton,
                loginButtonText: !!loginButtonText,
                loginButtonLoading: !!loginButtonLoading,
                containerVisible: !this.container.querySelector('#loginOverlay').classList.contains('d-none')
            });
            return;
        }

        // Validate inputs
        const emailValid = this.validateEmail();
        const passwordValid = this.validatePassword();

        if (!emailValid || !passwordValid) {
            return;
        }

        // Show loading state
        loginButton.disabled = true;
        loginButtonText.classList.add('d-none');
        loginButtonLoading.classList.remove('d-none');
        this.hideError();

        try {
            // Simulate API delay for better UX
            await new Promise(resolve => setTimeout(resolve, 1000));

            const email = emailInput.value.trim();
            const password = passwordInput.value;

            if (authService.authenticate(email, password)) {
                // Success
                this.showSuccess();
                setTimeout(() => {
                    this.hide();
                    document.dispatchEvent(new CustomEvent('auth:success', {
                        detail: { user: authService.getCurrentUser() }
                    }));
                }, 1000);
            } else {
                this.showError('Credenciales incorrectas. Verifica tu email y contraseña.');
                emailInput.focus();
            }
        } catch (error) {
            this.showError('Error de conexión. Inténtalo de nuevo.');
        } finally {
            // Reset button state (with null checks)
            if (loginButton) {
                loginButton.disabled = false;
            }
            if (loginButtonText) {
                loginButtonText.classList.remove('d-none');
            }
            if (loginButtonLoading) {
                loginButtonLoading.classList.add('d-none');
            }
        }
    }

    showError(message) {
        const errorDiv = this.container.querySelector('#loginError');
        const errorText = this.container.querySelector('#loginErrorText');
        
        if (errorText) {
            errorText.textContent = message;
        }
        if (errorDiv) {
            errorDiv.classList.remove('d-none');
        }
    }

    hideError() {
        const errorDiv = this.container.querySelector('#loginError');
        if (errorDiv) {
            errorDiv.classList.add('d-none');
        }
    }

    showSuccess() {
        const loginButton = this.container.querySelector('#loginButton');
        if (loginButton) {
            loginButton.innerHTML = `
                <span id="loginButtonText">
                    <i class="bi bi-check-circle me-2"></i> ¡Bienvenido!
                </span>
                <span id="loginButtonLoading" class="d-none">
                    <span class="spinner-border spinner-border-sm me-2"></span> Verificando...
                </span>
            `;
            loginButton.classList.remove('btn-dark');
            loginButton.classList.add('btn-success');
        }
    }

    showUnauthorized(message) {
        utilsService.showStatus(message, 'danger');
    }

    show() {
        const overlay = this.container.querySelector('#loginOverlay');
        const emailInput = this.container.querySelector('#loginEmail');
        
        if (overlay) {
            overlay.classList.remove('d-none');
        }
        
        // Reset form
        this.resetForm();
        
        // Focus email input
        if (emailInput) {
            setTimeout(() => emailInput.focus(), 100);
        }
        
        this.isVisible = true;
    }

    hide() {
        const overlay = this.container.querySelector('#loginOverlay');
        if (overlay) {
            overlay.classList.add('d-none');
        }
        this.isVisible = false;
    }

    resetForm() {
        const form = this.container.querySelector('#loginForm');
        const loginButton = this.container.querySelector('#loginButton');
        
        if (form) {
            form.reset();
            form.classList.remove('was-validated');
            
            // Reset all field states
            form.querySelectorAll('.form-control').forEach(input => {
                input.classList.remove('is-invalid', 'is-valid');
            });
        }
        
        // Reset button
        if (loginButton) {
            loginButton.innerHTML = `
                <span id="loginButtonText">
                    <i class="bi bi-unlock me-2"></i> Iniciar Sesión
                </span>
                <span id="loginButtonLoading" class="d-none">
                    <span class="spinner-border spinner-border-sm me-2"></span> Verificando...
                </span>
            `;
            loginButton.classList.remove('btn-success');
            loginButton.classList.add('btn-dark');
            loginButton.disabled = false;
        }
        
        this.hideError();
    }

    // Check auth on load
    checkAuthOnLoad() {
        if (authService.checkAuth()) {
            this.hide();
            document.dispatchEvent(new CustomEvent('auth:success', {
                detail: { user: authService.getCurrentUser() }
            }));
        } else {
            this.show();
        }
    }
}

export default LoginComponent;