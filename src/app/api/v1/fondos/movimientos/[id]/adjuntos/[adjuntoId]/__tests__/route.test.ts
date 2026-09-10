import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  obtenerUsuarioAutenticadoMock,
  obtenerAdjuntoMovimientoFondoServiceMock,
  obtenerArchivoMock,
} = vi.hoisted(() => ({
  obtenerUsuarioAutenticadoMock: vi.fn(),
  obtenerAdjuntoMovimientoFondoServiceMock: vi.fn(),
  obtenerArchivoMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue({ value: "token-prueba" }),
  }),
}));

vi.mock("@/modules/auth/auth.service", () => ({
  obtenerUsuarioAutenticado: obtenerUsuarioAutenticadoMock,
}));

vi.mock("@/modules/fondos/fondos.service", () => ({
  obtenerAdjuntoMovimientoFondoService:
    obtenerAdjuntoMovimientoFondoServiceMock,
}));

vi.mock("@/modules/storage/storage.service", () => ({
  storageService: { obtenerArchivo: obtenerArchivoMock },
}));

import { GET } from "../route";

describe("GET /api/v1/fondos/movimientos/:id/adjuntos/:adjuntoId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obtenerUsuarioAutenticadoMock.mockResolvedValue({
      status: 200,
      body: {
        ok: true,
        data: {
          usuario: {
            id: "usuario-1",
            permisos: ["CONSULTAR_FONDOS"],
            roles: ["DIRECTOR"],
          },
        },
      },
    });
    obtenerAdjuntoMovimientoFondoServiceMock.mockResolvedValue({
      status: 200,
      body: {
        ok: true,
        data: {
          id: "adjunto-1",
          nombre_archivo: "soporte.pdf",
          ruta_archivo: "movimientos/soporte.pdf",
          tipo_mime: "application/pdf",
        },
      },
    });
    obtenerArchivoMock.mockResolvedValue(Buffer.from("contenido"));
  });

  it("debe descargar el soporte autorizado", async () => {
    const response = await GET(
      new Request("http://localhost"),
      {
        params: Promise.resolve({
          id: "movimiento-1",
          adjuntoId: "adjunto-1",
        }),
      },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(obtenerArchivoMock).toHaveBeenCalledWith(
      "movimientos/soporte.pdf",
    );
  });

  it("debe conservar la respuesta cuando el soporte no es visible", async () => {
    obtenerAdjuntoMovimientoFondoServiceMock.mockResolvedValue({
      status: 404,
      body: { ok: false, message: "Soporte no encontrado." },
    });

    const response = await GET(
      new Request("http://localhost"),
      {
        params: Promise.resolve({
          id: "movimiento-1",
          adjuntoId: "adjunto-1",
        }),
      },
    );

    expect(response.status).toBe(404);
    expect(obtenerArchivoMock).not.toHaveBeenCalled();
  });
});
