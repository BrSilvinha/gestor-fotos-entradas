// User Management Component (Admin Only)
import authService from '../services/authService.js';
import userService from '../services/userService.js';
import utilsService from '../services/utilsService.js';
import CONFIG from '../config.js';

class UserManagementComponent {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.users = [];
        this.filteredUsers = [];
        this.selectedUser = null;
        this.init();
    }

    init() {
        this.render();
        this.bindEvents();
        
        // Listen for auth events to load users when authenticated
        document.addEventListener('auth:success', () => {
            this.loadUsers();
        });
        
        // Try to load users if already authenticated
        if (authService.getCurrentUser()) {
            this.loadUsers();
        }
    }

    render() {
        this.container.innerHTML = `
            <div class="card mb-4">
                <div class="card-header bg-dark text-white">
                    <div class="d-flex justify-content-between align-items-center">
                        <h4 class="mb-0">
                            <i class="bi bi-people me-2"></i>
                            Gestión de Usuarios
                        </h4>
                        <button class="btn btn-success btn-sm" id="addUserBtn">
                            <i class="bi bi-person-plus me-1"></i> Nuevo Usuario
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <!-- Search Bar -->
                    <div class="row mb-4">
                        <div class="col-md-8">
                            <div class="input-group">
                                <span class="input-group-text">
                                    <i class="bi bi-search"></i>
                                </span>
                                <input type="text" 
                                       class="form-control" 
                                       id="userSearch" 
                                       placeholder="Buscar por nombre, email o rol...">
                                <button class="btn btn-outline-secondary" type="button" id="clearSearch">
                                    <i class="bi bi-x"></i>
                                </button>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <button class="btn btn-outline-primary w-100" id="refreshUsers">
                                <i class="bi bi-arrow-clockwise me-1"></i> Actualizar
                            </button>
                        </div>
                    </div>

                    <!-- Users Table -->
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead class="table-dark">
                                <tr>
                                    <th>Usuario</th>
                                    <th>Rol</th>
                                    <th>Estado</th>
                                    <th>Fecha Creación</th>
                                    <th class="text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="usersTableBody">
                                <tr>
                                    <td colspan="5" class="text-center py-4">
                                        <div class="spinner-border text-primary"></div>
                                        <p class="mt-2 text-muted">Cargando usuarios...</p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- No Results -->
                    <div id="noResults" class="text-center py-5 d-none">
                        <i class="bi bi-search text-muted" style="font-size: 3rem;"></i>
                        <h5 class="text-muted mt-3">No se encontraron usuarios</h5>
                        <p class="text-muted">Intenta con otros términos de búsqueda</p>
                    </div>
                </div>
            </div>

            <!-- User Modal -->
            <div class="modal fade" id="userModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title" id="userModalTitle">
                                <i class="bi bi-person-circle me-2"></i>
                                Nuevo Usuario
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="userForm" novalidate>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="userName" class="form-label">
                                                <i class="bi bi-person me-1"></i> Nombre Completo
                                            </label>
                                            <input type="text" class="form-control" id="userName" required>
                                            <div class="invalid-feedback"></div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="userEmail" class="form-label">
                                                <i class="bi bi-envelope me-1"></i> Correo Electrónico
                                            </label>
                                            <input type="email" class="form-control" id="userEmail" required>
                                            <div class="invalid-feedback"></div>
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="userPassword" class="form-label">
                                                <i class="bi bi-lock me-1"></i> Contraseña
                                            </label>
                                            <input type="password" class="form-control" id="userPassword" required>
                                            <div class="invalid-feedback"></div>
                                            <div class="form-text">Mínimo 6 caracteres</div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="userRole" class="form-label">
                                                <i class="bi bi-shield me-1"></i> Rol
                                            </label>
                                            <select class="form-select" id="userRole" required>
                                                <option value="">Selecciona un rol</option>
                                                <option value="${CONFIG.ROLES.ADMIN}">Administrador</option>
                                                <option value="${CONFIG.ROLES.WORKER}">Trabajador</option>
                                            </select>
                                            <div class="invalid-feedback"></div>
                                        </div>
                                    </div>
                                </div>
                                <div class="row" id="editUserFields" style="display: none;">
                                    <div class="col-12">
                                        <div class="form-check form-switch mb-3">
                                            <input class="form-check-input" type="checkbox" id="userActive">
                                            <label class="form-check-label" for="userActive">
                                                Usuario Activo
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                Cancelar
                            </button>
                            <button type="button" class="btn btn-primary" id="saveUserBtn">
                                <i class="bi bi-save me-1"></i>
                                <span id="saveUserText">Crear Usuario</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Change Password Modal -->
            <div class="modal fade" id="changePasswordModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-warning text-dark">
                            <h5 class="modal-title">
                                <i class="bi bi-key me-2"></i>
                                Cambiar Contraseña
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="changePasswordForm" novalidate>
                                <div class="mb-3">
                                    <label for="currentPassword" class="form-label">Contraseña Actual</label>
                                    <input type="password" class="form-control" id="currentPassword" required>
                                    <div class="invalid-feedback"></div>
                                </div>
                                <div class="mb-3">
                                    <label for="newPassword" class="form-label">Nueva Contraseña</label>
                                    <input type="password" class="form-control" id="newPassword" required>
                                    <div class="invalid-feedback"></div>
                                </div>
                                <div class="mb-3">
                                    <label for="confirmPassword" class="form-label">Confirmar Nueva Contraseña</label>
                                    <input type="password" class="form-control" id="confirmPassword" required>
                                    <div class="invalid-feedback"></div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                Cancelar
                            </button>
                            <button type="button" class="btn btn-warning" id="changePasswordBtn">
                                <i class="bi bi-key me-1"></i>
                                Cambiar Contraseña
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        // Search functionality
        const searchInput = this.container.querySelector('#userSearch');
        const clearSearch = this.container.querySelector('#clearSearch');
        const refreshBtn = this.container.querySelector('#refreshUsers');
        const addUserBtn = this.container.querySelector('#addUserBtn');
        const saveUserBtn = this.container.querySelector('#saveUserBtn');
        const changePasswordBtn = this.container.querySelector('#changePasswordBtn');

        searchInput.addEventListener('input', utilsService.debounce(() => this.filterUsers(), 300));
        clearSearch.addEventListener('click', () => this.clearSearch());
        refreshBtn.addEventListener('click', () => this.loadUsers());
        addUserBtn.addEventListener('click', () => this.showUserModal());
        saveUserBtn.addEventListener('click', () => this.saveUser());
        changePasswordBtn.addEventListener('click', () => this.changePassword());

        // Form validation
        const userForm = this.container.querySelector('#userForm');
        userForm.addEventListener('input', () => this.validateUserForm());
    }

    async loadUsers() {
        try {
            this.users = userService.getAllUsers();
            this.filteredUsers = [...this.users];
            this.renderUsersTable();
        } catch (error) {
            if (!CONFIG.DEVELOPMENT.SUPPRESS_API_WARNINGS) {
                console.error('Error cargando usuarios:', error);
            }
            utilsService.showStatus(error.message, 'danger');
        }
    }

    renderUsersTable() {
        const tbody = this.container.querySelector('#usersTableBody');
        const noResults = this.container.querySelector('#noResults');

        if (this.filteredUsers.length === 0) {
            tbody.innerHTML = '';
            noResults.classList.remove('d-none');
            return;
        }

        noResults.classList.add('d-none');

        tbody.innerHTML = this.filteredUsers.map(user => `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" 
                             style="width: 40px; height: 40px;">
                            <i class="bi bi-person"></i>
                        </div>
                        <div>
                            <div class="fw-bold">${user.name}</div>
                            <small class="text-muted">${user.email}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge bg-${user.role === 'admin' ? 'danger' : 'primary'}">
                        <i class="bi bi-${user.role === 'admin' ? 'shield-check' : 'person'}"></i>
                        ${user.role === 'admin' ? 'Administrador' : 'Trabajador'}
                    </span>
                </td>
                <td>
                    <span class="badge bg-${user.active ? 'success' : 'secondary'}">
                        <i class="bi bi-${user.active ? 'check-circle' : 'x-circle'}"></i>
                        ${user.active ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>
                    <small>${utilsService.formatDate(user.createdAt)}</small>
                </td>
                <td class="text-center">
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="window.userMgmt.editUser(${user.id})" title="Editar">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-warning" onclick="window.userMgmt.toggleUserActive(${user.id})" title="${user.active ? 'Desactivar' : 'Activar'}">
                            <i class="bi bi-${user.active ? 'x-circle' : 'check-circle'}"></i>
                        </button>
                        ${user.id !== authService.getCurrentUser().id ? `
                            <button class="btn btn-outline-danger" onclick="window.userMgmt.deleteUser(${user.id})" title="Eliminar">
                                <i class="bi bi-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    }

    filterUsers() {
        const query = this.container.querySelector('#userSearch').value;
        
        try {
            this.filteredUsers = userService.searchUsers(query);
            this.renderUsersTable();
        } catch (error) {
            if (!CONFIG.DEVELOPMENT.SUPPRESS_API_WARNINGS) {
                console.error('Error filtrando usuarios:', error);
            }
        }
    }

    clearSearch() {
        this.container.querySelector('#userSearch').value = '';
        this.filteredUsers = [...this.users];
        this.renderUsersTable();
    }

    showUserModal(user = null) {
        const modal = new bootstrap.Modal(this.container.querySelector('#userModal'));
        const title = this.container.querySelector('#userModalTitle');
        const saveText = this.container.querySelector('#saveUserText');
        const editFields = this.container.querySelector('#editUserFields');

        this.selectedUser = user;

        if (user) {
            title.innerHTML = '<i class="bi bi-pencil me-2"></i> Editar Usuario';
            saveText.textContent = 'Guardar Cambios';
            editFields.style.display = 'block';
            this.populateUserForm(user);
        } else {
            title.innerHTML = '<i class="bi bi-person-plus me-2"></i> Nuevo Usuario';
            saveText.textContent = 'Crear Usuario';
            editFields.style.display = 'none';
            this.resetUserForm();
        }

        modal.show();
    }

    populateUserForm(user) {
        this.container.querySelector('#userName').value = user.name;
        this.container.querySelector('#userEmail').value = user.email;
        this.container.querySelector('#userPassword').value = '';
        this.container.querySelector('#userRole').value = user.role;
        this.container.querySelector('#userActive').checked = user.active;
    }

    resetUserForm() {
        const form = this.container.querySelector('#userForm');
        form.reset();
        form.querySelectorAll('.form-control').forEach(input => {
            input.classList.remove('is-invalid', 'is-valid');
        });
    }

    validateUserForm() {
        const name = this.container.querySelector('#userName').value.trim();
        const email = this.container.querySelector('#userEmail').value.trim();
        const password = this.container.querySelector('#userPassword').value;
        const role = this.container.querySelector('#userRole').value;

        let isValid = true;

        // Validate name
        if (!name) {
            this.setFieldError('#userName', 'El nombre es requerido');
            isValid = false;
        } else {
            this.clearFieldError('#userName');
        }

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            this.setFieldError('#userEmail', 'El email es requerido');
            isValid = false;
        } else if (!emailRegex.test(email)) {
            this.setFieldError('#userEmail', 'Email inválido');
            isValid = false;
        } else {
            this.clearFieldError('#userEmail');
        }

        // Validate password (only for new users or if changing)
        if (!this.selectedUser || password) {
            if (!password) {
                this.setFieldError('#userPassword', 'La contraseña es requerida');
                isValid = false;
            } else if (password.length < 6) {
                this.setFieldError('#userPassword', 'Mínimo 6 caracteres');
                isValid = false;
            } else {
                this.clearFieldError('#userPassword');
            }
        }

        // Validate role
        if (!role) {
            this.setFieldError('#userRole', 'Selecciona un rol');
            isValid = false;
        } else {
            this.clearFieldError('#userRole');
        }

        return isValid;
    }

    setFieldError(selector, message) {
        const input = this.container.querySelector(selector);
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
        const feedback = input.parentNode.querySelector('.invalid-feedback');
        if (feedback) {
            feedback.textContent = message;
        }
    }

    clearFieldError(selector) {
        const input = this.container.querySelector(selector);
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
    }

    async saveUser() {
        if (!this.validateUserForm()) {
            return;
        }

        const saveBtn = this.container.querySelector('#saveUserBtn');
        const originalText = saveBtn.innerHTML;
        
        try {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';

            const userData = {
                name: this.container.querySelector('#userName').value.trim(),
                email: this.container.querySelector('#userEmail').value.trim(),
                role: this.container.querySelector('#userRole').value
            };

            const password = this.container.querySelector('#userPassword').value;
            if (password) {
                userData.password = password;
            }

            if (this.selectedUser) {
                // Update user
                userData.active = this.container.querySelector('#userActive').checked;
                userService.updateUser(this.selectedUser.id, userData);
                utilsService.showStatus('Usuario actualizado correctamente', 'success');
            } else {
                // Create user
                userService.createUser(userData);
                utilsService.showStatus('Usuario creado correctamente', 'success');
            }

            this.loadUsers();
            bootstrap.Modal.getInstance(this.container.querySelector('#userModal')).hide();

        } catch (error) {
            if (!CONFIG.DEVELOPMENT.SUPPRESS_API_WARNINGS) {
                console.error('Error guardando usuario:', error);
            }
            utilsService.showStatus(error.message, 'danger');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalText;
        }
    }

    editUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (user) {
            this.showUserModal(user);
        }
    }

    async toggleUserActive(userId) {
        try {
            userService.toggleUserActive(userId);
            const user = this.users.find(u => u.id === userId);
            const status = user.active ? 'activado' : 'desactivado';
            utilsService.showStatus(`Usuario ${status} correctamente`, 'success');
            this.loadUsers();
        } catch (error) {
            if (!CONFIG.DEVELOPMENT.SUPPRESS_API_WARNINGS) {
                console.error('Error cambiando estado:', error);
            }
            utilsService.showStatus(error.message, 'danger');
        }
    }

    async deleteUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        if (!confirm(`¿Estás seguro de eliminar al usuario "${user.name}"?\n\nEsta acción no se puede deshacer.`)) {
            return;
        }

        try {
            userService.deleteUser(userId);
            utilsService.showStatus('Usuario eliminado correctamente', 'success');
            this.loadUsers();
        } catch (error) {
            if (!CONFIG.DEVELOPMENT.SUPPRESS_API_WARNINGS) {
                console.error('Error eliminando usuario:', error);
            }
            utilsService.showStatus(error.message, 'danger');
        }
    }

    showChangePasswordModal() {
        const modal = new bootstrap.Modal(this.container.querySelector('#changePasswordModal'));
        modal.show();
    }

    async changePassword() {
        const currentPassword = this.container.querySelector('#currentPassword').value;
        const newPassword = this.container.querySelector('#newPassword').value;
        const confirmPassword = this.container.querySelector('#confirmPassword').value;

        if (!currentPassword || !newPassword || !confirmPassword) {
            utilsService.showStatus('Todos los campos son requeridos', 'danger');
            return;
        }

        if (newPassword !== confirmPassword) {
            utilsService.showStatus('Las contraseñas no coinciden', 'danger');
            return;
        }

        try {
            userService.changePassword(currentPassword, newPassword);
            utilsService.showStatus('Contraseña cambiada correctamente', 'success');
            bootstrap.Modal.getInstance(this.container.querySelector('#changePasswordModal')).hide();
        } catch (error) {
            if (!CONFIG.DEVELOPMENT.SUPPRESS_API_WARNINGS) {
                console.error('Error cambiando contraseña:', error);
            }
            utilsService.showStatus(error.message, 'danger');
        }
    }
}

export default UserManagementComponent;