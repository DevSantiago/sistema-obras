import type { ArchivoGuardado } from "@/modules/storage/storage.types";

export type RegistrarAnticipoInput = {
  proyecto_base_id: string;
  entidad_id: string;
  valor: number;
  observacion?: string | null;
  soporte: File;
};

export type RegistrarAnticipoRepositoryInput = Omit<
  RegistrarAnticipoInput,
  "soporte"
> & {
  fecha_anticipo: Date;
  soporte: ArchivoGuardado;
  usuario_id: string;
  registrado_en: Date;
};

export type AnticipoRegistrado = {
  id: string;
  referencia_sistema: string;
  proyecto_base_id: string;
  proyecto_nombre: string;
  entidad_nombre: string;
  valor: number;
  fecha_anticipo: string;
  saldo_anterior: number;
  saldo_nuevo: number;
};
