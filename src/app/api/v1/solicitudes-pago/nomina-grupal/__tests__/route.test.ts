import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  generarPlantillaNominaGrupalExcelMock,
  obtenerUsuarioAutenticadoMock,
} = vi.hoisted(() => ({
  generarPlantillaNominaGrupalExcelMock: vi.fn(),
  obtenerUsuarioAutenticadoMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue({ value: "token-prueba" }),
  }),
}));

vi.mock("@/modules/auth/auth.service", () => ({
  obtenerUsuarioAutenticado: obtenerUsuarioAutenticadoMock,
}));

vi.mock(
  "@/modules/solicitudes-pago/nomina-grupal/nomina-grupal.excel",
  () => ({
    generarPlantillaNominaGrupalExcel:
      generarPlantillaNominaGrupalExcelMock,
    leerExcelNominaGrupal: vi.fn(),
  }),
);

vi.mock(
  "@/modules/solicitudes-pago/nomina-grupal/nomina-grupal.repository",
  () => ({
    crearAdjuntoNominaGrupalRepository: vi.fn(),
    eliminarAdjuntoNominaGrupalRepository: vi.fn(),
    obtenerAdjuntoNominaGrupalPorIdRepository: vi.fn(),
    obtenerNominaGrupalPorSolicitudIdRepository: vi.fn(),
  }),
);

vi.mock(
  "@/modules/solicitudes-pago/nomina-grupal/nomina-grupal.service",
  () => ({
    actualizarNominaGrupalService: vi.fn(),
    crearNominaGrupalService: vi.fn(),
    validarNominaGrupalService: vi.fn(),
  }),
);

import { GET } from "../route";

const usuario = {
  id: "usuario-1",
  nombre: "Usuario de prueba",
  correo: "usuario@test.com",
  telefono: "3001234567",
  estado: "ACTIVO",
  roles: ["DIRECTOR"],
  permisos: ["CREAR_SOLICITUDES"],
};

beforeEach(() => {
  vi.clearAllMocks();
  obtenerUsuarioAutenticadoMock.mockResolvedValue({
    status: 200,
    body: {
      ok: true,
      message: "Sesión válida.",
      data: { usuario },
    },
  });
  generarPlantillaNominaGrupalExcelMock.mockResolvedValue(
    Buffer.from("contenido-xlsx"),
  );
});

describe("GET /api/v1/solicitudes-pago/nomina-grupal", () => {
  it("descarga la plantilla Excel para un usuario autenticado", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="plantilla-nomina-grupal.xlsx"',
    );
    expect(await response.arrayBuffer()).toEqual(
      Uint8Array.from(Buffer.from("contenido-xlsx")).buffer,
    );
    expect(generarPlantillaNominaGrupalExcelMock).toHaveBeenCalledTimes(1);
  });

  it("rechaza la descarga cuando no existe una sesión válida", async () => {
    obtenerUsuarioAutenticadoMock.mockResolvedValue({
      status: 401,
      body: {
        ok: false,
        message: "No autenticado.",
      },
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      ok: false,
      message: "No autenticado.",
    });
    expect(generarPlantillaNominaGrupalExcelMock).not.toHaveBeenCalled();
  });
});
