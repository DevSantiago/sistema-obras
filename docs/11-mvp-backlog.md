# 11. Backlog MVP

> Última actualización funcional: 13 de agosto de 2026.

## Objetivo

Definir el backlog del MVP para el sistema de gestión de solicitudes de pago, fondo general por proyecto base, centros de costo operativos, aprobaciones, pagos, beneficiarios, nómina, reembolsos, préstamos, anticipos, cargos financieros, operaciones de efectivo, impuestos, retenciones, auditoría, exportaciones y OCR futuro.

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
| 2 | Autenticación, usuarios, roles, permisos y accesos | MUST | Acceso seguro, gestión de usuarios, rol único, permisos por rol y accesos por proyecto/línea integrados |
| 3 | Proyectos base, centros de costo y fondo general | MUST | Administración de proyectos base, líneas OBRA/INTERVENTORIA, fases PRO/ejecución, fondo general y cambios de estado con API y frontend operativo |
| 4 | Beneficiarios | MUST | Registro de personas o entidades que reciben pagos con backend y pantallas de gestión |
| 5 | Secuencias y referencias internas | MUST | Consecutivos y trazabilidad documental integrados a solicitudes, pagos y movimientos |
| 6 | Solicitudes de pago | MUST | Creación y gestión de solicitudes con backend y flujo frontend funcional |
| 7 | Adjuntos y soportes | MUST | Carga y consulta de documentos soporte integrada a solicitudes, pagos y operaciones |
| 8 | Aprobaciones | MUST | Flujo de doble aprobación con bandejas y acciones frontend integradas |
| 9 | Pagos | MUST | Marcación de solicitudes pagadas con bandeja operativa y backend transaccional |
| 10 | Fondos y movimientos financieros | MUST | Fondo general por proyecto base y movimientos trazables imputados a centros de costo/líneas/fases |
| 11 | Operaciones de efectivo | MUST | Control de retiros, pagos en efectivo y sobrantes con pantallas de seguimiento |
| 12 | Impuestos y retenciones | MUST | Desglose tributario de solicitudes y registros asociados visibles en frontend |
| 13 | Cargos financieros | MUST | Registro de costos bancarios y financieros con formulario y consulta integrada |
| 14 | Préstamos, anticipos y devoluciones | MUST | Manejo financiero de entradas, salidas y saldos pendientes con trazabilidad |
| 15 | Auditoría | MUST | Trazabilidad de acciones sensibles con consulta básica por filtros |
| 16 | Exportación | SHOULD | Exportación de información operativa y financiera desde vistas integradas |
| 17 | Seguridad y hardening | MUST | Validaciones, permisos y protección básica aplicadas en backend y frontend |
| 18 | OCR futuro | COULD | Base para procesamiento posterior de soportes con validación humana futura |
| 19 | Notificaciones por WhatsApp | MUST | Avisos trazables ante transiciones del flujo de aprobación mediante WhatsApp Business Platform |

## Criterio transversal de entrega incremental

Para las épicas funcionales del MVP, el avance se planeará como entregables verticales. Cada módulo deberá tener backend probado y frontend integrado en una versión mínima antes de pasar al siguiente módulo funcional principal. Esta regla aplica especialmente a autenticación, usuarios, centros de costo, beneficiarios, solicitudes, aprobaciones, pagos y financiero.

## Estado de avance actualizado

Este backlog conserva la planificación inicial, pero incorpora los cambios definidos durante el desarrollo de las primeras historias.

Estado a la fecha de actualización:

| Bloque | Estado | Nota |
|---|---|---|
| Configuración base | APROBADA | Proyecto Next.js, Prisma y PostgreSQL operativo |
| Autenticación | APROBADA | Login, logout, sesión `httpOnly` y `/auth/me` implementados |
| Usuarios | APROBADA | Creación, edición, activación/inactivación y frontend funcional |
| Roles y permisos | APROBADA | Rol único por usuario, permisos por rol y seed actualizado |
| Accesos | APROBADA | Accesos por proyecto base y línea de negocio |
| Proyectos base | APROBADA | Creación de proyecto, fondo general y centros iniciales |
| Centros de costo | APROBADA | `PRO-OBRA`, `OBRA`, `PRO-INT`, `INT` y cambios de estado implementados |
| Autorización por permisos | APROBADA | Crear usuarios/proyectos y asignar accesos valida permisos, no solo rol |
| Beneficiarios | APROBADA | Creación y edición completa, unicidad documental, sincronización de proveedores y validación de `TRABAJADOR` sin `NIT` |
| Secuencias documentales | APROBADA | Consecutivo contextual por tipo, proyecto, centro de costo y año |
| Solicitudes de pago | APROBADA | Proveedor, nómina individual y agrupada, reembolso, edición, envío y aprobaciones implementados |
| Pagos | APROBADA | Bandeja, pagos directos, retiros, fechas automáticas, soportes y resúmenes implementados |
| Fondos y movimientos | APROBADA | Saldo por proyecto, servicio financiero común y consulta de movimientos implementados |
| Operaciones de efectivo | APROBADA | Seguimiento, reingresos parciales, ajustes y anulaciones implementados |

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
- Permite seleccionar centro operativo, línea y fase.
- Permite seleccionar beneficiario.
- Permite seleccionar tipo de solicitud.
- Muestra campos tributarios cuando aplique.
- Muestra adjuntos.
- Muestra estado actual.
- Diferencia pago a proveedor, nómina, reembolso, pago de impuesto y otro pago.
- Admite `TRANSFERENCIA`, `PSE`, `PORTAL`, `CONSIGNACION` y `EFECTIVO`.

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

Como usuario financiero, quiero consultar el saldo del fondo general y los movimientos por centro operativo, para controlar la ejecución financiera.

Criterios:

- Muestra saldo del fondo general.
- Muestra movimientos por centro operativo, línea y fase.
- Muestra cargos financieros.
- Muestra operaciones de efectivo.
- Muestra pendientes de reingreso.
- Muestra impuestos y retenciones.
- Permite filtrar por fecha, tipo, dirección, línea y fase.

### HU-0004. Diseñar wireframes del módulo Administrativo

Como usuario autorizado, quiero gestionar usuarios, roles, beneficiarios, proyectos base y centros de costo, para parametrizar el sistema.

Criterios:

- Permite gestionar usuarios.
- Permite gestionar roles.
- Permite gestionar beneficiarios.
- Permite crear proyecto base y centros de costo iniciales.
- Permite crear obra ya adjudicada.
- Permite gestionar líneas de negocio y fases operativas.

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

# Épica 2. Autenticación, usuarios, roles, permisos y accesos

## Objetivo

Permitir acceso seguro al sistema, gestionar usuarios con un único rol, asignar permisos por rol y controlar los proyectos y líneas de negocio sobre los cuales cada usuario puede operar.

Actualización de alcance:

- El usuario ya no debe tener varios roles activos simultáneamente.
- Cada usuario tiene un único rol funcional.
- El rol define las acciones permitidas mediante permisos.
- El acceso define dónde puede operar el usuario.
- Los accesos se asignan por `proyecto_base + linea_negocio`.
- La línea `OBRA` cubre `PRO-OBRA` y `OBRA`.
- La línea `INTERVENTORIA` cubre `PRO-INT` e `INT`.
- El rol `SOLICITANTE` solo puede acceder a la línea `OBRA`.
- Los roles `ADMINISTRADOR`, `DIRECTOR`, `APROBADOR_1`, `APROBADOR_2`, `AUXILIAR_CONTABLE` y `PAGOS` pueden tener acceso a `OBRA` e `INTERVENTORIA`.

## Criterios de aceptación de la épica

- El usuario puede iniciar sesión.
- El sistema identifica roles.
- El sistema identifica permisos derivados del rol.
- El sistema restringe acciones por permiso.
- El sistema restringe operación por acceso a proyecto y línea de negocio.
- El sistema permite asociar beneficiarios a usuarios cuando aplique.
- Los roles base existen.
- Los permisos base existen.
- Cada usuario activo tiene un único rol.
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
- El sistema carga permisos asociados al rol.
- El sistema bloquea usuarios inactivos.

### HU-0202. Gestionar usuarios con rol único

Como usuario autorizado, quiero crear y editar usuarios, para controlar quién accede al sistema.

Criterios:

- Permite crear usuario.
- Permite editar nombre, correo, teléfono y estado.
- Permite activar o desactivar usuario.
- Permite asignar un único rol activo al usuario.
- Impide crear usuarios sin rol.
- Permite asignar accesos por proyecto y línea de negocio.
- Valida que el rol seleccionado exista y esté activo.
- Valida que el usuario autenticado tenga permiso `CREAR_USUARIOS`.
- Registra auditoría.

### HU-0203. Asignar rol único

Como usuario autorizado, quiero asignar un rol único a cada usuario, para controlar sus permisos funcionales.

Criterios:

- Permite asignar un solo rol.
- Permite cambiar el rol de un usuario.
- Impide dejar sin rol a usuarios activos.
- Reemplaza la regla previa de múltiples roles.
- Registra el cambio de rol en `usuarios_roles`.
- Registra auditoría.

### HU-0204. Parametrizar roles, permisos y líneas de negocio

Como sistema, quiero contar con roles, permisos y líneas de negocio parametrizados, para autorizar acciones y accesos de forma consistente.

Criterios:

- Existen roles base: `ADMINISTRADOR`, `DIRECTOR`, `APROBADOR_1`, `APROBADOR_2`, `AUXILIAR_CONTABLE`, `PAGOS` y `SOLICITANTE`.
- El rol `LECTURA` se conserva como referencia histórica, pero queda fuera del flujo activo del MVP salvo decisión posterior.
- Existen permisos base como `CREAR_SOLICITUDES`, `CREAR_PROYECTOS`, `CREAR_USUARIOS`, `ASIGNAR_ACCESOS`, `APROBAR_NIVEL_1`, `APROBAR_NIVEL_2`, `MARCAR_COMO_PAGADO` y `CONSULTAR_TODO`.
- Los permisos se asignan mediante `roles_permisos`.
- Las líneas permitidas por rol se asignan mediante `roles_lineas_negocio`.
- El seed crea o actualiza roles, permisos, líneas por rol y usuario administrador.


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
- Permite identificar permisos cargados.
- Define estructura inicial de navegación privada.

### HU-0207. Construir frontend de gestión de usuarios

Como usuario autorizado, quiero gestionar usuarios desde una interfaz, para controlar el acceso al sistema sin usar herramientas técnicas.

Criterios:

- Lista usuarios consumiendo `GET /api/v1/usuarios`.
- Permite crear usuario consumiendo `POST /api/v1/usuarios`.
- Permite consultar usuario por ID consumiendo `GET /api/v1/usuarios/[id]`.
- Permite editar nombre, correo y teléfono consumiendo `PATCH /api/v1/usuarios/[id]`.
- Permite activar o desactivar usuario consumiendo `PATCH /api/v1/usuarios/[id]/estado`.
- Muestra rol único.
- Muestra accesos por proyecto y línea.
- Permite seleccionar proyectos y líneas de negocio al crear o editar usuario.
- Bloquea selección de `INTERVENTORIA` cuando el rol es `SOLICITANTE`.
- Muestra mensajes de éxito y error.
- Maneja estados de carga.
- No muestra `password_hash`.

### HU-0208. Asignar accesos por proyecto y línea de negocio

Como usuario autorizado, quiero asignar accesos por proyecto y línea de negocio, para controlar dónde puede operar cada usuario.

Criterios:

- Permite asignar acceso a `OBRA`.
- Permite asignar acceso a `INTERVENTORIA` cuando el rol lo permite.
- Un acceso `OBRA` cubre centros `PRO-OBRA` y `OBRA`.
- Un acceso `INTERVENTORIA` cubre centros `PRO-INT` e `INT`.
- Valida que el proyecto exista y esté activo.
- Valida que exista al menos un centro de costo activo para la línea seleccionada.
- Impide que `SOLICITANTE` tenga acceso a `INTERVENTORIA`.
- Permite activar, inactivar o reactivar accesos sin duplicarlos.

### HU-0209. Validar autorización por permisos

Como sistema, quiero autorizar acciones por permisos y no solo por nombre de rol, para que distintos roles puedan ejecutar acciones compartidas.

Criterios:

- Crear usuarios valida `CREAR_USUARIOS`.
- Asignar accesos valida `ASIGNAR_ACCESOS`.
- Crear proyectos valida `CREAR_PROYECTOS`.
- Marcar como pagado valida `MARCAR_COMO_PAGADO`.
- Aprobar nivel 1 valida `APROBAR_NIVEL_1`.
- Aprobar nivel 2 valida `APROBAR_NIVEL_2`.
- Las rutas API delegan la autorización fina al service correspondiente.

### HU-0210. Validar entrega integrada del módulo Autenticación y Usuarios

Como equipo de desarrollo, quiero validar el módulo completo desde backend y frontend, para cerrar un entregable funcional antes de avanzar al siguiente módulo principal.

Criterios:

- El login funciona desde navegador.
- La sesión se mantiene mediante cookie `httpOnly`.
- La pantalla privada valida `/auth/me`.
- La gestión de usuarios funciona desde frontend.
- Los endpoints fueron probados técnicamente.
- La interfaz fue validada funcionalmente.
- Auditoría queda identificada como pendiente técnico transversal si no se implementa en esta iteración.

### HU-0211. Cambiar contraseña propia

Como usuario autenticado, quiero reemplazar mi contraseña temporal por una
contraseña personal, para mantener la confidencialidad de mi acceso.

Criterios:

- La opción está disponible para cualquier usuario con sesión activa.
- Solicita la contraseña actual, la nueva contraseña y su confirmación.
- Verifica que la contraseña actual sea correcta.
- Exige una nueva contraseña de mínimo ocho caracteres y diferente de la actual.
- Rechaza la operación cuando la confirmación no coincide.
- Almacena únicamente el hash seguro de la nueva contraseña.
- No requiere permisos administrativos ni permite modificar la contraseña de otro usuario.
- Incluye una interfaz responsive dentro del layout privado.

---

# Épica 3. Proyectos base, centros de costo y fondo general

## Objetivo

Gestionar proyectos base con fondo general y centros de costo operativos por línea de negocio y fase.

Actualización de alcance:

- El sistema maneja `proyectos_base` como agrupador funcional.
- El sistema maneja `centros_costo` como unidades operativas de imputación.
- Cada proyecto base puede tener líneas de negocio `OBRA` e `INTERVENTORIA`.
- Cada línea puede tener fase de licitación y fase de ejecución.
- Para obra, la fase de licitación se representa como `PRO-OBRA` y la fase de ejecución como `OBRA`.
- Para interventoría, la fase de licitación se representa como `PRO-INT` y la fase de ejecución como `INT`.
- Un proyecto puede tener solo obra, obra e interventoría, o solo interventoría.
- El fondo es general del proyecto base y los centros de costo imputan gastos contra ese fondo.
- La tabla `variantes_centro_costo`, si se conserva en documentación histórica, no debe usarse como eje principal del MVP.

## Criterios de aceptación de la épica

- Se puede crear proyecto base.
- Se puede seleccionar si el proyecto tendrá línea `OBRA`, `INTERVENTORIA` o ambas.
- Al crear proyecto, las líneas iniciales se crean en fase `LICITACION`.
- Para línea `OBRA`, se crea centro `PRO-OBRA` en `EN_LICITACION`.
- Para línea `INTERVENTORIA`, se crea centro `PRO-INT` en `EN_LICITACION`.
- Se crea un fondo general asociado al proyecto base.
- Se puede pasar `PRO-OBRA` a ejecución creando `OBRA` en `EN_EJECUCION` y cerrando `PRO-OBRA`.
- Se puede pasar `PRO-INT` a ejecución creando `INT` en `EN_EJECUCION` y cerrando `PRO-INT`.
- Se puede finalizar `OBRA` e `INT`.
- El proyecto base queda `FINALIZADO` cuando todos sus centros activos están finalizados.
- Existe trazabilidad de cambios de estado.
- La creación de proyectos valida permiso `CREAR_PROYECTOS`.
- El cambio de estados valida permisos definidos para administración de proyectos.

## Historias

### HU-0301. Crear backend de proyectos base, centros de costo iniciales y fondo general

Como usuario autorizado, quiero crear un proyecto base con sus centros de costo iniciales y fondo general, para registrar gastos desde fase de licitación.

Criterios:

- Crea registro en `proyectos_base`.
- Crea registro en `fondos` como fondo general del proyecto.
- Permite seleccionar línea `OBRA`, `INTERVENTORIA` o ambas.
- Crea `PRO-OBRA` cuando se selecciona `OBRA`.
- Crea `PRO-INT` cuando se selecciona `INTERVENTORIA`.
- Los centros iniciales quedan en `EN_LICITACION`.
- El proyecto base queda en `EN_LICITACION`.
- La creación es transaccional.
- Valida duplicados por nombre de proyecto activo.
- Valida que el usuario tenga permiso `CREAR_PROYECTOS`.
- Incluye pruebas unitarias y validación por `curl`.

### HU-0302. Construir frontend de proyectos base

Como usuario autorizado, quiero gestionar proyectos base desde una interfaz, para crear proyectos y consultar sus centros de costo sin usar herramientas técnicas.

Criterios:

- Permite crear proyecto base.
- Permite seleccionar centros iniciales `PRO-OBRA` y/o `PRO-INT`.
- Lista proyectos creados.
- Muestra estado del proyecto.
- Muestra fondo general.
- Muestra centros de costo asociados.
- Muestra estado de cada centro.
- Consume endpoints reales del módulo.
- Maneja mensajes de éxito y error.
- Tiene diseño responsivo validado en escritorio y móvil.

### HU-0303. Cambiar estado de centro de costo de licitación a ejecución

Como usuario autorizado, quiero pasar un centro de costo de licitación a ejecución, para separar gastos de fase comercial y fase ejecutada.

Criterios:

- Permite pasar `PRO-OBRA` de `EN_LICITACION` a ejecución.
- Al pasar `PRO-OBRA`, el sistema finaliza `PRO-OBRA` y crea `OBRA` en `EN_EJECUCION`.
- Permite pasar `PRO-INT` de `EN_LICITACION` a ejecución.
- Al pasar `PRO-INT`, el sistema finaliza `PRO-INT` y crea `INT` en `EN_EJECUCION`.
- Conserva trazabilidad de usuario, fecha y observación.
- No modifica movimientos históricos de la fase de licitación.
- Actualiza estado del proyecto base a `EN_EJECUCION` cuando aplique.
- La operación es transaccional.
- Incluye pruebas unitarias y validación por `curl`.

### HU-0304. Finalizar centros de costo en ejecución

Como usuario autorizado, quiero finalizar centros `OBRA` o `INT`, para cerrar operación de una línea ejecutada.

Criterios:

- Solo permite finalizar centros en `EN_EJECUCION`.
- Permite finalizar `OBRA`.
- Permite finalizar `INT`.
- Impide devolver un centro finalizado a ejecución.
- Actualiza estado del proyecto base.
- El proyecto base queda `FINALIZADO` cuando todos sus centros activos están finalizados.
- Conserva trazabilidad de usuario, fecha y observación.

### HU-0305. Asignar accesos de usuarios a proyectos y líneas

Como usuario autorizado, quiero asignar accesos de usuarios a proyectos y líneas, para controlar dónde puede operar cada usuario.

Criterios:

- Permite asignar acceso por `proyecto_base + linea_negocio`.
- `OBRA` habilita operación sobre `PRO-OBRA` y `OBRA`.
- `INTERVENTORIA` habilita operación sobre `PRO-INT` e `INT`.
- Valida líneas permitidas por rol.
- Impide `INTERVENTORIA` para `SOLICITANTE`.
- Permite a `ADMINISTRADOR`, `DIRECTOR`, `APROBADOR_1`, `APROBADOR_2`, `AUXILIAR_CONTABLE` y `PAGOS` acceder a ambas líneas según asignación.
- Se integra al frontend de creación y edición de usuarios.

### HU-0306. Validar entrega integrada de proyectos, centros y accesos

Como equipo de desarrollo, quiero validar proyectos, centros de costo, estados y accesos desde backend y frontend, para cerrar el entregable funcional.

Criterios:

- Se puede crear proyecto solo obra.
- Se puede crear proyecto obra e interventoría.
- Se puede crear proyecto solo interventoría.
- Se puede cambiar `PRO-OBRA` a `OBRA`.
- Se puede cambiar `PRO-INT` a `INT`.
- Se puede finalizar `OBRA` e `INT`.
- Se pueden crear usuarios con rol único y accesos por proyecto/línea.
- `SOLICITANTE` puede operar únicamente en la línea `OBRA`, sobre los accesos activos asignados al proyecto correspondiente.
- `DIRECTOR` y `APROBADOR_1` pueden crear proyectos, usuarios y asignar accesos si tienen permisos.
- Las rutas API no autorizan por nombre de rol, sino por permisos.
- `npm run lint` y `npm run test:run` pasan correctamente.

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
- Permite carga masiva de proveedores mediante plantilla Excel, validación previa e informe de errores.
- Exige información bancaria y de contacto completa para proveedores.


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
- Permite al rol `AUXILIAR_CONTABLE` acceder al módulo y crear beneficiarios.
- Presenta los nombres con capitalización legible sin alterar su forma canónica
  en base de datos.
- Registra auditoría.

### HU-0402. Editar beneficiario

Como usuario autorizado, quiero editar beneficiarios, para mantener información actualizada.

Criterios:

- Permite editar datos de contacto.
- Permite editar datos bancarios.
- Permite activar o inactivar.
- Registra auditoría.

### HU-0403. Cargar proveedores masivamente

Como usuario autorizado, quiero cargar proveedores desde Excel, para mantener un directorio completo de contacto y pago.

Criterios:

- Descarga una plantilla oficial con catálogos.
- Exige todos los campos de identificación, contacto, pago y concepto.
- Muestra resumen de filas válidas, rechazadas y duplicadas antes de importar.
- No modifica proveedores existentes.
- Importa únicamente filas válidas.
- Permite descargar el informe de errores.

---

# Épica 5. Secuencias y referencias internas

## Objetivo

Generar referencias internas para solicitudes, movimientos financieros, cargos financieros, operaciones de efectivo, reingresos, préstamos, devoluciones, anticipos y pagos, garantizando trazabilidad e identificación única de las operaciones del sistema.

## Criterios de aceptación de la épica

- Cada entidad documental tiene referencia única.
- Las referencias son trazables.
- Las referencias pueden asociarse a la entidad funcional que las origina, incluyendo proyecto base, centro de costo, solicitud de pago, movimiento financiero, operación de efectivo, préstamo, anticipo o devolución, según corresponda.
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

# Épica 6. Solicitudes de pago

## Objetivo

Crear, editar, enviar y consultar solicitudes de pago.

## Criterios de aceptación de la épica

- Permite solicitudes por proyecto base y centro de costo operativo.
- Permite imputar gasto a `PRO-OBRA`, `OBRA`, `PRO-INT` o `INT`.
- Permite pago a proveedor.
- Permite nómina.
- Permite reembolso.
- Permite pago de impuesto.
- Permite otro pago.
- Calcula valor neto.
- Permite adjuntos.
- Permite impuestos y retenciones.
- Valida medio de pago.
- Valida la información específica según el tipo de solicitud.
b
Reglas de visibilidad:

- Todo usuario con acceso activo a un proyecto ve todas las solicitudes de ese proyecto.
- La visibilidad no habilita acciones adicionales: editar, enviar, aprobar y pagar siguen dependiendo del rol, permiso y estado.
- `APROBADOR_1` recibe para operar solicitudes en `PENDIENTE_APROBADOR_1` y `DEVUELTA_APROBADOR_1`.
- `APROBADOR_2` recibe para operar solicitudes en `PENDIENTE_APROBADOR_2`.
- `PAGOS` recibe para operar solicitudes en `PROGRAMADA_PAGO`.
- `ADMINISTRADOR` ve todas.
- El listado muestra fecha y hora de creación, aprobación nivel 1, aprobación nivel 2 y pago.
- El detalle de una solicitud pagada permite consultar su comprobante.

## Historias

### HU-0601. Crear solicitud de pago a proveedor

Como Solicitante, quiero crear una solicitud de pago a proveedor, para tramitar una obligación.

Criterios:

- Selecciona centro de costo.
- Selecciona centro operativo según línea y fase.
- Selecciona beneficiario.
- Selecciona categoría de gasto.
- Registra valor bruto y valor neto.
- Permite impuestos y retenciones.
- Permite adjuntos.
- Estado inicial `BORRADOR`.

### HU-0602. Crear solicitud de reembolso

Como Solicitante, quiero crear una solicitud de reembolso, para recuperar gastos realizados.

Criterios:

- Selecciona categoría de reembolso.
- Registra beneficiario.
- Registra soportes.
- Valida descripción cuando categoría es `OTRO`.

### HU-0603. Crear solicitud de nómina individual

Como Director o Aprobador nivel 1 autorizado, quiero crear una solicitud de nómina individual, para pagar a un trabajador de un proyecto.

Criterios:

- Operativamente, `DIRECTOR` y `APROBADOR_1` crean y administran esta solicitud de nómina cuando tienen `CREAR_SOLICITUDES`.
- `ADMINISTRADOR`, como superadministrador, conserva acceso transversal al módulo.
- Tipo `PAGO_NOMINA`.
- Modalidad `INDIVIDUAL`.
- Selecciona beneficiario tipo `TRABAJADOR`.
- El trabajador no puede tener `NIT` como tipo de documento.
- Selecciona concepto de nómina.
- Registra `periodo_nomina` como el mes correspondiente al pago en formato `YYYY-MM`.
- El periodo es independiente de la fecha de creación y de la fecha efectiva del pago.
- No permite seleccionar meses futuros ni meses de años distintos al vigente.
- Permite `TRANSFERENCIA`, `PSE`, `PORTAL`, `CONSIGNACION` o `EFECTIVO`.
- No permite otra solicitud no anulada con el mismo proyecto, centro, trabajador, concepto y periodo.
- Estado inicial `BORRADOR`.

### HU-0604. Crear solicitud de nómina agrupada por Excel

Como Director o Aprobador nivel 1 autorizado, quiero cargar nómina agrupada, para pagar varios trabajadores de un proyecto asignado.

Criterios:

- Operativamente, `DIRECTOR` y `APROBADOR_1` crean y administran esta solicitud de nómina cuando tienen `CREAR_SOLICITUDES`.
- `ADMINISTRADOR`, como superadministrador, conserva acceso transversal al módulo.
- Modalidad `AGRUPADA_EXCEL`.
- Registra periodo de nómina mediante un selector con los meses disponibles del año vigente hasta el mes actual.
- Carga archivo.
- Valida filas.
- Detecta nuevos beneficiarios.
- Detecta documentos repetidos.
- Permite confirmar carga.
- Crea el detalle de nómina asociado a la solicitud grupal para cada trabajador incluido en el archivo cargado.

### HU-0605. Crear solicitud de pago de impuesto

Como Auxiliar contable o Administrador, quiero crear una solicitud `PAGO_IMPUESTO`, para tramitar una obligación tributaria independiente.

Criterios:

- Registra tipo de impuesto, periodo, entidad beneficiaria y valor.
- Permite `TRANSFERENCIA`, `PSE`, `PORTAL`, `CONSIGNACION` o `EFECTIVO` cuando corresponda.
- Recorre el flujo normal de aprobación.
- Genera movimiento `EGRESO_IMPUESTO_RETENCION` al pagarse.

### HU-0606. Enviar solicitud

Como Solicitante, quiero enviar una solicitud, para iniciar aprobación.

Criterios:

- Solo desde `BORRADOR`.
- Requiere datos mínimos completos.
- Cambia el estado de la solicitud a `PENDIENTE_APROBADOR_1`.
- Registra `enviado_en`.

---

# Épica 7. Adjuntos y soportes

## Objetivo

Permitir la carga, consulta y trazabilidad de archivos asociados a las solicitudes de pago.

## Criterios de aceptación de la épica

- Permite cargar archivos asociados a solicitudes de pago.
- Guarda los metadatos de cada archivo.
- Registra el usuario que realizó la carga.
- Permite consultar los archivos asociados.
- Evita asociar archivos pertenecientes a otro usuario.
- Evita reutilizar un archivo ya asociado.
- Respeta los permisos de acceso.
- Mantiene consistencia transaccional al crear la solicitud y asociar sus archivos.
- Los soportes de creación son opcionales, excepto el archivo origen requerido
  para nómina agrupada.
- Permite elegir un archivo o tomar una fotografía cuando el dispositivo y el
  navegador lo soporten.

## Historias

### HU-0701. Cargar adjunto en solicitud

Como usuario autorizado, quiero adjuntar soportes, para respaldar la solicitud.

Criterios:

- Guarda nombre de archivo.
- Guarda ruta.
- Guarda tipo MIME.
- Guarda usuario que subió.
- Relaciona el archivo con la solicitud.
- Verifica que el archivo pertenezca al usuario autenticado.
- Impide reutilizar un archivo asociado previamente.
- Elimina o revierte los registros correspondientes si falla la creación de la solicitud.
- Acepta PDF, PNG y JPEG dentro del límite configurado.

---

## ÉPICA 8. APROBACIONES Y CORRECCIÓN DEL CICLO DE VIDA DE LAS SOLICITUDES

**Objetivo**

Implementar el ciclo completo de revisión, corrección y aprobación de las solicitudes de pago, desde su creación en estado **BORRADOR** hasta quedar **PROGRAMADA_PAGO**, incluyendo edición, devoluciones, auditoría y control del ciclo de vida documental.

---

### HU-0801. Aprobar solicitudes - Nivel 1

**Estado:** ✅ Terminada

**Descripción**

Permitir que el Aprobador Nivel 1 consulte y apruebe solicitudes pendientes de su revisión.

**Incluye**

- Consulta de solicitudes pendientes.
- Validación de permisos.
- Validación de disponibilidad presupuestal.
- Reserva presupuestal.
- Cambio de estado a `PENDIENTE_APROBADOR_2`.

---

### HU-0802. Consultar solicitudes pendientes de aprobación

**Estado:** ✅ Terminada

**Descripción**

Permitir visualizar las solicitudes agrupadas por proyecto para facilitar el proceso de aprobación.

**Incluye**

- Agrupación por proyecto.
- Totales por proyecto.
- Selección múltiple.
- Consulta de saldos proyectados.
- Validaciones de permisos.

---

### HU-0803. Aprobar solicitudes - Nivel 2

**Estado:** ✅ Terminada

**Descripción**

Permitir que el Aprobador Nivel 2 consulte y apruebe solicitudes previamente aprobadas por el Nivel 1.

**Incluye**

- Consulta de solicitudes en estado `PENDIENTE_APROBADOR_2`.
- Validación de permisos.
- Cambio de estado a `PROGRAMADA_PAGO`.
- Conservación de la reserva presupuestal.
- El saldo proyectado responde a la selección múltiple y se calcula como
  `saldo_actual - total_reservado_seleccionado - reserva_restante`.
- La interfaz separa estado presupuestal y simulación, y no muestra una
  proyección hasta que exista al menos una solicitud seleccionada.

---

### HU-0804. Refactor del ciclo de vida de las solicitudes

**Estado:** ✅ Terminada

**Descripción**

Modificar el flujo documental para que el número oficial de la solicitud únicamente sea generado cuando el solicitante envíe la solicitud a aprobación.

**Incluye**

- El estado `BORRADOR` no genera consecutivo.
- `numero_solicitud` será nullable.
- El UUID continuará identificando internamente la solicitud.
- El consecutivo se generará únicamente al ejecutar **Enviar solicitud**.
- Ajuste de backend.
- Ajuste de frontend.
- Ajuste del modelo de datos.
- Ajuste de documentación.
- Eliminación física de borradores.
- Generación del número oficial dentro de una transacción.

---

### HU-0805. Edición de solicitudes por el Solicitante

**Estado:** ✅ Terminada

**Descripción**

Permitir que el solicitante edite solicitudes antes de iniciar el proceso de aprobación o cuando hayan sido devueltas por el Aprobador Nivel 1.

**Estados**

- `BORRADOR`
- `DEVUELTA_SOLICITANTE`

**En BORRADOR podrá modificar**

- Proyecto base.
- Centro de costo.
- Beneficiario / proveedor.
- Valores.
- Categoría de gasto.
- Medio de pago.
- Concepto.
- Adjuntos.
- Campos específicos según el tipo de solicitud.

**En DEVUELTA_SOLICITANTE podrá modificar**

- Beneficiario / proveedor.
- Valores.
- Categoría de gasto.
- Medio de pago.
- Concepto.
- Adjuntos.
- Campos específicos según el tipo de solicitud.

**No podrá modificar**

- Proyecto base.
- Centro de costo.
- Tipo de solicitud.
- Número de solicitud.

**Incluye**

- Reenvío a aprobación.
- Eliminación física de borradores.
- Anulación de solicitudes cuando las reglas de negocio lo permitan.

---

### HU-0806. Consulta detallada de solicitudes

**Estado:** ✅ Terminada

**Descripción**

Implementar un componente reutilizable para consultar el detalle completo de una solicitud.

**Será utilizado por**

- Solicitante.
- Aprobador Nivel 1.
- Aprobador Nivel 2.

**Incluye**

- Información general.
- Información financiera.
- Beneficiario.
- Proyecto.
- Centro de costo.
- Adjuntos.
- Observaciones.
- Historial.
- Estado actual.

---

### HU-0807. Edición por Aprobador Nivel 1

**Estado:** ✅ Terminada

**Descripción**

Permitir que el Aprobador Nivel 1 realice correcciones funcionales antes de aprobar o devolver una solicitud.

**Estados**

- `PENDIENTE_APROBADOR_1`
- `DEVUELTA_APROBADOR_1`

**Podrá modificar**

- Valor factura.
- Impuestos y retenciones en un único valor consolidado.
- Descuentos.
- Beneficiario / proveedor.
- Categoría de gasto.
- Medio de pago.
- Concepto de pago.
- Adjuntos.

**No podrá modificar**

- Proyecto base.
- Centro de costo.
- Tipo de solicitud.
- Número de solicitud.
- Solicitante.

**Incluye**

- Recalcular valor neto.
- Actualizar reserva presupuestal cuando corresponda.
- Aprobar.
- Devolver al solicitante.
- Los eventos de modificación serán consolidados por HU-0809.

---

### HU-0808. Gestión de solicitudes por Aprobador Nivel 2

**Estado:** ✅ Terminada

**Descripción**

Permitir que el Aprobador Nivel 2 consulte el detalle completo de la solicitud y decida aprobarla o devolverla al Nivel 1.

**Incluye**

- Consulta detallada.
- Descarga de adjuntos.
- Aprobar.
- Devolver al Aprobador Nivel 1.
- Registro obligatorio del motivo de devolución.

**No permite**

- Edición de datos.
- Edición de adjuntos.

### HU-0810. Devolver o anular solicitudes durante la aprobación

**Estado:** ✅ Terminada

**Incluye**

- Devolución individual o múltiple con motivo obligatorio.
- Nivel 1 devuelve a `DEVUELTA_SOLICITANTE`.
- Nivel 2 devuelve a `DEVUELTA_APROBADOR_1` y conserva la reserva vigente.
- La devolución posterior al solicitante libera la reserva.
- Anulación individual o múltiple exclusivamente desde nivel 1.
- La anulación solo aplica a `PENDIENTE_APROBADOR_1`, es terminal, no genera
  movimiento financiero y conserva auditoría.
- Detalle de la solicitud al seleccionar una fila y totales por tabla.

---

### HU-0809. Historial y auditoría

**Estado:** ✅ Terminada

**Descripción**

Registrar completamente el historial documental y funcional de las solicitudes de pago.

**Debe registrar**

- Creación del borrador.
- Generación del número oficial.
- Envío a aprobación.
- Cambios de estado.
- Aprobaciones.
- Devoluciones.
- Reenvíos.
- Modificaciones realizadas por solicitante.
- Modificaciones realizadas por Aprobador Nivel 1.
- Carga de adjuntos.
- Eliminación de adjuntos.
- Eliminación de borradores.
- Anulación de solicitudes.

---

### Flujo funcional de la Épica

```text
BORRADOR
        │
        ├── Editar
        ├── Eliminar
        └── Enviar solicitud
                │
                ▼
      PENDIENTE_APROBADOR_1
                │
        ┌───────┴────────┐
        │                │
   Devolver         Aprobar
        │                │
        ▼                ▼
DEVUELTA_SOLICITANTE   PENDIENTE_APROBADOR_2
        │                │
        │        ┌───────┴────────┐
        │        │                │
        │    Devolver         Aprobar
        │        │                │
        ▼        ▼                ▼
PENDIENTE_APROBADOR_1  DEVUELTA_APROBADOR_1
                             │
                             ▼
                    PENDIENTE_APROBADOR_2
                             │
                             ▼
                     PROGRAMADA_PAGO
```

**Resultado esperado de la Épica**

Al finalizar esta épica, el sistema contará con un ciclo completo de revisión y aprobación de solicitudes, incluyendo edición, devoluciones, auditoría, generación diferida del consecutivo y control integral del ciclo de vida documental antes de la ejecución del pago.
---

# Épica 9. Pagos

## Objetivo

Permitir que el rol Pagos marque solicitudes como pagadas.

**Estado de la épica: COMPLETADA**

## Criterios de aceptación de la épica

- Solo opera solicitudes en `PROGRAMADA_PAGO`.
- No programa pagos.
- No aprueba.
- Registra la referencia de la transacción de pago y permite asociar el soporte correspondiente cuando aplique.
- Crea movimiento financiero.
- Soporta pagos directos (`TRANSFERENCIA`, `PSE`, `PORTAL`) y retiros para
  `EFECTIVO` o `CONSIGNACION`.

## Historias

### HU-0901. Ver bandeja de pagos

**Estado: COMPLETADA**

Como usuario de Pagos, quiero ver solicitudes en `PROGRAMADA_PAGO`, para gestionar pagos.

Criterios:

- Muestra beneficiario.
- Muestra proyecto base.
- Muestra centro de costo operativo.
- Muestra valor neto.
- Muestra medio de pago.
- Permite filtrar.
- Permite abrir el detalle de la solicitud desde la fila.
- Muestra el total de la bandeja filtrada y el total de la selección activa.
- Permite descargar en Excel la relación completa de solicitudes en `PROGRAMADA_PAGO`, con datos de solicitud, beneficiario y fechas del proceso.

### HU-0902. Marcar pago electrónico directo como pagado

**Estado: COMPLETADA**

Como usuario de Pagos, quiero marcar un pago electrónico directo como pagado,
para cerrar la solicitud.

Criterios:

- Aplica a `TRANSFERENCIA`, `PSE` o `PORTAL`.
- Permite seleccionar una o varias solicitudes.
- Cada solicitud exige referencia y soporte de pago propios.
- Muestra saldo actual, total seleccionado y saldo proyectado por proyecto.
- Crea `EGRESO_SOLICITUD_PAGO`.
- Cambia solicitud a `PAGADA`.
- Registra `pagado_en`.
- La fecha y hora son asignadas por el servidor; cualquier fecha enviada por un
  cliente anterior se ignora.
- El soporte puede seleccionarse como archivo o capturarse con la cámara.

### HU-0903. Marcar pago en efectivo

**Estado: COMPLETADA**

Como usuario de Pagos, quiero registrar pago en efectivo, para controlar retiro y pago.

Criterios:

- Crea `operaciones_efectivo`.
- Permite agrupar una o varias solicitudes con medio de pago `EFECTIVO` o `CONSIGNACION`.
- Todas las solicitudes del retiro pertenecen al mismo proyecto base y fondo.
- Registra valor requerido.
- Registra valor retirado.
- Registra valor pagado.
- Calcula sobrante.
- Exige soporte general del retiro y soporte de cada pago.
- Las consignaciones exigen referencia propia.
- Descuenta el valor retirado una única vez del fondo del proyecto.
- Cambia solicitud a `PAGADA`.
- La fecha y hora del retiro y de los pagos son asignadas por el servidor.
- Los soportes pueden seleccionarse como archivo o capturarse con la cámara.

---

# Épica 10. Fondos y movimientos financieros

## Objetivo

Controlar el fondo general del proyecto base y registrar todos los ingresos y egresos con imputación a centros de costo, líneas de negocio y fases.

Actualización de alcance:

- El fondo principal del MVP es general por proyecto base.
- Los centros de costo no tienen fondo independiente.
- Los centros de costo permiten imputar gasto a `PRO-OBRA`, `OBRA`, `PRO-INT` o `INT`.
- Los préstamos generales, anticipos, pagos, cargos financieros, impuestos, retiros de efectivo y reingresos afectan el fondo general.
- El seguimiento del gasto se hace mediante movimientos relacionados con el centro de costo operativo que originó la operación.

## Criterios de aceptación de la épica

- Cada proyecto base tiene un fondo general.
- Los centros de costo imputan movimientos contra el fondo general.
- Todo impacto financiero se registra en movimientos financieros.
- Cada movimiento tiene saldo anterior y saldo nuevo.
- Cada movimiento tiene dirección `INGRESO` o `EGRESO`.
- Cada movimiento puede relacionarse con proyecto base, centro de costo, solicitud, préstamo, devolución, anticipo, cargo financiero, impuesto, retención u operación de efectivo.
- El sistema impide saldo negativo.
- La actualización de saldo es transaccional.

## Historias

### HU-1001. Consultar saldo del fondo general

**Estado: COMPLETADA**

Como usuario autorizado, quiero consultar el saldo del fondo general del proyecto base, para conocer disponibilidad real.

Criterios:

- Muestra saldo actual.
- Muestra proyecto base.
- Muestra fondo general.
- Muestra centros de costo relacionados.
- Permite analizar gasto acumulado por línea y fase.
- Respeta permisos.

Implementación:

- Endpoint `GET /api/v1/fondos`.
- Permiso `CONSULTAR_FONDOS`.
- Vista responsive `/fondos`.
- `DIRECTOR` limitado por proyecto y línea; `APROBADOR_1`, `APROBADOR_2` y
  roles financieros con visibilidad total.
- El gasto de retiros se imputa mediante sus solicitudes y no duplica el
  movimiento general del retiro.

### HU-1002. Registrar movimiento financiero

**Estado: COMPLETADA**

Como sistema, quiero registrar movimientos financieros, para actualizar el fondo general y conservar trazabilidad de imputación.

Criterios:

- Registra tipo de movimiento.
- Registra dirección.
- Registra valor.
- Registra saldo anterior.
- Registra saldo nuevo.
- Relaciona entidad origen si aplica.
- Relaciona proyecto base.
- Relaciona centro de costo cuando aplique.
- Actualiza saldo del fondo general.
- Ejecuta actualización en transacción.

Implementación:

- Servicio financiero reutilizable en el módulo `fondos`.
- Valida que el fondo esté activo y pertenezca al proyecto.
- Valida la correspondencia del centro de costo y de las entidades origen.
- Impide egresos superiores al saldo disponible mediante una actualización
  atómica.
- Impide duplicar movimientos por pago y por tipo de operación de efectivo.
- Registra el saldo anterior, el saldo nuevo y la actualización del fondo en
  la misma transacción serializable.
- Integrado en pagos electrónicos directos, retiros de efectivo y reintegros
  inmediatos.
- No expone un endpoint independiente: el movimiento se origina desde la
  operación funcional que afecta el saldo.

### HU-1003. Consultar movimientos por centro de costo, línea y fase

**Estado: COMPLETADA**

Como usuario financiero, quiero ver movimientos por centro de costo, línea y fase, para analizar gasto en licitación, obra e interventoría.

Criterios:

- Filtra por proyecto base.
- Filtra por centro de costo.
- Filtra por línea de negocio.
- Filtra por fase de centro de costo.
- Filtra por dirección.
- Filtra por tipo de movimiento.
- Muestra saldo anterior y saldo nuevo.

Implementación:

- Endpoint `GET /api/v1/fondos/movimientos`.
- Reutiliza el permiso `CONSULTAR_FONDOS`.
- Filtros por proyecto, centro de costo, línea, fase, dirección y tipo.
- Los roles financieros consultan todos los movimientos.
- Los usuarios con acceso restringido consultan únicamente movimientos
  imputados a sus proyectos y líneas autorizadas.
- Vista integrada en `/fondos`, con tabla para escritorio y tarjetas para
  dispositivos móviles.
- Muestra fecha, origen, valor, saldo anterior y saldo nuevo.

---

# Épica 11. Operaciones de efectivo

## Objetivo

Completar el seguimiento operativo del retiro agrupado implementado en
HU-0903, sin duplicar el registro de pagos ni la gestión financiera
desarrollada en la Épica 10.

## Base ya implementada

- Agrupación de solicitudes en `EFECTIVO` o `CONSIGNACION`.
- Restricción al mismo proyecto base y fondo.
- Registro de `operaciones_efectivo` y
  `detalles_operacion_efectivo`.
- Soporte general del retiro y soporte individual de cada pago.
- Cambio transaccional de solicitudes a `PAGADA`, sin duplicar el egreso.
- Movimiento `EGRESO_RETIRO_EFECTIVO` y actualización del fondo mediante el
  servicio financiero común de HU-1002.
- Reintegro inmediato opcional mediante
  `INGRESO_REINTEGRO_EFECTIVO`, también integrado con HU-1002.
- Consulta del movimiento general del retiro, sus saldos anterior y nuevo y
  sus filtros financieros mediante HU-1003.

La consulta financiera de HU-1003 muestra la afectación general del fondo,
pero no reemplaza el detalle operativo del retiro, sus solicitudes, soportes
y sobrante pendiente.

## Criterios de aceptación de la épica

- Permite consultar el detalle operativo desde el movimiento general del
  retiro o desde el módulo de operaciones de efectivo.
- Permite uno o varios reingresos asociados al retiro.
- Controla el saldo pendiente de reintegro.
- Incorpora estados y transiciones propios para el seguimiento de la operación.
- Permite ajustes y anulaciones con trazabilidad.
- Si un proyecto no tiene saldo suficiente, exige registrar previamente el
  préstamo correspondiente mediante las operaciones implementadas en las
  HU-1402 y HU-1403.

## Historias

### HU-1101. Consultar y dar seguimiento a retiros

**Estado: COMPLETADA**

Como usuario de Pagos, quiero consultar las operaciones de efectivo
registradas, para hacer seguimiento a sus pagos y sobrantes.

Criterios:

- Lista `operaciones_efectivo`.
- Muestra las solicitudes de `detalles_operacion_efectivo`.
- Muestra valores requerido, retirado, pagado, sobrante y reintegrado.
- Permite filtrar por proyecto, fondo y fecha.
- Identifica operaciones con sobrante pendiente.
- Permite abrir el detalle desde un movimiento
  `EGRESO_RETIRO_EFECTIVO`.
- No vuelve a calcular ni registrar la afectación financiera realizada por
  HU-1002.

Implementación:

- Endpoint `GET /api/v1/operaciones-efectivo`.
- Filtros por proyecto, fondo y rango de fechas.
- Vista responsive `/pagos/retiros`, integrada al módulo Pagos.
- Tabla para escritorio, tarjetas para móvil y modal de detalle.
- Muestra soportes del retiro y de cada solicitud mediante un endpoint
  autenticado.
- Calcula valores reintegrado y pendiente desde
  `INGRESO_REINTEGRO_EFECTIVO`.
- Identifica operaciones sin sobrante, con reingreso pendiente o totalmente
  reintegradas.
- Los movimientos `EGRESO_RETIRO_EFECTIVO` enlazan al detalle operativo.
- No crea pagos, movimientos ni actualizaciones de saldo.

### HU-1102. Cargar soporte de reingreso posterior

**Estado: COMPLETADA**

Como usuario de Pagos, quiero cargar el soporte de cada reingreso posterior,
para completar la trazabilidad de la operación de efectivo.

Criterios:

- Reutiliza los soportes de retiro y pago ya implementados en HU-0903.
- Permite agregar soporte de reingreso posterior.
- Relaciona el soporte con el registro de reingreso y con
  `operaciones_efectivo`.
- No permite registrar un reingreso posterior sin soporte.

Implementación:

- El soporte es obligatorio en
  `POST /api/v1/operaciones-efectivo/{id}/reingresos`.
- Admite PDF, PNG, JPG o JPEG, máximo 10 MB.
- Relaciona el adjunto con `reingresos_sobrante_efectivo` y con la operación.
- Permite consultar el soporte desde el historial del retiro.
- El archivo se elimina si la transacción financiera falla.

### HU-1103. Registrar reingreso de sobrante

**Estado: COMPLETADA**

Como usuario autorizado, quiero registrar un reingreso contra el retiro, para devolver el sobrante al fondo correspondiente.

Criterios:

- Extiende el reintegro inmediato ya disponible, sin duplicarlo.
- Solo si existe sobrante pendiente.
- Se asocia a `operacion_efectivo_id`, no a una solicitud individual.
- Permite reingresos parciales.
- La suma reingresada no supera el sobrante.
- No pasa por aprobación.
- Crea `reingresos_sobrante_efectivo`.
- Crea movimiento `INGRESO_REINTEGRO_EFECTIVO`.
- Actualiza saldo y estado del retiro.

Implementación:

- Crea `reingresos_sobrante_efectivo` con referencia `REI`.
- Permite reingresos parciales sucesivos.
- Calcula el pendiente desde los movimientos existentes e impide excederlo.
- Usa la fecha y hora del sistema.
- Crea `INGRESO_REINTEGRO_EFECTIVO` sobre el fondo del retiro.
- Actualiza `sobrante_reintegrado` cuando el pendiente llega a cero.
- Registra reingreso, soporte, movimiento y fondo en una transacción
  serializable.
- Integra el formulario y el historial en `/pagos/retiros`.

### HU-1104. Consultar pendientes de reingreso

**Estado: COMPLETADA**

Como usuario financiero, quiero consultar retiros con sobrante pendiente, para hacer seguimiento.

Criterios:

- Lista retiros con `SOBRANTE_PENDIENTE_REINGRESO`.
- Muestra solicitudes incluidas.
- Muestra distribución por fondo, proyecto y centro.
- Muestra valor requerido, retirado, reingresado y pendiente.
- Permite exportar.

Implementación:

- Extiende `GET /api/v1/operaciones-efectivo` con el filtro
  `solo_pendientes=true`.
- Conserva los filtros por proyecto, fondo y rango de fechas.
- Muestra totales de retiros, proyectos, fondos y valor pendiente.
- Incluye las solicitudes y su centro de costo en el detalle operativo.
- Exporta en CSV los resultados filtrados, con una fila por solicitud y su
  distribución por proyecto, fondo y centro de costo.
- Mantiene la tabla para escritorio y las tarjetas responsive para móvil.

### HU-1105. Ajustar una operación de efectivo

**Estado: COMPLETADA**

Como usuario autorizado, quiero ajustar una operación de efectivo,
para corregir errores sin eliminar su trazabilidad.

Criterios:

- No elimina ni modifica movimientos financieros históricos.
- Exige motivo y registra usuario, fecha y observación.
- Genera movimientos compensatorios cuando exista afectación del saldo.
- Actualiza el estado de la operación.
- Conserva las solicitudes, pagos y soportes relacionados para consulta.

Implementación:

- Conserva los estados históricos `ACTIVA`, `AJUSTADA` o `ANULADA` de la operación.
- Registra cada acción en `correcciones_operacion_efectivo` con referencia
  `COR`, motivo, observación, usuario y fecha del sistema.
- Los ajustes crean un movimiento compensatorio de ingreso o egreso.
- Los ajustes actualizan el pendiente operativo y conservan sus valores
  anterior y nuevo para impedir reingresos duplicados.
- Ejecuta corrección, movimiento, cambio de saldo y estado en una transacción
  serializable.
- No permite registrar nuevas anulaciones; las existentes permanecen en el historial.
- Muestra el formulario y el historial dentro del detalle del retiro.

---

# Épica 12. Impuestos y retenciones

## Objetivo

Registrar de forma consolidada los impuestos y retenciones asociados a una
solicitud, sin confundirlos con cargos financieros.

## Criterios de aceptación de la épica

- Registra un único valor de impuestos y retenciones por solicitud.
- Calcula `valor_neto = valor_bruto - valor_impuestos_retenciones - valor_descuentos`.
- No los registra como cargos financieros.
- No crea aprobación independiente.
- Permite ajuste con auditoría.
- Si generan egreso independiente, se registra en `movimientos_fondo_centro_costo`.

## Historias

### HU-1201. Registrar impuestos y retenciones en la solicitud

Como usuario autorizado, quiero registrar el valor consolidado de impuestos y
retenciones, para calcular correctamente el valor neto sin duplicar descuentos.

Criterios:

- Usa el campo físico `valor_impuestos_retenciones` de `solicitudes_pago`.
- Presenta un único campo visible como **Impuestos y retenciones**.
- Valida un valor no negativo.
- Descuenta el valor una sola vez al calcular el neto.
- El desglose tributario detallado, si se requiere posteriormente, deberá ser
  una ampliación explícita y no recrear dos totales paralelos.

### HU-1202. Ajustar impuesto o retención

Como usuario autorizado, quiero ajustar un registro tributario, para corregir errores.

Criterios:

- Cambia estado a `AJUSTADO`.
- Exige motivo.
- Registra usuario y fecha.
- Registra auditoría.

### HU-1203. Registrar movimiento financiero al pagar una solicitud de impuesto

Como sistema, quiero registrar el movimiento financiero cuando una solicitud de pago de impuesto sea marcada como pagada, para mantener la trazabilidad del fondo general.

Criterios:

- Se ejecuta únicamente cuando una solicitud de tipo `PAGO_IMPUESTO` cambia al estado `PAGADA`.
- Crea el movimiento financiero `EGRESO_IMPUESTO_RETENCION`.
- Relaciona el movimiento con la solicitud de pago correspondiente.
- Actualiza el saldo del fondo general del proyecto.
- La operación es transaccional.
- Registra auditoría.

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

Como usuario autorizado, quiero registrar un cargo financiero, para afectar el fondo general e imputarlo al centro operativo correspondiente.

Criterios:

- Selecciona centro de costo.
- Selecciona línea y fase cuando aplique.
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

# Épica 14. Préstamos, anticipos y devoluciones

**Prioridad actual: SIGUIENTE ÉPICA — se desarrolla antes de la Épica 11.**

## Objetivo

Registrar entradas y salidas financieras asociadas a préstamos, anticipos y devoluciones.

## Criterios de aceptación de la épica

- Permite préstamos generales a un proyecto base.
- Permite asociar el uso del préstamo a solicitudes de distintas líneas y fases.
- Permite préstamos entre proyectos base cuando aplique.
- Permite anticipos.
- Permite devoluciones.
- Cada operación que afecte saldo genera movimiento financiero.
- Se conserva saldo pendiente de préstamos.

## Historias

### HU-1401. Registrar anticipo

**Estado: COMPLETADA**

Como usuario autorizado, quiero registrar un anticipo, para aumentar el saldo del fondo general del proyecto base.

Criterios:

- Crea registro en `anticipos`.
- Se relaciona únicamente con el proyecto base y su fondo general.
- Registra la entidad aportante, identificación, fecha, valor, soporte y
  observación opcional.
- Selecciona la entidad desde el catálogo de beneficiarios y conserva una
  copia histórica de su identificación.
- No se imputa a un centro de costo; esa imputación ocurre cuando los recursos
  se utilicen.
- Crea movimiento `INGRESO_ANTICIPO`.
- Actualiza saldo.
- Registra referencia, usuario y fecha para auditoría.

Implementación:

- Endpoint `POST /api/v1/anticipos`.
- Vista responsive `/financiacion`, pestaña Anticipos.
- Permiso `REGISTRAR_ANTICIPOS` para `ADMINISTRADOR` y
  `AUXILIAR_CONTABLE`.
- Consecutivo `ANT` por proyecto y año.
- Soporte obligatorio PDF, PNG, JPG o JPEG, máximo 10 MB.
- El anticipo, soporte, movimiento y actualización del fondo se registran en
  una transacción serializable.
- La fecha y hora se toman del sistema al registrar; el usuario no puede
  seleccionarlas.

### HU-1402. Registrar préstamo general de persona a proyecto

**Estado: COMPLETADA**

Como usuario autorizado, quiero registrar préstamo de una persona a un proyecto base, para controlar financiación externa general.

Criterios:

- Crea `prestamos_proyecto`.
- Tipo `PERSONA_A_PROYECTO` o equivalente vigente en el modelo.
- Asocia el préstamo al proyecto base y fondo general.
- Crea movimiento de ingreso.
- Actualiza saldo pendiente.
- Permite que las solicitudes posteriores descuenten del mismo fondo general sin dividir el préstamo por línea.
- Selecciona el acreedor desde beneficiarios para evitar terceros duplicados.
- Conserva una copia histórica del nombre e identificación del acreedor.

Implementación:

- Endpoint `POST /api/v1/prestamos`.
- Vista responsive `/financiacion`, pestaña Préstamos.
- Permiso `REGISTRAR_PRESTAMOS` para `ADMINISTRADOR` y
  `AUXILIAR_CONTABLE`.
- Soporte obligatorio y consecutivo `PRE` por proyecto y año.
- Crea `INGRESO_PRESTAMO_PERSONA` y aumenta el fondo en la misma transacción.
- Inicializa `saldo_pendiente` con el valor total del préstamo.
- Anticipos y préstamos buscan el tercero por nombre o documento desde un
  único módulo de financiación.
- La fecha y hora se toman del sistema al registrar; el usuario no puede
  seleccionarlas.

### HU-1403. Registrar préstamo entre proyectos

**Estado: COMPLETADA**

Como usuario autorizado, quiero registrar préstamo entre proyectos base, para controlar traslado temporal de recursos.

Criterios:

- Tipo `PROYECTO_A_PROYECTO`.
- Crea egreso en proyecto/fondo origen.
- Crea ingreso en proyecto/fondo destino.
- Actualiza saldos de ambos fondos.
- Registra auditoría.

Implementación:

- Endpoint `POST /api/v1/prestamos/entre-proyectos`.
- Vista responsive `/financiacion`, pestañas Préstamos y Entre proyectos.
- Permiso `REGISTRAR_PRESTAMOS` para `ADMINISTRADOR` y
  `AUXILIAR_CONTABLE`.
- Exige proyectos origen y destino diferentes, valor positivo y soporte.
- No permite seleccionar fecha; usa la fecha y hora del sistema al registrar.
- Crea `EGRESO_PRESTAMO_PROYECTO` e `INGRESO_PRESTAMO_PROYECTO` con la misma
  referencia.
- Inicializa el saldo pendiente y actualiza ambos fondos en una transacción
  serializable. El egreso exige saldo suficiente en el fondo origen.

### HU-1404. Registrar devolución de préstamo

**Estado: COMPLETADA**

Como usuario autorizado, quiero registrar devolución, para disminuir saldo pendiente.

Criterios:

- Crea `devoluciones_prestamo`.
- Crea movimiento financiero.
- Actualiza saldo pendiente.
- Cambia estado del préstamo si queda pagado.

Implementación:

- Consulta préstamos `ACTIVO` o `PARCIALMENTE_DEVUELTO` mediante
  `GET /api/v1/prestamos`.
- Registra devoluciones mediante `POST /api/v1/prestamos/devoluciones`.
- Vista responsive `/financiacion`, pestañas Préstamos y Devoluciones.
- Exige valor positivo, soporte y saldo suficiente en el fondo del proyecto
  que devuelve.
- Impide devolver más que el saldo pendiente y usa fecha y hora del sistema.
- Para persona a proyecto crea un egreso; para préstamo entre proyectos crea
  el egreso del destino y el ingreso del origen con una misma referencia.
- Conserva saldo anterior y nuevo, soporte, usuario y movimientos relacionados
  en `devoluciones_prestamo`.
- Cambia el préstamo a `PARCIALMENTE_DEVUELTO` o `SALDADO` en una transacción
  serializable.

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
- Incluye línea de negocio y fase.
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
- Valida permisos.
- Valida acceso por proyecto y línea de negocio.
- Valida centro operativo cuando aplique.
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

---

# Épica 19. Notificaciones por WhatsApp

## Estado

**EN DESARROLLO — HU-1901 a HU-1904 terminadas; HU-1905 en ejecución.**

## Objetivo

Notificar a los responsables cuando una solicitud avance o sea devuelta en el
flujo de aprobación, sin convertir WhatsApp en fuente de verdad ni alterar la
máquina de estados del sistema.

## Criterios de aceptación de la épica

- Usa WhatsApp Business Platform mediante la aplicación `Obras WebApp | STG`
  para staging y `Obras WebApp` para producción.
- Los ambientes tienen URL de webhook, token de verificación, credenciales y
  plantillas independientes.
- El cambio de estado se confirma aunque WhatsApp esté temporalmente caído.
- Cada notificación conserva destinatario, evento, estado de entrega, intentos
  y respuesta del proveedor.
- Los envíos usan plantillas aprobadas por Meta cuando corresponda.
- Los webhooks validan el token de verificación y la firma de Meta.
- Los eventos repetidos se procesan de forma idempotente.
- La integración admite destinatarios identificados por teléfono o por
  Business-Scoped User ID (`BSUID`) sin depender de que Meta siempre entregue
  el número telefónico en el webhook.

## Destinatarios por transición

| Transición | Destinatario |
|---|---|
| `BORRADOR` → `PENDIENTE_APROBADOR_1` | Aprobadores nivel 1 autorizados para el proyecto |
| `PENDIENTE_APROBADOR_1` → `PENDIENTE_APROBADOR_2` | Aprobadores nivel 2 autorizados para el proyecto |
| `PENDIENTE_APROBADOR_2` → `DEVUELTA_APROBADOR_1` | Aprobador nivel 1 responsable |
| `DEVUELTA_APROBADOR_1` → `PENDIENTE_APROBADOR_2` | Aprobadores nivel 2 autorizados para el proyecto |
| `PENDIENTE_APROBADOR_1` → `DEVUELTA_SOLICITANTE` | Usuario solicitante |
| `DEVUELTA_SOLICITANTE` → `PENDIENTE_APROBADOR_1` | Aprobadores nivel 1 autorizados para el proyecto |
| `PENDIENTE_APROBADOR_2` → `PROGRAMADA_PAGO` | Usuarios activos con rol `PAGOS` |

## Historias

### HU-1901. Configurar integración de WhatsApp por ambiente

**Estado: TERMINADA Y FUSIONADA EN `dev`.**

Como administrador del sistema, quiero configurar WhatsApp de forma aislada
por ambiente, para probar sin enviar mensajes desde producción.

Criterios:

- Configura número, WABA, aplicación, token y plantillas para staging.
- Configura credenciales independientes para producción.
- Guarda secretos únicamente en variables de entorno.
- Documenta términos, medio de pago y publicación requeridos por Meta.

### HU-1902. Recibir y validar webhooks de Meta

**Estado: TERMINADA Y FUSIONADA EN `dev`.**

Como sistema, quiero recibir webhooks verificados, para conocer mensajes y
estados de entrega.

Criterios:

- Expone verificación `GET` y recepción `POST` sobre HTTPS.
- Valida el token de verificación en el alta del webhook.
- Valida `X-Hub-Signature-256` antes de procesar eventos.
- Responde oportunamente y procesa lotes de forma segura.
- Suscribe los campos necesarios de mensajes y estados.

### HU-1903. Crear notificaciones al cambiar una solicitud de estado

**Estado: TERMINADA Y FUSIONADA EN `dev`.**

Como responsable del proceso, quiero recibir información de la solicitud que
requiere mi atención, para actuar oportunamente.

Criterios:

- Crea la notificación dentro de la misma operación lógica del cambio de estado.
- Incluye consecutivo, proyecto, beneficiario, valor, nuevo estado y enlace.
- Resuelve destinatarios según rol y acceso al proyecto.
- Conserva el teléfono del destinatario con prefijo `57` y solo dígitos.
- Notifica al rol `PAGOS` cuando la solicitud queda `PROGRAMADA_PAGO`.
- Evita duplicados por solicitud, transición y destinatario.

### HU-1904. Enviar notificaciones de forma asíncrona

**Estado: TERMINADA Y FUSIONADA EN `dev`.**

Como sistema, quiero reintentar los envíos sin bloquear aprobaciones, para
mantener el flujo operativo disponible.

Criterios:

- Maneja estados `PENDIENTE`, `ENVIANDO`, `ENVIADA`, `ENTREGADA`, `LEIDA` y
  `FALLIDA`.
- Registra número de intentos, último error e identificador del mensaje Meta.
- Aplica reintentos controlados y no duplica mensajes confirmados.
- Una falla de WhatsApp no revierte el estado de la solicitud.

### HU-1905. Procesar estados e idempotencia del webhook

**Estado: EN DESARROLLO.**

Como administrador, quiero trazabilidad de recepción y entrega, para diagnosticar
mensajes que no llegaron.

Criterios:

- Conserva el identificador único de cada evento recibido.
- Ignora eventos ya procesados.
- Actualiza los estados de entrega sin retroceder estados confirmados.
- Registra eventos inválidos o no reconocidos sin afectar el servicio.
- Correlaciona los estados `sent`, `delivered`, `read` y `failed` con la
  notificación mediante el identificador de mensaje Meta (`wamid`).
- Admite `recipient_id` o `wa_id` como teléfono cuando estén disponibles y
  `recipient_user_id` o `user_id` como `BSUID`.
- Conserva el teléfono y el `BSUID` como identificadores complementarios, sin
  exigir que ambos estén presentes en el mismo evento.
- Admite `contacts[].user_id` para mensajes entrantes y no falla cuando Meta
  omite el número debido al uso de nombres de usuario de WhatsApp.
- Mantiene compatibilidad con los webhooks anteriores que solo informan el
  número telefónico.

### HU-1906. Consultar y reintentar notificaciones

Como administrador, quiero consultar los envíos y reintentar fallos, para dar
soporte a la operación.

Criterios:

- Permite filtrar por solicitud, ambiente, destinatario, fecha y estado.
- Muestra intentos y último error sin exponer secretos.
- Permite reintentar únicamente notificaciones fallidas.
- La acción exige permiso administrativo y queda auditada.
