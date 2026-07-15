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


export type EstadoSolicitudPago =
  | "BORRADOR"
  | "PENDIENTE_APROBADOR_1"
  | "PENDIENTE_APROBADOR_2"
  | "DEVUELTA_APROBADOR_1"
  | "DEVUELTA_SOLICITANTE"
  | "PROGRAMADA_PAGO"
  | "PAGADA"
  | "ANULADA";

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
  | CrearSolicitudPagoImpuestoInput;


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

export type CrearSolicitudPagoRepositoryInput =
  | CrearSolicitudPagoProveedorRepositoryInput
  | CrearSolicitudNominaIndividualRepositoryInput
  | CrearSolicitudPagoImpuestoRepositoryInput;

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
  categoria_reembolso: string | null;
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