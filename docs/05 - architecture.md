# 05. Arquitectura del sistema

## Objetivo

Definir la arquitectura técnica del sistema de gestión de solicitudes de pago, garantizando separación de responsabilidades, escalabilidad, seguridad y mantenibilidad.

## Principios arquitectónicos

- El frontend nunca se conecta directamente a la base de datos.
- Toda lógica de negocio vive en el backend.
- La base de datos es la fuente principal de datos transaccionales.
- Los archivos se almacenan en Cloud Storage, no en PostgreSQL.
- Firebase Auth se usa para autenticación.
- La autorización se aplica en el backend.
- El sistema debe permitir escalar frontend, backend, base de datos y almacenamiento de forma independiente.
- El diseño debe facilitar futuras integraciones con OCR, ERP y notificaciones.

## Arquitectura general

```text
Flutter Web / Flutter Mobile
        ↓
Firebase Auth
        ↓
API Backend en Cloud Run
        ↓
Cloud SQL PostgreSQL
        ↓
Cloud Storage
        ↓
OpenAI Vision
```
