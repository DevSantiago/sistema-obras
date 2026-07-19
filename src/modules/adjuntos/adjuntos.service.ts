import { storageService } from "@/modules/storage/storage.service";
import type { ArchivoGuardado } from "@/modules/storage/storage.types";

import { crearAdjuntosSolicitudPagoRepository } from "./adjuntos.repository";
import type { AdjuntoSolicitudPagoRepositoryInput } from "./adjuntos.types";

type CrearAdjuntosSolicitudPagoServiceInput = {
  solicitudPagoId: string;
  archivos: File[];
  subidoPor: string;
  carpeta: string;
};

type CrearAdjuntosSolicitudPagoServiceResult = {
  count: number;
  archivos: ArchivoGuardado[];
};

export async function crearAdjuntosSolicitudPagoService(
  input: CrearAdjuntosSolicitudPagoServiceInput,
): Promise<CrearAdjuntosSolicitudPagoServiceResult> {
  if (input.archivos.length === 0) {
    return {
      count: 0,
      archivos: [],
    };
  }

  const archivosGuardados: ArchivoGuardado[] = [];

  try {
    for (const archivo of input.archivos) {
      const contenido = Buffer.from(
        await archivo.arrayBuffer(),
      );

      const archivoGuardado =
        await storageService.guardarArchivo({
          contenido,
          nombre_original: archivo.name,
          tipo_mime: archivo.type || null,
          carpeta: input.carpeta,
        });

      archivosGuardados.push(archivoGuardado);
    }

    const adjuntos: AdjuntoSolicitudPagoRepositoryInput[] =
      archivosGuardados.map((archivo) => ({
        solicitud_pago_id: input.solicitudPagoId,
        nombre_archivo: archivo.nombre_archivo,
        ruta_archivo: archivo.ruta_archivo,
        nombre_bucket: archivo.nombre_bucket,
        tipo_mime: archivo.tipo_mime,
        tamano_archivo: archivo.tamano_archivo,
        subido_por: input.subidoPor,
      }));

    const resultado =
      await crearAdjuntosSolicitudPagoRepository(adjuntos);

    return {
      count: resultado.count,
      archivos: archivosGuardados,
    };
  } catch (error) {
    await Promise.allSettled(
      archivosGuardados.map((archivo) =>
        storageService.eliminarArchivo(
          archivo.ruta_archivo,
        ),
      ),
    );

    throw error;
  }
}