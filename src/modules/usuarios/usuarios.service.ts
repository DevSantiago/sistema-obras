import {
  listarUsuariosConRoles,
  buscarUsuarioPorCorreo,
  buscarUsuarioPorNumeroDocumento,
  buscarRolesPorNombres,
  crearUsuarioEnBD,
  buscarUsuarioPorIdConRoles,
  buscarUsuarioPorCorreoDiferenteId,
  actualizarUsuarioEnBD,
  actualizarRolesUsuarioEnBD,
  actualizarEstadoUsuarioEnBD,
} from "@/modules/usuarios/usuarios.repository";
import type { UsuarioSesion } from "@/modules/auth/auth.types";
import type {
  ServiceResponse,
  UsuarioListado,
  CrearUsuarioInput,
  ActualizarUsuarioInput,
  CambiarEstadoUsuarioInput,
} from "./usuarios.types";
import bcrypt from "bcryptjs";

function usuarioTieneRol(usuario: UsuarioSesion, rol: string) {
  return usuario.roles.includes(rol);
}

function normalizarRoles(roles: string[]) {
  return Array.from(
    new Set(
      roles
        .map((rol) => rol.trim())
        .filter((rol) => rol.length > 0)
    )
  );
}

function convertirUsuarioListado(
  usuario: Awaited<ReturnType<typeof listarUsuariosConRoles>>[number]
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
    roles: usuario.roles.map((usuarioRol) => usuarioRol.rol.nombre),
  };
}

export async function listarUsuarios(
  usuarioAutenticado: UsuarioSesion
): Promise<ServiceResponse<{ usuarios: UsuarioListado[] }>> {
  if (!usuarioTieneRol(usuarioAutenticado, "ADMINISTRADOR")) {
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
  input: CrearUsuarioInput
): Promise<ServiceResponse<{ usuario: UsuarioListado }>> {
  if (!usuarioTieneRol(usuarioAutenticado, "ADMINISTRADOR")) {
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
    roles,
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

  if (!roles || !Array.isArray(roles) || roles.length === 0) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "Debe asignar al menos un rol al usuario.",
      },
    };
  }

  const rolesUnicos = normalizarRoles(roles);

  if (rolesUnicos.length === 0) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "Debe asignar al menos un rol al usuario.",
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

  const usuarioExistentePorCorreo = await buscarUsuarioPorCorreo(correo);

  if (usuarioExistentePorCorreo) {
    return {
      status: 409,
      body: {
        ok: false,
        message: "Ya existe un usuario con ese correo.",
      },
    };
  }

  const usuarioExistentePorDocumento = await buscarUsuarioPorNumeroDocumento(
    numero_documento
  );

  if (usuarioExistentePorDocumento) {
    return {
      status: 409,
      body: {
        ok: false,
        message: "Ya existe un usuario con ese número de documento.",
      },
    };
  }

  const rolesEncontrados = await buscarRolesPorNombres(rolesUnicos);

  if (rolesEncontrados.length !== rolesUnicos.length) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "Uno o más roles enviados no existen o no están activos.",
      },
    };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const usuarioCreado = await crearUsuarioEnBD({
    tipo_documento,
    numero_documento,
    nombre,
    correo,
    telefono,
    password_hash: passwordHash,
    estado: estadoUsuario,
    roles_ids: rolesEncontrados.map((rol) => rol.id),
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
  id: string
): Promise<ServiceResponse<{ usuario: UsuarioListado }>> {
  if (!usuarioTieneRol(usuarioAutenticado, "ADMINISTRADOR")) {
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
  }
): Promise<ServiceResponse<{ usuario: UsuarioListado }>> {
  if (!usuarioTieneRol(usuarioAutenticado, "ADMINISTRADOR")) {
    return {
      status: 403,
      body: {
        ok: false,
        message: "No tiene permisos para editar usuarios.",
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

  const { nombre, correo, telefono, roles } = input;

  if (!nombre && !correo && telefono === undefined && roles === undefined) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "Debe enviar al menos un campo para actualizar.",
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

  if (correo) {
    const usuarioConCorreo = await buscarUsuarioPorCorreoDiferenteId(correo, id);

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

  let usuarioActualizado = usuarioExistente;

  if (nombre || correo || telefono !== undefined) {
    usuarioActualizado = await actualizarUsuarioEnBD(id, {
      nombre,
      correo,
      telefono,
    });
  }

  if (roles !== undefined) {
    if (!Array.isArray(roles) || roles.length === 0) {
      return {
        status: 400,
        body: {
          ok: false,
          message: "Debe asignar al menos un rol al usuario.",
        },
      };
    }

    const rolesUnicos = normalizarRoles(roles);

    if (rolesUnicos.length === 0) {
      return {
        status: 400,
        body: {
          ok: false,
          message: "Debe asignar al menos un rol al usuario.",
        },
      };
    }

    const rolesEncontrados = await buscarRolesPorNombres(rolesUnicos);

    if (rolesEncontrados.length !== rolesUnicos.length) {
      return {
        status: 400,
        body: {
          ok: false,
          message: "Uno o más roles enviados no existen o no están activos.",
        },
      };
    }

    usuarioActualizado = await actualizarRolesUsuarioEnBD(
      id,
      rolesEncontrados.map((rol) => rol.id)
    );
  }

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
  input: CambiarEstadoUsuarioInput
): Promise<ServiceResponse<{ usuario: UsuarioListado }>> {
  if (!usuarioTieneRol(usuarioAutenticado, "ADMINISTRADOR")) {
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