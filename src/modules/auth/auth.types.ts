export type LoginInput = {
  correo?: string;
  password?: string;
};

export type UsuarioSesion = {
  id: string;
  nombre: string;
  correo: string;
  telefono: string | null;
  estado: string;
  roles: string[];
  permisos: string[];
};

export type ServiceResponse<T> = {
  status: number;
  body: {
    ok: boolean;
    message: string;
    data?: T;
  };
};