# 03. Roles y permisos

## Roles

```text
ADMINISTRADOR
SOLICITANTE
AUXILIAR_CONTABLE
APROBADOR_1
APROBADOR_2
PAGOS
LECTURA
```

## Administrador

Puede:

- Crear usuarios y roles.
- Crear centros de costo.
- Crear centros de costo en `EN_PROPUESTA`.
- Crear centros de costo directamente en `ADJUDICADO` para obras ya adjudicadas.
- Marcar centro de costo como `ADJUDICADO`, `NO_ADJUDICADO`, `EN_EJECUCION`, `FINALIZADO` o `CERRADO`.
- Habilitar variantes `PROYECTO`, `OBRA` e `INTERVENTORIA`.
- Gestionar beneficiarios.
- Registrar o ajustar impuestos y retenciones.
- Registrar cargos financieros.
- Registrar o ajustar operaciones de efectivo.
- Consultar auditoría.
- Exportar información.

## Solicitante

Puede:

- Crear solicitudes en centros de costo y variantes autorizadas.
- Crear reembolsos.
- Adjuntar soportes.
- Enviar solicitudes.
- Corregir solicitudes devueltas.
- Consultar sus solicitudes.

No puede aprobar, pagar, adjudicar centros de costo ni modificar fondos.

## Auxiliar contable

Puede, según permisos:

- Crear solicitudes autorizadas.
- Gestionar beneficiarios.
- Registrar cargos financieros.
- Registrar reingresos de sobrantes.
- Registrar impuestos y retenciones.
- Consultar movimientos.
- Exportar información financiera.

No puede aprobar como Aprobador 1 o 2 salvo que tenga el rol correspondiente.

## Aprobador 1

Puede:

- Revisar solicitudes en `PENDIENTE_APROBADOR_1`.
- Aprobar a nivel 1.
- Devolver al Solicitante.
- Editar únicamente descripción menor si la política lo permite y con auditoría.

No puede cambiar categoría, impuestos, valor neto, centro de costo, variante ni medio de pago.

## Aprobador 2

Puede:

- Ver resumen agrupado por centro de costo y variante.
- Revisar solicitudes en `PENDIENTE_APROBADOR_2`.
- Aprobar a nivel 2.
- Devolver a Aprobador 1.

Cuando aprueba, la solicitud queda en `PROGRAMADA_PAGO`.

## Pagos

Puede:

- Ver solicitudes en `PROGRAMADA_PAGO`.
- Registrar información de pago.
- Marcar como `PAGADA`.
- Registrar operación de efectivo.
- Registrar valor retirado, valor pagado y sobrante.
- Registrar reingreso de sobrante si la política lo permite.
- Cargar soporte de pago.

No puede:

- Programar pagos.
- Aprobar solicitudes.
- Devolver solicitudes.
- Modificar impuestos.
- Modificar categorías.
- Crear centros de costo.
- Crear movimientos manuales no autorizados.

## Lectura

Puede consultar módulos autorizados sin modificar información.

## Permisos por centro de costo y variante

Los permisos deben poder asignarse por:

- Centro de costo.
- Variante: `PROYECTO`, `OBRA`, `INTERVENTORIA`.
- Tipo de acción.

Ejemplo:

| Permiso | Descripción |
|---|---|
| `puede_crear_solicitudes` | Crear solicitudes |
| `puede_ver_solicitudes` | Consultar solicitudes |
| `puede_gestionar_fondos` | Registrar movimientos financieros autorizados |
| `puede_ver_saldo` | Ver saldo consolidado |
| `puede_exportar` | Exportar información |

## Registros que no pasan por aprobación

No requieren Aprobador 1 ni Aprobador 2:

- Reingreso de sobrante de retiro.
- Registro de impuestos y retenciones.
- Ajustes tributarios autorizados.
- Cargos financieros autorizados, según permisos.

Se controlan por permisos, soportes y auditoría.

## Matriz resumida de permisos críticos

| Acción | Administrador | Solicitante | Auxiliar contable | Aprobador 1 | Aprobador 2 | Pagos | Lectura |
|---|---:|---:|---:|---:|---:|---:|---:|
| Crear centro de costo | Sí | No | No | No | No | No | No |
| Crear solicitud | Sí | Sí | Sí | No | No | No | No |
| Aprobar nivel 1 | No | No | No | Sí | No | No | No |
| Aprobar nivel 2 | No | No | No | No | Sí | No | No |
| Marcar como pagada | No | No | No | No | No | Sí | No |
| Registrar reingreso de sobrante | Sí | No | Sí | No | No | Según política | No |
| Registrar cargo financiero | Sí | No | Sí | No | No | Según política | No |
| Registrar impuesto o retención | Sí | No | Sí | No | No | No | No |
| Consultar | Sí | Según acceso | Según acceso | Según acceso | Según acceso | Según acceso | Sí |
