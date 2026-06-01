# 12. Flujos por usuario y rol

## Flujo del Solicitante

```text
Login
    ↓
Mis solicitudes
    ↓
Crear solicitud
    ↓
Seleccionar obra
    ↓
Completar datos
    ↓
Adjuntar soporte
    ↓
Enviar
    ↓
Consultar estado
```

## Flujo del Auxiliar contable: solicitud de pago

```text
Login
    ↓
Crear solicitud
    ↓
Seleccionar obra
    ↓
Completar datos
    ↓
Adjuntar soporte
    ↓
Enviar
    ↓
Consultar estado
```

## Flujo del Auxiliar contable: fondos de obra

```text
Login
    ↓
Fondos de obra
    ↓
Seleccionar obra
    ↓
Registrar ingreso o egreso financiero
    ↓
Guardar movimiento
    ↓
Consultar saldo actualizado
```

## Registrar préstamo de persona

```text
Seleccionar obra
    ↓
Registrar prestamista
    ↓
Registrar valor
    ↓
Guardar
    ↓
Sistema aumenta saldo de obra
    ↓
Sistema crea préstamo pendiente
```

## Registrar anticipo

```text
Seleccionar obra
    ↓
Registrar valor de anticipo
    ↓
Guardar
    ↓
Sistema aumenta saldo de obra
```

## Registrar préstamo entre obras

```text
Seleccionar obra que presta
    ↓
Seleccionar obra que recibe
    ↓
Registrar valor
    ↓
Sistema disminuye saldo de obra que presta
    ↓
Sistema aumenta saldo de obra que recibe
    ↓
Sistema crea préstamo pendiente
```

## Registrar devolución de préstamo

```text
Seleccionar préstamo pendiente
    ↓
Registrar valor devuelto
    ↓
Sistema disminuye saldo de obra deudora
    ↓
Si aplica, aumenta saldo de obra prestamista
    ↓
Sistema actualiza estado del préstamo
```

## Flujo de Pagos

```text
Login
    ↓
Solicitudes aprobadas
    ↓
Programar pago
    ↓
Marcar como pagada
    ↓
Sistema registra egreso de fondos
```
