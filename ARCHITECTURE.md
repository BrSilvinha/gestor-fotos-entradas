# Photo Manager - Arquitectura del Proyecto

## 🏗️ Estructura del Proyecto

```
gestor-fotos-entradas/
├── server.js                 # Servidor Express (Backend)
├── package.json             # Dependencias del proyecto
├── .env                     # Variables de entorno
├── ARCHITECTURE.md          # Este archivo
└── public/                  # Frontend (Cliente)
    ├── index.html          # HTML principal (solo estructura)
    ├── js/
    │   ├── app.js          # Aplicación principal
    │   ├── config.js       # Configuración global
    │   ├── services/       # Capa de servicios
    │   │   ├── apiService.js      # Comunicación con API
    │   │   ├── authService.js     # Autenticación
    │   │   ├── imageService.js    # Procesamiento de imágenes
    │   │   └── utilsService.js    # Utilidades generales
    │   └── components/     # Componentes UI modulares
    │       ├── LoginComponent.js      # Login y autenticación
    │       ├── CameraComponent.js     # Cámara y subida de fotos
    │       ├── GalleryComponent.js    # Galería con paginación
    │       └── UIComponents.js       # Componentes pequeños
    └── assets/            # Recursos estáticos (futuro)
```

## 🎯 Arquitectura por Capas

### 1. **Capa de Presentación (UI)**
- **index.html**: Estructura HTML mínima con contenedores para módulos
- **CSS**: Solo Bootstrap 5 puro (SIN CSS personalizado)
- **Componentes**: Módulos UI independientes y reutilizables

### 2. **Capa de Servicios (Business Logic)**
- **apiService**: Comunicación con el backend
- **authService**: Manejo de autenticación y sesiones
- **imageService**: Procesamiento y compresión de imágenes
- **utilsService**: Utilidades compartidas

### 3. **Capa de Configuración**
- **config.js**: Configuración centralizada de la aplicación
- **Constantes**: URLs, límites, configuraciones UI

### 4. **Capa de Aplicación (App Core)**
- **app.js**: Orquestador principal de la aplicación
- **Gestión de estado**: Comunicación entre componentes
- **Ciclo de vida**: Inicialización y limpieza

## 🧩 Componentes Modulares

### LoginComponent
- Manejo de autenticación
- Validación de contraseñas
- Gestión de sesiones

### CameraComponent
- Captura de fotos ultrarrápida
- Integración con cámara nativa
- Subida automática

### GalleryComponent
- Galería con paginación
- Modal de imágenes
- Eliminación de fotos

### UIComponents
- HeaderComponent: Encabezado y precios
- StatisticsComponent: Estadísticas en tiempo real
- PricingComponent: Configuración de precios
- StorageComponent: Estado del almacenamiento
- ConnectionComponent: Estado de conexión

## 🔄 Comunicación Entre Componentes

### Event-Driven Architecture
```javascript
// Eventos personalizados para comunicación
document.dispatchEvent(new CustomEvent('photo:uploaded', { detail: data }));
document.dispatchEvent(new CustomEvent('auth:success'));
document.dispatchEvent(new CustomEvent('prices:updated'));
```

### Servicios Singleton
```javascript
// Servicios compartidos accesibles globalmente
import apiService from './services/apiService.js';
import authService from './services/authService.js';
```

## 🚀 Flujo de la Aplicación

### 1. **Inicialización**
```
app.js → Componentes → Servicios → API Backend
```

### 2. **Autenticación**
```
LoginComponent → authService → sessionStorage → app.showMainContent()
```

### 3. **Captura de Foto (Ultrarrápida)**
```
CameraComponent → imageService → apiService → Event → GalleryComponent.refresh()
```

### 4. **Actualización de Datos**
```
Component.action() → apiService → Event → OtherComponents.update()
```

## 🛠️ Tecnologías Utilizadas

### Frontend
- **Vanilla JavaScript ES6+**: Módulos nativos, sin frameworks
- **Bootstrap 5**: Framework CSS responsivo (SIN CSS personalizado)
- **Custom Events**: Comunicación entre componentes
- **Fetch API**: Comunicación con el servidor
- **Canvas API**: Compresión de imágenes
- **File API**: Manejo de archivos

### Backend
- **Node.js + Express**: Servidor HTTP
- **SQLite**: Base de datos local
- **Multer**: Subida de archivos
- **SFTP**: Almacenamiento remoto
- **Cloudinary**: Backup en la nube

## 🎯 Principios de Diseño

### 1. **Separation of Concerns**
- UI separada de lógica de negocio
- Servicios especializados
- Configuración centralizada

### 2. **Modularidad**
- Componentes independientes
- Servicios reutilizables
- Fácil testing y mantenimiento

### 3. **Escalabilidad**
- Arquitectura preparada para crecimiento
- Fácil agregar nuevos componentes
- Servicios extensibles

### 4. **Performance**
- Carga bajo demanda
- Compresión de imágenes
- Eventos asíncronos

## 🔧 Configuración de Desarrollo

### Agregar Nuevo Componente
1. Crear archivo en `js/components/`
2. Implementar interfaz estándar:
   ```javascript
   class NewComponent {
       constructor(containerId) { }
       init() { }
       render() { }
       bindEvents() { }
       destroy() { } // opcional
   }
   ```
3. Registrar en `app.js`
4. Agregar contenedor en `index.html`

### Agregar Nuevo Servicio
1. Crear archivo en `js/services/`
2. Exportar como singleton:
   ```javascript
   class NewService { }
   export default new NewService();
   ```
3. Importar donde sea necesario

## 📱 Responsive Design

- **Mobile First**: Diseño optimizado para móviles
- **Bootstrap Grid**: Sistema responsivo
- **Touch Friendly**: Botones grandes para touch
- **Fast Camera**: Acceso directo a cámara nativa

## 🔒 Seguridad

- **Client-side Auth**: Contraseñas no almacenadas
- **Session Management**: sessionStorage para sesiones temporales
- **Input Validation**: Validación en cliente y servidor
- **File Type Validation**: Solo imágenes permitidas

## 🚀 Deploy

### Desarrollo
```bash
npm install
npm run dev
```

### Producción
```bash
npm install
npm start
```

La aplicación está lista para deploy en cualquier servicio que soporte Node.js (Render, Heroku, etc.).

## 🔮 Futuras Mejoras

1. **PWA**: Service Workers para funcionalidad offline
2. **Real-time**: WebSockets para actualizaciones en tiempo real
3. **Testing**: Unit tests para componentes y servicios
4. **TypeScript**: Tipado estático para mejor mantenibilidad
5. **State Management**: Redux/Zustand para estado complejo
6. **Build Process**: Webpack/Vite para optimización