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
  registrarPrestamoEntreProyectosService: servicioMock,
}));

import { POST } from "../route";

describe("POST /api/v1/prestamos/entre-proyectos", () => {
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
  });

  it("debe enviar los proyectos y soporte sin solicitar fecha", async () => {
    const formData = new FormData();
    formData.set("proyecto_origen_id", "proyecto-origen");
    formData.set("proyecto_destino_id", "proyecto-destino");
    formData.set("valor", "300000");
    formData.set(
      "soporte",
      new File(["x"], "prestamo.pdf", {
        type: "application/pdf",
      }),
    );

    const response = await POST(
      new Request(
        "http://localhost/api/v1/prestamos/entre-proyectos",
        {
          method: "POST",
          body: formData,
        },
      ),
    );

    expect(response.status).toBe(201);
    expect(servicioMock).toHaveBeenCalledWith(
      { id: "usuario-1" },
      expect.objectContaining({
        proyecto_origen_id: "proyecto-origen",
        proyecto_destino_id: "proyecto-destino",
        valor: 300000,
        soporte: expect.any(File),
      }),
    );
    expect(servicioMock.mock.calls[0][1]).not.toHaveProperty(
      "fecha_prestamo",
    );
  });

  it("debe exigir el soporte", async () => {
    const formData = new FormData();
    formData.set("proyecto_origen_id", "proyecto-origen");
    formData.set("proyecto_destino_id", "proyecto-destino");
    formData.set("valor", "300000");

    const response = await POST(
      new Request(
        "http://localhost/api/v1/prestamos/entre-proyectos",
        {
          method: "POST",
          body: formData,
        },
      ),
    );

    expect(response.status).toBe(400);
    expect(servicioMock).not.toHaveBeenCalled();
  });
});
