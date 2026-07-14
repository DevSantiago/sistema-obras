# 05. Arquitectura

> Última actualización funcional: 14 de julio de 2026.

## Tipo de aplicación

Aplicación web responsiva con backend API, base de datos relacional y almacenamiento de archivos.

Stack vigente de desarrollo:

```text
Next.js App Router
TypeScript
Prisma
PostgreSQL
Vitest
```

## Componentes

```text
Frontend web responsivo
Backend API
Base de datos PostgreSQL
Almacenamiento de archivos
Autenticación
Servicios de dominio
Repositorios
Auditoría
Exportación
OCR futuro
```

## Servicios de dominio

```text
ServicioAutenticacion
ServicioUsuarios
ServicioRolesPermisos
ServicioAccesos
ServicioProyectosBase
ServicioCentrosCosto
ServicioBeneficiarios
ServicioSolicitudesPago
ServicioAprobaciones
ServicioPagos
ServicioFinanciero
ServicioMovimientosFondo
ServicioOperacionesEfectivo
ServicioCargosFinancieros
ServicioImpuestosRetenciones
ServicioPrestamos
ServicioAdjuntos
ServicioAuditoria
ServicioExportacion
ServicioOCR
```

## Capas recomendadas

```text
Rutas API / Controladores
↓
Servicios de aplicación
↓
Repositorios
↓
Base de datos
```

Patrón aplicado:

```text
src/app/api/v1/[modulo]/route.ts
src/modules/[modulo]/[modulo].service.ts
src/modules/[modulo]/[modulo].repository.ts
src/modules/[modulo]/[modulo].types.ts
src/modules/[modulo]/__tests__/[modulo].service.test.ts
```

## Reglas arquitectónicas

- El frontend no accede directamente a la base de datos.
- El backend valida permisos, estados, saldos y transiciones.
- La autorización fina se hace por permisos, no por nombre de rol.
- Los accesos operativos se validan por proyecto base y línea de negocio.
- El saldo se actualiza exclusivamente mediante `movimientos_fondo`.
- Toda operación que afecte saldo debe ser transaccional.
- No se crean tablas separadas de ingresos y egresos.
- Cargos financieros e impuestos se mantienen separados.
- Reingresos de sobrantes e impuestos no usan workflow de aprobación.
- Toda acción sensible debe quedar auditada.
- La base de datos debe tener restricciones `UNIQUE`, índices y `CHECK constraints` para valores críticos.

## Autenticación y sesión

La autenticación usa sesión con cookie `httpOnly`. El backend expone servicios para iniciar sesión, cerrar sesión y consultar usuario autenticado.

La sesión debe incluir:

```text
id
nombre
correo
estado
roles
permisos
```

## Proyectos base y centros de costo

El modelo vigente separa:

```text
proyectos_base: agrupador del negocio y dueño del fondo general
centros_costo: clasificación operativa del gasto por línea y fase
fondos: saldo general del proyecto base
```

Centros posibles:

```text
PRO-OBRA
OBRA
PRO-INT
INT
```

## Flujo financiero transaccional

Para un egreso:

```text
Validar usuario
Validar permiso
Validar acceso al proyecto/línea
Validar estado
Validar saldo
Crear movimiento
Actualizar saldo
Registrar auditoría
Confirmar transacción
```

Para un ingreso:

```text
Validar usuario
Validar permiso
Validar origen
Crear movimiento
Actualizar saldo
Registrar auditoría
Confirmar transacción
```

## Visibilidad y autorización de solicitudes

La consulta de solicitudes debe construir el alcance en la capa de servicio y aplicarlo en el repositorio. Los accesos por proyecto y línea sirven para autorizar dónde opera el usuario, pero no para otorgar visibilidad de solicitudes de terceros. Solo `ADMINISTRADOR` tiene consulta total.

El `APROBADOR_1` puede actualizar valores y datos funcionales de una solicitud en revisión, excepto `creado_por`. El cambio debe ejecutarse transaccionalmente junto con su registro de auditoría.

## Beneficiarios

El módulo de beneficiarios maneja:

```text
beneficiarios_pago
proveedores
```

Reglas arquitectónicas:

- El beneficiario es quien recibe el pago.
- El proveedor es un catálogo complementario para beneficiarios tipo `PROVEEDOR`.
- El usuario es quien opera el sistema.
- No se debe crear usuario automáticamente por cada beneficiario.
- La creación de proveedor y beneficiario debe ser transaccional cuando se envían juntos.
- Los campos de documento y datos bancarios se validan en service y deben reforzarse en base de datos.

## Nómina

La nómina individual y agrupada es creada exclusivamente por `ADMINISTRADOR`. El `DIRECTOR` no está autorizado para crear solicitudes de nómina.

`periodo_nomina` se modela como una cadena normalizada `YYYY-MM`; la capa de servicio valida que pertenezca al año vigente y que no supere el mes actual.

### Nómina individual

La nómina individual reutiliza la estructura general de `solicitudes_pago`.

Características:

- La cabecera registra `beneficiario_id`.
- La cabecera registra `concepto_nomina`.
- La cabecera registra `medio_pago`.
- El beneficiario debe ser tipo `TRABAJADOR`.
- La validación de duplicados se realiza por:
  - proyecto base;
  - centro de costo;
  - trabajador;
  - concepto de nómina;
  - periodo de nómina.
- Las solicitudes con estado `ANULADA` no participan en la validación de duplicados.

### Nómina agrupada

La nómina agrupada utiliza una cabecera única (`solicitudes_pago`) y un detalle por trabajador (`detalles_nomina_solicitud`).

La cabecera registra:

- proyecto base;
- centro de costo;
- fondo;
- periodo de nómina;
- archivo origen;
- valores consolidados.

La cabecera **no** registra:

- beneficiario;
- concepto de nómina;
- medio de pago.

Estos datos pertenecen al detalle de cada trabajador.

Cada solicitud agrupada pertenece a:

- un único proyecto base;
- un único centro de costo;
- un único fondo;
- un único periodo de nómina.

Un mismo archivo puede contener simultáneamente conceptos como:

- salario;
- honorarios;
- bonificación;
- liquidación;
- auxilio;
- otro.

Cada concepto pertenece exclusivamente al detalle de la solicitud.

La clave funcional para detectar duplicados dentro del archivo es:

```text
tipo_documento
+
numero_documento
+
concepto_nomina
```

Por lo tanto, un mismo trabajador puede aparecer varias veces dentro del mismo archivo siempre que el concepto sea diferente.

La validación contra solicitudes existentes agrega además:

- proyecto base;
- centro de costo;
- periodo de nómina.

Las solicitudes con estado `ANULADA` no participan en esta validación.

### Flujo arquitectónico

El backend divide el proceso en dos etapas.

#### VALIDAR

Responsabilidades:

- validar permisos;
- validar proyecto;
- validar centro de costo;
- validar fondo;
- leer el archivo Excel;
- normalizar encabezados;
- validar filas;
- calcular valores netos;
- calcular valores consolidados;
- detectar duplicados;
- identificar trabajadores inexistentes;
- almacenar temporalmente el archivo.

La acción `VALIDAR` nunca crea:

- beneficiarios;
- solicitudes;
- detalles de solicitud.

#### CREAR

Responsabilidades:

- revalidar toda la información;
- crear beneficiarios faltantes cuando el usuario lo confirme;
- reutilizar beneficiarios existentes;
- generar el consecutivo documental;
- crear la cabecera;
- crear los detalles;
- asociar el archivo origen;
- registrar auditoría cuando la funcionalidad transversal de auditoría esté implementada.

Toda la operación debe ejecutarse dentro de una única transacción.

### Organización del módulo

```text
src/modules/solicitudes-pago/
│
├── solicitudes-pago.repository.ts
├── solicitudes-pago.service.ts
├── solicitudes-pago.types.ts
│
└── nomina-grupal/
    ├── nomina-grupal.types.ts
    ├── nomina-grupal.validators.ts
    ├── nomina-grupal.excel.ts
    ├── nomina-grupal.repository.ts
    ├── nomina-grupal.service.ts
    └── __tests__/
        └── nomina-grupal.service.test.ts
```

Responsabilidades de cada componente:

- **nomina-grupal.excel.ts**
  - lectura del archivo Excel;
  - validación de encabezados;
  - normalización de filas.

- **nomina-grupal.validators.ts**
  - validaciones de negocio;
  - validación de conceptos;
  - validación bancaria;
  - cálculo de valores;
  - detección de duplicados;
  - estados de validación.

- **nomina-grupal.repository.ts**
  - consultas a Prisma;
  - búsqueda y reutilización de beneficiarios;
  - validación de duplicados persistidos;
  - persistencia transaccional.

- **nomina-grupal.service.ts**
  - orquestación del proceso;
  - validaciones finales;
  - permisos;
  - generación del consecutivo;
  - creación de beneficiarios;
  - creación de la solicitud.

- **route.ts**
  - autenticación;
  - recepción de `multipart/form-data`;
  - acciones `VALIDAR` y `CREAR`.

## Secuencias documentales

La generación de referencias debe ser atómica y contextual por `tipo_secuencia + proyecto_base_id + centro_costo_id + anio`. La referencia visible usa prefijo documental, referencia del centro, referencia del proyecto, año y consecutivo.

## Pagos en efectivo

Política recomendada:

- Si se retira más de lo pagado, registrar egreso por el valor retirado.
- Registrar el retiro agrupado en `operaciones_efectivo` y cada solicitud incluida en `operaciones_efectivo_solicitudes`.
- Mantener sobrante pendiente.
- Registrar ingreso cuando el sobrante vuelva al fondo.
- Evitar doble descuento entre `EGRESO_RETIRO_EFECTIVO` y `EGRESO_SOLICITUD_PAGO`.

## Cargos financieros

Se manejan como submódulo financiero.

No son impuestos ni retenciones.

## Impuestos y retenciones

Se manejan con servicio propio. Pueden afectar el valor neto de la solicitud o generar movimientos financieros independientes si el negocio decide registrar pagos tributarios separados.

## Entidades de soporte financiero en arquitectura

El servicio financiero debe coordinar estas tablas principales:

```text
fondos
movimientos_fondo
operaciones_efectivo
cargos_financieros
impuestos_retenciones_solicitud
```

Regla:

```text
cargos_financieros guarda el detalle del cargo.
movimientos_fondo guarda el egreso que afecta el saldo.
```

## Pruebas

Cada módulo debe incluir:

- Pruebas unitarias de service.
- Validación de rutas por `curl` o cliente HTTP.
- Validación funcional en navegador cuando exista frontend.
- `npm run lint` exitoso.
- `npm run test:run` exitoso.

### Diseño de operaciones de efectivo agrupadas

- `operaciones_efectivo` actúa como cabecera del retiro.
- `operaciones_efectivo_solicitudes` resuelve la relación muchos a muchos entre retiro y solicitudes, con el valor asignado a cada solicitud.
- `reingresos_sobrante_efectivo` registra uno o varios reingresos asociados al retiro.
- Los movimientos de fondo conservan la referencia a la operación de efectivo y al fondo afectado.
- Los préstamos se procesan antes del retiro cuando un proyecto requiere disponibilidad adicional.
