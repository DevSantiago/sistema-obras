# 08. Seguridad

> Última actualización funcional: 14 de julio de 2026.

## Principios

- Autenticación obligatoria.
- Sesión protegida mediante cookie `httpOnly`.
- Autorización por permisos.
- Acceso operativo por proyecto base y línea de negocio.
- Validación de estado antes de cada acción.
- Auditoría de acciones sensibles.
- Backend como fuente de verdad.
- No confiar en validaciones del frontend.
- Base de datos robusta mediante restricciones `UNIQUE`, `NOT NULL`, índices y `CHECK constraints`.

## Reglas por flujo

### Usuarios y accesos

- Cada usuario tiene un único rol activo.
- Las acciones se autorizan por permisos derivados del rol.
- Crear usuarios requiere `CREAR_USUARIOS`.
- Asignar accesos requiere `ASIGNAR_ACCESOS`.
- Los accesos se asignan por `proyecto_base + linea_negocio`.
- `SOLICITANTE` solo puede tener acceso a `OBRA`.
- El backend debe impedir accesos incompatibles con las líneas permitidas del rol.

### Proyectos base y centros de costo

- Crear proyectos requiere `CREAR_PROYECTOS`.
- La creación de proyecto, fondo y centros iniciales debe ser transaccional.
- Los centros iniciales solo se crean en fase `LICITACION`.
- Las transiciones de centro de costo deben validar estado actual, estado destino y fase.
- No se permite convertir directamente `PRO-OBRA` en `OBRA`; se finaliza el primero y se crea el segundo.
- No se permite convertir directamente `PRO-INT` en `INT`; se finaliza el primero y se crea el segundo.

### Beneficiarios

- Solo usuarios autorizados pueden gestionar beneficiarios.
- El beneficiario no necesariamente es usuario del sistema.
- `tipo_documento` y `numero_documento` son obligatorios.
- `medio_pago_preferido` es obligatorio. `banco`, `tipo_cuenta_bancaria` y `numero_cuenta_bancaria` son obligatorios únicamente para `TRANSFERENCIA` o `CONSIGNACION` y opcionales para `EFECTIVO`.
- Se debe impedir crear beneficiarios activos duplicados por tipo y número de documento.
- Si se crea proveedor y beneficiario en la misma operación, debe hacerse en transacción.
- Los proveedores deben validar tipo y número de documento.
- Un beneficiario `TRABAJADOR` no puede usar `NIT`.

### Solicitudes

- Solo usuarios autorizados pueden crear solicitudes.
- Solo el creador o roles autorizados pueden editar en `BORRADOR`.
- `APROBADOR_1` puede modificar valores y demás datos funcionales de una solicitud en revisión, excepto `creado_por`.
- Toda edición de `APROBADOR_1` debe registrar usuario, fecha, campo, valor anterior y valor nuevo.
- Pagos no modifica impuestos, categorías ni aprobaciones.
- La creación de solicitudes debe validar acceso al proyecto base y línea de negocio.
- Solo `ADMINISTRADOR` puede consultar todas las solicitudes. `CONSULTAR_TODO` no debe omitir las reglas específicas de visibilidad del módulo.
- Los borradores de un usuario no deben exponerse a otros usuarios, incluido `APROBADOR_1`.
- La nómina individual y agrupada solo puede ser creada por `ADMINISTRADOR`.
- Se debe impedir duplicar una nómina individual no anulada por proyecto, centro, trabajador, concepto y periodo.

### Saldos

- Solo `movimientos_fondo` afecta saldos.
- Toda actualización de saldo debe ser transaccional.
- No se permite saldo negativo.
- No se permite doble descuento.
- Reingresos no pueden superar sobrantes.
- El fondo pertenece al proyecto base, no al centro de costo.

### Operaciones de efectivo

Validaciones:

- `valor_retirado >= valor_pagado`.
- `valor_sobrante = valor_retirado - valor_pagado`.
- `valor_reingresado <= valor_sobrante`.
- Toda operación debe tener proyecto base y centro de costo cuando afecte imputación.
- Reingreso de sobrante no pasa por aprobación.

### Impuestos y retenciones

- Valores no negativos.
- Tipos permitidos.
- Naturaleza permitida.
- Pagos no puede modificar impuestos.
- Ajustes posteriores requieren auditoría.
- No crean workflow independiente de aprobación.

### Cargos financieros

- Deben tener proyecto base y centro de costo cuando afecten imputación.
- Deben tener tipo permitido.
- No deben mezclarse con retenciones.
- Generan egreso en `movimientos_fondo`.

## Restricciones de base de datos

Ya deben existir restricciones para valores críticos como:

```text
usuarios.estado
proyectos_base.estado_proyecto
centros_costo.linea_negocio
centros_costo.fase_centro_costo
centros_costo.estado_centro_costo
solicitudes_pago.tipo_solicitud
solicitudes_pago.medio_pago
solicitudes_pago.periodo_nomina — validado en formato `YYYY-MM`, limitado al año vigente y al mes actual
accesos_usuario_proyecto.linea_negocio
roles_lineas_negocio.linea_negocio
```

Regla de migraciones:

- No modificar una migración ya aplicada.
- Si una migración aplicada quedó incompleta, crear una nueva migración correctiva.
- No usar `migrate reset` salvo decisión consciente de perder datos en ambiente local.

## Auditoría obligatoria

Auditar:

- Creación y cambio de proyecto base.
- Creación y cambio de centros de costo.
- Asignación, revocación y reactivación de accesos.
- Creación, edición e inactivación de usuarios.
- Creación, edición e inactivación de beneficiarios.
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
- Los adjuntos relacionados con pagos, retiros, reingresos y aprobaciones deben conservar trazabilidad de usuario y fecha.

## Controles para retiros agrupados y préstamos

- Una solicitud no puede asociarse dos veces al mismo retiro.
- La suma de valores asignados debe coincidir con el valor requerido del retiro.
- Un reingreso se registra contra el retiro y nunca directamente contra una solicitud.
- La suma de reingresos no puede superar el sobrante.
- Antes de un préstamo `PROYECTO_A_PROYECTO` se valida saldo suficiente en el proyecto origen.
- El proyecto origen y destino deben ser distintos.
- Préstamo, retiro y reingreso generan auditoría independiente.
