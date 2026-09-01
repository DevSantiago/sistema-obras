import type { UsuarioSesion } from "@/modules/auth/auth.types";
import { crearAdjuntosSolicitudPagoService } from "@/modules/adjuntos/adjuntos.service";
import { storageService } from "@/modules/storage/storage.service";
import type { ArchivoGuardado } from "@/modules/storage/storage.types";
import { obtenerDetalleNominaGrupalService } from "./nomina-grupal/nomina-grupal.service";
import {
  CATEGORIAS_REEMBOLSO,
  TIPOS_IMPUESTO_SOLICITUD,
} from "./solicitudes-pago.types";
import {
  actualizarSolicitudPagoRepository,
  editarSolicitudAprobadorNivel1Repository,
  buscarDuplicadoNominaIndividualRepository,
  crearSolicitudPagoRepository,
  enviarSolicitudPagoRepository,
  listarSolicitudesPagoRepository,
  listarSolicitudesAprobadasPorUsuarioRepository,
  obtenerAccesoActivoUsuarioProyectoLineaRepository,
  obtenerAccesoActivoUsuarioProyectoRepository,
  obtenerBeneficiarioActivoRepository,
  obtenerCentroCostoActivoRepository,
  obtenerFondoActivoPorProyectoRepository,
  obtenerProyectoBaseActivoRepository,
  obtenerSolicitudPagoPorIdRepository,
  obtenerComprobantePagoSolicitudRepository,
  obtenerAdjuntoSolicitudPagoRepository,
  eliminarSolicitudPagoRepository,
  obtenerSolicitudesPagoPorIdsRepository,
  obtenerReservasPorFondosRepository,
  obtenerFondosPorIdsRepository,
  aprobarSolicitudesNivel1Repository,
  aprobarSolicitudesNivel2Repository,
  devolverSolicitudPagoRepository,
  devolverSolicitudesPagoRepository,
  anularSolicitudesPagoRepository,
  reenviarSolicitudDevueltaRepository,
  SolicitudesPagoCambioConcurrenteError,
  RegistroPagosError,
  registrarOperacionEfectivoRepository,
  registrarTransferenciasRepository,
} from "./solicitudes-pago.repository";
import type {
  CategoriaReembolso,
  CrearSolicitudNominaIndividualInput,
  CrearSolicitudPagoImpuestoInput,
  CrearSolicitudReembolsoInput,
  CrearSolicitudPagoProveedorInput,
  CrearSolicitudPagoProveedorRepositoryInput,
  EstadoSolicitudPago,
  MedioPagoSolicitud,
  ModalidadNomina,
  ServiceResponse,
  SolicitudPagoListFilters,
  SolicitudPagoListado,
  SolicitudProgramadaPago,
  ConsultarAprobacionesNivel1Data,
  ProyectoPendienteAprobacionNivel1,
  TipoImpuestoSolicitud,
  TipoSolicitudPago,
  VisibilidadSolicitudesPago,
  AprobarSolicitudesNivel1Input,
  AprobarSolicitudesNivel1Data,
  EditarSolicitudAprobadorNivel1Input,
  ConsultarAprobacionesNivel2Data,
  ProyectoPendienteAprobacionNivel2,
  AprobarSolicitudesNivel2Input,
  ResumenProyectoAprobacionNivel2,
  AprobarSolicitudesNivel2Data,
  DevolverSolicitudPagoInput,
  DevolverSolicitudPagoData,
  DevolverSolicitudesPagoInput,
  DevolverSolicitudesPagoData,
  AnularSolicitudesPagoInput,
  AnularSolicitudesPagoData,
  RegistrarTransferenciaLoteInput,
  RegistrarTransferenciasData,
  RegistrarOperacionEfectivoInput,
  RegistrarOperacionEfectivoData,
} from "./solicitudes-pago.types";

const MEDIOS_PAGO_VALIDOS: MedioPagoSolicitud[] = [
  "TRANSFERENCIA",
  "PSE",
  "PORTAL",
  "CONSIGNACION",
  "EFECTIVO",
];

const MODALIDADES_NOMINA_VALIDAS: ModalidadNomina[] = [
  "INDIVIDUAL",
  "AGRUPADA_EXCEL",
];

const CONCEPTOS_NOMINA_VALIDOS = [
  "SALARIO",
  "HONORARIOS",
  "BONIFICACION",
  "AUXILIO",
  "LIQUIDACION",
  "OTRO",
];

const CATEGORIAS_GASTO_VALIDAS = [
  "MATERIALES",
  "MANO_OBRA",
  "EQUIPOS",
  "SERVICIOS",
  "TRANSPORTE",
  "ADMINISTRATIVO",
  "OTRO",
];

function esBeneficiarioValidoParaPagoProveedor(
  tipoBeneficiario: string,
): boolean {
  return tipoBeneficiario === "PROVEEDOR" || tipoBeneficiario === "OTRO";
}

function obtenerMetadatosAdjunto(archivo: ArchivoGuardado) {
  return {
    nombre_archivo: archivo.nombre_archivo,
    ruta_archivo: archivo.ruta_archivo,
    nombre_bucket: archivo.nombre_bucket,
    tipo_mime: archivo.tipo_mime,
    tamano_archivo: archivo.tamano_archivo,
  };
}

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
  numero_solicitud: string | null;
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
  valor_retenciones: unknown;
  valor_descuentos: unknown;
  valor_neto: unknown;
  estado_actual: string;
  creado_por: string | null;
  enviado_en: Date | null;
  aprobado_1_en: Date | null;
  aprobado_2_en: Date | null;
  pagado_en: Date | null;
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
  aprobador1?: { id: string; nombre: string } | null;
  aprobador2?: { id: string; nombre: string } | null;
  pagador?: { id: string; nombre: string } | null;
  devoluciones?: Array<{
    id: string;
    estado_origen: string;
    estado_destino: string;
    motivo: string;
    creado_en: Date;
    usuario: {
      id: string;
      nombre: string;
    };
  }>;
  anulaciones?: Array<{
    id: string;
    estado_origen: string;
    motivo: string;
    creado_en: Date;
    usuario: { id: string; nombre: string };
  }>;
  adjuntos?: Array<{
    id: string;
    nombre_archivo: string;
    tipo_mime: string | null;
    subido_en: Date;
    usuario_subio: { id: string; nombre: string } | null;
  }>;
  eventos_auditoria?: Array<{
    id: string;
    accion: string;
    estado_anterior: string | null;
    estado_nuevo: string | null;
    descripcion: string;
    cambios: unknown;
    creado_en: Date;
    usuario: { id: string; nombre: string } | null;
  }>;
  pagos?: {
    registrado_en: Date;
    registrador: { id: string; nombre: string };
    soporte: {
      id: string;
      nombre_archivo: string;
      tipo_mime: string | null;
    };
  } | null;
  detalleOperacionEfectivo?: {
    soporte: {
      id: string;
      nombre_archivo: string;
      tipo_mime: string | null;
    };
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
    (usuarioEsDirector(usuario) || usuarioTieneRol(usuario, "APROBADOR_1")) &&
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
    incluir_proyectos_asignados: !consultarTodas,
    estados_flujo: consultarTodas ? [] : Array.from(estadosFlujo),
  };
}

function normalizarTexto(valor?: string | null): string {
  return valor?.trim() ?? "";
}

function normalizarIdsSolicitudes(
  solicitudIds?: string[],
): {
  ids: string[];
  tieneDuplicados: boolean;
  tieneValoresInvalidos: boolean;
} {
  if (!Array.isArray(solicitudIds)) {
    return {
      ids: [],
      tieneDuplicados: false,
      tieneValoresInvalidos: false,
    };
  }

  const tieneValoresInvalidos = solicitudIds.some(
    (id) => typeof id !== "string" || normalizarTexto(id) === "",
  );

  const idsNormalizados = solicitudIds
    .filter((id): id is string => typeof id === "string")
    .map((id) => normalizarTexto(id))
    .filter(Boolean);

  const idsUnicos = Array.from(new Set(idsNormalizados));

  return {
    ids: idsUnicos,
    tieneDuplicados: idsUnicos.length !== idsNormalizados.length,
    tieneValoresInvalidos,
  };
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
  const historial = [
    {
      id: `${solicitud.id}-creacion`,
      accion: "CREACION_BORRADOR",
      descripcion: "Se creó el borrador de la solicitud.",
      estado_anterior: null,
      estado_nuevo: "BORRADOR",
      cambios: null,
      creado_en: solicitud.creado_en,
      usuario: solicitud.creador
        ? { id: solicitud.creador.id, nombre: solicitud.creador.nombre }
        : null,
    },
    ...(solicitud.enviado_en &&
      !(solicitud.eventos_auditoria ?? []).some(
        (evento) => evento.accion === "ENVIO_APROBACION",
      )
      ? [{
          id: `${solicitud.id}-envio`,
          accion: "ENVIO_APROBACION",
          descripcion: "La solicitud fue enviada a aprobación nivel 1.",
          estado_anterior: "BORRADOR",
          estado_nuevo: "PENDIENTE_APROBADOR_1",
          cambios: null,
          creado_en: solicitud.enviado_en,
          usuario: solicitud.creador
            ? { id: solicitud.creador.id, nombre: solicitud.creador.nombre }
            : null,
        }]
      : []),
    ...(solicitud.aprobado_1_en
      ? [{
          id: `${solicitud.id}-aprobacion-1`,
          accion: "APROBACION_NIVEL_1",
          descripcion: "La solicitud fue aprobada en nivel 1.",
          estado_anterior: "PENDIENTE_APROBADOR_1",
          estado_nuevo: "PENDIENTE_APROBADOR_2",
          cambios: null,
          creado_en: solicitud.aprobado_1_en,
          usuario: solicitud.aprobador1 ?? null,
        }]
      : []),
    ...(solicitud.aprobado_2_en
      ? [{
          id: `${solicitud.id}-aprobacion-2`,
          accion: "APROBACION_NIVEL_2",
          descripcion: "La solicitud fue aprobada en nivel 2 y programada para pago.",
          estado_anterior: "PENDIENTE_APROBADOR_2",
          estado_nuevo: "PROGRAMADA_PAGO",
          cambios: null,
          creado_en: solicitud.aprobado_2_en,
          usuario: solicitud.aprobador2 ?? null,
        }]
      : []),
    ...(solicitud.devoluciones ?? []).map((evento) => ({
      id: evento.id,
      accion: "DEVOLUCION",
      descripcion: evento.motivo,
      estado_anterior: evento.estado_origen,
      estado_nuevo: evento.estado_destino,
      cambios: null,
      creado_en: evento.creado_en,
      usuario: evento.usuario,
    })),
    ...(solicitud.anulaciones ?? []).map((evento) => ({
      id: evento.id,
      accion: "ANULACION",
      descripcion: evento.motivo,
      estado_anterior: evento.estado_origen,
      estado_nuevo: "ANULADA",
      cambios: null,
      creado_en: evento.creado_en,
      usuario: evento.usuario,
    })),
    ...(solicitud.adjuntos ?? []).map((evento) => ({
      id: evento.id,
      accion: "ADJUNTO_CARGADO",
      descripcion: `Se cargó el archivo ${evento.nombre_archivo}.`,
      estado_anterior: null,
      estado_nuevo: null,
      cambios: null,
      creado_en: evento.subido_en,
      usuario: evento.usuario_subio,
    })),
    ...(solicitud.pagado_en
      ? [{
          id: `${solicitud.id}-pago`,
          accion: "PAGO_REGISTRADO",
          descripcion: "La solicitud fue marcada como pagada.",
          estado_anterior: "PROGRAMADA_PAGO",
          estado_nuevo: "PAGADA",
          cambios: null,
          creado_en: solicitud.pagado_en,
          usuario: solicitud.pagador ?? solicitud.pagos?.registrador ?? null,
        }]
      : []),
    ...(solicitud.eventos_auditoria ?? []).map((evento) => ({
      ...evento,
      usuario: evento.usuario,
    })),
  ].sort(
    (a, b) => new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime(),
  );

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
    valor_retenciones: convertirDecimalANumero(solicitud.valor_retenciones),
    valor_descuentos: convertirDecimalANumero(solicitud.valor_descuentos),
    valor_neto: convertirDecimalANumero(solicitud.valor_neto),
    estado_actual: solicitud.estado_actual as EstadoSolicitudPago,
    creado_por: solicitud.creado_por,
    enviado_en: solicitud.enviado_en,
    aprobado_1_en: solicitud.aprobado_1_en,
    aprobado_2_en: solicitud.aprobado_2_en,
    pagado_en: solicitud.pagado_en,
    creado_en: solicitud.creado_en,
    actualizado_en: solicitud.actualizado_en,
    proyecto_base: solicitud.proyecto_base,
    centro_costo: solicitud.centro_costo,
    beneficiario: solicitud.beneficiario,
    proveedor: solicitud.proveedor,
    creador: solicitud.creador,
    ultima_devolucion: solicitud.devoluciones?.[0] ?? null,
    adjuntos: solicitud.adjuntos ?? [],
    comprobante_pago:
      solicitud.pagos?.soporte ??
      solicitud.detalleOperacionEfectivo?.soporte ??
      null,
    historial,
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

function construirSolicitudPagoProveedorRepositoryInput(input: {
  usuarioId: string;
  fondoId: string;
  proyectoBaseId: string;
  centroCostoId: string;
  beneficiarioId: string;
  proveedorId: string | null;
  categoriaGasto: string;
  medioPago: MedioPagoSolicitud;
  descripcion: string;
  valorBruto: number;
  valorRetenciones: number;
  valorDescuentos: number;
  valorNeto: number;
  numeroSolicitud?: string | null;
  estadoActual?: "BORRADOR" | "DEVUELTA_SOLICITANTE";
}): CrearSolicitudPagoProveedorRepositoryInput {
  return {
    numero_solicitud: input.numeroSolicitud ?? null,
    tipo_solicitud: "PAGO_PROVEEDOR",
    modalidad_nomina: null,
    periodo_nomina: null,
    proyecto_base_id: input.proyectoBaseId,
    fondo_id: input.fondoId,
    centro_costo_id: input.centroCostoId,
    beneficiario_id: input.beneficiarioId,
    proveedor_id: input.proveedorId,
    categoria_gasto: input.categoriaGasto,
    categoria_reembolso: null,
    concepto_nomina: null,
    tipo_impuesto: null,
    periodo_impuesto: null,
    medio_pago: input.medioPago,
    adjunto_archivo_origen_id: null,
    descripcion: input.descripcion,
    valor_bruto: input.valorBruto,
    valor_retenciones: input.valorRetenciones,
    valor_descuentos: input.valorDescuentos,
    valor_neto: input.valorNeto,
    estado_actual: input.estadoActual ?? "BORRADOR",
    creado_por: input.usuarioId,
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

async function obtenerSolicitudEditable(
  usuarioAutenticado: UsuarioSesion,
  solicitudId: string,
): Promise<
  | {
      ok: true;
      solicitud: NonNullable<
        Awaited<
          ReturnType<typeof obtenerSolicitudPagoPorIdRepository>
        >
      >;
    }
  | {
      ok: false;
      response: ServiceResponse<never>;
    }
> {
  const id = normalizarTexto(solicitudId);

  if (!id) {
    return {
      ok: false,
      response: {
        status: 400,
        body: {
          ok: false,
          message:
            "El identificador de la solicitud es obligatorio.",
        },
      },
    };
  }

  const solicitud =
    await obtenerSolicitudPagoPorIdRepository(id);

  if (!solicitud) {
    return {
      ok: false,
      response: {
        status: 404,
        body: {
          ok: false,
          message: "La solicitud de pago no existe.",
        },
      },
    };
  }

  const esPropietario =
    solicitud.creado_por === usuarioAutenticado.id;

  if (!esPropietario && !usuarioEsAdministrador(usuarioAutenticado)) {
    return {
      ok: false,
      response: {
        status: 403,
        body: {
          ok: false,
          message:
            "Solo el creador de la solicitud o un Administrador puede modificarla.",
        },
      },
    };
  }

  const estadoEditablePorSolicitante =
    solicitud.estado_actual === "BORRADOR" ||
    solicitud.estado_actual === "DEVUELTA_SOLICITANTE";

  if (!estadoEditablePorSolicitante) {
    return {
      ok: false,
      response: {
        status: 409,
        body: {
          ok: false,
          message:
            "Solo se pueden editar solicitudes en borrador o devueltas al solicitante.",
        },
      },
    };
  }

  return {
    ok: true,
    solicitud,
  };
}

export async function editarSolicitudAprobadorNivel1Service(
  usuarioAutenticado: UsuarioSesion,
  solicitudId: string,
  input: EditarSolicitudAprobadorNivel1Input,
): Promise<ServiceResponse<{ solicitud: SolicitudPagoListado }>> {
  if (!usuarioTienePermiso(usuarioAutenticado, "APROBAR_NIVEL_1")) {
    return {
      status: 403,
      body: {
        ok: false,
        message: "No tiene permiso para editar solicitudes en aprobación nivel 1.",
      },
    };
  }

  const id = normalizarTexto(solicitudId);
  const solicitud = id
    ? await obtenerSolicitudPagoPorIdRepository(id)
    : null;

  if (!solicitud) {
    return {
      status: id ? 404 : 400,
      body: {
        ok: false,
        message: id
          ? "La solicitud de pago no existe."
          : "El identificador de la solicitud es obligatorio.",
      },
    };
  }

  if (
    solicitud.estado_actual !== "PENDIENTE_APROBADOR_1" &&
    solicitud.estado_actual !== "DEVUELTA_APROBADOR_1"
  ) {
    return {
      status: 409,
      body: {
        ok: false,
        message: "Solo se pueden editar solicitudes pendientes de nivel 1 o devueltas desde nivel 2.",
      },
    };
  }

  if (
    solicitud.tipo_solicitud === "PAGO_NOMINA" &&
    solicitud.modalidad_nomina === "AGRUPADA_EXCEL"
  ) {
    return {
      status: 409,
      body: {
        ok: false,
        message: "La nómina agrupada debe corregirse desde su flujo de edición grupal.",
      },
    };
  }

  const contexto = await obtenerContextoFinancieroSolicitud({
    usuarioAutenticado,
    proyectoBaseId: solicitud.proyecto_base_id,
    centroCostoId: solicitud.centro_costo_id,
  });

  if (!contexto.ok) {
    return contexto.response;
  }

  const beneficiarioId = normalizarTexto(input.beneficiario_id);
  const categoria = normalizarTextoDominio(input.categoria);
  const medioPago = normalizarMedioPago(input.medio_pago);
  const descripcion = normalizarTexto(input.descripcion);

  if (!beneficiarioId || !categoria || !medioPago || !descripcion) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "Beneficiario, categoría, medio de pago y concepto de pago son obligatorios.",
      },
    };
  }

  if (!MEDIOS_PAGO_VALIDOS.includes(medioPago)) {
    return {
      status: 400,
      body: { ok: false, message: "El medio de pago no es válido." },
    };
  }

  const valorBruto = obtenerNumeroNoNegativo(input.valor_bruto, -1);
  const valorRetenciones = obtenerNumeroNoNegativo(input.valor_retenciones);
  const valorDescuentos = obtenerNumeroNoNegativo(input.valor_descuentos);

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
        message: "Los valores deben ser numéricos no negativos y el valor bruto debe ser mayor a cero.",
      },
    };
  }

  const valorNeto = valorBruto - valorRetenciones - valorDescuentos;

  if (valorNeto < 0) {
    return {
      status: 400,
      body: { ok: false, message: "El valor neto no puede ser negativo." },
    };
  }

  const beneficiario = await obtenerBeneficiarioActivoRepository(beneficiarioId);

  if (!beneficiario) {
    return {
      status: 404,
      body: { ok: false, message: "El beneficiario no existe o está inactivo." },
    };
  }

  if (
    solicitud.tipo_solicitud === "PAGO_PROVEEDOR" &&
    !esBeneficiarioValidoParaPagoProveedor(
      beneficiario.tipo_beneficiario,
    )
  ) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "El beneficiario debe ser tipo PROVEEDOR u OTRO.",
      },
    };
  }

  if (
    (solicitud.tipo_solicitud === "PAGO_NOMINA" ||
      solicitud.tipo_solicitud === "REEMBOLSO") &&
    beneficiario.tipo_beneficiario !== "TRABAJADOR"
  ) {
    return {
      status: 400,
      body: { ok: false, message: "El beneficiario debe ser tipo TRABAJADOR." },
    };
  }

  if (
    solicitud.tipo_solicitud === "PAGO_PROVEEDOR" &&
    !CATEGORIAS_GASTO_VALIDAS.includes(categoria)
  ) {
    return {
      status: 400,
      body: { ok: false, message: "La categoría de gasto no es válida." },
    };
  }

  if (
    solicitud.tipo_solicitud === "REEMBOLSO" &&
    !CATEGORIAS_REEMBOLSO.includes(categoria as CategoriaReembolso)
  ) {
    return {
      status: 400,
      body: { ok: false, message: "La categoría de reembolso no es válida." },
    };
  }

  if (
    solicitud.tipo_solicitud === "PAGO_NOMINA" &&
    !CONCEPTOS_NOMINA_VALIDOS.includes(categoria)
  ) {
    return {
      status: 400,
      body: { ok: false, message: "El concepto de nómina no es válido." },
    };
  }

  if (
    solicitud.tipo_solicitud === "PAGO_IMPUESTO" &&
    !TIPOS_IMPUESTO_SOLICITUD.includes(categoria as TipoImpuestoSolicitud)
  ) {
    return {
      status: 400,
      body: { ok: false, message: "El tipo de impuesto no es válido." },
    };
  }

  if (solicitud.estado_actual === "DEVUELTA_APROBADOR_1") {
    const [reservas, fondos] = await Promise.all([
      obtenerReservasPorFondosRepository([solicitud.fondo_id]),
      obtenerFondosPorIdsRepository([solicitud.fondo_id]),
    ]);
    const fondo = fondos[0];
    const totalReservado = Number(reservas[0]?._sum.valor_reservado ?? 0);
    const reservaActual = Number(solicitud.valor_reservado ?? 0);
    const disponibleParaSolicitud = Number(fondo?.saldo_actual ?? 0) -
      totalReservado + reservaActual;

    if (!fondo?.activo || valorNeto > disponibleParaSolicitud) {
      return {
        status: 409,
        body: {
          ok: false,
          message: !fondo?.activo
            ? "El fondo asociado no está activo."
            : "El nuevo valor neto supera el saldo disponible del proyecto.",
        },
      };
    }
  }

  try {
    const actualizada = await editarSolicitudAprobadorNivel1Repository({
      solicitudId: solicitud.id,
      modificadoPor: usuarioAutenticado.id,
      estadoOrigen: solicitud.estado_actual,
      beneficiarioId,
      proveedorId:
        solicitud.tipo_solicitud === "PAGO_PROVEEDOR"
          ? normalizarTextoOpcional(beneficiario.proveedor_id)
          : null,
      categoriaGasto:
        solicitud.tipo_solicitud === "PAGO_PROVEEDOR" ? categoria : null,
      categoriaReembolso:
        solicitud.tipo_solicitud === "REEMBOLSO" ? categoria : null,
      conceptoNomina:
        solicitud.tipo_solicitud === "PAGO_NOMINA" ? categoria : null,
      tipoImpuesto:
        solicitud.tipo_solicitud === "PAGO_IMPUESTO" ? categoria : null,
      medioPago,
      descripcion,
      valorBruto,
      valorRetenciones,
      valorDescuentos,
      valorNeto,
    });

    return {
      status: 200,
      body: {
        ok: true,
        message: "Solicitud actualizada correctamente por el Aprobador Nivel 1.",
        data: { solicitud: convertirSolicitudPago(actualizada) },
      },
    };
  } catch (error) {
    if (error instanceof SolicitudesPagoCambioConcurrenteError) {
      return {
        status: 409,
        body: {
          ok: false,
          message: "La solicitud cambió de estado durante la edición. Actualice la bandeja e intente nuevamente.",
        },
      };
    }

    throw error;
  }
}

export async function agregarAdjuntosSolicitudNivel1Service(input: {
  usuarioAutenticado: UsuarioSesion;
  solicitudId: string;
  archivos: File[];
}) {
  if (input.archivos.length === 0) {
    return { count: 0 };
  }

  if (!usuarioTienePermiso(input.usuarioAutenticado, "APROBAR_NIVEL_1")) {
    throw new Error("No tiene permiso para adjuntar soportes en aprobación nivel 1.");
  }

  const solicitud = await obtenerSolicitudPagoPorIdRepository(input.solicitudId);

  if (
    !solicitud ||
    (solicitud.estado_actual !== "PENDIENTE_APROBADOR_1" &&
      solicitud.estado_actual !== "DEVUELTA_APROBADOR_1")
  ) {
    throw new Error("La solicitud ya no admite adjuntos desde aprobación nivel 1.");
  }

  const resultado = await crearAdjuntosSolicitudPagoService({
    solicitudPagoId: solicitud.id,
    archivos: input.archivos,
    subidoPor: input.usuarioAutenticado.id,
    carpeta: "solicitudes-pago/aprobacion-nivel-1",
  });

  return { count: resultado.count };
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

export async function listarBandejaPagosService(
  usuarioAutenticado: UsuarioSesion,
  filters: SolicitudPagoListFilters = {},
): Promise<ServiceResponse<{ solicitudes: SolicitudProgramadaPago[] }>> {
  const puedeConsultarPagos =
    usuarioAutenticado.roles.includes("PAGOS") ||
    usuarioAutenticado.roles.includes("ADMINISTRADOR");

  if (!puedeConsultarPagos) {
    return {
      status: 403,
      body: {
        ok: false,
        message: "No tiene permisos para consultar la bandeja de pagos.",
      },
    };
  }

  let filtrosNormalizados: SolicitudPagoListFilters;

  try {
    filtrosNormalizados = normalizarFiltrosListado({
      ...filters,
      estado_actual: "PROGRAMADA_PAGO",
    });
  } catch (error) {
    return {
      status: 400,
      body: {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Los filtros de la bandeja de pagos no son válidos.",
      },
    };
  }

  const solicitudes = await listarSolicitudesPagoRepository({
    filters: filtrosNormalizados,
    visibilidad: {
      consultar_todas: true,
      usuario_id: usuarioAutenticado.id,
      incluir_propias: false,
      incluir_proyectos_asignados: false,
      estados_flujo: [],
    },
  });

  const beneficiarioIds = Array.from(
    new Set(
      solicitudes
        .map((solicitud) => solicitud.beneficiario_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const beneficiarios = await Promise.all(
    beneficiarioIds.map((beneficiarioId) =>
      obtenerBeneficiarioActivoRepository(beneficiarioId),
    ),
  );

  const beneficiariosPorId = new Map(
    beneficiarios
      .filter((beneficiario) => beneficiario !== null)
      .map((beneficiario) => [beneficiario.id, beneficiario]),
  );
  const fondos = await obtenerFondosPorIdsRepository(
    Array.from(new Set(solicitudes.map((solicitud) => solicitud.fondo_id))),
  );
  const saldosPorFondo = new Map(
    fondos.map((fondo) => [fondo.id, fondo.saldo_actual.toNumber()]),
  );

  return {
    status: 200,
    body: {
      ok: true,
      message: "Bandeja de pagos consultada correctamente.",
      data: {
        solicitudes: solicitudes.map((solicitud) => {
          const solicitudConvertida = convertirSolicitudPago(solicitud);
          const beneficiario = solicitud.beneficiario_id
            ? beneficiariosPorId.get(solicitud.beneficiario_id)
            : null;

          return {
            ...solicitudConvertida,
            saldo_fondo_actual:
              saldosPorFondo.get(solicitud.fondo_id) ?? 0,
            beneficiario: solicitudConvertida.beneficiario
              ? {
                  ...solicitudConvertida.beneficiario,
                  banco: beneficiario?.banco ?? null,
                  tipo_cuenta_bancaria:
                    beneficiario?.tipo_cuenta_bancaria ?? null,
                  numero_cuenta_bancaria:
                    beneficiario?.numero_cuenta_bancaria ?? null,
                }
              : null,
          };
        }),
      },
    },
  };
}

export async function registrarTransferenciasService(
  usuarioAutenticado: UsuarioSesion,
  pagos: RegistrarTransferenciaLoteInput[],
): Promise<ServiceResponse<RegistrarTransferenciasData>> {
  const puedeRegistrar =
    usuarioAutenticado.roles.includes("ADMINISTRADOR") ||
    (usuarioAutenticado.roles.includes("PAGOS") &&
      usuarioAutenticado.permisos.includes("MARCAR_COMO_PAGADO"));

  if (!puedeRegistrar) {
    return {
      status: 403,
      body: {
        ok: false,
        message: "No tiene permisos para registrar pagos.",
      },
    };
  }

  if (pagos.length === 0) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "Debe seleccionar al menos una solicitud.",
      },
    };
  }

  if (new Set(pagos.map((pago) => pago.solicitud_id)).size !== pagos.length) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "Una solicitud no puede repetirse en el mismo lote.",
      },
    };
  }

  const fechaActual = new Date();

  for (const pago of pagos) {
    if (
      !pago.solicitud_id.trim() ||
      !pago.numero_comprobante.trim()
    ) {
      return {
        status: 400,
        body: {
          ok: false,
          message:
            "La solicitud y la referencia son obligatorias para cada pago directo.",
        },
      };
    }

    if (
      pago.soporte.size <= 0 ||
      pago.soporte.size > 10 * 1024 * 1024
    ) {
      return {
        status: 400,
        body: {
          ok: false,
          message:
            "Cada soporte debe tener contenido y un tamaño máximo de 10 MB.",
        },
      };
    }

    const tiposSoportePermitidos = [
      "application/pdf",
      "image/png",
      "image/jpeg",
    ];

    if (
      pago.soporte.type &&
      !tiposSoportePermitidos.includes(pago.soporte.type)
    ) {
      return {
        status: 400,
        body: {
          ok: false,
          message:
            "Los soportes deben estar en formato PDF, PNG, JPG o JPEG.",
        },
      };
    }
  }

  const archivosGuardados: ArchivoGuardado[] = [];

  try {
    for (const pago of pagos) {
      const archivo = await storageService.guardarArchivo({
        contenido: Buffer.from(await pago.soporte.arrayBuffer()),
        nombre_original: pago.soporte.name,
        tipo_mime: pago.soporte.type || null,
        carpeta: "solicitudes-pago/soportes-transferencia",
      });

      archivosGuardados.push(archivo);
    }

    const resultado = await registrarTransferenciasRepository({
      pagos: pagos.map((pago, indice) => ({
        solicitud_id: pago.solicitud_id.trim(),
        fecha_pago: fechaActual,
        numero_comprobante: pago.numero_comprobante.trim(),
        observacion: pago.observacion?.trim() || null,
        soporte: obtenerMetadatosAdjunto(archivosGuardados[indice]),
      })),
      usuarioId: usuarioAutenticado.id,
      fechaRegistro: fechaActual,
    });

    return {
      status: 200,
      body: {
        ok: true,
        message:
          pagos.length === 1
            ? "Pago directo registrado correctamente."
            : `${pagos.length} pagos directos registrados correctamente.`,
        data: {
          solicitudes: resultado.solicitudes.map(convertirSolicitudPago),
          resumen_proyectos: resultado.resumen_proyectos,
        },
      },
    };
  } catch (error) {
    await Promise.allSettled(
      archivosGuardados.map((archivo) =>
        storageService.eliminarArchivo(archivo.ruta_archivo),
      ),
    );

    if (error instanceof RegistroPagosError) {
      return {
        status: 409,
        body: {
          ok: false,
          message: error.message,
        },
      };
    }

    throw error;
  }
}

export async function registrarOperacionEfectivoService(
  usuarioAutenticado: UsuarioSesion,
  operacion: RegistrarOperacionEfectivoInput,
): Promise<ServiceResponse<RegistrarOperacionEfectivoData>> {
  const puedeRegistrar =
    usuarioAutenticado.roles.includes("ADMINISTRADOR") ||
    (usuarioAutenticado.roles.includes("PAGOS") &&
      usuarioAutenticado.permisos.includes("MARCAR_COMO_PAGADO"));

  if (!puedeRegistrar) {
    return {
      status: 403,
      body: {
        ok: false,
        message: "No tiene permisos para registrar pagos.",
      },
    };
  }

  if (operacion.detalles.length === 0) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "Debe seleccionar al menos una solicitud.",
      },
    };
  }

  const ids = operacion.detalles.map((detalle) =>
    detalle.solicitud_id.trim(),
  );

  if (ids.some((id) => !id) || new Set(ids).size !== ids.length) {
    return {
      status: 400,
      body: {
        ok: false,
        message:
          "Cada solicitud debe ser válida y no puede repetirse en el retiro.",
      },
    };
  }

  if (
    !Number.isFinite(operacion.valor_retirado) ||
    operacion.valor_retirado <= 0
  ) {
    return {
      status: 400,
      body: {
        ok: false,
        message:
          "El valor retirado debe ser mayor que cero.",
      },
    };
  }

  const fechaActual = new Date();

  const archivos = [
    operacion.soporte_retiro,
    ...operacion.detalles.map((detalle) => detalle.soporte),
  ];
  const tiposSoportePermitidos = [
    "application/pdf",
    "image/png",
    "image/jpeg",
  ];

  if (
    archivos.some(
      (archivo) =>
        archivo.size <= 0 ||
        archivo.size > 10 * 1024 * 1024 ||
        (archivo.type &&
          !tiposSoportePermitidos.includes(archivo.type)),
    )
  ) {
    return {
      status: 400,
      body: {
        ok: false,
        message:
          "Cada soporte debe ser PDF, PNG, JPG o JPEG, tener contenido y pesar máximo 10 MB.",
      },
    };
  }

  const archivosGuardados: ArchivoGuardado[] = [];

  try {
    for (const archivo of archivos) {
      archivosGuardados.push(
        await storageService.guardarArchivo({
          contenido: Buffer.from(await archivo.arrayBuffer()),
          nombre_original: archivo.name,
          tipo_mime: archivo.type || null,
          carpeta: "solicitudes-pago/operaciones-efectivo",
        }),
      );
    }

    const resultado = await registrarOperacionEfectivoRepository({
      operacion: {
        fecha_retiro: fechaActual,
        valor_retirado: operacion.valor_retirado,
        observacion: operacion.observacion?.trim() || null,
        reintegrar_sobrante: operacion.reintegrar_sobrante,
        soporte_retiro: obtenerMetadatosAdjunto(archivosGuardados[0]),
        detalles: operacion.detalles.map((detalle, indice) => ({
          solicitud_id: detalle.solicitud_id.trim(),
          numero_comprobante:
            detalle.numero_comprobante?.trim() || null,
          observacion: detalle.observacion?.trim() || null,
          soporte: obtenerMetadatosAdjunto(
            archivosGuardados[indice + 1],
          ),
        })),
      },
      usuarioId: usuarioAutenticado.id,
      fechaRegistro: fechaActual,
    });

    return {
      status: 200,
      body: {
        ok: true,
        message:
          operacion.detalles.length === 1
            ? "Retiro y pago registrados correctamente."
            : `Retiro y ${operacion.detalles.length} pagos registrados correctamente.`,
        data: {
          operacion: resultado.operacion,
          solicitudes: resultado.solicitudes.map(convertirSolicitudPago),
        },
      },
    };
  } catch (error) {
    await Promise.allSettled(
      archivosGuardados.map((archivo) =>
        storageService.eliminarArchivo(archivo.ruta_archivo),
      ),
    );

    if (error instanceof RegistroPagosError) {
      return {
        status: 409,
        body: {
          ok: false,
          message: error.message,
        },
      };
    }

    throw error;
  }
}

export async function consultarAprobacionesNivel1Service(
  usuarioAutenticado: UsuarioSesion,
): Promise<ServiceResponse<ConsultarAprobacionesNivel1Data>> {
  if (!usuarioTienePermiso(usuarioAutenticado, "APROBAR_NIVEL_1")) {
    return {
      status: 403,
      body: {
        ok: false,
        message: "No tiene permisos para consultar las aprobaciones.",
      },
    };
  }

  const visibilidad =
    construirVisibilidadSolicitudesPago(usuarioAutenticado);

  const [pendientesNivel1, devueltasDesdeNivel2, historial] = await Promise.all([
    listarSolicitudesPagoRepository({
      filters: { estado_actual: "PENDIENTE_APROBADOR_1" },
      visibilidad,
    }),
    listarSolicitudesPagoRepository({
      filters: { estado_actual: "DEVUELTA_APROBADOR_1" },
      visibilidad,
    }),
    listarSolicitudesAprobadasPorUsuarioRepository({
      nivel: 1,
      usuario_id: usuarioAutenticado.id,
    }),
  ]);
  const solicitudes = [
    ...pendientesNivel1,
    ...devueltasDesdeNivel2,
  ].map(convertirSolicitudPago);

  if (solicitudes.length === 0) {
    return {
      status: 200,
      body: {
        ok: true,
        message: "No existen solicitudes pendientes.",
        data: {
          proyectos: [],
          historial: historial.map(convertirSolicitudPago),
        },
      },
    };
  }

  const fondoIds = [...new Set(solicitudes.map((s) => s.fondo_id))];

  const [fondos, reservas] = await Promise.all([
    obtenerFondosPorIdsRepository(fondoIds),
    obtenerReservasPorFondosRepository(fondoIds),
  ]);

  const reservasPorFondo = new Map(
    reservas.map((r) => [
      r.fondo_id,
      convertirDecimalANumero(r._sum.valor_reservado ?? 0),
    ]),
  );

  const fondosPorId = new Map(fondos.map((f) => [f.id, f]));

  const proyectos = new Map<
    string,
    ProyectoPendienteAprobacionNivel1
  >();

  for (const solicitud of solicitudes) {
    const fondo = fondosPorId.get(solicitud.fondo_id);

    if (!fondo) {
      continue;
    }

    const reservasExistentes =
      reservasPorFondo.get(fondo.id) ?? 0;

    const saldoActual =
      convertirDecimalANumero(fondo.saldo_actual);

    const valorPendiente = solicitud.valor_neto;
    const valorPorReservar =
      solicitud.estado_actual === "DEVUELTA_APROBADOR_1"
        ? 0
        : valorPendiente;

    const saldoDisponible =
      saldoActual - reservasExistentes;

    const saldoProyectado =
      saldoDisponible - valorPorReservar;

    const existente = proyectos.get(fondo.id);

    if (existente) {
      existente.valor_pendiente += valorPendiente;
      existente.saldo_proyectado -= valorPorReservar;
      existente.cantidad_solicitudes += 1;
      existente.solicitudes.push(solicitud);
      continue;
    }

    proyectos.set(fondo.id, {
      proyecto_base_id: solicitud.proyecto_base_id,
      proyecto_base_nombre:
        solicitud.proyecto_base?.nombre ?? "",
      fondo_id: fondo.id,
      saldo_actual: saldoActual,
      reservas_existentes: reservasExistentes,
      saldo_disponible: saldoDisponible,
      valor_pendiente: valorPendiente,
      saldo_proyectado: saldoProyectado,
      cantidad_solicitudes: 1,
      solicitudes: [solicitud],
    });
  }

  return {
    status: 200,
    body: {
      ok: true,
      message: "Aprobaciones consultadas correctamente.",
      data: {
        proyectos: Array.from(proyectos.values()),
        historial: historial.map(convertirSolicitudPago),
      },
    },
  };
}

export async function consultarAprobacionesNivel2Service(
  usuarioAutenticado: UsuarioSesion,
): Promise<ServiceResponse<ConsultarAprobacionesNivel2Data>> {
  if (!usuarioTienePermiso(usuarioAutenticado, "APROBAR_NIVEL_2")) {
    return {
      status: 403,
      body: {
        ok: false,
        message:
          "No tiene permisos para consultar las aprobaciones de nivel 2.",
      },
    };
  }

  const visibilidad =
    construirVisibilidadSolicitudesPago(usuarioAutenticado);

  const [solicitudesPendientes, historial] = await Promise.all([
    listarSolicitudesPagoRepository({
      filters: {
        estado_actual: "PENDIENTE_APROBADOR_2",
      },
      visibilidad,
    }),
    listarSolicitudesAprobadasPorUsuarioRepository({
      nivel: 2,
      usuario_id: usuarioAutenticado.id,
    }),
  ]);
  const solicitudes = solicitudesPendientes.map(convertirSolicitudPago);

  if (solicitudes.length === 0) {
    return {
      status: 200,
      body: {
        ok: true,
        message:
          "No existen solicitudes pendientes de aprobación en nivel 2.",
        data: {
          proyectos: [],
          historial: historial.map(convertirSolicitudPago),
        },
      },
    };
  }

  const fondoIds = [
    ...new Set(
      solicitudes.map((solicitud) => solicitud.fondo_id),
    ),
  ];

  const [fondos, reservas] = await Promise.all([
    obtenerFondosPorIdsRepository(fondoIds),
    obtenerReservasPorFondosRepository(fondoIds),
  ]);

  const reservasPorFondo = new Map(
    reservas.map((reserva) => [
      reserva.fondo_id,
      convertirDecimalANumero(
        reserva._sum.valor_reservado ?? 0,
      ),
    ]),
  );

  const fondosPorId = new Map(
    fondos.map((fondo) => [fondo.id, fondo]),
  );

  const proyectos = new Map<
    string,
    ProyectoPendienteAprobacionNivel2
  >();

  for (const solicitud of solicitudes) {
    const fondo = fondosPorId.get(solicitud.fondo_id);

    if (!fondo) {
      continue;
    }

    const reservasExistentes =
      reservasPorFondo.get(fondo.id) ?? 0;

    const saldoActual =
      convertirDecimalANumero(fondo.saldo_actual);

    const saldoDisponible =
      saldoActual - reservasExistentes;

    const valorPendiente = solicitud.valor_neto;

    const existente = proyectos.get(fondo.id);

    if (existente) {
      existente.valor_pendiente += valorPendiente;
      existente.cantidad_solicitudes += 1;
      existente.solicitudes.push(solicitud);

      continue;
    }

    proyectos.set(fondo.id, {
      proyecto_base_id: solicitud.proyecto_base_id,
      proyecto_base_nombre:
        solicitud.proyecto_base?.nombre ?? "",
      fondo_id: fondo.id,
      saldo_actual: saldoActual,
      reservas_existentes: reservasExistentes,
      saldo_disponible: saldoDisponible,
      valor_pendiente: valorPendiente,
      saldo_proyectado: saldoDisponible,
      cantidad_solicitudes: 1,
      solicitudes: [solicitud],
    });
  }

  return {
    status: 200,
    body: {
      ok: true,
      message:
        "Aprobaciones de nivel 2 consultadas correctamente.",
      data: {
        proyectos: Array.from(proyectos.values()),
        historial: historial.map(convertirSolicitudPago),
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
    ) ||
    (visibilidad.incluir_proyectos_asignados &&
      Boolean(
        await obtenerAccesoActivoUsuarioProyectoRepository(
          usuarioAutenticado.id,
          solicitud.proyecto_base_id,
        ),
      ));

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
    const solicitudConHistorial = convertirSolicitudPago(solicitud);
    const detalleNomina = await obtenerDetalleNominaGrupalService(id);

    if (detalleNomina.body.ok && detalleNomina.body.data) {
      return {
        ...detalleNomina,
        body: {
          ...detalleNomina.body,
          data: {
            solicitud: {
              ...detalleNomina.body.data.solicitud,
              comprobante_pago:
                solicitud.pagos?.soporte ??
                solicitud.detalleOperacionEfectivo?.soporte ??
                null,
              historial: solicitudConHistorial.historial,
            },
          },
        },
      };
    }

    return detalleNomina;
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

export async function obtenerComprobantePagoSolicitudService(
  usuarioAutenticado: UsuarioSesion,
  solicitudId: string,
) {
  const detalle = await obtenerSolicitudPagoPorIdService(
    usuarioAutenticado,
    solicitudId,
  );

  if (!detalle.body.ok) {
    return detalle;
  }

  const archivo = await obtenerComprobantePagoSolicitudRepository(
    solicitudId,
  );

  if (!archivo) {
    return {
      status: 404,
      body: {
        ok: false,
        message: "La solicitud no tiene comprobante de pago.",
      },
    };
  }

  return {
    status: 200,
    body: {
      ok: true,
      message: "Comprobante consultado correctamente.",
      data: archivo,
    },
  };
}

export async function obtenerAdjuntoSolicitudPagoService(
  usuarioAutenticado: UsuarioSesion,
  solicitudId: string,
  adjuntoId: string,
) {
  const detalle = await obtenerSolicitudPagoPorIdService(
    usuarioAutenticado,
    solicitudId,
  );

  if (!detalle.body.ok) {
    return detalle;
  }

  const idAdjunto = normalizarTexto(adjuntoId);

  if (!idAdjunto) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "El identificador del adjunto es obligatorio.",
      },
    };
  }

  const adjunto = await obtenerAdjuntoSolicitudPagoRepository(
    solicitudId,
    idAdjunto,
  );

  if (!adjunto) {
    return {
      status: 404,
      body: {
        ok: false,
        message: "El adjunto no existe o no pertenece a la solicitud.",
      },
    };
  }

  return {
    status: 200,
    body: {
      ok: true,
      message: "Adjunto consultado correctamente.",
      data: adjunto,
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
  const valorRetenciones = obtenerNumeroNoNegativo(input.valor_retenciones);
  const valorDescuentos = obtenerNumeroNoNegativo(input.valor_descuentos);

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
          "Los valores deben ser numéricos y el valor de la factura debe ser mayor a cero.",
      },
    };
  }

  const valorNeto = valorBruto - valorRetenciones - valorDescuentos;

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

  if (
    !esBeneficiarioValidoParaPagoProveedor(
      beneficiario.tipo_beneficiario,
    )
  ) {
    return {
      status: 400,
      body: {
        ok: false,
        message:
          "Para una solicitud de pago a proveedor, el beneficiario debe ser tipo PROVEEDOR u OTRO.",
      },
    };
  }

  const repositoryInput =
    construirSolicitudPagoProveedorRepositoryInput({
      usuarioId: usuarioAutenticado.id,
      fondoId: contexto.data.fondo.id,
      proyectoBaseId,
      centroCostoId,
      beneficiarioId,
      proveedorId: normalizarTextoOpcional(
        beneficiario.proveedor_id,
      ),
      categoriaGasto,
      medioPago,
      descripcion,
      valorBruto,
      valorRetenciones,
      valorDescuentos,
      valorNeto,
    });

  const solicitud =
    await crearSolicitudPagoRepository(repositoryInput);

  return {
    status: 201,
    body: {
      ok: true,
      message: "Borrador de solicitud de pago creado correctamente.",
      data: {
        solicitud: convertirSolicitudPago(solicitud),
      },
    },
  };
}

export async function actualizarSolicitudPagoProveedorService(
  usuarioAutenticado: UsuarioSesion,
  solicitudId: string,
  input: CrearSolicitudPagoProveedorInput,
): Promise<ServiceResponse<{ solicitud: SolicitudPagoListado }>> {
  if (!usuarioTienePermiso(usuarioAutenticado, "CREAR_SOLICITUDES")) {
    return {
      status: 403,
      body: {
        ok: false,
        message: "No tiene permisos para modificar solicitudes.",
      },
    };
  }

  const solicitudEditable = await obtenerSolicitudEditable(
    usuarioAutenticado,
    solicitudId,
  );

  if (!solicitudEditable.ok) {
    return solicitudEditable.response;
  }

  if (
    solicitudEditable.solicitud.tipo_solicitud !==
    "PAGO_PROVEEDOR"
  ) {
    return {
      status: 409,
      body: {
        ok: false,
        message:
          "La solicitud indicada no corresponde a un pago de proveedor.",
      },
    };
  }

  const proyectoBaseId = normalizarTexto(input.proyecto_base_id);
  const centroCostoId = normalizarTexto(input.centro_costo_id);
  const beneficiarioId = normalizarTexto(input.beneficiario_id);
  const categoriaGasto = normalizarTextoDominio(
    input.categoria_gasto,
  );
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

  const valorBruto = obtenerNumeroNoNegativo(
    input.valor_bruto,
    -1,
  );
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
          "Los valores deben ser numéricos y el valor de la factura debe ser mayor a cero.",
      },
    };
  }

  const valorNeto = valorBruto - valorRetenciones - valorDescuentos;

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

  if (
    !esBeneficiarioValidoParaPagoProveedor(
      beneficiario.tipo_beneficiario,
    )
  ) {
    return {
      status: 400,
      body: {
        ok: false,
        message:
          "Para una solicitud de pago a proveedor, el beneficiario debe ser tipo PROVEEDOR u OTRO.",
      },
    };
  }

  const repositoryInput =
    construirSolicitudPagoProveedorRepositoryInput({
      usuarioId:
        solicitudEditable.solicitud.creado_por ??
        usuarioAutenticado.id,
      fondoId: contexto.data.fondo.id,
      proyectoBaseId,
      centroCostoId,
      beneficiarioId,
      proveedorId: normalizarTextoOpcional(
        beneficiario.proveedor_id,
      ),
      categoriaGasto,
      medioPago,
      descripcion,
      valorBruto,
      valorRetenciones,
      valorDescuentos,
      valorNeto,
      numeroSolicitud:
        solicitudEditable.solicitud.numero_solicitud,
      estadoActual: solicitudEditable.solicitud.estado_actual as
        | "BORRADOR"
        | "DEVUELTA_SOLICITANTE",
    });

  const solicitudActualizada =
    await actualizarSolicitudPagoRepository({
      id: solicitudEditable.solicitud.id,
      modificado_por: usuarioAutenticado.id,
      data: repositoryInput,
    });

  return {
    status: 200,
    body: {
      ok: true,
      message:
        "Borrador de solicitud de pago actualizado correctamente.",
      data: {
        solicitud: convertirSolicitudPago(
          solicitudActualizada,
        ),
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
          "Solo un Director, Aprobador nivel 1 autorizado o un Administrador puede crear solicitudes de nómina individual.",
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

  const solicitud = await crearSolicitudPagoRepository({
    numero_solicitud: null,
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
      message: "Borrador de solicitud de nómina individual creado correctamente.",
      data: {
        solicitud: convertirSolicitudPago(solicitud),
      },
    },
  };
}

export async function actualizarSolicitudNominaIndividualService(
  usuarioAutenticado: UsuarioSesion,
  solicitudId: string,
  input: CrearSolicitudNominaIndividualInput,
): Promise<ServiceResponse<{ solicitud: SolicitudPagoListado }>> {
  if (!usuarioPuedeCrearNominaIndividual(usuarioAutenticado)) {
    return {
      status: 403,
      body: {
        ok: false,
        message:
          "Solo un Director, Aprobador nivel 1 autorizado o un Administrador puede modificar solicitudes de nómina individual.",
      },
    };
  }

  const solicitudEditable = await obtenerSolicitudEditable(
    usuarioAutenticado,
    solicitudId,
  );

  if (!solicitudEditable.ok) {
    return solicitudEditable.response;
  }

  if (
    solicitudEditable.solicitud.tipo_solicitud !== "PAGO_NOMINA" ||
    solicitudEditable.solicitud.modalidad_nomina !== "INDIVIDUAL"
  ) {
    return {
      status: 409,
      body: {
        ok: false,
        message:
          "La solicitud indicada no corresponde a una nómina individual.",
      },
    };
  }

  const proyectoBaseId = normalizarTexto(input.proyecto_base_id);
  const centroCostoId = normalizarTexto(input.centro_costo_id);
  const beneficiarioId = normalizarTexto(input.beneficiario_id);
  const conceptoNomina = normalizarTextoDominio(
    input.concepto_nomina,
  );
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

  const valorBruto = obtenerNumeroNoNegativo(
    input.valor_bruto,
    -1,
  );
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

  const valorNeto =
    valorBruto - valorRetenciones - valorDescuentos;

  if (valorNeto < 0) {
    return {
      status: 400,
      body: {
        ok: false,
        message:
          "El valor neto de la nómina no puede ser negativo.",
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

  const duplicado =
    await buscarDuplicadoNominaIndividualRepository({
      proyecto_base_id: proyectoBaseId,
      centro_costo_id: centroCostoId,
      beneficiario_id: beneficiarioId,
      concepto_nomina: conceptoNomina,
      periodo_nomina: periodoNomina,
      excluir_solicitud_id:
        solicitudEditable.solicitud.id,
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

  const solicitudActualizada =
    await actualizarSolicitudPagoRepository({
      id: solicitudEditable.solicitud.id,
      modificado_por: usuarioAutenticado.id,
      data: {
        numero_solicitud:
          solicitudEditable.solicitud.numero_solicitud,
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
        valor_retenciones: valorRetenciones,
        valor_descuentos: valorDescuentos,
        valor_neto: valorNeto,
        estado_actual: solicitudEditable.solicitud.estado_actual as
          | "BORRADOR"
          | "DEVUELTA_SOLICITANTE",
        creado_por:
          solicitudEditable.solicitud.creado_por ??
          usuarioAutenticado.id,
      },
    });

  return {
    status: 200,
    body: {
      ok: true,
      message:
        "Borrador de solicitud de nómina individual actualizado correctamente.",
      data: {
        solicitud: convertirSolicitudPago(
          solicitudActualizada,
        ),
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

  const solicitud = await crearSolicitudPagoRepository({
    numero_solicitud: null,
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
        "Borrador de solicitud de pago de impuesto creado correctamente.",
      data: {
        solicitud: convertirSolicitudPago(solicitud),
      },
    },
  };
}

export async function actualizarSolicitudPagoImpuestoService(
  usuarioAutenticado: UsuarioSesion,
  solicitudId: string,
  input: CrearSolicitudPagoImpuestoInput,
): Promise<ServiceResponse<{ solicitud: SolicitudPagoListado }>> {
  if (!usuarioPuedeCrearSolicitudImpuesto(usuarioAutenticado)) {
    return {
      status: 403,
      body: {
        ok: false,
        message:
          "Solo un Aprobador nivel 1, Director, Auxiliar contable o Administrador puede modificar solicitudes de pago de impuestos.",
      },
    };
  }

  const solicitudEditable = await obtenerSolicitudEditable(
    usuarioAutenticado,
    solicitudId,
  );

  if (!solicitudEditable.ok) {
    return solicitudEditable.response;
  }

  if (
    solicitudEditable.solicitud.tipo_solicitud !==
    "PAGO_IMPUESTO"
  ) {
    return {
      status: 409,
      body: {
        ok: false,
        message:
          "La solicitud indicada no corresponde a un pago de impuesto.",
      },
    };
  }

  const proyectoBaseId = normalizarTexto(
    input.proyecto_base_id,
  );
  const centroCostoId = normalizarTexto(
    input.centro_costo_id,
  );
  const beneficiarioId = normalizarTexto(
    input.beneficiario_id,
  );
  const tipoImpuesto = normalizarTipoImpuesto(
    input.tipo_impuesto,
  );
  const periodoImpuesto = normalizarTexto(
    input.periodo_impuesto,
  );
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

  const errorPeriodo = validarPeriodoImpuesto(
    periodoImpuesto,
  );

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

  const valorBruto = obtenerNumeroNoNegativo(
    input.valor_bruto,
    -1,
  );

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

  const beneficiario =
    await obtenerBeneficiarioActivoRepository(
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

  const solicitudActualizada =
    await actualizarSolicitudPagoRepository({
      id: solicitudEditable.solicitud.id,
      modificado_por: usuarioAutenticado.id,
      data: {
        numero_solicitud:
          solicitudEditable.solicitud.numero_solicitud,
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
        valor_retenciones: 0,
        valor_descuentos: 0,
        valor_neto: valorBruto,
        estado_actual: solicitudEditable.solicitud.estado_actual as
          | "BORRADOR"
          | "DEVUELTA_SOLICITANTE",
        creado_por:
          solicitudEditable.solicitud.creado_por ??
          usuarioAutenticado.id,
      },
    });

  return {
    status: 200,
    body: {
      ok: true,
      message:
        "Borrador de solicitud de pago de impuesto actualizado correctamente.",
      data: {
        solicitud: convertirSolicitudPago(
          solicitudActualizada,
        ),
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
    valorRetenciones === null ||
    valorDescuentos === null
  ) {
    return {
      status: 400,
      body: {
        ok: false,
        message:
          "Impuestos y retenciones, junto con los descuentos, deben ser valores numéricos no negativos.",
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

  const solicitud = await crearSolicitudPagoRepository({
    numero_solicitud: null,
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
        "Borrador de solicitud de reembolso creado correctamente.",
      data: {
        solicitud: convertirSolicitudPago(solicitud),
      },
    },
  };
}

export async function actualizarSolicitudReembolsoService(
  usuarioAutenticado: UsuarioSesion,
  solicitudId: string,
  input: CrearSolicitudReembolsoInput,
): Promise<ServiceResponse<{ solicitud: SolicitudPagoListado }>> {
  if (!usuarioPuedeCrearReembolso(usuarioAutenticado)) {
    return {
      status: 403,
      body: {
        ok: false,
        message:
          "Solo un Solicitante, Director, Auxiliar contable, Aprobador nivel 1 o Administrador puede modificar solicitudes de reembolso.",
      },
    };
  }

  const solicitudEditable = await obtenerSolicitudEditable(
    usuarioAutenticado,
    solicitudId,
  );

  if (!solicitudEditable.ok) {
    return solicitudEditable.response;
  }

  if (
    solicitudEditable.solicitud.tipo_solicitud !==
    "REEMBOLSO"
  ) {
    return {
      status: 409,
      body: {
        ok: false,
        message:
          "La solicitud indicada no corresponde a un reembolso.",
      },
    };
  }

  const proyectoBaseId = normalizarTexto(
    input.proyecto_base_id,
  );
  const centroCostoId = normalizarTexto(
    input.centro_costo_id,
  );
  const beneficiarioId = normalizarTexto(
    input.beneficiario_id,
  );
  const categoriaReembolso =
    normalizarCategoriaReembolso(
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
        message:
          "La categoría de reembolso no es válida.",
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

  const valorBruto = obtenerNumeroNoNegativo(
    input.valor_bruto,
    -1,
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
    valorRetenciones === null ||
    valorDescuentos === null
  ) {
    return {
      status: 400,
      body: {
        ok: false,
        message:
          "Impuestos y retenciones, junto con los descuentos, deben ser valores numéricos no negativos.",
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

  const beneficiario =
    await obtenerBeneficiarioActivoRepository(
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

  const solicitudActualizada =
    await actualizarSolicitudPagoRepository({
      id: solicitudEditable.solicitud.id,
      modificado_por: usuarioAutenticado.id,
      data: {
        numero_solicitud:
          solicitudEditable.solicitud.numero_solicitud,
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
        valor_retenciones: valorRetenciones,
        valor_descuentos: valorDescuentos,
        valor_neto: valorNeto,
        estado_actual: solicitudEditable.solicitud.estado_actual as
          | "BORRADOR"
          | "DEVUELTA_SOLICITANTE",
        creado_por:
          solicitudEditable.solicitud.creado_por ??
          usuarioAutenticado.id,
      },
    });

  return {
    status: 200,
    body: {
      ok: true,
      message:
        "Borrador de solicitud de reembolso actualizado correctamente.",
      data: {
        solicitud: convertirSolicitudPago(
          solicitudActualizada,
        ),
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
  const esAdministrador = usuarioEsAdministrador(usuarioAutenticado);
  const esReenvioAprobador1 =
    solicitud.estado_actual === "DEVUELTA_APROBADOR_1" &&
    (usuarioTienePermiso(usuarioAutenticado, "APROBAR_NIVEL_1") ||
      esAdministrador);

  if (!esPropietario && !esAdministrador && !esReenvioAprobador1) {
    return {
      status: 403,
      body: {
        ok: false,
        message: "Solo el creador de la solicitud o un Administrador puede enviarla.",
      },
    };
  }

  if (solicitud.estado_actual === "DEVUELTA_SOLICITANTE") {
    const resultado = await reenviarSolicitudDevueltaRepository({
      solicitudId: id,
      estadoOrigen: "DEVUELTA_SOLICITANTE",
      estadoDestino: "PENDIENTE_APROBADOR_1",
      fecha: new Date(),
      usuarioId: usuarioAutenticado.id,
    });

    if (resultado.count !== 1) {
      return {
        status: 409,
        body: { ok: false, message: "La solicitud cambió de estado. Actualice la información." },
      };
    }

    const reenviada = await obtenerSolicitudPagoPorIdRepository(id);

    return {
      status: 200,
      body: {
        ok: true,
        message: "Solicitud corregida y reenviada al aprobador de nivel 1.",
        data: { solicitud: convertirSolicitudPago(reenviada!) },
      },
    };
  }

  if (solicitud.estado_actual === "DEVUELTA_APROBADOR_1") {
    const resultado = await reenviarSolicitudDevueltaRepository({
      solicitudId: id,
      estadoOrigen: "DEVUELTA_APROBADOR_1",
      estadoDestino: "PENDIENTE_APROBADOR_2",
      fecha: new Date(),
      usuarioId: usuarioAutenticado.id,
    });

    if (resultado.count !== 1) {
      return {
        status: 409,
        body: { ok: false, message: "La solicitud cambió de estado. Actualice la información." },
      };
    }

    const reenviada = await obtenerSolicitudPagoPorIdRepository(id);

    return {
      status: 200,
      body: {
        ok: true,
        message: "Solicitud reenviada al aprobador de nivel 2.",
        data: { solicitud: convertirSolicitudPago(reenviada!) },
      },
    };
  }

  if (
    solicitud.estado_actual !== "BORRADOR" ||
    solicitud.numero_solicitud !== null
  ) {
    return {
      status: 409,
      body: {
        ok: false,
        message:
          "Solo se pueden enviar borradores que todavía no tengan número de solicitud.",
      },
    };
  }

  const solicitudEnviada = await enviarSolicitudPagoRepository({
    solicitudId: id,
    enviadoEn: new Date(),
    usuarioId: usuarioAutenticado.id,
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

export async function devolverSolicitudPagoService(
  usuarioAutenticado: UsuarioSesion,
  solicitudId: string,
  input: DevolverSolicitudPagoInput,
): Promise<ServiceResponse<DevolverSolicitudPagoData>> {
  const id = normalizarTexto(solicitudId);
  const motivo = normalizarTexto(input.motivo);

  if (!id) {
    return { status: 400, body: { ok: false, message: "El identificador de la solicitud es obligatorio." } };
  }

  if (motivo.length < 5 || motivo.length > 500) {
    return { status: 400, body: { ok: false, message: "El motivo debe tener entre 5 y 500 caracteres." } };
  }

  const solicitud = await obtenerSolicitudPagoPorIdRepository(id);

  if (!solicitud) {
    return { status: 404, body: { ok: false, message: "La solicitud de pago no existe." } };
  }

  const estadoOrigen = solicitud.estado_actual;
  let estadoDestino: "DEVUELTA_APROBADOR_1" | "DEVUELTA_SOLICITANTE";
  let liberarReserva = false;

  if (estadoOrigen === "PENDIENTE_APROBADOR_1") {
    if (!usuarioTienePermiso(usuarioAutenticado, "APROBAR_NIVEL_1")) {
      return { status: 403, body: { ok: false, message: "No tiene permiso para devolver solicitudes de nivel 1." } };
    }
    estadoDestino = "DEVUELTA_SOLICITANTE";
  } else if (estadoOrigen === "PENDIENTE_APROBADOR_2") {
    if (!usuarioTienePermiso(usuarioAutenticado, "APROBAR_NIVEL_2")) {
      return { status: 403, body: { ok: false, message: "No tiene permiso para devolver solicitudes de nivel 2." } };
    }
    estadoDestino = "DEVUELTA_APROBADOR_1";
  } else if (estadoOrigen === "DEVUELTA_APROBADOR_1") {
    if (!usuarioTienePermiso(usuarioAutenticado, "APROBAR_NIVEL_1")) {
      return { status: 403, body: { ok: false, message: "No tiene permiso para gestionar esta devolución." } };
    }
    estadoDestino = "DEVUELTA_SOLICITANTE";
    liberarReserva = true;
  } else {
    return { status: 409, body: { ok: false, message: "La solicitud no se encuentra en un estado que permita devolución." } };
  }

  try {
    await devolverSolicitudPagoRepository({
      solicitudId: id,
      estadoOrigen,
      estadoDestino,
      motivo,
      usuarioId: usuarioAutenticado.id,
      fecha: new Date(),
      liberarReserva,
    });
  } catch (error) {
    if (error instanceof SolicitudesPagoCambioConcurrenteError) {
      return { status: 409, body: { ok: false, message: "La solicitud cambió de estado. Actualice la información." } };
    }
    throw error;
  }

  return {
    status: 200,
    body: {
      ok: true,
      message: estadoDestino === "DEVUELTA_SOLICITANTE"
        ? "Solicitud devuelta al solicitante para corrección."
        : "Solicitud devuelta al aprobador de nivel 1.",
      data: { solicitud_id: id, estado_origen: estadoOrigen, estado_destino: estadoDestino, motivo },
    },
  };
}

export async function devolverSolicitudesPagoService(
  usuarioAutenticado: UsuarioSesion,
  input: DevolverSolicitudesPagoInput,
): Promise<ServiceResponse<DevolverSolicitudesPagoData>> {
  const ids = normalizarIdsSolicitudes(input.solicitud_ids);
  const motivo = normalizarTexto(input.motivo);

  if (ids.ids.length === 0) {
    return { status: 400, body: { ok: false, message: "Debe seleccionar al menos una solicitud." } };
  }

  if (ids.tieneValoresInvalidos || ids.tieneDuplicados) {
    return { status: 400, body: { ok: false, message: "La selección contiene identificadores inválidos o duplicados." } };
  }

  if (motivo.length < 5 || motivo.length > 500) {
    return { status: 400, body: { ok: false, message: "El motivo debe tener entre 5 y 500 caracteres." } };
  }

  const solicitudes = await obtenerSolicitudesPagoPorIdsRepository(ids.ids);

  if (solicitudes.length !== ids.ids.length) {
    return { status: 404, body: { ok: false, message: "Una o más solicitudes seleccionadas no existen." } };
  }

  const esNivel1 = solicitudes.every(
    (solicitud) => solicitud.estado_actual === "PENDIENTE_APROBADOR_1",
  );
  const esNivel2 = solicitudes.every(
    (solicitud) => solicitud.estado_actual === "PENDIENTE_APROBADOR_2",
  );

  if (!esNivel1 && !esNivel2) {
    return { status: 409, body: { ok: false, message: "Todas las solicitudes deben pertenecer al mismo nivel de aprobación." } };
  }

  const permiso = esNivel1 ? "APROBAR_NIVEL_1" : "APROBAR_NIVEL_2";
  if (!usuarioTienePermiso(usuarioAutenticado, permiso)) {
    return { status: 403, body: { ok: false, message: "No tiene permiso para devolver las solicitudes seleccionadas." } };
  }

  const estadoOrigen = esNivel1
    ? "PENDIENTE_APROBADOR_1" as const
    : "PENDIENTE_APROBADOR_2" as const;
  const estadoDestino = esNivel1
    ? "DEVUELTA_SOLICITANTE" as const
    : "DEVUELTA_APROBADOR_1" as const;

  try {
    const resultado = await devolverSolicitudesPagoRepository({
      solicitudes: solicitudes.map((solicitud) => ({
        id: solicitud.id,
        estadoOrigen,
      })),
      estadoDestino,
      motivo,
      usuarioId: usuarioAutenticado.id,
      fecha: new Date(),
    });

    return {
      status: 200,
      body: {
        ok: true,
        message: `${resultado.count} solicitudes fueron devueltas correctamente.`,
        data: {
          cantidad_devuelta: resultado.count,
          estado_destino: estadoDestino,
        },
      },
    };
  } catch (error) {
    if (error instanceof SolicitudesPagoCambioConcurrenteError) {
      return { status: 409, body: { ok: false, message: "Una o más solicitudes cambiaron de estado. Actualice la información." } };
    }
    throw error;
  }
}

export async function anularSolicitudesPagoService(
  usuarioAutenticado: UsuarioSesion,
  input: AnularSolicitudesPagoInput,
): Promise<ServiceResponse<AnularSolicitudesPagoData>> {
  const ids = normalizarIdsSolicitudes(input.solicitud_ids);
  const motivo = normalizarTexto(input.motivo);

  if (ids.ids.length === 0) {
    return { status: 400, body: { ok: false, message: "Debe seleccionar al menos una solicitud." } };
  }

  if (ids.tieneValoresInvalidos || ids.tieneDuplicados) {
    return { status: 400, body: { ok: false, message: "La selección contiene identificadores inválidos o duplicados." } };
  }

  if (motivo.length < 5 || motivo.length > 500) {
    return { status: 400, body: { ok: false, message: "El motivo debe tener entre 5 y 500 caracteres." } };
  }

  if (!usuarioTienePermiso(usuarioAutenticado, "APROBAR_NIVEL_1")) {
    return { status: 403, body: { ok: false, message: "No tiene permiso para anular solicitudes en aprobación de nivel 1." } };
  }

  const solicitudes = await obtenerSolicitudesPagoPorIdsRepository(ids.ids);

  if (solicitudes.length !== ids.ids.length) {
    return { status: 404, body: { ok: false, message: "Una o más solicitudes seleccionadas no existen." } };
  }

  if (solicitudes.some((solicitud) => solicitud.estado_actual !== "PENDIENTE_APROBADOR_1")) {
    return { status: 409, body: { ok: false, message: "Solo pueden anularse solicitudes pendientes de aprobación de nivel 1." } };
  }

  try {
    const resultado = await anularSolicitudesPagoRepository({
      solicitudIds: ids.ids,
      motivo,
      usuarioId: usuarioAutenticado.id,
      fecha: new Date(),
    });

    return {
      status: 200,
      body: {
        ok: true,
        message: resultado.count === 1
          ? "Solicitud anulada correctamente."
          : `${resultado.count} solicitudes fueron anuladas correctamente.`,
        data: {
          cantidad_anulada: resultado.count,
          estado_destino: "ANULADA",
        },
      },
    };
  } catch (error) {
    if (error instanceof SolicitudesPagoCambioConcurrenteError) {
      return { status: 409, body: { ok: false, message: "Una o más solicitudes cambiaron de estado. Actualice la información." } };
    }
    throw error;
  }
}

export async function aprobarSolicitudesNivel1Service(
  usuarioAutenticado: UsuarioSesion,
  input: AprobarSolicitudesNivel1Input,
): Promise<ServiceResponse<AprobarSolicitudesNivel1Data>> {
  if (!usuarioTienePermiso(usuarioAutenticado, "APROBAR_NIVEL_1")) {
    return {
      status: 403,
      body: {
        ok: false,
        message:
          "No tiene permisos para aprobar solicitudes en nivel 1.",
      },
    };
  }

  const resultadoIds = normalizarIdsSolicitudes(
    input.solicitud_ids,
  );

  if (resultadoIds.ids.length === 0) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "Debe seleccionar al menos una solicitud.",
      },
    };
  }

  if (resultadoIds.tieneValoresInvalidos) {
    return {
      status: 400,
      body: {
        ok: false,
        message:
          "Todos los identificadores de solicitudes deben ser textos no vacíos.",
      },
    };
  }

  if (resultadoIds.tieneDuplicados) {
    return {
      status: 400,
      body: {
        ok: false,
        message:
          "La selección contiene identificadores de solicitudes duplicados.",
      },
    };
  }

  const solicitudes =
    await obtenerSolicitudesPagoPorIdsRepository(resultadoIds.ids);

  if (solicitudes.length !== resultadoIds.ids.length) {
    const idsEncontrados = new Set(
      solicitudes.map((solicitud) => solicitud.id),
    );

    const idsNoEncontrados = resultadoIds.ids.filter(
      (id) => !idsEncontrados.has(id),
    );

    return {
      status: 404,
      body: {
        ok: false,
        message: `No existen las siguientes solicitudes de pago: ${idsNoEncontrados.join(
          ", ",
        )}.`,
      },
    };
  }

  const solicitudesEstadoInvalido = solicitudes.filter(
    (solicitud) =>
      solicitud.estado_actual !== "PENDIENTE_APROBADOR_1" &&
      solicitud.estado_actual !== "DEVUELTA_APROBADOR_1",
  );

  if (solicitudesEstadoInvalido.length > 0) {
    const referenciasInvalidas = solicitudesEstadoInvalido.map(
      (solicitud) =>
        `${solicitud.numero_solicitud} (${solicitud.estado_actual})`,
    );

    return {
      status: 409,
      body: {
        ok: false,
        message:
          "Todas las solicitudes deben estar pendientes de nivel 1 o devueltas desde nivel 2. " +
          `Solicitudes no aprobables: ${referenciasInvalidas.join(", ")}.`,
      },
    };
  }

  const reservasExistentes =
    await obtenerReservasPorFondosRepository(
      Array.from(
        new Set(
          solicitudes.map((solicitud) => solicitud.fondo_id),
        ),
      ),
    );

  const reservasPorFondo = new Map<string, number>();

  for (const reserva of reservasExistentes) {
    reservasPorFondo.set(
      reserva.fondo_id,
      Number(reserva._sum.valor_reservado ?? 0),
    );
  }

  const solicitudesAgrupadasPorFondo = new Map<
  string,
  {
    fondo_id: string;
    proyecto_base_id: string;
    proyecto_base_nombre: string;
    saldo_actual: number;
    reservas_existentes: number;
    saldo_disponible: number;
    valor_seleccionado: number;
    valor_nuevo_reservar: number;
    solicitudes: {
      id: string;
      numero_solicitud: string | null;
      valor_neto: number;
    }[];
  }
  >();

  for (const solicitud of solicitudes) {
    const valorNeto = Number(solicitud.valor_neto);
    const valorNuevoReservar =
      solicitud.estado_actual === "DEVUELTA_APROBADOR_1"
        ? 0
        : valorNeto;
    const saldoActual = Number(solicitud.fondo.saldo_actual);
    const reservasExistentes =
      reservasPorFondo.get(solicitud.fondo_id) ?? 0;
    const saldoDisponible = saldoActual - reservasExistentes;

    const grupoExistente = solicitudesAgrupadasPorFondo.get(
      solicitud.fondo_id,
    );

    if (grupoExistente) {
      grupoExistente.valor_seleccionado += valorNeto;
      grupoExistente.valor_nuevo_reservar += valorNuevoReservar;
      grupoExistente.solicitudes.push({
        id: solicitud.id,
        numero_solicitud: solicitud.numero_solicitud,
        valor_neto: valorNeto,
      });

      continue;
    }

    solicitudesAgrupadasPorFondo.set(solicitud.fondo_id, {
      fondo_id: solicitud.fondo_id,
      proyecto_base_id: solicitud.proyecto_base_id,
      proyecto_base_nombre: solicitud.proyecto_base.nombre,
      saldo_actual: saldoActual,
      reservas_existentes: reservasExistentes,
      saldo_disponible: saldoDisponible,
      valor_seleccionado: valorNeto,
      valor_nuevo_reservar: valorNuevoReservar,
      solicitudes: [
        {
          id: solicitud.id,
          numero_solicitud: solicitud.numero_solicitud,
          valor_neto: valorNeto,
        },
      ],
    });
  }

  const gruposConSaldoInsuficiente = Array.from(
    solicitudesAgrupadasPorFondo.values(),
  ).filter(
    (grupo) => grupo.valor_nuevo_reservar > grupo.saldo_disponible,
  );

  if (gruposConSaldoInsuficiente.length > 0) {
    const detalleGrupos = gruposConSaldoInsuficiente.map(
      (grupo) => {
        const numerosSolicitudes = grupo.solicitudes
          .map((solicitud) => solicitud.numero_solicitud)
          .join(", ");

        return (
          `${numerosSolicitudes} del proyecto ` +
          `${grupo.proyecto_base_nombre}`
        );
      },
    );

    return {
      status: 409,
      body: {
        ok: false,
        message:
          `Las solicitudes ${detalleGrupos.join("; ")} ` +
          "no pueden aprobarse porque el saldo disponible es insuficiente. " +
          "Para continuar con las demás solicitudes, deseleccione las " +
          "solicitudes asociadas a los proyectos sin saldo suficiente.",
      },
    };
  }

  const solicitudesConFondoInactivo = solicitudes.filter(
    (solicitud) => !solicitud.fondo.activo,
  );

  if (solicitudesConFondoInactivo.length > 0) {
    const referenciasFondoInactivo = solicitudesConFondoInactivo.map(
      (solicitud) => solicitud.numero_solicitud,
    );

    return {
      status: 409,
      body: {
        ok: false,
        message:
          "No es posible aprobar solicitudes asociadas a fondos inactivos. " +
          `Solicitudes afectadas: ${referenciasFondoInactivo.join(", ")}.`,
      },
    };
  }

  const fechaAprobacion = new Date();

  let resultadoActualizacion: {
    count: number;
  };

  try {
    resultadoActualizacion =
      await aprobarSolicitudesNivel1Repository(
        solicitudes.map((solicitud) => ({
          id: solicitud.id,
          valor_reservado: solicitud.valor_neto,
          estado_origen: solicitud.estado_actual as
            | "PENDIENTE_APROBADOR_1"
            | "DEVUELTA_APROBADOR_1",
        })),
        usuarioAutenticado.id,
        fechaAprobacion,
      );
  } catch (error) {
    if (error instanceof SolicitudesPagoCambioConcurrenteError) {
      return {
        status: 409,
        body: {
          ok: false,
          message:
            "Una o más solicitudes cambiaron de estado durante la aprobación. " +
            "Actualice la información e intente nuevamente.",
        },
      };
    }

    throw error;
  }

  const gruposAprobados = Array.from(
    solicitudesAgrupadasPorFondo.values(),
  ).map((grupo) => ({
    proyecto_base_id: grupo.proyecto_base_id,
    proyecto_base_nombre: grupo.proyecto_base_nombre,
    fondo_id: grupo.fondo_id,
    saldo_actual: grupo.saldo_actual,
    reservas_existentes: grupo.reservas_existentes,
    saldo_disponible: grupo.saldo_disponible,
    valor_seleccionado: grupo.valor_seleccionado,
    saldo_proyectado:
      grupo.saldo_disponible - grupo.valor_nuevo_reservar,
    cantidad_solicitudes: grupo.solicitudes.length,
  }));

  return {
    status: 200,
    body: {
      ok: true,
      message:
        "Las solicitudes fueron aprobadas correctamente en nivel 1.",
      data: {
        cantidad_aprobada: resultadoActualizacion.count,
        solicitudes: solicitudes.map((solicitud) => ({
          id: solicitud.id,
          numero_solicitud: solicitud.numero_solicitud,
          proyecto_base_id: solicitud.proyecto_base_id,
          fondo_id: solicitud.fondo_id,
          valor_neto: Number(solicitud.valor_neto),
          estado_actual: "PENDIENTE_APROBADOR_2",
          aprobado_1_por: usuarioAutenticado.id,
          aprobado_1_en: fechaAprobacion,
        })),
        proyectos: gruposAprobados,
      },
    },
  };
}

export async function aprobarSolicitudesNivel2Service(
  usuarioAutenticado: UsuarioSesion,
  input: AprobarSolicitudesNivel2Input,
): Promise<ServiceResponse<AprobarSolicitudesNivel2Data>> {
  if (!usuarioTienePermiso(usuarioAutenticado, "APROBAR_NIVEL_2")) {
    return {
      status: 403,
      body: {
        ok: false,
        message:
          "No tiene permisos para aprobar solicitudes en nivel 2.",
      },
    };
  }

  const resultadoIds = normalizarIdsSolicitudes(
    input.solicitud_ids,
  );

  if (resultadoIds.ids.length === 0) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "Debe seleccionar al menos una solicitud.",
      },
    };
  }

  if (resultadoIds.tieneValoresInvalidos) {
    return {
      status: 400,
      body: {
        ok: false,
        message:
          "Todos los identificadores de solicitudes deben ser textos no vacíos.",
      },
    };
  }

  if (resultadoIds.tieneDuplicados) {
    return {
      status: 400,
      body: {
        ok: false,
        message:
          "La selección contiene identificadores de solicitudes duplicados.",
      },
    };
  }

  const solicitudes =
    await obtenerSolicitudesPagoPorIdsRepository(
      resultadoIds.ids,
    );

  if (solicitudes.length !== resultadoIds.ids.length) {
    const idsEncontrados = new Set(
      solicitudes.map((solicitud) => solicitud.id),
    );

    const idsNoEncontrados = resultadoIds.ids.filter(
      (id) => !idsEncontrados.has(id),
    );

    return {
      status: 404,
      body: {
        ok: false,
        message: `No existen las siguientes solicitudes de pago: ${idsNoEncontrados.join(", ")}.`,
      },
    };
  }

  const solicitudesEstadoInvalido = solicitudes.filter(
    (solicitud) =>
      solicitud.estado_actual !== "PENDIENTE_APROBADOR_2",
  );

  if (solicitudesEstadoInvalido.length > 0) {
    const referenciasInvalidas = solicitudesEstadoInvalido.map(
      (solicitud) =>
        `${solicitud.numero_solicitud} (${solicitud.estado_actual})`,
    );

    return {
      status: 409,
      body: {
        ok: false,
        message:
          "Todas las solicitudes deben estar en estado PENDIENTE_APROBADOR_2. " +
          `Solicitudes no aprobables: ${referenciasInvalidas.join(", ")}.`,
      },
    };
  }

  const fechaAprobacion = new Date();

  let resultadoActualizacion: {
    count: number;
  };

  try {
    resultadoActualizacion =
      await aprobarSolicitudesNivel2Repository(
        solicitudes.map((solicitud) => solicitud.id),
        usuarioAutenticado.id,
        fechaAprobacion,
      );
  } catch (error) {
    if (error instanceof SolicitudesPagoCambioConcurrenteError) {
      return {
        status: 409,
        body: {
          ok: false,
          message:
            "Una o más solicitudes cambiaron de estado durante la aprobación. " +
            "Actualice la información e intente nuevamente.",
        },
      };
    }

    throw error;
  }

  const reservasExistentes =
  await obtenerReservasPorFondosRepository(
    Array.from(
      new Set(
        solicitudes.map(
          (solicitud) => solicitud.fondo_id,
        ),
      ),
    ),
  );

  const reservasPorFondo = new Map<string, number>();

  for (const reserva of reservasExistentes) {
    reservasPorFondo.set(
      reserva.fondo_id,
      convertirDecimalANumero(
        reserva._sum.valor_reservado ?? 0,
      ),
    );
  }

  const proyectos = new Map<
    string,
    ResumenProyectoAprobacionNivel2
  >();

  for (const solicitud of solicitudes) {
    const existente = proyectos.get(solicitud.fondo_id);

    if (existente) {
      existente.valor_seleccionado +=
        convertirDecimalANumero(solicitud.valor_neto);

      existente.cantidad_solicitudes += 1;

      continue;
    }

    const saldoActual = convertirDecimalANumero(
      solicitud.fondo.saldo_actual,
    );

    const reservasDelFondo =
      reservasPorFondo.get(solicitud.fondo_id) ?? 0;

    const saldoDisponible =
      saldoActual - reservasDelFondo;

    proyectos.set(solicitud.fondo_id, {
      proyecto_base_id: solicitud.proyecto_base_id,
      proyecto_base_nombre:
        solicitud.proyecto_base.nombre,
      fondo_id: solicitud.fondo_id,
      saldo_actual: saldoActual,
      reservas_existentes: reservasDelFondo,
      saldo_disponible: saldoDisponible,
      valor_seleccionado:
        convertirDecimalANumero(solicitud.valor_neto),
      saldo_proyectado: saldoDisponible,
      cantidad_solicitudes: 1,
    });
  }

  return {
    status: 200,
    body: {
      ok: true,
      message:
        "Las solicitudes fueron aprobadas correctamente en nivel 2.",
      data: {
        cantidad_aprobada: resultadoActualizacion.count,
        solicitudes: solicitudes.map((solicitud) => ({
          id: solicitud.id,
          numero_solicitud: solicitud.numero_solicitud,
          proyecto_base_id: solicitud.proyecto_base_id,
          fondo_id: solicitud.fondo_id,
          valor_neto: Number(solicitud.valor_neto),
          estado_actual: "PROGRAMADA_PAGO",
          aprobado_2_por: usuarioAutenticado.id,
          aprobado_2_en: fechaAprobacion,
        })),
        proyectos: Array.from(proyectos.values()),
      },
    },
  };
}
