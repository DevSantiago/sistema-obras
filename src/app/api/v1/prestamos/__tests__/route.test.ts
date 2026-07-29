import { beforeEach, describe, expect, it, vi } from "vitest";

const { autenticacionMock, consultaMock, servicioMock } = vi.hoisted(() => ({
  autenticacionMock: vi.fn(),
  consultaMock: vi.fn(),
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
  consultarPrestamosPendientesService: consultaMock,
  registrarPrestamoPersonaService: servicioMock,
}));

import { GET, POST } from "../route";

describe("/api/v1/prestamos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    autenticacionMock.mockResolvedValue({
      status: 200,
      body: { ok: true, data: { usuario: { id: "usuario-1" } } },
    });
    servicioMock.mockResolvedValue({
      status: 201,
      body: { ok: true, message: "Préstamo registrado." },
    });
    consultaMock.mockResolvedValue({
      status: 200,
      body: { ok: true, message: "Préstamos consultados.", data: [] },
    });
  });

  it("debe consultar los préstamos pendientes", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(consultaMock).toHaveBeenCalledWith({ id: "usuario-1" });
  });

  it("debe enviar préstamo y soporte al servicio", async () => {
    const formData = new FormData();
    formData.set("proyecto_base_id", "proyecto-1");
    formData.set("acreedor_id", "acreedor-1");
    formData.set("valor", "800000");
    formData.set(
      "soporte",
      new File(["x"], "prestamo.pdf", {
        type: "application/pdf",
      }),
    );
    const response = await POST(
      new Request("http://localhost/api/v1/prestamos", {
        method: "POST",
        body: formData,
      }),
    );
    expect(servicioMock.mock.calls[0][1]).not.toHaveProperty(
      "fecha_prestamo",
    );

    expect(response.status).toBe(201);
    expect(servicioMock).toHaveBeenCalledWith(
      { id: "usuario-1" },
      expect.objectContaining({
        proyecto_base_id: "proyecto-1",
        acreedor_id: "acreedor-1",
        valor: 800000,
      }),
    );
  });
});
