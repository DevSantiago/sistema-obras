import { cookies } from "next/headers";
import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import { consultarOperacionesEfectivoService } from "@/modules/operaciones-efectivo/operaciones-efectivo.service";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const autenticacion = await obtenerUsuarioAutenticado(
      cookieStore.get("session_token")?.value,
    );

    if (!autenticacion.body.ok || !autenticacion.body.data) {
      return Response.json(autenticacion.body, {
        status: autenticacion.status,
      });
    }

    const parametros = new URL(request.url).searchParams;
    const resultado = await consultarOperacionesEfectivoService(
      autenticacion.body.data.usuario,
      {
        proyecto_base_id:
          parametros.get("proyecto_base_id")?.trim() || undefined,
        fondo_id: parametros.get("fondo_id")?.trim() || undefined,
        fecha_desde:
          parametros.get("fecha_desde")?.trim() || undefined,
        fecha_hasta:
          parametros.get("fecha_hasta")?.trim() || undefined,
        solo_pendientes:
          parametros.get("solo_pendientes") === "true",
      },
    );

    return Response.json(resultado.body, {
      status: resultado.status,
    });
  } catch (error) {
    console.error("Error consultando operaciones de efectivo:", error);

    return Response.json(
      {
        ok: false,
        message: "No fue posible consultar las operaciones de efectivo.",
      },
      { status: 500 },
    );
  }
}
