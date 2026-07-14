import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  BeneficiarioCreadoNominaGrupal,
  BeneficiarioNominaGrupalRepositoryResult,
  CrearAdjuntoNominaGrupalRepositoryInput,
  CrearSolicitudNominaGrupalRepositoryInput,
  DuplicadoNominaGrupalRepositoryInput,
  DuplicadoNominaGrupalRepositoryResult,
} from "./nomina-grupal.types";

const solicitudNominaGrupalInclude = {
  proyecto_base: {
    select: {
      id: true,
      nombre: true,
      estado_proyecto: true,
    },
  },
  centro_costo: {
    select: {
      id: true,
      nombre: true,
      linea_negocio: true,
      fase_centro_costo: true,
      estado_centro_costo: true,
    },
  },
  beneficiario: {
    select: {
      id: true,
      nombre: true,
      tipo_beneficiario: true,
      tipo_documento: true,
      numero_documento: true,
    },
  },
  proveedor: {
    select: {
      id: true,
      nombre: true,
      tipo_documento: true,
      numero_documento: true,
    },
  },
  creador: {
    select: {
      id: true,
      nombre: true,
      correo: true,
    },
  },
  archivo_origen: {
    select: {
      id: true,
      nombre_archivo: true,
      ruta_archivo: true,
      nombre_bucket: true,
      tipo_mime: true,
      tamano_archivo: true,
      subido_por: true,
      subido_en: true,
    },
  },
  detalles_nomina: {
    orderBy: {
      numero_fila: "asc",
    },
    select: {
      id: true,
      numero_fila: true,
      beneficiario_id: true,
      tipo_documento: true,
      numero_documento: true,
      nombre_trabajador: true,
      concepto_nomina: true,
      medio_pago: true,
      banco: true,
      tipo_cuenta_bancaria: true,
      numero_cuenta_bancaria: true,
      valor_bruto: true,
      valor_retenciones: true,
      valor_descuentos: true,
      valor_neto: true,
      estado_validacion: true,
      errores_validacion: true,
      creado_en: true,
      actualizado_en: true,
    },
  },
} satisfies Prisma.solicitudes_pagoInclude;

function construirClaveDocumento(
  tipoDocumento: string,
  numeroDocumento: string,
): string {
  return `${tipoDocumento.trim().toUpperCase()}|${numeroDocumento
    .trim()
    .toUpperCase()}`;
}

export async function obtenerBeneficiariosNominaPorDocumentosRepository(
  documentos: Array<{
    tipo_documento: string;
    numero_documento: string;
  }>,
): Promise<BeneficiarioNominaGrupalRepositoryResult[]> {
  const documentosUnicos = Array.from(
    new Map(
      documentos.map((documento) => [
        construirClaveDocumento(
          documento.tipo_documento,
          documento.numero_documento,
        ),
        {
          tipo_documento: documento.tipo_documento.trim().toUpperCase(),
          numero_documento: documento.numero_documento.trim().toUpperCase(),
        },
      ]),
    ).values(),
  );

  if (documentosUnicos.length === 0) {
    return [];
  }

  return prisma.beneficiarios_pago.findMany({
    where: {
      OR: documentosUnicos.map((documento) => ({
        tipo_documento: {
          equals: documento.tipo_documento,
          mode: "insensitive",
        },
        numero_documento: {
          equals: documento.numero_documento,
          mode: "insensitive",
        },
      })),
    },
    select: {
      id: true,
      nombre: true,
      tipo_beneficiario: true,
      tipo_documento: true,
      numero_documento: true,
      medio_pago_preferido: true,
      banco: true,
      tipo_cuenta_bancaria: true,
      numero_cuenta_bancaria: true,
      activo: true,
    },
  });
}

export async function obtenerAdjuntoNominaGrupalPorIdRepository(id: string) {
  return prisma.adjuntos.findUnique({
    where: {
      id,
    },
  });
}

export async function crearAdjuntoNominaGrupalRepository(
  data: CrearAdjuntoNominaGrupalRepositoryInput,
) {
  return prisma.adjuntos.create({
    data: {
      ...(data.id ? { id: data.id } : {}),
      solicitud_pago_id: data.solicitud_pago_id ?? null,
      nombre_archivo: data.nombre_archivo,
      ruta_archivo: data.ruta_archivo,
      nombre_bucket: data.nombre_bucket,
      tipo_mime: data.tipo_mime,
      tamano_archivo: data.tamano_archivo,
      subido_por: data.subido_por,
      estado_ocr: data.estado_ocr,
    },
  });
}

export async function eliminarAdjuntoNominaGrupalRepository(id: string) {
  return prisma.adjuntos.delete({
    where: {
      id,
    },
  });
}

export async function buscarDuplicadosNominaGrupalRepository(
  input: DuplicadoNominaGrupalRepositoryInput,
): Promise<DuplicadoNominaGrupalRepositoryResult[]> {
  if (input.combinaciones.length === 0) {
    return [];
  }

  const combinacionesConBeneficiario = input.combinaciones.filter(
    (
      combinacion,
    ): combinacion is typeof combinacion & { beneficiario_id: string } =>
      Boolean(combinacion.beneficiario_id),
  );

  const condicionesIndividuales: Prisma.solicitudes_pagoWhereInput[] =
    combinacionesConBeneficiario.map((combinacion) => ({
      beneficiario_id: combinacion.beneficiario_id,
      concepto_nomina: {
        equals: combinacion.concepto_nomina,
        mode: "insensitive",
      },
    }));

  const condicionesGrupales: Prisma.detalles_nomina_solicitudWhereInput[] =
    input.combinaciones.map((combinacion) => ({
      concepto_nomina: {
        equals: combinacion.concepto_nomina,
        mode: "insensitive",
      },
      OR: [
        ...(combinacion.beneficiario_id
          ? [
              {
                beneficiario_id: combinacion.beneficiario_id,
              },
            ]
          : []),
        {
          tipo_documento: {
            equals: combinacion.tipo_documento,
            mode: "insensitive",
          },
          numero_documento: {
            equals: combinacion.numero_documento,
            mode: "insensitive",
          },
        },
      ],
    }));

  const [duplicadosIndividuales, duplicadosGrupales] =
    await prisma.$transaction([
      prisma.solicitudes_pago.findMany({
        where: {
          tipo_solicitud: "PAGO_NOMINA",
          modalidad_nomina: "INDIVIDUAL",
          proyecto_base_id: input.proyecto_base_id,
          centro_costo_id: input.centro_costo_id,
          periodo_nomina: input.periodo_nomina,
          estado_actual: {
            not: "ANULADA",
          },
          ...(condicionesIndividuales.length > 0
            ? {
                OR: condicionesIndividuales,
              }
            : {
                id: "__sin_coincidencias__",
              }),
        },
        select: {
          id: true,
          numero_solicitud: true,
          beneficiario_id: true,
          concepto_nomina: true,
          periodo_nomina: true,
          estado_actual: true,
          beneficiario: {
            select: {
              tipo_documento: true,
              numero_documento: true,
            },
          },
        },
      }),
      prisma.detalles_nomina_solicitud.findMany({
        where: {
          OR: condicionesGrupales,
          solicitud_pago: {
            tipo_solicitud: "PAGO_NOMINA",
            modalidad_nomina: "AGRUPADA_EXCEL",
            proyecto_base_id: input.proyecto_base_id,
            centro_costo_id: input.centro_costo_id,
            periodo_nomina: input.periodo_nomina,
            estado_actual: {
              not: "ANULADA",
            },
          },
        },
        select: {
          beneficiario_id: true,
          tipo_documento: true,
          numero_documento: true,
          concepto_nomina: true,
          solicitud_pago: {
            select: {
              id: true,
              numero_solicitud: true,
              periodo_nomina: true,
              estado_actual: true,
            },
          },
        },
      }),
    ]);

  const resultadosIndividuales: DuplicadoNominaGrupalRepositoryResult[] =
    duplicadosIndividuales.map((solicitud) => ({
      solicitud_pago_id: solicitud.id,
      numero_solicitud: solicitud.numero_solicitud,
      beneficiario_id: solicitud.beneficiario_id,
      tipo_documento: solicitud.beneficiario?.tipo_documento ?? "",
      numero_documento: solicitud.beneficiario?.numero_documento ?? "",
      concepto_nomina: solicitud.concepto_nomina ?? "",
      periodo_nomina: solicitud.periodo_nomina ?? input.periodo_nomina,
      estado_actual: solicitud.estado_actual,
    }));

  const resultadosGrupales: DuplicadoNominaGrupalRepositoryResult[] =
    duplicadosGrupales.map((detalle) => ({
      solicitud_pago_id: detalle.solicitud_pago.id,
      numero_solicitud: detalle.solicitud_pago.numero_solicitud,
      beneficiario_id: detalle.beneficiario_id,
      tipo_documento: detalle.tipo_documento,
      numero_documento: detalle.numero_documento,
      concepto_nomina: detalle.concepto_nomina,
      periodo_nomina:
        detalle.solicitud_pago.periodo_nomina ?? input.periodo_nomina,
      estado_actual: detalle.solicitud_pago.estado_actual,
    }));

  return [...resultadosIndividuales, ...resultadosGrupales];
}

export async function crearSolicitudNominaGrupalRepository(
  data: CrearSolicitudNominaGrupalRepositoryInput,
) {
  return prisma.$transaction(
    async (tx) => {
      const adjunto = await tx.adjuntos.findUnique({
        where: { id: data.adjunto_archivo_origen_id },
        select: { id: true, solicitud_pago_id: true },
      });

      if (!adjunto) {
        throw new Error("El archivo de origen de la nómina no existe.");
      }

      if (adjunto.solicitud_pago_id) {
        throw new Error(
          "El archivo de origen ya está asociado a otra solicitud de pago.",
        );
      }

      const beneficiariosCreados: BeneficiarioCreadoNominaGrupal[] = [];

      for (const beneficiarioInput of data.beneficiarios_faltantes) {
        const existente = await tx.beneficiarios_pago.findFirst({
          where: {
            tipo_documento: {
              equals: beneficiarioInput.tipo_documento,
              mode: "insensitive",
            },
            numero_documento: {
              equals: beneficiarioInput.numero_documento,
              mode: "insensitive",
            },
          },
          select: {
            id: true,
            tipo_beneficiario: true,
            activo: true,
          },
        });

        if (existente) {
          if (
            existente.tipo_beneficiario !== "TRABAJADOR" ||
            !existente.activo
          ) {
            throw new Error(
              `El beneficiario ${beneficiarioInput.tipo_documento} ${beneficiarioInput.numero_documento} ya existe, pero no está disponible como trabajador activo.`,
            );
          }

          continue;
        }

        const creado = await tx.beneficiarios_pago.create({
          data: {
            tipo_beneficiario: "TRABAJADOR",
            proveedor_id: null,
            usuario_id: null,
            nombre: beneficiarioInput.nombre,
            tipo_documento: beneficiarioInput.tipo_documento,
            numero_documento: beneficiarioInput.numero_documento,
            medio_pago_preferido:
              beneficiarioInput.medio_pago_preferido,
            banco: beneficiarioInput.banco,
            tipo_cuenta_bancaria:
              beneficiarioInput.tipo_cuenta_bancaria,
            numero_cuenta_bancaria:
              beneficiarioInput.numero_cuenta_bancaria,
            telefono: null,
            correo: null,
            notas:
              "Creado automáticamente desde cargue de nómina grupal.",
            activo: true,
          },
          select: {
            id: true,
            tipo_documento: true,
            numero_documento: true,
            nombre: true,
          },
        });

        beneficiariosCreados.push(creado);
      }

      const documentosDetalles = Array.from(
        new Map(
          data.detalles.map((detalle) => [
            construirClaveDocumento(
              detalle.tipo_documento,
              detalle.numero_documento,
            ),
            {
              tipo_documento: detalle.tipo_documento,
              numero_documento: detalle.numero_documento,
            },
          ]),
        ).values(),
      );

      const beneficiariosActuales =
        await tx.beneficiarios_pago.findMany({
          where: {
            OR: documentosDetalles.map((documento) => ({
              tipo_documento: {
                equals: documento.tipo_documento,
                mode: "insensitive",
              },
              numero_documento: {
                equals: documento.numero_documento,
                mode: "insensitive",
              },
              tipo_beneficiario: "TRABAJADOR",
              activo: true,
            })),
          },
          select: {
            id: true,
            tipo_documento: true,
            numero_documento: true,
          },
        });

      const beneficiariosPorDocumento = new Map(
        beneficiariosActuales
          .filter(
            (beneficiario) =>
              beneficiario.tipo_documento &&
              beneficiario.numero_documento,
          )
          .map((beneficiario) => [
            construirClaveDocumento(
              beneficiario.tipo_documento!,
              beneficiario.numero_documento!,
            ),
            beneficiario.id,
          ]),
      );

      const detallesConBeneficiario = data.detalles.map((detalle) => {
        const beneficiarioId =
          detalle.beneficiario_id ??
          beneficiariosPorDocumento.get(
            construirClaveDocumento(
              detalle.tipo_documento,
              detalle.numero_documento,
            ),
          ) ??
          null;

        if (!beneficiarioId) {
          throw new Error(
            `No fue posible asociar el trabajador de la fila ${detalle.numero_fila}.`,
          );
        }

        return { ...detalle, beneficiario_id: beneficiarioId };
      });

      const solicitud = await tx.solicitudes_pago.create({
        data: {
          numero_solicitud: data.numero_solicitud,
          tipo_solicitud: "PAGO_NOMINA",
          modalidad_nomina: "AGRUPADA_EXCEL",
          periodo_nomina: data.periodo_nomina,
          proyecto_base_id: data.proyecto_base_id,
          fondo_id: data.fondo_id,
          centro_costo_id: data.centro_costo_id,
          beneficiario_id: null,
          proveedor_id: null,
          categoria_gasto: null,
          categoria_reembolso: null,
          concepto_nomina: null,
          medio_pago: null,
          adjunto_archivo_origen_id:
            data.adjunto_archivo_origen_id,
          descripcion: data.descripcion,
          valor_bruto: data.valor_bruto,
          valor_impuestos: 0,
          valor_retenciones: data.valor_retenciones,
          valor_descuentos: data.valor_descuentos,
          valor_neto: data.valor_neto,
          estado_actual: "BORRADOR",
          creado_por: data.creado_por,
          detalles_nomina: {
            create: detallesConBeneficiario.map((detalle) => ({
              numero_fila: detalle.numero_fila,
              beneficiario_id: detalle.beneficiario_id,
              tipo_documento: detalle.tipo_documento,
              numero_documento: detalle.numero_documento,
              nombre_trabajador: detalle.nombre_trabajador,
              concepto_nomina: detalle.concepto_nomina,
              medio_pago: detalle.medio_pago,
              banco: detalle.banco,
              tipo_cuenta_bancaria:
                detalle.tipo_cuenta_bancaria,
              numero_cuenta_bancaria:
                detalle.numero_cuenta_bancaria,
              valor_bruto: detalle.valor_bruto,
              valor_retenciones: detalle.valor_retenciones,
              valor_descuentos: detalle.valor_descuentos,
              valor_neto: detalle.valor_neto,
              estado_validacion: "VALIDO",
              ...(detalle.errores_validacion
                ? {
                    errores_validacion:
                      detalle.errores_validacion as Prisma.InputJsonValue,
                  }
                : {}),
            })),
          },
        },
        include: solicitudNominaGrupalInclude,
      });

      await tx.adjuntos.update({
        where: { id: data.adjunto_archivo_origen_id },
        data: { solicitud_pago_id: solicitud.id },
      });

      return {
        solicitud,
        beneficiarios_creados: beneficiariosCreados,
      };
    },
    {
      isolationLevel:
        Prisma.TransactionIsolationLevel.Serializable,
    },
  );
}

export async function obtenerNominaGrupalPorSolicitudIdRepository(
  solicitudId: string,
) {
  return prisma.solicitudes_pago.findFirst({
    where: {
      id: solicitudId,
      tipo_solicitud: "PAGO_NOMINA",
      modalidad_nomina: "AGRUPADA_EXCEL",
    },
    include: solicitudNominaGrupalInclude,
  });
}
