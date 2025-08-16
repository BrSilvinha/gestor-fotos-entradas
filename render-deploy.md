# 🚀 Guía para Deploy en Render

## 📋 Pasos para subir tu proyecto a Render

### 1. Preparar el proyecto

Asegúrate de tener estos archivos:
- ✅ `package.json` con scripts de start
- ✅ `.env` con credenciales de Cloudinary
- ✅ `server.js` configurado

### 2. Crear repositorio en GitHub

```bash
# Inicializar git (si no está iniciado)
git init

# Crear .gitignore
echo "node_modules/" > .gitignore
echo ".env" >> .gitignore
echo "database.db" >> .gitignore

# Hacer commit
git add .
git commit -m "Initial commit - Gestor de Fotos"

# Subir a GitHub
# Crea un repositorio en github.com
git remote add origin https://github.com/tu-usuario/gestor-fotos-entradas.git
git branch -M main
git push -u origin main
```

### 3. Deploy en Render

1. **Crear cuenta en Render:**
   - Ve a https://render.com
   - Regístrate gratis

2. **Crear Web Service:**
   - Click "New +" → "Web Service"
   - Conecta tu repositorio de GitHub
   - Selecciona tu repo `gestor-fotos-entradas`

3. **Configurar el servicio:**
   ```
   Name: gestor-fotos-entradas
   Environment: Node
   Branch: main
   Build Command: npm install
   Start Command: npm start
   ```

4. **Variables de entorno:**
   En la sección "Environment Variables" agrega:
   ```
   CLOUDINARY_CLOUD_NAME = detmqufi2
   CLOUDINARY_API_KEY = 341624499929153
   CLOUDINARY_API_SECRET = vvWqNA5HtEt7afgB9OUeF9p-Va8
   PORT = 10000
   ```

5. **Deploy:**
   - Click "Create Web Service"
   - Render automáticamente construirá y desplegará tu app
   - Te dará una URL como: `https://tu-app.onrender.com`

### 4. Verificar deployment

- ✅ La app debe cargar en la URL de Render
- ✅ Debe poder tomar/subir fotos
- ✅ Base de datos SQLite se crea automáticamente
- ✅ Cloudinary debe funcionar correctamente

### 5. Configurar dominio personalizado (opcional)

En Render → Settings → Custom Domains:
- Agrega tu dominio personalizado
- Configura DNS según las instrucciones

## 🔧 Troubleshooting

**Si hay errores:**
1. Revisa logs en Render Dashboard
2. Verifica variables de entorno
3. Asegúrate que `npm start` funcione localmente

**Base de datos:**
- SQLite se crea automáticamente en Render
- Los datos se pierden en cada redeploy (normal en plan gratuito)
- Para persistencia, considera upgrade a plan pagado

## 📱 URL final

Tu app estará disponible en:
`https://tu-nombre-app.onrender.com`

¡Listo para usar desde cualquier dispositivo móvil!