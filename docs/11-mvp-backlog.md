# 11. Backlog MVP

## Objetivo

Definir el backlog del MVP para el sistema de gestión de solicitudes de pago, fondos por centro de costo, aprobaciones, pagos, beneficiarios, nómina, reembolsos, préstamos, anticipos, cargos financieros, operaciones de efectivo, impuestos, retenciones, auditoría, exportaciones y OCR futuro.

Este backlog debe servir como base para planear desarrollo, estimar alcance, priorizar entregas y validar que las decisiones funcionales, técnicas y de negocio queden cubiertas. La ejecución del backlog se realizará por módulos funcionales, procurando cerrar primero el backend del módulo, validarlo mediante pruebas técnicas, y posteriormente construir e integrar el frontend correspondiente antes de avanzar al siguiente módulo principal.

## Convenciones

### Prioridad

| Prioridad | Significado |
|---|---|
| `MUST` | Obligatorio para el MVP |
| `SHOULD` | Deseable para el MVP si no compromete el alcance |
| `COULD` | Puede quedar para una iteración posterior |
| `WONT` | Fuera del MVP |

### Estados sugeridos de historia

```text
PENDIENTE
EN_ANALISIS
LISTA_DESARROLLO
EN_DESARROLLO
EN_PRUEBAS
APROBADA
BLOQUEADA
DESCARTADA
```

### Dinámica de entrega por módulo

El desarrollo del MVP se organizará por módulos funcionales completos. Para cada módulo se deberá ejecutar la siguiente secuencia:

```text
1. Diseño funcional mínimo del módulo
2. Backend del módulo
3. Pruebas técnicas del backend
4. Frontend del módulo
5. Integración frontend-backend
6. Validación funcional en navegador
7. Cierre del entregable del módulo
```

El backend de un módulo se considera listo cuando existen endpoints, services, repositories, validaciones, permisos, migraciones o seeds cuando apliquen, y pruebas verificables mediante `curl`, cliente HTTP o pruebas equivalentes.

El frontend de un módulo se considera listo cuando existen pantallas, formularios, navegación, manejo de estados de carga y error, consumo real de endpoints, validaciones visibles para el usuario y validación funcional en navegador.

Como regla de planificación, no se debe avanzar al siguiente módulo funcional principal sin contar con un entregable mínimo integrado del módulo anterior, salvo que exista una dependencia técnica que obligue a preparar una base común. Las funcionalidades transversales, como auditoría, seguridad y exportación, podrán implementarse por iteraciones, integrándose progresivamente a los módulos ya construidos.

### Estados sugeridos por fase de entrega

Los estados generales anteriores se conservan. Para seguimiento más fino, cada historia o módulo podrá indicar la fase específica de ejecución:

```text
PENDIENTE_BACKEND
EN_DESARROLLO_BACKEND
BACKEND_EN_PRUEBAS
BACKEND_APROBADO
PENDIENTE_FRONTEND
EN_DESARROLLO_FRONTEND
FRONTEND_EN_PRUEBAS
FRONTEND_APROBADO
INTEGRADA
```

### Formato de historia

```text
Como [rol],
quiero [capacidad],
para [beneficio].
```

Cada historia debe tener criterios de aceptación verificables. Cuando una historia tenga impacto en interfaz de usuario, los criterios deberán cubrir tanto la validación backend como la validación frontend integrada.

---

## Resumen de épicas

| No. | Épica | Prioridad | Resultado esperado |
|---:|---|---|---|
| 0 | Diseño UX/UI y prototipado | MUST | Wireframes funcionales validados por módulo antes de construir frontend |
| 1 | Configuración base del proyecto | MUST | Proyecto técnico inicial listo para backend y frontend |
| 2 | Autenticación, usuarios y roles | MUST | Acceso seguro, gestión de usuarios y pantallas iniciales integradas |
| 3 | Centros de costo y variantes | MUST | Administración de centros, proyecto, obra e interventoría con API y frontend operativo |
| 4 | Beneficiarios | MUST | Registro de personas o entidades que reciben pagos con backend y pantallas de gestión |
| 5 | Secuencias y referencias internas | MUST | Consecutivos y trazabilidad documental integrados a los módulos que los consumen |
| 6 | Fondos y movimientos financieros | MUST | Saldo único por centro de costo y movimientos trazables con vista financiera |
| 7 | Préstamos, anticipos y devoluciones | MUST | Manejo financiero de entradas y salidas con formularios y consultas integradas |
| 8 | Solicitudes de pago | MUST | Creación y gestión de solicitudes con backend y flujo frontend funcional |
| 9 | Adjuntos y soportes | MUST | Carga y consulta de documentos soporte integrada a las pantallas operativas |
| 10 | Aprobaciones | MUST | Flujo de doble aprobación con bandejas y acciones frontend integradas |
| 11 | Pagos | MUST | Marcación de solicitudes pagadas con bandeja operativa y backend transaccional |
| 12 | Operaciones de efectivo | MUST | Control de retiros, pagos en efectivo y sobrantes con pantallas de seguimiento |
| 13 | Cargos financieros | MUST | Registro de costos bancarios y financieros con formulario y consulta integrada |
| 14 | Impuestos y retenciones | MUST | Desglose tributario de solicitudes y registros asociados visibles en frontend |
| 15 | Auditoría | MUST | Trazabilidad de acciones sensibles con consulta básica por filtros |
| 16 | Exportación | SHOULD | Exportación de información operativa y financiera desde vistas integradas |
| 17 | Seguridad y hardening | MUST | Validaciones, permisos y protección básica aplicadas en backend y frontend |
| 18 | OCR futuro | COULD | Base para procesamiento posterior de soportes con validación humana futura |

## Criterio transversal de entrega incremental

Para las épicas funcionales del MVP, el avance se planeará como entregables verticales. Cada módulo deberá tener backend probado y frontend integrado en una versión mínima antes de pasar al siguiente módulo funcional principal. Esta regla aplica especialmente a autenticación, usuarios, centros de costo, beneficiarios, solicitudes, aprobaciones, pagos y financiero.

---

# Épica 0. Diseño UX/UI y prototipado

## Objetivo

Diseñar las pantallas necesarias para validar la operación del MVP sin priorizar detalle visual fino. El diseño UX/UI se ejecutará de forma progresiva por módulo, de manera que cada backend construido tenga posteriormente una interfaz mínima funcional para su validación.

## Criterios de aceptación de la épica

- Existen wireframes para módulos principales.
- Los wireframes se organizan por módulo funcional y sirven como insumo inmediato del frontend posterior al backend.
- Los wireframes cubren los flujos de solicitud, aprobación, pago, financiero y administración.
- Los nombres visibles son consistentes con la documentación.
- No se usa “Proveedor” cuando el concepto funcional sea “Beneficiario”.
- No se usa “Ítem” como clasificación principal cuando corresponde `categoria_gasto`, `categoria_reembolso` o `concepto_nomina`.
- El módulo Pagos no contiene acción “programar pago”.
- El módulo Financiero permite consultar saldo, movimientos, cargos, efectivo, impuestos y reingresos.

## Historias

### HU-0001. Diseñar wireframes del módulo Solicitudes

Como usuario operativo, quiero contar con wireframes del módulo Solicitudes, para validar la creación y seguimiento de solicitudes.

Criterios:

- Permite crear solicitud.
- Permite seleccionar centro de costo.
- Permite seleccionar variante.
- Permite seleccionar beneficiario.
- Permite seleccionar tipo de solicitud.
- Muestra campos tributarios cuando aplique.
- Muestra adjuntos.
- Muestra estado actual.
- Diferencia pago a proveedor, nómina, reembolso y otro pago.

### HU-0002. Diseñar wireframes del módulo Pagos

Como usuario de Pagos, quiero ver solicitudes listas para pago, para marcar las solicitudes como pagadas.

Criterios:

- Lista solo solicitudes en `PROGRAMADA_PAGO`.
- Muestra beneficiario.
- Muestra valor neto.
- Muestra medio de pago.
- Permite marcar como pagada.
- Permite registrar pago en efectivo.
- No permite aprobar.
- No permite programar pago.

### HU-0003. Diseñar wireframes del módulo Financiero

Como usuario financiero, quiero consultar el saldo y los movimientos de un centro de costo, para controlar la ejecución financiera.

Criterios:

- Muestra saldo consolidado del centro de costo.
- Muestra movimientos por variante.
- Muestra cargos financieros.
- Muestra operaciones de efectivo.
- Muestra pendientes de reingreso.
- Muestra impuestos y retenciones.
- Permite filtrar por fecha, tipo, dirección y variante.

### HU-0004. Diseñar wireframes del módulo Administrativo

Como Administrador, quiero gestionar usuarios, roles, beneficiarios y centros de costo, para parametrizar el sistema.

Criterios:

- Permite gestionar usuarios.
- Permite gestionar roles.
- Permite gestionar beneficiarios.
- Permite crear centro de costo.
- Permite crear obra ya adjudicada.
- Permite habilitar variantes.

---

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

### HU-0102. Configurar conexión a base de datos

Como desarrollador, quiero conectar el backend con PostgreSQL, para persistir información.

Criterios:

- Usa variables de entorno.
- Permite ejecutar migraciones.
- Permite probar conexión local.
- Maneja errores de conexión.

### HU-0103. Configurar estándar de migraciones

Como desarrollador, quiero manejar migraciones de base de datos, para controlar cambios del modelo.

Criterios:

- Existe carpeta de migraciones.
- Las migraciones crean tablas en orden correcto.
- Las migraciones incluyen restricciones e índices.
- Las migraciones pueden ejecutarse en ambiente local.

---

# Épica 2. Autenticación, usuarios y roles

## Objetivo

Permitir acceso seguro al sistema y asignar permisos por rol.

## Criterios de aceptación de la épica

- El usuario puede iniciar sesión.
- El sistema identifica roles.
- El sistema restringe acciones por rol.
- El sistema permite asociar beneficiarios a usuarios cuando aplique.
- Los roles base existen.
- Toda acción sensible valida permisos en backend.
- Existe frontend funcional para iniciar sesión.
- Existe frontend funcional mínimo para consultar y gestionar usuarios.
- El desarrollo del módulo contempla cierre backend y posterior integración frontend antes de avanzar al siguiente módulo principal.

## Historias

### HU-0201. Iniciar sesión

Como usuario, quiero iniciar sesión, para acceder al sistema.

Criterios:

- El sistema valida identidad.
- El sistema carga datos del usuario.
- El sistema carga roles.
- El sistema bloquea usuarios inactivos.

### HU-0202. Gestionar usuarios

Como Administrador, quiero crear y editar usuarios, para controlar quién accede al sistema.

Criterios:

- Permite crear usuario.
- Permite editar nombre, correo, teléfono y estado.
- Permite activar o desactivar usuario.
- Registra auditoría.

### HU-0203. Asignar roles

Como Administrador, quiero asignar roles a usuarios, para controlar permisos.

Criterios:

- Permite asignar uno o varios roles.
- Permite retirar roles.
- Impide dejar sin rol a usuarios activos si la política lo exige.
- Registra auditoría.

### HU-0204. Crear rol Lectura

Como Administrador, quiero contar con rol `LECTURA`, para permitir consulta sin modificación.

Criterios:

- El rol existe en base de datos.
- Puede consultar módulos autorizados.
- No puede crear, editar, aprobar, pagar ni eliminar.
- Respeta accesos por centro de costo.


### HU-0205. Construir frontend de inicio de sesión

Como usuario, quiero ingresar al sistema desde una pantalla de inicio de sesión, para acceder de forma segura.

Criterios:

- Muestra formulario de correo y contraseña.
- Consume `POST /api/v1/auth/login`.
- Muestra errores de credenciales inválidas.
- Maneja estados de carga.
- Redirige a una ruta privada cuando el inicio de sesión es correcto.
- No expone el token en pantalla ni en código cliente.

### HU-0206. Construir layout privado y validación de sesión

Como usuario autenticado, quiero navegar dentro de un layout privado, para acceder a los módulos permitidos.

Criterios:

- Consulta `GET /api/v1/auth/me`.
- Redirige a login si no existe sesión activa.
- Muestra datos básicos del usuario autenticado.
- Permite identificar roles cargados.
- Define estructura inicial de navegación privada.

### HU-0207. Construir frontend de gestión de usuarios

Como Administrador, quiero gestionar usuarios desde una interfaz, para controlar el acceso al sistema sin usar herramientas técnicas.

Criterios:

- Lista usuarios consumiendo `GET /api/v1/usuarios`.
- Permite crear usuario consumiendo `POST /api/v1/usuarios`.
- Permite consultar usuario por ID consumiendo `GET /api/v1/usuarios/[id]`.
- Permite editar nombre, correo y teléfono consumiendo `PATCH /api/v1/usuarios/[id]`.
- Permite activar o desactivar usuario consumiendo `PATCH /api/v1/usuarios/[id]/estado`.
- Muestra mensajes de éxito y error.
- Maneja estados de carga.
- No muestra `password_hash`.

### HU-0208. Validar entrega integrada del módulo Autenticación y Usuarios

Como equipo de desarrollo, quiero validar el módulo completo desde backend y frontend, para cerrar un entregable funcional antes de avanzar al siguiente módulo principal.

Criterios:

- El login funciona desde navegador.
- La sesión se mantiene mediante cookie `httpOnly`.
- La pantalla privada valida `/auth/me`.
- La gestión de usuarios funciona desde frontend.
- Los endpoints fueron probados técnicamente.
- La interfaz fue validada funcionalmente.
- Auditoría queda identificada como pendiente técnico transversal si no se implementa en esta iteración.

---

# Épica 3. Centros de costo y variantes

## Objetivo

Gestionar centros de costo con saldo único y variantes de imputación.

## Criterios de aceptación de la épica

- Se puede crear centro de costo en `EN_PROPUESTA`.
- Se puede crear centro de costo directamente en `ADJUDICADO` para obras ya adjudicadas.
- Se crean variantes según el caso.
- Las variantes no tienen saldo independiente.
- El centro de costo tiene fondo único.
- Existe trazabilidad de cambios de estado.
- Solo Administrador puede cambiar estados.

## Historias

### HU-0301. Crear centro de costo en propuesta

Como Administrador, quiero crear un centro de costo en `EN_PROPUESTA`, para registrar gastos previos a adjudicación.

Criterios:

- Crea registro en `centros_costo`.
- Estado inicial `EN_PROPUESTA`.
- Crea variante `PROYECTO`.
- Crea registro en `fondos_centro_costo`.
- Registra auditoría.

### HU-0302. Marcar centro de costo como adjudicado

Como Administrador, quiero marcar un centro de costo como `ADJUDICADO`, para habilitar operación de obra.

Criterios:

- Solo aplica desde `EN_PROPUESTA`.
- Registra fecha de adjudicación.
- Permite adjuntar soporte.
- Habilita variante `OBRA`.
- Permite habilitar `INTERVENTORIA`.
- No modifica movimientos anteriores.

### HU-0303. Marcar centro de costo como no adjudicado

Como Administrador, quiero marcar un centro de costo como `NO_ADJUDICADO`, para cerrar proyectos no ganados.

Criterios:

- Solo aplica desde `EN_PROPUESTA`.
- No habilita `OBRA`.
- No habilita `INTERVENTORIA`.
- Conserva movimientos históricos.
- Registra auditoría.

### HU-0304. Crear obra ya adjudicada

Como Administrador, quiero crear un centro de costo directamente en `ADJUDICADO`, para registrar obras ya ganadas antes de iniciar el sistema.

Criterios:

- El estado inicial es `ADJUDICADO`.
- `creado_como_adjudicado = TRUE`.
- Exige motivo de creación adjudicada.
- Crea variante `OBRA`.
- Permite crear variante `INTERVENTORIA`.
- No marca automáticamente `EN_EJECUCION`.

### HU-0305. Iniciar ejecución

Como Administrador, quiero cambiar un centro de costo de `ADJUDICADO` a `EN_EJECUCION`, para indicar inicio operativo.

Criterios:

- Solo aplica desde `ADJUDICADO`.
- Registra usuario y fecha.
- Conserva variantes.
- Registra historial.

### HU-0306. Habilitar interventoría

Como Administrador, quiero habilitar la variante `INTERVENTORIA`, para imputar gastos de interventoría.

Criterios:

- Solo se habilita en centros adjudicados o en ejecución.
- No crea saldo independiente.
- Registra auditoría.

---

# Épica 4. Beneficiarios

## Objetivo

Gestionar personas o entidades que reciben pagos.

## Criterios de aceptación de la épica

- Permite beneficiarios tipo `PROVEEDOR`, `TRABAJADOR` y `OTRO`.
- No todos los beneficiarios requieren usuario.
- Permite definir medio de pago preferido.
- Permite datos bancarios cuando aplique.
- Permite deduplicación por documento.
- Permite creación desde carga de nómina si el usuario confirma.

## Historias

### HU-0401. Crear beneficiario

Como usuario autorizado, quiero crear beneficiarios, para usarlos en solicitudes de pago.

Criterios:

- Registra tipo de beneficiario.
- Registra nombre.
- Registra tipo y número de documento.
- Permite medio de pago preferido.
- Permite datos bancarios.
- Permite dejar usuario asociado como nulo.
- Registra auditoría.

### HU-0402. Editar beneficiario

Como usuario autorizado, quiero editar beneficiarios, para mantener información actualizada.

Criterios:

- Permite editar datos de contacto.
- Permite editar datos bancarios.
- Permite activar o inactivar.
- Registra auditoría.

### HU-0403. Crear beneficiario desde Excel de nómina

Como usuario autorizado, quiero crear trabajadores desde el Excel de nómina, para no duplicar captura.

Criterios:

- Identifica beneficiarios nuevos.
- Muestra advertencia `NUEVO_BENEFICIARIO`.
- Requiere confirmación.
- Crea beneficiario tipo `TRABAJADOR`.
- No crea usuario del sistema automáticamente.

---

# Épica 5. Secuencias y referencias internas

## Objetivo

Generar referencias internas para solicitudes, movimientos, cargos, operaciones, préstamos, anticipos y pagos.

## Criterios de aceptación de la épica

- Cada entidad documental tiene referencia única.
- Las referencias son trazables.
- Las referencias pueden estar asociadas a centro de costo.
- No se repiten por concurrencia.
- Se registran en base de datos.

## Historias

### HU-0501. Generar número de solicitud

Como sistema, quiero generar número de solicitud, para identificar cada solicitud.

Criterios:

- Es único.
- Es legible.
- No se repite.
- Se guarda en `solicitudes_pago.numero_solicitud`.

### HU-0502. Generar referencia de movimiento financiero

Como sistema, quiero generar referencia de movimiento, para auditar ingresos y egresos.

Criterios:

- Es única.
- Se guarda en `movimientos_fondo_centro_costo.referencia_sistema`.
- Permite filtrar por centro de costo.

### HU-0503. Generar referencias de cargos y efectivo

Como sistema, quiero generar referencias para cargos financieros y operaciones de efectivo, para trazabilidad.

Criterios:

- Cargos financieros tienen referencia.
- Operaciones de efectivo tienen referencia.
- Reingresos pueden tener referencia documental externa.

---

# Épica 6. Fondos y movimientos financieros

## Objetivo

Controlar el saldo único por centro de costo y registrar todos los ingresos y egresos.

## Criterios de aceptación de la épica

- Cada centro de costo tiene un fondo único.
- Las variantes no tienen saldo independiente.
- Todo impacto financiero se registra en `movimientos_fondo_centro_costo`.
- Cada movimiento tiene saldo anterior y saldo nuevo.
- Cada movimiento tiene dirección `INGRESO` o `EGRESO`.
- El sistema impide saldo negativo.
- La actualización de saldo es transaccional.

## Historias

### HU-0601. Consultar saldo de centro de costo

Como usuario autorizado, quiero consultar el saldo consolidado, para conocer disponibilidad.

Criterios:

- Muestra saldo actual.
- Muestra centro de costo.
- Muestra estado del centro de costo.
- Respeta permisos.

### HU-0602. Registrar movimiento financiero

Como sistema, quiero registrar movimientos financieros, para actualizar saldos.

Criterios:

- Registra tipo de movimiento.
- Registra dirección.
- Registra valor.
- Registra saldo anterior.
- Registra saldo nuevo.
- Relaciona entidad origen si aplica.
- Actualiza `fondos_centro_costo.saldo_actual`.

### HU-0603. Consultar movimientos por variante

Como usuario financiero, quiero ver movimientos por variante, para analizar gasto por proyecto, obra o interventoría.

Criterios:

- Filtra por centro de costo.
- Filtra por variante.
- Filtra por dirección.
- Filtra por tipo de movimiento.
- Muestra saldo anterior y saldo nuevo.

---

# Épica 7. Préstamos, anticipos y devoluciones

## Objetivo

Registrar entradas y salidas financieras asociadas a préstamos, anticipos y devoluciones.

## Criterios de aceptación de la épica

- Permite préstamos de persona a obra.
- Permite préstamos entre obras o centros de costo.
- Permite anticipos.
- Permite devoluciones.
- Cada operación que afecte saldo genera movimiento financiero.
- Se conserva saldo pendiente de préstamos.

## Historias

### HU-0701. Registrar anticipo

Como usuario autorizado, quiero registrar un anticipo, para aumentar el saldo de un centro de costo.

Criterios:

- Crea registro en `anticipos_centro_costo`.
- Crea movimiento `INGRESO_ANTICIPO`.
- Actualiza saldo.
- Registra auditoría.

### HU-0702. Registrar préstamo de persona a obra

Como usuario autorizado, quiero registrar préstamo de una persona a una obra, para controlar financiación externa.

Criterios:

- Crea `prestamos_obra`.
- Tipo `PERSONA_A_OBRA`.
- Crea movimiento de ingreso.
- Actualiza saldo pendiente.

### HU-0703. Registrar préstamo entre obras

Como usuario autorizado, quiero registrar préstamo entre centros de costo, para controlar traslado temporal de recursos.

Criterios:

- Tipo `OBRA_A_OBRA`.
- Crea egreso en centro origen.
- Crea ingreso en centro destino.
- Actualiza saldos de ambos centros.
- Registra auditoría.

### HU-0704. Registrar devolución de préstamo

Como usuario autorizado, quiero registrar devolución, para disminuir saldo pendiente.

Criterios:

- Crea `devoluciones_prestamo`.
- Crea movimiento financiero.
- Actualiza saldo pendiente.
- Cambia estado del préstamo si queda pagado.

---

# Épica 8. Solicitudes de pago

## Objetivo

Crear, editar, enviar y consultar solicitudes de pago.

## Criterios de aceptación de la épica

- Permite solicitudes por centro de costo y variante.
- Permite pago a proveedor.
- Permite nómina.
- Permite reembolso.
- Permite otro pago.
- Calcula valor neto.
- Permite adjuntos.
- Permite impuestos y retenciones.
- Valida medio de pago.
- Valida categoría o concepto según tipo.

## Historias

### HU-0801. Crear solicitud de pago a proveedor

Como Solicitante, quiero crear una solicitud de pago a proveedor, para tramitar una obligación.

Criterios:

- Selecciona centro de costo.
- Selecciona variante.
- Selecciona beneficiario.
- Selecciona categoría de gasto.
- Registra valor bruto y valor neto.
- Permite impuestos y retenciones.
- Permite adjuntos.
- Estado inicial `BORRADOR`.

### HU-0802. Crear solicitud de reembolso

Como Solicitante, quiero crear una solicitud de reembolso, para recuperar gastos realizados.

Criterios:

- Selecciona categoría de reembolso.
- Registra beneficiario.
- Registra soportes.
- Valida descripción cuando categoría es `OTRO`.

### HU-0803. Crear solicitud de nómina individual

Como usuario autorizado, quiero crear una solicitud de nómina individual, para pagar a un trabajador.

Criterios:

- Tipo `PAGO_NOMINA`.
- Modalidad `INDIVIDUAL`.
- Selecciona beneficiario tipo `TRABAJADOR`.
- Selecciona concepto de nómina.

### HU-0804. Crear solicitud de nómina agrupada por Excel

Como usuario autorizado, quiero cargar nómina agrupada, para pagar varios trabajadores.

Criterios:

- Modalidad `AGRUPADA_EXCEL`.
- Carga archivo.
- Valida filas.
- Detecta nuevos beneficiarios.
- Detecta documentos repetidos.
- Permite confirmar carga.
- Crea ítems de solicitud.

### HU-0805. Enviar solicitud

Como Solicitante, quiero enviar una solicitud, para iniciar aprobación.

Criterios:

- Solo desde `BORRADOR`.
- Requiere datos mínimos completos.
- Cambia a `PENDIENTE_APROBADOR_1`.
- Registra `enviado_en`.

---

# Épica 9. Adjuntos y soportes

## Objetivo

Permitir carga, consulta y trazabilidad de archivos soporte.

## Criterios de aceptación de la épica

- Permite cargar archivos a solicitudes.
- Permite cargar soportes de pago.
- Permite cargar soportes de retiro y reingreso.
- Permite cargar soporte de adjudicación.
- Guarda metadatos.
- Respeta permisos de acceso.

## Historias

### HU-0901. Cargar adjunto en solicitud

Como usuario autorizado, quiero adjuntar soportes, para respaldar la solicitud.

Criterios:

- Guarda nombre de archivo.
- Guarda ruta.
- Guarda tipo MIME.
- Guarda usuario que subió.
- Relaciona con solicitud.

### HU-0902. Cargar soporte de operación de efectivo

Como usuario de Pagos, quiero cargar soporte de retiro, pago y reingreso, para trazabilidad.

Criterios:

- Permite soporte de retiro.
- Permite soporte de pago.
- Permite soporte de reingreso.
- Relaciona con `operaciones_efectivo`.

---

# Épica 10. Aprobaciones

## Objetivo

Implementar el flujo de doble aprobación.

## Criterios de aceptación de la épica

- Aprobador 1 revisa primero.
- Aprobador 2 revisa después.
- Aprobador 2 deja la solicitud en `PROGRAMADA_PAGO`.
- Se permiten devoluciones.
- Se registra historial.
- Se registra auditoría.
- Pagos no aprueba.

## Historias

### HU-1001. Aprobar nivel 1

Como Aprobador 1, quiero aprobar solicitudes, para enviarlas a segundo nivel.

Criterios:

- Solo desde `PENDIENTE_APROBADOR_1`.
- Cambia a `PENDIENTE_APROBADOR_2`.
- Registra usuario y fecha.

### HU-1002. Devolver al Solicitante

Como Aprobador 1, quiero devolver solicitudes, para que sean corregidas.

Criterios:

- Cambia a `DEVUELTA_SOLICITANTE`.
- Exige comentario.
- Registra historial.

### HU-1003. Aprobar nivel 2

Como Aprobador 2, quiero aprobar solicitudes, para dejarlas listas para pago.

Criterios:

- Solo desde `PENDIENTE_APROBADOR_2`.
- Cambia a `PROGRAMADA_PAGO`.
- No usa estado operativo `APROBADA`.
- Registra `aprobado_2_en`.

### HU-1004. Devolver a Aprobador 1

Como Aprobador 2, quiero devolver solicitudes a Aprobador 1, para revisión previa.

Criterios:

- Cambia a `DEVUELTA_APROBADOR_1`.
- Exige comentario.
- Registra historial.

---

# Épica 11. Pagos

## Objetivo

Permitir que el rol Pagos marque solicitudes como pagadas.

## Criterios de aceptación de la épica

- Solo opera solicitudes en `PROGRAMADA_PAGO`.
- No programa pagos.
- No aprueba.
- Registra referencia y soporte.
- Crea movimiento financiero.
- Soporta transferencia y efectivo.

## Historias

### HU-1101. Ver bandeja de pagos

Como usuario de Pagos, quiero ver solicitudes en `PROGRAMADA_PAGO`, para gestionar pagos.

Criterios:

- Muestra beneficiario.
- Muestra centro de costo.
- Muestra variante.
- Muestra valor neto.
- Muestra medio de pago.
- Permite filtrar.

### HU-1102. Marcar transferencia como pagada

Como usuario de Pagos, quiero marcar una transferencia como pagada, para cerrar la solicitud.

Criterios:

- Solo si medio de pago es `TRANSFERENCIA`.
- Crea `EGRESO_SOLICITUD_PAGO`.
- Cambia solicitud a `PAGADA`.
- Registra `pagado_en`.

### HU-1103. Marcar pago en efectivo

Como usuario de Pagos, quiero registrar pago en efectivo, para controlar retiro y pago.

Criterios:

- Crea `operaciones_efectivo`.
- Registra valor requerido.
- Registra valor retirado.
- Registra valor pagado.
- Calcula sobrante.
- Cambia solicitud a `PAGADA`.

---

# Épica 12. Operaciones de efectivo

## Objetivo

Controlar retiros, pagos en efectivo y reingresos de sobrantes.

## Criterios de aceptación de la épica

- Registra retiro.
- Registra pago.
- Calcula sobrante.
- Permite reingreso.
- Reingreso no pasa por aprobación.
- Crea movimiento financiero de ingreso cuando se reingresa sobrante.

## Historias

### HU-1201. Registrar operación de efectivo

Como usuario de Pagos, quiero registrar operación de efectivo, para dejar trazabilidad del retiro y pago.

Criterios:

- `valor_retirado >= valor_pagado`.
- Calcula `valor_sobrante`.
- Estado `SIN_SOBRANTE` si no sobra.
- Estado `SOBRANTE_PENDIENTE_REINGRESO` si sobra.

### HU-1202. Registrar reingreso de sobrante

Como usuario autorizado, quiero registrar reingreso de sobrante, para devolver dinero al fondo.

Criterios:

- Solo si existe sobrante pendiente.
- No pasa por aprobación.
- Crea movimiento `INGRESO_REINGRESO_SOBRANTE_EFECTIVO`.
- Actualiza saldo.
- Cambia estado a `SOBRANTE_REINGRESADO`.

### HU-1203. Consultar pendientes de reingreso

Como usuario financiero, quiero consultar sobrantes pendientes, para hacer seguimiento.

Criterios:

- Lista operaciones con `SOBRANTE_PENDIENTE_REINGRESO`.
- Muestra centro de costo.
- Muestra solicitud.
- Muestra valor sobrante.
- Permite exportar.

---

# Épica 13. Cargos financieros

## Objetivo

Registrar costos bancarios y financieros asociados a operaciones o centros de costo.

## Criterios de aceptación de la épica

- Registra cargos financieros.
- No mezcla retenciones con cargos financieros.
- Puede asociarse a solicitud, operación de efectivo o préstamo.
- Crea movimiento financiero de egreso.
- Actualiza saldo.
- Registra auditoría.

## Historias

### HU-1301. Registrar cargo financiero

Como usuario autorizado, quiero registrar un cargo financiero, para afectar el saldo del centro de costo.

Criterios:

- Selecciona centro de costo.
- Selecciona variante.
- Selecciona tipo de cargo.
- Registra valor.
- Crea `cargos_financieros`.
- Crea `EGRESO_CARGO_FINANCIERO`.

### HU-1302. Asociar cargo a operación de efectivo

Como usuario financiero, quiero asociar un cargo a una operación de efectivo, para explicar costos de retiro.

Criterios:

- Permite seleccionar `operacion_efectivo_id`.
- Mantiene trazabilidad.
- No cambia valores de la operación original.

---

# Épica 14. Impuestos y retenciones

## Objetivo

Registrar impuestos, retenciones y descuentos tributarios asociados a solicitudes.

## Criterios de aceptación de la épica

- Registra impuestos por solicitud.
- Registra retenciones por solicitud.
- Calcula valores de desglose.
- No los registra como cargos financieros.
- No crea aprobación independiente.
- Permite ajuste con auditoría.
- Si generan egreso independiente, se registra en `movimientos_fondo_centro_costo`.

## Historias

### HU-1401. Registrar impuesto o retención en solicitud

Como usuario autorizado, quiero registrar impuestos y retenciones, para calcular correctamente el valor neto.

Criterios:

- Crea `impuestos_retenciones_solicitud`.
- Valida tipo.
- Valida naturaleza.
- Valida valor no negativo.
- Actualiza totales de la solicitud.

### HU-1402. Ajustar impuesto o retención

Como usuario autorizado, quiero ajustar un registro tributario, para corregir errores.

Criterios:

- Cambia estado a `AJUSTADO`.
- Exige motivo.
- Registra usuario y fecha.
- Registra auditoría.

### HU-1403. Registrar egreso por pago tributario independiente

Como usuario financiero autorizado, quiero registrar pago de impuesto o retención como egreso, cuando aplique.

Criterios:

- Crea movimiento `EGRESO_IMPUESTO_RETENCION`.
- Relaciona `impuesto_retencion_id`.
- Actualiza saldo.
- No crea solicitud de pago aprobable.

---

# Épica 15. Auditoría

## Objetivo

Registrar trazabilidad de acciones sensibles.

## Criterios de aceptación de la épica

- Registra usuario.
- Registra acción.
- Registra entidad.
- Registra fecha.
- Registra datos anteriores y nuevos cuando aplique.
- Permite consulta por filtros.

## Historias

### HU-1501. Registrar auditoría de solicitudes

Como sistema, quiero auditar cambios de solicitud, para trazabilidad.

Criterios:

- Audita creación.
- Audita envío.
- Audita aprobación.
- Audita devolución.
- Audita pago.

### HU-1502. Registrar auditoría financiera

Como sistema, quiero auditar movimientos financieros, para control.

Criterios:

- Audita movimientos.
- Audita cargos financieros.
- Audita operaciones de efectivo.
- Audita reingresos.
- Audita impuestos.

---

# Épica 16. Exportación

## Objetivo

Permitir exportar información operativa y financiera.

## Criterios de aceptación de la épica

- Exporta solicitudes.
- Exporta movimientos.
- Exporta impuestos.
- Exporta cargos financieros.
- Exporta operaciones de efectivo.
- Respeta permisos.
- Permite filtros.

## Historias

### HU-1601. Exportar solicitudes

Como usuario autorizado, quiero exportar solicitudes, para análisis externo.

Criterios:

- Permite filtrar por fecha.
- Permite filtrar por estado.
- Permite filtrar por centro de costo.
- Exporta valor bruto, impuestos, retenciones y valor neto.

### HU-1602. Exportar movimientos financieros

Como usuario financiero, quiero exportar movimientos, para control de saldos.

Criterios:

- Incluye centro de costo.
- Incluye variante.
- Incluye tipo de movimiento.
- Incluye dirección.
- Incluye saldo anterior y saldo nuevo.

---

# Épica 17. Seguridad y hardening

## Objetivo

Proteger el sistema y garantizar integridad.

## Criterios de aceptación de la épica

- Valida permisos en backend.
- Valida estados en backend.
- Valida saldos en transacción.
- Impide doble pago.
- Impide doble descuento.
- Impide modificación no autorizada.
- Protege adjuntos.

## Historias

### HU-1701. Validar permisos por rol

Como sistema, quiero validar permisos por rol, para evitar acciones no autorizadas.

Criterios:

- Valida rol.
- Valida centro de costo.
- Valida variante.
- Bloquea acciones no autorizadas.

### HU-1702. Evitar doble movimiento financiero

Como sistema, quiero evitar movimientos duplicados, para proteger saldos.

Criterios:

- Usa referencias únicas.
- Valida entidad origen.
- Impide doble pago de una solicitud.
- Impide doble reingreso de sobrante.

---

# Épica 18. OCR futuro

## Objetivo

Preparar base para extracción futura de datos desde soportes.

## Criterios de aceptación de la épica

- Guarda adjuntos.
- Guarda resultados OCR.
- No decide automáticamente.
- No crea movimientos automáticamente.
- Exige validación humana.

## Historias

### HU-1801. Registrar resultado OCR

Como sistema, quiero guardar resultado OCR, para futura asistencia en captura.

Criterios:

- Relaciona adjunto.
- Relaciona solicitud si aplica.
- Guarda texto original.
- Guarda respuesta estructurada.
- Guarda confianza.

### HU-1802. Validar datos OCR antes de aplicar

Como usuario autorizado, quiero revisar datos OCR, para evitar errores.

Criterios:

- Muestra datos sugeridos.
- Permite aceptar o rechazar.
- No crea aprobación automática.
- Registra auditoría.
