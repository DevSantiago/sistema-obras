# CURRENT_SPRINT.md

## Objetivo

Iniciar la Épica 19 mediante la configuración aislada de WhatsApp Business
Platform y la publicación de un webhook seguro en el ambiente de staging.

---

## Alcance autorizado

Implementar HU-1901 y HU-1902:

- configurar WhatsApp mediante variables de entorno independientes;
- exponer la verificación `GET` requerida por Meta;
- recibir eventos mediante `POST` sobre HTTPS;
- validar el token de verificación y la firma `X-Hub-Signature-256`;
- documentar la configuración y desplegar el webhook en staging.

---

## Base funcional cerrada

- Épica 8 cerrada y fusionada en `dev`.
- Preparación del VPS, PostgreSQL, HTTPS y Amazon S3 terminada.
- Staging operativo en `https://stg.dimensiones.cloud`.
- Carga y consulta de adjuntos en S3 validada desde staging.

---

## Historias del sprint

### HU-1901. Configurar integración de WhatsApp por ambiente

- Configuración separada para staging y producción.
- Secretos únicamente en variables de entorno.
- Número, WABA, aplicación, token, versión de API y plantillas configurables.

### HU-1902. Recibir y validar webhooks de Meta

- Verificación de suscripción por `GET`.
- Recepción de eventos por `POST`.
- Validación criptográfica de la firma antes de procesar el contenido.
- Respuesta oportuna sin modificar solicitudes ni enviar mensajes todavía.

---

## Orden obligatorio

1. Incorporar plantillas de variables sin secretos.
2. Implementar el servicio de validación del webhook.
3. Exponer el endpoint público.
4. Crear pruebas de token, firma y respuestas HTTP.
5. Ejecutar pruebas, lint y `npm run build`.
6. Desplegar staging y validar el endpoint público.
7. Configurar la URL y el token en `Obras WebApp | STG`.

---

## Fuera de alcance

- No enviar mensajes de WhatsApp todavía.
- No crear notificaciones por cambios de estado.
- No implementar reintentos ni bandeja administrativa.
- No persistir estados de entrega ni procesar idempotencia en esta rama.
- No modificar la máquina de estados de solicitudes.

---

## Criterio de finalización

- La configuración de WhatsApp queda aislada por ambiente.
- Meta puede verificar el webhook mediante token.
- Las solicitudes `POST` sin firma válida son rechazadas.
- El endpoint queda publicado con HTTPS en staging.
- Las pruebas, lint y build finalizan sin errores.
