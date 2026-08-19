# CURRENT_SPRINT.md

## Objetivo

Continuar la Épica 19 creando notificaciones persistentes y transaccionales
cuando una solicitud avance o sea devuelta en el flujo de aprobación.

---

## Alcance autorizado

Implementar HU-1903:

- crear una notificación dentro de la transacción del cambio de estado;
- resolver destinatarios según rol, proyecto y línea de negocio;
- conservar una copia del teléfono y contenido funcional del evento;
- impedir duplicados dentro de una misma ocurrencia de transición;
- no enviar mensajes todavía.

---

## Base funcional cerrada

- Épica 8 cerrada y fusionada en `dev`.
- Preparación del VPS, PostgreSQL, HTTPS y Amazon S3 terminada.
- Staging operativo en `https://stg.dimensiones.cloud`.
- Carga y consulta de adjuntos en S3 validada desde staging.
- HU-1901 y HU-1902 cerradas y fusionadas en `dev`.
- Webhook de Meta verificado y número de prueba conectado en staging.

---

## Historias del sprint

### HU-1903. Crear notificaciones al cambiar una solicitud de estado

- Persiste solicitud, transición, destinatario, teléfono y contenido.
- Incluye consecutivo, proyecto, beneficiario, valor, estado y enlace.
- Conserva la transición aunque WhatsApp no esté disponible.
- Permite que HU-1904 procese posteriormente la cola pendiente.

---

## Orden obligatorio

1. Crear la tabla y migración de notificaciones.
2. Implementar la resolución de destinatarios.
3. Integrar las transiciones documentadas en la misma transacción Prisma.
4. Crear pruebas de contenido, acceso y ausencia de teléfono.
5. Ejecutar pruebas, lint y `npm run build`.

---

## Fuera de alcance

- No enviar mensajes de WhatsApp todavía.
- No implementar reintentos ni bandeja administrativa.
- No procesar estados de entrega ni webhooks idempotentes en esta rama.
- No modificar la máquina de estados de solicitudes.

---

## Criterio de finalización

- Cada transición documentada crea sus notificaciones en la misma transacción.
- Los destinatarios respetan rol y acceso activo al proyecto.
- El contenido incluye los datos funcionales definidos por HU-1903.
- Una ausencia de destinatario o teléfono no bloquea el flujo operativo.
- Las pruebas, lint y build finalizan sin errores.
