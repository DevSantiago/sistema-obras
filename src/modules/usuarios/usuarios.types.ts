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
  roles: string[];
};

export type CrearUsuarioInput = {
  tipo_documento?: string;
  numero_documento?: string;
  nombre?: string;
  correo?: string;
  telefono?: string | null;
  password?: string;
  estado?: string;
  roles?: string[];
};

export type ActualizarUsuarioInput = {
  nombre?: string;
  correo?: string;
  telefono?: string | null;
  roles?: string[];
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