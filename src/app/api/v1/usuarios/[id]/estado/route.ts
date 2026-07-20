import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import { cambiarEstadoUsuario } from "@/modules/usuarios/usuarios.service";
import type { CambiarEstadoUsuarioInput } from "@/modules/usuarios/usuarios.types";
import { cookies } from "next/headers";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;
    const resultadoAutenticacion =
      await obtenerUsuarioAutenticado(sessionToken);

    if (!resultadoAutenticacion.body.ok || !resultadoAutenticacion.body.data) {
      return Response.json(resultadoAutenticacion.body, {
        status: resultadoAutenticacion.status,
      });
    }

    let body: CambiarEstadoUsuarioInput;

    try {
      body = await request.json();
    } catch {
      return Response.json(
        {
          ok: false,
          message: "El cuerpo de la solicitud debe ser JSON válido.",
        },
        { status: 400 },
      );
    }

    const resultado = await cambiarEstadoUsuario(
      resultadoAutenticacion.body.data.usuario,
      id,
      body,
    );

    return Response.json(resultado.body, {
      status: resultado.status,
    });
  } catch (error) {
    console.error("Error cambiando estado del usuario:", error);

    return Response.json(
      {
        ok: false,
        message: "No fue posible cambiar el estado del usuario.",
      },
      { status: 500 },
    );
  }
}
