# CURRENT_SPRINT.md

## Objetivo

Completar el seguimiento operativo de los retiros y sobrantes de efectivo
sobre la base financiera implementada en las Épicas 9, 10 y 14.

---

## Alcance autorizado

Implementar únicamente:

- Épica 11

según lo definido en `11-mvp-backlog.md`.

La Épica 11 retoma su prioridad después de finalizar completamente la
Épica 14.

---

## Historias autorizadas

### Épica 11

Implementar completamente:

- HU-1101 — completada
- HU-1102 — completada
- HU-1103 — completada
- HU-1104 — pendiente
- HU-1105 — pendiente

Incluyendo:

- backend
- frontend
- integración
- documentación
- pruebas

---

## Orden obligatorio

1. HU-1101 implementada y documentada.
2. Ejecutar validación funcional.
3. Ejecutar pruebas.
4. Ejecutar `npm run build`.
5. Cerrar la rama y hacer merge a `dev`.
6. Repetir el ciclo para HU-1104 y HU-1105.
7. Detener el desarrollo.

---

## Base completada

- Épica 9: ejecución y registro de pagos.
- Épica 10: fondos y movimientos financieros.
- Épica 14: anticipos, préstamos y devoluciones.
- Retiro agrupado para solicitudes en `EFECTIVO` o `CONSIGNACION`.
- Registro transaccional de `operaciones_efectivo` y sus detalles.
- Movimiento `EGRESO_RETIRO_EFECTIVO`.
- Reintegro inmediato opcional mediante
  `INGRESO_REINTEGRO_EFECTIVO`.

---

## Fuera de alcance

No implementar:

- Épica 12
- Épica 13
- Épica 15
- Épica 16
- Épica 17
- Épica 18

aunque existan dependencias futuras previstas en la documentación.

No duplicar:

- el registro de pagos implementado en la Épica 9;
- la actualización de fondos y movimientos de la Épica 10;
- los préstamos implementados en la Épica 14;
- el reintegro inmediato ya disponible en las operaciones de efectivo.

---

## Criterio de finalización

El trabajo termina cuando:

- la Épica 11 esté completamente terminada;
- los retiros, reingresos y sobrantes tengan trazabilidad operativa;
- la documentación correspondiente esté actualizada;
- el proyecto compile correctamente (`npm run build`);
- las pruebas existentes y nuevas continúen pasando.

Una vez cumplido lo anterior, el agente debe detenerse y no continuar con
nuevas funcionalidades.
