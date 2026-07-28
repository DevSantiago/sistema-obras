import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  obtenerUsuarioAutenticadoMock,
  registrarOperacionEfectivoServiceMock,
} = vi.hoisted(() => ({
  obtenerUsuarioAutenticadoMock: vi.fn(),
  registrarOperacionEfectivoServiceMock: vi.fn(),
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
    registrarOperacionEfectivoService:
      registrarOperacionEfectivoServiceMock,
  }),
);

import { POST } from "../route";

const usuarioPagos = {
  id: "pagos-1",
  roles: ["PAGOS"],
  permisos: ["MARCAR_COMO_PAGADO"],
};

describe("POST /api/v1/solicitudes-pago/registrar-operacion-efectivo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obtenerUsuarioAutenticadoMock.mockResolvedValue({
      status: 200,
      body: { ok: true, data: { usuario: usuarioPagos } },
    });
    registrarOperacionEfectivoServiceMock.mockResolvedValue({
      status: 200,
      body: { ok: true, data: { solicitudes: [] } },
    });
  });

  it("debe asociar el soporte del retiro y los soportes de pagos", async () => {
    const formData = new FormData();
    formData.append(
      "operacion",
      JSON.stringify({
        fecha_retiro: "2026-07-27",
        valor_retirado: 80000,
        reintegrar_sobrante: true,
        archivo_retiro_campo: "soporte_retiro",
        detalles: [
          {
            solicitud_id: "solicitud-1",
            numero_comprobante: "CON-001",
            archivo_campo: "soporte_pago_0",
          },
        ],
      }),
    );
    formData.append(
      "soporte_retiro",
      new File(["retiro"], "retiro.pdf", {
        type: "application/pdf",
      }),
    );
    formData.append(
      "soporte_pago_0",
      new File(["pago"], "pago.pdf", {
        type: "application/pdf",
      }),
    );

    const response = await POST(
      new Request(
        "http://localhost/api/v1/solicitudes-pago/registrar-operacion-efectivo",
        { method: "POST", body: formData },
      ),
    );

    expect(response.status).toBe(200);
    expect(registrarOperacionEfectivoServiceMock).toHaveBeenCalledWith(
      usuarioPagos,
      expect.objectContaining({
        valor_retirado: 80000,
        soporte_retiro: expect.any(File),
        detalles: [
          expect.objectContaining({
            solicitud_id: "solicitud-1",
            soporte: expect.any(File),
          }),
        ],
      }),
    );
  });

  it("debe rechazar la operación si falta un soporte", async () => {
    const formData = new FormData();
    formData.append(
      "operacion",
      JSON.stringify({
        archivo_retiro_campo: "soporte_retiro",
        detalles: [
          {
            solicitud_id: "solicitud-1",
            archivo_campo: "soporte_pago_0",
          },
        ],
      }),
    );
    formData.append(
      "soporte_retiro",
      new File(["retiro"], "retiro.pdf", {
        type: "application/pdf",
      }),
    );

    const response = await POST(
      new Request(
        "http://localhost/api/v1/solicitudes-pago/registrar-operacion-efectivo",
        { method: "POST", body: formData },
      ),
    );

    expect(response.status).toBe(400);
    expect(registrarOperacionEfectivoServiceMock).not.toHaveBeenCalled();
  });
});
