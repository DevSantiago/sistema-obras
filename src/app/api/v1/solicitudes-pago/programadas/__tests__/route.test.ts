import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  obtenerUsuarioAutenticadoMock,
  listarBandejaPagosServiceMock,
} = vi.hoisted(() => ({
  obtenerUsuarioAutenticadoMock: vi.fn(),
  listarBandejaPagosServiceMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue({
      value: "token-prueba",
    }),
  }),
}));

vi.mock("@/modules/auth/auth.service", () => ({
  obtenerUsuarioAutenticado: obtenerUsuarioAutenticadoMock,
}));

vi.mock(
  "@/modules/solicitudes-pago/solicitudes-pago.service",
  () => ({
    listarBandejaPagosService: listarBandejaPagosServiceMock,
  }),
);

import { GET } from "../route";

const usuarioPagos = {
  id: "pagos-1",
  nombre: "Pagos",
  correo: "pagos@test.com",
  roles: ["PAGOS"],
  permisos: ["MARCAR_COMO_PAGADO"],
};

describe("GET /api/v1/solicitudes-pago/programadas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obtenerUsuarioAutenticadoMock.mockResolvedValue({
      status: 200,
      body: {
        ok: true,
        data: { usuario: usuarioPagos },
      },
    });
    listarBandejaPagosServiceMock.mockResolvedValue({
      status: 200,
      body: {
        ok: true,
        data: { solicitudes: [] },
      },
    });
  });

  it("debe consultar la bandeja con los filtros recibidos", async () => {
    const response = await GET(
      new Request(
        "http://localhost/api/v1/solicitudes-pago/programadas?medio_pago=transferencia&proyecto_base_id=proyecto-1",
      ),
    );

    expect(response.status).toBe(200);
    expect(listarBandejaPagosServiceMock).toHaveBeenCalledWith(
      usuarioPagos,
      {
        proyecto_base_id: "proyecto-1",
        centro_costo_id: undefined,
        medio_pago: "TRANSFERENCIA",
        busqueda: undefined,
      },
    );
  });

  it("debe conservar la respuesta de autenticación fallida", async () => {
    obtenerUsuarioAutenticadoMock.mockResolvedValue({
      status: 401,
      body: {
        ok: false,
        message: "No autenticado.",
      },
    });

    const response = await GET(
      new Request(
        "http://localhost/api/v1/solicitudes-pago/programadas",
      ),
    );

    expect(response.status).toBe(401);
    expect(listarBandejaPagosServiceMock).not.toHaveBeenCalled();
  });
});
