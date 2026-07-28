import type { UsuarioSesion } from "@/modules/auth/auth.types";
import { storageService } from "@/modules/storage/storage.service";
import {
  RegistrarPrestamoError,
  registrarPrestamoPersonaRepository,
} from "./prestamos.repository";
import type {
  PrestamoPersonaRegistrado,
  RegistrarPrestamoPersonaInput,
} from "./prestamos.types";

const TIPOS_SOPORTE = [
  "application/pdf",
  "image/png",
  "image/jpeg",
];

function error(status: number, message: string) {
  return { status, body: { ok: false, message } };
}

export async function registrarPrestamoPersonaService(
  usuario: UsuarioSesion,
  input: RegistrarPrestamoPersonaInput,
): Promise<{
  status: number;
  body: {
    ok: boolean;
    message: string;
    data?: PrestamoPersonaRegistrado;
  };
}> {
  if (
    !usuario.roles.some((rol) =>
      ["ADMINISTRADOR", "AUXILIAR_CONTABLE"].includes(rol),
    ) ||
    !usuario.permisos.includes("REGISTRAR_PRESTAMOS")
  ) {
    return error(403, "No tiene permisos para registrar préstamos.");
  }

  const fechaActual = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const valor = Number(input.valor);
  const fecha = new Date(`${input.fecha_prestamo}T12:00:00.000Z`);

  if (
    !input.proyecto_base_id.trim() ||
    !input.acreedor_id.trim() ||
    !Number.isFinite(valor) ||
    valor <= 0 ||
    Number.isNaN(fecha.getTime())
  ) {
    return error(
      400,
      "Proyecto, acreedor, fecha y valor son obligatorios.",
    );
  }

  if (input.fecha_prestamo > fechaActual) {
    return error(
      400,
      "La fecha del préstamo no puede ser posterior al día actual.",
    );
  }

  if (
    input.soporte.size <= 0 ||
    input.soporte.size > 10 * 1024 * 1024 ||
    (input.soporte.type &&
      !TIPOS_SOPORTE.includes(input.soporte.type))
  ) {
    return error(
      400,
      "El soporte debe ser PDF, PNG, JPG o JPEG y pesar máximo 10 MB.",
    );
  }

  const archivo = await storageService.guardarArchivo({
    contenido: Buffer.from(await input.soporte.arrayBuffer()),
    nombre_original: input.soporte.name,
    tipo_mime: input.soporte.type || null,
    carpeta: "prestamos/soportes",
  });

  try {
    const prestamo = await registrarPrestamoPersonaRepository({
      proyecto_base_id: input.proyecto_base_id.trim(),
      acreedor_id: input.acreedor_id.trim(),
      valor,
      fecha_prestamo: fecha,
      observacion: input.observacion?.trim() || null,
      soporte: archivo,
      usuario_id: usuario.id,
      registrado_en: new Date(),
    });

    return {
      status: 201,
      body: {
        ok: true,
        message: "Préstamo registrado correctamente.",
        data: prestamo,
      },
    };
  } catch (causa) {
    await storageService.eliminarArchivo(archivo.ruta_archivo);

    if (causa instanceof RegistrarPrestamoError) {
      return error(409, causa.message);
    }

    throw causa;
  }
}
