# 📸 Gestor de Fotos de Entradas

Sistema web completo para gestionar fotos de entradas de eventos con precios dinámicos y estadísticas en tiempo real.

## 🎯 Características Principales

- 📱 **Totalmente Responsive**: Optimizado para móviles y desktop
- 📸 **Cámara Integrada**: Toma fotos directamente desde el navegador
- 💰 **Gestión de Precios**: Configura precios dinámicos para General y VIP
- 📊 **Estadísticas en Tiempo Real**: Dashboard con métricas del día y totales
- ☁️ **Almacenamiento Permanente**: Fotos guardadas en Cloudinary (sin pérdidas)
- 🎯 **Dos Tipos de Entrada**: Sistema diferenciado para General y VIP
- 🔒 **Seguro y Robusto**: Validación completa y manejo de errores
- 🚀 **Fácil Deployment**: Listo para Render.com

## 🛠️ Stack Tecnológico

- **Backend**: Node.js + Express.js
- **Base de Datos**: SQLite (con migraciones automáticas)
- **Almacenamiento**: Cloudinary CDN
- **Frontend**: HTML5 + CSS3 + JavaScript ES6
- **Deployment**: Render.com
- **CI/CD**: GitHub Actions ready

## 📊 Estructura de Base de Datos

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

## 🚀 Instalación y Configuración

### Paso 1: Cloudinary (5 minutos)
1. Ve a [cloudinary.com](https://cloudinary.com) y regístrate gratis
2. Desde tu Dashboard, copia:
   - **Cloud name**: `detmqufi2` (tu ejemplo)
   - **API Key**: `341624499929153` (tu ejemplo)
   - **API Secret**: Haz clic en "View API Keys" para obtenerlo

### Paso 2: Proyecto Local (10 minutos)
```bash
# Crear estructura
mkdir gestor-fotos-entradas
cd gestor-fotos-entradas
mkdir public

# Crear archivos (copiar código de cada artifact)
touch server.js package.json .gitignore README.md
touch public/index.html

# Instalar dependencias
npm install

# Configurar variables (opcional para local)
echo "CLOUDINARY_CLOUD_NAME=detmqufi2" > .env
echo "CLOUDINARY_API_KEY=341624499929153" >> .env
echo "CLOUDINARY_API_SECRET=tu_api_secret_aqui" >> .env

# Probar localmente
npm start
```

### Paso 3: GitHub (5 minutos)
```bash
git init
git add .
git commit -m "Initial commit - Gestor de fotos de entradas"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/gestor-fotos-entradas.git
git push -u origin main
```

### Paso 4: Render Deploy (10 minutos)
1. **Conecta GitHub** en [render.com](https://render.com)
2. **Nuevo Web Service** → Selecciona tu repositorio
3. **Configuración**:
   ```
   Name: gestor-fotos-entradas
   Branch: main
   Build Command: npm install
   Start Command: npm start
   ```
4. **Variables de Entorno**:
   ```
   CLOUDINARY_CLOUD_NAME=detmqufi2
   CLOUDINARY_API_KEY=341624499929153
   CLOUDINARY_API_SECRET=tu_api_secret_real
   ```
5. **Deploy** y esperar 3-5 minutos

## 💡 Uso de la Aplicación

### Para Operadores:
1. **Configurar Precios**: Ajusta precios de General y VIP según evento
2. **Tomar Fotos**: Selecciona tipo → Cámara → Preview → Subir
3. **Ver Estadísticas**: Dashboard automático con totales

### Para Administradores:
- **Dashboard en tiempo real** con métricas del día
- **Historial completo** de fotos con precios
- **Configuración flexible** de precios por tipo

## 🔧 API Reference

### Endpoints de Fotos
```javascript
POST /api/upload          // Subir nueva foto
GET  /api/photos          // Obtener todas las fotos  
GET  /api/photos/:tipo    // Fotos por tipo (general/vip)
DELETE /api/photos/:id    // Eliminar foto específica
```

### Endpoints de Precios
```javascript
GET /api/precios          // Obtener precios actuales
PUT /api/precios/:tipo    // Actualizar precio por tipo
```

### Endpoints de Estadísticas
```javascript
GET /api/estadisticas     // Dashboard completo
GET /api/health          // Estado del servidor
GET /api/config          // Configuración (debug)
```

### Ejemplo de Request
```javascript
// Subir foto
const formData = new FormData();
formData.append('photo', file);
formData.append('tipo', 'vip');

fetch('/api/upload', {
    method: 'POST',
    body: formData
})
.then(response => response.json())
.then(result => console.log(result));
```

## 📱 Funcionalidades Frontend

- **Progressive Web App** (PWA ready)
- **Detección de conexión** (online/offline)
- **Validación en tiempo real** de archivos
- **Preview de imágenes** antes de subir
- **Loading states** y feedback visual
- **Responsive design** móvil-first
- **Keyboard shortcuts** (ESC, Enter)
- **Auto-refresh** de estadísticas
- **Modal de imágenes** para vista ampliada

## 🎨 Mejoras Incluidas

### UX/UI:
- Animaciones suaves y modernas
- Indicadores de estado de conexión
- Feedback visual para todas las acciones
- Diseño glassmorphism
- Gradientes dinámicos

### Performance:
- Lazy loading de imágenes
- Optimización automática en Cloudinary
- Compresión de imágenes
- Debounce en actualizaciones

### Robustez:
- Manejo completo de errores
- Retry automático en fallos
- Validación client/server side
- Logs detallados para debug

## 🐛 Troubleshooting

### Error: "API Secret no válido"
```bash
# Verificar variables en Render
CLOUDINARY_API_SECRET=tu_api_secret_correcto
```

### Error: "Cannot connect to database"
```bash
# En Render, verificar logs
# La BD SQLite se crea automáticamente
```

### Error: "Archivo muy grande"
```bash
# Máximo 10MB por imagen
# Optimización automática activada
```

### Debug Mode
```javascript
// Ir a: tu-app.com/api/config
// Ver configuración actual
```

## 📈 Estadísticas Disponibles

- **Recaudación del día**: Total en efectivo hoy
- **Entradas vendidas**: Contador por tipo
- **Histórico total**: Acumulado desde inicio
- **Promedio por entrada**: Cálculo automático
- **Picos de venta**: Horas de mayor actividad

## 🔐 Seguridad

- ✅ Validación de tipos de archivo
- ✅ Límites de tamaño (10MB max)
- ✅ Sanitización de inputs
- ✅ Variables de entorno para secrets
- ✅ CORS configurado
- ✅ Rate limiting ready
- ✅ SQL injection prevention

## 🚀 Escalabilidad

### Actuales límites (Render Free):
- **Almacenamiento**: Cloudinary (25GB gratis)
- **Bandwidth**: 100GB/mes
- **Requests**: Ilimitadas
- **Uptime**: 99.9%

### Para producción:
- Upgrade a Render Pro ($25/mes)
- PostgreSQL para BD principal
- Redis para cache
- CDN global activado

## 🎛️ Variables de Entorno

```bash
# Obligatorias
CLOUDINARY_CLOUD_NAME=detmqufi2
CLOUDINARY_API_KEY=341624499929153  
CLOUDINARY_API_SECRET=tu_api_secret

# Opcionales
NODE_ENV=production
PORT=3000
```

## 📦 Dependencias

```json
{
  "express": "^4.18.2",        // Web framework
  "multer": "^1.4.5-lts.1",    // File uploads
  "sqlite3": "^5.1.6",         // Database
  "cloudinary": "^1.41.0"      // Image storage
}
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crear feature branch: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -m 'Add nueva funcionalidad'`
4. Push branch: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

## 📝 Roadmap

### v2.0 (Próximo)
- [ ] Sistema de usuarios y autenticación
- [ ] Exportar reportes a PDF/Excel
- [ ] Filtros avanzados por fecha
- [ ] Dashboard de administrador
- [ ] API para integraciones

### v2.1 (Futuro)
- [ ] Modo offline con sincronización
- [ ] Notificaciones push
- [ ] Análisis de tendencias
- [ ] Multi-idioma
- [ ] Tema oscuro

## 🆘 Soporte

### Problemas comunes:
1. **Variables de entorno**: Verificar en Render Dashboard
2. **Conexión**: Usar `/api/health` para diagnosticar
3. **Imágenes**: Verificar cuenta Cloudinary activa
4. **Performance**: Revisar logs en Render

### Contacto:
- GitHub Issues: Para bugs y features
- Email: tu-email@ejemplo.com
- Documentación: En este README

## 📄 Licencia

MIT License - Libre para uso comercial y personal.

## 🙏 Agradecimientos

- **Cloudinary** por el servicio de imágenes
- **Render** por el hosting gratuito
- **SQLite** por la simplicidad
- **Express.js** por la flexibilidad

---

**Desarrollado con ❤️ para la gestión moderna de eventos**

### 🎯 Demo en Vivo
- **URL**: `https://tu-app.onrender.com`
- **Usuario Demo**: No requerido
- **Funcionalidades**: Todas activas

### 📱 Compatibilidad
- ✅ Chrome 90+
- ✅ Safari 14+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Móviles iOS/Android