import type {
  CategoriaReembolso,
  MedioPagoSolicitud,
  TipoImpuestoSolicitud,
} from "@/modules/solicitudes-pago/solicitudes-pago.types";

export type TipoSolicitudFormulario =
  | "PAGO_PROVEEDOR"
  | "NOMINA_INDIVIDUAL"
  | "NOMINA_GRUPAL"
  | "PAGO_IMPUESTO"
  | "REEMBOLSO";

export type OpcionTipoSolicitud = {
  id: TipoSolicitudFormulario;
  titulo: string;
  descripcion: string;
  habilitado: boolean;
  etiquetaEstado?: string;
};

export type CrearSolicitudProveedorPayload = {
  tipo_solicitud: "PAGO_PROVEEDOR";
  proyecto_base_id: string;
  centro_costo_id: string;
  beneficiario_id: string;
  categoria_gasto: string;
  medio_pago: MedioPagoSolicitud;
  descripcion: string;
  valor_bruto: number;
  valor_impuestos: number;
  valor_retenciones: number;
  valor_descuentos: number;
};

export type CrearSolicitudNominaIndividualPayload = {
  tipo_solicitud: "PAGO_NOMINA";
  modalidad_nomina: "INDIVIDUAL";
  periodo_nomina: string;
  proyecto_base_id: string;
  centro_costo_id: string;
  beneficiario_id: string;
  concepto_nomina: string;
  medio_pago: MedioPagoSolicitud;
  descripcion: string;
  valor_bruto: number;
  valor_retenciones: number;
  valor_descuentos: number;
};

export type CrearSolicitudPagoImpuestoPayload = {
  tipo_solicitud: "PAGO_IMPUESTO";
  proyecto_base_id: string;
  centro_costo_id: string;
  beneficiario_id: string;
  tipo_impuesto: TipoImpuestoSolicitud;
  periodo_impuesto: string;
  medio_pago: MedioPagoSolicitud;
  descripcion: string;
  valor_bruto: number;
};

export type ReembolsoFormularioState = {
  proyecto_base_id: string;
  centro_costo_id: string;
  beneficiario_id: string;
  categoria_reembolso: CategoriaReembolso | "";
  medio_pago: MedioPagoSolicitud | "";
  descripcion: string;
  valor_bruto: string;
  valor_impuestos: string;
  valor_retenciones: string;
  valor_descuentos: string;
  archivos: File[];
};

export type CrearSolicitudFrontendPayload =
  | CrearSolicitudProveedorPayload
  | CrearSolicitudNominaIndividualPayload
  | CrearSolicitudPagoImpuestoPayload;

export type NominaIndividualFormularioState = {
  proyecto_base_id: string;
  centro_costo_id: string;
  beneficiario_id: string;
  periodo_nomina: string;
  concepto_nomina: string;
  medio_pago: MedioPagoSolicitud | "";
  descripcion: string;
  valor_bruto: string;
  valor_retenciones: string;
  valor_descuentos: string;
};

export type PagoImpuestoFormularioState = {
  proyecto_base_id: string;
  centro_costo_id: string;
  beneficiario_id: string;
  tipo_impuesto: TipoImpuestoSolicitud | "";
  periodo_impuesto: string;
  medio_pago: MedioPagoSolicitud | "";
  descripcion: string;
  valor_bruto: string;
};

export type EstadoValidacionNominaGrupal =
  | "VALIDO"
  | "INVALIDO"
  | "PENDIENTE_BENEFICIARIO";

export type ErrorValidacionNominaGrupal = {
  campo: string;
  codigo: string;
  mensaje: string;
};

export type FilaNominaGrupal = {
  numero_fila: number;
  tipo_documento: string;
  numero_documento: string;
  nombre_trabajador: string;
  concepto_nomina: string;
  medio_pago: MedioPagoSolicitud;
  banco: string | null;
  tipo_cuenta_bancaria: string | null;
  numero_cuenta_bancaria: string | null;
  valor_bruto: number;
  valor_retenciones: number;
  valor_descuentos: number;
  valor_neto: number;
};

export type FilaNominaGrupalValidada = FilaNominaGrupal & {
  beneficiario_id: string | null;
  estado_validacion: EstadoValidacionNominaGrupal;
  errores_validacion: ErrorValidacionNominaGrupal[];
};

export type ResumenValidacionNominaGrupal = {
  total_filas: number;
  filas_validas: number;
  filas_invalidas: number;
  filas_pendientes_beneficiario: number;
  valor_bruto_total: number;
  valor_retenciones_total: number;
  valor_descuentos_total: number;
  valor_neto_total: number;
};

export type ValidacionNominaGrupal = {
  filas: FilaNominaGrupalValidada[];
  resumen: ResumenValidacionNominaGrupal;
};

export type NominaGrupalValidacionResponseData = {
  validacion: ValidacionNominaGrupal;
  adjunto_archivo_origen_id: string;
  nombre_archivo: string;
  nombre_hoja: string;
  filas: FilaNominaGrupal[];
};

export type NominaGrupalCreacionResponseData = {
  solicitud?: {
    id: string;
    numero_solicitud: string;
  };
  resumen?: ResumenValidacionNominaGrupal;
  beneficiarios_creados?: unknown[];
};

export type NominaGrupalFormularioState = {
  proyecto_base_id: string;
  centro_costo_id: string;
  periodo_nomina: string;
  descripcion: string;
  archivo: File | null;
};

export const OPCIONES_TIPO_SOLICITUD: OpcionTipoSolicitud[] = [
  {
    id: "PAGO_PROVEEDOR",
    titulo: "Pago a proveedor",
    descripcion:
      "Facturas, cuentas de cobro, materiales, servicios y demás obligaciones con proveedores.",
    habilitado: true,
  },
  {
    id: "NOMINA_INDIVIDUAL",
    titulo: "Nómina individual",
    descripcion:
      "Pago individual de nómina, honorarios u otros conceptos asociados a un trabajador.",
    habilitado: true,
  },
  {
    id: "NOMINA_GRUPAL",
    titulo: "Nómina grupal",
    descripcion:
      "Carga y procesamiento de pagos para varios trabajadores dentro de una misma solicitud.",
    habilitado: true,
  },
  {
    id: "PAGO_IMPUESTO",
    titulo: "Pago de impuestos",
    descripcion:
      "Obligaciones tributarias, retenciones y otros pagos asociados a entidades recaudadoras.",
    habilitado: true,
  },
  {
    id: "REEMBOLSO",
    titulo: "Reembolso",
    descripcion:
      "Devolución de gastos asumidos por ingenieros, directores u otros colaboradores del proyecto.",
    habilitado: true,
  },
];