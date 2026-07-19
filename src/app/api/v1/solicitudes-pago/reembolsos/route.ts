import path from "node:path";
import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import { crearAdjuntosSolicitudPagoService } from "@/modules/adjuntos/adjuntos.service";
import { eliminarSolicitudReembolsoRepository } from "@/modules/solicitudes-pago/reembolsos/reembolsos.repository";
import { crearSolicitudReembolsoService } from "@/modules/solicitudes-pago/solicitudes-pago.service";
import type { CrearSolicitudReembolsoInput } from "@/modules/solicitudes-pago/solicitudes-pago.types";
import { storageService } from "@/modules/storage/storage.service";
import type { ArchivoGuardado } from "@/modules/storage/storage.types";
import { cookies } from "next/headers";

export const runtime = "nodejs";

const MAX_ARCHIVOS = 10;
const MAX_TAMANO_ARCHIVO_BYTES = 10 * 1024 * 1024;

const TIPOS_MIME_PERMITIDOS = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

const EXTENSIONES_PERMITIDAS = new Set([
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
]);

type RouteError = {
  status: number;
  message: string;
};

async function obtenerUsuarioSesionDesdeCookie() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  return obtenerUsuarioAutenticado(sessionToken);
}

function obtenerTextoFormulario(
  formData: FormData,
  campo: string,
): string {
  const valor = formData.get(campo);

  return typeof valor === "string" ? valor.trim() : "";
}

function obtenerNumeroFormulario(
  formData: FormData,
  campo: string,
): number | undefined {
  const valor = obtenerTextoFormulario(formData, campo);

  if (!valor) {
    return undefined;
  }

  const numero = Number(valor.replaceAll(",", ""));

  return Number.isFinite(numero) ? numero : Number.NaN;
}

function obtenerArchivos(formData: FormData): File[] {
  return formData
    .getAll("archivos")
    .filter((valor): valor is File => valor instanceof File);
}

function validarArchivos(archivos: File[]): RouteError | null {
  if (archivos.length === 0) {
    return {
      status: 400,
      message:
        "Debe adjuntar al menos un soporte para crear el reembolso.",
    };
  }

  if (archivos.length > MAX_ARCHIVOS) {
    return {
      status: 400,
      message: `Solo se permiten máximo ${MAX_ARCHIVOS} archivos por reembolso.`,
    };
  }

  for (const archivo of archivos) {
    if (archivo.size <= 0) {
      return {
        status: 400,
        message: `El archivo "${archivo.name}" está vacío.`,
      };
    }

    if (archivo.size > MAX_TAMANO_ARCHIVO_BYTES) {
      return {
        status: 400,
        message: `El archivo "${archivo.name}" supera el tamaño máximo de 10 MB.`,
      };
    }

    const extension = path.extname(archivo.name).toLowerCase();

    if (!EXTENSIONES_PERMITIDAS.has(extension)) {
      return {
        status: 400,
        message:
          `El archivo "${archivo.name}" debe ser PDF, JPG, JPEG o PNG.`,
      };
    }

    if (
      archivo.type &&
      !TIPOS_MIME_PERMITIDOS.has(archivo.type)
    ) {
      return {
        status: 400,
        message:
          `El tipo MIME del archivo "${archivo.name}" no está permitido.`,
      };
    }
  }

  return null;
}

function construirInput(formData: FormData): CrearSolicitudReembolsoInput {
  return {
    tipo_solicitud: "REEMBOLSO",
    proyecto_base_id: obtenerTextoFormulario(
      formData,
      "proyecto_base_id",
    ),
    centro_costo_id: obtenerTextoFormulario(
      formData,
      "centro_costo_id",
    ),
    beneficiario_id: obtenerTextoFormulario(
      formData,
      "beneficiario_id",
    ),
    categoria_reembolso: obtenerTextoFormulario(
      formData,
      "categoria_reembolso",
    ) as CrearSolicitudReembolsoInput["categoria_reembolso"],
    medio_pago: obtenerTextoFormulario(
      formData,
      "medio_pago",
    ) as CrearSolicitudReembolsoInput["medio_pago"],
    descripcion: obtenerTextoFormulario(
      formData,
      "descripcion",
    ),
    valor_bruto: obtenerNumeroFormulario(
      formData,
      "valor_bruto",
    ),
    valor_impuestos: obtenerNumeroFormulario(
      formData,
      "valor_impuestos",
    ),
    valor_retenciones: obtenerNumeroFormulario(
      formData,
      "valor_retenciones",
    ),
    valor_descuentos: obtenerNumeroFormulario(
      formData,
      "valor_descuentos",
    ),
  };
}

async function eliminarArchivosGuardados(
  archivos: ArchivoGuardado[],
) {
  await Promise.allSettled(
    archivos.map((archivo) =>
      storageService.eliminarArchivo(
        archivo.ruta_archivo,
      ),
    ),
  );
}

export async function POST(request: Request) {
  const archivosGuardados: ArchivoGuardado[] = [];
  let solicitudCreadaId: string | null = null;

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

    let formData: FormData;

    try {
      formData = await request.formData();
    } catch {
      return Response.json(
        {
          ok: false,
          message:
            "La solicitud debe enviarse como multipart/form-data.",
        },
        {
          status: 400,
        },
      );
    }

    const archivos = obtenerArchivos(formData);
    const errorArchivos = validarArchivos(archivos);

    if (errorArchivos) {
      return Response.json(
        {
          ok: false,
          message: errorArchivos.message,
        },
        {
          status: errorArchivos.status,
        },
      );
    }

    const usuario =
      resultadoAutenticacion.body.data.usuario;

    const resultado = await crearSolicitudReembolsoService(
      usuario,
      construirInput(formData),
    );

    if (
      !resultado.body.ok ||
      !resultado.body.data?.solicitud
    ) {
      return Response.json(resultado.body, {
        status: resultado.status,
      });
    }

    solicitudCreadaId =
      resultado.body.data.solicitud.id;

    solicitudCreadaId =
      resultado.body.data.solicitud.id;

    const resultadoAdjuntos =
      await crearAdjuntosSolicitudPagoService({
        solicitudPagoId: solicitudCreadaId,
        archivos,
        subidoPor: usuario.id,
        carpeta: "reembolsos",
      });

    archivosGuardados.push(
      ...resultadoAdjuntos.archivos,
    );

    return Response.json(
      {
        ...resultado.body,
        data: {
          ...resultado.body.data,
          soportes: archivosGuardados.map((archivo) => ({
            nombre_archivo: archivo.nombre_archivo,
            ruta_archivo: archivo.ruta_archivo,
            tipo_mime: archivo.tipo_mime,
            tamano_archivo: Number(
              archivo.tamano_archivo,
            ),
          })),
        },
      },
      {
        status: resultado.status,
      },
    );
    
    return Response.json(
      {
        ...resultado.body,
        data: {
          ...resultado.body.data,
          soportes: archivosGuardados.map((archivo) => ({
            nombre_archivo: archivo.nombre_archivo,
            ruta_archivo: archivo.ruta_archivo,
            tipo_mime: archivo.tipo_mime,
            tamano_archivo: Number(
              archivo.tamano_archivo,
            ),
          })),
        },
      },
      {
        status: resultado.status,
      },
    );
  } catch (error) {
    await eliminarArchivosGuardados(archivosGuardados);

    if (solicitudCreadaId) {
      await eliminarSolicitudReembolsoRepository(
        solicitudCreadaId,
      ).catch(() => undefined);
    }

    console.error(
      "Error creando solicitud de reembolso:",
      error,
    );

    return Response.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "No fue posible crear la solicitud de reembolso.",
      },
      {
        status: 500,
      },
    );
  }
}
