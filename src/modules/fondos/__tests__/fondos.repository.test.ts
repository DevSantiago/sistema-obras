import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  accesos_usuario_proyecto: {
    findMany: vi.fn(),
  },
  movimientos_fondo: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import {
  consultarMovimientosFondoRepository,
  obtenerAdjuntoMovimientoFondoRepository,
} from "../fondos.repository";

describe("fondos.repository - movimientos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.movimientos_fondo.findMany.mockResolvedValue([]);
  });

  it("debe convertir el rango de fechas de Colombia en límites inclusivos", async () => {
    await consultarMovimientosFondoRepository(
      { tipo: "TOTAL" },
      {
        fecha_desde: "2026-09-01",
        fecha_hasta: "2026-09-10",
      },
    );

    expect(prismaMock.movimientos_fondo.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          registrado_en: {
            gte: new Date("2026-09-01T00:00:00.000-05:00"),
            lte: new Date("2026-09-10T23:59:59.999-05:00"),
          },
        }),
      }),
    );
  });

  it("debe exigir visibilidad del movimiento antes de resolver un soporte", async () => {
    prismaMock.accesos_usuario_proyecto.findMany.mockResolvedValue([
      {
        proyecto_base_id: "proyecto-1",
        linea_negocio: "OBRA",
      },
    ]);
    prismaMock.movimientos_fondo.findFirst.mockResolvedValue(null);

    await obtenerAdjuntoMovimientoFondoRepository(
      { tipo: "ACCESOS", usuario_id: "usuario-1" },
      "movimiento-1",
      "adjunto-1",
    );

    expect(prismaMock.movimientos_fondo.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "movimiento-1",
          OR: [
            {
              proyecto_base_id: "proyecto-1",
              centro_costo: { linea_negocio: "OBRA" },
            },
          ],
        },
      }),
    );
  });
});
