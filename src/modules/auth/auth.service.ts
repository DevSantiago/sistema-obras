import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
import {
  buscarUsuarioPorCorreoConRoles,
  buscarUsuarioPorIdConRoles,
} from "@/modules/usuarios/usuarios.repository";
import type { 
  LoginInput, 
  ServiceResponse, 
  UsuarioSesion 
} from "./auth.types";

function obtenerRoles(usuario: Awaited<ReturnType<typeof buscarUsuarioPorCorreoConRoles>>) {
  return usuario?.roles.map((usuarioRol) => usuarioRol.rol.nombre) ?? [];
}

function construirUsuarioSesion(
  usuario: NonNullable<Awaited<ReturnType<typeof buscarUsuarioPorCorreoConRoles>>>
): UsuarioSesion {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    correo: usuario.correo,
    telefono: usuario.telefono,
    estado: usuario.estado,
    roles: obtenerRoles(usuario),
  };
}

function obtenerJwtSecret() {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET no está configurado.");
  }

  return new TextEncoder().encode(jwtSecret);
}

export async function iniciarSesion(
  input: LoginInput
): Promise<ServiceResponse<{ usuario: UsuarioSesion; sessionToken: string }>> {
  const { correo, password } = input;

  if (!correo || !password) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "Correo y contraseña son obligatorios.",
      },
    };
  }

  const usuario = await buscarUsuarioPorCorreoConRoles(correo);

  if (!usuario) {
    return {
      status: 401,
      body: {
        ok: false,
        message: "Credenciales inválidas.",
      },
    };
  }

  if (usuario.estado !== "ACTIVO") {
    return {
      status: 403,
      body: {
        ok: false,
        message: "El usuario se encuentra inactivo.",
      },
    };
  }

  const passwordValida = await bcrypt.compare(
    password,
    usuario.password_hash ?? ""
  );

  if (!passwordValida) {
    return {
      status: 401,
      body: {
        ok: false,
        message: "Credenciales inválidas.",
      },
    };
  }

  const usuarioSesion = construirUsuarioSesion(usuario);
  const secret = obtenerJwtSecret();

  const sessionToken = await new SignJWT({
    usuarioId: usuarioSesion.id,
    correo: usuarioSesion.correo,
    roles: usuarioSesion.roles,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);

  return {
    status: 200,
    body: {
      ok: true,
      message: "Inicio de sesión correcto.",
      data: {
        usuario: usuarioSesion,
        sessionToken,
      },
    },
  };
}

export async function obtenerUsuarioAutenticado(
  sessionToken?: string
): Promise<ServiceResponse<{ usuario: UsuarioSesion }>> {
  if (!sessionToken) {
    return {
      status: 401,
      body: {
        ok: false,
        message: "No hay sesión activa.",
      },
    };
  }

const secret = obtenerJwtSecret();

let payload: Awaited<ReturnType<typeof jwtVerify>>["payload"];

try {
  const resultadoVerificacion = await jwtVerify(sessionToken, secret);
  payload = resultadoVerificacion.payload;
} catch {
  return {
    status: 401,
    body: {
      ok: false,
      message: "Sesión inválida.",
    },
  };
}

const usuarioId = payload.usuarioId;

  if (!usuarioId || typeof usuarioId !== "string") {
    return {
      status: 401,
      body: {
        ok: false,
        message: "Sesión inválida.",
      },
    };
  }

  const usuario = await buscarUsuarioPorIdConRoles(usuarioId);

  if (!usuario) {
    return {
      status: 404,
      body: {
        ok: false,
        message: "Usuario no encontrado.",
      },
    };
  }

  if (usuario.estado !== "ACTIVO") {
    return {
      status: 403,
      body: {
        ok: false,
        message: "El usuario se encuentra inactivo.",
      },
    };
  }

  return {
    status: 200,
    body: {
      ok: true,
      message: "Usuario autenticado.",
      data: {
        usuario: construirUsuarioSesion(usuario),
      },
    },
  };
}