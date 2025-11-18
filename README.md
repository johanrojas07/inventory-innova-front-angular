# Front - Inventory Innova

Frontend del sistema de inventario Inventory Innova desarrollado con Angular 8.

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 8.3.20.

## 🚀 Despliegue en Producción

Para desplegar este proyecto en producción usando Firebase Hosting, consulta la [Guía de Despliegue](./DEPLOY.md).

**Resumen rápido:**
1. Construye el proyecto: `$env:NODE_OPTIONS="--openssl-legacy-provider"; npm run build-prod`
2. Autentícate: `npx firebase-tools login`
3. Despliega: `npx firebase-tools deploy --only hosting`

## 📋 Requisitos

- Node.js (compatible con Angular 8)
- Cuenta de Firebase (para producción)

## 🛠️ Instalación Local

```bash
npm install
npm start
```

El servidor de desarrollo se ejecutará en `http://localhost:4200/`

## 🏗️ Build para Producción

```bash
# Windows PowerShell
$env:NODE_OPTIONS="--openssl-legacy-provider"; npm run build-prod

# Linux/Mac
NODE_OPTIONS=--openssl-legacy-provider npm run build-prod
```

## 📁 Estructura del Proyecto

```
├── src/
│   ├── app/
│   │   ├── components/      # Componentes de Angular
│   │   ├── services/        # Servicios de API
│   │   └── models/          # Modelos TypeScript
│   ├── assets/              # Recursos estáticos
│   └── environments/        # Configuraciones de entorno
├── dist/                    # Carpeta de build (generada)
├── firebase.json            # Configuración de Firebase
└── angular.json             # Configuración de Angular
```

## 🧪 Testing

```bash
# Unit tests
npm test

# End-to-end tests
npm run e2e
```

## 📚 Comandos Útiles

```bash
# Generar componente
ng generate component component-name

# Generar servicio
ng generate service service-name

# Ayuda
ng help
```

## 🐳 Docker

```bash
docker build -t inventoryfront .
docker run -d -it -p 88:80 inventoryfront
docker tag inventoryfront aparra000/innovafront:latest
docker push aparra000/innovafront:latest
```

## 📚 Documentación

- [Guía de Despliegue](./DEPLOY.md) - Instrucciones detalladas para desplegar en Firebase
- [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md)

## 🌐 URLs de Producción

- **Frontend**: https://innova-6ab12.web.app
- **Backend API**: https://inventory-innova-back-node-express-mongo.vercel.app/api/
