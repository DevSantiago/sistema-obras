import path from "node:path";
import { cookies } from "next/headers";
import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import { obtenerArchivoOperacionEfectivoService } from "@/modules/operaciones-efectivo/operaciones-efectivo.service";
import { storageService } from "@/modules/storage/storage.service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
    adjuntoId: string;
  }>;
};

function construirContentDisposition(nombreArchivo: string) {
  const nombre =
    path.basename(nombreArchivo).trim() || "soporte-operacion";
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
    const resultado = await obtenerArchivoOperacionEfectivoService(
      autenticacion.body.data.usuario,
      id,
      adjuntoId,
    );

    if (!resultado.body.ok || !resultado.body.data) {
      return Response.json(resultado.body, {
        status: resultado.status,
      });
    }

    let contenido: Buffer;

    try {
      contenido = await storageService.obtenerArchivo(
        resultado.body.data.ruta_archivo,
      );
    } catch {
      return Response.json(
        {
          ok: false,
          message: "El soporte no está disponible en el almacenamiento.",
        },
        { status: 404 },
      );
    }

    return new Response(new Uint8Array(contenido), {
      status: 200,
      headers: {
        "Content-Type":
          resultado.body.data.tipo_mime || "application/octet-stream",
        "Content-Disposition": construirContentDisposition(
          resultado.body.data.nombre_archivo,
        ),
        "Content-Length": String(contenido.byteLength),
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Error consultando soporte de operación:", error);

    return Response.json(
      { ok: false, message: "No fue posible consultar el soporte." },
      { status: 500 },
    );
  }
}
