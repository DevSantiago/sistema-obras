# 12. Flujos por usuario y rol

## Administrador

### Crear proyecto nuevo

```text
Crear centro de costo
↓
Estado EN_PROPUESTA
↓
Sistema habilita PROYECTO
↓
Sistema crea fondo
```

### Marcar como adjudicado

```text
Centro de costo EN_PROPUESTA
↓
Administrador marca ADJUDICADO
↓
Sistema habilita OBRA
↓
Administrador habilita INTERVENTORIA si aplica
```

### Crear obra ya adjudicada

```text
Crear centro de costo
↓
Tipo OBRA_YA_ADJUDICADA
↓
Estado ADJUDICADO
↓
Sistema habilita OBRA
↓
INTERVENTORIA opcional
```

## Solicitante

```text
Crear solicitud
↓
Seleccionar centro de costo y variante
↓
Seleccionar tipo de solicitud
↓
Registrar categoría o concepto
↓
Registrar valores
↓
Adjuntar soportes
↓
Enviar
```

## Aprobador 1

```text
Ver solicitudes PENDIENTE_APROBADOR_1
↓
Revisar soporte, valores, impuestos y categoría
↓
Aprobar o devolver
```

## Aprobador 2

```text
Ver resumen agrupado
↓
Entrar al detalle
↓
Aprobar o devolver
↓
Si aprueba, solicitud queda PROGRAMADA_PAGO
```

## Pagos

```text
Ver solicitudes PROGRAMADA_PAGO
↓
Revisar medio de pago
↓
Registrar pago
↓
Marcar como PAGADA
↓
Sistema genera movimiento financiero
```

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
Selecciona centro de costo
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

## Lectura

```text
Ingresar
↓
Consultar módulos autorizados
↓
Exportar si tiene permiso
```

## Flujo de consulta financiera

```text
Usuario autorizado ingresa al módulo Financiero
↓
Selecciona centro de costo
↓
Consulta saldo consolidado
↓
Consulta movimientos_fondo_centro_costo
↓
Filtra por variante, tipo de movimiento, fecha o entidad origen
↓
Exporta si tiene permiso
```
