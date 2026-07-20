# 04. Máquinas de estado

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

## Centro de costo

### Estados

```text
EN_PROPUESTA
NO_ADJUDICADO
ADJUDICADO
EN_EJECUCION
FINALIZADO
CERRADO
```

### Flujo estándar

```mermaid
stateDiagram-v2
    [*] --> EN_PROPUESTA
    EN_PROPUESTA --> ADJUDICADO: Marcar como adjudicado
    EN_PROPUESTA --> NO_ADJUDICADO: Marcar como no adjudicado
    ADJUDICADO --> EN_EJECUCION: Iniciar ejecución
    EN_EJECUCION --> FINALIZADO: Finalizar
    FINALIZADO --> CERRADO: Cerrar
    NO_ADJUDICADO --> CERRADO: Cerrar
```

### Flujo de carga inicial

```mermaid
stateDiagram-v2
    [*] --> ADJUDICADO: Obra ya adjudicada
    ADJUDICADO --> EN_EJECUCION: Iniciar ejecución
```

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
