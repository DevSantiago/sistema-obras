export type TipoSolicitudPago =
  | "PAGO_PROVEEDOR"
  | "PAGO_NOMINA"
  | "REEMBOLSO"
  | "PAGO_IMPUESTO"
  | "OTRO_PAGO";

export type ModalidadNomina =
  | "INDIVIDUAL"
  | "AGRUPADA_EXCEL";

export type MedioPagoSolicitud =
  | "TRANSFERENCIA"
  | "CONSIGNACION"
  | "EFECTIVO";

export const TIPOS_IMPUESTO_SOLICITUD = [
  "IVA",
  "RENTA",
  "RETEFUENTE",
  "RETEIVA",
  "RETEICA",
  "ICA",
  "ESTAMPILLA",
  "IMPUESTO_CONSUMO",
  "OTRO",
] as const;

export type TipoImpuestoSolicitud =
  (typeof TIPOS_IMPUESTO_SOLICITUD)[number];


export const CATEGORIAS_REEMBOLSO = [
  "TRANSPORTE",
  "ALIMENTACION",
  "ALOJAMIENTO",
  "PEAJES",
  "COMBUSTIBLE",
  "PAPELERIA",
  "COMPRA_MENOR",
  "SERVICIO",
  "OTRO",
] as const;

export type CategoriaReembolso =
  (typeof CATEGORIAS_REEMBOLSO)[number];

export type EstadoSolicitudPago =
  | "BORRADOR"
  | "PENDIENTE_APROBADOR_1"
  | "PENDIENTE_APROBADOR_2"
  | "DEVUELTA_APROBADOR_1"
  | "DEVUELTA_SOLICITANTE"
  | "PROGRAMADA_PAGO"
  | "PAGADA"
  | "ANULADA";


export type AprobarSolicitudesNivel1Input = {
  solicitud_ids?: string[];
};

export type SolicitudAprobadaNivel1 = {
  id: string;
  numero_solicitud: string;
  proyecto_base_id: string;
  fondo_id: string;
  valor_neto: number;
  estado_actual: "PENDIENTE_APROBADOR_2";
  aprobado_1_por: string;
  aprobado_1_en: string | Date;
};

export type ResumenProyectoAprobacionNivel1 = {
  proyecto_base_id: string;
  proyecto_base_nombre: string;
  fondo_id: string;
  saldo_actual: number;
  reservas_existentes: number;
  saldo_disponible: number;
  valor_seleccionado: number;
  saldo_proyectado: number;
  cantidad_solicitudes: number;
};

export type AprobarSolicitudesNivel1Data = {
  cantidad_aprobada: number;
  solicitudes: SolicitudAprobadaNivel1[];
  proyectos: ResumenProyectoAprobacionNivel1[];
};

export type ProyectoPendienteAprobacionNivel1 = {
  proyecto_base_id: string;
  proyecto_base_nombre: string;
  fondo_id: string;
  saldo_actual: number;
  reservas_existentes: number;
  saldo_disponible: number;
  valor_pendiente: number;
  saldo_proyectado: number;
  cantidad_solicitudes: number;
  solicitudes: SolicitudPagoListado[];
};

export type ConsultarAprobacionesNivel1Data = {
  proyectos: ProyectoPendienteAprobacionNivel1[];
};

export type AprobarSolicitudesNivel2Input = {
  solicitud_ids?: string[];
};

export type SolicitudAprobadaNivel2 = {
  id: string;
  numero_solicitud: string;
  proyecto_base_id: string;
  fondo_id: string;
  valor_neto: number;
  estado_actual: "PROGRAMADA_PAGO";
  aprobado_2_por: string;
  aprobado_2_en: string | Date;
};

export type ResumenProyectoAprobacionNivel2 = {
  proyecto_base_id: string;
  proyecto_base_nombre: string;
  fondo_id: string;
  saldo_actual: number;
  reservas_existentes: number;
  saldo_disponible: number;
  valor_seleccionado: number;
  saldo_proyectado: number;
  cantidad_solicitudes: number;
};

export type AprobarSolicitudesNivel2Data = {
  cantidad_aprobada: number;
  solicitudes: SolicitudAprobadaNivel2[];
  proyectos: ResumenProyectoAprobacionNivel2[];
};

export type ProyectoPendienteAprobacionNivel2 = {
  proyecto_base_id: string;
  proyecto_base_nombre: string;
  fondo_id: string;
  saldo_actual: number;
  reservas_existentes: number;
  saldo_disponible: number;
  valor_pendiente: number;
  saldo_proyectado: number;
  cantidad_solicitudes: number;
  solicitudes: SolicitudPagoListado[];
};

export type ConsultarAprobacionesNivel2Data = {
  proyectos: ProyectoPendienteAprobacionNivel2[];
};

export type CrearSolicitudReembolsoInput = {
  tipo_solicitud?: "REEMBOLSO";
  proyecto_base_id?: string;
  centro_costo_id?: string;
  beneficiario_id?: string;
  categoria_reembolso?: CategoriaReembolso;
  medio_pago?: MedioPagoSolicitud;
  descripcion?: string;
  valor_bruto?: number;
  valor_impuestos?: number;
  valor_retenciones?: number;
  valor_descuentos?: number;
};

export type CrearSolicitudPagoProveedorInput = {
  tipo_solicitud?: "PAGO_PROVEEDOR";
  proyecto_base_id?: string;
  centro_costo_id?: string;
  beneficiario_id?: string;
  categoria_gasto?: string;
  medio_pago?: MedioPagoSolicitud;
  descripcion?: string;
  valor_bruto?: number;
  valor_impuestos?: number;
  valor_retenciones?: number;
  valor_descuentos?: number;
};

export type CrearSolicitudNominaIndividualInput = {
  tipo_solicitud?: "PAGO_NOMINA";
  modalidad_nomina?: "INDIVIDUAL";
  periodo_nomina?: string;
  proyecto_base_id?: string;
  centro_costo_id?: string;
  beneficiario_id?: string;
  concepto_nomina?: string;
  medio_pago?: MedioPagoSolicitud;
  descripcion?: string;
  valor_bruto?: number;
  valor_retenciones?: number;
  valor_descuentos?: number;
};

export type CrearSolicitudPagoImpuestoInput = {
  tipo_solicitud?: "PAGO_IMPUESTO";
  proyecto_base_id?: string;
  centro_costo_id?: string;
  beneficiario_id?: string;
  tipo_impuesto?: TipoImpuestoSolicitud;
  periodo_impuesto?: string;
  medio_pago?: MedioPagoSolicitud;
  descripcion?: string;
  valor_bruto?: number;
};

export type CrearSolicitudPagoInput =
  | CrearSolicitudPagoProveedorInput
  | CrearSolicitudNominaIndividualInput
  | CrearSolicitudPagoImpuestoInput
  | CrearSolicitudReembolsoInput;


type CrearSolicitudPagoRepositoryBaseInput = {
  numero_solicitud: string;
  proyecto_base_id: string;
  fondo_id: string;
  centro_costo_id: string;
  beneficiario_id: string | null;
  proveedor_id: string | null;
  categoria_gasto: string | null;
  categoria_reembolso: string | null;
  modalidad_nomina: ModalidadNomina | null;
  periodo_nomina: string | null;
  concepto_nomina: string | null;
  tipo_impuesto: TipoImpuestoSolicitud | null;
  periodo_impuesto: string | null;
  medio_pago: MedioPagoSolicitud | null;
  adjunto_archivo_origen_id: string | null;
  descripcion: string;
  valor_bruto: number;
  valor_impuestos: number;
  valor_retenciones: number;
  valor_descuentos: number;
  valor_neto: number;
  estado_actual: "BORRADOR";
  creado_por: string;
};

export type CrearSolicitudPagoProveedorRepositoryInput =
  CrearSolicitudPagoRepositoryBaseInput & {
    tipo_solicitud: "PAGO_PROVEEDOR";
    beneficiario_id: string;
    proveedor_id: string | null;
    categoria_gasto: string;
    categoria_reembolso: null;
    modalidad_nomina: null;
    periodo_nomina: null;
    concepto_nomina: null;
    tipo_impuesto: null;
    periodo_impuesto: null;
    medio_pago: MedioPagoSolicitud;
    adjunto_archivo_origen_id: null;
  };

export type CrearSolicitudNominaIndividualRepositoryInput =
  CrearSolicitudPagoRepositoryBaseInput & {
    tipo_solicitud: "PAGO_NOMINA";
    beneficiario_id: string;
    proveedor_id: null;
    categoria_gasto: null;
    categoria_reembolso: null;
    modalidad_nomina: "INDIVIDUAL";
    periodo_nomina: string;
    concepto_nomina: string;
    tipo_impuesto: null;
    periodo_impuesto: null;
    medio_pago: MedioPagoSolicitud;
    adjunto_archivo_origen_id: null;
  };

export type CrearSolicitudPagoImpuestoRepositoryInput =
CrearSolicitudPagoRepositoryBaseInput & {
  tipo_solicitud: "PAGO_IMPUESTO";
  beneficiario_id: string;
  proveedor_id: null;
  categoria_gasto: null;
  categoria_reembolso: null;
  modalidad_nomina: null;
  periodo_nomina: null;
  concepto_nomina: null;
  tipo_impuesto: TipoImpuestoSolicitud;
  periodo_impuesto: string;
  medio_pago: MedioPagoSolicitud;
  adjunto_archivo_origen_id: null;
};

export type CrearSolicitudReembolsoRepositoryInput =
  CrearSolicitudPagoRepositoryBaseInput & {
    tipo_solicitud: "REEMBOLSO";
    beneficiario_id: string;
    proveedor_id: null;
    categoria_gasto: null;
    categoria_reembolso: CategoriaReembolso;
    modalidad_nomina: null;
    periodo_nomina: null;
    concepto_nomina: null;
    tipo_impuesto: null;
    periodo_impuesto: null;
    medio_pago: MedioPagoSolicitud;
    adjunto_archivo_origen_id: null;
  };

export type CrearSolicitudPagoRepositoryInput =
  | CrearSolicitudPagoProveedorRepositoryInput
  | CrearSolicitudNominaIndividualRepositoryInput
  | CrearSolicitudPagoImpuestoRepositoryInput
  | CrearSolicitudReembolsoRepositoryInput;

export type BuscarDuplicadoNominaIndividualInput = {
  proyecto_base_id: string;
  centro_costo_id: string;
  beneficiario_id: string;
  concepto_nomina: string;
  periodo_nomina: string;
};

export type SolicitudPagoListFilters = {
  tipo_solicitud?: TipoSolicitudPago;
  modalidad_nomina?: ModalidadNomina;
  periodo_nomina?: string;
  estado_actual?: EstadoSolicitudPago;
  proyecto_base_id?: string;
  centro_costo_id?: string;
  beneficiario_id?: string;
  medio_pago?: MedioPagoSolicitud;
  tipo_impuesto?: TipoImpuestoSolicitud;
  periodo_impuesto?: string;
  categoria_reembolso?: CategoriaReembolso;
  busqueda?: string;
};

export type VisibilidadSolicitudesPago = {
  consultar_todas: boolean;
  usuario_id: string;
  incluir_propias: boolean;
  estados_flujo: EstadoSolicitudPago[];
};

export type SolicitudPagoListado = {
  id: string;
  numero_solicitud: string;
  tipo_solicitud: TipoSolicitudPago;
  modalidad_nomina: ModalidadNomina | null;
  periodo_nomina: string | null;
  proyecto_base_id: string;
  fondo_id: string;
  centro_costo_id: string;
  beneficiario_id: string | null;
  proveedor_id: string | null;
  categoria_gasto: string | null;
  categoria_reembolso: CategoriaReembolso | null;
  concepto_nomina: string | null;
  tipo_impuesto: TipoImpuestoSolicitud | null;
  periodo_impuesto: string | null;
  medio_pago: MedioPagoSolicitud | null;
  adjunto_archivo_origen_id: string | null;
  descripcion: string;
  valor_bruto: number;
  valor_impuestos: number;
  valor_retenciones: number;
  valor_descuentos: number;
  valor_neto: number;
  estado_actual: EstadoSolicitudPago;
  creado_por: string | null;
  enviado_en: string | Date | null;
  creado_en: string | Date;
  actualizado_en: string | Date;
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

export type UsuarioSesionSolicitudesPago = {
  id: string;
  nombre: string;
  correo: string;
  roles: string[];
  permisos?: string[];
};

export type CentroCostoSolicitudCatalogo = {
  id: string;
  nombre: string;
  linea_negocio: string;
  fase_centro_costo: string;
  estado_centro_costo: string;
  activo?: boolean;
};

export type ProyectoBaseSolicitudCatalogo = {
  id: string;
  nombre: string;
  estado_proyecto: string;
  activo?: boolean;
  centros_costo?: CentroCostoSolicitudCatalogo[];
  centrosCosto?: CentroCostoSolicitudCatalogo[];
};

export type BeneficiarioSolicitudCatalogo = {
  id: string;
  tipo_beneficiario: string;
  nombre: string;
  tipo_documento: string | null;
  numero_documento: string | null;
  medio_pago_preferido?: MedioPagoSolicitud | null;
  activo?: boolean;
};

export type SolicitudPagoFormularioState = {
  proyecto_base_id: string;
  centro_costo_id: string;
  beneficiario_id: string;
  categoria_gasto: string;
  medio_pago: MedioPagoSolicitud | "";
  descripcion: string;
  valor_bruto: string;
  valor_impuestos: string;
  valor_retenciones: string;
  valor_descuentos: string;
};

export type SolicitudesPagoApiResponse<T> = {
  ok: boolean;
  message?: string;
  data?: T;
};

export type ProyectosBaseSolicitudResponseData =
  | ProyectoBaseSolicitudCatalogo[]
  | {
      proyectos?: ProyectoBaseSolicitudCatalogo[];
    };

export type BeneficiariosSolicitudResponseData =
  | BeneficiarioSolicitudCatalogo[]
  | {
      beneficiarios?: BeneficiarioSolicitudCatalogo[];
    };

export type SolicitudesPagoResponseData = {
  solicitudes?: SolicitudPagoListado[];
  solicitud?: SolicitudPagoListado;
};

export type ServiceResponse<T> = {
  status: number;
  body: {
    ok: boolean;
    message: string;
    data?: T;
  };
};