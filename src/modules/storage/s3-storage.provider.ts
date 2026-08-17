import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import path from "node:path";
import type {
  ArchivoGuardado,
  GuardarArchivoInput,
  StorageProvider,
} from "./storage.types";

type S3StorageConfig = {
  bucket: string;
  region: string;
  endpoint?: string;
  forcePathStyle: boolean;
};

let clienteS3: S3Client | null = null;
let configuracionCliente: string | null = null;

function obtenerVariableObligatoria(nombre: string): string {
  const valor = process.env[nombre]?.trim();

  if (!valor) {
    throw new Error(
      `La variable de entorno ${nombre} es obligatoria para usar S3.`,
    );
  }

  return valor;
}

function obtenerConfiguracionS3(): S3StorageConfig {
  return {
    bucket: obtenerVariableObligatoria("AWS_S3_BUCKET"),
    region: obtenerVariableObligatoria("AWS_REGION"),
    endpoint: process.env.AWS_S3_ENDPOINT?.trim() || undefined,
    forcePathStyle:
      process.env.AWS_S3_FORCE_PATH_STYLE?.trim().toLowerCase() ===
      "true",
  };
}

function obtenerClienteS3(config: S3StorageConfig): S3Client {
  const firmaConfiguracion = JSON.stringify({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: config.forcePathStyle,
  });

  if (!clienteS3 || configuracionCliente !== firmaConfiguracion) {
    clienteS3 = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      forcePathStyle: config.forcePathStyle,
    });
    configuracionCliente = firmaConfiguracion;
  }

  return clienteS3;
}

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

function validarClaveObjeto(rutaArchivo: string): string {
  const clave = rutaArchivo.trim().replaceAll("\\", "/");
  const segmentos = clave.split("/");

  if (
    !clave ||
    clave.startsWith("/") ||
    segmentos.some(
      (segmento) =>
        !segmento || segmento === "." || segmento === "..",
    )
  ) {
    throw new Error("La ruta del archivo en S3 no es válida.");
  }

  return clave;
}

export const s3StorageProvider: StorageProvider = {
  async guardarArchivo(
    input: GuardarArchivoInput,
  ): Promise<ArchivoGuardado> {
    const config = obtenerConfiguracionS3();
    const carpeta = normalizarCarpeta(input.carpeta);
    const nombreFisico = construirNombreSeguro(input.nombre_original);
    const clave = `${carpeta}/${nombreFisico}`;

    await obtenerClienteS3(config).send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: clave,
        Body: input.contenido,
        ContentType: input.tipo_mime ?? undefined,
        ServerSideEncryption: "AES256",
      }),
    );

    return {
      nombre_archivo: input.nombre_original,
      nombre_bucket: config.bucket,
      ruta_archivo: clave,
      tipo_mime: input.tipo_mime,
      tamano_archivo: BigInt(input.contenido.byteLength),
    };
  },

  async eliminarArchivo(rutaArchivo: string): Promise<void> {
    const config = obtenerConfiguracionS3();

    await obtenerClienteS3(config).send(
      new DeleteObjectCommand({
        Bucket: config.bucket,
        Key: validarClaveObjeto(rutaArchivo),
      }),
    );
  },

  async obtenerArchivo(rutaArchivo: string): Promise<Buffer> {
    const config = obtenerConfiguracionS3();
    const respuesta = await obtenerClienteS3(config).send(
      new GetObjectCommand({
        Bucket: config.bucket,
        Key: validarClaveObjeto(rutaArchivo),
      }),
    );

    if (!respuesta.Body) {
      throw new Error("El archivo almacenado en S3 no tiene contenido.");
    }

    return Buffer.from(await respuesta.Body.transformToByteArray());
  },
};
