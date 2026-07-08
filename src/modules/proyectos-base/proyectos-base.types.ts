export type LineaNegocioCentroCosto = "OBRA" | "INTERVENTORIA";

export type FaseCentroCosto = "LICITACION" | "EJECUCION";

export type EstadoProyectoBase =
  | "EN_LICITACION"
  | "EN_EJECUCION"
  | "FINALIZADO";

export type EstadoCentroCosto =
  | "EN_LICITACION"
  | "EN_EJECUCION"
  | "FINALIZADO";

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

export type AccesoUsuarioProyectoBase = {
  proyecto_base_id: string;
  linea_negocio: LineaNegocioCentroCosto;
};