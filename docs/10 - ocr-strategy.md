# 10. Estrategia de OCR

## Objetivo

Definir la estrategia para incorporar OCR asistido en el sistema de solicitudes de pago, sin convertirlo en dependencia crítica del MVP.

## Principio general

El OCR no debe reemplazar la revisión humana. En las primeras fases, el OCR debe sugerir información, pero el usuario debe validar antes de guardar o enviar la solicitud.

## Alcance del MVP

El OCR automático avanzado queda fuera del MVP.

En el MVP, el usuario deberá ingresar manualmente:

- Ítem.
- Proveedor.
- Obra.
- Descripción.
- Valor bruto.
- Valor neto.

El sistema permitirá adjuntar soportes, pero no dependerá del OCR para operar.

## Fase 1: Sin OCR

Características:

- Carga manual de datos.
- Adjuntos obligatorios para enviar.
- Revisión humana de soportes.
- Exportación a Excel.
- Historial de cambios.

Objetivo:

- Reemplazar Excel.
- Centralizar solicitudes.
- Crear trazabilidad.

## Fase 2: OCR asistido

Características:

- Usuario adjunta soporte.
- Usuario presiona botón “Extraer datos”.
- Backend envía imagen o documento a OpenAI Vision.
- OpenAI devuelve información sugerida.
- Usuario revisa y confirma.
- Sistema guarda datos confirmados por el usuario.

Campos sugeridos:

- Proveedor.
- Valor bruto.
- Valor neto.
- Descripción.
- Fecha del documento, si aplica.
- Número de documento, si aplica.

## Fase 3: OCR semiautomatizado

Características futuras:

- Detección automática de proveedor existente.
- Comparación contra catálogo de proveedores.
- Detección de valores inconsistentes.
- Alerta de soportes duplicados.
- Extracción de tablas.
- Validaciones contables básicas.
- Clasificación automática de documentos.

## Flujo técnico OCR

```text
Usuario carga soporte
        ↓
Flutter confirma adjunto
        ↓
Usuario solicita extracción OCR
        ↓
Backend obtiene archivo desde Cloud Storage
        ↓
Backend envía archivo a OpenAI Vision
        ↓
OpenAI devuelve respuesta estructurada
        ↓
Backend guarda resultado OCR
        ↓
Flutter muestra sugerencias
        ↓
Usuario acepta, corrige o descarta


API OCR Propuesta

POST /api/v1/attachments/{id}/ocr

Respuesta esperada:

{
  "providerName": "Proveedor SAS",
  "grossAmount": 1000000,
  "netAmount": 950000,
  "description": "Pago por materiales de obra",
  "documentDate": "2026-05-26",
  "documentNumber": "FAC-001",
  "confidence": "medium",
  "rawText": "Texto extraído..."
}

Tabla ocr_results

CREATE TABLE ocr_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attachment_id UUID REFERENCES attachments(id),
    payment_request_id UUID REFERENCES payment_requests(id),

    provider_name TEXT,
    gross_amount NUMERIC(14,2),
    net_amount NUMERIC(14,2),
    description TEXT,
    document_date DATE,
    document_number VARCHAR(100),

    raw_text TEXT,
    raw_response JSONB,

    confidence VARCHAR(50),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

ESTADOS OCR

NOT_PROCESSED
PROCESSING
PROCESSED
FAILED
DISCARDED
CONFIRMED


PROMPT base para OCR

Analiza el documento adjunto y extrae únicamente la información relacionada con una solicitud de pago.

Devuelve una respuesta JSON con los siguientes campos:
- providerName
- grossAmount
- netAmount
- description
- documentDate
- documentNumber
- confidence
- observations

Si un campo no se identifica con claridad, retorna null.
No inventes información.

Reglas de seguridad OCR

* No enviar documentos innecesarios.
* No procesar archivos sin autorización.
* Registrar quién solicitó el OCR.
* Guardar respuesta original para auditoría técnica.
* Permitir al usuario corregir la información.
* No guardar automáticamente datos OCR como definitivos.
* Controlar costos por usuario, archivo o ambiente.

Riesgos

* Lectura incorrecta de valores.
* Documentos ilegibles.
* Imágenes borrosas.
* Proveedores escritos de forma inconsistente.
* Costos por procesamiento masivo.
* Dependencia de servicio externo.
* Datos sensibles en documentos.

Mitigaciones

* OCR bajo demanda, no automático al subir.
* Revisión humana obligatoria.
* Límites por tamaño de archivo.
* Manejo de errores.
* Registro de resultados.
* Campos con nivel de confianza.
* Validaciones posteriores en backend.