import type {
  MedioPagoSolicitud,
  ServiceResponse,
  SolicitudPagoListado,
} from "../solicitudes-pago.types";

export type EstadoValidacionDetalleNomina =
  | "VALIDO"
  | "INVALIDO"
  | "PENDIENTE_BENEFICIARIO";

export type ErrorValidacionNominaGrupal = {
  campo: string;
  codigo: string;
  mensaje: string;
};

export type FilaExcelNominaGrupalRaw = {
  tipo_documento?: unknown;
  numero_documento?: unknown;
  nombre_trabajador?: unknown;
  concepto_nomina?: unknown;
  medio_pago?: unknown;
  banco?: unknown;
  tipo_cuenta_bancaria?: unknown;
  numero_cuenta_bancaria?: unknown;
  valor_bruto?: unknown;
  valor_retenciones?: unknown;
  valor_descuentos?: unknown;
};

export type FilaNominaGrupalNormalizada = {
  numero_fila: number;
  tipo_documento: string;
  numero_documento: string;
  nombre_trabajador: string;
  concepto_nomina: string;
  medio_pago: MedioPagoSolicitud | "";
  banco: string | null;
  tipo_cuenta_bancaria: string | null;
  numero_cuenta_bancaria: string | null;
  valor_bruto: number;
  valor_retenciones: number;
  valor_descuentos: number;
  valor_neto: number;
};

export type FilaNominaGrupalValidada = FilaNominaGrupalNormalizada & {
  beneficiario_id: string | null;
  estado_validacion: EstadoValidacionDetalleNomina;
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

export type ResultadoLecturaExcelNominaGrupal = {
  nombre_hoja: string;
  filas: FilaNominaGrupalNormalizada[];
};

export type ResultadoValidacionNominaGrupal = {
  filas: FilaNominaGrupalValidada[];
  resumen: ResumenValidacionNominaGrupal;
};

export type CrearNominaGrupalInput = {
  tipo_solicitud?: "PAGO_NOMINA";
  modalidad_nomina?: "AGRUPADA_EXCEL";
  proyecto_base_id?: string;
  centro_costo_id?: string;
  periodo_nomina?: string;
  descripcion?: string;
  adjunto_archivo_origen_id?: string;
  crear_beneficiarios_faltantes?: boolean;
  filas?: FilaNominaGrupalNormalizada[];
};

export type CrearAdjuntoNominaGrupalRepositoryInput = {
  id?: string;
  solicitud_pago_id?: string | null;
  nombre_archivo: string;
  ruta_archivo: string;
  nombre_bucket: string;
  tipo_mime: string | null;
  tamano_archivo: bigint | null;
  subido_por: string;
  estado_ocr: "NO_PROCESADO";
};

export type CrearBeneficiarioNominaGrupalRepositoryInput = {
  tipo_documento: string;
  numero_documento: string;
  nombre: string;
  medio_pago_preferido: MedioPagoSolicitud;
  banco: string | null;
  tipo_cuenta_bancaria: string | null;
  numero_cuenta_bancaria: string | null;
};

export type BeneficiarioCreadoNominaGrupal = {
  id: string;
  tipo_documento: string | null;
  numero_documento: string | null;
  nombre: string;
};

export type CrearDetalleNominaGrupalRepositoryInput = {
  numero_fila: number;
  beneficiario_id: string | null;
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
  estado_validacion: EstadoValidacionDetalleNomina;
  errores_validacion: ErrorValidacionNominaGrupal[] | null;
};

export type CrearSolicitudNominaGrupalRepositoryInput = {
  numero_solicitud: string;
  proyecto_base_id: string;
  fondo_id: string;
  centro_costo_id: string;
  periodo_nomina: string;
  descripcion: string;
  adjunto_archivo_origen_id: string;
  valor_bruto: number;
  valor_retenciones: number;
  valor_descuentos: number;
  valor_neto: number;
  creado_por: string;
  beneficiarios_faltantes: CrearBeneficiarioNominaGrupalRepositoryInput[];
  detalles: CrearDetalleNominaGrupalRepositoryInput[];
};

export type BeneficiarioNominaGrupalRepositoryResult = {
  id: string;
  nombre: string;
  tipo_beneficiario: string;
  tipo_documento: string | null;
  numero_documento: string | null;
  medio_pago_preferido: string | null;
  banco: string | null;
  tipo_cuenta_bancaria: string | null;
  numero_cuenta_bancaria: string | null;
  activo: boolean;
};

export type ClaveDuplicadoNominaGrupal = {
  beneficiario_id: string | null;
  tipo_documento: string;
  numero_documento: string;
  concepto_nomina: string;
};

export type DuplicadoNominaGrupalRepositoryInput = {
  proyecto_base_id: string;
  centro_costo_id: string;
  periodo_nomina: string;
  combinaciones: ClaveDuplicadoNominaGrupal[];
};

export type DuplicadoNominaGrupalRepositoryResult = {
  solicitud_pago_id: string;
  numero_solicitud: string;
  beneficiario_id: string | null;
  tipo_documento: string;
  numero_documento: string;
  concepto_nomina: string;
  periodo_nomina: string;
  estado_actual: string;
};

export type SolicitudNominaGrupalCreada = {
  solicitud: SolicitudPagoListado;
  resumen: ResumenValidacionNominaGrupal;
  beneficiarios_creados: BeneficiarioCreadoNominaGrupal[];
};

export type ValidarNominaGrupalResponse = ServiceResponse<{
  validacion: ResultadoValidacionNominaGrupal;
}>;

export type CrearNominaGrupalResponse =
  ServiceResponse<SolicitudNominaGrupalCreada>;

export const COLUMNAS_OBLIGATORIAS_NOMINA_GRUPAL = [
  "tipo_documento",
  "numero_documento",
  "nombre_trabajador",
  "concepto_nomina",
  "medio_pago",
  "valor_bruto",
] as const;

export const COLUMNAS_OPCIONALES_NOMINA_GRUPAL = [
  "banco",
  "tipo_cuenta_bancaria",
  "numero_cuenta_bancaria",
  "valor_retenciones",
  "valor_descuentos",
] as const;

export type ColumnaObligatoriaNominaGrupal =
  (typeof COLUMNAS_OBLIGATORIAS_NOMINA_GRUPAL)[number];

export type ColumnaOpcionalNominaGrupal =
  (typeof COLUMNAS_OPCIONALES_NOMINA_GRUPAL)[number];

export type ColumnaNominaGrupal =
  | ColumnaObligatoriaNominaGrupal
  | ColumnaOpcionalNominaGrupal;
