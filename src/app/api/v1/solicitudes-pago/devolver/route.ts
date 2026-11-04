import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import { devolverSolicitudesPagoService } from "@/modules/solicitudes-pago/solicitudes-pago.service";
import type { DevolverSolicitudesPagoInput } from "@/modules/solicitudes-pago/solicitudes-pago.types";
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

    let body: DevolverSolicitudesPagoInput;
    try {
      if (request.headers.get("content-type")?.includes("multipart/form-data")) {
        const formData = await request.formData();
        const datos = formData.get("datos");
        if (typeof datos !== "string") {
          return Response.json(
            { ok: false, message: "Faltan los datos de la devolución." },
            { status: 400 },
          );
        }
        body = JSON.parse(datos) as DevolverSolicitudesPagoInput;
        const archivos = formData.getAll("archivos");
        if (archivos.some((archivo) => !(archivo instanceof File))) {
          return Response.json(
            { ok: false, message: "Los adjuntos de la devolución no son válidos." },
            { status: 400 },
          );
        }
        body.archivos = archivos as File[];
      } else {
        body = (await request.json()) as DevolverSolicitudesPagoInput;
      }
    } catch {
      return Response.json(
        { ok: false, message: "El cuerpo debe ser un JSON válido." },
        { status: 400 },
      );
    }

    const resultado = await devolverSolicitudesPagoService(
      autenticacion.body.data.usuario,
      body,
    );

    return Response.json(resultado.body, { status: resultado.status });
  } catch (error) {
    console.error("Error devolviendo solicitudes de pago:", error);
    return Response.json(
      { ok: false, message: "No fue posible devolver las solicitudes seleccionadas." },
      { status: 500 },
    );
  }
}
