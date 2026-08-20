import { beforeEach, describe, expect, it, vi } from "vitest";

const { obtenerUsuarioAutenticadoMock, consultarFondosServiceMock } =
  vi.hoisted(() => ({
    obtenerUsuarioAutenticadoMock: vi.fn(),
    consultarFondosServiceMock: vi.fn(),
  }));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue({ value: "token-prueba" }),
  }),
}));

vi.mock("@/modules/auth/auth.service", () => ({
  obtenerUsuarioAutenticado: obtenerUsuarioAutenticadoMock,
}));

vi.mock("@/modules/fondos/fondos.service", () => ({
  consultarFondosService: consultarFondosServiceMock,
}));

import { GET } from "../route";

const usuario = {
  id: "usuario-1",
  roles: ["DIRECTOR"],
  permisos: ["CONSULTAR_FONDOS"],
};

describe("GET /api/v1/fondos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obtenerUsuarioAutenticadoMock.mockResolvedValue({
      status: 200,
      body: { ok: true, data: { usuario } },
    });
  });

  it("debe consultar los fondos con el usuario autenticado", async () => {
    consultarFondosServiceMock.mockResolvedValue({
      status: 200,
      body: {
        ok: true,
        data: { proyectos: [] },
      },
    });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(consultarFondosServiceMock).toHaveBeenCalledWith(usuario);
  });

  it("debe conservar la respuesta de autorización del servicio", async () => {
    consultarFondosServiceMock.mockResolvedValue({
      status: 403,
      body: {
        ok: false,
        message: "No tiene permisos para consultar los fondos.",
      },
    });

    const response = await GET();

    expect(response.status).toBe(403);
  });
});
