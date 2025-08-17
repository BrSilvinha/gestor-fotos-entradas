// Image Processing Service
import CONFIG from '../config.js';

class ImageService {
    constructor() {
        this.config = CONFIG.IMAGE;
    }

    // Validate image file
    validateImage(file) {
        if (!file.type.startsWith('image/')) {
            throw new Error('El archivo debe ser una imagen válida');
        }

        if (file.size > this.config.MAX_FILE_SIZE) {
            throw new Error('El archivo es muy grande. Máximo 10MB');
        }

        return true;
    }

    // Compress image
    async compressImage(file, maxWidth = this.config.MAX_WIDTH, maxHeight = this.config.MAX_HEIGHT, quality = this.config.QUALITY) {
        return new Promise((resolve, reject) => {
            console.log('🗜️ Comprimiendo imagen...', {
                original: file.name,
                size: (file.size / 1024).toFixed(2) + 'KB'
            });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                try {
                    // Calculate new dimensions maintaining aspect ratio
                    let { width, height } = img;

                    if (width > height) {
                        if (width > maxWidth) {
                            height = (height * maxWidth) / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = (width * maxHeight) / height;
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    // Draw resized image
                    ctx.drawImage(img, 0, 0, width, height);

                    // Convert to compressed blob
                    canvas.toBlob((compressedBlob) => {
                        const compressedFile = new File([compressedBlob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        });

                        const compressionRatio = ((file.size - compressedFile.size) / file.size * 100).toFixed(1);
                        console.log('✅ Imagen comprimida:', {
                            original: (file.size / 1024).toFixed(2) + 'KB',
                            compressed: (compressedFile.size / 1024).toFixed(2) + 'KB',
                            saved: compressionRatio + '%'
                        });

                        resolve(compressedFile);
                    }, 'image/jpeg', quality);
                } catch (error) {
                    reject(error);
                }
            };

            img.onerror = () => reject(new Error('Error al procesar la imagen'));
            img.src = URL.createObjectURL(file);
        });
    }

    // Process image file (validate + compress)
    async processImage(file) {
        this.validateImage(file);
        return await this.compressImage(file);
    }
}

export default new ImageService();