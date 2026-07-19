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
  crearSolicitudNominaIndividualServiceMock,
  crearSolicitudPagoImpuestoServiceMock,
  crearSolicitudPagoProveedorServiceMock,
  listarSolicitudesPagoServiceMock,
  registrarAdjuntosSolicitudPagoServiceMock,
} = vi.hoisted(() => ({
  obtenerUsuarioAutenticadoMock: vi.fn(),
  crearSolicitudNominaIndividualServiceMock: vi.fn(),
  crearSolicitudPagoImpuestoServiceMock: vi.fn(),
  crearSolicitudPagoProveedorServiceMock: vi.fn(),
  listarSolicitudesPagoServiceMock: vi.fn(),
  registrarAdjuntosSolicitudPagoServiceMock: vi.fn(),
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
    crearSolicitudNominaIndividualService:
      crearSolicitudNominaIndividualServiceMock,
    crearSolicitudPagoImpuestoService:
      crearSolicitudPagoImpuestoServiceMock,
    crearSolicitudPagoProveedorService:
      crearSolicitudPagoProveedorServiceMock,
    listarSolicitudesPagoService:
      listarSolicitudesPagoServiceMock,
    registrarAdjuntosSolicitudPagoService:
      registrarAdjuntosSolicitudPagoServiceMock,
  }),
);

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

const solicitudCreada = {
  id: "solicitud-1",
  numero_solicitud:
    "SOL-PRO-OBRA-HUMAPO-2026-000001",
  tipo_solicitud: "PAGO_PROVEEDOR",
};

function crearRespuestaCreacionExitosa() {
  return {
    status: 201,
    body: {
      ok: true,
      message:
        "Solicitud de pago a proveedor creada correctamente.",
      data: {
        solicitud: solicitudCreada,
      },
    },
  };
}

function crearRequestJson(
  body: Record<string, unknown>,
): Request {
  return new Request(
    "http://localhost/api/v1/solicitudes-pago",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
}

function crearFormDataProveedor(): FormData {
  const formData = new FormData();

  formData.set(
    "tipo_solicitud",
    "PAGO_PROVEEDOR",
  );
  formData.set(
    "proyecto_base_id",
    "proyecto-1",
  );
  formData.set(
    "centro_costo_id",
    "centro-costo-1",
  );
  formData.set(
    "beneficiario_id",
    "proveedor-1",
  );
  formData.set(
    "medio_pago",
    "TRANSFERENCIA",
  );
  formData.set(
    "descripcion",
    "Pago de factura al proveedor",
  );
  formData.set("valor_bruto", "1000000");
  formData.set("valor_impuestos", "190000");
  formData.set("valor_retenciones", "25000");
  formData.set("valor_descuentos", "10000");

  return formData;
}

function crearRequestMultipart(
  formData: FormData,
): Request {
  return new Request(
    "http://localhost/api/v1/solicitudes-pago",
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

  crearSolicitudPagoProveedorServiceMock.mockResolvedValue(
    crearRespuestaCreacionExitosa(),
  );

  crearSolicitudPagoImpuestoServiceMock.mockResolvedValue({
    status: 201,
    body: {
      ok: true,
      message:
        "Solicitud de pago de impuesto creada correctamente.",
      data: {
        solicitud: {
          ...solicitudCreada,
          tipo_solicitud: "PAGO_IMPUESTO",
        },
      },
    },
  });

  crearSolicitudNominaIndividualServiceMock.mockResolvedValue({
    status: 201,
    body: {
      ok: true,
      message:
        "Solicitud de nómina individual creada correctamente.",
      data: {
        solicitud: {
          ...solicitudCreada,
          tipo_solicitud: "PAGO_NOMINA",
        },
      },
    },
  });

  registrarAdjuntosSolicitudPagoServiceMock.mockResolvedValue(
    undefined,
  );
});

describe("POST /api/v1/solicitudes-pago", () => {
  it("debe mantener la creación mediante application/json", async () => {
    const payload = {
      tipo_solicitud: "PAGO_PROVEEDOR",
      proyecto_base_id: "proyecto-1",
      centro_costo_id: "centro-costo-1",
      beneficiario_id: "proveedor-1",
      medio_pago: "TRANSFERENCIA",
      descripcion: "Pago de factura al proveedor",
      valor_bruto: 1000000,
      valor_impuestos: 190000,
      valor_retenciones: 25000,
      valor_descuentos: 10000,
    };

    const response = await POST(
      crearRequestJson(payload),
    );

    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.ok).toBe(true);
    expect(body.data.solicitud.id).toBe(
      "solicitud-1",
    );

    expect(
      crearSolicitudPagoProveedorServiceMock,
    ).toHaveBeenCalledTimes(1);

    expect(
      crearSolicitudPagoProveedorServiceMock,
    ).toHaveBeenCalledWith(usuario, payload);

    expect(
      registrarAdjuntosSolicitudPagoServiceMock,
    ).not.toHaveBeenCalled();
  });

  it("debe crear una solicitud de proveedor desde multipart y registrar sus adjuntos", async () => {
    const formData = crearFormDataProveedor();

    const archivo = new File(
      ["contenido factura"],
      "factura.pdf",
      {
        type: "application/pdf",
      },
    );

    formData.append("archivos", archivo);

    const response = await POST(
      crearRequestMultipart(formData),
    );

    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.ok).toBe(true);
    expect(body.data.solicitud.id).toBe(
      "solicitud-1",
    );

    expect(
      crearSolicitudPagoProveedorServiceMock,
    ).toHaveBeenCalledWith(usuario, {
      tipo_solicitud: "PAGO_PROVEEDOR",
      proyecto_base_id: "proyecto-1",
      centro_costo_id: "centro-costo-1",
      beneficiario_id: "proveedor-1",
      medio_pago: "TRANSFERENCIA",
      descripcion: "Pago de factura al proveedor",
      valor_bruto: 1000000,
      valor_impuestos: 190000,
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
      archivos: [archivo],
      usuarioId: "usuario-1",
      carpeta: "solicitudes-pago/proveedores",
    });
  });

  it("no debe registrar adjuntos cuando el multipart no contiene archivos", async () => {
    const response = await POST(
      crearRequestMultipart(
        crearFormDataProveedor(),
      ),
    );

    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.ok).toBe(true);

    expect(
      crearSolicitudPagoProveedorServiceMock,
    ).toHaveBeenCalledTimes(1);

    expect(
      registrarAdjuntosSolicitudPagoServiceMock,
    ).not.toHaveBeenCalled();
  });

  it("no debe registrar adjuntos cuando el servicio rechaza la solicitud", async () => {
    crearSolicitudPagoProveedorServiceMock.mockResolvedValue({
      status: 400,
      body: {
        ok: false,
        message:
          "El beneficiario indicado no es válido.",
      },
    });

    const formData = crearFormDataProveedor();

    formData.append(
      "archivos",
      new File(
        ["contenido factura"],
        "factura.pdf",
        {
          type: "application/pdf",
        },
      ),
    );

    const response = await POST(
      crearRequestMultipart(formData),
    );

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.message).toBe(
      "El beneficiario indicado no es válido.",
    );

    expect(
      registrarAdjuntosSolicitudPagoServiceMock,
    ).not.toHaveBeenCalled();
  });


  it("debe crear una solicitud de impuesto desde multipart y registrar sus adjuntos", async () => {
    const formData = new FormData();

    formData.set("tipo_solicitud", "PAGO_IMPUESTO");
    formData.set("proyecto_base_id", "proyecto-1");
    formData.set("centro_costo_id", "centro-costo-1");
    formData.set("beneficiario_id", "entidad-impuesto-1");
    formData.set("tipo_impuesto", "IVA");
    formData.set("periodo_impuesto", "2026-07");
    formData.set("medio_pago", "TRANSFERENCIA");
    formData.set(
      "descripcion",
      "Pago de IVA del periodo julio de 2026",
    );
    formData.set("valor_bruto", "850000");
    formData.set("valor_impuestos", "0");
    formData.set("valor_retenciones", "0");
    formData.set("valor_descuentos", "0");

    const archivo = new File(
      ["contenido formulario impuesto"],
      "formulario-iva.pdf",
      {
        type: "application/pdf",
      },
    );

    formData.append("archivos", archivo);

    const response = await POST(
      crearRequestMultipart(formData),
    );

    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.ok).toBe(true);

    expect(
      crearSolicitudPagoImpuestoServiceMock,
    ).toHaveBeenCalledTimes(1);

    expect(
      crearSolicitudPagoImpuestoServiceMock,
    ).toHaveBeenCalledWith(usuario, {
      tipo_solicitud: "PAGO_IMPUESTO",
      proyecto_base_id: "proyecto-1",
      centro_costo_id: "centro-costo-1",
      beneficiario_id: "entidad-impuesto-1",
      tipo_impuesto: "IVA",
      periodo_impuesto: "2026-07",
      medio_pago: "TRANSFERENCIA",
      descripcion:
        "Pago de IVA del periodo julio de 2026",
      valor_bruto: 850000,
      valor_impuestos: 0,
      valor_retenciones: 0,
      valor_descuentos: 0,
    });

    expect(
      registrarAdjuntosSolicitudPagoServiceMock,
    ).toHaveBeenCalledTimes(1);

    expect(
      registrarAdjuntosSolicitudPagoServiceMock,
    ).toHaveBeenCalledWith({
      solicitudPagoId: "solicitud-1",
      archivos: [archivo],
      usuarioId: "usuario-1",
      carpeta: "solicitudes-pago/impuestos",
    });
  });

  it("debe crear una solicitud de nómina individual desde multipart y registrar sus adjuntos", async () => {
    const formData = new FormData();

    formData.set("tipo_solicitud", "PAGO_NOMINA");
    formData.set("modalidad_nomina", "INDIVIDUAL");
    formData.set("proyecto_base_id", "proyecto-1");
    formData.set("centro_costo_id", "centro-costo-1");
    formData.set("beneficiario_id", "trabajador-1");
    formData.set("periodo_nomina", "2026-07");
    formData.set("medio_pago", "TRANSFERENCIA");
    formData.set(
      "descripcion",
      "Pago de nómina individual julio de 2026",
    );
    formData.set("valor_bruto", "2500000");
    formData.set("valor_impuestos", "0");
    formData.set("valor_retenciones", "125000");
    formData.set("valor_descuentos", "50000");

    const archivo = new File(
      ["contenido desprendible"],
      "desprendible-nomina.pdf",
      {
        type: "application/pdf",
      },
    );

    formData.append("archivos", archivo);

    const response = await POST(
      crearRequestMultipart(formData),
    );

    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.ok).toBe(true);

    expect(
      crearSolicitudNominaIndividualServiceMock,
    ).toHaveBeenCalledTimes(1);

    expect(
      crearSolicitudNominaIndividualServiceMock,
    ).toHaveBeenCalledWith(usuario, {
      tipo_solicitud: "PAGO_NOMINA",
      modalidad_nomina: "INDIVIDUAL",
      proyecto_base_id: "proyecto-1",
      centro_costo_id: "centro-costo-1",
      beneficiario_id: "trabajador-1",
      periodo_nomina: "2026-07",
      medio_pago: "TRANSFERENCIA",
      descripcion:
        "Pago de nómina individual julio de 2026",
      valor_bruto: 2500000,
      valor_impuestos: 0,
      valor_retenciones: 125000,
      valor_descuentos: 50000,
    });

    expect(
      registrarAdjuntosSolicitudPagoServiceMock,
    ).toHaveBeenCalledTimes(1);

    expect(
      registrarAdjuntosSolicitudPagoServiceMock,
    ).toHaveBeenCalledWith({
      solicitudPagoId: "solicitud-1",
      archivos: [archivo],
      usuarioId: "usuario-1",
      carpeta:
        "solicitudes-pago/nomina-individual",
    });
  });

  it("debe responder 415 cuando el tipo de contenido no es soportado", async () => {
    const request = new Request(
      "http://localhost/api/v1/solicitudes-pago",
      {
        method: "POST",
        headers: {
          "content-type": "text/plain",
        },
        body: "contenido no soportado",
      },
    );

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(415);
    expect(body.ok).toBe(false);
    expect(body.message).toBe(
      "El tipo de contenido debe ser application/json o multipart/form-data.",
    );

    expect(
      crearSolicitudPagoProveedorServiceMock,
    ).not.toHaveBeenCalled();

    expect(
      registrarAdjuntosSolicitudPagoServiceMock,
    ).not.toHaveBeenCalled();
  });

  it("debe responder 400 cuando el JSON no es válido", async () => {
    const request = new Request(
      "http://localhost/api/v1/solicitudes-pago",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: "{json-invalido",
      },
    );

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.message).toBe(
      "El cuerpo de la solicitud debe ser JSON válido.",
    );
  });

  it("debe responder 500 cuando falla el registro de adjuntos", async () => {
    registrarAdjuntosSolicitudPagoServiceMock.mockRejectedValue(
      new Error(
        "No fue posible registrar los adjuntos.",
      ),
    );

    const formData = crearFormDataProveedor();

    formData.append(
      "archivos",
      new File(
        ["contenido factura"],
        "factura.pdf",
        {
          type: "application/pdf",
        },
      ),
    );

    const response = await POST(
      crearRequestMultipart(formData),
    );

    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.ok).toBe(false);
    expect(body.message).toBe(
      "No fue posible crear la solicitud de pago.",
    );

    expect(consoleErrorMock).toHaveBeenCalledWith(
      "Error creando solicitud de pago:",
      expect.any(Error),
    );
  });
});

afterAll(() => {
  consoleErrorMock.mockRestore();
});