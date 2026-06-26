import { prisma } from "@/lib/prisma";
import type {
  CentroCostoGenerado,
  CrearProyectoBaseInput,
  ProyectoBaseListFilters,
} from "./proyectos-base.types";

type EstadoCentroCosto = "EN_LICITACION" | "EN_EJECUCION" | "FINALIZADO";

type CambiarEstadoCentroCostoRepositoryInput = {
  estado_centro_costo: EstadoCentroCosto;
  observacion?: string;
  usuario_id: string;
};

function obtenerEstadoProyectoBase(centrosCosto: CentroCostoGenerado[]) {
  const tieneCentroEnEjecucion = centrosCosto.some(
    (centro) => centro.fase_centro_costo === "EJECUCION",
  );

  return tieneCentroEnEjecucion ? "EN_EJECUCION" : "EN_LICITACION";
}

function calcularEstadoProyectoBase(
  centrosCosto: Array<{ estado_centro_costo: string }>,
) {
  const todosFinalizados =
    centrosCosto.length > 0 &&
    centrosCosto.every(
      (centroCosto) => centroCosto.estado_centro_costo === "FINALIZADO",
    );

  if (todosFinalizados) {
    return "FINALIZADO";
  }

  const tieneCentrosEnEjecucion = centrosCosto.some(
    (centroCosto) => centroCosto.estado_centro_costo === "EN_EJECUCION",
  );

  if (tieneCentrosEnEjecucion) {
    return "EN_EJECUCION";
  }

  return "EN_LICITACION";
}

function obtenerPrefijoEjecucion(lineaNegocio: string) {
  return lineaNegocio === "OBRA" ? "OBRA" : "INT";
}

export async function listarProyectosBaseRepository(
  filters: ProyectoBaseListFilters = {},
) {
  return prisma.proyectos_base.findMany({
    where: {
      ...(filters.estado_proyecto
        ? { estado_proyecto: filters.estado_proyecto }
        : {}),
      ...(typeof filters.activo === "boolean" ? { activo: filters.activo } : {}),
    },
    include: {
      centros_costo: {
        orderBy: [
          {
            linea_negocio: "asc",
          },
          {
            fase_centro_costo: "asc",
          },
        ],
      },
      fondo: true,
    },
    orderBy: {
      creado_en: "desc",
    },
  });
}

export async function obtenerProyectoBasePorIdRepository(id: string) {
  return prisma.proyectos_base.findUnique({
    where: { id },
    include: {
      centros_costo: {
        orderBy: [
          {
            linea_negocio: "asc",
          },
          {
            fase_centro_costo: "asc",
          },
        ],
      },
      fondo: true,
    },
  });
}

export async function existeProyectoBasePorNombreRepository(nombre: string) {
  const proyecto = await prisma.proyectos_base.findFirst({
    where: {
      nombre,
      activo: true,
    },
    select: {
      id: true,
    },
  });

  return Boolean(proyecto);
}

export async function crearProyectoBaseConCentroCostoRepository(
  input: CrearProyectoBaseInput,
  centrosCosto: CentroCostoGenerado[],
) {
  return prisma.$transaction(async (tx) => {
    const estadoProyecto = obtenerEstadoProyectoBase(centrosCosto);
    const ahora = new Date();

    const proyectoBase = await tx.proyectos_base.create({
      data: {
        nombre: input.nombre,
        descripcion: input.descripcion,
        estado_proyecto: estadoProyecto,
        creado_por: input.creado_por,
      },
    });

    const fondo = await tx.fondos.create({
      data: {
        proyecto_base_id: proyectoBase.id,
        nombre: `FONDO GENERAL - ${proyectoBase.nombre}`,
        creado_por: input.creado_por,
      },
    });

    const centrosCreados = await Promise.all(
      centrosCosto.map((centro) => {
        const esCentroEnEjecucion = centro.fase_centro_costo === "EJECUCION";

        return tx.centros_costo.create({
          data: {
            proyecto_base_id: proyectoBase.id,
            linea_negocio: centro.linea_negocio,
            fase_centro_costo: centro.fase_centro_costo,
            prefijo: centro.prefijo,
            codigo: centro.codigo,
            nombre: centro.nombre,
            descripcion: centro.descripcion,
            estado_centro_costo: centro.estado_centro_costo,
            creado_directamente_en_ejecucion: esCentroEnEjecucion,
            motivo_creacion_ejecucion: esCentroEnEjecucion
              ? "Centro de costo creado directamente en fase de ejecución."
              : null,
            fecha_inicio_ejecucion: esCentroEnEjecucion ? ahora : null,
            observacion_inicio_ejecucion: esCentroEnEjecucion
              ? "Centro de costo creado desde la creación inicial del proyecto base."
              : null,
            inicio_ejecucion_por: esCentroEnEjecucion ? input.creado_por : null,
            inicio_ejecucion_en: esCentroEnEjecucion ? ahora : null,
          },
        });
      }),
    );

    return {
      ...proyectoBase,
      fondo,
      centros_costo: centrosCreados,
    };
  });
}

export async function obtenerCentroCostoPorProyectoRepository(
  proyectoBaseId: string,
  centroCostoId: string,
) {
  return prisma.centros_costo.findFirst({
    where: {
      id: centroCostoId,
      proyecto_base_id: proyectoBaseId,
      activo: true,
    },
  });
}

export async function cambiarEstadoCentroCostoRepository(
  proyectoBaseId: string,
  centroCostoId: string,
  input: CambiarEstadoCentroCostoRepositoryInput,
) {
  return prisma.$transaction(async (tx) => {
    const ahora = new Date();

    const proyectoBase = await tx.proyectos_base.findUnique({
      where: {
        id: proyectoBaseId,
      },
    });

    if (!proyectoBase) {
      throw new Error("El proyecto base no existe.");
    }

    const centroCostoActual = await tx.centros_costo.findFirst({
      where: {
        id: centroCostoId,
        proyecto_base_id: proyectoBaseId,
        activo: true,
      },
    });

    if (!centroCostoActual) {
      throw new Error("El centro de costo no existe para este proyecto base.");
    }

    if (
      centroCostoActual.fase_centro_costo === "LICITACION" &&
      input.estado_centro_costo === "EN_EJECUCION"
    ) {
      const prefijoEjecucion = obtenerPrefijoEjecucion(
        centroCostoActual.linea_negocio,
      );
      const codigoEjecucion = `${prefijoEjecucion} - ${proyectoBase.nombre}`;

      await tx.centros_costo.update({
        where: {
          id: centroCostoActual.id,
        },
        data: {
          estado_centro_costo: "FINALIZADO",
        },
      });

      const centroEjecucionExistente = await tx.centros_costo.findFirst({
        where: {
          proyecto_base_id: proyectoBaseId,
          linea_negocio: centroCostoActual.linea_negocio,
          fase_centro_costo: "EJECUCION",
        },
      });

      if (centroEjecucionExistente) {
        await tx.centros_costo.update({
          where: {
            id: centroEjecucionExistente.id,
          },
          data: {
            estado_centro_costo: "EN_EJECUCION",
            activo: true,
            fecha_inicio_ejecucion: ahora,
            observacion_inicio_ejecucion: input.observacion,
            inicio_ejecucion_por: input.usuario_id,
            inicio_ejecucion_en: ahora,
          },
        });
      } else {
        await tx.centros_costo.create({
          data: {
            proyecto_base_id: proyectoBaseId,
            linea_negocio: centroCostoActual.linea_negocio,
            fase_centro_costo: "EJECUCION",
            prefijo: prefijoEjecucion,
            codigo: codigoEjecucion,
            nombre: codigoEjecucion,
            descripcion: centroCostoActual.descripcion,
            estado_centro_costo: "EN_EJECUCION",
            creado_directamente_en_ejecucion: false,
            motivo_creacion_ejecucion:
              "Centro de costo creado al iniciar fase de ejecución.",
            fecha_inicio_ejecucion: ahora,
            observacion_inicio_ejecucion: input.observacion,
            inicio_ejecucion_por: input.usuario_id,
            inicio_ejecucion_en: ahora,
          },
        });
      }
    } else {
      await tx.centros_costo.update({
        where: {
          id: centroCostoActual.id,
        },
        data: {
          estado_centro_costo: input.estado_centro_costo,
        },
      });
    }

    const centrosCostoProyecto = await tx.centros_costo.findMany({
      where: {
        proyecto_base_id: proyectoBaseId,
        activo: true,
      },
      select: {
        estado_centro_costo: true,
      },
    });

    const estadoProyecto = calcularEstadoProyectoBase(centrosCostoProyecto);

    const proyectoBaseActualizado = await tx.proyectos_base.update({
      where: {
        id: proyectoBaseId,
      },
      data: {
        estado_proyecto: estadoProyecto,
      },
      include: {
        centros_costo: {
          orderBy: [
            {
              linea_negocio: "asc",
            },
            {
              fase_centro_costo: "asc",
            },
          ],
        },
        fondo: true,
      },
    });

    return proyectoBaseActualizado;
  });
}