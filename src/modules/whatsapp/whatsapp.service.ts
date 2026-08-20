import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { procesarEventoWebhookWhatsAppRepository } from "./whatsapp.repository";
import type {
  ConfiguracionWebhookWhatsApp,
  EventoWebhookWhatsApp,
  RecibirWebhookWhatsAppInput,
  VerificarWebhookWhatsAppInput,
} from "./whatsapp.types";

export class ConfiguracionWhatsAppError extends Error {}

function obtenerVariableObligatoria(nombre: string) {
  const valor = process.env[nombre]?.trim();

  if (!valor) {
    throw new ConfiguracionWhatsAppError(
      `La variable ${nombre} es obligatoria para el webhook de WhatsApp.`,
    );
  }

  return valor;
}

export function obtenerConfiguracionWebhookWhatsApp(): ConfiguracionWebhookWhatsApp {
  if (process.env.WHATSAPP_ENABLED?.trim().toLowerCase() !== "true") {
    throw new ConfiguracionWhatsAppError(
      "La integración de WhatsApp no está habilitada en este ambiente.",
    );
  }

  return {
    appSecret: obtenerVariableObligatoria("WHATSAPP_APP_SECRET"),
    verifyToken: obtenerVariableObligatoria("WHATSAPP_VERIFY_TOKEN"),
  };
}

function compararTextoSeguro(valor: string, esperado: string) {
  const valorBuffer = Buffer.from(valor, "utf8");
  const esperadoBuffer = Buffer.from(esperado, "utf8");

  return (
    valorBuffer.length === esperadoBuffer.length &&
    timingSafeEqual(valorBuffer, esperadoBuffer)
  );
}

export function verificarWebhookWhatsAppService(
  input: VerificarWebhookWhatsAppInput,
) {
  const config = obtenerConfiguracionWebhookWhatsApp();
  const tokenValido =
    input.verifyToken !== null &&
    compararTextoSeguro(input.verifyToken, config.verifyToken);

  if (
    input.mode !== "subscribe" ||
    !tokenValido ||
    input.challenge === null
  ) {
    return {
      status: 403,
      body: {
        ok: false,
        message: "No fue posible verificar el webhook de WhatsApp.",
      },
    };
  }

  return {
    status: 200,
    challenge: input.challenge,
  };
}

function firmaValida(contenido: string, firma: string | null, secret: string) {
  if (!firma?.startsWith("sha256=")) {
    return false;
  }

  const firmaRecibida = firma.slice("sha256=".length);

  if (!/^[a-f0-9]{64}$/i.test(firmaRecibida)) {
    return false;
  }

  const firmaEsperada = createHmac("sha256", secret)
    .update(contenido, "utf8")
    .digest("hex");

  return compararTextoSeguro(
    firmaRecibida.toLowerCase(),
    firmaEsperada.toLowerCase(),
  );
}

function esRegistro(valor: unknown): valor is Record<string, unknown> {
  return Boolean(valor) && typeof valor === "object" && !Array.isArray(valor);
}

function texto(valor: unknown) {
  return typeof valor === "string" && valor.trim() ? valor.trim() : null;
}

function claveHash(prefijo: string, valor: string) {
  return `${prefijo}:${createHash("sha256").update(valor).digest("hex")}`;
}

function extraerEventos(
  payload: Record<string, unknown>,
  contenido: string,
): EventoWebhookWhatsApp[] {
  const eventos: EventoWebhookWhatsApp[] = [];
  const entries = Array.isArray(payload.entry) ? payload.entry : [];

  for (const entry of entries) {
    if (!esRegistro(entry)) continue;
    const changes = Array.isArray(entry.changes) ? entry.changes : [];

    for (const change of changes) {
      if (!esRegistro(change) || !esRegistro(change.value)) continue;
      const value = change.value;
      const contacts = Array.isArray(value.contacts) ? value.contacts : [];
      const contacto = contacts.find(esRegistro);
      const telefonoContacto = contacto ? texto(contacto.wa_id) : null;
      const bsuidContacto = contacto ? texto(contacto.user_id) : null;
      const statuses = Array.isArray(value.statuses) ? value.statuses : [];

      for (const status of statuses) {
        if (!esRegistro(status)) continue;
        const metaMensajeId = texto(status.id);
        const estadoMeta = texto(status.status);
        const timestamp = texto(status.timestamp) ?? "sin-fecha";
        const bsuidDestinatario =
          texto(status.recipient_user_id) ?? bsuidContacto;
        const telefonoDestinatario =
          texto(status.recipient_id) ?? telefonoContacto;
        const identidad = [
          metaMensajeId ?? "sin-mensaje",
          estadoMeta ?? "sin-estado",
          timestamp,
          bsuidDestinatario ?? telefonoDestinatario ?? "sin-destinatario",
        ].join(":");

        eventos.push({
          claveEvento: claveHash("estado", identidad),
          metaMensajeId,
          tipoEvento: "ESTADO",
          estadoMeta,
          telefonoDestinatario,
          bsuidDestinatario,
          payload: status,
        });
      }

      const messages = Array.isArray(value.messages) ? value.messages : [];
      for (const message of messages) {
        if (!esRegistro(message)) continue;
        const metaMensajeId = texto(message.id);
        const bsuidDestinatario =
          texto(message.from_user_id) ?? bsuidContacto;
        const telefonoDestinatario = texto(message.from) ?? telefonoContacto;

        eventos.push({
          claveEvento: metaMensajeId
            ? `mensaje:${metaMensajeId}`
            : claveHash("mensaje", JSON.stringify(message)),
          metaMensajeId,
          tipoEvento: "MENSAJE",
          estadoMeta: null,
          telefonoDestinatario,
          bsuidDestinatario,
          payload: message,
        });
      }
    }
  }

  if (eventos.length === 0) {
    eventos.push({
      claveEvento: claveHash("webhook", contenido),
      metaMensajeId: null,
      tipoEvento: "NO_RECONOCIDO",
      estadoMeta: null,
      telefonoDestinatario: null,
      bsuidDestinatario: null,
      payload,
    });
  }

  return eventos;
}

export async function recibirWebhookWhatsAppService(
  input: RecibirWebhookWhatsAppInput,
) {
  const config = obtenerConfiguracionWebhookWhatsApp();

  if (!firmaValida(input.contenido, input.firma, config.appSecret)) {
    return {
      status: 401,
      body: {
        ok: false,
        message: "La firma del webhook de WhatsApp no es válida.",
      },
    };
  }

  let payload: unknown;

  try {
    payload = JSON.parse(input.contenido);
  } catch {
    return {
      status: 400,
      body: {
        ok: false,
        message: "El contenido del webhook no es un JSON válido.",
      },
    };
  }

  if (!esRegistro(payload)) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "El contenido del webhook de WhatsApp no es válido.",
      },
    };
  }

  const eventos = extraerEventos(payload, input.contenido);
  const resultados = await Promise.all(
    eventos.map((evento) => procesarEventoWebhookWhatsAppRepository(evento)),
  );

  return {
    status: 200,
    body: {
      ok: true,
      message: "Webhook de WhatsApp recibido correctamente.",
      procesados: resultados.filter((resultado) => resultado === "PROCESADO")
        .length,
      duplicados: resultados.filter((resultado) => resultado === "DUPLICADO")
        .length,
      ignorados: resultados.filter((resultado) => resultado === "IGNORADO")
        .length,
    },
  };
}
