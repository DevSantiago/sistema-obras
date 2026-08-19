# CURRENT_SPRINT.md

## Objetivo

Continuar la Épica 19 enviando de forma asíncrona las notificaciones pendientes
sin bloquear el flujo de aprobación.

---

## Alcance autorizado

Implementar HU-1904:

- reclamar notificaciones pendientes sin concurrencia duplicada;
- enviar plantillas mediante WhatsApp Business Platform;
- registrar intentos, errores, respuesta e identificador de Meta;
- reintentar fallos de forma controlada;
- ejecutar el procesador periódicamente desde el VPS.

---

## Base funcional cerrada

- Épica 8 cerrada y fusionada en `dev`.
- Preparación del VPS, PostgreSQL, HTTPS y Amazon S3 terminada.
- Staging operativo en `https://stg.dimensiones.cloud`.
- Carga y consulta de adjuntos en S3 validada desde staging.
- HU-1901, HU-1902 y HU-1903 cerradas y fusionadas en `dev`.
- Webhook de Meta verificado y número de prueba conectado en staging.

---

## Historias del sprint

### HU-1904. Enviar notificaciones de forma asíncrona

- Procesa registros `PENDIENTE`, `FALLIDA` y bloqueos `ENVIANDO` vencidos.
- Envía plantillas con los datos persistidos por HU-1903.
- Registra intentos, errores, respuesta e identificador `wamid`.
- No selecciona nuevamente mensajes confirmados por Meta.

---

## Orden obligatorio

1. Implementar el reclamo atómico de notificaciones procesables.
2. Integrar el envío de plantillas con timeout y respuesta de Meta.
3. Implementar fallos y reintentos controlados.
4. Proteger y programar el disparador interno del VPS.
5. Ejecutar pruebas, lint y `npm run build`.

---

## Fuera de alcance

- No procesar estados de entrega ni webhooks idempotentes en esta rama.
- No implementar la bandeja administrativa ni el reintento manual.
- No modificar la máquina de estados de solicitudes.

---

## Criterio de finalización

- Cada registro se reclama una sola vez por ejecución concurrente.
- Los mensajes confirmados guardan identificador de Meta y estado `ENVIADA`.
- Los fallos registran el error y se reintentan hasta el límite configurado.
- La indisponibilidad de WhatsApp no afecta el estado de la solicitud.
- Las pruebas, lint y build finalizan sin errores.
