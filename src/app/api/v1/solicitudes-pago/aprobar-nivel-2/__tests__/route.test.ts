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
  aprobarSolicitudesNivel2ServiceMock,
} = vi.hoisted(() => ({
  obtenerUsuarioAutenticadoMock: vi.fn(),
  aprobarSolicitudesNivel2ServiceMock: vi.fn(),
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
    aprobarSolicitudesNivel2Service:
      aprobarSolicitudesNivel2ServiceMock,
  }),
);

import { POST } from "../route";

const consoleErrorMock = vi
  .spyOn(console, "error")
  .mockImplementation(() => undefined);

function crearRequest(
  body: unknown = {
    solicitud_ids: ["solicitud-1"],
  },
): Request {
  return new Request(
    "http://localhost/api/v1/solicitudes-pago/aprobar-nivel-2",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
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
        usuario: {
          id: "usuario-1",
          nombre: "Aprobador",
          correo: "aprobador@test.com",
          telefono: null,
          estado: "ACTIVO",
          roles: ["APROBADOR_2"],
          permisos: ["APROBAR_NIVEL_2"],
        },
      },
    },
  });

  aprobarSolicitudesNivel2ServiceMock.mockResolvedValue({
    status: 200,
    body: {
      ok: true,
      message:
        "Solicitudes aprobadas correctamente en nivel 2.",
      data: {
        cantidad_aprobada: 1,
      },
    },
  });
});

describe(
  "POST /api/v1/solicitudes-pago/aprobar-nivel-2",
  () => {
    it("debe propagar la respuesta de autenticación cuando no existe una sesión válida", async () => {
      obtenerUsuarioAutenticadoMock.mockResolvedValue({
        status: 401,
        body: {
          ok: false,
          message:
            "No existe una sesión válida.",
        },
      });

      const response = await POST(crearRequest());
      const body = await response.json();

      expect(response.status).toBe(401);

      expect(body).toEqual({
        ok: false,
        message:
          "No existe una sesión válida.",
      });

      expect(
        aprobarSolicitudesNivel2ServiceMock,
      ).not.toHaveBeenCalled();
    });
    
    it("debe rechazar un cuerpo que no sea JSON válido", async () => {
        const request = new Request(
            "http://localhost/api/v1/solicitudes-pago/aprobar-nivel-2",
            {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: "{json-invalido",
            },
        );

        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(400);

        expect(body).toEqual({
            ok: false,
            message:
            "El cuerpo de la solicitud debe ser un JSON válido.",
        });

        expect(
            aprobarSolicitudesNivel2ServiceMock,
        ).not.toHaveBeenCalled();
    });

    it("debe rechazar un cuerpo JSON que no sea un objeto", async () => {
        const response = await POST(
            crearRequest([
            "solicitud-1",
            "solicitud-2",
            ]),
        );

        const body = await response.json();

        expect(response.status).toBe(400);

        expect(body).toEqual({
            ok: false,
            message:
            "El cuerpo de la solicitud debe ser un objeto JSON válido.",
        });

        expect(
            aprobarSolicitudesNivel2ServiceMock,
        ).not.toHaveBeenCalled();
    });

    it("debe aprobar las solicitudes y propagar la respuesta exitosa del servicio", async () => {
        const payload = {
            solicitud_ids: [
            "solicitud-1",
            "solicitud-2",
            ],
        };

        const response = await POST(
            crearRequest(payload),
        );

        const body = await response.json();

        expect(response.status).toBe(200);

        expect(body).toEqual({
            ok: true,
            message:
            "Solicitudes aprobadas correctamente en nivel 2.",
            data: {
            cantidad_aprobada: 1,
            },
        });

        expect(
            obtenerUsuarioAutenticadoMock,
        ).toHaveBeenCalledWith("token-prueba");

        expect(
            aprobarSolicitudesNivel2ServiceMock,
        ).toHaveBeenCalledTimes(1);

        expect(
            aprobarSolicitudesNivel2ServiceMock,
        ).toHaveBeenCalledWith(
            {
            id: "usuario-1",
            nombre: "Aprobador",
            correo: "aprobador@test.com",
            telefono: null,
            estado: "ACTIVO",
            roles: ["APROBADOR_2"],
            permisos: [
                "APROBAR_NIVEL_2",
            ],
            },
            payload,
        );
        });

        it("debe propagar una respuesta de error del servicio", async () => {
        aprobarSolicitudesNivel2ServiceMock.mockResolvedValue({
            status: 400,
            body: {
            ok: false,
            message:
                "Todas las solicitudes deben estar en estado PENDIENTE_APROBADOR_2.",
            },
        });

        const response = await POST(
            crearRequest({
            solicitud_ids: ["solicitud-1"],
            }),
        );

        const body = await response.json();

        expect(response.status).toBe(400);

        expect(body).toEqual({
            ok: false,
            message:
            "Todas las solicitudes deben estar en estado PENDIENTE_APROBADOR_2.",
        });

        expect(
            aprobarSolicitudesNivel2ServiceMock,
        ).toHaveBeenCalledTimes(1);
        });

        it("debe responder 500 cuando ocurre un error inesperado", async () => {
        const errorInesperado = new Error(
            "Error inesperado de base de datos",
        );

        aprobarSolicitudesNivel2ServiceMock.mockRejectedValue(
            errorInesperado,
        );

        const response = await POST(
            crearRequest({
            solicitud_ids: ["solicitud-1"],
            }),
        );

        const body = await response.json();

        expect(response.status).toBe(500);

        expect(body).toEqual({
            ok: false,
            message:
            "No fue posible aprobar las solicitudes de pago en nivel 2.",
        });

        expect(consoleErrorMock).toHaveBeenCalledWith(
            "Error aprobando solicitudes de pago en nivel 2:",
            errorInesperado,
        );
    });
  },
);

afterAll(() => {
  consoleErrorMock.mockRestore();
});