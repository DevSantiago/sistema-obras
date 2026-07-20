# 07. Contrato de API

## Convención

Los endpoints y cuerpos de solicitud usan nombres en español.

Base:

```text
/api/v1
```

## Autenticación

```http
GET /api/v1/me
```

## Centros de costo

```http
GET /api/v1/centros-costo
POST /api/v1/centros-costo
GET /api/v1/centros-costo/{id}
PUT /api/v1/centros-costo/{id}
POST /api/v1/centros-costo/{id}/marcar-adjudicado
POST /api/v1/centros-costo/{id}/marcar-no-adjudicado
POST /api/v1/centros-costo/{id}/iniciar-ejecucion
POST /api/v1/centros-costo/{id}/habilitar-interventoria
GET /api/v1/centros-costo/{id}/fondo
GET /api/v1/centros-costo/{id}/movimientos
GET /api/v1/centros-costo/{id}/trazabilidad
```

Crear proyecto nuevo:

```json
{
  "codigo": "CENTRO-A",
  "nombre": "Centro de costo A",
  "tipoCreacion": "PROYECTO_NUEVO",
  "estadoInicial": "EN_PROPUESTA"
}
```

Crear obra ya adjudicada:

```json
{
  "codigo": "CENTRO-B",
  "nombre": "Centro de costo B",
  "tipoCreacion": "OBRA_YA_ADJUDICADA",
  "estadoInicial": "ADJUDICADO",
  "fechaAdjudicacion": "2026-06-10T10:00:00-05:00",
  "crearVarianteObra": true,
  "crearVarianteInterventoria": false
}
```

## Beneficiarios

```http
GET /api/v1/beneficiarios-pago
POST /api/v1/beneficiarios-pago
GET /api/v1/beneficiarios-pago/{id}
PUT /api/v1/beneficiarios-pago/{id}
```

## Solicitudes de pago

```http
GET /api/v1/solicitudes-pago
POST /api/v1/solicitudes-pago
GET /api/v1/solicitudes-pago/{id}
PUT /api/v1/solicitudes-pago/{id}
POST /api/v1/solicitudes-pago/{id}/enviar
POST /api/v1/solicitudes-pago/{id}/aprobar-nivel-1
POST /api/v1/solicitudes-pago/{id}/devolver-solicitante
POST /api/v1/solicitudes-pago/{id}/aprobar-nivel-2
POST /api/v1/solicitudes-pago/{id}/devolver-aprobador-1
POST /api/v1/solicitudes-pago/{id}/marcar-pagada
POST /api/v1/solicitudes-pago/{id}/marcar-pagada-efectivo
POST /api/v1/solicitudes-pago/{id}/anular
```

Aprobación de nivel 2:

```json
{
  "estadoAnterior": "PENDIENTE_APROBADOR_2",
  "estadoNuevo": "PROGRAMADA_PAGO"
}
```

## Impuestos y retenciones

```http
GET /api/v1/solicitudes-pago/{id}/impuestos-retenciones
POST /api/v1/solicitudes-pago/{id}/impuestos-retenciones
PUT /api/v1/solicitudes-pago/{id}/impuestos-retenciones/{impuestoRetencionId}
DELETE /api/v1/solicitudes-pago/{id}/impuestos-retenciones/{impuestoRetencionId}
```

## Operaciones de efectivo

```http
GET /api/v1/operaciones-efectivo
GET /api/v1/operaciones-efectivo/pendientes-reingreso
POST /api/v1/operaciones-efectivo/{id}/registrar-reingreso
```

Marcar pagada en efectivo:

```json
{
  "fechaPago": "2026-06-10T16:45:00-05:00",
  "fechaRetiro": "2026-06-10T15:30:00-05:00",
  "valorRequerido": 87000,
  "valorRetirado": 100000,
  "valorPagado": 87000,
  "referenciaRetiro": "ATM-001",
  "observacion": "Retiro superior por múltiplos del cajero"
}
```

Registrar reingreso:

```json
{
  "fechaReingreso": "2026-06-11T09:00:00-05:00",
  "valorReingresado": 13000,
  "referenciaReingreso": "DEP-001"
}
```

## Cargos financieros

```http
GET /api/v1/cargos-financieros
POST /api/v1/cargos-financieros
GET /api/v1/cargos-financieros/{id}
```

```json
{
  "centroCostoId": "uuid",
  "varianteCentroCostoId": "uuid",
  "tipoCargo": "GMF",
  "valor": 25000,
  "solicitudPagoId": "uuid-opcional",
  "operacionEfectivoId": "uuid-opcional"
}
```

## Movimientos financieros

```http
GET /api/v1/movimientos-fondo-centro-costo
GET /api/v1/movimientos-fondo-centro-costo/{id}
```

Los movimientos se crean mediante acciones de dominio, no por creación libre desde frontend, salvo permisos administrativos definidos.

## Auditoría

```http
GET /api/v1/auditoria
GET /api/v1/auditoria/{id}
```

Filtros recomendados:

```http
?tipoEntidad=&entidadId=&usuarioId=&fechaDesde=&fechaHasta=
```

## Exportaciones

```http
GET /api/v1/exportaciones/solicitudes-pago
GET /api/v1/exportaciones/movimientos-fondo-centro-costo
GET /api/v1/exportaciones/impuestos-retenciones
GET /api/v1/exportaciones/cargos-financieros
GET /api/v1/exportaciones/operaciones-efectivo
```
