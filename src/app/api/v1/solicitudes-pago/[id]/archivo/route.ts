import { readFile } from "node:fs/promises";
import path from "node:path";
import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import { obtenerSolicitudPagoPorIdService } from "@/modules/solicitudes-pago/solicitudes-pago.service";
import { cookies } from "next/headers";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type ArchivoOrigenDescargable = {
  nombre_archivo: string;
  ruta_archivo: string;
  tipo_mime: string | null;
  tamano_archivo: number | bigint | null;
};

type SolicitudConArchivoOrigen = {
  archivo_origen?: ArchivoOrigenDescargable | null;
};

async function obtenerUsuarioSesionDesdeCookie() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  return obtenerUsuarioAutenticado(sessionToken);
}

function normalizarNombreDescarga(nombreArchivo: string): string {
  const nombre = path.basename(nombreArchivo).trim();

  return nombre || "archivo-nomina.xlsx";
}

function construirContentDisposition(nombreArchivo: string): string {
  const nombreSeguro = normalizarNombreDescarga(nombreArchivo)
    .replace(/["\\\r\n]/g, "_");

  return [
    `attachment; filename="${nombreSeguro}"`,
    `filename*=UTF-8''${encodeURIComponent(nombreSeguro)}`,
  ].join("; ");
}

function resolverRutaArchivo(rutaRegistrada: string): string | null {
  const rutaRelativa = rutaRegistrada.trim();

  if (!rutaRelativa) {
    return null;
  }

  const rutaBase = path.resolve(process.cwd());
  const rutaAbsoluta = path.resolve(rutaBase, rutaRelativa);

  const rutaRelativaValidada = path.relative(
    rutaBase,
    rutaAbsoluta,
  );

  const estaFueraDelProyecto =
    rutaRelativaValidada.startsWith("..") ||
    path.isAbsolute(rutaRelativaValidada);

  if (estaFueraDelProyecto) {
    return null;
  }

  return rutaAbsoluta;
}

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const resultadoAutenticacion =
      await obtenerUsuarioSesionDesdeCookie();

    if (
      !resultadoAutenticacion.body.ok ||
      !resultadoAutenticacion.body.data
    ) {
      return Response.json(resultadoAutenticacion.body, {
        status: resultadoAutenticacion.status,
      });
    }

    const { id } = await context.params;

    const resultadoSolicitud =
      await obtenerSolicitudPagoPorIdService(
        resultadoAutenticacion.body.data.usuario,
        id,
      );

    if (
      resultadoSolicitud.status !== 200 ||
      !resultadoSolicitud.body.ok ||
      !resultadoSolicitud.body.data
    ) {
      return Response.json(resultadoSolicitud.body, {
        status: resultadoSolicitud.status,
      });
    }

    const solicitud =
      resultadoSolicitud.body.data
        .solicitud as SolicitudConArchivoOrigen;

    const archivoOrigen = solicitud.archivo_origen;

    if (!archivoOrigen) {
      return Response.json(
        {
          ok: false,
          message:
            "La solicitud no tiene un archivo de origen asociado.",
        },
        {
          status: 404,
        },
      );
    }

    const rutaAbsoluta = resolverRutaArchivo(
      archivoOrigen.ruta_archivo,
    );

    if (!rutaAbsoluta) {
      return Response.json(
        {
          ok: false,
          message:
            "La ruta registrada para el archivo no es válida.",
        },
        {
          status: 500,
        },
      );
    }

    let contenido: Buffer;

    try {
      contenido = await readFile(rutaAbsoluta);
    } catch (error) {
      console.error(
        "No fue posible leer el archivo de nómina grupal:",
        error,
      );

      return Response.json(
        {
          ok: false,
          message:
            "El archivo asociado no está disponible en el almacenamiento.",
        },
        {
          status: 404,
        },
      );
    }

    const nombreArchivo = normalizarNombreDescarga(
      archivoOrigen.nombre_archivo,
    );

    return new Response(new Uint8Array(contenido), {
      status: 200,
      headers: {
        "Content-Type":
          archivoOrigen.tipo_mime ||
          "application/octet-stream",
        "Content-Disposition":
          construirContentDisposition(nombreArchivo),
        "Content-Length": String(contenido.byteLength),
        "Cache-Control":
          "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error(
      "Error descargando archivo de solicitud de pago:",
      error,
    );

    return Response.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "No fue posible descargar el archivo.",
      },
      {
        status: 500,
      },
    );
  }
}