# 07. Contrato de API

> Última actualización funcional: 14 de julio de 2026.

## Convención

Los endpoints y cuerpos de solicitud usan nombres en español.

Base:

```text
/api/v1
```

Las respuestas siguen la estructura:

```json
{
  "ok": true,
  "message": "Mensaje de resultado.",
  "data": {}
}
```

En error:

```json
{
  "ok": false,
  "message": "Descripción del error."
}
```

## Autenticación

```http
POST /api/v1/auth/login
GET /api/v1/auth/me
POST /api/v1/auth/logout
```

Login:

```json
{
  "correo": "admin@sistema-obras.local",
  "password": "Admin123*"
}
```

Usuario autenticado:

```json
{
  "usuario": {
    "id": "uuid",
    "nombre": "Administrador Sistema",
    "correo": "admin@sistema-obras.local",
    "estado": "ACTIVO",
    "roles": ["ADMINISTRADOR"],
    "permisos": ["CREAR_USUARIOS", "CREAR_PROYECTOS"]
  }
}
```

## Usuarios

```http
GET /api/v1/usuarios
POST /api/v1/usuarios
GET /api/v1/usuarios/{id}
PATCH /api/v1/usuarios/{id}
PATCH /api/v1/usuarios/{id}/estado
```

Crear usuario:

```json
{
  "tipo_documento": "CC",
  "numero_documento": "123456789",
  "nombre": "Usuario Prueba",
  "correo": "usuario@test.com",
  "telefono": "3001234567",
  "password": "Password123*",
  "rol": "DIRECTOR",
  "accesos": [
    {
      "proyecto_base_id": "uuid",
      "linea_negocio": "OBRA"
    },
    {
      "proyecto_base_id": "uuid",
      "linea_negocio": "INTERVENTORIA"
    }
  ]
}
```

Cambiar estado:

```json
{
  "estado": "INACTIVO"
}
```

## Proyectos base y centros de costo

```http
GET /api/v1/proyectos-base
POST /api/v1/proyectos-base
GET /api/v1/proyectos-base/{id}
PATCH /api/v1/proyectos-base/{id}/centros-costo/{centroCostoId}/estado
```

Crear proyecto base:

```json
{
  "nombre": "Proyecto Demo",
  "descripcion": "Proyecto de prueba",
  "centros_costo": [
    {
      "linea_negocio": "OBRA",
      "fase_centro_costo": "LICITACION"
    },
    {
      "linea_negocio": "INTERVENTORIA",
      "fase_centro_costo": "LICITACION"
    }
  ]
}
```

Cambiar estado de centro de costo:

```json
{
  "estado_centro_costo": "EN_EJECUCION",
  "observacion": "Inicio de ejecución de la línea."
}
```

Reglas:

- `PRO-OBRA EN_LICITACION` con `EN_EJECUCION` crea `OBRA EN_EJECUCION` y finaliza `PRO-OBRA`.
- `PRO-INT EN_LICITACION` con `EN_EJECUCION` crea `INT EN_EJECUCION` y finaliza `PRO-INT`.
- `OBRA EN_EJECUCION` con `FINALIZADO` finaliza el centro.
- `INT EN_EJECUCION` con `FINALIZADO` finaliza el centro.

## Beneficiarios

```http
GET /api/v1/beneficiarios
POST /api/v1/beneficiarios
GET /api/v1/beneficiarios/{id}
PATCH /api/v1/beneficiarios/{id}
PATCH /api/v1/beneficiarios/{id}/estado
```

Los dos últimos endpoints corresponden a HU-0402.

### Crear beneficiario trabajador

```json
{
  "tipo_beneficiario": "TRABAJADOR",
  "nombre": "Juan Perez",
  "tipo_documento": "CC",
  "numero_documento": "123456789",
  "medio_pago_preferido": "TRANSFERENCIA",
  "banco": "Bancolombia",
  "tipo_cuenta_bancaria": "AHORROS",
  "numero_cuenta_bancaria": "1234567890",
  "telefono": "3001234567",
  "correo": "juan.perez@test.com",
  "notas": "Beneficiario de prueba"
}
```

### Crear beneficiario proveedor con proveedor nuevo

```json
{
  "tipo_beneficiario": "PROVEEDOR",
  "nombre": "Cementos del Meta SAS",
  "tipo_documento": "NIT",
  "numero_documento": "900123456",
  "medio_pago_preferido": "TRANSFERENCIA",
  "banco": "Davivienda",
  "tipo_cuenta_bancaria": "CORRIENTE",
  "numero_cuenta_bancaria": "111222333",
  "telefono": "6011234567",
  "correo": "pagos@cementosmeta.com",
  "notas": "Proveedor de materiales",
  "proveedor": {
    "nombre": "Cementos del Meta SAS",
    "tipo_documento": "NIT",
    "numero_documento": "900123456",
    "banco": "Davivienda",
    "tipo_cuenta_bancaria": "CORRIENTE",
    "numero_cuenta_bancaria": "111222333",
    "telefono": "6011234567",
    "correo": "pagos@cementosmeta.com",
    "direccion": "Villavicencio"
  }
}
```

Filtros de listado:

```http
GET /api/v1/beneficiarios?tipo_beneficiario=TRABAJADOR&activo=true&busqueda=juan
```

Reglas:

- `tipo_documento` y `numero_documento` son obligatorios.
- `medio_pago_preferido` es obligatorio. `banco`, `tipo_cuenta_bancaria` y `numero_cuenta_bancaria` son obligatorios únicamente para `TRANSFERENCIA` o `CONSIGNACION` y opcionales para `EFECTIVO`.
- El sistema impide duplicados activos por tipo y número de documento.
- Si se envía proveedor embebido, la creación de proveedor y beneficiario es transaccional.

## Solicitudes de pago

```http
GET /api/v1/solicitudes-pago
POST /api/v1/solicitudes-pago
POST /api/v1/solicitudes-pago/nomina-individual
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

### Crear nómina individual

Autorizado exclusivamente para `ADMINISTRADOR`.

```json
{
  "proyecto_base_id": "uuid",
  "centro_costo_id": "uuid",
  "beneficiario_id": "uuid-trabajador",
  "concepto_nomina": "SALARIO",
  "periodo_nomina": "2026-07",
  "medio_pago": "CONSIGNACION",
  "descripcion": "Nómina correspondiente a julio de 2026",
  "valor_bruto": 2500000,
  "valor_descuentos": 0
}
```

Reglas:

- El beneficiario debe ser `TRABAJADOR`.
- `periodo_nomina` representa el mes al que corresponde el pago y se recibe en formato `YYYY-MM`. Debe pertenecer al año vigente y no puede ser posterior al mes actual. La fecha de creación y la fecha efectiva de pago se registran por separado.
- No se permite duplicado no anulado por proyecto, centro, trabajador, concepto y periodo.

### Visibilidad de listado

- Creador: solicitudes propias.
- `APROBADOR_1`: propias y estados `PENDIENTE_APROBADOR_1` o `DEVUELTA_APROBADOR_1`.
- `APROBADOR_2`: propias y estado `PENDIENTE_APROBADOR_2`.
- `PAGOS`: propias y estado `PROGRAMADA_PAGO`.
- `ADMINISTRADOR`: todas.

### Editar en aprobación de nivel 1

`APROBADOR_1` puede modificar los valores y demás datos funcionales, excepto `creado_por`. La respuesta debe incluir la solicitud actualizada y el backend debe registrar auditoría del cambio.

Aprobación de nivel 2:

```json
{
  "estadoAnterior": "PENDIENTE_APROBADOR_2",
  "estadoNuevo": "PROGRAMADA_PAGO"
}
```

### Referencia de solicitud

La referencia se genera con el formato `SOL-[TIPO]-[LINEA]-[PROYECTO]-[AÑO]-[CONSECUTIVO]`. Los códigos de tipo son `PRV`, `NOM`, `IMP` y `REE`. Ejemplo: `SOL-PRV-OBRA-HUMAPO-2026-000001`. El consecutivo es independiente por tipo de secuencia, proyecto, centro y año.

`PAGO_IMPUESTO` es un tipo válido de solicitud y recorre el flujo normal de aprobación cuando corresponde a una obligación tributaria independiente.

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
  "proyecto_base_id": "uuid",
  "centro_costo_id": "uuid",
  "tipo_cargo": "GMF",
  "valor": 25000,
  "solicitud_pago_id": "uuid-opcional",
  "operacion_efectivo_id": "uuid-opcional"
}
```

## Movimientos financieros

```http
GET /api/v1/movimientos-fondo
GET /api/v1/movimientos-fondo/{id}
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
GET /api/v1/exportaciones/movimientos-fondo
GET /api/v1/exportaciones/beneficiarios
```


## Operaciones de efectivo agrupadas

```text
POST /api/v1/operaciones-efectivo
GET /api/v1/operaciones-efectivo/{id}
GET /api/v1/operaciones-efectivo/pendientes-reingreso
POST /api/v1/operaciones-efectivo/{id}/reingresos
```

Crear retiro agrupado:

```json
{
  "solicitudes": [
    { "solicitudPagoId": "uuid-1", "valorAsignado": 1008000 },
    { "solicitudPagoId": "uuid-2", "valorAsignado": 19000000 }
  ],
  "valorRetirado": 20010000,
  "fechaRetiro": "2026-06-10T15:30:00-05:00",
  "referenciaRetiro": "ATM-001",
  "observacion": "Retiro agrupado para pagos en efectivo"
}
```

Registrar reingreso contra el retiro:

```json
{
  "fondoId": "uuid-fondo",
  "proyectoBaseId": "uuid-proyecto",
  "centroCostoId": "uuid-centro",
  "valor": 2000,
  "fechaReingreso": "2026-06-11T09:00:00-05:00",
  "referenciaReingreso": "DEP-001",
  "soporteAdjuntoId": "uuid-adjunto"
}
```

El reingreso se asocia a la operación de efectivo. No recibe `solicitudPagoId`.

## Préstamos

```text
POST /api/v1/prestamos-proyecto
POST /api/v1/prestamos-proyecto/{id}/devoluciones
```

`tipoPrestamo` admite `PERSONA_A_PROYECTO` y `PROYECTO_A_PROYECTO`. En la segunda modalidad son obligatorios proyecto y fondo de origen y de destino.
