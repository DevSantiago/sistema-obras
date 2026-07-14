import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import { leerExcelNominaGrupal } from "@/modules/solicitudes-pago/nomina-grupal/nomina-grupal.excel";
import {
  crearAdjuntoNominaGrupalRepository,
  eliminarAdjuntoNominaGrupalRepository,
} from "@/modules/solicitudes-pago/nomina-grupal/nomina-grupal.repository";
import {
  crearNominaGrupalService,
  validarNominaGrupalService,
} from "@/modules/solicitudes-pago/nomina-grupal/nomina-grupal.service";
import type {
  CrearNominaGrupalInput,
  FilaNominaGrupalNormalizada,
} from "@/modules/solicitudes-pago/nomina-grupal/nomina-grupal.types";
import { cookies } from "next/headers";

export const runtime = "nodejs";

const MAX_TAMANO_ARCHIVO_BYTES = 10 * 1024 * 1024;

const TIPOS_MIME_PERMITIDOS = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel.sheet.macroEnabled.12",
  "application/octet-stream",
]);

type AccionNominaGrupal = "VALIDAR" | "CREAR";

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

function normalizarAccion(
  valor: string,
): AccionNominaGrupal | null {
  const accion = valor.trim().toUpperCase();

  if (accion === "VALIDAR" || accion === "CREAR") {
    return accion;
  }

  return null;
}

function nombreArchivoSeguro(nombreArchivo: string): string {
  const extension = path.extname(nombreArchivo).toLowerCase();

  const nombreBase = path
    .basename(nombreArchivo, extension)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 100);

  return `${nombreBase || "nomina_grupal"}${extension}`;
}

function validarArchivoExcel(archivo: File): string | null {
  if (archivo.size <= 0) {
    return "El archivo Excel está vacío.";
  }

  if (archivo.size > MAX_TAMANO_ARCHIVO_BYTES) {
    return "El archivo Excel supera el tamaño máximo permitido de 10 MB.";
  }

  const extension = path.extname(archivo.name).toLowerCase();

  if (extension !== ".xlsx" && extension !== ".xlsm") {
    return "El archivo debe tener extensión .xlsx o .xlsm.";
  }

  if (
    archivo.type &&
    !TIPOS_MIME_PERMITIDOS.has(archivo.type)
  ) {
    return "El tipo MIME del archivo Excel no está permitido.";
  }

  return null;
}

function parsearFilas(
  valor: string,
): FilaNominaGrupalNormalizada[] | null {
  if (!valor) {
    return null;
  }

  try {
    const json: unknown = JSON.parse(valor);

    if (!Array.isArray(json)) {
      return null;
    }

    return json as FilaNominaGrupalNormalizada[];
  } catch {
    return null;
  }
}

function construirInputBase(
  formData: FormData,
  filas: FilaNominaGrupalNormalizada[],
  adjuntoArchivoOrigenId: string,
): CrearNominaGrupalInput {
  return {
    tipo_solicitud: "PAGO_NOMINA",
    modalidad_nomina: "AGRUPADA_EXCEL",
    proyecto_base_id: obtenerTextoFormulario(
      formData,
      "proyecto_base_id",
    ),
    centro_costo_id: obtenerTextoFormulario(
      formData,
      "centro_costo_id",
    ),
    periodo_nomina: obtenerTextoFormulario(
      formData,
      "periodo_nomina",
    ),
    descripcion: obtenerTextoFormulario(
      formData,
      "descripcion",
    ),
    adjunto_archivo_origen_id: adjuntoArchivoOrigenId,
    crear_beneficiarios_faltantes:
      obtenerTextoFormulario(
        formData,
        "crear_beneficiarios_faltantes",
      ).toLowerCase() === "true",
    filas,
  };
}

async function guardarArchivoNominaGrupal(input: {
  archivo: File;
  usuarioId: string;
}) {
  const contenido = Buffer.from(
    await input.archivo.arrayBuffer(),
  );

  const idAdjunto = randomUUID();
  const nombreSeguro = nombreArchivoSeguro(
    input.archivo.name,
  );
  const nombreFisico = `${idAdjunto}-${nombreSeguro}`;

  const directorioRelativo =
    process.env.NOMINA_GRUPAL_STORAGE_DIR?.trim() ||
    "storage/nomina-grupal";

  const directorioAbsoluto = path.resolve(
    process.cwd(),
    directorioRelativo,
  );

  await mkdir(directorioAbsoluto, {
    recursive: true,
  });

  const rutaAbsoluta = path.join(
    directorioAbsoluto,
    nombreFisico,
  );

  await writeFile(rutaAbsoluta, contenido);

  try {
    const adjunto =
      await crearAdjuntoNominaGrupalRepository({
        id: idAdjunto,
        solicitud_pago_id: null,
        nombre_archivo: input.archivo.name,
        ruta_archivo: path
          .join(directorioRelativo, nombreFisico)
          .replaceAll(path.sep, "/"),
        nombre_bucket: "LOCAL_NOMINA_GRUPAL",
        tipo_mime: input.archivo.type || null,
        tamano_archivo: BigInt(input.archivo.size),
        subido_por: input.usuarioId,
        estado_ocr: "NO_PROCESADO",
      });

    return {
      adjunto,
      contenido,
      rutaAbsoluta,
    };
  } catch (error) {
    await unlink(rutaAbsoluta).catch(
      () => undefined,
    );

    throw error;
  }
}

async function eliminarAdjuntoTemporal(input: {
  adjuntoId: string;
  rutaAbsoluta: string;
}) {
  await eliminarAdjuntoNominaGrupalRepository(
    input.adjuntoId,
  ).catch(() => undefined);

  await unlink(input.rutaAbsoluta).catch(
    () => undefined,
  );
}

export async function POST(request: Request) {
  try {
    const resultadoAutenticacion =
      await obtenerUsuarioSesionDesdeCookie();

    if (
      !resultadoAutenticacion.body.ok ||
      !resultadoAutenticacion.body.data
    ) {
      return Response.json(
        resultadoAutenticacion.body,
        {
          status: resultadoAutenticacion.status,
        },
      );
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

    const accion = normalizarAccion(
      obtenerTextoFormulario(formData, "accion"),
    );

    if (!accion) {
      return Response.json(
        {
          ok: false,
          message:
            "La acción debe ser VALIDAR o CREAR.",
        },
        {
          status: 400,
        },
      );
    }

    const usuario =
      resultadoAutenticacion.body.data.usuario;

    if (accion === "VALIDAR") {
      const archivo = formData.get("archivo");

      if (!(archivo instanceof File)) {
        return Response.json(
          {
            ok: false,
            message:
              "El archivo Excel es obligatorio.",
          },
          {
            status: 400,
          },
        );
      }

      const errorArchivo =
        validarArchivoExcel(archivo);

      if (errorArchivo) {
        return Response.json(
          {
            ok: false,
            message: errorArchivo,
          },
          {
            status: 400,
          },
        );
      }

      const archivoGuardado =
        await guardarArchivoNominaGrupal({
          archivo,
          usuarioId: usuario.id,
        });

      try {
        const lectura =
          await leerExcelNominaGrupal({
            contenido:
              archivoGuardado.contenido,
            nombre_archivo: archivo.name,
          });

        const input = construirInputBase(
          formData,
          lectura.filas,
          archivoGuardado.adjunto.id,
        );

        const resultado =
          await validarNominaGrupalService(
            usuario,
            input,
          );

        if (!resultado.body.ok) {
          await eliminarAdjuntoTemporal({
            adjuntoId:
              archivoGuardado.adjunto.id,
            rutaAbsoluta:
              archivoGuardado.rutaAbsoluta,
          });

          return Response.json(
            resultado.body,
            {
              status: resultado.status,
            },
          );
        }

        return Response.json(
          {
            ...resultado.body,
            data: {
              ...resultado.body.data,
              adjunto_archivo_origen_id:
                archivoGuardado.adjunto.id,
              nombre_archivo:
                archivoGuardado.adjunto
                  .nombre_archivo,
              nombre_hoja:
                lectura.nombre_hoja,
              filas: lectura.filas,
            },
          },
          {
            status: resultado.status,
          },
        );
      } catch (error) {
        await eliminarAdjuntoTemporal({
          adjuntoId:
            archivoGuardado.adjunto.id,
          rutaAbsoluta:
            archivoGuardado.rutaAbsoluta,
        });

        throw error;
      }
    }

    const adjuntoArchivoOrigenId =
      obtenerTextoFormulario(
        formData,
        "adjunto_archivo_origen_id",
      );

    const filas = parsearFilas(
      obtenerTextoFormulario(
        formData,
        "filas",
      ),
    );

    if (!adjuntoArchivoOrigenId) {
      return Response.json(
        {
          ok: false,
          message:
            "El identificador del archivo validado es obligatorio.",
        },
        {
          status: 400,
        },
      );
    }

    if (!filas || filas.length === 0) {
      return Response.json(
        {
          ok: false,
          message:
            "Las filas validadas de nómina son obligatorias.",
        },
        {
          status: 400,
        },
      );
    }

    const input = construirInputBase(
      formData,
      filas,
      adjuntoArchivoOrigenId,
    );

    const resultado =
      await crearNominaGrupalService(
        usuario,
        input,
      );

    return Response.json(resultado.body, {
      status: resultado.status,
    });
  } catch (error) {
    console.error(
      "Error procesando solicitud de nómina grupal:",
      error,
    );

    return Response.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "No fue posible procesar la solicitud de nómina grupal.",
      },
      {
        status: 500,
      },
    );
  }
}