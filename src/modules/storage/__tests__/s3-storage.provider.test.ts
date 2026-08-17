import { beforeEach, describe, expect, it, vi } from "vitest";

const enviar = vi.fn();

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class {
    send = enviar;
  },
  PutObjectCommand: class {
    constructor(public input: unknown) {}
  },
  GetObjectCommand: class {
    constructor(public input: unknown) {}
  },
  DeleteObjectCommand: class {
    constructor(public input: unknown) {}
  },
}));

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { s3StorageProvider } from "../s3-storage.provider";

describe("s3StorageProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AWS_REGION = "us-east-1";
    process.env.AWS_S3_BUCKET = "bucket-pruebas";
    delete process.env.AWS_S3_ENDPOINT;
    delete process.env.AWS_S3_FORCE_PATH_STYLE;
  });

  it("guarda un archivo privado con cifrado en el bucket configurado", async () => {
    enviar.mockResolvedValue({});

    const resultado = await s3StorageProvider.guardarArchivo({
      contenido: Buffer.from("contenido"),
      nombre_original: "Factura José.pdf",
      tipo_mime: "application/pdf",
      carpeta: "solicitudes-pago/solicitud-1",
    });

    const comando = enviar.mock.calls[0][0] as PutObjectCommand;
    expect(comando).toBeInstanceOf(PutObjectCommand);
    expect(comando.input).toMatchObject({
      Bucket: "bucket-pruebas",
      ContentType: "application/pdf",
      ServerSideEncryption: "AES256",
    });
    expect((comando.input as { Key: string }).Key).toMatch(
      /^solicitudes-pago\/solicitud-1\/[0-9a-f-]+-Factura_Jose\.pdf$/,
    );
    expect(resultado).toMatchObject({
      nombre_archivo: "Factura José.pdf",
      nombre_bucket: "bucket-pruebas",
      tipo_mime: "application/pdf",
      tamano_archivo: BigInt(9),
    });
    expect(resultado.ruta_absoluta).toBeUndefined();
  });

  it("obtiene el contenido de un objeto", async () => {
    enviar.mockResolvedValue({
      Body: {
        transformToByteArray: vi
          .fn()
          .mockResolvedValue(Uint8Array.from(Buffer.from("archivo"))),
      },
    });

    const contenido = await s3StorageProvider.obtenerArchivo(
      "solicitudes-pago/solicitud-1/archivo.pdf",
    );

    const comando = enviar.mock.calls[0][0] as GetObjectCommand;
    expect(comando).toBeInstanceOf(GetObjectCommand);
    expect(comando.input).toEqual({
      Bucket: "bucket-pruebas",
      Key: "solicitudes-pago/solicitud-1/archivo.pdf",
    });
    expect(contenido.toString()).toBe("archivo");
  });

  it("elimina un objeto", async () => {
    enviar.mockResolvedValue({});

    await s3StorageProvider.eliminarArchivo(
      "solicitudes-pago/solicitud-1/archivo.pdf",
    );

    const comando = enviar.mock.calls[0][0] as DeleteObjectCommand;
    expect(comando).toBeInstanceOf(DeleteObjectCommand);
    expect(comando.input).toEqual({
      Bucket: "bucket-pruebas",
      Key: "solicitudes-pago/solicitud-1/archivo.pdf",
    });
  });

  it("rechaza configuración incompleta y rutas inseguras", async () => {
    delete process.env.AWS_S3_BUCKET;

    await expect(
      s3StorageProvider.guardarArchivo({
        contenido: Buffer.from("archivo"),
        nombre_original: "archivo.pdf",
        tipo_mime: "application/pdf",
        carpeta: "solicitudes-pago",
      }),
    ).rejects.toThrow("AWS_S3_BUCKET");

    process.env.AWS_S3_BUCKET = "bucket-pruebas";

    await expect(
      s3StorageProvider.obtenerArchivo("../secreto.txt"),
    ).rejects.toThrow("La ruta del archivo en S3 no es válida.");
  });
});
