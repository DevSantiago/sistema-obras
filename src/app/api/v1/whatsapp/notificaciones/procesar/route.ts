import {
  procesarNotificacionesWhatsAppService,
  tokenProcesadorWhatsAppValido,
} from "@/modules/whatsapp/envio-notificaciones.service";
import { ConfiguracionWhatsAppError } from "@/modules/whatsapp/whatsapp.service";

export const runtime = "nodejs";

function obtenerToken(request: Request) {
  const authorization = request.headers.get("authorization");
  return authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;
}

export async function POST(request: Request) {
  try {
    if (!tokenProcesadorWhatsAppValido(obtenerToken(request))) {
      return Response.json(
        { ok: false, message: "No autorizado para procesar notificaciones." },
        { status: 401 },
      );
    }

    const resultado = await procesarNotificacionesWhatsAppService();

    return Response.json({
      ok: true,
      message: "Cola de WhatsApp procesada correctamente.",
      data: resultado,
    });
  } catch (error) {
    if (error instanceof ConfiguracionWhatsAppError) {
      return Response.json(
        { ok: false, message: "El procesador de WhatsApp no está configurado." },
        { status: 503 },
      );
    }

    console.error("Error procesando notificaciones de WhatsApp:", error);
    return Response.json(
      { ok: false, message: "No fue posible procesar las notificaciones." },
      { status: 500 },
    );
  }
}
