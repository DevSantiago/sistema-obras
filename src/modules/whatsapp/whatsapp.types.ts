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
