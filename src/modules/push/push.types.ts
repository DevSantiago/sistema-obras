export type SuscripcionPushInput = {
  endpoint?: unknown;
  expirationTime?: unknown;
  keys?: {
    p256dh?: unknown;
    auth?: unknown;
  };
};

export type EstadoSuscripcionesPush = {
  cantidad_dispositivos: number;
  activa_en_este_dispositivo: boolean;
};
