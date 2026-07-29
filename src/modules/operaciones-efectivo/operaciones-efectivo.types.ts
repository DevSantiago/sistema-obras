export type FiltrosOperacionesEfectivo = {
  proyecto_base_id?: string;
  fondo_id?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
};

export type SoporteOperacionEfectivo = {
  id: string;
  nombre_archivo: string;
  tipo_mime: string | null;
};

export type DetalleOperacionEfectivoConsulta = {
  id: string;
  solicitud_pago_id: string;
  numero_solicitud: string | null;
  tipo_solicitud: string;
  centro_costo_codigo: string;
  centro_costo_nombre: string;
  beneficiario_nombre: string | null;
  medio_pago: string;
  valor_pagado: number;
  numero_comprobante: string | null;
  observacion: string | null;
  soporte: SoporteOperacionEfectivo;
};

export type EstadoSeguimientoOperacionEfectivo =
  | "SIN_SOBRANTE"
  | "SOBRANTE_PENDIENTE_REINGRESO"
  | "SOBRANTE_REINTEGRADO";

export type OperacionEfectivoConsulta = {
  id: string;
  proyecto_base_id: string;
  proyecto_nombre: string;
  fondo_id: string;
  fondo_nombre: string;
  fecha_retiro: string;
  valor_requerido: number;
  valor_retirado: number;
  valor_pagado: number;
  valor_sobrante: number;
  valor_reintegrado: number;
  valor_pendiente_reintegro: number;
  estado_seguimiento: EstadoSeguimientoOperacionEfectivo;
  observacion: string | null;
  registrado_por_nombre: string;
  registrado_en: string;
  soporte_retiro: SoporteOperacionEfectivo;
  detalles: DetalleOperacionEfectivoConsulta[];
};

export type ConsultarOperacionesEfectivoData = {
  operaciones: OperacionEfectivoConsulta[];
};

export type ArchivoOperacionEfectivoDescargable = {
  nombre_archivo: string;
  ruta_archivo: string;
  tipo_mime: string | null;
};
