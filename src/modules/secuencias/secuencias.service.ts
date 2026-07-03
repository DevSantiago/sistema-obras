import { generarSecuenciaDocumentalRepository } from "./secuencias.repository";
import type {
  GenerarSecuenciaInput,
  SecuenciaGenerada,
  TipoSecuenciaDocumental,
} from "./secuencias.types";

const TIPOS_SECUENCIA_VALIDOS: TipoSecuenciaDocumental[] = [
  "SOLICITUD_PAGO",
  "ANTICIPO",
  "PRESTAMO_PROYECTO",
  "DEVOLUCION_PRESTAMO",
  "MOVIMIENTO_FONDO",
  "CONFIRMACION_PAGO",
  "CARGO_FINANCIERO",
  "OPERACION_EFECTIVO",
  "IMPUESTO_RETENCION",
];

const PREFIJOS_POR_TIPO: Record<TipoSecuenciaDocumental, string> = {
  SOLICITUD_PAGO: "SOL",
  ANTICIPO: "ANT",
  PRESTAMO_PROYECTO: "PRE",
  DEVOLUCION_PRESTAMO: "DEV",
  MOVIMIENTO_FONDO: "MOV",
  CONFIRMACION_PAGO: "PAG",
  CARGO_FINANCIERO: "CAR",
  OPERACION_EFECTIVO: "EFE",
  IMPUESTO_RETENCION: "IMP",
};

function obtenerAnioActual() {
  return new Date().getFullYear();
}

function normalizarTextoOpcional(valor?: string | null) {
  const valorNormalizado = valor?.trim();

  return valorNormalizado ? valorNormalizado : null;
}

function normalizarTipoSecuencia(
  tipoSecuencia: TipoSecuenciaDocumental,
): TipoSecuenciaDocumental {
  return tipoSecuencia.trim().toUpperCase() as TipoSecuenciaDocumental;
}

function normalizarPrefijo(
  tipoSecuencia: TipoSecuenciaDocumental,
  prefijo?: string,
) {
  const prefijoNormalizado = prefijo?.trim().toUpperCase();

  return prefijoNormalizado || PREFIJOS_POR_TIPO[tipoSecuencia];
}

function crearClaveContexto(
  proyectoBaseId: string | null,
  centroCostoId: string | null,
) {
  if (proyectoBaseId && centroCostoId) {
    return `CENTRO:${proyectoBaseId}:${centroCostoId}`;
  }

  if (proyectoBaseId) {
    return `PROYECTO:${proyectoBaseId}`;
  }

  return "GLOBAL";
}

function validarAnio(anio: number) {
  return Number.isInteger(anio) && anio >= 2020 && anio <= 2100;
}

export async function generarSecuenciaDocumentalService(
  input: GenerarSecuenciaInput,
): Promise<SecuenciaGenerada> {
  const tipoSecuencia = normalizarTipoSecuencia(input.tipo_secuencia);

  if (!TIPOS_SECUENCIA_VALIDOS.includes(tipoSecuencia)) {
    throw new Error("El tipo de secuencia documental no es válido.");
  }

  const anio = input.anio ?? obtenerAnioActual();

  if (!validarAnio(anio)) {
    throw new Error("El año de la secuencia documental no es válido.");
  }

  const proyectoBaseId = normalizarTextoOpcional(input.proyecto_base_id);
  const centroCostoId = normalizarTextoOpcional(input.centro_costo_id);

  if (centroCostoId && !proyectoBaseId) {
    throw new Error(
      "Para generar una secuencia por centro de costo debe indicar el proyecto base.",
    );
  }

  const prefijo = normalizarPrefijo(tipoSecuencia, input.prefijo);
  const claveContexto = crearClaveContexto(proyectoBaseId, centroCostoId);

  return generarSecuenciaDocumentalRepository({
    tipo_secuencia: tipoSecuencia,
    proyecto_base_id: proyectoBaseId,
    centro_costo_id: centroCostoId,
    clave_contexto: claveContexto,
    prefijo,
    anio,
  });
}

export async function generarNumeroSolicitudPagoService(input?: {
  proyecto_base_id?: string | null;
  centro_costo_id?: string | null;
  anio?: number;
}) {
  return generarSecuenciaDocumentalService({
    tipo_secuencia: "SOLICITUD_PAGO",
    proyecto_base_id: input?.proyecto_base_id,
    centro_costo_id: input?.centro_costo_id,
    anio: input?.anio,
  });
}