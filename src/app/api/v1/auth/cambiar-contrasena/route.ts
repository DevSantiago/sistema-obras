import {
  cambiarContrasena,
  obtenerUsuarioAutenticado,
} from "@/modules/auth/auth.service";
import type { CambiarContrasenaInput } from "@/modules/auth/auth.types";
import { cookies } from "next/headers";

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const resultadoAutenticacion = await obtenerUsuarioAutenticado(
      cookieStore.get("session_token")?.value,
    );

    if (!resultadoAutenticacion.body.data?.usuario) {
      return Response.json(resultadoAutenticacion.body, {
        status: resultadoAutenticacion.status,
      });
    }

    let body: CambiarContrasenaInput;

    try {
      body = await request.json();
    } catch {
      return Response.json(
        {
          ok: false,
          message: "El cuerpo de la solicitud debe ser un JSON válido.",
        },
        { status: 400 },
      );
    }

    const resultado = await cambiarContrasena(
      resultadoAutenticacion.body.data.usuario,
      body,
    );

    return Response.json(resultado.body, { status: resultado.status });
  } catch (error) {
    console.error("Error cambiando contraseña:", error);

    return Response.json(
      {
        ok: false,
        message: "No fue posible cambiar la contraseña.",
      },
      { status: 500 },
    );
  }
}
