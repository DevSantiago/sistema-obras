import { describe, expect, it, vi, beforeEach } from "vitest";
import {
    actualizarUsuario,  
    crearUsuario, 
    listarUsuarios,
    obtenerUsuarioPorId,
    cambiarEstadoUsuario,
} from "../usuarios.service";
import {
    actualizarEstadoUsuarioEnBD,
    actualizarUsuarioEnBD, 
    buscarUsuarioPorCorreo,
    buscarUsuarioPorCorreoDiferenteId,
    buscarUsuarioPorIdConRoles,
    crearUsuarioEnBD,
    listarUsuariosConRoles,
} from "../usuarios.repository";
import type { UsuarioSesion } from "@/modules/auth/auth.types";

vi.mock("../usuarios.repository", () => ({
  listarUsuariosConRoles: vi.fn(),
  buscarUsuarioPorCorreo: vi.fn(),
  buscarUsuarioPorIdConRoles: vi.fn(),
  buscarUsuarioPorCorreoDiferenteId: vi.fn(),
  crearUsuarioEnBD: vi.fn(),
  actualizarUsuarioEnBD: vi.fn(),
  actualizarEstadoUsuarioEnBD: vi.fn(),
}));

describe("usuarios.service - listarUsuarios", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe devolver 403 si el usuario autenticado no es ADMINISTRADOR", async () => {
    const usuarioAutenticado: UsuarioSesion = {
      id: "usuario-1",
      nombre: "Usuario Lectura",
      correo: "lectura@test.com",
      telefono: null,
      estado: "ACTIVO",
      roles: ["LECTURA"],
    };

    const resultado = await listarUsuarios(usuarioAutenticado);

    expect(resultado.status).toBe(403);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe(
      "No tiene permisos para consultar usuarios."
    );

    expect(listarUsuariosConRoles).not.toHaveBeenCalled();
  });

  it("debe devolver 200 y listar usuarios si el usuario autenticado es ADMINISTRADOR", async () => {
    const usuarioAutenticado: UsuarioSesion = {
      id: "admin-1",
      nombre: "Administrador",
      correo: "admin@test.com",
      telefono: null,
      estado: "ACTIVO",
      roles: ["ADMINISTRADOR"],
    };

    vi.mocked(listarUsuariosConRoles).mockResolvedValue([
      {
        id: "usuario-1",
        nombre: "Usuario Prueba",
        correo: "usuario@test.com",
        telefono: null,
        password_hash: "hash-secreto",
        estado: "ACTIVO",
        creado_en: new Date("2026-06-13T10:00:00.000Z"),
        actualizado_en: new Date("2026-06-13T10:00:00.000Z"),
        roles: [
          {
            id: "usuario-rol-1",
            usuario_id: "usuario-1",
            rol_id: "rol-1",
            creado_en: new Date("2026-06-13T10:00:00.000Z"),
            rol: {
              id: "rol-1",
              nombre: "LECTURA",
              descripcion: "Rol de lectura",
              activo: true,
              creado_en: new Date("2026-06-13T10:00:00.000Z"),
              actualizado_en: new Date("2026-06-13T10:00:00.000Z"),
            },
          },
        ],
      },
    ]);

    const resultado = await listarUsuarios(usuarioAutenticado);

    expect(resultado.status).toBe(200);
    expect(resultado.body.ok).toBe(true);
    expect(resultado.body.message).toBe("Usuarios consultados correctamente.");

    expect(resultado.body.data?.usuarios).toHaveLength(1);
    expect(resultado.body.data?.usuarios[0].id).toBe("usuario-1");
    expect(resultado.body.data?.usuarios[0].roles).toEqual(["LECTURA"]);

    expect(resultado.body.data?.usuarios[0]).not.toHaveProperty("password_hash");
    expect(listarUsuariosConRoles).toHaveBeenCalledTimes(1);
  });
});

describe("usuarios.service - crearUsuario", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe devolver 403 si el usuario autenticado no es ADMINISTRADOR", async () => {
    const usuarioAutenticado: UsuarioSesion = {
      id: "usuario-1",
      nombre: "Usuario Lectura",
      correo: "lectura@test.com",
      telefono: null,
      estado: "ACTIVO",
      roles: ["LECTURA"],
    };

    const resultado = await crearUsuario(usuarioAutenticado, {
      nombre: "Usuario Nuevo",
      correo: "nuevo@test.com",
      telefono: "3001234567",
      password: "Usuario123*",
      estado: "ACTIVO",
    });

    expect(resultado.status).toBe(403);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe("No tiene permisos para crear usuarios.");

    expect(buscarUsuarioPorCorreo).not.toHaveBeenCalled();
    expect(crearUsuarioEnBD).not.toHaveBeenCalled();
  });

  it("debe devolver 400 si faltan nombre, correo o contraseña", async () => {
    const usuarioAutenticado: UsuarioSesion = {
        id: "admin-1",
        nombre: "Administrador",
        correo: "admin@test.com",
        telefono: null,
        estado: "ACTIVO",
        roles: ["ADMINISTRADOR"],
    };

    const resultado = await crearUsuario(usuarioAutenticado, {
        nombre: "Usuario Nuevo",
        correo: "nuevo@test.com",
        // password faltante a propósito
        estado: "ACTIVO",
    });

    expect(resultado.status).toBe(400);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe(
        "Nombre, correo y contraseña son obligatorios."
    );

    expect(buscarUsuarioPorCorreo).not.toHaveBeenCalled();
    expect(crearUsuarioEnBD).not.toHaveBeenCalled();
    });

    it("debe devolver 409 si ya existe un usuario con ese correo", async () => {
    const usuarioAutenticado: UsuarioSesion = {
        id: "admin-1",
        nombre: "Administrador",
        correo: "admin@test.com",
        telefono: null,
        estado: "ACTIVO",
        roles: ["ADMINISTRADOR"],
    };

    vi.mocked(buscarUsuarioPorCorreo).mockResolvedValue({
        id: "usuario-existente",
        nombre: "Usuario Existente",
        correo: "nuevo@test.com",
        telefono: null,
        password_hash: "hash-existente",
        estado: "ACTIVO",
        creado_en: new Date("2026-06-13T10:00:00.000Z"),
        actualizado_en: new Date("2026-06-13T10:00:00.000Z"),
    });

    const resultado = await crearUsuario(usuarioAutenticado, {
        nombre: "Usuario Nuevo",
        correo: "nuevo@test.com",
        telefono: "3001234567",
        password: "Usuario123*",
        estado: "ACTIVO",
    });

    expect(resultado.status).toBe(409);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe("Ya existe un usuario con ese correo.");

    expect(buscarUsuarioPorCorreo).toHaveBeenCalledWith("nuevo@test.com");
    expect(crearUsuarioEnBD).not.toHaveBeenCalled();
    });

    it("debe devolver 201 si crea el usuario correctamente", async () => {
    const usuarioAutenticado: UsuarioSesion = {
        id: "admin-1",
        nombre: "Administrador",
        correo: "admin@test.com",
        telefono: null,
        estado: "ACTIVO",
        roles: ["ADMINISTRADOR"],
    };

    vi.mocked(buscarUsuarioPorCorreo).mockResolvedValue(null);

    vi.mocked(crearUsuarioEnBD).mockResolvedValue({
        id: "usuario-nuevo",
        nombre: "Usuario Nuevo",
        correo: "nuevo@test.com",
        telefono: "3001234567",
        password_hash: "hash-generado",
        estado: "ACTIVO",
        creado_en: new Date("2026-06-13T10:00:00.000Z"),
        actualizado_en: new Date("2026-06-13T10:00:00.000Z"),
        roles: [],
    });

    const resultado = await crearUsuario(usuarioAutenticado, {
        nombre: "Usuario Nuevo",
        correo: "nuevo@test.com",
        telefono: "3001234567",
        password: "Usuario123*",
        estado: "ACTIVO",
    });

    expect(resultado.status).toBe(201);
    expect(resultado.body.ok).toBe(true);
    expect(resultado.body.message).toBe("Usuario creado correctamente.");

    expect(resultado.body.data?.usuario.id).toBe("usuario-nuevo");
    expect(resultado.body.data?.usuario.nombre).toBe("Usuario Nuevo");
    expect(resultado.body.data?.usuario.correo).toBe("nuevo@test.com");
    expect(resultado.body.data?.usuario.roles).toEqual([]);

    expect(resultado.body.data?.usuario).not.toHaveProperty("password_hash");

    expect(buscarUsuarioPorCorreo).toHaveBeenCalledWith("nuevo@test.com");
    expect(crearUsuarioEnBD).toHaveBeenCalledTimes(1);
    });
});



describe("usuarios.service - obtenerUsuarioPorId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe devolver 400 si no se envía el id", async () => {
    const usuarioAutenticado: UsuarioSesion = {
      id: "admin-1",
      nombre: "Administrador",
      correo: "admin@test.com",
      telefono: null,
      estado: "ACTIVO",
      roles: ["ADMINISTRADOR"],
    };

    const resultado = await obtenerUsuarioPorId(usuarioAutenticado, "");

    expect(resultado.status).toBe(400);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe("El id del usuario es obligatorio.");

    expect(buscarUsuarioPorIdConRoles).not.toHaveBeenCalled();
  });

  it("debe devolver 403 si el usuario autenticado no es ADMINISTRADOR", async () => {
    const usuarioAutenticado: UsuarioSesion = {
      id: "usuario-1",
      nombre: "Usuario Lectura",
      correo: "lectura@test.com",
      telefono: null,
      estado: "ACTIVO",
      roles: ["LECTURA"],
    };

    const resultado = await obtenerUsuarioPorId(usuarioAutenticado, "usuario-2");

    expect(resultado.status).toBe(403);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe(
      "No tiene permisos para consultar usuarios."
    );

    expect(buscarUsuarioPorIdConRoles).not.toHaveBeenCalled();
  });

  it("debe devolver 404 si el usuario no existe", async () => {
    const usuarioAutenticado: UsuarioSesion = {
        id: "admin-1",
        nombre: "Administrador",
        correo: "admin@test.com",
        telefono: null,
        estado: "ACTIVO",
        roles: ["ADMINISTRADOR"],
    };

    vi.mocked(buscarUsuarioPorIdConRoles).mockResolvedValue(null);

    const resultado = await obtenerUsuarioPorId(usuarioAutenticado, "usuario-no-existe");

    expect(resultado.status).toBe(404);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe("Usuario no encontrado.");

    expect(buscarUsuarioPorIdConRoles).toHaveBeenCalledWith("usuario-no-existe");
    });

    it("debe devolver 200 si el usuario existe", async () => {
    const usuarioAutenticado: UsuarioSesion = {
        id: "admin-1",
        nombre: "Administrador",
        correo: "admin@test.com",
        telefono: null,
        estado: "ACTIVO",
        roles: ["ADMINISTRADOR"],
    };

    vi.mocked(buscarUsuarioPorIdConRoles).mockResolvedValue({
        id: "usuario-1",
        nombre: "Usuario Prueba",
        correo: "usuario@test.com",
        telefono: null,
        password_hash: "hash-secreto",
        estado: "ACTIVO",
        creado_en: new Date("2026-06-13T10:00:00.000Z"),
        actualizado_en: new Date("2026-06-13T10:00:00.000Z"),
        roles: [
        {
            id: "usuario-rol-1",
            usuario_id: "usuario-1",
            rol_id: "rol-1",
            creado_en: new Date("2026-06-13T10:00:00.000Z"),
            rol: {
            id: "rol-1",
            nombre: "LECTURA",
            descripcion: "Rol de lectura",
            activo: true,
            creado_en: new Date("2026-06-13T10:00:00.000Z"),
            actualizado_en: new Date("2026-06-13T10:00:00.000Z"),
            },
        },
        ],
    });

    const resultado = await obtenerUsuarioPorId(usuarioAutenticado, "usuario-1");

    expect(resultado.status).toBe(200);
    expect(resultado.body.ok).toBe(true);
    expect(resultado.body.message).toBe("Usuario consultado correctamente.");

    expect(resultado.body.data?.usuario.id).toBe("usuario-1");
    expect(resultado.body.data?.usuario.nombre).toBe("Usuario Prueba");
    expect(resultado.body.data?.usuario.roles).toEqual(["LECTURA"]);

    expect(resultado.body.data?.usuario).not.toHaveProperty("password_hash");

    expect(buscarUsuarioPorIdConRoles).toHaveBeenCalledWith("usuario-1");
    });
});

describe("usuarios.service - actualizarUsuario", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe devolver 400 si no se envía el id", async () => {
    const usuarioAutenticado: UsuarioSesion = {
      id: "admin-1",
      nombre: "Administrador",
      correo: "admin@test.com",
      telefono: null,
      estado: "ACTIVO",
      roles: ["ADMINISTRADOR"],
    };

    const resultado = await actualizarUsuario(usuarioAutenticado, "", {
      nombre: "Usuario Actualizado",
      correo: "actualizado@test.com",
      telefono: "3001234567",
    });

    expect(resultado.status).toBe(400);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe("El id del usuario es obligatorio.");

    expect(buscarUsuarioPorIdConRoles).not.toHaveBeenCalled();
    expect(actualizarUsuarioEnBD).not.toHaveBeenCalled();
  });

  it("debe devolver 403 si el usuario autenticado no es ADMINISTRADOR", async () => {
    const usuarioAutenticado: UsuarioSesion = {
      id: "usuario-1",
      nombre: "Usuario Lectura",
      correo: "lectura@test.com",
      telefono: null,
      estado: "ACTIVO",
      roles: ["LECTURA"],
    };

    const resultado = await actualizarUsuario(usuarioAutenticado, "usuario-2", {
      nombre: "Usuario Actualizado",
      correo: "actualizado@test.com",
      telefono: "3001234567",
    });

    expect(resultado.status).toBe(403);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe(
      "No tiene permisos para editar usuarios."
    );

    expect(buscarUsuarioPorIdConRoles).not.toHaveBeenCalled();
    expect(actualizarUsuarioEnBD).not.toHaveBeenCalled();
  });

    it("debe devolver 400 si no se envía ningún campo para actualizar", async () => {
    const usuarioAutenticado: UsuarioSesion = {
        id: "admin-1",
        nombre: "Administrador",
        correo: "admin@test.com",
        telefono: null,
        estado: "ACTIVO",
        roles: ["ADMINISTRADOR"],
    };

    const resultado = await actualizarUsuario(usuarioAutenticado, "usuario-1", {});

    expect(resultado.status).toBe(400);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe(
        "Debe enviar al menos un campo para actualizar."
    );

    expect(buscarUsuarioPorIdConRoles).not.toHaveBeenCalled();
    expect(buscarUsuarioPorCorreoDiferenteId).not.toHaveBeenCalled();
    expect(actualizarUsuarioEnBD).not.toHaveBeenCalled();
    });

    it("debe devolver 404 si el usuario no existe", async () => {
    const usuarioAutenticado: UsuarioSesion = {
        id: "admin-1",
        nombre: "Administrador",
        correo: "admin@test.com",
        telefono: null,
        estado: "ACTIVO",
        roles: ["ADMINISTRADOR"],
    };

    vi.mocked(buscarUsuarioPorIdConRoles).mockResolvedValue(null);

    const resultado = await actualizarUsuario(usuarioAutenticado, "usuario-no-existe", {
        nombre: "Usuario Actualizado",
    });

    expect(resultado.status).toBe(404);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe("Usuario no encontrado.");

    expect(buscarUsuarioPorIdConRoles).toHaveBeenCalledWith("usuario-no-existe");
    expect(buscarUsuarioPorCorreoDiferenteId).not.toHaveBeenCalled();
    expect(actualizarUsuarioEnBD).not.toHaveBeenCalled();
    });

    it("debe devolver 409 si el correo pertenece a otro usuario", async () => {
    const usuarioAutenticado: UsuarioSesion = {
        id: "admin-1",
        nombre: "Administrador",
        correo: "admin@test.com",
        telefono: null,
        estado: "ACTIVO",
        roles: ["ADMINISTRADOR"],
    };

    vi.mocked(buscarUsuarioPorIdConRoles).mockResolvedValue({
        id: "usuario-1",
        nombre: "Usuario Original",
        correo: "original@test.com",
        telefono: null,
        password_hash: "hash-original",
        estado: "ACTIVO",
        creado_en: new Date("2026-06-13T10:00:00.000Z"),
        actualizado_en: new Date("2026-06-13T10:00:00.000Z"),
        roles: [],
    });

    vi.mocked(buscarUsuarioPorCorreoDiferenteId).mockResolvedValue({
        id: "usuario-2",
        nombre: "Otro Usuario",
        correo: "otro@test.com",
        telefono: null,
        password_hash: "hash-otro",
        estado: "ACTIVO",
        creado_en: new Date("2026-06-13T10:00:00.000Z"),
        actualizado_en: new Date("2026-06-13T10:00:00.000Z"),
    });

    const resultado = await actualizarUsuario(usuarioAutenticado, "usuario-1", {
        correo: "otro@test.com",
    });

    expect(resultado.status).toBe(409);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe("Ya existe otro usuario con ese correo.");

    expect(buscarUsuarioPorIdConRoles).toHaveBeenCalledWith("usuario-1");
    expect(buscarUsuarioPorCorreoDiferenteId).toHaveBeenCalledWith(
        "otro@test.com",
        "usuario-1"
    );
    expect(actualizarUsuarioEnBD).not.toHaveBeenCalled();
    });

    it("debe devolver 200 si actualiza el usuario correctamente", async () => {
    const usuarioAutenticado: UsuarioSesion = {
        id: "admin-1",
        nombre: "Administrador",
        correo: "admin@test.com",
        telefono: null,
        estado: "ACTIVO",
        roles: ["ADMINISTRADOR"],
    };

    vi.mocked(buscarUsuarioPorIdConRoles).mockResolvedValue({
        id: "usuario-1",
        nombre: "Usuario Original",
        correo: "original@test.com",
        telefono: null,
        password_hash: "hash-original",
        estado: "ACTIVO",
        creado_en: new Date("2026-06-13T10:00:00.000Z"),
        actualizado_en: new Date("2026-06-13T10:00:00.000Z"),
        roles: [],
    });

    vi.mocked(buscarUsuarioPorCorreoDiferenteId).mockResolvedValue(null);

    vi.mocked(actualizarUsuarioEnBD).mockResolvedValue({
        id: "usuario-1",
        nombre: "Usuario Actualizado",
        correo: "actualizado@test.com",
        telefono: "3001234567",
        password_hash: "hash-original",
        estado: "ACTIVO",
        creado_en: new Date("2026-06-13T10:00:00.000Z"),
        actualizado_en: new Date("2026-06-13T11:00:00.000Z"),
        roles: [
        {
            id: "usuario-rol-1",
            usuario_id: "usuario-1",
            rol_id: "rol-1",
            creado_en: new Date("2026-06-13T10:00:00.000Z"),
            rol: {
            id: "rol-1",
            nombre: "LECTURA",
            descripcion: "Rol de lectura",
            activo: true,
            creado_en: new Date("2026-06-13T10:00:00.000Z"),
            actualizado_en: new Date("2026-06-13T10:00:00.000Z"),
            },
        },
        ],
    });

    const resultado = await actualizarUsuario(usuarioAutenticado, "usuario-1", {
        nombre: "Usuario Actualizado",
        correo: "actualizado@test.com",
        telefono: "3001234567",
    });

    expect(resultado.status).toBe(200);
    expect(resultado.body.ok).toBe(true);
    expect(resultado.body.message).toBe("Usuario actualizado correctamente.");

    expect(resultado.body.data?.usuario.id).toBe("usuario-1");
    expect(resultado.body.data?.usuario.nombre).toBe("Usuario Actualizado");
    expect(resultado.body.data?.usuario.correo).toBe("actualizado@test.com");
    expect(resultado.body.data?.usuario.telefono).toBe("3001234567");
    expect(resultado.body.data?.usuario.roles).toEqual(["LECTURA"]);

    expect(resultado.body.data?.usuario).not.toHaveProperty("password_hash");

    expect(buscarUsuarioPorIdConRoles).toHaveBeenCalledWith("usuario-1");
    expect(buscarUsuarioPorCorreoDiferenteId).toHaveBeenCalledWith(
        "actualizado@test.com",
        "usuario-1"
    );
    expect(actualizarUsuarioEnBD).toHaveBeenCalledWith("usuario-1", {
        nombre: "Usuario Actualizado",
        correo: "actualizado@test.com",
        telefono: "3001234567",
    });
    });
});

describe("usuarios.service - cambiarEstadoUsuario", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe devolver 400 si no se envía el id", async () => {
    const usuarioAutenticado: UsuarioSesion = {
      id: "admin-1",
      nombre: "Administrador",
      correo: "admin@test.com",
      telefono: null,
      estado: "ACTIVO",
      roles: ["ADMINISTRADOR"],
    };

    const resultado = await cambiarEstadoUsuario(usuarioAutenticado, "", {
      estado: "ACTIVO",
    });

    expect(resultado.status).toBe(400);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe("El id del usuario es obligatorio.");

    expect(buscarUsuarioPorIdConRoles).not.toHaveBeenCalled();
    expect(actualizarEstadoUsuarioEnBD).not.toHaveBeenCalled();
  });

  it("debe devolver 403 si el usuario autenticado no es ADMINISTRADOR", async () => {
    const usuarioAutenticado: UsuarioSesion = {
      id: "usuario-1",
      nombre: "Usuario Lectura",
      correo: "lectura@test.com",
      telefono: null,
      estado: "ACTIVO",
      roles: ["LECTURA"],
    };

    const resultado = await cambiarEstadoUsuario(usuarioAutenticado, "usuario-2", {
      estado: "ACTIVO",
    });

    expect(resultado.status).toBe(403);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe(
      "No tiene permisos para cambiar el estado de usuarios."
    );

    expect(buscarUsuarioPorIdConRoles).not.toHaveBeenCalled();
    expect(actualizarEstadoUsuarioEnBD).not.toHaveBeenCalled();
  });

  it("debe devolver 400 si el estado no es válido", async () => {
    const usuarioAutenticado: UsuarioSesion = {
        id: "admin-1",
        nombre: "Administrador",
        correo: "admin@test.com",
        telefono: null,
        estado: "ACTIVO",
        roles: ["ADMINISTRADOR"],
    };

    const resultado = await cambiarEstadoUsuario(usuarioAutenticado, "usuario-1", {
        estado: "BLOQUEADO" as "ACTIVO",
    });

    expect(resultado.status).toBe(400);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe(
        "El estado debe ser ACTIVO o INACTIVO."
    );

    expect(buscarUsuarioPorIdConRoles).not.toHaveBeenCalled();
    expect(actualizarEstadoUsuarioEnBD).not.toHaveBeenCalled();
    });

    it("debe devolver 404 si el usuario no existe", async () => {
    const usuarioAutenticado: UsuarioSesion = {
        id: "admin-1",
        nombre: "Administrador",
        correo: "admin@test.com",
        telefono: null,
        estado: "ACTIVO",
        roles: ["ADMINISTRADOR"],
    };

    vi.mocked(buscarUsuarioPorIdConRoles).mockResolvedValue(null);

    const resultado = await cambiarEstadoUsuario(usuarioAutenticado, "usuario-no-existe", {
        estado: "INACTIVO",
    });

    expect(resultado.status).toBe(404);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe("Usuario no encontrado.");

    expect(buscarUsuarioPorIdConRoles).toHaveBeenCalledWith("usuario-no-existe");
    expect(actualizarEstadoUsuarioEnBD).not.toHaveBeenCalled();
    });

    it("debe devolver 200 si cambia el estado correctamente", async () => {
    const usuarioAutenticado: UsuarioSesion = {
        id: "admin-1",
        nombre: "Administrador",
        correo: "admin@test.com",
        telefono: null,
        estado: "ACTIVO",
        roles: ["ADMINISTRADOR"],
    };

    vi.mocked(buscarUsuarioPorIdConRoles).mockResolvedValue({
        id: "usuario-1",
        nombre: "Usuario Prueba",
        correo: "usuario@test.com",
        telefono: null,
        password_hash: "hash-secreto",
        estado: "ACTIVO",
        creado_en: new Date("2026-06-13T10:00:00.000Z"),
        actualizado_en: new Date("2026-06-13T10:00:00.000Z"),
        roles: [],
    });

    vi.mocked(actualizarEstadoUsuarioEnBD).mockResolvedValue({
        id: "usuario-1",
        nombre: "Usuario Prueba",
        correo: "usuario@test.com",
        telefono: null,
        password_hash: "hash-secreto",
        estado: "INACTIVO",
        creado_en: new Date("2026-06-13T10:00:00.000Z"),
        actualizado_en: new Date("2026-06-13T11:00:00.000Z"),
        roles: [
        {
            id: "usuario-rol-1",
            usuario_id: "usuario-1",
            rol_id: "rol-1",
            creado_en: new Date("2026-06-13T10:00:00.000Z"),
            rol: {
            id: "rol-1",
            nombre: "LECTURA",
            descripcion: "Rol de lectura",
            activo: true,
            creado_en: new Date("2026-06-13T10:00:00.000Z"),
            actualizado_en: new Date("2026-06-13T10:00:00.000Z"),
            },
        },
        ],
    });

    const resultado = await cambiarEstadoUsuario(usuarioAutenticado, "usuario-1", {
        estado: "INACTIVO",
    });

    expect(resultado.status).toBe(200);
    expect(resultado.body.ok).toBe(true);
    expect(resultado.body.message).toBe("Estado del usuario actualizado correctamente.");

    expect(resultado.body.data?.usuario.id).toBe("usuario-1");
    expect(resultado.body.data?.usuario.estado).toBe("INACTIVO");
    expect(resultado.body.data?.usuario.roles).toEqual(["LECTURA"]);

    expect(resultado.body.data?.usuario).not.toHaveProperty("password_hash");

    expect(buscarUsuarioPorIdConRoles).toHaveBeenCalledWith("usuario-1");
    expect(actualizarEstadoUsuarioEnBD).toHaveBeenCalledWith(
        "usuario-1",
        "INACTIVO"
    );
    });
});