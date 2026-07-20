# 08. Seguridad

## Principios

- Autenticación obligatoria.
- Autorización por rol.
- Autorización por centro de costo y variante.
- Validación de estado antes de cada acción.
- Auditoría de acciones sensibles.
- Backend como fuente de verdad.
- No confiar en validaciones del frontend.

## Reglas por flujo

### Solicitudes

- Solo usuarios autorizados pueden crear solicitudes.
- Solo el creador o roles autorizados pueden editar en `BORRADOR`.
- Aprobadores no modifican valores financieros.
- Pagos no modifica impuestos, categorías ni aprobaciones.

### Centro de costo

- Solo `ADMINISTRADOR` crea centros de costo.
- Solo `ADMINISTRADOR` adjudica o inicia ejecución.
- Crear directamente como `ADJUDICADO` es excepción controlada.
- Debe quedar auditado.

### Saldos

- Solo `movimientos_fondo_centro_costo` afecta saldos.
- Toda actualización de saldo debe ser transaccional.
- No se permite saldo negativo.
- No se permite doble descuento.
- Reingresos no pueden superar sobrantes.

### Operaciones de efectivo

Validaciones:

- `valor_retirado >= valor_pagado`.
- `valor_sobrante = valor_retirado - valor_pagado`.
- `valor_reingresado <= valor_sobrante`.
- Toda operación debe tener centro de costo y variante.
- Reingreso de sobrante no pasa por aprobación.

### Impuestos y retenciones

- Valores no negativos.
- Tipos permitidos.
- Naturaleza permitida.
- Pagos no puede modificar impuestos.
- Ajustes posteriores requieren auditoría.
- No crean workflow independiente de aprobación.

### Cargos financieros

- Deben tener centro de costo y variante.
- Deben tener tipo permitido.
- No deben mezclarse con retenciones.
- Generan egreso en `movimientos_fondo_centro_costo`.

## Auditoría obligatoria

Auditar:

- Creación y cambio de centro de costo.
- Habilitación de variantes.
- Creación, envío, aprobación, devolución y pago de solicitudes.
- Registro de impuestos.
- Ajuste de impuestos.
- Registro de cargos financieros.
- Retiro de efectivo.
- Reingreso de sobrante.
- Ajustes financieros.
- Exportaciones sensibles.

## Control de archivos

- Los adjuntos deben almacenarse fuera de la base de datos.
- La base de datos guarda ruta, metadatos y relación.
- Los enlaces deben tener control de acceso.
