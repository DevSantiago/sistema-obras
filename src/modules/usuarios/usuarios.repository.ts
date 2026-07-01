import { prisma } from "@/lib/prisma";
import type { AccesoUsuarioInput } from "./usuarios.types";

const incluirRolConPermisos = {
  roles: {
    include: {
      rol: {
        include: {
          permisos: {
            include: {
              permiso: true,
            },
          },
        },
      },
    },
  },
};

const incluirRolPermisosYAccesos = {
  roles: {
    include: {
      rol: {
        include: {
          permisos: {
            include: {
              permiso: true,
            },
          },
        },
      },
    },
  },
  accesos_recibidos: {
    where: {
      activo: true,
    },
    include: {
      proyecto_base: true,
    },
    orderBy: {
      asignado_en: "asc" as const,
    },
  },
};

export async function buscarUsuarioPorCorreoConRoles(correo: string) {
  return prisma.usuarios.findUnique({
    where: { correo },
    include: incluirRolConPermisos,
  });
}

export async function buscarUsuarioPorIdConRoles(id: string) {
  return prisma.usuarios.findUnique({
    where: { id },
    include: incluirRolPermisosYAccesos,
  });
}

export async function listarUsuariosConRoles() {
  return prisma.usuarios.findMany({
    orderBy: {
      creado_en: "desc",
    },
    include: incluirRolPermisosYAccesos,
  });
}

export async function buscarUsuarioPorCorreo(correo: string) {
  return prisma.usuarios.findUnique({
    where: { correo },
  });
}

export async function buscarUsuarioPorNumeroDocumento(
  numeroDocumento: string,
) {
  return prisma.usuarios.findUnique({
    where: {
      numero_documento: numeroDocumento,
    },
  });
}

export async function buscarUsuarioPorCorreoDiferenteId(
  correo: string,
  id: string,
) {
  return prisma.usuarios.findFirst({
    where: {
      correo,
      NOT: { id },
    },
  });
}

export async function buscarRolActivoPorNombre(nombre: string) {
  return prisma.roles.findFirst({
    where: {
      nombre,
      activo: true,
    },
    include: {
      lineas_negocio: true,
    },
  });
}

export async function buscarCentrosCostoActivosPorAccesos(
  accesos: AccesoUsuarioInput[],
) {
  if (accesos.length === 0) {
    return [];
  }

  return prisma.centros_costo.findMany({
    where: {
      activo: true,
      proyecto_base: {
        is: {
          activo: true,
        },
      },
      OR: accesos.map((acceso) => ({
        proyecto_base_id: acceso.proyecto_base_id,
        linea_negocio: acceso.linea_negocio,
      })),
    },
    select: {
      proyecto_base_id: true,
      linea_negocio: true,
    },
    distinct: ["proyecto_base_id", "linea_negocio"],
  });
}

export async function crearUsuarioEnBD(data: {
  tipo_documento: string;
  numero_documento: string;
  nombre: string;
  correo: string;
  telefono?: string | null;
  password_hash: string;
  estado: string;
  rol_id: string;
  accesos: AccesoUsuarioInput[];
  asignado_por: string;
}) {
  return prisma.$transaction(async (tx) => {
    const usuarioCreado = await tx.usuarios.create({
      data: {
        tipo_documento: data.tipo_documento,
        numero_documento: data.numero_documento,
        nombre: data.nombre,
        correo: data.correo,
        telefono: data.telefono,
        password_hash: data.password_hash,
        estado: data.estado,
      },
    });

    await tx.usuarios_roles.create({
      data: {
        usuario_id: usuarioCreado.id,
        rol_id: data.rol_id,
      },
    });

    if (data.accesos.length > 0) {
      await tx.accesos_usuario_proyecto.createMany({
        data: data.accesos.map((acceso) => ({
          usuario_id: usuarioCreado.id,
          proyecto_base_id: acceso.proyecto_base_id,
          linea_negocio: acceso.linea_negocio,
          asignado_por: data.asignado_por,
        })),
      });
    }

    return tx.usuarios.findUniqueOrThrow({
      where: {
        id: usuarioCreado.id,
      },
      include: incluirRolPermisosYAccesos,
    });
  });
}

export async function actualizarUsuarioEnBD(
  id: string,
  data: {
    nombre?: string;
    correo?: string;
    telefono?: string | null;
    rol_id?: string;
    accesos?: AccesoUsuarioInput[];
    actualizado_por: string;
  },
) {
  return prisma.$transaction(async (tx) => {
    await tx.usuarios.update({
      where: { id },
      data: {
        nombre: data.nombre,
        correo: data.correo,
        telefono: data.telefono,
      },
    });

    if (data.rol_id !== undefined) {
      await tx.usuarios_roles.upsert({
        where: {
          usuario_id: id,
        },
        update: {
          rol_id: data.rol_id,
        },
        create: {
          usuario_id: id,
          rol_id: data.rol_id,
        },
      });
    }

    if (data.accesos !== undefined) {
      const ahora = new Date();

      const accesosExistentes = await tx.accesos_usuario_proyecto.findMany({
        where: {
          usuario_id: id,
        },
      });

      const clavesSolicitadas = new Set(
        data.accesos.map(
          (acceso) => `${acceso.proyecto_base_id}:${acceso.linea_negocio}`,
        ),
      );

      for (const accesoExistente of accesosExistentes) {
        const clave =
          `${accesoExistente.proyecto_base_id}:` +
          accesoExistente.linea_negocio;

        if (!clavesSolicitadas.has(clave) && accesoExistente.activo) {
          await tx.accesos_usuario_proyecto.update({
            where: {
              id: accesoExistente.id,
            },
            data: {
              activo: false,
              revocado_por: data.actualizado_por,
              revocado_en: ahora,
            },
          });
        }
      }

      for (const accesoSolicitado of data.accesos) {
        const accesoExistente = accesosExistentes.find(
          (acceso) =>
            acceso.proyecto_base_id === accesoSolicitado.proyecto_base_id &&
            acceso.linea_negocio === accesoSolicitado.linea_negocio,
        );

        if (!accesoExistente) {
          await tx.accesos_usuario_proyecto.create({
            data: {
              usuario_id: id,
              proyecto_base_id: accesoSolicitado.proyecto_base_id,
              linea_negocio: accesoSolicitado.linea_negocio,
              asignado_por: data.actualizado_por,
              asignado_en: ahora,
            },
          });

          continue;
        }

        if (!accesoExistente.activo) {
          await tx.accesos_usuario_proyecto.update({
            where: {
              id: accesoExistente.id,
            },
            data: {
              activo: true,
              asignado_por: data.actualizado_por,
              asignado_en: ahora,
              revocado_por: null,
              revocado_en: null,
            },
          });
        }
      }
    }

    return tx.usuarios.findUniqueOrThrow({
      where: { id },
      include: incluirRolPermisosYAccesos,
    });
  });
}

export async function actualizarEstadoUsuarioEnBD(
  id: string,
  estado: "ACTIVO" | "INACTIVO",
) {
  return prisma.usuarios.update({
    where: { id },
    data: { estado },
    include: incluirRolPermisosYAccesos,
  });
}