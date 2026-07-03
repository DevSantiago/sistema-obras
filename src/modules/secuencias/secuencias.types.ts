export type TipoSecuenciaDocumental =
  | "SOLICITUD_PAGO"
  | "ANTICIPO"
  | "PRESTAMO_PROYECTO"
  | "DEVOLUCION_PRESTAMO"
  | "MOVIMIENTO_FONDO"
  | "CONFIRMACION_PAGO"
  | "CARGO_FINANCIERO"
  | "OPERACION_EFECTIVO"
  | "IMPUESTO_RETENCION";

export type GenerarSecuenciaInput = {
  tipo_secuencia: TipoSecuenciaDocumental;
  proyecto_base_id?: string | null;
  centro_costo_id?: string | null;
  prefijo?: string;
  anio?: number;
};

export type SecuenciaGenerada = {
  tipo_secuencia: TipoSecuenciaDocumental;
  proyecto_base_id: string | null;
  centro_costo_id: string | null;
  clave_contexto: string;
  prefijo: string;
  anio: number;
  valor: number;
  referencia: string;
};