import { beforeEach, describe, expect, it, vi } from "vitest";
import { crearAdjuntosSolicitudPagoRepository } from "@/modules/adjuntos/adjuntos.repository";
import {eliminarSolicitudReembolsoRepository } from "../../solicitudes-pago/reembolsos/reembolsos.repository";

const { createManyMock, deleteMock } = vi.hoisted(() => ({
  createManyMock: vi.fn(),
  deleteMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    adjuntos: {
      createMany: createManyMock,
    },
    solicitudes_pago: {
      delete: deleteMock,
    },
  },
}));

describe("adjuntos.repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe crear los adjuntos asociados a la solicitud", async () => {
    createManyMock.mockResolvedValue({
      count: 2,
    });

    const resultado =
      await crearAdjuntosSolicitudPagoRepository([
        {
          solicitud_pago_id: "solicitud-1",
          nombre_archivo: "factura.pdf",
          ruta_archivo:
            "storage/reembolsos/factura.pdf",
          nombre_bucket: "LOCAL",
          tipo_mime: "application/pdf",
          tamano_archivo: BigInt(1000),
          subido_por: "usuario-1",
        },
        {
          solicitud_pago_id: "solicitud-1",
          nombre_archivo: "recibo.png",
          ruta_archivo:
            "storage/reembolsos/recibo.png",
          nombre_bucket: "LOCAL",
          tipo_mime: "image/png",
          tamano_archivo: BigInt(2000),
          subido_por: "usuario-1",
        },
      ]);

    expect(resultado).toEqual({
      count: 2,
    });

    expect(createManyMock).toHaveBeenCalledWith({
      data: [
        {
          solicitud_pago_id: "solicitud-1",
          nombre_archivo: "factura.pdf",
          ruta_archivo:
            "storage/reembolsos/factura.pdf",
          nombre_bucket: "LOCAL",
          tipo_mime: "application/pdf",
          tamano_archivo: BigInt(1000),
          subido_por: "usuario-1",
          estado_ocr: "NO_PROCESADO",
        },
        {
          solicitud_pago_id: "solicitud-1",
          nombre_archivo: "recibo.png",
          ruta_archivo:
            "storage/reembolsos/recibo.png",
          nombre_bucket: "LOCAL",
          tipo_mime: "image/png",
          tamano_archivo: BigInt(2000),
          subido_por: "usuario-1",
          estado_ocr: "NO_PROCESADO",
        },
      ],
    });
  });
});
