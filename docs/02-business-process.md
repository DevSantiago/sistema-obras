# 02. Proceso de negocio

> Última actualización funcional: 14 de julio de 2026.

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

El `APROBADOR_1` puede editar los valores y demás datos funcionales de la solicitud durante su revisión, excepto `creado_por`. Toda edición debe registrar quién realizó el cambio, cuándo lo realizó y los valores anteriores y nuevos. También puede devolver la solicitud al creador.

## Tipos de solicitud

```text
PAGO_PROVEEDOR
PAGO_NOMINA
REEMBOLSO
PAGO_IMPUESTO
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

### Visibilidad de solicitudes

- El creador ve sus propias solicitudes en todos sus estados.
- `APROBADOR_1` ve las solicitudes propias y las que estén en `PENDIENTE_APROBADOR_1` o `DEVUELTA_APROBADOR_1`. No ve borradores de otros usuarios.
- `APROBADOR_2` ve las solicitudes propias y las que estén en `PENDIENTE_APROBADOR_2`.
- `PAGOS` ve las solicitudes propias y las que estén en `PROGRAMADA_PAGO`.
- `ADMINISTRADOR` ve todas las solicitudes como superadministrador.
- El acceso a proyecto y línea habilita operación, pero no otorga visibilidad sobre solicitudes creadas por otros usuarios.

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
- Los datos bancarios son obligatorios únicamente cuando el medio de pago preferido sea `TRANSFERENCIA` o `CONSIGNACION`. Para `EFECTIVO` pueden omitirse.
- La deduplicación se realiza por tipo y número de documento.
- Un beneficiario tipo `TRABAJADOR` no puede usar `NIT` como tipo de documento.

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
CONSIGNACION
EFECTIVO
```

Para el registro de beneficiarios del MVP, el medio de pago preferido es obligatorio. El banco, el tipo de cuenta y el número de cuenta son obligatorios únicamente para `TRANSFERENCIA` o `CONSIGNACION`; para `EFECTIVO` deben permanecer opcionales.

## Operaciones de efectivo

Un retiro de efectivo puede agrupar una o varias solicitudes de pago. La operación se registra como una cabecera de retiro y un detalle por cada solicitud incluida.

```text
Retiro agrupado
├── Solicitud 1 + valor asignado
├── Solicitud 2 + valor asignado
└── Solicitud N + valor asignado
```

Valores de control del retiro:

```text
Valor requerido = suma de los valores asignados a las solicitudes
Valor retirado
Valor pagado
Valor sobrante = valor retirado - valor pagado
Valor reingresado acumulado
```

El reingreso del sobrante se asocia al retiro agrupado, no a una solicitud individual. Cada solicitud conserva su proyecto base, centro de costo, fondo y valor dentro del detalle del retiro.

Estados del sobrante:

```text
SIN_SOBRANTE
SOBRANTE_PENDIENTE_REINGRESO
SOBRANTE_REINGRESADO
SOBRANTE_AJUSTADO
```

El reingreso del sobrante no pasa por aprobación. Se controla por permisos, soporte y auditoría. Puede registrarse en uno o varios reingresos hasta completar el sobrante pendiente.

Antes de incluir una solicitud en un retiro, su proyecto debe contar con saldo suficiente. Si existe déficit, debe registrarse previamente un préstamo `PROYECTO_A_PROYECTO`. También se permiten préstamos `PERSONA_A_PROYECTO`.

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

Los impuestos y retenciones pueden registrarse como desglose de otra solicitud. Además, cuando exista una obligación tributaria independiente, se usa una solicitud tipo `PAGO_IMPUESTO`, la cual recorre el flujo normal de aprobación y genera el egreso correspondiente al momento del pago.

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

## Nómina individual y agrupada

La creación de nómina individual y agrupada corresponde exclusivamente al `ADMINISTRADOR`. El `DIRECTOR` no crea solicitudes de nómina.

La nómina individual debe registrar:

- Proyecto base.
- Centro de costo.
- Beneficiario tipo `TRABAJADOR`.
- Concepto de nómina.
- `periodo_nomina`, diligenciado como el mes al que corresponde el pago, en formato `YYYY-MM`. El selector solo presenta los meses transcurridos del año vigente hasta el mes actual; por ejemplo, si la fecha actual corresponde a junio de 2026, el valor máximo permitido es `2026-06`.
- Medio de pago: `TRANSFERENCIA`, `CONSIGNACION` o `EFECTIVO`.
- Valor.
- Concepto de pago.

No se puede crear una solicitud de nómina individual duplicada para la misma combinación de proyecto base, centro de costo, trabajador, concepto de nómina y periodo de nómina, salvo que la solicitud anterior esté `ANULADA`. El periodo identifica el mes laboral pagado y es independiente de `creado_en` y `pagado_en`.

Para nómina agrupada, la carga de Excel debe validar:

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
