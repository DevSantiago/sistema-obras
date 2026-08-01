import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import { anularSolicitudesPagoService } from "@/modules/solicitudes-pago/solicitudes-pago.service";
import type { AnularSolicitudesPagoInput } from "@/modules/solicitudes-pago/solicitudes-pago.types";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const autenticacion = await obtenerUsuarioAutenticado(
      cookieStore.get("session_token")?.value,
    );

    if (!autenticacion.body.ok || !autenticacion.body.data) {
      return Response.json(autenticacion.body, { status: autenticacion.status });
    }

    let body: AnularSolicitudesPagoInput;

    try {
      body = (await request.json()) as AnularSolicitudesPagoInput;
    } catch {
      return Response.json(
        { ok: false, message: "El cuerpo debe ser un JSON válido." },
        { status: 400 },
      );
    }

    const resultado = await anularSolicitudesPagoService(
      autenticacion.body.data.usuario,
      body,
    );

    return Response.json(resultado.body, { status: resultado.status });
  } catch (error) {
    console.error("Error anulando solicitudes de pago:", error);
    return Response.json(
      { ok: false, message: "No fue posible anular las solicitudes seleccionadas." },
      { status: 500 },
    );
  }
}
