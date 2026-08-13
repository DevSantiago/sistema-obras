# CURRENT_SPRINT.md

## Objetivo

Completar el historial documental y la auditoría funcional de las solicitudes
de pago durante todo su ciclo de vida.

---

## Alcance autorizado

Implementar únicamente:

- HU-0809 de la Épica 8

según lo definido en `docs/11-mvp-backlog.md`.

---

## Historias autorizadas

### Épica 8

Implementar completamente:

- HU-0809 — terminada y validada técnicamente; pendiente de merge

Base confirmada:

- HU-0804 — terminada
- HU-0807 — terminada
- HU-0808 — terminada

Incluyendo:

- backend
- frontend
- integración
- documentación
- pruebas

---

## Orden obligatorio

1. HU-0809 implementada y documentada.
2. Ejecutar validación funcional.
3. Ejecutar pruebas.
4. Ejecutar `npm run build`.
5. Cerrar la rama y hacer merge a `dev`.
6. Cerrar la Épica 8 y detener el desarrollo.

---

## Base completada

- HU-0804: consecutivo oficial generado al enviar la solicitud.
- HU-0805: edición por el solicitante.
- HU-0806: consulta detallada reutilizable.
- HU-0807: edición funcional por Aprobador Nivel 1.
- HU-0808: aprobación o devolución desde nivel 2 hacia nivel 1.
- HU-0810: devolución y anulación durante la aprobación.

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

No modificar la máquina de estados ni duplicar los registros operativos ya
existentes de devoluciones, anulaciones, pagos y movimientos financieros.

---

## Criterio de finalización

El trabajo termina cuando:

- cada evento del ciclo de vida tenga usuario, fecha, acción y contexto;
- el detalle de la solicitud permita consultar su historial en orden;
- la documentación correspondiente esté actualizada;
- el proyecto compile correctamente (`npm run build`);
- las pruebas existentes y nuevas continúen pasando.

Una vez cumplido lo anterior, el agente debe detenerse y no continuar con
nuevas funcionalidades.
