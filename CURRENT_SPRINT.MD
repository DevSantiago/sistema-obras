# CURRENT_SPRINT.md

## Objetivo

Desarrollar el módulo de préstamos, anticipos y devoluciones sobre la base
financiera completada en las Épicas 9 y 10.

---

## Alcance autorizado

Implementar únicamente:

- Épica 14

según lo definido en `11-mvp-backlog.md`.

La Épica 14 se prioriza antes de la Épica 11 sin cambiar su numeración.

---

## Historias autorizadas

### Épica 14

Implementar completamente:

- HU-1401
- HU-1402
- HU-1403
- HU-1404

Incluyendo:

- backend
- frontend
- integración
- documentación
- pruebas

---

## Orden obligatorio

1. Implementar HU-1401.
2. Ejecutar pruebas.
3. Actualizar documentación.
4. Ejecutar `npm run build`.
5. Cerrar la rama y hacer merge a `dev`.
6. Repetir el ciclo para HU-1402, HU-1403 y HU-1404.
7. Detener el desarrollo.

---

## Fuera de alcance

No implementar:

- Épica 11, pospuesta hasta finalizar la Épica 14
- Épica 12
- Épica 13
- Épica 15
- Épica 16
- Épica 17
- Épica 18

aunque existan dependencias futuras previstas en la documentación.

---

## Criterio de finalización

El trabajo termina cuando:

- la Épica 14 esté completamente terminada;
- la documentación correspondiente esté actualizada;
- el proyecto compile correctamente (`npm run build`);
- las pruebas existentes continúen pasando.

Una vez cumplido lo anterior, el agente debe detenerse y no continuar con
nuevas funcionalidades.
