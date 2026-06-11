# 02. Proceso de negocio

## Flujo general de solicitud de pago

```text
Crear solicitud
↓
Adjuntar soportes
↓
Enviar
↓
Aprobador 1 revisa
↓
Aprobador 2 revisa
↓
Sistema deja la solicitud PROGRAMADA_PAGO
↓
Pagos marca como PAGADA
↓
Sistema registra movimiento financiero
```

## Estados de solicitud

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

El estado `APROBADA` no se usa como estado operativo del flujo principal. La aprobación de segundo nivel cambia directamente a `PROGRAMADA_PAGO`.

## Tipos de solicitud

```text
PAGO_PROVEEDOR
PAGO_NOMINA
REEMBOLSO
OTRO_PAGO
```

## Centro de costo y variantes

El centro de costo tiene saldo único. Las variantes clasifican el gasto:

```text
Centro de costo
├── PROYECTO
├── OBRA
└── INTERVENTORIA
```

### Fase de proyecto

El Administrador crea el centro de costo en `EN_PROPUESTA`. El sistema habilita la variante `PROYECTO`.

En esta fase pueden existir gastos de:

- Papelería.
- Transporte.
- Cenas o reuniones comerciales.
- Estudios.
- Diseños preliminares.
- Asesorías.
- Trámites.

### Adjudicación

Si el proyecto se gana, el Administrador marca el centro de costo como `ADJUDICADO`.

Al marcar como adjudicado:

- Se registra fecha de adjudicación.
- Se registra soporte si aplica.
- Se registra observación.
- Se habilita `OBRA`.
- Se puede habilitar `INTERVENTORIA`.

Los movimientos anteriores no se reclasifican. Permanecen como `PROYECTO`.

### Obra ya adjudicada

Para carga inicial, el Administrador puede crear un centro de costo directamente en `ADJUDICADO` con variante `OBRA`, sin marcarlo todavía como `EN_EJECUCION`.

## Pagos

El rol `PAGOS` opera solicitudes en `PROGRAMADA_PAGO`.

```text
PROGRAMADA_PAGO
↓
Pagos revisa información
↓
Pagos registra soporte o referencia
↓
Pagos marca como PAGADA
↓
Sistema registra egreso
```

Pagos no devuelve, no aprueba y no programa.

## Medios de pago

```text
TRANSFERENCIA
EFECTIVO
```

- Si es `TRANSFERENCIA`, los datos bancarios son obligatorios.
- Si es `EFECTIVO`, los datos bancarios pueden no existir.

## Operaciones de efectivo

Cuando el valor retirado sea mayor al valor pagado:

```text
Valor requerido
Valor retirado
Valor pagado
Valor sobrante
Valor reingresado
```

Estados del sobrante:

```text
SIN_SOBRANTE
SOBRANTE_PENDIENTE_REINGRESO
SOBRANTE_REINGRESADO
SOBRANTE_AJUSTADO
```

El reingreso del sobrante no pasa por aprobación. Se controla por permisos, soporte y auditoría.

## Impuestos y retenciones

Los impuestos y retenciones se registran como desglose de la solicitud o como registro tributario asociado.

Tipos:

```text
IVA
RETEFUENTE
RETEICA
RETEIVA
ESTAMPILLA
ICA
IMPUESTO_CONSUMO
OTRO_IMPUESTO
```

Naturaleza:

```text
IMPUESTO
RETENCION
DESCUENTO
```

Regla conceptual:

```text
valor_neto = valor_bruto + valor_impuestos - valor_retenciones - valor_descuentos
```

Los impuestos y retenciones no crean una solicitud independiente de aprobación.

## Cargos financieros

Los cargos financieros se gestionan dentro del módulo financiero.

Tipos:

```text
GMF
CUATRO_POR_MIL
COMISION_BANCARIA
COSTO_RETIRO
DIFERENCIA_RETIRO_EFECTIVO
OTRO_CARGO_FINANCIERO
```

Un cargo financiero genera un movimiento de egreso:

```text
EGRESO_CARGO_FINANCIERO
```

## Movimientos financieros

La tabla funcional de referencia es:

```text
movimientos_fondo_centro_costo
```

Todo ingreso o egreso que afecte saldo debe registrarse allí.

Ejemplos:

| Caso | Tipo de movimiento | Dirección |
|---|---|---|
| Anticipo recibido | `INGRESO_ANTICIPO` | `INGRESO` |
| Pago de solicitud | `EGRESO_SOLICITUD_PAGO` | `EGRESO` |
| Reingreso de sobrante | `INGRESO_REINGRESO_SOBRANTE_EFECTIVO` | `INGRESO` |
| Cargo financiero | `EGRESO_CARGO_FINANCIERO` | `EGRESO` |
| Pago de impuesto si aplica | `EGRESO_IMPUESTO_RETENCION` | `EGRESO` |

## Nómina agrupada

La carga de Excel debe validar:

- Tipo documento.
- Número documento.
- Nombre trabajador.
- Concepto de nómina.
- Valor bruto.
- Valor neto.
- Medio de pago.
- Datos bancarios si aplica.

Un mismo documento puede repetirse si corresponde a conceptos distintos.
