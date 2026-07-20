import type { UsuarioSesion } from "@/modules/auth/auth.types";
import { crearAdjuntosSolicitudPagoService } from "@/modules/adjuntos/adjuntos.service";
import { generarNumeroSolicitudPagoService } from "@/modules/secuencias/secuencias.service";
import { obtenerDetalleNominaGrupalService } from "./nomina-grupal/nomina-grupal.service";
import {
  CATEGORIAS_REEMBOLSO,
  TIPOS_IMPUESTO_SOLICITUD,
} from "./solicitudes-pago.types";
import {
  buscarDuplicadoNominaIndividualRepository,
  crearSolicitudPagoRepository,
  enviarSolicitudPagoRepository,
  listarSolicitudesPagoRepository,
  obtenerAccesoActivoUsuarioProyectoLineaRepository,
  obtenerBeneficiarioActivoRepository,
  obtenerCentroCostoActivoRepository,
  obtenerFondoActivoPorProyectoRepository,
  obtenerProyectoBaseActivoRepository,
  obtenerSolicitudPagoPorIdRepository,
  eliminarSolicitudPagoRepository,
} from "./solicitudes-pago.repository";
import type {
  CategoriaReembolso,
  CrearSolicitudNominaIndividualInput,
  CrearSolicitudPagoImpuestoInput,
  CrearSolicitudReembolsoInput,
  CrearSolicitudPagoProveedorInput,
  EstadoSolicitudPago,
  MedioPagoSolicitud,
  ModalidadNomina,
  ServiceResponse,
  SolicitudPagoListFilters,
  SolicitudPagoListado,
  TipoImpuestoSolicitud,
  TipoSolicitudPago,
  VisibilidadSolicitudesPago,
} from "./solicitudes-pago.types";

const MEDIOS_PAGO_VALIDOS: MedioPagoSolicitud[] = [
  "TRANSFERENCIA",
  "CONSIGNACION",
  "EFECTIVO",
];

const MODALIDADES_NOMINA_VALIDAS: ModalidadNomina[] = [
  "INDIVIDUAL",
  "AGRUPADA_EXCEL",
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

const ROLES_QUE_PUEDEN_ENVIAR_SOLICITUDES = [
  "SOLICITANTE",
  "DIRECTOR",
  "AUXILIAR_CONTABLE",
  "APROBADOR_1",
  "ADMINISTRADOR",
];

type SolicitudPagoRepositoryResult = {
  id: string;
  numero_solicitud: string;
  tipo_solicitud: string;
  modalidad_nomina: string | null;
  periodo_nomina: string | null;
  proyecto_base_id: string;
  fondo_id: string;
  centro_costo_id: string;
  beneficiario_id: string | null;
  proveedor_id: string | null;
  categoria_gasto: string | null;
  categoria_reembolso: string | null;
  concepto_nomina: string | null;
  tipo_impuesto: string | null;
  periodo_impuesto: string | null;
  medio_pago: string | null;
  adjunto_archivo_origen_id: string | null;
  descripcion: string;
  valor_bruto: unknown;
  valor_impuestos: unknown;
  valor_retenciones: unknown;
  valor_descuentos: unknown;
  valor_neto: unknown;
  estado_actual: string;
  creado_por: string | null;
  enviado_en: Date | null;
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

type ContextoFinancieroSolicitud = {
  proyectoBase: {
    id: string;
    nombre: string;
  };
  centroCosto: {
    id: string;
    proyecto_base_id: string;
    linea_negocio: string;
    fase_centro_costo: string;
  };
  fondo: {
    id: string;
  };
  centroCostoReferencia: string;
};

type RegistrarAdjuntosSolicitudPagoInput = {
  solicitudPagoId: string;
  archivos: File[];
  usuarioId: string;
  carpeta: string;
};

function obtenerPermisosUsuario(usuario: UsuarioSesion): string[] {
  if ("permisos" in usuario && Array.isArray(usuario.permisos)) {
    return usuario.permisos;
  }

  return [];
}

function usuarioTieneRol(usuario: UsuarioSesion, rol: string): boolean {
  return usuario.roles.includes(rol);
}

function usuarioEsAdministrador(usuario: UsuarioSesion): boolean {
  return usuarioTieneRol(usuario, "ADMINISTRADOR");
}

function usuarioEsDirector(usuario: UsuarioSesion): boolean {
  return usuarioTieneRol(usuario, "DIRECTOR");
}

function usuarioTienePermiso(usuario: UsuarioSesion, permiso: string): boolean {
  return (
    usuarioEsAdministrador(usuario) ||
    obtenerPermisosUsuario(usuario).includes(permiso)
  );
}

function usuarioTieneAlgunPermiso(
  usuario: UsuarioSesion,
  permisos: string[],
): boolean {
  return permisos.some((permiso) => usuarioTienePermiso(usuario, permiso));
}

function usuarioPuedeCrearNominaIndividual(usuario: UsuarioSesion): boolean {
  if (usuarioEsAdministrador(usuario)) {
    return true;
  }

  return (
    usuarioEsDirector(usuario) &&
    usuarioTienePermiso(usuario, "CREAR_SOLICITUDES")
  );
}

function usuarioPuedeCrearSolicitudImpuesto(
  usuario: UsuarioSesion,
): boolean {
  return [
    "APROBADOR_1",
    "DIRECTOR",
    "AUXILIAR_CONTABLE",
    "ADMINISTRADOR",
  ].some((rol) => usuarioTieneRol(usuario, rol));
}

function usuarioPuedeCrearReembolso(
  usuario: UsuarioSesion,
): boolean {
  return [
    "SOLICITANTE",
    "DIRECTOR",
    "AUXILIAR_CONTABLE",
    "APROBADOR_1",
    "ADMINISTRADOR",
  ].some((rol) => usuarioTieneRol(usuario, rol));
}

function usuarioPuedeConsultarTodo(usuario: UsuarioSesion): boolean {
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

function normalizarTexto(valor?: string | null): string {
  return valor?.trim() ?? "";
}

function normalizarTextoOpcional(valor?: string | null): string | null {
  const texto = valor?.trim();

  return texto ? texto : null;
}

function normalizarTextoDominio(valor?: string | null): string {
  return normalizarTexto(valor).toUpperCase();
}

function normalizarMedioPago(
  valor?: string | null,
): MedioPagoSolicitud | undefined {
  const medioPago = normalizarTextoDominio(valor);

  return medioPago
    ? (medioPago as MedioPagoSolicitud)
    : undefined;
}

function normalizarTipoSolicitud(
  valor?: string | null,
): TipoSolicitudPago | undefined {
  const tipoSolicitud = normalizarTextoDominio(valor);

  return tipoSolicitud
    ? (tipoSolicitud as TipoSolicitudPago)
    : undefined;
}

function normalizarEstadoSolicitud(
  valor?: string | null,
): EstadoSolicitudPago | undefined {
  const estadoSolicitud = normalizarTextoDominio(valor);

  return estadoSolicitud
    ? (estadoSolicitud as EstadoSolicitudPago)
    : undefined;
}

function normalizarModalidadNomina(
  valor?: string | null,
): ModalidadNomina | undefined {
  const modalidad = normalizarTextoDominio(valor);

  return modalidad ? (modalidad as ModalidadNomina) : undefined;
}

function normalizarTipoImpuesto(
  valor?: string | null,
): TipoImpuestoSolicitud | undefined {
  const tipoImpuesto = normalizarTextoDominio(valor);

  return tipoImpuesto
    ? (tipoImpuesto as TipoImpuestoSolicitud)
    : undefined;
}

function normalizarCategoriaReembolso(
  valor?: string | null,
): CategoriaReembolso | undefined {
  const categoria = normalizarTextoDominio(valor);

  return categoria ? (categoria as CategoriaReembolso) : undefined;
}

function obtenerNumeroNoNegativo(
  valor: unknown,
  valorPorDefecto = 0,
): number | null {
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

function convertirDecimalANumero(valor: unknown): number {
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
}): string {
  const lineaNegocio = normalizarTextoDominio(input.linea_negocio);
  const faseCentroCosto = normalizarTextoDominio(input.fase_centro_costo);

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

function obtenerPeriodoActualColombia(): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());

  const anio = partes.find((parte) => parte.type === "year")?.value;
  const mes = partes.find((parte) => parte.type === "month")?.value;

  if (!anio || !mes) {
    throw new Error("No fue posible determinar el periodo actual.");
  }

  return `${anio}-${mes}`;
}

function periodoNominaTieneFormatoValido(periodo: string): boolean {
  return /^[0-9]{4}-(0[1-9]|1[0-2])$/.test(periodo);
}

function validarPeriodoNomina(periodo: string): string | null {
  if (!periodoNominaTieneFormatoValido(periodo)) {
    return "El periodo de nómina debe tener formato YYYY-MM.";
  }

  const periodoActual = obtenerPeriodoActualColombia();
  const anioActual = periodoActual.slice(0, 4);
  const anioPeriodo = periodo.slice(0, 4);

  if (anioPeriodo !== anioActual) {
    return "El periodo de nómina debe corresponder al año vigente.";
  }

  if (periodo > periodoActual) {
    return "El periodo de nómina no puede ser posterior al mes actual.";
  }

  return null;
}

function validarPeriodoImpuesto(periodo: string): string | null {
  if (!periodoNominaTieneFormatoValido(periodo)) {
    return "El periodo del impuesto debe tener formato YYYY-MM.";
  }

  const periodoActual = obtenerPeriodoActualColombia();
  const anioActual = periodoActual.slice(0, 4);
  const anioPeriodo = periodo.slice(0, 4);

  if (anioPeriodo !== anioActual) {
    return "El periodo del impuesto debe corresponder al año vigente.";
  }

  if (periodo > periodoActual) {
    return "El periodo del impuesto no puede ser posterior al mes actual.";
  }

  return null;
}

function convertirSolicitudPago(
  solicitud: SolicitudPagoRepositoryResult,
): SolicitudPagoListado {
  return {
    id: solicitud.id,
    numero_solicitud: solicitud.numero_solicitud,
    tipo_solicitud: solicitud.tipo_solicitud as TipoSolicitudPago,
    modalidad_nomina:
      solicitud.modalidad_nomina as ModalidadNomina | null,
    periodo_nomina: solicitud.periodo_nomina,
    proyecto_base_id: solicitud.proyecto_base_id,
    fondo_id: solicitud.fondo_id,
    centro_costo_id: solicitud.centro_costo_id,
    beneficiario_id: solicitud.beneficiario_id,
    proveedor_id: solicitud.proveedor_id,
    categoria_gasto: solicitud.categoria_gasto,
    categoria_reembolso: solicitud.categoria_reembolso as CategoriaReembolso | null,
    concepto_nomina: solicitud.concepto_nomina,
    tipo_impuesto:
      solicitud.tipo_impuesto as TipoImpuestoSolicitud | null,
    periodo_impuesto: solicitud.periodo_impuesto,
    medio_pago: solicitud.medio_pago as MedioPagoSolicitud | null,
    adjunto_archivo_origen_id: solicitud.adjunto_archivo_origen_id,
    descripcion: solicitud.descripcion,
    valor_bruto: convertirDecimalANumero(solicitud.valor_bruto),
    valor_impuestos: convertirDecimalANumero(solicitud.valor_impuestos),
    valor_retenciones: convertirDecimalANumero(solicitud.valor_retenciones),
    valor_descuentos: convertirDecimalANumero(solicitud.valor_descuentos),
    valor_neto: convertirDecimalANumero(solicitud.valor_neto),
    estado_actual: solicitud.estado_actual as EstadoSolicitudPago,
    creado_por: solicitud.creado_por,
    enviado_en: solicitud.enviado_en,
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
  const modalidadNomina = normalizarModalidadNomina(
    filters.modalidad_nomina,
  );
  const estadoSolicitud = normalizarEstadoSolicitud(filters.estado_actual);
  const medioPago = normalizarMedioPago(filters.medio_pago);
  const periodoNomina =
    normalizarTextoOpcional(filters.periodo_nomina) ?? undefined;

  if (
    tipoSolicitud !== undefined &&
    !TIPOS_SOLICITUD_VALIDOS.includes(tipoSolicitud)
  ) {
    throw new Error("El tipo de solicitud no es válido.");
  }

  if (
    modalidadNomina !== undefined &&
    !MODALIDADES_NOMINA_VALIDAS.includes(modalidadNomina)
  ) {
    throw new Error("La modalidad de nómina no es válida.");
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

  if (periodoNomina && !periodoNominaTieneFormatoValido(periodoNomina)) {
    throw new Error("El periodo de nómina debe tener formato YYYY-MM.");
  }

  return {
    tipo_solicitud: tipoSolicitud,
    modalidad_nomina: modalidadNomina,
    periodo_nomina: periodoNomina,
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

async function obtenerContextoFinancieroSolicitud(input: {
  usuarioAutenticado: UsuarioSesion;
  proyectoBaseId: string;
  centroCostoId: string;
}): Promise<
  | {
      ok: true;
      data: ContextoFinancieroSolicitud;
    }
  | {
      ok: false;
      response: ServiceResponse<never>;
    }
> {
  const proyectoBase = await obtenerProyectoBaseActivoRepository(
    input.proyectoBaseId,
  );

  if (!proyectoBase) {
    return {
      ok: false,
      response: {
        status: 404,
        body: {
          ok: false,
          message: "El proyecto base no existe o está inactivo.",
        },
      },
    };
  }

  const centroCosto = await obtenerCentroCostoActivoRepository(
    input.centroCostoId,
  );

  if (!centroCosto) {
    return {
      ok: false,
      response: {
        status: 404,
        body: {
          ok: false,
          message: "El centro de costo no existe o está inactivo.",
        },
      },
    };
  }

  if (centroCosto.proyecto_base_id !== input.proyectoBaseId) {
    return {
      ok: false,
      response: {
        status: 400,
        body: {
          ok: false,
          message:
            "El centro de costo no pertenece al proyecto base seleccionado.",
        },
      },
    };
  }

  if (!usuarioEsAdministrador(input.usuarioAutenticado)) {
    const acceso = await obtenerAccesoActivoUsuarioProyectoLineaRepository(
      input.usuarioAutenticado.id,
      input.proyectoBaseId,
      centroCosto.linea_negocio,
    );

    if (!acceso) {
      return {
        ok: false,
        response: {
          status: 403,
          body: {
            ok: false,
            message:
              "No tiene acceso activo al proyecto y línea de negocio seleccionados.",
          },
        },
      };
    }
  }

  const fondo = await obtenerFondoActivoPorProyectoRepository(
    input.proyectoBaseId,
  );

  if (!fondo) {
    return {
      ok: false,
      response: {
        status: 404,
        body: {
          ok: false,
          message: "El proyecto base no tiene un fondo activo asociado.",
        },
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
      ok: false,
      response: {
        status: 400,
        body: {
          ok: false,
          message:
            error instanceof Error
              ? error.message
              : "No fue posible construir la referencia del centro de costo.",
        },
      },
    };
  }

  return {
    ok: true,
    data: {
      proyectoBase: {
        id: proyectoBase.id,
        nombre: proyectoBase.nombre,
      },
      centroCosto: {
        id: centroCosto.id,
        proyecto_base_id: centroCosto.proyecto_base_id,
        linea_negocio: centroCosto.linea_negocio,
        fase_centro_costo: centroCosto.fase_centro_costo,
      },
      fondo: {
        id: fondo.id,
      },
      centroCostoReferencia,
    },
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


export async function obtenerSolicitudPagoPorIdService(
  usuarioAutenticado: UsuarioSesion,
  solicitudId: string,
) {
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
        message:
          "No tiene permisos para consultar solicitudes de pago.",
      },
    };
  }

  const id = normalizarTexto(solicitudId);

  if (!id) {
    return {
      status: 400,
      body: {
        ok: false,
        message:
          "El identificador de la solicitud es obligatorio.",
      },
    };
  }

  const solicitud = await obtenerSolicitudPagoPorIdRepository(id);

  if (!solicitud) {
    return {
      status: 404,
      body: {
        ok: false,
        message: "La solicitud de pago no existe.",
      },
    };
  }

  const visibilidad =
    construirVisibilidadSolicitudesPago(usuarioAutenticado);

  const puedeConsultar =
    visibilidad.consultar_todas ||
    (visibilidad.incluir_propias &&
      solicitud.creado_por === visibilidad.usuario_id) ||
    visibilidad.estados_flujo.includes(
      solicitud.estado_actual as EstadoSolicitudPago,
    );

  if (!puedeConsultar) {
    return {
      status: 403,
      body: {
        ok: false,
        message:
          "No tiene autorización para consultar esta solicitud.",
      },
    };
  }

  if (
    solicitud.tipo_solicitud === "PAGO_NOMINA" &&
    solicitud.modalidad_nomina === "AGRUPADA_EXCEL"
  ) {
    return obtenerDetalleNominaGrupalService(id);
  }

  return {
    status: 200,
    body: {
      ok: true,
      message: "Solicitud de pago consultada correctamente.",
      data: {
        solicitud: convertirSolicitudPago(solicitud),
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
  const categoriaGasto = normalizarTextoDominio(input.categoria_gasto);
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

  const contexto = await obtenerContextoFinancieroSolicitud({
    usuarioAutenticado,
    proyectoBaseId,
    centroCostoId,
  });

  if (!contexto.ok) {
    return contexto.response;
  }

  const beneficiario = await obtenerBeneficiarioActivoRepository(
    beneficiarioId,
  );

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

  const secuencia = await generarNumeroSolicitudPagoService({
    proyecto_base_id: proyectoBaseId,
    centro_costo_id: centroCostoId,
    proyecto_referencia: contexto.data.proyectoBase.nombre,
    centro_costo_referencia: contexto.data.centroCostoReferencia,
  });

  const solicitud = await crearSolicitudPagoRepository({
    numero_solicitud: secuencia.referencia,
    tipo_solicitud: "PAGO_PROVEEDOR",
    modalidad_nomina: null,
    periodo_nomina: null,
    proyecto_base_id: proyectoBaseId,
    fondo_id: contexto.data.fondo.id,
    centro_costo_id: centroCostoId,
    beneficiario_id: beneficiarioId,
    proveedor_id: normalizarTextoOpcional(beneficiario.proveedor_id),
    categoria_gasto: categoriaGasto,
    categoria_reembolso: null,
    concepto_nomina: null,
    tipo_impuesto: null,
    periodo_impuesto: null,
    medio_pago: medioPago,
    adjunto_archivo_origen_id: null,
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

export async function crearSolicitudNominaIndividualService(
  usuarioAutenticado: UsuarioSesion,
  input: CrearSolicitudNominaIndividualInput,
): Promise<ServiceResponse<{ solicitud: SolicitudPagoListado }>> {
  if (!usuarioPuedeCrearNominaIndividual(usuarioAutenticado)) {
    return {
      status: 403,
      body: {
        ok: false,
        message:
          "Solo un Director autorizado o un Administrador puede crear solicitudes de nómina individual.",
      },
    };
  }

  const proyectoBaseId = normalizarTexto(input.proyecto_base_id);
  const centroCostoId = normalizarTexto(input.centro_costo_id);
  const beneficiarioId = normalizarTexto(input.beneficiario_id);
  const conceptoNomina = normalizarTextoDominio(input.concepto_nomina);
  const periodoNomina = normalizarTexto(input.periodo_nomina);
  const descripcion = normalizarTexto(input.descripcion);
  const medioPago = normalizarMedioPago(input.medio_pago);
  const modalidadNomina = normalizarModalidadNomina(
    input.modalidad_nomina ?? "INDIVIDUAL",
  );

  if (
    !proyectoBaseId ||
    !centroCostoId ||
    !beneficiarioId ||
    !conceptoNomina ||
    !periodoNomina ||
    !descripcion ||
    !medioPago
  ) {
    return {
      status: 400,
      body: {
        ok: false,
        message:
          "Proyecto base, centro de costo, trabajador, concepto de nómina, periodo, medio de pago y descripción son obligatorios.",
      },
    };
  }

  if (modalidadNomina !== "INDIVIDUAL") {
    return {
      status: 400,
      body: {
        ok: false,
        message:
          "La modalidad debe ser INDIVIDUAL para esta operación.",
      },
    };
  }

  const errorPeriodo = validarPeriodoNomina(periodoNomina);

  if (errorPeriodo) {
    return {
      status: 400,
      body: {
        ok: false,
        message: errorPeriodo,
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
  const valorRetenciones = obtenerNumeroNoNegativo(
    input.valor_retenciones,
  );
  const valorDescuentos = obtenerNumeroNoNegativo(
    input.valor_descuentos,
  );

  if (
    valorBruto === null ||
    valorRetenciones === null ||
    valorDescuentos === null ||
    valorBruto <= 0
  ) {
    return {
      status: 400,
      body: {
        ok: false,
        message:
          "Los valores deben ser numéricos y el valor bruto debe ser mayor a cero.",
      },
    };
  }

  const valorNeto = valorBruto - valorRetenciones - valorDescuentos;

  if (valorNeto < 0) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "El valor neto de la nómina no puede ser negativo.",
      },
    };
  }

  const contexto = await obtenerContextoFinancieroSolicitud({
    usuarioAutenticado,
    proyectoBaseId,
    centroCostoId,
  });

  if (!contexto.ok) {
    return contexto.response;
  }

  const beneficiario = await obtenerBeneficiarioActivoRepository(
    beneficiarioId,
  );

  if (!beneficiario) {
    return {
      status: 404,
      body: {
        ok: false,
        message: "El trabajador no existe o está inactivo.",
      },
    };
  }

  if (beneficiario.tipo_beneficiario !== "TRABAJADOR") {
    return {
      status: 400,
      body: {
        ok: false,
        message:
          "Para una nómina individual, el beneficiario debe ser tipo TRABAJADOR.",
      },
    };
  }

  const duplicado = await buscarDuplicadoNominaIndividualRepository({
    proyecto_base_id: proyectoBaseId,
    centro_costo_id: centroCostoId,
    beneficiario_id: beneficiarioId,
    concepto_nomina: conceptoNomina,
    periodo_nomina: periodoNomina,
  });

  if (duplicado) {
    return {
      status: 409,
      body: {
        ok: false,
        message: `Ya existe la solicitud ${duplicado.numero_solicitud} para este trabajador, concepto y periodo.`,
      },
    };
  }

  const secuencia = await generarNumeroSolicitudPagoService({
    proyecto_base_id: proyectoBaseId,
    centro_costo_id: centroCostoId,
    proyecto_referencia: contexto.data.proyectoBase.nombre,
    centro_costo_referencia: contexto.data.centroCostoReferencia,
  });

  const solicitud = await crearSolicitudPagoRepository({
    numero_solicitud: secuencia.referencia,
    tipo_solicitud: "PAGO_NOMINA",
    modalidad_nomina: "INDIVIDUAL",
    periodo_nomina: periodoNomina,
    proyecto_base_id: proyectoBaseId,
    fondo_id: contexto.data.fondo.id,
    centro_costo_id: centroCostoId,
    beneficiario_id: beneficiarioId,
    proveedor_id: null,
    categoria_gasto: null,
    categoria_reembolso: null,
    concepto_nomina: conceptoNomina,
    tipo_impuesto: null,
    periodo_impuesto: null,
    medio_pago: medioPago,
    adjunto_archivo_origen_id: null,
    descripcion,
    valor_bruto: valorBruto,
    valor_impuestos: 0,
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
      message: "Solicitud de nómina individual creada correctamente.",
      data: {
        solicitud: convertirSolicitudPago(solicitud),
      },
    },
  };
}

export async function crearSolicitudPagoImpuestoService(
  usuarioAutenticado: UsuarioSesion,
  input: CrearSolicitudPagoImpuestoInput,
): Promise<ServiceResponse<{ solicitud: SolicitudPagoListado }>> {
  if (!usuarioPuedeCrearSolicitudImpuesto(usuarioAutenticado)) {
    return {
      status: 403,
      body: {
        ok: false,
        message:
          "Solo un Aprobador nivel 1, Director, Auxiliar contable o Administrador puede crear solicitudes de pago de impuestos.",
      },
    };
  }

  const proyectoBaseId = normalizarTexto(input.proyecto_base_id);
  const centroCostoId = normalizarTexto(input.centro_costo_id);
  const beneficiarioId = normalizarTexto(input.beneficiario_id);
  const tipoImpuesto = normalizarTipoImpuesto(input.tipo_impuesto);
  const periodoImpuesto = normalizarTexto(input.periodo_impuesto);
  const descripcion = normalizarTexto(input.descripcion);
  const medioPago = normalizarMedioPago(input.medio_pago);

  if (
    !proyectoBaseId ||
    !centroCostoId ||
    !beneficiarioId ||
    !tipoImpuesto ||
    !periodoImpuesto ||
    !descripcion ||
    !medioPago
  ) {
    return {
      status: 400,
      body: {
        ok: false,
        message:
          "Proyecto base, centro de costo, entidad beneficiaria, tipo de impuesto, periodo, medio de pago y descripción son obligatorios.",
      },
    };
  }

  if (!TIPOS_IMPUESTO_SOLICITUD.includes(tipoImpuesto)) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "El tipo de impuesto no es válido.",
      },
    };
  }

  const errorPeriodo = validarPeriodoImpuesto(periodoImpuesto);

  if (errorPeriodo) {
    return {
      status: 400,
      body: {
        ok: false,
        message: errorPeriodo,
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

  if (valorBruto === null || valorBruto <= 0) {
    return {
      status: 400,
      body: {
        ok: false,
        message:
          "El valor del impuesto debe ser numérico y mayor a cero.",
      },
    };
  }

  const contexto = await obtenerContextoFinancieroSolicitud({
    usuarioAutenticado,
    proyectoBaseId,
    centroCostoId,
  });

  if (!contexto.ok) {
    return contexto.response;
  }

  const beneficiario = await obtenerBeneficiarioActivoRepository(
    beneficiarioId,
  );

  if (!beneficiario) {
    return {
      status: 404,
      body: {
        ok: false,
        message:
          "La entidad beneficiaria no existe o está inactiva.",
      },
    };
  }

  const secuencia = await generarNumeroSolicitudPagoService({
    proyecto_base_id: proyectoBaseId,
    centro_costo_id: centroCostoId,
    proyecto_referencia: contexto.data.proyectoBase.nombre,
    centro_costo_referencia: contexto.data.centroCostoReferencia,
  });

  const solicitud = await crearSolicitudPagoRepository({
    numero_solicitud: secuencia.referencia,
    tipo_solicitud: "PAGO_IMPUESTO",
    modalidad_nomina: null,
    periodo_nomina: null,
    proyecto_base_id: proyectoBaseId,
    fondo_id: contexto.data.fondo.id,
    centro_costo_id: centroCostoId,
    beneficiario_id: beneficiarioId,
    proveedor_id: null,
    categoria_gasto: null,
    categoria_reembolso: null,
    concepto_nomina: null,
    tipo_impuesto: tipoImpuesto,
    periodo_impuesto: periodoImpuesto,
    medio_pago: medioPago,
    adjunto_archivo_origen_id: null,
    descripcion,
    valor_bruto: valorBruto,
    valor_impuestos: 0,
    valor_retenciones: 0,
    valor_descuentos: 0,
    valor_neto: valorBruto,
    estado_actual: "BORRADOR",
    creado_por: usuarioAutenticado.id,
  });

  return {
    status: 201,
    body: {
      ok: true,
      message:
        "Solicitud de pago de impuesto creada correctamente.",
      data: {
        solicitud: convertirSolicitudPago(solicitud),
      },
    },
  };
}

export async function crearSolicitudReembolsoService(
  usuarioAutenticado: UsuarioSesion,
  input: CrearSolicitudReembolsoInput,
): Promise<ServiceResponse<{ solicitud: SolicitudPagoListado }>> {
  if (!usuarioPuedeCrearReembolso(usuarioAutenticado)) {
    return {
      status: 403,
      body: {
        ok: false,
        message:
          "Solo un Solicitante, Director, Auxiliar contable, Aprobador nivel 1 o Administrador puede crear solicitudes de reembolso.",
      },
    };
  }

  const proyectoBaseId = normalizarTexto(input.proyecto_base_id);
  const centroCostoId = normalizarTexto(input.centro_costo_id);
  const beneficiarioId = normalizarTexto(input.beneficiario_id);
  const categoriaReembolso = normalizarCategoriaReembolso(
    input.categoria_reembolso,
  );
  const descripcion = normalizarTexto(input.descripcion);
  const medioPago = normalizarMedioPago(input.medio_pago);

  if (
    !proyectoBaseId ||
    !centroCostoId ||
    !beneficiarioId ||
    !categoriaReembolso ||
    !descripcion ||
    !medioPago
  ) {
    return {
      status: 400,
      body: {
        ok: false,
        message:
          "Proyecto base, centro de costo, beneficiario, categoría de reembolso, medio de pago y descripción son obligatorios.",
      },
    };
  }

  if (!CATEGORIAS_REEMBOLSO.includes(categoriaReembolso)) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "La categoría de reembolso no es válida.",
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
  const valorImpuestos = obtenerNumeroNoNegativo(
    input.valor_impuestos,
    0,
  );
  const valorRetenciones = obtenerNumeroNoNegativo(
    input.valor_retenciones,
    0,
  );
  const valorDescuentos = obtenerNumeroNoNegativo(
    input.valor_descuentos,
    0,
  );

  if (valorBruto === null || valorBruto <= 0) {
    return {
      status: 400,
      body: {
        ok: false,
        message:
          "El valor bruto del reembolso debe ser numérico y mayor a cero.",
      },
    };
  }

  if (
    valorImpuestos === null ||
    valorRetenciones === null ||
    valorDescuentos === null
  ) {
    return {
      status: 400,
      body: {
        ok: false,
        message:
          "Impuestos, retenciones y descuentos deben ser valores numéricos no negativos.",
      },
    };
  }

  const valorNeto =
    valorBruto - valorRetenciones - valorDescuentos;

  if (valorNeto < 0) {
    return {
      status: 400,
      body: {
        ok: false,
        message:
          "El valor neto del reembolso no puede ser negativo.",
      },
    };
  }

  const contexto = await obtenerContextoFinancieroSolicitud({
    usuarioAutenticado,
    proyectoBaseId,
    centroCostoId,
  });

  if (!contexto.ok) {
    return contexto.response;
  }

  const beneficiario = await obtenerBeneficiarioActivoRepository(
    beneficiarioId,
  );

  if (!beneficiario) {
    return {
      status: 404,
      body: {
        ok: false,
        message:
          "El beneficiario del reembolso no existe o está inactivo.",
      },
    };
  }

  if (beneficiario.tipo_beneficiario !== "TRABAJADOR") {
    return {
      status: 400,
      body: {
        ok: false,
        message:
          "El beneficiario del reembolso debe ser de tipo TRABAJADOR.",
      },
    };
  }

  const secuencia = await generarNumeroSolicitudPagoService({
    proyecto_base_id: proyectoBaseId,
    centro_costo_id: centroCostoId,
    proyecto_referencia: contexto.data.proyectoBase.nombre,
    centro_costo_referencia: contexto.data.centroCostoReferencia,
  });

  const solicitud = await crearSolicitudPagoRepository({
    numero_solicitud: secuencia.referencia,
    tipo_solicitud: "REEMBOLSO",
    modalidad_nomina: null,
    periodo_nomina: null,
    proyecto_base_id: proyectoBaseId,
    fondo_id: contexto.data.fondo.id,
    centro_costo_id: centroCostoId,
    beneficiario_id: beneficiarioId,
    proveedor_id: null,
    categoria_gasto: null,
    categoria_reembolso: categoriaReembolso,
    concepto_nomina: null,
    tipo_impuesto: null,
    periodo_impuesto: null,
    medio_pago: medioPago,
    adjunto_archivo_origen_id: null,
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
      message:
        "Solicitud de reembolso creada correctamente.",
      data: {
        solicitud: convertirSolicitudPago(solicitud),
      },
    },
  };
}


export async function registrarAdjuntosSolicitudPagoService(
  input: RegistrarAdjuntosSolicitudPagoInput,
) {
  if (input.archivos.length === 0) {
    return {
      archivos: [],
    };
  }

  try {
    return await crearAdjuntosSolicitudPagoService({
      solicitudPagoId: input.solicitudPagoId,
      archivos: input.archivos,
      subidoPor: input.usuarioId,
      carpeta: input.carpeta,
    });
  } catch (error) {
    try {
      await eliminarSolicitudPagoRepository(
        input.solicitudPagoId,
      );
    } catch (rollbackError) {
      console.error(
        "No fue posible eliminar la solicitud después del fallo al registrar adjuntos:",
        rollbackError,
      );
    }

    throw error;
  }
}

export async function enviarSolicitudPagoService(
  usuarioAutenticado: UsuarioSesion,
  solicitudId: string,
): Promise<ServiceResponse<{ solicitud: SolicitudPagoListado }>> {
  const puedeEnviar =
    ROLES_QUE_PUEDEN_ENVIAR_SOLICITUDES.some((rol) =>
      usuarioTieneRol(usuarioAutenticado, rol),
    ) ||
    usuarioTienePermiso(usuarioAutenticado, "CREAR_SOLICITUDES");

  if (!puedeEnviar) {
    return {
      status: 403,
      body: {
        ok: false,
        message: "No tiene permisos para enviar solicitudes de pago.",
      },
    };
  }

  const id = normalizarTexto(solicitudId);

  if (!id) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "El identificador de la solicitud es obligatorio.",
      },
    };
  }

  const solicitud = await obtenerSolicitudPagoPorIdRepository(id);

  if (!solicitud) {
    return {
      status: 404,
      body: {
        ok: false,
        message: "La solicitud de pago no existe.",
      },
    };
  }

  const esPropietario = solicitud.creado_por === usuarioAutenticado.id;

  if (!esPropietario && !usuarioEsAdministrador(usuarioAutenticado)) {
    return {
      status: 403,
      body: {
        ok: false,
        message: "Solo el creador de la solicitud o un Administrador puede enviarla.",
      },
    };
  }

  if (solicitud.estado_actual !== "BORRADOR") {
    return {
      status: 409,
      body: {
        ok: false,
        message: "Solo se pueden enviar solicitudes en estado BORRADOR.",
      },
    };
  }

  const solicitudEnviada = await enviarSolicitudPagoRepository({
    solicitudId: id,
    enviadoEn: new Date(),
  });

  if (!solicitudEnviada) {
    return {
      status: 409,
      body: {
        ok: false,
        message:
          "La solicitud ya no se encuentra en estado BORRADOR. Actualice la información e inténtelo nuevamente.",
      },
    };
  }

  return {
    status: 200,
    body: {
      ok: true,
      message: "Solicitud de pago enviada correctamente.",
      data: {
        solicitud: convertirSolicitudPago(solicitudEnviada),
      },
    },
  };
}
