import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UsuarioSesion } from "@/modules/auth/auth.types";
import { generarNumeroSolicitudPagoService } from "@/modules/secuencias/secuencias.service";
import {
  crearSolicitudPagoRepository,
  listarSolicitudesPagoRepository,
  obtenerAccesoActivoUsuarioProyectoLineaRepository,
  obtenerBeneficiarioActivoRepository,
  obtenerCentroCostoActivoRepository,
  obtenerFondoActivoPorProyectoRepository,
  obtenerProyectoBaseActivoRepository,
} from "../solicitudes-pago.repository";
import {
  crearSolicitudPagoProveedorService,
  listarSolicitudesPagoService,
} from "../solicitudes-pago.service";

vi.mock("@/modules/secuencias/secuencias.service", () => ({
  generarNumeroSolicitudPagoService: vi.fn(),
}));

vi.mock("../solicitudes-pago.repository", () => ({
  crearSolicitudPagoRepository: vi.fn(),
  listarSolicitudesPagoRepository: vi.fn(),
  obtenerAccesoActivoUsuarioProyectoLineaRepository: vi.fn(),
  obtenerBeneficiarioActivoRepository: vi.fn(),
  obtenerCentroCostoActivoRepository: vi.fn(),
  obtenerFondoActivoPorProyectoRepository: vi.fn(),
  obtenerProyectoBaseActivoRepository: vi.fn(),
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
  permisos: ["APROBAR_NIVEL_1"],
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

const accesoMock = {
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

const inputBase = {
  proyecto_base_id: "proyecto-1",
  centro_costo_id: "centro-1",
  beneficiario_id: "beneficiario-1",
  categoria_gasto: "materiales",
  medio_pago: "TRANSFERENCIA" as const,
  descripcion: "Pago de materiales",
  valor_bruto: 100000,
  valor_impuestos: 19000,
  valor_retenciones: 5000,
  valor_descuentos: 0,
};

function prepararMocksBase() {
  vi.mocked(obtenerProyectoBaseActivoRepository).mockResolvedValue(
    proyectoBaseMock as never,
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
    numero_solicitud: "SOL-PRO-OBRA-HUMAPO-2026-000001",
    tipo_solicitud: "PAGO_PROVEEDOR",
    modalidad_nomina: null,
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
    valor_impuestos: 19000 as never,
    valor_retenciones: 5000 as never,
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

describe("solicitudes-pago.service - listarSolicitudesPagoService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listarSolicitudesPagoRepository).mockResolvedValue([]);
  });

  it("debe mostrar al solicitante únicamente sus propias solicitudes", async () => {
    const resultado = await listarSolicitudesPagoService(usuarioSolicitante);

    expect(resultado.status).toBe(200);

    expect(listarSolicitudesPagoRepository).toHaveBeenCalledWith({
      filters: {},
      visibilidad: {
        consultar_todas: false,
        usuario_id: "usuario-1",
        incluir_propias: true,
        estados_flujo: [],
      },
    });
  });

  it("debe mostrar al aprobador 1 sus solicitudes y las pendientes de su nivel", async () => {
    const resultado = await listarSolicitudesPagoService(usuarioAprobador1);

    expect(resultado.status).toBe(200);

    expect(listarSolicitudesPagoRepository).toHaveBeenCalledWith({
      filters: {},
      visibilidad: {
        consultar_todas: false,
        usuario_id: "aprobador-1",
        incluir_propias: true,
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
      filters: {},
      visibilidad: {
        consultar_todas: false,
        usuario_id: "aprobador-2",
        incluir_propias: true,
        estados_flujo: ["PENDIENTE_APROBADOR_2"],
      },
    });
  });

  it("debe mostrar a pagos sus solicitudes y las programadas para pago", async () => {
    const resultado = await listarSolicitudesPagoService(usuarioPagos);

    expect(resultado.status).toBe(200);

    expect(listarSolicitudesPagoRepository).toHaveBeenCalledWith({
      filters: {},
      visibilidad: {
        consultar_todas: false,
        usuario_id: "pagos-1",
        incluir_propias: true,
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
      filters: {},
      visibilidad: {
        consultar_todas: true,
        usuario_id: "admin-1",
        incluir_propias: false,
        estados_flujo: [],
      },
    });
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

describe("solicitudes-pago.service - crearSolicitudPagoProveedorService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe rechazar usuario sin permiso para crear solicitudes", async () => {
    const resultado = await crearSolicitudPagoProveedorService(
      usuarioSinPermisos,
      inputBase,
    );

    expect(resultado.status).toBe(403);
    expect(resultado.body.ok).toBe(false);
    expect(crearSolicitudPagoRepository).not.toHaveBeenCalled();
  });

  it("debe validar campos obligatorios", async () => {
    const resultado = await crearSolicitudPagoProveedorService(
      usuarioSolicitante,
      {
        ...inputBase,
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
        ...inputBase,
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
        ...inputBase,
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
        ...inputBase,
        valor_bruto: 1000,
        valor_impuestos: 2000,
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
      inputBase,
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
      inputBase,
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
      inputBase,
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
      inputBase,
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
    ).mockResolvedValue(accesoMock as never);

    vi.mocked(obtenerFondoActivoPorProyectoRepository).mockResolvedValue(null);

    const resultado = await crearSolicitudPagoProveedorService(
      usuarioSolicitante,
      inputBase,
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
    ).mockResolvedValue(accesoMock as never);

    vi.mocked(obtenerFondoActivoPorProyectoRepository).mockResolvedValue(
      fondoMock as never,
    );

    vi.mocked(obtenerBeneficiarioActivoRepository).mockResolvedValue(null);

    const resultado = await crearSolicitudPagoProveedorService(
      usuarioSolicitante,
      inputBase,
    );

    expect(resultado.status).toBe(404);

    expect(resultado.body.message).toBe(
      "El beneficiario no existe o está inactivo.",
    );
  });

  it("debe validar beneficiario tipo proveedor", async () => {
    vi.mocked(obtenerProyectoBaseActivoRepository).mockResolvedValue(
      proyectoBaseMock as never,
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

    vi.mocked(obtenerBeneficiarioActivoRepository).mockResolvedValue({
      ...beneficiarioProveedorMock,
      tipo_beneficiario: "TRABAJADOR",
    } as never);

    const resultado = await crearSolicitudPagoProveedorService(
      usuarioSolicitante,
      inputBase,
    );

    expect(resultado.status).toBe(400);

    expect(resultado.body.message).toBe(
      "Para una solicitud de pago a proveedor, el beneficiario debe ser tipo PROVEEDOR.",
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
    ).mockResolvedValue(accesoMock as never);

    vi.mocked(obtenerFondoActivoPorProyectoRepository).mockResolvedValue(
      fondoMock as never,
    );

    vi.mocked(obtenerBeneficiarioActivoRepository).mockResolvedValue(
      beneficiarioProveedorMock as never,
    );

    const resultado = await crearSolicitudPagoProveedorService(
      usuarioSolicitante,
      inputBase,
    );

    expect(resultado.status).toBe(400);

    expect(resultado.body.message).toBe(
      "La línea de negocio y la fase del centro de costo no permiten construir el consecutivo documental.",
    );

    expect(generarNumeroSolicitudPagoService).not.toHaveBeenCalled();
    expect(crearSolicitudPagoRepository).not.toHaveBeenCalled();
  });

  it("debe crear solicitud de pago a proveedor en borrador", async () => {
    prepararMocksBase();

    const resultado = await crearSolicitudPagoProveedorService(
      usuarioSolicitante,
      inputBase,
    );

    expect(resultado.status).toBe(201);
    expect(resultado.body.ok).toBe(true);

    expect(resultado.body.data?.solicitud.numero_solicitud).toBe(
      "SOL-PRO-OBRA-HUMAPO-2026-000001",
    );

    expect(resultado.body.data?.solicitud.valor_neto).toBe(76000);

    expect(generarNumeroSolicitudPagoService).toHaveBeenCalledWith({
      proyecto_base_id: "proyecto-1",
      centro_costo_id: "centro-1",
      proyecto_referencia: "HUMAPO",
      centro_costo_referencia: "PRO-OBRA",
    });

    expect(crearSolicitudPagoRepository).toHaveBeenCalledWith({
      numero_solicitud: "SOL-PRO-OBRA-HUMAPO-2026-000001",
      tipo_solicitud: "PAGO_PROVEEDOR",
      proyecto_base_id: "proyecto-1",
      fondo_id: "fondo-1",
      centro_costo_id: "centro-1",
      beneficiario_id: "beneficiario-1",
      proveedor_id: "proveedor-1",
      categoria_gasto: "MATERIALES",
      medio_pago: "TRANSFERENCIA",
      descripcion: "Pago de materiales",
      valor_bruto: 100000,
      valor_impuestos: 19000,
      valor_retenciones: 5000,
      valor_descuentos: 0,
      valor_neto: 76000,
      estado_actual: "BORRADOR",
      creado_por: "usuario-1",
    });
  });
});