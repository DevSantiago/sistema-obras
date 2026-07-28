import type { ArchivoGuardado } from "@/modules/storage/storage.types";

export type RegistrarPrestamoPersonaInput = {
  proyecto_base_id: string;
  acreedor_id: string;
  valor: number;
  fecha_prestamo: string;
  observacion?: string | null;
  soporte: File;
};

export type RegistrarPrestamoPersonaRepositoryInput = Omit<
  RegistrarPrestamoPersonaInput,
  "fecha_prestamo" | "soporte"
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
