# 07. Contrato de API

> **Última actualización:** 28 Julio de 2026

---

# Objetivo

Este documento define el contrato de intercambio entre el frontend y el backend del Sistema de Gestión de Solicitudes de Pago.

Su propósito es documentar:

- los recursos expuestos por la API;
- los métodos HTTP disponibles;
- los parámetros de consulta;
- los cuerpos de solicitud;
- las estructuras generales de respuesta.

Las reglas de negocio, permisos, validaciones, flujos de aprobación y transiciones de estado se documentan en sus respectivos documentos funcionales y no forman parte de este contrato.

---

# Convenciones generales

## URL base

Todos los recursos se publican bajo la siguiente ruta:

```text
/api/v1
```

---

## Formato de intercambio

Todas las solicitudes y respuestas utilizan:

```text
Content-Type: application/json
```

excepto los endpoints que reciben archivos, los cuales utilizan:

```text
multipart/form-data
```

---

## Respuesta exitosa

Las operaciones exitosas siguen la siguiente estructura:

```json
{
  "ok": true,
  "message": "Mensaje descriptivo.",
  "data": {}
}
```

---

## Respuesta de error

Las operaciones que finalizan con error utilizan:

```json
{
  "ok": false,
  "message": "Descripción del error."
}
```

Dependiendo del caso, la respuesta puede acompañarse de códigos HTTP como:

```text
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
500 Internal Server Error
```

---

## Identificadores

Todos los identificadores enviados mediante parámetros de ruta corresponden a UUID.

Ejemplo:

```text
GET /api/v1/usuarios/{id}
```

---

# Recursos disponibles

Actualmente la API expone los siguientes recursos:

```text
/api/v1/auth
/api/v1/health
/api/v1/usuarios
/api/v1/beneficiarios
/api/v1/proyectos-base
/api/v1/solicitudes-pago
/api/v1/fondos
/api/v1/anticipos
/api/v1/prestamos
/api/v1/prestamos/entre-proyectos
/api/v1/prestamos/devoluciones
/api/v1/operaciones-efectivo
```

El registro financiero de HU-1002 es un servicio interno y no expone un
endpoint independiente. Los endpoints que registran pagos y operaciones de
efectivo lo invocan dentro de su propia transacción para actualizar el fondo y
crear el movimiento de forma atómica.

---

# Métodos implementados

| Método | Endpoint |
|---------|----------|
| POST | `/api/v1/auth/login` |
| POST | `/api/v1/auth/logout` |
| GET | `/api/v1/auth/me` |
| GET | `/api/v1/health/db` |
| GET | `/api/v1/usuarios` |
| POST | `/api/v1/usuarios` |
| GET | `/api/v1/usuarios/{id}` |
| PATCH | `/api/v1/usuarios/{id}` |
| PATCH | `/api/v1/usuarios/{id}/estado` |
| GET | `/api/v1/beneficiarios` |
| POST | `/api/v1/beneficiarios` |
| GET | `/api/v1/beneficiarios/{id}` |
| PATCH | `/api/v1/beneficiarios/{id}` |
| GET | `/api/v1/proyectos-base` |
| POST | `/api/v1/proyectos-base` |
| GET | `/api/v1/proyectos-base/{id}` |
| PATCH | `/api/v1/proyectos-base/{id}/centros-costo/{centroCostoId}/estado` |
| GET | `/api/v1/fondos` |
| GET | `/api/v1/fondos/movimientos` |
| POST | `/api/v1/anticipos` |
| POST | `/api/v1/prestamos` |
| GET | `/api/v1/prestamos` |
| POST | `/api/v1/prestamos/entre-proyectos` |
| POST | `/api/v1/prestamos/devoluciones` |
| GET | `/api/v1/operaciones-efectivo` |
| GET | `/api/v1/operaciones-efectivo/{id}/soportes/{adjuntoId}` |
| POST | `/api/v1/operaciones-efectivo/{id}/reingresos` |
| POST | `/api/v1/operaciones-efectivo/{id}/correcciones` |
| GET | `/api/v1/solicitudes-pago` |
| POST | `/api/v1/solicitudes-pago` |
| GET | `/api/v1/solicitudes-pago/{id}` |
| POST | `/api/v1/solicitudes-pago/{id}/enviar` |
| GET | `/api/v1/solicitudes-pago/{id}/archivo` |
| POST | `/api/v1/solicitudes-pago/nomina-grupal` |
| POST | `/api/v1/solicitudes-pago/reembolsos` |

---

# Fondos y movimientos financieros

## Consultar operaciones de efectivo

```http
GET /api/v1/operaciones-efectivo
```

Disponible para `ADMINISTRADOR` y `PAGOS`. Admite los filtros opcionales
`proyecto_base_id`, `fondo_id`, `fecha_desde`, `fecha_hasta` y
`solo_pendientes`. Este último acepta `true` para retornar únicamente
operaciones en `SOBRANTE_PENDIENTE_REINGRESO`.

Retorna el retiro, sus solicitudes y soportes, así como los valores requerido,
retirado, pagado, sobrante, reintegrado y pendiente. El seguimiento se deriva
sin crear nuevos movimientos financieros. La interfaz permite exportar en CSV
los resultados filtrados, con una fila por solicitud y su proyecto, fondo y
centro de costo.

Los soportes relacionados se consultan mediante:

```http
GET /api/v1/operaciones-efectivo/{id}/soportes/{adjuntoId}
```

El soporte solo se entrega cuando pertenece al retiro o a uno de sus pagos.

## Registrar reingreso posterior

```http
POST /api/v1/operaciones-efectivo/{id}/reingresos
Content-Type: multipart/form-data
```

Disponible para `ADMINISTRADOR` y `PAGOS`. Campos obligatorios: `valor` y
`soporte`. `observacion` es opcional. El contrato no recibe fecha.

La operación debe tener sobrante pendiente y el valor no puede superarlo. El
registro crea `INGRESO_REINTEGRO_EFECTIVO`, actualiza el fondo y el pendiente,
y conserva el soporte en una transacción serializable.

---

## Ajustar una operación de efectivo

```http
POST /api/v1/operaciones-efectivo/{id}/correcciones
Content-Type: application/json
```

Disponible para `ADMINISTRADOR` y `PAGOS`.

```json
{
  "tipo": "AJUSTE",
  "direccion": "INGRESO",
  "valor": 50000,
  "motivo": "Corrección del valor retirado",
  "observacion": "Validado con el soporte bancario"
}
```

El ajuste exige dirección `INGRESO` o `EGRESO` y valor mayor que cero. La
dirección corrige el valor retirado: `INGRESO` reduce el pendiente y no puede
superarlo; `EGRESO` incrementa el pendiente. La respuesta y el historial
incluyen `pendiente_anterior` y `pendiente_nuevo`.

El servicio rechaza nuevas solicitudes con tipo `ANULACION`. Las anulaciones históricas permanecen disponibles únicamente para consulta y auditoría.

La
anulación no recibe valor: el sistema calcula el efecto neto de todos los
movimientos de la operación y genera la compensación inversa. Ambos exigen
motivo y asignan usuario y fecha automáticamente. Una operación `ANULADA`
responde conflicto ante nuevas correcciones.

---

## Registrar préstamo de persona a proyecto

```http
POST /api/v1/prestamos
Content-Type: multipart/form-data
```

Requiere `REGISTRAR_PRESTAMOS`. Campos obligatorios:
`proyecto_base_id`, `acreedor_id`, `valor` y `soporte`.
`observacion` es opcional. El acreedor debe ser un beneficiario activo.
El contrato no recibe fecha: el sistema toma la fecha y hora de la operación.

La interfaz consolida anticipos y préstamos en `/financiacion`. Los campos de
entidad aportante y persona acreedora permiten buscar beneficiarios por nombre
o identificación.

---

## Consultar préstamos pendientes

```http
GET /api/v1/prestamos
```

Requiere `REGISTRAR_PRESTAMOS`. Retorna préstamos en estado `ACTIVO` o
`PARCIALMENTE_DEVUELTO` con saldo pendiente, proyecto que debe devolver,
acreedor o proyecto origen y saldo disponible del fondo destino.

---

## Registrar préstamo entre proyectos

```http
POST /api/v1/prestamos/entre-proyectos
Content-Type: multipart/form-data
```

Requiere `REGISTRAR_PRESTAMOS`. Campos obligatorios:
`proyecto_origen_id`, `proyecto_destino_id`, `valor` y `soporte`.
`observacion` es opcional. Los proyectos deben ser diferentes, estar activos y
tener fondos activos. El contrato no recibe fecha: el sistema toma la fecha y
hora de la operación.

El registro crea un `EGRESO_PRESTAMO_PROYECTO` en el fondo origen y un
`INGRESO_PRESTAMO_PROYECTO` en el fondo destino. Ambos movimientos comparten
la referencia del préstamo y se confirman junto con los nuevos saldos en una
transacción serializable.

---

## Registrar devolución de préstamo

```http
POST /api/v1/prestamos/devoluciones
Content-Type: multipart/form-data
```

Requiere `REGISTRAR_PRESTAMOS`. Campos obligatorios:
`prestamo_proyecto_id`, `valor` y `soporte`. `observacion` es opcional. El
contrato no recibe fecha y el valor no puede superar el saldo pendiente.

Para `PERSONA_A_PROYECTO` crea
`EGRESO_DEVOLUCION_PRESTAMO_PERSONA` en el proyecto. Para
`PROYECTO_A_PROYECTO` crea `EGRESO_DEVOLUCION_PRESTAMO` en el proyecto
destino e `INGRESO_DEVOLUCION_PRESTAMO` en el origen. Actualiza el estado a
`PARCIALMENTE_DEVUELTO` o `SALDADO` dentro de la misma transacción.

---

## Registrar anticipo

```http
POST /api/v1/anticipos
Content-Type: multipart/form-data
```

Requiere `REGISTRAR_ANTICIPOS`. Campos:

| Campo | Requerido |
|-------|-----------|
| `proyecto_base_id` | Sí |
| `entidad_id` | Sí |
| `valor` | Sí |
| `soporte` | Sí |
| `observacion` | No |

El contrato no recibe fecha: el sistema toma la fecha y hora de la operación.
El soporte admite PDF, PNG, JPG o JPEG, máximo 10 MB.

---

## Consultar movimientos

```http
GET /api/v1/fondos/movimientos
```

Requiere el permiso `CONSULTAR_FONDOS`.

Parámetros de consulta opcionales:

| Parámetro | Descripción |
|-----------|-------------|
| `proyecto_base_id` | Proyecto base relacionado. |
| `centro_costo_id` | Centro de costo imputado. |
| `linea_negocio` | Línea de negocio del centro de costo. |
| `fase_centro_costo` | Fase del centro de costo. |
| `direccion` | `INGRESO` o `EGRESO`. |
| `tipo_movimiento` | Tipo funcional del movimiento. |

Respuesta:

```json
{
  "ok": true,
  "message": "Movimientos financieros consultados correctamente.",
  "data": {
    "movimientos": [
      {
        "id": "uuid",
        "proyecto_base_id": "uuid",
        "proyecto_nombre": "Proyecto base",
        "centro_costo_id": "uuid",
        "centro_costo_codigo": "OBR-EJE",
        "centro_costo_nombre": "Obra en ejecución",
        "linea_negocio": "OBRA",
        "fase_centro_costo": "EJECUCION",
        "tipo_movimiento": "EGRESO_SOLICITUD_PAGO",
        "direccion": "EGRESO",
        "valor": 100000,
        "saldo_anterior": 800000,
        "saldo_nuevo": 700000,
        "referencia_sistema": "TR-001",
        "descripcion": "Transferencia",
        "registrado_en": "2026-07-28T14:00:00.000Z"
      }
    ],
    "tipos_movimiento": [
      "EGRESO_SOLICITUD_PAGO"
    ]
  }
}
```

Los usuarios con acceso restringido únicamente reciben movimientos imputados
a centros de costo pertenecientes a sus proyectos y líneas autorizadas.

---

# Autenticación

## Endpoints

```http
POST /api/v1/auth/login
GET /api/v1/auth/me
POST /api/v1/auth/logout
```

---

## Iniciar sesión

```http
POST /api/v1/auth/login
```

### Cuerpo

```json
{
  "correo": "admin@sistema-obras.local",
  "password": "Admin123*"
}
```

### Respuesta

```json
{
  "ok": true,
  "message": "Inicio de sesión exitoso.",
  "data": {
    "usuario": {
      "id": "uuid",
      "nombre": "Administrador Sistema",
      "correo": "admin@sistema-obras.local",
      "estado": "ACTIVO",
      "roles": [
        "ADMINISTRADOR"
      ],
      "permisos": [
        "CREAR_USUARIOS",
        "CREAR_PROYECTOS"
      ]
    }
  }
}
```

La autenticación establece la cookie de sesión utilizada por los demás endpoints.

---

## Usuario autenticado

```http
GET /api/v1/auth/me
```

Retorna la información del usuario asociada a la sesión actual.

---

## Cerrar sesión

```http
POST /api/v1/auth/logout
```

Finaliza la sesión eliminando la cookie de autenticación.

---

# Estado del servicio

## Verificar conexión con la base de datos

```http
GET /api/v1/health/db
```

### Respuesta

```json
{
  "ok": true,
  "message": "Conexión a PostgreSQL correcta"
}
```

---

# Usuarios

## Endpoints

```http
GET    /api/v1/usuarios
POST   /api/v1/usuarios
GET    /api/v1/usuarios/{id}
PATCH  /api/v1/usuarios/{id}
PATCH  /api/v1/usuarios/{id}/estado
```

---

## Listar usuarios

```http
GET /api/v1/usuarios
```

Obtiene el listado de usuarios registrados en el sistema.

### Respuesta

```json
{
  "ok": true,
  "message": "Usuarios consultados correctamente.",
  "data": [
    {
      "id": "uuid",
      "nombre": "Juan Pérez",
      "correo": "juan@empresa.com"
    }
  ]
}
```

---

## Consultar usuario

```http
GET /api/v1/usuarios/{id}
```

Obtiene la información de un usuario específico.

### Parámetros de ruta

| Parámetro | Tipo |
|-----------|------|
| id | UUID |

---

## Crear usuario

```http
POST /api/v1/usuarios
```

### Cuerpo

```json
{
  "nombre": "Juan Pérez",
  "correo": "juan@empresa.com",
  "tipo_documento": "CC",
  "numero_documento": "123456789",
  "password": "********",
  "roles": [
    "ADMINISTRADOR"
  ]
}
```

### Respuesta

```json
{
  "ok": true,
  "message": "Usuario creado correctamente.",
  "data": {}
}
```

---

## Actualizar usuario

```http
PATCH /api/v1/usuarios/{id}
```

Actualiza la información de un usuario existente.

### Parámetros de ruta

| Parámetro | Tipo |
|-----------|------|
| id | UUID |

### Cuerpo

El cuerpo corresponde a los campos del usuario que se desean actualizar.

```json
{
  "nombre": "Juan Pérez Gómez",
  "correo": "juan@empresa.com"
}
```

---

## Cambiar estado de un usuario

```http
PATCH /api/v1/usuarios/{id}/estado
```

Actualiza el estado del usuario.

### Parámetros de ruta

| Parámetro | Tipo |
|-----------|------|
| id | UUID |

### Cuerpo

```json
{
  "estado": "ACTIVO"
}
```

---

# Beneficiarios

## Endpoints

```http
GET    /api/v1/beneficiarios
POST   /api/v1/beneficiarios
GET    /api/v1/beneficiarios/{id}
PATCH  /api/v1/beneficiarios/{id}
GET    /api/v1/beneficiarios/carga-masiva
POST   /api/v1/beneficiarios/carga-masiva
```

---

## Listar beneficiarios

```http
GET /api/v1/beneficiarios
```

Permite consultar beneficiarios registrados utilizando filtros opcionales.

### Parámetros de consulta

| Parámetro | Tipo | Obligatorio |
|-----------|------|-------------|
| tipo_beneficiario | String | No |
| activo | Boolean | No |
| busqueda | String | No |

### Ejemplo

```http
GET /api/v1/beneficiarios?tipo_beneficiario=TRABAJADOR&activo=true
```

---

## Consultar beneficiario

```http
GET /api/v1/beneficiarios/{id}
```

Obtiene la información completa de un beneficiario.

### Parámetros de ruta

| Parámetro | Tipo |
|-----------|------|
| id | UUID |

---

## Crear beneficiario

```http
POST /api/v1/beneficiarios
```

### Cuerpo

```json
{
  "tipo_beneficiario": "PROVEEDOR",
  "nombre": "Proveedor SAS",
  "numero_documento": "900123456",
  "correo": "contacto@proveedor.com"
}
```

## Carga masiva de proveedores

```http
GET /api/v1/beneficiarios/carga-masiva
```

Descarga la plantilla `.xlsx` con las columnas obligatorias y una hoja de catálogos.

```http
POST /api/v1/beneficiarios/carga-masiva
Content-Type: multipart/form-data
```

Campos:

- `archivo`: archivo `.xlsx` de máximo 10 MB y 1.000 filas.
- `accion`: `VALIDAR` o `IMPORTAR`.

Todos los proveedores se crean activos y con tipo `PROVEEDOR`. Correo, teléfono, medio de pago, banco, tipo de cuenta, número de cuenta y concepto de pago son obligatorios. Los documentos duplicados se rechazan y los proveedores existentes no se actualizan.

### Respuesta

```json
{
  "ok": true,
  "message": "Beneficiario creado correctamente.",
  "data": {}
}
```

---

## Actualizar beneficiario

```http
PATCH /api/v1/beneficiarios/{id}
```

Actualiza la información de un beneficiario existente.

### Parámetros de ruta

| Parámetro | Tipo |
|-----------|------|
| id | UUID |

### Cuerpo

Se envían únicamente los campos que deban modificarse.

```json
{
  "tipo_beneficiario": "PROVEEDOR",
  "tipo_documento": "NIT",
  "numero_documento": "900123456",
  "correo": "nuevo@proveedor.com",
  "telefono": "3200000000"
}
```

El tipo de beneficiario, el tipo de identificación y el número de
identificación son editables. La combinación de tipo y número de documento
debe seguir siendo única. Un beneficiario `TRABAJADOR` no puede utilizar
`NIT`. Cuando el beneficiario es `PROVEEDOR`, sus datos de identificación se
sincronizan con el registro de proveedor relacionado.

---

# Proyectos base

## Endpoints

```http
GET    /api/v1/proyectos-base
POST   /api/v1/proyectos-base
GET    /api/v1/proyectos-base/{id}
PATCH  /api/v1/proyectos-base/{id}/centros-costo/{centroCostoId}/estado
```

---

## Listar proyectos base

```http
GET /api/v1/proyectos-base
```

Permite consultar proyectos base registrados.

### Parámetros de consulta

| Parámetro | Tipo | Obligatorio |
|-----------|------|-------------|
| estado_proyecto | String | No |
| activo | Boolean | No |

### Ejemplo

```http
GET /api/v1/proyectos-base?estado_proyecto=EJECUCION&activo=true
```

---

## Consultar proyecto base

```http
GET /api/v1/proyectos-base/{id}
```

Obtiene la información completa de un proyecto base.

### Parámetros de ruta

| Parámetro | Tipo |
|-----------|------|
| id | UUID |

---

## Crear proyecto base

```http
POST /api/v1/proyectos-base
```

### Cuerpo

```json
{
  "nombre": "Proyecto Loma Linda",
  "descripcion": "Proyecto de ejemplo",
  "centros_costo": []
}
```

### Respuesta

```json
{
  "ok": true,
  "message": "Proyecto base creado correctamente.",
  "data": {}
}
```

---

## Cambiar estado de un centro de costo

```http
PATCH /api/v1/proyectos-base/{id}/centros-costo/{centroCostoId}/estado
```

Actualiza el estado de un centro de costo perteneciente a un proyecto base.

### Parámetros de ruta

| Parámetro | Tipo |
|-----------|------|
| id | UUID |
| centroCostoId | UUID |

### Cuerpo

```json
{
  "estado_centro_costo": "ACTIVO",
  "observacion": "Cambio realizado por administración."
}
```

---

# Solicitudes de pago

## Endpoints

```http
GET   /api/v1/solicitudes-pago
POST  /api/v1/solicitudes-pago

GET   /api/v1/solicitudes-pago/{id}
POST  /api/v1/solicitudes-pago/{id}/enviar
GET   /api/v1/solicitudes-pago/{id}/archivo

POST  /api/v1/solicitudes-pago/nomina-grupal
POST  /api/v1/solicitudes-pago/reembolsos
```

---

# Listar solicitudes de pago

```http
GET /api/v1/solicitudes-pago
```

Permite consultar solicitudes de pago utilizando filtros opcionales.

## Parámetros de consulta

| Parámetro | Tipo |
|------------|------|
| tipo_solicitud | String |
| modalidad_nomina | String |
| periodo_nomina | String |
| tipo_impuesto | String |
| periodo_impuesto | String |
| estado_actual | String |
| proyecto_base_id | UUID |
| centro_costo_id | UUID |
| beneficiario_id | UUID |
| medio_pago | String |
| busqueda | String |

Ejemplo:

```http
GET /api/v1/solicitudes-pago?estado_actual=ENVIADA
```

---

# Consultar solicitud

```http
GET /api/v1/solicitudes-pago/{id}
```

Obtiene el detalle completo de una solicitud.

La propiedad `historial` retorna los eventos en orden cronológico descendente.
Cada evento contiene `accion`, `descripcion`, `estado_anterior`,
`estado_nuevo`, `cambios`, `creado_en` y el `usuario` responsable. El historial
integra los registros operativos de aprobaciones, devoluciones, anulaciones,
adjuntos y pagos con los eventos complementarios de edición y reenvío.

## Parámetros

| Parámetro | Tipo |
|------------|------|
| id | UUID |

---

# Crear solicitud

```http
POST /api/v1/solicitudes-pago
```

Este endpoint recibe solicitudes enviadas en formato JSON.

Actualmente soporta:

- Pago a proveedor.
- Nómina individual.
- Pago de impuestos.

El tipo de solicitud se determina mediante los campos enviados en el cuerpo de la petición.

---

## Pago a proveedor

El campo `beneficiario_id` puede corresponder a un beneficiario activo de tipo
`PROVEEDOR` u `OTRO`.

Ejemplo:

```json
{
  "tipo_solicitud": "PAGO_PROVEEDOR"
}
```

---

## Nómina individual

Ejemplo:

```json
{
  "tipo_solicitud": "PAGO_NOMINA",
  "modalidad_nomina": "INDIVIDUAL"
}
```

---

## Pago de impuesto

Ejemplo:

```json
{
  "tipo_solicitud": "PAGO_IMPUESTO"
}
```

---

# Consultar adjunto de solicitud

```http
GET /api/v1/solicitudes-pago/{id}/adjuntos/{adjuntoId}
```

Devuelve el contenido del adjunto únicamente cuando el usuario autenticado
tiene permiso para consultar la solicitud y el archivo pertenece a ella.

---

# Enviar solicitud

```http
POST /api/v1/solicitudes-pago/{id}/enviar
```

Envía una solicitud previamente creada para iniciar su flujo de aprobación.

## Parámetros

| Parámetro | Tipo |
|------------|------|
| id | UUID |

---

# Descargar archivo origen

```http
GET /api/v1/solicitudes-pago/{id}/archivo
```

Permite descargar el archivo de origen asociado a una solicitud de pago.

Actualmente este endpoint retorna un archivo binario utilizando los encabezados HTTP correspondientes para descarga.

---

# Nómina grupal

## Endpoint

```http
POST /api/v1/solicitudes-pago/nomina-grupal
```

Este endpoint utiliza:

```text
multipart/form-data
```

y soporta dos operaciones.

---

## Validar archivo Excel

La operación se ejecuta enviando:

```text
accion = VALIDAR
```

El endpoint:

- recibe el archivo Excel;
- valida el formato;
- procesa las filas;
- retorna la información normalizada para su revisión.

---

## Crear nómina grupal

La operación se ejecuta enviando:

```text
accion = CREAR
```

El cuerpo incluye:

- identificador del archivo previamente validado;
- filas normalizadas;
- información general de la nómina.

---

# Solicitudes de reembolso

## Endpoint

```http
POST /api/v1/solicitudes-pago/reembolsos
```

El endpoint recibe la información utilizando:

```text
multipart/form-data
```

Incluye:

- información general del reembolso;
- archivos soporte.

Los archivos son almacenados y asociados automáticamente a la solicitud creada.

---

# Observaciones

Actualmente la API implementa únicamente los endpoints descritos en este documento.

Las operaciones correspondientes al flujo posterior de aprobación, devolución, rechazo, programación de pago, pago y demás acciones del ciclo de vida de una solicitud serán documentadas cuando sus respectivos endpoints sean incorporados al backend.

---

---

# Contrato de API objetivo

## Propósito

La presente sección documenta los endpoints definidos por la arquitectura funcional del sistema que aún no se encuentran implementados en el backend.

Su objetivo es establecer el contrato de integración entre frontend y backend para las funcionalidades previstas en el MVP y fases posteriores del proyecto.

Los endpoints aquí descritos constituyen la especificación objetivo de la API y servirán como referencia durante el desarrollo de los siguientes módulos.

---

## Convenciones

Los endpoints de esta sección mantienen las mismas convenciones definidas para la API implementada:

- URL base:

```text
/api/v1
```

- Respuestas en formato JSON.
- Identificadores UUID.
- Autenticación mediante sesión.
- Autorización basada en roles y permisos.
- Estructura estándar de respuesta.

La incorporación de un endpoint a la API implementada no implica modificaciones en su contrato, sino únicamente su implementación en el backend.

---

# Flujo de aprobaciones

Este módulo administra las transiciones de estado de las solicitudes de pago desde su envío hasta su programación automática para pago, devolución o anulación.

Los endpoints operan sobre solicitudes previamente creadas y enviadas al flujo de aprobación.

La aprobación de segundo nivel no genera un estado intermedio de aprobación ni requiere una operación adicional de programación. Cuando el Aprobador 2 aprueba la solicitud, esta cambia directamente al estado:

```text
PROGRAMADA_PAGO
```

## Endpoints implementados

```http
GET  /api/v1/solicitudes-pago/aprobar-nivel-1
POST /api/v1/solicitudes-pago/aprobar-nivel-1

GET  /api/v1/solicitudes-pago/aprobar-nivel-2
POST /api/v1/solicitudes-pago/aprobar-nivel-2

POST /api/v1/solicitudes-pago/{id}/devolver
POST /api/v1/solicitudes-pago/devolver
POST /api/v1/solicitudes-pago/anular
PATCH /api/v1/solicitudes-pago/{id}/editar-nivel-1
```

Los endpoints `POST` reciben un arreglo `solicitud_ids`. El mismo contrato
permite aprobar una solicitud o varias seleccionadas mediante checklist; no
existe un endpoint individual redundante.

---

## Editar solicitud en primer nivel

```http
PATCH /api/v1/solicitudes-pago/{id}/editar-nivel-1
```

Requiere el permiso `APROBAR_NIVEL_1` y solo admite solicitudes en
`PENDIENTE_APROBADOR_1` o `DEVUELTA_APROBADOR_1`. No permite modificar
proyecto, centro de costo, tipo, número ni solicitante.

### Cuerpo

```json
{
  "beneficiario_id": "uuid",
  "categoria": "SERVICIOS",
  "medio_pago": "TRANSFERENCIA",
  "descripcion": "Concepto corregido",
  "valor_bruto": 120000,
  "valor_retenciones": 20000,
  "valor_descuentos": 5000
}
```

El servidor recalcula `valor_neto`. Cuando la solicitud está
`DEVUELTA_APROBADOR_1`, también actualiza `valor_reservado` y valida que el
nuevo valor no supere el saldo disponible del fondo.

También admite `multipart/form-data` con los mismos campos y hasta diez
entradas `archivos`. Los soportes son opcionales, aceptan PDF, PNG o JPEG y
tienen un límite de 10 MB por archivo.

---

## Consultar solicitudes pendientes

```http
GET /api/v1/solicitudes-pago/aprobar-nivel-1

GET /api/v1/solicitudes-pago/aprobar-nivel-2
```

Retorna las solicitudes pendientes de atención para el usuario autenticado, de acuerdo con sus roles, permisos y el estado actual de cada solicitud.

Para el rol Aprobador 1, retorna las solicitudes en estado:

```text
PENDIENTE_APROBADOR_1
```

Para el rol Aprobador 2, retorna las solicitudes en estado:

```text
PENDIENTE_APROBADOR_2
```

### Parámetros de consulta

| Parámetro | Tipo | Obligatorio |
|-----------|------|-------------|
| estado_actual | String | No |
| proyecto_base_id | UUID | No |
| centro_costo_id | UUID | No |
| tipo_solicitud | String | No |
| beneficiario_id | UUID | No |
| busqueda | String | No |

---

## Aprobar solicitud en primer nivel

```http
POST /api/v1/solicitudes-pago/aprobar-nivel-1
```

Registra la aprobación del primer nivel.

La operación realiza la siguiente transición:

```text
PENDIENTE_APROBADOR_1
→ PENDIENTE_APROBADOR_2
```

La solicitud queda disponible para revisión por parte del Aprobador 2.

### Cuerpo

```json
{
  "solicitud_ids": ["uuid-1", "uuid-2"]
}
```

---

## Devolver solicitud

```http
POST /api/v1/solicitudes-pago/{id}/devolver
```

El destino se determina por el estado y el nivel del usuario:

- `PENDIENTE_APROBADOR_1` pasa a `DEVUELTA_SOLICITANTE`;
- `PENDIENTE_APROBADOR_2` pasa a `DEVUELTA_APROBADOR_1` y conserva la reserva;
- `DEVUELTA_APROBADOR_1` pasa a `DEVUELTA_SOLICITANTE` y libera la reserva.

La operación realiza la siguiente transición:

```text
PENDIENTE_APROBADOR_1
→ DEVUELTA_SOLICITANTE
```

### Parámetros de ruta

| Parámetro | Tipo |
|-----------|------|
| id | UUID |

### Cuerpo

```json
{
  "motivo": "Debe adjuntar la certificación bancaria vigente."
}
```

El motivo es obligatorio, admite entre 5 y 500 caracteres y se registra en
`devoluciones_solicitud_pago` junto con usuario, fecha, estado anterior y
estado nuevo.

Para devolver varias solicitudes desde el checklist se usa el endpoint de
colección. Todas deben pertenecer al mismo nivel y la operación completa se
confirma en una única transacción:

```json
{
  "solicitud_ids": ["uuid-1", "uuid-2"],
  "motivo": "Se requiere corregir la documentación adjunta."
}
```

---

## Aprobar solicitud en segundo nivel

```http
POST /api/v1/solicitudes-pago/aprobar-nivel-2
```

Registra la aprobación del segundo nivel y finaliza el flujo de aprobación.

La operación realiza directamente la siguiente transición:

```text
PENDIENTE_APROBADOR_2
→ PROGRAMADA_PAGO
```

No se requiere una operación posterior para programar la solicitud. Una vez aprobada por el Aprobador 2, queda automáticamente disponible para que el rol Pagos registre su pago.

### Cuerpo

```json
{
  "solicitud_ids": ["uuid-1", "uuid-2"]
}
```

---

## Anular solicitudes en aprobación nivel 1

```http
POST /api/v1/solicitudes-pago/anular
```

Finaliza el ciclo de vida de una o varias solicitudes que no deben continuar
dentro del proceso. Requiere el permiso `APROBAR_NIVEL_1` y solo admite
solicitudes en `PENDIENTE_APROBADOR_1`.

La operación cambia el estado de la solicitud a:

```text
ANULADA
```

La anulación no elimina físicamente la solicitud ni sus registros asociados. La información permanece disponible para consulta, auditoría y trazabilidad.

### Cuerpo

```json
{
  "solicitud_ids": ["uuid-1", "uuid-2"],
  "motivo": "Solicitud creada con información que no corresponde al pago requerido."
}
```

El motivo de la anulación es obligatorio y debe contener entre 5 y 500
caracteres. La operación es atómica y registra usuario, motivo y fecha para
auditoría.

---

# Ejecución de pagos

Este módulo administra el registro de los pagos efectuados sobre las solicitudes que se encuentran en estado **PROGRAMADA_PAGO**.

La programación del pago no constituye una operación independiente dentro del sistema. Una solicitud pasa automáticamente al estado **PROGRAMADA_PAGO** cuando el Aprobador 2 registra su aprobación.

El rol **PAGOS** es responsable de registrar la ejecución efectiva del pago y de suministrar la información financiera asociada a la transacción.

## Endpoints implementados

```http
GET  /api/v1/solicitudes-pago/programadas

POST /api/v1/solicitudes-pago/registrar-pagos

POST /api/v1/solicitudes-pago/registrar-operacion-efectivo
```

## Endpoint proyectado

```http
POST /api/v1/solicitudes-pago/{id}/revertir-pago
```

---

## Consultar solicitudes programadas para pago

```http
GET /api/v1/solicitudes-pago/programadas
```

Retorna las solicitudes que finalizaron satisfactoriamente el flujo de aprobación y se encuentran pendientes de pago.

La respuesta incluye el saldo actual del fondo de cada solicitud y la
información del beneficiario necesaria para validar el desembolso: banco,
tipo de cuenta y número de cuenta. Las solicitudes pagadas no se incluyen.

## Descargar relación de solicitudes programadas

```http
GET /api/v1/solicitudes-pago/programadas/exportar
```

Genera un archivo `.xlsx` con todas las solicitudes en `PROGRAMADA_PAGO`. Incluye información de la solicitud, proyecto, centro de costo, beneficiario, datos bancarios, valores y fechas de creación, aprobación nivel 1, aprobación nivel 2 y pago.

### Parámetros de consulta

| Parámetro | Tipo | Obligatorio |
|-----------|------|-------------|
| proyecto_base_id | UUID | No |
| centro_costo_id | UUID | No |
| tipo_solicitud | String | No |
| beneficiario_id | UUID | No |
| fecha_desde | Date | No |
| fecha_hasta | Date | No |
| medio_pago | String | No |
| busqueda | String | No |

---

## Registrar pago

```http
POST /api/v1/solicitudes-pago/registrar-pagos
```

Registra uno o varios pagos directos mediante transferencia, PSE o portal. El mismo endpoint cubre el pago
individual cuando recibe un único elemento.

La operación realiza la siguiente transición:

```text
PROGRAMADA_PAGO
→ PAGADA
```

Durante esta operación el sistema:

- registra la fecha del pago;
- registra el medio de pago utilizado;
- registra el número del comprobante o referencia bancaria;
- registra el usuario responsable del registro del pago;
- genera los movimientos financieros correspondientes;
- actualiza el saldo del fondo general del proyecto;
- mantiene la trazabilidad completa de la operación.

### Cuerpo

La solicitud se envía como `multipart/form-data`. El campo `pagos` contiene
un manifiesto JSON y cada elemento referencia su archivo mediante
`archivo_campo`.

```json
{
  "pagos": [
    {
      "solicitud_id": "uuid",
      "medio_pago": "TRANSFERENCIA",
      "numero_comprobante": "TRX-458796",
      "observacion": "Pago realizado mediante transferencia bancaria.",
      "archivo_campo": "soporte_0"
    }
  ]
}
```

Cada solicitud debe incluir una referencia y un soporte propios. La operación
es atómica: si un elemento falla, no se registra ningún pago del lote. La
fecha se asigna automáticamente con la hora del servidor al registrar el
lote. Cada pago directo crea un `pago` y un movimiento
`EGRESO_SOLICITUD_PAGO`.

El soporte usa el mismo contrato multipart para archivos cargados desde el
sistema de archivos o imágenes capturadas con la cámara. No existe un campo API
distinto para la captura fotográfica.

---

## Registrar retiro y pagos

```http
POST /api/v1/solicitudes-pago/registrar-operacion-efectivo
```

Registra un retiro para pagar una o varias solicitudes con medio de pago
`EFECTIVO` o `CONSIGNACION`. Todas las solicitudes deben estar en
`PROGRAMADA_PAGO` y pertenecer al mismo proyecto base y fondo.

La solicitud se envía como `multipart/form-data`. El campo `operacion`
contiene el manifiesto JSON; el soporte general del retiro y cada soporte de
pago se referencian mediante el nombre de su campo.

```json
{
  "valor_retirado": 800000,
  "observacion": "Retiro para pagos del proyecto.",
  "reintegrar_sobrante": false,
  "archivo_retiro_campo": "soporte_retiro",
  "detalles": [
    {
      "solicitud_id": "uuid",
      "numero_comprobante": "CON-458796",
      "observacion": "Consignación al beneficiario.",
      "archivo_campo": "soporte_pago_0"
    }
  ]
}
```

El sistema descuenta una sola vez del fondo el valor total retirado. Marcar
las solicitudes como pagadas no genera descuentos adicionales. Cada pago
exige soporte y las consignaciones exigen referencia.

El soporte general se registra en `adjunto_retiro_id`; cada soporte individual
se relaciona mediante `detalles_operacion_efectivo`. La fecha del retiro se
asigna automáticamente con la hora del servidor al registrar la operación.

---

## Revertir pago

> **Estado:** proyectado; este endpoint todavía no está implementado.

```http
POST /api/v1/solicitudes-pago/{id}/revertir-pago
```

Permite revertir el registro de un pago cuando este haya sido registrado por error.

La operación realiza la siguiente transición:

```text
PAGADA
→ PROGRAMADA_PAGO
```

La reversión:

- elimina el registro financiero asociado al pago;
- revierte los movimientos financieros generados;
- restablece los saldos correspondientes;
- conserva el historial de auditoría de la operación.

### Parámetros de ruta

| Parámetro | Tipo |
|-----------|------|
| id | UUID |

### Cuerpo

```json
{
  "motivo": "El pago fue registrado sobre una solicitud incorrecta."
}
```

El motivo de la reversión es obligatorio.

## Consultar comprobante de una solicitud pagada

```http
GET /api/v1/solicitudes-pago/{id}/comprobante
```

Retorna el archivo del comprobante con disposición `inline`. Requiere que el usuario pueda consultar la solicitud por visibilidad total, relación con el flujo o acceso activo al proyecto. El comprobante puede corresponder a un pago directo o al detalle de una operación de efectivo.

---

# Fondos generales

## Consultar saldos y gasto acumulado

```http
GET /api/v1/fondos
```

Requiere el permiso `CONSULTAR_FONDOS`.

Retorna los proyectos visibles para el usuario con el fondo general, saldo
actual, centros de costo y gasto acumulado por línea y fase.

```json
{
  "ok": true,
  "data": {
    "proyectos": [
      {
        "proyecto_base_id": "uuid",
        "proyecto_nombre": "Proyecto",
        "fondo_id": "uuid",
        "fondo_nombre": "FONDO GENERAL - PROYECTO",
        "saldo_actual": 700000,
        "gasto_total_visible": 300000,
        "centros_costo": [],
        "gasto_por_linea": [],
        "gasto_por_fase": []
      }
    ]
  }
}
```

La visibilidad total se concede a `ADMINISTRADOR`, `AUXILIAR_CONTABLE` y
`PAGOS`. El `DIRECTOR` queda limitado por sus accesos activos a proyecto y
línea de negocio.

---

# Webhook de WhatsApp

## Verificar suscripción

```http
GET /api/v1/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token={token}&hub.challenge={challenge}
```

Compara el token recibido con `WHATSAPP_VERIFY_TOKEN`. Cuando coincide,
responde `200` con el valor de `hub.challenge` como texto plano. Una
verificación inválida responde `403` y una configuración incompleta responde
`503`.

## Recibir evento

```http
POST /api/v1/webhooks/whatsapp
X-Hub-Signature-256: sha256={firma}
Content-Type: application/json
```

La firma HMAC SHA-256 se valida sobre el cuerpo crudo utilizando
`WHATSAPP_APP_SECRET`. Los eventos sin firma válida responden `401`; los
cuerpos inválidos responden `400` y los superiores a 1 MiB responden `413`.
Durante HU-1902 los eventos válidos se confirman con `200`, sin modificar
solicitudes ni persistir estados de entrega.

## Procesar notificaciones pendientes

```http
POST /api/v1/whatsapp/notificaciones/procesar
Authorization: Bearer {WHATSAPP_PROCESSOR_TOKEN}
```

Endpoint interno utilizado por la tarea programada del VPS. Reclama un lote de
notificaciones pendientes, envía las plantillas a WhatsApp Business Platform y
responde con las cantidades revisadas, enviadas, fallidas y omitidas. Un token
inválido responde `401` y una configuración incompleta responde `503`.

Los registros `FALLIDA` se vuelven a intentar después del intervalo configurado
hasta `WHATSAPP_MAX_ATTEMPTS`. Los registros confirmados con identificador de
Meta no vuelven a seleccionarse.

Las plantillas funcionales reciben `destinatario` en el encabezado y parámetros
nombrados en el cuerpo. Todas incluyen `numero_solicitud`, `proyecto`,
`beneficiario`, `valor` y `estado`; las devoluciones y pagos agregan los nombres
de los aprobadores requeridos. La transición a `PROGRAMADA_PAGO` utiliza
`WHATSAPP_TEMPLATE_PROGRAMADA_PAGO` y se dirige a usuarios activos con rol
`PAGOS`.
