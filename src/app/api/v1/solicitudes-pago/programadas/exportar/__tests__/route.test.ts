import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  obtenerUsuarioAutenticadoMock,
  listarBandejaPagosServiceMock,
  generarRelacionSolicitudesProgramadasExcelMock,
} = vi.hoisted(() => ({
  obtenerUsuarioAutenticadoMock: vi.fn(),
  listarBandejaPagosServiceMock: vi.fn(),
  generarRelacionSolicitudesProgramadasExcelMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue({ value: "token-prueba" }),
  }),
}));

vi.mock("@/modules/auth/auth.service", () => ({
  obtenerUsuarioAutenticado: obtenerUsuarioAutenticadoMock,
}));

vi.mock("@/modules/solicitudes-pago/solicitudes-pago.service", () => ({
  listarBandejaPagosService: listarBandejaPagosServiceMock,
}));

vi.mock("@/modules/solicitudes-pago/solicitudes-pago.excel", () => ({
  generarRelacionSolicitudesProgramadasExcel:
    generarRelacionSolicitudesProgramadasExcelMock,
}));

import { GET } from "../route";

const usuarioPagos = {
  id: "pagos-1",
  nombre: "Pagos",
  correo: "pagos@test.com",
  roles: ["PAGOS"],
  permisos: ["MARCAR_COMO_PAGADO"],
};

describe("GET /api/v1/solicitudes-pago/programadas/exportar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obtenerUsuarioAutenticadoMock.mockResolvedValue({
      status: 200,
      body: { ok: true, data: { usuario: usuarioPagos } },
    });
    listarBandejaPagosServiceMock.mockResolvedValue({
      status: 200,
      body: { ok: true, data: { solicitudes: [] } },
    });
    generarRelacionSolicitudesProgramadasExcelMock.mockResolvedValue(
      Buffer.from("xlsx"),
    );
  });

  it("aplica los filtros y el flujo elegido al Excel", async () => {
    const transferencia = { id: "1", medio_pago: "TRANSFERENCIA" };
    const efectivo = { id: "2", medio_pago: "EFECTIVO" };
    listarBandejaPagosServiceMock.mockResolvedValue({
      status: 200,
      body: {
        ok: true,
        data: { solicitudes: [transferencia, efectivo] },
      },
    });

    const response = await GET(
      new Request(
        "http://localhost/api/v1/solicitudes-pago/programadas/exportar?proyecto_base_id=proyecto-1&busqueda=proveedor&tipo_operacion=TRANSFERENCIAS",
      ),
    );

    expect(response.status).toBe(200);
    expect(listarBandejaPagosServiceMock).toHaveBeenCalledWith(
      usuarioPagos,
      {
        proyecto_base_id: "proyecto-1",
        centro_costo_id: undefined,
        medio_pago: undefined,
        busqueda: "proveedor",
      },
    );
    expect(generarRelacionSolicitudesProgramadasExcelMock).toHaveBeenCalledWith([
      transferencia,
    ]);
  });

  it("rechaza un flujo de exportación no válido", async () => {
    const response = await GET(
      new Request(
        "http://localhost/api/v1/solicitudes-pago/programadas/exportar?tipo_operacion=OTRO",
      ),
    );

    expect(response.status).toBe(400);
    expect(generarRelacionSolicitudesProgramadasExcelMock).not.toHaveBeenCalled();
  });
});
