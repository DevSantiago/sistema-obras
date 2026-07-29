import { beforeEach, describe, expect, it, vi } from "vitest";

const { autenticacionMock, servicioMock } = vi.hoisted(() => ({
  autenticacionMock: vi.fn(),
  servicioMock: vi.fn(),
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
    registrarReingresoSobranteService: servicioMock,
  }),
);

import { POST } from "../route";

describe("POST /api/v1/operaciones-efectivo/{id}/reingresos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    autenticacionMock.mockResolvedValue({
      status: 200,
      body: { ok: true, data: { usuario: { id: "pagos-1" } } },
    });
    servicioMock.mockResolvedValue({
      status: 201,
      body: { ok: true, message: "Reingreso registrado." },
    });
  });

  it("debe enviar valor y soporte sin fecha manual", async () => {
    const formData = new FormData();
    formData.set("valor", "100000");
    formData.set(
      "soporte",
      new File(["x"], "reingreso.pdf", {
        type: "application/pdf",
      }),
    );

    const response = await POST(
      new Request("http://localhost/reingresos", {
        method: "POST",
        body: formData,
      }),
      { params: Promise.resolve({ id: "operacion-1" }) },
    );

    expect(response.status).toBe(201);
    expect(servicioMock).toHaveBeenCalledWith(
      { id: "pagos-1" },
      expect.objectContaining({
        operacion_efectivo_id: "operacion-1",
        valor: 100000,
        soporte: expect.any(File),
      }),
    );
    expect(servicioMock.mock.calls[0][1]).not.toHaveProperty(
      "fecha_reingreso",
    );
  });

  it("debe exigir soporte", async () => {
    const formData = new FormData();
    formData.set("valor", "100000");

    const response = await POST(
      new Request("http://localhost/reingresos", {
        method: "POST",
        body: formData,
      }),
      { params: Promise.resolve({ id: "operacion-1" }) },
    );

    expect(response.status).toBe(400);
    expect(servicioMock).not.toHaveBeenCalled();
  });
});
