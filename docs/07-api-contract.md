# 07. Contrato de APIs

## Objetivo

Definir endpoints iniciales del backend para soportar solicitudes de pago, doble aprobación, adjuntos, comentarios, historial, exportación y fondos de obra con préstamos, anticipos y devoluciones.

## Convenciones

Base URL:

```text
/api/v1
```

Autenticación:

```http
Authorization: Bearer <firebase_id_token>
```

## Endpoints base existentes

```http
GET /api/v1/me
GET /api/v1/users
POST /api/v1/users
PUT /api/v1/users/{id}/roles
GET /api/v1/projects
POST /api/v1/projects
PUT /api/v1/projects/{id}
GET /api/v1/providers
POST /api/v1/providers
PUT /api/v1/providers/{id}
```

## Solicitudes de pago

```http
POST /api/v1/payment-requests
GET /api/v1/payment-requests
GET /api/v1/payment-requests/{id}
PUT /api/v1/payment-requests/{id}
POST /api/v1/payment-requests/{id}/submit
POST /api/v1/payment-requests/{id}/first-approve
POST /api/v1/payment-requests/{id}/first-reject
POST /api/v1/payment-requests/{id}/second-approve
POST /api/v1/payment-requests/{id}/return-to-first-approver
POST /api/v1/payment-requests/{id}/resubmit-to-second-approver
POST /api/v1/payment-requests/{id}/reject-after-second-review
POST /api/v1/payment-requests/{id}/schedule-payment
POST /api/v1/payment-requests/{id}/mark-as-paid
POST /api/v1/payment-requests/{id}/cancel
```

Al marcar como pagada, el backend confirma egreso de la cuenta de fondos de la obra y genera movimiento `EXPENSE_PAYMENT_REQUEST`.

## Adjuntos, comentarios e historial

```http
POST /api/v1/payment-requests/{id}/attachments/upload-url
POST /api/v1/payment-requests/{id}/attachments
GET /api/v1/payment-requests/{id}/attachments
GET /api/v1/attachments/{id}/download-url
POST /api/v1/payment-requests/{id}/comments
GET /api/v1/payment-requests/{id}/comments
GET /api/v1/payment-requests/{id}/status-history
```

## Fondos de obra

```http
GET /api/v1/projects/{projectId}/fund
GET /api/v1/projects/{projectId}/fund/movements
POST /api/v1/projects/{projectId}/fund/incomes/advance
POST /api/v1/projects/{projectId}/loans/person
POST /api/v1/project-loans/project-to-project
POST /api/v1/project-loans/{loanId}/repayments
GET /api/v1/project-loans
GET /api/v1/project-loans/{id}
```

## Exportación

```http
GET /api/v1/payment-requests/export
GET /api/v1/project-funds/export
GET /api/v1/project-fund-movements/export
GET /api/v1/project-loans/export
```
