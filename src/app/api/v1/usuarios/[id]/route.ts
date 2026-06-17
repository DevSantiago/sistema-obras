import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import { 
    obtenerUsuarioPorId,
    actualizarUsuario 
} from "@/modules/usuarios/usuarios.service";
import { cookies } from "next/headers";


export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    const resultadoAutenticacion = await obtenerUsuarioAutenticado(sessionToken);

    if (!resultadoAutenticacion.body.ok || !resultadoAutenticacion.body.data) {
      return Response.json(resultadoAutenticacion.body, {
        status: resultadoAutenticacion.status,
      });
    }

    let body: {
      nombre?: string;
      correo?: string;
      telefono?: string | null;
    };

    try {
      body = await request.json();
    } catch {
      return Response.json(
        {
          ok: false,
          message: "El cuerpo de la solicitud debe ser JSON válido.",
        },
        { status: 400 }
      );
    }

    const resultado = await actualizarUsuario(
      resultadoAutenticacion.body.data.usuario,
      id,
      body
    );

    return Response.json(resultado.body, {
      status: resultado.status,
    });
  } catch (error) {
    console.error("Error actualizando usuario:", error);

    return Response.json(
      {
        ok: false,
        message: "No fue posible actualizar el usuario.",
      },
      { status: 500 }
    );
  }
}

export async function GET(
    request: Request,
    context: { params: Promise <{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get("session_token")?.value;

        const resultadoAutenticacion = await obtenerUsuarioAutenticado(sessionToken);

        if (!resultadoAutenticacion.body.ok || !resultadoAutenticacion.body.data) {
            return Response.json(resultadoAutenticacion.body, {
                status: resultadoAutenticacion.status,
            });
        }

        const resultado = await obtenerUsuarioPorId(
            resultadoAutenticacion.body.data.usuario,
            id
        );

        return Response.json(resultado.body, {
            status: resultado.status,
        });
    } catch (error) {
        console.error("Error consultando usuario por id: ", error);
        return Response.json(
            {
                ok: false,
                message: "No fue posible consultar el usuario.",
            },
            { status: 500 }
        ); 
    }
}