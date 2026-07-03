# 12. Flujos por usuario y rol

## Administrador

Rol técnico de superusuario.

### Crear proyecto base

```text
Ingresar al sistema
↓
Ir a Proyectos base
↓
Crear proyecto base
↓
Seleccionar líneas iniciales: OBRA, INTERVENTORIA o ambas
↓
Sistema crea fondo general
↓
Sistema crea centros iniciales PRO-OBRA y/o PRO-INT
```

### Gestionar usuarios y accesos

```text
Ingresar a Usuarios
↓
Crear o editar usuario
↓
Asignar rol único
↓
Asignar accesos por proyecto base y línea de negocio
↓
Sistema valida líneas permitidas por rol
↓
Sistema guarda accesos activos
```

### Gestionar beneficiarios

```text
Ingresar a Beneficiarios
↓
Crear beneficiario
↓
Registrar tipo, documento y datos bancarios
↓
Si es proveedor, registrar proveedor asociado
↓
Sistema valida duplicados
```

## Director

Responsable de proyectos asignados.

```text
Ingresar al sistema
↓
Consultar proyectos asignados
↓
Crear solicitudes
↓
Crear proyectos si el negocio lo requiere
↓
Crear usuarios y asignar accesos si tiene permisos
```

No aprueba nivel 1, no aprueba nivel 2 y no marca pagos.

## Solicitante

```text
Ingresar al sistema
↓
Ver proyectos con acceso OBRA
↓
Crear solicitud
↓
Seleccionar proyecto base
↓
Seleccionar centro de costo operativo permitido
↓
Seleccionar tipo de solicitud
↓
Seleccionar beneficiario
↓
Registrar valores
↓
Adjuntar soportes
↓
Enviar
```

El solicitante no opera sobre `INTERVENTORIA`.

## Aprobador 1

Socio operativo.

```text
Ver solicitudes PENDIENTE_APROBADOR_1
↓
Revisar soporte, valores, impuestos, beneficiario y categoría
↓
Aprobar nivel 1 o devolver al solicitante
```

También puede crear proyectos, usuarios y accesos si conserva los permisos definidos.

No marca pagos.

## Aprobador 2

Socio financiero.

```text
Ver resumen agrupado
↓
Entrar al detalle
↓
Revisar solicitud aprobada por Aprobador 1
↓
Aprobar nivel 2 o devolver a Aprobador 1
↓
Si aprueba, solicitud queda PROGRAMADA_PAGO
```

No marca pagos.

## Auxiliar contable

```text
Ingresar al sistema
↓
Crear solicitudes si corresponde
↓
Gestionar beneficiarios
↓
Cargar o preparar información financiera cuando el módulo esté disponible
↓
Registrar cargos financieros, saldos o reingresos según permisos futuros
```

Debe ser el rol principal para:

- Cargar saldos.
- Cargar costos operativos de cuentas bancarias.
- Registrar reingresos de dinero en efectivo sobrante de un retiro.

## Pagos

```text
Ver solicitudes PROGRAMADA_PAGO
↓
Revisar medio de pago y datos del beneficiario
↓
Registrar pago
↓
Marcar como PAGADA
↓
Sistema genera movimiento financiero
```

Pagos no programa, no aprueba y no crea usuarios ni proyectos.

## Pago en efectivo con sobrante

```text
Solicitud PROGRAMADA_PAGO
↓
Pagos registra valor requerido
↓
Registra valor retirado
↓
Registra valor pagado
↓
Sistema calcula sobrante
↓
Solicitud queda PAGADA
↓
Sobrante queda pendiente
↓
Usuario autorizado registra reingreso
↓
Sistema crea ingreso
```

## Cargos financieros

```text
Usuario autorizado entra a Financiero
↓
Selecciona proyecto base
↓
Selecciona centro de costo operativo
↓
Registra cargo financiero
↓
Sistema crea egreso
```

## Impuestos y retenciones

```text
Usuario autorizado registra impuesto o retención en solicitud
↓
Sistema valida valores
↓
Sistema actualiza desglose
↓
Sistema audita
```

No crea aprobación independiente.

## Flujo de consulta financiera

```text
Usuario autorizado ingresa al módulo Financiero
↓
Selecciona proyecto base
↓
Consulta saldo del fondo general
↓
Consulta movimientos_fondo
↓
Filtra por centro de costo, línea, fase, tipo de movimiento, fecha o entidad origen
↓
Exporta si tiene permiso
```

## Flujo de beneficiarios

```text
Usuario autorizado ingresa al módulo Beneficiarios
↓
Registra beneficiario PROVEEDOR, TRABAJADOR u OTRO
↓
Registra documento y datos bancarios obligatorios
↓
Sistema valida duplicado activo
↓
Sistema guarda beneficiario
```

Para proveedor:

```text
Crear beneficiario tipo PROVEEDOR
↓
Enviar datos de proveedor asociado
↓
Sistema crea proveedor y beneficiario en transacción
```
