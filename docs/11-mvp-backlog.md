# 11. Backlog MVP

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
| Beneficiarios | PENDIENTE | Siguiente módulo funcional sugerido antes de solicitudes |
| Solicitudes de pago | PENDIENTE | Siguiente bloque principal después de beneficiarios y secuencias |

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
- `SOLICITANTE` queda limitado a `OBRA`.
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

Estado:

- Implementada infraestructura base de secuencias documentales mediante `secuencias_documentales`.
- La integración con `solicitudes_pago.numero_solicitud` se realiza al implementar Épica 6, cuando exista el módulo de solicitudes de pago.

### HU-0502. Generar referencia de movimiento financiero

Como sistema, quiero generar referencia de movimiento, para auditar ingresos y egresos.

Criterios:

- Es única.
- Se guarda en `movimientos_fondo_centro_costo.referencia_sistema`.
- Permite filtrar por centro de costo.

Estado:

- Diferida a la épica/módulo donde se implemente `movimientos_fondo`.
- La infraestructura de secuencias queda lista en Épica 5, pero la asignación efectiva de `referencia_sistema` debe integrarse cuando exista el flujo transaccional de movimientos financieros.
- Nota de alineación técnica: el modelo vigente usa `movimientos_fondo.referencia_sistema`; la referencia a `movimientos_fondo_centro_costo` queda como nombre histórico del backlog.

### HU-0503. Generar referencias de cargos y efectivo

Como sistema, quiero generar referencias para cargos financieros y operaciones de efectivo, para trazabilidad.

Criterios:

- Cargos financieros tienen referencia.
- Operaciones de efectivo tienen referencia.
- Reingresos pueden tener referencia documental externa.

Estado:

- Diferida a las épicas/módulos donde se implementen `cargos_financieros` y `operaciones_efectivo`.
- La infraestructura de secuencias queda lista en Épica 5, pero la asignación efectiva de referencias debe integrarse con los flujos propios de cargos financieros y operaciones de efectivo.

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
- Permite otro pago.
- Calcula valor neto.
- Permite adjuntos.
- Permite impuestos y retenciones.
- Valida medio de pago.
- Valida categoría o concepto según tipo.

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

Como usuario autorizado, quiero crear una solicitud de nómina individual, para pagar a un trabajador.

Criterios:

- Tipo `PAGO_NOMINA`.
- Modalidad `INDIVIDUAL`.
- Selecciona beneficiario tipo `TRABAJADOR`.
- Selecciona concepto de nómina.

### HU-0604. Crear solicitud de nómina agrupada por Excel

Como usuario autorizado, quiero cargar nómina agrupada, para pagar varios trabajadores.

Criterios:

- Modalidad `AGRUPADA_EXCEL`.
- Carga archivo.
- Valida filas.
- Detecta nuevos beneficiarios.
- Detecta documentos repetidos.
- Permite confirmar carga.
- Crea ítems de solicitud.

### HU-0605. Enviar solicitud

Como Solicitante, quiero enviar una solicitud, para iniciar aprobación.

Criterios:

- Solo desde `BORRADOR`.
- Requiere datos mínimos completos.
- Cambia a `PENDIENTE_APROBADOR_1`.
- Registra `enviado_en`.

---

# Épica 7. Adjuntos y soportes

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

### HU-0701. Cargar adjunto en solicitud

Como usuario autorizado, quiero adjuntar soportes, para respaldar la solicitud.

Criterios:

- Guarda nombre de archivo.
- Guarda ruta.
- Guarda tipo MIME.
- Guarda usuario que subió.
- Relaciona con solicitud.

### HU-0702. Cargar soporte de operación de efectivo

Como usuario de Pagos, quiero cargar soporte de retiro, pago y reingreso, para trazabilidad.

Criterios:

- Permite soporte de retiro.
- Permite soporte de pago.
- Permite soporte de reingreso.
- Relaciona con `operaciones_efectivo`.

---

# Épica 8. Aprobaciones

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

### HU-0801. Aprobar nivel 1

Como Aprobador 1, quiero aprobar solicitudes, para enviarlas a segundo nivel.

Criterios:

- Solo desde `PENDIENTE_APROBADOR_1`.
- Cambia a `PENDIENTE_APROBADOR_2`.
- Registra usuario y fecha.

### HU-0802. Devolver al Solicitante

Como Aprobador 1, quiero devolver solicitudes, para que sean corregidas.

Criterios:

- Cambia a `DEVUELTA_SOLICITANTE`.
- Exige comentario.
- Registra historial.

### HU-0803. Aprobar nivel 2

Como Aprobador 2, quiero aprobar solicitudes, para dejarlas listas para pago.

Criterios:

- Solo desde `PENDIENTE_APROBADOR_2`.
- Cambia a `PROGRAMADA_PAGO`.
- No usa estado operativo `APROBADA`.
- Registra `aprobado_2_en`.

### HU-0804. Devolver a Aprobador 1

Como Aprobador 2, quiero devolver solicitudes a Aprobador 1, para revisión previa.

Criterios:

- Cambia a `DEVUELTA_APROBADOR_1`.
- Exige comentario.
- Registra historial.

---

# Épica 9. Pagos

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

### HU-0901. Ver bandeja de pagos

Como usuario de Pagos, quiero ver solicitudes en `PROGRAMADA_PAGO`, para gestionar pagos.

Criterios:

- Muestra beneficiario.
- Muestra proyecto base.
- Muestra centro de costo operativo.
- Muestra valor neto.
- Muestra medio de pago.
- Permite filtrar.

### HU-0902. Marcar transferencia como pagada

Como usuario de Pagos, quiero marcar una transferencia como pagada, para cerrar la solicitud.

Criterios:

- Solo si medio de pago es `TRANSFERENCIA`.
- Crea `EGRESO_SOLICITUD_PAGO`.
- Cambia solicitud a `PAGADA`.
- Registra `pagado_en`.

### HU-0903. Marcar pago en efectivo

Como usuario de Pagos, quiero registrar pago en efectivo, para controlar retiro y pago.

Criterios:

- Crea `operaciones_efectivo`.
- Registra valor requerido.
- Registra valor retirado.
- Registra valor pagado.
- Calcula sobrante.
- Cambia solicitud a `PAGADA`.

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

Como usuario autorizado, quiero consultar el saldo del fondo general del proyecto base, para conocer disponibilidad real.

Criterios:

- Muestra saldo actual.
- Muestra proyecto base.
- Muestra fondo general.
- Muestra centros de costo relacionados.
- Permite analizar gasto acumulado por línea y fase.
- Respeta permisos.

### HU-1002. Registrar movimiento financiero

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

### HU-1003. Consultar movimientos por centro de costo, línea y fase

Como usuario financiero, quiero ver movimientos por centro de costo, línea y fase, para analizar gasto en licitación, obra e interventoría.

Criterios:

- Filtra por proyecto base.
- Filtra por centro de costo.
- Filtra por línea de negocio.
- Filtra por fase de centro de costo.
- Filtra por dirección.
- Filtra por tipo de movimiento.
- Muestra saldo anterior y saldo nuevo.

---

# Épica 11. Operaciones de efectivo

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

### HU-1101. Registrar operación de efectivo

Como usuario de Pagos, quiero registrar operación de efectivo, para dejar trazabilidad del retiro y pago.

Criterios:

- `valor_retirado >= valor_pagado`.
- Calcula `valor_sobrante`.
- Estado `SIN_SOBRANTE` si no sobra.
- Estado `SOBRANTE_PENDIENTE_REINGRESO` si sobra.

### HU-1102. Registrar reingreso de sobrante

Como usuario autorizado, quiero registrar reingreso de sobrante, para devolver dinero al fondo.

Criterios:

- Solo si existe sobrante pendiente.
- No pasa por aprobación.
- Crea movimiento `INGRESO_REINGRESO_SOBRANTE_EFECTIVO`.
- Actualiza saldo.
- Cambia estado a `SOBRANTE_REINGRESADO`.

### HU-1103. Consultar pendientes de reingreso

Como usuario financiero, quiero consultar sobrantes pendientes, para hacer seguimiento.

Criterios:

- Lista operaciones con `SOBRANTE_PENDIENTE_REINGRESO`.
- Muestra centro de costo.
- Muestra solicitud.
- Muestra valor sobrante.
- Permite exportar.

---

# Épica 12. Impuestos y retenciones

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

### HU-1201. Registrar impuesto o retención en solicitud

Como usuario autorizado, quiero registrar impuestos y retenciones, para calcular correctamente el valor neto.

Criterios:

- Crea `impuestos_retenciones_solicitud`.
- Valida tipo.
- Valida naturaleza.
- Valida valor no negativo.
- Actualiza totales de la solicitud.

### HU-1202. Ajustar impuesto o retención

Como usuario autorizado, quiero ajustar un registro tributario, para corregir errores.

Criterios:

- Cambia estado a `AJUSTADO`.
- Exige motivo.
- Registra usuario y fecha.
- Registra auditoría.

### HU-1203. Registrar egreso por pago tributario independiente

Como usuario financiero autorizado, quiero registrar pago de impuesto o retención como egreso, cuando aplique.

Criterios:

- Crea movimiento `EGRESO_IMPUESTO_RETENCION`.
- Relaciona `impuesto_retencion_id`.
- Actualiza saldo.
- No crea solicitud de pago aprobable.

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

Como usuario autorizado, quiero registrar un anticipo, para aumentar el saldo del fondo general del proyecto base.

Criterios:

- Crea registro en `anticipos_centro_costo`.
- Crea movimiento `INGRESO_ANTICIPO`.
- Actualiza saldo.
- Registra auditoría.

### HU-1402. Registrar préstamo general de persona a proyecto

Como usuario autorizado, quiero registrar préstamo de una persona a un proyecto base, para controlar financiación externa general.

Criterios:

- Crea `prestamos_obra`.
- Tipo `PERSONA_A_OBRA` o equivalente vigente en el modelo.
- Asocia el préstamo al proyecto base y fondo general.
- Crea movimiento de ingreso.
- Actualiza saldo pendiente.
- Permite que las solicitudes posteriores descuenten del mismo fondo general sin dividir el préstamo por línea.

### HU-1403. Registrar préstamo entre proyectos

Como usuario autorizado, quiero registrar préstamo entre proyectos base, para controlar traslado temporal de recursos.

Criterios:

- Tipo `OBRA_A_OBRA`.
- Crea egreso en proyecto/fondo origen.
- Crea ingreso en proyecto/fondo destino.
- Actualiza saldos de ambos fondos.
- Registra auditoría.

### HU-1404. Registrar devolución de préstamo

Como usuario autorizado, quiero registrar devolución, para disminuir saldo pendiente.

Criterios:

- Crea `devoluciones_prestamo`.
- Crea movimiento financiero.
- Actualiza saldo pendiente.
- Cambia estado del préstamo si queda pagado.

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
