import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const {
  obtenerUsuarioAutenticadoMock,
  crearSolicitudReembolsoServiceMock,
  registrarAdjuntosSolicitudPagoServiceMock,
  eliminarArchivoMock,
} = vi.hoisted(() => ({
  obtenerUsuarioAutenticadoMock: vi.fn(),
  crearSolicitudReembolsoServiceMock: vi.fn(),
  registrarAdjuntosSolicitudPagoServiceMock:
    vi.fn(),
  eliminarArchivoMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue({
      value: "token-prueba",
    }),
  }),
}));

vi.mock("@/modules/auth/auth.service", () => ({
  obtenerUsuarioAutenticado:
    obtenerUsuarioAutenticadoMock,
}));

vi.mock(
  "@/modules/solicitudes-pago/solicitudes-pago.service",
  () => ({
    crearSolicitudReembolsoService:
      crearSolicitudReembolsoServiceMock,

    registrarAdjuntosSolicitudPagoService:
      registrarAdjuntosSolicitudPagoServiceMock,
  }),
);

vi.mock("@/modules/storage/storage.service", () => ({
  storageService: {
    eliminarArchivo: eliminarArchivoMock,
  },
}));

import { POST } from "../route";

const consoleErrorMock = vi
  .spyOn(console, "error")
  .mockImplementation(() => undefined);

const usuario = {
  id: "usuario-1",
  nombre: "Usuario",
  correo: "usuario@test.com",
  telefono: null,
  estado: "ACTIVO",
  roles: ["SOLICITANTE"],
  permisos: [],
};

function crearFormDataBase(): FormData {
  const formData = new FormData();

  formData.set("proyecto_base_id", "proyecto-1");
  formData.set("centro_costo_id", "centro-1");
  formData.set("beneficiario_id", "trabajador-1");
  formData.set(
    "categoria_reembolso",
    "TRANSPORTE",
  );
  formData.set("medio_pago", "TRANSFERENCIA");
  formData.set(
    "descripcion",
    "Reembolso de transporte",
  );
  formData.set("valor_bruto", "500000");
  formData.set("valor_impuestos", "95000");
  formData.set("valor_retenciones", "25000");
  formData.set("valor_descuentos", "10000");

  return formData;
}

function crearRequest(formData: FormData): Request {
  return new Request(
    "http://localhost/api/v1/solicitudes-pago/reembolsos",
    {
      method: "POST",
      body: formData,
    },
  );
}

beforeEach(() => {
  vi.clearAllMocks();

  obtenerUsuarioAutenticadoMock.mockResolvedValue({
    status: 200,
    body: {
      ok: true,
      message: "Sesión válida.",
      data: {
        usuario,
      },
    },
  });

  crearSolicitudReembolsoServiceMock.mockResolvedValue({
    status: 201,
    body: {
      ok: true,
      message:
        "Solicitud de reembolso creada correctamente.",
      data: {
        solicitud: {
          id: "solicitud-1",
          numero_solicitud:
            "SOL-PRO-OBRA-HUMAPO-2026-000004",
          tipo_solicitud: "REEMBOLSO",
        },
      },
    },
  });

  registrarAdjuntosSolicitudPagoServiceMock.mockResolvedValue(
    {
      count: 1,
      archivos: [
        {
          nombre_archivo: "soporte.pdf",
          nombre_bucket: "LOCAL",
          ruta_archivo:
            "storage/reembolsos/uuid-soporte.pdf",
          tipo_mime: "application/pdf",
          tamano_archivo: BigInt(100),
        },
      ],
    },
  );

  eliminarArchivoMock.mockResolvedValue(undefined);
});

describe(
  "POST /api/v1/solicitudes-pago/reembolsos",
  () => {
    it("debe rechazar una solicitud sin soportes", async () => {
      const response = await POST(
        crearRequest(crearFormDataBase()),
      );

      const body = await response.json();

      expect(response.status).toBe(400);

      expect(body.message).toBe(
        "Debe adjuntar al menos un soporte para crear el reembolso.",
      );

      expect(
        crearSolicitudReembolsoServiceMock,
      ).not.toHaveBeenCalled();

      expect(
        registrarAdjuntosSolicitudPagoServiceMock,
      ).not.toHaveBeenCalled();
    });

    it("debe rechazar más de diez archivos", async () => {
      const formData = crearFormDataBase();

      for (
        let indice = 0;
        indice < 11;
        indice += 1
      ) {
        formData.append(
          "archivos",
          new File(
            ["contenido"],
            `soporte-${indice}.pdf`,
            {
              type: "application/pdf",
            },
          ),
        );
      }

      const response = await POST(
        crearRequest(formData),
      );

      const body = await response.json();

      expect(response.status).toBe(400);

      expect(body.message).toBe(
        "Solo se permiten máximo 10 archivos por reembolso.",
      );

      expect(
        registrarAdjuntosSolicitudPagoServiceMock,
      ).not.toHaveBeenCalled();
    });

    it("debe rechazar una extensión no permitida", async () => {
      const formData = crearFormDataBase();

      formData.append(
        "archivos",
        new File(["contenido"], "soporte.exe", {
          type: "application/octet-stream",
        }),
      );

      const response = await POST(
        crearRequest(formData),
      );

      const body = await response.json();

      expect(response.status).toBe(400);

      expect(body.message).toBe(
        'El archivo "soporte.exe" debe ser PDF, JPG, JPEG o PNG.',
      );

      expect(
        registrarAdjuntosSolicitudPagoServiceMock,
      ).not.toHaveBeenCalled();
    });

    it("debe crear la solicitud y registrar sus soportes", async () => {
      const formData = crearFormDataBase();

      formData.append(
        "archivos",
        new File(["contenido"], "soporte.pdf", {
          type: "application/pdf",
        }),
      );

      const response = await POST(
        crearRequest(formData),
      );

      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.ok).toBe(true);

      expect(body.data.solicitud.id).toBe(
        "solicitud-1",
      );

      expect(body.data.soportes).toEqual([
        {
          nombre_archivo: "soporte.pdf",
          ruta_archivo:
            "storage/reembolsos/uuid-soporte.pdf",
          tipo_mime: "application/pdf",
          tamano_archivo: 100,
        },
      ]);

      expect(
        crearSolicitudReembolsoServiceMock,
      ).toHaveBeenCalledWith(usuario, {
        tipo_solicitud: "REEMBOLSO",
        proyecto_base_id: "proyecto-1",
        centro_costo_id: "centro-1",
        beneficiario_id: "trabajador-1",
        categoria_reembolso: "TRANSPORTE",
        medio_pago: "TRANSFERENCIA",
        descripcion: "Reembolso de transporte",
        valor_bruto: 500000,
        valor_impuestos: 95000,
        valor_retenciones: 25000,
        valor_descuentos: 10000,
      });

      expect(
        registrarAdjuntosSolicitudPagoServiceMock,
      ).toHaveBeenCalledTimes(1);

      expect(
        registrarAdjuntosSolicitudPagoServiceMock,
      ).toHaveBeenCalledWith({
        solicitudPagoId: "solicitud-1",
        archivos: [
          expect.objectContaining({
            name: "soporte.pdf",
            type: "application/pdf",
          }),
        ],
        usuarioId: "usuario-1",
        carpeta: "reembolsos",
      });

      expect(
        eliminarArchivoMock,
      ).not.toHaveBeenCalled();
    });

    it("debe responder 500 si falla el registro de adjuntos", async () => {
      const formData = crearFormDataBase();

      formData.append(
        "archivos",
        new File(["contenido"], "soporte.pdf", {
          type: "application/pdf",
        }),
      );

      registrarAdjuntosSolicitudPagoServiceMock.mockRejectedValue(
        new Error("Error de base de datos"),
      );

      const response = await POST(
        crearRequest(formData),
      );

      const body = await response.json();

      expect(response.status).toBe(500);

      expect(body.message).toBe(
        "Error de base de datos",
      );

      expect(consoleErrorMock).toHaveBeenCalledWith(
        "Error creando solicitud de reembolso:",
        expect.any(Error),
      );

      expect(
        registrarAdjuntosSolicitudPagoServiceMock,
      ).toHaveBeenCalledTimes(1);

      expect(
        eliminarArchivoMock,
      ).not.toHaveBeenCalled();
    });

    it("debe propagar la respuesta del servicio cuando la solicitud es inválida", async () => {
      const formData = crearFormDataBase();

      formData.append(
        "archivos",
        new File(["contenido"], "soporte.pdf", {
          type: "application/pdf",
        }),
      );

      crearSolicitudReembolsoServiceMock.mockResolvedValue({
        status: 400,
        body: {
          ok: false,
          message:
            "La categoría de reembolso no es válida.",
        },
      });

      const response = await POST(
        crearRequest(formData),
      );

      const body = await response.json();

      expect(response.status).toBe(400);

      expect(body.message).toBe(
        "La categoría de reembolso no es válida.",
      );

      expect(
        registrarAdjuntosSolicitudPagoServiceMock,
      ).not.toHaveBeenCalled();
    });
  },
);

afterAll(() => {
  consoleErrorMock.mockRestore();
});