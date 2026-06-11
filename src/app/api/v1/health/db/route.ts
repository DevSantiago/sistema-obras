import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return Response.json({
      ok: true,
      message: "Conexión a PostgreSQL correcta",
    });
  } catch (error) {
    console.error("Error de conexión a PostgreSQL:", error);

    return Response.json(
      {
        ok: false,
        message: "No fue posible conectar con PostgreSQL",
      },
      { status: 500 }
    );
  }
}