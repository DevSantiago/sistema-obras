import { iniciarSesion } from "@/modules/auth/auth.service";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    let body: { correo?: string; password?: string };

    try {
      body = await request.json();
    } catch {
      return Response.json(
        {
          ok: false,
          message: "El cuerpo de la solicitud debe ser un JSON válido.",
        },
        { status: 400 }
      );
    }

    const resultado = await iniciarSesion(body);

    if (resultado.body.data?.sessionToken) {
      const cookieStore = await cookies();

      cookieStore.set("session_token", resultado.body.data.sessionToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 8,
      });

      return Response.json(
        {
          ok: resultado.body.ok,
          message: resultado.body.message,
          data: {
            usuario: resultado.body.data.usuario,
          },
        },
        { status: resultado.status }
      );
    }

    return Response.json(resultado.body, { status: resultado.status });
  } catch (error) {
    console.error("Error en login:", error);

    return Response.json(
      {
        ok: false,
        message: "No fue posible iniciar sesión.",
      },
      { status: 500 }
    );
  }
}