import { beforeEach, describe, expect, it, vi } from "vitest";
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
import {
  actualizarUsuario,
  cambiarEstadoUsuario,
  crearUsuario,
  listarUsuarios,
  obtenerUsuarioPorId,
} from "../usuarios.service";
import type { CrearUsuarioInput } from "../usuarios.types";

vi.mock("@/modules/usuarios/usuarios.repository", () => ({
  actualizarEstadoUsuarioEnBD: vi.fn(),
  actualizarUsuarioEnBD: vi.fn(),
  buscarCentrosCostoActivosPorAccesos: vi.fn(),
  buscarRolActivoPorNombre: vi.fn(),
  buscarUsuarioPorCorreo: vi.fn(),
  buscarUsuarioPorCorreoDiferenteId: vi.fn(),
  buscarUsuarioPorIdConRoles: vi.fn(),
  buscarUsuarioPorNumeroDocumento: vi.fn(),
  crearUsuarioEnBD: vi.fn(),
  listarUsuariosConRoles: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hash-generado"),
  },
}));

const fechaMock = new Date("2026-06-26T10:00:00.000Z");

const usuarioAdministrador: UsuarioSesion = {
  id: "admin-1",
  nombre: "Administrador",
  correo: "admin@test.com",
  telefono: null,
  estado: "ACTIVO",
  roles: ["ADMINISTRADOR"],
  permisos: [
    "CREAR_SOLICITUDES",
    "CREAR_PROYECTOS",
    "CREAR_USUARIOS",
    "ASIGNAR_ACCESOS",
    "APROBAR_NIVEL_1",
    "APROBAR_NIVEL_2",
    "MARCAR_COMO_PAGADO",
    "CONSULTAR_TODO",
  ],
};

const usuarioSolicitante: UsuarioSesion = {
  id: "solicitante-1",
  nombre: "Solicitante",
  correo: "solicitante@test.com",
  telefono: null,
  estado: "ACTIVO",
  roles: ["SOLICITANTE"],
  permisos: ["CREAR_SOLICITUDES"],
};

function crearRolMock(
  id: string,
  nombre: string,
  lineasNegocio: string[],
) {
  return {
    id,
    nombre,
    descripcion: `Rol ${nombre}`,
    activo: true,
    creado_en: fechaMock,
    actualizado_en: fechaMock,
    lineas_negocio: lineasNegocio.map((lineaNegocio, index) => ({
      id: `linea-${id}-${index}`,
      rol_id: id,
      linea_negocio: lineaNegocio,
      creado_en: fechaMock,
    })),
  };
}

const rolSolicitanteMock = crearRolMock(
  "rol-solicitante",
  "SOLICITANTE",
  ["OBRA"],
);

const rolPagosMock = crearRolMock("rol-pagos", "PAGOS", [
  "OBRA",
  "INTERVENTORIA",
]);

const proyectoBaseMock = {
  id: "proyecto-1",
  nombre: "PROYECTO PRUEBA",
  descripcion: null,
  estado_proyecto: "EN_LICITACION",
  activo: true,
  creado_por: "admin-1",
  creado_en: fechaMock,
  actualizado_en: fechaMock,
};

function crearAccesoMock(lineaNegocio: string) {
  return {
    id: `acceso-${lineaNegocio.toLowerCase()}`,
    usuario_id: "usuario-1",
    proyecto_base_id: "proyecto-1",
    linea_negocio: lineaNegocio,
    activo: true,
    asignado_por: "admin-1",
    asignado_en: fechaMock,
    revocado_por: null,
    revocado_en: null,
    creado_en: fechaMock,
    actualizado_en: fechaMock,
    proyecto_base: proyectoBaseMock,
  };
}

const usuarioConAccesoObraMock = {
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
      rol_id: rolSolicitanteMock.id,
      creado_en: fechaMock,
      rol: {
        id: rolSolicitanteMock.id,
        nombre: rolSolicitanteMock.nombre,
        descripcion: rolSolicitanteMock.descripcion,
        activo: true,
        creado_en: fechaMock,
        actualizado_en: fechaMock,
      },
    },
  ],
  accesos_recibidos: [crearAccesoMock("OBRA")],
};

const usuarioConAccesoInterventoriaMock = {
  ...usuarioConAccesoObraMock,
  roles: [
    {
      ...usuarioConAccesoObraMock.roles[0],
      rol_id: rolPagosMock.id,
      rol: {
        id: rolPagosMock.id,
        nombre: rolPagosMock.nombre,
        descripcion: rolPagosMock.descripcion,
        activo: true,
        creado_en: fechaMock,
        actualizado_en: fechaMock,
      },
    },
  ],
  accesos_recibidos: [crearAccesoMock("INTERVENTORIA")],
};

const usuarioBaseSinRelaciones = {
  id: "usuario-2",
  tipo_documento: "CC",
  numero_documento: "2000000000",
  nombre: "Usuario Existente",
  correo: "existente@test.com",
  telefono: null,
  password_hash: "hash",
  estado: "ACTIVO",
  creado_en: fechaMock,
  actualizado_en: fechaMock,
};

function crearInputUsuario(
  overrides: Partial<CrearUsuarioInput> = {},
): CrearUsuarioInput {
  return {
    tipo_documento: "CC",
    numero_documento: "1000000001",
    nombre: "Usuario Nuevo",
    correo: "nuevo@test.com",
    telefono: "3001234567",
    password: "Usuario123*",
    estado: "ACTIVO",
    rol: "SOLICITANTE",
    accesos: [
      {
        proyecto_base_id: "proyecto-1",
        linea_negocio: "OBRA",
      },
    ],
    ...overrides,
  };
}

describe("usuarios.service - listarUsuarios", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe devolver 403 si no tiene el permiso requerido", async () => {
    const resultado = await listarUsuarios(usuarioSolicitante);

    expect(resultado.status).toBe(403);
    expect(listarUsuariosConRoles).not.toHaveBeenCalled();
  });

  it("debe listar usuarios con rol único y accesos", async () => {
    vi.mocked(listarUsuariosConRoles).mockResolvedValue([
      usuarioConAccesoObraMock,
    ] as never);

    const resultado = await listarUsuarios(usuarioAdministrador);

    expect(resultado.status).toBe(200);
    expect(resultado.body.data?.usuarios[0].rol).toBe("SOLICITANTE");
    expect(resultado.body.data?.usuarios[0].accesos).toEqual([
      expect.objectContaining({
        proyecto_base_id: "proyecto-1",
        proyecto_nombre: "PROYECTO PRUEBA",
        linea_negocio: "OBRA",
      }),
    ]);
    expect(resultado.body.data?.usuarios[0]).not.toHaveProperty(
      "password_hash",
    );
  });
});

describe("usuarios.service - crearUsuario", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe devolver 403 si no tiene el permiso requerido", async () => {
    const resultado = await crearUsuario(
      usuarioSolicitante,
      crearInputUsuario(),
    );

    expect(resultado.status).toBe(403);
    expect(buscarUsuarioPorCorreo).not.toHaveBeenCalled();
  });

  it("debe exigir los datos personales obligatorios", async () => {
    const resultado = await crearUsuario(
      usuarioAdministrador,
      crearInputUsuario({ nombre: "" }),
    );

    expect(resultado.status).toBe(400);
    expect(resultado.body.message).toContain("son obligatorios");
  });

  it("debe exigir un único rol", async () => {
    const resultado = await crearUsuario(
      usuarioAdministrador,
      crearInputUsuario({ rol: "" }),
    );

    expect(resultado.status).toBe(400);
    expect(resultado.body.message).toBe("Debe asignar un rol al usuario.");
  });

  it("debe rechazar un estado inválido", async () => {
    const resultado = await crearUsuario(
      usuarioAdministrador,
      crearInputUsuario({ estado: "BLOQUEADO" }),
    );

    expect(resultado.status).toBe(400);
    expect(resultado.body.message).toBe(
      "El estado debe ser ACTIVO o INACTIVO.",
    );
  });

  it("debe rechazar accesos repetidos", async () => {
    const acceso = {
      proyecto_base_id: "proyecto-1",
      linea_negocio: "OBRA" as const,
    };
    const resultado = await crearUsuario(
      usuarioAdministrador,
      crearInputUsuario({ accesos: [acceso, acceso] }),
    );

    expect(resultado.status).toBe(400);
    expect(resultado.body.message).toBe(
      "No se pueden repetir accesos al mismo proyecto y línea.",
    );
  });

  it("debe rechazar un correo existente", async () => {
    vi.mocked(buscarUsuarioPorCorreo).mockResolvedValue(
      usuarioBaseSinRelaciones,
    );

    const resultado = await crearUsuario(
      usuarioAdministrador,
      crearInputUsuario(),
    );

    expect(resultado.status).toBe(409);
    expect(resultado.body.message).toBe(
      "Ya existe un usuario con ese correo.",
    );
    expect(buscarUsuarioPorNumeroDocumento).not.toHaveBeenCalled();
  });

  it("debe rechazar un documento existente", async () => {
    vi.mocked(buscarUsuarioPorCorreo).mockResolvedValue(null);
    vi.mocked(buscarUsuarioPorNumeroDocumento).mockResolvedValue(
      usuarioBaseSinRelaciones,
    );

    const resultado = await crearUsuario(
      usuarioAdministrador,
      crearInputUsuario(),
    );

    expect(resultado.status).toBe(409);
    expect(resultado.body.message).toContain("número de documento");
  });

  it("debe rechazar un rol inexistente o inactivo", async () => {
    vi.mocked(buscarUsuarioPorCorreo).mockResolvedValue(null);
    vi.mocked(buscarUsuarioPorNumeroDocumento).mockResolvedValue(null);
    vi.mocked(buscarRolActivoPorNombre).mockResolvedValue(null);

    const resultado = await crearUsuario(
      usuarioAdministrador,
      crearInputUsuario({ rol: "INEXISTENTE" }),
    );

    expect(resultado.status).toBe(400);
    expect(resultado.body.message).toBe(
      "El rol enviado no existe o no está activo.",
    );
  });

  it("debe impedir INTERVENTORIA para SOLICITANTE", async () => {
    vi.mocked(buscarUsuarioPorCorreo).mockResolvedValue(null);
    vi.mocked(buscarUsuarioPorNumeroDocumento).mockResolvedValue(null);
    vi.mocked(buscarRolActivoPorNombre).mockResolvedValue(
      rolSolicitanteMock as never,
    );

    const resultado = await crearUsuario(
      usuarioAdministrador,
      crearInputUsuario({
        accesos: [
          {
            proyecto_base_id: "proyecto-1",
            linea_negocio: "INTERVENTORIA",
          },
        ],
      }),
    );

    expect(resultado.status).toBe(400);
    expect(resultado.body.message).toBe(
      "El rol SOLICITANTE no puede acceder a la línea INTERVENTORIA.",
    );
    expect(buscarCentrosCostoActivosPorAccesos).not.toHaveBeenCalled();
    expect(crearUsuarioEnBD).not.toHaveBeenCalled();
  });

  it("debe rechazar un proyecto o línea inexistente", async () => {
    vi.mocked(buscarUsuarioPorCorreo).mockResolvedValue(null);
    vi.mocked(buscarUsuarioPorNumeroDocumento).mockResolvedValue(null);
    vi.mocked(buscarRolActivoPorNombre).mockResolvedValue(
      rolSolicitanteMock as never,
    );
    vi.mocked(buscarCentrosCostoActivosPorAccesos).mockResolvedValue([]);

    const resultado = await crearUsuario(
      usuarioAdministrador,
      crearInputUsuario(),
    );

    expect(resultado.status).toBe(400);
    expect(resultado.body.message).toContain("proyectos o líneas inexistentes");
    expect(crearUsuarioEnBD).not.toHaveBeenCalled();
  });

  it("debe crear usuario, rol y accesos correctamente", async () => {
    vi.mocked(buscarUsuarioPorCorreo).mockResolvedValue(null);
    vi.mocked(buscarUsuarioPorNumeroDocumento).mockResolvedValue(null);
    vi.mocked(buscarRolActivoPorNombre).mockResolvedValue(
      rolSolicitanteMock as never,
    );
    vi.mocked(buscarCentrosCostoActivosPorAccesos).mockResolvedValue([
      {
        proyecto_base_id: "proyecto-1",
        linea_negocio: "OBRA",
      },
    ]);
    vi.mocked(crearUsuarioEnBD).mockResolvedValue(
      usuarioConAccesoObraMock as never,
    );

    const resultado = await crearUsuario(
      usuarioAdministrador,
      crearInputUsuario({
        nombre: "  Usuario Nuevo  ",
        correo: "  NUEVO@TEST.COM  ",
        rol: " solicitante ",
      }),
    );

    expect(resultado.status).toBe(201);
    expect(resultado.body.data?.usuario.rol).toBe("SOLICITANTE");
    expect(crearUsuarioEnBD).toHaveBeenCalledWith({
      tipo_documento: "CC",
      numero_documento: "1000000001",
      nombre: "Usuario Nuevo",
      correo: "nuevo@test.com",
      telefono: "3001234567",
      password_hash: "hash-generado",
      estado: "ACTIVO",
      rol_id: "rol-solicitante",
      accesos: [
        {
          proyecto_base_id: "proyecto-1",
          linea_negocio: "OBRA",
        },
      ],
      asignado_por: "admin-1",
    });
  });
});

describe("usuarios.service - obtenerUsuarioPorId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe devolver 403 si no tiene el permiso requerido", async () => {
    const resultado = await obtenerUsuarioPorId(
      usuarioSolicitante,
      "usuario-1",
    );

    expect(resultado.status).toBe(403);
    expect(buscarUsuarioPorIdConRoles).not.toHaveBeenCalled();
  });

  it("debe exigir el id", async () => {
    const resultado = await obtenerUsuarioPorId(usuarioAdministrador, "");

    expect(resultado.status).toBe(400);
    expect(buscarUsuarioPorIdConRoles).not.toHaveBeenCalled();
  });

  it("debe devolver 404 si no existe", async () => {
    vi.mocked(buscarUsuarioPorIdConRoles).mockResolvedValue(null);

    const resultado = await obtenerUsuarioPorId(
      usuarioAdministrador,
      "usuario-1",
    );

    expect(resultado.status).toBe(404);
  });

  it("debe devolver el usuario con rol y accesos", async () => {
    vi.mocked(buscarUsuarioPorIdConRoles).mockResolvedValue(
      usuarioConAccesoObraMock as never,
    );

    const resultado = await obtenerUsuarioPorId(
      usuarioAdministrador,
      "usuario-1",
    );

    expect(resultado.status).toBe(200);
    expect(resultado.body.data?.usuario.rol).toBe("SOLICITANTE");
    expect(resultado.body.data?.usuario.accesos).toHaveLength(1);
  });
});

describe("usuarios.service - actualizarUsuario", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe devolver 403 si no tiene el permiso requerido", async () => {
    const resultado = await actualizarUsuario(
      usuarioSolicitante,
      "usuario-1",
      { nombre: "Nuevo nombre" },
    );

    expect(resultado.status).toBe(403);
  });

  it("debe exigir el id", async () => {
    const resultado = await actualizarUsuario(usuarioAdministrador, "", {
      nombre: "Nuevo nombre",
    });

    expect(resultado.status).toBe(400);
  });

  it("debe impedir modificar la identificación", async () => {
    const resultado = await actualizarUsuario(
      usuarioAdministrador,
      "usuario-1",
      { numero_documento: "999" },
    );

    expect(resultado.status).toBe(400);
    expect(resultado.body.message).toContain("no se pueden modificar");
  });

  it("debe exigir al menos un campo", async () => {
    const resultado = await actualizarUsuario(
      usuarioAdministrador,
      "usuario-1",
      {},
    );

    expect(resultado.status).toBe(400);
  });

  it("debe devolver 404 si el usuario no existe", async () => {
    vi.mocked(buscarUsuarioPorIdConRoles).mockResolvedValue(null);

    const resultado = await actualizarUsuario(
      usuarioAdministrador,
      "usuario-1",
      { nombre: "Nuevo nombre" },
    );

    expect(resultado.status).toBe(404);
    expect(actualizarUsuarioEnBD).not.toHaveBeenCalled();
  });

  it("debe rechazar un correo que pertenece a otro usuario", async () => {
    vi.mocked(buscarUsuarioPorIdConRoles).mockResolvedValue(
      usuarioConAccesoObraMock as never,
    );
    vi.mocked(buscarUsuarioPorCorreoDiferenteId).mockResolvedValue(
      usuarioBaseSinRelaciones,
    );

    const resultado = await actualizarUsuario(
      usuarioAdministrador,
      "usuario-1",
      { correo: "OTRO@TEST.COM" },
    );

    expect(resultado.status).toBe(409);
    expect(buscarUsuarioPorCorreoDiferenteId).toHaveBeenCalledWith(
      "otro@test.com",
      "usuario-1",
    );
  });

  it("debe impedir cambiar a SOLICITANTE conservando INTERVENTORIA", async () => {
    vi.mocked(buscarUsuarioPorIdConRoles).mockResolvedValue(
      usuarioConAccesoInterventoriaMock as never,
    );
    vi.mocked(buscarRolActivoPorNombre).mockResolvedValue(
      rolSolicitanteMock as never,
    );

    const resultado = await actualizarUsuario(
      usuarioAdministrador,
      "usuario-1",
      { rol: "SOLICITANTE" },
    );

    expect(resultado.status).toBe(400);
    expect(resultado.body.message).toContain(
      "no puede acceder a la línea INTERVENTORIA",
    );
    expect(actualizarUsuarioEnBD).not.toHaveBeenCalled();
  });

  it("debe actualizar datos básicos", async () => {
    vi.mocked(buscarUsuarioPorIdConRoles).mockResolvedValue(
      usuarioConAccesoObraMock as never,
    );
    vi.mocked(buscarUsuarioPorCorreoDiferenteId).mockResolvedValue(null);
    vi.mocked(actualizarUsuarioEnBD).mockResolvedValue({
      ...usuarioConAccesoObraMock,
      nombre: "Usuario Actualizado",
      correo: "actualizado@test.com",
    } as never);

    const resultado = await actualizarUsuario(
      usuarioAdministrador,
      "usuario-1",
      {
        nombre: " Usuario Actualizado ",
        correo: " ACTUALIZADO@TEST.COM ",
      },
    );

    expect(resultado.status).toBe(200);
    expect(actualizarUsuarioEnBD).toHaveBeenCalledWith("usuario-1", {
      nombre: "Usuario Actualizado",
      correo: "actualizado@test.com",
      telefono: undefined,
      rol_id: undefined,
      accesos: undefined,
      actualizado_por: "admin-1",
    });
  });

  it("debe actualizar accesos válidos para el rol actual", async () => {
    vi.mocked(buscarUsuarioPorIdConRoles).mockResolvedValue(
      usuarioConAccesoObraMock as never,
    );
    vi.mocked(buscarRolActivoPorNombre).mockResolvedValue(
      rolSolicitanteMock as never,
    );
    vi.mocked(buscarCentrosCostoActivosPorAccesos).mockResolvedValue([
      {
        proyecto_base_id: "proyecto-1",
        linea_negocio: "OBRA",
      },
    ]);
    vi.mocked(actualizarUsuarioEnBD).mockResolvedValue(
      usuarioConAccesoObraMock as never,
    );

    const accesos = [
      {
        proyecto_base_id: "proyecto-1",
        linea_negocio: "OBRA" as const,
      },
    ];
    const resultado = await actualizarUsuario(
      usuarioAdministrador,
      "usuario-1",
      { accesos },
    );

    expect(resultado.status).toBe(200);
    expect(actualizarUsuarioEnBD).toHaveBeenCalledWith(
      "usuario-1",
      expect.objectContaining({
        accesos,
        actualizado_por: "admin-1",
      }),
    );
  });
});

describe("usuarios.service - cambiarEstadoUsuario", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe devolver 403 si no tiene el permiso requerido", async () => {
    const resultado = await cambiarEstadoUsuario(
      usuarioSolicitante,
      "usuario-1",
      { estado: "INACTIVO" },
    );

    expect(resultado.status).toBe(403);
  });

  it("debe exigir el id", async () => {
    const resultado = await cambiarEstadoUsuario(usuarioAdministrador, "", {
      estado: "INACTIVO",
    });

    expect(resultado.status).toBe(400);
  });

  it("debe exigir el estado", async () => {
    const resultado = await cambiarEstadoUsuario(
      usuarioAdministrador,
      "usuario-1",
      {},
    );

    expect(resultado.status).toBe(400);
  });

  it("debe rechazar un estado inválido", async () => {
    const resultado = await cambiarEstadoUsuario(
      usuarioAdministrador,
      "usuario-1",
      { estado: "BLOQUEADO" as "ACTIVO" },
    );

    expect(resultado.status).toBe(400);
  });

  it("debe devolver 404 si el usuario no existe", async () => {
    vi.mocked(buscarUsuarioPorIdConRoles).mockResolvedValue(null);

    const resultado = await cambiarEstadoUsuario(
      usuarioAdministrador,
      "usuario-1",
      { estado: "INACTIVO" },
    );

    expect(resultado.status).toBe(404);
  });

  it("debe cambiar el estado correctamente", async () => {
    vi.mocked(buscarUsuarioPorIdConRoles).mockResolvedValue(
      usuarioConAccesoObraMock as never,
    );
    vi.mocked(actualizarEstadoUsuarioEnBD).mockResolvedValue({
      ...usuarioConAccesoObraMock,
      estado: "INACTIVO",
    } as never);

    const resultado = await cambiarEstadoUsuario(
      usuarioAdministrador,
      "usuario-1",
      { estado: "INACTIVO" },
    );

    expect(resultado.status).toBe(200);
    expect(resultado.body.data?.usuario.estado).toBe("INACTIVO");
    expect(actualizarEstadoUsuarioEnBD).toHaveBeenCalledWith(
      "usuario-1",
      "INACTIVO",
    );
  });
});
