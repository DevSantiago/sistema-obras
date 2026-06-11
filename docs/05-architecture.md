# 05. Arquitectura

## Tipo de aplicación

Aplicación web responsiva con backend API, base de datos relacional y almacenamiento de archivos.

## Componentes

```text
Frontend web responsivo
Backend API
Base de datos PostgreSQL
Almacenamiento de archivos
Autenticación
Servicios de dominio
Auditoría
Exportación
OCR futuro
```

## Servicios de dominio

```text
ServicioAutenticacion
ServicioUsuarios
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
Rutas / Controladores
↓
Servicios de aplicación
↓
Servicios de dominio
↓
Repositorios
↓
Base de datos
```

## Reglas arquitectónicas

- El frontend no accede directamente a la base de datos.
- El backend valida permisos, estados, saldos y transiciones.
- El saldo se actualiza exclusivamente mediante `movimientos_fondo_centro_costo`.
- Toda operación que afecte saldo debe ser transaccional.
- No se crean tablas separadas de ingresos y egresos.
- Cargos financieros e impuestos se mantienen separados.
- Reingresos de sobrantes e impuestos no usan workflow de aprobación.
- Toda acción sensible queda auditada.

## Centro de costo

El saldo vive en `fondos_centro_costo`.

Las variantes clasifican:

```text
PROYECTO
OBRA
INTERVENTORIA
```

No tienen saldo independiente.

## Flujo financiero transaccional

Para un egreso:

```text
Validar usuario
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
Validar origen
Crear movimiento
Actualizar saldo
Registrar auditoría
Confirmar transacción
```

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
fondos_centro_costo
movimientos_fondo_centro_costo
operaciones_efectivo
cargos_financieros
impuestos_retenciones_solicitud
```

Regla:

```text
cargos_financieros guarda el detalle del cargo.
movimientos_fondo_centro_costo guarda el egreso que afecta el saldo.
```
