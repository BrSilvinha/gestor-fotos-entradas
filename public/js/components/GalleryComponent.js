// Gallery Component
import apiService from '../services/apiService.js';
import authService from '../services/authService.js';
import utilsService from '../services/utilsService.js';
import CONFIG from '../config.js';

class GalleryComponent {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentPage = 1;
        this.photosPerPage = CONFIG.GALLERY.PHOTOS_PER_PAGE;
        this.init();
    }

    init() {
        this.render();
        this.bindEvents();
        this.loadGallery();
        
        // Listen for photo upload events
        document.addEventListener('photo:uploaded', () => this.loadGallery());
    }

    render() {
        this.container.innerHTML = `
            <div class="card mb-4">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h3 class="card-title mb-0">📷 Fotos Guardadas</h3>
                        <div>
                            <button class="btn btn-outline-secondary btn-sm me-2" id="refreshGallery">
                                <i class="bi bi-arrow-clockwise"></i> Actualizar
                            </button>
                            <button class="btn btn-outline-danger btn-sm" id="deleteAllPhotos">
                                <i class="bi bi-trash3"></i> Eliminar Todas
                            </button>
                        </div>
                    </div>
                    
                    <div class="row" id="galleryGrid">
                        ${utilsService.createLoadingSpinner('Cargando fotos...')}
                    </div>
                    
                    <!-- Pagination -->
                    <nav class="d-none" id="paginationContainer">
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">
                                Mostrando <span id="photosInfo">0</span> fotos
                            </small>
                            <ul class="pagination pagination-sm mb-0">
                                <li class="page-item" id="prevPageItem">
                                    <button class="page-link" id="prevPageBtn">
                                        <i class="bi bi-chevron-left"></i> Anterior
                                    </button>
                                </li>
                                <li class="page-item active">
                                    <span class="page-link" id="currentPageText">1</span>
                                </li>
                                <li class="page-item" id="nextPageItem">
                                    <button class="page-link" id="nextPageBtn">
                                        Siguiente <i class="bi bi-chevron-right"></i>
                                    </button>
                                </li>
                            </ul>
                            <small class="text-muted">
                                Página <span id="pageInfo">1 de 1</span>
                            </small>
                        </div>
                    </nav>
                </div>
            </div>
        `;
    }

    bindEvents() {
        // Refresh button
        this.container.querySelector('#refreshGallery').addEventListener('click', () => {
            this.loadGallery();
        });

        // Delete all button
        this.container.querySelector('#deleteAllPhotos').addEventListener('click', () => {
            this.handleDeleteAll();
        });

        // Pagination buttons
        this.container.querySelector('#prevPageBtn').addEventListener('click', () => {
            this.loadGalleryPage(this.currentPage - 1);
        });

        this.container.querySelector('#nextPageBtn').addEventListener('click', () => {
            this.loadGalleryPage(this.currentPage + 1);
        });
    }

    async loadGallery() {
        await this.loadGalleryPage(1);
    }

    async loadGalleryPage(page = 1) {
        try {
            const galleryGrid = this.container.querySelector('#galleryGrid');
            galleryGrid.innerHTML = utilsService.createLoadingSpinner('Cargando fotos...');

            const data = await apiService.getPhotos(page, this.photosPerPage);
            const photos = data.photos;
            const pagination = data.pagination;
            
            this.currentPage = pagination.current_page;
            galleryGrid.innerHTML = '';

            if (photos.length === 0 && pagination.total_photos === 0) {
                galleryGrid.innerHTML = `
                    <div class="col-12 text-center py-5">
                        <h5>📷 No hay fotos guardadas</h5>
                        <p class="text-muted">¡Toma tu primera foto!</p>
                    </div>
                `;
                this.hidePagination();
                return;
            }

            this.renderPhotos(photos);
            this.updatePaginationControls(pagination);

        } catch (error) {
            if (!CONFIG.DEVELOPMENT.SUPPRESS_API_WARNINGS) {
                console.error('Error cargando galería:', error);
            }
            
            const galleryGrid = this.container.querySelector('#galleryGrid');
            galleryGrid.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="text-muted">
                        <i class="bi bi-images display-1"></i>
                        <h5 class="mt-3">📷 No hay fotos disponibles</h5>
                        <p class="text-muted">Las fotos aparecerán aquí cuando el backend esté conectado</p>
                        ${!CONFIG.DEVELOPMENT.OFFLINE_MODE ? `
                            <button class="btn btn-secondary" onclick="this.closest('.card').querySelector('#refreshGallery').click()">
                                🔄 Reintentar
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
            this.hidePagination();
        }
    }

    renderPhotos(photos) {
        const galleryGrid = this.container.querySelector('#galleryGrid');
        
        photos.forEach(photo => {
            const fecha = utilsService.formatDate(photo.timestamp);
            const photoElement = document.createElement('div');
            photoElement.className = 'col-md-4 col-lg-3 mb-3';
            
            photoElement.innerHTML = `
                <div class="card h-100">
                    <img src="${photo.cloudinary_url}" 
                         class="card-img-top" 
                         alt="${photo.tipo}" 
                         style="height: 200px; object-fit: cover; cursor: pointer;"
                         data-photo-url="${photo.cloudinary_url}"
                         data-photo-type="${photo.tipo}">
                    <div class="card-body p-2">
                        <div class="d-flex justify-content-between">
                            <span class="badge bg-${photo.tipo === 'general' ? 'success' : 'danger'}">
                                ${photo.tipo.toUpperCase()}
                            </span>
                            <span class="badge bg-secondary">
                                ${utilsService.formatCurrency(photo.precio)}
                            </span>
                        </div>
                        <small class="text-muted d-block mt-1">${fecha}</small>
                    </div>
                </div>
            `;
            
            // Add click event for image modal
            const img = photoElement.querySelector('.card-img-top');
            img.addEventListener('click', () => {
                this.openImageModal(photo.cloudinary_url, photo.tipo);
            });
            
            galleryGrid.appendChild(photoElement);
        });
    }

    openImageModal(url, tipo) {
        const modalContent = `
            <img src="${url}" class="img-fluid rounded" alt="${tipo}" 
                 style="max-width: 90%; max-height: 90%;">
            <button class="btn btn-close btn-close-white position-absolute top-0 end-0 m-3"></button>
        `;
        
        const modal = utilsService.createModal(modalContent);
        document.body.appendChild(modal);
    }

    updatePaginationControls(pagination) {
        const paginationContainer = this.container.querySelector('#paginationContainer');
        const prevPageItem = this.container.querySelector('#prevPageItem');
        const nextPageItem = this.container.querySelector('#nextPageItem');
        const currentPageText = this.container.querySelector('#currentPageText');
        const pageInfo = this.container.querySelector('#pageInfo');
        const photosInfo = this.container.querySelector('#photosInfo');

        currentPageText.textContent = pagination.current_page;
        pageInfo.textContent = `${pagination.current_page} de ${pagination.total_pages}`;
        
        const startPhoto = pagination.photos_per_page * (pagination.current_page - 1) + 1;
        const endPhoto = Math.min(pagination.photos_per_page * pagination.current_page, pagination.total_photos);
        photosInfo.textContent = `${startPhoto}-${endPhoto} de ${pagination.total_photos}`;

        prevPageItem.classList.toggle('disabled', !pagination.has_prev);
        nextPageItem.classList.toggle('disabled', !pagination.has_next);
        
        if (pagination.total_pages > 1) {
            paginationContainer.classList.remove('d-none');
        } else {
            this.hidePagination();
        }
    }

    hidePagination() {
        this.container.querySelector('#paginationContainer').classList.add('d-none');
    }

    async handleDeleteAll() {
        return authService.requireAuth(async () => {
            const password = prompt('⚠️ ELIMINAR TODAS LAS FOTOS\n\nIngresa la contraseña:');
            
            if (!password || !authService.validateDeletePassword(password)) {
                utilsService.showStatus('Contraseña incorrecta', 'danger');
                return;
            }

            if (!confirm('¿SEGURO que quieres eliminar TODAS las fotos?')) {
                return;
            }

            try {
                const result = await apiService.deleteAllPhotos(password);

                if (result.success) {
                    utilsService.showStatus(result.message, 'success');
                    this.loadGallery();
                    
                    // Notify other components
                    document.dispatchEvent(new CustomEvent('photos:deleted'));
                } else {
                    utilsService.showStatus(result.error, 'danger');
                }
            } catch (error) {
                utilsService.showStatus('Error de conexión', 'danger');
            }
        });
    }
}

export default GalleryComponent;