import { 
  listarUsuariosConRoles, 
  buscarUsuarioPorCorreo, 
  crearUsuarioEnBD, 
  buscarUsuarioPorIdConRoles,
  buscarUsuarioPorCorreoDiferenteId,
  actualizarUsuarioEnBD,
  actualizarEstadoUsuarioEnBD
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

function convertirUsuarioListado(
  usuario: Awaited<ReturnType<typeof listarUsuariosConRoles>>[number]
): UsuarioListado {
  return {
    id: usuario.id,
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

  const { nombre, correo, telefono, password, estado } = input;

  if (!nombre || !correo || !password) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "Nombre, correo y contraseña son obligatorios.",
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

  const usuarioExistente = await buscarUsuarioPorCorreo(correo);

  if (usuarioExistente) {
    return {
      status: 409,
      body: {
        ok: false,
        message: "Ya existe un usuario con ese correo.",
      },
    };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const usuarioCreado = await crearUsuarioEnBD({
    nombre,
    correo,
    telefono,
    password_hash: passwordHash,
    estado: estadoUsuario,
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
  input: ActualizarUsuarioInput
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

  const { nombre, correo, telefono } = input;

  if (!nombre && !correo && telefono === undefined) {
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

  const usuarioActualizado = await actualizarUsuarioEnBD(id, {
    nombre,
    correo,
    telefono,
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