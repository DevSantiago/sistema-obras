import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import {
  actualizarBeneficiarioService,
  obtenerBeneficiarioPorIdService,
} from "@/modules/beneficiarios/beneficiarios.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function obtenerUsuarioSesionDesdeCookie() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  return obtenerUsuarioAutenticado(sessionToken);
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const usuarioAutenticado = await obtenerUsuarioSesionDesdeCookie();

    if (!usuarioAutenticado.body.ok || !usuarioAutenticado.body.data) {
      return NextResponse.json(usuarioAutenticado.body, {
        status: usuarioAutenticado.status,
      });
    }

    const beneficiario = await obtenerBeneficiarioPorIdService(
      usuarioAutenticado.body.data.usuario,
      id,
    );

    return NextResponse.json({
      ok: true,
      message: "Beneficiario consultado correctamente.",
      data: beneficiario,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al consultar beneficiario.";

    const status =
      message === "No autorizado."
        ? 403
        : message === "El beneficiario no existe."
          ? 404
          : 400;

    return NextResponse.json(
      {
        ok: false,
        message,
      },
      { status },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const usuarioAutenticado = await obtenerUsuarioSesionDesdeCookie();

    if (!usuarioAutenticado.body.ok || !usuarioAutenticado.body.data) {
      return NextResponse.json(usuarioAutenticado.body, {
        status: usuarioAutenticado.status,
      });
    }

    const body = await request.json();

    const beneficiario = await actualizarBeneficiarioService(
      usuarioAutenticado.body.data.usuario,
      id,
      body,
    );

    return NextResponse.json({
      ok: true,
      message: "Beneficiario actualizado correctamente.",
      data: beneficiario,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Error al actualizar beneficiario.";

    const status =
      message === "No autorizado."
        ? 403
        : message === "El beneficiario no existe."
          ? 404
          : 400;

    return NextResponse.json(
      {
        ok: false,
        message,
      },
      { status },
    );
  }
}