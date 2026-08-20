# CURRENT_SPRINT.md

## Objetivo

Continuar la Épica 19 procesando de forma idempotente los estados enviados por
el webhook de Meta y conservando trazabilidad de teléfono y `BSUID`.

---

## Alcance autorizado

Implementar HU-1905:

- persistir cada evento recibido con una clave idempotente;
- correlacionar estados de entrega mediante el identificador `wamid`;
- procesar `sent`, `delivered`, `read` y `failed` sin retroceder estados;
- admitir teléfono y Business-Scoped User ID (`BSUID`);
- conservar eventos duplicados, desconocidos o sin notificación asociada.

---

## Base funcional cerrada

- Épica 8 cerrada y fusionada en `dev`.
- Preparación del VPS, PostgreSQL, HTTPS y Amazon S3 terminada.
- Staging operativo en `https://stg.dimensiones.cloud`.
- Carga y consulta de adjuntos en S3 validada desde staging.
- HU-1901 a HU-1904 cerradas y fusionadas en `dev`.
- Webhook de Meta verificado y envío asíncrono probado en staging.
- Plantillas funcionales creadas en Meta y pendientes de aprobación.

---

## Historias del sprint

### HU-1905. Procesar estados e idempotencia del webhook

- Registra estados y mensajes recibidos antes de aplicar cambios.
- Ignora eventos repetidos mediante una clave determinística.
- Actualiza la notificación asociada al `wamid`.
- Conserva `recipient_id`, `wa_id`, `recipient_user_id` y `user_id` cuando
  estén disponibles.
- No depende de que Meta siempre informe el número telefónico.

---

## Orden obligatorio

1. Incorporar la persistencia de eventos y `BSUID` mediante una migración nueva.
2. Extraer estados y mensajes del payload validado por firma.
3. Implementar correlación por `wamid` y avance monotónico de estados.
4. Cubrir duplicados, eventos desconocidos y formatos con o sin teléfono.
5. Ejecutar migración, pruebas, lint y `npm run build`.

---

## Fuera de alcance

- No implementar la bandeja administrativa ni el reintento manual de HU-1906.
- No responder mensajes entrantes desde el webhook.
- No modificar la máquina de estados de solicitudes.
- No sustituir los teléfonos existentes por `BSUID` en el envío actual.

---

## Criterio de finalización

- Cada evento repetido se procesa una sola vez.
- Los estados se correlacionan por `wamid` y nunca retroceden.
- Teléfono y `BSUID` se conservan como identificadores complementarios.
- Los eventos desconocidos no afectan el servicio ni las solicitudes.
- Las pruebas, lint y build finalizan sin errores.
