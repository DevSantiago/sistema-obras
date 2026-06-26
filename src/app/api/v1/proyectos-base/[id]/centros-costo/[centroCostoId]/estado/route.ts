import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import { cambiarEstadoCentroCostoService } from "@/modules/proyectos-base/proyectos-base.service";

type RouteContext = {
  params: Promise<{
    id: string;
    centroCostoId: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    const usuarioAutenticado = await obtenerUsuarioAutenticado(sessionToken);
    const usuario = usuarioAutenticado.body.data?.usuario;

    if (!usuarioAutenticado.body.ok || !usuario) {
      return NextResponse.json(usuarioAutenticado.body, {
        status: usuarioAutenticado.status,
      });
    }

    if (!usuario.roles.includes("ADMINISTRADOR")) {
      return NextResponse.json(
        {
          ok: false,
          message: "No tiene permisos para cambiar estados de centros de costo.",
        },
        {
          status: 403,
        },
      );
    }

    const { id, centroCostoId } = await context.params;
    const body = await request.json();

    const proyectoBase = await cambiarEstadoCentroCostoService(
      id,
      centroCostoId,
      {
        estado_centro_costo: body.estado_centro_costo,
        observacion: body.observacion,
        usuario_id: usuario.id,
      },
    );

    return NextResponse.json(
      {
        ok: true,
        message: "Estado del centro de costo actualizado correctamente.",
        data: proyectoBase,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo cambiar el estado del centro de costo.";

    return NextResponse.json(
      {
        ok: false,
        message,
      },
      {
        status: 400,
      },
    );
  }
}