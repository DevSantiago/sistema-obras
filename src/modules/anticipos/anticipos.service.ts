import type { UsuarioSesion } from "@/modules/auth/auth.types";
import { storageService } from "@/modules/storage/storage.service";
import {
  RegistrarAnticipoError,
  registrarAnticipoRepository,
} from "./anticipos.repository";
import type {
  AnticipoRegistrado,
  RegistrarAnticipoInput,
} from "./anticipos.types";

const TIPOS_SOPORTE_PERMITIDOS = [
  "application/pdf",
  "image/png",
  "image/jpeg",
];

function respuestaError(status: number, message: string) {
  return {
    status,
    body: {
      ok: false,
      message,
    },
  };
}

export async function registrarAnticipoService(
  usuario: UsuarioSesion,
  input: RegistrarAnticipoInput,
): Promise<{
  status: number;
  body: {
    ok: boolean;
    message: string;
    data?: AnticipoRegistrado;
  };
}> {
  if (
    !usuario.roles.some((rol) =>
      ["ADMINISTRADOR", "AUXILIAR_CONTABLE"].includes(rol),
    ) ||
    !usuario.permisos.includes("REGISTRAR_ANTICIPOS")
  ) {
    return respuestaError(
      403,
      "No tiene permisos para registrar anticipos.",
    );
  }

  const valor = Number(input.valor);
  const fecha = new Date(`${input.fecha_anticipo}T12:00:00.000Z`);
  const fechaActualBogota = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  if (
    !input.proyecto_base_id.trim() ||
    !input.entidad_nombre.trim() ||
    !input.entidad_tipo_documento.trim() ||
    !input.entidad_numero_documento.trim() ||
    !Number.isFinite(valor) ||
    valor <= 0 ||
    Number.isNaN(fecha.getTime())
  ) {
    return respuestaError(
      400,
      "Proyecto, entidad, identificación, fecha y valor son obligatorios.",
    );
  }

  if (input.fecha_anticipo > fechaActualBogota) {
    return respuestaError(
      400,
      "La fecha del anticipo no puede ser posterior al día actual.",
    );
  }

  if (
    input.soporte.size <= 0 ||
    input.soporte.size > 10 * 1024 * 1024 ||
    (input.soporte.type &&
      !TIPOS_SOPORTE_PERMITIDOS.includes(input.soporte.type))
  ) {
    return respuestaError(
      400,
      "El soporte debe ser PDF, PNG, JPG o JPEG y pesar máximo 10 MB.",
    );
  }

  const archivo = await storageService.guardarArchivo({
    contenido: Buffer.from(await input.soporte.arrayBuffer()),
    nombre_original: input.soporte.name,
    tipo_mime: input.soporte.type || null,
    carpeta: "anticipos/soportes",
  });

  try {
    const anticipo = await registrarAnticipoRepository({
      proyecto_base_id: input.proyecto_base_id.trim(),
      entidad_nombre: input.entidad_nombre.trim(),
      entidad_tipo_documento:
        input.entidad_tipo_documento.trim().toUpperCase(),
      entidad_numero_documento:
        input.entidad_numero_documento.trim(),
      valor,
      fecha_anticipo: fecha,
      observacion: input.observacion?.trim() || null,
      soporte: archivo,
      usuario_id: usuario.id,
      registrado_en: new Date(),
    });

    return {
      status: 201,
      body: {
        ok: true,
        message: "Anticipo registrado correctamente.",
        data: anticipo,
      },
    };
  } catch (error) {
    await storageService.eliminarArchivo(archivo.ruta_archivo);

    if (error instanceof RegistrarAnticipoError) {
      return respuestaError(409, error.message);
    }

    throw error;
  }
}
