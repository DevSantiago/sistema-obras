import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  obtenerUsuarioAutenticadoMock,
  registrarTransferenciasServiceMock,
} = vi.hoisted(() => ({
  obtenerUsuarioAutenticadoMock: vi.fn(),
  registrarTransferenciasServiceMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue({ value: "token-prueba" }),
  }),
}));

vi.mock("@/modules/auth/auth.service", () => ({
  obtenerUsuarioAutenticado: obtenerUsuarioAutenticadoMock,
}));

vi.mock(
  "@/modules/solicitudes-pago/solicitudes-pago.service",
  () => ({
    registrarTransferenciasService: registrarTransferenciasServiceMock,
  }),
);

import { POST } from "../route";

const usuarioPagos = {
  id: "pagos-1",
  roles: ["PAGOS"],
  permisos: ["MARCAR_COMO_PAGADO"],
};

describe("POST /api/v1/solicitudes-pago/registrar-pagos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obtenerUsuarioAutenticadoMock.mockResolvedValue({
      status: 200,
      body: { ok: true, data: { usuario: usuarioPagos } },
    });
    registrarTransferenciasServiceMock.mockResolvedValue({
      status: 200,
      body: { ok: true, data: { solicitudes: [] } },
    });
  });

  it("debe asociar un soporte a cada elemento del manifiesto", async () => {
    const formData = new FormData();
    formData.append(
      "pagos",
      JSON.stringify([
        {
          solicitud_id: "solicitud-1",
          numero_comprobante: "TRX-001",
          archivo_campo: "soporte_0",
        },
      ]),
    );
    formData.append(
      "soporte_0",
      new File(["contenido"], "soporte.pdf", {
        type: "application/pdf",
      }),
    );

    const response = await POST(
      new Request(
        "http://localhost/api/v1/solicitudes-pago/registrar-pagos",
        { method: "POST", body: formData },
      ),
    );

    expect(response.status).toBe(200);
    expect(registrarTransferenciasServiceMock).toHaveBeenCalledWith(
      usuarioPagos,
      [
        expect.objectContaining({
          solicitud_id: "solicitud-1",
          numero_comprobante: "TRX-001",
          soporte: expect.any(File),
        }),
      ],
    );
  });

  it("debe rechazar un manifiesto sin soporte", async () => {
    const formData = new FormData();
    formData.append(
      "pagos",
      JSON.stringify([
        {
          solicitud_id: "solicitud-1",
          archivo_campo: "soporte_0",
        },
      ]),
    );

    const response = await POST(
      new Request(
        "http://localhost/api/v1/solicitudes-pago/registrar-pagos",
        { method: "POST", body: formData },
      ),
    );

    expect(response.status).toBe(400);
    expect(registrarTransferenciasServiceMock).not.toHaveBeenCalled();
  });
});
