// src/modules/secuencias/secuencias.service.ts

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

  return valorNormalizado || null;
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

function normalizarSegmentoReferencia(valor?: string | null) {
  const texto = valor?.trim();

  if (!texto) {
    return null;
  }

  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
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

function validarContextoSecuencia(input: {
  proyecto_base_id: string | null;
  centro_costo_id: string | null;
  proyecto_referencia: string | null;
  centro_costo_referencia: string | null;
}) {
  if (input.centro_costo_id && !input.proyecto_base_id) {
    throw new Error(
      "Para generar una secuencia por centro de costo debe indicar el proyecto base.",
    );
  }

  if (input.proyecto_base_id && !input.proyecto_referencia) {
    throw new Error(
      "Para generar una secuencia por proyecto debe indicar la referencia visible del proyecto.",
    );
  }

  if (input.centro_costo_id && !input.centro_costo_referencia) {
    throw new Error(
      "Para generar una secuencia por centro de costo debe indicar la referencia visible del centro de costo.",
    );
  }

  if (input.proyecto_referencia && !input.proyecto_base_id) {
    throw new Error(
      "No puede indicar una referencia de proyecto sin el identificador del proyecto base.",
    );
  }

  if (input.centro_costo_referencia && !input.centro_costo_id) {
    throw new Error(
      "No puede indicar una referencia de centro de costo sin el identificador del centro de costo.",
    );
  }
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

  const proyectoReferencia = normalizarSegmentoReferencia(
    input.proyecto_referencia,
  );

  const centroCostoReferencia = normalizarSegmentoReferencia(
    input.centro_costo_referencia,
  );

  validarContextoSecuencia({
    proyecto_base_id: proyectoBaseId,
    centro_costo_id: centroCostoId,
    proyecto_referencia: proyectoReferencia,
    centro_costo_referencia: centroCostoReferencia,
  });

  const prefijo = normalizarPrefijo(tipoSecuencia, input.prefijo);

  const claveContexto = crearClaveContexto(
    proyectoBaseId,
    centroCostoId,
  );

  return generarSecuenciaDocumentalRepository({
    tipo_secuencia: tipoSecuencia,
    proyecto_base_id: proyectoBaseId,
    centro_costo_id: centroCostoId,
    proyecto_referencia: proyectoReferencia,
    centro_costo_referencia: centroCostoReferencia,
    clave_contexto: claveContexto,
    prefijo,
    anio,
  });
}

export async function generarNumeroSolicitudPagoService(input: {
  proyecto_base_id: string;
  centro_costo_id: string;
  proyecto_referencia: string;
  centro_costo_referencia: string;
  anio?: number;
}) {
  return generarSecuenciaDocumentalService({
    tipo_secuencia: "SOLICITUD_PAGO",
    proyecto_base_id: input.proyecto_base_id,
    centro_costo_id: input.centro_costo_id,
    proyecto_referencia: input.proyecto_referencia,
    centro_costo_referencia: input.centro_costo_referencia,
    anio: input.anio,
  });
}