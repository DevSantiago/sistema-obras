# 07. Contrato de APIs

## Objetivo

Definir los endpoints iniciales del backend para soportar el MVP del sistema de solicitudes de pago.

## Convenciones generales

Base URL:

```text
/api/v1

## Autenticación:

Authorization: Bearer <firebase_id_token>

Formato de respuesta:

{
  "data": {},
  "message": "Operación exitosa"
}

Formato de error:

{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "El valor neto no puede ser mayor al valor bruto",
    "details": []
  }
}


## Auth

Obtener usuario autenticado:

GET /api/v1/me

Respuesta:

{
  "id": "uuid",
  "firebaseUid": "firebase-uid",
  "fullName": "Juan Pérez",
  "email": "juan@empresa.com",
  "roles": ["SOLICITANTE"]
}

## Users

Listar usuarios:

GET /api/v1/users

Permiso: ADMIN

Crear usuario interno:

POST /api/v1/users

Body: 

{
  "firebaseUid": "firebase-uid",
  "fullName": "Juan Pérez",
  "email": "juan@empresa.com",
  "roles": ["SOLICITANTE"]
}

Permiso: ADMIN


## Actulizar roles de usuario:

PUT /api/v1/users/{id}/roles

Body:

{
  "roles": ["REVISOR", "APROBADOR"]
}

Permiso: ADMIN

## Projects

Listar obras:

GET /api/v1/projects

Crear obra:

POST /api/v1/projects

Body:

{
  "name": "Obra Centro Comercial",
  "code": "OBR-001",
  "location": "Villavicencio"
}

Actualizar obra:

PUT /api/v1/projects/{id}

## Providers

Listar proveedores:

GET /api/v1/providers

Crear proveedor:

POST /api/v1/providers

Body:

{
  "name": "Proveedor SAS",
  "documentNumber": "900000000-1",
  "email": "proveedor@empresa.com",
  "phone": "3000000000"
}

Actualizar proveedor:

PUT /api/v1/providers/{id}

## Payment requests

Crear solicitudud:

POST /api/v1/payment-requests

Body:

{
  "item": "Anticipo de obra",
  "providerId": "uuid",
  "projectId": "uuid",
  "description": "Pago correspondiente a avance de obra",
  "grossAmount": 1000000,
  "netAmount": 950000
}

Respuesta:

{
  "id": "uuid",
  "requestNumber": "PR-2026-00001",
  "currentStatus": "DRAFT"
}

Listar solicitudes:

GET /api/v1/payment-requests

Parámetros:

status
projectId
providerId
createdBy
from
to
page
pageSize

Ejemplo:

GET /api/v1/payment-requests?status=SUBMITTED&page=1&pageSize=20

Ver detalle: 

GET /api/v1/payment-requests/{id}

Debe retornar:

* Datos principales.
* Proveedor.
* Obra.
* Adjuntos.
* Comentarios.
* Historial de estados.

Actualizar solicitud:

PUT /api/v1/payment-requests/{id}

Permitido solo en estado DRAFT o REJECTED cuando vuelve a corrección.

Enviar solicitud:

POST /api/v1/payment-requests/{id}/submit

Reglas:

* Debe tener soporte adjunto.
* Cambia de DRAFT a SUBMITTED.

Tomar en revisión:

POST /api/v1/payment-requests/{id}/start-review

Reglas:

* Solo REVISOR o ADMIN.
* Cambia de SUBMITTED a IN_REVIEW.

Aprobar:

POST /api/v1/payment-requests/{id}/approve

Reglas:

* Solo APROBADOR o ADMIN.
* Debe estar en IN_REVIEW.
* Debe tener soporte adjunto.


Rechazar:

POST /api/v1/payment-requests/{id}/reject

Body:

{
  "comment": "El soporte no corresponde al proveedor indicado."
}

Reglas:

* Comentario obligatorio.
* Cambia a REJECTED.

Programar pago:

POST /api/v1/payment-requests/{id}/schedule-payment

Body:

{
  "scheduledPaymentAt": "2026-06-01"
}

Reglas:

* Solo PAGOS o ADMIN.
* Debe estar en APPROVED.

Marcar como pagada:

POST /api/v1/payment-requests/{id}/mark-as-paid

Reglas:

* Solo PAGOS o ADMIN.
* Debe estar en SCHEDULED_FOR_PAYMENT.

## Attachments

Solicitar URL firmada:

POST /api/v1/payment-requests/{id}/attachments/upload-url

Body:

{
  "fileName": "soporte.jpg",
  "mimeType": "image/jpeg"
}

Respuesta:

{
  "uploadUrl": "https://signed-url",
  "filePath": "payment-requests/{id}/attachments/file.jpg",
  "bucketName": "payment-supports"
}

Confirmar adjunto:

POST /api/v1/payment-requests/{id}/attachments

Body:

{
  "fileName": "soporte.jpg",
  "filePath": "payment-requests/{id}/attachments/file.jpg",
  "bucketName": "payment-supports",
  "mimeType": "image/jpeg",
  "fileSize": 250000
}

Listar adjuntos:

GET /api/v1/payment-requests/{id}/attachments

Obtener URL de descarga:

GET /api/v1/attachments/{id}/download-url


## Comments

Crear comentario:

POST /api/v1/payment-requests/{id}/comments

Body:

{
  "comment": "Se solicita revisar el valor neto."
}

Listar comentarios:

GET /api/v1/payment-requests/{id}/comments

## Export

Exportar solicitudes:

GET /api/v1/payment-requests/export

Parámetros:

status
projectId
providerId
from
to

Respuesta:

* Archivo Excel.
* O URL temporal de descarga.