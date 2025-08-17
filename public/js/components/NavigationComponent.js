// Professional Navigation Component
import authService from '../services/authService.js';
import utilsService from '../services/utilsService.js';
import viewManager from '../services/viewManager.js';

class NavigationComponent {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentUser = null;
        this.init();
    }

    init() {
        this.render();
        this.bindEvents();
        
        // Listen for auth events
        document.addEventListener('auth:success', (e) => {
            this.currentUser = e.detail.user;
            this.updateNavigation();
            this.populateViewsDropdown();
            this.show();
        });

        // Listen for view changes
        document.addEventListener('view:changed', (e) => {
            this.updateCurrentViewDisplay(e.detail.view);
        });
    }

    render() {
        this.container.innerHTML = `
            <nav class="navbar navbar-expand-lg navbar-dark bg-dark shadow">
                <div class="container-fluid">
                    <!-- Brand -->
                    <a class="navbar-brand fw-bold" href="#" onclick="window.scrollTo(0,0)">
                        <i class="bi bi-camera-fill me-2"></i>
                        Gestor de Fotos
                    </a>

                    <!-- Mobile menu button -->
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent">
                        <span class="navbar-toggler-icon"></span>
                    </button>

                    <!-- Navigation content -->
                    <div class="collapse navbar-collapse" id="navbarContent">
                        <!-- Main navigation -->
                        <ul class="navbar-nav me-auto">
                            <!-- Views Dropdown -->
                            <li class="nav-item dropdown">
                                <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" id="viewDropdown">
                                    <i class="bi bi-speedometer2 me-1"></i> 
                                    <span id="currentViewName">Dashboard</span>
                                </a>
                                <ul class="dropdown-menu" id="viewsDropdownMenu">
                                    <!-- Views will be populated dynamically -->
                                </ul>
                            </li>
                            
                            <!-- Quick Actions -->
                            <li class="nav-item">
                                <a class="nav-link" href="#" onclick="window.viewManager.switchToView('camera')">
                                    <i class="bi bi-camera me-1"></i> Cámara
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="#" onclick="window.viewManager.switchToView('gallery')">
                                    <i class="bi bi-images me-1"></i> Galería
                                </a>
                            </li>
                        </ul>

                        <!-- User menu -->
                        <ul class="navbar-nav">
                            <!-- Online status -->
                            <li class="nav-item">
                                <span class="nav-link" id="connectionBadge">
                                    <span class="badge bg-success">
                                        <i class="bi bi-wifi"></i> Conectado
                                    </span>
                                </span>
                            </li>
                            
                            <!-- User dropdown -->
                            <li class="nav-item dropdown">
                                <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                                    <div class="d-flex align-items-center">
                                        <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" 
                                             style="width: 32px; height: 32px;">
                                            <i class="bi bi-person"></i>
                                        </div>
                                        <div class="d-none d-md-block">
                                            <div class="small fw-bold" id="userDisplayName">Usuario</div>
                                            <div class="small text-muted" id="userRole">Rol</div>
                                        </div>
                                    </div>
                                </a>
                                <ul class="dropdown-menu dropdown-menu-end">
                                    <li>
                                        <div class="dropdown-header">
                                            <div class="fw-bold" id="userMenuName">Usuario</div>
                                            <div class="small text-muted" id="userMenuEmail">email@ejemplo.com</div>
                                        </div>
                                    </li>
                                    <li><hr class="dropdown-divider"></li>
                                    <li>
                                        <a class="dropdown-item" href="#" id="changePasswordLink">
                                            <i class="bi bi-key me-2"></i> Cambiar Contraseña
                                        </a>
                                    </li>
                                    <li>
                                        <a class="dropdown-item" href="#" onclick="navigator.clipboard.writeText(window.location.href)">
                                            <i class="bi bi-share me-2"></i> Compartir Enlace
                                        </a>
                                    </li>
                                    <li><hr class="dropdown-divider"></li>
                                    <li>
                                        <a class="dropdown-item text-danger" href="#" id="logoutLink">
                                            <i class="bi bi-box-arrow-right me-2"></i> Cerrar Sesión
                                        </a>
                                    </li>
                                </ul>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
        `;
    }

    bindEvents() {
        // Logout functionality
        const logoutLink = this.container.querySelector('#logoutLink');
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleLogout();
        });

        // Change password
        const changePasswordLink = this.container.querySelector('#changePasswordLink');
        changePasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.showChangePasswordModal();
        });

        // Connection status updates
        document.addEventListener('connection:change', (e) => {
            this.updateConnectionStatus(e.detail);
        });

        // View switching
        this.container.addEventListener('click', (e) => {
            const viewLink = e.target.closest('.view-switch');
            if (viewLink) {
                e.preventDefault();
                const viewId = viewLink.getAttribute('data-view-id');
                this.switchView(viewId);
                return;
            }

            // Smooth scrolling for navigation links (legacy)
            const link = e.target.closest('a[href^="#"]');
            if (link && link.getAttribute('href') !== '#') {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    }

    updateNavigation() {
        if (!this.currentUser) return;

        // Update user info
        this.container.querySelector('#userDisplayName').textContent = this.currentUser.name;
        this.container.querySelector('#userMenuName').textContent = this.currentUser.name;
        this.container.querySelector('#userMenuEmail').textContent = this.currentUser.email;
        
        // Update role display
        const roleText = this.currentUser.role === 'admin' ? 'Administrador' : 'Trabajador';
        this.container.querySelector('#userRole').textContent = roleText;

        // Update user avatar background color based on role
        const userAvatar = this.container.querySelector('.bg-primary');
        if (this.currentUser.role === 'admin') {
            userAvatar.className = 'bg-danger text-white rounded-circle d-flex align-items-center justify-content-center me-2';
        } else {
            userAvatar.className = 'bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2';
        }
    }

    populateViewsDropdown() {
        if (!this.currentUser) return;

        const dropdown = this.container.querySelector('#viewsDropdownMenu');
        const availableViews = viewManager.getAvailableViews(this.currentUser.role);
        
        dropdown.innerHTML = '';
        
        availableViews.forEach(viewId => {
            const viewInfo = viewManager.getViewInfo(viewId);
            if (viewInfo) {
                const li = document.createElement('li');
                li.innerHTML = `
                    <a class="dropdown-item view-switch" href="#" data-view-id="${viewId}">
                        <i class="${viewInfo.icon} me-2"></i> ${viewInfo.name}
                    </a>
                `;
                dropdown.appendChild(li);
            }
        });
    }

    updateCurrentViewDisplay(view) {
        const currentViewName = this.container.querySelector('#currentViewName');
        const currentViewIcon = this.container.querySelector('#viewDropdown i');
        
        if (currentViewName && currentViewIcon && view) {
            currentViewName.textContent = view.name;
            currentViewIcon.className = `${view.icon} me-1`;
        }
    }

    switchView(viewId) {
        viewManager.switchToView(viewId);
    }

    updateConnectionStatus(detail) {
        const connectionBadge = this.container.querySelector('#connectionBadge .badge');
        
        if (detail.isOnline) {
            connectionBadge.className = 'badge bg-success';
            connectionBadge.innerHTML = '<i class="bi bi-wifi"></i> Conectado';
        } else {
            connectionBadge.className = 'badge bg-danger';
            connectionBadge.innerHTML = '<i class="bi bi-wifi-off"></i> Sin conexión';
        }
    }

    handleLogout() {
        if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
            authService.logout();
            this.hide();
            document.dispatchEvent(new CustomEvent('auth:logout'));
            
            // Reload page to reset state
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    }

    showChangePasswordModal() {
        // Check if user management component exists and has the change password modal
        if (window.userMgmt && window.userMgmt.showChangePasswordModal) {
            window.userMgmt.showChangePasswordModal();
        } else {
            utilsService.showStatus('Función de cambio de contraseña no disponible', 'warning');
        }
    }

    show() {
        this.container.classList.remove('d-none');
    }

    hide() {
        this.container.classList.add('d-none');
    }

    // Highlight active navigation item based on scroll position
    updateActiveNavigation() {
        const sections = [
            'headerModule',
            'statisticsModule', 
            'cameraModule',
            'galleryModule',
            'userManagementModule',
            'eventManagementModule',
            'pricingModule',
            'storageModule'
        ];

        let activeSection = '';
        const scrollPos = window.scrollY + 100;

        sections.forEach(sectionId => {
            const element = document.getElementById(sectionId);
            if (element && !element.classList.contains('d-none')) {
                const rect = element.getBoundingClientRect();
                const elementTop = window.scrollY + rect.top;
                
                if (scrollPos >= elementTop) {
                    activeSection = sectionId;
                }
            }
        });

        // Update active navigation link
        this.container.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${activeSection}`) {
                link.classList.add('active');
            }
        });
    }
}

export default NavigationComponent;