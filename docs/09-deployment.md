# 09. Estrategia de despliegue

## Objetivo

Definir la estrategia de despliegue para Aplicación Web, backend, base de datos, almacenamiento, autenticación, solicitudes de pago y fondos de obra.

## Migraciones necesarias

- `lenders`
- `project_funds`
- `project_fund_movements`
- `project_loans`
- cambios en `payment_requests`: `project_fund_id`, `reserved_amount`

## Datos semilla

Roles:

```text
ADMIN
PETITIONER
ACCOUNTING_ASSISTANT
APPROVER_LEVEL_1
APPROVER_LEVEL_2
PAYMENTS
```

## Checklist antes de producción

- Aplicación Web desplegada.
- Backend desplegado.
- Firebase Auth configurado.
- Cloud SQL con backups.
- Cloud Storage privado.
- Migraciones aplicadas.
- Cuenta de fondos por obra probada.
- Ingreso por anticipo probado.
- Préstamo de persona a obra probado.
- Préstamo entre obras probado.
- Devolución de préstamo a persona probada.
- Devolución de préstamo entre obras probada.
- Flujo completo de solicitud probado.
- Pago de solicitud con egreso de fondos probado.
- Auditoría de movimientos revisada.
- Exportación probada.
