import { beforeEach, describe, expect, it, vi } from "vitest";

import { storageService } from "@/modules/storage/storage.service";

import { crearAdjuntosSolicitudPagoRepository } from "../adjuntos.repository";
import { crearAdjuntosSolicitudPagoService } from "../adjuntos.service";

vi.mock("@/modules/storage/storage.service", () => ({
  storageService: {
    guardarArchivo: vi.fn(),
    eliminarArchivo: vi.fn(),
  },
}));

vi.mock("../adjuntos.repository", () => ({
  crearAdjuntosSolicitudPagoRepository: vi.fn(),
}));

function crearArchivoPrueba(
  nombre: string,
  contenido: string,
  tipoMime = "application/pdf",
): File {
  const buffer = Buffer.from(contenido);

  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  );

  return {
    name: nombre,
    type: tipoMime,
    size: buffer.byteLength,
    arrayBuffer: vi.fn().mockResolvedValue(arrayBuffer),
  } as unknown as File;
}

describe("adjuntos.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe retornar count cero cuando no se reciben archivos", async () => {
    const resultado = await crearAdjuntosSolicitudPagoService({
      solicitudPagoId: "solicitud-1",
      archivos: [],
      subidoPor: "usuario-1",
      carpeta: "solicitudes-pago/solicitud-1",
    });

    expect(resultado).toEqual({
      count: 0,
      archivos: [],
    });

    expect(storageService.guardarArchivo).not.toHaveBeenCalled();
    expect(
      crearAdjuntosSolicitudPagoRepository,
    ).not.toHaveBeenCalled();
  });

  it("debe guardar los archivos y registrar los adjuntos", async () => {
    const archivo = crearArchivoPrueba(
      "factura.pdf",
      "contenido de prueba",
    );

    vi.mocked(storageService.guardarArchivo).mockResolvedValue({
      nombre_archivo: "factura-uuid.pdf",
      nombre_bucket: "local",
      ruta_archivo:
        "solicitudes-pago/solicitud-1/factura-uuid.pdf",
      tipo_mime: "application/pdf",
      tamano_archivo: BigInt(19),
    });

    vi.mocked(
      crearAdjuntosSolicitudPagoRepository,
    ).mockResolvedValue({
      count: 1,
    });

    const resultado = await crearAdjuntosSolicitudPagoService({
      solicitudPagoId: "solicitud-1",
      archivos: [archivo],
      subidoPor: "usuario-1",
      carpeta: "solicitudes-pago/solicitud-1",
    });

    expect(storageService.guardarArchivo).toHaveBeenCalledTimes(1);

    expect(storageService.guardarArchivo).toHaveBeenCalledWith({
      contenido: Buffer.from("contenido de prueba"),
      nombre_original: "factura.pdf",
      tipo_mime: "application/pdf",
      carpeta: "solicitudes-pago/solicitud-1",
    });

    expect(
      crearAdjuntosSolicitudPagoRepository,
    ).toHaveBeenCalledTimes(1);

    expect(
      crearAdjuntosSolicitudPagoRepository,
    ).toHaveBeenCalledWith([
      {
        solicitud_pago_id: "solicitud-1",
        nombre_archivo: "factura-uuid.pdf",
        ruta_archivo:
          "solicitudes-pago/solicitud-1/factura-uuid.pdf",
        nombre_bucket: "local",
        tipo_mime: "application/pdf",
        tamano_archivo: BigInt(19),
        subido_por: "usuario-1",
      },
    ]);

    expect(resultado).toEqual({
      count: 1,
      archivos: [
        {
          nombre_archivo: "factura-uuid.pdf",
          nombre_bucket: "local",
          ruta_archivo:
            "solicitudes-pago/solicitud-1/factura-uuid.pdf",
          tipo_mime: "application/pdf",
          tamano_archivo: BigInt(19),
        },
      ],
    });

    expect(storageService.eliminarArchivo).not.toHaveBeenCalled();
  });

  it("debe eliminar los archivos guardados si falla el registro de adjuntos", async () => {
    const archivo = crearArchivoPrueba(
      "factura.pdf",
      "contenido de prueba",
    );

    vi.mocked(storageService.guardarArchivo).mockResolvedValue({
      nombre_archivo: "factura-uuid.pdf",
      nombre_bucket: "local",
      ruta_archivo:
        "solicitudes-pago/solicitud-1/factura-uuid.pdf",
      tipo_mime: "application/pdf",
      tamano_archivo: BigInt(19),
    });

    vi.mocked(
      crearAdjuntosSolicitudPagoRepository,
    ).mockRejectedValue(
      new Error("Error registrando adjuntos"),
    );

    vi.mocked(storageService.eliminarArchivo).mockResolvedValue();

    await expect(
      crearAdjuntosSolicitudPagoService({
        solicitudPagoId: "solicitud-1",
        archivos: [archivo],
        subidoPor: "usuario-1",
        carpeta: "solicitudes-pago/solicitud-1",
      }),
    ).rejects.toThrow("Error registrando adjuntos");

    expect(storageService.eliminarArchivo).toHaveBeenCalledTimes(1);

    expect(storageService.eliminarArchivo).toHaveBeenCalledWith(
      "solicitudes-pago/solicitud-1/factura-uuid.pdf",
    );
  });
});