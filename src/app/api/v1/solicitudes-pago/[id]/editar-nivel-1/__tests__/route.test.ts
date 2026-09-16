import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  obtenerUsuarioAutenticadoMock,
  editarSolicitudAprobadorNivel1ServiceMock,
  agregarAdjuntosSolicitudNivel1ServiceMock,
} = vi.hoisted(() => ({
  obtenerUsuarioAutenticadoMock: vi.fn(),
  editarSolicitudAprobadorNivel1ServiceMock: vi.fn(),
  agregarAdjuntosSolicitudNivel1ServiceMock: vi.fn(),
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
    editarSolicitudAprobadorNivel1Service:
      editarSolicitudAprobadorNivel1ServiceMock,
    agregarAdjuntosSolicitudNivel1Service:
      agregarAdjuntosSolicitudNivel1ServiceMock,
  }),
);

import { PATCH } from "../route";

const usuario = {
  id: "aprobador-1",
  nombre: "Aprobador",
  correo: "aprobador@example.com",
  telefono: null,
  estado: "ACTIVO",
  roles: ["APROBADOR_NIVEL_1"],
  permisos: ["APROBAR_NIVEL_1"],
};

beforeEach(() => {
  vi.clearAllMocks();
  obtenerUsuarioAutenticadoMock.mockResolvedValue({
    status: 200,
    body: {
      ok: true,
      message: "Sesión válida.",
      data: { usuario },
    },
  });
  editarSolicitudAprobadorNivel1ServiceMock.mockResolvedValue({
    status: 200,
    body: {
      ok: true,
      message: "Solicitud actualizada correctamente.",
      data: { solicitud: { id: "solicitud-1" } },
    },
  });
});

describe("PATCH /api/v1/solicitudes-pago/[id]/editar-nivel-1", () => {
  it("convierte los valores enviados por FormData antes de editar", async () => {
    const formData = new FormData();
    formData.set("beneficiario_id", "beneficiario-1");
    formData.set("categoria", "SERVICIOS");
    formData.set("medio_pago", "TRANSFERENCIA");
    formData.set("descripcion", "Concepto corregido");
    formData.set("valor_bruto", "120000");
    formData.set("valor_retenciones", "20000");
    formData.set("valor_descuentos", "5000");

    const response = await PATCH(
      new Request(
        "http://localhost/api/v1/solicitudes-pago/solicitud-1/editar-nivel-1",
        { method: "PATCH", body: formData },
      ),
      { params: Promise.resolve({ id: "solicitud-1" }) },
    );

    expect(response.status).toBe(200);
    expect(editarSolicitudAprobadorNivel1ServiceMock).toHaveBeenCalledWith(
      usuario,
      "solicitud-1",
      expect.objectContaining({
        valor_bruto: 120000,
        valor_retenciones: 20000,
        valor_descuentos: 5000,
      }),
    );
  });
});
