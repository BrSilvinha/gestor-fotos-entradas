// User Management Service
import CONFIG from '../config.js';

class UserService {
    constructor() {
        this.users = this.loadUsers();
        this.currentUser = null;
        this.initializeDefaultAdmin();
    }

    // Initialize default admin user
    initializeDefaultAdmin() {
        const defaultAdmin = CONFIG.AUTH.DEFAULT_ADMIN;
        const existingAdmin = this.users.find(u => u.email === defaultAdmin.email);
        
        if (!existingAdmin) {
            this.users.push({
                id: 1,
                email: defaultAdmin.email,
                password: defaultAdmin.password,
                name: defaultAdmin.name,
                role: defaultAdmin.role,
                active: true,
                createdAt: new Date().toISOString()
            });
            this.saveUsers();
            console.log('✅ Usuario admin por defecto creado');
        }
    }

    // Load users from localStorage
    loadUsers() {
        try {
            const stored = localStorage.getItem('photoManager_users');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error cargando usuarios:', error);
            return [];
        }
    }

    // Save users to localStorage
    saveUsers() {
        try {
            localStorage.setItem('photoManager_users', JSON.stringify(this.users));
        } catch (error) {
            console.error('Error guardando usuarios:', error);
        }
    }

    // Authenticate user
    authenticate(email, password) {
        const user = this.users.find(u => 
            u.email === email && 
            u.password === password && 
            u.active
        );

        if (user) {
            this.currentUser = { ...user };
            delete this.currentUser.password; // Don't store password in session
            sessionStorage.setItem(CONFIG.AUTH.SESSION_KEY, JSON.stringify(this.currentUser));
            console.log('✅ Usuario autenticado:', user.email);
            return this.currentUser;
        }

        console.log('❌ Credenciales inválidas');
        return null;
    }

    // Check if user is authenticated
    checkAuth() {
        try {
            const stored = sessionStorage.getItem(CONFIG.AUTH.SESSION_KEY);
            if (stored) {
                this.currentUser = JSON.parse(stored);
                return this.currentUser;
            }
        } catch (error) {
            console.error('Error verificando autenticación:', error);
        }
        return null;
    }

    // Logout user
    logout() {
        this.currentUser = null;
        sessionStorage.removeItem(CONFIG.AUTH.SESSION_KEY);
        console.log('🚪 Sesión cerrada');
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if current user is admin
    isAdmin() {
        return this.currentUser && this.currentUser.role === CONFIG.ROLES.ADMIN;
    }

    // Check if current user is worker
    isWorker() {
        return this.currentUser && this.currentUser.role === CONFIG.ROLES.WORKER;
    }

    // Get all users (admin only)
    getAllUsers() {
        if (!this.isAdmin()) {
            throw new Error('Acceso denegado: Solo administradores');
        }
        return this.users.map(user => ({
            ...user,
            password: undefined // Don't expose passwords
        }));
    }

    // Create new user (admin only)
    createUser(userData) {
        if (!this.isAdmin()) {
            throw new Error('Acceso denegado: Solo administradores');
        }

        // Validate required fields
        if (!userData.email || !userData.password || !userData.name || !userData.role) {
            throw new Error('Todos los campos son requeridos');
        }

        // Check if email already exists
        const existingUser = this.users.find(u => u.email === userData.email);
        if (existingUser) {
            throw new Error('El email ya está en uso');
        }

        // Validate role
        if (!Object.values(CONFIG.ROLES).includes(userData.role)) {
            throw new Error('Rol inválido');
        }

        // Create new user
        const newUser = {
            id: Math.max(...this.users.map(u => u.id), 0) + 1,
            email: userData.email.toLowerCase().trim(),
            password: userData.password,
            name: userData.name.trim(),
            role: userData.role,
            active: true,
            createdAt: new Date().toISOString(),
            createdBy: this.currentUser.id
        };

        this.users.push(newUser);
        this.saveUsers();

        console.log('✅ Usuario creado:', newUser.email);
        return { ...newUser, password: undefined };
    }

    // Update user (admin only, or user updating their own profile)
    updateUser(userId, userData) {
        const userIndex = this.users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            throw new Error('Usuario no encontrado');
        }

        const targetUser = this.users[userIndex];

        // Check permissions
        if (!this.isAdmin() && this.currentUser.id !== userId) {
            throw new Error('Acceso denegado: Solo puedes editar tu propio perfil');
        }

        // If not admin, restrict what can be updated
        if (!this.isAdmin()) {
            const allowedFields = ['name', 'password'];
            const updateData = {};
            allowedFields.forEach(field => {
                if (userData[field] !== undefined) {
                    updateData[field] = userData[field];
                }
            });
            userData = updateData;
        }

        // Validate email change
        if (userData.email && userData.email !== targetUser.email) {
            const existingUser = this.users.find(u => u.email === userData.email && u.id !== userId);
            if (existingUser) {
                throw new Error('El email ya está en uso');
            }
            userData.email = userData.email.toLowerCase().trim();
        }

        // Validate role change
        if (userData.role && !Object.values(CONFIG.ROLES).includes(userData.role)) {
            throw new Error('Rol inválido');
        }

        // Update user
        Object.assign(this.users[userIndex], userData, {
            updatedAt: new Date().toISOString(),
            updatedBy: this.currentUser.id
        });

        this.saveUsers();

        console.log('✅ Usuario actualizado:', this.users[userIndex].email);
        return { ...this.users[userIndex], password: undefined };
    }

    // Delete user (admin only, cannot delete self)
    deleteUser(userId) {
        if (!this.isAdmin()) {
            throw new Error('Acceso denegado: Solo administradores');
        }

        if (this.currentUser.id === userId) {
            throw new Error('No puedes eliminar tu propia cuenta');
        }

        const userIndex = this.users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            throw new Error('Usuario no encontrado');
        }

        const deletedUser = this.users.splice(userIndex, 1)[0];
        this.saveUsers();

        console.log('✅ Usuario eliminado:', deletedUser.email);
        return { ...deletedUser, password: undefined };
    }

    // Activate/Deactivate user (admin only)
    toggleUserActive(userId) {
        if (!this.isAdmin()) {
            throw new Error('Acceso denegado: Solo administradores');
        }

        if (this.currentUser.id === userId) {
            throw new Error('No puedes desactivar tu propia cuenta');
        }

        const userIndex = this.users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            throw new Error('Usuario no encontrado');
        }

        this.users[userIndex].active = !this.users[userIndex].active;
        this.users[userIndex].updatedAt = new Date().toISOString();
        this.users[userIndex].updatedBy = this.currentUser.id;

        this.saveUsers();

        const status = this.users[userIndex].active ? 'activado' : 'desactivado';
        console.log(`✅ Usuario ${status}:`, this.users[userIndex].email);
        return { ...this.users[userIndex], password: undefined };
    }

    // Search users (admin only)
    searchUsers(query) {
        if (!this.isAdmin()) {
            throw new Error('Acceso denegado: Solo administradores');
        }

        if (!query || query.trim().length === 0) {
            return this.getAllUsers();
        }

        const searchTerm = query.toLowerCase().trim();
        return this.users
            .filter(user => 
                user.email.toLowerCase().includes(searchTerm) ||
                user.name.toLowerCase().includes(searchTerm) ||
                user.role.toLowerCase().includes(searchTerm)
            )
            .map(user => ({
                ...user,
                password: undefined
            }));
    }

    // Change password
    changePassword(currentPassword, newPassword) {
        const userIndex = this.users.findIndex(u => u.id === this.currentUser.id);
        if (userIndex === -1) {
            throw new Error('Usuario no encontrado');
        }

        const user = this.users[userIndex];
        if (user.password !== currentPassword) {
            throw new Error('Contraseña actual incorrecta');
        }

        if (newPassword.length < 6) {
            throw new Error('La nueva contraseña debe tener al menos 6 caracteres');
        }

        this.users[userIndex].password = newPassword;
        this.users[userIndex].updatedAt = new Date().toISOString();
        this.saveUsers();

        console.log('✅ Contraseña cambiada para:', user.email);
        return true;
    }
}

export default new UserService();