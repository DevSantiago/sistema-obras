import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { iniciarSesion, obtenerUsuarioAutenticado } from "../auth.service";
import {
  buscarUsuarioPorCorreoConRoles,
  buscarUsuarioPorIdConRoles,
} from "@/modules/usuarios/usuarios.repository";

vi.mock("@/modules/usuarios/usuarios.repository", () => ({
  buscarUsuarioPorCorreoConRoles: vi.fn(),
  buscarUsuarioPorIdConRoles: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
  },
}));

const fechaMock = new Date("2026-06-13T10:00:00.000Z");

const permisoCrearUsuariosMock = {
  id: "permiso-crear-usuarios",
  codigo: "CREAR_USUARIOS",
  nombre: "Crear usuarios",
  descripcion: "Permite crear usuarios.",
  activo: true,
  creado_en: fechaMock,
  actualizado_en: fechaMock,
};

const permisoAsignarAccesosMock = {
  id: "permiso-asignar-accesos",
  codigo: "ASIGNAR_ACCESOS",
  nombre: "Asignar accesos",
  descripcion: "Permite asignar accesos.",
  activo: true,
  creado_en: fechaMock,
  actualizado_en: fechaMock,
};

const permisoConsultarTodoMock = {
  id: "permiso-consultar-todo",
  codigo: "CONSULTAR_TODO",
  nombre: "Consultar todo",
  descripcion: "Permite consultar toda la información.",
  activo: true,
  creado_en: fechaMock,
  actualizado_en: fechaMock,
};

function crearRolConPermisosMock(
  id: string,
  nombre: string,
  permisos = [
    permisoCrearUsuariosMock,
    permisoAsignarAccesosMock,
    permisoConsultarTodoMock,
  ],
) {
  return {
    id,
    nombre,
    descripcion: `Rol ${nombre}`,
    activo: true,
    creado_en: fechaMock,
    actualizado_en: fechaMock,
    permisos: permisos.map((permiso, index) => ({
      id: `rol-permiso-${id}-${index}`,
      rol_id: id,
      permiso_id: permiso.id,
      creado_en: fechaMock,
      permiso,
    })),
  };
}

function crearUsuarioRolMock(nombreRol = "ADMINISTRADOR") {
  const rol = crearRolConPermisosMock("rol-1", nombreRol);

  return {
    id: "usuario-rol-1",
    usuario_id: "usuario-1",
    rol_id: rol.id,
    creado_en: fechaMock,
    rol,
  };
}

function crearUsuarioMock(overrides = {}) {
  return {
    id: "usuario-1",
    nombre: "Usuario Activo",
    correo: "activo@test.com",
    telefono: null,
    password_hash: "hash-secreto",
    estado: "ACTIVO",
    creado_en: fechaMock,
    actualizado_en: fechaMock,
    roles: [crearUsuarioRolMock()],
    ...overrides,
  };
}

async function crearSessionTokenValido(usuarioId: string) {
  const secret = new TextEncoder().encode("secret-de-pruebas");

  return new SignJWT({
    usuarioId,
    correo: "activo@test.com",
    roles: ["ADMINISTRADOR"],
    permisos: ["CREAR_USUARIOS", "ASIGNAR_ACCESOS", "CONSULTAR_TODO"],
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);
}

describe("auth.service - iniciarSesion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = "secret-de-pruebas";
  });

  it("debe devolver 400 si faltan correo o contraseña", async () => {
    const resultado = await iniciarSesion({
      correo: "admin@test.com",
    });

    expect(resultado.status).toBe(400);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe(
      "Correo y contraseña son obligatorios.",
    );

    expect(buscarUsuarioPorCorreoConRoles).not.toHaveBeenCalled();
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  it("debe devolver 401 si el usuario no existe", async () => {
    vi.mocked(buscarUsuarioPorCorreoConRoles).mockResolvedValue(null);

    const resultado = await iniciarSesion({
      correo: "noexiste@test.com",
      password: "Password123*",
    });

    expect(resultado.status).toBe(401);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe("Credenciales inválidas.");

    expect(buscarUsuarioPorCorreoConRoles).toHaveBeenCalledWith(
      "noexiste@test.com",
    );
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  it("debe devolver 403 si el usuario está INACTIVO", async () => {
    vi.mocked(buscarUsuarioPorCorreoConRoles).mockResolvedValue(
      crearUsuarioMock({
        nombre: "Usuario Inactivo",
        correo: "inactivo@test.com",
        estado: "INACTIVO",
        roles: [crearUsuarioRolMock("DIRECTOR")],
      }) as never,
    );

    const resultado = await iniciarSesion({
      correo: "inactivo@test.com",
      password: "Password123*",
    });

    expect(resultado.status).toBe(403);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe("El usuario se encuentra inactivo.");

    expect(buscarUsuarioPorCorreoConRoles).toHaveBeenCalledWith(
      "inactivo@test.com",
    );
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  it("debe devolver 401 si la contraseña es incorrecta", async () => {
    vi.mocked(buscarUsuarioPorCorreoConRoles).mockResolvedValue(
      crearUsuarioMock() as never,
    );

    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    const resultado = await iniciarSesion({
      correo: "activo@test.com",
      password: "PasswordIncorrecto123*",
    });

    expect(resultado.status).toBe(401);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe("Credenciales inválidas.");

    expect(buscarUsuarioPorCorreoConRoles).toHaveBeenCalledWith(
      "activo@test.com",
    );
    expect(bcrypt.compare).toHaveBeenCalledWith(
      "PasswordIncorrecto123*",
      "hash-secreto",
    );
  });

  it("debe devolver 200 si inicia sesión correctamente", async () => {
    vi.mocked(buscarUsuarioPorCorreoConRoles).mockResolvedValue(
      crearUsuarioMock() as never,
    );

    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const resultado = await iniciarSesion({
      correo: "activo@test.com",
      password: "Password123*",
    });

    expect(resultado.status).toBe(200);
    expect(resultado.body.ok).toBe(true);
    expect(resultado.body.message).toBe("Inicio de sesión correcto.");

    expect(resultado.body.data?.usuario.id).toBe("usuario-1");
    expect(resultado.body.data?.usuario.correo).toBe("activo@test.com");
    expect(resultado.body.data?.usuario.roles).toEqual(["ADMINISTRADOR"]);
    expect(resultado.body.data?.usuario.permisos).toEqual([
      "CREAR_USUARIOS",
      "ASIGNAR_ACCESOS",
      "CONSULTAR_TODO",
    ]);

    expect(resultado.body.data?.sessionToken).toBeDefined();
    expect(typeof resultado.body.data?.sessionToken).toBe("string");

    expect(buscarUsuarioPorCorreoConRoles).toHaveBeenCalledWith(
      "activo@test.com",
    );
    expect(bcrypt.compare).toHaveBeenCalledWith(
      "Password123*",
      "hash-secreto",
    );
  });
});

describe("auth.service - obtenerUsuarioAutenticado", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = "secret-de-pruebas";
  });

  it("debe devolver 401 si no hay sessionToken", async () => {
    const resultado = await obtenerUsuarioAutenticado();

    expect(resultado.status).toBe(401);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe("No hay sesión activa.");

    expect(buscarUsuarioPorIdConRoles).not.toHaveBeenCalled();
  });

  it("debe devolver 404 si el usuario del token no existe", async () => {
    const sessionToken = await crearSessionTokenValido("usuario-no-existe");

    vi.mocked(buscarUsuarioPorIdConRoles).mockResolvedValue(null);

    const resultado = await obtenerUsuarioAutenticado(sessionToken);

    expect(resultado.status).toBe(404);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe("Usuario no encontrado.");

    expect(buscarUsuarioPorIdConRoles).toHaveBeenCalledWith(
      "usuario-no-existe",
    );
  });

  it("debe devolver 403 si el usuario autenticado está INACTIVO", async () => {
    const sessionToken = await crearSessionTokenValido("usuario-1");

    vi.mocked(buscarUsuarioPorIdConRoles).mockResolvedValue(
      crearUsuarioMock({
        nombre: "Usuario Inactivo",
        correo: "inactivo@test.com",
        estado: "INACTIVO",
        roles: [],
      }) as never,
    );

    const resultado = await obtenerUsuarioAutenticado(sessionToken);

    expect(resultado.status).toBe(403);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe("El usuario se encuentra inactivo.");

    expect(buscarUsuarioPorIdConRoles).toHaveBeenCalledWith("usuario-1");
  });

  it("debe devolver 200 si el token es válido y el usuario está ACTIVO", async () => {
    const sessionToken = await crearSessionTokenValido("usuario-1");

    vi.mocked(buscarUsuarioPorIdConRoles).mockResolvedValue(
      crearUsuarioMock() as never,
    );

    const resultado = await obtenerUsuarioAutenticado(sessionToken);

    expect(resultado.status).toBe(200);
    expect(resultado.body.ok).toBe(true);
    expect(resultado.body.message).toBe("Usuario autenticado.");

    expect(resultado.body.data?.usuario.id).toBe("usuario-1");
    expect(resultado.body.data?.usuario.nombre).toBe("Usuario Activo");
    expect(resultado.body.data?.usuario.correo).toBe("activo@test.com");
    expect(resultado.body.data?.usuario.estado).toBe("ACTIVO");
    expect(resultado.body.data?.usuario.roles).toEqual(["ADMINISTRADOR"]);
    expect(resultado.body.data?.usuario.permisos).toEqual([
      "CREAR_USUARIOS",
      "ASIGNAR_ACCESOS",
      "CONSULTAR_TODO",
    ]);

    expect(resultado.body.data?.usuario).not.toHaveProperty("password_hash");

    expect(buscarUsuarioPorIdConRoles).toHaveBeenCalledWith("usuario-1");
  });

  it("debe devolver 401 si el token es inválido", async () => {
    const resultado = await obtenerUsuarioAutenticado("token-invalido");

    expect(resultado.status).toBe(401);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe("Sesión inválida.");

    expect(buscarUsuarioPorIdConRoles).not.toHaveBeenCalled();
  });
});