import { randomUUID } from "node:crypto";
import {
  mkdir,
  readFile,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import type {
  ArchivoGuardado,
  GuardarArchivoInput,
  StorageProvider,
} from "./storage.types";

const RAIZ_RELATIVA = "storage";
const RAIZ_ABSOLUTA = path.join(process.cwd(), "storage");

function normalizarCarpeta(carpeta: string): string {
  const segmentos = carpeta
    .replaceAll("\\", "/")
    .split("/")
    .map((segmento) => segmento.trim())
    .filter(Boolean);

  if (
    segmentos.length === 0 ||
    segmentos.some(
      (segmento) =>
        segmento === "." ||
        segmento === ".." ||
        !/^[a-zA-Z0-9_-]+$/.test(segmento),
    )
  ) {
    throw new Error("La carpeta de almacenamiento no es válida.");
  }

  return segmentos.join("/");
}

function construirNombreSeguro(nombreOriginal: string): string {
  const extension = path.extname(nombreOriginal).toLowerCase();

  const nombreBase = path
    .basename(nombreOriginal, extension)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 100);

  return `${randomUUID()}-${nombreBase || "archivo"}${extension}`;
}

function resolverRutaLocal(rutaArchivo: string): string {
  const rutaNormalizada = rutaArchivo
    .trim()
    .replaceAll("\\", "/");

  if (!rutaNormalizada.startsWith(`${RAIZ_RELATIVA}/`)) {
    throw new Error("La ruta del archivo no pertenece al almacenamiento local.");
  }

  const relativaDesdeRaiz = rutaNormalizada.slice(
    `${RAIZ_RELATIVA}/`.length,
  );

  const rutaAbsoluta = path.join(
    RAIZ_ABSOLUTA,
    ...relativaDesdeRaiz.split("/"),
  );

  const relativaValidada = path.relative(
    RAIZ_ABSOLUTA,
    rutaAbsoluta,
  );

  if (
    relativaValidada.startsWith("..") ||
    path.isAbsolute(relativaValidada)
  ) {
    throw new Error("La ruta del archivo no es válida.");
  }

  return rutaAbsoluta;
}

export const localStorageProvider: StorageProvider = {
  async guardarArchivo(
    input: GuardarArchivoInput,
  ): Promise<ArchivoGuardado> {
    const carpeta = normalizarCarpeta(input.carpeta);
    const nombreFisico = construirNombreSeguro(
      input.nombre_original,
    );

    const directorioAbsoluto = path.join(
      RAIZ_ABSOLUTA,
      ...carpeta.split("/"),
    );

    await mkdir(directorioAbsoluto, {
      recursive: true,
    });

    const rutaAbsoluta = path.join(
      directorioAbsoluto,
      nombreFisico,
    );

    await writeFile(rutaAbsoluta, input.contenido);

    const rutaRelativa = path
      .join(RAIZ_RELATIVA, carpeta, nombreFisico)
      .replaceAll(path.sep, "/");

    return {
      nombre_archivo: input.nombre_original,
      nombre_bucket: "LOCAL",
      ruta_archivo: rutaRelativa,
      ruta_absoluta: rutaAbsoluta,
      tipo_mime: input.tipo_mime,
      tamano_archivo: BigInt(input.contenido.byteLength),
    };
  },

  async eliminarArchivo(rutaArchivo: string): Promise<void> {
    const rutaAbsoluta = resolverRutaLocal(rutaArchivo);

    await unlink(rutaAbsoluta).catch((error: unknown) => {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return;
      }

      throw error;
    });
  },

  async obtenerArchivo(rutaArchivo: string): Promise<Buffer> {
    const rutaAbsoluta = resolverRutaLocal(rutaArchivo);

    return readFile(rutaAbsoluta);
  },
};
