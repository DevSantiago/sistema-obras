# 11. Backlog inicial del MVP

## Objetivo

Definir el backlog inicial completo para construir el MVP del sistema de gestión de solicitudes de pago para una empresa de obras civiles.

Este backlog integra todos los módulos definidos hasta el momento:

- Aplicación Web responsiva.
- Autenticación con Firebase Auth.
- Usuarios y roles.
- Obras/proyectos.
- Proveedores.
- Solicitudes de pago.
- Adjuntos y soportes.
- Doble aprobación.
- Programación de pagos.
- Marcación como pagada.
- Comentarios.
- Historial de estados.
- Auditoría.
- Exportación a Excel.
- Fondos de obra.
- Préstamos de persona a obra.
- Préstamos entre obras.
- Anticipos de obra.
- Devoluciones de préstamos.
- Movimientos financieros de obra.

---

# 1. Alcance del MVP

## Incluido en el MVP

- Login.
- Aplicación Web responsiva.
- Gestión básica de usuarios.
- Gestión de roles.
- Gestión de obras/proyectos.
- Gestión de proveedores.
- Crear solicitud de pago.
- Editar solicitud en borrador.
- Adjuntar soportes.
- Enviar solicitud.
- Consultar solicitudes.
- Ver detalle de solicitud.
- Flujo de doble aprobación.
- Devolución al Solicitante.
- Devolución del Aprobador 2 al Aprobador 1.
- Programación de pago.
- Marcación como pagada.
- Roles y permisos básicos.
- Exportación a Excel.
- Historial de estados.
- Comentarios.
- Auditoría básica.
- Cuenta de fondos por obra.
- Registro de anticipos de obra.
- Registro de préstamos de persona a obra.
- Registro de préstamos entre obras.
- Registro de devolución de préstamos.
- Consulta de movimientos financieros por obra.
- Consulta de préstamos pendientes.

## Fuera del MVP

- OCR avanzado automático.
- Integraciones ERP.
- Firma digital.
- Offline avanzado.
- Automatizaciones complejas.
- Aprobaciones dinámicas por monto.
- Aprobaciones multinivel configurables.
- Conciliación bancaria.
- Notificaciones push avanzadas.
- Aplicación móvil nativa.
- Publicación en Play Store.
- Publicación en App Store.
- Contabilidad completa.
- Cuentas bancarias reales.
- Intereses de préstamos.
- Amortizaciones complejas.
- Comprobantes contables automáticos.

---

# 2. Roles del MVP

| Rol técnico | Nombre visible |
|---|---|
| `ADMIN` | Administrador |
| `PETITIONER` | Solicitante |
| `ACCOUNTING_ASSISTANT` | Auxiliar contable |
| `APPROVER_LEVEL_1` | Aprobador 1 |
| `APPROVER_LEVEL_2` | Aprobador 2 |
| `PAYMENTS` | Pagos |

---

# 3. Estados del MVP

## Estados de solicitud

```text
DRAFT
PENDING_FIRST_APPROVAL
PENDING_SECOND_APPROVAL
RETURNED_TO_FIRST_APPROVER
REJECTED
APPROVED
SCHEDULED_FOR_PAYMENT
PAID
CANCELLED
```

## Estados de préstamo

```text
PENDING
PARTIALLY_PAID
PAID
CANCELLED
```

---

# 4. Épica 1: Configuración base del proyecto

## Historia 1.1: Crear monorepo

Como equipo técnico, quiero tener un repositorio organizado para Aplicación Web, backend, documentación e infraestructura.

### Criterios de aceptación

- Existe estructura base del monorepo.
- Existe carpeta para Aplicación Web.
- Existe carpeta para backend.
- Existe carpeta `docs`.
- Existe carpeta `infra`.
- Existe archivo `README.md`.
- Existe archivo `.gitignore`.
- Existe estructura base para variables de entorno.
- Existe documentación inicial para instalación local.

## Historia 1.2: Crear backend base

Como equipo técnico, quiero tener un backend inicial desplegable para construir las APIs del sistema.

### Criterios de aceptación

- Proyecto backend creado.
- Endpoint health check disponible.
- Dockerfile creado.
- Variables de entorno configuradas.
- Servicio preparado para Cloud Run.
- Configuración inicial de CORS.
- Configuración inicial de logs.
- Estructura modular inicial creada.

## Historia 1.3: Crear Aplicación Web base

Como equipo técnico, quiero tener una Aplicación Web base para construir las interfaces del sistema.

### Criterios de aceptación

- Proyecto frontend web creado.
- Framework web definido.
- Configuración base de rutas.
- Layout responsivo inicial.
- Cliente HTTP base configurado.
- Configuración inicial de Firebase Auth.
- Variables públicas del frontend configuradas por ambiente.
- No existen secretos expuestos en frontend.

## Historia 1.4: Configurar ambientes

Como equipo técnico, quiero separar los ambientes del sistema para reducir riesgos.

### Criterios de aceptación

- Existe ambiente `dev`.
- Existe ambiente `staging`.
- Existe ambiente `production`.
- Cada ambiente tiene variables separadas.
- Cada ambiente puede apuntar a backend, base de datos y bucket independiente.
- CORS se configura por ambiente.

---

# 5. Épica 2: Autenticación, usuarios y roles

## Historia 2.1: Login con Firebase Auth

Como usuario, quiero iniciar sesión para acceder al sistema.

### Criterios de aceptación

- El usuario puede iniciar sesión desde la Aplicación Web.
- Se obtiene ID Token de Firebase.
- El token se envía al backend.
- Se muestra error si el login falla.
- Se muestra mensaje si el usuario no está activo.
- No se almacenan secretos en la Aplicación Web.

## Historia 2.2: Validación de token en backend

Como sistema, quiero validar el token de Firebase para identificar al usuario autenticado.

### Criterios de aceptación

- Backend valida ID Token.
- Backend rechaza requests sin token.
- Backend rechaza tokens inválidos.
- Backend resuelve usuario interno mediante `firebase_uid`.
- Backend rechaza usuarios inactivos.
- Backend no confía en roles enviados desde frontend.

## Historia 2.3: Endpoint de perfil

Como usuario autenticado, quiero consultar mi perfil y roles.

### Criterios de aceptación

- Existe endpoint `/me`.
- Devuelve datos del usuario.
- Devuelve roles asignados.
- Devuelve únicamente roles obtenidos desde la base de datos.
- El frontend usa esta información para mostrar u ocultar navegación.

## Historia 2.4: Gestión básica de usuarios

Como Administrador, quiero gestionar usuarios del sistema.

### Criterios de aceptación

- Se pueden listar usuarios.
- Se puede crear usuario interno.
- Se puede activar usuario.
- Se puede desactivar usuario.
- Se puede consultar detalle de usuario.
- Solo `ADMIN` puede gestionar usuarios.

## Historia 2.5: Gestión de roles

Como Administrador, quiero asignar o retirar roles de usuarios.

### Criterios de aceptación

- Existen roles iniciales.
- Se pueden asignar roles.
- Se pueden retirar roles.
- Un usuario puede tener más de un rol.
- Solo `ADMIN` puede gestionar roles.
- Los roles válidos son `ADMIN`, `SOLICITANTE`, `ACCOUNTING_ASSISTANT`, `APPROVER_LEVEL_1`, `APPROVER_LEVEL_2` y `PAGOS`.

---

# 6. Épica 3: Catálogos

## Historia 3.1: Gestión de obras/proyectos

Como Administrador, quiero crear y consultar obras para asociarlas a solicitudes y cuentas de fondos.

### Criterios de aceptación

- Se pueden listar obras.
- Se puede crear obra.
- Se puede actualizar obra.
- Se puede activar o desactivar obra.
- Una obra inactiva no aparece para nuevas solicitudes.
- Una obra inactiva no permite nuevos movimientos financieros operativos.
- No se elimina físicamente una obra con solicitudes o movimientos asociados.

## Historia 3.2: Crear cuenta de fondos al crear obra

Como sistema, quiero crear una cuenta de fondos para cada obra nueva.

### Criterios de aceptación

- Al crear una obra, se crea una cuenta en `project_funds`.
- El saldo inicial de la cuenta es cero.
- La cuenta queda asociada a la obra.
- No puede existir más de una cuenta de fondos por obra.
- Se registra auditoría de creación.

## Historia 3.3: Gestión de proveedores

Como Administrador, quiero crear y consultar proveedores para asociarlos a solicitudes.

### Criterios de aceptación

- Se pueden listar proveedores.
- Se puede crear proveedor.
- Se puede actualizar proveedor.
- Se puede activar o desactivar proveedor.
- Un proveedor inactivo no aparece para nuevas solicitudes.
- No se elimina físicamente un proveedor con solicitudes asociadas.

## Historia 3.4: Gestión de prestamistas

Como Auxiliar contable, quiero registrar personas o terceros que prestan dinero a las obras.

### Criterios de aceptación

- Se pueden listar prestamistas.
- Se puede crear prestamista.
- Se puede actualizar prestamista.
- Se puede consultar detalle de prestamista.
- El prestamista puede tener nombre, documento, teléfono, correo y observaciones.
- Se evita duplicidad básica por documento, cuando aplique.

---

# 7. Épica 4: Fondos de obra

## Historia 4.1: Consultar fondos de obra

Como Auxiliar contable, quiero consultar la cuenta de fondos de una obra.

### Criterios de aceptación

- Se muestra obra.
- Se muestra saldo actual.
- Se muestran ingresos.
- Se muestran egresos.
- Se muestran préstamos pendientes.
- Se muestran movimientos recientes.
- Se puede filtrar por fecha.
- Se puede filtrar por tipo de movimiento.

## Historia 4.2: Registrar anticipo de obra

Como Auxiliar contable, quiero registrar un anticipo recibido por ejecución de obra.

### Criterios de aceptación

- Solo `ACCOUNTING_ASSISTANT` o `ADMIN` puede registrar anticipos.
- Se selecciona la obra.
- Se registra valor, fecha, referencia y descripción.
- El sistema aumenta el saldo de la obra.
- Se registra movimiento `INCOME_ADVANCE`.
- Se registra auditoría.
- No permite valores menores o iguales a cero.

## Historia 4.3: Registrar préstamo de persona a obra

Como Auxiliar contable, quiero registrar dinero prestado por una persona o tercero a una obra.

### Criterios de aceptación

- Solo `ACCOUNTING_ASSISTANT` o `ADMIN`.
- Se selecciona la obra deudora.
- Se selecciona o crea prestamista.
- Se registra valor, fecha, referencia y descripción.
- El sistema aumenta el saldo de la obra.
- Se crea préstamo `PERSON_TO_PROJECT`.
- El préstamo queda en estado `PENDING`.
- Se registra movimiento `INCOME_LOAN_PERSON`.
- Se registra auditoría.

## Historia 4.4: Registrar préstamo entre obras

Como Auxiliar contable, quiero registrar que una obra le presta dinero a otra obra.

### Criterios de aceptación

- Solo `ACCOUNTING_ASSISTANT` o `ADMIN`.
- Se selecciona obra que presta.
- Se selecciona obra que recibe.
- La obra que presta y la obra que recibe no pueden ser la misma.
- Se registra valor, fecha, referencia y descripción.
- El sistema valida saldo suficiente en la obra que presta.
- El sistema disminuye saldo de la obra que presta.
- El sistema aumenta saldo de la obra que recibe.
- Se crea préstamo `PROJECT_TO_PROJECT`.
- Se registra movimiento `EXPENSE_LOAN_TO_PROJECT` en la obra que presta.
- Se registra movimiento `INCOME_LOAN_PROJECT` en la obra que recibe.
- Todo ocurre en una sola transacción.
- Se registra auditoría.

## Historia 4.5: Registrar devolución de préstamo a persona

Como Auxiliar contable, quiero registrar la devolución de dinero prestado por una persona.

### Criterios de aceptación

- Solo `ACCOUNTING_ASSISTANT` o `ADMIN`.
- Se selecciona préstamo pendiente.
- El préstamo debe ser `PERSON_TO_PROJECT`.
- Se registra valor devuelto, fecha, referencia y descripción.
- El valor no puede superar el saldo pendiente.
- El sistema valida saldo suficiente en la obra deudora.
- El sistema disminuye saldo de la obra.
- Se registra movimiento `EXPENSE_LOAN_REPAYMENT`.
- Se actualiza `outstanding_amount`.
- Si el saldo pendiente queda en cero, el préstamo queda `PAID`.
- Si queda saldo pendiente, el préstamo queda `PARTIALLY_PAID`.
- Se registra auditoría.

## Historia 4.6: Registrar devolución de préstamo entre obras

Como Auxiliar contable, quiero registrar la devolución de un préstamo entre obras.

### Criterios de aceptación

- Solo `ACCOUNTING_ASSISTANT` o `ADMIN`.
- Se selecciona préstamo pendiente.
- El préstamo debe ser `PROJECT_TO_PROJECT`.
- Se registra valor devuelto, fecha, referencia y descripción.
- El valor no puede superar el saldo pendiente.
- El sistema valida saldo suficiente en la obra deudora.
- El sistema disminuye saldo de la obra deudora.
- El sistema aumenta saldo de la obra prestamista.
- Se registra movimiento `EXPENSE_LOAN_REPAYMENT` en la obra deudora.
- Se registra movimiento `INCOME_LOAN_REPAYMENT` en la obra prestamista.
- Se actualiza `outstanding_amount`.
- Se actualiza estado del préstamo.
- Todo ocurre en una sola transacción.
- Se registra auditoría.

## Historia 4.7: Registrar ajuste positivo de fondos

Como Auxiliar contable, quiero registrar un ajuste positivo autorizado.

### Criterios de aceptación

- Solo `ACCOUNTING_ASSISTANT` o `ADMIN`.
- Se selecciona obra.
- Se registra valor, referencia y comentario obligatorio.
- El sistema aumenta saldo de la obra.
- Se registra movimiento `ADJUSTMENT_INCOME`.
- Se registra auditoría.

## Historia 4.8: Registrar ajuste negativo de fondos

Como Auxiliar contable, quiero registrar un ajuste negativo autorizado.

### Criterios de aceptación

- Solo `ACCOUNTING_ASSISTANT` o `ADMIN`.
- Se selecciona obra.
- Se registra valor, referencia y comentario obligatorio.
- El sistema valida saldo suficiente.
- El sistema disminuye saldo de la obra.
- Se registra movimiento `ADJUSTMENT_EXPENSE`.
- Se registra auditoría.

## Historia 4.9: Consultar movimientos financieros

Como usuario autorizado, quiero consultar movimientos financieros de una obra.

### Criterios de aceptación

- Se listan movimientos paginados.
- Se puede filtrar por obra.
- Se puede filtrar por tipo.
- Se puede filtrar por dirección.
- Se puede filtrar por fecha.
- Se muestra saldo anterior.
- Se muestra saldo nuevo.
- Se muestra usuario que registró el movimiento.
- Se muestra referencia y descripción.

## Historia 4.10: Consultar préstamos pendientes

Como Auxiliar contable, quiero consultar préstamos pendientes para controlar devoluciones.

### Criterios de aceptación

- Se listan préstamos.
- Se puede filtrar por obra deudora.
- Se puede filtrar por obra prestamista.
- Se puede filtrar por prestamista.
- Se puede filtrar por estado.
- Se puede filtrar por tipo de préstamo.
- Se muestra valor inicial.
- Se muestra saldo pendiente.
- Se muestra estado.

---

# 8. Épica 5: Solicitudes de pago

## Historia 5.1: Crear solicitud en borrador

Como Solicitante o Auxiliar contable, quiero crear una solicitud de pago en estado borrador.

### Criterios de aceptación

- Se crea solicitud con estado `DRAFT`.
- Se selecciona obra/proyecto.
- Se selecciona proveedor.
- Se registra ítem, descripción, valor bruto y valor neto.
- Se valida que el valor neto sea menor o igual al valor bruto.
- Se registra usuario creador.
- Se registra fecha de creación.
- Se registra auditoría.
- No se genera egreso financiero en estado borrador.

## Historia 5.2: Editar solicitud en borrador

Como creador, quiero editar una solicitud mientras esté en borrador.

### Criterios de aceptación

- Solo se puede editar en estado `DRAFT`.
- Solo el creador o `ADMIN` puede editar.
- Se actualiza fecha de modificación.
- Se valida nuevamente valor neto menor o igual a valor bruto.
- No se pueden editar solicitudes aprobadas, programadas o pagadas.

## Historia 5.3: Adjuntar soporte

Como creador, quiero adjuntar soportes a una solicitud.

### Criterios de aceptación

- Se solicita URL firmada al backend.
- Se sube archivo a Cloud Storage.
- Se confirma adjunto en backend.
- Se guarda metadato del archivo.
- Se valida tipo de archivo.
- Se valida tamaño de archivo.
- Se registra usuario que subió el archivo.
- Se registra auditoría de subida.
- El bucket no es público.

## Historia 5.4: Enviar solicitud

Como creador, quiero enviar una solicitud para revisión de Aprobador 1.

### Criterios de aceptación

- Solo se puede enviar desde `DRAFT`.
- Solo el creador o `ADMIN` puede enviar.
- Debe tener al menos un soporte.
- Debe tener proveedor, obra, descripción y valores.
- El sistema identifica la cuenta de fondos de la obra.
- El sistema valida fondos suficientes si se maneja reserva desde envío.
- Cambia a `PENDING_FIRST_APPROVAL`.
- Se registra `submitted_at`.
- Se registra historial con `action = SUBMIT`.
- Se registra auditoría.
- Si se maneja reserva, se registra `RESERVE_PAYMENT_REQUEST`.

## Historia 5.5: Listar solicitudes

Como usuario autorizado, quiero consultar solicitudes para hacer seguimiento.

### Criterios de aceptación

- Lista paginada.
- Filtro por estado.
- Filtro por obra.
- Filtro por proveedor.
- Filtro por fecha.
- Filtro por solicitante.
- `SOLICITANTE` ve sus propias solicitudes.
- `ACCOUNTING_ASSISTANT` ve sus propias solicitudes y, si el negocio lo permite, solicitudes relacionadas con fondos.
- `APPROVER_LEVEL_1` ve solicitudes en `PENDING_FIRST_APPROVAL` y `RETURNED_TO_FIRST_APPROVER`.
- `APPROVER_LEVEL_2` ve solicitudes en `PENDING_SECOND_APPROVAL`.
- `PAGOS` ve solicitudes en `APPROVED`, `SCHEDULED_FOR_PAYMENT` y `PAID`.
- `ADMIN` ve todas.

## Historia 5.6: Ver detalle de solicitud

Como usuario autorizado, quiero ver el detalle de una solicitud.

### Criterios de aceptación

- Se muestran datos generales.
- Se muestra obra.
- Se muestra proveedor.
- Se muestran valores.
- Se muestran soportes.
- Se muestran comentarios.
- Se muestra historial de estados.
- Se muestran usuarios relacionados con creación, aprobación y pago.
- Se muestran fechas principales.
- Se muestra información financiera relacionada, cuando aplique.

## Historia 5.7: Corregir solicitud devuelta

Como creador, quiero corregir una solicitud devuelta.

### Criterios de aceptación

- Solo aplica para solicitudes en `REJECTED`.
- Solo el creador o `ADMIN` puede corregir.
- La solicitud puede volver a editarse.
- La observación de devolución se conserva.
- Al guardar corrección, la solicitud puede quedar en `DRAFT`.
- Al reenviar, cambia nuevamente a `PENDING_FIRST_APPROVAL`.

---

# 9. Épica 6: Flujo de doble aprobación

## Historia 6.1: Aprobar en primer nivel

Como Aprobador 1, quiero aprobar una solicitud para segunda validación.

### Criterios de aceptación

- Solo `APPROVER_LEVEL_1` o `ADMIN`.
- Solo aplica a `PENDING_FIRST_APPROVAL`.
- La solicitud debe tener soporte.
- Cambia a `PENDING_SECOND_APPROVAL`.
- Guarda `first_approved_by`.
- Guarda `first_approved_at`.
- Registra `FIRST_APPROVE`.
- Registra auditoría.

## Historia 6.2: Devolver al Solicitante desde primer nivel

Como Aprobador 1, quiero devolver una solicitud al Solicitante.

### Criterios de aceptación

- Solo `APPROVER_LEVEL_1` o `ADMIN`.
- Solo aplica a `PENDING_FIRST_APPROVAL`.
- Observación obligatoria.
- Cambia a `REJECTED`.
- Registra `FIRST_REJECT`.
- Si existía reserva, se libera.
- Registra auditoría.

## Historia 6.3: Aprobar en segundo nivel

Como Aprobador 2, quiero aprobar definitivamente una solicitud.

### Criterios de aceptación

- Solo `APPROVER_LEVEL_2` o `ADMIN`.
- Solo aplica a `PENDING_SECOND_APPROVAL`.
- Cambia a `APPROVED`.
- Guarda `second_approved_by`.
- Guarda `second_approved_at`.
- Registra `SECOND_APPROVE`.
- La solicitud queda disponible para Pagos.

## Historia 6.4: Devolver al Aprobador 1

Como Aprobador 2, quiero devolver una solicitud al Aprobador 1.

### Criterios de aceptación

- Solo `APPROVER_LEVEL_2` o `ADMIN`.
- Solo aplica a `PENDING_SECOND_APPROVAL`.
- Observación obligatoria.
- Cambia a `RETURNED_TO_FIRST_APPROVER`.
- Registra `RETURN_TO_FIRST_APPROVER`.
- La solicitud vuelve a la bandeja del Aprobador 1.

## Historia 6.5: Reenviar a segundo nivel

Como Aprobador 1, quiero reenviar al Aprobador 2 una solicitud devuelta.

### Criterios de aceptación

- Solo `APPROVER_LEVEL_1` o `ADMIN`.
- Solo aplica a `RETURNED_TO_FIRST_APPROVER`.
- Cambia a `PENDING_SECOND_APPROVAL`.
- Registra `RESUBMIT_TO_SECOND_APPROVER`.

## Historia 6.6: Devolver al Solicitante después de revisión de segundo nivel

Como Aprobador 1, quiero devolver al Solicitante una solicitud observada por Aprobador 2.

### Criterios de aceptación

- Solo `APPROVER_LEVEL_1` o `ADMIN`.
- Solo aplica a `RETURNED_TO_FIRST_APPROVER`.
- Observación obligatoria.
- Cambia a `REJECTED`.
- Registra `REJECT_AFTER_SECOND_REVIEW`.
- Si existía reserva, se libera.

---

# 10. Épica 7: Pagos

## Historia 7.1: Programar pago

Como usuario de Pagos, quiero programar una solicitud aprobada para pago.

### Criterios de aceptación

- Solo `PAGOS` o `ADMIN`.
- Solo aplica a solicitudes en `APPROVED`.
- Cambia a `SCHEDULED_FOR_PAYMENT`.
- Guarda fecha estimada o programada de pago.
- Registra `SCHEDULE_PAYMENT`.
- Registra auditoría.

## Historia 7.2: Marcar como pagada

Como usuario de Pagos, quiero marcar una solicitud programada como pagada.

### Criterios de aceptación

- Solo `PAGOS` o `ADMIN`.
- Solo aplica a `SCHEDULED_FOR_PAYMENT`.
- Cambia a `PAID`.
- Guarda usuario de pago.
- Guarda fecha de pago.
- Confirma egreso de fondos de la obra.
- Registra movimiento `EXPENSE_PAYMENT_REQUEST`.
- Registra `MARK_AS_PAID`.
- Registra auditoría.
- Una solicitud pagada no puede editarse.

---

# 11. Épica 8: Comentarios e historial

## Historia 8.1: Agregar comentario

Como usuario autorizado, quiero agregar comentarios a una solicitud.

### Criterios de aceptación

- Comentario obligatorio.
- Se registra usuario.
- Se registra fecha.
- El comentario aparece en el detalle.
- El comentario no necesariamente cambia estado.
- Los comentarios de cambio de estado se registran en `status_history`.

## Historia 8.2: Ver historial de estados

Como usuario autorizado, quiero consultar el historial de estados.

### Criterios de aceptación

- Se muestra estado anterior.
- Se muestra estado nuevo.
- Se muestra acción.
- Se muestra usuario.
- Se muestra fecha.
- Se muestra comentario si existe.
- El historial no se puede eliminar desde la Aplicación Web.

---

# 12. Épica 9: Exportación

## Historia 9.1: Exportar solicitudes a Excel

Como usuario autorizado, quiero exportar solicitudes.

### Criterios de aceptación

- Se puede exportar con filtros.
- Incluye datos principales.
- Incluye estado actual.
- Incluye fechas principales.
- Incluye obra y proveedor.
- Incluye solicitante.
- Incluye responsables de aprobación y pago.
- Solo roles autorizados pueden exportar.

## Historia 9.2: Exportar fondos y movimientos

Como Auxiliar contable, Pagos o Administrador, quiero exportar información financiera de obras.

### Criterios de aceptación

- Se exportan fondos por obra.
- Se exportan movimientos financieros.
- Se exportan préstamos.
- Se puede filtrar por obra.
- Se puede filtrar por fecha.
- Se puede filtrar por tipo de movimiento.
- Se puede filtrar por estado del préstamo.

---

# 13. Épica 10: Auditoría

## Historia 10.1: Registrar auditoría de acciones críticas

Como sistema, quiero registrar acciones críticas para trazabilidad.

### Criterios de aceptación

Se auditan como mínimo:

- Crear solicitud.
- Actualizar solicitud.
- Enviar solicitud.
- Aprobar en primer nivel.
- Devolver al Solicitante.
- Aprobar en segundo nivel.
- Devolver al Aprobador 1.
- Reenviar al Aprobador 2.
- Programar pago.
- Marcar como pagada.
- Crear obra.
- Crear proveedor.
- Crear usuario.
- Cambiar roles.
- Subir adjunto.
- Descargar adjunto.
- Exportar.
- Registrar anticipo.
- Registrar préstamo de persona.
- Registrar préstamo entre obras.
- Registrar devolución de préstamo.
- Registrar ajuste financiero.

## Historia 10.2: Ver auditoría

Como Administrador, quiero consultar eventos auditados.

### Criterios de aceptación

- Lista paginada.
- Filtro por usuario.
- Filtro por acción.
- Filtro por entidad.
- Filtro por fecha.
- Muestra datos anteriores y nuevos cuando aplique.

---

# 14. Épica 11: Hardening del MVP

## Historia 11.1: Validaciones de seguridad básicas

Como sistema, quiero aplicar validaciones básicas de seguridad.

### Criterios de aceptación

- CORS configurado.
- Tokens validados en backend.
- Roles validados en backend.
- Estados validados en backend.
- Buckets privados.
- URLs firmadas para archivos.
- Errores controlados.
- No se exponen secretos en frontend.
- No se confían cálculos financieros del frontend.

## Historia 11.2: Pruebas de flujo completo

Como equipo técnico, quiero validar los flujos principales.

### Criterios de aceptación

- Flujo de creación a envío probado.
- Flujo de Aprobador 1 probado.
- Flujo de Aprobador 2 probado.
- Flujo de devolución probado.
- Flujo de Pagos probado.
- Flujo de préstamo de persona probado.
- Flujo de anticipo probado.
- Flujo de préstamo entre obras probado.
- Flujo de devolución de préstamo probado.
- Exportación probada.
- Historial validado.
- Auditoría validada.

---

# 15. Priorización sugerida por sprints

## Sprint 1

- Setup monorepo.
- Backend base.
- Aplicación Web base.
- Firebase Auth.
- Validación de token.
- Modelo inicial de base de datos.
- Roles iniciales.
- Configuración de ambientes.

## Sprint 2

- Usuarios y roles.
- Catálogo de obras.
- Catálogo de proveedores.
- Cuenta de fondos por obra.
- Crear solicitud.
- Editar borrador.
- Adjuntar soportes.

## Sprint 3

- Enviar solicitud.
- Bandeja de Aprobador 1.
- Aprobar primer nivel.
- Devolver al Solicitante.
- Listar solicitudes.
- Ver detalle.
- Historial de estados.

## Sprint 4

- Bandeja de Aprobador 2.
- Aprobar segundo nivel.
- Devolver al Aprobador 1.
- Reenviar a segundo nivel.
- Programar pago.
- Marcar como pagada.

## Sprint 5

- Registrar anticipo.
- Registrar préstamo de persona.
- Registrar préstamo entre obras.
- Consultar fondos de obra.
- Consultar movimientos.
- Consultar préstamos pendientes.

## Sprint 6

- Registrar devolución de préstamo.
- Registrar ajustes financieros.
- Exportación de solicitudes.
- Exportación de fondos.
- Auditoría.
- Hardening.
- Pruebas de flujo completo.
