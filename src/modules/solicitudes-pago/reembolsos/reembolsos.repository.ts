import { prisma } from "@/lib/prisma";

export async function eliminarSolicitudReembolsoRepository(
  solicitudId: string,
) {
  return prisma.solicitudes_pago.delete({
    where: {
      id: solicitudId,
    },
  });
}