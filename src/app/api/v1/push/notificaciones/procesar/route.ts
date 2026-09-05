import {
  ConfiguracionPushError,
  procesarNotificacionesPushService,
  tokenProcesadorPushValido,
} from "@/modules/push/envio-push.service";

export const runtime = "nodejs";

function obtenerToken(request: Request) {
  const authorization = request.headers.get("authorization");
  return authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;
}

export async function POST(request: Request) {
  try {
    if (!tokenProcesadorPushValido(obtenerToken(request))) {
      return Response.json(
        { ok: false, message: "No autorizado para procesar notificaciones." },
        { status: 401 },
      );
    }

    const resultado = await procesarNotificacionesPushService();

    return Response.json({
      ok: true,
      message: "Cola Push procesada correctamente.",
      data: resultado,
    });
  } catch (error) {
    if (error instanceof ConfiguracionPushError) {
      return Response.json(
        { ok: false, message: "El procesador Push no está configurado." },
        { status: 503 },
      );
    }

    console.error("Error procesando notificaciones Push:", error);
    return Response.json(
      { ok: false, message: "No fue posible procesar las notificaciones Push." },
      { status: 500 },
    );
  }
}
