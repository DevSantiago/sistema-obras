export type CrearAdjuntoSolicitudPagoRepositoryInput = {
  solicitudPagoId: string;
  nombreArchivo: string;
  rutaArchivo: string;
  nombreBucket: string;
  tipoMime: string | null;
  tamanoArchivo: bigint | null;
  subidoPor: string | null;
};

export type AdjuntoSolicitudPagoRepositoryInput = {
  solicitud_pago_id: string;
  nombre_archivo: string;
  ruta_archivo: string;
  nombre_bucket: string;
  tipo_mime: string | null;
  tamano_archivo: bigint;
  subido_por: string;
};