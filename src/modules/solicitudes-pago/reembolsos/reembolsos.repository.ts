import { prisma } from "@/lib/prisma";

export type AdjuntoReembolsoRepositoryInput = {
  solicitud_pago_id: string;
  nombre_archivo: string;
  ruta_archivo: string;
  nombre_bucket: string;
  tipo_mime: string | null;
  tamano_archivo: bigint;
  subido_por: string;
};

export async function crearAdjuntosReembolsoRepository(
  adjuntos: AdjuntoReembolsoRepositoryInput[],
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

export async function eliminarSolicitudReembolsoRepository(
  solicitudId: string,
) {
  return prisma.solicitudes_pago.delete({
    where: {
      id: solicitudId,
    },
  });
}
