import {
  crearProyectoBaseConCentroCostoRepository,
  existeProyectoBasePorNombreRepository,
  listarProyectosBaseRepository,
  obtenerProyectoBasePorIdRepository,
} from "./proyectos-base.repository";

import type {
  CentroCostoGenerado,
  CentroCostoInicialInput,
  CrearProyectoBaseInput,
  FaseCentroCosto,
  LineaNegocioCentroCosto,
  ProyectoBaseListFilters,
} from "./proyectos-base.types";

const LINEAS_NEGOCIO_VALIDAS: LineaNegocioCentroCosto[] = [
  "OBRA",
  "INTERVENTORIA",
];

const FASES_CENTRO_COSTO_VALIDAS: FaseCentroCosto[] = [
  "LICITACION",
  "EJECUCION",
];

function normalizarTexto(texto: string) {
  return texto.trim().replace(/\s+/g, " ").toUpperCase();
}

function validarLineaNegocio(
  lineaNegocio: string,
): lineaNegocio is LineaNegocioCentroCosto {
  return LINEAS_NEGOCIO_VALIDAS.includes(
    lineaNegocio as LineaNegocioCentroCosto,
  );
}

function validarFaseCentroCosto(
  faseCentroCosto: string,
): faseCentroCosto is FaseCentroCosto {
  return FASES_CENTRO_COSTO_VALIDAS.includes(
    faseCentroCosto as FaseCentroCosto,
  );
}

function obtenerPrefijoCentroCosto(
  lineaNegocio: LineaNegocioCentroCosto,
  faseCentroCosto: FaseCentroCosto,
) {
  if (lineaNegocio === "OBRA" && faseCentroCosto === "LICITACION") {
    return "PRO-OBRA";
  }

  if (lineaNegocio === "OBRA" && faseCentroCosto === "EJECUCION") {
    return "OBRA";
  }

  if (
    lineaNegocio === "INTERVENTORIA" &&
    faseCentroCosto === "LICITACION"
  ) {
    return "PRO-INT";
  }

  return "INT";
}

function validarCentrosCostoIniciales(centrosCosto: CentroCostoInicialInput[]) {
  if (!Array.isArray(centrosCosto) || centrosCosto.length === 0) {
    throw new Error("Debe seleccionar al menos un centro de costo.");
  }

  const combinaciones = new Set<string>();

  centrosCosto.forEach((centroCosto) => {
    if (!validarLineaNegocio(centroCosto.linea_negocio)) {
      throw new Error("La línea de negocio del centro de costo no es válida.");
    }

    if (!validarFaseCentroCosto(centroCosto.fase_centro_costo)) {
      throw new Error("La fase del centro de costo no es válida.");
    }

    const clave = `${centroCosto.linea_negocio}-${centroCosto.fase_centro_costo}`;

    if (combinaciones.has(clave)) {
      throw new Error("No se pueden repetir centros de costo iniciales.");
    }

    combinaciones.add(clave);
  });
}

function generarCentrosCosto(
  nombreProyecto: string,
  centrosCosto: CentroCostoInicialInput[],
): CentroCostoGenerado[] {
  return centrosCosto.map((centroCosto) => {
    const prefijo = obtenerPrefijoCentroCosto(
      centroCosto.linea_negocio,
      centroCosto.fase_centro_costo,
    );

    return {
      linea_negocio: centroCosto.linea_negocio,
      fase_centro_costo: centroCosto.fase_centro_costo,
      prefijo,
      codigo: `${prefijo} - ${nombreProyecto}`,
      nombre: `${prefijo} - ${nombreProyecto}`,
      descripcion: centroCosto.descripcion,
      estado_centro_costo:
        centroCosto.fase_centro_costo === "LICITACION"
          ? "EN_LICITACION"
          : "EN_EJECUCION",
    };
  });
}

export async function listarProyectosBaseService(
  filters: ProyectoBaseListFilters = {},
) {
  return listarProyectosBaseRepository(filters);
}

export async function obtenerProyectoBasePorIdService(id: string) {
  if (!id) {
    throw new Error("El ID del proyecto base es obligatorio.");
  }

  const proyectoBase = await obtenerProyectoBasePorIdRepository(id);

  if (!proyectoBase) {
    throw new Error("El proyecto base no existe.");
  }

  return proyectoBase;
}

export async function crearProyectoBaseService(input: CrearProyectoBaseInput) {
  const nombre = normalizarTexto(input.nombre || "");

  if (!nombre) {
    throw new Error("El nombre del proyecto base es obligatorio.");
  }

  validarCentrosCostoIniciales(input.centros_costo);

  const existeProyecto = await existeProyectoBasePorNombreRepository(nombre);

  if (existeProyecto) {
    throw new Error("Ya existe un proyecto base activo con ese nombre.");
  }

  const centrosCostoGenerados = generarCentrosCosto(
    nombre,
    input.centros_costo,
  );

  return crearProyectoBaseConCentroCostoRepository(
    {
      ...input,
      nombre,
      descripcion: input.descripcion?.trim() || undefined,
    },
    centrosCostoGenerados,
  );
}