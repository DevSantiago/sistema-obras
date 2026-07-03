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

## Proyecto base, centros de costo y fondo general

El flujo vigente usa `proyectos_base` como agrupador del negocio y `centros_costo` como clasificación operativa del gasto.

```text
Proyecto base
├── Fondo general
├── PRO-OBRA
├── OBRA
├── PRO-INT
└── INT
```

El fondo general pertenece al proyecto base. Los centros de costo no tienen saldo independiente.

### Creación de proyecto base

Al crear un proyecto base, el usuario autorizado selecciona las líneas iniciales:

```text
OBRA
INTERVENTORIA
OBRA + INTERVENTORIA
```

Reglas:

- Si selecciona `OBRA`, el sistema crea `PRO-OBRA`.
- Si selecciona `INTERVENTORIA`, el sistema crea `PRO-INT`.
- Los centros iniciales quedan en `EN_LICITACION`.
- El proyecto base queda en `EN_LICITACION`.
- Se crea un fondo general del proyecto base.
- La creación es transaccional.

### Paso de licitación a ejecución

Cuando se gana o inicia la fase operativa de una línea:

```text
PRO-OBRA EN_LICITACION
↓
PRO-OBRA FINALIZADO
↓
OBRA EN_EJECUCION
```

```text
PRO-INT EN_LICITACION
↓
PRO-INT FINALIZADO
↓
INT EN_EJECUCION
```

Los movimientos históricos de la fase de licitación no se reclasifican.

### Finalización

```text
OBRA EN_EJECUCION → OBRA FINALIZADO
INT EN_EJECUCION → INT FINALIZADO
```

Cuando todos los centros activos de un proyecto base quedan `FINALIZADO`, el proyecto base queda `FINALIZADO`.

## Accesos operativos

Los accesos se asignan por:

```text
proyecto_base + linea_negocio
```

La línea `OBRA` permite operar en centros `PRO-OBRA` y `OBRA` del proyecto asignado.

La línea `INTERVENTORIA` permite operar en centros `PRO-INT` e `INT` del proyecto asignado.

## Beneficiarios

Antes de crear solicitudes de pago, el sistema debe contar con beneficiarios registrados.

Tipos:

```text
PROVEEDOR
TRABAJADOR
OTRO
```

Reglas:

- El beneficiario es quien recibe el pago.
- El usuario es quien opera el sistema.
- Un beneficiario puede o no estar asociado a un usuario.
- Un beneficiario tipo `PROVEEDOR` puede estar asociado a un registro en `proveedores`.
- Los datos bancarios son obligatorios para que el módulo Pagos tenga la información necesaria.
- La deduplicación se realiza por tipo y número de documento.

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

Para el registro de beneficiarios del MVP, los datos bancarios son obligatorios, porque el módulo Pagos debe tener la información necesaria para ejecutar o validar pagos. En flujos posteriores se podrá definir una regla excepcional para efectivo, si el negocio lo requiere.

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
movimientos_fondo
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
- Banco.
- Tipo de cuenta bancaria.
- Número de cuenta bancaria.

Si el trabajador no existe como beneficiario, el sistema debe permitir crearlo como beneficiario tipo `TRABAJADOR` previa confirmación.
