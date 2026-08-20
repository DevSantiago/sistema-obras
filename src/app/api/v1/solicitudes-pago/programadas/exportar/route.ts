import { cookies } from "next/headers";
import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import { generarRelacionSolicitudesProgramadasExcel } from "@/modules/solicitudes-pago/solicitudes-pago.excel";
import { listarBandejaPagosService } from "@/modules/solicitudes-pago/solicitudes-pago.service";

export const runtime = "nodejs";

export async function GET() {
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

    const resultado = await listarBandejaPagosService(
      autenticacion.body.data.usuario,
    );

    if (!resultado.body.ok || !resultado.body.data) {
      return Response.json(resultado.body, { status: resultado.status });
    }

    const contenido = await generarRelacionSolicitudesProgramadasExcel(
      resultado.body.data.solicitudes,
    );
    const fecha = new Date().toISOString().slice(0, 10);

    return new Response(new Uint8Array(contenido), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          `attachment; filename="solicitudes-programadas-${fecha}.xlsx"`,
        "Content-Length": String(contenido.byteLength),
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Error exportando solicitudes programadas:", error);

    return Response.json(
      { ok: false, message: "No fue posible generar la relación en Excel." },
      { status: 500 },
    );
  }
}
