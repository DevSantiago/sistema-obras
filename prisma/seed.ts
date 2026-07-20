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
    descripcion: "Administra usuarios, roles y configuración general del sistema.",
  },
  {
    nombre: "SOLICITANTE",
    descripcion: "Crea y consulta sus propias solicitudes.",
  },
  {
    nombre: "AUXILIAR_CONTABLE",
    descripcion: "Apoya la revisión y gestión contable según permisos definidos.",
  },
  {
    nombre: "APROBADOR_1",
    descripcion: "Realiza la primera aprobación de solicitudes.",
  },
  {
    nombre: "APROBADOR_2",
    descripcion: "Realiza la segunda aprobación de solicitudes.",
  },
  {
    nombre: "PAGOS",
    descripcion: "Marca solicitudes como pagadas cuando corresponda.",
  },
  {
    nombre: "LECTURA",
    descripcion:
      "Consulta información autorizada sin crear, editar, aprobar, pagar ni eliminar.",
  },
];

async function main() {
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

  const passwordHash = await bcrypt.hash("Admin123*", 10);

  const usuarioAdministrador = await prisma.usuarios.upsert({
    where: {
      correo: "admin@sistema-obras.local",
    },
    update: {
      nombre: "Administrador Sistema",
      telefono: null,
      password_hash: passwordHash,
      estado: "ACTIVO",
    },
    create: {
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

  if (!rolAdministrador) {
    throw new Error("No existe el rol ADMINISTRADOR.");
  }

  await prisma.usuarios_roles.upsert({
    where: {
      usuario_id_rol_id: {
        usuario_id: usuarioAdministrador.id,
        rol_id: rolAdministrador.id,
      },
    },
    update: {},
    create: {
      usuario_id: usuarioAdministrador.id,
      rol_id: rolAdministrador.id,
    },
  });

  console.log("Seed ejecutado correctamente.");
  console.log("Roles base creados o actualizados.");
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