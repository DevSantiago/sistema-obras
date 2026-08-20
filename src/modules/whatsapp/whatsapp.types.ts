export type ConfiguracionWebhookWhatsApp = {
  appSecret: string;
  verifyToken: string;
};

export type VerificarWebhookWhatsAppInput = {
  mode: string | null;
  verifyToken: string | null;
  challenge: string | null;
};

export type RecibirWebhookWhatsAppInput = {
  contenido: string;
  firma: string | null;
};

export type EventoWebhookWhatsApp = {
  claveEvento: string;
  metaMensajeId: string | null;
  tipoEvento: "ESTADO" | "MENSAJE" | "NO_RECONOCIDO";
  estadoMeta: string | null;
  telefonoDestinatario: string | null;
  bsuidDestinatario: string | null;
  payload: Record<string, unknown>;
};
