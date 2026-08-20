import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { registrarMovimientoFondoEnTransaccionRepository } from "@/modules/fondos/movimientos-fondo.repository";
import { generarSecuenciaDocumentalRepository } from "@/modules/secuencias/secuencias.repository";
import type {
  DevolucionPrestamoRegistrada,
  PrestamoEntreProyectosRegistrado,
  PrestamoPendiente,
  PrestamoPersonaRegistrado,
  RegistrarDevolucionPrestamoRepositoryInput,
  RegistrarPrestamoEntreProyectosRepositoryInput,
  RegistrarPrestamoPersonaRepositoryInput,
} from "./prestamos.types";

export class RegistrarPrestamoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RegistrarPrestamoError";
  }
}

export async function registrarPrestamoPersonaRepository(
  input: RegistrarPrestamoPersonaRepositoryInput,
): Promise<PrestamoPersonaRegistrado> {
  return prisma.$transaction(
    async (tx) => {
      const proyecto = await tx.proyectos_base.findFirst({
        where: {
          id: input.proyecto_base_id,
          activo: true,
          fondo: { is: { activo: true } },
        },
        select: {
          id: true,
          nombre: true,
          fondo: { select: { id: true } },
        },
      });
      const acreedor = await tx.beneficiarios_pago.findFirst({
        where: {
          id: input.acreedor_id,
          activo: true,
        },
        select: {
          id: true,
          nombre: true,
          tipo_documento: true,
          numero_documento: true,
        },
      });

      if (!proyecto?.fondo) {
        throw new RegistrarPrestamoError(
          "El proyecto no existe, está inactivo o no tiene un fondo activo.",
        );
      }

      if (
        !acreedor?.tipo_documento ||
        !acreedor.numero_documento
      ) {
        throw new RegistrarPrestamoError(
          "El acreedor no existe, está inactivo o no tiene identificación.",
        );
      }

      const secuencia = await generarSecuenciaDocumentalRepository(
        {
          tipo_secuencia: "PRESTAMO_PROYECTO",
          proyecto_base_id: proyecto.id,
          centro_costo_id: null,
          proyecto_referencia: proyecto.nombre,
          centro_costo_referencia: null,
          clave_contexto: `PROYECTO:${proyecto.id}`,
          prefijo: "PRE",
          anio: input.fecha_prestamo.getUTCFullYear(),
        },
        tx,
      );
      const soporte = await tx.adjuntos.create({
        data: {
          nombre_archivo: input.soporte.nombre_archivo,
          nombre_bucket: input.soporte.nombre_bucket,
          ruta_archivo: input.soporte.ruta_archivo,
          tipo_mime: input.soporte.tipo_mime,
          tamano_archivo: input.soporte.tamano_archivo,
          subido_por: input.usuario_id,
          estado_ocr: "NO_PROCESADO",
        },
        select: { id: true },
      });
      const prestamo = await tx.prestamos_proyecto.create({
        data: {
          tipo_prestamo: "PERSONA_A_PROYECTO",
          proyecto_destino_id: proyecto.id,
          fondo_destino_id: proyecto.fondo.id,
          acreedor_id: acreedor.id,
          adjunto_soporte_id: soporte.id,
          referencia_sistema: secuencia.referencia,
          acreedor_nombre: acreedor.nombre,
          acreedor_tipo_documento: acreedor.tipo_documento,
          acreedor_numero_documento: acreedor.numero_documento,
          valor_original: input.valor,
          saldo_pendiente: input.valor,
          fecha_prestamo: input.fecha_prestamo,
          estado: "ACTIVO",
          observacion: input.observacion,
          registrado_por: input.usuario_id,
          registrado_en: input.registrado_en,
        },
        select: { id: true },
      });
      const movimiento =
        await registrarMovimientoFondoEnTransaccionRepository(tx, {
          fondo_id: proyecto.fondo.id,
          proyecto_base_id: proyecto.id,
          prestamo_proyecto_id: prestamo.id,
          tipo_movimiento: "INGRESO_PRESTAMO_PERSONA",
          direccion: "INGRESO",
          valor: input.valor,
          referencia_sistema: secuencia.referencia,
          descripcion:
            input.observacion ??
            `Préstamo entregado por ${acreedor.nombre}.`,
          registrado_por: input.usuario_id,
          registrado_en: input.registrado_en,
        });

      return {
        id: prestamo.id,
        referencia_sistema: secuencia.referencia,
        proyecto_base_id: proyecto.id,
        proyecto_nombre: proyecto.nombre,
        acreedor_id: acreedor.id,
        acreedor_nombre: acreedor.nombre,
        valor_original: input.valor,
        saldo_pendiente: input.valor,
        saldo_anterior_fondo: movimiento.saldo_anterior,
        saldo_nuevo_fondo: movimiento.saldo_nuevo,
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
}

export async function registrarPrestamoEntreProyectosRepository(
  input: RegistrarPrestamoEntreProyectosRepositoryInput,
): Promise<PrestamoEntreProyectosRegistrado> {
  return prisma.$transaction(
    async (tx) => {
      const proyectos = await tx.proyectos_base.findMany({
        where: {
          id: {
            in: [
              input.proyecto_origen_id,
              input.proyecto_destino_id,
            ],
          },
          activo: true,
          fondo: { is: { activo: true } },
        },
        select: {
          id: true,
          nombre: true,
          fondo: { select: { id: true } },
        },
      });
      const origen = proyectos.find(
        (proyecto) => proyecto.id === input.proyecto_origen_id,
      );
      const destino = proyectos.find(
        (proyecto) => proyecto.id === input.proyecto_destino_id,
      );

      if (!origen?.fondo || !destino?.fondo) {
        throw new RegistrarPrestamoError(
          "Los proyectos deben existir, estar activos y tener fondos activos.",
        );
      }

      const secuencia = await generarSecuenciaDocumentalRepository(
        {
          tipo_secuencia: "PRESTAMO_PROYECTO",
          proyecto_base_id: destino.id,
          centro_costo_id: null,
          proyecto_referencia: destino.nombre,
          centro_costo_referencia: null,
          clave_contexto: `PROYECTO:${destino.id}`,
          prefijo: "PRE",
          anio: input.fecha_operacion.getUTCFullYear(),
        },
        tx,
      );
      const soporte = await tx.adjuntos.create({
        data: {
          nombre_archivo: input.soporte.nombre_archivo,
          nombre_bucket: input.soporte.nombre_bucket,
          ruta_archivo: input.soporte.ruta_archivo,
          tipo_mime: input.soporte.tipo_mime,
          tamano_archivo: input.soporte.tamano_archivo,
          subido_por: input.usuario_id,
          estado_ocr: "NO_PROCESADO",
        },
        select: { id: true },
      });
      const prestamo = await tx.prestamos_proyecto.create({
        data: {
          tipo_prestamo: "PROYECTO_A_PROYECTO",
          proyecto_origen_id: origen.id,
          fondo_origen_id: origen.fondo.id,
          proyecto_destino_id: destino.id,
          fondo_destino_id: destino.fondo.id,
          adjunto_soporte_id: soporte.id,
          referencia_sistema: secuencia.referencia,
          valor_original: input.valor,
          saldo_pendiente: input.valor,
          fecha_prestamo: input.fecha_operacion,
          estado: "ACTIVO",
          observacion: input.observacion,
          registrado_por: input.usuario_id,
          registrado_en: input.fecha_operacion,
        },
        select: { id: true },
      });
      const movimientoOrigen =
        await registrarMovimientoFondoEnTransaccionRepository(tx, {
          fondo_id: origen.fondo.id,
          proyecto_base_id: origen.id,
          prestamo_proyecto_id: prestamo.id,
          tipo_movimiento: "EGRESO_PRESTAMO_PROYECTO",
          direccion: "EGRESO",
          valor: input.valor,
          referencia_sistema: secuencia.referencia,
          descripcion:
            input.observacion ??
            `Préstamo enviado al proyecto ${destino.nombre}.`,
          registrado_por: input.usuario_id,
          registrado_en: input.fecha_operacion,
        });
      const movimientoDestino =
        await registrarMovimientoFondoEnTransaccionRepository(tx, {
          fondo_id: destino.fondo.id,
          proyecto_base_id: destino.id,
          prestamo_proyecto_id: prestamo.id,
          tipo_movimiento: "INGRESO_PRESTAMO_PROYECTO",
          direccion: "INGRESO",
          valor: input.valor,
          referencia_sistema: secuencia.referencia,
          descripcion:
            input.observacion ??
            `Préstamo recibido del proyecto ${origen.nombre}.`,
          registrado_por: input.usuario_id,
          registrado_en: input.fecha_operacion,
        });

      return {
        id: prestamo.id,
        referencia_sistema: secuencia.referencia,
        proyecto_origen_id: origen.id,
        proyecto_origen_nombre: origen.nombre,
        proyecto_destino_id: destino.id,
        proyecto_destino_nombre: destino.nombre,
        valor_original: input.valor,
        saldo_pendiente: input.valor,
        saldo_origen_anterior: movimientoOrigen.saldo_anterior,
        saldo_origen_nuevo: movimientoOrigen.saldo_nuevo,
        saldo_destino_anterior: movimientoDestino.saldo_anterior,
        saldo_destino_nuevo: movimientoDestino.saldo_nuevo,
        fecha_operacion: input.fecha_operacion.toISOString(),
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
}

export async function consultarPrestamosPendientesRepository(): Promise<
  PrestamoPendiente[]
> {
  const prestamos = await prisma.prestamos_proyecto.findMany({
    where: {
      estado: { in: ["ACTIVO", "PARCIALMENTE_DEVUELTO"] },
      saldo_pendiente: { gt: 0 },
    },
    orderBy: { registrado_en: "desc" },
    select: {
      id: true,
      referencia_sistema: true,
      tipo_prestamo: true,
      valor_original: true,
      saldo_pendiente: true,
      estado: true,
      acreedor_nombre: true,
      proyecto_destino: {
        select: { id: true, nombre: true },
      },
      fondo_destino: {
        select: { saldo_actual: true },
      },
      proyecto_origen: {
        select: { id: true, nombre: true },
      },
    },
  });

  return prestamos.map((prestamo) => ({
    id: prestamo.id,
    referencia_sistema: prestamo.referencia_sistema,
    tipo_prestamo: prestamo.tipo_prestamo,
    proyecto_destino_id: prestamo.proyecto_destino.id,
    proyecto_destino_nombre: prestamo.proyecto_destino.nombre,
    proyecto_origen_id: prestamo.proyecto_origen?.id ?? null,
    proyecto_origen_nombre: prestamo.proyecto_origen?.nombre ?? null,
    acreedor_nombre: prestamo.acreedor_nombre,
    valor_original: prestamo.valor_original.toNumber(),
    saldo_pendiente: prestamo.saldo_pendiente.toNumber(),
    saldo_fondo_destino: prestamo.fondo_destino.saldo_actual.toNumber(),
    estado: prestamo.estado,
  }));
}

export async function registrarDevolucionPrestamoRepository(
  input: RegistrarDevolucionPrestamoRepositoryInput,
): Promise<DevolucionPrestamoRegistrada> {
  return prisma.$transaction(
    async (tx) => {
      const prestamo = await tx.prestamos_proyecto.findFirst({
        where: {
          id: input.prestamo_proyecto_id,
          estado: { in: ["ACTIVO", "PARCIALMENTE_DEVUELTO"] },
          saldo_pendiente: { gt: 0 },
        },
        select: {
          id: true,
          referencia_sistema: true,
          tipo_prestamo: true,
          saldo_pendiente: true,
          proyecto_destino: { select: { id: true, nombre: true } },
          fondo_destino: { select: { id: true } },
          proyecto_origen: { select: { id: true, nombre: true } },
          fondo_origen: { select: { id: true } },
          acreedor_nombre: true,
        },
      });

      if (!prestamo) {
        throw new RegistrarPrestamoError(
          "El préstamo no existe, está saldado o no admite devoluciones.",
        );
      }

      const saldoAnterior = prestamo.saldo_pendiente.toNumber();

      if (input.valor > saldoAnterior) {
        throw new RegistrarPrestamoError(
          "El valor de la devolución no puede superar el saldo pendiente.",
        );
      }

      if (
        prestamo.tipo_prestamo === "PROYECTO_A_PROYECTO" &&
        (!prestamo.proyecto_origen || !prestamo.fondo_origen)
      ) {
        throw new RegistrarPrestamoError(
          "El préstamo entre proyectos no tiene un origen válido.",
        );
      }

      const secuencia = await generarSecuenciaDocumentalRepository(
        {
          tipo_secuencia: "DEVOLUCION_PRESTAMO",
          proyecto_base_id: prestamo.proyecto_destino.id,
          centro_costo_id: null,
          proyecto_referencia: prestamo.proyecto_destino.nombre,
          centro_costo_referencia: null,
          clave_contexto: `PROYECTO:${prestamo.proyecto_destino.id}`,
          prefijo: "DEV",
          anio: input.fecha_operacion.getUTCFullYear(),
        },
        tx,
      );
      const soporte = await tx.adjuntos.create({
        data: {
          nombre_archivo: input.soporte.nombre_archivo,
          nombre_bucket: input.soporte.nombre_bucket,
          ruta_archivo: input.soporte.ruta_archivo,
          tipo_mime: input.soporte.tipo_mime,
          tamano_archivo: input.soporte.tamano_archivo,
          subido_por: input.usuario_id,
          estado_ocr: "NO_PROCESADO",
        },
        select: { id: true },
      });
      const saldoNuevo = saldoAnterior - input.valor;
      const estadoPrestamo =
        saldoNuevo === 0 ? "SALDADO" : "PARCIALMENTE_DEVUELTO";
      const devolucion = await tx.devoluciones_prestamo.create({
        data: {
          prestamo_proyecto_id: prestamo.id,
          adjunto_soporte_id: soporte.id,
          referencia_sistema: secuencia.referencia,
          valor: input.valor,
          saldo_anterior: saldoAnterior,
          saldo_nuevo: saldoNuevo,
          fecha_devolucion: input.fecha_operacion,
          observacion: input.observacion,
          registrado_por: input.usuario_id,
          registrado_en: input.fecha_operacion,
        },
        select: { id: true },
      });
      const prestamoActualizado =
        await tx.prestamos_proyecto.updateMany({
          where: {
            id: prestamo.id,
            estado: { in: ["ACTIVO", "PARCIALMENTE_DEVUELTO"] },
            saldo_pendiente: saldoAnterior,
          },
          data: {
            saldo_pendiente: saldoNuevo,
            estado: estadoPrestamo,
          },
        });

      if (prestamoActualizado.count !== 1) {
        throw new RegistrarPrestamoError(
          "El saldo pendiente del préstamo cambió. Intente nuevamente.",
        );
      }

      const movimientoDestino =
        await registrarMovimientoFondoEnTransaccionRepository(tx, {
          fondo_id: prestamo.fondo_destino.id,
          proyecto_base_id: prestamo.proyecto_destino.id,
          prestamo_proyecto_id: prestamo.id,
          devolucion_prestamo_id: devolucion.id,
          tipo_movimiento:
            prestamo.tipo_prestamo === "PERSONA_A_PROYECTO"
              ? "EGRESO_DEVOLUCION_PRESTAMO_PERSONA"
              : "EGRESO_DEVOLUCION_PRESTAMO",
          direccion: "EGRESO",
          valor: input.valor,
          referencia_sistema: secuencia.referencia,
          descripcion:
            input.observacion ??
            (prestamo.tipo_prestamo === "PERSONA_A_PROYECTO"
              ? `Devolución de préstamo a ${prestamo.acreedor_nombre}.`
              : `Devolución al proyecto ${prestamo.proyecto_origen?.nombre}.`),
          registrado_por: input.usuario_id,
          registrado_en: input.fecha_operacion,
        });

      let movimientoOrigen = null;

      if (
        prestamo.tipo_prestamo === "PROYECTO_A_PROYECTO" &&
        prestamo.proyecto_origen &&
        prestamo.fondo_origen
      ) {
        movimientoOrigen =
          await registrarMovimientoFondoEnTransaccionRepository(tx, {
            fondo_id: prestamo.fondo_origen.id,
            proyecto_base_id: prestamo.proyecto_origen.id,
            prestamo_proyecto_id: prestamo.id,
            devolucion_prestamo_id: devolucion.id,
            tipo_movimiento: "INGRESO_DEVOLUCION_PRESTAMO",
            direccion: "INGRESO",
            valor: input.valor,
            referencia_sistema: secuencia.referencia,
            descripcion:
              input.observacion ??
              `Devolución recibida del proyecto ${prestamo.proyecto_destino.nombre}.`,
            registrado_por: input.usuario_id,
            registrado_en: input.fecha_operacion,
          });
      }

      return {
        id: devolucion.id,
        referencia_sistema: secuencia.referencia,
        prestamo_proyecto_id: prestamo.id,
        prestamo_referencia: prestamo.referencia_sistema,
        tipo_prestamo: prestamo.tipo_prestamo,
        valor: input.valor,
        saldo_anterior_prestamo: saldoAnterior,
        saldo_nuevo_prestamo: saldoNuevo,
        estado_prestamo: estadoPrestamo,
        saldo_fondo_destino_anterior: movimientoDestino.saldo_anterior,
        saldo_fondo_destino_nuevo: movimientoDestino.saldo_nuevo,
        saldo_fondo_origen_anterior:
          movimientoOrigen?.saldo_anterior ?? null,
        saldo_fondo_origen_nuevo: movimientoOrigen?.saldo_nuevo ?? null,
        fecha_operacion: input.fecha_operacion.toISOString(),
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
}
