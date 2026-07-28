# 01. Visión del producto

> Última actualización funcional: 19 de julio de 2026.

## Objetivo

Construir una aplicación web responsiva para gestionar de extremo a extremo solicitudes de pago, beneficiarios, soportes, aprobaciones, pagos y movimientos financieros asociados a proyectos de obra e interventoría.

El sistema debe reemplazar el proceso manual de recepción de documentos, revisión, transcripción y control mediante hojas de cálculo, manteniendo trazabilidad por usuario, rol, permiso, proyecto base, línea de negocio, centro de costo, solicitud, aprobación, pago y movimiento financiero.

## Problema que resuelve

La gestión manual de solicitudes de pago y soportes genera riesgos operativos, financieros y de control, entre ellos:

- Dificultad para conocer el estado real de cada solicitud.
- Pérdida, dispersión o duplicación de soportes.
- Falta de trazabilidad sobre quién creó, modificó, envió, aprobó, devolvió o pagó una solicitud.
- Dificultad para controlar saldos y movimientos financieros por proyecto.
- Riesgo de mezclar gastos de licitación y ejecución, o de obra e interventoría.
- Dificultad para distinguir pagos a proveedores, nómina, reembolsos y obligaciones tributarias.
- Inconsistencias entre valor bruto, impuestos, retenciones, descuentos, valor neto y valor efectivamente pagado.
- Falta de control sobre retiros de efectivo, pagos agrupados y reingresos de sobrantes.
- Dificultad para determinar qué usuarios pueden operar sobre cada proyecto y línea de negocio.
- Riesgo de autorizar acciones únicamente por el nombre del rol, sin validar permisos efectivos.
- Dependencia de procesos manuales para generar consecutivos, consultar historial y consolidar información.

## Principios del producto

### Fuente única de verdad

La aplicación y su base de datos deben convertirse en la fuente oficial de información para solicitudes, aprobaciones, pagos y movimientos financieros.

### Trazabilidad integral

Toda acción sensible debe conservar, como mínimo:

- usuario responsable;
- fecha y hora;
- entidad afectada;
- acción realizada;
- estado anterior y nuevo cuando aplique;
- valores anteriores y nuevos cuando exista una edición;
- comentario o justificación cuando sea requerido.

### Backend como autoridad

El frontend facilita la operación, pero no define la seguridad ni la validez del proceso. El backend debe validar permisos, accesos, estados, transiciones, datos obligatorios, duplicados, saldos y reglas de negocio.

### Separación entre autorización y alcance operativo

La regla funcional vigente es:

```text
rol y permisos definen qué puede hacer el usuario
accesos definen dónde puede hacerlo
```

### Entregas verticales por módulo

El desarrollo se ejecuta por módulos completos siguiendo este ciclo:

```text
backend
↓
pruebas técnicas
↓
frontend
↓
integración
↓
validación funcional
```

No se considera cerrado un módulo funcional hasta que exista una versión mínima integrada y validada, salvo funcionalidades expresamente registradas como pendientes.

## Alcance funcional del MVP

El MVP debe incluir:

- Autenticación con sesión privada mediante cookie `httpOnly`.
- Usuarios con un único rol activo.
- Roles, permisos y líneas de negocio permitidas por rol.
- Accesos por proyecto base y línea de negocio.
- Proyectos base.
- Centros de costo `PRO-OBRA`, `OBRA`, `PRO-INT` e `INT`.
- Fondo general por proyecto base.
- Beneficiarios tipo `PROVEEDOR`, `TRABAJADOR` y `OTRO`.
- Proveedores asociados a beneficiarios cuando aplique.
- Secuencias documentales contextuales.
- Solicitudes de pago a proveedores.
- Solicitudes de nómina individual.
- Solicitudes de nómina agrupada mediante Excel.
- Solicitudes de reembolso.
- Solicitudes de pago de impuestos.
- Edición de solicitudes mientras permanezcan en `BORRADOR`.
- Listado y consulta detallada de solicitudes.
- Envío de solicitudes al flujo de aprobación.
- Adjuntos y soportes.
- Doble aprobación.
- Devoluciones para corrección.
- Marcación de pago.
- Movimientos financieros.
- Préstamos de persona a proyecto y de proyecto a proyecto.
- Anticipos y devoluciones.
- Cargos financieros.
- Operaciones de efectivo agrupadas.
- Reingresos de sobrantes asociados al retiro.
- Impuestos y retenciones.
- Auditoría.
- Exportación a Excel.
- Base preparada para una estrategia OCR futura.

## Modelo operativo del negocio

### Proyecto base, centros de costo y fondo general

El proyecto base es el agrupador principal del negocio y el propietario del fondo general.

```text
Proyecto base
├── Fondo general del proyecto
├── PRO-OBRA   (línea OBRA, fase LICITACION)
├── OBRA       (línea OBRA, fase EJECUCION)
├── PRO-INT    (línea INTERVENTORIA, fase LICITACION)
└── INT        (línea INTERVENTORIA, fase EJECUCION)
```

Los centros de costo no tienen saldo independiente. Su propósito es clasificar la imputación del gasto por línea de negocio y fase.

```text
Fondo general: de dónde sale el dinero.
Centro de costo: en qué línea y fase se utiliza.
```

### Ciclo de vida del proyecto y sus centros

Estados del proyecto base:

```text
EN_LICITACION
EN_EJECUCION
FINALIZADO
```

Estados de los centros de costo:

```text
EN_LICITACION
EN_EJECUCION
FINALIZADO
```

Reglas principales:

- Al crear un proyecto base se seleccionan las líneas iniciales `OBRA`, `INTERVENTORIA` o ambas.
- Para la línea `OBRA` se crea `PRO-OBRA` en `EN_LICITACION`.
- Para la línea `INTERVENTORIA` se crea `PRO-INT` en `EN_LICITACION`.
- Cuando la línea de obra inicia ejecución, `PRO-OBRA` se finaliza y se crea `OBRA` en `EN_EJECUCION`.
- Cuando la línea de interventoría inicia ejecución, `PRO-INT` se finaliza y se crea `INT` en `EN_EJECUCION`.
- Los movimientos históricos de licitación no se trasladan ni reclasifican al centro de ejecución.
- Cuando todos los centros activos quedan `FINALIZADO`, el proyecto base queda `FINALIZADO`.

## Roles, permisos y accesos

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

El rol `LECTURA` se conserva únicamente como referencia histórica y no participa activamente en el flujo del MVP, salvo decisión posterior.

### Regla de autorización

Cada usuario tiene un único rol activo. Los permisos se derivan del rol mediante `roles_permisos`, y las líneas permitidas por rol se parametrizan mediante `roles_lineas_negocio`.

Los accesos operativos se asignan por:

```text
proyecto_base + linea_negocio
```

La línea `OBRA` habilita operación sobre `PRO-OBRA` y `OBRA`. La línea `INTERVENTORIA` habilita operación sobre `PRO-INT` e `INT`.

El `ADMINISTRADOR` actúa como superadministrador y puede acceder
transversalmente a los módulos. Operativamente, el `DIRECTOR` es quien crea
y administra solicitudes de nómina individual y agrupada dentro de sus
proyectos y líneas autorizadas.

## Solicitudes de pago

### Tipos de solicitud

```text
PAGO_PROVEEDOR
PAGO_NOMINA
REEMBOLSO
PAGO_IMPUESTO
```

La nómina puede usar estas modalidades:

```text
INDIVIDUAL
AGRUPADA_EXCEL
```

### Estados del flujo

```text
BORRADOR
PENDIENTE_APROBADOR_1
PENDIENTE_APROBADOR_2
DEVUELTA_APROBADOR_1
DEVUELTA_SOLICITANTE
PROGRAMADA_PAGO
PAGADA
ANULADA
```

El estado `APROBADA` no se usa como estado operativo. La aprobación de segundo nivel deja la solicitud directamente en `PROGRAMADA_PAGO`.

### Flujo principal

```text
Crear solicitud en BORRADOR
↓
Completar y revisar información
↓
Adjuntar soportes requeridos
↓
Enviar
↓
PENDIENTE_APROBADOR_1
↓
Aprobar nivel 1
↓
PENDIENTE_APROBADOR_2
↓
Aprobar nivel 2
↓
PROGRAMADA_PAGO
↓
Pagos registra la ejecución
↓
PAGADA
```

Las devoluciones permiten regresar la solicitud al actor que debe corregirla, sin perder el historial de estados ni la trazabilidad.

### Edición de solicitudes en borrador

Una solicitud en estado `BORRADOR` debe ser editable antes de enviarse.

Reglas objetivo:

- El creador puede modificar la información funcional de sus propias solicitudes mientras permanezcan en `BORRADOR`.
- El `ADMINISTRADOR` puede intervenir como superadministrador cuando corresponda.
- La edición debe respetar los permisos y accesos vigentes.
- Deben revalidarse beneficiario, proyecto, centro de costo, categorías, conceptos, medio de pago, valores y reglas específicas del tipo de solicitud.
- Una vez enviada, el solicitante deja de poder editarla libremente.
- Durante la revisión de primer nivel, `APROBADOR_1` puede modificar únicamente los campos funcionales autorizados, nunca `creado_por`.
- Toda edición sensible debe quedar auditada.

**Estado de implementación:** la edición de solicitudes en `BORRADOR` todavía no está disponible desde el frontend. Debe quedar registrada en el backlog y completarse antes del cierre definitivo de la Épica 6.

### Envío de solicitudes

El envío inicia formalmente el flujo de aprobación.

Reglas principales:

- Solo se puede enviar una solicitud en estado `BORRADOR`.
- Deben cumplirse las validaciones obligatorias del tipo de solicitud.
- El usuario autorizado debe ser el creador de la solicitud o el `ADMINISTRADOR`.
- El cambio de estado es `BORRADOR` → `PENDIENTE_APROBADOR_1`.
- Se registra `enviado_en`.
- Después del envío, la acción deja de estar disponible mientras la solicitud permanezca fuera de `BORRADOR`.

### Visibilidad de solicitudes

La visibilidad dentro del módulo Solicitudes depende del rol, la propiedad de la solicitud y el estado del flujo:

- El creador conserva acceso a sus propias solicitudes.
- `APROBADOR_1` recibe las solicitudes en `PENDIENTE_APROBADOR_1` y `DEVUELTA_APROBADOR_1`, además de las propias.
- `APROBADOR_2` recibe las solicitudes en `PENDIENTE_APROBADOR_2`, además de las propias cuando corresponda.
- `PAGOS` recibe las solicitudes en `PROGRAMADA_PAGO`, además de las propias cuando corresponda.
- `ADMINISTRADOR` puede consultar todas las solicitudes.
- Ningún usuario distinto del creador o del `ADMINISTRADOR` debe ver borradores ajenos.
- El permiso genérico `CONSULTAR_TODO` no reemplaza las reglas específicas de visibilidad del módulo.

## Beneficiarios y proveedores

La entidad `beneficiarios_pago` representa a la persona o entidad que recibe el pago.

Tipos permitidos:

```text
PROVEEDOR
TRABAJADOR
OTRO
```

Reglas principales:

- Un beneficiario no tiene que ser usuario del sistema.
- `usuario_id` es opcional.
- Los beneficiarios tipo `PROVEEDOR` pueden asociarse a un registro en `proveedores`.
- Los beneficiarios tipo `TRABAJADOR` no pueden usar `NIT` como tipo de documento.
- Tipo y número de documento son obligatorios.
- El medio de pago preferido es obligatorio.
- Para `TRANSFERENCIA` o `CONSIGNACION` son obligatorios banco, tipo de cuenta y número de cuenta.
- Para `EFECTIVO`, los datos bancarios son opcionales.
- La deduplicación funcional se realiza por tipo y número de documento.

## Categorías, conceptos y valores

No se usa un campo genérico `item` como clasificación principal de una solicitud.

| Tipo de solicitud | Clasificación funcional |
|---|---|
| Pago a proveedor | `categoria_gasto` |
| Reembolso | `categoria_reembolso` |
| Nómina individual | `concepto_nomina` y `periodo_nomina` |
| Nómina agrupada | conceptos por cada detalle de trabajador |
| Pago de impuesto | clasificación tributaria y detalle asociado |

Cuando la categoría o el concepto sea `OTRO`, debe exigirse descripción.

El valor neto debe conservar coherencia con el desglose aplicable:

```text
valor_neto = valor_bruto + valor_impuestos - valor_retenciones - valor_descuentos
```

## Nómina

### Nómina individual

La solicitud debe registrar:

- proyecto base;
- centro de costo;
- fondo;
- beneficiario tipo `TRABAJADOR`;
- concepto de nómina;
- periodo de nómina en formato `YYYY-MM`;
- medio de pago;
- valor bruto;
- descuentos cuando apliquen;
- valor neto;
- descripción.

No se permite duplicar una solicitud no anulada para la misma combinación de proyecto, centro, trabajador, concepto y periodo.

### Nómina agrupada

La nómina agrupada se carga mediante Excel y se procesa en dos etapas:

```text
VALIDAR
↓
revisión y confirmación del usuario
↓
CREAR
```

La validación debe identificar filas inválidas, documentos repetidos, beneficiarios inexistentes, diferencias de nombre y datos bancarios incompletos.

La creación genera una cabecera consolidada y detalles por trabajador y
concepto. El archivo original queda asociado como soporte de origen. La
cabecera nace en `BORRADOR` sin consecutivo; el consecutivo se asigna al
enviarla a aprobación de nivel 1.

## Pagos

El rol `PAGOS` no programa ni aprueba solicitudes.

```text
PENDIENTE_APROBADOR_2
↓ aprobación de segundo nivel
PROGRAMADA_PAGO
↓ ejecución por Pagos
PAGADA
```

El módulo Pagos debe:

- consultar solicitudes en `PROGRAMADA_PAGO`;
- mostrar beneficiario, proyecto, centro de costo, fecha de aprobación, medio de pago y valores;
- filtrar por proyecto, centro de costo y medio de pago;
- registrar transferencias directas individualmente o por lote;
- registrar retiros agrupados para solicitudes en `EFECTIVO` o `CONSIGNACION`;
- exigir referencia para cada transferencia y consignación;
- exigir soporte individual por pago y soporte general para cada retiro;
- marcar la solicitud como `PAGADA`;
- generar el movimiento financiero correspondiente;
- impedir doble pago.

Las transferencias directas generan un `EGRESO_SOLICITUD_PAGO` por
solicitud. Los pagos en efectivo y las consignaciones financiadas mediante
retiro generan un único `EGRESO_RETIRO_EFECTIVO` por operación; las
solicitudes asociadas no descuentan nuevamente el fondo.

## Impuestos, retenciones y cargos financieros

Los impuestos y retenciones no son cargos financieros.

| Concepto | Naturaleza |
|---|---|
| Impuestos y retenciones | Desglose tributario de una solicitud o registro contable |
| Cargos financieros | Costos bancarios u operativos del movimiento de dinero |

Ejemplos de impuestos y retenciones:

```text
IVA
RETEFUENTE
RETEICA
RETEIVA
ESTAMPILLA
ICA
IMPUESTO_CONSUMO
```

Ejemplos de cargos financieros:

```text
GMF
CUATRO_POR_MIL
COMISION_BANCARIA
COSTO_RETIRO
COSTO_TRANSFERENCIA
COSTO_CONSIGNACION
```

`PAGO_IMPUESTO` se conserva como solicitud independiente cuando una obligación tributaria debe recorrer el flujo normal de aprobación.

## Fondo y movimientos financieros

Toda operación que afecte el saldo debe registrarse en `movimientos_fondo`.

El fondo general conserva el saldo actual del proyecto. Los movimientos deben guardar, como mínimo:

- fondo;
- proyecto base;
- centro de costo cuando aplique;
- tipo de movimiento;
- dirección `INGRESO` o `EGRESO`;
- valor;
- saldo anterior;
- saldo nuevo;
- entidad origen;
- usuario y fecha.

Toda actualización de saldo debe ser transaccional. El sistema debe impedir saldos negativos y movimientos duplicados.

## Préstamos, anticipos y devoluciones

El sistema admite:

```text
PERSONA_A_PROYECTO
PROYECTO_A_PROYECTO
```

Un préstamo de proyecto a proyecto genera un egreso en el fondo origen y un ingreso por el mismo valor en el fondo destino. El proyecto origen debe tener saldo suficiente y debe ser distinto del proyecto destino.

Las devoluciones disminuyen el saldo pendiente y generan los movimientos inversos correspondientes.

## Operaciones de efectivo agrupadas

Un retiro puede cubrir una o varias solicitudes con medio de pago
`EFECTIVO` o `CONSIGNACION`, siempre que pertenezcan al mismo proyecto base
y fondo.

```text
Retiro agrupado
├── Solicitud 1 + valor asignado
├── Solicitud 2 + valor asignado
└── Solicitud N + valor asignado
```

Valores de control:

```text
valor_requerido = suma de valores asignados
valor_sobrante = valor_retirado - valor_pagado
```

Reglas principales:

- el retiro descuenta del fondo el valor retirado una única vez;
- cada solicitud conserva su proyecto, centro de costo, beneficiario y valor;
- cada pago requiere soporte individual;
- las consignaciones requieren referencia propia;
- el valor retirado debe cubrir el valor requerido;
- el sistema calcula el sobrante y puede reintegrarlo mediante un movimiento
  `INGRESO_REINTEGRO_EFECTIVO`;
- toda la operación es transaccional.

- Cada solicitud conserva su proyecto base, centro de costo, fondo y valor asignado.
- La operación de retiro es independiente de las solicitudes que agrupa.
- El sobrante se calcula a nivel del retiro.
- El reingreso se asocia al retiro, no a una solicitud individual.
- Puede haber varios reingresos parciales.
- La suma reingresada no puede superar el sobrante.
- El retiro, los pagos, el reingreso y los préstamos previos son hechos separados y auditables.
- No debe generarse doble descuento entre el retiro y las solicitudes asociadas.

## Referencias documentales

Las solicitudes usan referencias legibles por contexto:

```text
SOL-{TIPO_SOLICITUD}-{REFERENCIA_CENTRO}-{REFERENCIA_PROYECTO}-{AÑO}-{CONSECUTIVO}
```

Códigos de tipo:

```text
PRV = pago a proveedor
NOM = nómina
IMP = pago de impuesto
REE = reembolso
```

Ejemplos:

```text
SOL-PRV-OBRA-HUMAPO-2026-000001
SOL-NOM-OBRA-HUMAPO-2026-000001
SOL-REE-PRO-INT-HUMAPO-2026-000001
SOL-IMP-INT-HUMAPO-2026-000001
```

El consecutivo se controla de forma atómica e independiente por tipo de secuencia, proyecto base, centro de costo y año.

## Estado actual del desarrollo

### Implementado y validado

A la fecha de esta actualización se encuentran implementados y validados funcional o técnicamente:

- Configuración base con Next.js, TypeScript, Prisma y PostgreSQL.
- Autenticación, cierre de sesión y consulta de sesión privada.
- Usuarios con rol único.
- Roles y permisos parametrizados.
- Accesos por proyecto base y línea de negocio.
- Proyectos base.
- Fondo general por proyecto base.
- Centros `PRO-OBRA`, `OBRA`, `PRO-INT` e `INT`.
- Transiciones de centros de licitación a ejecución.
- Creación, listado, consulta, edición y activación/inactivación de beneficiarios.
- Creación transaccional de proveedores asociados a beneficiarios tipo `PROVEEDOR`.
- Secuencias documentales para solicitudes.
- Creación de solicitudes de pago a proveedor.
- Creación de solicitudes de nómina individual.
- Validación y creación de nómina agrupada mediante Excel.
- Creación de solicitudes de reembolso.
- Listado de solicitudes con visibilidad por rol y estado.
- Consulta de detalle de solicitudes.
- Envío de solicitudes desde `BORRADOR` a `PENDIENTE_APROBADOR_1`.
- Acción de envío disponible desde frontend con confirmación, estado de carga y actualización del listado.
- Gestión documental completa mediante adjuntos y soportes asociados a solicitudes.
- Carga, consulta, descarga y eliminación lógica de archivos conforme a las reglas del módulo documental.
- Restricciones de base de datos para estados y valores críticos ya migrados.

### Pendiente para cerrar definitivamente el MVP de Solicitudes

- Edición de solicitudes en estado `BORRADOR` desde frontend.
- Verificación y, si es necesario, ampliación del backend de edición para cubrir todos los tipos de solicitud.
- Anulación de solicitudes según las reglas definitivas del flujo.
- Solicitud independiente de pago de impuestos.
- Revisión final de validaciones cruzadas entre tipos de solicitud.

### Próxima etapa principal

Con el cierre de la **Épica 7 – Gestión documental y adjuntos**, la siguiente etapa principal del desarrollo corresponde a la **Épica 8 – Aprobaciones**.

Posteriormente continuarán las épicas de Pagos y del módulo Financiero.

La edición de solicitudes en estado `BORRADOR` permanece como deuda funcional identificada en el backlog y fue reprogramada para una etapa posterior del proyecto.

## Fuera del MVP

- OCR avanzado y automatización decisoria.
- Integraciones ERP.
- Conciliación bancaria automática.
- Firma digital.
- Aplicación móvil nativa.
- Contabilidad completa.
- Cálculo tributario automático avanzado.
- Intereses complejos de préstamos.

## Criterio de preservación documental

La documentación debe representar decisiones vigentes integradas, no una acumulación de correcciones aisladas.

Toda decisión funcional o técnica relevante debe reflejarse, según corresponda, en:

- visión del producto;
- proceso de negocio;
- roles y permisos;
- máquinas de estado;
- arquitectura;
- modelo de datos;
- contrato de API;
- seguridad;
- despliegue;
- backlog;
- flujos por usuario y rol.

Cuando exista una diferencia entre el comportamiento objetivo y el estado actual del código, debe registrarse explícitamente como funcionalidad pendiente, sin eliminarla del diseño objetivo ni presentarla como ya implementada.
