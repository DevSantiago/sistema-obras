export type TipoSolicitudPago =
  | "PAGO_PROVEEDOR"
  | "PAGO_NOMINA"
  | "REEMBOLSO"
  | "PAGO_IMPUESTO"
  | "OTRO_PAGO";

export type MedioPagoSolicitud =
  | "TRANSFERENCIA"
  | "CONSIGNACION"
  | "EFECTIVO";

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

export type CrearSolicitudPagoRepositoryInput = {
  numero_solicitud: string;
  tipo_solicitud: "PAGO_PROVEEDOR";
  proyecto_base_id: string;
  fondo_id: string;
  centro_costo_id: string;
  beneficiario_id: string;
  proveedor_id: string | null;
  categoria_gasto: string;
  medio_pago: MedioPagoSolicitud;
  descripcion: string;
  valor_bruto: number;
  valor_impuestos: number;
  valor_retenciones: number;
  valor_descuentos: number;
  valor_neto: number;
  estado_actual: "BORRADOR";
  creado_por: string;
};

export type SolicitudPagoListFilters = {
  tipo_solicitud?: TipoSolicitudPago;
  estado_actual?: EstadoSolicitudPago;
  proyecto_base_id?: string;
  centro_costo_id?: string;
  beneficiario_id?: string;
  medio_pago?: MedioPagoSolicitud;
  busqueda?: string;
};

export type SolicitudPagoListado = {
  id: string;
  numero_solicitud: string;
  tipo_solicitud: TipoSolicitudPago;
  proyecto_base_id: string;
  fondo_id: string;
  centro_costo_id: string;
  beneficiario_id: string | null;
  proveedor_id: string | null;
  categoria_gasto: string | null;
  medio_pago: MedioPagoSolicitud | null;
  descripcion: string;
  valor_bruto: number;
  valor_impuestos: number;
  valor_retenciones: number;
  valor_descuentos: number;
  valor_neto: number;
  estado_actual: EstadoSolicitudPago;
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
    tipo_documento: string;
    numero_documento: string;
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

export type ServiceResponse<T> = {
  status: number;
  body: {
    ok: boolean;
    message: string;
    data?: T;
  };
};