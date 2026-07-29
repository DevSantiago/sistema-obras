import { Prisma } from "@/generated/prisma/client";
import type {
  MovimientoFondoRegistrado,
  RegistrarMovimientoFondoInput,
} from "./movimientos-fondo.types";

export type CodigoMovimientoFondoError =
  | "DATOS_INVALIDOS"
  | "ORIGEN_INVALIDO"
  | "MOVIMIENTO_DUPLICADO"
  | "FONDO_NO_DISPONIBLE"
  | "SALDO_INSUFICIENTE";

export class MovimientoFondoError extends Error {
  constructor(
    public readonly codigo: CodigoMovimientoFondoError,
    message: string,
  ) {
    super(message);
    this.name = "MovimientoFondoError";
  }
}

async function validarOrigenMovimiento(
  tx: Prisma.TransactionClient,
  input: RegistrarMovimientoFondoInput,
) {
  if (input.centro_costo_id) {
    const centroValido = await tx.centros_costo.count({
      where: {
        id: input.centro_costo_id,
        proyecto_base_id: input.proyecto_base_id,
      },
    });

    if (centroValido !== 1) {
      throw new MovimientoFondoError(
        "ORIGEN_INVALIDO",
        "El centro de costo no pertenece al proyecto del movimiento.",
      );
    }
  }

  if (input.solicitud_pago_id) {
    const solicitudValida = await tx.solicitudes_pago.count({
      where: {
        id: input.solicitud_pago_id,
        proyecto_base_id: input.proyecto_base_id,
        fondo_id: input.fondo_id,
        ...(input.centro_costo_id
          ? { centro_costo_id: input.centro_costo_id }
          : {}),
      },
    });

    if (solicitudValida !== 1) {
      throw new MovimientoFondoError(
        "ORIGEN_INVALIDO",
        "La solicitud no corresponde al proyecto, fondo o centro del movimiento.",
      );
    }
  }

  if (input.pago_id) {
    const pagoValido = await tx.pagos.count({
      where: {
        id: input.pago_id,
        ...(input.solicitud_pago_id
          ? { solicitud_pago_id: input.solicitud_pago_id }
          : {}),
        solicitud_pago: {
          proyecto_base_id: input.proyecto_base_id,
          fondo_id: input.fondo_id,
        },
      },
    });

    if (pagoValido !== 1) {
      throw new MovimientoFondoError(
        "ORIGEN_INVALIDO",
        "El pago no corresponde al proyecto, fondo o solicitud del movimiento.",
      );
    }
  }

  if (input.operacion_efectivo_id) {
    const operacionValida = await tx.operaciones_efectivo.count({
      where: {
        id: input.operacion_efectivo_id,
        proyecto_base_id: input.proyecto_base_id,
        fondo_id: input.fondo_id,
      },
    });

    if (operacionValida !== 1) {
      throw new MovimientoFondoError(
        "ORIGEN_INVALIDO",
        "La operación de efectivo no corresponde al proyecto o fondo del movimiento.",
      );
    }
  }

  if (input.anticipo_id) {
    const anticipoValido = await tx.anticipos.count({
      where: {
        id: input.anticipo_id,
        proyecto_base_id: input.proyecto_base_id,
        fondo_id: input.fondo_id,
      },
    });

    if (anticipoValido !== 1) {
      throw new MovimientoFondoError(
        "ORIGEN_INVALIDO",
        "El anticipo no corresponde al proyecto o fondo del movimiento.",
      );
    }
  }

  if (input.prestamo_proyecto_id) {
    const prestamoValido = await tx.prestamos_proyecto.count({
      where: {
        id: input.prestamo_proyecto_id,
        OR: [
          {
            proyecto_destino_id: input.proyecto_base_id,
            fondo_destino_id: input.fondo_id,
          },
          {
            proyecto_origen_id: input.proyecto_base_id,
            fondo_origen_id: input.fondo_id,
          },
        ],
      },
    });

    if (prestamoValido !== 1) {
      throw new MovimientoFondoError(
        "ORIGEN_INVALIDO",
        "El préstamo no corresponde al proyecto o fondo del movimiento.",
      );
    }
  }

  if (input.devolucion_prestamo_id) {
    if (!input.prestamo_proyecto_id) {
      throw new MovimientoFondoError(
        "ORIGEN_INVALIDO",
        "El movimiento de devolución requiere el préstamo relacionado.",
      );
    }

    const devolucionValida = await tx.devoluciones_prestamo.count({
      where: {
        id: input.devolucion_prestamo_id,
        prestamo_proyecto_id: input.prestamo_proyecto_id,
      },
    });

    if (devolucionValida !== 1) {
      throw new MovimientoFondoError(
        "ORIGEN_INVALIDO",
        "La devolución no corresponde al préstamo del movimiento.",
      );
    }
  }
}

async function validarMovimientoDuplicado(
  tx: Prisma.TransactionClient,
  input: RegistrarMovimientoFondoInput,
) {
  if (input.pago_id) {
    const movimientoPago = await tx.movimientos_fondo.findUnique({
      where: { pago_id: input.pago_id },
      select: { id: true },
    });

    if (movimientoPago) {
      throw new MovimientoFondoError(
        "MOVIMIENTO_DUPLICADO",
        "El pago ya tiene un movimiento financiero registrado.",
      );
    }
  }

  if (input.operacion_efectivo_id) {
    const movimientoOperacion = await tx.movimientos_fondo.findFirst({
      where: {
        operacion_efectivo_id: input.operacion_efectivo_id,
        tipo_movimiento: input.tipo_movimiento,
      },
      select: { id: true },
    });

    if (movimientoOperacion) {
      throw new MovimientoFondoError(
        "MOVIMIENTO_DUPLICADO",
        "La operación ya tiene este movimiento financiero registrado.",
      );
    }
  }

  if (input.anticipo_id) {
    const movimientoAnticipo = await tx.movimientos_fondo.findUnique({
      where: { anticipo_id: input.anticipo_id },
      select: { id: true },
    });

    if (movimientoAnticipo) {
      throw new MovimientoFondoError(
        "MOVIMIENTO_DUPLICADO",
        "El anticipo ya tiene un movimiento financiero registrado.",
      );
    }
  }

  if (input.devolucion_prestamo_id) {
    const movimientoDevolucion =
      await tx.movimientos_fondo.findFirst({
        where: {
          devolucion_prestamo_id: input.devolucion_prestamo_id,
          tipo_movimiento: input.tipo_movimiento,
        },
        select: { id: true },
      });

    if (movimientoDevolucion) {
      throw new MovimientoFondoError(
        "MOVIMIENTO_DUPLICADO",
        "La devolución ya tiene este movimiento financiero registrado.",
      );
    }
  }
}

export async function registrarMovimientoFondoEnTransaccionRepository(
  tx: Prisma.TransactionClient,
  input: RegistrarMovimientoFondoInput,
): Promise<MovimientoFondoRegistrado> {
  if (
    !input.fondo_id ||
    !input.proyecto_base_id ||
    !input.tipo_movimiento.trim() ||
    !["INGRESO", "EGRESO"].includes(input.direccion) ||
    !Number.isFinite(input.valor) ||
    input.valor <= 0 ||
    Number.isNaN(input.registrado_en.getTime())
  ) {
    throw new MovimientoFondoError(
      "DATOS_INVALIDOS",
      "El movimiento requiere fondo, proyecto, tipo y un valor mayor que cero.",
    );
  }

  await validarOrigenMovimiento(tx, input);
  await validarMovimientoDuplicado(tx, input);

  const fondoActualizado = await tx.fondos.updateMany({
    where: {
      id: input.fondo_id,
      proyecto_base_id: input.proyecto_base_id,
      activo: true,
      ...(input.direccion === "EGRESO"
        ? { saldo_actual: { gte: input.valor } }
        : {}),
    },
    data: {
      saldo_actual:
        input.direccion === "EGRESO"
          ? { decrement: input.valor }
          : { increment: input.valor },
    },
  });

  if (fondoActualizado.count !== 1) {
    const fondoExiste = await tx.fondos.count({
      where: {
        id: input.fondo_id,
        proyecto_base_id: input.proyecto_base_id,
        activo: true,
      },
    });

    throw new MovimientoFondoError(
      fondoExiste === 1
        ? "SALDO_INSUFICIENTE"
        : "FONDO_NO_DISPONIBLE",
      fondoExiste === 1
        ? "El fondo no tiene saldo suficiente para registrar el egreso."
        : "El fondo no existe, está inactivo o no pertenece al proyecto.",
    );
  }

  const fondo = await tx.fondos.findUniqueOrThrow({
    where: { id: input.fondo_id },
    select: { saldo_actual: true },
  });
  const saldoNuevo = fondo.saldo_actual.toNumber();
  const saldoAnterior =
    input.direccion === "EGRESO"
      ? saldoNuevo + input.valor
      : saldoNuevo - input.valor;
  const movimiento = await tx.movimientos_fondo.create({
    data: {
      fondo_id: input.fondo_id,
      proyecto_base_id: input.proyecto_base_id,
      centro_costo_id: input.centro_costo_id,
      solicitud_pago_id: input.solicitud_pago_id,
      pago_id: input.pago_id,
      operacion_efectivo_id: input.operacion_efectivo_id,
      anticipo_id: input.anticipo_id,
      prestamo_proyecto_id: input.prestamo_proyecto_id,
      devolucion_prestamo_id: input.devolucion_prestamo_id,
      tipo_movimiento: input.tipo_movimiento.trim(),
      direccion: input.direccion,
      valor: input.valor,
      saldo_anterior: saldoAnterior,
      saldo_nuevo: saldoNuevo,
      referencia_sistema: input.referencia_sistema?.trim() || null,
      descripcion: input.descripcion?.trim() || null,
      registrado_por: input.registrado_por,
      registrado_en: input.registrado_en,
    },
    select: { id: true },
  });

  return {
    movimiento_id: movimiento.id,
    saldo_anterior: saldoAnterior,
    saldo_nuevo: saldoNuevo,
  };
}
