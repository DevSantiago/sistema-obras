import type { UsuarioSesion } from "@/modules/auth/auth.types";
import { generarNumeroSolicitudPagoService } from "@/modules/secuencias/secuencias.service";
import {
  obtenerAccesoActivoUsuarioProyectoLineaRepository,
  obtenerCentroCostoActivoRepository,
  obtenerFondoActivoPorProyectoRepository,
  obtenerProyectoBaseActivoRepository,
} from "../../solicitudes-pago.repository";
import {
  buscarDuplicadosNominaGrupalRepository,
  crearSolicitudNominaGrupalRepository,
  obtenerAdjuntoNominaGrupalPorIdRepository,
  obtenerBeneficiariosNominaPorDocumentosRepository,
} from "../nomina-grupal.repository";
import {
  crearNominaGrupalService,
  validarNominaGrupalService,
} from "../nomina-grupal.service";
import type {
  CrearNominaGrupalInput,
  FilaNominaGrupalNormalizada,
} from "../nomina-grupal.types";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/modules/secuencias/secuencias.service", () => ({
  generarNumeroSolicitudPagoService: vi.fn(),
}));

vi.mock("../../solicitudes-pago.repository", () => ({
  obtenerAccesoActivoUsuarioProyectoLineaRepository: vi.fn(),
  obtenerCentroCostoActivoRepository: vi.fn(),
  obtenerFondoActivoPorProyectoRepository: vi.fn(),
  obtenerProyectoBaseActivoRepository: vi.fn(),
}));

vi.mock("../nomina-grupal.repository", () => ({
  buscarDuplicadosNominaGrupalRepository: vi.fn(),
  crearSolicitudNominaGrupalRepository: vi.fn(),
  obtenerAdjuntoNominaGrupalPorIdRepository: vi.fn(),
  obtenerBeneficiariosNominaPorDocumentosRepository: vi.fn(),
}));

const fechaMock = new Date("2026-07-13T10:00:00.000Z");

const usuarioDirector: UsuarioSesion = {
  id: "director-1",
  nombre: "Director",
  correo: "director@test.com",
  telefono: null,
  estado: "ACTIVO",
  roles: ["DIRECTOR"],
  permisos: ["CREAR_SOLICITUDES"],
};

const usuarioAdministrador: UsuarioSesion = {
  id: "admin-1",
  nombre: "Administrador",
  correo: "admin@test.com",
  telefono: null,
  estado: "ACTIVO",
  roles: ["ADMINISTRADOR"],
  permisos: ["CONSULTAR_TODO"],
};

const usuarioSinPermiso: UsuarioSesion = {
  id: "usuario-1",
  nombre: "Usuario",
  correo: "usuario@test.com",
  telefono: null,
  estado: "ACTIVO",
  roles: ["SOLICITANTE"],
  permisos: ["CREAR_SOLICITUDES"],
};

const proyectoMock = {
  id: "proyecto-1",
  nombre: "HUMAPO",
  descripcion: null,
  estado_proyecto: "EN_EJECUCION",
  activo: true,
  creado_por: "admin-1",
  creado_en: fechaMock,
  actualizado_en: fechaMock,
};

const centroCostoMock = {
  id: "centro-1",
  proyecto_base_id: "proyecto-1",
  linea_negocio: "OBRA",
  fase_centro_costo: "LICITACION",
  prefijo: "PRO-OBRA",
  codigo: "PRO-OBRA-001",
  nombre: "PRO-OBRA - HUMAPO",
  descripcion: null,
  estado_centro_costo: "EN_LICITACION",
  creado_directamente_en_ejecucion: false,
  motivo_creacion_ejecucion: null,
  fecha_inicio_ejecucion: null,
  soporte_inicio_ejecucion_adjunto_id: null,
  observacion_inicio_ejecucion: null,
  inicio_ejecucion_por: null,
  inicio_ejecucion_en: null,
  activo: true,
  creado_en: fechaMock,
  actualizado_en: fechaMock,
};

const fondoMock = {
  id: "fondo-1",
  proyecto_base_id: "proyecto-1",
  nombre: "Fondo HUMAPO",
  tipo_fondo: "PROPIO",
  saldo_actual: 10000000,
  activo: true,
  creado_en: fechaMock,
  actualizado_en: fechaMock,
};

const accesoMock = {
  id: "acceso-1",
  usuario_id: "director-1",
  proyecto_base_id: "proyecto-1",
  linea_negocio: "OBRA",
  activo: true,
  creado_en: fechaMock,
  actualizado_en: fechaMock,
};

const adjuntoMock = {
  id: "adjunto-1",
  solicitud_pago_id: null,
  nombre_archivo: "nomina-julio.xlsx",
  ruta_archivo: "storage/nomina-grupal/nomina-julio.xlsx",
  nombre_bucket: "LOCAL_NOMINA_GRUPAL",
  tipo_mime:
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  tamano_archivo: BigInt(1024),
  subido_por: "director-1",
  subido_en: fechaMock,
  estado_ocr: "NO_PROCESADO",
  texto_ocr: null,
  json_ocr: null,
};

const trabajadorUno = {
  id: "trabajador-1",
  nombre: "JUAN PEREZ",
  tipo_beneficiario: "TRABAJADOR",
  tipo_documento: "CC",
  numero_documento: "1001",
  medio_pago_preferido: "TRANSFERENCIA",
  banco: "BANCOLOMBIA",
  tipo_cuenta_bancaria: "AHORROS",
  numero_cuenta_bancaria: "111111",
  activo: true,
};

const trabajadorDos = {
  id: "trabajador-2",
  nombre: "MARIA LOPEZ",
  tipo_beneficiario: "TRABAJADOR",
  tipo_documento: "CC",
  numero_documento: "1002",
  medio_pago_preferido: "EFECTIVO",
  banco: null,
  tipo_cuenta_bancaria: null,
  numero_cuenta_bancaria: null,
  activo: true,
};

const filasValidas: FilaNominaGrupalNormalizada[] = [
  {
    numero_fila: 2,
    tipo_documento: "CC",
    numero_documento: "1001",
    nombre_trabajador: "JUAN PEREZ",
    concepto_nomina: "SALARIO",
    medio_pago: "TRANSFERENCIA",
    banco: "BANCOLOMBIA",
    tipo_cuenta_bancaria: "AHORROS",
    numero_cuenta_bancaria: "111111",
    valor_bruto: 2000000,
    valor_retenciones: 200000,
    valor_descuentos: 100000,
    valor_neto: 1700000,
  },
  {
    numero_fila: 3,
    tipo_documento: "CC",
    numero_documento: "1002",
    nombre_trabajador: "MARIA LOPEZ",
    concepto_nomina: "HONORARIOS",
    medio_pago: "EFECTIVO",
    banco: null,
    tipo_cuenta_bancaria: null,
    numero_cuenta_bancaria: null,
    valor_bruto: 1000000,
    valor_retenciones: 100000,
    valor_descuentos: 0,
    valor_neto: 900000,
  },
];

const inputBase: CrearNominaGrupalInput = {
  tipo_solicitud: "PAGO_NOMINA",
  modalidad_nomina: "AGRUPADA_EXCEL",
  proyecto_base_id: "proyecto-1",
  centro_costo_id: "centro-1",
  periodo_nomina: "2026-07",
  descripcion: "Nómina grupal de julio de 2026",
  adjunto_archivo_origen_id: "adjunto-1",
  filas: filasValidas,
};

function configurarContextoValido() {
  vi.mocked(obtenerProyectoBaseActivoRepository).mockResolvedValue(
    proyectoMock as never,
  );
  vi.mocked(obtenerCentroCostoActivoRepository).mockResolvedValue(
    centroCostoMock as never,
  );
  vi.mocked(
    obtenerAccesoActivoUsuarioProyectoLineaRepository,
  ).mockResolvedValue(accesoMock as never);
  vi.mocked(obtenerFondoActivoPorProyectoRepository).mockResolvedValue(
    fondoMock as never,
  );
  vi.mocked(obtenerAdjuntoNominaGrupalPorIdRepository).mockResolvedValue(
    adjuntoMock as never,
  );
  vi.mocked(
    obtenerBeneficiariosNominaPorDocumentosRepository,
  ).mockResolvedValue([trabajadorUno, trabajadorDos] as never);
  vi.mocked(buscarDuplicadosNominaGrupalRepository).mockResolvedValue([]);
}

function solicitudCreadaMock() {
  return {
    id: "solicitud-1",
    numero_solicitud: "SOL-PRO-OBRA-HUMAPO-2026-000010",
    tipo_solicitud: "PAGO_NOMINA",
    modalidad_nomina: "AGRUPADA_EXCEL",
    periodo_nomina: "2026-07",
    proyecto_base_id: "proyecto-1",
    fondo_id: "fondo-1",
    centro_costo_id: "centro-1",
    beneficiario_id: null,
    proveedor_id: null,
    categoria_gasto: null,
    categoria_reembolso: null,
    concepto_nomina: null,
    medio_pago: null,
    adjunto_archivo_origen_id: "adjunto-1",
    descripcion: "Nómina grupal de julio de 2026",
    valor_bruto: 3000000,
    valor_impuestos: 0,
    valor_retenciones: 300000,
    valor_descuentos: 100000,
    valor_neto: 2600000,
    estado_actual: "BORRADOR",
    creado_por: "director-1",
    creado_en: fechaMock,
    actualizado_en: fechaMock,
    proyecto_base: {
      id: "proyecto-1",
      nombre: "HUMAPO",
      estado_proyecto: "EN_EJECUCION",
    },
    centro_costo: {
      id: "centro-1",
      nombre: "PRO-OBRA - HUMAPO",
      linea_negocio: "OBRA",
      fase_centro_costo: "LICITACION",
      estado_centro_costo: "EN_LICITACION",
    },
    beneficiario: null,
    proveedor: null,
    creador: {
      id: "director-1",
      nombre: "Director",
      correo: "director@test.com",
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("nomina-grupal.service - permisos y entrada", () => {
  it("debe rechazar a un usuario no autorizado", async () => {
    const resultado = await validarNominaGrupalService(
      usuarioSinPermiso,
      inputBase,
    );

    expect(resultado.status).toBe(403);
    expect(resultado.body.ok).toBe(false);
    expect(obtenerProyectoBaseActivoRepository).not.toHaveBeenCalled();
  });

  it("debe rechazar una modalidad distinta de AGRUPADA_EXCEL", async () => {
    const resultado = await validarNominaGrupalService(
      usuarioDirector,
      {
        ...inputBase,
        modalidad_nomina: "INDIVIDUAL" as never,
      },
    );

    expect(resultado.status).toBe(400);
    expect(resultado.body.ok).toBe(false);
  });

  it("debe rechazar una nómina sin filas", async () => {
    const resultado = await validarNominaGrupalService(
      usuarioDirector,
      {
        ...inputBase,
        filas: [],
      },
    );

    expect(resultado.status).toBe(400);
    expect(resultado.body.ok).toBe(false);
  });
});

describe("nomina-grupal.service - contexto y adjunto", () => {
  it("debe rechazar un proyecto inexistente", async () => {
    vi.mocked(obtenerProyectoBaseActivoRepository).mockResolvedValue(null);

    const resultado = await validarNominaGrupalService(
      usuarioDirector,
      inputBase,
    );

    expect(resultado.status).toBe(404);
    expect(resultado.body.ok).toBe(false);
  });

  it("debe rechazar un centro de costo de otro proyecto", async () => {
    vi.mocked(obtenerProyectoBaseActivoRepository).mockResolvedValue(
      proyectoMock as never,
    );
    vi.mocked(obtenerCentroCostoActivoRepository).mockResolvedValue({
      ...centroCostoMock,
      proyecto_base_id: "proyecto-otro",
    } as never);

    const resultado = await validarNominaGrupalService(
      usuarioDirector,
      inputBase,
    );

    expect(resultado.status).toBe(400);
    expect(resultado.body.ok).toBe(false);
  });

  it("debe rechazar un Director sin acceso al proyecto y línea", async () => {
    vi.mocked(obtenerProyectoBaseActivoRepository).mockResolvedValue(
      proyectoMock as never,
    );
    vi.mocked(obtenerCentroCostoActivoRepository).mockResolvedValue(
      centroCostoMock as never,
    );
    vi.mocked(
      obtenerAccesoActivoUsuarioProyectoLineaRepository,
    ).mockResolvedValue(null);

    const resultado = await validarNominaGrupalService(
      usuarioDirector,
      inputBase,
    );

    expect(resultado.status).toBe(403);
    expect(resultado.body.ok).toBe(false);
  });

  it("debe permitir al Administrador continuar sin consultar acceso", async () => {
    configurarContextoValido();

    const resultado = await validarNominaGrupalService(
      usuarioAdministrador,
      inputBase,
    );

    expect(resultado.status).toBe(200);
    expect(
      obtenerAccesoActivoUsuarioProyectoLineaRepository,
    ).not.toHaveBeenCalled();
  });

  it("debe rechazar un archivo ya asociado", async () => {
    configurarContextoValido();
    vi.mocked(obtenerAdjuntoNominaGrupalPorIdRepository).mockResolvedValue({
      ...adjuntoMock,
      solicitud_pago_id: "solicitud-previa",
    } as never);

    const resultado = await validarNominaGrupalService(
      usuarioDirector,
      inputBase,
    );

    expect(resultado.status).toBe(409);
    expect(resultado.body.ok).toBe(false);
  });
});

describe("nomina-grupal.service - validación de filas", () => {
  it("debe validar correctamente filas con conceptos distintos", async () => {
    configurarContextoValido();

    const resultado = await validarNominaGrupalService(
      usuarioDirector,
      inputBase,
    );

    expect(resultado.status).toBe(200);
    expect(resultado.body.ok).toBe(true);
    expect(resultado.body.data?.validacion.resumen).toEqual({
      total_filas: 2,
      filas_validas: 2,
      filas_invalidas: 0,
      filas_pendientes_beneficiario: 0,
      valor_bruto_total: 3000000,
      valor_retenciones_total: 300000,
      valor_descuentos_total: 100000,
      valor_neto_total: 2600000,
    });
  });

  it("debe marcar como inválida una combinación documento y concepto duplicada", async () => {
    configurarContextoValido();

    const resultado = await validarNominaGrupalService(
      usuarioDirector,
      {
        ...inputBase,
        filas: [
          filasValidas[0],
          {
            ...filasValidas[0],
            numero_fila: 3,
          },
        ],
      },
    );

    expect(resultado.status).toBe(200);
    expect(resultado.body.ok).toBe(true);
    expect(
      resultado.body.data?.validacion.resumen.filas_invalidas,
    ).toBe(2);
  });

  it("debe permitir la misma cédula con conceptos diferentes", async () => {
    configurarContextoValido();

    const resultado = await validarNominaGrupalService(
      usuarioDirector,
      {
        ...inputBase,
        filas: [
          filasValidas[0],
          {
            ...filasValidas[0],
            numero_fila: 3,
            concepto_nomina: "HONORARIOS",
          },
        ],
      },
    );

    expect(resultado.status).toBe(200);
    expect(
      resultado.body.data?.validacion.resumen.filas_invalidas,
    ).toBe(0);
  });

  it("debe marcar como pendiente a un trabajador no registrado", async () => {
    configurarContextoValido();
    vi.mocked(
      obtenerBeneficiariosNominaPorDocumentosRepository,
    ).mockResolvedValue([trabajadorUno] as never);

    const resultado = await validarNominaGrupalService(
      usuarioDirector,
      inputBase,
    );

    expect(resultado.status).toBe(200);
    expect(
      resultado.body.data?.validacion.resumen
        .filas_pendientes_beneficiario,
    ).toBe(1);
  });

  it("debe marcar como inválida una nómina duplicada existente", async () => {
    configurarContextoValido();
    vi.mocked(buscarDuplicadosNominaGrupalRepository).mockResolvedValue([
      {
        solicitud_pago_id: "solicitud-previa",
        numero_solicitud: "SOL-PRO-OBRA-HUMAPO-2026-000009",
        beneficiario_id: "trabajador-1",
        tipo_documento: "CC",
        numero_documento: "1001",
        concepto_nomina: "SALARIO",
        periodo_nomina: "2026-07",
        estado_actual: "BORRADOR",
      },
    ]);

    const resultado = await validarNominaGrupalService(
      usuarioDirector,
      inputBase,
    );

    expect(resultado.status).toBe(200);
    expect(
      resultado.body.data?.validacion.resumen.filas_invalidas,
    ).toBe(1);
    expect(
      resultado.body.data?.validacion.filas[0].errores_validacion,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          codigo: "NOMINA_DUPLICADA_EXISTENTE",
        }),
      ]),
    );
  });
});

describe("nomina-grupal.service - creación", () => {
  it("debe impedir crear cuando hay trabajadores pendientes", async () => {
    configurarContextoValido();
    vi.mocked(
      obtenerBeneficiariosNominaPorDocumentosRepository,
    ).mockResolvedValue([trabajadorUno] as never);

    const resultado = await crearNominaGrupalService(
      usuarioDirector,
      inputBase,
    );

    expect(resultado.status).toBe(422);
    expect(resultado.body.ok).toBe(false);
    expect(generarNumeroSolicitudPagoService).not.toHaveBeenCalled();
    expect(crearSolicitudNominaGrupalRepository).not.toHaveBeenCalled();
  });

  it("debe crear la nómina grupal con totales y detalles correctos", async () => {
    configurarContextoValido();

    vi.mocked(generarNumeroSolicitudPagoService).mockResolvedValue({
      referencia: "SOL-PRO-OBRA-HUMAPO-2026-000010",
      consecutivo: 10,
    } as never);

    vi.mocked(crearSolicitudNominaGrupalRepository).mockResolvedValue({
      solicitud: solicitudCreadaMock(),
      beneficiarios_creados: [],
    } as never);

    const resultado = await crearNominaGrupalService(
      usuarioDirector,
      inputBase,
    );

    expect(resultado.status).toBe(201);
    expect(resultado.body.ok).toBe(true);

    expect(generarNumeroSolicitudPagoService).toHaveBeenCalledWith({
      proyecto_base_id: "proyecto-1",
      centro_costo_id: "centro-1",
      proyecto_referencia: "HUMAPO",
      centro_costo_referencia: "PRO-OBRA",
    });

    expect(crearSolicitudNominaGrupalRepository).toHaveBeenCalledWith({
      numero_solicitud: "SOL-PRO-OBRA-HUMAPO-2026-000010",
      proyecto_base_id: "proyecto-1",
      fondo_id: "fondo-1",
      centro_costo_id: "centro-1",
      periodo_nomina: "2026-07",
      descripcion: "Nómina grupal de julio de 2026",
      adjunto_archivo_origen_id: "adjunto-1",
      valor_bruto: 3000000,
      valor_retenciones: 300000,
      valor_descuentos: 100000,
      valor_neto: 2600000,
      creado_por: "director-1",
      beneficiarios_faltantes: [],
      detalles: [
        expect.objectContaining({
          numero_fila: 2,
          beneficiario_id: "trabajador-1",
          concepto_nomina: "SALARIO",
          valor_neto: 1700000,
          estado_validacion: "VALIDO",
        }),
        expect.objectContaining({
          numero_fila: 3,
          beneficiario_id: "trabajador-2",
          concepto_nomina: "HONORARIOS",
          valor_neto: 900000,
          estado_validacion: "VALIDO",
        }),
      ],
    });

    expect(resultado.body.data?.resumen.valor_neto_total).toBe(
      2600000,
    );
    expect(resultado.body.data?.solicitud.modalidad_nomina).toBe(
      "AGRUPADA_EXCEL",
    );
  });

  it("debe crear beneficiarios faltantes cuando existe confirmación", async () => {
    configurarContextoValido();
    vi.mocked(
      obtenerBeneficiariosNominaPorDocumentosRepository,
    ).mockResolvedValue([]);
    vi.mocked(generarNumeroSolicitudPagoService).mockResolvedValue({
      referencia: "SOL-PRO-OBRA-HUMAPO-2026-000011",
      consecutivo: 11,
    } as never);
    vi.mocked(crearSolicitudNominaGrupalRepository).mockResolvedValue({
      solicitud: solicitudCreadaMock(),
      beneficiarios_creados: [
        {
          id: "trabajador-nuevo-1",
          tipo_documento: "CC",
          numero_documento: "1001",
          nombre: "JUAN PEREZ",
        },
        {
          id: "trabajador-nuevo-2",
          tipo_documento: "CC",
          numero_documento: "1002",
          nombre: "MARIA LOPEZ",
        },
      ],
    } as never);

    const resultado = await crearNominaGrupalService(
      usuarioDirector,
      {
        ...inputBase,
        crear_beneficiarios_faltantes: true,
      },
    );

    expect(resultado.status).toBe(201);
    expect(resultado.body.ok).toBe(true);
    expect(
      crearSolicitudNominaGrupalRepository,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        beneficiarios_faltantes: [
          expect.objectContaining({
            tipo_documento: "CC",
            numero_documento: "1001",
            nombre: "JUAN PEREZ",
          }),
          expect.objectContaining({
            tipo_documento: "CC",
            numero_documento: "1002",
            nombre: "MARIA LOPEZ",
          }),
        ],
      }),
    );
    expect(resultado.body.data?.beneficiarios_creados).toHaveLength(2);
  });

});
