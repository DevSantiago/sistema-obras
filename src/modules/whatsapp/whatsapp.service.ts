import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  ConfiguracionWebhookWhatsApp,
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

export function recibirWebhookWhatsAppService(
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

  try {
    JSON.parse(input.contenido);
  } catch {
    return {
      status: 400,
      body: {
        ok: false,
        message: "El contenido del webhook no es un JSON válido.",
      },
    };
  }

  return {
    status: 200,
    body: {
      ok: true,
      message: "Webhook de WhatsApp recibido correctamente.",
    },
  };
}
