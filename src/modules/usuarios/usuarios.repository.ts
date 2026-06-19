import { prisma } from "@/lib/prisma";

export async function buscarUsuarioPorCorreoConRoles(correo: string) {
  return prisma.usuarios.findUnique({
    where: {
      correo,
    },
    include: {
      roles: {
        include: {
          rol: true,
        },
      },
    },
  });
}

export async function buscarUsuarioPorIdConRoles(id: string) {
  return prisma.usuarios.findUnique({
    where: {
      id,
    },
    include: {
      roles: {
        include: {
          rol: true,
        },
      },
    },
  });
}

export async function listarUsuariosConRoles() {
  return prisma.usuarios.findMany({
    orderBy: {
      creado_en: "desc",
    },
    include: {
      roles: {
        include: {
          rol: true,
        },
      },
    },
  });
}

export async function buscarUsuarioPorCorreo(correo: string) {
  return prisma.usuarios.findUnique({
    where: {
      correo,
    },
  });
}

export async function buscarUsuarioPorNumeroDocumento(
  numeroDocumento: string
) {
  return prisma.usuarios.findUnique({
    where: {
      numero_documento: numeroDocumento,
    },
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
}) {
  return prisma.usuarios.create({
    data: {
      tipo_documento: data.tipo_documento,
      numero_documento: data.numero_documento,
      nombre: data.nombre,
      correo: data.correo,
      telefono: data.telefono,
      password_hash: data.password_hash,
      estado: data.estado,
    },
    include: {
      roles: {
        include: {
          rol: true,
        },
      },
    },
  });
}

export async function buscarUsuarioPorCorreoDiferenteId(
  correo: string,
  id: string
) {
  return prisma.usuarios.findFirst({
    where: {
      correo,
      NOT: {
        id,
      },
    },
  });
}

export async function actualizarUsuarioEnBD(
  id: string,
  data: {
    nombre?: string;
    correo?: string;
    telefono?: string | null;
  }
) {
  return prisma.usuarios.update({
    where: {
      id,
    },
    data: {
      nombre: data.nombre,
      correo: data.correo,
      telefono: data.telefono,
    },
    include: {
      roles: {
        include: {
          rol: true,
        },
      },
    },
  });
}

export async function actualizarEstadoUsuarioEnBD(
  id: string,
  estado: "ACTIVO" | "INACTIVO"
) {
  return prisma.usuarios.update({
    where: {
      id,
    },
    data: {
      estado,
    },
    include: {
      roles: {
        include: {
          rol: true,
        },
      },
    },
  });
}