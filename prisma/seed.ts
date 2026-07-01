import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

const rolesBase = [
  {
    nombre: "ADMINISTRADOR",
    descripcion:
      "Superusuario técnico con acceso total al sistema, reservado para administración, soporte y parametrización.",
  },
  {
    nombre: "DIRECTOR",
    descripcion:
      "Responsable de proyectos asignados. Puede crear solicitudes, proyectos, usuarios y asignar accesos, pero no aprueba ni marca pagos.",
  },
  {
    nombre: "APROBADOR_1",
    descripcion:
      "Socio operativo. Supervisa la ejecución, consulta la operación y aprueba solicitudes en primer nivel.",
  },
  {
    nombre: "APROBADOR_2",
    descripcion:
      "Socio financiero. Consulta la operación y aprueba solicitudes en segundo nivel.",
  },
  {
    nombre: "AUXILIAR_CONTABLE",
    descripcion: "Crea solicitudes y apoya la gestión contable.",
  },
  {
    nombre: "PAGOS",
    descripcion: "Marca solicitudes como pagadas cuando corresponda.",
  },
  {
    nombre: "SOLICITANTE",
    descripcion: "Crea solicitudes en proyectos de la línea de obra.",
  },
];

const rolesObsoletos = ["LECTURA"];

const permisosBase = [
  {
    codigo: "CREAR_SOLICITUDES",
    nombre: "Crear solicitudes",
    descripcion: "Permite crear solicitudes de pago.",
  },
  {
    codigo: "CREAR_PROYECTOS",
    nombre: "Crear proyectos",
    descripcion: "Permite crear proyectos base y sus líneas de negocio.",
  },
  {
    codigo: "CREAR_USUARIOS",
    nombre: "Crear usuarios",
    descripcion: "Permite crear usuarios del sistema.",
  },
  {
    codigo: "ASIGNAR_ACCESOS",
    nombre: "Asignar accesos",
    descripcion:
      "Permite asignar accesos de usuarios a proyectos y líneas de negocio.",
  },
  {
    codigo: "APROBAR_NIVEL_1",
    nombre: "Aprobar en primer nivel",
    descripcion: "Permite aprobar solicitudes en el primer nivel operativo.",
  },
  {
    codigo: "APROBAR_NIVEL_2",
    nombre: "Aprobar en segundo nivel",
    descripcion: "Permite aprobar solicitudes en el segundo nivel financiero.",
  },
  {
    codigo: "MARCAR_COMO_PAGADO",
    nombre: "Marcar como pagado",
    descripcion: "Permite marcar solicitudes como pagadas.",
  },
  {
    codigo: "CONSULTAR_TODO",
    nombre: "Consultar todo",
    descripcion:
      "Permite consultar información global del sistema sin limitarse a accesos asignados.",
  },
];

const permisosPorRol: Record<string, string[]> = {
  ADMINISTRADOR: [
    "CREAR_SOLICITUDES",
    "CREAR_PROYECTOS",
    "CREAR_USUARIOS",
    "ASIGNAR_ACCESOS",
    "APROBAR_NIVEL_1",
    "APROBAR_NIVEL_2",
    "MARCAR_COMO_PAGADO",
    "CONSULTAR_TODO",
  ],
  DIRECTOR: [
    "CREAR_SOLICITUDES",
    "CREAR_PROYECTOS",
    "CREAR_USUARIOS",
    "ASIGNAR_ACCESOS",
  ],
  APROBADOR_1: [
    "CREAR_SOLICITUDES",
    "CREAR_PROYECTOS",
    "CREAR_USUARIOS",
    "ASIGNAR_ACCESOS",
    "APROBAR_NIVEL_1",
    "CONSULTAR_TODO",
  ],
  APROBADOR_2: ["APROBAR_NIVEL_2", "CONSULTAR_TODO"],
  AUXILIAR_CONTABLE: ["CREAR_SOLICITUDES"],
  PAGOS: ["MARCAR_COMO_PAGADO"],
  SOLICITANTE: ["CREAR_SOLICITUDES"],
};

const lineasNegocioPorRol: Record<string, string[]> = {
  ADMINISTRADOR: ["OBRA", "INTERVENTORIA"],
  DIRECTOR: ["OBRA", "INTERVENTORIA"],
  APROBADOR_1: ["OBRA", "INTERVENTORIA"],
  APROBADOR_2: ["OBRA", "INTERVENTORIA"],
  AUXILIAR_CONTABLE: ["OBRA", "INTERVENTORIA"],
  PAGOS: ["OBRA", "INTERVENTORIA"],
  SOLICITANTE: ["OBRA"],
};

async function crearOActualizarRoles() {
  for (const rol of rolesBase) {
    await prisma.roles.upsert({
      where: {
        nombre: rol.nombre,
      },
      update: {
        descripcion: rol.descripcion,
        activo: true,
      },
      create: {
        nombre: rol.nombre,
        descripcion: rol.descripcion,
        activo: true,
      },
    });
  }

  await prisma.roles.updateMany({
    where: {
      nombre: {
        in: rolesObsoletos,
      },
    },
    data: {
      activo: false,
    },
  });
}

async function crearOActualizarPermisos() {
  for (const permiso of permisosBase) {
    await prisma.permisos.upsert({
      where: {
        codigo: permiso.codigo,
      },
      update: {
        nombre: permiso.nombre,
        descripcion: permiso.descripcion,
        activo: true,
      },
      create: {
        codigo: permiso.codigo,
        nombre: permiso.nombre,
        descripcion: permiso.descripcion,
        activo: true,
      },
    });
  }
}

async function sincronizarPermisosPorRol() {
  const roles = await prisma.roles.findMany({
    where: {
      nombre: {
        in: Object.keys(permisosPorRol),
      },
      activo: true,
    },
  });

  const permisos = await prisma.permisos.findMany({
    where: {
      codigo: {
        in: permisosBase.map((permiso) => permiso.codigo),
      },
      activo: true,
    },
  });

  const rolesPorNombre = new Map(roles.map((rol) => [rol.nombre, rol]));

  const permisosPorCodigo = new Map(
    permisos.map((permiso) => [permiso.codigo, permiso])
  );

  for (const [nombreRol, codigosPermisos] of Object.entries(permisosPorRol)) {
    const rol = rolesPorNombre.get(nombreRol);

    if (!rol) {
      throw new Error(`No existe el rol activo ${nombreRol}.`);
    }

    await prisma.roles_permisos.deleteMany({
      where: {
        rol_id: rol.id,
      },
    });

    await prisma.roles_permisos.createMany({
      data: codigosPermisos.map((codigoPermiso) => {
        const permiso = permisosPorCodigo.get(codigoPermiso);

        if (!permiso) {
          throw new Error(`No existe el permiso activo ${codigoPermiso}.`);
        }

        return {
          rol_id: rol.id,
          permiso_id: permiso.id,
        };
      }),
    });
  }
}

async function sincronizarLineasNegocioPorRol() {
  const roles = await prisma.roles.findMany({
    where: {
      nombre: {
        in: Object.keys(lineasNegocioPorRol),
      },
      activo: true,
    },
  });

  const rolesPorNombre = new Map(roles.map((rol) => [rol.nombre, rol]));

  for (const [nombreRol, lineasNegocio] of Object.entries(
    lineasNegocioPorRol
  )) {
    const rol = rolesPorNombre.get(nombreRol);

    if (!rol) {
      throw new Error(`No existe el rol activo ${nombreRol}.`);
    }

    await prisma.roles_lineas_negocio.deleteMany({
      where: {
        rol_id: rol.id,
      },
    });

    await prisma.roles_lineas_negocio.createMany({
      data: lineasNegocio.map((lineaNegocio) => ({
        rol_id: rol.id,
        linea_negocio: lineaNegocio,
      })),
    });
  }
}

async function crearOActualizarAdministrador() {
  const passwordHash = await bcrypt.hash("Admin123*", 10);

  const usuarioAdministrador = await prisma.usuarios.upsert({
    where: {
      correo: "admin@sistema-obras.local",
    },
    update: {
      tipo_documento: "CC",
      numero_documento: "1000000000",
      nombre: "Administrador Sistema",
      telefono: null,
      password_hash: passwordHash,
      estado: "ACTIVO",
    },
    create: {
      tipo_documento: "CC",
      numero_documento: "1000000000",
      nombre: "Administrador Sistema",
      correo: "admin@sistema-obras.local",
      telefono: null,
      password_hash: passwordHash,
      estado: "ACTIVO",
    },
  });

  const rolAdministrador = await prisma.roles.findUnique({
    where: {
      nombre: "ADMINISTRADOR",
    },
  });

  if (!rolAdministrador || !rolAdministrador.activo) {
    throw new Error("No existe el rol ADMINISTRADOR activo.");
  }

  await prisma.usuarios_roles.upsert({
    where: {
      usuario_id: usuarioAdministrador.id,
    },
    update: {
      rol_id: rolAdministrador.id,
    },
    create: {
      usuario_id: usuarioAdministrador.id,
      rol_id: rolAdministrador.id,
    },
  });
}

async function main() {
  await crearOActualizarRoles();
  await crearOActualizarPermisos();
  await sincronizarPermisosPorRol();
  await sincronizarLineasNegocioPorRol();
  await crearOActualizarAdministrador();

  console.log("Seed ejecutado correctamente.");
  console.log("Roles creados o actualizados.");
  console.log("Permisos asignados por rol.");
  console.log("Lineas de negocio asignadas por rol.");
  console.log("Usuario administrador creado o actualizado.");
}

main()
  .catch((error) => {
    console.error("Error ejecutando seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });