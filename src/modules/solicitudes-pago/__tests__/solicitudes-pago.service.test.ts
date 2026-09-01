import type { UsuarioSesion } from "@/modules/auth/auth.types";
import { generarNumeroSolicitudPagoService } from "@/modules/secuencias/secuencias.service";
import { crearAdjuntosSolicitudPagoService } from "@/modules/adjuntos/adjuntos.service";
import { storageService } from "@/modules/storage/storage.service";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  actualizarSolicitudPagoRepository,
  editarSolicitudAprobadorNivel1Repository,
  aprobarSolicitudesNivel1Repository,
  aprobarSolicitudesNivel2Repository,
  buscarDuplicadoNominaIndividualRepository,
  crearSolicitudPagoRepository,
  eliminarSolicitudPagoRepository,
  obtenerReservasPorFondosRepository,
  obtenerSolicitudesPagoPorIdsRepository,
  enviarSolicitudPagoRepository,
  listarSolicitudesPagoRepository,
  registrarOperacionEfectivoRepository,
  registrarTransferenciasRepository,
  obtenerAccesoActivoUsuarioProyectoLineaRepository,
  obtenerBeneficiarioActivoRepository,
  obtenerCentroCostoActivoRepository,
  obtenerFondoActivoPorProyectoRepository,
  obtenerFondosPorIdsRepository,
  obtenerProyectoBaseActivoRepository,
  obtenerSolicitudPagoPorIdRepository,
  SolicitudesPagoCambioConcurrenteError,
  devolverSolicitudPagoRepository,
  devolverSolicitudesPagoRepository,
  anularSolicitudesPagoRepository,
} from "../solicitudes-pago.repository";
import {
  crearSolicitudNominaIndividualService,
  aprobarSolicitudesNivel1Service,
  aprobarSolicitudesNivel2Service,
  crearSolicitudPagoImpuestoService,
  crearSolicitudPagoProveedorService,
  actualizarSolicitudPagoProveedorService,
  crearSolicitudReembolsoService,
  enviarSolicitudPagoService,
  listarBandejaPagosService,
  listarSolicitudesPagoService,
  registrarOperacionEfectivoService,
  registrarTransferenciasService,
  registrarAdjuntosSolicitudPagoService,
  devolverSolicitudPagoService,
  devolverSolicitudesPagoService,
  anularSolicitudesPagoService,
  editarSolicitudAprobadorNivel1Service,
} from "../solicitudes-pago.service";

vi.mock("@/modules/secuencias/secuencias.service", () => ({
  generarNumeroSolicitudPagoService: vi.fn(),
}));

vi.mock("@/modules/adjuntos/adjuntos.service", () => ({
  crearAdjuntosSolicitudPagoService: vi.fn(),
}));

vi.mock("@/modules/storage/storage.service", () => ({
  storageService: {
    guardarArchivo: vi.fn(),
    eliminarArchivo: vi.fn(),
  },
}));

vi.mock("../solicitudes-pago.repository", () => ({
  SolicitudesPagoCambioConcurrenteError: class
  SolicitudesPagoCambioConcurrenteError extends Error {},
  RegistroPagosError: class RegistroPagosError extends Error {},
  aprobarSolicitudesNivel1Repository: vi.fn(),
  aprobarSolicitudesNivel2Repository: vi.fn(),
  obtenerReservasPorFondosRepository: vi.fn(),
  obtenerSolicitudesPagoPorIdsRepository: vi.fn(),
  buscarDuplicadoNominaIndividualRepository: vi.fn(),
  crearSolicitudPagoRepository: vi.fn(),
  actualizarSolicitudPagoRepository: vi.fn(),
  editarSolicitudAprobadorNivel1Repository: vi.fn(),
  enviarSolicitudPagoRepository: vi.fn(),
  listarSolicitudesPagoRepository: vi.fn(),
  registrarOperacionEfectivoRepository: vi.fn(),
  registrarTransferenciasRepository: vi.fn(),
  obtenerAccesoActivoUsuarioProyectoLineaRepository: vi.fn(),
  obtenerBeneficiarioActivoRepository: vi.fn(),
  obtenerCentroCostoActivoRepository: vi.fn(),
  obtenerFondoActivoPorProyectoRepository: vi.fn(),
  obtenerFondosPorIdsRepository: vi.fn(),
  obtenerProyectoBaseActivoRepository: vi.fn(),
  obtenerSolicitudPagoPorIdRepository: vi.fn(),
  eliminarSolicitudPagoRepository: vi.fn(),
  devolverSolicitudPagoRepository: vi.fn(),
  devolverSolicitudesPagoRepository: vi.fn(),
  anularSolicitudesPagoRepository: vi.fn(),
  reenviarSolicitudDevueltaRepository: vi.fn(),
}));

const fechaMock = new Date("2026-07-03T10:00:00.000Z");

const usuarioSolicitante: UsuarioSesion = {
  id: "usuario-1",
  nombre: "Solicitante",
  correo: "solicitante@test.com",
  telefono: null,
  estado: "ACTIVO",
  roles: ["SOLICITANTE"],
  permisos: ["CREAR_SOLICITUDES"],
};

const usuarioDirector: UsuarioSesion = {
  id: "director-1",
  nombre: "Director",
  correo: "director@test.com",
  telefono: null,
  estado: "ACTIVO",
  roles: ["DIRECTOR"],
  permisos: ["CREAR_SOLICITUDES"],
};

const usuarioDirectorSinPermiso: UsuarioSesion = {
  id: "director-2",
  nombre: "Director sin permiso",
  correo: "directorsinpermiso@test.com",
  telefono: null,
  estado: "ACTIVO",
  roles: ["DIRECTOR"],
  permisos: [],
};

const usuarioSinPermisos: UsuarioSesion = {
  id: "usuario-2",
  nombre: "Sin permisos",
  correo: "sinpermisos@test.com",
  telefono: null,
  estado: "ACTIVO",
  roles: ["PAGOS"],
  permisos: ["MARCAR_COMO_PAGADO"],
};

const usuarioAprobador1: UsuarioSesion = {
  id: "aprobador-1",
  nombre: "Aprobador 1",
  correo: "aprobador1@test.com",
  telefono: null,
  estado: "ACTIVO",
  roles: ["APROBADOR_1"],
  permisos: ["APROBAR_NIVEL_1", "CREAR_SOLICITUDES"],
};

const usuarioAuxiliarContable: UsuarioSesion = {
  id: "auxiliar-contable-1",
  nombre: "Auxiliar contable",
  correo: "auxiliar@test.com",
  telefono: null,
  estado: "ACTIVO",
  roles: ["AUXILIAR_CONTABLE"],
  permisos: [],
};

const usuarioAprobador2: UsuarioSesion = {
  id: "aprobador-2",
  nombre: "Aprobador 2",
  correo: "aprobador2@test.com",
  telefono: null,
  estado: "ACTIVO",
  roles: ["APROBADOR_2"],
  permisos: ["APROBAR_NIVEL_2"],
};

const usuarioPagos: UsuarioSesion = {
  id: "pagos-1",
  nombre: "Pagos",
  correo: "pagos@test.com",
  telefono: null,
  estado: "ACTIVO",
  roles: ["PAGOS"],
  permisos: ["MARCAR_COMO_PAGADO"],
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

const proyectoBaseMock = {
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
  nombre: "Fondo Proyecto Base",
  descripcion: null,
  saldo_actual: 1000000 as never,
  activo: true,
  creado_por: "admin-1",
  creado_en: fechaMock,
  actualizado_en: fechaMock,
};

const beneficiarioProveedorMock = {
  id: "beneficiario-1",
  tipo_beneficiario: "PROVEEDOR",
  proveedor_id: "proveedor-1",
  usuario_id: null,
  nombre: "Proveedor Uno",
  tipo_documento: "NIT",
  numero_documento: "900123456",
  medio_pago_preferido: "TRANSFERENCIA",
  banco: "BANCOLOMBIA",
  tipo_cuenta_bancaria: "AHORROS",
  numero_cuenta_bancaria: "123456789",
  telefono: null,
  correo: null,
  notas: null,
  activo: true,
  creado_en: fechaMock,
  actualizado_en: fechaMock,
};

const beneficiarioTrabajadorMock = {
  id: "trabajador-1",
  tipo_beneficiario: "TRABAJADOR",
  proveedor_id: null,
  usuario_id: "trabajador-usuario-1",
  nombre: "Trabajador Uno",
  tipo_documento: "CC",
  numero_documento: "1012345678",
  medio_pago_preferido: "TRANSFERENCIA",
  banco: "BANCOLOMBIA",
  tipo_cuenta_bancaria: "AHORROS",
  numero_cuenta_bancaria: "987654321",
  telefono: null,
  correo: "trabajador@test.com",
  notas: null,
  activo: true,
  creado_en: fechaMock,
  actualizado_en: fechaMock,
};

const accesoSolicitanteMock = {
  id: "acceso-1",
  usuario_id: "usuario-1",
  proyecto_base_id: "proyecto-1",
  linea_negocio: "OBRA",
  activo: true,
  asignado_por: "admin-1",
  asignado_en: fechaMock,
  revocado_por: null,
  revocado_en: null,
  creado_en: fechaMock,
  actualizado_en: fechaMock,
};

const accesoDirectorMock = {
  ...accesoSolicitanteMock,
  id: "acceso-director-1",
  usuario_id: "director-1",
};

const inputProveedorBase = {
  proyecto_base_id: "proyecto-1",
  centro_costo_id: "centro-1",
  beneficiario_id: "beneficiario-1",
  categoria_gasto: "materiales",
  medio_pago: "TRANSFERENCIA" as const,
  descripcion: "Pago de materiales",
  valor_bruto: 100000,
  valor_retenciones: 24000,
  valor_descuentos: 0,
};

const inputNominaBase = {
  tipo_solicitud: "PAGO_NOMINA" as const,
  modalidad_nomina: "INDIVIDUAL" as const,
  periodo_nomina: "2026-07",
  proyecto_base_id: "proyecto-1",
  centro_costo_id: "centro-1",
  beneficiario_id: "trabajador-1",
  concepto_nomina: "salario",
  medio_pago: "TRANSFERENCIA" as const,
  descripcion: "Pago de nómina individual de julio",
  valor_bruto: 2000000,
  valor_retenciones: 200000,
  valor_descuentos: 100000,
};

const inputImpuestoBase = {
  tipo_solicitud: "PAGO_IMPUESTO" as const,
  proyecto_base_id: "proyecto-1",
  centro_costo_id: "centro-1",
  beneficiario_id: "beneficiario-1",
  tipo_impuesto: "RETEFUENTE" as const,
  periodo_impuesto: "2026-07",
  medio_pago: "TRANSFERENCIA" as const,
  descripcion: "Pago de retención en la fuente de julio",
  valor_bruto: 500000,
};

const inputReembolsoBase = {
  tipo_solicitud: "REEMBOLSO" as const,
  proyecto_base_id: "proyecto-1",
  centro_costo_id: "centro-1",
  beneficiario_id: "trabajador-1",
  categoria_reembolso: "TRANSPORTE" as const,
  medio_pago: "TRANSFERENCIA" as const,
  descripcion: "Reembolso de transporte para visita de obra",
  valor_bruto: 500000,
  valor_retenciones: 120000,
  valor_descuentos: 10000,
};

function prepararMocksProveedor() {
  vi.mocked(obtenerProyectoBaseActivoRepository).mockResolvedValue(
    proyectoBaseMock as never,
  );

  vi.mocked(obtenerCentroCostoActivoRepository).mockResolvedValue(
    centroCostoMock as never,
  );

  vi.mocked(
    obtenerAccesoActivoUsuarioProyectoLineaRepository,
  ).mockResolvedValue(accesoSolicitanteMock as never);

  vi.mocked(obtenerFondoActivoPorProyectoRepository).mockResolvedValue(
    fondoMock as never,
  );

  vi.mocked(obtenerBeneficiarioActivoRepository).mockResolvedValue(
    beneficiarioProveedorMock as never,
  );

  vi.mocked(generarNumeroSolicitudPagoService).mockResolvedValue({
    tipo_secuencia: "SOLICITUD_PAGO",
    proyecto_base_id: "proyecto-1",
    centro_costo_id: "centro-1",
    clave_contexto: "CENTRO:proyecto-1:centro-1",
    prefijo: "SOL",
    proyecto_referencia: "HUMAPO",
    centro_costo_referencia: "PRO-OBRA",
    anio: 2026,
    valor: 1,
    referencia: "SOL-PRO-OBRA-HUMAPO-2026-000001",
  });

  vi.mocked(crearSolicitudPagoRepository).mockResolvedValue({
    id: "solicitud-1",
    numero_solicitud: null,
    tipo_solicitud: "PAGO_PROVEEDOR",
    modalidad_nomina: null,
    periodo_nomina: null,
    proyecto_base_id: "proyecto-1",
    fondo_id: "fondo-1",
    centro_costo_id: "centro-1",
    beneficiario_id: "beneficiario-1",
    proveedor_id: "proveedor-1",
    categoria_gasto: "MATERIALES",
    categoria_reembolso: null,
    concepto_nomina: null,
    medio_pago: "TRANSFERENCIA",
    adjunto_archivo_origen_id: null,
    descripcion: "Pago de materiales",
    valor_bruto: 100000 as never,
    valor_retenciones: 24000 as never,
    valor_descuentos: 0 as never,
    valor_neto: 76000 as never,
    valor_pagado: null,
    valor_reservado: null,
    estado_actual: "BORRADOR",
    creado_por: "usuario-1",
    aprobado_1_por: null,
    aprobado_2_por: null,
    pagado_por: null,
    enviado_en: null,
    aprobado_1_en: null,
    aprobado_2_en: null,
    devuelto_aprobador_1_en: null,
    devuelto_solicitante_en: null,
    pagado_en: null,
    creado_en: fechaMock,
    actualizado_en: fechaMock,
  } as never);
}

const solicitudProveedorBorrador = {
  id: "solicitud-1",
  numero_solicitud: null,
  tipo_solicitud: "PAGO_PROVEEDOR",
  modalidad_nomina: null,
  periodo_nomina: null,
  proyecto_base_id: "proyecto-1",
  fondo_id: "fondo-1",
  centro_costo_id: "centro-1",
  beneficiario_id: "beneficiario-1",
  proveedor_id: "proveedor-1",
  categoria_gasto: "MATERIALES",
  categoria_reembolso: null,
  concepto_nomina: null,
  tipo_impuesto: null,
  periodo_impuesto: null,
  medio_pago: "TRANSFERENCIA",
  adjunto_archivo_origen_id: null,
  descripcion: "Pago de materiales",
  valor_bruto: 100000 as never,
  valor_retenciones: 24000 as never,
  valor_descuentos: 0 as never,
  valor_neto: 76000 as never,
  valor_pagado: null,
  valor_reservado: null,
  estado_actual: "BORRADOR",
  creado_por: "usuario-1",
  aprobado_1_por: null,
  aprobado_2_por: null,
  pagado_por: null,
  enviado_en: null,
  aprobado_1_en: null,
  aprobado_2_en: null,
  devuelto_aprobador_1_en: null,
  devuelto_solicitante_en: null,
  pagado_en: null,
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
  beneficiario: {
    id: "beneficiario-1",
    nombre: "Proveedor Uno",
    tipo_beneficiario: "PROVEEDOR",
    tipo_documento: "NIT",
    numero_documento: "900123456",
  },
  proveedor: {
    id: "proveedor-1",
    nombre: "Proveedor Uno",
  },
  creador: {
    id: "usuario-1",
    nombre: "Solicitante",
    correo: "solicitante@test.com",
  },
};

function prepararMocksNomina() {
  vi.mocked(obtenerProyectoBaseActivoRepository).mockResolvedValue(
    proyectoBaseMock as never,
  );

  vi.mocked(obtenerCentroCostoActivoRepository).mockResolvedValue(
    centroCostoMock as never,
  );

  vi.mocked(
    obtenerAccesoActivoUsuarioProyectoLineaRepository,
  ).mockResolvedValue(accesoDirectorMock as never);

  vi.mocked(obtenerFondoActivoPorProyectoRepository).mockResolvedValue(
    fondoMock as never,
  );

  vi.mocked(obtenerBeneficiarioActivoRepository).mockResolvedValue(
    beneficiarioTrabajadorMock as never,
  );

  vi.mocked(
    buscarDuplicadoNominaIndividualRepository,
  ).mockResolvedValue(null);

  vi.mocked(generarNumeroSolicitudPagoService).mockResolvedValue({
    tipo_secuencia: "SOLICITUD_PAGO",
    proyecto_base_id: "proyecto-1",
    centro_costo_id: "centro-1",
    clave_contexto: "CENTRO:proyecto-1:centro-1",
    prefijo: "SOL",
    proyecto_referencia: "HUMAPO",
    centro_costo_referencia: "PRO-OBRA",
    anio: 2026,
    valor: 2,
    referencia: "SOL-PRO-OBRA-HUMAPO-2026-000002",
  });

  vi.mocked(crearSolicitudPagoRepository).mockResolvedValue({
    id: "solicitud-nomina-1",
    numero_solicitud: null,
    tipo_solicitud: "PAGO_NOMINA",
    modalidad_nomina: "INDIVIDUAL",
    periodo_nomina: "2026-07",
    proyecto_base_id: "proyecto-1",
    fondo_id: "fondo-1",
    centro_costo_id: "centro-1",
    beneficiario_id: "trabajador-1",
    proveedor_id: null,
    categoria_gasto: null,
    categoria_reembolso: null,
    concepto_nomina: "SALARIO",
    medio_pago: "TRANSFERENCIA",
    adjunto_archivo_origen_id: null,
    descripcion: "Pago de nómina individual de julio",
    valor_bruto: 2000000 as never,
    valor_retenciones: 200000 as never,
    valor_descuentos: 100000 as never,
    valor_neto: 1700000 as never,
    valor_pagado: null,
    valor_reservado: null,
    estado_actual: "BORRADOR",
    creado_por: "director-1",
    aprobado_1_por: null,
    aprobado_2_por: null,
    pagado_por: null,
    enviado_en: null,
    aprobado_1_en: null,
    aprobado_2_en: null,
    devuelto_aprobador_1_en: null,
    devuelto_solicitante_en: null,
    pagado_en: null,
    creado_en: fechaMock,
    actualizado_en: fechaMock,
  } as never);
}


function prepararMocksReembolso(
  usuario: UsuarioSesion = usuarioSolicitante,
) {
  vi.mocked(obtenerProyectoBaseActivoRepository).mockResolvedValue(
    proyectoBaseMock as never,
  );

  vi.mocked(obtenerCentroCostoActivoRepository).mockResolvedValue(
    centroCostoMock as never,
  );

  vi.mocked(
    obtenerAccesoActivoUsuarioProyectoLineaRepository,
  ).mockResolvedValue({
    ...accesoSolicitanteMock,
    id: `acceso-${usuario.id}`,
    usuario_id: usuario.id,
  } as never);

  vi.mocked(obtenerFondoActivoPorProyectoRepository).mockResolvedValue(
    fondoMock as never,
  );

  vi.mocked(obtenerBeneficiarioActivoRepository).mockResolvedValue(
    beneficiarioTrabajadorMock as never,
  );

  vi.mocked(generarNumeroSolicitudPagoService).mockResolvedValue({
    tipo_secuencia: "SOLICITUD_PAGO",
    proyecto_base_id: "proyecto-1",
    centro_costo_id: "centro-1",
    clave_contexto: "CENTRO:proyecto-1:centro-1",
    prefijo: "SOL",
    proyecto_referencia: "HUMAPO",
    centro_costo_referencia: "PRO-OBRA",
    anio: 2026,
    valor: 3,
    referencia: "SOL-PRO-OBRA-HUMAPO-2026-000003",
  });

  vi.mocked(crearSolicitudPagoRepository).mockResolvedValue({
    id: "solicitud-reembolso-1",
    numero_solicitud: "SOL-PRO-OBRA-HUMAPO-2026-000003",
    tipo_solicitud: "REEMBOLSO",
    modalidad_nomina: null,
    periodo_nomina: null,
    proyecto_base_id: "proyecto-1",
    fondo_id: "fondo-1",
    centro_costo_id: "centro-1",
    beneficiario_id: "trabajador-1",
    proveedor_id: null,
    categoria_gasto: null,
    categoria_reembolso: "TRANSPORTE",
    concepto_nomina: null,
    tipo_impuesto: null,
    periodo_impuesto: null,
    medio_pago: "TRANSFERENCIA",
    adjunto_archivo_origen_id: null,
    descripcion: "Reembolso de transporte para visita de obra",
    valor_bruto: 500000 as never,
    valor_retenciones: 120000 as never,
    valor_descuentos: 10000 as never,
    valor_neto: 370000 as never,
    valor_pagado: null,
    valor_reservado: null,
    estado_actual: "BORRADOR",
    creado_por: usuario.id,
    aprobado_1_por: null,
    aprobado_2_por: null,
    pagado_por: null,
    enviado_en: null,
    aprobado_1_en: null,
    aprobado_2_en: null,
    devuelto_aprobador_1_en: null,
    devuelto_solicitante_en: null,
    pagado_en: null,
    creado_en: fechaMock,
    actualizado_en: fechaMock,
  } as never);
}

describe("solicitudes-pago.service - listarSolicitudesPagoService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listarSolicitudesPagoRepository).mockResolvedValue([]);
  });

  it("debe mostrar al solicitante únicamente sus propias solicitudes", async () => {
    const resultado = await listarSolicitudesPagoService(usuarioSolicitante);

    expect(resultado.status).toBe(200);

    expect(listarSolicitudesPagoRepository).toHaveBeenCalledWith({
      filters: expect.objectContaining({}),
      visibilidad: {
        consultar_todas: false,
        usuario_id: "usuario-1",
        incluir_propias: true,
        incluir_proyectos_asignados: true,
        estados_flujo: [],
      },
    });
  });

  it("debe mostrar al aprobador 1 sus solicitudes y las pendientes de su nivel", async () => {
    const resultado = await listarSolicitudesPagoService(usuarioAprobador1);

    expect(resultado.status).toBe(200);

    expect(listarSolicitudesPagoRepository).toHaveBeenCalledWith({
      filters: expect.objectContaining({}),
      visibilidad: {
        consultar_todas: false,
        usuario_id: "aprobador-1",
        incluir_propias: true,
        incluir_proyectos_asignados: true,
        estados_flujo: [
          "PENDIENTE_APROBADOR_1",
          "DEVUELTA_APROBADOR_1",
        ],
      },
    });
  });

  it("debe mostrar al aprobador 2 sus solicitudes y las pendientes de su nivel", async () => {
    const resultado = await listarSolicitudesPagoService(usuarioAprobador2);

    expect(resultado.status).toBe(200);

    expect(listarSolicitudesPagoRepository).toHaveBeenCalledWith({
      filters: expect.objectContaining({}),
      visibilidad: {
        consultar_todas: false,
        usuario_id: "aprobador-2",
        incluir_propias: true,
        incluir_proyectos_asignados: true,
        estados_flujo: ["PENDIENTE_APROBADOR_2"],
      },
    });
  });

  it("debe mostrar a pagos sus solicitudes y las programadas para pago", async () => {
    const resultado = await listarSolicitudesPagoService(usuarioPagos);

    expect(resultado.status).toBe(200);

    expect(listarSolicitudesPagoRepository).toHaveBeenCalledWith({
      filters: expect.objectContaining({}),
      visibilidad: {
        consultar_todas: false,
        usuario_id: "pagos-1",
        incluir_propias: true,
        incluir_proyectos_asignados: true,
        estados_flujo: ["PROGRAMADA_PAGO"],
      },
    });
  });

  it("debe permitir al administrador consultar todas las solicitudes", async () => {
    const resultado = await listarSolicitudesPagoService(
      usuarioAdministrador,
    );

    expect(resultado.status).toBe(200);

    expect(listarSolicitudesPagoRepository).toHaveBeenCalledWith({
      filters: expect.objectContaining({}),
      visibilidad: {
        consultar_todas: true,
        usuario_id: "admin-1",
        incluir_propias: false,
        incluir_proyectos_asignados: false,
        estados_flujo: [],
      },
    });
  });

  it("debe normalizar filtros de nómina", async () => {
    const resultado = await listarSolicitudesPagoService(usuarioAdministrador, {
      tipo_solicitud: "pago_nomina" as never,
      modalidad_nomina: "individual" as never,
      periodo_nomina: "2026-07",
    });

    expect(resultado.status).toBe(200);

    expect(listarSolicitudesPagoRepository).toHaveBeenCalledWith({
      filters: {
        tipo_solicitud: "PAGO_NOMINA",
        modalidad_nomina: "INDIVIDUAL",
        periodo_nomina: "2026-07",
        estado_actual: undefined,
        proyecto_base_id: undefined,
        centro_costo_id: undefined,
        beneficiario_id: undefined,
        medio_pago: undefined,
        busqueda: undefined,
      },
      visibilidad: {
        consultar_todas: true,
        usuario_id: "admin-1",
        incluir_propias: false,
        incluir_proyectos_asignados: false,
        estados_flujo: [],
      },
    });
  });

  it("debe rechazar periodo de nómina inválido en los filtros", async () => {
    const resultado = await listarSolicitudesPagoService(usuarioAdministrador, {
      periodo_nomina: "2026-13",
    });

    expect(resultado.status).toBe(400);
    expect(resultado.body.message).toBe(
      "El periodo de nómina debe tener formato YYYY-MM.",
    );
    expect(listarSolicitudesPagoRepository).not.toHaveBeenCalled();
  });

  it("debe rechazar la consulta cuando el usuario no tiene permisos", async () => {
    const usuarioNoAutorizado: UsuarioSesion = {
      id: "usuario-3",
      nombre: "No autorizado",
      correo: "noautorizado@test.com",
      telefono: null,
      estado: "ACTIVO",
      roles: ["USUARIO"],
      permisos: [],
    };

    const resultado = await listarSolicitudesPagoService(
      usuarioNoAutorizado,
    );

    expect(resultado.status).toBe(403);

    expect(resultado.body.message).toBe(
      "No tiene permisos para consultar solicitudes.",
    );

    expect(listarSolicitudesPagoRepository).not.toHaveBeenCalled();
  });
});

describe("solicitudes-pago.service - listarBandejaPagosService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listarSolicitudesPagoRepository).mockResolvedValue([]);
    vi.mocked(obtenerFondosPorIdsRepository).mockResolvedValue([]);
  });

  it("debe consultar únicamente solicitudes programadas para pago", async () => {
    const resultado = await listarBandejaPagosService(usuarioPagos, {
      medio_pago: "TRANSFERENCIA",
      proyecto_base_id: "proyecto-1",
    });

    expect(resultado.status).toBe(200);
    expect(listarSolicitudesPagoRepository).toHaveBeenCalledWith({
      filters: expect.objectContaining({
        estado_actual: "PROGRAMADA_PAGO",
        medio_pago: "TRANSFERENCIA",
        proyecto_base_id: "proyecto-1",
      }),
      visibilidad: {
        consultar_todas: true,
        usuario_id: "pagos-1",
        incluir_propias: false,
        incluir_proyectos_asignados: false,
        estados_flujo: [],
      },
    });
  });

  it("debe permitir al administrador consultar la bandeja de pagos", async () => {
    const resultado =
      await listarBandejaPagosService(usuarioAdministrador);

    expect(resultado.status).toBe(200);
  });

  it("debe rechazar usuarios ajenos al módulo de pagos", async () => {
    const resultado =
      await listarBandejaPagosService(usuarioSolicitante);

    expect(resultado.status).toBe(403);
    expect(resultado.body.message).toBe(
      "No tiene permisos para consultar la bandeja de pagos.",
    );
    expect(listarSolicitudesPagoRepository).not.toHaveBeenCalled();
  });
});

describe("solicitudes-pago.service - registrarTransferenciasService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("debe exigir al menos una transferencia", async () => {
    const resultado = await registrarTransferenciasService(
      usuarioPagos,
      [],
    );

    expect(resultado.status).toBe(400);
    expect(registrarTransferenciasRepository).not.toHaveBeenCalled();
  });

  it("debe rechazar usuarios ajenos al módulo de pagos", async () => {
    const resultado = await registrarTransferenciasService(
      usuarioSolicitante,
      [],
    );

    expect(resultado.status).toBe(403);
  });

  it("debe guardar cada soporte y registrar el lote", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-28T02:00:00.000Z"));
    vi.mocked(storageService.guardarArchivo).mockResolvedValue({
      nombre_archivo: "soporte.pdf",
      ruta_archivo: "soportes/soporte.pdf",
      nombre_bucket: "LOCAL",
      tipo_mime: "application/pdf",
      tamano_archivo: BigInt(10),
    });
    vi.mocked(registrarTransferenciasRepository).mockResolvedValue({
      solicitudes: [solicitudProveedorBorrador],
      resumen_proyectos: [
        {
          proyecto_base_id: "proyecto-1",
          proyecto_nombre: "HUMAPO",
          saldo_anterior: 100000,
          total_pagado: 76000,
          saldo_nuevo: 24000,
        },
      ],
    } as never);

    const resultado = await registrarTransferenciasService(
      usuarioPagos,
      [
        {
          solicitud_id: "solicitud-1",
          numero_comprobante: "TRX-001",
          observacion: "Transferencia",
          soporte: new File(["contenido"], "soporte.pdf", {
            type: "application/pdf",
          }),
        },
      ],
    );

    expect(resultado.status).toBe(200);
    expect(registrarTransferenciasRepository).toHaveBeenCalledWith(
      expect.objectContaining({
        usuarioId: "pagos-1",
        pagos: [
          expect.objectContaining({
            solicitud_id: "solicitud-1",
            fecha_pago: new Date("2026-07-28T02:00:00.000Z"),
            numero_comprobante: "TRX-001",
          }),
        ],
      }),
    );
  });
});

describe("solicitudes-pago.service - registrarOperacionEfectivoService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const crearOperacion = () => ({
    valor_retirado: 80000,
    observacion: "Retiro de caja",
    reintegrar_sobrante: true,
    soporte_retiro: new File(["retiro"], "retiro.pdf", {
      type: "application/pdf",
    }),
    detalles: [
      {
        solicitud_id: "solicitud-1",
        numero_comprobante: "CON-001",
        observacion: "Consignación",
        soporte: new File(["pago"], "pago.pdf", {
          type: "application/pdf",
        }),
      },
    ],
  });

  it("debe rechazar usuarios ajenos al módulo de pagos", async () => {
    const resultado = await registrarOperacionEfectivoService(
      usuarioSolicitante,
      crearOperacion(),
    );

    expect(resultado.status).toBe(403);
    expect(registrarOperacionEfectivoRepository).not.toHaveBeenCalled();
  });

  it("debe guardar el soporte general y cada soporte de pago", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-28T02:00:00.000Z"));
    vi.mocked(storageService.guardarArchivo).mockResolvedValue({
      nombre_archivo: "soporte.pdf",
      ruta_archivo: "operaciones/soporte.pdf",
      ruta_absoluta: "/storage/operaciones/soporte.pdf",
      nombre_bucket: "LOCAL",
      tipo_mime: "application/pdf",
      tamano_archivo: BigInt(10),
    });
    vi.mocked(registrarOperacionEfectivoRepository).mockResolvedValue({
      operacion: {
        id: "operacion-1",
        proyecto_base_id: "proyecto-1",
        proyecto_nombre: "HUMAPO",
        valor_requerido: 76000,
        valor_retirado: 80000,
        valor_pagado: 76000,
        valor_sobrante: 4000,
        sobrante_reintegrado: true,
        saldo_anterior: 100000,
        saldo_nuevo: 24000,
      },
      solicitudes: [solicitudProveedorBorrador],
    } as never);

    const resultado = await registrarOperacionEfectivoService(
      usuarioPagos,
      crearOperacion(),
    );

    expect(resultado.status).toBe(200);
    expect(storageService.guardarArchivo).toHaveBeenCalledTimes(2);
    expect(registrarOperacionEfectivoRepository).toHaveBeenCalledWith(
      expect.objectContaining({
        usuarioId: "pagos-1",
        operacion: expect.objectContaining({
          fecha_retiro: new Date("2026-07-28T02:00:00.000Z"),
          valor_retirado: 80000,
          reintegrar_sobrante: true,
          detalles: [
            expect.objectContaining({
              solicitud_id: "solicitud-1",
              numero_comprobante: "CON-001",
              soporte: expect.not.objectContaining({
                ruta_absoluta: expect.anything(),
              }),
            }),
          ],
          soporte_retiro: expect.not.objectContaining({
            ruta_absoluta: expect.anything(),
          }),
        }),
      }),
    );
  });
});

describe("solicitudes-pago.service - crearSolicitudPagoProveedorService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe rechazar usuario sin permiso para crear solicitudes", async () => {
    const resultado = await crearSolicitudPagoProveedorService(
      usuarioSinPermisos,
      inputProveedorBase,
    );

    expect(resultado.status).toBe(403);
    expect(resultado.body.ok).toBe(false);
    expect(crearSolicitudPagoRepository).not.toHaveBeenCalled();
  });

  it("debe validar campos obligatorios", async () => {
    const resultado = await crearSolicitudPagoProveedorService(
      usuarioSolicitante,
      {
        ...inputProveedorBase,
        descripcion: "",
      },
    );

    expect(resultado.status).toBe(400);

    expect(resultado.body.message).toBe(
      "Proyecto base, centro de costo, beneficiario, categoría, medio de pago y concepto de pago son obligatorios.",
    );

    expect(crearSolicitudPagoRepository).not.toHaveBeenCalled();
  });

  it("debe validar medio de pago", async () => {
    const resultado = await crearSolicitudPagoProveedorService(
      usuarioSolicitante,
      {
        ...inputProveedorBase,
        medio_pago: "CHEQUE" as never,
      },
    );

    expect(resultado.status).toBe(400);
    expect(resultado.body.message).toBe("El medio de pago no es válido.");
    expect(crearSolicitudPagoRepository).not.toHaveBeenCalled();
  });

  it("debe validar valor de la factura mayor a cero", async () => {
    const resultado = await crearSolicitudPagoProveedorService(
      usuarioSolicitante,
      {
        ...inputProveedorBase,
        valor_bruto: 0,
      },
    );

    expect(resultado.status).toBe(400);

    expect(resultado.body.message).toBe(
      "Los valores deben ser numéricos y el valor de la factura debe ser mayor a cero.",
    );

    expect(crearSolicitudPagoRepository).not.toHaveBeenCalled();
  });

  it("debe validar que el valor a pagar no sea negativo", async () => {
    const resultado = await crearSolicitudPagoProveedorService(
      usuarioSolicitante,
      {
        ...inputProveedorBase,
        valor_bruto: 1000,
      },
    );

    expect(resultado.status).toBe(400);
    expect(resultado.body.message).toBe(
      "El valor a pagar no puede ser negativo.",
    );
    expect(crearSolicitudPagoRepository).not.toHaveBeenCalled();
  });

  it("debe validar proyecto base activo", async () => {
    vi.mocked(obtenerProyectoBaseActivoRepository).mockResolvedValue(null);

    const resultado = await crearSolicitudPagoProveedorService(
      usuarioSolicitante,
      inputProveedorBase,
    );

    expect(resultado.status).toBe(404);
    expect(resultado.body.message).toBe(
      "El proyecto base no existe o está inactivo.",
    );
  });

  it("debe validar centro de costo activo", async () => {
    vi.mocked(obtenerProyectoBaseActivoRepository).mockResolvedValue(
      proyectoBaseMock as never,
    );

    vi.mocked(obtenerCentroCostoActivoRepository).mockResolvedValue(null);

    const resultado = await crearSolicitudPagoProveedorService(
      usuarioSolicitante,
      inputProveedorBase,
    );

    expect(resultado.status).toBe(404);
    expect(resultado.body.message).toBe(
      "El centro de costo no existe o está inactivo.",
    );
  });

  it("debe validar que centro de costo pertenezca al proyecto", async () => {
    vi.mocked(obtenerProyectoBaseActivoRepository).mockResolvedValue(
      proyectoBaseMock as never,
    );

    vi.mocked(obtenerCentroCostoActivoRepository).mockResolvedValue({
      ...centroCostoMock,
      proyecto_base_id: "otro-proyecto",
    } as never);

    const resultado = await crearSolicitudPagoProveedorService(
      usuarioSolicitante,
      inputProveedorBase,
    );

    expect(resultado.status).toBe(400);
    expect(resultado.body.message).toBe(
      "El centro de costo no pertenece al proyecto base seleccionado.",
    );
  });

  it("debe validar acceso activo del usuario a proyecto y línea", async () => {
    vi.mocked(obtenerProyectoBaseActivoRepository).mockResolvedValue(
      proyectoBaseMock as never,
    );

    vi.mocked(obtenerCentroCostoActivoRepository).mockResolvedValue(
      centroCostoMock as never,
    );

    vi.mocked(
      obtenerAccesoActivoUsuarioProyectoLineaRepository,
    ).mockResolvedValue(null);

    const resultado = await crearSolicitudPagoProveedorService(
      usuarioSolicitante,
      inputProveedorBase,
    );

    expect(resultado.status).toBe(403);
    expect(resultado.body.message).toBe(
      "No tiene acceso activo al proyecto y línea de negocio seleccionados.",
    );
  });

  it("debe validar fondo activo asociado al proyecto", async () => {
    vi.mocked(obtenerProyectoBaseActivoRepository).mockResolvedValue(
      proyectoBaseMock as never,
    );

    vi.mocked(obtenerCentroCostoActivoRepository).mockResolvedValue(
      centroCostoMock as never,
    );

    vi.mocked(
      obtenerAccesoActivoUsuarioProyectoLineaRepository,
    ).mockResolvedValue(accesoSolicitanteMock as never);

    vi.mocked(obtenerFondoActivoPorProyectoRepository).mockResolvedValue(null);

    const resultado = await crearSolicitudPagoProveedorService(
      usuarioSolicitante,
      inputProveedorBase,
    );

    expect(resultado.status).toBe(404);
    expect(resultado.body.message).toBe(
      "El proyecto base no tiene un fondo activo asociado.",
    );
  });

  it("debe validar beneficiario activo", async () => {
    vi.mocked(obtenerProyectoBaseActivoRepository).mockResolvedValue(
      proyectoBaseMock as never,
    );

    vi.mocked(obtenerCentroCostoActivoRepository).mockResolvedValue(
      centroCostoMock as never,
    );

    vi.mocked(
      obtenerAccesoActivoUsuarioProyectoLineaRepository,
    ).mockResolvedValue(accesoSolicitanteMock as never);

    vi.mocked(obtenerFondoActivoPorProyectoRepository).mockResolvedValue(
      fondoMock as never,
    );

    vi.mocked(obtenerBeneficiarioActivoRepository).mockResolvedValue(null);

    const resultado = await crearSolicitudPagoProveedorService(
      usuarioSolicitante,
      inputProveedorBase,
    );

    expect(resultado.status).toBe(404);
    expect(resultado.body.message).toBe(
      "El beneficiario no existe o está inactivo.",
    );
  });

  it("debe rechazar un trabajador como beneficiario de pago a proveedor", async () => {
    vi.mocked(obtenerProyectoBaseActivoRepository).mockResolvedValue(
      proyectoBaseMock as never,
    );

    vi.mocked(obtenerCentroCostoActivoRepository).mockResolvedValue(
      centroCostoMock as never,
    );

    vi.mocked(
      obtenerAccesoActivoUsuarioProyectoLineaRepository,
    ).mockResolvedValue(accesoSolicitanteMock as never);

    vi.mocked(obtenerFondoActivoPorProyectoRepository).mockResolvedValue(
      fondoMock as never,
    );

    vi.mocked(obtenerBeneficiarioActivoRepository).mockResolvedValue({
      ...beneficiarioProveedorMock,
      tipo_beneficiario: "TRABAJADOR",
    } as never);

    const resultado = await crearSolicitudPagoProveedorService(
      usuarioSolicitante,
      inputProveedorBase,
    );

    expect(resultado.status).toBe(400);
    expect(resultado.body.message).toBe(
      "Para una solicitud de pago a proveedor, el beneficiario debe ser tipo PROVEEDOR u OTRO.",
    );
  });

  it("debe validar combinación válida de línea y fase del centro de costo", async () => {
    vi.mocked(obtenerProyectoBaseActivoRepository).mockResolvedValue(
      proyectoBaseMock as never,
    );

    vi.mocked(obtenerCentroCostoActivoRepository).mockResolvedValue({
      ...centroCostoMock,
      linea_negocio: "OBRA",
      fase_centro_costo: "FASE_INVALIDA",
    } as never);

    vi.mocked(
      obtenerAccesoActivoUsuarioProyectoLineaRepository,
    ).mockResolvedValue(accesoSolicitanteMock as never);

    vi.mocked(obtenerFondoActivoPorProyectoRepository).mockResolvedValue(
      fondoMock as never,
    );

    vi.mocked(obtenerBeneficiarioActivoRepository).mockResolvedValue(
      beneficiarioProveedorMock as never,
    );

    const resultado = await crearSolicitudPagoProveedorService(
      usuarioSolicitante,
      inputProveedorBase,
    );

    expect(resultado.status).toBe(400);
    expect(resultado.body.message).toBe(
      "La línea de negocio y la fase del centro de costo no permiten construir el consecutivo documental.",
    );

    expect(generarNumeroSolicitudPagoService).not.toHaveBeenCalled();
    expect(crearSolicitudPagoRepository).not.toHaveBeenCalled();
  });

  it("debe crear solicitud de pago a proveedor en borrador", async () => {
    prepararMocksProveedor();

    const resultado = await crearSolicitudPagoProveedorService(
      usuarioSolicitante,
      inputProveedorBase,
    );

    expect(resultado.status).toBe(201);
    expect(resultado.body.ok).toBe(true);
    expect(resultado.body.data?.solicitud.numero_solicitud).toBeNull();
    expect(resultado.body.data?.solicitud.valor_neto).toBe(76000);

    expect(generarNumeroSolicitudPagoService).not.toHaveBeenCalled();

    expect(crearSolicitudPagoRepository).toHaveBeenCalledWith({
      numero_solicitud: null,
      tipo_solicitud: "PAGO_PROVEEDOR",
      modalidad_nomina: null,
      periodo_nomina: null,
      proyecto_base_id: "proyecto-1",
      fondo_id: "fondo-1",
      centro_costo_id: "centro-1",
      beneficiario_id: "beneficiario-1",
      proveedor_id: "proveedor-1",
      categoria_gasto: "MATERIALES",
      categoria_reembolso: null,
      concepto_nomina: null,
      tipo_impuesto: null,
      periodo_impuesto: null,
      medio_pago: "TRANSFERENCIA",
      adjunto_archivo_origen_id: null,
      descripcion: "Pago de materiales",
      valor_bruto: 100000,
      valor_retenciones: 24000,
      valor_descuentos: 0,
      valor_neto: 76000,
      estado_actual: "BORRADOR",
      creado_por: "usuario-1",
    });
  });

  it("debe crear un pago a proveedor para un beneficiario tipo otro", async () => {
    prepararMocksProveedor();
    vi.mocked(obtenerBeneficiarioActivoRepository).mockResolvedValue({
      ...beneficiarioProveedorMock,
      tipo_beneficiario: "OTRO",
      proveedor_id: null,
    } as never);

    const resultado = await crearSolicitudPagoProveedorService(
      usuarioSolicitante,
      inputProveedorBase,
    );

    expect(resultado.status).toBe(201);
    expect(crearSolicitudPagoRepository).toHaveBeenCalledWith(
      expect.objectContaining({
        beneficiario_id: "beneficiario-1",
        proveedor_id: null,
        tipo_solicitud: "PAGO_PROVEEDOR",
      }),
    );
  });
});

describe("solicitudes-pago.service - crearSolicitudNominaIndividualService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe rechazar a un solicitante aunque tenga permiso general de creación", async () => {
    const resultado = await crearSolicitudNominaIndividualService(
      usuarioSolicitante,
      inputNominaBase,
    );

    expect(resultado.status).toBe(403);
    expect(resultado.body.message).toBe(
      "Solo un Director, Aprobador nivel 1 autorizado o un Administrador puede crear solicitudes de nómina individual.",
    );
    expect(crearSolicitudPagoRepository).not.toHaveBeenCalled();
  });

  it("debe rechazar a un director sin permiso CREAR_SOLICITUDES", async () => {
    const resultado = await crearSolicitudNominaIndividualService(
      usuarioDirectorSinPermiso,
      inputNominaBase,
    );

    expect(resultado.status).toBe(403);
    expect(resultado.body.message).toBe(
      "Solo un Director, Aprobador nivel 1 autorizado o un Administrador puede crear solicitudes de nómina individual.",
    );
    expect(crearSolicitudPagoRepository).not.toHaveBeenCalled();
  });

  it("debe permitir al administrador continuar sin validar acceso asignado", async () => {
    prepararMocksNomina();

    vi.mocked(crearSolicitudPagoRepository).mockResolvedValue({
      id: "solicitud-nomina-admin",
      numero_solicitud: "SOL-PRO-OBRA-HUMAPO-2026-000002",
      tipo_solicitud: "PAGO_NOMINA",
      modalidad_nomina: "INDIVIDUAL",
      periodo_nomina: "2026-07",
      proyecto_base_id: "proyecto-1",
      fondo_id: "fondo-1",
      centro_costo_id: "centro-1",
      beneficiario_id: "trabajador-1",
      proveedor_id: null,
      categoria_gasto: null,
      categoria_reembolso: null,
      concepto_nomina: "SALARIO",
      tipo_impuesto: null,
      periodo_impuesto: null,
      medio_pago: "TRANSFERENCIA",
      adjunto_archivo_origen_id: null,
      descripcion: "Pago de nómina individual de julio",
      valor_bruto: 2000000 as never,
      valor_retenciones: 200000 as never,
      valor_descuentos: 100000 as never,
      valor_neto: 1700000 as never,
      valor_pagado: null,
      valor_reservado: null,
      estado_actual: "BORRADOR",
      creado_por: "admin-1",
      aprobado_1_por: null,
      aprobado_2_por: null,
      pagado_por: null,
      enviado_en: null,
      aprobado_1_en: null,
      aprobado_2_en: null,
      devuelto_aprobador_1_en: null,
      devuelto_solicitante_en: null,
      pagado_en: null,
      creado_en: fechaMock,
      actualizado_en: fechaMock,
    } as never);

    const resultado = await crearSolicitudNominaIndividualService(
      usuarioAdministrador,
      inputNominaBase,
    );

    expect(resultado.status).toBe(201);

    expect(
      obtenerAccesoActivoUsuarioProyectoLineaRepository,
    ).not.toHaveBeenCalled();
  });

  it("debe validar los campos obligatorios", async () => {
    const resultado = await crearSolicitudNominaIndividualService(
      usuarioDirector,
      {
        ...inputNominaBase,
        concepto_nomina: "",
      },
    );

    expect(resultado.status).toBe(400);
    expect(resultado.body.message).toBe(
      "Proyecto base, centro de costo, trabajador, concepto de nómina, periodo, medio de pago y descripción son obligatorios.",
    );
    expect(crearSolicitudPagoRepository).not.toHaveBeenCalled();
  });

  it("debe rechazar una modalidad diferente de INDIVIDUAL", async () => {
    const resultado = await crearSolicitudNominaIndividualService(
      usuarioDirector,
      {
        ...inputNominaBase,
        modalidad_nomina: "AGRUPADA_EXCEL" as never,
      },
    );

    expect(resultado.status).toBe(400);
    expect(resultado.body.message).toBe(
      "La modalidad debe ser INDIVIDUAL para esta operación.",
    );
    expect(crearSolicitudPagoRepository).not.toHaveBeenCalled();
  });

  it("debe validar el formato del periodo de nómina", async () => {
    const resultado = await crearSolicitudNominaIndividualService(
      usuarioDirector,
      {
        ...inputNominaBase,
        periodo_nomina: "2026-13",
      },
    );

    expect(resultado.status).toBe(400);
    expect(resultado.body.message).toBe(
      "El periodo de nómina debe tener formato YYYY-MM.",
    );
    expect(crearSolicitudPagoRepository).not.toHaveBeenCalled();
  });

  it("debe rechazar un periodo que no corresponda al año vigente", async () => {
    const resultado = await crearSolicitudNominaIndividualService(
      usuarioDirector,
      {
        ...inputNominaBase,
        periodo_nomina: "2025-12",
      },
    );

    expect(resultado.status).toBe(400);
    expect(resultado.body.message).toBe(
      "El periodo de nómina debe corresponder al año vigente.",
    );
    expect(crearSolicitudPagoRepository).not.toHaveBeenCalled();
  });

  it("debe rechazar un periodo posterior al mes actual", async () => {
    const resultado = await crearSolicitudNominaIndividualService(
      usuarioDirector,
      {
        ...inputNominaBase,
        periodo_nomina: "2026-12",
      },
    );

    expect(resultado.status).toBe(400);
    expect(resultado.body.message).toBe(
      "El periodo de nómina no puede ser posterior al mes actual.",
    );
    expect(crearSolicitudPagoRepository).not.toHaveBeenCalled();
  });

  it("debe validar el medio de pago", async () => {
    const resultado = await crearSolicitudNominaIndividualService(
      usuarioDirector,
      {
        ...inputNominaBase,
        medio_pago: "CHEQUE" as never,
      },
    );

    expect(resultado.status).toBe(400);
    expect(resultado.body.message).toBe("El medio de pago no es válido.");
    expect(crearSolicitudPagoRepository).not.toHaveBeenCalled();
  });

  it("debe validar el valor bruto mayor a cero", async () => {
    const resultado = await crearSolicitudNominaIndividualService(
      usuarioDirector,
      {
        ...inputNominaBase,
        valor_bruto: 0,
      },
    );

    expect(resultado.status).toBe(400);
    expect(resultado.body.message).toBe(
      "Los valores deben ser numéricos y el valor bruto debe ser mayor a cero.",
    );
    expect(crearSolicitudPagoRepository).not.toHaveBeenCalled();
  });

  it("debe rechazar un valor neto negativo", async () => {
    const resultado = await crearSolicitudNominaIndividualService(
      usuarioDirector,
      {
        ...inputNominaBase,
        valor_bruto: 100000,
        valor_retenciones: 80000,
        valor_descuentos: 30000,
      },
    );

    expect(resultado.status).toBe(400);
    expect(resultado.body.message).toBe(
      "El valor neto de la nómina no puede ser negativo.",
    );
    expect(crearSolicitudPagoRepository).not.toHaveBeenCalled();
  });

  it("debe validar acceso activo del director al proyecto y línea", async () => {
    vi.mocked(obtenerProyectoBaseActivoRepository).mockResolvedValue(
      proyectoBaseMock as never,
    );

    vi.mocked(obtenerCentroCostoActivoRepository).mockResolvedValue(
      centroCostoMock as never,
    );

    vi.mocked(
      obtenerAccesoActivoUsuarioProyectoLineaRepository,
    ).mockResolvedValue(null);

    const resultado = await crearSolicitudNominaIndividualService(
      usuarioDirector,
      inputNominaBase,
    );

    expect(resultado.status).toBe(403);
    expect(resultado.body.message).toBe(
      "No tiene acceso activo al proyecto y línea de negocio seleccionados.",
    );
  });

  it("debe validar que el beneficiario sea un trabajador", async () => {
    vi.mocked(obtenerProyectoBaseActivoRepository).mockResolvedValue(
      proyectoBaseMock as never,
    );

    vi.mocked(obtenerCentroCostoActivoRepository).mockResolvedValue(
      centroCostoMock as never,
    );

    vi.mocked(
      obtenerAccesoActivoUsuarioProyectoLineaRepository,
    ).mockResolvedValue(accesoDirectorMock as never);

    vi.mocked(obtenerFondoActivoPorProyectoRepository).mockResolvedValue(
      fondoMock as never,
    );

    vi.mocked(obtenerBeneficiarioActivoRepository).mockResolvedValue(
      beneficiarioProveedorMock as never,
    );

    const resultado = await crearSolicitudNominaIndividualService(
      usuarioDirector,
      inputNominaBase,
    );

    expect(resultado.status).toBe(400);
    expect(resultado.body.message).toBe(
      "Para una nómina individual, el beneficiario debe ser tipo TRABAJADOR.",
    );
    expect(crearSolicitudPagoRepository).not.toHaveBeenCalled();
  });

  it("debe impedir una nómina individual duplicada no anulada", async () => {
    prepararMocksNomina();

    vi.mocked(
      buscarDuplicadoNominaIndividualRepository,
    ).mockResolvedValue({
      id: "solicitud-existente",
      numero_solicitud: "SOL-PRO-OBRA-HUMAPO-2026-000001",
      estado_actual: "BORRADOR",
    });

    const resultado = await crearSolicitudNominaIndividualService(
      usuarioDirector,
      inputNominaBase,
    );

    expect(resultado.status).toBe(409);
    expect(resultado.body.message).toBe(
      "Ya existe la solicitud SOL-PRO-OBRA-HUMAPO-2026-000001 para este trabajador, concepto y periodo.",
    );

    expect(crearSolicitudPagoRepository).not.toHaveBeenCalled();
    expect(generarNumeroSolicitudPagoService).not.toHaveBeenCalled();
  });

  it("debe consultar duplicados con el concepto normalizado", async () => {
    prepararMocksNomina();

    await crearSolicitudNominaIndividualService(usuarioDirector, {
      ...inputNominaBase,
      concepto_nomina: "  salario  ",
    });

    expect(
      buscarDuplicadoNominaIndividualRepository,
    ).toHaveBeenCalledWith({
      proyecto_base_id: "proyecto-1",
      centro_costo_id: "centro-1",
      beneficiario_id: "trabajador-1",
      concepto_nomina: "SALARIO",
      periodo_nomina: "2026-07",
    });
  });

  it("debe crear una solicitud de nómina individual en borrador", async () => {
    prepararMocksNomina();

    const resultado = await crearSolicitudNominaIndividualService(
      usuarioDirector,
      inputNominaBase,
    );

    expect(resultado.status).toBe(201);
    expect(resultado.body.ok).toBe(true);
    expect(resultado.body.message).toBe(
      "Borrador de solicitud de nómina individual creado correctamente.",
    );

    expect(resultado.body.data?.solicitud.numero_solicitud).toBeNull();

    expect(resultado.body.data?.solicitud.tipo_solicitud).toBe(
      "PAGO_NOMINA",
    );

    expect(resultado.body.data?.solicitud.modalidad_nomina).toBe(
      "INDIVIDUAL",
    );

    expect(resultado.body.data?.solicitud.valor_neto).toBe(1700000);

    expect(generarNumeroSolicitudPagoService).not.toHaveBeenCalled();

    expect(crearSolicitudPagoRepository).toHaveBeenCalledWith({
      numero_solicitud: null,
      tipo_solicitud: "PAGO_NOMINA",
      modalidad_nomina: "INDIVIDUAL",
      periodo_nomina: "2026-07",
      proyecto_base_id: "proyecto-1",
      fondo_id: "fondo-1",
      centro_costo_id: "centro-1",
      beneficiario_id: "trabajador-1",
      proveedor_id: null,
      categoria_gasto: null,
      categoria_reembolso: null,
      concepto_nomina: "SALARIO",
      tipo_impuesto: null,
      periodo_impuesto: null,
      medio_pago: "TRANSFERENCIA",
      adjunto_archivo_origen_id: null,
      descripcion: "Pago de nómina individual de julio",
      valor_bruto: 2000000,
      valor_retenciones: 200000,
      valor_descuentos: 100000,
      valor_neto: 1700000,
      estado_actual: "BORRADOR",
      creado_por: "director-1",
    });
  });

  it("debe permitir al aprobador nivel 1 crear nómina individual", async () => {
    prepararMocksNomina();

    const resultado = await crearSolicitudNominaIndividualService(
      usuarioAprobador1,
      inputNominaBase,
    );

    expect(resultado.status).toBe(201);
    expect(crearSolicitudPagoRepository).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo_solicitud: "PAGO_NOMINA",
        modalidad_nomina: "INDIVIDUAL",
        creado_por: "aprobador-1",
      }),
    );
  });
});

describe(
  "solicitudes-pago.service - crearSolicitudPagoImpuestoService",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("debe rechazar al solicitante para crear una solicitud de impuesto", async () => {
      const resultado = await crearSolicitudPagoImpuestoService(
        usuarioSolicitante,
        inputImpuestoBase,
      );

      expect(resultado.status).toBe(403);
      expect(resultado.body.ok).toBe(false);
      expect(resultado.body.message).toBe(
        "Solo un Aprobador nivel 1, Director, Auxiliar contable o Administrador puede crear solicitudes de pago de impuestos.",
      );

      expect(
        obtenerProyectoBaseActivoRepository,
      ).not.toHaveBeenCalled();

      expect(crearSolicitudPagoRepository).not.toHaveBeenCalled();
    });

    it("debe rechazar al aprobador 2 para crear una solicitud de impuesto", async () => {
      const resultado = await crearSolicitudPagoImpuestoService(
        usuarioAprobador2,
        inputImpuestoBase,
      );

      expect(resultado.status).toBe(403);
      expect(resultado.body.ok).toBe(false);
      expect(resultado.body.message).toBe(
        "Solo un Aprobador nivel 1, Director, Auxiliar contable o Administrador puede crear solicitudes de pago de impuestos.",
      );

      expect(
        obtenerProyectoBaseActivoRepository,
      ).not.toHaveBeenCalled();

      expect(crearSolicitudPagoRepository).not.toHaveBeenCalled();
    });

    it("debe rechazar al rol pagos para crear una solicitud de impuesto", async () => {
      const resultado = await crearSolicitudPagoImpuestoService(
        usuarioPagos,
        inputImpuestoBase,
      );

      expect(resultado.status).toBe(403);
      expect(resultado.body.ok).toBe(false);
      expect(resultado.body.message).toBe(
        "Solo un Aprobador nivel 1, Director, Auxiliar contable o Administrador puede crear solicitudes de pago de impuestos.",
      );

      expect(
        obtenerProyectoBaseActivoRepository,
      ).not.toHaveBeenCalled();

      expect(crearSolicitudPagoRepository).not.toHaveBeenCalled();
    });
  },
);

describe(
  "solicitudes-pago.service - crearSolicitudReembolsoService",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it.each([
      ["solicitante", usuarioSolicitante],
      ["director", usuarioDirector],
      ["auxiliar contable", usuarioAuxiliarContable],
      ["aprobador nivel 1", usuarioAprobador1],
      ["administrador", usuarioAdministrador],
    ])(
      "debe permitir crear un reembolso al rol %s",
      async (_rol, usuario) => {
        prepararMocksReembolso(usuario);

        const resultado = await crearSolicitudReembolsoService(
          usuario,
          inputReembolsoBase,
        );

        expect(resultado.status).toBe(201);
        expect(resultado.body.ok).toBe(true);
      },
    );

    it.each([
      ["aprobador nivel 2", usuarioAprobador2],
      ["pagos", usuarioPagos],
    ])(
      "debe rechazar al rol %s",
      async (_rol, usuario) => {
        const resultado = await crearSolicitudReembolsoService(
          usuario,
          inputReembolsoBase,
        );

        expect(resultado.status).toBe(403);
        expect(resultado.body.ok).toBe(false);
        expect(resultado.body.message).toBe(
          "Solo un Solicitante, Director, Auxiliar contable, Aprobador nivel 1 o Administrador puede crear solicitudes de reembolso.",
        );
        expect(
          obtenerProyectoBaseActivoRepository,
        ).not.toHaveBeenCalled();
        expect(crearSolicitudPagoRepository).not.toHaveBeenCalled();
      },
    );

    it("debe validar los campos obligatorios", async () => {
      const resultado = await crearSolicitudReembolsoService(
        usuarioSolicitante,
        {
          ...inputReembolsoBase,
          categoria_reembolso: undefined,
        },
      );

      expect(resultado.status).toBe(400);
      expect(resultado.body.message).toBe(
        "Proyecto base, centro de costo, beneficiario, categoría de reembolso, medio de pago y descripción son obligatorios.",
      );
      expect(crearSolicitudPagoRepository).not.toHaveBeenCalled();
    });

    it("debe rechazar una categoría de reembolso inválida", async () => {
      const resultado = await crearSolicitudReembolsoService(
        usuarioSolicitante,
        {
          ...inputReembolsoBase,
          categoria_reembolso: "HONORARIOS" as never,
        },
      );

      expect(resultado.status).toBe(400);
      expect(resultado.body.message).toBe(
        "La categoría de reembolso no es válida.",
      );
      expect(crearSolicitudPagoRepository).not.toHaveBeenCalled();
    });

    it("debe rechazar un medio de pago inválido", async () => {
      const resultado = await crearSolicitudReembolsoService(
        usuarioSolicitante,
        {
          ...inputReembolsoBase,
          medio_pago: "CHEQUE" as never,
        },
      );

      expect(resultado.status).toBe(400);
      expect(resultado.body.message).toBe(
        "El medio de pago no es válido.",
      );
      expect(crearSolicitudPagoRepository).not.toHaveBeenCalled();
    });

    it("debe validar que el valor bruto sea mayor a cero", async () => {
      const resultado = await crearSolicitudReembolsoService(
        usuarioSolicitante,
        {
          ...inputReembolsoBase,
          valor_bruto: 0,
        },
      );

      expect(resultado.status).toBe(400);
      expect(resultado.body.message).toBe(
        "El valor bruto del reembolso debe ser numérico y mayor a cero.",
      );
      expect(crearSolicitudPagoRepository).not.toHaveBeenCalled();
    });

    it("debe rechazar valores secundarios negativos", async () => {
      const resultado = await crearSolicitudReembolsoService(
        usuarioSolicitante,
        {
          ...inputReembolsoBase,
          valor_retenciones: -1,
        },
      );

      expect(resultado.status).toBe(400);
      expect(resultado.body.message).toBe(
        "Impuestos y retenciones, junto con los descuentos, deben ser valores numéricos no negativos.",
      );
      expect(crearSolicitudPagoRepository).not.toHaveBeenCalled();
    });

    it("debe rechazar un valor neto negativo", async () => {
      const resultado = await crearSolicitudReembolsoService(
        usuarioSolicitante,
        {
          ...inputReembolsoBase,
          valor_bruto: 100000,
          valor_retenciones: 80000,
          valor_descuentos: 30000,
        },
      );

      expect(resultado.status).toBe(400);
      expect(resultado.body.message).toBe(
        "El valor neto del reembolso no puede ser negativo.",
      );
      expect(crearSolicitudPagoRepository).not.toHaveBeenCalled();
    });

    it("debe rechazar un beneficiario inexistente o inactivo", async () => {
      prepararMocksReembolso();

      vi.mocked(obtenerBeneficiarioActivoRepository).mockResolvedValue(
        null,
      );

      const resultado = await crearSolicitudReembolsoService(
        usuarioSolicitante,
        inputReembolsoBase,
      );

      expect(resultado.status).toBe(404);
      expect(resultado.body.message).toBe(
        "El beneficiario del reembolso no existe o está inactivo.",
      );
      expect(crearSolicitudPagoRepository).not.toHaveBeenCalled();
    });

    it("debe exigir que el beneficiario sea tipo TRABAJADOR", async () => {
      prepararMocksReembolso();

      vi.mocked(obtenerBeneficiarioActivoRepository).mockResolvedValue(
        beneficiarioProveedorMock as never,
      );

      const resultado = await crearSolicitudReembolsoService(
        usuarioSolicitante,
        inputReembolsoBase,
      );

      expect(resultado.status).toBe(400);
      expect(resultado.body.message).toBe(
        "El beneficiario del reembolso debe ser de tipo TRABAJADOR.",
      );
      expect(crearSolicitudPagoRepository).not.toHaveBeenCalled();
    });

    it("debe crear una solicitud de reembolso en borrador", async () => {
      prepararMocksReembolso();

      const resultado = await crearSolicitudReembolsoService(
        usuarioSolicitante,
        inputReembolsoBase,
      );

      expect(resultado.status).toBe(201);
      expect(resultado.body.ok).toBe(true);
      expect(resultado.body.message).toBe(
        "Borrador de solicitud de reembolso creado correctamente.",
      );
      expect(resultado.body.data?.solicitud.tipo_solicitud).toBe(
        "REEMBOLSO",
      );
      expect(resultado.body.data?.solicitud.valor_neto).toBe(370000);

      expect(crearSolicitudPagoRepository).toHaveBeenCalledWith({
        numero_solicitud: null,
        tipo_solicitud: "REEMBOLSO",
        modalidad_nomina: null,
        periodo_nomina: null,
        proyecto_base_id: "proyecto-1",
        fondo_id: "fondo-1",
        centro_costo_id: "centro-1",
        beneficiario_id: "trabajador-1",
        proveedor_id: null,
        categoria_gasto: null,
        categoria_reembolso: "TRANSPORTE",
        concepto_nomina: null,
        tipo_impuesto: null,
        periodo_impuesto: null,
        medio_pago: "TRANSFERENCIA",
        adjunto_archivo_origen_id: null,
        descripcion: "Reembolso de transporte para visita de obra",
        valor_bruto: 500000,
        valor_retenciones: 120000,
        valor_descuentos: 10000,
        valor_neto: 370000,
        estado_actual: "BORRADOR",
        creado_por: "usuario-1",
      });
    });
  },
);

describe(
  "solicitudes-pago.service - registrarAdjuntosSolicitudPagoService",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("no debe registrar adjuntos ni eliminar la solicitud cuando no hay archivos", async () => {
      await registrarAdjuntosSolicitudPagoService({
        solicitudPagoId: "solicitud-1",
        archivos: [],
        usuarioId: "usuario-1",
        carpeta: "solicitudes-pago/proveedores",
      });

      expect(
        crearAdjuntosSolicitudPagoService,
      ).not.toHaveBeenCalled();

      expect(
        eliminarSolicitudPagoRepository,
      ).not.toHaveBeenCalled();
    });

    it("debe registrar los adjuntos asociados a la solicitud", async () => {
      const archivos = [
        new File(["contenido factura"], "factura.pdf", {
          type: "application/pdf",
        }),
      ];

      vi.mocked(
        crearAdjuntosSolicitudPagoService,
      ).mockResolvedValue([] as never);

      await registrarAdjuntosSolicitudPagoService({
        solicitudPagoId: "solicitud-1",
        archivos,
        usuarioId: "usuario-1",
        carpeta: "solicitudes-pago/proveedores",
      });

      expect(
        crearAdjuntosSolicitudPagoService,
      ).toHaveBeenCalledTimes(1);

      expect(
        crearAdjuntosSolicitudPagoService,
      ).toHaveBeenCalledWith({
        solicitudPagoId: "solicitud-1",
        archivos,
        subidoPor: "usuario-1",
        carpeta: "solicitudes-pago/proveedores",
      });

      expect(
        eliminarSolicitudPagoRepository,
      ).not.toHaveBeenCalled();
    });

    it("debe eliminar la solicitud y relanzar el error cuando falla el registro de adjuntos", async () => {
      const archivos = [
        new File(["contenido factura"], "factura.pdf", {
          type: "application/pdf",
        }),
      ];

      const errorAdjuntos = new Error(
        "No fue posible registrar los adjuntos.",
      );

      vi.mocked(
        crearAdjuntosSolicitudPagoService,
      ).mockRejectedValue(errorAdjuntos);

      vi.mocked(
        eliminarSolicitudPagoRepository,
      ).mockResolvedValue({} as never);

      await expect(
        registrarAdjuntosSolicitudPagoService({
          solicitudPagoId: "solicitud-1",
          archivos,
          usuarioId: "usuario-1",
          carpeta: "solicitudes-pago/proveedores",
        }),
      ).rejects.toBe(errorAdjuntos);

      expect(
        eliminarSolicitudPagoRepository,
      ).toHaveBeenCalledTimes(1);

      expect(
        eliminarSolicitudPagoRepository,
      ).toHaveBeenCalledWith("solicitud-1");
    });
  },
);

describe("solicitudes-pago.service - enviarSolicitudPagoService", () => {
  const solicitudBorrador = {
    id: "solicitud-1",
    numero_solicitud: null,
    tipo_solicitud: "REEMBOLSO",
    modalidad_nomina: null,
    periodo_nomina: null,
    proyecto_base_id: "proyecto-1",
    fondo_id: "fondo-1",
    centro_costo_id: "centro-1",
    beneficiario_id: "trabajador-1",
    proveedor_id: null,
    categoria_gasto: null,
    categoria_reembolso: "TRANSPORTE",
    concepto_nomina: null,
    tipo_impuesto: null,
    periodo_impuesto: null,
    medio_pago: "TRANSFERENCIA",
    adjunto_archivo_origen_id: null,
    descripcion: "Reembolso de transporte",
    valor_bruto: 500000 as never,
    valor_retenciones: 0 as never,
    valor_descuentos: 0 as never,
    valor_neto: 500000 as never,
    valor_pagado: null,
    valor_reservado: null,
    estado_actual: "BORRADOR",
    creado_por: "usuario-1",
    aprobado_1_por: null,
    aprobado_2_por: null,
    pagado_por: null,
    enviado_en: null,
    aprobado_1_en: null,
    aprobado_2_en: null,
    devuelto_aprobador_1_en: null,
    devuelto_solicitante_en: null,
    pagado_en: null,
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
    beneficiario: {
      id: "trabajador-1",
      nombre: "Trabajador Uno",
      tipo_beneficiario: "TRABAJADOR",
      tipo_documento: "CC",
      numero_documento: "123456789",
    },
    proveedor: null,
    creador: {
      id: "usuario-1",
      nombre: "Solicitante",
      correo: "solicitante@test.com",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe rechazar a un usuario sin autorización para enviar", async () => {
    const resultado = await enviarSolicitudPagoService(
      usuarioPagos,
      "solicitud-1",
    );

    expect(resultado.status).toBe(403);
    expect(resultado.body.message).toBe(
      "No tiene permisos para enviar solicitudes de pago.",
    );
    expect(obtenerSolicitudPagoPorIdRepository).not.toHaveBeenCalled();
  });

  it("debe validar el identificador obligatorio", async () => {
    const resultado = await enviarSolicitudPagoService(
      usuarioSolicitante,
      "   ",
    );

    expect(resultado.status).toBe(400);
    expect(resultado.body.message).toBe(
      "El identificador de la solicitud es obligatorio.",
    );
  });

  it("debe responder 404 cuando la solicitud no existe", async () => {
    vi.mocked(obtenerSolicitudPagoPorIdRepository).mockResolvedValue(
      null,
    );

    const resultado = await enviarSolicitudPagoService(
      usuarioSolicitante,
      "solicitud-inexistente",
    );

    expect(resultado.status).toBe(404);
    expect(resultado.body.message).toBe(
      "La solicitud de pago no existe.",
    );
  });

  it("debe impedir que otro usuario envíe la solicitud", async () => {
    vi.mocked(obtenerSolicitudPagoPorIdRepository).mockResolvedValue(
      solicitudBorrador as never,
    );

    const resultado = await enviarSolicitudPagoService(
      usuarioDirector,
      "solicitud-1",
    );

    expect(resultado.status).toBe(403);
    expect(resultado.body.message).toBe(
      "Solo el creador de la solicitud o un Administrador puede enviarla.",
    );
    expect(enviarSolicitudPagoRepository).not.toHaveBeenCalled();
  });

  it("debe permitir que un Administrador envíe una solicitud ajena", async () => {
    const fechaEnvio = new Date("2026-07-17T20:00:00.000Z");

    vi.mocked(obtenerSolicitudPagoPorIdRepository).mockResolvedValue(
      solicitudBorrador as never,
    );

    vi.mocked(enviarSolicitudPagoRepository).mockResolvedValue({
      ...solicitudBorrador,
      estado_actual: "PENDIENTE_APROBADOR_1",
      enviado_en: fechaEnvio,
    } as never);

    const resultado = await enviarSolicitudPagoService(
      usuarioAdministrador,
      "solicitud-1",
    );

    expect(resultado.status).toBe(200);
    expect(resultado.body.ok).toBe(true);
    expect(resultado.body.data?.solicitud.estado_actual).toBe(
      "PENDIENTE_APROBADOR_1",
    );
  });

  it("debe rechazar una solicitud que no esté en BORRADOR", async () => {
    vi.mocked(obtenerSolicitudPagoPorIdRepository).mockResolvedValue({
      ...solicitudBorrador,
      estado_actual: "PENDIENTE_APROBADOR_1",
      enviado_en: new Date("2026-07-17T20:00:00.000Z"),
    } as never);

    const resultado = await enviarSolicitudPagoService(
      usuarioSolicitante,
      "solicitud-1",
    );

    expect(resultado.status).toBe(409);
    expect(resultado.body.message).toBe(
      "Solo se pueden enviar borradores que todavía no tengan número de solicitud.",
    );
    expect(enviarSolicitudPagoRepository).not.toHaveBeenCalled();
  });

  it("debe controlar una transición concurrente", async () => {
    vi.mocked(obtenerSolicitudPagoPorIdRepository).mockResolvedValue(
      solicitudBorrador as never,
    );
    vi.mocked(enviarSolicitudPagoRepository).mockResolvedValue(null);

    const resultado = await enviarSolicitudPagoService(
      usuarioSolicitante,
      "solicitud-1",
    );

    expect(resultado.status).toBe(409);
    expect(resultado.body.message).toBe(
      "La solicitud ya no se encuentra en estado BORRADOR. Actualice la información e inténtelo nuevamente.",
    );
  });

  it("debe enviar una solicitud propia en estado BORRADOR", async () => {
    const fechaEnvio = new Date("2026-07-17T20:00:00.000Z");

    vi.mocked(obtenerSolicitudPagoPorIdRepository).mockResolvedValue(
      solicitudBorrador as never,
    );

    vi.mocked(enviarSolicitudPagoRepository).mockResolvedValue({
      ...solicitudBorrador,
      estado_actual: "PENDIENTE_APROBADOR_1",
      enviado_en: fechaEnvio,
    } as never);

    const resultado = await enviarSolicitudPagoService(
      usuarioSolicitante,
      "solicitud-1",
    );

    expect(resultado.status).toBe(200);
    expect(resultado.body.ok).toBe(true);
    expect(resultado.body.message).toBe(
      "Solicitud de pago enviada correctamente.",
    );
    expect(resultado.body.data?.solicitud.estado_actual).toBe(
      "PENDIENTE_APROBADOR_1",
    );
    expect(resultado.body.data?.solicitud.enviado_en).toEqual(
      fechaEnvio,
    );

    expect(enviarSolicitudPagoRepository).toHaveBeenCalledWith({
      solicitudId: "solicitud-1",
      enviadoEn: expect.any(Date),
      usuarioId: "usuario-1",
    });
  });
});

describe("solicitudes-pago.service - aprobarSolicitudesNivel1Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe rechazar un usuario sin permiso para aprobar en nivel 1", async () => {
    const resultado = await aprobarSolicitudesNivel1Service(
      usuarioSinPermisos,
      {
        solicitud_ids: ["solicitud-1"],
      },
    );

    expect(resultado.status).toBe(403);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe(
      "No tiene permisos para aprobar solicitudes en nivel 1.",
    );

    expect(
      obtenerSolicitudesPagoPorIdsRepository,
    ).not.toHaveBeenCalled();

    expect(
      aprobarSolicitudesNivel1Repository,
    ).not.toHaveBeenCalled();
  });

  it("debe rechazar una selección vacía de solicitudes", async () => {
    const resultado = await aprobarSolicitudesNivel1Service(
      usuarioAprobador1,
      {
        solicitud_ids: [],
      },
    );

    expect(resultado.status).toBe(400);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe(
      "Debe seleccionar al menos una solicitud.",
    );

    expect(
      obtenerSolicitudesPagoPorIdsRepository,
    ).not.toHaveBeenCalled();

    expect(
      aprobarSolicitudesNivel1Repository,
    ).not.toHaveBeenCalled();
  });

  it("debe rechazar identificadores de solicitudes inválidos", async () => {
    const resultado = await aprobarSolicitudesNivel1Service(
      usuarioAprobador1,
      {
        solicitud_ids: ["solicitud-1", "", "   "] as never,
      },
    );

    expect(resultado.status).toBe(400);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe(
      "Todos los identificadores de solicitudes deben ser textos no vacíos.",
    );

    expect(
      obtenerSolicitudesPagoPorIdsRepository,
    ).not.toHaveBeenCalled();

    expect(
      aprobarSolicitudesNivel1Repository,
    ).not.toHaveBeenCalled();
  });

  it("debe rechazar identificadores de solicitudes duplicados", async () => {
    const resultado = await aprobarSolicitudesNivel1Service(
      usuarioAprobador1,
      {
        solicitud_ids: ["solicitud-1", "solicitud-1"],
      },
    );

    expect(resultado.status).toBe(400);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe(
      "La selección contiene identificadores de solicitudes duplicados.",
    );

    expect(
      obtenerSolicitudesPagoPorIdsRepository,
    ).not.toHaveBeenCalled();

    expect(
      aprobarSolicitudesNivel1Repository,
    ).not.toHaveBeenCalled();
  });

  it("debe rechazar cuando alguna solicitud seleccionada no existe", async () => {
    vi.mocked(
      obtenerSolicitudesPagoPorIdsRepository,
    ).mockResolvedValue([
      {
        id: "solicitud-1",
      },
    ] as never);

    const resultado = await aprobarSolicitudesNivel1Service(
      usuarioAprobador1,
      {
        solicitud_ids: ["solicitud-1", "solicitud-2"],
      },
    );

    expect(resultado.status).toBe(404);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe(
      "No existen las siguientes solicitudes de pago: solicitud-2.",
    );

    expect(
      obtenerSolicitudesPagoPorIdsRepository,
    ).toHaveBeenCalledWith([
      "solicitud-1",
      "solicitud-2",
    ]);

    expect(
      obtenerReservasPorFondosRepository,
    ).not.toHaveBeenCalled();

    expect(
      aprobarSolicitudesNivel1Repository,
    ).not.toHaveBeenCalled();
  });

  it("debe rechazar solicitudes que no estén en revisión de aprobación nivel 1", async () => {
    vi.mocked(
      obtenerSolicitudesPagoPorIdsRepository,
    ).mockResolvedValue([
      {
        id: "solicitud-1",
        numero_solicitud: "SOL-PRO-OBRA-HUMAPO-2026-000001",
        estado_actual: "BORRADOR",
      },
    ] as never);

    const resultado = await aprobarSolicitudesNivel1Service(
      usuarioAprobador1,
      {
        solicitud_ids: ["solicitud-1"],
      },
    );

    expect(resultado.status).toBe(409);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe(
      "Todas las solicitudes deben estar pendientes de nivel 1 o devueltas desde nivel 2. Solicitudes no aprobables: SOL-PRO-OBRA-HUMAPO-2026-000001 (BORRADOR).",
    );

    expect(
      obtenerSolicitudesPagoPorIdsRepository,
    ).toHaveBeenCalledWith([
      "solicitud-1",
    ]);

    expect(
      obtenerReservasPorFondosRepository,
    ).not.toHaveBeenCalled();

    expect(
      aprobarSolicitudesNivel1Repository,
    ).not.toHaveBeenCalled();
  });

  it("debe rechazar solicitudes cuando el saldo disponible del fondo es insuficiente", async () => {
    vi.mocked(
      obtenerSolicitudesPagoPorIdsRepository,
    ).mockResolvedValue([
      {
        id: "solicitud-1",
        numero_solicitud: "SOL-PRO-OBRA-HUMAPO-2026-000001",
        estado_actual: "PENDIENTE_APROBADOR_1",
        fondo_id: "fondo-1",
        proyecto_base_id: "proyecto-1",
        valor_neto: 800,
        fondo: {
          saldo_actual: 1000,
          activo: true,
        },
        proyecto_base: {
          nombre: "HUMAPO",
        },
      },
    ] as never);

    vi.mocked(
      obtenerReservasPorFondosRepository,
    ).mockResolvedValue([
      {
        fondo_id: "fondo-1",
        _sum: {
          valor_reservado: 300,
        },
      },
    ] as never);

    const resultado = await aprobarSolicitudesNivel1Service(
      usuarioAprobador1,
      {
        solicitud_ids: ["solicitud-1"],
      },
    );

    expect(resultado.status).toBe(409);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe(
      "Las solicitudes SOL-PRO-OBRA-HUMAPO-2026-000001 del proyecto HUMAPO " +
        "no pueden aprobarse porque el saldo disponible es insuficiente. " +
        "Para continuar con las demás solicitudes, deseleccione las " +
        "solicitudes asociadas a los proyectos sin saldo suficiente.",
    );

    expect(
      obtenerReservasPorFondosRepository,
    ).toHaveBeenCalledWith(["fondo-1"]);

    expect(
      aprobarSolicitudesNivel1Repository,
    ).not.toHaveBeenCalled();
  });

  it("debe rechazar solicitudes asociadas a fondos inactivos", async () => {
    vi.mocked(
      obtenerSolicitudesPagoPorIdsRepository,
    ).mockResolvedValue([
      {
        id: "solicitud-1",
        numero_solicitud: "SOL-PRO-OBRA-HUMAPO-2026-000001",
        estado_actual: "PENDIENTE_APROBADOR_1",
        fondo_id: "fondo-1",
        proyecto_base_id: "proyecto-1",
        valor_neto: 500,
        fondo: {
          saldo_actual: 1000,
          activo: false,
        },
        proyecto_base: {
          nombre: "HUMAPO",
        },
      },
    ] as never);

    vi.mocked(
      obtenerReservasPorFondosRepository,
    ).mockResolvedValue([
      {
        fondo_id: "fondo-1",
        _sum: {
          valor_reservado: 100,
        },
      },
    ] as never);

    const resultado = await aprobarSolicitudesNivel1Service(
      usuarioAprobador1,
      {
        solicitud_ids: ["solicitud-1"],
      },
    );

    expect(resultado.status).toBe(409);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe(
      "No es posible aprobar solicitudes asociadas a fondos inactivos. " +
        "Solicitudes afectadas: SOL-PRO-OBRA-HUMAPO-2026-000001.",
    );

    expect(
      obtenerReservasPorFondosRepository,
    ).toHaveBeenCalledWith(["fondo-1"]);

    expect(
      aprobarSolicitudesNivel1Repository,
    ).not.toHaveBeenCalled();
  });

  it("debe aprobar solicitudes en nivel 1 y reservar el saldo correspondiente", async () => {
    vi.mocked(
      obtenerSolicitudesPagoPorIdsRepository,
    ).mockResolvedValue([
      {
        id: "solicitud-1",
        numero_solicitud: "SOL-PRO-OBRA-HUMAPO-2026-000001",
        estado_actual: "PENDIENTE_APROBADOR_1",
        fondo_id: "fondo-1",
        proyecto_base_id: "proyecto-1",
        valor_neto: 1000,
        fondo: {
          saldo_actual: 5000,
          activo: true,
        },
        proyecto_base: {
          nombre: "HUMAPO",
        },
      },
      {
        id: "solicitud-2",
        numero_solicitud: "SOL-PRO-OBRA-HUMAPO-2026-000002",
        estado_actual: "PENDIENTE_APROBADOR_1",
        fondo_id: "fondo-1",
        proyecto_base_id: "proyecto-1",
        valor_neto: 800,
        fondo: {
          saldo_actual: 5000,
          activo: true,
        },
        proyecto_base: {
          nombre: "HUMAPO",
        },
      },
    ] as never);

    vi.mocked(
      obtenerReservasPorFondosRepository,
    ).mockResolvedValue([
      {
        fondo_id: "fondo-1",
        _sum: {
          valor_reservado: 500,
        },
      },
    ] as never);

    vi.mocked(
      aprobarSolicitudesNivel1Repository,
    ).mockResolvedValue({
      count: 2,
    });

    const resultado = await aprobarSolicitudesNivel1Service(
      usuarioAprobador1,
      {
        solicitud_ids: ["solicitud-1", "solicitud-2"],
      },
    );

    expect(resultado.status).toBe(200);
    expect(resultado.body.ok).toBe(true);
    expect(resultado.body.message).toBe(
      "Las solicitudes fueron aprobadas correctamente en nivel 1.",
    );

    expect(
      obtenerReservasPorFondosRepository,
    ).toHaveBeenCalledWith(["fondo-1"]);

    expect(
      aprobarSolicitudesNivel1Repository,
    ).toHaveBeenCalledWith(
      [
        {
          id: "solicitud-1",
          valor_reservado: 1000,
          estado_origen: "PENDIENTE_APROBADOR_1",
        },
        {
          id: "solicitud-2",
          valor_reservado: 800,
          estado_origen: "PENDIENTE_APROBADOR_1",
        },
      ],
      usuarioAprobador1.id,
      expect.any(Date),
    );

    expect(resultado.body.data).toEqual({
      cantidad_aprobada: 2,
      solicitudes: [
        {
          id: "solicitud-1",
          numero_solicitud:
            "SOL-PRO-OBRA-HUMAPO-2026-000001",
          proyecto_base_id: "proyecto-1",
          fondo_id: "fondo-1",
          valor_neto: 1000,
          estado_actual: "PENDIENTE_APROBADOR_2",
          aprobado_1_por: usuarioAprobador1.id,
          aprobado_1_en: expect.any(Date),
        },
        {
          id: "solicitud-2",
          numero_solicitud:
            "SOL-PRO-OBRA-HUMAPO-2026-000002",
          proyecto_base_id: "proyecto-1",
          fondo_id: "fondo-1",
          valor_neto: 800,
          estado_actual: "PENDIENTE_APROBADOR_2",
          aprobado_1_por: usuarioAprobador1.id,
          aprobado_1_en: expect.any(Date),
        },
      ],
      proyectos: [
        {
          proyecto_base_id: "proyecto-1",
          proyecto_base_nombre: "HUMAPO",
          fondo_id: "fondo-1",
          saldo_actual: 5000,
          reservas_existentes: 500,
          saldo_disponible: 4500,
          valor_seleccionado: 1800,
          saldo_proyectado: 2700,
          cantidad_solicitudes: 2,
        },
      ],
    });
  });

  it("debe controlar un cambio concurrente durante la aprobación en nivel 1", async () => {
    vi.mocked(
      obtenerSolicitudesPagoPorIdsRepository,
    ).mockResolvedValue([
      {
        id: "solicitud-1",
        numero_solicitud: "SOL-PRO-OBRA-HUMAPO-2026-000001",
        estado_actual: "PENDIENTE_APROBADOR_1",
        fondo_id: "fondo-1",
        proyecto_base_id: "proyecto-1",
        valor_neto: 1000,
        fondo: {
          saldo_actual: 5000,
          activo: true,
        },
        proyecto_base: {
          nombre: "HUMAPO",
        },
      },
    ] as never);

    vi.mocked(
      obtenerReservasPorFondosRepository,
    ).mockResolvedValue([
      {
        fondo_id: "fondo-1",
        _sum: {
          valor_reservado: 500,
        },
      },
    ] as never);

    vi.mocked(
      aprobarSolicitudesNivel1Repository,
    ).mockRejectedValue(
      new SolicitudesPagoCambioConcurrenteError(),
    );

    const resultado = await aprobarSolicitudesNivel1Service(
      usuarioAprobador1,
      {
        solicitud_ids: ["solicitud-1"],
      },
    );

    expect(resultado.status).toBe(409);
    expect(resultado.body).toEqual({
      ok: false,
      message:
        "Una o más solicitudes cambiaron de estado durante la aprobación. " +
        "Actualice la información e intente nuevamente.",
    });

    expect(
      aprobarSolicitudesNivel1Repository,
    ).toHaveBeenCalledWith(
      [
        {
          id: "solicitud-1",
          valor_reservado: 1000,
          estado_origen: "PENDIENTE_APROBADOR_1",
        },
      ],
      usuarioAprobador1.id,
      expect.any(Date),
    );
  });

  it("debe reenviar a nivel 2 una solicitud devuelta sin crear otra reserva", async () => {
    vi.mocked(obtenerSolicitudesPagoPorIdsRepository).mockResolvedValue([
      {
        ...solicitudProveedorBorrador,
        estado_actual: "DEVUELTA_APROBADOR_1",
        numero_solicitud: "SOL-DEVUELTA-001",
        valor_neto: 1000,
        valor_reservado: 1000,
        fondo: { saldo_actual: 5000, activo: true },
        proyecto_base: { nombre: "HUMAPO" },
      },
    ] as never);
    vi.mocked(obtenerReservasPorFondosRepository).mockResolvedValue([
      {
        fondo_id: "fondo-1",
        _sum: { valor_reservado: 1000 },
      },
    ] as never);
    vi.mocked(aprobarSolicitudesNivel1Repository).mockResolvedValue({
      count: 1,
    });

    const resultado = await aprobarSolicitudesNivel1Service(
      usuarioAprobador1,
      { solicitud_ids: ["solicitud-1"] },
    );

    expect(resultado.status).toBe(200);
    expect(aprobarSolicitudesNivel1Repository).toHaveBeenCalledWith(
      [
        {
          id: "solicitud-1",
          valor_reservado: 1000,
          estado_origen: "DEVUELTA_APROBADOR_1",
        },
      ],
      usuarioAprobador1.id,
      expect.any(Date),
    );
    expect(resultado.body.data?.proyectos[0].saldo_proyectado).toBe(
      4000,
    );
  });

  it("debe agrupar el resumen de aprobación por proyecto y fondo", async () => {
    vi.mocked(
      obtenerSolicitudesPagoPorIdsRepository,
    ).mockResolvedValue([
      {
        id: "solicitud-1",
        numero_solicitud: "SOL-PRO-OBRA-HUMAPO-2026-000001",
        estado_actual: "PENDIENTE_APROBADOR_1",
        fondo_id: "fondo-1",
        proyecto_base_id: "proyecto-1",
        valor_neto: 1000,
        fondo: {
          saldo_actual: 5000,
          activo: true,
        },
        proyecto_base: {
          nombre: "HUMAPO",
        },
      },
      {
        id: "solicitud-2",
        numero_solicitud: "SOL-PRO-OBRA-LOMA-LINDA-2026-000001",
        estado_actual: "PENDIENTE_APROBADOR_1",
        fondo_id: "fondo-2",
        proyecto_base_id: "proyecto-2",
        valor_neto: 1500,
        fondo: {
          saldo_actual: 8000,
          activo: true,
        },
        proyecto_base: {
          nombre: "LOMA LINDA",
        },
      },
    ] as never);

    vi.mocked(
      obtenerReservasPorFondosRepository,
    ).mockResolvedValue([
      {
        fondo_id: "fondo-1",
        _sum: {
          valor_reservado: 500,
        },
      },
      {
        fondo_id: "fondo-2",
        _sum: {
          valor_reservado: 1000,
        },
      },
    ] as never);

    vi.mocked(
      aprobarSolicitudesNivel1Repository,
    ).mockResolvedValue({
      count: 2,
    });

    const resultado = await aprobarSolicitudesNivel1Service(
      usuarioAprobador1,
      {
        solicitud_ids: ["solicitud-1", "solicitud-2"],
      },
    );
    expect(resultado.status).toBe(200);
    expect(resultado.body.ok).toBe(true);
    expect(resultado.body.data).toBeDefined();

    if (!resultado.body.data) {
      throw new Error(
        "Se esperaba que la respuesta incluyera el resumen de aprobación.",
      );
    }

    expect(
      obtenerReservasPorFondosRepository,
    ).toHaveBeenCalledWith(["fondo-1", "fondo-2"]);

    expect(resultado.body.data.proyectos).toEqual([
      {
        proyecto_base_id: "proyecto-1",
        proyecto_base_nombre: "HUMAPO",
        fondo_id: "fondo-1",
        saldo_actual: 5000,
        reservas_existentes: 500,
        saldo_disponible: 4500,
        valor_seleccionado: 1000,
        saldo_proyectado: 3500,
        cantidad_solicitudes: 1,
      },
      {
        proyecto_base_id: "proyecto-2",
        proyecto_base_nombre: "LOMA LINDA",
        fondo_id: "fondo-2",
        saldo_actual: 8000,
        reservas_existentes: 1000,
        saldo_disponible: 7000,
        valor_seleccionado: 1500,
        saldo_proyectado: 5500,
        cantidad_solicitudes: 1,
      },
    ]);

    expect(
      aprobarSolicitudesNivel1Repository,
    ).toHaveBeenCalledWith(
      [
        {
          id: "solicitud-1",
          valor_reservado: 1000,
          estado_origen: "PENDIENTE_APROBADOR_1",
        },
        {
          id: "solicitud-2",
          valor_reservado: 1500,
          estado_origen: "PENDIENTE_APROBADOR_1",
        },
      ],
      usuarioAprobador1.id,
      expect.any(Date),
    );
  });

  it("debe propagar errores inesperados del repositorio durante la aprobación", async () => {
    vi.mocked(
      obtenerSolicitudesPagoPorIdsRepository,
    ).mockResolvedValue([
      {
        id: "solicitud-1",
        numero_solicitud: "SOL-PRO-OBRA-HUMAPO-2026-000001",
        estado_actual: "PENDIENTE_APROBADOR_1",
        fondo_id: "fondo-1",
        proyecto_base_id: "proyecto-1",
        valor_neto: 1000,
        fondo: {
          saldo_actual: 5000,
          activo: true,
        },
        proyecto_base: {
          nombre: "HUMAPO",
        },
      },
    ] as never);

    vi.mocked(
      obtenerReservasPorFondosRepository,
    ).mockResolvedValue([
      {
        fondo_id: "fondo-1",
        _sum: {
          valor_reservado: 500,
        },
      },
    ] as never);

    const errorInesperado = new Error(
      "Error inesperado de base de datos",
    );

    vi.mocked(
      aprobarSolicitudesNivel1Repository,
    ).mockRejectedValue(errorInesperado);

    await expect(
      aprobarSolicitudesNivel1Service(
        usuarioAprobador1,
        {
          solicitud_ids: ["solicitud-1"],
        },
      ),
    ).rejects.toBe(errorInesperado);

    expect(
      aprobarSolicitudesNivel1Repository,
    ).toHaveBeenCalledWith(
      [
        {
          id: "solicitud-1",
          valor_reservado: 1000,
          estado_origen: "PENDIENTE_APROBADOR_1",
        },
      ],
      usuarioAprobador1.id,
      expect.any(Date),
    );
  });
});

describe("solicitudes-pago.service - aprobarSolicitudesNivel2Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe rechazar un usuario sin permiso para aprobar en nivel 2", async () => {
    const resultado = await aprobarSolicitudesNivel2Service(
      usuarioSinPermisos,
      {
        solicitud_ids: ["solicitud-1"],
      },
    );

    expect(resultado.status).toBe(403);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe(
      "No tiene permisos para aprobar solicitudes en nivel 2.",
    );

    expect(
      obtenerSolicitudesPagoPorIdsRepository,
    ).not.toHaveBeenCalled();

    expect(
      aprobarSolicitudesNivel2Repository,
    ).not.toHaveBeenCalled();
  });

  it("debe rechazar una selección vacía de solicitudes", async () => {
    const resultado = await aprobarSolicitudesNivel2Service(
      usuarioAprobador2,
      {
        solicitud_ids: [],
      },
    );

    expect(resultado.status).toBe(400);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe(
      "Debe seleccionar al menos una solicitud.",
    );

    expect(
      obtenerSolicitudesPagoPorIdsRepository,
    ).not.toHaveBeenCalled();

    expect(
      aprobarSolicitudesNivel2Repository,
    ).not.toHaveBeenCalled();
  });

  it("debe rechazar identificadores de solicitudes inválidos", async () => {
    const resultado = await aprobarSolicitudesNivel2Service(
      usuarioAprobador2,
      {
        solicitud_ids: ["solicitud-1", "", "   "] as never,
      },
    );

    expect(resultado.status).toBe(400);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe(
      "Todos los identificadores de solicitudes deben ser textos no vacíos.",
    );

    expect(
      obtenerSolicitudesPagoPorIdsRepository,
    ).not.toHaveBeenCalled();

    expect(
      aprobarSolicitudesNivel2Repository,
    ).not.toHaveBeenCalled();
  });

  it("debe rechazar identificadores de solicitudes duplicados", async () => {
    const resultado = await aprobarSolicitudesNivel2Service(
      usuarioAprobador2,
      {
        solicitud_ids: ["solicitud-1", "solicitud-1"],
      },
    );

    expect(resultado.status).toBe(400);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe(
      "La selección contiene identificadores de solicitudes duplicados.",
    );

    expect(
      obtenerSolicitudesPagoPorIdsRepository,
    ).not.toHaveBeenCalled();

    expect(
      aprobarSolicitudesNivel2Repository,
    ).not.toHaveBeenCalled();
  });

  it("debe rechazar cuando alguna solicitud seleccionada no existe", async () => {
    vi.mocked(
      obtenerSolicitudesPagoPorIdsRepository,
    ).mockResolvedValue([
      {
        id: "solicitud-1",
      },
    ] as never);

    const resultado = await aprobarSolicitudesNivel2Service(
      usuarioAprobador2,
      {
        solicitud_ids: ["solicitud-1", "solicitud-2"],
      },
    );

    expect(resultado.status).toBe(404);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe(
      "No existen las siguientes solicitudes de pago: solicitud-2.",
    );

    expect(
      obtenerSolicitudesPagoPorIdsRepository,
    ).toHaveBeenCalledWith([
      "solicitud-1",
      "solicitud-2",
    ]);

    expect(
      obtenerReservasPorFondosRepository,
    ).not.toHaveBeenCalled();

    expect(
      aprobarSolicitudesNivel2Repository,
    ).not.toHaveBeenCalled();
  });

  it("debe rechazar solicitudes que no estén pendientes de aprobación nivel 2", async () => {
    vi.mocked(
      obtenerSolicitudesPagoPorIdsRepository,
    ).mockResolvedValue([
      {
        id: "solicitud-1",
        numero_solicitud:
          "SOL-PRO-OBRA-HUMAPO-2026-000001",
        estado_actual: "PENDIENTE_APROBADOR_1",
      },
    ] as never);

    const resultado = await aprobarSolicitudesNivel2Service(
      usuarioAprobador2,
      {
        solicitud_ids: ["solicitud-1"],
      },
    );

    expect(resultado.status).toBe(409);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe(
      "Todas las solicitudes deben estar en estado PENDIENTE_APROBADOR_2. " +
        "Solicitudes no aprobables: " +
        "SOL-PRO-OBRA-HUMAPO-2026-000001 (PENDIENTE_APROBADOR_1).",
    );

    expect(
      obtenerSolicitudesPagoPorIdsRepository,
    ).toHaveBeenCalledWith(["solicitud-1"]);

    expect(
      obtenerReservasPorFondosRepository,
    ).not.toHaveBeenCalled();

    expect(
      aprobarSolicitudesNivel2Repository,
    ).not.toHaveBeenCalled();
  });

  it("debe aprobar solicitudes en nivel 2 y programarlas para pago sin crear una nueva reserva", async () => {
    const fechaAprobacion = new Date(
      "2026-07-22T10:00:00.000Z",
    );

    vi.useFakeTimers();
    vi.setSystemTime(fechaAprobacion);

    vi.mocked(
      obtenerSolicitudesPagoPorIdsRepository,
    ).mockResolvedValue([
      {
        id: "solicitud-1",
        numero_solicitud:
          "SOL-PRO-OBRA-HUMAPO-2026-000001",
        proyecto_base_id: "proyecto-1",
        fondo_id: "fondo-1",
        valor_neto: 100,
        valor_reservado: 100,
        estado_actual: "PENDIENTE_APROBADOR_2",
        proyecto_base: {
          nombre: "HUMAPO",
        },
        fondo: {
          saldo_actual: 1000,
        },
      },
    ] as never);

    vi.mocked(
      aprobarSolicitudesNivel2Repository,
    ).mockResolvedValue({
      count: 1,
    });

    vi.mocked(
      obtenerReservasPorFondosRepository,
    ).mockResolvedValue([
      {
        fondo_id: "fondo-1",
        _sum: {
          valor_reservado: 250,
        },
      },
    ] as never);

    const resultado = await aprobarSolicitudesNivel2Service(
      usuarioAprobador2,
      {
        solicitud_ids: ["solicitud-1"],
      },
    );

    expect(resultado.status).toBe(200);
    expect(resultado.body.ok).toBe(true);
    expect(resultado.body.message).toBe(
      "Las solicitudes fueron aprobadas correctamente en nivel 2.",
    );

    expect(
      aprobarSolicitudesNivel2Repository,
    ).toHaveBeenCalledWith(
      ["solicitud-1"],
      usuarioAprobador2.id,
      fechaAprobacion,
    );

    expect(
      obtenerReservasPorFondosRepository,
    ).toHaveBeenCalledWith(["fondo-1"]);

    expect(resultado.body.data).toEqual({
      cantidad_aprobada: 1,
      solicitudes: [
        {
          id: "solicitud-1",
          numero_solicitud:
            "SOL-PRO-OBRA-HUMAPO-2026-000001",
          proyecto_base_id: "proyecto-1",
          fondo_id: "fondo-1",
          valor_neto: 100,
          estado_actual: "PROGRAMADA_PAGO",
          aprobado_2_por: usuarioAprobador2.id,
          aprobado_2_en: fechaAprobacion,
        },
      ],
      proyectos: [
        {
          proyecto_base_id: "proyecto-1",
          proyecto_base_nombre: "HUMAPO",
          fondo_id: "fondo-1",
          saldo_actual: 1000,
          reservas_existentes: 250,
          saldo_disponible: 750,
          valor_seleccionado: 100,
          saldo_proyectado: 750,
          cantidad_solicitudes: 1,
        },
      ],
    });

    vi.useRealTimers();
  });

  it("debe controlar un cambio concurrente durante la aprobación en nivel 2", async () => {
    vi.mocked(
      obtenerSolicitudesPagoPorIdsRepository,
    ).mockResolvedValue([
      {
        id: "solicitud-1",
        numero_solicitud:
          "SOL-PRO-OBRA-HUMAPO-2026-000001",
        proyecto_base_id: "proyecto-1",
        fondo_id: "fondo-1",
        valor_neto: 100,
        valor_reservado: 100,
        estado_actual: "PENDIENTE_APROBADOR_2",
        proyecto_base: {
          nombre: "HUMAPO",
        },
        fondo: {
          saldo_actual: 1000,
        },
      },
    ] as never);

    vi.mocked(
      aprobarSolicitudesNivel2Repository,
    ).mockRejectedValue(
      new SolicitudesPagoCambioConcurrenteError(),
    );

    const resultado = await aprobarSolicitudesNivel2Service(
      usuarioAprobador2,
      {
        solicitud_ids: ["solicitud-1"],
      },
    );

    expect(resultado.status).toBe(409);
    expect(resultado.body.ok).toBe(false);
    expect(resultado.body.message).toBe(
      "Una o más solicitudes cambiaron de estado durante la aprobación. " +
        "Actualice la información e intente nuevamente.",
    );

    expect(
      aprobarSolicitudesNivel2Repository,
    ).toHaveBeenCalledWith(
      ["solicitud-1"],
      usuarioAprobador2.id,
      expect.any(Date),
    );

    expect(
      obtenerReservasPorFondosRepository,
    ).not.toHaveBeenCalled();
  });

    it("debe agrupar el resumen de aprobación nivel 2 por proyecto y fondo", async () => {
    vi.mocked(
      obtenerSolicitudesPagoPorIdsRepository,
    ).mockResolvedValue([
      {
        id: "solicitud-1",
        numero_solicitud:
          "SOL-PRO-OBRA-HUMAPO-2026-000001",
        proyecto_base_id: "proyecto-1",
        fondo_id: "fondo-1",
        valor_neto: 100,
        valor_reservado: 100,
        estado_actual: "PENDIENTE_APROBADOR_2",
        proyecto_base: {
          nombre: "HUMAPO",
        },
        fondo: {
          saldo_actual: 1000,
        },
      },
      {
        id: "solicitud-2",
        numero_solicitud:
          "SOL-PRO-OBRA-HUMAPO-2026-000002",
        proyecto_base_id: "proyecto-1",
        fondo_id: "fondo-1",
        valor_neto: 150,
        valor_reservado: 150,
        estado_actual: "PENDIENTE_APROBADOR_2",
        proyecto_base: {
          nombre: "HUMAPO",
        },
        fondo: {
          saldo_actual: 1000,
        },
      },
    ] as never);

    vi.mocked(
      aprobarSolicitudesNivel2Repository,
    ).mockResolvedValue({
      count: 2,
    });

    vi.mocked(
      obtenerReservasPorFondosRepository,
    ).mockResolvedValue([
      {
        fondo_id: "fondo-1",
        _sum: {
          valor_reservado: 400,
        },
      },
    ] as never);

    const resultado = await aprobarSolicitudesNivel2Service(
      usuarioAprobador2,
      {
        solicitud_ids: [
          "solicitud-1",
          "solicitud-2",
        ],
      },
    );

    expect(resultado.status).toBe(200);
    expect(resultado.body.ok).toBe(true);

    expect(resultado.body.data?.cantidad_aprobada).toBe(2);

    expect(resultado.body.data?.proyectos).toEqual([
      {
        proyecto_base_id: "proyecto-1",
        proyecto_base_nombre: "HUMAPO",
        fondo_id: "fondo-1",
        saldo_actual: 1000,
        reservas_existentes: 400,
        saldo_disponible: 600,
        valor_seleccionado: 250,
        saldo_proyectado: 600,
        cantidad_solicitudes: 2,
      },
    ]);

    expect(
      obtenerReservasPorFondosRepository,
    ).toHaveBeenCalledTimes(1);

    expect(
      obtenerReservasPorFondosRepository,
    ).toHaveBeenCalledWith(["fondo-1"]);
  });

  it("debe propagar errores inesperados del repositorio durante la aprobación en nivel 2", async () => {
    const errorInesperado = new Error(
      "Error inesperado de base de datos",
    );

    vi.mocked(
      obtenerSolicitudesPagoPorIdsRepository,
    ).mockResolvedValue([
      {
        id: "solicitud-1",
        numero_solicitud:
          "SOL-PRO-OBRA-HUMAPO-2026-000001",
        proyecto_base_id: "proyecto-1",
        fondo_id: "fondo-1",
        valor_neto: 100,
        valor_reservado: 100,
        estado_actual: "PENDIENTE_APROBADOR_2",
        proyecto_base: {
          nombre: "HUMAPO",
        },
        fondo: {
          saldo_actual: 1000,
        },
      },
    ] as never);

    vi.mocked(
      aprobarSolicitudesNivel2Repository,
    ).mockRejectedValue(errorInesperado);

    await expect(
      aprobarSolicitudesNivel2Service(
        usuarioAprobador2,
        {
          solicitud_ids: ["solicitud-1"],
        },
      ),
    ).rejects.toThrow(
      "Error inesperado de base de datos",
    );

    expect(
      obtenerReservasPorFondosRepository,
    ).not.toHaveBeenCalled();
  });
});

describe("solicitudes-pago.service - actualizarSolicitudPagoProveedorService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe rechazar usuario sin permiso para modificar solicitudes", async () => {
    const resultado =
      await actualizarSolicitudPagoProveedorService(
        usuarioSinPermisos,
        "solicitud-1",
        inputProveedorBase,
      );

    expect(resultado.status).toBe(403);
    expect(resultado.body.ok).toBe(false);

    expect(
      actualizarSolicitudPagoRepository,
    ).not.toHaveBeenCalled();
  });

  it("debe actualizar una solicitud de pago a proveedor en borrador", async () => {
    prepararMocksProveedor();

    vi.mocked(
      obtenerSolicitudPagoPorIdRepository,
    ).mockResolvedValue(
      solicitudProveedorBorrador as never,
    );

    vi.mocked(
      actualizarSolicitudPagoRepository,
    ).mockResolvedValue({
      ...solicitudProveedorBorrador,
      descripcion: "Pago actualizado de materiales",
      valor_bruto: 120000 as never,
      valor_retenciones: 24000 as never,
      valor_descuentos: 0 as never,
      valor_neto: 96000 as never,
    } as never);

    const resultado =
      await actualizarSolicitudPagoProveedorService(
        usuarioSolicitante,
        "solicitud-1",
        {
          ...inputProveedorBase,
          descripcion: "Pago actualizado de materiales",
          valor_bruto: 120000,
        },
      );

    expect(resultado.status).toBe(200);
    expect(resultado.body.ok).toBe(true);
    expect(resultado.body.data?.solicitud.descripcion).toBe(
      "Pago actualizado de materiales",
    );
    expect(resultado.body.data?.solicitud.valor_neto).toBe(96000);

    expect(
      actualizarSolicitudPagoRepository,
    ).toHaveBeenCalledWith({
      id: "solicitud-1",
      modificado_por: "usuario-1",
      data: {
        numero_solicitud: null,
        tipo_solicitud: "PAGO_PROVEEDOR",
        modalidad_nomina: null,
        periodo_nomina: null,
        proyecto_base_id: "proyecto-1",
        fondo_id: "fondo-1",
        centro_costo_id: "centro-1",
        beneficiario_id: "beneficiario-1",
        proveedor_id: "proveedor-1",
        categoria_gasto: "MATERIALES",
        categoria_reembolso: null,
        concepto_nomina: null,
        tipo_impuesto: null,
        periodo_impuesto: null,
        medio_pago: "TRANSFERENCIA",
        adjunto_archivo_origen_id: null,
        descripcion: "Pago actualizado de materiales",
        valor_bruto: 120000,
        valor_retenciones: 24000,
        valor_descuentos: 0,
        valor_neto: 96000,
        estado_actual: "BORRADOR",
        creado_por: "usuario-1",
      },
    });
  });

  it("debe impedir modificar una solicitud que no esté en estado BORRADOR", async () => {
    vi.mocked(
      obtenerSolicitudPagoPorIdRepository,
    ).mockResolvedValue({
      ...solicitudProveedorBorrador,
      estado_actual: "PENDIENTE_APROBADOR_1",
    } as never);

    const resultado =
      await actualizarSolicitudPagoProveedorService(
        usuarioSolicitante,
        "solicitud-1",
        inputProveedorBase,
      );

    expect(resultado.status).toBe(409);
    expect(resultado.body.ok).toBe(false);

    expect(
      actualizarSolicitudPagoRepository,
    ).not.toHaveBeenCalled();
  });
});

describe("solicitudes-pago.service - editarSolicitudAprobadorNivel1Service", () => {
  const inputEdicion = {
    beneficiario_id: "beneficiario-1",
    categoria: "SERVICIOS",
    medio_pago: "TRANSFERENCIA" as const,
    descripcion: "Concepto corregido por nivel 1",
    valor_bruto: 120000,
    valor_retenciones: 20000,
    valor_descuentos: 5000,
  };

  it("rechaza usuarios sin permiso de aprobación nivel 1", async () => {
    const resultado = await editarSolicitudAprobadorNivel1Service(
      usuarioSolicitante,
      "solicitud-1",
      inputEdicion,
    );

    expect(resultado.status).toBe(403);
    expect(editarSolicitudAprobadorNivel1Repository).not.toHaveBeenCalled();
  });

  it("edita solo los campos funcionales y recalcula el valor neto", async () => {
    const solicitudPendiente = {
      ...solicitudProveedorBorrador,
      numero_solicitud: "SOL-PRO-OBRA-HUMAPO-2026-000001",
      estado_actual: "PENDIENTE_APROBADOR_1",
    };
    const solicitudActualizada = {
      ...solicitudPendiente,
      categoria_gasto: "SERVICIOS",
      descripcion: inputEdicion.descripcion,
      valor_bruto: 120000,
      valor_retenciones: 20000,
      valor_descuentos: 5000,
      valor_neto: 95000,
    };

    vi.mocked(obtenerSolicitudPagoPorIdRepository).mockResolvedValue(
      solicitudPendiente as never,
    );
    vi.mocked(obtenerBeneficiarioActivoRepository).mockResolvedValue(
      beneficiarioProveedorMock as never,
    );
    vi.mocked(editarSolicitudAprobadorNivel1Repository).mockResolvedValue(
      solicitudActualizada as never,
    );

    const resultado = await editarSolicitudAprobadorNivel1Service(
      usuarioAprobador1,
      "solicitud-1",
      inputEdicion,
    );

    expect(resultado.status).toBe(200);
    expect(editarSolicitudAprobadorNivel1Repository).toHaveBeenCalledWith(
      expect.objectContaining({
        solicitudId: "solicitud-1",
        estadoOrigen: "PENDIENTE_APROBADOR_1",
        categoriaGasto: "SERVICIOS",
        valorNeto: 95000,
      }),
    );
  });

  it("impide aumentar una reserva por encima del saldo disponible", async () => {
    vi.mocked(editarSolicitudAprobadorNivel1Repository).mockClear();
    vi.mocked(obtenerSolicitudPagoPorIdRepository).mockResolvedValue({
      ...solicitudProveedorBorrador,
      numero_solicitud: "SOL-PRO-OBRA-HUMAPO-2026-000001",
      estado_actual: "DEVUELTA_APROBADOR_1",
      valor_reservado: 76000,
    } as never);
    vi.mocked(obtenerBeneficiarioActivoRepository).mockResolvedValue(
      beneficiarioProveedorMock as never,
    );
    vi.mocked(obtenerReservasPorFondosRepository).mockResolvedValue([
      { fondo_id: "fondo-1", _sum: { valor_reservado: 990000 } },
    ] as never);
    vi.mocked(obtenerFondosPorIdsRepository).mockResolvedValue([
      { id: "fondo-1", saldo_actual: 1000000, activo: true },
    ] as never);

    const resultado = await editarSolicitudAprobadorNivel1Service(
      usuarioAprobador1,
      "solicitud-1",
      inputEdicion,
    );

    expect(resultado.status).toBe(409);
    expect(editarSolicitudAprobadorNivel1Repository).not.toHaveBeenCalled();
  });
});

describe("solicitudes-pago.service - devolución de aprobaciones", () => {
  beforeEach(() => {
    vi.mocked(devolverSolicitudPagoRepository).mockReset();
    vi.mocked(devolverSolicitudesPagoRepository).mockReset();
    vi.mocked(obtenerSolicitudPagoPorIdRepository).mockReset();
  });

  it("debe devolver desde nivel 1 al solicitante sin reserva", async () => {
    vi.mocked(obtenerSolicitudPagoPorIdRepository).mockResolvedValue({
      ...solicitudProveedorBorrador,
      estado_actual: "PENDIENTE_APROBADOR_1",
      numero_solicitud: "SOL-001",
    } as never);
    vi.mocked(devolverSolicitudPagoRepository).mockResolvedValue({ count: 1 });

    const resultado = await devolverSolicitudPagoService(
      usuarioAprobador1,
      "solicitud-1",
      { motivo: "Corregir el valor registrado" },
    );

    expect(resultado.status).toBe(200);
    expect(resultado.body.data?.estado_destino).toBe("DEVUELTA_SOLICITANTE");
    expect(devolverSolicitudPagoRepository).toHaveBeenCalledWith(
      expect.objectContaining({
        estadoOrigen: "PENDIENTE_APROBADOR_1",
        estadoDestino: "DEVUELTA_SOLICITANTE",
        liberarReserva: false,
      }),
    );
  });

  it("debe devolver desde nivel 2 al aprobador 1 conservando reserva", async () => {
    vi.mocked(obtenerSolicitudPagoPorIdRepository).mockResolvedValue({
      ...solicitudProveedorBorrador,
      estado_actual: "PENDIENTE_APROBADOR_2",
      numero_solicitud: "SOL-001",
      valor_reservado: 100000,
    } as never);
    vi.mocked(devolverSolicitudPagoRepository).mockResolvedValue({ count: 1 });

    const resultado = await devolverSolicitudPagoService(
      usuarioAprobador2,
      "solicitud-1",
      { motivo: "Revisar los soportes adjuntos" },
    );

    expect(resultado.status).toBe(200);
    expect(resultado.body.data?.estado_destino).toBe("DEVUELTA_APROBADOR_1");
    expect(devolverSolicitudPagoRepository).toHaveBeenCalledWith(
      expect.objectContaining({
        estadoDestino: "DEVUELTA_APROBADOR_1",
        liberarReserva: false,
      }),
    );
  });

  it("debe liberar la reserva al devolver desde aprobador 1 al solicitante", async () => {
    vi.mocked(obtenerSolicitudPagoPorIdRepository).mockResolvedValue({
      ...solicitudProveedorBorrador,
      estado_actual: "DEVUELTA_APROBADOR_1",
      numero_solicitud: "SOL-001",
      valor_reservado: 100000,
    } as never);
    vi.mocked(devolverSolicitudPagoRepository).mockResolvedValue({ count: 1 });

    const resultado = await devolverSolicitudPagoService(
      usuarioAprobador1,
      "solicitud-1",
      { motivo: "El creador debe corregir el beneficiario" },
    );

    expect(resultado.status).toBe(200);
    expect(devolverSolicitudPagoRepository).toHaveBeenCalledWith(
      expect.objectContaining({ liberarReserva: true }),
    );
  });

  it("debe devolver en lote solicitudes del mismo nivel", async () => {
    vi.mocked(obtenerSolicitudesPagoPorIdsRepository).mockResolvedValue([
      { ...solicitudProveedorBorrador, id: "solicitud-1", estado_actual: "PENDIENTE_APROBADOR_2" },
      { ...solicitudProveedorBorrador, id: "solicitud-2", estado_actual: "PENDIENTE_APROBADOR_2" },
    ] as never);
    vi.mocked(devolverSolicitudesPagoRepository).mockResolvedValue({ count: 2 });

    const resultado = await devolverSolicitudesPagoService(
      usuarioAprobador2,
      {
        solicitud_ids: ["solicitud-1", "solicitud-2"],
        motivo: "Revisar los soportes de las solicitudes",
      },
    );

    expect(resultado.status).toBe(200);
    expect(resultado.body.data?.cantidad_devuelta).toBe(2);
    expect(devolverSolicitudesPagoRepository).toHaveBeenCalledWith(
      expect.objectContaining({
        estadoDestino: "DEVUELTA_APROBADOR_1",
        solicitudes: [
          { id: "solicitud-1", estadoOrigen: "PENDIENTE_APROBADOR_2" },
          { id: "solicitud-2", estadoOrigen: "PENDIENTE_APROBADOR_2" },
        ],
      }),
    );
  });
});

describe("solicitudes-pago.service - anulación en aprobación nivel 1", () => {
  beforeEach(() => {
    vi.mocked(anularSolicitudesPagoRepository).mockReset();
    vi.mocked(obtenerSolicitudesPagoPorIdsRepository).mockReset();
  });

  it("debe anular en lote solicitudes pendientes de nivel 1", async () => {
    vi.mocked(obtenerSolicitudesPagoPorIdsRepository).mockResolvedValue([
      { ...solicitudProveedorBorrador, id: "solicitud-1", estado_actual: "PENDIENTE_APROBADOR_1" },
      { ...solicitudProveedorBorrador, id: "solicitud-2", estado_actual: "PENDIENTE_APROBADOR_1" },
    ] as never);
    vi.mocked(anularSolicitudesPagoRepository).mockResolvedValue({ count: 2 });

    const resultado = await anularSolicitudesPagoService(usuarioAprobador1, {
      solicitud_ids: ["solicitud-1", "solicitud-2"],
      motivo: "Las solicitudes no corresponden al proyecto",
    });

    expect(resultado.status).toBe(200);
    expect(resultado.body.data).toEqual({
      cantidad_anulada: 2,
      estado_destino: "ANULADA",
    });
    expect(anularSolicitudesPagoRepository).toHaveBeenCalledWith(
      expect.objectContaining({
        solicitudIds: ["solicitud-1", "solicitud-2"],
        motivo: "Las solicitudes no corresponden al proyecto",
        usuarioId: usuarioAprobador1.id,
      }),
    );
  });

  it("debe impedir la anulación a quien no aprueba nivel 1", async () => {
    const resultado = await anularSolicitudesPagoService(usuarioAprobador2, {
      solicitud_ids: ["solicitud-1"],
      motivo: "Solicitud que no debe continuar",
    });

    expect(resultado.status).toBe(403);
    expect(anularSolicitudesPagoRepository).not.toHaveBeenCalled();
  });

  it("debe rechazar solicitudes que no estén pendientes de nivel 1", async () => {
    vi.mocked(obtenerSolicitudesPagoPorIdsRepository).mockResolvedValue([
      { ...solicitudProveedorBorrador, id: "solicitud-1", estado_actual: "PENDIENTE_APROBADOR_2" },
    ] as never);

    const resultado = await anularSolicitudesPagoService(usuarioAprobador1, {
      solicitud_ids: ["solicitud-1"],
      motivo: "Solicitud que no debe continuar",
    });

    expect(resultado.status).toBe(409);
    expect(anularSolicitudesPagoRepository).not.toHaveBeenCalled();
  });
});
