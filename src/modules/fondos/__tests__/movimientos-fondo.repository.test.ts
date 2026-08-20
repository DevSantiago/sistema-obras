import { describe, expect, it, vi } from "vitest";
import {
  MovimientoFondoError,
  registrarMovimientoFondoEnTransaccionRepository,
} from "../movimientos-fondo.repository";

function crearTransaccionMock(input?: {
  actualizados?: number;
  fondoExiste?: number;
  saldoNuevo?: number;
}) {
  return {
    centros_costo: {
      count: vi.fn(),
    },
    solicitudes_pago: {
      count: vi.fn(),
    },
    pagos: {
      count: vi.fn(),
    },
    operaciones_efectivo: {
      count: vi.fn(),
    },
    reingresos_sobrante_efectivo: {
      count: vi.fn(),
    },
    movimientos_fondo: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn().mockResolvedValue({ id: "movimiento-1" }),
    },
    fondos: {
      updateMany: vi
        .fn()
        .mockResolvedValue({ count: input?.actualizados ?? 1 }),
      count: vi.fn().mockResolvedValue(input?.fondoExiste ?? 1),
      findUniqueOrThrow: vi.fn().mockResolvedValue({
        saldo_actual: {
          toNumber: () => input?.saldoNuevo ?? 700,
        },
      }),
    },
  };
}

const movimientoBase = {
  fondo_id: "fondo-1",
  proyecto_base_id: "proyecto-1",
  tipo_movimiento: "EGRESO_AJUSTE",
  direccion: "EGRESO" as const,
  valor: 300,
  registrado_por: "usuario-1",
  registrado_en: new Date("2026-07-28T12:00:00.000Z"),
};

describe("movimientos-fondo.repository", () => {
  it("debe descontar el egreso y conservar ambos saldos", async () => {
    const tx = crearTransaccionMock();

    const resultado =
      await registrarMovimientoFondoEnTransaccionRepository(
        tx as never,
        movimientoBase,
      );

    expect(tx.fondos.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          saldo_actual: { gte: 300 },
        }),
        data: {
          saldo_actual: { decrement: 300 },
        },
      }),
    );
    expect(resultado).toEqual({
      movimiento_id: "movimiento-1",
      saldo_anterior: 1000,
      saldo_nuevo: 700,
    });
  });

  it("debe incrementar el fondo para un ingreso", async () => {
    const tx = crearTransaccionMock({ saldoNuevo: 1200 });

    const resultado =
      await registrarMovimientoFondoEnTransaccionRepository(
        tx as never,
        {
          ...movimientoBase,
          direccion: "INGRESO",
          tipo_movimiento: "INGRESO_AJUSTE",
          valor: 200,
        },
      );

    expect(tx.fondos.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          saldo_actual: { increment: 200 },
        },
      }),
    );
    expect(resultado.saldo_anterior).toBe(1000);
    expect(resultado.saldo_nuevo).toBe(1200);
  });

  it("debe impedir que un egreso deje saldo negativo", async () => {
    const tx = crearTransaccionMock({ actualizados: 0, fondoExiste: 1 });

    await expect(
      registrarMovimientoFondoEnTransaccionRepository(
        tx as never,
        movimientoBase,
      ),
    ).rejects.toMatchObject({
      codigo: "SALDO_INSUFICIENTE",
    });
    expect(tx.movimientos_fondo.create).not.toHaveBeenCalled();
  });

  it("debe impedir repetir el mismo tipo para una operación", async () => {
    const tx = crearTransaccionMock();
    tx.operaciones_efectivo.count.mockResolvedValue(1);
    tx.movimientos_fondo.findFirst.mockResolvedValue({
      id: "movimiento-existente",
    });

    await expect(
      registrarMovimientoFondoEnTransaccionRepository(tx as never, {
        ...movimientoBase,
        operacion_efectivo_id: "operacion-1",
      }),
    ).rejects.toBeInstanceOf(MovimientoFondoError);
    expect(tx.fondos.updateMany).not.toHaveBeenCalled();
  });

  it("debe validar que el centro pertenezca al proyecto", async () => {
    const tx = crearTransaccionMock();
    tx.centros_costo.count.mockResolvedValue(0);

    await expect(
      registrarMovimientoFondoEnTransaccionRepository(tx as never, {
        ...movimientoBase,
        centro_costo_id: "centro-ajeno",
      }),
    ).rejects.toMatchObject({
      codigo: "ORIGEN_INVALIDO",
    });
    expect(tx.fondos.updateMany).not.toHaveBeenCalled();
  });

  it("debe permitir varios reingresos con movimientos independientes", async () => {
    const tx = crearTransaccionMock({ saldoNuevo: 1100 });
    tx.operaciones_efectivo.count.mockResolvedValue(1);
    tx.reingresos_sobrante_efectivo.count.mockResolvedValue(1);
    tx.movimientos_fondo.findUnique.mockResolvedValue(null);

    const resultado =
      await registrarMovimientoFondoEnTransaccionRepository(
        tx as never,
        {
          ...movimientoBase,
          operacion_efectivo_id: "operacion-1",
          reingreso_sobrante_id: "reingreso-1",
          tipo_movimiento: "INGRESO_REINTEGRO_EFECTIVO",
          direccion: "INGRESO",
          valor: 100,
        },
      );

    expect(resultado.saldo_nuevo).toBe(1100);
    expect(tx.movimientos_fondo.findFirst).not.toHaveBeenCalled();
  });
});
