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
vi.mock("@/modules/prestamos/prestamos.service", () => ({
  registrarDevolucionPrestamoService: servicioMock,
}));

import { POST } from "../route";

describe("POST /api/v1/prestamos/devoluciones", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    autenticacionMock.mockResolvedValue({
      status: 200,
      body: { ok: true, data: { usuario: { id: "usuario-1" } } },
    });
    servicioMock.mockResolvedValue({
      status: 201,
      body: { ok: true, message: "Devolución registrada." },
    });
  });

  it("debe enviar préstamo, valor y soporte sin fecha manual", async () => {
    const formData = new FormData();
    formData.set("prestamo_proyecto_id", "prestamo-1");
    formData.set("valor", "300000");
    formData.set(
      "soporte",
      new File(["x"], "devolucion.pdf", {
        type: "application/pdf",
      }),
    );

    const response = await POST(
      new Request(
        "http://localhost/api/v1/prestamos/devoluciones",
        { method: "POST", body: formData },
      ),
    );

    expect(response.status).toBe(201);
    expect(servicioMock).toHaveBeenCalledWith(
      { id: "usuario-1" },
      expect.objectContaining({
        prestamo_proyecto_id: "prestamo-1",
        valor: 300000,
        soporte: expect.any(File),
      }),
    );
    expect(servicioMock.mock.calls[0][1]).not.toHaveProperty(
      "fecha_devolucion",
    );
  });

  it("debe exigir soporte", async () => {
    const formData = new FormData();
    formData.set("prestamo_proyecto_id", "prestamo-1");
    formData.set("valor", "300000");

    const response = await POST(
      new Request(
        "http://localhost/api/v1/prestamos/devoluciones",
        { method: "POST", body: formData },
      ),
    );

    expect(response.status).toBe(400);
    expect(servicioMock).not.toHaveBeenCalled();
  });
});
