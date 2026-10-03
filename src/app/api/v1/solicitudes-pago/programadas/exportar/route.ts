import { cookies } from "next/headers";
import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import { generarRelacionSolicitudesProgramadasExcel } from "@/modules/solicitudes-pago/solicitudes-pago.excel";
import { listarBandejaPagosService } from "@/modules/solicitudes-pago/solicitudes-pago.service";
import type {
  MedioPagoSolicitud,
  SolicitudPagoListFilters,
} from "@/modules/solicitudes-pago/solicitudes-pago.types";

type TipoOperacionExportacion = "TODOS" | "TRANSFERENCIAS" | "RETIRO";

export const runtime = "nodejs";

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

    const { searchParams } = new URL(request.url);
    const tipoOperacionRaw = searchParams
      .get("tipo_operacion")
      ?.trim()
      .toUpperCase();
    if (
      tipoOperacionRaw &&
      !["TODOS", "TRANSFERENCIAS", "RETIRO"].includes(tipoOperacionRaw)
    ) {
      return Response.json(
        { ok: false, message: "El tipo de operación no es válido." },
        { status: 400 },
      );
    }
    const tipoOperacion = tipoOperacionRaw as TipoOperacionExportacion | undefined;

    const filtros: SolicitudPagoListFilters = {
      proyecto_base_id:
        searchParams.get("proyecto_base_id")?.trim() || undefined,
      centro_costo_id:
        searchParams.get("centro_costo_id")?.trim() || undefined,
      medio_pago: searchParams.get("medio_pago")?.trim().toUpperCase() as
        | MedioPagoSolicitud
        | undefined,
      busqueda: searchParams.get("busqueda")?.trim() || undefined,
    };
    const resultado = await listarBandejaPagosService(
      autenticacion.body.data.usuario,
      filtros,
    );

    if (!resultado.body.ok || !resultado.body.data) {
      return Response.json(resultado.body, { status: resultado.status });
    }

    const solicitudes = resultado.body.data.solicitudes.filter((solicitud) => {
      if (tipoOperacion === "TRANSFERENCIAS") {
        return ["TRANSFERENCIA", "PSE", "PORTAL"].includes(
          solicitud.medio_pago ?? "",
        );
      }
      if (tipoOperacion === "RETIRO") {
        return ["CONSIGNACION", "EFECTIVO"].includes(
          solicitud.medio_pago ?? "",
        );
      }
      return true;
    });
    const contenido = await generarRelacionSolicitudesProgramadasExcel(
      solicitudes,
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
