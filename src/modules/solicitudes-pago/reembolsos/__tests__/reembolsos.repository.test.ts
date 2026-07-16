import { beforeEach, describe, expect, it, vi } from "vitest";

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

import {
  crearAdjuntosReembolsoRepository,
  eliminarSolicitudReembolsoRepository,
} from "../reembolsos.repository";

describe("reembolsos.repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe crear los adjuntos asociados a la solicitud", async () => {
    createManyMock.mockResolvedValue({
      count: 2,
    });

    const resultado =
      await crearAdjuntosReembolsoRepository([
        {
          solicitud_pago_id: "solicitud-1",
          nombre_archivo: "factura.pdf",
          ruta_archivo:
            "storage/reembolsos/factura.pdf",
          nombre_bucket: "LOCAL",
          tipo_mime: "application/pdf",
          tamano_archivo: 1000n,
          subido_por: "usuario-1",
        },
        {
          solicitud_pago_id: "solicitud-1",
          nombre_archivo: "recibo.png",
          ruta_archivo:
            "storage/reembolsos/recibo.png",
          nombre_bucket: "LOCAL",
          tipo_mime: "image/png",
          tamano_archivo: 2000n,
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
          tamano_archivo: 1000n,
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
          tamano_archivo: 2000n,
          subido_por: "usuario-1",
          estado_ocr: "NO_PROCESADO",
        },
      ],
    });
  });

  it("no debe ejecutar createMany cuando no hay adjuntos", async () => {
    const resultado =
      await crearAdjuntosReembolsoRepository([]);

    expect(resultado).toEqual({
      count: 0,
    });
    expect(createManyMock).not.toHaveBeenCalled();
  });

  it("debe eliminar la solicitud durante el rollback", async () => {
    deleteMock.mockResolvedValue({
      id: "solicitud-1",
    });

    await eliminarSolicitudReembolsoRepository(
      "solicitud-1",
    );

    expect(deleteMock).toHaveBeenCalledWith({
      where: {
        id: "solicitud-1",
      },
    });
  });
});
