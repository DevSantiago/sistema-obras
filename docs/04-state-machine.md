# 04. Máquinas de estado

> Última actualización funcional: 14 de julio de 2026.

## Solicitudes de pago

### Estados

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

### Flujo principal

```mermaid
stateDiagram-v2
    [*] --> BORRADOR
    BORRADOR --> PENDIENTE_APROBADOR_1: Enviar
    PENDIENTE_APROBADOR_1 --> PENDIENTE_APROBADOR_2: Aprobar nivel 1
    PENDIENTE_APROBADOR_2 --> PROGRAMADA_PAGO: Aprobar nivel 2
    PROGRAMADA_PAGO --> PAGADA: Marcar como pagada
    PAGADA --> [*]
```

### Edición durante aprobación de nivel 1

Mientras una solicitud esté en `PENDIENTE_APROBADOR_1` o `DEVUELTA_APROBADOR_1`, el `APROBADOR_1` puede editar sus valores y demás datos funcionales, excepto `creado_por`. La edición no cambia por sí sola el estado y debe registrar auditoría de campos modificados, usuario editor y fecha.

### Flujos alternos

```mermaid
stateDiagram-v2
    PENDIENTE_APROBADOR_1 --> DEVUELTA_SOLICITANTE: Devolver
    DEVUELTA_SOLICITANTE --> BORRADOR: Corregir
    PENDIENTE_APROBADOR_2 --> DEVUELTA_APROBADOR_1: Devolver
    DEVUELTA_APROBADOR_1 --> PENDIENTE_APROBADOR_2: Reenviar
    DEVUELTA_APROBADOR_1 --> DEVUELTA_SOLICITANTE: Devolver al solicitante
    BORRADOR --> ANULADA: Anular
    PENDIENTE_APROBADOR_1 --> ANULADA: Anular
    PENDIENTE_APROBADOR_2 --> ANULADA: Anular
```

## Proyecto base

### Estados

```text
EN_LICITACION
EN_EJECUCION
FINALIZADO
```

### Flujo estándar

```mermaid
stateDiagram-v2
    [*] --> EN_LICITACION
    EN_LICITACION --> EN_EJECUCION: Algún centro pasa a ejecución
    EN_EJECUCION --> FINALIZADO: Todos los centros activos finalizados
```

Reglas:

- El proyecto base inicia en `EN_LICITACION`.
- Si cualquier centro activo está en `EN_EJECUCION`, el proyecto queda en `EN_EJECUCION`.
- Si todos los centros activos están en `FINALIZADO`, el proyecto queda en `FINALIZADO`.

## Centros de costo

### Estados

```text
EN_LICITACION
EN_EJECUCION
FINALIZADO
```

### Flujo de licitación a ejecución

```mermaid
stateDiagram-v2
    [*] --> EN_LICITACION
    EN_LICITACION --> FINALIZADO: Cerrar fase de licitación
    EN_EJECUCION --> FINALIZADO: Finalizar ejecución
```

El paso de licitación a ejecución no convierte el mismo registro a `EN_EJECUCION`. El sistema finaliza el centro de licitación y crea un nuevo centro de ejecución.

```text
PRO-OBRA EN_LICITACION → PRO-OBRA FINALIZADO + OBRA EN_EJECUCION
PRO-INT  EN_LICITACION → PRO-INT  FINALIZADO + INT  EN_EJECUCION
```

### Flujo de ejecución

```mermaid
stateDiagram-v2
    [*] --> EN_EJECUCION
    EN_EJECUCION --> FINALIZADO: Finalizar
    FINALIZADO --> [*]
```

## Beneficiarios

Los beneficiarios no tienen una máquina de estados compleja en el MVP. Usan estado lógico mediante campo `activo`.

```text
ACTIVO
INACTIVO
```

Reglas:

- Solo beneficiarios activos se usan para nuevas solicitudes.
- La inactivación no elimina historial de solicitudes ni movimientos.
- La deduplicación de creación se valida sobre beneficiarios activos por tipo y número de documento.

## Nómina

Las solicitudes de nómina individual usan `modalidad_nomina = INDIVIDUAL` y requieren `periodo_nomina` como mes al que corresponde el pago, en formato `YYYY-MM`. Solo se permiten meses del año vigente hasta el mes actual. La combinación proyecto base, centro de costo, trabajador, concepto de nómina y periodo no puede repetirse mientras exista una solicitud distinta de `ANULADA`.

## Operaciones de efectivo

```text
REGISTRADA
PAGO_REALIZADO
SOBRANTE_PENDIENTE_REINGRESO
SOBRANTE_REINGRESADO
SOBRANTE_AJUSTADO
ANULADA
```

```mermaid
stateDiagram-v2
    [*] --> REGISTRADA
    REGISTRADA --> PAGO_REALIZADO: Confirmar pago
    PAGO_REALIZADO --> SOBRANTE_PENDIENTE_REINGRESO: Existe sobrante
    SOBRANTE_PENDIENTE_REINGRESO --> SOBRANTE_REINGRESADO: Registrar reingreso
    SOBRANTE_PENDIENTE_REINGRESO --> SOBRANTE_AJUSTADO: Ajuste autorizado
    SOBRANTE_REINGRESADO --> [*]
    SOBRANTE_AJUSTADO --> [*]
    REGISTRADA --> ANULADA: Anular
```

## Impuestos y retenciones

Estados de registro:

```text
REGISTRADO
AJUSTADO
ANULADO
```

No usan doble aprobación independiente.

## Reglas transversales

- La aprobación de segundo nivel deja la solicitud en `PROGRAMADA_PAGO`.
- Pagos solo marca como `PAGADA`.
- Reingresos de sobrantes no pasan por aprobación.
- Impuestos y retenciones no crean workflow independiente.
- Cambios posteriores a aprobación requieren auditoría.
- Cambios de proyecto, centro, solicitud o pago deben validar permisos en backend.
- La base de datos debe reforzar estados críticos mediante restricciones `CHECK`.

## Movimientos financieros

Los movimientos financieros no usan la máquina de estados de solicitudes. Se registran como hechos contables/operativos controlados por permisos.

Estados sugeridos de registro financiero:

```text
REGISTRADO
ANULADO
AJUSTADO
```

Aplica para:

- Reingreso de sobrantes.
- Cargos financieros.
- Pagos tributarios independientes.
- Ajustes autorizados.

## Estado de retiro agrupado

```mermaid
stateDiagram-v2
    [*] --> PENDIENTE_RETIRO
    PENDIENTE_RETIRO --> RETIRADO: Registrar retiro
    RETIRADO --> PAGADO: Registrar pagos de solicitudes asociadas
    PAGADO --> CERRADO: Sin sobrante
    PAGADO --> SOBRANTE_PENDIENTE_REINGRESO: Existe sobrante
    SOBRANTE_PENDIENTE_REINGRESO --> SOBRANTE_REINGRESADO: Reingreso total
    SOBRANTE_PENDIENTE_REINGRESO --> SOBRANTE_AJUSTADO: Ajuste autorizado
    SOBRANTE_REINGRESADO --> CERRADO
    SOBRANTE_AJUSTADO --> CERRADO
```

El estado corresponde al retiro agrupado. Las solicitudes relacionadas mantienen su propio estado de pago.
