# 08. Seguridad

## Objetivo

Definir controles de seguridad para autenticación, autorización, solicitudes de pago, fondos de obra, préstamos, anticipos, devoluciones, adjuntos y auditoría.

## Reglas de autorización sobre fondos

- Solo `ADMIN` y `ACCOUNTING_ASSISTANT` pueden registrar anticipos.
- Solo `ADMIN` y `ACCOUNTING_ASSISTANT` pueden registrar préstamos de persona a obra.
- Solo `ADMIN` y `ACCOUNTING_ASSISTANT` pueden registrar préstamos entre obras.
- Solo `ADMIN` y `ACCOUNTING_ASSISTANT` pueden registrar devoluciones de préstamos.
- Solo `ADMIN` y `ACCOUNTING_ASSISTANT` pueden registrar ajustes de fondos.
- Pagos solo puede programar y marcar solicitudes como pagadas.
- El Solicitante no administra fondos.

## Reglas de integridad financiera

- No se permite saldo negativo en una obra.
- Un préstamo entre obras debe registrar egreso e ingreso en la misma transacción.
- Una devolución entre obras debe registrar egreso e ingreso en la misma transacción.
- Una devolución a persona debe disminuir el saldo de la obra deudora.
- Toda devolución debe disminuir `outstanding_amount`.
- No se puede devolver más del saldo pendiente del préstamo.
- Todo movimiento debe tener usuario, fecha, tipo, monto, saldo anterior y saldo nuevo.
- Todo movimiento financiero debe auditarse.
- El frontend no es fuente de verdad para saldos o cálculos financieros.

## Seguridad web y backend

- Validar token de Firebase en backend.
- Consultar roles desde base de datos.
- Configurar CORS restrictivo.
- No exponer secretos en frontend.
- Usar URLs firmadas para adjuntos.
- No exponer trazas internas en errores.
