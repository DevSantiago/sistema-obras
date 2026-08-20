import { beforeEach, describe, expect, it, vi } from "vitest";

const { autenticacionMock, consultaMock } = vi.hoisted(() => ({
  autenticacionMock: vi.fn(),
  consultaMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue({ value: "token" }),
  }),
}));
vi.mock("@/modules/auth/auth.service", () => ({
  obtenerUsuarioAutenticado: autenticacionMock,
}));
vi.mock(
  "@/modules/operaciones-efectivo/operaciones-efectivo.service",
  () => ({
    consultarOperacionesEfectivoService: consultaMock,
  }),
);

import { GET } from "../route";

describe("GET /api/v1/operaciones-efectivo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    autenticacionMock.mockResolvedValue({
      status: 200,
      body: { ok: true, data: { usuario: { id: "pagos-1" } } },
    });
    consultaMock.mockResolvedValue({
      status: 200,
      body: { ok: true, data: { operaciones: [] } },
    });
  });

  it("debe enviar los filtros al servicio", async () => {
    const response = await GET(
      new Request(
        "http://localhost/api/v1/operaciones-efectivo" +
          "?proyecto_base_id=proyecto-1" +
          "&fondo_id=fondo-1" +
          "&fecha_desde=2026-07-01" +
          "&fecha_hasta=2026-07-31" +
          "&solo_pendientes=true",
      ),
    );

    expect(response.status).toBe(200);
    expect(consultaMock).toHaveBeenCalledWith(
      { id: "pagos-1" },
      {
        proyecto_base_id: "proyecto-1",
        fondo_id: "fondo-1",
        fecha_desde: "2026-07-01",
        fecha_hasta: "2026-07-31",
        solo_pendientes: true,
      },
    );
  });
});
