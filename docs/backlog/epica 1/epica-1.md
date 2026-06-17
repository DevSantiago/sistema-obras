# Épica 1. Configuración base del proyecto

## Objetivo

Crear la base técnica para desarrollar, probar y desplegar el sistema.

## Criterios de aceptación de la épica

- Existe repositorio versionado.
- Existe estructura base del frontend.
- Existe estructura base del backend.
- Existe conexión a base de datos.
- Existe manejo de variables de entorno.
- Existe estándar de nombres en español para dominio del negocio.
- Existe entorno local ejecutable.

## Historias

### HU-0101. Crear estructura base del proyecto

Como equipo de desarrollo, quiero una estructura inicial del proyecto, para desarrollar con orden.

Criterios:

- Tiene carpetas para frontend, backend, base de datos y documentación.
- Tiene README inicial.
- Tiene configuración de entorno.
- Tiene scripts básicos de instalación y ejecución.

 #### Checklist - Criterios

- [x] Existe carpeta `docs/`.
- [x] Existe carpeta `src/app/`.
- [x] Existe carpeta `src/components/`.
- [x] Existe carpeta `src/modules/`.
- [x] Existe carpeta `src/lib/`.
- [x] Existe carpeta `prisma/`.
- [x] Existe carpeta `tests/`.
- [x] Existe archivo `.env.example`.
- [x] Existe archivo `.gitignore`.
- [x] Existe archivo `README.md`.
- [x] Existe archivo `package.json`.
- [x] Existen scripts `dev`, `build`, `start` y `lint`.
- [x] El proyecto ejecuta localmente con `npm run dev`.

### HU-0102. Configurar conexión a base de datos

Como desarrollador, quiero conectar el backend con PostgreSQL, para persistir información.

Criterios:

- Usa variables de entorno.
- Permite ejecutar migraciones.
- Permite probar conexión local.
- Maneja errores de conexión.

#### Checklist Criterios

- [x] Usa variables de entorno.
- [x] Permite ejecutar migraciones.
- [x] Permite probar conexión local.
- [x] Maneja errores de conexión.

### HU-0103. Configurar estándar de migraciones

Como desarrollador, quiero manejar migraciones de base de datos, para controlar cambios del modelo.

Criterios:

- Existe carpeta de migraciones.
- Las migraciones crean tablas en orden correcto.
- Las migraciones incluyen restricciones e índices.
- Las migraciones pueden ejecutarse en ambiente local.

#### Checklist - Criterios

- [x] Existe carpeta `prisma/migrations`.
- [x] Se creó una migración inicial.
- [x] La migración genera archivo `migration.sql`.
- [x] La migración incluye restricción de llave primaria.
- [x] La migración puede ejecutarse en ambiente local.
- [x] Prisma reconoce la migración.
- [x] La base de datos está sincronizada con las migraciones.

