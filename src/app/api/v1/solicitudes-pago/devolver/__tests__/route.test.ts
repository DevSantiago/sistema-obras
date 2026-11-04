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
  devolverSolicitudesPagoService: devolverMock,
}));

import { POST } from "../route";

describe("POST /api/v1/solicitudes-pago/devolver", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({
      status: 200,
      body: { ok: true, data: { usuario: { id: "usuario-1" } } },
    });
    devolverMock.mockResolvedValue({
      status: 200,
      body: { ok: true, data: { cantidad_devuelta: 2 } },
    });
  });

  it("interpreta los datos y archivos del multipart de devolución grupal", async () => {
    const formData = new FormData();
    formData.set(
      "datos",
      JSON.stringify({
        solicitud_ids: ["solicitud-1", "solicitud-2"],
        motivo: "Adjuntar soporte actualizado",
      }),
    );
    const archivo = new File(["pdf"], "soporte.pdf", {
      type: "application/pdf",
    });
    formData.append("archivos", archivo);

    const response = await POST(
      new Request("http://localhost/api/v1/solicitudes-pago/devolver", {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(200);
    expect(devolverMock).toHaveBeenCalledWith(
      { id: "usuario-1" },
      expect.objectContaining({
        solicitud_ids: ["solicitud-1", "solicitud-2"],
        motivo: "Adjuntar soporte actualizado",
        archivos: [expect.objectContaining({ name: "soporte.pdf" })],
      }),
    );
  });
});
