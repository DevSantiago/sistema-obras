import { prisma } from "@/lib/prisma";

import type { AdjuntoSolicitudPagoRepositoryInput } from "./adjuntos.types";

export async function crearAdjuntosSolicitudPagoRepository(
  adjuntos: AdjuntoSolicitudPagoRepositoryInput[],
) {
  if (adjuntos.length === 0) {
    return {
      count: 0,
    };
  }

  return prisma.adjuntos.createMany({
    data: adjuntos.map((adjunto) => ({
      solicitud_pago_id: adjunto.solicitud_pago_id,
      nombre_archivo: adjunto.nombre_archivo,
      ruta_archivo: adjunto.ruta_archivo,
      nombre_bucket: adjunto.nombre_bucket,
      tipo_mime: adjunto.tipo_mime,
      tamano_archivo: adjunto.tamano_archivo,
      subido_por: adjunto.subido_por,
      estado_ocr: "NO_PROCESADO",
    })),
  });
}