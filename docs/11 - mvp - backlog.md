# 11. Backlog inicial del MVP

## Objetivo

Definir el backlog inicial para construir el MVP del sistema de gestión de solicitudes de pago.

## Alcance del MVP

El MVP incluirá:

- Login.
- Crear solicitud de pago.
- Adjuntar soportes.
- Consultar solicitudes.
- Ver detalle de solicitud.
- Cambiar estados.
- Roles y permisos básicos.
- Exportación a Excel.
- Historial de cambios.
- Comentarios.

## Fuera del MVP

No se incluirá inicialmente:

- OCR avanzado.
- Integraciones ERP.
- Firma digital.
- Offline avanzado.
- Automatizaciones complejas.
- Aprobaciones multinivel.
- Conciliación bancaria.
- Notificaciones push avanzadas.

---

## Épica 1: Configuración base del proyecto

### Historia 1.1: Crear monorepo

Como equipo técnico, quiero tener un repositorio organizado para frontend, backend, paquetes compartidos e infraestructura.

#### Criterios de aceptación

- Existe estructura base del monorepo.
- Existe carpeta apps.
- Existe carpeta packages.
- Existe carpeta docs.
- Existe carpeta infra.

### Historia 1.2: Crear backend base

Como equipo técnico, quiero tener un backend inicial desplegable para comenzar a construir APIs.

#### Criterios de aceptación

- Proyecto backend creado.
- Endpoint health check disponible.
- Dockerfile creado.
- Variables de entorno configuradas.
- Servicio preparado para Cloud Run.

### Historia 1.3: Crear aplicaciones Flutter

Como equipo técnico, quiero tener proyectos Flutter separados para web administrativa y móvil de campo.

#### Criterios de aceptación

- Proyecto Flutter Web creado.
- Proyecto Flutter Mobile creado.
- Configuración base de rutas.
- Tema visual inicial.
- Cliente HTTP base.

## Épica 2: Autenticación y usuarios

### Historia 2.1: Login con Firebase Auth

Como usuario, quiero iniciar sesión para acceder al sistema.

#### Criterios de aceptación

- El usuario puede iniciar sesión.
- Se obtiene token de Firebase.
- El token se envía al backend.
- Se muestra error si el login falla.

### Historia 2.2: Validación de token en backend

Como sistema, quiero validar el token de Firebase para identificar al usuario autenticado.

#### Criterios de aceptación

- Backend valida ID Token.
- Backend rechaza requests sin token.
- Backend rechaza tokens inválidos.
- Backend resuelve usuario interno.

### Historia 2.3: Endpoint de perfil

Como usuario autenticado, quiero consultar mi perfil y roles.

#### Criterios de aceptación

- Existe endpoint `/me`.
- Devuelve datos del usuario.
- Devuelve roles asignados.

### Historia 2.4: Gestión básica de roles

Como administrador, quiero asignar roles a usuarios.

#### Criterios de aceptación

- Existen roles iniciales.
- Se pueden consultar usuarios.
- Se pueden asignar roles.
- Solo ADMIN puede gestionar roles.

## Épica 3: Catálogos

### Historia 3.1: Gestión de obras

Como administrador, quiero crear y consultar obras para asociarlas a solicitudes.

#### Criterios de aceptación

- Se pueden listar obras.
- Se puede crear obra.
- Se puede actualizar obra.
- Se puede activar o desactivar obra.

### Historia 3.2: Gestión de proveedores

Como administrador, quiero crear y consultar proveedores para asociarlos a solicitudes.

#### Criterios de aceptación

- Se pueden listar proveedores.
- Se puede crear proveedor.
- Se puede actualizar proveedor.
- Se puede activar o desactivar proveedor.

## Épica 4: Solicitudes de pago

### Historia 4.1: Crear solicitud en borrador

Como solicitante, quiero crear una solicitud de pago en estado borrador.

#### Criterios de aceptación

- Se crea solicitud con estado DRAFT.
- Se valida proveedor.
- Se valida obra.
- Se valida valor bruto.
- Se valida valor neto.
- Se valida que neto sea menor o igual al bruto.

### Historia 4.2: Editar solicitud en borrador

Como solicitante, quiero editar una solicitud mientras esté en borrador.

#### Criterios de aceptación

- Solo se puede editar en estado DRAFT.
- Solo el creador o ADMIN puede editar.
- Se registra fecha de actualización.

### Historia 4.3: Adjuntar soporte

Como solicitante, quiero adjuntar imágenes o documentos a una solicitud.

#### Criterios de aceptación

- Se solicita URL firmada.
- Se sube archivo a Cloud Storage.
- Se confirma adjunto en backend.
- Se guarda metadato del archivo.
- Se valida tipo y tamaño de archivo.

### Historia 4.4: Enviar solicitud

Como solicitante, quiero enviar una solicitud para revisión.

#### Criterios de aceptación

- Solo se puede enviar desde DRAFT.
- Debe tener al menos un soporte.
- Cambia a SUBMITTED.
- Se registra historial de estado.

### Historia 4.5: Listar solicitudes

Como usuario administrativo, quiero consultar solicitudes para hacer seguimiento.

#### Criterios de aceptación

- Lista paginada.
- Filtro por estado.
- Filtro por obra.
- Filtro por proveedor.
- Filtro por fecha.
- Usuarios administrativos pueden ver todas.
- Solicitantes pueden ver propias.

### Historia 4.6: Ver detalle de solicitud

Como usuario, quiero ver el detalle de una solicitud.

#### Criterios de aceptación

- Se muestran datos generales.
- Se muestran soportes.
- Se muestran comentarios.
- Se muestra historial de estados.

## Épica 5: Flujo de aprobación

### Historia 5.1: Tomar solicitud en revisión

Como revisor, quiero tomar una solicitud enviada para revisarla.

#### Criterios de aceptación

- Solo REVISOR o ADMIN puede tomar en revisión.
- Solo solicitudes SUBMITTED.
- Cambia a IN_REVIEW.
- Se registra historial.

### Historia 5.2: Aprobar solicitud

Como aprobador, quiero aprobar una solicitud revisada.

#### Criterios de aceptación

- Solo APROBADOR o ADMIN puede aprobar.
- Solo solicitudes IN_REVIEW.
- Debe tener soporte adjunto.
- Cambia a APPROVED.
- Se registra historial.

### Historia 5.3: Rechazar solicitud

Como revisor o aprobador, quiero rechazar una solicitud con observación.

#### Criterios de aceptación

- Solo REVISOR, APROBADOR o ADMIN puede rechazar.
- La observación es obligatoria.
- Cambia a REJECTED.
- Se registra historial.
- Se guarda comentario.

### Historia 5.4: Programar pago

Como usuario de pagos, quiero programar una solicitud aprobada para pago.

#### Criterios de aceptación

- Solo PAGOS o ADMIN puede programar.
- Solo solicitudes APPROVED.
- Cambia a SCHEDULED_FOR_PAYMENT.
- Puede guardar fecha estimada de pago.
- Se registra historial.

### Historia 5.5: Marcar como pagada

Como usuario de pagos, quiero marcar una solicitud programada como pagada.

#### Criterios de aceptación

- Solo PAGOS o ADMIN puede marcar como pagada.
- Solo solicitudes SCHEDULED_FOR_PAYMENT.
- Cambia a PAID.
- Guarda usuario y fecha de pago.
- Se registra historial.

## Épica 6: Comentarios e historial

### Historia 6.1: Agregar comentario

Como usuario, quiero agregar comentarios a una solicitud.

#### Criterios de aceptación

- Comentario obligatorio.
- Se registra usuario.
- Se registra fecha.
- El comentario aparece en el detalle.

### Historia 6.2: Ver historial de estados

Como usuario, quiero consultar el historial de estados de una solicitud.

#### Criterios de aceptación

- Se muestra estado anterior.
- Se muestra estado nuevo.
- Se muestra usuario.
- Se muestra fecha.
- Se muestra comentario si existe.

## Épica 7: Exportación

### Historia 7.1: Exportar solicitudes a Excel

Como usuario administrativo, quiero exportar solicitudes para análisis y seguimiento.

#### Criterios de aceptación

- Se puede exportar con filtros.
- El archivo incluye datos principales.
- El archivo incluye estado actual.
- El archivo incluye fechas principales.
- El archivo incluye obra y proveedor.
- Solo roles autorizados pueden exportar.

## Épica 8: Auditoría

### Historia 8.1: Registrar auditoría de acciones críticas

Como sistema, quiero registrar acciones críticas para trazabilidad.

#### Criterios de aceptación

- Se registra creación de solicitud.
- Se registra cambio de estado.
- Se registra subida de adjunto.
- Se registra exportación.
- Se registra usuario, acción, entidad y fecha.

## Prioridad sugerida

### Sprint 1

- Setup monorepo.
- Backend base.
- Flutter base.
- Firebase Auth.
- Validación de token.
- Modelo inicial de base de datos.

### Sprint 2

- Usuarios y roles.
- Catálogo de obras.
- Catálogo de proveedores.
- Crear solicitud.
- Editar borrador.

### Sprint 3

- Adjuntos con Cloud Storage.
- Enviar solicitud.
- Listar solicitudes.
- Ver detalle.

### Sprint 4

- Cambios de estado.
- Historial.
- Comentarios.
- Reglas de negocio.

### Sprint 5

- Exportación a Excel.
- Auditoría.
- Hardening.
- Pruebas de flujo completo.
