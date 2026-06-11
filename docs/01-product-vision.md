# 01. Visión del producto

## Objetivo

Construir una aplicación web responsiva para gestionar solicitudes de pago, beneficiarios, aprobaciones, pagos, fondos por centro de costo, préstamos, anticipos, reembolsos, nómina, impuestos, cargos financieros, operaciones de efectivo, adjuntos, auditoría y exportación de información.

El sistema reemplaza el proceso manual de recepción de soportes, revisión, transcripción y control financiero en hojas de cálculo.

## Problema

Actualmente las solicitudes de pago y sus soportes pueden manejarse manualmente, lo que genera:

- Dificultad para saber el estado real de cada solicitud.
- Riesgo de pérdida de soportes.
- Falta de trazabilidad de aprobaciones.
- Dificultad para controlar saldos.
- Dificultad para distinguir pagos, reembolsos, nómina, préstamos, impuestos, cargos financieros y reingresos.
- Riesgo de inconsistencias entre valor bruto, impuestos, retenciones, valor neto y egresos reales.
- Falta de control cuando se retira efectivo por valores superiores al pago por restricciones de cajero.

## Alcance funcional

El MVP debe incluir:

- Autenticación.
- Usuarios, roles y permisos.
- Centros de costo y variantes.
- Beneficiarios de pago.
- Solicitudes de pago.
- Pago a proveedor.
- Reembolsos.
- Nómina individual y agrupada por Excel.
- Adjuntos y soportes.
- Doble aprobación.
- Marcación de pago.
- Fondos por centro de costo.
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

### Centro de costo único

El saldo vive en el centro de costo, no en cada variante.

```text
Centro de costo A
├── PROYECTO
├── OBRA
└── INTERVENTORIA
```

Las variantes sirven para clasificar movimientos, solicitudes y reportes. Todos los ingresos y egresos afectan el saldo consolidado del centro de costo.

### Ciclo de vida del centro de costo

Flujo futuro estándar:

```text
EN_PROPUESTA → ADJUDICADO → EN_EJECUCION → FINALIZADO → CERRADO
```

- `EN_PROPUESTA`: fase previa, se registran gastos para intentar ganar el proyecto.
- `ADJUDICADO`: la empresa ganó el proyecto, pero la ejecución puede no haber iniciado.
- `EN_EJECUCION`: la obra opera activamente.
- `NO_ADJUDICADO`: la empresa no ganó el proyecto.
- `FINALIZADO`: la ejecución terminó.
- `CERRADO`: no se permiten nuevos movimientos.

Para carga inicial, el Administrador puede crear un centro de costo directamente como `ADJUDICADO` cuando ya exista una obra ganada antes de iniciar el sistema.

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
- Despliegue y QA.
- Backlog.
- Flujos por rol.
