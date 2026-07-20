import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    const resultado = await obtenerUsuarioAutenticado(sessionToken);

    return Response.json(resultado.body, { status: resultado.status });
  } catch (error) {
    console.error("Error consultando usuario autenticado:", error);

    return Response.json(
      {
        ok: false,
        message: "Sesión inválida o expirada.",
      },
      { status: 401 }
    );
  }
}