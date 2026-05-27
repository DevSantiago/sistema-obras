# 04. Máquina de estados

## Objetivo

Definir formalmente los estados permitidos para una solicitud de pago y las transiciones válidas entre ellos.

La máquina de estados evita inconsistencias, cambios no autorizados y estados imposibles dentro del flujo de negocio.

## Estados

| Estado técnico | Nombre visible | Descripción |
|---|---|---|
| DRAFT | Borrador | Solicitud creada pero no enviada |
| SUBMITTED | Enviada | Solicitud enviada para revisión |
| IN_REVIEW | En revisión | Solicitud tomada por un revisor |
| APPROVED | Aprobada | Solicitud aprobada para proceso de pago |
| REJECTED | Rechazada | Solicitud devuelta con observación |
| SCHEDULED_FOR_PAYMENT | Programada para pago | Solicitud aprobada con fecha o intención de pago |
| PAID | Pagada | Solicitud pagada |
| CANCELLED | Anulada | Solicitud anulada administrativamente |

## Transiciones permitidas

| Desde | Hacia | Acción | Rol permitido |
|---|---|---|---|
| DRAFT | SUBMITTED | Enviar solicitud | Solicitante, Admin |
| SUBMITTED | IN_REVIEW | Tomar en revisión | Revisor, Admin |
| IN_REVIEW | APPROVED | Aprobar | Aprobador, Admin |
| IN_REVIEW | REJECTED | Rechazar | Revisor, Aprobador, Admin |
| REJECTED | DRAFT | Corregir solicitud | Solicitante, Admin |
| APPROVED | SCHEDULED_FOR_PAYMENT | Programar pago | Pagos, Admin |
| SCHEDULED_FOR_PAYMENT | PAID | Marcar como pagada | Pagos, Admin |
| DRAFT | CANCELLED | Anular | Solicitante, Admin |
| SUBMITTED | CANCELLED | Anular | Admin |
| IN_REVIEW | CANCELLED | Anular | Admin |

## Transiciones no permitidas

- DRAFT → APPROVED
- DRAFT → PAID
- SUBMITTED → APPROVED
- SUBMITTED → PAID
- IN_REVIEW → PAID
- REJECTED → PAID
- APPROVED → PAID
- PAID → cualquier otro estado, salvo proceso administrativo futuro
- CANCELLED → cualquier otro estado, salvo proceso administrativo futuro

## Reglas por transición

### DRAFT → SUBMITTED

Condiciones:

- La solicitud debe tener al menos un soporte adjunto.
- El valor neto debe ser menor o igual al valor bruto.
- La solicitud debe tener proveedor, obra, descripción y valores.
- Debe registrarse fecha de envío.
- Debe registrarse historial de estado.

### SUBMITTED → IN_REVIEW

Condiciones:

- El usuario debe tener rol Revisor o Administrador.
- Debe registrarse quién tomó la solicitud.
- Debe registrarse fecha de revisión.
- Debe registrarse historial de estado.

### IN_REVIEW → APPROVED

Condiciones:

- El usuario debe tener rol Aprobador o Administrador.
- La solicitud debe tener al menos un soporte.
- La solicitud debe estar en estado En revisión.
- Debe registrarse quién aprobó.
- Debe registrarse fecha de aprobación.
- Debe registrarse historial de estado.

### IN_REVIEW → REJECTED

Condiciones:

- El usuario debe tener rol Revisor, Aprobador o Administrador.
- La observación es obligatoria.
- Debe registrarse quién rechazó.
- Debe registrarse fecha de rechazo.
- Debe registrarse historial de estado.

### REJECTED → DRAFT

Condiciones:

- La solicitud puede ser corregida por el solicitante o administrador.
- Debe conservarse el historial anterior.
- No se debe eliminar la observación de rechazo.

### APPROVED → SCHEDULED_FOR_PAYMENT

Condiciones:

- El usuario debe tener rol Pagos o Administrador.
- La solicitud debe estar aprobada.
- Puede registrarse fecha estimada de pago.
- Debe registrarse historial de estado.

### SCHEDULED_FOR_PAYMENT → PAID

Condiciones:

- El usuario debe tener rol Pagos o Administrador.
- La solicitud debe estar programada para pago.
- Debe registrarse fecha de pago.
- Debe registrarse quién marcó como pagada.
- Debe registrarse historial de estado.

## Representación sugerida en código

```ts
export enum PaymentRequestStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SCHEDULED_FOR_PAYMENT = 'SCHEDULED_FOR_PAYMENT',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export const allowedTransitions = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['IN_REVIEW', 'CANCELLED'],
  IN_REVIEW: ['APPROVED', 'REJECTED', 'CANCELLED'],
  REJECTED: ['DRAFT'],
  APPROVED: ['SCHEDULED_FOR_PAYMENT'],
  SCHEDULED_FOR_PAYMENT: ['PAID'],
  PAID: [],
  CANCELLED: [],
};
```
