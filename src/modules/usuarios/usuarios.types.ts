export type LineaNegocioAcceso = "OBRA" | "INTERVENTORIA";

export type AccesoUsuarioInput = {
  proyecto_base_id: string;
  linea_negocio: LineaNegocioAcceso;
};

export type AccesoUsuarioListado = {
  id: string;
  proyecto_base_id: string;
  proyecto_nombre: string;
  linea_negocio: LineaNegocioAcceso;
  activo: boolean;
  asignado_en: Date;
};

export type UsuarioListado = {
  id: string;
  tipo_documento: string;
  numero_documento: string;
  nombre: string;
  correo: string;
  telefono: string | null;
  estado: string;
  creado_en: Date;
  actualizado_en: Date;
  rol: string;
  accesos: AccesoUsuarioListado[];
};

export type CrearUsuarioInput = {
  tipo_documento?: string;
  numero_documento?: string;
  nombre?: string;
  correo?: string;
  telefono?: string | null;
  password?: string;
  estado?: string;
  rol?: string;
  accesos?: AccesoUsuarioInput[];
};

export type ActualizarUsuarioInput = {
  nombre?: string;
  correo?: string;
  telefono?: string | null;
  rol?: string;
  accesos?: AccesoUsuarioInput[];
};

export type CambiarEstadoUsuarioInput = {
  estado?: "ACTIVO" | "INACTIVO";
};

export type ServiceResponse<T> = {
  status: number;
  body: {
    ok: boolean;
    message: string;
    data?: T;
  };
};
