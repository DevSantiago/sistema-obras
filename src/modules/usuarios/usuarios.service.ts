import bcrypt from "bcryptjs";
import type { UsuarioSesion } from "@/modules/auth/auth.types";
import {
  actualizarEstadoUsuarioEnBD,
  actualizarUsuarioEnBD,
  buscarCentrosCostoActivosPorAccesos,
  buscarRolActivoPorNombre,
  buscarUsuarioPorCorreo,
  buscarUsuarioPorCorreoDiferenteId,
  buscarUsuarioPorIdConRoles,
  buscarUsuarioPorNumeroDocumento,
  crearUsuarioEnBD,
  listarUsuariosConRoles,
} from "@/modules/usuarios/usuarios.repository";
import type {
  AccesoUsuarioInput,
  ActualizarUsuarioInput,
  CambiarEstadoUsuarioInput,
  CrearUsuarioInput,
  LineaNegocioAcceso,
  ServiceResponse,
  UsuarioListado,
} from "./usuarios.types";

const LINEAS_NEGOCIO_VALIDAS: LineaNegocioAcceso[] = [
  "OBRA",
  "INTERVENTORIA",
];

type RolActivo = NonNullable<
  Awaited<ReturnType<typeof buscarRolActivoPorNombre>>
>;

type ResultadoNormalizarAccesos =
  | { ok: true; accesos: AccesoUsuarioInput[] }
  | { ok: false; message: string };

function usuarioTienePermiso(usuario: UsuarioSesion, permiso: string) {
  return usuario.permisos?.includes(permiso) ?? false;
}

function usuarioTieneAlgunPermiso(
  usuario: UsuarioSesion,
  permisos: string[],
) {
  return permisos.some((permiso) => usuarioTienePermiso(usuario, permiso));
}

function normalizarRol(rol: string) {
  return rol.trim().toUpperCase();
}

function crearClaveAcceso(acceso: AccesoUsuarioInput) {
  return `${acceso.proyecto_base_id}:${acceso.linea_negocio}`;
}

function normalizarAccesos(accesos: unknown): ResultadoNormalizarAccesos {
  if (!Array.isArray(accesos)) {
    return {
      ok: false,
      message: "Los accesos deben enviarse como una lista.",
    };
  }

  const accesosNormalizados: AccesoUsuarioInput[] = [];
  const claves = new Set<string>();

  for (const acceso of accesos) {
    if (
      !acceso ||
      typeof acceso !== "object" ||
      !("proyecto_base_id" in acceso) ||
      !("linea_negocio" in acceso) ||
      typeof acceso.proyecto_base_id !== "string" ||
      typeof acceso.linea_negocio !== "string"
    ) {
      return {
        ok: false,
        message: "Cada acceso debe indicar proyecto y línea de negocio.",
      };
    }

    const proyectoBaseId = acceso.proyecto_base_id.trim();
    const lineaNegocio = acceso.linea_negocio
      .trim()
      .toUpperCase() as LineaNegocioAcceso;

    if (!proyectoBaseId) {
      return {
        ok: false,
        message: "El proyecto base de cada acceso es obligatorio.",
      };
    }

    if (!LINEAS_NEGOCIO_VALIDAS.includes(lineaNegocio)) {
      return {
        ok: false,
        message: "La línea de negocio del acceso no es válida.",
      };
    }

    const accesoNormalizado = {
      proyecto_base_id: proyectoBaseId,
      linea_negocio: lineaNegocio,
    };

    const clave = crearClaveAcceso(accesoNormalizado);

    if (claves.has(clave)) {
      return {
        ok: false,
        message: "No se pueden repetir accesos al mismo proyecto y línea.",
      };
    }

    claves.add(clave);
    accesosNormalizados.push(accesoNormalizado);
  }

  return {
    ok: true,
    accesos: accesosNormalizados,
  };
}

async function validarAccesosParaRol(
  rol: RolActivo,
  accesos: AccesoUsuarioInput[],
) {
  const lineasPermitidas = new Set(
    rol.lineas_negocio.map((linea) => linea.linea_negocio),
  );

  const accesoNoPermitido = accesos.find(
    (acceso) => !lineasPermitidas.has(acceso.linea_negocio),
  );

  if (accesoNoPermitido) {
    return `El rol ${rol.nombre} no puede acceder a la línea ${accesoNoPermitido.linea_negocio}.`;
  }

  const centrosCosto = await buscarCentrosCostoActivosPorAccesos(accesos);

  const accesosExistentes = new Set(
    centrosCosto.map((centro) =>
      crearClaveAcceso({
        proyecto_base_id: centro.proyecto_base_id,
        linea_negocio: centro.linea_negocio as LineaNegocioAcceso,
      }),
    ),
  );

  const accesoInexistente = accesos.find(
    (acceso) => !accesosExistentes.has(crearClaveAcceso(acceso)),
  );

  if (accesoInexistente) {
    return "Uno o más accesos corresponden a proyectos o líneas inexistentes o inactivos.";
  }

  return null;
}

function convertirUsuarioListado(
  usuario: Awaited<ReturnType<typeof listarUsuariosConRoles>>[number],
): UsuarioListado {
  return {
    id: usuario.id,
    tipo_documento: usuario.tipo_documento,
    numero_documento: usuario.numero_documento,
    nombre: usuario.nombre,
    correo: usuario.correo,
    telefono: usuario.telefono,
    estado: usuario.estado,
    creado_en: usuario.creado_en,
    actualizado_en: usuario.actualizado_en,
    rol: usuario.roles[0]?.rol.nombre ?? "",
    accesos: usuario.accesos_recibidos.map((acceso) => ({
      id: acceso.id,
      proyecto_base_id: acceso.proyecto_base_id,
      proyecto_nombre: acceso.proyecto_base.nombre,
      linea_negocio: acceso.linea_negocio as LineaNegocioAcceso,
      activo: acceso.activo,
      asignado_en: acceso.asignado_en,
    })),
  };
}

export async function listarUsuarios(
  usuarioAutenticado: UsuarioSesion,
): Promise<ServiceResponse<{ usuarios: UsuarioListado[] }>> {
  if (
    !usuarioTieneAlgunPermiso(usuarioAutenticado, [
      "CREAR_USUARIOS",
      "ASIGNAR_ACCESOS",
      "CONSULTAR_TODO",
    ])
  ) {
    return {
      status: 403,
      body: {
        ok: false,
        message: "No tiene permisos para consultar usuarios.",
      },
    };
  }

  const usuarios = await listarUsuariosConRoles();

  return {
    status: 200,
    body: {
      ok: true,
      message: "Usuarios consultados correctamente.",
      data: {
        usuarios: usuarios.map(convertirUsuarioListado),
      },
    },
  };
}

export async function crearUsuario(
  usuarioAutenticado: UsuarioSesion,
  input: CrearUsuarioInput,
): Promise<ServiceResponse<{ usuario: UsuarioListado }>> {
  if (!usuarioTienePermiso(usuarioAutenticado, "CREAR_USUARIOS")) {
    return {
      status: 403,
      body: {
        ok: false,
        message: "No tiene permisos para crear usuarios.",
      },
    };
  }

  const {
    tipo_documento,
    numero_documento,
    nombre,
    correo,
    telefono,
    password,
    estado,
    rol,
  } = input;

  if (!tipo_documento || !numero_documento || !nombre || !correo || !password) {
    return {
      status: 400,
      body: {
        ok: false,
        message:
          "Tipo de documento, número de documento, nombre, correo y contraseña son obligatorios.",
      },
    };
  }

  if (!rol?.trim()) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "Debe asignar un rol al usuario.",
      },
    };
  }

  if (
    input.accesos !== undefined &&
    !usuarioTienePermiso(usuarioAutenticado, "ASIGNAR_ACCESOS")
  ) {
    return {
      status: 403,
      body: {
        ok: false,
        message: "No tiene permisos para asignar accesos.",
      },
    };
  }

  const estadoUsuario = estado ?? "ACTIVO";

  if (!["ACTIVO", "INACTIVO"].includes(estadoUsuario)) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "El estado debe ser ACTIVO o INACTIVO.",
      },
    };
  }

  const resultadoAccesos = normalizarAccesos(input.accesos ?? []);

  if (!resultadoAccesos.ok) {
    return {
      status: 400,
      body: {
        ok: false,
        message: resultadoAccesos.message,
      },
    };
  }

  const correoNormalizado = correo.trim().toLowerCase();
  const documentoNormalizado = numero_documento.trim();
  const nombreRol = normalizarRol(rol);

  const usuarioExistentePorCorreo =
    await buscarUsuarioPorCorreo(correoNormalizado);

  if (usuarioExistentePorCorreo) {
    return {
      status: 409,
      body: {
        ok: false,
        message: "Ya existe un usuario con ese correo.",
      },
    };
  }

  const usuarioExistentePorDocumento =
    await buscarUsuarioPorNumeroDocumento(documentoNormalizado);

  if (usuarioExistentePorDocumento) {
    return {
      status: 409,
      body: {
        ok: false,
        message: "Ya existe un usuario con ese número de documento.",
      },
    };
  }

  const rolEncontrado = await buscarRolActivoPorNombre(nombreRol);

  if (!rolEncontrado) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "El rol enviado no existe o no está activo.",
      },
    };
  }

  const errorAccesos = await validarAccesosParaRol(
    rolEncontrado,
    resultadoAccesos.accesos,
  );

  if (errorAccesos) {
    return {
      status: 400,
      body: {
        ok: false,
        message: errorAccesos,
      },
    };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const usuarioCreado = await crearUsuarioEnBD({
    tipo_documento: tipo_documento.trim().toUpperCase(),
    numero_documento: documentoNormalizado,
    nombre: nombre.trim(),
    correo: correoNormalizado,
    telefono: telefono?.trim() || null,
    password_hash: passwordHash,
    estado: estadoUsuario,
    rol_id: rolEncontrado.id,
    accesos: resultadoAccesos.accesos,
    asignado_por: usuarioAutenticado.id,
  });

  return {
    status: 201,
    body: {
      ok: true,
      message: "Usuario creado correctamente.",
      data: {
        usuario: convertirUsuarioListado(usuarioCreado),
      },
    },
  };
}

export async function obtenerUsuarioPorId(
  usuarioAutenticado: UsuarioSesion,
  id: string,
): Promise<ServiceResponse<{ usuario: UsuarioListado }>> {
  if (
    !usuarioTieneAlgunPermiso(usuarioAutenticado, [
      "CREAR_USUARIOS",
      "ASIGNAR_ACCESOS",
      "CONSULTAR_TODO",
    ])
  ) {
    return {
      status: 403,
      body: {
        ok: false,
        message: "No tiene permisos para consultar usuarios.",
      },
    };
  }

  if (!id) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "El id del usuario es obligatorio.",
      },
    };
  }

  const usuario = await buscarUsuarioPorIdConRoles(id);

  if (!usuario) {
    return {
      status: 404,
      body: {
        ok: false,
        message: "Usuario no encontrado.",
      },
    };
  }

  return {
    status: 200,
    body: {
      ok: true,
      message: "Usuario consultado correctamente.",
      data: {
        usuario: convertirUsuarioListado(usuario),
      },
    },
  };
}

export async function actualizarUsuario(
  usuarioAutenticado: UsuarioSesion,
  id: string,
  input: ActualizarUsuarioInput & {
    tipo_documento?: string;
    numero_documento?: string;
  },
): Promise<ServiceResponse<{ usuario: UsuarioListado }>> {
  if (!usuarioTienePermiso(usuarioAutenticado, "CREAR_USUARIOS")) {
    return {
      status: 403,
      body: {
        ok: false,
        message: "No tiene permisos para editar usuarios.",
      },
    };
  }

  if (
    (input.rol !== undefined || input.accesos !== undefined) &&
    !usuarioTienePermiso(usuarioAutenticado, "ASIGNAR_ACCESOS")
  ) {
    return {
      status: 403,
      body: {
        ok: false,
        message: "No tiene permisos para asignar roles o accesos.",
      },
    };
  }

  if (!id) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "El id del usuario es obligatorio.",
      },
    };
  }

  if (
    input.tipo_documento !== undefined ||
    input.numero_documento !== undefined
  ) {
    return {
      status: 400,
      body: {
        ok: false,
        message:
          "El tipo y número de documento no se pueden modificar desde esta operación.",
      },
    };
  }

  const { nombre, correo, telefono, rol, accesos } = input;

  if (
    nombre === undefined &&
    correo === undefined &&
    telefono === undefined &&
    rol === undefined &&
    accesos === undefined
  ) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "Debe enviar al menos un campo para actualizar.",
      },
    };
  }

  if (nombre !== undefined && !nombre.trim()) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "El nombre no puede estar vacío.",
      },
    };
  }

  if (correo !== undefined && !correo.trim()) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "El correo no puede estar vacío.",
      },
    };
  }

  if (rol !== undefined && !rol.trim()) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "Debe asignar un rol al usuario.",
      },
    };
  }

  const usuarioExistente = await buscarUsuarioPorIdConRoles(id);

  if (!usuarioExistente) {
    return {
      status: 404,
      body: {
        ok: false,
        message: "Usuario no encontrado.",
      },
    };
  }

  const correoNormalizado = correo?.trim().toLowerCase();

  if (correoNormalizado) {
    const usuarioConCorreo = await buscarUsuarioPorCorreoDiferenteId(
      correoNormalizado,
      id,
    );

    if (usuarioConCorreo) {
      return {
        status: 409,
        body: {
          ok: false,
          message: "Ya existe otro usuario con ese correo.",
        },
      };
    }
  }

  let accesosNormalizados: AccesoUsuarioInput[] | undefined;

  if (accesos !== undefined) {
    const resultadoAccesos = normalizarAccesos(accesos);

    if (!resultadoAccesos.ok) {
      return {
        status: 400,
        body: {
          ok: false,
          message: resultadoAccesos.message,
        },
      };
    }

    accesosNormalizados = resultadoAccesos.accesos;
  }

  let rolEncontrado: RolActivo | null = null;

  if (rol !== undefined || accesosNormalizados !== undefined) {
    const nombreRol = rol
      ? normalizarRol(rol)
      : usuarioExistente.roles[0]?.rol.nombre;

    if (!nombreRol) {
      return {
        status: 400,
        body: {
          ok: false,
          message: "El usuario no tiene un rol válido asignado.",
        },
      };
    }

    rolEncontrado = await buscarRolActivoPorNombre(nombreRol);

    if (!rolEncontrado) {
      return {
        status: 400,
        body: {
          ok: false,
          message: "El rol enviado no existe o no está activo.",
        },
      };
    }

    const accesosParaValidar =
      accesosNormalizados ??
      usuarioExistente.accesos_recibidos.map((acceso) => ({
        proyecto_base_id: acceso.proyecto_base_id,
        linea_negocio: acceso.linea_negocio as LineaNegocioAcceso,
      }));

    const errorAccesos = await validarAccesosParaRol(
      rolEncontrado,
      accesosParaValidar,
    );

    if (errorAccesos) {
      return {
        status: 400,
        body: {
          ok: false,
          message: errorAccesos,
        },
      };
    }
  }

  const usuarioActualizado = await actualizarUsuarioEnBD(id, {
    nombre: nombre?.trim(),
    correo: correoNormalizado,
    telefono: telefono === undefined ? undefined : telefono?.trim() || null,
    rol_id: rol === undefined ? undefined : rolEncontrado?.id,
    accesos: accesosNormalizados,
    actualizado_por: usuarioAutenticado.id,
  });

  return {
    status: 200,
    body: {
      ok: true,
      message: "Usuario actualizado correctamente.",
      data: {
        usuario: convertirUsuarioListado(usuarioActualizado),
      },
    },
  };
}

export async function cambiarEstadoUsuario(
  usuarioAutenticado: UsuarioSesion,
  id: string,
  input: CambiarEstadoUsuarioInput,
): Promise<ServiceResponse<{ usuario: UsuarioListado }>> {
  if (!usuarioTienePermiso(usuarioAutenticado, "CREAR_USUARIOS")) {
    return {
      status: 403,
      body: {
        ok: false,
        message: "No tiene permisos para cambiar el estado de usuarios.",
      },
    };
  }

  if (!id) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "El id del usuario es obligatorio.",
      },
    };
  }

  const { estado } = input;

  if (!estado) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "El estado es obligatorio.",
      },
    };
  }

  if (!["ACTIVO", "INACTIVO"].includes(estado)) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "El estado debe ser ACTIVO o INACTIVO.",
      },
    };
  }

  const usuarioExistente = await buscarUsuarioPorIdConRoles(id);

  if (!usuarioExistente) {
    return {
      status: 404,
      body: {
        ok: false,
        message: "Usuario no encontrado.",
      },
    };
  }

  const usuarioActualizado = await actualizarEstadoUsuarioEnBD(id, estado);

  return {
    status: 200,
    body: {
      ok: true,
      message: "Estado del usuario actualizado correctamente.",
      data: {
        usuario: convertirUsuarioListado(usuarioActualizado),
      },
    },
  };
}