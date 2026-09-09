import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  obtenerArchivoMock,
  obtenerSolicitudPagoPorIdServiceMock,
  obtenerUsuarioAutenticadoMock,
} = vi.hoisted(() => ({
  obtenerArchivoMock: vi.fn(),
  obtenerSolicitudPagoPorIdServiceMock: vi.fn(),
  obtenerUsuarioAutenticadoMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue({ value: "token-prueba" }),
  }),
}));

vi.mock("@/modules/auth/auth.service", () => ({
  obtenerUsuarioAutenticado: obtenerUsuarioAutenticadoMock,
}));

vi.mock("@/modules/solicitudes-pago/solicitudes-pago.service", () => ({
  obtenerSolicitudPagoPorIdService:
    obtenerSolicitudPagoPorIdServiceMock,
}));

vi.mock("@/modules/storage/storage.service", () => ({
  storageService: {
    guardarArchivo: vi.fn(),
    eliminarArchivo: vi.fn(),
    obtenerArchivo: obtenerArchivoMock,
  },
}));

import { GET } from "../route";

beforeEach(() => {
  vi.clearAllMocks();
  obtenerUsuarioAutenticadoMock.mockResolvedValue({
    status: 200,
    body: {
      ok: true,
      message: "Sesión válida.",
      data: {
        usuario: {
          id: "usuario-1",
          roles: ["DIRECTOR"],
          permisos: ["CREAR_SOLICITUDES"],
        },
      },
    },
  });
  obtenerSolicitudPagoPorIdServiceMock.mockResolvedValue({
    status: 200,
    body: {
      ok: true,
      message: "Solicitud consultada.",
      data: {
        solicitud: {
          archivo_origen: {
            nombre_archivo: "nomina-septiembre.xlsx",
            nombre_bucket: "dimensiones-obras-stg",
            ruta_archivo: "nomina-grupal/archivo-generado.xlsx",
            tipo_mime:
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            tamano_archivo: 14,
          },
        },
      },
    },
  });
  obtenerArchivoMock.mockResolvedValue(Buffer.from("contenido-xlsx"));
});

describe("GET /api/v1/solicitudes-pago/:id/archivo", () => {
  it("descarga el Excel desde el proveedor configurado", async () => {
    const response = await GET(
      new Request("http://localhost/api/v1/solicitudes-pago/solicitud-1/archivo"),
      {
        params: Promise.resolve({ id: "solicitud-1" }),
      },
    );

    expect(response.status).toBe(200);
    expect(obtenerArchivoMock).toHaveBeenCalledWith(
      "nomina-grupal/archivo-generado.xlsx",
    );
    expect(response.headers.get("content-disposition")).toContain(
      'filename="nomina-septiembre.xlsx"',
    );
    expect(await response.arrayBuffer()).toEqual(
      Uint8Array.from(Buffer.from("contenido-xlsx")).buffer,
    );
  });

  it("responde 404 cuando el objeto no está disponible", async () => {
    obtenerArchivoMock.mockRejectedValue(new Error("No existe"));

    const response = await GET(
      new Request("http://localhost/api/v1/solicitudes-pago/solicitud-1/archivo"),
      {
        params: Promise.resolve({ id: "solicitud-1" }),
      },
    );

    expect(response.status).toBe(404);
  });
});
