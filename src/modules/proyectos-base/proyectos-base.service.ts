import type { UsuarioSesion } from "@/modules/auth/auth.types";
import {
  cambiarEstadoCentroCostoRepository,
  crearProyectoBaseConCentroCostoRepository,
  existeProyectoBasePorNombreRepository,
  listarProyectosBasePorAccesosUsuarioRepository,
  listarProyectosBaseRepository,
  obtenerCentroCostoPorProyectoRepository,
  obtenerProyectoBasePorIdRepository,
} from "./proyectos-base.repository";

import type {
  CentroCostoGenerado,
  CentroCostoInicialInput,
  CrearProyectoBaseInput,
  EstadoCentroCosto,
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

const ESTADOS_CENTRO_COSTO_VALIDOS: EstadoCentroCosto[] = [
  "EN_LICITACION",
  "EN_EJECUCION",
  "FINALIZADO",
];

function normalizarTexto(texto: string) {
  return texto.trim().replace(/\s+/g, " ").toUpperCase();
}

function usuarioEsAdministrador(usuario: UsuarioSesion) {
  return usuario.roles.includes("ADMINISTRADOR");
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

function validarEstadoCentroCosto(
  estadoCentroCosto: string,
): estadoCentroCosto is EstadoCentroCosto {
  return ESTADOS_CENTRO_COSTO_VALIDOS.includes(
    estadoCentroCosto as EstadoCentroCosto,
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

function obtenerEstadoCentroCosto(
  faseCentroCosto: FaseCentroCosto,
): EstadoCentroCosto {
  return faseCentroCosto === "LICITACION" ? "EN_LICITACION" : "EN_EJECUCION";
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

    if (centroCosto.fase_centro_costo !== "LICITACION") {
      throw new Error(
        "Los centros de costo iniciales deben crearse en fase de licitación.",
      );
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
      descripcion: centroCosto.descripcion?.trim() || undefined,
      estado_centro_costo: obtenerEstadoCentroCosto(
        centroCosto.fase_centro_costo,
      ),
    };
  });
}

function validarTransicionCentroCostoPorFase(
  faseCentroCosto: string,
  estadoActual: string,
  estadoNuevo: EstadoCentroCosto,
) {
  if (
    faseCentroCosto === "LICITACION" &&
    estadoActual === "EN_LICITACION" &&
    estadoNuevo === "EN_EJECUCION"
  ) {
    return true;
  }

  if (
    faseCentroCosto === "EJECUCION" &&
    estadoActual === "EN_EJECUCION" &&
    estadoNuevo === "FINALIZADO"
  ) {
    return true;
  }

  return false;
}

export async function listarProyectosBaseService(
  filters: ProyectoBaseListFilters = {},
  usuarioAutenticado?: UsuarioSesion,
) {
  if (!usuarioAutenticado || usuarioEsAdministrador(usuarioAutenticado)) {
    return listarProyectosBaseRepository(filters);
  }

  return listarProyectosBasePorAccesosUsuarioRepository(
    usuarioAutenticado.id,
    filters,
  );
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

type CambiarEstadoCentroCostoInput = {
  estado_centro_costo: EstadoCentroCosto;
  observacion?: string;
  usuario_id: string;
};

export async function cambiarEstadoCentroCostoService(
  proyectoBaseId: string,
  centroCostoId: string,
  input: CambiarEstadoCentroCostoInput,
) {
  if (!proyectoBaseId) {
    throw new Error("El ID del proyecto base es obligatorio.");
  }

  if (!centroCostoId) {
    throw new Error("El ID del centro de costo es obligatorio.");
  }

  if (!input.usuario_id) {
    throw new Error("El usuario que realiza el cambio es obligatorio.");
  }

  if (!validarEstadoCentroCosto(input.estado_centro_costo)) {
    throw new Error("El estado del centro de costo no es válido.");
  }

  const centroCosto = await obtenerCentroCostoPorProyectoRepository(
    proyectoBaseId,
    centroCostoId,
  );

  if (!centroCosto) {
    throw new Error("El centro de costo no existe para este proyecto base.");
  }

  if (centroCosto.estado_centro_costo === input.estado_centro_costo) {
    throw new Error("El centro de costo ya se encuentra en ese estado.");
  }

  const transicionPermitida = validarTransicionCentroCostoPorFase(
    centroCosto.fase_centro_costo,
    centroCosto.estado_centro_costo,
    input.estado_centro_costo,
  );

  if (!transicionPermitida) {
    throw new Error(
      `No se puede cambiar el centro de costo ${centroCosto.prefijo} de ${centroCosto.estado_centro_costo} a ${input.estado_centro_costo}.`,
    );
  }

  return cambiarEstadoCentroCostoRepository(proyectoBaseId, centroCostoId, {
    estado_centro_costo: input.estado_centro_costo,
    observacion: input.observacion?.trim() || undefined,
    usuario_id: input.usuario_id,
  });
}