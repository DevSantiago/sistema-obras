# 03. Roles y permisos

> Última actualización funcional: 14 de julio de 2026.

## Principio vigente

El sistema autoriza por permisos, no únicamente por nombre de rol.

```text
rol define permisos
acceso define dónde opera el usuario
```

Cada usuario tiene un único rol activo. Los permisos se asignan al rol mediante `roles_permisos`. Las líneas de negocio permitidas por rol se asignan mediante `roles_lineas_negocio`. Los accesos operativos se asignan por `proyecto_base + linea_negocio`.

## Roles vigentes

```text
ADMINISTRADOR
DIRECTOR
APROBADOR_1
APROBADOR_2
AUXILIAR_CONTABLE
PAGOS
SOLICITANTE
```

El rol `LECTURA` queda como referencia histórica. No forma parte activa del flujo del MVP salvo decisión posterior.

## Permisos base

```text
CREAR_SOLICITUDES
CREAR_PROYECTOS
CREAR_USUARIOS
ASIGNAR_ACCESOS
APROBAR_NIVEL_1
APROBAR_NIVEL_2
MARCAR_COMO_PAGADO
CONSULTAR_TODO
```

## Líneas de negocio

```text
OBRA
INTERVENTORIA
```

Un acceso a `OBRA` cubre centros `PRO-OBRA` y `OBRA`.

Un acceso a `INTERVENTORIA` cubre centros `PRO-INT` e `INT`.

## Administrador

Rol técnico de superusuario, reservado para quien administra o desarrolla el sistema.

Puede:

- Crear solicitudes.
- Crear proyectos.
- Crear usuarios.
- Asignar accesos.
- Aprobar nivel 1.
- Aprobar nivel 2.
- Marcar como pagado.
- Consultar todo.
- Gestionar beneficiarios.
- Consultar auditoría.
- Exportar información.

Permisos:

```text
CREAR_SOLICITUDES
CREAR_PROYECTOS
CREAR_USUARIOS
ASIGNAR_ACCESOS
APROBAR_NIVEL_1
APROBAR_NIVEL_2
MARCAR_COMO_PAGADO
CONSULTAR_TODO
```

Líneas permitidas:

```text
OBRA
INTERVENTORIA
```

## Director

Responsable de proyectos asignados. Los directores llevan diferentes proyectos de obra, obras, proyectos de interventoría e interventorías.

Puede:

- Crear solicitudes.
- Consultar y apoyar la operación de los proyectos y líneas asignadas, conforme a sus permisos. No crea solicitudes de nómina.
- Crear proyectos si el negocio lo requiere.
- Crear usuarios.
- Asignar accesos.
- Operar sobre proyectos y líneas asignadas.

No puede:

- Aprobar nivel 1.
- Aprobar nivel 2.
- Marcar pagos.

Permisos:

```text
CREAR_SOLICITUDES
CREAR_PROYECTOS
CREAR_USUARIOS
ASIGNAR_ACCESOS
```

Líneas permitidas:

```text
OBRA
INTERVENTORIA
```

## Aprobador 1

Socio operativo. Supervisa la ejecución y valida todas las solicitudes en primer nivel.

Puede:

- Crear solicitudes.
- Crear proyectos.
- Crear usuarios.
- Asignar accesos.
- Aprobar nivel 1.
- Consultar las solicitudes propias y las que llegan a primer nivel de aprobación.
- Editar los valores y demás datos funcionales de una solicitud en revisión, excepto el usuario creador.
- Devolver solicitudes al creador.
- Supervisar operación.

No puede:

- Aprobar nivel 2.
- Marcar pagos.

Permisos:

```text
CREAR_SOLICITUDES
CREAR_PROYECTOS
CREAR_USUARIOS
ASIGNAR_ACCESOS
APROBAR_NIVEL_1
CONSULTAR_TODO
```

Líneas permitidas:

```text
OBRA
INTERVENTORIA
```

Reglas de visibilidad y edición:

- No ve solicitudes `BORRADOR` creadas por otros usuarios.
- Ve solicitudes en `PENDIENTE_APROBADOR_1` y `DEVUELTA_APROBADOR_1`, además de las propias.
- El permiso `CONSULTAR_TODO` no concede visibilidad total dentro del módulo Solicitudes; esa facultad se reserva al `ADMINISTRADOR`.
- Toda edición debe generar trazabilidad con usuario editor, fecha, campo modificado, valor anterior y valor nuevo.

## Aprobador 2

Socio financiero. Valida solicitudes en segundo nivel.

Puede:

- Aprobar nivel 2.
- Consultar solicitudes propias y solicitudes en `PENDIENTE_APROBADOR_2`.

No puede:

- Marcar pagos.
- Aprobar nivel 1.
- Crear proyectos, salvo que se le otorgue permiso explícito en una decisión posterior.

Permisos:

```text
APROBAR_NIVEL_2
CONSULTAR_TODO
```

Líneas permitidas:

```text
OBRA
INTERVENTORIA
```

## Auxiliar contable

Apoya la operación contable y financiera.

Puede:

- Crear solicitudes.
- Gestionar beneficiarios.
- Cargar saldos cuando se implemente el módulo financiero.
- Cargar costos operativos de cuentas bancarias cuando se implemente el módulo financiero.
- Registrar reingresos de dinero en efectivo sobrante de un retiro cuando se implemente el módulo financiero.
- Registrar cargos financieros, impuestos o retenciones cuando el módulo financiero lo habilite.

No puede:

- Aprobar nivel 1.
- Aprobar nivel 2.
- Marcar pagos, salvo cambio posterior de política.

Permisos vigentes iniciales:

```text
CREAR_SOLICITUDES
```

Líneas permitidas:

```text
OBRA
INTERVENTORIA
```

## Pagos

Ejecuta la marcación de pago.

Puede:

- Ver solicitudes en `PROGRAMADA_PAGO`.
- Registrar información de pago.
- Marcar como `PAGADA`.
- Registrar operación de efectivo cuando aplique.
- Registrar valor retirado, valor pagado y sobrante.
- Cargar soporte de pago.

No puede:

- Programar pagos.
- Aprobar solicitudes.
- Devolver solicitudes.
- Modificar impuestos.
- Modificar categorías.
- Crear proyectos.
- Crear usuarios.
- Crear movimientos manuales no autorizados.

Permisos:

```text
MARCAR_COMO_PAGADO
```

Líneas permitidas:

```text
OBRA
INTERVENTORIA
```

## Solicitante

Usuario operativo que crea solicitudes en proyectos asignados.

Puede:

- Crear solicitudes en proyectos autorizados.
- Adjuntar soportes.
- Enviar solicitudes.
- Corregir solicitudes devueltas.
- Consultar sus solicitudes.

No puede:

- Aprobar.
- Pagar.
- Crear proyectos.
- Crear usuarios.
- Asignar accesos.
- Operar sobre proyectos o líneas para los cuales no tenga un acceso activo.

Permisos:

```text
CREAR_SOLICITUDES
```

Líneas permitidas según asignación:

```text
OBRA
INTERVENTORIA
```

## Accesos por proyecto y línea

Los accesos deben poder asignarse por:

- Usuario.
- Proyecto base.
- Línea de negocio.

Ejemplo:

| Usuario | Proyecto base | Línea |
|---|---|---|
| Usuario A | Proyecto 1 | `OBRA` |
| Usuario B | Proyecto 1 | `INTERVENTORIA` |
| Usuario C | Proyecto 2 | `OBRA` |

Reglas:

- `SOLICITANTE` puede recibir acceso a `OBRA` o `INTERVENTORIA`, según la asignación realizada por el `ADMINISTRADOR`.
- Los demás roles vigentes pueden recibir `OBRA` e `INTERVENTORIA` según asignación.
- Un usuario no opera sobre un proyecto si no tiene acceso activo, salvo el `ADMINISTRADOR` como superadministrador.
- El permiso `CONSULTAR_TODO` no amplía por sí solo la visibilidad del módulo Solicitudes.
- Los accesos se pueden activar, revocar y reactivar sin duplicar registros.

## Registros que no pasan por aprobación

No requieren Aprobador 1 ni Aprobador 2:

- Reingreso de sobrante de retiro.
- Registro de impuestos y retenciones.
- Ajustes tributarios autorizados.
- Cargos financieros autorizados, según permisos.

Se controlan por permisos, soportes y auditoría.

## Matriz resumida de permisos críticos

| Acción | Administrador | Director | Aprobador 1 | Aprobador 2 | Auxiliar contable | Pagos | Solicitante |
|---|---:|---:|---:|---:|---:|---:|---:|
| Crear proyecto base | Sí | Sí | Sí | No | No | No | No |
| Crear usuario | Sí | Sí | Sí | No | No | No | No |
| Asignar accesos | Sí | Sí | Sí | No | No | No | No |
| Crear solicitud | Sí | Sí | Sí | No | Sí | No | Sí |
| Crear nómina individual o agrupada | Sí | Sí | No | No | No | No | No |
| Editar solicitud en revisión de nivel 1, excepto creador | Sí | No | Sí | No | No | No | No |
| Aprobar nivel 1 | Sí | No | Sí | No | No | No | No |
| Aprobar nivel 2 | Sí | No | No | Sí | No | No | No |
| Marcar como pagada | Sí | No | No | No | No | Sí | No |
| Gestionar beneficiarios | Sí | Sí | Sí | Según permiso | Sí | No | Según permiso |
| Registrar reingreso de sobrante | Sí | No | No | No | Sí | Según política | No |
| Registrar cargo financiero | Sí | No | No | No | Sí | No | No |
| Registrar impuesto o retención | Sí | No | No | No | Sí | No | No |
| Consultar todas las solicitudes | Sí | No | No | No | No | No | No |

## Permisos sobre retiros agrupados y reingresos

- Pagos puede crear un retiro agrupado y asociar una o varias solicitudes programadas para pago.
- Pagos no puede incluir solicitudes cuyo proyecto no tenga saldo suficiente.
- El usuario autorizado para préstamos puede registrar `PERSONA_A_PROYECTO` o `PROYECTO_A_PROYECTO` antes del retiro.
- Auxiliar contable puede registrar reingresos contra el retiro agrupado y no contra una solicitud individual.
- Administrador conserva acceso total como superadministrador.
