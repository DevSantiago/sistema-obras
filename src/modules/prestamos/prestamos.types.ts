import type { ArchivoGuardado } from "@/modules/storage/storage.types";

export type RegistrarPrestamoPersonaInput = {
  proyecto_base_id: string;
  acreedor_id: string;
  valor: number;
  observacion?: string | null;
  soporte: File;
};

export type RegistrarPrestamoPersonaRepositoryInput = Omit<
  RegistrarPrestamoPersonaInput,
  "soporte"
> & {
  fecha_prestamo: Date;
  soporte: ArchivoGuardado;
  usuario_id: string;
  registrado_en: Date;
};

export type PrestamoPersonaRegistrado = {
  id: string;
  referencia_sistema: string;
  proyecto_base_id: string;
  proyecto_nombre: string;
  acreedor_id: string;
  acreedor_nombre: string;
  valor_original: number;
  saldo_pendiente: number;
  saldo_anterior_fondo: number;
  saldo_nuevo_fondo: number;
};

export type RegistrarPrestamoEntreProyectosInput = {
  proyecto_origen_id: string;
  proyecto_destino_id: string;
  valor: number;
  observacion?: string | null;
  soporte: File;
};

export type RegistrarPrestamoEntreProyectosRepositoryInput = Omit<
  RegistrarPrestamoEntreProyectosInput,
  "soporte"
> & {
  soporte: ArchivoGuardado;
  usuario_id: string;
  fecha_operacion: Date;
};

export type PrestamoEntreProyectosRegistrado = {
  id: string;
  referencia_sistema: string;
  proyecto_origen_id: string;
  proyecto_origen_nombre: string;
  proyecto_destino_id: string;
  proyecto_destino_nombre: string;
  valor_original: number;
  saldo_pendiente: number;
  saldo_origen_anterior: number;
  saldo_origen_nuevo: number;
  saldo_destino_anterior: number;
  saldo_destino_nuevo: number;
  fecha_operacion: string;
};

export type PrestamoPendiente = {
  id: string;
  referencia_sistema: string;
  tipo_prestamo: string;
  proyecto_destino_id: string;
  proyecto_destino_nombre: string;
  proyecto_origen_id: string | null;
  proyecto_origen_nombre: string | null;
  acreedor_nombre: string | null;
  valor_original: number;
  saldo_pendiente: number;
  saldo_fondo_destino: number;
  estado: string;
};

export type RegistrarDevolucionPrestamoInput = {
  prestamo_proyecto_id: string;
  valor: number;
  observacion?: string | null;
  soporte: File;
};

export type RegistrarDevolucionPrestamoRepositoryInput = Omit<
  RegistrarDevolucionPrestamoInput,
  "soporte"
> & {
  soporte: ArchivoGuardado;
  usuario_id: string;
  fecha_operacion: Date;
};

export type DevolucionPrestamoRegistrada = {
  id: string;
  referencia_sistema: string;
  prestamo_proyecto_id: string;
  prestamo_referencia: string;
  tipo_prestamo: string;
  valor: number;
  saldo_anterior_prestamo: number;
  saldo_nuevo_prestamo: number;
  estado_prestamo: string;
  saldo_fondo_destino_anterior: number;
  saldo_fondo_destino_nuevo: number;
  saldo_fondo_origen_anterior: number | null;
  saldo_fondo_origen_nuevo: number | null;
  fecha_operacion: string;
};
