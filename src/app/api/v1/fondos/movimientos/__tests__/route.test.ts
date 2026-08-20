import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  obtenerUsuarioAutenticadoMock,
  consultarMovimientosFondoServiceMock,
} = vi.hoisted(() => ({
  obtenerUsuarioAutenticadoMock: vi.fn(),
  consultarMovimientosFondoServiceMock: vi.fn(),
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
  consultarMovimientosFondoService:
    consultarMovimientosFondoServiceMock,
}));

import { GET } from "../route";

const usuario = {
  id: "usuario-1",
  roles: ["DIRECTOR"],
  permisos: ["CONSULTAR_FONDOS"],
};

describe("GET /api/v1/fondos/movimientos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obtenerUsuarioAutenticadoMock.mockResolvedValue({
      status: 200,
      body: { ok: true, data: { usuario } },
    });
    consultarMovimientosFondoServiceMock.mockResolvedValue({
      status: 200,
      body: {
        ok: true,
        data: {
          movimientos: [],
          tipos_movimiento: [],
        },
      },
    });
  });

  it("debe enviar todos los filtros al servicio", async () => {
    const response = await GET(
      new Request(
        "http://localhost/api/v1/fondos/movimientos" +
          "?proyecto_base_id=proyecto-1" +
          "&centro_costo_id=centro-1" +
          "&linea_negocio=OBRA" +
          "&fase_centro_costo=EJECUCION" +
          "&direccion=EGRESO" +
          "&tipo_movimiento=EGRESO_SOLICITUD_PAGO",
      ),
    );

    expect(response.status).toBe(200);
    expect(
      consultarMovimientosFondoServiceMock,
    ).toHaveBeenCalledWith(usuario, {
      proyecto_base_id: "proyecto-1",
      centro_costo_id: "centro-1",
      linea_negocio: "OBRA",
      fase_centro_costo: "EJECUCION",
      direccion: "EGRESO",
      tipo_movimiento: "EGRESO_SOLICITUD_PAGO",
    });
  });

  it("debe conservar la respuesta de autorización", async () => {
    consultarMovimientosFondoServiceMock.mockResolvedValue({
      status: 403,
      body: {
        ok: false,
        message:
          "No tiene permisos para consultar los movimientos financieros.",
      },
    });

    const response = await GET(
      new Request("http://localhost/api/v1/fondos/movimientos"),
    );

    expect(response.status).toBe(403);
  });
});
