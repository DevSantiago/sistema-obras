import type { UsuarioSesion } from "@/modules/auth/auth.types";
import { MovimientoFondoError } from "@/modules/fondos/movimientos-fondo.repository";
import { storageService } from "@/modules/storage/storage.service";
import {
  consultarPrestamosPendientesRepository,
  RegistrarPrestamoError,
  registrarDevolucionPrestamoRepository,
  registrarPrestamoEntreProyectosRepository,
  registrarPrestamoPersonaRepository,
} from "./prestamos.repository";
import type {
  DevolucionPrestamoRegistrada,
  PrestamoEntreProyectosRegistrado,
  PrestamoPendiente,
  PrestamoPersonaRegistrado,
  RegistrarDevolucionPrestamoInput,
  RegistrarPrestamoEntreProyectosInput,
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

function puedeRegistrarPrestamos(usuario: UsuarioSesion) {
  return (
    usuario.roles.some((rol) =>
      ["ADMINISTRADOR", "AUXILIAR_CONTABLE"].includes(rol),
    ) && usuario.permisos.includes("REGISTRAR_PRESTAMOS")
  );
}

export async function consultarPrestamosPendientesService(
  usuario: UsuarioSesion,
): Promise<{
  status: number;
  body: {
    ok: boolean;
    message: string;
    data?: PrestamoPendiente[];
  };
}> {
  if (!puedeRegistrarPrestamos(usuario)) {
    return error(403, "No tiene permisos para consultar préstamos.");
  }

  const prestamos = await consultarPrestamosPendientesRepository();

  return {
    status: 200,
    body: {
      ok: true,
      message: "Préstamos pendientes consultados correctamente.",
      data: prestamos,
    },
  };
}

export async function registrarDevolucionPrestamoService(
  usuario: UsuarioSesion,
  input: RegistrarDevolucionPrestamoInput,
): Promise<{
  status: number;
  body: {
    ok: boolean;
    message: string;
    data?: DevolucionPrestamoRegistrada;
  };
}> {
  if (!puedeRegistrarPrestamos(usuario)) {
    return error(403, "No tiene permisos para registrar devoluciones.");
  }

  const valor = Number(input.valor);

  if (
    !input.prestamo_proyecto_id.trim() ||
    !Number.isFinite(valor) ||
    valor <= 0
  ) {
    return error(400, "Préstamo y valor son obligatorios.");
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
    carpeta: "prestamos/devoluciones",
  });

  try {
    const devolucion = await registrarDevolucionPrestamoRepository({
      prestamo_proyecto_id: input.prestamo_proyecto_id.trim(),
      valor,
      observacion: input.observacion?.trim() || null,
      soporte: archivo,
      usuario_id: usuario.id,
      fecha_operacion: new Date(),
    });

    return {
      status: 201,
      body: {
        ok: true,
        message: "Devolución registrada correctamente.",
        data: devolucion,
      },
    };
  } catch (causa) {
    await storageService.eliminarArchivo(archivo.ruta_archivo);

    if (
      causa instanceof RegistrarPrestamoError ||
      causa instanceof MovimientoFondoError
    ) {
      return error(409, causa.message);
    }

    throw causa;
  }
}

export async function registrarPrestamoEntreProyectosService(
  usuario: UsuarioSesion,
  input: RegistrarPrestamoEntreProyectosInput,
): Promise<{
  status: number;
  body: {
    ok: boolean;
    message: string;
    data?: PrestamoEntreProyectosRegistrado;
  };
}> {
  if (!puedeRegistrarPrestamos(usuario)) {
    return error(403, "No tiene permisos para registrar préstamos.");
  }

  const valor = Number(input.valor);

  if (
    !input.proyecto_origen_id.trim() ||
    !input.proyecto_destino_id.trim() ||
    !Number.isFinite(valor) ||
    valor <= 0
  ) {
    return error(
      400,
      "Proyecto origen, proyecto destino y valor son obligatorios.",
    );
  }

  if (
    input.proyecto_origen_id.trim() ===
    input.proyecto_destino_id.trim()
  ) {
    return error(
      400,
      "El proyecto origen y el proyecto destino deben ser diferentes.",
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
    const prestamo =
      await registrarPrestamoEntreProyectosRepository({
        proyecto_origen_id: input.proyecto_origen_id.trim(),
        proyecto_destino_id: input.proyecto_destino_id.trim(),
        valor,
        observacion: input.observacion?.trim() || null,
        soporte: archivo,
        usuario_id: usuario.id,
        fecha_operacion: new Date(),
      });

    return {
      status: 201,
      body: {
        ok: true,
        message: "Préstamo entre proyectos registrado correctamente.",
        data: prestamo,
      },
    };
  } catch (causa) {
    await storageService.eliminarArchivo(archivo.ruta_archivo);

    if (
      causa instanceof RegistrarPrestamoError ||
      causa instanceof MovimientoFondoError
    ) {
      return error(409, causa.message);
    }

    throw causa;
  }
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
  if (!puedeRegistrarPrestamos(usuario)) {
    return error(403, "No tiene permisos para registrar préstamos.");
  }

  const valor = Number(input.valor);

  if (
    !input.proyecto_base_id.trim() ||
    !input.acreedor_id.trim() ||
    !Number.isFinite(valor) ||
    valor <= 0
  ) {
    return error(
      400,
      "Proyecto, acreedor y valor son obligatorios.",
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
    const fechaOperacion = new Date();
    const prestamo = await registrarPrestamoPersonaRepository({
      proyecto_base_id: input.proyecto_base_id.trim(),
      acreedor_id: input.acreedor_id.trim(),
      valor,
      fecha_prestamo: fechaOperacion,
      observacion: input.observacion?.trim() || null,
      soporte: archivo,
      usuario_id: usuario.id,
      registrado_en: fechaOperacion,
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
