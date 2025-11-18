# Guía de Despliegue - Frontend (Firebase)

Este documento explica cómo desplegar el frontend de Inventory Innova en producción usando Firebase Hosting.

## Requisitos Previos

- Node.js instalado (versión compatible con Angular 8)
- Cuenta de Firebase
- Firebase CLI instalado o acceso a npx
- Git configurado

## Configuración del Proyecto

El proyecto está configurado para desplegarse en Firebase Hosting. La configuración se encuentra en:

- `firebase.json`: Configuración de Firebase Hosting
- `angular.json`: Configuración de build de Angular
- `package.json`: Scripts de build

## Proceso de Despliegue

### Paso 1: Construir el Proyecto para Producción

Antes de desplegar, necesitas construir el proyecto Angular para producción:

```bash
cd inventory-innova-front-angular
```

**Nota importante**: Si usas Node.js 22, necesitas usar el flag de OpenSSL legacy provider:

```bash
$env:NODE_OPTIONS="--openssl-legacy-provider"
npm run build-prod
```

O en una sola línea (PowerShell):
```powershell
$env:NODE_OPTIONS="--openssl-legacy-provider"; npm run build-prod
```

**En Linux/Mac:**
```bash
NODE_OPTIONS=--openssl-legacy-provider npm run build-prod
```

Este comando:
- Compila el proyecto Angular
- Optimiza el código para producción
- Genera los archivos en la carpeta `dist/inventoryfront/`

### Paso 2: Verificar el Build

Verifica que la carpeta `dist/inventoryfront` se haya creado correctamente:

```bash
# Windows PowerShell
if (Test-Path "dist\inventoryfront") { Write-Host "Build exitoso" } else { Write-Host "Error en build" }

# Linux/Mac
ls -la dist/inventoryfront
```

### Paso 3: Autenticarse en Firebase

Si no estás autenticado, necesitas iniciar sesión:

```bash
npx firebase-tools login
```

Esto abrirá el navegador para autenticarte con tu cuenta de Firebase.

### Paso 4: Desplegar a Firebase

Una vez autenticado, despliega el proyecto:

```bash
npx firebase-tools deploy --only hosting
```

O si tienes Firebase CLI instalado globalmente:

```bash
firebase deploy --only hosting
```

### Paso 5: Verificar el Despliegue

Después del despliegue, Firebase mostrará:
- URL de producción: `https://innova-6ab12.web.app`
- Console URL: URL del dashboard de Firebase

## Configuración de firebase.json

El archivo `firebase.json` contiene:

```json
{
  "hosting": {
    "public": "dist/inventoryfront",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

**Explicación:**
- `public`: Carpeta que contiene los archivos estáticos a desplegar
- `ignore`: Archivos y carpetas que no se deben desplegar
- `rewrites`: Reglas de reescritura para SPA (Single Page Application)

## Scripts Disponibles

En `package.json` encontrarás:

```json
{
  "scripts": {
    "build": "ng build",
    "build-prod": "ng build --prod",
    "start": "ng serve"
  }
}
```

- `npm run build`: Build de desarrollo
- `npm run build-prod`: Build de producción (optimizado)
- `npm start`: Servidor de desarrollo local

## Proceso Completo (Resumen)

```bash
# 1. Navegar al directorio
cd inventory-innova-front-angular

# 2. Construir para producción
$env:NODE_OPTIONS="--openssl-legacy-provider"; npm run build-prod

# 3. Autenticarse (solo la primera vez o si expiró la sesión)
npx firebase-tools login

# 4. Desplegar
npx firebase-tools deploy --only hosting
```

## Variables de Entorno

El proyecto usa diferentes configuraciones según el entorno:

- **Desarrollo**: `src/environments/environment.ts`
  - `urlApi: 'http://localhost:5000/api/'`

- **Producción**: `src/environments/environment.prod.ts`
  - `urlApi: 'https://inventory-innova-back-node-express-mongo.vercel.app/api/'`

El build de producción usa automáticamente `environment.prod.ts`.

## Solución de Problemas

### Error: "OpenSSL legacy provider"

Si recibes un error relacionado con OpenSSL:

```bash
# Windows PowerShell
$env:NODE_OPTIONS="--openssl-legacy-provider"; npm run build-prod

# Linux/Mac
NODE_OPTIONS=--openssl-legacy-provider npm run build-prod
```

### Error: "Failed to authenticate"

Si Firebase no te reconoce:
```bash
npx firebase-tools login
```

### Error: "Budget exceeded"

Si recibes advertencias sobre el tamaño de los archivos CSS:
- Los budgets están configurados en `angular.json`
- Actualmente están configurados para permitir hasta 50KB de advertencia y 100KB de error por archivo CSS de componente

### El build falla

1. Verifica que todas las dependencias estén instaladas:
   ```bash
   npm install
   ```

2. Limpia el cache y reconstruye:
   ```bash
   rm -rf node_modules dist
   npm install
   npm run build-prod
   ```

## Estructura del Proyecto

```
inventory-innova-front-angular/
├── src/
│   ├── app/
│   │   ├── components/      # Componentes de Angular
│   │   ├── services/        # Servicios de API
│   │   └── models/          # Modelos TypeScript
│   ├── assets/              # Recursos estáticos
│   └── environments/        # Configuraciones de entorno
├── dist/                    # Carpeta de build (generada)
│   └── inventoryfront/      # Archivos para producción
├── firebase.json            # Configuración de Firebase
├── angular.json             # Configuración de Angular
└── package.json             # Dependencias y scripts
```

## URLs Importantes

- **Aplicación en Producción**: https://innova-6ab12.web.app
- **Console de Firebase**: https://console.firebase.google.com/project/innova-6ab12/overview
- **Repositorio**: https://github.com/johanrojas07/inventory-innova-front-angular

## Despliegue Automático (Opcional)

Para configurar despliegue automático desde GitHub:

1. Ve a Firebase Console
2. Selecciona tu proyecto
3. Ve a **Hosting** → **Get started** (si es la primera vez)
4. Configura **GitHub** como fuente de despliegue
5. Conecta tu repositorio
6. Configura para desplegar desde la rama `main`

## Notas Adicionales

- El build de producción optimiza el código, minifica archivos y genera bundles optimizados
- El tiempo de build suele ser de 2-3 minutos
- El despliegue a Firebase suele tardar 1-2 minutos
- Firebase Hosting proporciona CDN global automáticamente
- Los cambios se reflejan inmediatamente después del despliegue

## Comandos Rápidos

```bash
# Build y deploy completo
$env:NODE_OPTIONS="--openssl-legacy-provider"; npm run build-prod; npx firebase-tools deploy --only hosting

# Solo build
$env:NODE_OPTIONS="--openssl-legacy-provider"; npm run build-prod

# Solo deploy (si ya hiciste build)
npx firebase-tools deploy --only hosting
```

