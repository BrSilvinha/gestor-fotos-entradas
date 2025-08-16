# 📸 Gestor de Fotos de Entradas

Sistema web para gestionar fotos de entradas de eventos con precios y estadísticas en tiempo real.

## ✨ Características

- 📱 **Responsive**: Funciona perfectamente en móviles y desktop
- 📸 **Cámara integrada**: Toma fotos directamente desde el navegador
- 💰 **Gestión de precios**: Configura precios para entradas General y VIP
- 📊 **Estadísticas en tiempo real**: Ve totales del día y recaudación
- ☁️ **Almacenamiento en la nube**: Fotos guardadas permanentemente en Cloudinary
- 🎯 **Dos tipos de entrada**: General y VIP
- 🔒 **Seguro**: Validación de archivos y manejo de errores

## 🛠️ Tecnologías

- **Backend**: Node.js + Express
- **Base de datos**: SQLite
- **Almacenamiento**: Cloudinary
- **Frontend**: HTML5 + CSS3 + JavaScript vanilla
- **Despliegue**: Render.com

## 📊 Base de Datos

### Tabla `fotos_entradas`
```sql
CREATE TABLE fotos_entradas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo TEXT NOT NULL,                    -- 'general' o 'vip'
    filename TEXT NOT NULL,                -- nombre del archivo
    cloudinary_url TEXT NOT NULL,          -- URL de Cloudinary
    public_id TEXT NOT NULL,               -- ID público de Cloudinary
    precio DECIMAL(10,2) NOT NULL,         -- precio al momento de la foto
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla `precios_entradas`
```sql
CREATE TABLE precios_entradas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo TEXT UNIQUE NOT NULL,             -- 'general' o 'vip'
    precio DECIMAL(10,2) NOT NULL,         -- precio actual
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🚀 Instalación Local

1. **Clona el repositorio:**
```bash
git clone https://github.com/tu-usuario/gestor-fotos-entradas.git
cd gestor-fotos-entradas
```

2. **Instala dependencias:**
```bash
npm install
```

3. **Configura variables de entorno:**
```bash
# Crea archivo .env
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

4. **Ejecuta el proyecto:**
```bash
npm start
# o para desarrollo:
npm run dev
```

5. **Abre en el navegador:**
```
http://localhost:3000
```

## 🌐 Despliegue en Render

1. **Crea cuenta en Cloudinary**
   - Ve a [cloudinary.com](https://cloudinary.com)
   - Regístrate gratis
   - Copia tus credenciales del Dashboard

2. **Sube a GitHub**
   - Crea repositorio en GitHub
   - Sube tu código

3. **Configura en Render**
   - Conecta tu repositorio
   - Configura variables de entorno:
     ```
     CLOUDINARY_CLOUD_NAME=tu_cloud_name
     CLOUDINARY_API_KEY=tu_api_key
     CLOUDINARY_API_SECRET=tu_api_secret
     ```

## 📱 Uso

1. **Configurar precios:**
   - Ajusta los precios de entrada General y VIP
   - Los cambios se aplican inmediatamente

2. **Tomar fotos:**
   - Presiona "Tomar Foto General" o "Tomar Foto VIP"
   - La cámara se abre automáticamente
   - Revisa la foto y presiona "Subir"

3. **Ver estadísticas:**
   - Total recaudado del día
   - Cantidad de entradas por tipo
   - Recaudación total histórica

## 🔧 API Endpoints

### Fotos
- `POST /api/upload` - Subir nueva foto
- `GET /api/photos` - Obtener todas las fotos
- `GET /api/photos/:tipo` - Obtener fotos por tipo
- `DELETE /api/photos/:id` - Eliminar foto

### Precios
- `GET /api/precios` - Obtener precios actuales
- `PUT /api/precios/:tipo` - Actualizar precio

### Estadísticas
- `GET /api/estadisticas` - Obtener estadísticas completas

### Utilidad
- `GET /api/health` - Estado del servidor

## 🎯 Funcionalidades

### Frontend
- Interfaz responsive y moderna
- Toma de fotos con cámara del dispositivo
- Previsualización antes de subir
- Configuración de precios en tiempo real
- Galería de fotos con información
- Estadísticas automáticas
- Manejo de errores y loading states

### Backend
- API RESTful completa
- Subida de imágenes a Cloudinary
- Base de datos SQLite
- Validación de archivos
- Manejo de errores
- Estadísticas automáticas

## 📈 Estadísticas Disponibles

- **Total del día**: Recaudación de hoy
- **Entradas General**: Cantidad vendida
- **Entradas VIP**: Cantidad vendida  
- **Total histórico**: Recaudación total

## 🔒 Seguridad

- Validación de tipos de archivo
- Límite de tamaño de archivos (10MB)
- Sanitización de inputs
- Manejo seguro de errores
- Variables de entorno para credenciales

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📝 Licencia

MIT License - ve el archivo [LICENSE](LICENSE) para más detalles.

## 🆘 Soporte

Si tienes problemas:

1. Revisa que las variables de entorno estén correctas
2. Verifica tu conexión a internet
3. Checa los logs en Render Dashboard
4. Asegúrate que Cloudinary esté configurado

## 🚀 Roadmap

- [ ] Autenticación de usuarios
- [ ] Exportar reportes a PDF/Excel
- [ ] Filtros por fecha en estadísticas
- [ ] Backup automático de base de datos
- [ ] Notificaciones push
- [ ] Dashboard admin avanzado

---

Desarrollado con ❤️ para gestión de eventos