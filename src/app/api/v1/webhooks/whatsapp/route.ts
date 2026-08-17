import {
  ConfiguracionWhatsAppError,
  recibirWebhookWhatsAppService,
  verificarWebhookWhatsAppService,
} from "@/modules/whatsapp/whatsapp.service";

export const runtime = "nodejs";

const LIMITE_WEBHOOK_BYTES = 1024 * 1024;

function respuestaConfiguracionNoDisponible() {
  return Response.json(
    {
      ok: false,
      message: "La integración de WhatsApp no está configurada.",
    },
    { status: 503 },
  );
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const resultado = verificarWebhookWhatsAppService({
      mode: url.searchParams.get("hub.mode"),
      verifyToken: url.searchParams.get("hub.verify_token"),
      challenge: url.searchParams.get("hub.challenge"),
    });

    if ("challenge" in resultado) {
      return new Response(resultado.challenge, {
        status: resultado.status,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    return Response.json(resultado.body, { status: resultado.status });
  } catch (error) {
    if (error instanceof ConfiguracionWhatsAppError) {
      return respuestaConfiguracionNoDisponible();
    }

    console.error("Error verificando webhook de WhatsApp:", error);
    return Response.json(
      { ok: false, message: "No fue posible verificar el webhook." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") || 0);

    if (contentLength > LIMITE_WEBHOOK_BYTES) {
      return Response.json(
        { ok: false, message: "El webhook supera el tamaño permitido." },
        { status: 413 },
      );
    }

    const contenido = await request.text();

    if (Buffer.byteLength(contenido, "utf8") > LIMITE_WEBHOOK_BYTES) {
      return Response.json(
        { ok: false, message: "El webhook supera el tamaño permitido." },
        { status: 413 },
      );
    }

    const resultado = recibirWebhookWhatsAppService({
      contenido,
      firma: request.headers.get("x-hub-signature-256"),
    });

    return Response.json(resultado.body, { status: resultado.status });
  } catch (error) {
    if (error instanceof ConfiguracionWhatsAppError) {
      return respuestaConfiguracionNoDisponible();
    }

    console.error("Error recibiendo webhook de WhatsApp:", error);
    return Response.json(
      { ok: false, message: "No fue posible recibir el webhook." },
      { status: 500 },
    );
  }
}
