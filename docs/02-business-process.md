# 02. Proceso de negocio

## Objetivo

Documentar el proceso funcional completo del sistema de gestión de solicitudes de pago para una empresa de obras civiles, incluyendo creación de solicitudes, soportes, doble aprobación, programación de pagos, marcación como pagada, comentarios, historial, auditoría y gestión de fondos de obra con préstamos, anticipos, devoluciones y movimientos financieros.

## Descripción general

El sistema reemplaza el proceso manual mediante el cual los usuarios envían soportes, imágenes, fotografías o documentos para que una persona transcriba la información a Excel y realice seguimiento.

En el sistema, los usuarios autorizados crean solicitudes de pago asociadas a una obra/proyecto, proveedor, ítem, descripción, valor bruto y valor neto. Cada solicitud puede tener soportes adjuntos, comentarios, historial de estados y trazabilidad de cambios.

La solicitud pasa por un flujo de doble aprobación antes de llegar al área de Pagos. Primero la revisa el Aprobador 1 y luego el Aprobador 2. Si el Aprobador 2 no aprueba, la solicitud vuelve al Aprobador 1, quien decide si la reenvía al Aprobador 2 o si la devuelve al Solicitante para corrección.

Además, cada obra/proyecto debe tener una cuenta de fondos. Esta cuenta aumenta o disminuye mediante movimientos financieros registrados por usuarios autorizados. Los fondos pueden ingresar por préstamos de personas, préstamos entre obras, anticipos por ejecución de obra u otros ajustes autorizados. Los pagos de solicitudes se descuentan de la cuenta de fondos de la obra correspondiente.

## Roles involucrados

- Administrador.
- Solicitante.
- Auxiliar contable.
- Aprobador 1.
- Aprobador 2.
- Pagos.

## Flujo principal de solicitud de pago

1. El Solicitante o Auxiliar contable crea una solicitud de pago.
2. El sistema registra la solicitud en estado `DRAFT`.
3. El usuario selecciona obra/proyecto, proveedor, ítem, descripción, valor bruto y valor neto.
4. El usuario adjunta uno o varios soportes.
5. El usuario envía la solicitud.
6. El sistema valida datos obligatorios, soportes, valores y fondos disponibles de la obra.
7. El sistema reserva fondos de la obra, si se maneja reserva desde el envío.
8. La solicitud pasa a `PENDING_FIRST_APPROVAL`.
9. El Aprobador 1 revisa la solicitud.
10. Si el Aprobador 1 devuelve la solicitud, se registra observación obligatoria y se libera la reserva de fondos, si aplica.
11. Si el Aprobador 1 aprueba, la solicitud pasa a `PENDING_SECOND_APPROVAL`.
12. El Aprobador 2 revisa la solicitud.
13. Si el Aprobador 2 devuelve la solicitud, esta pasa a `RETURNED_TO_FIRST_APPROVER`.
14. El Aprobador 1 revisa la devolución del Aprobador 2.
15. El Aprobador 1 puede reenviar la solicitud al Aprobador 2 o devolverla al Solicitante.
16. Si el Aprobador 2 aprueba, la solicitud pasa a `APPROVED`.
17. Pagos programa la solicitud y esta pasa a `SCHEDULED_FOR_PAYMENT`.
18. Pagos marca la solicitud como pagada.
19. El sistema registra el egreso definitivo de fondos de la obra como `EXPENSE_PAYMENT_REQUEST`.
20. La solicitud queda en estado `PAID`.

## Flujo de estados de solicitud

```text
DRAFT
   ↓
PENDING_FIRST_APPROVAL
   ↓
PENDING_SECOND_APPROVAL
   ↓
APPROVED
   ↓
SCHEDULED_FOR_PAYMENT
   ↓
PAID
```

Flujos alternos:

```text
PENDING_FIRST_APPROVAL → REJECTED → DRAFT
PENDING_SECOND_APPROVAL → RETURNED_TO_FIRST_APPROVER → PENDING_SECOND_APPROVAL
RETURNED_TO_FIRST_APPROVER → REJECTED → DRAFT
DRAFT/PENDING_FIRST_APPROVAL/PENDING_SECOND_APPROVAL/RETURNED_TO_FIRST_APPROVER → CANCELLED
```

## Fondos de obra

Cada obra/proyecto debe tener una cuenta de fondos. Esta cuenta refleja el saldo disponible para atender pagos, préstamos, devoluciones y movimientos financieros propios de esa obra.

## Tipos de movimientos financieros

| Tipo técnico | Dirección | Descripción |
|---|---|---|
| `INCOME_ADVANCE` | Ingreso | Anticipo recibido por ejecución de obra |
| `INCOME_LOAN_PERSON` | Ingreso | Préstamo recibido de una persona o tercero |
| `INCOME_LOAN_PROJECT` | Ingreso | Préstamo recibido desde otra obra |
| `INCOME_LOAN_REPAYMENT` | Ingreso | Devolución recibida por préstamo hecho a otra obra |
| `EXPENSE_PAYMENT_REQUEST` | Egreso | Pago efectivo de una solicitud |
| `EXPENSE_LOAN_REPAYMENT` | Egreso | Devolución de préstamo a persona u obra |
| `EXPENSE_LOAN_TO_PROJECT` | Egreso | Préstamo realizado a otra obra |
| `RESERVE_PAYMENT_REQUEST` | Egreso reservado | Reserva temporal para una solicitud enviada |
| `RELEASE_PAYMENT_REQUEST` | Liberación | Liberación de reserva por rechazo o anulación |
| `ADJUSTMENT_INCOME` | Ingreso | Ajuste positivo autorizado |
| `ADJUSTMENT_EXPENSE` | Egreso | Ajuste negativo autorizado |

## Flujo: préstamo de persona a obra

1. El Auxiliar contable selecciona la obra que recibe el dinero.
2. Registra el prestamista.
3. Registra valor, fecha, referencia y observación.
4. El sistema aumenta el saldo de la obra.
5. El sistema registra movimiento `INCOME_LOAN_PERSON`.
6. El sistema crea un préstamo pendiente en `project_loans`.

## Flujo: ingreso por anticipo de obra

1. El Auxiliar contable selecciona la obra.
2. Registra valor del anticipo, fecha, referencia y observación.
3. El sistema aumenta el saldo de la obra.
4. El sistema registra movimiento `INCOME_ADVANCE`.

## Flujo: devolución de préstamo a persona

1. El Auxiliar contable selecciona el préstamo pendiente.
2. Registra valor a devolver.
3. El sistema valida saldo suficiente en la obra.
4. El sistema disminuye el saldo de la obra.
5. El sistema registra movimiento `EXPENSE_LOAN_REPAYMENT`.
6. El sistema actualiza el saldo pendiente del préstamo.
7. Si el préstamo queda completamente pagado, pasa a `PAID`.

## Flujo: préstamo entre obras

1. El Auxiliar contable selecciona la obra que presta.
2. Selecciona la obra que recibe.
3. Registra valor, fecha, referencia y observación.
4. El sistema valida saldo suficiente en la obra que presta.
5. El sistema registra egreso en la obra que presta.
6. El sistema registra ingreso en la obra que recibe.
7. El sistema crea un préstamo pendiente entre obras.

## Flujo: devolución de préstamo entre obras

1. El Auxiliar contable selecciona el préstamo pendiente entre obras.
2. Registra el valor a devolver.
3. El sistema valida saldo suficiente en la obra deudora.
4. El sistema registra egreso en la obra deudora.
5. El sistema registra ingreso en la obra prestamista.
6. El sistema actualiza el préstamo.

## Reglas de negocio

- Cada obra debe tener una cuenta de fondos.
- Los fondos pueden venir de préstamos, anticipos, devoluciones o ajustes.
- Los pagos de solicitudes se descuentan de la cuenta de fondos de la obra.
- Los préstamos deben quedar registrados como deuda pendiente.
- Los préstamos pueden ser de persona a obra o de obra a obra.
- La devolución de préstamo debe disminuir la deuda pendiente.
- Todo ingreso, egreso, préstamo, devolución, ajuste y pago debe generar movimiento financiero.
- Ningún movimiento debe dejar saldo negativo.
- Todo movimiento financiero debe estar auditado.
- Las solicitudes no deben permitir selección manual de cuenta de fondos por parte del usuario.
- El backend debe resolver la cuenta de fondos usando la obra/proyecto de la solicitud.
