# CURRENT_SPRINT.md

## Objetivo

Completar la edición funcional de solicitudes por el Aprobador Nivel 1,
manteniendo las restricciones estructurales y presupuestales del flujo de
aprobación.

---

## Alcance autorizado

Implementar únicamente:

- HU-0807 de la Épica 8

según lo definido en `docs/11-mvp-backlog.md`.

---

## Historias autorizadas

### Épica 8

Implementar completamente:

- HU-0807 — en desarrollo

Base confirmada:

- HU-0804 — desarrollada y probada
- HU-0808 — desarrollada y probada

Incluyendo:

- backend
- frontend
- integración
- documentación
- pruebas

---

## Orden obligatorio

1. HU-0807 implementada y documentada.
2. Ejecutar validación funcional.
3. Ejecutar pruebas.
4. Ejecutar `npm run build`.
5. Cerrar la rama y hacer merge a `dev`.
6. Detener el desarrollo antes de iniciar HU-0809.

---

## Base completada

- HU-0804: consecutivo oficial generado al enviar la solicitud.
- HU-0805: edición por el solicitante.
- HU-0806: consulta detallada reutilizable.
- HU-0808: aprobación o devolución desde nivel 2 hacia nivel 1.
- HU-0810: devolución y anulación durante la aprobación.

---

## Fuera de alcance

No implementar:

- HU-0809
- Épica 12
- Épica 13
- Épica 15
- Épica 16
- Épica 17
- Épica 18

aunque existan dependencias futuras previstas en la documentación.

No modificar:

- proyecto base;
- centro de costo;
- tipo o número de solicitud;
- solicitante;
- máquina de estados.

---

## Criterio de finalización

El trabajo termina cuando:

- el Aprobador Nivel 1 pueda editar únicamente los campos autorizados;
- el valor neto y la reserva se recalculen de forma consistente;
- la documentación correspondiente esté actualizada;
- el proyecto compile correctamente (`npm run build`);
- las pruebas existentes y nuevas continúen pasando.

Una vez cumplido lo anterior, el agente debe detenerse y no continuar con
nuevas funcionalidades.
