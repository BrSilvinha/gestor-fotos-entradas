const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuración de multer para memoria (no disco)
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
const db = new sqlite3.Database('entradas.db');

// Crear tablas si no existen
db.serialize(() => {
    // Tabla principal de fotos
    db.run(`CREATE TABLE IF NOT EXISTS fotos_entradas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tipo TEXT NOT NULL,
        filename TEXT NOT NULL,
        cloudinary_url TEXT NOT NULL,
        public_id TEXT NOT NULL,
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
        ('vip', 100.00)`);
});

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Middleware de manejo de errores
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Archivo muy grande. Máximo 10MB.' });
        }
    }
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// Ruta principal - servir el frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta para subir fotos
app.post('/api/upload', upload.single('photo'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No se ha subido ninguna foto' });
    }

    const { tipo } = req.body;
    if (!tipo || !['general', 'vip'].includes(tipo)) {
        return res.status(400).json({ error: 'Tipo de entrada inválido' });
    }

    try {
        // Obtener precio actual del tipo de entrada
        const precio = await new Promise((resolve, reject) => {
            db.get('SELECT precio FROM precios_entradas WHERE tipo = ?', [tipo], (err, row) => {
                if (err) reject(err);
                else resolve(row?.precio || 0);
            });
        });

        // Subir a Cloudinary
        const timestamp = Date.now();
        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    folder: 'entradas',
                    public_id: `${tipo}_${timestamp}`,
                    resource_type: 'image',
                    transformation: [
                        { width: 800, height: 600, crop: "limit" },
                        { quality: "auto:good" }
                    ]
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            ).end(req.file.buffer);
        });

        // Guardar en base de datos
        db.run(
            'INSERT INTO fotos_entradas (tipo, filename, cloudinary_url, public_id, precio) VALUES (?, ?, ?, ?, ?)',
            [tipo, `${tipo}_${timestamp}`, result.secure_url, result.public_id, precio],
            function(err) {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Error al guardar en base de datos' });
                }

                res.json({
                    success: true,
                    id: this.lastID,
                    filename: `${tipo}_${timestamp}`,
                    cloudinary_url: result.secure_url,
                    tipo: tipo,
                    precio: precio,
                    message: `Foto ${tipo} guardada - $${precio}`
                });
            }
        );

    } catch (error) {
        console.error('Error subiendo a Cloudinary:', error);
        res.status(500).json({ error: 'Error al subir la imagen' });
    }
});

// Ruta para obtener todas las fotos
app.get('/api/photos', (req, res) => {
    db.all(
        'SELECT * FROM fotos_entradas ORDER BY timestamp DESC',
        (err, rows) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error al obtener fotos' });
            }
            res.json(rows);
        }
    );
});

// Ruta para obtener fotos por tipo
app.get('/api/photos/:tipo', (req, res) => {
    const { tipo } = req.params;
    
    if (!['general', 'vip'].includes(tipo)) {
        return res.status(400).json({ error: 'Tipo de entrada inválido' });
    }
    
    db.all(
        'SELECT * FROM fotos_entradas WHERE tipo = ? ORDER BY timestamp DESC',
        [tipo],
        (err, rows) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error al obtener fotos' });
            }
            res.json(rows);
        }
    );
});

// Ruta para obtener precios
app.get('/api/precios', (req, res) => {
    db.all('SELECT * FROM precios_entradas ORDER BY tipo', (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al obtener precios' });
        }
        res.json(rows);
    });
});

// Ruta para actualizar precios
app.put('/api/precios/:tipo', (req, res) => {
    const { tipo } = req.params;
    const { precio } = req.body;

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
                console.error(err);
                return res.status(500).json({ error: 'Error al actualizar precio' });
            }
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
                console.error(err);
                return res.status(500).json({ error: 'Error al obtener estadísticas' });
            }
            
            stats[key] = {
                cantidad: row.cantidad || 0,
                total: parseFloat(row.total) || 0
            };
            
            completed++;
            if (completed === totalQueries) {
                res.json(stats);
            }
        });
    });
});

// Ruta para eliminar foto (opcional)
app.delete('/api/photos/:id', async (req, res) => {
    const { id } = req.params;

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

        // Eliminar de Cloudinary
        await cloudinary.uploader.destroy(photo.public_id);

        // Eliminar de base de datos
        db.run('DELETE FROM fotos_entradas WHERE id = ?', [id], function(err) {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error al eliminar foto' });
            }
            res.json({ success: true, message: 'Foto eliminada correctamente' });
        });

    } catch (error) {
        console.error('Error eliminando foto:', error);
        res.status(500).json({ error: 'Error al eliminar la foto' });
    }
});

// Ruta de salud del servidor
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Cerrar base de datos al terminar el proceso
process.on('SIGINT', () => {
    console.log('\nCerrando servidor...');
    db.close((err) => {
        if (err) {
            console.error('Error cerrando base de datos:', err.message);
        } else {
            console.log('Base de datos cerrada.');
        }
        process.exit(0);
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`📱 Abre tu navegador en: http://localhost:${PORT}`);
});