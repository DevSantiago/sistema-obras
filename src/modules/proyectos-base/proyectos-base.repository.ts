import { prisma } from "@/lib/prisma";
import type {
  CentroCostoGenerado,
  CrearProyectoBaseInput,
  ProyectoBaseListFilters,
} from "./proyectos-base.types";

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
      centros_costo: true,
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
      centros_costo: true,
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
    const proyectoBase = await tx.proyectos_base.create({
      data: {
        nombre: input.nombre,
        descripcion: input.descripcion,
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
      centrosCosto.map((centro) =>
        tx.centros_costo.create({
          data: {
            proyecto_base_id: proyectoBase.id,
            linea_negocio: centro.linea_negocio,
            fase_centro_costo: centro.fase_centro_costo,
            prefijo: centro.prefijo,
            codigo: centro.codigo,
            nombre: centro.nombre,
            descripcion: centro.descripcion,
            estado_centro_costo: centro.estado_centro_costo,
          },
        }),
      ),
    );

    return {
      ...proyectoBase,
      fondo,
      centros_costo: centrosCreados,
    };
  });
}