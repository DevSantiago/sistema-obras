import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, devolverMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  devolverMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue({ value: "token-prueba" }),
  }),
}));

vi.mock("@/modules/auth/auth.service", () => ({
  obtenerUsuarioAutenticado: authMock,
}));

vi.mock("@/modules/solicitudes-pago/solicitudes-pago.service", () => ({
  devolverSolicitudPagoService: devolverMock,
}));

import { POST } from "../route";

describe("POST /api/v1/solicitudes-pago/{id}/devolver", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({
      status: 200,
      body: { ok: true, data: { usuario: { id: "usuario-1" } } },
    });
    devolverMock.mockResolvedValue({
      status: 200,
      body: { ok: true, data: { estado_destino: "DEVUELTA_APROBADOR_1" } },
    });
  });

  it("interpreta los datos y archivos del multipart de devolución individual", async () => {
    const formData = new FormData();
    formData.set("datos", JSON.stringify({ motivo: "Corregir el soporte" }));
    const archivo = new File(["imagen"], "evidencia.png", {
      type: "image/png",
    });
    formData.append("archivos", archivo);

    const response = await POST(
      new Request("http://localhost/api/v1/solicitudes-pago/solicitud-1/devolver", {
        method: "POST",
        body: formData,
      }),
      { params: Promise.resolve({ id: "solicitud-1" }) },
    );

    expect(response.status).toBe(200);
    expect(devolverMock).toHaveBeenCalledWith(
      { id: "usuario-1" },
      "solicitud-1",
      expect.objectContaining({
        motivo: "Corregir el soporte",
        archivos: [expect.objectContaining({ name: "evidencia.png" })],
      }),
    );
  });
});
