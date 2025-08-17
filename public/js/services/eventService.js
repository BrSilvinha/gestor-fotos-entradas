// Event Management Service
import CONFIG from '../config.js';

class EventService {
    constructor() {
        this.events = this.loadEvents();
        this.activeEvent = this.loadActiveEvent();
    }

    // Load events from localStorage
    loadEvents() {
        try {
            const stored = localStorage.getItem('photoManager_events');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error cargando eventos:', error);
            return [];
        }
    }

    // Save events to localStorage
    saveEvents() {
        try {
            localStorage.setItem('photoManager_events', JSON.stringify(this.events));
        } catch (error) {
            console.error('Error guardando eventos:', error);
        }
    }

    // Load active event
    loadActiveEvent() {
        try {
            const stored = localStorage.getItem('photoManager_activeEvent');
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('Error cargando evento activo:', error);
            return null;
        }
    }

    // Save active event
    saveActiveEvent() {
        try {
            localStorage.setItem('photoManager_activeEvent', JSON.stringify(this.activeEvent));
        } catch (error) {
            console.error('Error guardando evento activo:', error);
        }
    }

    // Get all events
    getAllEvents() {
        return [...this.events];
    }

    // Get event by ID
    getEventById(eventId) {
        return this.events.find(event => event.id === eventId);
    }

    // Get active event
    getActiveEvent() {
        return this.activeEvent;
    }

    // Create new event
    createEvent(eventData) {
        // Validate required fields
        if (!eventData.name || !eventData.date || !eventData.categories) {
            throw new Error('Nombre, fecha y categorías son requeridos');
        }

        // Validate categories
        if (!Array.isArray(eventData.categories) || eventData.categories.length === 0) {
            throw new Error('Debe agregar al menos una categoría');
        }

        // Create new event
        const newEvent = {
            id: Date.now(),
            name: eventData.name.trim(),
            description: eventData.description?.trim() || '',
            date: eventData.date,
            time: eventData.time || '',
            location: eventData.location?.trim() || '',
            status: CONFIG.EVENTS.STATUS.DRAFT,
            categories: eventData.categories.map(cat => ({
                id: Date.now() + Math.random(),
                name: cat.name.trim(),
                type: cat.type,
                price: parseFloat(cat.price) || 0,
                maxCapacity: parseInt(cat.maxCapacity) || null,
                currentCount: 0,
                active: true
            })),
            qrCode: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            totalPhotos: 0,
            totalRevenue: 0
        };

        this.events.push(newEvent);
        this.saveEvents();

        console.log('✅ Evento creado:', newEvent.name);
        return newEvent;
    }

    // Update event
    updateEvent(eventId, eventData) {
        const eventIndex = this.events.findIndex(event => event.id === eventId);
        if (eventIndex === -1) {
            throw new Error('Evento no encontrado');
        }

        // Validate if event can be updated
        const event = this.events[eventIndex];
        if (event.status === CONFIG.EVENTS.STATUS.COMPLETED) {
            throw new Error('No se puede editar un evento completado');
        }

        // Update event
        Object.assign(this.events[eventIndex], eventData, {
            updatedAt: new Date().toISOString()
        });

        // If this is the active event, update it too
        if (this.activeEvent && this.activeEvent.id === eventId) {
            this.activeEvent = { ...this.events[eventIndex] };
            this.saveActiveEvent();
        }

        this.saveEvents();

        console.log('✅ Evento actualizado:', this.events[eventIndex].name);
        return this.events[eventIndex];
    }

    // Delete event
    deleteEvent(eventId) {
        const eventIndex = this.events.findIndex(event => event.id === eventId);
        if (eventIndex === -1) {
            throw new Error('Evento no encontrado');
        }

        const event = this.events[eventIndex];
        
        // Check if event can be deleted
        if (event.status === CONFIG.EVENTS.STATUS.ACTIVE) {
            throw new Error('No se puede eliminar un evento activo');
        }

        // If this is the active event, clear it
        if (this.activeEvent && this.activeEvent.id === eventId) {
            this.activeEvent = null;
            this.saveActiveEvent();
        }

        const deletedEvent = this.events.splice(eventIndex, 1)[0];
        this.saveEvents();

        console.log('✅ Evento eliminado:', deletedEvent.name);
        return deletedEvent;
    }

    // Activate event (set as current active event)
    activateEvent(eventId) {
        const event = this.getEventById(eventId);
        if (!event) {
            throw new Error('Evento no encontrado');
        }

        // Deactivate current active event
        if (this.activeEvent) {
            this.updateEvent(this.activeEvent.id, { status: CONFIG.EVENTS.STATUS.COMPLETED });
        }

        // Activate new event
        this.updateEvent(eventId, { status: CONFIG.EVENTS.STATUS.ACTIVE });
        this.activeEvent = this.getEventById(eventId);
        this.saveActiveEvent();

        console.log('✅ Evento activado:', event.name);
        return this.activeEvent;
    }

    // Deactivate current event
    deactivateEvent() {
        if (!this.activeEvent) {
            throw new Error('No hay evento activo');
        }

        this.updateEvent(this.activeEvent.id, { status: CONFIG.EVENTS.STATUS.COMPLETED });
        this.activeEvent = null;
        this.saveActiveEvent();

        console.log('✅ Evento desactivado');
    }

    // Generate QR code for event
    generateQRCode(eventId) {
        const event = this.getEventById(eventId);
        if (!event) {
            throw new Error('Evento no encontrado');
        }

        // Create QR data
        const qrData = {
            eventId: event.id,
            eventName: event.name,
            eventDate: event.date,
            categories: event.categories.map(cat => ({
                id: cat.id,
                name: cat.name,
                type: cat.type,
                price: cat.price
            })),
            generatedAt: new Date().toISOString(),
            url: `${window.location.origin}?event=${event.id}`
        };

        // Generate QR code using a library (we'll use qrcode.js)
        const qrString = JSON.stringify(qrData);
        
        // Update event with QR code
        this.updateEvent(eventId, {
            qrCode: {
                data: qrString,
                url: qrData.url,
                generatedAt: qrData.generatedAt
            }
        });

        console.log('✅ QR generado para evento:', event.name);
        return qrData;
    }

    // Add photo to event category
    addPhotoToEvent(categoryType, price) {
        if (!this.activeEvent) {
            throw new Error('No hay evento activo');
        }

        const category = this.activeEvent.categories.find(cat => cat.type === categoryType);
        if (!category) {
            throw new Error('Categoría no encontrada en el evento activo');
        }

        // Update category count
        category.currentCount += 1;

        // Update event totals
        this.activeEvent.totalPhotos += 1;
        this.activeEvent.totalRevenue += price;

        // Save changes
        this.updateEvent(this.activeEvent.id, this.activeEvent);

        console.log('✅ Foto agregada al evento:', this.activeEvent.name);
        return this.activeEvent;
    }

    // Get event statistics
    getEventStats(eventId = null) {
        const event = eventId ? this.getEventById(eventId) : this.activeEvent;
        if (!event) {
            return null;
        }

        const stats = {
            eventId: event.id,
            eventName: event.name,
            totalPhotos: event.totalPhotos || 0,
            totalRevenue: event.totalRevenue || 0,
            categories: event.categories.map(cat => ({
                name: cat.name,
                type: cat.type,
                price: cat.price,
                count: cat.currentCount || 0,
                revenue: (cat.currentCount || 0) * cat.price,
                capacity: cat.maxCapacity,
                percentFull: cat.maxCapacity ? ((cat.currentCount || 0) / cat.maxCapacity * 100).toFixed(1) : null
            })),
            status: event.status,
            date: event.date
        };

        return stats;
    }

    // Search events
    searchEvents(query) {
        if (!query || query.trim().length === 0) {
            return this.getAllEvents();
        }

        const searchTerm = query.toLowerCase().trim();
        return this.events.filter(event => 
            event.name.toLowerCase().includes(searchTerm) ||
            event.description.toLowerCase().includes(searchTerm) ||
            event.location.toLowerCase().includes(searchTerm) ||
            event.status.toLowerCase().includes(searchTerm)
        );
    }

    // Get events by status
    getEventsByStatus(status) {
        return this.events.filter(event => event.status === status);
    }

    // Get upcoming events
    getUpcomingEvents() {
        const today = new Date().toISOString().split('T')[0];
        return this.events.filter(event => 
            event.date >= today && 
            event.status !== CONFIG.EVENTS.STATUS.CANCELLED
        ).sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    // Validate event data
    validateEventData(eventData) {
        const errors = [];

        if (!eventData.name || eventData.name.trim().length === 0) {
            errors.push('El nombre del evento es requerido');
        }

        if (!eventData.date) {
            errors.push('La fecha del evento es requerida');
        } else {
            const eventDate = new Date(eventData.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (eventDate < today) {
                errors.push('La fecha del evento debe ser hoy o en el futuro');
            }
        }

        if (!eventData.categories || !Array.isArray(eventData.categories) || eventData.categories.length === 0) {
            errors.push('Debe agregar al menos una categoría');
        } else {
            eventData.categories.forEach((cat, index) => {
                if (!cat.name || cat.name.trim().length === 0) {
                    errors.push(`Categoría ${index + 1}: El nombre es requerido`);
                }
                if (!cat.type) {
                    errors.push(`Categoría ${index + 1}: El tipo es requerido`);
                }
                if (cat.price === undefined || cat.price === null || cat.price < 0) {
                    errors.push(`Categoría ${index + 1}: El precio debe ser mayor o igual a 0`);
                }
            });
        }

        return errors;
    }
}

export default new EventService();