// Camera Component
import apiService from '../services/apiService.js';
import authService from '../services/authService.js';
import imageService from '../services/imageService.js';
import utilsService from '../services/utilsService.js';
import CONFIG from '../config.js';

class CameraComponent {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.selectedType = '';
        this.selectedFile = null;
        this.init();
    }

    init() {
        this.render();
        this.bindEvents();
    }

    render() {
        this.container.innerHTML = `
            <div class="card mb-4">
                <div class="card-body">
                    <h3 class="card-title">📷 Tomar Fotos</h3>
                    
                    <!-- Modo ultrarrápido -->
                    <div class="alert alert-info mb-3">
                        <i class="bi bi-lightning-charge"></i> 
                        <strong>Modo ultrarrápido:</strong> Tomar foto → Subir automáticamente → Lista para siguiente
                    </div>

                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <button class="btn btn-success w-100 py-3" 
                                    data-type="general" id="btnGeneral">
                                🎫 Tomar Foto General
                            </button>
                        </div>
                        <div class="col-md-6 mb-3">
                            <button class="btn btn-danger w-100 py-3" 
                                    data-type="vip" id="btnVip">
                                ⭐ Tomar Foto VIP
                            </button>
                        </div>
                    </div>

                    <div class="text-center mb-3">
                        <small class="text-muted">
                            <i class="bi bi-lightning-charge"></i> 
                            Se abrirá tu cámara (sin flash) → Toma foto → Sube automáticamente
                        </small>
                    </div>

                    <input type="file" id="photoInput" accept="image/*" capture="environment" class="d-none">
                    
                    <div id="cameraStatus" class="mt-3"></div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        // Camera buttons
        const cameraButtons = this.container.querySelectorAll('[data-type]');
        cameraButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                this.selectPhotoType(type);
            });
        });

        // File input change
        const photoInput = this.container.querySelector('#photoInput');
        photoInput.addEventListener('change', (e) => this.handleFileSelect(e));
    }

    selectPhotoType(type) {
        return authService.requireAuth(() => {
            if (!utilsService.isOnline) {
                utilsService.showStatus('Sin conexión a internet', 'danger', 'cameraStatus');
                return;
            }

            this.selectedType = type;
            console.log('⚡ Tipo seleccionado:', type);
            
            // Update button visual feedback
            this.updateButtonStates(type);
            
            // Open camera immediately
            this.container.querySelector('#photoInput').click();
        });
    }

    updateButtonStates(selectedType) {
        const generalBtn = this.container.querySelector('#btnGeneral');
        const vipBtn = this.container.querySelector('#btnVip');
        
        // Reset all buttons
        generalBtn.classList.remove('btn-outline-success');
        generalBtn.classList.add('btn-success');
        vipBtn.classList.remove('btn-outline-danger');
        vipBtn.classList.add('btn-danger');
        
        // Highlight selected button
        if (selectedType === 'general') {
            generalBtn.classList.remove('btn-success');
            generalBtn.classList.add('btn-outline-success');
        } else if (selectedType === 'vip') {
            vipBtn.classList.remove('btn-danger');
            vipBtn.classList.add('btn-outline-danger');
        }
    }

    async handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            console.log('⚡ Procesando foto...');
            utilsService.showStatus('⚡ Procesando y subiendo...', 'info', 'cameraStatus');
            
            // Process and compress image
            const compressedFile = await imageService.processImage(file);
            this.selectedFile = compressedFile;
            
            // Upload immediately
            await this.uploadPhoto();
            
            // Clear input for next photo
            event.target.value = '';
            console.log('✅ Lista para siguiente foto');
            
        } catch (error) {
            if (!CONFIG.DEVELOPMENT.SUPPRESS_API_WARNINGS) {
                console.error('Error procesando foto:', error);
            }
            utilsService.showStatus(error.message, 'danger', 'cameraStatus');
        }
    }

    async uploadPhoto() {
        if (!this.selectedFile || !this.selectedType) {
            utilsService.showStatus('Error: No hay foto seleccionada', 'danger', 'cameraStatus');
            return;
        }

        try {
            const result = await apiService.uploadPhoto(this.selectedFile, this.selectedType);

            if (result.success) {
                utilsService.showStatus(`✅ ${result.message}`, 'success', 'cameraStatus');
                
                // Dispatch photo uploaded event for other components to update
                document.dispatchEvent(new CustomEvent('photo:uploaded', {
                    detail: { result, type: this.selectedType }
                }));
                
                // Reset button states
                this.resetButtonStates();
            } else {
                utilsService.showStatus(result.error || 'Error al subir', 'danger', 'cameraStatus');
            }
        } catch (error) {
            if (!CONFIG.DEVELOPMENT.SUPPRESS_API_WARNINGS) {
                console.error('Error subiendo foto:', error);
            }
            
            if (CONFIG.DEVELOPMENT.OFFLINE_MODE) {
                utilsService.showStatus('📱 Modo offline - foto guardada localmente', 'warning', 'cameraStatus');
            } else {
                utilsService.showStatus('Error de conexión', 'danger', 'cameraStatus');
            }
        }
    }

    resetButtonStates() {
        const generalBtn = this.container.querySelector('#btnGeneral');
        const vipBtn = this.container.querySelector('#btnVip');
        
        // Reset to normal button styles
        generalBtn.classList.remove('btn-outline-success');
        generalBtn.classList.add('btn-success');
        vipBtn.classList.remove('btn-outline-danger');
        vipBtn.classList.add('btn-danger');
    }
}

export default CameraComponent;