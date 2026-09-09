import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  crearAdjuntoNominaGrupalRepositoryMock,
  eliminarArchivoMock,
  generarPlantillaNominaGrupalExcelMock,
  guardarArchivoMock,
  leerExcelNominaGrupalMock,
  obtenerUsuarioAutenticadoMock,
  validarNominaGrupalServiceMock,
} = vi.hoisted(() => ({
  crearAdjuntoNominaGrupalRepositoryMock: vi.fn(),
  eliminarArchivoMock: vi.fn(),
  generarPlantillaNominaGrupalExcelMock: vi.fn(),
  guardarArchivoMock: vi.fn(),
  leerExcelNominaGrupalMock: vi.fn(),
  obtenerUsuarioAutenticadoMock: vi.fn(),
  validarNominaGrupalServiceMock: vi.fn(),
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
  "@/modules/solicitudes-pago/nomina-grupal/nomina-grupal.excel",
  () => ({
    generarPlantillaNominaGrupalExcel:
      generarPlantillaNominaGrupalExcelMock,
    leerExcelNominaGrupal: leerExcelNominaGrupalMock,
  }),
);

vi.mock(
  "@/modules/solicitudes-pago/nomina-grupal/nomina-grupal.repository",
  () => ({
    crearAdjuntoNominaGrupalRepository:
      crearAdjuntoNominaGrupalRepositoryMock,
    eliminarAdjuntoNominaGrupalRepository: vi.fn(),
    obtenerAdjuntoNominaGrupalPorIdRepository: vi.fn(),
    obtenerNominaGrupalPorSolicitudIdRepository: vi.fn(),
  }),
);

vi.mock(
  "@/modules/solicitudes-pago/nomina-grupal/nomina-grupal.service",
  () => ({
    actualizarNominaGrupalService: vi.fn(),
    crearNominaGrupalService: vi.fn(),
    validarNominaGrupalService: validarNominaGrupalServiceMock,
  }),
);

vi.mock("@/modules/storage/storage.service", () => ({
  storageService: {
    guardarArchivo: guardarArchivoMock,
    eliminarArchivo: eliminarArchivoMock,
    obtenerArchivo: vi.fn(),
  },
}));

import { GET, POST } from "../route";

const usuario = {
  id: "usuario-1",
  nombre: "Usuario de prueba",
  correo: "usuario@test.com",
  telefono: "3001234567",
  estado: "ACTIVO",
  roles: ["DIRECTOR"],
  permisos: ["CREAR_SOLICITUDES"],
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
  generarPlantillaNominaGrupalExcelMock.mockResolvedValue(
    Buffer.from("contenido-xlsx"),
  );
  guardarArchivoMock.mockResolvedValue({
    nombre_archivo: "nomina-septiembre.xlsx",
    nombre_bucket: "dimensiones-obras-stg",
    ruta_archivo: "nomina-grupal/archivo-generado.xlsx",
    tipo_mime:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    tamano_archivo: BigInt(14),
  });
  crearAdjuntoNominaGrupalRepositoryMock.mockResolvedValue({
    id: "adjunto-1",
    solicitud_pago_id: null,
    nombre_archivo: "nomina-septiembre.xlsx",
    nombre_bucket: "dimensiones-obras-stg",
    ruta_archivo: "nomina-grupal/archivo-generado.xlsx",
  });
  leerExcelNominaGrupalMock.mockResolvedValue({
    nombre_hoja: "Nomina grupal",
    filas: [
      {
        numero_fila: 2,
        tipo_documento: "CC",
        numero_documento: "1001",
        nombre_trabajador: "JUAN PEREZ",
        concepto_nomina: "SALARIO",
        medio_pago: "EFECTIVO",
        banco: null,
        tipo_cuenta_bancaria: null,
        numero_cuenta_bancaria: null,
        valor_total: 1500000,
      },
    ],
  });
  validarNominaGrupalServiceMock.mockResolvedValue({
    status: 200,
    body: {
      ok: true,
      message: "La nómina grupal fue validada correctamente.",
      data: {
        validacion: {
          filas: [],
          resumen: {
            total_filas: 1,
            filas_validas: 1,
            filas_invalidas: 0,
            filas_pendientes_beneficiario: 0,
            valor_total: 1500000,
          },
        },
      },
    },
  });
});

describe("GET /api/v1/solicitudes-pago/nomina-grupal", () => {
  it("descarga la plantilla Excel para un usuario autenticado", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="plantilla-nomina-grupal.xlsx"',
    );
    expect(await response.arrayBuffer()).toEqual(
      Uint8Array.from(Buffer.from("contenido-xlsx")).buffer,
    );
    expect(generarPlantillaNominaGrupalExcelMock).toHaveBeenCalledTimes(1);
  });

  it("rechaza la descarga cuando no existe una sesión válida", async () => {
    obtenerUsuarioAutenticadoMock.mockResolvedValue({
      status: 401,
      body: {
        ok: false,
        message: "No autenticado.",
      },
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      ok: false,
      message: "No autenticado.",
    });
    expect(generarPlantillaNominaGrupalExcelMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/v1/solicitudes-pago/nomina-grupal", () => {
  it("guarda el Excel con el proveedor configurado para el ambiente", async () => {
    const formData = new FormData();
    formData.set("accion", "VALIDAR");
    formData.set("proyecto_base_id", "proyecto-1");
    formData.set("centro_costo_id", "centro-1");
    formData.set("periodo_nomina", "2026-09");
    formData.set("descripcion", "Nómina de septiembre");
    formData.set(
      "archivo",
      new File(["contenido-xlsx"], "nomina-septiembre.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
    );

    const response = await POST(
      new Request("http://localhost/api/v1/solicitudes-pago/nomina-grupal", {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(200);
    expect(guardarArchivoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre_original: "nomina-septiembre.xlsx",
        carpeta: "nomina-grupal",
      }),
    );
    expect(crearAdjuntoNominaGrupalRepositoryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre_bucket: "dimensiones-obras-stg",
        ruta_archivo: "nomina-grupal/archivo-generado.xlsx",
      }),
    );
    expect(eliminarArchivoMock).not.toHaveBeenCalled();
  });

  it("elimina de S3 el archivo si no puede registrar el adjunto", async () => {
    crearAdjuntoNominaGrupalRepositoryMock.mockRejectedValue(
      new Error("No fue posible registrar el adjunto."),
    );

    const formData = new FormData();
    formData.set("accion", "VALIDAR");
    formData.set(
      "archivo",
      new File(["contenido-xlsx"], "nomina-septiembre.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
    );

    const response = await POST(
      new Request("http://localhost/api/v1/solicitudes-pago/nomina-grupal", {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(500);
    expect(eliminarArchivoMock).toHaveBeenCalledWith(
      "nomina-grupal/archivo-generado.xlsx",
    );
  });
});
