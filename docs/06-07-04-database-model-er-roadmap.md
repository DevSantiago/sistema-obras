# 06. Modelo Entidad–Relación (ER) - Roadmap

> **Última actualización:** Julio de 2026

---

# Objetivo

Este documento presenta la evolución prevista del modelo de datos del Sistema de Gestión de Solicitudes de Pago.

Las entidades y relaciones aquí descritas **no forman parte del modelo físico implementado** y se incorporarán únicamente cuando sean desarrolladas e incluidas en `schema.prisma`.

---

# Estado del modelo

Actualmente el modelo implementado incluye:

- seguridad;
- organización;
- beneficiarios;
- solicitudes de pago;
- detalle de nómina;
- gestión documental.

Las funcionalidades descritas en este documento representan la evolución planificada del sistema.

---

# Funcionalidades previstas

## Historial de estados

Permitirá conservar todas las transiciones de estado de una solicitud.

Entidad prevista:

```text
historial_estados_solicitud
```

Objetivos:

- trazabilidad completa;
- auditoría;
- consultas históricas;
- reconstrucción del flujo de aprobación.

---

## Comentarios

Permitirá registrar observaciones durante el ciclo de vida de una solicitud.

Entidad prevista:

```text
comentarios_solicitud
```

Objetivos:

- comunicación entre usuarios;
- devoluciones;
- aclaraciones;
- observaciones de aprobación.

---

## Impuestos y retenciones

Permitirá almacenar el detalle de impuestos asociados a una solicitud.

Entidad prevista:

```text
impuestos_retenciones_solicitud
```

Objetivos:

- múltiples impuestos;
- múltiples retenciones;
- cálculo detallado de valores tributarios.

---

## Programación de pagos

La ejecución de pagos ya se encuentra implementada mediante `pagos`,
`operaciones_efectivo`, `detalles_operacion_efectivo` y
`movimientos_fondo`.

Permanece proyectada únicamente una programación independiente de la
aprobación:

```text
programaciones_pago
```

Objetivos:

- programación de desembolsos;
- calendario futuro de pagos.

---

## Evolución de movimientos financieros

`movimientos_fondo` ya registra ingresos y egresos con saldo anterior y
nuevo. `correcciones_operacion_efectivo` registra los ajustes y anulaciones de
retiros, enlazando su movimiento compensatorio sin alterar el historial.
Permanecen proyectados otros orígenes financieros de las épicas posteriores.

`reingresos_sobrante_efectivo` implementa los reingresos posteriores de un
retiro. Conserva operación, soporte, referencia, valor, pendiente anterior y
nuevo, fecha del sistema y usuario. Cada registro posee un único movimiento
`INGRESO_REINTEGRO_EFECTIVO`.

`prestamos_proyecto` implementa los tipos `PERSONA_A_PROYECTO` y
`PROYECTO_A_PROYECTO`. Conserva el valor original, el saldo pendiente, el
soporte, el acreedor cuando aplica y los proyectos origen o destino según el
tipo.

El préstamo de persona crea `INGRESO_PRESTAMO_PERSONA`. El préstamo entre
proyectos crea `EGRESO_PRESTAMO_PROYECTO` en el fondo origen e
`INGRESO_PRESTAMO_PROYECTO` en el fondo destino, vinculados al mismo préstamo
y referencia.

`devoluciones_prestamo` conserva el préstamo, soporte, referencia, valor,
saldos anterior y nuevo, fecha del sistema y usuario. Sus movimientos se
relacionan tanto con la devolución como con el préstamo original.

---

## Anticipos

Implementado mediante:

```text
anticipos
```

Objetivos:

- registrar la entidad aportante y el soporte;
- asociar el ingreso al proyecto base y al fondo general;
- crear `INGRESO_ANTICIPO`;
- actualizar el saldo de forma transaccional.

El anticipo no se imputa directamente a un centro de costo. La imputación
ocurre mediante las solicitudes y pagos posteriores.

La fecha y hora de anticipos y préstamos son asignadas por el sistema al
registrar la operación; no forman parte de los datos seleccionables por el
usuario.

---

## OCR avanzado

El modelo actual ya almacena el resultado del procesamiento OCR mediante los campos:

```text
estado_ocr
texto_ocr
json_ocr
```

La evolución prevista consiste en ampliar las capacidades del proceso OCR, incorporando funcionalidades como:

- extracción automática de información;
- validaciones documentales;
- clasificación inteligente;
- automatización del diligenciamiento de solicitudes.

No se prevé una nueva entidad para estas funcionalidades mientras puedan implementarse sobre la estructura existente.

---

# Principios de evolución

Toda ampliación del modelo deberá cumplir los siguientes principios:

- mantener compatibilidad con el modelo existente;
- preservar la integridad referencial;
- reutilizar entidades antes de crear nuevas;
- minimizar duplicidad de información;
- documentarse únicamente después de su implementación.

---

# Flujo de incorporación

Toda nueva funcionalidad seguirá el siguiente proceso:

```text
Definición funcional

↓

Actualización de schema.prisma

↓

Migración de base de datos

↓

Implementación del backend

↓

Actualización de la documentación
```

---

# Fuente de verdad

Las entidades descritas en este documento representan únicamente funcionalidades planificadas.

Una vez implementadas en:

```text
schema.prisma
```

pasarán a formar parte de los documentos específicos del modelo Entidad–Relación y dejarán de considerarse parte del roadmap.

---

# Resumen

El roadmap documenta la evolución prevista del modelo de datos sin modificar la descripción del modelo actualmente implementado.

Mientras una entidad no exista en `schema.prisma`, deberá considerarse una funcionalidad futura y no una parte del modelo físico del sistema.
