import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import { devolverSolicitudPagoService } from "@/modules/solicitudes-pago/solicitudes-pago.service";
import type { DevolverSolicitudPagoInput } from "@/modules/solicitudes-pago/solicitudes-pago.types";
import { cookies } from "next/headers";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
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

    let body: DevolverSolicitudPagoInput;

    try {
      body = (await request.json()) as DevolverSolicitudPagoInput;
    } catch {
      return Response.json(
        { ok: false, message: "El cuerpo debe ser un JSON válido." },
        { status: 400 },
      );
    }

    const { id } = await context.params;
    const resultado = await devolverSolicitudPagoService(
      autenticacion.body.data.usuario,
      id,
      body,
    );

    return Response.json(resultado.body, { status: resultado.status });
  } catch (error) {
    console.error("Error devolviendo solicitud de pago:", error);

    return Response.json(
      { ok: false, message: "No fue posible devolver la solicitud de pago." },
      { status: 500 },
    );
  }
}
