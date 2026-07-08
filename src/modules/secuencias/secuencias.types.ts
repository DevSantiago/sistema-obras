// src/modules/secuencias/secuencias.types.ts

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

  /**
   * Identificador técnico del proyecto base.
   *
   * Se utiliza para construir la clave única de la secuencia,
   * pero no aparece directamente en la referencia documental.
   */
  proyecto_base_id?: string | null;

  /**
   * Identificador técnico del centro de costo.
   *
   * Se utiliza para separar el consecutivo por centro de costo.
   */
  centro_costo_id?: string | null;

  /**
   * Nombre o código visible del proyecto que formará parte
   * de la referencia documental.
   *
   * Ejemplo:
   * HUMAPO
   */
  proyecto_referencia?: string | null;

  /**
   * Código visible del centro de costo que formará parte
   * de la referencia documental.
   *
   * Valores esperados para el flujo actual:
   * - PRO-OBRA
   * - OBRA
   * - PRO-INT
   * - INT
   */
  centro_costo_referencia?: string | null;

  /**
   * Prefijo documental asociado al tipo de secuencia.
   *
   * Ejemplos:
   * - SOL
   * - ANT
   * - PRE
   * - DEV
   */
  prefijo?: string;

  /**
   * Año al que pertenece el consecutivo.
   *
   * Si no se envía, el service utilizará el año actual.
   */
  anio?: number;
};

export type SecuenciaGenerada = {
  tipo_secuencia: TipoSecuenciaDocumental;

  proyecto_base_id: string | null;

  centro_costo_id: string | null;

  /**
   * Clave técnica utilizada para controlar el consecutivo.
   *
   * Ejemplos:
   * - GLOBAL
   * - PROYECTO:<proyecto_base_id>
   * - CENTRO:<proyecto_base_id>:<centro_costo_id>
   */
  clave_contexto: string;

  prefijo: string;

  proyecto_referencia: string | null;

  centro_costo_referencia: string | null;

  anio: number;

  valor: number;

  /**
   * Referencia documental final.
   *
   * Ejemplos:
   * - SOL-PRO-OBRA-HUMAPO-2026-000001
   * - SOL-OBRA-HUMAPO-2026-000001
   * - ANT-HUMAPO-2026-000001
   * - PAG-2026-000001
   */
  referencia: string;
};