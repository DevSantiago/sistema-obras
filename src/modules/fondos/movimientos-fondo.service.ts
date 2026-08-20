import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { registrarMovimientoFondoEnTransaccionRepository } from "./movimientos-fondo.repository";
import type {
  MovimientoFondoRegistrado,
  RegistrarMovimientoFondoInput,
} from "./movimientos-fondo.types";

export async function registrarMovimientoFondoService(
  input: RegistrarMovimientoFondoInput,
): Promise<MovimientoFondoRegistrado> {
  return prisma.$transaction(
    (tx) =>
      registrarMovimientoFondoEnTransaccionRepository(tx, input),
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
}

