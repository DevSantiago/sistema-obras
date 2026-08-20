export type FiltrosOperacionesEfectivo = {
  proyecto_base_id?: string;
  fondo_id?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  solo_pendientes?: boolean;
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
  | "SOBRANTE_REINTEGRADO"
  | "SOBRANTE_AJUSTADO"
  | "ANULADA";

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
  estado_operacion: "ACTIVA" | "AJUSTADA" | "ANULADA";
  observacion: string | null;
  registrado_por_nombre: string;
  registrado_en: string;
  soporte_retiro: SoporteOperacionEfectivo;
  detalles: DetalleOperacionEfectivoConsulta[];
  reingresos: ReingresoSobranteConsulta[];
  correcciones: CorreccionOperacionEfectivoConsulta[];
};

export type ConsultarOperacionesEfectivoData = {
  operaciones: OperacionEfectivoConsulta[];
};

export type ArchivoOperacionEfectivoDescargable = {
  nombre_archivo: string;
  ruta_archivo: string;
  tipo_mime: string | null;
};

export type ReingresoSobranteConsulta = {
  id: string;
  referencia_sistema: string;
  valor: number;
  pendiente_anterior: number;
  pendiente_nuevo: number;
  fecha_reingreso: string;
  observacion: string | null;
  registrado_por_nombre: string;
  soporte: SoporteOperacionEfectivo;
};

export type RegistrarReingresoSobranteInput = {
  operacion_efectivo_id: string;
  valor: number;
  observacion?: string | null;
  soporte: File;
};

export type RegistrarReingresoSobranteRepositoryInput = Omit<
  RegistrarReingresoSobranteInput,
  "soporte"
> & {
  soporte: {
    nombre_archivo: string;
    nombre_bucket: string;
    ruta_archivo: string;
    tipo_mime: string | null;
    tamano_archivo: bigint;
  };
  usuario_id: string;
  fecha_operacion: Date;
};

export type ReingresoSobranteRegistrado = {
  id: string;
  referencia_sistema: string;
  operacion_efectivo_id: string;
  valor: number;
  pendiente_anterior: number;
  pendiente_nuevo: number;
  estado_seguimiento: EstadoSeguimientoOperacionEfectivo;
  saldo_fondo_anterior: number;
  saldo_fondo_nuevo: number;
  fecha_operacion: string;
};

export type TipoCorreccionOperacionEfectivo = "AJUSTE" | "ANULACION";

export type CorreccionOperacionEfectivoConsulta = {
  id: string;
  referencia_sistema: string;
  tipo: TipoCorreccionOperacionEfectivo;
  direccion: "INGRESO" | "EGRESO" | null;
  valor: number | null;
  pendiente_anterior: number | null;
  pendiente_nuevo: number | null;
  motivo: string;
  observacion: string | null;
  registrado_por_nombre: string;
  registrado_en: string;
};

export type RegistrarCorreccionOperacionEfectivoInput = {
  operacion_efectivo_id: string;
  tipo: TipoCorreccionOperacionEfectivo;
  direccion?: "INGRESO" | "EGRESO" | null;
  valor?: number | null;
  motivo: string;
  observacion?: string | null;
};

export type RegistrarCorreccionOperacionEfectivoRepositoryInput =
  RegistrarCorreccionOperacionEfectivoInput & {
    usuario_id: string;
    fecha_operacion: Date;
  };

export type CorreccionOperacionEfectivoRegistrada = {
  id: string;
  referencia_sistema: string;
  tipo: TipoCorreccionOperacionEfectivo;
  direccion: "INGRESO" | "EGRESO" | null;
  valor: number | null;
  pendiente_anterior: number | null;
  pendiente_nuevo: number | null;
  estado_operacion: "AJUSTADA" | "ANULADA";
  saldo_fondo_anterior: number | null;
  saldo_fondo_nuevo: number | null;
  registrado_en: string;
};
