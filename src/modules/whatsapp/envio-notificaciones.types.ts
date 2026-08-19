import type { Prisma } from "@/generated/prisma/client";

export type NotificacionWhatsAppPendiente = {
  id: string;
  telefono_destinatario: string | null;
  plantilla: string | null;
  idioma: string;
  contenido: Prisma.JsonValue;
  estado: string;
  intentos: number;
  actualizado_en: Date;
};

export type ResultadoProcesamientoWhatsApp = {
  revisadas: number;
  enviadas: number;
  fallidas: number;
  omitidas: number;
};
