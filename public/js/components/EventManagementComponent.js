// Event Management Component
import eventService from '../services/eventService.js';
import authService from '../services/authService.js';
import utilsService from '../services/utilsService.js';
import CONFIG from '../config.js';

class EventManagementComponent {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentEvent = null;
        this.events = [];
        this.init();
    }

    init() {
        this.render();
        this.bindEvents();
        
        // Listen for auth events to load events when authenticated
        document.addEventListener('auth:success', () => {
            this.loadEvents();
        });
        
        // Try to load events if already authenticated
        if (authService.getCurrentUser()) {
            this.loadEvents();
        }
    }

    render() {
        this.container.innerHTML = `
            <div class="card mb-4">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h3 class="card-title mb-0">
                            <i class="bi bi-calendar-event me-2"></i>Gestión de Eventos
                        </h3>
                        <button class="btn btn-primary" id="createEventBtn">
                            <i class="bi bi-plus-lg me-1"></i>Nuevo Evento
                        </button>
                    </div>

                    <!-- Active Event Display -->
                    <div id="activeEventSection" class="mb-4 d-none">
                        <div class="alert alert-info border-0">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 class="alert-heading mb-1">
                                        <i class="bi bi-star-fill me-2"></i>Evento Activo
                                    </h5>
                                    <p class="mb-1" id="activeEventName">-</p>
                                    <small class="text-muted" id="activeEventDate">-</small>
                                </div>
                                <div class="text-end">
                                    <button class="btn btn-sm btn-outline-primary me-2" id="viewActiveEventBtn">
                                        <i class="bi bi-eye"></i> Ver
                                    </button>
                                    <button class="btn btn-sm btn-outline-secondary" id="deactivateEventBtn">
                                        <i class="bi bi-stop-circle"></i> Desactivar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Search and Filter -->
                    <div class="row mb-4">
                        <div class="col-md-6">
                            <div class="input-group">
                                <span class="input-group-text">
                                    <i class="bi bi-search"></i>
                                </span>
                                <input type="text" class="form-control" id="searchEvents" placeholder="Buscar eventos...">
                            </div>
                        </div>
                        <div class="col-md-3">
                            <select class="form-select" id="filterByStatus">
                                <option value="">Todos los estados</option>
                                <option value="draft">Borrador</option>
                                <option value="active">Activo</option>
                                <option value="completed">Completado</option>
                                <option value="cancelled">Cancelado</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <button class="btn btn-outline-secondary w-100" id="refreshEventsBtn">
                                <i class="bi bi-arrow-clockwise me-1"></i>Actualizar
                            </button>
                        </div>
                    </div>

                    <!-- Events List -->
                    <div id="eventsList">
                        <div class="text-center py-4">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Cargando...</span>
                            </div>
                        </div>
                    </div>

                    <!-- Status Messages -->
                    <div id="eventManagementStatus"></div>
                </div>
            </div>

            <!-- Create/Edit Event Modal -->
            <div class="modal fade" id="eventModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="eventModalTitle">Nuevo Evento</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="eventForm">
                                <!-- Basic Info -->
                                <div class="row mb-3">
                                    <div class="col-md-8">
                                        <label class="form-label fw-semibold">Nombre del Evento*</label>
                                        <input type="text" class="form-control" id="eventName" required>
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label fw-semibold">Fecha*</label>
                                        <input type="date" class="form-control" id="eventDate" required>
                                    </div>
                                </div>

                                <div class="row mb-3">
                                    <div class="col-md-4">
                                        <label class="form-label fw-semibold">Hora</label>
                                        <input type="time" class="form-control" id="eventTime">
                                    </div>
                                    <div class="col-md-8">
                                        <label class="form-label fw-semibold">Ubicación</label>
                                        <input type="text" class="form-control" id="eventLocation" placeholder="Ej: Salón Principal, Auditorio...">
                                    </div>
                                </div>

                                <div class="mb-4">
                                    <label class="form-label fw-semibold">Descripción</label>
                                    <textarea class="form-control" id="eventDescription" rows="3" placeholder="Descripción del evento..."></textarea>
                                </div>

                                <!-- Categories Section -->
                                <div class="mb-4">
                                    <div class="d-flex justify-content-between align-items-center mb-3">
                                        <h6 class="mb-0">
                                            <i class="bi bi-tags me-2"></i>Categorías de Entrada*
                                        </h6>
                                        <button type="button" class="btn btn-sm btn-outline-primary" id="addCategoryBtn">
                                            <i class="bi bi-plus me-1"></i>Agregar Categoría
                                        </button>
                                    </div>
                                    <div id="categoriesContainer">
                                        <!-- Categories will be added here -->
                                    </div>
                                    <small class="text-muted">Debe agregar al menos una categoría de entrada</small>
                                </div>

                                <!-- Form validation errors -->
                                <div id="eventFormErrors" class="alert alert-danger d-none"></div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="saveEventBtn">
                                <i class="bi bi-save me-1"></i>Guardar Evento
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- QR Code Modal -->
            <div class="modal fade" id="qrModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="bi bi-qr-code me-2"></i>Código QR del Evento
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body text-center">
                            <div id="qrCodeDisplay">
                                <!-- QR code will be displayed here -->
                            </div>
                            <div class="mt-3">
                                <p class="mb-2"><strong id="qrEventName">Nombre del Evento</strong></p>
                                <p class="text-muted mb-3" id="qrEventDate">Fecha del evento</p>
                                <div class="d-grid gap-2">
                                    <button class="btn btn-primary" id="downloadQRBtn">
                                        <i class="bi bi-download me-1"></i>Descargar QR
                                    </button>
                                    <button class="btn btn-outline-secondary" id="copyQRLinkBtn">
                                        <i class="bi bi-link me-1"></i>Copiar Enlace
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        // Create event button
        this.container.querySelector('#createEventBtn').addEventListener('click', () => {
            this.showEventModal();
        });

        // Refresh events
        this.container.querySelector('#refreshEventsBtn').addEventListener('click', () => {
            this.loadEvents();
        });

        // Search events
        this.container.querySelector('#searchEvents').addEventListener('input', (e) => {
            this.filterEvents(e.target.value);
        });

        // Filter by status
        this.container.querySelector('#filterByStatus').addEventListener('change', (e) => {
            this.filterEventsByStatus(e.target.value);
        });

        // Active event actions
        this.container.querySelector('#deactivateEventBtn').addEventListener('click', () => {
            this.deactivateEvent();
        });

        this.container.querySelector('#viewActiveEventBtn').addEventListener('click', () => {
            const activeEvent = eventService.getActiveEvent();
            if (activeEvent) {
                this.showEventModal(activeEvent);
            }
        });

        // Add category button
        this.container.querySelector('#addCategoryBtn').addEventListener('click', () => {
            this.addCategoryField();
        });

        // Save event
        this.container.querySelector('#saveEventBtn').addEventListener('click', () => {
            this.saveEvent();
        });

        // QR Modal actions
        this.container.querySelector('#downloadQRBtn').addEventListener('click', () => {
            this.downloadQRCode();
        });

        this.container.querySelector('#copyQRLinkBtn').addEventListener('click', () => {
            this.copyQRLink();
        });
    }

    async loadEvents() {
        try {
            this.events = eventService.getAllEvents();
            this.displayEvents(this.events);
            this.updateActiveEventDisplay();
        } catch (error) {
            console.error('Error cargando eventos:', error);
            utilsService.showStatus('Error cargando eventos', 'danger', 'eventManagementStatus');
        }
    }

    displayEvents(events) {
        const container = this.container.querySelector('#eventsList');
        
        if (events.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-calendar-x display-1 text-muted"></i>
                    <h5 class="text-muted mt-3">No hay eventos creados</h5>
                    <p class="text-muted">Crea tu primer evento para comenzar</p>
                </div>
            `;
            return;
        }

        const eventsHTML = events.map(event => this.createEventCard(event)).join('');
        container.innerHTML = eventsHTML;
    }

    createEventCard(event) {
        const statusBadge = this.getStatusBadge(event.status);
        const categoryCount = event.categories.length;
        const totalRevenue = event.totalRevenue || 0;
        const totalPhotos = event.totalPhotos || 0;

        return `
            <div class="card mb-3 shadow-sm">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-8">
                            <div class="d-flex align-items-center mb-2">
                                <h5 class="card-title mb-0 me-3">${event.name}</h5>
                                ${statusBadge}
                            </div>
                            <div class="row text-muted small">
                                <div class="col-sm-6">
                                    <i class="bi bi-calendar me-1"></i>${event.date}
                                    ${event.time ? ` - ${event.time}` : ''}
                                </div>
                                <div class="col-sm-6">
                                    <i class="bi bi-geo-alt me-1"></i>${event.location || 'Sin ubicación'}
                                </div>
                            </div>
                            <div class="row text-muted small mt-1">
                                <div class="col-sm-6">
                                    <i class="bi bi-tags me-1"></i>${categoryCount} categorías
                                </div>
                                <div class="col-sm-6">
                                    <i class="bi bi-images me-1"></i>${totalPhotos} fotos | 
                                    <i class="bi bi-currency-dollar me-1"></i>${utilsService.formatCurrency(totalRevenue)}
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4 text-end">
                            <div class="btn-group" role="group">
                                <button class="btn btn-sm btn-outline-primary" onclick="window.eventMgmt.editEvent(${event.id})">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-success" onclick="window.eventMgmt.generateQR(${event.id})">
                                    <i class="bi bi-qr-code"></i>
                                </button>
                                ${event.status === 'draft' ? `
                                    <button class="btn btn-sm btn-outline-warning" onclick="window.eventMgmt.activateEvent(${event.id})">
                                        <i class="bi bi-play-circle"></i>
                                    </button>
                                ` : ''}
                                ${event.status !== 'active' ? `
                                    <button class="btn btn-sm btn-outline-danger" onclick="window.eventMgmt.deleteEvent(${event.id})">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getStatusBadge(status) {
        const badges = {
            'draft': '<span class="badge bg-secondary">Borrador</span>',
            'active': '<span class="badge bg-success">Activo</span>',
            'completed': '<span class="badge bg-primary">Completado</span>',
            'cancelled': '<span class="badge bg-danger">Cancelado</span>'
        };
        return badges[status] || '<span class="badge bg-secondary">Desconocido</span>';
    }

    updateActiveEventDisplay() {
        const activeEvent = eventService.getActiveEvent();
        const section = this.container.querySelector('#activeEventSection');
        
        if (activeEvent) {
            section.classList.remove('d-none');
            this.container.querySelector('#activeEventName').textContent = activeEvent.name;
            this.container.querySelector('#activeEventDate').textContent = `${activeEvent.date} ${activeEvent.time || ''}`;
        } else {
            section.classList.add('d-none');
        }
    }

    showEventModal(event = null) {
        const modal = new bootstrap.Modal(this.container.querySelector('#eventModal'));
        const title = this.container.querySelector('#eventModalTitle');
        
        if (event) {
            title.textContent = 'Editar Evento';
            this.populateEventForm(event);
            this.currentEvent = event;
        } else {
            title.textContent = 'Nuevo Evento';
            this.resetEventForm();
            this.currentEvent = null;
        }
        
        modal.show();
    }

    populateEventForm(event) {
        this.container.querySelector('#eventName').value = event.name;
        this.container.querySelector('#eventDate').value = event.date;
        this.container.querySelector('#eventTime').value = event.time || '';
        this.container.querySelector('#eventLocation').value = event.location || '';
        this.container.querySelector('#eventDescription').value = event.description || '';
        
        // Populate categories
        this.populateCategories(event.categories);
    }

    resetEventForm() {
        this.container.querySelector('#eventForm').reset();
        this.container.querySelector('#categoriesContainer').innerHTML = '';
        this.container.querySelector('#eventFormErrors').classList.add('d-none');
        
        // Add default category
        this.addCategoryField();
    }

    populateCategories(categories) {
        const container = this.container.querySelector('#categoriesContainer');
        container.innerHTML = '';
        
        categories.forEach(category => {
            this.addCategoryField(category);
        });
        
        if (categories.length === 0) {
            this.addCategoryField();
        }
    }

    addCategoryField(category = null) {
        const container = this.container.querySelector('#categoriesContainer');
        const categoryId = Date.now() + Math.random();
        
        const categoryHTML = `
            <div class="card mb-3 category-item" data-category-id="${categoryId}">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <h6 class="card-title mb-0">
                            <i class="bi bi-tag me-2"></i>Categoría ${container.children.length + 1}
                        </h6>
                        <button type="button" class="btn btn-sm btn-outline-danger" onclick="this.closest('.category-item').remove()">
                            <i class="bi bi-x"></i>
                        </button>
                    </div>
                    <div class="row">
                        <div class="col-md-4">
                            <label class="form-label">Nombre*</label>
                            <input type="text" class="form-control category-name" value="${category?.name || ''}" placeholder="Ej: General, VIP..." required>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Tipo*</label>
                            <select class="form-select category-type" required>
                                <option value="">Seleccionar...</option>
                                <option value="general" ${category?.type === 'general' ? 'selected' : ''}>General</option>
                                <option value="vip" ${category?.type === 'vip' ? 'selected' : ''}>VIP</option>
                                <option value="premium" ${category?.type === 'premium' ? 'selected' : ''}>Premium</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Precio*</label>
                            <div class="input-group">
                                <span class="input-group-text">$</span>
                                <input type="number" class="form-control category-price" value="${category?.price || ''}" step="0.01" min="0" required>
                            </div>
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">Capacidad</label>
                            <input type="number" class="form-control category-capacity" value="${category?.maxCapacity || ''}" min="1" placeholder="Ilimitado">
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', categoryHTML);
    }

    async saveEvent() {
        return authService.requireAuth(async () => {
            if (!authService.isAdmin()) {
                utilsService.showStatus('Solo administradores pueden gestionar eventos', 'danger', 'eventManagementStatus');
                return;
            }

            const eventData = this.collectEventData();
            const errors = eventService.validateEventData(eventData);
            
            if (errors.length > 0) {
                this.showFormErrors(errors);
                return;
            }

            try {
                let result;
                if (this.currentEvent) {
                    result = eventService.updateEvent(this.currentEvent.id, eventData);
                } else {
                    result = eventService.createEvent(eventData);
                }

                // Close modal
                const modal = bootstrap.Modal.getInstance(this.container.querySelector('#eventModal'));
                modal.hide();

                // Refresh events list
                this.loadEvents();

                utilsService.showStatus(
                    this.currentEvent ? 'Evento actualizado correctamente' : 'Evento creado correctamente',
                    'success',
                    'eventManagementStatus'
                );

            } catch (error) {
                console.error('Error guardando evento:', error);
                this.showFormErrors([error.message]);
            }
        });
    }

    collectEventData() {
        const categories = [];
        const categoryItems = this.container.querySelectorAll('.category-item');
        
        categoryItems.forEach(item => {
            const name = item.querySelector('.category-name').value.trim();
            const type = item.querySelector('.category-type').value;
            const price = item.querySelector('.category-price').value;
            const capacity = item.querySelector('.category-capacity').value;
            
            if (name && type && price !== '') {
                categories.push({
                    name,
                    type,
                    price: parseFloat(price),
                    maxCapacity: capacity ? parseInt(capacity) : null
                });
            }
        });

        return {
            name: this.container.querySelector('#eventName').value.trim(),
            date: this.container.querySelector('#eventDate').value,
            time: this.container.querySelector('#eventTime').value,
            location: this.container.querySelector('#eventLocation').value.trim(),
            description: this.container.querySelector('#eventDescription').value.trim(),
            categories
        };
    }

    showFormErrors(errors) {
        const errorDiv = this.container.querySelector('#eventFormErrors');
        errorDiv.innerHTML = `
            <h6>Corrige los siguientes errores:</h6>
            <ul class="mb-0">
                ${errors.map(error => `<li>${error}</li>`).join('')}
            </ul>
        `;
        errorDiv.classList.remove('d-none');
    }

    async activateEvent(eventId) {
        return authService.requireAuth(async () => {
            if (!authService.isAdmin()) {
                utilsService.showStatus('Solo administradores pueden activar eventos', 'danger', 'eventManagementStatus');
                return;
            }

            if (confirm('¿Activar este evento? Esto desactivará el evento actual si existe.')) {
                try {
                    eventService.activateEvent(eventId);
                    this.loadEvents();
                    utilsService.showStatus('Evento activado correctamente', 'success', 'eventManagementStatus');
                } catch (error) {
                    utilsService.showStatus(error.message, 'danger', 'eventManagementStatus');
                }
            }
        });
    }

    async deactivateEvent() {
        return authService.requireAuth(async () => {
            if (!authService.isAdmin()) {
                utilsService.showStatus('Solo administradores pueden desactivar eventos', 'danger', 'eventManagementStatus');
                return;
            }

            if (confirm('¿Desactivar el evento actual?')) {
                try {
                    eventService.deactivateEvent();
                    this.loadEvents();
                    utilsService.showStatus('Evento desactivado correctamente', 'success', 'eventManagementStatus');
                } catch (error) {
                    utilsService.showStatus(error.message, 'danger', 'eventManagementStatus');
                }
            }
        });
    }

    editEvent(eventId) {
        const event = eventService.getEventById(eventId);
        if (event) {
            this.showEventModal(event);
        }
    }

    async deleteEvent(eventId) {
        return authService.requireAuth(async () => {
            if (!authService.isAdmin()) {
                utilsService.showStatus('Solo administradores pueden eliminar eventos', 'danger', 'eventManagementStatus');
                return;
            }

            const event = eventService.getEventById(eventId);
            if (!event) return;

            if (confirm(`¿Eliminar el evento "${event.name}"? Esta acción no se puede deshacer.`)) {
                try {
                    eventService.deleteEvent(eventId);
                    this.loadEvents();
                    utilsService.showStatus('Evento eliminado correctamente', 'success', 'eventManagementStatus');
                } catch (error) {
                    utilsService.showStatus(error.message, 'danger', 'eventManagementStatus');
                }
            }
        });
    }

    generateQR(eventId) {
        const event = eventService.getEventById(eventId);
        if (!event) return;

        try {
            const qrData = eventService.generateQRCode(eventId);
            this.showQRModal(event, qrData);
        } catch (error) {
            utilsService.showStatus(error.message, 'danger', 'eventManagementStatus');
        }
    }

    showQRModal(event, qrData) {
        const modal = new bootstrap.Modal(this.container.querySelector('#qrModal'));
        
        // Update modal content
        this.container.querySelector('#qrEventName').textContent = event.name;
        this.container.querySelector('#qrEventDate').textContent = `${event.date} ${event.time || ''}`;
        
        // Generate QR code display using QR Server API
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData.url)}`;
        
        const qrDisplay = this.container.querySelector('#qrCodeDisplay');
        qrDisplay.innerHTML = `
            <div class="bg-light p-4 rounded mb-3">
                <div class="d-flex justify-content-center align-items-center" style="height: 220px;">
                    <img src="${qrCodeUrl}" alt="Código QR del evento" class="img-fluid" style="max-width: 200px; max-height: 200px;">
                </div>
            </div>
            <div class="small text-muted text-start">
                <strong>Información del QR:</strong><br>
                <strong>URL:</strong> <a href="${qrData.url}" target="_blank" class="text-decoration-none">${qrData.url}</a><br>
                <strong>Categorías:</strong> ${qrData.categories.map(c => `${c.name} ($${c.price})`).join(', ')}<br>
                <strong>Generado:</strong> ${new Date(qrData.generatedAt).toLocaleString()}
            </div>
        `;
        
        // Store QR data for download/copy actions
        this.currentQRData = qrData;
        
        modal.show();
    }

    async downloadQRCode() {
        if (!this.currentQRData) return;
        
        try {
            // Generate QR code image URL
            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(this.currentQRData.url)}`;
            
            // Fetch the QR code image
            const response = await fetch(qrCodeUrl);
            const blob = await response.blob();
            
            // Create download link
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `QR_${this.currentQRData.eventName.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            utilsService.showStatus('Código QR descargado', 'success', 'eventManagementStatus');
        } catch (error) {
            console.error('Error descargando QR:', error);
            // Fallback to text download
            this.downloadQRInfo();
        }
    }

    downloadQRInfo() {
        if (!this.currentQRData) return;
        
        // Create a simple text file with QR information
        const qrInfo = `
Código QR - ${this.currentQRData.eventName}
======================================
Evento: ${this.currentQRData.eventName}
Fecha: ${this.currentQRData.eventDate}
URL: ${this.currentQRData.url}

Categorías:
${this.currentQRData.categories.map(c => `- ${c.name} (${c.type}): $${c.price}`).join('\n')}

Generado: ${new Date(this.currentQRData.generatedAt).toLocaleString()}
        `.trim();
        
        const blob = new Blob([qrInfo], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `QR_${this.currentQRData.eventName.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        utilsService.showStatus('Información del QR descargada', 'success', 'eventManagementStatus');
    }

    copyQRLink() {
        if (!this.currentQRData) return;
        
        navigator.clipboard.writeText(this.currentQRData.url).then(() => {
            utilsService.showStatus('Enlace copiado al portapapeles', 'success', 'eventManagementStatus');
        }).catch(() => {
            utilsService.showStatus('Error copiando enlace', 'danger', 'eventManagementStatus');
        });
    }

    filterEvents(query) {
        const filteredEvents = eventService.searchEvents(query);
        this.displayEvents(filteredEvents);
    }

    filterEventsByStatus(status) {
        const filteredEvents = status ? eventService.getEventsByStatus(status) : eventService.getAllEvents();
        this.displayEvents(filteredEvents);
    }
}

// Make it available globally for event handlers
window.eventMgmt = null;

export default EventManagementComponent;