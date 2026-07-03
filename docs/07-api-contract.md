# 07. Contrato de API

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
- `medio_pago_preferido`, `banco`, `tipo_cuenta_bancaria` y `numero_cuenta_bancaria` son obligatorios.
- El sistema impide duplicados activos por tipo y número de documento.
- Si se envía proveedor embebido, la creación de proveedor y beneficiario es transaccional.

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
