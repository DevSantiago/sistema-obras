import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import { obtenerProyectoBasePorIdService } from "@/modules/proyectos-base/proyectos-base.service";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

async function obtenerUsuarioSesionDesdeCookie() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  return obtenerUsuarioAutenticado(sessionToken);
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const usuarioAutenticado = await obtenerUsuarioSesionDesdeCookie();

    if (!usuarioAutenticado.body.ok) {
      return NextResponse.json(usuarioAutenticado.body, {
        status: usuarioAutenticado.status,
      });
    }

    const { id } = await params;

    const proyectoBase = await obtenerProyectoBasePorIdService(id);

    return NextResponse.json({
      ok: true,
      message: "Proyecto base consultado correctamente.",
      data: proyectoBase,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Error al consultar proyecto base.";

    return NextResponse.json(
      {
        ok: false,
        message,
      },
      { status: 404 },
    );
  }
}