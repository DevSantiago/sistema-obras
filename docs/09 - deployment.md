# 09. Estrategia de despliegue

## Objetivo

Definir la estrategia inicial de despliegue para frontend web, aplicación móvil, backend, base de datos, almacenamiento y ambientes.

## Ambientes

Se manejarán tres ambientes:

- dev
- staging
- production

## Recursos por ambiente

Cada ambiente debe tener recursos separados:

- Proyecto o configuración Firebase.
- Servicio Cloud Run.
- Base de datos Cloud SQL PostgreSQL.
- Bucket de Cloud Storage.
- Variables de entorno.
- Credenciales.
- Configuración de OpenAI, cuando aplique.

## Nombres sugeridos

```text
payment-system-dev
payment-system-staging
payment-system-prod

Despliegue de Flutter Web

Flutter Web se desplegará en Firebase Hosting.

Flujo:

Commit / Pull Request
        ↓
Build Flutter Web
        ↓
Firebase Hosting deploy


Comando base:

flutter build web
firebase deploy --only hosting

Despliegue de Flutter Mobile

Android

Flujo recomendado:

Build APK/AAB
        ↓
Internal testing
        ↓
Closed testing
        ↓
Production

iOS

Flujo recomendado:

Build iOS
        ↓
TestFlight
        ↓
App Store

Despliegue del backend

El backend se desplegará en Cloud Run como contenedor.

Flujo recomendado:

Commit / Pull Request
        ↓
Tests
        ↓
Build Docker image
        ↓
Push Artifact Registry
        ↓
Deploy Cloud Run

Dockerfile base del backend

Ejemplo para NestJS:

FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY --from=builder /app/dist ./dist

CMD ["node", "dist/main.js"]

Variables de entorno del backend

NODE_ENV
PORT
DATABASE_URL
FIREBASE_PROJECT_ID
GOOGLE_CLOUD_PROJECT
STORAGE_BUCKET
OPENAI_API_KEY

Base de datos

La base de datos debe manejarse mediante migraciones.

Reglas:

* No modificar producción manualmente.
* Toda migración debe estar versionada.
* Las migraciones deben probarse primero en dev.
* Luego deben aplicarse en staging.
* Solo después deben aplicarse en production.

Backups

Cloud SQL debe tener:

* Backups automáticos diarios.
* Retención mínima definida.
* Pruebas periódicas de restauración.
* Protección contra eliminación accidental en producción.

Cloud Storage

Buckets sugeridos:

payment-supports-dev
payment-supports-staging
payment-supports-prod

Reglas:

* No públicos.
* Acceso mediante backend.
* URLs firmadas.
* Lifecycle rules para exportaciones temporales.
* Separación de archivos originales y procesados, si aplica.

CI/CD recomendado

Herramientas posibles:

* GitHub Actions.
* Cloud Build.

Pipeline mínimo:

Lint
Tests
Build
Deploy to dev
Manual approval
Deploy to staging
Manual approval
Deploy to production

Estrategia de releases

MVP

Durante el MVP se puede trabajar con despliegue manual controlado a dev y staging.

Producción

Para producción se recomienda:

* Pull Request obligatorio.
* Revisión de código.
* Tests mínimos.
* Tag de versión.
* Deploy controlado.
* Plan de rollback.

Rollback

Cada release debe permitir volver a una versión anterior del backend.

Estrategias:

* Mantener revisiones anteriores de Cloud Run.
* Versionar imágenes Docker.
* No aplicar migraciones destructivas sin plan de reversa.
* Probar migraciones en staging.

Monitoreo

Mínimo recomendado:

* Logs de Cloud Run.
* Errores de backend.
* Latencia de APIs.
* Consumo de base de datos.
* Tamaño de buckets.
* Costos de OpenAI OCR, cuando se habilite.
* Errores de autenticación.

Checklist antes de producción

* Firebase Auth configurado.
* Cloud Run desplegado.
* Cloud SQL con backups.
* Cloud Storage privado.
* Variables de entorno configuradas.
* Secretos fuera del código.
* Migraciones aplicadas.
* Roles iniciales creados.
* Usuario administrador creado.
* Logs activos.
* Exportación probada.
* Subida y descarga de adjuntos probada.
* Flujo completo probado de borrador a pagada.