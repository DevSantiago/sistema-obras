import { cookies } from "next/headers";
import { obtenerUsuarioAutenticado } from "@/modules/auth/auth.service";
import { generarRelacionSolicitudesProgramadasExcel } from "@/modules/solicitudes-pago/solicitudes-pago.excel";
import { listarBandejaPagosService } from "@/modules/solicitudes-pago/solicitudes-pago.service";
import type {
  MedioPagoSolicitud,
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

    const proyectoBaseId = searchParams.get("proyecto_base_id")?.trim();
    const centroCostoId = searchParams.get("centro_costo_id")?.trim();
    const medioPago = searchParams.get("medio_pago")?.trim().toUpperCase() as
      | MedioPagoSolicitud
      | undefined;
    const busqueda = searchParams.get("busqueda")?.trim().toLocaleLowerCase("es");
    const numeroItemRaw = searchParams.get("numero_item")?.trim();
    const numeroItem = numeroItemRaw ? Number(numeroItemRaw) : undefined;
    if (medioPago && !["TRANSFERENCIA", "PSE", "PORTAL", "CONSIGNACION", "EFECTIVO"].includes(medioPago)) {
      return Response.json(
        { ok: false, message: "El medio de pago no es válido." },
        { status: 400 },
      );
    }
    if (
      numeroItemRaw &&
      (!Number.isInteger(numeroItem) || (numeroItem ?? 0) < 1)
    ) {
      return Response.json(
        { ok: false, message: "El número de ítem debe ser un entero positivo." },
        { status: 400 },
      );
    }

    const resultado = await listarBandejaPagosService(
      autenticacion.body.data.usuario,
      {},
    );

    if (!resultado.body.ok || !resultado.body.data) {
      return Response.json(resultado.body, { status: resultado.status });
    }

    const solicitudes = resultado.body.data.solicitudes.filter((solicitud) => {
      const beneficiario =
        solicitud.tipo_solicitud === "PAGO_PROVEEDOR"
          ? solicitud.proveedor?.nombre ?? solicitud.beneficiario?.nombre
          : solicitud.beneficiario?.nombre ?? solicitud.proveedor?.nombre;
      const textoBusqueda = [
        solicitud.numero_solicitud,
        solicitud.descripcion,
        beneficiario,
        solicitud.proyecto_base?.nombre,
        solicitud.centro_costo?.nombre,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("es");

      if (
        (proyectoBaseId && solicitud.proyecto_base_id !== proyectoBaseId) ||
        (centroCostoId && solicitud.centro_costo_id !== centroCostoId) ||
        (medioPago && solicitud.medio_pago !== medioPago) ||
        (busqueda && !textoBusqueda.includes(busqueda)) ||
        (numeroItem !== undefined && solicitud.numero_item !== numeroItem)
      ) {
        return false;
      }
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
