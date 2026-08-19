import { timingSafeEqual } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import {
  marcarNotificacionEnviadaRepository,
  marcarNotificacionFallidaRepository,
  obtenerNotificacionesProcesablesRepository,
  reclamarNotificacionRepository,
} from "./envio-notificaciones.repository";
import type {
  NotificacionWhatsAppPendiente,
  ResultadoProcesamientoWhatsApp,
} from "./envio-notificaciones.types";
import { ConfiguracionWhatsAppError } from "./whatsapp.service";

type FetchWhatsApp = typeof fetch;

function variableObligatoria(nombre: string) {
  const valor = process.env[nombre]?.trim();

  if (!valor) {
    throw new ConfiguracionWhatsAppError(
      `La variable ${nombre} es obligatoria para enviar notificaciones de WhatsApp.`,
    );
  }

  return valor;
}

function numeroConfigurado(nombre: string, valorPredeterminado: number) {
  const valor = Number(process.env[nombre]);
  return Number.isInteger(valor) && valor > 0 ? valor : valorPredeterminado;
}

function configuracionEnvio() {
  if (process.env.WHATSAPP_ENABLED?.trim().toLowerCase() !== "true") {
    throw new ConfiguracionWhatsAppError(
      "La integración de WhatsApp no está habilitada en este ambiente.",
    );
  }

  return {
    version: variableObligatoria("WHATSAPP_GRAPH_API_VERSION"),
    phoneNumberId: variableObligatoria("WHATSAPP_PHONE_NUMBER_ID"),
    accessToken: variableObligatoria("WHATSAPP_ACCESS_TOKEN"),
    maximoIntentos: numeroConfigurado("WHATSAPP_MAX_ATTEMPTS", 3),
    limite: numeroConfigurado("WHATSAPP_BATCH_SIZE", 10),
    minutosReintento: numeroConfigurado("WHATSAPP_RETRY_MINUTES", 5),
    minutosRecuperacion: numeroConfigurado("WHATSAPP_SENDING_TIMEOUT_MINUTES", 10),
    timeoutMs: numeroConfigurado("WHATSAPP_REQUEST_TIMEOUT_MS", 15000),
  };
}

export function tokenProcesadorWhatsAppValido(token: string | null) {
  const esperado = variableObligatoria("WHATSAPP_PROCESSOR_TOKEN");

  if (!token) {
    return false;
  }

  const recibidoBuffer = Buffer.from(token, "utf8");
  const esperadoBuffer = Buffer.from(esperado, "utf8");

  return (
    recibidoBuffer.length === esperadoBuffer.length &&
    timingSafeEqual(recibidoBuffer, esperadoBuffer)
  );
}

function obtenerContenido(notificacion: NotificacionWhatsAppPendiente) {
  if (
    !notificacion.contenido ||
    Array.isArray(notificacion.contenido) ||
    typeof notificacion.contenido !== "object"
  ) {
    throw new Error("La notificación no contiene datos válidos para la plantilla.");
  }

  return notificacion.contenido as Record<string, Prisma.JsonValue>;
}

function construirPlantilla(notificacion: NotificacionWhatsAppPendiente) {
  if (!notificacion.telefono_destinatario) {
    throw new Error("El destinatario no tiene un teléfono configurado.");
  }

  if (!notificacion.plantilla) {
    throw new Error("La notificación no tiene una plantilla de WhatsApp configurada.");
  }

  const plantilla = {
    name: notificacion.plantilla,
    language: { code: notificacion.idioma },
  } as {
    name: string;
    language: { code: string };
    components?: Array<{
      type: "body";
      parameters: Array<{ type: "text"; text: string }>;
    }>;
  };

  if (notificacion.plantilla !== "hello_world") {
    const contenido = obtenerContenido(notificacion);
    const valores = [
      contenido.numero_solicitud,
      contenido.proyecto,
      contenido.beneficiario,
      contenido.valor,
      contenido.estado_nuevo,
      contenido.enlace,
    ];

    plantilla.components = [
      {
        type: "body",
        parameters: valores.map((valor) => ({
          type: "text" as const,
          text: String(valor ?? ""),
        })),
      },
    ];
  }

  return {
    messaging_product: "whatsapp",
    to: notificacion.telefono_destinatario,
    type: "template",
    template: plantilla,
  };
}

async function leerRespuesta(response: Response) {
  const texto = await response.text();

  try {
    return JSON.parse(texto) as Prisma.InputJsonValue;
  } catch {
    return { respuesta: texto.slice(0, 2000) };
  }
}

function mensajeErrorProveedor(respuesta: Prisma.InputJsonValue, status: number) {
  if (
    respuesta &&
    !Array.isArray(respuesta) &&
    typeof respuesta === "object" &&
    "error" in respuesta &&
    respuesta.error &&
    !Array.isArray(respuesta.error) &&
    typeof respuesta.error === "object" &&
    "message" in respuesta.error
  ) {
    return String(respuesta.error.message);
  }

  return `WhatsApp respondió con estado HTTP ${status}.`;
}

function obtenerMetaMensajeId(respuesta: Prisma.InputJsonValue) {
  if (
    respuesta &&
    !Array.isArray(respuesta) &&
    typeof respuesta === "object" &&
    "messages" in respuesta &&
    Array.isArray(respuesta.messages)
  ) {
    const mensaje = respuesta.messages[0];
    if (
      mensaje &&
      !Array.isArray(mensaje) &&
      typeof mensaje === "object" &&
      "id" in mensaje
    ) {
      return String(mensaje.id);
    }
  }

  return null;
}

export async function procesarNotificacionesWhatsAppService(
  fetchWhatsApp: FetchWhatsApp = fetch,
): Promise<ResultadoProcesamientoWhatsApp> {
  const config = configuracionEnvio();
  const ahora = new Date();
  const candidatas = await obtenerNotificacionesProcesablesRepository({
    limite: config.limite,
    maximoIntentos: config.maximoIntentos,
    reintentarAntesDe: new Date(
      ahora.getTime() - config.minutosReintento * 60 * 1000,
    ),
    recuperarAntesDe: new Date(
      ahora.getTime() - config.minutosRecuperacion * 60 * 1000,
    ),
  });
  const resultado: ResultadoProcesamientoWhatsApp = {
    revisadas: candidatas.length,
    enviadas: 0,
    fallidas: 0,
    omitidas: 0,
  };

  for (const notificacion of candidatas) {
    const fechaIntento = new Date();
    const reclamada = await reclamarNotificacionRepository(
      notificacion,
      config.maximoIntentos,
      fechaIntento,
    );

    if (!reclamada) {
      resultado.omitidas += 1;
      continue;
    }

    try {
      const response = await fetchWhatsApp(
        `https://graph.facebook.com/${config.version}/${config.phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(construirPlantilla(notificacion)),
          signal: AbortSignal.timeout(config.timeoutMs),
        },
      );
      const respuesta = await leerRespuesta(response);
      const metaMensajeId = obtenerMetaMensajeId(respuesta);

      if (!response.ok || !metaMensajeId) {
        throw Object.assign(
          new Error(mensajeErrorProveedor(respuesta, response.status)),
          { respuesta },
        );
      }

      await marcarNotificacionEnviadaRepository({
        id: notificacion.id,
        metaMensajeId,
        respuesta,
        fecha: new Date(),
      });
      resultado.enviadas += 1;
    } catch (error) {
      const respuesta =
        error && typeof error === "object" && "respuesta" in error
          ? (error.respuesta as Prisma.InputJsonValue)
          : undefined;
      await marcarNotificacionFallidaRepository({
        id: notificacion.id,
        error: error instanceof Error ? error.message : "Error desconocido enviando WhatsApp.",
        respuesta,
        fecha: new Date(),
      });
      resultado.fallidas += 1;
    }
  }

  return resultado;
}
