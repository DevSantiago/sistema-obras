import { beforeEach, describe, expect, it, vi } from "vitest";

const { autenticacionMock, correccionMock } = vi.hoisted(() => ({
  autenticacionMock: vi.fn(),
  correccionMock: vi.fn(),
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
    registrarCorreccionOperacionEfectivoService: correccionMock,
  }),
);

import { POST } from "../route";

describe("POST /api/v1/operaciones-efectivo/{id}/correcciones", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    autenticacionMock.mockResolvedValue({
      status: 200,
      body: { ok: true, data: { usuario: { id: "pagos-1" } } },
    });
    correccionMock.mockResolvedValue({
      status: 201,
      body: { ok: true, message: "Ajuste registrado." },
    });
  });

  it("debe enviar la corrección y la operación al servicio", async () => {
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          tipo: "AJUSTE",
          direccion: "INGRESO",
          valor: 50000,
          motivo: "Diferencia",
          observacion: "Validada",
        }),
      }),
      { params: Promise.resolve({ id: "operacion-1" }) },
    );

    expect(response.status).toBe(201);
    expect(correccionMock).toHaveBeenCalledWith(
      { id: "pagos-1" },
      {
        operacion_efectivo_id: "operacion-1",
        tipo: "AJUSTE",
        direccion: "INGRESO",
        valor: 50000,
        motivo: "Diferencia",
        observacion: "Validada",
      },
    );
  });
});
