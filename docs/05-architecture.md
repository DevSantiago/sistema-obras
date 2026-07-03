# 05. Arquitectura

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

## Pagos en efectivo

Política recomendada:

- Si se retira más de lo pagado, registrar egreso por el valor retirado.
- Registrar valor pagado al beneficiario dentro de `operaciones_efectivo`.
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
