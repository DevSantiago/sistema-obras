import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  actualizarUsuario,
  cambiarEstadoUsuario,
  crearUsuario,
  listarUsuarios,
  obtenerUsuarioPorId,
} from "../usuarios.service";
import {
  actualizarEstadoUsuarioEnBD,
  actualizarRolesUsuarioEnBD,
  actualizarUsuarioEnBD,
  buscarRolesPorNombres,
  buscarUsuarioPorCorreo,
  buscarUsuarioPorCorreoDiferenteId,
  buscarUsuarioPorIdConRoles,
  buscarUsuarioPorNumeroDocumento,
  crearUsuarioEnBD,
  listarUsuariosConRoles,
} from "@/modules/usuarios/usuarios.repository";
import type { UsuarioSesion } from "@/modules/auth/auth.types";

vi.mock("@/modules/usuarios/usuarios.repository", () => ({
  listarUsuariosConRoles: vi.fn(),
  buscarUsuarioPorCorreo: vi.fn(),
  buscarUsuarioPorNumeroDocumento: vi.fn(),
  buscarRolesPorNombres: vi.fn(),
  crearUsuarioEnBD: vi.fn(),
  buscarUsuarioPorIdConRoles: vi.fn(),
  buscarUsuarioPorCorreoDiferenteId: vi.fn(),
  actualizarUsuarioEnBD: vi.fn(),
  actualizarRolesUsuarioEnBD: vi.fn(),
  actualizarEstadoUsuarioEnBD: vi.fn(),
}));

const fechaMock = new Date("2026-06-13T10:00:00.000Z");

const usuarioAdministrador: UsuarioSesion = {
  id: "admin-1",
  nombre: "Administrador",
  correo: "admin@test.com",
  telefono: null,
  estado: "ACTIVO",
  roles: ["ADMINISTRADOR"],
};

const usuarioLectura: UsuarioSesion = {
  id: "usuario-lectura",
  nombre: "Usuario Lectura",
  correo: "lectura@test.com",
  telefono: null,
  estado: "ACTIVO",
  roles: ["LECTURA"],
};

const rolLecturaMock = {
  id: "rol-1",
  nombre: "LECTURA",
  descripcion: "Rol de lectura",
  activo: true,
  creado_en: fechaMock,
  actualizado_en: fechaMock,
};

const rolSolicitanteMock = {
  id: "rol-2",
  nombre: "SOLICITANTE",
  descripcion: "Rol solicitante",
  activo: true,
  creado_en: fechaMock,
  actualizado_en: fechaMock,
};

const rolPagosMock = {
  id: "rol-3",
  nombre: "PAGOS",
  descripcion: "Rol pagos",
  activo: true,
  creado_en: fechaMock,
  actualizado_en: fechaMock,
};

const usuarioConRolesMock = {
  id: "usuario-1",
  tipo_documento: "CC",
  numero_documento: "1000000000",
  nombre: "Usuario Prueba",
  correo: "usuario@test.com",
  telefono: null,
  password_hash: "hash-secreto",
  estado: "ACTIVO",
  creado_en: fechaMock,
  actualizado_en: fechaMock,
  roles: [
    {
      id: "usuario-rol-1",
      usuario_id: "usuario-1",
      rol_id: "rol-1",
      creado_en: fechaMock,
      rol: rolLecturaMock,
    },
  ],
};

const usuarioConRolesActualizadosMock = {
  ...usuarioConRolesMock,
  roles: [
    {
      id: "usuario-rol-2",
      usuario_id: "usuario-1",
      rol_id: "rol-2",
      creado_en: fechaMock,
      rol: rolSolicitanteMock,
    },
    {
      id: "usuario-rol-3",
      usuario_id: "usuario-1",
      rol_id: "rol-3",
      creado_en: fechaMock,
      rol: rolPagosMock,
    },
  ],
};

const usuarioBaseSinRoles = {
  id: "usuario-1",
  tipo_documento: "CC",
  numero_documento: "1000000000",
  nombre: "Usuario Prueba",
  correo: "usuario@test.com",
  telefono: null,
  password_hash: "hash-secreto",
  estado: "ACTIVO",
  creado_en: fechaMock,
  actualizado_en: fechaMock,
};

describe("usuarios.service - listarUsuarios", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe devolver 403 si el usuario autenticado no es ADMINISTRADOR", async () => {
    const resultado = await listarUsuarios(usuarioLectura);

    expect(resultado.status).toBe(403);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe(
      "No tiene permisos para consultar usuarios."
    );

    expect(listarUsuariosConRoles).not.toHaveBeenCalled();
  });

  it("debe devolver 200 y listar usuarios si el usuario autenticado es ADMINISTRADOR", async () => {
    vi.mocked(listarUsuariosConRoles).mockResolvedValue([usuarioConRolesMock]);

    const resultado = await listarUsuarios(usuarioAdministrador);

    expect(resultado.status).toBe(200);
    expect(resultado.body.ok).toBe(true);
    expect(resultado.body.message).toBe("Usuarios consultados correctamente.");

    expect(resultado.body.data?.usuarios).toHaveLength(1);
    expect(resultado.body.data?.usuarios[0].id).toBe("usuario-1");
    expect(resultado.body.data?.usuarios[0].tipo_documento).toBe("CC");
    expect(resultado.body.data?.usuarios[0].numero_documento).toBe(
      "1000000000"
    );
    expect(resultado.body.data?.usuarios[0].roles).toEqual(["LECTURA"]);

    expect(resultado.body.data?.usuarios[0]).not.toHaveProperty(
      "password_hash"
    );
    expect(listarUsuariosConRoles).toHaveBeenCalledTimes(1);
  });
});

describe("usuarios.service - crearUsuario", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe devolver 403 si el usuario autenticado no es ADMINISTRADOR", async () => {
    const resultado = await crearUsuario(usuarioLectura, {
      tipo_documento: "CC",
      numero_documento: "1000000001",
      nombre: "Usuario Nuevo",
      correo: "nuevo@test.com",
      telefono: "3001234567",
      password: "Usuario123*",
      estado: "ACTIVO",
      roles: ["SOLICITANTE"],
    });

    expect(resultado.status).toBe(403);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe(
      "No tiene permisos para crear usuarios."
    );

    expect(buscarUsuarioPorCorreo).not.toHaveBeenCalled();
    expect(buscarUsuarioPorNumeroDocumento).not.toHaveBeenCalled();
    expect(buscarRolesPorNombres).not.toHaveBeenCalled();
    expect(crearUsuarioEnBD).not.toHaveBeenCalled();
  });

  it("debe devolver 400 si faltan tipo de documento, número de documento, nombre, correo o contraseña", async () => {
    const resultado = await crearUsuario(usuarioAdministrador, {
      tipo_documento: "CC",
      numero_documento: "1000000001",
      nombre: "Usuario Nuevo",
      correo: "nuevo@test.com",
      estado: "ACTIVO",
      roles: ["SOLICITANTE"],
    });

    expect(resultado.status).toBe(400);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe(
      "Tipo de documento, número de documento, nombre, correo y contraseña son obligatorios."
    );

    expect(buscarUsuarioPorCorreo).not.toHaveBeenCalled();
    expect(buscarUsuarioPorNumeroDocumento).not.toHaveBeenCalled();
    expect(buscarRolesPorNombres).not.toHaveBeenCalled();
    expect(crearUsuarioEnBD).not.toHaveBeenCalled();
  });

  it("debe devolver 400 si no se asignan roles al usuario", async () => {
    const resultado = await crearUsuario(usuarioAdministrador, {
      tipo_documento: "CC",
      numero_documento: "1000000001",
      nombre: "Usuario Nuevo",
      correo: "nuevo@test.com",
      telefono: "3001234567",
      password: "Usuario123*",
      estado: "ACTIVO",
      roles: [],
    });

    expect(resultado.status).toBe(400);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe(
      "Debe asignar al menos un rol al usuario."
    );

    expect(buscarUsuarioPorCorreo).not.toHaveBeenCalled();
    expect(buscarUsuarioPorNumeroDocumento).not.toHaveBeenCalled();
    expect(buscarRolesPorNombres).not.toHaveBeenCalled();
    expect(crearUsuarioEnBD).not.toHaveBeenCalled();
  });

  it("debe devolver 409 si ya existe un usuario con ese correo", async () => {
    vi.mocked(buscarUsuarioPorCorreo).mockResolvedValue(usuarioBaseSinRoles);

    const resultado = await crearUsuario(usuarioAdministrador, {
      tipo_documento: "CC",
      numero_documento: "1000000001",
      nombre: "Usuario Nuevo",
      correo: "usuario@test.com",
      telefono: "3001234567",
      password: "Usuario123*",
      estado: "ACTIVO",
      roles: ["SOLICITANTE"],
    });

    expect(resultado.status).toBe(409);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe("Ya existe un usuario con ese correo.");

    expect(buscarUsuarioPorCorreo).toHaveBeenCalledWith("usuario@test.com");
    expect(buscarUsuarioPorNumeroDocumento).not.toHaveBeenCalled();
    expect(buscarRolesPorNombres).not.toHaveBeenCalled();
    expect(crearUsuarioEnBD).not.toHaveBeenCalled();
  });

  it("debe devolver 409 si ya existe un usuario con ese número de documento", async () => {
    vi.mocked(buscarUsuarioPorCorreo).mockResolvedValue(null);
    vi.mocked(buscarUsuarioPorNumeroDocumento).mockResolvedValue(
      usuarioBaseSinRoles
    );

    const resultado = await crearUsuario(usuarioAdministrador, {
      tipo_documento: "CC",
      numero_documento: "1000000000",
      nombre: "Usuario Nuevo",
      correo: "nuevo@test.com",
      telefono: "3001234567",
      password: "Usuario123*",
      estado: "ACTIVO",
      roles: ["SOLICITANTE"],
    });

    expect(resultado.status).toBe(409);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe(
      "Ya existe un usuario con ese número de documento."
    );

    expect(buscarUsuarioPorCorreo).toHaveBeenCalledWith("nuevo@test.com");
    expect(buscarUsuarioPorNumeroDocumento).toHaveBeenCalledWith("1000000000");
    expect(buscarRolesPorNombres).not.toHaveBeenCalled();
    expect(crearUsuarioEnBD).not.toHaveBeenCalled();
  });

  it("debe devolver 400 si el estado no es válido", async () => {
    const resultado = await crearUsuario(usuarioAdministrador, {
      tipo_documento: "CC",
      numero_documento: "1000000001",
      nombre: "Usuario Nuevo",
      correo: "nuevo@test.com",
      telefono: "3001234567",
      password: "Usuario123*",
      estado: "BLOQUEADO",
      roles: ["SOLICITANTE"],
    });

    expect(resultado.status).toBe(400);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe("El estado debe ser ACTIVO o INACTIVO.");

    expect(buscarUsuarioPorCorreo).not.toHaveBeenCalled();
    expect(buscarUsuarioPorNumeroDocumento).not.toHaveBeenCalled();
    expect(buscarRolesPorNombres).not.toHaveBeenCalled();
    expect(crearUsuarioEnBD).not.toHaveBeenCalled();
  });

  it("debe devolver 400 si uno o más roles no existen o no están activos", async () => {
    vi.mocked(buscarUsuarioPorCorreo).mockResolvedValue(null);
    vi.mocked(buscarUsuarioPorNumeroDocumento).mockResolvedValue(null);
    vi.mocked(buscarRolesPorNombres).mockResolvedValue([]);

    const resultado = await crearUsuario(usuarioAdministrador, {
      tipo_documento: "CC",
      numero_documento: "1000000001",
      nombre: "Usuario Nuevo",
      correo: "nuevo@test.com",
      telefono: "3001234567",
      password: "Usuario123*",
      estado: "ACTIVO",
      roles: ["ROL_INEXISTENTE"],
    });

    expect(resultado.status).toBe(400);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe(
      "Uno o más roles enviados no existen o no están activos."
    );

    expect(buscarRolesPorNombres).toHaveBeenCalledWith(["ROL_INEXISTENTE"]);
    expect(crearUsuarioEnBD).not.toHaveBeenCalled();
  });

  it("debe devolver 201 si crea el usuario correctamente", async () => {
    vi.mocked(buscarUsuarioPorCorreo).mockResolvedValue(null);
    vi.mocked(buscarUsuarioPorNumeroDocumento).mockResolvedValue(null);
    vi.mocked(buscarRolesPorNombres).mockResolvedValue([rolSolicitanteMock]);

    vi.mocked(crearUsuarioEnBD).mockResolvedValue({
      id: "usuario-nuevo",
      tipo_documento: "CC",
      numero_documento: "1000000001",
      nombre: "Usuario Nuevo",
      correo: "nuevo@test.com",
      telefono: "3001234567",
      password_hash: "hash-generado",
      estado: "ACTIVO",
      creado_en: fechaMock,
      actualizado_en: fechaMock,
      roles: [
        {
          id: "usuario-rol-2",
          usuario_id: "usuario-nuevo",
          rol_id: "rol-2",
          creado_en: fechaMock,
          rol: rolSolicitanteMock,
        },
      ],
    });

    const resultado = await crearUsuario(usuarioAdministrador, {
      tipo_documento: "CC",
      numero_documento: "1000000001",
      nombre: "Usuario Nuevo",
      correo: "nuevo@test.com",
      telefono: "3001234567",
      password: "Usuario123*",
      estado: "ACTIVO",
      roles: ["SOLICITANTE"],
    });

    expect(resultado.status).toBe(201);
    expect(resultado.body.ok).toBe(true);
    expect(resultado.body.message).toBe("Usuario creado correctamente.");

    expect(resultado.body.data?.usuario.id).toBe("usuario-nuevo");
    expect(resultado.body.data?.usuario.tipo_documento).toBe("CC");
    expect(resultado.body.data?.usuario.numero_documento).toBe("1000000001");
    expect(resultado.body.data?.usuario.nombre).toBe("Usuario Nuevo");
    expect(resultado.body.data?.usuario.correo).toBe("nuevo@test.com");
    expect(resultado.body.data?.usuario.roles).toEqual(["SOLICITANTE"]);

    expect(resultado.body.data?.usuario).not.toHaveProperty("password_hash");

    expect(buscarUsuarioPorCorreo).toHaveBeenCalledWith("nuevo@test.com");
    expect(buscarUsuarioPorNumeroDocumento).toHaveBeenCalledWith("1000000001");
    expect(buscarRolesPorNombres).toHaveBeenCalledWith(["SOLICITANTE"]);
    expect(crearUsuarioEnBD).toHaveBeenCalledTimes(1);
    expect(crearUsuarioEnBD).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo_documento: "CC",
        numero_documento: "1000000001",
        nombre: "Usuario Nuevo",
        correo: "nuevo@test.com",
        telefono: "3001234567",
        estado: "ACTIVO",
        roles_ids: ["rol-2"],
      })
    );
  });
});

describe("usuarios.service - obtenerUsuarioPorId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe devolver 400 si no se envía el id", async () => {
    const resultado = await obtenerUsuarioPorId(usuarioAdministrador, "");

    expect(resultado.status).toBe(400);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe("El id del usuario es obligatorio.");

    expect(buscarUsuarioPorIdConRoles).not.toHaveBeenCalled();
  });

  it("debe devolver 403 si el usuario autenticado no es ADMINISTRADOR", async () => {
    const resultado = await obtenerUsuarioPorId(usuarioLectura, "usuario-1");

    expect(resultado.status).toBe(403);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe(
      "No tiene permisos para consultar usuarios."
    );

    expect(buscarUsuarioPorIdConRoles).not.toHaveBeenCalled();
  });

  it("debe devolver 404 si el usuario no existe", async () => {
    vi.mocked(buscarUsuarioPorIdConRoles).mockResolvedValue(null);

    const resultado = await obtenerUsuarioPorId(usuarioAdministrador, "usuario-1");

    expect(resultado.status).toBe(404);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe("Usuario no encontrado.");

    expect(buscarUsuarioPorIdConRoles).toHaveBeenCalledWith("usuario-1");
  });

  it("debe devolver 200 si el usuario existe", async () => {
    vi.mocked(buscarUsuarioPorIdConRoles).mockResolvedValue(usuarioConRolesMock);

    const resultado = await obtenerUsuarioPorId(usuarioAdministrador, "usuario-1");

    expect(resultado.status).toBe(200);
    expect(resultado.body.ok).toBe(true);
    expect(resultado.body.message).toBe("Usuario consultado correctamente.");

    expect(resultado.body.data?.usuario.id).toBe("usuario-1");
    expect(resultado.body.data?.usuario.tipo_documento).toBe("CC");
    expect(resultado.body.data?.usuario.numero_documento).toBe("1000000000");
    expect(resultado.body.data?.usuario.roles).toEqual(["LECTURA"]);
  });
});

describe("usuarios.service - actualizarUsuario", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe devolver 400 si no se envía el id", async () => {
    const resultado = await actualizarUsuario(usuarioAdministrador, "", {
      nombre: "Usuario Actualizado",
    });

    expect(resultado.status).toBe(400);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe("El id del usuario es obligatorio.");

    expect(buscarUsuarioPorIdConRoles).not.toHaveBeenCalled();
  });

  it("debe devolver 403 si el usuario autenticado no es ADMINISTRADOR", async () => {
    const resultado = await actualizarUsuario(usuarioLectura, "usuario-1", {
      nombre: "Usuario Actualizado",
    });

    expect(resultado.status).toBe(403);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe(
      "No tiene permisos para editar usuarios."
    );

    expect(buscarUsuarioPorIdConRoles).not.toHaveBeenCalled();
  });

  it("debe devolver 400 si se intenta modificar el tipo de documento", async () => {
    const resultado = await actualizarUsuario(usuarioAdministrador, "usuario-1", {
      tipo_documento: "CE",
    });

    expect(resultado.status).toBe(400);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe(
      "El tipo y número de documento no se pueden modificar desde esta operación."
    );

    expect(buscarUsuarioPorIdConRoles).not.toHaveBeenCalled();
  });

  it("debe devolver 400 si se intenta modificar el número de documento", async () => {
    const resultado = await actualizarUsuario(usuarioAdministrador, "usuario-1", {
      numero_documento: "9999999999",
    });

    expect(resultado.status).toBe(400);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe(
      "El tipo y número de documento no se pueden modificar desde esta operación."
    );

    expect(buscarUsuarioPorIdConRoles).not.toHaveBeenCalled();
  });

  it("debe devolver 400 si no se envía ningún campo para actualizar", async () => {
    const resultado = await actualizarUsuario(usuarioAdministrador, "usuario-1", {});

    expect(resultado.status).toBe(400);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe(
      "Debe enviar al menos un campo para actualizar."
    );

    expect(buscarUsuarioPorIdConRoles).not.toHaveBeenCalled();
  });

  it("debe devolver 404 si el usuario no existe", async () => {
    vi.mocked(buscarUsuarioPorIdConRoles).mockResolvedValue(null);

    const resultado = await actualizarUsuario(usuarioAdministrador, "usuario-1", {
      nombre: "Usuario Actualizado",
    });

    expect(resultado.status).toBe(404);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe("Usuario no encontrado.");

    expect(buscarUsuarioPorIdConRoles).toHaveBeenCalledWith("usuario-1");
    expect(actualizarUsuarioEnBD).not.toHaveBeenCalled();
    expect(actualizarRolesUsuarioEnBD).not.toHaveBeenCalled();
  });

  it("debe devolver 409 si el correo pertenece a otro usuario", async () => {
    vi.mocked(buscarUsuarioPorIdConRoles).mockResolvedValue(usuarioConRolesMock);
    vi.mocked(buscarUsuarioPorCorreoDiferenteId).mockResolvedValue(
      usuarioBaseSinRoles
    );

    const resultado = await actualizarUsuario(usuarioAdministrador, "usuario-1", {
      correo: "otro@test.com",
    });

    expect(resultado.status).toBe(409);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe("Ya existe otro usuario con ese correo.");

    expect(buscarUsuarioPorCorreoDiferenteId).toHaveBeenCalledWith(
      "otro@test.com",
      "usuario-1"
    );
    expect(actualizarUsuarioEnBD).not.toHaveBeenCalled();
    expect(actualizarRolesUsuarioEnBD).not.toHaveBeenCalled();
  });

  it("debe devolver 400 si intenta dejar al usuario sin roles", async () => {
    vi.mocked(buscarUsuarioPorIdConRoles).mockResolvedValue(usuarioConRolesMock);

    const resultado = await actualizarUsuario(usuarioAdministrador, "usuario-1", {
      roles: [],
    });

    expect(resultado.status).toBe(400);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe(
      "Debe asignar al menos un rol al usuario."
    );

    expect(actualizarUsuarioEnBD).not.toHaveBeenCalled();
    expect(actualizarRolesUsuarioEnBD).not.toHaveBeenCalled();
  });

  it("debe devolver 400 si intenta asignar roles inexistentes o inactivos", async () => {
    vi.mocked(buscarUsuarioPorIdConRoles).mockResolvedValue(usuarioConRolesMock);
    vi.mocked(buscarRolesPorNombres).mockResolvedValue([]);

    const resultado = await actualizarUsuario(usuarioAdministrador, "usuario-1", {
      roles: ["ROL_INEXISTENTE"],
    });

    expect(resultado.status).toBe(400);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe(
      "Uno o más roles enviados no existen o no están activos."
    );

    expect(buscarRolesPorNombres).toHaveBeenCalledWith(["ROL_INEXISTENTE"]);
    expect(actualizarRolesUsuarioEnBD).not.toHaveBeenCalled();
  });

  it("debe devolver 200 si actualiza el usuario correctamente", async () => {
    vi.mocked(buscarUsuarioPorIdConRoles).mockResolvedValue(usuarioConRolesMock);
    vi.mocked(buscarUsuarioPorCorreoDiferenteId).mockResolvedValue(null);

    vi.mocked(actualizarUsuarioEnBD).mockResolvedValue({
      ...usuarioConRolesMock,
      nombre: "Usuario Actualizado",
      correo: "actualizado@test.com",
      telefono: "3001234567",
    });

    const resultado = await actualizarUsuario(usuarioAdministrador, "usuario-1", {
      nombre: "Usuario Actualizado",
      correo: "actualizado@test.com",
      telefono: "3001234567",
    });

    expect(resultado.status).toBe(200);
    expect(resultado.body.ok).toBe(true);
    expect(resultado.body.message).toBe("Usuario actualizado correctamente.");

    expect(resultado.body.data?.usuario.nombre).toBe("Usuario Actualizado");
    expect(resultado.body.data?.usuario.correo).toBe("actualizado@test.com");
    expect(resultado.body.data?.usuario.tipo_documento).toBe("CC");
    expect(resultado.body.data?.usuario.numero_documento).toBe("1000000000");

    expect(actualizarUsuarioEnBD).toHaveBeenCalledWith("usuario-1", {
      nombre: "Usuario Actualizado",
      correo: "actualizado@test.com",
      telefono: "3001234567",
    });
    expect(actualizarRolesUsuarioEnBD).not.toHaveBeenCalled();
  });

  it("debe devolver 200 si actualiza roles del usuario correctamente", async () => {
    vi.mocked(buscarUsuarioPorIdConRoles).mockResolvedValue(usuarioConRolesMock);
    vi.mocked(buscarRolesPorNombres).mockResolvedValue([
      rolSolicitanteMock,
      rolPagosMock,
    ]);
    vi.mocked(actualizarRolesUsuarioEnBD).mockResolvedValue(
      usuarioConRolesActualizadosMock
    );

    const resultado = await actualizarUsuario(usuarioAdministrador, "usuario-1", {
      roles: ["SOLICITANTE", "PAGOS"],
    });

    expect(resultado.status).toBe(200);
    expect(resultado.body.ok).toBe(true);
    expect(resultado.body.message).toBe("Usuario actualizado correctamente.");

    expect(resultado.body.data?.usuario.roles).toEqual(["SOLICITANTE", "PAGOS"]);

    expect(actualizarUsuarioEnBD).not.toHaveBeenCalled();
    expect(buscarRolesPorNombres).toHaveBeenCalledWith([
      "SOLICITANTE",
      "PAGOS",
    ]);
    expect(actualizarRolesUsuarioEnBD).toHaveBeenCalledWith("usuario-1", [
      "rol-2",
      "rol-3",
    ]);
  });
});

describe("usuarios.service - cambiarEstadoUsuario", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe devolver 400 si no se envía el id", async () => {
    const resultado = await cambiarEstadoUsuario(usuarioAdministrador, "", {
      estado: "ACTIVO",
    });

    expect(resultado.status).toBe(400);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe("El id del usuario es obligatorio.");

    expect(buscarUsuarioPorIdConRoles).not.toHaveBeenCalled();
  });

  it("debe devolver 403 si el usuario autenticado no es ADMINISTRADOR", async () => {
    const resultado = await cambiarEstadoUsuario(usuarioLectura, "usuario-1", {
      estado: "ACTIVO",
    });

    expect(resultado.status).toBe(403);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe(
      "No tiene permisos para cambiar el estado de usuarios."
    );

    expect(buscarUsuarioPorIdConRoles).not.toHaveBeenCalled();
  });

  it("debe devolver 400 si el estado no es válido", async () => {
    const resultado = await cambiarEstadoUsuario(usuarioAdministrador, "usuario-1", {
      estado: "BLOQUEADO" as "ACTIVO",
    });

    expect(resultado.status).toBe(400);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe("El estado debe ser ACTIVO o INACTIVO.");

    expect(buscarUsuarioPorIdConRoles).not.toHaveBeenCalled();
  });

  it("debe devolver 404 si el usuario no existe", async () => {
    vi.mocked(buscarUsuarioPorIdConRoles).mockResolvedValue(null);

    const resultado = await cambiarEstadoUsuario(usuarioAdministrador, "usuario-1", {
      estado: "INACTIVO",
    });

    expect(resultado.status).toBe(404);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe("Usuario no encontrado.");

    expect(buscarUsuarioPorIdConRoles).toHaveBeenCalledWith("usuario-1");
    expect(actualizarEstadoUsuarioEnBD).not.toHaveBeenCalled();
  });

  it("debe devolver 200 si cambia el estado correctamente", async () => {
    vi.mocked(buscarUsuarioPorIdConRoles).mockResolvedValue(usuarioConRolesMock);

    vi.mocked(actualizarEstadoUsuarioEnBD).mockResolvedValue({
      ...usuarioConRolesMock,
      estado: "INACTIVO",
    });

    const resultado = await cambiarEstadoUsuario(usuarioAdministrador, "usuario-1", {
      estado: "INACTIVO",
    });

    expect(resultado.status).toBe(200);
    expect(resultado.body.ok).toBe(true);
    expect(resultado.body.message).toBe(
      "Estado del usuario actualizado correctamente."
    );

    expect(resultado.body.data?.usuario.estado).toBe("INACTIVO");
    expect(resultado.body.data?.usuario.tipo_documento).toBe("CC");
    expect(resultado.body.data?.usuario.numero_documento).toBe("1000000000");

    expect(actualizarEstadoUsuarioEnBD).toHaveBeenCalledWith(
      "usuario-1",
      "INACTIVO"
    );
  });
});