export type DireccionMovimientoFondo = "INGRESO" | "EGRESO";

export type RegistrarMovimientoFondoInput = {
  fondo_id: string;
  proyecto_base_id: string;
  centro_costo_id?: string | null;
  solicitud_pago_id?: string | null;
  pago_id?: string | null;
  operacion_efectivo_id?: string | null;
  tipo_movimiento: string;
  direccion: DireccionMovimientoFondo;
  valor: number;
  referencia_sistema?: string | null;
  descripcion?: string | null;
  registrado_por?: string | null;
  registrado_en: Date;
};

export type MovimientoFondoRegistrado = {
  movimiento_id: string;
  saldo_anterior: number;
  saldo_nuevo: number;
};

