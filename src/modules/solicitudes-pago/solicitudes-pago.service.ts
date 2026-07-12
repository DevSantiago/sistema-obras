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
} from "./solicitudes-pago.repository";
import type {
  CrearSolicitudPagoProveedorInput,
  EstadoSolicitudPago,
  MedioPagoSolicitud,
  ServiceResponse,
  SolicitudPagoListFilters,
  SolicitudPagoListado,
  TipoSolicitudPago,
  VisibilidadSolicitudesPago,
} from "./solicitudes-pago.types";

const MEDIOS_PAGO_VALIDOS: MedioPagoSolicitud[] = [
  "TRANSFERENCIA",
  "CONSIGNACION",
  "EFECTIVO",
];

const TIPOS_SOLICITUD_VALIDOS: TipoSolicitudPago[] = [
  "PAGO_PROVEEDOR",
  "PAGO_NOMINA",
  "REEMBOLSO",
  "PAGO_IMPUESTO",
  "OTRO_PAGO",
];

const ESTADOS_SOLICITUD_VALIDOS: EstadoSolicitudPago[] = [
  "BORRADOR",
  "PENDIENTE_APROBADOR_1",
  "PENDIENTE_APROBADOR_2",
  "DEVUELTA_APROBADOR_1",
  "DEVUELTA_SOLICITANTE",
  "PROGRAMADA_PAGO",
  "PAGADA",
  "ANULADA",
];

const PERMISOS_CONSULTAR_SOLICITUDES = [
  "CREAR_SOLICITUDES",
  "CONSULTAR_TODO",
  "APROBAR_NIVEL_1",
  "APROBAR_NIVEL_2",
  "MARCAR_COMO_PAGADO",
];

type SolicitudPagoRepositoryResult = {
  id: string;
  numero_solicitud: string;
  tipo_solicitud: string;
  proyecto_base_id: string;
  fondo_id: string;
  centro_costo_id: string;
  beneficiario_id: string | null;
  proveedor_id: string | null;
  categoria_gasto: string | null;
  medio_pago: string | null;
  descripcion: string;
  valor_bruto: unknown;
  valor_impuestos: unknown;
  valor_retenciones: unknown;
  valor_descuentos: unknown;
  valor_neto: unknown;
  estado_actual: string;
  creado_por: string | null;
  creado_en: Date;
  actualizado_en: Date;
  proyecto_base?: {
    id: string;
    nombre: string;
    estado_proyecto: string;
  };
  centro_costo?: {
    id: string;
    nombre: string;
    linea_negocio: string;
    fase_centro_costo: string;
    estado_centro_costo: string;
  };
  beneficiario?: {
    id: string;
    nombre: string;
    tipo_beneficiario: string;
    tipo_documento: string | null;
    numero_documento: string | null;
  } | null;
  proveedor?: {
    id: string;
    nombre: string;
    tipo_documento: string;
    numero_documento: string;
  } | null;
  creador?: {
    id: string;
    nombre: string;
    correo: string;
  } | null;
};

function usuarioTienePermiso(usuario: UsuarioSesion, permiso: string) {
  const permisos =
    "permisos" in usuario && Array.isArray(usuario.permisos)
      ? usuario.permisos
      : [];

  return permisos.includes(permiso) || usuario.roles.includes("ADMINISTRADOR");
}

function usuarioTieneAlgunPermiso(usuario: UsuarioSesion, permisos: string[]) {
  return permisos.some((permiso) => usuarioTienePermiso(usuario, permiso));
}

function usuarioEsAdministrador(usuario: UsuarioSesion) {
  return usuario.roles.includes("ADMINISTRADOR");
}

function usuarioPuedeConsultarTodo(usuario: UsuarioSesion) {
  return usuarioEsAdministrador(usuario);
}

function construirVisibilidadSolicitudesPago(
  usuario: UsuarioSesion,
): VisibilidadSolicitudesPago {
  const consultarTodas = usuarioPuedeConsultarTodo(usuario);
  const estadosFlujo = new Set<EstadoSolicitudPago>();

  if (usuarioTienePermiso(usuario, "APROBAR_NIVEL_1")) {
    estadosFlujo.add("PENDIENTE_APROBADOR_1");
    estadosFlujo.add("DEVUELTA_APROBADOR_1");
  }

  if (usuarioTienePermiso(usuario, "APROBAR_NIVEL_2")) {
    estadosFlujo.add("PENDIENTE_APROBADOR_2");
  }

  if (usuarioTienePermiso(usuario, "MARCAR_COMO_PAGADO")) {
    estadosFlujo.add("PROGRAMADA_PAGO");
  }

  return {
    consultar_todas: consultarTodas,
    usuario_id: usuario.id,
    incluir_propias: !consultarTodas,
    estados_flujo: consultarTodas ? [] : Array.from(estadosFlujo),
  };
}

function normalizarTexto(valor?: string | null) {
  return valor?.trim() ?? "";
}

function normalizarTextoOpcional(valor?: string | null) {
  const texto = valor?.trim();

  return texto ? texto : null;
}

function normalizarMedioPago(valor?: string) {
  return valor?.trim().toUpperCase() as MedioPagoSolicitud | undefined;
}

function normalizarTipoSolicitud(valor?: string) {
  return valor?.trim().toUpperCase() as TipoSolicitudPago | undefined;
}

function normalizarEstadoSolicitud(valor?: string) {
  return valor?.trim().toUpperCase() as EstadoSolicitudPago | undefined;
}

function obtenerNumeroNoNegativo(valor: unknown, valorPorDefecto = 0) {
  if (valor === undefined || valor === null || valor === "") {
    return valorPorDefecto;
  }

  if (typeof valor !== "number" || Number.isNaN(valor)) {
    return null;
  }

  if (valor < 0) {
    return null;
  }

  return valor;
}

function convertirDecimalANumero(valor: unknown) {
  if (typeof valor === "number") {
    return valor;
  }

  if (typeof valor === "string") {
    return Number(valor);
  }

  if (
    valor &&
    typeof valor === "object" &&
    "toNumber" in valor &&
    typeof valor.toNumber === "function"
  ) {
    return valor.toNumber();
  }

  return Number(valor);
}

function obtenerReferenciaCentroCosto(input: {
  linea_negocio: string;
  fase_centro_costo: string;
}) {
  const lineaNegocio = input.linea_negocio.trim().toUpperCase();
  const faseCentroCosto = input.fase_centro_costo.trim().toUpperCase();

  if (lineaNegocio === "OBRA" && faseCentroCosto === "LICITACION") {
    return "PRO-OBRA";
  }

  if (lineaNegocio === "OBRA" && faseCentroCosto === "EJECUCION") {
    return "OBRA";
  }

  if (
    lineaNegocio === "INTERVENTORIA" &&
    faseCentroCosto === "LICITACION"
  ) {
    return "PRO-INT";
  }

  if (
    lineaNegocio === "INTERVENTORIA" &&
    faseCentroCosto === "EJECUCION"
  ) {
    return "INT";
  }

  throw new Error(
    "La línea de negocio y la fase del centro de costo no permiten construir el consecutivo documental.",
  );
}

function convertirSolicitudPago(
  solicitud: SolicitudPagoRepositoryResult,
): SolicitudPagoListado {
  return {
    id: solicitud.id,
    numero_solicitud: solicitud.numero_solicitud,
    tipo_solicitud: solicitud.tipo_solicitud as TipoSolicitudPago,
    proyecto_base_id: solicitud.proyecto_base_id,
    fondo_id: solicitud.fondo_id,
    centro_costo_id: solicitud.centro_costo_id,
    beneficiario_id: solicitud.beneficiario_id,
    proveedor_id: solicitud.proveedor_id,
    categoria_gasto: solicitud.categoria_gasto,
    medio_pago: solicitud.medio_pago as MedioPagoSolicitud | null,
    descripcion: solicitud.descripcion,
    valor_bruto: convertirDecimalANumero(solicitud.valor_bruto),
    valor_impuestos: convertirDecimalANumero(solicitud.valor_impuestos),
    valor_retenciones: convertirDecimalANumero(solicitud.valor_retenciones),
    valor_descuentos: convertirDecimalANumero(solicitud.valor_descuentos),
    valor_neto: convertirDecimalANumero(solicitud.valor_neto),
    estado_actual: solicitud.estado_actual as EstadoSolicitudPago,
    creado_por: solicitud.creado_por,
    creado_en: solicitud.creado_en,
    actualizado_en: solicitud.actualizado_en,
    proyecto_base: solicitud.proyecto_base,
    centro_costo: solicitud.centro_costo,
    beneficiario: solicitud.beneficiario,
    proveedor: solicitud.proveedor,
    creador: solicitud.creador,
  };
}

function normalizarFiltrosListado(
  filters: SolicitudPagoListFilters = {},
): SolicitudPagoListFilters {
  const tipoSolicitud = normalizarTipoSolicitud(filters.tipo_solicitud);
  const estadoSolicitud = normalizarEstadoSolicitud(filters.estado_actual);
  const medioPago = normalizarMedioPago(filters.medio_pago);

  if (
    tipoSolicitud !== undefined &&
    !TIPOS_SOLICITUD_VALIDOS.includes(tipoSolicitud)
  ) {
    throw new Error("El tipo de solicitud no es válido.");
  }

  if (
    estadoSolicitud !== undefined &&
    !ESTADOS_SOLICITUD_VALIDOS.includes(estadoSolicitud)
  ) {
    throw new Error("El estado de la solicitud no es válido.");
  }

  if (medioPago !== undefined && !MEDIOS_PAGO_VALIDOS.includes(medioPago)) {
    throw new Error("El medio de pago no es válido.");
  }

  return {
    tipo_solicitud: tipoSolicitud,
    estado_actual: estadoSolicitud,
    proyecto_base_id:
      normalizarTextoOpcional(filters.proyecto_base_id) ?? undefined,
    centro_costo_id:
      normalizarTextoOpcional(filters.centro_costo_id) ?? undefined,
    beneficiario_id:
      normalizarTextoOpcional(filters.beneficiario_id) ?? undefined,
    medio_pago: medioPago,
    busqueda: normalizarTextoOpcional(filters.busqueda) ?? undefined,
  };
}

export async function listarSolicitudesPagoService(
  usuarioAutenticado: UsuarioSesion,
  filters: SolicitudPagoListFilters = {},
): Promise<ServiceResponse<{ solicitudes: SolicitudPagoListado[] }>> {
  if (
    !usuarioTieneAlgunPermiso(
      usuarioAutenticado,
      PERMISOS_CONSULTAR_SOLICITUDES,
    )
  ) {
    return {
      status: 403,
      body: {
        ok: false,
        message: "No tiene permisos para consultar solicitudes.",
      },
    };
  }

  let filtrosNormalizados: SolicitudPagoListFilters;

  try {
    filtrosNormalizados = normalizarFiltrosListado(filters);
  } catch (error) {
    return {
      status: 400,
      body: {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Los filtros de solicitudes no son válidos.",
      },
    };
  }

  const visibilidad = construirVisibilidadSolicitudesPago(
    usuarioAutenticado,
  );

  const solicitudes = await listarSolicitudesPagoRepository({
    filters: filtrosNormalizados,
    visibilidad,
  });

  return {
    status: 200,
    body: {
      ok: true,
      message: "Solicitudes consultadas correctamente.",
      data: {
        solicitudes: solicitudes.map(convertirSolicitudPago),
      },
    },
  };
}

export async function crearSolicitudPagoProveedorService(
  usuarioAutenticado: UsuarioSesion,
  input: CrearSolicitudPagoProveedorInput,
): Promise<ServiceResponse<{ solicitud: SolicitudPagoListado }>> {
  if (!usuarioTienePermiso(usuarioAutenticado, "CREAR_SOLICITUDES")) {
    return {
      status: 403,
      body: {
        ok: false,
        message: "No tiene permisos para crear solicitudes.",
      },
    };
  }

  const proyectoBaseId = normalizarTexto(input.proyecto_base_id);
  const centroCostoId = normalizarTexto(input.centro_costo_id);
  const beneficiarioId = normalizarTexto(input.beneficiario_id);
  const categoriaGasto = normalizarTexto(input.categoria_gasto);
  const descripcion = normalizarTexto(input.descripcion);
  const medioPago = normalizarMedioPago(input.medio_pago);

  if (
    !proyectoBaseId ||
    !centroCostoId ||
    !beneficiarioId ||
    !categoriaGasto ||
    !descripcion ||
    !medioPago
  ) {
    return {
      status: 400,
      body: {
        ok: false,
        message:
          "Proyecto base, centro de costo, beneficiario, categoría, medio de pago y concepto de pago son obligatorios.",
      },
    };
  }

  if (!MEDIOS_PAGO_VALIDOS.includes(medioPago)) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "El medio de pago no es válido.",
      },
    };
  }

  const valorBruto = obtenerNumeroNoNegativo(input.valor_bruto, -1);
  const valorImpuestos = obtenerNumeroNoNegativo(input.valor_impuestos);
  const valorRetenciones = obtenerNumeroNoNegativo(input.valor_retenciones);
  const valorDescuentos = obtenerNumeroNoNegativo(input.valor_descuentos);

  if (
    valorBruto === null ||
    valorImpuestos === null ||
    valorRetenciones === null ||
    valorDescuentos === null ||
    valorBruto <= 0
  ) {
    return {
      status: 400,
      body: {
        ok: false,
        message:
          "Los valores deben ser numéricos y el valor de la factura debe ser mayor a cero.",
      },
    };
  }

  const valorNeto =
    valorBruto - valorImpuestos - valorRetenciones - valorDescuentos;

  if (valorNeto < 0) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "El valor a pagar no puede ser negativo.",
      },
    };
  }

  const proyectoBase =
    await obtenerProyectoBaseActivoRepository(proyectoBaseId);

  if (!proyectoBase) {
    return {
      status: 404,
      body: {
        ok: false,
        message: "El proyecto base no existe o está inactivo.",
      },
    };
  }

  const centroCosto = await obtenerCentroCostoActivoRepository(centroCostoId);

  if (!centroCosto) {
    return {
      status: 404,
      body: {
        ok: false,
        message: "El centro de costo no existe o está inactivo.",
      },
    };
  }

  if (centroCosto.proyecto_base_id !== proyectoBaseId) {
    return {
      status: 400,
      body: {
        ok: false,
        message:
          "El centro de costo no pertenece al proyecto base seleccionado.",
      },
    };
  }

  if (!usuarioEsAdministrador(usuarioAutenticado)) {
    const acceso = await obtenerAccesoActivoUsuarioProyectoLineaRepository(
      usuarioAutenticado.id,
      proyectoBaseId,
      centroCosto.linea_negocio,
    );

    if (!acceso) {
      return {
        status: 403,
        body: {
          ok: false,
          message:
            "No tiene acceso activo al proyecto y línea de negocio seleccionados.",
        },
      };
    }
  }

  const fondo = await obtenerFondoActivoPorProyectoRepository(proyectoBaseId);

  if (!fondo) {
    return {
      status: 404,
      body: {
        ok: false,
        message: "El proyecto base no tiene un fondo activo asociado.",
      },
    };
  }

  const beneficiario =
    await obtenerBeneficiarioActivoRepository(beneficiarioId);

  if (!beneficiario) {
    return {
      status: 404,
      body: {
        ok: false,
        message: "El beneficiario no existe o está inactivo.",
      },
    };
  }

  if (beneficiario.tipo_beneficiario !== "PROVEEDOR") {
    return {
      status: 400,
      body: {
        ok: false,
        message:
          "Para una solicitud de pago a proveedor, el beneficiario debe ser tipo PROVEEDOR.",
      },
    };
  }

  let centroCostoReferencia: string;

  try {
    centroCostoReferencia = obtenerReferenciaCentroCosto({
      linea_negocio: centroCosto.linea_negocio,
      fase_centro_costo: centroCosto.fase_centro_costo,
    });
  } catch (error) {
    return {
      status: 400,
      body: {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "No fue posible construir la referencia del centro de costo.",
      },
    };
  }

  const secuencia = await generarNumeroSolicitudPagoService({
    proyecto_base_id: proyectoBaseId,
    centro_costo_id: centroCostoId,
    proyecto_referencia: proyectoBase.nombre,
    centro_costo_referencia: centroCostoReferencia,
  });

  const solicitud = await crearSolicitudPagoRepository({
    numero_solicitud: secuencia.referencia,
    tipo_solicitud: "PAGO_PROVEEDOR",
    proyecto_base_id: proyectoBaseId,
    fondo_id: fondo.id,
    centro_costo_id: centroCostoId,
    beneficiario_id: beneficiarioId,
    proveedor_id: normalizarTextoOpcional(beneficiario.proveedor_id),
    categoria_gasto: categoriaGasto.toUpperCase(),
    medio_pago: medioPago,
    descripcion,
    valor_bruto: valorBruto,
    valor_impuestos: valorImpuestos,
    valor_retenciones: valorRetenciones,
    valor_descuentos: valorDescuentos,
    valor_neto: valorNeto,
    estado_actual: "BORRADOR",
    creado_por: usuarioAutenticado.id,
  });

  return {
    status: 201,
    body: {
      ok: true,
      message: "Solicitud de pago creada correctamente.",
      data: {
        solicitud: convertirSolicitudPago(solicitud),
      },
    },
  };
}