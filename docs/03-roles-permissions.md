# 03. Roles y permisos

## Objetivo

Definir los roles iniciales del sistema y las acciones permitidas para solicitudes de pago, fondos de obra, préstamos, anticipos, devoluciones, catálogos y auditoría.

## Roles iniciales

| Rol técnico | Nombre visible | Descripción |
|---|---|---|
| `ADMIN` | Administrador | Gestiona usuarios, roles, catálogos, fondos, solicitudes y auditoría |
| `PETITIONER` | Solicitante | Crea solicitudes, adjunta soportes y consulta estados |
| `ACCOUNTING_ASSISTANT` | Auxiliar contable | Crea solicitudes y administra fondos, préstamos, anticipos y devoluciones |
| `APPROVER_LEVEL_1` | Aprobador 1 | Aprueba primer nivel o devuelve al Solicitante |
| `APPROVER_LEVEL_2` | Aprobador 2 | Aprueba segundo nivel o devuelve al Aprobador 1 |
| `PAYMENTS` | Pagos | Programa pagos y marca solicitudes como pagadas |

## Matriz de permisos

| Acción | Admin | Solicitante | Aux. contable | Aprobador 1 | Aprobador 2 | Pagos |
|---|---:|---:|---:|---:|---:|---:|
| Iniciar sesión | Sí | Sí | Sí | Sí | Sí | Sí |
| Crear solicitud | Sí | Sí | Sí | No | No | No |
| Editar solicitud propia en borrador | Sí | Sí | Sí | No | No | No |
| Corregir solicitud devuelta propia | Sí | Sí | Sí | No | No | No |
| Adjuntar soporte | Sí | Sí | Sí | No | No | No |
| Enviar solicitud | Sí | Sí | Sí | No | No | No |
| Ver solicitudes propias | Sí | Sí | Sí | Sí | Sí | Sí |
| Ver todas las solicitudes | Sí | No | Opcional | Sí | Sí | Sí |
| Aprobar primer nivel | Sí | No | No | Sí | No | No |
| Devolver al Solicitante | Sí | No | No | Sí | No | No |
| Aprobar segundo nivel | Sí | No | No | No | Sí | No |
| Devolver al Aprobador 1 | Sí | No | No | No | Sí | No |
| Reenviar a Aprobador 2 | Sí | No | No | Sí | No | No |
| Programar pago | Sí | No | No | No | No | Sí |
| Marcar como pagada | Sí | No | No | No | No | Sí |
| Crear cuenta de fondos de obra | Sí | No | Sí | No | No | No |
| Registrar anticipo de obra | Sí | No | Sí | No | No | No |
| Registrar préstamo de persona a obra | Sí | No | Sí | No | No | No |
| Registrar préstamo entre obras | Sí | No | Sí | No | No | No |
| Registrar devolución de préstamo | Sí | No | Sí | No | No | No |
| Registrar ajuste de fondos | Sí | No | Sí | No | No | No |
| Ver fondos de obra | Sí | No | Sí | Sí | Sí | Sí |
| Ver préstamos pendientes | Sí | No | Sí | Sí | Sí | No |
| Ver movimientos financieros | Sí | No | Sí | Sí | Sí | Sí |
| Exportar solicitudes | Sí | No | Opcional | Sí | Sí | Sí |
| Exportar fondos y movimientos | Sí | No | Sí | No | No | Sí |
| Gestionar usuarios | Sí | No | No | No | No | No |
| Gestionar roles | Sí | No | No | No | No | No |
| Gestionar obras | Sí | No | No | No | No | No |
| Gestionar proveedores | Sí | No | Opcional | No | No | Opcional |
| Consultar auditoría | Sí | No | No | No | No | No |

## Reglas de autorización

- El backend valida todos los permisos.
- La Aplicación Web no es fuente de verdad para saldos ni movimientos.
- Solo `ADMIN` y `ACCOUNTING_ASSISTANT` pueden crear ingresos, egresos, préstamos, devoluciones y ajustes.
- Ningún usuario debe poder crear movimientos que dejen saldo negativo.
- Los préstamos entre obras deben registrar movimiento de egreso en la obra que presta e ingreso en la obra que recibe.
- Las devoluciones de préstamos deben actualizar el préstamo pendiente.
- Pagos solo confirma pagos de solicitudes; no administra préstamos ni anticipos.
- El Solicitante no puede seleccionar cuenta de fondos.
- El backend debe resolver la cuenta de fondos según la obra/proyecto de la solicitud.
