import { beforeEach, describe, expect, it, vi } from "vitest";

const { obtenerUsuarioAutenticadoMock, registrarPagoNominaGrupalServiceMock } = vi.hoisted(() => ({
  obtenerUsuarioAutenticadoMock: vi.fn(),
  registrarPagoNominaGrupalServiceMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({ get: vi.fn().mockReturnValue({ value: "token-test" }) }),
}));
vi.mock("@/modules/auth/auth.service", () => ({ obtenerUsuarioAutenticado: obtenerUsuarioAutenticadoMock }));
vi.mock("@/modules/solicitudes-pago/solicitudes-pago.service", () => ({ registrarPagoNominaGrupalService: registrarPagoNominaGrupalServiceMock }));

import { POST } from "../route";

describe("POST registrar-nomina-grupal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obtenerUsuarioAutenticadoMock.mockResolvedValue({ status: 200, body: { ok: true, data: { usuario: { id: "u1" } } } });
    registrarPagoNominaGrupalServiceMock.mockResolvedValue({ status: 200, body: { ok: true, data: {} } });
  });

  it("pasa los pagos por fila, su medio y soporte al servicio", async () => {
    const formData = new FormData();
    formData.append("pagos", JSON.stringify([
      { detalle_nomina_id: "fila-1", medio_pago: "EFECTIVO", archivo_campo: "soporte-1" },
      { detalle_nomina_id: "fila-2", medio_pago: "TRANSFERENCIA", numero_comprobante: "TR-2", archivo_campo: "soporte-2" },
    ]));
    formData.append("soporte-1", new File(["a"], "a.pdf", { type: "application/pdf" }));
    formData.append("soporte-2", new File(["b"], "b.pdf", { type: "application/pdf" }));

    const response = await POST(
      new Request("http://localhost/api", { method: "POST", body: formData }),
      { params: Promise.resolve({ id: "solicitud-1" }) },
    );

    expect(response.status).toBe(200);
    expect(registrarPagoNominaGrupalServiceMock).toHaveBeenCalledWith(
      { id: "u1" },
      "solicitud-1",
      expect.arrayContaining([
        expect.objectContaining({ detalle_nomina_id: "fila-1", medio_pago: "EFECTIVO", soporte: expect.any(File) }),
        expect.objectContaining({ detalle_nomina_id: "fila-2", medio_pago: "TRANSFERENCIA", numero_comprobante: "TR-2", soporte: expect.any(File) }),
      ]),
    );
  });

  it("rechaza el manifiesto cuando falta el comprobante de una fila", async () => {
    const formData = new FormData();
    formData.append("pagos", JSON.stringify([{ detalle_nomina_id: "fila-1", archivo_campo: "faltante" }]));
    const response = await POST(
      new Request("http://localhost/api", { method: "POST", body: formData }),
      { params: Promise.resolve({ id: "solicitud-1" }) },
    );
    expect(response.status).toBe(400);
    expect(registrarPagoNominaGrupalServiceMock).not.toHaveBeenCalled();
  });
});
