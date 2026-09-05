import type { Prisma } from "@/generated/prisma/client";
import { crearNotificacionesPushTransicionesRepository } from "@/modules/push/notificaciones-push.repository";
import { crearNotificacionesWhatsAppTransicionesRepository } from "@/modules/whatsapp/notificaciones-whatsapp.repository";
import type { CrearNotificacionesTransicionesInput } from "@/modules/whatsapp/notificaciones-whatsapp.types";

export async function crearNotificacionesTransicionesRepository(
  input: CrearNotificacionesTransicionesInput,
  tx: Prisma.TransactionClient,
) {
  const whatsapp = await crearNotificacionesWhatsAppTransicionesRepository(
    input,
    tx,
  );
  const push = await crearNotificacionesPushTransicionesRepository(input, tx);

  return {
    whatsapp: whatsapp.count,
    push: push.count,
  };
}
