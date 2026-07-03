# 01. Visión del producto

## Objetivo

Construir una aplicación web responsiva para gestionar solicitudes de pago, beneficiarios, aprobaciones, pagos, fondo general por proyecto base, centros de costo operativos, préstamos, anticipos, reembolsos, nómina, impuestos, cargos financieros, operaciones de efectivo, adjuntos, auditoría y exportación de información.

El sistema reemplaza el proceso manual de recepción de soportes, revisión, transcripción y control financiero en hojas de cálculo, manteniendo trazabilidad por usuario, rol, permiso, proyecto base, línea de negocio y centro de costo operativo.

## Problema

Actualmente las solicitudes de pago y sus soportes pueden manejarse manualmente, lo que genera:

- Dificultad para saber el estado real de cada solicitud.
- Riesgo de pérdida de soportes.
- Falta de trazabilidad de aprobaciones.
- Dificultad para controlar saldos.
- Dificultad para distinguir pagos, reembolsos, nómina, préstamos, impuestos, cargos financieros y reingresos.
- Riesgo de inconsistencias entre valor bruto, impuestos, retenciones, valor neto y egresos reales.
- Falta de control cuando se retira efectivo por valores superiores al pago por restricciones de cajero.
- Dificultad para saber qué usuarios pueden operar sobre cada proyecto y línea de negocio.
- Riesgo de asignar privilegios por nombre de rol en lugar de permisos verificables.

## Alcance funcional

El MVP debe incluir:

- Autenticación con sesión privada mediante cookie `httpOnly`.
- Usuarios con rol único.
- Roles, permisos y líneas de negocio por rol.
- Accesos por proyecto base y línea de negocio.
- Proyectos base.
- Centros de costo operativos por línea y fase: `PRO-OBRA`, `OBRA`, `PRO-INT`, `INT`.
- Fondo general por proyecto base.
- Beneficiarios de pago.
- Proveedores asociados a beneficiarios tipo `PROVEEDOR`.
- Solicitudes de pago.
- Pago a proveedor.
- Reembolsos.
- Nómina individual y agrupada por Excel.
- Adjuntos y soportes.
- Doble aprobación.
- Marcación de pago.
- Movimientos financieros.
- Préstamos, anticipos y devoluciones.
- Cargos financieros.
- Operaciones de efectivo y reingreso de sobrantes.
- Impuestos y retenciones.
- Auditoría.
- Exportación a Excel.
- Estrategia OCR futura.

## Decisiones funcionales principales

### Aplicación web responsiva

El sistema será una aplicación web responsiva. No se plantea una app móvil nativa para el MVP.

### Proyecto base, centros de costo y fondo general

El modelo vigente no usa un centro de costo único con variantes como eje principal del MVP. El sistema se organiza así:

```text
Proyecto base
├── Fondo general del proyecto
├── PRO-OBRA   (línea OBRA, fase LICITACION)
├── OBRA       (línea OBRA, fase EJECUCION)
├── PRO-INT    (línea INTERVENTORIA, fase LICITACION)
└── INT        (línea INTERVENTORIA, fase EJECUCION)
```

El fondo vive en el proyecto base. Los centros de costo no tienen saldo independiente; clasifican la imputación del gasto por línea de negocio y fase.

El fondo responde:

```text
de dónde sale la plata
```

El centro de costo responde:

```text
en qué línea y fase se gastó
```

### Ciclo de vida del proyecto y centros de costo

El proyecto base puede tener estos estados:

```text
EN_LICITACION
EN_EJECUCION
FINALIZADO
```

Los centros de costo pueden tener estos estados:

```text
EN_LICITACION
EN_EJECUCION
FINALIZADO
```

Reglas principales:

- Al crear un proyecto base se crean centros iniciales solo en fase `LICITACION`.
- Si se selecciona `OBRA`, se crea `PRO-OBRA` en `EN_LICITACION`.
- Si se selecciona `INTERVENTORIA`, se crea `PRO-INT` en `EN_LICITACION`.
- Cuando `PRO-OBRA` pasa a ejecución, se finaliza `PRO-OBRA` y se crea `OBRA` en `EN_EJECUCION`.
- Cuando `PRO-INT` pasa a ejecución, se finaliza `PRO-INT` y se crea `INT` en `EN_EJECUCION`.
- Cuando todos los centros activos quedan `FINALIZADO`, el proyecto base queda `FINALIZADO`.

### Roles, permisos y accesos

El sistema no debe autorizar acciones únicamente por nombre de rol. La regla vigente es:

```text
rol define permisos
acceso define dónde opera el usuario
```

Cada usuario tiene un único rol activo. Los permisos se derivan del rol mediante `roles_permisos`. Los accesos se asignan por:

```text
proyecto_base + linea_negocio
```

La línea `OBRA` habilita operación sobre `PRO-OBRA` y `OBRA`. La línea `INTERVENTORIA` habilita operación sobre `PRO-INT` e `INT`.

### Roles funcionales vigentes

```text
ADMINISTRADOR
DIRECTOR
APROBADOR_1
APROBADOR_2
AUXILIAR_CONTABLE
PAGOS
SOLICITANTE
```

El rol `LECTURA` queda como referencia histórica y no es parte activa del flujo del MVP salvo decisión posterior.

### Pagos no programa pagos

El rol `PAGOS` no programa pagos.

La aprobación de segundo nivel deja la solicitud en:

```text
PROGRAMADA_PAGO
```

Luego el rol `PAGOS` solo marca como:

```text
PAGADA
```

El descuento del saldo ocurre al marcar como pagada o al registrar el movimiento financiero correspondiente según el medio de pago.

### Beneficiarios y proveedores

La tabla `beneficiarios_pago` representa personas o entidades que reciben pagos.

Tipos de beneficiario:

```text
PROVEEDOR
TRABAJADOR
OTRO
```

No todos los beneficiarios son usuarios del sistema. Por eso `usuario_id` es opcional.

Para que el módulo Pagos pueda operar correctamente, los siguientes campos son obligatorios en el beneficiario:

- Tipo de documento.
- Número de documento.
- Medio de pago preferido.
- Banco.
- Tipo de cuenta bancaria.
- Número de cuenta bancaria.

Los beneficiarios tipo `PROVEEDOR` pueden estar asociados a un registro en `proveedores`.

### Categorías y conceptos

No se usa un campo genérico `item` como clasificación principal. Se usan campos funcionales:

| Tipo de solicitud | Campo |
|---|---|
| Pago a proveedor | `categoria_gasto` |
| Reembolso | `categoria_reembolso` |
| Nómina | `concepto_nomina` |
| Otro pago | `categoria_gasto` |

Si el valor es `OTRO`, la descripción es obligatoria.

### Impuestos y cargos financieros

Los impuestos y retenciones no son cargos financieros.

| Concepto | Naturaleza |
|---|---|
| Impuestos y retenciones | Desglose tributario de una solicitud o registro contable |
| Cargos financieros | Costos bancarios u operativos del movimiento de dinero |

Ejemplos de impuestos: IVA, RETEFUENTE, RETEICA, RETEIVA, estampillas.

Ejemplos de cargos financieros: GMF, cuatro por mil, comisión bancaria, costo de retiro.

### Operaciones de efectivo

Cuando se paga en efectivo, puede ocurrir que el cajero solo permita retirar múltiplos determinados.

Ejemplo:

```text
Valor requerido: 87.000
Valor retirado: 100.000
Valor pagado: 87.000
Sobrante: 13.000
```

El sobrante debe quedar pendiente de reingreso hasta que sea consignado o ajustado.

## Fuera del MVP

- OCR avanzado.
- Integraciones ERP.
- Conciliación bancaria automática.
- Firma digital.
- App móvil nativa.
- Contabilidad completa.
- Cálculo tributario automático avanzado.
- Intereses complejos de préstamos.

## Estado de decisiones implementadas

A la fecha de esta actualización ya se encuentran implementados y validados técnicamente:

- Autenticación y sesión.
- Usuarios con rol único.
- Roles, permisos y líneas de negocio por rol.
- Accesos por proyecto base y línea.
- Proyectos base.
- Centros `PRO-OBRA`, `OBRA`, `PRO-INT`, `INT`.
- Fondo general por proyecto base.
- Creación/listado/consulta de beneficiarios.
- Creación de proveedores asociados a beneficiarios tipo `PROVEEDOR`.
- Restricciones de base de datos para estados y líneas críticas.

## Criterio de preservación documental

La documentación no debe manejar decisiones vigentes como parches acumulados. Cada archivo debe contener la versión integrada del proceso que le corresponde.

Para evitar pérdida de información, toda decisión funcional debe quedar reflejada en al menos uno de estos niveles:

- Visión funcional.
- Proceso de negocio.
- Roles y permisos.
- Estados.
- Arquitectura.
- Modelo de datos.
- API.
- Seguridad.
- Backlog.
