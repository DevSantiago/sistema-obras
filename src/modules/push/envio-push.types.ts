export type NotificacionPushPendiente = {
  id: string;
  solicitud_pago_id: string;
  tipo_evento: string;
  titulo: string;
  mensaje: string;
  enlace: string;
  estado: string;
  intentos: number;
  actualizado_en: Date;
  suscripcion: {
    id: string;
    endpoint: string;
    clave_p256dh: string;
    clave_auth: string;
  };
};

export type ResultadoProcesamientoPush = {
  revisadas: number;
  enviadas: number;
  fallidas: number;
  omitidas: number;
  suscripcionesDesactivadas: number;
};
