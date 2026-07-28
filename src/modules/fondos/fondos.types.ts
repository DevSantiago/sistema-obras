export type VisibilidadFondos =
  | { tipo: "TOTAL" }
  | { tipo: "ACCESOS"; usuario_id: string };

export type CentroCostoFondo = {
  id: string;
  codigo: string;
  nombre: string;
  linea_negocio: string;
  fase_centro_costo: string;
  estado_centro_costo: string;
  gasto_acumulado: number;
};

export type ResumenAgrupadoFondo = {
  clave: string;
  gasto_acumulado: number;
};

export type ProyectoFondoGeneral = {
  proyecto_base_id: string;
  proyecto_nombre: string;
  estado_proyecto: string;
  fondo_id: string;
  fondo_nombre: string;
  saldo_actual: number;
  gasto_total_visible: number;
  centros_costo: CentroCostoFondo[];
  gasto_por_linea: ResumenAgrupadoFondo[];
  gasto_por_fase: ResumenAgrupadoFondo[];
};

export type ConsultarFondosData = {
  proyectos: ProyectoFondoGeneral[];
};
