import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import {
  crearUsuario,
  listarUsuarios,
} from "@/modules/usuarios/usuarios.service";
import type { CrearUsuarioInput } from "@/modules/usuarios/usuarios.types";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;
    const resultadoAutenticacion =
      await obtenerUsuarioAutenticado(sessionToken);

    if (!resultadoAutenticacion.body.ok || !resultadoAutenticacion.body.data) {
      return Response.json(resultadoAutenticacion.body, {
        status: resultadoAutenticacion.status,
      });
    }

    const resultado = await listarUsuarios(
      resultadoAutenticacion.body.data.usuario,
    );

    return Response.json(resultado.body, {
      status: resultado.status,
    });
  } catch (error) {
    console.error("Error listando usuarios:", error);

    return Response.json(
      {
        ok: false,
        message: "No fue posible consultar los usuarios.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;
    const resultadoAutenticacion =
      await obtenerUsuarioAutenticado(sessionToken);

    if (!resultadoAutenticacion.body.ok || !resultadoAutenticacion.body.data) {
      return Response.json(resultadoAutenticacion.body, {
        status: resultadoAutenticacion.status,
      });
    }

    let body: CrearUsuarioInput;

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

    const resultado = await crearUsuario(
      resultadoAutenticacion.body.data.usuario,
      body,
    );

    return Response.json(resultado.body, {
      status: resultado.status,
    });
  } catch (error) {
    console.error("Error creando usuario:", error);

    return Response.json(
      {
        ok: false,
        message: "No fue posible crear el usuario.",
      },
      { status: 500 },
    );
  }
}
