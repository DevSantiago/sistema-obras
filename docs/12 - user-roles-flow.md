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

Pasos detallados

1. Iniciar sesión

El usuario ingresa a la aplicación móvil y se autentica mediante Firebase Auth.

Resultado esperado:

* El usuario accede a la aplicación.
* El sistema identifica sus roles.
* El backend valida que el usuario esté activo.

2. Acceder al listado de solicitudes

El usuario visualiza sus propias solicitudes.

Debe poder ver:

* Número de solicitud.
* Obra.
* Proveedor.
* Valor.
* Estado.
* Fecha de creación.
* Última actualización.

3. Crear solicitud

El usuario selecciona la opción de crear una nueva solicitud.

Campos requeridos:

* Ítem.
* Proveedor.
* Obra.
* Descripción.
* Valor bruto.
* Valor neto o valor con retención.

Resultado esperado:

* El sistema crea la solicitud en estado Borrador.

4. Adjuntar soporte

El usuario puede:

* Tomar fotografía desde la cámara.
* Seleccionar imagen del dispositivo.
* Adjuntar documento PDF, si la plataforma lo permite.

Reglas:

* La solicitud no puede enviarse sin al menos un soporte.
* El archivo debe cumplir tipo y tamaño permitidos.
* El archivo se almacena en Cloud Storage.
* Los metadatos se guardan en la base de datos.

5. Guardar borrador

El usuario puede guardar la solicitud sin enviarla.

Estado resultante:

DRAFT

Reglas:

* El usuario puede editar la solicitud mientras esté en borrador.
* El usuario puede agregar o eliminar soportes mientras esté en borrador.
* La solicitud no entra al flujo administrativo hasta que sea enviada.

6. Enviar solicitud

El usuario envía la solicitud para revisión.

Validaciones:

* Debe tener proveedor.
* Debe tener obra.
* Debe tener descripción.
* Debe tener valor bruto.
* Debe tener valor neto.
* El valor neto debe ser menor o igual al valor bruto.
* Debe tener al menos un soporte adjunto.

Estado resultante:

SUBMITTED

7. Consultar estado

El usuario puede consultar el estado de sus solicitudes.

Estados visibles:

* Borrador.
* Enviada.
* En revisión.
* Aprobada.
* Rechazada.
* Programada para pago.
* Pagada.

8. Corregir solicitud rechazada

Si una solicitud es rechazada, el usuario puede revisar la observación y corregir la información.

Flujo:

Solicitud Rechazada
   ↓
Usuario revisa observación
   ↓
Edita información o adjunta nuevo soporte
   ↓
Guarda cambios
   ↓
Envía nuevamente

Estado resultante después de corrección:

SUBMITTED

Acciones permitidas:

| Acción | Permitida |
|---|---|
| Crear solicitud | Sí |
| Editar solicitud propia en borrador | Sí |
| Adjuntar soporte en borrador | Sí |
| Enviar solicitud | Sí |
| Ver solicitudes propias | Sí |
| Ver solicitudes de otros usuarios | No |
| Aprobar solicitud | No |
| Rechazar solicitud | No |
| Programar pago | No |
| Marcar como pagada | No |
| Exportar solicitudes | No |

Reglas especiales

* El Solicitante no puede modificar una solicitud enviada.
* El Solicitante no puede cambiar estados administrativos.
* El Solicitante no puede marcar solicitudes como pagadas.
* El Solicitante solo puede ver sus propias solicitudes, salvo que tenga otro rol adicional.

2. Flujo del rol Revisor

Descripción

El Revisor es el usuario encargado de validar las solicitudes enviadas. Revisa la información, verifica los soportes y puede tomar una solicitud en revisión. Según la regla de negocio definida, puede rechazar solicitudes cuando no cumplen con los requisitos.

Plataforma principal

Flutter Web.

Objetivos del Revisor

* Consultar solicitudes enviadas.
* Tomar solicitudes en revisión.
* Revisar información y soportes.
* Agregar comentarios.
* Rechazar solicitudes con observación.
* Dejar solicitudes listas para aprobación.

Flujo principal: revisar solicitud

Inicio de sesión
   ↓
Bandeja de solicitudes enviadas
   ↓
Seleccionar solicitud
   ↓
Tomar en revisión
   ↓
Validar información y soportes
   ↓
Agregar comentario si aplica
   ↓
Rechazar o dejar disponible para aprobación

Pasos detallados

1. Iniciar sesión

El Revisor ingresa a la aplicación web administrativa.

Resultado esperado:

* El sistema identifica el rol Revisor.
* El usuario accede a la bandeja de solicitudes.

2. Consultar bandeja de solicitudes

El Revisor puede ver solicitudes en estado:

* Enviada.
* En revisión.
* Rechazada.
* Aprobada, solo para consulta si el negocio lo permite.

Filtros recomendados:

* Estado.
* Obra.
* Proveedor.
* Fecha.
* Solicitante.
* Valor.

3. Ver detalle de solicitud

El Revisor accede al detalle de una solicitud.

Debe poder ver:

* Datos principales.
* Obra.
* Proveedor.
* Valores.
* Soportes.
* Comentarios.
* Historial de estados.

4. Tomar en revisión

El Revisor cambia la solicitud de Enviada a En revisión.

Transición:

SUBMITTED → IN_REVIEW

Reglas:

* Solo puede ejecutarse si la solicitud está en estado Enviada.
* Debe registrarse quién tomó la solicitud.
* Debe registrarse fecha y hora.
* Debe registrarse historial de estado.

5. Validar información

El Revisor verifica:

* Que el proveedor sea correcto.
* Que la obra corresponda.
* Que el soporte sea legible.
* Que los valores sean coherentes.
* Que la descripción sea suficiente.
* Que el soporte corresponda a la solicitud.

6. Agregar comentarios

El Revisor puede agregar comentarios internos o aclaraciones.

Ejemplos:

* “El soporte es legible y corresponde al proveedor indicado.”
* “Se requiere aclarar el valor neto.”
* “El documento adjunto no corresponde a la obra seleccionada.”

7. Rechazar solicitud

Si la solicitud no cumple, el Revisor puede rechazarla.

Transición:

IN_REVIEW → REJECTED

Reglas:

* La observación es obligatoria.
* Se debe registrar historial.
* Se debe guardar comentario de rechazo.
* El Solicitante debe poder ver la causa del rechazo.

Acciones permitidas

| Acción | Permitida |
|---|---|
| Ver solicitudes enviadas | Sí |
| Ver todas las solicitudes | Sí |
| Tomar solicitud en revisión | Sí |
| Agregar comentarios | Sí |
| Rechazar solicitud | Sí |
| Aprobar solicitud | No, salvo que también tenga rol Aprobador |
| Programar pago | No |
| Marcar como pagada | No |
| Gestionar usuarios | No |

Reglas especiales

* El Revisor no debe modificar valores de la solicitud.
* El Revisor no debe marcar solicitudes como pagadas.
* El Revisor debe rechazar con observación obligatoria.
* El Revisor no debe aprobar si no tiene rol Aprobador.

3. Flujo del rol Aprobador

Descripción

El Aprobador es el usuario responsable de aprobar solicitudes que ya se encuentran en revisión. También puede rechazar solicitudes si identifica inconsistencias.

Plataforma principal

Flutter Web.

Objetivos del Aprobador

* Consultar solicitudes en revisión.
* Revisar información consolidada.
* Validar soportes.
* Aprobar solicitudes.
* Rechazar solicitudes con observación.
* Consultar historial antes de tomar decisión.

Flujo principal: aprobar solicitud

Inicio de sesión
   ↓
Bandeja de solicitudes en revisión
   ↓
Ver detalle
   ↓
Validar información y soportes
   ↓
Aprobar o rechazar
   ↓
Sistema registra cambio de estado

Pasos detallados

1. Consultar solicitudes en revisión

El Aprobador visualiza solicitudes en estado:

IN_REVIEW

También puede consultar solicitudes aprobadas o rechazadas para seguimiento, según permisos del sistema.

2. Ver detalle

Debe poder revisar:

* Datos principales.
* Valores.
* Proveedor.
* Obra.
* Soportes.
* Comentarios del Revisor.
* Historial de estados.

3. Aprobar solicitud

Si la solicitud cumple, el Aprobador ejecuta la acción de aprobar.

Transición:

IN_REVIEW → APPROVED

Reglas:

* La solicitud debe estar en estado En revisión.
* La solicitud debe tener al menos un soporte adjunto.
* El usuario debe tener rol Aprobador o Administrador.
* Debe registrarse usuario aprobador.
* Debe registrarse fecha de aprobación.
* Debe registrarse historial de estado.

4. Rechazar solicitud

Si la solicitud no cumple, el Aprobador puede rechazarla.

Transición:

IN_REVIEW → REJECTED

Reglas:

* La observación es obligatoria.
* Debe registrarse el motivo.
* Debe quedar historial.
* El Solicitante debe poder corregir y reenviar.

Acciones permitidas

| Acción | Permitida |
|---|---|
| Ver solicitudes en revisión | Sí |
| Ver detalle de solicitud | Sí |
| Aprobar solicitud | Sí |
| Rechazar solicitud | Sí |
| Agregar comentarios | Sí |
| Programar pago | No |
| Marcar como pagada | No |
| Gestionar usuarios | No |
| Exportar solicitudes | Sí, si el negocio lo permite |

Reglas especiales

* El Aprobador no debe programar pagos, salvo que tenga rol Pagos.
* El Aprobador no debe modificar información económica durante la aprobación.
* La aprobación debe quedar trazada.
* No se puede aprobar una solicitud sin soporte.

4. Flujo del rol Pagos

Descripción

El rol Pagos corresponde al usuario encargado de gestionar la etapa posterior a la aprobación. Su función es programar solicitudes aprobadas y marcar solicitudes como pagadas.

Plataforma principal

Flutter Web.

Objetivos del rol Pagos

* Consultar solicitudes aprobadas.
* Programar pago.
* Marcar solicitudes como pagadas.
* Exportar información.
* Consultar historial y soportes.

Flujo principal: programar y pagar

Inicio de sesión
   ↓
Bandeja de solicitudes aprobadas
   ↓
Seleccionar solicitud
   ↓
Programar pago
   ↓
Solicitud queda Programada para pago
   ↓
Confirmar pago
   ↓
Solicitud queda Pagada

Pasos detallados

1. Consultar solicitudes aprobadas

El usuario de Pagos consulta solicitudes en estado:

APPROVED

Debe poder filtrar por:

* Obra.
* Proveedor.
* Fecha de aprobación.
* Valor.
* Solicitante.

2. Programar pago

El usuario programa el pago de una solicitud aprobada.

Transición:

APPROVED → SCHEDULED_FOR_PAYMENT

Campos opcionales o requeridos según negocio:

* Fecha programada de pago.
* Observación de pago.
* Referencia interna.
* Cuenta o método, en fases futuras.

Reglas:

* Solo rol Pagos o Administrador.
* Solo solicitudes en estado Aprobada.
* Debe registrarse historial.

3. Marcar como pagada

El usuario confirma que la solicitud fue pagada.

Transición:

SCHEDULED_FOR_PAYMENT → PAID

Reglas:

* Solo rol Pagos o Administrador.
* Solo solicitudes programadas para pago.
* Debe registrarse usuario.
* Debe registrarse fecha de pago.
* Debe registrarse historial.
* La solicitud pagada no debe modificarse.

4. Exportar información

El usuario puede exportar solicitudes para control financiero.

Exportaciones sugeridas:

* Solicitudes aprobadas.
* Solicitudes programadas.
* Solicitudes pagadas.
* Solicitudes por proveedor.
* Solicitudes por obra.
* Solicitudes por rango de fechas.

Acciones permitidas

| Acción | Permitida |
|---|---|
| Ver solicitudes aprobadas | Sí |
| Ver solicitudes programadas | Sí |
| Ver solicitudes pagadas | Sí |
| Programar pago | Sí |
| Marcar como pagada | Sí |
| Exportar solicitudes | Sí |
| Aprobar solicitud | No |
| Rechazar solicitud | No |
| Editar solicitud | No |
| Gestionar usuarios | No |

Reglas especiales

* Solo Pagos puede marcar como pagada.
* Pagos no debe cambiar valores de la solicitud.
* Pagos no debe aprobar solicitudes.
* Una solicitud pagada queda cerrada operativamente.

⸻

5. Flujo del rol Administrador

Descripción

El Administrador tiene permisos amplios sobre el sistema. Su función principal es configurar usuarios, roles, catálogos y supervisar la operación.

Plataforma principal

Flutter Web.

Objetivos del Administrador

* Gestionar usuarios.
* Asignar roles.
* Gestionar obras.
* Gestionar proveedores.
* Consultar todas las solicitudes.
* Intervenir solicitudes cuando sea necesario.
* Consultar auditoría.
* Exportar información.

Flujo principal: administración del sistema

Inicio de sesión
   ↓
Panel administrativo
   ↓
Gestionar usuarios, roles, obras y proveedores
   ↓
Supervisar solicitudes
   ↓
Consultar auditoría
   ↓
Exportar información

Funciones principales

1. Gestión de usuarios

El Administrador puede:

* Crear usuarios internos.
* Activar usuarios.
* Desactivar usuarios.
* Asignar roles.
* Retirar roles.

Reglas:

* No se debe eliminar físicamente un usuario con actividad histórica.
* Si un usuario se retira, debe marcarse como inactivo.
* Los registros históricos deben conservar el usuario asociado.

2. Gestión de obras

El Administrador puede:

* Crear obras.
* Editar obras.
* Activar obras.
* Desactivar obras.

Reglas:

* No se debe eliminar una obra con solicitudes asociadas.
* Una obra inactiva no debe aparecer para nuevas solicitudes.
* Las solicitudes históricas deben conservar la relación con la obra.

3. Gestión de proveedores

El Administrador puede:

* Crear proveedores.
* Editar proveedores.
* Activar proveedores.
* Desactivar proveedores.

Reglas:

* No se debe eliminar un proveedor con solicitudes asociadas.
* Un proveedor inactivo no debe aparecer para nuevas solicitudes.
* Las solicitudes históricas deben conservar la relación con el proveedor.

4. Supervisión de solicitudes

El Administrador puede consultar todas las solicitudes del sistema.

Debe poder filtrar por:

* Estado.
* Obra.
* Proveedor.
* Solicitante.
* Fecha.
* Valor.

5. Intervención excepcional

El Administrador puede ejecutar acciones de flujo cuando sea necesario, respetando reglas mínimas de auditoría.

Ejemplos:

* Anular una solicitud.
* Corregir una asignación.
* Cambiar un estado bajo autorización interna.
* Consultar soporte.
* Exportar información.

Toda intervención excepcional debe quedar registrada en auditoría.

6. Auditoría

El Administrador puede consultar eventos relevantes:

* Creación de solicitudes.
* Cambios de estado.
* Subida de soportes.
* Exportaciones.
* Cambios de roles.
* Cambios en catálogos.

Acciones permitidas

| Acción | Permitida |
|---|---|
| Gestionar usuarios | Sí |
| Gestionar roles | Sí |
| Gestionar obras | Sí |
| Gestionar proveedores | Sí |
| Ver todas las solicitudes | Sí |
| Cambiar estados | Sí |
| Exportar información | Sí |
| Consultar auditoría | Sí |
| Anular solicitudes | Sí |
| Marcar pagada | Sí |

Reglas especiales

* El Administrador no debe usarse como rol operativo principal.
* Las acciones del Administrador deben auditarse con mayor detalle.
* Las intervenciones excepcionales deben requerir comentario obligatorio.
* No se deben eliminar datos históricos.

⸻

6. Flujo transversal de notificaciones

Objetivo

Definir los eventos que pueden generar notificaciones dentro del sistema.

Notificaciones del MVP

En el MVP pueden manejarse como notificaciones internas dentro de la aplicación.

Eventos notificables

| Evento | Usuario notificado |
|---|---|
| Solicitud enviada | Revisor |
| Solicitud tomada en revisión | Solicitante |
| Solicitud aprobada | Solicitante, Pagos |
| Solicitud rechazada | Solicitante |
| Solicitud programada para pago | Solicitante |
| Solicitud pagada | Solicitante |
| Comentario agregado | Usuarios relacionados con la solicitud |
| Notificaciones futuras | Por definir |

En fases posteriores se pueden incorporar:

* Push notifications.
* WhatsApp.
* Notificaciones por vencimiento.
* Recordatorios de revisión.
* Alertas de pagos pendientes.

7. Resumen por rol y estado

| Estado | Solicitante | Revisor | Aprobador | Pagos | Administrador |
|---|---|---|---|---|---|
| DRAFT | Crear, editar, adjuntar, enviar | Consultar si tiene acceso | Consultar si tiene acceso | No aplica | Consultar, editar, anular |
| SUBMITTED | Consultar | Tomar en revisión | Consultar | Consultar | Consultar, tomar, anular |
| IN_REVIEW | Consultar | Revisar, comentar, rechazar | Aprobar, rechazar | Consultar | Aprobar, rechazar, anular |
| APPROVED | Consultar | Consultar | Consultar | Programar pago | Programar, anular excepcional |
| REJECTED | Corregir, reenviar | Consultar | Consultar | No aplica | Consultar, corregir excepcional |
| SCHEDULED_FOR_PAYMENT | Consultar | Consultar | Consultar | Marcar pagada | Marcar pagada |
| PAID | Consultar | Consultar | Consultar | Consultar | Consultar |
| CANCELLED | Consultar | Consultar | Consultar | Consultar | Consultar |

8. Reglas transversales

Reglas de edición

* Solo se puede editar una solicitud en estado Borrador.
* Una solicitud rechazada puede volver a edición.
* Una solicitud aprobada no debe permitir cambios en valores principales.
* Una solicitud pagada no debe permitir edición.

Reglas de soporte

* Una solicitud debe tener al menos un soporte antes de ser enviada.
* Una solicitud debe tener al menos un soporte antes de ser aprobada.
* Los soportes deben conservarse aunque la solicitud sea rechazada.
* Los soportes de solicitudes pagadas no deben eliminarse.

Reglas de comentarios

* El rechazo exige comentario obligatorio.
* Las intervenciones administrativas excepcionales deben exigir comentario.
* Los comentarios deben conservar usuario y fecha.
* Los comentarios no deben eliminarse físicamente.

Reglas de historial

Todo cambio de estado debe registrar:

* Estado anterior.
* Estado nuevo.
* Usuario.
* Fecha.
* Comentario, cuando aplique.

Reglas de auditoría

Deben auditarse:

* Login, opcional según alcance técnico.
* Creación de solicitud.
* Actualización de solicitud.
* Subida de soporte.
* Cambio de estado.
* Rechazo.
* Aprobación.
* Programación de pago.
* Pago.
* Exportación.
* Cambio de roles.
* Cambios de catálogos.