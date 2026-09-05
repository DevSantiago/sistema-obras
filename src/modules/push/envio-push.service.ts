import { timingSafeEqual } from "node:crypto";
import webpush from "web-push";
import {
  desactivarSuscripcionPushExpiradaRepository,
  marcarNotificacionPushEnviadaRepository,
  marcarNotificacionPushFallidaRepository,
  obtenerNotificacionesPushProcesablesRepository,
  reclamarNotificacionPushRepository,
} from "./envio-push.repository";
import type { ResultadoProcesamientoPush } from "./envio-push.types";

export class ConfiguracionPushError extends Error {}

function variableObligatoria(nombre: string) {
  const valor = process.env[nombre]?.trim();

  if (!valor) {
    throw new ConfiguracionPushError(
      `La variable ${nombre} es obligatoria para enviar notificaciones Push.`,
    );
  }

  return valor;
}

function numeroConfigurado(nombre: string, valorPredeterminado: number) {
  const valor = Number(process.env[nombre]);
  return Number.isInteger(valor) && valor > 0 ? valor : valorPredeterminado;
}

function configuracionEnvioPush() {
  if (process.env.PUSH_ENABLED?.trim().toLowerCase() !== "true") {
    throw new ConfiguracionPushError(
      "Las notificaciones Push no están habilitadas en este ambiente.",
    );
  }

  return {
    ambiente: process.env.APP_ENV?.trim() || "development",
    subject: variableObligatoria("WEB_PUSH_VAPID_SUBJECT"),
    publicKey: variableObligatoria("NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY"),
    privateKey: variableObligatoria("WEB_PUSH_VAPID_PRIVATE_KEY"),
    maximoIntentos: numeroConfigurado("PUSH_MAX_ATTEMPTS", 3),
    limite: numeroConfigurado("PUSH_BATCH_SIZE", 20),
    minutosReintento: numeroConfigurado("PUSH_RETRY_MINUTES", 5),
    minutosRecuperacion: numeroConfigurado("PUSH_SENDING_TIMEOUT_MINUTES", 10),
    timeoutMs: numeroConfigurado("PUSH_REQUEST_TIMEOUT_MS", 15000),
    ttlSegundos: numeroConfigurado("PUSH_TTL_SECONDS", 3600),
  };
}

export function tokenProcesadorPushValido(token: string | null) {
  const esperado = variableObligatoria("PUSH_PROCESSOR_TOKEN");

  if (!token) return false;

  const recibidoBuffer = Buffer.from(token, "utf8");
  const esperadoBuffer = Buffer.from(esperado, "utf8");

  return (
    recibidoBuffer.length === esperadoBuffer.length &&
    timingSafeEqual(recibidoBuffer, esperadoBuffer)
  );
}

function statusCodeError(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "statusCode" in error &&
    typeof error.statusCode === "number"
  ) {
    return error.statusCode;
  }

  return undefined;
}

export async function procesarNotificacionesPushService(): Promise<ResultadoProcesamientoPush> {
  const configuracion = configuracionEnvioPush();
  const ahora = new Date();
  const candidatas = await obtenerNotificacionesPushProcesablesRepository({
    ambiente: configuracion.ambiente,
    limite: configuracion.limite,
    maximoIntentos: configuracion.maximoIntentos,
    reintentarAntesDe: new Date(
      ahora.getTime() - configuracion.minutosReintento * 60_000,
    ),
    recuperarAntesDe: new Date(
      ahora.getTime() - configuracion.minutosRecuperacion * 60_000,
    ),
  });
  const resultado: ResultadoProcesamientoPush = {
    revisadas: candidatas.length,
    enviadas: 0,
    fallidas: 0,
    omitidas: 0,
    suscripcionesDesactivadas: 0,
  };

  webpush.setVapidDetails(
    configuracion.subject,
    configuracion.publicKey,
    configuracion.privateKey,
  );

  for (const notificacion of candidatas) {
    const reclamada = await reclamarNotificacionPushRepository(
      notificacion,
      configuracion.maximoIntentos,
      new Date(),
    );

    if (!reclamada) {
      resultado.omitidas += 1;
      continue;
    }

    try {
      const respuesta = await webpush.sendNotification(
        {
          endpoint: notificacion.suscripcion.endpoint,
          keys: {
            p256dh: notificacion.suscripcion.clave_p256dh,
            auth: notificacion.suscripcion.clave_auth,
          },
        },
        JSON.stringify({
          title: notificacion.titulo,
          body: notificacion.mensaje,
          data: { url: notificacion.enlace },
          tag: `${notificacion.tipo_evento}:${notificacion.solicitud_pago_id}`,
        }),
        {
          TTL: configuracion.ttlSegundos,
          urgency: "high",
          timeout: configuracion.timeoutMs,
        },
      );

      await marcarNotificacionPushEnviadaRepository({
        id: notificacion.id,
        statusCode: respuesta.statusCode,
        fecha: new Date(),
      });
      resultado.enviadas += 1;
    } catch (error) {
      const statusCode = statusCodeError(error);
      const fecha = new Date();

      if (statusCode === 404 || statusCode === 410) {
        resultado.suscripcionesDesactivadas +=
          await desactivarSuscripcionPushExpiradaRepository({
            suscripcionId: notificacion.suscripcion.id,
            fecha,
          });
      }

      await marcarNotificacionPushFallidaRepository({
        id: notificacion.id,
        error:
          error instanceof Error
            ? error.message
            : "Error desconocido enviando la notificación Push.",
        statusCode,
        fecha,
      });
      resultado.fallidas += 1;
    }
  }

  return resultado;
}
