# 12. Flujos por usuario y rol

## Objetivo

Documentar los flujos funcionales del sistema según cada rol de usuario, describiendo las acciones principales, pantallas involucradas, estados del proceso, reglas de negocio y restricciones aplicables.

Este documento sirve como base para diseño de pantallas, desarrollo frontend, construcción de APIs, pruebas funcionales y validación del MVP con usuarios del negocio.

## Roles documentados

Los roles iniciales del sistema son:

- Administrador
- Solicitante
- Revisor
- Aprobador
- Pagos

## Plataformas por rol

| Rol | Flutter Web | Flutter Mobile | Descripción |
|---|---:|---:|---|
| Administrador | Sí | Opcional | Gestiona configuración, usuarios, catálogos y seguimiento general |
| Solicitante | Opcional | Sí | Crea solicitudes desde campo y consulta sus estados |
| Revisor | Sí | Opcional | Revisa solicitudes enviadas y valida soportes |
| Aprobador | Sí | Opcional | Aprueba o rechaza solicitudes revisadas |
| Pagos | Sí | Opcional | Programa pagos y marca solicitudes como pagadas |

## Consideraciones generales

- Un usuario puede tener más de un rol.
- La visibilidad de pantallas depende de los roles asignados.
- El backend debe validar todos los permisos.
- El frontend solo debe facilitar la experiencia mostrando u ocultando acciones.
- Las reglas de negocio no deben depender exclusivamente del frontend.
- Todo cambio de estado debe quedar registrado en el historial.
- Las acciones críticas deben quedar registradas en auditoría.

---

# 1. Flujo del rol Solicitante

## Descripción

El Solicitante es el usuario que crea solicitudes de pago, adjunta soportes y consulta el estado de sus solicitudes. Normalmente corresponde a un usuario en campo o personal operativo relacionado con una obra.

## Plataforma principal

Flutter Mobile.

También puede tener acceso desde Flutter Web si el negocio lo requiere.

## Objetivos del Solicitante

- Crear solicitudes de pago.
- Adjuntar fotografías o documentos soporte.
- Enviar solicitudes para revisión.
- Consultar el estado de sus solicitudes.
- Corregir solicitudes rechazadas.
- Agregar comentarios cuando sea necesario.

## Flujo principal: crear y enviar solicitud

```text
Inicio de sesión
   ↓
Pantalla principal
   ↓
Crear solicitud
   ↓
Completar información básica
   ↓
Adjuntar soporte
   ↓
Guardar como borrador o enviar
   ↓
Sistema valida información
   ↓
Solicitud pasa a estado Enviada