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

  if (
    !input.proyecto_base_id.trim() ||
    !input.entidad_id.trim() ||
    !Number.isFinite(valor) ||
    valor <= 0
  ) {
    return respuestaError(
      400,
      "Proyecto, entidad y valor son obligatorios.",
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
    const fechaOperacion = new Date();
    const anticipo = await registrarAnticipoRepository({
      proyecto_base_id: input.proyecto_base_id.trim(),
      entidad_id: input.entidad_id.trim(),
      valor,
      fecha_anticipo: fechaOperacion,
      observacion: input.observacion?.trim() || null,
      soporte: archivo,
      usuario_id: usuario.id,
      registrado_en: fechaOperacion,
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
