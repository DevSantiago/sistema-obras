import { beforeEach, describe, expect, it, vi } from "vitest";

const { autenticacionMock, adjuntoMock, obtenerArchivoMock } = vi.hoisted(
  () => ({
    autenticacionMock: vi.fn(),
    adjuntoMock: vi.fn(),
    obtenerArchivoMock: vi.fn(),
  }),
);

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue({ value: "token" }),
  }),
}));
vi.mock("@/modules/auth/auth.service", () => ({
  obtenerUsuarioAutenticado: autenticacionMock,
}));
vi.mock("@/modules/solicitudes-pago/solicitudes-pago.service", () => ({
  obtenerAdjuntoSolicitudPagoService: adjuntoMock,
}));
vi.mock("@/modules/storage/storage.service", () => ({
  storageService: {
    obtenerArchivo: obtenerArchivoMock,
  },
}));

import { GET } from "../route";

describe("GET /api/v1/solicitudes-pago/{id}/adjuntos/{adjuntoId}", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    autenticacionMock.mockResolvedValue({
      status: 200,
      body: { ok: true, data: { usuario: { id: "usuario-1" } } },
    });
    adjuntoMock.mockResolvedValue({
      status: 200,
      body: {
        ok: true,
        data: {
          nombre_archivo: "factura prueba.pdf",
          ruta_archivo: "solicitudes/factura-prueba.pdf",
          tipo_mime: "application/pdf",
        },
      },
    });
    obtenerArchivoMock.mockResolvedValue(Buffer.from("archivo"));
  });

  it("debe descargar el adjunto autorizado desde el almacenamiento", async () => {
    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({
        id: "solicitud-1",
        adjuntoId: "adjunto-1",
      }),
    });

    expect(response.status).toBe(200);
    expect(adjuntoMock).toHaveBeenCalledWith(
      { id: "usuario-1" },
      "solicitud-1",
      "adjunto-1",
    );
    expect(obtenerArchivoMock).toHaveBeenCalledWith(
      "solicitudes/factura-prueba.pdf",
    );
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toContain(
      "factura prueba.pdf",
    );
  });

  it("debe responder 404 cuando el archivo no está disponible", async () => {
    obtenerArchivoMock.mockRejectedValue(new Error("No existe"));

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({
        id: "solicitud-1",
        adjuntoId: "adjunto-1",
      }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ ok: false });
  });
});
