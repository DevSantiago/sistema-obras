import path from "node:path";
import { cookies } from "next/headers";
import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import { obtenerAdjuntoSolicitudPagoService } from "@/modules/solicitudes-pago/solicitudes-pago.service";
import { storageService } from "@/modules/storage/storage.service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
    adjuntoId: string;
  }>;
};

function construirContentDisposition(nombreArchivo: string) {
  const nombre = path.basename(nombreArchivo).trim() || "adjunto-solicitud";
  const nombreSeguro = nombre.replace(/["\\\r\n]/g, "_");

  return [
    `inline; filename="${nombreSeguro}"`,
    `filename*=UTF-8''${encodeURIComponent(nombreSeguro)}`,
  ].join("; ");
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const cookieStore = await cookies();
    const autenticacion = await obtenerUsuarioAutenticado(
      cookieStore.get("session_token")?.value,
    );

    if (!autenticacion.body.ok || !autenticacion.body.data) {
      return Response.json(autenticacion.body, {
        status: autenticacion.status,
      });
    }

    const { id, adjuntoId } = await context.params;
    const resultado = await obtenerAdjuntoSolicitudPagoService(
      autenticacion.body.data.usuario,
      id,
      adjuntoId,
    );

    if (!resultado.body.ok || !resultado.body.data) {
      return Response.json(resultado.body, {
        status: resultado.status,
      });
    }

    if (!("ruta_archivo" in resultado.body.data)) {
      return Response.json(
        { ok: false, message: "No fue posible resolver el adjunto." },
        { status: 500 },
      );
    }

    const archivo = resultado.body.data;

    let contenido: Buffer;

    try {
      contenido = await storageService.obtenerArchivo(
        archivo.ruta_archivo,
      );
    } catch {
      return Response.json(
        {
          ok: false,
          message: "El adjunto no está disponible en el almacenamiento.",
        },
        { status: 404 },
      );
    }

    return new Response(new Uint8Array(contenido), {
      status: 200,
      headers: {
        "Content-Type": archivo.tipo_mime || "application/octet-stream",
        "Content-Disposition": construirContentDisposition(
          archivo.nombre_archivo,
        ),
        "Content-Length": String(contenido.byteLength),
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Error consultando adjunto de solicitud:", error);

    return Response.json(
      { ok: false, message: "No fue posible consultar el adjunto." },
      { status: 500 },
    );
  }
}
