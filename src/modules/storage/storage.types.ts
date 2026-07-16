export type GuardarArchivoInput = {
  contenido: Buffer;
  nombre_original: string;
  tipo_mime: string | null;
  carpeta: string;
};

export type ArchivoGuardado = {
  nombre_archivo: string;
  nombre_bucket: string;
  ruta_archivo: string;
  ruta_absoluta?: string;
  tipo_mime: string | null;
  tamano_archivo: bigint;
};

export interface StorageProvider {
  guardarArchivo(input: GuardarArchivoInput): Promise<ArchivoGuardado>;
  eliminarArchivo(rutaArchivo: string): Promise<void>;
  obtenerArchivo(rutaArchivo: string): Promise<Buffer>;
}
