export type LineaNegocioCentroCosto = "OBRA" | "INTERVENTORIA";

export type FaseCentroCosto = "LICITACION" | "EJECUCION";

export type EstadoProyectoBase =
  | "EN_LICITACION"
  | "ADJUDICADO"
  | "NO_ADJUDICADO"
  | "EN_EJECUCION"
  | "FINALIZADO"
  | "CANCELADO";

export type EstadoCentroCosto =
  | "EN_LICITACION"
  | "NO_ADJUDICADO"
  | "ADJUDICADO"
  | "EN_EJECUCION"
  | "FINALIZADO"
  | "CERRADO";

export type CentroCostoInicialInput = {
  linea_negocio: LineaNegocioCentroCosto;
  fase_centro_costo: FaseCentroCosto;
  descripcion?: string;
};

export type CrearProyectoBaseInput = {
  nombre: string;
  descripcion?: string;
  centros_costo: CentroCostoInicialInput[];
  creado_por?: string;
};

export type CentroCostoGenerado = {
  linea_negocio: LineaNegocioCentroCosto;
  fase_centro_costo: FaseCentroCosto;
  prefijo: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  estado_centro_costo: EstadoCentroCosto;
};

export type ProyectoBaseListFilters = {
  estado_proyecto?: EstadoProyectoBase;
  activo?: boolean;
};