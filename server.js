require('dotenv').config();
const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const SftpClient = require('ssh2-sftp-client');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar Cloudinary con tus credenciales
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'detmqufi2',
    api_key: process.env.CLOUDINARY_API_KEY || '341624499929153',
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Verificar configuración de Cloudinary
if (!process.env.CLOUDINARY_API_SECRET) {
    console.warn('⚠️  CLOUDINARY_API_SECRET no está configurado');
}

// Configuración de multer para memoria (no disco)
// Configuración SFTP
const sftpConfig = {
    host: process.env.SFTP_HOST || '192.168.1.86',
    port: parseInt(process.env.SFTP_PORT) || 22,
    username: process.env.SFTP_USERNAME || 'silva',
    password: process.env.SFTP_PASSWORD || '71749437'
};

const SFTP_REMOTE_PATH = process.env.SFTP_REMOTE_PATH || '/home/silva/fotos-entradas';

// Función para subir archivo a SFTP
async function uploadToSFTP(buffer, filename) {
    const sftp = new SftpClient();
    try {
        console.log('📡 Conectando a servidor SFTP:', sftpConfig.host);
        await sftp.connect(sftpConfig);
        
        // Crear directorio remoto si no existe
        try {
            await sftp.mkdir(SFTP_REMOTE_PATH, true);
        } catch (error) {
            // Directorio ya existe, continuar
        }
        
        const remotePath = `${SFTP_REMOTE_PATH}/${filename}`;
        console.log('📤 Subiendo archivo a:', remotePath);
        
        await sftp.put(buffer, remotePath);
        console.log('✅ Archivo subido exitosamente via SFTP');
        
        return remotePath;
    } catch (error) {
        console.error('❌ Error en SFTP:', error);
        throw error;
    } finally {
        await sftp.end();
    }
}

// Configuración de multer para memoria
const storage = multer.memoryStorage();

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos de imagen'));
        }
    }
});

// Configurar base de datos SQLite
const dbPath = process.env.NODE_ENV === 'production' ? '/tmp/entradas.db' : 'entradas.db';
const db = new sqlite3.Database(dbPath);

// Crear tablas si no existen
db.serialize(() => {
    // Tabla principal de fotos
    db.run(`CREATE TABLE IF NOT EXISTS fotos_entradas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tipo TEXT NOT NULL,
        filename TEXT NOT NULL,
        local_path TEXT NOT NULL,
        cloudinary_url TEXT,
        public_id TEXT,
        precio DECIMAL(10,2) NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // Tabla de configuración de precios
    db.run(`CREATE TABLE IF NOT EXISTS precios_entradas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tipo TEXT UNIQUE NOT NULL,
        precio DECIMAL(10,2) NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // Insertar precios por defecto
    db.run(`INSERT OR IGNORE INTO precios_entradas (tipo, precio) VALUES 
        ('general', 50.00),
        ('vip', 100.00)`, function(err) {
        if (err) {
            console.error('Error insertando precios por defecto:', err);
        } else {
            console.log('✅ Base de datos inicializada correctamente');
        }
    });
});

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));

// Middleware de CORS para desarrollo
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Archivo muy grande. Máximo 10MB.' });
        }
        return res.status(400).json({ error: 'Error en el archivo: ' + err.message });
    }
    
    if (err.message === 'Solo se permiten archivos de imagen') {
        return res.status(400).json({ error: err.message });
    }
    
    console.error('Error no manejado:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// Ruta principal - servir el frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Función para descargar archivo desde SFTP
async function downloadFromSFTP(remotePath) {
    const sftp = new SftpClient();
    try {
        await sftp.connect(sftpConfig);
        const buffer = await sftp.get(remotePath);
        await sftp.end();
        return buffer;
    } catch (error) {
        console.error('❌ Error descargando desde SFTP:', error);
        throw error;
    }
}

// Ruta para servir fotos desde SFTP
app.get('/api/image/:filename', async (req, res) => {
    const filename = req.params.filename;
    console.log('🖼️ Solicitando imagen:', filename);
    
    try {
        // Buscar la foto en la base de datos para obtener la ruta SFTP
        const row = await new Promise((resolve, reject) => {
            db.get('SELECT local_path, cloudinary_url FROM fotos_entradas WHERE filename = ?', [filename], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!row) {
            console.log('❌ Imagen no encontrada:', filename);
            return res.status(404).json({ error: 'Imagen no encontrada' });
        }
        
        try {
            // Intentar descargar desde SFTP
            const imageBuffer = await downloadFromSFTP(row.local_path);
            console.log('✅ Sirviendo imagen desde SFTP:', row.local_path);
            
            // Detectar tipo de contenido basado en la extensión
            const ext = path.extname(filename).toLowerCase();
            let contentType = 'image/jpeg';
            if (ext === '.png') contentType = 'image/png';
            else if (ext === '.gif') contentType = 'image/gif';
            else if (ext === '.webp') contentType = 'image/webp';
            
            res.set('Content-Type', contentType);
            res.send(imageBuffer);
        } catch (sftpError) {
            console.warn('⚠️ Error descargando desde SFTP, intentando Cloudinary:', sftpError.message);
            
            // Fallback: redirigir a Cloudinary si está disponible
            if (row.cloudinary_url) {
                console.log('🔄 Redirigiendo a Cloudinary:', row.cloudinary_url);
                return res.redirect(row.cloudinary_url);
            } else {
                console.log('❌ No hay fallback disponible');
                return res.status(404).json({ error: 'Archivo no disponible' });
            }
        }
        
    } catch (error) {
        console.error('❌ Error sirviendo imagen:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta para subir fotos
app.post('/api/upload', upload.single('photo'), async (req, res) => {
    console.log('📤 Recibiendo upload request...');
    
    if (!req.file) {
        console.log('❌ No hay archivo en la request');
        return res.status(400).json({ error: 'No se ha subido ninguna foto' });
    }

    const { tipo } = req.body;
    console.log('📝 Tipo de entrada:', tipo);
    
    if (!tipo || !['general', 'vip'].includes(tipo)) {
        console.log('❌ Tipo de entrada inválido:', tipo);
        return res.status(400).json({ error: 'Tipo de entrada inválido' });
    }

    try {
        // Obtener precio actual del tipo de entrada
        console.log('💰 Obteniendo precio para tipo:', tipo);
        const precio = await new Promise((resolve, reject) => {
            db.get('SELECT precio FROM precios_entradas WHERE tipo = ?', [tipo], (err, row) => {
                if (err) {
                    console.error('Error obteniendo precio:', err);
                    reject(err);
                } else {
                    const precioFinal = row?.precio || 0;
                    console.log('💰 Precio obtenido:', precioFinal);
                    resolve(precioFinal);
                }
            });
        });

        // Generar nombre de archivo único
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const extension = path.extname(req.file.originalname);
        const filename = `${tipo}_${timestamp}${extension}`;
        
        let sftpPath = null;
        let cloudinaryUrl = null;
        let publicId = null;

        // Subir archivo a servidor SFTP
        try {
            sftpPath = await uploadToSFTP(req.file.buffer, filename);
            console.log('📁 Foto guardada en servidor SFTP:', sftpPath);
        } catch (error) {
            console.error('❌ Error subiendo a SFTP:', error);
            return res.status(500).json({ error: 'Error al guardar archivo en servidor remoto' });
        }

        // Intentar subir a Cloudinary como respaldo (opcional)
        if (process.env.CLOUDINARY_API_SECRET) {
            try {
                console.log('☁️ Subiendo imagen a Cloudinary como respaldo...');
                const cloudinaryResult = await new Promise((resolve, reject) => {
                    cloudinary.uploader.upload_stream(
                        {
                            folder: 'entradas',
                            public_id: `${tipo}_${timestamp}`,
                            resource_type: 'image',
                            transformation: [
                                { width: 1200, height: 900, crop: "limit" },
                                { quality: "auto:good" },
                                { format: "auto" }
                            ]
                        },
                        (error, result) => {
                            if (error) {
                                console.warn('⚠️ Error en Cloudinary (continuando con archivo SFTP):', error.message);
                                resolve(null);
                            } else {
                                console.log('✅ Imagen respaldada en Cloudinary:', result.secure_url);
                                resolve(result);
                            }
                        }
                    ).end(req.file.buffer);
                });
                
                if (cloudinaryResult) {
                    cloudinaryUrl = cloudinaryResult.secure_url;
                    publicId = cloudinaryResult.public_id;
                }
            } catch (error) {
                console.warn('⚠️ Error con Cloudinary, usando solo archivo SFTP:', error.message);
            }
        }

        // Guardar información en base de datos
        console.log('💾 Guardando en base de datos...');
        const dbResult = await new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO fotos_entradas (tipo, filename, local_path, cloudinary_url, public_id, precio) VALUES (?, ?, ?, ?, ?, ?)',
                [tipo, filename, sftpPath, cloudinaryUrl, publicId, precio],
                function(err) {
                    if (err) {
                        console.error('❌ Error guardando en BD:', err);
                        reject(err);
                    } else {
                        console.log('✅ Guardado en BD con ID:', this.lastID);
                        resolve({ id: this.lastID });
                    }
                }
            );
        });

        console.log('🎉 Upload completado exitosamente');
        res.json({
            success: true,
            id: dbResult.id,
            filename: filename,
            sftp_path: sftpPath,
            cloudinary_url: cloudinaryUrl,
            tipo: tipo,
            precio: precio,
            message: `Foto ${tipo} guardada en servidor Linux - $${precio}`
        });

    } catch (error) {
        console.error('💥 Error en upload:', error);
        
        // Error específico de Cloudinary
        if (error.message && error.message.includes('Must supply api_secret')) {
            return res.status(500).json({ error: 'Error de configuración: API Secret no válido' });
        }
        
        res.status(500).json({ 
            error: 'Error al subir la imagen: ' + (error.message || 'Error desconocido')
        });
    }
});

// Ruta para obtener todas las fotos con paginación
app.get('/api/photos', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12; // 12 fotos por página por defecto
    const offset = (page - 1) * limit;
    
    console.log(`📸 Obteniendo fotos - Página: ${page}, Límite: ${limit}, Offset: ${offset}`);
    
    // Obtener total de fotos para calcular total de páginas
    db.get('SELECT COUNT(*) as total FROM fotos_entradas', (err, countResult) => {
        if (err) {
            console.error('❌ Error contando fotos:', err);
            return res.status(500).json({ error: 'Error al contar fotos' });
        }
        
        const totalPhotos = countResult.total;
        const totalPages = Math.ceil(totalPhotos / limit);
        
        // Obtener fotos de la página actual
        db.all(
            'SELECT * FROM fotos_entradas ORDER BY timestamp DESC LIMIT ? OFFSET ?',
            [limit, offset],
            (err, rows) => {
                if (err) {
                    console.error('❌ Error obteniendo fotos:', err);
                    return res.status(500).json({ error: 'Error al obtener fotos' });
                }
                
                // Modificar las URLs para que apunten al servidor local
                const photosWithLocalUrls = rows.map(photo => ({
                    ...photo,
                    // Usar URL local como principal, Cloudinary como fallback
                    cloudinary_url: `/api/image/${photo.filename}`,
                    cloudinary_backup: photo.cloudinary_url // Mantener URL original como respaldo
                }));
                
                console.log(`✅ Fotos obtenidas: ${photosWithLocalUrls.length} de ${totalPhotos} total`);
                
                res.json({
                    photos: photosWithLocalUrls,
                    pagination: {
                        current_page: page,
                        total_pages: totalPages,
                        total_photos: totalPhotos,
                        photos_per_page: limit,
                        has_next: page < totalPages,
                        has_prev: page > 1
                    }
                });
            }
        );
    });
});

// Ruta para obtener fotos por tipo
app.get('/api/photos/:tipo', (req, res) => {
    const { tipo } = req.params;
    console.log('📸 Obteniendo fotos del tipo:', tipo);
    
    if (!['general', 'vip'].includes(tipo)) {
        return res.status(400).json({ error: 'Tipo de entrada inválido' });
    }
    
    db.all(
        'SELECT * FROM fotos_entradas WHERE tipo = ? ORDER BY timestamp DESC',
        [tipo],
        (err, rows) => {
            if (err) {
                console.error('❌ Error obteniendo fotos por tipo:', err);
                return res.status(500).json({ error: 'Error al obtener fotos' });
            }
            
            console.log(`✅ Fotos ${tipo} obtenidas:`, rows.length);
            res.json(rows);
        }
    );
});

// Ruta para obtener precios
app.get('/api/precios', (req, res) => {
    console.log('💰 Obteniendo precios...');
    
    db.all('SELECT * FROM precios_entradas ORDER BY tipo', (err, rows) => {
        if (err) {
            console.error('❌ Error obteniendo precios:', err);
            return res.status(500).json({ error: 'Error al obtener precios' });
        }
        
        console.log('✅ Precios obtenidos:', rows);
        res.json(rows);
    });
});

// Ruta para actualizar precios
app.put('/api/precios/:tipo', (req, res) => {
    const { tipo } = req.params;
    const { precio } = req.body;
    
    console.log('💰 Actualizando precio:', tipo, precio);

    if (!['general', 'vip'].includes(tipo)) {
        return res.status(400).json({ error: 'Tipo de entrada inválido' });
    }

    if (!precio || precio < 0) {
        return res.status(400).json({ error: 'Precio inválido' });
    }

    db.run(
        'UPDATE precios_entradas SET precio = ?, updated_at = CURRENT_TIMESTAMP WHERE tipo = ?',
        [precio, tipo],
        function(err) {
            if (err) {
                console.error('❌ Error actualizando precio:', err);
                return res.status(500).json({ error: 'Error al actualizar precio' });
            }
            
            console.log('✅ Precio actualizado:', tipo, precio);
            res.json({ 
                success: true, 
                tipo, 
                precio: parseFloat(precio), 
                message: `Precio ${tipo} actualizado a $${precio}` 
            });
        }
    );
});

// Ruta para obtener estadísticas
app.get('/api/estadisticas', (req, res) => {
    console.log('📊 Calculando estadísticas...');
    
    const queries = {
        general: 'SELECT COUNT(*) as cantidad, COALESCE(SUM(precio), 0) as total FROM fotos_entradas WHERE tipo = "general"',
        vip: 'SELECT COUNT(*) as cantidad, COALESCE(SUM(precio), 0) as total FROM fotos_entradas WHERE tipo = "vip"',
        total: 'SELECT COUNT(*) as cantidad, COALESCE(SUM(precio), 0) as total FROM fotos_entradas',
        hoy: `SELECT COUNT(*) as cantidad, COALESCE(SUM(precio), 0) as total FROM fotos_entradas 
              WHERE DATE(timestamp) = DATE('now', 'localtime')`
    };

    const stats = {};
    let completed = 0;
    const totalQueries = Object.keys(queries).length;

    Object.entries(queries).forEach(([key, query]) => {
        db.get(query, (err, row) => {
            if (err) {
                console.error('❌ Error en estadística', key, err);
                return res.status(500).json({ error: 'Error al obtener estadísticas' });
            }
            
            stats[key] = {
                cantidad: row.cantidad || 0,
                total: parseFloat(row.total) || 0
            };
            
            completed++;
            if (completed === totalQueries) {
                console.log('✅ Estadísticas calculadas:', stats);
                res.json(stats);
            }
        });
    });
});

// Ruta para eliminar foto (opcional)
app.delete('/api/photos/:id', async (req, res) => {
    const { id } = req.params;
    console.log('🗑️ Eliminando foto ID:', id);

    try {
        // Obtener info de la foto antes de eliminar
        const photo = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM fotos_entradas WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!photo) {
            return res.status(404).json({ error: 'Foto no encontrada' });
        }

        // Eliminar de Cloudinary si está configurado
        if (process.env.CLOUDINARY_API_SECRET) {
            try {
                await cloudinary.uploader.destroy(photo.public_id);
                console.log('✅ Imagen eliminada de Cloudinary');
            } catch (cloudError) {
                console.warn('⚠️ Error eliminando de Cloudinary:', cloudError.message);
            }
        }

        // Eliminar de base de datos
        db.run('DELETE FROM fotos_entradas WHERE id = ?', [id], function(err) {
            if (err) {
                console.error('❌ Error eliminando de BD:', err);
                return res.status(500).json({ error: 'Error al eliminar foto' });
            }
            
            console.log('✅ Foto eliminada de BD');
            res.json({ success: true, message: 'Foto eliminada correctamente' });
        });

    } catch (error) {
        console.error('💥 Error eliminando foto:', error);
        res.status(500).json({ error: 'Error al eliminar la foto' });
    }
});

// Ruta para eliminar todas las fotos
app.delete('/api/delete-all', (req, res) => {
    console.log('🗑️ Solicitud de eliminación de todas las fotos...');
    
    const { password } = req.body;
    
    // Validar contraseña
    if (!password || password !== '71749437') {
        console.log('❌ Contraseña incorrecta en eliminación');
        return res.status(401).json({ error: 'Contraseña incorrecta' });
    }
    
    console.log('✅ Contraseña validada, procediendo a eliminar todas las fotos...');
    
    db.run('DELETE FROM fotos_entradas', function(err) {
        if (err) {
            console.error('❌ Error eliminando fotos:', err);
            return res.status(500).json({ error: 'Error al eliminar las fotos' });
        }
        
        console.log('✅ Todas las fotos eliminadas de la base de datos. Filas afectadas:', this.changes);
        
        res.json({
            success: true,
            message: `Se eliminaron ${this.changes} fotos correctamente`,
            deleted_count: this.changes
        });
    });
});

// Ruta de salud del servidor
app.get('/api/health', (req, res) => {
    const health = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        cloudinary: !!process.env.CLOUDINARY_API_SECRET,
        database: 'SQLite',
        node_version: process.version
    };
    
    console.log('🏥 Health check:', health);
    res.json(health);
});

// Ruta para obtener estadísticas de la base de datos
app.get('/api/database-stats', (req, res) => {
    console.log('📊 Obteniendo estadísticas de la base de datos...');
    
    // Obtener estadísticas de la base de datos
    const stats = {};
    
    // Contar total de fotos
    db.get('SELECT COUNT(*) as total_photos FROM fotos_entradas', (err, photoCount) => {
        if (err) {
            console.error('❌ Error obteniendo conteo de fotos:', err);
            return res.status(500).json({ error: 'Error al obtener estadísticas' });
        }
        
        stats.total_photos = photoCount.total_photos;
        
        // Obtener tamaño total de archivos (aproximado por nombre de archivo)
        db.all('SELECT filename, local_path FROM fotos_entradas', (err, files) => {
            if (err) {
                console.error('❌ Error obteniendo archivos:', err);
                return res.status(500).json({ error: 'Error al obtener estadísticas' });
            }
            
            let totalSize = 0;
            let checkedFiles = 0;
            
            if (files.length === 0) {
                return res.json({
                    total_photos: stats.total_photos,
                    total_size_mb: 0,
                    average_size_kb: 0,
                    database_size_mb: 0,
                    storage_location: `SFTP: ${sftpConfig.host}:${SFTP_REMOTE_PATH}`,
                    photos_today: 0
                });
            }
            
            // Para SFTP, estimaremos el tamaño basado en número de archivos
            // ya que no podemos verificar fácilmente el tamaño de cada archivo remoto
            const estimatedSizePerPhoto = 150; // KB promedio estimado por foto comprimida
            totalSize = files.length * estimatedSizePerPhoto * 1024; // Convertir a bytes
            
            // Obtener tamaño de la base de datos
            let dbSize = 0;
            try {
                const dbStats = fs.statSync(dbPath);
                dbSize = dbStats.size;
            } catch (error) {
                console.warn('⚠️ No se puede obtener tamaño de BD');
            }
            
            // Contar fotos de hoy
            const today = new Date().toISOString().split('T')[0];
            db.get(
                'SELECT COUNT(*) as photos_today FROM fotos_entradas WHERE date(timestamp) = ?',
                [today],
                (err, todayCount) => {
                    if (err) {
                        console.error('❌ Error contando fotos de hoy:', err);
                    }
                    
                    const finalStats = {
                        total_photos: stats.total_photos,
                        total_size_mb: (totalSize / (1024 * 1024)).toFixed(2),
                        average_size_kb: stats.total_photos > 0 ? (totalSize / 1024 / stats.total_photos).toFixed(2) : estimatedSizePerPhoto,
                        database_size_mb: (dbSize / (1024 * 1024)).toFixed(2),
                        storage_location: `SFTP: ${sftpConfig.host}:${SFTP_REMOTE_PATH}`,
                        photos_today: todayCount ? todayCount.photos_today : 0
                    };
                    
                    console.log('✅ Estadísticas de BD:', finalStats);
                    res.json(finalStats);
                }
            );
        });
    });
});

// Ruta de configuración (para debug)
app.get('/api/config', (req, res) => {
    res.json({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'detmqufi2',
        api_key: process.env.CLOUDINARY_API_KEY || '341624499929153',
        api_secret_configured: !!process.env.CLOUDINARY_API_SECRET,
        node_env: process.env.NODE_ENV || 'development'
    });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
    console.log('❓ Ruta no encontrada:', req.originalUrl);
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Cerrar base de datos al terminar el proceso
process.on('SIGINT', () => {
    console.log('\n🔄 Cerrando servidor...');
    db.close((err) => {
        if (err) {
            console.error('❌ Error cerrando base de datos:', err.message);
        } else {
            console.log('✅ Base de datos cerrada correctamente');
        }
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('🔄 SIGTERM recibido, cerrando servidor...');
    db.close(() => {
        process.exit(0);
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log('\n🚀 ================================');
    console.log(`📱 Servidor corriendo en puerto ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`☁️ Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME || 'detmqufi2'}`);
    console.log(`🔑 API Secret: ${process.env.CLOUDINARY_API_SECRET ? '✅ Configurado' : '❌ Faltante'}`);
    console.log('🚀 ================================\n');
});