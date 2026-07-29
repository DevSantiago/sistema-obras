import type { UsuarioSesion } from "@/modules/auth/auth.types";
import { MovimientoFondoError } from "@/modules/fondos/movimientos-fondo.repository";
import { storageService } from "@/modules/storage/storage.service";
import {
  consultarOperacionesEfectivoRepository,
  obtenerArchivoOperacionEfectivoRepository,
  ReingresoSobranteError,
  registrarReingresoSobranteRepository,
} from "./operaciones-efectivo.repository";
import type {
  ArchivoOperacionEfectivoDescargable,
  ConsultarOperacionesEfectivoData,
  EstadoSeguimientoOperacionEfectivo,
  FiltrosOperacionesEfectivo,
  RegistrarReingresoSobranteInput,
  ReingresoSobranteRegistrado,
} from "./operaciones-efectivo.types";

const TIPOS_SOPORTE = [
  "application/pdf",
  "image/png",
  "image/jpeg",
];

function tieneAcceso(usuario: UsuarioSesion) {
  return usuario.roles.some((rol) =>
    ["ADMINISTRADOR", "PAGOS"].includes(rol),
  );
}

function fechaValida(fecha?: string) {
  return !fecha || /^\d{4}-\d{2}-\d{2}$/.test(fecha);
}

export async function consultarOperacionesEfectivoService(
  usuario: UsuarioSesion,
  filtros: FiltrosOperacionesEfectivo,
): Promise<{
  status: number;
  body: {
    ok: boolean;
    message: string;
    data?: ConsultarOperacionesEfectivoData;
  };
}> {
  if (!tieneAcceso(usuario)) {
    return {
      status: 403,
      body: {
        ok: false,
        message:
          "No tiene permisos para consultar operaciones de efectivo.",
      },
    };
  }

  if (
    !fechaValida(filtros.fecha_desde) ||
    !fechaValida(filtros.fecha_hasta) ||
    (filtros.fecha_desde &&
      filtros.fecha_hasta &&
      filtros.fecha_desde > filtros.fecha_hasta)
  ) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "El rango de fechas no es válido.",
      },
    };
  }

  const registros =
    await consultarOperacionesEfectivoRepository(filtros);
  const operaciones = registros.map((operacion) => {
    const valorSobrante = operacion.valor_sobrante.toNumber();
    const valorReintegrado = operacion.movimientos.reduce(
      (total, movimiento) => total + movimiento.valor.toNumber(),
      0,
    );
    const valorPendiente = Math.max(
      0,
      valorSobrante - valorReintegrado,
    );
    let estado: EstadoSeguimientoOperacionEfectivo =
      "SOBRANTE_PENDIENTE_REINGRESO";

    if (valorSobrante <= 0) {
      estado = "SIN_SOBRANTE";
    } else if (valorPendiente <= 0) {
      estado = "SOBRANTE_REINTEGRADO";
    }

    return {
      id: operacion.id,
      proyecto_base_id: operacion.proyecto_base.id,
      proyecto_nombre: operacion.proyecto_base.nombre,
      fondo_id: operacion.fondo.id,
      fondo_nombre: operacion.fondo.nombre,
      fecha_retiro: operacion.fecha_retiro.toISOString(),
      valor_requerido: operacion.valor_requerido.toNumber(),
      valor_retirado: operacion.valor_retirado.toNumber(),
      valor_pagado: operacion.valor_pagado.toNumber(),
      valor_sobrante: valorSobrante,
      valor_reintegrado: valorReintegrado,
      valor_pendiente_reintegro: valorPendiente,
      estado_seguimiento: estado,
      observacion: operacion.observacion,
      registrado_por_nombre: operacion.registrador.nombre,
      registrado_en: operacion.registrado_en.toISOString(),
      soporte_retiro: operacion.soporte_retiro,
      reingresos: operacion.reingresos.map((reingreso) => ({
        id: reingreso.id,
        referencia_sistema: reingreso.referencia_sistema,
        valor: reingreso.valor.toNumber(),
        pendiente_anterior: reingreso.pendiente_anterior.toNumber(),
        pendiente_nuevo: reingreso.pendiente_nuevo.toNumber(),
        fecha_reingreso: reingreso.fecha_reingreso.toISOString(),
        observacion: reingreso.observacion,
        registrado_por_nombre: reingreso.registrador.nombre,
        soporte: reingreso.soporte,
      })),
      detalles: operacion.detalles.map((detalle) => ({
        id: detalle.id,
        solicitud_pago_id: detalle.solicitud_pago.id,
        numero_solicitud: detalle.solicitud_pago.numero_solicitud,
        tipo_solicitud: detalle.solicitud_pago.tipo_solicitud,
        centro_costo_codigo:
          detalle.solicitud_pago.centro_costo.codigo,
        centro_costo_nombre:
          detalle.solicitud_pago.centro_costo.nombre,
        beneficiario_nombre:
          detalle.solicitud_pago.beneficiario?.nombre ?? null,
        medio_pago: detalle.medio_pago,
        valor_pagado: detalle.valor_pagado.toNumber(),
        numero_comprobante: detalle.numero_comprobante,
        observacion: detalle.observacion,
        soporte: detalle.soporte,
      })),
    };
  });

  return {
    status: 200,
    body: {
      ok: true,
      message: "Operaciones de efectivo consultadas correctamente.",
      data: { operaciones },
    },
  };
}

export async function registrarReingresoSobranteService(
  usuario: UsuarioSesion,
  input: RegistrarReingresoSobranteInput,
): Promise<{
  status: number;
  body: {
    ok: boolean;
    message: string;
    data?: ReingresoSobranteRegistrado;
  };
}> {
  if (!tieneAcceso(usuario)) {
    return {
      status: 403,
      body: {
        ok: false,
        message: "No tiene permisos para registrar reingresos.",
      },
    };
  }

  const valor = Number(input.valor);

  if (
    !input.operacion_efectivo_id.trim() ||
    !Number.isFinite(valor) ||
    valor <= 0
  ) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "La operación y un valor mayor que cero son obligatorios.",
      },
    };
  }

  if (
    input.soporte.size <= 0 ||
    input.soporte.size > 10 * 1024 * 1024 ||
    (input.soporte.type &&
      !TIPOS_SOPORTE.includes(input.soporte.type))
  ) {
    return {
      status: 400,
      body: {
        ok: false,
        message:
          "El soporte debe ser PDF, PNG, JPG o JPEG y pesar máximo 10 MB.",
      },
    };
  }

  const archivo = await storageService.guardarArchivo({
    contenido: Buffer.from(await input.soporte.arrayBuffer()),
    nombre_original: input.soporte.name,
    tipo_mime: input.soporte.type || null,
    carpeta: "operaciones-efectivo/reingresos",
  });

  try {
    const reingreso = await registrarReingresoSobranteRepository({
      operacion_efectivo_id: input.operacion_efectivo_id.trim(),
      valor,
      observacion: input.observacion?.trim() || null,
      soporte: archivo,
      usuario_id: usuario.id,
      fecha_operacion: new Date(),
    });

    return {
      status: 201,
      body: {
        ok: true,
        message: "Reingreso registrado correctamente.",
        data: reingreso,
      },
    };
  } catch (causa) {
    await storageService.eliminarArchivo(archivo.ruta_archivo);

    if (
      causa instanceof ReingresoSobranteError ||
      causa instanceof MovimientoFondoError
    ) {
      return {
        status: 409,
        body: { ok: false, message: causa.message },
      };
    }

    throw causa;
  }
}

export async function obtenerArchivoOperacionEfectivoService(
  usuario: UsuarioSesion,
  operacionId: string,
  adjuntoId: string,
): Promise<{
  status: number;
  body: {
    ok: boolean;
    message: string;
    data?: ArchivoOperacionEfectivoDescargable;
  };
}> {
  if (!tieneAcceso(usuario)) {
    return {
      status: 403,
      body: { ok: false, message: "No tiene permisos para ver soportes." },
    };
  }

  if (!operacionId.trim() || !adjuntoId.trim()) {
    return {
      status: 400,
      body: { ok: false, message: "La operación y el soporte son obligatorios." },
    };
  }

  const archivo = await obtenerArchivoOperacionEfectivoRepository(
    operacionId,
    adjuntoId,
  );

  if (!archivo) {
    return {
      status: 404,
      body: { ok: false, message: "El soporte no existe para esta operación." },
    };
  }

  return {
    status: 200,
    body: {
      ok: true,
      message: "Soporte consultado correctamente.",
      data: archivo,
    },
  };
}
